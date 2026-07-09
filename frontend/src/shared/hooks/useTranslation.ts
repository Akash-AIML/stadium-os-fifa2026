import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

const DICTIONARY: Record<string, Record<string, string>> = {
  stadium_os: {
    en: "StadiumOS", es: "EstadioOS", fr: "StadeOS", de: "StadionOS", pt: "EstádioOS",
    ar: "نظام الملعب", ja: "スタジアムOS", zh: "体育场OS", hi: "स्टेडियमओएस", ta: "ஸ்டேடியம்ஓஎஸ்"
  },
  stadium_os_assistant: {
    en: "Smart Guide AI Assistant",
    es: "Asistente de Guía Inteligente IA",
    fr: "Assistant de Guide Intelligent IA",
    de: "Smart Guide KI-Assistent",
    pt: "Assistente de Guia Inteligente de IA",
    ar: "مساعد الدليل الذكي الذكاء الاصطناعي",
    ja: "スマートガイドAIアシスタント",
    zh: "智能指南AI助手",
    hi: "स्मार्ट गाइड एआई सहायक",
    ta: "ஸ்மார்ட் கைடு AI உதவியாளர்"
  },
  nav_dashboard: {
    en: "Dashboard", es: "Panel", fr: "Tableau de Bord", de: "Dashboard", pt: "Painel",
    ar: "لوحة القيادة", ja: "ダッシュボード", zh: "仪表板", hi: "डैशबोर्ड", ta: "டாஷ்போர்டு"
  },
  nav_assistant: {
    en: "AI Assistant", es: "Asistente IA", fr: "Assistant IA", de: "KI-Assistent", pt: "Assistente de IA",
    ar: "مساعد الذكاء", ja: "AIアシスタント", zh: "AI助手", hi: "एआई सहायक", ta: "AI உதவி"
  },
  nav_heatmap: {
    en: "Heatmap", es: "Mapa de Calor", fr: "Carte Thermique", de: "Heatmap", pt: "Mapa de Calor",
    ar: "خريطة الحرارة", ja: "ヒートマップ", zh: "热力图", hi: "हीटमैप", ta: "வெப்ப வரைபடம்"
  },
  nav_accessibility: {
    en: "Accessibility", es: "Accesibilidad", fr: "Accessibilité", de: "Barrierefreiheit", pt: "Acessibilidade",
    ar: "إمكانية الوصول", ja: "アクセシビリティ", zh: "无障碍", hi: "सुलभता Mode", ta: "அணுகல்தன்மை"
  },
  nav_dev_mode: {
    en: "Dev Mode", es: "Modo Dev", fr: "Mode Dev", de: "Entwickler", pt: "Modo Dev",
    ar: "وضع التطوير", ja: "開発モード", zh: "开发者模式", hi: "देव मोड", ta: "டெவ் பயன்முறை"
  },
  match_time_sim: {
    en: "Match Simulation Time", es: "Simulación de Tiempo", fr: "Simulation du Temps", de: "Spielzeitsimulation", pt: "Simulação do Tempo",
    ar: "محاكاة وقت المباراة", ja: "試合時間のシミュレーション", zh: "比赛时间模拟", hi: "मैच सिमुलेशन समय", ta: "போட்டி உருவகப்படுத்துதல் நேரம்"
  },
  crowd_density: {
    en: "Crowd Density", es: "Densidad de Multitud", fr: "Densité de Foule", de: "Crowd-Dichte", pt: "Densidade de Público",
    ar: "كثافة الحشود", ja: "混雑度", zh: "人群密度", hi: "भीड़ घनत्व", ta: "கூட்ட நெரிசல்"
  },
  alerts: {
    en: "Active Alerts", es: "Alertas Activas", fr: "Alertes Actives", de: "Aktive Warnungen", pt: "Alertas Ativos",
    ar: "التنبيهات النشطة", ja: "アクティブなアラート", zh: "活动警报", hi: "सक्रिय अलर्ट", ta: "செயலில் உள்ள விழிப்பூட்டல்கள்"
  },
  recommendations: {
    en: "Smart Recommendations", es: "Recomendaciones Inteligentes", fr: "Recommandations Intelligentes", de: "Intelligente Empfehlungen", pt: "Recomendações Inteligentes",
    ar: "توصيات ذكية", ja: "スマートな推奨事項", zh: "智能推荐", hi: "स्मार्ट सिफारिशें", ta: "ஸ்மார்ட் பரிந்துரைகள்"
  },
  welcome_message: {
    en: "Welcome to StadiumOS. Select a zone on the map to navigate or chat with StadiumMate.",
    es: "Bienvenido a EstadioOS. Selecciona una zona en el mapa para navegar o chatear.",
    fr: "Bienvenue sur StadeOS. Sélectionnez une zone sur la carte pour naviguer ou discuter.",
    de: "Willkommen bei StadionOS. Wählen Sie eine Zone auf der Karte aus, um zu navigieren oder zu chatten.",
    pt: "Bem-vindo ao EstádioOS. Selecione uma zona no mapa para navegar ou conversar.",
    ar: "مرحبًا بك في نظام الملعب. حدد منطقة على الخriطة للتنقل أو الدردشة.",
    ja: "スタジアムOSへようこそ。マップ上のゾーンを選択してナビゲートするか、チャットしてください。",
    zh: "欢迎来到体育场OS。在地图上选择一个区域进行导航或聊天。",
    hi: "स्टेडियमओएस में आपका स्वागत है। नेविगेट करने या चैट करने के लिए मानचित्र पर एक ज़ोन चुनें।",
    ta: "ஸ்டேடியம்ஓஎஸ்-க்கு உங்களை வரவேற்கிறோம். வழிசெலுத்த அல்லது அரட்டையடிக்க வரைபடத்தில் ஒரு பகுதியைத் தேர்ந்தெடுக்கவும்."
  },
  emergency_mode: {
    en: "Emergency Guidance", es: "Guía de Emergencia", fr: "Guidage d'Urgence", de: "Notfallführung", pt: "Guia de Emergência",
    ar: "إرشادات الطوارئ", ja: "緊急避難誘導", zh: "紧急疏导", hi: "आपातकालीन मार्गदर्शन", ta: "அவசரகால வழிகாட்டுதல்"
  },
  match_time_mins: {
    en: "Minute {min}", es: "Minuto {min}", fr: "Minute {min}", de: "Minute {min}", pt: "Minuto {min}",
    ar: "الدقيقة {min}", ja: "{min} 分", zh: "第 {min} 分钟", hi: "{min} मिनट", ta: "நிமிடம் {min}"
  },
  step_free_route: {
    en: "Step-Free Accessible Route", es: "Ruta Accesible Sin Escalones", fr: "Itinéraire Accessible Sans Escalier", de: "Stufenfreie Route", pt: "Rota Acessível sem Degraus",
    ar: "مسار خالي من الدرج", ja: "段差のないルート", zh: "无障碍通道", hi: "कदम-मुक्त सुलभ मार्ग", ta: "படிகளற்ற அணுகல் பாதை"
  },
  standard_route: {
    en: "Standard Route", es: "Ruta Estándar", fr: "Itinéraire Standard", de: "Standardroute", pt: "Rota Padrão",
    ar: "المسار القياسي", ja: "標準ルート", zh: "标准路线", hi: "मानक मार्ग", ta: "சாதாரண பாதை"
  },
  select_start_end: {
    en: "Select start and destination zones to animate route.",
    es: "Selecciona inicio y destino para animar la ruta.",
    fr: "Sélectionnez le départ et la destination pour animer l'itinéraire.",
    de: "Wählen Sie Start und Ziel, um die Route zu animieren.",
    pt: "Selecione a origem e o destino para animar a rota.",
    ar: "حدد منطقتي البداية والوجهة لتنشيط المسار.",
    ja: "ルートをアニメーション化するには、出発地と目的地を選択します。",
    zh: "选择起点和终点区域以生成路线动画。",
    hi: "मार्ग को एनिमेट करने के लिए प्रारंभ और गंतव्य ज़ोन चुनें।",
    ta: "பாதை அனிமேஷன் செய்ய தொடக்கம் மற்றும் இலக்கு பகுதிகளைத் தேர்ந்தெடுக்கவும்."
  },
  time_saved: {
    en: "Time Saved", es: "Tiempo Ahorrado", fr: "Temps Gagné", de: "Zeit gespart", pt: "Tempo Economizado",
    ar: "الوقت الموفر", ja: "節約された時間", zh: "节省时间", hi: "बचाया गया समय", ta: "சேமிக்கப்பட்ட நேரம்"
  },
  alternative_route: {
    en: "Alternative options available in assistant chat.",
    es: "Alternativas disponibles en el chat del asistente.",
    fr: "Alternatives disponibles dans le chat de l'assistant.",
    de: "Alternativen im Assistenten-Chat verfügbar.",
    pt: "Alternativas disponíveis no chat do assistente.",
    ar: "خيارات بديلة متاحة في دردشة المساعد.",
    ja: "アシスタントチャットで利用可能な代替オプション。",
    zh: "助手聊天中提供备选方案。",
    hi: "सहायक चैट में उपलब्ध वैकल्पिक विकल्प।",
    ta: "உதவியாளர் அரட்டையில் மாற்று விருப்பங்கள் உள்ளன."
  }
};

export function useTranslation() {
  const { state } = useApp();
  const langCode = state.user.language || 'en';

  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const translations = DICTIONARY[key];
    if (!translations) return key;

    let text = translations[langCode] || translations['en'] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [langCode]);

  return { t, langCode };
}
