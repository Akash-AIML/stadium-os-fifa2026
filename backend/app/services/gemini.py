import time
from datetime import datetime
from app.config import settings
from app.models import IntentType, CrowdSnapshot, Alert, Route
from app.utils.exceptions import AiServiceError
from app.models import ZoneStatus

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# ── Fallback Translation Dictionaries for Offline/Mock mode ─────────────────
FALLBACK_TRANSLATIONS = {
    "en": {
        "route_found": "Route found: {path}. Estimated time: {time} minutes. {rationale}",
        "busy_zones": "Currently busy: {zones}. Consider avoiding these areas.",
        "clear_zones": "Stadium conditions are generally clear. Enjoy the match!",
        "recommend_food": "Recommend {zone} - currently least crowded with {time}min wait.",
        "limited_mode": "I understand you're asking: '{message}'. I'm currently in limited mode. For full assistance, please ensure AI services are available."
    },
    "es": {
        "route_found": "Ruta encontrada: {path}. Tiempo estimado: {time} minutos. {rationale}",
        "busy_zones": "Actualmente concurrido: {zones}. Considere evitar estas áreas.",
        "clear_zones": "Las condiciones del estadio son geralmente despejadas. ¡Disfruta el partido!",
        "recommend_food": "Recomendar {zone} - actualmente menos concurrido con {time} min de espera.",
        "limited_mode": "Entiendo que preguntas: '{message}'. Actualmente estoy en modo limitado. Para asistencia completa, asegúrese de que los servicios de IA estén disponibles."
    },
    "fr": {
        "route_found": "Itinéraire trouvé: {path}. Temps estimé: {time} minutes. {rationale}",
        "busy_zones": "Actuellement occupé: {zones}. Pensez à éviter ces zones.",
        "clear_zones": "Les conditions du stade sont généralement calmes. Bon match !",
        "recommend_food": "Recommander {zone} - actuellement moins fréquenté avec {time} min d'attente.",
        "limited_mode": "Je comprends que vous demandez : '{message}'. Je suis actuellement en mode limité. Pour une assistance complète, assure-vous que les services d'IA sont disponibles."
    },
    "hi": {
        "route_found": "मार्ग मिला: {path}। अनुमानित समय: {time} मिनट। {rationale}",
        "busy_zones": "वर्तमान में व्यस्त क्षेत्र: {zones}। इन क्षेत्रों में जाने से बचें।",
        "clear_zones": "स्टेडियम की स्थिति सामान्य रूप से साफ है। मैच का आनंद लें!",
        "recommend_food": "{zone} की सिफारिश करें - वर्तमान में {time} मिनट की प्रतीक्षा के साथ सबसे कम भीड़ है।",
        "limited_mode": "मैं समझता हूँ कि आप पूछ रहे हैं: '{message}'। मैं वर्तमान में सीमित मोड में हूँ। पूरी सहायता के लिए, कृपया सुनिश्चित करें कि एआई सेवाएं उपलब्ध हैं।"
    },
    "ta": {
        "route_found": "பாதை கண்டறியப்பட்டது: {path}. மதிப்பிடப்பட்ட நேரம்: {time} நிமிடங்கள். {rationale}",
        "busy_zones": "தற்போது பரபரப்பான பகுதிகள்: {zones}. இந்த பகுதிகளைத் தவிர்ப்பதைக் கருத்தில் கொள்ளுங்கள்.",
        "clear_zones": "மைதானத்தின் நிலைமைகள் பொதுவாக தெளிவாக உள்ளன. போட்டியை அனுபவிக்கவும்!",
        "recommend_food": "{zone} பரிந்துரைக்கவும் - தற்போது {time} நிமிட காத்திருப்புடன் மிகக் குறைந்த கூட்ட நெரிசல் உள்ளது.",
        "limited_mode": "நீங்கள் கேட்கிறீர்கள் என்று எனக்குப் புரிகிறது: '{message}'. நான் தற்போது வரையறுக்கப்பட்ட பயன்முறையில் உள்ளேன். முழு உதவிக்கு, AI சேவைகள் கிடைப்பதை உறுதிசெய்யவும்."
    },
    "de": {
        "route_found": "Route gefunden: {path}. Geschätzte Zeit: {time} Minuten. {rationale}",
        "busy_zones": "Aktuell viel los in: {zones}. Vermeiden Sie diese Bereiche nach Möglichkeit.",
        "clear_zones": "Die Bedingungen im Stadion sind im Allgemeinen frei. Genießen Sie das Spiel!",
        "recommend_food": "Empfehle {zone} - derzeit am wenigsten überfüllt mit {time} Min. Wartezeit.",
        "limited_mode": "Ich verstehe, dass Sie fragen: '{message}'. Ich befinde mich derzeit im eingeschränkten Modus. Für die volle Unterstützung stellen Sie bitte sicher, dass die KI-Dienste verfügbar sind."
    },
    "pt": {
        "route_found": "Rota encontrada: {path}. Tempo estimado: {time} minutos. {rationale}",
        "busy_zones": "Atualmente movimentado: {zones}. Considere evitar estas áreas.",
        "clear_zones": "As condições do estádio estão geralmente limpas. Aproveite a partida!",
        "recommend_food": "Recomendar {zone} - atualmente menos cheio com {time} min de espera.",
        "limited_mode": "Compreendo que está a perguntar: '{message}'. Atualmente, estou em modo limitado. Para assistência completa, certifique-se de que os serviços de IA estão disponíveis."
    },
    "ar": {
        "route_found": "تم العثور على المسار: {path}. الوقت المقدر: {time} دقيقة. {rationale}",
        "busy_zones": "مزدحم حاليًا: {zones}. يرجى التفكير في تجنب هذه المناطق.",
        "clear_zones": "ظروف الملعب واضحة عمومًا. استمتع بالمباراة!",
        "recommend_food": "نوصي بـ {zone} - الأقل ازدحامًا حاليًا مع وقت انتظار يبلغ {time} دقيقة.",
        "limited_mode": "أفهم أنك تسأل عن: '{message}'. أنا حاليًا في وضع محدود. للحصول على المساعدة الكاملة، يرجى التأكد من توفر خدمات الذكاء الاصطناعي."
    },
    "ja": {
        "route_found": "ルートが見つかりました: {path}。所要時間: {time}分。{rationale}",
        "busy_zones": "現在混雑中: {zones}。これらのエリアは避けることをお勧めします。",
        "clear_zones": "スタジアムの状況は概ね良好です。試合をお楽しみください！",
        "recommend_food": "{zone}がおすすめ - 現在待ち時間{time}分で最も空いています。",
        "limited_mode": "ご質問内容: '{message}'について理解しました。現在、制限モードで動作しています。すべての機能を利用するには、AIサービスが利用可能であることを確認してください。"
    },
    "zh": {
        "route_found": "已找到路线: {path}。预计时间: {time} 分钟。{rationale}",
        "busy_zones": "当前拥挤区域: {zones}。建议避开这些区域。",
        "clear_zones": "体育场整体路况畅通。享受比赛！",
        "recommend_food": "推荐 {zone} - 当前最空闲，仅需排队 {time} 分钟。",
        "limited_mode": "我明白您在问: '{message}'。我目前处于受限模式。如需完整协助，请确保AI服务可用。"
    }
}


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
        lang = language.lower() if language else "en"
        trans = FALLBACK_TRANSLATIONS.get(lang, FALLBACK_TRANSLATIONS["en"])

        if intent == IntentType.NAVIGATION and route:
            path_str = " → ".join(route.path)
            return trans["route_found"].format(path=path_str, time=route.estimated_time, rationale=route.rationale)

        if intent == IntentType.CROWD_STATUS:
            busy_zones = [c for c in context_data if c.status in [ZoneStatus.BUSY, ZoneStatus.CONGESTED]]
            if busy_zones:
                zones_str = ", ".join([z.zone_id.replace('_', ' ').title() for z in busy_zones[:3]])
                return trans["busy_zones"].format(zones=zones_str)
            return trans["clear_zones"]

        if intent == IntentType.RECOMMENDATION:
            food_zones = [c for c in context_data if "food" in c.zone_id]
            if food_zones:
                best = min(food_zones, key=lambda x: x.density)
                zone_name = best.zone_id.replace('_', ' ').title()
                return trans["recommend_food"].format(zone=zone_name, time=best.queue_time)

        return trans["limited_mode"].format(message=user_message)


gemini_client = GeminiClient()