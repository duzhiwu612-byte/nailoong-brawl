# -*- coding: utf-8 -*-
"""probe_brandkit.py — 盲检 brandkit 渲染图：九宫格分区统计 + 期望色存在性 + 水槽/页脚检查
用法: .venv-gfx/Scripts/python.exe 品牌/probe_brandkit.py <png>
"""
import sys
from PIL import Image

def stats(im):
    px = list(im.convert('RGB').getdata())
    n = max(1, len(px))
    light = sum(1 for r, g, b in px if r + g + b > 600)
    gold = sum(1 for r, g, b in px if r > 200 and 150 < g < 235 and b < 130)
    red = sum(1 for r, g, b in px if r > 130 and g < 75 and b < 75)
    blue = sum(1 for r, g, b in px if b > 140 and b > r + 20 and b > g + 10)
    dark = sum(1 for r, g, b in px if r + g + b < 160)
    q = set((r // 32, g // 32, b // 32) for r, g, b in px[::7])
    mean = tuple(sum(c[i] for c in px) // n for i in range(3))
    return dict(mean=mean, light=100 * light // n, gold=100 * gold // n,
                red=100 * red // n, blue=100 * blue // n, dark=100 * dark // n, colors=len(q))

def main(path):
    im = Image.open(path).convert('RGB')
    W, H = im.size
    print('SIZE %dx%d (expect 2400x1800)' % (W, H))
    cols = [64, 828.66, 1593.33]; colw = 742.66
    rows = [52, 606, 1160]; rowh = 532
    names = ['01 COVER', '02 CONSTRUCT', '03 DIGITAL', '04 ESSENCE', '05 COLOR',
             '06 TYPE', '07 PHYSICAL', '08 IMAGE', '09 SYSTEM']
    k = 0
    for ry in rows:
        for rx in cols:
            s = stats(im.crop((int(rx), int(ry), int(rx + colw), int(ry + rowh))))
            k += 1
            print('P%02d %-12s mean=%-15s light=%2d%% gold=%2d%% red=%2d%% blue=%2d%% dark=%2d%% colors=%3d'
                  % (k, names[k - 1], str(s['mean']), s['light'], s['gold'], s['red'],
                     s['blue'], s['dark'], s['colors']))
    for x in (817, 1582):
        g = stats(im.crop((x - 3, 52, x + 3, 1692)))
        print('GUTTER x=%-5d dark=%d%% colors=%d' % (x, g['dark'], g['colors']))
    for y in (595, 1149):
        g = stats(im.crop((64, y - 3, 2336, y + 3)))
        print('GUTTER y=%-5d dark=%d%% colors=%d' % (y, g['dark'], g['colors']))
    f = stats(im.crop((64, 1740, 2336, 1790)))
    print('FOOTER light=%d%% colors=%d (text should make light>0, colors>1)' % (f['light'], f['colors']))
    im.crop((320, 80, 560, 310)).save('C:/Users/hp/AppData/Local/Temp/bk_mark_crop.png')
    im.crop((64, 52, 807, 584)).save('C:/Users/hp/AppData/Local/Temp/bk_cover_crop.png')
    im.crop((1593, 1160, 2336, 1692)).save('C:/Users/hp/AppData/Local/Temp/bk_p8_crop.png')
    print('CROPS SAVED (bk_mark_crop / bk_cover_crop / bk_p8_crop)')

main(sys.argv[1])
