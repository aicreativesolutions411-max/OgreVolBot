# Creator-fee destinations

The homepage links to My launches / fee activity. External cash-provider routing remains disabled. Native X-recipient SOL claims have a gated draft UI and identity adapters, but no new fee allocation or payout is enabled. See [social claim identity setup and release blockers](social-claims-identity.md). Historical configurations are retained for recovery; existing permanent shares are not rewritten.

In **Launch → Custom fee split**, select whole percentages for:

- Developer wallet (minimum 1%). Choose **Keep my fees** for 100% developer and manual wallet-wide claims.
- This coin's holders.
- Another Solana coin's holders; enter that coin's contract address.
- Up to 10 Solana receiving wallets, each with a label and whole percentage; enter wallet addresses, **not token contracts**. Remove unused rows. Duplicate recipients are rejected.

Shares total 100%; an unused community destination can be 0%. New multi-wallet policies require their own v3 review. Old one-wallet and holder-only policies retain their exact schema, recipients and consent version. Pump retains a permanent developer/rewards-vault split; the encrypted per-coin vault allocates communities and receiving wallets according to the saved policy. The final review discloses this managed execution model. Every receiving wallet is checked before setup and any new payout batch containing a receiving wallet. Saved unknown transactions reconcile before any replacement.

Community eligibility remains strictly over $20 at complete finalized snapshots, weighted by token holdings. The named receiving wallet does not need holdings, signup or a claim. Its allocation follows the same 12-hour cycle. Incomplete required holder data delays that whole cycle. Small credits accumulate to 0.001 SOL; the vault retains 0.001 SOL and the developer pays bounded transaction fees. Pausing does not cancel earned credits.

The per-coin **Fee totals & receipts** view separates developer payments, own holders, partner holders and the receiving wallet. It shows percentages, full destination addresses, recorded payments, reserved rewards and transaction receipts. Overlapping holders receive the sum of their earned credits while source accounting stays separate. Uncertain transactions reconcile their saved signature before any replacement.

Developer amounts are verified from finalized, saved per-coin Pump distribution transactions and matched event/transfer totals. Vault funding is not counted again as a holder payment. Receipt-accounting retries never submit money. New receipt reads and recipient validation use public Solana RPC, not the paid trading RPC budget.

Limits: older wallet-wide creator claims cannot be attributed to individual coins. Historical holder batches without destination provenance remain unclassified. Neither is estimated. Missing historical transaction data is shown as a partial verified subtotal, not lifetime earnings. Public reports never expose signed transaction bytes, private vault data, account ownership IDs or full holder lists.

## Launch and earnings experience

The Launch entry flow has three primary choices: Keep my fees, Reward communities, and Custom split. Treasury-wallet sharing is under Advanced. The live preview shows draft identity and allocation; artwork, spending wallet, bundles and final cost review remain in the existing full launcher. No features of the wallet or terminal are removed.

Shareable templates and local saved templates contain only coin name/ticker/description and draft fee settings. A shared link may suggest receiving addresses but cannot carry a spending wallet, buy amount, authorization, signed transaction or operation ID. Full destination addresses remain editable and require a new server review and explicit consent. Invalid template payloads never replace saved launch drafts. Template links are public; recipients and labels should not contain private information.

Public coin cards show the allocation. Fee details include artwork, full destinations and finalized receipts. A shortcut can draft a new coin that rewards that community, without implying affiliation or approval.

**My earnings** at `/launch/earnings` combines up to 25 selected public wallets, or explicitly selected SlimeWire-managed wallets. It reads saved records only, with no polling or paid RPC. It separates recorded finalized payments, reserved rewards and wallet-wide claims (which must be checked in Wallet). It never counts vault funding a second time as recipient income. Per-wallet cumulative accounting survives the 100-receipt retention limit; older missing history stays a partial subtotal. Nothing is claimed automatically from this page.

Offline visual check: `node scripts/preview-fee-splits.js`, then open `http://127.0.0.1:4186/fees-preview`, `/launch` or `/launch/earnings`. This fixture server cannot launch, sign or transfer funds and never loads production secrets. Test-only sample earnings are clearly named and are not used in production.
