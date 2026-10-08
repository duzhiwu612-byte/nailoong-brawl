# -*- coding: utf-8 -*-
# 手机端截图核查：虚拟按键（金色圆环）/ 旋转提示 / 桌面无污染
import os
import numpy as np
from PIL import Image

OUT = '预览截图'

def load(name):
    p = os.path.join(OUT, name)
    if not os.path.exists(p):
        return None
    return np.asarray(Image.open(p).convert('RGB')).astype(np.int32)

def gold_count(a, box):
    x0, y0, x1, y1 = box
    x1 = min(x1, a.shape[1]); y1 = min(y1, a.shape[0])
    s = a[y0:y1, x0:x1]
    r, g, b = s[:, :, 0], s[:, :, 1], s[:, :, 2]
    gold = (r > 170) * (g > 140) * (b < 130) * (r - b > 60) * (g - b > 40)
    return int(gold.sum())

def check(name, regions, mins):
    a = load(name)
    if a is None:
        print('%s: 缺失!' % name); return False
    vals = [gold_count(a, bx) for bx in regions]
    good = all(v >= m for v, m in zip(vals, mins))
    print('%s  %dx%d  金色像素%s  %s' % (name, a.shape[1], a.shape[0], vals, 'OK' if good else '!! 低于预期'))
    return good

results = []
# ① 竖屏：自动旋转横屏渲染（整屏游戏画面）+ 底部横屏提示气泡
a1 = load('手机_1_竖屏提示.png')
if a1 is not None:
    H1, W1 = a1.shape[:2]
    mid = a1[int(H1 * 0.25):int(H1 * 0.72), int(W1 * 0.10):int(W1 * 0.90)]
    bright = float((mid.max(axis=2) > 110).mean())
    ok1 = bright > 0.25
    print('手机_1 中央明亮占比: %.2f %s' % (bright, 'OK（旋转后的横屏画面已铺满）' if ok1 else '!! 偏暗，旋转可能未生效'))
    g1 = gold_count(a1, (40, H1 - 80, W1 - 40, H1 - 4))
    ok2 = g1 > 120
    print('手机_1 底部提示气泡金色像素: %d %s' % (g1, 'OK' if ok2 else '!! 缺少横屏提示'))
    results.append(ok1 and ok2)
else:
    print('手机_1_竖屏提示.png: 缺失!')
    results.append(False)
# ② 横屏标题：右下菜单键（须有）；"轻触屏幕开始"文案；左下应为空（菜单簇只在右侧）
a2 = load('手机_2_标题页触控.png')
ok_a = check('手机_2_标题页触控.png',
             [(650, 220, 880, 400), (240, 110, 640, 230)],
             [500, 60])
if a2 is not None:
    lft = gold_count(a2, (0, 220, 230, 400))
    print('手机_2 底部左侧（应为空）: %d %s' % (lft, 'OK' if lft < 120 else '!! 意外'))
    ok_a = ok_a and (lft < 120)
results.append(ok_a)
# ③ 横屏战斗：左下移动键 + 右下攻击键 + 右上系统键
results.append(check('手机_3_战斗触控.png',
                     [(0, 220, 230, 400), (650, 220, 880, 400), (700, 0, 880, 70)],
                     [500, 500, 80]))
# ④ 桌面回归：1280x720 标题页，避开中央金色立绘的左右下角
results.append(check('手机_4_桌面无触控.png',
                     [(10, 540, 240, 710), (1030, 540, 1270, 710)],
                     [0, 0]))
a4 = load('手机_4_桌面无触控.png')
if a4 is not None:
    v = gold_count(a4, (10, 540, 240, 710)) + gold_count(a4, (1030, 540, 1270, 710))
    print('手机_4 左右下角金色合计: %d %s' % (v, 'OK（桌面无按钮）' if v < 250 else '!! 桌面被污染'))
    results[-1] = results[-1] and (v < 250)

# ⑤ 竖屏旋转战斗：画面铺满 + 按键角落可见
a5 = load('手机_6_竖屏旋转战斗.png')
if a5 is not None:
    H5, W5 = a5.shape[:2]
    mid5 = a5[int(H5 * 0.25):int(H5 * 0.75), int(W5 * 0.1):int(W5 * 0.9)]
    bright5 = float((mid5.max(axis=2) > 100).mean())
    ok51 = bright5 > 0.35
    b5 = gold_count(a5, (0, 0, W5, H5))
    ok52 = b5 > 800
    print('手机_6 中央明亮占比: %.2f %s / 全屏金色(按键环): %d %s' % (
        bright5, 'OK' if ok51 else '!!', b5, 'OK' if ok52 else '!!'))
    results.append(ok51 and ok52)
else:
    print('手机_6_竖屏旋转战斗.png: 缺失!')
    results.append(False)

print('')
print('===== 总判定: %s =====' % ('全部通过 ✔' if all(results) else '存在需检查项 ✘'))
