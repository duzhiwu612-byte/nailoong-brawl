# 品牌 / Brand Kit — 奶龙大乱斗

品牌板 3×3（v1.0），依据 `brandkit` 技能（Leonxlnx/taste-skill）规范制作。

## 成品

| 文件 | 说明 |
|---|---|
| `brandkit_3x3.png` | 2400 × 1800 主交付图（3×3 九面板） |
| `brandkit_3x3_hi.png` | 3600 × 2700 高分辨率版（1.5×） |
| `brandkit_prompt.md` | 按技能 PROMPT TEMPLATE 填写的 AI 生成 prompt（可喂文生图模型） |

## 源文件与工具

| 文件 | 说明 |
|---|---|
| `brandkit.html` | 设计源（纯 CSS/HTML + 内联 SVG 标志，零依赖） |
| `shot.sh` | headless Chrome 渲染：`bash 品牌/shot.sh`（1×）或 `bash 品牌/shot.sh 1.5`（1.5×） |
| `probe_brandkit.py` | 盲检脚本：九宫格分区色统计 + 水槽/页脚检查（无视觉依赖） |

重跑流程：编辑 `brandkit.html` → `bash 品牌/shot.sh 1.5` → `品牌/probe_brandkit.py` 检查。

## 设计要点

- **标志（奶滴龙首）**：圆头 + 收尖下颏构成一滴奶的轮廓，顶部双角为龙，
  负空间独眼取自「黑气红瞳」，右侧两道红色速度线为「斗气」。
  几何：头 R31 / 切角眼 Ø17 / 圆角切角（stroke-linejoin: round）。
- **配色（全部采样自游戏素材，非虚构）**：
  - 奶龙金 `#F0C115` ← 立绘/nailoong.png 主色
  - 斗红 `#C9000B` ← 立绘/rage.png 红瞳色
  - 纸白 `#FFF9E8` ← 预览截图/1_标题页.png 底色
  - 墨炭 `#131315` ← 展板画布底色
- **字体**：中文 微软雅黑 Heavy（展示）/ 英文数字 Consolas（UI）。
- **九面板**：封面 / 标志构造 / 数字应用 / 品牌主张 / 色彩系统 /
  字体 / 实体延展 / 视效指引 / 系统细节（含 UI 组件与 HUD）。
- **用到的游戏素材**：`../预览截图/3_战斗画面.png`、`../立绘/nailoong.png`、`../立绘/rage.png`。

## 注意

- 渲染依赖：本机 Chrome（`C:\Program Files\Google\Chrome\Application\chrome.exe`）+ `.venv-gfx`（Pillow）。
- 路径含中文，`shot.sh` 已自动做 percent-encoding；直接手敲 `file://` URL 会打不开。
- `brandkit.html` 中图片用相对路径（`../立绘/...`），移动文件时保持相对位置。
