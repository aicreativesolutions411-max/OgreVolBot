import{canSubmitPerpOrder as Tm,createPerpsProvider as Am,ogreTekRouteStatus as Pm,resolveOgreTekConfig as Cm,shouldShowOgreTekNav as Lm,validatePerpOrder as xm}from"./perps.js";import{smartChartSuggestion as Mm,tradeActionLabelFromPreset as Bm}from"./liveTerminalUi.js";const Ma=window.OGRE_PORTAL_CONFIG||{},Rm=Ma.featureFlags||{};function D(e,t=!0){const a=Rm?.[e];return a==null||a===""?!!t:typeof a=="boolean"?a:["1","true","yes","on"].includes(String(a).toLowerCase())}const Jt=Ma.pumpLive||{},$e=Cm(Ma),Im=!1,Sr=Am($e),Om=String(Ma.apiBase||"").trim().replace(/\/+$/,""),Em=window.location.origin.replace(/\/+$/,""),El="https://ogrevolbot.onrender.com",Lt=String(Ma.shareUrl||Ma.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",Fl=[Om,window.location.hostname.endsWith("onrender.com")?Em:"",El].filter(Boolean);let kr=Fl[0]||El;const kn=6e4,yo=15e3,Yt=1e4,vo=8e3,$n=8e3,Wl=new Map,Fm=new Map,gt=Fm,Qt=new Set,$r=new Map,Uk=new Map,Tn={},te=18e4,wo="slimewireMobileWalletPending",So="slimewireMobileWalletPendingBackup",Wm="slimewireMobileWalletSession:",_l="slimewirePerfLog",Nl="slimewireCrashLog",_m="slimewireTerminalFeedLog",Dl="slimewireOgreAiRecentMints",Ul="slimewireOgreAiFormPreset",Nm=150,Dm=1500,Um=1e4,qm=140,ql="live-pairs-inflight",Hm=[1200,4500,1e4],Km=15e3,Hl=650,Vm=3500,zm=12e3,jm=3e4,Gm=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Kl="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",Xm=new Map([...Kl].map((e,t)=>[e,t]));function Jm(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function An(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function ko(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function Vl(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function zl(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function $o(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function Ym(){try{const e=JSON.parse(window.localStorage?.getItem(_l)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function Qm(){try{const e=JSON.parse(window.localStorage?.getItem(Nl)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function jl(){try{const e=JSON.parse(window.sessionStorage?.getItem(Dl)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function Zm(e){const t=[...Array.isArray(e?.plans)?e.plans.map(s=>s?.tokenMint||s?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(s=>s?.tokenMint):[]].map(s=>String(s||"").trim()).filter(Boolean);if(!t.length)return;const a=new Set,r=[...jl(),...t].filter(s=>a.has(s)?!1:(a.add(s),!0)).slice(-30);try{window.sessionStorage?.setItem(Dl,JSON.stringify(r))}catch{}}function Gl(){try{const e=JSON.parse(window.sessionStorage?.getItem(Ul)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function ef(e={}){try{window.sessionStorage?.setItem(Ul,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function Xl(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),a=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(a||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function tf(){let e={};try{e=JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{e={}}try{const t=new URLSearchParams(window.location.search);if(t.has("lc_n")||t.has("lc_s")){const a={lc_n:"name",lc_s:"symbol",lc_d:"description",lc_x:"x",lc_tg:"telegram",lc_web:"website"};for(const s in a){const o=t.get(s);o&&(e[a[s]]=s==="lc_s"?o.toUpperCase().slice(0,12):o)}const r=t.get("lc_dev");r&&Number(r)>0&&(e.devBuySol=String(r),e.devBuyEnabled=!0);try{Ba(e)}catch{}try{window.history.replaceState(null,"",window.location.pathname+window.location.hash)}catch{}}}catch{}return e}function Ba(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,String(t.bannerDataUrl||"").length>=15e5&&delete t.bannerDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function af(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function nf(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function rf(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const Jl="slimewireIntroCompleteV1";function Yl(){try{return window.sessionStorage?.getItem(Jl)==="true"}catch{return!1}}function sf(){try{window.sessionStorage?.setItem(Jl,"true")}catch{}}function Pn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const n={token:Jm(),user:null,route:Ka(window.location.pathname),activeTab:window.location.pathname.includes("/launch-coin")||/[?&]lc_n=/i.test(window.location.search)?"launchCoin":window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:Ym(),crashLog:Qm(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:tf(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:af(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:Vl(),loginCollapsed:!0};let Ra=null,Tr="";const To=new Set;let Ia=null,Ar="",Oa=null,Pr="",Zt=null,Ea=null,tt=0,Fa=null,Cr="",Wa=null,Lr="",xr=null,xt=[],Mr=null,Br=null,Rr=!1,Cn=[],Ao=null,ea=null,ta=null,Ln=null,Po="",Ql=0,of=0,Co=0,Ir=null,_a=!1;const Or=new Map,Lo={},aa=new Map,Na=[];let xo=null,Mo=null,Bo=null,Ro=null,Io=null,Oo=0,Eo=new Set,Fo=null,na=null,Er=null,Wo=null,Zl=Date.now();function Da(){return!!(n.slimeShieldDetails?.open||n.devInfoDetails?.open||n.kolDumpDetails?.open||n.replayDetails?.open)}function Ua(){Ra&&clearTimeout(Ra),Ra=null,Tr=""}function Fr(){Da()||(ua(),qa("details-close"))}function lf(e,t){const a=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const l=a(c);l&&!r.has(l)&&r.set(l,c)}let s=e.querySelector(":scope > .signal-header")||null;const o=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const l=a(c);let u=l?r.get(l):null;u?(o.add(l),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,s?s.nextElementSibling!==u&&s.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),s=u}for(const[c,l]of r)o.has(c)||l.remove()}function cf(e,t){const a=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!a?e.insertBefore(r,e.firstChild):a&&!r?a.remove():a&&r&&a.innerHTML!==r.innerHTML&&(a.innerHTML=r.innerHTML);for(const s of["[data-cooks-best]","[data-cooks-newest]"]){const o=e.querySelector(`:scope > ${s}`),c=t.querySelector(`:scope > ${s}`);if(!c){o&&o.remove();continue}if(!o)return!1;const l=o.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");l&&u&&l.innerHTML!==u.innerHTML&&(l.innerHTML=u.innerHTML);const d=o.querySelector(":scope > .signal-list"),p=c.querySelector(":scope > .signal-list");d&&p?lf(d,p):d!==p&&o.replaceWith(c)}return!0}let ec=0;if(typeof window<"u"){const e=()=>{ec=Date.now()};window.addEventListener("wheel",e,{passive:!0}),window.addEventListener("touchmove",e,{passive:!0}),window.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Spacebar"].includes(t.key)&&e()},{passive:!0})}function uf(){if(n.activeTab!=="live"&&n.activeTab!=="terminal")return!1;const e=m("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const a=Ne(),r=ye(a?.rows||[]),s=hn(r);if(!s.length)return!1;const o=Jn(),c=[];{const p=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<p){const g=f.getAttribute("data-token-chart")||"";if(g&&c.push({mint:g,top:y}),c.length>=6)break}}}const l=document.createElement("div");l.innerHTML=yl(s);const u=l.querySelector(".cooks-feed");if((!u||!cf(t,u))&&(t.outerHTML=yl(s)),c.length&&(o||Date.now()-ec>450)){const p=e.querySelector(".cooks-feed");for(const f of c){const y=p?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const g=y.getBoundingClientRect().top-f.top;Number.isFinite(g)&&Math.abs(g)>1&&window.scrollBy(0,g);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const p=Bt.find(([f])=>f===n.livePairBucket)?.[1]||"Live";d.textContent=`${p} | ${s.length} live`}return!0}function qa(e="live-pairs-batch"){if(e&&Eo.add(String(e)),Io||Oo)return;const t=()=>{const a=Array.from(Eo);if(Io=null,Eo=new Set,Oo=0,n.route!=="terminal"||!["terminal","live","slimeScope"].includes(n.activeTab)||Da()||(W({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(Ne()?.rows)?Ne().rows.length:0,details:a.length?a.slice(-3).join(" | "):e}),(n.activeTab==="live"||n.activeTab==="terminal")&&uf()))return;const r=gi();h(),bi(r)};Io=window.setTimeout(()=>{Oo=window.requestAnimationFrame(t)},qm)}const m=e=>document.querySelector(e);function G(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const v=(e,t)=>{e&&(e.textContent=t)},Ie=(e,t)=>{v(m(e),t)},Mt=(e,t)=>{const a=m(e);a&&(a.hidden=t)},ie=m("[data-app]"),xn=m("[data-login]"),tc=m("[data-connect]"),_o=m("[data-top-login]"),Pe=m("[data-login-modal]"),ac=m("[data-auth-actions]"),nc=m("[data-guest-actions]"),rc=m("[data-session-actions]"),ae=m("[data-dashboard]"),df=m("[data-error]"),pf=m("[data-dashboard-error]");function ne(e){if(!D("debugPerformanceCounters",!1))return;const t=String(e||"counter");Tn[t]=Number(Tn[t]||0)+1,(Tn[t]<=5||Tn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,Tn[t])}const Bt=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],mf=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],No=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],Ha=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],ff=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],hf=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],gf=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],bf=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],yf=Object.fromEntries(bf.map(e=>[e.tabKey,e])),vf=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function sc(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function oc(e,t=""){const a=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return sc(a)===sc(t)}function wf(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!oc(e,t))return t;const a=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return a.includes("phantom")?Ga("phantom"):a.includes("solflare")?Ga("solflare"):a.includes("wallet")||a.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":a.includes("powered-by")||a.includes("wordmark")||a.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":wl(e?.alt||a||"slimewire")}function ic(e,t="",a="fallback"){try{console.info("[slimewire_image_fallback]",{action:a,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function Sf(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const a=wf(t);if(!a||oc(t,a)){t.hidden=!0,ic(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=a,ic(t,a,"fallback")}function Do(){Do.installed||(Do.installed=!0,document.addEventListener("error",Sf,!0))}function Uo(){if(!Uo.started){Uo.started=!0;for(const e of vf)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function Ka(e=window.location.pathname){return(e==="/"||e==="")&&Yl()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function kf(){if(Yl()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let Mn=null;function qo(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(Mn||(Mn=new e),Mn.state==="suspended"&&Mn.resume().catch(()=>{}),Mn):null}catch{return null}}function $f(){const e=qo();if(!(!e||e.state!=="running"))try{const t=e.currentTime,a=1.7,r=Math.floor(e.sampleRate*a),s=e.createBuffer(1,r,e.sampleRate),o=s.getChannelData(0);for(let f=0;f<r;f+=1)o[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=s;const l=e.createBiquadFilter();l.type="bandpass",l.Q.value=.7,l.frequency.setValueAtTime(280,t),l.frequency.exponentialRampToValueAtTime(3400,t+.55),l.frequency.exponentialRampToValueAtTime(170,t+a);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+a),c.connect(l).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const p=e.createGain();p.gain.setValueAtTime(1e-4,t),p.gain.exponentialRampToValueAtTime(.38,t+.08),p.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(p).connect(e.destination),c.start(t),c.stop(t+a),d.start(t),d.stop(t+1.2)}catch{}}function Tf(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),a=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let s=!1,o=null;const c=()=>n.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),l=T=>{t&&(t.dataset.introPhase=T)},u=T=>{r&&(r.textContent=T,r.hidden=!T)},d=()=>{s||(s=!0,o&&(clearTimeout(o),o=null),l("portal"),$f(),sf(),setTimeout(()=>{Pn({reset:!0}),Te("/connect")},620))};if(!c()){Pn({reset:!0});return}const p=()=>{s||(qo(),a&&a.muted&&(a.muted=!1,a.volume=1,a.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(T=>{document.addEventListener(T,p,{once:!0,passive:!0})}),a&&(a.preload="auto",a.playsInline=!0,a.autoplay=!0,a.setAttribute("autoplay",""),a.setAttribute("playsinline",""),a.disablePictureInPicture=!0,!a.getAttribute("src")&&a.dataset.introSrc&&(a.src=a.dataset.introSrc));const f=T=>{o&&clearTimeout(o),o=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,T)))},y=()=>{if(s||!c())return;const T=b=>{if(!a)return;a.muted=b,a.volume=b?0:1;const P=a.play?.();P?.catch&&P.catch(()=>{b?u(""):T(!0)})};qo(),T(!1)};a?.addEventListener("loadedmetadata",()=>{const T=Number(a.duration);f(Number.isFinite(T)&&T>0?(T+2.5)*1e3:9e3)}),a?.addEventListener("ended",d),a?.addEventListener("error",()=>{f(1500)});let g=!1,S=null;const A=()=>{g||s||!c()||(g=!0,y())};a?(a.readyState>=4?A():(a.addEventListener("canplaythrough",A,{once:!0}),setTimeout(A,2800)),a.addEventListener("waiting",()=>{!g||s||(S&&clearTimeout(S),S=setTimeout(()=>{c()&&d()},900))}),["playing","timeupdate"].forEach(T=>a.addEventListener(T,()=>{S&&(clearTimeout(S),S=null)}))):A(),f(11e3)}function lc(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function Ho({keepLogin:e=!1}={}){n.walletConnectMenuOpen=!1,e||(n.loginModalOpen=!1),n.quickBuyModal?.open&&(n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""}),zn()}function Te(e,t=null){const a=L(),r=e||"/terminal";n.route=Ka(r),Ho({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.route==="terminal"&&(n.activeTab=t||lc(r)),n.route!=="intro"&&Pn({reset:!0}),window.history.pushState({},"",r),zi(),h(),H("route-change",a,{component:"router",details:r})}window.addEventListener("popstate",()=>{n.route=Ka(),Ho({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.activeTab=lc(),n.route!=="intro"&&Pn({reset:!0}),zi(),h()});let cc=!1;function Ko(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Wr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),Ko()}function Af(e){if(!e)return;const t=!e.open;if(Wr(e),e.open=t,t){const a=e.closest("[data-market-ticker]"),s=e.querySelector("summary")?.getBoundingClientRect?.();if(a&&s){const o=Math.max(10,Math.min(window.innerWidth-10,s.left+s.width/2)),c=Math.max(30,s.bottom+4);a.style.setProperty("--ticker-menu-left",`${Math.round(o)}px`),a.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}Ko()}function Pf(){cc||(cc=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Wr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Wr(),80);return}const a=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");a&&(e.preventDefault(),e.stopPropagation(),Af(a.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&Ko()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Wr()}))}function Va(e){return`${kr}${e}`}function L(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function ra(e){try{window.performance?.mark?.(e)}catch{}}function ve(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function uc(e={}){Na.push(e),Na.length>10&&Na.splice(0,Na.length-10),!xo&&(xo=window.setTimeout(()=>{xo=null;const t=Na.splice(0,Na.length);for(const a of t)try{const r=JSON.stringify(a),s=Va("/api/web/perf-event");if((s.charAt(0)==="/"||s.indexOf(location.origin)===0)&&navigator.sendBeacon){const c=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(s,c))continue}fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function Vo(e,t,a){if(a==="perf"&&Mo||a==="crash"&&Bo||a==="feed"&&Ro)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},s=window.setTimeout(()=>{a==="perf"&&(Mo=null),a==="crash"&&(Bo=null),a==="feed"&&(Ro=null),r()},Dm);a==="perf"&&(Mo=s),a==="crash"&&(Bo=s),a==="feed"&&(Ro=s)}function W(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&ne("slowApiRequestWarning");const a={at:new Date().toISOString(),route:ve(e.route||n.route||Ka(),40),component:ve(e.component||"",60),action:ve(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ve(e.requestId||"",80),errorCode:ve(e.errorCode||"",60),details:ve(e.details||"",140)};return n.perfLog=[...n.perfLog||[],a].slice(-100),Vo(_l,()=>n.perfLog,"perf"),(a.durationMs>=Nm||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(a.action))&&uc(a),a}function H(e,t,a={}){W({...a,action:e,durationMs:L()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",a=""){ra("chartFirstPaint"),W({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!Ye(a)?.cacheHit,stale:!!Ye(a)?.stale,details:`${ve(t,20)}:${ve(a,60)}`})};function zo(e={}){const t={at:new Date().toISOString(),route:ve(e.route||n.route||Ka(),40),actionBeforeCrash:ve(e.actionBeforeCrash||n.postTradeRefresh?.action||"",70),errorCode:ve(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ve(e.message||"",160),component:ve(e.component||"",80),requestId:ve(e.requestId||n.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return n.crashLog=[...n.crashLog||[],t].slice(-50),Vo(Nl,()=>n.crashLog,"crash"),uc({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Cf(){n.crashInstrumentationInstalled||(n.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||zo({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};zo({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function bt(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function jo(e="",t="",a=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(a||"").trim()}`}function at(e="",t="",a=""){const r=jo(e,t,a),s=n.tradeActionLocks?.[r];return s&&["clicked","submitting","submitted","confirming"].includes(s.state)?s:null}function V(e="",t="",a="",r={}){const s=jo(e,t,a),o=n.tradeActionLocks?.[s]||{};n.tradeActionLocks={...n.tradeActionLocks||{},[s]:{...o,action:e,tokenMint:t,detail:a,updatedAt:new Date().toISOString(),...r}},le()}function Ce(e="",t="",a="",r=2400){const s=jo(e,t,a);window.setTimeout(()=>{const o=n.tradeActionLocks?.[s];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const c={...n.tradeActionLocks||{}};delete c[s],n.tradeActionLocks=c,le(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},r)}function _r(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function Go(e="",t=""){const a=n.manualSellActions?.[_r(e,t)];return a&&["clicked","submitting","submitted","confirming"].includes(a.state)?a:Object.entries(n.manualSellActions||{}).find(([r,s])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(s?.state))?.[1]||null}function sa(e,t,a={}){const r=_r(e,t),s=n.manualSellActions?.[r]||{};n.manualSellActions={...n.manualSellActions||{},[r]:{...s,tokenMint:e,percent:String(t||s.percent||"100"),updatedAt:new Date().toISOString(),...a}},le()}function Xo(e,t,a=2400){const r=_r(e,t);window.setTimeout(()=>{const s=n.manualSellActions?.[r];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const o={...n.manualSellActions||{}};delete o[r],n.manualSellActions=o,le(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},a)}function za(e,t={}){const a=L(),r=t.startedAt||n.positionRefreshAction?.startedAt||a;n.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(n.positionRefreshAction?.minUntil||0,a+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},le()}function Ke(e,t={}){const a=n.positionRefreshAction?.minUntil||0,r=Math.max(0,a-L());Mr&&window.clearTimeout(Mr),Mr=window.setTimeout(()=>{Mr=null,za(e,t),h(),e==="success"&&window.setTimeout(()=>{n.positionRefreshAction?.state==="success"&&(n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},le(),h())},900)},r)}function Rt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function le(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(o=>{const c=o.dataset.positionSell||"",l=o.dataset.positionSellPercent||"",u=Go(c,l),d=Rt(o),p=n.manualSellActions?.[_r(c,l)],f=!!u;o.disabled=f,o.dataset.actionState=p?.state||u?.state||"idle",f?p?.state==="submitted"||p?.state==="confirming"?o.textContent="Submitted":o.textContent="Selling...":o.textContent=d});const e=String(n.tradeToken||m("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(o=>{const c=o.dataset.tradeBuyQuick||(o.matches("[data-trade-buy-max]")?"max":"custom"),l=at("trade-buy",e,c),u=Rt(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(o=>{const c=o.dataset.quickTradeToken||"",l=ct(),u=He(l)||l?.amountSol||"quick",d=at("trade-buy",c,String(u)),p=Rt(o);o.disabled=!!d,o.dataset.actionState=d?.state||"idle",o.textContent=d?d.state==="submitted"?"Submitted":"Buying...":p}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(o=>{const c=o.dataset.tradeSellQuick||"custom",l=at("trade-sell",e,c),u=Rt(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(o=>{const c=o.dataset.chartConfirmBuy||n.smartChartToken||"",l=X(m("[data-chart-buy-amount]")?.value||"")||"custom",u=at("trade-buy",c,String(l)),d=Rt(o);o.disabled=!!u,o.dataset.actionState=u?.state||"idle",o.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(o=>{const c=o.dataset.chartConfirmSell||n.smartChartToken||"",l=m("[data-chart-sell-percent]")?.value||"100",u=Go(c,l),d=Rt(o);o.disabled=!!u,o.dataset.actionState=u?.state||"idle",o.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(n.bundleToken||m("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(o=>{const c=o.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",l=at(c,t,"bundle"),u=Rt(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const a=(o,c)=>{const l=Rt(o),u=o.matches?.("[data-top-refresh-wallet]");if(o.dataset.actionState=c,o.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){o.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",o.textContent=l||"Refresh";return}c==="clicked"||c==="refreshing"?o.textContent="Refreshing...":c==="success"?o.textContent="Updated":c==="error"?o.textContent="Failed":o.textContent=l},r=n.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(o=>{a(o,r)});const s=n.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(o=>{a(o,s)})}function Lf(){if(!n.perfInstrumentationInstalled){n.perfInstrumentationInstalled=!0,ra("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries())Number(a.duration||0)<50||W({component:"main-thread",action:"long-task",durationMs:a.duration,details:a.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries()){const r=Number(a.duration||0);r<80||W({component:"input",action:"interaction-delay",durationMs:r,details:a.name||a.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Le(e){return new Promise(t=>setTimeout(t,e))}function N(e="",t={}){const a=String(e||"");return t.preserveSafeError?a:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(a)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":a}async function Bn(e,t={},a=kn){const r=new AbortController,s=setTimeout(()=>r.abort(),a);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(s)}}async function dc(e){try{await Bn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:a=kn,preserveSafeError:r=!1,dedupe:s=!0,...o}=t||{},c=String(o.method||"GET").toUpperCase(),l=L(),u=s&&c==="GET"?`${c}:${e}:${n.token?n.token.slice(0,12):"guest"}`:"";if(u&&aa.has(u))return ne("duplicateApiRequestsPrevented"),W({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),aa.get(u);const d=(async()=>{const p={"Content-Type":"application/json",...o.headers||{}};n.token&&(p.Authorization=`Bearer ${n.token}`);let f,y=null;try{f=await Bn(Va(e),{...o,headers:p,cache:"no-store"},a)}catch(S){y=S,await dc(kr),await Le(900);try{f=await Bn(Va(e),{...o,headers:p,cache:"no-store"},a)}catch(A){y=A;for(const T of Fl)if(T!==kr)try{await dc(T),f=await Bn(`${T}${e}`,{...o,headers:p,cache:"no-store"},a),kr=T;break}catch(b){y=b}if(!f){const T=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${T} SlimeWire could not connect right now. Try again in a moment.`)}}}const g=await pc(f);if(!f.ok||g.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(g.launchAttemptId||g.launch?.launchAttemptId),A=N(g.message||g.launch?.failureReason||g.error||`HTTP ${f.status}`,{preserveSafeError:S}),T=new Error(A);throw T.status=f.status,T.data=g,T.code=g.errorCode||g.launch?.errorCode||g.error||"",T.stage=g.stage||g.launch?.stage||"",T.launchAttemptId=g.launchAttemptId||g.launch?.launchAttemptId||"",T.providerStatus=g.providerStatus||g.launch?.providerStatus||null,f.status===401&&Hf(A),T}return H("api-request",l,{component:"api",details:e,resultCount:Array.isArray(g?.rows)?g.rows.length:0}),g})();return u&&(aa.set(u,d),d.then(()=>{aa.get(u)===d&&aa.delete(u)},()=>{aa.get(u)===d&&aa.delete(u)})),d}async function pc(e){const t=e.headers.get("content-type")||"",a=await e.text();if(!a.trim())return{};try{return JSON.parse(a)}catch{const r=a.toLowerCase(),s=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:s?"payload_too_large":"invalid_api_response",message:s?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function xf(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function me(e){e&&(n.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(n.xHandle=Je(e.xHandle),n.xHandle?zl(n.xHandle):$o()):n.xHandle||(n.xHandle=Vl()))}function Nr(e){for(const t of e){const a=In(t);if(a&&!a.closest("[hidden]"))return String(a.value||"")}for(const t of e){const a=m(t);if(a)return String(a.value||"")}return""}function Rn(){const e=m("[data-connect-status]");return e&&!e.closest("[hidden]")?e:In("[data-login-status]")||e}function In(e){const t=[...document.querySelectorAll(e)];return t.find(a=>!a.closest("[hidden]")&&a.offsetParent!==null)||t.find(a=>!a.closest("[hidden]"))||t[0]||null}function On(){return In("[data-wallet-connect-modal] [data-wallet-connect-status]")||In("[data-wallet-connect-status]")}function re(e=""){n.walletConnectStatus=String(e||""),v(On(),n.walletConnectStatus)}function mc(e="solana"){const t=Fe(e);return Ve()?Fn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:wc(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function It(e="solana",t=null,a={}){const r=fe(e),s={walletName:Fe(e,r),userId:n.user?.id||"",route:n.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...a};try{console.warn("[slimewire_wallet_connect]",s)}catch{}}function fc(e=n.route==="connect"){window.setTimeout(()=>{const t=n.loginModalOpen?`[data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";In(t)?.focus?.()},0)}function Mf(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(Ao=e)}function Bf(){const e=Ao;Ao=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function hc({restoreFocus:e=!0}={}){const t=!!n.loginModalOpen;n.loginCollapsed=!0,n.loginModalOpen=!1,h({force:!0}),t&&e&&Bf()}function Rf(){return!Pe||Pe.hidden||!n.loginModalOpen?[]:[...Pe.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function If(e){if(!n.loginModalOpen||e.key!=="Tab"||!Pe||Pe.hidden)return!1;const t=Rf();if(!t.length)return!1;const a=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===a?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),a.focus({preventScroll:!0}),!0):!1}function ja(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Of(e=ja()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function gc(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Ef(e="unknown"){const t=Date.now();if(t-Number(n.lastLockInClickAt||0)<300)return;n.lastLockInClickAt=t;const a={route:gc(n.route||Ka(),40),viewport:Math.round(window.innerWidth||0),source:gc(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(a),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",a)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(a)}).catch(()=>{})}catch{}}function bc({defaultTab:e="login",returnTo:t=ja(),source:a="unknown",connectPanel:r=n.route==="connect"}={}){if(Mf(),Ef(a),n.loginModalOpen=!0,n.loginModalTab=e==="create"?"create":"login",n.loginReturnTo=t||ja(),n.loginCollapsed=!1,n.walletConnectMenuOpen=!1,!Pe&&!_o){window.location.assign(Of(n.loginReturnTo));return}h({force:!0}),fc(r)}function yc(e={}){bc(e)}function Ve(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function vc(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Ff(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function wc(e=""){if(!Ve())return"";const t=encodeURIComponent(vc()),a=encodeURIComponent(Ff());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${a}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${a}`:""}function Jo(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Ga(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function Yo(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let a=0n;for(const s of t)a=(a<<8n)+BigInt(s);let r="";for(;a>0n;){const s=Number(a%58n);r=Kl[s]+r,a/=58n}for(const s of t){if(s!==0)break;r="1"+r}return r||"1"}function Dr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let a=0n;for(const s of t){const o=Xm.get(s);if(o===void 0)throw new Error("Invalid wallet callback encoding.");a=a*58n+BigInt(o)}const r=[];for(;a>0n;)r.unshift(Number(a&255n)),a>>=8n;for(const s of t){if(s!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Wf(e="phantom",t="",a=n.walletConnectReturnPath||"/terminal",r=""){const s=new URL(a||window.location.pathname||"/terminal",window.location.origin);return s.searchParams.delete("sw_wallet"),s.searchParams.delete("sw_wallet_state"),s.searchParams.delete("sw_wallet_pending"),s.searchParams.delete("phantom_encryption_public_key"),s.searchParams.delete("solflare_encryption_public_key"),s.searchParams.delete("nonce"),s.searchParams.delete("data"),s.searchParams.delete("errorCode"),s.searchParams.delete("errorMessage"),s.searchParams.set("sw_wallet",e),s.searchParams.set("sw_wallet_state",t),r&&s.searchParams.set("sw_wallet_pending",r),s.toString()}function En(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function Sc(){try{const e=window.sessionStorage?.getItem(wo)||window.localStorage?.getItem(So)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function _f(e){try{window.sessionStorage?.setItem(wo,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(So,JSON.stringify(e))}catch{}}function Qo(){try{window.sessionStorage?.removeItem(wo)}catch{}try{window.localStorage?.removeItem(So)}catch{}}function kc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function Fn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function Nf(e="",t={}){const a=Fn(e);if(!a)return"";const r=new URL(a);return r.searchParams.set("app_url",vc()),r.searchParams.set("redirect_link",Wf(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function oa(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ve()?"mobile":"desktop"}function $c(e=""){return Ve()&&!!Fn(e)}function Df(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Uf(e="",t="/terminal"){try{const a=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:kn,body:JSON.stringify({provider:e,intendedRoute:t,platform:oa(),browser:Df()})});return!a.pendingConnectId||!a.stateId||!a.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:a.pendingConnectId,stateId:a.stateId,returnPath:a.intendedRoute||t,dappEncryptionPublicKey:a.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:a.expiresAt||"",serverManaged:!0}}catch(a){return It(e,a,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:oa()}),null}}function qf(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const a=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:Yo(r),returnPath:t,dappEncryptionPublicKey:Yo(a.publicKey),dappEncryptionSecretKey:Yo(a.secretKey),createdAt:Date.now(),serverManaged:!1}}async function Tc(e="",{returnPath:t=n.walletConnectReturnPath||"/terminal"}={}){if(!$c(e))return!1;const a=await Uf(e,t)||qf(e,t);if(!a)return!1;_f(a);const r=Nf(e,a);if(!r)return!1;const s=Fe(e);return re(`Opening ${s} mobile connect. Approve in the wallet app, then return to SlimeWire.`),It(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:oa()}),window.location.assign(r),!0}function Ac(e=""){const t=Fe(e),a=wc(e);return a?(re(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),It(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:oa()}),window.location.href=a,!0):!1}function Pc({requirePassword:e=!1}={}){const t=Nr(["[data-connect-login-username]","[data-login-username]"]).trim(),a=Nr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!a&&!e)return{};if(!t)throw new Error("Enter your username.");if(!a)throw new Error("Enter your password.");return{username:t,password:a}}function Hf(e=""){n.token="",n.user=null,n.loading=!1,ko(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function Y(e=null,t="Creating secure web profile..."){if(n.user&&n.token)return n.user;v(e,t);const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:Xl()})});return n.token=a.token,me(a.user),An(n.token),n.user}function $(e=""){[df,pf].forEach(t=>{t&&(t.hidden=!e,v(t,e))})}function Q(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Kf(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Cc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function Zo(){$("");const e=Rn();try{const t=Pc();v(e,t.username?"Creating saved login...":"Creating account...");const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:Xl()})});n.token=a.token,me(a.user),An(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,t.username?"Account created. Login saved.":"Quick web account created."),K(a.trade?.signature,"account-create")}catch(t){v(e,t.message),$(t.message)}}async function Lc(){$("");const e=Rn();try{const t=Pc({requirePassword:!0});v(e,"Logging in...");const a=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});n.token=a.token,me(a.user),An(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(a.trade?.signature,"password-login")}catch(t){v(e,t.message),$(t.message)}}function xc(){return Nr(["[data-connect-login-email]","[data-login-email]"]).trim()}function Vf(){return Nr(["[data-connect-login-code]","[data-login-code]"]).trim()}function Mc(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function zf(){$("");const e=Rn();try{const t=Mc(xc());v(e,"Sending login code...");const a=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});v(e,a.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){v(e,t.message),$(t.message)}}async function jf(){$("");const e=Rn();try{const t=Mc(xc()),a=Vf();if(!a)throw new Error("Enter the login code from your email.");v(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:a})});n.token=r.token,me(r.user),An(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(r.trade?.signature,"email-code-login")}catch(t){v(e,t.message),$(t.message)}}function Bc(e="",t=new URLSearchParams){const a=Sc(),r=t.get("sw_wallet_state")||"";if(!a.stateId||a.stateId!==r||a.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(a.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const s=t.get(kc(e))||"",o=t.get("nonce")||"",c=t.get("data")||"";if(!s||!o||!c)throw new Error("Wallet approval did not return the expected connection data.");const l=window.nacl;if(!l?.box?.before||!l.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=l.box.before(Dr(s),Dr(a.dappEncryptionSecretKey)),d=l.box.open.after(Dr(c),Dr(o),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const p=JSON.parse(new TextDecoder().decode(d)),f=String(p.public_key||p.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(p.session||""),walletEncryptionPublicKey:s,dappEncryptionPublicKey:a.dappEncryptionPublicKey,returnPath:a.returnPath||"/terminal"}}async function Rc(e="",t={}){const a=On();await Y(a,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Fe(e)})});me(r.user||{...n.user,connectedWallet:r.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:Fe(e),tokens:[]};try{window.sessionStorage?.setItem(`${Wm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Qo(),En(),n.walletConnectMenuOpen=!1,re(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),Te(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),qr("mobile-wallet-connect")}function Gf(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||Sc().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(a=>a!=="data"&&a!=="nonce"),walletEncryptionPublicKey:t.get(kc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function Xf(e="",t={}){t.token&&(n.token=t.token,An(n.token)),me(t.user||{...n.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const a=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";a&&(n.connectedWalletBalance={publicKey:a,shortPublicKey:w(a),provider:t.provider||Fe(e),tokens:[]}),Qo(),En(),n.walletConnectMenuOpen=!1,re(a?`Connected ${w(a)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),Te(t.finalRedirectRoute||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),qr("mobile-wallet-callback")}async function Ic(e="",t=new URLSearchParams){const a=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:kn,body:JSON.stringify(Gf(e,t))});return await Xf(e,a),!0}async function Jf(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;n.walletConnectMenuOpen=!0;const a=Fe(t),r=e.get("sw_wallet_pending")||"",s=e.get("errorCode")||"",o=e.get("errorMessage")||"";if(s||o)return r&&await Ic(t,e).catch(()=>{}),Qo(),En(),re(`${a} did not connect: ${o||s||"request cancelled"}. Choose another wallet or try again.`),It(t,new Error(o||s||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:oa()}),h({force:!0}),!0;try{if(re(`Finishing ${a} mobile connection...`),r)await Ic(t,e);else{const c=Bc(t,e);await Rc(t,c)}}catch(c){if(r)try{const l=Bc(t,e);await Rc(t,l)}catch{re(`${a} mobile connection could not finish: ${c.message}`),It(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:oa()}),En(),h({force:!0})}else re(`${a} mobile connection could not finish: ${c.message}`),It(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:oa()}),En(),h({force:!0})}return!0}async function Yf(){$("");const e=On()||Rn();try{v(e,"Choose a wallet provider to connect."),da({returnPath:"/terminal"})}catch(t){v(e,t.message),$(t.message)}}async function Qf(){n.user||await Zo(),n.user&&(n.walletConnectMenuOpen=!1,n.route="terminal",n.activeTab="wallets",n.toolSections={...n.toolSections||{},wallets:n.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),n.wallets.length||await gd())}async function Zf(){if(n.logoutPending)return;if(!n.user){n.loginCollapsed=!1,h(),xn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await Zu("logging out");const e=String(n.token||"");n.logoutPending=!0;const t=m("[data-logout]");t&&(t.disabled=!0,v(t,"Logging out...")),n.token="",n.user=null,n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="",n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},n.manualSellActions={},n.tradeActionLocks={},n.ogreAgentStatus="",Tl(),ko(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{n.logoutPending=!1}}async function eh(){if(!n.token){h();return}try{const e=await k("/api/web/me");me(e.user),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),De({force:!1,deep:!1,reason:"session-load"}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})})}catch{n.token="",ko(),h()}}async function ia(e={}){const t=L();if(!n.user||!n.token){n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.launchWatches=[],n.presets={trade:[],bundle:[]},n.tradePlans=[],n.watchlist={rows:[],count:0},h();return}const a=!e.silent;a&&(n.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,g,S,A,T]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.pnl=y.pnl||null,n.launchWatches=g.watches||[],n.presets=S.presets||{trade:[],bundle:[]},Ed(),n.watchlist=A.watchlist||{rows:[],count:0},n.tradePlans=T.plans||[],fs();return}const[s,o,c,l,u,d,p,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.wallets=s.wallets||[],n.balances=o.balances||[],n.connectedWalletBalance=o.connectedWallet||c.connectedWallet||null,n.positions=c.positions||[],n.pnl=l.pnl||null,n.launchWatches=u.watches||[],n.presets=d.presets||{trade:[],bundle:[]},Ed(),n.watchlist=p.watchlist||{rows:[],count:0},n.tradePlans=f.plans||[],fs(),e.force&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="")}finally{H("load-all",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e.skipCore?"skip-core":"core"}),a&&(n.loading=!1),h()}}async function ei(e={}){if(!n.user||!n.token)return;const t=L(),a=e.requestId||0,r=()=>a&&n.walletRefreshRequestId!==a,s=e.force?"?force=true":"",o=e.force||e.deep?"?force=true":"",c=e.timeoutMs||kn,l=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${s}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),p=await u;if(r())return;n.balances=p.balances||[],n.connectedWalletBalance=p.connectedWallet||null,n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("wallet-refresh",t,{component:"wallet",resultCount:n.balances.length,cacheHit:!!p.cacheHit,details:`wallets=${n.wallets.length};connected=${!!n.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([l.then(g=>({ok:!0,wallets:g})).catch(g=>({ok:!1,error:g})),d.then(g=>({ok:!0,tradePlans:g})).catch(g=>({ok:!1,error:g}))]);if(!r()&&(f.ok&&(n.wallets=f.wallets.wallets||n.wallets||[]),y.ok&&(n.tradePlans=y.tradePlans.plans||n.tradePlans||[],fs()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const g=L(),S=k(`/api/web/positions${o}`,{timeoutMs:c}).catch(A=>({__error:A}));try{const A=await S;if(A?.__error)throw A.__error;if(r())return;n.connectedWalletBalance=A.connectedWallet||n.connectedWalletBalance||null,n.positions=A.positions||[],n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",g,{component:"positions",resultCount:n.positions.length,cacheHit:!!A.cacheHit,details:`open=${n.positions.length}`})}catch(A){n.walletRefreshError=A.message||"Position refresh failed.",H("positions-refresh",g,{errorCode:A?.code||A?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(A?.message||"Position refresh failed.")})}}}function Oc(e=n.positions){return(Array.isArray(e)?e:[]).some(t=>{const a=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!a&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Ec(e=120,t="positions-value-followup"){!n.user||!n.token||(Br&&window.clearTimeout(Br),Br=window.setTimeout(()=>{Br=null,yt({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Yt}).then(a=>{a?(n.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})):Ur(`${t}-failed`)}).catch(()=>Ur(`${t}-failed`))},Math.max(0,Number(e)||0)))}function th(e=[],t=[],a={}){const r=new Map((Array.isArray(t)?t:[]).map(s=>[String(s?.tokenMint||""),s]));return(Array.isArray(e)?e:[]).map(s=>{const o=r.get(String(s?.tokenMint||""));if(!o||a.fast===!1)return s;const c=!!(s?.valuePending||/refreshing|updating|background/i.test(s?.valueError||"")),l=o.estimatedValueSol!==null&&o.estimatedValueSol!==void 0&&o.estimatedValueSol!=="";return!c||!l?s:{...s,estimatedValueSol:o.estimatedValueSol,openPnlSol:o.openPnlSol,openPnlPercent:o.openPnlPercent,valuePending:!1,valueError:""}})}function Ur(e="positions-value-refresh-delayed"){let t=!1;return n.positions=(Array.isArray(n.positions)?n.positions:[]).map(a=>{const r=a?.estimatedValueSol!==null&&a?.estimatedValueSol!==void 0&&a?.estimatedValueSol!=="";return!(a?.valuePending||/refreshing|updating|background/i.test(a?.valueError||""))?a:(t=!0,{...a,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(H("positions-value-refresh-cleanup",L(),{component:"positions",details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):!1}function Fc(e="portfolio-supplemental"){if(!n.user||!n.token)return;const t=L();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Yt}),k("/api/web/pnl?force=true",{timeoutMs:Yt,dedupe:!1})]).then(([a,r])=>{a.status==="fulfilled"&&(n.balances=a.value.balances||n.balances||[],n.connectedWalletBalance=a.value.connectedWallet||n.connectedWalletBalance||null),r.status==="fulfilled"&&(n.pnl=r.value.pnl||n.pnl||null),n.lastWalletRefreshAt=new Date().toISOString(),H("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}).catch(()=>{})}async function yt(e={}){if(!n.user||!n.token)return;const t=L(),a=new URLSearchParams;e.force&&a.set("force","true"),e.fast!==!1&&a.set("fast","true");const r=a.toString()?`?${a.toString()}`:"",s=r||"full";if(Ln&&Po===s)return Ln;const o=++Co;return Po=s,Ln=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Yt:vo)});return Co!==o?!1:(n.connectedWalletBalance=c.connectedWallet||n.connectedWalletBalance||null,n.positions=th(c.positions||n.positions||[],n.positions||[],e),n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",t,{component:"positions",resultCount:n.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Oc(n.positions)&&Ec(120,`${e.reason||"positions"}-values`),e.syncPnl&&Fc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(n.walletRefreshError=c.message||"Position refresh failed."),H("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(c?.message||"Position refresh failed.")}),!1}finally{Co===o&&(Ln=null,Po="")}})(),Ln}async function ah(e={}){if(!n.user||!n.token){$("Connect your wallet before refreshing positions."),Ke("error",{error:"Wallet not connected"});return}const t=L();za("refreshing",{startedAt:n.positionRefreshAction?.startedAt||t}),n.walletRefreshError="",Ie("[data-sync-health]",Gr()),le(),await Le(20);try{if(!await yt({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Yt}))throw new Error(n.walletRefreshError||"Position refresh failed.");n.lastWalletRefreshAt=new Date().toISOString(),Ke("success",{error:""}),Fc(`${e.reason||"positions-only"}-balances-pnl`),Oc(n.positions)&&Ec(120,`${e.reason||"positions-only"}-full-values`),H("positions-only-refresh",t,{component:"positions",resultCount:n.positions.length,details:e.reason||"positions-only"})}catch(a){const r=a?.message||"Position refresh failed.";n.walletRefreshError=r,Ke("error",{error:N(r)}),$(r),H("positions-only-refresh",t,{errorCode:a?.code||a?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(r)})}finally{h()}}function Wn(){return String(n.smartChartToken||n.tradeToken||n.bundleToken||n.volumeToken||n.terminalToken||"").trim()}function ze(e=n.activeTab){return yf[e]||null}function Xa(e=ze()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",Un(n.livePairBucket)).replace("{sort}",String(n.terminalSort||"best")).replace("{scopeMode}",String(n.slimeScopeMode||"new")).replace("{kolMode}",String(n.kolMode||"hot")).replace("{kolWallet}",n.kolWallet?w(n.kolWallet):"global").replace("{scanMode}",String(n.scanMode||"safe")).replace("{tokenMint}",Wn()?w(Wn()):"none")}function Wc(e=n.activeTab,t="pageSize",a=25){const r=ze(e),s=Number(r?.[t]);return Number.isFinite(s)&&s>0?s:a}function Ja(e=n.activeTab){return Wc(e,"pageSize",25)}function ti(e=n.activeTab){return Math.max(Ja(e),Wc(e,"maxPageSize",Ja(e)))}function _c(e=n.activeTab){return!!ze(e)?.supportsPagination}function ai(e=n.activeTab){const t=ze(e)||{tabKey:e};return`${e}:${Xa(t)}`}function _n(e=n.activeTab,t=0){const a=ai(e),r=Ja(e),s=ti(e),o=Number(n.terminalFeedVisibleLimits?.[a]||0),c=Number.isFinite(o)&&o>0?o:r,l=Number(t||0),u=Math.min(Math.max(r,c),s);return l>0?Math.min(u,l):u}function Z(e=n.activeTab){const t=ai(e);if(!n.terminalFeedVisibleLimits?.[t])return;const a={...n.terminalFeedVisibleLimits||{}};delete a[t],n.terminalFeedVisibleLimits=a}function nh(e=n.activeTab,t=0){const a=ai(e),r=_n(e,t),s=Ja(e),o=ti(e),c=Number(t||0),l=Math.min(o,c>0?c:o,r+s);return n.terminalFeedVisibleLimits={...n.terminalFeedVisibleLimits||{},[a]:l},l}function nt(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return a.slice(0,_n(e,a.length))}function rh(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return _c(e)&&a.length>_n(e,a.length)}function la(e=n.activeTab,t=[],a="rows"){const r=Array.isArray(t)?t:[];if(!rh(e,r))return"";const s=_n(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${i(s)} of ${i(r.length)} ${i(a)} shown</small>
      <button type="button" data-terminal-load-more="${i(e)}">Load More</button>
    </div>
  `}function z(e=n.activeTab){return n.terminalFeeds[e]||{}}function Nc(e=n.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?ca():e==="kol"?n.kolLastUpdatedAt||"":e==="watchlist"?z("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?n.lastWalletRefreshAt||z(e).lastFetchAt||"":z(e).lastFetchAt||""}function Ot(e=n.activeTab){return e==="terminal"?Number(Ne()?.rows?.length||0)+Number(n.kolScan?.rows?.length||0):e==="live"?Number(Ne()?.rows?.length||0):e==="liveTrades"?Number(n.pnl?.trades?.length||0):e==="slimeScope"?Number(wp?.(n.slimeScopeMode)?.length||0):e==="kol"?Number(n.kolScan?.rows?.length||0):e==="watchlist"?Number(n.watchlist?.rows?.length||0):e==="smartChart"?Wn()?1:Number(ur?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?Wn()?1:0:e==="sniper"?Number(n.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(n.launchWatches?.length||0):e==="wallets"?Number(n.wallets?.length||0)+Number(n.balances?.length||0):e==="positions"?Number(n.positions?.length||0):e==="pnl"?Number(n.pnl?.trades?.length||0):e==="ogreAi"?n.ogreAiResult?1:0:e==="ogreTek"?Number(n.ogreTek?.markets?.length||0)+Number(n.ogreTek?.positions?.length||0):0}function Nn(e=n.activeTab){const t=Ot(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,_n(e,t)):t}function Dn(e=n.activeTab){const t=ze(e);if(!t)return!1;const a=Date.parse(Nc(e)||"");return Number.isFinite(a)?Date.now()-a>Number(t.staleMs||3e4):!0}function Dc(e=n.activeTab){return Ot(e)>0||!!Nc(e)}function sh(e=n.activeTab,t={}){const a=ze(e)||{};return{tabKey:e,label:a.label||e,category:a.category||"unknown",endpoint:a.endpoint||"",cacheKey:Xa(a),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Nn(e)??0),pageSize:Ja(e),maxPageSize:ti(e),supportsPagination:_c(e),hasMore:!!(t.hasMore??Ot(e)>Nn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function Uc(e=n.activeTab,t={}){const a=sh(e,t);if(n.terminalFeedLog=[...n.terminalFeedLog||[],a].slice(-20),Vo(_m,()=>n.terminalFeedLog,"feed"),a.status==="error"||a.status==="timeout"||/manual|post-trade|visibility|resume/i.test(a.reason||"")||!!(a.stale&&a.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(a)}).catch(()=>{})}catch{}return a}function oh(e=n.activeTab,t={}){const a=ze(e);if(!a)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return n.terminalFeeds={...n.terminalFeeds,[e]:{...z(e),label:a.label,category:a.category,endpoint:a.endpoint,cacheKey:Xa(a),refreshMs:a.refreshMs,staleMs:a.staleMs,pageSize:a.pageSize,maxPageSize:a.maxPageSize,supportsPagination:!!a.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function ni(e=n.activeTab,t="",a="success",r={}){const s=ze(e);if(!s)return;const o=Ot(e),c=Nn(e),l={...z(e),label:s.label,category:s.category,endpoint:s.endpoint,cacheKey:Xa(s),refreshMs:s.refreshMs,staleMs:s.staleMs,pageSize:s.pageSize,maxPageSize:s.maxPageSize,supportsPagination:!!s.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:a,lastFetchAt:new Date().toISOString(),resultCount:o,renderedCount:c,hasMore:o>c,stale:a!=="success"||Dn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};n.terminalFeeds={...n.terminalFeeds,[e]:l},Uc(e,{requestId:t,status:a,reason:l.lastReason,resultCount:o,renderedCount:c,hasMore:l.hasMore,stale:l.stale,errorCode:l.errorCode,errorMessage:l.errorMessage})}function ih(e=n.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function lh(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function ee(e=n.activeTab,t={}){const a=L(),r=ze(e);if(!r)return null;if(t.ifStale&&Dc(e)&&!Dn(e)||z(e).inFlight)return z(e);const s=lh(t),o=Date.now(),c=Number(Wl.get(e)||0);if(!s&&c&&o-c<$n)return z(e);if(ih(e)&&!n.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return ni(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),z(e);Wl.set(e,o);const l=oh(e,t);if(s&&t.renderStart!==!1){const u=n.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[Et({silent:!0,force:!!t.force})];n.kolWallet||u.push(jr(n.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await Kr({silent:t.silent!==!1,bucket:n.livePairBucket,force:!!t.force});else if(e==="liveTrades")n.user&&n.token&&await ia({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[Et({silent:!0,force:!!t.force}),Hn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];n.kolScan||u.push(jr(n.kolMode,n.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await jr(n.kolMode,n.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await Kc({silent:t.silent!==!1});else if(e==="sniper")await Hn(n.scanMode,{silent:t.silent!==!1});else if(e==="positions")n.user&&n.token&&await yt({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:vo});else if(["wallets","pnl"].includes(e))n.user&&n.token&&await De({force:!!t.force,deep:!1});else if(e==="smartChart")n.user&&n.token&&await De({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[Et({silent:!0,force:!!t.force})];n.user&&n.token&&u.push(ia({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[Et({silent:!0,force:!!t.force})];n.scan||u.push(Hn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),n.user&&n.token&&u.push(ia({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await yr({silent:!0}).catch(u=>{n.ogreTek.error=u.message});return ni(e,l,"success"),z(e)}catch(u){if(ni(e,l,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:N(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return z(e)}finally{H("feed-refresh",a,{component:r.component||e,resultCount:Ot(e),cacheHit:!!z(e).cacheHit,stale:Dn(e),requestId:z(e).lastRequestId||"",errorCode:z(e).errorCode||"",details:`${e}:${Xa(r)}`}),t.render!==!1&&(!s&&ci()?Jc():h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"&&e==="smartChart"}))}}async function Ya(e={}){const t=n.activeTab||"terminal",a=[ee(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(a)}function qr(e="terminal-entry"){n.route==="terminal"&&(Ya({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),n.user&&n.token&&De({force:!0,deep:!1,reason:e}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})}))}function ri(){const e=()=>{Wa&&clearTimeout(Wa),Wa=null,Lr=""};if(n.route!=="terminal"||document.hidden){e();return}const t=ze(n.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(n.activeTab)){e();return}const a=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${n.activeTab}:${Xa(t)}:${a}`;Wa&&Lr===r||(e(),Lr=r,Wa=setTimeout(async()=>{Wa=null,Lr="",!(n.route!=="terminal"||document.hidden)&&(await ee(n.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(s=>$(s.message)),ri())},a))}function Un(e){const t=String(e||"live");return Bt.some(([a])=>a===t)?t:"live"}function qc(e=n.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Hr(e=n.activeTab){return e==="slimeScope"?qc(n.slimeScopeMode):Un(n.livePairBucket)}function Ne(e=Hr()){const t=Un(e);return n.livePairsByBucket[t]||(t===n.livePairBucket?n.livePairs:null)||null}function ca(e=Hr()){const t=Un(e);return n.livePairsLastUpdatedByBucket[t]||(t===n.livePairBucket?n.livePairsLastUpdatedAt:"")||""}function Hc(e=[]){return Array.isArray(e)&&e.length>0}function Oe(e={},t={},a=[]){for(const r of a){const s=e?.[r];if(s!=null&&s!=="")return s}for(const r of a){const s=t?.[r];if(s!=null&&s!=="")return s}return""}function ch(e=[],t=[]){const a=new Map((Array.isArray(e)?e:[]).map(r=>[ba(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const s=a.get(ba(r));return s?{...s,...r,tokenMint:Oe(r,s,["tokenMint","mint","tokenAddress","address"]),mint:Oe(r,s,["mint","tokenMint","tokenAddress","address"]),symbol:Oe(r,s,["symbol","ticker","shortMint"]),name:Oe(r,s,["name","tokenName","category"]),imageUrl:Oe(r,s,["imageUrl","image","icon","logoURI","logoUrl"]),image:Oe(r,s,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Oe(r,s,["avatarUrl","avatar_url","avatar"]),avatarState:Oe(r,s,["avatarState"]),dexUrl:Oe(r,s,["dexUrl","url"]),pumpUrl:Oe(r,s,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Oe(r,s,["websiteUrl","website"]),twitterUrl:Oe(r,s,["twitterUrl","xUrl"]),telegramUrl:Oe(r,s,["telegramUrl"]),metadata:r?.metadata||s?.metadata||r?.tokenMetadata||s?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||s?.tokenMetadata||r?.metadata||s?.metadata||null,dex:r?.dex||s?.dex||r?.dexScreener||s?.dexScreener||null,pump:r?.pump||s?.pump||r?.pumpFun||s?.pumpFun||null}:r})}async function Kr({silent:e=!1,bucket:t=n.livePairBucket,renderOnComplete:a=!0,force:r=!1}={}){const s=L(),o=Un(t),c=o===n.livePairBucket,l=n.terminalSort||"best",u=`${o}:${l}`,d=Or.get(u);if(d?.promise){n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:d.requestId},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const A=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);return!e&&!Hc(A)&&qa(ql),d.promise}const p=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(Lo[o]||0)+1;Lo[o]=f;const y=()=>Lo[o]===f;n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:p},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const g=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);!e&&!Hc(g)&&qa(ql);const S=(async()=>{try{const A=r?"&force=true":"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(o)}&sort=${encodeURIComponent(l)}${A}`,b=await Promise.race([k(T),new Promise((U,_e)=>window.setTimeout(()=>_e(new Error("Live feed refresh timed out.")),12e3))]),P=Bt.find(([U])=>U===o)?.[1]||"Live",C=n.livePairsByBucket[o]||(c?n.livePairs:null);let M=b.livePairs||{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${P} feed returned no rows yet. Retrying automatically.`};const q=Array.isArray(M?.rows)?M.rows:[],J=Array.isArray(C?.rows)?C.rows:[];if(q.length===0&&J.length>0?M={...C,...M,rows:C.rows,stale:!0,emptyRefresh:!0,message:`${P} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:q.length>0&&J.length>0&&(M={...M,rows:ch(J,q)}),!y())return M;const ke=M?.refreshedAt||new Date().toISOString(),et={...n.livePairsRefreshErrorByBucket||{}};return delete et[o],n.livePairsRefreshErrorByBucket=et,n.livePairsByBucket={...n.livePairsByBucket,[o]:M},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:ke},c&&(n.livePairs=M,n.livePairsLastUpdatedAt=ke),M}catch(A){const T=N(A?.message||"Live feed refresh failed."),b=Bt.find(([M])=>M===o)?.[1]||"Live",P=n.livePairsByBucket[o]||(c?n.livePairs:null),C=P?{...P,stale:!0,refreshError:T,message:`Showing last good ${b} feed. Refresh failed, retrying automatically.`}:{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:T,message:`${b} refresh failed. Retrying automatically.`};return y()&&(n.livePairsRefreshErrorByBucket={...n.livePairsRefreshErrorByBucket||{},[o]:T},n.livePairsByBucket={...n.livePairsByBucket,[o]:C},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:C.refreshedAt},c&&(n.livePairs=C,n.livePairsLastUpdatedAt=C.refreshedAt)),C}finally{if(!y())return;const A=n.livePairsByBucket?.[o]?.rows||[];H("live-pairs-refresh",s,{component:"livePairs",resultCount:Array.isArray(A)?A.length:0,stale:!!n.livePairsByBucket?.[o]?.stale,errorCode:n.livePairsRefreshErrorByBucket?.[o]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${o}:${l}`});const T={...n.livePairsLoadingByBucket};(T[o]===p||T[o]===!0)&&(delete T[o],n.livePairsLoadingByBucket=T),n.livePairsLoading=!!T[n.livePairBucket],!e&&c&&(n.loading=!1),a&&(c&&["terminal","live","slimeScope"].includes(n.activeTab)?qa("load-live-pairs-complete"):h())}})();return Or.set(u,{requestId:p,requestVersion:f,safeBucket:o,promise:S}),S.finally(()=>{Or.get(u)?.requestId===p&&Or.delete(u)}),S}async function Et({silent:e=!1,force:t=!1,warmAll:a=!1}={}){if(await Kr({silent:e,bucket:n.livePairBucket,force:t}),a){const r=Bt.map(([s])=>s).filter(s=>s!==n.livePairBucket);await Promise.allSettled(r.map(s=>Kr({silent:!0,bucket:s,renderOnComplete:!1,force:t})))}(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope")&&qa(a?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function ua(){if(Vn()||document.hidden||Da()||n.activeTab!=="live"&&n.activeTab!=="terminal"&&n.activeTab!=="slimeScope"){Ua();return}const e=Hr(n.activeTab),a=(n.activeTab==="slimeScope"?12:8)*1e3,r=`${n.activeTab}:${e}:${n.terminalSort}:${a}`;Ra&&Tr===r||(Ua(),Tr=r,Ra=setTimeout(async()=>{if(Ra=null,Tr="",document.hidden||Da()){ua();return}if(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"){if(n.livePairsLoadingByBucket?.[e]){ua();return}try{n.activeTab==="slimeScope"?await ee("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Kr({silent:!0,bucket:n.livePairBucket,force:!1})}catch{}finally{ua()}}},a))}function uh({force:e=!1}={}){if(Vn()||!(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"))return;const a=Hr(n.activeTab),r=`${a}:${n.terminalSort||"best"}`;To.has(r)||n.livePairsLoadingByBucket[a]||!e&&n.livePairsByBucket[a]||(To.add(r),window.setTimeout(()=>{const s=n.activeTab==="slimeScope"?ee("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):Et({silent:!0,force:!0,warmAll:!1});Promise.resolve(s).catch(o=>$(o.message)).finally(()=>{To.delete(r),ua()})},900))}function Vr(){const e=()=>{Ia&&clearTimeout(Ia),Ia=null,Ar=""};if(document.hidden||n.activeTab!=="sniper"){e();return}const t=`${n.activeTab}:${n.scanMode}`;Ia&&Ar===t||(e(),Ar=t,Ia=setTimeout(async()=>{if(Ia=null,Ar="",document.hidden){Vr();return}if(n.activeTab==="sniper"){if(n.loading){Vr();return}try{await Hn(n.scanMode,{silent:!0})}catch(a){$(a.message)}finally{Vr()}}},2e4))}function qn(){const e=()=>{Oa&&clearTimeout(Oa),Oa=null,Pr=""};if(Vn()||document.hidden||n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet){e();return}const t=String(n.kolMode||"hot"),s=t==="hot"||t==="fresh"?1e4:3e4,o=`${n.activeTab}:${n.kolMode}:${s}`;Oa&&Pr===o||(e(),Pr=o,Oa=setTimeout(async()=>{if(Oa=null,Pr="",document.hidden){qn();return}if(!(n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet)){if(n.kolLoading){qn();return}try{await jr(n.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{qn()}}},s))}function zr(){const e=()=>{Fa&&clearTimeout(Fa),Fa=null,Cr=""};if(Vn()||document.hidden||n.activeTab!=="watchlist"&&n.activeTab!=="terminal"||!n.user||!n.token){e();return}const t=`${n.activeTab}:${n.user?.id||"guest"}`;Fa&&Cr===t||(e(),Cr=t,Fa=setTimeout(async()=>{if(Fa=null,Cr="",document.hidden){zr();return}if(!(n.activeTab!=="watchlist"&&n.activeTab!=="terminal"))try{await Kc({silent:!0})}catch(a){$(a.message)}finally{zr()}},3e4))}async function Hn(e=n.scanMode,t={}){const a=L(),r=!!t.silent;n.scanMode=e,r||(n.loading=!0,h());try{const s=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);n.scan=s.scan}finally{H("scanner-refresh",a,{component:"sniper",resultCount:Array.isArray(n.scan?.candidates)?n.scan.candidates.length:0,details:e}),r||(n.loading=!1),h()}}async function jr(e=n.kolMode,t=n.kolWallet,a={}){const r=L(),s=!!a.silent;n.kolMode=e,n.kolWallet=String(t||"").trim();let o="";n.kolWallet&&!_t(n.kolWallet)&&(n.kolWallet="",o="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!s&&!n.kolScan&&(n.loading=!0),n.kolLoading=!0,n.kolStatus=o||(n.kolWallet?"Scanning custom KOL wallet...":`Loading ${ar(n.kolMode)}...`),$(""),s||h();try{const c=new URLSearchParams({mode:e});n.kolWallet&&c.set("wallet",n.kolWallet);const l=await k(`/api/web/kol/scan?${c.toString()}`);n.kolScan=l.scan,n.kolLastUpdatedAt=new Date().toISOString(),n.kolStatus=l.scan?.message||`${ar(n.kolMode)} loaded.`,n.kolDumpStatsLoadedAt=0}catch(c){throw n.kolStatus=c.message||"KOL scan failed.",c}finally{H("kol-refresh",r,{component:"kol",resultCount:Array.isArray(n.kolScan?.rows)?n.kolScan.rows.length:Array.isArray(n.kolScan?.signals)?n.kolScan.signals.length:0,errorCode:n.kolStatus&&/failed/i.test(n.kolStatus)?"KOL_REFRESH_FAILED":"",details:n.kolWallet?"wallet":e}),s||(n.loading=!1),n.kolLoading=!1,h()}}async function Kc(e={}){if(!n.user||!n.token)return;const t=L(),a=!!e.silent;n.watchlistLoading=!0,a||h();try{const r=await k("/api/web/watchlist");n.watchlist=r.watchlist||{rows:[],count:0}}finally{H("watchlist-refresh",t,{component:"watchlist",resultCount:n.watchlist?.count||n.watchlist?.rows?.length||0}),n.watchlistLoading=!1,h()}}function dh(){return n.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function ph(){const e=Number(n.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function Ft(){return dh()+ph()}const mh=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Ee(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function fh(){const e=new Map,t=(a={})=>{const r=Ee(a.mint||a.tokenMint||"");if(!r||e.has(r))return;const s=a.balance??a.uiAmount??a.amount??a.uiBalance??"";e.set(r,{mint:r,symbol:String(a.symbol||a.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(a.name||a.label||"").trim(),balance:s,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${Ft().toFixed(4)} SOL`}),rt().forEach(a=>t({mint:a.tokenMint||a.mint,symbol:a.symbol||a.shortMint,name:a.name||"",balance:a.uiAmount||a.amountToken||"",kind:"wallet"})),(n.balances||[]).forEach(a=>{(a.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function si(e={}){const t=new Map,a=(s={})=>{const o=Ee(s.mint||s.tokenMint||"");!o||t.has(o)||t.set(o,{mint:o,symbol:String(s.symbol||s.shortMint||(o==="SOL"?"SOL":w(o))||"").trim(),name:String(s.name||s.label||"").trim(),balance:s.balance??s.uiAmount??s.amount??"",kind:s.kind||s.source||"held"})};return fh().forEach(a),e.walletOnly||mh.forEach(s=>{s.mint!=="SOL"&&a(s)}),[...t.values()]}function Vc(e=""){const t=Ee(e);return si().find(a=>a.mint===t)||null}function zc(e="",t={}){const a=Ee(e),r=t.includeCustom!==!1,s=si({walletOnly:!!t.walletOnly}),o=s.some(u=>u.mint===a);return`${s.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||w(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${i(u.mint)}" ${a===u.mint?"selected":""}>${i(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!a||!o)?"selected":""}>Custom CA</option>`:""}`}function oi(){const e=Ee(n.tradeSwapFrom||"SOL")||"SOL";return si({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function jc(){const e=oi(),t=Ee(n.tradeSwapTo||""),a=Ee(n.tradeToken||"");return t&&t!==e?t:a&&a!==e||e==="SOL"?a:"SOL"}function hh(){const e=oi(),t=jc();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Ee(n.tradeToken||"")?n.swapDirection==="sell"?"sell":"buy":"select"}function gh(e="buy"){const t=Ee(m("[data-swap-from]")?.value||n.tradeSwapFrom||""),a=Ee(m("[data-swap-to]")?.value||n.tradeSwapTo||""),r=String(m("[data-trade-token]")?.value||n.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:a&&a!=="SOL"?a:r}function Gc(){return(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey?(n.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const a=String(t.mint||t.tokenMint||"").trim();return{tokenMint:a,shortMint:t.shortMint||w(a),symbol:t.symbol||t.shortMint||w(a),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||Q(a),pumpUrl:Kf(a),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function rt(){const e=new Set,t=[];for(const a of[...n.positions||[],...Gc()]){const r=String(a?.tokenMint||a?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(a))}return t}function ii(){const e=n.connectedWalletBalance?.publicKey||n.user?.connectedWallet?.publicKey||"";return n.wallets.length+(e?1:0)}function li(){return n.pnl?.totals?.realizedSol||"+0 SOL"}function Qa(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Kn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function Gr(){if(n.walletRefreshing||n.walletRefreshStatus==="refreshing")return"Syncing";if(n.walletRefreshStatus==="timeout")return"Delayed";if(n.walletRefreshError||n.walletRefreshStatus==="error")return"Retry";const e=Qa(n.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function bh(){const e=oe("trade",n.selectedTradePresetId),t=oe("bundle",n.selectedBundlePresetId),a=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${a} | ${r}`}async function Xc(){if(!n.user||!n.token)return;const e=L();try{const[t,a]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(n.pnl=t.value.pnl||n.pnl||null),a.status==="fulfilled"&&(n.tradePlans=a.value.plans||n.tradePlans||[],fs()),H("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(n.tradePlans?.length||0)+(n.pnl?1:0),details:"pnl,trade-plans"})}catch(t){H("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:N(t?.message||"Post-trade supplemental refresh failed.")})}}function yh(e=350,t={}){xr&&window.clearTimeout(xr),xr=window.setTimeout(async()=>{if(xr=null,!(!n.user||!n.token))try{t.reason==="post-trade"?await Promise.all([Xc(),yt({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([ia({force:!1,skipCore:!0,silent:!0}),yt({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(a){n.walletRefreshError=a.message||"Background refresh failed.",h()}},e)}async function De({force:e=!1,deep:t=!1,reason:a="manual"}={}){if(!n.user||!n.token)return n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="Wallet not connected",Ie("[data-sync-health]","Wallet not connected"),Ke("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(a||"").toLowerCase(),s=r==="manual_header_click",o=r.includes("post-trade");if(e&&!t&&!o&&!s&&Date.now()-Ql<Um?(e=!1,W({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!o&&(Ql=Date.now()),ea)return W({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),n.positionRefreshAction?.state==="clicked"&&za("refreshing",{startedAt:n.positionRefreshAction.startedAt||L()}),ea.finally(()=>{if(["clicked","refreshing"].includes(n.positionRefreshAction?.state)){const u=n.walletRefreshStatus==="error"||n.walletRefreshStatus==="timeout";Ke(u?"error":"success",{error:u?N(n.walletRefreshError||"Refresh delayed"):""})}});const c=L(),l=++of;return n.walletRefreshRequestId=l,ea=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};n.positionRefreshAction?.state==="clicked"&&za("refreshing",{startedAt:n.positionRefreshAction.startedAt||c}),n.walletRefreshing=!0,n.walletRefreshStatus="refreshing",n.walletRefreshError="",Ie("[data-sync-health]",Gr()),Mt("[data-refresh-spinner]",!1),le(),ta&&window.clearTimeout(ta),ta=window.setTimeout(()=>{ta=null,!(n.walletRefreshRequestId!==l||!n.walletRefreshing)&&(n.walletRefreshing=!1,n.walletRefreshStatus==="refreshing"&&(n.walletRefreshStatus="timeout"),ea=null,Ke("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))},yo+6e3),await Le(20);try{if(await Promise.race([ei({force:e,deep:t,preserveSmartChartFrame:n.activeTab==="smartChart",requestId:l,timeoutMs:yo}),new Promise((d,p)=>window.setTimeout(()=>p(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),yo))]),n.walletRefreshRequestId!==l)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:L()-c,fromCache:!1,degraded:!0},u;n.walletRefreshRequestId===l&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshStatus="success"),t?await ia({force:e,skipCore:!0,silent:!0}):((s||o)&&yt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${a}-positions-values`,timeoutMs:Yt}).then(d=>{d?h({preserveSmartChartFrame:n.activeTab==="smartChart"}):Ur(`${a}-positions-values-failed`)}).catch(()=>Ur(`${a}-positions-values-failed`)),yh(o?200:350,{reason:a})),H("wallet-refresh-total",c,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:t?"deep":`core-plus-background:${a}`}),Ke("success",{error:""}),u={ok:!0,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:"",durationMs:L()-c,fromCache:!1,degraded:!1}}catch(d){const p=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));n.walletRefreshRequestId===l&&(n.walletRefreshStatus=p?"timeout":"error",n.walletRefreshError=d.message||"Refresh failed."),p&&!r.includes("auto-retry")&&n.user&&n.token&&window.setTimeout(()=>{n.user&&n.token&&n.walletRefreshStatus!=="success"&&De({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),H("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:N(n.walletRefreshError)}),Ke("error",{error:N(n.walletRefreshError)}),$(n.walletRefreshError),u={ok:!1,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:N(n.walletRefreshError),durationMs:L()-c,fromCache:!1,degraded:!0}}finally{ta&&(window.clearTimeout(ta),ta=null),n.walletRefreshRequestId===l&&(n.walletRefreshing=!1),ea=null,h({preserveSmartChartFrame:n.activeTab==="smartChart"})}return u})(),ea}async function vt({force:e=!0,reason:t="manual_header_click",deep:a=!1}={}){return De({force:e,reason:t,deep:a})}function Vn(){return!!n.postTradeRefresh?.active&&Number(n.postTradeRefresh?.activeUntil||0)>Date.now()}async function qk(e="",t="legacy-post-trade"){K(e,t)}function K(e="",t="post-trade",a={}){e&&(n.lastTradeSignature=e),xt.length&&(xt.forEach(o=>window.clearTimeout(o)),xt=[]);const r=a.tradeAttemptId||bt("post-trade"),s=Array.isArray(a.affectedKeys)&&a.affectedKeys.length?a.affectedKeys.slice(0,12).map(o=>ve(o,48)):Gm;n.postTradeRefresh={active:!0,attemptId:r,action:ve(t,70),signaturePresent:!!e,invalidatedKeys:s,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},W({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:s.length,details:s.join(",")}),Hm.forEach(o=>{const c=window.setTimeout(()=>{xt=xt.filter(p=>p!==c);const l=Number(n.postTradeRefresh?.requestCount||0)+1;n.postTradeRefresh={...n.postTradeRefresh||{},requestCount:l},W({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:n.postTradeRefresh.requestCount,details:t});const u=L();(l<=1?De({force:!0,deep:!1,reason:"post-trade"}):Promise.all([yt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Yt}),Xc()])).catch(p=>{n.walletRefreshError=p.message||"Post-trade refresh failed.",n.postTradeRefresh={...n.postTradeRefresh||{},errors:[...n.postTradeRefresh?.errors||[],N(p.message||"Post-trade refresh failed.")].slice(-5)},W({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:L()-u,requestId:r,errorCode:p?.code||p?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{n.postTradeRefresh={...n.postTradeRefresh||{},refreshedKeys:[...new Set([...n.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:xt.length>0,activeUntil:xt.length>0?Date.now()+8e3:Date.now()},W({component:"post-trade",action:"post-trade-refresh-end",durationMs:L()-u,requestId:r,resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:n.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})})},o);xt.push(c)}),le()}function xe({title:e="Confirm",lines:t=[],confirmLabel:a="Confirm",cancelLabel:r="Cancel",danger:s=!1,input:o=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
`);return o?Promise.resolve(window.prompt(c||e,o.value||"")):Promise.resolve(window.confirm(c||e))}return new Promise(c=>{const l=document.createElement("div");l.className="slime-confirm-overlay",l.innerHTML=`
      <div class="slime-confirm-card" role="dialog" aria-modal="true" aria-label="${i(e)}">
        <h3 class="slime-confirm-title">${i(e)}</h3>
        ${[].concat(t).filter(Boolean).map(S=>`<p class="slime-confirm-line">${i(S)}</p>`).join("")}
        ${o?`
          <label class="slime-confirm-input-label">
            ${i(o.label||"")}
            <input class="slime-confirm-input" type="${i(o.type||"text")}" value="${i(o.value||"")}" placeholder="${i(o.placeholder||"")}" ${o.inputmode?`inputmode="${i(o.inputmode)}"`:""}>
          </label>`:""}
        <div class="slime-confirm-actions">
          <button type="button" class="slime-confirm-cancel">${i(r)}</button>
          <button type="button" class="slime-confirm-accept${s?" is-danger":""}">${i(a)}</button>
        </div>
      </div>
    `;const u=document.activeElement,d=l.querySelector(".slime-confirm-input"),p=S=>{l.remove(),document.removeEventListener("keydown",g,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>p(o?d?.value??"":!0),y=()=>p(o?null:!1),g=S=>{S.key==="Escape"?(S.preventDefault(),y()):S.key==="Enter"&&(!o||S.target===d)&&(S.preventDefault(),f())};l.addEventListener("pointerdown",S=>{S.target===l&&y()}),l.querySelector(".slime-confirm-accept").addEventListener("click",f),l.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",g,!0),document.body.appendChild(l),(d||l.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function ci(){if(document.hidden&&n.route==="terminal")return!0;const e=document.activeElement;if(!e||n.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function Jc(){n.pendingRender=!0}function Yc(){!n.pendingRender||ci()||(n.pendingRender=!1,h({force:!0}))}function ui(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Za(){if(!ie||!xn||!ae)return;const e=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);ie.dataset.loading=n.loading?"true":"false",ie.dataset.route=n.route,ie.dataset.walletConnected=e?"true":"false",e&&FS("shell-wallet-context"),e?pu("shell-wallet-context"):Tl(),e||(n.tpslAutoEnableInFlight=!1,n.tpslAutoEnableScheduledAt=0),ui(xn,!["intro","login"].includes(n.route)),ui(tc,n.route!=="connect"),ui(ae,n.route!=="terminal"),Mt("[data-terminal-global-search]",n.route!=="terminal"),Mt("[data-top-sync-strip]",n.route!=="terminal")}function zn(){const e=!!(Pe&&n.loginModalOpen),t=!!n.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const a=m("[data-wallet-connect-modal]");a&&(a.style.pointerEvents=a.hidden?"none":"");const r=m("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function di(e,t=48){if(!e||document.hidden)return!1;try{const a=e.getBoundingClientRect();return a.width<24||a.height<t}catch{return!1}}function Qc(e="resume"){if(!ie||document.hidden)return;Za(),zn();const t=`${Date.now()}:${e}`,a=ie.style.transform;ie.dataset.resumePaint=t,ie.style.transform=a?`${a} translateZ(0)`:"translateZ(0)",ie.offsetHeight,window.requestAnimationFrame(()=>{!ie||ie.dataset.resumePaint!==t||(ie.style.transform=a,delete ie.dataset.resumePaint)})}function vh(){if(!ie)return!1;if(ie.dataset.route!==n.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Pe||Pe.hidden||!n.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!n.quickBuyModal?.open;if(e||t||di(ie,80))return!0;if(n.route!=="terminal")return!1;const a=m("[data-panel]");return ae?.hidden||di(ae,80)||a&&di(a,32)||a&&!a.children.length&&!String(a.textContent||"").trim()?!0:![xn,tc,ae].some(s=>s&&!s.hidden)}function wh(e="watchdog"){const t=n.positionRefreshAction||{},a=t.startedAt?Math.max(0,L()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&a>jm&&(Ke("error",{error:"Refresh delayed"}),W({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:a,details:e})),n.walletRefreshing&&!ea&&(n.walletRefreshing=!1,n.walletRefreshStatus=n.walletRefreshStatus==="refreshing"?"timeout":n.walletRefreshStatus,Mt("[data-refresh-spinner]",!0)),zn(),le()}function Zc(e="watchdog",t={}){return wh(e),vh()?(W({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-Zl),details:`${e}:${n.route}:${n.activeTab||""}`}),Ho({keepLogin:n.route==="login"}),Za(),Qc(e),h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):(t.forcePaint&&Qc(e),!1)}function eu(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function tu(){try{return document.createElement("canvas")}catch{return null}}function au(){const e=tu();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function Sh(){return eu()||au()}function pi(){const e=Ve()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Wt(e),typeof window.alert=="function"&&window.alert(e)}function nu(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function jn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function ru(){const e=n.clipFarm?.fileExtension||jn(n.clipFarm?.mimeType||n.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function Gn(){try{n.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}n.clipFarm?.fallbackFrameTimer&&clearInterval(n.clipFarm.fallbackFrameTimer),n.clipFarm?.fallbackStopTimer&&clearTimeout(n.clipFarm.fallbackStopTimer)}function Wt(e=""){n.clipFarm={...n.clipFarm,status:String(e||"")},je()}function mi(){if(n.clipFarm?.videoUrl)try{URL.revokeObjectURL(n.clipFarm.videoUrl)}catch{}n.clipFarm={...n.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:n.clipFarm?.recording?"Recording...":""},je()}function je(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=n.clipFarm||{},a=Sh(),r=!!t.recording,s=!!(t.blob&&t.videoUrl),o=t.status||(r?"Recording":s?"Clip ready":"Clip farm");e.innerHTML=`
    <div class="clip-farm-control" data-recording="${r?"true":"false"}" data-ready="${s?"true":"false"}">
      <button type="button" class="clip-record-button" data-clip-record data-supported="${a?"true":"false"}" title="${a?"Record a shareable SlimeWire clip":"Tap for recording support details"}" aria-pressed="${r?"true":"false"}">
        <span class="clip-record-dot" aria-hidden="true"></span>
        <strong>${r?"Stop":"Rec"}</strong>
      </button>
      ${s?`
        <div class="clip-share-actions" aria-label="Clip share options">
          <button type="button" data-clip-share title="Share clip">Share</button>
          <button type="button" data-clip-download title="Download clip">Save</button>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent("Farming SlimeWire clips at https://slimewire.org")}" target="_blank" rel="noreferrer" title="Open X">X</a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(Lt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${o?`<small>${i(o)}</small>`:""}
    </div>
  `}function su(){const e=ye([...Ne()?.rows||[],...typeof ur=="function"?ur():[],...n.slimeScopeRows||[],...n.livePairRows||[],...Object.values(n.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:n.smartChartToken||n.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function ou(e,t={}){const a=e?.getContext?.("2d");if(!a)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),s=720,o=1280;(e.width!==s*r||e.height!==o*r)&&(e.width=s*r,e.height=o*r,e.style.width=`${s}px`,e.style.height=`${o}px`),a.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),l=t.rows||su(),u=new Date;a.fillStyle="#020803",a.fillRect(0,0,s,o);const d=a.createRadialGradient(s*.2,o*.12,20,s*.2,o*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),a.fillStyle=d,a.fillRect(0,0,s,o),a.strokeStyle="rgba(118,255,45,0.38)",a.lineWidth=2,a.strokeRect(24,24,s-48,o-48),a.fillStyle="#baff4d",a.font="900 34px Arial, sans-serif",a.fillText("SlimeWire REC",48,88),a.fillStyle="#f4fff0",a.font="800 54px Arial, sans-serif",a.fillText("Fresh Live Picks",48,154),a.fillStyle="rgba(226,255,215,0.78)",a.font="700 22px Arial, sans-serif",a.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const p=s-96;a.fillStyle="rgba(118,255,45,0.12)",a.fillRect(48,226,p,12),a.fillStyle="#78ff2d",a.fillRect(48,226,Math.max(24,p*c),12),l.forEach((f,y)=>{const g=292+y*188,S=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),A=String(f.name||f.category||"fresh pair").slice(0,34),T=_(f.marketCapLabel,f.fdvLabel,B(dt(f)),"checking"),b=_(f.liquidityLabel,B(pt(f)),"checking"),P=_(f.volumeH1Label,f.volumeLabel,B(f.volumeH1),"checking"),C=String(f.pairAgeLabel||Kt(f)||"live").slice(0,18);a.fillStyle="rgba(4,24,8,0.92)",a.strokeStyle="rgba(118,255,45,0.34)",a.lineWidth=2,a.beginPath(),typeof a.roundRect=="function"?a.roundRect(48,g,s-96,156,18):a.rect(48,g,s-96,156),a.fill(),a.stroke(),a.fillStyle="#f4fff0",a.font="900 32px Arial, sans-serif",a.fillText(S,76,g+48),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 18px Arial, sans-serif",a.fillText(A,76,g+78),[["MC",T],["LIQ",b],["VOL",P],["AGE",C]].forEach(([M,q],J)=>{const ke=76+J*140;a.fillStyle="#aaff8f",a.font="800 15px Arial, sans-serif",a.fillText(M,ke,g+114),a.fillStyle="#ffffff",a.font="900 23px Arial, sans-serif",a.fillText(String(q).slice(0,10),ke,g+142)})}),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 20px Arial, sans-serif",a.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,o-78),a.fillStyle="#78ff2d",a.font="900 24px Arial, sans-serif",a.fillText("slimewire.org",48,o-44)}async function kh(e){ou(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(s=>r(s),"image/png",.92)}catch{r(null)}});if(!t){pi();return}const a=URL.createObjectURL(t);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:a,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},je()}async function $h(){const e=tu();if(!e){pi();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await kh(e);return}mi();const a=su(),r=Date.now(),s=t.call(e,12),o=nu(),c=[],l=new MediaRecorder(s,o?{mimeType:o}:void 0),u=()=>ou(e,{rows:a,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);l.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),l.addEventListener("stop",()=>{Gn();const f=o||"video/webm",y=new Blob(c,{type:f}),g=y.size>0?URL.createObjectURL(y):"",S=jn(y.type||f);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:g,mimeType:y.type||f,fileExtension:S,status:y.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},je()},{once:!0}),l.start(500);const p=setTimeout(()=>{n.clipFarm?.recording&&Xn()},4300);n.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:o,fileExtension:jn(o),recorder:l,stream:s,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:p},je()}async function iu(){if(!eu()){if(au()){await $h();return}pi();return}if(n.clipFarm?.recording){Xn();return}mi();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=nu(),a=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",s=>{s.data?.size>0&&a.push(s.data)}),r.addEventListener("stop",()=>{Gn();const s=t||"video/webm",o=new Blob(a,{type:s}),c=o.size>0?URL.createObjectURL(o):"",l=jn(o.type||s);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:o.size>0?o:null,videoUrl:c,mimeType:o.type||s,fileExtension:l,status:o.size>0?`Clip ready (.${l}).`:"No clip captured."},je()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>Xn(),{once:!0}),r.start(1e3),n.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:jn(t),recorder:r,stream:e,chunks:a},je()}catch(e){Gn(),n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},je()}}function Xn(){const e=n.clipFarm?.recorder;if(!e){Gn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},je();return}try{if(e.state!=="inactive"){Wt("Saving clip..."),e.stop();return}}catch{}Gn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},je()}async function Th(){const e=n.clipFarm?.blob;if(!e){Wt("Record a clip first.");return}const t=new File([e],ru(),{type:e.type||n.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Wt("Shared.");return}}catch(a){if(a?.name==="AbortError"){Wt("Share cancelled.");return}}Wt("Use Save, then attach the clip to X or Telegram.")}function Ah(){const e=n.clipFarm?.videoUrl;if(!e){Wt("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=ru(),document.body.appendChild(t),t.click(),t.remove(),Wt("Saved.")}function Ph(e=null,t="chartTxns"){const a=e||Rs(),r=String(a?.tokenMint||n.smartChartToken||"").trim();return r?{mint:r,mode:t,src:Zd(a,t)}:null}function Ch(e={}){if(e.refreshSmartChartFrame||n.route!=="terminal"||n.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),a=t?.querySelector("iframe");if(!t||!a)return null;const r=String(t.dataset.chartMode||"chartTxns"),s=Ph(null,r);if(!s||t.dataset.chartMint!==s.mint||t.dataset.chartMode!==s.mode)return null;const o=String(t.dataset.chartSrc||a.getAttribute("src")||""),c=t.dataset.loaded==="true",l=o!==s.src;return t.dataset.preserving="true",{frame:t,mint:s.mint,mode:s.mode,src:l?o:s.src,loaded:c,keepByMint:l}}function Lh(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),a=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${a}"]`),s=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||s!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!ie||!xn||!ae)return;if(Za(),!e.force&&ci()){Jc();return}const t=L(),a=`${n.route}:${n.activeTab||"none"}`;try{n.perfRenderCounts={...n.perfRenderCounts||{},[a]:(n.perfRenderCounts?.[a]||0)+1},n.pendingRender=!1;const r=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);Za(),ie.dataset.activeTab=n.activeTab||"";const o=!!((e.preserveSmartChartFrame||n.activeTab==="smartChart")&&n.route==="terminal"&&n.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Ch(e):null,c=!!Pe,l=!!(c&&n.loginModalOpen);_o&&(_o.hidden=c||!!n.user||n.loginCollapsed),Mt("[data-connect-login-panel]",c||!!n.user||n.loginCollapsed),Pe?(Pe.hidden=!l,Pe.setAttribute("aria-hidden",l?"false":"true"),Pe.toggleAttribute("inert",!l),document.body.classList.toggle("login-modal-open",l),document.querySelectorAll("[data-login-tab]").forEach(S=>{const A=S.dataset.loginTab===n.loginModalTab;S.dataset.active=A?"true":"false",S.setAttribute("aria-selected",A?"true":"false")}),Mt("[data-login-modal-login-section]",n.loginModalTab!=="login"),Mt("[data-login-modal-create-section]",n.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),ac&&(ac.hidden=!1),nc&&(nc.hidden=!!n.user),rc&&(rc.hidden=!n.user),Za(),Ie("[data-user-id]",n.user?.id||"guest"),Ie("[data-wallet-count]",ii()),Ie("[data-total-sol]",Ft().toFixed(4));const u=rt();Ie("[data-position-count]",u.length),Ie("[data-realized]",li());try{const S=m("[data-realized]");if(S){const A=/-/.test(String(li()||""));S.classList.toggle("metric-neg",A),S.classList.toggle("metric-pos",!A)}}catch{}Ie("[data-top-sol]",`${Ft().toFixed(4)} SOL`),Ie("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Ie("[data-sync-health]",r?Gr():"Sync idle"),Ie("[data-active-preset-label]",bh()),hi(),Bh(),Mt("[data-refresh-spinner]",!n.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!Im||!Lm($e)});const d=m("[data-user-avatar]");d&&(d.innerHTML=tn("SW"));const p=m("[data-top-avatar]");p&&(p.innerHTML=tn("SW"));const f=n.user?.connectedWallet||null;Ie("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:n.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=m("[data-logout]");y&&(y.hidden=!n.user,y.disabled=!!n.logoutPending,v(y,n.logoutPending?"Logging out...":"Log Out")),n.route==="terminal"&&Dh(),Lh(o),dg(),mg(),Gi(),ka(),$a(),ms(),gr(),je(),F(),Lw("render"),zn(),le();const g=L()-t;(g>=16||n.perfRenderCounts[a]%20===0)&&W({component:"render",action:"render",durationMs:g,resultCount:n.perfRenderCounts[a],details:a}),Zl=Date.now()}catch(r){Za(),zn(),zo({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const s=m("[data-panel]");n.route==="terminal"&&s?(ae.hidden=!1,s.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. Tap retry to redraw this panel without closing the window.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `):n.route==="terminal"&&ae&&(ae.hidden=!1,ae.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. The display refresh failed, but the app did not reload or submit another order.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function lu(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const a=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(a)return`connected:${String(a).toLowerCase()}`;const r=Array.isArray(n.wallets)&&n.wallets.length?n.wallets.map(s=>s.publicKey||s.address||s.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function xh(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${lu(e)}`)==="yes"}catch{return!1}}function cu(e,t=""){try{const a=`tpslAutoRevoked:${lu(t)}`;e?sessionStorage.setItem(a,"yes"):sessionStorage.removeItem(a)}catch{}}function fi(e=""){cu(!1,e)}function uu(){return!!(Array.isArray(n.wallets)&&n.wallets.length||n.user?.connectedWallet||n.connectedWalletBalance?.publicKey)}function du(){const e=n.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),a=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!n.user?.automationPermissionActive&&!a&&!e.revokedAt}function Mh(){return!(!uu()||xh()||du()||n.tpslAutoEnableInFlight)}function pu(e="wallet-session"){if(!Mh())return;const t=L();n.tpslAutoEnableScheduledAt&&t-n.tpslAutoEnableScheduledAt<2e3||(n.tpslAutoEnableScheduledAt=t,n.tpslAutoEnableInFlight=!0,setTimeout(()=>{_i("enable",{auto:!0,reason:e}).catch(a=>{n.automationDelegationStatus=a?.message||"TP/SL auto-enable failed.",$(n.automationDelegationStatus)}).finally(()=>{n.tpslAutoEnableInFlight=!1,hi()})},50))}function hi(){const e=m("[data-tpsl-status-button]");if(!e)return;const t=m("[data-tpsl-status-label]"),a=n.user?.automationPermission||{},r=!!n.user?.automationPermissionActive,s=!!a.revokedAt,o=Date.parse(a.expiresAt||""),c=!!a.enabled&&Number.isFinite(o)&&o<=Date.now(),l=r?"enabled":s||c?"invalid":"disabled";e.dataset.tpslState=l;const u=l==="enabled"?"TP/SL Enabled":l==="invalid"?"Re-enable TP/SL":"Enable TP/SL";v(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=l==="enabled"?`Server exits enabled${a.expiresAt?` until ${Se(a.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Bh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0,r=!!(t||a),s=r?"Connected":"Connect",o=t?"Wallet: Connected":a?`Wallets: ${a}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:a?`${a} SlimeWire wallet${a===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(l=>{l.dataset.walletState=r?"connected":"disconnected",l.title=c,l.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=l.querySelector("[data-top-wallet-connect-label]")||l;v(u,s)}),document.querySelectorAll("[data-top-wallet-status]").forEach(l=>{l.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",l.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",l.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),v(l,o)})}async function Rh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0;if(t){await xe({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await vd();return}if(a>0){Te("/terminal","wallets");return}da({returnPath:"/terminal"})}function Ih(e=document){const t=()=>{const a=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!a)return;const r=Math.max(0,a.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const mu=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Oh=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Eh(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Jn(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function gi(e=m("[data-panel]")){if(!e||n.route!=="terminal"||!mu.has(n.activeTab))return null;const t=e.dataset.renderedTab,a=document.scrollingElement||document.documentElement,r={tab:n.activeTab,windowY:window.scrollY||0,documentY:a?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0,anchorKey:"",anchorTop:0},s=Array.from(e.querySelectorAll(Oh));if(t&&t!==n.activeTab&&!s.length||!s.length)return r;const o=s.find(l=>{const u=l.getBoundingClientRect(),d=Jn()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||s[0],c=o?.dataset?.tokenChart||o?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:o?o.getBoundingClientRect().top:0}}function bi(e,t=m("[data-panel]")){if(!e||n.route!=="terminal"||e.tab!==n.activeTab)return;const a=(o,c)=>{if(!o||!Number.isFinite(Number(c))||o.scrollHeight<=o.clientHeight+2)return;const l=Math.max(0,Math.min(Number(c),o.scrollHeight-o.clientHeight));Math.abs((o.scrollTop||0)-l)>4&&(o.scrollTop=l)},r=o=>{const c=document.scrollingElement||document.documentElement;a(ae,e.dashboardScrollTop),a(o,e.panelScrollTop),a(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},s=()=>{const o=t?.isConnected?t:m("[data-panel]");let c=!1;if(e.anchorKey&&o){const l=Eh(e.anchorKey),u=o.querySelector(`[data-token-chart="${l}"], [data-token-mint="${l}"]`);if(u){const p=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(p)&&Math.abs(p)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+p)),c=!0}}c||r(o)};s(),requestAnimationFrame(()=>{s(),window.setTimeout(s,90),window.setTimeout(s,240),Jn()&&window.setTimeout(s,520)})}function fu(e,t){const a=Object.keys(e.dataset||{}).filter(o=>o!=="customFor"&&o!=="customSelect").sort().map(o=>`${o}=${e.dataset[o]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",s=`${e.tagName}:${e.type||""}:${e.name||""}:${a}${r}`;return a?s:`${s}:idx${t}`}function hu(e){const t=Array.from(e.options||[]),a=t.find(r=>r.defaultSelected);return a?a.value:t[0]?.value??""}function Fh(e){if(!e||e.dataset.renderedTab!==n.activeTab)return null;const t=new Map;let a="",r=null,s=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((o,c)=>{const l=fu(o,c);if(t.has(l))return;const u=o.type==="checkbox"||o.type==="radio",d=o.tagName==="SELECT",p=u?String(o.defaultChecked):d?hu(o):o.defaultValue,f=u?String(o.checked):o.value;if(f!==p&&(t.set(l,{value:f,defaultValue:p,isToggle:u,isSelect:d}),document.activeElement===o)){a=l;try{r=o.selectionStart,s=o.selectionEnd}catch{}}}),t.size?{tab:n.activeTab,fields:t,focusedKey:a,selectionStart:r,selectionEnd:s}:null}function Wh(e,t){if(!e||!t||e.tab!==n.activeTab)return;const a=Array.from(t.querySelectorAll("input, textarea, select")),r=s=>{a.forEach((o,c)=>{const l=o.tagName==="SELECT";if(s!==l)return;const u=fu(o,c),d=e.fields.get(u);if(!d)return;const p=o.type==="checkbox"||o.type==="radio";if((p?String(o.defaultChecked):l?hu(o):o.defaultValue)===d.defaultValue&&(p?o.checked=d.value==="true":o.value=d.value,u===e.focusedKey&&document.activeElement!==o))try{o.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&o.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function _h(e){return!e||n.route!=="terminal"||n.activeTab==="terminal"||mu.has(n.activeTab)||e.dataset.renderedTab!==n.activeTab||n.activeTab==="smartChart"&&n.chartScrollIntoView?null:{tab:n.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0}}function Nh(e,t){if(!e||e.tab!==n.activeTab)return;const a=()=>{const r=t?.isConnected?t:m("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),ae&&ae.scrollHeight>ae.clientHeight+2&&(ae.scrollTop=Math.min(e.dashboardScrollTop,ae.scrollHeight-ae.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};a(),requestAnimationFrame(a)}function Dh(){const e=m("[data-panel]");if(!e)return;const t=gi(e),a=Fh(e),r=_h(e),s=n.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,o=n.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),lk(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===n.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const l=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!n.navTekOpen||!nf()&&l}),n.activeTab==="terminal"&&(e.innerHTML=Kp()),n.activeTab==="tek"&&(e.innerHTML=qh()),n.activeTab==="dashboard"&&(e.innerHTML=Xh()),n.activeTab==="profile"&&(e.innerHTML=Jh()),n.activeTab==="trade"&&(e.innerHTML=tb()),n.activeTab==="bundle"&&(e.innerHTML=lb()),n.activeTab==="volume"&&(e.innerHTML=xb()),n.activeTab==="live"&&(e.innerHTML=Kp()),n.activeTab==="liveTrades"&&(e.innerHTML=zw()),n.activeTab==="slimeScope"&&(e.innerHTML=kw()),n.activeTab==="watchlist"&&(e.innerHTML=nS()),n.activeTab==="smartChart"&&(e.innerHTML=Ew()),n.activeTab==="launchCoin"&&(e.innerHTML=_b()),n.activeTab==="launch"&&(e.innerHTML=Mb()),n.activeTab==="kol"&&(e.innerHTML=ty()),n.activeTab==="ogreAi"&&(e.innerHTML=ib()),n.activeTab==="wallets"&&(e.innerHTML=Tv()),n.activeTab==="positions"&&(e.innerHTML=xv()),n.activeTab==="pnl"&&(e.innerHTML=Ov()),n.activeTab==="txAudit"&&(e.innerHTML=Wp()),n.activeTab==="sniper"&&(e.innerHTML=iS()),e.dataset.renderedTab=n.activeTab||"",n.activeTab==="ogreTek"&&(e.innerHTML=hS(),e.dataset.renderedTab=n.activeTab||"",mS()),Wh(a,e),ss(e),Nh(r,e),["trade","volume","launchCoin","sniper","ogreAi","bundle","positions","pnl"].includes(n.activeTab))try{pa[n.activeTab]&&!e.querySelector("[data-ogre-stage]")&&e.insertAdjacentHTML("afterbegin",Yg(n.activeTab)),Jg(e)}catch{}if(["terminal","live","kol","slimeScope","watchlist","smartChart"].includes(n.activeTab))try{Vg(e,n.activeTab)}catch{}try{Kg()}catch{}if(n.activeTab==="smartChart"&&n.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=m("[data-chart-buy-amount]");c&&c.focus(),n.chartFocusAmountInput=!1}),n.activeTab==="smartChart"&&n.chartScrollIntoView&&(Ih(e),n.chartScrollIntoView=!1),n.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=s),requestAnimationFrame(()=>{Math.abs(window.scrollY-o)>8&&window.scrollTo(0,o);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=s)})}bi(t,e),uh(),ua(),Vr(),qn(),zr(),ri(),n.activeTab==="kol"&&Fi()}function Uh(){const e=n.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${i(n.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${i(Ft().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${i(n.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${i(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function qh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Uh()}
      <div class="tek-tool-grid">
        ${e.map(([t,a,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${i(a)}</strong>
            <small>${i(r)}</small>
          </button>`).join("")}
      </div>
      ${Vh()}
      ${zh()}
    </section>
  `}const gu="slimewire-ogre-memory";function Xr(){try{return JSON.parse(localStorage.getItem(gu)||"{}")||{}}catch{return{}}}function Jr(e={}){const t={...Xr(),...e};try{localStorage.setItem(gu,JSON.stringify(t))}catch{}return t}function Hh(e,t=""){if(!e)return;const r=(Xr().recentTokens||[]).filter(s=>s.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),Jr({recentTokens:r.slice(0,5)})}(function(){const t=Xr();t.quickBuy&&!n.quickBuyAmountOverride&&(n.quickBuyAmountOverride=t.quickBuy)})();function bu(){const t=ir().filter(l=>{const u=Number(l.marketCapUsd??l.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active"].includes(String(l.status||"").toLowerCase())),s=r.filter(l=>{const u=Number(l.lastMovePct??l.wallets?.[0]?.lastMovePct),d=Number(l.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,o=Number(n.shieldReceipts?.stats?.watching||0),c=Number(n.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${s?` - ${s} near take-profit`:""}`:"",o?`🔎 ${o} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let yu=!1;function Kh(){if(yu||vn().length)return;yu=!0;const e=bu(),t=Xr(),a=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=a.length?` I remember: ${a.join(", ")}.`:"";de({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function Vh(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...bu(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${i(t)}</li>`).join("")}
      </ul>
    </section>
  `}function zh(){Gh();const e=n.shieldReceipts;if(!e)return`
      <section class="trade-card shield-receipts-card">
        <div class="trade-head"><div><h3>SlimeShield Receipts</h3><p>Loading flagged-token outcomes...</p></div></div>
      </section>
    `;const t=(e.receipts||[]).filter(r=>r.outcome==="rugged").slice(0,8),a=e.stats||{};return`
    <section class="trade-card shield-receipts-card">
      <div class="trade-head">
        <div>
          <h3>SlimeShield Receipts</h3>
          <p>Every AVOID/RISK flag is recorded, then we check what happened. ${Number.isFinite(a.hitRatePct)&&a.hitRatePct!==null?`<strong>${a.hitRatePct}%</strong> of resolved flags went on to rug or die.`:"Outcomes resolve after the market moves."}</p>
        </div>
        <span>${a.flagged||0} flagged | ${a.rugged||0} rugged | ${a.watching||0} watching</span>
      </div>
      ${t.length?`
        <div class="table-list compact-table">
          ${t.map(r=>`
            <article class="row-card">
              <div class="row-main">
                <strong>$${i(r.symbol||w(r.mint))} <span class="negative">rugged</span></strong>
                <span>Flagged ${i(r.verdict)} (score ${i(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${i(jh(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${i(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${i(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function jh(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let vu=0;function Gh(){Date.now()-vu<300*1e3||(vu=Date.now(),k("/api/web/shield/receipts").then(e=>{n.shieldReceipts=e,n.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{n.proofStats=e?.alpha||null}).catch(()=>{}))}function Xh(){return`
    ${og()}
    ${en()}
    <section class="panel-grid">
      ${Yn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Yn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Yn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Yn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Yn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${Tu()}
    ${$u()}
    ${Au()}
  `}function Jh(){if(!yi())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${Su(!1)}
        <section class="profile-row-list">
          ${ng()}
          ${ku()}
        </section>
        ${wu()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:rg()},{key:"login",label:"Login",hint:"Security",html:sg()},{key:"pfp",label:"PFP",hint:"Avatar",html:ig()},{key:"x",label:"X",hint:"Connect X",html:fg()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:Yh()},{key:"badges",label:"Badges",hint:"Earned",html:ku()},{key:"referral",label:"Referral",hint:"Invite & earn",html:hg()},{key:"board",label:"Board",hint:"Top traders",html:bg()}];return`
    <section class="profile-row-shell">
      ${Su(!0)}
      ${rn({toolKey:"profile",activeKey:sn("profile","account"),sections:t})}
      ${wu()}
    </section>
  `}function wu(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function Yh(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",a=n.pushAlertsEnabled===!0;return`
    <article class="profile-card">
      <div>
        <h3>Push Alerts</h3>
        <p>${i(e?t==="denied"?"Notifications are blocked for this site. Enable them in your browser settings, then try again.":a?"Push alerts are ON for this device. TP/SL fires and KOL copies ping you even with the site closed.":"Turn on push alerts to get pinged the moment a stop-loss or take-profit fires - no need to keep the tab open.":"This browser does not support push alerts. On iPhone, add SlimeWire to your Home Screen first (Share - Add to Home Screen).")}</p>
      </div>
      <div class="card-actions compact">
        ${e&&t!=="denied"?`
          <button class="primary" data-push-enable ${a?"hidden":""}>Enable Push Alerts</button>
          <button data-push-disable ${a?"":"hidden"}>Disable On This Device</button>`:""}
        <button data-telegram-link title="One tap: links this account to your Telegram so your take-profit wins can post in your groups (after /mywins on there)">Track Wins in Telegram</button>
      </div>
      <small data-push-status></small>
    </article>
  `}async function Qh(){const e=m("[data-push-status]");try{v(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){v(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),v(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){v(e,N(t?.message||"Could not create the link."))}}function Zh(e){const t="=".repeat((4-e.length%4)%4),a=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(a);return Uint8Array.from([...r].map(s=>s.charCodeAt(0)))}async function eg(){const e=m("[data-push-status]");try{v(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){v(e,"Push alerts are not configured on the server yet.");return}const a=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){v(e,"Notification permission was not granted.");return}const s=await a.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Zh(t.publicKey)}),o=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:s.toJSON()})});n.pushAlertsEnabled=!0,v(e,`Push alerts enabled (${o.devices||1} device${(o.devices||1)===1?"":"s"}).`),h()}catch(t){v(e,N(t?.message||"Could not enable push alerts."))}}async function tg(){const e=m("[data-push-status]");try{const a=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:a.endpoint})}).catch(()=>{}),await a.unsubscribe().catch(()=>{})),n.pushAlertsEnabled=!1,v(e,"Push alerts disabled on this device."),h()}catch(t){v(e,N(t?.message||"Could not disable push alerts."))}}async function ag(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n.pushAlertsEnabled=!!t}catch{}}function yi(){return!!(ce()?.publicKey||n.user?.connectedWallet?.publicKey||Array.isArray(n.wallets)&&n.wallets.length)}function Su(e=yi()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function ng(){const e=ce();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Qr().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${i(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${i(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${i(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function rg(){const e=n.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${tn("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${i(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${i(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function sg(){const e=n.user?.username||"";return`
    <section class="profile-card login-security-card">
      <div>
        <h3>Saved Login</h3>
        <p>${e?`Username saved: ${i(e)}. Update the password here any time.`:"Add a username and password so this profile follows you across browsers and devices."}</p>
      </div>
      <label>
        Username
        <input data-profile-username type="text" autocomplete="username" placeholder="slimewire" value="${i(e)}">
      </label>
      <label>
        Password
        <input data-profile-password type="password" autocomplete="new-password" placeholder="${n.user?.hasPasswordLogin?"New password":"8+ characters"}">
      </label>
      <button type="button" class="primary" data-save-login-credentials>${e?"Update Login":"Save Login"}</button>
      <small data-login-security-status>${n.user?.hasPasswordLogin?"Password login is active for this profile.":"Password is stored as a salted hash. Private keys are not shown or emailed."}</small>
    </section>
  `}function og(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Yn(e,t,a,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${i(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${i(t)}</h3>
        <p>${i(a)}</p>
      </div>
    </article>
  `}function ig(){const e=!!n.user?.avatar,t=n.xHandle?`@${n.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${tn("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${lg()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${t?`Use ${i(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${n.user.avatarSource?` from ${i(n.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function lg(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,a])=>`
        <button type="button" data-preset-avatar="${i(t)}" data-avatar-label="${i(a)}" aria-label="Use ${i(a)} PFP">
          <img src="${i(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function ku(){const e=Number(n.pnl?.totals?.tradeCount||0),t=yi(),a=Number(n.livePairRows?.length||0)+Number(n.terminalEntry?.items?.length||0)+Number(n.livePairsByBucket?.fresh?.length||0),r=!!(n.lastUpdatedAt&&!n.walletRefreshError||n.walletRefreshStatus==="success"),s=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:a>0||!!n.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!oe("trade",n.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(n.livePairRows?.length||n.scan||n.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],o=s.filter(l=>l.earned).length,c=Math.round(o/Math.max(1,s.length)*100);return`
    <section class="create-wallet-card badge-showcase-card">
      <div class="badge-showcase-head">
        <div>
          <h3>Badge Window Hub</h3>
          <p>Quest badges unlock as the account gets ready. They are visual status marks only and never expose private wallet data.</p>
        </div>
        <strong>${o}/${s.length}</strong>
      </div>
      <div class="badge-progress" aria-label="Badge progress ${c}%">
        <span style="width:${c}%"></span>
      </div>
      <div class="badge-grid">
        ${s.map(({label:l,detail:u,earned:d,icon:p,quest:f})=>`
          <article class="earned-badge ${d?"is-earned":""}">
            <span class="earned-badge-icon">
              <img src="${i(p)}" alt="" aria-hidden="true">
            </span>
            <span class="earned-badge-quest">${i(f)}</span>
            <strong>${i(l)}</strong>
            <small>${d?"Earned":"Locked"} - ${i(u)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `}function en(){const e=n.user?.connectedWallet,t=!!n.user?.avatar,a=n.xHandle?`@${n.xHandle}`:"";return`
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
          ${Qr().map(r=>`
            <button type="button" data-connect-wallet="${r.id}" ${r.detected?"":`title="${i(r.label)} extension not detected"`}>
              ${i(e?`Switch ${r.label}`:r.label)}
            </button>
          `).join("")}
        </div>
        <div class="connected-wallet-box">
          ${e?`
            <span>${i(e.provider||"Solana Wallet")}</span>
            <code>${i(e.publicKey)}</code>
            <div class="card-actions compact">
              <button type="button" data-copy="${i(e.publicKey)}">Copy</button>
              <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
              <button type="button" data-connect-wallet="solana">Reconnect</button>
              <button type="button" data-disconnect-wallet>Disconnect</button>
            </div>
          `:"<small>No wallet connected yet.</small>"}
        </div>
        <small data-wallet-connect-status>${e?`Connected ${i(e.shortPublicKey||w(e.publicKey))}.`:"Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      ${vi()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${tn("SW")}</div>
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
          <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${a?`Use ${i(a)} PFP`:"Use X PFP"}</button>
          ${t?'<button type="button" data-clear-avatar>Remove</button>':""}
        </div>
        <small data-avatar-status>${t?`PFP saved${n.user.avatarSource?` from ${i(n.user.avatarSource)}`:""}.`:"Optional. Connect X first if you want to use your X PFP."}</small>
      </article>

      <article class="setup-hub-panel">
        <h3>X Profile</h3>
        <p>Save, change, or unlink the handle used for share buttons, watch posts, and PFP import.</p>
        <label>
          X Handle
          <input data-x-handle type="text" placeholder="@yourhandle" value="${i(n.xHandle?`@${n.xHandle}`:"")}">
        </label>
        <div class="profile-actions">
          <button type="button" data-connect-x>${n.xHandle?"Save Different X":"Save X Handle"}</button>
          <button type="button" data-open-x-login>${n.xHandle?"Open X Profile":"Open X Login"}</button>
          ${n.xHandle?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
        </div>
        <small data-x-status>${n.xHandle?`Saved as @${i(n.xHandle)}. Type another handle and save to change it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
      </article>
    </section>
  `}function Hk(){const e=n.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Qr().map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${i(t.label)} extension not detected"`}>
            ${i(e?`Switch to ${t.label}`:t.label)}
          </button>
        `).join("")}
      </div>
      <div class="connected-wallet-box">
        ${e?`
          <span>${i(e.provider||"Solana Wallet")}</span>
          <code>${i(e.publicKey)}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${i(e.publicKey)}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-connect-wallet="solana">Reconnect</button>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
        `:`
          <span>No browser wallet connected yet.</span>
          <small>Use this for identity, quick copying, and future non-custodial features. Managed bot wallets stay separate.</small>
        `}
      </div>
      <small data-wallet-connect-status>${e?`Connected ${i(e.shortPublicKey||w(e.publicKey))}.`:"Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
    ${vi({compact:!0})}
  `}function vi({compact:e=!1}={}){const t=n.user?.connectedWallet,a=Array.isArray(n.wallets)?n.wallets.length:0,r=n.wallets.filter(u=>u.sessionWallet),s=n.user?.automationPermission||{},o=!!n.user?.automationPermissionActive,c=s.expiresAt?Se(s.expiresAt):"",l=n.automationDelegationStatus||(a?`${a} managed automation wallet(s) available. ${o?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
    <article class="setup-hub-panel automation-delegation-card ${e?"compact":""}">
      <div class="delegation-heading">
        <span class="delegation-mode-badge">${o?"Automation Enabled":"TP/SL Auto-Enabled"}</span>
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
        ${o?'<button type="button" class="danger-lite" data-automation-permission="revoke">Disable TP/SL</button>':'<button class="primary" type="button" data-automation-permission="enable">Enable TP/SL Now</button>'}
        <button class="primary" type="button" data-create-automation-wallet>${a?"Create Another":"Create Automation Wallet"}</button>
        <button type="button" data-tab="wallets">Manage Wallets</button>
        ${t?'<button type="button" data-connect-wallet="solana">Switch Connected Wallet</button>':""}
      </div>
      <small data-automation-delegation-status>${i(l)}</small>
    </article>
  `}function da({returnPath:e="/terminal"}={}){n.walletConnectMenuOpen=!0,n.walletConnectReturnPath=e||"/terminal",n.walletConnectStatus=n.user?.connectedWallet?`Connected ${w(n.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function cg(e={}){return da(e)}window.openWalletConnectModal=cg;function ug(e){n.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",n.walletFastApprovalsEnabled?"on":"off")}catch{}}function dg(){const e=m("[data-wallet-connect-modal]");if(!e)return;if(!n.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=n.user?.connectedWallet||n.connectedWalletBalance;e.hidden=!1,hr(e,`
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
          <span>${i(t.provider||"Solana Wallet")}</span>
          <code>${i(t.publicKey||"")}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${i(t.publicKey||"")}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(t.publicKey||"")}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-wallet-fast-approvals-toggle>${n.walletFastApprovalsEnabled?"Fast approvals On":"Fast approvals Off"}</button>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
          <small>Fast approvals keeps SlimeWire ready and opens your wallet prompt immediately. Phantom/Solflare still require you to approve each transaction.</small>
        </div>
      `:""}
      <div class="wallet-provider-buttons modal-wallet-provider-buttons">
        ${Qr().map(a=>`
          <button type="button" class="wallet-provider-choice" data-connect-wallet-provider="${a.id}" ${a.detected?"":`title="${i(a.label)} ${a.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            <img src="${i(a.icon)}" alt="" aria-hidden="true">
            <span>
              <strong>${i(t?`Switch to ${a.label}`:a.mobileRedirect?`Open ${a.label}`:a.label)}</strong>
              <small>${a.detected?"Detected - connect prompt opens here":a.mobileRedirect?"Mobile wallet flow":"Install/open wallet or choose another"}</small>
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
      <small class="connect-status" data-wallet-connect-status>${i(n.walletConnectStatus||"")}</small>
    </section>
  `,".wallet-connect-dialog")}function pg(){const e=n.quickBuyModal||{},t=Rs()?.tokenMint===e.tokenMint?Rs():be(e.tokenMint,{source:e.source||"quick-buy-modal"}),a=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=wi(e.error||e.status||""),s=a||!!r,o=ue(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${mt(t)}
          <div>
            <h3>Quick Buy</h3>
            <p>${i(t.symbol||w(e.tokenMint))} - ${i(w(e.tokenMint))}</p>
          </div>
        </div>
        <button type="button" class="icon-button" data-quick-buy-close aria-label="Close Quick Buy">x</button>
      </div>
      <label>
        Wallet
        <select data-quick-buy-modal-wallet>
          ${nn(e.walletIndex||(ce()?.publicKey?"connected":""))}
        </select>
      </label>
      <label>
        SOL amount
        <input data-quick-buy-modal-amount type="number" min="0" step="0.01" inputmode="decimal" value="${i(e.amountSol||"")}" placeholder="0.10">
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
        <button type="button" data-token-chart="${i(e.tokenMint||"")}" data-token-chart-source="quick-buy-modal">${r?"Open Chart":"Chart"}</button>
        <button type="button" data-token-trade="${i(e.tokenMint||"")}" data-token-trade-source="quick-buy-modal">Full Trade</button>
        ${D("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${i(e.tokenMint||"")}" data-protected-buy-source="quick-buy-modal">Protected</button>`:""}
        <button type="button" class="primary" data-quick-buy-confirm ${s?"disabled":""}>${a?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${o?`<small class="quick-buy-wallet-note">${n.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${i(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${i(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${i(e.error||"")}</small>`}
    </section>
  `}function wi(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function mg(){let e=m("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!n.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=pg(),document.body.classList.add("quick-buy-modal-open")}function fg(){const e=!!n.xHandle;return`
    <section class="create-wallet-card x-connect-card">
      <div>
        <h3>X Profile</h3>
        <p>Save, change, or unlink the X handle used for share buttons on PnL cards, trades, scanner picks, watchlists, KOL signals, and launch watches. Posts always open in X for review first.</p>
      </div>
      <label>
        X Handle
        <input data-x-handle type="text" placeholder="@yourhandle" value="${i(n.xHandle?`@${n.xHandle}`:"")}">
      </label>
      <button type="button" data-connect-x>${e?"Save Different X":"Save X Handle"}</button>
      <button type="button" data-open-x-login>${e?"Open X Profile":"Open X Login"}</button>
      ${e?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
      <small data-x-status>${e?`Saved as @${i(n.xHandle)}. Enter a different handle and tap Save Different X to change it, or Unlink X to remove it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
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
  `}function hg(){const e=n.user?.referralCode||"",t=`${Lt.replace(/\/+$/,"")}/r/`,a=n.user?.referralLink||(e?`${Lt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=n.user?.referralStats||{},s=Array.isArray(r.referrals)?r.referrals:[];return`
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. This is separate from the trader board.</p>
      </div>
      <div class="referral-stats-grid">
        <span><small>Total earned</small><strong>${i(r.totalSol||"0")} SOL</strong></span>
        <span><small>Payouts</small><strong>${i(r.payoutCount||0)}</strong></span>
        <span><small>Referral users</small><strong>${i(s.length)}</strong></span>
      </div>
      ${s.length?`
        <div class="referral-breakdown">
          ${s.slice(0,6).map(o=>`
            <div class="referral-breakdown-row">
              <span>${i(o.userId||"user")}</span>
              <strong>${i(o.sol||"0")} SOL</strong>
              <small>${i(o.payoutCount||0)} payout${Number(o.payoutCount||0)===1?"":"s"}</small>
            </div>
          `).join("")}
        </div>
      `:"<small>No referral payouts yet. They will appear here when referred users trade and referral fees are paid.</small>"}
      ${a?`
        <label class="referral-link-field">
          Your Referral Link
          <div class="referral-link-builder">
            <span>${i(t)}</span>
            <input data-referral-code type="text" inputmode="latin" autocomplete="off" maxlength="24" placeholder="your-code" value="${i(e)}" aria-label="Your custom referral code">
          </div>
          <input data-referral-link type="hidden" value="${i(a)}">
        </label>
      `:`<input data-referral-code type="text" inputmode="latin" autocomplete="off" maxlength="24" placeholder="your-code" value="${i(e)}" aria-label="Your custom referral code">`}
      <div class="referral-code-row">
        <div class="profile-actions referral-code-actions">
          <button type="button" data-generate-referral-code>Generate</button>
          <button type="button" class="primary" data-save-referral>Save Link</button>
        </div>
      </div>
      <small class="referral-code-help">The SlimeWire link stays locked. Delete only the code after /r/, enter your custom tag, pick the payout wallet for referral fees, then Save Link. Use letters, numbers, dash, or underscore. Once saved, no other SlimeWire profile can claim the same code.</small>
      <label>
        Referral Payout Wallet
        <input data-referral-wallet type="text" placeholder="Wallet for referral fees" value="${i(n.user?.referralPayoutWallet||"")}">
      </label>
      <div class="card-actions">
        <button type="button" data-save-referral>Save Payout Wallet</button>
        ${a?`<button type="button" data-copy="${i(a)}">Copy Referral Link</button>`:""}
        ${a?Ge(`Trade faster on SlimeWire. Referral: ${a}`,"Share X"):""}
        ${a?Pu(`Trade faster on SlimeWire. Referral: ${a}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${i(e)}${n.user?.referredByCode?` | Referred by ${i(n.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function gg(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Lt).pathname.split("/").map(o=>o.trim()).filter(Boolean),s=r.findIndex(o=>o.toLowerCase()==="r");if(s>=0&&r[s+1])return decodeURIComponent(r[s+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function bg(){const e=n.user?.traderBoardWalletMode||"all",t=Array.isArray(n.user?.traderBoardWalletIndexes)?n.user.traderBoardWalletIndexes:n.wallets.map(a=>String(a.index));return`
    <section class="create-wallet-card trader-board-card">
      <div>
        <h3>Top SlimeWire Traders</h3>
        <p>Opt in only if you want your SlimeWire trade stats shown on the KOL board. Choose all bot wallets or only the wallets you want counted.</p>
      </div>
      <label class="checkbox-line">
        <input data-show-trader-board type="checkbox" ${n.user?.showOnTraderBoard?"checked":""}>
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
        ${n.wallets.length?wt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${n.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function $u(){return`
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
      <small data-restore-status>${n.restoreResult?i(n.restoreResult.message||"Restore complete."):""}</small>
      <small data-export-status>${n.backupResult?i(n.backupResult.message||"Backup ready."):""}</small>
    </section>
  `}function Tu(){return`
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
      <small data-import-status>${n.importResult?i(n.importResult.message||"Import complete."):""}</small>
    </section>
  `}function Au(){return n.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ge(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${i(e)}">${i(t)}</button>`}function Pu(e,t="TG"){const a=Si(e),r=`https://t.me/share/url?url=${encodeURIComponent(Lt)}&text=${encodeURIComponent(a)}`;return`<a href="${i(r)}" target="_blank" rel="noreferrer">${i(t)}</a>`}function Si(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Lt}`}function yg(e){const t=e.type==="buy",a=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${a}. Chart ${Q(e.tokenMint)}`}function Kk(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function vg(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Cu(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function wg(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function Sg(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${Q(e.tokenMint)}`}function kg(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${Q(e.tokenMint)}`}function $g(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function Tg(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function ki(e){const t=String(e||"").trim(),a=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${Q(t)}`:"";return`Watching ${a}.${r}`}function Lu(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const Ag=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function $i(e=""){const t=String(e||"").trim().toLowerCase();return Ag.filter(a=>!t||String(a.tier||"").toLowerCase()===t).sort((a,r)=>+!!r.pinned-+!!a.pinned||Number(a.rank||999)-Number(r.rank||999))}function _t(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function xu(e=""){const t=String(e||"").trim();return _t(t)?t:""}function Pg(e={}){const t=String(e.wallet||"").trim(),a=xu(t),r=Je(e.twitter||e.x||e.username||"");return{x:r?Pi(r):"",wallet:a?`https://solscan.io/account/${encodeURIComponent(a)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(a?Cc(a):"")}}function Cg(e={}){const t=String(e.wallet||"").trim(),a=xu(t),r=Pg(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${i(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${i(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${i(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${a?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${a?`<button data-kol-scan-wallet="${i(a)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${a?`<button data-kol-copy-wallet="${i(a)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${a?`<button data-copy="${i(a)}">CA</button>`:""}
      ${Ei(e)}
    </div>
  `}function Mu(e={},t={}){const a=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${a?"is-compact":""}" data-tier="${i(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${Iu(e,a?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${i(e.tag||"Curated wallet")}</span>
          <h3>${i(e.name||e.twitter||w(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${i(Je(e.twitter))}`:i(w(r)||"Social pending")}</p>
        </div>
        <b>#${i(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${i(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${i(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${i(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${i(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${Cg(e)}
    </article>
  `}function Lg(){const e=$i("hot"),t=$i("slimewire");return`
    <section class="curated-kol-board">
      <div class="trade-head curated-kol-head">
        <div>
          <h3>Curated KOL Copy Board</h3>
          <p>Hosted wallet database for hot Solana memecoin traders, with pinned rows we can cherry-pick to the top.</p>
        </div>
        <span>${i(e.length+t.length)} curated</span>
      </div>
      <div class="curated-kol-layout">
        <article class="curated-kol-main">
          <header>
            <h4>Hot Solana Wallets</h4>
            <p>Public wallets to scan, inspect, and copy-plan from your SlimeWire wallets.</p>
          </header>
          <div class="curated-kol-list">
            ${e.length?e.map(a=>Mu(a)).join(""):O("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(a=>Mu(a,{compact:!0})).join(""):O("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function tn(e="SW"){const t=st(n.user?.avatar||"");if(Bu(t))return`<img src="${i(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${wl("ogre")}';">`;const a=wl("ogre");if(e==="SW"||e==="OG")return`<img src="${a}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${i(r)}</span>`}function Bu(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function st(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const a=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return a?`https://ipfs.io/ipfs/${encodeURIComponent(a).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function xg(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function Mg(e="",t=""){const a=String(e||"").trim(),r=st(t);if(!a||!r||Yr(a,r))return"";if(gt.set(a,r),ne("avatarCacheHit"),gt.size>900){for(const s of gt.keys())if(gt.delete(s),gt.size<=720)break}return r}function Ru(e="",t=""){return`${String(e||"").trim()}|${st(t)}`}function Bg(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function Yr(e="",t=""){const a=Ru(e,t);if(!Qt.has(a))return!1;const r=Number($r.get(a)||0);return r&&Date.now()-r>Bg(t)?(Qt.delete(a),$r.delete(a),!1):!0}function Rg(e="",t=""){const a=String(e||"").trim(),r=st(t);if(!a||!r)return;const s=Ru(a,r);if(Qt.add(s),$r.set(s,Date.now()),Qt.size>1200){for(const o of Qt)if(Qt.delete(o),$r.delete(o),Qt.size<=900)break}gt.get(a)===r&&gt.delete(a),ne("avatarFetchFailed")}function Ti(e="",...t){const a=String(e||"").trim(),r=a?gt.get(a):"";if(r&&!Yr(a,r))return ne("avatarCacheHit"),r;r&&gt.delete(a);for(const s of t){const o=st(s);if(o&&!Yr(a,o))return ne("avatarCacheMiss"),o}return ne("avatarFallbackShown"),""}window.__slimeRememberAvatar=Mg,window.__slimeAvatarLoadFailed=function(t){const a=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Rg(a,r);const s=st(t?.dataset?.backupSrc||"");if(s&&!Yr(a,s)){t.dataset.backupSrc="",t.dataset.avatarSrc=s,t.src=s;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function Ai(e){const t=Je(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function Pi(e=n.xHandle){const t=Je(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Ig(e={}){const t=st(e.avatar||e.image||"");if(Bu(t))return t;const a=Je(e.twitter||e.x||e.username||"");if(a)return Ai(a);const r=Je(e.name||e.kolName||"");return r&&r.length>=2?Ai(r):""}function Og(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function Iu(e={},t="kol-avatar"){const a=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=Ti(a,Ig(e)),s=Og(e);return r?`<img class="${i(t)}" src="${i(r)}" data-avatar-key="${i(a)}" data-avatar-fallback="${i(s)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${i(t)} kol-avatar-fallback" aria-hidden="true">${i(s)}</div>`}function Qr(){const e=Ve();return[{id:"phantom",label:"Phantom",detected:!!fe("phantom"),mobileRedirect:e&&!!Fn("phantom"),installUrl:Jo("phantom"),icon:Ga("phantom")},{id:"solflare",label:"Solflare",detected:!!fe("solflare"),mobileRedirect:e&&!!Fn("solflare"),installUrl:Jo("solflare"),icon:Ga("solflare")},{id:"backpack",label:"Backpack",detected:!!fe("backpack"),mobileRedirect:!1,installUrl:Jo("backpack"),icon:Ga("backpack")},{id:"solana",label:"Detected Wallet",detected:!!fe("solana"),mobileRedirect:!1,installUrl:"",icon:Ga("solana")}]}function fe(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Fe(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function ce(){return n.user?.connectedWallet||n.connectedWalletBalance||null}function Eg(e=""){const t=ce();if(!t?.publicKey)return"";const a=String(e||"")==="connected"||!e&&!n.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${a?"selected":""}>${i(r)} - ${i(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}const Ci="/assets/slimewire/swap/states/",ot="/assets/slimewire/swap/sfx/",Ou="/assets/slimewire/volume/states/",Zr="/assets/slimewire/volume/sfx/",Fg="/assets/slimewire/ui/tick.mp3",Wg="/assets/slimewire/ui/flip.mp3",_g={swap:new Set(["idle","appraise","buy","sell","banking","win","loss"]),volume:new Set(["idle","running","sweep","stop"]),sniper:new Set(["idle","fire","lock"]),ogreAi:new Set(["idle","speak","think"]),bundle:new Set(["idle","volley","sell"]),launchCoin:new Set(["idle","launch","forge"]),positions:new Set(["idle","win","survey"]),pnl:new Set(["idle","win","survey"])},Ng={swap:{appraise:[ot+"appraise.mp3",.7],buy:[ot+"buy.mp3",.85],sell:[ot+"sell.mp3",.85],win:[ot+"win.mp3",.85],loss:[ot+"loss.mp3",.6],banking:[ot+"bank.mp3",.8]},volume:{running:[Zr+"start.mp3",.7],sweep:[Zr+"sweep.mp3",.8],stop:[Zr+"stop.mp3",.8]},sniper:{fire:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],lock:["/assets/slimewire/sniper/sfx/lock.mp3",.7]},ogreAi:{think:["/assets/slimewire/ogreai/sfx/think.mp3",.6],speak:[ot+"appraise.mp3",.6]},bundle:{volley:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],sell:["/assets/slimewire/bundle/sfx/sell.mp3",.8]},launchCoin:{forge:["/assets/slimewire/launch/sfx/forge.mp3",.85],launch:[ot+"win.mp3",.8]},positions:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]}},Dg={sniper:[["[data-sniper-arm]","lock"],["__text:snipe|ape|fire","fire"]],ogreAi:[["[data-ogre-ai-start]","think"]],bundle:[["[data-bundle-buy]","volley"],["[data-bundle-sell]","sell"]],launchCoin:[["[data-launch-coin-submit]","forge"],["__text:launch","forge"]],positions:[["[data-refresh-all],[data-refresh],[data-refresh-positions]","survey"]],pnl:[["[data-refresh-all],[data-refresh]","survey"]]},Eu={ogreAi:"[data-ogre-ai-start]",bundle:"[data-bundle-buy]",launchCoin:"[data-launch-coin-submit]"},pa={launchCoin:{base:"/assets/slimewire/launch/states/",poster:"/assets/slimewire/launch/hero.png",tier:"OGRE FORGE",cap:["Pump Launcher","Forge it · birth it · send it."],accent:"launch",idle:"idle",event:"launch",sfx:[ot+"win.mp3",.8]},sniper:{base:"/assets/slimewire/sniper/states/",poster:"/assets/slimewire/sniper/hero.png",tier:"OGRESNIPER",cap:["OgreSniper","Lock on · strike first."],accent:"sniper",idle:"idle",event:"fire",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},ogreAi:{base:"/assets/slimewire/ogreai/states/",poster:"/assets/slimewire/ogreai/hero.png",tier:"OGRE A.I.",cap:["Ogre A.I.","Ask the swamp oracle."],accent:"ogreai",idle:"idle",event:"speak",sfx:[ot+"appraise.mp3",.6]},bundle:{base:"/assets/slimewire/bundle/states/",poster:"/assets/slimewire/bundle/hero.png",tier:"OGRE BUNDLE",cap:["Bundle","Many wallets · one volley."],accent:"bundle",idle:"idle",event:"volley",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},positions:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"POSITIONS",cap:["Open Positions","Your swamp, live."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"PROFIT & LOSS",cap:["PnL","Count the winnings."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]}};function Fu(){const e=R.kind;return e==="swap"?Ci:e==="volume"?Ou:pa[e]?pa[e].base:Ci}const Vk={launchCoin:"[data-launch-coin-submit]",ogreAi:"[data-ogre-ai-start]",bundle:"[data-bundle-buy]"};let Wu=!1;function Ug(){Wu||(Wu=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("[data-ogre-card]");if(t){e.preventDefault(),e.stopPropagation(),Hg(t.getAttribute("data-ogre-card"));return}const a=R.kind;if(!a)return;const r=document.querySelector(`[data-ogre-stage="${a}"]`);if(!r)return;const s=e.target.closest("button, a[role='button'], [data-swap-reverse], select, input[type='range'], label.oss-pill, [role='button']");if(!s||s.closest("[data-ogre-snd],[data-ogre-card]"))return;const o=r.closest("[data-rendered-tab]")||r.parentElement||document;if(o.contains&&!o.contains(s))return;const c=()=>es(Fg,.5);if(pa[a]){const l=Dg[a]||[],u=(s.textContent||"").toLowerCase();for(const[d,p]of l)if(d.startsWith("__text:")){if(new RegExp(d.slice(7)).test(u)){se(r,p,!0);return}}else if(s.closest(d)){se(r,p,!0);return}c();return}if(a==="swap"){s.closest("[data-swap-use-custom-amount]")?se(r,n.swapDirection==="sell"?"sell":"buy",!0):s.closest("[data-swap-reverse]")?(se(r,"appraise",!0),es(Wg,.6)):s.closest("[data-swap-to],[data-swap-from],[data-trade-token]")?se(r,"appraise",!0):c();return}if(a==="volume"){s.closest("[data-vbot-start]")?se(r,"running",!0):s.closest("[data-vbot-stop]")?se(r,"stop",!0):s.closest("[data-vbot-set-mode],[data-vbot-set-aggr],[data-vbot-set-stagger],[data-vbot-source]")?se(r,"sweep",!0):c();return}}catch{}},!0))}function qg(e,t){try{const a=document.createElement("a");a.href=t,a.download=e,document.body.appendChild(a),a.click(),a.remove()}catch{}}async function Hg(e){const t=r=>{const s=Number(r);return Number.isFinite(s)?s.toFixed(4):"0"};let a=null;if(e==="swap"){const r=n.tradeResult||{};a={theme:"swap",receipt:!0,loss:!1,headline:"SWAPPED",mint:r.tokenMint||n.tradeToken||"",symbol:String(r.symbol||r.shortMint||"TOKEN"),name:"OgreSwap",lines:[r.type==="sell"?`Received ${t(r.netSol)} SOL`:r.type==="buy"?`Aped ${t(r.spentSol)} SOL`:"Swapped on SlimeWire","OgreSwap · on-chain","slimewire.org"]}}else if(e==="volume"){const r=Array.isArray(n.volumeBots)?n.volumeBots:[],s=r.find(u=>u&&u.status!=="completed")||r[r.length-1]||{},o=s.stats||{},c=Number(s.buyAmountSol||0),l=(Number(o.buys||0)+Number(o.sells||0))*c;a={theme:"volume",receipt:!0,loss:!1,headline:"VOLUME RUN",mint:s.tokenMint||"",symbol:String(s.shortMint||"SLIMEBOT"),name:"SlimeBot",lines:[`${l.toFixed(2)} SOL volume`,`${Number(s.walletCount||0)} wallets · ${Number(s.currentCycle||s.cycles||0)} rounds`,"SlimeBot · slimewire.org"]}}else return;try{const r=await k("/api/web/card",{method:"POST",body:JSON.stringify(a)});r&&r.ok&&r.png&&qg(`slimewire-${e}-card.png`,r.png)}catch{}}let _u=!1;function Kg(){_u||(_u=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("button");if(!t||!(t.matches("[data-top-refresh-wallet],[data-refresh-all],[data-refresh-live-pairs],[data-refresh-scanner],[data-refresh],[data-refresh-watchlist],[data-refresh-kol]")||/(^|\s)(refresh|reload)(\b|$)/i.test((t.textContent||"").trim())))return;t.classList.remove("ogre-refreshing"),t.offsetWidth,t.classList.add("ogre-refreshing"),setTimeout(()=>t.classList.remove("ogre-refreshing"),900)}catch{}},!0))}function Li(e,t){return`<video class="${e}" autoplay muted loop playsinline preload="auto" src="/assets/slimewire/ui/${t}.mp4"></video>`}let xi=0;function Vg(e,t){try{if(t==="terminal"||t==="live"){if(!e.querySelector(".ogre-radar-bar")){const r=e.querySelector(".cooks-category-label")?.parentElement||e.querySelector(".terminal-main")||e.querySelector(".terminal-layout")||e,s=e.querySelectorAll(".signal-row, [data-token-mint]").length,o=document.createElement("div");if(o.className="ogre-radar-wrap",o.innerHTML='<span class="ogre-radar-bar">'+Li("rbar-bg","conduit")+`<span class="orb-scope">${Li("orb-vid","scope")}<span class="ring"></span><span class="ring r2"></span><span class="sweep"></span><span class="blip b1"></span><span class="blip b2"></span><span class="blip b3"></span></span><span class="orb-read"><span class="t">SWAMP RADAR</span><span class="s"><b>${s}</b> live pairs · scanning the swamp</span></span><span class="orb-heat">LIVE</span></span>`,r.insertBefore(o,r.firstChild),s>xi&&xi>0){const c=o.querySelector(".ogre-radar-bar");c.classList.add("hit"),setTimeout(()=>c.classList.remove("hit"),800)}xi=s}return}const a=e.querySelector(".trade-head");if(!a)return;if(t==="kol"||t==="slimeScope"||t==="watchlist"){const r=a.querySelector("h3");r&&!r.querySelector(".ogre-spy")&&r.insertAdjacentHTML("afterbegin",`<span class="ogre-spy" title="Intel watch">${Li("spy-vid","eye")}<i></i></span>`)}else t==="smartChart"&&(a.querySelector(".ogre-chartwatch")||a.insertAdjacentHTML("beforeend",'<span class="ogre-chartwatch"><span class="ce"></span>WATCHING</span>'))}catch{}}let ma=!0;try{ma=localStorage.getItem("ogreStageSound")!=="off"}catch{}const Nu={};function es(e,t){if(ma)try{let a=Nu[e];a||(a=new Audio(e),a.preload="auto",Nu[e]=a),a.volume=t??.7,a.currentTime=0,a.play().catch(()=>{})}catch{}}const R={kind:null,clip:"",eventUntil:0,prev:{},feed:[],feedIdx:0,tkTimer:0};function zg(e){return e=String(e||""),e.length>9?`${e.slice(0,4)}…${e.slice(-4)}`:e||"coin"}function Mi(e){return e&&e.symbol?`$${e.symbol}`:e&&e.shortMint?`$${e.shortMint}`:"the coin"}function Du(e){return`<video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${e==="swap"?"/assets/slimewire/swap/hero.png":"/assets/slimewire/volume/hero.png"}" src="${e==="swap"?Ci:Ou}idle.mp4"></video>`}function jg(){return`
    <div class="ogre-stage swap" data-ogre-stage="swap">
      ${Du("swap")}
      <span class="os-tier">OGRESWAP</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <button class="os-card" data-ogre-card="swap" type="button" title="Download a share card">🏆</button>
      <span class="os-led"></span>
      <div class="os-shield" data-os-shield><span class="ic">🛡️</span><span data-os-shield-text>SHIELD</span></div>
      <div class="os-read" data-os-read><div class="l">SlimeShield score</div><div class="v" data-os-read-v>—</div></div>
      <div class="os-gauge"><div class="fill" data-os-gauge></div></div>
      <div class="os-orb" data-os-orb><span class="s" data-os-orb-s></span><span class="p" data-os-orb-p></span></div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>OgreSwap ready — paste a coin to appraise</span></div>
    </div>`}function Gg(){return`
    <div class="ogre-stage volume" data-ogre-stage="volume">
      ${Du("volume")}
      <span class="os-tier">SLIMEBOT</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <button class="os-card" data-ogre-card="volume" type="button" title="Download a share card">🏆</button>
      <span class="os-led"></span>
      <div class="ov-swarm" data-ov-swarm></div>
      <div class="ov-budget" data-ov-budget><div class="l">SOL deployed</div><div class="v" data-ov-budget-v>—</div><div class="bar"><i data-ov-budget-bar></i></div></div>
      <div class="ov-ring" data-ov-ring><svg width="54" height="54"><circle class="trk" cx="27" cy="27" r="22"></circle><circle class="prg" data-ov-ring-prg cx="27" cy="27" r="22"></circle></svg><div class="lbl"><span>round</span><b data-ov-ring-lbl>0/0</b></div></div>
      <div class="ov-read" data-ov-read>
        <div class="chip"><span class="l">Volume</span><span class="v" data-ov-vol>—</span></div>
        <div class="chip"><span class="l">Buys</span><span class="v buy" data-ov-buys>0</span></div>
        <div class="chip"><span class="l">Sells</span><span class="v sell" data-ov-sells>0</span></div>
        <div class="chip"><span class="l">Wallets</span><span class="v" data-ov-wallets>0</span></div>
      </div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>SlimeBot idle — set a token and start</span></div>
    </div>`}function Uu(e){return e==="volume"&&(n.volumeBots||[]).some(t=>t&&t.status!=="completed")?"running":"idle"}function qu(e){const t=Ng[R.kind];t&&t[e]&&es(t[e][0],t[e][1])}function se(e,t,a){const r=e.querySelector("[data-ogre-bg]");if(!r||R.clip===t)return;const s=_g[R.kind];if(s&&!s.has(t)&&(a&&qu(t),t=R.kind==="swap"?"appraise":R.kind==="volume"?"sweep":"idle",!s.has(t)))return;R.clip=t;const o=Fu();try{r.loop=!a,r.muted=!0,r.src=o+t+".mp4",r.load();const c=r.play();c&&c.catch&&c.catch(()=>{})}catch{}a&&(R.eventUntil=Date.now()+(t==="running"?8500:4600),qu(t))}function an(e,t){R.feed.unshift({text:e,color:t||""}),R.feed.length>16&&R.feed.pop(),R.feedIdx=0}function Xg(){const e=document.querySelector("[data-ogre-stage]");if(!e){R.tkTimer&&(clearInterval(R.tkTimer),R.tkTimer=0);return}const t=e.querySelector("[data-os-tk]");if(!t)return;if(!R.feed.length){const s=pa[R.kind];if(s)t.innerHTML='<span class="os-dot"></span>'+s.cap[1];else if(R.kind==="volume"){const o=(n.volumeBots||[]).some(c=>c&&c.status!=="completed");t.innerHTML='<span class="os-dot"></span>'+(o?"Swarm running — generating lifelike volume":"SlimeBot idle — set a token and start")}else t.innerHTML='<span class="os-dot"></span>'+(n.tradeToken?"Coin loaded — set your size and SWAP":"OgreSwap ready — paste a coin to appraise");return}const a=R.feed[R.feedIdx++%R.feed.length],r=a.color?`<span class="os-dot" style="background:${a.color};box-shadow:0 0 8px ${a.color}"></span>`:'<span class="os-dot"></span>';t.innerHTML=r+i(a.text),t.style.animation="none",t.offsetWidth,t.style.animation="os-tkin .5s ease"}function Jg(e){const t=e.querySelector("[data-ogre-stage]");if(!t){R.kind=null;return}const a=t.getAttribute("data-ogre-stage");R.kind!==a&&(R.kind=a,R.clip="",R.eventUntil=0,R.prev={},R.feed=[],R.feedIdx=0);const r=t.querySelector("[data-ogre-snd]");r&&(r.textContent=ma?"🔊":"🔇",r.onclick=o=>{o.stopPropagation(),ma=!ma;try{localStorage.setItem("ogreStageSound",ma?"on":"off")}catch{}r.textContent=ma?"🔊":"🔇"});const s=t.querySelector("[data-ogre-bg]");s&&!s.__ogreBound&&(s.__ogreBound=!0,s.addEventListener("ended",()=>{s.loop||(R.eventUntil=0,R.clip="",se(t,Uu(R.kind),!1))}),s.addEventListener("error",()=>{R.eventUntil=0,R.clip="";const o=Uu(R.kind);(o!=="idle"||s.getAttribute("src")!==Fu()+o+".mp4")&&se(t,o,!1)}));try{window.__ogreIO&&window.__ogreIO.disconnect(),s&&"IntersectionObserver"in window&&(window.__ogreIO=new IntersectionObserver(o=>{for(const c of o)if(c.isIntersecting&&!document.hidden)try{const l=s.play();l&&l.catch&&l.catch(()=>{})}catch{}else try{s.pause()}catch{}},{threshold:.06}),window.__ogreIO.observe(t)),window.__ogreVisBound||(window.__ogreVisBound=!0,document.addEventListener("visibilitychange",()=>{const o=document.querySelector("[data-ogre-bg]");if(o)if(document.hidden)try{o.pause()}catch{}else try{const c=o.play();c&&c.catch&&c.catch(()=>{})}catch{}}))}catch{}if(R.tkTimer||(R.tkTimer=setInterval(Xg,3400)),Ug(),a==="swap")try{const o=e.querySelector(".oss-stage-wrap");o&&!t.contains(o)&&(o.classList.add("os-hud"),t.appendChild(o));const c=e.querySelector(".slime-swap-card");if(c&&o){let l=c.querySelector("[data-oss-settings]");l||(l=document.createElement("div"),l.setAttribute("data-oss-settings",""),l.className="oss-settings-tray",c.insertBefore(l,c.firstChild));const u=o.querySelector(".oss-slip"),d=o.querySelector(".oss-wallet-bar");u&&u.parentElement!==l&&l.appendChild(u),d&&d.parentElement!==l&&l.appendChild(d)}}catch{}if(Eu[a])try{const o=e.querySelector(Eu[a]),c=o&&(o.closest(".quick-grid")||o.closest(".card-actions")||o.parentElement);c&&!t.contains(c)&&(c.classList.add("os-hud","os-cta"),t.appendChild(c))}catch{}a==="swap"?Zg(t):a==="volume"?eb(t):Qg(t,a)}function Yg(e){const t=pa[e];return t?`
    <div class="ogre-stage hero ${t.accent}" data-ogre-stage="${e}" data-hero="1">
      <video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${t.poster}" src="${t.base}${t.idle}.mp4"></video>
      <span class="os-tier">${i(t.tier)}</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <span class="os-led"></span>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>${i(t.cap[1])}</span></div>
    </div>`:""}function Qg(e,t){Date.now()>=R.eventUntil&&se(e,"idle",!1)}function zk(e){const t=document.querySelector(`[data-ogre-stage="${e}"]`),a=pa[e];t&&a&&R.kind===e&&se(t,a.event,!0)}function Zg(e){const t=String(n.tradeToken||"").trim(),a=t?(n.slimeShieldResults||{})[t]:null,r=e.querySelector("[data-os-shield]"),s=e.querySelector("[data-os-shield-text]"),o=e.querySelector("[data-os-gauge]"),c=e.querySelector("[data-os-read]"),l=e.querySelector("[data-os-read-v]");if(a){const p=String(a.verdict||"").toLowerCase(),f=p.includes("avoid")||p.includes("danger")||p.includes("rug")?"avoid":p.includes("safe")||p.includes("clean")||p.includes("ok")?"safe":"risk";r&&(r.className="os-shield show "+f),s&&(s.textContent=String(a.verdict||"checked").toUpperCase());const y=Number(a.score);!isNaN(y)&&o&&(o.style.height=Math.max(6,Math.min(100,y))+"%"),!isNaN(y)&&c&&l&&(c.classList.add("show"),l.textContent=Math.round(y),l.className="v "+(f==="avoid"?"down":f==="safe"?"up":"")),e.classList.toggle("loss",f==="avoid")}else r&&(r.className="os-shield"),c&&c.classList.remove("show"),o&&(o.style.height="6%"),e.classList.remove("loss");if(t&&t!==R.prev.swapToken&&(R.prev.swapToken=t,an("Appraising $"+zg(t),"#36e0c8"),se(e,"appraise",!0),!a&&typeof Ks=="function"))try{Ks(t).catch(()=>{})}catch{}const u=n.tradeResult,d=u?`${u.signature||u.message||""}|${u.type||""}`:"";if(u&&d!==R.prev.swapRes){if(R.prev.swapRes=d,u.type==="buy"){se(e,"buy",!0);const p=e.querySelector("[data-os-orb]");if(p){p.classList.add("show","up"),p.classList.remove("down");const f=p.querySelector("[data-os-orb-s]"),y=p.querySelector("[data-os-orb-p]");f&&(f.textContent=Mi(u).replace("$","").slice(0,7)),y&&(y.textContent="HELD")}an("Bought "+Mi(u),"#9dff6a")}else if(u.type==="sell"){se(e,"banking",!0);const p=e.querySelector("[data-os-orb]");p&&p.classList.remove("show"),an("Sold "+Mi(u)+" — banked","#ffd45a")}}Date.now()>=R.eventUntil&&se(e,"idle",!1)}function Hu(e,t,a,r){const s=e.querySelector("[data-ov-swarm]");if(!s)return;if(t=Math.max(0,Math.min(12,Math.round(t))),s.children.length!==t){s.innerHTML="";for(let d=0;d<t;d++){const p=document.createElement("div");p.className="ov-orb";const f=d/t*Math.PI*2-Math.PI/2;p.style.left=50+Math.cos(f)*34+"%",p.style.top=46+Math.sin(f)*30+"%",s.appendChild(p)}}const o=s.children;if(!o.length)return;const c=Number(R.prev.volBuys||0),l=Number(R.prev.volSells||0),u=(d,p)=>{for(let f=0;f<p&&f<3;f++){const y=o[Math.floor(Math.random()*o.length)];y.classList.remove("buy","sell"),y.offsetWidth,y.classList.add(d),setTimeout(()=>y.classList.remove(d),430)}};a>c&&u("buy",a-c),r>l&&u("sell",r-l),(a>c||r>l)&&es(Zr+"pulse.mp3",.32),R.prev.volBuys=a,R.prev.volSells=r}function eb(e){const a=(n.volumeBots||[]).find(u=>u&&u.status!=="completed")||null,r=!!a,s=R.prev.volActive;e.classList.toggle("live",r),r&&!s&&(an("SlimeBot online — swarm spinning up","#c06bff"),se(e,"running",!0)),!r&&s&&(an("Swept back — funds returned home","#c06bff"),se(e,"sweep",!0)),R.prev.volActive=r,Date.now()>=R.eventUntil&&se(e,r?"running":"idle",!1);const o=e.querySelector("[data-ov-budget]"),c=e.querySelector("[data-ov-ring]"),l=e.querySelector("[data-ov-read]");if(a){const u=a.stats||{},d=Number(u.buys||0),p=Number(u.sells||0),f=Number(u.fundedSol||0),y=Number(a.currentCycle||0),g=Number(a.cycles||a.maxRounds||0),S=Number(a.buyAmountSol||0);if(o){o.classList.add("show");const P=o.querySelector("[data-ov-budget-v]");P&&(P.textContent=f.toFixed(3)+" SOL");const C=g>0?Math.min(1,y/g):0,M=o.querySelector("[data-ov-budget-bar]");M&&(M.style.width=C*100+"%")}if(c){c.classList.add("show");const P=2*Math.PI*22,C=g>0?Math.min(1,y/g):0,M=c.querySelector("[data-ov-ring-prg]");M&&(M.style.strokeDasharray=P,M.style.strokeDashoffset=P*(1-C));const q=c.querySelector("[data-ov-ring-lbl]");q&&(q.textContent=y+"/"+(g||"?"))}if(l){l.classList.add("show");const P=(d+p)*S,C=(M,q)=>{const J=l.querySelector(M);J&&(J.textContent=q)};C("[data-ov-vol]",P>0?P.toFixed(2)+" SOL":"—"),C("[data-ov-buys]",String(d)),C("[data-ov-sells]",String(p)),C("[data-ov-wallets]",String(Number(a.walletCount||0)))}Hu(e,Number(a.walletCount||6),d,p);const T=(a.log||[])[0],b=T?(T.at||"")+(T.message||""):"";T&&b!==R.prev.volLog&&(R.prev.volLog=b,an(String(T.message||"").slice(0,80),""))}else o&&o.classList.remove("show"),c&&c.classList.remove("show"),l&&l.classList.remove("show"),Hu(e,0,0,0)}function tb(){const e=ce(),t=n.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const a=oi(),r=jc(),s=Vc(a)||{symbol:a==="SOL"?"SOL":w(a),name:a==="SOL"?"Solana":""},o=Vc(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=hh(),l=n.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":l?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=l?a:r,p=d&&d!=="SOL"?d:n.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${l?"100":"0.0"}" aria-label="${l?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${zc(a,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${i(p||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${zc(r,{includeCustom:!0})}
              </select>`,g=`
            <div class="oss-slot oss-pay" data-swap-slot="${l?"token":"base"}">${l?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${l?"base":"token"}">${l?f:y}</div>`;return`
    ${jg()}
    <section class="trade-layout">
      <article class="trade-card slime-swap-card ogre-swap-card ogre-swap-skin">
        <h3 class="ogre-swap-title oss-a11y-title">OgreSwap - live on-chain Solana swapper</h3>
        <div class="oss-stage-wrap">
          <div class="oss-stage oss-flat" role="group" aria-label="OgreSwap swap panel">
            ${g}
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
                ${nn(e?.publicKey&&!t?"connected":"")}
              </select>
            </label>
          </div>
        </div>
        <p class="slime-swap-route-note oss-route">${i(u)}</p>

        <p class="trade-status oss-status" data-trade-status>${n.tradeResult?i(n.tradeResult.message||"Trade complete."):"Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>Web Swapping</h3>
          <p>Uses encrypted managed wallets, route previews, safety checks, slippage settings, and the same fee logic as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${n.tradeToken?i(n.tradeToken):"Paste a CA or tap Trade from a scanner pick."}</code>
          ${n.tradeToken?`<div class="card-actions">${Ge(ki(n.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${mb()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${ab()}
        ${nb()}
      </aside>
    </section>
  `}function Bi(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!e?.volumeBot)}function Ku(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!!e?.volumeBot)}function nn(e=""){const t=Eg(e),a=Bi().map(r=>{const s=n.balances.find(l=>Number(l.index)===Number(r.index)),o=s?.sol!==null&&s?.sol!==void 0?`${Number(s.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${i(r.label)}${c} - ${o}</option>`}).join("");return t||a?`${t}${a}`:'<option value="">No wallet connected</option>'}function ab(){if(!n.tradeResult)return`
      <article>
        <h3>Latest Result</h3>
        <p>Your latest web buy or sell recap will appear here after the transaction lands.</p>
      </article>
    `;const e=n.tradeResult,t=e.type==="buy";return`
    <article class="latest-trade">
      <h3>${t?"Buy Complete":"Sell Complete"}</h3>
      <p>${i(e.message||"")}</p>
      <dl>
        <div><dt>Wallet</dt><dd>${i(e.walletLabel)}</dd></div>
        <div><dt>${t?"Spent":"Net"}</dt><dd>${i(t?e.spentSol:e.netSol)} SOL</dd></div>
        <div><dt>Fee</dt><dd>${i(e.feeSol||"0")} SOL</dd></div>
      </dl>
      <div class="card-actions">
        <button data-copy="${i(e.tokenMint)}">Copy CA</button>
        ${Ge(yg(e))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function nb(){if(!n.tradePlanResult)return`
      <article>
        <h3>Managed Exit</h3>
        <p>Use Buy + Watch Exit when you want the token trade to manage TP, SL, and timer exits automatically.</p>
      </article>
    `;const e=n.tradePlanResult;return`
    <article class="latest-trade">
      <h3>Managed Trade Armed</h3>
      <p>${i(e.message||"")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${i(e.walletLabel||`${e.successCount||0}/${e.walletCount||0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${i(e.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>${i(e.takeProfitSummary||`+${e.takeProfitPct}%`)} / ${i(e.stopLossSummary||`-${e.stopLossPct}%`)}</dd></div>
        <div><dt>Timer Exit</dt><dd>${i(hb(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${i(e.tokenMint)}">Copy CA</button>
        ${Ge(vg(e,"Armed managed trade"))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Vu(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const a=t.toLowerCase(),r=a.includes("bonk")?"Bonk":a.includes("meteora")?"Meteora":a.includes("orca")?"Orca":a.includes("raydium")?"Raydium":a.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${i(t)}">${i(r)}</span>`}function rb(){if(!n.ogreAiResult)return`
      <article class="latest-trade ogre-ai-result-card">
        <h3>Ogre A.I. Orders</h3>
        <p>Start an automation run to scan best picks, buy with selected managed wallets, and arm TP/SL exits.</p>
      </article>
    `;const e=n.ogreAiResult,t=Array.isArray(e.plans)?e.plans:[],a=Array.isArray(e.picks)?e.picks:[],r=Array.isArray(e.errors)?e.errors:[];return`
    <article class="latest-trade ogre-ai-result-card">
      <h3>${t.length?"Ogre A.I. Armed":a.length?"Ogre A.I. Picked":"Ogre A.I. Orders"}</h3>
      <p>${i(e.message||"")}</p>
      <dl>
        <div><dt>Strategy</dt><dd>Fresh Ape</dd></div>
        <div><dt>Scanned</dt><dd>${i(e.scanned||0)}</dd></div>
        <div><dt>Qualified</dt><dd>${i(e.qualified||0)}</dd></div>
        <div><dt>Plans</dt><dd>${i(e.armedCount||t.length)}</dd></div>
      </dl>
      <small>Under $5K first | sub-$8K fallback | starting volume required | honeypot, mint, freeze, and no-sell blocks stay on</small>
      <div class="ogre-ai-pick-list">
        ${t.map(s=>{const o=s.pick||{};return`
            <div class="ogre-ai-pick-card">
              <strong>${i(o.symbol||s.shortMint||"Pick")}</strong>
              ${Vu(o)}
              <span>${i(o.name||s.tokenMint||"")}</span>
              <small>Score ${i(o.score||"n/a")} | MC ${i(o.marketCapLabel||"n/a")} | Liq ${i(o.liquidityLabel||"n/a")} | Age ${i(o.ageLabel||"n/a")}</small>
              ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(c=>i(c)).join(" | ")}</small>`:""}
              <small>${i(s.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${i(s.tokenMint)}">Copy CA</button>
                <a href="${i(o.dexUrl||s.dexUrl||Q(s.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${o.pumpUrl?`<a href="${i(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":a.map(s=>`
          <div class="ogre-ai-pick-card">
            <strong>${i(s.symbol||s.shortMint||"Pick")}</strong>
            ${Vu(s)}
            <span>${i(s.name||s.tokenMint||"")}</span>
            <small>Score ${i(s.score||"n/a")} | MC ${i(s.marketCapLabel||"n/a")} | Liq ${i(s.liquidityLabel||"n/a")} | Age ${i(s.ageLabel||"n/a")}</small>
            ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(o=>i(o)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${i(s.tokenMint)}">Copy CA</button>
              <a href="${i(s.dexUrl||Q(s.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${s.pumpUrl?`<a href="${i(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(s=>`<span data-ok="false">${i(s.shortMint||s.tokenMint)}: ${i(s.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const Qn=[["strong","Strong 🔥","Highest win-rate mode. Waits for survivors (1.5–12 min old) with proven net-buying, real holders and healthy liquidity, then targets a 2x — entering before the breakout, not after. Built to win more than it loses."],["super_fresh","Super-fresh","Brand-new sub-$8K launches (under ~2 min) with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function ts(){const e=a=>Qn.some(([r])=>r===a);if(n.ogreAiCategory&&e(n.ogreAiCategory))return n.ogreAiCategory;const t=Gl().category;return e(t)?t:"strong"}function zu(e){const t=Qn.find(([a])=>a===e);return t?t[2]:Qn[0][2]}function sb(e){return`<div class="ogre-cat-segment" role="group">${Qn.map(([t,a])=>`<button type="button" data-ogre-cat="${i(t)}" data-active="${e===t}">${i(a)}</button>`).join("")}</div>`}function ob(){const e=n.ogreAutopilot||{},t=!!e.enabled,a=ju(e.category||ts()),r=(c,l)=>c==null||c===""?l:c,s=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),o=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
    <article class="ogre-autopilot ${t?"is-on":""}" data-preserve-focus>
      <div class="ogre-autopilot-head">
        <div>
          <h3>Autopilot</h3>
          <p>Auto-ape the best <strong>${i(a)}</strong> pick on a timer, using the TP/SL/timer/slippage and wallets above — within hard guards.</p>
          <p style="margin-top:6px"><a href="/autopilot" style="color:#39ff14;font-weight:800;text-decoration:none">🤖 Open Full Autopilot (paper test — no SOL) →</a></p>
        </div>
        <label class="ogre-autopilot-switch">
          <input type="checkbox" data-autopilot-enabled ${t?"checked":""}>
          <span>${t?"On":"Off"}</span>
        </label>
      </div>
      <div class="ogre-autopilot-grid">
        <label>Max SOL / hour
          <input data-autopilot-maxspend inputmode="decimal" value="${i(String(r(e.maxSpendPerHourSol,"0.3")))}">
        </label>
        <label>Max live plans
          <input data-autopilot-maxconcurrent inputmode="numeric" value="${i(String(r(e.maxConcurrent,"2")))}">
        </label>
        <label>Min score
          <input data-autopilot-minscore inputmode="numeric" value="${i(String(r(e.minScore,"62")))}">
        </label>
        <label>Every (min)
          <input data-autopilot-interval inputmode="numeric" value="${i(String(r(e.intervalMinutes,"10")))}">
        </label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-autopilot-save ${n.ogreAutopilotBusy?"disabled":""}>${n.ogreAutopilotBusy?"Saving...":"Save autopilot"}</button>
      </div>
      <small data-autopilot-status>${i(s)}${o?` — ${i(o)}`:""}</small>
    </article>
  `}function ju(e){const t=Qn.find(([a])=>a===e);return t?t[1]:"Super-fresh"}function ib(){if(!n.wallets.length)return`${en()}${O("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=Gl(),t=e.amountSol||"0.1",a=e.runCount||"1",r=(o,c,l)=>{const u=String(o||l||"");return u==="custom"?String(c||"custom"):u},s=ts();return`
    <section class="trade-layout ogre-ai-terminal">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Ogre A.I.</h3>
            <p>Pick a category, scan live setups for managed wallets, ape the best one, and arm exits from one command panel.</p>
          </div>
          <span class="sync-pill">Managed server exits</span>
        </div>

        <div class="ogre-ai-tier">
          <span class="tier-badge">CO-PILOT</span>
          <span class="tier-copy">Ogre A.I. scans, apes the best setup, and arms your exits — you stay in the loop. Want it fully hands-off with smart-money entries, laddered banking &amp; auto cash-out? <a href="/pro" class="tier-link">Unlock Pro Autopilot →</a></span>
        </div>

        <div class="ogre-cat-field" data-preserve-focus>
          <span class="ogre-cat-label">Scan category</span>
          ${sb(s)}
          <small class="ogre-cat-hint">${i(zu(s))}</small>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="${i(t)}">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              ${["1","2","3","5","10","25"].map(o=>`<option value="${o}" ${a===o?"selected":""}>${o} ${o==="1"?"order":"orders"}</option>`).join("")}
            </select>
          </label>
          ${Dt({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${Dt({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Xe("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${Dt({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${wt("ogre-ai")}
        </div>
        ${Nt("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${n.ogreAiLoading?"disabled":""}>${n.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${i(n.ogreAiStatus||zu(s))}</small>
      </article>

      <aside class="trade-side">
        ${vi({compact:!0})}
        ${ob()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${rb()}
      </aside>
    </section>
  `}function lb(){return n.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${n.bundleToken?Q(n.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${rn({toolKey:"bundle",activeKey:sn("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${i(n.bundleToken||n.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${wt("bundle")}
        </div>
        ${Nt("bundle")}
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
        <p class="trade-status" data-bundle-status>${n.bundleResult?i(n.bundleResult.message||"Bundle complete."):"Ready."}</p>`},{key:"autoexit",label:"Auto Exit",hint:"TP / SL plan",html:`
          <p>Optional timed plan for selected wallets. Use presets or type custom targets like 500 or 5x.</p>
          <div class="volume-grid">
            <label>
              Fallback Sell
              ${Xe("bundle-plan-delay","data-bundle-plan-delay","5")}
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
              ${as("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${rs("bundle-plan")}
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
        ${fb()}
        ${cb()}
      </aside>
    </section>
  `:`${en()}${O("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function cb(){if(!n.bundleResult)return`
      <article>
        <h3>Latest Bundle</h3>
        <p>Bundle buy/sell results will show here wallet by wallet.</p>
      </article>
    `;const e=n.bundleResult.source==="web_bundle_plan"?"Bundle Auto Exit Plan":n.bundleResult.type==="bundle_sell"?"Bundle Sell":"Bundle Buy";return`
    <article class="latest-trade">
      <h3>${i(e)}</h3>
      <p>${i(n.bundleResult.message||"")}</p>
      <div class="mini-results">
        ${(n.bundleResult.results||[]).map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${i(n.bundleResult.tokenMint)}">Copy CA</button>
        <a href="${i(n.bundleResult.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function wt(e,t=null){const a=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return Bi().map((s,o)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${s.index}" ${r?r.has(String(s.index))?"checked":"":o<a?"checked":""}>
      <span>${s.index}. ${i(s.label)}</span>
      <code>${i(s.shortPublicKey||s.publicKey)}</code>
    </label>
  `).join("")}function Nt(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${i(t)}">
    </label>
  `}function ub(e=""){return n.wallets.length?n.wallets.map((t,a)=>{const r=String(t.index??a+1),s=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${i(r)}" ${String(e)===r?"selected":""}>${i(s)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,a=""){const r=m(e)?.value||a;if(r!=="custom")return r;const s=m(t)?.value?.trim();if(!s)throw new Error("Enter the custom value first.");return s}function it(e,t=""){const a=n.presets?.[e]||[],r=!t||t==="none"||t==="manual",s=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return a.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${a.map(o=>`<option value="${i(o.id)}" ${o.id===t?"selected":""}>${i(o.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
    `}function Gu(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${i(He()||"0.10")}" value="${i(n.quickBuyAmountOverride)}">`}function Xu(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${Gu()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${i(e)}">
          ${it("trade",n.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const db=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],pb=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function Dt({selectAttr:e,customAttr:t,customFor:a,options:r,selected:s="",customType:o="text",customPlaceholder:c="Custom time"}){const l=String(s||""),d=new Set(r.map(([f])=>f)).has(l)?l:"custom",p=d==="custom"&&l!=="custom"?l:"";return`
    <select ${e} data-custom-select="${i(a)}">
      ${r.map(([f,y])=>`<option value="${i(f)}" ${f===d?"selected":""}>${i(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${i(a)}" type="${i(o)}" value="${i(p)}" placeholder="${i(c)}" ${d==="custom"?"":"hidden"}>
  `}function Xe(e,t,a="off"){return Dt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:db,selected:a,customPlaceholder:"Custom: 45s, 20, 2h"})}function as(e,t,a="0"){return Dt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:pb,selected:a,customPlaceholder:"Custom: 30s, 20, 2h"})}function Ri(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${Gu()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${i(e)}">
          ${it("trade",n.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${i(e)}">
          ${it("bundle",n.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function jk(){const e=n.fastTradePresetStatus||(n.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${nn()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${Xe("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${i(e)}</small>
      </div>
    </article>
  `}function Gk(){const e=n.fastBundlePresetStatus||(n.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${wt("fast-bundle-preset")}</div>
        ${Nt("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${Xe("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${i(e)}</small>
      </div>
    </article>
  `}function Ju(e){const t=e==="trade"?n.editingTradePresetId:n.editingBundlePresetId;return t?oe(e,t):null}function ns(e,t){e==="trade"&&(n.editingTradePresetId=t||""),e==="bundle"&&(n.editingBundlePresetId=t||"")}function mb(){const e=Ju("trade"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${i(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${nn(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${i(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${i(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${i(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${Xe("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${i(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${i(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${Yu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function fb(){const e=Ju("bundle"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${i(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${wt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Nt("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${i(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${i(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${i(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${Xe("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${i(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${i(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${Yu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function Yu(e){const t=n.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const a=e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId;return`
    <div class="preset-list">
      ${t.map(r=>{const s=r.id===a;return`
        <div class="preset-pill" data-readonly="${r.readonly?"true":"false"}" data-active="${s?"true":"false"}">
          <span>${i(r.name)}</span>
          <small>${i(r.amountSol)} SOL | TP ${i(r.takeProfitPct)} | SL ${i(r.stopLossPct)} | ${i(r.sellDelay||"off")}</small>
          <div class="preset-actions">
            <button type="button" class="${s?"primary":""}" data-use-preset="${i(e)}" data-preset-id="${i(r.id)}">${s?"Active":"Use"}</button>
            <button type="button" data-edit-preset="${i(e)}" data-preset-id="${i(r.id)}">Edit</button>
            <button type="button" data-delete-preset="${i(e)}" data-preset-id="${i(r.id)}">${r.readonly?"Remove":"Delete"}</button>
          </div>
        </div>
      `}).join("")}
    </div>
  `}function hb(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function rs(e){return`
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
  `}function fa(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function ss(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(s=>s.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function gb(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),a=document.querySelector(`[data-custom-select="${t}"]`);a&&(a.value="off"),ss()}function Qu(){return n.wallets.map(e=>`<option value="${i(e.index)}">${i(e.index)}. ${i(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function bb(){return n.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${Qu()}</select>
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
      <button class="primary" data-distribute-fresh ${n.distributeBusy?"disabled":""}>${n.distributeBusy?"Creating & funding...":"Create & Fund Wallets"}</button>
      <p class="trade-status" data-distribute-status>${i(n.distributeStatus||"Sends real SOL from the source wallet to each new wallet.")}</p>
    </article>
  `:""}function os(e){n.distributeStatus=String(e||"");const t=m("[data-distribute-status]");t&&(t.textContent=n.distributeStatus)}function yb(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.wallets.filter(r=>r.sessionWallet),a=t.length?t:n.wallets;return a.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${i(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${n.returnFundsBusy?"disabled":""}>${n.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${i(n.returnFundsStatus||`${a.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Zn(e){n.returnFundsStatus=String(e||"");const t=m("[data-return-funds-status]");t&&(t.textContent=n.returnFundsStatus)}async function Zu(e="leaving"){try{const t=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!t?.publicKey)return;const a=n.wallets.filter(o=>o.sessionWallet);if(!a.length)return;const r=a.map(o=>String(o.index));if(!await xe({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function vb(){if(n.returnFundsBusy)return;const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey){Zn("Connect a wallet first.");return}const t=n.wallets.filter(o=>o.sessionWallet),r=(t.length?t:n.wallets).map(o=>String(o.index));if(!r.length){Zn("No managed wallets to return from.");return}if(await xe({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){n.returnFundsBusy=!0,Zn("Selling tokens and returning SOL..."),h();try{const o=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te});n.returnFundsBusy=!1,Zn(o.summary||"Funds returned to your connected wallet."),await De({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(o){n.returnFundsBusy=!1,Zn(o.message),h()}}}async function wb(){if(n.distributeBusy)return;const e=m("[data-distribute-count]")?.value||"5",t=m("[data-distribute-amount]")?.value||"",a=m("[data-distribute-source]")?.value||"1",r=m("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){os("Enter SOL per wallet greater than zero.");return}const s=(Number(t)||0)*(Number(e)||0);if(await xe({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${s.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){n.distributeBusy=!0,os("Creating and funding wallets..."),h();try{await Y(m("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:a,label:r}),dedupe:!1,timeoutMs:te});c.downloads?.encryptedBackup?.text&&he(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&he(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.distributeBusy=!1,os(c.summary||"Fresh wallets created and funded. Backups downloaded."),await De({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){n.distributeBusy=!1,os(c.message),h()}}}function Sb(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function kb(){const e=Ku().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${n.sweepBackgroundStatus?`<small data-sweep-background-status>${i(n.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function $b(){const e=Array.isArray(n.volumeBots)?n.volumeBots:[],t=kb();return e.length?t+e.map(a=>{const r=a.stats||{},s=a.status!=="completed",o=(a.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${i(a.shortMint||a.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${i(a.stage||"")}">${i(Sb(a))}</span>
          </div>
          ${s?`<button class="secondary" data-vbot-stop="${i(a.id)}">Stop & Sweep</button>`:`<a class="mini-link" href="${i(a.dexUrl||"#")}" target="_blank" rel="noreferrer">Dex</a>`}
        </header>
        <div class="volume-bot-metrics">
          <div><span>Cycle</span><strong>${i(Number(a.currentCycle||0))}/${i(Number(a.cycles||0))}</strong></div>
          <div><span>Wallets</span><strong>${i(Number(a.walletCount||0))}</strong></div>
          <div><span>Buys</span><strong>${i(Number(r.buys||0))}</strong></div>
          <div><span>Sells</span><strong>${i(Number(r.sells||0))}</strong></div>
          <div><span>Errors</span><strong>${i(Number(r.errors||0))}</strong></div>
        </div>
        <small>${i(a.message||"")}</small>
        ${o.length?`<ul class="volume-bot-log">${o.map(c=>`<li>${i(c.message||"")}</li>`).join("")}</ul>`:""}
      </article>
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function Ii(e,t,a){return`<div class="vbot-segment" role="group">${a.map(([r,s])=>`<button type="button" data-vbot-set-${e}="${i(r)}" data-active="${t===r}">${i(s)}</button>`).join("")}</div>`}function Tb(){const t=(Array.isArray(n.volumeBots)?n.volumeBots:[]).filter(c=>c.status!=="completed"),a=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),s=c=>c.reduce((l,u)=>l+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),o=(c,l,u,d,p)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${i(c)}</h4>
      <p class="vbot-queue-sub">${i(l)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${u} / ${d}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,u/d*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${p}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${o("SMART","Smart Mode RPC Servers",a.length,10,s(a))}
      ${o("SPAMMER","Spammer RPC Servers",r.length,1,s(r))}
    </div>`}function Ab(){return`
    ${Gg()}
    <section class="trade-card volume-bot-card slime-configurator ovs-skin" data-preserve-focus>
      <h2 class="vbot-config-title oss-a11y-title">Volume Configurator</h2>
      <div class="ovs-stage ovs-flat">
        <span class="ovs-mlabel" aria-hidden="true">VOLUME CONFIGURATOR</span>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Contract Address</span>
        <input class="ovs-ca" data-vbot-token type="text" placeholder="Paste contract address" value="${i(n.volumeToken||n.tradeToken||"")}" aria-label="Contract address">
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
        <div class="ovs-mode">${Ii("mode",n.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${Ii("aggr",n.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${Qu()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Chart shape <span style="opacity:.6;font-weight:600">· the pattern it paints</span></span>
            ${Ii("stagger",n.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Uptrend"]])}
          </div>
        </div>

        <div class="vbot-config-toggles">
          <label class="vbot-toggle">
            <input type="checkbox" data-vbot-keepdust ${n.slimeBotKeepDust?"checked":""}>
            <span><strong>Leave dust</strong> — keep 1 token in each recycled wallet (looks like a real holder)</span>
          </label>
          <label class="vbot-toggle">
            <input type="checkbox" data-vbot-offset ${n.slimeBotOffset?"checked":""}>
            <span><strong>Offset sell</strong> — a different wallet sells behind each buy (no instant self-sell)</span>
          </label>
        </div>

        <div class="ovs-actions">
          <button class="primary vbot-config-start" data-vbot-start ${n.volumeBotBusy?"disabled":""}>${n.volumeBotBusy?"Starting...":"Start SlimeBot"}</button>
          ${(()=>{const e=(Array.isArray(n.volumeBots)?n.volumeBots:[]).find(t=>t&&t.status!=="completed");return e?`<button type="button" class="vbot-stop-sweep" data-vbot-stop="${i(e.id)}">&#9209; Stop &amp; Sweep Back</button>`:""})()}
        </div>
        <p class="trade-status" data-vbot-status>${i(n.volumeBotStatus||"Set a token, investment, and mode, then Start. Spends real SOL from the source wallet.")}</p>

        <div class="vbot-queue">
          <div class="vbot-queue-head"><span class="vbot-config-label small">GLOBAL QUEUE</span><strong>Queue Status</strong></div>
          ${Tb()}
        </div>

        <div class="volume-bot-list">
          ${$b()}
        </div>
      </div>
    </section>
  `}function Pb(){const e=n.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(n.slimeBotAggr)?n.slimeBotAggr:"med",a=Math.max(.05,Math.min(50,Number(m("[data-vbot-invest-num]")?.value||m("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(m("[data-vbot-duration]")?.value||"60"))),o={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",l=o.delaySecs*(c?4:1);let u=Math.round(r*60/l);u=Math.max(1,Math.min(250,u,Math.floor(a/.01)));const d=Math.max(.005,Math.min(.5,a/u));return{tokenMint:m("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:m("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(o.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(o.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(o.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!m("[data-vbot-keepdust]")?.checked,offsetSell:!!m("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(n.slimeBotStagger)?n.slimeBotStagger:"steady",investment:a,durationMin:r,mode:e,aggr:t}}function ha(e){n.volumeBotStatus=String(e||"");const t=m("[data-vbot-status]");t&&(t.textContent=n.volumeBotStatus)}async function is({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");n.volumeBots=Array.isArray(t.bots)?t.bots:[],n.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function Cb(){if(n.volumeBotBusy)return;const e=Pb();if(!e.tokenMint){ha("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await xe({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){n.volumeBotBusy=!0,ha("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:te});n.volumeBotBusy=!1,r.bot&&(n.volumeBots=[r.bot,...n.volumeBots.filter(s=>s.id!==r.bot.id)]),ha(r.bot?.message||"SlimeBot started."),h(),is()}catch(r){n.volumeBotBusy=!1,ha(r.message),h()}}}async function Lb(e){if(e)try{ha("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:te});t.bot&&(n.volumeBots=n.volumeBots.map(a=>a.id===t.bot.id?t.bot:a)),ha(t.bot?.message||"Stop requested."),h(),is()}catch(t){ha(t.message)}}function xb(){return n.wallets.length?Ab():`${en()}${O("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function Mb(){const e=ye([...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...Ne()?.rows||[],...n.scan?.rows||[]]).sort(Ze),t=hn(e),a=nt("launch",t),r=fn(),s=$t(Be().keywords)[0]||"";return`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Watch fresh live pairs by ticker/keyword before launch, then arm wallets and exits when you are ready.</p>
          </div>
          <div class="card-actions launch-head-actions">
            <button type="button" class="primary" data-refresh-live-pairs>${n.livePairsLoadingByBucket[n.livePairBucket]?"Refreshing...":"Refresh"}</button>
            <span class="sync-pill">${i(a.length)}/${i(e.length)} matching</span>
          </div>
        </div>
        ${sl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${rl(e,t)}
        ${a.length?ut(a,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Aa}):r?mr(e,"launch candidates"):O("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
        ${la("launch",t,"launch candidates")}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Launch Watch Setup</h3>
          <p>Use this only when you want SlimeWire to keep watching and buy with selected managed wallets when the ticker appears.</p>
        </article>
        ${n.wallets.length?`
        <article class="trade-card launch-watch-setup-card">
        <label>
          Ticker
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${i(s.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${wt("launch")}
        </div>
        ${Nt("launch")}
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
            ${Xe("launch-delay","data-launch-delay","3")}
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
            ${as("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${rs("launch")}
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${n.launchResult?i(n.launchResult.message||"Launch watch armed."):"Ready."}</p>
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
          <p>It scans live launch/profile feeds about every ${i(Xb())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${pd()}
        </article>
      </aside>
    </section>
  `}function ed(e=n.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||n.launchWatches?.[0]?.tokenMint||n.launchWatches?.[0]?.mint||n.smartChartToken?.tokenMint||n.smartChartToken?.mint||"").trim()}function Oi(){return!!(Jt&&Jt.enabled&&(Jt.provider||Jt.playbackBaseUrl||Jt.ingestUrl))}function Bb(){const e=String(Jt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function Rb(e){const t=String(Jt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const a=t.includes("?")?"&":"?";return`${t}${a}mint=${encodeURIComponent(e)}`}function Ib(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function td(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function Ob(e=n.launchCoinDraft||{}){const t=ed(e),a=Oi(),r=Rb(t),s=n.pumpLiveStatus||(t?a?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),o=t?"":"disabled",c=a&&r?`<iframe class="pump-live-frame" src="${i(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
    <section class="launch-coin-card pump-live-panel" data-pump-live-panel>
      <div class="pump-live-head">
        <div>
          <p class="panel-kicker">Pump Live</p>
          <h4>Live launch studio</h4>
          <p>Keep the launch, chart, transactions, and creator controls inside Slime.</p>
        </div>
        <span class="pump-live-pill ${a?"ready":"standby"}">${i(a?"provider ready":"standby")}</span>
      </div>
      <div class="pump-live-grid">
        <div class="pump-live-video">
          ${c}
        </div>
        <div class="pump-live-stack">
          <div class="pump-live-stat"><span>Launch CA</span><strong>${i(Ib(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${i(Bb())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${i(td(t))}</strong></div>
        </div>
      </div>
      <div class="quick-grid pump-live-controls">
        <button type="button" data-pump-live-action="go" ${o}>Go Live</button>
        <button type="button" data-pump-live-action="chart" ${o}>Chart + Txns</button>
        <button type="button" data-pump-live-action="copy" ${o}>Copy Stream ID</button>
        <button type="button" data-pump-live-action="obs" ${o}>OBS / Mobile Setup</button>
        <button type="button" data-pump-live-action="end" ${o}>End Live</button>
      </div>
      <p class="pump-live-status">${i(s)}</p>
    </section>
  `}function rn({toolKey:e,activeKey:t,sections:a,variant:r=""}){const s=a.some(o=>o.key===t)?t:a[0]?.key;return`
    <div class="tool-panels${r==="stacked"?" is-stacked":""}" data-tool-panels="${i(e)}">
      <nav class="tool-panel-nav" aria-label="Sections">
        ${a.map(o=>`
          <button type="button" class="tool-panel-tab" data-tool-section="${i(e)}:${i(o.key)}" data-active="${o.key===s?"true":"false"}">
            <span class="tool-panel-tab-label">${i(o.label)}</span>
            ${o.hint?`<span class="tool-panel-tab-hint">${i(o.hint)}</span>`:""}
          </button>`).join("")}
      </nav>
      <div class="tool-panel-stack">
        ${a.map(o=>`
          <section class="tool-panel" data-tool-panel="${i(e)}:${i(o.key)}"${o.key===s?"":" hidden"}>
            ${o.title?`<h4 class="tool-panel-title">${i(o.title)}</h4>`:""}
            ${o.html}
          </section>`).join("")}
      </div>
    </div>
  `}function sn(e,t){return n.toolSections&&n.toolSections[e]||t}function Eb(){const e=n.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,a=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
    <section class="trade-card launch-share-kit">
      <div class="trade-head">
        <div>
          <h3>🚀 Your launch is live - now shill it</h3>
          <p>$${i(e.symbol||e.name||"")} has its own room: chart, shield read, call board, and one-tap trading. Post the link, not the CA.</p>
        </div>
      </div>
      <div class="card-actions compact">
        <a class="button-like primary" href="/t?ca=${encodeURIComponent(e.tokenMint)}" target="_blank" rel="noreferrer">Open Launch Room</a>
        <button data-copy="${i(t)}">Copy Room Link</button>
        <a class="button-like" href="${i(Va(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ge(a+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function Fb(e={}){ad();const t=n.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
    <div class="volume-grid">
      <p class="muted full-span">Build the audience BEFORE you mint: schedule the launch, share the countdown page everywhere, and every "notify me" gets the chart link the second your Pump Launch completes.</p>
      <label>
        Token Name
        <input data-hype-name type="text" placeholder="Defaults to Coin Details name" value="${i(e.name||"")}">
      </label>
      <label>
        Ticker
        <input data-hype-symbol type="text" placeholder="Defaults to Coin Details ticker" value="${i(e.symbol||"")}">
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
      <p class="trade-status full-span" data-hype-status>${i(n.hypeStatus||"")}</p>
      ${t.length?`
        <div class="full-span">
          ${t.map(s=>`
            <div class="row-card">
              <div class="row-main">
                <strong>$${i(s.symbol)} ${s.mint?"🚀 launched":"⏳ counting down"}</strong>
                <small>${i(s.subscribers||0)} waiting | ${i(s.url)}</small>
              </div>
              <div class="card-actions compact">
                <button data-copy="${i(s.url)}">Copy Link</button>
                <a class="button-like" href="${i(s.url)}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>`).join("")}
        </div>`:""}
    </div>`}let ls="";function ad(){!n.user||ls===n.user.id||(ls=n.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});n.hypePages=e.pages||[],n.hypePages.length&&h()}catch{ls=""}})())}async function Wb(){const e=m("[data-hype-status]"),t=String(m("[data-hype-name]")?.value||m("[data-launch-coin-name]")?.value||"").trim(),a=String(m("[data-hype-symbol]")?.value||m("[data-launch-coin-symbol]")?.value||"").trim(),r=String(m("[data-hype-launch-at]")?.value||"").trim(),s=String(m("[data-hype-blurb]")?.value||"").trim();if(!t||!a){v(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){v(e,"Pick the launch time.");return}v(e,"Creating hype page...");try{const o=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:a,blurb:s,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});n.hypeStatus=`Hype page live: ${o.url} - share it everywhere, it forwards to your chart at launch.`,ls="",ad(),h()}catch(o){v(e,N(o?.message||"Could not create the hype page."))}}function _b(){const e=n.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
          <div class="volume-grid">
            <label>
              Token Name
              <input data-launch-coin-name type="text" placeholder="Example: Ogre Mode" value="${i(e.name||"")}">
            </label>
            <label>
              Ticker
              <input data-launch-coin-symbol type="text" placeholder="Example: OGRE" value="${i(e.symbol||"")}">
            </label>
            <label class="full-span">
              Description
              <textarea data-launch-coin-description rows="3" placeholder="Short public token description">${i(e.description||"")}</textarea>
            </label>
            <label class="full-span">
              Image
              <input data-launch-coin-image type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,.avif">
              <span class="muted">SlimeWire converts common phone and desktop images during launch. Use a clear square JPG, PNG, WEBP, or screenshot for best results.</span>
              <span class="launch-image-preview-wrap" data-launch-image-preview-wrap ${e.imageDataUrl?"":"hidden"}>
                <img class="launch-image-preview" data-launch-image-preview ${e.imageDataUrl?`src="${e.imageDataUrl}"`:""} alt="Coin image preview">
                <span class="launch-image-preview-meta" data-launch-image-preview-meta>${i(e.imageName?`${e.imageName} · saved with the sheet`:"")}</span>
              </span>
            </label>
            <label class="full-span">
              Banner (optional)
              <input data-launch-coin-banner type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif">
              <span class="muted">Wide 3:1 cover image or animated GIF (1500×500). Saved with your coin, pinned to IPFS, and shown on its SlimeWire page. SlimeWire resizes stills to 1500×500.</span>
              <span class="launch-image-preview-wrap" data-launch-banner-preview-wrap ${e.bannerDataUrl?"":"hidden"}>
                <img class="launch-image-preview" data-launch-banner-preview ${e.bannerDataUrl?`src="${e.bannerDataUrl}"`:""} alt="Coin banner preview" style="aspect-ratio:3/1;object-fit:cover;width:100%;max-width:360px;">
                <span class="launch-image-preview-meta" data-launch-banner-preview-meta>${i(e.bannerName?`${e.bannerName} · saved with the sheet`:"")}</span>
              </span>
            </label>
          </div>`},{key:"socials",label:"Socials",hint:"Optional links",title:"Socials (optional)",html:`
          <div class="volume-grid">
            <label>
              Website
              <input data-launch-coin-website type="url" placeholder="https://..." value="${i(e.website||"")}">
            </label>
            <label>
              X
              <input data-launch-coin-x type="text" placeholder="@handle or URL" value="${i(e.x||"")}">
            </label>
            <label>
              Telegram
              <input data-launch-coin-telegram type="url" placeholder="https://t.me/..." value="${i(e.telegram||"")}">
            </label>
          </div>`},{key:"fees",label:"Fees",hint:"Creator fees",title:"Creator Fees (optional)",html:`
          <div class="volume-grid">
            <label>
              Creator / dev fee (you keep 100% of these)
              <select data-launch-coin-creator-fee onchange="(this.closest('.volume-grid')||document).querySelector('[data-launch-coin-fee-custom-wrap]').hidden=(this.value!=='custom')">
                <option value="1000" ${!e.creatorFeeBps||String(e.creatorFeeBps)==="1000"||String(e.creatorFeeBps)==="0"?"selected":""}>100% — max creator fees (most pick this)</option>
                <option value="custom" ${e.creatorFeeBps&&!["0","1000"].includes(String(e.creatorFeeBps))?"selected":""}>Custom %</option>
              </select>
            </label>
            <label data-launch-coin-fee-custom-wrap ${e.creatorFeeBps&&!["0","1000"].includes(String(e.creatorFeeBps))?"":"hidden"}>
              Custom fee % (max 10%)
              <input data-launch-coin-creator-fee-custom type="number" min="0" max="10" step="0.5" placeholder="e.g. 2" value="${e.creatorFeeBps&&!["0","1000"].includes(String(e.creatorFeeBps))?Number(e.creatorFeeBps)/100:""}">
            </label>
            <label>
              Creator Fee Wallet
              <input data-launch-coin-fee-recipient type="text" placeholder="Optional wallet address" value="${i(e.creatorFeeRecipient||"")}">
            </label>
            <label>
              Dev fees (where creator fees go)
              <select data-launch-coin-fee-mode>
                <option value="dev" ${(e.feeMode||"dev")==="dev"?"selected":""}>100% to my dev wallet (most pick this)</option>
                <option value="buyback" ${e.feeMode==="buyback"?"selected":""}>Custom — route to buyback wallet</option>
                <option value="burn" ${e.feeMode==="burn"?"selected":""}>Custom — burn creator fees</option>
                <option value="split" ${e.feeMode==="split"?"selected":""}>Custom — split dev / buyback</option>
              </select>
            </label>
            <label>
              Buyback Wallet
              <input data-launch-coin-buyback-wallet type="text" placeholder="Optional buyback wallet" value="${i(e.buybackWallet||"")}">
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
                ${ub(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
              </select>
            </label>
            <label>
              Dev Buy SOL (launch amount)
              <input data-launch-coin-dev-buy-sol type="text" inputmode="decimal" autocomplete="off" placeholder="0.05" value="${i(e.devBuySol||"")}">
            </label>
            <p class="muted full-span">Set the dev wallet buy amount here. After launch, SlimeWire can run the Dev Wallet Initial Buy first, then continue into your selected post-launch action.</p>
          </div>`},{key:"after",label:"After Launch",hint:"Auto trade / bundle",title:"Post-Launch Action",html:`
          <div class="volume-grid">
            <p class="muted full-span">With Auto Bundle, the checked wallets buy AT launch (right behind the create) with these TP/SL/timer settings armed automatically. Other actions route the live CA into that tool after launch.</p>
            <label>
              Live CA After Launch
              <input data-launch-coin-ca type="text" placeholder="Auto-filled after launch, or paste CA manually" value="${i(e.tokenMint||"")}">
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
                ${it("trade",e.tradePresetId||n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${it("bundle",e.bundlePresetId||n.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${i(e.amountSol||He()||"0.1")}">
            </label>
            <label>
              Sell Percent
              <input data-launch-coin-sell-percent type="number" min="1" max="100" step="1" value="${i(e.sellPercent||"100")}">
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
              ${Xe("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
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
                ${n.wallets.length?wt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Nt("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:Fb(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:Ob(e)}];return`
    ${Eb()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${rn({toolKey:"launchCoin",activeKey:sn("launchCoin","coin"),sections:t})}

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${i(n.launchCoinStatus||"Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The Dex metadata link remains as a fallback tool.")}</p>
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
          ${pd()}
        </article>
      </aside>
    </section>
  `}function Nb(){const e=n.launchCoinDraft||{},t=m("[data-launch-coin-image]")?.files?.[0];return{name:(m("[data-launch-coin-name]")?.value||"").trim(),symbol:(m("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(m("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",bannerName:m("[data-launch-coin-banner]")?.files?.[0]?.name||e.bannerName||"",bannerDataUrl:e.bannerDataUrl||"",bannerType:e.bannerType||"",website:(m("[data-launch-coin-website]")?.value||"").trim(),x:(m("[data-launch-coin-x]")?.value||"").trim(),telegram:(m("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:(()=>{const a=m("[data-launch-coin-creator-fee]")?.value;return a==="custom"?String(Math.min(1e3,Math.max(0,Math.round((Number(m("[data-launch-coin-creator-fee-custom]")?.value)||0)*100)))):a||e.creatorFeeBps||"1000"})(),creatorFeeRecipient:(m("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:m("[data-launch-coin-fee-mode]")?.value||e.feeMode||"dev",buybackWallet:(m("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!m("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!m("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:m("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:X(m("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(m("[data-launch-coin-ca]")?.value||"").trim(),action:m("[data-launch-coin-action]")?.value||"watch",tradePresetId:m("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:m("[data-launch-coin-bundle-preset]")?.value||"",amountSol:X(m("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:m("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:qe("launch-coin"),walletGroup:m("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function cs(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function er({silent:e=!1}={}){try{const t=Nb();n.launchCoinDraft=t,Ba(t);const a=t.name||t.symbol||"launch";return n.launchCoinStatus=`Saved ${a}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${cs(t.action)}.`,e||v(m("[data-launch-coin-status]"),n.launchCoinStatus),t}catch(t){throw n.launchCoinStatus=t.message,v(m("[data-launch-coin-status]"),t.message),t}}function nd(e){return new Promise((t,a)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>a(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function rd(e){return new Promise((t,a)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>a(new Error("Could not preview that image for compression.")),r.src=e})}function on(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function sd(e){if(!e)return"";const t=8*1024*1024,a=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const s=await nd(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(s.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return s}try{const o=await rd(s),c=384,l=Math.min(1,c/Math.max(o.width||c,o.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((o.width||c)*l)),u.height=Math.max(1,Math.round((o.height||c)*l)),u.getContext("2d").drawImage(o,0,0,u.width,u.height);const p=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of p){const g=u.toDataURL(f,y);if(g.length<=a)return g}}catch(o){const c=m("[data-launch-coin-status]"),l="Preview unavailable; SlimeWire will try to convert this image during launch.";if(n.launchCoinStatus=l,v(c,l),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:o?.message||""}),s.length<=r)return s}if(s.length<=r){const o=m("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return n.launchCoinStatus=c,v(o,c),s}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function od(e){if(!e)return"";const t=8*1024*1024,a=7e6;if(e.size>t)throw new Error("Banner is over 8MB. Use a smaller wide image or GIF (1500×500 works best).");const r=await nd(e);if(e.type==="image/gif"||/\.gif$/i.test(e.name||"")){if(r.length>a)throw new Error("Animated banner is too large. Keep it under ~5MB.");return r}try{const s=await rd(r),o=1500,c=Math.min(1,o/Math.max(1,s.width||o)),l=document.createElement("canvas");l.width=Math.max(1,Math.round((s.width||o)*c)),l.height=Math.max(1,Math.round((s.height||Math.round(o/3))*c)),l.getContext("2d").drawImage(s,0,0,l.width,l.height);for(const[d,p]of[["image/webp",.82],["image/webp",.7],["image/jpeg",.8],["image/jpeg",.66]]){const f=l.toDataURL(d,p);if(f.length<=a)return f}}catch{}if(r.length<=a)return r;throw new Error("Banner is too large for upload. Use a smaller wide image or GIF.")}async function Db(){const e=m("[data-launch-coin-banner]")?.files?.[0];if(e){const a=await od(e);return{bannerName:e.name,bannerType:on(a,e.type||"image/jpeg"),bannerDataUrl:a}}const t=n.launchCoinDraft||{};return t.bannerDataUrl?{bannerName:t.bannerName||"banner",bannerType:t.bannerType||on(t.bannerDataUrl,"image/jpeg"),bannerDataUrl:t.bannerDataUrl}:{}}async function Ub(){const e=m("[data-launch-coin-image]")?.files?.[0];if(e){const a=await sd(e);return{imageName:e.name,imageType:on(a,e.type||"application/octet-stream"),imageDataUrl:a}}const t=n.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||on(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function id(e,t){const a=String(t||"").trim();n.launchCoinDraft={...e||{},tokenMint:a,updatedAt:new Date().toISOString()},Ba(n.launchCoinDraft),n.terminalToken=a,n.terminalAutoToken=a,n.tradeToken=a,n.bundleToken=a,n.volumeToken=a,n.smartChartToken=a,e?.tradePresetId&&(n.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(n.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(n.quickBuyAmountOverride=X(e.amountSol))}function qb(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Hb(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,walletIndexes:[a],amountSol:X(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function ld(e={}){const t=e.bundlePresetId?oe("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Kb(){const e=er({silent:!0}),t=String(e.tokenMint||"").trim(),a=m("[data-launch-coin-status]");if(!t||t.length<32){n.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",v(a,n.launchCoinStatus);return}id(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";n.launchCoinStatus=`Loaded ${w(t)} into ${cs(e.action)}. Review the selected preset before sending any trade.`,Te("/terminal",r),h({force:!0})}async function Vb(e,t){const a=Date.now();let r="",s=0;for(;Date.now()-a<18e4;){await Le(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,s=0}catch{if(s+=1,s===4){const p="Progress feed reconnecting...";n.launchCoinStatus=p,v(t,p)}if(s>=15){const p=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw p.launchAttemptId=e,p}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const d=new Error(c.failureReason||"Launch failed.");throw d.launchAttemptId=e,d}const l=Math.round((Date.now()-a)/1e3),u=`${c.stageText||"Working..."} · ${l}s`;u!==r&&(r=u,n.launchCoinStatus=u,v(t,u))}const o=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw o.launchAttemptId=e,o}const cd=new Map;function ud(e){const t=String(e||"").trim();t&&cd.set(t,Date.now()+3e4)}function zb(e){const t=cd.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function dd(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(n.tradePlans=e.plans)}catch{}}function jb(e,t={},a={}){const r=String(e||"").trim();if(!r)return;const s=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||w(r),o=String(t.name||"").slice(0,48),c=Number(a.bundledWalletCount||0)+(a.devBuyIncluded?1:0)||1;(n.positions||[]).some(u=>String(u.tokenMint||u.mint)===r)||(n.positions=[{tokenMint:r,symbol:s,name:o,shortMint:w(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...n.positions||[]]),n.smartChartToken=r,n.terminalToken=r,Yi({tokenMint:r,symbol:s,name:o,imageUrl:t.imageDataUrl||"",source:"launch"}),Yd(r)}async function Gb(){if(n.launchCoinSubmitting)return;const e=m("[data-launch-coin-status]"),t=m("[data-launch-coin-submit]");n.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const a=er({silent:!0});if(!a.name||String(a.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!a.symbol||String(a.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!m("[data-launch-coin-image]")?.files?.[0]&&!n.launchCoinDraft?.imageDataUrl&&!await xe({title:"No Coin Image Selected",lines:[`${a.name} (${a.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){n.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",v(e,n.launchCoinStatus);return}n.launchCoinStatus="Preparing image for SlimeWire backend conversion...",v(e,n.launchCoinStatus);const r=await Ub(),s=await Db(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let c=null;if(a.action==="bundle"){const g=ld(a);c={walletIndexes:g.walletIndexes||[],walletGroup:g.walletGroup||"",amountSol:g.amountSol||"0",slippageBps:g.slippageBps||"300"}}const l={...a,...r,...s,launchAttemptId:o,...c?{bundleBuy:c}:{}},u=JSON.stringify(l);if(u.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:a.symbol,selectedDevWalletId:a.selectedDevWalletId||a.devWalletIndex||a.devWalletPublicKey||""}),n.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,v(e,n.launchCoinStatus);let p=(await k("/api/web/launch/coin",{method:"POST",body:u,timeoutMs:te,preserveSafeError:!0})).launch||{};p.async&&p.status==="RUNNING"&&p.launchAttemptId&&(p=await Vb(p.launchAttemptId,e));const f=String(p.tokenMint||p.mint||p.ca||p.contractAddress||"").trim(),y=p.signature?` Signature: ${w(p.signature)}.`:"";if(!f){n.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${y} The CA will appear above when it lands — then trade it from the Swap panel.`,v(e,n.launchCoinStatus);return}id(a,f),n.launchShareKit={tokenMint:f,symbol:a.symbol||"",name:a.name||"",at:Date.now()},n.launchCoinDraft={tokenMint:f};try{Ba(n.launchCoinDraft)}catch{}if(p.bundled){const g=Number(p.bundledWalletCount||0),A=[p.devBuyIncluded?"dev buy":"",g>0?`${g} bundle buy${g===1?"":"s"}`:""].filter(Boolean).join(" + ");n.launchCoinStatus=p.bundleFallback?`Launched ${w(f)} via the standard path (bundle missed the block lottery)${A?` - server fired ${A} right behind the create`:""}.${y} Opening chart...`:`Launch bundled atomically: ${w(f)}${A?` (${A} landed in-block)`:""}${p.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${y} Opening chart...`,v(e,n.launchCoinStatus),jb(f,a,p),K(p.signature||"","pump-launch-first-buys"),yt({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(p.bundleFallback||p.exitsArmed)&&ud(f),[3e3,8e3,16e3].forEach(T=>window.setTimeout(()=>{dd().then(()=>h())},T)),Te("/terminal/chart","smartChart"),h({force:!0});return}if(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Routing into ${cs(a.action)}...`,v(e,n.launchCoinStatus),a.devBuyEnabled&&(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Running Dev Wallet Initial Buy first...`,v(e,n.launchCoinStatus),await Cs(f,Hb(a)),n.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${cs(a.action)} setup...`,v(e,n.launchCoinStatus)),a.action==="trade"){await Cs(f,qb(a));return}if(a.action==="bundle"){await Nd(f,ld(a));return}if(a.action==="launch-watch"){n.activeTab="launch",Te("/terminal","launch"),h({force:!0});return}Te("/terminal/chart","smartChart"),h({force:!0})}catch(a){const r=a.launchAttemptId&&!String(a.message||"").includes(a.launchAttemptId)?` Launch ID: ${a.launchAttemptId}.`:"";n.launchCoinStatus=`${a.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:a.launchAttemptId||"",stage:a.stage||"",code:a.code||"",providerStatus:a.providerStatus||null,message:a.message||"Launch failed."}),v(e,n.launchCoinStatus),$(n.launchCoinStatus)}finally{n.launchCoinSubmitting=!1;const a=m("[data-launch-coin-submit]");a&&(a.disabled=!1,a.textContent=a.dataset.prevLabel||"Launch on Pump")}}function Xb(){const e=n.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function pd(){return n.launchWatches.length?`
    <div class="mini-results">
      ${n.launchWatches.map(e=>`
        <span>
          $${i(e.ticker)} - ${i(e.status)} - ${i(e.walletCount)} wallet(s)
          ${Ge(Tg(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${i(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function us(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function md(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),a=Je(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),s=String(e.kolName||e.traderName||e.kol_name||"").trim(),o=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||a||s||r,wallet:t,kolWallet:t,twitter:a,handle:a,name:s||o||e.signalType||e.symbol||w(r),displayName:s||o||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:E(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||a?1:0),currentPositionCount:E(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:n.kolLastUpdatedAt||new Date().toISOString()}}function ds(e={}){const t=Number(E(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),a=lt(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(a),s=r?Math.max(0,Math.min(100,Math.round(a))):0,o=!r||t<5,c=o?"Mixed":s>=50?"High Dump Risk":s>=30?"Dump Risk":s<=15?"Trusted Flow":"Mixed",l=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=l[0]||"",d=Je(e.handle||e.twitter||""),p=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,g)=>/^https?:\/\//i.test(String(f.url||""))&&g.findIndex(S=>String(S.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:us(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:l,callsTracked:t,currentPositionCount:E(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:s,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?s:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:o,confidence:o?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:p,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:o?["Low local sell-window history. Wallet-based until social signal data is available."]:s>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Jb(e=[]){const t=new Map;for(const a of e.filter(Boolean)){const r=String(a.kolId||us(a)||"").trim();if(!r)continue;const s=t.get(r);t.set(r,s?{...s,...a,kolId:r}:{...a,kolId:r})}return[...t.values()]}function ps(){const e=Array.isArray(n.kolDumpStats?.stats)?n.kolDumpStats.stats:[],t=Array.isArray(n.kolScan?.kols)?n.kolScan.kols:[],a=Array.isArray(n.kolScan?.rows)?n.kolScan.rows.map(md):[],r=!e.length&&!t.length&&!a.length?$i():[];return Jb([...e,...t.map(ds),...a.map(ds),...r.map(ds)]).filter(s=>s.kolId)}function Yb(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function tr(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${Yb(e)} · ${t}`}function fd(e={}){const t=us(e);return t?ps().find(a=>String(a.kolId||"")===t)||ds(e):null}function Qb(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const a=_t(t)?t:"";return{kolId:t,displayName:a?w(a):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:a?[a]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:a?`https://solscan.io/account/${encodeURIComponent(a)}`:""},{label:"KOLscan",url:a?`https://kolscan.io/account/${encodeURIComponent(a)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function Ei(e={},t="KOL Info"){if(!D("kolDumpDetectorEnabled",!0))return"";const a=fd(e),r=String(a?.kolId||us(e)||"").trim();if(!r)return"";const s=a?tr(a):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${i(r)}" title="${i(s)}">${i(t)}</button>`}function hd(e={},t="KOL Info"){return D("kolDumpDetectorEnabled",!0)?Ei(md(e),t):""}function Zb(e={}){if(!D("kolDumpDetectorEnabled",!0))return"";const t=fd(e);return t?.kolId?`<small class="kol-dump-inline">${i(tr(t))}</small>`:""}function Xk(){if(!D("kolDumpDetectorEnabled",!0))return"";const e=ps().slice(0,6);return`
    <section class="kol-dump-panel">
      <div class="terminal-title-row">
        <div>
          <h3>KOL Dump Detector</h3>
          <p>Tracks whether watched KOL wallets tend to sell into followers.</p>
        </div>
        <span>${n.kolDumpStatsLoading?"Updating":e.length?`${e.length} tracked`:"Low data"}</span>
      </div>
      <small>${i(n.kolDumpStats?.message||"Wallet-based until social signal data is available.")}</small>
      ${e.length?`
        <div class="kol-dump-list">
          ${e.map(t=>`
            <article class="kol-dump-row">
              <div>
                <strong>${i(t.displayName||"KOL Wallet")}</strong>
                <span>${i(t.handle?`@${t.handle}`:t.walletAddresses?.[0]?w(t.walletAddresses[0]):"wallet pending")}</span>
              </div>
              <p>${i(tr(t))}</p>
              <button type="button" data-kol-dump-details="${i(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:O("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function Fi(e={}){if(!D("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&n.kolDumpStatsLoadedAt&&Date.now()-Number(n.kolDumpStatsLoadedAt||0)<900*1e3)return n.kolDumpStats;if(n.kolDumpStatsLoading)return null;n.kolDumpStatsLoading=!0;try{const a=new URLSearchParams({mode:n.kolMode||"hot"});n.kolWallet&&a.set("wallet",n.kolWallet),t&&a.set("force","true");const r=await k(`/api/web/kols/dump-stats?${a.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return n.kolDumpStats=r,n.kolDumpStatsLoadedAt=Date.now(),ne(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return n.kolDumpStats=n.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},n.kolDumpStatsLoadedAt=Date.now(),null}finally{n.kolDumpStatsLoading=!1,n.kolDumpDetails?.open?ms():n.activeTab==="kol"&&h({force:!0})}}function ey(e=""){const t=String(e||"").trim();!t||!D("kolDumpDetectorEnabled",!0)||(n.kolDumpDetails={open:!0,kolId:t},Ua(),ms(),Fi({force:!0}))}function Wi(){n.kolDumpDetails={open:!1,kolId:""},ms(),Fr()}function ms(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=n.kolDumpDetails||{},a=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",a),!a||!D("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=ps().find(d=>String(d.kolId)===String(t.kolId))||Qb(t.kolId),s=!!n.kolDumpStatsLoading,o=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(d=>/^https?:\/\//i.test(String(d?.url||""))).slice(0,4):[],l=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",u=`
    <div class="slimeshield-drawer-backdrop" data-kol-dump-close></div>
    <aside class="kol-dump-drawer" role="dialog" aria-modal="true" aria-label="KOL Dump Detector details">
      <header>
        <div>
          <span>KOL Dump Detector</span>
          <h3>${i(r.displayName||"KOL Wallet")}</h3>
        </div>
        <button type="button" data-kol-dump-close>Close</button>
      </header>
      <section class="kol-dump-detail-summary">
        <strong>${i(r.riskLabel||"Mixed")}</strong>
        <p>${i(tr(r))}</p>
        <small>${s?"Updating from KOL sources...":`Confidence: ${i(r.confidence||"low")} · Source: ${i(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${i(Se(r.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Calls tracked</dt><dd>${i(r.callsTracked??0)}</dd></div>
        <div><dt>Current positions</dt><dd>${i(r.currentPositionCount??0)}</dd></div>
        <div><dt>Sold within 15m</dt><dd>${r.soldWithin15mPercent==null?"n/a":`${i(r.soldWithin15mPercent)}%`}</dd></div>
        <div><dt>Sold within 60m</dt><dd>${r.soldWithin60mPercent==null?"n/a":`${i(r.soldWithin60mPercent)}%`}</dd></div>
        <div><dt>Median hold</dt><dd>${r.medianHoldMinutes==null?"n/a":`${i(r.medianHoldMinutes)}m`}</dd></div>
        <div><dt>Median drawdown</dt><dd>${r.medianPostSignalDrawdownPercent==null?"n/a":`${i(r.medianPostSignalDrawdownPercent)}%`}</dd></div>
        <div><dt>30m survival</dt><dd>${r.followerSurvival30mPercent==null?"n/a":`${i(r.followerSurvival30mPercent)}%`}</dd></div>
        <div><dt>Last token seen</dt><dd>${i(l)}</dd></div>
      </dl>
      <section>
        <h4>Cached Profile Info</h4>
        <ul class="slimeshield-factor-list">
          <li><span>Wallets: ${i(o.length?o.map(w).join(", "):"not returned")}</span></li>
          <li><span>First seen: ${i(r.firstSeenAt?Se(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${i(r.lastSeenAt?Se(r.lastSeenAt):"n/a")}</span></li>
          <li><span>Source: ${i(String(r.historySource||"cached profile").replace(/_/g," "))}</span></li>
        </ul>
        ${c.length?`<div class="slimeshield-drawer-actions">${c.map(d=>`<a href="${i(d.url)}" target="_blank" rel="noreferrer">${i(d.label||"Open")}</a>`).join("")}</div>`:""}
      </section>
      <section>
        <h4>Interpretation</h4>
        <ul class="slimeshield-factor-list">
          ${(r.reasons||["No local sell-window history yet."]).map(d=>`<li><span>${i(d)}</span></li>`).join("")}
        </ul>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-kol-dump-refresh="${i(t.kolId)}" ${s?"disabled":""}>${s?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `;hr(e,u,".kol-dump-drawer")}function ty(){const e=n.kolScan?.configured!==!1,t=n.kolLoading?"disabled":"",a=String(n.kolMode||"hot"),r=!!n.kolScan,s=!!n.kolScan?.kols?.length,o=s&&a!=="hot",c=!r&&!s;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${n.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${n.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${n.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${n.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${n.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${n.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${i(ny(n.kolMode))}</p>
    ${ay()}
    ${o?sy():c?Lg():""}
    ${n.kolMode==="slimewire"&&n.kolScan?n.kolScan.kols?.length?"":O("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):n.kolScan?oy():O("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
        ${n.wallets.length?`
          <div class="wallet-checks">
            ${wt("kol")}
          </div>
          ${Nt("kol")}
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
            ${Xe("kol-delay","data-kol-delay","5")}
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
            ${as("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${rs("kol")}
        <p class="trade-status" data-kol-status>${n.kolResult?i(n.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${ry()}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Custom KOL Wallet</h3>
          <p>Paste any public Solana wallet to inspect current holdings, open an outside trader profile, or arm copy-watch from your selected wallets.</p>
          <label>
            Wallet Address
            <input data-kol-wallet type="text" placeholder="Paste KOL wallet" value="${i(n.kolWallet||"")}">
          </label>
          <div class="card-actions">
            <button data-kol-wallet-scan ${t}>${n.kolLoading?"Scanning...":"Scan Wallet"}</button>
            ${n.kolWallet?`<button class="primary" data-kol-copy-wallet="${i(n.kolWallet)}" ${t}>Copy Wallet Next Buy</button>`:""}
            ${n.kolWallet?Ge(Lu(n.kolWallet),"Share KOL"):""}
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
  `}function ay(){const e=n.kolScan||null,t=ar(n.kolMode),a=n.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),s=Number(e?.rows?.length||0),o=n.kolLastUpdatedAt?Se(n.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${i(a)}</span>
      <span>${i(r)} KOLs</span>
      <span>${i(s)} signals</span>
      <span>${i(o)}</span>
    </div>
  `}function ar(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function ny(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function ry(){const e=n.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function sy(){const e=n.kolScan||{},t=(e.kols||[]).filter(a=>a.wallet||a.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${i(e.label||"KOL Tracker")}</h3>
          <p>${i(`${ar(n.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${i(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((a,r)=>`
          <article class="kol-profile">
            ${Iu(a)}
            <div class="pick-top">
              <span>${r+1}</span>
              <h3>${i(a.name||a.shortWallet||"KOL Wallet")}</h3>
              <em>${i(a.winRateLabel||"n/a")}</em>
            </div>
            <p>${a.twitter?`@${i(a.twitter)}`:i(a.shortWallet||a.wallet||"")}</p>
            <dl>
              <div><dt>Realized</dt><dd>${i(a.realizedLabel||"n/a")}</dd></div>
              <div><dt>ROI</dt><dd>${i(a.roiLabel||"n/a")}</dd></div>
              <div><dt>Trades</dt><dd>${i(a.trades??"n/a")}</dd></div>
            </dl>
            <small>${i(a.source==="slimewire"?`Tracking ${a.trackedWalletMode==="manual"?`${a.trackedWalletCount||0} wallet(s)`:"all wallets"}`:a.volumeLabel||"Volume n/a")} | Last trade: ${i(Se(a.lastTradeAt))}</small>
            ${Zb(a)}
            <div class="card-actions kol-profile-actions">
              ${a.solscanUrl?`<a href="${i(a.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${a.kolscanUrl||a.wallet?`<a href="${i(a.kolscanUrl||Cc(a.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${Ei(a)}
              ${Ge($g(a),"Share Watch")}
              ${a.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a.wallet)}">Copy Trade</button>`:""}
              ${a.wallet?`<button data-kol-scan-wallet="${i(a.wallet)}">Scan Positions</button>`:""}
              ${a.wallet?`<button data-kol-copy-wallet="${i(a.wallet)}">Copy Wallet</button>`:""}
              ${a.wallet?`<button data-copy="${i(a.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function oy(){const e=n.kolScan||{};if(e.configured===!1)return O("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],a=nt("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${i(ar(n.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${a.length}/${t.length} signals shown</span>
    </div>
    ${ut(a,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:kg})}
    ${la("kol",t,"KOL signals")}
  `:O(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function gd(){const e=m("input[data-wallet-label]"),t=m("input[data-wallet-count-input]"),a=m("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),v(a,"Creating wallets..."),r.forEach(s=>{s.disabled=!0,v(s,"Creating...")});try{const s=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(s)||s<1||s>20)throw new Error("Wallet count must be from 1 to 20.");await Y(a,"Creating secure web profile for wallet backups...");const o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:s})}),c=Array.isArray(o.wallets)?o.wallets:[];if(!c.length)throw new Error(o.message||"Wallet create did not return wallet data. Refresh and try again.");n.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&he(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&he(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),v(a,o.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const l=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(l?.wallets)&&(n.wallets=l.wallets)}catch{}n.toolSections={...n.toolSections||{},wallets:"balances"},n.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,K(Me(o.plan),"wallet-create"),n.activeTab="wallets",h()}catch(s){v(a,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,v(s,"Create Wallets")})}}async function iy(){const e=m("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),n.automationDelegationStatus="Creating automation wallet...",v(e,n.automationDelegationStatus),t.forEach(a=>{a.disabled=!0,v(a,"Creating...")});try{await Y(e,"Creating secure web profile for automation wallet backups...");const a=n.user?.connectedWallet,r=a?.publicKey?`Automation ${w(a.publicKey)}`:"Automation Wallet",s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(s.wallets)?s.wallets:[]).length)throw new Error(s.message||"Automation wallet create did not return wallet data. Refresh and try again.");n.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&he(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&he(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),n.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",K(Me(s.plan),"automation-wallet-create"),n.activeTab="wallets",h({force:!0})}catch(a){n.automationDelegationStatus=a.message,v(e,a.message),$(a.message)}finally{t.forEach(a=>{a.disabled=!1,v(a,"Create Automation Wallet")})}}function ly(e=null){const a=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||m("[data-session-wallet-amount]"),r=X(a?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const s=Number(r);if(!Number.isFinite(s)||s<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(s>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function cy(e=ce()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(n.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});me(t.user||{...n.user,connectedWallet:t.profile?.connectedWallet||null})}async function uy(e=null){const t=m("[data-automation-delegation-status]")||m("[data-wallet-connect-status]"),a=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),a.forEach(r=>{r.disabled=!0,v(r,"Opening...")});try{const r=ly(e),{provider:s,connected:o}=await Ld();await Y(t,"Creating secure web profile for session wallet..."),await cy(o),n.automationDelegationStatus="Creating session wallet and funding approval...",v(t,n.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(o.publicKey)}`}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(c.wallets)?c.wallets:n.wallets,n.downloads=c.downloads||n.downloads||null,c.downloads?.encryptedBackup?.text&&he(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&he(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",v(t,n.automationDelegationStatus);const l=await Wy(c.order?.transaction,s);n.automationDelegationStatus="Submitting session wallet funding...",v(t,n.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:l}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(u.wallets)?u.wallets:n.wallets,n.automationDelegationStatus=u.message||"Session wallet funded and ready.",K(u.signature||"","session-wallet-funded"),await vt({force:!0,deep:!0,reason:"session-wallet-funded"}),n.activeTab="wallets",h({force:!0})}catch(r){const s=N(r.message||"Session wallet setup failed.");n.automationDelegationStatus=s,v(t,s),$(s)}finally{a.forEach(r=>{r.disabled=!1,v(r,"Start Session Wallet")})}}async function _i(e="enable",t={}){const a=m("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],s=e!=="revoke";if(s&&!uu()){n.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",v(a,n.automationDelegationStatus),$(n.automationDelegationStatus),hi();return}cu(!s,t.scope||""),n.automationDelegationStatus=s?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",v(a,n.automationDelegationStatus),r.forEach(o=>{o.disabled=!0,v(o,s?"Enabling...":"Revoking...")});try{await Y(a,"Creating secure web profile for automation permission...");const o=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:s?"enable":"revoke",ttlHours:720})});me(o.user||{...n.user,automationPermission:o.profile?.automationPermission||null});const c=n.user?.automationPermission||{};n.automationDelegationStatus=s?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${Se(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(o){n.automationDelegationStatus=o.message,v(a,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,v(o,o.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function Ni(e={}){const t=!!e.silent,a=e.refreshWallet!==!1;if(!n.user||!n.token){t||$("Log in or create a web account before checking server exits.");return}if(Rr){n.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}Rr=!0,t||(n.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:te});n.tradePlans=r.plans||n.tradePlans||[];const s=r.runner||{},o=r.webExitGuards||{},c=r.portfolioExits||{},l=Number(s.soldWallets||0)+Number(o.soldGuards||0)+Number(c.soldPositions||0),u=Number(s.triggeredWallets||0)+Number(o.triggeredGuards||0)+Number(c.triggeredPositions||0);if(s.skipped){const d=Number(s.activeForMs||0),p=d>0?` for ${Math.ceil(d/1e3)}s`:"";n.automationDelegationStatus=s.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${p}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${s.reason||"runner busy"}.`,a&&!t&&await ei({force:!0});return}n.automationDelegationStatus=dy(s),(a||l>0||u>0)&&await ei({force:!0}),t&&(l>0||u>0)&&h({preserveSmartChartFrame:n.activeTab==="smartChart"})}catch(r){n.automationDelegationStatus=r.message,n.walletRefreshError=r.message,t||$(r.message)}finally{Rr=!1,t||(n.walletRefreshing=!1,h())}}function dy(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),a=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),s=Number(e.failedWallets||0),o=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${a}, sold ${r}, failed ${s}.${o}`}function Di(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(n.tradePlans||[]).some(t=>{const a=String(t.status||"").toLowerCase();return a==="launch_watch"?!0:a!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function py(){return!!(du()&&Di()&&!Rr)}function fs(){Di()&&(n.automationDelegationStatus=n.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),my()}let hs="";function my(){const t=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active","armed","pending"].includes(String(l.status||"").toLowerCase()));if(!t.length){hs="";return}const a=Date.now(),r=t.filter(l=>l.automationPermissionExpiresAt&&!l.automationPermissionActive),s=t.filter(l=>{if(!l.automationPermissionActive)return!1;const u=Date.parse(l.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>a&&u-a<3600*1e3});let o="";if(r.length)o=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(s.length){const l=Math.min(...s.map(d=>Date.parse(d.automationPermissionExpiresAt)));o=`TP/SL permission expires in ~${Math.max(1,Math.round((l-a)/6e4))} min with ${s.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=o?`${r.length}:${s.length}`:"";o&&c!==hs?(hs=c,$(o)):o||(hs="")}function fy(){Cn.forEach(e=>window.clearTimeout(e)),Cn=[]}function gs(){fy(),n.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",Cn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const a=window.setTimeout(()=>{Cn=Cn.filter(r=>r!==a),!(!n.user||!n.token||!Di())&&Ni({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{n.automationDelegationStatus=r.message})},t);return a})}async function hy(){const e=m("[data-restore-text]"),t=m("[data-restore-status]");if(!e||!t)return;const a=e.value.trim();if(!a){v(t,"Choose a backup file or paste backup text first.");return}v(t,"Restoring wallets...");try{await Y(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:a})});n.restoreResult=r.restore,r.restore?.downloads&&(n.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&he(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&he(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",v(t,r.restore?.message||"Restore complete."),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(r){v(t,r.message)}}async function gy(){const e=m("[data-export-status]");if(e){v(e,"Building backup files...");try{await Y(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});n.backupResult=t.backup,t.backup?.downloads&&(n.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&he(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&he(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),v(e,t.backup?.message||"Backup ready."),h()}catch(t){v(e,t.message)}}}async function by(){const e=m("[data-import-label]"),t=m("[data-import-secret]"),a=m("[data-import-status]");if(!e||!t||!a)return;const r=e.value.trim()||"Imported Wallet",s=t.value.trim();if(!s){v(a,"Paste a private key or JSON secret-key array first.");return}v(a,"Importing wallet...");try{await Y(a,"Creating secure web profile for imported wallet...");const o=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:s})});n.importResult=o.imported,o.imported?.downloads&&(n.downloads=o.imported.downloads,o.imported.downloads.encryptedBackup&&he(o.imported.downloads.encryptedBackup.filename,o.imported.downloads.encryptedBackup.text),o.imported.downloads.recoveryKeys&&he(o.imported.downloads.recoveryKeys.filename,o.imported.downloads.recoveryKeys.text)),t.value="",v(a,o.imported?.message||"Import complete."),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(o){v(a,o.message)}}async function yy(e,t="this wallet",a=""){const r=String(t||`Wallet ${e}`);if(!await xe({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await xe({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=m("[data-wallet-remove-status]");n.walletRemoveStatus=`Backing up ${r} before removal...`,v(c,n.walletRemoveStatus),$("");try{const l=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(a?{publicKeys:[a]}:{walletIndexes:[String(e)]})}),u=l.removed||{};n.downloads=u.downloads||n.downloads,u.downloads?.encryptedBackup?.text&&he(u.downloads.encryptedBackup.filename,u.downloads.encryptedBackup.text),u.downloads?.recoveryKeys?.text&&he(u.downloads.recoveryKeys.filename,u.downloads.recoveryKeys.text),n.walletRemoveStatus=u.message||`Removed ${r}.`,Array.isArray(u.wallets)&&(n.wallets=u.wallets),K(Me(l.plan),"wallet-remove"),n.activeTab="wallets",h()}catch(l){n.walletRemoveStatus=l.message,v(c,l.message),$(l.message)}}function vy(){const e=String(m("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(a=>a.trim()).filter(Boolean),walletGroup:String(m("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(m("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(m("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(m("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function wy(){const e=String(m("[data-wallet-send-from]")?.value||"1").trim(),t=String(m("[data-wallet-send-managed-targets]")?.value||"").trim(),a=String(m("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(m("[data-wallet-send-destinations]")?.value||"").trim(),s=t.toLowerCase()==="all"?n.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),o=a?n.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===a||d.startsWith(`${a} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...s,...o])].map(u=>n.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),l=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(m("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!m("[data-wallet-send-all]")?.checked,destinations:l}}function Sy(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const a=e.rows.slice(0,6).map(r=>{const s=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,o=r.ok?"ok":"failed";return`${s}: ${o} - ${r.message||r.signature||"done"}`});t.push(...a),e.rows.length>a.length&&t.push(`...${e.rows.length-a.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function ky(e){const t=m("[data-wallet-sweep-status]");n.walletSweepStatus="Running wallet action...",v(t,n.walletSweepStatus),$("");try{await Y(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const s=e==="send-sol-many"?wy():vy();if(e==="sell-all"&&(s.destination=""),e==="sell-all-sweep"&&!s.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const o=await k(r,{method:"POST",body:JSON.stringify(s),timeoutMs:te});n.walletSweepStatus=Sy(o.sweep),v(t,n.walletSweepStatus),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(a){n.walletSweepStatus=a.message,v(t,a.message),$(a.message)}}async function $y(e){const t=m("[data-restore-status]"),a=m("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!a)){v(t,"Reading backup file...");try{a.value=await r.text(),v(t,"Backup loaded. Tap Restore Wallets.")}catch(s){v(t,`Could not read file: ${s.message}`)}}}function he(e,t){const a=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(a),s=document.createElement("a");s.href=r,s.download=e,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Ty(){const e=m("[data-x-handle]"),t=m("[data-x-status]"),a=Je(e?.value||"");if(!a){v(t,"Enter a valid X handle first.");return}const r=window.open(Pi(a),"_blank","noopener,noreferrer");try{v(t,r?`Opening X and saving @${a}...`:`Saving @${a}. Allow popups if X did not open.`),await Y(t,"Creating secure web profile for X sharing...");const s=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:a})});me(s.user||{...n.user,xHandle:s.profile?.xHandle||a}),zl(n.xHandle),v(t,`Connected @${n.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(s){v(t,s.message),$(s.message)}}function Ay(){const e=m("[data-x-status]"),t=Je(m("[data-x-handle]")?.value||n.xHandle||""),a=Pi(t||n.xHandle);window.open(a,"_blank","noopener,noreferrer"),v(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function Py(){const e=m("[data-x-status]"),t=m("[data-x-handle]");try{if(!n.user||!n.token){n.xHandle="",t&&(t.value=""),$o(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const a=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});me(a.user||{...n.user,xHandle:""}),n.xHandle="",t&&(t.value=""),$o(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(a){v(e,a.message),$(a.message)}}async function bs(e,t="Saving PFP..."){const a=m("[data-avatar-status]");v(a,t);try{await Y(a,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});me(r.user||{...n.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),v(a,n.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){v(a,r.message),$(r.message)}}async function Cy(e){const t=m("[data-avatar-status]"),a=e?.files?.[0];if(a){if(!/^image\/(png|jpe?g|webp)$/i.test(a.type)){v(t,"Use a PNG, JPG, or WebP image.");return}if(a.size>5*1024*1024){v(t,"Use an image under 5 MB.");return}try{v(t,"Compressing PFP...");const r=await bd(a);await bs({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){v(t,r.message),$(r.message)}finally{e.value=""}}}function bd(e){return new Promise((t,a)=>{const r=new FileReader;r.onerror=()=>a(new Error("Could not read that image.")),r.onload=()=>{const s=new Image;s.onerror=()=>a(new Error("Could not load that image.")),s.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const l=c.getContext("2d");if(!l){a(new Error("This browser cannot resize images."));return}const u=Math.max(256/s.width,256/s.height),d=Math.round(s.width*u),p=Math.round(s.height*u),f=Math.round((256-d)/2),y=Math.round((256-p)/2);l.clearRect(0,0,256,256),l.drawImage(s,f,y,d,p);const g=c.toDataURL("image/jpeg",.84);if(g.length>22e4){a(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(g)},s.src=String(r.result||"")},r.readAsDataURL(e)})}async function Ly(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,a=new URL(String(e||""),t).toString(),r=await fetch(a,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const s=await r.blob();return bd(s)}async function xy(){const e=Ai(n.xHandle);if(!e){const t=m("[data-avatar-status]");v(t,"Connect an X handle first.");return}await bs({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function yd(e,t={}){const a=On(),r=fe(e);if(!r){if(await Tc(e,t)||Ac(e))return;const s=mc(e);re(s),It(e,new Error(s),{action:"provider_missing",platform:Ve()?"mobile":"desktop"});return}try{const s=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(s){if(!(t.confirmSwitch===!1?!0:await xe({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(s)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){re("Wallet connection unchanged."),Te("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}re(`Opening ${Fe(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,l=c?.toBase58?.()||c?.toString?.()||"";if(!l)throw new Error("Wallet connected, but no public address was returned.");await Y(a,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:l,provider:Fe(e,r)})});me(u.user||{...n.user,connectedWallet:u.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:l,shortPublicKey:w(l),provider:Fe(e,r),tokens:[]},fi(`connected:${l}`),n.walletConnectMenuOpen=!1,re(`Connected ${w(l)}. Opening Live Terminal...`),Te(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),pu("browser-wallet-connect"),qr("browser-wallet-connect")}catch(s){const o=s.message||"Wallet connection was cancelled.";re(o),It(e,s,{action:"connect_failed"})}}async function vd(){await Zu("disconnecting");const e=On(),t=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(!n.user||!n.token){n.connectedWalletBalance=null,fi(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0});return}try{const a=n.user?.connectedWallet?.provider||"";await(a.toLowerCase().includes("phantom")?fe("phantom"):a.toLowerCase().includes("solflare")?fe("solflare"):a.toLowerCase().includes("backpack")?fe("backpack"):fe("solana"))?.disconnect?.()}catch{}try{const a=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});me(a.user||{...n.user,connectedWallet:null}),n.connectedWalletBalance=null,fi(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0})}catch(a){re(a.message),$(a.message)}}async function My(){const e=m("[data-profile-username]"),t=m("[data-profile-password]"),a=m("[data-login-security-status]"),r=String(e?.value||"").trim(),s=String(t?.value||"");if(!r||!s){v(a,"Enter a username and password first.");return}try{await Y(a,"Creating secure web profile..."),v(a,"Saving login...");const o=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:s})});me(o.user||{...n.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),v(a,"Saved. You can now log back in with this username and password."),h()}catch(o){v(a,o.message),$(o.message)}}function Je(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function Ui(e){const t=Si(e),a=String(n.user?.referralLink||"").trim(),r=a&&!t.includes("/r/")?a:Lt,s=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(s,"_blank","noopener,noreferrer")}function wd(e){const t=e==="kol",a=m(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=m("[data-share-watch-status]"),s=a?.value?.trim()||"";if(!s){v(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}Ui(t?Lu(s):ki(s)),v(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function Sd(e){const t={};n.token&&(t.Authorization=`Bearer ${n.token}`);const a=await Bn(Va(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!a.ok){const r=await pc(a);throw new Error(r.message||r.error||`Could not build PnL card (${a.status}).`)}return{blob:await a.blob(),filename:a.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function kd(e){const{blob:t,filename:a}=await Sd(e),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function By(e,t){try{const{blob:a,filename:r}=await Sd(e),s=new File([a],r,{type:"image/png"});if(navigator.canShare?.({files:[s]})){await navigator.share({title:"SlimeWire PnL Card",text:Si(t),url:Lt,files:[s]});return}await kd(e),Ui(`${t} PnL card downloaded and ready to attach.`)}catch(a){$(a.message)}}function $d(e="buy"){const t=m("[data-trade-wallet]")?.value||"",a=gh(e)||m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,e==="sell"?(n.tradeSwapFrom=a,n.tradeSwapTo="SOL"):(n.tradeSwapFrom="SOL",n.tradeSwapTo=a),{walletIndex:t,tokenMint:a,slippageBps:r}}function ue(e=""){return String(e||"").trim().toLowerCase()==="connected"}function Ry(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function Td(){const e=Array.isArray(n.wallets)?n.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(Ry(e[t]))return e[t];return null}function Ad(e=ce()){if(!e?.publicKey)return!1;const t=nr(e),a=fe(t)||fe("solana");return!!(a&&typeof a.signTransaction=="function")}function ys(e=ce()){const t=e?.provider||Fe(nr(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function vs(e={},{side:t="trade",statusWriter:a=ge,allowSessionFallback:r=!0}={}){if(!ue(e.walletIndex))return{form:e,sessionWallet:null};if(Ad())return{form:e,sessionWallet:null};const s=r?Td():null;if(s?.index){const o=`Using Session Wallet ${s.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof a=="function"&&a(o),{form:{...e,walletIndex:String(s.index)},sessionWallet:s}}throw new Error(ys())}function Pd(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Cd(e=""){const t=atob(String(e||"")),a=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)a[r]=t.charCodeAt(r);return a}function nr(e=ce()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function Iy(e=ce(),{returnPath:t=ja()||"/terminal/trade"}={}){const a=nr(e),r=e?.provider||Fe(a);if(da({returnPath:t}),Ve()&&e?.publicKey&&!fe(a)){const o=ys(e);return re(o),o}if($c(a)){const o=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(re(o),await Tc(a,{returnPath:t}).catch(()=>!1))return o}if(Ac(a))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const s=mc(a);return re(s),s}async function Ld(){const e=ce();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=nr(e),a=fe(t)||fe("solana");if(!a){if(Ve()&&e?.publicKey)throw new Error(ys(e));const o=await Iy(e,{returnPath:ja()||"/terminal/trade"});throw new Error(o)}if(typeof a.signTransaction!="function")throw Ve()&&e?.publicKey?new Error(ys(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"";let s=r();if(s!==e.publicKey)try{const o=await a.connect?.({onlyIfTrusted:!0});s=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r()}catch{}if(s!==e.publicKey){const o=await a.connect?.({onlyIfTrusted:!1}),c=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:a,connected:e}}async function Oy(){try{if(Ve())return;const e=ce();if(!e?.publicKey)return;const t=nr(e),a=fe(t)||fe("solana");if(!a||typeof a.connect!="function"||(a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"")===e.publicKey)return;await a.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const Ey=6e4;async function xd(e,t,a=Ey){let r=0;const s=new Promise((o,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},a)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),s])}finally{window.clearTimeout(r)}}async function Fy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.VersionedTransaction.deserialize(Cd(e)),r=await xd(t,a);return Pd(r.serialize())}async function Wy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.Transaction.from(Cd(e)),r=await xd(t,a);return Pd(r.serialize())}function _y({side:e,connected:t,form:a={},actionDetail:r="",amountSol:s="",amountMode:o="",percent:c=""}={}){const l=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:o==="max"?"Max SOL":`${s||r||"custom"} SOL`;return xe({title:`Confirm ${l}`,lines:[`${l} with ${u}?`,`Token: ${a.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:l})}async function rr({side:e,form:t,actionDetail:a,amountSol:r="",amountMode:s="",percent:o="",attemptId:c,statusWriter:l=ge}){const u=typeof l=="function"?l:ge,{provider:d,connected:p}=await Ld();if(!n.walletFastApprovalsEnabled&&!await _y({side:e,connected:p,form:t,actionDetail:a,amountSol:r,amountMode:s,percent:o}))throw new Error("Connected-wallet trade cancelled.");mm(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),Re("submitted","pending"),u(n.walletFastApprovalsEnabled?`Building ${e} approval for ${p.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:p.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:s,percent:o,tradeAttemptId:c}),dedupe:!1,timeoutMs:te});Re("submitted","ok"),Re("approved","pending",`Approve in ${p.provider||"your wallet"}`),u(`Approve ${e} in ${p.provider||"your wallet"}...`);let y;try{y=await Fy(f.order?.transaction,d)}catch(S){throw Re("approved","fail",N(S?.message||"Wallet approval was declined.")),S}Re("approved","ok"),Re("sent","pending"),u("Submitting signed trade...");let g;try{g=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:te})}catch(S){throw V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"error",error:N(S?.message||"Trade submit failed.")}),K("",`browser-${e}-error`,{tradeAttemptId:c}),Re("sent","fail",N(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return Re("sent","ok"),Re("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),n.tradeResult=g.trade,u(g.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),g.trade}function Ue(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function ln(e,t){const a=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(a)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Ny(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let a=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=ln(a,r),{enabled:Ue(e)||Ue(t)||Ue(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function Md(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let a=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=ln(a,r),{enabled:Ue(e)||Ue(t)||Ue(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function ge(e){const t=m("[data-trade-status]");v(t,e)}function We(e=""){n.chartTradeStatus=String(e||""),v(m("[data-chart-trade-status]"),n.chartTradeStatus)}function qi(e="",t=""){n.quickBuyModal={...n.quickBuyModal,status:String(e||""),error:String(t||"")};const a=m("[data-quick-buy-modal-status]"),r=m("[data-quick-buy-modal-error]");v(a,n.quickBuyModal.status),v(r,n.quickBuyModal.error),a&&(a.hidden=!n.quickBuyModal.status),r&&(r.hidden=!n.quickBuyModal.error)}async function ws(e,t="fixed"){const a=L();let r=t==="max"?"max":String(e||"custom"),s="";try{let o=$d("buy");r=t==="max"?"max":String(e||"custom");const c=at("trade-buy",o.tokenMint,r);if(c){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(o.tokenMint)}:${r}`});return}s=bt("trade-buy");const l={tokenMint:o.tokenMint,walletIndex:o.walletIndex,slippageBps:o.slippageBps,tradeAttemptId:s},u=_d();if((Ue(u.takeProfitPct)||Ue(u.stopLossPct)||Ue(u.sellDelay))&&Object.assign(l,{autoExit:!0,...u}),t==="max")l.amountMode="max";else{const S=Number(e);if(!Number.isFinite(S)||S<=0)throw new Error("Enter a buy amount greater than zero.");l.amountSol=String(S)}if(o=vs(o,{side:"buy",statusWriter:ge}).form,l.walletIndex=o.walletIndex,ue(o.walletIndex)){V("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:L()-a,requestId:s,details:`browser-buy:${w(o.tokenMint)}:${r}`}),ge("Building wallet-approved buy..."),le(),await rr({side:"buy",form:o,actionDetail:r,amountSol:l.amountSol||"",amountMode:l.amountMode||"fixed",attemptId:s}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Ce("trade-buy",o.tokenMint,r,3e3);return}const f=Ny();f.enabled&&Object.assign(l,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),V("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-a,requestId:s,details:`trade-buy:${w(o.tokenMint)}:${r}`}),h(),ge(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Le(20);const y=L();V("trade-buy",o.tokenMint,r,{state:"submitting"});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...l,clientClickToUiMs:Math.round(y-a)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-y,requestId:s,resultCount:g.trade?.signature?1:0,details:"trade-buy"}),n.tradeResult=g.trade,mm(`Buy ${w(o.tokenMint||"")}`),Re("submitted","ok"),Re("sent","ok"),Re("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),g.trade?.autoExitPlan?(Re("armed","ok"),n.tradePlanResult=g.trade.autoExitPlan,ge(g.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),gs()):g.trade?.autoExitRequested&&(Re("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),ge("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),V("trade-buy",o.tokenMint,r,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,"trade-buy",{tradeAttemptId:s}),n.activeTab="trade",h(),Ce("trade-buy",o.tokenMint,r,3e3)}catch(o){s&&(V("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,{state:"error",error:N(o.message||"Buy failed")}),Ce("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-a,requestId:s,errorCode:o?.code||o?.name||"TRADE_BUY_FAILED",details:N(o.message||"Buy failed")}),ge(o.message)}}async function Hi(e){const t=L(),a=bt("manual-sell");let r=null,s=String(e||"custom");try{r=$d("sell");const o=Number.parseInt(e,10);if(s=String(o||s),!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=at("trade-sell",r.tokenMint,s);if(c){ne("buttonDoubleClickPrevented"),W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${o}`});return}if(V("trade-sell",r.tokenMint,s,{state:"clicked",tradeAttemptId:a,clickedAt:new Date().toISOString()}),ge("Sending sell..."),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-t,requestId:a,details:`${w(r.tokenMint)}:${o}`}),r=vs(r,{side:"sell",statusWriter:ge}).form,ue(r.walletIndex)){le();const p=L();V("trade-sell",r.tokenMint,s,{state:"submitting"}),await rr({side:"sell",form:r,actionDetail:s,percent:String(o),attemptId:a}),W({component:"manual-sell",action:"browser-sell-request",durationMs:L()-p,requestId:a,resultCount:n.tradeResult?.signature?1:0,details:"browser-wallet"}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Ce("trade-sell",r.tokenMint,s,3e3);return}h(),await Le(20);const u=L();V("trade-sell",r.tokenMint,s,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:o,manualSellAttemptId:a,clientClickToUiMs:Math.round(u-t)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-u,requestId:a,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),n.tradeResult=d.trade,ge(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),V("trade-sell",r.tokenMint,s,{state:"submitted",signature:d.trade?.signature||""}),K(d.trade?.signature||Me(d.trade),"manual-sell-trade"),n.activeTab="trade",h(),Ce("trade-sell",r.tokenMint,s,3e3)}catch(o){r?.tokenMint&&(V("trade-sell",r.tokenMint,s,{state:"error",error:N(o.message||"Sell failed")}),Ce("trade-sell",r.tokenMint,s,4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-t,requestId:a,errorCode:o?.code||o?.name||"MANUAL_SELL_FAILED",details:N(o.message||"Sell failed")}),ge(o.message)}}function Dy(){const e=qe("trade-plan"),t=m("[data-trade-plan-group]")?.value?.trim()||"",a=m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),s=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),o=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),l=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:l}=ln(c,l));const u=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,n.volumeToken=a,n.bundleToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:c,takeProfitPct:s,stopLossPct:o,sellPercent:l,loopCount:"1",loopDelay:"0",slippageBps:u,...fa("trade-plan")}}async function Uy(){try{const e=Dy();ge("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});n.tradePlanResult=t.plan,n.tradeResult=null,K(t.trade?.signature,"trade-plan"),n.activeTab="trade",h()}catch(e){ge(e.message)}}function qy(){const e=qe("volume"),t=m("[data-volume-group]")?.value?.trim()||"",a=m("[data-volume-token]")?.value?.trim()||"",r=m("[data-volume-amount]")?.value||"";let s=x("[data-volume-delay]","[data-volume-delay-custom]","5");const o=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),l=x("[data-volume-loop]","[data-volume-loop-custom]","1"),u=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:s,sellPercent:d}=ln(s,d));const p=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.volumeToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:d,slippageBps:p,...fa("volume")}}function Bd(e){const t=m("[data-volume-status]");v(t,e)}async function Hy(){try{const e=qy();Bd("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});n.volumeResult=t.plan,K(Me(t.plan),"volume-plan"),n.activeTab="volume",h()}catch(e){Bd(e.message)}}function Ky(e){const t=qe("sniper"),a=m("[data-sniper-group]")?.value?.trim()||"",r=m("[data-sniper-amount]")?.value||"",s=x("[data-sniper-delay]","[data-sniper-delay-custom]",n.scanMode==="pumpsnipe"?"3":"5"),o=x("[data-sniper-tp]","[data-sniper-tp-custom]",n.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),l=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",n.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{mode:n.scanMode,tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,slippageBps:d,loopCount:l,loopDelay:u,...fa("sniper")}}function Rd(e){const t=m("[data-sniper-status]");v(t,e)}async function Vy(e){try{const t=Ky(e);Rd("Buying and arming exits...");const a=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});n.sniperResult=a.plan,K(Me(a.plan),"sniper-entry"),n.activeTab="sniper",h()}catch(t){Rd(t.message)}}function zy(){const e=qe("ogre-ai"),t=m("[data-ogre-ai-group]")?.value?.trim()||"",a=m("[data-ogre-ai-amount]")?.value?.trim()||"",r=ts(),s=m("[data-ogre-ai-runs]")?.value||"1",o=m("[data-ogre-ai-tp]")?.value||"25",c=m("[data-ogre-ai-tp-custom]")?.value?.trim()||"",l=m("[data-ogre-ai-sl]")?.value||"8",u=m("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=m("[data-ogre-ai-delay]")?.value||"5",p=m("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=m("[data-ogre-ai-slippage]")?.value||"400",y=m("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";ef({amountSol:a,runCount:s,category:r,takeProfitSelect:o,takeProfitCustom:c,stopLossSelect:l,stopLossCustom:u,delaySelect:d,delayCustom:p,slippageSelect:f,slippageCustom:y,walletGroup:t});const g=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","60"),S=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","100"),A=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","40"),T=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),b="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!a)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:a,runCount:s,sellDelay:g,takeProfitPct:S,stopLossPct:A,sellPercent:"100",slippageBps:T,minScore:b,recentMints:jl()}}function Ss(e){n.ogreAiStatus=e||"";const t=m("[data-ogre-ai-status]");v(t,n.ogreAiStatus)}async function jy(){if(Ir){_a=!0,Ss("Stopping the hunt after this scan...");return}const e=Symbol("ogre-ai-run");_a=!1;try{const t=zy();n.ogreAiLoading=!0,Ir=e;const a=Array.isArray(t.recentMints)?[...t.recentMints]:[];let r=null,s=!1,o=0;const c=120;for(;!s&&!_a&&o<c&&(o+=1,Ss(o===1?"Scanning fresh low-MC pairs and arming managed exits...":`Hunting fresh pairs... (scan ${o}) - tap Scan again to stop.`),h(),r=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify({...t,recentMints:a}),timeoutMs:te}),s=Number(r.ogreAi?.armedCount||0)>0||(r.ogreAi?.plans?.length||0)>0,!s);){for(const l of r.ogreAi?.errors||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);for(const l of r.ogreAi?.attemptedPicks||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);if(_a)break;await Le(5e3)}n.ogreAiResult=r?.ogreAi,Zm(r?.ogreAi),n.tradePlanResult=r?.ogreAi?.plans?.[0]||n.tradePlanResult,Ss(s?r?.ogreAi?.message||"Ogre A.I. run armed.":_a?"Hunt stopped. Tap Scan to hunt again.":"Still hunting - no clean fresh pair armed yet. Tap Scan to keep going."),s&&K(Me(r?.ogreAi?.plans?.[0]),"ogre-ai-run"),n.activeTab="ogreAi",h()}catch(t){Ss(t.message),$(t.message)}finally{n.ogreAiLoading=!1,_a=!1,Ir===e&&(Ir=null),h()}}function sr(e){const t=m("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function Gy({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");n.ogreAutopilot=t.autopilot||null,n.activeTab==="ogreAi"&&h()}catch(t){e||sr(t.message)}}function Xy(){return{enabled:!!m("[data-autopilot-enabled]")?.checked,category:ts(),amountSol:m("[data-ogre-ai-amount]")?.value?.trim()||(n.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:qe("ogre-ai"),walletGroup:m("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:m("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:m("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:m("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:m("[data-autopilot-interval]")?.value?.trim()||"10"}}async function Jy(){if(n.ogreAutopilotBusy)return;const e=Xy();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){sr("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await xe({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${ju(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){n.ogreAutopilotBusy=!0,sr(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});n.ogreAutopilot=t.autopilot||null,sr(n.ogreAutopilot?.lastStatus||"Saved.")}catch(t){sr(t.message),$(t.message)}finally{n.ogreAutopilotBusy=!1,h()}}}function Ut(e){const t=m("[data-kol-status]");v(t,e)}function Yy(e){const t=qe("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:"100",slippageBps:d,...fa("kol")}}function Qy(e){const t=qe("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),p=String(e||n.kolWallet||m("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!p)throw new Error("Paste or choose a KOL wallet first.");if(!_t(p))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:p,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:"100",slippageBps:d,...fa("kol")}}async function Zy(e){try{const t=Yy(e);Ut("Buying and arming KOL copy plan...");const a=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,K(Me(a.plan),"kol-copy-plan"),n.activeTab="kol",h()}catch(t){Ut(t.message)}}async function ev(e){try{const t=Qy(e);Ut("Arming Copy Wallet watch...");const a=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,n.kolWallet=t.copyWallet,n.activeTab="kol",h()}catch(t){Ut(t.message)}}function qe(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function ks(e){const t=m("[data-bundle-status]");v(t,e)}function Id(){const e=m("[data-bundle-token]")?.value?.trim()||"",t=qe("bundle"),a=m("[data-bundle-group]")?.value?.trim()||"",r=m("[data-bundle-amount]")?.value||"",s=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),o=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,percent:s,slippageBps:o}}function tv(){const e=Id();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),a=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:a}=ln(t,a),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:a,...fa("bundle-plan")}}async function Od(e){const t=L();let a=null,r="";const s=e==="buy"?"bundle-buy":"bundle-sell";try{a=Id();const o=at(s,a.tokenMint,"bundle");if(o){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-t,cacheHit:!0,requestId:o.tradeAttemptId||"",details:`${s}:${w(a.tokenMint)}`});return}r=bt(s),V(s,a.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-t,requestId:r,details:`${s}:${w(a.tokenMint)}`}),h(),ks(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Le(20);const c=L();V(s,a.tokenMint,"bundle",{state:"submitting"});const l=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...a,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-c,requestId:r,resultCount:l.bundle?.successCount||0,details:s}),n.bundleResult=l.bundle,V(s,a.tokenMint,"bundle",{state:"submitted",signature:Me(l.bundle)}),K(Me(l.bundle),`bundle-${e}`,{tradeAttemptId:r}),n.activeTab="bundle",h(),Ce(s,a.tokenMint,"bundle",3e3)}catch(o){a?.tokenMint&&(V(s,a.tokenMint,"bundle",{state:"error",error:N(o.message||"Bundle trade failed")}),Ce(s,a.tokenMint,"bundle",4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-t,requestId:r,errorCode:o?.code||o?.name||"BUNDLE_TRADE_FAILED",details:N(o.message||"Bundle trade failed")}),ks(o.message)}}async function av(){try{const e=tv();ks("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});n.bundleResult=t.plan,K(Me(t.plan),"bundle-plan"),n.activeTab="bundle",h()}catch(e){ks(e.message)}}function oe(e,t){return(n.presets?.[e]||[]).find(a=>a.id===t)||null}function Ed(){(n.selectedTradePresetId==="custom"||n.selectedTradePresetId&&!oe("trade",n.selectedTradePresetId))&&(n.selectedTradePresetId=""),(n.selectedBundlePresetId==="custom"||n.selectedBundlePresetId&&!oe("bundle",n.selectedBundlePresetId))&&(n.selectedBundlePresetId=""),n.editingTradePresetId&&!oe("trade",n.editingTradePresetId)&&(n.editingTradePresetId=""),n.editingBundlePresetId&&!oe("bundle",n.editingBundlePresetId)&&(n.editingBundlePresetId="")}function Fd(e,t="trade",a=""){t==="bundle"?n.bundleToken=e:n.tradeToken=e,n.activeTab=t,a&&$(a),window.history.pushState({},"","/terminal"),h({force:!0})}async function Wd(e=""){const t=String(e||"").trim();if(!t)return;const a=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),s=(o,c={})=>St(be(o,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){s(a);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}s(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(o){$(o.message||"Token search failed.")}}function be(e="",t={}){const a=String(e||"").trim(),r=a?or().find(s=>String(s?.tokenMint||"")===a):null;return{chain:"solana",tokenMint:a,tokenAddress:a,mint:a,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(a),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||a.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function Jk(e={},t={}){return be(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function $s(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(n.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},Is(n.smartChartTokenRef),n.terminalToken=t,n.terminalAutoToken=t,n.tradeToken=t,n.bundleToken=t,n.volumeToken=t,n.smartChartToken=t,t):""}function nv(e,t={}){const a=new URLSearchParams;a.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return a.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&a.set("view",t.view),t.focusAmountInput&&a.set("focusAmount","1"),t.source&&a.set("source",String(t.source).slice(0,40)),t.returnTo&&a.set("returnTo",t.returnTo),`/terminal/chart?${a.toString()}`}function Ki(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),a=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||a.includes("pump")),s=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!s)}function rv(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const Ts=new Map;function Vi(e){const t=String(e||"").trim();if(!t)return;const a=Ts.get(t)||0;Date.now()-a<3e4||(Ts.set(t,Date.now()),Ts.size>200&&Ts.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function St(e={},t={}){ra("chartRouteStart");const a=L(),r=$s(e);if(!r){$("Select a token before opening the chart.");return}Zi(e,{source:t.source||"token-entry"}),Vi(r),n.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),n.smartChartView=rv(n.smartChartTokenRef||e,t),n.chartFocusAmountInput=!!t.focusAmountInput,n.chartScrollIntoView=!0,n.activeTab="smartChart",n.route="terminal",n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.chartTradeStatus="",n.chartBuyWalletIndex="";const s=nv(r,{defaultTab:t.defaultTab||"buy",view:n.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||ja()});window.history.pushState({},"",s),h({force:!0}),H("chart-route-open",a,{component:"smartChart",cacheHit:!!(Ye(r)?.cacheHit||cr(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function zi(){if(!window.location.pathname.includes("/terminal/chart"))return;ra("chartRouteStart");const e=L(),t=new URLSearchParams(window.location.search||""),a=String(t.get("token")||t.get("mint")||"").trim(),r=String(n.smartChartToken||"").trim();if(a){const s=be(a,{source:t.get("source")||"route"});$s(s),Zi(s,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{cn(s,{forceModal:!0,source:"deep-link"})}catch{}},900),a!==r&&(n.chartTradeStatus="",n.chartBuyWalletIndex="")}n.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",n.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",n.chartFocusAmountInput=t.get("focusAmount")==="1",n.chartScrollIntoView=!0,n.route="terminal",n.activeTab="smartChart",H("chart-route-apply",e,{component:"smartChart",cacheHit:!!(Ye(a)?.cacheHit||cr(a)?.pairAddress),details:a})}function cn(e={},t={}){const a=$s(e);if(!a){$("Select a token before quick buying.");return}const r=un(a);if(r&&Bs(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const s=t.preset||ct(),o=s&&!t.forceModal?He(s):"",c=s?.walletIndex||(s?.walletIndexes||[])[0]||(n.wallets[0]?.index?String(n.wallets[0].index):"");if(s&&o&&c&&!t.forceModal){Cs(a,{...s,walletIndex:c,walletIndexes:[c]});return}const l=ce();n.quickBuyModal={open:!0,tokenMint:a,amountSol:o||n.quickBuyAmountOverride||"",walletIndex:l?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"",slippageBps:"400",status:o?`Preset ${o} SOL loaded. Confirm when ready.`:s?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},Vi(a),h({force:!0}),requestAnimationFrame(()=>m("[data-quick-buy-modal-amount]")?.focus())}function ji(){n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function sv(e={},t={}){if(!D("protectedBuyEnabled",!0))return;const a=$s(e);if(!a){$("Select a token before opening Protected Buy.");return}const r=un(a);if(r&&Bs(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const s=Sa(a)||{tokenMint:a},o=Qe(s),c=t.presetId||o.protectedBuyPreset||nl(o.verdict),l=Number(X(t.amountSol||n.quickBuyAmountOverride||He()||"0.1")),u=c==="conservative"&&Number.isFinite(l)&&l>.25?"0.25":pr(l||.1),d=ce();Vi(a),n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.protectedBuyModal={open:!0,tokenMint:a,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:o.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>m("[data-protected-buy-amount]")?.focus())}function As(){n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function ov(){const e=n.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),a=String(m("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(m("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),s=X(m("[data-protected-buy-amount]")?.value||e.amountSol||""),o=String(m("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(m("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!s)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:a,walletIndex:r,amountSol:s,slippageBps:o,riskAccepted:c}}function iv(){const e=n.protectedBuyModal||{};if(!e.open)return"";const t=Sa(e.tokenMint)||{tokenMint:e.tokenMint},a=Qe(t),r=Ws(e.presetId),s=ue(e.walletIndex),o=a.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${i(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${i(dn(a.verdict))}">${i(a.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${nn(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${i(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${al.map(l=>`<option value="${l.id}" ${l.id===r.id?"selected":""}>${i(l.label)}</option>`).join("")}
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
        <strong>${i(r.label)} plan</strong>
        <span>${i(r.description)}</span>
        <small>${i(ow(r))}</small>
        <small>Wallet: ${i(lw(e.walletIndex))}</small>
        <small>Priority fee: existing trade default.</small>
        ${s?'<small class="warning-text">Connected wallets still use normal wallet confirmation. Use a funded session wallet when you want server TP/SL armed like a managed wallet.</small>':""}
      </article>
      ${a.verdict==="AVOID"?`
        <label class="checkbox-line protected-buy-risk-line">
          <input data-protected-buy-risk-accept type="checkbox" ${e.riskAccepted?"checked":""}>
          I understand SlimeShield says AVOID and still want to configure this buy.
        </label>
      `:""}
      <div class="quick-buy-actions">
        <button type="button" data-protected-buy-close>Cancel</button>
        <button type="button" class="primary" data-protected-buy-confirm ${c||o?"disabled":""}>${c?"Submitting...":s?"Open Wallet Confirmation":"Submit Protected Buy"}</button>
      </div>
      ${e.status?`<small class="connect-status">${i(e.status)}</small>`:""}
      ${e.error?`<small class="warning-text">${i(e.error)}</small>`:""}
      <small class="protected-buy-safe-copy">Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</small>
    </section>
  `}function Gi(){let e=m("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!n.protectedBuyModal?.open||!D("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=iv(),document.body.classList.add("protected-buy-modal-open")}async function lv(){try{const e=ov(),t=Sa(e.tokenMint)||{tokenMint:e.tokenMint};if(Qe(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Ws(e.presetId);if(n.protectedBuyModal={...n.protectedBuyModal,...e,status:ue(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},Gi(),ue(e.walletIndex)){const s=await Ps({...e,source:`protected-buy:${r.id}`});n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),$(s?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Le(20),n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Cs(e.tokenMint,iw(e,r))}catch(e){n.protectedBuyModal={...n.protectedBuyModal||{},open:!0,status:"",error:N(e.message||"Protected Buy failed.")},h({force:!0})}}function cv(){const e=String(n.quickBuyModal?.tokenMint||"").trim(),t=String(m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"").trim(),a=X(m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||""),r=String(m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!a)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r}}function _d(){const e=ct();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function Ps({tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r="400",source:s="quick-buy",takeProfitPct:o="",stopLossPct:c="",sellDelay:l="off",sellPercent:u="100"}){const d=Number(a);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const p=bt("quick-buy"),f=ln(l,u),y=Ue(o)||Ue(c)||Ue(f.sellDelay);let g={tokenMint:e,walletIndex:t,slippageBps:r};const S=n.quickBuyModal?.open?P=>qi(P,""):ge;if(g=vs(g,{side:"buy",statusWriter:S}).form,t=g.walletIndex,n.quickBuyLast={source:s,tokenMint:e,walletConnected:ue(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:p,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:p,clickedAt:new Date().toISOString()}),n.quickBuyModal={...n.quickBuyModal,status:ue(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:p},ue(t)){qi("Opening wallet approval...",""),le();const P=await rr({side:"buy",form:g,actionDetail:String(a),amountSol:String(d),amountMode:"fixed",attemptId:p,statusWriter:S});if(n.quickBuyLast={...n.quickBuyLast,status:"submitted"},y){const C="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";n.quickBuyModal?.open?qi(C,""):ge(C)}return P}h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Le(20);const T={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:p};y&&Object.assign(T,{autoExit:!0,takeProfitPct:o,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(T),dedupe:!1,timeoutMs:te});return n.tradeResult=b.trade,b.trade?.autoExitPlan&&(n.tradePlanResult=b.trade.autoExitPlan,gs()),K(b.trade?.signature,"quick-buy-custom",{tradeAttemptId:p}),V("trade-buy",e,String(a),{state:"submitted",signature:b.trade?.signature||""}),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},b.trade}async function uv(e=""){const t=L(),a=X(m("[data-chart-buy-amount]")?.value||""),r=Number(a);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let s=m("[data-chart-buy-wallet]")?.value||"";if(!s)throw new Error("Choose a wallet before buying.");const o=bt("chart-buy");let c={tokenMint:e,walletIndex:s,slippageBps:m("[data-chart-buy-slippage]")?.value||"400"};if(c=vs(c,{side:"chart buy",statusWriter:We}).form,s=c.walletIndex,at("trade-buy",e,String(a)))return n.tradeResult;if(n.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:ue(s),customAmountValid:!0,presetAmount:"",tradeAttemptId:o,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),We(ue(s)?"Opening wallet approval...":"Submitting Session Wallet buy..."),W({component:"post-trade",action:ue(s)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:L()-t,requestId:o,details:`${ue(s)?"browser":"session"}-buy:${w(e)}:${a}`}),le(),ue(s)){const y=await rr({side:"buy",form:c,actionDetail:String(a),amountSol:String(r),amountMode:"fixed",attemptId:o,statusWriter:We});return n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",We(y?.message||"Buy submitted from connected wallet."),Ce("trade-buy",e,String(a),3e3),y}const d=Md(),p={tokenMint:e,walletIndex:s,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:o};d.enabled&&Object.assign(p,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),We(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(p),dedupe:!1,timeoutMs:te});return n.tradeResult=f.trade,f.trade?.autoExitPlan&&(n.tradePlanResult=f.trade.autoExitPlan,gs()),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",V("trade-buy",e,String(a),{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"chart-session-buy",{tradeAttemptId:o}),We(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Ce("trade-buy",e,String(a),3e3),f.trade}async function dv(){try{const e=cv(),t=wi(n.quickBuyModal?.error||n.quickBuyModal?.status||"");if(t)throw new Error(t);n.quickBuyModal={...n.quickBuyModal,...e,status:"Validating quick buy...",error:""};const a=await Ps({..._d(),...e,source:n.quickBuyModal?.source||"quick-buy-modal"});n.quickBuyModal={...n.quickBuyModal,open:!1,status:a?.message||"Quick buy submitted.",error:""},n.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Ce("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=N(e.message||"Quick buy failed."),a=wi(t);n.quickBuyLast={...n.quickBuyLast||{},status:"failed",error:a||t},n.quickBuyModal={...n.quickBuyModal,status:a?"Token safety blocked fast buy.":"",error:a||t},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"})}}async function Cs(e,t=null){const a=L(),r=t||oe("trade",n.selectedTradePresetId);let s="quick";if(!r){cn(be(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const o=t?X(r.amountSol):He(r);if(!o)throw new Error("Set a quick buy amount first.");s=String(o);const c=at("trade-buy",e,s);if(c){W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${o}`});return}const l=bt("quick-trade");V("trade-buy",e,s,{state:"clicked",tradeAttemptId:l,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),n.tradeToken=e,h({preserveSmartChartFrame:n.activeTab==="smartChart"}),await Le(0),await Y(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!n.wallets.some(y=>String(y.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:o,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),n.tradeToken=e,await Le(20);const p=L();V("trade-buy",e,s,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:l,clientClickToUiMs:Math.round(p-a)}),dedupe:!1,timeoutMs:te});n.tradeResult=f.trade,f.trade?.autoExitPlan?(n.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),gs()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),n.tradeToken=e,V("trade-buy",e,s,{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:l}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Ce("trade-buy",e,s,3e3)}catch(o){e&&(V("trade-buy",e,s,{state:"error",error:N(o.message||"Quick buy failed")}),Ce("trade-buy",e,s,4e3)),$(o.message)}}async function Nd(e,t=null){const a=t||oe("bundle",n.selectedBundlePresetId);if(!a){Fd(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(a.walletIndexes||[]).length||(a.walletGroup?"group":"saved");if(!await xe({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${a.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){Fd(e,"bundle","Review the Bundle setup, then submit.");return}}try{n.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Le(0),await Y(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(a.walletIndexes||[]).filter(o=>n.wallets.some(c=>String(c.index)===String(o))),walletGroup:a.walletGroup||"",amountSol:t?X(a.amountSol)||"0.1":sw(a),percent:"100",slippageBps:a.slippageBps,sellDelay:a.sellDelay||"off",takeProfitPct:a.takeProfitPct,stopLossPct:a.stopLossPct,sellPercent:a.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const s=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});n.bundleResult=s.plan,n.bundleToken=e,K(Me(s.plan),"quick-preset-bundle"),n.activeTab="bundle",h()}catch(r){$(r.message)}}async function Ls(e,t="100",a={}){const r=L();let s=Number.parseInt(t,10),o="";try{if(await Y(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=Go(e,String(s));if(c){W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${s}`});return}const l=rt().find(S=>String(S.tokenMint)===String(e)),u=l?.symbol||l?.name||w(e),d=!!(l?.source==="connected-wallet"||l?.viewOnly||String(l?.walletIndex||"").toLowerCase()==="connected"),p=String(ce()?.publicKey||"").trim();if(d&&p){o=bt("manual-sell"),sa(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`browser:${w(e)}:${s}`}),$(""),n.activeTab!=="smartChart"&&(n.activeTab="positions");const S=n.activeTab==="smartChart"?We:T=>$(T);S("Building wallet-approved sell..."),le(),sa(e,String(s),{state:"submitting"});const A=await rr({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:a.slippageBps||"400"},actionDetail:`${s}%`,percent:String(s),attemptId:o,statusWriter:S});n.tradeResult=A,sa(e,String(s),{state:"submitted",signature:A?.signature||""}),K(A?.signature,"browser-manual-sell",{tradeAttemptId:o}),n.activeTab==="smartChart"?(We(A?.message||"Sell submitted from connected wallet."),le()):h({preserveSmartChartFrame:!1}),Xo(e,String(s),3e3);return}if(!(!!a.skipConfirm||await xe({title:"Confirm Exit",lines:[`Exit ${s}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${s}%`,danger:!0})))return;o=bt("manual-sell"),sa(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`${w(e)}:${s}`}),n.activeTab="positions",$(""),h(),await Le(20);const y=L();sa(e,String(s),{state:"submitting"});const g=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:s,slippageBps:"400",manualSellAttemptId:o,clientClickToUiMs:Math.round(y-r)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-y,requestId:o,resultCount:g.bundle?.successCount||0,details:g.bundle?.duplicate?"duplicate":"submitted"}),n.bundleResult=g.bundle,n.bundleToken=e,n.tradeToken=e,sa(e,String(s),{state:(g.bundle?.duplicate,"submitted"),signature:Me(g.bundle),backendMs:g.bundle?.manualSellTiming?.backendMs||null}),K(Me(g.bundle),"manual-sell-position"),n.activeTab="positions",h(),Xo(e,String(s),3e3)}catch(c){e&&Number.isInteger(s)&&(sa(e,String(s),{state:"error",error:N(c.message||"Sell failed")}),Xo(e,String(s),4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-r,requestId:o,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:N(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}}function Me(e){return e?.signature?e.signature:(e?.results||[]).find(a=>a.signature)?.signature||""}async function pv(){const e=m("[data-tx-audit-signature]")?.value?.trim()||n.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}n.terminalTxSignature=e,n.terminalTxLoading=!0,n.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);n.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){n.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{n.terminalTxLoading=!1,h()}}function mv(e,t="manager"){const a=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Trade Preset",walletIndex:m(`[data-${a}-preset-wallet]`)?.value||"1",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"25",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}:{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Bundle Preset",walletIndexes:qe(`${a}-preset`),walletGroup:m(`[data-${a}-preset-group]`)?.value?.trim()||"",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"60",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}}function fv(e,t){const a=(t||[]).find(r=>!r.readonly);a?.id&&(e==="trade"&&(n.selectedTradePresetId=a.id),e==="bundle"&&(n.selectedBundlePresetId=a.id))}function xs(e,t){const a=!!(t&&oe(e,t));e==="trade"&&(n.selectedTradePresetId=a?t:""),e==="bundle"&&(n.selectedBundlePresetId=a?t:"")}function Xi(e,t){e==="trade"&&(n.fastTradePresetStatus=t),e==="bundle"&&(n.fastBundlePresetStatus=t)}function hv(e,t){xs(e,t),Xi(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Dd(e,t="manager"){const a=m(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await Y(a,"Creating secure web profile for presets..."),v(a,"Saving preset...");const r=mv(e,t),s=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});n.presets=s.presets||n.presets,r.id&&oe(e,r.id)?xs(e,r.id):fv(e,n.presets?.[e]),t==="manager"&&ns(e,""),t==="fast"&&Xi(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),v(a,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&Xi(e,r.message),v(a,r.message),$(r.message)}}async function gv(e,t){try{const a=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});n.presets=a.presets||n.presets,e==="trade"&&n.selectedTradePresetId===t&&xs("trade",""),e==="bundle"&&n.selectedBundlePresetId===t&&xs("bundle",""),(e==="trade"&&n.editingTradePresetId===t||e==="bundle"&&n.editingBundlePresetId===t)&&ns(e,""),h()}catch(a){$(a.message)}}function Ud(e,t){ns(e,t),n.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const a=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);a?.scrollIntoView({behavior:"smooth",block:"start"}),a?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function qd(e={}){const t=m("[data-referral-status]");try{await Y(t,"Opening secure web profile..."),v(t,e.generate?"Generating referral code...":"Saving referral settings...");const a=String(m("[data-referral-code]")?.value||"").trim(),r=gg(m("[data-referral-link]")?.value||""),s=String(n.user?.referralCode||"").trim(),o=e.generate?a:r&&r!==s&&(!a||a===s)?r:a||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:o,generateReferralCode:!!e.generate,referralPayoutWallet:m("[data-referral-wallet]")?.value||""})});me(c.user);const l=c.user?.referralCode||n.user?.referralCode||"";v(t,e.generate?`Generated ${l}. Link is ready.`:`Referral settings saved. Code: ${l}`),h()}catch(a){v(t,a.message),$(a.message)}}async function bv(){const e=m("[data-trader-board-status]");try{await Y(e,"Opening secure web profile..."),v(e,"Saving trader board settings...");const t=m("[data-trader-board-wallet-mode]")?.value||"all",a=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!m("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:qe("trader-board")})});me(a.user),v(e,a.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){v(e,t.message),$(t.message)}}async function Hd(e,t){const a=t.dataset.watchToken||t.dataset.unwatchToken||"";if(a)try{await Y(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:a,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});n.watchlist=r.watchlist||n.watchlist,h()}catch(r){$(r.message)}}function Ji(e){const t=m("[data-launch-status]");v(t,e)}function yv(){const e=m("[data-launch-ticker]")?.value?.trim()||$t(Be().keywords)[0]||"",t=qe("launch"),a=m("[data-launch-group]")?.value?.trim()||"",r=m("[data-launch-amount]")?.value||"",s=x("[data-launch-tp]","[data-launch-tp-custom]","40"),o=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),l=x("[data-launch-loop]","[data-launch-loop-custom]","1"),u=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return Be().keywords=e,Be().open=!0,{ticker:e,walletIndexes:t,walletGroup:a,amountSol:r,takeProfitPct:s,stopLossPct:o,sellDelay:c,loopCount:l,loopDelay:u,slippageBps:d,...fa("launch")}}async function vv(){try{const e=yv();Ji("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});n.launchResult=t.watch,await ia(),n.activeTab="launch",h()}catch(e){Ji(e.message)}}async function wv(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});n.launchResult=t.watch,await ia(),n.activeTab="launch",h()}catch(t){Ji(t.message)}}function Sv(){return`
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
      <small data-wallet-sweep-status>${i(n.walletSweepStatus||"")}</small>
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
  `}function kv(){const e=Ku();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${i(n.sweepBackgroundStatus||"")}</small>
    </section>`}async function $v(){if(!n.sweepBackgroundPending){n.sweepBackgroundPending=!0,n.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:te});n.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await vt({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){n.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{n.sweepBackgroundPending=!1,h({force:!0})}}}function Tv(){const e=Cv(),a=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Kd()}
    <section class="account-check-card">
      <div>
        <h3>Wallet Actions</h3>
        <p>Refresh balances, view token positions, or remove saved wallet records after backup.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Balances</button>
      <button data-tab="positions">View Positions</button>
      <button data-tab="kol">Open KOL Tracker</button>
      <button data-tab="txAudit">Tx Audit</button>
      <small data-wallet-remove-status>${i(n.walletRemoveStatus||"")}</small>
    </section>
    <div class="table-list">
      ${Bi().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${tn(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${i(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${i(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${Lv(r)}
            ${r.sessionWallet?`<small>Session source: ${i(w(r.sourceConnectedWallet||""))}${r.fundingAmountSol?` | Budget ${i(r.fundingAmountSol)} SOL`:""}</small>`:""}
            </div>
          </div>
          <div class="card-actions compact">
            <button data-copy="${r.publicKey}">Copy</button>
            <button class="danger-lite" data-remove-wallet="${r.index}" data-remove-wallet-key="${i(r.publicKey)}" data-wallet-label="${i(`${r.index}. ${r.label}`)}">Remove</button>
          </div>
        </article>
      `).join("")}
    </div>
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${yb()}${kv()}${bb()}${Sv()}`},{key:"create",label:"Create",hint:"New wallets",html:en()},{key:"import",label:"Import",hint:"Add keys",html:Tu()},{key:"backup",label:"Backup",hint:"Save / restore",html:$u()},{key:"downloads",label:"Downloads",hint:"Exports",html:Au()}];if(!n.wallets.length){const r=a.filter(s=>s.key!=="balances"&&s.key!=="fund");return`
      ${e}
      ${O("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${rn({toolKey:"wallets",activeKey:sn("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${rn({toolKey:"wallets",activeKey:sn("wallets","balances"),sections:a})}
  `}function Av(){return(Array.isArray(n.wallets)?n.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function Pv(){if(!(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey)return"";const t=Av();return t?`
      <div class="session-wallet-cta is-ready">
        <span class="session-wallet-cta-badge ready">✓ Automation ready</span>
        <p>Session wallet funded${t.fundingAmountSol?` · <strong>${i(t.fundingAmountSol)} SOL</strong>`:""}. TP/SL, auto-sell, Ogre A.I. and bundles now run unattended from it — your connected wallet keeps your main funds.</p>
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
    </div>`}function Cv(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.connectedWalletBalance||{},a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",o=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${i(c.dexUrl||Q(c.mint))}" target="_blank" rel="noreferrer">
      ${mt({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
      <span>${i(c.symbol||c.shortMint||w(c.mint))}: ${i(c.uiAmount??"held")}</span>
    </a>
  `).join("");return`
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${i(e.provider||t.provider||"Solana Wallet")} ${i(w(e.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${i(a)}</strong></span>
          <span><small>Tokens</small><strong>${i(r)}</strong></span>
          <span><small>Status</small><strong>${t.error?"Needs refresh":"Synced"}</strong></span>
        </div>
        ${t.error?`<small>Check failed: ${i(t.error)}</small>`:""}
        ${o?`<div class="connected-token-list">${o}</div>`:""}
        ${Pv()}
        <small>${n.walletFastApprovalsEnabled?"Fast approvals are on for connected-wallet prompts.":"Fast approvals are off."}</small>
      </div>
      <div class="card-actions">
        <button data-refresh-all>Refresh</button>
        <button data-copy="${i(e.publicKey)}">Copy</button>
        <button type="button" data-wallet-fast-approvals-toggle>${n.walletFastApprovalsEnabled?"Fast Approvals On":"Fast Approvals Off"}</button>
        <button type="button" data-connect-wallet="solana">Reconnect</button>
        <button type="button" data-disconnect-wallet>Disconnect</button>
        <button data-tab="txAudit">Tx Audit</button>
        <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
      </div>
    </section>
  `}function Kd(){const e=n.balances.reduce((a,r)=>a+Number(r.tokens?.length||0),0)+Gc().length,t=n.balances.filter(a=>a.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${ii()}</strong></div>
      <div><span>Total SOL</span><strong>${Ft().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function Lv(e){const t=n.balances.find(o=>Number(o.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${i(t.error)}</span>`;const a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${i(a)} | ${i(r)}${i(s)}</span>`}function xv(){const e=rt(),t=`
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
    ${Mv()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(Op).join("")}
    </div>
  `:`${t}${O("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function Mv(){const e=n.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${i(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const a=t.filter(s=>!s.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
    <section class="trade-card bag-scan">
      <div class="trade-head">
        <div>
          <h3>🛡 Bag scan: ${a?`${a} of ${t.length} need eyes`:`all ${t.length} look healthy`}</h3>
          <p>Shield verdict + live liquidity on every bag, worst first. Scanned just now.</p>
        </div>
      </div>
      <div class="table-list">
        ${t.map(s=>`
          <article class="row-card">
            <div class="row-main">
              <strong>$${i(s.symbol)} <span style="color:${r[s.verdict]||"#9fb59a"};font-weight:800">${i(s.verdict)}${s.score!=null?` ${i(String(s.score))}/100`:""}</span></strong>
              <small>${s.flags.length?i(s.flags.join(" | ")):"no red flags"}${s.liquidityUsd!=null?` | liq ${B(s.liquidityUsd)}`:""}${s.marketCapUsd?` | MC ${B(s.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${i(s.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${i(s.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function Bv(e){const t=String(e||"").trim();if(!t)return;n.devWatch||(n.devWatch={});const a=!n.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:a}),timeoutMs:15e3});n.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}ka()}async function Rv(e,t=null){const a=String(e||"").trim();if(!a)return;const r=ct();t&&(t.disabled=!0,t.textContent="Arming...");try{const s=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:a,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});ud(a),n.walletRemoveStatus=s.message||"Exits armed.",t&&(t.textContent="✅ Armed"),dd().then(()=>h())}catch(s){$(s?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function Iv(){n.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});n.bagScan={status:"done",bags:e.bags||[]}}catch(e){n.bagScan={status:"error",message:e?.message||""}}h()}function Ov(){const e=`
    <section class="account-check-card">
      <div>
        <h3>PnL / Results</h3>
        <p>Refresh after a trade closes, or jump back to open positions and wallet balances.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh PnL</button>
      <button data-tab="positions">Open Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
    </section>
  `;return n.pnl?.totals?.tradeCount?`
    ${e}
    <section class="pnl-summary">
      <div><span>Trades</span><strong>${n.pnl.totals.tradeCount}</strong></div>
      <div><span>Spent</span><strong>${n.pnl.totals.spentSol} SOL</strong></div>
      <div><span>Received</span><strong>${n.pnl.totals.receivedSol} SOL</strong></div>
      <div><span>Realized</span><strong>${n.pnl.totals.realizedSol}</strong></div>
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
      ${n.pnl.tokens.map(t=>`
        <article class="pnl-portfolio-row with-avatar">
          <div class="pnl-token-cell">
            ${mt(t)}
            <div>
              <strong>${i(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${i(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${i(t.tokenMint)}">${i(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${i(t.spentSol||"0")} SOL</span>
          <span>${i(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${i(t.realizedSol||"0")}</span>
          <span>${i(t.holdTime||"n/a")}<small>Latest ${i(Se(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ge(Cu(t),"Share")}
            <button data-pnl-card="${i(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${i(t.tokenMint)}" data-share-text="${i(Cu(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${O("No PnL yet","Trades made through the bot will show here.")}`}function or(){return Ev(ir())}function ir(){const e=Object.values(n.livePairsByBucket||{}).flatMap(s=>s?.rows||[]),t=n.scan?.rows||[],a=n.kolScan?.rows||[],r=n.watchlist?.rows||[];return[...e,...t,...a,...r]}function un(e=""){const t=String(e||"");return t&&ir().find(a=>String(a?.tokenMint||"")===t)||null}function Yk(e=""){const t=un(e);return!t||!Bs(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function Ev(e=[]){const t=new Map;for(const a of e||[]){if(lr(a))continue;const r=String(a?.tokenMint||"");r&&!t.has(r)&&t.set(r,a)}return[...t.values()]}function ye(e=[]){const t=new Map;for(const a of e||[]){if(lr(a))continue;const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||Ms(a)>Ms(s))&&t.set(r,a)}return[...t.values()]}function Ms(e={}){return Kv(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(E(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function Fv(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function Bs(e={}){if(Fv(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=E(e.marketCap,e.fdv),r=E(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function lr(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=E(e.marketCap,e.fdv),r=E(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function Vd(){const e=or(),t=o=>e.find(c=>String(c.tokenMint)===o)||{tokenMint:o,shortMint:w(o),symbol:w(o),dexUrl:Q(o)},a=String(n.terminalToken||n.tradeToken||"").trim();if(a)return t(a);const r=String(n.terminalAutoToken||"").trim();if(r)return t(r);const s=(Ne()?.rows||[])[0]||e[0]||null;return s?.tokenMint&&(n.terminalAutoToken=String(s.tokenMint)),s}function Rs(){const e=or(),t=n.smartChartTokenRef||null,a=s=>e.find(o=>String(o.tokenMint||"")===s)||{...String(t?.tokenMint||"")===s?t:{},tokenMint:s,shortMint:w(s),symbol:t?.symbol||w(s),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||Q(t?.pairAddress||s),pumpUrl:s.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(s)}`:""},r=String(n.smartChartToken||n.terminalToken||n.tradeToken||"").trim();return Xd(r?a(r):Vd())}function zd(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const Wv=300*1e3,jd=45*1e3,Gd=600*1e3,_v=700,Nv=6e3,Dv=4,Uv=3e4;function Ye(e=""){const t=String(e||"").trim();if(!t)return null;const a=n.smartChartBootstrap?.[t]||null;if(!a)return null;const r=Date.now()-Number(a.loadedAt||a.resolvedAt||0);return a.status==="failed"?r<jd?a:null:r<Gd?a:null}function cr(e=""){const t=String(e||"").trim(),a=t?n.smartChartDexResolution?.[t]||Ye(t):null;if(!a)return null;const r=Date.now()-Number(a.resolvedAt||0);return a.status==="failed"?r<jd?a:null:r<Wv?a:null}function Xd(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=cr(t);return!a||a.status==="failed"?e:{...e,pairAddress:e.pairAddress||a.pairAddress||"",pairId:e.pairId||a.pairAddress||"",dexUrl:e.dexUrl||a.dexUrl||a.pairUrl||"",dexId:e.dexId||a.dexId||"",dexName:e.dexName||a.dexName||a.dexId||"",symbol:e.symbol||a.symbol||w(t),name:e.name||a.name||"Token",imageUrl:e.imageUrl||a.imageUrl||"",marketCap:e.marketCap||a.marketCap||0,marketCapUsd:e.marketCapUsd||a.marketCap||0,fdv:e.fdv||a.fdv||0,liquidityUsd:e.liquidityUsd||a.liquidityUsd||0,volumeH24:e.volumeH24||a.volumeH24||0,volumeH1:e.volumeH1||a.volumeH1||0,priceUsd:e.priceUsd||a.priceUsd||0,h1:e.h1||a.h1||0,volume:e.volume||a.volume||null,txns:e.txns||a.txns||null}}function Yi(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const a=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:a,resolvedAt:a};n.smartChartBootstrap={...n.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&Is({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function Is(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.pairAddress||e.pairId||"").trim();!t||!a&&!e.dexUrl&&!e.symbol&&!e.name||(n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{...n.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:a,dexUrl:e.dexUrl||Q(a||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||n.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||n.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||n.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||n.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||n.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||n.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||n.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function qv(e={}){const t=String(e?.tokenMint||n.smartChartToken||"").trim();if(!t)return!1;const a=String(e?.pairAddress||e?.pairId||"").trim();if(a)return Is({...e,tokenMint:t,pairAddress:a}),!1;if(Ye(t)?.pairAddress)return!1;const r=cr(t);return r?.pairAddress||r?.status==="failed"?!1:(n.smartChartDexResolving?.[t]||(n.smartChartDexResolving={...n.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{Qd(t).catch(()=>{})},0)),!0)}function Jd(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||n.smartChartToken||"").trim();return!a||!t.force&&Ye(a)?.status==="resolved"?!1:(n.smartChartBootstrapLoading?.[a]||(n.smartChartBootstrapLoading={...n.smartChartBootstrapLoading||{},[a]:!0},window.setTimeout(()=>{Qd(a,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const Qi=new Map;async function Yd(e){const t=String(e||"").trim();if(!t)return;const a=Qi.get(t)||0;if(Date.now()-a<3e4)return;Qi.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,p)=>(Number(p?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},s=async()=>{const o=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!o?.pair)throw new Error("no pair");return o.pair};try{const o=await Promise.any([r(),s()]);Yi({tokenMint:t,symbol:o.baseToken?.symbol||"",name:o.baseToken?.name||"",priceUsd:o.priceUsd,marketCap:o.marketCap||o.fdv||null,marketCapUsd:o.marketCap||o.fdv||null,fdv:o.fdv||null,liquidityUsd:Number(o.liquidity?.usd)||null,liquidity:{usd:Number(o.liquidity?.usd)||null},volumeH24:Number(o.volume?.h24)||null,volumeH1:Number(o.volume?.h1)||null,h1:Number(o.priceChange?.h1)||null,imageUrl:o.info?.imageUrl||"",dexUrl:o.url||"",pairAddress:o.pairAddress||"",dexId:o.dexId||"",pumpCurve:!!o.pumpCurve,bondingProgressPct:o.bondingProgressPct??null,source:o.pumpCurve?"pump-curve":"direct-dexscreener"}),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{Qi.delete(t)}}function Zi(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return a?(Is(e),Hh(a,e.symbol||e.name||""),Yd(a),Jd(e,{source:t.source||"prefetch"}),n.smartChartPrefetchLog=[...n.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:a,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(n.smartChartBootstrapLoading?.[a]||Ye(a)),cacheTtlMs:Gd}].slice(-20),!0):!1}async function Qd(e=""){const t=String(e||"").trim();if(!t)return null;try{const a=L(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),s=r.chart||r.dexToken||{};return Yi(s),H("chart-bootstrap",a,{component:"smartChart",cacheHit:!!s.cacheHit,stale:!!s.stale,details:`${t}:${s.chartProvider||"dexscreener-embed"}`}),n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),s}catch(a){return n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:N(a?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),null}finally{const a={...n.smartChartDexResolving||{}};delete a[t],n.smartChartDexResolving=a;const r={...n.smartChartBootstrapLoading||{}};delete r[t],n.smartChartBootstrapLoading=r}}function Hv(e,t={}){const a=zd(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(a)}?${r.toString()}`}function Zd(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Ye(a);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Hv(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function Qk(e={}){const t=String(e?.tokenMint||e?.mint||n.smartChartToken||""),a=op(t||e?.symbol||"pump"),r=Math.max(1,E(e.marketCap,e.fdv,e.liquidityUsd,1e4)),s=E(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),o=Math.max(4,Math.min(96,qt(e)||E(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(s)||E(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(l,u)=>{const d=Math.sin((u+a%11)/2.2)*c,p=(u/21-.5)*(s||o/3),f=((a>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+p+f)/100))})}function Zk(e={},...t){for(const a of t){const r=Number(e?.[a]);if(Number.isFinite(r)&&r>0)return r;const s=a.split(".").reduce((c,l)=>c?.[l],e),o=Number(s);if(Number.isFinite(o)&&o>0)return o}return 0}function e0(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="txns",s=Math.max(0,Math.min(100,qt(e)||E(e.bondingProgressPct,e.pumpProgress,0))),o=_(e.marketCapLabel,e.fdvLabel,B(e.marketCap),B(e.fdv)),c=_(e.liquidityLabel,B(e.liquidityUsd)),l=_(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,B(e.volumeM15),B(e.volume5m),B(e.volumeH1));return`
    <div class="smart-chart-frame smart-chart-dex-frame smart-chart-pump-frame${r?" pump-activity-only-frame":""}" data-loaded="true" data-chart-resolving="false">
      <div class="terminal-title-row">
        <div>
          <h4>${r?"Pump Transactions":"Pump Chart"}</h4>
          <p>${r?"Native SlimeWire Pump activity view for this unbonded launch.":"Native SlimeWire launch chart for unbonded Pump tokens."}</p>
        </div>
        <span class="sniper-pill">${s?`${s.toFixed(0)}% bonded`:"pre-bond"}</span>
      </div>
      ${r?"":`
        <div class="pump-native-chart">
          ${Sk(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${i(o)}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(c)}</dd></div>
          <div><dt>Volume</dt><dd>${i(l)}</dd></div>
          <div><dt>Status</dt><dd>${Ki(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":kk(e)}
      <small>${i(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function el(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",s=t==="info",o=Jd(e)||qv(e),c=s?`DexScreener info for ${e.symbol||w(a)}`:r?`DexScreener chart and transactions for ${e.symbol||w(a)}`:`DexScreener chart for ${e.symbol||w(a)}`,l=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",s?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=o?"Loading DEX chart while resolving fastest pair...":s?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",p=Zd(e,t);return`
    <div class="${i(l)}" data-chart-frame-loading="${i(d)}" data-chart-resolving="${o?"true":"false"}" data-chart-mint="${i(a)}" data-chart-mode="${i(t)}" data-chart-src="${i(p)}">
      <iframe title="${i(c)}" src="${i(p)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${i(t)}','${i(a)}')" allowfullscreen></iframe>
    </div>
  `}function ep(){const e=[...Object.values(n.livePairsByBucket||{}).flatMap(a=>a?.rows||[]),...n.livePairs?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[],...n.watchlist?.rows||[]],t=new Map;for(const a of e){const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||Ms(a)>Ms(s))&&t.set(r,a)}return t}function Kv(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,a)=>t+(a&&String(a).toLowerCase()!=="n/a"?1:0),0)}function tp(e=[]){const t=ep();return(e||[]).map(a=>ap(a,t.get(String(a?.tokenMint||""))))}function lt(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const s=Number(r[1]);if(!Number.isFinite(s))return null;const o=String(r[2]||"").toLowerCase();return o==="k"?s*1e3:o==="m"?s*1e6:o==="b"?s*1e9:s}function E(...e){for(const t of e){const a=lt(t);if(Number.isFinite(a)&&a>0)return a}for(const t of e){const a=lt(t);if(Number.isFinite(a))return a}return 0}function ap(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:E(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:E(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:_(e.marketCapLabel,t.marketCapLabel,B(e.marketCap),B(t.marketCap)),fdvLabel:_(e.fdvLabel,t.fdvLabel,B(e.fdv),B(t.fdv)),liquidityUsd:E(e.liquidityUsd,t.liquidityUsd),liquidityLabel:_(e.liquidityLabel,t.liquidityLabel,B(e.liquidityUsd),B(t.liquidityUsd)),volume5m:E(e.volume5m,t.volume5m),volume5mLabel:_(e.volume5mLabel,t.volume5mLabel,B(e.volume5m),B(t.volume5m)),volumeM15:E(e.volumeM15,t.volumeM15),volumeM15Label:_(e.volumeM15Label,t.volumeM15Label,B(e.volumeM15),B(t.volumeM15)),volumeM30:E(e.volumeM30,t.volumeM30),volumeM30Label:_(e.volumeM30Label,t.volumeM30Label,B(e.volumeM30),B(t.volumeM30)),volumeH1:E(e.volumeH1,t.volumeH1),volumeH1Label:_(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,B(e.volumeH1),B(t.volumeH1)),volumeH24:E(e.volumeH24,t.volumeH24),volumeH24Label:_(e.volumeH24Label,t.volumeH24Label,B(e.volumeH24),B(t.volumeH24)),volumeLabel:_(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,B(e.volumeH1),B(t.volumeH1)),sniperCount:E(e.sniperCount,t.sniperCount)}:e}function ur(e=[],t=[]){return ye([...n.livePairsByBucket.under1d?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.scan?.rows||[],...e,...t]).sort((r,s)=>Number(s.bestPickScore||s.score||0)-Number(r.bestPickScore||r.score||0)||E(s.volumeM15,s.volumeM30,s.volumeH1,s.volume5m,s.volumeH24)-E(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||E(s.marketCap,s.fdv)-E(r.marketCap,r.fdv)||Ze(r,s))}function j(e,t,a,r,s){return{key:e,label:t,severity:a,message:r,weight:s}}function Vv(e={}){const t=lt(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const a=lt(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(a)?a/60:null}function zv(e,t=[]){const a=(t||[]).some(s=>s.key==="hard_flag"),r=(t||[]).filter(s=>s.severity==="risk"&&s.key!=="liquidity_extreme").length;return a||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function jv(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const a=(t||[]).find(r=>r.severity==="risk");return a?.message?`Avoid recommended. ${a.message}`:"Avoid recommended. Multiple danger signals."}const Os=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function ga(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(Os,t)?t:"unknown"}function Es(e="",t="Unknown"){const a=ga(e);return Os[a]||t}function np(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=a?"new":"unknown";return{mint:t,status:r,label:Os[r],confidence:a?"low":"unknown",summary:a?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:a||null,updatedAt:""}}function dr(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(n.devInfoSummaries?.[t]||e.devInfoSummary)||np(e)}function Gv(e={}){const t=ga(e.status);return t==="hold"?j("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?j("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?j("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?j("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?j("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):j("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function rp(e={},t={}){if(!D("devInfoEnabled",!0))return"";const a=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!a)return"";const r=dr(e),s=ga(r.status),c=!!n.devInfoLoading?.[`summary:${a}`]?"...":s==="unknown"?"":r.label||Os[s]||"",l=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${i(s)} ${l?"is-compact":""}" data-dev-info="${i(a)}" title="${i(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${i(c)}</strong>`:""}
    </button>
  `}function Xv(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let a=70;const r=[],s=[],o=[],c=lt(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(a-=36,s.push("liquidity"),r.push(j("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(a-=20,s.push("liquidity"),r.push(j("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(a+=8,s.push("liquidity"),r.push(j("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(s.push("liquidity"),r.push(j("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(a-=6,o.push("liquidity"),r.push(j("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const l=Vv(e);Number.isFinite(l)?l<3?(a-=10,s.push("age"),r.push(j("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):l>60?(a+=4,s.push("age"),r.push(j("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):s.push("age"):(a-=4,o.push("age"),r.push(j("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=lt(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(a-=5,s.push("volume"),r.push(j("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(a+=6,s.push("volume"),r.push(j("volume_active","Volume","positive","Volume is active enough to review flow.",6))):s.push("volume"):o.push("volume");const d=lt(e.buys5m??e.buysH1??e.buys),p=lt(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(p)?(s.push("flow"),p>=d*1.8&&p>=5?(a-=18,r.push(j("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=p*1.4&&d>=8&&(a+=5,r.push(j("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):o.push("flow");const f=lt(e.bestPickScore??e.score);Number.isFinite(f)&&(s.push("score"),f>=78?(a+=7,r.push(j("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(a-=10,r.push(j("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(T=>String(T||"").toLowerCase());y.some(T=>/mayhem|fake|scam|honeypot|blacklist/.test(T))&&(a-=40,r.push(j("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(T=>/bundle|bundled|cluster|concentr/.test(T))&&(a-=18,r.push(j("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(T=>/dev|fresh wallet|fresh-wallet|insider/.test(T))&&(a-=14,r.push(j("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(T=>/mint|freeze|token-2022/.test(T))&&(a-=24,r.push(j("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const g=dr(e);if(g){const T=Gv(g);a+=Number(T.weight||0),r.push(T),["hold","mixed","risk","dump"].includes(ga(g.status))?s.push("devInfo"):o.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(a))),A=zv(S,r);return{mint:t,verdict:A,score:S,confidence:s.length>=5&&o.length<=1?"high":s.length>=3?"medium":"low",summary:jv(A,r),factors:r.slice(0,10),suggestedAction:A==="BUY"?"normal_buy":A==="CAUTION"?"small_buy":A==="RISK"?"watch_only":"avoid",protectedBuyPreset:A==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Qe(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&n.slimeShieldResults?.[t]||Xv(e)}function dn(e=""){return String(e||"CAUTION").toLowerCase()}function Jv(e={},t={}){if(!D("slimeShieldEnabled",!0))return Zv(e);const a=Qe(e),r=String(e.tokenMint||a.mint||"").trim(),s=a.verdict||"CAUTION",o=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${i(dn(s))}" data-slimeshield-details="${i(r)}" title="${i(a.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${o?"Shield":"SlimeShield"}</small>
    </button>
  `}function Yv(e={}){if(!D("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${i(tl(e))}">${i(s?`${s}`:"n/a")} score</em>`}const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${i(dn(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">Details</button>`}function t0(e={}){if(!D("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0),o=s?`${s}`:"n/a";return`
      <span class="terminal-score-chip" title="${i(tl(e))}">
        <strong>${i(o)}</strong>
        <small>score</small>
      </span>
    `}const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${i(dn(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Qv(e={}){return D("slimeShieldEnabled",!0)?`SlimeShield ${Qe(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function Zv(e={}){const t=Number(e.bestPickScore||e.score||0),a=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${i(tl(e))}">
      <strong>${i(r)}</strong>
      <small>${a.length?"warnings":"best pick"}</small>
    </span>
  `}function ew(e={}){return Jv(e,{compact:!0})}function tl(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},a=Object.entries(t).map(([s,o])=>`${s}: ${o}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...a,...r.map(s=>`warning: ${s}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function tw(e={}){return""}function B(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function _(...e){for(const t of e){const a=String(t??"").trim();if(a&&a!=="$0"&&a.toLowerCase()!=="n/a")return a}return"n/a"}function sp(e={}){return[["15m",_(e.volumeM15Label,B(e.volumeM15))],["30m",_(e.volumeM30Label,B(e.volumeM30))],["1h",_(e.volumeH1Label,e.volumeLabel,B(e.volumeH1))],["24h",_(e.volumeH24Label,B(e.volumeH24))]]}function a0(e={}){const t=dt(e),a=pt(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),s=_(e.liquidityLabel,a>0?B(a):"","checking"),o=sp(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(s)}</b></span>
      ${o.map(([c,l])=>`<span>${i(c)} <b>${i(l)}</b></span>`).join("")}
    </div>
  `}function aw(e={}){const t=dt(e),a=pt(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),s=_(e.liquidityLabel,a>0?B(a):"","checking"),o=_(e.volumeM15Label,B(e.volumeM15)),c=_(e.volumeH1Label,e.volumeLabel,B(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(s)}</b></span>
      <span>15m <b>${i(o)}</b></span>
      <span>1h <b>${i(c)}</b></span>
    </div>
  `}function pn(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const a=String(e.tokenMint||e.mint||"").trim();return a&&(e.isPump||a.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(a)}`:""}function Fs(e={},t=""){const a=t||Aa(e),r=Number(e.sniperCount||e.snipers||0),s=pn(e);return`
    <div class="compact-link-row">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${s?`<a href="${i(s)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${i(a)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(r)}</span>`:""}
    </div>
  `}function Ze(e={},t={}){const a=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(a)&&Number.isFinite(r)&&a!==r)return a-r;const s=Number(e.pairCreatedAt||0),o=Number(t.pairCreatedAt||0);return s||o?o-s:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function op(e=""){let t=0;for(let a=0;a<String(e).length;a+=1)t=(t<<5)-t+String(e).charCodeAt(a),t|=0;return Math.abs(t)}function ba(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function ya(e=""){const t=Ne();return[e,n.livePairBucket,n.terminalSort,up(),t?.refreshCount||"",n.livePairsLastUpdatedByBucket[n.livePairBucket]||n.livePairsLastUpdatedAt||"",n.kolScan?.refreshCount||"",n.kolScan?.refreshedAt||n.kolLastUpdatedAt||""].join(":")}function va(e=[],t=12,a="",r=0){const s=ye(e||[]),o=Math.max(0,Number(t)||s.length);if(!o)return[];if(!a||s.length<=o)return s.slice(0,o);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,o-1),s.length),l=s.slice(0,c),u=s.slice(c);if(!u.length)return l.slice(0,o);const d=op(a)%u.length,p=[...u.slice(d),...u.slice(0,d)];return[...l,...p].slice(0,o)}function ip(e=[],t=new Set){return(e||[]).filter(a=>{const r=ba(a);return!r||!t.has(r)})}function lp(e={}){const t=dt(e),a=pt(e),r=vl(e),s=Qs(e),o=Vp(e),c=_(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),l=_(e.liquidityLabel,a>0?B(a):"","checking"),u=_(e.volumeM15Label,r>0?B(r):"","checking"),d=_(e.volumeH1Label,e.volumeLabel,s>0?B(s):"","checking"),p=_(e.volumeH24Label,o>0?B(o):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${i(c)}</strong></span>
      <span><small>Liq</small><strong>${i(l)}</strong></span>
      <span><small>15m</small><strong>${i(u)}</strong></span>
      <span><small>1h</small><strong>${i(d)}</strong></span>
      <span><small>24h</small><strong>${i(p)}</strong></span>
    </div>
  `}function cp(e,{source:t,actionLabel:a="Trade",isKolContext:r=!1}={}){const s=Js(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(t)}" title="Open chart and buy/sell panel">${i(a)}</button>
    <button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(t)}" title="Quick buy with preset or custom SOL amount">${i(wa())}</button>
    <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${i(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?hd(e):""}
    <button type="button" class="watch-action" data-watched="${s}" title="${s?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(Ys(e)||"")}">${s?"Saved":"Watch"}</button>
    ${rp(e,{compact:!0})}
  `}function nw(e,t={}){const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=va(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,p)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${l?"is-kol-signal":""}" data-token-chart="${i(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${mt(d,{priority:p<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${i(d.tokenMint)}" data-token-chart-source="terminal-title">${i(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
                <small>${i(d.name||d.category||"Token")}</small>
                ${l?"":bl(d)}
                ${Yv(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${i(d.tokenMint)}">${i(w(d.tokenMint))}</button>
              <span class="terminal-token-age">${i(d.pairAgeLabel||Kt(d)||"age unknown")} | ${i(f)}</span>
              ${Fs(d)}
            </div>
            ${lp(d)}
            <div class="terminal-token-actions has-dev-info">
              ${cp(d,{source:"terminal-row",actionLabel:r,isKolContext:l})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:O(s,o)}function kt(e,t={}){if(t.layout==="terminal")return nw(e,t);const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=va(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(u.tokenMint)}" data-token-chart-source="compact-row">
          ${mt(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${i(u.tokenMint)}" data-token-chart-source="compact-title">${i(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
              <small>${i(u.name||u.category||"Token")}</small>
              ${l?"":bl(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${i(u.tokenMint)}">${i(w(u.tokenMint))}</button>
            <span>${i(u.pairAgeLabel||Kt(u)||"age unknown")} | ${i(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${aw(u)}
            ${Fs(u)}
          </div>
          ${ew(u)}
          <div class="compact-row-actions has-dev-info">
            ${cp(u,{source:"compact-row",actionLabel:r,isKolContext:l})}
          </div>
        </article>
      `).join("")}
    </div>
  `:O(s,o)}function mn(e){const t=oe(e,e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId);if(!t)return"Custom / manual";const a=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&a.push(`Timer ${t.sellDelay}`),a.join(" | ")}function n0(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${i(mn("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${it("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${it("bundle",n.selectedBundlePresetId)}
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
  `}function pr(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function X(e=n.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const a=t.indexOf(".");if(a!==-1&&(t=t.slice(0,a+1)+t.slice(a+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":pr(r)}function ct(){return oe("trade",n.selectedTradePresetId)}function rw(){return oe("bundle",n.selectedBundlePresetId)}function He(e=ct()){return X()||pr(e?.amountSol)}function sw(e=rw()){return X()||pr(e?.amountSol)||"0.1"}const al=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Ws(e=""){return al.find(t=>t.id===e)||al[0]}function nl(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function ow(e=Ws()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,a=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${a} | ${r}`}function iw(e={},t=Ws()){const a=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:a?.percentGain?String(a.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:a?.sellPercent?String(a.sellPercent):t.sellPercent||"100"}}function lw(e=""){if(ue(e)){const a=ce();return`${a?.provider||"Browser wallet"} ${a?.publicKey?w(a.publicKey):""}`.trim()}const t=n.wallets.find(a=>String(a.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Be(){return(!n.terminalLaunchFilters||typeof n.terminalLaunchFilters!="object")&&(n.terminalLaunchFilters={}),n.terminalLaunchFilters.socials=n.terminalLaunchFilters.socials||{},n.terminalLaunchFilters.quotes=n.terminalLaunchFilters.quotes||{},n.terminalLaunchFilters.audits=n.terminalLaunchFilters.audits||{},n.terminalLaunchFilters}function $t(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(a=>String(a||"").trim().split(/\s+/)).map(a=>a.trim().toLowerCase()).filter(a=>!a||t.has(a)?!1:(t.add(a),!0)).slice(0,3)}function up(e=Be()){const t=Object.keys(e.socials||{}).filter(s=>e.socials[s]).sort().join(","),a=Object.keys(e.quotes||{}).filter(s=>e.quotes[s]).sort().join(","),r=Object.keys(e.audits||{}).filter(s=>e.audits[s]).sort().join(",");return[$t(e.keywords).join(","),$t(e.excludeKeywords).join(","),t,a,r].join("|")}function fn(e=Be()){return!!up(e).replace(/\|/g,"")}function _s(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function cw(e={},t=""){const a=_s(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(a));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(a)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(a)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(a)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(a)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(a)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(a)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(a)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(a)):t==="minSocial"?r:!0}function uw(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const a=_s(e).toUpperCase();return a.includes("USDC")?"USDC":a.includes("USD1")?"USD1":a.includes("WSOL")||a.includes("SOL")?"WSOL":""}function Ns(e={},t=[]){const a=_s(e);return t.some(r=>r.test(a))}function dw(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!Ns(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!Ns(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:Ns(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const a=E(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return a>0?a<=30:!Ns(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function hn(e=[],t=Be()){const a=ye(e||[]);if(!fn(t))return a;const r=$t(t.keywords),s=$t(t.excludeKeywords),o=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),l=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return a.filter(u=>{const d=_s(u);return!(r.length&&!r.some(p=>d.includes(p))||s.length&&s.some(p=>d.includes(p))||o.some(p=>!cw(u,p))||c.length&&!c.includes(uw(u))||l.some(p=>!dw(u,p)))})}function rl(e=[],t=[]){const a=Be();if(!fn(a))return"";const r=$t(a.keywords),s=$t(a.excludeKeywords),o=[];r.length&&o.push(`watching ${r.map(l=>`"${l}"`).join(", ")}`),s.length&&o.push(`excluding ${s.map(l=>`"${l}"`).join(", ")}`);const c=Math.max(0,ye(e).length-ye(t).length);return`<div class="terminal-launch-filter-summary">${i(o.join(" | ")||"filters active")} - ${i(t.length)}/${i(ye(e).length)} visible${c?`, ${i(c)} hidden`:""}</div>`}function mr(e=[],t="pairs"){const a=Be(),r=$t(a.keywords),s=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",o=ye(e).length;return O("Watching fresh launches",o?`No ${t} match ${s} yet. ${o} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${s}.`)}function sl(e="terminal",t={}){const a=Be(),r=fn(a),s=!!(a.open||r),o=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):o;return`
    <section class="terminal-launch-filter ${s?"is-open":""}" data-terminal-launch-filter data-preserve-focus>
      <div class="terminal-launch-filter-head">
        <div>
          <strong>Launch Filter</strong>
          <span>${r?`${i(c)}/${i(o)} visible`:"Watch a known ticker before it goes live"}</span>
        </div>
        <button type="button" data-terminal-filter-toggle>${s?"Hide Filters":"Filter / Keyword Watch"}</button>
      </div>
      ${s?`
        <div class="terminal-launch-filter-grid">
          <label class="wide">
            Search keywords (max 3)
            <input data-terminal-filter-field="keywords" type="text" autocomplete="off" placeholder="cook, broscook, ogre" value="${i(a.keywords||"")}">
          </label>
          <label class="wide">
            Exclude keywords (max 3)
            <input data-terminal-filter-field="excludeKeywords" type="text" autocomplete="off" placeholder="test, fake, old" value="${i(a.excludeKeywords||"")}">
          </label>
          <fieldset>
            <legend>Socials</legend>
            ${ff.map(([l,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${i(l)}" ${a.socials?.[l]?"checked":""}> ${i(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${hf.map(([l,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${i(l)}" ${a.quotes?.[l]?"checked":""}> ${i(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${gf.map(([l,u])=>`
              <label><input type="checkbox" data-terminal-filter-audit="${i(l)}" ${a.audits?.[l]?"checked":""}> ${i(u)}</label>
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
  `}function dp(){Er&&window.clearTimeout(Er),Er=window.setTimeout(()=>{Er=null,Z("live"),Z("launch"),Z("sniper"),h()},180)}function Ds(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const s=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-s)/1e3))}const a=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return a&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const pw=100,mw=7200,fw=75e4,hw=86400,gw=2e6,bw=28e3,pp=18e4,yw=16e4;function mp(){const e=ep();return ye([...n.livePairs?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1d?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[]]).map(t=>ap(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!lr(t))}function gn(e={}){return E(e.marketCap,e.fdv)}function fp(e={}){return E(e.liquidityUsd)}function hp(e={}){return E(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function ol(e={}){if(bn(e))return!1;const t=Ds(e);return!Number.isFinite(t)||t<0||t>mw||gn(e)>fw?!1:qt(e)<70}function Us(e={}){if(bn(e))return!1;const t=qt(e),a=gn(e),r=a>=bw&&a<=pp;return t>=55&&(!a||a<=pp)||r}function gp(e={}){if(ol(e)||Us(e)||bn(e))return!1;const t=Ds(e);return Number.isFinite(t)&&(t<0||t>hw)||gn(e)>gw?!1:fp(e)>0||hp(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function bp(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function qt(e={}){const t=E(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const a=gn(e),r=bp(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&a>0?Math.max(1,Math.min(99,a/69e3*100)):0}function bn(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=bp(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const a=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=gn(e);return a&&r>=yw?!0:!!(a&&/\b(raydium|meteora|orca)\b/.test(t))}function qs(e={}){if(bn(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":Us(e)||t==="graduating"?"graduating":ol(e)?"new":(t==="steady"||t==="unknown"||gp(e),"steady")}function yp(e={}){const t=Number(e.bestPickScore||e.score||0),a=hp(e),r=fp(e),s=gn(e),o=Ds(e),c=Number.isFinite(o)?Math.max(0,86400-o)/86400:0;return t*1e3+Math.log10(a+1)*160+Math.log10(r+1)*120+Math.log10(s+1)*80+c*100}function vp(e=[]){return[...e].sort((t,a)=>yp(a)-yp(t)||Ze(t,a))}function vw(e=[],t=[],a=pw){const r=new Set,s=[];for(const o of[...e,...t]){const c=String(o?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),s.push(o),s.length>=a))break}return s}function wp(e=n.slimeScopeMode){const t=mp(),a=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(l=>qs(l)===a),s=t.filter(l=>{const u=qs(l);return a==="graduated"?u==="graduated"||bn(l):a==="graduating"?u==="graduating"||Us(l):a==="steady"?u==="steady"||gp(l):u==="new"||ol(l)}),o=a==="new"?[...r].sort(Ze):vp(r),c=a==="new"?ye(s).sort(Ze):vp(s);return vw(o,c)}function ww(e=[],t="new"){const a=nt(`slimeScope:${t}`,e).slice(0,12);return a.length?a.map((r,s)=>{const o=r.pairAgeLabel||Kt(r)||"age ?",c=_(r.marketCapLabel,r.fdvLabel,B(dt(r)),"checking"),l=_(r.liquidityLabel,B(pt(r)),"checking"),u=_(r.volumeM15Label,B(vl(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${i(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${mt(r,{priority:s<4})}
        <div class="slime-scope-column-main">
          <strong>${i(r.symbol||r.shortMint||w(r.tokenMint))}</strong>
          <small>${i(w(r.tokenMint))} · ${i(o)}</small>
          <span>${i(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${i(c)}</b></span>
          <span>Liq <b>${i(l)}</b></span>
          <span>15m <b>${i(u)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${i(He()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${i(t)} pairs.</div>`}function Sw(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,a,r])=>{const s=wp(t);return`
          <section class="slime-scope-column" data-scope-column="${i(t)}">
            <header>
              <div>
                <h4>${i(a)}</h4>
                <small>${i(r)}</small>
              </div>
              <span>${i(s.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${ww(s,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function kw(){const e=Up(),[,,t]=e,a=qc(n.slimeScopeMode),s=!!(z("slimeScope").inFlight||n.livePairsLoadingByBucket?.[a]),o=n.livePairsRefreshErrorByBucket?.[a],c=ye(qp(mp(),e[0])),l=nt("slimeScope",c),u=l.length?Jn()?ut(l,{context:"live",shareBuilder:Aa,hideToolbar:!0}):kt(l,{layout:"terminal",limit:Math.max(1,l.length),actionLabel:"Trade"}):o?O("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):s?O("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):O("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${aS(e)}<span>${i(t)}</span></div>
        ${Hp(c.length,ca())}
        ${Xu("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${s?"disabled":""}>${s?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${la("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${Sw()}
    </section>
  `}function r0(){const e=Ne(),t=ye(e?.rows||[]),a=hn(t),r=[...a].sort(Ze),s=tp(n.kolScan?.rows||[]).filter(C=>!lr(C)),o=hn(s),c=ur(t,s),l=hn(c),u=fn(),d=va(l,8,ya("best-picks"),2),p=new Set(d.map(ba).filter(Boolean)),f=ip(r,p),y=va(f.length?f:r,12,ya("live-pairs"),0),g=new Set([...p,...y.map(ba).filter(Boolean)]),S=ip(o,g),A=va(S.length?S:o,12,ya("kol-signals"),1),T=!!n.livePairsLoadingByBucket[n.livePairBucket],b=ca(),P="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${T?"Refreshing":"Live"}${b?` | ${i(Kn(Qa(b)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Bt.map(([C,M])=>{const q=n.livePairsByBucket[C]?.rows?.length,J=Number.isFinite(Number(q))?` (${q})`:"";return`<button data-live-pair-bucket="${C}" data-active="${n.livePairBucket===C}">${M}${J}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${mf.map(([C,M])=>`<option value="${C}" ${n.terminalSort===C?"selected":""}>${M}</option>`).join("")}
            </select>
          </label>
          ${Xu("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${T?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${sl("terminal",{rawCount:t.length,visibleCount:a.length})}
        ${rl(t,a)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?kt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:P,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?mr(c,"best picks"):kt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:P,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?kt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P}):u?mr(t,"live pairs"):kt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${n.kolLoading?"Loading...":"Refresh"}</button></header>
            ${A.length?kt(A,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?mr(s,"KOL signals"):kt(A,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:P,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${qw()}
      </main>
    </section>
  `}function s0(){const e=ct();if(!e)return"Trade";const t=He(e);return t?`Buy ${t} SOL`:Bm(e,"Trade")}function wa(){const e=ct(),t=He(e);return t?`Buy ${t} SOL`:"Quick Buy"}function Hs(){const e=wa();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{v(t,e)})}function Sa(e=""){const t=String(e||"").trim();if(!t)return null;const a=ir().find(s=>String(s?.tokenMint||s?.mint||s?.tokenAddress||"").trim()===t);if(a)return a;const r=n.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:Q(t)}}function $w(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function Tw(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function Sp(e={}){if(!D("slimeShieldEnabled",!0))return"";const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${i(dn(r))}">
      <header>
        <div>
          <strong>SlimeShield</strong>
          <small>Pre-trade risk read</small>
        </div>
        <span class="slimeshield-verdict">${i(r)}</span>
      </header>
      <p>${i(t.summary||"SlimeShield is warming up. Trade carefully.")}</p>
      <div class="slimeshield-actions">
        <button type="button" data-slimeshield-details="${i(a)}">Details</button>
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(a)}" data-protected-buy-preset="${i(t.protectedBuyPreset||nl(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function kp(e=[],t="risk",a="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(s=>t==="positive"?s.severity==="positive":s.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(s=>`
        <li>
          <strong>${i(s.label||s.key||"Signal")}</strong>
          <span>${i(s.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(a)}</p>`}function $p(e=""){const t=String(e||n.smartChartToken||n.tradeToken||"").trim();!t||!D("slimeShieldEnabled",!0)||(n.slimeShieldDetails={open:!0,tokenMint:t},n.slimeShieldStatus="",Ua(),$a(),Ks(t,{force:!0}),D("replayBeforeBuyEnabled",!0)&&ul(t,{force:!0}))}function il(){n.slimeShieldDetails={open:!1,tokenMint:""},n.slimeShieldStatus="",$a(),Fr()}async function Ks(e="",t={}){const a=String(e||"").trim();if(!a||!D("slimeShieldEnabled",!0))return null;if(!t.force&&n.slimeShieldResults?.[a])return n.slimeShieldResults[a];if(n.slimeShieldLoading?.[a])return null;n.slimeShieldLoading={...n.slimeShieldLoading||{},[a]:!0},$a();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return o&&(n.slimeShieldResults={...n.slimeShieldResults||{},[a]:o},ne(o.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),n.slimeShieldStatus=o.cacheHit?"Loaded from cache.":"Updated from local data."),o}catch(r){return n.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...n.slimeShieldLoading||{}};delete r[a],n.slimeShieldLoading=r,$a()}}function Aw(e=""){const t=Sa(e)||un(e)||{tokenMint:e},a=dr(t),r=a.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",s=[...Array.isArray(a.externalLinks)?a.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||Q(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:mint?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(mint)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((o,c,l)=>/^https?:\/\//i.test(String(o.url||""))&&l.findIndex(u=>String(u.url||"")===String(o.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:a.likelyDevWallet||null,confidence:a.confidence||"unknown",status:ga(a.status),label:a.label||Es(a.status),score:50,summary:a.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:a.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:a.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:a.updatedAt||new Date().toISOString(),externalLinks:s,dataSource:"ui-fallback"}}function Tp(e=""){const t=String(e||"").trim();return n.devInfoResults?.[t]||Aw(t)}function fr(e,t=""){const a=Number(e);return Number.isFinite(a)?`${Math.round(a*10)/10}${t}`:"n/a"}function Ap(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function Vs(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function Pw(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function Pp(e="",t={}){const a=String(e||"").trim();if(!a||!D("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoSummaries?.[a])return n.devInfoSummaries[a];const r=`summary:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0};try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(n.devInfoSummaries={...n.devInfoSummaries||{},[a]:c},ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,t.silent||ka()}}async function Cp(e="",t={}){const a=String(e||"").trim();if(!a||!D("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoResults?.[a])return n.devInfoResults[a];const r=`details:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0},ka();try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(n.devInfoResults={...n.devInfoResults||{},[a]:c},n.devInfoSummaries={...n.devInfoSummaries||{},[a]:{mint:a,status:c.status||"unknown",label:c.label||Es(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},n.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(s){return n.devInfoStatus=s?.message||"Dev Info is temporarily unavailable.",null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,ka()}}function Cw(e=""){const t=String(e||"").trim();!t||!D("devInfoEnabled",!0)||(n.devInfoDetails={open:!0,tokenMint:t},n.devInfoStatus="",Ua(),ka(),Pp(t,{force:!0,silent:!0}),Cp(t,{force:!0}))}function ll(){n.devInfoDetails={open:!1,tokenMint:""},n.devInfoStatus="",ka(),Fr()}function Lw(e="render"){!D("devInfoEnabled",!0)||Wo||n.route==="terminal"&&(Wo=window.setTimeout(()=>{Wo=null,xw(e)},300))}async function xw(e="render"){if(!D("devInfoEnabled",!0)||Da())return;const t=or().slice(0,16),a=[],r=new Set;for(const s of t){const o=String(s.tokenMint||s.mint||s.tokenAddress||"").trim();if(!(!o||r.has(o)||n.devInfoSummaries?.[o]||n.devInfoLoading?.[`summary:${o}`])&&(r.add(o),a.push(o),a.length>=8))break}a.length&&(await Promise.allSettled(a.map(s=>Pp(s,{silent:!0}))),W({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:a.length,details:e}),Da()||qa("dev-info-prefetch"))}function zs(e=[],t="No strong cached signal yet."){const a=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return a.length?`
    <ul class="slimeshield-factor-list">
      ${a.map(r=>`<li><span>${i(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(t)}</p>`}function js(e,t="Not cached yet"){const a=String(e||"").trim();return!a||a.toLowerCase()==="warming"||a.toLowerCase()==="checking"?t:a}function Gs(e,t=r=>String(r),a="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):a}function hr(e,t,a=""){if(e.__lastDrawerHtml===t)return!1;const r=a?e.querySelector(a):null,s=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,a&&s){const o=e.querySelector(a);o&&(o.scrollTop=s)}return!0}function ka(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=n.devInfoDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",a),!a||!D("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=Sa(r)||un(r)||{tokenMint:r},o=Tp(r),c=n.devInfoSummaries?.[r]||dr(s),l=ga(o.status||c.status),u=o.confidence||c.confidence||"unknown",d=!!n.devInfoLoading?.[`details:${r}`],p=o.likelyDevWallet||c.likelyDevWallet||"",f=o.currentPosition||null,y=o.historicalStats||{},g=o.linkedWalletSignals||{},S=o.marketContext||{},A=o.sourceHydration||{},T=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,8):[],b=E(S.marketCap,s.marketCap,s.fdv),P=E(S.liquidityUsd,s.liquidityUsd),C=E(S.volume5m,s.volume5m,s.volumeM5),M=E(S.volumeH1,s.volumeH1,s.volume1h),q=E(S.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),J=S.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",ke=S.mintAuthority||s.mintAuthority||"",et=S.freezeAuthority||s.freezeAuthority||"",U=!!(S.heliusDasIndexedAt||S.heliusDasSource||s.heliusDasSource||J||ke||et),_e=[...Array.isArray(o.externalLinks)?o.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:s.dexUrl||Q(r)},{label:"Solscan Wallet",url:p?`https://solscan.io/account/${encodeURIComponent(p)}`:""},{label:"KOLscan Wallet",url:p?`https://kolscan.io/account/${encodeURIComponent(p)}`:""},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"X",url:s.twitterUrl||s.xUrl},{label:"TG",url:s.telegramUrl},{label:"Website",url:s.websiteUrl}].filter((pe,go,bo)=>/^https?:\/\//i.test(String(pe.url||""))&&bo.findIndex(Sn=>String(Sn.url||"")===String(pe.url||""))===go).slice(0,8),Xt=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],Ct=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${i(Es(l))} · ${i(Ap(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${i(l)}">
        <strong>${i(s.symbol||s.shortMint||w(r))}</strong>
        <p>${i(o.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${i(Se(o.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${i(Pw(p))}</dd></div>
          <div><dt>Confidence</dt><dd>${i(Ap(u))}</dd></div>
          <div><dt>Source</dt><dd>${i(o.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${i(w(o.pairAddress||s.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${p?`<button type="button" data-copy="${i(p)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${i(r)}">Copy CA</button>
          ${p&&n.user?`<button type="button" data-dev-watch="${i(p)}">${n.devWatch?.[p]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${_e.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${_e.map(pe=>`<a href="${i(pe.url)}" target="_blank" rel="noreferrer">${i(pe.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${i(Gs(b,B))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(Gs(P,B))}</dd></div>
          <div><dt>5m volume</dt><dd>${i(Gs(C,B))}</dd></div>
          <div><dt>1h volume</dt><dd>${i(Gs(M,B))}</dd></div>
          <div><dt>Pair age</dt><dd>${i(Number.isFinite(q)?Vs(q):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(J?w(J):U?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${ke?w(ke):U?"none":"not indexed"} / ${et?w(et):U?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(S.source||o.cacheSource||o.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${A.message?`<p class="slimeshield-muted">Source refresh: ${i(A.message)}${A.eventsStored?` · ${i(A.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${zs(T,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${i(fr(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${i(fr(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${i(fr(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${i(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${i(Vs(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${i(f.lastSellAt?Se(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||Xt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${i(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${i(Vs(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${i(fr(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${i(fr(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${Xt.length?`
          <ul class="dev-info-launches">
            ${Xt.map(pe=>`<li><span>${i(pe.symbol||w(pe.mint||""))}</span><small>${i(pe.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(o.riskReasons)&&o.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${zs(o.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(o.positiveReasons)&&o.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${zs(o.positiveReasons,"")}
      </section>`:""}
      ${g.linkedWalletCount||Array.isArray(g.notes)&&g.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${i(g.linkedWalletCount?`${g.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${zs(g.notes,"")}
      </section>`:""}
      ${(()=>{const pe=[f?"":"dev position",Number(y.launchesTracked)>0||Xt.length?"":"launch history",!(o.riskReasons||[]).length&&!(o.positiveReasons||[]).length?"behavior signals":"",!g.linkedWalletCount&&!(g.notes||[]).length?"linked wallets":""].filter(Boolean);return pe.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${i(pe.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${i(o.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${i(r)}" data-watch-symbol="${i(s.symbol||"")}" data-watch-name="${i(s.name||"")}" data-watch-image="${i(Ys(s)||"")}">${Js(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${i(r)}">Open SlimeShield</button>
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${i(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${n.devInfoStatus?`<small class="slimeshield-status">${i(n.devInfoStatus)}</small>`:""}
    </aside>
  `;hr(e,Ct,".dev-info-drawer")}function Lp(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function cl(e=""){const t=String(e||"").trim();return n.replayResults?.[t]||Lp(t)}function yn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function Mw(e=""){if(!D("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const a=cl(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${i(a.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(yn(a.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(yn(a.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${i(a.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function ul(e="",t={}){const a=String(e||"").trim();if(!a||!D("replayBeforeBuyEnabled",!0))return null;if(!t.force&&n.replayResults?.[a])return n.replayResults[a];if(n.replayLoading?.[a])return null;n.replayLoading={...n.replayLoading||{},[a]:!0},gr(),$a();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return o&&(n.replayResults={...n.replayResults||{},[a]:o},ne(o.cacheHit?"replayCacheHit":"replayCacheMiss")),o}catch{return n.replayResults={...n.replayResults||{},[a]:Lp(a)},null}finally{const r={...n.replayLoading||{}};delete r[a],n.replayLoading=r,gr(),$a()}}function Bw(e=""){const t=String(e||"").trim();!t||!D("replayBeforeBuyEnabled",!0)||(n.replayDetails={open:!0,tokenMint:t},Ua(),gr(),ul(t))}function dl(){n.replayDetails={open:!1,tokenMint:""},gr(),Fr()}function gr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=n.replayDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",a),!a||!D("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=cl(r),o=!!n.replayLoading?.[r],c=`
    <div class="slimeshield-drawer-backdrop" data-replay-close></div>
    <aside class="replay-before-buy-drawer" role="dialog" aria-modal="true" aria-label="Replay Before You Buy details">
      <header>
        <div>
          <span>Replay Before You Buy</span>
          <h3>${i(w(r))}</h3>
        </div>
        <button type="button" data-replay-close>Close</button>
      </header>
      <section class="replay-summary">
        <strong>${i(s.summary||"Not enough local history yet.")}</strong>
        <small>${o?"Updating...":`Confidence: ${i(s.confidence||"low")} · Updated ${i(Se(s.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${i(s.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(yn(s.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${i(yn(s.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(yn(s.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${i(yn(s.failRatePercent))}</dd></div>
        <div><dt>Best exit</dt><dd>${i(s.bestExitPattern||"n/a")}</dd></div>
      </dl>
      <section>
        <h4>Matched Traits</h4>
        ${Array.isArray(s.matchedTraits)&&s.matchedTraits.length?`
          <ul class="slimeshield-factor-list">
            ${s.matchedTraits.map(l=>`<li><span>${i(l)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${i(r)}" ${o?"disabled":""}>${o?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `;hr(e,c,".replay-drawer")}function $a(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=n.slimeShieldDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",a),!a||!D("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=Sa(r)||{tokenMint:r},o=n.slimeShieldResults?.[r]||Qe(s),c=o.verdict||"CAUTION",l=o.sourceHydration||{},u=o.marketContext||{},d=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,6):[],p=!!n.slimeShieldLoading?.[r],f=Array.isArray(o.factors)?o.factors:[],y=E(u.marketCap,s.marketCap,s.fdv),g=E(u.liquidityUsd,s.liquidityUsd),S=E(u.volumeH1,s.volumeH1,s.volume1h),A=E(u.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),T=u.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",b=u.mintAuthority||s.mintAuthority||"",P=u.freezeAuthority||s.freezeAuthority||"",C=!!(u.heliusDasIndexedAt||u.heliusDasSource||s.heliusDasSource||T||b||P),M=o.devInfoSummary||dr(s),q=ga(M.status),J=[...Array.isArray(o.externalLinks)?o.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||s.dexUrl||Q(r)},{label:"Pump",url:u.pumpUrl||pn(s)},{label:"X",url:u.twitterUrl||s.twitterUrl||s.xUrl},{label:"TG",url:u.telegramUrl||s.telegramUrl},{label:"Web",url:u.websiteUrl||s.websiteUrl}].filter((U,_e,Xt)=>/^https?:\/\//i.test(String(U.url||""))&&Xt.findIndex(Ct=>String(Ct.url||"")===String(U.url||""))===_e),ke=[...Array.isArray(s.riskFlags)?s.riskFlags:[],...Array.isArray(s.scoreWarnings)?s.scoreWarnings:[],...Array.isArray(s.bestPickWarnings)?s.bestPickWarnings:[]].filter(Boolean).slice(0,4),et=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${i(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${i(dn(c))}">
        <strong>${i(s.symbol||s.shortMint||w(r))}</strong>
        <p>${i(o.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${i(o.confidence||"low")}</span>
          <span>Score: ${i(Number.isFinite(Number(o.score))?`${Math.round(Number(o.score))}/100`:"n/a")}</span>
          <span>${p?"Updating...":`Updated ${i(Se(o.updatedAt))}`}</span>
        </div>
      </section>
      <section>
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${i(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${i(Number.isFinite(A)?Vs(A):js(s.pairAgeLabel||Kt(s),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(Number.isFinite(g)&&g>0?B(g):js(s.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${i(Number.isFinite(y)&&y>0?B(y):js(s.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${i(Number.isFinite(S)&&S>0?B(S):js(s.volumeH1Label||s.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${i(Es(q))} · ${i(M.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(T?w(T):C?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${b?w(b):C?"none":"not indexed"} / ${P?w(P):C?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(u.source||o.cacheSource||o.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${i(ke.length?ke.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${J.map(U=>`<a href="${i(U.url)}" target="_blank" rel="noreferrer">${i(U.label)}</a>`).join("")}
          ${D("devInfoEnabled",!0)?`<button type="button" data-dev-info="${i(r)}">Open Dev Info</button>`:""}
        </div>
        ${l.message?`<p class="slimeshield-muted">Source refresh: ${i(l.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(U=>`<li><span>${i(U)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${kp(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${kp(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${i($w(o.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${i(Tw(o.protectedBuyPreset))}</small>
      </section>
      ${Mw(r)}
      <div class="slimeshield-drawer-actions">
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-preset="${i(o.protectedBuyPreset||nl(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${i(r)}" ${p?"disabled":""}>${p?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${i(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${n.slimeShieldStatus?`<small class="slimeshield-status">${i(n.slimeShieldStatus)}</small>`:""}
    </aside>
  `;hr(e,et,".slimeshield-drawer")}function pl(e){const t=e==="bundle"?"bundle":"trade";n.activeTab=t,t==="trade"&&(n.editingTradePresetId=""),t==="bundle"&&(n.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function o0(e){if(!e?.tokenMint)return O("No token selected","Click any row to preview it here without leaving the live feeds.");const t=rt().some(a=>String(a.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${mt(e)}
      <div>
        <strong>${i(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
        <small>${i(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${i(e.tokenMint)}">${i(w(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${i(e.pairAgeLabel||Kt(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${i(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${i(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${i(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${D("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${i(D("slimeShieldEnabled",!0)?Qe(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${Sp(e)}
    <div class="card-actions compact">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${pn(e)?`<a href="${i(pn(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="token-preview">${i(wa())}</button>
      <button data-quick-bundle-token="${i(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function i0(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([a,r])=>`<button type="button" data-smart-chart-view="${a}" data-active="${e===a}">${r}</button>`).join("")}
    </div>
  `}function Rw(e=""){const t=String(e||"").trim();return t?(n.pnl?.trades||[]).filter(a=>String(a?.tokenMint||a?.mint||"").trim()===t):[]}function l0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Rw(a),s=!!(pn(e)&&Ki(e)),o=s?pn(e):e.dexUrl||Q(zd(e)||a),c=s?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${i(c)} Transactions</h4>
          <p>Live market activity from ${i(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${i(o)}" target="_blank" rel="noreferrer">Open ${i(c)} Feed</a>
      </div>
      ${el(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${fl(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function c0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Mm(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${i(e.symbol||w(a))}.</p>
        </div>
      </div>
      ${el(e,"info")}
      ${lp(e)}
      ${Sp(e)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${i(r)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${i(a)}">${i(w(a))}</button></dd></div>
        <div><dt>Position</dt><dd>${t?"Held":"None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${i(e.source||e.category||e.dexId||"market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${Fs(e)}
      </div>
    </section>
  `}function Iw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=n.chartTradeTab==="sell"?"sell":"buy",s=ce(),o=n.wallets?.length?String(n.wallets[0]?.index||""):"",c=Td(),l=ct(),u=l?.walletIndex||(l?.walletIndexes||[])[0]||"",d=s?.publicKey&&Ad(s)?"connected":"",p=n.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||o||(s?.publicKey?"connected":""),f=ue(p),y=n.quickBuyAmountOverride||He(l)||"",g=l?mn("trade"):"No preset / manual",S=String(l?.slippageBps||"400"),A=String(l?.takeProfitPct||"25"),T=String(l?.stopLossPct||"8"),b=String(l?.sellDelay||"off"),P=String(l?.sellPercent||"100"),C=new Set(["300","400","500"]),M=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,q=t?`${i(t.uiAmount||"Position")} tokens | ${i(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${nn(p)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${i(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(J=>`<button type="button" data-chart-buy-preset="${J}">${J} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${it("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <small class="chart-preset-summary">${i(g)}</small>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300" ${S==="300"?"selected":""}>3%</option>
              <option value="400" ${S==="400"?"selected":""}>4%</option>
              <option value="500" ${S==="500"?"selected":""}>5%</option>
              ${C.has(S)?"":`<option value="${i(S)}" selected>${i(M)}</option>`}
            </select>
          </label>
          <div class="chart-auto-exit-grid" aria-label="Chart buy exit settings">
            <label>
              Take Profit
              ${Dt({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:A,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${Dt({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Xe("chart-buy-delay","data-chart-buy-delay",b)}
            </label>
            <label>
              Exit Size
              ${Dt({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:P,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${i(s?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:o?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${i(a)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${i(n.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${q}</p>
          <div class="quick-grid">
            <button type="button" data-position-sell="${i(a)}" data-position-sell-percent="25" ${t?"":"disabled"}>Sell 25%</button>
            <button type="button" data-position-sell="${i(a)}" data-position-sell-percent="50" ${t?"":"disabled"}>Sell 50%</button>
            <button type="button" class="danger" data-position-sell="${i(a)}" data-position-sell-percent="100" ${t?"":"disabled"}>Sell 100%</button>
          </div>
          <label>
            Custom sell %
            <input data-chart-sell-percent type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="100" ${t?"":"disabled"}>
          </label>
          <button type="button" data-chart-confirm-sell="${i(a)}" ${t?"":"disabled"}>Confirm Custom Sell</button>
        </div>
      `}
    </div>
  `}function u0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim();return a?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${i(a)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${D("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${i(a)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function Ow(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=dt(e),s=pt(e),o=y=>{const g=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(g)?"":g},c=_(r>0?B(r):"",o(e.marketCapLabel),o(e.fdvLabel),"checking"),l=_(s>0?B(s):"",o(e.liquidityLabel),"checking"),u=_(Number(e.volumeH1)>0?B(e.volumeH1):"",o(e.volumeH1Label),o(e.volumeLabel),"checking"),d=_(Number(e.volumeH24)>0?B(e.volumeH24):"",o(e.volumeH24Label),"checking"),p=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,g=Number(e.h1);return s>0&&s<5e3?"Thin exit":Number.isFinite(g)&&g>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(g)||g>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&s>0?"Clean setup":""})(),f=t?"Position held":p||(Ki(e)?"Pump curve":_(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${i(w(a))}</strong></span>
      <span><small>MC / FDV</small><strong>${i(c)}</strong></span>
      <span><small>LIQ</small><strong>${i(l)}</strong></span>
      <span><small>1H</small><strong>${i(u)}</strong></span>
      <span><small>24H</small><strong>${i(d)}</strong></span>
      <span><small>Status</small><strong>${i(f)}</strong></span>
    </div>
  `}function Ew(){try{return Fw()}catch(e){console.error("Smart Chart render failed:",e);const t=String(n.smartChartToken||n.tradeToken||n.terminalToken||"").trim(),a=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
      <section class="smart-chart-terminal smart-chart-fallback">
        <div class="terminal-title-row">
          <div>
            <h3>Smart Chart</h3>
            <p>Chart recovered safely. Your trade state is safe and the terminal stayed open.</p>
          </div>
          <button type="button" data-tab="terminal">Back to Live Terminal</button>
        </div>
        <div class="smart-chart-search">
          <input data-smart-chart-input value="${i(t)}" placeholder="Paste token CA" autocomplete="off">
          <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
        </div>
        <article class="terminal-panel smart-chart-main">
          <div class="smart-chart-token-header">
            <div class="avatar-fallback">SW</div>
            <div>
              <strong>${i(a)}</strong>
              <small>Recovered chart view</small>
              ${t?`<button type="button" class="ca-copy" data-copy="${i(t)}">${i(a)}</button>`:""}
            </div>
            <div class="compact-link-row smart-chart-links">
              ${t?`<a href="https://dexscreener.com/solana/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Dex</a>`:""}
              ${t?`<a href="https://pump.fun/coin/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              ${t?`<a href="https://solscan.io/token/${encodeURIComponent(t)}" target="_blank" rel="noreferrer">Solscan</a>`:""}
            </div>
          </div>
          ${r?`
            <div class="smart-chart-frame smart-chart-fallback-frame" data-chart-frame-loading="Loading live chart..." data-loaded="true">
              <iframe src="${i(r)}" title="SlimeWire recovered live chart" loading="lazy" referrerpolicy="no-referrer"></iframe>
            </div>
          `:O("Paste a token CA","Open a token from Live Terminal or paste a CA above.")}
          <small class="score-breakdown">Fallback chart kept the page alive after a display error. Reopen the CA to refresh the full SlimeWire chart shell.</small>
        </article>
      </section>
    `}}function Fw(){const e=Rs(),t=String(e?.tokenMint||"").trim(),a=t?rt().find(o=>String(o.tokenMint)===t):null,r=t?ye([e,...or().filter(o=>String(o.tokenMint||"")===t)]).filter(Boolean).slice(0,5):va(ur(),5,ya("smart-chart-suggest"),1);if(!t)return`
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
          ${kt(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:ya("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;ra("tokenHeaderRendered"),ra("chartSkeletonRendered"),ra("buyPanelReady"),W({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(Ye(t)?.cacheHit||cr(t)?.pairAddress),stale:!!Ye(t)?.stale,details:t});const s=e.symbol||e.shortMint||w(t);return`
    <section class="smart-chart-terminal smart-chart-clean-terminal">
      <div class="terminal-title-row smart-chart-clean-title">
        <div>
          <h3>${i(s)} Chart</h3>
          <p>DEX chart, live transactions, and wallet trade controls for the selected CA.</p>
        </div>
        <button type="button" data-tab="terminal">Back to Live Terminal</button>
      </div>
      <div class="smart-chart-search smart-chart-clean-search">
        <input data-smart-chart-input value="${i(t)}" placeholder="Paste token CA" autocomplete="off">
        <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
      </div>
      <div class="smart-chart-grid smart-chart-clean-grid">
        <article class="terminal-panel smart-chart-main smart-chart-clean-main">
          ${(()=>{Ww(t);const o=xp(t);return o?`<div class="coin-banner-hero" style="background-image:url('${o}')" role="img" aria-label="Coin banner"></div>`:""})()}
          <div class="smart-chart-token-header smart-chart-clean-token-header${xp(t)?" has-banner":""}">
            ${mt(e)}
            <div>
              <strong>${i(s)}</strong>
              <small>${i(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${i(t)}">${i(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${Fs(e)}
            </div>
          </div>
          ${Ow(e,a)}
          ${el(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${i(s)}</h3>
          ${Iw(e,a)}
        </aside>
      </div>
      ${Nw(t)}
    </section>
  `}function xp(e){const t=String(e||"").trim();return n.coinBanners&&n.coinBanners[t]||""}let Mp="";function Ww(e){const t=String(e||"").trim();!t||Mp===t||(Mp=t,k(`/api/web/coin-banner?mint=${encodeURIComponent(t)}`).then(a=>{const r=String(a?.bannerUri||"");r&&(n.coinBanners=n.coinBanners||{},n.coinBanners[t]=st(r),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0}))}).catch(()=>{}))}let ml="",Bp=0;function Rp(e){e&&(ml===e&&Date.now()-Bp<3e4||(ml=e,Bp=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{n.chartCalls={mint:e,...t},n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function _w(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[a,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${a} ${r}`}function Nw(e){Rp(e);const t=n.chartCalls?.mint===e?n.chartCalls:null,a=t?.calls||[],r=!!(n.token&&n.user);return`
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
          <button class="primary" data-call-post="${i(e)}">Post Call</button>
        </div>
        <small data-call-status></small>`:'<p class="trade-status">Log in to post calls - reads are public.</p>'}
      ${a.length?`
        <div class="table-list compact-table">
          ${a.map(s=>`
            <article class="row-card">
              <div class="row-main">
                <strong>${i(_w(s.side))} <span class="muted-text">by ${i(s.handle)}</span>
                  ${s.reputation?.wins?`<span class="positive">${i(String(s.reputation.wins))}W${s.reputation.hitRatePct!=null?` ${i(String(s.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${s.entryMcUsd?`Entry MC ${i(B(s.entryMcUsd))} | `:""}${s.targetX?`Target ${i(String(s.targetX))}x | `:""}${s.shieldVerdict?`Shield ${i(s.shieldVerdict)} ${i(String(s.shieldScore??""))} | `:""}${i(Se(s.createdAt))}</span>
                ${s.note?`<small>${i(s.note)}</small>`:""}
                ${s.status==="resolved"?`<small class="${s.outcome==="won"?"positive":"negative"}">${s.outcome==="won"?`✅ hit ${i(String(s.peakX))}x`:i(s.outcome)}</small>`:s.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${i(s.mint)}" data-quick-buy-source="call-board">${i(wa())}</button>
                <button data-watch-token="${i(s.mint)}" data-watch-symbol="${i(s.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${i(Va(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ge(`$${n.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function Dw(e){const t=m("[data-call-status]");try{const a=m("[data-call-side]")?.value||"bullish",r=m("[data-call-target]")?.value||"",s=m("[data-call-note]")?.value||"";v(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:a,targetX:r,note:s,source:"site"})}),v(t,"Call posted - it is now being tracked."),ml="",Rp(e)}catch(a){v(t,N(a?.message||"Could not post call."))}}function Uw(e,t=!1){const a=e?.tokenMint?n.positions.find(o=>String(o.tokenMint)===String(e.tokenMint)):null,r=mn("trade"),s=mn("bundle");return t?`
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
          <small>${i(r)}</small>
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
              <small>${i(s)}</small>
            </summary>
            <label>
              Trade Preset
              <select data-fast-trade-preset="terminal">
                ${it("trade",n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${it("bundle",n.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${Ft().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${i(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${i(wa())}</button>
              <button data-quick-bundle-token="${i(e.tokenMint)}">Bundle</button>
              <button data-smart-chart-token="${i(e.tokenMint)}">Chart</button>
              <button data-use-token-volume="${i(e.tokenMint)}">Volume</button>
              <button data-tab="sniper">Snipe</button>
            </div>
            ${a?`
              <div class="exit-strip">
                <strong>Position held</strong>
                <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
                <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
                <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
              </div>
            `:""}
          `:O("No token selected","Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${i(Gr())}</small>
        </div>
    </article>
  `}function qw(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,a])=>`<button data-terminal-subtab="${t}" data-active="${n.terminalSubtab===t}">${a}</button>`).join("")}
      </div>
      ${Hw()}
    </section>
  `}function Hw(){if(n.terminalSubtab==="orders")return Ep();if(n.terminalSubtab==="history")return fl(12);if(n.terminalSubtab==="wallets")return Kd();if(n.terminalSubtab==="kol"){const e=tp(n.kolScan?.rows||[]).filter(t=>!lr(t));return kt(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:ya("bottom-kol"),stickyCount:1})}return n.terminalSubtab==="sniper"?n.scan?ut(n.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):O("No sniper scan loaded","Open Sniper or refresh a scan mode."):n.terminalSubtab==="tx"?Wp(!0):n.terminalSubtab==="reconcile"?Fp():Kw(6)}function Kw(e=25){const t=rt();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(Op).join("")}
    </div>
  `:O("No open positions","Open token holdings will show here after refresh.")}const Ip=new Map;function Vw(e){const t=String(e.tokenMint||"");if(!t)return"";const a=(n.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=ir().find(d=>String(d?.tokenMint||"")===t),s=(Array.isArray(n.tradePlans)?n.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),o=[];a?.spentSol&&o.push(`Entry ${a.spentSol} SOL`),r?.marketCapLabel&&o.push(`MC ${r.marketCapLabel}`),o.push(s?`TP ${s.takeProfitSummary||s.takeProfitPct||"off"} / SL ${s.stopLossSummary||s.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let l="";if(Number.isFinite(c)){const d=Ip.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const p=c-d.value;l=`${p>0?"▲ +":"▼ "}${p.toFixed(4)} SOL since last refresh`}Ip.set(t,{value:c,at:Date.now()})}let u="";if(s){const d=Number(s.lastMovePct??s.wallets?.[0]?.lastMovePct),p=Number(s.takeProfitPct),f=Number(s.stopLossPct),y=Date.parse(s.sellAfterAt||s.wallets?.[0]?.sellAfterAt||""),g=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(p)&&p>0&&d>=p*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${p}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:g!==null&&g>0&&g<=10?u=`Timer exit in ~${g} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else zb(t)||e.source==="launch-optimistic"?u="⏳ Exits arming from your launch - TP/SL/timer registering...":u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${i(o.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${i(u)}</small>`:""}
    ${l?`<small class="${l.startsWith("▲")?"positive":"negative"}">${i(l)}</small>`:""}
  `}function Op(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",a=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),s=!!(e.viewOnly||e.source==="connected-wallet"),o=t?`${e.estimatedValueSol} SOL`:r?"updating":s?"tracking":"Price unavailable",c=a?e.openPnlSol:r?"updating":s?"realized only":"Price unavailable",l=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:s&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${mt(e)}
      <div class="row-main">
        <strong>${i(e.symbol||e.shortMint)}</strong>
        <span>${i(e.uiAmount)} tokens across ${i(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${i(e.name)}</small>`:""}
        <small>Value: ${i(o)} | PnL: ${i(c)}</small>
        ${Vw(e)}
        ${l?`<small class="${r?"muted-text":"warning-text"}">${i(l)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${i(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${i(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${i(e.tokenMint)}">Custom %</button>
        ${Ge(wg(e))}
        <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function fl(e=10,t=null){const a=Array.isArray(t)?t:n.pnl?.trades||[];return a.length?`
    <div class="live-trade-list">
      ${a.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${i(String(r.type||"").toUpperCase())} ${i(r.shortMint||w(r.tokenMint))}</strong>
          <span>${i(r.walletLabel||"wallet")} | ${i(r.solAmount||"0")} SOL</span>
          <small>${i(Se(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${i(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="live-trades">${i(wa())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:O("No live trade history yet","Submitted web trades will appear here after refresh.")}function zw(){const e=n.pnl?.trades||[],t=nt("liveTrades",e);return`
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
        ${fl(t.length||Ja("liveTrades"),t)}
        ${la("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${Uw(Vd())}
      </aside>
    </section>
  `}function Ep(){const e=Array.isArray(n.tradePlans)?n.tradePlans:[],t=[n.tradePlanResult,n.bundleResult,n.volumeResult,n.sniperResult,n.kolResult,n.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),a=e.length?e:t;return a.length?`
    <div class="table-list compact-table">
      ${a.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${i(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${i(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${i(r.status||"watching")} | Active wallets: ${i(r.activeWallets??"?")}/${i(r.walletCount??"?")} | TP ${i(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${i(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${i(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${i(Se(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${i(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(jw).join("")}</div>`:""}
          </div>
          <div class="card-actions compact">
            <button data-top-refresh-wallet>Refresh Status</button>
            <button data-run-trade-plans>${n.walletRefreshing?"Checking...":"Run TP/SL Check"}</button>
            <button data-tab="positions">Positions</button>
            ${r.tokenMint?`<button data-copy="${i(r.tokenMint)}">Copy CA</button>`:""}
            ${r.dexUrl?`<a class="button-like" href="${i(r.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:O("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function jw(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",a=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,s=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",o=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Kn(Qa(e.retryAfterAt))}`:"",l=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",p=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${i(e.label||"Wallet")}</strong>
        <span>${i(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${i(a)}${e.triggerKind?` / ${i(e.triggerKind)}`:""}</span>
        <small>Move ${i(s)}${i(o)} | checked ${i(Kn(Qa(t)))}${i(c)}</small>
        <small>${i(u)} | ${i(d)} | ${i(p)} | Source: ${i(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${i(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${i(e.sellSignature)}</small>`:""}
        ${l?`<small class="warning-text">Error: ${i(l)}</small>`:""}
      </div>
    </div>
  `}function Fp(){const e=n.balances.filter(a=>a.error),t=n.balances.reduce((a,r)=>a+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${i(Kn(Qa(n.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(a=>`<article class="row-card"><strong>${i(a.label||`Wallet ${a.index}`)}</strong><span>${i(a.error)}</span></article>`).join("")}
      </div>
    `:O("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Wp(e=!1){const t=n.terminalTxAudit;return`
    <section class="${e?"tx-audit compact":"terminal-layout tx-audit"}">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Tx Audit</h3>
            <p>Paste a Solana transaction signature to see finalized status, SOL/token deltas, created token accounts, programs, logs, and whether balances should refresh.</p>
          </div>
          <span>${n.terminalTxLoading?"Fetching":"Ready"}</span>
        </div>
        <div class="inline-action">
          <input data-tx-audit-signature type="text" placeholder="Solana transaction signature" value="${i(n.terminalTxSignature||"")}">
          <button class="primary" data-run-tx-audit>${n.terminalTxLoading?"Auditing...":"Audit Tx"}</button>
        </div>
        ${t?Gw(t):O("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${Ep()}${Fp()}</aside>`}
    </section>
  `}function Gw(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${i(e.error)}</span></article>`:`
    <section class="pnl-summary tx-summary">
      <div><span>Status</span><strong>${i(e.status||"unknown")}</strong></div>
      <div><span>Fee</span><strong>${i(e.feeSol||"0")} SOL</strong></div>
      <div><span>Slot</span><strong>${i(e.slot||"n/a")}</strong></div>
      <div><span>Refresh</span><strong>${e.shouldRefreshBalances?"Yes":"No"}</strong></div>
    </section>
    <div class="table-list compact-table">
      <article class="row-card"><strong>Fee payer</strong><code>${i(e.feePayer||"unknown")}</code></article>
      <article class="row-card"><strong>SOL deltas</strong><span>${(e.solDeltas||[]).map(t=>`${w(t.account)} ${t.deltaSol}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Token deltas</strong><span>${(e.tokenDeltas||[]).map(t=>`${w(t.owner||t.account)} ${t.deltaUiAmount} ${w(t.mint)}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Created token accounts</strong><span>${(e.createdAssociatedTokenAccounts||[]).map(t=>w(t.account)).join(", ")||"none detected"}</span></article>
      <article class="row-card"><strong>Programs</strong><span>${(e.programs||[]).join(", ")||"n/a"}</span></article>
      ${e.explorerUrl?`<article class="row-card"><strong>Explorer</strong><a href="${i(e.explorerUrl)}" target="_blank" rel="noreferrer">Open Solscan</a></article>`:""}
    </div>
    <details class="raw-log-panel">
      <summary>Raw logs</summary>
      <pre>${i((e.logs||[]).join(`
`)||"No logs returned.")}</pre>
    </details>
  `}function Xw(e=[]){const t=[...e].sort((a,r)=>Number(r.bestPickScore||r.score||0)-Number(a.bestPickScore||a.score||0)||Ze(a,r));return va(t,5,ya("cooks-best"),1)}function Ae(e){const t=Number(e);return Number.isFinite(t)?t:0}function _p(){const e=n.liveFeedCategory||"best";return No.find(([t])=>t===e)||No[0]}function Ta(e={}){return Qs(e)||Vp(e)||vl(e)||0}function hl(e={}){return Ae(e.buys5m)+Ae(e.buysH1)+Ae(e.sells5m)+Ae(e.sellsH1)}function Np(e={}){const t=Ae(e.buys5m)+Ae(e.buysH1),a=Ae(e.sells5m)+Ae(e.sellsH1),r=t+a;return r>0?t/r:.5}function br(e={}){return Math.max(Ae(e.m5),Ae(e.h1),Ae(e.h24))}function Xs(e={}){return Math.max(Ae(e.m5),Ae(e.h1))}function Ht(e={}){return Xs(e)*Math.log10(10+Ta(e))*(.5+Np(e))}function gl(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function Jw(e=[],t="best"){const a=[...e];switch(t){case"volume":return a.sort((r,s)=>Ta(s)-Ta(r));case"liquidity":return a.sort((r,s)=>pt(s)-pt(r));case"marketcap":return a.sort((r,s)=>dt(s)-dt(r));case"active":return a.sort((r,s)=>hl(s)-hl(r));case"fresh":return a.sort(Ze);case"gainers":return a.sort((r,s)=>br(s)-br(r));default:return a.sort((r,s)=>Ae(s.bestPickScore||s.score)-Ae(r.bestPickScore||r.score)||Ze(r,s))}}function Yw(){const e=n.liveTerminalCategory||"dexTrending";return Ha.find(([t])=>t===e)||Ha[0]}function Qw(e,t,a,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${i(r)}</span>
      <select ${a} aria-label="${i(r)} category">
        ${e.map(([s,o])=>`<option value="${s}"${s===t?" selected":""}>${i(o)}</option>`).join("")}
      </select>
    </label>`}function Zw(){if(n.activeTab==="terminal"){const t=Yw();return{categories:Ha,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:a=>qp(a,t[0]),hasBest:!1}}const e=_p();return{categories:No,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>Jw(t,e[0]),hasBest:e[0]==="best"}}function eS(e={}){if(gl(e))return{cls:"boost",text:"⚡ Boosted"};const t=br(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const a=Number(e.pairAgeMinutes);return Number.isFinite(a)&&a>=0&&a<=10?{cls:"fresh",text:"✨ Fresh"}:Xs(e)>=25?{cls:"hot",text:"🔥 Hot"}:Np(e)>=.7&&hl(e)>=24?{cls:"active",text:"● Active"}:null}function bl(e={}){const t=eS(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${i(t.text)}</span>`:""}function Dp(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function tS(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return Dp(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Up(){const e=n.cookSpotCategory||"dexTrending";return Ha.find(([t])=>t===e)||Ha[0]}function qp(e=[],t="dexTrending"){const a=[...e];switch(t){case"fresh":return a.sort(Ze);case"dexBoosted":{const r=a.filter(gl).sort((o,c)=>Ta(c)-Ta(o)),s=a.filter(o=>!gl(o)).sort((o,c)=>Ht(c)-Ht(o));return[...r,...s]}case"pumpTrending":{const r=a.filter(Dp);return(r.length?r:a).sort((s,o)=>Ht(o)-Ht(s))}case"memeMovers":{const r=a.filter(tS);return(r.length?r:a).sort((s,o)=>br(o)-br(s))}case"earlyMomentum":{const r=a.filter(s=>{const o=Number(s.pairAgeMinutes);return!Number.isFinite(o)||o<=180});return(r.length?r:a).sort((s,o)=>Xs(o)-Xs(s))}case"graduating":{const r=a.filter(s=>Us(s)||qs(s)==="graduating");return(r.length?r:a).sort((s,o)=>Ht(o)-Ht(s))}case"graduated":{const r=a.filter(s=>bn(s)||qs(s)==="graduated");return(r.length?r:a).sort((s,o)=>Ta(o)-Ta(s))}default:return a.sort((r,s)=>Ht(s)-Ht(r))}}function aS(e=Up()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${Ha.map(([a,r])=>`<option value="${a}"${a===t?" selected":""}>${i(r)}</option>`).join("")}
      </select>
    </label>`}function Hp(e=0,t=""){const a=Qa(t),r=a===null?"live":Kn(a);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${i(r)}</span></div>`}function yl(e=[]){const t=Zw(),a=Qw(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',s=Hp(e.length,ca()),o={context:"live",shareBuilder:Aa,hideToolbar:!0};if(t.hasBest){const l=Xw(e),u=new Set(l.map(ba).filter(Boolean)),d=[...e].sort(Ze).filter(f=>!u.has(ba(f))),p=nt("live",d);return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>Top ${l.length} · rotating each refresh</span>${r}</div>
        ${l.length?ut(l,o):O("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${p.length?ut(p,o):O("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=nt("live",t.rank(e));return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>${i(t.sub)}</span>${r}</div>
        ${c.length?ut(c,o):O("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function Kp(){const e=Ne(),t=ye(e?.rows||[]),a=hn(t),r=nt("live",a),s=Bt.find(([f])=>f===n.livePairBucket)?.[1]||"Live",o=ca(),c=!!n.livePairsLoadingByBucket[n.livePairBucket],l=fn(),u=n.livePairsRefreshErrorByBucket?.[n.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",p=a.length?yl(a):l?mr(t,`${s.toLowerCase()} pairs`):u?O("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?O("Loading live pairs…","Scanning fresh pairs for this time window."):O("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Bt.map(([f,y])=>{const g=n.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(g))?` (${g})`:"";return`<button data-live-pair-bucket="${f}" data-active="${n.livePairBucket===f}">${y}${S}</button>`}).join("")}
        </div>
        ${sl("live",{rawCount:t.length,visibleCount:a.length})}
        ${rl(t,a)}
        ${Ri("live")}
        ${p}
        ${la("live",a,`${s} pairs`)}
      </main>
    </section>
  `}function d0(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function nS(){if(!n.user||!n.token)return`${en()}${O("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=n.watchlist?.rows||[],t=nt("watchlist",e);return`
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
          <button class="primary" data-refresh-watchlist>${n.watchlistLoading?"Refreshing...":"Refresh Watchlist"}</button>
          <button data-tab="live">Cooks</button>
          <button data-tab="sniper">Sniper</button>
          <button data-tab="kol">KOL Tracker</button>
        </div>
        ${t.length?ut(t,{context:"watchlist",shareBuilder:a=>ki(a.tokenMint)}):O("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
        ${la("watchlist",e,"watched pairs")}
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
  `}function p0(e){return ut(e,{context:"live",shareBuilder:Aa})}function ut(e,t={}){const a=t.shareBuilder||Aa,r=ye(e),s=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":Ri(t.context||"scanner")}
    <div class="${i(s)}">
      <div class="signal-header">
        <span>Pair Info</span>
        <span>Age</span>
        <span>Current Liquidity</span>
        <span>FDV / MC</span>
        <span>Txns</span>
        <span>Volume</span>
        <span>Action</span>
      </div>
      ${r.map((o,c)=>rS(o,c,{...t,shareText:a(o),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":Ri(t.context||"scanner")}
      ${O(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function rS(e,t,a={}){const r=Js(e.tokenMint),s=a.shareText||Aa(e),o=a.primaryActionLabel||"Trade",c=a.primaryAction||"quickTrade",l=a.context==="kol",u=a.context==="watchlist"?`<button type="button" data-unwatch-token="${i(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(Ys(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-row")}">
      <div class="signal-token">
        ${mt(e,{priority:!!a.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-title")}">${i(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${i(e.name||e.category||"Token")}</small>
            ${l?"":bl(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${i(e.tokenMint)}">${i(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${i(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${i(s)}" title="Share to X">SHARE</button>
            ${Pu(s,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(e.sniperCount)}</span>`:""}
          </div>
          ${tw(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${i(e.pairAgeLabel||Kt(e)||"age unknown")}</span><small>${i(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${i(_(e.liquidityLabel,pt(e)>0?B(pt(e)):"","checking"))}</span><small>${sS(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${i(_(e.marketCapLabel,dt(e)>0?B(dt(e)):"","checking"))}</span><small>${i(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${i(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${i(Qv(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${i(_(e.volumeH1Label,e.volumeLabel,Qs(e)>0?B(Qs(e)):"","checking"))}</span>
        <small>${sp(e).map(([d,p])=>`${d} ${p}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${i(e.tokenMint)}" title="Snipe buy">${i(o)}</button>`:`<button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(a.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(a.context||"signal-row")}" title="Quick buy with preset or custom SOL">${i(wa())}</button>`}
        <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${l?hd(e):""}
        ${u}
        ${rp(e)}
      </div>
    </article>
  `}function Js(e){const t=String(e||"");return!!(n.watchlist?.rows||[]).some(a=>String(a.tokenMint)===t)}function Kt(e){const t=Ds(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function sS(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const a=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${a}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function Ys(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{},o=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,a.imageUrl,a.image,a.logoURI,a.logo,a.iconUrl,a.info?.imageUrl,a.baseToken?.imageUrl,a.baseToken?.logoURI,s.imageUrl,s.image,s.logoURI,s.logo,o.imageUrl,o.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const l of c){const u=st(l);if(u)return u}return""}function dt(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{};return E(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,a.marketCap,a.marketCapUsd,a.market_cap,a.fdv,a.fdvUsd,a.baseToken?.marketCap,a.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,s.marketCap,s.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function pt(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.liquidity||{};return E(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,s.usd,s.quote,a.liquidityUsd,a.liquidity_usd,a.liquidity?.usd,a.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function vl(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return E(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,s.m15,s.m15m,s.m5,s.h1,a.volume?.m15,a.volume?.m5,a.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Qs(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return E(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,s.h1,s.m30,s.m15,a.volume?.h1,a.volume?.m30,a.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function Vp(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return E(e.volumeH24,e.volume24h,e.volume_h24,s.h24,s.d1,a.volume?.h24,a.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function mt(e,t={}){const a=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=Ys(e),s=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),o=`token:${String(s||e.symbol||a).trim().toLowerCase()}`,c=D("tokenAvatarFixEnabled",!0),l=String(e.avatarState||"").trim().toLowerCase(),u=l==="missing"||l==="failed",d=!!e.avatarUrl&&(!l||l==="ready"),p=s&&!u?st(xg(e)):"",f=c?Ti(o,d?e.avatarUrl:"",p,u?"":r):Ti(o,p,r),y=c&&!u?p&&f!==p?p:r&&r!==f?r:"":"",g=!!t.priority,S=g?"eager":"lazy",A=g?"high":"low",T=l||(f?"ready":"missing");if(f){const b=y?` data-backup-src="${i(y)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${i(T)}"><img src="${i(f)}"${b} data-avatar-src="${i(f)}" data-avatar-key="${i(o)}" alt="${i(e.symbol||e.name||"Token")}" loading="${S}" decoding="sync" fetchpriority="${A}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${i(a)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${i(T)}"><span>${i(a)}</span></div>`}function oS(e=""){const t=String(e||"");let a=0;for(let r=0;r<t.length;r+=1)a+=t.charCodeAt(r);return a%5+1}function wl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${oS(e)}.png`}function Aa(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Kt(e)||"age unknown"}.`}function iS(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([a])=>a===n.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${i(lS(n.scanMode))}</p>
          </div>
          <span>${i(t)}</span>
        </div>
        <div class="mode-row terminal-modes">
          ${e.map(([a,r])=>`<button data-scan-mode="${a}" data-active="${n.scanMode===a}">${r}</button>`).join("")}
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-scan>Refresh ${i(t)}</button>
          <button data-tab="trade">Trade Desk</button>
          <button data-tab="bundle">Bundle</button>
          <button data-tab="live">Cooks</button>
        </div>
        ${n.scan?dS():O("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${cS()}
      </aside>
    </section>
  `}function lS(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function cS(){if(!n.wallets.length)return O("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=n.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${wt("sniper")}
        </div>
        ${Nt("sniper")}
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
            ${Xe("sniper-delay","data-sniper-delay",e?"3":"5")}
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
            ${as("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:rs("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${rn({toolKey:"sniperSetup",activeKey:sn("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${n.sniperResult?i(n.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${uS()}
    </section>
  `}function uS(){const e=n.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function dS(){const e=n.scan.rows||[],t=nt("sniper",e);return e.length?`
    <p class="scan-meta">${i(n.scan.label)} | ${t.length}/${e.length} shown | scored ${n.scan.scanned} | qualified ${n.scan.qualified} | mode-fit ${n.scan.modeFit} | display pool ${n.scan.displayPool||0}</p>
    ${ut(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Sg})}
    ${la("sniper",e,"snipe candidates")}
  `:O("No usable picks","Refresh again or choose a different mode.")}function Zs(){return n.user?.connectedWallet?.publicKey||""}function zp(){return n.ogreTek.markets.find(e=>e.symbol===n.ogreTek.selectedMarket)||n.ogreTek.markets[0]||null}function pS(){return{marketSymbol:n.ogreTek.selectedMarket,direction:n.ogreTek.direction,orderType:n.ogreTek.orderType,collateralUsd:n.ogreTek.collateralUsd,leverage:n.ogreTek.leverage,slippagePct:n.ogreTek.slippagePct,priorityFeeLamports:n.ogreTek.priorityFeeLamports,limitPrice:n.ogreTek.limitPrice,stopPrice:n.ogreTek.stopPrice}}function jp(){return xm(pS(),zp(),n.ogreTek.account,$e)}function we(e,t=2){const a=Number(e);return Number.isFinite(a)?Math.abs(a)>=1e9?`$${(a/1e9).toFixed(2)}B`:Math.abs(a)>=1e6?`$${(a/1e6).toFixed(2)}M`:Math.abs(a)>=1e3?`$${(a/1e3).toFixed(1)}K`:`$${a.toFixed(t)}`:"n/a"}function ft(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function eo(e,t=3){const a=Number(e);return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(t)}%`:"n/a"}function Gp(e){const t=Date.parse(e||"");if(!t)return"not loaded";const a=Math.max(0,Math.round((Date.now()-t)/1e3));return a<60?`${a}s ago`:`${Math.round(a/60)}m ago`}function to(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in n.ogreTek)||(e.type==="checkbox"?n.ogreTek[t]=!!e.checked:n.ogreTek[t]=e.value)})}async function mS(){!$e.enabled||n.ogreTek.loading||n.ogreTek.markets.length||n.ogreTek.error||await yr({silent:!0}).catch(e=>{n.ogreTek.error=N(e.message),h({force:!0})})}async function yr({force:e=!1,silent:t=!1}={}){if($e.enabled&&!(n.ogreTek.loading&&!e)){n.ogreTek.loading=!0,n.ogreTek.error="",t||h({force:!0});try{const a=Zs(),[r,s,o,c]=await Promise.all([Sr.getMarkets(),Sr.getAccount(a),Sr.getPositions(a),Sr.getOpenOrders(a)]);n.ogreTek.markets=r||[],n.ogreTek.account=s||null,n.ogreTek.positions=o||[],n.ogreTek.orders=c||[],n.ogreTek.markets.some(l=>l.symbol===n.ogreTek.selectedMarket)||(n.ogreTek.selectedMarket=n.ogreTek.markets[0]?.symbol||"SOL-PERP"),n.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(a){n.ogreTek.error=N(a.message)}finally{n.ogreTek.loading=!1,h({force:!0})}}}function fS(){return`
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
  `}function hS(){if(Pm($e)!=="enabled")return fS();const e=!!Zs(),t=zp(),a=jp(),r=a.quote,s=n.ogreTek.account,o=a.ok&&!n.ogreTek.loading,c=n.ogreTek.error?"Provider Error":n.ogreTek.loading?"Loading":"Ready",l=$e.demoMode?"Review Demo Trade":"Review Trade",u=$e.demoMode?"Confirm Demo Review":"Confirm Order",d=$e.demoMode?!n.ogreTek.riskAccepted||!a.ok:!Tm({validation:a,riskAccepted:n.ogreTek.riskAccepted,demoMode:$e.demoMode});return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${$e.demoMode?"Demo Mode":"Live Adapter"}</span>
          <span class="slime-status-badge" data-ok="${e?"true":"false"}">${e?"Wallet Connected":"Wallet Disconnected"}</span>
          <span class="slime-status-badge" data-ok="${n.ogreTek.error?"false":"true"}">${i(c)}</span>
        </div>
      </article>

      <article class="ogre-risk-copy">
        Perpetual futures are leveraged derivatives. You can lose your collateral and may be liquidated. This interface does not provide financial advice.
      </article>

      ${n.ogreTek.error?`<p class="error dashboard-error">${i(n.ogreTek.error)}</p>`:""}

      <section class="ogre-tek-grid">
        <div class="ogre-tek-main">
          <article class="slime-panel ogre-market-panel">
            <div class="panel-title-row">
              <div>
                <h3>Perps Markets</h3>
                <p>${i(n.ogreTek.status||"Demo market data loads when the tab opens.")}</p>
              </div>
              <button type="button" data-ogre-tek-refresh>${n.ogreTek.loading?"Refreshing...":"Refresh"}</button>
            </div>
            ${gS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${n.ogreTek.positions.length} open</span>
            </div>
            ${yS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${vS()}
          </article>
        </div>

        <aside class="ogre-tek-side">
          <article class="slime-panel ogre-ticket">
            <h3>Trading Ticket</h3>
            <div class="ogre-ticket-tabs">
              <button type="button" data-ogre-tek-side="long" data-active="${n.ogreTek.direction==="long"}">Long</button>
              <button type="button" data-ogre-tek-side="short" data-active="${n.ogreTek.direction==="short"}">Short</button>
            </div>
            <label>
              Market
              <select data-ogre-tek-field="selectedMarket">
                ${n.ogreTek.markets.map(p=>`<option value="${i(p.symbol)}" ${p.symbol===n.ogreTek.selectedMarket?"selected":""}>${i(p.symbol)}</option>`).join("")}
              </select>
            </label>
            <label>
              Order Type
              <select data-ogre-tek-field="orderType">
                ${["market","limit","stop","take-profit","stop-loss"].map(p=>`<option value="${p}" ${n.ogreTek.orderType===p?"selected":""}>${i(p.replace("-"," ").toUpperCase())}</option>`).join("")}
              </select>
            </label>
            <div class="ogre-ticket-grid">
              <label>
                Collateral USD
                <input data-ogre-tek-field="collateralUsd" type="number" min="0" step="1" value="${i(n.ogreTek.collateralUsd)}">
              </label>
              <label>
                Leverage
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${i($e.maxLeverage)}" step="0.5" value="${i(n.ogreTek.leverage)}">
                <span>${i(n.ogreTek.leverage)}x max ${i($e.maxLeverage)}x</span>
              </label>
              <label>
                Limit Price
                <input data-ogre-tek-field="limitPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${i(n.ogreTek.limitPrice)}">
              </label>
              <label>
                Stop / Trigger
                <input data-ogre-tek-field="stopPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${i(n.ogreTek.stopPrice)}">
              </label>
              <label>
                Slippage %
                <input data-ogre-tek-field="slippagePct" type="number" min="0" max="10" step="0.1" value="${i(n.ogreTek.slippagePct)}">
              </label>
              <label>
                Priority Fee
                <input data-ogre-tek-field="priorityFeeLamports" type="number" min="0" step="1000" value="${i(n.ogreTek.priorityFeeLamports)}">
              </label>
            </div>
            ${bS(r,t)}
            ${Xp(a)}
            <button class="primary" type="button" data-ogre-tek-review ${o?"":"disabled"}>${i(l)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${wS(s)}
          </article>
        </aside>
      </section>
      ${n.ogreTek.reviewOpen?SS({validation:a,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function gS(){return n.ogreTek.loading&&!n.ogreTek.markets.length?O("Loading markets","Ogre Tek is loading demo perps markets."):n.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${n.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${i(e.symbol)}" data-active="${e.symbol===n.ogreTek.selectedMarket}">
          <span>${i(e.symbol)}</span>
          <strong>${ft(e.indexPrice)}</strong>
          <small>Oracle ${ft(e.oraclePrice)} | 24h ${eo(e.change24hPct,2)}</small>
          <small>Funding ${eo(e.fundingRatePct,3)} | OI ${we(e.openInterestUsd,0)}</small>
          <small>Fresh ${i(Gp(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:O("No markets available","No allowed perps markets are available for this provider.")}function bS(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${ft(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${we(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${ft(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${we(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${we(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${we(e?.maxLossUsd)}</strong></span>
    </div>
  `}function Xp(e){const t=e.errors||[],a=e.warnings||[];return!t.length&&!a.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${i(r)}</p>`).join("")}
      ${a.map(r=>`<p data-kind="warning">${i(r)}</p>`).join("")}
    </div>
  `}function yS(){return Zs()?n.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${n.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.side)} | margin ${eo(e.marginRatioPct,1)}</small></span>
          <span>${we(e.sizeUsd)}<small>collateral ${we(e.collateralUsd)}</small></span>
          <span>${ft(e.entryPrice)}<small>mark ${ft(e.markPrice)}</small></span>
          <span>${ft(e.liquidationPrice)}</span>
          <span data-positive="${Number(e.unrealizedPnlUsd)>=0}">${we(e.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `:O("No open positions","Mock positions will appear here when the provider reports them."):O("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function vS(){return Zs()?n.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${n.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.type)} ${i(e.side)}</small></span>
          <span>${ft(e.triggerPrice)}</span>
          <span>${we(e.sizeUsd)}</span>
          <span>${i(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:O("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):O("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function wS(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${we(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${we(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${we(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${i(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${we(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${i(e.maxLeverageAllowed||$e.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${i(Gp(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function SS({validation:e,quote:t,market:a,confirmButtonText:r,confirmDisabled:s}){const o=e.order||{};return`
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
          <span><small>Direction</small><strong>${i(o.direction||"long")}</strong></span>
          <span><small>Market</small><strong>${i(o.marketSymbol||a?.symbol||"n/a")}</strong></span>
          <span><small>Collateral</small><strong>${we(o.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${i(o.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${ft(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${ft(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${we(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${eo(a?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${we(t?.maxLossUsd)}</strong></span>
        </div>
        ${Xp(e)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${n.ogreTek.riskAccepted?"checked":""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${s?"disabled":""}>${i(r)}</button>
        </div>
      </article>
    </div>
  `}function Jp(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const Sl="slimewire:ogreAgentMessages:v1",kl="slimewire:ogreAgentLastToken:v1";function kS(){try{const e=JSON.parse(localStorage.getItem(Sl)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function $S(){try{localStorage.setItem(Sl,JSON.stringify(vn().slice(-50)))}catch{}}function Vt(){if(n.ogreAgentLastTokenMint)return String(n.ogreAgentLastTokenMint);try{n.ogreAgentLastTokenMint=String(localStorage.getItem(kl)||"").trim()}catch{n.ogreAgentLastTokenMint=""}return n.ogreAgentLastTokenMint||""}function ao(e=""){const t=String(e||"").trim();if(!t)return"";n.ogreAgentLastTokenMint=t;try{localStorage.setItem(kl,t)}catch{}return t}function vn(){if(!Array.isArray(n.ogreAgentMessages)||!n.ogreAgentMessages.length){const e=kS();n.ogreAgentMessages=e.length?e:[Jp()]}return n.ogreAgentMessages}function TS(){const e=String(n.smartChartToken||n.tradeToken||Vt()||"").trim(),t=e?Sa(e):null,a=t?.tokenMint?Qe(t):null,r=e?Tp(e):null,s=e?cl(e):null,o=ps().slice(0,3),c=e?rt().find(l=>String(l.tokenMint||"")===e):null;return{route:n.route,activeTab:n.activeTab,agentFastMode:n.ogreAgentFastMode,agentAutoTradeApproved:oo(),lastTokenMint:Vt(),recentAgentMessages:vn().slice(-8).map(l=>({role:l.role==="user"?"user":"assistant",text:String(l.text||"").slice(0,600)})),smartChartToken:n.smartChartToken||"",tradeToken:n.tradeToken||"",livePairBucket:n.livePairBucket||"",slimeScopeMode:n.slimeScopeMode||"",walletConnected:!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey),walletCount:ii(),positionCount:rt().length,totalSol:Ft().toFixed(4),selectedTradePreset:mn("trade"),selectedBundlePreset:mn("bundle"),quickBuyAmount:String(Pl()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:Js(e)}:null,slimeShield:a?{verdict:a.verdict,summary:a.summary,confidence:a.confidence,suggestedAction:a.suggestedAction,topFactors:(a.factors||[]).slice(0,4).map(l=>l.message||l.label||l.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:o.length?o.map(l=>({displayName:l.displayName,riskLabel:l.riskLabel,dumpRiskPercent:l.lowData?null:l.dumpRiskPercent,lowData:!!l.lowData,summary:tr(l)})):[],replayBeforeBuy:s?{sampleSize:s.sampleSize,confidence:s.confidence,winRatePercent:s.winRatePercent,medianMaxDrawdownPercent:s.medianMaxDrawdownPercent,summary:s.summary}:null,pnlSummary:{realized:li(),positions:rt().length,totalSol:Ft().toFixed(4)},profile:{hasReferralCode:!!n.user?.referralCode,referralCode:n.user?.referralCode||"",hasReferralPayoutWallet:!!n.user?.referralPayoutWallet,hasXHandle:!!(n.xHandle||n.user?.xHandle),traderBoardEnabled:n.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:Yp()}}function Yp(){const e=[],t=new Set,a=(r,s="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(l=>a(l,s));return}if(Array.isArray(r.rows)){r.rows.forEach(l=>a(l,s));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(l=>a(l,s));return}if(typeof r!="object")return;const o=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!o)return;const c=o.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:o,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:s}))};return a(n.livePairRows,"live-pairs"),a(n.slimeScopeRows,"slime-scope"),a(n.livePairs,"live-pairs"),Object.values(n.livePairsByBucket||{}).forEach(r=>a(r,"bucket")),Object.values(n.terminalFeeds||{}).forEach(r=>a(r,"terminal-feed")),e.sort((r,s)=>Qp(s)-Qp(r)).slice(0,24)}function Qp(e={}){const t=T=>Number.isFinite(Number(T))?Number(T):0,a=t(e.ageMinutes),r=t(e.marketCap),s=t(e.liquidityUsd),o=t(e.volume5m),c=t(e.volume1h),l=Math.max(o,c*.18),u=a>0?Math.max(0,90-Math.min(a,360))/2.5:12,d=a>120?Math.min(42,(a-120)/4):0,p=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?l/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:l>0?2:-18,g=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,A=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+p+y+Math.log10(1+o+c)*7+Math.log10(1+s)*3+g+S-A-d}function AS(e={}){return String(e.label||e.type||"Run").slice(0,40)}function PS(e={},t=0){const a=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${i(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${i(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${a.length?`<div class="ogre-agent-actions">${a.map((s,o)=>`<button type="button" data-ogre-agent-action="${t}:${o}">${i(AS(s))}</button>`).join("")}</div>`:""}
    </div>
  `}function CS(){const e=!!(n.ogreAgentLoading||n.ogreAgentSpeaking),t=!!n.ogreAgentListening,a=!!n.ogreAgentVoiceEnabled;return`
    <div class="ogre-agent-holo ${e?"is-talking":""} ${t?"is-listening":""} ${a?"voice-on":"voice-off"}" aria-hidden="true">
      <div class="ogre-agent-holo-stage">
        <span class="ogre-agent-holo-ring ring-one"></span>
        <span class="ogre-agent-holo-ring ring-two"></span>
        <img src="./assets/slimewire/png/slimewire-ogre-hero-cutout.png" loading="lazy" decoding="async" alt="">
        <span class="ogre-agent-holo-mouth"></span>
        <span class="ogre-agent-holo-scan"></span>
      </div>
      <div class="ogre-agent-holo-meta">
        <strong>${t?"Ogre listening":e?"Ogre talking":"Ogre online"}</strong>
        <small>${t?"Speak your command":a?"Voice ready":"Visual mode"}</small>
      </div>
    </div>
  `}function LS(){const e=!!n.ogreAgentOpen,t=vn(),a=n.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=am(),s=n.ogreAgentListening?"Stop":"Mic";return`
    <div class="ogre-agent-shell ${e?"is-open":""} ${n.ogreAgentLoading?"loading":""} ${n.ogreAgentSpeaking?"speaking":""} ${n.ogreAgentListening?"listening":""}" data-ogre-agent-root>
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
            <button type="button" class="ogre-agent-voice-toggle" data-ogre-agent-voice aria-pressed="${n.ogreAgentVoiceEnabled?"true":"false"}">${i(a)}</button>
            <button type="button" data-ogre-agent-close aria-label="Close Ogre Agent">Close</button>
          </div>
        </header>
        ${e?CS():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(PS).join("")}
          ${n.ogreAgentLoading?'<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>':""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL...">${i(n.ogreAgentDraft||"")}</textarea>
          <div class="ogre-agent-composer-actions">
            <button type="button" class="ogre-agent-mic ${n.ogreAgentListening?"is-listening":""}" data-ogre-agent-mic title="${r?"Tap, speak, and Ogre will send it.":"Tap to check microphone support."}">${i(s)}</button>
            <button type="button" data-ogre-agent-send ${n.ogreAgentLoading?"disabled":""}>Send</button>
          </div>
        </div>
        <div class="ogre-agent-quick-actions" aria-label="Ogre Agent quick actions">
          <button type="button" data-ogre-agent-quick="whats_cooking">What's cooking?</button>
          <button type="button" data-ogre-agent-quick="my_bags">My bags</button>
          <button type="button" data-ogre-agent-quick="risk">Why Risk?</button>
          <button type="button" data-ogre-agent-quick="clear_chat">Clear</button>
        </div>
        <small class="ogre-agent-disclaimer">AI can make mistakes. Always review wallet prompts before signing.</small>
        ${n.ogreAgentStatus?`<small class="ogre-agent-status">${i(n.ogreAgentStatus)}</small>`:""}
      </section>
    </div>
  `}function F({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const a=t.querySelector("[data-ogre-agent-input]"),r=!!(a&&document.activeElement===a),s=r?a.selectionStart:null,o=r?a.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),l=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;a&&(n.ogreAgentDraft=a.value);const d=Array.isArray(n.ogreAgentMessages)?n.ogreAgentMessages:[],p=d[d.length-1]||{},f=[n.ogreAgentOpen?"open":"closed",n.ogreAgentLoading?"loading":"idle",n.ogreAgentStatus||"",d.length,p.role||"",p.text||"",Array.isArray(p.actions)?p.actions.length:0,n.ogreAgentVoiceEnabled?"voice-on":"voice-off",n.ogreAgentSpeaking?"speaking":"silent",n.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=LS(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),so()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=n.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),s!==null&&o!==null&&y.setSelectionRange(s,o),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const g=t.querySelector("[data-ogre-agent-feed]");g&&(e||u||n.ogreAgentLoading?g.scrollTop=g.scrollHeight:g.scrollTop=Math.min(l,Math.max(0,g.scrollHeight-g.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function de(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};n.ogreAgentMessages=[...vn(),t].slice(-50),$S(),t.role==="assistant"&&em(t.text||"")}function $l(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function xS(){if(!$l())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=a=>{const r=`${a.name||""} ${a.voiceURI||""}`.toLowerCase(),s=String(a.lang||"").toLowerCase();let o=0;return(/^en[-_]/.test(s)||s==="en")&&(o+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(o+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(o+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(o-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(o-=25),a.localService&&(o+=3),o};return e.slice().sort((a,r)=>t(r)-t(a))[0]||e[0]||null}let wn=null;function MS(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!wn||wn.state==="closed")&&(wn=new e),wn.state==="suspended"&&wn.resume(),wn}catch{return null}}function Zp(e="reply"){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen)return;const t=MS();if(t)try{const a=t.currentTime,r=e==="online"?.22:.34,s=t.createGain(),o=t.createBiquadFilter(),c=t.createOscillator(),l=t.createOscillator(),u=t.createGain();s.gain.setValueAtTime(1e-4,a),s.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,a+.035),s.gain.exponentialRampToValueAtTime(1e-4,a+r),o.type="lowpass",o.frequency.setValueAtTime(210,a),o.frequency.exponentialRampToValueAtTime(92,a+r),o.Q.setValueAtTime(5.2,a),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,a),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,a+r),l.type="sine",l.frequency.setValueAtTime(e==="online"?45:38,a),l.frequency.exponentialRampToValueAtTime(e==="online"?35:31,a+r),u.gain.setValueAtTime(.18,a),u.gain.exponentialRampToValueAtTime(1e-4,a+r),c.connect(o),o.connect(s),l.connect(u),u.connect(s),s.connect(t.destination),c.start(a),l.start(a),c.stop(a+r+.02),l.stop(a+r+.02)}catch{}}function Tt(e=!1){n.ogreAgentSpeaking=!!e,n.ogreAgentOpen&&F({force:!0})}function no(){if(!$l()){Tt(!1);return}try{window.speechSynthesis.cancel()}catch{}Tt(!1)}function BS(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function em(e=""){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen||!$l()){Tt(!1);return}const t=BS(e);if(!t){Tt(!1);return}try{window.speechSynthesis.cancel();const a=new window.SpeechSynthesisUtterance(t),r=xS();r&&(a.voice=r),a.pitch=.72,a.rate=.86,a.volume=1,a.onstart=()=>Tt(!0),a.onend=()=>Tt(!1),a.onerror=()=>Tt(!1),Tt(!0),Zp("reply"),window.speechSynthesis.speak(a)}catch{Tt(!1)}}function RS(e){n.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",n.ogreAgentVoiceEnabled?"on":"off")}catch{}n.ogreAgentVoiceEnabled?(n.ogreAgentStatus="Ogre voice on.",Zp("online"),em("Ogre voice online.")):(no(),n.ogreAgentStatus="Ogre voice muted."),F({force:!0})}function tm(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function am(){return!!tm()}async function nm(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function rm(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();n.ogreAgentDraft=t;const a=document.querySelector("[data-ogre-agent-input]");if(a){a.value=t;try{a.focus({preventScroll:!0}),a.setSelectionRange(t.length,t.length)}catch{}}}function ro(){Zt&&(clearTimeout(Zt),Zt=null),Ea&&(clearTimeout(Ea),Ea=null)}function sm(e,t=n.ogreAgentSpeechRecognizer){Ea&&clearTimeout(Ea),Ea=setTimeout(()=>{e!==tt||n.ogreAgentSpeechRecognizer!==t||zt("Mic timed out instead of staying open. Tap Mic again or type the command.")},zm)}function zt(e=""){tt+=1,ro();const t=n.ogreAgentSpeechRecognizer;if(n.ogreAgentSpeechRecognizer=null,n.ogreAgentListening=!1,n.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(n.ogreAgentStatus=e),n.ogreAgentOpen&&F({force:!0})}async function IS(){if(!am()){const o=await nm();n.ogreAgentStatus=o==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",F({force:!0});return}n.ogreAgentLoading&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),no(),zt();const e=tt;n.ogreAgentStatus="Checking microphone permission...",F({force:!0});const t=await nm();if(e!==tt||!n.ogreAgentOpen)return;if(t==="denied"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",F({force:!0});return}if(t==="unavailable"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="No microphone is available to this browser. Typing still works.",F({force:!0});return}const a=tm(),r=new a,s=++tt;n.ogreAgentSpeechRecognizer=r,n.ogreAgentListening=!0,n.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||n.ogreAgentDraft||"").trim(),n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Opening microphone...",F({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Zt=setTimeout(()=>{s!==tt||n.ogreAgentSpeechRecognizer!==r||zt("Mic did not start. Check browser permission, then tap Mic again.")},Vm),r.onstart=()=>{s!==tt||n.ogreAgentSpeechRecognizer!==r||(Zt&&(clearTimeout(Zt),Zt=null),n.ogreAgentListening=!0,n.ogreAgentStatus="Listening... speak your Ogre command.",sm(s,r),F({force:!0}))},r.onresult=o=>{if(s!==tt||n.ogreAgentSpeechRecognizer!==r)return;sm(s,r);let c="",l="";for(let d=o.resultIndex||0;d<o.results.length;d+=1){const p=String(o.results[d]?.[0]?.transcript||"");o.results[d]?.isFinal?l+=` ${p}`:c+=` ${p}`}l.trim()&&(n.ogreAgentSpeechFinal=`${n.ogreAgentSpeechFinal||""} ${l}`.replace(/\s+/g," ").trim());const u=[n.ogreAgentSpeechBaseDraft,n.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();rm(u)},r.onerror=o=>{if(s!==tt||n.ogreAgentSpeechRecognizer!==r)return;ro();const c=String(o?.error||"");n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",F({force:!0})},r.onend=()=>{if(s!==tt||n.ogreAgentSpeechRecognizer!==r)return;ro();const o=String(n.ogreAgentDraft||"").trim(),c=!!(o&&n.ogreAgentSpeechFinal&&!n.ogreAgentLoading);n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",F({force:!0}),c&&setTimeout(()=>{rm(o),ht()},100)};try{r.start()}catch{ro(),n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic could not start. Typing still works.",F({force:!0})}}function OS(){n.ogreAgentListening||n.ogreAgentSpeechRecognizer?zt("Voice input stopped."):IS()}function so(){n.ogreAgentOpen=!1,n.ogreAgentStatus="",n.ogreAgentLoading=!1,n.ogreAgentRequestId="",zt(),no(),F({force:!0})}function ES(e=""){const[t,a]=String(e).split(":");return vn()[Number(t)]?.actions?.[Number(a)]||null}function om(){return Array.isArray(n.wallets)&&n.wallets.length>0}function im(){return!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.walletPublicKey||n.connectedWalletPublicKey)}function oo(){return!!(!lm()&&(n.ogreAgentAutoTradeApproved||om()||im()))}function FS(e="wallet-sync"){return lm()?!1:om()||im()?(Al(!0),!0):(Tl(),!1)}function lm(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Tl(){n.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function Al(e,t={}){n.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),n.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function cm(e){n.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",n.ogreAgentFastMode?"on":"off")}catch{}}function At(e=""){const t=String(e||"").toLowerCase(),a=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),s=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return a?"buy":r||s?"sell":""}function WS(e=""){const t=String(e||"").toLowerCase(),a=At(t);if(!a||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),s=a==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),o=!!(Vt()||n.smartChartToken||n.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||a==="buy"&&o&&/\b(just\s+)?buy\b/.test(t);return!!(s&&c&&!r)}function _S(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return a?Number(a):0}function Pl(){const e=typeof ct=="function"?ct():null,t=Number(n.quickBuyAmountOverride||(typeof He=="function"?He(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function NS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=s?Math.round(Number(s)*100):0,c=[];return a&&c.push(`TP +${a}%`),r&&c.push(`SL -${r}%`),s&&c.push(`slippage ${s}%`),{takeProfitPct:a,stopLossPct:r,slippagePct:s,slippageBps:Number.isFinite(o)&&o>0?o:0,summary:c.join(" / ")}}function DS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(\d{1,3})\s*%/)||[])[1];return a||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function US(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function qS(){const e=[],t=(r={})=>{const s=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();s&&e.push({tokenMint:s,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};n.smartChartToken&&t({tokenMint:n.smartChartToken,symbol:n.smartChartTokenSymbol}),n.tradeToken&&t({tokenMint:n.tradeToken,symbol:n.tradeTokenSymbol}),[n.livePairRows,n.slimeScopeRows,n.watchlist,n.positions,n.portfolioRows,n.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const a=new Set;return e.filter(r=>{const s=r.tokenMint.toLowerCase();return a.has(s)?!1:(a.add(s),!0)})}function HS(e=""){const t=String(e||"").trim(),a=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(a)return a;const r=t.toLowerCase();return qS().map(o=>{const c=o.symbol.toLowerCase(),l=o.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),l&&r.includes(l)&&(u+=8+Math.min(16,l.length)),{...o,score:u}}).filter(o=>o.score>0).sort((o,c)=>c.score-o.score)[0]?.tokenMint||""}function io(e={},t=""){const a={...e},r=At(t);if(!a.tokenMint&&!a.mint&&!a.ca){const s=HS(t)||Vt()||n.smartChartToken||n.tradeToken;s&&(a.tokenMint=s)}if(a.type==="confirm_buy"||r==="buy"){if(a.type=a.type||"confirm_buy",!a.amountSol){const o=_S(t)||Pl();o>0&&(a.amountSol=o)}const s=NS(t);if(s.takeProfitPct&&!a.takeProfitPct&&(a.takeProfitPct=s.takeProfitPct),s.stopLossPct&&!a.stopLossPct&&(a.stopLossPct=s.stopLossPct),s.slippageBps&&!a.slippageBps&&(a.slippageBps=s.slippageBps),a.walletIndex===void 0){const o=US(t);o!==void 0&&(a.walletIndex=o)}}return(a.type==="confirm_sell"||r==="sell")&&(a.type=a.type||"confirm_sell",a.percent=a.percent||DS(t)),a}function um(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function dm(e={},t=""){if(!n.ogreAgentFastMode||!oo()||e.requiresReview||e.conditional)return!1;const a=At(t);return a?a==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:a==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function jt(e={}){const t=String(e.type||""),a=String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Vt()||"").trim();if(t==="toggle_agent_fast_mode"){cm(!n.ogreAgentFastMode),n.ogreAgentStatus=n.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",de({role:"assistant",text:n.ogreAgentStatus,actions:[{label:n.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),F();return}if(t==="approve_agent_auto_trade"){Al(!0),cm(!0),n.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",de({role:"assistant",text:`${n.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),F();return}if(t==="revoke_agent_auto_trade"){Al(!1,{revoked:!0}),n.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",de({role:"assistant",text:n.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),F();return}if(t==="open_tab"){n.route="terminal",n.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!a){n.ogreAgentStatus="Paste a token CA in the message first.",F();return}St(be(a,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){n.route="terminal",n.activeTab="positions",window.history.pushState({},"","/terminal"),n.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){G(()=>vt({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Wallet refresh started.",F();return}if(t==="refresh_feeds"){G(()=>Ya({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Feed refresh started.",F();return}if(t==="open_wallet_connect"){da({returnPath:"/terminal"}),n.ogreAgentStatus="Wallet connect opened.",F();return}if(t==="start_clip_recording"){iu(),n.ogreAgentStatus="REC started from Ogre Agent.",F();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim();if(!r){n.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",F();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(n.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),cn(be(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),n.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",F();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||n.smartChartToken||n.tradeToken||Vt()||"").trim(),s=Number(e.amountSol||e.sol||e.amount||Pl()||0);if(!r||!Number.isFinite(s)||s<=0){r&&cn(be(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),n.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",F();return}const o=e.walletIndex!==void 0?e.walletIndex:ce()?.publicKey?"connected":n.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;n.ogreAgentLoading=!0,n.ogreAgentStatus=`Sending ${s} SOL buy request...`,F();try{const l=await Ps({tokenMint:r,walletIndex:o,amountSol:s,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});n.ogreAgentStatus=l?.ok===!1?l.error||l.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${um(e)}`,typeof vt=="function"&&vt({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(l){n.ogreAgentStatus=l?.message||"Buy failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,F()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim(),s=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){n.activeTab="positions",n.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}n.ogreAgentLoading=!0,n.ogreAgentStatus=`Preparing sell ${s}%...`,F();try{await Ls(r,s,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),n.ogreAgentStatus=`Sell ${s}% submitted. Refreshing wallet and positions in the background.`,typeof vt=="function"&&vt({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(o){n.ogreAgentStatus=o?.message||"Sell failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,F()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){n.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",F();return}window.open(r,"_blank","noopener,noreferrer"),n.ogreAgentStatus="Opened trusted coin link.",F();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=ao(String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Vt()||"").trim());if(!r){n.ogreAgentStatus="Paste a token CA and ask me to check it.",F();return}const s=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};n.ogreAgentLoading=!0,n.ogreAgentStatus="Checking coin details...",F();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},l=c.symbol||c.baseSymbol||w(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,p=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",g=c.telegramUrl||c.links?.telegram||"",S=s(c.liquidityUsd||c.liquidity?.usd),A=s(c.marketCap||c.fdv||c.marketCapUsd),T=s(c.volume24h||c.volume?.h24||c.volume?.m5),b=[`${l} breakdown`,`${u} | ${w(r)}`,`MC/FDV: ${A} | Liquidity: ${S} | Volume: ${T}`,`Socials: X ${y?"found":"not returned"} | Telegram ${g?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],P=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];p&&P.push({label:"Pump",type:"open_external",url:p}),f&&P.push({label:"Website",type:"open_external",url:f}),y&&P.push({label:"X",type:"open_external",url:y}),g&&P.push({label:"Telegram",type:"open_external",url:g}),de({role:"assistant",text:b.join(`
`),actions:P}),n.ogreAgentStatus="Coin breakdown ready."}catch(o){de({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),n.ogreAgentStatus=o?.message||"Coin check delayed."}finally{n.ogreAgentLoading=!1,F()}return}n.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",F()}function KS(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function Cl(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function pm(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function VS(e="",t=[]){const a=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(s=>String(s||"").trim()).filter((s,o,c)=>s&&c.findIndex(l=>l.toLowerCase()===s.toLowerCase())===o).slice(0,4),r=a.length?a.map(s=>`"${s.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function zS(e=""){if(!pm(e))return null;const t=ao(Cl(e)||Vt()||n.smartChartToken||n.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:VS(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function jS(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function GS(e=""){if(!jS(e))return null;const t=Yp().slice(0,4),a=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((o,c)=>{const l=o.symbol||w(o.tokenMint),u=Number.isFinite(Number(o.ageMinutes))?`${Math.max(0,Math.round(Number(o.ageMinutes)))}m old`:"age n/a",d=o.twitterUrl||o.telegramUrl||o.websiteUrl?"socials found":"socials not returned",p=Array.isArray(o.riskFlags)&&o.riskFlags.length?`risk: ${o.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${l} ${w(o.tokenMint)} | MC ${a(o.marketCap)} | Liq ${a(o.liquidityUsd)} | Vol ${a(o.volume5m||o.volume1h)} | ${u} | ${d} | ${p}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],s=t[0];return{text:r.join(`
`),actions:[s?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:s.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const XS=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],JS=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function YS(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||Cl(e)||At(e))return null;const a=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(a){const s=pr(a[1]);if(s)return n.quickBuyAmountOverride=s,Jr({quickBuy:s}),Hs(),{text:`Quick buy set to ${s} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return Jr({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return Jr({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=JS.test(t);for(const[s,o]of XS)for(const c of o){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${QS(s)} now.${s==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:s},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function QS(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const ZS={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function mm(e){n.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},lo()}function Re(e,t="ok",a=""){if(!n.tradeTrace||n.tradeTrace.done&&t==="pending")return;const r=n.tradeTrace.steps,s=r.find(l=>l.key===e),o=s||{key:e,label:ZS[e]||e};if(o.status=t,o.detail=String(a||"").slice(0,140),s||r.push(o),t==="fail"&&(n.tradeTrace.done=!0),lo(),t==="fail")return;r.length>=3&&r.every(l=>l.status==="ok")&&(n.tradeTrace.done=!0,window.setTimeout(()=>{n.tradeTrace?.done&&!n.tradeTrace.steps.some(l=>l.status==="fail")&&(n.tradeTrace=null,lo())},8e3))}function lo(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=n.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const a=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
    <aside class="trade-trace" role="status" aria-live="polite">
      <header>
        <strong>${i(t.title)}</strong>
        <button type="button" data-trade-trace-close aria-label="Close receipt">✕</button>
      </header>
      ${t.steps.map(r=>`
        <div class="trade-trace-step is-${i(r.status)}">
          <span>${a(r.status)}</span>
          <div>
            <b>${i(r.label)}</b>
            ${r.detail?`<small>${i(r.detail)}</small>`:""}
          </div>
        </div>`).join("")}
    </aside>
  `}async function ht(e=""){const t=document.querySelector("[data-ogre-agent-input]"),a=String(e||t?.value||"").trim();if(!a||n.ogreAgentLoading)return;const r=Cl(a);if(r&&ao(r),t&&(t.value=""),n.ogreAgentDraft="",de({role:"user",text:a,actions:[]}),WS(a)){const l=At(a),u=io({type:l==="buy"?"confirm_buy":"confirm_sell"},a),d=String(u.tokenMint||u.mint||u.ca||"").trim(),p=Number(u.amountSol||u.sol||u.amount||0);if(!d){de({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),n.ogreAgentStatus="Need token CA.",F({force:!0});return}if(l==="buy"&&(!Number.isFinite(p)||p<=0)){de({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),n.ogreAgentStatus="Need buy amount.",F({force:!0});return}if(!oo()){de({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),n.ogreAgentStatus="Wallet session needed.",F({force:!0});return}de({role:"assistant",text:l==="buy"?`Sending ${p} SOL buy for ${w(d)}.${um(u)}`:`Sending sell request for ${w(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),n.ogreAgentStatus="Fast Mode: sending trade request...",F({force:!0}),await jt(u);return}const s=YS(a);if(s){de({role:"assistant",text:s.text,actions:s.actions||[]}),n.ogreAgentStatus="Instant local reply.",F({force:!0}),s.run&&await jt(s.run);return}n.ogreAgentLoading=!0,n.ogreAgentStatus="",ne("chatRequestStarted");const o=`${Date.now()}:${Math.random().toString(16).slice(2)}`;n.ogreAgentRequestId=o;const c=setTimeout(()=>{n.ogreAgentRequestId!==o||!n.ogreAgentLoading||(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Agent reply timed out.",ne("chatRequestTimedOut"),de({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:a,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),F({force:!0}))},7500);F();try{const l=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:a,context:TS()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(n.ogreAgentRequestId!==o)return;const u=(l?.agent?.actions||[]).map(S=>io(S,a));l?.agent?.tokenMint&&ao(l.agent.tokenMint),de({role:"assistant",text:l?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),ne("chatRequestSucceeded");const d=!!(l?.agent?.coinEnriched||l?.agent?.tokenMint||l?.agent?.socialLinks||l?.agent?.socialScan),f=!pm(a)&&!d&&!At(a)&&KS(a)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||io({type:"coin_breakdown"},a):null;if(f?.tokenMint||f?.mint||f?.ca){n.ogreAgentStatus="Checking coin now...",await jt(f);return}const y=io({type:At(a)==="buy"?"confirm_buy":At(a)==="sell"?"confirm_sell":""},a);if(At(a)&&n.ogreAgentFastMode&&!oo()){de({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),n.ogreAgentStatus="Auto-Trade approval needed once.";return}const g=u.find(S=>dm(S,a))||(dm(y,a)?y:null);if(g){n.ogreAgentStatus="Fast Mode: sending trade request...",await jt(g);return}n.ogreAgentStatus=l?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(l){if(n.ogreAgentRequestId!==o)return;const u=zS(a);if(u){de({role:"assistant",text:u.text,actions:u.actions}),n.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=GS(a);if(d){de({role:"assistant",text:d.text,actions:d.actions}),n.ogreAgentStatus="Fast local trend scan.";return}de({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:a,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),ne("chatRequestFailed"),n.ogreAgentStatus=l?.message||"Agent reply failed."}finally{clearTimeout(c),n.ogreAgentRequestId===o&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,F())}}function O(e,t){return`<article class="empty"><h3>${i(e)}</h3><p>${i(t)}</p></article>`}function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Se(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function ek(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function fm(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const a=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");a&&(e.preventDefault(),ek(a),bc({connectPanel:a.matches("[data-connect-login-toggle]")||n.route==="connect",source:a.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(If(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),ht();return}const a=e.target?.closest?.("[data-global-token-search]");if(a&&e.key==="Enter"){e.preventDefault(),Wd(a.value||"");return}if(e.key==="Escape"){if(n.ogreAgentOpen){so();return}if(n.slimeShieldDetails?.open){il();return}if(n.kolDumpDetails?.open){Wi();return}if(n.replayDetails?.open){dl();return}if(n.protectedBuyModal?.open){As();return}if(!(!n.loginModalOpen&&!n.quickBuyModal?.open)){if(n.quickBuyModal?.open){ji();return}hc()}}});function Ll(e=null,t="interaction"){const a=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!a)return!1;const r=a.dataset.tokenTrade||a.dataset.tokenChart||a.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),l=Number(n.smartChartInteractionPrefetchAt||0),u=n.smartChartInteractionPrefetchSeen||{};if(l&&c-l<_v||Number(u[r]||0)&&c-Number(u[r])<Uv)return!1;const d=(n.smartChartInteractionPrefetchRecent||[]).filter(p=>c-Number(p||0)<Nv);if(d.length>=Dv)return n.smartChartInteractionPrefetchRecent=d,!1;n.smartChartInteractionPrefetchAt=c,n.smartChartInteractionPrefetchRecent=[...d,c],n.smartChartInteractionPrefetchSeen={...u,[r]:c}}return Zi(be(r,{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t}),{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Ll(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Ll(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Ll(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const hm=new WeakMap;function tk(e){let t=hm.get(e);if(!t){const a=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(a.overflowY),contained:/contain|none/.test(a.overscrollBehaviorY)},hm.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||n.route!=="terminal"||Jn())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const a=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const o=tk(t);if(o.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,l=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(a<0&&c||a>0&&l)||o.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let s=e.deltaY;e.deltaMode===1?s*=40:e.deltaMode===2&&(s*=r.clientHeight),r.scrollTop+=s,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),il();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),As();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),Wi();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),dl();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const b=c.closest(".nav-tool-group");n.navTekOpen=!b?.open,rf(n.navTekOpen),b&&(b.open=n.navTekOpen);return}const l=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!l)return;if(l.matches("[data-tool-section]")){e.preventDefault();const b=l.dataset.toolSection,[P]=b.split(":"),C=b.slice(P.length+1);n.toolSections={...n.toolSections||{},[P]:C};const M=l.closest("[data-tool-panels]");M&&(M.querySelectorAll(`[data-tool-section^="${P}:"]`).forEach(q=>{q.dataset.active=q.dataset.toolSection===b?"true":"false"}),M.querySelectorAll(`[data-tool-panel^="${P}:"]`).forEach(q=>{q.hidden=q.dataset.toolPanel!==b}),ss(M));return}if(l.matches("[data-clip-record]")){e.preventDefault(),n.clipFarm?.recording?Xn():iu();return}if(l.matches("[data-clip-share]")){e.preventDefault(),Th();return}if(l.matches("[data-clip-download]")){e.preventDefault(),Ah();return}if(l.matches("[data-clip-clear]")){e.preventDefault(),mi();return}if(l.matches("[data-slimeshield-details]")){e.preventDefault(),l.closest("[data-dev-info-drawer-root]")&&ll(),$p(l.dataset.slimeshieldDetails||"");return}if(l.matches("[data-slimeshield-refresh]")){e.preventDefault(),Ks(l.dataset.slimeshieldRefresh||"",{force:!0});return}if(l.matches("[data-kol-dump-details]")){e.preventDefault(),ey(l.dataset.kolDumpDetails||"");return}if(l.matches("[data-kol-dump-refresh]")){e.preventDefault(),Fi({force:!0});return}if(l.matches("[data-replay-open]")){e.preventDefault(),Bw(l.dataset.replayOpen||"");return}if(l.matches("[data-replay-refresh]")){e.preventDefault(),ul(l.dataset.replayRefresh||"",{force:!0});return}if(l.matches("[data-ogre-agent-toggle]")){n.ogreAgentOpen?so():(n.ogreAgentOpen=!0,Kh(),F({force:!0}));return}if(l.matches("[data-ogre-agent-close]")){so();return}if(l.matches("[data-ogre-agent-voice]")){RS(!n.ogreAgentVoiceEnabled);return}if(l.matches("[data-ogre-agent-send]")){zt(),ht();return}if(l.matches("[data-ogre-agent-mic]")){OS();return}if(l.matches("[data-ogre-agent-quick]")){const b=l.dataset.ogreAgentQuick||"";if(b==="positions"&&jt({type:"open_tab",tab:"positions"}),b==="whats_cooking"&&ht("whats cooking"),b==="my_bags"&&ht("how are my bags"),b==="refresh_feeds"&&jt({type:"refresh_feeds"}),b==="risk"&&ht("Why is this token risky?"),b==="dev_info"&&ht("Explain Dev Info for this token."),b==="protected_buy"&&ht("Should I use Protected Buy?"),b==="replay"&&ht("Replay similar launches for this token."),b==="auto_trade"&&jt({type:"approve_agent_auto_trade"}),b==="clear_chat"){zt(),no(),n.ogreAgentMessages=[Jp()],n.ogreAgentStatus="Chat cleared.",n.ogreAgentDraft="",n.ogreAgentLastTokenMint="";try{localStorage.removeItem(Sl),localStorage.removeItem(kl)}catch{}F({force:!0})}return}if(l.matches("[data-ogre-agent-retry]")){const b=Number(l.dataset.ogreAgentRetry),P=String(n.ogreAgentMessages?.[b]?.retryText||"").trim();P&&ht(P);return}if(l.matches("[data-ogre-agent-action]")){const b=l.dataset.ogreAgentAction,C=ES(b)||(n.ogreAgentMessages||[]).flatMap(M=>Array.isArray(M.actions)?M.actions:[]).find(M=>M.key===b||M.label===b||M.type===b);jt(C||{type:b});return}if(l.matches("[data-nav-route]")){e.preventDefault(),Te(l.dataset.navRoute||"/terminal",l.dataset.tab||null);return}if(l.matches("[data-policy]")){e.preventDefault(),window.alert(xf(l.dataset.policy==="privacy"?"privacy":"terms"));return}if(l.matches("[data-top-wallet-connect]")){e.preventDefault(),l.dataset.walletState==="connected"||!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length)?Te("/terminal","wallets"):da({returnPath:"/terminal"});return}if(l.matches("[data-top-wallet-status]")){e.preventDefault(),await Rh();return}if(l.matches("[data-top-refresh-wallet]")){const b=L();za("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:"top-refresh-wallet"}),vt({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{py()&&G(()=>Ni())}).catch(P=>$(P.message));return}if(l.matches("[data-ogre-tek-refresh]")){await yr({force:!0}).catch(b=>$(b.message));return}if(l.matches("[data-ogre-ai-start]")){G(()=>jy());return}const u=l.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),n.ogreAiCategory=u.dataset.ogreCat||"strong",h({force:!0});return}if(l.closest?.("[data-autopilot-save]")){e.preventDefault(),G(()=>Jy());return}if(l.matches("[data-ogre-tek-market]")){n.ogreTek.selectedMarket=l.dataset.ogreTekMarket||n.ogreTek.selectedMarket,n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-side]")){n.ogreTek.direction=l.dataset.ogreTekSide==="short"?"short":"long",n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-review]")){to(),n.ogreTek.reviewOpen=!0,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-close-review]")){n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-confirm-review]")){to();const b=jp();!n.ogreTek.riskAccepted||!b.ok?n.ogreTek.status="Risk confirmation is incomplete.":$e.demoMode?(n.ogreTek.status="Demo review confirmed. No live transaction was submitted.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1):(n.ogreTek.status="Live perps adapter is not wired in this build.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1),h({force:!0});return}if(l.matches("[data-ogre-tek-demo-action]")){const b=l.dataset.ogreTekDemoAction||"action";n.ogreTek.status=`Demo mode: ${b.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(l.matches("[data-toggle-terminal-ticket]")){n.terminalTradeCollapsed=!n.terminalTradeCollapsed,h({force:!0});return}if(l.matches("[data-global-token-open]")){const b=m("[data-global-token-search]")?.value?.trim()||"";b&&Wd(b);return}if(l.matches("[data-token-chart]")){e.preventDefault();const b=l.dataset.tokenChart||l.dataset.previewToken||"";St(be(l.dataset.tokenChart||l.dataset.previewToken||"",{source:l.dataset.tokenChartSource||"token-card"}),{defaultTab:l.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!l.closest?.(".live-pair-avatar"),source:l.dataset.tokenChartSource||"token-card"});return}if(l.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const b=l.dataset.tokenTrade||"",P=un(b);P&&Bs(P)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),St(be(l.dataset.tokenTrade||"",{source:l.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:l.dataset.tokenTradeSource||"trade-button"});return}if(l.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),cn(be(l.dataset.quickBuyToken||"",{source:l.dataset.quickBuySource||"quick-buy-button"}),{source:l.dataset.quickBuySource||"quick-buy-button"});return}if(l.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),l.closest("[data-dev-info-drawer-root]")&&ll();const b=l.dataset.protectedBuySource||"protected-buy",P=!!l.closest("[data-quick-buy-modal-root]"),C=!!l.closest(".chart-trade-panel"),M=l.dataset.protectedBuyOpen||n.quickBuyModal?.tokenMint||n.smartChartToken||n.tradeToken||"";sv(be(M,{source:b}),{source:b,presetId:l.dataset.protectedBuyPreset||"",amountSol:P?m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||"":C&&m("[data-chart-buy-amount]")?.value||"",walletIndex:P?m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"":C&&m("[data-chart-buy-wallet]")?.value||"",slippageBps:P?m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400":C&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-quick-buy-close]")){e.preventDefault(),ji();return}if(l.matches("[data-protected-buy-close]")){e.preventDefault(),As();return}if(l.matches("[data-protected-buy-confirm]")){e.preventDefault(),G(()=>lv());return}if(l.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),n.quickBuyModal={...n.quickBuyModal,amountSol:l.dataset.quickBuyModalPreset||"",status:`${l.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(l.matches("[data-quick-buy-confirm]")){e.preventDefault(),G(()=>dv());return}if(l.matches("[data-preview-token]")){const b=l.dataset.previewToken||"";b&&St(be(b,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(l.matches("[data-terminal-subtab]")){n.terminalSubtab=l.dataset.terminalSubtab||"positions",h();return}if(l.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await Ls(l.dataset.positionSell||"",l.dataset.positionSellPercent||"100",{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const b=await xe({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});b&&await Ls(l.dataset.positionSellCustom||"",b,{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-run-tx-audit]")){e.preventDefault(),G(()=>pv());return}if(l.matches("[data-connect-login-toggle]")){fm(l)||yc({connectPanel:!0,source:"connect-lock-in"});return}if(l.matches("[data-login-tab]")){n.loginModalTab=l.dataset.loginTab==="create"?"create":"login",h({force:!0}),fc(!1);return}if(l.matches("[data-connect-password-login]")){await Lc();return}if(l.matches("[data-send-email-code]")){await zf();return}if(l.matches("[data-web-code-login]")){await jf();return}if(l.matches("[data-connect-create-account]")){await Zo();return}if(l.matches("[data-connect-create-wallet]")){await Qf();return}if(l.matches("[data-web-signup]")&&await Zo(),l.matches("[data-web-password-login]")&&await Lc(),l.matches("[data-close-login]")){hc();return}if(l.matches("[data-web-signup-connect]")){await Yf();return}if(l.matches("[data-open-login]")){fm(l)||yc({connectPanel:n.route==="connect",source:"top-lock-in"});return}if(l.matches("[data-browse-guest]")){n.loginCollapsed=!0,n.route="terminal",n.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),qr("browse-terminal");return}if(l.matches("[data-logout]")&&await Zf(),l.matches("[data-connect-x]")&&await Ty(),l.matches("[data-open-x-login]")&&Ay(),l.matches("[data-clear-x]")&&await Py(),l.matches("[data-save-login-credentials]")&&await My(),l.matches("[data-save-referral]")&&await qd(),l.matches("[data-generate-referral-code]")&&await qd({generate:!0}),l.matches("[data-save-trader-board]")&&await bv(),l.matches("[data-use-x-avatar]")&&await xy(),l.matches("[data-clear-avatar]")&&await bs({clear:!0},"Removing PFP..."),l.matches("[data-preset-avatar]")){const b=m("[data-avatar-status]");v(b,"Loading preset PFP...");try{const P=await Ly(l.dataset.presetAvatar);await bs({avatarDataUrl:P,avatarSource:l.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(P){v(b,P.message),$(P.message)}}if(l.matches("[data-launch-coin-save]")){er();return}if(l.matches("[data-launch-coin-submit]")){await Gb();return}if(l.matches("[data-launch-coin-use-ca]")){await Kb();return}if(l.matches("[data-connect-wallet]")){const b=l.dataset.connectWallet||"solana";if(b&&b!=="solana"){await yd(b,{returnPath:"/terminal"});return}da({returnPath:"/terminal"});return}if(l.matches("[data-connect-wallet-provider]")){await yd(l.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(l.matches("[data-wallet-connect-close]")){n.walletConnectMenuOpen=!1,h({force:!0});return}if(l.matches("[data-wallet-fast-approvals-toggle]")){ug(!n.walletFastApprovalsEnabled),$(n.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(l.matches("[data-disconnect-wallet]")){await vd();return}if(l.matches("[data-share-x]")&&Ui(l.dataset.shareText||""),l.matches("[data-share-watch-token-btn]")&&wd("token"),l.matches("[data-share-watch-kol-btn]")&&wd("kol"),l.matches("[data-save-preset]")){await Dd(l.dataset.savePreset);return}if(l.matches("[data-save-fast-preset]")){await Dd(l.dataset.saveFastPreset,"fast");return}if(l.matches("[data-use-preset]")){hv(l.dataset.usePreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-preset]")){Ud(l.dataset.editPreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-selected-preset]")){const b=l.dataset.editSelectedPreset==="bundle"?"bundle":"trade",P=b==="bundle"?n.selectedBundlePresetId:n.selectedTradePresetId;P&&P!=="custom"?Ud(b,P):pl(b);return}if(l.matches("[data-cancel-preset-edit]")){ns(l.dataset.cancelPresetEdit,""),h();return}if(l.matches("[data-delete-preset]")){await gv(l.dataset.deletePreset,l.dataset.presetId||"");return}if(l.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),cn(be(l.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(l.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),G(()=>Nd(l.dataset.quickBundleToken||""));return}if(l.matches("[data-smart-chart-token]")){St(be(l.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(l.matches("[data-smart-chart-view]")){const b=l.dataset.smartChartView||"chart";n.smartChartView=["chart","chartTxns","txns","info"].includes(b)?b:"chart",h();return}if(l.matches("[data-chart-trade-tab]")){n.chartTradeTab=l.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),n.chartTradeTab==="buy"&&requestAnimationFrame(()=>m("[data-chart-buy-amount]")?.focus());return}if(l.matches("[data-chart-buy-preset]")){const b=m("[data-chart-buy-amount]");b&&(b.value=l.dataset.chartBuyPreset||""),n.quickBuyAmountOverride=X(l.dataset.chartBuyPreset||""),Hs();return}if(l.matches("[data-chart-confirm-buy]")){const b=l.dataset.chartConfirmBuy||n.smartChartToken||"";e.preventDefault(),e.stopPropagation();const P=m("[data-chart-buy-wallet]")?.value||"";if(ue(P)){try{l.dataset.actionState="clicked",l.disabled=!0,await uv(b)}catch(C){const M=N(C.message||"Chart buy failed."),q=X(m("[data-chart-buy-amount]")?.value||"")||"custom";V("trade-buy",b,String(q),{state:"error",error:M}),Ce("trade-buy",b,String(q),4e3),We(M),$(M),le()}return}We("Buy queued. Opening wallet approval..."),l.dataset.actionState="clicked",l.disabled=!0,G(async()=>{try{const C=Md();await Ps({tokenMint:b,walletIndex:P,amountSol:X(m("[data-chart-buy-amount]")?.value||""),slippageBps:m("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:C.takeProfitPct,stopLossPct:C.stopLossPct,sellDelay:C.sellDelay,sellPercent:C.sellPercent,source:"chart-buy-panel"}),n.chartTradeTab="buy",We("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(C){const M=N(C.message||"Chart buy failed.");We(M),$(M),h({force:!0,preserveSmartChartFrame:!0})}});return}if(l.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const b=m("[data-chart-sell-percent]")?.value||"";if(b)try{await Ls(l.dataset.chartConfirmSell||"",b,{slippageBps:m("[data-chart-buy-slippage]")?.value||"400"})}catch(P){const C=N(P.message||"Chart sell failed.");We(C),$(C)}return}if(l.matches("[data-smart-chart-open]")){const b=String(m("[data-smart-chart-input]")?.value||"").trim();if(!b){$("Paste a token CA first.");return}St(be(b,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(l.matches("[data-refresh-feeds]")){G(()=>Ya({force:!0,reason:"manual-refresh-feeds"}));return}if(l.matches("[data-terminal-load-more]")){const b=l.dataset.terminalLoadMore||n.activeTab;nh(b,Ot(b)),Uc(b,{requestId:z(b).lastRequestId||"",status:z(b).lastStatus||"render",reason:"load-more",resultCount:Ot(b),renderedCount:Nn(b),hasMore:Ot(b)>Nn(b),stale:Dn(b),errorCode:z(b).errorCode||"",errorMessage:z(b).errorMessage||""}),h({force:!0});return}if(l.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),Cw(l.dataset.devInfo||"");return}if(l.matches("[data-dev-info-close]")){ll();return}if(l.matches("[data-dev-info-refresh]")){const b=l.dataset.devInfoRefresh||n.devInfoDetails?.tokenMint||"";await Cp(b,{force:!0});return}if(l.matches("[data-watch-token]")&&await Hd("add",l),l.matches("[data-unwatch-token]")&&await Hd("remove",l),l.matches("[data-pnl-card]"))try{await kd(l.dataset.pnlCard)}catch(b){$(b.message)}if(l.matches("[data-share-pnl-card]")&&await By(l.dataset.sharePnlCard,l.dataset.shareText||""),l.matches("[data-scan-bags]")){await Iv();return}if(l.matches("[data-arm-exits]")){await Rv(l.dataset.armExits,l);return}if(l.matches("[data-dev-watch]")){await Bv(l.dataset.devWatch);return}if(l.matches("[data-hype-create]")){await Wb();return}if(l.matches("[data-push-enable]")){await eg();return}if(l.matches("[data-push-disable]")){await tg();return}if(l.matches("[data-call-post]")){await Dw(l.dataset.callPost);return}if(l.matches("[data-telegram-link]")){await Qh();return}if(l.matches("[data-trade-trace-close]")){n.tradeTrace=null,lo();return}if(l.matches("[data-launch-kit-close]")){n.launchShareKit=null,h();return}if(l.matches("[data-create-wallets]")&&await gd(),l.matches("[data-distribute-fresh]")){await wb();return}if(l.matches("[data-return-funds]")){await vb();return}if(l.matches("[data-sweep-background-wallets]")){await $v();return}if(l.matches("[data-create-automation-wallet]")&&await iy(),l.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await uy(l);return}if(l.matches("[data-tpsl-status-button]")){l.dataset.tpslState==="enabled"?(n.activeTab="profile",Te("/terminal","profile"),n.automationDelegationStatus=n.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await _i("enable");return}if(l.matches("[data-automation-permission]")&&await _i(l.dataset.automationPermission||"enable"),l.matches("[data-run-trade-plans]")&&await Ni(),l.matches("[data-restore-backup]")&&await hy(),l.matches("[data-export-backup]")&&await gy(),l.matches("[data-import-wallet]")&&await by(),l.matches("[data-remove-wallet]")&&await yy(l.dataset.removeWallet||"",l.dataset.walletLabel||"",l.dataset.removeWalletKey||""),l.matches("[data-wallet-sweep-action]")&&await ky(l.dataset.walletSweepAction||""),l.matches("[data-download]")){const b=n.downloads?.[l.dataset.download];b&&he(b.filename,b.text)}if(l.matches("[data-trade-buy-quick]")&&await ws(l.dataset.tradeBuyQuick),l.closest?.("[data-swap-reverse]")){n.swapDirection=n.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(l.matches("[data-swap-use-custom-amount]")){const b=String(m("[data-swap-amount]")?.value||"").trim();n.swapDirection==="sell"?await Hi(b||"100"):await ws(b);return}l.matches("[data-trade-buy-max]")&&await ws(null,"max"),l.matches("[data-trade-buy-custom]")&&await ws(m("[data-buy-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-sell-quick]")&&await Hi(l.dataset.tradeSellQuick),l.matches("[data-trade-sell-custom]")&&await Hi(m("[data-sell-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-plan-start]")&&await Uy(),l.matches("[data-volume-start]")&&await Hy();const d=l.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),n.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(b=>{b.dataset.active=String(b===d)});return}const p=l.closest?.("[data-vbot-set-aggr]");if(p){e.preventDefault(),n.slimeBotAggr=p.dataset.vbotSetAggr||"med",p.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(b=>{b.dataset.active=String(b===p)});return}const f=l.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),n.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(b=>{b.dataset.active=String(b===f)});return}if(l.matches("[data-vbot-start]")){e.preventDefault(),await Cb();return}const y=l.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await Lb(y.dataset.vbotStop||"");return}if(l.matches("[data-sniper-buy]")&&await Vy(l.dataset.sniperBuy),l.matches("[data-kol-mode]")){n.kolWallet="",n.kolMode=l.dataset.kolMode||n.kolMode,Z("kol"),await ee("kol",{force:!0,reason:"kol-mode-switch"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-refresh]")){await ee("kol",{force:!0,reason:"manual-kol-refresh"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-wallet-scan]")){if(n.kolWallet=String(m("[data-kol-wallet]")?.value||"").trim(),n.kolWallet&&!_t(n.kolWallet)){Ut("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-wallet-scan"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-scan-wallet]")){if(n.kolWallet=String(l.dataset.kolScanWallet||"").trim(),n.kolWallet&&!_t(n.kolWallet)){Ut("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-copy-setup]")){const b=String(l.dataset.kolCopySetup||"").trim();if(b&&!_t(b)){Ut("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}b&&(n.kolWallet=b),n.activeTab="kol",h(),setTimeout(()=>{const P=document.querySelector("[data-kol-management-settings]");P&&(P.open=!0,P.scrollIntoView({behavior:"smooth",block:"start"}));const C=m("[data-kol-wallet]");C&&b&&(C.value=b);const M=m("[data-kol-status]");M&&v(M,`Copy setup loaded for ${w(b)}. Choose presets, then tap Copy Wallet Next Buy.`),m("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(l.matches("[data-kol-copy]")){await Zy(l.dataset.kolCopy);return}if(l.matches("[data-kol-copy-wallet]")){const b=String(l.dataset.kolCopyWallet||"").trim();if(b&&!_t(b)){Ut("That KOL entry does not have a verified Solana wallet yet.");return}await ev(l.dataset.kolCopyWallet||"");return}if(l.matches("[data-kol-trade]")){n.tradeToken=l.dataset.kolTrade||"",n.activeTab="trade",h();return}if(l.matches("[data-kol-bundle]")){n.bundleToken=l.dataset.kolBundle||"",n.activeTab="bundle",h();return}if(l.matches("[data-bundle-buy]")&&await Od("buy"),l.matches("[data-bundle-sell]")&&await Od("sell"),l.matches("[data-bundle-plan]")&&await av(),l.matches("[data-launch-start]")&&await vv(),l.matches("[data-launch-cancel]")&&await wv(l.dataset.launchCancel),l.matches("[data-use-token]")&&(n.tradeToken=l.dataset.useToken||"",n.volumeToken=l.dataset.useToken||"",n.bundleToken=l.dataset.useToken||"",n.activeTab="trade",h()),l.matches("[data-use-token-bundle]")&&(n.bundleToken=l.dataset.useTokenBundle||"",n.tradeToken=n.bundleToken,n.volumeToken=n.bundleToken,n.activeTab="bundle",h()),l.matches("[data-use-token-volume]")&&(n.volumeToken=l.dataset.useTokenVolume||"",n.tradeToken=n.volumeToken,n.bundleToken=n.volumeToken,n.activeTab="volume",h()),l.matches("[data-refresh-all]")){const b=L();if(za("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:n.activeTab||"terminal"}),!n.user||!n.token)ze(n.activeTab)?await ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(P=>$(P.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),Ke("success");else{const P=L();n.activeTab==="positions"?ah({force:!0,reason:"manual-positions-refresh"}).catch(C=>{Ke("error",{error:N(C?.message||"Position refresh failed")}),$(C.message),h()}):(vt({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(C=>$(C.message)),ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(C=>$(C.message))),H("position-refresh-request-start",P,{component:"positions",cacheHit:!1,details:n.activeTab||"terminal"})}}if(l.matches("[data-tab]")){const b=L();if(n.activeTab=l.dataset.tab,n.activeTab==="volume"&&is(),n.activeTab==="ogreAi"&&Gy(),n.activeTab==="ogreTek"){n.route="terminal",window.history.pushState({},"","/ogre-tek"),await yr({silent:!0}).catch(M=>$(M.message)),h();return}n.route!=="terminal"&&(n.route="terminal",window.history.pushState({},"","/terminal")),n.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):n.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const P=Dc(n.activeTab);h();const C=ee(n.activeTab,{silent:!0,ifStale:!0,force:!P,reason:"tab-switch"}).catch(M=>$(M.message));P||await C,H("tab-switch",b,{component:"terminal",cacheHit:P,details:n.activeTab})}if(l.matches("[data-refresh-scan]")&&G(()=>ee("sniper",{force:!0,reason:"manual-sniper-refresh"})),l.closest?.("[data-refresh-live-pairs]")){const b=n.activeTab==="slimeScope"?"slimeScope":n.activeTab==="terminal"?"terminal":n.activeTab==="launch"||n.activeTab==="launchCoin"?"launch":"live",C=n.activeTab==="live"||n.activeTab==="terminal"?null:gi();G(async()=>{await ee(b,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),C&&bi(C)})}if(l.closest?.("[data-terminal-filter-toggle]")){const b=Be();b.open=!b.open,h();return}if(l.closest?.("[data-terminal-filter-clear]")){n.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},Z("live"),Z("launch"),Z("sniper"),h();return}l.matches("[data-refresh-watchlist]")&&G(()=>ee("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=l.closest?.("[data-live-pair-bucket]");S&&(n.livePairBucket=S.dataset.livePairBucket||"live",n.livePairs=Ne(),n.livePairsLastUpdatedAt=ca(),Z("live"),Z("slimeScope"),h(),G(()=>ee(n.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const A=l.closest?.("[data-slime-scope-mode]");A&&(n.slimeScopeMode=A.dataset.slimeScopeMode||"new",n.activeTab="slimeScope",Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),l.matches("[data-scan-mode]")&&(Z("sniper"),n.scanMode=l.dataset.scanMode||n.scanMode,h(),G(()=>Hn(n.scanMode)));const T=l.getAttribute("data-copy");if(T){const b=l.getAttribute("data-copy-label")||l.textContent||"Copy";await navigator.clipboard.writeText(T),v(l,"Copied"),setTimeout(()=>{v(l,b)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(n.replayDetails?.open){dl();return}if(n.kolDumpDetails?.open){Wi();return}if(n.protectedBuyModal?.open){As();return}if(n.quickBuyModal?.open){ji();return}if(n.walletConnectMenuOpen){n.walletConnectMenuOpen=!1,h({force:!0});return}n.loginCollapsed||(n.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const a=document.querySelector("[data-vbot-manual-wallets]");a&&(a.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(n.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(n.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const a=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(s=>{s.style.display=a?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=a||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(ss(),gb(t)),t?.matches?.("[data-swap-from]")){const a=Ee(t.value||"SOL")||"SOL";n.tradeSwapFrom=a,a!=="SOL"?(n.tradeToken=a,n.tradeSwapTo="SOL"):Ee(n.tradeSwapTo||n.tradeToken||"")||(n.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const a=Ee(t.value||"");if(n.tradeSwapTo=a,a&&a!=="SOL"){n.tradeToken=a,n.swapDirection="buy";const r=m("[data-trade-token]");r&&(r.value=a)}a||m("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){n.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const a=t.value||"";if(a==="custom"){pl("trade");return}if(n.selectedTradePresetId=a,n.fastTradePresetStatus=n.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=oe("trade",n.selectedTradePresetId);n.chartBuyWalletIndex="",r?.amountSol&&(n.quickBuyAmountOverride=X(r.amountSol)),n.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(n.quickBuyAmountOverride=X(t.value),t.value=n.quickBuyAmountOverride,Hs()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(n.protectedBuyModal={...n.protectedBuyModal||{},presetId:m("[data-protected-buy-preset]")?.value||n.protectedBuyModal?.presetId||"conservative",walletIndex:m("[data-protected-buy-wallet]")?.value||n.protectedBuyModal?.walletIndex||"",amountSol:X(m("[data-protected-buy-amount]")?.value||n.protectedBuyModal?.amountSol||""),slippageBps:m("[data-protected-buy-slippage]")?.value||n.protectedBuyModal?.slippageBps||"400",riskAccepted:!!m("[data-protected-buy-risk-accept]")?.checked},Gi()),t?.matches?.("[data-fast-bundle-preset]")){const a=t.value||"";if(a==="custom"){pl("bundle");return}n.selectedBundlePresetId=a,n.fastBundlePresetStatus=n.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(n.terminalSort=t.value||"best",Z("live"),Z("slimeScope"),h(),G(()=>Et({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){n.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",n.liveFeedCategory)}catch{}n.terminalSort=_p()[3]||"best",Z("live"),h(),G(()=>Et({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){n.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",n.liveTerminalCategory)}catch{}Z("live"),h(),G(()=>Et({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){n.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",n.cookSpotCategory)}catch{}Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const a=t.files?.[0],r=m("[data-launch-image-preview-wrap]"),s=m("[data-launch-image-preview]"),o=m("[data-launch-image-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(l),s.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}sd(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},imageDataUrl:l,imageName:a.name,imageType:on(l,a.type||"application/octet-stream")},String(l).length<15e5)try{Ba(n.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-launch-coin-banner]")){const a=t.files?.[0],r=m("[data-launch-banner-preview-wrap]"),s=m("[data-launch-banner-preview]"),o=m("[data-launch-banner-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(l),s.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}od(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},bannerDataUrl:l,bannerName:a.name,bannerType:on(l,a.type||"image/jpeg")},String(l).length<15e5)try{Ba(n.launchCoinDraft)}catch{}}).catch(l=>{const u=m("[data-launch-coin-status]");u&&v(u,l?.message||"Could not read that banner.")});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const a=Be(),r=t.getAttribute("data-terminal-filter-social"),s=t.getAttribute("data-terminal-filter-quote"),o=t.getAttribute("data-terminal-filter-audit");r&&(a.socials[r]=!!t.checked),s&&(a.quotes[s]=!!t.checked),o&&(a.audits[o]=!!t.checked),a.open=!0,Z("live"),Z("launch"),Z("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(to(),n.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(n.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await $y(t),t?.matches?.("[data-avatar-file]")&&await Cy(t)}),document.addEventListener("focusout",()=>{setTimeout(Yc,50)});let Pa=null;const gm=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")&&!e.target.matches("[data-launch-coin-banner]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const a=String(e.target.value||"");let r=a.replace(/[^0-9.]/g,"");const s=r.indexOf(".");if(s!==-1&&(r=r.slice(0,s+1)+r.slice(s+1).replace(/\./g,"")),r!==a){const o=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(o-(a.length-r.length),o-(a.length-r.length))}catch{}}}Pa&&clearTimeout(Pa),Pa=setTimeout(()=>{Pa=null,er({silent:!0})},350)}};document.addEventListener("input",gm),document.addEventListener("change",gm),document.addEventListener("click",()=>{Pa&&(clearTimeout(Pa),Pa=null,er({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){n.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),Hs();return}if(t?.matches?.("[data-trade-token]")){const a=String(t.value||"").trim();n.tradeToken=a,n.tradeSwapTo=a;return}if(t?.matches?.("[data-terminal-filter-field]")){const a=t.getAttribute("data-terminal-filter-field"),r=Be();(a==="keywords"||a==="excludeKeywords")&&(r[a]=String(t.value||""),r.open=!0,dp());return}if(t?.matches?.("[data-launch-ticker]")){const a=Be();a.keywords=String(t.value||""),a.open=!0,dp();return}if(t?.matches?.("[data-smart-chart-zoom]")){n.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const a=t.closest(".smart-chart-zoom")?.querySelector("strong");a&&v(a,`${n.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(n.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(to(),t.type==="range"&&h({force:!0}))});function vr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",a=Zc(t,{forcePaint:!0});Yc(),!a&&e?.persisted&&n.route==="terminal"&&h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),na&&window.clearTimeout(na),na=window.setTimeout(()=>{if(na=null,!(document.hidden||n.route!=="terminal")){if(Vn()){W({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:n.postTradeRefresh?.attemptId||"",details:n.activeTab||"terminal"});return}ee(n.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),n.user&&n.token&&Dn("positions")&&yt({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:vo}).catch(()=>{}),ua(),qn(),zr(),ri()}},Hl)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(n.ogreAgentListening||n.ogreAgentSpeechRecognizer)&&zt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(n.ogreAgentOpen&&(n.ogreAgentListening||n.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!n.ogreAgentListening&&!n.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&vr()},Hl+900);return}vr()}),window.addEventListener("focus",vr),window.addEventListener("pageshow",vr),window.addEventListener("online",vr),window.addEventListener("pagehide",()=>{na&&(window.clearTimeout(na),na=null),n.clipFarm?.recording&&Xn()});function ak(){Fo&&window.clearInterval(Fo),Fo=window.setInterval(()=>{document.hidden||Zc("watchdog")},Km)}const nk=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Swap & Chart",items:[["trade","Slime Swap"],["smartChart","Smart Chart"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function Ca(e,t){return t=t||"#8dff45",`<svg class="swampi" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="${t}" fill-opacity="0.2" stroke="${t}" stroke-opacity="0.5" stroke-width="1.1"/><g stroke="${t}" stroke-width="1.95">${e}</g></svg>`}const rk={terminal:"#46e8ff",live:"#8dff45",liveTrades:"#ffd24a",smartChart:"#72ff23",trade:"#3fe0d0",slimeScope:"#5ab0ff",watchlist:"#ffd24a",kol:"#ffcf5a",sniper:"#ff6b6b",txAudit:"#bbff63",tek:"#9fb6c2",ogreAi:"#b06bff",launchCoin:"#ff8a5a",bundle:"#ffa64d",volume:"#46e8ff",launch:"#9bff9b",wallets:"#ffd24a",positions:"#5ab0ff",pnl:"#72ff23",profile:"#8dff45"},La={terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',live:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',liveTrades:'<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',smartChart:'<path d="M3 17l5-5 4 3 8-9"/><path d="M16 6h4v4"/>',trade:'<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',slimeScope:'<circle cx="11" cy="11" r="6"/><path d="M11 5v2.5"/><path d="M11 14.5V17"/><path d="M5 11h2.5"/><path d="M14.5 11H17"/><circle cx="11" cy="11" r="1.2"/><path d="M15.5 15.5L20 20"/>',watchlist:'<path d="M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.3 9.5l5.2-.8z"/>',kol:'<path d="M4 8l3 9h10l3-9-5 4-3-6-3 6z"/><path d="M7 17h10"/>',sniper:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',txAudit:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/>',tek:'<path d="M15 5a4 4 0 0 1-5.2 5L5 14.8 9.2 19l4.8-4.8a4 4 0 0 1 5-5.2l-2.7 2.7-2.3-.5-.5-2.3z"/>',ogreAi:'<path d="M5 10a7 5 0 0 1 14 0v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M4 8L2.5 6"/><path d="M20 8l1.5-2"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9.5 15l-.7 2.5"/><path d="M14.5 15l.7 2.5"/>',launchCoin:'<path d="M12 3c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 17l-2 4"/><path d="M15 17l2 4"/>',bundle:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v6l8 4 8-4V7"/><path d="M12 11v6"/>',volume:'<path d="M4 13v4"/><path d="M8 9v8"/><path d="M12 5v12"/><path d="M16 10v7"/><path d="M20 13v4"/>',launch:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',wallets:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3"/>',positions:'<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',pnl:'<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',profile:'<path d="M5 12a7 6 0 0 1 14 0v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M9 14.5c1.2 1.4 4.8 1.4 6 0"/>'},sk=Object.fromEntries(Object.entries(La).map(([e,t])=>[e,Ca(t,rk[e])])),ok={live:Ca(La.live,"#8dff45"),chart:Ca(La.trade,"#3fe0d0"),intel:Ca(La.slimeScope,"#5ab0ff"),tools:Ca(La.tek,"#9fb6c2"),portfolio:Ca(La.positions,"#5ab0ff"),profile:Ca(La.profile,"#8dff45")};function ik(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=nk.map(a=>`
    <div class="nav-drop-group" data-nav-drop-group="${i(a.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${ok[a.key]||"•"}</span>
        <span class="nav-side-label">${i(a.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${a.items.map(([r,s])=>`
          <button type="button" data-tab="${i(r)}" title="${i(s)}">
            <span class="nav-side-icon" aria-hidden="true">${sk[r]||"•"}</span>
            <span class="nav-side-label">${i(s)}</span>
          </button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",a=>{const r=a.target.closest(".nav-side-group-toggle");if(r){const s=r.parentElement,o=s.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(c=>c.setAttribute("aria-expanded","false")),o||(s.classList.add("is-open"),r.setAttribute("aria-expanded","true"));return}a.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(s=>s.classList.remove("is-open"))}),document.addEventListener("click",a=>{a.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function lk(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(a=>{const r=!!a.querySelector(`[data-tab="${n.activeTab}"]`);a.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),a.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(a=>{a.dataset.active=a.dataset.tab===n.activeTab?"true":"false"})}function ck(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const s=((await fetch("/?build-check=1",{cache:"no-store"}).then(o=>o.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";s&&!e.includes(s)&&uk()}catch{}},300*1e3).unref?.()}function uk(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function dk(){ik(),ck(),kf(),Lf(),Cf(),Do(),Pf(),n.route==="intro"?Tf():Pn({reset:!0}),ag(),ak(),Uo(),zi(),await Jf(),h(),await eh(),Oy(),n.route==="terminal"&&(Ya({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),n.activeTab==="ogreTek"&&await yr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))}dk();function Pt(e){n.pumpLiveStatus=e,n.pumpLiveLastActionAt=Date.now(),h()}function pk(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():n.launchCoinDraft||{},t=ed(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function mk(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const a=t.getAttribute("data-pump-live-action"),r=pk(),s=r.tokenMint;if(!s){Pt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(a==="chart"){typeof St=="function"?(St(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),Pt("Opened Pump chart with transactions inside Slime.")):Pt("Chart panel is still loading. Try again in a moment.");return}if(a==="copy"){const o=td(s);navigator.clipboard?.writeText(o).then(()=>Pt("Copied Pump Live stream route ID."),()=>Pt("Stream route ID ready: "+o));return}if(a==="obs"){const o=Oi()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";Pt(o);return}if(a==="end"){Pt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(a==="go"){if(!Oi()){Pt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}Pt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",mk);function Gt(e){const t=String(e??"");return typeof i=="function"?i(t):t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function xl(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:n.smartChartToken||{}}function Ml(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function fk(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function co(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function bm(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const a of t){const r=co(a);if(Number.isFinite(r)&&r>0)return r}return NaN}function hk(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const a=Number(t);if(Number.isFinite(a))return a<1e11?a*1e3:a;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function gk(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function bk(e,t,a){if(!a.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(s=>String(s||"").toLowerCase()).join(" ");return a.some(s=>r.includes(s))}function yk(e=""){return String(e||"").split("").reduce((t,a)=>t*31+a.charCodeAt(0)>>>0,17)}function vk(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(co).filter(s=>Number.isFinite(s)&&s>0);if(t.length)return t[0];const a=typeof qt=="function"?Number(qt(e)):NaN;if(Number.isFinite(a)&&a>0)return Math.max(1,a*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function m0(e){const t=xl(e),a=Ml(t)||t.symbol||t.name||"slime",r=vk(t),s=yk(a),o=Math.max(1,co(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,co(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),l=typeof qt=="function"?Math.max(0,Math.min(100,Number(qt(t))||0)):0,u=Math.max(-8,Math.min(18,c/o*18+l/12)),d=Date.now();return Array.from({length:34},(p,f)=>{const y=(f+s%13)/4.2,g=Math.sin(y)*(3.5+s%7*.28),S=(f/33-.5)*u,A=((s>>f%11&7)-3)*.32,T=Math.max(1e-7,r*(1+(g+S+A)/100));return{row:{...t,snapshotFallback:!0},value:T,time:d-(33-f)*15e3,side:"snapshot"}})}function ym(e){const t=xl(e),a=[Ml(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,l,u)=>c.length>=3&&u.indexOf(c)===l),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:n.liveTrades},{direct:!1,rows:n.liveTradeRows},{direct:!1,rows:n.tradeTape},{direct:!1,rows:n.recentTrades},{direct:!1,rows:n.pumpTrades},{direct:!1,rows:n.pumpActivity},{direct:!1,rows:n.livePairs},{direct:!1,rows:n.livePairsRows},{direct:!1,rows:n.freshPairs},{direct:!1,rows:n.slimeScopePairs}],s=[];for(const c of r){const l=gk(c.rows).slice(-350);for(const u of l){if(!u||typeof u!="object"||!c.direct&&!bk(u,t,a))continue;const d=bm(u);if(!Number.isFinite(d)||d<=0)continue;const p=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();s.push({row:u,value:d,time:hk(u),side:p.includes("sell")?"sell":p.includes("buy")?"buy":"trade"})}}const o=bm(t);return Number.isFinite(o)&&o>0&&s.push({row:t,value:o,time:Date.now(),side:"snapshot"}),s.sort((c,l)=>c.time-l.time).filter((c,l,u)=>l===0||c.time!==u[l-1].time||c.value!==u[l-1].value).slice(-120)}function uo(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function wk(){const e=String(n.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function Sk(e={},t={}){const a=xl(e),r=Ml(a),s=wk(),o=String(n.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(n.pumpChartTimeframe||"5m"),u=ym(a).slice(-70),d=!u.length||u.every(U=>U.side==="snapshot"||U.row?.snapshotFallback),p=u.map(U=>U.value),f=p.length?Math.min(...p):NaN,y=p.length?Math.max(...p):NaN,g=720,S=260,A=22,T=Number.isFinite(y-f)&&y!==f?y-f:1,b=U=>u.length<=1?g/2:A+U/(u.length-1)*(g-A*2),P=U=>S-A-(U-(Number.isFinite(f)?f:0))/T*(S-A*2),C=u.map((U,_e)=>`${_e?"L":"M"}${b(_e).toFixed(1)},${P(U.value).toFixed(1)}`).join(" "),M=u.length>1?`${C} L${b(u.length-1).toFixed(1)},${S-A} L${b(0).toFixed(1)},${S-A} Z`:"",q=Math.max(4,Math.min(12,(g-A*2)/Math.max(u.length*2,1))),J=u.map((U,_e)=>{const Ct=(u[Math.max(0,_e-1)]||U).value,pe=U.value,go=Math.max(Ct,pe),bo=Math.min(Ct,pe),Sn=b(_e),Il=P(Ct),Ol=P(pe),km=P(go),$m=P(bo);return`<g class="slime-pump-candle ${pe>=Ct?"up":"down"}"><line x1="${Sn.toFixed(1)}" y1="${km.toFixed(1)}" x2="${Sn.toFixed(1)}" y2="${$m.toFixed(1)}" /><rect x="${(Sn-q/2).toFixed(1)}" y="${Math.min(Il,Ol).toFixed(1)}" width="${q.toFixed(1)}" height="${Math.max(2,Math.abs(Ol-Il)).toFixed(1)}" rx="2" /></g>`}).join(""),ke=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",et=s==="dex"&&ke?`<iframe class="slime-pump-dex-frame" src="${Gt(ke)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${g} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${M}" />${o==="candles"?J:`<path class="slime-pump-line" d="${C}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${s==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(U=>`<button type="button" class="${s===U?"active":""}" data-slime-pump-source="${U}">${U==="slime"?"Slime":U==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${o==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${o==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(U=>`<button type="button" class="${c===U?"active":""}" data-slime-pump-time="${U}">${U}</button>`).join("")}
          ${d?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${et}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Gt(uo(p[p.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Gt(Number.isFinite(f)&&Number.isFinite(y)?`${uo(f)} - ${uo(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Gt(d?"Slime snapshot":s==="slime"?"Slime default":s==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function kk(e={}){const t=ym(e).slice(-40).reverse(),a=t.map(r=>{const s=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),o=s<60?`${s}s`:`${Math.floor(s/60)}m`,c=r.row||{},l=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Gt(o)}</span><strong>${Gt(r.side)}</strong><span>${Gt(uo(r.value))}</span><span>${Gt(fk(l))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${a||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function vm(){n.slimePumpChartRendering||(n.slimePumpChartRendering=!0,requestAnimationFrame(()=>{n.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),a=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||a||r)&&(e.preventDefault(),e.stopPropagation(),t&&(n.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),a&&(n.pumpChartMode=a.getAttribute("data-slime-pump-mode")||"line"),r&&(n.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),vm())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&vm()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||n.activeTab!=="volume"||!(n.volumeBots||[]).some(t=>t.status!=="completed")||is()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const a=document.querySelector("[data-vbot-invest-num]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const a=document.querySelector("[data-vbot-invest]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-duration]")){const a=document.querySelector("[data-vbot-duration-label]");if(a){const r=Number(t.value);a.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const a=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function s(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function o(){return!!(n?.route==="terminal"&&a.has(String(n.activeTab||"terminal"))&&!document.hidden)}function c(){let p=0;const f=y=>{if(y){if(Array.isArray(y)){p+=y.length;return}if(Array.isArray(y.rows)){p+=y.rows.length;return}Array.isArray(y.data?.rows)&&(p+=y.data.rows.length)}};return f(n.livePairRows),f(n.slimeScopeRows),f(n.liveTradeRows),f(n.livePairs),Object.values(n.livePairsByBucket||{}).forEach(f),Object.values(n.terminalFeeds||{}).forEach(f),p}function l(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const p=[n.livePairsLastUpdatedAt,n.livePairsLastUpdatedByBucket?.[n.livePairBucket||"live"],n.terminalFeeds?.[n.activeTab||"terminal"]?.updatedAt,n.terminalFeeds?.[n.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return p.length?Date.now()-Math.max(...p)>3e4:!1}function d(p="empty-feed-watchdog"){if(!o()||s())return;const f=Date.now();if(f-t<$n)return;const y=c()===0&&!l();if(!y&&!u())return;t=f;const g=()=>typeof Ya=="function"?Ya({force:y,reason:p}):typeof ee=="function"?ee(n.activeTab||"terminal",{force:y,reason:p}):null;try{typeof G=="function"?G(g):Promise.resolve(g()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),$n),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),$n)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),$n)})})();const I={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[],audio:null,mime:"video/webm"};function xa(e){return new Promise(t=>{const a=setTimeout(t,e);I.timers.push(a)})}function $k(){return window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad/i.test(navigator.userAgent)}function Tk(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{const t=new e;t.resume?.();const a=t.createGain();a.gain.value=.6,a.connect(t.destination);let r=null;try{r=t.createMediaStreamDestination(),a.connect(r)}catch{}return I.audio={ctx:t,master:a,dest:r},I.audio}catch{return null}}function po(e,t,a,r,s){const o=e.gain;o.setValueAtTime(1e-4,t),o.exponentialRampToValueAtTime(Math.max(.001,a),t+r),o.exponentialRampToValueAtTime(1e-4,t+r+s)}function wm(e,t=1){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,e),r.frequency.exponentialRampToValueAtTime(42,e+.22),po(s,e,.8*t,.006,.3),r.connect(s).connect(a.master),r.start(e),r.stop(e+.45)}function Sm(e){const t=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=t.getChannelData(0);for(let r=0;r<a.length;r+=1)a[r]=Math.random()*2-1;return t}function Ak(e,t=1.3){const a=I.audio;if(!a)return;const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Sm(a.ctx)),r.loop=!0;const s=a.ctx.createBiquadFilter();s.type="bandpass",s.Q.value=1.1,s.frequency.setValueAtTime(250,e),s.frequency.exponentialRampToValueAtTime(5200,e+t);const o=a.ctx.createGain();o.gain.setValueAtTime(1e-4,e),o.gain.exponentialRampToValueAtTime(.3,e+t),o.gain.exponentialRampToValueAtTime(1e-4,e+t+.08),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+t+.2)}function Bl(e,t=!1){const a=I.audio;if(!a)return;wm(e,t?1.4:1.1);const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Sm(a.ctx));const s=a.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=t?1400:900;const o=a.ctx.createGain();po(o,e,t?.5:.32,.004,t?.9:.5),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+1.4);const c=a.ctx.createOscillator(),l=a.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(64,e),c.frequency.exponentialRampToValueAtTime(28,e+(t?1.4:.8)),po(l,e,t?.7:.4,.01,t?1.5:.85),c.connect(l).connect(a.master),c.start(e),c.stop(e+2)}function Pk(e,t=720){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="square",r.frequency.value=t,po(s,e,.12,.004,.12),r.connect(s).connect(a.master),r.start(e),r.stop(e+.2)}function Ck(e,t){const a=I.audio;if(!a)return;const r=a.ctx.currentTime+.05;for(let s=0;s<t-.4;s+=.5)wm(r+s,.55+.35*(s/t));for(const s of e)Ak(r+Math.max(0,s-1.25),1.25),Bl(r+s,!1);Bl(r+t-.35,!0),Bl(r+t+.45,!0)}function Lk(){if(document.getElementById("trailer-style"))return;const e=document.createElement("style");e.id="trailer-style",e.textContent=`
    @keyframes twCapIn { 0% { transform: translateX(-50%) scale(1.3); opacity: 0; filter: blur(8px); } 100% { transform: translateX(-50%) scale(1); opacity: 1; filter: blur(0); } }
    @keyframes twFlash { 0% { opacity: 0.45; } 100% { opacity: 0; } }
    @keyframes twPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twGlow { 0%, 100% { text-shadow: 0 0 24px rgba(114,255,35,0.55); } 50% { text-shadow: 0 0 56px rgba(114,255,35,0.95); } }
  `,document.head.appendChild(e)}function mo(){if(I.root)return I.root;Lk();const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:7vh;background:linear-gradient(rgba(2,7,2,0.92),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(transparent,rgba(2,7,2,0.94));"></div>
    <div data-trailer-flash style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, rgba(114,255,35,0.55), rgba(114,255,35,0.12) 60%, transparent);opacity:0;"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:max(30px, env(safe-area-inset-bottom, 0px) + 26px);transform:translateX(-50%);text-align:center;opacity:0;max-width:94vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(20px,5.4vw,32px);font-weight:900;letter-spacing:0.04em;animation:twGlow 2.2s infinite;"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,3.4vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.88);text-align:center;padding:22px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:max(10px, env(safe-area-inset-top, 0px));right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>Rl("stopped")),document.body.appendChild(e),I.root=e,e}function fo(){const e=mo().querySelector("[data-trailer-flash]");e.style.animation="none",e.offsetWidth,e.style.animation="twFlash 0.55s ease-out forwards"}function ho(e,t=""){const a=mo(),r=a.querySelector("[data-trailer-caption]");a.querySelector("[data-trailer-caption-main]").textContent=e,a.querySelector("[data-trailer-caption-sub]").textContent=t,e?(r.style.animation="none",r.offsetWidth,r.style.animation="twCapIn 0.5s cubic-bezier(0.2,1.4,0.4,1) forwards",r.style.opacity="1"):r.style.opacity="0"}function wr(e){const t=mo().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}function xk(){const e=["video/mp4;codecs=avc1.64001f,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"];for(const t of e)try{if(MediaRecorder.isTypeSupported(t))return t}catch{}return"video/webm"}async function Mk(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});I.stream=e;const t=[...e.getVideoTracks()],a=I.audio?.dest?.stream?.getAudioTracks()||[];t.push(...a);const r=new MediaStream(t);I.mime=xk(),I.chunks=[];const s=new MediaRecorder(r,{mimeType:I.mime,videoBitsPerSecond:6e6});return s.ondataavailable=o=>{o.data?.size&&I.chunks.push(o.data)},s.start(1e3),I.recorder=s,e.getVideoTracks()[0]?.addEventListener("ended",()=>Rl("screen-share-ended")),!0}catch{return!1}}function Bk(e){const t=I.mime.includes("mp4")?"mp4":"webm",a=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.${t}`,r=URL.createObjectURL(e),s=document.createElement("div");s.setAttribute("data-trailer-result",""),s.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(2,7,2,0.94);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;",s.innerHTML=`
    <div style="max-width:560px;width:100%;text-align:center;">
      <div style="color:#72ff23;font-weight:900;font-size:20px;margin-bottom:10px;">🎬 Your trailer is ready</div>
      <video src="${r}" controls playsinline style="width:100%;max-height:55vh;border-radius:14px;border:1px solid rgba(114,255,35,0.3);background:#000;"></video>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
        <button type="button" data-trailer-share style="background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:12px 22px;font-weight:800;cursor:pointer;">Share</button>
        <a href="${r}" download="${a}" style="background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.35);color:#eaffe0;border-radius:999px;padding:12px 22px;font-weight:800;text-decoration:none;">Download</a>
        <button type="button" data-trailer-close style="background:none;border:1px solid rgba(114,255,35,0.2);color:#9fb59a;border-radius:999px;padding:12px 18px;cursor:pointer;">Close</button>
      </div>
      <div style="color:#7d937a;font-size:11px;margin-top:12px;">Recorded on live market data. Not financial advice.</div>
    </div>
  `,s.querySelector("[data-trailer-close]").addEventListener("click",()=>{s.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3)}),s.querySelector("[data-trailer-share]").addEventListener("click",async()=>{try{const o=new File([e],a,{type:I.mime.split(";")[0]});if(navigator.canShare?.({files:[o]})){await navigator.share({files:[o],title:"SlimeWire",text:"SlimeWire - verify before you ape. slimewire.org"});return}}catch{}s.querySelector("a[download]")?.click()}),document.body.appendChild(s)}function Rk(){const e=I.recorder;if(!e)return;const t=()=>{try{const a=new Blob(I.chunks,{type:I.mime.split(";")[0]});a.size>0&&Bk(a)}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();I.stream?.getTracks().forEach(a=>{try{a.stop()}catch{}}),I.recorder=null,I.stream=null}function Rl(e="done"){if(I.running){I.running=!1,I.timers.forEach(t=>clearTimeout(t)),I.timers=[],Rk();try{I.audio?.ctx?.close()}catch{}I.audio=null,I.root?.remove(),I.root=null}}function Ik(){const e=n.livePairsByBucket?.live?.rows||n.livePairs?.rows||n.livePairRows||[];return[...e].filter(a=>a?.tokenMint).sort((a,r)=>(Number(r.volume5m)||0)-(Number(a.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(a.bestPickScore||a.score)||0))[0]||e[0]||null}async function Ok(e=9e3){const t=Date.now();for(;Date.now()-t<e;){const a=Ik();if(a)return a;if(!I.running)return null;await xa(500)}try{return((await k("/api/web/live-pairs?bucket=live&sort=fresh"))?.livePairs?.rows||[]).find(s=>s?.tokenMint)||null}catch{return null}}async function Ek(e,t=4e3){const a=Date.now();for(;Date.now()-a<t;){if(document.querySelector(e))return!0;if(!I.running)return!1;await xa(250)}return!1}function Fk(){return new Promise(e=>{wr(`
      <div style="color:#72ff23;font-weight:900;font-size:clamp(20px,6vw,28px);">🎬 TRAILER MODE</div>
      <div style="color:#d6ffbf;font-size:clamp(13px,3.8vw,16px);margin-top:14px;max-width:420px;line-height:1.5;">
        1. Start your phone's <b>screen recorder</b> now<br>
        (Control Center on iPhone / quick tile on Android)<br>
        2. Come back and tap GO
      </div>
      <button type="button" data-trailer-go style="pointer-events:auto;margin-top:22px;background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:14px 44px;font-weight:900;font-size:18px;cursor:pointer;">GO</button>
      <div style="color:#7d937a;font-size:11px;margin-top:14px;">the performance starts on a 3-2-1 after you tap</div>
    `),I.root.querySelector("[data-trailer-go]")?.addEventListener("click",()=>e(!0),{once:!0})})}async function Wk(){if(I.running)return;I.running=!0,mo(),Tk();const e=await Mk(),t=$k();if(!e&&(await Fk(),!I.running))return;Te("/terminal/live-pairs"),wr('<div style="color:#72ff23;font-weight:900;font-size:clamp(18px,5vw,24px);animation:twPulse 1.2s infinite;">locking onto live pairs...</div>');const a=await Ok(9e3);if(!I.running)return;const r=3,s=6.5,o=9,c=6.5,l=4.6,u=[r,r+s,r+s+o,r+s+o+c],d=r+s+o+c+l;Ck(u,d);const f=(I.audio?.ctx?.currentTime||0)+.05;for(let g=0;g<r;g+=1)Pk(f+g,600+g*90);for(let g=r;g>=1;g-=1){if(!I.running)return;wr(`<div style="color:#72ff23;font-size:clamp(64px,22vw,110px);font-weight:900;text-shadow:0 0 30px rgba(114,255,35,0.75);animation:twPulse 1s infinite;">${g}</div>`),await xa(1e3)}if(wr(""),!I.running)return;fo(),ho("FRESH PAIRS. SECONDS OLD.","every pump.fun launch lands here instantly"),await xa(s*1e3);const y=a?.symbol?`$${String(a.symbol).slice(0,12)}`:"live pair";if(I.running&&a?.tokenMint){fo(),Te(`/terminal/chart?token=${encodeURIComponent(a.tokenMint)}`);const g=await Ek("iframe[src*='dexscreener'], .smart-chart-terminal iframe, [data-chart] canvas",4500);if(!I.running||(ho("CHARTS WITH A BRAIN",`${y} - live candles, live flow, shield verdict on top`),await xa((g?o:4)*1e3),!I.running))return;fo(),$p(a.tokenMint),ho("TRIPLE-ENGINE RUG CHECK","SlimeShield x Rugcheck x GoPlus - dodge the rug BEFORE you ape"),await xa(c*1e3),il()}I.running&&(ho(""),fo(),wr(`
    <div style="color:#72ff23;font-size:clamp(38px,11vw,76px);font-weight:900;letter-spacing:0.05em;animation:twGlow 1.6s infinite, twPulse 1.6s infinite;">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(15px,4.4vw,23px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:clamp(10px,3vw,12px);margin-top:26px;">Live market data. Not financial advice.</div>
  `),await xa(l*1e3),Rl("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),I.running||Wk())});
