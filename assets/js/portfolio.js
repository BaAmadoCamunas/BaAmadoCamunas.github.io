// portfolio.js — Filtrado con Shuffle.js con gutters reales
// Compatible con HTML5UP tiles, respetando animaciones y padding del contenedor

(function () {
  const SHUFFLE_CDN = 'https://cdn.jsdelivr.net/npm/shufflejs@5/dist/shuffle.min.js';

  let shuffleInstance = null;
  let shuffleLoaded = false;
  let loadingPromise = null;
  let currentBreakpoint = null; // 'desktop'|'tablet'|'mobile'
  let resizeTimer = null;

  const containerSelector = '.tiles';
  const itemSelector = '.project-item';
  const buttonSelector = '.filter-btn';

  const container = document.querySelector(containerSelector);
  const buttons = Array.from(document.querySelectorAll(buttonSelector));

  if (!container || buttons.length === 0) return;

  /* ----------------------------- HELPERS ----------------------------- */

  function parseSizeToPx(value, element) {
    value = (value || '').trim();
    if (!value) return 0;

    if (value.endsWith('px')) return parseFloat(value);
    if (value.endsWith('em')) {
      const fs = parseFloat(getComputedStyle(element).fontSize) || 16;
      return parseFloat(value) * fs;
    }
    if (value.endsWith('rem')) {
      const rfs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return parseFloat(value) * rfs;
    }
    return parseFloat(value) || 0;
  }

  function waitForImages(container) {
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return Promise.resolve();
    return Promise.all(
      imgs.map(img => {
        return new Promise(resolve => {
          if (img.complete && img.naturalHeight !== 0) return resolve();
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
          setTimeout(() => { if (img.complete) resolve(); }, 1500);
        });
      })
    );
  }

  function loadShuffle() {
    if (shuffleLoaded) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SHUFFLE_CDN;
      s.async = true;
      s.onload = () => { shuffleLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('No se pudo cargar Shuffle.js'));
      document.head.appendChild(s);
    });

    return loadingPromise;
  }

  /* ----------------------------- BREAKPOINTS ----------------------------- */

  // Ajusta estos valores a los mismos breakpoints que en tu CSS
  function getBreakpoint() {
    const w = window.innerWidth;
    if (w <= 480) return 'mobile';
    if (w <= 980) return 'tablet';
    return 'desktop';
  }

  /* ----------------------------- SHUFFLE LIFECYCLE ----------------------------- */

  // Destruye la instancia si existe
  function destroyShuffle() {
    if (!shuffleInstance) return;
    try {
      shuffleInstance.destroy();
    } catch (e) {
      // ignore
    }
    shuffleInstance = null;
  }

  // Inicia Shuffle (teniendo en cuenta padding/gap actuales)
  async function initShuffle() {
    if (!window.Shuffle && !shuffleLoaded) {
      await loadShuffle();
    }
    // Si ya existe instancia, no la recrees sin motivo (pero en resize forzamos recreación)
    if (shuffleInstance) return;

    await waitForImages(container);
    const cs = getComputedStyle(container);

    // Leer gap si existe (CSS modern)
    let gapRaw = cs.getPropertyValue('gap') || cs.getPropertyValue('column-gap') || '';
    let rowGapRaw = cs.getPropertyValue('row-gap') || gapRaw || '';

    // Fallback al patrón HTML5UP
    const defaultGutterPx = parseSizeToPx('2.5em', container);

    let gapPx = gapRaw ? parseSizeToPx(gapRaw, container) : defaultGutterPx;
    let rowGapPx = rowGapRaw ? parseSizeToPx(rowGapRaw, container) : gapPx;

    // Respetar padding existente (si lo hay)
    const padLeftPx   = parseSizeToPx(cs.paddingLeft, container) || 0;
    const padRightPx  = parseSizeToPx(cs.paddingRight, container) || 0;
    const padTopPx    = parseSizeToPx(cs.paddingTop, container) || 0;
    const padBottomPx = parseSizeToPx(cs.paddingBottom, container) || 0;

    const effectiveGutterWidth  = Math.max(gapPx, padLeftPx, padRightPx);
    const effectiveGutterHeight = Math.max(rowGapPx, padTopPx, padBottomPx);

    // Instanciar
    shuffleInstance = new window.Shuffle(container, {
      itemSelector: itemSelector,
      useTransforms: true,
      sizer: null,
      speed: 550,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      gutterWidth: Math.round(effectiveGutterWidth),
      gutterHeight: Math.round(effectiveGutterHeight)
    });

    // Primer layout estable: forzamos y damos tiempo al navegador
    shuffleInstance.layout(true);
    await new Promise(r => requestAnimationFrame(r));

    // Activar transiciones "tiles-ready" (si usas esa clase)
    const items = container.querySelectorAll(itemSelector);
    items.forEach(item => item.classList.add('tiles-ready'));

    // Otro layout final por seguridad
    requestAnimationFrame(() => {
      if (shuffleInstance) shuffleInstance.layout();
    });
  }

  /* ----------------------------- FALLBACK ----------------------------- */

  function applyFallbackFilter(filter) {
    const items = container.querySelectorAll(itemSelector);
    items.forEach(it => {
      const keep = filter === 'all' || it.classList.contains(filter);
      it.style.display = keep ? '' : 'none';
    });
  }

  /* ----------------------------- FILTER HANDLER ----------------------------- */

  async function onFilterClick(e) {
    const btn = e.currentTarget;
    const filter = btn.dataset.filter || 'all';

    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    try {
      await loadShuffle();
      if (!window.Shuffle) throw new Error('Shuffle no cargó');

      // Aseguramos que la instancia esté creada (y si no, la creamos)
      if (!shuffleInstance) await initShuffle();

      if (filter === 'all') shuffleInstance.filter();
      else shuffleInstance.filter(el => el.classList.contains(filter));

      // Doble layout para evitar micro-saltos
      setTimeout(() => {
        if (shuffleInstance) shuffleInstance.layout();
        requestAnimationFrame(() => { if (shuffleInstance) shuffleInstance.layout(); });
      }, 40);

    } catch (err) {
      console.warn('Fallback simple:', err);
      applyFallbackFilter(filter);
    }
  }

  /* ----------------------------- RESIZE: reinit on breakpoint change ----------------------------- */

  function handleResize() {
    const bp = getBreakpoint();
    if (bp === currentBreakpoint) return; // sólo reaccionar si cambia el rango
    currentBreakpoint = bp;

    // destruye y vuelve a inicializar (debounced)
    destroyShuffle();
    // Espera un toque para que CSS responsive se aplique
    setTimeout(() => {
      initShuffle();
    }, 120);
  }

  // Debounced window.resize listener
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 120);
  });

  /* ----------------------------- INIT: primer cálculo de breakpoint e init ----------------------------- */

  (async function boot() {
    currentBreakpoint = getBreakpoint();
    try {
      await loadShuffle();
      await initShuffle();
    } catch (err) {
      console.warn('No se pudo inicializar Shuffle en boot:', err);
    }
  })();

  /* ----------------------------- EVENTOS ----------------------------- */

  buttons.forEach(b => b.addEventListener('click', onFilterClick));

})();
