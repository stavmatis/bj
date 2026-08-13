# BJ

A working landing-page prototype for BJ, a cultural anti-slop brand and proposed Human Direction Mark.

## Product thesis

Do not sell an unreliable “AI detector”. Sell a transparent process receipt:

- who directed the work;
- which tools were declared;
- which decisions remained human;
- what process evidence was reviewed;
- who takes responsibility for the final result.

The free product is a self-declared receipt. The paid product is a manually reviewed, numbered and hosted receipt for creators, studios and small brands.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Tests:

```bash
npx playwright install chromium
npm test
```

## Prototype caveats

- The waitlist form validates and stores the email locally. It has no backend and sends nothing.
- The slop machine is deliberately theatrical. It is not an AI detector.
- BJ is a working name. It has serious search, domain and sexual-abbreviation risk and needs professional trademark clearance before commercial use.
- This prototype uses Google Fonts. Self-host them before a privacy-sensitive production launch.

## Design

The creature is drawn in Canvas using procedural geometry. No generated image assets or UI frameworks are used. Motion respects `prefers-reduced-motion`.
