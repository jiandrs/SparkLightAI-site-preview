/* 星火之光AI 官网 2.0 · 全站交互 | 2026-11-07
   纯前端实现：不外发数据、不依赖第三方脚本。表单正式上线时接后端 / CRM 后替换 submit 分支。 */
(function () {
  'use strict';
  var page = document.body.getAttribute('data-page') || 'index';

  /* ---------- 轻量转化事件记录（仅本地诊断，不外发） ---------- */
  var log = [];
  function track(name, params) {
    var rec = { event: name, page: page, ts: Date.now() };
    if (params) { for (var k in params) { if (params.hasOwnProperty(k)) rec[k] = params[k]; } }
    log.push(rec);
    try {
      var old = JSON.parse(localStorage.getItem('sl_events') || '[]');
      old.push(rec);
      if (old.length > 300) old = old.slice(-300);
      localStorage.setItem('sl_events', JSON.stringify(old));
    } catch (e) { /* 隐私模式下静默 */ }
    if (window.console && console.debug) console.debug('[sl]', name, rec);
  }
  window.slTrack = track;
  window.slEvents = log;
  track('sl_view_hero', { segment: document.body.getAttribute('data-segment') || 'general' });

  /* ---------- 首页 Banner 轮播：5 张 / 3 秒 ---------- */
  var carousel = document.getElementById('ry-hero-slider');
  if (carousel) {
    var sld = Array.prototype.slice.call(carousel.querySelectorAll('.slide'));
    var dot = Array.prototype.slice.call(carousel.querySelectorAll('.slider-dots button'));
    var num = carousel.querySelector('.slider-count b');
    var total = sld.length, at = 0, ticker = null, hold = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(i) {
      i = (i + total) % total;
      if (i === at) return;
      var oldBar = dot[at].querySelector('i');
      sld[at].classList.remove('on');
      dot[at].classList.remove('on');
      dot[at].removeAttribute('aria-current');
      if (oldBar) oldBar.style.animation = 'none';
      at = i;
      sld[at].classList.add('on');
      dot[at].classList.add('on');
      dot[at].setAttribute('aria-current', 'true');
      var bar = dot[at].querySelector('i');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      if (num) num.textContent = ('0' + (at + 1)).slice(-2);
      track('sl_banner_view', { index: at + 1, total: total });
    }
    function play() {
      if (ticker) { clearInterval(ticker); ticker = null; }
      if (reduceMotion || hold || document.hidden) return;
      ticker = setInterval(function () { show(at + 1); }, 3000);
    }
    function pause() { hold = true; if (ticker) { clearInterval(ticker); ticker = null; } }
    function resume() { hold = false; play(); }
    dot.forEach(function (d, i) {
      d.addEventListener('click', function () { show(i); play(); });
    });
    Array.prototype.forEach.call(carousel.querySelectorAll('[data-slide-dir]'), function (b) {
      b.addEventListener('click', function () {
        show(at + parseInt(b.getAttribute('data-slide-dir'), 10)); play();
      });
    });
    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', resume);
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', play);
    /* 防御：可视化编辑器可能把运行时状态（当前张、计数器）固化进 HTML，加载时强制归位 Banner1 */
    sld.forEach(function (s, i) { s.classList.toggle('on', i === 0); });
    dot.forEach(function (d, i) {
      d.classList.toggle('on', i === 0);
      if (i === 0) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    if (num) num.textContent = '01';
    at = 0;
    track('sl_banner_view', { index: 1, total: total });
    play();
  }

  /* ---------- 移动导航 ---------- */
  var menuBtn = document.querySelector('.ry-menu-btn');
  var nav = document.getElementById('ry-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? '收起' : '菜单';
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.ry-sub-btn'), function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.ry-nav-item');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '收起子菜单' : '展开子菜单');
    });
  });

  /* ---------- CTA 与分流点击 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-cta]'), function (el) {
    el.addEventListener('click', function () {
      track('sl_cta_click', { cta_level: el.getAttribute('data-cta'), label: (el.textContent || '').trim().slice(0, 40) });
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-segment-link]'), function (el) {
    el.addEventListener('click', function () {
      track('sl_segment_click', { segment: el.getAttribute('data-segment-link') });
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-download]'), function (el) {
    el.addEventListener('click', function () { track('sl_download', { asset_id: el.getAttribute('data-download') }); });
  });

  /* ---------- 滚动深度 ---------- */
  var marks = [25, 50, 75, 90], sent = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var p = Math.round(window.scrollY / h * 100);
    for (var i = 0; i < marks.length; i++) {
      if (p >= marks[i] && !sent[marks[i]]) { sent[marks[i]] = 1; track('sl_scroll_depth', { depth: marks[i] }); }
    }
  }, { passive: true });

  /* ---------- 证据区曝光 ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          track('sl_proof_view', { proof_type: en.target.getAttribute('data-proof') || 't4' });
          io.unobserve(en.target);
        }
      });
    }, { threshold: .3 });
    Array.prototype.forEach.call(document.querySelectorAll('[data-proof]'), function (el) { io.observe(el); });
  }

  /* ---------- 三入口表单 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ry-tabs button[data-form]'));
  var forms = Array.prototype.slice.call(document.querySelectorAll('.ry-form-panel'));
  function showForm(id) {
    tabs.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-form') === id); });
    forms.forEach(function (f) { f.hidden = f.getAttribute('data-panel') !== id; });
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () { showForm(b.getAttribute('data-form')); });
  });
  if (tabs.length) {
    var q = new URLSearchParams(location.search).get('intent');
    showForm(q === 'tob' ? 'tob' : q === 'geo' || q === 'brand' ? 'brand' : 'opc');
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-lead]'), function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var seg = form.getAttribute('data-lead');
      var data = new FormData(form);
      var out = new URLSearchParams();
      out.set('segment', seg);
      data.forEach(function (v, k) { if (String(v).trim()) out.set(k, String(v).trim()); });
      out.set('fields', String(form.querySelectorAll('input,select,textarea').length));
      track('sl_lead_submit', { segment: seg, form_id: form.id || seg });
      location.href = 'thanks.html?' + out.toString();
    });
  });

  /* ---------- 预约成功页：复述提交内容 ---------- */
  var recap = document.getElementById('ry-recap');
  if (recap) {
    var p = new URLSearchParams(location.search);
    var segName = { opc: '一人公司 / 个人', tob: '企业组织', brand: '品牌方 · AI 可见度' }[p.get('segment')] || '个人';
    var rows = [['你的身份', segName]];
    var labelMap = { identity: '身份', task: '最想先做的一件事', contact: '联系方式', city: '所在城市', company: '公司全称', role: '你的角色', budget: '预算区间', cycle: '期望周期', need: '需求描述', brandname: '品牌名', scene: '想测的问句场景', url: '官网地址', note: '补充说明' };
    p.forEach(function (v, k) {
      if (['segment', 'fields'].indexOf(k) >= 0) return;
      if (rows.length >= 7) return;
      rows.push([labelMap[k] || k, v]);
    });
    var html = '';
    rows.forEach(function (r) {
      html += '<div class="hb-row"><b>' + r[0].replace(/[<>&]/g, '') + '</b><span>' + r[1].replace(/[<>&]/g, '') + '</span></div>';
    });
    recap.innerHTML = html;
  }

  /* ---------- 品牌 AI 可见度自检（页面内演示，不调用外部平台） ---------- */
  var tool = document.getElementById('ry-tool');
  if (tool) {
    var questions = [
      '客户问「这类需求找谁做」时，答案里会出现你的品牌吗？',
      '客户问「这个领域有哪些可选项」时，你能进前三被提到吗？',
      '客户问「怎么选、看什么标准」时，答案会引用你的内容吗？',
      '同一问题换一种问法，结果还稳定吗？',
      '换个 AI 平台再问一次，还能找到你吗？'
    ];
    var idx = 0, score = 0, opts = ['每次都有', '偶尔有', '基本没有', '没测过'];
    var qEl = document.getElementById('tool-q'), optsEl = document.getElementById('tool-opts');
    var barEl = document.getElementById('tool-bar'), resEl = document.getElementById('tool-result');
    function render() {
      if (idx >= questions.length) { finish(); return; }
      qEl.textContent = '第 ' + (idx + 1) + ' / ' + questions.length + ' 问　' + questions[idx];
      var h = '';
      opts.forEach(function (o, i) {
        h += '<label><input type="radio" name="tool-opt" value="' + (3 - i) + '"> ' + o + '</label>';
      });
      optsEl.innerHTML = h;
      barEl.innerHTML = '<i style="width:' + Math.round(idx / questions.length * 100) + '%"></i>';
    }
    document.getElementById('tool-next').addEventListener('click', function () {
      var picked = optsEl.querySelector('input:checked');
      if (!picked) { qEl.setAttribute('data-warn', '1'); qEl.textContent = '请先选一个选项　' + qEl.textContent.replace(/^请先选一个选项\s*/, ''); return; }
      qEl.removeAttribute('data-warn');
      score += parseInt(picked.value, 10);
      idx += 1;
      track('sl_tool_step', { tool: 'geo5', step: idx });
      render();
    });
    function finish() {
      tool.querySelector('.tool-body').hidden = true;
      resEl.hidden = false;
      var max = questions.length * 3;
      var pct = Math.round(score / max * 100);
      var line = pct >= 70 ? '被提到得比较稳定，可以开始做引用率与答法优化。'
        : pct >= 40 ? '有些问句能找到你，有些找不到，先把缺口问句补齐。'
          : '目前 AI 答案里很难找到你，建议先做一次四指标实测。';
      resEl.innerHTML = '<b>你的自检参考分：' + pct + ' / 100</b><p style="margin:8px 0 0;font-size:14px;color:var(--ry-gray)">' + line +
        '</p><p class="tiny" style="margin:10px 0 0;color:var(--ry-gray)">这是页面内自评，仅作方向参考；正式结果以 10 问 × 3 平台实测报告为准，报告会写明评价时间、平台范围、样本范围与统计口径。</p>' +
        '<div class="cta-row"><a class="ry-btn" data-cta="L1" href="contact.html?intent=geo">领取四指标实测样例</a></div>';
      barEl.innerHTML = '<i style="width:100%"></i>';
      track('sl_tool_result', { tool: 'geo5', score: pct });
      var t = resEl.querySelector('[data-cta]');
      if (t) t.addEventListener('click', function () { track('sl_cta_click', { cta_level: 'L1', label: t.textContent.trim() }); });
    }
    render();
    track('sl_tool_start', { tool: 'geo5' });
  }
  /* ---------- 新闻动态页 Banner：3 图 / 3 秒轮播（快照版） ---------- */
  var nh = document.getElementById('nh-slider');
  if (nh) {
    var ns = Array.prototype.slice.call(nh.querySelectorAll('.nh-slide'));
    var nd = Array.prototype.slice.call(nh.querySelectorAll('.nh-dot'));
    var ni = 0, nt = null;
    function go(k) {
      ni = (k + ns.length) % ns.length;
      ns.forEach(function (el, j) { el.classList.toggle('is-on', j === ni); });
      nd.forEach(function (el, j) { el.classList.toggle('is-on', j === ni); });
      track('sl_news_banner_view', { index: ni + 1, total: ns.length });
    }
    function stop() { if (nt) { clearInterval(nt); nt = null; } }
    function start() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop();
      nt = setInterval(function () { go(ni + 1); }, 3000);
    }
    nd.forEach(function (el) {
      el.addEventListener('click', function () {
        go(parseInt(el.getAttribute('data-i'), 10));
        start();
      });
    });
    nh.addEventListener('mouseenter', stop);
    nh.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    go(0); start();
  }

  /* ---------- 首页「新闻动态」：最近 3 条 / 3 秒轮播 ---------- */
  var reel = document.getElementById('ry-news-reel');
  if (reel) {
    var ri = Array.prototype.slice.call(reel.querySelectorAll('.nr-item'));
    var rd = Array.prototype.slice.call(reel.querySelectorAll('.nr-dots button'));
    var rc = reel.querySelector('.nr-count b');
    var rTotal = ri.length, rAt = 0, rTimer = null, rHold = false;
    var rReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rShow(k) {
      k = (k + rTotal) % rTotal;
      if (k === rAt) return;
      var oldBar = rd[rAt].querySelector('i');
      ri[rAt].classList.remove('is-on');
      ri[rAt].setAttribute('aria-hidden', 'true');
      rd[rAt].classList.remove('is-on');
      rd[rAt].removeAttribute('aria-current');
      if (oldBar) oldBar.style.animation = 'none';
      rAt = k;
      ri[rAt].classList.add('is-on');
      ri[rAt].removeAttribute('aria-hidden');
      rd[rAt].classList.add('is-on');
      rd[rAt].setAttribute('aria-current', 'true');
      var bar = rd[rAt].querySelector('i');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      if (rc) rc.textContent = ('0' + (rAt + 1)).slice(-2);
      track('sl_news_reel_view', { index: rAt + 1, total: rTotal });
    }
    function rPlay() {
      if (rTimer) { clearInterval(rTimer); rTimer = null; }
      if (rReduce || rHold || document.hidden || rTotal < 2) return;
      rTimer = setInterval(function () { rShow(rAt + 1); }, 3000);
    }
    function rPause() { rHold = true; if (rTimer) { clearInterval(rTimer); rTimer = null; } }
    function rResume() { rHold = false; rPlay(); }
    rd.forEach(function (d, i) {
      d.addEventListener('click', function () { rShow(i); rPlay(); });
    });
    Array.prototype.forEach.call(reel.querySelectorAll('[data-nr-dir]'), function (b) {
      b.addEventListener('click', function () {
        rShow(rAt + parseInt(b.getAttribute('data-nr-dir'), 10)); rPlay();
      });
    });
    Array.prototype.forEach.call(reel.querySelectorAll('[data-nr-open]'), function (el) {
      el.addEventListener('click', function () {
        track('sl_news_reel_click', { index: parseInt(el.getAttribute('data-nr-open'), 10) });
      });
    });
    reel.addEventListener('mouseenter', rPause);
    reel.addEventListener('mouseleave', rResume);
    reel.addEventListener('focusin', rPause);
    reel.addEventListener('focusout', rResume);
    document.addEventListener('visibilitychange', rPlay);
    /* 防御：可视化编辑器可能固化运行时状态，加载时强制归位第 1 条 */
    ri.forEach(function (el, i) {
      el.classList.toggle('is-on', i === 0);
      if (i === 0) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
    rd.forEach(function (d, i) {
      d.classList.toggle('is-on', i === 0);
      if (i === 0) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    if (rc) rc.textContent = '01';
    rAt = 0;
    track('sl_news_reel_view', { index: 1, total: rTotal });
    rPlay();
  }

})();
