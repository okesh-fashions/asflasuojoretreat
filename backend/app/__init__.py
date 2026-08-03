# app/__init__.py

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.errors import RateLimitExceeded
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager  # Import it
from app.config.config import DevelopmentConfig, ProductionConfig  # Import the class
from werkzeug.exceptions import MethodNotAllowed, NotFound

# Import Scheduler Extensions
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
import os
import pytz
import atexit

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=['200 per day', '50 per hour']
)

# Declare scheduler globally so other modules can import or view it
scheduler = BackgroundScheduler(
    executors={'default': ThreadPoolExecutor(5)},
    job_defaults={'coalesce': True, 'max_instances': 1},
    timezone=pytz.timezone("Africa/Lagos")
)


def create_app():
    app = Flask(__name__)

    # Dynamically select which config class to pull depending on environment state
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Force load models into the application context for migrations
    from app.models.TokenBlocklist import TokenBlocklist
    from app.models.Admin import Admin
    from app.models.Attendees import Attendees

    # Blueprints
    from app.api.health.routes import health_bp
    from app.api.auth.routes import auth_bp
    from app.api.attendees.routes import attendees_bp

    app.register_blueprint(health_bp, url_prefix='/api/v1/health')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(attendees_bp, url_prefix='/api/v1/attendees')

    # ====================================================================
    # INITIALIZE BACKGROUND SCHEDULER
    # ====================================================================
    # Prevents Werkzeug's reload thread from spinning up a second duplicate scheduler instance
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        # Import your job function safely inside factory to prevent circular reference cycles
        from app.services.scheduler.apscheduler import continuous_ping

        # Setup jobs
        scheduler.add_job(
            id='ping_server',
            func=continuous_ping,
            trigger='interval',
            minutes=10,
            replace_existing=True
        )

        # CHECK IF THE SCHEDULER IS ALREADY RUNNING FIRST
        if not scheduler.running:
            scheduler.start()
            atexit.register(lambda: scheduler.shutdown())
            print("Scheduler started with Africa/Lagos time tracking.")
        else:
            print("Scheduler already active, skipping initialization.")

    # ====================================================================
    # GLOBAL API ERROR HANDLERS (Registered directly on the active 'app')
    # ====================================================================

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_exceeded(e):
        return jsonify({
            "status": "ERROR",
            "code": 429,
            "message": f"Rate Limit Exceeded! Slow down. Allowed limit: {e.description}."
        }), 429

    @app.errorhandler(MethodNotAllowed)
    def handle_method_not_allowed(e):
        return jsonify({
            "status": "ERROR",
            "code": 405,
            "message": "The HTTP method used is not allowed for this endpoint."
        }), 405

    @app.errorhandler(NotFound)
    def handle_not_found(e):
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": "The requested URL or resource was not found on this server."
        }), 404

    return app


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    # Import the model here to avoid circular imports
    from app.models.TokenBlocklist import TokenBlocklist
    jti = jwt_payload["jti"]

    token = db.session.execute(
        db.select(TokenBlocklist).filter_by(jti=jti)
    ).scalar_one_or_none()

    # If token is found in the blocklist table, returns True (Access Denied)
    # If token is NOT found, returns False (Access Granted)
    return token is not None
