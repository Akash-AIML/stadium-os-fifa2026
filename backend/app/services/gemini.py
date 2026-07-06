import time
from datetime import datetime
from app.config import settings
from app.models import IntentType, CrowdSnapshot, Alert, Route
from app.utils.exceptions import AiServiceError

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = None
        if GENAI_AVAILABLE and self.api_key and self.api_key != "your_api_key_here":
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(settings.model_name)

    def generate_response(
        self,
        intent: IntentType,
        context_data: list[CrowdSnapshot],
        user_message: str,
        language: str,
        alerts: list[Alert],
        route: Route | None,
    ) -> dict:
        start_time = time.time()
        is_fallback = False
        confidence = 0.0
        prompt_tokens = 0

        try:
            if self.model and GENAI_AVAILABLE:
                prompt = self._build_prompt(intent, context_data, user_message, language, alerts, route)
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                confidence = 0.85
                prompt_tokens = len(prompt) // 4
            else:
                text = self._generate_fallback_response(intent, context_data, user_message, language, alerts, route)
                is_fallback = True
                confidence = 0.6

        except Exception as e:
            text = self._generate_fallback_response(intent, context_data, user_message, language, alerts, route)
            is_fallback = True
            confidence = 0.5

        response_time = (time.time() - start_time) * 1000

        return {
            "text": text,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_fallback": is_fallback,
            "response_time": round(response_time, 2),
            "confidence": confidence,
            "prompt_tokens": prompt_tokens,
        }

    def _build_prompt(
        self,
        intent: IntentType,
        context_data: list[CrowdSnapshot],
        user_message: str,
        language: str,
        alerts: list[Alert],
        route: Route | None,
    ) -> str:
        prompt = f"""You are FIFA SmartGuide, a helpful AI assistant for football fans at the 2026 World Cup.
Respond in {language} language. Be concise, friendly, and helpful.

CURRENT STADIUM STATUS:
"""
        for snapshot in context_data[:5]:
            prompt += f"- {snapshot.zone_id.replace('_', ' ').title()}: {snapshot.status.value} (density: {snapshot.density:.0%}, queue: {snapshot.queue_time}min)\n"

        if alerts:
            prompt += "\nACTIVE ALERTS:\n"
            for alert in alerts[:3]:
                prompt += f"- [{alert.level.upper()}] {alert.message}\n"

        if route:
            prompt += f"\nRECOMMENDED ROUTE: {' → '.join(route.path)}\nEstimated time: {route.estimated_time}min\nCrowd level: {route.crowd_level:.0%}\nReason: {route.rationale}\n"

        prompt += f"\nUSER QUESTION: {user_message}\n\nProvide a helpful response based on the real-time data above. If data is unavailable, say so honestly."

        return prompt

    def _generate_fallback_response(
        self,
        intent: IntentType,
        context_data: list[CrowdSnapshot],
        user_message: str,
        language: str,
        alerts: list[Alert],
        route: Route | None,
    ) -> str:
        if intent == IntentType.NAVIGATION and route:
            return f"Route found: {' → '.join(route.path)}. Estimated time: {route.estimated_time} minutes. {route.rationale}"

        if intent == IntentType.CROWD_STATUS:
            busy_zones = [c for c in context_data if c.status in [ZoneStatus.BUSY, ZoneStatus.CONGESTED]]
            if busy_zones:
                return f"Currently busy: {', '.join([z.zone_id.replace('_', ' ') for z in busy_zones[:3]])}. Consider avoiding these areas."
            return "Stadium conditions are generally clear. Enjoy the match!"

        if intent == IntentType.RECOMMENDATION:
            food_zones = [c for c in context_data if "food" in c.zone_id]
            if food_zones:
                best = min(food_zones, key=lambda x: x.density)
                return f"Recommend {best.zone_id.replace('_', ' ')} - currently least crowded with {best.queue_time}min wait."

        return f"I understand you're asking: '{user_message}'. I'm currently in limited mode. For full assistance, please ensure AI services are available."


gemini_client = GeminiClient()


from app.models import ZoneStatus