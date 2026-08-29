#!/usr/bin/env python3
"""Build Chrome Web Store icon + flatten screenshots to 1280x800 24-bit PNG."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "extension" / "store"
CREAM = (243, 238, 228)
FACE = (255, 252, 246)
INK = (28, 25, 21)
RUST = (194, 78, 36)


def draw_line(draw, start, end, fill, width):
    draw.line([start, end], fill=fill, width=width)
    radius = width // 2
    for point in (start, end):
        box = [point[0] - radius, point[1] - radius, point[0] + radius, point[1] + radius]
        draw.ellipse(box, fill=fill)


def write_store_icon():
    size = 512
    image = Image.new("RGB", (size, size), CREAM)
    draw = ImageDraw.Draw(image)
    cx = cy = size // 2
    radius = 168
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=FACE, outline=INK, width=24)
    draw_line(draw, (cx, cy - 88), (cx, cy), RUST, 24)
    draw_line(draw, (cx, cy), (cx + 72, cy + 40), RUST, 24)
    draw.ellipse((cx - 16, cy - 16, cx + 16, cy + 16), fill=INK)
    icon = image.resize((128, 128), Image.Resampling.LANCZOS)
    path = STORE / "icon-128.png"
    icon.save(path, "PNG")
    print(f"Wrote {path} {icon.size} {icon.mode}")


def flatten_screenshot(source, dest, size=(1280, 800)):
    image = Image.open(source).convert("RGB")
    target_w, target_h = size
    # Cover-crop to the store size.
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = max(0, (resized.height - target_h) // 6)  # bias toward the top (clock / UI)
    if top + target_h > resized.height:
        top = resized.height - target_h
    cropped = resized.crop((left, top, left + target_w, top + target_h))
    cropped.save(dest, "PNG")
    print(f"Wrote {dest} {cropped.size} {cropped.mode}")


def main():
    STORE.mkdir(parents=True, exist_ok=True)
    write_store_icon()
    raw = STORE / "raw"
    if raw.exists():
        mapping = [
            ("desk.png", "screenshot-1-desk.png"),
            ("popup.png", "screenshot-2-popup.png"),
            ("nightstand.png", "screenshot-3-nightstand.png"),
            ("ping.png", "screenshot-4-gif-ping.png"),
            ("account.png", "screenshot-5-account.png"),
        ]
        for src_name, dest_name in mapping:
            src = raw / src_name
            if src.exists():
                flatten_screenshot(src, STORE / dest_name)


if __name__ == "__main__":
    main()
