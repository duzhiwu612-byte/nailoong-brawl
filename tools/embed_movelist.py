# -*- coding: utf-8 -*-
"""embed_movelist.py — 将 tools/movelist.md 嵌入 README.md 的"全部招式表"区段
用法: python tools/embed_movelist.py
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
README = os.path.join(BASE, "..", "README.md")

mv = open(os.path.join(BASE, "movelist.md"), encoding="utf-8").read().strip()
rd = open(README, encoding="utf-8").read()

start_marker = "## 全部招式表"
end_marker = "## 开发"
si = rd.index(start_marker)
ei = rd.index(end_marker)

# movelist.md 第一行是标题（README 有自己的区段标题），跳过
body = mv.split("\n", 1)[1].strip()
new_section = (start_marker + "\n\n"
               + "<!-- 由 tools/gen_movelist.js 生成，勿手改；根目录 招式表.md 为生成副本 -->\n\n"
               + body + "\n\n")

rd2 = rd[:si] + new_section + rd[ei:]
open(README, "w", encoding="utf-8", newline="\n").write(rd2)
print("README 已嵌入招式表，总长", len(rd2), "字符")
