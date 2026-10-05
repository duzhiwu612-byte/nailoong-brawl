# -*- coding: utf-8 -*-
# 九形态「原画 vs 建模」对比 v2：修正几何（防裁切/防混入）+ 亮度/奶油色统计
# 用法: .venv-gfx/Scripts/python.exe tools/compare_models.py <对比图.png>
import sys
import numpy as np
from PIL import Image

IDS = ['loving','dark','rage','war','nailoong','void','tender','divine','sad']
NAMES = {'loving':'慈爱','dark':'暗黑','rage':'愤怒','war':'战斗','nailoong':'奶龙',
         'void':'空虚','tender':'温柔','divine':'神龙','sad':'忧郁'}
M, TOP, CW, CH, GX, GY = 40, 140, 660, 760, 20, 20

def analyze(im, x0, y0, x1, y1):
    arr = np.asarray(im.crop((x0, y0, x1, y1))).astype(np.int32)
    dist = (255-arr[:,:,0]) + (255-arr[:,:,1]) + (255-arr[:,:,2])
    mask = dist > 90
    if mask.sum() < 50:
        return None
    lab = None
    try:
        from scipy import ndimage
        lab, n = ndimage.label(mask)
        if n > 1:
            sizes = ndimage.sum(mask, lab, range(1, n+1))
            main = int(np.argmax(sizes)) + 1
            mask = lab == main
    except Exception:
        pass
    ys, xs = np.where(mask)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    bw, bh = int(bx1-bx0+1), int(by1-by0+1)
    fill = len(xs) / float(bw*bh)
    prof = []
    for i in range(12):
        lo = by0 + bh*i//12; hi = by0 + bh*(i+1)//12
        band = mask[lo:hi, :]
        colw = np.where(band.any(axis=0))[0]
        prof.append(round(float((colw.max()-colw.min()+1)/float(bw)), 2) if len(colw) else 0.0)
    px = arr[mask]
    r, g, b = px[:,0], px[:,1], px[:,2]
    lum = 0.299*r + 0.587*g + 0.114*b
    verydark = float((lum < 60).sum() * 100.0 / len(px))
    cream = float(((r>225)*(g>210)*(b>170)*(b<235)).sum() * 100.0 / len(px))
    pcts = [int(np.percentile(lum, p)) for p in (5, 50)]
    # 主色（排除近白/背景，保留奶油色）
    keep = ((255-r)+(255-g)+(255-b)) > 90
    cols = None
    if keep.sum() > 30:
        q = (px[keep][:, :3] // 32)
        keys = q[:,0]*64 + q[:,1]*8 + q[:,2]
        vals, cnts = np.unique(keys, return_counts=True)
        order = np.argsort(-cnts)[:6]
        cols = []
        for o in order:
            k = int(vals[o])
            rgb = ((k//64)*32+16, ((k//8)%8)*32+16, (k%8)*32+16)
            cols.append((rgb, round(float(cnts[o]*100.0/len(keys)), 1)))
    return {'bw':bw, 'bh':bh, 'fill':round(fill,3), 'prof':prof,
            'cols':cols, 'vd':round(verydark,1), 'cr':round(cream,1), 'lum':pcts}

def cdist(c1, c2):
    return sum((a-b)**2 for a, b in zip(c1, c2)) ** 0.5

im = Image.open(sys.argv[1]).convert('RGB')
print('='*104)
for i, cid in enumerate(IDS):
    r, c = divmod(i, 3)
    x0 = M + c*(CW+GX); y0 = TOP + r*(CH+GY)
    o = analyze(im, x0+18, y0+14, x0+CW-18, y0+354)
    g = analyze(im, x0+18, y0+368, x0+CW-18, y0+720)
    if not o or not g:
        print('%s %s: 区域为空!' % (cid, NAMES[cid])); continue
    ds = []
    for (rgb, _pct) in (o['cols'] or []):
        ds.append(min(cdist(rgb, rgb2) for rgb2, _ in (g['cols'] or [(rgb,0)])))
    pd = sum(abs(a-b) for a, b in zip(o['prof'], g['prof'])) / 12.0
    print('[%s %s] 原画 %dx%d(%.2f) fill%.2f 极暗%.1f%% 奶油%.1f%% lum%s | 建模 %dx%d(%.2f) fill%.2f 极暗%.1f%% 奶油%.1f%% lum%s | 分布差%.2f' % (
        NAMES[cid], cid, o['bw'], o['bh'], o['bw']/o['bh'], o['fill'], o['vd'], o['cr'], o['lum'],
        g['bw'], g['bh'], g['bw']/g['bh'], g['fill'], g['vd'], g['cr'], g['lum'], pd))
    print('   原画色: ' + ' '.join('%s:%s' % (rgb, p) for rgb, p in (o['cols'] or [])))
    print('   建模色: ' + ' '.join('%s:%s' % (rgb, p) for rgb, p in (g['cols'] or [])))
    print('   主色距离: ' + ' '.join('%.0f' % d for d in ds) + ('  <-- 大偏差' if max(ds or [0]) > 60 else ''))
    print('   原画带: %s' % o['prof'])
    print('   建模带: %s' % g['prof'])
