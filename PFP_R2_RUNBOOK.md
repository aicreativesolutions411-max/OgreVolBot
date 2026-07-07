# PFP assets & repo-size runbook

The PFP asset tree grew the git repo to **~3.6 GB** (`web/public/pfp` 2.2 GB + `web/dist/pfp` 1.4 GB), which
slows every Render clone/deploy. This is the plan to fix it, ordered by value ÷ risk.

## Where the weight is (`web/public/pfp`)
| dir | size | role | can move to CDN? |
|---|---|---|---|
| `characters/` | ~1.0 GB | roll-a-PFP, **browser-served static** | ✅ yes (no server compositing) |
| `_incoming/` | ~743 MB | Codex intake **staging**, never served | ❌ shouldn't be in git at all |
| `badge/ bg/ hat/ prop/` | ~395 MB | slime-your-pfp **compositing inputs** (sharp reads bytes) | ⚠️ server needs them on disk |
| `xcard/ mapbg/ ring/ frames/ mapfaces/` | ~87 MB | X-card / map render **compositing inputs** | ⚠️ server needs them on disk |
| `web/dist/**` | ~1.4 GB | **100% regenerated** by `build:web` on deploy | ❌ never commit |

Key fact: Render's build command is `npm ci && npm run build:web`, and `build:web` does `rm(dist)` +
`copy(public → dist)`. So **`web/dist` is a build artifact** — committing it is pure dead weight.

---

## Tier 1 — stop the bleeding (DONE, held commit `0c4bd1cd`, not yet pushed)
`.gitignore` + untrack `web/dist/` and `web/public/pfp/_incoming/` (kept on local disk). Verified **0 dist-only
files** first, so nothing is lost — Render regenerates `dist` from `public`; `_incoming` was never served.
- **Effect:** future pushes drop ~2.1 GB; the "copy X to dist before deploy" dance is gone (Render rebuilds it).
- **Risk:** none. **Deploy:** batched with the next deploy (1 push).
- Note: this stops *growth*; it does not shrink existing clones (those files remain in git *history*) — that's Tier 2.

## Tier 2 — reclaim the existing bloat from history (needs your OK: force-push)
Untracking doesn't shrink history. To actually make clones smaller, rewrite history to purge the
regenerated/staging paths:
```
# one-time tool: pip install git-filter-repo   (or download the single script)
git filter-repo --path web/dist --path web/public/pfp/_incoming --invert-paths --force
git push --force origin main
```
- **Reclaims ~2.1 GB** from the repo → every future Render clone/deploy is that much faster.
- **Low risk on content** (only removes regenerated build output + never-served staging).
- **Destructive to history**: all commit SHAs change; Render re-clones fresh on next deploy; you'd re-clone locally.
  This is why it needs an explicit go-ahead — it's a force-push.

## Tier 3 — move `characters/` (1 GB) to R2/CDN (optional, biggest further shrink)
1. **Upload** (R2 egress is free, so serving from R2 costs nothing):
   ```
   R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=… \
     node scripts/pfp-to-r2.mjs characters
   ```
   (idempotent + resumable via `.pfp-r2-manifest.json`; reuses the app's existing `src/lib/r2.js` signer.)
2. **Public access:** in the Cloudflare dashboard, either enable the bucket's `r2.dev` public URL (zero setup,
   fine to start) or connect a **custom domain** like `cdn.slimewire.org` (R2 → bucket → Settings → Custom
   Domains — production-grade, cached, still free egress).
3. **Point the app at it:** set `PFP_CDN_BASE=https://<r2-public-or-custom-domain>` on Render. (App-side rewrite
   of `/pfp/characters/*` → `${PFP_CDN_BASE}/...` is a small follow-up change, gated on this env so it's a no-op
   until you're ready; falls back to local serving when unset.)
4. Once CDN serving is confirmed: `git rm -r --cached web/public/pfp/characters`, add to `.gitignore`, and
   fold `characters/` into the Tier-2 history purge to reclaim the last ~1 GB. New character batches upload
   straight to R2 (the intake can call `pfp-to-r2.mjs`) and never touch git again.

Compositing-input dirs (`bg/ hat/ prop/ badge/ xcard/ mapbg/ ring/ frames/ mapfaces/`, ~480 MB) **stay in git**
— the server reads their bytes to composite, so they must ship with the deploy.

---

### Recommendation
Do **Tier 1** (already staged) + **Tier 2** now (that's the ~2.1 GB clone-size win, low content risk). Treat
**Tier 3** (R2 for characters, another ~1 GB) as a follow-up when you want it — the upload script is ready.
