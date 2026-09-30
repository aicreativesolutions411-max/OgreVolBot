# X identity for SlimeWire SOL fee claims

## Current release status

The financial release hold in `src/lib/socialFeePolicy.js` remains **false**.
No new X fee routing, custody, or claim payments can be enabled by environment
variables alone. Existing developer / wallet / holder flows are unchanged.

Two identity adapters exist: direct X OAuth2 and an opt-in Privy hosted X OAuth2
adapter. The hosted adapter has automated tests with mocked provider responses,
not a completed live X login. A Privy app is not configured in this workspace.
Do not market either identity setup as a verified live claim service yet.

## Minimal setup without an X developer account

1. The operator creates a Privy app. End users use their normal X accounts;
   they do not create developer accounts or provide API keys.
2. Enable Twitter/X OAuth2. Confirm with Privy that its shared/default credentials
   are supported for the intended production use, including limits and account
   recovery. Their docs recommend custom provider credentials before production.
3. Set the allowed domain to `https://app.slimewire.org` and exact allowed OAuth
   redirect to `https://app.slimewire.org/api/web/social-claims/callback`.
   Do not allow wildcard or arbitrary redirect destinations.
4. Set these on the web service, using secure configuration, not chat:

   ```text
   SLIME_SOCIAL_IDENTITY_PROVIDER=privy
   SLIME_PRIVY_APP_ID=<public app ID from Privy>
   SLIME_X_CALLBACK_URL=https://app.slimewire.org/api/web/social-claims/callback
   SLIME_X_SESSION_SECRET=<unique random secret, at least 32 characters>
   ```

   The adapter uses the broker's public login endpoints and server-held PKCE.
   It does not need a Privy app secret or X developer credentials. Disable
   automatic embedded-wallet creation in the provider dashboard; use X only for
   this dedicated identity app. We never create a wallet or sign via Privy.
5. Test from `/launch/claim`, including mobile Safari/Chrome and Telegram's
   in-app browser. If in-app authorization fails, explicitly offer opening the
   same canonical page in the system browser; never bypass verification.

Privy currently lists a free 0–499 MAU tier and $299/month for 500–2,499 MAU.
Recheck pricing and signup limits before enrolling real users. No account, paid
plan or provider consent was created by this implementation.

## Recipient lookup is a separate requirement

Hosted login proves who is claiming. It is not a directory of every X account.

With `SLIME_X_APP_BEARER_TOKEN`, the existing official username lookup pins the
numeric ID before launch. Confirm its billing/access separately.

Without that token, hosted mode uses only server-verified self-sign-ins less
than 15 minutes old. Unknown/stale handles fail closed with a sign-in instruction.
This is deliberately limited: **surprise allocations to arbitrary people who
have never signed in are not solved by this adapter**. A trusted ID resolver is
still required for that experience. User-pasted IDs, screenshots, scraped
cookies and imported provider users are not accepted as proof.

Re-sign-in after a rename removes the old cached handle. A new ID taking an
old handle cannot acquire that old ID's recorded entitlements. Recipient proof
expires no later than the underlying fresh verification; repeated launch review
does not extend it. Existing saved allocations remain keyed by numeric X ID,
not by display name, current username or Privy user ID.

## Security and operational boundaries

- Only the server begins the fixed `twitter` provider flow. The random state is
  browser-bound, single-use, ten-minute TTL, and stored hashed. PKCE verifier is
  encrypted in the private durable store. One-hour claim sessions use secure,
  HttpOnly, host-only cookies plus a separate CSRF token for mutations.
- Start is bounded to 60 requests/minute globally. No polling/background lookup
  or paid blockchain RPC was added. Provider failures never expose their body.
- Only the server's direct HTTPS broker exchange establishes identity. No
  frontend object or unverified decoded JWT is accepted. Require a complete
  authenticated session and exactly one freshly verified `twitter_oauth` account
  with a string numeric X subject. Missing/ambiguous/stale identities fail.
- Redirects are pinned to X/Twitter's HTTPS OAuth2 authorization route. Provider
  callbacks are distinguished from direct X callbacks and duplicate parameters
  are rejected. A provider change invalidates old claim sessions.
- Broker tokens, X access tokens, refresh tokens and PKCE plaintext are not
  persisted, logged, or returned to the browser. Fee custody and payouts remain
  in SlimeWire. Review proxy access-log handling of OAuth query strings before
  live auth testing; neither app nor edge logs should retain authorization codes.
- A live smoke test must verify numeric subject compatibility against the actual
  X account ID, fresh verification timestamps, cancellation/error behavior,
  multi-tab state replacement, no wallet provisioning and no stale linked-account
  bypass. Mock tests cannot establish these provider behaviors.
- Independent security review and a separately authorized, bounded funded test
  must validate allocation, wrong-user rejection, claims, duplicate submission,
  process restart, finalized receipts and vault liability coverage before the
  financial release hold is changed. Do not claim regulator/legal approval.

## Reclaim alternative: evaluated, not activated

Reclaim lists an X session-proof provider. It still requires a Reclaim app and
credentials. We have not substituted it for login or trusted the listing as a
security audit. Before an adapter can ship, validate that the exact provider
proves the authenticated **self** account (not an arbitrary viewed public
profile), binds a nonce/app/session and expiry, rejects replay, and works in
mobile Telegram. Review attestor assumptions, data retention, user disclosure,
production eligibility and cost. Do not add a nonfunctional Reclaim button.

## References / adapter contract

- [Privy default versus custom OAuth credentials](https://docs.privy.io/basics/get-started/dashboard/configure-login-methods)
- [Privy OAuth](https://docs.privy.io/authentication/user-authentication/login-methods/oauth)
- [Allowed OAuth redirects](https://docs.privy.io/recipes/react/allowed-oauth-redirects)
- [Privy pricing](https://www.privy.io/pricing)
- Published Privy npm contracts inspected: `@privy-io/js-sdk-core@0.77.0`
  (`OAuthApi`), `@privy-io/routes@0.4.2`, `@privy-io/api-types@0.23.0`.
  The small server adapter follows `/api/v1/oauth/init` and `authenticate` and
  adds no SDK/client bundle. Any provider contract changes require revalidation.
- [Reclaim X provider](https://dev.reclaimprotocol.org/provider/details/e94e776d-f040-431b-a834-8f5bed297ec3)
- [Reclaim setup](https://docs.reclaimprotocol.org/api-key)

Tests: `node --test tests/socialClaims*.test.js tests/socialFeeAllocation.test.js`.
