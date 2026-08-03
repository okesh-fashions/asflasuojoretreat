# app/api/auth/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.TokenBlocklist import TokenBlocklist
from app.models.Admin import Admin
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt, get_jwt_identity
from dotenv import load_dotenv
import os

load_dotenv()

auth_bp = Blueprint("auth", __name__)


# api/v1/auth/register
@auth_bp.route("/register", methods=["POST"])
@limiter.limit('15 per minute')
def register_endpoint():
    data = request.get_json() or {}
    ADMIN_ID = os.getenv('ADMIN_ID')

    # Strict dictionary presence validation (replaces old unsafe all() evaluation)
    required_fields = ['admin_id', 'fullname', 'email', 'phone', 'password']
    if not all(data.get(field) for field in required_fields):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required fields",
            "code": 400
        }), 400

    admin_id = data.get('admin_id', '').strip()
    if admin_id != ADMIN_ID:
        return jsonify({
            "status": "ERROR",
            "code": 401,
            "message": "Invalid ADMIN_ID. You can't create an account."
        }), 401

    # Phone normalization verification
    phone = str(data.get('phone', '')).strip()
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({
            "status": "ERROR",
            "message": "Phone number must be exactly 11 digits",
            "code": 400
        }), 400

    # Check email uniqueness before executing heavy operations
    if db.session.execute(db.select(Admin).filter_by(email=data['email'])).scalar_one_or_none():
        return jsonify({
            "status": "ERROR",
            "message": "Email already registered",
            "code": 409
        }), 409

    new_admin = Admin(
        fullname=data['fullname'],
        email=data['email'],
        phone=phone
    )
    new_admin.set_password(data['password'])

    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({
            "status": "CREATED",
            "teacher": new_admin.to_dict(),
            "message": "Admin registered successfully!",
            "code": 201
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"A database error occurred during registration: {str(e)}",
            "code": 500
        }), 500


# api/v1/auth/login
@auth_bp.route("/login", methods=["POST"])
@limiter.limit('10 per minute')
def login_endpoint():
    data = request.get_json() or {}

    if not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required fields",
            "code": 400
        }), 400

    # Modern SQLAlchemy 2.0 select query execution syntax
    admin = db.session.execute(db.select(Admin).filter_by(
        email=data['email'])).scalar_one_or_none()

    if not admin or not admin.check_password(data['password']):
        return jsonify({
            "status": "ERROR",
            "code": 401,
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(identity=str(admin.id))
    refresh_token = create_refresh_token(identity=str(admin.id))

    return jsonify({
        "status": "SUCCESS",
        "message": "Login successful!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "admin": admin.to_dict(),
        "code": 200
    }), 200


# api/v1/auth/profile
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile_endpoint():
    current_admin_id = get_jwt_identity()

    # Modern execution replacement for deprecated .query.get()
    admin = db.session.get(Admin, current_admin_id)

    if not admin:
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": "Admin not found"
        }), 404

    return jsonify({
        "status": "SUCCESS",
        "data": admin.to_dict(),
        "code": 200,
        "message": "Profile data retrieved successfully"
    }), 200


# api/v1/auth/logout
@auth_bp.route("/logout", methods=['POST'])
@jwt_required()  # Protects via Access Token
def logout_endpoint():
    # 1. Revoke the active Access Token (from Header)
    access_claims = get_jwt()
    access_jti = access_claims['jti']
    db.session.add(TokenBlocklist(jti=access_jti))

    # 2. Grab Refresh Token from custom header
    refresh_token = request.headers.get("X-Refresh-Token")

    if refresh_token:
        from flask_jwt_extended import decode_token
        try:
            # Safely decode the token claims without verifying signatures again
            refresh_claims = decode_token(refresh_token)
            refresh_jti = refresh_claims.get('jti')

            # Double check that it actually is a refresh token type
            if refresh_claims.get('type') == 'refresh' and refresh_jti:
                db.session.add(TokenBlocklist(jti=refresh_jti))
        except Exception:
            # If token is completely malformed or corrupted, skip silently
            pass

    db.session.commit()

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Logged out successfully. All session tokens have been permanently revoked."
    }), 200


# api/v1/auth/refresh
@auth_bp.route("/refresh", methods=['POST'])
@jwt_required(refresh=True)
def refresh_endpoint():
    current_admin_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_admin_id)
    return jsonify({
        "status": "SUCCESS",
        "access_token": new_access_token
    }), 200
