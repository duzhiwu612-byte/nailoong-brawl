# -*- coding: utf-8 -*-
"""bili_dl.py — 下载 B 站视频（免登录低清 mp4，供逐帧分析）
用法: python tools/bili_dl.py BV1MqHs66E1a
"""
import json, urllib.request, sys, os

bv = sys.argv[1] if len(sys.argv) > 1 else "BV1MqHs66E1a"
qn = sys.argv[2] if len(sys.argv) > 2 else "64"
suffix = "" if qn == "64" else "_q" + qn
H = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Referer": "https://www.bilibili.com/video/" + bv,
}

view = json.load(urllib.request.urlopen(urllib.request.Request(
    "https://api.bilibili.com/x/web-interface/view?bvid=" + bv, headers=H), timeout=20))
v = view["data"]
cid = v["cid"]

pu = ("https://api.bilibili.com/x/player/playurl?bvid=%s&cid=%s&qn=%s&fnval=1&platform=html5&high_quality=1" % (bv, cid, qn))
d = json.load(urllib.request.urlopen(urllib.request.Request(pu, headers=H), timeout=20))
print("playurl code:", d.get("code"), d.get("message", ""))
urls = []
if d.get("code") == 0:
    dd = d["data"]
    if dd.get("durl"):
        urls = [x["url"] for x in dd["durl"]]
        print("durl 清晰度 qn:", dd.get("quality"))
    elif dd.get("dash"):
        vs = sorted(dd["dash"]["video"], key=lambda x: x.get("bandwidth", 0))
        urls = [vs[0]["baseUrl"]]
        print("dash 最低码率流")
print("流地址数:", len(urls))

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "原版素材", "bili", bv + suffix + ".mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
ok = False
for u in urls:
    try:
        data = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=90).read()
        if len(data) > 50000:
            open(out, "wb").write(data)
            print("已下载:", out, len(data), "B")
            ok = True
            break
    except Exception as e:
        print("下载失败:", repr(e)[:150])
print("OK" if ok else "FAILED")
