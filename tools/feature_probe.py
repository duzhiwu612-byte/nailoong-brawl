# -*- coding: utf-8 -*-
# 定点探针：头部/中部区的颜色 + 特征色统计（判断装饰是否存在）
import numpy as np
from PIL import Image

IDS = ['loving','dark','rage','war','nailoong','void','tender','divine','sad']
NAMES = {'loving':'慈爱','dark':'暗黑','rage':'愤怒','war':'战斗','nailoong':'奶龙',
         'void':'空虚','tender':'温柔','divine':'神龙','sad':'忧郁'}

def qtop(px, n=3):
    if not len(px): return '无'
    q = px // 32
    keys = q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2]
    vals, cnts = np.unique(keys, return_counts=True)
    order = np.argsort(-cnts)[:n]
    out = []
    for o in order:
        k = int(vals[o])
        rgb = ((k // 64) * 32 + 16, ((k // 8) % 8) * 32 + 16, (k % 8) * 32 + 16)
        out.append('%s:%d%%' % (rgb, int(cnts[o] * 100 / len(keys))))
    return ' '.join(out)

def cen(xs, ys):
    return '(%.2f,%.2f)' % (xs.mean() / 254.0, ys.mean() / 254.0) if len(xs) else ''

for cid in IDS:
    a = np.asarray(Image.open('tools/原版素材/bili/cut/%s_src.png' % cid).convert('RGBA')).astype(np.int32)
    alpha = a[:, :, 3]
    m = alpha > 64
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    bh = y1 - y0 + 1
    solid = a[alpha > 160]
    px = solid[:, :3]
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    pcts = [int(np.percentile(lum, p)) for p in (5, 20, 50, 80, 95)]
    # 区域取样
    def region(ya, yb):
        rr = a[y0 + int(bh * ya): y0 + int(bh * yb)]
        mm = rr[:, :, 3] > 160
        return rr[mm][:, :3]
    head = qtop(region(0.02, 0.15), 4)
    mid = qtop(region(0.40, 0.60), 4)
    # 特征色
    def stat(mask, name):
        n = int(mask.sum())
        if n < 40: return ''
        cys, cxs = np.where(mask.reshape(-1)) if mask.ndim == 1 else (None, None)
        return ' %s=%d(%.1f%%)' % (name, n, n * 100.0 / len(px))
    pink = (r > 210) * (g < 170) * (r - g > 50)
    white = (r > 225) * (g > 225) * (b > 225)
    graybl = (abs(r - g) < 25) * (abs(g - b) < 25) * (r > 90) * (r < 190)
    orange = (r > 220) * (g > 120) * (g < 210) * (b < 110)
    cream = (r > 225) * (g > 195) * (b > 150) * (b < 215)
    darkn = lum < 60
    print('[%s] lum p5/20/50/80/95 = %s' % (NAMES[cid], pcts))
    print('   头区: %s' % head)
    print('   中区: %s' % mid)
    print('   色统计: pink=%.1f%% white=%.1f%% gray=%.1f%% orange=%.1f%% cream=%.1f%% verydark=%.1f%%' % (
        pink.sum() * 100.0 / len(px), white.sum() * 100.0 / len(px), graybl.sum() * 100.0 / len(px),
        orange.sum() * 100.0 / len(px), cream.sum() * 100.0 / len(px), darkn.sum() * 100.0 / len(px)))
