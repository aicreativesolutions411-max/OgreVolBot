# Telegram and Slime Games landing pages

Added 2026-09-29. These are lightweight public guides, not trading runtimes.

- Homepage keeps Wallet, Terminal, Launch and fee activity; adds Telegram and Slime Games entry cards.
- `/bot` uses the existing origin route. Static aliases: `/telegram-bot`, `/solana-telegram-bot`.
- `/games` and `/slime-games` serve the Left4Sol landing page; existing `/game` and `/play` stay unchanged.
- Bot buttons use `https://t.me/SlimeWiredBot?start=menu`, `?startgroup=setup` and `?start=groupsettings`. No command executes from opening the page or copying it.
- Content is based on the current command handlers, with separate explanations for buy alerts, private trading and opt-in automation. No new API polling, RPCs or workers.
- Game website: https://Left4sol.com
- Steam listing: https://store.steampowered.com/app/5115660/Left4sol/ (Coming soon at verification; update the label when the Steam release is live.)
- User's Google share link resolved to https://dexscreener.com/solana/4vw4olfgbttkwkn14bnvj44hpatjptzhbcjnmzjxxyee for the L4S/SOL PumpSwap pair. The landing uses that direct destination.

## Existing published artwork

Reused unchanged from the user's published Steam listing. Preserve full aspect ratios; no character crops or AI edits.

- `web/public/assets/slimewire/games/left4sol-capsule.jpg`: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/5115660/3eda89676ea3c5ff158c12c9d1361615f8179247/capsule_616x353.jpg?t=1789671356
- `web/public/assets/slimewire/games/left4sol-gameplay.jpg`: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/5115660/dc54db0a9eb0f7073f10253b8e1b1470010baa33/ss_dc54db0a9eb0f7073f10253b8e1b1470010baa33.1920x1080.jpg?t=1789671356

## Checks

`node --test tests/botLanding.test.js tests/homePage.test.js`

`npm run build:web` and `npm test` before release. Browser QA: desktop and 390px phone widths, feature expansion, command copying, all three game destinations, images loaded, no horizontal overflow. Use an isolated static preview; never start the live bot locally.
