#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""cutout.py — 用 rembg 对图片抠图（去背景），输出透明 PNG
用法:
  .venv-gfx/Scripts/python.exe tools/cutout.py 图1 图2 ... [--out 目录] [--model bria-rmbg|u2net|isnet-general-use]
环境变量 HF_ENDPOINT=https://hf-mirror.com 可加速模型下载
"""
import os, sys, time
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
from rembg import new_session, remove
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
DEF_OUT = os.path.join(BASE, "原版素材", "cut")
os.makedirs(DEF_OUT, exist_ok=True)

def parse():
    args = sys.argv[1:]
    out = DEF_OUT; model = "bria-rmbg"; files = []
    i = 0
    while i < len(args):
        if args[i] == "--out":
            out = args[i + 1]; i += 2
        elif args[i] == "--model":
            model = args[i + 1]; i += 2
        else:
            files.append(args[i]); i += 1
    return files, out, model

def trim_alpha(im, pad_ratio=0.04):
    """裁掉透明边 + 留少量衬边"""
    im = im.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    im = im.crop(bbox)
    w, h = im.size
    pad = int(max(w, h) * pad_ratio)
    cw = ch = max(w, h) + pad * 2
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(im, ((cw - w) // 2, (ch - h) // 2), im)
    return canvas

def main():
    files, out, model = parse()
    os.makedirs(out, exist_ok=True)
    print("loading model:", model, flush=True)
    t0 = time.time()
    session = new_session(model)
    print("model ready in %.0fs" % (time.time() - t0), flush=True)
    for fp in files:
        name = os.path.splitext(os.path.basename(fp))[0]
        try:
            t = time.time()
            img = Image.open(fp)
            res = remove(img, session=session, alpha_matting=False)
            res = trim_alpha(res)
            op = os.path.join(out, name + ".png")
            res.save(op)
            # 统计
            rw, rh = res.size
            px = list(res.resize((48, 48)).getdata())
            tf = sum(1 for r, g, b, a in px if a < 16) / len(px)
            print("OK %-22s %dx%d  trans=%.2f  %.1fs -> %s" % (name, rw, rh, tf, time.time() - t, op), flush=True)
        except Exception as e:
            print("FAIL", fp, repr(e), flush=True)

if __name__ == "__main__":
    main()
