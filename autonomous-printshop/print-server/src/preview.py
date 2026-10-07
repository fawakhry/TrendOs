from __future__ import annotations

import io
import math
import mimetypes
from pathlib import Path
from xml.sax.saxutils import escape
from typing import List, Tuple

try:
    from PIL import Image
except Exception:  # pragma: no cover - surfaced in capability status
    Image = None

try:
    import ezdxf
except Exception:  # pragma: no cover - surfaced in capability status
    ezdxf = None


class PreviewError(Exception):
    pass


def capabilities() -> dict:
    return {
        "images": True,
        "tiff": Image is not None,
        "dxf": ezdxf is not None,
        "tiffEngine": "Pillow" if Image is not None else None,
        "dxfEngine": "ezdxf" if ezdxf is not None else None,
    }


def _safe_local_path(path_value: str, roots: List[str]) -> Path:
    p = Path(path_value).resolve()
    for root in roots:
        r = Path(root).resolve()
        try:
            p.relative_to(r)
            return p
        except ValueError:
            continue
    raise PreviewError("PATH_OUTSIDE_ALLOWED_ROOTS")


def preview_kind(path: Path, config: dict) -> str:
    ext = path.suffix.lower()
    pcfg = config["preview"]
    if ext in {x.lower() for x in pcfg["imageExtensions"]}:
        return "image"
    if ext in {x.lower() for x in pcfg["tiffExtensions"]}:
        return "tiff"
    if ext in {x.lower() for x in pcfg["dxfExtensions"]}:
        return "dxf"
    return "unsupported"


def image_or_tiff_preview(path: Path) -> Tuple[bytes, str, dict]:
    ext = path.suffix.lower()
    if ext in {".tif", ".tiff"}:
        if Image is None:
            raise PreviewError("TIFF_ENGINE_UNAVAILABLE")
        with Image.open(path) as im:
            width, height = im.size
            frame_count = getattr(im, "n_frames", 1)
            frame = im.convert("RGBA")
            out = io.BytesIO()
            frame.save(out, format="PNG")
            return out.getvalue(), "image/png", {
                "width": width,
                "height": height,
                "frames": frame_count,
                "convertedFrom": "TIFF",
            }
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = path.read_bytes()
    meta = {}
    if Image is not None:
        try:
            with Image.open(path) as im:
                meta = {"width": im.width, "height": im.height, "frames": getattr(im, "n_frames", 1)}
        except Exception:
            pass
    return data, mime, meta


def _color_hex(entity) -> str:
    try:
        rgb = entity.rgb
        if rgb:
            return "#%02x%02x%02x" % tuple(int(v) for v in rgb)
    except Exception:
        pass
    return "#111827"


