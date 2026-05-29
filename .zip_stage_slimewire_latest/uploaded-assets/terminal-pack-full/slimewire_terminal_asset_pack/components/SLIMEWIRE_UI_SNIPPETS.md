
# SlimeWire UI snippets for Codex

Use these as implementation guidance, not as a mandate to replace existing components.

## Shell layout idea

```tsx
<TerminalLayout>
  <TerminalTopBar
    activePreset={activePreset}
    wallet={wallet}
    balance={balance}
    onRefreshWallet={() => refreshWalletState({ force: true })}
  />
  <TerminalSidebar />
  <main className="live-terminal-grid">
    <LivePairsPanel />
    <LiveTradesFeed />
    <KOLSignalsPanel />
    <TokenPreviewDrawer />
    <PositionsTabs />
  </main>
  <TradingPanel />
</TerminalLayout>
```

## Button classes

```tsx
<button className="sw-button-primary sw-focus-ring">Buy Preset</button>
<button className="sw-button-secondary sw-focus-ring">Edit Preset</button>
```

## Asset import examples

```tsx
<img src="/assets/slimewire/slimewire-mark.svg" alt="SlimeWire" />
<img src="/assets/slimewire/icons/refresh.svg" alt="" aria-hidden="true" />
```

## Important asset usage rules

- Use slime borders as accents, not around every single card.
- Use horror/slime display styling only for hero headers and main CTA labels.
- Body text, tables, balances, PnL, and risk data must use clean readable sans-serif.
- Keep live trades visible while drawers/panels are open.
- Do not use glow on every row. Reserve glow for active state, live state, and primary CTAs.
