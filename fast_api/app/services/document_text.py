"""Extraction de texte brut depuis un document uploadé (PDF, DOCX, TXT).

Le texte n'est jamais persisté : il ne sert qu'à construire, en mémoire, le
prompt d'extraction (cf. app/services/extraction.py), le temps d'une requête.
"""

import io

import pypdf
from docx import Document

# Au-delà, le document est tronqué avant d'être envoyé au LLM : le coût et la
# limite de tokens par minute du fournisseur priment sur l'exhaustivité.
MAX_CHARS = 6000

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 Mo


class UnsupportedFileType(Exception):
    """Extension non prise en charge."""


class FileTooLarge(Exception):
    """Fichier au-delà de MAX_FILE_SIZE."""


def _extract_pdf(content: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    return "\n".join(p.text for p in document.paragraphs)


def extract_text(filename: str, content: bytes) -> str:
    """Texte brut du document, tronqué à MAX_CHARS.

    Lève `UnsupportedFileType` ou `FileTooLarge` plutôt que de dégrader
    silencieusement : l'utilisateur doit savoir que son fichier n'a pas pu être
    lu, pas recevoir un formulaire vide sans explication.
    """
    if len(content) > MAX_FILE_SIZE:
        raise FileTooLarge(f"Fichier trop volumineux (max {MAX_FILE_SIZE // (1024 * 1024)} Mo).")

    name = filename.lower()

    if name.endswith(".pdf"):
        text = _extract_pdf(content)
    elif name.endswith(".docx"):
        text = _extract_docx(content)
    elif name.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")
    else:
        raise UnsupportedFileType("Formats acceptés : PDF, DOCX, TXT.")

    return text.strip()[:MAX_CHARS]
