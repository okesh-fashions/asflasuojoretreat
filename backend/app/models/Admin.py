# app/models/Admin.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Admin(db.Model):
    __tablename__ = 'admins'

    # Configure ID as a true UUID string type
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,  # Generates a fresh UUID4 if none is provided
        unique=True,
        nullable=False
    )
    fullname = db.Column(db.String(250), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(11), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())"),
        onupdate=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )

    # Helper method to set hashed password
    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    # Helper method to verify password during login
    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": str(self.id),
            "fullname": self.fullname,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at
        }
