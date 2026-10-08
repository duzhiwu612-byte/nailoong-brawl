# -*- coding: utf-8 -*-
# 彩蛋角色 QC：选人竖卡 + 战斗像素头
import os
import numpy as np
from PIL import Image
from scipy import ndimage

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')

# 1) 选人页：左侧竖卡区（1280x720 画布 1:1，卡 x 14..170 y 96..658）
p1 = os.path.join(T, 'nl_check_select.png')
if os.path.exists(p1):
    a = np.asarray(Image.open(p1).convert('RGB')).astype(np.int32)
    print('select shot', a.shape[1], 'x', a.shape[0])
    reg = a[96:658, 14:170]
    r, g, b = reg[:, :, 0], reg[:, :, 1], reg[:, :, 2]
    skin = int(((r > 150) * (r > g + 18) * (g > b + 8)).sum())
    gold = int(((r > 200) * (g > 150) * (g < 235) * (b < 130)).sum())
    cream = int(((r > 240) * (g > 235) * (b > 210)).sum())
    print('竖卡区: skin=%d gold=%d cream=%d (区 %d px)' % (skin, gold, cream, reg.shape[0] * reg.shape[1]))
else:
    print('!! 缺 nl_check_select.png')

# 2) 战斗页：左侧 xiaole（P1），找最大肤色连通块（像素头部）
p2 = os.path.join(T, 'nl_check_xiaole.png')
if os.path.exists(p2):
    a2 = np.asarray(Image.open(p2).convert('RGB')).astype(np.int32)
    reg2 = a2[0:660, 60:660]
    r2, g2, b2 = reg2[:, :, 0], reg2[:, :, 1], reg2[:, :, 2]
    sk = (r2 > 150) * (r2 > g2 + 18) * (g2 > b2 + 8)
    lab, n = ndimage.label(sk)
    if n:
        szs = ndimage.sum(sk, lab, range(1, n + 1))
        big = int(szs.max())
        ys, xs = np.where(lab == int(np.argmax(szs)) + 1)
        print('战斗页 左半区最大肤色块=%d px  位置 x %d..%d y %d..%d' % (
            big, 60 + xs.min(), 60 + xs.max(), ys.min(), ys.max()))
    else:
        print('!! 战斗页未找到肤色块')
else:
    print('!! 缺 nl_check_xiaole.png')
