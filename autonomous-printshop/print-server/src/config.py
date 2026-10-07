from __future__ import annotations

import copy
import json
import os
import sys
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
        "enabled": True,
        "baseUrl": "https://trendos-d1-api.trendmall-contact.workers.dev",
        "authLoginPath": "/v1/employee/auth/login",
        "authLogoutPath": "/v1/employee/auth/logout",
        "employeeCorePath": "/v1/employee/core",
        "pollSeconds": 15,
        "pollScreens": ["service", "print", "laser", "press"],
        "startStatuses": ["بدأ التنفيذ", "تحت التنفيذ"],
        "claimMode": "human_status_transition_read_bridge",
    },
}


def application_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def resource_dir() -> Path:
    bundled = getattr(sys, "_MEIPASS", None)
    if getattr(sys, "frozen", False) and bundled:
        return Path(str(bundled)).resolve()
    return application_dir()


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


def resolve_config_path(config_path: Optional[Union[str, os.PathLike]] = None) -> Path:
    base_dir = application_dir()
    if config_path:
        path = Path(config_path)
        if not path.is_absolute():
            path = (base_dir / path).resolve()
        return path
    return base_dir / "config" / "local.json"


def save_path_override(key: str, value: str, config_path: Optional[Union[str, os.PathLike]] = None) -> Path:
    path = resolve_config_path(config_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    current = {}
    if path.exists():
        try:
            loaded = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                current = loaded
        except Exception:
            current = {}
    current.setdefault("paths", {})[str(key)] = str(value)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temp, path)
    return path


def load_config(config_path: Optional[Union[str, os.PathLike]] = None) -> dict:
    base_dir = application_dir()
    path = resolve_config_path(config_path)
    override = {}
    if path.exists():
        with path.open("r", encoding="utf-8") as fh:
            override = json.load(fh)
    cfg = _deep_merge(DEFAULT_CONFIG, override)
    return _resolve_paths(cfg, base_dir)
