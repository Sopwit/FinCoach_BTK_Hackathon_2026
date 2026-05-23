import unicodedata


CATEGORY_KEYWORDS = {
    "Yemek": [
        "trendyol yemek",
        "yemeksepeti",
        "getir yemek",
        "restoran",
        "restaurant",
        "kafe",
        "cafe",
        "starbucks",
        "kahve",
        "burger",
        "pizza",
        "doner",
        "döner"
    ],
    "Market": [
        "bim",
        "a101",
        "migros",
        "şok",
        "sok",
        "carrefour",
        "market"
    ],
    "Ulaşım": [
        "otobus",
        "otobüs",
        "metro",
        "akbil",
        "ulasim",
        "ulaşım",
        "benzin",
        "shell",
        "opet",
        "taksi",
        "taxi"
    ],
    "Abonelik": [
        "spotify",
        "netflix",
        "youtube premium",
        "exxen",
        "blutv",
        "blu tv",
        "disney",
        "prime"
    ],
    "Fatura": [
        "telefon faturası",
        "telefon faturasi",
        "internet faturası",
        "internet faturasi",
        "elektrik",
        "su faturası",
        "su faturasi",
        "doğalgaz",
        "dogalgaz"
    ],
    "Eğitim": [
        "udemy",
        "coursera",
        "kitap",
        "kurs",
        "okul"
    ],
}


SUB_CATEGORY_KEYWORDS = {
    "Dışarıdan Sipariş": [
        "trendyol yemek",
        "yemeksepeti",
        "getir yemek"
    ],
    "Restoran": [
        "restoran",
        "restaurant",
        "burger",
        "pizza",
        "doner",
        "döner"
    ],
    "Kafe": [
        "starbucks",
        "kahve dünyası",
        "kahve dunyasi",
        "cafe",
        "kafe",
        "kahve"
    ],
    "Ev Alışverişi": [
        "bim",
        "a101",
        "migros",
        "şok",
        "sok",
        "carrefour",
        "market"
    ],
    "Toplu Taşıma": [
        "otobus",
        "otobüs",
        "metro",
        "akbil",
        "ulasim",
        "ulaşım"
    ],
    "Yakıt": [
        "benzin",
        "shell",
        "opet"
    ],
    "Taksi": [
        "taksi",
        "taxi"
    ],
    "Dijital Abonelik": [
        "spotify",
        "netflix",
        "youtube premium",
        "exxen",
        "blutv",
        "blu tv",
        "disney",
        "prime"
    ],
    "Telefon": [
        "telefon faturası",
        "telefon faturasi"
    ],
    "İnternet": [
        "internet faturası",
        "internet faturasi"
    ],
    "Elektrik": [
        "elektrik"
    ],
    "Su": [
        "su faturası",
        "su faturasi"
    ],
    "Doğalgaz": [
        "doğalgaz",
        "dogalgaz"
    ],
    "Burs": [
        "kyk",
        "burs"
    ],
    "Aile Desteği": [
        "aile desteği",
        "aile destegi"
    ],
    "Freelance": [
        "freelance"
    ]
}


def remove_turkish_chars(text: str) -> str:
    """
    Türkçe karakterleri ASCII benzerlerine çevirir.
    Örnek:
    ş -> s
    ğ -> g
    ü -> u
    ö -> o
    ç -> c
    ı -> i
    """
    replacements = {
        "ç": "c",
        "ğ": "g",
        "ı": "i",
        "ö": "o",
        "ş": "s",
        "ü": "u",
        "Ç": "c",
        "Ğ": "g",
        "İ": "i",
        "I": "i",
        "Ö": "o",
        "Ş": "s",
        "Ü": "u",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def normalize_text(text: str) -> str:
    """
    Kullanıcının farklı yazımlarını standart hale getirir.

    Örnek:
    'Trendyol-Yemek'      -> 'trendyol yemek'
    'TRENDYOL_YEMEK'     -> 'trendyol yemek'
    'trendyol.yemek'     -> 'trendyol yemek'
    '  Trendyol   Yemek' -> 'trendyol yemek'
    'ŞOK Market'         -> 'sok market'
    """

    if not text:
        return ""

    text = text.lower()
    text = remove_turkish_chars(text)

    # Unicode normalizasyonu
    text = unicodedata.normalize("NFKD", text)

    # Ayraçları boşluğa çevir
    separators = [
        "-",
        "_",
        ".",
        ",",
        ";",
        ":",
        "/",
        "\\",
        "|",
        "(",
        ")",
        "[",
        "]",
        "{",
        "}",
        "+",
        "*",
        "#",
        "@",
        "!",
        "?",
    ]

    for sep in separators:
        text = text.replace(sep, " ")

    # Fazla boşlukları teke indir
    text = " ".join(text.split())

    return text


def keyword_matches(description: str, keyword: str) -> bool:
    normalized_description = normalize_text(description)
    normalized_keyword = normalize_text(keyword)

    return normalized_keyword in normalized_description


def detect_category(description: str, tx_type: str) -> str:
    normalized_type = normalize_text(tx_type)

    if normalized_type == "income":
        return "Gelir"

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword_matches(description, keyword):
                return category

    return "Diğer"


def detect_sub_category(description: str) -> str | None:
    for sub_category, keywords in SUB_CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword_matches(description, keyword):
                return sub_category

    return None