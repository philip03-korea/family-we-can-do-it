(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("notedata").textContent);
  var TB = DATA.textbook, SL = DATA.slides, ART = DATA.art || {};
  var SLBY = {};
  SL.forEach(function (s) { SLBY[s.id] = s; });

  var IMG = "ch17/";           // 페이지 이미지 폴더
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* ── 단어 사전: 모든 페이지의 words 를 모아 한 곳에 */
  var GLOSS = {};
  function addWord(w, ko, x, where) {
    if (!w) return;
    var k = w.toLowerCase().trim();
    if (!k) return;
    if (!GLOSS[k]) GLOSS[k] = { w: w, ko: ko, x: x, where: [] };
    if (where && GLOSS[k].where.indexOf(where) < 0) GLOSS[k].where.push(where);
  }
  function collect(list) {
    list.forEach(function (pg) {
      (pg.blocks || []).forEach(function (b) {
        (b.sentences || []).forEach(function (s) {
          (s.words || []).forEach(function (w) { addWord(w.w, w.ko, w.x, pg.id); });
        });
        if (b.kind === "gloss" && b.en) addWord(b.en, b.ko, b.def_ko || b.def_en, pg.id);
      });
    });
  }
  collect(TB); collect(SL);

  /* ── 문장 렌더 */
  var sid = 0, SEN = {};
  function senHTML(s) {
    var id = "s" + (++sid);
    SEN[id] = s;
    var cls = "sen" + (s.important ? " imp" : "");
    return '<span class="' + cls + '" data-s="' + id + '" role="button" tabindex="0">' + esc(s.en) + "</span> ";
  }
  function paraHTML(sentences) {
    return '<p class="para">' + (sentences || []).map(senHTML).join("") + "</p>";
  }

  /* ── 블록 렌더 */
  function blockHTML(b) {
    switch (b.kind) {
      case "heading":
        return '<h4 class="blk-h">' + esc(b.en) + (b.ko ? "<small>" + esc(b.ko) + "</small>" : "") + "</h4>";
      case "guide":
        return '<div class="blk-guide"><b>GUIDING QUESTION</b>' + paraHTML([{ en: b.en, ko: b.ko, note: b.note }]) + "</div>";
      case "quote":
        return '<div class="blk-quote">' + paraHTML(b.sentences) + "</div>";
      case "gloss":
        return '<div class="blk-gloss"><span class="gw">' + esc(b.en) + "</span> " +
          (b.ko ? "<b>" + esc(b.ko) + "</b>" : "") +
          (b.def_en ? paraHTML([{ en: b.def_en, ko: b.def_ko, note: b.note }]) : "") + "</div>";
      case "figure":
        return '<div class="blk-fig"><span class="fw">🖼 그림</span> ' +
          (b.where ? '<span style="font-size:12.5px;color:var(--muted)"> · ' + esc(b.where) + "</span>" : "") +
          (b.en ? paraHTML([{ en: b.en, ko: b.ko, note: b.note, important: !!b.note }])
                : '<p class="para">' + esc(b.ko || "") + "</p>" +
                  (b.note ? '<div class="senbox note"><span class="lb">여기를 봐</span>' + esc(b.note) + "</div>" : "")) +
          "</div>";
      case "check":
        return '<div class="blk-check"><span class="cw">✅ 확인 문제</span>' +
          paraHTML([{ en: b.en, ko: b.ko, note: b.note, important: !!b.note }]) + "</div>";
      default:
        return '<div class="blk">' + paraHTML(b.sentences) + "</div>";
    }
  }

  /* ── 학습용 그림 */
  function artHTML(id) {
    var a = ART[id];
    if (!a) return "";
    return '<figure class="art"><img src="' + IMG + a.f + '" alt="' + esc(a.alt) +
      '" loading="lazy" decoding="async"><figcaption>' + a.cap + "</figcaption></figure>";
  }

  /* ── 슬라이드 카드 */
  function slideHTML(s) {
    return '<div class="slide"><span class="sn">' + esc(s.id.toUpperCase()) + '</span><span class="st">' +
      esc(s.title || "") + "</span>" +
      '<img src="' + IMG + s.id + '.webp" alt="수업 슬라이드 ' + esc(s.id) + '" loading="lazy" decoding="async">' +
      artHTML(s.id) +
      (s.summary ? '<p style="font-weight:600;margin:6px 0 4px">' + esc(s.summary) + "</p>" : "") +
      (s.blocks || []).map(blockHTML).join("") + "</div>";
  }

  /* ── 페이지 카드 */
  function pageHTML(pg, slides) {
    var body = (pg.blocks || []).map(blockHTML).join("");
    var art = artHTML(pg.id);
    var sl = slides.length
      ? slides.map(slideHTML).join("")
      : '<p class="noslide">이 페이지와 짝이 되는 수업 슬라이드는 없어. 교과서만 봐도 충분한 부분이야.</p>';
    var kp = (pg.keypoints || []).map(function (k) { return "<span>" + esc(k) + "</span>"; }).join("");

    return '<article class="pgcard" id="' + pg.id + '">' +
      '<div class="ph"><span class="no">' + pg.id.toUpperCase().replace("TB", "P") + "</span>" +
      (pg.book ? '<span class="bk">교과서 ' + esc(pg.book) + "쪽</span>" : "") +
      '<span class="pt">' + esc(pg.title || "") + "</span></div>" +
      '<div class="tabs" role="tablist">' +
        '<button class="on" data-tab="' + pg.id + '-r">📖 원문</button>' +
        '<button data-tab="' + pg.id + '-s">📝 요약</button>' +
        '<button data-tab="' + pg.id + '-l">🖥 슬라이드' + (slides.length ? " " + slides.length : "") + "</button>" +
      "</div>" +
      '<div class="tabwrap">' +
        '<div class="tabpane" id="' + pg.id + '-r">' +
          '<button class="scan-toggle" data-scan="' + pg.id + '">📄 교과서 원본 페이지 펼치기</button>' +
          '<figure class="scan" id="scan-' + pg.id + '" hidden><img src="' + IMG + pg.id + '.webp" alt="교과서 ' +
            esc(pg.book) + '쪽 원본" loading="lazy" decoding="async">' +
            '<figcaption>눌러서 크게 볼 수 있어. 책과 똑같은 화면이야.</figcaption></figure>' +
          art + body +
        "</div>" +
        '<div class="tabpane" id="' + pg.id + '-s" hidden>' +
          '<p class="sum-lead">' + esc(pg.summary || "") + "</p>" +
          (kp ? '<div class="kp">' + kp + "</div>" : "") +
          (slides.length ? '<p style="font-size:13.5px;color:var(--muted)">이 내용은 수업 슬라이드 ' +
            slides.map(function (s) { return s.id.toUpperCase(); }).join(", ") + " 와 이어져.</p>" : "") +
        "</div>" +
        '<div class="tabpane" id="' + pg.id + '-l" hidden>' + sl + "</div>" +
      "</div></article>";
  }

  /* ── 그리기 */
  var host = document.getElementById("pages");
  var used = {};
  var html = TB.map(function (pg) {
    var slides = SL.filter(function (s) { return (s.tb || []).indexOf(pg.id) >= 0; });
    slides.forEach(function (s) { used[s.id] = 1; });
    return pageHTML(pg, slides);
  }).join("");
  host.innerHTML = html;

  // 어느 교과서 페이지에도 안 붙은 슬라이드는 따로 모아 준다
  var rest = SL.filter(function (s) { return !used[s.id]; });
  var restHost = document.getElementById("restslides");
  if (rest.length) {
    restHost.innerHTML = rest.map(slideHTML).join("");
  } else {
    restHost.innerHTML = '<p class="noslide">모든 슬라이드가 위 교과서 페이지에 묶여 있어.</p>';
  }

  // 페이지 바로가기
  document.getElementById("pgnav").innerHTML = TB.map(function (pg) {
    return '<button data-go="' + pg.id + '">' + pg.id.toUpperCase().replace("TB", "P") + "</button>";
  }).join("");

  /* ── 단어장 자동 생성 */
  var keys = Object.keys(GLOSS).sort();
  document.getElementById("vocabbody").innerHTML =
    '<tr><th>English</th><th>뜻</th><th>설명</th></tr>' +
    keys.map(function (k) {
      var g = GLOSS[k];
      return "<tr><td class=\"en\">" + esc(g.w) + '</td><td class="ko">' + esc(g.ko || "") +
        '</td><td class="ex">' + esc(g.x || "") + "</td></tr>";
    }).join("");
  document.getElementById("vocabcount").textContent = keys.length;

  /* ── 눌러서 해석 보기 */
  function closeBoxes(scope) {
    (scope || document).querySelectorAll(".senbox,.pick").forEach(function (n) { n.remove(); });
    (scope || document).querySelectorAll(".sen.on").forEach(function (n) { n.classList.remove("on"); });
  }
  function showKo(sp, s) {
    var d = document.createElement("div");
    d.className = "senbox";
    d.innerHTML = '<span class="lb">해석</span>' + esc(s.ko || "(해석이 아직 없어)");
    sp.closest(".blk,.blk-guide,.blk-quote,.blk-gloss,.blk-fig,.blk-check,.para").appendChild(d);
  }
  function showNote(sp, s) {
    var d = document.createElement("div");
    d.className = "senbox note";
    d.innerHTML = '<span class="lb">부연설명</span>' + esc(s.note);
    sp.closest(".blk,.blk-guide,.blk-quote,.blk-gloss,.blk-fig,.blk-check,.para").appendChild(d);
  }
  function openSentence(sp) {
    var s = SEN[sp.dataset.s];
    if (!s) return;
    var box = sp.closest(".blk,.blk-guide,.blk-quote,.blk-gloss,.blk-fig,.blk-check,.para");
    if (sp.classList.contains("on")) { closeBoxes(box); return; }
    closeBoxes(box);
    sp.classList.add("on");
    if (s.note && s.ko) {
      var p = document.createElement("div");
      p.className = "pick";
      p.innerHTML = '<button data-pick="ko">🇰🇷 해석</button><button data-pick="note">💡 부연설명</button>' +
        '<button class="close" data-pick="x">닫기</button>';
      box.appendChild(p);
      p.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var kind = b.dataset.pick;
        p.remove();
        if (kind === "ko") showKo(sp, s);
        else if (kind === "note") showNote(sp, s);
        else sp.classList.remove("on");
      });
    } else if (s.note) { showNote(sp, s); }
    else { showKo(sp, s); }
  }

  document.addEventListener("click", function (e) {
    var sp = e.target.closest(".sen");
    if (sp) { openSentence(sp); return; }

    var tab = e.target.closest(".tabs button");
    if (tab) {
      var tabs = tab.parentNode;
      tabs.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === tab); });
      var wrap = tabs.nextElementSibling;
      wrap.querySelectorAll(".tabpane").forEach(function (p) { p.hidden = p.id !== tab.dataset.tab; });
      return;
    }

    var sc = e.target.closest(".scan-toggle");
    if (sc) {
      var fig = document.getElementById("scan-" + sc.dataset.scan);
      fig.hidden = !fig.hidden;
      sc.textContent = fig.hidden ? "📄 교과서 원본 페이지 펼치기" : "📄 원본 페이지 접기";
      return;
    }

    var go = e.target.closest("[data-go]");
    if (go) {
      var t = document.getElementById(go.dataset.go);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    var zi = e.target.closest(".scan img,.slide img");
    if (zi) { openZoom(zi); return; }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      var sp = e.target.closest && e.target.closest(".sen");
      if (sp) { e.preventDefault(); openSentence(sp); }
    }
    if (e.key === "Escape") { closeZoom(); hidePop(); }
  });

  /* ── 단어 더블클릭 */
  var pop = document.getElementById("wordpop");
  function hidePop() { pop.hidden = true; }
  function lookup(raw) {
    var w = raw.toLowerCase().replace(/[^a-z'-]/g, "");
    if (!w) return null;
    if (GLOSS[w]) return GLOSS[w];
    var tries = [w.replace(/ies$/, "y"), w.replace(/es$/, ""), w.replace(/s$/, ""),
                 w.replace(/ed$/, ""), w.replace(/ed$/, "e"), w.replace(/ing$/, ""),
                 w.replace(/ing$/, "e"), w.replace(/ly$/, "")];
    for (var i = 0; i < tries.length; i++) if (tries[i] && GLOSS[tries[i]]) return GLOSS[tries[i]];
    for (var k in GLOSS) if (k.indexOf(w) === 0 && w.length > 3) return GLOSS[k];
    return null;
  }
  // 손가락이나 커서가 놓인 자리의 단어를 집어낸다.
  // 휴대폰에서는 두 번 탭해도 글자가 선택되지 않는 경우가 많아서 이 방법이 필요하다.
  function wordAt(x, y) {
    var r = null, cp;
    if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) {
      cp = document.caretPositionFromPoint(x, y);
      if (cp) { r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); }
    }
    if (!r || !r.startContainer || r.startContainer.nodeType !== 3) return "";
    var t = r.startContainer.textContent, i = r.startOffset, s = i, e = i;
    while (s > 0 && /[A-Za-z'-]/.test(t.charAt(s - 1))) s--;
    while (e < t.length && /[A-Za-z'-]/.test(t.charAt(e))) e++;
    return t.slice(s, e);
  }

  function showWord(raw) {
    var sel = String(raw || "").trim();
    if (!sel || sel.length > 30 || !/[a-zA-Z]/.test(sel)) return;
    var g = lookup(sel);
    pop.hidden = false;
    if (g) {
      pop.innerHTML = '<button class="close" aria-label="닫기">×</button>' +
        '<div class="w">' + esc(g.w) + '</div><div class="k">' + esc(g.ko || "") + "</div>" +
        '<div class="x">' + esc(g.x || "") + "</div>" +
        (g.where.length ? '<div class="seen">나온 곳 · ' + g.where.map(function (x) {
          return x.toUpperCase().replace("TB", "P").replace("SL", "S");
        }).join(", ") + "</div>" : "");
    } else {
      pop.innerHTML = '<button class="close" aria-label="닫기">×</button>' +
        '<div class="w">' + esc(sel) + '</div>' +
        '<div class="x">이 단어는 노트 단어장에 아직 없어. 아래 <b>영어 단어장</b>에서 비슷한 단어를 찾아보거나, ' +
        '문장을 눌러 해석을 먼저 봐.</div>';
    }
  }

  document.addEventListener("dblclick", function (e) {
    var sel = (window.getSelection && String(window.getSelection())) || "";
    showWord(sel.trim() || wordAt(e.clientX, e.clientY));
  });

  // 휴대폰: 두 번 탭 (dblclick 이 안 오는 브라우저 대비)
  var lastTap = 0, lastX = 0, lastY = 0;
  document.addEventListener("touchend", function (e) {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    var t = e.changedTouches[0], now = Date.now();
    var near = Math.abs(t.clientX - lastX) < 28 && Math.abs(t.clientY - lastY) < 28;
    if (now - lastTap < 420 && near) {
      var w = wordAt(t.clientX, t.clientY);
      if (w) { showWord(w); lastTap = 0; return; }
    }
    lastTap = now; lastX = t.clientX; lastY = t.clientY;
  }, { passive: true });

  pop.addEventListener("click", function (e) { if (e.target.closest(".close")) hidePop(); });

  /* ── 이미지 확대 */
  var zoom = document.getElementById("zoom");
  var zimg = null, zscale = 1;
  function openZoom(img) {
    zoom.hidden = false;
    zscale = 1;
    zoom.innerHTML = '<div class="bar"><span class="t">' + esc(img.alt || "원본") + "</span>" +
      '<button data-z="out">−</button><button data-z="in">+</button><button data-z="x">닫기</button></div>';
    zimg = document.createElement("img");
    zimg.src = img.src; zimg.alt = img.alt;
    zimg.style.width = Math.min(window.innerWidth * 0.98, 1400) + "px";
    zoom.appendChild(zimg);
    document.body.style.overflow = "hidden";
  }
  function closeZoom() {
    zoom.hidden = true; zoom.innerHTML = ""; zimg = null;
    document.body.style.overflow = "";
  }
  zoom.addEventListener("click", function (e) {
    var b = e.target.closest("[data-z]");
    if (!b) { if (e.target === zoom) closeZoom(); return; }
    if (b.dataset.z === "x") return closeZoom();
    zscale = Math.max(0.5, Math.min(4, zscale + (b.dataset.z === "in" ? 0.35 : -0.35)));
    if (zimg) zimg.style.width = Math.min(window.innerWidth * 0.98, 1400) * zscale + "px";
  });

  /* ── 단어장 뜻 가리기 */
  var btn = document.getElementById("hideBtn"), wrap = document.getElementById("vocabWrap");
  var KEY = "haul-wh-hide";
  function setHide(on) {
    wrap.classList.toggle("hide-ko", on);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "👀 뜻 모두 보기" : "🙈 뜻 가리기";
    if (!on) wrap.querySelectorAll("td.show").forEach(function (td) { td.classList.remove("show"); });
  }
  var init = false;
  try { init = localStorage.getItem(KEY) === "1"; } catch (e) {}
  setHide(init);
  btn.addEventListener("click", function () {
    var on = !wrap.classList.contains("hide-ko");
    setHide(on);
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
  });
  wrap.addEventListener("click", function (e) {
    if (!wrap.classList.contains("hide-ko")) return;
    var td = e.target.closest("td.ko,td.ex");
    if (!td) return;
    td.parentNode.querySelectorAll("td.ko,td.ex").forEach(function (c) { c.classList.toggle("show"); });
  });

  /* ── 상단 메뉴 현재 위치 */
  var links = [].slice.call(document.querySelectorAll("nav.top a"));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function spy() {
    var y = window.scrollY + 90, best = 0;
    for (var i = 0; i < secs.length; i++) if (secs[i] && secs[i].offsetTop <= y) best = i;
    links.forEach(function (l, i) { l.classList.toggle("active", i === best); });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);
  spy();
})();
