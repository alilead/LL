from typing import Dict, Any, Optional
import json
import os
from pathlib import Path

class I18n:
    def __init__(self):
        self.translations: Dict[str, Dict[str, Any]] = {}
        self.default_language = "en"
        self.supported_languages = ["en", "de", "fr", "it"]
        self._load_translations()

    def _load_translations(self):
        """Load all translation files"""
        locale_dir = Path(__file__).parent.parent / "locales"
        
        for lang in self.supported_languages:
            lang_file = locale_dir / f"{lang}.json"
            if lang_file.exists():
                with open(lang_file, "r", encoding="utf-8") as f:
                    self.translations[lang] = json.load(f)
            else:
                print(f"Warning: Translation file for {lang} not found")

    def get(self, key: str, lang: str = "en", **kwargs) -> str:
        """
        Get translation for a key in specified language
        Falls back to English if translation not found
        """
        # If language not supported, fall back to English
        if lang not in self.supported_languages:
            lang = self.default_language

        # Get translation from specified language
        translation = self.translations.get(lang, {})
        result = self._get_nested_value(translation, key)

        # If not found, try English
        if result is None and lang != self.default_language:
            translation = self.translations.get(self.default_language, {})
            result = self._get_nested_value(translation, key)

        # If still not found, return the key
        if result is None:
            return key

        # Replace placeholders with provided values
        return result.format(**kwargs) if kwargs else result

    def _get_nested_value(self, obj: Dict[str, Any], key: str) -> Optional[str]:
        """Get value from nested dictionary using dot notation"""
        keys = key.split(".")
        current = obj

        for k in keys:
            if isinstance(current, dict):
                current = current.get(k)
            else:
                return None

        return current if isinstance(current, str) else None

    def get_all_translations(self, lang: str = "en") -> Dict[str, Any]:
        """Get all translations for a language"""
        if lang not in self.supported_languages:
            lang = self.default_language
        return self.translations.get(lang, {})

    def get_supported_languages(self) -> list[str]:
        """Get list of supported languages"""
        return self.supported_languages

    def get_language_name(self, lang_code: str, display_lang: str = "en") -> str:
        """Get language name in specified display language"""
        language_names = {
            "en": {
                "en": "English",
                "de": "German",
                "fr": "French",
                "it": "Italian"
            },
            "de": {
                "en": "Englisch",
                "de": "Deutsch",
                "fr": "Französisch",
                "it": "Italienisch"
            },
            "fr": {
                "en": "Anglais",
                "de": "Allemand",
                "fr": "Français",
                "it": "Italien"
            },
            "it": {
                "en": "Inglese",
                "de": "Tedesco",
                "fr": "Francese",
                "it": "Italiano"
            }
        }

        if display_lang not in language_names:
            display_lang = self.default_language

        return language_names.get(display_lang, {}).get(lang_code, lang_code)

i18n = I18n()
