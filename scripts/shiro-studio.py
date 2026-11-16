"""SHIRO: ponowne opracowanie wizualizacji na jednolitym tle studyjnym #efefef.

Oryginalne grafiki klienta są tylko nakładane (perspektywa + cieniowanie bazy),
nigdy generowane. Puste bazy pochodzą z assets/studio-session/bases/.
Tło każdej bazy jest spłaszczane do #efefef z zachowaniem jej prawdziwego cienia,
dzięki czemu wszystkie ujęcia łączą się bez widocznych prostokątów.

Uruchomienie: python3 scripts/shiro-studio.py [katalog_wyjściowy]
"""
import sys, os, subprocess
import numpy as np, cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASES = os.path.join(ROOT, 'assets/studio-session/bases')
ORIG = os.path.join(ROOT, 'assets/studio-session/originals/shiro')
MEDIA = os.path.join(ROOT, 'public/media/shiro')
OUT = sys.argv[1] if len(sys.argv) > 1 else MEDIA
BG = 239.0


def load(path, mode='RGB'):
    return np.asarray(Image.open(path).convert(mode)).astype(np.float32)


def lum(img):
    return img[..., 0] * .299 + img[..., 1] * .587 + img[..., 2] * .114


def flatten_background(base, obj_mask):
    """Zastępuje winietę bazy płaskim tłem BG, zachowując cień (stosunek do modelu tła)."""
    m8 = (obj_mask > .5).astype(np.uint8) * 255
    grow = cv2.dilate(m8, np.ones((41, 41), np.uint8))
    model = cv2.inpaint(base.clip(0, 255).astype(np.uint8), grow, 9, cv2.INPAINT_TELEA).astype(np.float32)
    model = cv2.GaussianBlur(model, (0, 0), 70)
    ratio = (lum(base) / np.maximum(lum(model), 1)).clip(0, 1.0)
    flat = np.repeat((BG * ratio)[..., None], 3, axis=2)
    soft = cv2.GaussianBlur(obj_mask.astype(np.float32), (0, 0), 1.2)[..., None]
    return flat * (1 - soft) + base * soft


def largest_quad(mask):
    cnts, _ = cv2.findContours(mask.astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea)
    box = cv2.boxPoints(cv2.minAreaRect(c))
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, .02 * peri, True)
    pts = box.astype(np.float32)
    if len(approx) == 4:  # perspektywę bierzemy z konturu tylko, gdy narożniki leżą blisko prostokąta
        cand = approx.reshape(-1, 2).astype(np.float32)
        if max(np.min(np.linalg.norm(box - p, axis=1)) for p in cand) < .04 * peri:
            pts = cand
    ctr = pts.mean(0)
    order = np.argsort(np.arctan2(pts[:, 1] - ctr[1], pts[:, 0] - ctr[0]))  # zgodnie z ruchem wskazówek (oś y w dół)
    pts = pts[order]
    start = np.argmin(pts.sum(1))
    return np.roll(pts, -start, axis=0).astype(np.float32), c


def paper_on_base(base_name, art, inset=2.0):
    """Nakłada płaską grafikę na pustą kartkę z bazy. Zwraca obraz z płaskim tłem."""
    base = load(os.path.join(BASES, base_name))
    L = lum(base)
    border = np.concatenate([L[:20].ravel(), L[-20:].ravel(), L[:, :20].ravel(), L[:, -20:].ravel()])
    t = (np.median(border) + np.percentile(L, 99.5)) / 2
    paper = L > t
    paper = cv2.morphologyEx(paper.astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8)) > 0
    quad, contour = largest_quad(paper)
    c = quad.mean(0)
    quad = c + (quad - c) * (1 - inset / np.linalg.norm(quad - c, axis=1, keepdims=True))
    # długi bok grafiki ma trafić na długi bok kartki
    w_top = np.linalg.norm(quad[1] - quad[0]); h_left = np.linalg.norm(quad[3] - quad[0])
    a = art
    if (w_top > h_left) != (a.shape[1] > a.shape[0]):
        quad = np.roll(quad, 1, axis=0)
    h, w = a.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), quad)
    warped = cv2.warpPerspective(a, M, (base.shape[1], base.shape[0]), flags=cv2.INTER_LANCZOS4)
    face = cv2.warpPerspective(np.ones((h, w), np.float32), M, (base.shape[1], base.shape[0]), flags=cv2.INTER_LINEAR)
    inside = L[face > .99]
    shade = (L / np.percentile(inside, 92)).clip(.72, 1.04)[..., None]
    lit = warped[..., :3] * shade
    alpha = face[..., None] * (warped[..., 3:4] / 255 if warped.shape[2] == 4 else 1)
    comp = base * (1 - alpha) + lit * alpha
    region = np.zeros(paper.shape, np.uint8)
    cv2.fillPoly(region, [cv2.convexHull(contour).astype(np.int32)], 1)
    obj = cv2.dilate(np.maximum(region, (face > .01).astype(np.uint8)), np.ones((7, 7), np.uint8)).astype(np.float32)
    return flatten_background(comp, obj)


