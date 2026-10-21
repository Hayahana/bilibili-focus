"""生成扩展图标：圆角蓝底 + 取景框角标 + 播放三角。"""
from PIL import Image, ImageDraw

S = 512
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

# 竖向渐变底
grad = Image.new("RGB", (1, S))
top = (0, 174, 236)     # B站蓝
bottom = (0, 102, 255)
for y in range(S):
    t = y / (S - 1)
    grad.putpixel((0, y), tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
grad = grad.resize((S, S))

# 圆角遮罩
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=112, fill=255)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
white = (255, 255, 255, 255)

# 取景框四角
w = 30           # 线宽
L = 104          # 角标长度
m = 78           # 内缩
for x, y, dx, dy in ((m, m, 1, 1), (S - m, m, -1, 1), (m, S - m, 1, -1), (S - m, S - m, -1, -1)):
    d.line([(x, y), (x + dx * L, y)], fill=white, width=w)
    d.line([(x, y), (x, y + dy * L)], fill=white, width=w)
    d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=white)

# 中间播放三角
d.polygon([(216, 178), (216, 334), (350, 256)], fill=white)

img.save("icons/icon512.png")
for size in (128, 48, 16):
    img.resize((size, size), Image.LANCZOS).save(f"icons/icon{size}.png")
print("ok")
