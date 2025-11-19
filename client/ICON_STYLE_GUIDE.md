# Icon Style Guide

- Sizing: interactive icons minimum `24x24px`; display icons scale proportionally.
- Stroke: default stroke `1.8px`, round caps/joins for clarity.
- Color: primary `#1a2a6c`, accent `#ffd700`; ensure contrast ≥ 4.5:1 on backgrounds.
- States:
  - Hover: slight translateY(-2px) or color emphasis, preserve 60+ FPS.
  - Focus-visible: 3px `#ffd700` outline with 3px offset; never rely on color alone.
  - Disabled: reduce opacity to 0.5; no motion.
- Accessibility: provide `title` for non-decorative icons; otherwise set `aria-hidden`.
- Export: use `client/components/Icon.js` and pass `name`, `size`, `color`, `title`.