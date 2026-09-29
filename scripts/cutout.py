# Usage: python3 scripts/cutout.py <amazon-main-image.jpg> <assets/products/name-bottle.png>
# Removes the white background from an Amazon MAIN image (needs: pip install pillow numpy).
import sys, numpy as np
from PIL import Image, ImageFilter
from collections import deque
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int)
h, w, _ = a.shape
bright = (a.min(axis=2) > 238) & ((a.max(axis=2) - a.min(axis=2)) < 12)
bg = np.zeros((h, w), bool); q = deque()
for x in range(w):
    for y in (0, h-1):
        if bright[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w-1):
        if bright[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y+dy, x+dx
        if 0 <= ny < h and 0 <= nx < w and bright[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
alpha = Image.fromarray(np.where(bg, 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
out = im.convert('RGBA'); out.putalpha(alpha)
out = out.crop(out.getbbox()); out.save(dst); print(dst, out.size)
