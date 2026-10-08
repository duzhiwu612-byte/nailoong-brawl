# -*- coding: utf-8 -*-
# 必杀·旧手机山 QC：① 下坠定格（亮屏手机 + 灰旧机身群）② 爆机散落（山没了，碎屏旧机飞一地）
import os
import numpy as np
from PIL import Image
from scipy import ndimage

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, '预览截图')

# 旧手机机身色调（与 battle.js MP 阵列 / oldphone tint 一致）
TINTS = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in
         ['#94968F', '#A3A095', '#8E9AA3', '#A89584', '#97928A', '#8A95A0',
          '#9A8E9C', '#AB9E8B', '#9E93A4', '#8C97A1', '#A79A87']]

fail = 0
def chk(name, cond, extra=''):
    global fail
    print(('  PASS  ' if cond else '  FAIL  ') + name + (('  => ' + extra) if extra else ''))
    if not cond:
        fail += 1

def tint_mask(a):
    m = np.zeros(a.shape[:2], bool)
    for (tr, tg, tb) in TINTS:
        m |= (np.abs(a[:, :, 0] - tr) < 26) & (np.abs(a[:, :, 1] - tg) < 26) & (np.abs(a[:, :, 2] - tb) < 26)
    return m

def load(name):
    p = os.path.join(T, name)
    if not os.path.exists(p):
        print('  缺截图 %s' % p)
        return None
    return Image.open(p)

# ================= ① 下坠定格 =================
print('== ① 旧手机山（下坠定格）==')
img = load('nl_check_mountain.png')
if img:
    a = np.asarray(img.convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    # 亮屏（山顶那台笑脸屏）#FFF6D8
    gel = (r >= 248) & (g >= 242) & (b >= 200) & (b <= 230)
    lab, n = ndimage.label(gel)
    lit_ok, cx, cy = False, 0, 0
    if n:
        szs = ndimage.sum(gel, lab, range(1, n + 1))
        i = int(np.argmax(szs)) + 1
        if szs[i - 1] > 150:
            ys, xs = np.where(lab == i)
            cx, cy = int(xs.mean()), int(ys.mean())
            lit_ok = 150 < szs[i - 1] < 1200
            print('  亮屏笑脸屏 %d px @ (%d,%d)' % (int(szs[i - 1]), cx, cy))
    chk('山顶亮屏手机存在（笑脸屏 150~1200px）', lit_ok)
    chk('亮屏位于画面上半部（下坠中）', lit_ok and cy < 500, 'y=%d' % cy)

    # 灰旧机身群
    tm = tint_mask(a)
    cnt = int(tm.sum())
    print('  灰旧机身像素 %d' % cnt)
    chk('旧手机机身群（灰旧色 ≥2500px）', cnt >= 2500)
    # 机身群集中在亮屏周围（同一座山）
    if lit_ok:
        box = tm[max(0, cy - 260):cy + 140, max(0, cx - 220):cx + 220]
        chk('机身群围绕亮屏成山（局部 ≥1800px）', int(box.sum()) >= 1800, '局部=%d' % int(box.sum()))

    # 存档
    if lit_ok:
        x0, y0 = max(0, cx - 240), max(0, cy - 240)
        x1, y1 = min(W, cx + 240), min(H, cy + 260)
    else:
        x0, y0, x1, y1 = 300, 60, 1000, 560
    img.crop((x0, y0, x1, y1)).save(os.path.join(OUT, '彩蛋_6_旧手机山将至.png'))
    img.save(os.path.join(OUT, '彩蛋_7_旧手机山全景.png'))
    print('  存档 -> 预览截图/彩蛋_6_旧手机山将至.png / 彩蛋_7_旧手机山全景.png')

# ================= ② 爆机散落 =================
print('== ② 爆机散落（砸中后）==')
img2 = load('nl_check_mountain2.png')
if img2:
    a2 = np.asarray(img2.convert('RGB')).astype(np.int32)
    H2, W2 = a2.shape[:2]
    tm2 = tint_mask(a2)
    cnt2 = int(tm2.sum())
    print('  散落旧机像素 %d' % cnt2)
    chk('碎屏旧机散落一地（灰旧色 ≥800px）', cnt2 >= 800)
    # 分裂为多个机身（不只是整座山）
    lab2, n2 = ndimage.label(tm2)
    blobs = 0
    if n2:
        szs2 = ndimage.sum(tm2, lab2, range(1, n2 + 1))
        blobs = int((szs2 > 90).sum())
    print('  独立机身块 %d' % blobs)
    chk('散落为多个独立机身（≥3 块）', blobs >= 3, 'blobs=%d' % blobs)

    if cnt2:
        ys2, xs2 = np.where(tm2)
        x0, y0 = max(0, int(xs2.min()) - 110), max(0, int(ys2.min()) - 140)
        x1, y1 = min(W2, int(xs2.max()) + 110), min(H2, int(ys2.max()) + 120)
        img2.crop((x0, y0, x1, y1)).save(os.path.join(OUT, '彩蛋_8_爆机散落.png'))
        print('  存档 -> 预览截图/彩蛋_8_爆机散落.png')

print('')
print('========================================')
print('  旧手机山 QC：通过 %d / 失败 %d' % (6 - fail, fail))
print('========================================')
