# -*- coding: utf-8 -*-
# 彩蛋角色截图归档：选人竖卡放大 / 战斗截图 / 对局特写
import os
from PIL import Image

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
OUT = '预览截图'

# 1) 选人竖卡放大（1280x720 截图中左侧竖卡区 x 6..184, y 88..666）
im = Image.open(os.path.join(T, 'nl_check_select.png'))
crop = im.crop((6, 88, 184, 666))
w, h = crop.size
crop.resize((int(w * 1.7), int(h * 1.7)), Image.LANCZOS).save(os.path.join(OUT, '彩蛋_1_选人竖卡.png'))
print('saved 彩蛋_1_选人竖卡.png')

# 2) 战斗截图
im2 = Image.open(os.path.join(T, 'nl_check_xiaole.png')).convert('RGB')
im2.save(os.path.join(OUT, '彩蛋_2_看笑了参战.png'))
print('saved 彩蛋_2_看笑了参战.png')

# 3) 对局特写（P1 头部区域放大）
crop3 = im2.crop((170, 400, 560, 690))
w3, h3 = crop3.size
crop3.resize((int(w3 * 1.9), int(h3 * 1.9)), Image.LANCZOS).save(os.path.join(OUT, '彩蛋_3_对局特写.png'))
print('saved 彩蛋_3_对局特写.png')
