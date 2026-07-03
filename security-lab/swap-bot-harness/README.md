# Swap-Bot Lab Harness (test-only, DRY_RUN)

A **defensive** reference harness for reviewing a Telegram-triggered Solana swap-bot
architecture. It exists to *demonstrate the guardrails*, not to trade.

- **Default mode is `DRY_RUN=true`.** No signing, no broadcast.
- **No mainnet code path exists.** `mainnet-beta` is hard-blocked; the only thing this
  harness can ever broadcast is a harmless 0-lamport self-transfer, and only after the
  live chain's **genesis hash** is proven to be devnet at runtime (env strings are not
  trusted). Devnet SOL has no monetary value.
- **No secrets required or accepted.** No private keys, seed phrases, bot tokens, or API
  keys are read. Signing uses an **ephemeral, fund-less** keypair.
- **No live Telegram connection.** The parser is driven by `handleUpdate(mockUpdate)` from
  tests / the demo. Wiring `getUpdates`/webhook is an env-gated exercise for an authorized
  deployment (see the checklist).

> This harness is intentionally **separate from any production trading code**. Do not import
> it into, or wire it into, a bot that holds or moves real funds.

## Run it

```bash
cd security-lab/swap-bot-harness
npm install
npm run typecheck      # tsc --noEmit
npm test               # jest — validation + abuse-case matrix
ADMIN_CHAT_IDS=123456 npm run demo   # offline walk-through
```

Commands (test mode): `/quote <inMint> <outMint> <amount> [slippageBps]`,
`/simulate ...` (quote + simulate, never broadcasts under DRY_RUN), `/status`, `/help`.

---

## 1. Threat model

**Assets:** hot-wallet private key(s); RPC / Jupiter / Telegram credentials; user funds;
integrity of the *trade-authorization* decision; the audit trail.

**Entry points / trust boundaries:**

| Boundary | Trust | Notes |
|---|---|---|
| Telegram message → bot | **Untrusted** | Any group member; text is attacker-controlled. `update_id`/`from.id` are spoofable if you don't verify webhook auth. |
| Bot → RPC / Jupiter | Semi-trusted | Responses can be wrong/hostile (bad quotes, MITM without TLS). |
| Bot → signer / wallet | Trusted | Whoever holds the key holds the funds — biggest blast radius. |
| Operator env / secret store | Trusted | A single flag flip (`DRY_RUN=false`) or leaked key is catastrophic. |

**STRIDE (swap-bot specific):**

- **Spoofing** — forged "admin" commands (no allowlist); replayed `update_id`; a member
  pretending to be an admin; a forged webhook POST if the secret token isn't checked.
- **Tampering** — MITM'd RPC/Jupiter altering a quote → catastrophic slippage; command
  injection via unvalidated arguments.
- **Repudiation** — no audit log ⇒ can't prove who triggered a trade.
- **Info disclosure** — private keys / bot tokens in logs or error messages; leaking
  positions or quotes.
- **DoS** — command floods; RPC-quota exhaustion; unbounded in-memory state.
- **Elevation of privilege** — non-admin triggering trades; a compromised npm dependency
  reaching the signer; the DRY_RUN → live flip.
- **Financial-specific** — unbounded slippage (sandwich/MEV drain); wrong/typo/homoglyph
  mint; double-execution from duplicate events; buying a honeypot (unsellable) token;
  hot-wallet custody risk.

## 2. Security findings (ranked)

Generic to this architecture pattern; how the harness answers each:

| # | Sev | Finding | Harness mitigation |
|---|-----|---------|--------------------|
| F1 | **Critical** | Hot wallet holds funds with broad trade authority — one leaked key drains everything | Ephemeral fund-less signer only; no key custody; **real deployments must use per-trade caps + allowlisted mints + KMS/HSM** |
| F2 | **Critical** | Weak/absent command auth ⇒ anyone triggers trades | Admin allowlist, **deny-by-default** (empty list = nobody) |
| F3 | **Critical** | A single boolean flips the bot to live mainnet | Mainnet hard-blocked; broadcast needs 3 env gates **+ runtime genesis check** |
| F4 | **High** | No idempotency/replay protection ⇒ duplicate events double-trade | Atomic `claimOnce(update_id)` in SQLite; concurrent calls → exactly one wins |
| F5 | **High** | Unbounded slippage / no amount cap ⇒ MEV/sandwich drain | Hard slippage ceiling (≤5%) + per-command amount ceiling; reject over-ceiling |
| F6 | **High** | Provider failure fails *open* (executes anyway) | Every quote/provider path **fails closed** |
| F7 | **Medium** | In-memory-only state ⇒ lost on restart, no forensics | Durable SQLite: sessions, processed-events, append-only audit log |
| F8 | **Medium** | Secrets in logs | Aggressive redaction (tokens, base58/hex secrets, seed phrases) |
| F9 | **Medium** | No rate limiting ⇒ DoS + RPC burn | Per-chat token bucket |
| F10 | **Medium** | Trusting the `cluster` env string instead of the actual chain | Genesis-hash verification before any send |
| F11 | **Low** | Input validation gaps (mint/amount) | Strict validators, fail-closed |
| F12 | **Low** | Webhook without TLS / secret-token check | Documented in the checklist (§5) |

