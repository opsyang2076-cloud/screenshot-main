#!/usr/bin/env python3
"""生成扩展图标（纯标准库，无需 Pillow）。

用法：python icons/make_icons.py
输出：icons/icon16.png icon48.png icon128.png
"""
import os
import struct
import zlib

BG_FROM = (90, 118, 255)   # #5A76FF
BG_TO = (61, 89, 232)      # #3D59E8
CORNER = 0.225             # 圆角半径 / 边长
SS = 4                     # 超采样倍数

# 双向箭头（上箭头向右，下箭头向左），归一化坐标
ARROW_POLYGONS = [
    [(0.24, 0.325), (0.70, 0.325), (0.70, 0.245), (0.92, 0.375),
     (0.70, 0.505), (0.70, 0.425), (0.24, 0.425)],
    [(0.76, 0.575), (0.30, 0.575), (0.30, 0.495), (0.08, 0.625),
     (0.30, 0.755), (0.30, 0.675), (0.76, 0.675)],
]


def in_poly(x, y, poly):
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y):
            xt = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if x < xt:
                inside = not inside
    return inside


def in_rounded_square(x, y, size):
    r = CORNER * size
    if x < r and y < r:
        return (x - r) ** 2 + (y - r) ** 2 <= r * r
    if x > size - r and y < r:
        return (x - (size - r)) ** 2 + (y - r) ** 2 <= r * r
    if x < r and y > size - r:
        return (x - r) ** 2 + (y - (size - r)) ** 2 <= r * r
    if x > size - r and y > size - r:
        return (x - (size - r)) ** 2 + (y - (size - r)) ** 2 <= r * r
    return True


def render(size):
    rows = []
    step = 1.0 / SS
    for py in range(size):
        row = bytearray()
        for px in range(size):
            bg_hits = 0
            fg_hits = 0
            for sy in range(SS):
                for sx in range(SS):
                    x = px + (sx + 0.5) * step
                    y = py + (sy + 0.5) * step
                    if not in_rounded_square(x, y, size):
                        continue
                    bg_hits += 1
                    nx, ny = x / size, y / size
                    if any(in_poly(nx, ny, p) for p in ARROW_POLYGONS):
                        fg_hits += 1
            total = SS * SS
            if bg_hits == 0:
                row += b'\x00\x00\x00\x00'
                continue
            t = (px + py) / (2.0 * size - 2.0) if size > 1 else 0.0
            br = round(BG_FROM[0] + (BG_TO[0] - BG_FROM[0]) * t)
            bg = round(BG_FROM[1] + (BG_TO[1] - BG_FROM[1]) * t)
            bb = round(BG_FROM[2] + (BG_TO[2] - BG_FROM[2]) * t)

            fg_ratio = fg_hits / float(bg_hits)
            r = round(br + (255 - br) * fg_ratio)
            g = round(bg + (255 - bg) * fg_ratio)
            b = round(bb + (255 - bb) * fg_ratio)

            alpha = round(255 * bg_hits / total)
            row += bytes((r, g, b, alpha))
        rows.append(bytes(row))
    return rows


def write_png(path, size, rows):
    def chunk(tag, data):
        payload = tag + data
        return (struct.pack('>I', len(data)) + payload +
                struct.pack('>I', zlib.crc32(payload) & 0xFFFFFFFF))

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    raw = b''.join(b'\x00' + r for r in rows)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
           chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as fh:
        fh.write(png)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    for size in (16, 48, 128):
        write_png(os.path.join(here, 'icon%d.png' % size), size, render(size))
        print('wrote icon%d.png' % size)


if __name__ == '__main__':
    main()
