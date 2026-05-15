import os
import json
from dotenv import load_dotenv

import google.generativeai as genai

load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def build_financial_advice_prompt(analysis_data: dict) -> str:
    return f"""
Sen bir finansal harcama analizi asistanısın.

Görevin:
- Kullanıcının harcama özetini yorumlamak
- Gereksiz kesin yargılardan kaçınmak
- Yatırım tavsiyesi vermemek
- Hisse, kripto, fon, altın, döviz önerisi yapmamak
- Kullanıcıyı suçlayıcı bir dil kullanmamak
- Kısa, sade ve uygulanabilir öneriler vermek
- Türkçe cevap vermek

Önemli kurallar:
1. Bu sistem yatırım tavsiyesi vermez.
2. Sadece harcama ve bütçe farkındalığı sağlar.
3. "Bu harcama gereksizdir" deme.
4. Onun yerine "azaltılabilir görünüyor", "dikkat çekiyor", "bütçende yüksek paya sahip" gibi ifadeler kullan.
5. Kullanıcının verisine göre konuş.
6. Sayıları abartma veya veri yoksa uydurma.
7. En fazla 4-6 kısa paragraf yaz.
8. En sonda 3 maddelik uygulanabilir öneri ver.

Kullanıcının analiz verisi:
{json.dumps(analysis_data, ensure_ascii=False, indent=2)}

Bu verilere göre kullanıcıya kişisel, sade ve uygulanabilir bir harcama analizi önerisi yaz.
"""


def generate_ai_advice(analysis_data: dict) -> dict:
    if not GEMINI_API_KEY:
        return {
            "source": "fallback",
            "text": fallback_advice(analysis_data)
        }

    try:
        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = build_financial_advice_prompt(analysis_data)

        response = model.generate_content(prompt)

        if not response or not response.text:
            return {
                "source": "fallback",
                "text": fallback_advice(analysis_data)
            }

        return {
            "source": "gemini",
            "text": response.text
        }

    except Exception as e:
        return {
            "source": "fallback",
            "error": str(e),
            "text": fallback_advice(analysis_data)
        }

