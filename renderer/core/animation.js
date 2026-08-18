// ============================================================
// 世界生成器 — 动画系统
// ============================================================

gsap.registerPlugin(ScrollTrigger);

function animatedContent(el, opts) {
  if (!el || typeof gsap === 'undefined') return;
  const defaults = { distance: 40, direction: 'vertical', reverse: false, duration: 0.8, ease: 'power3.out', initialOpacity: 0, animateOpacity: true, threshold: 0.1, delay: 0 };
  const o = Object.assign({}, defaults, opts || {});
  const axis = o.direction === 'horizontal' ? 'x' : 'y';
  const offset = o.reverse ? -o.distance : o.distance;
  gsap.set(el, { [axis]: offset, opacity: o.animateOpacity ? o.initialOpacity : 1, visibility: 'visible' });
  const tl = gsap.timeline({ paused: true, delay: o.delay });
  tl.to(el, { [axis]: 0, opacity: 1, duration: o.duration, ease: o.ease });
  const scroller = document.querySelector('#tab-content');
  ScrollTrigger.create({ trigger: el, scroller: scroller, start: 'top 92%', once: true, onEnter: function() { tl.play(); } });
}

function animatePageContent(scope) {
  const container = $('#tab-content');
  if (!container) return;
  ScrollTrigger.getAll().forEach(function(st) { st.kill(); });
  if (scope !== 'detail') {
    container.querySelectorAll('.tag-tree-panel, .location-panel, .char-list-panel, .faction-list-panel, .item-list-panel, .race-list-panel').forEach(function(panel, i) {
      gsap.fromTo(panel, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: i * 0.06, ease: 'power3.out' });
    });
  }
  container.querySelectorAll('.char-detail-panel, .faction-detail-panel, .item-detail-panel, .race-detail-panel, .location-detail-panel, .wiki-page').forEach(function(panel, i) {
    animatedContent(panel, { distance: 40, duration: 0.7, delay: i * 0.06, ease: 'power3.out' });
  });
  container.querySelectorAll('.card, .worldview-section, .constitution-entry, .encyclopedia-layout, .kanban-column, .explorer-card, .fmap-layout, .fmap-toolbar, .fmap-sidebar-section, .fmap-stats-content, .relation-layout, .relation-list-panel, .relation-detail-panel').forEach(function(el, i) {
    if (el.closest('.char-detail-panel, .faction-detail-panel, .item-detail-panel, .race-detail-panel, .location-detail-panel, .wiki-page')) { gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' }); return; }
    animatedContent(el, { distance: 30, duration: 0.6, delay: 0.05 + i * 0.05, ease: 'power3.out' });
  });
  container.querySelectorAll('.wiki-title').forEach(function(el) {
    splitTextAnimate(el, { delay: 30, duration: 500, ease: 'outExpo', from: { opacity: 0, translateY: 16 }, to: { opacity: 1, translateY: 0 } });
  });
  container.querySelectorAll('.wiki-header').forEach(function(el) {
    animatedContent(el, { distance: 40, duration: 0.7, delay: 0.05, ease: 'power3.out' });
  });
  const sections = container.querySelectorAll('.wiki-section, .dim-group');
  sections.forEach(function(sec, i) {
    animatedContent(sec, { distance: 30, duration: 0.6, delay: 0.15 + i * 0.04, ease: 'power3.out' });
  });
  container.querySelectorAll('.empty-state').forEach(function(el) {
    animatedContent(el, { distance: 20, duration: 0.5, ease: 'power3.out' });
  });
  ScrollTrigger.refresh();
}

function splitTextAnimate(selector, options) {
  const defaults = {
    delay: 40,
    duration: 600,
    ease: 'outExpo',
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
    split_type: 'chars',
    triggerOnScroll: false
  };
  const opts = Object.assign({}, defaults, options);
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el || typeof anime === 'undefined' || !anime.animate) return;
  const text = el.textContent;
  if (!text) return;
  el.innerHTML = '';
  el.style.display = 'inline-block';
  const chars = [];
  if (opts.split_type === 'words') {
    const words = text.split(/(\s+)/);
    words.forEach(word => {
      if (/^\s+$/.test(word)) {
        el.appendChild(document.createTextNode(word));
      } else {
        const span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        span.textContent = word;
        el.appendChild(span);
        chars.push(span);
      }
    });
  } else {
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      span.textContent = char;
      el.appendChild(span);
      chars.push(span);
    });
  }
  if (chars.length === 0) return;
  const animProps = {};
  Object.keys(opts.from).forEach(k => { animProps[k] = [opts.from[k], opts.to[k]]; });
  animProps.delay = anime.stagger(opts.delay);
  animProps.duration = opts.duration;
  animProps.ease = opts.ease;
  const runAnim = () => { anime.animate(chars, animProps); };
  if (opts.triggerOnScroll) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runAnim();
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  } else {
    runAnim();
  }
}