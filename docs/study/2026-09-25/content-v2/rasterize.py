# -*- coding: utf-8 -*-
import sys, pathlib
sys.stdout.reconfigure(encoding='utf-8')
import pymupdf

OUT = pathlib.Path(r"C:\Users\User\AppData\Local\Temp\claude\D--dev-family-we-can-do-it\a3ed036f-639f-49ab-9541-11c48042d3a1\scratchpad\pages")
OUT.mkdir(parents=True, exist_ok=True)

jobs = [
    (r"D:\OneDrive\문서\카카오톡 받은 파일\Ch. 17.pdf", "tb", 1.75, 62),
    (r"D:\OneDrive\문서\카카오톡 받은 파일\09.21.pdf", "sl", 1.55, 68),
]
total = 0; made = []
for path, tag, zoom, q in jobs:
    d = pymupdf.open(path)
    for i, pg in enumerate(d):
        pix = pg.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        base = f"{tag}{i+1:02d}"
        f = OUT / (base + ".webp")
        if f.exists() and f.stat().st_size > 0:
            total += f.stat().st_size; made.append(f.name); continue
        try:
            pix.pil_save(f, format="WEBP", quality=q, method=4)
        except Exception as e:
            # webp 인코더가 못 삼키는 페이지는 jpeg 로 (품질 차이 거의 없음)
            try: f.unlink()
            except Exception: pass
            f = OUT / (base + ".jpg")
            pix.pil_save(f, format="JPEG", quality=78, optimize=True)
            print(f"  ! {base}: webp 실패 → jpg ({e})")
        total += f.stat().st_size; made.append(f.name)
    d.close()
print("파일 수:", len(made), "합계 MB:", round(total/1024/1024, 2))
