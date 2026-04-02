"""Registry loader for model definitions.

This module only reads model metadata from JSON registry files.
It must never persist user API keys, and it must never backfill
frontend-entered credentials into code or registry files.
"""

from __future__ import annotations

import importlib
import json
from pathlib import Path
from typing import Any

from modules.models_config.domain.entities import ModelDefinition


CATEGORY_ORDER = {
    "chat": 0,
    "image": 1,
}


class ProviderRegistryLoader:
    """Load active model definitions from provider registry JSON files."""

    def __init__(self, providers_dir: Path | None = None) -> None:
        if providers_dir is None:
            providers_dir = Path(__file__).resolve().parent / "providers"
        self._providers_dir = providers_dir

    def load_active_models(self) -> list[ModelDefinition]:
        definitions: list[ModelDefinition] = []

        for registry_path in sorted(self._providers_dir.glob("*/*.json")):
            payload = self._read_registry_payload(registry_path)
            category = str(payload.get("category", registry_path.parent.name)).strip().lower()
            models = payload.get("models", [])

            if not isinstance(models, list):
                continue

            for item in models:
                if not isinstance(item, dict):
                    continue

                module_name = str(item.get("module_name", "")).strip()
                parameter_spec = self._load_parameter_spec(category, module_name)

                definition = ModelDefinition(
                    key=str(item.get("key", "")).strip(),
                    display_name=str(item.get("display_name", "")).strip(),
                    provider=str(item.get("provider", "")).strip(),
                    category=category,
                    module_name=module_name,
                    default_model_id=str(item.get("default_model_id", "")).strip(),
                    default_base_url=str(item.get("default_base_url", "")).strip(),
                    is_active=bool(item.get("is_active", False)),
                    parameter_spec=parameter_spec,
                )

                if definition.is_active and definition.key:
                    definitions.append(definition)

        definitions.sort(
            key=lambda item: CATEGORY_ORDER.get(item.category, 99)
        )
        return definitions

    def _read_registry_payload(self, registry_path: Path) -> dict[str, object]:
        with registry_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _load_parameter_spec(
        self,
        category: str,
        module_name: str,
    ) -> dict[str, Any]:
        if not module_name:
            return {}

        import_path = f"modules.models_config.infrastructure.providers.{category}.{module_name}"

        try:
            module = importlib.import_module(import_path)
        except Exception:
            return {}

        parameter_spec = getattr(module, "MODEL_PARAMETER_SPEC", {})
        return parameter_spec if isinstance(parameter_spec, dict) else {}
