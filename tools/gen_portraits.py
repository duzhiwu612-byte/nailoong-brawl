# -*- coding: utf-8 -*-
"""奶龙大乱斗 · 立绘生成器（全自动、免费、无需注册）
双通道自动抓取：
  通道A：pollinations.ai（免费窗口约每 5 分钟放行 1 张，脚本自动轮询抢窗口，最快交付）
  通道B：Stable Horde 匿名任务（提交后慢慢排队，作为兜底）
用法：
    python tools/gen_portraits.py            # 生成/补齐全部 7 只（已存在的跳过）
    python tools/gen_portraits.py laugh      # 只处理指定角色（可多个）
输出：立绘/<id>.png|jpg|webp（自动识别格式）。游戏自动加载；缺失自动回退代码绘制。
"""
import os
import sys
import time
import json
import urllib.request
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '立绘')
os.makedirs(OUT, exist_ok=True)

HORDE = 'https://stablehorde.net/api/v2'
HORDE_KEY = '0000000000'   # 匿名
HORDE_MODELS = ['Dreamshaper', 'stable_diffusion']

POLL_SIZE = 768
POLL_MODEL = 'turbo'

BASE_STYLE = ('cute chibi kawaii baby dragon mascot character, full body, standing, '
              'centered composition with margin around character, thick bold clean outlines, '
              'smooth cel shading, glossy highlights, vibrant colors, plain soft cream background, '
              'cartoon sticker illustration, adorable, funny expression, no text')

HORDE_STYLE = ('masterpiece, best quality, ' + BASE_STYLE)
HORDE_NEG = ('lowres, bad anatomy, bad hands, extra limbs, extra fingers, text, watermark, '
             'signature, blurry, ugly, deformed, cropped')

CHARS = [
    ("classic", 101,
     "chubby round sunshine-yellow baby dragon, big round head, tiny stubby arms and legs, "
     "big sparkly eyes, rosy cheeks, small rounded horn bumps, huge round belly, "
     "hugging a rice ball snack, cheerful goofy grin, food lover"),
    ("kungfu", 102,
     "chubby yellow baby dragon wearing a red kung fu vest and a red headband with trailing ribbons, "
     "holding wooden chopsticks like nunchaku, martial arts fighting stance, confident smile, kung fu master"),
    ("laugh", 103,
     "chubby yellow baby dragon with a smaller head and a bigger round body, laughing uproariously "
     "with wide open mouth, happy tears in the corners of eyes, pink sound wave arcs around its head, "
     "contagious laughter, squinting happy eyes"),
    ("worker", 104,
     "chubby yellow baby dragon wearing an office suit with necktie and an employee id badge, "
     "tired panda dark circles under the eyes, holding a coffee cup and a briefcase, "
     "determined but exhausted expression, office worker"),
    ("alien", 105,
     "chubby yellow baby dragon wearing a white astronaut space suit with a small jetpack, "
     "glowing cyan visor over the eyes, tiny antenna on head, small rocket flames, "
     "floating slightly above the ground, sci-fi cute"),
    ("bombloong", 106,
     "chubby pastel-blue baby dinosaur dragon, wearing a cracked white eggshell hat like a helmet, "
     "tiny purple creatures floating beside it, proud pouty flexing pose, small wings, strongest dragon energy"),
    ("golden", 107,
     "chubby shiny golden baby dragon, metallic gold gradient skin, sparkling star glitters around, "
     "wearing a tiny golden crown, smug luxurious expression, treasure sparkles everywhere, hidden rare edition"),
    ("naiwa", 108,
     "tiny newborn baby version of the chubby yellow dragon, very small fragile body with huge oversized head, "
     "giant sparkling curious eyes, wearing a baby bib and holding a baby milk bottle, little pacifier clip on a string, "
     "stubby limbs, wobbly standing on tiny feet, sweet innocent smile, baby blue accents"),
]


def img_ext(data):
    """识别图片格式，返回扩展名或 None"""
    if len(data) < 24:
        return None
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return 'png'
    if data[:3] == b'\xff\xd8\xff':
        return 'jpg'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return 'webp'
    return None


def save_img(cid, data):
    ext = img_ext(data)
    if not ext or len(data) < 15000:
        return False
    for old in ('png', 'jpg', 'webp'):
        p = os.path.join(OUT, cid + '.' + old)
        if os.path.exists(p):
            os.remove(p)
    path = os.path.join(OUT, cid + '.' + ext)
    with open(path, 'wb') as f:
        f.write(data)
    print('  [%s] 已保存 %s (%.0fKB)' % (cid, path, len(data) / 1024))
    return True


