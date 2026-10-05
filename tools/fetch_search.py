#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""fetch_search.py — 用无头 Chrome 抓图搜候选原图 + 网页文字资料（项目自用）
用法：
  python tools/fetch_search.py            # 抓一批图搜候选，存 tools/原版素材/search_candidates.json
  python tools/fetch_search.py text URL1 URL2 ...   # 抓网页纯文本（形象描述调研）
"""
import subprocess, json, re, html, sys, os, time, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "原版素材")
os.makedirs(OUT, exist_ok=True)

def find_chrome():
    cands = [
        r"C:/Program Files/Google/Chrome/Application/chrome.exe",
        r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%/Google/Chrome/Application/chrome.exe"),
    ]
    for p in cands:
        if os.path.exists(p):
            return p
    return "chrome"

CHROME = find_chrome()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def chrome_dom(url, budget=9000, timeout=150):
    prof = os.path.join(os.environ.get("TEMP", "."), "nlch_%d_%d" % (os.getpid(), int(time.time() * 1000) % 100000))
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
           "--user-data-dir=%s" % prof,
           "--virtual-time-budget=%d" % budget, "--dump-dom", url]
    r = subprocess.run(cmd, capture_output=True, timeout=timeout)
    return (r.stdout or b"").decode("utf-8", "ignore")

def strip_tags(h):
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    t = re.sub(r'(?s)<[^>]+>', ' ', h)
    t = html.unescape(t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()

def bing(qs, minpx=300, cap=70):
    url = "https://cn.bing.com/images/search?q=%s&mkt=zh-CN&setlang=zh-CN" % urllib.parse.quote(qs)
    dom = chrome_dom(url, budget=12000)
    out = []
    for seg in dom.split('<a ')[1:]:
        tag = seg.split('>', 1)[0]
        if 'iusc' not in tag:
            continue
        mm = re.search(r'm="([^"]*)"', tag)
        if not mm:
            continue
        try:
            meta = json.loads(html.unescape(mm.group(1)))
        except Exception:
            continue
        u = meta.get("murl"); w = int(meta.get("w") or 0); h = int(meta.get("h") or 0)
        if u:
            out.append((w, h, u))
    seen = set(); good = []
    for w, h, u in out:
        if u in seen:
            continue
        seen.add(u)
        if w >= minpx and h >= minpx:
            good.append((w, h, u))
    good.sort(key=lambda t: t[0] * t[1], reverse=True)
    return good[:cap], len(dom)

def sogou(qs, cap=70):
    url = "https://pic.sogou.com/napi/pc/searchList?mode=1&start=0&xml_len=60&query=" + urllib.parse.quote(qs)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://pic.sogou.com/"})
    txt = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    data = json.loads(txt)
    items = (data.get("data") or {}).get("items") or []
    res = []
    for it in items:
        u = it.get("oriPicUrl") or it.get("picUrl") or it.get("locImageLink")
        w = int(float(it.get("width") or 0)); h = int(float(it.get("height") or 0))
        if u:
            res.append((w, h, u))
    return res[:cap]

def baidu(qs, cap=70):
    url = "https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=%s&pn=0&rn=60" % urllib.parse.quote(qs)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://image.baidu.com/"})
    txt = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    data = json.loads(txt)
    res = []
    for it in data.get("data", []):
        if not it:
            continue
        u = it.get("hoverURL") or it.get("middleURL") or it.get("thumbURL")
        w = int(it.get("width") or 0); h = int(it.get("height") or 0)
        if u:
            res.append((w, h, u))
    return res[:cap]

def probe():
    for name, url, ref in [
        ("sogou", "https://pic.sogou.com/napi/pc/searchList?mode=1&start=0&xml_len=60&query=" + urllib.parse.quote("奶龙"), "https://pic.sogou.com/"),
        ("baidu", "https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=" + urllib.parse.quote("奶龙") + "&pn=0&rn=60", "https://image.baidu.com/"),
        ("so360", "https://image.so.com/j?q=" + urllib.parse.quote("奶龙") + "&src=srp&sn=0&pn=60", "https://image.so.com/"),
    ]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": ref})
            raw = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
            print("=====", name, len(raw))
            print(raw[:700].replace("\n", " "))
            print()
        except Exception as e:
            print("=====", name, "FAIL", repr(e))

def imgs(url):
    dom = chrome_dom(url, budget=10000)
    srcs = re.findall(r'<img[^>]+(?:data-src|data-original|src)="([^"]+)"', dom, re.I)
    srcs += [s for s in re.findall(r"url\(([^)]+)\)", dom)]
    srcs = [urllib.parse.urljoin(url, s.strip("'\"").strip()) for s in srcs]
    seen = []
    for s in srcs:
        if s not in seen and not s.startswith("data:"):
            seen.append(s)
    print("IMGS:", len(seen))
    for s in seen[:90]:
        print(" ", s)
    hrefs = [urllib.parse.urljoin(url, h) for h in re.findall(r'<a[^>]+href="([^"]+)"', dom, re.I)]
    seen2 = []
    for h in hrefs:
        if h not in seen2:
            seen2.append(h)
    print("LINKS:", len(seen2))
    for h in seen2[:70]:
        print(" ", h)

def domfetch(url, out):
    dom = chrome_dom(url, budget=12000)
    with open(out, "w", encoding="utf-8") as f:
        f.write(dom)
    print("domlen", len(dom), "saved", out)
    low = dom.lower()
    for pat in ["iusc", "murl", "captcha", "consent", "verify", "robot", "验证"]:
        print("  count[%s] = %d" % (pat, low.count(pat.lower())))

def so360(qs, cap=70):
    url = "https://image.so.com/j?q=%s&src=srp&sn=0&pn=60" % urllib.parse.quote(qs)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://image.so.com/"})
    txt = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    data = json.loads(txt)
    res = []
    for it in data.get("list", []):
        u = it.get("img") or it.get("imgurl") or it.get("thumb")
        w = int(it.get("width") or it.get("imgw") or 0)
        h = int(it.get("height") or it.get("imgh") or 0)
        if u:
            res.append((w, h, u.replace("http://", "https://")))
    return res[:cap]

def main():
    queries = ["奶龙 官方 形象 图片", "奶龙 免抠 png", "奶龙 三视图 设定", "奶龙 立绘 高清", "暴暴龙 奶龙"]
    result = {"bing": {}, "sogou": {}, "baidu": {}, "so360": {}}
    for q in queries:
        for name, fn in (("BING", bing), ("SOGOU", sogou), ("BAIDU", baidu), ("SO360", so360)):
            try:
                r = fn(q)
                if name == "BING":
                    r, ln = r
                result[name.lower()][q] = r
                print("### %s %s -> %d" % (name, q, len(r)))
                for w, h, u in r[:45]:
                    print("  %dx%d %s" % (w, h, u))
            except Exception as e:
                print("### %s FAIL %s %r" % (name, q, e))
    fp = os.path.join(OUT, "search_candidates.json")
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print("saved to", fp)

def textfetch(urls, budget=9000):
    for u in urls:
        try:
            dom = chrome_dom(u, budget=budget)
            t = strip_tags(dom)
            print("=====", u, "domlen", len(dom))
            print(t[:1500])
            print()
        except Exception as e:
            print("=====", u, "FAIL", repr(e))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "text":
        textfetch(sys.argv[2:])
    elif len(sys.argv) > 1 and sys.argv[1] == "probe":
        probe()
    elif len(sys.argv) > 1 and sys.argv[1] == "imgs":
        imgs(sys.argv[2])
    elif len(sys.argv) > 1 and sys.argv[1] == "dom":
        domfetch(sys.argv[2], sys.argv[3])
    else:
        main()
