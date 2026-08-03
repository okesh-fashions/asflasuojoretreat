# app/utils/extensions.py

import string
import secrets


def generate_QR(length=8):
    # Use uppercase letters and digits to make it readable and professional
    alphabet = string.ascii_uppercase + string.digits
    unique_part = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f"ATT-{unique_part}"