def has_portrait(cid):
    for ext in ('png', 'jpg', 'webp'):
        if os.path.exists(os.path.join(OUT, cid + '.' + ext)):
            return True
    return False


# ---------- 通道A: pollinations ----------

def fetch_pollinations(desc, seed):
    q = urllib.parse.urlencode({
        'width': POLL_SIZE, 'height': POLL_SIZE, 'seed': seed,
        'nologo': 'true', 'model': POLL_MODEL,
    })
    url = 'https://image.pollinations.ai/prompt/' + urllib.parse.quote(desc + ', ' + BASE_STYLE) + '?' + q
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (NailongFight)'})
    try:
        with urllib.request.urlopen(req, timeout=150) as r:
            data = r.read()
        return data if img_ext(data) and len(data) > 15000 else None
    except Exception:
        return None


# ---------- 通道B: Stable Horde ----------

def horde_api(path, payload=None):
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(
        HORDE + path, data=data, method='POST' if data else 'GET',
        headers={'Content-Type': 'application/json', 'apikey': HORDE_KEY,
                 'User-Agent': 'NailongFight/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def submit_horde(desc, seed):
    payload = {
        'prompt': desc + ', ' + HORDE_STYLE,
        'params': {'width': 768, 'height': 768, 'steps': 28, 'n': 1,
                   'sampler_name': 'k_euler_a', 'cfg_scale': 7, 'seed': seed,
                   'negative_prompt': HORDE_NEG},
        'models': HORDE_MODELS,
        'nsfw': False,
    }
    return horde_api('/generate/async', payload).get('id')


def horde_poll(jid):
    """返回 (state, img_url)：state in waiting/processing/done/faulted"""
    try:
        st = horde_api('/generate/check/' + jid)
        if st.get('faulted'):
            return 'faulted', None
        if st.get('done'):
            full = horde_api('/generate/status/' + jid)
            gens = full.get('generations') or []
            if gens:
                return 'done', gens[0].get('img')
            return 'faulted', None
        return ('processing' if st.get('processing') else 'waiting'), None
    except Exception:
        return 'waiting', None


def download(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'NailongFight/1.0'})
    with urllib.request.urlopen(req, timeout=240) as r:
        return r.read()


# ---------- 主流程 ----------

def main():
    ids = sys.argv[1:] or [c[0] for c in CHARS]
    todo = [c for c in CHARS if c[0] in ids and not has_portrait(c[0])]
    if not todo:
        print('全部已有立绘，无需生成。')
        return
    print('待生成: ' + ', '.join(c[0] for c in todo))

    # 通道B：全部先提交到 Horde 排队（兜底）
    horde_jobs = {}
    for cid, seed, desc in todo:
        try:
            horde_jobs[cid] = submit_horde(desc, seed)
            print('  [%s] Horde 已排队 %s' % (cid, horde_jobs[cid]))
        except Exception as e:
            print('  [%s] Horde 提交失败: %s' % (cid, e))
        time.sleep(1)

    # 通道A主循环：轮询抢 pollinations 免费窗口 + 顺带查 Horde
    t0 = time.time()
    turn = 0
    MAX_WAIT = 4500          # 最长 75 分钟
    while todo and time.time() - t0 < MAX_WAIT:
        cid, seed, desc = todo[turn % len(todo)]
        d = fetch_pollinations(desc, seed)
        if d and save_img(cid, d):
            print('  [%s] pollinations 成功' % cid)
            todo = [t for t in todo if t[0] != cid]
            continue                      # 成功后立即再试下一只，抓住连放窗口
        # 顺带检查 Horde
        for t in list(todo):
            jid = horde_jobs.get(t[0])
            if not jid:
                continue
            state, url = horde_poll(jid)
            if state == 'done' and url:
                try:
                    if save_img(t[0], download(url)):
                        print('  [%s] Horde 成功' % t[0])
                        todo = [x for x in todo if x[0] != t[0]]
                except Exception:
                    pass
            elif state == 'faulted':
                horde_jobs.pop(t[0], None)
        turn += 1
        time.sleep(40)

    done = [c[0] for c in CHARS if c[0] in ids and has_portrait(c[0])]
    miss = [c[0] for c in CHARS if c[0] in ids and not has_portrait(c[0])]
    print('完成: %d/%d  成功=%s  缺失=%s' % (len(done), len(ids), ','.join(done), ','.join(miss)))
    if miss:
        print('缺失角色可稍后重跑: python tools/gen_portraits.py ' + ' '.join(miss))


if __name__ == '__main__':
    main()
