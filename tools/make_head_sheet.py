
# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw

D = 'tools/新角色素材'
items = [('kugua', 'KU GUA'), ('laser', 'LASER'), ('tallguy', 'TA LL GUY'), ('jiuyi', 'JIU YI'), ('laobai', 'LAO BAI')]
panel = 240
gap = 14
W = len(items) * (panel + gap) + gap
H = panel + 92
canvas = Image.new('RGB', (W, H), (250, 246, 232))
dr = ImageDraw.Draw(canvas)
x = gap
for cid, label in items:
    p = os.path.join(D, 'preview_' + cid + '.png')
    im = Image.open(p).convert('RGBA').resize((panel, panel), Image.LANCZOS)
    bg = Image.new('RGBA', (panel, panel), (255, 255, 255, 255))
    bg.paste(im, (0, 0), im)
    canvas.paste(bg.convert('RGB'), (x, gap))
    dr.text((x + panel // 2 - 32, panel + gap + 12), label, fill=(90, 67, 24))
    dr.text((x + 40, panel + gap + 34), 'head 96px', fill=(138, 106, 48))
    x += panel + gap
# 手部单独放不下就贴最后
hand = Image.open('立绘/jiuyi_hand.png').convert('RGBA')
h2 = Image.new('RGB', (68, 96), (255, 255, 255))
h2.paste(hand, (0, 0), hand)
canvas.paste(h2, (W - gap - 68 - 4, panel - 96 + gap))
dr.text((W - gap - 130, panel - 116 + gap), 'JIUYI HAND', fill=(192, 57, 43))
canvas.save('预览截图/班友_0_头像素材核对.png')
print('saved 班友_0_头像素材核对.png', canvas.size)
