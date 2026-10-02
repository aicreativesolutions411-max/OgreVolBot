// Discovery only: never use this predicate to delete launches, filter ledgers,
// cancel payouts or hide a wallet owner's accounting history.
export function isTestLaunch(attempt={}) {
  const metadata=attempt.metadataJson||{};
  return [attempt.tokenName||attempt.name||metadata.name,attempt.symbol||attempt.ticker||metadata.symbol]
    .some(value=>/(?:^|[^\p{L}\p{N}])test(?:ing)?(?:[ _-]?\d+)?(?=$|[^\p{L}\p{N}])/iu.test(String(value||'').normalize('NFKC')));
}
