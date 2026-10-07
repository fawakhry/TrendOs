from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass(frozen=True)
class Classification:
    route_key: Optional[str]
    path_parts: Tuple[str, ...]
    reason: str
    confidence: str


def _text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _norm(value) -> str:
    text = _text(value).lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[\s_\-/]+", " ", text)
    return text.strip()


def _truthy(value, truthy_tokens: List[str]) -> bool:
    if value is True or value == 1:
        return True
    n = _norm(value)
    return bool(n) and n in {_norm(v) for v in truthy_tokens}


def _explicit_route(line: dict, routes: dict) -> Optional[str]:
    candidate = _text(
        line.get("printServerRoute")
        or line.get("folderRoute")
        or line.get("routeKey")
    )
    return candidate if candidate in routes else None


def classify_line(line: dict, config: dict) -> Classification:
    ccfg = config["classification"]
    routes: dict = ccfg["routes"]

    explicit = _explicit_route(line, routes)
    if explicit:
        return Classification(explicit, tuple(routes[explicit]), "EXPLICIT_ROUTE", "EXACT")

    # Business rule supplied by the owner: any heat-press line is Sublimation.
    heat_value = line.get("heatPress")
    if heat_value is None:
        heat_value = line.get("heat_press")
    if heat_value is None:
        heat_value = line.get("press")
    if _truthy(heat_value, ccfg.get("heatPressTruthy", [])):
        key = "photo_sublimation"
        return Classification(key, tuple(routes[key]), "HEAT_PRESS_TRUE", "EXACT")

    searchable_fields = (
        "department",
        "itemName",
        "productName",
        "workType",
        "category",
        "serviceName",
        "notes",
    )
    haystack = " | ".join(_norm(line.get(name)) for name in searchable_fields if _text(line.get(name)))

    # Specific routes are checked before generic photo printing.
    for key in ("laser", "digital_sticker", "digital_couche", "photo_tableaux", "photo_print"):
        for word in ccfg.get("keywords", {}).get(key, []):
            token = _norm(word)
            if token and token in haystack:
                return Classification(key, tuple(routes[key]), f"KEYWORD:{word}", "RULE")

    return Classification(None, tuple(), "UNCLASSIFIED_FAIL_CLOSED", "UNKNOWN")
