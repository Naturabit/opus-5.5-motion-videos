"""White-background versions and a contact sheet from the transparent renders.

Run after render.py:  python finish_renders.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RENDERS = Path(__file__).resolve().parent.parent / "renders"
ORDER = ["front", "three-quarter", "right", "back", "left"]


def main():
    tiles = []
    for name in ORDER:
        src = RENDERS / f"{name}.png"
        if not src.exists():
            continue
        im = Image.open(src).convert("RGBA")
        white = Image.new("RGBA", im.size, (255, 255, 255, 255))
        white.alpha_composite(im)
        white.convert("RGB").save(RENDERS / f"{name}-white.png", optimize=True)
        tiles.append((name, white.convert("RGB")))

    if not tiles:
        return
    t = 900
    pad = 40
    sheet = Image.new("RGB", (len(tiles) * t, t + pad), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 24)
    except OSError:
        font = ImageFont.load_default()
    for i, (name, im) in enumerate(tiles):
        sheet.paste(im.resize((t, t), Image.LANCZOS), (i * t, 0))
        draw.text((i * t + t // 2, t + pad // 2), name, fill=(60, 60, 60), font=font, anchor="mm")
    sheet.save(RENDERS / "contact-sheet.png", optimize=True)


if __name__ == "__main__":
    main()
