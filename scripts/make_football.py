#!/usr/bin/env python3
"""Render a photoreal-ish classic soccer ball (spherical shading + true panels)."""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageFilter

OUT = Path("/workspace/public/km-football.png")
W = 640
R = W * 0.48
CX = CY = W / 2
PHI = (1 + math.sqrt(5)) / 2


def normalize(v: tuple[float, ...]) -> tuple[float, float, float]:
    n = math.sqrt(sum(x * x for x in v))
    return (v[0] / n, v[1] / n, v[2] / n)


def rotate(
    p: tuple[float, float, float], ax: float, ay: float, az: float
) -> tuple[float, float, float]:
    x, y, z = p
    c, s = math.cos(ax), math.sin(ax)
    y, z = y * c - z * s, y * s + z * c
    c, s = math.cos(ay), math.sin(ay)
    x, z = x * c + z * s, -x * s + z * c
    c, s = math.cos(az), math.sin(az)
    x, y = x * c - y * s, x * s + y * c
    return (x, y, z)


def truncated_icosahedron_vertices() -> list[tuple[float, float, float]]:
    verts: list[tuple[float, float, float]] = []

    def add_even_perms(a: float, b: float, c: float) -> None:
        for x, y, z in ((a, b, c), (b, c, a), (c, a, b)):
            for sx in (1, -1):
                for sy in (1, -1):
                    for sz in (1, -1):
                        verts.append((sx * x, sy * y, sz * z))

    add_even_perms(0, 1, 3 * PHI)
    add_even_perms(1, 2 + PHI, 2 * PHI)
    add_even_perms(PHI, 2, 2 * PHI + 1)

    uniq: list[tuple[float, float, float]] = []
    seen: set[tuple[float, float, float]] = set()
    for v in verts:
        p = tuple(round(x, 10) for x in normalize(v))
        if p in seen:
            continue
        seen.add(p)  # type: ignore[arg-type]
        uniq.append(normalize(v))
    return uniq


def neighbor_lists(verts: list[tuple[float, float, float]]) -> list[list[int]]:
    neigh: list[list[int]] = [[] for _ in verts]
    for i, a in enumerate(verts):
        ds = sorted((math.dist(a, b), j) for j, b in enumerate(verts) if j != i)
        edge = ds[0][0]
        for d, j in ds:
            if d <= edge * 1.12:
                neigh[i].append(j)
    return neigh


def extract_faces(
    verts: list[tuple[float, float, float]], neigh: list[list[int]]
) -> list[tuple[int, ...]]:
    edges: set[tuple[int, int]] = set()
    for i, ns in enumerate(neigh):
        for j in ns:
            edges.add((min(i, j), max(i, j)))

    def face_from(u: int, v: int) -> tuple[int, ...] | None:
        path = [u]
        for _ in range(8):
            path.append(v)
            cands = [w for w in neigh[v] if w != u]
            if not cands:
                return None
            bu, bv = verts[u], verts[v]
            vin = (bu[0] - bv[0], bu[1] - bv[1], bu[2] - bv[2])
            best = None
            best_ang = None
            for w in cands:
                bw = verts[w]
                vout = (bw[0] - bv[0], bw[1] - bv[1], bw[2] - bv[2])
                cross = (
                    vin[1] * vout[2] - vin[2] * vout[1],
                    vin[2] * vout[0] - vin[0] * vout[2],
                    vin[0] * vout[1] - vin[1] * vout[0],
                )
                trip = cross[0] * bv[0] + cross[1] * bv[1] + cross[2] * bv[2]
                dot = vin[0] * vout[0] + vin[1] * vout[1] + vin[2] * vout[2]
                ang = math.atan2(trip, dot)
                if ang <= 1e-6:
                    ang += 2 * math.pi
                if best_ang is None or ang < best_ang:
                    best_ang = ang
                    best = w
            assert best is not None
            u, v = v, best
            if v == path[0]:
                return tuple(path)
        return None

    faces: set[tuple[int, ...]] = set()
    for u, v in edges:
        for a, b in ((u, v), (v, u)):
            f = face_from(a, b)
            if not f or len(f) not in (5, 6):
                continue
            m = min(range(len(f)), key=lambda i: f[i])
            f1 = f[m:] + f[:m]
            f2 = tuple(reversed(f1))
            m2 = min(range(len(f2)), key=lambda i: f2[i])
            f2 = f2[m2:] + f2[:m2]
            faces.add(f1 if f1 <= f2 else f2)
    return list(faces)


def face_centroid(
    verts: list[tuple[float, float, float]], f: tuple[int, ...]
) -> tuple[float, float, float]:
    c = [0.0, 0.0, 0.0]
    for i in f:
        for k in range(3):
            c[k] += verts[i][k]
    return normalize(tuple(v / len(f) for v in c))  # type: ignore[arg-type]


def point_face_distance(
    p: tuple[float, float, float],
    verts: list[tuple[float, float, float]],
    f: tuple[int, ...],
    center: tuple[float, float, float],
) -> float:
    """Angular distance from point to face center, with edge closeness bonus."""
    # primary: distance to face centroid on sphere
    d = 1 - (p[0] * center[0] + p[1] * center[1] + p[2] * center[2])
    return d