## 3. Lab harness

`src/config.ts` guardrails · `src/logger.ts` redaction · `src/validation.ts` input
validation · `src/state.ts` SQLite (idempotency/session/audit) · `src/rateLimit.ts`
token bucket · `src/jupiter.ts` mock + read-only quote (no execute path) ·
`src/solana.ts` ephemeral signer + simulate-only + genesis-gated no-op broadcast ·
`src/bot.ts` handler (auth → rate-limit → replay → validate → dispatch → audit).

## 4. Tests (`npm test`)

`tests/validation.test.ts` and `tests/abuse.test.ts` cover: malicious/injection inputs,
invalid mints, excessive slippage, replayed commands, duplicate events, concurrent triggers
(exactly-one-wins), missing/failing provider (fail-closed), unauthorized/deny-by-default,
rate-limit flooding, and **attempted mainnet execution** (flag gate + genesis-mismatch
refusal), plus the armed-devnet no-op path.

## 5. Deployment hardening checklist (authorized production review)

- **Webhook TLS** — HTTPS only, valid cert; set a `secret_token` on `setWebhook` and verify
  the `X-Telegram-Bot-Api-Secret-Token` header on every request; restrict source IPs to
  Telegram's ranges; drop unauthenticated POSTs.
- **Token rotation** — rotate the bot token on any suspected exposure and on a schedule;
  never commit it; revoke via BotFather immediately if leaked.
- **Secret management** — store keys/tokens in a KMS / Vault / sealed-secrets, never in the
  repo or a committed `.env`; least-privilege; short-lived where possible; separate signing
  key from the app (HSM/remote signer) so the app never sees raw key bytes.
- **Admin allowlist** — numeric chat/user IDs from a trusted config, deny-by-default;
  re-verify admin status server-side (don't trust client-supplied role claims).
- **Trade safety rails (production)** — per-trade + daily notional caps; allowlisted output
  mints; max slippage; simulate-before-send; honeypot/sellability pre-check; circuit breaker
  that force-enables DRY_RUN on anomalies.
- **Audit logging** — append-only, tamper-evident (hash-chained), records who/what/when with
  secrets redacted; ship to a separate sink.
- **Monitoring/alerting** — alert on failed-auth spikes, slippage/volume anomalies, quote
  errors, and any transition out of DRY_RUN.
- **Incident rollback** — documented kill-switch (force `DRY_RUN=true`, disable the webhook,
  revoke the token, **rotate/withdraw the signing key — an action the operator performs**);
  runbook + rehearsed restore from backups.

## 6. Unsafe / risky patterns to check for in the original code

The context placeholder wasn't filled in, so this is a **red-flag grep list** to run against
the real bot rather than a line-by-line review. Point me at specific files and I'll do a
targeted pass.

- **Signing/execution reachable directly from a chat command** with no DRY_RUN gate, no
  amount/slippage cap, and no simulate-first — the highest-risk pattern for a swap bot.
- **A private key, seed phrase, or bot token read from an env var and logged**, or passed
  through error messages / stack traces.
- **Cluster/endpoint chosen by an env string with no genesis verification** — trivially
  mis-pointed at mainnet.
- **Trade triggers with no idempotency key / dedup** (in-memory `Map` only) — restart or a
  duplicate Telegram delivery ⇒ double execution.
- **`slippageBps` taken from user input without a hard ceiling**, or amount with no cap.
- **Admin check by username string** (spoofable/rename) instead of numeric ID; or no admin
  gate at all in group chats.
- **Unbounded in-memory state** (session/seen maps that never evict) — a DoS + a
  crash-on-OOM risk. (Your production bot already had an unhandled-rejection-in-a-timer
  crash class; the same discipline applies here — never let a background path throw
  unguarded.)
- **A webhook handler that doesn't verify the Telegram secret token** — anyone who learns
  the URL can inject "commands."
