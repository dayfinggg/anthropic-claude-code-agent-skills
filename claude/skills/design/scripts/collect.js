() => {
  const parse = (s) => {
    const m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const toRgb = (() => {
    const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    return (s) => {
      if (!s) return null;
      if (/^rgba?\(/.test(s)) return parse(s);
      c.clearRect(0, 0, 1, 1);
      c.fillStyle = '#000';
      c.fillStyle = s;
      c.fillRect(0, 0, 1, 1);
      const d = c.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    };
  })();
  const blend = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 255, g: 255, b: 255, a: 1 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a,
    };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const backgroundOf = (el) => {
    const layers = [];
    let node = el;
    let complex = false;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') complex = true;
      const bg = toRgb(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a >= 1) break;
      }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    const rootBg = toRgb(getComputedStyle(document.documentElement).backgroundColor);
    if (layers.length === 0 || layers[layers.length - 1].a < 1) {
      if (rootBg && rootBg.a > 0) base = blend(rootBg, base);
    }
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return { color: base, complex };
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
  };
  const textNodesOwner = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (t.textContent.trim().length > 1 && t.parentElement) textNodesOwner.add(t.parentElement);
  }
  const contrast = [];
  const fonts = {}, sizes = {}, weights = {}, colors = {}, radii = {}, shadows = {};
  let uppercaseTracked = 0, gradientText = 0, accentBorders = 0;
  for (const el of textNodesOwner) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    fonts[fam] = (fonts[fam] || 0) + 1;
    sizes[cs.fontSize] = (sizes[cs.fontSize] || 0) + 1;
    weights[cs.fontWeight] = (weights[cs.fontWeight] || 0) + 1;
    colors[cs.color] = (colors[cs.color] || 0) + 1;
    if (cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) > 0.5) uppercaseTracked++;
    if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') { gradientText++; continue; }
    const fg = toRgb(cs.color);
    if (!fg) continue;
    const bg = backgroundOf(el);
    const effective = blend({ ...fg, a: fg.a * Math.min(1, parseFloat(cs.opacity)) }, bg.color);
    const px = parseFloat(cs.fontSize);
    const w = parseInt(cs.fontWeight, 10) || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const r = ratio(effective, bg.color);
    const need = large ? 3 : 4.5;
    if (r < need) {
      contrast.push({
        text: el.textContent.trim().slice(0, 60),
        tag: el.tagName.toLowerCase(),
        ratio: Math.round(r * 100) / 100,
        need,
        fontSize: cs.fontSize,
        backgroundUncertain: bg.complex,
      });
    }
  }
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.borderTopLeftRadius !== '0px') radii[cs.borderTopLeftRadius] = (radii[cs.borderTopLeftRadius] || 0) + 1;
    if (cs.boxShadow !== 'none') shadows[cs.boxShadow] = (shadows[cs.boxShadow] || 0) + 1;
    const bl = parseFloat(cs.borderLeftWidth);
    if (bl > 1 && cs.borderLeftStyle !== 'none' && parseFloat(cs.borderRightWidth) < 1 && parseFloat(cs.borderTopWidth) < 1) accentBorders++;
  }
  const targets = [];
  const interactive = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])');
  for (const el of interactive) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li');
    if (inline) continue;
    let w = r.width, h = r.height;
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      const label = el.closest('label') || (el.id && document.querySelector(`label[for="${el.id}"]`));
      if (label) { const lr = label.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
    }
    if (w < 24 || h < 24) targets.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 40), w: Math.round(w), h: Math.round(h) });
  }
  let transitionAll = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.transitionProperty.split(',').map(s => s.trim()).includes('all') && cs.transitionDuration.split(',').some(d => parseFloat(d) > 0)) transitionAll++;
  }
  let reducedMotionQuery = false, hasMotion = false;
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    const scan = (list) => {
      for (const r of list) {
        if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) reducedMotionQuery = true;
        if (r.type === 7) hasMotion = true;
        if (r.style && (r.style.animationName || r.style.animation)) hasMotion = true;
        if (r.cssRules) scan(r.cssRules);
      }
    };
    scan(rules);
  }
  const doc = document.documentElement;
  const overflow = [];
  if (doc.scrollWidth > doc.clientWidth + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 && visible(el)) {
        overflow.push({ tag: el.tagName.toLowerCase(), cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 40), right: Math.round(r.right) });
        if (overflow.length >= 8) break;
      }
    }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    viewport: { width: innerWidth, height: innerHeight },
    pageHeight: doc.scrollHeight,
    horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1 ? { scrollWidth: doc.scrollWidth, offenders: overflow } : null,
    contrastFailures: contrast.slice(0, 30),
    contrastFailureCount: contrast.length,
    smallTargets: targets.slice(0, 20),
    smallTargetCount: targets.length,
    fonts: top(fonts, 8),
    fontSizes: top(sizes, 20),
    fontWeights: top(weights, 10),
    textColors: Object.keys(colors).length,
    radii: top(radii, 10),
    shadows: top(shadows, 6),
    tells: { uppercaseTrackedLabels: uppercaseTracked, gradientText, accentLeftBorders: accentBorders, transitionAll },
    motion: { hasAnimations: hasMotion, reducedMotionQuery },
  };
}
