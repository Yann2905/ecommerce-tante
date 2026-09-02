from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'public'
FONT = '/usr/share/fonts/truetype/noto/NotoSerif-BoldItalic.ttf'

for size, filename in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    image = Image.new('RGB', (size, size), '#1A0800')
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            pixels[x, y] = tuple(int(a * (1 - t) + b * t) for a, b in zip((45, 27, 8), (26, 8, 0)))

    draw = ImageDraw.Draw(image)
    center = size // 2
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.23), outline='#2D1B08', width=max(1, size // 100))
    draw.ellipse((round(size * 0.13), round(size * 0.13), round(size * 0.87), round(size * 0.87)), outline='#C9A84C', width=max(2, size // 64))
    draw.ellipse((round(size * 0.165), round(size * 0.165), round(size * 0.835), round(size * 0.835)), outline='#A9863A', width=max(1, size // 150))
    font = ImageFont.truetype(FONT, round(size * 0.53))
    box = draw.textbbox((0, 0), 'E', font=font)
    draw.text((center - (box[2] - box[0]) / 2, center - (box[3] - box[1]) / 2 - size * 0.03), 'E', font=font, fill='#EBCB74')
    image.save(ROOT / filename, optimize=True)
