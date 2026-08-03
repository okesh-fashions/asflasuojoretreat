# app/api/register/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Attendees import Attendees
from app.utils.extensions import generate_QR
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import jwt_required
import logging


logger = logging.getLogger(__name__)
attendees_bp = Blueprint("attendees", __name__)


# api/v1/attendees/register
@attendees_bp.route("/register", methods=["POST"])
@limiter.limit('20 per minute')
def attendee_register_endpoint():
    data = request.get_json() or {}

    # 1. Base validation for EVERYone
    base_required = ['fullname', 'phone']
    if not all(data.get(field) for field in base_required):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required fields: fullname and phone are mandatory",
            "code": 400
        }), 400

    # 2. Extract and clean phone configuration
    phone = str(data.get('phone', '')).strip()
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({
            "status": "ERROR",
            "message": "Phone number must be exactly 11 digits",
            "code": 400
        }), 400

    # 3. FIXED: Conditional validation based on visitor status
    is_visitor = bool(data.get('is_visitor', False))

    if not is_visitor:
        # Students must provide academic fields
        student_required = ['faculty', 'department', 'level']
        if not all(data.get(field) for field in student_required):
            return jsonify({
                "status": "ERROR",
                "message": "Students must provide faculty, department, and level",
                "code": 400
            }), 400

    # 4. Generate unique asset strings safely
    qr_code_string = generate_QR()

    # 5. Build record based on sanitized data inputs
    if is_visitor:
        new_attendee = Attendees(
            fullname=data['fullname'].strip(),
            phone=phone,
            qrcode=qr_code_string,
            is_visitor=True
        )
    else:
        new_attendee = Attendees(
            fullname=data['fullname'].strip(),
            phone=phone,
            faculty=data['faculty'].strip(),
            department=data['department'].strip(),
            level=str(data['level']).strip(),
            qrcode=qr_code_string,
            is_visitor=False
        )

    try:
        db.session.add(new_attendee)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "attendee": new_attendee.to_dict(),
            "message": "Attendee registered successfully!",
            "code": 201
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        # Check if the unique constraint failed for phone or QR code
        err_msg = str(e.orig)
        if "qrcode" in err_msg:
            message = "System generated a duplicate ticket code. Please try again."
        else:
            message = "A record duplicate conflict occurred."

        return jsonify({
            "status": "ERROR",
            "message": message,
            "code": 409
        }), 409

    except Exception as e:
        db.session.rollback()
        # Log the actual raw error on your Kubuntu server logs securely
        logger.error(f"Registration crash: {str(e)}", exc_info=True)
        return jsonify({
            "status": "ERROR",
            "message": "An internal system error occurred. Please try again later.",
            "code": 500
        }), 500


# api/v1/attendees
@attendees_bp.route("", methods=["GET"])
@limiter.limit('15 per minute')
@jwt_required()
def get_attendees_endpoint():
    # Modern SQLAlchemy 2.0 select query execution syntax
    attendees = db.session.execute(db.select(Attendees)).scalars().all()

    attendees_list = [
        attendee.to_dict() for attendee in attendees
    ]

    return jsonify({
        "status": "SUCCESS",
        "message": "Retrieved all attendees successfully!",
        "attendees": attendees_list,
        "code": 200
    }), 200


# api/v1/attendees/confirm
@attendees_bp.route("/confirm", methods=["POST"])
@limiter.limit('30 per minute')
@jwt_required()
def confirm_attendee_endpoint():
    data = request.get_json() or {}

    # 1. Base validation for EVERYone
    base_required = ['qrcode']
    if not all(data.get(field) for field in base_required):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required field: qrcode is mandatory",
            "code": 400
        }), 400

    attendee = db.session.execute(
        db.select(Attendees).where(Attendees.qrcode == data['qrcode'].strip())
    ).scalar_one_or_none()

    if attendee is None:
        return jsonify({
            "status": "ERROR",
            "message": "No attendee found with the provided QR code",
            "code": 404
        }), 404

    if attendee.is_confirmed:
        return jsonify({
            "status": "ERROR",
            "message": "This attendee has already been confirmed",
            "code": 409
        }), 409

    # Mark the attendee as confirmed
    attendee.is_confirmed = True

    try:
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "data": attendee.to_dict(),
            "code": 200,
            "message": "Attendee confirmed successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        # Log the actual raw error on your Kubuntu server logs securely
        logger.error(f"Confirmation crash: {str(e)}", exc_info=True)
        return jsonify({
            "status": "ERROR",
            "message": "An internal system error occurred. Please try again later.",
            "code": 500
        }), 500
