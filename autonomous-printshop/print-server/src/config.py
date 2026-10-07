from __future__ import annotations

import copy
import json
import os
from pathlib import Path
from typing import Optional, Union

DEFAULT_CONFIG = {
    "server": {"host": "127.0.0.1", "port": 4782},
    "paths": {
        "ordersRoot": "./data/orders",
        "readyRoot": "./data/ready",
        "stateRoot": "./data/state",
    },
    "folder": {
        "dateFormat": "%d-%m-%Y",
        "namePattern": "{order_id} - {date} - {customer_name}",
        "finishedFolderName": "x",
    },
    "classification": {
        "heatPressTruthy": ["1", "true", "yes", "نعم", "مكبس", "🔥"],
        "routes": {
            "photo_print": ["طباعة", "فوتو", "طباعة"],
            "photo_tableaux": ["طباعة", "فوتو", "تابلوهات"],
            "photo_sublimation": ["طباعة", "فوتو", "سبلميشن"],
            "digital_couche": ["طباعة", "ديجتال", "كوشيه"],
            "digital_sticker": ["طباعة", "ديجتال", "استيكر"],
            "laser": ["ليزر"],
        },
        "keywords": {
            "laser": ["ليزر", "laser"],
            "digital_sticker": ["استيكر", "ستيكر", "sticker", "vinyl", "فينيل"],
            "digital_couche": ["كوشيه", "كوشي", "couche", "couché"],
            "photo_tableaux": ["تابلو", "تابلوه", "تابلوهات", "canvas", "كانفس"],
            "photo_print": ["فوتو", "photo", "photographic"],
        },
    },
    "approval": {
        "allowedStructuredSources": [
            "CUSTOMER_PORTAL",
            "STRUCTURED_CUSTOMER_APPROVAL",
            "OWNER_STRUCTURED_APPROVAL",
        ]
    },
    "preview": {
        "imageExtensions": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"],
        "tiffExtensions": [".tif", ".tiff"],
        "dxfExtensions": [".dxf"],
        "maxBytes": 200000000,
    },
    "trendos": {
        "enabled": False,
        "baseUrl": "https://trendos-d1-api.trendmall-contact.workers.dev",
        "ordersPagePath": "/v1/edge/orders/02cr/page",
        "bearerTokenEnv": "TRENDOS_EDGE_TOKEN",
        "pollSeconds": 15,
        "claimMode": "event_bridge",
    },
}


def _deep_merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge(out[key], value)
        else:
            out[key] = value
    return out


def _resolve_paths(config: dict, base_dir: Path) -> dict:
    cfg = copy.deepcopy(config)
    for key in ("ordersRoot", "readyRoot", "stateRoot"):
        raw = str(cfg["paths"][key])
        p = Path(os.path.expandvars(os.path.expanduser(raw)))
        if not p.is_absolute():
            p = (base_dir / p).resolve()
        cfg["paths"][key] = str(p)
    return cfg


def load_config(config_path: Optional[Union[str, os.PathLike]] = None) -> dict:
    here = Path(__file__).resolve().parent.parent
    path = Path(config_path) if config_path else here / "config" / "local.json"
    override = {}
    if path.exists():
        with path.open("r", encoding="utf-8") as fh:
            override = json.load(fh)
    cfg = _deep_merge(DEFAULT_CONFIG, override)
    return _resolve_paths(cfg, here)
