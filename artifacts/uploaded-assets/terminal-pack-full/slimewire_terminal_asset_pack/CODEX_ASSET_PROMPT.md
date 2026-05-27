
# Codex prompt: apply SlimeWire terminal asset pack

You are working in the SlimeWire / slimewire.org codebase. Use this uploaded asset pack as the visual system for the makeover.

Do not blindly replace business logic. This pack is for UI assets, design tokens, layout references, and mockups only.

## Use these files

- `theme/slimewire.tokens.css` for CSS variables and reusable classes.
- `theme/slimewire-theme.ts` if the app has TypeScript theme objects.
- `theme/tailwind.slimewire.theme.js` if the app uses Tailwind.
- `assets/svg/slimewire-mark.svg` as a clean mark if the existing app lacks a clean mark.
- `assets/svg/slimewire-lockup.svg` for landing/connect branding.
- `assets/svg/slime-border-frame.svg` for the landing hero only or rare high-emphasis frames.
- `assets/svg/slime-card-frame.svg` for one or two featured cards, not every panel.
- `assets/svg/terminal-grid-bg.svg` for subtle landing/terminal background treatment.
- `assets/svg/icons/*.svg` for terminal navigation/actions.
- `mockups/png/*.png` and `mockups/svg/*.svg` as layout references.

## Visual direction

Make the app clean, terminal-style, and execution-first:

- Near-black background.
- Neon slime green accents.
- Subtle glow, not glow everywhere.
- Readable table typography.
- Slime/horror look only for hero headers, main CTA, and rare accents.
- Live Terminal is the command center.
- Preset/settings editing opens in non-blocking side drawers or docked panels.
- Live Pairs, Live Trades, KOL Signals, and Watchlist stay visible while editing.

## Required route feel

- `/` uses `mockups/png/intro-page-mockup.png` as visual reference.
- `/connect` uses `mockups/png/connect-page-mockup.png` as visual reference.
- `/terminal` uses `mockups/png/terminal-page-mockup.png` as visual reference.

## Safety

Keep the P0 safety requirements from the main prompt:

- visible wallet refresh
- forced refresh after trades
- transaction audit
- accurate PnL
- manual exit buttons on every position
- stop-loss status/audit
- correct Live Pairs time filters
- steady Live Pairs refresh
- Best Picks ranking without fake safety claims

## Do not

- Do not delete existing SlimeWire tools.
- Do not hard-code secrets or RPC keys.
- Do not claim stop-loss is automatic unless execution is actually possible.
- Do not replace real trading logic with mock UI.
- Do not use full-screen modals for normal editing.
- Do not let visual polish block live trade scanning.
