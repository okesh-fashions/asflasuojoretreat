# app/models/Attendees.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Attendees(db.Model):
    __tablename__ = 'attendees'

    # Configure ID as a true UUID string type
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,  # Generates a fresh UUID4 if none is provided
        # PostgreSQL-side safety fallback
        server_default=db.text("gen_random_uuid()"),
        unique=True,
        nullable=False
    )
    fullname = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(11), nullable=False)
    faculty = db.Column(db.String(120), nullable=True)
    department = db.Column(db.String(120), nullable=True)
    level = db.Column(db.String(3), nullable=True)
    qrcode = db.Column(db.String(12), unique=True, nullable=False, index=True)
    is_visitor = db.Column(db.Boolean, nullable=False, default=False)
    is_confirmed = db.Column(db.Boolean, nullable=False, default=False)
    registered_on = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )
    confirmed_on = db.Column(
        db.DateTime(timezone=True),
        server_onupdate=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "fullname": self.fullname,
            "phone": self.phone,
            "faculty": self.faculty if self.faculty else None,
            "department": self.department if self.department else None,
            "level": self.level if self.level else None,
            "qrcode": self.qrcode,
            "is_visitor": self.is_visitor,
            "is_confirmed": self.is_confirmed,
            "registered_on": self.registered_on.isoformat() if self.registered_on else None,
            "confirmed_on": self.confirmed_on.isoformat() if self.confirmed_on else None
        }