def seam_factor(
    p: tuple[float, float, float],
    verts: list[tuple[float, float, float]],
    f: tuple[int, ...],
) -> float:
    """0 at face interior, ~1 near edges (for seam darkening)."""
    # distance to each great-circle edge plane bounded by consecutive verts
    min_edge = 1e9
    n = len(f)
    for i in range(n):
        a = verts[f[i]]
        b = verts[f[(i + 1) % n]]
        # plane through origin, a, b → normal a×b
        nrm = (
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        )
        nn = math.sqrt(sum(x * x for x in nrm))
        if nn < 1e-9:
            continue
        nrm = (nrm[0] / nn, nrm[1] / nn, nrm[2] / nn)
        # absolute angular distance to plane
        dist = abs(p[0] * nrm[0] + p[1] * nrm[1] + p[2] * nrm[2])
        min_edge = min(min_edge, dist)
    # narrow seam band
    band = 0.045
    if min_edge >= band:
        return 0.0
    t = 1 - min_edge / band
    return t * t


def main() -> None:
    base_verts = truncated_icosahedron_vertices()
    neigh = neighbor_lists(base_verts)
    faces = extract_faces(base_verts, neigh)
    pent = [f for f in faces if len(f) == 5]
    hexs = [f for f in faces if len(f) == 6]
    print(f"verts={len(base_verts)} pent={len(pent)} hex={len(hexs)}")
    if len(pent) != 12 or len(hexs) != 20:
        raise SystemExit("bad topology")

    best_score = -1e9
    best_angles = (0.0, 0.0, 0.0)
    for ax in (i * math.pi / 14 for i in range(-7, 8)):
        for ay in (i * math.pi / 14 for i in range(-10, 11)):
            score = -1e9
            for f in pent:
                c = face_centroid(
                    [rotate(v, ax, ay, 0.0) for v in base_verts], f
                )
                score = max(score, c[2])
            if score > best_score:
                best_score = score
                best_angles = (ax, ay, math.radians(14))

    ax, ay, az = best_angles
    verts = [rotate(v, ax, ay, az) for v in base_verts]
    centers = [face_centroid(verts, f) for f in faces]
    is_pent = [len(f) == 5 for f in faces]
    print("orient", tuple(round(a, 3) for a in best_angles), "score", round(best_score, 3))

    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    px = img.load()
    # Key light from upper-left (classic product-shot look)
    L = normalize((-0.55, 0.48, 0.68))
    V = (0.0, 0.0, 1.0)

    for y in range(W):
        for x in range(W):
            dx = (x + 0.5 - CX) / R
            dy = (y + 0.5 - CY) / R
            d2 = dx * dx + dy * dy
            if d2 > 1.0:
                continue
            z = math.sqrt(max(0.0, 1.0 - d2))
            # screen y down → sphere y up
            p = normalize((dx, -dy, z))

            best_i = 0
            best_d = 1e9
            for i, c in enumerate(centers):
                d = 1 - (p[0] * c[0] + p[1] * c[1] + p[2] * c[2])
                if d < best_d:
                    best_d = d
                    best_i = i

            black = is_pent[best_i]
            seam = seam_factor(p, verts, faces[best_i])

            if black:
                albedo = (22, 22, 24)
            else:
                albedo = (245, 245, 242)

            if seam > 0:
                dark = 0.28 + 0.72 * (1 - seam)
                albedo = (
                    int(albedo[0] * dark),
                    int(albedo[1] * dark),
                    int(albedo[2] * dark * 0.98),
                )

            ndot = max(0.0, p[0] * L[0] + p[1] * L[1] + p[2] * L[2])
            amb = 0.28
            diff = 0.72 * ndot
            hx, hy, hz = normalize((L[0] + V[0], L[1] + V[1], L[2] + V[2]))
            spec = max(0.0, p[0] * hx + p[1] * hy + p[2] * hz) ** 40
            spec_amt = 0.38 if not black else 0.16
            # fill light from lower-right so the dark side isn't crushed
            fill = max(0.0, p[0] * 0.35 + p[1] * -0.2 + p[2] * 0.4) * 0.18
            rim = (1 - z) ** 2.4 * 0.12

            shade = amb + diff + fill + rim
            r = min(255, int(albedo[0] * shade + 255 * spec * spec_amt))
            g = min(255, int(albedo[1] * shade + 255 * spec * spec_amt))
            b = min(255, int(albedo[2] * shade + 245 * spec * spec_amt))

            # very light leather grain (avoid noisy mesh look)
            n = ((x * 51 + y * 37) % 7) - 3
            r = max(0, min(255, r + n))
            g = max(0, min(255, g + n))
            b = max(0, min(255, b + n))

            # clean edge AA, no white halo
            a = 255
            if d2 > 0.965:
                a = max(0, min(255, int(255 * (1 - d2) / 0.035)))
                # premultiply-ish darkening so fringe isn't chalky
                r = int(r * a / 255)
                g = int(g * a / 255)
                b = int(b * a / 255)
            px[x, y] = (r, g, b, a)

    soft = img.filter(ImageFilter.GaussianBlur(0.45))
    img = Image.blend(img, soft, 0.18)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
