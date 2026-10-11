# -*- coding: utf-8 -*-
# v0.11 设计打磨 QC：① 转场淡出（亮度比）② 开场下落（对照差值）③ 残血脉冲（红圈像素）
# 截图目录默认 预览截图/，可用环境变量 NL_DESIGN_DIR 指定（线上复验复用）
import os
import sys
import numpy as np
from PIL import Image

DIR = os.environ.get('NL_DESIGN_DIR') or os.path.join(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..')), '预览截图')

fail = 0


def chk(name, cond, extra=''):
    global fail
    print(('  PASS  ' if cond else '  FAIL  ') + name + (('  => ' + extra) if extra else ''))
    if not cond:
        fail += 1


def load(name):
    p = os.path.join(DIR, name + '.png')
    if not os.path.exists(p):
        print('  缺截图 %s' % p)
        return None
    return np.asarray(Image.open(p).convert('RGB')).astype(np.int32)


title = load('设计_0_标题对照')
trans = load('设计_3_转场淡出')
intro = load('设计_1_开场下落')
intro2 = load('设计_2_开场对照')
lowhp = load('设计_4_残血脉冲')

# ① 转场：黑场淡出中段，整体亮度应约为原场景的 44%
if title is not None and trans is not None:
    lb = float(title.mean())
    lt = float(trans.mean())
    ratio = lt / max(1e-6, lb)
    chk('转场淡出亮度比 %.2f（0.25~0.65 = 黑场中段）' % ratio, 0.25 < ratio < 0.65,
        '标题亮度=%.1f 转场=%.1f' % (lb, lt))

# ② 开场下落：与同刻站立对照组相比，双人出生区应有大量像素差异，且差异上界更高
if intro is not None and intro2 is not None:
    x0, y0, x1, y1 = 250, 300, 1030, 640
    a = intro[y0:y1, x0:x1]
    b = intro2[y0:y1, x0:x1]
    diff = (np.abs(a - b).sum(axis=2) > 90)
    n = int(diff.sum())
    top = -1
    ys, xs = np.where(diff)
    if n > 0:
        top = int(ys.min()) + y0
    chk('开场下落 vs 站立：差异像素 %d（>1500）' % n, n > 1500)
    chk('空中人物出现在画面上部（差异上界 y=%d < 430）' % top, 0 <= top < 430)

# ③ 残血脉冲：P1 血条外圈红色呼吸环
if lowhp is not None:
    reg = lowhp[28:92, 80:560]
    r, g, b = reg[:, :, 0], reg[:, :, 1], reg[:, :, 2]
    red = int(((r > 165) & (g < 95) & (b < 95)).sum())
    chk('残血警示红圈像素 %d（>150）' % red, red > 150)

print('---')
print('design QC: ' + ('全部通过 OK' if fail == 0 else ('失败 %d 项 FAIL' % fail)))
sys.exit(1 if fail else 0)
