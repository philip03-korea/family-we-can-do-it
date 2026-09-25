# -*- coding: utf-8 -*-
"""하울이 세계사 노트 v2 조립 — 페이지 이미지 + 원문/해석 데이터 → 단일 HTML"""
import json, pathlib, shutil, sys, re
sys.stdout.reconfigure(encoding="utf-8")

SP = pathlib.Path(r"C:\Users\User\AppData\Local\Temp\claude\D--dev-family-we-can-do-it\a3ed036f-639f-49ab-9541-11c48042d3a1\scratchpad")
BUILD = SP / "build"
CONTENT = SP / "content"
PAGES = SP / "pages"
ART_SRC = SP / "img"
OUT = SP / "out"
IMGOUT = OUT / "ch17"

# ── 1. 데이터 읽기
tb = []
for f in ["tb_01_06.json", "tb_07_12.json", "tb_13_15.json", "tb_16_18.json", "tb_19_24.json"]:
    part = json.loads((CONTENT / f).read_text(encoding="utf-8"))
    tb.extend(part)
    print(f"  {f}: {len(part)}쪽")
sl = json.loads((CONTENT / "sl_01_33.json").read_text(encoding="utf-8"))
print(f"  슬라이드: {len(sl)}장")

tb.sort(key=lambda p: p["id"])
sl.sort(key=lambda p: p["id"])

# ── 2. 검사
ids = [p["id"] for p in tb]
want = [f"tb{i:02d}" for i in range(1, 25)]
missing = [i for i in want if i not in ids]
dupes = [i for i in set(ids) if ids.count(i) > 1]
if missing or dupes:
    sys.exit(f"교과서 페이지 문제 — 빠짐:{missing} 중복:{dupes}")
sids = [p["id"] for p in sl]
smissing = [f"sl{i:02d}" for i in range(1, 34) if f"sl{i:02d}" not in sids]
if smissing:
    print(f"  ⚠ 슬라이드 빠짐: {smissing}")

nsen = sum(len(b.get("sentences", [])) for p in tb + sl for b in p.get("blocks", []))
nblk = sum(len(p.get("blocks", [])) for p in tb + sl)
nword = sum(len(s.get("words", [])) for p in tb + sl for b in p.get("blocks", []) for s in b.get("sentences", []))
nimp = sum(1 for p in tb + sl for b in p.get("blocks", []) for s in b.get("sentences", []) if s.get("important"))
print(f"  블록 {nblk} · 문장 {nsen} · 중요표시 {nimp} · 단어 {nword}")

# 슬라이드 ↔ 교과서 연결 확인
linked = set()
for s in sl:
    for t in s.get("tb", []):
        linked.add(s["id"])
print(f"  교과서에 묶인 슬라이드 {len(linked)}장 · 따로 보는 슬라이드 {len(sl) - len(linked)}장")

# ── 3. 학습용 AI 그림 배치
ART = {
  "tb04": {"f": "art5.webp", "alt": "16세기 인도 캘리컷 항구의 향신료 시장. 후추·계피·정향이 바구니에 쌓여 있고 뒤편에 포르투갈 범선이 정박해 있다.",
           "cap": "인도 <b>캘리컷</b>의 향신료 시장. 아랍 중개상을 거치며 값이 몇 배로 뛴 이 향신료가 유럽을 바다로 내몬 가장 큰 이유야."},
  "tb05": {"f": "art1.webp", "alt": "대서양을 항해하는 포르투갈 카라벨선. 돛대 세 개에 삼각돛이 달려 있다.",
           "cap": "<b>카라벨선</b>. 작고 빠른 배에 삼각돛을 달아 바람을 거슬러 갈 수 있었어. 오른쪽 교과서 판화와 비교해 봐."},
  "tb07": {"f": "art4.webp", "alt": "1519년 테노치티틀란 둑길에서 만난 코르테스 일행과 몬테수마 2세. 뒤로 피라미드 신전과 운하가 보인다.",
           "cap": "1519년 <b>테노치티틀란</b>에서의 만남. 병사 550명으로 이 거대한 도시에 들어갔어."},
  "tb12": {"f": "art3.webp", "alt": "콜럼버스의 교환. 왼쪽 아메리카의 감자·옥수수·토마토·카카오, 오른쪽 유럽과 아프리카의 밀·말·소·사탕수수, 가운데 범선과 양방향 화살표.",
           "cap": "<b>콜럼버스의 교환</b>. 작물과 가축이 오갔고, 그림에는 안 보이는 <b>천연두</b>도 같이 건너갔어."},
  "tb18": {"f": "art7.webp", "alt": "1600년대 식민지 라틴아메리카. 종탑이 있는 선교촌 성당과 멀리 원주민 노동자들이 오르는 포토시 은광.",
           "cap": "선교촌 성당과 <b>포토시 은광</b>. 교회와 광산이 한 풍경 안에 있는 게 이 시대의 두 얼굴이야."},
  "sl09": {"f": "art2.webp", "alt": "배 안 탁자 위의 항해 도구들. 놋쇠 아스트롤라베, 나무 상자에 든 나침반, 육분의, 낡은 해도.",
           "cap": "<b>아스트롤라베 · 나침반 · 육분의</b>. 해와 별의 높이로 위도를 재서 먼 바다에서도 위치를 알 수 있었어."},
  "sl21": {"f": "art6.webp", "alt": "1630년대 네덜란드. 검은 옷에 흰 주름깃을 단 상인들이 탁자 위의 줄무늬 튤립과 알뿌리를 두고 흥정하고 있다.",
           "cap": "<b>튤립 광풍</b>. 알뿌리 하나가 집 한 채 값까지 갔어. 1637년 거품이 터졌지."},
}

# ── 4. 이미지 복사
if IMGOUT.exists():
    shutil.rmtree(IMGOUT)
IMGOUT.mkdir(parents=True)
n = 0
for f in sorted(PAGES.glob("*.webp")):
    shutil.copy2(f, IMGOUT / f.name); n += 1
for i in range(8):
    src = ART_SRC / f"{i}.webp"
    if src.exists():
        shutil.copy2(src, IMGOUT / f"art{i}.webp"); n += 1
size = sum(f.stat().st_size for f in IMGOUT.iterdir())
print(f"  이미지 {n}개 · {size/1024/1024:.2f} MB")

# ── 5. HTML 조립
shell = (BUILD / "shell.html").read_text(encoding="utf-8")
css = (BUILD / "style.css").read_text(encoding="utf-8")
js = (BUILD / "app.js").read_text(encoding="utf-8")
data = json.dumps({"textbook": tb, "slides": sl, "art": ART}, ensure_ascii=False, separators=(",", ":"))
# </script> 가 데이터 안에 있으면 스크립트 블록이 끊긴다
data = data.replace("</", "<\\/")

html = shell.replace("/*__CSS__*/", css).replace("/*__JS__*/", js).replace("/*__DATA__*/", data)
OUT.mkdir(exist_ok=True)
target = OUT / "haul-worldhistory-ch17.html"
target.write_text(html, encoding="utf-8")
print(f"\n  → {target}")
print(f"  HTML {target.stat().st_size/1024:.0f} KB · 이미지 합계 {size/1024/1024:.2f} MB")
