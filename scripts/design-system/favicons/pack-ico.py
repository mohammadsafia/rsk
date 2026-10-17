"""Pack icon-16/32.png into favicon.ico and rewrite apple-touch-icon.png as opaque RGB. Stdlib only."""
import struct, sys, zlib
from pathlib import Path

PUBLIC = Path(sys.argv[1] if len(sys.argv) > 1 else 'public')

def read_png(path):
    data = path.read_bytes()
    pos, chunks = 8, []
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        chunks.append((kind, data[pos + 8:pos + 8 + length]))
        pos += 12 + length
    ihdr = dict(chunks)[b'IHDR']
    width, height, depth, colour = struct.unpack('>IIBB', ihdr[:10])
    raw = zlib.decompress(b''.join(body for kind, body in chunks if kind == b'IDAT'))
    return width, height, depth, colour, raw

def unfilter(width, height, bpp, raw):
    stride, rows, prev, pos = width * bpp, [], bytearray(width * bpp), 0
    for _ in range(height):
        ftype, line = raw[pos], bytearray(raw[pos + 1:pos + 1 + stride])
        pos += 1 + stride
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b, c = prev[i], prev[i - bpp] if i >= bpp else 0
            if ftype == 1: line[i] = (line[i] + a) & 255
            elif ftype == 2: line[i] = (line[i] + b) & 255
            elif ftype == 3: line[i] = (line[i] + (a + b) // 2) & 255
            elif ftype == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line); prev = line
    return rows

def write_png(path, width, height, colour, rows):
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xFFFFFFFF)
    raw = b''.join(b'\x00' + bytes(row) for row in rows)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, colour, 0, 0, 0))
                     + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

# apple-touch-icon: RGBA -> RGB
w, h, depth, colour, raw = read_png(PUBLIC / 'apple-touch-icon.png')
assert depth == 8 and colour in (2, 6), (depth, colour)
if colour == 6:
    rgba = unfilter(w, h, 4, raw)
    rgb = [bytearray(b for i in range(w) for b in row[i * 4:i * 4 + 3]) for row in rgba]
    write_png(PUBLIC / 'apple-touch-icon.png', w, h, 2, rgb)
else:  # already opaque RGB
    rgb = unfilter(w, h, 3, raw)
print('canvas pixel sRGB: #%02x%02x%02x' % tuple(rgb[0][0:3]))

# favicon.ico with PNG payloads (16, 32)
images = [(16, (PUBLIC / 'icon-16.png').read_bytes()), (32, (PUBLIC / 'icon-32.png').read_bytes())]
header = struct.pack('<HHH', 0, 1, len(images))
offset, entries = 6 + 16 * len(images), b''
for size, png in images:
    entries += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(png), offset)
    offset += len(png)
(PUBLIC / 'favicon.ico').write_bytes(header + entries + b''.join(png for _, png in images))
for size, _ in images:
    (PUBLIC / f'icon-{size}.png').unlink()
print('wrote favicon.ico (16, 32) and opaque apple-touch-icon.png')
