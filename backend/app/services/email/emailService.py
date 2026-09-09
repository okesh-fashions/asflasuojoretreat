# app/services/email/emailService.py

import requests
import os
import logging

logger = logging.getLogger(__name__)

BRIDGE_URL = os.getenv("GOOGLE_BRIDGE_URL")

def send_registration_confirmation(to_email: str, fullname: str, qrcode: str) -> bool:
    """
    Sends registration confirmation email containing the attendee QR Code.
    """
    if not to_email or not BRIDGE_URL:
        logger.warning("Email or BRIDGE_URL missing. Skipping email execution.")
        return False

    subject = "Registration Confirmed - ASF LASU OJO RETREAT"
    
    payload = {
        "to": to_email,
        "subject": subject,
        "fullname": fullname,
        "qrcode": qrcode
    }

    try:
        logger.info(f"Sending email to {to_email} via bridge: {BRIDGE_URL}")
        response = requests.post(
            BRIDGE_URL, 
            json=payload, 
            timeout=30,
            allow_redirects=True  # This is the key fix!
        )
        
        # Log full response for debugging
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response body: {response.text}")
        
        # Check if response indicates success (starts with ✅)
        if response.status_code == 200 and response.text.startswith('✅'):
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        # Check if response indicates error (starts with ❌)
        elif response.status_code == 200 and response.text.startswith('❌'):
            logger.error(f"❌ Google Bridge returned error: {response.text}")
            return False
            
        # Check if response is HTML (indicates deployment issue)
        elif response.text.strip().startswith('<!DOCTYPE'):
            logger.error(f"Google Bridge returned HTML. The deployment URL is wrong or the script isn't deployed properly.")
            logger.error(f"Response preview: {response.text[:200]}")
            return False
            
        else:
            logger.error(f"Unexpected response from Google Bridge: {response.text}")
            return False

    except requests.exceptions.Timeout:
        logger.error(f"Timeout while calling Google Bridge for {to_email}")
        return False
    except requests.exceptions.TooManyRedirects:
        logger.error(f"Too many redirects for Google Bridge URL: {BRIDGE_URL}")
        return False
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {to_email}: {e}")
        return False
