"""Build PWA icons from the notification clock glyph."""

from PIL import Image

BASE = "public/notify-icon.png"


def save_resized(image, size, path):
    image.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG")
    print(f"Wrote {path} ({size}x{size})")


def save_maskable(image, size, path):
    canvas = Image.new("RGBA", (size, size), (243, 238, 228, 255))
    inner = int(size * 0.72)
    glyph = image.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(glyph, (offset, offset), glyph)
    canvas.save(path, "PNG")
    print(f"Wrote {path} ({size}x{size} maskable)")


def main():
    icon = Image.open(BASE).convert("RGBA")
    save_resized(icon, 180, "public/apple-touch-icon.png")
    save_resized(icon, 192, "public/icon-192.png")
    save_resized(icon, 512, "public/icon-512.png")
    save_maskable(icon, 512, "public/icon-512-maskable.png")


if __name__ == "__main__":
    main()
