# -*- coding: utf-8 -*-
# v0.12 班友参战 QC：香蕉抛物/蕉皮/滑倒/镭射/大高个/音波/火柱水渍/替身木桩/选人阵容
import os
import sys
import numpy as np
from PIL import Image

DIR = os.environ.get('NL_NEW5_DIR') or os.path.join(
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


def cnt(a, box, fn):
    x0, y0, x1, y1 = box
    s = a[y0:y1, x0:x1]
    return int(fn(s[:, :, 0], s[:, :, 1], s[:, :, 2]).sum())


yellow = lambda r, g, b: (r > 230) & (g > 200) & (b < 145)
# ① 香蕉抛物线：空中黄色香蕉
a1 = load('班友_1_香蕉抛物')
if a1 is not None:
    n = cnt(a1, (300, 340, 900, 560), yellow)
    chk('香蕉抛物飞行中（空中黄蕉 %d px）' % n, n > 150)

# ② 蕉皮留地：地面黄色蕉皮
a2 = load('班友_2_蕉皮留地')
if a2 is not None:
    n = cnt(a2, (560, 580, 1000, 630), yellow)
    chk('蕉皮留在地上（%d px）' % n, n > 80)

# ③ 踩到香蕉皮：P2 被绊（黄身腾空/倒地 + 白烟）
a3 = load('班友_3_踩到香蕉皮')
if a3 is not None:
    n = cnt(a3, (620, 440, 1000, 625), lambda r, g, b: (r > 215) & (g > 175) & (b < 165))
    chk('对手踩到蕉皮被绊飞（P2 区域 %d px）' % n, n > 500)

# ④ 镭射眼：红色光束
a4 = load('班友_4_镭射眼')
if a4 is not None:
    n = cnt(a4, (280, 300, 1200, 590), lambda r, g, b: (r > 200) & (g < 120) & (b < 120))
    chk('镭射光束（红色 %d px）' % n, n > 200)

# ⑤ 大高个：比奶龙高（比条纹最上端黄色像素）
a5 = load('班友_5_大高个对比')
if a5 is not None:
    def top_y(a, x0, x1):
        # 从 y=350 起扫且要求整行 >25 像素（排除飘过的蜜蜂等小物件）
        for y in range(350, 640):
            row = a[y, x0:x1]
            if (((row[:, 0] > 210) & (row[:, 1] > 165) & (row[:, 2] < 165)).sum()) > 25:
                return y
        return 999
    def top_dark(a, x0, x1):
        # 照片头（深色头发）顶端
        for y in range(360, 640):
            row = a[y, x0:x1]
            lum = 0.299 * row[:, 0] + 0.587 * row[:, 1] + 0.114 * row[:, 2]
            if (lum < 95).sum() > 25:
                return y
        return 999
    t1 = top_dark(a5, 380, 480)
    t2 = top_y(a5, 800, 900)
    chk('大高个更高（照片头顶 y=%d vs 奶龙头顶 y=%d，高 %dpx）' % (t1, t2, t2 - t1), t1 < t2 - 25)

# ⑥ 九一音波：浅蓝音波圈
a6 = load('班友_6_九一音波')
if a6 is not None:
    n = cnt(a6, (300, 340, 1250, 620), lambda r, g, b: (r < 215) & (g > 200) & (b > 232))
    chk('音波圈（浅蓝 %d px）' % n, n > 150)

# ⑦ 火柱 + 点燃水渍：橙色火焰 + 蓝灰水渍
a7 = load('班友_7_火柱水渍')
if a7 is not None:
    nf = cnt(a7, (100, 440, 1200, 630), lambda r, g, b: (r > 225) & (g > 105) & (g < 218) & (b < 125))
    chk('横向火柱（橙黄火焰 %d px）' % nf, nf > 250)
    blue = lambda r, g, b: (r > 105) & (r < 180) & (g > 135) & (g < 205) & (b > 175) & (b < 240)
    burnt = lambda r, g, b: (r > 62) & (r < 140) & (g > 55) & (g < 128) & (b < 108) & (r >= g) & (g >= b) & (r - b > 18)
    npd = cnt(a7, (100, 570, 1200, 632), blue) + cnt(a7, (100, 570, 1200, 632), burnt)
    chk('地面水渍/焦痕（蓝灰或焦褐 %d px）' % npd, npd > 120)

# ⑧ 替身木桩：原位置的棕色木桩
a8 = load('班友_8_替身木桩')
if a8 is not None:
    n = cnt(a8, (400, 460, 640, 635), lambda r, g, b: (r > 155) & (r < 220) & (g > 110) & (g < 180) & (b > 55) & (b < 130))
    chk('替身木桩留在原地（棕色 %d px）' % n, n > 180)

# ⑨ 选人阵容：15 卡统一网格（5×3，同尺寸）
a9 = load('班友_9_选人阵容')
if a9 is not None:
    n = cnt(a9, (26, 96, 1254, 648), lambda r, g, b: (r > 243) & (g > 238) & (b > 222))
    chk('15 卡统一网格（奶白卡面 %d px）' % n, n > 200000)
    ng = cnt(a9, (516, 466, 764, 654), lambda r, g, b: (r > 230) & (g > 195) & (b < 110))
    chk('选中卡金框（金色 %d px @ 卡12）' % ng, ng > 400)

# ⑯ v0.13 黑板之盾（板面深绿 + 木框）
a16 = load('班友_16_黑板之盾')
if a16 is not None:
    n16 = cnt(a16, (380, 360, 800, 648), lambda r, g, b: (r > 30) & (r < 80) & (g > 65) & (g < 115) & (b > 55) & (b < 105))
    chk('黑板之盾板面（深绿 %d px）' % n16, n16 > 2000)

# ⑰ v0.13 迷雾战场（大范围灰烟）
a17 = load('班友_17_迷雾战场')
if a17 is not None:
    n17 = cnt(a17, (40, 150, 1240, 645), lambda r, g, b: (abs(r - g) < 24) & (abs(g - b) < 28) & (r > 90) & (r < 218))
    chk('大范围烟雾（灰调烟团 %d px）' % n17, n17 > 40000)

# ⑱ v0.13 烟雾大爆炸（亮橙火团）
a18 = load('班友_18_烟雾大爆炸')
if a18 is not None:
    n18 = cnt(a18, (40, 100, 1240, 645), lambda r, g, b: (r > 235) & (g > 140) & (b < 175))
    chk('爆炸火团（亮橙 %d px）' % n18, n18 > 1500)

# ⑲ v0.13 全屏香蕉雨（空中黄蕉）
a19 = load('班友_19_全屏香蕉雨')
if a19 is not None:
    n19 = cnt(a19, (0, 30, 1280, 460), lambda r, g, b: (r > 230) & (g > 195) & (b < 150))
    chk('空中香蕉雨（黄 %d px）' % n19, n19 > 300)

# ⑳ v0.13 手机堆挡路（深灰手机机身）
a20 = load('班友_20_手机堆挡路')
if a20 is not None:
    n20 = cnt(a20, (760, 440, 1050, 648), lambda r, g, b: (abs(r - g) < 30) & (abs(g - b) < 34) & (r > 55) & (r < 130))
    chk('手机堆（深灰机身 %d px）' % n20, n20 > 1200)

# ㉑ v0.13 灼烧状态（角色身上橙焰）
a21 = load('班友_21_灼烧状态')
if a21 is not None:
    n21 = cnt(a21, (420, 340, 940, 645), lambda r, g, b: (r > 225) & (g > 110) & (g < 225) & (b < 135))
    chk('角色灼烧火焰（橙 %d px）' % n21, n21 > 250)

# ⑩ v0.12.1 酒瓶水平投掷 → 终点炸开：地面水渍（蓝灰）+ 水花
a10 = load('班友_10_酒瓶炸开水渍')
if a10 is not None:
    blue2 = lambda r, g, b: (r > 100) & (r < 195) & (g > 125) & (g < 218) & (b > 172) & (b < 250)
    n10 = cnt(a10, (500, 565, 740, 634), blue2)
    chk('酒瓶终点水渍（蓝灰 %d px）' % n10, n10 > 150)

print('---')
print('new5 QC: ' + ('全部通过 OK' if fail == 0 else ('失败 %d 项 FAIL' % fail)))
sys.exit(1 if fail else 0)