def garment_on_base(base_name, side, logo, center_y, width_frac):
    """Wycina przód lub tył odzieży z bazy (lewa/prawa połowa) i nadrukowuje znak."""
    base = load(os.path.join(BASES, base_name))
    H, W = base.shape[:2]
    L = lum(base)
    dark = (L < 110).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(dark)
    comps = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])[:2]
    comps = sorted(comps, key=lambda i: stats[i, cv2.CC_STAT_LEFT])
    gi = comps[0 if side == 'front' else 1]
    gmask = (lab == gi)
    x, y, w, h = stats[gi, :4]
    out = flatten_background(base, (dark > 0).astype(np.float32))
    others = np.zeros_like(dark)
    for i in comps:
        if i != gi: others |= (lab == i).astype(np.uint8)
    others = cv2.dilate(others, np.ones((61, 61), np.uint8)) > 0
    out[others & ~gmask] = BG
    if logo is not None:
        lw = int(w * width_frac); lh = int(logo.shape[0] * lw / logo.shape[1])
        lg = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
        cx = x + w // 2; cy = int(y + h * center_y)
        x0, y0 = cx - lw // 2, cy - lh // 2
        region = L[y0:y0 + lh, x0:x0 + lw]
        # Cieniowanie i fałdy tkaniny modulują nadruk
        sm = cv2.GaussianBlur(region, (0, 0), 3)
        shade = (sm / max(np.median(sm), 1)).clip(.55, 1.45) ** .55
        gy, gx = np.gradient(cv2.GaussianBlur(region, (0, 0), 6))
        mapx = (np.arange(lw)[None, :] + gx * 1.6).astype(np.float32)
        mapy = (np.arange(lh)[:, None] + gy * 1.6).astype(np.float32)
        mapx = np.broadcast_to(mapx, (lh, lw)).copy(); mapy = np.broadcast_to(mapy, (lh, lw)).copy()
        lg = cv2.remap(lg, mapx, mapy, cv2.INTER_LINEAR, borderValue=0)
        a = cv2.GaussianBlur(lg[..., 3] / 255, (0, 0), .6)[..., None] * .94
        hp = (region - cv2.GaussianBlur(region, (0, 0), 1.5))[..., None]
        ink = (np.array([236, 236, 232], np.float32) * shade[..., None] + hp * 1.2).clip(0, 255)
        out[y0:y0 + lh, x0:x0 + lw] = out[y0:y0 + lh, x0:x0 + lw] * (1 - a) + ink * a
    return out, (x, y, w, h)


