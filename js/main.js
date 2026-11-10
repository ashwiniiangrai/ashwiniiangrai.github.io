(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Greeting loader ----------
     Edit the words to change the greeting sequence. */
  const greetings = ['Hello', 'Bonjour', 'नमस्ते', 'Olá', 'Guten Tag', 'Ciao', 'Hola'];
  const loader = document.querySelector('.loader');
  const loaderText = document.querySelector('.loader__text');

  let seen = false;
  try { seen = sessionStorage.getItem('greeted') === '1'; } catch (e) { /* storage blocked */ }

  const finishLoader = () => {
    if (!loader) return;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.classList.add('is-gone'), 1000);
    try { sessionStorage.setItem('greeted', '1'); } catch (e) { /* ignore */ }
  };

  if (!loader || reduceMotion || seen) {
    if (loader) loader.classList.add('is-gone');
  } else {
    document.body.classList.add('is-loading');
    let i = 0;
    const step = () => {
      i += 1;
      if (i >= greetings.length) { finishLoader(); return; }
      loaderText.textContent = greetings[i];
      setTimeout(step, i === greetings.length - 1 ? 550 : 200);
    };
    setTimeout(step, 700);
  }

  /* ---------- Marquee direction follows scroll ---------- */
  const track = document.querySelector('.hero__track');
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (track && Math.abs(y - lastY) > 2) {
        track.style.setProperty('--marquee-dir', y > lastY ? 'normal' : 'reverse');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* ---------- Floating menu ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const panel = document.getElementById('menu-panel');
  const hero = document.querySelector('.hero');

  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      const first = panel.querySelector('a');
      if (first) setTimeout(() => first.focus(), 300);
    } else {
      panel.classList.remove('is-open');
      panel.hidden = true;
    }
  };

  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  // Show the round menu button once the hero has scrolled away
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(([entry]) => {
      menuBtn.classList.toggle('is-visible', !entry.isIntersecting);
    }, { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  } else {
    menuBtn.classList.add('is-visible');
  }

  /* ---------- Scroll reveal + counters ---------- */
  // Count up from 0 when the numbers row is well inside the screen; replay on every return.
  const counts = [...document.querySelectorAll('.count')];
  const animateCount = (el, delay = 0) => {
    const to = Number(el.dataset.to);
    if (!to) return;
    const token = (el._token = (el._token || 0) + 1); // cancels an older run on replay
    const dur = 2000;
    el.textContent = '0';
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        if (el._token !== token) return;
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  };
  const statsRow = document.querySelector('.stats');
  if (statsRow && counts.length && 'IntersectionObserver' in window && !reduceMotion) {
    counts.forEach((c) => { c.textContent = '0'; });
    let shown = false;
    new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.6 && !shown) {
        shown = true;
        counts.forEach((c, i) => animateCount(c, i * 150));
      } else if (!entry.isIntersecting && shown) {
        shown = false;                       // left the screen: reset so it replays
        counts.forEach((c) => { c._token = (c._token || 0) + 1; c.textContent = '0'; });
      }
    }, { threshold: [0, 0.6] }).observe(statsRow);
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // small stagger for siblings revealed together
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 60}ms`;
        el.classList.add('is-in');
        // drop the stagger delay once revealed so hover effects respond instantly
        setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /* ---------- Magnetic buttons & links ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const pull = el.classList.contains('btn--round') || el.classList.contains('menu-btn') ? 0.35 : 0.25;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.setProperty('--mx', `${x * pull}px`);
        el.style.setProperty('--my', `${y * pull}px`);
        el.style.setProperty('--tx', `${x * pull * 0.4}px`);
        el.style.setProperty('--ty', `${y * pull * 0.4}px`);
      });
      el.addEventListener('pointerleave', () => {
        ['--mx', '--my', '--tx', '--ty'].forEach((p) => el.style.setProperty(p, '0px'));
      });
    });
  }

  /* ---------- Hover preview card on experience rows ---------- */
  const preview = document.querySelector('.cursor-preview');
  if (preview && finePointer && !reduceMotion) {
    const kicker = preview.querySelector('.cp-kicker');
    const stat = preview.querySelector('.cp-stat');
    const label = preview.querySelector('.cp-label');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const follow = () => {
      cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
      preview.style.setProperty('--px', `${cx}px`);
      preview.style.setProperty('--py', `${cy}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(follow) : null;
    };
    const move = (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(follow); };
    document.querySelectorAll('.role[data-stat]').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        if (window.innerWidth < 1024) return;
        kicker.textContent = row.dataset.kicker;
        stat.textContent = row.dataset.stat;
        label.textContent = row.dataset.label;
        if (!preview.classList.contains('is-active')) { cx = tx = e.clientX; cy = ty = e.clientY; follow(); }
        preview.classList.add('is-active');
      });
      row.addEventListener('pointermove', move);
      row.addEventListener('pointerleave', () => preview.classList.remove('is-active'));
    });
  }

  /* ---------- Curved footer edge (scroll-driven) ---------- */
  const curve = document.querySelector('.curve__shape');
  const footer = document.querySelector('.contact');

  const onScroll = () => {
    const vh = window.innerHeight;
    if (curve && footer) {
      const top = footer.getBoundingClientRect().top;
      const p = clamp01((vh - top) / (vh * 0.75));
      curve.style.setProperty('--curve', reduceMotion ? '1' : String(1 - p));
    }
  };
  window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Local time in Angers ---------- */
  const timeEl = document.querySelector('.local-time');
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris', timeZoneName: 'short'
  });
  const updateTime = () => { if (timeEl) timeEl.textContent = fmt.format(new Date()); };
  updateTime();
  setInterval(updateTime, 30000);
})();
