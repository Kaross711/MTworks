(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobiel = window.matchMedia('(max-width: 639px)');
  var desktop = window.matchMedia('(min-width: 1024px)');

  document.querySelectorAll('.jaar').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Intro: na afloop weghalen, met een klik overslaan
  var splash = document.querySelector('.splash');
  if (splash && doc.classList.contains('intro')) {
    splash.addEventListener('click', function () { splash.classList.add('weg'); });
    setTimeout(function () { splash.remove(); }, 1700);
  }

  // Header krimpt bij scrollen
  var hdr = document.getElementById('hdr');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburgermenu
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var backdrop = document.querySelector('.menu-backdrop');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    doc.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(function () { var a = menu.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 250);
  }
  burger.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  backdrop.addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (!doc.classList.contains('menu-open')) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    var items = [burger].concat([].slice.call(menu.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
  desktop.addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  // Scroll-reveals
  var srObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); srObs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.sr').forEach(function (el) { srObs.observe(el); });

  // Teller 24
  document.querySelectorAll('.count').forEach(function (el) {
    var to = +el.dataset.to;
    if (reduce) return;
    el.textContent = '0';
    var o = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      o.disconnect();
      var t0 = null;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      }
      setTimeout(function () { requestAnimationFrame(tick); }, 250);
    }, { threshold: 0.6 });
    o.observe(el);
  });

  // Actief menu-item volgt de sectie in beeld
  var spyLinks = document.querySelectorAll('[data-spy]');
  if (spyLinks.length) {
    var zicht = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { zicht[en.target.id] = en.isIntersecting; });
      spyLinks.forEach(function (a) { a.classList.toggle('cur', !!zicht[a.dataset.spy]); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach(function (a) { var s = document.getElementById(a.dataset.spy); if (s) spy.observe(s); });
  }

  // Dienstpanelen: hover op desktop, in beeld op mobiel
  var panels = [].slice.call(document.querySelectorAll('[data-panel]'));
  panels.forEach(function (p) {
    p.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      panels.forEach(function (q) { q.classList.toggle('on', q === p); });
    });
  });
  if (panels.length) {
    var pObs = new IntersectionObserver(function (entries) {
      if (!mobiel.matches) return;
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('on'); });
    }, { threshold: 0.45 });
    panels.forEach(function (p) { pObs.observe(p); });
  }

  // Werkwijze: lijn tekent zich als de stappen in beeld komen
  var steps = document.getElementById('steps');
  if (steps) {
    var sObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { steps.classList.add('drawn'); sObs.disconnect(); }
    }, { threshold: 0.35 });
    sObs.observe(steps);
  }

  // Formulier
  var form = document.getElementById('aanvraag');
  if (form) {
    var sent = document.querySelector('.sent');
    var err = form.querySelector('.form-err');
    var knop = form.querySelector('button[type=submit]');
    var sector = document.getElementById('f-sector');

    document.querySelectorAll('[data-sector]').forEach(function (a) {
      a.addEventListener('click', function () {
        sector.value = a.dataset.sector;
        if (!sent.hidden) { sent.hidden = true; form.hidden = false; }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      knop.disabled = true;
      knop.innerHTML = '<span class="spin" aria-hidden="true"></span>Versturen…';
      fetch('https://formsubmit.co/ajax/info@mt-works.nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'mislukt');
        form.reset();
        form.hidden = true;
        sent.hidden = false;
      }).catch(function () {
        err.innerHTML = 'Versturen is niet gelukt. Bel ons op <a href="tel:+31638961512">06 38 96 15 12</a> of mail naar <a href="mailto:info@mt-works.nl">info@mt-works.nl</a>.';
        err.hidden = false;
      }).then(function () {
        knop.disabled = false;
        knop.textContent = 'Aanvraag versturen';
      });
    });

    document.getElementById('opnieuw').addEventListener('click', function () {
      sent.hidden = true;
      form.hidden = false;
    });
  }

  // Vaste onderbalk op mobiel: na de hero tonen, weg bij het formulier
  var bar = document.getElementById('bar');
  if (bar) {
    var hero = document.querySelector('.hero, .wb-hero');
    var doel = document.getElementById('aanvragen') || document.querySelector('.cta-end');
    var heroZicht = true, doelZicht = false;
    var bObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === hero) heroZicht = en.isIntersecting;
        if (en.target === doel) doelZicht = en.isIntersecting;
      });
      bar.classList.toggle('show', !heroZicht && !doelZicht);
    });
    if (hero) bObs.observe(hero);
    if (doel) bObs.observe(doel);
  }
})();
