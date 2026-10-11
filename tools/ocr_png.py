# -*- coding: utf-8 -*-
# 通用 PNG OCR 小工具：python tools/ocr_png.py 文件1.png 文件2.png ...
import sys
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
for p in sys.argv[1:]:
    print('=== ' + p + ' ===')
    result, _ = engine(p)
    if not result:
        print('(无文字)')
        continue
    for item in result:
        txt = item[1]
        conf = float(item[2])
        if conf >= 0.5:
            print('  %.2f  %s' % (conf, txt))
