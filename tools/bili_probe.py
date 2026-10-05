# -*- coding: utf-8 -*-
"""bili_probe.py — 抓取 B 站视频元信息（标题/简介/封面/分P）
用法: python tools/bili_probe.py [BV号]
"""
import json, urllib.request, sys, os

bv = sys.argv[1] if len(sys.argv) > 1 else "BV1MqHs66E1a"
H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Referer": "https://www.bilibili.com/",
}
url = "https://api.bilibili.com/x/web-interface/view?bvid=" + bv
req = urllib.request.Request(url, headers=H)
d = json.load(urllib.request.urlopen(req, timeout=20))
if d.get("code") != 0:
    print("API error:", d)
    sys.exit(1)
v = d["data"]
print("标题:", v["title"])
print("UP主:", v["owner"]["name"])
print("时长(秒):", v["duration"])
print("aid:", v["aid"], "cid:", v["cid"], "bvid:", v["bvid"])
if v.get("pages"):
    print("分P:", [p["part"] for p in v["pages"]][:12])
print("封面:", v["pic"])
print("--- 简介 ---")
print((v.get("desc") or "").strip()[:1500])
print("--- 动态(如有) ---")
try:
    print(json.dumps(v.get("dynamic", ""), ensure_ascii=False)[:400])
except Exception:
    pass

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "原版素材", "bili", bv + "_cover.jpg")
os.makedirs(os.path.dirname(out), exist_ok=True)
req2 = urllib.request.Request(v["pic"], headers=H)
open(out, "wb").write(urllib.request.urlopen(req2, timeout=30).read())
print("封面已存:", out)
