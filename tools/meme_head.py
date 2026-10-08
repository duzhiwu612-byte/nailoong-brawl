# -*- coding: utf-8 -*-
# 表情包头像 → 像素风头部素材（看笑了大叔）
# 输出: tools/原版素材/meme/ 下 head_crop.png / head_cut.png / head_px{48,96,144}.png
#       + _mirror 版本 + preview.png（给用户看的对比拼图）
import os
import sys
import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage

SRC = r'C:\Users\hp\AppData\Roaming\Hermes\composer-images\composer_2026-10-08_01-26-52-960_b3fcb5.jpg'
OUT = 'tools/原版素材/meme'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
W, H = im.size
print('src size: %dx%d' % (W, H))
a = np.asarray(im).astype(np.int32)
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

# 1) 头部框（探针地图人工定位：头顶 y≈15，下巴 y≈355；脸+耳 x≈233..485，左右留边）
hx0, hy0, hx1, hy1 = 225, 12, 505, 360
print('HEAD box: (%d,%d)-(%d,%d) %dx%d' % (hx0, hy0, hx1, hy1, hx1 - hx0, hy1 - hy0))
crop = im.crop((hx0, hy0, hx1, hy1))
crop.save(os.path.join(OUT, 'head_crop.png'))

# 3) rembg 抠图（u2net，本地已缓存）
os.environ.setdefault('HF_ENDPOINT', 'https://hf-mirror.com')
from rembg import new_session, remove
sess = new_session('u2net')
cut = remove(crop, session=sess, alpha_matting=False)
ca = np.asarray(cut).copy()
al = ca[:, :, 3] > 40
lab2, n2 = ndimage.label(al)
if n2 > 1:
    sz = ndimage.sum(al, lab2, range(1, n2 + 1))
    keep = lab2 == (int(np.argmax(sz)) + 1)
    ca[:, :, 3] = np.where(keep, ca[:, :, 3], 0)
    print('components %d -> keep main' % n2)
ys, xs = np.where(ca[:, :, 3] > 40)
y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
head = Image.fromarray(ca).crop((x0, y0, x1 + 1, y1 + 1))
print('head tight: %dx%d' % head.size)
hw, hh = head.size

# 4) 方形画布（脸居中偏上）
side = int(max(hw, hh) * 1.12)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
canvas.paste(head, ((side - hw) // 2, int((side - hh) * 0.40)), head)

# 5) 像素化：缩到 48 → 增色 → 量化 24 色 → 描边 → 最近邻放大
GRID = 48
small = canvas.resize((GRID, GRID), Image.LANCZOS)
rgb = small.convert('RGB')
rgb = ImageEnhance.Color(rgb).enhance(1.18)
rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
rgb = rgb.quantize(colors=24, method=Image.MEDIANCUT).convert('RGB')
sa = np.asarray(small)[:, :, 3]
al2 = sa > 110
dil = ndimage.binary_dilation(al2, iterations=1)
edge = dil * (1 - al2)
px = np.asarray(rgb).copy()
out = np.dstack([px, np.where(al2, 255, 0)]).astype(np.uint8)
edge_rgb = np.array([62, 42, 28], dtype=np.uint8)
out[edge.astype(bool)] = np.concatenate([edge_rgb, [255]]).astype(np.uint8)
pix48 = Image.fromarray(out)
pix96 = pix48.resize((96, 96), Image.NEAREST)
pix144 = pix48.resize((144, 144), Image.NEAREST)
pix48.save(os.path.join(OUT, 'head_px48.png'))
pix96.save(os.path.join(OUT, 'head_px96.png'))
pix144.save(os.path.join(OUT, 'head_px144.png'))
pix48.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(OUT, 'head_px48_mirror.png'))
pix96.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(OUT, 'head_px96_mirror.png'))
print('pixel assets saved')

# 6) 方向检测：肤色质心 vs 整体质心（48 网格）
qq = np.asarray(rgb).astype(np.int32)
skm = (qq[:, :, 0] > 130) * (qq[:, :, 0] > qq[:, :, 1] + 12) * (qq[:, :, 1] > qq[:, :, 2] + 5)
skm = skm * out[:, :, 3].astype(bool)
hy, hx = np.where(out[:, :, 3] > 100)
if skm.sum() > 20:
    sx = np.where(skm)[1].mean()
    print('face_cx=%.1f head_cx=%.1f -> 判定脸朝 %s（原始方向）' % (sx, hx.mean(), '左 LEFT' if sx < hx.mean() else '右 RIGHT'))
else:
    print('方向判定样本不足，需人工看 preview')

# 7) 预览拼图（原裁切 | 抠图 | 像素正面 | 像素镜像）
panel = 240
def fit(img, s=panel):
    im2 = img.convert('RGBA')
    im2.thumbnail((s, s), Image.LANCZOS)
    bg = Image.new('RGBA', (s, s), (250, 246, 232, 255))
    bg.paste(im2, ((s - im2.size[0]) // 2, (s - im2.size[1]) // 2), im2)
    return bg
prev = Image.new('RGB', (panel * 4 + 30, panel + 20), (250, 246, 232))
for i, img in enumerate([crop, cut, pix96, pix96.transpose(Image.FLIP_LEFT_RIGHT)]):
    prev.paste(fit(img).convert('RGB'), (i * (panel + 10) + 5, 10))
prev.save(os.path.join(OUT, 'preview.png'))
print('preview saved ->', os.path.join(OUT, 'preview.png'))

# 8) 快速 QC 数值
final = np.asarray(pix48).astype(np.int32)
solid = final[final[:, :, 3] > 100]
if len(solid):
    rr, gg, bb = solid[:, 0], solid[:, 1], solid[:, 2]
    skin_ratio = float(((rr > 130) * (rr > gg + 12)).sum()) / len(solid)
    dark_ratio = float((0.299 * rr + 0.587 * gg + 0.114 * bb < 70).sum()) / len(solid)
    print('QC: 实心像素=%d 肤色占比=%.2f 深色(头发/眉/眼)占比=%.2f 填充率=%.2f' % (
        len(solid), skin_ratio, dark_ratio, al2.sum() / (GRID * GRID)))
