# Measuring and fixing Core Web Vitals

## Measurement

- Core Web Vitals pass at the 75th percentile of page loads, separately for mobile and desktop: LCP 2.5 s, INP 200 ms, CLS 0.1.
- Since Safari 26.2 (December 2025) LCP and INP are measurable in every major browser, so RUM includes Safari users. CLS and Long Animation Frames remain Chromium-only, and CrUX covers only Chrome.
- Collect field data with `web-vitals` 6. Its `web-vitals/attribution` build splits LCP into `timeToFirstByte`, `resourceLoadDelay`, `resourceLoadDuration` and `elementRenderDelay`, and INP into `inputDelay`, `processingDuration` and `presentationDelay` with the target and `longestScript`. Soft-navigation vitals need Chromium 151.
- The browser APIs behind `web-vitals` see nothing inside iframes, while CrUX includes iframe content, so the two can differ.
- Claim a field improvement only after new visits arrive. Lab tools (Lighthouse, DevTools) show one load on one device.

## LCP

- Fix the subpart that dominates, then compare all of them again: a smaller LCP image often moves the saved time into render delay and leaves LCP unchanged.
- Resource load delay: the LCP image must be in the server HTML. A client-rendered hero adds HTML, then JS, then execution, then the image request.
- Do not lazy-load the LCP image, and use `fetchpriority="high"` on that one image only, since priority is zero-sum.
- Inline critical CSS, avoid `@import` chains in CSS, and keep large scripts out of `<head>` without `defer` or `type="module"`.

## INP

- Find the interaction and the script from the INP attribution (`longestScript`) or a DevTools trace, not by guessing.
- Update the UI first, then do the heavy work in a yielded task or a Web Worker. Debounce `scroll`, `resize` and rapid `input` handlers.
- Layout thrashing (reading `offsetHeight` or `getBoundingClientRect()` after a style write, in a loop) shows up as long presentation or processing time. Batch reads, then writes.
- Third-party scripts (analytics, chat, ads) are the usual main-thread cost: load them with `defer` near the end of the page, or after interaction.

## CLS

- An element that moved is often the victim of a shift. Find the inserted or resized node from the `layout-shift` entry `sources` before changing the moved element.
- Give images and videos `width` and `height` or `aspect-ratio`, reserve space for ads and embeds, and use `scrollbar-gutter: stable` where content can grow a scrollbar.
- `content-visibility: auto` without a realistic `contain-intrinsic-size: auto <size>` makes the scrollbar jump.
- Web fonts shift text when they swap. Preload only the above-the-fold WOFF2 files with `crossorigin`, subset fonts, and match fallback metrics.

## Navigation speed

- `Cache-Control: no-store` on an HTML page keeps it out of the back/forward cache. Use it for private data only and `no-cache` for freshness.
- Speculation Rules prerendering is Chromium-only and runs page scripts before the user navigates. Gate analytics and other side effects on `document.prerendering` and the `prerenderingchange` event.
