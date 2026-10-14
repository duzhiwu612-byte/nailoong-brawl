# -*- coding: utf-8 -*-
# 5 位班友照片 → 头部定位探针：Haar 人脸（正脸/侧脸） + 肤色连通域
import os
import numpy as np
from PIL import Image
from scipy import ndimage
import cv2

D = 'tools/新角色素材'
# 注意：OpenCV 在 Windows 上无法读取含中文路径的 XML → 用 ASCII 临时目录里的副本
cd = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp', 'nl_cascades') + os.sep
front = cv2.CascadeClassifier(cd + 'haarcascade_frontalface_default.xml')
prof = cv2.CascadeClassifier(cd + 'haarcascade_profileface.xml')

for f in ['kugua', 'laser', 'tallguy', 'jiuyi', 'laobai']:
    p = os.path.join(D, f + '.jpg')
    im = Image.open(p).convert('RGB')
    W, H = im.size
    a = np.asarray(im)
    g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)
    print('=' * 66)
    print('%s  %dx%d' % (f, W, H))
    for name, cc in (('front', front), ('profile', prof)):
        det = cc.detectMultiScale(g, scaleFactor=1.08, minNeighbors=5,
                                  minSize=(int(min(W, H) * 0.06), int(min(W, H) * 0.06)))
        for (x, y, w, h) in det[:6]:
            print('  HAAR-%-7s (%d,%d) %dx%d' % (name, x, y, w, h))
    r = a[:, :, 0].astype(np.int32)
    gg = a[:, :, 1].astype(np.int32)
    b = a[:, :, 2].astype(np.int32)
    skin = (r > 118) & (r > gg + 12) & (gg > b + 3) & (r < 252)
    lab, n = ndimage.label(skin)
    if n:
        sizes = ndimage.sum(skin, lab, range(1, n + 1))
        for k in np.argsort(sizes)[::-1][:6]:
            sz = int(sizes[k])
            if sz < 400:
                continue
            ys, xs = np.where(lab == k + 1)
            print('  SKIN blob area=%-7d box=(%d,%d)-(%d,%d) %dx%d' % (
                sz, xs.min(), ys.min(), xs.max(), ys.max(),
                xs.max() - xs.min() + 1, ys.max() - ys.min() + 1))
