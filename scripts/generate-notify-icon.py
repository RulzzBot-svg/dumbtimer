"""Rasterize a square clock icon for Chrome desktop notifications."""

from PIL import Image, ImageDraw

SIZE = 256
OUTPUT = "public/notify-icon.png"


def draw_line(draw, start, end, fill, width):
    draw.line([start, end], fill=fill, width=width)
    radius = width // 2
    for point in (start, end):
        box = [
            point[0] - radius,
            point[1] - radius,
            point[0] + radius,
            point[1] + radius,
        ]
        draw.ellipse(box, fill=fill)


def main():
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    cream = (243, 238, 228, 255)
    face = (255, 252, 246, 255)
    ink = (28, 25, 21, 255)
    rust = (194, 78, 36, 255)

    draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=56, fill=cream)

    cx = cy = SIZE // 2
    radius = 78
    draw.ellipse(
        (cx - radius, cy - radius, cx + radius, cy + radius),
        fill=face,
        outline=ink,
        width=12,
    )

    draw_line(draw, (cx, cy - 44), (cx, cy), rust, 12)
    draw_line(draw, (cx, cy), (cx + 36, cy + 20), rust, 12)
    draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=ink)

    image.save(OUTPUT, "PNG")
    print(f"Wrote {OUTPUT} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
