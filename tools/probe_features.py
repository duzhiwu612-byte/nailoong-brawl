# -*- coding: utf-8 -*-
# 三大新功能 QC：① 对撞白烟 ② 选对手界面 ③ 联机大厅菜单 ④ 房间码大字 ⑤ 输入框
import os
import numpy as np
from PIL import Image

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, '预览截图', '')

fail = 0
def chk(name, cond, extra=''):
    global fail
    print(('  PASS  ' if cond else '  FAIL  ') + name + (('  => ' + extra) if extra else ''))
    if not cond:
        fail += 1

def load(name):
    p = os.path.join(OUT, name + '.png')
    if not os.path.exists(p):
        print('  缺截图 %s' % p)
        return None
    return np.asarray(Image.open(p).convert('RGB')).astype(np.int32)

def count(a, region, fn):
    x0, y0, x1, y1 = region
    s = a[y0:y1, x0:x1]
    return int(fn(s[:, :, 0], s[:, :, 1], s[:, :, 2]).sum())

# ① 对撞：白烟（clash 在 ~(690,480) 附近）
a1 = load('新功能_1_弹道对撞')
if a1 is not None:
    white = count(a1, (540, 360, 860, 600), lambda r, g, b: (r > 228) & (g > 228) & (b > 228) & (np.abs(r - b) < 16))
    chk('对撞白烟粒子（%d px）' % white, white > 250)

# ② 选对手界面：金色 🎲 按钮 + 提示字
a2 = load('新功能_2_自选AI对手')
if a2 is not None:
    gold2 = count(a2, (1000, 652, 1262, 712), lambda r, g, b: (r > 170) & (g > 140) & (b < 150) & (r - b > 50))
    chk('选对手界面 🎲 按钮（金色 %d px）' % gold2, gold2 > 200)
    head2 = count(a2, (300, 30, 980, 92), lambda r, g, b: (r > 200) & (g > 170) & (b < 150))
    chk('标题「选择你的对手」大字（%d px）' % head2, head2 > 300)

# ③ 联机大厅菜单：金色标题 + 三个暗色选项面板
a3 = load('新功能_3_联机大厅')
if a3 is not None:
    title3 = count(a3, (440, 78, 840, 142), lambda r, g, b: (r > 200) & (g > 170) & (b < 160) & (r - b > 60))
    chk('联机大厅金色标题（%d px）' % title3, title3 > 250)
    panel3 = count(a3, (320, 180, 960, 430), lambda r, g, b: (r < 120) & (g < 100) & (b < 85))
    chk('选项面板存在（%d px）' % panel3, panel3 > 8000)

# ④ 房间码大字 KUA1
a4 = load('新功能_4_房间码')
if a4 is not None:
    code4 = count(a4, (390, 264, 890, 400), lambda r, g, b: (r > 210) & (g > 180) & (b < 170) & (r - b > 60))
    chk('房间码金色大字（%d px）' % code4, code4 > 400)
    border4 = count(a4, (390, 264, 890, 400), lambda r, g, b: (r > 200) & (g > 165) & (b < 130))
    chk('房间码金框（%d px）' % border4, border4 > 300)

# ⑤ 输入框：金色描边在画面上中部
a5 = load('新功能_5_输入房间码')
if a5 is not None:
    box5 = count(a5, (420, 350, 860, 500), lambda r, g, b: (r > 190) & (g > 150) & (b < 150) & (r - b > 50))
    chk('房间码输入框金边（%d px）' % box5, box5 > 120)

print('')
print('========================================')
print('  新功能 QC：失败 %d 项' % fail)
print('========================================')
