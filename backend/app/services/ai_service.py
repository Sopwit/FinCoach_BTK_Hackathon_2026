import os
import json
import logging
import traceback
import hashlib
import time
from copy import deepcopy
from dotenv import load_dotenv

from google import genai

try:
    from google.api_core.exceptions import ResourceExhausted, NotFound, PermissionDenied
except ImportError:
    ResourceExhausted = type("ResourceExhausted", (Exception,), {})
    NotFound = type("NotFound", (Exception,), {})
    PermissionDenied = type("PermissionDenied", (Exception,), {})


load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    override=False,
)


def _get_env_value(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value and value.strip():
            return value.strip()
    return None


GEMINI_API_KEY = _get_env_value(
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
)

# .env içinde GEMINI_MODEL varsa önce onu dener.
# Yoksa en hafif modelden başlar.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

AI_DEBUG = os.getenv("FINCOACH_AI_DEBUG", "false").lower() == "true"
AI_RAISE_ERRORS = os.getenv("AI_RAISE_ERRORS", "false").lower() == "true"
AI_ADVICE_CACHE_TTL_SECONDS = int(os.getenv("AI_ADVICE_CACHE_TTL_SECONDS", "300"))

logging.basicConfig(
    level=logging.DEBUG if AI_DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

logger = logging.getLogger("fincoach.ai")


AI_ADVICE_CACHE: dict[str, dict] = {}


GEMINI_FALLBACK_MODELS = [
    GEMINI_MODEL,
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-pro-latest",
]


def _unique_models(models: list[str]) -> list[str]:
    unique = []
    for model in models:
        if model and model not in unique:
            unique.append(model)
    return unique


def _log_response_metadata(response):
    try:
        logger.debug("[GEMINI DEBUG] Raw response: %r", response)
    except Exception:
        logger.error("[GEMINI DEBUG] Raw response yazdırılamadı.")

    try:
        logger.debug("[GEMINI DEBUG] prompt_feedback: %r", getattr(response, "prompt_feedback", None))
    except Exception:
        logger.debug("[GEMINI DEBUG] prompt_feedback okunamadı.")

    try:
        logger.debug("[GEMINI DEBUG] candidates: %r", getattr(response, "candidates", None))
    except Exception:
        logger.debug("[GEMINI DEBUG] candidates okunamadı.")


def _extract_response_text(response) -> str:
    if response is None:
        logger.error("[GEMINI ERROR] Response None döndü.")
        return ""

    try:
        text = getattr(response, "text", None)

        if not text:
            logger.error("[GEMINI ERROR] Response text boş döndü.")
            _log_response_metadata(response)
            return ""

        return text.strip()

    except Exception as e:
        logger.exception("[GEMINI ERROR] response.text okunurken hata oluştu.")
        logger.error("[GEMINI ERROR TYPE] %s", type(e).__name__)
        logger.error("[GEMINI ERROR MESSAGE] %s", str(e))
        _log_response_metadata(response)

        if AI_RAISE_ERRORS:
            raise

        return ""


def _generate_with_available_model(prompt: str) -> tuple[str, str]:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY eksik. .env dosyasını kontrol et.")

    client = genai.Client(api_key=GEMINI_API_KEY)

    tried_models = []
    failed_models = []
    last_error = None

    for model_name in _unique_models(GEMINI_FALLBACK_MODELS):
        tried_models.append(model_name)

        try:
            logger.debug("[GEMINI TRY MODEL] %s", model_name)

            response = client.models.generate_content(model=model_name, contents=prompt)

            text = _extract_response_text(response)

            if text:
                logger.debug("[GEMINI SUCCESS MODEL] %s", model_name)
                return text, model_name

            failed_models.append({
                "model": model_name,
                "error_type": "EmptyResponse",
                "error": "Gemini boş yanıt döndürdü."
            })

            logger.error("[GEMINI EMPTY RESPONSE] model=%s", model_name)

        except ResourceExhausted as e:
            last_error = e
            failed_models.append({
                "model": model_name,
                "error_type": type(e).__name__,
                "error": str(e)
            })

            logger.error("[GEMINI QUOTA ERROR] model=%s", model_name)
            logger.error("[GEMINI QUOTA MESSAGE] %s", str(e))
            continue

        except NotFound as e:
            last_error = e
            failed_models.append({
                "model": model_name,
                "error_type": type(e).__name__,
                "error": str(e)
            })

            logger.error("[GEMINI MODEL NOT FOUND] model=%s", model_name)
            logger.error("[GEMINI MODEL NOT FOUND MESSAGE] %s", str(e))
            continue

        except PermissionDenied as e:
            last_error = e
            failed_models.append({
                "model": model_name,
                "error_type": type(e).__name__,
                "error": str(e)
            })

            logger.error("[GEMINI PERMISSION ERROR] model=%s", model_name)
            logger.error("[GEMINI PERMISSION MESSAGE] %s", str(e))
            continue

        except Exception as e:
            last_error = e
            failed_models.append({
                "model": model_name,
                "error_type": type(e).__name__,
                "error": str(e)
            })

            logger.exception("[GEMINI UNKNOWN ERROR] model=%s", model_name)
            continue

    logger.error("[GEMINI ALL MODELS FAILED] Denenen modeller: %s", tried_models)
    logger.error(
        "[GEMINI FAILED MODELS DETAIL] %s",
        json.dumps(failed_models, ensure_ascii=False, indent=2)
    )

    raise RuntimeError(
        "Hiçbir Gemini modeli çalışmadı. "
        f"Denenen modeller: {tried_models}. "
        f"Son hata: {type(last_error).__name__}: {str(last_error)}"
    )


def _build_advice_cache_key(analysis_data: dict) -> str:
    serialized = json.dumps(
        analysis_data,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _get_cached_advice(cache_key: str) -> dict | None:
    cached = AI_ADVICE_CACHE.get(cache_key)
    if not cached:
        return None

    age_seconds = time.time() - cached["created_at"]
    if age_seconds > AI_ADVICE_CACHE_TTL_SECONDS:
        AI_ADVICE_CACHE.pop(cache_key, None)
        return None

    advice = deepcopy(cached["advice"])
    return advice


def _set_cached_advice(cache_key: str, advice: dict) -> dict:
    cached_advice = deepcopy(advice)

    AI_ADVICE_CACHE[cache_key] = {
        "created_at": time.time(),
        "advice": deepcopy(cached_advice),
    }

    return cached_advice


def build_financial_advice_prompt(analysis_data: dict) -> str:
    return f"""
Sen FinCoach uygulaması için kısa finansal harcama içgörüsü üreten bir asistansın.

Kesin kurallar:
- Türkçe cevap ver.
- Yatırım tavsiyesi verme. Hisse, kripto, fon, altın, döviz veya al-sat önerisi yapma.
- Kullanıcıyı suçlayıcı dil kullanma.
- Sadece verilen veriye dayan; sayı, kategori veya eğilim uydurma.
- Ana metin tek paragraf olsun; 3-4 cümle yaz, yaklaşık 450-650 karakter aralığında tut.
- Ana metinde en önemli 2-3 bulguyu bağla: bütçe durumu, baskın kategori, artış eğilimi veya sık alışkanlık.
- Giriş/kapanış selamı ekleme.
- Ana metinden sonra 3 uygulanabilir aksiyon üret.
- Her aksiyon tek cümle olsun, yaklaşık 90-170 karakter aralığında tut.
- Aynı fikri hem özette hem aksiyonlarda tekrar etme.
- Markdown, madde işareti veya numaralandırma kullanma.
- Sadece geçerli JSON döndür.

JSON formatı:
{{
  "title": "Kısa başlık",
  "summary": "Tek paragraf halinde 3-4 cümlelik ana analiz metni yaz.",
  "actions": [
    "Somut aksiyon 1",
    "Somut aksiyon 2",
    "Somut aksiyon 3"
  ],
  "estimated_saving": "Veriden hesaplanabiliyorsa kısa TL aralığı, hesaplanamıyorsa null"
}}

Kullanıcının analiz verisi:
{json.dumps(analysis_data, ensure_ascii=False, indent=2, default=str)}

Bu veriye göre nokta atışı, kısa ve uygulanabilir JSON yanıtı üret.
"""


def _normalize_actions(actions) -> list[str]:
    if not isinstance(actions, list):
        return []

    normalized = []
    for action in actions:
        if not isinstance(action, str):
            continue

        cleaned = action.strip().lstrip("-*0123456789. ")
        if cleaned:
            normalized.append(cleaned[:190])

    return normalized[:3]


def _extract_json_payload(text: str) -> dict | None:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        payload = json.loads(cleaned[start:end + 1])
    except json.JSONDecodeError:
        return None

    if not isinstance(payload, dict):
        return None

    actions = _normalize_actions(payload.get("actions"))
    summary = str(payload.get("summary") or "").strip()

    if not summary:
        return None

    return {
        "title": str(payload.get("title") or "Akıllı Analiz").strip()[:80],
        "summary": summary[:700],
        "actions": actions,
        "estimated_saving": str(payload.get("estimated_saving")).strip()[:80] if payload.get("estimated_saving") else None,
    }


def _compact_text_to_advice(text: str) -> dict:
    lines = [
        line.strip().lstrip("-*0123456789. ")
        for line in text.splitlines()
        if line.strip()
    ]
    summary = lines[0] if lines else "Bu ay harcamalarında dikkat çeken alanlar var."

    return {
        "title": "Akıllı Analiz",
        "summary": summary[:700],
        "actions": _normalize_actions(lines[1:]) or [
            "En yüksek harcama kategorisine haftalık limit koy.",
            "Sık tekrar eden harcamaları ay sonunda kontrol et.",
            "Dışarıdan siparişleri planlı günlerle sınırla.",
        ],
        "estimated_saving": None,
    }


def generate_ai_advice(analysis_data: dict) -> dict:
    cache_key = _build_advice_cache_key(analysis_data)
    cached_advice = _get_cached_advice(cache_key)
    if cached_advice:
        logger.debug("[GEMINI CACHE HIT] key=%s", cache_key[:12])
        return cached_advice

    if not GEMINI_API_KEY:
        logger.error("[GEMINI CONFIG ERROR] GEMINI_API_KEY eksik.")
        fallback_payload = fallback_advice_payload(analysis_data)
        advice = {
            "source": "fallback",
            "model": None,
            "error": "GEMINI_API_KEY eksik.",
            **fallback_payload,
        }
        return _set_cached_advice(cache_key, advice)

    try:
        prompt = build_financial_advice_prompt(analysis_data)

        logger.debug("[GEMINI REQUEST] generate_ai_advice çağrılıyor.")
        logger.debug(
            "[GEMINI REQUEST DATA] %s",
            json.dumps(analysis_data, ensure_ascii=False, default=str)
        )

        text, used_model = _generate_with_available_model(prompt)
        advice_payload = _extract_json_payload(text) or _compact_text_to_advice(text)

        advice = {
            "source": "gemini",
            "model": used_model,
            "error": None,
            "text": advice_payload["summary"],
            **advice_payload,
        }
        return _set_cached_advice(cache_key, advice)

    except Exception as e:
        logger.exception("[GEMINI EXCEPTION] generate_ai_advice sırasında hata oluştu.")
        logger.error("[GEMINI ERROR TYPE] %s", type(e).__name__)
        logger.error("[GEMINI ERROR MESSAGE] %s", str(e))
        logger.error("[GEMINI TRACEBACK]\n%s", traceback.format_exc())

        if AI_RAISE_ERRORS:
            raise

        fallback_payload = fallback_advice_payload(analysis_data)
        advice = {
            "source": "fallback",
            "model": None,
            "error": f"{type(e).__name__}: {str(e)}",
            **fallback_payload,
        }
        return _set_cached_advice(cache_key, advice)


def build_chat_prompt(message: str, current_page: str | None, context: dict) -> str:
    return f"""
Sen FinCoach uygulamasının bağlam farkındalığı olan finansal harcama analizi asistanısın.

Kesin kurallar:
- Kullanıcıya özel sorularda sadece sağlanan context içindeki verileri kullan.
- Context dışında sayı, işlem, kategori, bütçe, alışkanlık veya abonelik uydurma.
- Yatırım tavsiyesi verme. Hisse, kripto, fon, altın, döviz veya al-sat önerisi yapma.
- Harcama, bütçe, alışkanlık, tekrar eden ödeme ve dashboard verilerini açıkla.
- Veri yetersizse hangi bilginin eksik olduğunu kullanıcı dostu şekilde söyle.
- Kısa, net ve anlaşılır Türkçe cevap ver.
- En fazla 2 kısa paragraf ve gerekiyorsa 3 madde kullan.

Mevcut sayfa:
{current_page or "-"}

Kullanıcı mesajı:
{message}

Uygulama veri paketi:
{json.dumps(context, ensure_ascii=False, indent=2, default=str)}

Bu mesaja, yalnızca yukarıdaki veri paketine dayanarak cevap ver.
"""


def summarize_chat_context(context: dict) -> str:
    dashboard = context.get("dashboard") or {}
    transactions = context.get("transactions") or []
    habits = context.get("habits") or {}
    recurring = context.get("recurring_payments") or []
    budgets = context.get("budgets") or {}
    selected_month = context.get("selected_month")
    selected_user = context.get("selected_user") or {}

    parts = []

    if selected_user:
        parts.append(f"kullanıcı: {selected_user.get('name') or selected_user.get('id')}")

    if selected_month:
        parts.append(f"ay: {selected_month}")

    if dashboard:
        parts.append("dashboard")

    if transactions:
        parts.append(f"{len(transactions)} işlem")

    if habits:
        sub_count = len(habits.get("frequent_sub_categories") or [])
        desc_count = len(habits.get("frequent_descriptions") or [])
        parts.append(f"alışkanlıklar: {sub_count} alt kategori, {desc_count} açıklama")

    if recurring:
        parts.append(f"{len(recurring)} tekrar eden ödeme")

    if budgets:
        raw_count = len(budgets.get("raw") or []) if isinstance(budgets, dict) else len(budgets)
        parts.append(f"{raw_count} bütçe")

    return ", ".join(parts) if parts else "Finansal veri çok sınırlı."


def fallback_chat_answer(message: str, context: dict) -> str:
    dashboard = context.get("dashboard") or {}
    summary = dashboard.get("summary") or {}
    transactions = context.get("transactions") or []
    recurring = context.get("recurring_payments") or []
    habits = context.get("habits") or {}
    budgets = context.get("budgets") or {}

    if not any([summary, transactions, recurring, habits, budgets]):
        return (
            "Şu anda finansal yorum yapmak için yeterli veri görünmüyor. "
            "Gelir, gider, bütçe veya alışkanlık verileri eklendiğinde daha net yardımcı olabilirim."
        )

    answer_parts = [
        "Mevcut finansal verilerine göre kısa özet:"
    ]

    if summary:
        answer_parts.append(
            f"Toplam gelir {summary.get('total_income', 0)} TL, "
            f"toplam gider {summary.get('total_expense', 0)} TL, "
            f"kalan bütçe {summary.get('remaining_budget', 0)} TL görünüyor."
        )

    if summary.get("top_category"):
        answer_parts.append(
            f"Dashboard'da öne çıkan kategori: {summary.get('top_category')}."
        )

    if recurring:
        names = ", ".join([
            item.get("description") or item.get("name") or "-"
            for item in recurring[:3]
        ])
        answer_parts.append(
            f"Tekrar eden ödeme tarafında dikkat çeken kayıtlar: {names}."
        )

    frequent_sub_categories = habits.get("frequent_sub_categories") or []
    if frequent_sub_categories:
        top_habit = frequent_sub_categories[0]
        answer_parts.append(
            f"Sık alt kategori: {top_habit.get('sub_category') or top_habit.get('name')} "
            f"({top_habit.get('count', 0)} işlem)."
        )

    if "bütçe" in message.lower() and not budgets:
        answer_parts.append(
            "Bütçe sorusu için tanımlı kategori limiti veya bütçe kullanım verisi eksik."
        )

    return " ".join(answer_parts)


def generate_chat_answer(message: str, current_page: str | None, context: dict) -> dict:
    used_context_summary = summarize_chat_context(context)

    if not GEMINI_API_KEY:
        logger.error("[GEMINI CONFIG ERROR] GEMINI_API_KEY eksik.")
        return {
            "answer": fallback_chat_answer(message, context),
            "model": None,
            "used_context_summary": used_context_summary,
            "warning": "Yanıt geçici olarak otomatik özetle hazırlandı."
        }

    try:
        prompt = build_chat_prompt(message, current_page, context)

        logger.debug("[GEMINI REQUEST] generate_chat_answer çağrılıyor.")
        logger.debug("[GEMINI MESSAGE] %s", message)
        logger.debug("[GEMINI CURRENT PAGE] %s", current_page)
        logger.debug("[GEMINI CONTEXT SUMMARY] %s", used_context_summary)
        logger.debug(
            "[GEMINI CONTEXT RAW] %s",
            json.dumps(context, ensure_ascii=False, default=str)
        )

        text, used_model = _generate_with_available_model(prompt)

        return {
            "answer": text,
            "model": used_model,
            "used_context_summary": used_context_summary,
            "warning": None
        }

    except Exception as e:
        logger.exception("[GEMINI EXCEPTION] generate_chat_answer sırasında hata oluştu.")
        logger.error("[GEMINI ERROR TYPE] %s", type(e).__name__)
        logger.error("[GEMINI ERROR MESSAGE] %s", str(e))
        logger.error("[GEMINI TRACEBACK]\n%s", traceback.format_exc())

        if AI_RAISE_ERRORS:
            raise

        return {
            "answer": fallback_chat_answer(message, context),
            "model": None,
            "used_context_summary": used_context_summary,
            "warning": "Yanıt geçici olarak otomatik özetle hazırlandı."
        }


def fallback_advice_payload(analysis_data: dict) -> dict:
    summary = analysis_data.get("summary", {})
    comparison = analysis_data.get("monthly_comparison", {}).get("comparison", [])
    habits = analysis_data.get("spending_habits", {})
    recurring = analysis_data.get("recurring_payments", {}).get("recurring_payments", [])

    total_income = summary.get("total_income", 0)
    total_expense = summary.get("total_expense", 0)
    remaining_budget = summary.get("remaining_budget", 0)
    top_category = summary.get("top_category")

    highest_increase = None
    for item in comparison:
        if item.get("difference", 0) > 0 and (
            highest_increase is None or item.get("difference", 0) > highest_increase.get("difference", 0)
        ):
            highest_increase = item

    frequent_sub_categories = habits.get("frequent_sub_categories", [])
    frequent_habit = frequent_sub_categories[0] if frequent_sub_categories else {}
    frequent_name = frequent_habit.get("sub_category") or frequent_habit.get("name")

    summary_sentences = []
    if total_income or total_expense or remaining_budget:
        summary_sentences.append(
            f"Bu ay {total_income} TL gelir içinde {total_expense} TL harcama yapılmış ve kalan bütçe {remaining_budget} TL görünüyor."
        )

    if top_category:
        summary_sentences.append(
            f"Harcama tarafında en baskın alan {top_category}; bu kategori bütçede takip edilmesi gereken ana başlık gibi duruyor."
        )

    if highest_increase:
        summary_sentences.append(
            f"{highest_increase.get('category')} kategorisindeki artış, geçen aya göre davranış değişimi olabileceğini gösteriyor."
        )

    if frequent_name:
        summary_sentences.append(
            f"Sık tekrar eden {frequent_name} harcamaları küçük ayarlamalarla bütçede hızlı etki yaratabilir."
        )

    if recurring:
        summary_sentences.append(
            "Tekrar eden ödemeler sabit gider tarafında düzenli kontrol edilmesi gereken ayrı bir alan oluşturuyor."
        )

    summary_text = " ".join(summary_sentences[:4]) or (
        "Bu ay harcamalarında takip edilebilir birkaç alan öne çıkıyor. Kategori dağılımı ve sık tekrar eden işlemler, bütçeyi daha kontrollü yönetmek için iyi bir başlangıç noktası sunuyor."
    )

    actions = []
    if top_category:
        actions.append(f"{top_category} kategorisi için haftalık bir üst limit belirleyip hafta sonunda gerçekleşen tutarla karşılaştır.")

    if highest_increase:
        actions.append(f"{highest_increase.get('category')} artışının hangi işlem tiplerinden geldiğini kontrol edip bir sonraki ay için hedef koy.")

    if frequent_name:
        actions.append(f"{frequent_name} harcamalarını tamamen kesmeden, haftada bir kez azaltmayı deneyerek etkisini takip et.")

    fallback_actions = [
        "En yüksek harcama kategorisini haftalık olarak izleyip ay ortasında küçük bir düzeltme yap.",
        "Tekrar eden ödemeleri ay sonunda kontrol edip kullanmadığın kalemleri ayrı bir listeye al.",
        "Küçük ve sık harcamaları tek listede toplayarak hangi alışkanlığın bütçeyi zorladığını gör.",
    ]

    for action in fallback_actions:
        if len(actions) >= 3:
            break
        if action not in actions:
            actions.append(action)

    return {
        "title": "Finansal Öneri",
        "summary": summary_text,
        "actions": actions[:3],
        "estimated_saving": None,
        "text": summary_text,
    }
