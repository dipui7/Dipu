"""Create web-sized copies of the gallery photos.

Usage (from the repo root):  python3 scripts/optimize_images.py
Reads images/p<N>.jpg|JPG and writes images/web/p<N>-800.webp (grid) and
images/web/p<N>-1800.webp (full-screen viewer). Requires Pillow.
"""
import glob
import os
import re

from PIL import Image, ImageOps

os.makedirs('images/web', exist_ok=True)
for path in glob.glob('images/p[0-9]*.*'):
    n = int(re.findall(r'\d+', os.path.basename(path))[0])
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    for width in (800, 1800):
        out = f'images/web/p{n}-{width}.webp'
        if os.path.exists(out):
            continue
        copy = im.copy()
        if copy.width > width:
            copy = copy.resize((width, round(copy.height * width / copy.width)), Image.LANCZOS)
        copy.save(out, 'WEBP', quality=80 if width == 800 else 82, method=6)
        print('wrote', out)
