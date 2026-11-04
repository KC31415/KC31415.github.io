/* kechunwu.github.io: theme toggle, live strip, verification demo, SDK chart, section reveal. No dependencies. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var darkMQ = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------------- Theme toggle ---------------- */
  var toggle = document.getElementById("theme-toggle");
  function effectiveTheme() { return root.dataset.theme || (darkMQ.matches ? "dark" : "light"); }
  function paintToggle() {
    if (!toggle) return;
    var t = effectiveTheme();
    toggle.querySelectorAll("[data-mode]").forEach(function (s) { s.classList.toggle("on", s.dataset.mode === t); });
    toggle.setAttribute("aria-label", "light / dark theme, currently " + t);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintToggle();
      if (chartRedraw) chartRedraw();
    });
    if (darkMQ.addEventListener) darkMQ.addEventListener("change", paintToggle);
    paintToggle();
  }

  /* ---------------- Live strip (Morning Brief) ---------------- */
  var live = document.getElementById("live");
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function nyDate(d) { // YYYY-MM-DD in New York time
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function businessDaysBetween(a, b) { // weekdays strictly after a, up to and including b (YYYY-MM-DD strings)
    var d = new Date(a + "T12:00:00Z"), end = new Date(b + "T12:00:00Z"), n = 0;
    while (d < end) { d.setUTCDate(d.getUTCDate() + 1); var w = d.getUTCDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }
  function tone(change) { return /^-|^−/.test(change) ? "down" : (/^\+/.test(change) && !/^\+0(\.0+)?( |%|$)/.test(change) ? "up" : ""); }

  if (live && window.fetch) {
    fetch("/morning-brief/latest.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var rows = {};
        (d.groups || []).forEach(function (g) { (g.rows || []).forEach(function (r) { rows[r.ticker] = r; }); });
        var es = rows["ES=F"], tnx = rows["^TNX"], vix = rows["^VIX"];
        var checks = d.coverage && d.coverage.checks;
        if (!d.date || !d.as_of || !es || !tnx || !vix || !checks) throw new Error("missing fields");

        var fetched = new Date(d.last_fetch || d.run_at);
        var today = nyDate(new Date());
        var dataDay = nyDate(fetched);
        var stale = isNaN(fetched) || businessDaysBetween(dataDay, today) > 1;
        var label = stale ? "Last brief" : (dataDay === today ? (/pre-open/i.test(d.as_of) ? "This morning’s brief" : "Today’s brief") : "Latest brief");
        var day = new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });

        var parts = [];
        parts.push(el("span", null, label + " · " + day));
        var es1 = el("span"); es1.append("S&P 500 futures "); es1.append(el("span", tone(es.change), es.change)); parts.push(es1);
        var y = parseFloat(tnx.last);
        var t1 = el("span"); t1.append("US 10Y " + (isNaN(y) ? tnx.last : y.toFixed(2) + "%") + " "); t1.append(el("span", tone(tnx.change), "(" + tnx.change + ")")); parts.push(t1);
        parts.push(el("span", null, "VIX " + vix.last));
        var probs = d.problems || [];
        if (d.status === "OK" && probs.length === 0) {
          parts.push(el("span", "ok", "all " + checks + " data checks passed ✓"));
        } else {
          var f = probs.filter(function (p) { return p.status === "FAIL"; }).length, w = probs.length - f;
          var msg = [];
          if (f) msg.push(f + " failed");
          if (w) msg.push(w + " warning" + (w > 1 ? "s" : ""));
          parts.push(el("span", null, checks + " data checks: " + (msg.join(", ") || d.status) + ", flagged on the brief"));
        }
        live.textContent = "";
        parts.forEach(function (p, i) { if (i) live.append(el("span", "sep", " · ")); live.append(p); });
        live.append(" ");
        var a = el("a", null, "→ read the brief"); a.href = "/morning-brief/"; live.append(a);
        live.append(el("span", "asof", (stale ? "last updated " : "data as of ") + d.as_of));
        if (stale) live.classList.add("stale");
        live.hidden = false;
      })
      .catch(function () { live.hidden = true; });
  }

  /* ---------------- Earnings Desk demo ---------------- */
  var demo = document.getElementById("demo");
  if (demo) {
    var claims = Array.prototype.slice.call(demo.querySelectorAll(".claim"));
    var pinned = null;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    function show(btn) {
      claims.forEach(function (c) {
        var on = c === btn;
        c.classList.toggle("active", on);
        var p = document.getElementById(c.getAttribute("aria-controls"));
        if (p) p.classList.toggle("shown", on);
      });
    }
    function pin(btn) {
      pinned = btn;
      claims.forEach(function (c) { c.setAttribute("aria-expanded", c === btn ? "true" : "false"); });
      show(btn);
    }
    claims.forEach(function (c) {
      c.addEventListener("click", function () { pin(c); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(c); }
      });
      c.addEventListener("focus", function () { pin(c); });
      if (finePointer) {
        c.addEventListener("mouseenter", function () { show(c); });
      }
    });
    var text = demo.querySelector(".demo-text");
    if (finePointer && text) text.addEventListener("mouseleave", function () { show(pinned); });
    // Open on the mismatch so the first thing a visitor sees is the verifier catching something.
    var first = demo.querySelector('.claim[data-status="mismatch"]') || claims[0];
    if (first) pin(first);
  }

  /* ---------------- SDK share chart (hand-rolled SVG) ---------------- */
  var chartRedraw = null;
  var fig = document.getElementById("sdk-chart");
  function loadChart() {
    fetch("/data/sdk-share.json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { drawChart(fig, data); })
      .catch(function () { fig.hidden = true; });
  }
  if (fig && window.fetch) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadChart(); }
      }, { rootMargin: "400px 0px" });
      // The figure is hidden until data arrives, so observe its article instead.
      io.observe(fig.parentElement);
    } else { loadChart(); }
  }

  function drawChart(fig, data) {
    var host = document.getElementById("sdk-svg");
    var readout = document.getElementById("sdk-readout");
    var asof = document.getElementById("sdk-asof");
    var weeks = data.weeks, share = data.share, labels = data.labels;
    var keys = ["mistralai", "google-genai", "openai", "anthropic"].filter(function (k) { return share[k]; });
    var short = { "openai": "OpenAI", "anthropic": "Anthropic", "google-genai": "Google", "mistralai": "Mistral" };
    var n = weeks.length;
    if (!n) throw new Error("no data");
    fig.hidden = false;
    asof.textContent = "week ending " + weeks[n - 1];
    asof.setAttribute("datetime", weeks[n - 1]);
    var pct = function (v) { return (v * 100).toFixed(1) + "%"; };
    var order = ["anthropic", "openai", "google-genai", "mistralai"];
    function readoutFor(i) {
      return (i === n - 1 ? "Latest, week ending " : "Week ending ") + weeks[i] + " · " +
        order.map(function (k) { return short[k] + " " + pct(share[k][i]); }).join(" · ");
    }

    function render() {
      var W = Math.max(300, Math.round(host.clientWidth || 960));
      var small = W < 560;
      var H = Math.round(Math.min(340, Math.max(230, W * 0.4)));
      var m = { l: 36, r: small ? 92 : 128, t: 10, b: 26 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ymax = 0;
      keys.forEach(function (k) { share[k].forEach(function (v) { if (v > ymax) ymax = v; }); });
      ymax = Math.ceil(ymax * 5) / 5;
      var t0 = Date.parse(weeks[0]), t1 = Date.parse(weeks[n - 1]);
      var x = function (i) { return m.l + (Date.parse(weeks[i]) - t0) / (t1 - t0) * iw; };
      var y = function (v) { return m.t + ih - v / ymax * ih; };
      var NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      function add(parent, tag, attrs, text) {
        var e = document.createElementNS(NS, tag);
        for (var a in attrs) e.setAttribute(a, attrs[a]);
        if (text != null) e.textContent = text;
        parent.appendChild(e); return e;
      }
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("width", W); svg.setAttribute("height", H);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Line chart, " + weeks[0] + " to " + weeks[n - 1] + ". " +
        order.map(function (k) { return labels[k] + " went from " + pct(share[k][0]) + " to " + pct(share[k][n - 1]); }).join("; ") + ".");

      for (var g = 0; g <= ymax + 1e-9; g += 0.2) {
        var gy = Math.round(y(g)) + 0.5;
        add(svg, "line", { x1: m.l, x2: m.l + iw, y1: gy, y2: gy, "class": g === 0 ? "axis" : "grid" });
        add(svg, "text", { x: m.l - 6, y: gy + 4, "text-anchor": "end" }, Math.round(g * 100) + "%");
      }
      var startYear = new Date(t0).getUTCFullYear(), endYear = new Date(t1).getUTCFullYear();
      for (var yr = startYear; yr <= endYear + 1; yr++) {
        var tx = Date.UTC(yr, 0, 1);
        if (tx < t0 || tx > t1) continue;
        var xx = Math.round(m.l + (tx - t0) / (t1 - t0) * iw) + 0.5;
        add(svg, "line", { x1: xx, x2: xx, y1: m.t + ih, y2: m.t + ih + 5, "class": "axis" });
        add(svg, "text", { x: xx, y: H - 6, "text-anchor": "middle" }, String(yr));
      }
      keys.forEach(function (k) {
        var d = share[k].map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1); }).join("");
        add(svg, "path", { d: d, "class": "line s-" + k });
      });
      // Direct labels at line ends, nudged apart so they never overlap.
      var labs = keys.map(function (k) { return { k: k, y: y(share[k][n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
      for (var i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 15) labs[i].y = labs[i - 1].y + 15;
      labs.forEach(function (l) {
        add(svg, "text", { x: m.l + iw + 8, y: l.y + 4, "class": "lab-" + l.k }, short[l.k] + " " + Math.round(share[l.k][n - 1] * 100) + "%");
      });

      // Hover / touch readout
      var cursor = add(svg, "line", { y1: m.t, y2: m.t + ih, "class": "cursor", visibility: "hidden" });
      var dots = order.map(function (k) { var c = add(svg, "circle", { r: 3.5, "class": "dot", visibility: "hidden" }); c.style.fill = k === "anthropic" ? "var(--accent)" : (k === "openai" ? "var(--ink)" : "var(--muted)"); return c; });
      function at(evt) {
        var r = svg.getBoundingClientRect();
        var px = (evt.clientX - r.left) * (W / r.width);
        var t = t0 + (px - m.l) / iw * (t1 - t0);
        var best = 0, bd = Infinity;
        for (var j = 0; j < n; j++) { var dd = Math.abs(Date.parse(weeks[j]) - t); if (dd < bd) { bd = dd; best = j; } }
        var cx = x(best);
        cursor.setAttribute("x1", cx); cursor.setAttribute("x2", cx); cursor.setAttribute("visibility", "visible");
        order.forEach(function (k, idx) { dots[idx].setAttribute("cx", cx); dots[idx].setAttribute("cy", y(share[k][best])); dots[idx].setAttribute("visibility", "visible"); });
        readout.textContent = readoutFor(best);
      }
      function leave() {
        cursor.setAttribute("visibility", "hidden");
        dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
        readout.textContent = readoutFor(n - 1);
      }
      svg.addEventListener("pointermove", at);
      svg.addEventListener("pointerdown", at);
      svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") leave(); });
      host.textContent = "";
      host.appendChild(svg);
      leave();
    }
    render();
    chartRedraw = render;
    var lastW = host.clientWidth, timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (host.clientWidth !== lastW) { lastW = host.clientWidth; render(); } }, 120);
    });
  }

  /* ---------------- Section reveal (skipped under reduced motion) ---------------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".entry, #experience, #about");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // already on screen: never hide it
      t.classList.add("reveal");
      rio.observe(t);
    });
  }
})();
