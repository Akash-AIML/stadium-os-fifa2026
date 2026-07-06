from app.models import IntentType

NAVIGATION_WORDS = {"gate", "seat", "route", "navigate", "how to get", "direction", "find", "locate", "go to"}
CROWD_WORDS = {"crowd", "busy", "queue", "wait", "congestion", "full", "empty", "status"}
RECOMMENDATION_WORDS = {"food", "eat", "restroom", "bathroom", "toilet", "wc", "water", "drink", "snack", "exit", "leave", "medical", "first aid"}

def detect_intent(message: str) -> IntentType:
    msg = message.lower()

    if any(word in msg for word in NAVIGATION_WORDS):
        return IntentType.NAVIGATION

    if any(word in msg for word in CROWD_WORDS):
        return IntentType.CROWD_STATUS

    if any(word in msg for word in RECOMMENDATION_WORDS):
        return IntentType.RECOMMENDATION

    return IntentType.GENERAL