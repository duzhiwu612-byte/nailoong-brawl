# -*- coding: utf-8 -*-
# 5 位班友照片 → 像素风头部素材 v2：u2net 抠图 + 自动兜底「圆角贴纸」模式
# 输出: 立绘/<id>_head.png (96x96) + 素材预览
import os
import numpy as np
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter
from scipy import ndimage

os.environ.setdefault('HF_ENDPOINT', 'https://hf-mirror.com')
from rembg import new_session, remove

D = 'tools/新角色素材'
OUTDIR = '立绘'
sess = new_session('u2net')

# (id, 文件, 裁切框, 模式)  模式: u2net=抠图, round=圆角贴纸, auto=抠图失败自动兜底
CHARTS = [
    ('kugua',   'kugua.jpg',   (228, 148, 452, 372), 'u2net'),
    ('laser',   'laser.jpg',   (16, 270, 660, 795),  'round'),
    ('tallguy', 'tallguy.jpg', (492, 325, 818, 800), 'u2net'),
    ('jiuyi',   'jiuyi.jpg',   (418, 556, 742, 924), 'u2net'),
    ('laobai',  'laobai.jpg',  (428, 448, 705, 735), 'auto'),
]
HAND = ('jiuyi_hand', 'jiuyi.jpg', (1140, 1000, 1415, 1205))


def cutout_main(crop):
    cut = remove(crop, session=sess, alpha_matting=False)
    ca = np.asarray(cut).copy()
    al = ca[:, :, 3] > 40
    lab, n = ndimage.label(al)
    if n > 1:
        sz = ndimage.sum(al, lab, range(1, n + 1))
        keep = lab == (int(np.argmax(sz)) + 1)
        ca[:, :, 3] = np.where(keep, ca[:, :, 3], 0)
    return ca


def u2net_stats(crop):
    """返回 (ca, skin_ratio, tight_box, fill) 或 None"""
    ca = cutout_main(crop)
    a = np.asarray(ca)
    ys, xs = np.where(a[:, :, 3] > 40)
    if len(ys) == 0:
        return None
    kept = a[a[:, :, 3] > 40]
    r = kept[:, 0].astype(np.int32); g = kept[:, 1].astype(np.int32); b = kept[:, 2].astype(np.int32)
    skin = float(((r > 130) & (r > g + 12) & (g > b + 3)).mean())
    box = (int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1))
    fill = float((a[:, :, 3] > 40).sum()) / (a.shape[0] * a.shape[1])
    return ca, skin, box, fill


def to_square(ca, grid=48, outline=True):
    a = np.asarray(ca)
    ys, xs = np.where(a[:, :, 3] > 40)
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    head = Image.fromarray(ca).crop((x0, y0, x1 + 1, y1 + 1))
    hw, hh = head.size
    side = int(max(hw, hh) * 1.12)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(head, ((side - hw) // 2, int((side - hh) * 0.40)), head)
    return finish(canvas, grid, outline)


def round_sticker(crop, grid=48, radius=0.24):
    """圆角贴纸：原图裁切 → 方画布 → 圆角遮罩 → 像素化描边"""
    w, h = crop.size
    side = max(w, h)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - w) // 2, (side - h) // 2))
    mask = Image.new('L', (side, side), 0)
    dr = ImageDraw.Draw(mask)
    r = int(side * radius)
    dr.rounded_rectangle((0, 0, side - 1, side - 1), radius=r, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    canvas.putalpha(mask)
    return finish(canvas, grid, True)


def finish(canvas, grid, outline):
    small = canvas.resize((grid, grid), Image.LANCZOS)
    rgb = small.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(1.18)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    rgb = rgb.quantize(colors=24, method=Image.MEDIANCUT).convert('RGB')
    sa = np.asarray(small)[:, :, 3]
    al2 = sa > 110
    px = np.asarray(rgb).copy()
    out = np.dstack([px, np.where(al2, 255, 0)]).astype(np.uint8)
    if outline:
        dil = ndimage.binary_dilation(al2, iterations=1)
        edge = dil * (1 - al2)
        edge_rgb = np.array([62, 42, 28], dtype=np.uint8)
        out[edge.astype(bool)] = np.concatenate([edge_rgb, [255]]).astype(np.uint8)
    pix48 = Image.fromarray(out)
    fill = float(al2.sum()) / (grid * grid)
    return pix48, fill


def qc(pix48, tag):
    fin = np.asarray(pix48).astype(np.int32)
    solid = fin[fin[:, :, 3] > 100]
    rr, gg, bb = solid[:, 0], solid[:, 1], solid[:, 2]
    skin = float(((rr > 130) * (rr > gg + 12)).sum()) / max(1, len(solid))
    dark = float((0.299 * rr + 0.587 * gg + 0.114 * bb < 70).sum()) / max(1, len(solid))
    print('  QC %s: 实心=%d 肤色=%.2f 深色=%.2f' % (tag, len(solid), skin, dark))
    return skin


for cid, fn, box, mode in CHARTS:
    src = Image.open(os.path.join(D, fn)).convert('RGB')
    crop = src.crop(box)
    crop.save(os.path.join(D, 'crop_' + cid + '.png'))
    used = mode
    pix48 = None
    if mode in ('u2net', 'auto'):
        st = u2net_stats(crop)
        if st is not None:
            ca, skin, tbox, fill = st
            ok = skin > 0.15 and min(tbox) > 110 and fill > 0.10
            print('%s: u2net skin=%.2f tight=%dx%d fill=%.2f %s' % (cid, skin, tbox[0], tbox[1], fill, 'OK' if ok else '不合格'))
            if ok or mode == 'u2net':
                pix48, fill2 = to_square(ca)
        if (pix48 is None or not ok) and mode == 'auto':
            used = 'round'
            pix48, fill2 = round_sticker(crop)
    elif mode == 'round':
        pix48, fill2 = round_sticker(crop)
    if pix48 is None:
        print('!! %s 失败' % cid)
        continue
    pix96 = pix48.resize((96, 96), Image.NEAREST)
    pix96.save(os.path.join(OUTDIR, cid + '_head.png'))
    pix96.resize((240, 240), Image.NEAREST).save(os.path.join(D, 'preview_' + cid + '.png'))
    print('%s: 模式=%s grid_fill=%.2f' % (cid, used, fill2))
    qc(pix48, cid)

# 九一手部
cid, fn, box = HAND
src = Image.open(os.path.join(D, fn)).convert('RGB')
crop = src.crop(box)
ca = cutout_main(crop)
a = np.asarray(ca)
ys, xs = np.where(a[:, :, 3] > 40)
if len(ys):
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    hand = Image.fromarray(ca).crop((x0, y0, x1 + 1, y1 + 1))
    w, h = hand.size
    s = 96.0 / max(w, h)
    hand = hand.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    hand.save(os.path.join(OUTDIR, 'jiuyi_hand.png'))
    crop.save(os.path.join(D, 'crop_jiuyi_hand.png'))
    print('jiuyi_hand: tight %dx%d -> 输出 %dx%d' % (x1 - x0 + 1, y1 - y0 + 1, hand.size[0], hand.size[1]))
else:
    print('!! jiuyi_hand 失败')
print('ALL DONE')
