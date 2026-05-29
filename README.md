
# SlimeWire Terminal Makeover Asset Pack

This pack contains a clean neon-slime visual system for the SlimeWire terminal redesign.

## What is included

- Clean SlimeWire-style logo mark, wordmark, lockup, CTA, slime border, card frame, orb, and powered-by badge.
- Terminal action/nav icons for Trade, Live Pairs, Live Trades, KOL, Snipe, Bundle, Volume, Wallet, Positions, PnL, Exit, Refresh, Tx Audit, Settings, and more.
- PNG previews of the major assets and mockups.
- SVG mockups for Intro, Connect, and Terminal pages.
- CSS variables, Tailwind token extension, and TypeScript theme object.
- Codex prompt telling it how to use the asset pack safely.

## Best files to upload to Codex

Upload the full zip, or at minimum:

1. `CODEX_ASSET_PROMPT.md`
2. `theme/slimewire.tokens.css`
3. `asset-manifest.json`
4. `mockups/png/intro-page-mockup.png`
5. `mockups/png/connect-page-mockup.png`
6. `mockups/png/terminal-page-mockup.png`
7. `assets/svg/slimewire-mark.svg`
8. `assets/svg/slimewire-lockup.svg`
9. `assets/svg/icons/refresh.svg`
10. `assets/svg/icons/exit.svg`
11. `assets/svg/icons/best-picks.svg`
12. `assets/svg/icons/live-pairs.svg`

## Suggested destination inside the app

```txt
public/assets/slimewire/
  slimewire-mark.svg
  slimewire-lockup.svg
  slime-border-frame.svg
  slime-card-frame.svg
  terminal-grid-bg.svg
  icons/*.svg
src/styles/slimewire.tokens.css
```

## Notes

- No font files are included. Use existing app fonts, Inter from your existing setup, or system fonts.
- The detailed ogre mascot from your original art can still be used as a hero accent, but keep it out of dense terminal tables.
- Use slime border effects sparingly. The redesign should feel professional, not noisy.
- The assets are intentionally vector-first so Codex can wire them into the app easily.
