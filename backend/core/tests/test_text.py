from core.text import pl_slugify


def test_pl_slugify_handles_polish_l():
    assert pl_slugify("Mgła nad Wisłoujściem") == "mgla-nad-wisloujsciem"


def test_pl_slugify_handles_diacritics():
    assert pl_slugify("Żółć Łapa Ćma Śnieg") == "zolc-lapa-cma-snieg"


def test_pl_slugify_plain_ascii():
    assert pl_slugify("Psychologiczny") == "psychologiczny"
