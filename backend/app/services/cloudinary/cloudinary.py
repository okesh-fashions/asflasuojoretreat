# app/services/cloudinary/cloudinary.py

import cloudinary
import cloudinary.uploader
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def init_cloudinary(app):
    """Call this inside create_app() to register config."""
    cloudinary.config(
        cloud_name=app.config.get("CLOUD_NAME"),
        api_key=app.config.get("CLOUDINARY_API_KEY"),
        api_secret=app.config.get("CLOUDINARY_API_SECRET"),
        secure=True
    )


def upload_file_to_cloudinary(file_storage, folder="asflasuojo_retreat_receipts"):
    """
    Reusable upload helper for receipts.
    Accepts a Werkzeug FileStorage object (from request.files).
    """
    try:
        # resource_type="auto" handles images, raw PDFs, and receipts automatically
        upload_result = cloudinary.uploader.upload(
            file_storage,
            folder=folder,
            resource_type="auto",
            use_filename=True,
            unique_filename=True
        )
        return upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {str(e)}", exc_info=True)
        return None
