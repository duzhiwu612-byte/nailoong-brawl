# -*- coding: utf-8 -*-
"""check_select_shot.py — 选人页截图自检：确认第 9 张卡（忧郁模式）完整绘制
判定：奶娃卡区域蓝色像素占比 >= 0.05（完整立绘≈0.2+；未渲染≈0）
布局：3×3 网格，cw=292 chh=178 gap=18 startX=184，第三行 y=480
用法: python tools/check_select_shot.py [截图路径]
"""
import sys
from PIL import Image
import numpy as np

path = sys.argv[1] if len(sys.argv) > 1 else "预览截图/2_选人界面.png"
a = np.array(Image.open(path).convert("RGB")).astype(int)
# 第 9 张卡内部（忧郁模式）
reg = a[486:652, 812:1088]
r, g, b = reg[:, :, 0], reg[:, :, 1], reg[:, :, 2]
blue = float(((b > 150) & (b > r + 50)).mean())
ok = blue >= 0.05
print("选人页自检: 末卡（忧郁模式）蓝色像素占比=%.3f -> %s" % (blue, "OK 完整绘制" if ok else "!! 疑似未完整渲染（重试）"))
sys.exit(0 if ok else 1)
