from django.utils.text import slugify

# Polskie ł/Ł to osobne litery (przekreślone l), NIE diakrytyki nad "l", więc Django
# slugify je GUBI (NFKD ich nie rozkłada): "Mgła" -> "mga". Mapujemy ręcznie przed
# slugify; resztę polskich znaków (ą ę ó ś ć ż ź ń) slugify obsługuje przez NFKD.
_PL_TRANSLATION = str.maketrans({"ł": "l", "Ł": "L"})


def pl_slugify(value: str) -> str:
    """slugify świadomy polskich znaków (ł→l). Reszta diakrytyków przez NFKD."""
    return slugify(value.translate(_PL_TRANSLATION))
