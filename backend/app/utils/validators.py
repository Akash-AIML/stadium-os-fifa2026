import re

FORBIDDEN_PATTERNS = [
    r"ignore\s+(?:previous|all)\s+instructions",
    r"reveal\s+(?:your|the)\s+(?:system\s+)?prompt",
    r"forget\s+(?:your|the)\s+(?:system\s+)?prompt",
    r"<script",
    r"<iframe",
    r"javascript:",
]

MAX_LENGTH = 500


def sanitize_message(message: str) -> str:
    stripped = message.strip()
    if not stripped:
        raise ValueError("Message cannot be empty")
    if len(stripped) > MAX_LENGTH:
        raise ValueError(f"Message exceeds maximum length of {MAX_LENGTH} characters")

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, stripped, re.IGNORECASE):
            raise ValueError("Message contains forbidden content")

    return re.sub(r"<[^>]*>", "", stripped)


def validate_seat_number(seat: str) -> str:
    seat = seat.strip()
    if not seat or len(seat) > 20:
        raise ValueError("Invalid seat number")
    pattern = r"^[A-Za-z0-9\-_ ]+$"
    if not re.match(pattern, seat):
        raise ValueError("Seat number contains invalid characters")
    return seat


def validate_zone_id(zone_id: str) -> str:
    zone_id = zone_id.strip()
    if not zone_id or not zone_id.isalnum():
        raise ValueError("Invalid zone ID")
    return zone_id


def validate_language(lang: str) -> str:
    valid = ["en", "es", "fr", "de", "pt", "ar", "ja", "zh", "ru", "ko"]
    lang = lang.strip().lower()
    if lang not in valid:
        return "en"
    return lang