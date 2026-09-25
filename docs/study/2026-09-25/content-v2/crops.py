# -*- coding: utf-8 -*-
"""교과서 페이지에서 그림만 잘라 낸다. 좌표는 페이지 크기 대비 백분율(0~100)."""
import json, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
import pymupdf

PDF = r"D:\OneDrive\문서\카카오톡 받은 파일\Ch. 17.pdf"
OUT = pathlib.Path(r"C:\Users\User\AppData\Local\Temp\claude\D--dev-family-we-can-do-it\a3ed036f-639f-49ab-9541-11c48042d3a1\scratchpad\crops")
OUT.mkdir(exist_ok=True)

# page: [ {box:[x0,y0,x1,y1], at: 그 페이지 figure 블록 순번(없으면 None), cap/alt: 따로 붙일 때만} ]
CROPS = {
 "tb01": [{"box": [0, 0, 100, 41], "at": 0}],
 "tb02": [
   {"box": [0, 76, 100, 98], "at": 0},
   {"box": [71, 26, 100, 54], "at": None,
    "cap": "<b>바스쿠 다 가마</b>. 위 인용문(1497–1499 항해 일지)을 남긴 사람이야.",
    "alt": "모자를 쓰고 수염을 기른 바스쿠 다 가마의 초상"},
   {"box": [7, 50, 34, 77], "at": None,
    "cap": "<b>에르난 코르테스</b>. 아래 인용문에서 몬테수마와 말을 주고받는 사람이야.",
    "alt": "갑옷 차림에 수염을 기른 에르난 코르테스의 초상"},
 ],
 "tb03": [
   {"box": [0, 11, 100, 54], "at": 0},
   {"box": [46, 54, 92, 74], "at": 1},
   {"box": [0, 75, 100, 97], "at": 2},
 ],
 "tb05": [{"box": [58, 44, 100, 96], "at": 0}],
 "tb06": [{"box": [0, 0, 45, 44], "at": 0}],
 "tb07": [{"box": [41, 38, 93, 73], "at": 0}],
 "tb09": [{"box": [0, 2, 70, 40], "at": 0}],
 "tb11": [{"box": [3, 59, 70, 94], "at": 0}],
 "tb12": [{"box": [0, 2, 63, 46], "at": 0}],
 "tb13": [{"box": [56, 25, 100, 60], "at": 0}],
 "tb14": [{"box": [1, 43, 31, 97], "at": 0}],
 "tb15": [{"box": [0, 2, 100, 41], "at": 0}],
 "tb17": [{"box": [0, 43, 100, 95], "at": 0}],
 "tb18": [{"box": [0, 33, 34, 63], "at": 0}],
 "tb19": [{"box": [71, 7, 96, 23], "at": 0}],
 "tb20": [{"box": [53, 31, 92, 80], "at": 0}],
 "tb21": [{"box": [38, 2, 95, 36], "at": 0}],
 "tb24": [{"box": [54, 24, 97, 65], "at": 0}],
}

ZOOM = 2.3
doc = pymupdf.open(PDF)
made = {}
total = 0
for pid, items in CROPS.items():
    idx = int(pid[2:]) - 1
    pg = doc[idx]
    r = pg.rect
    out = []
    for n, it in enumerate(items):
        x0, y0, x1, y1 = it["box"]
        clip = pymupdf.Rect(r.x0 + r.width * x0 / 100, r.y0 + r.height * y0 / 100,
                            r.x0 + r.width * x1 / 100, r.y0 + r.height * y1 / 100)
        pix = pg.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=clip, alpha=False)
        name = f"{pid}_f{n + 1}.webp"
        f = OUT / name
        try:
            pix.pil_save(f, format="WEBP", quality=74, method=4)
        except Exception:
            f = OUT / f"{pid}_f{n + 1}.jpg"; name = f.name
            pix.pil_save(f, format="JPEG", quality=82, optimize=True)
        total += f.stat().st_size
        out.append({"f": name, "at": it.get("at"), "cap": it.get("cap"), "alt": it.get("alt"),
                    "w": pix.width, "h": pix.height})
        print(f"  {name} {pix.width}x{pix.height} {f.stat().st_size//1024}KB")
    made[pid] = out
doc.close()

(OUT / "crops.json").write_text(json.dumps(made, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n그림 {sum(len(v) for v in made.values())}개 · {total/1024/1024:.2f} MB")
