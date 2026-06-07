window.OGRE_PORTAL_CONFIG = {
  "apiBase": "https://ogrevolbot.onrender.com",
  "telegramBotUsername": "OgreTradeBot",
  "portalUrl": "https://www.slimewire.org",
  "featureFlags": {
    "slimeShieldEnabled": true,
    "kolDumpDetectorEnabled": true,
    "replayBeforeBuyEnabled": true,
    "protectedBuyEnabled": true,
    "tokenAvatarFixEnabled": true,
    "devInfoEnabled": true,
    "postgresHydrationEnabled": true,
    "chatAiEnabled": true,
    "chatAiProviderEnabled": true,
    "siteSmoothnessFixesEnabled": true,
    "disableUnfinishedButtons": true,
    "debugPerformanceCounters": false
  },
  "ogreTek": {
    "enabled": false,
    "demoMode": true,
    "provider": "mock",
    "maxLeverage": 5,
    "maxPositionSize": 10000,
    "dailyLossLimit": 500,
    "allowedMarkets": [
      "SOL-PERP",
      "BTC-PERP",
      "ETH-PERP"
    ],
    "emergencyDisabled": false,
    "staleMarketMs": 60000,
    "staleAccountMs": 60000
  },
  "pumpLive": {
    "enabled": false,
    "provider": "",
    "ingestUrl": "",
    "playbackBaseUrl": "",
    "docsUrl": "",
    "chatEnabled": true
  }
};