def place(canvas, img, box, scale, pos):
    """Wkleja ujęcie z płaskim tłem: mnożenie przez img/BG zachowuje cień, bez krawędzi."""
    x, y, w, h = box
    pad = int(max(w, h) * .12)
    x0, y0 = max(x - pad, 0), max(y - pad, 0)
    x1, y1 = min(x + w + pad, img.shape[1]), min(y + h + pad, img.shape[0])
    crop = img[y0:y1, x0:x1]
    crop = cv2.resize(crop, (int(crop.shape[1] * scale), int(crop.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    px, py = int(pos[0] - crop.shape[1] / 2), int(pos[1] - crop.shape[0] / 2)
    ch, cw = crop.shape[:2]
    sx0, sy0 = max(0, -px), max(0, -py)
    tx0, ty0 = max(0, px), max(0, py)
    tx1, ty1 = min(canvas.shape[1], px + cw), min(canvas.shape[0], py + ch)
    sub = crop[sy0:sy0 + ty1 - ty0, sx0:sx0 + tx1 - tx0]
    canvas[ty0:ty1, tx0:tx1] = canvas[ty0:ty1, tx0:tx1] * (sub / BG)


def bbox(img, thr=6):
    d = np.abs(lum(img) - BG) > thr
    ys, xs = np.where(d)
    return xs.min(), ys.min(), xs.max() - xs.min(), ys.max() - ys.min()


def canvas(w, h):
    return np.full((h, w, 3), BG, np.float32)


def save(img, name, widths=(1536, 768), size=None):
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    paths = []
    for w in widths:
        stem, ext = os.path.splitext(name)
        fn = name if w == widths[0] else f"{stem.replace('-1536', '')}-{w}{ext}"
        target = im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        p = os.path.join(OUT, fn)
        target.save(p, quality=90, method=6)
        paths.append(p)
    return paths


def card_scene(art, size, base='single-card.png', scale=None):
    shot = paper_on_base(base, art)
    b = bbox(shot)
    W, H = size
    s = scale or min(W * .78 / b[2], H * .78 / b[3])
    cv_ = canvas(W, H)
    place(cv_, shot, b, s, (W / 2, H / 2))
    return cv_


def main():
    os.makedirs(OUT, exist_ok=True)
    logo = load(os.path.join(MEDIA, 'logo.webp'), 'RGBA')

    # Wizytówki: każda osobno, w całości w kadrze
    for src, name in [('mechanic-source.png', 'mechanic-1536.webp'), ('car-rental-source.png', 'car-rental-1536.webp')]:
        art = load(os.path.join(MEDIA, src), 'RGBA')
        flat = art[..., :3] * (art[..., 3:4] / 255) + 20 * (1 - art[..., 3:4] / 255)
        save(card_scene(np.dstack([flat, np.full(art.shape[:2], 255, np.float32)]), (1536, 854)), name)

    # Znak na czarnej karcie
    W, H = 1400, 800
    card = np.zeros((H, W, 4), np.float32); card[..., :3] = 18; card[..., 3] = 255
    lw = int(W * .66); lh = int(logo.shape[0] * lw / logo.shape[1])
    lg = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
    y0, x0 = (H - lh) // 2, (W - lw) // 2
    a = lg[..., 3:4] / 255
    card[y0:y0 + lh, x0:x0 + lw, :3] = card[y0:y0 + lh, x0:x0 + lw, :3] * (1 - a) + lg[..., :3] * a
    save(card_scene(card, (1536, 830)), 'shiro-mark-presentation-1536.webp')

    # Vouchery: awers i rewers w całości, bez przycinania przez kadr
    shots = []
    for f in ['voucher-front-1536.webp', 'voucher-rewers-1536.webp']:
        art = load(os.path.join(ORIG, f), 'RGBA')
        shot = paper_on_base('single-voucher.png', art)
        shots.append((shot, bbox(shot)))
    scene = canvas(1536, 1024)
    s = min(1536 * .64 / max(b[2] for _, b in shots), 1024 * .43 / max(b[3] for _, b in shots))
    place(scene, shots[1][0], shots[1][1], s, (1536 * .62, 1024 * .30))
    place(scene, shots[0][0], shots[0][1], s, (1536 * .38, 1024 * .70))
    save(scene, 'voucher-cutout-1536.webp')

    # Odzież: przód koszulki i bluzy z nadrukiem
    tee, tb = garment_on_base('tshirt.png', 'front', logo, .30, .30)
    hood, hb = garment_on_base('hoodie.png', 'front', logo, .575, .24)
    scene = canvas(1536, 1024)
    sc = min(1536 * .40 / hb[2], 1024 * .84 / hb[3])
    place(scene, hood, hb, sc, (1536 * .28, 1024 * .51))
    place(scene, tee, tb, sc * .98, (1536 * .72, 1024 * .53))
    save(scene, 'shiro-apparel-scene.webp')
    for img, box, name, size in [(tee, tb, 'koszulka', 1145), (hood, hb, 'bluza', 1131)]:
        por = canvas(720, 1280)
        s = min(720 * .86 / box[2], 1280 * .62 / box[3])
        place(por, img, box, s, (360, 640))
        Image.fromarray(por.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, f'{name}-poster.webp'), quality=90, method=6)
        studio = canvas(size, round(size * 1.2))
        s2 = min(size * .82 / box[2], studio.shape[0] * .8 / box[3])
        place(studio, img, box, s2, (size / 2, studio.shape[0] / 2))
        im = Image.fromarray(studio.clip(0, 255).astype(np.uint8))
        im.save(os.path.join(OUT, f'{name}-studio-{size}.webp'), quality=90, method=6)
        im.resize((768, round(im.height * 768 / im.width)), Image.LANCZOS).save(os.path.join(OUT, f'{name}-studio-768.webp'), quality=88, method=6)
        # Spokojne 6-sekundowe najechanie kamery na nadruk
        poster = os.path.join(OUT, f'{name}-poster.webp')
        png = f'/tmp/{name}-poster.png'; Image.open(poster).save(png)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', png, '-vf',
                        "scale=1440:2560,zoompan=z='1+0.18*on/180':x='iw/2-(iw/zoom/2)':y='ih*0.40-(ih/zoom/2)':d=180:s=720x1280:fps=30,format=yuv420p",
                        '-t', '6', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-movflags', '+faststart',
                        os.path.join(OUT, f'{name}.mp4')], check=True)


if __name__ == '__main__':
    main()
