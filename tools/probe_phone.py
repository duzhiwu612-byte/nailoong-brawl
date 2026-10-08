# -*- coding: utf-8 -*-
# 看笑了·手机弹道 QC：深色机身（#37474F）+ 奶油屏幕（#FFF6D8）——两枚手机在飞行中
import os
import numpy as np
from PIL import Image
from scipy import ndimage

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, '预览截图')

fail = 0
def chk(name, cond, extra=''):
    global fail
    print(('  PASS  ' if cond else '  FAIL  ') + name + (('  => ' + extra) if extra else ''))
    if not cond:
        fail += 1

p = os.path.join(T, 'nl_check_phone.png')
if not os.path.exists(p):
    print('缺截图', p)
    raise SystemExit(1)

img = Image.open(p)
a = np.asarray(img.convert('RGB')).astype(np.int32)
H, W = a.shape[:2]
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

# ① 手机机身深灰蓝 #37474F(55,71,79)
slate = (np.abs(r - 55) < 28) & (np.abs(g - 71) < 28) & (np.abs(b - 79) < 28)
lab, n = ndimage.label(slate)
blobs = []
if n:
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        sz = len(xs)
        if 120 < sz < 1500:
            blobs.append((sz, int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
blobs.sort(key=lambda t: -t[0])
print('机身色块: %d 个（面积 120-1500） %s' % (len(blobs), [bb[0] for bb in blobs[:6]]))
chk('至少 2 枚手机机身（深灰蓝机身块 ≥2）', len(blobs) >= 2, 'n=%d' % len(blobs))

# ② 每枚手机附近应有奶油色屏幕 #FFF6D8(255,246,216)
gel = (r >= 248) & (g >= 242) & (b >= 200) & (b <= 230)
ok_screens = 0
for sz, x0, x1, y0, y1 in blobs[:4]:
    m = 12
    box = gel[max(0, y0 - m):y1 + m, max(0, x0 - m):x1 + m]
    cnt = int(box.sum())
    print('  机身@(%d,%d) 尺寸=%d  →  屏幕奶油像素 %d' % (x0, y0, sz, cnt))
    if cnt > 100:
        ok_screens += 1
chk('机身内可见奶油屏幕（≥1 枚，笑脸手机屏）', ok_screens >= 1, 'screens=%d' % ok_screens)

# ③ 存档
crops = []
if blobs:
    x0 = max(0, min(bb[1] for bb in blobs[:2]) - 130)
    x1 = min(W, max(bb[2] for bb in blobs[:2]) + 130)
    y0 = max(0, min(bb[3] for bb in blobs[:2]) - 150)
    y1 = min(H, max(bb[4] for bb in blobs[:2]) + 160)
    img.crop((x0, y0, x1, y1)).save(os.path.join(OUT, '彩蛋_4_手机弹道特写.png'))
    print('  存档 -> 预览截图/彩蛋_4_手机弹道特写.png')
img.save(os.path.join(OUT, '彩蛋_5_手机弹道全景.png'))
print('  存档 -> 预览截图/彩蛋_5_手机弹道全景.png')

print('')
print('========================================')
print('  手机弹道 QC：通过 %d / 失败 %d' % (3 - fail, fail))
print('========================================')
