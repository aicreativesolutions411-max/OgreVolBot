import{canSubmitPerpOrder as bp,createPerpsProvider as yp,ogreTekRouteStatus as vp,resolveOgreTekConfig as wp,shouldShowOgreTekNav as Sp,validatePerpOrder as kp}from"./perps.js";import{smartChartSuggestion as $p,tradeActionLabelFromPreset as Tp}from"./liveTerminalUi.js";const wa=window.OGRE_PORTAL_CONFIG||{},Pp=wa.featureFlags||{};function W(e,t=!0){const n=Pp?.[e];return n==null||n===""?!!t:typeof n=="boolean"?n:["1","true","yes","on"].includes(String(n).toLowerCase())}const Vt=wa.pumpLive||{},Se=wp(wa),Ap=!1,nr=yp(Se),Cp=String(wa.apiBase||"").trim().replace(/\/+$/,""),Lp=window.location.origin.replace(/\/+$/,""),Zl="https://ogrevolbot.onrender.com",wt=String(wa.shareUrl||wa.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",ei=[Cp,window.location.hostname.endsWith("onrender.com")?Lp:"",Zl].filter(Boolean);let rr=ei[0]||Zl;const sn=6e4,Vo=15e3,zt=1e4,zo=8e3,ln=8e3,ti=new Map,Mp=new Map,it=Mp,jt=new Set,or=new Map,Vw=new Map,cn={},Q=18e4,jo="slimewireMobileWalletPending",Go="slimewireMobileWalletPendingBackup",xp="slimewireMobileWalletSession:",ai="slimewirePerfLog",ni="slimewireCrashLog",Bp="slimewireTerminalFeedLog",ri="slimewireOgreAiRecentMints",oi="slimewireOgreAiFormPreset",Rp=150,Ip=1500,Op=1e4,Ep=140,si="live-pairs-inflight",Fp=[1200,4500,1e4],Wp=15e3,li=650,Np=3500,_p=12e3,Dp=3e4,Up=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],ii="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",qp=new Map([...ii].map((e,t)=>[e,t]));function Hp(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function un(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function Xo(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function ci(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function ui(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function Jo(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function Kp(){try{const e=JSON.parse(window.localStorage?.getItem(ai)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function Vp(){try{const e=JSON.parse(window.localStorage?.getItem(ni)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function di(){try{const e=JSON.parse(window.sessionStorage?.getItem(ri)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function zp(e){const t=[...Array.isArray(e?.plans)?e.plans.map(o=>o?.tokenMint||o?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(o=>o?.tokenMint):[]].map(o=>String(o||"").trim()).filter(Boolean);if(!t.length)return;const n=new Set,r=[...di(),...t].filter(o=>n.has(o)?!1:(n.add(o),!0)).slice(-30);try{window.sessionStorage?.setItem(ri,JSON.stringify(r))}catch{}}function pi(){try{const e=JSON.parse(window.sessionStorage?.getItem(oi)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function jp(e={}){try{window.sessionStorage?.setItem(oi,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function mi(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),n=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(n||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function Gp(){try{return JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{return{}}}function fi(e){try{window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(e||{}))}catch{}}function Xp(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function Jp(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function Yp(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const hi="slimewireIntroCompleteV1";function gi(){try{return window.sessionStorage?.getItem(hi)==="true"}catch{return!1}}function Qp(){try{window.sessionStorage?.setItem(hi,"true")}catch{}}function dn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const a={token:Hp(),user:null,route:Ra(window.location.pathname),activeTab:window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:Kp(),crashLog:Vp(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:Gp(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:Xp(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:ci(),loginCollapsed:!0};let Sa=null,sr="";const Yo=new Set;let ka=null,lr="",$a=null,ir="",Gt=null,Ta=null,Ye=0,Pa=null,cr="",Aa=null,ur="",dr=null,St=[],pr=null,mr=null,fr=!1,pn=[],Qo=null,Xt=null,Jt=null,mn=null,Zo="",bi=0,Zp=0,es=0,hr=null;const gr=new Map,ts={},Yt=new Map,Ca=[];let as=null,ns=null,rs=null,os=null,ss=null,ls=0,is=new Set,cs=null,Qt=null,br=null,us=null,yi=Date.now();function La(){return!!(a.slimeShieldDetails?.open||a.devInfoDetails?.open||a.kolDumpDetails?.open||a.replayDetails?.open)}function Ma(){Sa&&clearTimeout(Sa),Sa=null,sr=""}function yr(){La()||(sa(),xa("details-close"))}function em(e,t){const n=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const i=n(c);i&&!r.has(i)&&r.set(i,c)}let o=e.querySelector(":scope > .signal-header")||null;const s=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const i=n(c);let u=i?r.get(i):null;u?(s.add(i),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,o?o.nextElementSibling!==u&&o.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),o=u}for(const[c,i]of r)s.has(c)||i.remove()}function tm(e,t){const n=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!n?e.insertBefore(r,e.firstChild):n&&!r?n.remove():n&&r&&n.innerHTML!==r.innerHTML&&(n.innerHTML=r.innerHTML);for(const o of["[data-cooks-best]","[data-cooks-newest]"]){const s=e.querySelector(`:scope > ${o}`),c=t.querySelector(`:scope > ${o}`);if(!c){s&&s.remove();continue}if(!s)return!1;const i=s.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");i&&u&&i.innerHTML!==u.innerHTML&&(i.innerHTML=u.innerHTML);const d=s.querySelector(":scope > .signal-list"),m=c.querySelector(":scope > .signal-list");d&&m?em(d,m):d!==m&&s.replaceWith(c)}return!0}function am(){if(a.activeTab!=="live"&&a.activeTab!=="terminal")return!1;const e=p("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const n=We(),r=he(n?.rows||[]),o=Za(r);if(!o.length)return!1;const s=En(),c=[];if(s){const m=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<m){const b=f.getAttribute("data-token-chart")||"";if(b&&c.push({mint:b,top:y}),c.length>=6)break}}}const i=document.createElement("div");i.innerHTML=Nl(o);const u=i.querySelector(".cooks-feed");if((!u||!tm(t,u))&&(t.outerHTML=Nl(o)),s&&c.length){const m=e.querySelector(".cooks-feed");for(const f of c){const y=m?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const b=y.getBoundingClientRect().top-f.top;Number.isFinite(b)&&Math.abs(b)>1&&window.scrollBy(0,b);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const m=$t.find(([f])=>f===a.livePairBucket)?.[1]||"Live";d.textContent=`${m} | ${o.length} live`}return!0}function xa(e="live-pairs-batch"){if(e&&is.add(String(e)),ss||ls)return;const t=()=>{const n=Array.from(is);if(ss=null,is=new Set,ls=0,a.route!=="terminal"||!["terminal","live","slimeScope"].includes(a.activeTab)||La()||(E({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(We()?.rows)?We().rows.length:0,details:n.length?n.slice(-3).join(" | "):e}),(a.activeTab==="live"||a.activeTab==="terminal")&&am()))return;const r=qs();h(),Hs(r)};ss=window.setTimeout(()=>{ls=window.requestAnimationFrame(t)},Ep)}const p=e=>document.querySelector(e);function z(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const w=(e,t)=>{e&&(e.textContent=t)},Me=(e,t)=>{w(p(e),t)},kt=(e,t)=>{const n=p(e);n&&(n.hidden=t)},re=p("[data-app]"),fn=p("[data-login]"),vi=p("[data-connect]"),ds=p("[data-top-login]"),$e=p("[data-login-modal]"),wi=p("[data-auth-actions]"),Si=p("[data-guest-actions]"),ki=p("[data-session-actions]"),Z=p("[data-dashboard]"),nm=p("[data-error]"),rm=p("[data-dashboard-error]");function ee(e){if(!W("debugPerformanceCounters",!1))return;const t=String(e||"counter");cn[t]=Number(cn[t]||0)+1,(cn[t]<=5||cn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,cn[t])}const $t=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],om=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],ps=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],Ba=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],sm=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],lm=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],im=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],cm=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],um=Object.fromEntries(cm.map(e=>[e.tabKey,e])),dm=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function $i(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function Ti(e,t=""){const n=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return $i(n)===$i(t)}function pm(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!Ti(e,t))return t;const n=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return n.includes("phantom")?Ea("phantom"):n.includes("solflare")?Ea("solflare"):n.includes("wallet")||n.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":n.includes("powered-by")||n.includes("wordmark")||n.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":Dl(e?.alt||n||"slimewire")}function Pi(e,t="",n="fallback"){try{console.info("[slimewire_image_fallback]",{action:n,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function mm(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const n=pm(t);if(!n||Ti(t,n)){t.hidden=!0,Pi(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=n,Pi(t,n,"fallback")}function ms(){ms.installed||(ms.installed=!0,document.addEventListener("error",mm,!0))}function fs(){if(!fs.started){fs.started=!0;for(const e of dm)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function Ra(e=window.location.pathname){return(e==="/"||e==="")&&gi()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function fm(){if(gi()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let hn=null;function hs(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(hn||(hn=new e),hn.state==="suspended"&&hn.resume().catch(()=>{}),hn):null}catch{return null}}function hm(){const e=hs();if(!(!e||e.state!=="running"))try{const t=e.currentTime,n=1.7,r=Math.floor(e.sampleRate*n),o=e.createBuffer(1,r,e.sampleRate),s=o.getChannelData(0);for(let f=0;f<r;f+=1)s[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=o;const i=e.createBiquadFilter();i.type="bandpass",i.Q.value=.7,i.frequency.setValueAtTime(280,t),i.frequency.exponentialRampToValueAtTime(3400,t+.55),i.frequency.exponentialRampToValueAtTime(170,t+n);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+n),c.connect(i).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const m=e.createGain();m.gain.setValueAtTime(1e-4,t),m.gain.exponentialRampToValueAtTime(.38,t+.08),m.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(m).connect(e.destination),c.start(t),c.stop(t+n),d.start(t),d.stop(t+1.2)}catch{}}function gm(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),n=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let o=!1,s=null;const c=()=>a.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),i=b=>{t&&(t.dataset.introPhase=b)},u=b=>{r&&(r.textContent=b,r.hidden=!b)},d=()=>{o||(o=!0,s&&(clearTimeout(s),s=null),i("portal"),hm(),Qp(),setTimeout(()=>{dn({reset:!0}),xe("/connect")},620))};if(!c()){dn({reset:!0});return}const m=()=>{o||(hs(),n&&n.muted&&(n.muted=!1,n.volume=1,n.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(b=>{document.addEventListener(b,m,{once:!0,passive:!0})}),n&&(n.preload="auto",n.playsInline=!0,n.autoplay=!0,n.setAttribute("autoplay",""),n.setAttribute("playsinline",""),n.disablePictureInPicture=!0,!n.getAttribute("src")&&n.dataset.introSrc&&(n.src=n.dataset.introSrc));const f=b=>{s&&clearTimeout(s),s=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,b)))},y=()=>{if(o||!c())return;const b=S=>{if(!n)return;n.muted=S,n.volume=S?0:1;const T=n.play?.();T?.catch&&T.catch(()=>{S?u(""):b(!0)})};hs(),b(!1)};n?.addEventListener("loadedmetadata",()=>{const b=Number(n.duration);f(Number.isFinite(b)&&b>0?(b+2.5)*1e3:9e3)}),n?.addEventListener("ended",d),n?.addEventListener("error",()=>{f(1500)}),f(9e3),y()}function Ai(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function gs({keepLogin:e=!1}={}){a.walletConnectMenuOpen=!1,e||(a.loginModalOpen=!1),a.quickBuyModal?.open&&(a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""}),Bn()}function xe(e,t=null){const n=C(),r=e||"/terminal";a.route=Ra(r),gs({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.route==="terminal"&&(a.activeTab=t||Ai(r)),a.route!=="intro"&&dn({reset:!0}),window.history.pushState({},"",r),hl(),h(),U("route-change",n,{component:"router",details:r})}window.addEventListener("popstate",()=>{a.route=Ra(),gs({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.activeTab=Ai(),a.route!=="intro"&&dn({reset:!0}),hl(),h()});let Ci=!1;function bs(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function vr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),bs()}function bm(e){if(!e)return;const t=!e.open;if(vr(e),e.open=t,t){const n=e.closest("[data-market-ticker]"),o=e.querySelector("summary")?.getBoundingClientRect?.();if(n&&o){const s=Math.max(10,Math.min(window.innerWidth-10,o.left+o.width/2)),c=Math.max(30,o.bottom+4);n.style.setProperty("--ticker-menu-left",`${Math.round(s)}px`),n.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}bs()}function ym(){Ci||(Ci=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){vr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>vr(),80);return}const n=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");n&&(e.preventDefault(),e.stopPropagation(),bm(n.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&bs()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&vr()}))}function Zt(e){return`${rr}${e}`}function C(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function ea(e){try{window.performance?.mark?.(e)}catch{}}function be(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function Li(e={}){Ca.push(e),Ca.length>10&&Ca.splice(0,Ca.length-10),!as&&(as=window.setTimeout(()=>{as=null;const t=Ca.splice(0,Ca.length);for(const n of t)try{const r=JSON.stringify(n);if(navigator.sendBeacon){const o=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(Zt("/api/web/perf-event"),o))continue}fetch(Zt("/api/web/perf-event"),{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function ys(e,t,n){if(n==="perf"&&ns||n==="crash"&&rs||n==="feed"&&os)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},o=window.setTimeout(()=>{n==="perf"&&(ns=null),n==="crash"&&(rs=null),n==="feed"&&(os=null),r()},Ip);n==="perf"&&(ns=o),n==="crash"&&(rs=o),n==="feed"&&(os=o)}function E(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&ee("slowApiRequestWarning");const n={at:new Date().toISOString(),route:be(e.route||a.route||Ra(),40),component:be(e.component||"",60),action:be(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:be(e.requestId||"",80),errorCode:be(e.errorCode||"",60),details:be(e.details||"",140)};return a.perfLog=[...a.perfLog||[],n].slice(-100),ys(ai,()=>a.perfLog,"perf"),(n.durationMs>=Rp||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(n.action))&&Li(n),n}function U(e,t,n={}){E({...n,action:e,durationMs:C()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",n=""){ea("chartFirstPaint"),E({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!Ge(n)?.cacheHit,stale:!!Ge(n)?.stale,details:`${be(t,20)}:${be(n,60)}`})};function vs(e={}){const t={at:new Date().toISOString(),route:be(e.route||a.route||Ra(),40),actionBeforeCrash:be(e.actionBeforeCrash||a.postTradeRefresh?.action||"",70),errorCode:be(e.errorCode||e.name||"FRONTEND_ERROR",60),message:be(e.message||"",160),component:be(e.component||"",80),requestId:be(e.requestId||a.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return a.crashLog=[...a.crashLog||[],t].slice(-50),ys(ni,()=>a.crashLog,"crash"),Li({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function vm(){a.crashInstrumentationInstalled||(a.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||vs({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};vs({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function ct(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function ws(e="",t="",n=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(n||"").trim()}`}function Qe(e="",t="",n=""){const r=ws(e,t,n),o=a.tradeActionLocks?.[r];return o&&["clicked","submitting","submitted","confirming"].includes(o.state)?o:null}function q(e="",t="",n="",r={}){const o=ws(e,t,n),s=a.tradeActionLocks?.[o]||{};a.tradeActionLocks={...a.tradeActionLocks||{},[o]:{...s,action:e,tokenMint:t,detail:n,updatedAt:new Date().toISOString(),...r}},oe()}function Te(e="",t="",n="",r=2400){const o=ws(e,t,n);window.setTimeout(()=>{const s=a.tradeActionLocks?.[o];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const c={...a.tradeActionLocks||{}};delete c[o],a.tradeActionLocks=c,oe(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},r)}function wr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function Ss(e="",t=""){const n=a.manualSellActions?.[wr(e,t)];return n&&["clicked","submitting","submitted","confirming"].includes(n.state)?n:Object.entries(a.manualSellActions||{}).find(([r,o])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(o?.state))?.[1]||null}function ta(e,t,n={}){const r=wr(e,t),o=a.manualSellActions?.[r]||{};a.manualSellActions={...a.manualSellActions||{},[r]:{...o,tokenMint:e,percent:String(t||o.percent||"100"),updatedAt:new Date().toISOString(),...n}},oe()}function ks(e,t,n=2400){const r=wr(e,t);window.setTimeout(()=>{const o=a.manualSellActions?.[r];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const s={...a.manualSellActions||{}};delete s[r],a.manualSellActions=s,oe(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},n)}function Ia(e,t={}){const n=C(),r=t.startedAt||a.positionRefreshAction?.startedAt||n;a.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(a.positionRefreshAction?.minUntil||0,n+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},oe()}function Ue(e,t={}){const n=a.positionRefreshAction?.minUntil||0,r=Math.max(0,n-C());pr&&window.clearTimeout(pr),pr=window.setTimeout(()=>{pr=null,Ia(e,t),h(),e==="success"&&window.setTimeout(()=>{a.positionRefreshAction?.state==="success"&&(a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},oe(),h())},900)},r)}function Tt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function oe(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(s=>{const c=s.dataset.positionSell||"",i=s.dataset.positionSellPercent||"",u=Ss(c,i),d=Tt(s),m=a.manualSellActions?.[wr(c,i)],f=!!u;s.disabled=f,s.dataset.actionState=m?.state||u?.state||"idle",f?m?.state==="submitted"||m?.state==="confirming"?s.textContent="Submitted":s.textContent="Selling...":s.textContent=d});const e=String(a.tradeToken||p("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(s=>{const c=s.dataset.tradeBuyQuick||(s.matches("[data-trade-buy-max]")?"max":"custom"),i=Qe("trade-buy",e,c),u=Tt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(s=>{const c=s.dataset.quickTradeToken||"",i=Et(),u=De(i)||i?.amountSol||"quick",d=Qe("trade-buy",c,String(u)),m=Tt(s);s.disabled=!!d,s.dataset.actionState=d?.state||"idle",s.textContent=d?d.state==="submitted"?"Submitted":"Buying...":m}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(s=>{const c=s.dataset.tradeSellQuick||"custom",i=Qe("trade-sell",e,c),u=Tt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(s=>{const c=s.dataset.chartConfirmBuy||a.smartChartToken||"",i=j(p("[data-chart-buy-amount]")?.value||"")||"custom",u=Qe("trade-buy",c,String(i)),d=Tt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(s=>{const c=s.dataset.chartConfirmSell||a.smartChartToken||"",i=p("[data-chart-sell-percent]")?.value||"100",u=Ss(c,i),d=Tt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(a.bundleToken||p("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(s=>{const c=s.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",i=Qe(c,t,"bundle"),u=Tt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const n=(s,c)=>{const i=Tt(s),u=s.matches?.("[data-top-refresh-wallet]");if(s.dataset.actionState=c,s.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){s.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",s.textContent=i||"Refresh";return}c==="clicked"||c==="refreshing"?s.textContent="Refreshing...":c==="success"?s.textContent="Updated":c==="error"?s.textContent="Failed":s.textContent=i},r=a.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(s=>{n(s,r)});const o=a.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(s=>{n(s,o)})}function wm(){if(!a.perfInstrumentationInstalled){a.perfInstrumentationInstalled=!0,ea("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries())Number(n.duration||0)<50||E({component:"main-thread",action:"long-task",durationMs:n.duration,details:n.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries()){const r=Number(n.duration||0);r<80||E({component:"input",action:"interaction-delay",durationMs:r,details:n.name||n.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Fe(e){return new Promise(t=>setTimeout(t,e))}function N(e="",t={}){const n=String(e||"");return t.preserveSafeError?n:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(n)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":n}async function gn(e,t={},n=sn){const r=new AbortController,o=setTimeout(()=>r.abort(),n);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(o)}}async function Mi(e){try{await gn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:n=sn,preserveSafeError:r=!1,dedupe:o=!0,...s}=t||{},c=String(s.method||"GET").toUpperCase(),i=C(),u=o&&c==="GET"?`${c}:${e}:${a.token?a.token.slice(0,12):"guest"}`:"";if(u&&Yt.has(u))return ee("duplicateApiRequestsPrevented"),E({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),Yt.get(u);const d=(async()=>{const m={"Content-Type":"application/json",...s.headers||{}};a.token&&(m.Authorization=`Bearer ${a.token}`);let f,y=null;try{f=await gn(Zt(e),{...s,headers:m,cache:"no-store"},n)}catch(S){y=S,await Mi(rr),await Fe(900);try{f=await gn(Zt(e),{...s,headers:m,cache:"no-store"},n)}catch(T){y=T;for(const A of ei)if(A!==rr)try{await Mi(A),f=await gn(`${A}${e}`,{...s,headers:m,cache:"no-store"},n),rr=A;break}catch(g){y=g}if(!f){const A=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${A} SlimeWire could not connect right now. Try again in a moment.`)}}}const b=await xi(f);if(!f.ok||b.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(b.launchAttemptId||b.launch?.launchAttemptId),T=N(b.message||b.launch?.failureReason||b.error||`HTTP ${f.status}`,{preserveSafeError:S}),A=new Error(T);throw A.status=f.status,A.data=b,A.code=b.errorCode||b.launch?.errorCode||b.error||"",A.stage=b.stage||b.launch?.stage||"",A.launchAttemptId=b.launchAttemptId||b.launch?.launchAttemptId||"",A.providerStatus=b.providerStatus||b.launch?.providerStatus||null,f.status===401&&Em(T),A}return U("api-request",i,{component:"api",details:e,resultCount:Array.isArray(b?.rows)?b.rows.length:0}),b})();return u&&(Yt.set(u,d),d.then(()=>{Yt.get(u)===d&&Yt.delete(u)},()=>{Yt.get(u)===d&&Yt.delete(u)})),d}async function xi(e){const t=e.headers.get("content-type")||"",n=await e.text();if(!n.trim())return{};try{return JSON.parse(n)}catch{const r=n.toLowerCase(),o=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:o?"payload_too_large":"invalid_api_response",message:o?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function Sm(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function ue(e){e&&(a.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(a.xHandle=je(e.xHandle),a.xHandle?ui(a.xHandle):Jo()):a.xHandle||(a.xHandle=ci()))}function Sr(e){for(const t of e){const n=yn(t);if(n&&!n.closest("[hidden]"))return String(n.value||"")}for(const t of e){const n=p(t);if(n)return String(n.value||"")}return""}function bn(){const e=p("[data-connect-status]");return e&&!e.closest("[hidden]")?e:yn("[data-login-status]")||e}function yn(e){const t=[...document.querySelectorAll(e)];return t.find(n=>!n.closest("[hidden]")&&n.offsetParent!==null)||t.find(n=>!n.closest("[hidden]"))||t[0]||null}function vn(){return yn("[data-wallet-connect-modal] [data-wallet-connect-status]")||yn("[data-wallet-connect-status]")}function te(e=""){a.walletConnectStatus=String(e||""),w(vn(),a.walletConnectStatus)}function Bi(e="solana"){const t=Ie(e);return qe()?Sn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:Ni(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Pt(e="solana",t=null,n={}){const r=de(e),o={walletName:Ie(e,r),userId:a.user?.id||"",route:a.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...n};try{console.warn("[slimewire_wallet_connect]",o)}catch{}}function Ri(e=a.route==="connect"){window.setTimeout(()=>{const t=a.loginModalOpen?`[data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";yn(t)?.focus?.()},0)}function km(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(Qo=e)}function $m(){const e=Qo;Qo=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function Ii({restoreFocus:e=!0}={}){const t=!!a.loginModalOpen;a.loginCollapsed=!0,a.loginModalOpen=!1,h({force:!0}),t&&e&&$m()}function Tm(){return!$e||$e.hidden||!a.loginModalOpen?[]:[...$e.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function Pm(e){if(!a.loginModalOpen||e.key!=="Tab"||!$e||$e.hidden)return!1;const t=Tm();if(!t.length)return!1;const n=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===n?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),n.focus({preventScroll:!0}),!0):!1}function Oa(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Am(e=Oa()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function Oi(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Cm(e="unknown"){const t=Date.now();if(t-Number(a.lastLockInClickAt||0)<300)return;a.lastLockInClickAt=t;const n={route:Oi(a.route||Ra(),40),viewport:Math.round(window.innerWidth||0),source:Oi(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(n),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",n)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(n)}).catch(()=>{})}catch{}}function Ei({defaultTab:e="login",returnTo:t=Oa(),source:n="unknown",connectPanel:r=a.route==="connect"}={}){if(km(),Cm(n),a.loginModalOpen=!0,a.loginModalTab=e==="create"?"create":"login",a.loginReturnTo=t||Oa(),a.loginCollapsed=!1,a.walletConnectMenuOpen=!1,!$e&&!ds){window.location.assign(Am(a.loginReturnTo));return}h({force:!0}),Ri(r)}function Fi(e={}){Ei(e)}function qe(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function Wi(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Lm(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function Ni(e=""){if(!qe())return"";const t=encodeURIComponent(Wi()),n=encodeURIComponent(Lm());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${n}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${n}`:""}function $s(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Ea(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function Ts(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let n=0n;for(const o of t)n=(n<<8n)+BigInt(o);let r="";for(;n>0n;){const o=Number(n%58n);r=ii[o]+r,n/=58n}for(const o of t){if(o!==0)break;r="1"+r}return r||"1"}function kr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let n=0n;for(const o of t){const s=qp.get(o);if(s===void 0)throw new Error("Invalid wallet callback encoding.");n=n*58n+BigInt(s)}const r=[];for(;n>0n;)r.unshift(Number(n&255n)),n>>=8n;for(const o of t){if(o!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Mm(e="phantom",t="",n=a.walletConnectReturnPath||"/terminal",r=""){const o=new URL(n||window.location.pathname||"/terminal",window.location.origin);return o.searchParams.delete("sw_wallet"),o.searchParams.delete("sw_wallet_state"),o.searchParams.delete("sw_wallet_pending"),o.searchParams.delete("phantom_encryption_public_key"),o.searchParams.delete("solflare_encryption_public_key"),o.searchParams.delete("nonce"),o.searchParams.delete("data"),o.searchParams.delete("errorCode"),o.searchParams.delete("errorMessage"),o.searchParams.set("sw_wallet",e),o.searchParams.set("sw_wallet_state",t),r&&o.searchParams.set("sw_wallet_pending",r),o.toString()}function wn(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function _i(){try{const e=window.sessionStorage?.getItem(jo)||window.localStorage?.getItem(Go)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function xm(e){try{window.sessionStorage?.setItem(jo,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(Go,JSON.stringify(e))}catch{}}function Ps(){try{window.sessionStorage?.removeItem(jo)}catch{}try{window.localStorage?.removeItem(Go)}catch{}}function Di(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function Sn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function Bm(e="",t={}){const n=Sn(e);if(!n)return"";const r=new URL(n);return r.searchParams.set("app_url",Wi()),r.searchParams.set("redirect_link",Mm(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function aa(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":qe()?"mobile":"desktop"}function Ui(e=""){return qe()&&!!Sn(e)}function Rm(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Im(e="",t="/terminal"){try{const n=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:sn,body:JSON.stringify({provider:e,intendedRoute:t,platform:aa(),browser:Rm()})});return!n.pendingConnectId||!n.stateId||!n.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:n.pendingConnectId,stateId:n.stateId,returnPath:n.intendedRoute||t,dappEncryptionPublicKey:n.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:n.expiresAt||"",serverManaged:!0}}catch(n){return Pt(e,n,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:aa()}),null}}function Om(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const n=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:Ts(r),returnPath:t,dappEncryptionPublicKey:Ts(n.publicKey),dappEncryptionSecretKey:Ts(n.secretKey),createdAt:Date.now(),serverManaged:!1}}async function qi(e="",{returnPath:t=a.walletConnectReturnPath||"/terminal"}={}){if(!Ui(e))return!1;const n=await Im(e,t)||Om(e,t);if(!n)return!1;xm(n);const r=Bm(e,n);if(!r)return!1;const o=Ie(e);return te(`Opening ${o} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Pt(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:aa()}),window.location.assign(r),!0}function Hi(e=""){const t=Ie(e),n=Ni(e);return n?(te(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Pt(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:aa()}),window.location.href=n,!0):!1}function Ki({requirePassword:e=!1}={}){const t=Sr(["[data-connect-login-username]","[data-login-username]"]).trim(),n=Sr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!n&&!e)return{};if(!t)throw new Error("Enter your username.");if(!n)throw new Error("Enter your password.");return{username:t,password:n}}function Em(e=""){a.token="",a.user=null,a.loading=!1,Xo(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function G(e=null,t="Creating secure web profile..."){if(a.user&&a.token)return a.user;w(e,t);const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:mi()})});return a.token=n.token,ue(n.user),un(a.token),a.user}function $(e=""){[nm,rm].forEach(t=>{t&&(t.hidden=!e,w(t,e))})}function X(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Fm(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Vi(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function As(){$("");const e=bn();try{const t=Ki();w(e,t.username?"Creating saved login...":"Creating account...");const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:mi()})});a.token=n.token,ue(n.user),un(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",w(e,t.username?"Account created. Login saved.":"Quick web account created."),H(n.trade?.signature,"account-create")}catch(t){w(e,t.message),$(t.message)}}async function zi(){$("");const e=bn();try{const t=Ki({requirePassword:!0});w(e,"Logging in...");const n=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});a.token=n.token,ue(n.user),un(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",w(e,"Logged in."),H(n.trade?.signature,"password-login")}catch(t){w(e,t.message),$(t.message)}}function ji(){return Sr(["[data-connect-login-email]","[data-login-email]"]).trim()}function Wm(){return Sr(["[data-connect-login-code]","[data-login-code]"]).trim()}function Gi(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function Nm(){$("");const e=bn();try{const t=Gi(ji());w(e,"Sending login code...");const n=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});w(e,n.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){w(e,t.message),$(t.message)}}async function _m(){$("");const e=bn();try{const t=Gi(ji()),n=Wm();if(!n)throw new Error("Enter the login code from your email.");w(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:n})});a.token=r.token,ue(r.user),un(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",w(e,"Logged in."),H(r.trade?.signature,"email-code-login")}catch(t){w(e,t.message),$(t.message)}}function Xi(e="",t=new URLSearchParams){const n=_i(),r=t.get("sw_wallet_state")||"";if(!n.stateId||n.stateId!==r||n.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(n.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const o=t.get(Di(e))||"",s=t.get("nonce")||"",c=t.get("data")||"";if(!o||!s||!c)throw new Error("Wallet approval did not return the expected connection data.");const i=window.nacl;if(!i?.box?.before||!i.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=i.box.before(kr(o),kr(n.dappEncryptionSecretKey)),d=i.box.open.after(kr(c),kr(s),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const m=JSON.parse(new TextDecoder().decode(d)),f=String(m.public_key||m.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(m.session||""),walletEncryptionPublicKey:o,dappEncryptionPublicKey:n.dappEncryptionPublicKey,returnPath:n.returnPath||"/terminal"}}async function Ji(e="",t={}){const n=vn();await G(n,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Ie(e)})});ue(r.user||{...a.user,connectedWallet:r.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:v(t.publicKey),provider:Ie(e),tokens:[]};try{window.sessionStorage?.setItem(`${xp}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Ps(),wn(),a.walletConnectMenuOpen=!1,te(`Connected ${v(t.publicKey)}. Opening Live Terminal...`),xe(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Tr("mobile-wallet-connect")}function Dm(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||_i().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(n=>n!=="data"&&n!=="nonce"),walletEncryptionPublicKey:t.get(Di(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function Um(e="",t={}){t.token&&(a.token=t.token,un(a.token)),ue(t.user||{...a.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const n=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";n&&(a.connectedWalletBalance={publicKey:n,shortPublicKey:v(n),provider:t.provider||Ie(e),tokens:[]}),Ps(),wn(),a.walletConnectMenuOpen=!1,te(n?`Connected ${v(n)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),xe(t.finalRedirectRoute||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Tr("mobile-wallet-callback")}async function Yi(e="",t=new URLSearchParams){const n=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:sn,body:JSON.stringify(Dm(e,t))});return await Um(e,n),!0}async function qm(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;a.walletConnectMenuOpen=!0;const n=Ie(t),r=e.get("sw_wallet_pending")||"",o=e.get("errorCode")||"",s=e.get("errorMessage")||"";if(o||s)return r&&await Yi(t,e).catch(()=>{}),Ps(),wn(),te(`${n} did not connect: ${s||o||"request cancelled"}. Choose another wallet or try again.`),Pt(t,new Error(s||o||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:aa()}),h({force:!0}),!0;try{if(te(`Finishing ${n} mobile connection...`),r)await Yi(t,e);else{const c=Xi(t,e);await Ji(t,c)}}catch(c){if(r)try{const i=Xi(t,e);await Ji(t,i)}catch{te(`${n} mobile connection could not finish: ${c.message}`),Pt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:aa()}),wn(),h({force:!0})}else te(`${n} mobile connection could not finish: ${c.message}`),Pt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:aa()}),wn(),h({force:!0})}return!0}async function Hm(){$("");const e=vn()||bn();try{w(e,"Choose a wallet provider to connect."),la({returnPath:"/terminal"})}catch(t){w(e,t.message),$(t.message)}}async function Km(){await As(),a.user&&(a.route="terminal",a.activeTab="wallets",window.history.pushState({},"","/terminal"),h())}async function Vm(){if(a.logoutPending)return;if(!a.user){a.loginCollapsed=!1,h(),fn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await su("logging out");const e=String(a.token||"");a.logoutPending=!0;const t=p("[data-logout]");t&&(t.disabled=!0,w(t,"Logging out...")),a.token="",a.user=null,a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="",a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},a.manualSellActions={},a.tradeActionLocks={},a.ogreAgentStatus="",Kl(),Xo(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{a.logoutPending=!1}}async function zm(){if(!a.token){h();return}try{const e=await k("/api/web/me");ue(e.user),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Ne({force:!1,deep:!1,reason:"session-load"}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})})}catch{a.token="",Xo(),h()}}async function na(e={}){const t=C();if(!a.user||!a.token){a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.launchWatches=[],a.presets={trade:[],bundle:[]},a.tradePlans=[],a.watchlist={rows:[],count:0},h();return}const n=!e.silent;n&&(a.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,b,S,T,A]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.pnl=y.pnl||null,a.launchWatches=b.watches||[],a.presets=S.presets||{trade:[],bundle:[]},Iu(),a.watchlist=T.watchlist||{rows:[],count:0},a.tradePlans=A.plans||[],Vr();return}const[o,s,c,i,u,d,m,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.wallets=o.wallets||[],a.balances=s.balances||[],a.connectedWalletBalance=s.connectedWallet||c.connectedWallet||null,a.positions=c.positions||[],a.pnl=i.pnl||null,a.launchWatches=u.watches||[],a.presets=d.presets||{trade:[],bundle:[]},Iu(),a.watchlist=m.watchlist||{rows:[],count:0},a.tradePlans=f.plans||[],Vr(),e.force&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="")}finally{U("load-all",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e.skipCore?"skip-core":"core"}),n&&(a.loading=!1),h()}}async function Cs(e={}){if(!a.user||!a.token)return;const t=C(),n=e.requestId||0,r=()=>n&&a.walletRefreshRequestId!==n,o=e.force?"?force=true":"",s=e.force||e.deep?"?force=true":"",c=e.timeoutMs||sn,i=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${o}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),m=await u;if(r())return;a.balances=m.balances||[],a.connectedWalletBalance=m.connectedWallet||null,a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("wallet-refresh",t,{component:"wallet",resultCount:a.balances.length,cacheHit:!!m.cacheHit,details:`wallets=${a.wallets.length};connected=${!!a.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([i.then(b=>({ok:!0,wallets:b})).catch(b=>({ok:!1,error:b})),d.then(b=>({ok:!0,tradePlans:b})).catch(b=>({ok:!1,error:b}))]);if(!r()&&(f.ok&&(a.wallets=f.wallets.wallets||a.wallets||[]),y.ok&&(a.tradePlans=y.tradePlans.plans||a.tradePlans||[],Vr()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const b=C(),S=k(`/api/web/positions${s}`,{timeoutMs:c}).catch(T=>({__error:T}));try{const T=await S;if(T?.__error)throw T.__error;if(r())return;a.connectedWalletBalance=T.connectedWallet||a.connectedWalletBalance||null,a.positions=T.positions||[],a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("positions-refresh",b,{component:"positions",resultCount:a.positions.length,cacheHit:!!T.cacheHit,details:`open=${a.positions.length}`})}catch(T){a.walletRefreshError=T.message||"Position refresh failed.",U("positions-refresh",b,{errorCode:T?.code||T?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(T?.message||"Position refresh failed.")})}}}function Qi(e=a.positions){return(Array.isArray(e)?e:[]).some(t=>{const n=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!n&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Zi(e=120,t="positions-value-followup"){!a.user||!a.token||(mr&&window.clearTimeout(mr),mr=window.setTimeout(()=>{mr=null,At({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:zt}).then(n=>{n?(a.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})):$r(`${t}-failed`)}).catch(()=>$r(`${t}-failed`))},Math.max(0,Number(e)||0)))}function jm(e=[],t=[],n={}){const r=new Map((Array.isArray(t)?t:[]).map(o=>[String(o?.tokenMint||""),o]));return(Array.isArray(e)?e:[]).map(o=>{const s=r.get(String(o?.tokenMint||""));if(!s||n.fast===!1)return o;const c=!!(o?.valuePending||/refreshing|updating|background/i.test(o?.valueError||"")),i=s.estimatedValueSol!==null&&s.estimatedValueSol!==void 0&&s.estimatedValueSol!=="";return!c||!i?o:{...o,estimatedValueSol:s.estimatedValueSol,openPnlSol:s.openPnlSol,openPnlPercent:s.openPnlPercent,valuePending:!1,valueError:""}})}function $r(e="positions-value-refresh-delayed"){let t=!1;return a.positions=(Array.isArray(a.positions)?a.positions:[]).map(n=>{const r=n?.estimatedValueSol!==null&&n?.estimatedValueSol!==void 0&&n?.estimatedValueSol!=="";return!(n?.valuePending||/refreshing|updating|background/i.test(n?.valueError||""))?n:(t=!0,{...n,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(U("positions-value-refresh-cleanup",C(),{component:"positions",details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):!1}function ec(e="portfolio-supplemental"){if(!a.user||!a.token)return;const t=C();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:zt}),k("/api/web/pnl?force=true",{timeoutMs:zt,dedupe:!1})]).then(([n,r])=>{n.status==="fulfilled"&&(a.balances=n.value.balances||a.balances||[],a.connectedWalletBalance=n.value.connectedWallet||a.connectedWalletBalance||null),r.status==="fulfilled"&&(a.pnl=r.value.pnl||a.pnl||null),a.lastWalletRefreshAt=new Date().toISOString(),U("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}).catch(()=>{})}async function At(e={}){if(!a.user||!a.token)return;const t=C(),n=new URLSearchParams;e.force&&n.set("force","true"),e.fast!==!1&&n.set("fast","true");const r=n.toString()?`?${n.toString()}`:"",o=r||"full";if(mn&&Zo===o)return mn;const s=++es;return Zo=o,mn=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?zt:zo)});return es!==s?!1:(a.connectedWalletBalance=c.connectedWallet||a.connectedWalletBalance||null,a.positions=jm(c.positions||a.positions||[],a.positions||[],e),a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("positions-refresh",t,{component:"positions",resultCount:a.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Qi(a.positions)&&Zi(120,`${e.reason||"positions"}-values`),e.syncPnl&&ec(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(a.walletRefreshError=c.message||"Position refresh failed."),U("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(c?.message||"Position refresh failed.")}),!1}finally{es===s&&(mn=null,Zo="")}})(),mn}async function Gm(e={}){if(!a.user||!a.token){$("Connect your wallet before refreshing positions."),Ue("error",{error:"Wallet not connected"});return}const t=C();Ia("refreshing",{startedAt:a.positionRefreshAction?.startedAt||t}),a.walletRefreshError="",Me("[data-sync-health]",xr()),oe(),await Fe(20);try{if(!await At({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:zt}))throw new Error(a.walletRefreshError||"Position refresh failed.");a.lastWalletRefreshAt=new Date().toISOString(),Ue("success",{error:""}),ec(`${e.reason||"positions-only"}-balances-pnl`),Qi(a.positions)&&Zi(120,`${e.reason||"positions-only"}-full-values`),U("positions-only-refresh",t,{component:"positions",resultCount:a.positions.length,details:e.reason||"positions-only"})}catch(n){const r=n?.message||"Position refresh failed.";a.walletRefreshError=r,Ue("error",{error:N(r)}),$(r),U("positions-only-refresh",t,{errorCode:n?.code||n?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(r)})}finally{h()}}function kn(){return String(a.smartChartToken||a.tradeToken||a.bundleToken||a.volumeToken||a.terminalToken||"").trim()}function He(e=a.activeTab){return um[e]||null}function Fa(e=He()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",An(a.livePairBucket)).replace("{sort}",String(a.terminalSort||"best")).replace("{scopeMode}",String(a.slimeScopeMode||"new")).replace("{kolMode}",String(a.kolMode||"hot")).replace("{kolWallet}",a.kolWallet?v(a.kolWallet):"global").replace("{scanMode}",String(a.scanMode||"safe")).replace("{tokenMint}",kn()?v(kn()):"none")}function tc(e=a.activeTab,t="pageSize",n=25){const r=He(e),o=Number(r?.[t]);return Number.isFinite(o)&&o>0?o:n}function Wa(e=a.activeTab){return tc(e,"pageSize",25)}function Ls(e=a.activeTab){return Math.max(Wa(e),tc(e,"maxPageSize",Wa(e)))}function ac(e=a.activeTab){return!!He(e)?.supportsPagination}function Ms(e=a.activeTab){const t=He(e)||{tabKey:e};return`${e}:${Fa(t)}`}function $n(e=a.activeTab,t=0){const n=Ms(e),r=Wa(e),o=Ls(e),s=Number(a.terminalFeedVisibleLimits?.[n]||0),c=Number.isFinite(s)&&s>0?s:r,i=Number(t||0),u=Math.min(Math.max(r,c),o);return i>0?Math.min(u,i):u}function J(e=a.activeTab){const t=Ms(e);if(!a.terminalFeedVisibleLimits?.[t])return;const n={...a.terminalFeedVisibleLimits||{}};delete n[t],a.terminalFeedVisibleLimits=n}function Xm(e=a.activeTab,t=0){const n=Ms(e),r=$n(e,t),o=Wa(e),s=Ls(e),c=Number(t||0),i=Math.min(s,c>0?c:s,r+o);return a.terminalFeedVisibleLimits={...a.terminalFeedVisibleLimits||{},[n]:i},i}function Ze(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return n.slice(0,$n(e,n.length))}function Jm(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return ac(e)&&n.length>$n(e,n.length)}function ra(e=a.activeTab,t=[],n="rows"){const r=Array.isArray(t)?t:[];if(!Jm(e,r))return"";const o=$n(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${l(o)} of ${l(r.length)} ${l(n)} shown</small>
      <button type="button" data-terminal-load-more="${l(e)}">Load More</button>
    </div>
  `}function K(e=a.activeTab){return a.terminalFeeds[e]||{}}function nc(e=a.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?oa():e==="kol"?a.kolLastUpdatedAt||"":e==="watchlist"?K("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?a.lastWalletRefreshAt||K(e).lastFetchAt||"":K(e).lastFetchAt||""}function Ct(e=a.activeTab){return e==="terminal"?Number(We()?.rows?.length||0)+Number(a.kolScan?.rows?.length||0):e==="live"?Number(We()?.rows?.length||0):e==="liveTrades"?Number(a.pnl?.trades?.length||0):e==="slimeScope"?Number(bd?.(a.slimeScopeMode)?.length||0):e==="kol"?Number(a.kolScan?.rows?.length||0):e==="watchlist"?Number(a.watchlist?.rows?.length||0):e==="smartChart"?kn()?1:Number(Gn?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?kn()?1:0:e==="sniper"?Number(a.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(a.launchWatches?.length||0):e==="wallets"?Number(a.wallets?.length||0)+Number(a.balances?.length||0):e==="positions"?Number(a.positions?.length||0):e==="pnl"?Number(a.pnl?.trades?.length||0):e==="ogreAi"?a.ogreAiResult?1:0:e==="ogreTek"?Number(a.ogreTek?.markets?.length||0)+Number(a.ogreTek?.positions?.length||0):0}function Tn(e=a.activeTab){const t=Ct(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,$n(e,t)):t}function Pn(e=a.activeTab){const t=He(e);if(!t)return!1;const n=Date.parse(nc(e)||"");return Number.isFinite(n)?Date.now()-n>Number(t.staleMs||3e4):!0}function rc(e=a.activeTab){return Ct(e)>0||!!nc(e)}function Ym(e=a.activeTab,t={}){const n=He(e)||{};return{tabKey:e,label:n.label||e,category:n.category||"unknown",endpoint:n.endpoint||"",cacheKey:Fa(n),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Tn(e)??0),pageSize:Wa(e),maxPageSize:Ls(e),supportsPagination:ac(e),hasMore:!!(t.hasMore??Ct(e)>Tn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function oc(e=a.activeTab,t={}){const n=Ym(e,t);if(a.terminalFeedLog=[...a.terminalFeedLog||[],n].slice(-20),ys(Bp,()=>a.terminalFeedLog,"feed"),n.status==="error"||n.status==="timeout"||/manual|post-trade|visibility|resume/i.test(n.reason||"")||!!(n.stale&&n.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(n)}).catch(()=>{})}catch{}return n}function Qm(e=a.activeTab,t={}){const n=He(e);if(!n)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return a.terminalFeeds={...a.terminalFeeds,[e]:{...K(e),label:n.label,category:n.category,endpoint:n.endpoint,cacheKey:Fa(n),refreshMs:n.refreshMs,staleMs:n.staleMs,pageSize:n.pageSize,maxPageSize:n.maxPageSize,supportsPagination:!!n.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function xs(e=a.activeTab,t="",n="success",r={}){const o=He(e);if(!o)return;const s=Ct(e),c=Tn(e),i={...K(e),label:o.label,category:o.category,endpoint:o.endpoint,cacheKey:Fa(o),refreshMs:o.refreshMs,staleMs:o.staleMs,pageSize:o.pageSize,maxPageSize:o.maxPageSize,supportsPagination:!!o.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:n,lastFetchAt:new Date().toISOString(),resultCount:s,renderedCount:c,hasMore:s>c,stale:n!=="success"||Pn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};a.terminalFeeds={...a.terminalFeeds,[e]:i},oc(e,{requestId:t,status:n,reason:i.lastReason,resultCount:s,renderedCount:c,hasMore:i.hasMore,stale:i.stale,errorCode:i.errorCode,errorMessage:i.errorMessage})}function Zm(e=a.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function ef(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function Y(e=a.activeTab,t={}){const n=C(),r=He(e);if(!r)return null;if(t.ifStale&&rc(e)&&!Pn(e)||K(e).inFlight)return K(e);const o=ef(t),s=Date.now(),c=Number(ti.get(e)||0);if(!o&&c&&s-c<ln)return K(e);if(Zm(e)&&!a.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return xs(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),K(e);ti.set(e,s);const i=Qm(e,t);if(o&&t.renderStart!==!1){const u=a.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[Lt({silent:!0,force:!!t.force})];a.kolWallet||u.push(Mr(a.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await Ar({silent:t.silent!==!1,bucket:a.livePairBucket,force:!!t.force});else if(e==="liveTrades")a.user&&a.token&&await na({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[Lt({silent:!0,force:!!t.force}),Ln(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];a.kolScan||u.push(Mr(a.kolMode,a.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await Mr(a.kolMode,a.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await ic({silent:t.silent!==!1});else if(e==="sniper")await Ln(a.scanMode,{silent:t.silent!==!1});else if(e==="positions")a.user&&a.token&&await At({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:zo});else if(["wallets","pnl"].includes(e))a.user&&a.token&&await Ne({force:!!t.force,deep:!1});else if(e==="smartChart")a.user&&a.token&&await Ne({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[Lt({silent:!0,force:!!t.force})];a.user&&a.token&&u.push(na({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[Lt({silent:!0,force:!!t.force})];a.scan||u.push(Ln(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),a.user&&a.token&&u.push(na({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await tr({silent:!0}).catch(u=>{a.ogreTek.error=u.message});return xs(e,i,"success"),K(e)}catch(u){if(xs(e,i,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:N(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return K(e)}finally{U("feed-refresh",n,{component:r.component||e,resultCount:Ct(e),cacheHit:!!K(e).cacheHit,stale:Pn(e),requestId:K(e).lastRequestId||"",errorCode:K(e).errorCode||"",details:`${e}:${Fa(r)}`}),t.render!==!1&&(!o&&Es()?hc():h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"&&e==="smartChart"}))}}async function Na(e={}){const t=a.activeTab||"terminal",n=[Y(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(n)}function Tr(e="terminal-entry"){a.route==="terminal"&&(Na({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),a.user&&a.token&&Ne({force:!0,deep:!1,reason:e}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})}))}function Bs(){const e=()=>{Aa&&clearTimeout(Aa),Aa=null,ur=""};if(a.route!=="terminal"||document.hidden){e();return}const t=He(a.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(a.activeTab)){e();return}const n=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${a.activeTab}:${Fa(t)}:${n}`;Aa&&ur===r||(e(),ur=r,Aa=setTimeout(async()=>{Aa=null,ur="",!(a.route!=="terminal"||document.hidden)&&(await Y(a.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(o=>$(o.message)),Bs())},n))}function An(e){const t=String(e||"live");return $t.some(([n])=>n===t)?t:"live"}function sc(e=a.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Pr(e=a.activeTab){return e==="slimeScope"?sc(a.slimeScopeMode):An(a.livePairBucket)}function We(e=Pr()){const t=An(e);return a.livePairsByBucket[t]||(t===a.livePairBucket?a.livePairs:null)||null}function oa(e=Pr()){const t=An(e);return a.livePairsLastUpdatedByBucket[t]||(t===a.livePairBucket?a.livePairsLastUpdatedAt:"")||""}function lc(e=[]){return Array.isArray(e)&&e.length>0}function Be(e={},t={},n=[]){for(const r of n){const o=e?.[r];if(o!=null&&o!=="")return o}for(const r of n){const o=t?.[r];if(o!=null&&o!=="")return o}return""}function tf(e=[],t=[]){const n=new Map((Array.isArray(e)?e:[]).map(r=>[da(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const o=n.get(da(r));return o?{...o,...r,tokenMint:Be(r,o,["tokenMint","mint","tokenAddress","address"]),mint:Be(r,o,["mint","tokenMint","tokenAddress","address"]),symbol:Be(r,o,["symbol","ticker","shortMint"]),name:Be(r,o,["name","tokenName","category"]),imageUrl:Be(r,o,["imageUrl","image","icon","logoURI","logoUrl"]),image:Be(r,o,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Be(r,o,["avatarUrl","avatar_url","avatar"]),avatarState:Be(r,o,["avatarState"]),dexUrl:Be(r,o,["dexUrl","url"]),pumpUrl:Be(r,o,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Be(r,o,["websiteUrl","website"]),twitterUrl:Be(r,o,["twitterUrl","xUrl"]),telegramUrl:Be(r,o,["telegramUrl"]),metadata:r?.metadata||o?.metadata||r?.tokenMetadata||o?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||o?.tokenMetadata||r?.metadata||o?.metadata||null,dex:r?.dex||o?.dex||r?.dexScreener||o?.dexScreener||null,pump:r?.pump||o?.pump||r?.pumpFun||o?.pumpFun||null}:r})}async function Ar({silent:e=!1,bucket:t=a.livePairBucket,renderOnComplete:n=!0,force:r=!1}={}){const o=C(),s=An(t),c=s===a.livePairBucket,i=a.terminalSort||"best",u=`${s}:${i}`,d=gr.get(u);if(d?.promise){a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:d.requestId},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const T=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);return!e&&!lc(T)&&xa(si),d.promise}const m=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(ts[s]||0)+1;ts[s]=f;const y=()=>ts[s]===f;a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:m},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const b=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);!e&&!lc(b)&&xa(si);const S=(async()=>{try{const T=r?"&force=true":"",A=`/api/web/live-pairs?bucket=${encodeURIComponent(s)}&sort=${encodeURIComponent(i)}${T}`,g=await Promise.race([k(A),new Promise((_,Ee)=>window.setTimeout(()=>Ee(new Error("Live feed refresh timed out.")),12e3))]),P=$t.find(([_])=>_===s)?.[1]||"Live",L=a.livePairsByBucket[s]||(c?a.livePairs:null);let B=g.livePairs||{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${P} feed returned no rows yet. Retrying automatically.`};const D=Array.isArray(B?.rows)?B.rows:[],ne=Array.isArray(L?.rows)?L.rows:[];if(D.length===0&&ne.length>0?B={...L,...B,rows:L.rows,stale:!0,emptyRefresh:!0,message:`${P} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:D.length>0&&ne.length>0&&(B={...B,rows:tf(ne,D)}),!y())return B;const we=B?.refreshedAt||new Date().toISOString(),ge={...a.livePairsRefreshErrorByBucket||{}};return delete ge[s],a.livePairsRefreshErrorByBucket=ge,a.livePairsByBucket={...a.livePairsByBucket,[s]:B},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:we},c&&(a.livePairs=B,a.livePairsLastUpdatedAt=we),B}catch(T){const A=N(T?.message||"Live feed refresh failed."),g=$t.find(([B])=>B===s)?.[1]||"Live",P=a.livePairsByBucket[s]||(c?a.livePairs:null),L=P?{...P,stale:!0,refreshError:A,message:`Showing last good ${g} feed. Refresh failed, retrying automatically.`}:{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:A,message:`${g} refresh failed. Retrying automatically.`};return y()&&(a.livePairsRefreshErrorByBucket={...a.livePairsRefreshErrorByBucket||{},[s]:A},a.livePairsByBucket={...a.livePairsByBucket,[s]:L},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:L.refreshedAt},c&&(a.livePairs=L,a.livePairsLastUpdatedAt=L.refreshedAt)),L}finally{if(!y())return;const T=a.livePairsByBucket?.[s]?.rows||[];U("live-pairs-refresh",o,{component:"livePairs",resultCount:Array.isArray(T)?T.length:0,stale:!!a.livePairsByBucket?.[s]?.stale,errorCode:a.livePairsRefreshErrorByBucket?.[s]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${s}:${i}`});const A={...a.livePairsLoadingByBucket};(A[s]===m||A[s]===!0)&&(delete A[s],a.livePairsLoadingByBucket=A),a.livePairsLoading=!!A[a.livePairBucket],!e&&c&&(a.loading=!1),n&&(c&&["terminal","live","slimeScope"].includes(a.activeTab)?xa("load-live-pairs-complete"):h())}})();return gr.set(u,{requestId:m,requestVersion:f,safeBucket:s,promise:S}),S.finally(()=>{gr.get(u)?.requestId===m&&gr.delete(u)}),S}async function Lt({silent:e=!1,force:t=!1,warmAll:n=!1}={}){if(await Ar({silent:e,bucket:a.livePairBucket,force:t}),n){const r=$t.map(([o])=>o).filter(o=>o!==a.livePairBucket);await Promise.allSettled(r.map(o=>Ar({silent:!0,bucket:o,renderOnComplete:!1,force:t})))}(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope")&&xa(n?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function sa(){if(xn()||document.hidden||La()||a.activeTab!=="live"&&a.activeTab!=="terminal"&&a.activeTab!=="slimeScope"){Ma();return}const e=Pr(a.activeTab),n=(a.activeTab==="slimeScope"?12:8)*1e3,r=`${a.activeTab}:${e}:${a.terminalSort}:${n}`;Sa&&sr===r||(Ma(),sr=r,Sa=setTimeout(async()=>{if(Sa=null,sr="",document.hidden||La()){sa();return}if(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"){if(a.livePairsLoadingByBucket?.[e]){sa();return}try{a.activeTab==="slimeScope"?await Y("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Ar({silent:!0,bucket:a.livePairBucket,force:!1})}catch{}finally{sa()}}},n))}function af({force:e=!1}={}){if(xn()||!(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"))return;const n=Pr(a.activeTab),r=`${n}:${a.terminalSort||"best"}`;Yo.has(r)||a.livePairsLoadingByBucket[n]||!e&&a.livePairsByBucket[n]||(Yo.add(r),window.setTimeout(()=>{const o=a.activeTab==="slimeScope"?Y("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):Lt({silent:!0,force:!0,warmAll:!1});Promise.resolve(o).catch(s=>$(s.message)).finally(()=>{Yo.delete(r),sa()})},900))}function Cr(){const e=()=>{ka&&clearTimeout(ka),ka=null,lr=""};if(document.hidden||a.activeTab!=="sniper"){e();return}const t=`${a.activeTab}:${a.scanMode}`;ka&&lr===t||(e(),lr=t,ka=setTimeout(async()=>{if(ka=null,lr="",document.hidden){Cr();return}if(a.activeTab==="sniper"){if(a.loading){Cr();return}try{await Ln(a.scanMode,{silent:!0})}catch(n){$(n.message)}finally{Cr()}}},2e4))}function Cn(){const e=()=>{$a&&clearTimeout($a),$a=null,ir=""};if(xn()||document.hidden||a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet){e();return}const t=String(a.kolMode||"hot"),o=t==="hot"||t==="fresh"?1e4:3e4,s=`${a.activeTab}:${a.kolMode}:${o}`;$a&&ir===s||(e(),ir=s,$a=setTimeout(async()=>{if($a=null,ir="",document.hidden){Cn();return}if(!(a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet)){if(a.kolLoading){Cn();return}try{await Mr(a.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{Cn()}}},o))}function Lr(){const e=()=>{Pa&&clearTimeout(Pa),Pa=null,cr=""};if(xn()||document.hidden||a.activeTab!=="watchlist"&&a.activeTab!=="terminal"||!a.user||!a.token){e();return}const t=`${a.activeTab}:${a.user?.id||"guest"}`;Pa&&cr===t||(e(),cr=t,Pa=setTimeout(async()=>{if(Pa=null,cr="",document.hidden){Lr();return}if(!(a.activeTab!=="watchlist"&&a.activeTab!=="terminal"))try{await ic({silent:!0})}catch(n){$(n.message)}finally{Lr()}},3e4))}async function Ln(e=a.scanMode,t={}){const n=C(),r=!!t.silent;a.scanMode=e,r||(a.loading=!0,h());try{const o=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);a.scan=o.scan}finally{U("scanner-refresh",n,{component:"sniper",resultCount:Array.isArray(a.scan?.candidates)?a.scan.candidates.length:0,details:e}),r||(a.loading=!1),h()}}async function Mr(e=a.kolMode,t=a.kolWallet,n={}){const r=C(),o=!!n.silent;a.kolMode=e,a.kolWallet=String(t||"").trim();let s="";a.kolWallet&&!Bt(a.kolWallet)&&(a.kolWallet="",s="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!o&&!a.kolScan&&(a.loading=!0),a.kolLoading=!0,a.kolStatus=s||(a.kolWallet?"Scanning custom KOL wallet...":`Loading ${Dn(a.kolMode)}...`),$(""),o||h();try{const c=new URLSearchParams({mode:e});a.kolWallet&&c.set("wallet",a.kolWallet);const i=await k(`/api/web/kol/scan?${c.toString()}`);a.kolScan=i.scan,a.kolLastUpdatedAt=new Date().toISOString(),a.kolStatus=i.scan?.message||`${Dn(a.kolMode)} loaded.`,a.kolDumpStatsLoadedAt=0}catch(c){throw a.kolStatus=c.message||"KOL scan failed.",c}finally{U("kol-refresh",r,{component:"kol",resultCount:Array.isArray(a.kolScan?.rows)?a.kolScan.rows.length:Array.isArray(a.kolScan?.signals)?a.kolScan.signals.length:0,errorCode:a.kolStatus&&/failed/i.test(a.kolStatus)?"KOL_REFRESH_FAILED":"",details:a.kolWallet?"wallet":e}),o||(a.loading=!1),a.kolLoading=!1,h()}}async function ic(e={}){if(!a.user||!a.token)return;const t=C(),n=!!e.silent;a.watchlistLoading=!0,n||h();try{const r=await k("/api/web/watchlist");a.watchlist=r.watchlist||{rows:[],count:0}}finally{U("watchlist-refresh",t,{component:"watchlist",resultCount:a.watchlist?.count||a.watchlist?.rows?.length||0}),a.watchlistLoading=!1,h()}}function nf(){return a.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function rf(){const e=Number(a.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function Mt(){return nf()+rf()}const of=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Re(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function sf(){const e=new Map,t=(n={})=>{const r=Re(n.mint||n.tokenMint||"");if(!r||e.has(r))return;const o=n.balance??n.uiAmount??n.amount??n.uiBalance??"";e.set(r,{mint:r,symbol:String(n.symbol||n.shortMint||(r==="SOL"?"SOL":v(r))||"").trim(),name:String(n.name||n.label||"").trim(),balance:o,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${Mt().toFixed(4)} SOL`}),et().forEach(n=>t({mint:n.tokenMint||n.mint,symbol:n.symbol||n.shortMint,name:n.name||"",balance:n.uiAmount||n.amountToken||"",kind:"wallet"})),(a.balances||[]).forEach(n=>{(n.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function Rs(e={}){const t=new Map,n=(o={})=>{const s=Re(o.mint||o.tokenMint||"");!s||t.has(s)||t.set(s,{mint:s,symbol:String(o.symbol||o.shortMint||(s==="SOL"?"SOL":v(s))||"").trim(),name:String(o.name||o.label||"").trim(),balance:o.balance??o.uiAmount??o.amount??"",kind:o.kind||o.source||"held"})};return sf().forEach(n),e.walletOnly||of.forEach(o=>{o.mint!=="SOL"&&n(o)}),[...t.values()]}function cc(e=""){const t=Re(e);return Rs().find(n=>n.mint===t)||null}function uc(e="",t={}){const n=Re(e),r=t.includeCustom!==!1,o=Rs({walletOnly:!!t.walletOnly}),s=o.some(u=>u.mint===n);return`${o.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||v(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${l(u.mint)}" ${n===u.mint?"selected":""}>${l(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!n||!s)?"selected":""}>Custom CA</option>`:""}`}function Is(){const e=Re(a.tradeSwapFrom||"SOL")||"SOL";return Rs({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function dc(){const e=Is(),t=Re(a.tradeSwapTo||""),n=Re(a.tradeToken||"");return t&&t!==e?t:n&&n!==e||e==="SOL"?n:"SOL"}function lf(){const e=Is(),t=dc();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Re(a.tradeToken||"")?a.swapDirection==="sell"?"sell":"buy":"select"}function cf(e="buy"){const t=Re(p("[data-swap-from]")?.value||a.tradeSwapFrom||""),n=Re(p("[data-swap-to]")?.value||a.tradeSwapTo||""),r=String(p("[data-trade-token]")?.value||a.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:n&&n!=="SOL"?n:r}function pc(){return(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey?(a.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const n=String(t.mint||t.tokenMint||"").trim();return{tokenMint:n,shortMint:t.shortMint||v(n),symbol:t.symbol||t.shortMint||v(n),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||X(n),pumpUrl:Fm(n),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function et(){const e=new Set,t=[];for(const n of[...a.positions||[],...pc()]){const r=String(n?.tokenMint||n?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(n))}return t}function Os(){const e=a.connectedWalletBalance?.publicKey||a.user?.connectedWallet?.publicKey||"";return a.wallets.length+(e?1:0)}function mc(){return a.pnl?.totals?.realizedSol||"+0 SOL"}function _a(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Mn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function xr(){if(a.walletRefreshing||a.walletRefreshStatus==="refreshing")return"Syncing";if(a.walletRefreshStatus==="timeout")return"Delayed";if(a.walletRefreshError||a.walletRefreshStatus==="error")return"Retry";const e=_a(a.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function uf(){const e=ae("trade",a.selectedTradePresetId),t=ae("bundle",a.selectedBundlePresetId),n=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${n} | ${r}`}async function fc(){if(!a.user||!a.token)return;const e=C();try{const[t,n]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(a.pnl=t.value.pnl||a.pnl||null),n.status==="fulfilled"&&(a.tradePlans=n.value.plans||a.tradePlans||[],Vr()),U("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(a.tradePlans?.length||0)+(a.pnl?1:0),details:"pnl,trade-plans"})}catch(t){U("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:N(t?.message||"Post-trade supplemental refresh failed.")})}}function df(e=350,t={}){dr&&window.clearTimeout(dr),dr=window.setTimeout(async()=>{if(dr=null,!(!a.user||!a.token))try{t.reason==="post-trade"?await Promise.all([fc(),At({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([na({force:!1,skipCore:!0,silent:!0}),At({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(n){a.walletRefreshError=n.message||"Background refresh failed.",h()}},e)}async function Ne({force:e=!1,deep:t=!1,reason:n="manual"}={}){if(!a.user||!a.token)return a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="Wallet not connected",Me("[data-sync-health]","Wallet not connected"),Ue("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(n||"").toLowerCase(),o=r==="manual_header_click",s=r.includes("post-trade");if(e&&!t&&!s&&!o&&Date.now()-bi<Op?(e=!1,E({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!s&&(bi=Date.now()),Xt)return E({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),a.positionRefreshAction?.state==="clicked"&&Ia("refreshing",{startedAt:a.positionRefreshAction.startedAt||C()}),Xt.finally(()=>{if(["clicked","refreshing"].includes(a.positionRefreshAction?.state)){const u=a.walletRefreshStatus==="error"||a.walletRefreshStatus==="timeout";Ue(u?"error":"success",{error:u?N(a.walletRefreshError||"Refresh delayed"):""})}});const c=C(),i=++Zp;return a.walletRefreshRequestId=i,Xt=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};a.positionRefreshAction?.state==="clicked"&&Ia("refreshing",{startedAt:a.positionRefreshAction.startedAt||c}),a.walletRefreshing=!0,a.walletRefreshStatus="refreshing",a.walletRefreshError="",Me("[data-sync-health]",xr()),kt("[data-refresh-spinner]",!1),oe(),Jt&&window.clearTimeout(Jt),Jt=window.setTimeout(()=>{Jt=null,!(a.walletRefreshRequestId!==i||!a.walletRefreshing)&&(a.walletRefreshing=!1,a.walletRefreshStatus==="refreshing"&&(a.walletRefreshStatus="timeout"),Xt=null,Ue("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))},Vo+6e3),await Fe(20);try{if(await Promise.race([Cs({force:e,deep:t,preserveSmartChartFrame:a.activeTab==="smartChart",requestId:i,timeoutMs:Vo}),new Promise((d,m)=>window.setTimeout(()=>m(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),Vo))]),a.walletRefreshRequestId!==i)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:C()-c,fromCache:!1,degraded:!0},u;a.walletRefreshRequestId===i&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshStatus="success"),t?await na({force:e,skipCore:!0,silent:!0}):((o||s)&&At({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${n}-positions-values`,timeoutMs:zt}).then(d=>{d?h({preserveSmartChartFrame:a.activeTab==="smartChart"}):$r(`${n}-positions-values-failed`)}).catch(()=>$r(`${n}-positions-values-failed`)),df(s?200:350,{reason:n})),U("wallet-refresh-total",c,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:t?"deep":`core-plus-background:${n}`}),Ue("success",{error:""}),u={ok:!0,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:"",durationMs:C()-c,fromCache:!1,degraded:!1}}catch(d){const m=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));a.walletRefreshRequestId===i&&(a.walletRefreshStatus=m?"timeout":"error",a.walletRefreshError=d.message||"Refresh failed."),m&&!r.includes("auto-retry")&&a.user&&a.token&&window.setTimeout(()=>{a.user&&a.token&&a.walletRefreshStatus!=="success"&&Ne({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),U("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:N(a.walletRefreshError)}),Ue("error",{error:N(a.walletRefreshError)}),$(a.walletRefreshError),u={ok:!1,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:N(a.walletRefreshError),durationMs:C()-c,fromCache:!1,degraded:!0}}finally{Jt&&(window.clearTimeout(Jt),Jt=null),a.walletRefreshRequestId===i&&(a.walletRefreshing=!1),Xt=null,h({preserveSmartChartFrame:a.activeTab==="smartChart"})}return u})(),Xt}async function ut({force:e=!0,reason:t="manual_header_click",deep:n=!1}={}){return Ne({force:e,reason:t,deep:n})}function xn(){return!!a.postTradeRefresh?.active&&Number(a.postTradeRefresh?.activeUntil||0)>Date.now()}async function zw(e="",t="legacy-post-trade"){H(e,t)}function H(e="",t="post-trade",n={}){e&&(a.lastTradeSignature=e),St.length&&(St.forEach(s=>window.clearTimeout(s)),St=[]);const r=n.tradeAttemptId||ct("post-trade"),o=Array.isArray(n.affectedKeys)&&n.affectedKeys.length?n.affectedKeys.slice(0,12).map(s=>be(s,48)):Up;a.postTradeRefresh={active:!0,attemptId:r,action:be(t,70),signaturePresent:!!e,invalidatedKeys:o,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},E({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:o.length,details:o.join(",")}),Fp.forEach(s=>{const c=window.setTimeout(()=>{St=St.filter(m=>m!==c);const i=Number(a.postTradeRefresh?.requestCount||0)+1;a.postTradeRefresh={...a.postTradeRefresh||{},requestCount:i},E({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:a.postTradeRefresh.requestCount,details:t});const u=C();(i<=1?Ne({force:!0,deep:!1,reason:"post-trade"}):Promise.all([At({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:zt}),fc()])).catch(m=>{a.walletRefreshError=m.message||"Post-trade refresh failed.",a.postTradeRefresh={...a.postTradeRefresh||{},errors:[...a.postTradeRefresh?.errors||[],N(m.message||"Post-trade refresh failed.")].slice(-5)},E({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:C()-u,requestId:r,errorCode:m?.code||m?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{a.postTradeRefresh={...a.postTradeRefresh||{},refreshedKeys:[...new Set([...a.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:St.length>0,activeUntil:St.length>0?Date.now()+8e3:Date.now()},E({component:"post-trade",action:"post-trade-refresh-end",durationMs:C()-u,requestId:r,resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:a.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})})},s);St.push(c)}),oe()}function Pe({title:e="Confirm",lines:t=[],confirmLabel:n="Confirm",cancelLabel:r="Cancel",danger:o=!1,input:s=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
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
    `;const u=document.activeElement,d=i.querySelector(".slime-confirm-input"),m=S=>{i.remove(),document.removeEventListener("keydown",b,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>m(s?d?.value??"":!0),y=()=>m(s?null:!1),b=S=>{S.key==="Escape"?(S.preventDefault(),y()):S.key==="Enter"&&(!s||S.target===d)&&(S.preventDefault(),f())};i.addEventListener("pointerdown",S=>{S.target===i&&y()}),i.querySelector(".slime-confirm-accept").addEventListener("click",f),i.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",b,!0),document.body.appendChild(i),(d||i.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function Es(){if(document.hidden&&a.route==="terminal")return!0;const e=document.activeElement;if(!e||a.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function hc(){a.pendingRender=!0}function gc(){!a.pendingRender||Es()||(a.pendingRender=!1,h({force:!0}))}function Fs(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Da(){if(!re||!fn||!Z)return;const e=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);re.dataset.loading=a.loading?"true":"false",re.dataset.route=a.route,re.dataset.walletConnected=e?"true":"false",e&&sw("shell-wallet-context"),e?Bc("shell-wallet-context"):Kl(),e||(a.tpslAutoEnableInFlight=!1,a.tpslAutoEnableScheduledAt=0),Fs(fn,!["intro","login"].includes(a.route)),Fs(vi,a.route!=="connect"),Fs(Z,a.route!=="terminal"),kt("[data-terminal-global-search]",a.route!=="terminal"),kt("[data-top-sync-strip]",a.route!=="terminal")}function Bn(){const e=!!($e&&a.loginModalOpen),t=!!a.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const n=p("[data-wallet-connect-modal]");n&&(n.style.pointerEvents=n.hidden?"none":"");const r=p("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function Ws(e,t=48){if(!e||document.hidden)return!1;try{const n=e.getBoundingClientRect();return n.width<24||n.height<t}catch{return!1}}function bc(e="resume"){if(!re||document.hidden)return;Da(),Bn();const t=`${Date.now()}:${e}`,n=re.style.transform;re.dataset.resumePaint=t,re.style.transform=n?`${n} translateZ(0)`:"translateZ(0)",re.offsetHeight,window.requestAnimationFrame(()=>{!re||re.dataset.resumePaint!==t||(re.style.transform=n,delete re.dataset.resumePaint)})}function pf(){if(!re)return!1;if(re.dataset.route!==a.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!$e||$e.hidden||!a.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!a.quickBuyModal?.open;if(e||t||Ws(re,80))return!0;if(a.route!=="terminal")return!1;const n=p("[data-panel]");return Z?.hidden||Ws(Z,80)||n&&Ws(n,32)||n&&!n.children.length&&!String(n.textContent||"").trim()?!0:![fn,vi,Z].some(o=>o&&!o.hidden)}function mf(e="watchdog"){const t=a.positionRefreshAction||{},n=t.startedAt?Math.max(0,C()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&n>Dp&&(Ue("error",{error:"Refresh delayed"}),E({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:n,details:e})),a.walletRefreshing&&!Xt&&(a.walletRefreshing=!1,a.walletRefreshStatus=a.walletRefreshStatus==="refreshing"?"timeout":a.walletRefreshStatus,kt("[data-refresh-spinner]",!0)),Bn(),oe()}function yc(e="watchdog",t={}){return mf(e),pf()?(E({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-yi),details:`${e}:${a.route}:${a.activeTab||""}`}),gs({keepLogin:a.route==="login"}),Da(),bc(e),h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):(t.forcePaint&&bc(e),!1)}function vc(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function wc(){try{return document.createElement("canvas")}catch{return null}}function Sc(){const e=wc();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function ff(){return vc()||Sc()}function Ns(){const e=qe()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";xt(e),typeof window.alert=="function"&&window.alert(e)}function kc(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function Rn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function $c(){const e=a.clipFarm?.fileExtension||Rn(a.clipFarm?.mimeType||a.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function In(){try{a.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}a.clipFarm?.fallbackFrameTimer&&clearInterval(a.clipFarm.fallbackFrameTimer),a.clipFarm?.fallbackStopTimer&&clearTimeout(a.clipFarm.fallbackStopTimer)}function xt(e=""){a.clipFarm={...a.clipFarm,status:String(e||"")},Ke()}function _s(){if(a.clipFarm?.videoUrl)try{URL.revokeObjectURL(a.clipFarm.videoUrl)}catch{}a.clipFarm={...a.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:a.clipFarm?.recording?"Recording...":""},Ke()}function Ke(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=a.clipFarm||{},n=ff(),r=!!t.recording,o=!!(t.blob&&t.videoUrl),s=t.status||(r?"Recording":o?"Clip ready":"Clip farm");e.innerHTML=`
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
          <a href="https://t.me/share/url?url=${encodeURIComponent(wt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${s?`<small>${l(s)}</small>`:""}
    </div>
  `}function Tc(){const e=he([...We()?.rows||[],...typeof Gn=="function"?Gn():[],...a.slimeScopeRows||[],...a.livePairRows||[],...Object.values(a.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:a.smartChartToken||a.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function Pc(e,t={}){const n=e?.getContext?.("2d");if(!n)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),o=720,s=1280;(e.width!==o*r||e.height!==s*r)&&(e.width=o*r,e.height=s*r,e.style.width=`${o}px`,e.style.height=`${s}px`),n.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),i=t.rows||Tc(),u=new Date;n.fillStyle="#020803",n.fillRect(0,0,o,s);const d=n.createRadialGradient(o*.2,s*.12,20,o*.2,s*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),n.fillStyle=d,n.fillRect(0,0,o,s),n.strokeStyle="rgba(118,255,45,0.38)",n.lineWidth=2,n.strokeRect(24,24,o-48,s-48),n.fillStyle="#baff4d",n.font="900 34px Arial, sans-serif",n.fillText("SlimeWire REC",48,88),n.fillStyle="#f4fff0",n.font="800 54px Arial, sans-serif",n.fillText("Fresh Live Picks",48,154),n.fillStyle="rgba(226,255,215,0.78)",n.font="700 22px Arial, sans-serif",n.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const m=o-96;n.fillStyle="rgba(118,255,45,0.12)",n.fillRect(48,226,m,12),n.fillStyle="#78ff2d",n.fillRect(48,226,Math.max(24,m*c),12),i.forEach((f,y)=>{const b=292+y*188,S=String(f.symbol||f.baseSymbol||v(f.tokenMint||"")||"Token").slice(0,18),T=String(f.name||f.category||"fresh pair").slice(0,34),A=F(f.marketCapLabel,f.fdvLabel,x(rt(f)),"checking"),g=F(f.liquidityLabel,x(ot(f)),"checking"),P=F(f.volumeH1Label,f.volumeLabel,x(f.volumeH1),"checking"),L=String(f.pairAgeLabel||Nt(f)||"live").slice(0,18);n.fillStyle="rgba(4,24,8,0.92)",n.strokeStyle="rgba(118,255,45,0.34)",n.lineWidth=2,n.beginPath(),typeof n.roundRect=="function"?n.roundRect(48,b,o-96,156,18):n.rect(48,b,o-96,156),n.fill(),n.stroke(),n.fillStyle="#f4fff0",n.font="900 32px Arial, sans-serif",n.fillText(S,76,b+48),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 18px Arial, sans-serif",n.fillText(T,76,b+78),[["MC",A],["LIQ",g],["VOL",P],["AGE",L]].forEach(([B,D],ne)=>{const we=76+ne*140;n.fillStyle="#aaff8f",n.font="800 15px Arial, sans-serif",n.fillText(B,we,b+114),n.fillStyle="#ffffff",n.font="900 23px Arial, sans-serif",n.fillText(String(D).slice(0,10),we,b+142)})}),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 20px Arial, sans-serif",n.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,s-78),n.fillStyle="#78ff2d",n.font="900 24px Arial, sans-serif",n.fillText("slimewire.org",48,s-44)}async function hf(e){Pc(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(o=>r(o),"image/png",.92)}catch{r(null)}});if(!t){Ns();return}const n=URL.createObjectURL(t);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:n,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},Ke()}async function gf(){const e=wc();if(!e){Ns();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await hf(e);return}_s();const n=Tc(),r=Date.now(),o=t.call(e,12),s=kc(),c=[],i=new MediaRecorder(o,s?{mimeType:s}:void 0),u=()=>Pc(e,{rows:n,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);i.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),i.addEventListener("stop",()=>{In();const f=s||"video/webm",y=new Blob(c,{type:f}),b=y.size>0?URL.createObjectURL(y):"",S=Rn(y.type||f);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:b,mimeType:y.type||f,fileExtension:S,status:y.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},Ke()},{once:!0}),i.start(500);const m=setTimeout(()=>{a.clipFarm?.recording&&On()},4300);a.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:s,fileExtension:Rn(s),recorder:i,stream:o,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:m},Ke()}async function Ac(){if(!vc()){if(Sc()){await gf();return}Ns();return}if(a.clipFarm?.recording){On();return}_s();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=kc(),n=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",o=>{o.data?.size>0&&n.push(o.data)}),r.addEventListener("stop",()=>{In();const o=t||"video/webm",s=new Blob(n,{type:o}),c=s.size>0?URL.createObjectURL(s):"",i=Rn(s.type||o);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:s.size>0?s:null,videoUrl:c,mimeType:s.type||o,fileExtension:i,status:s.size>0?`Clip ready (.${i}).`:"No clip captured."},Ke()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>On(),{once:!0}),r.start(1e3),a.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:Rn(t),recorder:r,stream:e,chunks:n},Ke()}catch(e){In(),a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},Ke()}}function On(){const e=a.clipFarm?.recorder;if(!e){In(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Ke();return}try{if(e.state!=="inactive"){xt("Saving clip..."),e.stop();return}}catch{}In(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Ke()}async function bf(){const e=a.clipFarm?.blob;if(!e){xt("Record a clip first.");return}const t=new File([e],$c(),{type:e.type||a.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),xt("Shared.");return}}catch(n){if(n?.name==="AbortError"){xt("Share cancelled.");return}}xt("Use Save, then attach the clip to X or Telegram.")}function yf(){const e=a.clipFarm?.videoUrl;if(!e){xt("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=$c(),document.body.appendChild(t),t.click(),t.remove(),xt("Saved.")}function vf(e=null,t="chartTxns"){const n=e||co(),r=String(n?.tokenMint||a.smartChartToken||"").trim();return r?{mint:r,mode:t,src:Ju(n,t)}:null}function wf(e={}){if(e.refreshSmartChartFrame||a.route!=="terminal"||a.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),n=t?.querySelector("iframe");if(!t||!n)return null;const r=String(t.dataset.chartMode||"chartTxns"),o=vf(null,r);if(!o||t.dataset.chartMint!==o.mint||t.dataset.chartMode!==o.mode)return null;const s=String(t.dataset.chartSrc||n.getAttribute("src")||""),c=t.dataset.loaded==="true",i=s!==o.src;return t.dataset.preserving="true",{frame:t,mint:o.mint,mode:o.mode,src:i?s:o.src,loaded:c,keepByMint:i}}function Sf(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),n=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${n}"]`),o=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||o!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!re||!fn||!Z)return;if(Da(),!e.force&&Es()){hc();return}const t=C(),n=`${a.route}:${a.activeTab||"none"}`;try{a.perfRenderCounts={...a.perfRenderCounts||{},[n]:(a.perfRenderCounts?.[n]||0)+1},a.pendingRender=!1;const r=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);Da(),re.dataset.activeTab=a.activeTab||"";const s=!!((e.preserveSmartChartFrame||a.activeTab==="smartChart")&&a.route==="terminal"&&a.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?wf(e):null,c=!!$e,i=!!(c&&a.loginModalOpen);ds&&(ds.hidden=c||!!a.user||a.loginCollapsed),kt("[data-connect-login-panel]",c||!!a.user||a.loginCollapsed),$e?($e.hidden=!i,$e.setAttribute("aria-hidden",i?"false":"true"),$e.toggleAttribute("inert",!i),document.body.classList.toggle("login-modal-open",i),document.querySelectorAll("[data-login-tab]").forEach(S=>{const T=S.dataset.loginTab===a.loginModalTab;S.dataset.active=T?"true":"false",S.setAttribute("aria-selected",T?"true":"false")}),kt("[data-login-modal-login-section]",a.loginModalTab!=="login"),kt("[data-login-modal-create-section]",a.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),wi&&(wi.hidden=!1),Si&&(Si.hidden=!!a.user),ki&&(ki.hidden=!a.user),Da(),Me("[data-user-id]",a.user?.id||"guest"),Me("[data-wallet-count]",Os()),Me("[data-total-sol]",Mt().toFixed(4));const u=et();Me("[data-position-count]",u.length),Me("[data-realized]",mc()),Me("[data-top-sol]",`${Mt().toFixed(4)} SOL`),Me("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Me("[data-sync-health]",r?xr():"Sync idle"),Me("[data-active-preset-label]",uf()),Us(),Tf(),kt("[data-refresh-spinner]",!a.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!Ap||!Sp(Se)});const d=p("[data-user-avatar]");d&&(d.innerHTML=qa("SW"));const m=p("[data-top-avatar]");m&&(m.innerHTML=qa("SW"));const f=a.user?.connectedWallet||null;Me("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${v(f.publicKey)}`:a.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=p("[data-logout]");y&&(y.hidden=!a.user,y.disabled=!!a.logoutPending,w(y,a.logoutPending?"Logging out...":"Log Out")),a.route==="terminal"&&If(),Sf(s),nh(),oh(),bl(),an(),ga(),Kr(),Zn(),Ke(),O(),Zy("render"),Bn(),oe();const b=C()-t;(b>=16||a.perfRenderCounts[n]%20===0)&&E({component:"render",action:"render",durationMs:b,resultCount:a.perfRenderCounts[n],details:n}),yi=Date.now()}catch(r){Da(),Bn(),vs({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const o=p("[data-panel]");a.route==="terminal"&&o?(Z.hidden=!1,o.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. Tap retry to redraw this panel without closing the window.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `):a.route==="terminal"&&Z&&(Z.hidden=!1,Z.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. The display refresh failed, but the app did not reload or submit another order.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function Cc(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const n=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(n)return`connected:${String(n).toLowerCase()}`;const r=Array.isArray(a.wallets)&&a.wallets.length?a.wallets.map(o=>o.publicKey||o.address||o.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function kf(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${Cc(e)}`)==="yes"}catch{return!1}}function Lc(e,t=""){try{const n=`tpslAutoRevoked:${Cc(t)}`;e?sessionStorage.setItem(n,"yes"):sessionStorage.removeItem(n)}catch{}}function Ds(e=""){Lc(!1,e)}function Mc(){return!!(Array.isArray(a.wallets)&&a.wallets.length||a.user?.connectedWallet||a.connectedWalletBalance?.publicKey)}function xc(){const e=a.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),n=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!a.user?.automationPermissionActive&&!n&&!e.revokedAt}function $f(){return!(!Mc()||kf()||xc()||a.tpslAutoEnableInFlight)}function Bc(e="wallet-session"){if(!$f())return;const t=C();a.tpslAutoEnableScheduledAt&&t-a.tpslAutoEnableScheduledAt<2e3||(a.tpslAutoEnableScheduledAt=t,a.tpslAutoEnableInFlight=!0,setTimeout(()=>{ll("enable",{auto:!0,reason:e}).catch(n=>{a.automationDelegationStatus=n?.message||"TP/SL auto-enable failed.",$(a.automationDelegationStatus)}).finally(()=>{a.tpslAutoEnableInFlight=!1,Us()})},50))}function Us(){const e=p("[data-tpsl-status-button]");if(!e)return;const t=p("[data-tpsl-status-label]"),n=a.user?.automationPermission||{},r=!!a.user?.automationPermissionActive,o=!!n.revokedAt,s=Date.parse(n.expiresAt||""),c=!!n.enabled&&Number.isFinite(s)&&s<=Date.now(),i=r?"enabled":o||c?"invalid":"disabled";e.dataset.tpslState=i;const u=i==="enabled"?"TP/SL Enabled":i==="invalid"?"Re-enable TP/SL":"Enable TP/SL";w(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=i==="enabled"?`Server exits enabled${n.expiresAt?` until ${ve(n.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Tf(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0,r=!!(t||n),o=r?"Connected":"Connect",s=t?"Wallet: Connected":n?`Wallets: ${n}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${v(t)}`:n?`${n} SlimeWire wallet${n===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(i=>{i.dataset.walletState=r?"connected":"disconnected",i.title=c,i.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=i.querySelector("[data-top-wallet-connect-label]")||i;w(u,o)}),document.querySelectorAll("[data-top-wallet-status]").forEach(i=>{i.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",i.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",i.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),w(i,s)})}async function Pf(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0;if(t){await Pe({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${v(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await bu();return}if(n>0){xe("/terminal","wallets");return}la({returnPath:"/terminal"})}function Af(e=document){const t=()=>{const n=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!n)return;const r=Math.max(0,n.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const Rc=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Cf=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Lf(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function En(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function qs(e=p("[data-panel]")){if(!e||a.route!=="terminal"||!Rc.has(a.activeTab))return null;const t=e.dataset.renderedTab,n=document.scrollingElement||document.documentElement,r={tab:a.activeTab,windowY:window.scrollY||0,documentY:n?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:Z?.scrollTop||0,anchorKey:"",anchorTop:0},o=Array.from(e.querySelectorAll(Cf));if(t&&t!==a.activeTab&&!o.length||!o.length)return r;const s=o.find(i=>{const u=i.getBoundingClientRect(),d=En()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||o[0],c=s?.dataset?.tokenChart||s?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:s?s.getBoundingClientRect().top:0}}function Hs(e,t=p("[data-panel]")){if(!e||a.route!=="terminal"||e.tab!==a.activeTab)return;const n=(s,c)=>{if(!s||!Number.isFinite(Number(c))||s.scrollHeight<=s.clientHeight+2)return;const i=Math.max(0,Math.min(Number(c),s.scrollHeight-s.clientHeight));Math.abs((s.scrollTop||0)-i)>4&&(s.scrollTop=i)},r=s=>{const c=document.scrollingElement||document.documentElement;n(Z,e.dashboardScrollTop),n(s,e.panelScrollTop),n(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},o=()=>{const s=t?.isConnected?t:p("[data-panel]");let c=!1;if(e.anchorKey&&s){const i=Lf(e.anchorKey),u=s.querySelector(`[data-token-chart="${i}"], [data-token-mint="${i}"]`);if(u){const m=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(m)&&Math.abs(m)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+m)),c=!0}}c||r(s)};o(),requestAnimationFrame(()=>{o(),window.setTimeout(o,90),window.setTimeout(o,240),En()&&window.setTimeout(o,520)})}function Ic(e,t){const n=Object.keys(e.dataset||{}).filter(s=>s!=="customFor"&&s!=="customSelect").sort().map(s=>`${s}=${e.dataset[s]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",o=`${e.tagName}:${e.type||""}:${e.name||""}:${n}${r}`;return n?o:`${o}:idx${t}`}function Oc(e){const t=Array.from(e.options||[]),n=t.find(r=>r.defaultSelected);return n?n.value:t[0]?.value??""}function Mf(e){if(!e||e.dataset.renderedTab!==a.activeTab)return null;const t=new Map;let n="",r=null,o=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((s,c)=>{const i=Ic(s,c);if(t.has(i))return;const u=s.type==="checkbox"||s.type==="radio",d=s.tagName==="SELECT",m=u?String(s.defaultChecked):d?Oc(s):s.defaultValue,f=u?String(s.checked):s.value;if(f!==m&&(t.set(i,{value:f,defaultValue:m,isToggle:u,isSelect:d}),document.activeElement===s)){n=i;try{r=s.selectionStart,o=s.selectionEnd}catch{}}}),t.size?{tab:a.activeTab,fields:t,focusedKey:n,selectionStart:r,selectionEnd:o}:null}function xf(e,t){if(!e||!t||e.tab!==a.activeTab)return;const n=Array.from(t.querySelectorAll("input, textarea, select")),r=o=>{n.forEach((s,c)=>{const i=s.tagName==="SELECT";if(o!==i)return;const u=Ic(s,c),d=e.fields.get(u);if(!d)return;const m=s.type==="checkbox"||s.type==="radio";if((m?String(s.defaultChecked):i?Oc(s):s.defaultValue)===d.defaultValue&&(m?s.checked=d.value==="true":s.value=d.value,u===e.focusedKey&&document.activeElement!==s))try{s.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&s.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function Bf(e){return!e||a.route!=="terminal"||a.activeTab==="terminal"||Rc.has(a.activeTab)||e.dataset.renderedTab!==a.activeTab||a.activeTab==="smartChart"&&a.chartScrollIntoView?null:{tab:a.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:Z?.scrollTop||0}}function Rf(e,t){if(!e||e.tab!==a.activeTab)return;const n=()=>{const r=t?.isConnected?t:p("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),Z&&Z.scrollHeight>Z.clientHeight+2&&(Z.scrollTop=Math.min(e.dashboardScrollTop,Z.scrollHeight-Z.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};n(),requestAnimationFrame(n)}function If(){const e=p("[data-panel]");if(!e)return;const t=qs(e),n=Mf(e),r=Bf(e),o=a.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,s=a.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),Mw(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===a.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const i=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!a.navTekOpen||!Jp()&&i}),a.activeTab==="terminal"&&(e.innerHTML=Dd()),a.activeTab==="tek"&&(e.innerHTML=Ef()),a.activeTab==="dashboard"&&(e.innerHTML=Uf()),a.activeTab==="profile"&&(e.innerHTML=qf()),a.activeTab==="trade"&&(e.innerHTML=Lh()),a.activeTab==="bundle"&&(e.innerHTML=Eh()),a.activeTab==="volume"&&(e.innerHTML=ag()),a.activeTab==="live"&&(e.innerHTML=Dd()),a.activeTab==="liveTrades"&&(e.innerHTML=gv()),a.activeTab==="slimeScope"&&(e.innerHTML=Vy()),a.activeTab==="watchlist"&&(e.innerHTML=Cv()),a.activeTab==="smartChart"&&(e.innerHTML=sv()),a.activeTab==="launchCoin"&&(e.innerHTML=cg()),a.activeTab==="launch"&&(e.innerHTML=ng()),a.activeTab==="kol"&&(e.innerHTML=Ag()),a.activeTab==="ogreAi"&&(e.innerHTML=Oh()),a.activeTab==="wallets"&&(e.innerHTML=Jb()),a.activeTab==="positions"&&(e.innerHTML=ty()),a.activeTab==="pnl"&&(e.innerHTML=ay()),a.activeTab==="txAudit"&&(e.innerHTML=Id()),a.activeTab==="sniper"&&(e.innerHTML=Bv()),e.dataset.renderedTab=a.activeTab||"",a.activeTab==="ogreTek"&&(e.innerHTML=_v(),e.dataset.renderedTab=a.activeTab||"",Wv()),xf(n,e),Wr(e),Rf(r,e),a.activeTab==="smartChart"&&a.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=p("[data-chart-buy-amount]");c&&c.focus(),a.chartFocusAmountInput=!1}),a.activeTab==="smartChart"&&a.chartScrollIntoView&&(Af(e),a.chartScrollIntoView=!1),a.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=o),requestAnimationFrame(()=>{Math.abs(window.scrollY-s)>8&&window.scrollTo(0,s);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=o)})}Hs(t,e),af(),sa(),Cr(),Cn(),Lr(),Bs(),a.activeTab==="kol"&&ol()}function Of(){const e=a.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${l(a.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${l(Mt().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${l(a.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${l(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Ef(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Of()}
      <div class="tek-tool-grid">
        ${e.map(([t,n,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${l(n)}</strong>
            <small>${l(r)}</small>
          </button>`).join("")}
      </div>
      ${Wf()}
      ${Nf()}
    </section>
  `}function Ec(){const t=Vn().filter(i=>{const u=Number(i.marketCapUsd??i.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active"].includes(String(i.status||"").toLowerCase())),o=r.filter(i=>{const u=Number(i.lastMovePct??i.wallets?.[0]?.lastMovePct),d=Number(i.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,s=Number(a.shieldReceipts?.stats?.watching||0),c=Number(a.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${o?` - ${o} near take-profit`:""}`:"",s?`🔎 ${s} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let Fc=!1;function Ff(){if(Fc||rn().length)return;Fc=!0;const e=Ec();ie({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}. Ask me anything or say "open positions".`:'Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat. Try "whats cooking" or paste a token address.',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function Wf(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...Ec(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${l(t)}</li>`).join("")}
      </ul>
    </section>
  `}function Nf(){Df();const e=a.shieldReceipts;if(!e)return`
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
                <strong>$${l(r.symbol||v(r.mint))} <span class="negative">rugged</span></strong>
                <span>Flagged ${l(r.verdict)} (score ${l(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${l(_f(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${l(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function _f(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let Wc=0;function Df(){Date.now()-Wc<300*1e3||(Wc=Date.now(),k("/api/web/shield/receipts").then(e=>{a.shieldReceipts=e,a.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{a.proofStats=e?.alpha||null}).catch(()=>{}))}function Uf(){return`
    ${Qf()}
    ${Ua()}
    <section class="panel-grid">
      ${Fn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Fn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Fn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Fn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Fn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${Uc()}
    ${Dc()}
    ${qc()}
  `}function qf(){if(!Ks())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${Nc(!1)}
        <section class="profile-row-list">
          ${Xf()}
          ${_c()}
        </section>
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:Jf()},{key:"login",label:"Login",hint:"Security",html:Yf()},{key:"pfp",label:"PFP",hint:"Avatar",html:Zf()},{key:"x",label:"X",hint:"Connect X",html:sh()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:Hf()},{key:"badges",label:"Badges",hint:"Earned",html:_c()},{key:"referral",label:"Referral",hint:"Invite & earn",html:lh()},{key:"board",label:"Board",hint:"Top traders",html:ch()}];return`
    <section class="profile-row-shell">
      ${Nc(!0)}
      ${Ka({toolKey:"profile",activeKey:Va("profile","account"),sections:t})}
    </section>
  `}function Hf(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",n=a.pushAlertsEnabled===!0;return`
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
  `}async function Kf(){const e=p("[data-push-status]");try{w(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){w(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),w(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){w(e,N(t?.message||"Could not create the link."))}}function Vf(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(n);return Uint8Array.from([...r].map(o=>o.charCodeAt(0)))}async function zf(){const e=p("[data-push-status]");try{w(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){w(e,"Push alerts are not configured on the server yet.");return}const n=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){w(e,"Notification permission was not granted.");return}const o=await n.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Vf(t.publicKey)}),s=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:o.toJSON()})});a.pushAlertsEnabled=!0,w(e,`Push alerts enabled (${s.devices||1} device${(s.devices||1)===1?"":"s"}).`),h()}catch(t){w(e,N(t?.message||"Could not enable push alerts."))}}async function jf(){const e=p("[data-push-status]");try{const n=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:n.endpoint})}).catch(()=>{}),await n.unsubscribe().catch(()=>{})),a.pushAlertsEnabled=!1,w(e,"Push alerts disabled on this device."),h()}catch(t){w(e,N(t?.message||"Could not disable push alerts."))}}async function Gf(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a.pushAlertsEnabled=!!t}catch{}}function Ks(){return!!(se()?.publicKey||a.user?.connectedWallet?.publicKey||Array.isArray(a.wallets)&&a.wallets.length)}function Nc(e=Ks()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function Xf(){const e=se();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Rr().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${l(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${l(e.shortPublicKey||v(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function Jf(){const e=a.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${qa("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${l(e.shortPublicKey||v(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${l(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function Yf(){const e=a.user?.username||"";return`
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
  `}function Qf(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Fn(e,t,n,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${l(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${l(t)}</h3>
        <p>${l(n)}</p>
      </div>
    </article>
  `}function Zf(){const e=!!a.user?.avatar,t=a.xHandle?`@${a.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${qa("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${eh()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${a.xHandle?"":"disabled"}>${t?`Use ${l(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${a.user.avatarSource?` from ${l(a.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function eh(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,n])=>`
        <button type="button" data-preset-avatar="${l(t)}" data-avatar-label="${l(n)}" aria-label="Use ${l(n)} PFP">
          <img src="${l(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function _c(){const e=Number(a.pnl?.totals?.tradeCount||0),t=Ks(),n=Number(a.livePairRows?.length||0)+Number(a.terminalEntry?.items?.length||0)+Number(a.livePairsByBucket?.fresh?.length||0),r=!!(a.lastUpdatedAt&&!a.walletRefreshError||a.walletRefreshStatus==="success"),o=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:n>0||!!a.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!ae("trade",a.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(a.livePairRows?.length||a.scan||a.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],s=o.filter(i=>i.earned).length,c=Math.round(s/Math.max(1,o.length)*100);return`
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
  `}function Ua(){const e=a.user?.connectedWallet,t=!!a.user?.avatar,n=a.xHandle?`@${a.xHandle}`:"";return`
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
          ${Rr().map(r=>`
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
        <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||v(e.publicKey))}.`:"Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      ${Vs()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${qa("SW")}</div>
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
  `}function jw(){const e=a.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Rr().map(t=>`
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
      <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||v(e.publicKey))}.`:"Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
    ${Vs({compact:!0})}
  `}function Vs({compact:e=!1}={}){const t=a.user?.connectedWallet,n=Array.isArray(a.wallets)?a.wallets.length:0,r=a.wallets.filter(u=>u.sessionWallet),o=a.user?.automationPermission||{},s=!!a.user?.automationPermissionActive,c=o.expiresAt?ve(o.expiresAt):"",i=a.automationDelegationStatus||(n?`${n} managed automation wallet(s) available. ${s?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
  `}function la({returnPath:e="/terminal"}={}){a.walletConnectMenuOpen=!0,a.walletConnectReturnPath=e||"/terminal",a.walletConnectStatus=a.user?.connectedWallet?`Connected ${v(a.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function th(e={}){return la(e)}window.openWalletConnectModal=th;function ah(e){a.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",a.walletFastApprovalsEnabled?"on":"off")}catch{}}function nh(){const e=p("[data-wallet-connect-modal]");if(!e)return;if(!a.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="";return}const t=a.user?.connectedWallet||a.connectedWalletBalance;e.hidden=!1,e.innerHTML=`
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
        ${Rr().map(n=>`
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
  `}function rh(){const e=a.quickBuyModal||{},t=co()?.tokenMint===e.tokenMint?co():fe(e.tokenMint,{source:e.source||"quick-buy-modal"}),n=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=zs(e.error||e.status||""),o=n||!!r,s=le(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${st(t)}
          <div>
            <h3>Quick Buy</h3>
            <p>${l(t.symbol||v(e.tokenMint))} - ${l(v(e.tokenMint))}</p>
          </div>
        </div>
        <button type="button" class="icon-button" data-quick-buy-close aria-label="Close Quick Buy">x</button>
      </div>
      <label>
        Wallet
        <select data-quick-buy-modal-wallet>
          ${Ha(e.walletIndex||(se()?.publicKey?"connected":""))}
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
        ${W("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(e.tokenMint||"")}" data-protected-buy-source="quick-buy-modal">Protected</button>`:""}
        <button type="button" class="primary" data-quick-buy-confirm ${o?"disabled":""}>${n?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${s?`<small class="quick-buy-wallet-note">${a.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${l(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${l(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${l(e.error||"")}</small>`}
    </section>
  `}function zs(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function oh(){let e=p("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!a.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=rh(),document.body.classList.add("quick-buy-modal-open")}function sh(){const e=!!a.xHandle;return`
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
  `}function lh(){const e=a.user?.referralCode||"",t=`${wt.replace(/\/+$/,"")}/r/`,n=a.user?.referralLink||(e?`${wt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=a.user?.referralStats||{},o=Array.isArray(r.referrals)?r.referrals:[];return`
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
        ${n?Ve(`Trade faster on SlimeWire. Referral: ${n}`,"Share X"):""}
        ${n?Hc(`Trade faster on SlimeWire. Referral: ${n}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${l(e)}${a.user?.referredByCode?` | Referred by ${l(a.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function ih(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,wt).pathname.split("/").map(s=>s.trim()).filter(Boolean),o=r.findIndex(s=>s.toLowerCase()==="r");if(o>=0&&r[o+1])return decodeURIComponent(r[o+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function ch(){const e=a.user?.traderBoardWalletMode||"all",t=Array.isArray(a.user?.traderBoardWalletIndexes)?a.user.traderBoardWalletIndexes:a.wallets.map(n=>String(n.index));return`
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
        ${a.wallets.length?pt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${a.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function Dc(){return`
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
  `}function Uc(){return`
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
  `}function qc(){return a.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ve(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${l(e)}">${l(t)}</button>`}function Hc(e,t="TG"){const n=js(e),r=`https://t.me/share/url?url=${encodeURIComponent(wt)}&text=${encodeURIComponent(n)}`;return`<a href="${l(r)}" target="_blank" rel="noreferrer">${l(t)}</a>`}function js(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${wt}`}function uh(e){const t=e.type==="buy",n=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||v(e.tokenMint)} for ${n}. Chart ${X(e.tokenMint)}`}function Gw(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||v(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function dh(e,t="Armed timed trade"){return`${t} on ${e.shortMint||v(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Kc(e){return`PnL on ${e.shortMint||v(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function ph(e){return`Watching ${e.shortMint||v(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function mh(e){return`Watching ${e.symbol||v(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${X(e.tokenMint)}`}function fh(e){return`KOL signal ${e.symbol||v(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${X(e.tokenMint)}`}function hh(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||v(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function gh(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Gs(e){const t=String(e||"").trim(),n=t.startsWith("$")?t:t.length>30?v(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${X(t)}`:"";return`Watching ${n}.${r}`}function Vc(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?v(t):`@${t.replace(/^@+/,"")}`}.`}const bh=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function Xs(e=""){const t=String(e||"").trim().toLowerCase();return bh.filter(n=>!t||String(n.tier||"").toLowerCase()===t).sort((n,r)=>+!!r.pinned-+!!n.pinned||Number(n.rank||999)-Number(r.rank||999))}function Bt(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function zc(e=""){const t=String(e||"").trim();return Bt(t)?t:""}function yh(e={}){const t=String(e.wallet||"").trim(),n=zc(t),r=je(e.twitter||e.x||e.username||"");return{x:r?Qs(r):"",wallet:n?`https://solscan.io/account/${encodeURIComponent(n)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(n?Vi(n):"")}}function vh(e={}){const t=String(e.wallet||"").trim(),n=zc(t),r=yh(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${l(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${l(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${l(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${n?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${n?`<button data-kol-scan-wallet="${l(n)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${n?`<button data-kol-copy-wallet="${l(n)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${n?`<button data-copy="${l(n)}">CA</button>`:""}
      ${rl(e)}
    </div>
  `}function jc(e={},t={}){const n=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${n?"is-compact":""}" data-tier="${l(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${Jc(e,n?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${l(e.tag||"Curated wallet")}</span>
          <h3>${l(e.name||e.twitter||v(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${l(je(e.twitter))}`:l(v(r)||"Social pending")}</p>
        </div>
        <b>#${l(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${l(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${l(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${l(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${l(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${vh(e)}
    </article>
  `}function wh(){const e=Xs("hot"),t=Xs("slimewire");return`
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
            ${e.length?e.map(n=>jc(n)).join(""):R("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(n=>jc(n,{compact:!0})).join(""):R("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function qa(e="SW"){const t=dt(a.user?.avatar||"");if(Gc(t))return`<img src="${l(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${Dl("ogre")}';">`;const n=Dl("ogre");if(e==="SW"||e==="OG")return`<img src="${n}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${l(r)}</span>`}function Gc(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function dt(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const n=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return n?`https://ipfs.io/ipfs/${encodeURIComponent(n).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function Sh(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function kh(e="",t=""){const n=String(e||"").trim(),r=dt(t);if(!n||!r||Br(n,r))return"";if(it.set(n,r),ee("avatarCacheHit"),it.size>900){for(const o of it.keys())if(it.delete(o),it.size<=720)break}return r}function Xc(e="",t=""){return`${String(e||"").trim()}|${dt(t)}`}function $h(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function Br(e="",t=""){const n=Xc(e,t);if(!jt.has(n))return!1;const r=Number(or.get(n)||0);return r&&Date.now()-r>$h(t)?(jt.delete(n),or.delete(n),!1):!0}function Th(e="",t=""){const n=String(e||"").trim(),r=dt(t);if(!n||!r)return;const o=Xc(n,r);if(jt.add(o),or.set(o,Date.now()),jt.size>1200){for(const s of jt)if(jt.delete(s),or.delete(s),jt.size<=900)break}it.get(n)===r&&it.delete(n),ee("avatarFetchFailed")}function Js(e="",...t){const n=String(e||"").trim(),r=n?it.get(n):"";if(r&&!Br(n,r))return ee("avatarCacheHit"),r;r&&it.delete(n);for(const o of t){const s=dt(o);if(s&&!Br(n,s))return ee("avatarCacheMiss"),s}return ee("avatarFallbackShown"),""}window.__slimeRememberAvatar=kh,window.__slimeAvatarLoadFailed=function(t){const n=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Th(n,r);const o=dt(t?.dataset?.backupSrc||"");if(o&&!Br(n,o)){t.dataset.backupSrc="",t.dataset.avatarSrc=o,t.src=o;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function Ys(e){const t=je(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function Qs(e=a.xHandle){const t=je(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Ph(e={}){const t=dt(e.avatar||e.image||"");if(Gc(t))return t;const n=je(e.twitter||e.x||e.username||"");if(n)return Ys(n);const r=je(e.name||e.kolName||"");return r&&r.length>=2?Ys(r):""}function Ah(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function Jc(e={},t="kol-avatar"){const n=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=Js(n,Ph(e)),o=Ah(e);return r?`<img class="${l(t)}" src="${l(r)}" data-avatar-key="${l(n)}" data-avatar-fallback="${l(o)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${l(t)} kol-avatar-fallback" aria-hidden="true">${l(o)}</div>`}function Rr(){const e=qe();return[{id:"phantom",label:"Phantom",detected:!!de("phantom"),mobileRedirect:e&&!!Sn("phantom"),installUrl:$s("phantom"),icon:Ea("phantom")},{id:"solflare",label:"Solflare",detected:!!de("solflare"),mobileRedirect:e&&!!Sn("solflare"),installUrl:$s("solflare"),icon:Ea("solflare")},{id:"backpack",label:"Backpack",detected:!!de("backpack"),mobileRedirect:!1,installUrl:$s("backpack"),icon:Ea("backpack")},{id:"solana",label:"Detected Wallet",detected:!!de("solana"),mobileRedirect:!1,installUrl:"",icon:Ea("solana")}]}function de(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Ie(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function se(){return a.user?.connectedWallet||a.connectedWalletBalance||null}function Ch(e=""){const t=se();if(!t?.publicKey)return"";const n=String(e||"")==="connected"||!e&&!a.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${n?"selected":""}>${l(r)} - ${l(v(t.publicKey))}</option>`}function v(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}function Lh(){const e=se(),t=a.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const n=Is(),r=dc(),o=cc(n)||{symbol:n==="SOL"?"SOL":v(n),name:n==="SOL"?"Solana":""},s=cc(r)||{symbol:r?v(r):"Custom",name:r?"Selected token":"Paste CA below"},c=lf(),i=a.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":i?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=i?n:r,m=d&&d!=="SOL"?d:a.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${i?"100":"0.0"}" aria-label="${i?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${uc(n,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${l(m||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${uc(r,{includeCustom:!0})}
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
                ${Ha(e?.publicKey&&!t?"connected":"")}
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
          ${a.tradeToken?`<div class="card-actions">${Ve(Gs(a.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${Dh()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${Mh()}
        ${xh()}
      </aside>
    </section>
  `}function Zs(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!e?.volumeBot)}function Yc(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!!e?.volumeBot)}function Ha(e=""){const t=Ch(e),n=Zs().map(r=>{const o=a.balances.find(i=>Number(i.index)===Number(r.index)),s=o?.sol!==null&&o?.sol!==void 0?`${Number(o.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${l(r.label)}${c} - ${s}</option>`}).join("");return t||n?`${t}${n}`:'<option value="">No wallet connected</option>'}function Mh(){if(!a.tradeResult)return`
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
        ${Ve(uh(e))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function xh(){if(!a.tradePlanResult)return`
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
        <div><dt>Timer Exit</dt><dd>${l(qh(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${Ve(dh(e,"Armed managed trade"))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Qc(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const n=t.toLowerCase(),r=n.includes("bonk")?"Bonk":n.includes("meteora")?"Meteora":n.includes("orca")?"Orca":n.includes("raydium")?"Raydium":n.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${l(t)}">${l(r)}</span>`}function Bh(){if(!a.ogreAiResult)return`
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
              ${Qc(s)}
              <span>${l(s.name||o.tokenMint||"")}</span>
              <small>Score ${l(s.score||"n/a")} | MC ${l(s.marketCapLabel||"n/a")} | Liq ${l(s.liquidityLabel||"n/a")} | Age ${l(s.ageLabel||"n/a")}</small>
              ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(c=>l(c)).join(" | ")}</small>`:""}
              <small>${l(o.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${l(o.tokenMint)}">Copy CA</button>
                <a href="${l(s.dexUrl||o.dexUrl||X(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${s.pumpUrl?`<a href="${l(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":n.map(o=>`
          <div class="ogre-ai-pick-card">
            <strong>${l(o.symbol||o.shortMint||"Pick")}</strong>
            ${Qc(o)}
            <span>${l(o.name||o.tokenMint||"")}</span>
            <small>Score ${l(o.score||"n/a")} | MC ${l(o.marketCapLabel||"n/a")} | Liq ${l(o.liquidityLabel||"n/a")} | Age ${l(o.ageLabel||"n/a")}</small>
            ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(s=>l(s)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${l(o.tokenMint)}">Copy CA</button>
              <a href="${l(o.dexUrl||X(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${o.pumpUrl?`<a href="${l(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(o=>`<span data-ok="false">${l(o.shortMint||o.tokenMint)}: ${l(o.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const Wn=[["super_fresh","Super-fresh","Brand-new sub-$8K launches with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function Ir(){const e=n=>Wn.some(([r])=>r===n);if(a.ogreAiCategory&&e(a.ogreAiCategory))return a.ogreAiCategory;const t=pi().category;return e(t)?t:"super_fresh"}function Zc(e){const t=Wn.find(([n])=>n===e);return t?t[2]:Wn[0][2]}function Rh(e){return`<div class="ogre-cat-segment" role="group">${Wn.map(([t,n])=>`<button type="button" data-ogre-cat="${l(t)}" data-active="${e===t}">${l(n)}</button>`).join("")}</div>`}function Ih(){const e=a.ogreAutopilot||{},t=!!e.enabled,n=eu(e.category||Ir()),r=(c,i)=>c==null||c===""?i:c,o=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),s=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
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
  `}function eu(e){const t=Wn.find(([n])=>n===e);return t?t[1]:"Super-fresh"}function Oh(){if(!a.wallets.length)return`${Ua()}${R("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=pi(),t=e.amountSol||"0.1",n=e.runCount||"1",r=(s,c,i)=>{const u=String(s||i||"");return u==="custom"?String(c||"custom"):u},o=Ir();return`
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
          ${Rh(o)}
          <small class="ogre-cat-hint">${l(Zc(o))}</small>
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
          ${It({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${It({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${ze("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${It({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${pt("ogre-ai")}
        </div>
        ${Rt("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${a.ogreAiLoading?"disabled":""}>${a.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${l(a.ogreAiStatus||Zc(o))}</small>
      </article>

      <aside class="trade-side">
        ${Vs({compact:!0})}
        ${Ih()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${Bh()}
      </aside>
    </section>
  `}function Eh(){return a.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${a.bundleToken?X(a.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${Ka({toolKey:"bundle",activeKey:Va("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${l(a.bundleToken||a.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${pt("bundle")}
        </div>
        ${Rt("bundle")}
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
              ${ze("bundle-plan-delay","data-bundle-plan-delay","5")}
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
              ${Or("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${Fr("bundle-plan")}
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
        ${Uh()}
        ${Fh()}
      </aside>
    </section>
  `:`${Ua()}${R("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function Fh(){if(!a.bundleResult)return`
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
  `}function pt(e,t=null){const n=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return Zs().map((o,s)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${o.index}" ${r?r.has(String(o.index))?"checked":"":s<n?"checked":""}>
      <span>${o.index}. ${l(o.label)}</span>
      <code>${l(o.shortPublicKey||o.publicKey)}</code>
    </label>
  `).join("")}function Rt(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${l(t)}">
    </label>
  `}function Wh(e=""){return a.wallets.length?a.wallets.map((t,n)=>{const r=String(t.index??n+1),o=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||v(t.publicKey||"")}`;return`<option value="${l(r)}" ${String(e)===r?"selected":""}>${l(o)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function M(e,t,n=""){const r=p(e)?.value||n;if(r!=="custom")return r;const o=p(t)?.value?.trim();if(!o)throw new Error("Enter the custom value first.");return o}function tt(e,t=""){const n=a.presets?.[e]||[],r=!t||t==="none"||t==="manual",o=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return n.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${n.map(s=>`<option value="${l(s.id)}" ${s.id===t?"selected":""}>${l(s.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
    `}function tu(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${l(De()||"0.10")}" value="${l(a.quickBuyAmountOverride)}">`}function au(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${tu()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${l(e)}">
          ${tt("trade",a.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const Nh=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],_h=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function It({selectAttr:e,customAttr:t,customFor:n,options:r,selected:o="",customType:s="text",customPlaceholder:c="Custom time"}){const i=String(o||""),d=new Set(r.map(([f])=>f)).has(i)?i:"custom",m=d==="custom"&&i!=="custom"?i:"";return`
    <select ${e} data-custom-select="${l(n)}">
      ${r.map(([f,y])=>`<option value="${l(f)}" ${f===d?"selected":""}>${l(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${l(n)}" type="${l(s)}" value="${l(m)}" placeholder="${l(c)}" ${d==="custom"?"":"hidden"}>
  `}function ze(e,t,n="off"){return It({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:Nh,selected:n,customPlaceholder:"Custom: 45s, 20, 2h"})}function Or(e,t,n="0"){return It({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:_h,selected:n,customPlaceholder:"Custom: 30s, 20, 2h"})}function el(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${tu()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${l(e)}">
          ${tt("trade",a.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${l(e)}">
          ${tt("bundle",a.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function Xw(){const e=a.fastTradePresetStatus||(a.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${Ha()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${ze("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function Jw(){const e=a.fastBundlePresetStatus||(a.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${pt("fast-bundle-preset")}</div>
        ${Rt("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${ze("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function nu(e){const t=e==="trade"?a.editingTradePresetId:a.editingBundlePresetId;return t?ae(e,t):null}function Er(e,t){e==="trade"&&(a.editingTradePresetId=t||""),e==="bundle"&&(a.editingBundlePresetId=t||"")}function Dh(){const e=nu("trade"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${l(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${Ha(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${l(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${l(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${ze("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${ru("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function Uh(){const e=nu("bundle"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${l(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${pt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Rt("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${l(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${l(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${ze("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${ru("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function ru(e){const t=a.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const n=e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId;return`
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
  `}function qh(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function Fr(e){return`
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
  `}function ia(e){return{walletTakeProfitTargets:M(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:M(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function Wr(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(o=>o.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function Hh(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),n=document.querySelector(`[data-custom-select="${t}"]`);n&&(n.value="off"),Wr()}function ou(){return a.wallets.map(e=>`<option value="${l(e.index)}">${l(e.index)}. ${l(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function Kh(){return a.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${ou()}</select>
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
  `:""}function Nr(e){a.distributeStatus=String(e||"");const t=p("[data-distribute-status]");t&&(t.textContent=a.distributeStatus)}function Vh(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.wallets.filter(r=>r.sessionWallet),n=t.length?t:a.wallets;return n.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${l(v(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${a.returnFundsBusy?"disabled":""}>${a.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${l(a.returnFundsStatus||`${n.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Nn(e){a.returnFundsStatus=String(e||"");const t=p("[data-return-funds-status]");t&&(t.textContent=a.returnFundsStatus)}async function su(e="leaving"){try{const t=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!t?.publicKey)return;const n=a.wallets.filter(s=>s.sessionWallet);if(!n.length)return;const r=n.map(s=>String(s.index));if(!await Pe({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${v(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Q})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function zh(){if(a.returnFundsBusy)return;const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey){Nn("Connect a wallet first.");return}const t=a.wallets.filter(s=>s.sessionWallet),r=(t.length?t:a.wallets).map(s=>String(s.index));if(!r.length){Nn("No managed wallets to return from.");return}if(await Pe({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${v(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){a.returnFundsBusy=!0,Nn("Selling tokens and returning SOL..."),h();try{const s=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Q});a.returnFundsBusy=!1,Nn(s.summary||"Funds returned to your connected wallet."),await Ne({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(s){a.returnFundsBusy=!1,Nn(s.message),h()}}}async function jh(){if(a.distributeBusy)return;const e=p("[data-distribute-count]")?.value||"5",t=p("[data-distribute-amount]")?.value||"",n=p("[data-distribute-source]")?.value||"1",r=p("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){Nr("Enter SOL per wallet greater than zero.");return}const o=(Number(t)||0)*(Number(e)||0);if(await Pe({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${o.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){a.distributeBusy=!0,Nr("Creating and funding wallets..."),h();try{await G(p("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:n,label:r}),dedupe:!1,timeoutMs:Q});c.downloads?.encryptedBackup?.text&&pe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&pe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.distributeBusy=!1,Nr(c.summary||"Fresh wallets created and funded. Backups downloaded."),await Ne({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){a.distributeBusy=!1,Nr(c.message),h()}}}function Gh(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function Xh(){const e=Yc().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${a.sweepBackgroundStatus?`<small data-sweep-background-status>${l(a.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function Jh(){const e=Array.isArray(a.volumeBots)?a.volumeBots:[],t=Xh();return e.length?t+e.map(n=>{const r=n.stats||{},o=n.status!=="completed",s=(n.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${l(n.shortMint||n.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${l(n.stage||"")}">${l(Gh(n))}</span>
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
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function tl(e,t,n){return`<div class="vbot-segment" role="group">${n.map(([r,o])=>`<button type="button" data-vbot-set-${e}="${l(r)}" data-active="${t===r}">${l(o)}</button>`).join("")}</div>`}function Yh(){const t=(Array.isArray(a.volumeBots)?a.volumeBots:[]).filter(c=>c.status!=="completed"),n=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),o=c=>c.reduce((i,u)=>i+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),s=(c,i,u,d,m)=>`
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
    </div>`}function Qh(){return`
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
        <div class="ovs-mode">${tl("mode",a.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${tl("aggr",a.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${ou()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Stagger pattern</span>
            ${tl("stagger",a.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Ladder"]])}
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
          ${Yh()}
        </div>

        <div class="volume-bot-list">
          ${Jh()}
        </div>
      </div>
    </section>
  `}function Zh(){const e=a.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(a.slimeBotAggr)?a.slimeBotAggr:"med",n=Math.max(.05,Math.min(50,Number(p("[data-vbot-invest-num]")?.value||p("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(p("[data-vbot-duration]")?.value||"60"))),s={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",i=s.delaySecs*(c?4:1);let u=Math.round(r*60/i);u=Math.max(1,Math.min(250,u,Math.floor(n/.01)));const d=Math.max(.005,Math.min(.5,n/u));return{tokenMint:p("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:p("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(s.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(s.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(s.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!p("[data-vbot-keepdust]")?.checked,offsetSell:!!p("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(a.slimeBotStagger)?a.slimeBotStagger:"steady",investment:n,durationMin:r,mode:e,aggr:t}}function ca(e){a.volumeBotStatus=String(e||"");const t=p("[data-vbot-status]");t&&(t.textContent=a.volumeBotStatus)}async function _r({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");a.volumeBots=Array.isArray(t.bots)?t.bots:[],a.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function eg(){if(a.volumeBotBusy)return;const e=Zh();if(!e.tokenMint){ca("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Pe({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){a.volumeBotBusy=!0,ca("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:Q});a.volumeBotBusy=!1,r.bot&&(a.volumeBots=[r.bot,...a.volumeBots.filter(o=>o.id!==r.bot.id)]),ca(r.bot?.message||"SlimeBot started."),h(),_r()}catch(r){a.volumeBotBusy=!1,ca(r.message),h()}}}async function tg(e){if(e)try{ca("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:Q});t.bot&&(a.volumeBots=a.volumeBots.map(n=>n.id===t.bot.id?t.bot:n)),ca(t.bot?.message||"Stop requested."),h(),_r()}catch(t){ca(t.message)}}function ag(){return a.wallets.length?Qh():`${Ua()}${R("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function ng(){const e=he([...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...We()?.rows||[],...a.scan?.rows||[]]).sort(Je),t=Za(e),n=Ze("launch",t),r=Qa(),o=gt(Ce().keywords)[0]||"";return`
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
        ${Cl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${Al(e,t)}
        ${n.length?nt(n,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:ya}):r?Yn(e,"launch candidates"):R("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
        ${ra("launch",t,"launch candidates")}
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
          ${pt("launch")}
        </div>
        ${Rt("launch")}
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
            ${ze("launch-delay","data-launch-delay","3")}
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
            ${Or("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${Fr("launch")}
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
          <p>It scans live launch/profile feeds about every ${l(wg())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${du()}
        </article>
      </aside>
    </section>
  `}function lu(e=a.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||a.launchWatches?.[0]?.tokenMint||a.launchWatches?.[0]?.mint||a.smartChartToken?.tokenMint||a.smartChartToken?.mint||"").trim()}function al(){return!!(Vt&&Vt.enabled&&(Vt.provider||Vt.playbackBaseUrl||Vt.ingestUrl))}function rg(){const e=String(Vt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function og(e){const t=String(Vt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const n=t.includes("?")?"&":"?";return`${t}${n}mint=${encodeURIComponent(e)}`}function sg(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function iu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function lg(e=a.launchCoinDraft||{}){const t=lu(e),n=al(),r=og(t),o=a.pumpLiveStatus||(t?n?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),s=t?"":"disabled",c=n&&r?`<iframe class="pump-live-frame" src="${l(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
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
          <div class="pump-live-stat"><span>Launch CA</span><strong>${l(sg(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${l(rg())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${l(iu(t))}</strong></div>
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
  `}function Ka({toolKey:e,activeKey:t,sections:n,variant:r=""}){const o=n.some(s=>s.key===t)?t:n[0]?.key;return`
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
  `}function Va(e,t){return a.toolSections&&a.toolSections[e]||t}function ig(){const e=a.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,n=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${l(Zt(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ve(n+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function cg(){const e=a.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
              <span class="launch-image-preview-wrap" data-launch-image-preview-wrap hidden>
                <img class="launch-image-preview" data-launch-image-preview alt="Coin image preview">
                <span class="launch-image-preview-meta" data-launch-image-preview-meta></span>
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
                ${Wh(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
              </select>
            </label>
            <label>
              Dev Buy SOL (launch amount)
              <input data-launch-coin-dev-buy-sol type="text" inputmode="decimal" autocomplete="off" placeholder="0.05" value="${l(e.devBuySol||"")}">
            </label>
            <p class="muted full-span">Set the dev wallet buy amount here. After launch, SlimeWire can run the Dev Wallet Initial Buy first, then continue into your selected post-launch action.</p>
          </div>`},{key:"after",label:"After Launch",hint:"Auto trade / bundle",title:"Post-Launch Action",html:`
          <div class="volume-grid">
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
                ${tt("trade",e.tradePresetId||a.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${tt("bundle",e.bundlePresetId||a.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${l(e.amountSol||De()||"0.1")}">
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
              ${ze("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
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
                ${a.wallets.length?pt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Rt("launch-coin",e.walletGroup||"")}
          </div>`},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:lg(e)}];return`
    ${ig()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${Ka({toolKey:"launchCoin",activeKey:Va("launchCoin","coin"),sections:t})}

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
          ${du()}
        </article>
      </aside>
    </section>
  `}function ug(){const e=a.launchCoinDraft||{},t=p("[data-launch-coin-image]")?.files?.[0];return{name:(p("[data-launch-coin-name]")?.value||"").trim(),symbol:(p("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(p("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",website:(p("[data-launch-coin-website]")?.value||"").trim(),x:(p("[data-launch-coin-x]")?.value||"").trim(),telegram:(p("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:p("[data-launch-coin-creator-fee]")?.value||e.creatorFeeBps||"0",creatorFeeRecipient:(p("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:p("[data-launch-coin-fee-mode]")?.value||e.feeMode||"standard",buybackWallet:(p("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!p("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!p("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:p("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:j(p("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(p("[data-launch-coin-ca]")?.value||"").trim(),action:p("[data-launch-coin-action]")?.value||"watch",tradePresetId:p("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:p("[data-launch-coin-bundle-preset]")?.value||"",amountSol:j(p("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:p("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:_e("launch-coin"),walletGroup:p("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:M("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:M("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:M("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:M("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function Dr(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function nl({silent:e=!1}={}){try{const t=ug();a.launchCoinDraft=t,fi(t);const n=t.name||t.symbol||"launch";return a.launchCoinStatus=`Saved ${n}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${Dr(t.action)}.`,e||w(p("[data-launch-coin-status]"),a.launchCoinStatus),t}catch(t){throw a.launchCoinStatus=t.message,w(p("[data-launch-coin-status]"),t.message),t}}function dg(e){return new Promise((t,n)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>n(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function pg(e){return new Promise((t,n)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>n(new Error("Could not preview that image for compression.")),r.src=e})}function mg(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function fg(e){if(!e)return"";const t=8*1024*1024,n=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const o=await dg(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(o.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return o}try{const s=await pg(o),c=384,i=Math.min(1,c/Math.max(s.width||c,s.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((s.width||c)*i)),u.height=Math.max(1,Math.round((s.height||c)*i)),u.getContext("2d").drawImage(s,0,0,u.width,u.height);const m=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of m){const b=u.toDataURL(f,y);if(b.length<=n)return b}}catch(s){const c=p("[data-launch-coin-status]"),i="Preview unavailable; SlimeWire will try to convert this image during launch.";if(a.launchCoinStatus=i,w(c,i),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:s?.message||""}),o.length<=r)return o}if(o.length<=r){const s=p("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return a.launchCoinStatus=c,w(s,c),o}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function hg(){const e=p("[data-launch-coin-image]")?.files?.[0];if(!e)return{};const t=await fg(e);return{imageName:e.name,imageType:mg(t,e.type||"application/octet-stream"),imageDataUrl:t}}function cu(e,t){const n=String(t||"").trim();a.launchCoinDraft={...e||{},tokenMint:n,updatedAt:new Date().toISOString()},fi(a.launchCoinDraft),a.terminalToken=n,a.terminalAutoToken=n,a.tradeToken=n,a.bundleToken=n,a.volumeToken=n,a.smartChartToken=n,e?.tradePresetId&&(a.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(a.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(a.quickBuyAmountOverride=j(e.amountSol))}function gg(e={}){const t=e.tradePresetId?ae("trade",e.tradePresetId):null,n=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,amountSol:j(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function bg(e={}){const t=e.tradePresetId?ae("trade",e.tradePresetId):null,n=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,walletIndexes:[n],amountSol:j(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function uu(e={}){const t=e.bundlePresetId?ae("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:j(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function yg(){const e=nl({silent:!0}),t=String(e.tokenMint||"").trim(),n=p("[data-launch-coin-status]");if(!t||t.length<32){a.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",w(n,a.launchCoinStatus);return}cu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";a.launchCoinStatus=`Loaded ${v(t)} into ${Dr(e.action)}. Review the selected preset before sending any trade.`,xe("/terminal",r),h({force:!0})}async function vg(){if(a.launchCoinSubmitting)return;const e=p("[data-launch-coin-status]"),t=p("[data-launch-coin-submit]");a.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const n=nl({silent:!0});if(!n.name||String(n.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!n.symbol||String(n.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!p("[data-launch-coin-image]")?.files?.[0]&&!await Pe({title:"No Coin Image Selected",lines:[`${n.name} (${n.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){a.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",w(e,a.launchCoinStatus);return}a.launchCoinStatus="Preparing image for SlimeWire backend conversion...",w(e,a.launchCoinStatus);const r=await hg(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let s=null;if(n.action==="bundle"){const y=uu(n);s={walletIndexes:y.walletIndexes||[],walletGroup:y.walletGroup||"",amountSol:y.amountSol||"0",slippageBps:y.slippageBps||"300"}}const c={...n,...r,launchAttemptId:o,...s?{bundleBuy:s}:{}},i=JSON.stringify(c);if(i.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:n.symbol,selectedDevWalletId:n.selectedDevWalletId||n.devWalletIndex||n.devWalletPublicKey||""}),a.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,w(e,a.launchCoinStatus);const d=(await k("/api/web/launch/coin",{method:"POST",body:i,timeoutMs:Q,preserveSafeError:!0})).launch||{},m=String(d.tokenMint||d.mint||d.ca||d.contractAddress||"").trim(),f=d.signature?` Signature: ${v(d.signature)}.`:"";if(!m){a.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${f} Paste the CA above when it appears, then tap Use Live CA.`,w(e,a.launchCoinStatus);return}if(cu(n,m),a.launchShareKit={tokenMint:m,symbol:n.symbol||"",name:n.name||"",at:Date.now()},d.bundled){const y=Number(d.bundledWalletCount||0),S=[d.devBuyIncluded?"dev buy":"",y>0?`${y} bundle buy${y===1?"":"s"}`:""].filter(Boolean).join(" + ");a.launchCoinStatus=`Launch bundled atomically: ${v(m)}${S?` (${S} landed in-block)`:""}.${f} Opening chart...`,w(e,a.launchCoinStatus),xe("/terminal/chart","smartChart"),h({force:!0});return}if(a.launchCoinStatus=`Launch returned ${v(m)}.${f} Routing into ${Dr(n.action)}...`,w(e,a.launchCoinStatus),n.devBuyEnabled&&(a.launchCoinStatus=`Launch returned ${v(m)}.${f} Running Dev Wallet Initial Buy first...`,w(e,a.launchCoinStatus),await ro(m,bg(n)),a.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${Dr(n.action)} setup...`,w(e,a.launchCoinStatus)),n.action==="trade"){await ro(m,gg(n));return}if(n.action==="bundle"){await Fu(m,uu(n));return}if(n.action==="launch-watch"){a.activeTab="launch",xe("/terminal","launch"),h({force:!0});return}xe("/terminal/chart","smartChart"),h({force:!0})}catch(n){const r=n.launchAttemptId&&!String(n.message||"").includes(n.launchAttemptId)?` Launch ID: ${n.launchAttemptId}.`:"";a.launchCoinStatus=`${n.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:n.launchAttemptId||"",stage:n.stage||"",code:n.code||"",providerStatus:n.providerStatus||null,message:n.message||"Launch failed."}),w(e,a.launchCoinStatus),$(a.launchCoinStatus)}finally{a.launchCoinSubmitting=!1;const n=p("[data-launch-coin-submit]");n&&(n.disabled=!1,n.textContent=n.dataset.prevLabel||"Launch on Pump")}}function wg(){const e=a.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function du(){return a.launchWatches.length?`
    <div class="mini-results">
      ${a.launchWatches.map(e=>`
        <span>
          $${l(e.ticker)} - ${l(e.status)} - ${l(e.walletCount)} wallet(s)
          ${Ve(gh(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${l(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function Ur(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function pu(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),n=je(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),o=String(e.kolName||e.traderName||e.kol_name||"").trim(),s=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||n||o||r,wallet:t,kolWallet:t,twitter:n,handle:n,name:o||s||e.signalType||e.symbol||v(r),displayName:o||s||"KOL signal",shortWallet:t?v(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||n?1:0),currentPositionCount:I(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:a.kolLastUpdatedAt||new Date().toISOString()}}function qr(e={}){const t=Number(I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),n=at(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(n),o=r?Math.max(0,Math.min(100,Math.round(n))):0,s=!r||t<5,c=s?"Mixed":o>=50?"High Dump Risk":o>=30?"Dump Risk":o<=15?"Trusted Flow":"Mixed",i=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=i[0]||"",d=je(e.handle||e.twitter||""),m=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,b)=>/^https?:\/\//i.test(String(f.url||""))&&b.findIndex(S=>String(S.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:Ur(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||v(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:i,callsTracked:t,currentPositionCount:I(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:o,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?o:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:s,confidence:s?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:m,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:s?["Low local sell-window history. Wallet-based until social signal data is available."]:o>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Sg(e=[]){const t=new Map;for(const n of e.filter(Boolean)){const r=String(n.kolId||Ur(n)||"").trim();if(!r)continue;const o=t.get(r);t.set(r,o?{...o,...n,kolId:r}:{...n,kolId:r})}return[...t.values()]}function Hr(){const e=Array.isArray(a.kolDumpStats?.stats)?a.kolDumpStats.stats:[],t=Array.isArray(a.kolScan?.kols)?a.kolScan.kols:[],n=Array.isArray(a.kolScan?.rows)?a.kolScan.rows.map(pu):[],r=!e.length&&!t.length&&!n.length?Xs():[];return Sg([...e,...t.map(qr),...n.map(qr),...r.map(qr)]).filter(o=>o.kolId)}function kg(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function _n(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${kg(e)} · ${t}`}function mu(e={}){const t=Ur(e);return t?Hr().find(n=>String(n.kolId||"")===t)||qr(e):null}function $g(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const n=Bt(t)?t:"";return{kolId:t,displayName:n?v(n):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:n?[n]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:n?`https://solscan.io/account/${encodeURIComponent(n)}`:""},{label:"KOLscan",url:n?`https://kolscan.io/account/${encodeURIComponent(n)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function rl(e={},t="KOL Info"){if(!W("kolDumpDetectorEnabled",!0))return"";const n=mu(e),r=String(n?.kolId||Ur(e)||"").trim();if(!r)return"";const o=n?_n(n):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${l(r)}" title="${l(o)}">${l(t)}</button>`}function fu(e={},t="KOL Info"){return W("kolDumpDetectorEnabled",!0)?rl(pu(e),t):""}function Tg(e={}){if(!W("kolDumpDetectorEnabled",!0))return"";const t=mu(e);return t?.kolId?`<small class="kol-dump-inline">${l(_n(t))}</small>`:""}function Yw(){if(!W("kolDumpDetectorEnabled",!0))return"";const e=Hr().slice(0,6);return`
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
                <span>${l(t.handle?`@${t.handle}`:t.walletAddresses?.[0]?v(t.walletAddresses[0]):"wallet pending")}</span>
              </div>
              <p>${l(_n(t))}</p>
              <button type="button" data-kol-dump-details="${l(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:R("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function ol(e={}){if(!W("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&a.kolDumpStatsLoadedAt&&Date.now()-Number(a.kolDumpStatsLoadedAt||0)<900*1e3)return a.kolDumpStats;if(a.kolDumpStatsLoading)return null;a.kolDumpStatsLoading=!0;try{const n=new URLSearchParams({mode:a.kolMode||"hot"});a.kolWallet&&n.set("wallet",a.kolWallet),t&&n.set("force","true");const r=await k(`/api/web/kols/dump-stats?${n.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return a.kolDumpStats=r,a.kolDumpStatsLoadedAt=Date.now(),ee(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return a.kolDumpStats=a.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},a.kolDumpStatsLoadedAt=Date.now(),null}finally{a.kolDumpStatsLoading=!1,a.kolDumpDetails?.open?Kr():a.activeTab==="kol"&&h({force:!0})}}function Pg(e=""){const t=String(e||"").trim();!t||!W("kolDumpDetectorEnabled",!0)||(a.kolDumpDetails={open:!0,kolId:t},Ma(),Kr(),ol({force:!0}))}function sl(){a.kolDumpDetails={open:!1,kolId:""},Kr(),yr()}function Kr(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=a.kolDumpDetails||{},n=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",n),!n||!W("kolDumpDetectorEnabled",!0)){e.innerHTML="";return}const r=Hr().find(u=>String(u.kolId)===String(t.kolId))||$g(t.kolId),o=!!a.kolDumpStatsLoading,s=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(u=>/^https?:\/\//i.test(String(u?.url||""))).slice(0,4):[],i=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${v(r.lastTokenMint)}`:"n/a";e.innerHTML=`
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
        <p>${l(_n(r))}</p>
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
          <li><span>Wallets: ${l(s.length?s.map(v).join(", "):"not returned")}</span></li>
          <li><span>First seen: ${l(r.firstSeenAt?ve(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${l(r.lastSeenAt?ve(r.lastSeenAt):"n/a")}</span></li>
          <li><span>Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))}</span></li>
        </ul>
        ${c.length?`<div class="slimeshield-drawer-actions">${c.map(u=>`<a href="${l(u.url)}" target="_blank" rel="noreferrer">${l(u.label||"Open")}</a>`).join("")}</div>`:""}
      </section>
      <section>
        <h4>Interpretation</h4>
        <ul class="slimeshield-factor-list">
          ${(r.reasons||["No local sell-window history yet."]).map(u=>`<li><span>${l(u)}</span></li>`).join("")}
        </ul>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-kol-dump-refresh="${l(t.kolId)}" ${o?"disabled":""}>${o?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `}function Ag(){const e=a.kolScan?.configured!==!1,t=a.kolLoading?"disabled":"",n=String(a.kolMode||"hot"),r=!!a.kolScan,o=!!a.kolScan?.kols?.length,s=o&&n!=="hot",c=!r&&!o;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${a.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${a.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${a.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${a.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${a.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${a.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${l(Lg(a.kolMode))}</p>
    ${Cg()}
    ${s?xg():c?wh():""}
    ${a.kolMode==="slimewire"&&a.kolScan?a.kolScan.kols?.length?"":R("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):a.kolScan?Bg():R("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
            ${pt("kol")}
          </div>
          ${Rt("kol")}
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
            ${ze("kol-delay","data-kol-delay","5")}
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
            ${Or("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${Fr("kol")}
        <p class="trade-status" data-kol-status>${a.kolResult?l(a.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${Mg()}
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
            ${a.kolWallet?Ve(Vc(a.kolWallet),"Share KOL"):""}
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
  `}function Cg(){const e=a.kolScan||null,t=Dn(a.kolMode),n=a.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),o=Number(e?.rows?.length||0),s=a.kolLastUpdatedAt?ve(a.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${l(n)}</span>
      <span>${l(r)} KOLs</span>
      <span>${l(o)} signals</span>
      <span>${l(s)}</span>
    </div>
  `}function Dn(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function Lg(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function Mg(){const e=a.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function xg(){const e=a.kolScan||{},t=(e.kols||[]).filter(n=>n.wallet||n.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${l(e.label||"KOL Tracker")}</h3>
          <p>${l(`${Dn(a.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${l(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((n,r)=>`
          <article class="kol-profile">
            ${Jc(n)}
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
            ${Tg(n)}
            <div class="card-actions kol-profile-actions">
              ${n.solscanUrl?`<a href="${l(n.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${n.kolscanUrl||n.wallet?`<a href="${l(n.kolscanUrl||Vi(n.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${rl(n)}
              ${Ve(hh(n),"Share Watch")}
              ${n.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n.wallet)}">Copy Trade</button>`:""}
              ${n.wallet?`<button data-kol-scan-wallet="${l(n.wallet)}">Scan Positions</button>`:""}
              ${n.wallet?`<button data-kol-copy-wallet="${l(n.wallet)}">Copy Wallet</button>`:""}
              ${n.wallet?`<button data-copy="${l(n.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Bg(){const e=a.kolScan||{};if(e.configured===!1)return R("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],n=Ze("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${l(Dn(a.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${n.length}/${t.length} signals shown</span>
    </div>
    ${nt(n,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:fh})}
    ${ra("kol",t,"KOL signals")}
  `:R(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function Rg(){const e=p("[data-wallet-label]"),t=p("[data-wallet-count-input]"),n=p("[data-create-wallet-status]");if(!e||!t||!n)return;const r=[...document.querySelectorAll("[data-create-wallets]")];$(""),w(n,"Creating wallets..."),r.forEach(o=>{o.disabled=!0,w(o,"Creating...")});try{const o=Number.parseInt(t.value||"1",10);if(!Number.isInteger(o)||o<1||o>20)throw new Error("Wallet count must be from 1 to 20.");await G(n,"Creating secure web profile for wallet backups...");const s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:e.value.trim()||"Ogre Web",count:o})}),c=Array.isArray(s.wallets)?s.wallets:[];if(!c.length)throw new Error(s.message||"Wallet create did not return wallet data. Refresh and try again.");a.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&pe(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&pe(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),w(n,s.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`),H(Ae(s.plan),"wallet-create"),a.activeTab="wallets",h()}catch(o){w(n,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,w(o,"Create Wallets")})}}async function Ig(){const e=p("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),a.automationDelegationStatus="Creating automation wallet...",w(e,a.automationDelegationStatus),t.forEach(n=>{n.disabled=!0,w(n,"Creating...")});try{await G(e,"Creating secure web profile for automation wallet backups...");const n=a.user?.connectedWallet,r=n?.publicKey?`Automation ${v(n.publicKey)}`:"Automation Wallet",o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(o.wallets)?o.wallets:[]).length)throw new Error(o.message||"Automation wallet create did not return wallet data. Refresh and try again.");a.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&pe(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&pe(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),a.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",H(Ae(o.plan),"automation-wallet-create"),a.activeTab="wallets",h({force:!0})}catch(n){a.automationDelegationStatus=n.message,w(e,n.message),$(n.message)}finally{t.forEach(n=>{n.disabled=!1,w(n,"Create Automation Wallet")})}}function Og(e=null){const n=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||p("[data-session-wallet-amount]"),r=j(n?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const o=Number(r);if(!Number.isFinite(o)||o<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(o>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function Eg(e=se()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(a.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});ue(t.user||{...a.user,connectedWallet:t.profile?.connectedWallet||null})}async function Fg(e=null){const t=p("[data-automation-delegation-status]")||p("[data-wallet-connect-status]"),n=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),n.forEach(r=>{r.disabled=!0,w(r,"Opening...")});try{const r=Og(e),{provider:o,connected:s}=await Au();await G(t,"Creating secure web profile for session wallet..."),await Eg(s),a.automationDelegationStatus="Creating session wallet and funding approval...",w(t,a.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${v(s.publicKey)}`}),dedupe:!1,timeoutMs:Q});a.wallets=Array.isArray(c.wallets)?c.wallets:a.wallets,a.downloads=c.downloads||a.downloads||null,c.downloads?.encryptedBackup?.text&&pe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&pe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",w(t,a.automationDelegationStatus);const i=await cb(c.order?.transaction,o);a.automationDelegationStatus="Submitting session wallet funding...",w(t,a.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:i}),dedupe:!1,timeoutMs:Q});a.wallets=Array.isArray(u.wallets)?u.wallets:a.wallets,a.automationDelegationStatus=u.message||"Session wallet funded and ready.",H(u.signature||"","session-wallet-funded"),await ut({force:!0,deep:!0,reason:"session-wallet-funded"}),a.activeTab="wallets",h({force:!0})}catch(r){const o=N(r.message||"Session wallet setup failed.");a.automationDelegationStatus=o,w(t,o),$(o)}finally{n.forEach(r=>{r.disabled=!1,w(r,"Start Session Wallet")})}}async function ll(e="enable",t={}){const n=p("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],o=e!=="revoke";if(o&&!Mc()){a.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",w(n,a.automationDelegationStatus),$(a.automationDelegationStatus),Us();return}Lc(!o,t.scope||""),a.automationDelegationStatus=o?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",w(n,a.automationDelegationStatus),r.forEach(s=>{s.disabled=!0,w(s,o?"Enabling...":"Revoking...")});try{await G(n,"Creating secure web profile for automation permission...");const s=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:o?"enable":"revoke",ttlHours:720})});ue(s.user||{...a.user,automationPermission:s.profile?.automationPermission||null});const c=a.user?.automationPermission||{};a.automationDelegationStatus=o?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${ve(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(s){a.automationDelegationStatus=s.message,w(n,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,w(s,s.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function il(e={}){const t=!!e.silent,n=e.refreshWallet!==!1;if(!a.user||!a.token){t||$("Log in or create a web account before checking server exits.");return}if(fr){a.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}fr=!0,t||(a.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:Q});a.tradePlans=r.plans||a.tradePlans||[];const o=r.runner||{},s=r.webExitGuards||{},c=r.portfolioExits||{},i=Number(o.soldWallets||0)+Number(s.soldGuards||0)+Number(c.soldPositions||0),u=Number(o.triggeredWallets||0)+Number(s.triggeredGuards||0)+Number(c.triggeredPositions||0);if(o.skipped){const d=Number(o.activeForMs||0),m=d>0?` for ${Math.ceil(d/1e3)}s`:"";a.automationDelegationStatus=o.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${m}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${o.reason||"runner busy"}.`,n&&!t&&await Cs({force:!0});return}a.automationDelegationStatus=Wg(o),(n||i>0||u>0)&&await Cs({force:!0}),t&&(i>0||u>0)&&h({preserveSmartChartFrame:a.activeTab==="smartChart"})}catch(r){a.automationDelegationStatus=r.message,a.walletRefreshError=r.message,t||$(r.message)}finally{fr=!1,t||(a.walletRefreshing=!1,h())}}function Wg(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),n=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),o=Number(e.failedWallets||0),s=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${n}, sold ${r}, failed ${o}.${s}`}function cl(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(a.tradePlans||[]).some(t=>{const n=String(t.status||"").toLowerCase();return n==="launch_watch"?!0:n!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function Ng(){return!!(xc()&&cl()&&!fr)}function Vr(){cl()&&(a.automationDelegationStatus=a.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),_g()}let zr="";function _g(){const t=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active","armed","pending"].includes(String(i.status||"").toLowerCase()));if(!t.length){zr="";return}const n=Date.now(),r=t.filter(i=>i.automationPermissionExpiresAt&&!i.automationPermissionActive),o=t.filter(i=>{if(!i.automationPermissionActive)return!1;const u=Date.parse(i.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>n&&u-n<3600*1e3});let s="";if(r.length)s=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(o.length){const i=Math.min(...o.map(d=>Date.parse(d.automationPermissionExpiresAt)));s=`TP/SL permission expires in ~${Math.max(1,Math.round((i-n)/6e4))} min with ${o.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=s?`${r.length}:${o.length}`:"";s&&c!==zr?(zr=c,$(s)):s||(zr="")}function Dg(){pn.forEach(e=>window.clearTimeout(e)),pn=[]}function jr(){Dg(),a.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",pn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const n=window.setTimeout(()=>{pn=pn.filter(r=>r!==n),!(!a.user||!a.token||!cl())&&il({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{a.automationDelegationStatus=r.message})},t);return n})}async function Ug(){const e=p("[data-restore-text]"),t=p("[data-restore-status]");if(!e||!t)return;const n=e.value.trim();if(!n){w(t,"Choose a backup file or paste backup text first.");return}w(t,"Restoring wallets...");try{await G(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:n})});a.restoreResult=r.restore,r.restore?.downloads&&(a.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&pe(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&pe(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",w(t,r.restore?.message||"Restore complete."),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(r){w(t,r.message)}}async function qg(){const e=p("[data-export-status]");if(e){w(e,"Building backup files...");try{await G(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});a.backupResult=t.backup,t.backup?.downloads&&(a.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&pe(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&pe(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),w(e,t.backup?.message||"Backup ready."),h()}catch(t){w(e,t.message)}}}async function Hg(){const e=p("[data-import-label]"),t=p("[data-import-secret]"),n=p("[data-import-status]");if(!e||!t||!n)return;const r=e.value.trim()||"Imported Wallet",o=t.value.trim();if(!o){w(n,"Paste a private key or JSON secret-key array first.");return}w(n,"Importing wallet...");try{await G(n,"Creating secure web profile for imported wallet...");const s=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:o})});a.importResult=s.imported,s.imported?.downloads&&(a.downloads=s.imported.downloads,s.imported.downloads.encryptedBackup&&pe(s.imported.downloads.encryptedBackup.filename,s.imported.downloads.encryptedBackup.text),s.imported.downloads.recoveryKeys&&pe(s.imported.downloads.recoveryKeys.filename,s.imported.downloads.recoveryKeys.text)),t.value="",w(n,s.imported?.message||"Import complete."),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(s){w(n,s.message)}}async function Kg(e,t="this wallet"){const n=String(t||`Wallet ${e}`);if(!await Pe({title:"Remove Wallet",lines:[`Remove ${n} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Pe({title:"Final Confirmation",lines:[`Remove ${n} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const s=p("[data-wallet-remove-status]");a.walletRemoveStatus=`Backing up ${n} before removal...`,w(s,a.walletRemoveStatus),$("");try{const c=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify({walletIndexes:[String(e)]})}),i=c.removed||{};a.downloads=i.downloads||a.downloads,i.downloads?.encryptedBackup?.text&&pe(i.downloads.encryptedBackup.filename,i.downloads.encryptedBackup.text),i.downloads?.recoveryKeys?.text&&pe(i.downloads.recoveryKeys.filename,i.downloads.recoveryKeys.text),a.walletRemoveStatus=i.message||`Removed ${n}.`,H(Ae(c.plan),"wallet-remove"),a.activeTab="wallets",h()}catch(c){a.walletRemoveStatus=c.message,w(s,c.message),$(c.message)}}function Vg(){const e=String(p("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(n=>n.trim()).filter(Boolean),walletGroup:String(p("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(p("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(p("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(p("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function zg(){const e=String(p("[data-wallet-send-from]")?.value||"1").trim(),t=String(p("[data-wallet-send-managed-targets]")?.value||"").trim(),n=String(p("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(p("[data-wallet-send-destinations]")?.value||"").trim(),o=t.toLowerCase()==="all"?a.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),s=n?a.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===n||d.startsWith(`${n} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...o,...s])].map(u=>a.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),i=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(p("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!p("[data-wallet-send-all]")?.checked,destinations:i}}function jg(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const n=e.rows.slice(0,6).map(r=>{const o=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,s=r.ok?"ok":"failed";return`${o}: ${s} - ${r.message||r.signature||"done"}`});t.push(...n),e.rows.length>n.length&&t.push(`...${e.rows.length-n.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function Gg(e){const t=p("[data-wallet-sweep-status]");a.walletSweepStatus="Running wallet action...",w(t,a.walletSweepStatus),$("");try{await G(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const o=e==="send-sol-many"?zg():Vg();if(e==="sell-all"&&(o.destination=""),e==="sell-all-sweep"&&!o.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const s=await k(r,{method:"POST",body:JSON.stringify(o),timeoutMs:Q});a.walletSweepStatus=jg(s.sweep),w(t,a.walletSweepStatus),await Ne({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(n){a.walletSweepStatus=n.message,w(t,n.message),$(n.message)}}async function Xg(e){const t=p("[data-restore-status]"),n=p("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!n)){w(t,"Reading backup file...");try{n.value=await r.text(),w(t,"Backup loaded. Tap Restore Wallets.")}catch(o){w(t,`Could not read file: ${o.message}`)}}}function pe(e,t){const n=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(n),o=document.createElement("a");o.href=r,o.download=e,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Jg(){const e=p("[data-x-handle]"),t=p("[data-x-status]"),n=je(e?.value||"");if(!n){w(t,"Enter a valid X handle first.");return}const r=window.open(Qs(n),"_blank","noopener,noreferrer");try{w(t,r?`Opening X and saving @${n}...`:`Saving @${n}. Allow popups if X did not open.`),await G(t,"Creating secure web profile for X sharing...");const o=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:n})});ue(o.user||{...a.user,xHandle:o.profile?.xHandle||n}),ui(a.xHandle),w(t,`Connected @${a.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(o){w(t,o.message),$(o.message)}}function Yg(){const e=p("[data-x-status]"),t=je(p("[data-x-handle]")?.value||a.xHandle||""),n=Qs(t||a.xHandle);window.open(n,"_blank","noopener,noreferrer"),w(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function Qg(){const e=p("[data-x-status]"),t=p("[data-x-handle]");try{if(!a.user||!a.token){a.xHandle="",t&&(t.value=""),Jo(),w(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const n=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});ue(n.user||{...a.user,xHandle:""}),a.xHandle="",t&&(t.value=""),Jo(),w(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(n){w(e,n.message),$(n.message)}}async function Gr(e,t="Saving PFP..."){const n=p("[data-avatar-status]");w(n,t);try{await G(n,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});ue(r.user||{...a.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),w(n,a.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){w(n,r.message),$(r.message)}}async function Zg(e){const t=p("[data-avatar-status]"),n=e?.files?.[0];if(n){if(!/^image\/(png|jpe?g|webp)$/i.test(n.type)){w(t,"Use a PNG, JPG, or WebP image.");return}if(n.size>5*1024*1024){w(t,"Use an image under 5 MB.");return}try{w(t,"Compressing PFP...");const r=await hu(n);await Gr({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){w(t,r.message),$(r.message)}finally{e.value=""}}}function hu(e){return new Promise((t,n)=>{const r=new FileReader;r.onerror=()=>n(new Error("Could not read that image.")),r.onload=()=>{const o=new Image;o.onerror=()=>n(new Error("Could not load that image.")),o.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const i=c.getContext("2d");if(!i){n(new Error("This browser cannot resize images."));return}const u=Math.max(256/o.width,256/o.height),d=Math.round(o.width*u),m=Math.round(o.height*u),f=Math.round((256-d)/2),y=Math.round((256-m)/2);i.clearRect(0,0,256,256),i.drawImage(o,f,y,d,m);const b=c.toDataURL("image/jpeg",.84);if(b.length>22e4){n(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(b)},o.src=String(r.result||"")},r.readAsDataURL(e)})}async function eb(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,n=new URL(String(e||""),t).toString(),r=await fetch(n,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const o=await r.blob();return hu(o)}async function tb(){const e=Ys(a.xHandle);if(!e){const t=p("[data-avatar-status]");w(t,"Connect an X handle first.");return}await Gr({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function gu(e,t={}){const n=vn(),r=de(e);if(!r){if(await qi(e,t)||Hi(e))return;const o=Bi(e);te(o),Pt(e,new Error(o),{action:"provider_missing",platform:qe()?"mobile":"desktop"});return}try{const o=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(o){if(!(t.confirmSwitch===!1?!0:await Pe({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${v(o)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){te("Wallet connection unchanged."),xe("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}te(`Opening ${Ie(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,i=c?.toBase58?.()||c?.toString?.()||"";if(!i)throw new Error("Wallet connected, but no public address was returned.");await G(n,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:i,provider:Ie(e,r)})});ue(u.user||{...a.user,connectedWallet:u.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:i,shortPublicKey:v(i),provider:Ie(e,r),tokens:[]},Ds(`connected:${i}`),a.walletConnectMenuOpen=!1,te(`Connected ${v(i)}. Opening Live Terminal...`),xe(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Bc("browser-wallet-connect"),Tr("browser-wallet-connect")}catch(o){const s=o.message||"Wallet connection was cancelled.";te(s),Pt(e,o,{action:"connect_failed"})}}async function bu(){await su("disconnecting");const e=vn(),t=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(!a.user||!a.token){a.connectedWalletBalance=null,Ds(t?`connected:${t}`:""),te("Connected wallet disconnected."),h({force:!0});return}try{const n=a.user?.connectedWallet?.provider||"";await(n.toLowerCase().includes("phantom")?de("phantom"):n.toLowerCase().includes("solflare")?de("solflare"):n.toLowerCase().includes("backpack")?de("backpack"):de("solana"))?.disconnect?.()}catch{}try{const n=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});ue(n.user||{...a.user,connectedWallet:null}),a.connectedWalletBalance=null,Ds(t?`connected:${t}`:""),te("Connected wallet disconnected."),h({force:!0})}catch(n){te(n.message),$(n.message)}}async function ab(){const e=p("[data-profile-username]"),t=p("[data-profile-password]"),n=p("[data-login-security-status]"),r=String(e?.value||"").trim(),o=String(t?.value||"");if(!r||!o){w(n,"Enter a username and password first.");return}try{await G(n,"Creating secure web profile..."),w(n,"Saving login...");const s=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:o})});ue(s.user||{...a.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),w(n,"Saved. You can now log back in with this username and password."),h()}catch(s){w(n,s.message),$(s.message)}}function je(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function ul(e){const t=js(e),n=String(a.user?.referralLink||"").trim(),r=n&&!t.includes("/r/")?n:wt,o=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(o,"_blank","noopener,noreferrer")}function yu(e){const t=e==="kol",n=p(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=p("[data-share-watch-status]"),o=n?.value?.trim()||"";if(!o){w(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}ul(t?Vc(o):Gs(o)),w(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function vu(e){const t={};a.token&&(t.Authorization=`Bearer ${a.token}`);const n=await gn(Zt(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!n.ok){const r=await xi(n);throw new Error(r.message||r.error||`Could not build PnL card (${n.status}).`)}return{blob:await n.blob(),filename:n.headers.get("x-ogre-filename")||`pnl-card-${v(e)}.png`}}async function wu(e){const{blob:t,filename:n}=await vu(e),r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=n,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function nb(e,t){try{const{blob:n,filename:r}=await vu(e),o=new File([n],r,{type:"image/png"});if(navigator.canShare?.({files:[o]})){await navigator.share({title:"SlimeWire PnL Card",text:js(t),url:wt,files:[o]});return}await wu(e),ul(`${t} PnL card downloaded and ready to attach.`)}catch(n){$(n.message)}}function Su(e="buy"){const t=p("[data-trade-wallet]")?.value||"",n=cf(e)||p("[data-trade-token]")?.value?.trim()||"",r=M("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,e==="sell"?(a.tradeSwapFrom=n,a.tradeSwapTo="SOL"):(a.tradeSwapFrom="SOL",a.tradeSwapTo=n),{walletIndex:t,tokenMint:n,slippageBps:r}}function le(e=""){return String(e||"").trim().toLowerCase()==="connected"}function rb(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function ku(){const e=Array.isArray(a.wallets)?a.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(rb(e[t]))return e[t];return null}function $u(e=se()){if(!e?.publicKey)return!1;const t=Un(e),n=de(t)||de("solana");return!!(n&&typeof n.signTransaction=="function")}function Xr(e=se()){const t=e?.provider||Ie(Un(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function Jr(e={},{side:t="trade",statusWriter:n=me,allowSessionFallback:r=!0}={}){if(!le(e.walletIndex))return{form:e,sessionWallet:null};if($u())return{form:e,sessionWallet:null};const o=r?ku():null;if(o?.index){const s=`Using Session Wallet ${o.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof n=="function"&&n(s),{form:{...e,walletIndex:String(o.index)},sessionWallet:o}}throw new Error(Xr())}function Tu(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Pu(e=""){const t=atob(String(e||"")),n=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)n[r]=t.charCodeAt(r);return n}function Un(e=se()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function ob(e=se(),{returnPath:t=Oa()||"/terminal/trade"}={}){const n=Un(e),r=e?.provider||Ie(n);if(la({returnPath:t}),qe()&&e?.publicKey&&!de(n)){const s=Xr(e);return te(s),s}if(Ui(n)){const s=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(te(s),await qi(n,{returnPath:t}).catch(()=>!1))return s}if(Hi(n))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const o=Bi(n);return te(o),o}async function Au(){const e=se();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=Un(e),n=de(t)||de("solana");if(!n){if(qe()&&e?.publicKey)throw new Error(Xr(e));const s=await ob(e,{returnPath:Oa()||"/terminal/trade"});throw new Error(s)}if(typeof n.signTransaction!="function")throw qe()&&e?.publicKey?new Error(Xr(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"";let o=r();if(o!==e.publicKey)try{const s=await n.connect?.({onlyIfTrusted:!0});o=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r()}catch{}if(o!==e.publicKey){const s=await n.connect?.({onlyIfTrusted:!1}),c=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${v(e.publicKey)} connected, but the browser returned ${v(c)}. Reconnect the wallet you want to trade with.`)}return{provider:n,connected:e}}async function sb(){try{if(qe())return;const e=se();if(!e?.publicKey)return;const t=Un(e),n=de(t)||de("solana");if(!n||typeof n.connect!="function"||(n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"")===e.publicKey)return;await n.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const lb=6e4;async function Cu(e,t,n=lb){let r=0;const o=new Promise((s,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},n)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),o])}finally{window.clearTimeout(r)}}async function ib(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.VersionedTransaction.deserialize(Pu(e)),r=await Cu(t,n);return Tu(r.serialize())}async function cb(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.Transaction.from(Pu(e)),r=await Cu(t,n);return Tu(r.serialize())}function ub({side:e,connected:t,form:n={},actionDetail:r="",amountSol:o="",amountMode:s="",percent:c=""}={}){const i=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?v(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:s==="max"?"Max SOL":`${o||r||"custom"} SOL`;return Pe({title:`Confirm ${i}`,lines:[`${i} with ${u}?`,`Token: ${n.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:i})}async function qn({side:e,form:t,actionDetail:n,amountSol:r="",amountMode:o="",percent:s="",attemptId:c,statusWriter:i=me}){const u=typeof i=="function"?i:me,{provider:d,connected:m}=await Au();if(!a.walletFastApprovalsEnabled&&!await ub({side:e,connected:m,form:t,actionDetail:n,amountSol:r,amountMode:o,percent:s}))throw new Error("Connected-wallet trade cancelled.");cp(`${e==="buy"?"Buy":"Sell"} ${v(t.tokenMint||"")}`),Le("submitted","pending"),u(a.walletFastApprovalsEnabled?`Building ${e} approval for ${m.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:m.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:o,percent:s,tradeAttemptId:c}),dedupe:!1,timeoutMs:Q});Le("submitted","ok"),Le("approved","pending",`Approve in ${m.provider||"your wallet"}`),u(`Approve ${e} in ${m.provider||"your wallet"}...`);let y;try{y=await ib(f.order?.transaction,d)}catch(S){throw Le("approved","fail",N(S?.message||"Wallet approval was declined.")),S}Le("approved","ok"),Le("sent","pending"),u("Submitting signed trade...");let b;try{b=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:Q})}catch(S){throw q(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"error",error:N(S?.message||"Trade submit failed.")}),H("",`browser-${e}-error`,{tradeAttemptId:c}),Le("sent","fail",N(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return Le("sent","ok"),Le("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),a.tradeResult=b.trade,u(b.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),q(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"submitted",signature:b.trade?.signature||""}),H(b.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),b.trade}function mt(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function za(e,t){const n=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(n)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function db(){const e=M("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=M("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let n=M("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=M("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=za(n,r),{enabled:mt(e)||mt(t)||mt(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function Lu(){const e=M("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=M("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let n=M("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=M("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=za(n,r),{enabled:mt(e)||mt(t)||mt(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function me(e){const t=p("[data-trade-status]");w(t,e)}function Oe(e=""){a.chartTradeStatus=String(e||""),w(p("[data-chart-trade-status]"),a.chartTradeStatus)}function dl(e="",t=""){a.quickBuyModal={...a.quickBuyModal,status:String(e||""),error:String(t||"")};const n=p("[data-quick-buy-modal-status]"),r=p("[data-quick-buy-modal-error]");w(n,a.quickBuyModal.status),w(r,a.quickBuyModal.error),n&&(n.hidden=!a.quickBuyModal.status),r&&(r.hidden=!a.quickBuyModal.error)}async function Yr(e,t="fixed"){const n=C();let r=t==="max"?"max":String(e||"custom"),o="";try{let s=Su("buy");r=t==="max"?"max":String(e||"custom");const c=Qe("trade-buy",s.tokenMint,r);if(c){ee("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${v(s.tokenMint)}:${r}`});return}o=ct("trade-buy");const i={tokenMint:s.tokenMint,walletIndex:s.walletIndex,slippageBps:s.slippageBps,tradeAttemptId:o};if(t==="max")i.amountMode="max";else{const y=Number(e);if(!Number.isFinite(y)||y<=0)throw new Error("Enter a buy amount greater than zero.");i.amountSol=String(y)}if(s=Jr(s,{side:"buy",statusWriter:me}).form,i.walletIndex=s.walletIndex,le(s.walletIndex)){q("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:C()-n,requestId:o,details:`browser-buy:${v(s.tokenMint)}:${r}`}),me("Building wallet-approved buy..."),oe(),await qn({side:"buy",form:s,actionDetail:r,amountSol:i.amountSol||"",amountMode:i.amountMode||"fixed",attemptId:o}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Te("trade-buy",s.tokenMint,r,3e3);return}const d=db();d.enabled&&Object.assign(i,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),q("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-n,requestId:o,details:`trade-buy:${v(s.tokenMint)}:${r}`}),h(),me(d.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Fe(20);const m=C();q("trade-buy",s.tokenMint,r,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...i,clientClickToUiMs:Math.round(m-n)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-m,requestId:o,resultCount:f.trade?.signature?1:0,details:"trade-buy"}),a.tradeResult=f.trade,cp(`Buy ${v(s.tokenMint||"")}`),Le("submitted","ok"),Le("sent","ok"),Le("confirmed",f.trade?.signature?"ok":"pending",f.trade?.signature?`tx ${String(f.trade.signature).slice(0,8)}...`:""),f.trade?.autoExitPlan?(Le("armed","ok"),a.tradePlanResult=f.trade.autoExitPlan,me(f.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),jr()):f.trade?.autoExitRequested&&(Le("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),me("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),q("trade-buy",s.tokenMint,r,{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"trade-buy",{tradeAttemptId:o}),a.activeTab="trade",h(),Te("trade-buy",s.tokenMint,r,3e3)}catch(s){o&&(q("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,{state:"error",error:N(s.message||"Buy failed")}),Te("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-n,requestId:o,errorCode:s?.code||s?.name||"TRADE_BUY_FAILED",details:N(s.message||"Buy failed")}),me(s.message)}}async function pl(e){const t=C(),n=ct("manual-sell");let r=null,o=String(e||"custom");try{r=Su("sell");const s=Number.parseInt(e,10);if(o=String(s||o),!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=Qe("trade-sell",r.tokenMint,o);if(c){ee("buttonDoubleClickPrevented"),E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${v(r.tokenMint)}:${s}`});return}if(q("trade-sell",r.tokenMint,o,{state:"clicked",tradeAttemptId:n,clickedAt:new Date().toISOString()}),me("Sending sell..."),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-t,requestId:n,details:`${v(r.tokenMint)}:${s}`}),r=Jr(r,{side:"sell",statusWriter:me}).form,le(r.walletIndex)){oe();const m=C();q("trade-sell",r.tokenMint,o,{state:"submitting"}),await qn({side:"sell",form:r,actionDetail:o,percent:String(s),attemptId:n}),E({component:"manual-sell",action:"browser-sell-request",durationMs:C()-m,requestId:n,resultCount:a.tradeResult?.signature?1:0,details:"browser-wallet"}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),Te("trade-sell",r.tokenMint,o,3e3);return}h(),await Fe(20);const u=C();q("trade-sell",r.tokenMint,o,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:s,manualSellAttemptId:n,clientClickToUiMs:Math.round(u-t)}),timeoutMs:Q,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-u,requestId:n,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),a.tradeResult=d.trade,me(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),q("trade-sell",r.tokenMint,o,{state:"submitted",signature:d.trade?.signature||""}),H(d.trade?.signature||Ae(d.trade),"manual-sell-trade"),a.activeTab="trade",h(),Te("trade-sell",r.tokenMint,o,3e3)}catch(s){r?.tokenMint&&(q("trade-sell",r.tokenMint,o,{state:"error",error:N(s.message||"Sell failed")}),Te("trade-sell",r.tokenMint,o,4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-t,requestId:n,errorCode:s?.code||s?.name||"MANUAL_SELL_FAILED",details:N(s.message||"Sell failed")}),me(s.message)}}function pb(){const e=_e("trade-plan"),t=p("[data-trade-plan-group]")?.value?.trim()||"",n=p("[data-trade-token]")?.value?.trim()||"",r=M("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),o=M("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),s=M("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=M("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),i=M("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:i}=za(c,i));const u=M("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,a.volumeToken=n,a.bundleToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:c,takeProfitPct:o,stopLossPct:s,sellPercent:i,loopCount:"1",loopDelay:"0",slippageBps:u,...ia("trade-plan")}}async function mb(){try{const e=pb();me("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});a.tradePlanResult=t.plan,a.tradeResult=null,H(t.trade?.signature,"trade-plan"),a.activeTab="trade",h()}catch(e){me(e.message)}}function fb(){const e=_e("volume"),t=p("[data-volume-group]")?.value?.trim()||"",n=p("[data-volume-token]")?.value?.trim()||"",r=p("[data-volume-amount]")?.value||"";let o=M("[data-volume-delay]","[data-volume-delay-custom]","5");const s=M("[data-volume-tp]","[data-volume-tp-custom]","25"),c=M("[data-volume-sl]","[data-volume-sl-custom]","8"),i=M("[data-volume-loop]","[data-volume-loop-custom]","1"),u=M("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=M("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:o,sellPercent:d}=za(o,d));const m=M("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.volumeToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:d,slippageBps:m,...ia("volume")}}function Mu(e){const t=p("[data-volume-status]");w(t,e)}async function hb(){try{const e=fb();Mu("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});a.volumeResult=t.plan,H(Ae(t.plan),"volume-plan"),a.activeTab="volume",h()}catch(e){Mu(e.message)}}function gb(e){const t=_e("sniper"),n=p("[data-sniper-group]")?.value?.trim()||"",r=p("[data-sniper-amount]")?.value||"",o=M("[data-sniper-delay]","[data-sniper-delay-custom]",a.scanMode==="pumpsnipe"?"3":"5"),s=M("[data-sniper-tp]","[data-sniper-tp-custom]",a.scanMode==="pumpsnipe"?"40":"25"),c=M("[data-sniper-sl]","[data-sniper-sl-custom]","8"),i=M("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=M("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=M("[data-sniper-slippage]","[data-sniper-slippage-custom]",a.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{mode:a.scanMode,tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,slippageBps:d,loopCount:i,loopDelay:u,...ia("sniper")}}function xu(e){const t=p("[data-sniper-status]");w(t,e)}async function bb(e){try{const t=gb(e);xu("Buying and arming exits...");const n=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});a.sniperResult=n.plan,H(Ae(n.plan),"sniper-entry"),a.activeTab="sniper",h()}catch(t){xu(t.message)}}function yb(){const e=_e("ogre-ai"),t=p("[data-ogre-ai-group]")?.value?.trim()||"",n=p("[data-ogre-ai-amount]")?.value?.trim()||"",r=Ir(),o=p("[data-ogre-ai-runs]")?.value||"1",s=p("[data-ogre-ai-tp]")?.value||"25",c=p("[data-ogre-ai-tp-custom]")?.value?.trim()||"",i=p("[data-ogre-ai-sl]")?.value||"8",u=p("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=p("[data-ogre-ai-delay]")?.value||"5",m=p("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=p("[data-ogre-ai-slippage]")?.value||"400",y=p("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";jp({amountSol:n,runCount:o,category:r,takeProfitSelect:s,takeProfitCustom:c,stopLossSelect:i,stopLossCustom:u,delaySelect:d,delayCustom:m,slippageSelect:f,slippageCustom:y,walletGroup:t});const b=M("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),S=M("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),T=M("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),A=M("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),g="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!n)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:n,runCount:o,sellDelay:b,takeProfitPct:S,stopLossPct:T,sellPercent:"100",slippageBps:A,minScore:g,recentMints:di()}}function Qr(e){a.ogreAiStatus=e||"";const t=p("[data-ogre-ai-status]");w(t,a.ogreAiStatus)}async function vb(){if(hr){Qr("Ogre A.I. is already scanning. Please wait for completion.");return}const e=Symbol("ogre-ai-run");try{const t=yb();a.ogreAiLoading=!0,hr=e,Qr("Scanning fresh low-MC pairs and arming managed exits..."),h();const n=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify(t),timeoutMs:Q});a.ogreAiResult=n.ogreAi,zp(n.ogreAi),a.tradePlanResult=n.ogreAi?.plans?.[0]||a.tradePlanResult,Qr(n.ogreAi?.message||"Ogre A.I. run armed."),H(Ae(n.ogreAi?.plans?.[0]),"ogre-ai-run"),a.activeTab="ogreAi",h()}catch(t){Qr(t.message),$(t.message)}finally{a.ogreAiLoading=!1,hr===e&&(hr=null),h()}}function Hn(e){const t=p("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function wb({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");a.ogreAutopilot=t.autopilot||null,a.activeTab==="ogreAi"&&h()}catch(t){e||Hn(t.message)}}function Sb(){return{enabled:!!p("[data-autopilot-enabled]")?.checked,category:Ir(),amountSol:p("[data-ogre-ai-amount]")?.value?.trim()||(a.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:M("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:M("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:M("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:M("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:_e("ogre-ai"),walletGroup:p("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:p("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:p("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:p("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:p("[data-autopilot-interval]")?.value?.trim()||"10"}}async function kb(){if(a.ogreAutopilotBusy)return;const e=Sb();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){Hn("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Pe({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${eu(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){a.ogreAutopilotBusy=!0,Hn(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});a.ogreAutopilot=t.autopilot||null,Hn(a.ogreAutopilot?.lastStatus||"Saved.")}catch(t){Hn(t.message),$(t.message)}finally{a.ogreAutopilotBusy=!1,h()}}}function Ot(e){const t=p("[data-kol-status]");w(t,e)}function $b(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=M("[data-kol-delay]","[data-kol-delay-custom]","5"),s=M("[data-kol-tp]","[data-kol-tp-custom]","25"),c=M("[data-kol-sl]","[data-kol-sl-custom]","8"),i=M("[data-kol-loop]","[data-kol-loop-custom]","1"),u=M("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=M("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ia("kol")}}function Tb(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=M("[data-kol-delay]","[data-kol-delay-custom]","5"),s=M("[data-kol-tp]","[data-kol-tp-custom]","25"),c=M("[data-kol-sl]","[data-kol-sl-custom]","8"),i=M("[data-kol-loop]","[data-kol-loop-custom]","1"),u=M("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=M("[data-kol-slippage]","[data-kol-slippage-custom]","400"),m=String(e||a.kolWallet||p("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!m)throw new Error("Paste or choose a KOL wallet first.");if(!Bt(m))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:m,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ia("kol")}}async function Pb(e){try{const t=$b(e);Ot("Buying and arming KOL copy plan...");const n=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,H(Ae(n.plan),"kol-copy-plan"),a.activeTab="kol",h()}catch(t){Ot(t.message)}}async function Ab(e){try{const t=Tb(e);Ot("Arming Copy Wallet watch...");const n=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,a.kolWallet=t.copyWallet,a.activeTab="kol",h()}catch(t){Ot(t.message)}}function _e(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function Zr(e){const t=p("[data-bundle-status]");w(t,e)}function Bu(){const e=p("[data-bundle-token]")?.value?.trim()||"",t=_e("bundle"),n=p("[data-bundle-group]")?.value?.trim()||"",r=p("[data-bundle-amount]")?.value||"",o=M("[data-bundle-percent]","[data-bundle-percent-custom]","100"),s=M("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,percent:o,slippageBps:s}}function Cb(){const e=Bu();let t=M("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),n=M("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:n}=za(t,n),{...e,sellDelay:t,takeProfitPct:M("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:M("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:M("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:M("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:n,...ia("bundle-plan")}}async function Ru(e){const t=C();let n=null,r="";const o=e==="buy"?"bundle-buy":"bundle-sell";try{n=Bu();const s=Qe(o,n.tokenMint,"bundle");if(s){ee("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-t,cacheHit:!0,requestId:s.tradeAttemptId||"",details:`${o}:${v(n.tokenMint)}`});return}r=ct(o),q(o,n.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-t,requestId:r,details:`${o}:${v(n.tokenMint)}`}),h(),Zr(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Fe(20);const c=C();q(o,n.tokenMint,"bundle",{state:"submitting"});const i=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...n,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-c,requestId:r,resultCount:i.bundle?.successCount||0,details:o}),a.bundleResult=i.bundle,q(o,n.tokenMint,"bundle",{state:"submitted",signature:Ae(i.bundle)}),H(Ae(i.bundle),`bundle-${e}`,{tradeAttemptId:r}),a.activeTab="bundle",h(),Te(o,n.tokenMint,"bundle",3e3)}catch(s){n?.tokenMint&&(q(o,n.tokenMint,"bundle",{state:"error",error:N(s.message||"Bundle trade failed")}),Te(o,n.tokenMint,"bundle",4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-t,requestId:r,errorCode:s?.code||s?.name||"BUNDLE_TRADE_FAILED",details:N(s.message||"Bundle trade failed")}),Zr(s.message)}}async function Lb(){try{const e=Cb();Zr("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});a.bundleResult=t.plan,H(Ae(t.plan),"bundle-plan"),a.activeTab="bundle",h()}catch(e){Zr(e.message)}}function ae(e,t){return(a.presets?.[e]||[]).find(n=>n.id===t)||null}function Iu(){(a.selectedTradePresetId==="custom"||a.selectedTradePresetId&&!ae("trade",a.selectedTradePresetId))&&(a.selectedTradePresetId=""),(a.selectedBundlePresetId==="custom"||a.selectedBundlePresetId&&!ae("bundle",a.selectedBundlePresetId))&&(a.selectedBundlePresetId=""),a.editingTradePresetId&&!ae("trade",a.editingTradePresetId)&&(a.editingTradePresetId=""),a.editingBundlePresetId&&!ae("bundle",a.editingBundlePresetId)&&(a.editingBundlePresetId="")}function Ou(e,t="trade",n=""){t==="bundle"?a.bundleToken=e:a.tradeToken=e,a.activeTab=t,n&&$(n),window.history.pushState({},"","/terminal"),h({force:!0})}async function Eu(e=""){const t=String(e||"").trim();if(!t)return;const n=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(n),o=(s,c={})=>ft(fe(s,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){o(n);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}o(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(s){$(s.message||"Token search failed.")}}function fe(e="",t={}){const n=String(e||"").trim(),r=n?Kn().find(o=>String(o?.tokenMint||"")===n):null;return{chain:"solana",tokenMint:n,tokenAddress:n,mint:n,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||v(n),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||n.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function Qw(e={},t={}){return fe(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function eo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(a.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},uo(a.smartChartTokenRef),a.terminalToken=t,a.terminalAutoToken=t,a.tradeToken=t,a.bundleToken=t,a.volumeToken=t,a.smartChartToken=t,t):""}function Mb(e,t={}){const n=new URLSearchParams;n.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return n.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&n.set("view",t.view),t.focusAmountInput&&n.set("focusAmount","1"),t.source&&n.set("source",String(t.source).slice(0,40)),t.returnTo&&n.set("returnTo",t.returnTo),`/terminal/chart?${n.toString()}`}function ml(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),n=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||n.includes("pump")),o=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!o)}function xb(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const to=new Map;function fl(e){const t=String(e||"").trim();if(!t)return;const n=to.get(t)||0;Date.now()-n<3e4||(to.set(t,Date.now()),to.size>200&&to.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function ft(e={},t={}){ea("chartRouteStart");const n=C(),r=eo(e);if(!r){$("Select a token before opening the chart.");return}Sl(e,{source:t.source||"token-entry"}),fl(r),a.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),a.smartChartView=xb(a.smartChartTokenRef||e,t),a.chartFocusAmountInput=!!t.focusAmountInput,a.chartScrollIntoView=!0,a.activeTab="smartChart",a.route="terminal",a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.chartTradeStatus="",a.chartBuyWalletIndex="";const o=Mb(r,{defaultTab:t.defaultTab||"buy",view:a.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Oa()});window.history.pushState({},"",o),h({force:!0}),U("chart-route-open",n,{component:"smartChart",cacheHit:!!(Ge(r)?.cacheHit||jn(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function hl(){if(!window.location.pathname.includes("/terminal/chart"))return;ea("chartRouteStart");const e=C(),t=new URLSearchParams(window.location.search||""),n=String(t.get("token")||t.get("mint")||"").trim(),r=String(a.smartChartToken||"").trim();if(n){const o=fe(n,{source:t.get("source")||"route"});eo(o),Sl(o,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{ja(o,{forceModal:!0,source:"deep-link"})}catch{}},900),n!==r&&(a.chartTradeStatus="",a.chartBuyWalletIndex="")}a.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",a.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",a.chartFocusAmountInput=t.get("focusAmount")==="1",a.chartScrollIntoView=!0,a.route="terminal",a.activeTab="smartChart",U("chart-route-apply",e,{component:"smartChart",cacheHit:!!(Ge(n)?.cacheHit||jn(n)?.pairAddress),details:n})}function ja(e={},t={}){const n=eo(e);if(!n){$("Select a token before quick buying.");return}const r=Ga(n);if(r&&io(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const o=t.preset||Et(),s=o&&!t.forceModal?De(o):"",c=o?.walletIndex||(o?.walletIndexes||[])[0];if(o&&s&&c&&!t.forceModal){ro(n,t.preset||null);return}const i=se();a.quickBuyModal={open:!0,tokenMint:n,amountSol:s||a.quickBuyAmountOverride||"",walletIndex:i?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):"",slippageBps:"400",status:s?`Preset ${s} SOL loaded. Confirm when ready.`:"Enter a SOL amount to quick buy.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},fl(n),h({force:!0}),requestAnimationFrame(()=>p("[data-quick-buy-modal-amount]")?.focus())}function gl(){a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function Bb(e={},t={}){if(!W("protectedBuyEnabled",!0))return;const n=eo(e);if(!n){$("Select a token before opening Protected Buy.");return}const r=Ga(n);if(r&&io(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const o=ha(n)||{tokenMint:n},s=Xe(o),c=t.presetId||s.protectedBuyPreset||Pl(s.verdict),i=Number(j(t.amountSol||a.quickBuyAmountOverride||De()||"0.1")),u=c==="conservative"&&Number.isFinite(i)&&i>.25?"0.25":Jn(i||.1),d=se();fl(n),a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.protectedBuyModal={open:!0,tokenMint:n,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:s.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>p("[data-protected-buy-amount]")?.focus())}function ao(){a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function Rb(){const e=a.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),n=String(p("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(p("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),o=j(p("[data-protected-buy-amount]")?.value||e.amountSol||""),s=String(p("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(p("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!o)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:n,walletIndex:r,amountSol:o,slippageBps:s,riskAccepted:c}}function Ib(){const e=a.protectedBuyModal||{};if(!e.open)return"";const t=ha(e.tokenMint)||{tokenMint:e.tokenMint},n=Xe(t),r=ho(e.presetId),o=le(e.walletIndex),s=n.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${l(t.symbol||t.shortMint||v(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${l(Xa(n.verdict))}">${l(n.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${Ha(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${Tl.map(i=>`<option value="${i.id}" ${i.id===r.id?"selected":""}>${l(i.label)}</option>`).join("")}
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
        <small>${l(My(r))}</small>
        <small>Wallet: ${l(By(e.walletIndex))}</small>
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
  `}function bl(){let e=p("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!a.protectedBuyModal?.open||!W("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=Ib(),document.body.classList.add("protected-buy-modal-open")}async function Ob(){try{const e=Rb(),t=ha(e.tokenMint)||{tokenMint:e.tokenMint};if(Xe(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=ho(e.presetId);if(a.protectedBuyModal={...a.protectedBuyModal,...e,status:le(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},bl(),le(e.walletIndex)){const o=await no({...e,source:`protected-buy:${r.id}`});a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),$(o?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Fe(20),a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await ro(e.tokenMint,xy(e,r))}catch(e){a.protectedBuyModal={...a.protectedBuyModal||{},open:!0,status:"",error:N(e.message||"Protected Buy failed.")},h({force:!0})}}function Eb(){const e=String(a.quickBuyModal?.tokenMint||"").trim(),t=String(p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"").trim(),n=j(p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||""),r=String(p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!n)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r}}async function no({tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r="400",source:o="quick-buy",takeProfitPct:s="",stopLossPct:c="",sellDelay:i="off",sellPercent:u="100"}){const d=Number(n);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const m=ct("quick-buy"),f=za(i,u),y=mt(s)||mt(c)||mt(f.sellDelay);let b={tokenMint:e,walletIndex:t,slippageBps:r};const S=a.quickBuyModal?.open?P=>dl(P,""):me;if(b=Jr(b,{side:"buy",statusWriter:S}).form,t=b.walletIndex,a.quickBuyLast={source:o,tokenMint:e,walletConnected:le(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:m,status:"submitting",error:""},q("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:m,clickedAt:new Date().toISOString()}),a.quickBuyModal={...a.quickBuyModal,status:le(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:m},le(t)){dl("Opening wallet approval...",""),oe();const P=await qn({side:"buy",form:b,actionDetail:String(n),amountSol:String(d),amountMode:"fixed",attemptId:m,statusWriter:S});if(a.quickBuyLast={...a.quickBuyLast,status:"submitted"},y){const L="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";a.quickBuyModal?.open?dl(L,""):me(L)}return P}h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await Fe(20);const A={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:m};y&&Object.assign(A,{autoExit:!0,takeProfitPct:s,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(A),dedupe:!1,timeoutMs:Q});return a.tradeResult=g.trade,g.trade?.autoExitPlan&&(a.tradePlanResult=g.trade.autoExitPlan,jr()),H(g.trade?.signature,"quick-buy-custom",{tradeAttemptId:m}),q("trade-buy",e,String(n),{state:"submitted",signature:g.trade?.signature||""}),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},g.trade}async function Fb(e=""){const t=C(),n=j(p("[data-chart-buy-amount]")?.value||""),r=Number(n);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let o=p("[data-chart-buy-wallet]")?.value||"";if(!o)throw new Error("Choose a wallet before buying.");const s=ct("chart-buy");let c={tokenMint:e,walletIndex:o,slippageBps:p("[data-chart-buy-slippage]")?.value||"400"};if(c=Jr(c,{side:"chart buy",statusWriter:Oe}).form,o=c.walletIndex,Qe("trade-buy",e,String(n)))return a.tradeResult;if(a.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:le(o),customAmountValid:!0,presetAmount:"",tradeAttemptId:s,status:"submitting",error:""},q("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),Oe(le(o)?"Opening wallet approval...":"Submitting Session Wallet buy..."),E({component:"post-trade",action:le(o)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:C()-t,requestId:s,details:`${le(o)?"browser":"session"}-buy:${v(e)}:${n}`}),oe(),le(o)){const y=await qn({side:"buy",form:c,actionDetail:String(n),amountSol:String(r),amountMode:"fixed",attemptId:s,statusWriter:Oe});return a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",Oe(y?.message||"Buy submitted from connected wallet."),Te("trade-buy",e,String(n),3e3),y}const d=Lu(),m={tokenMint:e,walletIndex:o,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:s};d.enabled&&Object.assign(m,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),Oe(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(m),dedupe:!1,timeoutMs:Q});return a.tradeResult=f.trade,f.trade?.autoExitPlan&&(a.tradePlanResult=f.trade.autoExitPlan,jr()),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",q("trade-buy",e,String(n),{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"chart-session-buy",{tradeAttemptId:s}),Oe(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Te("trade-buy",e,String(n),3e3),f.trade}async function Wb(){try{const e=Eb(),t=zs(a.quickBuyModal?.error||a.quickBuyModal?.status||"");if(t)throw new Error(t);a.quickBuyModal={...a.quickBuyModal,...e,status:"Validating quick buy...",error:""};const n=await no({...e,source:a.quickBuyModal?.source||"quick-buy-modal"});a.quickBuyModal={...a.quickBuyModal,open:!1,status:n?.message||"Quick buy submitted.",error:""},a.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Te("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=N(e.message||"Quick buy failed."),n=zs(t);a.quickBuyLast={...a.quickBuyLast||{},status:"failed",error:n||t},a.quickBuyModal={...a.quickBuyModal,status:n?"Token safety blocked fast buy.":"",error:n||t},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"})}}async function ro(e,t=null){const n=C(),r=t||ae("trade",a.selectedTradePresetId);let o="quick";if(!r){ja(fe(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const s=t?j(r.amountSol):De(r);if(!s)throw new Error("Set a quick buy amount first.");o=String(s);const c=Qe("trade-buy",e,o);if(c){E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${v(e)}:${s}`});return}const i=ct("quick-trade");q("trade-buy",e,o,{state:"clicked",tradeAttemptId:i,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),a.tradeToken=e,h({preserveSmartChartFrame:a.activeTab==="smartChart"}),await Fe(0),await G(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!a.wallets.some(y=>String(y.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:s,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),a.tradeToken=e,await Fe(20);const m=C();q("trade-buy",e,o,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:i,clientClickToUiMs:Math.round(m-n)}),dedupe:!1,timeoutMs:Q});a.tradeResult=f.trade,f.trade?.autoExitPlan?(a.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),jr()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),a.tradeToken=e,q("trade-buy",e,o,{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:i}),a.activeTab="trade",h(),Te("trade-buy",e,o,3e3)}catch(s){e&&(q("trade-buy",e,o,{state:"error",error:N(s.message||"Quick buy failed")}),Te("trade-buy",e,o,4e3)),$(s.message)}}async function Fu(e,t=null){const n=t||ae("bundle",a.selectedBundlePresetId);if(!n){Ou(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(n.walletIndexes||[]).length||(n.walletGroup?"group":"saved");if(!await Pe({title:"Bundle Buy",lines:[`Bundle buy ${v(e)} with preset "${n.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){Ou(e,"bundle","Review the Bundle setup, then submit.");return}}try{a.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Fe(0),await G(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(n.walletIndexes||[]).filter(s=>a.wallets.some(c=>String(c.index)===String(s))),walletGroup:n.walletGroup||"",amountSol:t?j(n.amountSol)||"0.1":Ly(n),percent:"100",slippageBps:n.slippageBps,sellDelay:n.sellDelay||"off",takeProfitPct:n.takeProfitPct,stopLossPct:n.stopLossPct,sellPercent:n.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const o=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});a.bundleResult=o.plan,a.bundleToken=e,H(Ae(o.plan),"quick-preset-bundle"),a.activeTab="bundle",h()}catch(r){$(r.message)}}async function oo(e,t="100",n={}){const r=C();let o=Number.parseInt(t,10),s="";try{if(await G(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=Ss(e,String(o));if(c){E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${v(e)}:${o}`});return}const i=et().find(S=>String(S.tokenMint)===String(e)),u=i?.symbol||i?.name||v(e),d=!!(i?.source==="connected-wallet"||i?.viewOnly||String(i?.walletIndex||"").toLowerCase()==="connected"),m=String(se()?.publicKey||"").trim();if(d&&m){s=ct("manual-sell"),ta(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`browser:${v(e)}:${o}`}),$(""),a.activeTab!=="smartChart"&&(a.activeTab="positions");const S=a.activeTab==="smartChart"?Oe:A=>$(A);S("Building wallet-approved sell..."),oe(),ta(e,String(o),{state:"submitting"});const T=await qn({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:n.slippageBps||"400"},actionDetail:`${o}%`,percent:String(o),attemptId:s,statusWriter:S});a.tradeResult=T,ta(e,String(o),{state:"submitted",signature:T?.signature||""}),H(T?.signature,"browser-manual-sell",{tradeAttemptId:s}),a.activeTab==="smartChart"?(Oe(T?.message||"Sell submitted from connected wallet."),oe()):h({preserveSmartChartFrame:!1}),ks(e,String(o),3e3);return}if(!(!!n.skipConfirm||await Pe({title:"Confirm Exit",lines:[`Exit ${o}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${o}%`,danger:!0})))return;s=ct("manual-sell"),ta(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`${v(e)}:${o}`}),a.activeTab="positions",$(""),h(),await Fe(20);const y=C();ta(e,String(o),{state:"submitting"});const b=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:o,slippageBps:"400",manualSellAttemptId:s,clientClickToUiMs:Math.round(y-r)}),timeoutMs:Q,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-y,requestId:s,resultCount:b.bundle?.successCount||0,details:b.bundle?.duplicate?"duplicate":"submitted"}),a.bundleResult=b.bundle,a.bundleToken=e,a.tradeToken=e,ta(e,String(o),{state:(b.bundle?.duplicate,"submitted"),signature:Ae(b.bundle),backendMs:b.bundle?.manualSellTiming?.backendMs||null}),H(Ae(b.bundle),"manual-sell-position"),a.activeTab="positions",h(),ks(e,String(o),3e3)}catch(c){e&&Number.isInteger(o)&&(ta(e,String(o),{state:"error",error:N(c.message||"Sell failed")}),ks(e,String(o),4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-r,requestId:s,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:N(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}}function Ae(e){return e?.signature?e.signature:(e?.results||[]).find(n=>n.signature)?.signature||""}async function Nb(){const e=p("[data-tx-audit-signature]")?.value?.trim()||a.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}a.terminalTxSignature=e,a.terminalTxLoading=!0,a.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);a.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){a.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{a.terminalTxLoading=!1,h()}}function _b(e,t="manager"){const n=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Trade Preset",walletIndex:p(`[data-${n}-preset-wallet]`)?.value||"1",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"25",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"8",sellDelay:M(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}:{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Bundle Preset",walletIndexes:_e(`${n}-preset`),walletGroup:p(`[data-${n}-preset-group]`)?.value?.trim()||"",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"60",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"10",sellDelay:M(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}}function Db(e,t){const n=(t||[]).find(r=>!r.readonly);n?.id&&(e==="trade"&&(a.selectedTradePresetId=n.id),e==="bundle"&&(a.selectedBundlePresetId=n.id))}function so(e,t){const n=!!(t&&ae(e,t));e==="trade"&&(a.selectedTradePresetId=n?t:""),e==="bundle"&&(a.selectedBundlePresetId=n?t:"")}function yl(e,t){e==="trade"&&(a.fastTradePresetStatus=t),e==="bundle"&&(a.fastBundlePresetStatus=t)}function Ub(e,t){so(e,t),yl(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Wu(e,t="manager"){const n=p(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await G(n,"Creating secure web profile for presets..."),w(n,"Saving preset...");const r=_b(e,t),o=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});a.presets=o.presets||a.presets,r.id&&ae(e,r.id)?so(e,r.id):Db(e,a.presets?.[e]),t==="manager"&&Er(e,""),t==="fast"&&yl(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),w(n,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&yl(e,r.message),w(n,r.message),$(r.message)}}async function qb(e,t){try{const n=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});a.presets=n.presets||a.presets,e==="trade"&&a.selectedTradePresetId===t&&so("trade",""),e==="bundle"&&a.selectedBundlePresetId===t&&so("bundle",""),(e==="trade"&&a.editingTradePresetId===t||e==="bundle"&&a.editingBundlePresetId===t)&&Er(e,""),h()}catch(n){$(n.message)}}function Nu(e,t){Er(e,t),a.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const n=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);n?.scrollIntoView({behavior:"smooth",block:"start"}),n?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function _u(e={}){const t=p("[data-referral-status]");try{await G(t,"Opening secure web profile..."),w(t,e.generate?"Generating referral code...":"Saving referral settings...");const n=String(p("[data-referral-code]")?.value||"").trim(),r=ih(p("[data-referral-link]")?.value||""),o=String(a.user?.referralCode||"").trim(),s=e.generate?n:r&&r!==o&&(!n||n===o)?r:n||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:s,generateReferralCode:!!e.generate,referralPayoutWallet:p("[data-referral-wallet]")?.value||""})});ue(c.user);const i=c.user?.referralCode||a.user?.referralCode||"";w(t,e.generate?`Generated ${i}. Link is ready.`:`Referral settings saved. Code: ${i}`),h()}catch(n){w(t,n.message),$(n.message)}}async function Hb(){const e=p("[data-trader-board-status]");try{await G(e,"Opening secure web profile..."),w(e,"Saving trader board settings...");const t=p("[data-trader-board-wallet-mode]")?.value||"all",n=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!p("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:_e("trader-board")})});ue(n.user),w(e,n.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){w(e,t.message),$(t.message)}}async function Du(e,t){const n=t.dataset.watchToken||t.dataset.unwatchToken||"";if(n)try{await G(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:n,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});a.watchlist=r.watchlist||a.watchlist,h()}catch(r){$(r.message)}}function vl(e){const t=p("[data-launch-status]");w(t,e)}function Kb(){const e=p("[data-launch-ticker]")?.value?.trim()||gt(Ce().keywords)[0]||"",t=_e("launch"),n=p("[data-launch-group]")?.value?.trim()||"",r=p("[data-launch-amount]")?.value||"",o=M("[data-launch-tp]","[data-launch-tp-custom]","40"),s=M("[data-launch-sl]","[data-launch-sl-custom]","8"),c=M("[data-launch-delay]","[data-launch-delay-custom]","3"),i=M("[data-launch-loop]","[data-launch-loop-custom]","1"),u=M("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=M("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return Ce().keywords=e,Ce().open=!0,{ticker:e,walletIndexes:t,walletGroup:n,amountSol:r,takeProfitPct:o,stopLossPct:s,sellDelay:c,loopCount:i,loopDelay:u,slippageBps:d,...ia("launch")}}async function Vb(){try{const e=Kb();vl("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});a.launchResult=t.watch,await na(),a.activeTab="launch",h()}catch(e){vl(e.message)}}async function zb(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});a.launchResult=t.watch,await na(),a.activeTab="launch",h()}catch(t){vl(t.message)}}function jb(){return`
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
  `}function Gb(){const e=Yc();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${l(a.sweepBackgroundStatus||"")}</small>
    </section>`}async function Xb(){if(!a.sweepBackgroundPending){a.sweepBackgroundPending=!0,a.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:Q});a.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await ut({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){a.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{a.sweepBackgroundPending=!1,h({force:!0})}}}function Jb(){const e=Zb(),n=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Uu()}
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
      ${Zs().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${qa(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${l(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${l(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${ey(r)}
            ${r.sessionWallet?`<small>Session source: ${l(v(r.sourceConnectedWallet||""))}${r.fundingAmountSol?` | Budget ${l(r.fundingAmountSol)} SOL`:""}</small>`:""}
            </div>
          </div>
          <div class="card-actions compact">
            <button data-copy="${r.publicKey}">Copy</button>
            <button class="danger-lite" data-remove-wallet="${r.index}" data-wallet-label="${l(`${r.index}. ${r.label}`)}">Remove</button>
          </div>
        </article>
      `).join("")}
    </div>
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${Vh()}${Gb()}${Kh()}${jb()}`},{key:"create",label:"Create",hint:"New wallets",html:Ua()},{key:"import",label:"Import",hint:"Add keys",html:Uc()},{key:"backup",label:"Backup",hint:"Save / restore",html:Dc()},{key:"downloads",label:"Downloads",hint:"Exports",html:qc()}];if(!a.wallets.length){const r=n.filter(o=>o.key!=="balances"&&o.key!=="fund");return`
      ${e}
      ${R("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${Ka({toolKey:"wallets",activeKey:Va("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${Ka({toolKey:"wallets",activeKey:Va("wallets","balances"),sections:n})}
  `}function Yb(){return(Array.isArray(a.wallets)?a.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function Qb(){if(!(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey)return"";const t=Yb();return t?`
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
    </div>`}function Zb(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.connectedWalletBalance||{},n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",s=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${l(c.dexUrl||X(c.mint))}" target="_blank" rel="noreferrer">
      ${st({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
      <span>${l(c.symbol||c.shortMint||v(c.mint))}: ${l(c.uiAmount??"held")}</span>
    </a>
  `).join("");return`
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${l(e.provider||t.provider||"Solana Wallet")} ${l(v(e.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${l(n)}</strong></span>
          <span><small>Tokens</small><strong>${l(r)}</strong></span>
          <span><small>Status</small><strong>${t.error?"Needs refresh":"Synced"}</strong></span>
        </div>
        ${t.error?`<small>Check failed: ${l(t.error)}</small>`:""}
        ${s?`<div class="connected-token-list">${s}</div>`:""}
        ${Qb()}
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
  `}function Uu(){const e=a.balances.reduce((n,r)=>n+Number(r.tokens?.length||0),0)+pc().length,t=a.balances.filter(n=>n.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${Os()}</strong></div>
      <div><span>Total SOL</span><strong>${Mt().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function ey(e){const t=a.balances.find(s=>Number(s.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${l(t.error)}</span>`;const n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${l(n)} | ${l(r)}${l(o)}</span>`}function ty(){const e=et(),t=`
    <section class="account-check-card">
      <div>
        <h3>Open Positions</h3>
        <p>Only current token holdings show here. Use Refresh after buys, sells, or transfers.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
      <button data-tab="pnl">PnL History</button>
    </section>
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(xd).join("")}
    </div>
  `:`${t}${R("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function ay(){const e=`
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
            ${st(t)}
            <div>
              <strong>${l(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${l(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${l(t.tokenMint)}">${l(v(t.tokenMint))}</button>
            </div>
          </div>
          <span>${l(t.spentSol||"0")} SOL</span>
          <span>${l(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${l(t.realizedSol||"0")}</span>
          <span>${l(t.holdTime||"n/a")}<small>Latest ${l(ve(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ve(Kc(t),"Share")}
            <button data-pnl-card="${l(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${l(t.tokenMint)}" data-share-text="${l(Kc(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${R("No PnL yet","Trades made through the bot will show here.")}`}function Kn(){return ny(Vn())}function Vn(){const e=Object.values(a.livePairsByBucket||{}).flatMap(o=>o?.rows||[]),t=a.scan?.rows||[],n=a.kolScan?.rows||[],r=a.watchlist?.rows||[];return[...e,...t,...n,...r]}function Ga(e=""){const t=String(e||"");return t&&Vn().find(n=>String(n?.tokenMint||"")===t)||null}function Zw(e=""){const t=Ga(e);return!t||!io(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function ny(e=[]){const t=new Map;for(const n of e||[]){if(zn(n))continue;const r=String(n?.tokenMint||"");r&&!t.has(r)&&t.set(r,n)}return[...t.values()]}function he(e=[]){const t=new Map;for(const n of e||[]){if(zn(n))continue;const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||lo(n)>lo(o))&&t.set(r,n)}return[...t.values()]}function lo(e={}){return my(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(I(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function ry(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function io(e={}){if(ry(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function zn(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function qu(){const e=Kn(),t=s=>e.find(c=>String(c.tokenMint)===s)||{tokenMint:s,shortMint:v(s),symbol:v(s),dexUrl:X(s)},n=String(a.terminalToken||a.tradeToken||"").trim();if(n)return t(n);const r=String(a.terminalAutoToken||"").trim();if(r)return t(r);const o=(We()?.rows||[])[0]||e[0]||null;return o?.tokenMint&&(a.terminalAutoToken=String(o.tokenMint)),o}function co(){const e=Kn(),t=a.smartChartTokenRef||null,n=o=>e.find(s=>String(s.tokenMint||"")===o)||{...String(t?.tokenMint||"")===o?t:{},tokenMint:o,shortMint:v(o),symbol:t?.symbol||v(o),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||X(t?.pairAddress||o),pumpUrl:o.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(o)}`:""},r=String(a.smartChartToken||a.terminalToken||a.tradeToken||"").trim();return zu(r?n(r):qu())}function Hu(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const oy=300*1e3,Ku=45*1e3,Vu=600*1e3,sy=700,ly=6e3,iy=4,cy=3e4;function Ge(e=""){const t=String(e||"").trim();if(!t)return null;const n=a.smartChartBootstrap?.[t]||null;if(!n)return null;const r=Date.now()-Number(n.loadedAt||n.resolvedAt||0);return n.status==="failed"?r<Ku?n:null:r<Vu?n:null}function jn(e=""){const t=String(e||"").trim(),n=t?a.smartChartDexResolution?.[t]||Ge(t):null;if(!n)return null;const r=Date.now()-Number(n.resolvedAt||0);return n.status==="failed"?r<Ku?n:null:r<oy?n:null}function zu(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=jn(t);return!n||n.status==="failed"?e:{...e,pairAddress:e.pairAddress||n.pairAddress||"",pairId:e.pairId||n.pairAddress||"",dexUrl:e.dexUrl||n.dexUrl||n.pairUrl||"",dexId:e.dexId||n.dexId||"",dexName:e.dexName||n.dexName||n.dexId||"",symbol:e.symbol||n.symbol||v(t),name:e.name||n.name||"Token",imageUrl:e.imageUrl||n.imageUrl||"",marketCap:e.marketCap||n.marketCap||0,marketCapUsd:e.marketCapUsd||n.marketCap||0,fdv:e.fdv||n.fdv||0,liquidityUsd:e.liquidityUsd||n.liquidityUsd||0,volumeH24:e.volumeH24||n.volumeH24||0,volumeH1:e.volumeH1||n.volumeH1||0,priceUsd:e.priceUsd||n.priceUsd||0,h1:e.h1||n.h1||0,volume:e.volume||n.volume||null,txns:e.txns||n.txns||null}}function ju(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const n=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:n,resolvedAt:n};a.smartChartBootstrap={...a.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&uo({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function uo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.pairAddress||e.pairId||"").trim();!t||!n&&!e.dexUrl&&!e.symbol&&!e.name||(a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{...a.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:n,dexUrl:e.dexUrl||X(n||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||a.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||a.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||a.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||a.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||a.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||a.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||a.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function uy(e={}){const t=String(e?.tokenMint||a.smartChartToken||"").trim();if(!t)return!1;const n=String(e?.pairAddress||e?.pairId||"").trim();if(n)return uo({...e,tokenMint:t,pairAddress:n}),!1;if(Ge(t)?.pairAddress)return!1;const r=jn(t);return r?.pairAddress||r?.status==="failed"?!1:(a.smartChartDexResolving?.[t]||(a.smartChartDexResolving={...a.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{Xu(t).catch(()=>{})},0)),!0)}function Gu(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||a.smartChartToken||"").trim();return!n||!t.force&&Ge(n)?.status==="resolved"?!1:(a.smartChartBootstrapLoading?.[n]||(a.smartChartBootstrapLoading={...a.smartChartBootstrapLoading||{},[n]:!0},window.setTimeout(()=>{Xu(n,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const wl=new Map;async function dy(e){const t=String(e||"").trim();if(!t)return;const n=wl.get(t)||0;if(Date.now()-n<3e4)return;wl.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,m)=>(Number(m?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},o=async()=>{const s=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!s?.pair)throw new Error("no pair");return s.pair};try{const s=await Promise.any([r(),o()]);ju({tokenMint:t,symbol:s.baseToken?.symbol||"",name:s.baseToken?.name||"",priceUsd:s.priceUsd,marketCap:s.marketCap||s.fdv||null,marketCapUsd:s.marketCap||s.fdv||null,fdv:s.fdv||null,liquidityUsd:Number(s.liquidity?.usd)||null,liquidity:{usd:Number(s.liquidity?.usd)||null},volumeH24:Number(s.volume?.h24)||null,volumeH1:Number(s.volume?.h1)||null,h1:Number(s.priceChange?.h1)||null,imageUrl:s.info?.imageUrl||"",dexUrl:s.url||"",pairAddress:s.pairAddress||"",dexId:s.dexId||"",source:"direct-dexscreener"}),a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{wl.delete(t)}}function Sl(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return n?(uo(e),dy(n),Gu(e,{source:t.source||"prefetch"}),a.smartChartPrefetchLog=[...a.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:n,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(a.smartChartBootstrapLoading?.[n]||Ge(n)),cacheTtlMs:Vu}].slice(-20),!0):!1}async function Xu(e=""){const t=String(e||"").trim();if(!t)return null;try{const n=C(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),o=r.chart||r.dexToken||{};return ju(o),U("chart-bootstrap",n,{component:"smartChart",cacheHit:!!o.cacheHit,stale:!!o.stale,details:`${t}:${o.chartProvider||"dexscreener-embed"}`}),a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),o}catch(n){return a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:N(n?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),null}finally{const n={...a.smartChartDexResolving||{}};delete n[t],a.smartChartDexResolving=n;const r={...a.smartChartBootstrapLoading||{}};delete r[t],a.smartChartBootstrapLoading=r}}function py(e,t={}){const n=Hu(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(n)}?${r.toString()}`}function Ju(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=Ge(n);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:py(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function eS(e={}){const t=String(e?.tokenMint||e?.mint||a.smartChartToken||""),n=nd(t||e?.symbol||"pump"),r=Math.max(1,I(e.marketCap,e.fdv,e.liquidityUsd,1e4)),o=I(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),s=Math.max(4,Math.min(96,Ft(e)||I(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(o)||I(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(i,u)=>{const d=Math.sin((u+n%11)/2.2)*c,m=(u/21-.5)*(o||s/3),f=((n>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+m+f)/100))})}function tS(e={},...t){for(const n of t){const r=Number(e?.[n]);if(Number.isFinite(r)&&r>0)return r;const o=n.split(".").reduce((c,i)=>c?.[i],e),s=Number(o);if(Number.isFinite(s)&&s>0)return s}return 0}function aS(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="txns",o=Math.max(0,Math.min(100,Ft(e)||I(e.bondingProgressPct,e.pumpProgress,0))),s=F(e.marketCapLabel,e.fdvLabel,x(e.marketCap),x(e.fdv)),c=F(e.liquidityLabel,x(e.liquidityUsd)),i=F(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,x(e.volumeM15),x(e.volume5m),x(e.volumeH1));return`
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
          ${Dw(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${l(s)}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(c)}</dd></div>
          <div><dt>Volume</dt><dd>${l(i)}</dd></div>
          <div><dt>Status</dt><dd>${ml(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":Uw(e)}
      <small>${l(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function kl(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",o=t==="info",s=Gu(e)||uy(e),c=o?`DexScreener info for ${e.symbol||v(n)}`:r?`DexScreener chart and transactions for ${e.symbol||v(n)}`:`DexScreener chart for ${e.symbol||v(n)}`,i=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",o?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=s?"Loading DEX chart while resolving fastest pair...":o?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",m=Ju(e,t);return`
    <div class="${l(i)}" data-chart-frame-loading="${l(d)}" data-chart-resolving="${s?"true":"false"}" data-chart-mint="${l(n)}" data-chart-mode="${l(t)}" data-chart-src="${l(m)}">
      <iframe title="${l(c)}" src="${l(m)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${l(t)}','${l(n)}')" allowfullscreen></iframe>
    </div>
  `}function Yu(){const e=[...Object.values(a.livePairsByBucket||{}).flatMap(n=>n?.rows||[]),...a.livePairs?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[],...a.watchlist?.rows||[]],t=new Map;for(const n of e){const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||lo(n)>lo(o))&&t.set(r,n)}return t}function my(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,n)=>t+(n&&String(n).toLowerCase()!=="n/a"?1:0),0)}function Qu(e=[]){const t=Yu();return(e||[]).map(n=>Zu(n,t.get(String(n?.tokenMint||""))))}function at(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const o=Number(r[1]);if(!Number.isFinite(o))return null;const s=String(r[2]||"").toLowerCase();return s==="k"?o*1e3:s==="m"?o*1e6:s==="b"?o*1e9:o}function I(...e){for(const t of e){const n=at(t);if(Number.isFinite(n)&&n>0)return n}for(const t of e){const n=at(t);if(Number.isFinite(n))return n}return 0}function Zu(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:I(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:I(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:F(e.marketCapLabel,t.marketCapLabel,x(e.marketCap),x(t.marketCap)),fdvLabel:F(e.fdvLabel,t.fdvLabel,x(e.fdv),x(t.fdv)),liquidityUsd:I(e.liquidityUsd,t.liquidityUsd),liquidityLabel:F(e.liquidityLabel,t.liquidityLabel,x(e.liquidityUsd),x(t.liquidityUsd)),volume5m:I(e.volume5m,t.volume5m),volume5mLabel:F(e.volume5mLabel,t.volume5mLabel,x(e.volume5m),x(t.volume5m)),volumeM15:I(e.volumeM15,t.volumeM15),volumeM15Label:F(e.volumeM15Label,t.volumeM15Label,x(e.volumeM15),x(t.volumeM15)),volumeM30:I(e.volumeM30,t.volumeM30),volumeM30Label:F(e.volumeM30Label,t.volumeM30Label,x(e.volumeM30),x(t.volumeM30)),volumeH1:I(e.volumeH1,t.volumeH1),volumeH1Label:F(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,x(e.volumeH1),x(t.volumeH1)),volumeH24:I(e.volumeH24,t.volumeH24),volumeH24Label:F(e.volumeH24Label,t.volumeH24Label,x(e.volumeH24),x(t.volumeH24)),volumeLabel:F(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,x(e.volumeH1),x(t.volumeH1)),sniperCount:I(e.sniperCount,t.sniperCount)}:e}function Gn(e=[],t=[]){return he([...a.livePairsByBucket.under1d?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.scan?.rows||[],...e,...t]).sort((r,o)=>Number(o.bestPickScore||o.score||0)-Number(r.bestPickScore||r.score||0)||I(o.volumeM15,o.volumeM30,o.volumeH1,o.volume5m,o.volumeH24)-I(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||I(o.marketCap,o.fdv)-I(r.marketCap,r.fdv)||Je(r,o))}function V(e,t,n,r,o){return{key:e,label:t,severity:n,message:r,weight:o}}function fy(e={}){const t=at(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const n=at(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(n)?n/60:null}function hy(e,t=[]){const n=(t||[]).some(o=>o.key==="hard_flag"),r=(t||[]).filter(o=>o.severity==="risk"&&o.key!=="liquidity_extreme").length;return n||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function gy(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const n=(t||[]).find(r=>r.severity==="risk");return n?.message?`Avoid recommended. ${n.message}`:"Avoid recommended. Multiple danger signals."}const po=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function ua(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(po,t)?t:"unknown"}function mo(e="",t="Unknown"){const n=ua(e);return po[n]||t}function ed(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=n?"new":"unknown";return{mint:t,status:r,label:po[r],confidence:n?"low":"unknown",summary:n?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:n||null,updatedAt:""}}function Xn(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(a.devInfoSummaries?.[t]||e.devInfoSummary)||ed(e)}function by(e={}){const t=ua(e.status);return t==="hold"?V("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?V("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?V("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?V("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?V("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):V("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function td(e={},t={}){if(!W("devInfoEnabled",!0))return"";const n=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!n)return"";const r=Xn(e),o=ua(r.status),c=!!a.devInfoLoading?.[`summary:${n}`]?"...":o==="unknown"?"":r.label||po[o]||"",i=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${l(o)} ${i?"is-compact":""}" data-dev-info="${l(n)}" title="${l(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${l(c)}</strong>`:""}
    </button>
  `}function yy(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let n=70;const r=[],o=[],s=[],c=at(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(n-=36,o.push("liquidity"),r.push(V("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(n-=20,o.push("liquidity"),r.push(V("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(n+=8,o.push("liquidity"),r.push(V("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(o.push("liquidity"),r.push(V("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(n-=6,s.push("liquidity"),r.push(V("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const i=fy(e);Number.isFinite(i)?i<3?(n-=10,o.push("age"),r.push(V("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):i>60?(n+=4,o.push("age"),r.push(V("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):o.push("age"):(n-=4,s.push("age"),r.push(V("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=at(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(n-=5,o.push("volume"),r.push(V("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(n+=6,o.push("volume"),r.push(V("volume_active","Volume","positive","Volume is active enough to review flow.",6))):o.push("volume"):s.push("volume");const d=at(e.buys5m??e.buysH1??e.buys),m=at(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(m)?(o.push("flow"),m>=d*1.8&&m>=5?(n-=18,r.push(V("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=m*1.4&&d>=8&&(n+=5,r.push(V("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):s.push("flow");const f=at(e.bestPickScore??e.score);Number.isFinite(f)&&(o.push("score"),f>=78?(n+=7,r.push(V("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(n-=10,r.push(V("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(A=>String(A||"").toLowerCase());y.some(A=>/mayhem|fake|scam|honeypot|blacklist/.test(A))&&(n-=40,r.push(V("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(A=>/bundle|bundled|cluster|concentr/.test(A))&&(n-=18,r.push(V("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(A=>/dev|fresh wallet|fresh-wallet|insider/.test(A))&&(n-=14,r.push(V("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(A=>/mint|freeze|token-2022/.test(A))&&(n-=24,r.push(V("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const b=Xn(e);if(b){const A=by(b);n+=Number(A.weight||0),r.push(A),["hold","mixed","risk","dump"].includes(ua(b.status))?o.push("devInfo"):s.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(n))),T=hy(S,r);return{mint:t,verdict:T,score:S,confidence:o.length>=5&&s.length<=1?"high":o.length>=3?"medium":"low",summary:gy(T,r),factors:r.slice(0,10),suggestedAction:T==="BUY"?"normal_buy":T==="CAUTION"?"small_buy":T==="RISK"?"watch_only":"avoid",protectedBuyPreset:T==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Xe(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&a.slimeShieldResults?.[t]||yy(e)}function Xa(e=""){return String(e||"CAUTION").toLowerCase()}function vy(e={},t={}){if(!W("slimeShieldEnabled",!0))return ky(e);const n=Xe(e),r=String(e.tokenMint||n.mint||"").trim(),o=n.verdict||"CAUTION",s=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${l(Xa(o))}" data-slimeshield-details="${l(r)}" title="${l(n.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${s?"Shield":"SlimeShield"}</small>
    </button>
  `}function wy(e={}){if(!W("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${l($l(e))}">${l(o?`${o}`:"n/a")} score</em>`}const t=Xe(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${l(Xa(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">Details</button>`}function nS(e={}){if(!W("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0),s=o?`${o}`:"n/a";return`
      <span class="terminal-score-chip" title="${l($l(e))}">
        <strong>${l(s)}</strong>
        <small>score</small>
      </span>
    `}const t=Xe(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${l(Xa(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Sy(e={}){return W("slimeShieldEnabled",!0)?`SlimeShield ${Xe(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function ky(e={}){const t=Number(e.bestPickScore||e.score||0),n=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${l($l(e))}">
      <strong>${l(r)}</strong>
      <small>${n.length?"warnings":"best pick"}</small>
    </span>
  `}function $y(e={}){return vy(e,{compact:!0})}function $l(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},n=Object.entries(t).map(([o,s])=>`${o}: ${s}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...n,...r.map(o=>`warning: ${o}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function Ty(e={}){return""}function x(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function F(...e){for(const t of e){const n=String(t??"").trim();if(n&&n!=="$0"&&n.toLowerCase()!=="n/a")return n}return"n/a"}function ad(e={}){return[["15m",F(e.volumeM15Label,x(e.volumeM15))],["30m",F(e.volumeM30Label,x(e.volumeM30))],["1h",F(e.volumeH1Label,e.volumeLabel,x(e.volumeH1))],["24h",F(e.volumeH24Label,x(e.volumeH24))]]}function rS(e={}){const t=rt(e),n=ot(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),o=F(e.liquidityLabel,n>0?x(n):"","checking"),s=ad(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      ${s.map(([c,i])=>`<span>${l(c)} <b>${l(i)}</b></span>`).join("")}
    </div>
  `}function Py(e={}){const t=rt(e),n=ot(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),o=F(e.liquidityLabel,n>0?x(n):"","checking"),s=F(e.volumeM15Label,x(e.volumeM15)),c=F(e.volumeH1Label,e.volumeLabel,x(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      <span>15m <b>${l(s)}</b></span>
      <span>1h <b>${l(c)}</b></span>
    </div>
  `}function Ja(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const n=String(e.tokenMint||e.mint||"").trim();return n&&(e.isPump||n.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(n)}`:""}function fo(e={},t=""){const n=t||ya(e),r=Number(e.sniperCount||e.snipers||0),o=Ja(e);return`
    <div class="compact-link-row">
      <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${o?`<a href="${l(o)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${l(n)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(r)}</span>`:""}
    </div>
  `}function Je(e={},t={}){const n=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(n)&&Number.isFinite(r)&&n!==r)return n-r;const o=Number(e.pairCreatedAt||0),s=Number(t.pairCreatedAt||0);return o||s?s-o:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function nd(e=""){let t=0;for(let n=0;n<String(e).length;n+=1)t=(t<<5)-t+String(e).charCodeAt(n),t|=0;return Math.abs(t)}function da(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function pa(e=""){const t=We();return[e,a.livePairBucket,a.terminalSort,ld(),t?.refreshCount||"",a.livePairsLastUpdatedByBucket[a.livePairBucket]||a.livePairsLastUpdatedAt||"",a.kolScan?.refreshCount||"",a.kolScan?.refreshedAt||a.kolLastUpdatedAt||""].join(":")}function ma(e=[],t=12,n="",r=0){const o=he(e||[]),s=Math.max(0,Number(t)||o.length);if(!s)return[];if(!n||o.length<=s)return o.slice(0,s);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,s-1),o.length),i=o.slice(0,c),u=o.slice(c);if(!u.length)return i.slice(0,s);const d=nd(n)%u.length,m=[...u.slice(d),...u.slice(0,d)];return[...i,...m].slice(0,s)}function rd(e=[],t=new Set){return(e||[]).filter(n=>{const r=da(n);return!r||!t.has(r)})}function od(e={}){const t=rt(e),n=ot(e),r=_l(e),o=Mo(e),s=Ud(e),c=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),i=F(e.liquidityLabel,n>0?x(n):"","checking"),u=F(e.volumeM15Label,r>0?x(r):"","checking"),d=F(e.volumeH1Label,e.volumeLabel,o>0?x(o):"","checking"),m=F(e.volumeH24Label,s>0?x(s):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${l(c)}</strong></span>
      <span><small>Liq</small><strong>${l(i)}</strong></span>
      <span><small>15m</small><strong>${l(u)}</strong></span>
      <span><small>1h</small><strong>${l(d)}</strong></span>
      <span><small>24h</small><strong>${l(m)}</strong></span>
    </div>
  `}function sd(e,{source:t,actionLabel:n="Trade",isKolContext:r=!1}={}){const o=Co(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(t)}" title="Open chart and buy/sell panel">${l(n)}</button>
    <button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(t)}" title="Quick buy with preset or custom SOL amount">${l(fa())}</button>
    <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${l(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?fu(e):""}
    <button type="button" class="watch-action" data-watched="${o}" title="${o?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Lo(e)||"")}">${o?"Saved":"Watch"}</button>
    ${td(e,{compact:!0})}
  `}function Ay(e,t={}){const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ma(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,m)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${i?"is-kol-signal":""}" data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${st(d,{priority:m<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-title">${l(d.symbol||d.shortMint||v(d.tokenMint))}</strong>
                <small>${l(d.name||d.category||"Token")}</small>
                ${i?"":Wl(d)}
                ${wy(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${l(d.tokenMint)}">${l(v(d.tokenMint))}</button>
              <span class="terminal-token-age">${l(d.pairAgeLabel||Nt(d)||"age unknown")} | ${l(f)}</span>
              ${fo(d)}
            </div>
            ${od(d)}
            <div class="terminal-token-actions has-dev-info">
              ${sd(d,{source:"terminal-row",actionLabel:r,isKolContext:i})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:R(o,s)}function ht(e,t={}){if(t.layout==="terminal")return Ay(e,t);const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ma(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-row">
          ${st(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-title">${l(u.symbol||u.shortMint||v(u.tokenMint))}</strong>
              <small>${l(u.name||u.category||"Token")}</small>
              ${i?"":Wl(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${l(u.tokenMint)}">${l(v(u.tokenMint))}</button>
            <span>${l(u.pairAgeLabel||Nt(u)||"age unknown")} | ${l(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${Py(u)}
            ${fo(u)}
          </div>
          ${$y(u)}
          <div class="compact-row-actions has-dev-info">
            ${sd(u,{source:"compact-row",actionLabel:r,isKolContext:i})}
          </div>
        </article>
      `).join("")}
    </div>
  `:R(o,s)}function Ya(e){const t=ae(e,e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId);if(!t)return"Custom / manual";const n=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&n.push(`Timer ${t.sellDelay}`),n.join(" | ")}function oS(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${l(Ya("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${tt("trade",a.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${tt("bundle",a.selectedBundlePresetId)}
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
  `}function Jn(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function j(e=a.quickBuyAmountOverride){const t=String(e||"").replace(/[^0-9.]/g,"");if(!t)return"";const n=Number(t);return!Number.isFinite(n)||n<=0?"":Jn(n)}function Et(){return ae("trade",a.selectedTradePresetId)}function Cy(){return ae("bundle",a.selectedBundlePresetId)}function De(e=Et()){return j()||Jn(e?.amountSol)}function Ly(e=Cy()){return j()||Jn(e?.amountSol)||"0.1"}const Tl=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function ho(e=""){return Tl.find(t=>t.id===e)||Tl[0]}function Pl(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function My(e=ho()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,n=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${n} | ${r}`}function xy(e={},t=ho()){const n=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:n?.percentGain?String(n.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:n?.sellPercent?String(n.sellPercent):t.sellPercent||"100"}}function By(e=""){if(le(e)){const n=se();return`${n?.provider||"Browser wallet"} ${n?.publicKey?v(n.publicKey):""}`.trim()}const t=a.wallets.find(n=>String(n.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Ce(){return(!a.terminalLaunchFilters||typeof a.terminalLaunchFilters!="object")&&(a.terminalLaunchFilters={}),a.terminalLaunchFilters.socials=a.terminalLaunchFilters.socials||{},a.terminalLaunchFilters.quotes=a.terminalLaunchFilters.quotes||{},a.terminalLaunchFilters.audits=a.terminalLaunchFilters.audits||{},a.terminalLaunchFilters}function gt(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(n=>String(n||"").trim().split(/\s+/)).map(n=>n.trim().toLowerCase()).filter(n=>!n||t.has(n)?!1:(t.add(n),!0)).slice(0,3)}function ld(e=Ce()){const t=Object.keys(e.socials||{}).filter(o=>e.socials[o]).sort().join(","),n=Object.keys(e.quotes||{}).filter(o=>e.quotes[o]).sort().join(","),r=Object.keys(e.audits||{}).filter(o=>e.audits[o]).sort().join(",");return[gt(e.keywords).join(","),gt(e.excludeKeywords).join(","),t,n,r].join("|")}function Qa(e=Ce()){return!!ld(e).replace(/\|/g,"")}function go(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function Ry(e={},t=""){const n=go(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(n));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(n)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(n)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(n)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(n)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(n)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(n)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(n)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(n)):t==="minSocial"?r:!0}function Iy(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const n=go(e).toUpperCase();return n.includes("USDC")?"USDC":n.includes("USD1")?"USD1":n.includes("WSOL")||n.includes("SOL")?"WSOL":""}function bo(e={},t=[]){const n=go(e);return t.some(r=>r.test(n))}function Oy(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!bo(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!bo(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:bo(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const n=I(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return n>0?n<=30:!bo(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function Za(e=[],t=Ce()){const n=he(e||[]);if(!Qa(t))return n;const r=gt(t.keywords),o=gt(t.excludeKeywords),s=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),i=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return n.filter(u=>{const d=go(u);return!(r.length&&!r.some(m=>d.includes(m))||o.length&&o.some(m=>d.includes(m))||s.some(m=>!Ry(u,m))||c.length&&!c.includes(Iy(u))||i.some(m=>!Oy(u,m)))})}function Al(e=[],t=[]){const n=Ce();if(!Qa(n))return"";const r=gt(n.keywords),o=gt(n.excludeKeywords),s=[];r.length&&s.push(`watching ${r.map(i=>`"${i}"`).join(", ")}`),o.length&&s.push(`excluding ${o.map(i=>`"${i}"`).join(", ")}`);const c=Math.max(0,he(e).length-he(t).length);return`<div class="terminal-launch-filter-summary">${l(s.join(" | ")||"filters active")} - ${l(t.length)}/${l(he(e).length)} visible${c?`, ${l(c)} hidden`:""}</div>`}function Yn(e=[],t="pairs"){const n=Ce(),r=gt(n.keywords),o=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",s=he(e).length;return R("Watching fresh launches",s?`No ${t} match ${o} yet. ${s} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${o}.`)}function Cl(e="terminal",t={}){const n=Ce(),r=Qa(n),o=!!(n.open||r),s=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):s;return`
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
            ${sm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${l(i)}" ${n.socials?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${lm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${l(i)}" ${n.quotes?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${im.map(([i,u])=>`
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
  `}function id(){br&&window.clearTimeout(br),br=window.setTimeout(()=>{br=null,J("live"),J("launch"),J("sniper"),h()},180)}function yo(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const o=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-o)/1e3))}const n=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return n&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const Ey=100,Fy=7200,Wy=75e4,Ny=86400,_y=2e6,Dy=28e3,cd=18e4,Uy=16e4;function ud(){const e=Yu();return he([...a.livePairs?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1d?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[]]).map(t=>Zu(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!zn(t))}function en(e={}){return I(e.marketCap,e.fdv)}function dd(e={}){return I(e.liquidityUsd)}function pd(e={}){return I(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function Ll(e={}){if(tn(e))return!1;const t=yo(e);return!Number.isFinite(t)||t<0||t>Fy||en(e)>Wy?!1:Ft(e)<70}function vo(e={}){if(tn(e))return!1;const t=Ft(e),n=en(e),r=n>=Dy&&n<=cd;return t>=55&&(!n||n<=cd)||r}function md(e={}){if(Ll(e)||vo(e)||tn(e))return!1;const t=yo(e);return Number.isFinite(t)&&(t<0||t>Ny)||en(e)>_y?!1:dd(e)>0||pd(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function fd(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Ft(e={}){const t=I(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const n=en(e),r=fd(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&n>0?Math.max(1,Math.min(99,n/69e3*100)):0}function tn(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=fd(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const n=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=en(e);return n&&r>=Uy?!0:!!(n&&/\b(raydium|meteora|orca)\b/.test(t))}function wo(e={}){if(tn(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":vo(e)||t==="graduating"?"graduating":Ll(e)?"new":(t==="steady"||t==="unknown"||md(e),"steady")}function hd(e={}){const t=Number(e.bestPickScore||e.score||0),n=pd(e),r=dd(e),o=en(e),s=yo(e),c=Number.isFinite(s)?Math.max(0,86400-s)/86400:0;return t*1e3+Math.log10(n+1)*160+Math.log10(r+1)*120+Math.log10(o+1)*80+c*100}function gd(e=[]){return[...e].sort((t,n)=>hd(n)-hd(t)||Je(t,n))}function qy(e=[],t=[],n=Ey){const r=new Set,o=[];for(const s of[...e,...t]){const c=String(s?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),o.push(s),o.length>=n))break}return o}function bd(e=a.slimeScopeMode){const t=ud(),n=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(i=>wo(i)===n),o=t.filter(i=>{const u=wo(i);return n==="graduated"?u==="graduated"||tn(i):n==="graduating"?u==="graduating"||vo(i):n==="steady"?u==="steady"||md(i):u==="new"||Ll(i)}),s=n==="new"?[...r].sort(Je):gd(r),c=n==="new"?he(o).sort(Je):gd(o);return qy(s,c)}function Hy(e=[],t="new"){const n=Ze(`slimeScope:${t}`,e).slice(0,12);return n.length?n.map((r,o)=>{const s=r.pairAgeLabel||Nt(r)||"age ?",c=F(r.marketCapLabel,r.fdvLabel,x(rt(r)),"checking"),i=F(r.liquidityLabel,x(ot(r)),"checking"),u=F(r.volumeM15Label,x(_l(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${l(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${st(r,{priority:o<4})}
        <div class="slime-scope-column-main">
          <strong>${l(r.symbol||r.shortMint||v(r.tokenMint))}</strong>
          <small>${l(v(r.tokenMint))} · ${l(s)}</small>
          <span>${l(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${l(c)}</b></span>
          <span>Liq <b>${l(i)}</b></span>
          <span>15m <b>${l(u)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${l(De()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${l(t)} pairs.</div>`}function Ky(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,n,r])=>{const o=bd(t);return`
          <section class="slime-scope-column" data-scope-column="${l(t)}">
            <header>
              <div>
                <h4>${l(n)}</h4>
                <small>${l(r)}</small>
              </div>
              <span>${l(o.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${Hy(o,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function Vy(){const e=Wd(),[,,t]=e,n=sc(a.slimeScopeMode),o=!!(K("slimeScope").inFlight||a.livePairsLoadingByBucket?.[n]),s=a.livePairsRefreshErrorByBucket?.[n],c=he(Nd(ud(),e[0])),i=Ze("slimeScope",c),u=i.length?En()?nt(i,{context:"live",shareBuilder:ya,hideToolbar:!0}):ht(i,{layout:"terminal",limit:Math.max(1,i.length),actionLabel:"Trade"}):s?R("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):o?R("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):R("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${Av(e)}<span>${l(t)}</span></div>
        ${_d(c.length,oa())}
        ${au("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${o?"disabled":""}>${o?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${ra("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${Ky()}
    </section>
  `}function sS(){const e=We(),t=he(e?.rows||[]),n=Za(t),r=[...n].sort(Je),o=Qu(a.kolScan?.rows||[]).filter(L=>!zn(L)),s=Za(o),c=Gn(t,o),i=Za(c),u=Qa(),d=ma(i,8,pa("best-picks"),2),m=new Set(d.map(da).filter(Boolean)),f=rd(r,m),y=ma(f.length?f:r,12,pa("live-pairs"),0),b=new Set([...m,...y.map(da).filter(Boolean)]),S=rd(s,b),T=ma(S.length?S:s,12,pa("kol-signals"),1),A=!!a.livePairsLoadingByBucket[a.livePairBucket],g=oa(),P="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${A?"Refreshing":"Live"}${g?` | ${l(Mn(_a(g)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${$t.map(([L,B])=>{const D=a.livePairsByBucket[L]?.rows?.length,ne=Number.isFinite(Number(D))?` (${D})`:"";return`<button data-live-pair-bucket="${L}" data-active="${a.livePairBucket===L}">${B}${ne}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${om.map(([L,B])=>`<option value="${L}" ${a.terminalSort===L?"selected":""}>${B}</option>`).join("")}
            </select>
          </label>
          ${au("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${A?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${Cl("terminal",{rawCount:t.length,visibleCount:n.length})}
        ${Al(t,n)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?ht(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:P,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?Yn(c,"best picks"):ht(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:P,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?ht(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P}):u?Yn(t,"live pairs"):ht(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${a.kolLoading?"Loading...":"Refresh"}</button></header>
            ${T.length?ht(T,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?Yn(o,"KOL signals"):ht(T,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${pv()}
      </main>
    </section>
  `}function lS(){const e=Et();if(!e)return"Trade";const t=De(e);return t?`Buy ${t} SOL`:Tp(e,"Trade")}function fa(){const e=Et(),t=De(e);return t?`Buy ${t} SOL`:"Quick Buy"}function So(){const e=fa();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{w(t,e)})}function ha(e=""){const t=String(e||"").trim();if(!t)return null;const n=Vn().find(o=>String(o?.tokenMint||o?.mint||o?.tokenAddress||"").trim()===t);if(n)return n;const r=a.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:v(t),symbol:v(t),dexUrl:X(t)}}function zy(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function jy(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function yd(e={}){if(!W("slimeShieldEnabled",!0))return"";const t=Xe(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${l(Xa(r))}">
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
        ${W("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(n)}" data-protected-buy-preset="${l(t.protectedBuyPreset||Pl(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function vd(e=[],t="risk",n="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(o=>t==="positive"?o.severity==="positive":o.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(o=>`
        <li>
          <strong>${l(o.label||o.key||"Signal")}</strong>
          <span>${l(o.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(n)}</p>`}function Gy(e=""){const t=String(e||a.smartChartToken||a.tradeToken||"").trim();!t||!W("slimeShieldEnabled",!0)||(a.slimeShieldDetails={open:!0,tokenMint:t},a.slimeShieldStatus="",Ma(),ga(),Sd(t,{force:!0}),W("replayBeforeBuyEnabled",!0)&&xl(t,{force:!0}))}function wd(){a.slimeShieldDetails={open:!1,tokenMint:""},a.slimeShieldStatus="",ga(),yr()}async function Sd(e="",t={}){const n=String(e||"").trim();if(!n||!W("slimeShieldEnabled",!0))return null;if(!t.force&&a.slimeShieldResults?.[n])return a.slimeShieldResults[n];if(a.slimeShieldLoading?.[n])return null;a.slimeShieldLoading={...a.slimeShieldLoading||{},[n]:!0},ga();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return s&&(a.slimeShieldResults={...a.slimeShieldResults||{},[n]:s},ee(s.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),a.slimeShieldStatus=s.cacheHit?"Loaded from cache.":"Updated from local data."),s}catch(r){return a.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...a.slimeShieldLoading||{}};delete r[n],a.slimeShieldLoading=r,ga()}}function Xy(e=""){const t=ha(e)||Ga(e)||{tokenMint:e},n=Xn(t),r=n.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",o=[...Array.isArray(n.externalLinks)?n.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||X(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((s,c,i)=>/^https?:\/\//i.test(String(s.url||""))&&i.findIndex(u=>String(u.url||"")===String(s.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:n.likelyDevWallet||null,confidence:n.confidence||"unknown",status:ua(n.status),label:n.label||mo(n.status),score:50,summary:n.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:n.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:n.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:n.updatedAt||new Date().toISOString(),externalLinks:o,dataSource:"ui-fallback"}}function kd(e=""){const t=String(e||"").trim();return a.devInfoResults?.[t]||Xy(t)}function Qn(e,t=""){const n=Number(e);return Number.isFinite(n)?`${Math.round(n*10)/10}${t}`:"n/a"}function $d(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function ko(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function Jy(e=""){const t=String(e||"").trim();return t?v(t):"Unknown"}async function Td(e="",t={}){const n=String(e||"").trim();if(!n||!W("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoSummaries?.[n])return a.devInfoSummaries[n];const r=`summary:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0};try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(a.devInfoSummaries={...a.devInfoSummaries||{},[n]:c},ee(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,t.silent||an()}}async function Pd(e="",t={}){const n=String(e||"").trim();if(!n||!W("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoResults?.[n])return a.devInfoResults[n];const r=`details:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0},an();try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(a.devInfoResults={...a.devInfoResults||{},[n]:c},a.devInfoSummaries={...a.devInfoSummaries||{},[n]:{mint:n,status:c.status||"unknown",label:c.label||mo(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},a.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",ee(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(o){return a.devInfoStatus=o?.message||"Dev Info is temporarily unavailable.",null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,an()}}function Yy(e=""){const t=String(e||"").trim();!t||!W("devInfoEnabled",!0)||(a.devInfoDetails={open:!0,tokenMint:t},a.devInfoStatus="",Ma(),an(),Td(t,{force:!0,silent:!0}),Pd(t,{force:!0}))}function Qy(){a.devInfoDetails={open:!1,tokenMint:""},a.devInfoStatus="",an(),yr()}function Zy(e="render"){!W("devInfoEnabled",!0)||us||a.route==="terminal"&&(us=window.setTimeout(()=>{us=null,ev(e)},300))}async function ev(e="render"){if(!W("devInfoEnabled",!0)||La())return;const t=Kn().slice(0,16),n=[],r=new Set;for(const o of t){const s=String(o.tokenMint||o.mint||o.tokenAddress||"").trim();if(!(!s||r.has(s)||a.devInfoSummaries?.[s]||a.devInfoLoading?.[`summary:${s}`])&&(r.add(s),n.push(s),n.length>=8))break}n.length&&(await Promise.allSettled(n.map(o=>Td(o,{silent:!0}))),E({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:n.length,details:e}),La()||xa("dev-info-prefetch"))}function $o(e=[],t="No strong cached signal yet."){const n=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return n.length?`
    <ul class="slimeshield-factor-list">
      ${n.map(r=>`<li><span>${l(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(t)}</p>`}function To(e,t="Not cached yet"){const n=String(e||"").trim();return!n||n.toLowerCase()==="warming"||n.toLowerCase()==="checking"?t:n}function Po(e,t=r=>String(r),n="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):n}function an(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=a.devInfoDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",n),!n||!W("devInfoEnabled",!0)){e.innerHTML="";return}const r=String(t.tokenMint||"").trim(),o=ha(r)||Ga(r)||{tokenMint:r},s=kd(r),c=a.devInfoSummaries?.[r]||Xn(o),i=ua(s.status||c.status),u=s.confidence||c.confidence||"unknown",d=!!a.devInfoLoading?.[`details:${r}`],m=s.likelyDevWallet||c.likelyDevWallet||"",f=s.currentPosition||null,y=s.historicalStats||{},b=s.linkedWalletSignals||{},S=s.marketContext||{},T=s.sourceHydration||{},A=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,8):[],g=I(S.marketCap,o.marketCap,o.fdv),P=I(S.liquidityUsd,o.liquidityUsd),L=I(S.volume5m,o.volume5m,o.volumeM5),B=I(S.volumeH1,o.volumeH1,o.volume1h),D=I(S.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),ne=S.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",we=S.mintAuthority||o.mintAuthority||"",ge=S.freezeAuthority||o.freezeAuthority||"",_=!!(S.heliusDasIndexedAt||S.heliusDasSource||o.heliusDasSource||ne||we||ge),Ee=[...Array.isArray(s.externalLinks)?s.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:o.dexUrl||X(r)},{label:"Solscan Wallet",url:m?`https://solscan.io/account/${encodeURIComponent(m)}`:""},{label:"KOLscan Wallet",url:m?`https://kolscan.io/account/${encodeURIComponent(m)}`:""},{label:"X",url:o.twitterUrl||o.xUrl},{label:"TG",url:o.telegramUrl},{label:"Website",url:o.websiteUrl}].filter((ce,va,qo)=>/^https?:\/\//i.test(String(ce.url||""))&&qo.findIndex(Ho=>String(Ho.url||"")===String(ce.url||""))===va).slice(0,8),Kt=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[];e.innerHTML=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${l(mo(i))} · ${l($d(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${l(i)}">
        <strong>${l(o.symbol||o.shortMint||v(r))}</strong>
        <p>${l(s.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${l(ve(s.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${l(Jy(m))}</dd></div>
          <div><dt>Confidence</dt><dd>${l($d(u))}</dd></div>
          <div><dt>Source</dt><dd>${l(s.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${l(v(s.pairAddress||o.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${m?`<button type="button" data-copy="${l(m)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${l(r)}">Copy CA</button>
        </div>
        ${Ee.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${Ee.map(ce=>`<a href="${l(ce.url)}" target="_blank" rel="noreferrer">${l(ce.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${l(Po(g,x))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Po(P,x))}</dd></div>
          <div><dt>5m volume</dt><dd>${l(Po(L,x))}</dd></div>
          <div><dt>1h volume</dt><dd>${l(Po(B,x))}</dd></div>
          <div><dt>Pair age</dt><dd>${l(Number.isFinite(D)?ko(D):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(ne?v(ne):_?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${we?v(we):_?"none":"not indexed"} / ${ge?v(ge):_?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(S.source||s.cacheSource||s.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${T.message?`<p class="slimeshield-muted">Source refresh: ${l(T.message)}${T.eventsStored?` · ${l(T.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${$o(A,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${l(Qn(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${l(Qn(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${l(Qn(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${l(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${l(ko(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${l(f.lastSellAt?ve(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||Kt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${l(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${l(ko(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${l(Qn(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${l(Qn(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${Kt.length?`
          <ul class="dev-info-launches">
            ${Kt.map(ce=>`<li><span>${l(ce.symbol||v(ce.mint||""))}</span><small>${l(ce.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(s.riskReasons)&&s.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${$o(s.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(s.positiveReasons)&&s.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${$o(s.positiveReasons,"")}
      </section>`:""}
      ${b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${l(b.linkedWalletCount?`${b.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${$o(b.notes,"")}
      </section>`:""}
      ${(()=>{const ce=[f?"":"dev position",Number(y.launchesTracked)>0||Kt.length?"":"launch history",!(s.riskReasons||[]).length&&!(s.positiveReasons||[]).length?"behavior signals":"",!b.linkedWalletCount&&!(b.notes||[]).length?"linked wallets":""].filter(Boolean);return ce.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${l(ce.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(s.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${l(r)}" data-watch-symbol="${l(o.symbol||"")}" data-watch-name="${l(o.name||"")}" data-watch-image="${l(Lo(o)||"")}">${Co(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${l(r)}">Open SlimeShield</button>
        ${W("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${l(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${a.devInfoStatus?`<small class="slimeshield-status">${l(a.devInfoStatus)}</small>`:""}
    </aside>
  `}function Ad(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function Ml(e=""){const t=String(e||"").trim();return a.replayResults?.[t]||Ad(t)}function nn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function tv(e=""){if(!W("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const n=Ml(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${l(n.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(nn(n.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(nn(n.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${l(n.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function xl(e="",t={}){const n=String(e||"").trim();if(!n||!W("replayBeforeBuyEnabled",!0))return null;if(!t.force&&a.replayResults?.[n])return a.replayResults[n];if(a.replayLoading?.[n])return null;a.replayLoading={...a.replayLoading||{},[n]:!0},Zn(),ga();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return s&&(a.replayResults={...a.replayResults||{},[n]:s},ee(s.cacheHit?"replayCacheHit":"replayCacheMiss")),s}catch{return a.replayResults={...a.replayResults||{},[n]:Ad(n)},null}finally{const r={...a.replayLoading||{}};delete r[n],a.replayLoading=r,Zn(),ga()}}function av(e=""){const t=String(e||"").trim();!t||!W("replayBeforeBuyEnabled",!0)||(a.replayDetails={open:!0,tokenMint:t},Ma(),Zn(),xl(t))}function Bl(){a.replayDetails={open:!1,tokenMint:""},Zn(),yr()}function Zn(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=a.replayDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",n),!n||!W("replayBeforeBuyEnabled",!0)){e.innerHTML="";return}const r=String(t.tokenMint||"").trim(),o=Ml(r),s=!!a.replayLoading?.[r];e.innerHTML=`
    <div class="slimeshield-drawer-backdrop" data-replay-close></div>
    <aside class="replay-before-buy-drawer" role="dialog" aria-modal="true" aria-label="Replay Before You Buy details">
      <header>
        <div>
          <span>Replay Before You Buy</span>
          <h3>${l(v(r))}</h3>
        </div>
        <button type="button" data-replay-close>Close</button>
      </header>
      <section class="replay-summary">
        <strong>${l(o.summary||"Not enough local history yet.")}</strong>
        <small>${s?"Updating...":`Confidence: ${l(o.confidence||"low")} · Updated ${l(ve(o.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${l(o.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(nn(o.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${l(nn(o.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(nn(o.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${l(nn(o.failRatePercent))}</dd></div>
        <div><dt>Best exit</dt><dd>${l(o.bestExitPattern||"n/a")}</dd></div>
      </dl>
      <section>
        <h4>Matched Traits</h4>
        ${Array.isArray(o.matchedTraits)&&o.matchedTraits.length?`
          <ul class="slimeshield-factor-list">
            ${o.matchedTraits.map(c=>`<li><span>${l(c)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${l(r)}" ${s?"disabled":""}>${s?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `}function ga(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=a.slimeShieldDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",n),!n||!W("slimeShieldEnabled",!0)){e.innerHTML="";return}const r=String(t.tokenMint||"").trim(),o=ha(r)||{tokenMint:r},s=a.slimeShieldResults?.[r]||Xe(o),c=s.verdict||"CAUTION",i=s.sourceHydration||{},u=s.marketContext||{},d=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,6):[],m=!!a.slimeShieldLoading?.[r],f=Array.isArray(s.factors)?s.factors:[],y=I(u.marketCap,o.marketCap,o.fdv),b=I(u.liquidityUsd,o.liquidityUsd),S=I(u.volumeH1,o.volumeH1,o.volume1h),T=I(u.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),A=u.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",g=u.mintAuthority||o.mintAuthority||"",P=u.freezeAuthority||o.freezeAuthority||"",L=!!(u.heliusDasIndexedAt||u.heliusDasSource||o.heliusDasSource||A||g||P),B=s.devInfoSummary||Xn(o),D=ua(B.status),ne=[...Array.isArray(s.externalLinks)?s.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||o.dexUrl||X(r)},{label:"Pump",url:u.pumpUrl||Ja(o)},{label:"X",url:u.twitterUrl||o.twitterUrl||o.xUrl},{label:"TG",url:u.telegramUrl||o.telegramUrl},{label:"Web",url:u.websiteUrl||o.websiteUrl}].filter((ge,_,Ee)=>/^https?:\/\//i.test(String(ge.url||""))&&Ee.findIndex(Kt=>String(Kt.url||"")===String(ge.url||""))===_),we=[...Array.isArray(o.riskFlags)?o.riskFlags:[],...Array.isArray(o.scoreWarnings)?o.scoreWarnings:[],...Array.isArray(o.bestPickWarnings)?o.bestPickWarnings:[]].filter(Boolean).slice(0,4);e.innerHTML=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${l(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${l(Xa(c))}">
        <strong>${l(o.symbol||o.shortMint||v(r))}</strong>
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
          <div><dt>CA</dt><dd>${l(v(r))}</dd></div>
          <div><dt>Age</dt><dd>${l(Number.isFinite(T)?ko(T):To(o.pairAgeLabel||Nt(o),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Number.isFinite(b)&&b>0?x(b):To(o.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${l(Number.isFinite(y)&&y>0?x(y):To(o.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${l(Number.isFinite(S)&&S>0?x(S):To(o.volumeH1Label||o.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${l(mo(D))} · ${l(B.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(A?v(A):L?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${g?v(g):L?"none":"not indexed"} / ${P?v(P):L?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(u.source||s.cacheSource||s.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${l(we.length?we.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${ne.map(ge=>`<a href="${l(ge.url)}" target="_blank" rel="noreferrer">${l(ge.label)}</a>`).join("")}
          ${W("devInfoEnabled",!0)?`<button type="button" data-dev-info="${l(r)}">Open Dev Info</button>`:""}
        </div>
        ${i.message?`<p class="slimeshield-muted">Source refresh: ${l(i.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(ge=>`<li><span>${l(ge)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${vd(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${vd(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(zy(s.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${l(jy(s.protectedBuyPreset))}</small>
      </section>
      ${tv(r)}
      <div class="slimeshield-drawer-actions">
        ${W("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-preset="${l(s.protectedBuyPreset||Pl(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${l(r)}" ${m?"disabled":""}>${m?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${l(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${a.slimeShieldStatus?`<small class="slimeshield-status">${l(a.slimeShieldStatus)}</small>`:""}
    </aside>
  `}function Rl(e){const t=e==="bundle"?"bundle":"trade";a.activeTab=t,t==="trade"&&(a.editingTradePresetId=""),t==="bundle"&&(a.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function iS(e){if(!e?.tokenMint)return R("No token selected","Click any row to preview it here without leaving the live feeds.");const t=et().some(n=>String(n.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${st(e)}
      <div>
        <strong>${l(e.symbol||e.shortMint||v(e.tokenMint))}</strong>
        <small>${l(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(v(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${l(e.pairAgeLabel||Nt(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${l(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${l(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${l(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${W("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${l(W("slimeShieldEnabled",!0)?Xe(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${yd(e)}
    <div class="card-actions compact">
      <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${Ja(e)?`<a href="${l(Ja(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="token-preview">${l(fa())}</button>
      <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function cS(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([n,r])=>`<button type="button" data-smart-chart-view="${n}" data-active="${e===n}">${r}</button>`).join("")}
    </div>
  `}function nv(e=""){const t=String(e||"").trim();return t?(a.pnl?.trades||[]).filter(n=>String(n?.tokenMint||n?.mint||"").trim()===t):[]}function uS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=nv(n),o=!!(Ja(e)&&ml(e)),s=o?Ja(e):e.dexUrl||X(Hu(e)||n),c=o?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${l(c)} Transactions</h4>
          <p>Live market activity from ${l(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${l(s)}" target="_blank" rel="noreferrer">Open ${l(c)} Feed</a>
      </div>
      ${kl(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${Ol(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function dS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=$p(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${l(e.symbol||v(n))}.</p>
        </div>
      </div>
      ${kl(e,"info")}
      ${od(e)}
      ${yd(e)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${l(r)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${l(n)}">${l(v(n))}</button></dd></div>
        <div><dt>Position</dt><dd>${t?"Held":"None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${l(e.source||e.category||e.dexId||"market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${fo(e)}
      </div>
    </section>
  `}function rv(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=a.chartTradeTab==="sell"?"sell":"buy",o=se(),s=a.wallets?.length?String(a.wallets[0]?.index||""):"",c=ku(),i=Et(),u=i?.walletIndex||(i?.walletIndexes||[])[0]||"",d=o?.publicKey&&$u(o)?"connected":"",m=a.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||s||(o?.publicKey?"connected":""),f=le(m),y=a.quickBuyAmountOverride||De(i)||"",b=i?Ya("trade"):"No preset / manual",S=String(i?.slippageBps||"400"),T=String(i?.takeProfitPct||"25"),A=String(i?.stopLossPct||"8"),g=String(i?.sellDelay||"off"),P=String(i?.sellPercent||"100"),L=new Set(["300","400","500"]),B=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,D=t?`${l(t.uiAmount||"Position")} tokens | ${l(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${Ha(m)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${l(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(ne=>`<button type="button" data-chart-buy-preset="${ne}">${ne} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${tt("trade",a.selectedTradePresetId)}
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
              ${It({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${It({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:A,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${ze("chart-buy-delay","data-chart-buy-delay",g)}
            </label>
            <label>
              Exit Size
              ${It({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:P,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${l(o?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:s?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${l(n)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${l(a.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${D}</p>
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
  `}function pS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim();return n?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${l(n)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${W("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(n)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function ov(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=rt(e),o=ot(e),s=y=>{const b=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(b)?"":b},c=F(r>0?x(r):"",s(e.marketCapLabel),s(e.fdvLabel),"checking"),i=F(o>0?x(o):"",s(e.liquidityLabel),"checking"),u=F(Number(e.volumeH1)>0?x(e.volumeH1):"",s(e.volumeH1Label),s(e.volumeLabel),"checking"),d=F(Number(e.volumeH24)>0?x(e.volumeH24):"",s(e.volumeH24Label),"checking"),m=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,b=Number(e.h1);return o>0&&o<5e3?"Thin exit":Number.isFinite(b)&&b>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(b)||b>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&o>0?"Clean setup":""})(),f=t?"Position held":m||(ml(e)?"Pump curve":F(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${l(v(n))}</strong></span>
      <span><small>MC / FDV</small><strong>${l(c)}</strong></span>
      <span><small>LIQ</small><strong>${l(i)}</strong></span>
      <span><small>1H</small><strong>${l(u)}</strong></span>
      <span><small>24H</small><strong>${l(d)}</strong></span>
      <span><small>Status</small><strong>${l(f)}</strong></span>
    </div>
  `}function sv(){try{return lv()}catch(e){console.error("Smart Chart render failed:",e);const t=String(a.smartChartToken||a.tradeToken||a.terminalToken||"").trim(),n=t?v(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
    `}}function lv(){const e=co(),t=String(e?.tokenMint||"").trim(),n=t?et().find(s=>String(s.tokenMint)===t):null,r=t?he([e,...Kn().filter(s=>String(s.tokenMint||"")===t)]).filter(Boolean).slice(0,5):ma(Gn(),5,pa("smart-chart-suggest"),1);if(!t)return`
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
          ${ht(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:pa("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;ea("tokenHeaderRendered"),ea("chartSkeletonRendered"),ea("buyPanelReady"),E({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(Ge(t)?.cacheHit||jn(t)?.pairAddress),stale:!!Ge(t)?.stale,details:t});const o=e.symbol||e.shortMint||v(t);return`
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
            ${st(e)}
            <div>
              <strong>${l(o)}</strong>
              <small>${l(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${l(t)}">${l(v(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${fo(e)}
            </div>
          </div>
          ${ov(e,n)}
          ${kl(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${l(o)}</h3>
          ${rv(e,n)}
        </aside>
      </div>
      ${cv(t)}
    </section>
  `}let Il="",Cd=0;function Ld(e){e&&(Il===e&&Date.now()-Cd<3e4||(Il=e,Cd=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{a.chartCalls={mint:e,...t},a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function iv(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[n,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${n} ${r}`}function cv(e){Ld(e);const t=a.chartCalls?.mint===e?a.chartCalls:null,n=t?.calls||[],r=!!(a.token&&a.user);return`
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
                <strong>${l(iv(o.side))} <span class="muted-text">by ${l(o.handle)}</span>
                  ${o.reputation?.wins?`<span class="positive">${l(String(o.reputation.wins))}W${o.reputation.hitRatePct!=null?` ${l(String(o.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${o.entryMcUsd?`Entry MC ${l(x(o.entryMcUsd))} | `:""}${o.targetX?`Target ${l(String(o.targetX))}x | `:""}${o.shieldVerdict?`Shield ${l(o.shieldVerdict)} ${l(String(o.shieldScore??""))} | `:""}${l(ve(o.createdAt))}</span>
                ${o.note?`<small>${l(o.note)}</small>`:""}
                ${o.status==="resolved"?`<small class="${o.outcome==="won"?"positive":"negative"}">${o.outcome==="won"?`✅ hit ${l(String(o.peakX))}x`:l(o.outcome)}</small>`:o.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${l(o.mint)}" data-quick-buy-source="call-board">${l(fa())}</button>
                <button data-watch-token="${l(o.mint)}" data-watch-symbol="${l(o.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${l(Zt(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ve(`$${a.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function uv(e){const t=p("[data-call-status]");try{const n=p("[data-call-side]")?.value||"bullish",r=p("[data-call-target]")?.value||"",o=p("[data-call-note]")?.value||"";w(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:n,targetX:r,note:o,source:"site"})}),w(t,"Call posted - it is now being tracked."),Il="",Ld(e)}catch(n){w(t,N(n?.message||"Could not post call."))}}function dv(e,t=!1){const n=e?.tokenMint?a.positions.find(s=>String(s.tokenMint)===String(e.tokenMint)):null,r=Ya("trade"),o=Ya("bundle");return t?`
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
                ${tt("trade",a.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${tt("bundle",a.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${Mt().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${l(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${l(fa())}</button>
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
          <small>${l(xr())}</small>
        </div>
    </article>
  `}function pv(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,n])=>`<button data-terminal-subtab="${t}" data-active="${a.terminalSubtab===t}">${n}</button>`).join("")}
      </div>
      ${mv()}
    </section>
  `}function mv(){if(a.terminalSubtab==="orders")return Bd();if(a.terminalSubtab==="history")return Ol(12);if(a.terminalSubtab==="wallets")return Uu();if(a.terminalSubtab==="kol"){const e=Qu(a.kolScan?.rows||[]).filter(t=>!zn(t));return ht(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:pa("bottom-kol"),stickyCount:1})}return a.terminalSubtab==="sniper"?a.scan?nt(a.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):R("No sniper scan loaded","Open Sniper or refresh a scan mode."):a.terminalSubtab==="tx"?Id(!0):a.terminalSubtab==="reconcile"?Rd():fv(6)}function fv(e=25){const t=et();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(xd).join("")}
    </div>
  `:R("No open positions","Open token holdings will show here after refresh.")}const Md=new Map;function hv(e){const t=String(e.tokenMint||"");if(!t)return"";const n=(a.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=Vn().find(d=>String(d?.tokenMint||"")===t),o=(Array.isArray(a.tradePlans)?a.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),s=[];n?.spentSol&&s.push(`Entry ${n.spentSol} SOL`),r?.marketCapLabel&&s.push(`MC ${r.marketCapLabel}`),s.push(o?`TP ${o.takeProfitSummary||o.takeProfitPct||"off"} / SL ${o.stopLossSummary||o.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let i="";if(Number.isFinite(c)){const d=Md.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const m=c-d.value;i=`${m>0?"▲ +":"▼ "}${m.toFixed(4)} SOL since last refresh`}Md.set(t,{value:c,at:Date.now()})}let u="";if(o){const d=Number(o.lastMovePct??o.wallets?.[0]?.lastMovePct),m=Number(o.takeProfitPct),f=Number(o.stopLossPct),y=Date.parse(o.sellAfterAt||o.wallets?.[0]?.sellAfterAt||""),b=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(m)&&m>0&&d>=m*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${m}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:b!==null&&b>0&&b<=10?u=`Timer exit in ~${b} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${l(s.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${l(u)}</small>`:""}
    ${i?`<small class="${i.startsWith("▲")?"positive":"negative"}">${l(i)}</small>`:""}
  `}function xd(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",n=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),o=!!(e.viewOnly||e.source==="connected-wallet"),s=t?`${e.estimatedValueSol} SOL`:r?"updating":o?"tracking":"Price unavailable",c=n?e.openPnlSol:r?"updating":o?"realized only":"Price unavailable",i=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:o&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${st(e)}
      <div class="row-main">
        <strong>${l(e.symbol||e.shortMint)}</strong>
        <span>${l(e.uiAmount)} tokens across ${l(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${l(e.name)}</small>`:""}
        <small>Value: ${l(s)} | PnL: ${l(c)}</small>
        ${hv(e)}
        ${i?`<small class="${r?"muted-text":"warning-text"}">${l(i)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
        <button data-token-trade="${l(e.tokenMint)}" data-token-trade-source="position-arm" title="Open the trade ticket to arm or adjust TP/SL on this bag">Arm Exits</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${l(e.tokenMint)}">Custom %</button>
        ${Ve(ph(e))}
        <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Ol(e=10,t=null){const n=Array.isArray(t)?t:a.pnl?.trades||[];return n.length?`
    <div class="live-trade-list">
      ${n.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${l(String(r.type||"").toUpperCase())} ${l(r.shortMint||v(r.tokenMint))}</strong>
          <span>${l(r.walletLabel||"wallet")} | ${l(r.solAmount||"0")} SOL</span>
          <small>${l(ve(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${l(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="live-trades">${l(fa())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:R("No live trade history yet","Submitted web trades will appear here after refresh.")}function gv(){const e=a.pnl?.trades||[],t=Ze("liveTrades",e);return`
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
        ${Ol(t.length||Wa("liveTrades"),t)}
        ${ra("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${dv(qu())}
      </aside>
    </section>
  `}function Bd(){const e=Array.isArray(a.tradePlans)?a.tradePlans:[],t=[a.tradePlanResult,a.bundleResult,a.volumeResult,a.sniperResult,a.kolResult,a.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),n=e.length?e:t;return n.length?`
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
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(bv).join("")}</div>`:""}
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
  `:R("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function bv(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",n=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,o=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",s=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Mn(_a(e.retryAfterAt))}`:"",i=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",m=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${l(e.label||"Wallet")}</strong>
        <span>${l(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${l(n)}${e.triggerKind?` / ${l(e.triggerKind)}`:""}</span>
        <small>Move ${l(o)}${l(s)} | checked ${l(Mn(_a(t)))}${l(c)}</small>
        <small>${l(u)} | ${l(d)} | ${l(m)} | Source: ${l(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${l(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${l(e.sellSignature)}</small>`:""}
        ${i?`<small class="warning-text">Error: ${l(i)}</small>`:""}
      </div>
    </div>
  `}function Rd(){const e=a.balances.filter(n=>n.error),t=a.balances.reduce((n,r)=>n+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${l(Mn(_a(a.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(n=>`<article class="row-card"><strong>${l(n.label||`Wallet ${n.index}`)}</strong><span>${l(n.error)}</span></article>`).join("")}
      </div>
    `:R("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Id(e=!1){const t=a.terminalTxAudit;return`
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
        ${t?yv(t):R("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${Bd()}${Rd()}</aside>`}
    </section>
  `}function yv(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${l(e.error)}</span></article>`:`
    <section class="pnl-summary tx-summary">
      <div><span>Status</span><strong>${l(e.status||"unknown")}</strong></div>
      <div><span>Fee</span><strong>${l(e.feeSol||"0")} SOL</strong></div>
      <div><span>Slot</span><strong>${l(e.slot||"n/a")}</strong></div>
      <div><span>Refresh</span><strong>${e.shouldRefreshBalances?"Yes":"No"}</strong></div>
    </section>
    <div class="table-list compact-table">
      <article class="row-card"><strong>Fee payer</strong><code>${l(e.feePayer||"unknown")}</code></article>
      <article class="row-card"><strong>SOL deltas</strong><span>${(e.solDeltas||[]).map(t=>`${v(t.account)} ${t.deltaSol}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Token deltas</strong><span>${(e.tokenDeltas||[]).map(t=>`${v(t.owner||t.account)} ${t.deltaUiAmount} ${v(t.mint)}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Created token accounts</strong><span>${(e.createdAssociatedTokenAccounts||[]).map(t=>v(t.account)).join(", ")||"none detected"}</span></article>
      <article class="row-card"><strong>Programs</strong><span>${(e.programs||[]).join(", ")||"n/a"}</span></article>
      ${e.explorerUrl?`<article class="row-card"><strong>Explorer</strong><a href="${l(e.explorerUrl)}" target="_blank" rel="noreferrer">Open Solscan</a></article>`:""}
    </div>
    <details class="raw-log-panel">
      <summary>Raw logs</summary>
      <pre>${l((e.logs||[]).join(`
`)||"No logs returned.")}</pre>
    </details>
  `}function vv(e=[]){const t=[...e].sort((n,r)=>Number(r.bestPickScore||r.score||0)-Number(n.bestPickScore||n.score||0)||Je(n,r));return ma(t,5,pa("cooks-best"),1)}function ke(e){const t=Number(e);return Number.isFinite(t)?t:0}function Od(){const e=a.liveFeedCategory||"best";return ps.find(([t])=>t===e)||ps[0]}function ba(e={}){return Mo(e)||Ud(e)||_l(e)||0}function El(e={}){return ke(e.buys5m)+ke(e.buysH1)+ke(e.sells5m)+ke(e.sellsH1)}function Ed(e={}){const t=ke(e.buys5m)+ke(e.buysH1),n=ke(e.sells5m)+ke(e.sellsH1),r=t+n;return r>0?t/r:.5}function er(e={}){return Math.max(ke(e.m5),ke(e.h1),ke(e.h24))}function Ao(e={}){return Math.max(ke(e.m5),ke(e.h1))}function Wt(e={}){return Ao(e)*Math.log10(10+ba(e))*(.5+Ed(e))}function Fl(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function wv(e=[],t="best"){const n=[...e];switch(t){case"volume":return n.sort((r,o)=>ba(o)-ba(r));case"liquidity":return n.sort((r,o)=>ot(o)-ot(r));case"marketcap":return n.sort((r,o)=>rt(o)-rt(r));case"active":return n.sort((r,o)=>El(o)-El(r));case"fresh":return n.sort(Je);case"gainers":return n.sort((r,o)=>er(o)-er(r));default:return n.sort((r,o)=>ke(o.bestPickScore||o.score)-ke(r.bestPickScore||r.score)||Je(r,o))}}function Sv(){const e=a.liveTerminalCategory||"dexTrending";return Ba.find(([t])=>t===e)||Ba[0]}function kv(e,t,n,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${l(r)}</span>
      <select ${n} aria-label="${l(r)} category">
        ${e.map(([o,s])=>`<option value="${o}"${o===t?" selected":""}>${l(s)}</option>`).join("")}
      </select>
    </label>`}function $v(){if(a.activeTab==="terminal"){const t=Sv();return{categories:Ba,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:n=>Nd(n,t[0]),hasBest:!1}}const e=Od();return{categories:ps,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>wv(t,e[0]),hasBest:e[0]==="best"}}function Tv(e={}){if(Fl(e))return{cls:"boost",text:"⚡ Boosted"};const t=er(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const n=Number(e.pairAgeMinutes);return Number.isFinite(n)&&n>=0&&n<=10?{cls:"fresh",text:"✨ Fresh"}:Ao(e)>=25?{cls:"hot",text:"🔥 Hot"}:Ed(e)>=.7&&El(e)>=24?{cls:"active",text:"● Active"}:null}function Wl(e={}){const t=Tv(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${l(t.text)}</span>`:""}function Fd(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function Pv(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return Fd(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Wd(){const e=a.cookSpotCategory||"dexTrending";return Ba.find(([t])=>t===e)||Ba[0]}function Nd(e=[],t="dexTrending"){const n=[...e];switch(t){case"fresh":return n.sort(Je);case"dexBoosted":{const r=n.filter(Fl).sort((s,c)=>ba(c)-ba(s)),o=n.filter(s=>!Fl(s)).sort((s,c)=>Wt(c)-Wt(s));return[...r,...o]}case"pumpTrending":{const r=n.filter(Fd);return(r.length?r:n).sort((o,s)=>Wt(s)-Wt(o))}case"memeMovers":{const r=n.filter(Pv);return(r.length?r:n).sort((o,s)=>er(s)-er(o))}case"earlyMomentum":{const r=n.filter(o=>{const s=Number(o.pairAgeMinutes);return!Number.isFinite(s)||s<=180});return(r.length?r:n).sort((o,s)=>Ao(s)-Ao(o))}case"graduating":{const r=n.filter(o=>vo(o)||wo(o)==="graduating");return(r.length?r:n).sort((o,s)=>Wt(s)-Wt(o))}case"graduated":{const r=n.filter(o=>tn(o)||wo(o)==="graduated");return(r.length?r:n).sort((o,s)=>ba(s)-ba(o))}default:return n.sort((r,o)=>Wt(o)-Wt(r))}}function Av(e=Wd()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${Ba.map(([n,r])=>`<option value="${n}"${n===t?" selected":""}>${l(r)}</option>`).join("")}
      </select>
    </label>`}function _d(e=0,t=""){const n=_a(t),r=n===null?"live":Mn(n);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${l(r)}</span></div>`}function Nl(e=[]){const t=$v(),n=kv(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',o=_d(e.length,oa()),s={context:"live",shareBuilder:ya,hideToolbar:!0};if(t.hasBest){const i=vv(e),u=new Set(i.map(da).filter(Boolean)),d=[...e].sort(Je).filter(f=>!u.has(da(f))),m=Ze("live",d);return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${n}<span>Top ${i.length} · rotating each refresh</span>${r}</div>
        ${i.length?nt(i,s):R("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${m.length?nt(m,s):R("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=Ze("live",t.rank(e));return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${n}<span>${l(t.sub)}</span>${r}</div>
        ${c.length?nt(c,s):R("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function Dd(){const e=We(),t=he(e?.rows||[]),n=Za(t),r=Ze("live",n),o=$t.find(([f])=>f===a.livePairBucket)?.[1]||"Live",s=oa(),c=!!a.livePairsLoadingByBucket[a.livePairBucket],i=Qa(),u=a.livePairsRefreshErrorByBucket?.[a.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",m=n.length?Nl(n):i?Yn(t,`${o.toLowerCase()} pairs`):u?R("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?R("Loading live pairs…","Scanning fresh pairs for this time window."):R("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${$t.map(([f,y])=>{const b=a.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(b))?` (${b})`:"";return`<button data-live-pair-bucket="${f}" data-active="${a.livePairBucket===f}">${y}${S}</button>`}).join("")}
        </div>
        ${Cl("live",{rawCount:t.length,visibleCount:n.length})}
        ${Al(t,n)}
        ${el("live")}
        ${m}
        ${ra("live",n,`${o} pairs`)}
      </main>
    </section>
  `}function mS(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function Cv(){if(!a.user||!a.token)return`${Ua()}${R("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=a.watchlist?.rows||[],t=Ze("watchlist",e);return`
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
        ${t.length?nt(t,{context:"watchlist",shareBuilder:n=>Gs(n.tokenMint)}):R("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
        ${ra("watchlist",e,"watched pairs")}
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
  `}function fS(e){return nt(e,{context:"live",shareBuilder:ya})}function nt(e,t={}){const n=t.shareBuilder||ya,r=he(e),o=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":el(t.context||"scanner")}
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
      ${r.map((s,c)=>Lv(s,c,{...t,shareText:n(s),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":el(t.context||"scanner")}
      ${R(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function Lv(e,t,n={}){const r=Co(e.tokenMint),o=n.shareText||ya(e),s=n.primaryActionLabel||"Trade",c=n.primaryAction||"quickTrade",i=n.context==="kol",u=n.context==="watchlist"?`<button type="button" data-unwatch-token="${l(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Lo(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-row")}">
      <div class="signal-token">
        ${st(e,{priority:!!n.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-title")}">${l(e.symbol||e.shortMint||v(e.tokenMint))}</strong>
            <small>${l(e.name||e.category||"Token")}</small>
            ${i?"":Wl(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(v(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${l(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${l(o)}" title="Share to X">SHARE</button>
            ${Hc(o,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(e.sniperCount)}</span>`:""}
          </div>
          ${Ty(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${l(e.pairAgeLabel||Nt(e)||"age unknown")}</span><small>${l(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${l(F(e.liquidityLabel,ot(e)>0?x(ot(e)):"","checking"))}</span><small>${Mv(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${l(F(e.marketCapLabel,rt(e)>0?x(rt(e)):"","checking"))}</span><small>${l(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${l(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${l(Sy(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${l(F(e.volumeH1Label,e.volumeLabel,Mo(e)>0?x(Mo(e)):"","checking"))}</span>
        <small>${ad(e).map(([d,m])=>`${d} ${m}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${l(e.tokenMint)}" title="Snipe buy">${l(s)}</button>`:`<button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(n.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(n.context||"signal-row")}" title="Quick buy with preset or custom SOL">${l(fa())}</button>`}
        <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${i?fu(e):""}
        ${u}
        ${td(e)}
      </div>
    </article>
  `}function Co(e){const t=String(e||"");return!!(a.watchlist?.rows||[]).some(n=>String(n.tokenMint)===t)}function Nt(e){const t=yo(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function Mv(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const n=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${n}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function Lo(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{},s=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,n.imageUrl,n.image,n.logoURI,n.logo,n.iconUrl,n.info?.imageUrl,n.baseToken?.imageUrl,n.baseToken?.logoURI,o.imageUrl,o.image,o.logoURI,o.logo,s.imageUrl,s.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const i of c){const u=dt(i);if(u)return u}return""}function rt(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{};return I(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,n.marketCap,n.marketCapUsd,n.market_cap,n.fdv,n.fdvUsd,n.baseToken?.marketCap,n.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,o.marketCap,o.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function ot(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.liquidity||{};return I(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,o.usd,o.quote,n.liquidityUsd,n.liquidity_usd,n.liquidity?.usd,n.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function _l(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,o.m15,o.m15m,o.m5,o.h1,n.volume?.m15,n.volume?.m5,n.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Mo(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,o.h1,o.m30,o.m15,n.volume?.h1,n.volume?.m30,n.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function Ud(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH24,e.volume24h,e.volume_h24,o.h24,o.d1,n.volume?.h24,n.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function st(e,t={}){const n=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=Lo(e),o=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),s=`token:${String(o||e.symbol||n).trim().toLowerCase()}`,c=W("tokenAvatarFixEnabled",!0),i=String(e.avatarState||"").trim().toLowerCase(),u=!!e.avatarUrl&&(!i||i==="ready"),d=u&&o?dt(Sh(e)):"",m=c?Js(s,u?e.avatarUrl:"",d,i?"":r):Js(s,d,r),f=c&&u?d&&m!==d?d:r&&e.avatarUrl&&r!==e.avatarUrl?r:"":"",y=!!t.priority,b=y?"eager":"lazy",S=y?"high":"low",T=i||(m?"ready":"missing");if(m){const A=f?` data-backup-src="${l(f)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${l(T)}"><img src="${l(m)}"${A} data-avatar-src="${l(m)}" data-avatar-key="${l(s)}" alt="${l(e.symbol||e.name||"Token")}" loading="${b}" decoding="sync" fetchpriority="${S}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${l(n)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${l(T)}"><span>${l(n)}</span></div>`}function xv(e=""){const t=String(e||"");let n=0;for(let r=0;r<t.length;r+=1)n+=t.charCodeAt(r);return n%5+1}function Dl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${xv(e)}.png`}function ya(e){return`Live pair ${e.symbol||v(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Nt(e)||"age unknown"}.`}function Bv(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([n])=>n===a.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${l(Rv(a.scanMode))}</p>
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
        ${a.scan?Ev():R("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${Iv()}
      </aside>
    </section>
  `}function Rv(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function Iv(){if(!a.wallets.length)return R("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=a.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${pt("sniper")}
        </div>
        ${Rt("sniper")}
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
            ${ze("sniper-delay","data-sniper-delay",e?"3":"5")}
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
            ${Or("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:Fr("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${Ka({toolKey:"sniperSetup",activeKey:Va("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${a.sniperResult?l(a.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${Ov()}
    </section>
  `}function Ov(){const e=a.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function Ev(){const e=a.scan.rows||[],t=Ze("sniper",e);return e.length?`
    <p class="scan-meta">${l(a.scan.label)} | ${t.length}/${e.length} shown | scored ${a.scan.scanned} | qualified ${a.scan.qualified} | mode-fit ${a.scan.modeFit} | display pool ${a.scan.displayPool||0}</p>
    ${nt(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:mh})}
    ${ra("sniper",e,"snipe candidates")}
  `:R("No usable picks","Refresh again or choose a different mode.")}function xo(){return a.user?.connectedWallet?.publicKey||""}function qd(){return a.ogreTek.markets.find(e=>e.symbol===a.ogreTek.selectedMarket)||a.ogreTek.markets[0]||null}function Fv(){return{marketSymbol:a.ogreTek.selectedMarket,direction:a.ogreTek.direction,orderType:a.ogreTek.orderType,collateralUsd:a.ogreTek.collateralUsd,leverage:a.ogreTek.leverage,slippagePct:a.ogreTek.slippagePct,priorityFeeLamports:a.ogreTek.priorityFeeLamports,limitPrice:a.ogreTek.limitPrice,stopPrice:a.ogreTek.stopPrice}}function Hd(){return kp(Fv(),qd(),a.ogreTek.account,Se)}function ye(e,t=2){const n=Number(e);return Number.isFinite(n)?Math.abs(n)>=1e9?`$${(n/1e9).toFixed(2)}B`:Math.abs(n)>=1e6?`$${(n/1e6).toFixed(2)}M`:Math.abs(n)>=1e3?`$${(n/1e3).toFixed(1)}K`:`$${n.toFixed(t)}`:"n/a"}function lt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function Bo(e,t=3){const n=Number(e);return Number.isFinite(n)?`${n>=0?"+":""}${n.toFixed(t)}%`:"n/a"}function Kd(e){const t=Date.parse(e||"");if(!t)return"not loaded";const n=Math.max(0,Math.round((Date.now()-t)/1e3));return n<60?`${n}s ago`:`${Math.round(n/60)}m ago`}function Ro(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in a.ogreTek)||(e.type==="checkbox"?a.ogreTek[t]=!!e.checked:a.ogreTek[t]=e.value)})}async function Wv(){!Se.enabled||a.ogreTek.loading||a.ogreTek.markets.length||a.ogreTek.error||await tr({silent:!0}).catch(e=>{a.ogreTek.error=N(e.message),h({force:!0})})}async function tr({force:e=!1,silent:t=!1}={}){if(Se.enabled&&!(a.ogreTek.loading&&!e)){a.ogreTek.loading=!0,a.ogreTek.error="",t||h({force:!0});try{const n=xo(),[r,o,s,c]=await Promise.all([nr.getMarkets(),nr.getAccount(n),nr.getPositions(n),nr.getOpenOrders(n)]);a.ogreTek.markets=r||[],a.ogreTek.account=o||null,a.ogreTek.positions=s||[],a.ogreTek.orders=c||[],a.ogreTek.markets.some(i=>i.symbol===a.ogreTek.selectedMarket)||(a.ogreTek.selectedMarket=a.ogreTek.markets[0]?.symbol||"SOL-PERP"),a.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(n){a.ogreTek.error=N(n.message)}finally{a.ogreTek.loading=!1,h({force:!0})}}}function Nv(){return`
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
  `}function _v(){if(vp(Se)!=="enabled")return Nv();const e=!!xo(),t=qd(),n=Hd(),r=n.quote,o=a.ogreTek.account,s=n.ok&&!a.ogreTek.loading,c=a.ogreTek.error?"Provider Error":a.ogreTek.loading?"Loading":"Ready",i=Se.demoMode?"Review Demo Trade":"Review Trade",u=Se.demoMode?"Confirm Demo Review":"Confirm Order",d=Se.demoMode?!a.ogreTek.riskAccepted||!n.ok:!bp({validation:n,riskAccepted:a.ogreTek.riskAccepted,demoMode:Se.demoMode});return`
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
            ${Dv()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${a.ogreTek.positions.length} open</span>
            </div>
            ${qv()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${Hv()}
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
            ${Uv(r,t)}
            ${Vd(n)}
            <button class="primary" type="button" data-ogre-tek-review ${s?"":"disabled"}>${l(i)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${Kv(o)}
          </article>
        </aside>
      </section>
      ${a.ogreTek.reviewOpen?Vv({validation:n,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function Dv(){return a.ogreTek.loading&&!a.ogreTek.markets.length?R("Loading markets","Ogre Tek is loading demo perps markets."):a.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${a.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${l(e.symbol)}" data-active="${e.symbol===a.ogreTek.selectedMarket}">
          <span>${l(e.symbol)}</span>
          <strong>${lt(e.indexPrice)}</strong>
          <small>Oracle ${lt(e.oraclePrice)} | 24h ${Bo(e.change24hPct,2)}</small>
          <small>Funding ${Bo(e.fundingRatePct,3)} | OI ${ye(e.openInterestUsd,0)}</small>
          <small>Fresh ${l(Kd(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:R("No markets available","No allowed perps markets are available for this provider.")}function Uv(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${lt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${ye(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${lt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${ye(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${ye(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${ye(e?.maxLossUsd)}</strong></span>
    </div>
  `}function Vd(e){const t=e.errors||[],n=e.warnings||[];return!t.length&&!n.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${l(r)}</p>`).join("")}
      ${n.map(r=>`<p data-kind="warning">${l(r)}</p>`).join("")}
    </div>
  `}function qv(){return xo()?a.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${a.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.side)} | margin ${Bo(e.marginRatioPct,1)}</small></span>
          <span>${ye(e.sizeUsd)}<small>collateral ${ye(e.collateralUsd)}</small></span>
          <span>${lt(e.entryPrice)}<small>mark ${lt(e.markPrice)}</small></span>
          <span>${lt(e.liquidationPrice)}</span>
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
  `:R("No open positions","Mock positions will appear here when the provider reports them."):R("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function Hv(){return xo()?a.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${a.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.type)} ${l(e.side)}</small></span>
          <span>${lt(e.triggerPrice)}</span>
          <span>${ye(e.sizeUsd)}</span>
          <span>${l(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:R("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):R("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function Kv(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${ye(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${ye(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${ye(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${l(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${ye(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${l(e.maxLeverageAllowed||Se.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${l(Kd(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function Vv({validation:e,quote:t,market:n,confirmButtonText:r,confirmDisabled:o}){const s=e.order||{};return`
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
          <span><small>Entry Estimate</small><strong>${lt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${lt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${ye(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${Bo(n?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${ye(t?.maxLossUsd)}</strong></span>
        </div>
        ${Vd(e)}
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
  `}function zd(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const Ul="slimewire:ogreAgentMessages:v1",ql="slimewire:ogreAgentLastToken:v1";function zv(){try{const e=JSON.parse(localStorage.getItem(Ul)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function jv(){try{localStorage.setItem(Ul,JSON.stringify(rn().slice(-50)))}catch{}}function _t(){if(a.ogreAgentLastTokenMint)return String(a.ogreAgentLastTokenMint);try{a.ogreAgentLastTokenMint=String(localStorage.getItem(ql)||"").trim()}catch{a.ogreAgentLastTokenMint=""}return a.ogreAgentLastTokenMint||""}function Io(e=""){const t=String(e||"").trim();if(!t)return"";a.ogreAgentLastTokenMint=t;try{localStorage.setItem(ql,t)}catch{}return t}function rn(){if(!Array.isArray(a.ogreAgentMessages)||!a.ogreAgentMessages.length){const e=zv();a.ogreAgentMessages=e.length?e:[zd()]}return a.ogreAgentMessages}function Gv(){const e=String(a.smartChartToken||a.tradeToken||_t()||"").trim(),t=e?ha(e):null,n=t?.tokenMint?Xe(t):null,r=e?kd(e):null,o=e?Ml(e):null,s=Hr().slice(0,3),c=e?et().find(i=>String(i.tokenMint||"")===e):null;return{route:a.route,activeTab:a.activeTab,agentFastMode:a.ogreAgentFastMode,agentAutoTradeApproved:Wo(),lastTokenMint:_t(),recentAgentMessages:rn().slice(-8).map(i=>({role:i.role==="user"?"user":"assistant",text:String(i.text||"").slice(0,600)})),smartChartToken:a.smartChartToken||"",tradeToken:a.tradeToken||"",livePairBucket:a.livePairBucket||"",slimeScopeMode:a.slimeScopeMode||"",walletConnected:!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey),walletCount:Os(),positionCount:et().length,totalSol:Mt().toFixed(4),selectedTradePreset:Ya("trade"),selectedBundlePreset:Ya("bundle"),quickBuyAmount:String(zl()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:Co(e)}:null,slimeShield:n?{verdict:n.verdict,summary:n.summary,confidence:n.confidence,suggestedAction:n.suggestedAction,topFactors:(n.factors||[]).slice(0,4).map(i=>i.message||i.label||i.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?v(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:s.length?s.map(i=>({displayName:i.displayName,riskLabel:i.riskLabel,dumpRiskPercent:i.lowData?null:i.dumpRiskPercent,lowData:!!i.lowData,summary:_n(i)})):[],replayBeforeBuy:o?{sampleSize:o.sampleSize,confidence:o.confidence,winRatePercent:o.winRatePercent,medianMaxDrawdownPercent:o.medianMaxDrawdownPercent,summary:o.summary}:null,pnlSummary:{realized:mc(),positions:et().length,totalSol:Mt().toFixed(4)},profile:{hasReferralCode:!!a.user?.referralCode,referralCode:a.user?.referralCode||"",hasReferralPayoutWallet:!!a.user?.referralPayoutWallet,hasXHandle:!!(a.xHandle||a.user?.xHandle),traderBoardEnabled:a.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:jd()}}function jd(){const e=[],t=new Set,n=(r,o="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(i=>n(i,o));return}if(Array.isArray(r.rows)){r.rows.forEach(i=>n(i,o));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(i=>n(i,o));return}if(typeof r!="object")return;const s=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!s)return;const c=s.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:s,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:o}))};return n(a.livePairRows,"live-pairs"),n(a.slimeScopeRows,"slime-scope"),n(a.livePairs,"live-pairs"),Object.values(a.livePairsByBucket||{}).forEach(r=>n(r,"bucket")),Object.values(a.terminalFeeds||{}).forEach(r=>n(r,"terminal-feed")),e.sort((r,o)=>Gd(o)-Gd(r)).slice(0,24)}function Gd(e={}){const t=A=>Number.isFinite(Number(A))?Number(A):0,n=t(e.ageMinutes),r=t(e.marketCap),o=t(e.liquidityUsd),s=t(e.volume5m),c=t(e.volume1h),i=Math.max(s,c*.18),u=n>0?Math.max(0,90-Math.min(n,360))/2.5:12,d=n>120?Math.min(42,(n-120)/4):0,m=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?i/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:i>0?2:-18,b=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,T=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+m+y+Math.log10(1+s+c)*7+Math.log10(1+o)*3+b+S-T-d}function Xv(e={}){return String(e.label||e.type||"Run").slice(0,40)}function Jv(e={},t=0){const n=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${l(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${l(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${n.length?`<div class="ogre-agent-actions">${n.map((o,s)=>`<button type="button" data-ogre-agent-action="${t}:${s}">${l(Xv(o))}</button>`).join("")}</div>`:""}
    </div>
  `}function Yv(){const e=!!(a.ogreAgentLoading||a.ogreAgentSpeaking),t=!!a.ogreAgentListening,n=!!a.ogreAgentVoiceEnabled;return`
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
  `}function Qv(){const e=!!a.ogreAgentOpen,t=rn(),n=a.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=Qd(),o=a.ogreAgentListening?"Stop":"Mic";return`
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
        ${e?Yv():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(Jv).join("")}
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
          <button type="button" data-ogre-agent-quick="risk">Why Risk?</button>
          <button type="button" data-ogre-agent-quick="dev_info">Dev Info</button>
          <button type="button" data-ogre-agent-quick="protected_buy">Protected Buy?</button>
          <button type="button" data-ogre-agent-quick="replay">Replay</button>
          <button type="button" data-ogre-agent-quick="refresh_feeds">Refresh</button>
          <button type="button" data-ogre-agent-quick="clear_chat">Clear</button>
        </div>
        <small class="ogre-agent-disclaimer">AI can make mistakes. Always review wallet prompts before signing.</small>
        ${a.ogreAgentStatus?`<small class="ogre-agent-status">${l(a.ogreAgentStatus)}</small>`:""}
      </section>
    </div>
  `}function O({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const n=t.querySelector("[data-ogre-agent-input]"),r=!!(n&&document.activeElement===n),o=r?n.selectionStart:null,s=r?n.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),i=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;n&&(a.ogreAgentDraft=n.value);const d=Array.isArray(a.ogreAgentMessages)?a.ogreAgentMessages:[],m=d[d.length-1]||{},f=[a.ogreAgentOpen?"open":"closed",a.ogreAgentLoading?"loading":"idle",a.ogreAgentStatus||"",d.length,m.role||"",m.text||"",Array.isArray(m.actions)?m.actions.length:0,a.ogreAgentVoiceEnabled?"voice-on":"voice-off",a.ogreAgentSpeaking?"speaking":"silent",a.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=Qv(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),Fo()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=a.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),o!==null&&s!==null&&y.setSelectionRange(o,s),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const b=t.querySelector("[data-ogre-agent-feed]");b&&(e||u||a.ogreAgentLoading?b.scrollTop=b.scrollHeight:b.scrollTop=Math.min(i,Math.max(0,b.scrollHeight-b.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function ie(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};a.ogreAgentMessages=[...rn(),t].slice(-50),jv(),t.role==="assistant"&&Jd(t.text||"")}function Hl(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function Zv(){if(!Hl())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=n=>{const r=`${n.name||""} ${n.voiceURI||""}`.toLowerCase(),o=String(n.lang||"").toLowerCase();let s=0;return(/^en[-_]/.test(o)||o==="en")&&(s+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(s+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(s+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(s-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(s-=25),n.localService&&(s+=3),s};return e.slice().sort((n,r)=>t(r)-t(n))[0]||e[0]||null}let on=null;function ew(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!on||on.state==="closed")&&(on=new e),on.state==="suspended"&&on.resume(),on}catch{return null}}function Xd(e="reply"){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen)return;const t=ew();if(t)try{const n=t.currentTime,r=e==="online"?.22:.34,o=t.createGain(),s=t.createBiquadFilter(),c=t.createOscillator(),i=t.createOscillator(),u=t.createGain();o.gain.setValueAtTime(1e-4,n),o.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,n+.035),o.gain.exponentialRampToValueAtTime(1e-4,n+r),s.type="lowpass",s.frequency.setValueAtTime(210,n),s.frequency.exponentialRampToValueAtTime(92,n+r),s.Q.setValueAtTime(5.2,n),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,n),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,n+r),i.type="sine",i.frequency.setValueAtTime(e==="online"?45:38,n),i.frequency.exponentialRampToValueAtTime(e==="online"?35:31,n+r),u.gain.setValueAtTime(.18,n),u.gain.exponentialRampToValueAtTime(1e-4,n+r),c.connect(s),s.connect(o),i.connect(u),u.connect(o),o.connect(t.destination),c.start(n),i.start(n),c.stop(n+r+.02),i.stop(n+r+.02)}catch{}}function bt(e=!1){a.ogreAgentSpeaking=!!e,a.ogreAgentOpen&&O({force:!0})}function Oo(){if(!Hl()){bt(!1);return}try{window.speechSynthesis.cancel()}catch{}bt(!1)}function tw(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function Jd(e=""){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen||!Hl()){bt(!1);return}const t=tw(e);if(!t){bt(!1);return}try{window.speechSynthesis.cancel();const n=new window.SpeechSynthesisUtterance(t),r=Zv();r&&(n.voice=r),n.pitch=.72,n.rate=.86,n.volume=1,n.onstart=()=>bt(!0),n.onend=()=>bt(!1),n.onerror=()=>bt(!1),bt(!0),Xd("reply"),window.speechSynthesis.speak(n)}catch{bt(!1)}}function aw(e){a.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",a.ogreAgentVoiceEnabled?"on":"off")}catch{}a.ogreAgentVoiceEnabled?(a.ogreAgentStatus="Ogre voice on.",Xd("online"),Jd("Ogre voice online.")):(Oo(),a.ogreAgentStatus="Ogre voice muted."),O({force:!0})}function Yd(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function Qd(){return!!Yd()}async function Zd(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function ep(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();a.ogreAgentDraft=t;const n=document.querySelector("[data-ogre-agent-input]");if(n){n.value=t;try{n.focus({preventScroll:!0}),n.setSelectionRange(t.length,t.length)}catch{}}}function Eo(){Gt&&(clearTimeout(Gt),Gt=null),Ta&&(clearTimeout(Ta),Ta=null)}function tp(e,t=a.ogreAgentSpeechRecognizer){Ta&&clearTimeout(Ta),Ta=setTimeout(()=>{e!==Ye||a.ogreAgentSpeechRecognizer!==t||Dt("Mic timed out instead of staying open. Tap Mic again or type the command.")},_p)}function Dt(e=""){Ye+=1,Eo();const t=a.ogreAgentSpeechRecognizer;if(a.ogreAgentSpeechRecognizer=null,a.ogreAgentListening=!1,a.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(a.ogreAgentStatus=e),a.ogreAgentOpen&&O({force:!0})}async function nw(){if(!Qd()){const s=await Zd();a.ogreAgentStatus=s==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",O({force:!0});return}a.ogreAgentLoading&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),Oo(),Dt();const e=Ye;a.ogreAgentStatus="Checking microphone permission...",O({force:!0});const t=await Zd();if(e!==Ye||!a.ogreAgentOpen)return;if(t==="denied"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",O({force:!0});return}if(t==="unavailable"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="No microphone is available to this browser. Typing still works.",O({force:!0});return}const n=Yd(),r=new n,o=++Ye;a.ogreAgentSpeechRecognizer=r,a.ogreAgentListening=!0,a.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||a.ogreAgentDraft||"").trim(),a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Opening microphone...",O({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Gt=setTimeout(()=>{o!==Ye||a.ogreAgentSpeechRecognizer!==r||Dt("Mic did not start. Check browser permission, then tap Mic again.")},Np),r.onstart=()=>{o!==Ye||a.ogreAgentSpeechRecognizer!==r||(Gt&&(clearTimeout(Gt),Gt=null),a.ogreAgentListening=!0,a.ogreAgentStatus="Listening... speak your Ogre command.",tp(o,r),O({force:!0}))},r.onresult=s=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;tp(o,r);let c="",i="";for(let d=s.resultIndex||0;d<s.results.length;d+=1){const m=String(s.results[d]?.[0]?.transcript||"");s.results[d]?.isFinal?i+=` ${m}`:c+=` ${m}`}i.trim()&&(a.ogreAgentSpeechFinal=`${a.ogreAgentSpeechFinal||""} ${i}`.replace(/\s+/g," ").trim());const u=[a.ogreAgentSpeechBaseDraft,a.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();ep(u)},r.onerror=s=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;Eo();const c=String(s?.error||"");a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",O({force:!0})},r.onend=()=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;Eo();const s=String(a.ogreAgentDraft||"").trim(),c=!!(s&&a.ogreAgentSpeechFinal&&!a.ogreAgentLoading);a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",O({force:!0}),c&&setTimeout(()=>{ep(s),qt()},100)};try{r.start()}catch{Eo(),a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic could not start. Typing still works.",O({force:!0})}}function rw(){a.ogreAgentListening||a.ogreAgentSpeechRecognizer?Dt("Voice input stopped."):nw()}function Fo(){a.ogreAgentOpen=!1,a.ogreAgentStatus="",a.ogreAgentLoading=!1,a.ogreAgentRequestId="",Dt(),Oo(),O({force:!0})}function ow(e=""){const[t,n]=String(e).split(":");return rn()[Number(t)]?.actions?.[Number(n)]||null}function ap(){return Array.isArray(a.wallets)&&a.wallets.length>0}function np(){return!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.walletPublicKey||a.connectedWalletPublicKey)}function Wo(){return!!(!rp()&&(a.ogreAgentAutoTradeApproved||ap()||np()))}function sw(e="wallet-sync"){return rp()?!1:ap()||np()?(Vl(!0),!0):(Kl(),!1)}function rp(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Kl(){a.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function Vl(e,t={}){a.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),a.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function op(e){a.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",a.ogreAgentFastMode?"on":"off")}catch{}}function yt(e=""){const t=String(e||"").toLowerCase(),n=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),o=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return n?"buy":r||o?"sell":""}function lw(e=""){const t=String(e||"").toLowerCase(),n=yt(t);if(!n||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),o=n==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),s=!!(_t()||a.smartChartToken||a.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||n==="buy"&&s&&/\b(just\s+)?buy\b/.test(t);return!!(o&&c&&!r)}function iw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return n?Number(n):0}function zl(){const e=typeof Et=="function"?Et():null,t=Number(a.quickBuyAmountOverride||(typeof De=="function"?De(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function cw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=o?Math.round(Number(o)*100):0,c=[];return n&&c.push(`TP +${n}%`),r&&c.push(`SL -${r}%`),o&&c.push(`slippage ${o}%`),{takeProfitPct:n,stopLossPct:r,slippagePct:o,slippageBps:Number.isFinite(s)&&s>0?s:0,summary:c.join(" / ")}}function uw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(\d{1,3})\s*%/)||[])[1];return n||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function dw(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function pw(){const e=[],t=(r={})=>{const o=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();o&&e.push({tokenMint:o,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};a.smartChartToken&&t({tokenMint:a.smartChartToken,symbol:a.smartChartTokenSymbol}),a.tradeToken&&t({tokenMint:a.tradeToken,symbol:a.tradeTokenSymbol}),[a.livePairRows,a.slimeScopeRows,a.watchlist,a.positions,a.portfolioRows,a.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const n=new Set;return e.filter(r=>{const o=r.tokenMint.toLowerCase();return n.has(o)?!1:(n.add(o),!0)})}function mw(e=""){const t=String(e||"").trim(),n=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(n)return n;const r=t.toLowerCase();return pw().map(s=>{const c=s.symbol.toLowerCase(),i=s.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),i&&r.includes(i)&&(u+=8+Math.min(16,i.length)),{...s,score:u}}).filter(s=>s.score>0).sort((s,c)=>c.score-s.score)[0]?.tokenMint||""}function No(e={},t=""){const n={...e},r=yt(t);if(!n.tokenMint&&!n.mint&&!n.ca){const o=mw(t)||_t()||a.smartChartToken||a.tradeToken;o&&(n.tokenMint=o)}if(n.type==="confirm_buy"||r==="buy"){if(n.type=n.type||"confirm_buy",!n.amountSol){const s=iw(t)||zl();s>0&&(n.amountSol=s)}const o=cw(t);if(o.takeProfitPct&&!n.takeProfitPct&&(n.takeProfitPct=o.takeProfitPct),o.stopLossPct&&!n.stopLossPct&&(n.stopLossPct=o.stopLossPct),o.slippageBps&&!n.slippageBps&&(n.slippageBps=o.slippageBps),n.walletIndex===void 0){const s=dw(t);s!==void 0&&(n.walletIndex=s)}}return(n.type==="confirm_sell"||r==="sell")&&(n.type=n.type||"confirm_sell",n.percent=n.percent||uw(t)),n}function sp(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function lp(e={},t=""){if(!a.ogreAgentFastMode||!Wo()||e.requiresReview||e.conditional)return!1;const n=yt(t);return n?n==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:n==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function Ut(e={}){const t=String(e.type||""),n=String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||_t()||"").trim();if(t==="toggle_agent_fast_mode"){op(!a.ogreAgentFastMode),a.ogreAgentStatus=a.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",ie({role:"assistant",text:a.ogreAgentStatus,actions:[{label:a.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),O();return}if(t==="approve_agent_auto_trade"){Vl(!0),op(!0),a.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",ie({role:"assistant",text:`${a.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),O();return}if(t==="revoke_agent_auto_trade"){Vl(!1,{revoked:!0}),a.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",ie({role:"assistant",text:a.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),O();return}if(t==="open_tab"){a.route="terminal",a.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!n){a.ogreAgentStatus="Paste a token CA in the message first.",O();return}ft(fe(n,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){a.route="terminal",a.activeTab="positions",window.history.pushState({},"","/terminal"),a.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){z(()=>ut({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Wallet refresh started.",O();return}if(t==="refresh_feeds"){z(()=>Na({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Feed refresh started.",O();return}if(t==="open_wallet_connect"){la({returnPath:"/terminal"}),a.ogreAgentStatus="Wallet connect opened.",O();return}if(t==="start_clip_recording"){Ac(),a.ogreAgentStatus="REC started from Ogre Agent.",O();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim();if(!r){a.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",O();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(a.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),ja(fe(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),a.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",O();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||a.smartChartToken||a.tradeToken||_t()||"").trim(),o=Number(e.amountSol||e.sol||e.amount||zl()||0);if(!r||!Number.isFinite(o)||o<=0){r&&ja(fe(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),a.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",O();return}const s=e.walletIndex!==void 0?e.walletIndex:se()?.publicKey?"connected":a.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;a.ogreAgentLoading=!0,a.ogreAgentStatus=`Sending ${o} SOL buy request...`,O();try{const i=await no({tokenMint:r,walletIndex:s,amountSol:o,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});a.ogreAgentStatus=i?.ok===!1?i.error||i.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${sp(e)}`,typeof ut=="function"&&ut({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(i){a.ogreAgentStatus=i?.message||"Buy failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim(),o=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){a.activeTab="positions",a.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}a.ogreAgentLoading=!0,a.ogreAgentStatus=`Preparing sell ${o}%...`,O();try{await oo(r,o,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),a.ogreAgentStatus=`Sell ${o}% submitted. Refreshing wallet and positions in the background.`,typeof ut=="function"&&ut({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(s){a.ogreAgentStatus=s?.message||"Sell failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){a.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",O();return}window.open(r,"_blank","noopener,noreferrer"),a.ogreAgentStatus="Opened trusted coin link.",O();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=Io(String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||_t()||"").trim());if(!r){a.ogreAgentStatus="Paste a token CA and ask me to check it.",O();return}const o=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};a.ogreAgentLoading=!0,a.ogreAgentStatus="Checking coin details...",O();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},i=c.symbol||c.baseSymbol||v(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,m=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",b=c.telegramUrl||c.links?.telegram||"",S=o(c.liquidityUsd||c.liquidity?.usd),T=o(c.marketCap||c.fdv||c.marketCapUsd),A=o(c.volume24h||c.volume?.h24||c.volume?.m5),g=[`${i} breakdown`,`${u} | ${v(r)}`,`MC/FDV: ${T} | Liquidity: ${S} | Volume: ${A}`,`Socials: X ${y?"found":"not returned"} | Telegram ${b?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],P=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];m&&P.push({label:"Pump",type:"open_external",url:m}),f&&P.push({label:"Website",type:"open_external",url:f}),y&&P.push({label:"X",type:"open_external",url:y}),b&&P.push({label:"Telegram",type:"open_external",url:b}),ie({role:"assistant",text:g.join(`
`),actions:P}),a.ogreAgentStatus="Coin breakdown ready."}catch(s){ie({role:"assistant",text:`I could not pull live metadata for ${v(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),a.ogreAgentStatus=s?.message||"Coin check delayed."}finally{a.ogreAgentLoading=!1,O()}return}a.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",O()}function fw(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function jl(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function ip(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function hw(e="",t=[]){const n=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(o=>String(o||"").trim()).filter((o,s,c)=>o&&c.findIndex(i=>i.toLowerCase()===o.toLowerCase())===s).slice(0,4),r=n.length?n.map(o=>`"${o.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function gw(e=""){if(!ip(e))return null;const t=Io(jl(e)||_t()||a.smartChartToken||a.tradeToken||"");return t?{text:[`${v(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:hw(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function bw(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function yw(e=""){if(!bw(e))return null;const t=jd().slice(0,4),n=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((s,c)=>{const i=s.symbol||v(s.tokenMint),u=Number.isFinite(Number(s.ageMinutes))?`${Math.max(0,Math.round(Number(s.ageMinutes)))}m old`:"age n/a",d=s.twitterUrl||s.telegramUrl||s.websiteUrl?"socials found":"socials not returned",m=Array.isArray(s.riskFlags)&&s.riskFlags.length?`risk: ${s.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${i} ${v(s.tokenMint)} | MC ${n(s.marketCap)} | Liq ${n(s.liquidityUsd)} | Vol ${n(s.volume5m||s.volume1h)} | ${u} | ${d} | ${m}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],o=t[0];return{text:r.join(`
`),actions:[o?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:o.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const vw=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],ww=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function Sw(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||jl(e)||yt(e))return null;const n=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(n){const o=Jn(n[1]);if(o)return a.quickBuyAmountOverride=o,So(),{text:`Quick buy set to ${o} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=ww.test(t);for(const[o,s]of vw)for(const c of s){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${kw(o)} now.${o==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:o},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function kw(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const $w={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function cp(e){a.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},_o()}function Le(e,t="ok",n=""){if(!a.tradeTrace||a.tradeTrace.done&&t==="pending")return;const r=a.tradeTrace.steps,o=r.find(i=>i.key===e),s=o||{key:e,label:$w[e]||e};if(s.status=t,s.detail=String(n||"").slice(0,140),o||r.push(s),t==="fail"&&(a.tradeTrace.done=!0),_o(),t==="fail")return;r.length>=3&&r.every(i=>i.status==="ok")&&(a.tradeTrace.done=!0,window.setTimeout(()=>{a.tradeTrace?.done&&!a.tradeTrace.steps.some(i=>i.status==="fail")&&(a.tradeTrace=null,_o())},8e3))}function _o(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=a.tradeTrace;if(!t){e.innerHTML="";return}const n=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
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
  `}async function qt(e=""){const t=document.querySelector("[data-ogre-agent-input]"),n=String(e||t?.value||"").trim();if(!n||a.ogreAgentLoading)return;const r=jl(n);if(r&&Io(r),t&&(t.value=""),a.ogreAgentDraft="",ie({role:"user",text:n,actions:[]}),lw(n)){const i=yt(n),u=No({type:i==="buy"?"confirm_buy":"confirm_sell"},n),d=String(u.tokenMint||u.mint||u.ca||"").trim(),m=Number(u.amountSol||u.sol||u.amount||0);if(!d){ie({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),a.ogreAgentStatus="Need token CA.",O({force:!0});return}if(i==="buy"&&(!Number.isFinite(m)||m<=0)){ie({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),a.ogreAgentStatus="Need buy amount.",O({force:!0});return}if(!Wo()){ie({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),a.ogreAgentStatus="Wallet session needed.",O({force:!0});return}ie({role:"assistant",text:i==="buy"?`Sending ${m} SOL buy for ${v(d)}.${sp(u)}`:`Sending sell request for ${v(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),a.ogreAgentStatus="Fast Mode: sending trade request...",O({force:!0}),await Ut(u);return}const o=Sw(n);if(o){ie({role:"assistant",text:o.text,actions:o.actions||[]}),a.ogreAgentStatus="Instant local reply.",O({force:!0}),o.run&&await Ut(o.run);return}a.ogreAgentLoading=!0,a.ogreAgentStatus="",ee("chatRequestStarted");const s=`${Date.now()}:${Math.random().toString(16).slice(2)}`;a.ogreAgentRequestId=s;const c=setTimeout(()=>{a.ogreAgentRequestId!==s||!a.ogreAgentLoading||(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Agent reply timed out.",ee("chatRequestTimedOut"),ie({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:n,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),O({force:!0}))},7500);O();try{const i=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:n,context:Gv()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(a.ogreAgentRequestId!==s)return;const u=(i?.agent?.actions||[]).map(S=>No(S,n));i?.agent?.tokenMint&&Io(i.agent.tokenMint),ie({role:"assistant",text:i?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),ee("chatRequestSucceeded");const d=!!(i?.agent?.coinEnriched||i?.agent?.tokenMint||i?.agent?.socialLinks||i?.agent?.socialScan),f=!ip(n)&&!d&&!yt(n)&&fw(n)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||No({type:"coin_breakdown"},n):null;if(f?.tokenMint||f?.mint||f?.ca){a.ogreAgentStatus="Checking coin now...",await Ut(f);return}const y=No({type:yt(n)==="buy"?"confirm_buy":yt(n)==="sell"?"confirm_sell":""},n);if(yt(n)&&a.ogreAgentFastMode&&!Wo()){ie({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),a.ogreAgentStatus="Auto-Trade approval needed once.";return}const b=u.find(S=>lp(S,n))||(lp(y,n)?y:null);if(b){a.ogreAgentStatus="Fast Mode: sending trade request...",await Ut(b);return}a.ogreAgentStatus=i?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(i){if(a.ogreAgentRequestId!==s)return;const u=gw(n);if(u){ie({role:"assistant",text:u.text,actions:u.actions}),a.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=yw(n);if(d){ie({role:"assistant",text:d.text,actions:d.actions}),a.ogreAgentStatus="Fast local trend scan.";return}ie({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:n,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),ee("chatRequestFailed"),a.ogreAgentStatus=i?.message||"Agent reply failed."}finally{clearTimeout(c),a.ogreAgentRequestId===s&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,O())}}function R(e,t){return`<article class="empty"><h3>${l(e)}</h3><p>${l(t)}</p></article>`}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ve(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function Tw(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function up(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const n=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");n&&(e.preventDefault(),Tw(n),Ei({connectPanel:n.matches("[data-connect-login-toggle]")||a.route==="connect",source:n.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(Pm(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),qt();return}const n=e.target?.closest?.("[data-global-token-search]");if(n&&e.key==="Enter"){e.preventDefault(),Eu(n.value||"");return}if(e.key==="Escape"){if(a.ogreAgentOpen){Fo();return}if(a.slimeShieldDetails?.open){wd();return}if(a.kolDumpDetails?.open){sl();return}if(a.replayDetails?.open){Bl();return}if(a.protectedBuyModal?.open){ao();return}if(!(!a.loginModalOpen&&!a.quickBuyModal?.open)){if(a.quickBuyModal?.open){gl();return}Ii()}}});function Gl(e=null,t="interaction"){const n=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!n)return!1;const r=n.dataset.tokenTrade||n.dataset.tokenChart||n.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),i=Number(a.smartChartInteractionPrefetchAt||0),u=a.smartChartInteractionPrefetchSeen||{};if(i&&c-i<sy||Number(u[r]||0)&&c-Number(u[r])<cy)return!1;const d=(a.smartChartInteractionPrefetchRecent||[]).filter(m=>c-Number(m||0)<ly);if(d.length>=iy)return a.smartChartInteractionPrefetchRecent=d,!1;a.smartChartInteractionPrefetchAt=c,a.smartChartInteractionPrefetchRecent=[...d,c],a.smartChartInteractionPrefetchSeen={...u,[r]:c}}return Sl(fe(r,{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t}),{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Gl(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Gl(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Gl(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const dp=new WeakMap;function Pw(e){let t=dp.get(e);if(!t){const n=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(n.overflowY),contained:/contain|none/.test(n.overscrollBehaviorY)},dp.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||a.route!=="terminal"||En())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const n=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const s=Pw(t);if(s.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,i=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(n<0&&c||n>0&&i)||s.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let o=e.deltaY;e.deltaMode===1?o*=40:e.deltaMode===2&&(o*=r.clientHeight),r.scrollTop+=o,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),wd();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),ao();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),sl();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),Bl();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const g=c.closest(".nav-tool-group");a.navTekOpen=!g?.open,Yp(a.navTekOpen),g&&(g.open=a.navTekOpen);return}const i=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!i)return;if(i.matches("[data-tool-section]")){e.preventDefault();const g=i.dataset.toolSection,[P]=g.split(":"),L=g.slice(P.length+1);a.toolSections={...a.toolSections||{},[P]:L};const B=i.closest("[data-tool-panels]");B&&(B.querySelectorAll(`[data-tool-section^="${P}:"]`).forEach(D=>{D.dataset.active=D.dataset.toolSection===g?"true":"false"}),B.querySelectorAll(`[data-tool-panel^="${P}:"]`).forEach(D=>{D.hidden=D.dataset.toolPanel!==g}),Wr(B));return}if(i.matches("[data-clip-record]")){e.preventDefault(),a.clipFarm?.recording?On():Ac();return}if(i.matches("[data-clip-share]")){e.preventDefault(),bf();return}if(i.matches("[data-clip-download]")){e.preventDefault(),yf();return}if(i.matches("[data-clip-clear]")){e.preventDefault(),_s();return}if(i.matches("[data-slimeshield-details]")){e.preventDefault(),Gy(i.dataset.slimeshieldDetails||"");return}if(i.matches("[data-slimeshield-refresh]")){e.preventDefault(),Sd(i.dataset.slimeshieldRefresh||"",{force:!0});return}if(i.matches("[data-kol-dump-details]")){e.preventDefault(),Pg(i.dataset.kolDumpDetails||"");return}if(i.matches("[data-kol-dump-refresh]")){e.preventDefault(),ol({force:!0});return}if(i.matches("[data-replay-open]")){e.preventDefault(),av(i.dataset.replayOpen||"");return}if(i.matches("[data-replay-refresh]")){e.preventDefault(),xl(i.dataset.replayRefresh||"",{force:!0});return}if(i.matches("[data-ogre-agent-toggle]")){a.ogreAgentOpen?Fo():(a.ogreAgentOpen=!0,Ff(),O({force:!0}));return}if(i.matches("[data-ogre-agent-close]")){Fo();return}if(i.matches("[data-ogre-agent-voice]")){aw(!a.ogreAgentVoiceEnabled);return}if(i.matches("[data-ogre-agent-send]")){Dt(),qt();return}if(i.matches("[data-ogre-agent-mic]")){rw();return}if(i.matches("[data-ogre-agent-quick]")){const g=i.dataset.ogreAgentQuick||"";if(g==="positions"&&Ut({type:"open_tab",tab:"positions"}),g==="refresh_feeds"&&Ut({type:"refresh_feeds"}),g==="risk"&&qt("Why is this token risky?"),g==="dev_info"&&qt("Explain Dev Info for this token."),g==="protected_buy"&&qt("Should I use Protected Buy?"),g==="replay"&&qt("Replay similar launches for this token."),g==="auto_trade"&&Ut({type:"approve_agent_auto_trade"}),g==="clear_chat"){Dt(),Oo(),a.ogreAgentMessages=[zd()],a.ogreAgentStatus="Chat cleared.",a.ogreAgentDraft="",a.ogreAgentLastTokenMint="";try{localStorage.removeItem(Ul),localStorage.removeItem(ql)}catch{}O({force:!0})}return}if(i.matches("[data-ogre-agent-retry]")){const g=Number(i.dataset.ogreAgentRetry),P=String(a.ogreAgentMessages?.[g]?.retryText||"").trim();P&&qt(P);return}if(i.matches("[data-ogre-agent-action]")){const g=i.dataset.ogreAgentAction,L=ow(g)||(a.ogreAgentMessages||[]).flatMap(B=>Array.isArray(B.actions)?B.actions:[]).find(B=>B.key===g||B.label===g||B.type===g);Ut(L||{type:g});return}if(i.matches("[data-nav-route]")){e.preventDefault(),xe(i.dataset.navRoute||"/terminal",i.dataset.tab||null);return}if(i.matches("[data-policy]")){e.preventDefault(),window.alert(Sm(i.dataset.policy==="privacy"?"privacy":"terms"));return}if(i.matches("[data-top-wallet-connect]")){e.preventDefault(),i.dataset.walletState==="connected"||!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length)?xe("/terminal","wallets"):la({returnPath:"/terminal"});return}if(i.matches("[data-top-wallet-status]")){e.preventDefault(),await Pf();return}if(i.matches("[data-top-refresh-wallet]")){const g=C();Ia("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:"top-refresh-wallet"}),ut({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{Ng()&&z(()=>il())}).catch(P=>$(P.message));return}if(i.matches("[data-ogre-tek-refresh]")){await tr({force:!0}).catch(g=>$(g.message));return}if(i.matches("[data-ogre-ai-start]")){z(()=>vb());return}const u=i.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),a.ogreAiCategory=u.dataset.ogreCat||"super_fresh",h({force:!0});return}if(i.closest?.("[data-autopilot-save]")){e.preventDefault(),z(()=>kb());return}if(i.matches("[data-ogre-tek-market]")){a.ogreTek.selectedMarket=i.dataset.ogreTekMarket||a.ogreTek.selectedMarket,a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-side]")){a.ogreTek.direction=i.dataset.ogreTekSide==="short"?"short":"long",a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-review]")){Ro(),a.ogreTek.reviewOpen=!0,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-close-review]")){a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-confirm-review]")){Ro();const g=Hd();!a.ogreTek.riskAccepted||!g.ok?a.ogreTek.status="Risk confirmation is incomplete.":Se.demoMode?(a.ogreTek.status="Demo review confirmed. No live transaction was submitted.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1):(a.ogreTek.status="Live perps adapter is not wired in this build.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1),h({force:!0});return}if(i.matches("[data-ogre-tek-demo-action]")){const g=i.dataset.ogreTekDemoAction||"action";a.ogreTek.status=`Demo mode: ${g.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(i.matches("[data-toggle-terminal-ticket]")){a.terminalTradeCollapsed=!a.terminalTradeCollapsed,h({force:!0});return}if(i.matches("[data-global-token-open]")){const g=p("[data-global-token-search]")?.value?.trim()||"";g&&Eu(g);return}if(i.matches("[data-token-chart]")){e.preventDefault();const g=i.dataset.tokenChart||i.dataset.previewToken||"";ft(fe(i.dataset.tokenChart||i.dataset.previewToken||"",{source:i.dataset.tokenChartSource||"token-card"}),{defaultTab:i.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!i.closest?.(".live-pair-avatar"),source:i.dataset.tokenChartSource||"token-card"});return}if(i.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const g=i.dataset.tokenTrade||"",P=Ga(g);P&&io(P)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),ft(fe(i.dataset.tokenTrade||"",{source:i.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:i.dataset.tokenTradeSource||"trade-button"});return}if(i.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),ja(fe(i.dataset.quickBuyToken||"",{source:i.dataset.quickBuySource||"quick-buy-button"}),{source:i.dataset.quickBuySource||"quick-buy-button"});return}if(i.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation();const g=i.dataset.protectedBuySource||"protected-buy",P=!!i.closest("[data-quick-buy-modal-root]"),L=!!i.closest(".chart-trade-panel"),B=i.dataset.protectedBuyOpen||a.quickBuyModal?.tokenMint||a.smartChartToken||a.tradeToken||"";Bb(fe(B,{source:g}),{source:g,presetId:i.dataset.protectedBuyPreset||"",amountSol:P?p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||"":L&&p("[data-chart-buy-amount]")?.value||"",walletIndex:P?p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"":L&&p("[data-chart-buy-wallet]")?.value||"",slippageBps:P?p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400":L&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-quick-buy-close]")){e.preventDefault(),gl();return}if(i.matches("[data-protected-buy-close]")){e.preventDefault(),ao();return}if(i.matches("[data-protected-buy-confirm]")){e.preventDefault(),z(()=>Ob());return}if(i.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),a.quickBuyModal={...a.quickBuyModal,amountSol:i.dataset.quickBuyModalPreset||"",status:`${i.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(i.matches("[data-quick-buy-confirm]")){e.preventDefault(),z(()=>Wb());return}if(i.matches("[data-preview-token]")){const g=i.dataset.previewToken||"";g&&ft(fe(g,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(i.matches("[data-terminal-subtab]")){a.terminalSubtab=i.dataset.terminalSubtab||"positions",h();return}if(i.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await oo(i.dataset.positionSell||"",i.dataset.positionSellPercent||"100",{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const g=await Pe({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});g&&await oo(i.dataset.positionSellCustom||"",g,{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-run-tx-audit]")){e.preventDefault(),z(()=>Nb());return}if(i.matches("[data-connect-login-toggle]")){up(i)||Fi({connectPanel:!0,source:"connect-lock-in"});return}if(i.matches("[data-login-tab]")){a.loginModalTab=i.dataset.loginTab==="create"?"create":"login",h({force:!0}),Ri(!1);return}if(i.matches("[data-connect-password-login]")){await zi();return}if(i.matches("[data-send-email-code]")){await Nm();return}if(i.matches("[data-web-code-login]")){await _m();return}if(i.matches("[data-connect-create-account]")){await As();return}if(i.matches("[data-connect-create-wallet]")){await Km();return}if(i.matches("[data-web-signup]")&&await As(),i.matches("[data-web-password-login]")&&await zi(),i.matches("[data-close-login]")){Ii();return}if(i.matches("[data-web-signup-connect]")){await Hm();return}if(i.matches("[data-open-login]")){up(i)||Fi({connectPanel:a.route==="connect",source:"top-lock-in"});return}if(i.matches("[data-browse-guest]")){a.loginCollapsed=!0,a.route="terminal",a.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Tr("browse-terminal");return}if(i.matches("[data-logout]")&&await Vm(),i.matches("[data-connect-x]")&&await Jg(),i.matches("[data-open-x-login]")&&Yg(),i.matches("[data-clear-x]")&&await Qg(),i.matches("[data-save-login-credentials]")&&await ab(),i.matches("[data-save-referral]")&&await _u(),i.matches("[data-generate-referral-code]")&&await _u({generate:!0}),i.matches("[data-save-trader-board]")&&await Hb(),i.matches("[data-use-x-avatar]")&&await tb(),i.matches("[data-clear-avatar]")&&await Gr({clear:!0},"Removing PFP..."),i.matches("[data-preset-avatar]")){const g=p("[data-avatar-status]");w(g,"Loading preset PFP...");try{const P=await eb(i.dataset.presetAvatar);await Gr({avatarDataUrl:P,avatarSource:i.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(P){w(g,P.message),$(P.message)}}if(i.matches("[data-launch-coin-save]")){nl();return}if(i.matches("[data-launch-coin-submit]")){await vg();return}if(i.matches("[data-launch-coin-use-ca]")){await yg();return}if(i.matches("[data-connect-wallet]")){const g=i.dataset.connectWallet||"solana";if(g&&g!=="solana"){await gu(g,{returnPath:"/terminal"});return}la({returnPath:"/terminal"});return}if(i.matches("[data-connect-wallet-provider]")){await gu(i.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(i.matches("[data-wallet-connect-close]")){a.walletConnectMenuOpen=!1,h({force:!0});return}if(i.matches("[data-wallet-fast-approvals-toggle]")){ah(!a.walletFastApprovalsEnabled),$(a.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(i.matches("[data-disconnect-wallet]")){await bu();return}if(i.matches("[data-share-x]")&&ul(i.dataset.shareText||""),i.matches("[data-share-watch-token-btn]")&&yu("token"),i.matches("[data-share-watch-kol-btn]")&&yu("kol"),i.matches("[data-save-preset]")){await Wu(i.dataset.savePreset);return}if(i.matches("[data-save-fast-preset]")){await Wu(i.dataset.saveFastPreset,"fast");return}if(i.matches("[data-use-preset]")){Ub(i.dataset.usePreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-preset]")){Nu(i.dataset.editPreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-selected-preset]")){const g=i.dataset.editSelectedPreset==="bundle"?"bundle":"trade",P=g==="bundle"?a.selectedBundlePresetId:a.selectedTradePresetId;P&&P!=="custom"?Nu(g,P):Rl(g);return}if(i.matches("[data-cancel-preset-edit]")){Er(i.dataset.cancelPresetEdit,""),h();return}if(i.matches("[data-delete-preset]")){await qb(i.dataset.deletePreset,i.dataset.presetId||"");return}if(i.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),ja(fe(i.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(i.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),z(()=>Fu(i.dataset.quickBundleToken||""));return}if(i.matches("[data-smart-chart-token]")){ft(fe(i.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(i.matches("[data-smart-chart-view]")){const g=i.dataset.smartChartView||"chart";a.smartChartView=["chart","chartTxns","txns","info"].includes(g)?g:"chart",h();return}if(i.matches("[data-chart-trade-tab]")){a.chartTradeTab=i.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),a.chartTradeTab==="buy"&&requestAnimationFrame(()=>p("[data-chart-buy-amount]")?.focus());return}if(i.matches("[data-chart-buy-preset]")){const g=p("[data-chart-buy-amount]");g&&(g.value=i.dataset.chartBuyPreset||""),a.quickBuyAmountOverride=j(i.dataset.chartBuyPreset||""),So();return}if(i.matches("[data-chart-confirm-buy]")){const g=i.dataset.chartConfirmBuy||a.smartChartToken||"";e.preventDefault(),e.stopPropagation();const P=p("[data-chart-buy-wallet]")?.value||"";if(le(P)){try{i.dataset.actionState="clicked",i.disabled=!0,await Fb(g)}catch(L){const B=N(L.message||"Chart buy failed."),D=j(p("[data-chart-buy-amount]")?.value||"")||"custom";q("trade-buy",g,String(D),{state:"error",error:B}),Te("trade-buy",g,String(D),4e3),Oe(B),$(B),oe()}return}Oe("Buy queued. Opening wallet approval..."),i.dataset.actionState="clicked",i.disabled=!0,z(async()=>{try{const L=Lu();await no({tokenMint:g,walletIndex:P,amountSol:j(p("[data-chart-buy-amount]")?.value||""),slippageBps:p("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:L.takeProfitPct,stopLossPct:L.stopLossPct,sellDelay:L.sellDelay,sellPercent:L.sellPercent,source:"chart-buy-panel"}),a.chartTradeTab="buy",Oe("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(L){const B=N(L.message||"Chart buy failed.");Oe(B),$(B),h({force:!0,preserveSmartChartFrame:!0})}});return}if(i.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const g=p("[data-chart-sell-percent]")?.value||"";if(g)try{await oo(i.dataset.chartConfirmSell||"",g,{slippageBps:p("[data-chart-buy-slippage]")?.value||"400"})}catch(P){const L=N(P.message||"Chart sell failed.");Oe(L),$(L)}return}if(i.matches("[data-smart-chart-open]")){const g=String(p("[data-smart-chart-input]")?.value||"").trim();if(!g){$("Paste a token CA first.");return}ft(fe(g,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(i.matches("[data-refresh-feeds]")){z(()=>Na({force:!0,reason:"manual-refresh-feeds"}));return}if(i.matches("[data-terminal-load-more]")){const g=i.dataset.terminalLoadMore||a.activeTab;Xm(g,Ct(g)),oc(g,{requestId:K(g).lastRequestId||"",status:K(g).lastStatus||"render",reason:"load-more",resultCount:Ct(g),renderedCount:Tn(g),hasMore:Ct(g)>Tn(g),stale:Pn(g),errorCode:K(g).errorCode||"",errorMessage:K(g).errorMessage||""}),h({force:!0});return}if(i.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),Yy(i.dataset.devInfo||"");return}if(i.matches("[data-dev-info-close]")){Qy();return}if(i.matches("[data-dev-info-refresh]")){const g=i.dataset.devInfoRefresh||a.devInfoDetails?.tokenMint||"";await Pd(g,{force:!0});return}if(i.matches("[data-watch-token]")&&await Du("add",i),i.matches("[data-unwatch-token]")&&await Du("remove",i),i.matches("[data-pnl-card]"))try{await wu(i.dataset.pnlCard)}catch(g){$(g.message)}if(i.matches("[data-share-pnl-card]")&&await nb(i.dataset.sharePnlCard,i.dataset.shareText||""),i.matches("[data-push-enable]")){await zf();return}if(i.matches("[data-push-disable]")){await jf();return}if(i.matches("[data-call-post]")){await uv(i.dataset.callPost);return}if(i.matches("[data-telegram-link]")){await Kf();return}if(i.matches("[data-trade-trace-close]")){a.tradeTrace=null,_o();return}if(i.matches("[data-launch-kit-close]")){a.launchShareKit=null,h();return}if(i.matches("[data-create-wallets]")&&await Rg(),i.matches("[data-distribute-fresh]")){await jh();return}if(i.matches("[data-return-funds]")){await zh();return}if(i.matches("[data-sweep-background-wallets]")){await Xb();return}if(i.matches("[data-create-automation-wallet]")&&await Ig(),i.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await Fg(i);return}if(i.matches("[data-tpsl-status-button]")){i.dataset.tpslState==="enabled"?(a.activeTab="profile",xe("/terminal","profile"),a.automationDelegationStatus=a.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await ll("enable");return}if(i.matches("[data-automation-permission]")&&await ll(i.dataset.automationPermission||"enable"),i.matches("[data-run-trade-plans]")&&await il(),i.matches("[data-restore-backup]")&&await Ug(),i.matches("[data-export-backup]")&&await qg(),i.matches("[data-import-wallet]")&&await Hg(),i.matches("[data-remove-wallet]")&&await Kg(i.dataset.removeWallet||"",i.dataset.walletLabel||""),i.matches("[data-wallet-sweep-action]")&&await Gg(i.dataset.walletSweepAction||""),i.matches("[data-download]")){const g=a.downloads?.[i.dataset.download];g&&pe(g.filename,g.text)}if(i.matches("[data-trade-buy-quick]")&&await Yr(i.dataset.tradeBuyQuick),i.closest?.("[data-swap-reverse]")){a.swapDirection=a.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(i.matches("[data-swap-use-custom-amount]")){const g=String(p("[data-swap-amount]")?.value||"").trim();a.swapDirection==="sell"?await pl(g||"100"):await Yr(g);return}i.matches("[data-trade-buy-max]")&&await Yr(null,"max"),i.matches("[data-trade-buy-custom]")&&await Yr(p("[data-buy-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-sell-quick]")&&await pl(i.dataset.tradeSellQuick),i.matches("[data-trade-sell-custom]")&&await pl(p("[data-sell-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-plan-start]")&&await mb(),i.matches("[data-volume-start]")&&await hb();const d=i.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),a.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(g=>{g.dataset.active=String(g===d)});return}const m=i.closest?.("[data-vbot-set-aggr]");if(m){e.preventDefault(),a.slimeBotAggr=m.dataset.vbotSetAggr||"med",m.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(g=>{g.dataset.active=String(g===m)});return}const f=i.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),a.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(g=>{g.dataset.active=String(g===f)});return}if(i.matches("[data-vbot-start]")){e.preventDefault(),await eg();return}const y=i.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await tg(y.dataset.vbotStop||"");return}if(i.matches("[data-sniper-buy]")&&await bb(i.dataset.sniperBuy),i.matches("[data-kol-mode]")){a.kolWallet="",a.kolMode=i.dataset.kolMode||a.kolMode,J("kol"),await Y("kol",{force:!0,reason:"kol-mode-switch"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-refresh]")){await Y("kol",{force:!0,reason:"manual-kol-refresh"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-wallet-scan]")){if(a.kolWallet=String(p("[data-kol-wallet]")?.value||"").trim(),a.kolWallet&&!Bt(a.kolWallet)){Ot("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),a.kolWallet="";return}J("kol"),await Y("kol",{force:!0,reason:"kol-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-scan-wallet]")){if(a.kolWallet=String(i.dataset.kolScanWallet||"").trim(),a.kolWallet&&!Bt(a.kolWallet)){Ot("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),a.kolWallet="";return}J("kol"),await Y("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-copy-setup]")){const g=String(i.dataset.kolCopySetup||"").trim();if(g&&!Bt(g)){Ot("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}g&&(a.kolWallet=g),a.activeTab="kol",h(),setTimeout(()=>{const P=document.querySelector("[data-kol-management-settings]");P&&(P.open=!0,P.scrollIntoView({behavior:"smooth",block:"start"}));const L=p("[data-kol-wallet]");L&&g&&(L.value=g);const B=p("[data-kol-status]");B&&w(B,`Copy setup loaded for ${v(g)}. Choose presets, then tap Copy Wallet Next Buy.`),p("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(i.matches("[data-kol-copy]")){await Pb(i.dataset.kolCopy);return}if(i.matches("[data-kol-copy-wallet]")){const g=String(i.dataset.kolCopyWallet||"").trim();if(g&&!Bt(g)){Ot("That KOL entry does not have a verified Solana wallet yet.");return}await Ab(i.dataset.kolCopyWallet||"");return}if(i.matches("[data-kol-trade]")){a.tradeToken=i.dataset.kolTrade||"",a.activeTab="trade",h();return}if(i.matches("[data-kol-bundle]")){a.bundleToken=i.dataset.kolBundle||"",a.activeTab="bundle",h();return}if(i.matches("[data-bundle-buy]")&&await Ru("buy"),i.matches("[data-bundle-sell]")&&await Ru("sell"),i.matches("[data-bundle-plan]")&&await Lb(),i.matches("[data-launch-start]")&&await Vb(),i.matches("[data-launch-cancel]")&&await zb(i.dataset.launchCancel),i.matches("[data-use-token]")&&(a.tradeToken=i.dataset.useToken||"",a.volumeToken=i.dataset.useToken||"",a.bundleToken=i.dataset.useToken||"",a.activeTab="trade",h()),i.matches("[data-use-token-bundle]")&&(a.bundleToken=i.dataset.useTokenBundle||"",a.tradeToken=a.bundleToken,a.volumeToken=a.bundleToken,a.activeTab="bundle",h()),i.matches("[data-use-token-volume]")&&(a.volumeToken=i.dataset.useTokenVolume||"",a.tradeToken=a.volumeToken,a.bundleToken=a.volumeToken,a.activeTab="volume",h()),i.matches("[data-refresh-all]")){const g=C();if(Ia("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:a.activeTab||"terminal"}),!a.user||!a.token)He(a.activeTab)?await Y(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(P=>$(P.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),Ue("success");else{const P=C();a.activeTab==="positions"?Gm({force:!0,reason:"manual-positions-refresh"}).catch(L=>{Ue("error",{error:N(L?.message||"Position refresh failed")}),$(L.message),h()}):(ut({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(L=>$(L.message)),Y(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(L=>$(L.message))),U("position-refresh-request-start",P,{component:"positions",cacheHit:!1,details:a.activeTab||"terminal"})}}if(i.matches("[data-tab]")){const g=C();if(a.activeTab=i.dataset.tab,a.activeTab==="volume"&&_r(),a.activeTab==="ogreAi"&&wb(),a.activeTab==="ogreTek"){a.route="terminal",window.history.pushState({},"","/ogre-tek"),await tr({silent:!0}).catch(B=>$(B.message)),h();return}a.route!=="terminal"&&(a.route="terminal",window.history.pushState({},"","/terminal")),a.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):a.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const P=rc(a.activeTab);h();const L=Y(a.activeTab,{silent:!0,ifStale:!0,force:!P,reason:"tab-switch"}).catch(B=>$(B.message));P||await L,U("tab-switch",g,{component:"terminal",cacheHit:P,details:a.activeTab})}if(i.matches("[data-refresh-scan]")&&z(()=>Y("sniper",{force:!0,reason:"manual-sniper-refresh"})),i.closest?.("[data-refresh-live-pairs]")){const g=a.activeTab==="slimeScope"?"slimeScope":a.activeTab==="terminal"?"terminal":a.activeTab==="launch"||a.activeTab==="launchCoin"?"launch":"live",L=a.activeTab==="live"||a.activeTab==="terminal"?null:qs();z(async()=>{await Y(g,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),L&&Hs(L)})}if(i.closest?.("[data-terminal-filter-toggle]")){const g=Ce();g.open=!g.open,h();return}if(i.closest?.("[data-terminal-filter-clear]")){a.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},J("live"),J("launch"),J("sniper"),h();return}i.matches("[data-refresh-watchlist]")&&z(()=>Y("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=i.closest?.("[data-live-pair-bucket]");S&&(a.livePairBucket=S.dataset.livePairBucket||"live",a.livePairs=We(),a.livePairsLastUpdatedAt=oa(),J("live"),J("slimeScope"),h(),z(()=>Y(a.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const T=i.closest?.("[data-slime-scope-mode]");T&&(a.slimeScopeMode=T.dataset.slimeScopeMode||"new",a.activeTab="slimeScope",J("slimeScope"),h(),z(()=>Y("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),i.matches("[data-scan-mode]")&&(J("sniper"),a.scanMode=i.dataset.scanMode||a.scanMode,h(),z(()=>Ln(a.scanMode)));const A=i.getAttribute("data-copy");if(A){const g=i.getAttribute("data-copy-label")||i.textContent||"Copy";await navigator.clipboard.writeText(A),w(i,"Copied"),setTimeout(()=>{w(i,g)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(a.replayDetails?.open){Bl();return}if(a.kolDumpDetails?.open){sl();return}if(a.protectedBuyModal?.open){ao();return}if(a.quickBuyModal?.open){gl();return}if(a.walletConnectMenuOpen){a.walletConnectMenuOpen=!1,h({force:!0});return}a.loginCollapsed||(a.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const n=document.querySelector("[data-vbot-manual-wallets]");n&&(n.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(a.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(a.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const n=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(o=>{o.style.display=n?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=n||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(Wr(),Hh(t)),t?.matches?.("[data-swap-from]")){const n=Re(t.value||"SOL")||"SOL";a.tradeSwapFrom=n,n!=="SOL"?(a.tradeToken=n,a.tradeSwapTo="SOL"):Re(a.tradeSwapTo||a.tradeToken||"")||(a.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const n=Re(t.value||"");if(a.tradeSwapTo=n,n&&n!=="SOL"){a.tradeToken=n,a.swapDirection="buy";const r=p("[data-trade-token]");r&&(r.value=n)}n||p("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){a.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const n=t.value||"";if(n==="custom"){Rl("trade");return}if(a.selectedTradePresetId=n,a.fastTradePresetStatus=a.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=ae("trade",a.selectedTradePresetId);a.chartBuyWalletIndex="",r?.amountSol&&(a.quickBuyAmountOverride=j(r.amountSol)),a.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(a.quickBuyAmountOverride=j(t.value),t.value=a.quickBuyAmountOverride,So()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(a.protectedBuyModal={...a.protectedBuyModal||{},presetId:p("[data-protected-buy-preset]")?.value||a.protectedBuyModal?.presetId||"conservative",walletIndex:p("[data-protected-buy-wallet]")?.value||a.protectedBuyModal?.walletIndex||"",amountSol:j(p("[data-protected-buy-amount]")?.value||a.protectedBuyModal?.amountSol||""),slippageBps:p("[data-protected-buy-slippage]")?.value||a.protectedBuyModal?.slippageBps||"400",riskAccepted:!!p("[data-protected-buy-risk-accept]")?.checked},bl()),t?.matches?.("[data-fast-bundle-preset]")){const n=t.value||"";if(n==="custom"){Rl("bundle");return}a.selectedBundlePresetId=n,a.fastBundlePresetStatus=a.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(a.terminalSort=t.value||"best",J("live"),J("slimeScope"),h(),z(()=>Lt({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){a.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",a.liveFeedCategory)}catch{}a.terminalSort=Od()[3]||"best",J("live"),h(),z(()=>Lt({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){a.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",a.liveTerminalCategory)}catch{}J("live"),h(),z(()=>Lt({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){a.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",a.cookSpotCategory)}catch{}J("slimeScope"),h(),z(()=>Y("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const n=t.files?.[0],r=p("[data-launch-image-preview-wrap]"),o=p("[data-launch-image-preview]"),s=p("[data-launch-image-preview-meta]");if(!n){r&&(r.hidden=!0);return}const c=Math.round(n.size/1024);s&&(s.textContent=`${n.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`}`);try{const i=URL.createObjectURL(n);o&&(o.onload=()=>URL.revokeObjectURL(i),o.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const n=Ce(),r=t.getAttribute("data-terminal-filter-social"),o=t.getAttribute("data-terminal-filter-quote"),s=t.getAttribute("data-terminal-filter-audit");r&&(n.socials[r]=!!t.checked),o&&(n.quotes[o]=!!t.checked),s&&(n.audits[s]=!!t.checked),n.open=!0,J("live"),J("launch"),J("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(Ro(),a.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(a.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await Xg(t),t?.matches?.("[data-avatar-file]")&&await Zg(t)}),document.addEventListener("focusout",()=>{setTimeout(gc,50)}),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){a.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),So();return}if(t?.matches?.("[data-trade-token]")){const n=String(t.value||"").trim();a.tradeToken=n,a.tradeSwapTo=n;return}if(t?.matches?.("[data-terminal-filter-field]")){const n=t.getAttribute("data-terminal-filter-field"),r=Ce();(n==="keywords"||n==="excludeKeywords")&&(r[n]=String(t.value||""),r.open=!0,id());return}if(t?.matches?.("[data-launch-ticker]")){const n=Ce();n.keywords=String(t.value||""),n.open=!0,id();return}if(t?.matches?.("[data-smart-chart-zoom]")){a.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const n=t.closest(".smart-chart-zoom")?.querySelector("strong");n&&w(n,`${a.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(a.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(Ro(),t.type==="range"&&h({force:!0}))});function ar(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",n=yc(t,{forcePaint:!0});gc(),!n&&e?.persisted&&a.route==="terminal"&&h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),Qt&&window.clearTimeout(Qt),Qt=window.setTimeout(()=>{if(Qt=null,!(document.hidden||a.route!=="terminal")){if(xn()){E({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:a.postTradeRefresh?.attemptId||"",details:a.activeTab||"terminal"});return}Y(a.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),a.user&&a.token&&Pn("positions")&&At({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:zo}).catch(()=>{}),sa(),Cn(),Lr(),Bs()}},li)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(a.ogreAgentListening||a.ogreAgentSpeechRecognizer)&&Dt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(a.ogreAgentOpen&&(a.ogreAgentListening||a.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!a.ogreAgentListening&&!a.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&ar()},li+900);return}ar()}),window.addEventListener("focus",ar),window.addEventListener("pageshow",ar),window.addEventListener("online",ar),window.addEventListener("pagehide",()=>{Qt&&(window.clearTimeout(Qt),Qt=null),a.clipFarm?.recording&&On()});function Aw(){cs&&window.clearInterval(cs),cs=window.setInterval(()=>{document.hidden||yc("watchdog")},Wp)}const Cw=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Chart & Swap",items:[["smartChart","Smart Chart"],["trade","Slime Swap"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function Lw(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=Cw.map(n=>`
    <div class="nav-drop-group" data-nav-drop-group="${l(n.key)}">
      <button type="button" class="nav-drop-toggle" aria-haspopup="true" aria-expanded="false">${l(n.label)}<span class="nav-drop-caret" aria-hidden="true">▾</span></button>
      <div class="nav-drop-menu" role="menu">
        ${n.items.map(([r,o])=>`<button type="button" role="menuitem" data-tab="${l(r)}">${l(o)}</button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",n=>{const r=n.target.closest(".nav-drop-toggle");if(!r)return;const o=r.parentElement,s=o.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),s||o.classList.add("is-open")}),document.addEventListener("click",n=>{n.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function Mw(){const e=document.querySelector("[data-nav-drop]");e&&(e.querySelectorAll(".nav-drop-group").forEach(t=>{const n=!!t.querySelector(`[data-tab="${a.activeTab}"]`);t.querySelector(".nav-drop-toggle")?.toggleAttribute("data-active",n),t.classList.remove("is-open")}),e.querySelectorAll("[data-tab]").forEach(t=>{t.dataset.active=t.dataset.tab===a.activeTab?"true":"false"}))}async function xw(){Lw(),fm(),wm(),vm(),ms(),ym(),a.route==="intro"?gm():dn({reset:!0}),Gf(),Aw(),fs(),hl(),await qm(),h(),await zm(),sb(),a.route==="terminal"&&(Na({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),a.activeTab==="ogreTek"&&await tr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))}xw();function vt(e){a.pumpLiveStatus=e,a.pumpLiveLastActionAt=Date.now(),h()}function Bw(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():a.launchCoinDraft||{},t=lu(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function Rw(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const n=t.getAttribute("data-pump-live-action"),r=Bw(),o=r.tokenMint;if(!o){vt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(n==="chart"){typeof ft=="function"?(ft(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),vt("Opened Pump chart with transactions inside Slime.")):vt("Chart panel is still loading. Try again in a moment.");return}if(n==="copy"){const s=iu(o);navigator.clipboard?.writeText(s).then(()=>vt("Copied Pump Live stream route ID."),()=>vt("Stream route ID ready: "+s));return}if(n==="obs"){const s=al()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";vt(s);return}if(n==="end"){vt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(n==="go"){if(!al()){vt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}vt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",Rw);function Ht(e){const t=String(e??"");return typeof l=="function"?l(t):t.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function Xl(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:a.smartChartToken||{}}function Jl(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function Iw(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function Do(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function pp(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const n of t){const r=Do(n);if(Number.isFinite(r)&&r>0)return r}return NaN}function Ow(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const n=Number(t);if(Number.isFinite(n))return n<1e11?n*1e3:n;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function Ew(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function Fw(e,t,n){if(!n.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(o=>String(o||"").toLowerCase()).join(" ");return n.some(o=>r.includes(o))}function Ww(e=""){return String(e||"").split("").reduce((t,n)=>t*31+n.charCodeAt(0)>>>0,17)}function Nw(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(Do).filter(o=>Number.isFinite(o)&&o>0);if(t.length)return t[0];const n=typeof Ft=="function"?Number(Ft(e)):NaN;if(Number.isFinite(n)&&n>0)return Math.max(1,n*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function hS(e){const t=Xl(e),n=Jl(t)||t.symbol||t.name||"slime",r=Nw(t),o=Ww(n),s=Math.max(1,Do(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,Do(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),i=typeof Ft=="function"?Math.max(0,Math.min(100,Number(Ft(t))||0)):0,u=Math.max(-8,Math.min(18,c/s*18+i/12)),d=Date.now();return Array.from({length:34},(m,f)=>{const y=(f+o%13)/4.2,b=Math.sin(y)*(3.5+o%7*.28),S=(f/33-.5)*u,T=((o>>f%11&7)-3)*.32,A=Math.max(1e-7,r*(1+(b+S+T)/100));return{row:{...t,snapshotFallback:!0},value:A,time:d-(33-f)*15e3,side:"snapshot"}})}function mp(e){const t=Xl(e),n=[Jl(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,i,u)=>c.length>=3&&u.indexOf(c)===i),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:a.liveTrades},{direct:!1,rows:a.liveTradeRows},{direct:!1,rows:a.tradeTape},{direct:!1,rows:a.recentTrades},{direct:!1,rows:a.pumpTrades},{direct:!1,rows:a.pumpActivity},{direct:!1,rows:a.livePairs},{direct:!1,rows:a.livePairsRows},{direct:!1,rows:a.freshPairs},{direct:!1,rows:a.slimeScopePairs}],o=[];for(const c of r){const i=Ew(c.rows).slice(-350);for(const u of i){if(!u||typeof u!="object"||!c.direct&&!Fw(u,t,n))continue;const d=pp(u);if(!Number.isFinite(d)||d<=0)continue;const m=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();o.push({row:u,value:d,time:Ow(u),side:m.includes("sell")?"sell":m.includes("buy")?"buy":"trade"})}}const s=pp(t);return Number.isFinite(s)&&s>0&&o.push({row:t,value:s,time:Date.now(),side:"snapshot"}),o.sort((c,i)=>c.time-i.time).filter((c,i,u)=>i===0||c.time!==u[i-1].time||c.value!==u[i-1].value).slice(-120)}function Uo(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function _w(){const e=String(a.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function Dw(e={},t={}){const n=Xl(e),r=Jl(n),o=_w(),s=String(a.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(a.pumpChartTimeframe||"5m"),u=mp(n).slice(-70),d=!u.length||u.every(_=>_.side==="snapshot"||_.row?.snapshotFallback),m=u.map(_=>_.value),f=m.length?Math.min(...m):NaN,y=m.length?Math.max(...m):NaN,b=720,S=260,T=22,A=Number.isFinite(y-f)&&y!==f?y-f:1,g=_=>u.length<=1?b/2:T+_/(u.length-1)*(b-T*2),P=_=>S-T-(_-(Number.isFinite(f)?f:0))/A*(S-T*2),L=u.map((_,Ee)=>`${Ee?"L":"M"}${g(Ee).toFixed(1)},${P(_.value).toFixed(1)}`).join(" "),B=u.length>1?`${L} L${g(u.length-1).toFixed(1)},${S-T} L${g(0).toFixed(1)},${S-T} Z`:"",D=Math.max(4,Math.min(12,(b-T*2)/Math.max(u.length*2,1))),ne=u.map((_,Ee)=>{const ce=(u[Math.max(0,Ee-1)]||_).value,va=_.value,qo=Math.max(ce,va),Ho=Math.min(ce,va),Ko=g(Ee),Yl=P(ce),Ql=P(va),hp=P(qo),gp=P(Ho);return`<g class="slime-pump-candle ${va>=ce?"up":"down"}"><line x1="${Ko.toFixed(1)}" y1="${hp.toFixed(1)}" x2="${Ko.toFixed(1)}" y2="${gp.toFixed(1)}" /><rect x="${(Ko-D/2).toFixed(1)}" y="${Math.min(Yl,Ql).toFixed(1)}" width="${D.toFixed(1)}" height="${Math.max(2,Math.abs(Ql-Yl)).toFixed(1)}" rx="2" /></g>`}).join(""),we=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",ge=o==="dex"&&we?`<iframe class="slime-pump-dex-frame" src="${Ht(we)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${b} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${B}" />${s==="candles"?ne:`<path class="slime-pump-line" d="${L}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${o==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(_=>`<button type="button" class="${o===_?"active":""}" data-slime-pump-source="${_}">${_==="slime"?"Slime":_==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${s==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${s==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(_=>`<button type="button" class="${c===_?"active":""}" data-slime-pump-time="${_}">${_}</button>`).join("")}
          ${d?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${ge}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Ht(Uo(m[m.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Ht(Number.isFinite(f)&&Number.isFinite(y)?`${Uo(f)} - ${Uo(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Ht(d?"Slime snapshot":o==="slime"?"Slime default":o==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function Uw(e={}){const t=mp(e).slice(-40).reverse(),n=t.map(r=>{const o=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),s=o<60?`${o}s`:`${Math.floor(o/60)}m`,c=r.row||{},i=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Ht(s)}</span><strong>${Ht(r.side)}</strong><span>${Ht(Uo(r.value))}</span><span>${Ht(Iw(i))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${n||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function fp(){a.slimePumpChartRendering||(a.slimePumpChartRendering=!0,requestAnimationFrame(()=>{a.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),n=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||n||r)&&(e.preventDefault(),e.stopPropagation(),t&&(a.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),n&&(a.pumpChartMode=n.getAttribute("data-slime-pump-mode")||"line"),r&&(a.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),fp())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&fp()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||a.activeTab!=="volume"||!(a.volumeBots||[]).some(t=>t.status!=="completed")||_r()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const n=document.querySelector("[data-vbot-invest-num]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const n=document.querySelector("[data-vbot-invest]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-duration]")){const n=document.querySelector("[data-vbot-duration-label]");if(n){const r=Number(t.value);n.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const n=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function o(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function s(){return!!(a?.route==="terminal"&&n.has(String(a.activeTab||"terminal"))&&!document.hidden)}function c(){let m=0;const f=y=>{if(y){if(Array.isArray(y)){m+=y.length;return}if(Array.isArray(y.rows)){m+=y.rows.length;return}Array.isArray(y.data?.rows)&&(m+=y.data.rows.length)}};return f(a.livePairRows),f(a.slimeScopeRows),f(a.liveTradeRows),f(a.livePairs),Object.values(a.livePairsByBucket||{}).forEach(f),Object.values(a.terminalFeeds||{}).forEach(f),m}function i(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const m=[a.livePairsLastUpdatedAt,a.livePairsLastUpdatedByBucket?.[a.livePairBucket||"live"],a.terminalFeeds?.[a.activeTab||"terminal"]?.updatedAt,a.terminalFeeds?.[a.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return m.length?Date.now()-Math.max(...m)>3e4:!1}function d(m="empty-feed-watchdog"){if(!s()||o())return;const f=Date.now();if(f-t<ln)return;const y=c()===0&&!i();if(!y&&!u())return;t=f;const b=()=>typeof Na=="function"?Na({force:y,reason:m}):typeof Y=="function"?Y(a.activeTab||"terminal",{force:y,reason:m}):null;try{typeof z=="function"?z(b):Promise.resolve(b()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),ln),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),ln)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),ln)})})();
