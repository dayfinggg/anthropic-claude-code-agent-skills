# Measuring and fixing Core Web Vitals

## Measurement

- Core Web Vitals are judged at the 75th percentile of page loads, separately for mobile and desktop.
- Since Safari 26.2 (December 2025) LCP and INP are measurable in every major browser, so RUM includes Safari users. CLS and Long Animation Frames remain Chromium-only, and CrUX covers only Chrome.
- Collect field data with `web-vitals` 6. Its `web-vitals/attribution` build splits LCP into `timeToFirstByte`, `resourceLoadDelay`, `resourceLoadDuration` and `elementRenderDelay`, and INP into `inputDelay`, `processingDuration` and `presentationDelay` with the target and `longestScript`. Soft-navigation vitals need Chromium 151.
- The browser APIs behind `web-vitals` see nothing inside iframes, while CrUX includes iframe content, so the two can differ.
- Claim a field improvement only after new visits arrive, because lab tools (Lighthouse, DevTools) show one load on one device.

## LCP

- Fix the subpart that dominates, then compare all of them again, because a smaller LCP image often moves the saved time into render delay and leaves LCP unchanged.
- To cut resource load delay, put the LCP image in the server HTML, because a client-rendered hero adds HTML, then JS, then execution, then the image request.
- Inline critical CSS, avoid `@import` chains in CSS, and keep large scripts out of `<head>` unless they have `defer` or `type="module"`.

## INP

- Find the interaction and the script from the INP attribution (`longestScript`) or a DevTools trace rather than by guessing.
- Update the UI first, then do the heavy work in a yielded task or a Web Worker. Debounce `scroll`, `resize` and rapid `input` handlers.
- Layout thrashing, which reads `offsetHeight` or `getBoundingClientRect()` after a style write in a loop, shows up as long presentation or processing time. Batch reads, then writes.
- Third-party scripts (analytics, chat, ads) are the usual main-thread cost. Load them with `defer` near the end of the page, or after interaction.

## CLS

- An element that moved is often the victim of a shift. Find the inserted or resized node from the `layout-shift` entry `sources` before changing the moved element.
- Give images and videos `width` and `height` or `aspect-ratio`, reserve space for ads and embeds, and use `scrollbar-gutter: stable` where content can grow a scrollbar.
- Web fonts shift text when they swap. Preload only the above-the-fold WOFF2 files with `crossorigin`, subset fonts, and match fallback metrics.

## Navigation speed

- `Cache-Control: no-store` on an HTML page keeps it out of the back/forward cache. Use it for private data only, and `no-cache` for freshness.
- Speculation Rules prerendering is Chromium-only and runs page scripts before the user navigates. Gate analytics and other side effects on `document.prerendering` and the `prerenderingchange` event.
