/* ============================================================
   АВТОСЕРВИС 16 — script.js
   Vanilla JS + Motion (motion.dev, vanilla-режим) для reveal-анимаций
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('no-motion');

  /* ---------- header scrolled ---------- */
  var header = document.getElementById('site-header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- burger / mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  var backdrop = document.getElementById('menu-backdrop');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) {
      backdrop.hidden = false;
      requestAnimationFrame(function () { backdrop.classList.add('show'); });
    } else {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.hidden = true; }, 300);
    }
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  backdrop.addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });

  /* ---------- reveal on scroll ----------
     Надёжная схема: элементы первого экрана показываем сразу,
     остальные — через IntersectionObserver + CSS-переход.
     Motion (motion.dev) — для декоративного пульса «пьедестала». */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var ratingCard = document.querySelector('.rating-card');
  var vh = window.innerHeight;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach(function (el) {
    if (el.getBoundingClientRect().top < vh * 0.92) {
      el.classList.add('is-visible');            // уже в первом экране
    } else {
      io.observe(el);
    }
  });

  if (ratingCard) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          ratingCard.classList.add('in-view');
          io2.disconnect();
        }
      });
    }, { rootMargin: '0px 0px -20% 0px' });
    io2.observe(ratingCard);
  }

  /* Motion: мягкий пульс свечения за «пьедесталом» (декор) */
  var glow = document.querySelector('.stage-glow');
  if (glow && !reduced && window.Motion && window.Motion.animate) {
    window.Motion.animate(glow,
      { opacity: [0.75, 1, 0.75], scale: [1, 1.06, 1] },
      { duration: 6, repeat: Infinity, ease: 'easeInOut' });
  }

  /* ---------- review expand ---------- */
  document.querySelectorAll('.review-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.previousElementSibling;
      var open = text.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Свернуть' : 'Показать полностью';
    });
  });

  /* ---------- collection slider ---------- */
  var viewport = document.getElementById('collection-viewport');
  var track = document.getElementById('collection-track');
  var slides = Array.prototype.slice.call(track.children);
  var curEl = document.getElementById('col-current');
  var totalEl = document.getElementById('col-total');
  var progress = document.getElementById('col-progress');
  var prevBtn = document.getElementById('col-prev');
  var nextBtn = document.getElementById('col-next');
  var index = 0;

  if (slides.length) {
    if (totalEl) totalEl.textContent = '/ ' + String(slides.length).padStart(2, '0');
    var gap = 0;

    function measure() {
      var r0 = slides[0].getBoundingClientRect();
      var r1 = slides.length > 1 ? slides[1].getBoundingClientRect() : null;
      gap = r1 ? r1.left - r0.right : 24;
    }

    function apply(anim) {
      var vw = viewport.clientWidth;
      var w = slides[index].getBoundingClientRect().width;
      var offset = index * (w + gap) - (vw - w) / 2;
      var max = Math.max(0, track.scrollWidth - vw);
      offset = Math.max(0, Math.min(offset, max));
      track.classList.toggle('no-anim', anim === false || reduced);
      track.style.transform = 'translateX(' + (-offset) + 'px)';
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      if (curEl) curEl.textContent = String(index + 1).padStart(2, '0');
      if (progress) progress.style.width = ((index + 1) / slides.length * 100) + '%';
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    }

    function go(i) {
      index = Math.max(0, Math.min(i, slides.length - 1));
      apply();
    }

    prevBtn.addEventListener('click', function () { go(index - 1); });
    nextBtn.addEventListener('click', function () { go(index + 1); });

    document.addEventListener('keydown', function (e) {
      if (document.body.classList.contains('lb-open') || document.body.classList.contains('menu-open')) return;
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    });

    // drag / swipe
    var startX = 0, startOffset = 0, dragging = false, moved = 0;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = 0;
      startX = e.clientX;
      var vw = viewport.clientWidth;
      var w = slides[index].getBoundingClientRect().width;
      startOffset = -(index * (w + gap) - (vw - w) / 2);
      startOffset = Math.max(-Math.max(0, track.scrollWidth - vw), Math.min(0, startOffset));
      viewport.classList.add('dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = e.clientX - startX;
      track.classList.add('no-anim');
      track.style.transform = 'translateX(' + (startOffset + moved) + 'px)';
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('dragging');
      var threshold = 60;
      if (moved < -threshold) go(index + 1);
      else if (moved > threshold) go(index - 1);
      else apply();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', function () { measure(); apply(false); });
    measure();
    apply(false);
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var lbClose = document.getElementById('lb-close');
  var lbIndex = 0;

  function openLb(i) {
    if (!slides.length) return;
    lbIndex = (i + slides.length) % slides.length;
    var img = slides[lbIndex].querySelector('img');
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.getAttribute('alt') || '';
    lb.hidden = false;
    document.body.classList.add('lb-open');
  }
  function closeLb() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
  }

  if (slides.length) {
    slides.forEach(function (s, i) {
      s.addEventListener('click', function () {
        if (Math.abs(moved) > 8) return; // это был drag
        openLb(i);
      });
    });
  }
  if (lb) {
    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', function () { openLb(lbIndex - 1); });
    lbNext.addEventListener('click', function () { openLb(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
      if (e.key === 'ArrowRight') openLb(lbIndex + 1);
    });
  }
})();