def _svg_dxf(path: Path) -> Tuple[bytes, dict]:
    if ezdxf is None:
        raise PreviewError("DXF_ENGINE_UNAVAILABLE")
    try:
        doc = ezdxf.readfile(str(path))
    except Exception as exc:
        raise PreviewError(f"DXF_READ_FAILED:{exc}") from exc
    msp = doc.modelspace()
    entities = []
    points = []
    layer_names = set()

    def pt(v):
        x, y = float(v[0]), float(v[1])
        points.append((x, y))
        return x, y

    for e in msp:
        kind = e.dxftype()
        layer_names.add(str(getattr(e.dxf, "layer", "0")))
        color = _color_hex(e)
        try:
            if kind == "LINE":
                x1, y1 = pt(e.dxf.start); x2, y2 = pt(e.dxf.end)
                entities.append(("line", (x1, y1, x2, y2, color)))
            elif kind in {"LWPOLYLINE", "POLYLINE"}:
                raw = list(e.get_points("xy")) if kind == "LWPOLYLINE" else [v.dxf.location for v in e.vertices]
                pts = [pt(v) for v in raw]
                if len(pts) >= 2:
                    closed = bool(getattr(e, "closed", False) or getattr(e, "is_closed", False))
                    entities.append(("polyline", (pts, color, closed)))
            elif kind == "CIRCLE":
                cx, cy = pt(e.dxf.center); r = abs(float(e.dxf.radius))
                points.extend([(cx-r, cy-r), (cx+r, cy+r)])
                entities.append(("circle", (cx, cy, r, color)))
            elif kind == "ARC":
                cx, cy = pt(e.dxf.center); r = abs(float(e.dxf.radius))
                points.extend([(cx-r, cy-r), (cx+r, cy+r)])
                entities.append(("arc", (cx, cy, r, float(e.dxf.start_angle), float(e.dxf.end_angle), color)))
            elif kind in {"TEXT", "MTEXT"}:
                ins = getattr(e.dxf, "insert", (0, 0, 0)); x, y = pt(ins)
                txt = e.plain_text() if hasattr(e, "plain_text") else str(getattr(e.dxf, "text", ""))
                h = float(getattr(e.dxf, "height", 2.5) or 2.5)
                entities.append(("text", (x, y, txt, h, color)))
        except Exception:
            continue

    if points:
        xs, ys = zip(*points)
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
    else:
        min_x = min_y = 0.0; max_x = max_y = 100.0
    width = max(max_x - min_x, 1.0)
    height = max(max_y - min_y, 1.0)
    pad = max(width, height) * 0.04 + 1.0
    vx, vy, vw, vh = min_x-pad, -(max_y+pad), width+2*pad, height+2*pad

    body = []
    for kind, data in entities:
        if kind == "line":
            x1,y1,x2,y2,c = data
            body.append(f'<line x1="{x1}" y1="{-y1}" x2="{x2}" y2="{-y2}" stroke="{c}"/>')
        elif kind == "polyline":
            pts,c,closed = data
            seq = " ".join(f"{x},{-y}" for x,y in pts)
            tag = "polygon" if closed else "polyline"
            body.append(f'<{tag} points="{seq}" fill="none" stroke="{c}"/>')
        elif kind == "circle":
            cx,cy,r,c = data
            body.append(f'<circle cx="{cx}" cy="{-cy}" r="{r}" fill="none" stroke="{c}"/>')
        elif kind == "arc":
            cx,cy,r,a1,a2,c = data
            x1 = cx + r*math.cos(math.radians(a1)); y1 = cy + r*math.sin(math.radians(a1))
            x2 = cx + r*math.cos(math.radians(a2)); y2 = cy + r*math.sin(math.radians(a2))
            delta = (a2-a1) % 360; large = 1 if delta > 180 else 0
            body.append(f'<path d="M {x1} {-y1} A {r} {r} 0 {large} 0 {x2} {-y2}" fill="none" stroke="{c}"/>')
        elif kind == "text":
            x,y,txt,h,c = data
            body.append(f'<text x="{x}" y="{-y}" font-size="{max(h,1)}" fill="{c}">{escape(txt)}</text>')

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx} {vy} {vw} {vh}" '
        'preserveAspectRatio="xMidYMid meet">'
        '<rect x="-1000000" y="-1000000" width="2000000" height="2000000" fill="white"/>'
        '<g stroke-width="0.6" vector-effect="non-scaling-stroke">' + "".join(body) + '</g></svg>'
    ).encode("utf-8")
    meta = {
        "width": width,
        "height": height,
        "units": str(getattr(doc, "units", "")),
        "layers": sorted(layer_names),
        "entities": len(entities),
    }
    return svg, meta


def build_preview(path_value: str, config: dict) -> Tuple[bytes, str, dict]:
    roots = [config["paths"]["ordersRoot"], config["paths"]["readyRoot"]]
    path = _safe_local_path(path_value, roots)
    if not path.is_file():
        raise PreviewError("FILE_NOT_FOUND")
    max_bytes = int(config["preview"].get("maxBytes", 200000000))
    if path.stat().st_size > max_bytes:
        raise PreviewError("FILE_TOO_LARGE")
    kind = preview_kind(path, config)
    if kind in {"image", "tiff"}:
        data, mime, meta = image_or_tiff_preview(path)
    elif kind == "dxf":
        data, meta = _svg_dxf(path)
        mime = "image/svg+xml; charset=utf-8"
    else:
        raise PreviewError("UNSUPPORTED_PREVIEW_TYPE")
    meta.update({"kind": kind, "name": path.name, "sizeBytes": path.stat().st_size})
    return data, mime, meta
