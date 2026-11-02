/*
 * Cinematic motion layer (GSAP + ScrollTrigger + SplitText + Lenis).
 * Runs only when <html> has the "motion" class, which the inline <head> script sets
 * unless the visitor prefers reduced motion. Content is fully usable without this file.
 */
(() => {
  'use strict';

  const html = document.documentElement;
  if (!html.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;
  window.__motion = true;

  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'expo.out';

  /* ---------- Smooth scrolling ---------- */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // In-page anchors: honour each target's scroll-margin-top (sticky bars).
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 96;
      lenis.scrollTo(target, { offset: -margin, duration: 1.4 });
      history.replaceState(null, '', url.hash);
    });
  }

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  fontsReady.then(init);

  function init() {
  /* ---------- Split helpers ---------- */
  const splitLines = (el) => new SplitText(el, { type: 'lines,words', linesClass: 'split-line', mask: 'lines' });

  /* ---------- Hero entrance (runs after the intro / curtain) ---------- */
  const hero = () => {
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    const heroEls = $$('.hero-in');
    heroEls.forEach((el) => { el.style.animation = 'none'; });
    heroEls.forEach((el, i) => {
      if (el.matches('h1')) {
        const split = splitLines(el);
        tl.from(split.words, { yPercent: 110, duration: 1.3, stagger: 0.06 }, 0.1);
        gsap.set(el, { autoAlpha: 1 });
      } else if (el.matches('[data-mosaic]')) {
        gsap.set(el, { autoAlpha: 1 });
        $$('[data-mosaic-tile]', el).forEach((tile, j) => {
          tl.fromTo(tile, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.15 + j * 0.12);
          tl.from($('img', tile), { scale: 1.35, duration: 2, ease: 'expo.out' }, 0.15 + j * 0.12);
        });
      } else {
        tl.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 0.35 + i * 0.08);
      }
    });
    return tl;
  };

  /* ---------- Intro (first visit) / curtain (between pages) ---------- */
  const intro = $('.intro');
  const curtain = $('.curtain');
  const start = () => { hero(); };

  if (html.classList.contains('intro-pending') && intro) {
    lenis?.stop();
    window.scrollTo(0, 0);
    const name = $('.intro-name', intro);
    const count = $('.intro-count', intro);
    const split = new SplitText(name, { type: 'chars', mask: 'chars' });
    const counter = { v: 0 };
    gsap.timeline({
      defaults: { ease: EASE },
      onComplete: () => {
        html.classList.remove('intro-pending');
        lenis?.start();
        try { sessionStorage.setItem('intro', '1'); } catch (e) { /* private mode */ }
      },
    })
      .from(split.chars, { yPercent: 120, duration: 1, stagger: 0.025 }, 0.1)
      .to(counter, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(2, '0'); } }, 0.1)
      .from('.intro-line span', { scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: 'power2.inOut' }, 0.1)
      .to('.intro-inner', { autoAlpha: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 1.55)
      .to('.intro-bar-top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 1.85)
      .to('.intro-bar-bottom', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, 1.85)
      .add(start, 2.15);
  } else if (html.classList.contains('curtain-pending') && curtain) {
    gsap.timeline({ onComplete: () => html.classList.remove('curtain-pending') })
      .fromTo(curtain, { yPercent: 0 }, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 0.05)
      .add(start, 0.4);
  } else {
    start();
  }

  // Leaving the page: drop the curtain, then navigate.
  if (curtain) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.matches('[data-video], [data-photo]')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      if (!/\.html$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      try { sessionStorage.setItem('pt', '1'); } catch (err) { /* ignore */ }
      gsap.fromTo(curtain, { yPercent: 100, visibility: 'visible' }, { yPercent: 0, duration: 0.6, ease: 'expo.in', onComplete: () => { location.href = url.href; } });
    });
    // Restored from the back/forward cache: make sure the curtain is out of the way.
    window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(curtain, { yPercent: 100, visibility: 'hidden' }); });
  }

  /* ---------- Section headings: lines rise out of masks ---------- */
  $$('main h2.h-section, main h2.h-display:not([data-split-chars]), main h3[data-split]').forEach((el) => {
    const split = splitLines(el);
    gsap.from(split.words, {
      yPercent: 110, duration: 1.2, ease: EASE, stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ---------- Generic reveals (replaces the CSS observer) ---------- */
  gsap.set('.reveal', { autoAlpha: 0, y: 40 });
  const revealBatch = (els) => ScrollTrigger.batch(els, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.09, overwrite: 'auto' }),
  });
  revealBatch($$('.reveal').filter((el) => !el.parentElement.closest('.archive')));

  /* ---------- Image wipes ---------- */
  const wipe = (frame) => {
    const img = $('img', frame);
    const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 90%', once: true } });
    tl.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
    if (img && !frame.hasAttribute('data-parallax')) tl.from(img, { scale: 1.25, duration: 1.8, ease: EASE, clearProps: 'transform' }, 0);
  };
  $$('[data-series] .photo-tile, .card .media-zoom, [data-wipe]').forEach(wipe);

  /* ---------- Parallax ---------- */
  $$('[data-parallax]').forEach((frame) => {
    const img = $('img', frame);
    if (!img) return;
    const amount = parseFloat(frame.dataset.parallax) || 10;
    gsap.fromTo(img, { yPercent: -amount, scale: 1 + amount / 50 }, {
      yPercent: amount, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- Showreel panel opens up as it arrives ---------- */
  const reel = $('[data-showreel]');
  if (reel) {
    gsap.fromTo(reel, { scale: 0.86, borderRadius: 48 }, {
      scale: 1, borderRadius: 16, ease: 'none',
      scrollTrigger: { trigger: reel, start: 'top bottom', end: 'top 25%', scrub: 0.6 },
    });
  }

  /* ---------- "Lights down": the page dims into the dark film sections ---------- */
  const darkSections = $$('main section.bg-ink');
  if (darkSections.length) {
    const dimmer = document.createElement('div');
    dimmer.className = 'dimmer';
    document.body.appendChild(dimmer);
    const header = $('[data-nav]');
    darkSections.forEach((sec) => {
      sec.classList.add('is-dark-stage');
      let fadeIn = 0;
      let fadeOut = 0;
      const apply = () => gsap.set(dimmer, { opacity: Math.max(0, Math.min(fadeIn, 1 - fadeOut)) });
      ScrollTrigger.create({ trigger: sec, start: 'top 85%', end: 'top 35%', scrub: true, onUpdate: (st) => { fadeIn = st.progress; apply(); } });
      ScrollTrigger.create({ trigger: sec, start: 'bottom 65%', end: 'bottom 15%', scrub: true, onUpdate: (st) => { fadeOut = st.progress; apply(); } });
      // Navbar switches to its dark style while a dark section sits under it.
      if (header) {
        ScrollTrigger.create({
          trigger: sec, start: 'top 40px', end: 'bottom 40px',
          onToggle: (st) => header.classList.toggle('on-dark', st.isActive),
        });
      }
    });
  }

  /* ---------- Horizontal film strip (desktop pins; touch keeps native swipe) ---------- */
  const strip = $('[data-filmstrip]');
  if (strip) {
    const track = $('[data-filmstrip-track]', strip);
    const bar = $('[data-filmstrip-progress]', strip);
    gsap.matchMedia().add('(min-width: 1024px)', () => {
        track.classList.add('is-pinned');
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(), ease: 'none',
          scrollTrigger: {
            trigger: strip, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: (st) => { if (bar) gsap.set(bar, { scaleX: st.progress }); },
          },
        });
        // Frames lean slightly with scroll velocity, like film through a gate.
        $$('[data-filmstrip-item] img', track).forEach((img) => {
          gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } });
        });
        return () => { track.classList.remove('is-pinned'); };
    });
  }

  /* ---------- Big footer line: characters wave in ---------- */
  $$('[data-split-chars]').forEach((el) => {
    const split = new SplitText(el, { type: 'chars,words', mask: 'chars' });
    gsap.from(split.chars, { yPercent: 110, duration: 1, ease: EASE, stagger: 0.018, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---------- Series numerals ---------- */
  $$('[data-numeral]').forEach((el) => {
    gsap.from(el, { rotate: -8, yPercent: 40, autoAlpha: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------- Scroll progress line ---------- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  gsap.to(progress, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- Desktop-only: custom cursor + magnetic buttons ---------- */
  if (finePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.innerHTML = '<span class="cursor-ring"><span class="cursor-label"></span></span><span class="cursor-dot"></span>';
    document.body.appendChild(cursor);
    const ring = $('.cursor-ring', cursor);
    const dot = $('.cursor-dot', cursor);
    const label = $('.cursor-label', cursor);
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    let px = -100;
    let py = -100;
    window.addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      cursor.classList.add('is-active');
      ringX(px); ringY(py); dotX(px); dotY(py);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    const setState = (target) => {
      const media = target?.closest('[data-video], [data-photo], [data-filmstrip-item]');
      const link = target?.closest('a, button, summary, label, select, input, textarea');
      cursor.classList.toggle('is-media', !!media);
      cursor.classList.toggle('is-link', !media && !!link);
      label.textContent = media ? (media.matches('[data-video]') ? 'Play' : 'View') : '';
    };
    document.addEventListener('pointerover', (e) => setState(e.target));
    // Content moves under a still pointer while scrolling: re-check what is underneath.
    const recheck = () => setState(document.elementFromPoint(px, py));
    if (lenis) lenis.on('scroll', recheck); else window.addEventListener('scroll', recheck, { passive: true });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

    $$('.btn-primary, .btn-ghost, .play-badge, [data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const host = el.closest('.group') && el.matches('.play-badge') ? el.closest('.group') : el;
      host.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.3);
        my((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      host.addEventListener('pointerleave', () => { mx(0); my(0); });
    });

    // Hero mosaic drifts gently against the pointer.
    const mosaic = $('[data-mosaic]');
    if (mosaic) {
      const tiles = $$('[data-mosaic-tile]', mosaic).map((tile, i) => ({
        x: gsap.quickTo(tile, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(tile, 'y', { duration: 1.2, ease: 'power3' }),
        depth: [14, 26, 20][i] || 18,
      }));
      window.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        tiles.forEach((t) => { t.x(-nx * t.depth); t.y(-ny * t.depth); });
      }, { passive: true });
    }
  }

  /* ---------- Late content: archive drawer + story filters ---------- */
  const archive = $('.archive');
  if (archive) {
    let done = false;
    archive.addEventListener('toggle', () => {
      ScrollTrigger.refresh();
      if (archive.open && !done) { done = true; revealBatch($$('.reveal', archive)); }
    });
  }
  $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
    gsap.fromTo($$('[data-category]:not([hidden])'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.06, overwrite: true });
  }));

  // Images can change layout height: re-measure once everything has loaded.
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
