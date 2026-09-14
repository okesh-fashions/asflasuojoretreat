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
        logger.warning(
            "Email or BRIDGE_URL missing. Skipping email execution.")
        return False

    subject = "Registration Confirmed - ASF LASU OJO RETREAT"

    htmlBody = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            .calendar-btn {{
                display: inline-block;
                background-color: #4285f4;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 25px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 14px;
                margin: 10px 0 20px 0;
                border: none;
                cursor: pointer;
                transition: background-color 0.3s;
            }}
            .calendar-btn:hover {{
                background-color: #3367d6;
            }}
            .calendar-btn img {{
                vertical-align: middle;
                margin-right: 8px;
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="padding: 30px 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 2px solid #5b1e2e; border-radius: 12px; overflow: hidden;">
                        <tr>
                            <td align="center" style="background-color: #5b1e2e; padding: 20px; color: #ffffff;">
                                <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">ASF LASU OJO RETREAT</h2>
                                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Registration Confirmation</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px 20px; text-align: center;">
                                <!-- Add to Calendar Button -->
                                <div style="margin-bottom: 20px;">
                                    <a href="#" onclick="alert('Please download the attached .ics file and open it to add to your calendar.')" class="calendar-btn" style="background-color: #4285f4; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                                        Add to Calendar
                                    </a>
                                    <p style="color: #6b7280; font-size: 11px; margin-top: 5px;">
                                        Event: 13th - 15th November, 2026 </br> Click the attached .ics file to add to your calendar
                                    </p>
                                </div>

                                <h3 style="color: #2b0d18; margin-top: 0;">Welcome, {fullname}!</h3>
                                <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
                                    Your registration has been successfully recieved. Below is your official Retreat Access Pass.
                                </p>

                                <!-- Event Details -->
                                <div style="background-color: #f8f5f6; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #5b1e2e; text-align: left;">
                                    <p style="margin: 5px 0; color: #2b0d18; font-size: 13px;">
                                        <strong>Date:</strong> 13th - 15th November, 2026
                                    </p>
                                    <p style="margin: 5px 0; color: #2b0d18; font-size: 13px;">
                                        <strong>Venue:</strong> Living Faith Anglican Church, Agboroko, Lagos, Nigeria
                                    </p>
                                    <p style="margin: 5px 0; color: #2b0d18; font-size: 13px;">
                                        <strong>⏰ Time:</strong> 10:00 AM
                                    </p>
                                </div>

                                <!-- QR Card Frame -->
                                <div style="border: 1px dashed #7c2a3a; border-radius: 8px; padding: 15px; background-color: #fffafb; display: inline-block;">
                                    <p style="color: #5b1e2e; font-weight: bold; font-size: 13px; margin: 0 0 10px 0;">ATT ID: {qrcode}</p>
                                    
                                    <!-- Embedded Inline QR Code -->
                                    <img src="cid:qrImageCid" alt="Event QR Code" width="200" height="200" style="display: block; margin: 0 auto; border: none;" />

                                    <p style="color: #5b1e2e; font-size: 10px; margin: 10px 0 0 0; font-style: italic;">
                                        ASF Arise...Shine! </br> ASF...Restoring the Ancient Landmark!
                                    </p>
                                </div>

                                <p style="color: #6b7280; font-size: 13px; margin-top: 25px;">
                                    Please keep this QR code handy. Present it at the secretariat desk for entry. You can also download the attached image to your phone.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="background-color: #f9fafb; padding: 15px; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                                    ASF LASU OJO • Organising Team
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    payload = {
        "to": to_email,
        "subject": subject,
        "fullname": fullname,
        "qrcode": qrcode,
        "htmlBody": htmlBody
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
            logger.error(
                f"Google Bridge returned HTML. The deployment URL is wrong or the script isn't deployed properly.")
            logger.error(f"Response preview: {response.text[:200]}")
            return False

        else:
            logger.error(
                f"Unexpected response from Google Bridge: {response.text}")
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
