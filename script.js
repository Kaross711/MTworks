(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 1024px)');
  var fijn = window.matchMedia('(hover: hover) and (pointer: fine)');
  var gsapOk = !!(window.gsap && window.ScrollTrigger);

  document.querySelectorAll('.jaar').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---------- vloeiend scrollen ----------
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1 });
    if (gsapOk) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }
  function naar(el) {
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else (el === 0 ? window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }
  function zelfdePagina(url) {
    var a = url.pathname.replace(/index\.html$/, '');
    var b = location.pathname.replace(/index\.html$/, '');
    return url.origin === location.origin && a === b;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (!zelfdePagina(url) || !url.hash) return;
    var doel = url.hash === '#top' ? 0 : document.querySelector(url.hash);
    if (doel === null) return;
    e.preventDefault();
    setMenu(false);
    naar(doel);
  });

  // ---------- header ----------
  var hdr = document.getElementById('hdr');
  var hero = document.querySelector('.hero');
  var menuOpen = false;
  var vorige = 0;
  if (!hero) { hdr.classList.remove('dark'); hdr.classList.add('solid'); }
  function hdrState() {
    var y = window.scrollY;
    if (hero) {
      var opHero = y < hero.offsetHeight - 90;
      hdr.classList.toggle('dark', opHero);
      hdr.classList.toggle('solid', !opHero);
    }
    hdr.classList.toggle('hide', !menuOpen && y > vorige + 2 && y > 400);
    if (y < vorige - 2 || y <= 400) hdr.classList.remove('hide');
    vorige = y;
  }
  window.addEventListener('scroll', hdrState, { passive: true });
  hdrState();

  // ---------- menu ----------
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var backdrop = document.querySelector('.menu-backdrop');
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    hdr.classList.remove('hide');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    doc.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(function () { var a = menu.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 300);
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  backdrop.addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (!menuOpen) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    var items = [burger].concat([].slice.call(menu.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
  desktop.addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  // ---------- hero: fotowissel ----------
  function startSlides() {
    var slides = [].slice.call(document.querySelectorAll('.hero .slide'));
    var bars = [].slice.call(document.querySelectorAll('.slide-bars button'));
    if (slides.length < 2 || reduce) return;
    var cap = document.getElementById('cap'), sub = document.getElementById('sub'), idx = document.getElementById('idx');
    var i = 0, timer;
    function show(n) {
      var oud = slides[i];
      i = (n + slides.length) % slides.length;
      if (oud !== slides[i]) {
        oud.classList.add('out');
        oud.classList.remove('on');
        setTimeout(function () { oud.classList.remove('out'); }, 1700);
      }
      slides[i].classList.add('on');
      bars.forEach(function (b, k) { b.classList.remove('on'); b.classList.toggle('done', k < i); });
      void bars[i].offsetWidth;
      bars[i].classList.add('on');
      cap.textContent = slides[i].dataset.cap;
      sub.textContent = slides[i].dataset.sub;
      idx.textContent = '0' + (i + 1) + ' / 0' + slides.length;
      clearTimeout(timer);
      timer = setTimeout(function () { show(i + 1); }, 6000);
    }
    bars.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    show(0);
  }

  function countUp() {
    document.querySelectorAll('.count').forEach(function (el) {
      if (reduce) return;
      var to = +el.dataset.to, t0 = null;
      el.textContent = '0';
      setTimeout(function () {
        requestAnimationFrame(function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1600);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        });
      }, 700);
    });
  }

  function heroStart() {
    doc.classList.add('go');
    startSlides();
    countUp();
  }

  // ---------- intro met logo (bij elke keer laden) ----------
  var splash = document.querySelector('.splash');
  if (splash && doc.classList.contains('splashing')) {
    window.scrollTo(0, 0);
    if (lenis) lenis.stop();
    var klaar = false, gevlogen = false;
    var finish = function () {
      if (klaar) return;
      klaar = true;
      doc.classList.remove('splashing');
      splash.remove();
      if (lenis) lenis.start();
    };
    var fly = function () {
      if (gevlogen) return;
      gevlogen = true;
      var logo = splash.querySelector('.splash-logo');
      var van = logo.getBoundingClientRect();
      var naarEl = hdr.querySelector('.brand svg').getBoundingClientRect();
      var s = naarEl.width / van.width;
      var dx = (naarEl.left + naarEl.width / 2) - (van.left + van.width / 2);
      var dy = (naarEl.top + naarEl.height / 2) - (van.top + van.height / 2);
      var opts = { duration: 1000, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' };
      logo.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }], opts);
      splash.querySelector('.splash-bg').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 1000, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards', delay: 120 });
      setTimeout(heroStart, 380);
      setTimeout(finish, 1150);
    };
    var t = setTimeout(fly, 1700);
    splash.addEventListener('click', function () { clearTimeout(t); fly(); });
  } else {
    heroStart();
  }

  // ---------- kopteksten per woord ----------
  function splitWoorden(el) {
    var nodes = [].slice.call(el.childNodes);
    el.textContent = '';
    nodes.forEach(function (n) {
      var tekst = n.textContent;
      var doelEl = el;
      if (n.nodeType === 1) { doelEl = n.cloneNode(false); el.appendChild(doelEl); }
      tekst.split(/(\s+)/).forEach(function (deel) {
        if (!deel) return;
        if (/^\s+$/.test(deel)) { doelEl.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        var i = document.createElement('span'); i.textContent = deel;
        w.appendChild(i); doelEl.appendChild(w);
      });
    });
  }

  // ---------- scroll-animaties ----------
  if (gsapOk && !reduce) {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    document.querySelectorAll('.split').forEach(function (el) {
      splitWoorden(el);
      gsap.from(el.querySelectorAll('.w > span'), { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray('[data-fade]').forEach(function (el) {
      gsap.from(el, { y: 44, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
    gsap.utils.toArray('[data-wipe]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(12% 5% 0% 5% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 40%', scrub: true } });
    });
    gsap.utils.toArray('[data-par]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('[data-par-lg]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if (hero) {
      gsap.to(hero.querySelector('.hero-content'), { y: -90, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    var steps = document.getElementById('steps');
    if (steps) {
      gsap.fromTo(steps.querySelector('.steps-line i'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 65%', end: 'bottom 65%', scrub: true } });
      steps.querySelectorAll('.step').forEach(function (s) {
        ST.create({ trigger: s, start: 'top 66%', onEnter: function () { s.classList.add('act'); }, onLeaveBack: function () { s.classList.remove('act'); } });
        gsap.from(s, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%' } });
      });
    }
    window.addEventListener('load', function () { ST.refresh(); });
  } else {
    document.querySelectorAll('.step').forEach(function (s) { s.classList.add('act'); });
  }

  // ---------- lopende band met functies ----------
  var track = document.querySelector('.marquee-track');
  if (track && !reduce) {
    var groep = track.querySelector('.marquee-group');
    while (track.scrollWidth < window.innerWidth * 2.2) track.appendChild(groep.cloneNode(true));
    var x = 0, richting = 1, extra = 0, laatsteY = window.scrollY;
    (function loop() {
      var y = window.scrollY, v = y - laatsteY;
      laatsteY = y;
      if (Math.abs(v) > 0.5) richting = v > 0 ? 1 : -1;
      extra += (Math.min(Math.abs(v), 60) * 0.25 - extra) * 0.1;
      x -= (0.55 + extra) * richting;
      var w = groep.offsetWidth;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(loop);
    })();
  }

  // ---------- functies: foto volgt de muis ----------
  var lijst = document.querySelector('.fn-list');
  var float = document.querySelector('.fn-float');
  if (lijst && float) {
    var imgs = {};
    lijst.querySelectorAll('a[data-img]').forEach(function (a) {
      var src = a.dataset.img;
      if (imgs[src]) return;
      var im = document.createElement('img'); im.src = src; im.alt = ''; im.loading = 'lazy';
      float.appendChild(im); imgs[src] = im;
    });
    var fx = 0, fy = 0, tx = 0, ty = 0, actief = false;
    lijst.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!actief) { fx = tx; fy = ty; } });
    lijst.querySelectorAll('a[data-img]').forEach(function (a) {
      a.addEventListener('mouseenter', function (e) {
        if (!fijn.matches || !desktop.matches) return;
        tx = e.clientX; ty = e.clientY;
        if (!actief) { fx = tx; fy = ty; }
        actief = true;
        float.classList.add('show');
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('on', k === a.dataset.img); });
      });
    });
    lijst.addEventListener('mouseleave', function () { actief = false; float.classList.remove('show'); });
    // bij scrollen schuift de lijst onder de muis door: opnieuw bepalen welke rij eronder ligt
    window.addEventListener('scroll', function () {
      if (!actief) return;
      var el = document.elementFromPoint(tx, ty);
      var a = el && el.closest && el.closest('.fn-list a[data-img]');
      if (!a) { actief = false; float.classList.remove('show'); return; }
      Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('on', k === a.dataset.img); });
    }, { passive: true });
    (function volg() {
      fx += (tx - fx) * 0.14; fy += (ty - fy) * 0.14;
      var rot = Math.max(-8, Math.min(8, (tx - fx) * 0.08));
      float.style.transform = 'translate3d(' + fx + 'px,' + fy + 'px,0) rotate(' + rot + 'deg)';
      requestAnimationFrame(volg);
    })();
  }

  // ---------- actief menu-item ----------
  var spyLinks = document.querySelectorAll('[data-spy]');
  if (spyLinks.length) {
    var zicht = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { zicht[en.target.id] = en.isIntersecting; });
      spyLinks.forEach(function (a) { a.classList.toggle('cur', !!zicht[a.dataset.spy]); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach(function (a) { var s = document.getElementById(a.dataset.spy); if (s) spy.observe(s); });
  }

  // ---------- formulier ----------
  var form = document.getElementById('aanvraag');
  var sector = document.getElementById('f-sector');
  document.querySelectorAll('[data-sector]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (sector) sector.value = a.dataset.sector;
      var sent = document.querySelector('.sent');
      if (sent && !sent.hidden) { sent.hidden = true; form.hidden = false; }
    });
  });
  if (form) {
    var sent = document.querySelector('.sent');
    var err = form.querySelector('.form-err');
    var knop = form.querySelector('button[type=submit]');
    var knopHtml = knop.innerHTML;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      if (!form.checkValidity()) { form.reportValidity(); return; }
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
        knop.innerHTML = knopHtml;
      });
    });
    document.getElementById('opnieuw').addEventListener('click', function () { sent.hidden = true; form.hidden = false; });
  }

  // ---------- vaste onderbalk op mobiel ----------
  var bar = document.getElementById('bar');
  if (bar && hero) {
    var doel = document.getElementById('aanvragen') || document.querySelector('.cta-sec');
    var heroZicht = true, doelZicht = false;
    var bObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === hero) heroZicht = en.isIntersecting;
        if (en.target === doel) doelZicht = en.isIntersecting;
      });
      bar.classList.toggle('show', !heroZicht && !doelZicht);
    });
    bObs.observe(hero);
    if (doel) bObs.observe(doel);
  }
})();
