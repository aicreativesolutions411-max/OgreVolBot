# Creator-fee destinations

The homepage links to My launches / fee activity instead of X claims. No new X or external-provider payout route is offered. Historical configurations are retained for recovery; existing permanent shares are not rewritten.

In **Launch → Custom fee split**, select whole percentages for:

- Developer wallet (minimum 1%). Choose **Keep my fees** for 100% developer and manual wallet-wide claims.
- This coin's holders.
- Another Solana coin's holders; enter that coin's contract address.
- One pasted Solana receiving wallet; enter a wallet address, **not a token contract**.

Shares total 100%; an unused non-developer destination can be 0%. New four-way policies require their own versioned review. Pump retains a permanent developer/rewards-vault split; the encrypted per-coin vault allocates the three other destinations according to the saved policy. The final review discloses this managed execution model.

Community eligibility remains strictly over $20 at complete finalized snapshots, weighted by token holdings. The named receiving wallet does not need holdings, signup or a claim. Its allocation follows the same 12-hour cycle. Incomplete required holder data delays that whole cycle. Small credits accumulate to 0.001 SOL; the vault retains 0.001 SOL and the developer pays bounded transaction fees. Pausing does not cancel earned credits.

The per-coin **Fee totals & receipts** view separates developer payments, own holders, partner holders and the receiving wallet. It shows percentages, full destination addresses, recorded payments, reserved rewards and transaction receipts. Overlapping holders receive the sum of their earned credits while source accounting stays separate. Uncertain transactions reconcile their saved signature before any replacement.

Developer amounts are verified from finalized, saved per-coin Pump distribution transactions and matched event/transfer totals. Vault funding is not counted again as a holder payment. Receipt-accounting retries never submit money. New receipt reads and recipient validation use public Solana RPC, not the paid trading RPC budget.

Limits: older wallet-wide creator claims cannot be attributed to individual coins. Historical holder batches without destination provenance remain unclassified. Neither is estimated. Missing historical transaction data is shown as a partial verified subtotal, not lifetime earnings. Public reports never expose signed transaction bytes, private vault data, account ownership IDs or full holder lists.

Offline visual check: `node scripts/preview-fee-splits.js`, then open `http://127.0.0.1:4186/fees-preview`. This fixture server cannot launch, sign or transfer funds and never loads production secrets.
