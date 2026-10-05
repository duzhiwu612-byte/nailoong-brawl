# -*- coding: utf-8 -*-
"""ocr_frame.py — 用 RapidOCR 识别图片中的文字（复用答题速查的 OCR 环境）
用法: <答题速查venv>/python.exe tools/ocr_frame.py 图1 [图2 ...]
"""
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
for fp in sys.argv[1:]:
    print("=====", Path(fp).name, "=====")
    result, _ = engine(fp)
    if not result:
        print("(无文字)")
        continue
    for item in result:
        box, text, conf = item[0], item[1], item[2]
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        print("  [x %4.0f-%4.0f, y %4.0f-%4.0f] %s   (%.2f)" % (
            min(xs), max(xs), min(ys), max(ys), text, conf))