def build_chat_prompt(message: str, current_page: str | None, context: dict) -> str:
    return f"""
Sen FinCoach uygulamasının bağlam farkındalığı olan finansal harcama analizi asistanısın.

Kesin kurallar:
- Kullanıcıya özel sorularda sadece sağlanan context içindeki verileri kullan.
- Context dışında sayı, işlem, kategori, bütçe, alışkanlık veya abonelik uydurma.
- Yatırım tavsiyesi verme. Hisse, kripto, fon, altın, döviz veya al-sat önerisi yapma.
- Harcama, bütçe, alışkanlık, tekrar eden ödeme ve dashboard verilerini açıkla.
- Context yetersizse hangi verinin eksik olduğunu söyle.
- Kısa, net, demo için anlaşılır Türkçe cevap ver.
- En fazla 2 kısa paragraf ve gerekiyorsa 3 madde kullan.

Mevcut sayfa:
{current_page or "-"}

Kullanıcı mesajı:
{message}

Uygulama context verisi:
{json.dumps(context, ensure_ascii=False, indent=2, default=str)}

Bu mesaja, yalnızca yukarıdaki context'e dayanarak cevap ver.
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

    return ", ".join(parts) if parts else "Context verisi boş veya çok sınırlı."


def fallback_chat_answer(message: str, context: dict) -> str:
    dashboard = context.get("dashboard") or {}
    summary = dashboard.get("summary") or {}
    transactions = context.get("transactions") or []
    recurring = context.get("recurring_payments") or []
    habits = context.get("habits") or {}
    budgets = context.get("budgets") or {}

    if not any([summary, transactions, recurring, habits, budgets]):
        return (
            "Gemini yanıtı alınamadı ve mevcut context finansal yorum yapmak için yeterli değil. "
            "Dashboard özeti, işlem listesi, bütçe durumu veya alışkanlık verileri yüklendikten sonra daha net cevap verebilirim."
        )

    answer_parts = ["Gemini yanıtı alınamadı; mevcut uygulama context'i ile sınırlı kısa özet:"]

    if summary:
        answer_parts.append(
            f"Toplam gelir {summary.get('total_income', 0)} TL, toplam gider {summary.get('total_expense', 0)} TL, "
            f"kalan bütçe {summary.get('remaining_budget', 0)} TL görünüyor."
        )

    if summary.get("top_category"):
        answer_parts.append(f"Dashboard'da öne çıkan kategori: {summary.get('top_category')}.")

    if recurring:
        names = ", ".join([(item.get("description") or item.get("name") or "-") for item in recurring[:3]])
        answer_parts.append(f"Tekrar eden ödeme tarafında dikkat çeken kayıtlar: {names}.")

    frequent_sub_categories = habits.get("frequent_sub_categories") or []
    if frequent_sub_categories:
        top_habit = frequent_sub_categories[0]
        answer_parts.append(
            f"Sık alt kategori: {top_habit.get('sub_category') or top_habit.get('name')} "
            f"({top_habit.get('count', 0)} işlem)."
        )

    if "bütçe" in message.lower() and not budgets:
        answer_parts.append("Bütçe sorusu için raw bütçe veya bütçe durum verisi context içinde eksik.")

    return " ".join(answer_parts)


def generate_chat_answer(message: str, current_page: str | None, context: dict) -> dict:
    used_context_summary = summarize_chat_context(context)

    if not GEMINI_API_KEY:
        return {
            "answer": fallback_chat_answer(message, context),
            "used_context_summary": used_context_summary,
            "warning": "GEMINI_API_KEY eksik; Gemini çağrısı yapılamadı."
        }

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(build_chat_prompt(message, current_page, context))

        if not response or not response.text:
            return {
                "answer": fallback_chat_answer(message, context),
                "used_context_summary": used_context_summary,
                "warning": "Gemini boş yanıt döndürdü; fallback yanıt kullanıldı."
            }

        return {
            "answer": response.text.strip(),
            "used_context_summary": used_context_summary,
            "warning": None
        }

    except Exception as e:
        return {
            "answer": fallback_chat_answer(message, context),
            "used_context_summary": used_context_summary,
            "warning": f"Gemini isteği başarısız oldu: {str(e)}"
        }

def fallback_advice(analysis_data: dict) -> str:
    summary = analysis_data.get("summary", {})
    comparison = analysis_data.get("monthly_comparison", {}).get("comparison", [])
    recurring = analysis_data.get("recurring_payments", {}).get("recurring_payments", [])
    habits = analysis_data.get("spending_habits", {})

    total_income = summary.get("total_income", 0)
    total_expense = summary.get("total_expense", 0)
    remaining_budget = summary.get("remaining_budget", 0)
    top_category = summary.get("top_category")

    highest_increase = None

    if comparison:
        positive_increases = [
            item for item in comparison
            if item.get("difference", 0) > 0
        ]

        if positive_increases:
            highest_increase = positive_increases[0]

    frequent_sub_categories = habits.get("frequent_sub_categories", [])

    advice_parts = []

    advice_parts.append(
        f"Bu ay toplam gelirin {total_income} TL, toplam giderin {total_expense} TL olarak görünüyor. "
        f"Kalan bütçen yaklaşık {remaining_budget} TL."
    )

    if top_category:
        advice_parts.append(
            f"Bu ay bütçende en çok öne çıkan kategori {top_category}. "
            "Bu kategori bütçende yüksek paya sahip olabilir."
        )

    if highest_increase:
        category = highest_increase.get("category")
        difference = highest_increase.get("difference")
        change_percent = highest_increase.get("change_percent")

        if change_percent is not None:
            advice_parts.append(
                f"{category} harcamaların geçen aya göre %{change_percent} artmış. "
                f"Bu kategoride yaklaşık {difference} TL daha fazla harcama yapılmış."
            )
        else:
            advice_parts.append(
                f"{category} kategorisinde bu ay yeni veya belirgin bir harcama artışı görünüyor."
            )

    if recurring:
        recurring_names = ", ".join([item["description"] for item in recurring[:3]])
        advice_parts.append(
            f"Tekrar eden ödeme olarak {recurring_names} dikkat çekiyor. "
            "Kullanmadığın abonelikleri kontrol etmek bütçeni rahatlatabilir."
        )

    if frequent_sub_categories:
        habit = frequent_sub_categories[0]
        advice_parts.append(
            f"{habit['sub_category']} alanında bu ay {habit['count']} kez harcama yapılmış. "
            "Bu alışkanlık küçük azaltmalarla tasarruf potansiyeli oluşturabilir."
        )

    advice_parts.append(
        "Öneriler:\n"
        "1. En çok artan harcama kategorisine haftalık limit koy.\n"
        "2. Tekrar eden abonelikleri ayda bir kontrol et.\n"
        "3. Dışarıdan yemek veya kafe gibi sık tekrar eden harcamalarda küçük azaltmalar dene."
    )

    return "\n\n".join(advice_parts)
