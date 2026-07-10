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


def strip_html(text: str) -> str:
    """
    Recursively strips HTML tags from a string using pattern matching
    to prevent XSS and tag injection bypasses.
    """
    clean = text
    while True:
        next_clean = re.sub(r"</?[a-zA-Z0-9]+[^>]*>", "", clean)
        if next_clean == clean:
            break
        clean = next_clean
    return clean


def sanitize_message(message: str) -> str:
    """
    Validates message existence, length, forbidden system prompt injection patterns,
    and strips HTML tags from the query.
    """
    stripped = message.strip()
    if not stripped:
        raise ValueError("Message cannot be empty")
    if len(stripped) > MAX_LENGTH:
        raise ValueError(f"Message exceeds maximum length of {MAX_LENGTH} characters")

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, stripped, re.IGNORECASE):
            raise ValueError("Message contains forbidden content")

    return strip_html(stripped)


def validate_seat_number(seat: str) -> str:
    """
    Sanitizes and checks if the given seat ID conforms to alphanumeric/dash format.
    """
    seat = seat.strip()
    if not seat or len(seat) > 20:
        raise ValueError("Invalid seat number")
    pattern = r"^[A-Za-z0-9\-_ ]+$"
    if not re.match(pattern, seat):
        raise ValueError("Seat number contains invalid characters")
    return seat


def validate_zone_id(zone_id: str) -> str:
    """
    Sanitizes and verifies that the zone identifier is alphanumeric.
    """
    zone_id = zone_id.strip()
    if not zone_id or not zone_id.replace("_", "").isalnum():
        raise ValueError("Invalid zone ID")
    return zone_id


def validate_language(lang: str) -> str:
    """
    Verifies the requested locale against supported natural languages (including Hindi and Tamil).
    Defaults to English ('en') if unsupported.
    """
    valid = ["en", "es", "fr", "de", "pt", "ar", "ja", "zh", "ru", "ko", "hi", "ta"]
    lang = lang.strip().lower()
    if lang not in valid:
        return "en"
    return lang