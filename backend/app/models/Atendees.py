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
        unique=True,
        nullable=False
    )
    fullname = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(11), nullable=False)
    faculty = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(120), nullable=False)
    level = db.Column(db.String(120), nullable=False)
    qrcode = db.Column(db.String(120), unique=True, nullable=False, index=True)
    is_confirmed = db.Column(db.Boolean, nullable=False, default=False)
    registered_on = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )
    confirmed_on = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())"),
        onupdate=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "fullname": self.fullname,
            "phone": self.phone,
            "faculty": self.faculty,
            "department": self.department,
            "level": self.level,
            "qrcode": self.qrcode,
            "registered_on": self.registered_on
        }

