# -*- coding: utf-8 -*-
# 原画（cut 抠图）权威测量：包围盒/宽度分布/主色/独立元素（装饰/阴影）
# 用法: .venv-gfx/Scripts/python.exe tools/ref_metrics.py
import numpy as np
from PIL import Image
from scipy import ndimage

IDS = ['loving','dark','rage','war','nailoong','void','tender','divine','sad']
NAMES = {'loving':'慈爱','dark':'暗黑','rage':'愤怒','war':'战斗','nailoong':'奶龙',
         'void':'空虚','tender':'温柔','divine':'神龙','sad':'忧郁'}

def metrics(path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int32)
    alpha = a[:, :, 3]
    m = alpha > 64
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    bw, bh = int(x1 - x0 + 1), int(y1 - y0 + 1)
    fill = m[y0:y1+1, x0:x1+1].sum() / float(bw * bh)
    # 12 段宽度
    prof = []
    for i in range(12):
        lo = y0 + bh * i // 12; hi = y0 + bh * (i + 1) // 12
        band = m[lo:hi, :]
        colw = np.where(band.any(axis=0))[0]
        prof.append(round((colw.max() - colw.min() + 1) / float(bw), 2) if len(colw) else 0.0)
    # 主色（alpha>160 的实心像素，量化 32）
    solid = a[alpha > 160]
    px = solid[:, :3]
    q = px // 32
    keys = q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2]
    vals, cnts = np.unique(keys, return_counts=True)
    order = np.argsort(-cnts)[:7]
    cols = []
    for o in order:
        k = int(vals[o])
        rgb = ((k // 64) * 32 + 16, ((k // 8) % 8) * 32 + 16, (k % 8) * 32 + 16)
        cols.append((rgb, round(cnts[o] * 100.0 / len(keys), 1)))
    # 独立元素（连通域）
    lab, n = ndimage.label(m)
    comps = []
    for i in range(1, n + 1):
        csz = int((lab == i).sum())
        if csz < 80: continue
        cys, cxs = np.where(lab == i)
        comps.append((csz, int(cxs.mean()), int(cys.mean()), int(cxs.min()), int(cxs.max()), int(cys.min()), int(cys.max())))
    comps.sort(key=lambda t: -t[0])
    # 红色像素（暗黑红瞳检测）
    red = solid[(solid[:, 0] > 120) * (solid[:, 0] > solid[:, 1] + 50) * (solid[:, 0] > solid[:, 2] + 50)]
    print('=' * 92)
    print('[%s %s] bbox %dx%d  宽高比(w/h)=%.2f  fill=%.2f  实心px=%d' % (NAMES[IDS[0]] if False else '', '', 0, 0, 0, 0, 0))
    return None

def run(path, cid):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int32)
    alpha = a[:, :, 3]
    m = alpha > 64
    ys, xs = np.where(m)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    fill = m[y0:y1+1, x0:x1+1].sum() / float(bw * bh)
    prof = []
    for i in range(12):
        lo = y0 + bh * i // 12; hi = y0 + bh * (i + 1) // 12
        band = m[lo:hi, :]
        colw = np.where(band.any(axis=0))[0]
        prof.append(round((colw.max() - colw.min() + 1) / float(bw), 2) if len(colw) else 0.0)
    solid = a[alpha > 160]
    px = solid[:, :3]
    q = px // 32
    keys = q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2]
    vals, cnts = np.unique(keys, return_counts=True)
    order = np.argsort(-cnts)[:7]
    cols = []
    for o in order:
        k = int(vals[o])
        rgb = ((k // 64) * 32 + 16, ((k // 8) % 8) * 32 + 16, (k % 8) * 32 + 16)
        cols.append((rgb, round(cnts[o] * 100.0 / len(keys), 1)))
    lab, n = ndimage.label(m)
    comps = []
    for i in range(1, n + 1):
        csz = int((lab == i).sum())
        if csz < 60: continue
        cys, cxs = np.where(lab == i)
        comps.append((csz, int(cxs.min()), int(cxs.max()), int(cys.min()), int(cys.max())))
    comps.sort(key=lambda t: -t[0])
    red_n = int(((solid[:, 0] > 120) * (solid[:, 0] > solid[:, 1] + 50) * (solid[:, 0] > solid[:, 2] + 50)).sum())
    print('=' * 96)
    print('[%s %s] bbox %dx%d (w/h=%.2f) fill=%.2f solid_px=%d red_px=%d(%.1f%%)' % (
        NAMES[cid], cid, bw, bh, bw / float(bh), fill, len(keys), red_n, red_n * 100.0 / max(1, len(keys))))
    print('  bands: %s' % prof)
    print('  colors: %s' % ' '.join('%s:%s%%' % (rgb, p) for rgb, p in cols))
    for ist, cx0, cx1, cy0, cy1 in comps[:5]:
        print('  comp px=%-6d x %3d..%3d y %3d..%3d  (rel w=%.2f h=%.2f, y居%.2f)' % (
            ist, cx0, cx1, cy0, cy1,
            (cx1 - cx0 + 1) / float(bw), (cy1 - cy0 + 1) / float(bh), (cy0 + cy1) / 2.0 / bh))

base = 'tools/原版素材/bili/cut/'
for cid in IDS:
    run(base + cid + '_src.png', cid)
