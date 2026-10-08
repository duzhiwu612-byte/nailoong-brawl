# -*- coding: utf-8 -*-
# 胜利宣言 QC：① roundEnd 气泡（奶油底+深棕描边文字）+ 金色播报 ② matchEnd 结算浮层宣言
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

def load(name):
    p = os.path.join(T, name)
    if not os.path.exists(p):
        print('  缺截图 %s' % p)
        return None
    return np.asarray(Image.open(p).convert('RGB')).astype(np.int32)

# ================= ① 气泡 + 播报 =================
print('== ① 胜利气泡（roundEnd 定格）==')
a = load('nl_check_winquote.png')
if a is not None:
    H, W = a.shape[:2]
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    # 奶油气泡底 #FFFDF2 (255,253,242)：大块、偏白、微暖（r-b≈13）
    cream = (r >= 246) & (g >= 244) & ((r - b) >= 6) & ((r - b) <= 26)
    lab, n = ndimage.label(cream)
    got_bubble = False
    if n == 0:
        chk('气泡奶油底存在', False, '未找到奶油色块')
    else:
        szs = ndimage.sum(cream, lab, range(1, n + 1))
        i = int(np.argmax(szs)) + 1
        ys, xs = np.where(lab == i)
        x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
        w, h = x1 - x0 + 1, y1 - y0 + 1
        size = int(szs[i - 1])
        chk('气泡奶油底（最大块 %d px, %dx%d @ %d,%d）' % (size, w, h, x0, y0),
            size > 1500 and 60 <= w <= 460 and 25 <= h <= 100)
        got_bubble = size > 1500

        # 气泡描边 + 文字（深棕 #5A4318 / #4A3410）
        m = 10
        bx0, by0 = max(0, x0 - m), max(0, y0 - m)
        bx1, by1 = min(W, x1 + m), min(H, y1 + m)
        box = a[by0:by1, bx0:bx1]
        rr, gg, bb = box[:, :, 0], box[:, :, 1], box[:, :, 2]
        dk = int(((rr < 130) & (gg < 110) & (bb < 90)).sum())
        chk('气泡描边+文字深色像素（%d px）' % dk, dk > 250)

        # 存档：气泡局部 + 全图
        crop = Image.open(os.path.join(T, 'nl_check_winquote.png')).crop(
            (max(0, x0 - 100), max(0, y0 - 80), min(W, x1 + 100), min(H, y1 + 160)))
        crop.save(os.path.join(OUT, '胜利宣言_1_看笑了气泡.png'))
        Image.open(os.path.join(T, 'nl_check_winquote.png')).save(
            os.path.join(OUT, '胜利宣言_2_获胜播报.png'))
        print('  存档 -> 预览截图/胜利宣言_1_看笑了气泡.png / 胜利宣言_2_获胜播报.png')

    # 中心金色播报大字 '#FFE066'（只查画面上方中心区，避开角色身体金黄）
    gold = (np.abs(r - 255) < 36) & (np.abs(g - 224) < 46) & (np.abs(b - 102) < 55)
    cnt = int(gold[225:305, 380:900].sum())
    chk('中心金色播报大字（%d px，应含「看笑了 获胜！」）' % cnt, cnt > 250)

    # 气泡是否在角色头顶上方（气泡下方 0..170px 内应有像素头肤色）
    if got_bubble:
        sy0, sy1 = y1, min(H, y1 + 170)
        sx0, sx1 = max(0, x0 - 40), min(W, x1 + 40)
        below = a[sy0:sy1, sx0:sx1]
        r2, g2, b2 = below[:, :, 0], below[:, :, 1], below[:, :, 2]
        skin = (r2 > 150) & (r2 > g2 + 16) & (g2 > b2 + 8) & ((g2 - b2) < 85)
        sk = int(skin.sum())
        chk('气泡正下方是照片肤色头（%d px）' % sk, sk > 300)

# ================= ② 结算浮层 =================
print('== ② 结算浮层（matchEnd 定格）==')
a2 = load('nl_check_winquote2.png')
if a2 is not None:
    H2, W2 = a2.shape[:2]
    r, g, b = a2[:, :, 0], a2[:, :, 1], a2[:, :, 2]

    # 金色标题「干饭冠军诞生！」#FFE066
    gold2 = (np.abs(r - 255) < 40) & (np.abs(g - 224) < 50) & (np.abs(b - 102) < 60)
    cnt2 = int(gold2[235:285, 380:900].sum())
    chk('结算浮层金色标题（%d px）' % cnt2, cnt2 > 250)

    # 宣言副文本（白色 0.8 透明度，位于标题下方 ~y292）
    whitish = (r > 140) & (g > 140) & (b > 135) & (np.abs(r - b) < 60)
    cnt3 = int(whitish[280:306, 440:840].sum())
    chk('宣言副行像素（%d px，应为「胜利宣言：「看笑了」」）' % cnt3, cnt3 > 60)

    # 面板底色（深棕 60,45,25 @0.95 → 约 57,43,24 + 5% 场景）
    panel = (r < 110) & (g < 90) & (b < 70)
    cnt4 = int(panel[380:470, 430:850].sum())
    chk('结算面板底色存在（%d px）' % cnt4, cnt4 > 15000)

    Image.open(os.path.join(T, 'nl_check_winquote2.png')).save(
        os.path.join(OUT, '胜利宣言_3_结算宣言.png'))
    print('  存档 -> 预览截图/胜利宣言_3_结算宣言.png')

print('')
print('========================================')
print('  胜利宣言 QC：通过 %d / 失败 %d' % (7 - fail, fail))
print('========================================')
