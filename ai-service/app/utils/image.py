def validate_image_format(mimetype: str) -> bool:
    allowed = ["image/jpeg", "image/png", "image/webp"]
    return mimetype in allowed

def resize_image_for_inference(image_bytes: bytes, target_size: tuple = (224, 224)):
    # Placeholder for actual OpenCV/PIL resizing
    pass
