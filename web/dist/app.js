import{canSubmitPerpOrder as qp,createPerpsProvider as Hp,ogreTekRouteStatus as Kp,resolveOgreTekConfig as Vp,shouldShowOgreTekNav as zp,validatePerpOrder as jp}from"./perps.js";import{smartChartSuggestion as Gp,tradeActionLabelFromPreset as Xp}from"./liveTerminalUi.js";const $a=window.OGRE_PORTAL_CONFIG||{},Jp=$a.featureFlags||{};function N(e,t=!0){const n=Jp?.[e];return n==null||n===""?!!t:typeof n=="boolean"?n:["1","true","yes","on"].includes(String(n).toLowerCase())}const jt=$a.pumpLive||{},Se=Vp($a),Yp=!1,cr=Hp(Se),Qp=String($a.apiBase||"").trim().replace(/\/+$/,""),Zp=window.location.origin.replace(/\/+$/,""),hi="https://ogrevolbot.onrender.com",Pt=String($a.shareUrl||$a.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",gi=[Qp,window.location.hostname.endsWith("onrender.com")?Zp:"",hi].filter(Boolean);let ur=gi[0]||hi;const un=6e4,ts=15e3,Gt=1e4,as=8e3,dn=8e3,bi=new Map,em=new Map,pt=em,Xt=new Set,dr=new Map,LS=new Map,pn={},Z=18e4,ns="slimewireMobileWalletPending",rs="slimewireMobileWalletPendingBackup",tm="slimewireMobileWalletSession:",yi="slimewirePerfLog",vi="slimewireCrashLog",am="slimewireTerminalFeedLog",wi="slimewireOgreAiRecentMints",Si="slimewireOgreAiFormPreset",nm=150,rm=1500,om=1e4,sm=140,ki="live-pairs-inflight",lm=[1200,4500,1e4],im=15e3,$i=650,cm=3500,um=12e3,dm=3e4,pm=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Ti="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",mm=new Map([...Ti].map((e,t)=>[e,t]));function fm(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function mn(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function os(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function Pi(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function Ai(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function ss(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function hm(){try{const e=JSON.parse(window.localStorage?.getItem(yi)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function gm(){try{const e=JSON.parse(window.localStorage?.getItem(vi)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function Ci(){try{const e=JSON.parse(window.sessionStorage?.getItem(wi)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function bm(e){const t=[...Array.isArray(e?.plans)?e.plans.map(o=>o?.tokenMint||o?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(o=>o?.tokenMint):[]].map(o=>String(o||"").trim()).filter(Boolean);if(!t.length)return;const n=new Set,r=[...Ci(),...t].filter(o=>n.has(o)?!1:(n.add(o),!0)).slice(-30);try{window.sessionStorage?.setItem(wi,JSON.stringify(r))}catch{}}function Li(){try{const e=JSON.parse(window.sessionStorage?.getItem(Si)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function ym(e={}){try{window.sessionStorage?.setItem(Si,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function xi(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),n=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(n||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function vm(){try{return JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{return{}}}function pr(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function wm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function Sm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function km(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const Mi="slimewireIntroCompleteV1";function Bi(){try{return window.sessionStorage?.getItem(Mi)==="true"}catch{return!1}}function $m(){try{window.sessionStorage?.setItem(Mi,"true")}catch{}}function fn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const a={token:fm(),user:null,route:Ea(window.location.pathname),activeTab:window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:hm(),crashLog:gm(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:vm(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:wm(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:Pi(),loginCollapsed:!0};let Ta=null,mr="";const ls=new Set;let Pa=null,fr="",Aa=null,hr="",Jt=null,Ca=null,Ze=0,La=null,gr="",xa=null,br="",yr=null,At=[],vr=null,wr=null,Sr=!1,hn=[],is=null,Yt=null,Qt=null,gn=null,cs="",Ri=0,Tm=0,us=0,kr=null;const $r=new Map,ds={},Zt=new Map,Ma=[];let ps=null,ms=null,fs=null,hs=null,gs=null,bs=0,ys=new Set,vs=null,ea=null,Tr=null,ws=null,Ii=Date.now();function Ba(){return!!(a.slimeShieldDetails?.open||a.devInfoDetails?.open||a.kolDumpDetails?.open||a.replayDetails?.open)}function Ra(){Ta&&clearTimeout(Ta),Ta=null,mr=""}function Pr(){Ba()||(ia(),Ia("details-close"))}function Pm(e,t){const n=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const i=n(c);i&&!r.has(i)&&r.set(i,c)}let o=e.querySelector(":scope > .signal-header")||null;const s=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const i=n(c);let u=i?r.get(i):null;u?(s.add(i),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,o?o.nextElementSibling!==u&&o.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),o=u}for(const[c,i]of r)s.has(c)||i.remove()}function Am(e,t){const n=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!n?e.insertBefore(r,e.firstChild):n&&!r?n.remove():n&&r&&n.innerHTML!==r.innerHTML&&(n.innerHTML=r.innerHTML);for(const o of["[data-cooks-best]","[data-cooks-newest]"]){const s=e.querySelector(`:scope > ${o}`),c=t.querySelector(`:scope > ${o}`);if(!c){s&&s.remove();continue}if(!s)return!1;const i=s.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");i&&u&&i.innerHTML!==u.innerHTML&&(i.innerHTML=u.innerHTML);const d=s.querySelector(":scope > .signal-list"),m=c.querySelector(":scope > .signal-list");d&&m?Pm(d,m):d!==m&&s.replaceWith(c)}return!0}function Cm(){if(a.activeTab!=="live"&&a.activeTab!=="terminal")return!1;const e=p("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const n=We(),r=ge(n?.rows||[]),o=an(r);if(!o.length)return!1;const s=Nn(),c=[];if(s){const m=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<m){const b=f.getAttribute("data-token-chart")||"";if(b&&c.push({mint:b,top:y}),c.length>=6)break}}}const i=document.createElement("div");i.innerHTML=Yl(o);const u=i.querySelector(".cooks-feed");if((!u||!Am(t,u))&&(t.outerHTML=Yl(o)),s&&c.length){const m=e.querySelector(".cooks-feed");for(const f of c){const y=m?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const b=y.getBoundingClientRect().top-f.top;Number.isFinite(b)&&Math.abs(b)>1&&window.scrollBy(0,b);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const m=Lt.find(([f])=>f===a.livePairBucket)?.[1]||"Live";d.textContent=`${m} | ${o.length} live`}return!0}function Ia(e="live-pairs-batch"){if(e&&ys.add(String(e)),gs||bs)return;const t=()=>{const n=Array.from(ys);if(gs=null,ys=new Set,bs=0,a.route!=="terminal"||!["terminal","live","slimeScope"].includes(a.activeTab)||Ba()||(E({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(We()?.rows)?We().rows.length:0,details:n.length?n.slice(-3).join(" | "):e}),(a.activeTab==="live"||a.activeTab==="terminal")&&Cm()))return;const r=Qs();h(),Zs(r)};gs=window.setTimeout(()=>{bs=window.requestAnimationFrame(t)},sm)}const p=e=>document.querySelector(e);function j(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const v=(e,t)=>{e&&(e.textContent=t)},Me=(e,t)=>{v(p(e),t)},Ct=(e,t)=>{const n=p(e);n&&(n.hidden=t)},oe=p("[data-app]"),bn=p("[data-login]"),Oi=p("[data-connect]"),Ss=p("[data-top-login]"),Te=p("[data-login-modal]"),Ei=p("[data-auth-actions]"),Fi=p("[data-guest-actions]"),Wi=p("[data-session-actions]"),ee=p("[data-dashboard]"),Lm=p("[data-error]"),xm=p("[data-dashboard-error]");function te(e){if(!N("debugPerformanceCounters",!1))return;const t=String(e||"counter");pn[t]=Number(pn[t]||0)+1,(pn[t]<=5||pn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,pn[t])}const Lt=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],Mm=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],ks=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],Oa=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],Bm=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],Rm=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],Im=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],Om=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],Em=Object.fromEntries(Om.map(e=>[e.tabKey,e])),Fm=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function Ni(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function Di(e,t=""){const n=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return Ni(n)===Ni(t)}function Wm(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!Di(e,t))return t;const n=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return n.includes("phantom")?Na("phantom"):n.includes("solflare")?Na("solflare"):n.includes("wallet")||n.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":n.includes("powered-by")||n.includes("wordmark")||n.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":Zl(e?.alt||n||"slimewire")}function _i(e,t="",n="fallback"){try{console.info("[slimewire_image_fallback]",{action:n,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function Nm(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const n=Wm(t);if(!n||Di(t,n)){t.hidden=!0,_i(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=n,_i(t,n,"fallback")}function $s(){$s.installed||($s.installed=!0,document.addEventListener("error",Nm,!0))}function Ts(){if(!Ts.started){Ts.started=!0;for(const e of Fm)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function Ea(e=window.location.pathname){return(e==="/"||e==="")&&Bi()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function Dm(){if(Bi()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let yn=null;function Ps(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(yn||(yn=new e),yn.state==="suspended"&&yn.resume().catch(()=>{}),yn):null}catch{return null}}function _m(){const e=Ps();if(!(!e||e.state!=="running"))try{const t=e.currentTime,n=1.7,r=Math.floor(e.sampleRate*n),o=e.createBuffer(1,r,e.sampleRate),s=o.getChannelData(0);for(let f=0;f<r;f+=1)s[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=o;const i=e.createBiquadFilter();i.type="bandpass",i.Q.value=.7,i.frequency.setValueAtTime(280,t),i.frequency.exponentialRampToValueAtTime(3400,t+.55),i.frequency.exponentialRampToValueAtTime(170,t+n);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+n),c.connect(i).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const m=e.createGain();m.gain.setValueAtTime(1e-4,t),m.gain.exponentialRampToValueAtTime(.38,t+.08),m.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(m).connect(e.destination),c.start(t),c.stop(t+n),d.start(t),d.stop(t+1.2)}catch{}}function Um(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),n=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let o=!1,s=null;const c=()=>a.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),i=T=>{t&&(t.dataset.introPhase=T)},u=T=>{r&&(r.textContent=T,r.hidden=!T)},d=()=>{o||(o=!0,s&&(clearTimeout(s),s=null),i("portal"),_m(),$m(),setTimeout(()=>{fn({reset:!0}),ke("/connect")},620))};if(!c()){fn({reset:!0});return}const m=()=>{o||(Ps(),n&&n.muted&&(n.muted=!1,n.volume=1,n.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(T=>{document.addEventListener(T,m,{once:!0,passive:!0})}),n&&(n.preload="auto",n.playsInline=!0,n.autoplay=!0,n.setAttribute("autoplay",""),n.setAttribute("playsinline",""),n.disablePictureInPicture=!0,!n.getAttribute("src")&&n.dataset.introSrc&&(n.src=n.dataset.introSrc));const f=T=>{s&&clearTimeout(s),s=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,T)))},y=()=>{if(o||!c())return;const T=g=>{if(!n)return;n.muted=g,n.volume=g?0:1;const A=n.play?.();A?.catch&&A.catch(()=>{g?u(""):T(!0)})};Ps(),T(!1)};n?.addEventListener("loadedmetadata",()=>{const T=Number(n.duration);f(Number.isFinite(T)&&T>0?(T+2.5)*1e3:9e3)}),n?.addEventListener("ended",d),n?.addEventListener("error",()=>{f(1500)});let b=!1,S=null;const P=()=>{b||o||!c()||(b=!0,y())};n?(n.readyState>=4?P():(n.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),n.addEventListener("waiting",()=>{!b||o||(S&&clearTimeout(S),S=setTimeout(()=>{c()&&d()},900))}),["playing","timeupdate"].forEach(T=>n.addEventListener(T,()=>{S&&(clearTimeout(S),S=null)}))):P(),f(11e3)}function Ui(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function As({keepLogin:e=!1}={}){a.walletConnectMenuOpen=!1,e||(a.loginModalOpen=!1),a.quickBuyModal?.open&&(a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""}),On()}function ke(e,t=null){const n=C(),r=e||"/terminal";a.route=Ea(r),As({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.route==="terminal"&&(a.activeTab=t||Ui(r)),a.route!=="intro"&&fn({reset:!0}),window.history.pushState({},"",r),Pl(),h(),q("route-change",n,{component:"router",details:r})}window.addEventListener("popstate",()=>{a.route=Ea(),As({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.activeTab=Ui(),a.route!=="intro"&&fn({reset:!0}),Pl(),h()});let qi=!1;function Cs(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Ar(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),Cs()}function qm(e){if(!e)return;const t=!e.open;if(Ar(e),e.open=t,t){const n=e.closest("[data-market-ticker]"),o=e.querySelector("summary")?.getBoundingClientRect?.();if(n&&o){const s=Math.max(10,Math.min(window.innerWidth-10,o.left+o.width/2)),c=Math.max(30,o.bottom+4);n.style.setProperty("--ticker-menu-left",`${Math.round(s)}px`),n.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}Cs()}function Hm(){qi||(qi=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Ar();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Ar(),80);return}const n=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");n&&(e.preventDefault(),e.stopPropagation(),qm(n.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&Cs()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Ar()}))}function ta(e){return`${ur}${e}`}function C(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function aa(e){try{window.performance?.mark?.(e)}catch{}}function be(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function Hi(e={}){Ma.push(e),Ma.length>10&&Ma.splice(0,Ma.length-10),!ps&&(ps=window.setTimeout(()=>{ps=null;const t=Ma.splice(0,Ma.length);for(const n of t)try{const r=JSON.stringify(n);if(navigator.sendBeacon){const o=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(ta("/api/web/perf-event"),o))continue}fetch(ta("/api/web/perf-event"),{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function Ls(e,t,n){if(n==="perf"&&ms||n==="crash"&&fs||n==="feed"&&hs)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},o=window.setTimeout(()=>{n==="perf"&&(ms=null),n==="crash"&&(fs=null),n==="feed"&&(hs=null),r()},rm);n==="perf"&&(ms=o),n==="crash"&&(fs=o),n==="feed"&&(hs=o)}function E(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&te("slowApiRequestWarning");const n={at:new Date().toISOString(),route:be(e.route||a.route||Ea(),40),component:be(e.component||"",60),action:be(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:be(e.requestId||"",80),errorCode:be(e.errorCode||"",60),details:be(e.details||"",140)};return a.perfLog=[...a.perfLog||[],n].slice(-100),Ls(yi,()=>a.perfLog,"perf"),(n.durationMs>=nm||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(n.action))&&Hi(n),n}function q(e,t,n={}){E({...n,action:e,durationMs:C()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",n=""){aa("chartFirstPaint"),E({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!Xe(n)?.cacheHit,stale:!!Xe(n)?.stale,details:`${be(t,20)}:${be(n,60)}`})};function xs(e={}){const t={at:new Date().toISOString(),route:be(e.route||a.route||Ea(),40),actionBeforeCrash:be(e.actionBeforeCrash||a.postTradeRefresh?.action||"",70),errorCode:be(e.errorCode||e.name||"FRONTEND_ERROR",60),message:be(e.message||"",160),component:be(e.component||"",80),requestId:be(e.requestId||a.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return a.crashLog=[...a.crashLog||[],t].slice(-50),Ls(vi,()=>a.crashLog,"crash"),Hi({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Km(){a.crashInstrumentationInstalled||(a.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||xs({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};xs({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function mt(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function Ms(e="",t="",n=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(n||"").trim()}`}function et(e="",t="",n=""){const r=Ms(e,t,n),o=a.tradeActionLocks?.[r];return o&&["clicked","submitting","submitted","confirming"].includes(o.state)?o:null}function K(e="",t="",n="",r={}){const o=Ms(e,t,n),s=a.tradeActionLocks?.[o]||{};a.tradeActionLocks={...a.tradeActionLocks||{},[o]:{...s,action:e,tokenMint:t,detail:n,updatedAt:new Date().toISOString(),...r}},se()}function Pe(e="",t="",n="",r=2400){const o=Ms(e,t,n);window.setTimeout(()=>{const s=a.tradeActionLocks?.[o];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const c={...a.tradeActionLocks||{}};delete c[o],a.tradeActionLocks=c,se(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},r)}function Cr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function Bs(e="",t=""){const n=a.manualSellActions?.[Cr(e,t)];return n&&["clicked","submitting","submitted","confirming"].includes(n.state)?n:Object.entries(a.manualSellActions||{}).find(([r,o])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(o?.state))?.[1]||null}function na(e,t,n={}){const r=Cr(e,t),o=a.manualSellActions?.[r]||{};a.manualSellActions={...a.manualSellActions||{},[r]:{...o,tokenMint:e,percent:String(t||o.percent||"100"),updatedAt:new Date().toISOString(),...n}},se()}function Rs(e,t,n=2400){const r=Cr(e,t);window.setTimeout(()=>{const o=a.manualSellActions?.[r];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const s={...a.manualSellActions||{}};delete s[r],a.manualSellActions=s,se(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},n)}function Fa(e,t={}){const n=C(),r=t.startedAt||a.positionRefreshAction?.startedAt||n;a.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(a.positionRefreshAction?.minUntil||0,n+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},se()}function qe(e,t={}){const n=a.positionRefreshAction?.minUntil||0,r=Math.max(0,n-C());vr&&window.clearTimeout(vr),vr=window.setTimeout(()=>{vr=null,Fa(e,t),h(),e==="success"&&window.setTimeout(()=>{a.positionRefreshAction?.state==="success"&&(a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},se(),h())},900)},r)}function xt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function se(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(s=>{const c=s.dataset.positionSell||"",i=s.dataset.positionSellPercent||"",u=Bs(c,i),d=xt(s),m=a.manualSellActions?.[Cr(c,i)],f=!!u;s.disabled=f,s.dataset.actionState=m?.state||u?.state||"idle",f?m?.state==="submitted"||m?.state==="confirming"?s.textContent="Submitted":s.textContent="Selling...":s.textContent=d});const e=String(a.tradeToken||p("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(s=>{const c=s.dataset.tradeBuyQuick||(s.matches("[data-trade-buy-max]")?"max":"custom"),i=et("trade-buy",e,c),u=xt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(s=>{const c=s.dataset.quickTradeToken||"",i=ot(),u=Ue(i)||i?.amountSol||"quick",d=et("trade-buy",c,String(u)),m=xt(s);s.disabled=!!d,s.dataset.actionState=d?.state||"idle",s.textContent=d?d.state==="submitted"?"Submitted":"Buying...":m}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(s=>{const c=s.dataset.tradeSellQuick||"custom",i=et("trade-sell",e,c),u=xt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(s=>{const c=s.dataset.chartConfirmBuy||a.smartChartToken||"",i=G(p("[data-chart-buy-amount]")?.value||"")||"custom",u=et("trade-buy",c,String(i)),d=xt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(s=>{const c=s.dataset.chartConfirmSell||a.smartChartToken||"",i=p("[data-chart-sell-percent]")?.value||"100",u=Bs(c,i),d=xt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(a.bundleToken||p("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(s=>{const c=s.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",i=et(c,t,"bundle"),u=xt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const n=(s,c)=>{const i=xt(s),u=s.matches?.("[data-top-refresh-wallet]");if(s.dataset.actionState=c,s.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){s.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",s.textContent=i||"Refresh";return}c==="clicked"||c==="refreshing"?s.textContent="Refreshing...":c==="success"?s.textContent="Updated":c==="error"?s.textContent="Failed":s.textContent=i},r=a.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(s=>{n(s,r)});const o=a.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(s=>{n(s,o)})}function Vm(){if(!a.perfInstrumentationInstalled){a.perfInstrumentationInstalled=!0,aa("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries())Number(n.duration||0)<50||E({component:"main-thread",action:"long-task",durationMs:n.duration,details:n.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries()){const r=Number(n.duration||0);r<80||E({component:"input",action:"interaction-delay",durationMs:r,details:n.name||n.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Be(e){return new Promise(t=>setTimeout(t,e))}function W(e="",t={}){const n=String(e||"");return t.preserveSafeError?n:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(n)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":n}async function vn(e,t={},n=un){const r=new AbortController,o=setTimeout(()=>r.abort(),n);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(o)}}async function Ki(e){try{await vn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:n=un,preserveSafeError:r=!1,dedupe:o=!0,...s}=t||{},c=String(s.method||"GET").toUpperCase(),i=C(),u=o&&c==="GET"?`${c}:${e}:${a.token?a.token.slice(0,12):"guest"}`:"";if(u&&Zt.has(u))return te("duplicateApiRequestsPrevented"),E({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),Zt.get(u);const d=(async()=>{const m={"Content-Type":"application/json",...s.headers||{}};a.token&&(m.Authorization=`Bearer ${a.token}`);let f,y=null;try{f=await vn(ta(e),{...s,headers:m,cache:"no-store"},n)}catch(S){y=S,await Ki(ur),await Be(900);try{f=await vn(ta(e),{...s,headers:m,cache:"no-store"},n)}catch(P){y=P;for(const T of gi)if(T!==ur)try{await Ki(T),f=await vn(`${T}${e}`,{...s,headers:m,cache:"no-store"},n),ur=T;break}catch(g){y=g}if(!f){const T=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${T} SlimeWire could not connect right now. Try again in a moment.`)}}}const b=await Vi(f);if(!f.ok||b.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(b.launchAttemptId||b.launch?.launchAttemptId),P=W(b.message||b.launch?.failureReason||b.error||`HTTP ${f.status}`,{preserveSafeError:S}),T=new Error(P);throw T.status=f.status,T.data=b,T.code=b.errorCode||b.launch?.errorCode||b.error||"",T.stage=b.stage||b.launch?.stage||"",T.launchAttemptId=b.launchAttemptId||b.launch?.launchAttemptId||"",T.providerStatus=b.providerStatus||b.launch?.providerStatus||null,f.status===401&&sf(P),T}return q("api-request",i,{component:"api",details:e,resultCount:Array.isArray(b?.rows)?b.rows.length:0}),b})();return u&&(Zt.set(u,d),d.then(()=>{Zt.get(u)===d&&Zt.delete(u)},()=>{Zt.get(u)===d&&Zt.delete(u)})),d}async function Vi(e){const t=e.headers.get("content-type")||"",n=await e.text();if(!n.trim())return{};try{return JSON.parse(n)}catch{const r=n.toLowerCase(),o=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:o?"payload_too_large":"invalid_api_response",message:o?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function zm(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function de(e){e&&(a.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(a.xHandle=Ge(e.xHandle),a.xHandle?Ai(a.xHandle):ss()):a.xHandle||(a.xHandle=Pi()))}function Lr(e){for(const t of e){const n=Sn(t);if(n&&!n.closest("[hidden]"))return String(n.value||"")}for(const t of e){const n=p(t);if(n)return String(n.value||"")}return""}function wn(){const e=p("[data-connect-status]");return e&&!e.closest("[hidden]")?e:Sn("[data-login-status]")||e}function Sn(e){const t=[...document.querySelectorAll(e)];return t.find(n=>!n.closest("[hidden]")&&n.offsetParent!==null)||t.find(n=>!n.closest("[hidden]"))||t[0]||null}function kn(){return Sn("[data-wallet-connect-modal] [data-wallet-connect-status]")||Sn("[data-wallet-connect-status]")}function ae(e=""){a.walletConnectStatus=String(e||""),v(kn(),a.walletConnectStatus)}function zi(e="solana"){const t=Oe(e);return He()?Tn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:Zi(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Mt(e="solana",t=null,n={}){const r=pe(e),o={walletName:Oe(e,r),userId:a.user?.id||"",route:a.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...n};try{console.warn("[slimewire_wallet_connect]",o)}catch{}}function ji(e=a.route==="connect"){window.setTimeout(()=>{const t=a.loginModalOpen?`[data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";Sn(t)?.focus?.()},0)}function jm(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(is=e)}function Gm(){const e=is;is=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function Gi({restoreFocus:e=!0}={}){const t=!!a.loginModalOpen;a.loginCollapsed=!0,a.loginModalOpen=!1,h({force:!0}),t&&e&&Gm()}function Xm(){return!Te||Te.hidden||!a.loginModalOpen?[]:[...Te.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function Jm(e){if(!a.loginModalOpen||e.key!=="Tab"||!Te||Te.hidden)return!1;const t=Xm();if(!t.length)return!1;const n=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===n?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),n.focus({preventScroll:!0}),!0):!1}function Wa(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Ym(e=Wa()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function Xi(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Qm(e="unknown"){const t=Date.now();if(t-Number(a.lastLockInClickAt||0)<300)return;a.lastLockInClickAt=t;const n={route:Xi(a.route||Ea(),40),viewport:Math.round(window.innerWidth||0),source:Xi(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(n),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",n)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(n)}).catch(()=>{})}catch{}}function Ji({defaultTab:e="login",returnTo:t=Wa(),source:n="unknown",connectPanel:r=a.route==="connect"}={}){if(jm(),Qm(n),a.loginModalOpen=!0,a.loginModalTab=e==="create"?"create":"login",a.loginReturnTo=t||Wa(),a.loginCollapsed=!1,a.walletConnectMenuOpen=!1,!Te&&!Ss){window.location.assign(Ym(a.loginReturnTo));return}h({force:!0}),ji(r)}function Yi(e={}){Ji(e)}function He(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function Qi(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Zm(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function Zi(e=""){if(!He())return"";const t=encodeURIComponent(Qi()),n=encodeURIComponent(Zm());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${n}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${n}`:""}function Is(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Na(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function Os(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let n=0n;for(const o of t)n=(n<<8n)+BigInt(o);let r="";for(;n>0n;){const o=Number(n%58n);r=Ti[o]+r,n/=58n}for(const o of t){if(o!==0)break;r="1"+r}return r||"1"}function xr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let n=0n;for(const o of t){const s=mm.get(o);if(s===void 0)throw new Error("Invalid wallet callback encoding.");n=n*58n+BigInt(s)}const r=[];for(;n>0n;)r.unshift(Number(n&255n)),n>>=8n;for(const o of t){if(o!=="1")break;r.unshift(0)}return new Uint8Array(r)}function ef(e="phantom",t="",n=a.walletConnectReturnPath||"/terminal",r=""){const o=new URL(n||window.location.pathname||"/terminal",window.location.origin);return o.searchParams.delete("sw_wallet"),o.searchParams.delete("sw_wallet_state"),o.searchParams.delete("sw_wallet_pending"),o.searchParams.delete("phantom_encryption_public_key"),o.searchParams.delete("solflare_encryption_public_key"),o.searchParams.delete("nonce"),o.searchParams.delete("data"),o.searchParams.delete("errorCode"),o.searchParams.delete("errorMessage"),o.searchParams.set("sw_wallet",e),o.searchParams.set("sw_wallet_state",t),r&&o.searchParams.set("sw_wallet_pending",r),o.toString()}function $n(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function ec(){try{const e=window.sessionStorage?.getItem(ns)||window.localStorage?.getItem(rs)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function tf(e){try{window.sessionStorage?.setItem(ns,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(rs,JSON.stringify(e))}catch{}}function Es(){try{window.sessionStorage?.removeItem(ns)}catch{}try{window.localStorage?.removeItem(rs)}catch{}}function tc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function Tn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function af(e="",t={}){const n=Tn(e);if(!n)return"";const r=new URL(n);return r.searchParams.set("app_url",Qi()),r.searchParams.set("redirect_link",ef(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function ra(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":He()?"mobile":"desktop"}function ac(e=""){return He()&&!!Tn(e)}function nf(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function rf(e="",t="/terminal"){try{const n=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:un,body:JSON.stringify({provider:e,intendedRoute:t,platform:ra(),browser:nf()})});return!n.pendingConnectId||!n.stateId||!n.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:n.pendingConnectId,stateId:n.stateId,returnPath:n.intendedRoute||t,dappEncryptionPublicKey:n.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:n.expiresAt||"",serverManaged:!0}}catch(n){return Mt(e,n,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:ra()}),null}}function of(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const n=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:Os(r),returnPath:t,dappEncryptionPublicKey:Os(n.publicKey),dappEncryptionSecretKey:Os(n.secretKey),createdAt:Date.now(),serverManaged:!1}}async function nc(e="",{returnPath:t=a.walletConnectReturnPath||"/terminal"}={}){if(!ac(e))return!1;const n=await rf(e,t)||of(e,t);if(!n)return!1;tf(n);const r=af(e,n);if(!r)return!1;const o=Oe(e);return ae(`Opening ${o} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Mt(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:ra()}),window.location.assign(r),!0}function rc(e=""){const t=Oe(e),n=Zi(e);return n?(ae(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Mt(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:ra()}),window.location.href=n,!0):!1}function oc({requirePassword:e=!1}={}){const t=Lr(["[data-connect-login-username]","[data-login-username]"]).trim(),n=Lr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!n&&!e)return{};if(!t)throw new Error("Enter your username.");if(!n)throw new Error("Enter your password.");return{username:t,password:n}}function sf(e=""){a.token="",a.user=null,a.loading=!1,os(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function X(e=null,t="Creating secure web profile..."){if(a.user&&a.token)return a.user;v(e,t);const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:xi()})});return a.token=n.token,de(n.user),mn(a.token),a.user}function $(e=""){[Lm,xm].forEach(t=>{t&&(t.hidden=!e,v(t,e))})}function J(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function lf(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function sc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function Fs(){$("");const e=wn();try{const t=oc();v(e,t.username?"Creating saved login...":"Creating account...");const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:xi()})});a.token=n.token,de(n.user),mn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,t.username?"Account created. Login saved.":"Quick web account created."),H(n.trade?.signature,"account-create")}catch(t){v(e,t.message),$(t.message)}}async function lc(){$("");const e=wn();try{const t=oc({requirePassword:!0});v(e,"Logging in...");const n=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});a.token=n.token,de(n.user),mn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,"Logged in."),H(n.trade?.signature,"password-login")}catch(t){v(e,t.message),$(t.message)}}function ic(){return Lr(["[data-connect-login-email]","[data-login-email]"]).trim()}function cf(){return Lr(["[data-connect-login-code]","[data-login-code]"]).trim()}function cc(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function uf(){$("");const e=wn();try{const t=cc(ic());v(e,"Sending login code...");const n=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});v(e,n.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){v(e,t.message),$(t.message)}}async function df(){$("");const e=wn();try{const t=cc(ic()),n=cf();if(!n)throw new Error("Enter the login code from your email.");v(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:n})});a.token=r.token,de(r.user),mn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,"Logged in."),H(r.trade?.signature,"email-code-login")}catch(t){v(e,t.message),$(t.message)}}function uc(e="",t=new URLSearchParams){const n=ec(),r=t.get("sw_wallet_state")||"";if(!n.stateId||n.stateId!==r||n.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(n.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const o=t.get(tc(e))||"",s=t.get("nonce")||"",c=t.get("data")||"";if(!o||!s||!c)throw new Error("Wallet approval did not return the expected connection data.");const i=window.nacl;if(!i?.box?.before||!i.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=i.box.before(xr(o),xr(n.dappEncryptionSecretKey)),d=i.box.open.after(xr(c),xr(s),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const m=JSON.parse(new TextDecoder().decode(d)),f=String(m.public_key||m.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(m.session||""),walletEncryptionPublicKey:o,dappEncryptionPublicKey:n.dappEncryptionPublicKey,returnPath:n.returnPath||"/terminal"}}async function dc(e="",t={}){const n=kn();await X(n,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Oe(e)})});de(r.user||{...a.user,connectedWallet:r.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:Oe(e),tokens:[]};try{window.sessionStorage?.setItem(`${tm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Es(),$n(),a.walletConnectMenuOpen=!1,ae(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),ke(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Br("mobile-wallet-connect")}function pf(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||ec().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(n=>n!=="data"&&n!=="nonce"),walletEncryptionPublicKey:t.get(tc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function mf(e="",t={}){t.token&&(a.token=t.token,mn(a.token)),de(t.user||{...a.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const n=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";n&&(a.connectedWalletBalance={publicKey:n,shortPublicKey:w(n),provider:t.provider||Oe(e),tokens:[]}),Es(),$n(),a.walletConnectMenuOpen=!1,ae(n?`Connected ${w(n)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),ke(t.finalRedirectRoute||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Br("mobile-wallet-callback")}async function pc(e="",t=new URLSearchParams){const n=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:un,body:JSON.stringify(pf(e,t))});return await mf(e,n),!0}async function ff(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;a.walletConnectMenuOpen=!0;const n=Oe(t),r=e.get("sw_wallet_pending")||"",o=e.get("errorCode")||"",s=e.get("errorMessage")||"";if(o||s)return r&&await pc(t,e).catch(()=>{}),Es(),$n(),ae(`${n} did not connect: ${s||o||"request cancelled"}. Choose another wallet or try again.`),Mt(t,new Error(s||o||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:ra()}),h({force:!0}),!0;try{if(ae(`Finishing ${n} mobile connection...`),r)await pc(t,e);else{const c=uc(t,e);await dc(t,c)}}catch(c){if(r)try{const i=uc(t,e);await dc(t,i)}catch{ae(`${n} mobile connection could not finish: ${c.message}`),Mt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:ra()}),$n(),h({force:!0})}else ae(`${n} mobile connection could not finish: ${c.message}`),Mt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:ra()}),$n(),h({force:!0})}return!0}async function hf(){$("");const e=kn()||wn();try{v(e,"Choose a wallet provider to connect."),ca({returnPath:"/terminal"})}catch(t){v(e,t.message),$(t.message)}}async function gf(){a.user||await Fs(),a.user&&(a.walletConnectMenuOpen=!1,a.route="terminal",a.activeTab="wallets",a.toolSections={...a.toolSections||{},wallets:a.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),a.wallets.length||await Wu())}async function bf(){if(a.logoutPending)return;if(!a.user){a.loginCollapsed=!1,h(),bn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await $u("logging out");const e=String(a.token||"");a.logoutPending=!0;const t=p("[data-logout]");t&&(t.disabled=!0,v(t,"Logging out...")),a.token="",a.user=null,a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="",a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},a.manualSellActions={},a.tradeActionLocks={},a.ogreAgentStatus="",ni(),os(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{a.logoutPending=!1}}async function yf(){if(!a.token){h();return}try{const e=await k("/api/web/me");de(e.user),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Ne({force:!1,deep:!1,reason:"session-load"}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})})}catch{a.token="",os(),h()}}async function oa(e={}){const t=C();if(!a.user||!a.token){a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.launchWatches=[],a.presets={trade:[],bundle:[]},a.tradePlans=[],a.watchlist={rows:[],count:0},h();return}const n=!e.silent;n&&(a.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,b,S,P,T]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.pnl=y.pnl||null,a.launchWatches=b.watches||[],a.presets=S.presets||{trade:[],bundle:[]},ad(),a.watchlist=P.watchlist||{rows:[],count:0},a.tradePlans=T.plans||[],to();return}const[o,s,c,i,u,d,m,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.wallets=o.wallets||[],a.balances=s.balances||[],a.connectedWalletBalance=s.connectedWallet||c.connectedWallet||null,a.positions=c.positions||[],a.pnl=i.pnl||null,a.launchWatches=u.watches||[],a.presets=d.presets||{trade:[],bundle:[]},ad(),a.watchlist=m.watchlist||{rows:[],count:0},a.tradePlans=f.plans||[],to(),e.force&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="")}finally{q("load-all",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e.skipCore?"skip-core":"core"}),n&&(a.loading=!1),h()}}async function Ws(e={}){if(!a.user||!a.token)return;const t=C(),n=e.requestId||0,r=()=>n&&a.walletRefreshRequestId!==n,o=e.force?"?force=true":"",s=e.force||e.deep?"?force=true":"",c=e.timeoutMs||un,i=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${o}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),m=await u;if(r())return;a.balances=m.balances||[],a.connectedWalletBalance=m.connectedWallet||null,a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",q("wallet-refresh",t,{component:"wallet",resultCount:a.balances.length,cacheHit:!!m.cacheHit,details:`wallets=${a.wallets.length};connected=${!!a.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([i.then(b=>({ok:!0,wallets:b})).catch(b=>({ok:!1,error:b})),d.then(b=>({ok:!0,tradePlans:b})).catch(b=>({ok:!1,error:b}))]);if(!r()&&(f.ok&&(a.wallets=f.wallets.wallets||a.wallets||[]),y.ok&&(a.tradePlans=y.tradePlans.plans||a.tradePlans||[],to()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const b=C(),S=k(`/api/web/positions${s}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await S;if(P?.__error)throw P.__error;if(r())return;a.connectedWalletBalance=P.connectedWallet||a.connectedWalletBalance||null,a.positions=P.positions||[],a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",q("positions-refresh",b,{component:"positions",resultCount:a.positions.length,cacheHit:!!P.cacheHit,details:`open=${a.positions.length}`})}catch(P){a.walletRefreshError=P.message||"Position refresh failed.",q("positions-refresh",b,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(P?.message||"Position refresh failed.")})}}}function mc(e=a.positions){return(Array.isArray(e)?e:[]).some(t=>{const n=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!n&&/refreshing|updating|background/i.test(t?.valueError||""))})}function fc(e=120,t="positions-value-followup"){!a.user||!a.token||(wr&&window.clearTimeout(wr),wr=window.setTimeout(()=>{wr=null,ft({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Gt}).then(n=>{n?(a.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})):Mr(`${t}-failed`)}).catch(()=>Mr(`${t}-failed`))},Math.max(0,Number(e)||0)))}function vf(e=[],t=[],n={}){const r=new Map((Array.isArray(t)?t:[]).map(o=>[String(o?.tokenMint||""),o]));return(Array.isArray(e)?e:[]).map(o=>{const s=r.get(String(o?.tokenMint||""));if(!s||n.fast===!1)return o;const c=!!(o?.valuePending||/refreshing|updating|background/i.test(o?.valueError||"")),i=s.estimatedValueSol!==null&&s.estimatedValueSol!==void 0&&s.estimatedValueSol!=="";return!c||!i?o:{...o,estimatedValueSol:s.estimatedValueSol,openPnlSol:s.openPnlSol,openPnlPercent:s.openPnlPercent,valuePending:!1,valueError:""}})}function Mr(e="positions-value-refresh-delayed"){let t=!1;return a.positions=(Array.isArray(a.positions)?a.positions:[]).map(n=>{const r=n?.estimatedValueSol!==null&&n?.estimatedValueSol!==void 0&&n?.estimatedValueSol!=="";return!(n?.valuePending||/refreshing|updating|background/i.test(n?.valueError||""))?n:(t=!0,{...n,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(q("positions-value-refresh-cleanup",C(),{component:"positions",details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):!1}function hc(e="portfolio-supplemental"){if(!a.user||!a.token)return;const t=C();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Gt}),k("/api/web/pnl?force=true",{timeoutMs:Gt,dedupe:!1})]).then(([n,r])=>{n.status==="fulfilled"&&(a.balances=n.value.balances||a.balances||[],a.connectedWalletBalance=n.value.connectedWallet||a.connectedWalletBalance||null),r.status==="fulfilled"&&(a.pnl=r.value.pnl||a.pnl||null),a.lastWalletRefreshAt=new Date().toISOString(),q("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}).catch(()=>{})}async function ft(e={}){if(!a.user||!a.token)return;const t=C(),n=new URLSearchParams;e.force&&n.set("force","true"),e.fast!==!1&&n.set("fast","true");const r=n.toString()?`?${n.toString()}`:"",o=r||"full";if(gn&&cs===o)return gn;const s=++us;return cs=o,gn=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Gt:as)});return us!==s?!1:(a.connectedWalletBalance=c.connectedWallet||a.connectedWalletBalance||null,a.positions=vf(c.positions||a.positions||[],a.positions||[],e),a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",q("positions-refresh",t,{component:"positions",resultCount:a.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&mc(a.positions)&&fc(120,`${e.reason||"positions"}-values`),e.syncPnl&&hc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(a.walletRefreshError=c.message||"Position refresh failed."),q("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(c?.message||"Position refresh failed.")}),!1}finally{us===s&&(gn=null,cs="")}})(),gn}async function wf(e={}){if(!a.user||!a.token){$("Connect your wallet before refreshing positions."),qe("error",{error:"Wallet not connected"});return}const t=C();Fa("refreshing",{startedAt:a.positionRefreshAction?.startedAt||t}),a.walletRefreshError="",Me("[data-sync-health]",Wr()),se(),await Be(20);try{if(!await ft({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Gt}))throw new Error(a.walletRefreshError||"Position refresh failed.");a.lastWalletRefreshAt=new Date().toISOString(),qe("success",{error:""}),hc(`${e.reason||"positions-only"}-balances-pnl`),mc(a.positions)&&fc(120,`${e.reason||"positions-only"}-full-values`),q("positions-only-refresh",t,{component:"positions",resultCount:a.positions.length,details:e.reason||"positions-only"})}catch(n){const r=n?.message||"Position refresh failed.";a.walletRefreshError=r,qe("error",{error:W(r)}),$(r),q("positions-only-refresh",t,{errorCode:n?.code||n?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(r)})}finally{h()}}function Pn(){return String(a.smartChartToken||a.tradeToken||a.bundleToken||a.volumeToken||a.terminalToken||"").trim()}function Ke(e=a.activeTab){return Em[e]||null}function Da(e=Ke()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",xn(a.livePairBucket)).replace("{sort}",String(a.terminalSort||"best")).replace("{scopeMode}",String(a.slimeScopeMode||"new")).replace("{kolMode}",String(a.kolMode||"hot")).replace("{kolWallet}",a.kolWallet?w(a.kolWallet):"global").replace("{scanMode}",String(a.scanMode||"safe")).replace("{tokenMint}",Pn()?w(Pn()):"none")}function gc(e=a.activeTab,t="pageSize",n=25){const r=Ke(e),o=Number(r?.[t]);return Number.isFinite(o)&&o>0?o:n}function _a(e=a.activeTab){return gc(e,"pageSize",25)}function Ns(e=a.activeTab){return Math.max(_a(e),gc(e,"maxPageSize",_a(e)))}function bc(e=a.activeTab){return!!Ke(e)?.supportsPagination}function Ds(e=a.activeTab){const t=Ke(e)||{tabKey:e};return`${e}:${Da(t)}`}function An(e=a.activeTab,t=0){const n=Ds(e),r=_a(e),o=Ns(e),s=Number(a.terminalFeedVisibleLimits?.[n]||0),c=Number.isFinite(s)&&s>0?s:r,i=Number(t||0),u=Math.min(Math.max(r,c),o);return i>0?Math.min(u,i):u}function Y(e=a.activeTab){const t=Ds(e);if(!a.terminalFeedVisibleLimits?.[t])return;const n={...a.terminalFeedVisibleLimits||{}};delete n[t],a.terminalFeedVisibleLimits=n}function Sf(e=a.activeTab,t=0){const n=Ds(e),r=An(e,t),o=_a(e),s=Ns(e),c=Number(t||0),i=Math.min(s,c>0?c:s,r+o);return a.terminalFeedVisibleLimits={...a.terminalFeedVisibleLimits||{},[n]:i},i}function tt(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return n.slice(0,An(e,n.length))}function kf(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return bc(e)&&n.length>An(e,n.length)}function sa(e=a.activeTab,t=[],n="rows"){const r=Array.isArray(t)?t:[];if(!kf(e,r))return"";const o=An(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${l(o)} of ${l(r.length)} ${l(n)} shown</small>
      <button type="button" data-terminal-load-more="${l(e)}">Load More</button>
    </div>
  `}function V(e=a.activeTab){return a.terminalFeeds[e]||{}}function yc(e=a.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?la():e==="kol"?a.kolLastUpdatedAt||"":e==="watchlist"?V("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?a.lastWalletRefreshAt||V(e).lastFetchAt||"":V(e).lastFetchAt||""}function Bt(e=a.activeTab){return e==="terminal"?Number(We()?.rows?.length||0)+Number(a.kolScan?.rows?.length||0):e==="live"?Number(We()?.rows?.length||0):e==="liveTrades"?Number(a.pnl?.trades?.length||0):e==="slimeScope"?Number(Ud?.(a.slimeScopeMode)?.length||0):e==="kol"?Number(a.kolScan?.rows?.length||0):e==="watchlist"?Number(a.watchlist?.rows?.length||0):e==="smartChart"?Pn()?1:Number(Qn?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?Pn()?1:0:e==="sniper"?Number(a.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(a.launchWatches?.length||0):e==="wallets"?Number(a.wallets?.length||0)+Number(a.balances?.length||0):e==="positions"?Number(a.positions?.length||0):e==="pnl"?Number(a.pnl?.trades?.length||0):e==="ogreAi"?a.ogreAiResult?1:0:e==="ogreTek"?Number(a.ogreTek?.markets?.length||0)+Number(a.ogreTek?.positions?.length||0):0}function Cn(e=a.activeTab){const t=Bt(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,An(e,t)):t}function Ln(e=a.activeTab){const t=Ke(e);if(!t)return!1;const n=Date.parse(yc(e)||"");return Number.isFinite(n)?Date.now()-n>Number(t.staleMs||3e4):!0}function vc(e=a.activeTab){return Bt(e)>0||!!yc(e)}function $f(e=a.activeTab,t={}){const n=Ke(e)||{};return{tabKey:e,label:n.label||e,category:n.category||"unknown",endpoint:n.endpoint||"",cacheKey:Da(n),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Cn(e)??0),pageSize:_a(e),maxPageSize:Ns(e),supportsPagination:bc(e),hasMore:!!(t.hasMore??Bt(e)>Cn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function wc(e=a.activeTab,t={}){const n=$f(e,t);if(a.terminalFeedLog=[...a.terminalFeedLog||[],n].slice(-20),Ls(am,()=>a.terminalFeedLog,"feed"),n.status==="error"||n.status==="timeout"||/manual|post-trade|visibility|resume/i.test(n.reason||"")||!!(n.stale&&n.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(n)}).catch(()=>{})}catch{}return n}function Tf(e=a.activeTab,t={}){const n=Ke(e);if(!n)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return a.terminalFeeds={...a.terminalFeeds,[e]:{...V(e),label:n.label,category:n.category,endpoint:n.endpoint,cacheKey:Da(n),refreshMs:n.refreshMs,staleMs:n.staleMs,pageSize:n.pageSize,maxPageSize:n.maxPageSize,supportsPagination:!!n.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function _s(e=a.activeTab,t="",n="success",r={}){const o=Ke(e);if(!o)return;const s=Bt(e),c=Cn(e),i={...V(e),label:o.label,category:o.category,endpoint:o.endpoint,cacheKey:Da(o),refreshMs:o.refreshMs,staleMs:o.staleMs,pageSize:o.pageSize,maxPageSize:o.maxPageSize,supportsPagination:!!o.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:n,lastFetchAt:new Date().toISOString(),resultCount:s,renderedCount:c,hasMore:s>c,stale:n!=="success"||Ln(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};a.terminalFeeds={...a.terminalFeeds,[e]:i},wc(e,{requestId:t,status:n,reason:i.lastReason,resultCount:s,renderedCount:c,hasMore:i.hasMore,stale:i.stale,errorCode:i.errorCode,errorMessage:i.errorMessage})}function Pf(e=a.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function Af(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function Q(e=a.activeTab,t={}){const n=C(),r=Ke(e);if(!r)return null;if(t.ifStale&&vc(e)&&!Ln(e)||V(e).inFlight)return V(e);const o=Af(t),s=Date.now(),c=Number(bi.get(e)||0);if(!o&&c&&s-c<dn)return V(e);if(Pf(e)&&!a.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return _s(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),V(e);bi.set(e,s);const i=Tf(e,t);if(o&&t.renderStart!==!1){const u=a.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[Rt({silent:!0,force:!!t.force})];a.kolWallet||u.push(Fr(a.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await Ir({silent:t.silent!==!1,bucket:a.livePairBucket,force:!!t.force});else if(e==="liveTrades")a.user&&a.token&&await oa({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[Rt({silent:!0,force:!!t.force}),Bn(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];a.kolScan||u.push(Fr(a.kolMode,a.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await Fr(a.kolMode,a.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await $c({silent:t.silent!==!1});else if(e==="sniper")await Bn(a.scanMode,{silent:t.silent!==!1});else if(e==="positions")a.user&&a.token&&await ft({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:as});else if(["wallets","pnl"].includes(e))a.user&&a.token&&await Ne({force:!!t.force,deep:!1});else if(e==="smartChart")a.user&&a.token&&await Ne({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[Rt({silent:!0,force:!!t.force})];a.user&&a.token&&u.push(oa({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[Rt({silent:!0,force:!!t.force})];a.scan||u.push(Bn(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),a.user&&a.token&&u.push(oa({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await sr({silent:!0}).catch(u=>{a.ogreTek.error=u.message});return _s(e,i,"success"),V(e)}catch(u){if(_s(e,i,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:W(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return V(e)}finally{q("feed-refresh",n,{component:r.component||e,resultCount:Bt(e),cacheHit:!!V(e).cacheHit,stale:Ln(e),requestId:V(e).lastRequestId||"",errorCode:V(e).errorCode||"",details:`${e}:${Da(r)}`}),t.render!==!1&&(!o&&Vs()?Mc():h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"&&e==="smartChart"}))}}async function Ua(e={}){const t=a.activeTab||"terminal",n=[Q(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(n)}function Br(e="terminal-entry"){a.route==="terminal"&&(Ua({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),a.user&&a.token&&Ne({force:!0,deep:!1,reason:e}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})}))}function Us(){const e=()=>{xa&&clearTimeout(xa),xa=null,br=""};if(a.route!=="terminal"||document.hidden){e();return}const t=Ke(a.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(a.activeTab)){e();return}const n=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${a.activeTab}:${Da(t)}:${n}`;xa&&br===r||(e(),br=r,xa=setTimeout(async()=>{xa=null,br="",!(a.route!=="terminal"||document.hidden)&&(await Q(a.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(o=>$(o.message)),Us())},n))}function xn(e){const t=String(e||"live");return Lt.some(([n])=>n===t)?t:"live"}function Sc(e=a.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Rr(e=a.activeTab){return e==="slimeScope"?Sc(a.slimeScopeMode):xn(a.livePairBucket)}function We(e=Rr()){const t=xn(e);return a.livePairsByBucket[t]||(t===a.livePairBucket?a.livePairs:null)||null}function la(e=Rr()){const t=xn(e);return a.livePairsLastUpdatedByBucket[t]||(t===a.livePairBucket?a.livePairsLastUpdatedAt:"")||""}function kc(e=[]){return Array.isArray(e)&&e.length>0}function Re(e={},t={},n=[]){for(const r of n){const o=e?.[r];if(o!=null&&o!=="")return o}for(const r of n){const o=t?.[r];if(o!=null&&o!=="")return o}return""}function Cf(e=[],t=[]){const n=new Map((Array.isArray(e)?e:[]).map(r=>[ma(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const o=n.get(ma(r));return o?{...o,...r,tokenMint:Re(r,o,["tokenMint","mint","tokenAddress","address"]),mint:Re(r,o,["mint","tokenMint","tokenAddress","address"]),symbol:Re(r,o,["symbol","ticker","shortMint"]),name:Re(r,o,["name","tokenName","category"]),imageUrl:Re(r,o,["imageUrl","image","icon","logoURI","logoUrl"]),image:Re(r,o,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Re(r,o,["avatarUrl","avatar_url","avatar"]),avatarState:Re(r,o,["avatarState"]),dexUrl:Re(r,o,["dexUrl","url"]),pumpUrl:Re(r,o,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Re(r,o,["websiteUrl","website"]),twitterUrl:Re(r,o,["twitterUrl","xUrl"]),telegramUrl:Re(r,o,["telegramUrl"]),metadata:r?.metadata||o?.metadata||r?.tokenMetadata||o?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||o?.tokenMetadata||r?.metadata||o?.metadata||null,dex:r?.dex||o?.dex||r?.dexScreener||o?.dexScreener||null,pump:r?.pump||o?.pump||r?.pumpFun||o?.pumpFun||null}:r})}async function Ir({silent:e=!1,bucket:t=a.livePairBucket,renderOnComplete:n=!0,force:r=!1}={}){const o=C(),s=xn(t),c=s===a.livePairBucket,i=a.terminalSort||"best",u=`${s}:${i}`,d=$r.get(u);if(d?.promise){a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:d.requestId},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const P=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);return!e&&!kc(P)&&Ia(ki),d.promise}const m=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(ds[s]||0)+1;ds[s]=f;const y=()=>ds[s]===f;a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:m},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const b=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);!e&&!kc(b)&&Ia(ki);const S=(async()=>{try{const P=r?"&force=true":"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(s)}&sort=${encodeURIComponent(i)}${P}`,g=await Promise.race([k(T),new Promise((D,Fe)=>window.setTimeout(()=>Fe(new Error("Live feed refresh timed out.")),12e3))]),A=Lt.find(([D])=>D===s)?.[1]||"Live",L=a.livePairsByBucket[s]||(c?a.livePairs:null);let B=g.livePairs||{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${A} feed returned no rows yet. Retrying automatically.`};const _=Array.isArray(B?.rows)?B.rows:[],re=Array.isArray(L?.rows)?L.rows:[];if(_.length===0&&re.length>0?B={...L,...B,rows:L.rows,stale:!0,emptyRefresh:!0,message:`${A} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:_.length>0&&re.length>0&&(B={...B,rows:Cf(re,_)}),!y())return B;const we=B?.refreshedAt||new Date().toISOString(),Qe={...a.livePairsRefreshErrorByBucket||{}};return delete Qe[s],a.livePairsRefreshErrorByBucket=Qe,a.livePairsByBucket={...a.livePairsByBucket,[s]:B},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:we},c&&(a.livePairs=B,a.livePairsLastUpdatedAt=we),B}catch(P){const T=W(P?.message||"Live feed refresh failed."),g=Lt.find(([B])=>B===s)?.[1]||"Live",A=a.livePairsByBucket[s]||(c?a.livePairs:null),L=A?{...A,stale:!0,refreshError:T,message:`Showing last good ${g} feed. Refresh failed, retrying automatically.`}:{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:T,message:`${g} refresh failed. Retrying automatically.`};return y()&&(a.livePairsRefreshErrorByBucket={...a.livePairsRefreshErrorByBucket||{},[s]:T},a.livePairsByBucket={...a.livePairsByBucket,[s]:L},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:L.refreshedAt},c&&(a.livePairs=L,a.livePairsLastUpdatedAt=L.refreshedAt)),L}finally{if(!y())return;const P=a.livePairsByBucket?.[s]?.rows||[];q("live-pairs-refresh",o,{component:"livePairs",resultCount:Array.isArray(P)?P.length:0,stale:!!a.livePairsByBucket?.[s]?.stale,errorCode:a.livePairsRefreshErrorByBucket?.[s]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${s}:${i}`});const T={...a.livePairsLoadingByBucket};(T[s]===m||T[s]===!0)&&(delete T[s],a.livePairsLoadingByBucket=T),a.livePairsLoading=!!T[a.livePairBucket],!e&&c&&(a.loading=!1),n&&(c&&["terminal","live","slimeScope"].includes(a.activeTab)?Ia("load-live-pairs-complete"):h())}})();return $r.set(u,{requestId:m,requestVersion:f,safeBucket:s,promise:S}),S.finally(()=>{$r.get(u)?.requestId===m&&$r.delete(u)}),S}async function Rt({silent:e=!1,force:t=!1,warmAll:n=!1}={}){if(await Ir({silent:e,bucket:a.livePairBucket,force:t}),n){const r=Lt.map(([o])=>o).filter(o=>o!==a.livePairBucket);await Promise.allSettled(r.map(o=>Ir({silent:!0,bucket:o,renderOnComplete:!1,force:t})))}(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope")&&Ia(n?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function ia(){if(In()||document.hidden||Ba()||a.activeTab!=="live"&&a.activeTab!=="terminal"&&a.activeTab!=="slimeScope"){Ra();return}const e=Rr(a.activeTab),n=(a.activeTab==="slimeScope"?12:8)*1e3,r=`${a.activeTab}:${e}:${a.terminalSort}:${n}`;Ta&&mr===r||(Ra(),mr=r,Ta=setTimeout(async()=>{if(Ta=null,mr="",document.hidden||Ba()){ia();return}if(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"){if(a.livePairsLoadingByBucket?.[e]){ia();return}try{a.activeTab==="slimeScope"?await Q("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Ir({silent:!0,bucket:a.livePairBucket,force:!1})}catch{}finally{ia()}}},n))}function Lf({force:e=!1}={}){if(In()||!(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"))return;const n=Rr(a.activeTab),r=`${n}:${a.terminalSort||"best"}`;ls.has(r)||a.livePairsLoadingByBucket[n]||!e&&a.livePairsByBucket[n]||(ls.add(r),window.setTimeout(()=>{const o=a.activeTab==="slimeScope"?Q("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):Rt({silent:!0,force:!0,warmAll:!1});Promise.resolve(o).catch(s=>$(s.message)).finally(()=>{ls.delete(r),ia()})},900))}function Or(){const e=()=>{Pa&&clearTimeout(Pa),Pa=null,fr=""};if(document.hidden||a.activeTab!=="sniper"){e();return}const t=`${a.activeTab}:${a.scanMode}`;Pa&&fr===t||(e(),fr=t,Pa=setTimeout(async()=>{if(Pa=null,fr="",document.hidden){Or();return}if(a.activeTab==="sniper"){if(a.loading){Or();return}try{await Bn(a.scanMode,{silent:!0})}catch(n){$(n.message)}finally{Or()}}},2e4))}function Mn(){const e=()=>{Aa&&clearTimeout(Aa),Aa=null,hr=""};if(In()||document.hidden||a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet){e();return}const t=String(a.kolMode||"hot"),o=t==="hot"||t==="fresh"?1e4:3e4,s=`${a.activeTab}:${a.kolMode}:${o}`;Aa&&hr===s||(e(),hr=s,Aa=setTimeout(async()=>{if(Aa=null,hr="",document.hidden){Mn();return}if(!(a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet)){if(a.kolLoading){Mn();return}try{await Fr(a.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{Mn()}}},o))}function Er(){const e=()=>{La&&clearTimeout(La),La=null,gr=""};if(In()||document.hidden||a.activeTab!=="watchlist"&&a.activeTab!=="terminal"||!a.user||!a.token){e();return}const t=`${a.activeTab}:${a.user?.id||"guest"}`;La&&gr===t||(e(),gr=t,La=setTimeout(async()=>{if(La=null,gr="",document.hidden){Er();return}if(!(a.activeTab!=="watchlist"&&a.activeTab!=="terminal"))try{await $c({silent:!0})}catch(n){$(n.message)}finally{Er()}},3e4))}async function Bn(e=a.scanMode,t={}){const n=C(),r=!!t.silent;a.scanMode=e,r||(a.loading=!0,h());try{const o=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);a.scan=o.scan}finally{q("scanner-refresh",n,{component:"sniper",resultCount:Array.isArray(a.scan?.candidates)?a.scan.candidates.length:0,details:e}),r||(a.loading=!1),h()}}async function Fr(e=a.kolMode,t=a.kolWallet,n={}){const r=C(),o=!!n.silent;a.kolMode=e,a.kolWallet=String(t||"").trim();let s="";a.kolWallet&&!Et(a.kolWallet)&&(a.kolWallet="",s="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!o&&!a.kolScan&&(a.loading=!0),a.kolLoading=!0,a.kolStatus=s||(a.kolWallet?"Scanning custom KOL wallet...":`Loading ${Kn(a.kolMode)}...`),$(""),o||h();try{const c=new URLSearchParams({mode:e});a.kolWallet&&c.set("wallet",a.kolWallet);const i=await k(`/api/web/kol/scan?${c.toString()}`);a.kolScan=i.scan,a.kolLastUpdatedAt=new Date().toISOString(),a.kolStatus=i.scan?.message||`${Kn(a.kolMode)} loaded.`,a.kolDumpStatsLoadedAt=0}catch(c){throw a.kolStatus=c.message||"KOL scan failed.",c}finally{q("kol-refresh",r,{component:"kol",resultCount:Array.isArray(a.kolScan?.rows)?a.kolScan.rows.length:Array.isArray(a.kolScan?.signals)?a.kolScan.signals.length:0,errorCode:a.kolStatus&&/failed/i.test(a.kolStatus)?"KOL_REFRESH_FAILED":"",details:a.kolWallet?"wallet":e}),o||(a.loading=!1),a.kolLoading=!1,h()}}async function $c(e={}){if(!a.user||!a.token)return;const t=C(),n=!!e.silent;a.watchlistLoading=!0,n||h();try{const r=await k("/api/web/watchlist");a.watchlist=r.watchlist||{rows:[],count:0}}finally{q("watchlist-refresh",t,{component:"watchlist",resultCount:a.watchlist?.count||a.watchlist?.rows?.length||0}),a.watchlistLoading=!1,h()}}function xf(){return a.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function Mf(){const e=Number(a.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function It(){return xf()+Mf()}const Bf=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Ie(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function Rf(){const e=new Map,t=(n={})=>{const r=Ie(n.mint||n.tokenMint||"");if(!r||e.has(r))return;const o=n.balance??n.uiAmount??n.amount??n.uiBalance??"";e.set(r,{mint:r,symbol:String(n.symbol||n.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(n.name||n.label||"").trim(),balance:o,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${It().toFixed(4)} SOL`}),at().forEach(n=>t({mint:n.tokenMint||n.mint,symbol:n.symbol||n.shortMint,name:n.name||"",balance:n.uiAmount||n.amountToken||"",kind:"wallet"})),(a.balances||[]).forEach(n=>{(n.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function qs(e={}){const t=new Map,n=(o={})=>{const s=Ie(o.mint||o.tokenMint||"");!s||t.has(s)||t.set(s,{mint:s,symbol:String(o.symbol||o.shortMint||(s==="SOL"?"SOL":w(s))||"").trim(),name:String(o.name||o.label||"").trim(),balance:o.balance??o.uiAmount??o.amount??"",kind:o.kind||o.source||"held"})};return Rf().forEach(n),e.walletOnly||Bf.forEach(o=>{o.mint!=="SOL"&&n(o)}),[...t.values()]}function Tc(e=""){const t=Ie(e);return qs().find(n=>n.mint===t)||null}function Pc(e="",t={}){const n=Ie(e),r=t.includeCustom!==!1,o=qs({walletOnly:!!t.walletOnly}),s=o.some(u=>u.mint===n);return`${o.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||w(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${l(u.mint)}" ${n===u.mint?"selected":""}>${l(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!n||!s)?"selected":""}>Custom CA</option>`:""}`}function Hs(){const e=Ie(a.tradeSwapFrom||"SOL")||"SOL";return qs({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function Ac(){const e=Hs(),t=Ie(a.tradeSwapTo||""),n=Ie(a.tradeToken||"");return t&&t!==e?t:n&&n!==e||e==="SOL"?n:"SOL"}function If(){const e=Hs(),t=Ac();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Ie(a.tradeToken||"")?a.swapDirection==="sell"?"sell":"buy":"select"}function Of(e="buy"){const t=Ie(p("[data-swap-from]")?.value||a.tradeSwapFrom||""),n=Ie(p("[data-swap-to]")?.value||a.tradeSwapTo||""),r=String(p("[data-trade-token]")?.value||a.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:n&&n!=="SOL"?n:r}function Cc(){return(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey?(a.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const n=String(t.mint||t.tokenMint||"").trim();return{tokenMint:n,shortMint:t.shortMint||w(n),symbol:t.symbol||t.shortMint||w(n),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||J(n),pumpUrl:lf(n),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function at(){const e=new Set,t=[];for(const n of[...a.positions||[],...Cc()]){const r=String(n?.tokenMint||n?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(n))}return t}function Ks(){const e=a.connectedWalletBalance?.publicKey||a.user?.connectedWallet?.publicKey||"";return a.wallets.length+(e?1:0)}function Lc(){return a.pnl?.totals?.realizedSol||"+0 SOL"}function qa(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Rn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function Wr(){if(a.walletRefreshing||a.walletRefreshStatus==="refreshing")return"Syncing";if(a.walletRefreshStatus==="timeout")return"Delayed";if(a.walletRefreshError||a.walletRefreshStatus==="error")return"Retry";const e=qa(a.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function Ef(){const e=ne("trade",a.selectedTradePresetId),t=ne("bundle",a.selectedBundlePresetId),n=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${n} | ${r}`}async function xc(){if(!a.user||!a.token)return;const e=C();try{const[t,n]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(a.pnl=t.value.pnl||a.pnl||null),n.status==="fulfilled"&&(a.tradePlans=n.value.plans||a.tradePlans||[],to()),q("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(a.tradePlans?.length||0)+(a.pnl?1:0),details:"pnl,trade-plans"})}catch(t){q("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:W(t?.message||"Post-trade supplemental refresh failed.")})}}function Ff(e=350,t={}){yr&&window.clearTimeout(yr),yr=window.setTimeout(async()=>{if(yr=null,!(!a.user||!a.token))try{t.reason==="post-trade"?await Promise.all([xc(),ft({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([oa({force:!1,skipCore:!0,silent:!0}),ft({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(n){a.walletRefreshError=n.message||"Background refresh failed.",h()}},e)}async function Ne({force:e=!1,deep:t=!1,reason:n="manual"}={}){if(!a.user||!a.token)return a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="Wallet not connected",Me("[data-sync-health]","Wallet not connected"),qe("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(n||"").toLowerCase(),o=r==="manual_header_click",s=r.includes("post-trade");if(e&&!t&&!s&&!o&&Date.now()-Ri<om?(e=!1,E({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!s&&(Ri=Date.now()),Yt)return E({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),a.positionRefreshAction?.state==="clicked"&&Fa("refreshing",{startedAt:a.positionRefreshAction.startedAt||C()}),Yt.finally(()=>{if(["clicked","refreshing"].includes(a.positionRefreshAction?.state)){const u=a.walletRefreshStatus==="error"||a.walletRefreshStatus==="timeout";qe(u?"error":"success",{error:u?W(a.walletRefreshError||"Refresh delayed"):""})}});const c=C(),i=++Tm;return a.walletRefreshRequestId=i,Yt=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};a.positionRefreshAction?.state==="clicked"&&Fa("refreshing",{startedAt:a.positionRefreshAction.startedAt||c}),a.walletRefreshing=!0,a.walletRefreshStatus="refreshing",a.walletRefreshError="",Me("[data-sync-health]",Wr()),Ct("[data-refresh-spinner]",!1),se(),Qt&&window.clearTimeout(Qt),Qt=window.setTimeout(()=>{Qt=null,!(a.walletRefreshRequestId!==i||!a.walletRefreshing)&&(a.walletRefreshing=!1,a.walletRefreshStatus==="refreshing"&&(a.walletRefreshStatus="timeout"),Yt=null,qe("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))},ts+6e3),await Be(20);try{if(await Promise.race([Ws({force:e,deep:t,preserveSmartChartFrame:a.activeTab==="smartChart",requestId:i,timeoutMs:ts}),new Promise((d,m)=>window.setTimeout(()=>m(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),ts))]),a.walletRefreshRequestId!==i)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:C()-c,fromCache:!1,degraded:!0},u;a.walletRefreshRequestId===i&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshStatus="success"),t?await oa({force:e,skipCore:!0,silent:!0}):((o||s)&&ft({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${n}-positions-values`,timeoutMs:Gt}).then(d=>{d?h({preserveSmartChartFrame:a.activeTab==="smartChart"}):Mr(`${n}-positions-values-failed`)}).catch(()=>Mr(`${n}-positions-values-failed`)),Ff(s?200:350,{reason:n})),q("wallet-refresh-total",c,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:t?"deep":`core-plus-background:${n}`}),qe("success",{error:""}),u={ok:!0,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:"",durationMs:C()-c,fromCache:!1,degraded:!1}}catch(d){const m=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));a.walletRefreshRequestId===i&&(a.walletRefreshStatus=m?"timeout":"error",a.walletRefreshError=d.message||"Refresh failed."),m&&!r.includes("auto-retry")&&a.user&&a.token&&window.setTimeout(()=>{a.user&&a.token&&a.walletRefreshStatus!=="success"&&Ne({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),q("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:W(a.walletRefreshError)}),qe("error",{error:W(a.walletRefreshError)}),$(a.walletRefreshError),u={ok:!1,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:W(a.walletRefreshError),durationMs:C()-c,fromCache:!1,degraded:!0}}finally{Qt&&(window.clearTimeout(Qt),Qt=null),a.walletRefreshRequestId===i&&(a.walletRefreshing=!1),Yt=null,h({preserveSmartChartFrame:a.activeTab==="smartChart"})}return u})(),Yt}async function ht({force:e=!0,reason:t="manual_header_click",deep:n=!1}={}){return Ne({force:e,reason:t,deep:n})}function In(){return!!a.postTradeRefresh?.active&&Number(a.postTradeRefresh?.activeUntil||0)>Date.now()}async function xS(e="",t="legacy-post-trade"){H(e,t)}function H(e="",t="post-trade",n={}){e&&(a.lastTradeSignature=e),At.length&&(At.forEach(s=>window.clearTimeout(s)),At=[]);const r=n.tradeAttemptId||mt("post-trade"),o=Array.isArray(n.affectedKeys)&&n.affectedKeys.length?n.affectedKeys.slice(0,12).map(s=>be(s,48)):pm;a.postTradeRefresh={active:!0,attemptId:r,action:be(t,70),signaturePresent:!!e,invalidatedKeys:o,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},E({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:o.length,details:o.join(",")}),lm.forEach(s=>{const c=window.setTimeout(()=>{At=At.filter(m=>m!==c);const i=Number(a.postTradeRefresh?.requestCount||0)+1;a.postTradeRefresh={...a.postTradeRefresh||{},requestCount:i},E({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:a.postTradeRefresh.requestCount,details:t});const u=C();(i<=1?Ne({force:!0,deep:!1,reason:"post-trade"}):Promise.all([ft({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Gt}),xc()])).catch(m=>{a.walletRefreshError=m.message||"Post-trade refresh failed.",a.postTradeRefresh={...a.postTradeRefresh||{},errors:[...a.postTradeRefresh?.errors||[],W(m.message||"Post-trade refresh failed.")].slice(-5)},E({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:C()-u,requestId:r,errorCode:m?.code||m?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{a.postTradeRefresh={...a.postTradeRefresh||{},refreshedKeys:[...new Set([...a.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:At.length>0,activeUntil:At.length>0?Date.now()+8e3:Date.now()},E({component:"post-trade",action:"post-trade-refresh-end",durationMs:C()-u,requestId:r,resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:a.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})})},s);At.push(c)}),se()}function Ae({title:e="Confirm",lines:t=[],confirmLabel:n="Confirm",cancelLabel:r="Cancel",danger:o=!1,input:s=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
`);return s?Promise.resolve(window.prompt(c||e,s.value||"")):Promise.resolve(window.confirm(c||e))}return new Promise(c=>{const i=document.createElement("div");i.className="slime-confirm-overlay",i.innerHTML=`
      <div class="slime-confirm-card" role="dialog" aria-modal="true" aria-label="${l(e)}">
        <h3 class="slime-confirm-title">${l(e)}</h3>
        ${[].concat(t).filter(Boolean).map(S=>`<p class="slime-confirm-line">${l(S)}</p>`).join("")}
        ${s?`
          <label class="slime-confirm-input-label">
            ${l(s.label||"")}
            <input class="slime-confirm-input" type="${l(s.type||"text")}" value="${l(s.value||"")}" placeholder="${l(s.placeholder||"")}" ${s.inputmode?`inputmode="${l(s.inputmode)}"`:""}>
          </label>`:""}
        <div class="slime-confirm-actions">
          <button type="button" class="slime-confirm-cancel">${l(r)}</button>
          <button type="button" class="slime-confirm-accept${o?" is-danger":""}">${l(n)}</button>
        </div>
      </div>
    `;const u=document.activeElement,d=i.querySelector(".slime-confirm-input"),m=S=>{i.remove(),document.removeEventListener("keydown",b,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>m(s?d?.value??"":!0),y=()=>m(s?null:!1),b=S=>{S.key==="Escape"?(S.preventDefault(),y()):S.key==="Enter"&&(!s||S.target===d)&&(S.preventDefault(),f())};i.addEventListener("pointerdown",S=>{S.target===i&&y()}),i.querySelector(".slime-confirm-accept").addEventListener("click",f),i.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",b,!0),document.body.appendChild(i),(d||i.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function Vs(){if(document.hidden&&a.route==="terminal")return!0;const e=document.activeElement;if(!e||a.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function Mc(){a.pendingRender=!0}function Bc(){!a.pendingRender||Vs()||(a.pendingRender=!1,h({force:!0}))}function zs(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Ha(){if(!oe||!bn||!ee)return;const e=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);oe.dataset.loading=a.loading?"true":"false",oe.dataset.route=a.route,oe.dataset.walletConnected=e?"true":"false",e&&Ew("shell-wallet-context"),e?zc("shell-wallet-context"):ni(),e||(a.tpslAutoEnableInFlight=!1,a.tpslAutoEnableScheduledAt=0),zs(bn,!["intro","login"].includes(a.route)),zs(Oi,a.route!=="connect"),zs(ee,a.route!=="terminal"),Ct("[data-terminal-global-search]",a.route!=="terminal"),Ct("[data-top-sync-strip]",a.route!=="terminal")}function On(){const e=!!(Te&&a.loginModalOpen),t=!!a.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const n=p("[data-wallet-connect-modal]");n&&(n.style.pointerEvents=n.hidden?"none":"");const r=p("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function js(e,t=48){if(!e||document.hidden)return!1;try{const n=e.getBoundingClientRect();return n.width<24||n.height<t}catch{return!1}}function Rc(e="resume"){if(!oe||document.hidden)return;Ha(),On();const t=`${Date.now()}:${e}`,n=oe.style.transform;oe.dataset.resumePaint=t,oe.style.transform=n?`${n} translateZ(0)`:"translateZ(0)",oe.offsetHeight,window.requestAnimationFrame(()=>{!oe||oe.dataset.resumePaint!==t||(oe.style.transform=n,delete oe.dataset.resumePaint)})}function Wf(){if(!oe)return!1;if(oe.dataset.route!==a.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Te||Te.hidden||!a.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!a.quickBuyModal?.open;if(e||t||js(oe,80))return!0;if(a.route!=="terminal")return!1;const n=p("[data-panel]");return ee?.hidden||js(ee,80)||n&&js(n,32)||n&&!n.children.length&&!String(n.textContent||"").trim()?!0:![bn,Oi,ee].some(o=>o&&!o.hidden)}function Nf(e="watchdog"){const t=a.positionRefreshAction||{},n=t.startedAt?Math.max(0,C()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&n>dm&&(qe("error",{error:"Refresh delayed"}),E({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:n,details:e})),a.walletRefreshing&&!Yt&&(a.walletRefreshing=!1,a.walletRefreshStatus=a.walletRefreshStatus==="refreshing"?"timeout":a.walletRefreshStatus,Ct("[data-refresh-spinner]",!0)),On(),se()}function Ic(e="watchdog",t={}){return Nf(e),Wf()?(E({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-Ii),details:`${e}:${a.route}:${a.activeTab||""}`}),As({keepLogin:a.route==="login"}),Ha(),Rc(e),h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):(t.forcePaint&&Rc(e),!1)}function Oc(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function Ec(){try{return document.createElement("canvas")}catch{return null}}function Fc(){const e=Ec();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function Df(){return Oc()||Fc()}function Gs(){const e=He()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Ot(e),typeof window.alert=="function"&&window.alert(e)}function Wc(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function En(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function Nc(){const e=a.clipFarm?.fileExtension||En(a.clipFarm?.mimeType||a.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function Fn(){try{a.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}a.clipFarm?.fallbackFrameTimer&&clearInterval(a.clipFarm.fallbackFrameTimer),a.clipFarm?.fallbackStopTimer&&clearTimeout(a.clipFarm.fallbackStopTimer)}function Ot(e=""){a.clipFarm={...a.clipFarm,status:String(e||"")},Ve()}function Xs(){if(a.clipFarm?.videoUrl)try{URL.revokeObjectURL(a.clipFarm.videoUrl)}catch{}a.clipFarm={...a.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:a.clipFarm?.recording?"Recording...":""},Ve()}function Ve(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=a.clipFarm||{},n=Df(),r=!!t.recording,o=!!(t.blob&&t.videoUrl),s=t.status||(r?"Recording":o?"Clip ready":"Clip farm");e.innerHTML=`
    <div class="clip-farm-control" data-recording="${r?"true":"false"}" data-ready="${o?"true":"false"}">
      <button type="button" class="clip-record-button" data-clip-record data-supported="${n?"true":"false"}" title="${n?"Record a shareable SlimeWire clip":"Tap for recording support details"}" aria-pressed="${r?"true":"false"}">
        <span class="clip-record-dot" aria-hidden="true"></span>
        <strong>${r?"Stop":"Rec"}</strong>
      </button>
      ${o?`
        <div class="clip-share-actions" aria-label="Clip share options">
          <button type="button" data-clip-share title="Share clip">Share</button>
          <button type="button" data-clip-download title="Download clip">Save</button>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent("Farming SlimeWire clips at https://slimewire.org")}" target="_blank" rel="noreferrer" title="Open X">X</a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(Pt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${s?`<small>${l(s)}</small>`:""}
    </div>
  `}function Dc(){const e=ge([...We()?.rows||[],...typeof Qn=="function"?Qn():[],...a.slimeScopeRows||[],...a.livePairRows||[],...Object.values(a.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:a.smartChartToken||a.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function _c(e,t={}){const n=e?.getContext?.("2d");if(!n)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),o=720,s=1280;(e.width!==o*r||e.height!==s*r)&&(e.width=o*r,e.height=s*r,e.style.width=`${o}px`,e.style.height=`${s}px`),n.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),i=t.rows||Dc(),u=new Date;n.fillStyle="#020803",n.fillRect(0,0,o,s);const d=n.createRadialGradient(o*.2,s*.12,20,o*.2,s*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),n.fillStyle=d,n.fillRect(0,0,o,s),n.strokeStyle="rgba(118,255,45,0.38)",n.lineWidth=2,n.strokeRect(24,24,o-48,s-48),n.fillStyle="#baff4d",n.font="900 34px Arial, sans-serif",n.fillText("SlimeWire REC",48,88),n.fillStyle="#f4fff0",n.font="800 54px Arial, sans-serif",n.fillText("Fresh Live Picks",48,154),n.fillStyle="rgba(226,255,215,0.78)",n.font="700 22px Arial, sans-serif",n.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const m=o-96;n.fillStyle="rgba(118,255,45,0.12)",n.fillRect(48,226,m,12),n.fillStyle="#78ff2d",n.fillRect(48,226,Math.max(24,m*c),12),i.forEach((f,y)=>{const b=292+y*188,S=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),T=F(f.marketCapLabel,f.fdvLabel,M(lt(f)),"checking"),g=F(f.liquidityLabel,M(it(f)),"checking"),A=F(f.volumeH1Label,f.volumeLabel,M(f.volumeH1),"checking"),L=String(f.pairAgeLabel||Ut(f)||"live").slice(0,18);n.fillStyle="rgba(4,24,8,0.92)",n.strokeStyle="rgba(118,255,45,0.34)",n.lineWidth=2,n.beginPath(),typeof n.roundRect=="function"?n.roundRect(48,b,o-96,156,18):n.rect(48,b,o-96,156),n.fill(),n.stroke(),n.fillStyle="#f4fff0",n.font="900 32px Arial, sans-serif",n.fillText(S,76,b+48),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 18px Arial, sans-serif",n.fillText(P,76,b+78),[["MC",T],["LIQ",g],["VOL",A],["AGE",L]].forEach(([B,_],re)=>{const we=76+re*140;n.fillStyle="#aaff8f",n.font="800 15px Arial, sans-serif",n.fillText(B,we,b+114),n.fillStyle="#ffffff",n.font="900 23px Arial, sans-serif",n.fillText(String(_).slice(0,10),we,b+142)})}),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 20px Arial, sans-serif",n.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,s-78),n.fillStyle="#78ff2d",n.font="900 24px Arial, sans-serif",n.fillText("slimewire.org",48,s-44)}async function _f(e){_c(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(o=>r(o),"image/png",.92)}catch{r(null)}});if(!t){Gs();return}const n=URL.createObjectURL(t);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:n,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},Ve()}async function Uf(){const e=Ec();if(!e){Gs();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await _f(e);return}Xs();const n=Dc(),r=Date.now(),o=t.call(e,12),s=Wc(),c=[],i=new MediaRecorder(o,s?{mimeType:s}:void 0),u=()=>_c(e,{rows:n,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);i.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),i.addEventListener("stop",()=>{Fn();const f=s||"video/webm",y=new Blob(c,{type:f}),b=y.size>0?URL.createObjectURL(y):"",S=En(y.type||f);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:b,mimeType:y.type||f,fileExtension:S,status:y.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},Ve()},{once:!0}),i.start(500);const m=setTimeout(()=>{a.clipFarm?.recording&&Wn()},4300);a.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:s,fileExtension:En(s),recorder:i,stream:o,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:m},Ve()}async function Uc(){if(!Oc()){if(Fc()){await Uf();return}Gs();return}if(a.clipFarm?.recording){Wn();return}Xs();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=Wc(),n=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",o=>{o.data?.size>0&&n.push(o.data)}),r.addEventListener("stop",()=>{Fn();const o=t||"video/webm",s=new Blob(n,{type:o}),c=s.size>0?URL.createObjectURL(s):"",i=En(s.type||o);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:s.size>0?s:null,videoUrl:c,mimeType:s.type||o,fileExtension:i,status:s.size>0?`Clip ready (.${i}).`:"No clip captured."},Ve()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>Wn(),{once:!0}),r.start(1e3),a.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:En(t),recorder:r,stream:e,chunks:n},Ve()}catch(e){Fn(),a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},Ve()}}function Wn(){const e=a.clipFarm?.recorder;if(!e){Fn(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Ve();return}try{if(e.state!=="inactive"){Ot("Saving clip..."),e.stop();return}}catch{}Fn(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Ve()}async function qf(){const e=a.clipFarm?.blob;if(!e){Ot("Record a clip first.");return}const t=new File([e],Nc(),{type:e.type||a.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Ot("Shared.");return}}catch(n){if(n?.name==="AbortError"){Ot("Share cancelled.");return}}Ot("Use Save, then attach the clip to X or Telegram.")}function Hf(){const e=a.clipFarm?.videoUrl;if(!e){Ot("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=Nc(),document.body.appendChild(t),t.click(),t.remove(),Ot("Saved.")}function Kf(e=null,t="chartTxns"){const n=e||wo(),r=String(n?.tokenMint||a.smartChartToken||"").trim();return r?{mint:r,mode:t,src:wd(n,t)}:null}function Vf(e={}){if(e.refreshSmartChartFrame||a.route!=="terminal"||a.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),n=t?.querySelector("iframe");if(!t||!n)return null;const r=String(t.dataset.chartMode||"chartTxns"),o=Kf(null,r);if(!o||t.dataset.chartMint!==o.mint||t.dataset.chartMode!==o.mode)return null;const s=String(t.dataset.chartSrc||n.getAttribute("src")||""),c=t.dataset.loaded==="true",i=s!==o.src;return t.dataset.preserving="true",{frame:t,mint:o.mint,mode:o.mode,src:i?s:o.src,loaded:c,keepByMint:i}}function zf(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),n=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${n}"]`),o=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||o!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!oe||!bn||!ee)return;if(Ha(),!e.force&&Vs()){Mc();return}const t=C(),n=`${a.route}:${a.activeTab||"none"}`;try{a.perfRenderCounts={...a.perfRenderCounts||{},[n]:(a.perfRenderCounts?.[n]||0)+1},a.pendingRender=!1;const r=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);Ha(),oe.dataset.activeTab=a.activeTab||"";const s=!!((e.preserveSmartChartFrame||a.activeTab==="smartChart")&&a.route==="terminal"&&a.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Vf(e):null,c=!!Te,i=!!(c&&a.loginModalOpen);Ss&&(Ss.hidden=c||!!a.user||a.loginCollapsed),Ct("[data-connect-login-panel]",c||!!a.user||a.loginCollapsed),Te?(Te.hidden=!i,Te.setAttribute("aria-hidden",i?"false":"true"),Te.toggleAttribute("inert",!i),document.body.classList.toggle("login-modal-open",i),document.querySelectorAll("[data-login-tab]").forEach(S=>{const P=S.dataset.loginTab===a.loginModalTab;S.dataset.active=P?"true":"false",S.setAttribute("aria-selected",P?"true":"false")}),Ct("[data-login-modal-login-section]",a.loginModalTab!=="login"),Ct("[data-login-modal-create-section]",a.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),Ei&&(Ei.hidden=!1),Fi&&(Fi.hidden=!!a.user),Wi&&(Wi.hidden=!a.user),Ha(),Me("[data-user-id]",a.user?.id||"guest"),Me("[data-wallet-count]",Ks()),Me("[data-total-sol]",It().toFixed(4));const u=at();Me("[data-position-count]",u.length),Me("[data-realized]",Lc()),Me("[data-top-sol]",`${It().toFixed(4)} SOL`),Me("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Me("[data-sync-health]",r?Wr():"Sync idle"),Me("[data-active-preset-label]",Ef()),Ys(),Xf(),Ct("[data-refresh-spinner]",!a.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!Yp||!zp(Se)});const d=p("[data-user-avatar]");d&&(d.innerHTML=Va("SW"));const m=p("[data-top-avatar]");m&&(m.innerHTML=Va("SW"));const f=a.user?.connectedWallet||null;Me("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:a.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=p("[data-logout]");y&&(y.hidden=!a.user,y.disabled=!!a.logoutPending,v(y,a.logoutPending?"Logging out...":"Log Out")),a.route==="terminal"&&rh(),zf(s),xh(),Bh(),Cl(),ya(),va(),eo(),rr(),Ve(),O(),Lv("render"),On(),se();const b=C()-t;(b>=16||a.perfRenderCounts[n]%20===0)&&E({component:"render",action:"render",durationMs:b,resultCount:a.perfRenderCounts[n],details:n}),Ii=Date.now()}catch(r){Ha(),On(),xs({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const o=p("[data-panel]");a.route==="terminal"&&o?(ee.hidden=!1,o.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. Tap retry to redraw this panel without closing the window.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `):a.route==="terminal"&&ee&&(ee.hidden=!1,ee.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. The display refresh failed, but the app did not reload or submit another order.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function qc(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const n=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(n)return`connected:${String(n).toLowerCase()}`;const r=Array.isArray(a.wallets)&&a.wallets.length?a.wallets.map(o=>o.publicKey||o.address||o.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function jf(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${qc(e)}`)==="yes"}catch{return!1}}function Hc(e,t=""){try{const n=`tpslAutoRevoked:${qc(t)}`;e?sessionStorage.setItem(n,"yes"):sessionStorage.removeItem(n)}catch{}}function Js(e=""){Hc(!1,e)}function Kc(){return!!(Array.isArray(a.wallets)&&a.wallets.length||a.user?.connectedWallet||a.connectedWalletBalance?.publicKey)}function Vc(){const e=a.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),n=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!a.user?.automationPermissionActive&&!n&&!e.revokedAt}function Gf(){return!(!Kc()||jf()||Vc()||a.tpslAutoEnableInFlight)}function zc(e="wallet-session"){if(!Gf())return;const t=C();a.tpslAutoEnableScheduledAt&&t-a.tpslAutoEnableScheduledAt<2e3||(a.tpslAutoEnableScheduledAt=t,a.tpslAutoEnableInFlight=!0,setTimeout(()=>{bl("enable",{auto:!0,reason:e}).catch(n=>{a.automationDelegationStatus=n?.message||"TP/SL auto-enable failed.",$(a.automationDelegationStatus)}).finally(()=>{a.tpslAutoEnableInFlight=!1,Ys()})},50))}function Ys(){const e=p("[data-tpsl-status-button]");if(!e)return;const t=p("[data-tpsl-status-label]"),n=a.user?.automationPermission||{},r=!!a.user?.automationPermissionActive,o=!!n.revokedAt,s=Date.parse(n.expiresAt||""),c=!!n.enabled&&Number.isFinite(s)&&s<=Date.now(),i=r?"enabled":o||c?"invalid":"disabled";e.dataset.tpslState=i;const u=i==="enabled"?"TP/SL Enabled":i==="invalid"?"Re-enable TP/SL":"Enable TP/SL";v(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=i==="enabled"?`Server exits enabled${n.expiresAt?` until ${ve(n.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Xf(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0,r=!!(t||n),o=r?"Connected":"Connect",s=t?"Wallet: Connected":n?`Wallets: ${n}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:n?`${n} SlimeWire wallet${n===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(i=>{i.dataset.walletState=r?"connected":"disconnected",i.title=c,i.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=i.querySelector("[data-top-wallet-connect-label]")||i;v(u,o)}),document.querySelectorAll("[data-top-wallet-status]").forEach(i=>{i.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",i.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",i.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),v(i,s)})}async function Jf(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0;if(t){await Ae({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await _u();return}if(n>0){ke("/terminal","wallets");return}ca({returnPath:"/terminal"})}function Yf(e=document){const t=()=>{const n=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!n)return;const r=Math.max(0,n.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const jc=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Qf=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Zf(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Nn(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function Qs(e=p("[data-panel]")){if(!e||a.route!=="terminal"||!jc.has(a.activeTab))return null;const t=e.dataset.renderedTab,n=document.scrollingElement||document.documentElement,r={tab:a.activeTab,windowY:window.scrollY||0,documentY:n?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ee?.scrollTop||0,anchorKey:"",anchorTop:0},o=Array.from(e.querySelectorAll(Qf));if(t&&t!==a.activeTab&&!o.length||!o.length)return r;const s=o.find(i=>{const u=i.getBoundingClientRect(),d=Nn()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||o[0],c=s?.dataset?.tokenChart||s?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:s?s.getBoundingClientRect().top:0}}function Zs(e,t=p("[data-panel]")){if(!e||a.route!=="terminal"||e.tab!==a.activeTab)return;const n=(s,c)=>{if(!s||!Number.isFinite(Number(c))||s.scrollHeight<=s.clientHeight+2)return;const i=Math.max(0,Math.min(Number(c),s.scrollHeight-s.clientHeight));Math.abs((s.scrollTop||0)-i)>4&&(s.scrollTop=i)},r=s=>{const c=document.scrollingElement||document.documentElement;n(ee,e.dashboardScrollTop),n(s,e.panelScrollTop),n(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},o=()=>{const s=t?.isConnected?t:p("[data-panel]");let c=!1;if(e.anchorKey&&s){const i=Zf(e.anchorKey),u=s.querySelector(`[data-token-chart="${i}"], [data-token-mint="${i}"]`);if(u){const m=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(m)&&Math.abs(m)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+m)),c=!0}}c||r(s)};o(),requestAnimationFrame(()=>{o(),window.setTimeout(o,90),window.setTimeout(o,240),Nn()&&window.setTimeout(o,520)})}function Gc(e,t){const n=Object.keys(e.dataset||{}).filter(s=>s!=="customFor"&&s!=="customSelect").sort().map(s=>`${s}=${e.dataset[s]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",o=`${e.tagName}:${e.type||""}:${e.name||""}:${n}${r}`;return n?o:`${o}:idx${t}`}function Xc(e){const t=Array.from(e.options||[]),n=t.find(r=>r.defaultSelected);return n?n.value:t[0]?.value??""}function eh(e){if(!e||e.dataset.renderedTab!==a.activeTab)return null;const t=new Map;let n="",r=null,o=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((s,c)=>{const i=Gc(s,c);if(t.has(i))return;const u=s.type==="checkbox"||s.type==="radio",d=s.tagName==="SELECT",m=u?String(s.defaultChecked):d?Xc(s):s.defaultValue,f=u?String(s.checked):s.value;if(f!==m&&(t.set(i,{value:f,defaultValue:m,isToggle:u,isSelect:d}),document.activeElement===s)){n=i;try{r=s.selectionStart,o=s.selectionEnd}catch{}}}),t.size?{tab:a.activeTab,fields:t,focusedKey:n,selectionStart:r,selectionEnd:o}:null}function th(e,t){if(!e||!t||e.tab!==a.activeTab)return;const n=Array.from(t.querySelectorAll("input, textarea, select")),r=o=>{n.forEach((s,c)=>{const i=s.tagName==="SELECT";if(o!==i)return;const u=Gc(s,c),d=e.fields.get(u);if(!d)return;const m=s.type==="checkbox"||s.type==="radio";if((m?String(s.defaultChecked):i?Xc(s):s.defaultValue)===d.defaultValue&&(m?s.checked=d.value==="true":s.value=d.value,u===e.focusedKey&&document.activeElement!==s))try{s.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&s.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function ah(e){return!e||a.route!=="terminal"||a.activeTab==="terminal"||jc.has(a.activeTab)||e.dataset.renderedTab!==a.activeTab||a.activeTab==="smartChart"&&a.chartScrollIntoView?null:{tab:a.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ee?.scrollTop||0}}function nh(e,t){if(!e||e.tab!==a.activeTab)return;const n=()=>{const r=t?.isConnected?t:p("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),ee&&ee.scrollHeight>ee.clientHeight+2&&(ee.scrollTop=Math.min(e.dashboardScrollTop,ee.scrollHeight-ee.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};n(),requestAnimationFrame(n)}function rh(){const e=p("[data-panel]");if(!e)return;const t=Qs(e),n=eh(e),r=ah(e),o=a.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,s=a.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),sS(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===a.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const i=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!a.navTekOpen||!Sm()&&i}),a.activeTab==="terminal"&&(e.innerHTML=up()),a.activeTab==="tek"&&(e.innerHTML=sh()),a.activeTab==="dashboard"&&(e.innerHTML=mh()),a.activeTab==="profile"&&(e.innerHTML=fh()),a.activeTab==="trade"&&(e.innerHTML=eg()),a.activeTab==="bundle"&&(e.innerHTML=lg()),a.activeTab==="volume"&&(e.innerHTML=Lg()),a.activeTab==="live"&&(e.innerHTML=up()),a.activeTab==="liveTrades"&&(e.innerHTML=Vv()),a.activeTab==="slimeScope"&&(e.innerHTML=kv()),a.activeTab==="watchlist"&&(e.innerHTML=aw()),a.activeTab==="smartChart"&&(e.innerHTML=Ev()),a.activeTab==="launchCoin"&&(e.innerHTML=Wg()),a.activeTab==="launch"&&(e.innerHTML=xg()),a.activeTab==="kol"&&(e.innerHTML=tb()),a.activeTab==="ogreAi"&&(e.innerHTML=sg()),a.activeTab==="wallets"&&(e.innerHTML=Ty()),a.activeTab==="positions"&&(e.innerHTML=xy()),a.activeTab==="pnl"&&(e.innerHTML=Oy()),a.activeTab==="txAudit"&&(e.innerHTML=np()),a.activeTab==="sniper"&&(e.innerHTML=sw()),e.dataset.renderedTab=a.activeTab||"",a.activeTab==="ogreTek"&&(e.innerHTML=fw(),e.dataset.renderedTab=a.activeTab||"",pw()),th(n,e),zr(e),nh(r,e),a.activeTab==="smartChart"&&a.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=p("[data-chart-buy-amount]");c&&c.focus(),a.chartFocusAmountInput=!1}),a.activeTab==="smartChart"&&a.chartScrollIntoView&&(Yf(e),a.chartScrollIntoView=!1),a.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=o),requestAnimationFrame(()=>{Math.abs(window.scrollY-s)>8&&window.scrollTo(0,s);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=o)})}Zs(t,e),Lf(),ia(),Or(),Mn(),Er(),Us(),a.activeTab==="kol"&&hl()}function oh(){const e=a.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${l(a.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${l(It().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${l(a.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${l(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function sh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${oh()}
      <div class="tek-tool-grid">
        ${e.map(([t,n,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${l(n)}</strong>
            <small>${l(r)}</small>
          </button>`).join("")}
      </div>
      ${ch()}
      ${uh()}
    </section>
  `}const Jc="slimewire-ogre-memory";function Nr(){try{return JSON.parse(localStorage.getItem(Jc)||"{}")||{}}catch{return{}}}function Dr(e={}){const t={...Nr(),...e};try{localStorage.setItem(Jc,JSON.stringify(t))}catch{}return t}function lh(e,t=""){if(!e)return;const r=(Nr().recentTokens||[]).filter(o=>o.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),Dr({recentTokens:r.slice(0,5)})}(function(){const t=Nr();t.quickBuy&&!a.quickBuyAmountOverride&&(a.quickBuyAmountOverride=t.quickBuy)})();function Yc(){const t=Xn().filter(i=>{const u=Number(i.marketCapUsd??i.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active"].includes(String(i.status||"").toLowerCase())),o=r.filter(i=>{const u=Number(i.lastMovePct??i.wallets?.[0]?.lastMovePct),d=Number(i.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,s=Number(a.shieldReceipts?.stats?.watching||0),c=Number(a.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${o?` - ${o} near take-profit`:""}`:"",s?`🔎 ${s} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let Qc=!1;function ih(){if(Qc||sn().length)return;Qc=!0;const e=Yc(),t=Nr(),n=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=n.length?` I remember: ${n.join(", ")}.`:"";ce({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function ch(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...Yc(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${l(t)}</li>`).join("")}
      </ul>
    </section>
  `}function uh(){ph();const e=a.shieldReceipts;if(!e)return`
      <section class="trade-card shield-receipts-card">
        <div class="trade-head"><div><h3>SlimeShield Receipts</h3><p>Loading flagged-token outcomes...</p></div></div>
      </section>
    `;const t=(e.receipts||[]).filter(r=>r.outcome==="rugged").slice(0,8),n=e.stats||{};return`
    <section class="trade-card shield-receipts-card">
      <div class="trade-head">
        <div>
          <h3>SlimeShield Receipts</h3>
          <p>Every AVOID/RISK flag is recorded, then we check what happened. ${Number.isFinite(n.hitRatePct)&&n.hitRatePct!==null?`<strong>${n.hitRatePct}%</strong> of resolved flags went on to rug or die.`:"Outcomes resolve after the market moves."}</p>
        </div>
        <span>${n.flagged||0} flagged | ${n.rugged||0} rugged | ${n.watching||0} watching</span>
      </div>
      ${t.length?`
        <div class="table-list compact-table">
          ${t.map(r=>`
            <article class="row-card">
              <div class="row-main">
                <strong>$${l(r.symbol||w(r.mint))} <span class="negative">rugged</span></strong>
                <span>Flagged ${l(r.verdict)} (score ${l(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${l(dh(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${l(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function dh(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let Zc=0;function ph(){Date.now()-Zc<300*1e3||(Zc=Date.now(),k("/api/web/shield/receipts").then(e=>{a.shieldReceipts=e,a.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{a.proofStats=e?.alpha||null}).catch(()=>{}))}function mh(){return`
    ${Th()}
    ${Ka()}
    <section class="panel-grid">
      ${Dn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Dn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Dn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Dn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Dn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${ru()}
    ${nu()}
    ${ou()}
  `}function fh(){if(!el())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${tu(!1)}
        <section class="profile-row-list">
          ${Sh()}
          ${au()}
        </section>
        ${eu()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:kh()},{key:"login",label:"Login",hint:"Security",html:$h()},{key:"pfp",label:"PFP",hint:"Avatar",html:Ph()},{key:"x",label:"X",hint:"Connect X",html:Rh()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:hh()},{key:"badges",label:"Badges",hint:"Earned",html:au()},{key:"referral",label:"Referral",hint:"Invite & earn",html:Ih()},{key:"board",label:"Board",hint:"Top traders",html:Eh()}];return`
    <section class="profile-row-shell">
      ${tu(!0)}
      ${ja({toolKey:"profile",activeKey:Ga("profile","account"),sections:t})}
      ${eu()}
    </section>
  `}function eu(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function hh(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",n=a.pushAlertsEnabled===!0;return`
    <article class="profile-card">
      <div>
        <h3>Push Alerts</h3>
        <p>${l(e?t==="denied"?"Notifications are blocked for this site. Enable them in your browser settings, then try again.":n?"Push alerts are ON for this device. TP/SL fires and KOL copies ping you even with the site closed.":"Turn on push alerts to get pinged the moment a stop-loss or take-profit fires - no need to keep the tab open.":"This browser does not support push alerts. On iPhone, add SlimeWire to your Home Screen first (Share - Add to Home Screen).")}</p>
      </div>
      <div class="card-actions compact">
        ${e&&t!=="denied"?`
          <button class="primary" data-push-enable ${n?"hidden":""}>Enable Push Alerts</button>
          <button data-push-disable ${n?"":"hidden"}>Disable On This Device</button>`:""}
        <button data-telegram-link title="One tap: links this account to your Telegram so your take-profit wins can post in your groups (after /mywins on there)">Track Wins in Telegram</button>
      </div>
      <small data-push-status></small>
    </article>
  `}async function gh(){const e=p("[data-push-status]");try{v(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){v(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),v(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){v(e,W(t?.message||"Could not create the link."))}}function bh(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(n);return Uint8Array.from([...r].map(o=>o.charCodeAt(0)))}async function yh(){const e=p("[data-push-status]");try{v(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){v(e,"Push alerts are not configured on the server yet.");return}const n=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){v(e,"Notification permission was not granted.");return}const o=await n.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:bh(t.publicKey)}),s=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:o.toJSON()})});a.pushAlertsEnabled=!0,v(e,`Push alerts enabled (${s.devices||1} device${(s.devices||1)===1?"":"s"}).`),h()}catch(t){v(e,W(t?.message||"Could not enable push alerts."))}}async function vh(){const e=p("[data-push-status]");try{const n=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:n.endpoint})}).catch(()=>{}),await n.unsubscribe().catch(()=>{})),a.pushAlertsEnabled=!1,v(e,"Push alerts disabled on this device."),h()}catch(t){v(e,W(t?.message||"Could not disable push alerts."))}}async function wh(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a.pushAlertsEnabled=!!t}catch{}}function el(){return!!(le()?.publicKey||a.user?.connectedWallet?.publicKey||Array.isArray(a.wallets)&&a.wallets.length)}function tu(e=el()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function Sh(){const e=le();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Ur().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${l(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${l(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function kh(){const e=a.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Va("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${l(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${l(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function $h(){const e=a.user?.username||"";return`
    <section class="profile-card login-security-card">
      <div>
        <h3>Saved Login</h3>
        <p>${e?`Username saved: ${l(e)}. Update the password here any time.`:"Add a username and password so this profile follows you across browsers and devices."}</p>
      </div>
      <label>
        Username
        <input data-profile-username type="text" autocomplete="username" placeholder="slimewire" value="${l(e)}">
      </label>
      <label>
        Password
        <input data-profile-password type="password" autocomplete="new-password" placeholder="${a.user?.hasPasswordLogin?"New password":"8+ characters"}">
      </label>
      <button type="button" class="primary" data-save-login-credentials>${e?"Update Login":"Save Login"}</button>
      <small data-login-security-status>${a.user?.hasPasswordLogin?"Password login is active for this profile.":"Password is stored as a salted hash. Private keys are not shown or emailed."}</small>
    </section>
  `}function Th(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Dn(e,t,n,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${l(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${l(t)}</h3>
        <p>${l(n)}</p>
      </div>
    </article>
  `}function Ph(){const e=!!a.user?.avatar,t=a.xHandle?`@${a.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Va("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${Ah()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${a.xHandle?"":"disabled"}>${t?`Use ${l(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${a.user.avatarSource?` from ${l(a.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function Ah(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,n])=>`
        <button type="button" data-preset-avatar="${l(t)}" data-avatar-label="${l(n)}" aria-label="Use ${l(n)} PFP">
          <img src="${l(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function au(){const e=Number(a.pnl?.totals?.tradeCount||0),t=el(),n=Number(a.livePairRows?.length||0)+Number(a.terminalEntry?.items?.length||0)+Number(a.livePairsByBucket?.fresh?.length||0),r=!!(a.lastUpdatedAt&&!a.walletRefreshError||a.walletRefreshStatus==="success"),o=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:n>0||!!a.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!ne("trade",a.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(a.livePairRows?.length||a.scan||a.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],s=o.filter(i=>i.earned).length,c=Math.round(s/Math.max(1,o.length)*100);return`
    <section class="create-wallet-card badge-showcase-card">
      <div class="badge-showcase-head">
        <div>
          <h3>Badge Window Hub</h3>
          <p>Quest badges unlock as the account gets ready. They are visual status marks only and never expose private wallet data.</p>
        </div>
        <strong>${s}/${o.length}</strong>
      </div>
      <div class="badge-progress" aria-label="Badge progress ${c}%">
        <span style="width:${c}%"></span>
      </div>
      <div class="badge-grid">
        ${o.map(({label:i,detail:u,earned:d,icon:m,quest:f})=>`
          <article class="earned-badge ${d?"is-earned":""}">
            <span class="earned-badge-icon">
              <img src="${l(m)}" alt="" aria-hidden="true">
            </span>
            <span class="earned-badge-quest">${l(f)}</span>
            <strong>${l(i)}</strong>
            <small>${d?"Earned":"Locked"} - ${l(u)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Ka(){const e=a.user?.connectedWallet,t=!!a.user?.avatar,n=a.xHandle?`@${a.xHandle}`:"";return`
    <section class="create-wallet-card setup-hub-card">
      <article class="setup-hub-panel">
        <h3>Create Wallet Set</h3>
        <p>Create fresh managed wallets. Backup files download immediately after creation.</p>
        <label>
          Label
          <input data-wallet-label type="text" placeholder="Ogre Web">
        </label>
        <label>
          Count
          <input data-wallet-count-input type="number" min="1" max="20" value="1">
        </label>
        <button class="primary" type="button" data-create-wallets>Create Wallets</button>
        <small data-create-wallet-status></small>
      </article>

      <article class="setup-hub-panel">
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or a detected Solana wallet. Public address only.</p>
        <div class="wallet-provider-buttons">
          ${Ur().map(r=>`
            <button type="button" data-connect-wallet="${r.id}" ${r.detected?"":`title="${l(r.label)} extension not detected"`}>
              ${l(e?`Switch ${r.label}`:r.label)}
            </button>
          `).join("")}
        </div>
        <div class="connected-wallet-box">
          ${e?`
            <span>${l(e.provider||"Solana Wallet")}</span>
            <code>${l(e.publicKey)}</code>
            <div class="card-actions compact">
              <button type="button" data-copy="${l(e.publicKey)}">Copy</button>
              <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
              <button type="button" data-connect-wallet="solana">Reconnect</button>
              <button type="button" data-disconnect-wallet>Disconnect</button>
            </div>
          `:"<small>No wallet connected yet.</small>"}
        </div>
        <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||w(e.publicKey))}.`:"Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      ${tl()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${Va("SW")}</div>
          <div>
            <h3>Profile PFP</h3>
            <p>Upload your panel PFP or pull your public X picture.</p>
          </div>
        </div>
        <label>
          Upload Image
          <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
        </label>
        <div class="profile-actions">
          <button type="button" data-use-x-avatar ${a.xHandle?"":"disabled"}>${n?`Use ${l(n)} PFP`:"Use X PFP"}</button>
          ${t?'<button type="button" data-clear-avatar>Remove</button>':""}
        </div>
        <small data-avatar-status>${t?`PFP saved${a.user.avatarSource?` from ${l(a.user.avatarSource)}`:""}.`:"Optional. Connect X first if you want to use your X PFP."}</small>
      </article>

      <article class="setup-hub-panel">
        <h3>X Profile</h3>
        <p>Save, change, or unlink the handle used for share buttons, watch posts, and PFP import.</p>
        <label>
          X Handle
          <input data-x-handle type="text" placeholder="@yourhandle" value="${l(a.xHandle?`@${a.xHandle}`:"")}">
        </label>
        <div class="profile-actions">
          <button type="button" data-connect-x>${a.xHandle?"Save Different X":"Save X Handle"}</button>
          <button type="button" data-open-x-login>${a.xHandle?"Open X Profile":"Open X Login"}</button>
          ${a.xHandle?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
        </div>
        <small data-x-status>${a.xHandle?`Saved as @${l(a.xHandle)}. Type another handle and save to change it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
      </article>
    </section>
  `}function MS(){const e=a.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Ur().map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} extension not detected"`}>
            ${l(e?`Switch to ${t.label}`:t.label)}
          </button>
        `).join("")}
      </div>
      <div class="connected-wallet-box">
        ${e?`
          <span>${l(e.provider||"Solana Wallet")}</span>
          <code>${l(e.publicKey)}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${l(e.publicKey)}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-connect-wallet="solana">Reconnect</button>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
        `:`
          <span>No browser wallet connected yet.</span>
          <small>Use this for identity, quick copying, and future non-custodial features. Managed bot wallets stay separate.</small>
        `}
      </div>
      <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||w(e.publicKey))}.`:"Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
    ${tl({compact:!0})}
  `}function tl({compact:e=!1}={}){const t=a.user?.connectedWallet,n=Array.isArray(a.wallets)?a.wallets.length:0,r=a.wallets.filter(u=>u.sessionWallet),o=a.user?.automationPermission||{},s=!!a.user?.automationPermissionActive,c=o.expiresAt?ve(o.expiresAt):"",i=a.automationDelegationStatus||(n?`${n} managed automation wallet(s) available. ${s?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
    <article class="setup-hub-panel automation-delegation-card ${e?"compact":""}">
      <div class="delegation-heading">
        <span class="delegation-mode-badge">${s?"Automation Enabled":"TP/SL Auto-Enabled"}</span>
        <h3>Automation Wallet</h3>
      </div>
      <p>Server-side stop-loss, take-profit, and timer exits auto-enable for the active wallet session. Managed/imported SlimeWire wallets and funded session wallets can run through the saved flow.</p>
      <ul class="delegation-steps">
        <li>Scope: managed/imported/session SlimeWire wallets only.</li>
        <li>Allowed actions: TP/SL exits and timer exits.</li>
        <li>Session limit: only the SOL you approve into the session wallet can be automated.</li>
      </ul>
      <div class="session-wallet-controls">
        <label>
          Session Budget SOL
          <input data-session-wallet-amount type="number" min="0.005" max="10" step="0.005" inputmode="decimal" value="0.10">
        </label>
        <button class="primary" type="button" data-create-session-wallet ${t?"":"disabled"}>${r.length?"Fund New Session":"Start Session Wallet"}</button>
        <small>${t?"One wallet approval funds a limited session wallet for presets, Ogre A.I., TP/SL, timers, and sells.":"Connect Phantom/Solflare first to fund a session wallet."}</small>
      </div>
      <div class="profile-actions">
        ${s?'<button type="button" class="danger-lite" data-automation-permission="revoke">Disable TP/SL</button>':'<button class="primary" type="button" data-automation-permission="enable">Enable TP/SL Now</button>'}
        <button class="primary" type="button" data-create-automation-wallet>${n?"Create Another":"Create Automation Wallet"}</button>
        <button type="button" data-tab="wallets">Manage Wallets</button>
        ${t?'<button type="button" data-connect-wallet="solana">Switch Connected Wallet</button>':""}
      </div>
      <small data-automation-delegation-status>${l(i)}</small>
    </article>
  `}function ca({returnPath:e="/terminal"}={}){a.walletConnectMenuOpen=!0,a.walletConnectReturnPath=e||"/terminal",a.walletConnectStatus=a.user?.connectedWallet?`Connected ${w(a.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function Ch(e={}){return ca(e)}window.openWalletConnectModal=Ch;function Lh(e){a.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",a.walletFastApprovalsEnabled?"on":"off")}catch{}}function xh(){const e=p("[data-wallet-connect-modal]");if(!e)return;if(!a.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=a.user?.connectedWallet||a.connectedWalletBalance;e.hidden=!1,nr(e,`
    <div class="wallet-connect-backdrop" data-wallet-connect-close></div>
    <section class="wallet-connect-dialog" role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div class="wallet-connect-dialog-head">
        <div>
          <h3>${t?"Reconnect Wallet":"Connect Wallet"}</h3>
          <p>${t?"Switch to a different wallet or disconnect the current public wallet.":"Connect Phantom, Solflare, Backpack, or another Solana wallet. Private keys never leave your wallet."}</p>
        </div>
        <button type="button" class="icon-button" data-wallet-connect-close aria-label="Close wallet connection panel">x</button>
      </div>
      ${t?`
        <div class="connected-wallet-box modal-connected-wallet">
          <span>${l(t.provider||"Solana Wallet")}</span>
          <code>${l(t.publicKey||"")}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${l(t.publicKey||"")}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(t.publicKey||"")}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-wallet-fast-approvals-toggle>${a.walletFastApprovalsEnabled?"Fast approvals On":"Fast approvals Off"}</button>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
          <small>Fast approvals keeps SlimeWire ready and opens your wallet prompt immediately. Phantom/Solflare still require you to approve each transaction.</small>
        </div>
      `:""}
      <div class="wallet-provider-buttons modal-wallet-provider-buttons">
        ${Ur().map(n=>`
          <button type="button" class="wallet-provider-choice" data-connect-wallet-provider="${n.id}" ${n.detected?"":`title="${l(n.label)} ${n.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            <img src="${l(n.icon)}" alt="" aria-hidden="true">
            <span>
              <strong>${l(t?`Switch to ${n.label}`:n.mobileRedirect?`Open ${n.label}`:n.label)}</strong>
              <small>${n.detected?"Detected - connect prompt opens here":n.mobileRedirect?"Mobile wallet flow":"Install/open wallet or choose another"}</small>
            </span>
          </button>
        `).join("")}
        <button type="button" class="wallet-provider-choice" data-connect-create-wallet>
          <img src="./assets/slimewire/svg/icons/wallet.svg" alt="" aria-hidden="true">
          <span>
            <strong>Create Managed Wallet</strong>
            <small>Use a SlimeWire-managed wallet for backend automation.</small>
          </span>
        </button>
      </div>
      <small class="connect-status" data-wallet-connect-status>${l(a.walletConnectStatus||"")}</small>
    </section>
  `,".wallet-connect-dialog")}function Mh(){const e=a.quickBuyModal||{},t=wo()?.tokenMint===e.tokenMint?wo():he(e.tokenMint,{source:e.source||"quick-buy-modal"}),n=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=al(e.error||e.status||""),o=n||!!r,s=ie(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${ct(t)}
          <div>
            <h3>Quick Buy</h3>
            <p>${l(t.symbol||w(e.tokenMint))} - ${l(w(e.tokenMint))}</p>
          </div>
        </div>
        <button type="button" class="icon-button" data-quick-buy-close aria-label="Close Quick Buy">x</button>
      </div>
      <label>
        Wallet
        <select data-quick-buy-modal-wallet>
          ${za(e.walletIndex||(le()?.publicKey?"connected":""))}
        </select>
      </label>
      <label>
        SOL amount
        <input data-quick-buy-modal-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
      </label>
      <label>
        Slippage
        <select data-quick-buy-modal-slippage>
          <option value="300" ${String(e.slippageBps||"400")==="300"?"selected":""}>3%</option>
          <option value="400" ${String(e.slippageBps||"400")==="400"?"selected":""}>4%</option>
          <option value="500" ${String(e.slippageBps||"400")==="500"?"selected":""}>5%</option>
        </select>
      </label>
      <div class="quick-buy-presets">
        ${["0.1","0.25","0.5","1"].map(c=>`<button type="button" data-quick-buy-modal-preset="${c}">${c} SOL</button>`).join("")}
      </div>
      <div class="quick-buy-actions">
        <button type="button" data-token-chart="${l(e.tokenMint||"")}" data-token-chart-source="quick-buy-modal">${r?"Open Chart":"Chart"}</button>
        <button type="button" data-token-trade="${l(e.tokenMint||"")}" data-token-trade-source="quick-buy-modal">Full Trade</button>
        ${N("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(e.tokenMint||"")}" data-protected-buy-source="quick-buy-modal">Protected</button>`:""}
        <button type="button" class="primary" data-quick-buy-confirm ${o?"disabled":""}>${n?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${s?`<small class="quick-buy-wallet-note">${a.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${l(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${l(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${l(e.error||"")}</small>`}
    </section>
  `}function al(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function Bh(){let e=p("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!a.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=Mh(),document.body.classList.add("quick-buy-modal-open")}function Rh(){const e=!!a.xHandle;return`
    <section class="create-wallet-card x-connect-card">
      <div>
        <h3>X Profile</h3>
        <p>Save, change, or unlink the X handle used for share buttons on PnL cards, trades, scanner picks, watchlists, KOL signals, and launch watches. Posts always open in X for review first.</p>
      </div>
      <label>
        X Handle
        <input data-x-handle type="text" placeholder="@yourhandle" value="${l(a.xHandle?`@${a.xHandle}`:"")}">
      </label>
      <button type="button" data-connect-x>${e?"Save Different X":"Save X Handle"}</button>
      <button type="button" data-open-x-login>${e?"Open X Profile":"Open X Login"}</button>
      ${e?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
      <small data-x-status>${e?`Saved as @${l(a.xHandle)}. Enter a different handle and tap Save Different X to change it, or Unlink X to remove it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
    </section>
    <section class="create-wallet-card x-watch-card">
      <div>
        <h3>Share Watch</h3>
        <p>Post a coin, CA, ticker, or KOL you are watching without buying. Good for calls, watchlists, and community alerts.</p>
      </div>
      <label>
        Coin / CA / Ticker
        <input data-share-watch-token type="text" placeholder="Example: $OGRE or token CA">
      </label>
      <label>
        KOL Wallet / Handle
        <input data-share-watch-kol type="text" placeholder="Example: @kol or wallet address">
      </label>
      <div class="share-watch-actions">
        <button type="button" class="primary" data-share-watch-token-btn>Share Coin</button>
        <button type="button" data-share-watch-kol-btn>Share KOL</button>
      </div>
      <small data-share-watch-status></small>
    </section>
  `}function Ih(){const e=a.user?.referralCode||"",t=`${Pt.replace(/\/+$/,"")}/r/`,n=a.user?.referralLink||(e?`${Pt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=a.user?.referralStats||{},o=Array.isArray(r.referrals)?r.referrals:[];return`
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. This is separate from the trader board.</p>
      </div>
      <div class="referral-stats-grid">
        <span><small>Total earned</small><strong>${l(r.totalSol||"0")} SOL</strong></span>
        <span><small>Payouts</small><strong>${l(r.payoutCount||0)}</strong></span>
        <span><small>Referral users</small><strong>${l(o.length)}</strong></span>
      </div>
      ${o.length?`
        <div class="referral-breakdown">
          ${o.slice(0,6).map(s=>`
            <div class="referral-breakdown-row">
              <span>${l(s.userId||"user")}</span>
              <strong>${l(s.sol||"0")} SOL</strong>
              <small>${l(s.payoutCount||0)} payout${Number(s.payoutCount||0)===1?"":"s"}</small>
            </div>
          `).join("")}
        </div>
      `:"<small>No referral payouts yet. They will appear here when referred users trade and referral fees are paid.</small>"}
      ${n?`
        <label class="referral-link-field">
          Your Referral Link
          <div class="referral-link-builder">
            <span>${l(t)}</span>
            <input data-referral-code type="text" inputmode="latin" autocomplete="off" maxlength="24" placeholder="your-code" value="${l(e)}" aria-label="Your custom referral code">
          </div>
          <input data-referral-link type="hidden" value="${l(n)}">
        </label>
      `:`<input data-referral-code type="text" inputmode="latin" autocomplete="off" maxlength="24" placeholder="your-code" value="${l(e)}" aria-label="Your custom referral code">`}
      <div class="referral-code-row">
        <div class="profile-actions referral-code-actions">
          <button type="button" data-generate-referral-code>Generate</button>
          <button type="button" class="primary" data-save-referral>Save Link</button>
        </div>
      </div>
      <small class="referral-code-help">The SlimeWire link stays locked. Delete only the code after /r/, enter your custom tag, pick the payout wallet for referral fees, then Save Link. Use letters, numbers, dash, or underscore. Once saved, no other SlimeWire profile can claim the same code.</small>
      <label>
        Referral Payout Wallet
        <input data-referral-wallet type="text" placeholder="Wallet for referral fees" value="${l(a.user?.referralPayoutWallet||"")}">
      </label>
      <div class="card-actions">
        <button type="button" data-save-referral>Save Payout Wallet</button>
        ${n?`<button type="button" data-copy="${l(n)}">Copy Referral Link</button>`:""}
        ${n?ze(`Trade faster on SlimeWire. Referral: ${n}`,"Share X"):""}
        ${n?su(`Trade faster on SlimeWire. Referral: ${n}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${l(e)}${a.user?.referredByCode?` | Referred by ${l(a.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function Oh(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Pt).pathname.split("/").map(s=>s.trim()).filter(Boolean),o=r.findIndex(s=>s.toLowerCase()==="r");if(o>=0&&r[o+1])return decodeURIComponent(r[o+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function Eh(){const e=a.user?.traderBoardWalletMode||"all",t=Array.isArray(a.user?.traderBoardWalletIndexes)?a.user.traderBoardWalletIndexes:a.wallets.map(n=>String(n.index));return`
    <section class="create-wallet-card trader-board-card">
      <div>
        <h3>Top SlimeWire Traders</h3>
        <p>Opt in only if you want your SlimeWire trade stats shown on the KOL board. Choose all bot wallets or only the wallets you want counted.</p>
      </div>
      <label class="checkbox-line">
        <input data-show-trader-board type="checkbox" ${a.user?.showOnTraderBoard?"checked":""}>
        Show me on Top SlimeWire Traders
      </label>
      <label>
        Tracked Wallets
        <select data-trader-board-wallet-mode>
          <option value="all" ${e==="all"?"selected":""}>All SlimeWire wallets</option>
          <option value="manual" ${e==="manual"?"selected":""}>Only selected wallets</option>
        </select>
      </label>
      <div class="wallet-checks preset-wallets trader-board-wallets">
        ${a.wallets.length?bt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${a.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function nu(){return`
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Backup / Restore</h3>
        <p>Load bot backup files or pasted recovery text back into this web account. Keep backup files private.</p>
      </div>
      <label>
        Backup File
        <input data-restore-file type="file" accept=".txt,.json,text/plain,application/json">
      </label>
      <label class="wide-field">
        Backup Text
        <textarea data-restore-text rows="5" placeholder="Paste the wallet-backup text here, or choose the backup .txt file above."></textarea>
      </label>
      <button data-restore-backup>Restore Wallets</button>
      <button type="button" class="secondary" data-export-backup>Download Current Backup</button>
      <small data-restore-status>${a.restoreResult?l(a.restoreResult.message||"Restore complete."):""}</small>
      <small data-export-status>${a.backupResult?l(a.backupResult.message||"Backup ready."):""}</small>
    </section>
  `}function ru(){return`
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Import Wallet</h3>
        <p>Paste a base58 private key or JSON secret-key array. The bot encrypts it with this account and immediately downloads fresh backup files.</p>
      </div>
      <label>
        Label
        <input data-import-label type="text" placeholder="Imported Wallet">
      </label>
      <label class="wide-field">
        Private Key / Secret Key
        <textarea data-import-secret rows="5" placeholder="Base58 private key or [12,34,...] secret key"></textarea>
      </label>
      <button data-import-wallet>Import</button>
      <small data-import-status>${a.importResult?l(a.importResult.message||"Import complete."):""}</small>
    </section>
  `}function ou(){return a.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function ze(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${l(e)}">${l(t)}</button>`}function su(e,t="TG"){const n=nl(e),r=`https://t.me/share/url?url=${encodeURIComponent(Pt)}&text=${encodeURIComponent(n)}`;return`<a href="${l(r)}" target="_blank" rel="noreferrer">${l(t)}</a>`}function nl(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Pt}`}function Fh(e){const t=e.type==="buy",n=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${n}. Chart ${J(e.tokenMint)}`}function BS(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function Wh(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function lu(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function Nh(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function Dh(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${J(e.tokenMint)}`}function _h(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${J(e.tokenMint)}`}function Uh(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function qh(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function rl(e){const t=String(e||"").trim(),n=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${J(t)}`:"";return`Watching ${n}.${r}`}function iu(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const Hh=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function ol(e=""){const t=String(e||"").trim().toLowerCase();return Hh.filter(n=>!t||String(n.tier||"").toLowerCase()===t).sort((n,r)=>+!!r.pinned-+!!n.pinned||Number(n.rank||999)-Number(r.rank||999))}function Et(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function cu(e=""){const t=String(e||"").trim();return Et(t)?t:""}function Kh(e={}){const t=String(e.wallet||"").trim(),n=cu(t),r=Ge(e.twitter||e.x||e.username||"");return{x:r?il(r):"",wallet:n?`https://solscan.io/account/${encodeURIComponent(n)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(n?sc(n):"")}}function Vh(e={}){const t=String(e.wallet||"").trim(),n=cu(t),r=Kh(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${l(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${l(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${l(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${n?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${n?`<button data-kol-scan-wallet="${l(n)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${n?`<button data-kol-copy-wallet="${l(n)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${n?`<button data-copy="${l(n)}">CA</button>`:""}
      ${fl(e)}
    </div>
  `}function uu(e={},t={}){const n=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${n?"is-compact":""}" data-tier="${l(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${mu(e,n?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${l(e.tag||"Curated wallet")}</span>
          <h3>${l(e.name||e.twitter||w(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${l(Ge(e.twitter))}`:l(w(r)||"Social pending")}</p>
        </div>
        <b>#${l(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${l(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${l(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${l(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${l(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${Vh(e)}
    </article>
  `}function zh(){const e=ol("hot"),t=ol("slimewire");return`
    <section class="curated-kol-board">
      <div class="trade-head curated-kol-head">
        <div>
          <h3>Curated KOL Copy Board</h3>
          <p>Hosted wallet database for hot Solana memecoin traders, with pinned rows we can cherry-pick to the top.</p>
        </div>
        <span>${l(e.length+t.length)} curated</span>
      </div>
      <div class="curated-kol-layout">
        <article class="curated-kol-main">
          <header>
            <h4>Hot Solana Wallets</h4>
            <p>Public wallets to scan, inspect, and copy-plan from your SlimeWire wallets.</p>
          </header>
          <div class="curated-kol-list">
            ${e.length?e.map(n=>uu(n)).join(""):R("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(n=>uu(n,{compact:!0})).join(""):R("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function Va(e="SW"){const t=gt(a.user?.avatar||"");if(du(t))return`<img src="${l(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${Zl("ogre")}';">`;const n=Zl("ogre");if(e==="SW"||e==="OG")return`<img src="${n}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${l(r)}</span>`}function du(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function gt(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const n=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return n?`https://ipfs.io/ipfs/${encodeURIComponent(n).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function jh(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function Gh(e="",t=""){const n=String(e||"").trim(),r=gt(t);if(!n||!r||_r(n,r))return"";if(pt.set(n,r),te("avatarCacheHit"),pt.size>900){for(const o of pt.keys())if(pt.delete(o),pt.size<=720)break}return r}function pu(e="",t=""){return`${String(e||"").trim()}|${gt(t)}`}function Xh(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function _r(e="",t=""){const n=pu(e,t);if(!Xt.has(n))return!1;const r=Number(dr.get(n)||0);return r&&Date.now()-r>Xh(t)?(Xt.delete(n),dr.delete(n),!1):!0}function Jh(e="",t=""){const n=String(e||"").trim(),r=gt(t);if(!n||!r)return;const o=pu(n,r);if(Xt.add(o),dr.set(o,Date.now()),Xt.size>1200){for(const s of Xt)if(Xt.delete(s),dr.delete(s),Xt.size<=900)break}pt.get(n)===r&&pt.delete(n),te("avatarFetchFailed")}function sl(e="",...t){const n=String(e||"").trim(),r=n?pt.get(n):"";if(r&&!_r(n,r))return te("avatarCacheHit"),r;r&&pt.delete(n);for(const o of t){const s=gt(o);if(s&&!_r(n,s))return te("avatarCacheMiss"),s}return te("avatarFallbackShown"),""}window.__slimeRememberAvatar=Gh,window.__slimeAvatarLoadFailed=function(t){const n=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Jh(n,r);const o=gt(t?.dataset?.backupSrc||"");if(o&&!_r(n,o)){t.dataset.backupSrc="",t.dataset.avatarSrc=o,t.src=o;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function ll(e){const t=Ge(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function il(e=a.xHandle){const t=Ge(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Yh(e={}){const t=gt(e.avatar||e.image||"");if(du(t))return t;const n=Ge(e.twitter||e.x||e.username||"");if(n)return ll(n);const r=Ge(e.name||e.kolName||"");return r&&r.length>=2?ll(r):""}function Qh(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function mu(e={},t="kol-avatar"){const n=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=sl(n,Yh(e)),o=Qh(e);return r?`<img class="${l(t)}" src="${l(r)}" data-avatar-key="${l(n)}" data-avatar-fallback="${l(o)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${l(t)} kol-avatar-fallback" aria-hidden="true">${l(o)}</div>`}function Ur(){const e=He();return[{id:"phantom",label:"Phantom",detected:!!pe("phantom"),mobileRedirect:e&&!!Tn("phantom"),installUrl:Is("phantom"),icon:Na("phantom")},{id:"solflare",label:"Solflare",detected:!!pe("solflare"),mobileRedirect:e&&!!Tn("solflare"),installUrl:Is("solflare"),icon:Na("solflare")},{id:"backpack",label:"Backpack",detected:!!pe("backpack"),mobileRedirect:!1,installUrl:Is("backpack"),icon:Na("backpack")},{id:"solana",label:"Detected Wallet",detected:!!pe("solana"),mobileRedirect:!1,installUrl:"",icon:Na("solana")}]}function pe(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Oe(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function le(){return a.user?.connectedWallet||a.connectedWalletBalance||null}function Zh(e=""){const t=le();if(!t?.publicKey)return"";const n=String(e||"")==="connected"||!e&&!a.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${n?"selected":""}>${l(r)} - ${l(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}function eg(){const e=le(),t=a.wallets.length>0;if(!t&&!e?.publicKey)return`
      <section class="trade-layout">
        <article class="trade-card slime-swap-card">
          <div class="trade-head">
            <span class="slime-swap-icon" aria-hidden="true"></span>
            <div>
              <h3>Slime Swap</h3>
              <p>Connect to Trade with Phantom, Solflare, Backpack, or another Solana wallet to swap SOL into tokens from one clean panel.</p>
            </div>
          </div>
          <div class="card-actions">
            <button class="primary" type="button" data-web-signup-connect>Connect Wallet</button>
            <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
          </div>
        </article>
      </section>
    `;const n=Hs(),r=Ac(),o=Tc(n)||{symbol:n==="SOL"?"SOL":w(n),name:n==="SOL"?"Solana":""},s=Tc(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=If(),i=a.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":i?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=i?n:r,m=d&&d!=="SOL"?d:a.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${i?"100":"0.0"}" aria-label="${i?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${Pc(n,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${l(m||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${Pc(r,{includeCustom:!0})}
              </select>`;return`
    <section class="trade-layout">
      <article class="trade-card slime-swap-card ogre-swap-card ogre-swap-skin">
        <h3 class="ogre-swap-title oss-a11y-title">OgreSwap - live on-chain Solana swapper</h3>
        <div class="oss-stage-wrap">
          <div class="oss-stage" role="group" aria-label="OgreSwap swap panel">
            ${`
            <div class="oss-slot oss-pay" data-swap-slot="${i?"token":"base"}">${i?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${i?"base":"token"}">${i?f:y}</div>`}
            <button type="button" class="oss-swap primary" data-swap-use-custom-amount>SWAP</button>
            <label class="oss-pill oss-slip" data-cap="Slippage">
              <select data-trade-slippage data-custom-select="trade-slippage" aria-label="Slippage">
                <option value="300">3%</option>
                <option value="400" selected>4%</option>
                <option value="500">5%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-slippage-custom data-custom-for="trade-slippage" type="number" min="1" max="5000" step="1" placeholder="bps" hidden>
            </label>
          </div>
          <div class="oss-wallet-bar">
            <label class="oss-pill oss-wallet" data-cap="Wallet">
              <select data-trade-wallet aria-label="Wallet">
                ${za(e?.publicKey&&!t?"connected":"")}
              </select>
            </label>
          </div>
        </div>
        <p class="slime-swap-route-note oss-route">${l(u)}</p>

        <p class="trade-status oss-status" data-trade-status>${a.tradeResult?l(a.tradeResult.message||"Trade complete."):"Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>Web Swapping</h3>
          <p>Uses encrypted managed wallets, route previews, safety checks, slippage settings, and the same fee logic as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${a.tradeToken?l(a.tradeToken):"Paste a CA or tap Trade from a scanner pick."}</code>
          ${a.tradeToken?`<div class="card-actions">${ze(rl(a.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${pg()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${tg()}
        ${ag()}
      </aside>
    </section>
  `}function cl(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!e?.volumeBot)}function fu(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!!e?.volumeBot)}function za(e=""){const t=Zh(e),n=cl().map(r=>{const o=a.balances.find(i=>Number(i.index)===Number(r.index)),s=o?.sol!==null&&o?.sol!==void 0?`${Number(o.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${l(r.label)}${c} - ${s}</option>`}).join("");return t||n?`${t}${n}`:'<option value="">No wallet connected</option>'}function tg(){if(!a.tradeResult)return`
      <article>
        <h3>Latest Result</h3>
        <p>Your latest web buy or sell recap will appear here after the transaction lands.</p>
      </article>
    `;const e=a.tradeResult,t=e.type==="buy";return`
    <article class="latest-trade">
      <h3>${t?"Buy Complete":"Sell Complete"}</h3>
      <p>${l(e.message||"")}</p>
      <dl>
        <div><dt>Wallet</dt><dd>${l(e.walletLabel)}</dd></div>
        <div><dt>${t?"Spent":"Net"}</dt><dd>${l(t?e.spentSol:e.netSol)} SOL</dd></div>
        <div><dt>Fee</dt><dd>${l(e.feeSol||"0")} SOL</dd></div>
      </dl>
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${ze(Fh(e))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function ag(){if(!a.tradePlanResult)return`
      <article>
        <h3>Managed Exit</h3>
        <p>Use Buy + Watch Exit when you want the token trade to manage TP, SL, and timer exits automatically.</p>
      </article>
    `;const e=a.tradePlanResult;return`
    <article class="latest-trade">
      <h3>Managed Trade Armed</h3>
      <p>${l(e.message||"")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${l(e.walletLabel||`${e.successCount||0}/${e.walletCount||0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${l(e.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>${l(e.takeProfitSummary||`+${e.takeProfitPct}%`)} / ${l(e.stopLossSummary||`-${e.stopLossPct}%`)}</dd></div>
        <div><dt>Timer Exit</dt><dd>${l(fg(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${ze(Wh(e,"Armed managed trade"))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function hu(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const n=t.toLowerCase(),r=n.includes("bonk")?"Bonk":n.includes("meteora")?"Meteora":n.includes("orca")?"Orca":n.includes("raydium")?"Raydium":n.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${l(t)}">${l(r)}</span>`}function ng(){if(!a.ogreAiResult)return`
      <article class="latest-trade ogre-ai-result-card">
        <h3>Ogre A.I. Orders</h3>
        <p>Start an automation run to scan best picks, buy with selected managed wallets, and arm TP/SL exits.</p>
      </article>
    `;const e=a.ogreAiResult,t=Array.isArray(e.plans)?e.plans:[],n=Array.isArray(e.picks)?e.picks:[],r=Array.isArray(e.errors)?e.errors:[];return`
    <article class="latest-trade ogre-ai-result-card">
      <h3>${t.length?"Ogre A.I. Armed":n.length?"Ogre A.I. Picked":"Ogre A.I. Orders"}</h3>
      <p>${l(e.message||"")}</p>
      <dl>
        <div><dt>Strategy</dt><dd>Fresh Ape</dd></div>
        <div><dt>Scanned</dt><dd>${l(e.scanned||0)}</dd></div>
        <div><dt>Qualified</dt><dd>${l(e.qualified||0)}</dd></div>
        <div><dt>Plans</dt><dd>${l(e.armedCount||t.length)}</dd></div>
      </dl>
      <small>Under $5K first | sub-$8K fallback | starting volume required | honeypot, mint, freeze, and no-sell blocks stay on</small>
      <div class="ogre-ai-pick-list">
        ${t.map(o=>{const s=o.pick||{};return`
            <div class="ogre-ai-pick-card">
              <strong>${l(s.symbol||o.shortMint||"Pick")}</strong>
              ${hu(s)}
              <span>${l(s.name||o.tokenMint||"")}</span>
              <small>Score ${l(s.score||"n/a")} | MC ${l(s.marketCapLabel||"n/a")} | Liq ${l(s.liquidityLabel||"n/a")} | Age ${l(s.ageLabel||"n/a")}</small>
              ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(c=>l(c)).join(" | ")}</small>`:""}
              <small>${l(o.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${l(o.tokenMint)}">Copy CA</button>
                <a href="${l(s.dexUrl||o.dexUrl||J(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${s.pumpUrl?`<a href="${l(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":n.map(o=>`
          <div class="ogre-ai-pick-card">
            <strong>${l(o.symbol||o.shortMint||"Pick")}</strong>
            ${hu(o)}
            <span>${l(o.name||o.tokenMint||"")}</span>
            <small>Score ${l(o.score||"n/a")} | MC ${l(o.marketCapLabel||"n/a")} | Liq ${l(o.liquidityLabel||"n/a")} | Age ${l(o.ageLabel||"n/a")}</small>
            ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(s=>l(s)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${l(o.tokenMint)}">Copy CA</button>
              <a href="${l(o.dexUrl||J(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${o.pumpUrl?`<a href="${l(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(o=>`<span data-ok="false">${l(o.shortMint||o.tokenMint)}: ${l(o.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const _n=[["super_fresh","Super-fresh","Brand-new sub-$8K launches with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function qr(){const e=n=>_n.some(([r])=>r===n);if(a.ogreAiCategory&&e(a.ogreAiCategory))return a.ogreAiCategory;const t=Li().category;return e(t)?t:"super_fresh"}function gu(e){const t=_n.find(([n])=>n===e);return t?t[2]:_n[0][2]}function rg(e){return`<div class="ogre-cat-segment" role="group">${_n.map(([t,n])=>`<button type="button" data-ogre-cat="${l(t)}" data-active="${e===t}">${l(n)}</button>`).join("")}</div>`}function og(){const e=a.ogreAutopilot||{},t=!!e.enabled,n=bu(e.category||qr()),r=(c,i)=>c==null||c===""?i:c,o=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),s=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
    <article class="ogre-autopilot ${t?"is-on":""}" data-preserve-focus>
      <div class="ogre-autopilot-head">
        <div>
          <h3>Autopilot</h3>
          <p>Auto-ape the best <strong>${l(n)}</strong> pick on a timer, using the TP/SL/timer/slippage and wallets above — within hard guards.</p>
        </div>
        <label class="ogre-autopilot-switch">
          <input type="checkbox" data-autopilot-enabled ${t?"checked":""}>
          <span>${t?"On":"Off"}</span>
        </label>
      </div>
      <div class="ogre-autopilot-grid">
        <label>Max SOL / hour
          <input data-autopilot-maxspend inputmode="decimal" value="${l(String(r(e.maxSpendPerHourSol,"0.3")))}">
        </label>
        <label>Max live plans
          <input data-autopilot-maxconcurrent inputmode="numeric" value="${l(String(r(e.maxConcurrent,"2")))}">
        </label>
        <label>Min score
          <input data-autopilot-minscore inputmode="numeric" value="${l(String(r(e.minScore,"62")))}">
        </label>
        <label>Every (min)
          <input data-autopilot-interval inputmode="numeric" value="${l(String(r(e.intervalMinutes,"10")))}">
        </label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-autopilot-save ${a.ogreAutopilotBusy?"disabled":""}>${a.ogreAutopilotBusy?"Saving...":"Save autopilot"}</button>
      </div>
      <small data-autopilot-status>${l(o)}${s?` — ${l(s)}`:""}</small>
    </article>
  `}function bu(e){const t=_n.find(([n])=>n===e);return t?t[1]:"Super-fresh"}function sg(){if(!a.wallets.length)return`${Ka()}${R("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=Li(),t=e.amountSol||"0.1",n=e.runCount||"1",r=(s,c,i)=>{const u=String(s||i||"");return u==="custom"?String(c||"custom"):u},o=qr();return`
    <section class="trade-layout ogre-ai-terminal">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Ogre A.I.</h3>
            <p>Pick a category, scan live setups for managed wallets, ape the best one, and arm exits from one command panel.</p>
          </div>
          <span class="sync-pill">Managed server exits</span>
        </div>

        <div class="ogre-cat-field" data-preserve-focus>
          <span class="ogre-cat-label">Scan category</span>
          ${rg(o)}
          <small class="ogre-cat-hint">${l(gu(o))}</small>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="${l(t)}">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              ${["1","2","3","5","10","25"].map(s=>`<option value="${s}" ${n===s?"selected":""}>${s} ${s==="1"?"order":"orders"}</option>`).join("")}
            </select>
          </label>
          ${Wt({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${Wt({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${je("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${Wt({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${bt("ogre-ai")}
        </div>
        ${Ft("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${a.ogreAiLoading?"disabled":""}>${a.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${l(a.ogreAiStatus||gu(o))}</small>
      </article>

      <aside class="trade-side">
        ${tl({compact:!0})}
        ${og()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${ng()}
      </aside>
    </section>
  `}function lg(){return a.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${a.bundleToken?J(a.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${ja({toolKey:"bundle",activeKey:Ga("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${l(a.bundleToken||a.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${bt("bundle")}
        </div>
        ${Ft("bundle")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-bundle-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Sell Percent
            <select data-bundle-percent data-custom-select="bundle-percent">
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="100" selected>100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-percent-custom data-custom-for="bundle-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
          </label>
          <label>
            Slippage
            <select data-bundle-slippage data-custom-select="bundle-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-slippage-custom data-custom-for="bundle-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        <div class="quick-grid two-wide">
          <button class="primary" data-bundle-buy>Bundle Buy</button>
          <button data-bundle-sell>Bundle Sell</button>
        </div>
        <p class="trade-status" data-bundle-status>${a.bundleResult?l(a.bundleResult.message||"Bundle complete."):"Ready."}</p>`},{key:"autoexit",label:"Auto Exit",hint:"TP / SL plan",html:`
          <p>Optional timed plan for selected wallets. Use presets or type custom targets like 500 or 5x.</p>
          <div class="volume-grid">
            <label>
              Fallback Sell
              ${je("bundle-plan-delay","data-bundle-plan-delay","5")}
            </label>
            <label>
              Take Profit
              <select data-bundle-plan-tp data-custom-select="bundle-plan-tp">
                <option value="25">+25%</option>
                <option value="60" selected>+60%</option>
                <option value="100">+100%</option>
                <option value="250">+250%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-tp-custom data-custom-for="bundle-plan-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-bundle-plan-sl data-custom-select="bundle-plan-sl">
                <option value="0">Off</option>
                <option value="8">-8%</option>
                <option value="10" selected>-10%</option>
                <option value="15">-15%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sl-custom data-custom-for="bundle-plan-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Repeat
              <select data-bundle-plan-loop data-custom-select="bundle-plan-loop">
                <option value="1" selected>1x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-loop-custom data-custom-for="bundle-plan-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
            </label>
            <label>
              Repeat Wait
              ${Hr("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
            </label>
            <label>
              Exit Size
              <select data-bundle-plan-sell-percent data-custom-select="bundle-plan-sell-percent">
                <option value="off">Off</option>
                <option value="50">50%</option>
                <option value="80">80%</option>
                <option value="100" selected>100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sell-percent-custom data-custom-for="bundle-plan-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
            </label>
          </div>
          ${Vr("bundle-plan")}
          <button class="primary" data-bundle-plan>Bundle Buy + Auto Exits</button>`}]})}
      </article>
      <aside class="trade-side">
        <article>
          <h3>Multi-Wallet Control</h3>
          <p>Select the exact wallets to use. Each selected wallet must hold enough SOL for buy amount, fees, and reserve.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${mg()}
        ${ig()}
      </aside>
    </section>
  `:`${Ka()}${R("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function ig(){if(!a.bundleResult)return`
      <article>
        <h3>Latest Bundle</h3>
        <p>Bundle buy/sell results will show here wallet by wallet.</p>
      </article>
    `;const e=a.bundleResult.source==="web_bundle_plan"?"Bundle Auto Exit Plan":a.bundleResult.type==="bundle_sell"?"Bundle Sell":"Bundle Buy";return`
    <article class="latest-trade">
      <h3>${l(e)}</h3>
      <p>${l(a.bundleResult.message||"")}</p>
      <div class="mini-results">
        ${(a.bundleResult.results||[]).map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${l(a.bundleResult.tokenMint)}">Copy CA</button>
        <a href="${l(a.bundleResult.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function bt(e,t=null){const n=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return cl().map((o,s)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${o.index}" ${r?r.has(String(o.index))?"checked":"":s<n?"checked":""}>
      <span>${o.index}. ${l(o.label)}</span>
      <code>${l(o.shortPublicKey||o.publicKey)}</code>
    </label>
  `).join("")}function Ft(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${l(t)}">
    </label>
  `}function cg(e=""){return a.wallets.length?a.wallets.map((t,n)=>{const r=String(t.index??n+1),o=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${l(r)}" ${String(e)===r?"selected":""}>${l(o)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,n=""){const r=p(e)?.value||n;if(r!=="custom")return r;const o=p(t)?.value?.trim();if(!o)throw new Error("Enter the custom value first.");return o}function nt(e,t=""){const n=a.presets?.[e]||[],r=!t||t==="none"||t==="manual",o=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return n.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${n.map(s=>`<option value="${l(s.id)}" ${s.id===t?"selected":""}>${l(s.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
    `}function yu(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${l(Ue()||"0.10")}" value="${l(a.quickBuyAmountOverride)}">`}function vu(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${yu()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${l(e)}">
          ${nt("trade",a.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const ug=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],dg=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function Wt({selectAttr:e,customAttr:t,customFor:n,options:r,selected:o="",customType:s="text",customPlaceholder:c="Custom time"}){const i=String(o||""),d=new Set(r.map(([f])=>f)).has(i)?i:"custom",m=d==="custom"&&i!=="custom"?i:"";return`
    <select ${e} data-custom-select="${l(n)}">
      ${r.map(([f,y])=>`<option value="${l(f)}" ${f===d?"selected":""}>${l(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${l(n)}" type="${l(s)}" value="${l(m)}" placeholder="${l(c)}" ${d==="custom"?"":"hidden"}>
  `}function je(e,t,n="off"){return Wt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:ug,selected:n,customPlaceholder:"Custom: 45s, 20, 2h"})}function Hr(e,t,n="0"){return Wt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:dg,selected:n,customPlaceholder:"Custom: 30s, 20, 2h"})}function ul(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${yu()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${l(e)}">
          ${nt("trade",a.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${l(e)}">
          ${nt("bundle",a.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function RS(){const e=a.fastTradePresetStatus||(a.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${za()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${je("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function IS(){const e=a.fastBundlePresetStatus||(a.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${bt("fast-bundle-preset")}</div>
        ${Ft("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${je("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function wu(e){const t=e==="trade"?a.editingTradePresetId:a.editingBundlePresetId;return t?ne(e,t):null}function Kr(e,t){e==="trade"&&(a.editingTradePresetId=t||""),e==="bundle"&&(a.editingBundlePresetId=t||"")}function pg(){const e=wu("trade"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${l(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${za(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${l(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${l(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${je("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${Su("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function mg(){const e=wu("bundle"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${l(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${bt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Ft("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${l(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${l(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${je("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${Su("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function Su(e){const t=a.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const n=e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId;return`
    <div class="preset-list">
      ${t.map(r=>{const o=r.id===n;return`
        <div class="preset-pill" data-readonly="${r.readonly?"true":"false"}" data-active="${o?"true":"false"}">
          <span>${l(r.name)}</span>
          <small>${l(r.amountSol)} SOL | TP ${l(r.takeProfitPct)} | SL ${l(r.stopLossPct)} | ${l(r.sellDelay||"off")}</small>
          <div class="preset-actions">
            <button type="button" class="${o?"primary":""}" data-use-preset="${l(e)}" data-preset-id="${l(r.id)}">${o?"Active":"Use"}</button>
            <button type="button" data-edit-preset="${l(e)}" data-preset-id="${l(r.id)}">Edit</button>
            <button type="button" data-delete-preset="${l(e)}" data-preset-id="${l(r.id)}">${r.readonly?"Remove":"Delete"}</button>
          </div>
        </div>
      `}).join("")}
    </div>
  `}function fg(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function Vr(e){return`
    <div class="trade-block">
      <div>
        <h4>Wallet-by-Wallet Exits</h4>
        <p>Optional for multi-wallet entries. Leave on Same to use the normal TP/SL above, or spread targets across wallets.</p>
      </div>
      <div class="volume-grid">
        <label>
          TP Targets
          <select data-${e}-wallet-tp data-custom-select="${e}-wallet-tp">
            <option value="" selected>Same TP for all</option>
            <option value="spread:25:60">Spread +25% to +60%</option>
            <option value="spread:40:100">Spread +40% to +100%</option>
            <option value="spread:60:250">Spread +60% to +250%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${e}-wallet-tp-custom data-custom-for="${e}-wallet-tp" type="text" placeholder="Example: 25,40,60 or spread:25:100" hidden>
        </label>
        <label>
          SL Targets
          <select data-${e}-wallet-sl data-custom-select="${e}-wallet-sl">
            <option value="" selected>Same SL for all</option>
            <option value="spread:6:10">Spread -6% to -10%</option>
            <option value="spread:8:15">Spread -8% to -15%</option>
            <option value="spread:10:20">Spread -10% to -20%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${e}-wallet-sl-custom data-custom-for="${e}-wallet-sl" type="text" placeholder="Example: 8,10,12 or spread:8:15" hidden>
        </label>
      </div>
    </div>
  `}function ua(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function zr(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(o=>o.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function hg(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),n=document.querySelector(`[data-custom-select="${t}"]`);n&&(n.value="off"),zr()}function ku(){return a.wallets.map(e=>`<option value="${l(e.index)}">${l(e.index)}. ${l(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function gg(){return a.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${ku()}</select>
        </label>
        <label>
          New wallets (1-20)
          <input data-distribute-count type="number" min="1" max="20" step="1" value="5">
        </label>
        <label>
          SOL per wallet
          <input data-distribute-amount type="number" min="0" step="0.01" value="0.05">
        </label>
        <label>
          Label
          <input data-distribute-label type="text" value="Fresh">
        </label>
      </div>
      <button class="primary" data-distribute-fresh ${a.distributeBusy?"disabled":""}>${a.distributeBusy?"Creating & funding...":"Create & Fund Wallets"}</button>
      <p class="trade-status" data-distribute-status>${l(a.distributeStatus||"Sends real SOL from the source wallet to each new wallet.")}</p>
    </article>
  `:""}function jr(e){a.distributeStatus=String(e||"");const t=p("[data-distribute-status]");t&&(t.textContent=a.distributeStatus)}function bg(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.wallets.filter(r=>r.sessionWallet),n=t.length?t:a.wallets;return n.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${l(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${a.returnFundsBusy?"disabled":""}>${a.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${l(a.returnFundsStatus||`${n.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Un(e){a.returnFundsStatus=String(e||"");const t=p("[data-return-funds-status]");t&&(t.textContent=a.returnFundsStatus)}async function $u(e="leaving"){try{const t=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!t?.publicKey)return;const n=a.wallets.filter(s=>s.sessionWallet);if(!n.length)return;const r=n.map(s=>String(s.index));if(!await Ae({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Z})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function yg(){if(a.returnFundsBusy)return;const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey){Un("Connect a wallet first.");return}const t=a.wallets.filter(s=>s.sessionWallet),r=(t.length?t:a.wallets).map(s=>String(s.index));if(!r.length){Un("No managed wallets to return from.");return}if(await Ae({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){a.returnFundsBusy=!0,Un("Selling tokens and returning SOL..."),h();try{const s=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Z});a.returnFundsBusy=!1,Un(s.summary||"Funds returned to your connected wallet."),await Ne({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(s){a.returnFundsBusy=!1,Un(s.message),h()}}}async function vg(){if(a.distributeBusy)return;const e=p("[data-distribute-count]")?.value||"5",t=p("[data-distribute-amount]")?.value||"",n=p("[data-distribute-source]")?.value||"1",r=p("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){jr("Enter SOL per wallet greater than zero.");return}const o=(Number(t)||0)*(Number(e)||0);if(await Ae({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${o.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){a.distributeBusy=!0,jr("Creating and funding wallets..."),h();try{await X(p("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:n,label:r}),dedupe:!1,timeoutMs:Z});c.downloads?.encryptedBackup?.text&&me(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&me(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.distributeBusy=!1,jr(c.summary||"Fresh wallets created and funded. Backups downloaded."),await Ne({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){a.distributeBusy=!1,jr(c.message),h()}}}function wg(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function Sg(){const e=fu().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${a.sweepBackgroundStatus?`<small data-sweep-background-status>${l(a.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function kg(){const e=Array.isArray(a.volumeBots)?a.volumeBots:[],t=Sg();return e.length?t+e.map(n=>{const r=n.stats||{},o=n.status!=="completed",s=(n.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${l(n.shortMint||n.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${l(n.stage||"")}">${l(wg(n))}</span>
          </div>
          ${o?`<button class="secondary" data-vbot-stop="${l(n.id)}">Stop & Sweep</button>`:`<a class="mini-link" href="${l(n.dexUrl||"#")}" target="_blank" rel="noreferrer">Dex</a>`}
        </header>
        <div class="volume-bot-metrics">
          <div><span>Cycle</span><strong>${l(Number(n.currentCycle||0))}/${l(Number(n.cycles||0))}</strong></div>
          <div><span>Wallets</span><strong>${l(Number(n.walletCount||0))}</strong></div>
          <div><span>Buys</span><strong>${l(Number(r.buys||0))}</strong></div>
          <div><span>Sells</span><strong>${l(Number(r.sells||0))}</strong></div>
          <div><span>Errors</span><strong>${l(Number(r.errors||0))}</strong></div>
        </div>
        <small>${l(n.message||"")}</small>
        ${s.length?`<ul class="volume-bot-log">${s.map(c=>`<li>${l(c.message||"")}</li>`).join("")}</ul>`:""}
      </article>
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function dl(e,t,n){return`<div class="vbot-segment" role="group">${n.map(([r,o])=>`<button type="button" data-vbot-set-${e}="${l(r)}" data-active="${t===r}">${l(o)}</button>`).join("")}</div>`}function $g(){const t=(Array.isArray(a.volumeBots)?a.volumeBots:[]).filter(c=>c.status!=="completed"),n=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),o=c=>c.reduce((i,u)=>i+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),s=(c,i,u,d,m)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${l(c)}</h4>
      <p class="vbot-queue-sub">${l(i)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${u} / ${d}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,u/d*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${m}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${s("SMART","Smart Mode RPC Servers",n.length,10,o(n))}
      ${s("SPAMMER","Spammer RPC Servers",r.length,1,o(r))}
    </div>`}function Tg(){return`
    <section class="trade-card volume-bot-card slime-configurator ovs-skin" data-preserve-focus>
      <h2 class="vbot-config-title oss-a11y-title">Volume Configurator</h2>
      <div class="ovs-stage">
        <span class="ovs-mlabel" aria-hidden="true">VOLUME CONFIGURATOR</span>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Contract Address</span>
        <input class="ovs-ca" data-vbot-token type="text" placeholder="Paste contract address" value="${l(a.volumeToken||a.tradeToken||"")}" aria-label="Contract address">
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Investment (SOL)</span>
        <div class="ovs-invest">
          <input data-vbot-invest type="range" min="0.1" max="10" step="0.1" value="6" aria-label="Investment in SOL">
          <input data-vbot-invest-num type="number" min="0.1" max="10" step="0.1" value="6" class="ovs-invest-num" aria-label="Investment in SOL">
          <span class="ovs-invest-unit">SOL</span>
        </div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Duration</span>
        <div class="ovs-duration">
          <input data-vbot-duration type="range" min="20" max="360" step="5" value="60" aria-label="Duration">
          <span class="ovs-dur-label" data-vbot-duration-label>1h</span>
        </div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Mode</span>
        <div class="ovs-mode">${dl("mode",a.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${dl("aggr",a.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${ku()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Stagger pattern</span>
            ${dl("stagger",a.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Ladder"]])}
          </div>
        </div>

        <div class="vbot-config-toggles">
          <label class="vbot-toggle">
            <input type="checkbox" data-vbot-keepdust ${a.slimeBotKeepDust?"checked":""}>
            <span><strong>Leave dust</strong> — keep 1 token in each recycled wallet (looks like a real holder)</span>
          </label>
          <label class="vbot-toggle">
            <input type="checkbox" data-vbot-offset ${a.slimeBotOffset?"checked":""}>
            <span><strong>Offset sell</strong> — a different wallet sells behind each buy (no instant self-sell)</span>
          </label>
        </div>

        <div class="ovs-actions">
          <button class="primary vbot-config-start" data-vbot-start ${a.volumeBotBusy?"disabled":""}>${a.volumeBotBusy?"Starting...":"Start SlimeBot"}</button>
          ${(()=>{const e=(Array.isArray(a.volumeBots)?a.volumeBots:[]).find(t=>t&&t.status!=="completed");return e?`<button type="button" class="vbot-stop-sweep" data-vbot-stop="${l(e.id)}">&#9209; Stop &amp; Sweep Back</button>`:""})()}
        </div>
        <p class="trade-status" data-vbot-status>${l(a.volumeBotStatus||"Set a token, investment, and mode, then Start. Spends real SOL from the source wallet.")}</p>

        <div class="vbot-queue">
          <div class="vbot-queue-head"><span class="vbot-config-label small">GLOBAL QUEUE</span><strong>Queue Status</strong></div>
          ${$g()}
        </div>

        <div class="volume-bot-list">
          ${kg()}
        </div>
      </div>
    </section>
  `}function Pg(){const e=a.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(a.slimeBotAggr)?a.slimeBotAggr:"med",n=Math.max(.05,Math.min(50,Number(p("[data-vbot-invest-num]")?.value||p("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(p("[data-vbot-duration]")?.value||"60"))),s={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",i=s.delaySecs*(c?4:1);let u=Math.round(r*60/i);u=Math.max(1,Math.min(250,u,Math.floor(n/.01)));const d=Math.max(.005,Math.min(.5,n/u));return{tokenMint:p("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:p("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(s.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(s.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(s.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!p("[data-vbot-keepdust]")?.checked,offsetSell:!!p("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(a.slimeBotStagger)?a.slimeBotStagger:"steady",investment:n,durationMin:r,mode:e,aggr:t}}function da(e){a.volumeBotStatus=String(e||"");const t=p("[data-vbot-status]");t&&(t.textContent=a.volumeBotStatus)}async function Gr({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");a.volumeBots=Array.isArray(t.bots)?t.bots:[],a.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function Ag(){if(a.volumeBotBusy)return;const e=Pg();if(!e.tokenMint){da("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Ae({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){a.volumeBotBusy=!0,da("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:Z});a.volumeBotBusy=!1,r.bot&&(a.volumeBots=[r.bot,...a.volumeBots.filter(o=>o.id!==r.bot.id)]),da(r.bot?.message||"SlimeBot started."),h(),Gr()}catch(r){a.volumeBotBusy=!1,da(r.message),h()}}}async function Cg(e){if(e)try{da("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:Z});t.bot&&(a.volumeBots=a.volumeBots.map(n=>n.id===t.bot.id?t.bot:n)),da(t.bot?.message||"Stop requested."),h(),Gr()}catch(t){da(t.message)}}function Lg(){return a.wallets.length?Tg():`${Ka()}${R("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function xg(){const e=ge([...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...We()?.rows||[],...a.scan?.rows||[]]).sort(Ye),t=an(e),n=tt("launch",t),r=tn(),o=wt(Le().keywords)[0]||"";return`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Watch fresh live pairs by ticker/keyword before launch, then arm wallets and exits when you are ready.</p>
          </div>
          <div class="card-actions launch-head-actions">
            <button type="button" class="primary" data-refresh-live-pairs>${a.livePairsLoadingByBucket[a.livePairBucket]?"Refreshing...":"Refresh"}</button>
            <span class="sync-pill">${l(n.length)}/${l(e.length)} matching</span>
          </div>
        </div>
        ${Nl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${Wl(e,t)}
        ${n.length?st(n,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Sa}):r?tr(e,"launch candidates"):R("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
        ${sa("launch",t,"launch candidates")}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Launch Watch Setup</h3>
          <p>Use this only when you want SlimeWire to keep watching and buy with selected managed wallets when the ticker appears.</p>
        </article>
        ${a.wallets.length?`
        <article class="trade-card launch-watch-setup-card">
        <label>
          Ticker
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${l(o.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${bt("launch")}
        </div>
        ${Ft("launch")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-launch-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-launch-tp data-custom-select="launch-tp">
              <option value="0">Off</option>
              <option value="25">+25%</option>
              <option value="40" selected>+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-tp-custom data-custom-for="launch-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-launch-sl data-custom-select="launch-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-sl-custom data-custom-for="launch-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            ${je("launch-delay","data-launch-delay","3")}
          </label>
          <label>
            Repeat
            <select data-launch-loop data-custom-select="launch-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-loop-custom data-custom-for="launch-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${Hr("launch-loop-delay","data-launch-loop-delay","0")}
          </label>
          <label>
            Slippage
            <select data-launch-slippage data-custom-select="launch-slippage">
              <option value="300" selected>3%</option>
              <option value="400">4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-slippage-custom data-custom-for="launch-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${Vr("launch")}
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${a.launchResult?l(a.launchResult.message||"Launch watch armed."):"Ready."}</p>
        </article>
        `:`
        <article class="trade-card">
          <h3>Wallets needed to auto-buy</h3>
          <p>You can still filter and watch launches here. Create or restore managed wallets before arming automatic Launch Watch buys.</p>
          <div class="card-actions">
            <button type="button" class="primary" data-tab="wallets">Open Wallets</button>
            <button type="button" data-tab="terminal">Live Terminal</button>
          </div>
        </article>
        `}
        <article>
          <h3>How It Works</h3>
          <p>It scans live launch/profile feeds about every ${l(Xg())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${Iu()}
        </article>
      </aside>
    </section>
  `}function Tu(e=a.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||a.launchWatches?.[0]?.tokenMint||a.launchWatches?.[0]?.mint||a.smartChartToken?.tokenMint||a.smartChartToken?.mint||"").trim()}function pl(){return!!(jt&&jt.enabled&&(jt.provider||jt.playbackBaseUrl||jt.ingestUrl))}function Mg(){const e=String(jt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function Bg(e){const t=String(jt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const n=t.includes("?")?"&":"?";return`${t}${n}mint=${encodeURIComponent(e)}`}function Rg(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function Pu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function Ig(e=a.launchCoinDraft||{}){const t=Tu(e),n=pl(),r=Bg(t),o=a.pumpLiveStatus||(t?n?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),s=t?"":"disabled",c=n&&r?`<iframe class="pump-live-frame" src="${l(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
    <section class="launch-coin-card pump-live-panel" data-pump-live-panel>
      <div class="pump-live-head">
        <div>
          <p class="panel-kicker">Pump Live</p>
          <h4>Live launch studio</h4>
          <p>Keep the launch, chart, transactions, and creator controls inside Slime.</p>
        </div>
        <span class="pump-live-pill ${n?"ready":"standby"}">${l(n?"provider ready":"standby")}</span>
      </div>
      <div class="pump-live-grid">
        <div class="pump-live-video">
          ${c}
        </div>
        <div class="pump-live-stack">
          <div class="pump-live-stat"><span>Launch CA</span><strong>${l(Rg(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${l(Mg())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${l(Pu(t))}</strong></div>
        </div>
      </div>
      <div class="quick-grid pump-live-controls">
        <button type="button" data-pump-live-action="go" ${s}>Go Live</button>
        <button type="button" data-pump-live-action="chart" ${s}>Chart + Txns</button>
        <button type="button" data-pump-live-action="copy" ${s}>Copy Stream ID</button>
        <button type="button" data-pump-live-action="obs" ${s}>OBS / Mobile Setup</button>
        <button type="button" data-pump-live-action="end" ${s}>End Live</button>
      </div>
      <p class="pump-live-status">${l(o)}</p>
    </section>
  `}function ja({toolKey:e,activeKey:t,sections:n,variant:r=""}){const o=n.some(s=>s.key===t)?t:n[0]?.key;return`
    <div class="tool-panels${r==="stacked"?" is-stacked":""}" data-tool-panels="${l(e)}">
      <nav class="tool-panel-nav" aria-label="Sections">
        ${n.map(s=>`
          <button type="button" class="tool-panel-tab" data-tool-section="${l(e)}:${l(s.key)}" data-active="${s.key===o?"true":"false"}">
            <span class="tool-panel-tab-label">${l(s.label)}</span>
            ${s.hint?`<span class="tool-panel-tab-hint">${l(s.hint)}</span>`:""}
          </button>`).join("")}
      </nav>
      <div class="tool-panel-stack">
        ${n.map(s=>`
          <section class="tool-panel" data-tool-panel="${l(e)}:${l(s.key)}"${s.key===o?"":" hidden"}>
            ${s.title?`<h4 class="tool-panel-title">${l(s.title)}</h4>`:""}
            ${s.html}
          </section>`).join("")}
      </div>
    </div>
  `}function Ga(e,t){return a.toolSections&&a.toolSections[e]||t}function Og(){const e=a.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,n=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
    <section class="trade-card launch-share-kit">
      <div class="trade-head">
        <div>
          <h3>🚀 Your launch is live - now shill it</h3>
          <p>$${l(e.symbol||e.name||"")} has its own room: chart, shield read, call board, and one-tap trading. Post the link, not the CA.</p>
        </div>
      </div>
      <div class="card-actions compact">
        <a class="button-like primary" href="/t?ca=${encodeURIComponent(e.tokenMint)}" target="_blank" rel="noreferrer">Open Launch Room</a>
        <button data-copy="${l(t)}">Copy Room Link</button>
        <a class="button-like" href="${l(ta(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${ze(n+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function Eg(e={}){Au();const t=a.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
    <div class="volume-grid">
      <p class="muted full-span">Build the audience BEFORE you mint: schedule the launch, share the countdown page everywhere, and every "notify me" gets the chart link the second your Pump Launch completes.</p>
      <label>
        Token Name
        <input data-hype-name type="text" placeholder="Defaults to Coin Details name" value="${l(e.name||"")}">
      </label>
      <label>
        Ticker
        <input data-hype-symbol type="text" placeholder="Defaults to Coin Details ticker" value="${l(e.symbol||"")}">
      </label>
      <label>
        Launch Time
        <input data-hype-launch-at type="datetime-local" min="${r}">
      </label>
      <label class="full-span">
        One-liner (optional)
        <textarea data-hype-blurb rows="2" maxlength="200" placeholder="Why should degens set an alarm for this?"></textarea>
      </label>
      <div class="card-actions compact full-span">
        <button class="primary" type="button" data-hype-create>Create Hype Page</button>
      </div>
      <p class="trade-status full-span" data-hype-status>${l(a.hypeStatus||"")}</p>
      ${t.length?`
        <div class="full-span">
          ${t.map(o=>`
            <div class="row-card">
              <div class="row-main">
                <strong>$${l(o.symbol)} ${o.mint?"🚀 launched":"⏳ counting down"}</strong>
                <small>${l(o.subscribers||0)} waiting | ${l(o.url)}</small>
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(o.url)}">Copy Link</button>
                <a class="button-like" href="${l(o.url)}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>`).join("")}
        </div>`:""}
    </div>`}let Xr="";function Au(){!a.user||Xr===a.user.id||(Xr=a.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});a.hypePages=e.pages||[],a.hypePages.length&&h()}catch{Xr=""}})())}async function Fg(){const e=p("[data-hype-status]"),t=String(p("[data-hype-name]")?.value||p("[data-launch-coin-name]")?.value||"").trim(),n=String(p("[data-hype-symbol]")?.value||p("[data-launch-coin-symbol]")?.value||"").trim(),r=String(p("[data-hype-launch-at]")?.value||"").trim(),o=String(p("[data-hype-blurb]")?.value||"").trim();if(!t||!n){v(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){v(e,"Pick the launch time.");return}v(e,"Creating hype page...");try{const s=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:n,blurb:o,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});a.hypeStatus=`Hype page live: ${s.url} - share it everywhere, it forwards to your chart at launch.`,Xr="",Au(),h()}catch(s){v(e,W(s?.message||"Could not create the hype page."))}}function Wg(){const e=a.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
          <div class="volume-grid">
            <label>
              Token Name
              <input data-launch-coin-name type="text" placeholder="Example: Ogre Mode" value="${l(e.name||"")}">
            </label>
            <label>
              Ticker
              <input data-launch-coin-symbol type="text" placeholder="Example: OGRE" value="${l(e.symbol||"")}">
            </label>
            <label class="full-span">
              Description
              <textarea data-launch-coin-description rows="3" placeholder="Short public token description">${l(e.description||"")}</textarea>
            </label>
            <label class="full-span">
              Image
              <input data-launch-coin-image type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,.avif">
              <span class="muted">SlimeWire converts common phone and desktop images during launch. Use a clear square JPG, PNG, WEBP, or screenshot for best results.</span>
              <span class="launch-image-preview-wrap" data-launch-image-preview-wrap ${e.imageDataUrl?"":"hidden"}>
                <img class="launch-image-preview" data-launch-image-preview ${e.imageDataUrl?`src="${e.imageDataUrl}"`:""} alt="Coin image preview">
                <span class="launch-image-preview-meta" data-launch-image-preview-meta>${l(e.imageName?`${e.imageName} · saved with the sheet`:"")}</span>
              </span>
            </label>
          </div>`},{key:"socials",label:"Socials",hint:"Optional links",title:"Socials (optional)",html:`
          <div class="volume-grid">
            <label>
              Website
              <input data-launch-coin-website type="url" placeholder="https://..." value="${l(e.website||"")}">
            </label>
            <label>
              X
              <input data-launch-coin-x type="text" placeholder="@handle or URL" value="${l(e.x||"")}">
            </label>
            <label>
              Telegram
              <input data-launch-coin-telegram type="url" placeholder="https://t.me/..." value="${l(e.telegram||"")}">
            </label>
          </div>`},{key:"fees",label:"Fees",hint:"Creator fees",title:"Creator Fees (optional)",html:`
          <div class="volume-grid">
            <label>
              Creator Fee
              <select data-launch-coin-creator-fee>
                <option value="0" ${String(e.creatorFeeBps||"0")==="0"?"selected":""}>None</option>
                <option value="50" ${String(e.creatorFeeBps||"")==="50"?"selected":""}>0.5%</option>
                <option value="100" ${String(e.creatorFeeBps||"")==="100"?"selected":""}>1%</option>
                <option value="200" ${String(e.creatorFeeBps||"")==="200"?"selected":""}>2%</option>
              </select>
            </label>
            <label>
              Creator Fee Wallet
              <input data-launch-coin-fee-recipient type="text" placeholder="Optional wallet address" value="${l(e.creatorFeeRecipient||"")}">
            </label>
            <label>
              Fee Handling
              <select data-launch-coin-fee-mode>
                <option value="standard" ${(e.feeMode||"standard")==="standard"?"selected":""}>Standard</option>
                <option value="dev" ${e.feeMode==="dev"?"selected":""}>Send creator fees to dev wallet</option>
                <option value="buyback" ${e.feeMode==="buyback"?"selected":""}>Route creator fees to buyback wallet</option>
                <option value="burn" ${e.feeMode==="burn"?"selected":""}>Burn creator fees when supported</option>
                <option value="split" ${e.feeMode==="split"?"selected":""}>Split dev / buyback</option>
              </select>
            </label>
            <label>
              Buyback Wallet
              <input data-launch-coin-buyback-wallet type="text" placeholder="Optional buyback wallet" value="${l(e.buybackWallet||"")}">
            </label>
            <label class="switch-row full-span">
              <input data-launch-coin-burn-creator-fees type="checkbox" ${e.burnCreatorFees?"checked":""}>
              <span>Burn creator fees when supported by the launch connector</span>
            </label>
          </div>`},{key:"devbuy",label:"Dev Buy",hint:"First buy",title:"Dev Wallet Initial Buy",html:`
          <div class="volume-grid">
            <label class="switch-row full-span">
              <input data-launch-coin-dev-buy-enabled type="checkbox" ${e.devBuyEnabled?"checked":""}>
              <span>Run Dev Wallet Initial Buy before the post-launch preset</span>
            </label>
            <label>
              Dev Wallet
              <select data-launch-coin-dev-wallet>
                ${cg(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
              </select>
            </label>
            <label>
              Dev Buy SOL (launch amount)
              <input data-launch-coin-dev-buy-sol type="text" inputmode="decimal" autocomplete="off" placeholder="0.05" value="${l(e.devBuySol||"")}">
            </label>
            <p class="muted full-span">Set the dev wallet buy amount here. After launch, SlimeWire can run the Dev Wallet Initial Buy first, then continue into your selected post-launch action.</p>
          </div>`},{key:"after",label:"After Launch",hint:"Auto trade / bundle",title:"Post-Launch Action",html:`
          <div class="volume-grid">
            <p class="muted full-span">With Auto Bundle, the checked wallets buy AT launch (right behind the create) with these TP/SL/timer settings armed automatically. Other actions route the live CA into that tool after launch.</p>
            <label>
              Live CA After Launch
              <input data-launch-coin-ca type="text" placeholder="Auto-filled after launch, or paste CA manually" value="${l(e.tokenMint||"")}">
            </label>
            <label>
              Action After Launch
              <select data-launch-coin-action>
                <option value="watch" ${e.action==="watch"?"selected":""}>Watch only</option>
                <option value="trade" ${e.action==="trade"?"selected":""}>Auto Trade with one-time setup</option>
                <option value="bundle" ${e.action==="bundle"?"selected":""}>Auto Bundle with one-time setup</option>
                <option value="launch-watch" ${e.action==="launch-watch"?"selected":""}>Arm Launch Snipe watcher</option>
              </select>
            </label>
            <label>
              Trade Preset
              <select data-launch-coin-trade-preset>
                ${nt("trade",e.tradePresetId||a.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${nt("bundle",e.bundlePresetId||a.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${l(e.amountSol||Ue()||"0.1")}">
            </label>
            <label>
              Sell Percent
              <input data-launch-coin-sell-percent type="number" min="1" max="100" step="1" value="${l(e.sellPercent||"100")}">
            </label>
            <label>
              Stop Loss
              <select data-launch-coin-sl data-custom-select="launch-coin-sl">
                <option value="0" ${String(e.stopLossPct||"")==="0"?"selected":""}>Off</option>
                <option value="8" ${String(e.stopLossPct||"8")==="8"?"selected":""}>-8%</option>
                <option value="10" ${String(e.stopLossPct||"")==="10"?"selected":""}>-10%</option>
                <option value="15" ${String(e.stopLossPct||"")==="15"?"selected":""}>-15%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-sl-custom data-custom-for="launch-coin-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Take Profit
              <select data-launch-coin-tp data-custom-select="launch-coin-tp">
                <option value="0" ${String(e.takeProfitPct||"")==="0"?"selected":""}>Off</option>
                <option value="25" ${String(e.takeProfitPct||"")==="25"?"selected":""}>+25%</option>
                <option value="40" ${String(e.takeProfitPct||"40")==="40"?"selected":""}>+40%</option>
                <option value="60" ${String(e.takeProfitPct||"")==="60"?"selected":""}>+60%</option>
                <option value="100" ${String(e.takeProfitPct||"")==="100"?"selected":""}>+100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-tp-custom data-custom-for="launch-coin-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Fallback Timer
              ${je("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
            </label>
            <label>
              Slippage
              <select data-launch-coin-slippage data-custom-select="launch-coin-slippage">
                <option value="300" ${String(e.slippageBps||"300")==="300"?"selected":""}>3%</option>
                <option value="400" ${String(e.slippageBps||"")==="400"?"selected":""}>4%</option>
                <option value="500" ${String(e.slippageBps||"")==="500"?"selected":""}>5%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-slippage-custom data-custom-for="launch-coin-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
            </label>
            <label class="full-span launch-inline-wallets">
              Wallets / Groups For Post-Launch Buy
              <span class="muted">Use these for this launch only, or pick a saved preset above.</span>
              <div class="wallet-checks preset-wallets">
                ${a.wallets.length?bt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Ft("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:Eg(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:Ig(e)}];return`
    ${Og()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${ja({toolKey:"launchCoin",activeKey:Ga("launchCoin","coin"),sections:t})}

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <button type="button" data-launch-coin-save>Save Launch Sheet</button>
          <button type="button" data-launch-coin-use-ca>Use Live CA</button>
          <a href="https://pump.fun/create" target="_blank" rel="noreferrer">Open Pump Create</a>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${l(a.launchCoinStatus||"Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The official Pump and Dex links remain available as fallback tools.")}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>How It Works</h3>
          <p>SlimeWire sends the token details to the configured launch connector, waits for the returned CA, then can route that CA into your selected preset. If the connector is not enabled, save the sheet and use the official fallback links.</p>
        </article>
        <article>
          <h3>Launch Checklist</h3>
          <p>Confirm the token details, image, dev buy amount, fee handling, and post-launch action before submitting. If direct launch is unavailable, save the sheet and use the fallback links.</p>
        </article>
        <article>
          <h3>Active Launch Watches</h3>
          ${Iu()}
        </article>
      </aside>
    </section>
  `}function Ng(){const e=a.launchCoinDraft||{},t=p("[data-launch-coin-image]")?.files?.[0];return{name:(p("[data-launch-coin-name]")?.value||"").trim(),symbol:(p("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(p("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",website:(p("[data-launch-coin-website]")?.value||"").trim(),x:(p("[data-launch-coin-x]")?.value||"").trim(),telegram:(p("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:p("[data-launch-coin-creator-fee]")?.value||e.creatorFeeBps||"0",creatorFeeRecipient:(p("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:p("[data-launch-coin-fee-mode]")?.value||e.feeMode||"standard",buybackWallet:(p("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!p("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!p("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:p("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:G(p("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(p("[data-launch-coin-ca]")?.value||"").trim(),action:p("[data-launch-coin-action]")?.value||"watch",tradePresetId:p("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:p("[data-launch-coin-bundle-preset]")?.value||"",amountSol:G(p("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:p("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:_e("launch-coin"),walletGroup:p("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function Jr(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function qn({silent:e=!1}={}){try{const t=Ng();a.launchCoinDraft=t,pr(t);const n=t.name||t.symbol||"launch";return a.launchCoinStatus=`Saved ${n}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${Jr(t.action)}.`,e||v(p("[data-launch-coin-status]"),a.launchCoinStatus),t}catch(t){throw a.launchCoinStatus=t.message,v(p("[data-launch-coin-status]"),t.message),t}}function Dg(e){return new Promise((t,n)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>n(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function _g(e){return new Promise((t,n)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>n(new Error("Could not preview that image for compression.")),r.src=e})}function ml(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function Cu(e){if(!e)return"";const t=8*1024*1024,n=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const o=await Dg(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(o.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return o}try{const s=await _g(o),c=384,i=Math.min(1,c/Math.max(s.width||c,s.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((s.width||c)*i)),u.height=Math.max(1,Math.round((s.height||c)*i)),u.getContext("2d").drawImage(s,0,0,u.width,u.height);const m=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of m){const b=u.toDataURL(f,y);if(b.length<=n)return b}}catch(s){const c=p("[data-launch-coin-status]"),i="Preview unavailable; SlimeWire will try to convert this image during launch.";if(a.launchCoinStatus=i,v(c,i),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:s?.message||""}),o.length<=r)return o}if(o.length<=r){const s=p("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return a.launchCoinStatus=c,v(s,c),o}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function Ug(){const e=p("[data-launch-coin-image]")?.files?.[0];if(e){const n=await Cu(e);return{imageName:e.name,imageType:ml(n,e.type||"application/octet-stream"),imageDataUrl:n}}const t=a.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||ml(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function Lu(e,t){const n=String(t||"").trim();a.launchCoinDraft={...e||{},tokenMint:n,updatedAt:new Date().toISOString()},pr(a.launchCoinDraft),a.terminalToken=n,a.terminalAutoToken=n,a.tradeToken=n,a.bundleToken=n,a.volumeToken=n,a.smartChartToken=n,e?.tradePresetId&&(a.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(a.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(a.quickBuyAmountOverride=G(e.amountSol))}function qg(e={}){const t=e.tradePresetId?ne("trade",e.tradePresetId):null,n=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,amountSol:G(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Hg(e={}){const t=e.tradePresetId?ne("trade",e.tradePresetId):null,n=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,walletIndexes:[n],amountSol:G(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function xu(e={}){const t=e.bundlePresetId?ne("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:G(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Kg(){const e=qn({silent:!0}),t=String(e.tokenMint||"").trim(),n=p("[data-launch-coin-status]");if(!t||t.length<32){a.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",v(n,a.launchCoinStatus);return}Lu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";a.launchCoinStatus=`Loaded ${w(t)} into ${Jr(e.action)}. Review the selected preset before sending any trade.`,ke("/terminal",r),h({force:!0})}async function Vg(e,t){const n=Date.now();let r="",o=0;for(;Date.now()-n<18e4;){await Be(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,o=0}catch{if(o+=1,o===4){const m="Progress feed reconnecting...";a.launchCoinStatus=m,v(t,m)}if(o>=15){const m=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw m.launchAttemptId=e,m}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const d=new Error(c.failureReason||"Launch failed.");throw d.launchAttemptId=e,d}const i=Math.round((Date.now()-n)/1e3),u=`${c.stageText||"Working..."} · ${i}s`;u!==r&&(r=u,a.launchCoinStatus=u,v(t,u))}const s=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw s.launchAttemptId=e,s}const Mu=new Map;function Bu(e){const t=String(e||"").trim();t&&Mu.set(t,Date.now()+3e4)}function zg(e){const t=Mu.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function Ru(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(a.tradePlans=e.plans)}catch{}}function jg(e,t={},n={}){const r=String(e||"").trim();if(!r)return;const o=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||w(r),s=String(t.name||"").slice(0,48),c=Number(n.bundledWalletCount||0)+(n.devBuyIncluded?1:0)||1;(a.positions||[]).some(u=>String(u.tokenMint||u.mint)===r)||(a.positions=[{tokenMint:r,symbol:o,name:s,shortMint:w(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...a.positions||[]]),a.smartChartToken=r,a.terminalToken=r,Ml({tokenMint:r,symbol:o,name:s,imageUrl:t.imageDataUrl||"",source:"launch"}),yd(r)}async function Gg(){if(a.launchCoinSubmitting)return;const e=p("[data-launch-coin-status]"),t=p("[data-launch-coin-submit]");a.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const n=qn({silent:!0});if(!n.name||String(n.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!n.symbol||String(n.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!p("[data-launch-coin-image]")?.files?.[0]&&!a.launchCoinDraft?.imageDataUrl&&!await Ae({title:"No Coin Image Selected",lines:[`${n.name} (${n.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){a.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",v(e,a.launchCoinStatus);return}a.launchCoinStatus="Preparing image for SlimeWire backend conversion...",v(e,a.launchCoinStatus);const r=await Ug(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let s=null;if(n.action==="bundle"){const y=xu(n);s={walletIndexes:y.walletIndexes||[],walletGroup:y.walletGroup||"",amountSol:y.amountSol||"0",slippageBps:y.slippageBps||"300"}}const c={...n,...r,launchAttemptId:o,...s?{bundleBuy:s}:{}},i=JSON.stringify(c);if(i.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:n.symbol,selectedDevWalletId:n.selectedDevWalletId||n.devWalletIndex||n.devWalletPublicKey||""}),a.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,v(e,a.launchCoinStatus);let d=(await k("/api/web/launch/coin",{method:"POST",body:i,timeoutMs:Z,preserveSafeError:!0})).launch||{};d.async&&d.status==="RUNNING"&&d.launchAttemptId&&(d=await Vg(d.launchAttemptId,e));const m=String(d.tokenMint||d.mint||d.ca||d.contractAddress||"").trim(),f=d.signature?` Signature: ${w(d.signature)}.`:"";if(!m){a.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${f} Paste the CA above when it appears, then tap Use Live CA.`,v(e,a.launchCoinStatus);return}Lu(n,m),a.launchShareKit={tokenMint:m,symbol:n.symbol||"",name:n.name||"",at:Date.now()},a.launchCoinDraft={tokenMint:m};try{pr(a.launchCoinDraft)}catch{}if(d.bundled){const y=Number(d.bundledWalletCount||0),S=[d.devBuyIncluded?"dev buy":"",y>0?`${y} bundle buy${y===1?"":"s"}`:""].filter(Boolean).join(" + ");a.launchCoinStatus=d.bundleFallback?`Launched ${w(m)} via the standard path (bundle missed the block lottery)${S?` - server fired ${S} right behind the create`:""}.${f} Opening chart...`:`Launch bundled atomically: ${w(m)}${S?` (${S} landed in-block)`:""}${d.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${f} Opening chart...`,v(e,a.launchCoinStatus),jg(m,n,d),H(d.signature||"","pump-launch-first-buys"),ft({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(d.bundleFallback||d.exitsArmed)&&Bu(m),[3e3,8e3,16e3].forEach(P=>window.setTimeout(()=>{Ru().then(()=>h())},P)),ke("/terminal/chart","smartChart"),h({force:!0});return}if(a.launchCoinStatus=`Launch returned ${w(m)}.${f} Routing into ${Jr(n.action)}...`,v(e,a.launchCoinStatus),n.devBuyEnabled&&(a.launchCoinStatus=`Launch returned ${w(m)}.${f} Running Dev Wallet Initial Buy first...`,v(e,a.launchCoinStatus),await ho(m,Hg(n)),a.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${Jr(n.action)} setup...`,v(e,a.launchCoinStatus)),n.action==="trade"){await ho(m,qg(n));return}if(n.action==="bundle"){await sd(m,xu(n));return}if(n.action==="launch-watch"){a.activeTab="launch",ke("/terminal","launch"),h({force:!0});return}ke("/terminal/chart","smartChart"),h({force:!0})}catch(n){const r=n.launchAttemptId&&!String(n.message||"").includes(n.launchAttemptId)?` Launch ID: ${n.launchAttemptId}.`:"";a.launchCoinStatus=`${n.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:n.launchAttemptId||"",stage:n.stage||"",code:n.code||"",providerStatus:n.providerStatus||null,message:n.message||"Launch failed."}),v(e,a.launchCoinStatus),$(a.launchCoinStatus)}finally{a.launchCoinSubmitting=!1;const n=p("[data-launch-coin-submit]");n&&(n.disabled=!1,n.textContent=n.dataset.prevLabel||"Launch on Pump")}}function Xg(){const e=a.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function Iu(){return a.launchWatches.length?`
    <div class="mini-results">
      ${a.launchWatches.map(e=>`
        <span>
          $${l(e.ticker)} - ${l(e.status)} - ${l(e.walletCount)} wallet(s)
          ${ze(qh(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${l(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function Yr(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function Ou(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),n=Ge(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),o=String(e.kolName||e.traderName||e.kol_name||"").trim(),s=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||n||o||r,wallet:t,kolWallet:t,twitter:n,handle:n,name:o||s||e.signalType||e.symbol||w(r),displayName:o||s||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||n?1:0),currentPositionCount:I(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:a.kolLastUpdatedAt||new Date().toISOString()}}function Qr(e={}){const t=Number(I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),n=rt(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(n),o=r?Math.max(0,Math.min(100,Math.round(n))):0,s=!r||t<5,c=s?"Mixed":o>=50?"High Dump Risk":o>=30?"Dump Risk":o<=15?"Trusted Flow":"Mixed",i=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=i[0]||"",d=Ge(e.handle||e.twitter||""),m=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,b)=>/^https?:\/\//i.test(String(f.url||""))&&b.findIndex(S=>String(S.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:Yr(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:i,callsTracked:t,currentPositionCount:I(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:o,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?o:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:s,confidence:s?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:m,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:s?["Low local sell-window history. Wallet-based until social signal data is available."]:o>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Jg(e=[]){const t=new Map;for(const n of e.filter(Boolean)){const r=String(n.kolId||Yr(n)||"").trim();if(!r)continue;const o=t.get(r);t.set(r,o?{...o,...n,kolId:r}:{...n,kolId:r})}return[...t.values()]}function Zr(){const e=Array.isArray(a.kolDumpStats?.stats)?a.kolDumpStats.stats:[],t=Array.isArray(a.kolScan?.kols)?a.kolScan.kols:[],n=Array.isArray(a.kolScan?.rows)?a.kolScan.rows.map(Ou):[],r=!e.length&&!t.length&&!n.length?ol():[];return Jg([...e,...t.map(Qr),...n.map(Qr),...r.map(Qr)]).filter(o=>o.kolId)}function Yg(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function Hn(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${Yg(e)} · ${t}`}function Eu(e={}){const t=Yr(e);return t?Zr().find(n=>String(n.kolId||"")===t)||Qr(e):null}function Qg(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const n=Et(t)?t:"";return{kolId:t,displayName:n?w(n):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:n?[n]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:n?`https://solscan.io/account/${encodeURIComponent(n)}`:""},{label:"KOLscan",url:n?`https://kolscan.io/account/${encodeURIComponent(n)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function fl(e={},t="KOL Info"){if(!N("kolDumpDetectorEnabled",!0))return"";const n=Eu(e),r=String(n?.kolId||Yr(e)||"").trim();if(!r)return"";const o=n?Hn(n):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${l(r)}" title="${l(o)}">${l(t)}</button>`}function Fu(e={},t="KOL Info"){return N("kolDumpDetectorEnabled",!0)?fl(Ou(e),t):""}function Zg(e={}){if(!N("kolDumpDetectorEnabled",!0))return"";const t=Eu(e);return t?.kolId?`<small class="kol-dump-inline">${l(Hn(t))}</small>`:""}function OS(){if(!N("kolDumpDetectorEnabled",!0))return"";const e=Zr().slice(0,6);return`
    <section class="kol-dump-panel">
      <div class="terminal-title-row">
        <div>
          <h3>KOL Dump Detector</h3>
          <p>Tracks whether watched KOL wallets tend to sell into followers.</p>
        </div>
        <span>${a.kolDumpStatsLoading?"Updating":e.length?`${e.length} tracked`:"Low data"}</span>
      </div>
      <small>${l(a.kolDumpStats?.message||"Wallet-based until social signal data is available.")}</small>
      ${e.length?`
        <div class="kol-dump-list">
          ${e.map(t=>`
            <article class="kol-dump-row">
              <div>
                <strong>${l(t.displayName||"KOL Wallet")}</strong>
                <span>${l(t.handle?`@${t.handle}`:t.walletAddresses?.[0]?w(t.walletAddresses[0]):"wallet pending")}</span>
              </div>
              <p>${l(Hn(t))}</p>
              <button type="button" data-kol-dump-details="${l(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:R("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function hl(e={}){if(!N("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&a.kolDumpStatsLoadedAt&&Date.now()-Number(a.kolDumpStatsLoadedAt||0)<900*1e3)return a.kolDumpStats;if(a.kolDumpStatsLoading)return null;a.kolDumpStatsLoading=!0;try{const n=new URLSearchParams({mode:a.kolMode||"hot"});a.kolWallet&&n.set("wallet",a.kolWallet),t&&n.set("force","true");const r=await k(`/api/web/kols/dump-stats?${n.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return a.kolDumpStats=r,a.kolDumpStatsLoadedAt=Date.now(),te(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return a.kolDumpStats=a.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},a.kolDumpStatsLoadedAt=Date.now(),null}finally{a.kolDumpStatsLoading=!1,a.kolDumpDetails?.open?eo():a.activeTab==="kol"&&h({force:!0})}}function eb(e=""){const t=String(e||"").trim();!t||!N("kolDumpDetectorEnabled",!0)||(a.kolDumpDetails={open:!0,kolId:t},Ra(),eo(),hl({force:!0}))}function gl(){a.kolDumpDetails={open:!1,kolId:""},eo(),Pr()}function eo(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=a.kolDumpDetails||{},n=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",n),!n||!N("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=Zr().find(d=>String(d.kolId)===String(t.kolId))||Qg(t.kolId),o=!!a.kolDumpStatsLoading,s=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(d=>/^https?:\/\//i.test(String(d?.url||""))).slice(0,4):[],i=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",u=`
    <div class="slimeshield-drawer-backdrop" data-kol-dump-close></div>
    <aside class="kol-dump-drawer" role="dialog" aria-modal="true" aria-label="KOL Dump Detector details">
      <header>
        <div>
          <span>KOL Dump Detector</span>
          <h3>${l(r.displayName||"KOL Wallet")}</h3>
        </div>
        <button type="button" data-kol-dump-close>Close</button>
      </header>
      <section class="kol-dump-detail-summary">
        <strong>${l(r.riskLabel||"Mixed")}</strong>
        <p>${l(Hn(r))}</p>
        <small>${o?"Updating from KOL sources...":`Confidence: ${l(r.confidence||"low")} · Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${l(ve(r.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Calls tracked</dt><dd>${l(r.callsTracked??0)}</dd></div>
        <div><dt>Current positions</dt><dd>${l(r.currentPositionCount??0)}</dd></div>
        <div><dt>Sold within 15m</dt><dd>${r.soldWithin15mPercent==null?"n/a":`${l(r.soldWithin15mPercent)}%`}</dd></div>
        <div><dt>Sold within 60m</dt><dd>${r.soldWithin60mPercent==null?"n/a":`${l(r.soldWithin60mPercent)}%`}</dd></div>
        <div><dt>Median hold</dt><dd>${r.medianHoldMinutes==null?"n/a":`${l(r.medianHoldMinutes)}m`}</dd></div>
        <div><dt>Median drawdown</dt><dd>${r.medianPostSignalDrawdownPercent==null?"n/a":`${l(r.medianPostSignalDrawdownPercent)}%`}</dd></div>
        <div><dt>30m survival</dt><dd>${r.followerSurvival30mPercent==null?"n/a":`${l(r.followerSurvival30mPercent)}%`}</dd></div>
        <div><dt>Last token seen</dt><dd>${l(i)}</dd></div>
      </dl>
      <section>
        <h4>Cached Profile Info</h4>
        <ul class="slimeshield-factor-list">
          <li><span>Wallets: ${l(s.length?s.map(w).join(", "):"not returned")}</span></li>
          <li><span>First seen: ${l(r.firstSeenAt?ve(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${l(r.lastSeenAt?ve(r.lastSeenAt):"n/a")}</span></li>
          <li><span>Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))}</span></li>
        </ul>
        ${c.length?`<div class="slimeshield-drawer-actions">${c.map(d=>`<a href="${l(d.url)}" target="_blank" rel="noreferrer">${l(d.label||"Open")}</a>`).join("")}</div>`:""}
      </section>
      <section>
        <h4>Interpretation</h4>
        <ul class="slimeshield-factor-list">
          ${(r.reasons||["No local sell-window history yet."]).map(d=>`<li><span>${l(d)}</span></li>`).join("")}
        </ul>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-kol-dump-refresh="${l(t.kolId)}" ${o?"disabled":""}>${o?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `;nr(e,u,".kol-dump-drawer")}function tb(){const e=a.kolScan?.configured!==!1,t=a.kolLoading?"disabled":"",n=String(a.kolMode||"hot"),r=!!a.kolScan,o=!!a.kolScan?.kols?.length,s=o&&n!=="hot",c=!r&&!o;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${a.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${a.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${a.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${a.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${a.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${a.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${l(nb(a.kolMode))}</p>
    ${ab()}
    ${s?ob():c?zh():""}
    ${a.kolMode==="slimewire"&&a.kolScan?a.kolScan.kols?.length?"":R("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):a.kolScan?sb():R("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
    <details class="kol-management-settings" data-kol-management-settings>
      <summary>
        <span>Wallet Management / Copy Settings</span>
        <small>Buy amount, TP/SL, wallet groups, copy plan, and outside KOL tools</small>
      </summary>
      <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>KOL Copy Setup</h3>
            <p>Pick wallets and exits once, then buy a selected KOL position, send it to Trade/Bundle, or arm Copy Wallet for the next new buy.</p>
          </div>
        </div>
        ${a.wallets.length?`
          <div class="wallet-checks">
            ${bt("kol")}
          </div>
          ${Ft("kol")}
        `:`
          <p class="trade-status">KOL viewing works now. Create, restore, or import a wallet before using Copy Plan to trade.</p>
          <button class="secondary" data-tab="wallets">Open Wallets</button>
        `}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-kol-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-kol-tp data-custom-select="kol-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="40">+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-tp-custom data-custom-for="kol-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-kol-sl data-custom-select="kol-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-sl-custom data-custom-for="kol-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            ${je("kol-delay","data-kol-delay","5")}
          </label>
          <label>
            Repeat
            <select data-kol-loop data-custom-select="kol-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-loop-custom data-custom-for="kol-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${Hr("kol-loop-delay","data-kol-loop-delay","0")}
          </label>
          <label>
            Slippage
            <select data-kol-slippage data-custom-select="kol-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-slippage-custom data-custom-for="kol-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${Vr("kol")}
        <p class="trade-status" data-kol-status>${a.kolResult?l(a.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${rb()}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Custom KOL Wallet</h3>
          <p>Paste any public Solana wallet to inspect current holdings, open an outside trader profile, or arm copy-watch from your selected wallets.</p>
          <label>
            Wallet Address
            <input data-kol-wallet type="text" placeholder="Paste KOL wallet" value="${l(a.kolWallet||"")}">
          </label>
          <div class="card-actions">
            <button data-kol-wallet-scan ${t}>${a.kolLoading?"Scanning...":"Scan Wallet"}</button>
            ${a.kolWallet?`<button class="primary" data-kol-copy-wallet="${l(a.kolWallet)}" ${t}>Copy Wallet Next Buy</button>`:""}
            ${a.kolWallet?ze(iu(a.kolWallet),"Share KOL"):""}
          </div>
        </article>
        <article>
          <h3>KOL Tools</h3>
          <p>Open outside KOL dashboards for extra wallet context, then come back here to trade, bundle, or copy from your saved wallets.</p>
          <div class="card-actions">
            <a href="https://kolscan.io/trades" target="_blank" rel="noreferrer">Live Trader Feed</a>
            <a href="https://kolscan.io/leaderboard" target="_blank" rel="noreferrer">Trader Leaderboard</a>
          </div>
        </article>
      </aside>
      </section>
    </details>
  `}function ab(){const e=a.kolScan||null,t=Kn(a.kolMode),n=a.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),o=Number(e?.rows?.length||0),s=a.kolLastUpdatedAt?ve(a.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${l(n)}</span>
      <span>${l(r)} KOLs</span>
      <span>${l(o)} signals</span>
      <span>${l(s)}</span>
    </div>
  `}function Kn(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function nb(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function rb(){const e=a.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function ob(){const e=a.kolScan||{},t=(e.kols||[]).filter(n=>n.wallet||n.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${l(e.label||"KOL Tracker")}</h3>
          <p>${l(`${Kn(a.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${l(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((n,r)=>`
          <article class="kol-profile">
            ${mu(n)}
            <div class="pick-top">
              <span>${r+1}</span>
              <h3>${l(n.name||n.shortWallet||"KOL Wallet")}</h3>
              <em>${l(n.winRateLabel||"n/a")}</em>
            </div>
            <p>${n.twitter?`@${l(n.twitter)}`:l(n.shortWallet||n.wallet||"")}</p>
            <dl>
              <div><dt>Realized</dt><dd>${l(n.realizedLabel||"n/a")}</dd></div>
              <div><dt>ROI</dt><dd>${l(n.roiLabel||"n/a")}</dd></div>
              <div><dt>Trades</dt><dd>${l(n.trades??"n/a")}</dd></div>
            </dl>
            <small>${l(n.source==="slimewire"?`Tracking ${n.trackedWalletMode==="manual"?`${n.trackedWalletCount||0} wallet(s)`:"all wallets"}`:n.volumeLabel||"Volume n/a")} | Last trade: ${l(ve(n.lastTradeAt))}</small>
            ${Zg(n)}
            <div class="card-actions kol-profile-actions">
              ${n.solscanUrl?`<a href="${l(n.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${n.kolscanUrl||n.wallet?`<a href="${l(n.kolscanUrl||sc(n.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${fl(n)}
              ${ze(Uh(n),"Share Watch")}
              ${n.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n.wallet)}">Copy Trade</button>`:""}
              ${n.wallet?`<button data-kol-scan-wallet="${l(n.wallet)}">Scan Positions</button>`:""}
              ${n.wallet?`<button data-kol-copy-wallet="${l(n.wallet)}">Copy Wallet</button>`:""}
              ${n.wallet?`<button data-copy="${l(n.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function sb(){const e=a.kolScan||{};if(e.configured===!1)return R("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],n=tt("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${l(Kn(a.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${n.length}/${t.length} signals shown</span>
    </div>
    ${st(n,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:_h})}
    ${sa("kol",t,"KOL signals")}
  `:R(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function Wu(){const e=p("input[data-wallet-label]"),t=p("input[data-wallet-count-input]"),n=p("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),v(n,"Creating wallets..."),r.forEach(o=>{o.disabled=!0,v(o,"Creating...")});try{const o=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(o)||o<1||o>20)throw new Error("Wallet count must be from 1 to 20.");await X(n,"Creating secure web profile for wallet backups...");const s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:o})}),c=Array.isArray(s.wallets)?s.wallets:[];if(!c.length)throw new Error(s.message||"Wallet create did not return wallet data. Refresh and try again.");a.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&me(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&me(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),v(n,s.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const i=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(i?.wallets)&&(a.wallets=i.wallets)}catch{}a.toolSections={...a.toolSections||{},wallets:"balances"},a.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,H(Ce(s.plan),"wallet-create"),a.activeTab="wallets",h()}catch(o){v(n,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,v(o,"Create Wallets")})}}async function lb(){const e=p("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),a.automationDelegationStatus="Creating automation wallet...",v(e,a.automationDelegationStatus),t.forEach(n=>{n.disabled=!0,v(n,"Creating...")});try{await X(e,"Creating secure web profile for automation wallet backups...");const n=a.user?.connectedWallet,r=n?.publicKey?`Automation ${w(n.publicKey)}`:"Automation Wallet",o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(o.wallets)?o.wallets:[]).length)throw new Error(o.message||"Automation wallet create did not return wallet data. Refresh and try again.");a.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&me(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&me(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),a.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",H(Ce(o.plan),"automation-wallet-create"),a.activeTab="wallets",h({force:!0})}catch(n){a.automationDelegationStatus=n.message,v(e,n.message),$(n.message)}finally{t.forEach(n=>{n.disabled=!1,v(n,"Create Automation Wallet")})}}function ib(e=null){const n=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||p("[data-session-wallet-amount]"),r=G(n?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const o=Number(r);if(!Number.isFinite(o)||o<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(o>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function cb(e=le()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(a.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});de(t.user||{...a.user,connectedWallet:t.profile?.connectedWallet||null})}async function ub(e=null){const t=p("[data-automation-delegation-status]")||p("[data-wallet-connect-status]"),n=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),n.forEach(r=>{r.disabled=!0,v(r,"Opening...")});try{const r=ib(e),{provider:o,connected:s}=await Xu();await X(t,"Creating secure web profile for session wallet..."),await cb(s),a.automationDelegationStatus="Creating session wallet and funding approval...",v(t,a.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(s.publicKey)}`}),dedupe:!1,timeoutMs:Z});a.wallets=Array.isArray(c.wallets)?c.wallets:a.wallets,a.downloads=c.downloads||a.downloads||null,c.downloads?.encryptedBackup?.text&&me(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&me(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",v(t,a.automationDelegationStatus);const i=await Wb(c.order?.transaction,o);a.automationDelegationStatus="Submitting session wallet funding...",v(t,a.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:i}),dedupe:!1,timeoutMs:Z});a.wallets=Array.isArray(u.wallets)?u.wallets:a.wallets,a.automationDelegationStatus=u.message||"Session wallet funded and ready.",H(u.signature||"","session-wallet-funded"),await ht({force:!0,deep:!0,reason:"session-wallet-funded"}),a.activeTab="wallets",h({force:!0})}catch(r){const o=W(r.message||"Session wallet setup failed.");a.automationDelegationStatus=o,v(t,o),$(o)}finally{n.forEach(r=>{r.disabled=!1,v(r,"Start Session Wallet")})}}async function bl(e="enable",t={}){const n=p("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],o=e!=="revoke";if(o&&!Kc()){a.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",v(n,a.automationDelegationStatus),$(a.automationDelegationStatus),Ys();return}Hc(!o,t.scope||""),a.automationDelegationStatus=o?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",v(n,a.automationDelegationStatus),r.forEach(s=>{s.disabled=!0,v(s,o?"Enabling...":"Revoking...")});try{await X(n,"Creating secure web profile for automation permission...");const s=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:o?"enable":"revoke",ttlHours:720})});de(s.user||{...a.user,automationPermission:s.profile?.automationPermission||null});const c=a.user?.automationPermission||{};a.automationDelegationStatus=o?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${ve(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(s){a.automationDelegationStatus=s.message,v(n,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,v(s,s.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function yl(e={}){const t=!!e.silent,n=e.refreshWallet!==!1;if(!a.user||!a.token){t||$("Log in or create a web account before checking server exits.");return}if(Sr){a.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}Sr=!0,t||(a.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:Z});a.tradePlans=r.plans||a.tradePlans||[];const o=r.runner||{},s=r.webExitGuards||{},c=r.portfolioExits||{},i=Number(o.soldWallets||0)+Number(s.soldGuards||0)+Number(c.soldPositions||0),u=Number(o.triggeredWallets||0)+Number(s.triggeredGuards||0)+Number(c.triggeredPositions||0);if(o.skipped){const d=Number(o.activeForMs||0),m=d>0?` for ${Math.ceil(d/1e3)}s`:"";a.automationDelegationStatus=o.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${m}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${o.reason||"runner busy"}.`,n&&!t&&await Ws({force:!0});return}a.automationDelegationStatus=db(o),(n||i>0||u>0)&&await Ws({force:!0}),t&&(i>0||u>0)&&h({preserveSmartChartFrame:a.activeTab==="smartChart"})}catch(r){a.automationDelegationStatus=r.message,a.walletRefreshError=r.message,t||$(r.message)}finally{Sr=!1,t||(a.walletRefreshing=!1,h())}}function db(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),n=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),o=Number(e.failedWallets||0),s=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${n}, sold ${r}, failed ${o}.${s}`}function vl(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(a.tradePlans||[]).some(t=>{const n=String(t.status||"").toLowerCase();return n==="launch_watch"?!0:n!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function pb(){return!!(Vc()&&vl()&&!Sr)}function to(){vl()&&(a.automationDelegationStatus=a.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),mb()}let ao="";function mb(){const t=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active","armed","pending"].includes(String(i.status||"").toLowerCase()));if(!t.length){ao="";return}const n=Date.now(),r=t.filter(i=>i.automationPermissionExpiresAt&&!i.automationPermissionActive),o=t.filter(i=>{if(!i.automationPermissionActive)return!1;const u=Date.parse(i.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>n&&u-n<3600*1e3});let s="";if(r.length)s=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(o.length){const i=Math.min(...o.map(d=>Date.parse(d.automationPermissionExpiresAt)));s=`TP/SL permission expires in ~${Math.max(1,Math.round((i-n)/6e4))} min with ${o.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=s?`${r.length}:${o.length}`:"";s&&c!==ao?(ao=c,$(s)):s||(ao="")}function fb(){hn.forEach(e=>window.clearTimeout(e)),hn=[]}function no(){fb(),a.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",hn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const n=window.setTimeout(()=>{hn=hn.filter(r=>r!==n),!(!a.user||!a.token||!vl())&&yl({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{a.automationDelegationStatus=r.message})},t);return n})}async function hb(){const e=p("[data-restore-text]"),t=p("[data-restore-status]");if(!e||!t)return;const n=e.value.trim();if(!n){v(t,"Choose a backup file or paste backup text first.");return}v(t,"Restoring wallets...");try{await X(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:n})});a.restoreResult=r.restore,r.restore?.downloads&&(a.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&me(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&me(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",v(t,r.restore?.message||"Restore complete."),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(r){v(t,r.message)}}async function gb(){const e=p("[data-export-status]");if(e){v(e,"Building backup files...");try{await X(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});a.backupResult=t.backup,t.backup?.downloads&&(a.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&me(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&me(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),v(e,t.backup?.message||"Backup ready."),h()}catch(t){v(e,t.message)}}}async function bb(){const e=p("[data-import-label]"),t=p("[data-import-secret]"),n=p("[data-import-status]");if(!e||!t||!n)return;const r=e.value.trim()||"Imported Wallet",o=t.value.trim();if(!o){v(n,"Paste a private key or JSON secret-key array first.");return}v(n,"Importing wallet...");try{await X(n,"Creating secure web profile for imported wallet...");const s=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:o})});a.importResult=s.imported,s.imported?.downloads&&(a.downloads=s.imported.downloads,s.imported.downloads.encryptedBackup&&me(s.imported.downloads.encryptedBackup.filename,s.imported.downloads.encryptedBackup.text),s.imported.downloads.recoveryKeys&&me(s.imported.downloads.recoveryKeys.filename,s.imported.downloads.recoveryKeys.text)),t.value="",v(n,s.imported?.message||"Import complete."),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(s){v(n,s.message)}}async function yb(e,t="this wallet",n=""){const r=String(t||`Wallet ${e}`);if(!await Ae({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Ae({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=p("[data-wallet-remove-status]");a.walletRemoveStatus=`Backing up ${r} before removal...`,v(c,a.walletRemoveStatus),$("");try{const i=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(n?{publicKeys:[n]}:{walletIndexes:[String(e)]})}),u=i.removed||{};a.downloads=u.downloads||a.downloads,u.downloads?.encryptedBackup?.text&&me(u.downloads.encryptedBackup.filename,u.downloads.encryptedBackup.text),u.downloads?.recoveryKeys?.text&&me(u.downloads.recoveryKeys.filename,u.downloads.recoveryKeys.text),a.walletRemoveStatus=u.message||`Removed ${r}.`,Array.isArray(u.wallets)&&(a.wallets=u.wallets),H(Ce(i.plan),"wallet-remove"),a.activeTab="wallets",h()}catch(i){a.walletRemoveStatus=i.message,v(c,i.message),$(i.message)}}function vb(){const e=String(p("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(n=>n.trim()).filter(Boolean),walletGroup:String(p("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(p("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(p("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(p("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function wb(){const e=String(p("[data-wallet-send-from]")?.value||"1").trim(),t=String(p("[data-wallet-send-managed-targets]")?.value||"").trim(),n=String(p("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(p("[data-wallet-send-destinations]")?.value||"").trim(),o=t.toLowerCase()==="all"?a.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),s=n?a.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===n||d.startsWith(`${n} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...o,...s])].map(u=>a.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),i=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(p("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!p("[data-wallet-send-all]")?.checked,destinations:i}}function Sb(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const n=e.rows.slice(0,6).map(r=>{const o=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,s=r.ok?"ok":"failed";return`${o}: ${s} - ${r.message||r.signature||"done"}`});t.push(...n),e.rows.length>n.length&&t.push(`...${e.rows.length-n.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function kb(e){const t=p("[data-wallet-sweep-status]");a.walletSweepStatus="Running wallet action...",v(t,a.walletSweepStatus),$("");try{await X(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const o=e==="send-sol-many"?wb():vb();if(e==="sell-all"&&(o.destination=""),e==="sell-all-sweep"&&!o.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const s=await k(r,{method:"POST",body:JSON.stringify(o),timeoutMs:Z});a.walletSweepStatus=Sb(s.sweep),v(t,a.walletSweepStatus),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(n){a.walletSweepStatus=n.message,v(t,n.message),$(n.message)}}async function $b(e){const t=p("[data-restore-status]"),n=p("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!n)){v(t,"Reading backup file...");try{n.value=await r.text(),v(t,"Backup loaded. Tap Restore Wallets.")}catch(o){v(t,`Could not read file: ${o.message}`)}}}function me(e,t){const n=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(n),o=document.createElement("a");o.href=r,o.download=e,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Tb(){const e=p("[data-x-handle]"),t=p("[data-x-status]"),n=Ge(e?.value||"");if(!n){v(t,"Enter a valid X handle first.");return}const r=window.open(il(n),"_blank","noopener,noreferrer");try{v(t,r?`Opening X and saving @${n}...`:`Saving @${n}. Allow popups if X did not open.`),await X(t,"Creating secure web profile for X sharing...");const o=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:n})});de(o.user||{...a.user,xHandle:o.profile?.xHandle||n}),Ai(a.xHandle),v(t,`Connected @${a.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(o){v(t,o.message),$(o.message)}}function Pb(){const e=p("[data-x-status]"),t=Ge(p("[data-x-handle]")?.value||a.xHandle||""),n=il(t||a.xHandle);window.open(n,"_blank","noopener,noreferrer"),v(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function Ab(){const e=p("[data-x-status]"),t=p("[data-x-handle]");try{if(!a.user||!a.token){a.xHandle="",t&&(t.value=""),ss(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const n=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});de(n.user||{...a.user,xHandle:""}),a.xHandle="",t&&(t.value=""),ss(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(n){v(e,n.message),$(n.message)}}async function ro(e,t="Saving PFP..."){const n=p("[data-avatar-status]");v(n,t);try{await X(n,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});de(r.user||{...a.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),v(n,a.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){v(n,r.message),$(r.message)}}async function Cb(e){const t=p("[data-avatar-status]"),n=e?.files?.[0];if(n){if(!/^image\/(png|jpe?g|webp)$/i.test(n.type)){v(t,"Use a PNG, JPG, or WebP image.");return}if(n.size>5*1024*1024){v(t,"Use an image under 5 MB.");return}try{v(t,"Compressing PFP...");const r=await Nu(n);await ro({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){v(t,r.message),$(r.message)}finally{e.value=""}}}function Nu(e){return new Promise((t,n)=>{const r=new FileReader;r.onerror=()=>n(new Error("Could not read that image.")),r.onload=()=>{const o=new Image;o.onerror=()=>n(new Error("Could not load that image.")),o.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const i=c.getContext("2d");if(!i){n(new Error("This browser cannot resize images."));return}const u=Math.max(256/o.width,256/o.height),d=Math.round(o.width*u),m=Math.round(o.height*u),f=Math.round((256-d)/2),y=Math.round((256-m)/2);i.clearRect(0,0,256,256),i.drawImage(o,f,y,d,m);const b=c.toDataURL("image/jpeg",.84);if(b.length>22e4){n(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(b)},o.src=String(r.result||"")},r.readAsDataURL(e)})}async function Lb(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,n=new URL(String(e||""),t).toString(),r=await fetch(n,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const o=await r.blob();return Nu(o)}async function xb(){const e=ll(a.xHandle);if(!e){const t=p("[data-avatar-status]");v(t,"Connect an X handle first.");return}await ro({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function Du(e,t={}){const n=kn(),r=pe(e);if(!r){if(await nc(e,t)||rc(e))return;const o=zi(e);ae(o),Mt(e,new Error(o),{action:"provider_missing",platform:He()?"mobile":"desktop"});return}try{const o=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(o){if(!(t.confirmSwitch===!1?!0:await Ae({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(o)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){ae("Wallet connection unchanged."),ke("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}ae(`Opening ${Oe(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,i=c?.toBase58?.()||c?.toString?.()||"";if(!i)throw new Error("Wallet connected, but no public address was returned.");await X(n,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:i,provider:Oe(e,r)})});de(u.user||{...a.user,connectedWallet:u.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:i,shortPublicKey:w(i),provider:Oe(e,r),tokens:[]},Js(`connected:${i}`),a.walletConnectMenuOpen=!1,ae(`Connected ${w(i)}. Opening Live Terminal...`),ke(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),zc("browser-wallet-connect"),Br("browser-wallet-connect")}catch(o){const s=o.message||"Wallet connection was cancelled.";ae(s),Mt(e,o,{action:"connect_failed"})}}async function _u(){await $u("disconnecting");const e=kn(),t=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(!a.user||!a.token){a.connectedWalletBalance=null,Js(t?`connected:${t}`:""),ae("Connected wallet disconnected."),h({force:!0});return}try{const n=a.user?.connectedWallet?.provider||"";await(n.toLowerCase().includes("phantom")?pe("phantom"):n.toLowerCase().includes("solflare")?pe("solflare"):n.toLowerCase().includes("backpack")?pe("backpack"):pe("solana"))?.disconnect?.()}catch{}try{const n=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});de(n.user||{...a.user,connectedWallet:null}),a.connectedWalletBalance=null,Js(t?`connected:${t}`:""),ae("Connected wallet disconnected."),h({force:!0})}catch(n){ae(n.message),$(n.message)}}async function Mb(){const e=p("[data-profile-username]"),t=p("[data-profile-password]"),n=p("[data-login-security-status]"),r=String(e?.value||"").trim(),o=String(t?.value||"");if(!r||!o){v(n,"Enter a username and password first.");return}try{await X(n,"Creating secure web profile..."),v(n,"Saving login...");const s=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:o})});de(s.user||{...a.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),v(n,"Saved. You can now log back in with this username and password."),h()}catch(s){v(n,s.message),$(s.message)}}function Ge(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function wl(e){const t=nl(e),n=String(a.user?.referralLink||"").trim(),r=n&&!t.includes("/r/")?n:Pt,o=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(o,"_blank","noopener,noreferrer")}function Uu(e){const t=e==="kol",n=p(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=p("[data-share-watch-status]"),o=n?.value?.trim()||"";if(!o){v(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}wl(t?iu(o):rl(o)),v(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function qu(e){const t={};a.token&&(t.Authorization=`Bearer ${a.token}`);const n=await vn(ta(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!n.ok){const r=await Vi(n);throw new Error(r.message||r.error||`Could not build PnL card (${n.status}).`)}return{blob:await n.blob(),filename:n.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function Hu(e){const{blob:t,filename:n}=await qu(e),r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=n,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Bb(e,t){try{const{blob:n,filename:r}=await qu(e),o=new File([n],r,{type:"image/png"});if(navigator.canShare?.({files:[o]})){await navigator.share({title:"SlimeWire PnL Card",text:nl(t),url:Pt,files:[o]});return}await Hu(e),wl(`${t} PnL card downloaded and ready to attach.`)}catch(n){$(n.message)}}function Ku(e="buy"){const t=p("[data-trade-wallet]")?.value||"",n=Of(e)||p("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,e==="sell"?(a.tradeSwapFrom=n,a.tradeSwapTo="SOL"):(a.tradeSwapFrom="SOL",a.tradeSwapTo=n),{walletIndex:t,tokenMint:n,slippageBps:r}}function ie(e=""){return String(e||"").trim().toLowerCase()==="connected"}function Rb(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function Vu(){const e=Array.isArray(a.wallets)?a.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(Rb(e[t]))return e[t];return null}function zu(e=le()){if(!e?.publicKey)return!1;const t=Vn(e),n=pe(t)||pe("solana");return!!(n&&typeof n.signTransaction=="function")}function oo(e=le()){const t=e?.provider||Oe(Vn(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function so(e={},{side:t="trade",statusWriter:n=fe,allowSessionFallback:r=!0}={}){if(!ie(e.walletIndex))return{form:e,sessionWallet:null};if(zu())return{form:e,sessionWallet:null};const o=r?Vu():null;if(o?.index){const s=`Using Session Wallet ${o.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof n=="function"&&n(s),{form:{...e,walletIndex:String(o.index)},sessionWallet:o}}throw new Error(oo())}function ju(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Gu(e=""){const t=atob(String(e||"")),n=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)n[r]=t.charCodeAt(r);return n}function Vn(e=le()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function Ib(e=le(),{returnPath:t=Wa()||"/terminal/trade"}={}){const n=Vn(e),r=e?.provider||Oe(n);if(ca({returnPath:t}),He()&&e?.publicKey&&!pe(n)){const s=oo(e);return ae(s),s}if(ac(n)){const s=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(ae(s),await nc(n,{returnPath:t}).catch(()=>!1))return s}if(rc(n))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const o=zi(n);return ae(o),o}async function Xu(){const e=le();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=Vn(e),n=pe(t)||pe("solana");if(!n){if(He()&&e?.publicKey)throw new Error(oo(e));const s=await Ib(e,{returnPath:Wa()||"/terminal/trade"});throw new Error(s)}if(typeof n.signTransaction!="function")throw He()&&e?.publicKey?new Error(oo(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"";let o=r();if(o!==e.publicKey)try{const s=await n.connect?.({onlyIfTrusted:!0});o=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r()}catch{}if(o!==e.publicKey){const s=await n.connect?.({onlyIfTrusted:!1}),c=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:n,connected:e}}async function Ob(){try{if(He())return;const e=le();if(!e?.publicKey)return;const t=Vn(e),n=pe(t)||pe("solana");if(!n||typeof n.connect!="function"||(n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"")===e.publicKey)return;await n.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const Eb=6e4;async function Ju(e,t,n=Eb){let r=0;const o=new Promise((s,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},n)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),o])}finally{window.clearTimeout(r)}}async function Fb(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.VersionedTransaction.deserialize(Gu(e)),r=await Ju(t,n);return ju(r.serialize())}async function Wb(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.Transaction.from(Gu(e)),r=await Ju(t,n);return ju(r.serialize())}function Nb({side:e,connected:t,form:n={},actionDetail:r="",amountSol:o="",amountMode:s="",percent:c=""}={}){const i=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:s==="max"?"Max SOL":`${o||r||"custom"} SOL`;return Ae({title:`Confirm ${i}`,lines:[`${i} with ${u}?`,`Token: ${n.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:i})}async function zn({side:e,form:t,actionDetail:n,amountSol:r="",amountMode:o="",percent:s="",attemptId:c,statusWriter:i=fe}){const u=typeof i=="function"?i:fe,{provider:d,connected:m}=await Xu();if(!a.walletFastApprovalsEnabled&&!await Nb({side:e,connected:m,form:t,actionDetail:n,amountSol:r,amountMode:o,percent:s}))throw new Error("Connected-wallet trade cancelled.");Ip(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),xe("submitted","pending"),u(a.walletFastApprovalsEnabled?`Building ${e} approval for ${m.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:m.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:o,percent:s,tradeAttemptId:c}),dedupe:!1,timeoutMs:Z});xe("submitted","ok"),xe("approved","pending",`Approve in ${m.provider||"your wallet"}`),u(`Approve ${e} in ${m.provider||"your wallet"}...`);let y;try{y=await Fb(f.order?.transaction,d)}catch(S){throw xe("approved","fail",W(S?.message||"Wallet approval was declined.")),S}xe("approved","ok"),xe("sent","pending"),u("Submitting signed trade...");let b;try{b=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:Z})}catch(S){throw K(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"error",error:W(S?.message||"Trade submit failed.")}),H("",`browser-${e}-error`,{tradeAttemptId:c}),xe("sent","fail",W(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return xe("sent","ok"),xe("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),a.tradeResult=b.trade,u(b.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),K(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"submitted",signature:b.trade?.signature||""}),H(b.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),b.trade}function De(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function Xa(e,t){const n=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(n)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Db(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let n=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=Xa(n,r),{enabled:De(e)||De(t)||De(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function Yu(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let n=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=Xa(n,r),{enabled:De(e)||De(t)||De(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function fe(e){const t=p("[data-trade-status]");v(t,e)}function Ee(e=""){a.chartTradeStatus=String(e||""),v(p("[data-chart-trade-status]"),a.chartTradeStatus)}function Sl(e="",t=""){a.quickBuyModal={...a.quickBuyModal,status:String(e||""),error:String(t||"")};const n=p("[data-quick-buy-modal-status]"),r=p("[data-quick-buy-modal-error]");v(n,a.quickBuyModal.status),v(r,a.quickBuyModal.error),n&&(n.hidden=!a.quickBuyModal.status),r&&(r.hidden=!a.quickBuyModal.error)}async function lo(e,t="fixed"){const n=C();let r=t==="max"?"max":String(e||"custom"),o="";try{let s=Ku("buy");r=t==="max"?"max":String(e||"custom");const c=et("trade-buy",s.tokenMint,r);if(c){te("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(s.tokenMint)}:${r}`});return}o=mt("trade-buy");const i={tokenMint:s.tokenMint,walletIndex:s.walletIndex,slippageBps:s.slippageBps,tradeAttemptId:o},u=od();if((De(u.takeProfitPct)||De(u.stopLossPct)||De(u.sellDelay))&&Object.assign(i,{autoExit:!0,...u}),t==="max")i.amountMode="max";else{const S=Number(e);if(!Number.isFinite(S)||S<=0)throw new Error("Enter a buy amount greater than zero.");i.amountSol=String(S)}if(s=so(s,{side:"buy",statusWriter:fe}).form,i.walletIndex=s.walletIndex,ie(s.walletIndex)){K("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:C()-n,requestId:o,details:`browser-buy:${w(s.tokenMint)}:${r}`}),fe("Building wallet-approved buy..."),se(),await zn({side:"buy",form:s,actionDetail:r,amountSol:i.amountSol||"",amountMode:i.amountMode||"fixed",attemptId:o}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Pe("trade-buy",s.tokenMint,r,3e3);return}const f=Db();f.enabled&&Object.assign(i,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),K("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-n,requestId:o,details:`trade-buy:${w(s.tokenMint)}:${r}`}),h(),fe(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Be(20);const y=C();K("trade-buy",s.tokenMint,r,{state:"submitting"});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...i,clientClickToUiMs:Math.round(y-n)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-y,requestId:o,resultCount:b.trade?.signature?1:0,details:"trade-buy"}),a.tradeResult=b.trade,Ip(`Buy ${w(s.tokenMint||"")}`),xe("submitted","ok"),xe("sent","ok"),xe("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),b.trade?.autoExitPlan?(xe("armed","ok"),a.tradePlanResult=b.trade.autoExitPlan,fe(b.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),no()):b.trade?.autoExitRequested&&(xe("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),fe("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),K("trade-buy",s.tokenMint,r,{state:"submitted",signature:b.trade?.signature||""}),H(b.trade?.signature,"trade-buy",{tradeAttemptId:o}),a.activeTab="trade",h(),Pe("trade-buy",s.tokenMint,r,3e3)}catch(s){o&&(K("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,{state:"error",error:W(s.message||"Buy failed")}),Pe("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-n,requestId:o,errorCode:s?.code||s?.name||"TRADE_BUY_FAILED",details:W(s.message||"Buy failed")}),fe(s.message)}}async function kl(e){const t=C(),n=mt("manual-sell");let r=null,o=String(e||"custom");try{r=Ku("sell");const s=Number.parseInt(e,10);if(o=String(s||o),!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=et("trade-sell",r.tokenMint,o);if(c){te("buttonDoubleClickPrevented"),E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${s}`});return}if(K("trade-sell",r.tokenMint,o,{state:"clicked",tradeAttemptId:n,clickedAt:new Date().toISOString()}),fe("Sending sell..."),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-t,requestId:n,details:`${w(r.tokenMint)}:${s}`}),r=so(r,{side:"sell",statusWriter:fe}).form,ie(r.walletIndex)){se();const m=C();K("trade-sell",r.tokenMint,o,{state:"submitting"}),await zn({side:"sell",form:r,actionDetail:o,percent:String(s),attemptId:n}),E({component:"manual-sell",action:"browser-sell-request",durationMs:C()-m,requestId:n,resultCount:a.tradeResult?.signature?1:0,details:"browser-wallet"}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Pe("trade-sell",r.tokenMint,o,3e3);return}h(),await Be(20);const u=C();K("trade-sell",r.tokenMint,o,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:s,manualSellAttemptId:n,clientClickToUiMs:Math.round(u-t)}),timeoutMs:Z,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-u,requestId:n,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),a.tradeResult=d.trade,fe(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),K("trade-sell",r.tokenMint,o,{state:"submitted",signature:d.trade?.signature||""}),H(d.trade?.signature||Ce(d.trade),"manual-sell-trade"),a.activeTab="trade",h(),Pe("trade-sell",r.tokenMint,o,3e3)}catch(s){r?.tokenMint&&(K("trade-sell",r.tokenMint,o,{state:"error",error:W(s.message||"Sell failed")}),Pe("trade-sell",r.tokenMint,o,4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-t,requestId:n,errorCode:s?.code||s?.name||"MANUAL_SELL_FAILED",details:W(s.message||"Sell failed")}),fe(s.message)}}function _b(){const e=_e("trade-plan"),t=p("[data-trade-plan-group]")?.value?.trim()||"",n=p("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),o=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),s=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),i=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:i}=Xa(c,i));const u=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,a.volumeToken=n,a.bundleToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:c,takeProfitPct:o,stopLossPct:s,sellPercent:i,loopCount:"1",loopDelay:"0",slippageBps:u,...ua("trade-plan")}}async function Ub(){try{const e=_b();fe("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});a.tradePlanResult=t.plan,a.tradeResult=null,H(t.trade?.signature,"trade-plan"),a.activeTab="trade",h()}catch(e){fe(e.message)}}function qb(){const e=_e("volume"),t=p("[data-volume-group]")?.value?.trim()||"",n=p("[data-volume-token]")?.value?.trim()||"",r=p("[data-volume-amount]")?.value||"";let o=x("[data-volume-delay]","[data-volume-delay-custom]","5");const s=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),i=x("[data-volume-loop]","[data-volume-loop-custom]","1"),u=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:o,sellPercent:d}=Xa(o,d));const m=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.volumeToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:d,slippageBps:m,...ua("volume")}}function Qu(e){const t=p("[data-volume-status]");v(t,e)}async function Hb(){try{const e=qb();Qu("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});a.volumeResult=t.plan,H(Ce(t.plan),"volume-plan"),a.activeTab="volume",h()}catch(e){Qu(e.message)}}function Kb(e){const t=_e("sniper"),n=p("[data-sniper-group]")?.value?.trim()||"",r=p("[data-sniper-amount]")?.value||"",o=x("[data-sniper-delay]","[data-sniper-delay-custom]",a.scanMode==="pumpsnipe"?"3":"5"),s=x("[data-sniper-tp]","[data-sniper-tp-custom]",a.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),i=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",a.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{mode:a.scanMode,tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,slippageBps:d,loopCount:i,loopDelay:u,...ua("sniper")}}function Zu(e){const t=p("[data-sniper-status]");v(t,e)}async function Vb(e){try{const t=Kb(e);Zu("Buying and arming exits...");const n=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});a.sniperResult=n.plan,H(Ce(n.plan),"sniper-entry"),a.activeTab="sniper",h()}catch(t){Zu(t.message)}}function zb(){const e=_e("ogre-ai"),t=p("[data-ogre-ai-group]")?.value?.trim()||"",n=p("[data-ogre-ai-amount]")?.value?.trim()||"",r=qr(),o=p("[data-ogre-ai-runs]")?.value||"1",s=p("[data-ogre-ai-tp]")?.value||"25",c=p("[data-ogre-ai-tp-custom]")?.value?.trim()||"",i=p("[data-ogre-ai-sl]")?.value||"8",u=p("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=p("[data-ogre-ai-delay]")?.value||"5",m=p("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=p("[data-ogre-ai-slippage]")?.value||"400",y=p("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";ym({amountSol:n,runCount:o,category:r,takeProfitSelect:s,takeProfitCustom:c,stopLossSelect:i,stopLossCustom:u,delaySelect:d,delayCustom:m,slippageSelect:f,slippageCustom:y,walletGroup:t});const b=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),S=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),P=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),T=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),g="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!n)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:n,runCount:o,sellDelay:b,takeProfitPct:S,stopLossPct:P,sellPercent:"100",slippageBps:T,minScore:g,recentMints:Ci()}}function io(e){a.ogreAiStatus=e||"";const t=p("[data-ogre-ai-status]");v(t,a.ogreAiStatus)}async function jb(){if(kr){io("Ogre A.I. is already scanning. Please wait for completion.");return}const e=Symbol("ogre-ai-run");try{const t=zb();a.ogreAiLoading=!0,kr=e,io("Scanning fresh low-MC pairs and arming managed exits..."),h();const n=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify(t),timeoutMs:Z});a.ogreAiResult=n.ogreAi,bm(n.ogreAi),a.tradePlanResult=n.ogreAi?.plans?.[0]||a.tradePlanResult,io(n.ogreAi?.message||"Ogre A.I. run armed."),H(Ce(n.ogreAi?.plans?.[0]),"ogre-ai-run"),a.activeTab="ogreAi",h()}catch(t){io(t.message),$(t.message)}finally{a.ogreAiLoading=!1,kr===e&&(kr=null),h()}}function jn(e){const t=p("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function Gb({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");a.ogreAutopilot=t.autopilot||null,a.activeTab==="ogreAi"&&h()}catch(t){e||jn(t.message)}}function Xb(){return{enabled:!!p("[data-autopilot-enabled]")?.checked,category:qr(),amountSol:p("[data-ogre-ai-amount]")?.value?.trim()||(a.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:_e("ogre-ai"),walletGroup:p("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:p("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:p("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:p("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:p("[data-autopilot-interval]")?.value?.trim()||"10"}}async function Jb(){if(a.ogreAutopilotBusy)return;const e=Xb();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){jn("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Ae({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${bu(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){a.ogreAutopilotBusy=!0,jn(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});a.ogreAutopilot=t.autopilot||null,jn(a.ogreAutopilot?.lastStatus||"Saved.")}catch(t){jn(t.message),$(t.message)}finally{a.ogreAutopilotBusy=!1,h()}}}function Nt(e){const t=p("[data-kol-status]");v(t,e)}function Yb(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ua("kol")}}function Qb(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),m=String(e||a.kolWallet||p("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!m)throw new Error("Paste or choose a KOL wallet first.");if(!Et(m))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:m,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ua("kol")}}async function Zb(e){try{const t=Yb(e);Nt("Buying and arming KOL copy plan...");const n=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,H(Ce(n.plan),"kol-copy-plan"),a.activeTab="kol",h()}catch(t){Nt(t.message)}}async function ey(e){try{const t=Qb(e);Nt("Arming Copy Wallet watch...");const n=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,a.kolWallet=t.copyWallet,a.activeTab="kol",h()}catch(t){Nt(t.message)}}function _e(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function co(e){const t=p("[data-bundle-status]");v(t,e)}function ed(){const e=p("[data-bundle-token]")?.value?.trim()||"",t=_e("bundle"),n=p("[data-bundle-group]")?.value?.trim()||"",r=p("[data-bundle-amount]")?.value||"",o=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),s=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,percent:o,slippageBps:s}}function ty(){const e=ed();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),n=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:n}=Xa(t,n),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:n,...ua("bundle-plan")}}async function td(e){const t=C();let n=null,r="";const o=e==="buy"?"bundle-buy":"bundle-sell";try{n=ed();const s=et(o,n.tokenMint,"bundle");if(s){te("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-t,cacheHit:!0,requestId:s.tradeAttemptId||"",details:`${o}:${w(n.tokenMint)}`});return}r=mt(o),K(o,n.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-t,requestId:r,details:`${o}:${w(n.tokenMint)}`}),h(),co(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Be(20);const c=C();K(o,n.tokenMint,"bundle",{state:"submitting"});const i=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...n,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-c,requestId:r,resultCount:i.bundle?.successCount||0,details:o}),a.bundleResult=i.bundle,K(o,n.tokenMint,"bundle",{state:"submitted",signature:Ce(i.bundle)}),H(Ce(i.bundle),`bundle-${e}`,{tradeAttemptId:r}),a.activeTab="bundle",h(),Pe(o,n.tokenMint,"bundle",3e3)}catch(s){n?.tokenMint&&(K(o,n.tokenMint,"bundle",{state:"error",error:W(s.message||"Bundle trade failed")}),Pe(o,n.tokenMint,"bundle",4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-t,requestId:r,errorCode:s?.code||s?.name||"BUNDLE_TRADE_FAILED",details:W(s.message||"Bundle trade failed")}),co(s.message)}}async function ay(){try{const e=ty();co("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});a.bundleResult=t.plan,H(Ce(t.plan),"bundle-plan"),a.activeTab="bundle",h()}catch(e){co(e.message)}}function ne(e,t){return(a.presets?.[e]||[]).find(n=>n.id===t)||null}function ad(){(a.selectedTradePresetId==="custom"||a.selectedTradePresetId&&!ne("trade",a.selectedTradePresetId))&&(a.selectedTradePresetId=""),(a.selectedBundlePresetId==="custom"||a.selectedBundlePresetId&&!ne("bundle",a.selectedBundlePresetId))&&(a.selectedBundlePresetId=""),a.editingTradePresetId&&!ne("trade",a.editingTradePresetId)&&(a.editingTradePresetId=""),a.editingBundlePresetId&&!ne("bundle",a.editingBundlePresetId)&&(a.editingBundlePresetId="")}function nd(e,t="trade",n=""){t==="bundle"?a.bundleToken=e:a.tradeToken=e,a.activeTab=t,n&&$(n),window.history.pushState({},"","/terminal"),h({force:!0})}async function rd(e=""){const t=String(e||"").trim();if(!t)return;const n=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(n),o=(s,c={})=>yt(he(s,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){o(n);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}o(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(s){$(s.message||"Token search failed.")}}function he(e="",t={}){const n=String(e||"").trim(),r=n?Gn().find(o=>String(o?.tokenMint||"")===n):null;return{chain:"solana",tokenMint:n,tokenAddress:n,mint:n,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(n),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||n.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function ES(e={},t={}){return he(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function uo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(a.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},So(a.smartChartTokenRef),a.terminalToken=t,a.terminalAutoToken=t,a.tradeToken=t,a.bundleToken=t,a.volumeToken=t,a.smartChartToken=t,t):""}function ny(e,t={}){const n=new URLSearchParams;n.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return n.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&n.set("view",t.view),t.focusAmountInput&&n.set("focusAmount","1"),t.source&&n.set("source",String(t.source).slice(0,40)),t.returnTo&&n.set("returnTo",t.returnTo),`/terminal/chart?${n.toString()}`}function $l(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),n=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||n.includes("pump")),o=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!o)}function ry(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const po=new Map;function Tl(e){const t=String(e||"").trim();if(!t)return;const n=po.get(t)||0;Date.now()-n<3e4||(po.set(t,Date.now()),po.size>200&&po.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function yt(e={},t={}){aa("chartRouteStart");const n=C(),r=uo(e);if(!r){$("Select a token before opening the chart.");return}Rl(e,{source:t.source||"token-entry"}),Tl(r),a.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),a.smartChartView=ry(a.smartChartTokenRef||e,t),a.chartFocusAmountInput=!!t.focusAmountInput,a.chartScrollIntoView=!0,a.activeTab="smartChart",a.route="terminal",a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.chartTradeStatus="",a.chartBuyWalletIndex="";const o=ny(r,{defaultTab:t.defaultTab||"buy",view:a.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Wa()});window.history.pushState({},"",o),h({force:!0}),q("chart-route-open",n,{component:"smartChart",cacheHit:!!(Xe(r)?.cacheHit||Yn(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function Pl(){if(!window.location.pathname.includes("/terminal/chart"))return;aa("chartRouteStart");const e=C(),t=new URLSearchParams(window.location.search||""),n=String(t.get("token")||t.get("mint")||"").trim(),r=String(a.smartChartToken||"").trim();if(n){const o=he(n,{source:t.get("source")||"route"});uo(o),Rl(o,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{Ja(o,{forceModal:!0,source:"deep-link"})}catch{}},900),n!==r&&(a.chartTradeStatus="",a.chartBuyWalletIndex="")}a.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",a.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",a.chartFocusAmountInput=t.get("focusAmount")==="1",a.chartScrollIntoView=!0,a.route="terminal",a.activeTab="smartChart",q("chart-route-apply",e,{component:"smartChart",cacheHit:!!(Xe(n)?.cacheHit||Yn(n)?.pairAddress),details:n})}function Ja(e={},t={}){const n=uo(e);if(!n){$("Select a token before quick buying.");return}const r=Ya(n);if(r&&vo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const o=t.preset||ot(),s=o&&!t.forceModal?Ue(o):"",c=o?.walletIndex||(o?.walletIndexes||[])[0]||(a.wallets[0]?.index?String(a.wallets[0].index):"");if(o&&s&&c&&!t.forceModal){ho(n,{...o,walletIndex:c,walletIndexes:[c]});return}const i=le();a.quickBuyModal={open:!0,tokenMint:n,amountSol:s||a.quickBuyAmountOverride||"",walletIndex:i?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):"",slippageBps:"400",status:s?`Preset ${s} SOL loaded. Confirm when ready.`:o?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},Tl(n),h({force:!0}),requestAnimationFrame(()=>p("[data-quick-buy-modal-amount]")?.focus())}function Al(){a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function oy(e={},t={}){if(!N("protectedBuyEnabled",!0))return;const n=uo(e);if(!n){$("Select a token before opening Protected Buy.");return}const r=Ya(n);if(r&&vo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const o=ba(n)||{tokenMint:n},s=Je(o),c=t.presetId||s.protectedBuyPreset||Fl(s.verdict),i=Number(G(t.amountSol||a.quickBuyAmountOverride||Ue()||"0.1")),u=c==="conservative"&&Number.isFinite(i)&&i>.25?"0.25":er(i||.1),d=le();Tl(n),a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.protectedBuyModal={open:!0,tokenMint:n,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:s.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>p("[data-protected-buy-amount]")?.focus())}function mo(){a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function sy(){const e=a.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),n=String(p("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(p("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),o=G(p("[data-protected-buy-amount]")?.value||e.amountSol||""),s=String(p("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(p("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!o)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:n,walletIndex:r,amountSol:o,slippageBps:s,riskAccepted:c}}function ly(){const e=a.protectedBuyModal||{};if(!e.open)return"";const t=ba(e.tokenMint)||{tokenMint:e.tokenMint},n=Je(t),r=Po(e.presetId),o=ie(e.walletIndex),s=n.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${l(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${l(Qa(n.verdict))}">${l(n.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${za(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${El.map(i=>`<option value="${i.id}" ${i.id===r.id?"selected":""}>${l(i.label)}</option>`).join("")}
          </select>
        </label>
        <label>
          Slippage
          <select data-protected-buy-slippage>
            <option value="300" ${String(e.slippageBps||"400")==="300"?"selected":""}>3%</option>
            <option value="400" ${String(e.slippageBps||"400")==="400"?"selected":""}>4%</option>
            <option value="500" ${String(e.slippageBps||"400")==="500"?"selected":""}>5%</option>
          </select>
        </label>
      </div>
      <article class="protected-buy-preview">
        <strong>${l(r.label)} plan</strong>
        <span>${l(r.description)}</span>
        <small>${l(sv(r))}</small>
        <small>Wallet: ${l(iv(e.walletIndex))}</small>
        <small>Priority fee: existing trade default.</small>
        ${o?'<small class="warning-text">Connected wallets still use normal wallet confirmation. Use a funded session wallet when you want server TP/SL armed like a managed wallet.</small>':""}
      </article>
      ${n.verdict==="AVOID"?`
        <label class="checkbox-line protected-buy-risk-line">
          <input data-protected-buy-risk-accept type="checkbox" ${e.riskAccepted?"checked":""}>
          I understand SlimeShield says AVOID and still want to configure this buy.
        </label>
      `:""}
      <div class="quick-buy-actions">
        <button type="button" data-protected-buy-close>Cancel</button>
        <button type="button" class="primary" data-protected-buy-confirm ${c||s?"disabled":""}>${c?"Submitting...":o?"Open Wallet Confirmation":"Submit Protected Buy"}</button>
      </div>
      ${e.status?`<small class="connect-status">${l(e.status)}</small>`:""}
      ${e.error?`<small class="warning-text">${l(e.error)}</small>`:""}
      <small class="protected-buy-safe-copy">Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</small>
    </section>
  `}function Cl(){let e=p("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!a.protectedBuyModal?.open||!N("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=ly(),document.body.classList.add("protected-buy-modal-open")}async function iy(){try{const e=sy(),t=ba(e.tokenMint)||{tokenMint:e.tokenMint};if(Je(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Po(e.presetId);if(a.protectedBuyModal={...a.protectedBuyModal,...e,status:ie(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},Cl(),ie(e.walletIndex)){const o=await fo({...e,source:`protected-buy:${r.id}`});a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),$(o?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Be(20),a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await ho(e.tokenMint,lv(e,r))}catch(e){a.protectedBuyModal={...a.protectedBuyModal||{},open:!0,status:"",error:W(e.message||"Protected Buy failed.")},h({force:!0})}}function cy(){const e=String(a.quickBuyModal?.tokenMint||"").trim(),t=String(p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"").trim(),n=G(p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||""),r=String(p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!n)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r}}function od(){const e=ot();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function fo({tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r="400",source:o="quick-buy",takeProfitPct:s="",stopLossPct:c="",sellDelay:i="off",sellPercent:u="100"}){const d=Number(n);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const m=mt("quick-buy"),f=Xa(i,u),y=De(s)||De(c)||De(f.sellDelay);let b={tokenMint:e,walletIndex:t,slippageBps:r};const S=a.quickBuyModal?.open?A=>Sl(A,""):fe;if(b=so(b,{side:"buy",statusWriter:S}).form,t=b.walletIndex,a.quickBuyLast={source:o,tokenMint:e,walletConnected:ie(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:m,status:"submitting",error:""},K("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:m,clickedAt:new Date().toISOString()}),a.quickBuyModal={...a.quickBuyModal,status:ie(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:m},ie(t)){Sl("Opening wallet approval...",""),se();const A=await zn({side:"buy",form:b,actionDetail:String(n),amountSol:String(d),amountMode:"fixed",attemptId:m,statusWriter:S});if(a.quickBuyLast={...a.quickBuyLast,status:"submitted"},y){const L="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";a.quickBuyModal?.open?Sl(L,""):fe(L)}return A}h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await Be(20);const T={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:m};y&&Object.assign(T,{autoExit:!0,takeProfitPct:s,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(T),dedupe:!1,timeoutMs:Z});return a.tradeResult=g.trade,g.trade?.autoExitPlan&&(a.tradePlanResult=g.trade.autoExitPlan,no()),H(g.trade?.signature,"quick-buy-custom",{tradeAttemptId:m}),K("trade-buy",e,String(n),{state:"submitted",signature:g.trade?.signature||""}),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},g.trade}async function uy(e=""){const t=C(),n=G(p("[data-chart-buy-amount]")?.value||""),r=Number(n);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let o=p("[data-chart-buy-wallet]")?.value||"";if(!o)throw new Error("Choose a wallet before buying.");const s=mt("chart-buy");let c={tokenMint:e,walletIndex:o,slippageBps:p("[data-chart-buy-slippage]")?.value||"400"};if(c=so(c,{side:"chart buy",statusWriter:Ee}).form,o=c.walletIndex,et("trade-buy",e,String(n)))return a.tradeResult;if(a.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:ie(o),customAmountValid:!0,presetAmount:"",tradeAttemptId:s,status:"submitting",error:""},K("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),Ee(ie(o)?"Opening wallet approval...":"Submitting Session Wallet buy..."),E({component:"post-trade",action:ie(o)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:C()-t,requestId:s,details:`${ie(o)?"browser":"session"}-buy:${w(e)}:${n}`}),se(),ie(o)){const y=await zn({side:"buy",form:c,actionDetail:String(n),amountSol:String(r),amountMode:"fixed",attemptId:s,statusWriter:Ee});return a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",Ee(y?.message||"Buy submitted from connected wallet."),Pe("trade-buy",e,String(n),3e3),y}const d=Yu(),m={tokenMint:e,walletIndex:o,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:s};d.enabled&&Object.assign(m,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),Ee(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(m),dedupe:!1,timeoutMs:Z});return a.tradeResult=f.trade,f.trade?.autoExitPlan&&(a.tradePlanResult=f.trade.autoExitPlan,no()),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",K("trade-buy",e,String(n),{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"chart-session-buy",{tradeAttemptId:s}),Ee(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Pe("trade-buy",e,String(n),3e3),f.trade}async function dy(){try{const e=cy(),t=al(a.quickBuyModal?.error||a.quickBuyModal?.status||"");if(t)throw new Error(t);a.quickBuyModal={...a.quickBuyModal,...e,status:"Validating quick buy...",error:""};const n=await fo({...od(),...e,source:a.quickBuyModal?.source||"quick-buy-modal"});a.quickBuyModal={...a.quickBuyModal,open:!1,status:n?.message||"Quick buy submitted.",error:""},a.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Pe("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=W(e.message||"Quick buy failed."),n=al(t);a.quickBuyLast={...a.quickBuyLast||{},status:"failed",error:n||t},a.quickBuyModal={...a.quickBuyModal,status:n?"Token safety blocked fast buy.":"",error:n||t},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"})}}async function ho(e,t=null){const n=C(),r=t||ne("trade",a.selectedTradePresetId);let o="quick";if(!r){Ja(he(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const s=t?G(r.amountSol):Ue(r);if(!s)throw new Error("Set a quick buy amount first.");o=String(s);const c=et("trade-buy",e,o);if(c){E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${s}`});return}const i=mt("quick-trade");K("trade-buy",e,o,{state:"clicked",tradeAttemptId:i,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),a.tradeToken=e,h({preserveSmartChartFrame:a.activeTab==="smartChart"}),await Be(0),await X(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!a.wallets.some(y=>String(y.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:s,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),a.tradeToken=e,await Be(20);const m=C();K("trade-buy",e,o,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:i,clientClickToUiMs:Math.round(m-n)}),dedupe:!1,timeoutMs:Z});a.tradeResult=f.trade,f.trade?.autoExitPlan?(a.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),no()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),a.tradeToken=e,K("trade-buy",e,o,{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:i}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Pe("trade-buy",e,o,3e3)}catch(s){e&&(K("trade-buy",e,o,{state:"error",error:W(s.message||"Quick buy failed")}),Pe("trade-buy",e,o,4e3)),$(s.message)}}async function sd(e,t=null){const n=t||ne("bundle",a.selectedBundlePresetId);if(!n){nd(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(n.walletIndexes||[]).length||(n.walletGroup?"group":"saved");if(!await Ae({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${n.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){nd(e,"bundle","Review the Bundle setup, then submit.");return}}try{a.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Be(0),await X(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(n.walletIndexes||[]).filter(s=>a.wallets.some(c=>String(c.index)===String(s))),walletGroup:n.walletGroup||"",amountSol:t?G(n.amountSol)||"0.1":ov(n),percent:"100",slippageBps:n.slippageBps,sellDelay:n.sellDelay||"off",takeProfitPct:n.takeProfitPct,stopLossPct:n.stopLossPct,sellPercent:n.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const o=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});a.bundleResult=o.plan,a.bundleToken=e,H(Ce(o.plan),"quick-preset-bundle"),a.activeTab="bundle",h()}catch(r){$(r.message)}}async function go(e,t="100",n={}){const r=C();let o=Number.parseInt(t,10),s="";try{if(await X(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=Bs(e,String(o));if(c){E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${o}`});return}const i=at().find(S=>String(S.tokenMint)===String(e)),u=i?.symbol||i?.name||w(e),d=!!(i?.source==="connected-wallet"||i?.viewOnly||String(i?.walletIndex||"").toLowerCase()==="connected"),m=String(le()?.publicKey||"").trim();if(d&&m){s=mt("manual-sell"),na(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`browser:${w(e)}:${o}`}),$(""),a.activeTab!=="smartChart"&&(a.activeTab="positions");const S=a.activeTab==="smartChart"?Ee:T=>$(T);S("Building wallet-approved sell..."),se(),na(e,String(o),{state:"submitting"});const P=await zn({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:n.slippageBps||"400"},actionDetail:`${o}%`,percent:String(o),attemptId:s,statusWriter:S});a.tradeResult=P,na(e,String(o),{state:"submitted",signature:P?.signature||""}),H(P?.signature,"browser-manual-sell",{tradeAttemptId:s}),a.activeTab==="smartChart"?(Ee(P?.message||"Sell submitted from connected wallet."),se()):h({preserveSmartChartFrame:!1}),Rs(e,String(o),3e3);return}if(!(!!n.skipConfirm||await Ae({title:"Confirm Exit",lines:[`Exit ${o}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${o}%`,danger:!0})))return;s=mt("manual-sell"),na(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`${w(e)}:${o}`}),a.activeTab="positions",$(""),h(),await Be(20);const y=C();na(e,String(o),{state:"submitting"});const b=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:o,slippageBps:"400",manualSellAttemptId:s,clientClickToUiMs:Math.round(y-r)}),timeoutMs:Z,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-y,requestId:s,resultCount:b.bundle?.successCount||0,details:b.bundle?.duplicate?"duplicate":"submitted"}),a.bundleResult=b.bundle,a.bundleToken=e,a.tradeToken=e,na(e,String(o),{state:(b.bundle?.duplicate,"submitted"),signature:Ce(b.bundle),backendMs:b.bundle?.manualSellTiming?.backendMs||null}),H(Ce(b.bundle),"manual-sell-position"),a.activeTab="positions",h(),Rs(e,String(o),3e3)}catch(c){e&&Number.isInteger(o)&&(na(e,String(o),{state:"error",error:W(c.message||"Sell failed")}),Rs(e,String(o),4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-r,requestId:s,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:W(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}}function Ce(e){return e?.signature?e.signature:(e?.results||[]).find(n=>n.signature)?.signature||""}async function py(){const e=p("[data-tx-audit-signature]")?.value?.trim()||a.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}a.terminalTxSignature=e,a.terminalTxLoading=!0,a.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);a.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){a.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{a.terminalTxLoading=!1,h()}}function my(e,t="manager"){const n=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Trade Preset",walletIndex:p(`[data-${n}-preset-wallet]`)?.value||"1",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"25",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}:{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Bundle Preset",walletIndexes:_e(`${n}-preset`),walletGroup:p(`[data-${n}-preset-group]`)?.value?.trim()||"",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"60",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}}function fy(e,t){const n=(t||[]).find(r=>!r.readonly);n?.id&&(e==="trade"&&(a.selectedTradePresetId=n.id),e==="bundle"&&(a.selectedBundlePresetId=n.id))}function bo(e,t){const n=!!(t&&ne(e,t));e==="trade"&&(a.selectedTradePresetId=n?t:""),e==="bundle"&&(a.selectedBundlePresetId=n?t:"")}function Ll(e,t){e==="trade"&&(a.fastTradePresetStatus=t),e==="bundle"&&(a.fastBundlePresetStatus=t)}function hy(e,t){bo(e,t),Ll(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function ld(e,t="manager"){const n=p(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await X(n,"Creating secure web profile for presets..."),v(n,"Saving preset...");const r=my(e,t),o=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});a.presets=o.presets||a.presets,r.id&&ne(e,r.id)?bo(e,r.id):fy(e,a.presets?.[e]),t==="manager"&&Kr(e,""),t==="fast"&&Ll(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),v(n,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&Ll(e,r.message),v(n,r.message),$(r.message)}}async function gy(e,t){try{const n=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});a.presets=n.presets||a.presets,e==="trade"&&a.selectedTradePresetId===t&&bo("trade",""),e==="bundle"&&a.selectedBundlePresetId===t&&bo("bundle",""),(e==="trade"&&a.editingTradePresetId===t||e==="bundle"&&a.editingBundlePresetId===t)&&Kr(e,""),h()}catch(n){$(n.message)}}function id(e,t){Kr(e,t),a.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const n=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);n?.scrollIntoView({behavior:"smooth",block:"start"}),n?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function cd(e={}){const t=p("[data-referral-status]");try{await X(t,"Opening secure web profile..."),v(t,e.generate?"Generating referral code...":"Saving referral settings...");const n=String(p("[data-referral-code]")?.value||"").trim(),r=Oh(p("[data-referral-link]")?.value||""),o=String(a.user?.referralCode||"").trim(),s=e.generate?n:r&&r!==o&&(!n||n===o)?r:n||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:s,generateReferralCode:!!e.generate,referralPayoutWallet:p("[data-referral-wallet]")?.value||""})});de(c.user);const i=c.user?.referralCode||a.user?.referralCode||"";v(t,e.generate?`Generated ${i}. Link is ready.`:`Referral settings saved. Code: ${i}`),h()}catch(n){v(t,n.message),$(n.message)}}async function by(){const e=p("[data-trader-board-status]");try{await X(e,"Opening secure web profile..."),v(e,"Saving trader board settings...");const t=p("[data-trader-board-wallet-mode]")?.value||"all",n=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!p("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:_e("trader-board")})});de(n.user),v(e,n.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){v(e,t.message),$(t.message)}}async function ud(e,t){const n=t.dataset.watchToken||t.dataset.unwatchToken||"";if(n)try{await X(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:n,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});a.watchlist=r.watchlist||a.watchlist,h()}catch(r){$(r.message)}}function xl(e){const t=p("[data-launch-status]");v(t,e)}function yy(){const e=p("[data-launch-ticker]")?.value?.trim()||wt(Le().keywords)[0]||"",t=_e("launch"),n=p("[data-launch-group]")?.value?.trim()||"",r=p("[data-launch-amount]")?.value||"",o=x("[data-launch-tp]","[data-launch-tp-custom]","40"),s=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),i=x("[data-launch-loop]","[data-launch-loop-custom]","1"),u=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return Le().keywords=e,Le().open=!0,{ticker:e,walletIndexes:t,walletGroup:n,amountSol:r,takeProfitPct:o,stopLossPct:s,sellDelay:c,loopCount:i,loopDelay:u,slippageBps:d,...ua("launch")}}async function vy(){try{const e=yy();xl("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});a.launchResult=t.watch,await oa(),a.activeTab="launch",h()}catch(e){xl(e.message)}}async function wy(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});a.launchResult=t.watch,await oa(),a.activeTab="launch",h()}catch(t){xl(t.message)}}function Sy(){return`
    <section class="account-check-card wallet-sweep-card wallet-command-card">
      <div>
        <h3>Sweep / Exit / Recover</h3>
        <p>Sell or transfer from saved managed wallets, then send SOL or tokens to any wallet address you paste.</p>
      </div>
      <label>Wallet numbers
        <input data-wallet-sweep-indexes value="all" placeholder="all or 1,2,3">
      </label>
      <label>Group label
        <input data-wallet-sweep-group placeholder="Optional group name">
      </label>
      <label>Destination wallet
        <input data-wallet-sweep-destination placeholder="Wallet to receive SOL or tokens">
      </label>
      <label>Token mint
        <input data-wallet-sweep-token placeholder="Optional: leave blank for all tokens">
      </label>
      <label>Sell slippage bps
        <input data-wallet-sweep-slippage type="number" min="50" max="5000" step="50" value="1500">
      </label>
      <div class="card-actions compact">
        <button class="primary" data-wallet-sweep-action="sell-all-sweep">Sell All + Send SOL</button>
        <button data-wallet-sweep-action="sell-all">Sell All Tokens</button>
        <button data-wallet-sweep-action="sweep-sol">Sweep SOL</button>
        <button data-wallet-sweep-action="sweep-tokens">Send Tokens</button>
      </div>
      <small>Use Sell All + Send SOL to exit tokens across selected wallets and drain SOL to one destination. Token transfer keeps tokens as tokens. Browser-only wallets still require wallet approval and are not swept by this managed-wallet tool.</small>
      <small data-wallet-sweep-status>${l(a.walletSweepStatus||"")}</small>
    </section>
    <section class="account-check-card wallet-sweep-card wallet-command-card">
      <div>
        <h3>Fund / Split SOL</h3>
        <p>Fund many wallets from one managed source wallet. Paste any destination wallets, one per line.</p>
      </div>
      <label>Source wallet #
        <input data-wallet-send-from type="number" min="1" step="1" value="1">
      </label>
      <label>Amount per wallet
        <input data-wallet-send-amount inputmode="decimal" placeholder="0.05">
      </label>
      <label>Managed destination wallet numbers
        <input data-wallet-send-managed-targets placeholder="all or 2,3,4">
      </label>
      <label>Managed destination group
        <input data-wallet-send-group placeholder="Optional group name">
      </label>
      <label class="inline-check">
        <input data-wallet-send-all type="checkbox">
        Split available SOL evenly
      </label>
      <label>Destination wallets
        <textarea data-wallet-send-destinations rows="4" placeholder="One wallet per line"></textarea>
      </label>
      <div class="card-actions compact">
        <button class="primary" data-wallet-sweep-action="send-sol-many">Fund Wallets</button>
      </div>
      <small>Use managed destination numbers/groups to fund saved wallets, or paste outside wallets. Split mode keeps the configured safety reserve and estimated network fees in the source wallet.</small>
    </section>
  `}function ky(){const e=fu();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${l(a.sweepBackgroundStatus||"")}</small>
    </section>`}async function $y(){if(!a.sweepBackgroundPending){a.sweepBackgroundPending=!0,a.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:Z});a.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await ht({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){a.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{a.sweepBackgroundPending=!1,h({force:!0})}}}function Ty(){const e=Cy(),n=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${dd()}
    <section class="account-check-card">
      <div>
        <h3>Wallet Actions</h3>
        <p>Refresh balances, view token positions, or remove saved wallet records after backup.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Balances</button>
      <button data-tab="positions">View Positions</button>
      <button data-tab="kol">Open KOL Tracker</button>
      <button data-tab="txAudit">Tx Audit</button>
      <small data-wallet-remove-status>${l(a.walletRemoveStatus||"")}</small>
    </section>
    <div class="table-list">
      ${cl().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${Va(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${l(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${l(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${Ly(r)}
            ${r.sessionWallet?`<small>Session source: ${l(w(r.sourceConnectedWallet||""))}${r.fundingAmountSol?` | Budget ${l(r.fundingAmountSol)} SOL`:""}</small>`:""}
            </div>
          </div>
          <div class="card-actions compact">
            <button data-copy="${r.publicKey}">Copy</button>
            <button class="danger-lite" data-remove-wallet="${r.index}" data-remove-wallet-key="${l(r.publicKey)}" data-wallet-label="${l(`${r.index}. ${r.label}`)}">Remove</button>
          </div>
        </article>
      `).join("")}
    </div>
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${bg()}${ky()}${gg()}${Sy()}`},{key:"create",label:"Create",hint:"New wallets",html:Ka()},{key:"import",label:"Import",hint:"Add keys",html:ru()},{key:"backup",label:"Backup",hint:"Save / restore",html:nu()},{key:"downloads",label:"Downloads",hint:"Exports",html:ou()}];if(!a.wallets.length){const r=n.filter(o=>o.key!=="balances"&&o.key!=="fund");return`
      ${e}
      ${R("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${ja({toolKey:"wallets",activeKey:Ga("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${ja({toolKey:"wallets",activeKey:Ga("wallets","balances"),sections:n})}
  `}function Py(){return(Array.isArray(a.wallets)?a.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function Ay(){if(!(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey)return"";const t=Py();return t?`
      <div class="session-wallet-cta is-ready">
        <span class="session-wallet-cta-badge ready">✓ Automation ready</span>
        <p>Session wallet funded${t.fundingAmountSol?` · <strong>${l(t.fundingAmountSol)} SOL</strong>`:""}. TP/SL, auto-sell, Ogre A.I. and bundles now run unattended from it — your connected wallet keeps your main funds.</p>
        <div class="session-wallet-controls">
          <label>Top up SOL<input data-session-wallet-amount type="number" min="0.005" max="10" step="0.005" inputmode="decimal" value="0.10"></label>
          <button type="button" data-create-session-wallet>Add Funds</button>
        </div>
      </div>`:`
    <div class="session-wallet-cta">
      <span class="session-wallet-cta-badge">⚡ Unlock automation</span>
      <p>Connected wallets trade manually only. Fund a <strong>Session Wallet</strong> with one approval to unlock <strong>TP/SL, auto-sell, Ogre A.I. and bundles</strong>. Your main funds stay in your wallet — only the SOL you approve can be auto-traded.</p>
      <div class="session-wallet-controls">
        <label>Session SOL<input data-session-wallet-amount type="number" min="0.005" max="10" step="0.005" inputmode="decimal" value="0.10"></label>
        <button class="primary" type="button" data-create-session-wallet>Fund Session Wallet</button>
      </div>
    </div>`}function Cy(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.connectedWalletBalance||{},n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",s=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${l(c.dexUrl||J(c.mint))}" target="_blank" rel="noreferrer">
      ${ct({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
      <span>${l(c.symbol||c.shortMint||w(c.mint))}: ${l(c.uiAmount??"held")}</span>
    </a>
  `).join("");return`
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${l(e.provider||t.provider||"Solana Wallet")} ${l(w(e.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${l(n)}</strong></span>
          <span><small>Tokens</small><strong>${l(r)}</strong></span>
          <span><small>Status</small><strong>${t.error?"Needs refresh":"Synced"}</strong></span>
        </div>
        ${t.error?`<small>Check failed: ${l(t.error)}</small>`:""}
        ${s?`<div class="connected-token-list">${s}</div>`:""}
        ${Ay()}
        <small>${a.walletFastApprovalsEnabled?"Fast approvals are on for connected-wallet prompts.":"Fast approvals are off."}</small>
      </div>
      <div class="card-actions">
        <button data-refresh-all>Refresh</button>
        <button data-copy="${l(e.publicKey)}">Copy</button>
        <button type="button" data-wallet-fast-approvals-toggle>${a.walletFastApprovalsEnabled?"Fast Approvals On":"Fast Approvals Off"}</button>
        <button type="button" data-connect-wallet="solana">Reconnect</button>
        <button type="button" data-disconnect-wallet>Disconnect</button>
        <button data-tab="txAudit">Tx Audit</button>
        <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
      </div>
    </section>
  `}function dd(){const e=a.balances.reduce((n,r)=>n+Number(r.tokens?.length||0),0)+Cc().length,t=a.balances.filter(n=>n.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${Ks()}</strong></div>
      <div><span>Total SOL</span><strong>${It().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function Ly(e){const t=a.balances.find(s=>Number(s.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${l(t.error)}</span>`;const n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${l(n)} | ${l(r)}${l(o)}</span>`}function xy(){const e=at(),t=`
    <section class="account-check-card">
      <div>
        <h3>Open Positions</h3>
        <p>Only current token holdings show here. Use Refresh after buys, sells, or transfers.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Positions</button>
      <button data-scan-bags>🛡 Scan My Bags</button>
      <button data-tab="wallets">Wallet Balances</button>
      <button data-tab="pnl">PnL History</button>
    </section>
    ${My()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(ep).join("")}
    </div>
  `:`${t}${R("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function My(){const e=a.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${l(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const n=t.filter(o=>!o.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
    <section class="trade-card bag-scan">
      <div class="trade-head">
        <div>
          <h3>🛡 Bag scan: ${n?`${n} of ${t.length} need eyes`:`all ${t.length} look healthy`}</h3>
          <p>Shield verdict + live liquidity on every bag, worst first. Scanned just now.</p>
        </div>
      </div>
      <div class="table-list">
        ${t.map(o=>`
          <article class="row-card">
            <div class="row-main">
              <strong>$${l(o.symbol)} <span style="color:${r[o.verdict]||"#9fb59a"};font-weight:800">${l(o.verdict)}${o.score!=null?` ${l(String(o.score))}/100`:""}</span></strong>
              <small>${o.flags.length?l(o.flags.join(" | ")):"no red flags"}${o.liquidityUsd!=null?` | liq ${M(o.liquidityUsd)}`:""}${o.marketCapUsd?` | MC ${M(o.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${l(o.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${l(o.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function By(e){const t=String(e||"").trim();if(!t)return;a.devWatch||(a.devWatch={});const n=!a.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:n}),timeoutMs:15e3});a.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}ya()}async function Ry(e,t=null){const n=String(e||"").trim();if(!n)return;const r=ot();t&&(t.disabled=!0,t.textContent="Arming...");try{const o=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:n,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});Bu(n),a.walletRemoveStatus=o.message||"Exits armed.",t&&(t.textContent="✅ Armed"),Ru().then(()=>h())}catch(o){$(o?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function Iy(){a.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});a.bagScan={status:"done",bags:e.bags||[]}}catch(e){a.bagScan={status:"error",message:e?.message||""}}h()}function Oy(){const e=`
    <section class="account-check-card">
      <div>
        <h3>PnL / Results</h3>
        <p>Refresh after a trade closes, or jump back to open positions and wallet balances.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh PnL</button>
      <button data-tab="positions">Open Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
    </section>
  `;return a.pnl?.totals?.tradeCount?`
    ${e}
    <section class="pnl-summary">
      <div><span>Trades</span><strong>${a.pnl.totals.tradeCount}</strong></div>
      <div><span>Spent</span><strong>${a.pnl.totals.spentSol} SOL</strong></div>
      <div><span>Received</span><strong>${a.pnl.totals.receivedSol} SOL</strong></div>
      <div><span>Realized</span><strong>${a.pnl.totals.realizedSol}</strong></div>
    </section>
    <div class="pnl-portfolio-table">
      <div class="pnl-portfolio-head">
        <span>Token</span>
        <span>Invested</span>
        <span>Sold</span>
        <span>Change</span>
        <span>Avg Hold</span>
        <span>Action</span>
      </div>
      ${a.pnl.tokens.map(t=>`
        <article class="pnl-portfolio-row with-avatar">
          <div class="pnl-token-cell">
            ${ct(t)}
            <div>
              <strong>${l(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${l(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${l(t.tokenMint)}">${l(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${l(t.spentSol||"0")} SOL</span>
          <span>${l(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${l(t.realizedSol||"0")}</span>
          <span>${l(t.holdTime||"n/a")}<small>Latest ${l(ve(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${ze(lu(t),"Share")}
            <button data-pnl-card="${l(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${l(t.tokenMint)}" data-share-text="${l(lu(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${R("No PnL yet","Trades made through the bot will show here.")}`}function Gn(){return Ey(Xn())}function Xn(){const e=Object.values(a.livePairsByBucket||{}).flatMap(o=>o?.rows||[]),t=a.scan?.rows||[],n=a.kolScan?.rows||[],r=a.watchlist?.rows||[];return[...e,...t,...n,...r]}function Ya(e=""){const t=String(e||"");return t&&Xn().find(n=>String(n?.tokenMint||"")===t)||null}function FS(e=""){const t=Ya(e);return!t||!vo(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function Ey(e=[]){const t=new Map;for(const n of e||[]){if(Jn(n))continue;const r=String(n?.tokenMint||"");r&&!t.has(r)&&t.set(r,n)}return[...t.values()]}function ge(e=[]){const t=new Map;for(const n of e||[]){if(Jn(n))continue;const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||yo(n)>yo(o))&&t.set(r,n)}return[...t.values()]}function yo(e={}){return Ky(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(I(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function Fy(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function vo(e={}){if(Fy(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function Jn(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function pd(){const e=Gn(),t=s=>e.find(c=>String(c.tokenMint)===s)||{tokenMint:s,shortMint:w(s),symbol:w(s),dexUrl:J(s)},n=String(a.terminalToken||a.tradeToken||"").trim();if(n)return t(n);const r=String(a.terminalAutoToken||"").trim();if(r)return t(r);const o=(We()?.rows||[])[0]||e[0]||null;return o?.tokenMint&&(a.terminalAutoToken=String(o.tokenMint)),o}function wo(){const e=Gn(),t=a.smartChartTokenRef||null,n=o=>e.find(s=>String(s.tokenMint||"")===o)||{...String(t?.tokenMint||"")===o?t:{},tokenMint:o,shortMint:w(o),symbol:t?.symbol||w(o),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||J(t?.pairAddress||o),pumpUrl:o.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(o)}`:""},r=String(a.smartChartToken||a.terminalToken||a.tradeToken||"").trim();return gd(r?n(r):pd())}function md(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const Wy=300*1e3,fd=45*1e3,hd=600*1e3,Ny=700,Dy=6e3,_y=4,Uy=3e4;function Xe(e=""){const t=String(e||"").trim();if(!t)return null;const n=a.smartChartBootstrap?.[t]||null;if(!n)return null;const r=Date.now()-Number(n.loadedAt||n.resolvedAt||0);return n.status==="failed"?r<fd?n:null:r<hd?n:null}function Yn(e=""){const t=String(e||"").trim(),n=t?a.smartChartDexResolution?.[t]||Xe(t):null;if(!n)return null;const r=Date.now()-Number(n.resolvedAt||0);return n.status==="failed"?r<fd?n:null:r<Wy?n:null}function gd(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=Yn(t);return!n||n.status==="failed"?e:{...e,pairAddress:e.pairAddress||n.pairAddress||"",pairId:e.pairId||n.pairAddress||"",dexUrl:e.dexUrl||n.dexUrl||n.pairUrl||"",dexId:e.dexId||n.dexId||"",dexName:e.dexName||n.dexName||n.dexId||"",symbol:e.symbol||n.symbol||w(t),name:e.name||n.name||"Token",imageUrl:e.imageUrl||n.imageUrl||"",marketCap:e.marketCap||n.marketCap||0,marketCapUsd:e.marketCapUsd||n.marketCap||0,fdv:e.fdv||n.fdv||0,liquidityUsd:e.liquidityUsd||n.liquidityUsd||0,volumeH24:e.volumeH24||n.volumeH24||0,volumeH1:e.volumeH1||n.volumeH1||0,priceUsd:e.priceUsd||n.priceUsd||0,h1:e.h1||n.h1||0,volume:e.volume||n.volume||null,txns:e.txns||n.txns||null}}function Ml(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const n=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:n,resolvedAt:n};a.smartChartBootstrap={...a.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&So({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function So(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.pairAddress||e.pairId||"").trim();!t||!n&&!e.dexUrl&&!e.symbol&&!e.name||(a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{...a.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:n,dexUrl:e.dexUrl||J(n||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||a.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||a.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||a.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||a.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||a.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||a.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||a.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function qy(e={}){const t=String(e?.tokenMint||a.smartChartToken||"").trim();if(!t)return!1;const n=String(e?.pairAddress||e?.pairId||"").trim();if(n)return So({...e,tokenMint:t,pairAddress:n}),!1;if(Xe(t)?.pairAddress)return!1;const r=Yn(t);return r?.pairAddress||r?.status==="failed"?!1:(a.smartChartDexResolving?.[t]||(a.smartChartDexResolving={...a.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{vd(t).catch(()=>{})},0)),!0)}function bd(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||a.smartChartToken||"").trim();return!n||!t.force&&Xe(n)?.status==="resolved"?!1:(a.smartChartBootstrapLoading?.[n]||(a.smartChartBootstrapLoading={...a.smartChartBootstrapLoading||{},[n]:!0},window.setTimeout(()=>{vd(n,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const Bl=new Map;async function yd(e){const t=String(e||"").trim();if(!t)return;const n=Bl.get(t)||0;if(Date.now()-n<3e4)return;Bl.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,m)=>(Number(m?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},o=async()=>{const s=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!s?.pair)throw new Error("no pair");return s.pair};try{const s=await Promise.any([r(),o()]);Ml({tokenMint:t,symbol:s.baseToken?.symbol||"",name:s.baseToken?.name||"",priceUsd:s.priceUsd,marketCap:s.marketCap||s.fdv||null,marketCapUsd:s.marketCap||s.fdv||null,fdv:s.fdv||null,liquidityUsd:Number(s.liquidity?.usd)||null,liquidity:{usd:Number(s.liquidity?.usd)||null},volumeH24:Number(s.volume?.h24)||null,volumeH1:Number(s.volume?.h1)||null,h1:Number(s.priceChange?.h1)||null,imageUrl:s.info?.imageUrl||"",dexUrl:s.url||"",pairAddress:s.pairAddress||"",dexId:s.dexId||"",pumpCurve:!!s.pumpCurve,bondingProgressPct:s.bondingProgressPct??null,source:s.pumpCurve?"pump-curve":"direct-dexscreener"}),a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{Bl.delete(t)}}function Rl(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return n?(So(e),lh(n,e.symbol||e.name||""),yd(n),bd(e,{source:t.source||"prefetch"}),a.smartChartPrefetchLog=[...a.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:n,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(a.smartChartBootstrapLoading?.[n]||Xe(n)),cacheTtlMs:hd}].slice(-20),!0):!1}async function vd(e=""){const t=String(e||"").trim();if(!t)return null;try{const n=C(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),o=r.chart||r.dexToken||{};return Ml(o),q("chart-bootstrap",n,{component:"smartChart",cacheHit:!!o.cacheHit,stale:!!o.stale,details:`${t}:${o.chartProvider||"dexscreener-embed"}`}),a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),o}catch(n){return a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:W(n?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),null}finally{const n={...a.smartChartDexResolving||{}};delete n[t],a.smartChartDexResolving=n;const r={...a.smartChartBootstrapLoading||{}};delete r[t],a.smartChartBootstrapLoading=r}}function Hy(e,t={}){const n=md(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(n)}?${r.toString()}`}function wd(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=Xe(n);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Hy(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function WS(e={}){const t=String(e?.tokenMint||e?.mint||a.smartChartToken||""),n=Cd(t||e?.symbol||"pump"),r=Math.max(1,I(e.marketCap,e.fdv,e.liquidityUsd,1e4)),o=I(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),s=Math.max(4,Math.min(96,Dt(e)||I(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(o)||I(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(i,u)=>{const d=Math.sin((u+n%11)/2.2)*c,m=(u/21-.5)*(o||s/3),f=((n>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+m+f)/100))})}function NS(e={},...t){for(const n of t){const r=Number(e?.[n]);if(Number.isFinite(r)&&r>0)return r;const o=n.split(".").reduce((c,i)=>c?.[i],e),s=Number(o);if(Number.isFinite(s)&&s>0)return s}return 0}function DS(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="txns",o=Math.max(0,Math.min(100,Dt(e)||I(e.bondingProgressPct,e.pumpProgress,0))),s=F(e.marketCapLabel,e.fdvLabel,M(e.marketCap),M(e.fdv)),c=F(e.liquidityLabel,M(e.liquidityUsd)),i=F(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,M(e.volumeM15),M(e.volume5m),M(e.volumeH1));return`
    <div class="smart-chart-frame smart-chart-dex-frame smart-chart-pump-frame${r?" pump-activity-only-frame":""}" data-loaded="true" data-chart-resolving="false">
      <div class="terminal-title-row">
        <div>
          <h4>${r?"Pump Transactions":"Pump Chart"}</h4>
          <p>${r?"Native SlimeWire Pump activity view for this unbonded launch.":"Native SlimeWire launch chart for unbonded Pump tokens."}</p>
        </div>
        <span class="sniper-pill">${o?`${o.toFixed(0)}% bonded`:"pre-bond"}</span>
      </div>
      ${r?"":`
        <div class="pump-native-chart">
          ${vS(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${l(s)}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(c)}</dd></div>
          <div><dt>Volume</dt><dd>${l(i)}</dd></div>
          <div><dt>Status</dt><dd>${$l(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":wS(e)}
      <small>${l(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function Il(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",o=t==="info",s=bd(e)||qy(e),c=o?`DexScreener info for ${e.symbol||w(n)}`:r?`DexScreener chart and transactions for ${e.symbol||w(n)}`:`DexScreener chart for ${e.symbol||w(n)}`,i=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",o?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=s?"Loading DEX chart while resolving fastest pair...":o?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",m=wd(e,t);return`
    <div class="${l(i)}" data-chart-frame-loading="${l(d)}" data-chart-resolving="${s?"true":"false"}" data-chart-mint="${l(n)}" data-chart-mode="${l(t)}" data-chart-src="${l(m)}">
      <iframe title="${l(c)}" src="${l(m)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${l(t)}','${l(n)}')" allowfullscreen></iframe>
    </div>
  `}function Sd(){const e=[...Object.values(a.livePairsByBucket||{}).flatMap(n=>n?.rows||[]),...a.livePairs?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[],...a.watchlist?.rows||[]],t=new Map;for(const n of e){const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||yo(n)>yo(o))&&t.set(r,n)}return t}function Ky(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,n)=>t+(n&&String(n).toLowerCase()!=="n/a"?1:0),0)}function kd(e=[]){const t=Sd();return(e||[]).map(n=>$d(n,t.get(String(n?.tokenMint||""))))}function rt(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const o=Number(r[1]);if(!Number.isFinite(o))return null;const s=String(r[2]||"").toLowerCase();return s==="k"?o*1e3:s==="m"?o*1e6:s==="b"?o*1e9:o}function I(...e){for(const t of e){const n=rt(t);if(Number.isFinite(n)&&n>0)return n}for(const t of e){const n=rt(t);if(Number.isFinite(n))return n}return 0}function $d(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:I(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:I(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:F(e.marketCapLabel,t.marketCapLabel,M(e.marketCap),M(t.marketCap)),fdvLabel:F(e.fdvLabel,t.fdvLabel,M(e.fdv),M(t.fdv)),liquidityUsd:I(e.liquidityUsd,t.liquidityUsd),liquidityLabel:F(e.liquidityLabel,t.liquidityLabel,M(e.liquidityUsd),M(t.liquidityUsd)),volume5m:I(e.volume5m,t.volume5m),volume5mLabel:F(e.volume5mLabel,t.volume5mLabel,M(e.volume5m),M(t.volume5m)),volumeM15:I(e.volumeM15,t.volumeM15),volumeM15Label:F(e.volumeM15Label,t.volumeM15Label,M(e.volumeM15),M(t.volumeM15)),volumeM30:I(e.volumeM30,t.volumeM30),volumeM30Label:F(e.volumeM30Label,t.volumeM30Label,M(e.volumeM30),M(t.volumeM30)),volumeH1:I(e.volumeH1,t.volumeH1),volumeH1Label:F(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,M(e.volumeH1),M(t.volumeH1)),volumeH24:I(e.volumeH24,t.volumeH24),volumeH24Label:F(e.volumeH24Label,t.volumeH24Label,M(e.volumeH24),M(t.volumeH24)),volumeLabel:F(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,M(e.volumeH1),M(t.volumeH1)),sniperCount:I(e.sniperCount,t.sniperCount)}:e}function Qn(e=[],t=[]){return ge([...a.livePairsByBucket.under1d?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.scan?.rows||[],...e,...t]).sort((r,o)=>Number(o.bestPickScore||o.score||0)-Number(r.bestPickScore||r.score||0)||I(o.volumeM15,o.volumeM30,o.volumeH1,o.volume5m,o.volumeH24)-I(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||I(o.marketCap,o.fdv)-I(r.marketCap,r.fdv)||Ye(r,o))}function z(e,t,n,r,o){return{key:e,label:t,severity:n,message:r,weight:o}}function Vy(e={}){const t=rt(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const n=rt(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(n)?n/60:null}function zy(e,t=[]){const n=(t||[]).some(o=>o.key==="hard_flag"),r=(t||[]).filter(o=>o.severity==="risk"&&o.key!=="liquidity_extreme").length;return n||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function jy(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const n=(t||[]).find(r=>r.severity==="risk");return n?.message?`Avoid recommended. ${n.message}`:"Avoid recommended. Multiple danger signals."}const ko=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function pa(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(ko,t)?t:"unknown"}function $o(e="",t="Unknown"){const n=pa(e);return ko[n]||t}function Td(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=n?"new":"unknown";return{mint:t,status:r,label:ko[r],confidence:n?"low":"unknown",summary:n?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:n||null,updatedAt:""}}function Zn(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(a.devInfoSummaries?.[t]||e.devInfoSummary)||Td(e)}function Gy(e={}){const t=pa(e.status);return t==="hold"?z("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?z("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?z("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?z("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?z("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):z("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function Pd(e={},t={}){if(!N("devInfoEnabled",!0))return"";const n=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!n)return"";const r=Zn(e),o=pa(r.status),c=!!a.devInfoLoading?.[`summary:${n}`]?"...":o==="unknown"?"":r.label||ko[o]||"",i=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${l(o)} ${i?"is-compact":""}" data-dev-info="${l(n)}" title="${l(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${l(c)}</strong>`:""}
    </button>
  `}function Xy(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let n=70;const r=[],o=[],s=[],c=rt(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(n-=36,o.push("liquidity"),r.push(z("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(n-=20,o.push("liquidity"),r.push(z("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(n+=8,o.push("liquidity"),r.push(z("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(o.push("liquidity"),r.push(z("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(n-=6,s.push("liquidity"),r.push(z("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const i=Vy(e);Number.isFinite(i)?i<3?(n-=10,o.push("age"),r.push(z("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):i>60?(n+=4,o.push("age"),r.push(z("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):o.push("age"):(n-=4,s.push("age"),r.push(z("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=rt(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(n-=5,o.push("volume"),r.push(z("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(n+=6,o.push("volume"),r.push(z("volume_active","Volume","positive","Volume is active enough to review flow.",6))):o.push("volume"):s.push("volume");const d=rt(e.buys5m??e.buysH1??e.buys),m=rt(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(m)?(o.push("flow"),m>=d*1.8&&m>=5?(n-=18,r.push(z("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=m*1.4&&d>=8&&(n+=5,r.push(z("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):s.push("flow");const f=rt(e.bestPickScore??e.score);Number.isFinite(f)&&(o.push("score"),f>=78?(n+=7,r.push(z("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(n-=10,r.push(z("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(T=>String(T||"").toLowerCase());y.some(T=>/mayhem|fake|scam|honeypot|blacklist/.test(T))&&(n-=40,r.push(z("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(T=>/bundle|bundled|cluster|concentr/.test(T))&&(n-=18,r.push(z("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(T=>/dev|fresh wallet|fresh-wallet|insider/.test(T))&&(n-=14,r.push(z("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(T=>/mint|freeze|token-2022/.test(T))&&(n-=24,r.push(z("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const b=Zn(e);if(b){const T=Gy(b);n+=Number(T.weight||0),r.push(T),["hold","mixed","risk","dump"].includes(pa(b.status))?o.push("devInfo"):s.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(n))),P=zy(S,r);return{mint:t,verdict:P,score:S,confidence:o.length>=5&&s.length<=1?"high":o.length>=3?"medium":"low",summary:jy(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Je(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&a.slimeShieldResults?.[t]||Xy(e)}function Qa(e=""){return String(e||"CAUTION").toLowerCase()}function Jy(e={},t={}){if(!N("slimeShieldEnabled",!0))return Zy(e);const n=Je(e),r=String(e.tokenMint||n.mint||"").trim(),o=n.verdict||"CAUTION",s=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${l(Qa(o))}" data-slimeshield-details="${l(r)}" title="${l(n.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${s?"Shield":"SlimeShield"}</small>
    </button>
  `}function Yy(e={}){if(!N("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${l(Ol(e))}">${l(o?`${o}`:"n/a")} score</em>`}const t=Je(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${l(Qa(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">Details</button>`}function _S(e={}){if(!N("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0),s=o?`${o}`:"n/a";return`
      <span class="terminal-score-chip" title="${l(Ol(e))}">
        <strong>${l(s)}</strong>
        <small>score</small>
      </span>
    `}const t=Je(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${l(Qa(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Qy(e={}){return N("slimeShieldEnabled",!0)?`SlimeShield ${Je(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function Zy(e={}){const t=Number(e.bestPickScore||e.score||0),n=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${l(Ol(e))}">
      <strong>${l(r)}</strong>
      <small>${n.length?"warnings":"best pick"}</small>
    </span>
  `}function ev(e={}){return Jy(e,{compact:!0})}function Ol(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},n=Object.entries(t).map(([o,s])=>`${o}: ${s}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...n,...r.map(o=>`warning: ${o}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function tv(e={}){return""}function M(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function F(...e){for(const t of e){const n=String(t??"").trim();if(n&&n!=="$0"&&n.toLowerCase()!=="n/a")return n}return"n/a"}function Ad(e={}){return[["15m",F(e.volumeM15Label,M(e.volumeM15))],["30m",F(e.volumeM30Label,M(e.volumeM30))],["1h",F(e.volumeH1Label,e.volumeLabel,M(e.volumeH1))],["24h",F(e.volumeH24Label,M(e.volumeH24))]]}function US(e={}){const t=lt(e),n=it(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),o=F(e.liquidityLabel,n>0?M(n):"","checking"),s=Ad(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      ${s.map(([c,i])=>`<span>${l(c)} <b>${l(i)}</b></span>`).join("")}
    </div>
  `}function av(e={}){const t=lt(e),n=it(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),o=F(e.liquidityLabel,n>0?M(n):"","checking"),s=F(e.volumeM15Label,M(e.volumeM15)),c=F(e.volumeH1Label,e.volumeLabel,M(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      <span>15m <b>${l(s)}</b></span>
      <span>1h <b>${l(c)}</b></span>
    </div>
  `}function Za(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const n=String(e.tokenMint||e.mint||"").trim();return n&&(e.isPump||n.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(n)}`:""}function To(e={},t=""){const n=t||Sa(e),r=Number(e.sniperCount||e.snipers||0),o=Za(e);return`
    <div class="compact-link-row">
      <a href="${l(e.dexUrl||J(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${o?`<a href="${l(o)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${l(n)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(r)}</span>`:""}
    </div>
  `}function Ye(e={},t={}){const n=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(n)&&Number.isFinite(r)&&n!==r)return n-r;const o=Number(e.pairCreatedAt||0),s=Number(t.pairCreatedAt||0);return o||s?s-o:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function Cd(e=""){let t=0;for(let n=0;n<String(e).length;n+=1)t=(t<<5)-t+String(e).charCodeAt(n),t|=0;return Math.abs(t)}function ma(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function fa(e=""){const t=We();return[e,a.livePairBucket,a.terminalSort,Bd(),t?.refreshCount||"",a.livePairsLastUpdatedByBucket[a.livePairBucket]||a.livePairsLastUpdatedAt||"",a.kolScan?.refreshCount||"",a.kolScan?.refreshedAt||a.kolLastUpdatedAt||""].join(":")}function ha(e=[],t=12,n="",r=0){const o=ge(e||[]),s=Math.max(0,Number(t)||o.length);if(!s)return[];if(!n||o.length<=s)return o.slice(0,s);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,s-1),o.length),i=o.slice(0,c),u=o.slice(c);if(!u.length)return i.slice(0,s);const d=Cd(n)%u.length,m=[...u.slice(d),...u.slice(0,d)];return[...i,...m].slice(0,s)}function Ld(e=[],t=new Set){return(e||[]).filter(n=>{const r=ma(n);return!r||!t.has(r)})}function xd(e={}){const t=lt(e),n=it(e),r=Ql(e),o=Do(e),s=dp(e),c=F(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),i=F(e.liquidityLabel,n>0?M(n):"","checking"),u=F(e.volumeM15Label,r>0?M(r):"","checking"),d=F(e.volumeH1Label,e.volumeLabel,o>0?M(o):"","checking"),m=F(e.volumeH24Label,s>0?M(s):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${l(c)}</strong></span>
      <span><small>Liq</small><strong>${l(i)}</strong></span>
      <span><small>15m</small><strong>${l(u)}</strong></span>
      <span><small>1h</small><strong>${l(d)}</strong></span>
      <span><small>24h</small><strong>${l(m)}</strong></span>
    </div>
  `}function Md(e,{source:t,actionLabel:n="Trade",isKolContext:r=!1}={}){const o=Wo(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(t)}" title="Open chart and buy/sell panel">${l(n)}</button>
    <button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(t)}" title="Quick buy with preset or custom SOL amount">${l(ga())}</button>
    <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${l(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?Fu(e):""}
    <button type="button" class="watch-action" data-watched="${o}" title="${o?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(No(e)||"")}">${o?"Saved":"Watch"}</button>
    ${Pd(e,{compact:!0})}
  `}function nv(e,t={}){const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ha(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,m)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${i?"is-kol-signal":""}" data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${ct(d,{priority:m<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-title">${l(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
                <small>${l(d.name||d.category||"Token")}</small>
                ${i?"":Jl(d)}
                ${Yy(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${l(d.tokenMint)}">${l(w(d.tokenMint))}</button>
              <span class="terminal-token-age">${l(d.pairAgeLabel||Ut(d)||"age unknown")} | ${l(f)}</span>
              ${To(d)}
            </div>
            ${xd(d)}
            <div class="terminal-token-actions has-dev-info">
              ${Md(d,{source:"terminal-row",actionLabel:r,isKolContext:i})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:R(o,s)}function vt(e,t={}){if(t.layout==="terminal")return nv(e,t);const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ha(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-row">
          ${ct(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-title">${l(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
              <small>${l(u.name||u.category||"Token")}</small>
              ${i?"":Jl(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${l(u.tokenMint)}">${l(w(u.tokenMint))}</button>
            <span>${l(u.pairAgeLabel||Ut(u)||"age unknown")} | ${l(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${av(u)}
            ${To(u)}
          </div>
          ${ev(u)}
          <div class="compact-row-actions has-dev-info">
            ${Md(u,{source:"compact-row",actionLabel:r,isKolContext:i})}
          </div>
        </article>
      `).join("")}
    </div>
  `:R(o,s)}function en(e){const t=ne(e,e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId);if(!t)return"Custom / manual";const n=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&n.push(`Timer ${t.sellDelay}`),n.join(" | ")}function qS(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${l(en("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${nt("trade",a.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${nt("bundle",a.selectedBundlePresetId)}
            </select>
          </label>
          <button type="button" data-edit-selected-preset="trade">Edit Active Trade</button>
          <button type="button" data-edit-selected-preset="bundle">Edit Active Bundle</button>
        </div>
        <div class="ogre-tek-bar">
          <span>Ogre Tek</span>
          <button type="button" data-tab="sniper">Sniper</button>
          <button type="button" data-tab="bundle">Bundle</button>
          <button type="button" data-tab="volume">Volume</button>
          <button type="button" data-tab="launch">Launch Snipe</button>
        </div>
      </details>
    </section>
  `}function er(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function G(e=a.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const n=t.indexOf(".");if(n!==-1&&(t=t.slice(0,n+1)+t.slice(n+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":er(r)}function ot(){return ne("trade",a.selectedTradePresetId)}function rv(){return ne("bundle",a.selectedBundlePresetId)}function Ue(e=ot()){return G()||er(e?.amountSol)}function ov(e=rv()){return G()||er(e?.amountSol)||"0.1"}const El=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Po(e=""){return El.find(t=>t.id===e)||El[0]}function Fl(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function sv(e=Po()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,n=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${n} | ${r}`}function lv(e={},t=Po()){const n=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:n?.percentGain?String(n.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:n?.sellPercent?String(n.sellPercent):t.sellPercent||"100"}}function iv(e=""){if(ie(e)){const n=le();return`${n?.provider||"Browser wallet"} ${n?.publicKey?w(n.publicKey):""}`.trim()}const t=a.wallets.find(n=>String(n.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Le(){return(!a.terminalLaunchFilters||typeof a.terminalLaunchFilters!="object")&&(a.terminalLaunchFilters={}),a.terminalLaunchFilters.socials=a.terminalLaunchFilters.socials||{},a.terminalLaunchFilters.quotes=a.terminalLaunchFilters.quotes||{},a.terminalLaunchFilters.audits=a.terminalLaunchFilters.audits||{},a.terminalLaunchFilters}function wt(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(n=>String(n||"").trim().split(/\s+/)).map(n=>n.trim().toLowerCase()).filter(n=>!n||t.has(n)?!1:(t.add(n),!0)).slice(0,3)}function Bd(e=Le()){const t=Object.keys(e.socials||{}).filter(o=>e.socials[o]).sort().join(","),n=Object.keys(e.quotes||{}).filter(o=>e.quotes[o]).sort().join(","),r=Object.keys(e.audits||{}).filter(o=>e.audits[o]).sort().join(",");return[wt(e.keywords).join(","),wt(e.excludeKeywords).join(","),t,n,r].join("|")}function tn(e=Le()){return!!Bd(e).replace(/\|/g,"")}function Ao(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function cv(e={},t=""){const n=Ao(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(n));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(n)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(n)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(n)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(n)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(n)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(n)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(n)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(n)):t==="minSocial"?r:!0}function uv(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const n=Ao(e).toUpperCase();return n.includes("USDC")?"USDC":n.includes("USD1")?"USD1":n.includes("WSOL")||n.includes("SOL")?"WSOL":""}function Co(e={},t=[]){const n=Ao(e);return t.some(r=>r.test(n))}function dv(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!Co(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!Co(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:Co(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const n=I(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return n>0?n<=30:!Co(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function an(e=[],t=Le()){const n=ge(e||[]);if(!tn(t))return n;const r=wt(t.keywords),o=wt(t.excludeKeywords),s=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),i=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return n.filter(u=>{const d=Ao(u);return!(r.length&&!r.some(m=>d.includes(m))||o.length&&o.some(m=>d.includes(m))||s.some(m=>!cv(u,m))||c.length&&!c.includes(uv(u))||i.some(m=>!dv(u,m)))})}function Wl(e=[],t=[]){const n=Le();if(!tn(n))return"";const r=wt(n.keywords),o=wt(n.excludeKeywords),s=[];r.length&&s.push(`watching ${r.map(i=>`"${i}"`).join(", ")}`),o.length&&s.push(`excluding ${o.map(i=>`"${i}"`).join(", ")}`);const c=Math.max(0,ge(e).length-ge(t).length);return`<div class="terminal-launch-filter-summary">${l(s.join(" | ")||"filters active")} - ${l(t.length)}/${l(ge(e).length)} visible${c?`, ${l(c)} hidden`:""}</div>`}function tr(e=[],t="pairs"){const n=Le(),r=wt(n.keywords),o=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",s=ge(e).length;return R("Watching fresh launches",s?`No ${t} match ${o} yet. ${s} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${o}.`)}function Nl(e="terminal",t={}){const n=Le(),r=tn(n),o=!!(n.open||r),s=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):s;return`
    <section class="terminal-launch-filter ${o?"is-open":""}" data-terminal-launch-filter data-preserve-focus>
      <div class="terminal-launch-filter-head">
        <div>
          <strong>Launch Filter</strong>
          <span>${r?`${l(c)}/${l(s)} visible`:"Watch a known ticker before it goes live"}</span>
        </div>
        <button type="button" data-terminal-filter-toggle>${o?"Hide Filters":"Filter / Keyword Watch"}</button>
      </div>
      ${o?`
        <div class="terminal-launch-filter-grid">
          <label class="wide">
            Search keywords (max 3)
            <input data-terminal-filter-field="keywords" type="text" autocomplete="off" placeholder="cook, broscook, ogre" value="${l(n.keywords||"")}">
          </label>
          <label class="wide">
            Exclude keywords (max 3)
            <input data-terminal-filter-field="excludeKeywords" type="text" autocomplete="off" placeholder="test, fake, old" value="${l(n.excludeKeywords||"")}">
          </label>
          <fieldset>
            <legend>Socials</legend>
            ${Bm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${l(i)}" ${n.socials?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${Rm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${l(i)}" ${n.quotes?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${Im.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-audit="${l(i)}" ${n.audits?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <div class="terminal-launch-filter-actions">
            <button type="button" class="primary" data-refresh-live-pairs>Refresh Feeds</button>
            <button type="button" data-terminal-filter-clear>Clear Filters</button>
            <button type="button" data-tab="launch">${e==="launch"?"Launch Snipe":"Open Launch Snipe"}</button>
          </div>
        </div>
      `:""}
    </section>
  `}function Rd(){Tr&&window.clearTimeout(Tr),Tr=window.setTimeout(()=>{Tr=null,Y("live"),Y("launch"),Y("sniper"),h()},180)}function Lo(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const o=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-o)/1e3))}const n=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return n&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const pv=100,mv=7200,fv=75e4,hv=86400,gv=2e6,bv=28e3,Id=18e4,yv=16e4;function Od(){const e=Sd();return ge([...a.livePairs?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1d?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[]]).map(t=>$d(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!Jn(t))}function nn(e={}){return I(e.marketCap,e.fdv)}function Ed(e={}){return I(e.liquidityUsd)}function Fd(e={}){return I(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function Dl(e={}){if(rn(e))return!1;const t=Lo(e);return!Number.isFinite(t)||t<0||t>mv||nn(e)>fv?!1:Dt(e)<70}function xo(e={}){if(rn(e))return!1;const t=Dt(e),n=nn(e),r=n>=bv&&n<=Id;return t>=55&&(!n||n<=Id)||r}function Wd(e={}){if(Dl(e)||xo(e)||rn(e))return!1;const t=Lo(e);return Number.isFinite(t)&&(t<0||t>hv)||nn(e)>gv?!1:Ed(e)>0||Fd(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function Nd(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Dt(e={}){const t=I(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const n=nn(e),r=Nd(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&n>0?Math.max(1,Math.min(99,n/69e3*100)):0}function rn(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=Nd(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const n=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=nn(e);return n&&r>=yv?!0:!!(n&&/\b(raydium|meteora|orca)\b/.test(t))}function Mo(e={}){if(rn(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":xo(e)||t==="graduating"?"graduating":Dl(e)?"new":(t==="steady"||t==="unknown"||Wd(e),"steady")}function Dd(e={}){const t=Number(e.bestPickScore||e.score||0),n=Fd(e),r=Ed(e),o=nn(e),s=Lo(e),c=Number.isFinite(s)?Math.max(0,86400-s)/86400:0;return t*1e3+Math.log10(n+1)*160+Math.log10(r+1)*120+Math.log10(o+1)*80+c*100}function _d(e=[]){return[...e].sort((t,n)=>Dd(n)-Dd(t)||Ye(t,n))}function vv(e=[],t=[],n=pv){const r=new Set,o=[];for(const s of[...e,...t]){const c=String(s?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),o.push(s),o.length>=n))break}return o}function Ud(e=a.slimeScopeMode){const t=Od(),n=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(i=>Mo(i)===n),o=t.filter(i=>{const u=Mo(i);return n==="graduated"?u==="graduated"||rn(i):n==="graduating"?u==="graduating"||xo(i):n==="steady"?u==="steady"||Wd(i):u==="new"||Dl(i)}),s=n==="new"?[...r].sort(Ye):_d(r),c=n==="new"?ge(o).sort(Ye):_d(o);return vv(s,c)}function wv(e=[],t="new"){const n=tt(`slimeScope:${t}`,e).slice(0,12);return n.length?n.map((r,o)=>{const s=r.pairAgeLabel||Ut(r)||"age ?",c=F(r.marketCapLabel,r.fdvLabel,M(lt(r)),"checking"),i=F(r.liquidityLabel,M(it(r)),"checking"),u=F(r.volumeM15Label,M(Ql(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${l(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${ct(r,{priority:o<4})}
        <div class="slime-scope-column-main">
          <strong>${l(r.symbol||r.shortMint||w(r.tokenMint))}</strong>
          <small>${l(w(r.tokenMint))} · ${l(s)}</small>
          <span>${l(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${l(c)}</b></span>
          <span>Liq <b>${l(i)}</b></span>
          <span>15m <b>${l(u)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${l(Ue()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${l(t)} pairs.</div>`}function Sv(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,n,r])=>{const o=Ud(t);return`
          <section class="slime-scope-column" data-scope-column="${l(t)}">
            <header>
              <div>
                <h4>${l(n)}</h4>
                <small>${l(r)}</small>
              </div>
              <span>${l(o.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${wv(o,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function kv(){const e=lp(),[,,t]=e,n=Sc(a.slimeScopeMode),o=!!(V("slimeScope").inFlight||a.livePairsLoadingByBucket?.[n]),s=a.livePairsRefreshErrorByBucket?.[n],c=ge(ip(Od(),e[0])),i=tt("slimeScope",c),u=i.length?Nn()?st(i,{context:"live",shareBuilder:Sa,hideToolbar:!0}):vt(i,{layout:"terminal",limit:Math.max(1,i.length),actionLabel:"Trade"}):s?R("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):o?R("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):R("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${tw(e)}<span>${l(t)}</span></div>
        ${cp(c.length,la())}
        ${vu("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${o?"disabled":""}>${o?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${sa("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${Sv()}
    </section>
  `}function HS(){const e=We(),t=ge(e?.rows||[]),n=an(t),r=[...n].sort(Ye),o=kd(a.kolScan?.rows||[]).filter(L=>!Jn(L)),s=an(o),c=Qn(t,o),i=an(c),u=tn(),d=ha(i,8,fa("best-picks"),2),m=new Set(d.map(ma).filter(Boolean)),f=Ld(r,m),y=ha(f.length?f:r,12,fa("live-pairs"),0),b=new Set([...m,...y.map(ma).filter(Boolean)]),S=Ld(s,b),P=ha(S.length?S:s,12,fa("kol-signals"),1),T=!!a.livePairsLoadingByBucket[a.livePairBucket],g=la(),A="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${T?"Refreshing":"Live"}${g?` | ${l(Rn(qa(g)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Lt.map(([L,B])=>{const _=a.livePairsByBucket[L]?.rows?.length,re=Number.isFinite(Number(_))?` (${_})`:"";return`<button data-live-pair-bucket="${L}" data-active="${a.livePairBucket===L}">${B}${re}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${Mm.map(([L,B])=>`<option value="${L}" ${a.terminalSort===L?"selected":""}>${B}</option>`).join("")}
            </select>
          </label>
          ${vu("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${T?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${Nl("terminal",{rawCount:t.length,visibleCount:n.length})}
        ${Wl(t,n)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?vt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?tr(c,"best picks"):vt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?vt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A}):u?tr(t,"live pairs"):vt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${a.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?vt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?tr(o,"KOL signals"):vt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${Uv()}
      </main>
    </section>
  `}function KS(){const e=ot();if(!e)return"Trade";const t=Ue(e);return t?`Buy ${t} SOL`:Xp(e,"Trade")}function ga(){const e=ot(),t=Ue(e);return t?`Buy ${t} SOL`:"Quick Buy"}function Bo(){const e=ga();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{v(t,e)})}function ba(e=""){const t=String(e||"").trim();if(!t)return null;const n=Xn().find(o=>String(o?.tokenMint||o?.mint||o?.tokenAddress||"").trim()===t);if(n)return n;const r=a.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:J(t)}}function $v(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function Tv(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function qd(e={}){if(!N("slimeShieldEnabled",!0))return"";const t=Je(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${l(Qa(r))}">
      <header>
        <div>
          <strong>SlimeShield</strong>
          <small>Pre-trade risk read</small>
        </div>
        <span class="slimeshield-verdict">${l(r)}</span>
      </header>
      <p>${l(t.summary||"SlimeShield is warming up. Trade carefully.")}</p>
      <div class="slimeshield-actions">
        <button type="button" data-slimeshield-details="${l(n)}">Details</button>
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(n)}" data-protected-buy-preset="${l(t.protectedBuyPreset||Fl(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function Hd(e=[],t="risk",n="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(o=>t==="positive"?o.severity==="positive":o.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(o=>`
        <li>
          <strong>${l(o.label||o.key||"Signal")}</strong>
          <span>${l(o.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(n)}</p>`}function Kd(e=""){const t=String(e||a.smartChartToken||a.tradeToken||"").trim();!t||!N("slimeShieldEnabled",!0)||(a.slimeShieldDetails={open:!0,tokenMint:t},a.slimeShieldStatus="",Ra(),va(),Vd(t,{force:!0}),N("replayBeforeBuyEnabled",!0)&&Hl(t,{force:!0}))}function _l(){a.slimeShieldDetails={open:!1,tokenMint:""},a.slimeShieldStatus="",va(),Pr()}async function Vd(e="",t={}){const n=String(e||"").trim();if(!n||!N("slimeShieldEnabled",!0))return null;if(!t.force&&a.slimeShieldResults?.[n])return a.slimeShieldResults[n];if(a.slimeShieldLoading?.[n])return null;a.slimeShieldLoading={...a.slimeShieldLoading||{},[n]:!0},va();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return s&&(a.slimeShieldResults={...a.slimeShieldResults||{},[n]:s},te(s.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),a.slimeShieldStatus=s.cacheHit?"Loaded from cache.":"Updated from local data."),s}catch(r){return a.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...a.slimeShieldLoading||{}};delete r[n],a.slimeShieldLoading=r,va()}}function Pv(e=""){const t=ba(e)||Ya(e)||{tokenMint:e},n=Zn(t),r=n.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",o=[...Array.isArray(n.externalLinks)?n.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||J(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:mint?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(mint)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((s,c,i)=>/^https?:\/\//i.test(String(s.url||""))&&i.findIndex(u=>String(u.url||"")===String(s.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:n.likelyDevWallet||null,confidence:n.confidence||"unknown",status:pa(n.status),label:n.label||$o(n.status),score:50,summary:n.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:n.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:n.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:n.updatedAt||new Date().toISOString(),externalLinks:o,dataSource:"ui-fallback"}}function zd(e=""){const t=String(e||"").trim();return a.devInfoResults?.[t]||Pv(t)}function ar(e,t=""){const n=Number(e);return Number.isFinite(n)?`${Math.round(n*10)/10}${t}`:"n/a"}function jd(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function Ro(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function Av(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function Gd(e="",t={}){const n=String(e||"").trim();if(!n||!N("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoSummaries?.[n])return a.devInfoSummaries[n];const r=`summary:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0};try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(a.devInfoSummaries={...a.devInfoSummaries||{},[n]:c},te(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,t.silent||ya()}}async function Xd(e="",t={}){const n=String(e||"").trim();if(!n||!N("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoResults?.[n])return a.devInfoResults[n];const r=`details:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0},ya();try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(a.devInfoResults={...a.devInfoResults||{},[n]:c},a.devInfoSummaries={...a.devInfoSummaries||{},[n]:{mint:n,status:c.status||"unknown",label:c.label||$o(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},a.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",te(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(o){return a.devInfoStatus=o?.message||"Dev Info is temporarily unavailable.",null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,ya()}}function Cv(e=""){const t=String(e||"").trim();!t||!N("devInfoEnabled",!0)||(a.devInfoDetails={open:!0,tokenMint:t},a.devInfoStatus="",Ra(),ya(),Gd(t,{force:!0,silent:!0}),Xd(t,{force:!0}))}function Ul(){a.devInfoDetails={open:!1,tokenMint:""},a.devInfoStatus="",ya(),Pr()}function Lv(e="render"){!N("devInfoEnabled",!0)||ws||a.route==="terminal"&&(ws=window.setTimeout(()=>{ws=null,xv(e)},300))}async function xv(e="render"){if(!N("devInfoEnabled",!0)||Ba())return;const t=Gn().slice(0,16),n=[],r=new Set;for(const o of t){const s=String(o.tokenMint||o.mint||o.tokenAddress||"").trim();if(!(!s||r.has(s)||a.devInfoSummaries?.[s]||a.devInfoLoading?.[`summary:${s}`])&&(r.add(s),n.push(s),n.length>=8))break}n.length&&(await Promise.allSettled(n.map(o=>Gd(o,{silent:!0}))),E({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:n.length,details:e}),Ba()||Ia("dev-info-prefetch"))}function Io(e=[],t="No strong cached signal yet."){const n=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return n.length?`
    <ul class="slimeshield-factor-list">
      ${n.map(r=>`<li><span>${l(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(t)}</p>`}function Oo(e,t="Not cached yet"){const n=String(e||"").trim();return!n||n.toLowerCase()==="warming"||n.toLowerCase()==="checking"?t:n}function Eo(e,t=r=>String(r),n="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):n}function nr(e,t,n=""){if(e.__lastDrawerHtml===t)return!1;const r=n?e.querySelector(n):null,o=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,n&&o){const s=e.querySelector(n);s&&(s.scrollTop=o)}return!0}function ya(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=a.devInfoDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",n),!n||!N("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ba(r)||Ya(r)||{tokenMint:r},s=zd(r),c=a.devInfoSummaries?.[r]||Zn(o),i=pa(s.status||c.status),u=s.confidence||c.confidence||"unknown",d=!!a.devInfoLoading?.[`details:${r}`],m=s.likelyDevWallet||c.likelyDevWallet||"",f=s.currentPosition||null,y=s.historicalStats||{},b=s.linkedWalletSignals||{},S=s.marketContext||{},P=s.sourceHydration||{},T=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,8):[],g=I(S.marketCap,o.marketCap,o.fdv),A=I(S.liquidityUsd,o.liquidityUsd),L=I(S.volume5m,o.volume5m,o.volumeM5),B=I(S.volumeH1,o.volumeH1,o.volume1h),_=I(S.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),re=S.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",we=S.mintAuthority||o.mintAuthority||"",Qe=S.freezeAuthority||o.freezeAuthority||"",D=!!(S.heliusDasIndexedAt||S.heliusDasSource||o.heliusDasSource||re||we||Qe),Fe=[...Array.isArray(s.externalLinks)?s.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:o.dexUrl||J(r)},{label:"Solscan Wallet",url:m?`https://solscan.io/account/${encodeURIComponent(m)}`:""},{label:"KOLscan Wallet",url:m?`https://kolscan.io/account/${encodeURIComponent(m)}`:""},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"X",url:o.twitterUrl||o.xUrl},{label:"TG",url:o.telegramUrl},{label:"Website",url:o.websiteUrl}].filter((ue,Zo,es)=>/^https?:\/\//i.test(String(ue.url||""))&&es.findIndex(cn=>String(cn.url||"")===String(ue.url||""))===Zo).slice(0,8),zt=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],Tt=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${l($o(i))} · ${l(jd(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${l(i)}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${l(ve(s.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${l(Av(m))}</dd></div>
          <div><dt>Confidence</dt><dd>${l(jd(u))}</dd></div>
          <div><dt>Source</dt><dd>${l(s.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${l(w(s.pairAddress||o.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${m?`<button type="button" data-copy="${l(m)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${l(r)}">Copy CA</button>
          ${m&&a.user?`<button type="button" data-dev-watch="${l(m)}">${a.devWatch?.[m]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${Fe.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${Fe.map(ue=>`<a href="${l(ue.url)}" target="_blank" rel="noreferrer">${l(ue.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${l(Eo(g,M))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Eo(A,M))}</dd></div>
          <div><dt>5m volume</dt><dd>${l(Eo(L,M))}</dd></div>
          <div><dt>1h volume</dt><dd>${l(Eo(B,M))}</dd></div>
          <div><dt>Pair age</dt><dd>${l(Number.isFinite(_)?Ro(_):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(re?w(re):D?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${we?w(we):D?"none":"not indexed"} / ${Qe?w(Qe):D?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(S.source||s.cacheSource||s.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${l(P.message)}${P.eventsStored?` · ${l(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${Io(T,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${l(ar(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${l(ar(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${l(ar(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${l(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${l(Ro(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${l(f.lastSellAt?ve(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||zt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${l(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${l(Ro(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${l(ar(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${l(ar(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${zt.length?`
          <ul class="dev-info-launches">
            ${zt.map(ue=>`<li><span>${l(ue.symbol||w(ue.mint||""))}</span><small>${l(ue.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(s.riskReasons)&&s.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${Io(s.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(s.positiveReasons)&&s.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${Io(s.positiveReasons,"")}
      </section>`:""}
      ${b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${l(b.linkedWalletCount?`${b.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${Io(b.notes,"")}
      </section>`:""}
      ${(()=>{const ue=[f?"":"dev position",Number(y.launchesTracked)>0||zt.length?"":"launch history",!(s.riskReasons||[]).length&&!(s.positiveReasons||[]).length?"behavior signals":"",!b.linkedWalletCount&&!(b.notes||[]).length?"linked wallets":""].filter(Boolean);return ue.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${l(ue.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(s.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${l(r)}" data-watch-symbol="${l(o.symbol||"")}" data-watch-name="${l(o.name||"")}" data-watch-image="${l(No(o)||"")}">${Wo(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${l(r)}">Open SlimeShield</button>
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${l(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${a.devInfoStatus?`<small class="slimeshield-status">${l(a.devInfoStatus)}</small>`:""}
    </aside>
  `;nr(e,Tt,".dev-info-drawer")}function Jd(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function ql(e=""){const t=String(e||"").trim();return a.replayResults?.[t]||Jd(t)}function on(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function Mv(e=""){if(!N("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const n=ql(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${l(n.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(on(n.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(on(n.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${l(n.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function Hl(e="",t={}){const n=String(e||"").trim();if(!n||!N("replayBeforeBuyEnabled",!0))return null;if(!t.force&&a.replayResults?.[n])return a.replayResults[n];if(a.replayLoading?.[n])return null;a.replayLoading={...a.replayLoading||{},[n]:!0},rr(),va();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return s&&(a.replayResults={...a.replayResults||{},[n]:s},te(s.cacheHit?"replayCacheHit":"replayCacheMiss")),s}catch{return a.replayResults={...a.replayResults||{},[n]:Jd(n)},null}finally{const r={...a.replayLoading||{}};delete r[n],a.replayLoading=r,rr(),va()}}function Bv(e=""){const t=String(e||"").trim();!t||!N("replayBeforeBuyEnabled",!0)||(a.replayDetails={open:!0,tokenMint:t},Ra(),rr(),Hl(t))}function Kl(){a.replayDetails={open:!1,tokenMint:""},rr(),Pr()}function rr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=a.replayDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",n),!n||!N("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ql(r),s=!!a.replayLoading?.[r],c=`
    <div class="slimeshield-drawer-backdrop" data-replay-close></div>
    <aside class="replay-before-buy-drawer" role="dialog" aria-modal="true" aria-label="Replay Before You Buy details">
      <header>
        <div>
          <span>Replay Before You Buy</span>
          <h3>${l(w(r))}</h3>
        </div>
        <button type="button" data-replay-close>Close</button>
      </header>
      <section class="replay-summary">
        <strong>${l(o.summary||"Not enough local history yet.")}</strong>
        <small>${s?"Updating...":`Confidence: ${l(o.confidence||"low")} · Updated ${l(ve(o.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${l(o.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(on(o.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${l(on(o.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(on(o.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${l(on(o.failRatePercent))}</dd></div>
        <div><dt>Best exit</dt><dd>${l(o.bestExitPattern||"n/a")}</dd></div>
      </dl>
      <section>
        <h4>Matched Traits</h4>
        ${Array.isArray(o.matchedTraits)&&o.matchedTraits.length?`
          <ul class="slimeshield-factor-list">
            ${o.matchedTraits.map(i=>`<li><span>${l(i)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${l(r)}" ${s?"disabled":""}>${s?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `;nr(e,c,".replay-drawer")}function va(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=a.slimeShieldDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",n),!n||!N("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ba(r)||{tokenMint:r},s=a.slimeShieldResults?.[r]||Je(o),c=s.verdict||"CAUTION",i=s.sourceHydration||{},u=s.marketContext||{},d=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,6):[],m=!!a.slimeShieldLoading?.[r],f=Array.isArray(s.factors)?s.factors:[],y=I(u.marketCap,o.marketCap,o.fdv),b=I(u.liquidityUsd,o.liquidityUsd),S=I(u.volumeH1,o.volumeH1,o.volume1h),P=I(u.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),T=u.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",g=u.mintAuthority||o.mintAuthority||"",A=u.freezeAuthority||o.freezeAuthority||"",L=!!(u.heliusDasIndexedAt||u.heliusDasSource||o.heliusDasSource||T||g||A),B=s.devInfoSummary||Zn(o),_=pa(B.status),re=[...Array.isArray(s.externalLinks)?s.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||o.dexUrl||J(r)},{label:"Pump",url:u.pumpUrl||Za(o)},{label:"X",url:u.twitterUrl||o.twitterUrl||o.xUrl},{label:"TG",url:u.telegramUrl||o.telegramUrl},{label:"Web",url:u.websiteUrl||o.websiteUrl}].filter((D,Fe,zt)=>/^https?:\/\//i.test(String(D.url||""))&&zt.findIndex(Tt=>String(Tt.url||"")===String(D.url||""))===Fe),we=[...Array.isArray(o.riskFlags)?o.riskFlags:[],...Array.isArray(o.scoreWarnings)?o.scoreWarnings:[],...Array.isArray(o.bestPickWarnings)?o.bestPickWarnings:[]].filter(Boolean).slice(0,4),Qe=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${l(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${l(Qa(c))}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${l(s.confidence||"low")}</span>
          <span>Score: ${l(Number.isFinite(Number(s.score))?`${Math.round(Number(s.score))}/100`:"n/a")}</span>
          <span>${m?"Updating...":`Updated ${l(ve(s.updatedAt))}`}</span>
        </div>
      </section>
      <section>
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${l(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${l(Number.isFinite(P)?Ro(P):Oo(o.pairAgeLabel||Ut(o),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Number.isFinite(b)&&b>0?M(b):Oo(o.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${l(Number.isFinite(y)&&y>0?M(y):Oo(o.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${l(Number.isFinite(S)&&S>0?M(S):Oo(o.volumeH1Label||o.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${l($o(_))} · ${l(B.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(T?w(T):L?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${g?w(g):L?"none":"not indexed"} / ${A?w(A):L?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(u.source||s.cacheSource||s.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${l(we.length?we.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${re.map(D=>`<a href="${l(D.url)}" target="_blank" rel="noreferrer">${l(D.label)}</a>`).join("")}
          ${N("devInfoEnabled",!0)?`<button type="button" data-dev-info="${l(r)}">Open Dev Info</button>`:""}
        </div>
        ${i.message?`<p class="slimeshield-muted">Source refresh: ${l(i.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(D=>`<li><span>${l(D)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${Hd(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${Hd(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l($v(s.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${l(Tv(s.protectedBuyPreset))}</small>
      </section>
      ${Mv(r)}
      <div class="slimeshield-drawer-actions">
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-preset="${l(s.protectedBuyPreset||Fl(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${l(r)}" ${m?"disabled":""}>${m?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${l(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${a.slimeShieldStatus?`<small class="slimeshield-status">${l(a.slimeShieldStatus)}</small>`:""}
    </aside>
  `;nr(e,Qe,".slimeshield-drawer")}function Vl(e){const t=e==="bundle"?"bundle":"trade";a.activeTab=t,t==="trade"&&(a.editingTradePresetId=""),t==="bundle"&&(a.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function VS(e){if(!e?.tokenMint)return R("No token selected","Click any row to preview it here without leaving the live feeds.");const t=at().some(n=>String(n.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${ct(e)}
      <div>
        <strong>${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
        <small>${l(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${l(e.pairAgeLabel||Ut(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${l(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${l(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${l(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${N("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${l(N("slimeShieldEnabled",!0)?Je(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${qd(e)}
    <div class="card-actions compact">
      <a href="${l(e.dexUrl||J(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${Za(e)?`<a href="${l(Za(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="token-preview">${l(ga())}</button>
      <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function zS(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([n,r])=>`<button type="button" data-smart-chart-view="${n}" data-active="${e===n}">${r}</button>`).join("")}
    </div>
  `}function Rv(e=""){const t=String(e||"").trim();return t?(a.pnl?.trades||[]).filter(n=>String(n?.tokenMint||n?.mint||"").trim()===t):[]}function jS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=Rv(n),o=!!(Za(e)&&$l(e)),s=o?Za(e):e.dexUrl||J(md(e)||n),c=o?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${l(c)} Transactions</h4>
          <p>Live market activity from ${l(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${l(s)}" target="_blank" rel="noreferrer">Open ${l(c)} Feed</a>
      </div>
      ${Il(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${jl(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function GS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=Gp(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${l(e.symbol||w(n))}.</p>
        </div>
      </div>
      ${Il(e,"info")}
      ${xd(e)}
      ${qd(e)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${l(r)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${l(n)}">${l(w(n))}</button></dd></div>
        <div><dt>Position</dt><dd>${t?"Held":"None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${l(e.source||e.category||e.dexId||"market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${To(e)}
      </div>
    </section>
  `}function Iv(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=a.chartTradeTab==="sell"?"sell":"buy",o=le(),s=a.wallets?.length?String(a.wallets[0]?.index||""):"",c=Vu(),i=ot(),u=i?.walletIndex||(i?.walletIndexes||[])[0]||"",d=o?.publicKey&&zu(o)?"connected":"",m=a.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||s||(o?.publicKey?"connected":""),f=ie(m),y=a.quickBuyAmountOverride||Ue(i)||"",b=i?en("trade"):"No preset / manual",S=String(i?.slippageBps||"400"),P=String(i?.takeProfitPct||"25"),T=String(i?.stopLossPct||"8"),g=String(i?.sellDelay||"off"),A=String(i?.sellPercent||"100"),L=new Set(["300","400","500"]),B=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,_=t?`${l(t.uiAmount||"Position")} tokens | ${l(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
    <div class="chart-trade-panel">
      <div class="chart-trade-tabs" role="tablist" aria-label="Token trade panel">
        <button type="button" data-chart-trade-tab="buy" data-active="${r==="buy"}">Buy</button>
        <button type="button" data-chart-trade-tab="sell" data-active="${r==="sell"}">Sell</button>
      </div>
      ${r==="buy"?`
        <div class="chart-trade-form" data-chart-trade-panel="buy">
          <label>
            Wallet
            <select data-chart-buy-wallet>
              ${za(m)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${l(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(re=>`<button type="button" data-chart-buy-preset="${re}">${re} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${nt("trade",a.selectedTradePresetId)}
            </select>
          </label>
          <small class="chart-preset-summary">${l(b)}</small>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300" ${S==="300"?"selected":""}>3%</option>
              <option value="400" ${S==="400"?"selected":""}>4%</option>
              <option value="500" ${S==="500"?"selected":""}>5%</option>
              ${L.has(S)?"":`<option value="${l(S)}" selected>${l(B)}</option>`}
            </select>
          </label>
          <div class="chart-auto-exit-grid" aria-label="Chart buy exit settings">
            <label>
              Take Profit
              ${Wt({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${Wt({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${je("chart-buy-delay","data-chart-buy-delay",g)}
            </label>
            <label>
              Exit Size
              ${Wt({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:A,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${l(o?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:s?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${l(n)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${l(a.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${_}</p>
          <div class="quick-grid">
            <button type="button" data-position-sell="${l(n)}" data-position-sell-percent="25" ${t?"":"disabled"}>Sell 25%</button>
            <button type="button" data-position-sell="${l(n)}" data-position-sell-percent="50" ${t?"":"disabled"}>Sell 50%</button>
            <button type="button" class="danger" data-position-sell="${l(n)}" data-position-sell-percent="100" ${t?"":"disabled"}>Sell 100%</button>
          </div>
          <label>
            Custom sell %
            <input data-chart-sell-percent type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="100" ${t?"":"disabled"}>
          </label>
          <button type="button" data-chart-confirm-sell="${l(n)}" ${t?"":"disabled"}>Confirm Custom Sell</button>
        </div>
      `}
    </div>
  `}function XS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim();return n?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${l(n)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${N("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(n)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function Ov(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=lt(e),o=it(e),s=y=>{const b=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(b)?"":b},c=F(r>0?M(r):"",s(e.marketCapLabel),s(e.fdvLabel),"checking"),i=F(o>0?M(o):"",s(e.liquidityLabel),"checking"),u=F(Number(e.volumeH1)>0?M(e.volumeH1):"",s(e.volumeH1Label),s(e.volumeLabel),"checking"),d=F(Number(e.volumeH24)>0?M(e.volumeH24):"",s(e.volumeH24Label),"checking"),m=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,b=Number(e.h1);return o>0&&o<5e3?"Thin exit":Number.isFinite(b)&&b>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(b)||b>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&o>0?"Clean setup":""})(),f=t?"Position held":m||($l(e)?"Pump curve":F(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${l(w(n))}</strong></span>
      <span><small>MC / FDV</small><strong>${l(c)}</strong></span>
      <span><small>LIQ</small><strong>${l(i)}</strong></span>
      <span><small>1H</small><strong>${l(u)}</strong></span>
      <span><small>24H</small><strong>${l(d)}</strong></span>
      <span><small>Status</small><strong>${l(f)}</strong></span>
    </div>
  `}function Ev(){try{return Fv()}catch(e){console.error("Smart Chart render failed:",e);const t=String(a.smartChartToken||a.tradeToken||a.terminalToken||"").trim(),n=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
      <section class="smart-chart-terminal smart-chart-fallback">
        <div class="terminal-title-row">
          <div>
            <h3>Smart Chart</h3>
            <p>Chart recovered safely. Your trade state is safe and the terminal stayed open.</p>
          </div>
          <button type="button" data-tab="terminal">Back to Live Terminal</button>
        </div>
        <div class="smart-chart-search">
          <input data-smart-chart-input value="${l(t)}" placeholder="Paste token CA" autocomplete="off">
          <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
        </div>
        <article class="terminal-panel smart-chart-main">
          <div class="smart-chart-token-header">
            <div class="avatar-fallback">SW</div>
            <div>
              <strong>${l(n)}</strong>
              <small>Recovered chart view</small>
              ${t?`<button type="button" class="ca-copy" data-copy="${l(t)}">${l(n)}</button>`:""}
            </div>
            <div class="compact-link-row smart-chart-links">
              ${t?`<a href="https://dexscreener.com/solana/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Dex</a>`:""}
              ${t?`<a href="https://pump.fun/coin/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              ${t?`<a href="https://solscan.io/token/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Solscan</a>`:""}
            </div>
          </div>
          ${r?`
            <div class="smart-chart-frame smart-chart-fallback-frame" data-chart-frame-loading="Loading live chart..." data-loaded="true">
              <iframe src="${l(r)}" title="SlimeWire recovered live chart" loading="lazy" referrerpolicy="no-referrer"></iframe>
            </div>
          `:R("Paste a token CA","Open a token from Live Terminal or paste a CA above.")}
          <small class="score-breakdown">Fallback chart kept the page alive after a display error. Reopen the CA to refresh the full SlimeWire chart shell.</small>
        </article>
      </section>
    `}}function Fv(){const e=wo(),t=String(e?.tokenMint||"").trim(),n=t?at().find(s=>String(s.tokenMint)===t):null,r=t?ge([e,...Gn().filter(s=>String(s.tokenMint||"")===t)]).filter(Boolean).slice(0,5):ha(Qn(),5,fa("smart-chart-suggest"),1);if(!t)return`
      <section class="smart-chart-terminal">
        <div class="terminal-title-row">
          <div>
            <h3>Smart Chart</h3>
            <p>Paste a token CA or open Chart from any row to load a focused chart workspace.</p>
          </div>
        </div>
        <div class="smart-chart-search">
          <input data-smart-chart-input placeholder="Paste token CA" autocomplete="off">
          <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
        </div>
        <div class="terminal-panel">
          <div class="terminal-title-row">
            <h3>Suggested tokens</h3>
          </div>
          ${vt(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:fa("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;aa("tokenHeaderRendered"),aa("chartSkeletonRendered"),aa("buyPanelReady"),E({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(Xe(t)?.cacheHit||Yn(t)?.pairAddress),stale:!!Xe(t)?.stale,details:t});const o=e.symbol||e.shortMint||w(t);return`
    <section class="smart-chart-terminal smart-chart-clean-terminal">
      <div class="terminal-title-row smart-chart-clean-title">
        <div>
          <h3>${l(o)} Chart</h3>
          <p>DEX chart, live transactions, and wallet trade controls for the selected CA.</p>
        </div>
        <button type="button" data-tab="terminal">Back to Live Terminal</button>
      </div>
      <div class="smart-chart-search smart-chart-clean-search">
        <input data-smart-chart-input value="${l(t)}" placeholder="Paste token CA" autocomplete="off">
        <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
      </div>
      <div class="smart-chart-grid smart-chart-clean-grid">
        <article class="terminal-panel smart-chart-main smart-chart-clean-main">
          <div class="smart-chart-token-header smart-chart-clean-token-header">
            ${ct(e)}
            <div>
              <strong>${l(o)}</strong>
              <small>${l(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${l(t)}">${l(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${To(e)}
            </div>
          </div>
          ${Ov(e,n)}
          ${Il(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${l(o)}</h3>
          ${Iv(e,n)}
        </aside>
      </div>
      ${Nv(t)}
    </section>
  `}let zl="",Yd=0;function Qd(e){e&&(zl===e&&Date.now()-Yd<3e4||(zl=e,Yd=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{a.chartCalls={mint:e,...t},a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function Wv(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[n,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${n} ${r}`}function Nv(e){Qd(e);const t=a.chartCalls?.mint===e?a.chartCalls:null,n=t?.calls||[],r=!!(a.token&&a.user);return`
    <section class="terminal-panel chart-call-board" data-preserve-focus>
      <div class="terminal-title-row">
        <div>
          <h3>Call Board</h3>
          <p>Structured calls only - every post is stamped with the shield score and tracked to its outcome. Winners build reputation.</p>
        </div>
        <span>${t?`${t.total||0} call(s)`:"loading"}</span>
      </div>
      ${r?`
        <div class="call-board-form">
          <select data-call-side>
            <option value="bullish">🟢 Bullish</option>
            <option value="bearish">🔴 Bearish</option>
            <option value="warning">⚠️ Warning</option>
            <option value="question">❓ Question</option>
          </select>
          <select data-call-target>
            <option value="">No target</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
          <input data-call-note type="text" maxlength="140" placeholder="Why? (max 140 chars)">
          <button class="primary" data-call-post="${l(e)}">Post Call</button>
        </div>
        <small data-call-status></small>`:'<p class="trade-status">Log in to post calls - reads are public.</p>'}
      ${n.length?`
        <div class="table-list compact-table">
          ${n.map(o=>`
            <article class="row-card">
              <div class="row-main">
                <strong>${l(Wv(o.side))} <span class="muted-text">by ${l(o.handle)}</span>
                  ${o.reputation?.wins?`<span class="positive">${l(String(o.reputation.wins))}W${o.reputation.hitRatePct!=null?` ${l(String(o.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${o.entryMcUsd?`Entry MC ${l(M(o.entryMcUsd))} | `:""}${o.targetX?`Target ${l(String(o.targetX))}x | `:""}${o.shieldVerdict?`Shield ${l(o.shieldVerdict)} ${l(String(o.shieldScore??""))} | `:""}${l(ve(o.createdAt))}</span>
                ${o.note?`<small>${l(o.note)}</small>`:""}
                ${o.status==="resolved"?`<small class="${o.outcome==="won"?"positive":"negative"}">${o.outcome==="won"?`✅ hit ${l(String(o.peakX))}x`:l(o.outcome)}</small>`:o.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${l(o.mint)}" data-quick-buy-source="call-board">${l(ga())}</button>
                <button data-watch-token="${l(o.mint)}" data-watch-symbol="${l(o.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${l(ta(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${ze(`$${a.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function Dv(e){const t=p("[data-call-status]");try{const n=p("[data-call-side]")?.value||"bullish",r=p("[data-call-target]")?.value||"",o=p("[data-call-note]")?.value||"";v(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:n,targetX:r,note:o,source:"site"})}),v(t,"Call posted - it is now being tracked."),zl="",Qd(e)}catch(n){v(t,W(n?.message||"Could not post call."))}}function _v(e,t=!1){const n=e?.tokenMint?a.positions.find(s=>String(s.tokenMint)===String(e.tokenMint)):null,r=en("trade"),o=en("bundle");return t?`
      <article class="order-ticket terminal-ticket terminal-ticket-collapsed">
        <button type="button" class="terminal-ticket-collapsed-button" data-toggle-terminal-ticket aria-label="Open trade panel">
          <span>Trade</span>
          <strong>â€¹</strong>
        </button>
      </article>
    `:`
    <article class="order-ticket terminal-ticket">
      <div class="terminal-ticket-header">
        <div>
          <span>Trade Panel</span>
          <small>${l(r)}</small>
        </div>
        <button type="button" class="terminal-ticket-toggle" data-toggle-terminal-ticket aria-label="Hide trade panel">â€º</button>
      </div>
        <div class="ticket-collapse-body">
          <p>Trade opens the full chart page. Quick Buy uses a saved preset or asks for a custom SOL amount.</p>
          <div class="segmented-control">
            <button data-tab="trade">Buy / Sell</button>
            <button data-tab="trade">Manual CA</button>
          </div>

          <details class="side-preset-details">
            <summary>
              <span>Active Presets</span>
              <small>${l(o)}</small>
            </summary>
            <label>
              Trade Preset
              <select data-fast-trade-preset="terminal">
                ${nt("trade",a.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${nt("bundle",a.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${It().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${l(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${l(ga())}</button>
              <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
              <button data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
              <button data-use-token-volume="${l(e.tokenMint)}">Volume</button>
              <button data-tab="sniper">Snipe</button>
            </div>
            ${n?`
              <div class="exit-strip">
                <strong>Position held</strong>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
              </div>
            `:""}
          `:R("No token selected","Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${l(Wr())}</small>
        </div>
    </article>
  `}function Uv(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,n])=>`<button data-terminal-subtab="${t}" data-active="${a.terminalSubtab===t}">${n}</button>`).join("")}
      </div>
      ${qv()}
    </section>
  `}function qv(){if(a.terminalSubtab==="orders")return tp();if(a.terminalSubtab==="history")return jl(12);if(a.terminalSubtab==="wallets")return dd();if(a.terminalSubtab==="kol"){const e=kd(a.kolScan?.rows||[]).filter(t=>!Jn(t));return vt(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:fa("bottom-kol"),stickyCount:1})}return a.terminalSubtab==="sniper"?a.scan?st(a.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):R("No sniper scan loaded","Open Sniper or refresh a scan mode."):a.terminalSubtab==="tx"?np(!0):a.terminalSubtab==="reconcile"?ap():Hv(6)}function Hv(e=25){const t=at();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(ep).join("")}
    </div>
  `:R("No open positions","Open token holdings will show here after refresh.")}const Zd=new Map;function Kv(e){const t=String(e.tokenMint||"");if(!t)return"";const n=(a.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=Xn().find(d=>String(d?.tokenMint||"")===t),o=(Array.isArray(a.tradePlans)?a.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),s=[];n?.spentSol&&s.push(`Entry ${n.spentSol} SOL`),r?.marketCapLabel&&s.push(`MC ${r.marketCapLabel}`),s.push(o?`TP ${o.takeProfitSummary||o.takeProfitPct||"off"} / SL ${o.stopLossSummary||o.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let i="";if(Number.isFinite(c)){const d=Zd.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const m=c-d.value;i=`${m>0?"▲ +":"▼ "}${m.toFixed(4)} SOL since last refresh`}Zd.set(t,{value:c,at:Date.now()})}let u="";if(o){const d=Number(o.lastMovePct??o.wallets?.[0]?.lastMovePct),m=Number(o.takeProfitPct),f=Number(o.stopLossPct),y=Date.parse(o.sellAfterAt||o.wallets?.[0]?.sellAfterAt||""),b=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(m)&&m>0&&d>=m*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${m}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:b!==null&&b>0&&b<=10?u=`Timer exit in ~${b} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else zg(t)||e.source==="launch-optimistic"?u="⏳ Exits arming from your launch - TP/SL/timer registering...":u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${l(s.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${l(u)}</small>`:""}
    ${i?`<small class="${i.startsWith("▲")?"positive":"negative"}">${l(i)}</small>`:""}
  `}function ep(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",n=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),o=!!(e.viewOnly||e.source==="connected-wallet"),s=t?`${e.estimatedValueSol} SOL`:r?"updating":o?"tracking":"Price unavailable",c=n?e.openPnlSol:r?"updating":o?"realized only":"Price unavailable",i=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:o&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${ct(e)}
      <div class="row-main">
        <strong>${l(e.symbol||e.shortMint)}</strong>
        <span>${l(e.uiAmount)} tokens across ${l(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${l(e.name)}</small>`:""}
        <small>Value: ${l(s)} | PnL: ${l(c)}</small>
        ${Kv(e)}
        ${i?`<small class="${r?"muted-text":"warning-text"}">${l(i)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${l(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${l(e.tokenMint)}">Custom %</button>
        ${ze(Nh(e))}
        <a href="${l(e.dexUrl||J(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function jl(e=10,t=null){const n=Array.isArray(t)?t:a.pnl?.trades||[];return n.length?`
    <div class="live-trade-list">
      ${n.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${l(String(r.type||"").toUpperCase())} ${l(r.shortMint||w(r.tokenMint))}</strong>
          <span>${l(r.walletLabel||"wallet")} | ${l(r.solAmount||"0")} SOL</span>
          <small>${l(ve(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${l(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="live-trades">${l(ga())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:R("No live trade history yet","Submitted web trades will appear here after refresh.")}function Vv(){const e=a.pnl?.trades||[],t=tt("liveTrades",e);return`
    <section class="terminal-layout live-trades-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Live Trades</h3>
            <p>Recent web trade activity, fast token preview, and active preset buys stay connected to the terminal.</p>
          </div>
          <span>${t.length}/${e.length} trades shown</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-top-refresh-wallet>Refresh Trades</button>
          <button data-tab="terminal">Command Center</button>
          <button data-tab="pnl">PnL</button>
        </div>
        ${jl(t.length||_a("liveTrades"),t)}
        ${sa("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${_v(pd())}
      </aside>
    </section>
  `}function tp(){const e=Array.isArray(a.tradePlans)?a.tradePlans:[],t=[a.tradePlanResult,a.bundleResult,a.volumeResult,a.sniperResult,a.kolResult,a.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),n=e.length?e:t;return n.length?`
    <div class="table-list compact-table">
      ${n.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${l(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${l(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${l(r.status||"watching")} | Active wallets: ${l(r.activeWallets??"?")}/${l(r.walletCount??"?")} | TP ${l(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${l(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${l(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${l(ve(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${l(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(zv).join("")}</div>`:""}
          </div>
          <div class="card-actions compact">
            <button data-top-refresh-wallet>Refresh Status</button>
            <button data-run-trade-plans>${a.walletRefreshing?"Checking...":"Run TP/SL Check"}</button>
            <button data-tab="positions">Positions</button>
            ${r.tokenMint?`<button data-copy="${l(r.tokenMint)}">Copy CA</button>`:""}
            ${r.dexUrl?`<a class="button-like" href="${l(r.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:R("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function zv(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",n=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,o=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",s=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Rn(qa(e.retryAfterAt))}`:"",i=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",m=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${l(e.label||"Wallet")}</strong>
        <span>${l(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${l(n)}${e.triggerKind?` / ${l(e.triggerKind)}`:""}</span>
        <small>Move ${l(o)}${l(s)} | checked ${l(Rn(qa(t)))}${l(c)}</small>
        <small>${l(u)} | ${l(d)} | ${l(m)} | Source: ${l(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${l(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${l(e.sellSignature)}</small>`:""}
        ${i?`<small class="warning-text">Error: ${l(i)}</small>`:""}
      </div>
    </div>
  `}function ap(){const e=a.balances.filter(n=>n.error),t=a.balances.reduce((n,r)=>n+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${l(Rn(qa(a.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(n=>`<article class="row-card"><strong>${l(n.label||`Wallet ${n.index}`)}</strong><span>${l(n.error)}</span></article>`).join("")}
      </div>
    `:R("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function np(e=!1){const t=a.terminalTxAudit;return`
    <section class="${e?"tx-audit compact":"terminal-layout tx-audit"}">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Tx Audit</h3>
            <p>Paste a Solana transaction signature to see finalized status, SOL/token deltas, created token accounts, programs, logs, and whether balances should refresh.</p>
          </div>
          <span>${a.terminalTxLoading?"Fetching":"Ready"}</span>
        </div>
        <div class="inline-action">
          <input data-tx-audit-signature type="text" placeholder="Solana transaction signature" value="${l(a.terminalTxSignature||"")}">
          <button class="primary" data-run-tx-audit>${a.terminalTxLoading?"Auditing...":"Audit Tx"}</button>
        </div>
        ${t?jv(t):R("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${tp()}${ap()}</aside>`}
    </section>
  `}function jv(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${l(e.error)}</span></article>`:`
    <section class="pnl-summary tx-summary">
      <div><span>Status</span><strong>${l(e.status||"unknown")}</strong></div>
      <div><span>Fee</span><strong>${l(e.feeSol||"0")} SOL</strong></div>
      <div><span>Slot</span><strong>${l(e.slot||"n/a")}</strong></div>
      <div><span>Refresh</span><strong>${e.shouldRefreshBalances?"Yes":"No"}</strong></div>
    </section>
    <div class="table-list compact-table">
      <article class="row-card"><strong>Fee payer</strong><code>${l(e.feePayer||"unknown")}</code></article>
      <article class="row-card"><strong>SOL deltas</strong><span>${(e.solDeltas||[]).map(t=>`${w(t.account)} ${t.deltaSol}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Token deltas</strong><span>${(e.tokenDeltas||[]).map(t=>`${w(t.owner||t.account)} ${t.deltaUiAmount} ${w(t.mint)}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Created token accounts</strong><span>${(e.createdAssociatedTokenAccounts||[]).map(t=>w(t.account)).join(", ")||"none detected"}</span></article>
      <article class="row-card"><strong>Programs</strong><span>${(e.programs||[]).join(", ")||"n/a"}</span></article>
      ${e.explorerUrl?`<article class="row-card"><strong>Explorer</strong><a href="${l(e.explorerUrl)}" target="_blank" rel="noreferrer">Open Solscan</a></article>`:""}
    </div>
    <details class="raw-log-panel">
      <summary>Raw logs</summary>
      <pre>${l((e.logs||[]).join(`
`)||"No logs returned.")}</pre>
    </details>
  `}function Gv(e=[]){const t=[...e].sort((n,r)=>Number(r.bestPickScore||r.score||0)-Number(n.bestPickScore||n.score||0)||Ye(n,r));return ha(t,5,fa("cooks-best"),1)}function $e(e){const t=Number(e);return Number.isFinite(t)?t:0}function rp(){const e=a.liveFeedCategory||"best";return ks.find(([t])=>t===e)||ks[0]}function wa(e={}){return Do(e)||dp(e)||Ql(e)||0}function Gl(e={}){return $e(e.buys5m)+$e(e.buysH1)+$e(e.sells5m)+$e(e.sellsH1)}function op(e={}){const t=$e(e.buys5m)+$e(e.buysH1),n=$e(e.sells5m)+$e(e.sellsH1),r=t+n;return r>0?t/r:.5}function or(e={}){return Math.max($e(e.m5),$e(e.h1),$e(e.h24))}function Fo(e={}){return Math.max($e(e.m5),$e(e.h1))}function _t(e={}){return Fo(e)*Math.log10(10+wa(e))*(.5+op(e))}function Xl(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function Xv(e=[],t="best"){const n=[...e];switch(t){case"volume":return n.sort((r,o)=>wa(o)-wa(r));case"liquidity":return n.sort((r,o)=>it(o)-it(r));case"marketcap":return n.sort((r,o)=>lt(o)-lt(r));case"active":return n.sort((r,o)=>Gl(o)-Gl(r));case"fresh":return n.sort(Ye);case"gainers":return n.sort((r,o)=>or(o)-or(r));default:return n.sort((r,o)=>$e(o.bestPickScore||o.score)-$e(r.bestPickScore||r.score)||Ye(r,o))}}function Jv(){const e=a.liveTerminalCategory||"dexTrending";return Oa.find(([t])=>t===e)||Oa[0]}function Yv(e,t,n,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${l(r)}</span>
      <select ${n} aria-label="${l(r)} category">
        ${e.map(([o,s])=>`<option value="${o}"${o===t?" selected":""}>${l(s)}</option>`).join("")}
      </select>
    </label>`}function Qv(){if(a.activeTab==="terminal"){const t=Jv();return{categories:Oa,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:n=>ip(n,t[0]),hasBest:!1}}const e=rp();return{categories:ks,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>Xv(t,e[0]),hasBest:e[0]==="best"}}function Zv(e={}){if(Xl(e))return{cls:"boost",text:"⚡ Boosted"};const t=or(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const n=Number(e.pairAgeMinutes);return Number.isFinite(n)&&n>=0&&n<=10?{cls:"fresh",text:"✨ Fresh"}:Fo(e)>=25?{cls:"hot",text:"🔥 Hot"}:op(e)>=.7&&Gl(e)>=24?{cls:"active",text:"● Active"}:null}function Jl(e={}){const t=Zv(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${l(t.text)}</span>`:""}function sp(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function ew(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return sp(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function lp(){const e=a.cookSpotCategory||"dexTrending";return Oa.find(([t])=>t===e)||Oa[0]}function ip(e=[],t="dexTrending"){const n=[...e];switch(t){case"fresh":return n.sort(Ye);case"dexBoosted":{const r=n.filter(Xl).sort((s,c)=>wa(c)-wa(s)),o=n.filter(s=>!Xl(s)).sort((s,c)=>_t(c)-_t(s));return[...r,...o]}case"pumpTrending":{const r=n.filter(sp);return(r.length?r:n).sort((o,s)=>_t(s)-_t(o))}case"memeMovers":{const r=n.filter(ew);return(r.length?r:n).sort((o,s)=>or(s)-or(o))}case"earlyMomentum":{const r=n.filter(o=>{const s=Number(o.pairAgeMinutes);return!Number.isFinite(s)||s<=180});return(r.length?r:n).sort((o,s)=>Fo(s)-Fo(o))}case"graduating":{const r=n.filter(o=>xo(o)||Mo(o)==="graduating");return(r.length?r:n).sort((o,s)=>_t(s)-_t(o))}case"graduated":{const r=n.filter(o=>rn(o)||Mo(o)==="graduated");return(r.length?r:n).sort((o,s)=>wa(s)-wa(o))}default:return n.sort((r,o)=>_t(o)-_t(r))}}function tw(e=lp()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${Oa.map(([n,r])=>`<option value="${n}"${n===t?" selected":""}>${l(r)}</option>`).join("")}
      </select>
    </label>`}function cp(e=0,t=""){const n=qa(t),r=n===null?"live":Rn(n);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${l(r)}</span></div>`}function Yl(e=[]){const t=Qv(),n=Yv(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',o=cp(e.length,la()),s={context:"live",shareBuilder:Sa,hideToolbar:!0};if(t.hasBest){const i=Gv(e),u=new Set(i.map(ma).filter(Boolean)),d=[...e].sort(Ye).filter(f=>!u.has(ma(f))),m=tt("live",d);return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${n}<span>Top ${i.length} · rotating each refresh</span>${r}</div>
        ${i.length?st(i,s):R("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${m.length?st(m,s):R("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=tt("live",t.rank(e));return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${n}<span>${l(t.sub)}</span>${r}</div>
        ${c.length?st(c,s):R("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function up(){const e=We(),t=ge(e?.rows||[]),n=an(t),r=tt("live",n),o=Lt.find(([f])=>f===a.livePairBucket)?.[1]||"Live",s=la(),c=!!a.livePairsLoadingByBucket[a.livePairBucket],i=tn(),u=a.livePairsRefreshErrorByBucket?.[a.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",m=n.length?Yl(n):i?tr(t,`${o.toLowerCase()} pairs`):u?R("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?R("Loading live pairs…","Scanning fresh pairs for this time window."):R("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Lt.map(([f,y])=>{const b=a.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(b))?` (${b})`:"";return`<button data-live-pair-bucket="${f}" data-active="${a.livePairBucket===f}">${y}${S}</button>`}).join("")}
        </div>
        ${Nl("live",{rawCount:t.length,visibleCount:n.length})}
        ${Wl(t,n)}
        ${ul("live")}
        ${m}
        ${sa("live",n,`${o} pairs`)}
      </main>
    </section>
  `}function JS(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function aw(){if(!a.user||!a.token)return`${Ka()}${R("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=a.watchlist?.rows||[],t=tt("watchlist",e);return`
    <section class="terminal-layout watchlist-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Watchlist</h3>
            <p>Saved coins refresh while this tab is open. Use Trade for the chart page or Quick Buy for fast preset/custom buys.</p>
          </div>
          <span>${t.length}/${e.length} watched</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-watchlist>${a.watchlistLoading?"Refreshing...":"Refresh Watchlist"}</button>
          <button data-tab="live">Cooks</button>
          <button data-tab="sniper">Sniper</button>
          <button data-tab="kol">KOL Tracker</button>
        </div>
        ${t.length?st(t,{context:"watchlist",shareBuilder:n=>rl(n.tokenMint)}):R("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
        ${sa("watchlist",e,"watched pairs")}
      </main>
      <aside class="trade-side order-ticket-stack">
        <article class="order-ticket">
          <h3>Fast Actions</h3>
          <p>Quick Buy uses your saved preset when available, or asks for a custom SOL amount.</p>
          <div class="card-actions action-grid">
            <button data-tab="trade">Trade Presets</button>
            <button data-tab="bundle">Bundle Presets</button>
          </div>
        </article>
      </aside>
    </section>
  `}function YS(e){return st(e,{context:"live",shareBuilder:Sa})}function st(e,t={}){const n=t.shareBuilder||Sa,r=ge(e),o=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":ul(t.context||"scanner")}
    <div class="${l(o)}">
      <div class="signal-header">
        <span>Pair Info</span>
        <span>Age</span>
        <span>Current Liquidity</span>
        <span>FDV / MC</span>
        <span>Txns</span>
        <span>Volume</span>
        <span>Action</span>
      </div>
      ${r.map((s,c)=>nw(s,c,{...t,shareText:n(s),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":ul(t.context||"scanner")}
      ${R(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function nw(e,t,n={}){const r=Wo(e.tokenMint),o=n.shareText||Sa(e),s=n.primaryActionLabel||"Trade",c=n.primaryAction||"quickTrade",i=n.context==="kol",u=n.context==="watchlist"?`<button type="button" data-unwatch-token="${l(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(No(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-row")}">
      <div class="signal-token">
        ${ct(e,{priority:!!n.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-title")}">${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${l(e.name||e.category||"Token")}</small>
            ${i?"":Jl(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${l(e.dexUrl||J(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${l(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${l(o)}" title="Share to X">SHARE</button>
            ${su(o,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(e.sniperCount)}</span>`:""}
          </div>
          ${tv(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${l(e.pairAgeLabel||Ut(e)||"age unknown")}</span><small>${l(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${l(F(e.liquidityLabel,it(e)>0?M(it(e)):"","checking"))}</span><small>${rw(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${l(F(e.marketCapLabel,lt(e)>0?M(lt(e)):"","checking"))}</span><small>${l(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${l(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${l(Qy(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${l(F(e.volumeH1Label,e.volumeLabel,Do(e)>0?M(Do(e)):"","checking"))}</span>
        <small>${Ad(e).map(([d,m])=>`${d} ${m}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${l(e.tokenMint)}" title="Snipe buy">${l(s)}</button>`:`<button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(n.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(n.context||"signal-row")}" title="Quick buy with preset or custom SOL">${l(ga())}</button>`}
        <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${i?Fu(e):""}
        ${u}
        ${Pd(e)}
      </div>
    </article>
  `}function Wo(e){const t=String(e||"");return!!(a.watchlist?.rows||[]).some(n=>String(n.tokenMint)===t)}function Ut(e){const t=Lo(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function rw(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const n=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${n}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function No(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{},s=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,n.imageUrl,n.image,n.logoURI,n.logo,n.iconUrl,n.info?.imageUrl,n.baseToken?.imageUrl,n.baseToken?.logoURI,o.imageUrl,o.image,o.logoURI,o.logo,s.imageUrl,s.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const i of c){const u=gt(i);if(u)return u}return""}function lt(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{};return I(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,n.marketCap,n.marketCapUsd,n.market_cap,n.fdv,n.fdvUsd,n.baseToken?.marketCap,n.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,o.marketCap,o.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function it(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.liquidity||{};return I(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,o.usd,o.quote,n.liquidityUsd,n.liquidity_usd,n.liquidity?.usd,n.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function Ql(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,o.m15,o.m15m,o.m5,o.h1,n.volume?.m15,n.volume?.m5,n.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Do(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,o.h1,o.m30,o.m15,n.volume?.h1,n.volume?.m30,n.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function dp(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH24,e.volume24h,e.volume_h24,o.h24,o.d1,n.volume?.h24,n.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function ct(e,t={}){const n=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=No(e),o=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),s=`token:${String(o||e.symbol||n).trim().toLowerCase()}`,c=N("tokenAvatarFixEnabled",!0),i=String(e.avatarState||"").trim().toLowerCase(),u=!!e.avatarUrl&&(!i||i==="ready"),d=u&&o?gt(jh(e)):"",m=c?sl(s,u?e.avatarUrl:"",d,i?"":r):sl(s,d,r),f=c&&u?d&&m!==d?d:r&&e.avatarUrl&&r!==e.avatarUrl?r:"":"",y=!!t.priority,b=y?"eager":"lazy",S=y?"high":"low",P=i||(m?"ready":"missing");if(m){const T=f?` data-backup-src="${l(f)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${l(P)}"><img src="${l(m)}"${T} data-avatar-src="${l(m)}" data-avatar-key="${l(s)}" alt="${l(e.symbol||e.name||"Token")}" loading="${b}" decoding="sync" fetchpriority="${S}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${l(n)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${l(P)}"><span>${l(n)}</span></div>`}function ow(e=""){const t=String(e||"");let n=0;for(let r=0;r<t.length;r+=1)n+=t.charCodeAt(r);return n%5+1}function Zl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${ow(e)}.png`}function Sa(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Ut(e)||"age unknown"}.`}function sw(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([n])=>n===a.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${l(lw(a.scanMode))}</p>
          </div>
          <span>${l(t)}</span>
        </div>
        <div class="mode-row terminal-modes">
          ${e.map(([n,r])=>`<button data-scan-mode="${n}" data-active="${a.scanMode===n}">${r}</button>`).join("")}
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-scan>Refresh ${l(t)}</button>
          <button data-tab="trade">Trade Desk</button>
          <button data-tab="bundle">Bundle</button>
          <button data-tab="live">Cooks</button>
        </div>
        ${a.scan?uw():R("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${iw()}
      </aside>
    </section>
  `}function lw(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function iw(){if(!a.wallets.length)return R("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=a.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${bt("sniper")}
        </div>
        ${Ft("sniper")}
      `},{key:"buy",label:"Buy & Exits",hint:"Amount, TP/SL",html:`
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-sniper-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-sniper-tp data-custom-select="sniper-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" ${e?"":"selected"}>+25%</option>
              <option value="40" ${e?"selected":""}>+40%</option>
              <option value="50">+50%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-sniper-tp-custom data-custom-for="sniper-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-sniper-sl data-custom-select="sniper-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-sniper-sl-custom data-custom-for="sniper-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            ${je("sniper-delay","data-sniper-delay",e?"3":"5")}
          </label>
        </div>
      `},{key:"repeat",label:"Repeat & Slip",hint:"Cycles, slippage",html:`
        <div class="volume-grid">
          <label>
            Repeat
            <select data-sniper-loop data-custom-select="sniper-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-sniper-loop-custom data-custom-for="sniper-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${Hr("sniper-loop-delay","data-sniper-loop-delay","0")}
          </label>
          <label>
            Slippage
            <select data-sniper-slippage data-custom-select="sniper-slippage">
              <option value="300" ${e?"selected":""}>3%</option>
              <option value="400" ${e?"":"selected"}>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-sniper-slippage-custom data-custom-for="sniper-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:Vr("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${ja({toolKey:"sniperSetup",activeKey:Ga("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${a.sniperResult?l(a.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${cw()}
    </section>
  `}function cw(){const e=a.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function uw(){const e=a.scan.rows||[],t=tt("sniper",e);return e.length?`
    <p class="scan-meta">${l(a.scan.label)} | ${t.length}/${e.length} shown | scored ${a.scan.scanned} | qualified ${a.scan.qualified} | mode-fit ${a.scan.modeFit} | display pool ${a.scan.displayPool||0}</p>
    ${st(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Dh})}
    ${sa("sniper",e,"snipe candidates")}
  `:R("No usable picks","Refresh again or choose a different mode.")}function _o(){return a.user?.connectedWallet?.publicKey||""}function pp(){return a.ogreTek.markets.find(e=>e.symbol===a.ogreTek.selectedMarket)||a.ogreTek.markets[0]||null}function dw(){return{marketSymbol:a.ogreTek.selectedMarket,direction:a.ogreTek.direction,orderType:a.ogreTek.orderType,collateralUsd:a.ogreTek.collateralUsd,leverage:a.ogreTek.leverage,slippagePct:a.ogreTek.slippagePct,priorityFeeLamports:a.ogreTek.priorityFeeLamports,limitPrice:a.ogreTek.limitPrice,stopPrice:a.ogreTek.stopPrice}}function mp(){return jp(dw(),pp(),a.ogreTek.account,Se)}function ye(e,t=2){const n=Number(e);return Number.isFinite(n)?Math.abs(n)>=1e9?`$${(n/1e9).toFixed(2)}B`:Math.abs(n)>=1e6?`$${(n/1e6).toFixed(2)}M`:Math.abs(n)>=1e3?`$${(n/1e3).toFixed(1)}K`:`$${n.toFixed(t)}`:"n/a"}function ut(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function Uo(e,t=3){const n=Number(e);return Number.isFinite(n)?`${n>=0?"+":""}${n.toFixed(t)}%`:"n/a"}function fp(e){const t=Date.parse(e||"");if(!t)return"not loaded";const n=Math.max(0,Math.round((Date.now()-t)/1e3));return n<60?`${n}s ago`:`${Math.round(n/60)}m ago`}function qo(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in a.ogreTek)||(e.type==="checkbox"?a.ogreTek[t]=!!e.checked:a.ogreTek[t]=e.value)})}async function pw(){!Se.enabled||a.ogreTek.loading||a.ogreTek.markets.length||a.ogreTek.error||await sr({silent:!0}).catch(e=>{a.ogreTek.error=W(e.message),h({force:!0})})}async function sr({force:e=!1,silent:t=!1}={}){if(Se.enabled&&!(a.ogreTek.loading&&!e)){a.ogreTek.loading=!0,a.ogreTek.error="",t||h({force:!0});try{const n=_o(),[r,o,s,c]=await Promise.all([cr.getMarkets(),cr.getAccount(n),cr.getPositions(n),cr.getOpenOrders(n)]);a.ogreTek.markets=r||[],a.ogreTek.account=o||null,a.ogreTek.positions=s||[],a.ogreTek.orders=c||[],a.ogreTek.markets.some(i=>i.symbol===a.ogreTek.selectedMarket)||(a.ogreTek.selectedMarket=a.ogreTek.markets[0]?.symbol||"SOL-PERP"),a.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(n){a.ogreTek.error=W(n.message)}finally{a.ogreTek.loading=!1,h({force:!0})}}}function mw(){return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header ogre-tek-coming-soon">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Perp Mode is staged but hidden</h2>
          <p>Turn on the Ogre Tek feature flag when you are ready to test the perps terminal. Existing trade, bundle, volume, and sniper tools stay untouched.</p>
        </div>
        <span class="slime-status-badge">Coming Soon</span>
      </article>
    </section>
  `}function fw(){if(Kp(Se)!=="enabled")return mw();const e=!!_o(),t=pp(),n=mp(),r=n.quote,o=a.ogreTek.account,s=n.ok&&!a.ogreTek.loading,c=a.ogreTek.error?"Provider Error":a.ogreTek.loading?"Loading":"Ready",i=Se.demoMode?"Review Demo Trade":"Review Trade",u=Se.demoMode?"Confirm Demo Review":"Confirm Order",d=Se.demoMode?!a.ogreTek.riskAccepted||!n.ok:!qp({validation:n,riskAccepted:a.ogreTek.riskAccepted,demoMode:Se.demoMode});return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${Se.demoMode?"Demo Mode":"Live Adapter"}</span>
          <span class="slime-status-badge" data-ok="${e?"true":"false"}">${e?"Wallet Connected":"Wallet Disconnected"}</span>
          <span class="slime-status-badge" data-ok="${a.ogreTek.error?"false":"true"}">${l(c)}</span>
        </div>
      </article>

      <article class="ogre-risk-copy">
        Perpetual futures are leveraged derivatives. You can lose your collateral and may be liquidated. This interface does not provide financial advice.
      </article>

      ${a.ogreTek.error?`<p class="error dashboard-error">${l(a.ogreTek.error)}</p>`:""}

      <section class="ogre-tek-grid">
        <div class="ogre-tek-main">
          <article class="slime-panel ogre-market-panel">
            <div class="panel-title-row">
              <div>
                <h3>Perps Markets</h3>
                <p>${l(a.ogreTek.status||"Demo market data loads when the tab opens.")}</p>
              </div>
              <button type="button" data-ogre-tek-refresh>${a.ogreTek.loading?"Refreshing...":"Refresh"}</button>
            </div>
            ${hw()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${a.ogreTek.positions.length} open</span>
            </div>
            ${bw()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${yw()}
          </article>
        </div>

        <aside class="ogre-tek-side">
          <article class="slime-panel ogre-ticket">
            <h3>Trading Ticket</h3>
            <div class="ogre-ticket-tabs">
              <button type="button" data-ogre-tek-side="long" data-active="${a.ogreTek.direction==="long"}">Long</button>
              <button type="button" data-ogre-tek-side="short" data-active="${a.ogreTek.direction==="short"}">Short</button>
            </div>
            <label>
              Market
              <select data-ogre-tek-field="selectedMarket">
                ${a.ogreTek.markets.map(m=>`<option value="${l(m.symbol)}" ${m.symbol===a.ogreTek.selectedMarket?"selected":""}>${l(m.symbol)}</option>`).join("")}
              </select>
            </label>
            <label>
              Order Type
              <select data-ogre-tek-field="orderType">
                ${["market","limit","stop","take-profit","stop-loss"].map(m=>`<option value="${m}" ${a.ogreTek.orderType===m?"selected":""}>${l(m.replace("-"," ").toUpperCase())}</option>`).join("")}
              </select>
            </label>
            <div class="ogre-ticket-grid">
              <label>
                Collateral USD
                <input data-ogre-tek-field="collateralUsd" type="number" min="0" step="1" value="${l(a.ogreTek.collateralUsd)}">
              </label>
              <label>
                Leverage
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${l(Se.maxLeverage)}" step="0.5" value="${l(a.ogreTek.leverage)}">
                <span>${l(a.ogreTek.leverage)}x max ${l(Se.maxLeverage)}x</span>
              </label>
              <label>
                Limit Price
                <input data-ogre-tek-field="limitPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${l(a.ogreTek.limitPrice)}">
              </label>
              <label>
                Stop / Trigger
                <input data-ogre-tek-field="stopPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${l(a.ogreTek.stopPrice)}">
              </label>
              <label>
                Slippage %
                <input data-ogre-tek-field="slippagePct" type="number" min="0" max="10" step="0.1" value="${l(a.ogreTek.slippagePct)}">
              </label>
              <label>
                Priority Fee
                <input data-ogre-tek-field="priorityFeeLamports" type="number" min="0" step="1000" value="${l(a.ogreTek.priorityFeeLamports)}">
              </label>
            </div>
            ${gw(r,t)}
            ${hp(n)}
            <button class="primary" type="button" data-ogre-tek-review ${s?"":"disabled"}>${l(i)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${vw(o)}
          </article>
        </aside>
      </section>
      ${a.ogreTek.reviewOpen?ww({validation:n,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function hw(){return a.ogreTek.loading&&!a.ogreTek.markets.length?R("Loading markets","Ogre Tek is loading demo perps markets."):a.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${a.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${l(e.symbol)}" data-active="${e.symbol===a.ogreTek.selectedMarket}">
          <span>${l(e.symbol)}</span>
          <strong>${ut(e.indexPrice)}</strong>
          <small>Oracle ${ut(e.oraclePrice)} | 24h ${Uo(e.change24hPct,2)}</small>
          <small>Funding ${Uo(e.fundingRatePct,3)} | OI ${ye(e.openInterestUsd,0)}</small>
          <small>Fresh ${l(fp(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:R("No markets available","No allowed perps markets are available for this provider.")}function gw(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${ut(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${ye(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${ut(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${ye(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${ye(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${ye(e?.maxLossUsd)}</strong></span>
    </div>
  `}function hp(e){const t=e.errors||[],n=e.warnings||[];return!t.length&&!n.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${l(r)}</p>`).join("")}
      ${n.map(r=>`<p data-kind="warning">${l(r)}</p>`).join("")}
    </div>
  `}function bw(){return _o()?a.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${a.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.side)} | margin ${Uo(e.marginRatioPct,1)}</small></span>
          <span>${ye(e.sizeUsd)}<small>collateral ${ye(e.collateralUsd)}</small></span>
          <span>${ut(e.entryPrice)}<small>mark ${ut(e.markPrice)}</small></span>
          <span>${ut(e.liquidationPrice)}</span>
          <span data-positive="${Number(e.unrealizedPnlUsd)>=0}">${ye(e.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `:R("No open positions","Mock positions will appear here when the provider reports them."):R("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function yw(){return _o()?a.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${a.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.type)} ${l(e.side)}</small></span>
          <span>${ut(e.triggerPrice)}</span>
          <span>${ye(e.sizeUsd)}</span>
          <span>${l(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:R("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):R("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function vw(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${ye(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${ye(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${ye(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${l(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${ye(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${l(e.maxLeverageAllowed||Se.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${l(fp(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function ww({validation:e,quote:t,market:n,confirmButtonText:r,confirmDisabled:o}){const s=e.order||{};return`
    <div class="ogre-tek-modal-backdrop" role="presentation">
      <article class="ogre-tek-modal" role="dialog" aria-modal="true" aria-label="Ogre Tek risk confirmation">
        <div class="panel-title-row">
          <div>
            <h3>Risk Confirmation</h3>
            <p>Review every estimate before any wallet signature.</p>
          </div>
          <button type="button" data-ogre-tek-close-review>Close</button>
        </div>
        <div class="ogre-review-grid">
          <span><small>Direction</small><strong>${l(s.direction||"long")}</strong></span>
          <span><small>Market</small><strong>${l(s.marketSymbol||n?.symbol||"n/a")}</strong></span>
          <span><small>Collateral</small><strong>${ye(s.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${l(s.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${ut(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${ut(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${ye(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${Uo(n?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${ye(t?.maxLossUsd)}</strong></span>
        </div>
        ${hp(e)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${a.ogreTek.riskAccepted?"checked":""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${o?"disabled":""}>${l(r)}</button>
        </div>
      </article>
    </div>
  `}function gp(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const ei="slimewire:ogreAgentMessages:v1",ti="slimewire:ogreAgentLastToken:v1";function Sw(){try{const e=JSON.parse(localStorage.getItem(ei)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function kw(){try{localStorage.setItem(ei,JSON.stringify(sn().slice(-50)))}catch{}}function qt(){if(a.ogreAgentLastTokenMint)return String(a.ogreAgentLastTokenMint);try{a.ogreAgentLastTokenMint=String(localStorage.getItem(ti)||"").trim()}catch{a.ogreAgentLastTokenMint=""}return a.ogreAgentLastTokenMint||""}function Ho(e=""){const t=String(e||"").trim();if(!t)return"";a.ogreAgentLastTokenMint=t;try{localStorage.setItem(ti,t)}catch{}return t}function sn(){if(!Array.isArray(a.ogreAgentMessages)||!a.ogreAgentMessages.length){const e=Sw();a.ogreAgentMessages=e.length?e:[gp()]}return a.ogreAgentMessages}function $w(){const e=String(a.smartChartToken||a.tradeToken||qt()||"").trim(),t=e?ba(e):null,n=t?.tokenMint?Je(t):null,r=e?zd(e):null,o=e?ql(e):null,s=Zr().slice(0,3),c=e?at().find(i=>String(i.tokenMint||"")===e):null;return{route:a.route,activeTab:a.activeTab,agentFastMode:a.ogreAgentFastMode,agentAutoTradeApproved:jo(),lastTokenMint:qt(),recentAgentMessages:sn().slice(-8).map(i=>({role:i.role==="user"?"user":"assistant",text:String(i.text||"").slice(0,600)})),smartChartToken:a.smartChartToken||"",tradeToken:a.tradeToken||"",livePairBucket:a.livePairBucket||"",slimeScopeMode:a.slimeScopeMode||"",walletConnected:!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey),walletCount:Ks(),positionCount:at().length,totalSol:It().toFixed(4),selectedTradePreset:en("trade"),selectedBundlePreset:en("bundle"),quickBuyAmount:String(oi()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:Wo(e)}:null,slimeShield:n?{verdict:n.verdict,summary:n.summary,confidence:n.confidence,suggestedAction:n.suggestedAction,topFactors:(n.factors||[]).slice(0,4).map(i=>i.message||i.label||i.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:s.length?s.map(i=>({displayName:i.displayName,riskLabel:i.riskLabel,dumpRiskPercent:i.lowData?null:i.dumpRiskPercent,lowData:!!i.lowData,summary:Hn(i)})):[],replayBeforeBuy:o?{sampleSize:o.sampleSize,confidence:o.confidence,winRatePercent:o.winRatePercent,medianMaxDrawdownPercent:o.medianMaxDrawdownPercent,summary:o.summary}:null,pnlSummary:{realized:Lc(),positions:at().length,totalSol:It().toFixed(4)},profile:{hasReferralCode:!!a.user?.referralCode,referralCode:a.user?.referralCode||"",hasReferralPayoutWallet:!!a.user?.referralPayoutWallet,hasXHandle:!!(a.xHandle||a.user?.xHandle),traderBoardEnabled:a.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:bp()}}function bp(){const e=[],t=new Set,n=(r,o="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(i=>n(i,o));return}if(Array.isArray(r.rows)){r.rows.forEach(i=>n(i,o));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(i=>n(i,o));return}if(typeof r!="object")return;const s=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!s)return;const c=s.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:s,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:o}))};return n(a.livePairRows,"live-pairs"),n(a.slimeScopeRows,"slime-scope"),n(a.livePairs,"live-pairs"),Object.values(a.livePairsByBucket||{}).forEach(r=>n(r,"bucket")),Object.values(a.terminalFeeds||{}).forEach(r=>n(r,"terminal-feed")),e.sort((r,o)=>yp(o)-yp(r)).slice(0,24)}function yp(e={}){const t=T=>Number.isFinite(Number(T))?Number(T):0,n=t(e.ageMinutes),r=t(e.marketCap),o=t(e.liquidityUsd),s=t(e.volume5m),c=t(e.volume1h),i=Math.max(s,c*.18),u=n>0?Math.max(0,90-Math.min(n,360))/2.5:12,d=n>120?Math.min(42,(n-120)/4):0,m=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?i/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:i>0?2:-18,b=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+m+y+Math.log10(1+s+c)*7+Math.log10(1+o)*3+b+S-P-d}function Tw(e={}){return String(e.label||e.type||"Run").slice(0,40)}function Pw(e={},t=0){const n=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${l(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${l(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${n.length?`<div class="ogre-agent-actions">${n.map((o,s)=>`<button type="button" data-ogre-agent-action="${t}:${s}">${l(Tw(o))}</button>`).join("")}</div>`:""}
    </div>
  `}function Aw(){const e=!!(a.ogreAgentLoading||a.ogreAgentSpeaking),t=!!a.ogreAgentListening,n=!!a.ogreAgentVoiceEnabled;return`
    <div class="ogre-agent-holo ${e?"is-talking":""} ${t?"is-listening":""} ${n?"voice-on":"voice-off"}" aria-hidden="true">
      <div class="ogre-agent-holo-stage">
        <span class="ogre-agent-holo-ring ring-one"></span>
        <span class="ogre-agent-holo-ring ring-two"></span>
        <img src="./assets/slimewire/png/slimewire-ogre-hero-cutout.png" loading="lazy" decoding="async" alt="">
        <span class="ogre-agent-holo-mouth"></span>
        <span class="ogre-agent-holo-scan"></span>
      </div>
      <div class="ogre-agent-holo-meta">
        <strong>${t?"Ogre listening":e?"Ogre talking":"Ogre online"}</strong>
        <small>${t?"Speak your command":n?"Voice ready":"Visual mode"}</small>
      </div>
    </div>
  `}function Cw(){const e=!!a.ogreAgentOpen,t=sn(),n=a.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=kp(),o=a.ogreAgentListening?"Stop":"Mic";return`
    <div class="ogre-agent-shell ${e?"is-open":""} ${a.ogreAgentLoading?"loading":""} ${a.ogreAgentSpeaking?"speaking":""} ${a.ogreAgentListening?"listening":""}" data-ogre-agent-root>
      <button type="button" class="ogre-agent-bubble" data-ogre-agent-toggle aria-label="Open Ogre Agent" aria-expanded="${e?"true":"false"}">
        <img src="./assets/slimewire/clean-ui/side_nav_icons/active/ogre_ai.png" alt="Ogre Agent">
        <span>Ask</span>
      </button>
      <section class="ogre-agent-panel" ${e?"":"hidden"} aria-live="polite">
        <header>
          <div>
            <span>Ogre Agent</span>
            <small>Ask for help or make a trade request.</small>
          </div>
          <div class="ogre-agent-header-actions">
            <button type="button" class="ogre-agent-voice-toggle" data-ogre-agent-voice aria-pressed="${a.ogreAgentVoiceEnabled?"true":"false"}">${l(n)}</button>
            <button type="button" data-ogre-agent-close aria-label="Close Ogre Agent">Close</button>
          </div>
        </header>
        ${e?Aw():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(Pw).join("")}
          ${a.ogreAgentLoading?'<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>':""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL...">${l(a.ogreAgentDraft||"")}</textarea>
          <div class="ogre-agent-composer-actions">
            <button type="button" class="ogre-agent-mic ${a.ogreAgentListening?"is-listening":""}" data-ogre-agent-mic title="${r?"Tap, speak, and Ogre will send it.":"Tap to check microphone support."}">${l(o)}</button>
            <button type="button" data-ogre-agent-send ${a.ogreAgentLoading?"disabled":""}>Send</button>
          </div>
        </div>
        <div class="ogre-agent-quick-actions" aria-label="Ogre Agent quick actions">
          <button type="button" data-ogre-agent-quick="whats_cooking">What's cooking?</button>
          <button type="button" data-ogre-agent-quick="my_bags">My bags</button>
          <button type="button" data-ogre-agent-quick="risk">Why Risk?</button>
          <button type="button" data-ogre-agent-quick="clear_chat">Clear</button>
        </div>
        <small class="ogre-agent-disclaimer">AI can make mistakes. Always review wallet prompts before signing.</small>
        ${a.ogreAgentStatus?`<small class="ogre-agent-status">${l(a.ogreAgentStatus)}</small>`:""}
      </section>
    </div>
  `}function O({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const n=t.querySelector("[data-ogre-agent-input]"),r=!!(n&&document.activeElement===n),o=r?n.selectionStart:null,s=r?n.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),i=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;n&&(a.ogreAgentDraft=n.value);const d=Array.isArray(a.ogreAgentMessages)?a.ogreAgentMessages:[],m=d[d.length-1]||{},f=[a.ogreAgentOpen?"open":"closed",a.ogreAgentLoading?"loading":"idle",a.ogreAgentStatus||"",d.length,m.role||"",m.text||"",Array.isArray(m.actions)?m.actions.length:0,a.ogreAgentVoiceEnabled?"voice-on":"voice-off",a.ogreAgentSpeaking?"speaking":"silent",a.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=Cw(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),zo()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=a.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),o!==null&&s!==null&&y.setSelectionRange(o,s),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const b=t.querySelector("[data-ogre-agent-feed]");b&&(e||u||a.ogreAgentLoading?b.scrollTop=b.scrollHeight:b.scrollTop=Math.min(i,Math.max(0,b.scrollHeight-b.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function ce(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};a.ogreAgentMessages=[...sn(),t].slice(-50),kw(),t.role==="assistant"&&wp(t.text||"")}function ai(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function Lw(){if(!ai())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=n=>{const r=`${n.name||""} ${n.voiceURI||""}`.toLowerCase(),o=String(n.lang||"").toLowerCase();let s=0;return(/^en[-_]/.test(o)||o==="en")&&(s+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(s+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(s+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(s-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(s-=25),n.localService&&(s+=3),s};return e.slice().sort((n,r)=>t(r)-t(n))[0]||e[0]||null}let ln=null;function xw(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!ln||ln.state==="closed")&&(ln=new e),ln.state==="suspended"&&ln.resume(),ln}catch{return null}}function vp(e="reply"){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen)return;const t=xw();if(t)try{const n=t.currentTime,r=e==="online"?.22:.34,o=t.createGain(),s=t.createBiquadFilter(),c=t.createOscillator(),i=t.createOscillator(),u=t.createGain();o.gain.setValueAtTime(1e-4,n),o.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,n+.035),o.gain.exponentialRampToValueAtTime(1e-4,n+r),s.type="lowpass",s.frequency.setValueAtTime(210,n),s.frequency.exponentialRampToValueAtTime(92,n+r),s.Q.setValueAtTime(5.2,n),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,n),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,n+r),i.type="sine",i.frequency.setValueAtTime(e==="online"?45:38,n),i.frequency.exponentialRampToValueAtTime(e==="online"?35:31,n+r),u.gain.setValueAtTime(.18,n),u.gain.exponentialRampToValueAtTime(1e-4,n+r),c.connect(s),s.connect(o),i.connect(u),u.connect(o),o.connect(t.destination),c.start(n),i.start(n),c.stop(n+r+.02),i.stop(n+r+.02)}catch{}}function St(e=!1){a.ogreAgentSpeaking=!!e,a.ogreAgentOpen&&O({force:!0})}function Ko(){if(!ai()){St(!1);return}try{window.speechSynthesis.cancel()}catch{}St(!1)}function Mw(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function wp(e=""){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen||!ai()){St(!1);return}const t=Mw(e);if(!t){St(!1);return}try{window.speechSynthesis.cancel();const n=new window.SpeechSynthesisUtterance(t),r=Lw();r&&(n.voice=r),n.pitch=.72,n.rate=.86,n.volume=1,n.onstart=()=>St(!0),n.onend=()=>St(!1),n.onerror=()=>St(!1),St(!0),vp("reply"),window.speechSynthesis.speak(n)}catch{St(!1)}}function Bw(e){a.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",a.ogreAgentVoiceEnabled?"on":"off")}catch{}a.ogreAgentVoiceEnabled?(a.ogreAgentStatus="Ogre voice on.",vp("online"),wp("Ogre voice online.")):(Ko(),a.ogreAgentStatus="Ogre voice muted."),O({force:!0})}function Sp(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function kp(){return!!Sp()}async function $p(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function Tp(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();a.ogreAgentDraft=t;const n=document.querySelector("[data-ogre-agent-input]");if(n){n.value=t;try{n.focus({preventScroll:!0}),n.setSelectionRange(t.length,t.length)}catch{}}}function Vo(){Jt&&(clearTimeout(Jt),Jt=null),Ca&&(clearTimeout(Ca),Ca=null)}function Pp(e,t=a.ogreAgentSpeechRecognizer){Ca&&clearTimeout(Ca),Ca=setTimeout(()=>{e!==Ze||a.ogreAgentSpeechRecognizer!==t||Ht("Mic timed out instead of staying open. Tap Mic again or type the command.")},um)}function Ht(e=""){Ze+=1,Vo();const t=a.ogreAgentSpeechRecognizer;if(a.ogreAgentSpeechRecognizer=null,a.ogreAgentListening=!1,a.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(a.ogreAgentStatus=e),a.ogreAgentOpen&&O({force:!0})}async function Rw(){if(!kp()){const s=await $p();a.ogreAgentStatus=s==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",O({force:!0});return}a.ogreAgentLoading&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),Ko(),Ht();const e=Ze;a.ogreAgentStatus="Checking microphone permission...",O({force:!0});const t=await $p();if(e!==Ze||!a.ogreAgentOpen)return;if(t==="denied"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",O({force:!0});return}if(t==="unavailable"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="No microphone is available to this browser. Typing still works.",O({force:!0});return}const n=Sp(),r=new n,o=++Ze;a.ogreAgentSpeechRecognizer=r,a.ogreAgentListening=!0,a.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||a.ogreAgentDraft||"").trim(),a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Opening microphone...",O({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Jt=setTimeout(()=>{o!==Ze||a.ogreAgentSpeechRecognizer!==r||Ht("Mic did not start. Check browser permission, then tap Mic again.")},cm),r.onstart=()=>{o!==Ze||a.ogreAgentSpeechRecognizer!==r||(Jt&&(clearTimeout(Jt),Jt=null),a.ogreAgentListening=!0,a.ogreAgentStatus="Listening... speak your Ogre command.",Pp(o,r),O({force:!0}))},r.onresult=s=>{if(o!==Ze||a.ogreAgentSpeechRecognizer!==r)return;Pp(o,r);let c="",i="";for(let d=s.resultIndex||0;d<s.results.length;d+=1){const m=String(s.results[d]?.[0]?.transcript||"");s.results[d]?.isFinal?i+=` ${m}`:c+=` ${m}`}i.trim()&&(a.ogreAgentSpeechFinal=`${a.ogreAgentSpeechFinal||""} ${i}`.replace(/\s+/g," ").trim());const u=[a.ogreAgentSpeechBaseDraft,a.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();Tp(u)},r.onerror=s=>{if(o!==Ze||a.ogreAgentSpeechRecognizer!==r)return;Vo();const c=String(s?.error||"");a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",O({force:!0})},r.onend=()=>{if(o!==Ze||a.ogreAgentSpeechRecognizer!==r)return;Vo();const s=String(a.ogreAgentDraft||"").trim(),c=!!(s&&a.ogreAgentSpeechFinal&&!a.ogreAgentLoading);a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",O({force:!0}),c&&setTimeout(()=>{Tp(s),dt()},100)};try{r.start()}catch{Vo(),a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic could not start. Typing still works.",O({force:!0})}}function Iw(){a.ogreAgentListening||a.ogreAgentSpeechRecognizer?Ht("Voice input stopped."):Rw()}function zo(){a.ogreAgentOpen=!1,a.ogreAgentStatus="",a.ogreAgentLoading=!1,a.ogreAgentRequestId="",Ht(),Ko(),O({force:!0})}function Ow(e=""){const[t,n]=String(e).split(":");return sn()[Number(t)]?.actions?.[Number(n)]||null}function Ap(){return Array.isArray(a.wallets)&&a.wallets.length>0}function Cp(){return!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.walletPublicKey||a.connectedWalletPublicKey)}function jo(){return!!(!Lp()&&(a.ogreAgentAutoTradeApproved||Ap()||Cp()))}function Ew(e="wallet-sync"){return Lp()?!1:Ap()||Cp()?(ri(!0),!0):(ni(),!1)}function Lp(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function ni(){a.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function ri(e,t={}){a.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),a.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function xp(e){a.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",a.ogreAgentFastMode?"on":"off")}catch{}}function kt(e=""){const t=String(e||"").toLowerCase(),n=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),o=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return n?"buy":r||o?"sell":""}function Fw(e=""){const t=String(e||"").toLowerCase(),n=kt(t);if(!n||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),o=n==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),s=!!(qt()||a.smartChartToken||a.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||n==="buy"&&s&&/\b(just\s+)?buy\b/.test(t);return!!(o&&c&&!r)}function Ww(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return n?Number(n):0}function oi(){const e=typeof ot=="function"?ot():null,t=Number(a.quickBuyAmountOverride||(typeof Ue=="function"?Ue(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function Nw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=o?Math.round(Number(o)*100):0,c=[];return n&&c.push(`TP +${n}%`),r&&c.push(`SL -${r}%`),o&&c.push(`slippage ${o}%`),{takeProfitPct:n,stopLossPct:r,slippagePct:o,slippageBps:Number.isFinite(s)&&s>0?s:0,summary:c.join(" / ")}}function Dw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(\d{1,3})\s*%/)||[])[1];return n||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function _w(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function Uw(){const e=[],t=(r={})=>{const o=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();o&&e.push({tokenMint:o,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};a.smartChartToken&&t({tokenMint:a.smartChartToken,symbol:a.smartChartTokenSymbol}),a.tradeToken&&t({tokenMint:a.tradeToken,symbol:a.tradeTokenSymbol}),[a.livePairRows,a.slimeScopeRows,a.watchlist,a.positions,a.portfolioRows,a.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const n=new Set;return e.filter(r=>{const o=r.tokenMint.toLowerCase();return n.has(o)?!1:(n.add(o),!0)})}function qw(e=""){const t=String(e||"").trim(),n=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(n)return n;const r=t.toLowerCase();return Uw().map(s=>{const c=s.symbol.toLowerCase(),i=s.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),i&&r.includes(i)&&(u+=8+Math.min(16,i.length)),{...s,score:u}}).filter(s=>s.score>0).sort((s,c)=>c.score-s.score)[0]?.tokenMint||""}function Go(e={},t=""){const n={...e},r=kt(t);if(!n.tokenMint&&!n.mint&&!n.ca){const o=qw(t)||qt()||a.smartChartToken||a.tradeToken;o&&(n.tokenMint=o)}if(n.type==="confirm_buy"||r==="buy"){if(n.type=n.type||"confirm_buy",!n.amountSol){const s=Ww(t)||oi();s>0&&(n.amountSol=s)}const o=Nw(t);if(o.takeProfitPct&&!n.takeProfitPct&&(n.takeProfitPct=o.takeProfitPct),o.stopLossPct&&!n.stopLossPct&&(n.stopLossPct=o.stopLossPct),o.slippageBps&&!n.slippageBps&&(n.slippageBps=o.slippageBps),n.walletIndex===void 0){const s=_w(t);s!==void 0&&(n.walletIndex=s)}}return(n.type==="confirm_sell"||r==="sell")&&(n.type=n.type||"confirm_sell",n.percent=n.percent||Dw(t)),n}function Mp(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function Bp(e={},t=""){if(!a.ogreAgentFastMode||!jo()||e.requiresReview||e.conditional)return!1;const n=kt(t);return n?n==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:n==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function Kt(e={}){const t=String(e.type||""),n=String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||qt()||"").trim();if(t==="toggle_agent_fast_mode"){xp(!a.ogreAgentFastMode),a.ogreAgentStatus=a.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",ce({role:"assistant",text:a.ogreAgentStatus,actions:[{label:a.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),O();return}if(t==="approve_agent_auto_trade"){ri(!0),xp(!0),a.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",ce({role:"assistant",text:`${a.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),O();return}if(t==="revoke_agent_auto_trade"){ri(!1,{revoked:!0}),a.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",ce({role:"assistant",text:a.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),O();return}if(t==="open_tab"){a.route="terminal",a.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!n){a.ogreAgentStatus="Paste a token CA in the message first.",O();return}yt(he(n,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){a.route="terminal",a.activeTab="positions",window.history.pushState({},"","/terminal"),a.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){j(()=>ht({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Wallet refresh started.",O();return}if(t==="refresh_feeds"){j(()=>Ua({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Feed refresh started.",O();return}if(t==="open_wallet_connect"){ca({returnPath:"/terminal"}),a.ogreAgentStatus="Wallet connect opened.",O();return}if(t==="start_clip_recording"){Uc(),a.ogreAgentStatus="REC started from Ogre Agent.",O();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim();if(!r){a.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",O();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(a.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),Ja(he(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),a.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",O();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||a.smartChartToken||a.tradeToken||qt()||"").trim(),o=Number(e.amountSol||e.sol||e.amount||oi()||0);if(!r||!Number.isFinite(o)||o<=0){r&&Ja(he(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),a.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",O();return}const s=e.walletIndex!==void 0?e.walletIndex:le()?.publicKey?"connected":a.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;a.ogreAgentLoading=!0,a.ogreAgentStatus=`Sending ${o} SOL buy request...`,O();try{const i=await fo({tokenMint:r,walletIndex:s,amountSol:o,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});a.ogreAgentStatus=i?.ok===!1?i.error||i.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${Mp(e)}`,typeof ht=="function"&&ht({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(i){a.ogreAgentStatus=i?.message||"Buy failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim(),o=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){a.activeTab="positions",a.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}a.ogreAgentLoading=!0,a.ogreAgentStatus=`Preparing sell ${o}%...`,O();try{await go(r,o,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),a.ogreAgentStatus=`Sell ${o}% submitted. Refreshing wallet and positions in the background.`,typeof ht=="function"&&ht({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(s){a.ogreAgentStatus=s?.message||"Sell failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){a.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",O();return}window.open(r,"_blank","noopener,noreferrer"),a.ogreAgentStatus="Opened trusted coin link.",O();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=Ho(String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||qt()||"").trim());if(!r){a.ogreAgentStatus="Paste a token CA and ask me to check it.",O();return}const o=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};a.ogreAgentLoading=!0,a.ogreAgentStatus="Checking coin details...",O();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},i=c.symbol||c.baseSymbol||w(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,m=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",b=c.telegramUrl||c.links?.telegram||"",S=o(c.liquidityUsd||c.liquidity?.usd),P=o(c.marketCap||c.fdv||c.marketCapUsd),T=o(c.volume24h||c.volume?.h24||c.volume?.m5),g=[`${i} breakdown`,`${u} | ${w(r)}`,`MC/FDV: ${P} | Liquidity: ${S} | Volume: ${T}`,`Socials: X ${y?"found":"not returned"} | Telegram ${b?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],A=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];m&&A.push({label:"Pump",type:"open_external",url:m}),f&&A.push({label:"Website",type:"open_external",url:f}),y&&A.push({label:"X",type:"open_external",url:y}),b&&A.push({label:"Telegram",type:"open_external",url:b}),ce({role:"assistant",text:g.join(`
`),actions:A}),a.ogreAgentStatus="Coin breakdown ready."}catch(s){ce({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),a.ogreAgentStatus=s?.message||"Coin check delayed."}finally{a.ogreAgentLoading=!1,O()}return}a.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",O()}function Hw(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function si(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function Rp(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function Kw(e="",t=[]){const n=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(o=>String(o||"").trim()).filter((o,s,c)=>o&&c.findIndex(i=>i.toLowerCase()===o.toLowerCase())===s).slice(0,4),r=n.length?n.map(o=>`"${o.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function Vw(e=""){if(!Rp(e))return null;const t=Ho(si(e)||qt()||a.smartChartToken||a.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:Kw(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function zw(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function jw(e=""){if(!zw(e))return null;const t=bp().slice(0,4),n=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((s,c)=>{const i=s.symbol||w(s.tokenMint),u=Number.isFinite(Number(s.ageMinutes))?`${Math.max(0,Math.round(Number(s.ageMinutes)))}m old`:"age n/a",d=s.twitterUrl||s.telegramUrl||s.websiteUrl?"socials found":"socials not returned",m=Array.isArray(s.riskFlags)&&s.riskFlags.length?`risk: ${s.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${i} ${w(s.tokenMint)} | MC ${n(s.marketCap)} | Liq ${n(s.liquidityUsd)} | Vol ${n(s.volume5m||s.volume1h)} | ${u} | ${d} | ${m}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],o=t[0];return{text:r.join(`
`),actions:[o?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:o.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const Gw=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],Xw=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function Jw(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||si(e)||kt(e))return null;const n=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(n){const o=er(n[1]);if(o)return a.quickBuyAmountOverride=o,Dr({quickBuy:o}),Bo(),{text:`Quick buy set to ${o} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return Dr({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return Dr({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=Xw.test(t);for(const[o,s]of Gw)for(const c of s){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${Yw(o)} now.${o==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:o},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function Yw(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const Qw={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function Ip(e){a.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},Xo()}function xe(e,t="ok",n=""){if(!a.tradeTrace||a.tradeTrace.done&&t==="pending")return;const r=a.tradeTrace.steps,o=r.find(i=>i.key===e),s=o||{key:e,label:Qw[e]||e};if(s.status=t,s.detail=String(n||"").slice(0,140),o||r.push(s),t==="fail"&&(a.tradeTrace.done=!0),Xo(),t==="fail")return;r.length>=3&&r.every(i=>i.status==="ok")&&(a.tradeTrace.done=!0,window.setTimeout(()=>{a.tradeTrace?.done&&!a.tradeTrace.steps.some(i=>i.status==="fail")&&(a.tradeTrace=null,Xo())},8e3))}function Xo(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=a.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const n=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
    <aside class="trade-trace" role="status" aria-live="polite">
      <header>
        <strong>${l(t.title)}</strong>
        <button type="button" data-trade-trace-close aria-label="Close receipt">✕</button>
      </header>
      ${t.steps.map(r=>`
        <div class="trade-trace-step is-${l(r.status)}">
          <span>${n(r.status)}</span>
          <div>
            <b>${l(r.label)}</b>
            ${r.detail?`<small>${l(r.detail)}</small>`:""}
          </div>
        </div>`).join("")}
    </aside>
  `}async function dt(e=""){const t=document.querySelector("[data-ogre-agent-input]"),n=String(e||t?.value||"").trim();if(!n||a.ogreAgentLoading)return;const r=si(n);if(r&&Ho(r),t&&(t.value=""),a.ogreAgentDraft="",ce({role:"user",text:n,actions:[]}),Fw(n)){const i=kt(n),u=Go({type:i==="buy"?"confirm_buy":"confirm_sell"},n),d=String(u.tokenMint||u.mint||u.ca||"").trim(),m=Number(u.amountSol||u.sol||u.amount||0);if(!d){ce({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),a.ogreAgentStatus="Need token CA.",O({force:!0});return}if(i==="buy"&&(!Number.isFinite(m)||m<=0)){ce({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),a.ogreAgentStatus="Need buy amount.",O({force:!0});return}if(!jo()){ce({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),a.ogreAgentStatus="Wallet session needed.",O({force:!0});return}ce({role:"assistant",text:i==="buy"?`Sending ${m} SOL buy for ${w(d)}.${Mp(u)}`:`Sending sell request for ${w(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),a.ogreAgentStatus="Fast Mode: sending trade request...",O({force:!0}),await Kt(u);return}const o=Jw(n);if(o){ce({role:"assistant",text:o.text,actions:o.actions||[]}),a.ogreAgentStatus="Instant local reply.",O({force:!0}),o.run&&await Kt(o.run);return}a.ogreAgentLoading=!0,a.ogreAgentStatus="",te("chatRequestStarted");const s=`${Date.now()}:${Math.random().toString(16).slice(2)}`;a.ogreAgentRequestId=s;const c=setTimeout(()=>{a.ogreAgentRequestId!==s||!a.ogreAgentLoading||(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Agent reply timed out.",te("chatRequestTimedOut"),ce({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:n,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),O({force:!0}))},7500);O();try{const i=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:n,context:$w()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(a.ogreAgentRequestId!==s)return;const u=(i?.agent?.actions||[]).map(S=>Go(S,n));i?.agent?.tokenMint&&Ho(i.agent.tokenMint),ce({role:"assistant",text:i?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),te("chatRequestSucceeded");const d=!!(i?.agent?.coinEnriched||i?.agent?.tokenMint||i?.agent?.socialLinks||i?.agent?.socialScan),f=!Rp(n)&&!d&&!kt(n)&&Hw(n)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||Go({type:"coin_breakdown"},n):null;if(f?.tokenMint||f?.mint||f?.ca){a.ogreAgentStatus="Checking coin now...",await Kt(f);return}const y=Go({type:kt(n)==="buy"?"confirm_buy":kt(n)==="sell"?"confirm_sell":""},n);if(kt(n)&&a.ogreAgentFastMode&&!jo()){ce({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),a.ogreAgentStatus="Auto-Trade approval needed once.";return}const b=u.find(S=>Bp(S,n))||(Bp(y,n)?y:null);if(b){a.ogreAgentStatus="Fast Mode: sending trade request...",await Kt(b);return}a.ogreAgentStatus=i?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(i){if(a.ogreAgentRequestId!==s)return;const u=Vw(n);if(u){ce({role:"assistant",text:u.text,actions:u.actions}),a.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=jw(n);if(d){ce({role:"assistant",text:d.text,actions:d.actions}),a.ogreAgentStatus="Fast local trend scan.";return}ce({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:n,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),te("chatRequestFailed"),a.ogreAgentStatus=i?.message||"Agent reply failed."}finally{clearTimeout(c),a.ogreAgentRequestId===s&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,O())}}function R(e,t){return`<article class="empty"><h3>${l(e)}</h3><p>${l(t)}</p></article>`}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ve(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function Zw(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function Op(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const n=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");n&&(e.preventDefault(),Zw(n),Ji({connectPanel:n.matches("[data-connect-login-toggle]")||a.route==="connect",source:n.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(Jm(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),dt();return}const n=e.target?.closest?.("[data-global-token-search]");if(n&&e.key==="Enter"){e.preventDefault(),rd(n.value||"");return}if(e.key==="Escape"){if(a.ogreAgentOpen){zo();return}if(a.slimeShieldDetails?.open){_l();return}if(a.kolDumpDetails?.open){gl();return}if(a.replayDetails?.open){Kl();return}if(a.protectedBuyModal?.open){mo();return}if(!(!a.loginModalOpen&&!a.quickBuyModal?.open)){if(a.quickBuyModal?.open){Al();return}Gi()}}});function li(e=null,t="interaction"){const n=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!n)return!1;const r=n.dataset.tokenTrade||n.dataset.tokenChart||n.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),i=Number(a.smartChartInteractionPrefetchAt||0),u=a.smartChartInteractionPrefetchSeen||{};if(i&&c-i<Ny||Number(u[r]||0)&&c-Number(u[r])<Uy)return!1;const d=(a.smartChartInteractionPrefetchRecent||[]).filter(m=>c-Number(m||0)<Dy);if(d.length>=_y)return a.smartChartInteractionPrefetchRecent=d,!1;a.smartChartInteractionPrefetchAt=c,a.smartChartInteractionPrefetchRecent=[...d,c],a.smartChartInteractionPrefetchSeen={...u,[r]:c}}return Rl(he(r,{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t}),{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{li(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{li(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{li(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const Ep=new WeakMap;function eS(e){let t=Ep.get(e);if(!t){const n=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(n.overflowY),contained:/contain|none/.test(n.overscrollBehaviorY)},Ep.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||a.route!=="terminal"||Nn())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const n=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const s=eS(t);if(s.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,i=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(n<0&&c||n>0&&i)||s.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let o=e.deltaY;e.deltaMode===1?o*=40:e.deltaMode===2&&(o*=r.clientHeight),r.scrollTop+=o,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),_l();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),mo();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),gl();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),Kl();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const g=c.closest(".nav-tool-group");a.navTekOpen=!g?.open,km(a.navTekOpen),g&&(g.open=a.navTekOpen);return}const i=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!i)return;if(i.matches("[data-tool-section]")){e.preventDefault();const g=i.dataset.toolSection,[A]=g.split(":"),L=g.slice(A.length+1);a.toolSections={...a.toolSections||{},[A]:L};const B=i.closest("[data-tool-panels]");B&&(B.querySelectorAll(`[data-tool-section^="${A}:"]`).forEach(_=>{_.dataset.active=_.dataset.toolSection===g?"true":"false"}),B.querySelectorAll(`[data-tool-panel^="${A}:"]`).forEach(_=>{_.hidden=_.dataset.toolPanel!==g}),zr(B));return}if(i.matches("[data-clip-record]")){e.preventDefault(),a.clipFarm?.recording?Wn():Uc();return}if(i.matches("[data-clip-share]")){e.preventDefault(),qf();return}if(i.matches("[data-clip-download]")){e.preventDefault(),Hf();return}if(i.matches("[data-clip-clear]")){e.preventDefault(),Xs();return}if(i.matches("[data-slimeshield-details]")){e.preventDefault(),i.closest("[data-dev-info-drawer-root]")&&Ul(),Kd(i.dataset.slimeshieldDetails||"");return}if(i.matches("[data-slimeshield-refresh]")){e.preventDefault(),Vd(i.dataset.slimeshieldRefresh||"",{force:!0});return}if(i.matches("[data-kol-dump-details]")){e.preventDefault(),eb(i.dataset.kolDumpDetails||"");return}if(i.matches("[data-kol-dump-refresh]")){e.preventDefault(),hl({force:!0});return}if(i.matches("[data-replay-open]")){e.preventDefault(),Bv(i.dataset.replayOpen||"");return}if(i.matches("[data-replay-refresh]")){e.preventDefault(),Hl(i.dataset.replayRefresh||"",{force:!0});return}if(i.matches("[data-ogre-agent-toggle]")){a.ogreAgentOpen?zo():(a.ogreAgentOpen=!0,ih(),O({force:!0}));return}if(i.matches("[data-ogre-agent-close]")){zo();return}if(i.matches("[data-ogre-agent-voice]")){Bw(!a.ogreAgentVoiceEnabled);return}if(i.matches("[data-ogre-agent-send]")){Ht(),dt();return}if(i.matches("[data-ogre-agent-mic]")){Iw();return}if(i.matches("[data-ogre-agent-quick]")){const g=i.dataset.ogreAgentQuick||"";if(g==="positions"&&Kt({type:"open_tab",tab:"positions"}),g==="whats_cooking"&&dt("whats cooking"),g==="my_bags"&&dt("how are my bags"),g==="refresh_feeds"&&Kt({type:"refresh_feeds"}),g==="risk"&&dt("Why is this token risky?"),g==="dev_info"&&dt("Explain Dev Info for this token."),g==="protected_buy"&&dt("Should I use Protected Buy?"),g==="replay"&&dt("Replay similar launches for this token."),g==="auto_trade"&&Kt({type:"approve_agent_auto_trade"}),g==="clear_chat"){Ht(),Ko(),a.ogreAgentMessages=[gp()],a.ogreAgentStatus="Chat cleared.",a.ogreAgentDraft="",a.ogreAgentLastTokenMint="";try{localStorage.removeItem(ei),localStorage.removeItem(ti)}catch{}O({force:!0})}return}if(i.matches("[data-ogre-agent-retry]")){const g=Number(i.dataset.ogreAgentRetry),A=String(a.ogreAgentMessages?.[g]?.retryText||"").trim();A&&dt(A);return}if(i.matches("[data-ogre-agent-action]")){const g=i.dataset.ogreAgentAction,L=Ow(g)||(a.ogreAgentMessages||[]).flatMap(B=>Array.isArray(B.actions)?B.actions:[]).find(B=>B.key===g||B.label===g||B.type===g);Kt(L||{type:g});return}if(i.matches("[data-nav-route]")){e.preventDefault(),ke(i.dataset.navRoute||"/terminal",i.dataset.tab||null);return}if(i.matches("[data-policy]")){e.preventDefault(),window.alert(zm(i.dataset.policy==="privacy"?"privacy":"terms"));return}if(i.matches("[data-top-wallet-connect]")){e.preventDefault(),i.dataset.walletState==="connected"||!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length)?ke("/terminal","wallets"):ca({returnPath:"/terminal"});return}if(i.matches("[data-top-wallet-status]")){e.preventDefault(),await Jf();return}if(i.matches("[data-top-refresh-wallet]")){const g=C();Fa("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:"top-refresh-wallet"}),ht({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{pb()&&j(()=>yl())}).catch(A=>$(A.message));return}if(i.matches("[data-ogre-tek-refresh]")){await sr({force:!0}).catch(g=>$(g.message));return}if(i.matches("[data-ogre-ai-start]")){j(()=>jb());return}const u=i.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),a.ogreAiCategory=u.dataset.ogreCat||"super_fresh",h({force:!0});return}if(i.closest?.("[data-autopilot-save]")){e.preventDefault(),j(()=>Jb());return}if(i.matches("[data-ogre-tek-market]")){a.ogreTek.selectedMarket=i.dataset.ogreTekMarket||a.ogreTek.selectedMarket,a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-side]")){a.ogreTek.direction=i.dataset.ogreTekSide==="short"?"short":"long",a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-review]")){qo(),a.ogreTek.reviewOpen=!0,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-close-review]")){a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-confirm-review]")){qo();const g=mp();!a.ogreTek.riskAccepted||!g.ok?a.ogreTek.status="Risk confirmation is incomplete.":Se.demoMode?(a.ogreTek.status="Demo review confirmed. No live transaction was submitted.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1):(a.ogreTek.status="Live perps adapter is not wired in this build.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1),h({force:!0});return}if(i.matches("[data-ogre-tek-demo-action]")){const g=i.dataset.ogreTekDemoAction||"action";a.ogreTek.status=`Demo mode: ${g.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(i.matches("[data-toggle-terminal-ticket]")){a.terminalTradeCollapsed=!a.terminalTradeCollapsed,h({force:!0});return}if(i.matches("[data-global-token-open]")){const g=p("[data-global-token-search]")?.value?.trim()||"";g&&rd(g);return}if(i.matches("[data-token-chart]")){e.preventDefault();const g=i.dataset.tokenChart||i.dataset.previewToken||"";yt(he(i.dataset.tokenChart||i.dataset.previewToken||"",{source:i.dataset.tokenChartSource||"token-card"}),{defaultTab:i.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!i.closest?.(".live-pair-avatar"),source:i.dataset.tokenChartSource||"token-card"});return}if(i.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const g=i.dataset.tokenTrade||"",A=Ya(g);A&&vo(A)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),yt(he(i.dataset.tokenTrade||"",{source:i.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:i.dataset.tokenTradeSource||"trade-button"});return}if(i.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),Ja(he(i.dataset.quickBuyToken||"",{source:i.dataset.quickBuySource||"quick-buy-button"}),{source:i.dataset.quickBuySource||"quick-buy-button"});return}if(i.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),i.closest("[data-dev-info-drawer-root]")&&Ul();const g=i.dataset.protectedBuySource||"protected-buy",A=!!i.closest("[data-quick-buy-modal-root]"),L=!!i.closest(".chart-trade-panel"),B=i.dataset.protectedBuyOpen||a.quickBuyModal?.tokenMint||a.smartChartToken||a.tradeToken||"";oy(he(B,{source:g}),{source:g,presetId:i.dataset.protectedBuyPreset||"",amountSol:A?p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||"":L&&p("[data-chart-buy-amount]")?.value||"",walletIndex:A?p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"":L&&p("[data-chart-buy-wallet]")?.value||"",slippageBps:A?p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400":L&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-quick-buy-close]")){e.preventDefault(),Al();return}if(i.matches("[data-protected-buy-close]")){e.preventDefault(),mo();return}if(i.matches("[data-protected-buy-confirm]")){e.preventDefault(),j(()=>iy());return}if(i.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),a.quickBuyModal={...a.quickBuyModal,amountSol:i.dataset.quickBuyModalPreset||"",status:`${i.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(i.matches("[data-quick-buy-confirm]")){e.preventDefault(),j(()=>dy());return}if(i.matches("[data-preview-token]")){const g=i.dataset.previewToken||"";g&&yt(he(g,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(i.matches("[data-terminal-subtab]")){a.terminalSubtab=i.dataset.terminalSubtab||"positions",h();return}if(i.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await go(i.dataset.positionSell||"",i.dataset.positionSellPercent||"100",{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const g=await Ae({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});g&&await go(i.dataset.positionSellCustom||"",g,{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-run-tx-audit]")){e.preventDefault(),j(()=>py());return}if(i.matches("[data-connect-login-toggle]")){Op(i)||Yi({connectPanel:!0,source:"connect-lock-in"});return}if(i.matches("[data-login-tab]")){a.loginModalTab=i.dataset.loginTab==="create"?"create":"login",h({force:!0}),ji(!1);return}if(i.matches("[data-connect-password-login]")){await lc();return}if(i.matches("[data-send-email-code]")){await uf();return}if(i.matches("[data-web-code-login]")){await df();return}if(i.matches("[data-connect-create-account]")){await Fs();return}if(i.matches("[data-connect-create-wallet]")){await gf();return}if(i.matches("[data-web-signup]")&&await Fs(),i.matches("[data-web-password-login]")&&await lc(),i.matches("[data-close-login]")){Gi();return}if(i.matches("[data-web-signup-connect]")){await hf();return}if(i.matches("[data-open-login]")){Op(i)||Yi({connectPanel:a.route==="connect",source:"top-lock-in"});return}if(i.matches("[data-browse-guest]")){a.loginCollapsed=!0,a.route="terminal",a.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Br("browse-terminal");return}if(i.matches("[data-logout]")&&await bf(),i.matches("[data-connect-x]")&&await Tb(),i.matches("[data-open-x-login]")&&Pb(),i.matches("[data-clear-x]")&&await Ab(),i.matches("[data-save-login-credentials]")&&await Mb(),i.matches("[data-save-referral]")&&await cd(),i.matches("[data-generate-referral-code]")&&await cd({generate:!0}),i.matches("[data-save-trader-board]")&&await by(),i.matches("[data-use-x-avatar]")&&await xb(),i.matches("[data-clear-avatar]")&&await ro({clear:!0},"Removing PFP..."),i.matches("[data-preset-avatar]")){const g=p("[data-avatar-status]");v(g,"Loading preset PFP...");try{const A=await Lb(i.dataset.presetAvatar);await ro({avatarDataUrl:A,avatarSource:i.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(A){v(g,A.message),$(A.message)}}if(i.matches("[data-launch-coin-save]")){qn();return}if(i.matches("[data-launch-coin-submit]")){await Gg();return}if(i.matches("[data-launch-coin-use-ca]")){await Kg();return}if(i.matches("[data-connect-wallet]")){const g=i.dataset.connectWallet||"solana";if(g&&g!=="solana"){await Du(g,{returnPath:"/terminal"});return}ca({returnPath:"/terminal"});return}if(i.matches("[data-connect-wallet-provider]")){await Du(i.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(i.matches("[data-wallet-connect-close]")){a.walletConnectMenuOpen=!1,h({force:!0});return}if(i.matches("[data-wallet-fast-approvals-toggle]")){Lh(!a.walletFastApprovalsEnabled),$(a.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(i.matches("[data-disconnect-wallet]")){await _u();return}if(i.matches("[data-share-x]")&&wl(i.dataset.shareText||""),i.matches("[data-share-watch-token-btn]")&&Uu("token"),i.matches("[data-share-watch-kol-btn]")&&Uu("kol"),i.matches("[data-save-preset]")){await ld(i.dataset.savePreset);return}if(i.matches("[data-save-fast-preset]")){await ld(i.dataset.saveFastPreset,"fast");return}if(i.matches("[data-use-preset]")){hy(i.dataset.usePreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-preset]")){id(i.dataset.editPreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-selected-preset]")){const g=i.dataset.editSelectedPreset==="bundle"?"bundle":"trade",A=g==="bundle"?a.selectedBundlePresetId:a.selectedTradePresetId;A&&A!=="custom"?id(g,A):Vl(g);return}if(i.matches("[data-cancel-preset-edit]")){Kr(i.dataset.cancelPresetEdit,""),h();return}if(i.matches("[data-delete-preset]")){await gy(i.dataset.deletePreset,i.dataset.presetId||"");return}if(i.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),Ja(he(i.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(i.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),j(()=>sd(i.dataset.quickBundleToken||""));return}if(i.matches("[data-smart-chart-token]")){yt(he(i.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(i.matches("[data-smart-chart-view]")){const g=i.dataset.smartChartView||"chart";a.smartChartView=["chart","chartTxns","txns","info"].includes(g)?g:"chart",h();return}if(i.matches("[data-chart-trade-tab]")){a.chartTradeTab=i.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),a.chartTradeTab==="buy"&&requestAnimationFrame(()=>p("[data-chart-buy-amount]")?.focus());return}if(i.matches("[data-chart-buy-preset]")){const g=p("[data-chart-buy-amount]");g&&(g.value=i.dataset.chartBuyPreset||""),a.quickBuyAmountOverride=G(i.dataset.chartBuyPreset||""),Bo();return}if(i.matches("[data-chart-confirm-buy]")){const g=i.dataset.chartConfirmBuy||a.smartChartToken||"";e.preventDefault(),e.stopPropagation();const A=p("[data-chart-buy-wallet]")?.value||"";if(ie(A)){try{i.dataset.actionState="clicked",i.disabled=!0,await uy(g)}catch(L){const B=W(L.message||"Chart buy failed."),_=G(p("[data-chart-buy-amount]")?.value||"")||"custom";K("trade-buy",g,String(_),{state:"error",error:B}),Pe("trade-buy",g,String(_),4e3),Ee(B),$(B),se()}return}Ee("Buy queued. Opening wallet approval..."),i.dataset.actionState="clicked",i.disabled=!0,j(async()=>{try{const L=Yu();await fo({tokenMint:g,walletIndex:A,amountSol:G(p("[data-chart-buy-amount]")?.value||""),slippageBps:p("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:L.takeProfitPct,stopLossPct:L.stopLossPct,sellDelay:L.sellDelay,sellPercent:L.sellPercent,source:"chart-buy-panel"}),a.chartTradeTab="buy",Ee("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(L){const B=W(L.message||"Chart buy failed.");Ee(B),$(B),h({force:!0,preserveSmartChartFrame:!0})}});return}if(i.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const g=p("[data-chart-sell-percent]")?.value||"";if(g)try{await go(i.dataset.chartConfirmSell||"",g,{slippageBps:p("[data-chart-buy-slippage]")?.value||"400"})}catch(A){const L=W(A.message||"Chart sell failed.");Ee(L),$(L)}return}if(i.matches("[data-smart-chart-open]")){const g=String(p("[data-smart-chart-input]")?.value||"").trim();if(!g){$("Paste a token CA first.");return}yt(he(g,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(i.matches("[data-refresh-feeds]")){j(()=>Ua({force:!0,reason:"manual-refresh-feeds"}));return}if(i.matches("[data-terminal-load-more]")){const g=i.dataset.terminalLoadMore||a.activeTab;Sf(g,Bt(g)),wc(g,{requestId:V(g).lastRequestId||"",status:V(g).lastStatus||"render",reason:"load-more",resultCount:Bt(g),renderedCount:Cn(g),hasMore:Bt(g)>Cn(g),stale:Ln(g),errorCode:V(g).errorCode||"",errorMessage:V(g).errorMessage||""}),h({force:!0});return}if(i.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),Cv(i.dataset.devInfo||"");return}if(i.matches("[data-dev-info-close]")){Ul();return}if(i.matches("[data-dev-info-refresh]")){const g=i.dataset.devInfoRefresh||a.devInfoDetails?.tokenMint||"";await Xd(g,{force:!0});return}if(i.matches("[data-watch-token]")&&await ud("add",i),i.matches("[data-unwatch-token]")&&await ud("remove",i),i.matches("[data-pnl-card]"))try{await Hu(i.dataset.pnlCard)}catch(g){$(g.message)}if(i.matches("[data-share-pnl-card]")&&await Bb(i.dataset.sharePnlCard,i.dataset.shareText||""),i.matches("[data-scan-bags]")){await Iy();return}if(i.matches("[data-arm-exits]")){await Ry(i.dataset.armExits,i);return}if(i.matches("[data-dev-watch]")){await By(i.dataset.devWatch);return}if(i.matches("[data-hype-create]")){await Fg();return}if(i.matches("[data-push-enable]")){await yh();return}if(i.matches("[data-push-disable]")){await vh();return}if(i.matches("[data-call-post]")){await Dv(i.dataset.callPost);return}if(i.matches("[data-telegram-link]")){await gh();return}if(i.matches("[data-trade-trace-close]")){a.tradeTrace=null,Xo();return}if(i.matches("[data-launch-kit-close]")){a.launchShareKit=null,h();return}if(i.matches("[data-create-wallets]")&&await Wu(),i.matches("[data-distribute-fresh]")){await vg();return}if(i.matches("[data-return-funds]")){await yg();return}if(i.matches("[data-sweep-background-wallets]")){await $y();return}if(i.matches("[data-create-automation-wallet]")&&await lb(),i.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await ub(i);return}if(i.matches("[data-tpsl-status-button]")){i.dataset.tpslState==="enabled"?(a.activeTab="profile",ke("/terminal","profile"),a.automationDelegationStatus=a.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await bl("enable");return}if(i.matches("[data-automation-permission]")&&await bl(i.dataset.automationPermission||"enable"),i.matches("[data-run-trade-plans]")&&await yl(),i.matches("[data-restore-backup]")&&await hb(),i.matches("[data-export-backup]")&&await gb(),i.matches("[data-import-wallet]")&&await bb(),i.matches("[data-remove-wallet]")&&await yb(i.dataset.removeWallet||"",i.dataset.walletLabel||"",i.dataset.removeWalletKey||""),i.matches("[data-wallet-sweep-action]")&&await kb(i.dataset.walletSweepAction||""),i.matches("[data-download]")){const g=a.downloads?.[i.dataset.download];g&&me(g.filename,g.text)}if(i.matches("[data-trade-buy-quick]")&&await lo(i.dataset.tradeBuyQuick),i.closest?.("[data-swap-reverse]")){a.swapDirection=a.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(i.matches("[data-swap-use-custom-amount]")){const g=String(p("[data-swap-amount]")?.value||"").trim();a.swapDirection==="sell"?await kl(g||"100"):await lo(g);return}i.matches("[data-trade-buy-max]")&&await lo(null,"max"),i.matches("[data-trade-buy-custom]")&&await lo(p("[data-buy-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-sell-quick]")&&await kl(i.dataset.tradeSellQuick),i.matches("[data-trade-sell-custom]")&&await kl(p("[data-sell-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-plan-start]")&&await Ub(),i.matches("[data-volume-start]")&&await Hb();const d=i.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),a.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(g=>{g.dataset.active=String(g===d)});return}const m=i.closest?.("[data-vbot-set-aggr]");if(m){e.preventDefault(),a.slimeBotAggr=m.dataset.vbotSetAggr||"med",m.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(g=>{g.dataset.active=String(g===m)});return}const f=i.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),a.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(g=>{g.dataset.active=String(g===f)});return}if(i.matches("[data-vbot-start]")){e.preventDefault(),await Ag();return}const y=i.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await Cg(y.dataset.vbotStop||"");return}if(i.matches("[data-sniper-buy]")&&await Vb(i.dataset.sniperBuy),i.matches("[data-kol-mode]")){a.kolWallet="",a.kolMode=i.dataset.kolMode||a.kolMode,Y("kol"),await Q("kol",{force:!0,reason:"kol-mode-switch"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-refresh]")){await Q("kol",{force:!0,reason:"manual-kol-refresh"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-wallet-scan]")){if(a.kolWallet=String(p("[data-kol-wallet]")?.value||"").trim(),a.kolWallet&&!Et(a.kolWallet)){Nt("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),a.kolWallet="";return}Y("kol"),await Q("kol",{force:!0,reason:"kol-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-scan-wallet]")){if(a.kolWallet=String(i.dataset.kolScanWallet||"").trim(),a.kolWallet&&!Et(a.kolWallet)){Nt("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),a.kolWallet="";return}Y("kol"),await Q("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-copy-setup]")){const g=String(i.dataset.kolCopySetup||"").trim();if(g&&!Et(g)){Nt("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}g&&(a.kolWallet=g),a.activeTab="kol",h(),setTimeout(()=>{const A=document.querySelector("[data-kol-management-settings]");A&&(A.open=!0,A.scrollIntoView({behavior:"smooth",block:"start"}));const L=p("[data-kol-wallet]");L&&g&&(L.value=g);const B=p("[data-kol-status]");B&&v(B,`Copy setup loaded for ${w(g)}. Choose presets, then tap Copy Wallet Next Buy.`),p("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(i.matches("[data-kol-copy]")){await Zb(i.dataset.kolCopy);return}if(i.matches("[data-kol-copy-wallet]")){const g=String(i.dataset.kolCopyWallet||"").trim();if(g&&!Et(g)){Nt("That KOL entry does not have a verified Solana wallet yet.");return}await ey(i.dataset.kolCopyWallet||"");return}if(i.matches("[data-kol-trade]")){a.tradeToken=i.dataset.kolTrade||"",a.activeTab="trade",h();return}if(i.matches("[data-kol-bundle]")){a.bundleToken=i.dataset.kolBundle||"",a.activeTab="bundle",h();return}if(i.matches("[data-bundle-buy]")&&await td("buy"),i.matches("[data-bundle-sell]")&&await td("sell"),i.matches("[data-bundle-plan]")&&await ay(),i.matches("[data-launch-start]")&&await vy(),i.matches("[data-launch-cancel]")&&await wy(i.dataset.launchCancel),i.matches("[data-use-token]")&&(a.tradeToken=i.dataset.useToken||"",a.volumeToken=i.dataset.useToken||"",a.bundleToken=i.dataset.useToken||"",a.activeTab="trade",h()),i.matches("[data-use-token-bundle]")&&(a.bundleToken=i.dataset.useTokenBundle||"",a.tradeToken=a.bundleToken,a.volumeToken=a.bundleToken,a.activeTab="bundle",h()),i.matches("[data-use-token-volume]")&&(a.volumeToken=i.dataset.useTokenVolume||"",a.tradeToken=a.volumeToken,a.bundleToken=a.volumeToken,a.activeTab="volume",h()),i.matches("[data-refresh-all]")){const g=C();if(Fa("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:a.activeTab||"terminal"}),!a.user||!a.token)Ke(a.activeTab)?await Q(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(A=>$(A.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),qe("success");else{const A=C();a.activeTab==="positions"?wf({force:!0,reason:"manual-positions-refresh"}).catch(L=>{qe("error",{error:W(L?.message||"Position refresh failed")}),$(L.message),h()}):(ht({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(L=>$(L.message)),Q(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(L=>$(L.message))),q("position-refresh-request-start",A,{component:"positions",cacheHit:!1,details:a.activeTab||"terminal"})}}if(i.matches("[data-tab]")){const g=C();if(a.activeTab=i.dataset.tab,a.activeTab==="volume"&&Gr(),a.activeTab==="ogreAi"&&Gb(),a.activeTab==="ogreTek"){a.route="terminal",window.history.pushState({},"","/ogre-tek"),await sr({silent:!0}).catch(B=>$(B.message)),h();return}a.route!=="terminal"&&(a.route="terminal",window.history.pushState({},"","/terminal")),a.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):a.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const A=vc(a.activeTab);h();const L=Q(a.activeTab,{silent:!0,ifStale:!0,force:!A,reason:"tab-switch"}).catch(B=>$(B.message));A||await L,q("tab-switch",g,{component:"terminal",cacheHit:A,details:a.activeTab})}if(i.matches("[data-refresh-scan]")&&j(()=>Q("sniper",{force:!0,reason:"manual-sniper-refresh"})),i.closest?.("[data-refresh-live-pairs]")){const g=a.activeTab==="slimeScope"?"slimeScope":a.activeTab==="terminal"?"terminal":a.activeTab==="launch"||a.activeTab==="launchCoin"?"launch":"live",L=a.activeTab==="live"||a.activeTab==="terminal"?null:Qs();j(async()=>{await Q(g,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),L&&Zs(L)})}if(i.closest?.("[data-terminal-filter-toggle]")){const g=Le();g.open=!g.open,h();return}if(i.closest?.("[data-terminal-filter-clear]")){a.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},Y("live"),Y("launch"),Y("sniper"),h();return}i.matches("[data-refresh-watchlist]")&&j(()=>Q("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=i.closest?.("[data-live-pair-bucket]");S&&(a.livePairBucket=S.dataset.livePairBucket||"live",a.livePairs=We(),a.livePairsLastUpdatedAt=la(),Y("live"),Y("slimeScope"),h(),j(()=>Q(a.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=i.closest?.("[data-slime-scope-mode]");P&&(a.slimeScopeMode=P.dataset.slimeScopeMode||"new",a.activeTab="slimeScope",Y("slimeScope"),h(),j(()=>Q("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),i.matches("[data-scan-mode]")&&(Y("sniper"),a.scanMode=i.dataset.scanMode||a.scanMode,h(),j(()=>Bn(a.scanMode)));const T=i.getAttribute("data-copy");if(T){const g=i.getAttribute("data-copy-label")||i.textContent||"Copy";await navigator.clipboard.writeText(T),v(i,"Copied"),setTimeout(()=>{v(i,g)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(a.replayDetails?.open){Kl();return}if(a.kolDumpDetails?.open){gl();return}if(a.protectedBuyModal?.open){mo();return}if(a.quickBuyModal?.open){Al();return}if(a.walletConnectMenuOpen){a.walletConnectMenuOpen=!1,h({force:!0});return}a.loginCollapsed||(a.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const n=document.querySelector("[data-vbot-manual-wallets]");n&&(n.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(a.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(a.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const n=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(o=>{o.style.display=n?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=n||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(zr(),hg(t)),t?.matches?.("[data-swap-from]")){const n=Ie(t.value||"SOL")||"SOL";a.tradeSwapFrom=n,n!=="SOL"?(a.tradeToken=n,a.tradeSwapTo="SOL"):Ie(a.tradeSwapTo||a.tradeToken||"")||(a.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const n=Ie(t.value||"");if(a.tradeSwapTo=n,n&&n!=="SOL"){a.tradeToken=n,a.swapDirection="buy";const r=p("[data-trade-token]");r&&(r.value=n)}n||p("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){a.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const n=t.value||"";if(n==="custom"){Vl("trade");return}if(a.selectedTradePresetId=n,a.fastTradePresetStatus=a.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=ne("trade",a.selectedTradePresetId);a.chartBuyWalletIndex="",r?.amountSol&&(a.quickBuyAmountOverride=G(r.amountSol)),a.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(a.quickBuyAmountOverride=G(t.value),t.value=a.quickBuyAmountOverride,Bo()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(a.protectedBuyModal={...a.protectedBuyModal||{},presetId:p("[data-protected-buy-preset]")?.value||a.protectedBuyModal?.presetId||"conservative",walletIndex:p("[data-protected-buy-wallet]")?.value||a.protectedBuyModal?.walletIndex||"",amountSol:G(p("[data-protected-buy-amount]")?.value||a.protectedBuyModal?.amountSol||""),slippageBps:p("[data-protected-buy-slippage]")?.value||a.protectedBuyModal?.slippageBps||"400",riskAccepted:!!p("[data-protected-buy-risk-accept]")?.checked},Cl()),t?.matches?.("[data-fast-bundle-preset]")){const n=t.value||"";if(n==="custom"){Vl("bundle");return}a.selectedBundlePresetId=n,a.fastBundlePresetStatus=a.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(a.terminalSort=t.value||"best",Y("live"),Y("slimeScope"),h(),j(()=>Rt({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){a.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",a.liveFeedCategory)}catch{}a.terminalSort=rp()[3]||"best",Y("live"),h(),j(()=>Rt({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){a.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",a.liveTerminalCategory)}catch{}Y("live"),h(),j(()=>Rt({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){a.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",a.cookSpotCategory)}catch{}Y("slimeScope"),h(),j(()=>Q("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const n=t.files?.[0],r=p("[data-launch-image-preview-wrap]"),o=p("[data-launch-image-preview]"),s=p("[data-launch-image-preview-meta]");if(!n){r&&(r.hidden=!0);return}const c=Math.round(n.size/1024);s&&(s.textContent=`${n.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const i=URL.createObjectURL(n);o&&(o.onload=()=>URL.revokeObjectURL(i),o.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}Cu(n).then(i=>{if(a.launchCoinDraft={...a.launchCoinDraft||{},imageDataUrl:i,imageName:n.name,imageType:ml(i,n.type||"application/octet-stream")},String(i).length<15e5)try{pr(a.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const n=Le(),r=t.getAttribute("data-terminal-filter-social"),o=t.getAttribute("data-terminal-filter-quote"),s=t.getAttribute("data-terminal-filter-audit");r&&(n.socials[r]=!!t.checked),o&&(n.quotes[o]=!!t.checked),s&&(n.audits[s]=!!t.checked),n.open=!0,Y("live"),Y("launch"),Y("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(qo(),a.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(a.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await $b(t),t?.matches?.("[data-avatar-file]")&&await Cb(t)}),document.addEventListener("focusout",()=>{setTimeout(Bc,50)});let ka=null;const Fp=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const n=String(e.target.value||"");let r=n.replace(/[^0-9.]/g,"");const o=r.indexOf(".");if(o!==-1&&(r=r.slice(0,o+1)+r.slice(o+1).replace(/\./g,"")),r!==n){const s=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(s-(n.length-r.length),s-(n.length-r.length))}catch{}}}ka&&clearTimeout(ka),ka=setTimeout(()=>{ka=null,qn({silent:!0})},350)}};document.addEventListener("input",Fp),document.addEventListener("change",Fp),document.addEventListener("click",()=>{ka&&(clearTimeout(ka),ka=null,qn({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){a.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),Bo();return}if(t?.matches?.("[data-trade-token]")){const n=String(t.value||"").trim();a.tradeToken=n,a.tradeSwapTo=n;return}if(t?.matches?.("[data-terminal-filter-field]")){const n=t.getAttribute("data-terminal-filter-field"),r=Le();(n==="keywords"||n==="excludeKeywords")&&(r[n]=String(t.value||""),r.open=!0,Rd());return}if(t?.matches?.("[data-launch-ticker]")){const n=Le();n.keywords=String(t.value||""),n.open=!0,Rd();return}if(t?.matches?.("[data-smart-chart-zoom]")){a.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const n=t.closest(".smart-chart-zoom")?.querySelector("strong");n&&v(n,`${a.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(a.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(qo(),t.type==="range"&&h({force:!0}))});function lr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",n=Ic(t,{forcePaint:!0});Bc(),!n&&e?.persisted&&a.route==="terminal"&&h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),ea&&window.clearTimeout(ea),ea=window.setTimeout(()=>{if(ea=null,!(document.hidden||a.route!=="terminal")){if(In()){E({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:a.postTradeRefresh?.attemptId||"",details:a.activeTab||"terminal"});return}Q(a.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),a.user&&a.token&&Ln("positions")&&ft({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:as}).catch(()=>{}),ia(),Mn(),Er(),Us()}},$i)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(a.ogreAgentListening||a.ogreAgentSpeechRecognizer)&&Ht("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(a.ogreAgentOpen&&(a.ogreAgentListening||a.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!a.ogreAgentListening&&!a.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&lr()},$i+900);return}lr()}),window.addEventListener("focus",lr),window.addEventListener("pageshow",lr),window.addEventListener("online",lr),window.addEventListener("pagehide",()=>{ea&&(window.clearTimeout(ea),ea=null),a.clipFarm?.recording&&Wn()});function tS(){vs&&window.clearInterval(vs),vs=window.setInterval(()=>{document.hidden||Ic("watchdog")},im)}const aS=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Chart & Swap",items:[["smartChart","Smart Chart"],["trade","Slime Swap"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}],nS={terminal:"📡",live:"🍳",liveTrades:"⚡",smartChart:"📈",trade:"🔄",slimeScope:"🔭",watchlist:"⭐",kol:"👑",sniper:"🎯",txAudit:"🧾",tek:"🧰",ogreAi:"🤖",launchCoin:"🚀",bundle:"📦",volume:"🌀",launch:"👀",wallets:"👛",positions:"💼",pnl:"📊",profile:"🐸"},rS={live:"📡",chart:"📈",intel:"🔭",tools:"🧰",portfolio:"💼",profile:"🐸"};function oS(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=aS.map(n=>`
    <div class="nav-drop-group" data-nav-drop-group="${l(n.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${rS[n.key]||"•"}</span>
        <span class="nav-side-label">${l(n.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${n.items.map(([r,o])=>`
          <button type="button" data-tab="${l(r)}" title="${l(o)}">
            <span class="nav-side-icon" aria-hidden="true">${nS[r]||"•"}</span>
            <span class="nav-side-label">${l(o)}</span>
          </button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",n=>{const r=n.target.closest(".nav-side-group-toggle");if(r){const o=r.parentElement,s=o.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(c=>c.setAttribute("aria-expanded","false")),s||(o.classList.add("is-open"),r.setAttribute("aria-expanded","true"));return}n.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))}),document.addEventListener("click",n=>{n.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function sS(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(n=>{const r=!!n.querySelector(`[data-tab="${a.activeTab}"]`);n.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),n.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(n=>{n.dataset.active=n.dataset.tab===a.activeTab?"true":"false"})}function lS(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const o=((await fetch("/?build-check=1",{cache:"no-store"}).then(s=>s.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";o&&!e.includes(o)&&iS()}catch{}},300*1e3).unref?.()}function iS(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function cS(){oS(),lS(),Dm(),Vm(),Km(),$s(),Hm(),a.route==="intro"?Um():fn({reset:!0}),wh(),tS(),Ts(),Pl(),await ff(),h(),await yf(),Ob(),a.route==="terminal"&&(Ua({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),a.activeTab==="ogreTek"&&await sr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))}cS();function $t(e){a.pumpLiveStatus=e,a.pumpLiveLastActionAt=Date.now(),h()}function uS(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():a.launchCoinDraft||{},t=Tu(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function dS(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const n=t.getAttribute("data-pump-live-action"),r=uS(),o=r.tokenMint;if(!o){$t("Paste or launch a CA first, then Pump Live can attach to it.");return}if(n==="chart"){typeof yt=="function"?(yt(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),$t("Opened Pump chart with transactions inside Slime.")):$t("Chart panel is still loading. Try again in a moment.");return}if(n==="copy"){const s=Pu(o);navigator.clipboard?.writeText(s).then(()=>$t("Copied Pump Live stream route ID."),()=>$t("Stream route ID ready: "+s));return}if(n==="obs"){const s=pl()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";$t(s);return}if(n==="end"){$t("Pump Live ended for this launch. Chart and transactions stay available.");return}if(n==="go"){if(!pl()){$t("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}$t("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",dS);function Vt(e){const t=String(e??"");return typeof l=="function"?l(t):t.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function ii(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:a.smartChartToken||{}}function ci(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function pS(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function Jo(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function Wp(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const n of t){const r=Jo(n);if(Number.isFinite(r)&&r>0)return r}return NaN}function mS(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const n=Number(t);if(Number.isFinite(n))return n<1e11?n*1e3:n;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function fS(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function hS(e,t,n){if(!n.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(o=>String(o||"").toLowerCase()).join(" ");return n.some(o=>r.includes(o))}function gS(e=""){return String(e||"").split("").reduce((t,n)=>t*31+n.charCodeAt(0)>>>0,17)}function bS(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(Jo).filter(o=>Number.isFinite(o)&&o>0);if(t.length)return t[0];const n=typeof Dt=="function"?Number(Dt(e)):NaN;if(Number.isFinite(n)&&n>0)return Math.max(1,n*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function QS(e){const t=ii(e),n=ci(t)||t.symbol||t.name||"slime",r=bS(t),o=gS(n),s=Math.max(1,Jo(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,Jo(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),i=typeof Dt=="function"?Math.max(0,Math.min(100,Number(Dt(t))||0)):0,u=Math.max(-8,Math.min(18,c/s*18+i/12)),d=Date.now();return Array.from({length:34},(m,f)=>{const y=(f+o%13)/4.2,b=Math.sin(y)*(3.5+o%7*.28),S=(f/33-.5)*u,P=((o>>f%11&7)-3)*.32,T=Math.max(1e-7,r*(1+(b+S+P)/100));return{row:{...t,snapshotFallback:!0},value:T,time:d-(33-f)*15e3,side:"snapshot"}})}function Np(e){const t=ii(e),n=[ci(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,i,u)=>c.length>=3&&u.indexOf(c)===i),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:a.liveTrades},{direct:!1,rows:a.liveTradeRows},{direct:!1,rows:a.tradeTape},{direct:!1,rows:a.recentTrades},{direct:!1,rows:a.pumpTrades},{direct:!1,rows:a.pumpActivity},{direct:!1,rows:a.livePairs},{direct:!1,rows:a.livePairsRows},{direct:!1,rows:a.freshPairs},{direct:!1,rows:a.slimeScopePairs}],o=[];for(const c of r){const i=fS(c.rows).slice(-350);for(const u of i){if(!u||typeof u!="object"||!c.direct&&!hS(u,t,n))continue;const d=Wp(u);if(!Number.isFinite(d)||d<=0)continue;const m=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();o.push({row:u,value:d,time:mS(u),side:m.includes("sell")?"sell":m.includes("buy")?"buy":"trade"})}}const s=Wp(t);return Number.isFinite(s)&&s>0&&o.push({row:t,value:s,time:Date.now(),side:"snapshot"}),o.sort((c,i)=>c.time-i.time).filter((c,i,u)=>i===0||c.time!==u[i-1].time||c.value!==u[i-1].value).slice(-120)}function Yo(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function yS(){const e=String(a.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function vS(e={},t={}){const n=ii(e),r=ci(n),o=yS(),s=String(a.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(a.pumpChartTimeframe||"5m"),u=Np(n).slice(-70),d=!u.length||u.every(D=>D.side==="snapshot"||D.row?.snapshotFallback),m=u.map(D=>D.value),f=m.length?Math.min(...m):NaN,y=m.length?Math.max(...m):NaN,b=720,S=260,P=22,T=Number.isFinite(y-f)&&y!==f?y-f:1,g=D=>u.length<=1?b/2:P+D/(u.length-1)*(b-P*2),A=D=>S-P-(D-(Number.isFinite(f)?f:0))/T*(S-P*2),L=u.map((D,Fe)=>`${Fe?"L":"M"}${g(Fe).toFixed(1)},${A(D.value).toFixed(1)}`).join(" "),B=u.length>1?`${L} L${g(u.length-1).toFixed(1)},${S-P} L${g(0).toFixed(1)},${S-P} Z`:"",_=Math.max(4,Math.min(12,(b-P*2)/Math.max(u.length*2,1))),re=u.map((D,Fe)=>{const Tt=(u[Math.max(0,Fe-1)]||D).value,ue=D.value,Zo=Math.max(Tt,ue),es=Math.min(Tt,ue),cn=g(Fe),mi=A(Tt),fi=A(ue),_p=A(Zo),Up=A(es);return`<g class="slime-pump-candle ${ue>=Tt?"up":"down"}"><line x1="${cn.toFixed(1)}" y1="${_p.toFixed(1)}" x2="${cn.toFixed(1)}" y2="${Up.toFixed(1)}" /><rect x="${(cn-_/2).toFixed(1)}" y="${Math.min(mi,fi).toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(2,Math.abs(fi-mi)).toFixed(1)}" rx="2" /></g>`}).join(""),we=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",Qe=o==="dex"&&we?`<iframe class="slime-pump-dex-frame" src="${Vt(we)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${b} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${B}" />${s==="candles"?re:`<path class="slime-pump-line" d="${L}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${o==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(D=>`<button type="button" class="${o===D?"active":""}" data-slime-pump-source="${D}">${D==="slime"?"Slime":D==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${s==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${s==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(D=>`<button type="button" class="${c===D?"active":""}" data-slime-pump-time="${D}">${D}</button>`).join("")}
          ${d?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${Qe}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Vt(Yo(m[m.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Vt(Number.isFinite(f)&&Number.isFinite(y)?`${Yo(f)} - ${Yo(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Vt(d?"Slime snapshot":o==="slime"?"Slime default":o==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function wS(e={}){const t=Np(e).slice(-40).reverse(),n=t.map(r=>{const o=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),s=o<60?`${o}s`:`${Math.floor(o/60)}m`,c=r.row||{},i=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Vt(s)}</span><strong>${Vt(r.side)}</strong><span>${Vt(Yo(r.value))}</span><span>${Vt(pS(i))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${n||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function Dp(){a.slimePumpChartRendering||(a.slimePumpChartRendering=!0,requestAnimationFrame(()=>{a.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),n=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||n||r)&&(e.preventDefault(),e.stopPropagation(),t&&(a.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),n&&(a.pumpChartMode=n.getAttribute("data-slime-pump-mode")||"line"),r&&(a.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),Dp())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&Dp()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||a.activeTab!=="volume"||!(a.volumeBots||[]).some(t=>t.status!=="completed")||Gr()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const n=document.querySelector("[data-vbot-invest-num]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const n=document.querySelector("[data-vbot-invest]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-duration]")){const n=document.querySelector("[data-vbot-duration-label]");if(n){const r=Number(t.value);n.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const n=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function o(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function s(){return!!(a?.route==="terminal"&&n.has(String(a.activeTab||"terminal"))&&!document.hidden)}function c(){let m=0;const f=y=>{if(y){if(Array.isArray(y)){m+=y.length;return}if(Array.isArray(y.rows)){m+=y.rows.length;return}Array.isArray(y.data?.rows)&&(m+=y.data.rows.length)}};return f(a.livePairRows),f(a.slimeScopeRows),f(a.liveTradeRows),f(a.livePairs),Object.values(a.livePairsByBucket||{}).forEach(f),Object.values(a.terminalFeeds||{}).forEach(f),m}function i(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const m=[a.livePairsLastUpdatedAt,a.livePairsLastUpdatedByBucket?.[a.livePairBucket||"live"],a.terminalFeeds?.[a.activeTab||"terminal"]?.updatedAt,a.terminalFeeds?.[a.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return m.length?Date.now()-Math.max(...m)>3e4:!1}function d(m="empty-feed-watchdog"){if(!s()||o())return;const f=Date.now();if(f-t<dn)return;const y=c()===0&&!i();if(!y&&!u())return;t=f;const b=()=>typeof Ua=="function"?Ua({force:y,reason:m}):typeof Q=="function"?Q(a.activeTab||"terminal",{force:y,reason:m}):null;try{typeof j=="function"?j(b):Promise.resolve(b()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),dn),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),dn)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),dn)})})();const U={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[]};function ir(e){return new Promise(t=>{const n=setTimeout(t,e);U.timers.push(n)})}function ui(){if(U.root)return U.root;const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div data-trailer-bar-top style="position:absolute;top:0;left:0;right:0;height:54px;background:linear-gradient(rgba(2,7,2,0.9),transparent);"></div>
    <div data-trailer-bar-bottom style="position:absolute;bottom:0;left:0;right:0;height:110px;background:linear-gradient(transparent,rgba(2,7,2,0.92));"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:34px;transform:translateX(-50%);text-align:center;opacity:0;transition:opacity 0.45s;max-width:92vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(18px,2.6vw,30px);font-weight:900;letter-spacing:0.04em;text-shadow:0 0 18px rgba(114,255,35,0.65);"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,1.5vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.86);text-align:center;padding:20px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:10px;right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>pi("stopped")),document.body.appendChild(e),U.root=e,e}function Qo(e,t=""){const n=ui(),r=n.querySelector("[data-trailer-caption]");n.querySelector("[data-trailer-caption-main]").textContent=e,n.querySelector("[data-trailer-caption-sub]").textContent=t,r.style.opacity=e?"1":"0"}function di(e){const t=ui().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}async function SS(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});U.stream=e,U.chunks=[];const t=new MediaRecorder(e,{mimeType:MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm"});return t.ondataavailable=n=>{n.data?.size&&U.chunks.push(n.data)},t.start(1e3),U.recorder=t,e.getVideoTracks()[0]?.addEventListener("ended",()=>pi("screen-share-ended")),!0}catch{return!1}}function kS(){const e=U.recorder;if(!e)return;const t=()=>{try{const n=new Blob(U.chunks,{type:"video/webm"});if(n.size>0){const r=document.createElement("a");r.href=URL.createObjectURL(n),r.download=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.webm`,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),3e4)}}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();U.stream?.getTracks().forEach(n=>{try{n.stop()}catch{}}),U.recorder=null,U.stream=null}function pi(e="done"){U.running&&(U.running=!1,U.timers.forEach(t=>clearTimeout(t)),U.timers=[],kS(),U.root?.remove(),U.root=null)}function $S(){const e=a.livePairsByBucket?.live?.rows||a.livePairs?.rows||a.livePairRows||[];return[...e].filter(n=>n?.tokenMint).sort((n,r)=>(Number(r.volume5m)||0)-(Number(n.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(n.bestPickScore||n.score)||0))[0]||e[0]||null}async function TS(){if(U.running)return;U.running=!0,ui();const e=await SS();for(const r of e?[2,1]:[3,2,1]){if(!U.running)return;di(`<div style="color:#72ff23;font-size:96px;font-weight:900;text-shadow:0 0 28px rgba(114,255,35,0.7);">${r}</div>
      ${e?"":'<div style="color:#d6ffbf;font-size:15px;margin-top:8px;">start your screen recorder now</div>'}`),await ir(1e3)}if(di(""),!U.running||(ke("/terminal/live-pairs"),Qo("FRESH PAIRS - LIVE","new launches land here seconds after creation"),await ir(7e3),!U.running))return;const t=$S(),n=t?.symbol?`$${String(t.symbol).slice(0,12)}`:"live pair";if(t?.tokenMint){if(ke(`/terminal/chart?token=${encodeURIComponent(t.tokenMint)}`),Qo("LIVE CHART + RISK READ",`${n} - real candles, real flow, zero delay`),await ir(9e3),!U.running)return;Kd(t.tokenMint),Qo("TRIPLE-ENGINE SHIELD","SlimeShield x Rugcheck x GoPlus - before you ape"),await ir(7e3),_l()}U.running&&(Qo(""),di(`
    <div style="color:#72ff23;font-size:clamp(34px,6vw,72px);font-weight:900;letter-spacing:0.05em;text-shadow:0 0 30px rgba(114,255,35,0.7);">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(14px,2.2vw,22px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:12px;margin-top:26px;">Recorded on live market data. Crypto is risky - not financial advice.</div>
  `),await ir(4200),pi("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),U.running||TS())});
