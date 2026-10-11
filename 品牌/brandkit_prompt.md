# 奶龙大乱斗 · Brand Board — AI 图像生成 Prompt

> 依据 `brandkit` 技能（Leonxlnx/taste-skill，172+/361.3K 安装）的 **PROMPT TEMPLATE** 填写。
> 用途：把本文件整段喂给任意文生图模型（Seedream / Nano Banana / GPT-image / MJ 等），
> 生成与 `brandkit_3x3.png` 同方向的「一图流品牌板」。附上 `立绘/nailoong.png` 作参考图效果更佳。

## 一、品牌策略（BRAND STRATEGY FIRST — 已推断）

| 维度 | 结论 |
|---|---|
| category | 网页即玩的 1v1 乱斗小游戏（文化 / 贱萌 IP 向） |
| audience | 奶龙粉丝、休闲玩家、朋友联机对局 |
| personality | 贱萌、上头、热闹、收集感（九形态 + 彩蛋） |
| core metaphor | 「一口奶，一场乱斗」——奶滴轮廓的龙首；九种形态，一个擂台 |
| logo idea | **奶滴龙首**：圆头收尖 = 一滴奶的轮廓；顶部双角 = 龙；负空间独眼 = 黑气红瞳；右侧两道红色速度线 = 斗气 |
| avoid | 通用闪电、随机动物、假奢华徽章、廉价霓虹、企业 PPT 感 |

## 二、生成 Prompt（英文，直接可用）

```
Create a premium brand-kit overview image for "奶龙大乱斗 (NAILOONG BRAWL)",
a fan-made HTML5 1v1 fighting game starring a chubby golden milk-dragon mascot
with nine battle forms plus one easter-egg character.

Brand strategy:
- category: casual fighting game / cultural playable IP
- audience: young casual players and mascot fans, friends playing online 2P
- personality: cheeky, cute, chaotic, energetic, collectible
- core metaphor: "one sip of milk, one brawl" — a milk-drop shaped dragon head
- logo idea: a milk-drop silhouette fused with a dragon head: round top with two
  small horns, tapered chin, a single negative-space eye  ("rage eye"), two red
  speed slashes for fight energy. Simple, ownable, scalable.

Layout:
3x3 grid on a dark charcoal presentation canvas with strong gutters,
clean alignment, and refined negative space.

Panels:
- logo cover (large mark + Chinese wordmark 奶龙大乱斗 + NAILOONG BRAWL)
- logo concept / construction (grid geometry: R31 head circle, horn axes, cut eye)
- digital application (browser chrome mockup playing the game, URL bar)
- tagline / brand essence (sparse panel, huge type: 一口奶，一场乱斗。)
- color system (swatches: dragon gold #F0C115, brawl red #C9000B,
  paper white #FFF9E8, charcoal #131315)
- typography (heavy Chinese display sans specimen + monospace numerals)
- physical application (character trading card with the golden dragon art,
  gold coin badge, sticker strip)
- image direction (unexpected crop of the red "rage" dragon form, red duotone,
  halftone dots, CRT scanlines, poster energy)
- system detail (UI chips in Chinese, app icon lockups, battle HP-bar HUD strip)

Visual mode:
Cultural / experimental — halftone, CRT texture, analog print, poster-style
panels, bold accent color, simple but punchy logo.

Palette:
charcoal base + dragon gold as the single dominant accent + brawl red as a
sparse secondary + paper white for type.

Style:
premium, sparse, cinematic, intentional, polished, brand-guidelines deck,
no clutter, no copied real-world logos, no generic purple-blue AI glow.

Typography:
readable, minimal, high hierarchy, no tiny fake text. Chinese display type
should feel heavy, rounded, kid-friendly but sharp.

Logo:
professional, symbolic, simple, ownable, based on "milk drop + dragon",
repeated consistently across panels; never random.
```

## 三、使用注意

- 文生图模型对**中文长标题**容易写错字：优先使用短文案（品牌名 + 一句 tagline），
  或生成后再本地叠字（本目录 `brandkit_3x3.png` 即矢量方案，可作叠图底版）。
- 红/金双色务必强调「金为主、红只点缀」，否则容易生成廉价番茄炒蛋配色。
- 若模型支持参考图：附 `立绘/nailoong.png`（金）与 `立绘/rage.png`（红），
  并按本文件策略描述约束，不要让它照抄立绘原图内容。
