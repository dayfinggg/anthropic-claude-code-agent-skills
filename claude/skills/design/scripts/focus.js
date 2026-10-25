() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  if (!el.dataset.inspectFocus) el.dataset.inspectFocus = String(document.querySelectorAll('[data-inspect-focus]').length + 1);
  const chain = [];
  for (let node = el, i = 0; node && node !== document.body && i < 4; node = node.parentElement, i++) chain.push(node);
  const snapshot = () => chain.map((node) => {
    const cs = getComputedStyle(node);
    return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderTopColor, cs.borderBottomColor, cs.backgroundColor].join('|');
  });
  const focused = snapshot();
  el.blur();
  const blurred = snapshot();
  el.focus();
  const cs = getComputedStyle(el);
  const ownOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  let indicator = null;
  if (ownOutline || focused[0] !== blurred[0]) indicator = 'self';
  else if (focused.some((s, i) => i > 0 && s !== blurred[i])) indicator = 'ancestor';
  return {
    key: el.dataset.inspectFocus,
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 40),
    indicator,
  };
}
