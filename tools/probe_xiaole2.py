# -*- coding: utf-8 -*-
# 彩蛋头像精确 QC：区分"照片肤色"(g-b 小) 与 "金黄身体"(g-b 大)
import os
import numpy as np
from PIL import Image
from scipy import ndimage

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def skin_blobs(a, x0, y0, x1, y1, label, topn=3):
    reg = a[y0:y1, x0:x1]
    r, g, b = reg[:, :, 0], reg[:, :, 1], reg[:, :, 2]
    sk = (r > 150) * (r > g + 16) * (g > b + 8) * (g - b < 85)
    lab, n = ndimage.label(sk)
    if not n:
        print('%s: 无肤色块!' % label)
        return
    szs = ndimage.sum(sk, lab, range(1, n + 1))
    order = np.argsort(-szs)[:topn]
    print('%s: 肤色块 %d 个, top%d:' % (label, n, topn))
    for o in order:
        i = int(o) + 1
        ys, xs = np.where(lab == i)
        print('   %6d px  x %4d..%4d  y %4d..%4d' % (
            int(szs[o]), x0 + xs.min(), x0 + xs.max(), y0 + ys.min(), y0 + ys.max()))

# ① 卡面（800x800）：头部应在 y 60..260, x 300..520
p = os.path.join(ROOT, '立绘', 'xiaole.png')
if os.path.exists(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.int32)
    skin_blobs(a, 260, 40, 560, 320, '卡面-头部区')
else:
    print('缺 立绘/xiaole.png')

# ② 战斗截图：全屏找肤色块
p2 = os.path.join(T, 'nl_check_xiaole.png')
if os.path.exists(p2):
    a2 = np.asarray(Image.open(p2).convert('RGB')).astype(np.int32)
    skin_blobs(a2, 0, 0, a2.shape[1], a2.shape[0], '战斗全景')
else:
    print('缺 nl_check_xiaole.png')

# ③ 对照：loving 战斗截图（无像素头，脸部为绿色绘制）——同场景同探针应几乎无肤色块
p3 = os.path.join(T, 'nl_check_battle.png')
if os.path.exists(p3):
    a3 = np.asarray(Image.open(p3).convert('RGB')).astype(np.int32)
    skin_blobs(a3, 0, 0, a3.shape[1], a3.shape[0], '对照(battle)', 2)
