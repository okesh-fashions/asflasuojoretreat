# app/services/email/tasks.py

import threading
import logging
import time  # Add this import
from flask import current_app
from app.services.email.emailService import send_registration_confirmation

logger = logging.getLogger(__name__)

def trigger_registration_confirmation_async(to_email: str, fullname: str, qrcode: str):
    app = current_app._get_current_object()

    def _run():
        with app.app_context():
            retries = 0
            while retries < 3:
                if not send_registration_confirmation(to_email, fullname, qrcode):
                    logger.error(f"Error sending registration confirmation email to {to_email}. Retrying in 5 seconds... (Attempt {retries + 1}/3)")
                    time.sleep(5)
                    retries += 1
                else:
                    logger.info(f"✅ Registration confirmation email sent successfully to {to_email}")
                    break  # Exit the loop if email is sent successfully
            
            if retries >= 3:
                logger.error(f"❌ Failed to send registration confirmation email to {to_email} after 3 attempts")

    threading.Thread(target=_run, daemon=True).start()