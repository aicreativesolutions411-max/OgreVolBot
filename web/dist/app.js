import{canSubmitPerpOrder as ym,createPerpsProvider as vm,ogreTekRouteStatus as wm,resolveOgreTekConfig as Sm,shouldShowOgreTekNav as km,validatePerpOrder as $m}from"./perps.js";import{smartChartSuggestion as Tm,tradeActionLabelFromPreset as Am}from"./liveTerminalUi.js";const xa=window.OGRE_PORTAL_CONFIG||{},Pm=xa.featureFlags||{};function _(e,t=!0){const a=Pm?.[e];return a==null||a===""?!!t:typeof a=="boolean"?a:["1","true","yes","on"].includes(String(a).toLowerCase())}const Jt=xa.pumpLive||{},ke=Sm(xa),Cm=!1,wr=vm(ke),Lm=String(xa.apiBase||"").trim().replace(/\/+$/,""),xm=window.location.origin.replace(/\/+$/,""),Rl="https://ogrevolbot.onrender.com",Ct=String(xa.shareUrl||xa.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",Il=[Lm,window.location.hostname.endsWith("onrender.com")?xm:"",Rl].filter(Boolean);let Sr=Il[0]||Rl;const Sn=6e4,gs=15e3,Yt=1e4,bs=8e3,kn=8e3,Ol=new Map,Mm=new Map,ht=Mm,Qt=new Set,kr=new Map,Ok=new Map,$n={},te=18e4,ys="slimewireMobileWalletPending",vs="slimewireMobileWalletPendingBackup",Bm="slimewireMobileWalletSession:",El="slimewirePerfLog",Fl="slimewireCrashLog",Rm="slimewireTerminalFeedLog",Wl="slimewireOgreAiRecentMints",Nl="slimewireOgreAiFormPreset",Im=150,Om=1500,Em=1e4,Fm=140,Dl="live-pairs-inflight",Wm=[1200,4500,1e4],Nm=15e3,_l=650,Dm=3500,_m=12e3,Um=3e4,qm=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Ul="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",Hm=new Map([...Ul].map((e,t)=>[e,t]));function Km(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function Tn(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function ws(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function ql(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function Hl(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function Ss(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function Vm(){try{const e=JSON.parse(window.localStorage?.getItem(El)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function zm(){try{const e=JSON.parse(window.localStorage?.getItem(Fl)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function Kl(){try{const e=JSON.parse(window.sessionStorage?.getItem(Wl)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function jm(e){const t=[...Array.isArray(e?.plans)?e.plans.map(o=>o?.tokenMint||o?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(o=>o?.tokenMint):[]].map(o=>String(o||"").trim()).filter(Boolean);if(!t.length)return;const a=new Set,r=[...Kl(),...t].filter(o=>a.has(o)?!1:(a.add(o),!0)).slice(-30);try{window.sessionStorage?.setItem(Wl,JSON.stringify(r))}catch{}}function Vl(){try{const e=JSON.parse(window.sessionStorage?.getItem(Nl)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function Gm(e={}){try{window.sessionStorage?.setItem(Nl,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function zl(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),a=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(a||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function Xm(){let e={};try{e=JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{e={}}try{const t=new URLSearchParams(window.location.search);if(t.has("lc_n")||t.has("lc_s")){const a={lc_n:"name",lc_s:"symbol",lc_d:"description",lc_x:"x",lc_tg:"telegram",lc_web:"website"};for(const o in a){const s=t.get(o);s&&(e[a[o]]=o==="lc_s"?s.toUpperCase().slice(0,12):s)}const r=t.get("lc_dev");r&&Number(r)>0&&(e.devBuySol=String(r),e.devBuyEnabled=!0);try{Ma(e)}catch{}try{window.history.replaceState(null,"",window.location.pathname+window.location.hash)}catch{}}}catch{}return e}function Ma(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,String(t.bannerDataUrl||"").length>=15e5&&delete t.bannerDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function Jm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function Ym(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function Qm(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const jl="slimewireIntroCompleteV1";function Gl(){try{return window.sessionStorage?.getItem(jl)==="true"}catch{return!1}}function Zm(){try{window.sessionStorage?.setItem(jl,"true")}catch{}}function An({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const n={token:Km(),user:null,route:Ha(window.location.pathname),activeTab:window.location.pathname.includes("/launch-coin")||/[?&]lc_n=/i.test(window.location.search)?"launchCoin":window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:Vm(),crashLog:zm(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:Xm(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:Jm(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:ql(),loginCollapsed:!0};let Ba=null,$r="";const ks=new Set;let Ra=null,Tr="",Ia=null,Ar="",Zt=null,Oa=null,tt=0,Ea=null,Pr="",Fa=null,Cr="",Lr=null,Lt=[],xr=null,Mr=null,Br=!1,Pn=[],$s=null,ea=null,ta=null,Cn=null,Ts="",Xl=0,ef=0,As=0,Rr=null,Wa=!1;const Ir=new Map,Ps={},aa=new Map,Na=[];let Cs=null,Ls=null,xs=null,Ms=null,Bs=null,Rs=0,Is=new Set,Os=null,na=null,Or=null,Es=null,Jl=Date.now();function Da(){return!!(n.slimeShieldDetails?.open||n.devInfoDetails?.open||n.kolDumpDetails?.open||n.replayDetails?.open)}function _a(){Ba&&clearTimeout(Ba),Ba=null,$r=""}function Er(){Da()||(ua(),Ua("details-close"))}function tf(e,t){const a=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const l=a(c);l&&!r.has(l)&&r.set(l,c)}let o=e.querySelector(":scope > .signal-header")||null;const s=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const l=a(c);let u=l?r.get(l):null;u?(s.add(l),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,o?o.nextElementSibling!==u&&o.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),o=u}for(const[c,l]of r)s.has(c)||l.remove()}function af(e,t){const a=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!a?e.insertBefore(r,e.firstChild):a&&!r?a.remove():a&&r&&a.innerHTML!==r.innerHTML&&(a.innerHTML=r.innerHTML);for(const o of["[data-cooks-best]","[data-cooks-newest]"]){const s=e.querySelector(`:scope > ${o}`),c=t.querySelector(`:scope > ${o}`);if(!c){s&&s.remove();continue}if(!s)return!1;const l=s.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");l&&u&&l.innerHTML!==u.innerHTML&&(l.innerHTML=u.innerHTML);const d=s.querySelector(":scope > .signal-list"),p=c.querySelector(":scope > .signal-list");d&&p?tf(d,p):d!==p&&s.replaceWith(c)}return!0}let Yl=0;if(typeof window<"u"){const e=()=>{Yl=Date.now()};window.addEventListener("wheel",e,{passive:!0}),window.addEventListener("touchmove",e,{passive:!0}),window.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Spacebar"].includes(t.key)&&e()},{passive:!0})}function nf(){if(n.activeTab!=="live"&&n.activeTab!=="terminal")return!1;const e=m("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const a=Ne(),r=be(a?.rows||[]),o=fn(r);if(!o.length)return!1;const s=Xn(),c=[];{const p=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<p){const g=f.getAttribute("data-token-chart")||"";if(g&&c.push({mint:g,top:y}),c.length>=6)break}}}const l=document.createElement("div");l.innerHTML=hl(o);const u=l.querySelector(".cooks-feed");if((!u||!af(t,u))&&(t.outerHTML=hl(o)),c.length&&(s||Date.now()-Yl>450)){const p=e.querySelector(".cooks-feed");for(const f of c){const y=p?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const g=y.getBoundingClientRect().top-f.top;Number.isFinite(g)&&Math.abs(g)>1&&window.scrollBy(0,g);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const p=Mt.find(([f])=>f===n.livePairBucket)?.[1]||"Live";d.textContent=`${p} | ${o.length} live`}return!0}function Ua(e="live-pairs-batch"){if(e&&Is.add(String(e)),Bs||Rs)return;const t=()=>{const a=Array.from(Is);if(Bs=null,Is=new Set,Rs=0,n.route!=="terminal"||!["terminal","live","slimeScope"].includes(n.activeTab)||Da()||(W({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(Ne()?.rows)?Ne().rows.length:0,details:a.length?a.slice(-3).join(" | "):e}),(n.activeTab==="live"||n.activeTab==="terminal")&&nf()))return;const r=mi();h(),fi(r)};Bs=window.setTimeout(()=>{Rs=window.requestAnimationFrame(t)},Fm)}const m=e=>document.querySelector(e);function G(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const v=(e,t)=>{e&&(e.textContent=t)},Re=(e,t)=>{v(m(e),t)},xt=(e,t)=>{const a=m(e);a&&(a.hidden=t)},se=m("[data-app]"),Ln=m("[data-login]"),Ql=m("[data-connect]"),Fs=m("[data-top-login]"),Ae=m("[data-login-modal]"),Zl=m("[data-auth-actions]"),ec=m("[data-guest-actions]"),tc=m("[data-session-actions]"),ae=m("[data-dashboard]"),rf=m("[data-error]"),of=m("[data-dashboard-error]");function ne(e){if(!_("debugPerformanceCounters",!1))return;const t=String(e||"counter");$n[t]=Number($n[t]||0)+1,($n[t]<=5||$n[t]%25===0)&&console.info("[slimewire_debug_counter]",t,$n[t])}const Mt=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],sf=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],Ws=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],qa=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],lf=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],cf=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],uf=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],df=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],pf=Object.fromEntries(df.map(e=>[e.tabKey,e])),mf=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function ac(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function nc(e,t=""){const a=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return ac(a)===ac(t)}function ff(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!nc(e,t))return t;const a=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return a.includes("phantom")?ja("phantom"):a.includes("solflare")?ja("solflare"):a.includes("wallet")||a.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":a.includes("powered-by")||a.includes("wordmark")||a.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":bl(e?.alt||a||"slimewire")}function rc(e,t="",a="fallback"){try{console.info("[slimewire_image_fallback]",{action:a,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function hf(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const a=ff(t);if(!a||nc(t,a)){t.hidden=!0,rc(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=a,rc(t,a,"fallback")}function Ns(){Ns.installed||(Ns.installed=!0,document.addEventListener("error",hf,!0))}function Ds(){if(!Ds.started){Ds.started=!0;for(const e of mf)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function Ha(e=window.location.pathname){return(e==="/"||e==="")&&Gl()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function gf(){if(Gl()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let xn=null;function _s(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(xn||(xn=new e),xn.state==="suspended"&&xn.resume().catch(()=>{}),xn):null}catch{return null}}function bf(){const e=_s();if(!(!e||e.state!=="running"))try{const t=e.currentTime,a=1.7,r=Math.floor(e.sampleRate*a),o=e.createBuffer(1,r,e.sampleRate),s=o.getChannelData(0);for(let f=0;f<r;f+=1)s[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=o;const l=e.createBiquadFilter();l.type="bandpass",l.Q.value=.7,l.frequency.setValueAtTime(280,t),l.frequency.exponentialRampToValueAtTime(3400,t+.55),l.frequency.exponentialRampToValueAtTime(170,t+a);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+a),c.connect(l).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const p=e.createGain();p.gain.setValueAtTime(1e-4,t),p.gain.exponentialRampToValueAtTime(.38,t+.08),p.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(p).connect(e.destination),c.start(t),c.stop(t+a),d.start(t),d.stop(t+1.2)}catch{}}function yf(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),a=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let o=!1,s=null;const c=()=>n.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),l=T=>{t&&(t.dataset.introPhase=T)},u=T=>{r&&(r.textContent=T,r.hidden=!T)},d=()=>{o||(o=!0,s&&(clearTimeout(s),s=null),l("portal"),bf(),Zm(),setTimeout(()=>{An({reset:!0}),$e("/connect")},620))};if(!c()){An({reset:!0});return}const p=()=>{o||(_s(),a&&a.muted&&(a.muted=!1,a.volume=1,a.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(T=>{document.addEventListener(T,p,{once:!0,passive:!0})}),a&&(a.preload="auto",a.playsInline=!0,a.autoplay=!0,a.setAttribute("autoplay",""),a.setAttribute("playsinline",""),a.disablePictureInPicture=!0,!a.getAttribute("src")&&a.dataset.introSrc&&(a.src=a.dataset.introSrc));const f=T=>{s&&clearTimeout(s),s=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,T)))},y=()=>{if(o||!c())return;const T=b=>{if(!a)return;a.muted=b,a.volume=b?0:1;const A=a.play?.();A?.catch&&A.catch(()=>{b?u(""):T(!0)})};_s(),T(!1)};a?.addEventListener("loadedmetadata",()=>{const T=Number(a.duration);f(Number.isFinite(T)&&T>0?(T+2.5)*1e3:9e3)}),a?.addEventListener("ended",d),a?.addEventListener("error",()=>{f(1500)});let g=!1,S=null;const P=()=>{g||o||!c()||(g=!0,y())};a?(a.readyState>=4?P():(a.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),a.addEventListener("waiting",()=>{!g||o||(S&&clearTimeout(S),S=setTimeout(()=>{c()&&d()},900))}),["playing","timeupdate"].forEach(T=>a.addEventListener(T,()=>{S&&(clearTimeout(S),S=null)}))):P(),f(11e3)}function oc(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function Us({keepLogin:e=!1}={}){n.walletConnectMenuOpen=!1,e||(n.loginModalOpen=!1),n.quickBuyModal?.open&&(n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""}),Vn()}function $e(e,t=null){const a=L(),r=e||"/terminal";n.route=Ha(r),Us({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.route==="terminal"&&(n.activeTab=t||oc(r)),n.route!=="intro"&&An({reset:!0}),window.history.pushState({},"",r),Hi(),h(),H("route-change",a,{component:"router",details:r})}window.addEventListener("popstate",()=>{n.route=Ha(),Us({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.activeTab=oc(),n.route!=="intro"&&An({reset:!0}),Hi(),h()});let sc=!1;function qs(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Fr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),qs()}function vf(e){if(!e)return;const t=!e.open;if(Fr(e),e.open=t,t){const a=e.closest("[data-market-ticker]"),o=e.querySelector("summary")?.getBoundingClientRect?.();if(a&&o){const s=Math.max(10,Math.min(window.innerWidth-10,o.left+o.width/2)),c=Math.max(30,o.bottom+4);a.style.setProperty("--ticker-menu-left",`${Math.round(s)}px`),a.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}qs()}function wf(){sc||(sc=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Fr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Fr(),80);return}const a=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");a&&(e.preventDefault(),e.stopPropagation(),vf(a.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&qs()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Fr()}))}function Ka(e){return`${Sr}${e}`}function L(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function ra(e){try{window.performance?.mark?.(e)}catch{}}function ye(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function ic(e={}){Na.push(e),Na.length>10&&Na.splice(0,Na.length-10),!Cs&&(Cs=window.setTimeout(()=>{Cs=null;const t=Na.splice(0,Na.length);for(const a of t)try{const r=JSON.stringify(a),o=Ka("/api/web/perf-event");if((o.charAt(0)==="/"||o.indexOf(location.origin)===0)&&navigator.sendBeacon){const c=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(o,c))continue}fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function Hs(e,t,a){if(a==="perf"&&Ls||a==="crash"&&xs||a==="feed"&&Ms)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},o=window.setTimeout(()=>{a==="perf"&&(Ls=null),a==="crash"&&(xs=null),a==="feed"&&(Ms=null),r()},Om);a==="perf"&&(Ls=o),a==="crash"&&(xs=o),a==="feed"&&(Ms=o)}function W(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&ne("slowApiRequestWarning");const a={at:new Date().toISOString(),route:ye(e.route||n.route||Ha(),40),component:ye(e.component||"",60),action:ye(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ye(e.requestId||"",80),errorCode:ye(e.errorCode||"",60),details:ye(e.details||"",140)};return n.perfLog=[...n.perfLog||[],a].slice(-100),Hs(El,()=>n.perfLog,"perf"),(a.durationMs>=Im||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(a.action))&&ic(a),a}function H(e,t,a={}){W({...a,action:e,durationMs:L()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",a=""){ra("chartFirstPaint"),W({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!Ye(a)?.cacheHit,stale:!!Ye(a)?.stale,details:`${ye(t,20)}:${ye(a,60)}`})};function Ks(e={}){const t={at:new Date().toISOString(),route:ye(e.route||n.route||Ha(),40),actionBeforeCrash:ye(e.actionBeforeCrash||n.postTradeRefresh?.action||"",70),errorCode:ye(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ye(e.message||"",160),component:ye(e.component||"",80),requestId:ye(e.requestId||n.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return n.crashLog=[...n.crashLog||[],t].slice(-50),Hs(Fl,()=>n.crashLog,"crash"),ic({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Sf(){n.crashInstrumentationInstalled||(n.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||Ks({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};Ks({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function gt(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function Vs(e="",t="",a=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(a||"").trim()}`}function at(e="",t="",a=""){const r=Vs(e,t,a),o=n.tradeActionLocks?.[r];return o&&["clicked","submitting","submitted","confirming"].includes(o.state)?o:null}function V(e="",t="",a="",r={}){const o=Vs(e,t,a),s=n.tradeActionLocks?.[o]||{};n.tradeActionLocks={...n.tradeActionLocks||{},[o]:{...s,action:e,tokenMint:t,detail:a,updatedAt:new Date().toISOString(),...r}},ie()}function Pe(e="",t="",a="",r=2400){const o=Vs(e,t,a);window.setTimeout(()=>{const s=n.tradeActionLocks?.[o];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const c={...n.tradeActionLocks||{}};delete c[o],n.tradeActionLocks=c,ie(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},r)}function Wr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function zs(e="",t=""){const a=n.manualSellActions?.[Wr(e,t)];return a&&["clicked","submitting","submitted","confirming"].includes(a.state)?a:Object.entries(n.manualSellActions||{}).find(([r,o])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(o?.state))?.[1]||null}function oa(e,t,a={}){const r=Wr(e,t),o=n.manualSellActions?.[r]||{};n.manualSellActions={...n.manualSellActions||{},[r]:{...o,tokenMint:e,percent:String(t||o.percent||"100"),updatedAt:new Date().toISOString(),...a}},ie()}function js(e,t,a=2400){const r=Wr(e,t);window.setTimeout(()=>{const o=n.manualSellActions?.[r];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const s={...n.manualSellActions||{}};delete s[r],n.manualSellActions=s,ie(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},a)}function Va(e,t={}){const a=L(),r=t.startedAt||n.positionRefreshAction?.startedAt||a;n.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(n.positionRefreshAction?.minUntil||0,a+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},ie()}function Ke(e,t={}){const a=n.positionRefreshAction?.minUntil||0,r=Math.max(0,a-L());xr&&window.clearTimeout(xr),xr=window.setTimeout(()=>{xr=null,Va(e,t),h(),e==="success"&&window.setTimeout(()=>{n.positionRefreshAction?.state==="success"&&(n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},ie(),h())},900)},r)}function Bt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function ie(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(s=>{const c=s.dataset.positionSell||"",l=s.dataset.positionSellPercent||"",u=zs(c,l),d=Bt(s),p=n.manualSellActions?.[Wr(c,l)],f=!!u;s.disabled=f,s.dataset.actionState=p?.state||u?.state||"idle",f?p?.state==="submitted"||p?.state==="confirming"?s.textContent="Submitted":s.textContent="Selling...":s.textContent=d});const e=String(n.tradeToken||m("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(s=>{const c=s.dataset.tradeBuyQuick||(s.matches("[data-trade-buy-max]")?"max":"custom"),l=at("trade-buy",e,c),u=Bt(s);s.disabled=!!l,s.dataset.actionState=l?.state||"idle",s.textContent=l?l.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(s=>{const c=s.dataset.quickTradeToken||"",l=lt(),u=He(l)||l?.amountSol||"quick",d=at("trade-buy",c,String(u)),p=Bt(s);s.disabled=!!d,s.dataset.actionState=d?.state||"idle",s.textContent=d?d.state==="submitted"?"Submitted":"Buying...":p}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(s=>{const c=s.dataset.tradeSellQuick||"custom",l=at("trade-sell",e,c),u=Bt(s);s.disabled=!!l,s.dataset.actionState=l?.state||"idle",s.textContent=l?l.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(s=>{const c=s.dataset.chartConfirmBuy||n.smartChartToken||"",l=X(m("[data-chart-buy-amount]")?.value||"")||"custom",u=at("trade-buy",c,String(l)),d=Bt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(s=>{const c=s.dataset.chartConfirmSell||n.smartChartToken||"",l=m("[data-chart-sell-percent]")?.value||"100",u=zs(c,l),d=Bt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(n.bundleToken||m("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(s=>{const c=s.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",l=at(c,t,"bundle"),u=Bt(s);s.disabled=!!l,s.dataset.actionState=l?.state||"idle",s.textContent=l?l.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const a=(s,c)=>{const l=Bt(s),u=s.matches?.("[data-top-refresh-wallet]");if(s.dataset.actionState=c,s.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){s.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",s.textContent=l||"Refresh";return}c==="clicked"||c==="refreshing"?s.textContent="Refreshing...":c==="success"?s.textContent="Updated":c==="error"?s.textContent="Failed":s.textContent=l},r=n.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(s=>{a(s,r)});const o=n.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(s=>{a(s,o)})}function kf(){if(!n.perfInstrumentationInstalled){n.perfInstrumentationInstalled=!0,ra("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries())Number(a.duration||0)<50||W({component:"main-thread",action:"long-task",durationMs:a.duration,details:a.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries()){const r=Number(a.duration||0);r<80||W({component:"input",action:"interaction-delay",durationMs:r,details:a.name||a.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Ce(e){return new Promise(t=>setTimeout(t,e))}function D(e="",t={}){const a=String(e||"");return t.preserveSafeError?a:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(a)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":a}async function Mn(e,t={},a=Sn){const r=new AbortController,o=setTimeout(()=>r.abort(),a);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(o)}}async function lc(e){try{await Mn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:a=Sn,preserveSafeError:r=!1,dedupe:o=!0,...s}=t||{},c=String(s.method||"GET").toUpperCase(),l=L(),u=o&&c==="GET"?`${c}:${e}:${n.token?n.token.slice(0,12):"guest"}`:"";if(u&&aa.has(u))return ne("duplicateApiRequestsPrevented"),W({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),aa.get(u);const d=(async()=>{const p={"Content-Type":"application/json",...s.headers||{}};n.token&&(p.Authorization=`Bearer ${n.token}`);let f,y=null;try{f=await Mn(Ka(e),{...s,headers:p,cache:"no-store"},a)}catch(S){y=S,await lc(Sr),await Ce(900);try{f=await Mn(Ka(e),{...s,headers:p,cache:"no-store"},a)}catch(P){y=P;for(const T of Il)if(T!==Sr)try{await lc(T),f=await Mn(`${T}${e}`,{...s,headers:p,cache:"no-store"},a),Sr=T;break}catch(b){y=b}if(!f){const T=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${T} SlimeWire could not connect right now. Try again in a moment.`)}}}const g=await cc(f);if(!f.ok||g.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(g.launchAttemptId||g.launch?.launchAttemptId),P=D(g.message||g.launch?.failureReason||g.error||`HTTP ${f.status}`,{preserveSafeError:S}),T=new Error(P);throw T.status=f.status,T.data=g,T.code=g.errorCode||g.launch?.errorCode||g.error||"",T.stage=g.stage||g.launch?.stage||"",T.launchAttemptId=g.launchAttemptId||g.launch?.launchAttemptId||"",T.providerStatus=g.providerStatus||g.launch?.providerStatus||null,f.status===401&&Wf(P),T}return H("api-request",l,{component:"api",details:e,resultCount:Array.isArray(g?.rows)?g.rows.length:0}),g})();return u&&(aa.set(u,d),d.then(()=>{aa.get(u)===d&&aa.delete(u)},()=>{aa.get(u)===d&&aa.delete(u)})),d}async function cc(e){const t=e.headers.get("content-type")||"",a=await e.text();if(!a.trim())return{};try{return JSON.parse(a)}catch{const r=a.toLowerCase(),o=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:o?"payload_too_large":"invalid_api_response",message:o?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function $f(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function pe(e){e&&(n.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(n.xHandle=Je(e.xHandle),n.xHandle?Hl(n.xHandle):Ss()):n.xHandle||(n.xHandle=ql()))}function Nr(e){for(const t of e){const a=Rn(t);if(a&&!a.closest("[hidden]"))return String(a.value||"")}for(const t of e){const a=m(t);if(a)return String(a.value||"")}return""}function Bn(){const e=m("[data-connect-status]");return e&&!e.closest("[hidden]")?e:Rn("[data-login-status]")||e}function Rn(e){const t=[...document.querySelectorAll(e)];return t.find(a=>!a.closest("[hidden]")&&a.offsetParent!==null)||t.find(a=>!a.closest("[hidden]"))||t[0]||null}function In(){return Rn("[data-wallet-connect-modal] [data-wallet-connect-status]")||Rn("[data-wallet-connect-status]")}function re(e=""){n.walletConnectStatus=String(e||""),v(In(),n.walletConnectStatus)}function uc(e="solana"){const t=Ee(e);return Ve()?En(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:bc(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Rt(e="solana",t=null,a={}){const r=me(e),o={walletName:Ee(e,r),userId:n.user?.id||"",route:n.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...a};try{console.warn("[slimewire_wallet_connect]",o)}catch{}}function dc(e=n.route==="connect"){window.setTimeout(()=>{const t=n.loginModalOpen?`[data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";Rn(t)?.focus?.()},0)}function Tf(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&($s=e)}function Af(){const e=$s;$s=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function pc({restoreFocus:e=!0}={}){const t=!!n.loginModalOpen;n.loginCollapsed=!0,n.loginModalOpen=!1,h({force:!0}),t&&e&&Af()}function Pf(){return!Ae||Ae.hidden||!n.loginModalOpen?[]:[...Ae.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function Cf(e){if(!n.loginModalOpen||e.key!=="Tab"||!Ae||Ae.hidden)return!1;const t=Pf();if(!t.length)return!1;const a=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===a?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),a.focus({preventScroll:!0}),!0):!1}function za(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Lf(e=za()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function mc(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function xf(e="unknown"){const t=Date.now();if(t-Number(n.lastLockInClickAt||0)<300)return;n.lastLockInClickAt=t;const a={route:mc(n.route||Ha(),40),viewport:Math.round(window.innerWidth||0),source:mc(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(a),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",a)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(a)}).catch(()=>{})}catch{}}function fc({defaultTab:e="login",returnTo:t=za(),source:a="unknown",connectPanel:r=n.route==="connect"}={}){if(Tf(),xf(a),n.loginModalOpen=!0,n.loginModalTab=e==="create"?"create":"login",n.loginReturnTo=t||za(),n.loginCollapsed=!1,n.walletConnectMenuOpen=!1,!Ae&&!Fs){window.location.assign(Lf(n.loginReturnTo));return}h({force:!0}),dc(r)}function hc(e={}){fc(e)}function Ve(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function gc(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Mf(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function bc(e=""){if(!Ve())return"";const t=encodeURIComponent(gc()),a=encodeURIComponent(Mf());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${a}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${a}`:""}function Gs(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function ja(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function Xs(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let a=0n;for(const o of t)a=(a<<8n)+BigInt(o);let r="";for(;a>0n;){const o=Number(a%58n);r=Ul[o]+r,a/=58n}for(const o of t){if(o!==0)break;r="1"+r}return r||"1"}function Dr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let a=0n;for(const o of t){const s=Hm.get(o);if(s===void 0)throw new Error("Invalid wallet callback encoding.");a=a*58n+BigInt(s)}const r=[];for(;a>0n;)r.unshift(Number(a&255n)),a>>=8n;for(const o of t){if(o!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Bf(e="phantom",t="",a=n.walletConnectReturnPath||"/terminal",r=""){const o=new URL(a||window.location.pathname||"/terminal",window.location.origin);return o.searchParams.delete("sw_wallet"),o.searchParams.delete("sw_wallet_state"),o.searchParams.delete("sw_wallet_pending"),o.searchParams.delete("phantom_encryption_public_key"),o.searchParams.delete("solflare_encryption_public_key"),o.searchParams.delete("nonce"),o.searchParams.delete("data"),o.searchParams.delete("errorCode"),o.searchParams.delete("errorMessage"),o.searchParams.set("sw_wallet",e),o.searchParams.set("sw_wallet_state",t),r&&o.searchParams.set("sw_wallet_pending",r),o.toString()}function On(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function yc(){try{const e=window.sessionStorage?.getItem(ys)||window.localStorage?.getItem(vs)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function Rf(e){try{window.sessionStorage?.setItem(ys,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(vs,JSON.stringify(e))}catch{}}function Js(){try{window.sessionStorage?.removeItem(ys)}catch{}try{window.localStorage?.removeItem(vs)}catch{}}function vc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function En(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function If(e="",t={}){const a=En(e);if(!a)return"";const r=new URL(a);return r.searchParams.set("app_url",gc()),r.searchParams.set("redirect_link",Bf(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function sa(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ve()?"mobile":"desktop"}function wc(e=""){return Ve()&&!!En(e)}function Of(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Ef(e="",t="/terminal"){try{const a=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:Sn,body:JSON.stringify({provider:e,intendedRoute:t,platform:sa(),browser:Of()})});return!a.pendingConnectId||!a.stateId||!a.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:a.pendingConnectId,stateId:a.stateId,returnPath:a.intendedRoute||t,dappEncryptionPublicKey:a.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:a.expiresAt||"",serverManaged:!0}}catch(a){return Rt(e,a,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:sa()}),null}}function Ff(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const a=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:Xs(r),returnPath:t,dappEncryptionPublicKey:Xs(a.publicKey),dappEncryptionSecretKey:Xs(a.secretKey),createdAt:Date.now(),serverManaged:!1}}async function Sc(e="",{returnPath:t=n.walletConnectReturnPath||"/terminal"}={}){if(!wc(e))return!1;const a=await Ef(e,t)||Ff(e,t);if(!a)return!1;Rf(a);const r=If(e,a);if(!r)return!1;const o=Ee(e);return re(`Opening ${o} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Rt(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:sa()}),window.location.assign(r),!0}function kc(e=""){const t=Ee(e),a=bc(e);return a?(re(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Rt(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:sa()}),window.location.href=a,!0):!1}function $c({requirePassword:e=!1}={}){const t=Nr(["[data-connect-login-username]","[data-login-username]"]).trim(),a=Nr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!a&&!e)return{};if(!t)throw new Error("Enter your username.");if(!a)throw new Error("Enter your password.");return{username:t,password:a}}function Wf(e=""){n.token="",n.user=null,n.loading=!1,ws(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function Y(e=null,t="Creating secure web profile..."){if(n.user&&n.token)return n.user;v(e,t);const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:zl()})});return n.token=a.token,pe(a.user),Tn(n.token),n.user}function $(e=""){[rf,of].forEach(t=>{t&&(t.hidden=!e,v(t,e))})}function Q(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Nf(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Tc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function Ys(){$("");const e=Bn();try{const t=$c();v(e,t.username?"Creating saved login...":"Creating account...");const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:zl()})});n.token=a.token,pe(a.user),Tn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,t.username?"Account created. Login saved.":"Quick web account created."),K(a.trade?.signature,"account-create")}catch(t){v(e,t.message),$(t.message)}}async function Ac(){$("");const e=Bn();try{const t=$c({requirePassword:!0});v(e,"Logging in...");const a=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});n.token=a.token,pe(a.user),Tn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(a.trade?.signature,"password-login")}catch(t){v(e,t.message),$(t.message)}}function Pc(){return Nr(["[data-connect-login-email]","[data-login-email]"]).trim()}function Df(){return Nr(["[data-connect-login-code]","[data-login-code]"]).trim()}function Cc(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function _f(){$("");const e=Bn();try{const t=Cc(Pc());v(e,"Sending login code...");const a=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});v(e,a.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){v(e,t.message),$(t.message)}}async function Uf(){$("");const e=Bn();try{const t=Cc(Pc()),a=Df();if(!a)throw new Error("Enter the login code from your email.");v(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:a})});n.token=r.token,pe(r.user),Tn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(r.trade?.signature,"email-code-login")}catch(t){v(e,t.message),$(t.message)}}function Lc(e="",t=new URLSearchParams){const a=yc(),r=t.get("sw_wallet_state")||"";if(!a.stateId||a.stateId!==r||a.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(a.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const o=t.get(vc(e))||"",s=t.get("nonce")||"",c=t.get("data")||"";if(!o||!s||!c)throw new Error("Wallet approval did not return the expected connection data.");const l=window.nacl;if(!l?.box?.before||!l.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=l.box.before(Dr(o),Dr(a.dappEncryptionSecretKey)),d=l.box.open.after(Dr(c),Dr(s),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const p=JSON.parse(new TextDecoder().decode(d)),f=String(p.public_key||p.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(p.session||""),walletEncryptionPublicKey:o,dappEncryptionPublicKey:a.dappEncryptionPublicKey,returnPath:a.returnPath||"/terminal"}}async function xc(e="",t={}){const a=In();await Y(a,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Ee(e)})});pe(r.user||{...n.user,connectedWallet:r.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:Ee(e),tokens:[]};try{window.sessionStorage?.setItem(`${Bm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Js(),On(),n.walletConnectMenuOpen=!1,re(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),$e(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Ur("mobile-wallet-connect")}function qf(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||yc().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(a=>a!=="data"&&a!=="nonce"),walletEncryptionPublicKey:t.get(vc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function Hf(e="",t={}){t.token&&(n.token=t.token,Tn(n.token)),pe(t.user||{...n.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const a=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";a&&(n.connectedWalletBalance={publicKey:a,shortPublicKey:w(a),provider:t.provider||Ee(e),tokens:[]}),Js(),On(),n.walletConnectMenuOpen=!1,re(a?`Connected ${w(a)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),$e(t.finalRedirectRoute||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Ur("mobile-wallet-callback")}async function Mc(e="",t=new URLSearchParams){const a=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:Sn,body:JSON.stringify(qf(e,t))});return await Hf(e,a),!0}async function Kf(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;n.walletConnectMenuOpen=!0;const a=Ee(t),r=e.get("sw_wallet_pending")||"",o=e.get("errorCode")||"",s=e.get("errorMessage")||"";if(o||s)return r&&await Mc(t,e).catch(()=>{}),Js(),On(),re(`${a} did not connect: ${s||o||"request cancelled"}. Choose another wallet or try again.`),Rt(t,new Error(s||o||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:sa()}),h({force:!0}),!0;try{if(re(`Finishing ${a} mobile connection...`),r)await Mc(t,e);else{const c=Lc(t,e);await xc(t,c)}}catch(c){if(r)try{const l=Lc(t,e);await xc(t,l)}catch{re(`${a} mobile connection could not finish: ${c.message}`),Rt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:sa()}),On(),h({force:!0})}else re(`${a} mobile connection could not finish: ${c.message}`),Rt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:sa()}),On(),h({force:!0})}return!0}async function Vf(){$("");const e=In()||Bn();try{v(e,"Choose a wallet provider to connect."),da({returnPath:"/terminal"})}catch(t){v(e,t.message),$(t.message)}}async function zf(){n.user||await Ys(),n.user&&(n.walletConnectMenuOpen=!1,n.route="terminal",n.activeTab="wallets",n.toolSections={...n.toolSections||{},wallets:n.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),n.wallets.length||await ud())}async function jf(){if(n.logoutPending)return;if(!n.user){n.loginCollapsed=!1,h(),Ln?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await ju("logging out");const e=String(n.token||"");n.logoutPending=!0;const t=m("[data-logout]");t&&(t.disabled=!0,v(t,"Logging out...")),n.token="",n.user=null,n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="",n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},n.manualSellActions={},n.tradeActionLocks={},n.ogreAgentStatus="",Sl(),ws(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{n.logoutPending=!1}}async function Gf(){if(!n.token){h();return}try{const e=await k("/api/web/me");pe(e.user),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),De({force:!1,deep:!1,reason:"session-load"}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})})}catch{n.token="",ws(),h()}}async function ia(e={}){const t=L();if(!n.user||!n.token){n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.launchWatches=[],n.presets={trade:[],bundle:[]},n.tradePlans=[],n.watchlist={rows:[],count:0},h();return}const a=!e.silent;a&&(n.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,g,S,P,T]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.pnl=y.pnl||null,n.launchWatches=g.watches||[],n.presets=S.presets||{trade:[],bundle:[]},xd(),n.watchlist=P.watchlist||{rows:[],count:0},n.tradePlans=T.plans||[],mo();return}const[o,s,c,l,u,d,p,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.wallets=o.wallets||[],n.balances=s.balances||[],n.connectedWalletBalance=s.connectedWallet||c.connectedWallet||null,n.positions=c.positions||[],n.pnl=l.pnl||null,n.launchWatches=u.watches||[],n.presets=d.presets||{trade:[],bundle:[]},xd(),n.watchlist=p.watchlist||{rows:[],count:0},n.tradePlans=f.plans||[],mo(),e.force&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="")}finally{H("load-all",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e.skipCore?"skip-core":"core"}),a&&(n.loading=!1),h()}}async function Qs(e={}){if(!n.user||!n.token)return;const t=L(),a=e.requestId||0,r=()=>a&&n.walletRefreshRequestId!==a,o=e.force?"?force=true":"",s=e.force||e.deep?"?force=true":"",c=e.timeoutMs||Sn,l=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${o}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),p=await u;if(r())return;n.balances=p.balances||[],n.connectedWalletBalance=p.connectedWallet||null,n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("wallet-refresh",t,{component:"wallet",resultCount:n.balances.length,cacheHit:!!p.cacheHit,details:`wallets=${n.wallets.length};connected=${!!n.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([l.then(g=>({ok:!0,wallets:g})).catch(g=>({ok:!1,error:g})),d.then(g=>({ok:!0,tradePlans:g})).catch(g=>({ok:!1,error:g}))]);if(!r()&&(f.ok&&(n.wallets=f.wallets.wallets||n.wallets||[]),y.ok&&(n.tradePlans=y.tradePlans.plans||n.tradePlans||[],mo()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const g=L(),S=k(`/api/web/positions${s}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await S;if(P?.__error)throw P.__error;if(r())return;n.connectedWalletBalance=P.connectedWallet||n.connectedWalletBalance||null,n.positions=P.positions||[],n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",g,{component:"positions",resultCount:n.positions.length,cacheHit:!!P.cacheHit,details:`open=${n.positions.length}`})}catch(P){n.walletRefreshError=P.message||"Position refresh failed.",H("positions-refresh",g,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(P?.message||"Position refresh failed.")})}}}function Bc(e=n.positions){return(Array.isArray(e)?e:[]).some(t=>{const a=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!a&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Rc(e=120,t="positions-value-followup"){!n.user||!n.token||(Mr&&window.clearTimeout(Mr),Mr=window.setTimeout(()=>{Mr=null,bt({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Yt}).then(a=>{a?(n.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})):_r(`${t}-failed`)}).catch(()=>_r(`${t}-failed`))},Math.max(0,Number(e)||0)))}function Xf(e=[],t=[],a={}){const r=new Map((Array.isArray(t)?t:[]).map(o=>[String(o?.tokenMint||""),o]));return(Array.isArray(e)?e:[]).map(o=>{const s=r.get(String(o?.tokenMint||""));if(!s||a.fast===!1)return o;const c=!!(o?.valuePending||/refreshing|updating|background/i.test(o?.valueError||"")),l=s.estimatedValueSol!==null&&s.estimatedValueSol!==void 0&&s.estimatedValueSol!=="";return!c||!l?o:{...o,estimatedValueSol:s.estimatedValueSol,openPnlSol:s.openPnlSol,openPnlPercent:s.openPnlPercent,valuePending:!1,valueError:""}})}function _r(e="positions-value-refresh-delayed"){let t=!1;return n.positions=(Array.isArray(n.positions)?n.positions:[]).map(a=>{const r=a?.estimatedValueSol!==null&&a?.estimatedValueSol!==void 0&&a?.estimatedValueSol!=="";return!(a?.valuePending||/refreshing|updating|background/i.test(a?.valueError||""))?a:(t=!0,{...a,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(H("positions-value-refresh-cleanup",L(),{component:"positions",details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):!1}function Ic(e="portfolio-supplemental"){if(!n.user||!n.token)return;const t=L();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Yt}),k("/api/web/pnl?force=true",{timeoutMs:Yt,dedupe:!1})]).then(([a,r])=>{a.status==="fulfilled"&&(n.balances=a.value.balances||n.balances||[],n.connectedWalletBalance=a.value.connectedWallet||n.connectedWalletBalance||null),r.status==="fulfilled"&&(n.pnl=r.value.pnl||n.pnl||null),n.lastWalletRefreshAt=new Date().toISOString(),H("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}).catch(()=>{})}async function bt(e={}){if(!n.user||!n.token)return;const t=L(),a=new URLSearchParams;e.force&&a.set("force","true"),e.fast!==!1&&a.set("fast","true");const r=a.toString()?`?${a.toString()}`:"",o=r||"full";if(Cn&&Ts===o)return Cn;const s=++As;return Ts=o,Cn=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Yt:bs)});return As!==s?!1:(n.connectedWalletBalance=c.connectedWallet||n.connectedWalletBalance||null,n.positions=Xf(c.positions||n.positions||[],n.positions||[],e),n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",t,{component:"positions",resultCount:n.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Bc(n.positions)&&Rc(120,`${e.reason||"positions"}-values`),e.syncPnl&&Ic(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(n.walletRefreshError=c.message||"Position refresh failed."),H("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(c?.message||"Position refresh failed.")}),!1}finally{As===s&&(Cn=null,Ts="")}})(),Cn}async function Jf(e={}){if(!n.user||!n.token){$("Connect your wallet before refreshing positions."),Ke("error",{error:"Wallet not connected"});return}const t=L();Va("refreshing",{startedAt:n.positionRefreshAction?.startedAt||t}),n.walletRefreshError="",Re("[data-sync-health]",jr()),ie(),await Ce(20);try{if(!await bt({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Yt}))throw new Error(n.walletRefreshError||"Position refresh failed.");n.lastWalletRefreshAt=new Date().toISOString(),Ke("success",{error:""}),Ic(`${e.reason||"positions-only"}-balances-pnl`),Bc(n.positions)&&Rc(120,`${e.reason||"positions-only"}-full-values`),H("positions-only-refresh",t,{component:"positions",resultCount:n.positions.length,details:e.reason||"positions-only"})}catch(a){const r=a?.message||"Position refresh failed.";n.walletRefreshError=r,Ke("error",{error:D(r)}),$(r),H("positions-only-refresh",t,{errorCode:a?.code||a?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(r)})}finally{h()}}function Fn(){return String(n.smartChartToken||n.tradeToken||n.bundleToken||n.volumeToken||n.terminalToken||"").trim()}function ze(e=n.activeTab){return pf[e]||null}function Ga(e=ze()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",_n(n.livePairBucket)).replace("{sort}",String(n.terminalSort||"best")).replace("{scopeMode}",String(n.slimeScopeMode||"new")).replace("{kolMode}",String(n.kolMode||"hot")).replace("{kolWallet}",n.kolWallet?w(n.kolWallet):"global").replace("{scanMode}",String(n.scanMode||"safe")).replace("{tokenMint}",Fn()?w(Fn()):"none")}function Oc(e=n.activeTab,t="pageSize",a=25){const r=ze(e),o=Number(r?.[t]);return Number.isFinite(o)&&o>0?o:a}function Xa(e=n.activeTab){return Oc(e,"pageSize",25)}function Zs(e=n.activeTab){return Math.max(Xa(e),Oc(e,"maxPageSize",Xa(e)))}function Ec(e=n.activeTab){return!!ze(e)?.supportsPagination}function ei(e=n.activeTab){const t=ze(e)||{tabKey:e};return`${e}:${Ga(t)}`}function Wn(e=n.activeTab,t=0){const a=ei(e),r=Xa(e),o=Zs(e),s=Number(n.terminalFeedVisibleLimits?.[a]||0),c=Number.isFinite(s)&&s>0?s:r,l=Number(t||0),u=Math.min(Math.max(r,c),o);return l>0?Math.min(u,l):u}function Z(e=n.activeTab){const t=ei(e);if(!n.terminalFeedVisibleLimits?.[t])return;const a={...n.terminalFeedVisibleLimits||{}};delete a[t],n.terminalFeedVisibleLimits=a}function Yf(e=n.activeTab,t=0){const a=ei(e),r=Wn(e,t),o=Xa(e),s=Zs(e),c=Number(t||0),l=Math.min(s,c>0?c:s,r+o);return n.terminalFeedVisibleLimits={...n.terminalFeedVisibleLimits||{},[a]:l},l}function nt(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return a.slice(0,Wn(e,a.length))}function Qf(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return Ec(e)&&a.length>Wn(e,a.length)}function la(e=n.activeTab,t=[],a="rows"){const r=Array.isArray(t)?t:[];if(!Qf(e,r))return"";const o=Wn(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${i(o)} of ${i(r.length)} ${i(a)} shown</small>
      <button type="button" data-terminal-load-more="${i(e)}">Load More</button>
    </div>
  `}function z(e=n.activeTab){return n.terminalFeeds[e]||{}}function Fc(e=n.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?ca():e==="kol"?n.kolLastUpdatedAt||"":e==="watchlist"?z("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?n.lastWalletRefreshAt||z(e).lastFetchAt||"":z(e).lastFetchAt||""}function It(e=n.activeTab){return e==="terminal"?Number(Ne()?.rows?.length||0)+Number(n.kolScan?.rows?.length||0):e==="live"?Number(Ne()?.rows?.length||0):e==="liveTrades"?Number(n.pnl?.trades?.length||0):e==="slimeScope"?Number(fp?.(n.slimeScopeMode)?.length||0):e==="kol"?Number(n.kolScan?.rows?.length||0):e==="watchlist"?Number(n.watchlist?.rows?.length||0):e==="smartChart"?Fn()?1:Number(cr?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?Fn()?1:0:e==="sniper"?Number(n.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(n.launchWatches?.length||0):e==="wallets"?Number(n.wallets?.length||0)+Number(n.balances?.length||0):e==="positions"?Number(n.positions?.length||0):e==="pnl"?Number(n.pnl?.trades?.length||0):e==="ogreAi"?n.ogreAiResult?1:0:e==="ogreTek"?Number(n.ogreTek?.markets?.length||0)+Number(n.ogreTek?.positions?.length||0):0}function Nn(e=n.activeTab){const t=It(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,Wn(e,t)):t}function Dn(e=n.activeTab){const t=ze(e);if(!t)return!1;const a=Date.parse(Fc(e)||"");return Number.isFinite(a)?Date.now()-a>Number(t.staleMs||3e4):!0}function Wc(e=n.activeTab){return It(e)>0||!!Fc(e)}function Zf(e=n.activeTab,t={}){const a=ze(e)||{};return{tabKey:e,label:a.label||e,category:a.category||"unknown",endpoint:a.endpoint||"",cacheKey:Ga(a),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Nn(e)??0),pageSize:Xa(e),maxPageSize:Zs(e),supportsPagination:Ec(e),hasMore:!!(t.hasMore??It(e)>Nn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function Nc(e=n.activeTab,t={}){const a=Zf(e,t);if(n.terminalFeedLog=[...n.terminalFeedLog||[],a].slice(-20),Hs(Rm,()=>n.terminalFeedLog,"feed"),a.status==="error"||a.status==="timeout"||/manual|post-trade|visibility|resume/i.test(a.reason||"")||!!(a.stale&&a.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(a)}).catch(()=>{})}catch{}return a}function eh(e=n.activeTab,t={}){const a=ze(e);if(!a)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return n.terminalFeeds={...n.terminalFeeds,[e]:{...z(e),label:a.label,category:a.category,endpoint:a.endpoint,cacheKey:Ga(a),refreshMs:a.refreshMs,staleMs:a.staleMs,pageSize:a.pageSize,maxPageSize:a.maxPageSize,supportsPagination:!!a.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function ti(e=n.activeTab,t="",a="success",r={}){const o=ze(e);if(!o)return;const s=It(e),c=Nn(e),l={...z(e),label:o.label,category:o.category,endpoint:o.endpoint,cacheKey:Ga(o),refreshMs:o.refreshMs,staleMs:o.staleMs,pageSize:o.pageSize,maxPageSize:o.maxPageSize,supportsPagination:!!o.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:a,lastFetchAt:new Date().toISOString(),resultCount:s,renderedCount:c,hasMore:s>c,stale:a!=="success"||Dn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};n.terminalFeeds={...n.terminalFeeds,[e]:l},Nc(e,{requestId:t,status:a,reason:l.lastReason,resultCount:s,renderedCount:c,hasMore:l.hasMore,stale:l.stale,errorCode:l.errorCode,errorMessage:l.errorMessage})}function th(e=n.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function ah(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function ee(e=n.activeTab,t={}){const a=L(),r=ze(e);if(!r)return null;if(t.ifStale&&Wc(e)&&!Dn(e)||z(e).inFlight)return z(e);const o=ah(t),s=Date.now(),c=Number(Ol.get(e)||0);if(!o&&c&&s-c<kn)return z(e);if(th(e)&&!n.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return ti(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),z(e);Ol.set(e,s);const l=eh(e,t);if(o&&t.renderStart!==!1){const u=n.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[Ot({silent:!0,force:!!t.force})];n.kolWallet||u.push(zr(n.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await Hr({silent:t.silent!==!1,bucket:n.livePairBucket,force:!!t.force});else if(e==="liveTrades")n.user&&n.token&&await ia({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[Ot({silent:!0,force:!!t.force}),qn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];n.kolScan||u.push(zr(n.kolMode,n.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await zr(n.kolMode,n.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await Uc({silent:t.silent!==!1});else if(e==="sniper")await qn(n.scanMode,{silent:t.silent!==!1});else if(e==="positions")n.user&&n.token&&await bt({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:bs});else if(["wallets","pnl"].includes(e))n.user&&n.token&&await De({force:!!t.force,deep:!1});else if(e==="smartChart")n.user&&n.token&&await De({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[Ot({silent:!0,force:!!t.force})];n.user&&n.token&&u.push(ia({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[Ot({silent:!0,force:!!t.force})];n.scan||u.push(qn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),n.user&&n.token&&u.push(ia({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await br({silent:!0}).catch(u=>{n.ogreTek.error=u.message});return ti(e,l,"success"),z(e)}catch(u){if(ti(e,l,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:D(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return z(e)}finally{H("feed-refresh",a,{component:r.component||e,resultCount:It(e),cacheHit:!!z(e).cacheHit,stale:Dn(e),requestId:z(e).lastRequestId||"",errorCode:z(e).errorCode||"",details:`${e}:${Ga(r)}`}),t.render!==!1&&(!o&&si()?Gc():h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"&&e==="smartChart"}))}}async function Ja(e={}){const t=n.activeTab||"terminal",a=[ee(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(a)}function Ur(e="terminal-entry"){n.route==="terminal"&&(Ja({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),n.user&&n.token&&De({force:!0,deep:!1,reason:e}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})}))}function ai(){const e=()=>{Fa&&clearTimeout(Fa),Fa=null,Cr=""};if(n.route!=="terminal"||document.hidden){e();return}const t=ze(n.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(n.activeTab)){e();return}const a=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${n.activeTab}:${Ga(t)}:${a}`;Fa&&Cr===r||(e(),Cr=r,Fa=setTimeout(async()=>{Fa=null,Cr="",!(n.route!=="terminal"||document.hidden)&&(await ee(n.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(o=>$(o.message)),ai())},a))}function _n(e){const t=String(e||"live");return Mt.some(([a])=>a===t)?t:"live"}function Dc(e=n.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function qr(e=n.activeTab){return e==="slimeScope"?Dc(n.slimeScopeMode):_n(n.livePairBucket)}function Ne(e=qr()){const t=_n(e);return n.livePairsByBucket[t]||(t===n.livePairBucket?n.livePairs:null)||null}function ca(e=qr()){const t=_n(e);return n.livePairsLastUpdatedByBucket[t]||(t===n.livePairBucket?n.livePairsLastUpdatedAt:"")||""}function _c(e=[]){return Array.isArray(e)&&e.length>0}function Ie(e={},t={},a=[]){for(const r of a){const o=e?.[r];if(o!=null&&o!=="")return o}for(const r of a){const o=t?.[r];if(o!=null&&o!=="")return o}return""}function nh(e=[],t=[]){const a=new Map((Array.isArray(e)?e:[]).map(r=>[ga(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const o=a.get(ga(r));return o?{...o,...r,tokenMint:Ie(r,o,["tokenMint","mint","tokenAddress","address"]),mint:Ie(r,o,["mint","tokenMint","tokenAddress","address"]),symbol:Ie(r,o,["symbol","ticker","shortMint"]),name:Ie(r,o,["name","tokenName","category"]),imageUrl:Ie(r,o,["imageUrl","image","icon","logoURI","logoUrl"]),image:Ie(r,o,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Ie(r,o,["avatarUrl","avatar_url","avatar"]),avatarState:Ie(r,o,["avatarState"]),dexUrl:Ie(r,o,["dexUrl","url"]),pumpUrl:Ie(r,o,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Ie(r,o,["websiteUrl","website"]),twitterUrl:Ie(r,o,["twitterUrl","xUrl"]),telegramUrl:Ie(r,o,["telegramUrl"]),metadata:r?.metadata||o?.metadata||r?.tokenMetadata||o?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||o?.tokenMetadata||r?.metadata||o?.metadata||null,dex:r?.dex||o?.dex||r?.dexScreener||o?.dexScreener||null,pump:r?.pump||o?.pump||r?.pumpFun||o?.pumpFun||null}:r})}async function Hr({silent:e=!1,bucket:t=n.livePairBucket,renderOnComplete:a=!0,force:r=!1}={}){const o=L(),s=_n(t),c=s===n.livePairBucket,l=n.terminalSort||"best",u=`${s}:${l}`,d=Ir.get(u);if(d?.promise){n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[s]:d.requestId},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const P=n.livePairsByBucket?.[s]?.rows||(c?n.livePairs?.rows:[]);return!e&&!_c(P)&&Ua(Dl),d.promise}const p=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(Ps[s]||0)+1;Ps[s]=f;const y=()=>Ps[s]===f;n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[s]:p},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const g=n.livePairsByBucket?.[s]?.rows||(c?n.livePairs?.rows:[]);!e&&!_c(g)&&Ua(Dl);const S=(async()=>{try{const P=r?"&force=true":"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(s)}&sort=${encodeURIComponent(l)}${P}`,b=await Promise.race([k(T),new Promise((U,We)=>window.setTimeout(()=>We(new Error("Live feed refresh timed out.")),12e3))]),A=Mt.find(([U])=>U===s)?.[1]||"Live",C=n.livePairsByBucket[s]||(c?n.livePairs:null);let M=b.livePairs||{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${A} feed returned no rows yet. Retrying automatically.`};const q=Array.isArray(M?.rows)?M.rows:[],J=Array.isArray(C?.rows)?C.rows:[];if(q.length===0&&J.length>0?M={...C,...M,rows:C.rows,stale:!0,emptyRefresh:!0,message:`${A} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:q.length>0&&J.length>0&&(M={...M,rows:nh(J,q)}),!y())return M;const Se=M?.refreshedAt||new Date().toISOString(),et={...n.livePairsRefreshErrorByBucket||{}};return delete et[s],n.livePairsRefreshErrorByBucket=et,n.livePairsByBucket={...n.livePairsByBucket,[s]:M},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[s]:Se},c&&(n.livePairs=M,n.livePairsLastUpdatedAt=Se),M}catch(P){const T=D(P?.message||"Live feed refresh failed."),b=Mt.find(([M])=>M===s)?.[1]||"Live",A=n.livePairsByBucket[s]||(c?n.livePairs:null),C=A?{...A,stale:!0,refreshError:T,message:`Showing last good ${b} feed. Refresh failed, retrying automatically.`}:{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:T,message:`${b} refresh failed. Retrying automatically.`};return y()&&(n.livePairsRefreshErrorByBucket={...n.livePairsRefreshErrorByBucket||{},[s]:T},n.livePairsByBucket={...n.livePairsByBucket,[s]:C},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[s]:C.refreshedAt},c&&(n.livePairs=C,n.livePairsLastUpdatedAt=C.refreshedAt)),C}finally{if(!y())return;const P=n.livePairsByBucket?.[s]?.rows||[];H("live-pairs-refresh",o,{component:"livePairs",resultCount:Array.isArray(P)?P.length:0,stale:!!n.livePairsByBucket?.[s]?.stale,errorCode:n.livePairsRefreshErrorByBucket?.[s]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${s}:${l}`});const T={...n.livePairsLoadingByBucket};(T[s]===p||T[s]===!0)&&(delete T[s],n.livePairsLoadingByBucket=T),n.livePairsLoading=!!T[n.livePairBucket],!e&&c&&(n.loading=!1),a&&(c&&["terminal","live","slimeScope"].includes(n.activeTab)?Ua("load-live-pairs-complete"):h())}})();return Ir.set(u,{requestId:p,requestVersion:f,safeBucket:s,promise:S}),S.finally(()=>{Ir.get(u)?.requestId===p&&Ir.delete(u)}),S}async function Ot({silent:e=!1,force:t=!1,warmAll:a=!1}={}){if(await Hr({silent:e,bucket:n.livePairBucket,force:t}),a){const r=Mt.map(([o])=>o).filter(o=>o!==n.livePairBucket);await Promise.allSettled(r.map(o=>Hr({silent:!0,bucket:o,renderOnComplete:!1,force:t})))}(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope")&&Ua(a?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function ua(){if(Kn()||document.hidden||Da()||n.activeTab!=="live"&&n.activeTab!=="terminal"&&n.activeTab!=="slimeScope"){_a();return}const e=qr(n.activeTab),a=(n.activeTab==="slimeScope"?12:8)*1e3,r=`${n.activeTab}:${e}:${n.terminalSort}:${a}`;Ba&&$r===r||(_a(),$r=r,Ba=setTimeout(async()=>{if(Ba=null,$r="",document.hidden||Da()){ua();return}if(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"){if(n.livePairsLoadingByBucket?.[e]){ua();return}try{n.activeTab==="slimeScope"?await ee("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Hr({silent:!0,bucket:n.livePairBucket,force:!1})}catch{}finally{ua()}}},a))}function rh({force:e=!1}={}){if(Kn()||!(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"))return;const a=qr(n.activeTab),r=`${a}:${n.terminalSort||"best"}`;ks.has(r)||n.livePairsLoadingByBucket[a]||!e&&n.livePairsByBucket[a]||(ks.add(r),window.setTimeout(()=>{const o=n.activeTab==="slimeScope"?ee("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):Ot({silent:!0,force:!0,warmAll:!1});Promise.resolve(o).catch(s=>$(s.message)).finally(()=>{ks.delete(r),ua()})},900))}function Kr(){const e=()=>{Ra&&clearTimeout(Ra),Ra=null,Tr=""};if(document.hidden||n.activeTab!=="sniper"){e();return}const t=`${n.activeTab}:${n.scanMode}`;Ra&&Tr===t||(e(),Tr=t,Ra=setTimeout(async()=>{if(Ra=null,Tr="",document.hidden){Kr();return}if(n.activeTab==="sniper"){if(n.loading){Kr();return}try{await qn(n.scanMode,{silent:!0})}catch(a){$(a.message)}finally{Kr()}}},2e4))}function Un(){const e=()=>{Ia&&clearTimeout(Ia),Ia=null,Ar=""};if(Kn()||document.hidden||n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet){e();return}const t=String(n.kolMode||"hot"),o=t==="hot"||t==="fresh"?1e4:3e4,s=`${n.activeTab}:${n.kolMode}:${o}`;Ia&&Ar===s||(e(),Ar=s,Ia=setTimeout(async()=>{if(Ia=null,Ar="",document.hidden){Un();return}if(!(n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet)){if(n.kolLoading){Un();return}try{await zr(n.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{Un()}}},o))}function Vr(){const e=()=>{Ea&&clearTimeout(Ea),Ea=null,Pr=""};if(Kn()||document.hidden||n.activeTab!=="watchlist"&&n.activeTab!=="terminal"||!n.user||!n.token){e();return}const t=`${n.activeTab}:${n.user?.id||"guest"}`;Ea&&Pr===t||(e(),Pr=t,Ea=setTimeout(async()=>{if(Ea=null,Pr="",document.hidden){Vr();return}if(!(n.activeTab!=="watchlist"&&n.activeTab!=="terminal"))try{await Uc({silent:!0})}catch(a){$(a.message)}finally{Vr()}},3e4))}async function qn(e=n.scanMode,t={}){const a=L(),r=!!t.silent;n.scanMode=e,r||(n.loading=!0,h());try{const o=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);n.scan=o.scan}finally{H("scanner-refresh",a,{component:"sniper",resultCount:Array.isArray(n.scan?.candidates)?n.scan.candidates.length:0,details:e}),r||(n.loading=!1),h()}}async function zr(e=n.kolMode,t=n.kolWallet,a={}){const r=L(),o=!!a.silent;n.kolMode=e,n.kolWallet=String(t||"").trim();let s="";n.kolWallet&&!Wt(n.kolWallet)&&(n.kolWallet="",s="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!o&&!n.kolScan&&(n.loading=!0),n.kolLoading=!0,n.kolStatus=s||(n.kolWallet?"Scanning custom KOL wallet...":`Loading ${tr(n.kolMode)}...`),$(""),o||h();try{const c=new URLSearchParams({mode:e});n.kolWallet&&c.set("wallet",n.kolWallet);const l=await k(`/api/web/kol/scan?${c.toString()}`);n.kolScan=l.scan,n.kolLastUpdatedAt=new Date().toISOString(),n.kolStatus=l.scan?.message||`${tr(n.kolMode)} loaded.`,n.kolDumpStatsLoadedAt=0}catch(c){throw n.kolStatus=c.message||"KOL scan failed.",c}finally{H("kol-refresh",r,{component:"kol",resultCount:Array.isArray(n.kolScan?.rows)?n.kolScan.rows.length:Array.isArray(n.kolScan?.signals)?n.kolScan.signals.length:0,errorCode:n.kolStatus&&/failed/i.test(n.kolStatus)?"KOL_REFRESH_FAILED":"",details:n.kolWallet?"wallet":e}),o||(n.loading=!1),n.kolLoading=!1,h()}}async function Uc(e={}){if(!n.user||!n.token)return;const t=L(),a=!!e.silent;n.watchlistLoading=!0,a||h();try{const r=await k("/api/web/watchlist");n.watchlist=r.watchlist||{rows:[],count:0}}finally{H("watchlist-refresh",t,{component:"watchlist",resultCount:n.watchlist?.count||n.watchlist?.rows?.length||0}),n.watchlistLoading=!1,h()}}function oh(){return n.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function sh(){const e=Number(n.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function Et(){return oh()+sh()}const ih=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Oe(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function lh(){const e=new Map,t=(a={})=>{const r=Oe(a.mint||a.tokenMint||"");if(!r||e.has(r))return;const o=a.balance??a.uiAmount??a.amount??a.uiBalance??"";e.set(r,{mint:r,symbol:String(a.symbol||a.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(a.name||a.label||"").trim(),balance:o,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${Et().toFixed(4)} SOL`}),rt().forEach(a=>t({mint:a.tokenMint||a.mint,symbol:a.symbol||a.shortMint,name:a.name||"",balance:a.uiAmount||a.amountToken||"",kind:"wallet"})),(n.balances||[]).forEach(a=>{(a.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function ni(e={}){const t=new Map,a=(o={})=>{const s=Oe(o.mint||o.tokenMint||"");!s||t.has(s)||t.set(s,{mint:s,symbol:String(o.symbol||o.shortMint||(s==="SOL"?"SOL":w(s))||"").trim(),name:String(o.name||o.label||"").trim(),balance:o.balance??o.uiAmount??o.amount??"",kind:o.kind||o.source||"held"})};return lh().forEach(a),e.walletOnly||ih.forEach(o=>{o.mint!=="SOL"&&a(o)}),[...t.values()]}function qc(e=""){const t=Oe(e);return ni().find(a=>a.mint===t)||null}function Hc(e="",t={}){const a=Oe(e),r=t.includeCustom!==!1,o=ni({walletOnly:!!t.walletOnly}),s=o.some(u=>u.mint===a);return`${o.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||w(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${i(u.mint)}" ${a===u.mint?"selected":""}>${i(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!a||!s)?"selected":""}>Custom CA</option>`:""}`}function ri(){const e=Oe(n.tradeSwapFrom||"SOL")||"SOL";return ni({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function Kc(){const e=ri(),t=Oe(n.tradeSwapTo||""),a=Oe(n.tradeToken||"");return t&&t!==e?t:a&&a!==e||e==="SOL"?a:"SOL"}function ch(){const e=ri(),t=Kc();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Oe(n.tradeToken||"")?n.swapDirection==="sell"?"sell":"buy":"select"}function uh(e="buy"){const t=Oe(m("[data-swap-from]")?.value||n.tradeSwapFrom||""),a=Oe(m("[data-swap-to]")?.value||n.tradeSwapTo||""),r=String(m("[data-trade-token]")?.value||n.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:a&&a!=="SOL"?a:r}function Vc(){return(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey?(n.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const a=String(t.mint||t.tokenMint||"").trim();return{tokenMint:a,shortMint:t.shortMint||w(a),symbol:t.symbol||t.shortMint||w(a),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||Q(a),pumpUrl:Nf(a),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function rt(){const e=new Set,t=[];for(const a of[...n.positions||[],...Vc()]){const r=String(a?.tokenMint||a?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(a))}return t}function oi(){const e=n.connectedWalletBalance?.publicKey||n.user?.connectedWallet?.publicKey||"";return n.wallets.length+(e?1:0)}function zc(){return n.pnl?.totals?.realizedSol||"+0 SOL"}function Ya(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Hn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function jr(){if(n.walletRefreshing||n.walletRefreshStatus==="refreshing")return"Syncing";if(n.walletRefreshStatus==="timeout")return"Delayed";if(n.walletRefreshError||n.walletRefreshStatus==="error")return"Retry";const e=Ya(n.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function dh(){const e=oe("trade",n.selectedTradePresetId),t=oe("bundle",n.selectedBundlePresetId),a=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${a} | ${r}`}async function jc(){if(!n.user||!n.token)return;const e=L();try{const[t,a]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(n.pnl=t.value.pnl||n.pnl||null),a.status==="fulfilled"&&(n.tradePlans=a.value.plans||n.tradePlans||[],mo()),H("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(n.tradePlans?.length||0)+(n.pnl?1:0),details:"pnl,trade-plans"})}catch(t){H("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:D(t?.message||"Post-trade supplemental refresh failed.")})}}function ph(e=350,t={}){Lr&&window.clearTimeout(Lr),Lr=window.setTimeout(async()=>{if(Lr=null,!(!n.user||!n.token))try{t.reason==="post-trade"?await Promise.all([jc(),bt({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([ia({force:!1,skipCore:!0,silent:!0}),bt({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(a){n.walletRefreshError=a.message||"Background refresh failed.",h()}},e)}async function De({force:e=!1,deep:t=!1,reason:a="manual"}={}){if(!n.user||!n.token)return n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="Wallet not connected",Re("[data-sync-health]","Wallet not connected"),Ke("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(a||"").toLowerCase(),o=r==="manual_header_click",s=r.includes("post-trade");if(e&&!t&&!s&&!o&&Date.now()-Xl<Em?(e=!1,W({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!s&&(Xl=Date.now()),ea)return W({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),n.positionRefreshAction?.state==="clicked"&&Va("refreshing",{startedAt:n.positionRefreshAction.startedAt||L()}),ea.finally(()=>{if(["clicked","refreshing"].includes(n.positionRefreshAction?.state)){const u=n.walletRefreshStatus==="error"||n.walletRefreshStatus==="timeout";Ke(u?"error":"success",{error:u?D(n.walletRefreshError||"Refresh delayed"):""})}});const c=L(),l=++ef;return n.walletRefreshRequestId=l,ea=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};n.positionRefreshAction?.state==="clicked"&&Va("refreshing",{startedAt:n.positionRefreshAction.startedAt||c}),n.walletRefreshing=!0,n.walletRefreshStatus="refreshing",n.walletRefreshError="",Re("[data-sync-health]",jr()),xt("[data-refresh-spinner]",!1),ie(),ta&&window.clearTimeout(ta),ta=window.setTimeout(()=>{ta=null,!(n.walletRefreshRequestId!==l||!n.walletRefreshing)&&(n.walletRefreshing=!1,n.walletRefreshStatus==="refreshing"&&(n.walletRefreshStatus="timeout"),ea=null,Ke("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))},gs+6e3),await Ce(20);try{if(await Promise.race([Qs({force:e,deep:t,preserveSmartChartFrame:n.activeTab==="smartChart",requestId:l,timeoutMs:gs}),new Promise((d,p)=>window.setTimeout(()=>p(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),gs))]),n.walletRefreshRequestId!==l)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:L()-c,fromCache:!1,degraded:!0},u;n.walletRefreshRequestId===l&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshStatus="success"),t?await ia({force:e,skipCore:!0,silent:!0}):((o||s)&&bt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${a}-positions-values`,timeoutMs:Yt}).then(d=>{d?h({preserveSmartChartFrame:n.activeTab==="smartChart"}):_r(`${a}-positions-values-failed`)}).catch(()=>_r(`${a}-positions-values-failed`)),ph(s?200:350,{reason:a})),H("wallet-refresh-total",c,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:t?"deep":`core-plus-background:${a}`}),Ke("success",{error:""}),u={ok:!0,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:"",durationMs:L()-c,fromCache:!1,degraded:!1}}catch(d){const p=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));n.walletRefreshRequestId===l&&(n.walletRefreshStatus=p?"timeout":"error",n.walletRefreshError=d.message||"Refresh failed."),p&&!r.includes("auto-retry")&&n.user&&n.token&&window.setTimeout(()=>{n.user&&n.token&&n.walletRefreshStatus!=="success"&&De({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),H("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:D(n.walletRefreshError)}),Ke("error",{error:D(n.walletRefreshError)}),$(n.walletRefreshError),u={ok:!1,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:D(n.walletRefreshError),durationMs:L()-c,fromCache:!1,degraded:!0}}finally{ta&&(window.clearTimeout(ta),ta=null),n.walletRefreshRequestId===l&&(n.walletRefreshing=!1),ea=null,h({preserveSmartChartFrame:n.activeTab==="smartChart"})}return u})(),ea}async function yt({force:e=!0,reason:t="manual_header_click",deep:a=!1}={}){return De({force:e,reason:t,deep:a})}function Kn(){return!!n.postTradeRefresh?.active&&Number(n.postTradeRefresh?.activeUntil||0)>Date.now()}async function Ek(e="",t="legacy-post-trade"){K(e,t)}function K(e="",t="post-trade",a={}){e&&(n.lastTradeSignature=e),Lt.length&&(Lt.forEach(s=>window.clearTimeout(s)),Lt=[]);const r=a.tradeAttemptId||gt("post-trade"),o=Array.isArray(a.affectedKeys)&&a.affectedKeys.length?a.affectedKeys.slice(0,12).map(s=>ye(s,48)):qm;n.postTradeRefresh={active:!0,attemptId:r,action:ye(t,70),signaturePresent:!!e,invalidatedKeys:o,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},W({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:o.length,details:o.join(",")}),Wm.forEach(s=>{const c=window.setTimeout(()=>{Lt=Lt.filter(p=>p!==c);const l=Number(n.postTradeRefresh?.requestCount||0)+1;n.postTradeRefresh={...n.postTradeRefresh||{},requestCount:l},W({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:n.postTradeRefresh.requestCount,details:t});const u=L();(l<=1?De({force:!0,deep:!1,reason:"post-trade"}):Promise.all([bt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Yt}),jc()])).catch(p=>{n.walletRefreshError=p.message||"Post-trade refresh failed.",n.postTradeRefresh={...n.postTradeRefresh||{},errors:[...n.postTradeRefresh?.errors||[],D(p.message||"Post-trade refresh failed.")].slice(-5)},W({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:L()-u,requestId:r,errorCode:p?.code||p?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{n.postTradeRefresh={...n.postTradeRefresh||{},refreshedKeys:[...new Set([...n.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:Lt.length>0,activeUntil:Lt.length>0?Date.now()+8e3:Date.now()},W({component:"post-trade",action:"post-trade-refresh-end",durationMs:L()-u,requestId:r,resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:n.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})})},s);Lt.push(c)}),ie()}function Le({title:e="Confirm",lines:t=[],confirmLabel:a="Confirm",cancelLabel:r="Cancel",danger:o=!1,input:s=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
`);return s?Promise.resolve(window.prompt(c||e,s.value||"")):Promise.resolve(window.confirm(c||e))}return new Promise(c=>{const l=document.createElement("div");l.className="slime-confirm-overlay",l.innerHTML=`
      <div class="slime-confirm-card" role="dialog" aria-modal="true" aria-label="${i(e)}">
        <h3 class="slime-confirm-title">${i(e)}</h3>
        ${[].concat(t).filter(Boolean).map(S=>`<p class="slime-confirm-line">${i(S)}</p>`).join("")}
        ${s?`
          <label class="slime-confirm-input-label">
            ${i(s.label||"")}
            <input class="slime-confirm-input" type="${i(s.type||"text")}" value="${i(s.value||"")}" placeholder="${i(s.placeholder||"")}" ${s.inputmode?`inputmode="${i(s.inputmode)}"`:""}>
          </label>`:""}
        <div class="slime-confirm-actions">
          <button type="button" class="slime-confirm-cancel">${i(r)}</button>
          <button type="button" class="slime-confirm-accept${o?" is-danger":""}">${i(a)}</button>
        </div>
      </div>
    `;const u=document.activeElement,d=l.querySelector(".slime-confirm-input"),p=S=>{l.remove(),document.removeEventListener("keydown",g,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>p(s?d?.value??"":!0),y=()=>p(s?null:!1),g=S=>{S.key==="Escape"?(S.preventDefault(),y()):S.key==="Enter"&&(!s||S.target===d)&&(S.preventDefault(),f())};l.addEventListener("pointerdown",S=>{S.target===l&&y()}),l.querySelector(".slime-confirm-accept").addEventListener("click",f),l.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",g,!0),document.body.appendChild(l),(d||l.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function si(){if(document.hidden&&n.route==="terminal")return!0;const e=document.activeElement;if(!e||n.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function Gc(){n.pendingRender=!0}function Xc(){!n.pendingRender||si()||(n.pendingRender=!1,h({force:!0}))}function ii(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Qa(){if(!se||!Ln||!ae)return;const e=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);se.dataset.loading=n.loading?"true":"false",se.dataset.route=n.route,se.dataset.walletConnected=e?"true":"false",e&&xS("shell-wallet-context"),e?uu("shell-wallet-context"):Sl(),e||(n.tpslAutoEnableInFlight=!1,n.tpslAutoEnableScheduledAt=0),ii(Ln,!["intro","login"].includes(n.route)),ii(Ql,n.route!=="connect"),ii(ae,n.route!=="terminal"),xt("[data-terminal-global-search]",n.route!=="terminal"),xt("[data-top-sync-strip]",n.route!=="terminal")}function Vn(){const e=!!(Ae&&n.loginModalOpen),t=!!n.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const a=m("[data-wallet-connect-modal]");a&&(a.style.pointerEvents=a.hidden?"none":"");const r=m("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function li(e,t=48){if(!e||document.hidden)return!1;try{const a=e.getBoundingClientRect();return a.width<24||a.height<t}catch{return!1}}function Jc(e="resume"){if(!se||document.hidden)return;Qa(),Vn();const t=`${Date.now()}:${e}`,a=se.style.transform;se.dataset.resumePaint=t,se.style.transform=a?`${a} translateZ(0)`:"translateZ(0)",se.offsetHeight,window.requestAnimationFrame(()=>{!se||se.dataset.resumePaint!==t||(se.style.transform=a,delete se.dataset.resumePaint)})}function mh(){if(!se)return!1;if(se.dataset.route!==n.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Ae||Ae.hidden||!n.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!n.quickBuyModal?.open;if(e||t||li(se,80))return!0;if(n.route!=="terminal")return!1;const a=m("[data-panel]");return ae?.hidden||li(ae,80)||a&&li(a,32)||a&&!a.children.length&&!String(a.textContent||"").trim()?!0:![Ln,Ql,ae].some(o=>o&&!o.hidden)}function fh(e="watchdog"){const t=n.positionRefreshAction||{},a=t.startedAt?Math.max(0,L()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&a>Um&&(Ke("error",{error:"Refresh delayed"}),W({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:a,details:e})),n.walletRefreshing&&!ea&&(n.walletRefreshing=!1,n.walletRefreshStatus=n.walletRefreshStatus==="refreshing"?"timeout":n.walletRefreshStatus,xt("[data-refresh-spinner]",!0)),Vn(),ie()}function Yc(e="watchdog",t={}){return fh(e),mh()?(W({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-Jl),details:`${e}:${n.route}:${n.activeTab||""}`}),Us({keepLogin:n.route==="login"}),Qa(),Jc(e),h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):(t.forcePaint&&Jc(e),!1)}function Qc(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function Zc(){try{return document.createElement("canvas")}catch{return null}}function eu(){const e=Zc();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function hh(){return Qc()||eu()}function ci(){const e=Ve()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Ft(e),typeof window.alert=="function"&&window.alert(e)}function tu(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function zn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function au(){const e=n.clipFarm?.fileExtension||zn(n.clipFarm?.mimeType||n.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function jn(){try{n.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}n.clipFarm?.fallbackFrameTimer&&clearInterval(n.clipFarm.fallbackFrameTimer),n.clipFarm?.fallbackStopTimer&&clearTimeout(n.clipFarm.fallbackStopTimer)}function Ft(e=""){n.clipFarm={...n.clipFarm,status:String(e||"")},je()}function ui(){if(n.clipFarm?.videoUrl)try{URL.revokeObjectURL(n.clipFarm.videoUrl)}catch{}n.clipFarm={...n.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:n.clipFarm?.recording?"Recording...":""},je()}function je(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=n.clipFarm||{},a=hh(),r=!!t.recording,o=!!(t.blob&&t.videoUrl),s=t.status||(r?"Recording":o?"Clip ready":"Clip farm");e.innerHTML=`
    <div class="clip-farm-control" data-recording="${r?"true":"false"}" data-ready="${o?"true":"false"}">
      <button type="button" class="clip-record-button" data-clip-record data-supported="${a?"true":"false"}" title="${a?"Record a shareable SlimeWire clip":"Tap for recording support details"}" aria-pressed="${r?"true":"false"}">
        <span class="clip-record-dot" aria-hidden="true"></span>
        <strong>${r?"Stop":"Rec"}</strong>
      </button>
      ${o?`
        <div class="clip-share-actions" aria-label="Clip share options">
          <button type="button" data-clip-share title="Share clip">Share</button>
          <button type="button" data-clip-download title="Download clip">Save</button>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent("Farming SlimeWire clips at https://slimewire.org")}" target="_blank" rel="noreferrer" title="Open X">X</a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(Ct)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${s?`<small>${i(s)}</small>`:""}
    </div>
  `}function nu(){const e=be([...Ne()?.rows||[],...typeof cr=="function"?cr():[],...n.slimeScopeRows||[],...n.livePairRows||[],...Object.values(n.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:n.smartChartToken||n.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function ru(e,t={}){const a=e?.getContext?.("2d");if(!a)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),o=720,s=1280;(e.width!==o*r||e.height!==s*r)&&(e.width=o*r,e.height=s*r,e.style.width=`${o}px`,e.style.height=`${s}px`),a.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),l=t.rows||nu(),u=new Date;a.fillStyle="#020803",a.fillRect(0,0,o,s);const d=a.createRadialGradient(o*.2,s*.12,20,o*.2,s*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),a.fillStyle=d,a.fillRect(0,0,o,s),a.strokeStyle="rgba(118,255,45,0.38)",a.lineWidth=2,a.strokeRect(24,24,o-48,s-48),a.fillStyle="#baff4d",a.font="900 34px Arial, sans-serif",a.fillText("SlimeWire REC",48,88),a.fillStyle="#f4fff0",a.font="800 54px Arial, sans-serif",a.fillText("Fresh Live Picks",48,154),a.fillStyle="rgba(226,255,215,0.78)",a.font="700 22px Arial, sans-serif",a.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const p=o-96;a.fillStyle="rgba(118,255,45,0.12)",a.fillRect(48,226,p,12),a.fillStyle="#78ff2d",a.fillRect(48,226,Math.max(24,p*c),12),l.forEach((f,y)=>{const g=292+y*188,S=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),T=N(f.marketCapLabel,f.fdvLabel,B(ut(f)),"checking"),b=N(f.liquidityLabel,B(dt(f)),"checking"),A=N(f.volumeH1Label,f.volumeLabel,B(f.volumeH1),"checking"),C=String(f.pairAgeLabel||Kt(f)||"live").slice(0,18);a.fillStyle="rgba(4,24,8,0.92)",a.strokeStyle="rgba(118,255,45,0.34)",a.lineWidth=2,a.beginPath(),typeof a.roundRect=="function"?a.roundRect(48,g,o-96,156,18):a.rect(48,g,o-96,156),a.fill(),a.stroke(),a.fillStyle="#f4fff0",a.font="900 32px Arial, sans-serif",a.fillText(S,76,g+48),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 18px Arial, sans-serif",a.fillText(P,76,g+78),[["MC",T],["LIQ",b],["VOL",A],["AGE",C]].forEach(([M,q],J)=>{const Se=76+J*140;a.fillStyle="#aaff8f",a.font="800 15px Arial, sans-serif",a.fillText(M,Se,g+114),a.fillStyle="#ffffff",a.font="900 23px Arial, sans-serif",a.fillText(String(q).slice(0,10),Se,g+142)})}),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 20px Arial, sans-serif",a.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,s-78),a.fillStyle="#78ff2d",a.font="900 24px Arial, sans-serif",a.fillText("slimewire.org",48,s-44)}async function gh(e){ru(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(o=>r(o),"image/png",.92)}catch{r(null)}});if(!t){ci();return}const a=URL.createObjectURL(t);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:a,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},je()}async function bh(){const e=Zc();if(!e){ci();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await gh(e);return}ui();const a=nu(),r=Date.now(),o=t.call(e,12),s=tu(),c=[],l=new MediaRecorder(o,s?{mimeType:s}:void 0),u=()=>ru(e,{rows:a,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);l.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),l.addEventListener("stop",()=>{jn();const f=s||"video/webm",y=new Blob(c,{type:f}),g=y.size>0?URL.createObjectURL(y):"",S=zn(y.type||f);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:g,mimeType:y.type||f,fileExtension:S,status:y.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},je()},{once:!0}),l.start(500);const p=setTimeout(()=>{n.clipFarm?.recording&&Gn()},4300);n.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:s,fileExtension:zn(s),recorder:l,stream:o,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:p},je()}async function ou(){if(!Qc()){if(eu()){await bh();return}ci();return}if(n.clipFarm?.recording){Gn();return}ui();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=tu(),a=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",o=>{o.data?.size>0&&a.push(o.data)}),r.addEventListener("stop",()=>{jn();const o=t||"video/webm",s=new Blob(a,{type:o}),c=s.size>0?URL.createObjectURL(s):"",l=zn(s.type||o);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:s.size>0?s:null,videoUrl:c,mimeType:s.type||o,fileExtension:l,status:s.size>0?`Clip ready (.${l}).`:"No clip captured."},je()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>Gn(),{once:!0}),r.start(1e3),n.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:zn(t),recorder:r,stream:e,chunks:a},je()}catch(e){jn(),n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},je()}}function Gn(){const e=n.clipFarm?.recorder;if(!e){jn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},je();return}try{if(e.state!=="inactive"){Ft("Saving clip..."),e.stop();return}}catch{}jn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},je()}async function yh(){const e=n.clipFarm?.blob;if(!e){Ft("Record a clip first.");return}const t=new File([e],au(),{type:e.type||n.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Ft("Shared.");return}}catch(a){if(a?.name==="AbortError"){Ft("Share cancelled.");return}}Ft("Use Save, then attach the clip to X or Telegram.")}function vh(){const e=n.clipFarm?.videoUrl;if(!e){Ft("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=au(),document.body.appendChild(t),t.click(),t.remove(),Ft("Saved.")}function wh(e=null,t="chartTxns"){const a=e||Bo(),r=String(a?.tokenMint||n.smartChartToken||"").trim();return r?{mint:r,mode:t,src:jd(a,t)}:null}function Sh(e={}){if(e.refreshSmartChartFrame||n.route!=="terminal"||n.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),a=t?.querySelector("iframe");if(!t||!a)return null;const r=String(t.dataset.chartMode||"chartTxns"),o=wh(null,r);if(!o||t.dataset.chartMint!==o.mint||t.dataset.chartMode!==o.mode)return null;const s=String(t.dataset.chartSrc||a.getAttribute("src")||""),c=t.dataset.loaded==="true",l=s!==o.src;return t.dataset.preserving="true",{frame:t,mint:o.mint,mode:o.mode,src:l?s:o.src,loaded:c,keepByMint:l}}function kh(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),a=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${a}"]`),o=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||o!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!se||!Ln||!ae)return;if(Qa(),!e.force&&si()){Gc();return}const t=L(),a=`${n.route}:${n.activeTab||"none"}`;try{n.perfRenderCounts={...n.perfRenderCounts||{},[a]:(n.perfRenderCounts?.[a]||0)+1},n.pendingRender=!1;const r=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);Qa(),se.dataset.activeTab=n.activeTab||"";const s=!!((e.preserveSmartChartFrame||n.activeTab==="smartChart")&&n.route==="terminal"&&n.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Sh(e):null,c=!!Ae,l=!!(c&&n.loginModalOpen);Fs&&(Fs.hidden=c||!!n.user||n.loginCollapsed),xt("[data-connect-login-panel]",c||!!n.user||n.loginCollapsed),Ae?(Ae.hidden=!l,Ae.setAttribute("aria-hidden",l?"false":"true"),Ae.toggleAttribute("inert",!l),document.body.classList.toggle("login-modal-open",l),document.querySelectorAll("[data-login-tab]").forEach(S=>{const P=S.dataset.loginTab===n.loginModalTab;S.dataset.active=P?"true":"false",S.setAttribute("aria-selected",P?"true":"false")}),xt("[data-login-modal-login-section]",n.loginModalTab!=="login"),xt("[data-login-modal-create-section]",n.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),Zl&&(Zl.hidden=!1),ec&&(ec.hidden=!!n.user),tc&&(tc.hidden=!n.user),Qa(),Re("[data-user-id]",n.user?.id||"guest"),Re("[data-wallet-count]",oi()),Re("[data-total-sol]",Et().toFixed(4));const u=rt();Re("[data-position-count]",u.length),Re("[data-realized]",zc()),Re("[data-top-sol]",`${Et().toFixed(4)} SOL`),Re("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Re("[data-sync-health]",r?jr():"Sync idle"),Re("[data-active-preset-label]",dh()),pi(),Ah(),xt("[data-refresh-spinner]",!n.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!Cm||!km(ke)});const d=m("[data-user-avatar]");d&&(d.innerHTML=en("SW"));const p=m("[data-top-avatar]");p&&(p.innerHTML=en("SW"));const f=n.user?.connectedWallet||null;Re("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:n.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=m("[data-logout]");y&&(y.hidden=!n.user,y.disabled=!!n.logoutPending,v(y,n.logoutPending?"Logging out...":"Log Out")),n.route==="terminal"&&Oh(),kh(s),og(),ig(),Vi(),Sa(),ka(),po(),hr(),je(),F(),Sw("render"),Vn(),ie();const g=L()-t;(g>=16||n.perfRenderCounts[a]%20===0)&&W({component:"render",action:"render",durationMs:g,resultCount:n.perfRenderCounts[a],details:a}),Jl=Date.now()}catch(r){Qa(),Vn(),Ks({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const o=m("[data-panel]");n.route==="terminal"&&o?(ae.hidden=!1,o.innerHTML=`
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
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function su(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const a=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(a)return`connected:${String(a).toLowerCase()}`;const r=Array.isArray(n.wallets)&&n.wallets.length?n.wallets.map(o=>o.publicKey||o.address||o.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function $h(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${su(e)}`)==="yes"}catch{return!1}}function iu(e,t=""){try{const a=`tpslAutoRevoked:${su(t)}`;e?sessionStorage.setItem(a,"yes"):sessionStorage.removeItem(a)}catch{}}function di(e=""){iu(!1,e)}function lu(){return!!(Array.isArray(n.wallets)&&n.wallets.length||n.user?.connectedWallet||n.connectedWalletBalance?.publicKey)}function cu(){const e=n.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),a=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!n.user?.automationPermissionActive&&!a&&!e.revokedAt}function Th(){return!(!lu()||$h()||cu()||n.tpslAutoEnableInFlight)}function uu(e="wallet-session"){if(!Th())return;const t=L();n.tpslAutoEnableScheduledAt&&t-n.tpslAutoEnableScheduledAt<2e3||(n.tpslAutoEnableScheduledAt=t,n.tpslAutoEnableInFlight=!0,setTimeout(()=>{Ei("enable",{auto:!0,reason:e}).catch(a=>{n.automationDelegationStatus=a?.message||"TP/SL auto-enable failed.",$(n.automationDelegationStatus)}).finally(()=>{n.tpslAutoEnableInFlight=!1,pi()})},50))}function pi(){const e=m("[data-tpsl-status-button]");if(!e)return;const t=m("[data-tpsl-status-label]"),a=n.user?.automationPermission||{},r=!!n.user?.automationPermissionActive,o=!!a.revokedAt,s=Date.parse(a.expiresAt||""),c=!!a.enabled&&Number.isFinite(s)&&s<=Date.now(),l=r?"enabled":o||c?"invalid":"disabled";e.dataset.tpslState=l;const u=l==="enabled"?"TP/SL Enabled":l==="invalid"?"Re-enable TP/SL":"Enable TP/SL";v(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=l==="enabled"?`Server exits enabled${a.expiresAt?` until ${we(a.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Ah(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0,r=!!(t||a),o=r?"Connected":"Connect",s=t?"Wallet: Connected":a?`Wallets: ${a}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:a?`${a} SlimeWire wallet${a===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(l=>{l.dataset.walletState=r?"connected":"disconnected",l.title=c,l.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=l.querySelector("[data-top-wallet-connect-label]")||l;v(u,o)}),document.querySelectorAll("[data-top-wallet-status]").forEach(l=>{l.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",l.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",l.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),v(l,s)})}async function Ph(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0;if(t){await Le({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await md();return}if(a>0){$e("/terminal","wallets");return}da({returnPath:"/terminal"})}function Ch(e=document){const t=()=>{const a=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!a)return;const r=Math.max(0,a.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const du=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Lh=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function xh(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Xn(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function mi(e=m("[data-panel]")){if(!e||n.route!=="terminal"||!du.has(n.activeTab))return null;const t=e.dataset.renderedTab,a=document.scrollingElement||document.documentElement,r={tab:n.activeTab,windowY:window.scrollY||0,documentY:a?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0,anchorKey:"",anchorTop:0},o=Array.from(e.querySelectorAll(Lh));if(t&&t!==n.activeTab&&!o.length||!o.length)return r;const s=o.find(l=>{const u=l.getBoundingClientRect(),d=Xn()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||o[0],c=s?.dataset?.tokenChart||s?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:s?s.getBoundingClientRect().top:0}}function fi(e,t=m("[data-panel]")){if(!e||n.route!=="terminal"||e.tab!==n.activeTab)return;const a=(s,c)=>{if(!s||!Number.isFinite(Number(c))||s.scrollHeight<=s.clientHeight+2)return;const l=Math.max(0,Math.min(Number(c),s.scrollHeight-s.clientHeight));Math.abs((s.scrollTop||0)-l)>4&&(s.scrollTop=l)},r=s=>{const c=document.scrollingElement||document.documentElement;a(ae,e.dashboardScrollTop),a(s,e.panelScrollTop),a(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},o=()=>{const s=t?.isConnected?t:m("[data-panel]");let c=!1;if(e.anchorKey&&s){const l=xh(e.anchorKey),u=s.querySelector(`[data-token-chart="${l}"], [data-token-mint="${l}"]`);if(u){const p=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(p)&&Math.abs(p)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+p)),c=!0}}c||r(s)};o(),requestAnimationFrame(()=>{o(),window.setTimeout(o,90),window.setTimeout(o,240),Xn()&&window.setTimeout(o,520)})}function pu(e,t){const a=Object.keys(e.dataset||{}).filter(s=>s!=="customFor"&&s!=="customSelect").sort().map(s=>`${s}=${e.dataset[s]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",o=`${e.tagName}:${e.type||""}:${e.name||""}:${a}${r}`;return a?o:`${o}:idx${t}`}function mu(e){const t=Array.from(e.options||[]),a=t.find(r=>r.defaultSelected);return a?a.value:t[0]?.value??""}function Mh(e){if(!e||e.dataset.renderedTab!==n.activeTab)return null;const t=new Map;let a="",r=null,o=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((s,c)=>{const l=pu(s,c);if(t.has(l))return;const u=s.type==="checkbox"||s.type==="radio",d=s.tagName==="SELECT",p=u?String(s.defaultChecked):d?mu(s):s.defaultValue,f=u?String(s.checked):s.value;if(f!==p&&(t.set(l,{value:f,defaultValue:p,isToggle:u,isSelect:d}),document.activeElement===s)){a=l;try{r=s.selectionStart,o=s.selectionEnd}catch{}}}),t.size?{tab:n.activeTab,fields:t,focusedKey:a,selectionStart:r,selectionEnd:o}:null}function Bh(e,t){if(!e||!t||e.tab!==n.activeTab)return;const a=Array.from(t.querySelectorAll("input, textarea, select")),r=o=>{a.forEach((s,c)=>{const l=s.tagName==="SELECT";if(o!==l)return;const u=pu(s,c),d=e.fields.get(u);if(!d)return;const p=s.type==="checkbox"||s.type==="radio";if((p?String(s.defaultChecked):l?mu(s):s.defaultValue)===d.defaultValue&&(p?s.checked=d.value==="true":s.value=d.value,u===e.focusedKey&&document.activeElement!==s))try{s.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&s.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function Rh(e){return!e||n.route!=="terminal"||n.activeTab==="terminal"||du.has(n.activeTab)||e.dataset.renderedTab!==n.activeTab||n.activeTab==="smartChart"&&n.chartScrollIntoView?null:{tab:n.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0}}function Ih(e,t){if(!e||e.tab!==n.activeTab)return;const a=()=>{const r=t?.isConnected?t:m("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),ae&&ae.scrollHeight>ae.clientHeight+2&&(ae.scrollTop=Math.min(e.dashboardScrollTop,ae.scrollHeight-ae.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};a(),requestAnimationFrame(a)}function Oh(){const e=m("[data-panel]");if(!e)return;const t=mi(e),a=Mh(e),r=Rh(e),o=n.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,s=n.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),tk(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===n.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const l=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!n.navTekOpen||!Ym()&&l}),n.activeTab==="terminal"&&(e.innerHTML=Np()),n.activeTab==="tek"&&(e.innerHTML=Fh()),n.activeTab==="dashboard"&&(e.innerHTML=Hh()),n.activeTab==="profile"&&(e.innerHTML=Kh()),n.activeTab==="trade"&&(e.innerHTML=Gg()),n.activeTab==="bundle"&&(e.innerHTML=tb()),n.activeTab==="volume"&&(e.innerHTML=kb()),n.activeTab==="live"&&(e.innerHTML=Np()),n.activeTab==="liveTrades"&&(e.innerHTML=Dw()),n.activeTab==="slimeScope"&&(e.innerHTML=hw()),n.activeTab==="watchlist"&&(e.innerHTML=Jw()),n.activeTab==="smartChart"&&(e.innerHTML=Lw()),n.activeTab==="launchCoin"&&(e.innerHTML=Bb()),n.activeTab==="launch"&&(e.innerHTML=$b()),n.activeTab==="kol"&&(e.innerHTML=Gb()),n.activeTab==="ogreAi"&&(e.innerHTML=eb()),n.activeTab==="wallets"&&(e.innerHTML=bv()),n.activeTab==="positions"&&(e.innerHTML=kv()),n.activeTab==="pnl"&&(e.innerHTML=Cv()),n.activeTab==="txAudit"&&(e.innerHTML=Bp()),n.activeTab==="sniper"&&(e.innerHTML=eS()),e.dataset.renderedTab=n.activeTab||"",n.activeTab==="ogreTek"&&(e.innerHTML=lS(),e.dataset.renderedTab=n.activeTab||"",sS()),Bh(a,e),no(e),Ih(r,e),["trade","volume","launchCoin","sniper","ogreAi","bundle","positions","pnl"].includes(n.activeTab))try{Nt[n.activeTab]&&!e.querySelector("[data-ogre-stage]")&&e.insertAdjacentHTML("afterbegin",Hg(n.activeTab)),qg(e)}catch{}if(["terminal","live","kol","slimeScope","watchlist","smartChart"].includes(n.activeTab))try{Eg(e,n.activeTab)}catch{}if(n.activeTab==="smartChart"&&n.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=m("[data-chart-buy-amount]");c&&c.focus(),n.chartFocusAmountInput=!1}),n.activeTab==="smartChart"&&n.chartScrollIntoView&&(Ch(e),n.chartScrollIntoView=!1),n.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=o),requestAnimationFrame(()=>{Math.abs(window.scrollY-s)>8&&window.scrollTo(0,s);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=o)})}fi(t,e),rh(),ua(),Kr(),Un(),Vr(),ai(),n.activeTab==="kol"&&Ii()}function Eh(){const e=n.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${i(n.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${i(Et().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${i(n.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${i(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Fh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Eh()}
      <div class="tek-tool-grid">
        ${e.map(([t,a,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${i(a)}</strong>
            <small>${i(r)}</small>
          </button>`).join("")}
      </div>
      ${Dh()}
      ${_h()}
    </section>
  `}const fu="slimewire-ogre-memory";function Gr(){try{return JSON.parse(localStorage.getItem(fu)||"{}")||{}}catch{return{}}}function Xr(e={}){const t={...Gr(),...e};try{localStorage.setItem(fu,JSON.stringify(t))}catch{}return t}function Wh(e,t=""){if(!e)return;const r=(Gr().recentTokens||[]).filter(o=>o.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),Xr({recentTokens:r.slice(0,5)})}(function(){const t=Gr();t.quickBuy&&!n.quickBuyAmountOverride&&(n.quickBuyAmountOverride=t.quickBuy)})();function hu(){const t=sr().filter(l=>{const u=Number(l.marketCapUsd??l.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active"].includes(String(l.status||"").toLowerCase())),o=r.filter(l=>{const u=Number(l.lastMovePct??l.wallets?.[0]?.lastMovePct),d=Number(l.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,s=Number(n.shieldReceipts?.stats?.watching||0),c=Number(n.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${o?` - ${o} near take-profit`:""}`:"",s?`🔎 ${s} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let gu=!1;function Nh(){if(gu||yn().length)return;gu=!0;const e=hu(),t=Gr(),a=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=a.length?` I remember: ${a.join(", ")}.`:"";ue({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function Dh(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...hu(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${i(t)}</li>`).join("")}
      </ul>
    </section>
  `}function _h(){qh();const e=n.shieldReceipts;if(!e)return`
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
                <span>Flagged ${i(r.verdict)} (score ${i(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${i(Uh(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${i(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${i(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function Uh(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let bu=0;function qh(){Date.now()-bu<300*1e3||(bu=Date.now(),k("/api/web/shield/receipts").then(e=>{n.shieldReceipts=e,n.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{n.proofStats=e?.alpha||null}).catch(()=>{}))}function Hh(){return`
    ${eg()}
    ${Za()}
    <section class="panel-grid">
      ${Jn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Jn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Jn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Jn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Jn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${ku()}
    ${Su()}
    ${$u()}
  `}function Kh(){if(!hi())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${vu(!1)}
        <section class="profile-row-list">
          ${Yh()}
          ${wu()}
        </section>
        ${yu()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:Qh()},{key:"login",label:"Login",hint:"Security",html:Zh()},{key:"pfp",label:"PFP",hint:"Avatar",html:tg()},{key:"x",label:"X",hint:"Connect X",html:lg()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:Vh()},{key:"badges",label:"Badges",hint:"Earned",html:wu()},{key:"referral",label:"Referral",hint:"Invite & earn",html:cg()},{key:"board",label:"Board",hint:"Top traders",html:dg()}];return`
    <section class="profile-row-shell">
      ${vu(!0)}
      ${nn({toolKey:"profile",activeKey:rn("profile","account"),sections:t})}
      ${yu()}
    </section>
  `}function yu(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function Vh(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",a=n.pushAlertsEnabled===!0;return`
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
  `}async function zh(){const e=m("[data-push-status]");try{v(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){v(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),v(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){v(e,D(t?.message||"Could not create the link."))}}function jh(e){const t="=".repeat((4-e.length%4)%4),a=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(a);return Uint8Array.from([...r].map(o=>o.charCodeAt(0)))}async function Gh(){const e=m("[data-push-status]");try{v(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){v(e,"Push alerts are not configured on the server yet.");return}const a=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){v(e,"Notification permission was not granted.");return}const o=await a.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:jh(t.publicKey)}),s=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:o.toJSON()})});n.pushAlertsEnabled=!0,v(e,`Push alerts enabled (${s.devices||1} device${(s.devices||1)===1?"":"s"}).`),h()}catch(t){v(e,D(t?.message||"Could not enable push alerts."))}}async function Xh(){const e=m("[data-push-status]");try{const a=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:a.endpoint})}).catch(()=>{}),await a.unsubscribe().catch(()=>{})),n.pushAlertsEnabled=!1,v(e,"Push alerts disabled on this device."),h()}catch(t){v(e,D(t?.message||"Could not disable push alerts."))}}async function Jh(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n.pushAlertsEnabled=!!t}catch{}}function hi(){return!!(le()?.publicKey||n.user?.connectedWallet?.publicKey||Array.isArray(n.wallets)&&n.wallets.length)}function vu(e=hi()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function Yh(){const e=le();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Yr().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${i(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${i(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${i(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function Qh(){const e=n.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${en("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${i(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${i(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function Zh(){const e=n.user?.username||"";return`
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
  `}function eg(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Jn(e,t,a,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${i(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${i(t)}</h3>
        <p>${i(a)}</p>
      </div>
    </article>
  `}function tg(){const e=!!n.user?.avatar,t=n.xHandle?`@${n.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${en("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${ag()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${t?`Use ${i(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${n.user.avatarSource?` from ${i(n.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function ag(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,a])=>`
        <button type="button" data-preset-avatar="${i(t)}" data-avatar-label="${i(a)}" aria-label="Use ${i(a)} PFP">
          <img src="${i(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function wu(){const e=Number(n.pnl?.totals?.tradeCount||0),t=hi(),a=Number(n.livePairRows?.length||0)+Number(n.terminalEntry?.items?.length||0)+Number(n.livePairsByBucket?.fresh?.length||0),r=!!(n.lastUpdatedAt&&!n.walletRefreshError||n.walletRefreshStatus==="success"),o=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:a>0||!!n.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!oe("trade",n.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(n.livePairRows?.length||n.scan||n.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],s=o.filter(l=>l.earned).length,c=Math.round(s/Math.max(1,o.length)*100);return`
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
        ${o.map(({label:l,detail:u,earned:d,icon:p,quest:f})=>`
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
  `}function Za(){const e=n.user?.connectedWallet,t=!!n.user?.avatar,a=n.xHandle?`@${n.xHandle}`:"";return`
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
          ${Yr().map(r=>`
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

      ${gi()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${en("SW")}</div>
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
  `}function Fk(){const e=n.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Yr().map(t=>`
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
    ${gi({compact:!0})}
  `}function gi({compact:e=!1}={}){const t=n.user?.connectedWallet,a=Array.isArray(n.wallets)?n.wallets.length:0,r=n.wallets.filter(u=>u.sessionWallet),o=n.user?.automationPermission||{},s=!!n.user?.automationPermissionActive,c=o.expiresAt?we(o.expiresAt):"",l=n.automationDelegationStatus||(a?`${a} managed automation wallet(s) available. ${s?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
        <button class="primary" type="button" data-create-automation-wallet>${a?"Create Another":"Create Automation Wallet"}</button>
        <button type="button" data-tab="wallets">Manage Wallets</button>
        ${t?'<button type="button" data-connect-wallet="solana">Switch Connected Wallet</button>':""}
      </div>
      <small data-automation-delegation-status>${i(l)}</small>
    </article>
  `}function da({returnPath:e="/terminal"}={}){n.walletConnectMenuOpen=!0,n.walletConnectReturnPath=e||"/terminal",n.walletConnectStatus=n.user?.connectedWallet?`Connected ${w(n.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function ng(e={}){return da(e)}window.openWalletConnectModal=ng;function rg(e){n.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",n.walletFastApprovalsEnabled?"on":"off")}catch{}}function og(){const e=m("[data-wallet-connect-modal]");if(!e)return;if(!n.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=n.user?.connectedWallet||n.connectedWalletBalance;e.hidden=!1,fr(e,`
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
        ${Yr().map(a=>`
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
  `,".wallet-connect-dialog")}function sg(){const e=n.quickBuyModal||{},t=Bo()?.tokenMint===e.tokenMint?Bo():ge(e.tokenMint,{source:e.source||"quick-buy-modal"}),a=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=bi(e.error||e.status||""),o=a||!!r,s=ce(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${pt(t)}
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
          ${an(e.walletIndex||(le()?.publicKey?"connected":""))}
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
        ${_("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${i(e.tokenMint||"")}" data-protected-buy-source="quick-buy-modal">Protected</button>`:""}
        <button type="button" class="primary" data-quick-buy-confirm ${o?"disabled":""}>${a?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${s?`<small class="quick-buy-wallet-note">${n.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${i(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${i(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${i(e.error||"")}</small>`}
    </section>
  `}function bi(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function ig(){let e=m("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!n.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=sg(),document.body.classList.add("quick-buy-modal-open")}function lg(){const e=!!n.xHandle;return`
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
  `}function cg(){const e=n.user?.referralCode||"",t=`${Ct.replace(/\/+$/,"")}/r/`,a=n.user?.referralLink||(e?`${Ct.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=n.user?.referralStats||{},o=Array.isArray(r.referrals)?r.referrals:[];return`
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. This is separate from the trader board.</p>
      </div>
      <div class="referral-stats-grid">
        <span><small>Total earned</small><strong>${i(r.totalSol||"0")} SOL</strong></span>
        <span><small>Payouts</small><strong>${i(r.payoutCount||0)}</strong></span>
        <span><small>Referral users</small><strong>${i(o.length)}</strong></span>
      </div>
      ${o.length?`
        <div class="referral-breakdown">
          ${o.slice(0,6).map(s=>`
            <div class="referral-breakdown-row">
              <span>${i(s.userId||"user")}</span>
              <strong>${i(s.sol||"0")} SOL</strong>
              <small>${i(s.payoutCount||0)} payout${Number(s.payoutCount||0)===1?"":"s"}</small>
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
        ${a?Tu(`Trade faster on SlimeWire. Referral: ${a}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${i(e)}${n.user?.referredByCode?` | Referred by ${i(n.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function ug(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Ct).pathname.split("/").map(s=>s.trim()).filter(Boolean),o=r.findIndex(s=>s.toLowerCase()==="r");if(o>=0&&r[o+1])return decodeURIComponent(r[o+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function dg(){const e=n.user?.traderBoardWalletMode||"all",t=Array.isArray(n.user?.traderBoardWalletIndexes)?n.user.traderBoardWalletIndexes:n.wallets.map(a=>String(a.index));return`
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
        ${n.wallets.length?vt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${n.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function Su(){return`
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
  `}function ku(){return`
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
  `}function $u(){return n.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ge(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${i(e)}">${i(t)}</button>`}function Tu(e,t="TG"){const a=yi(e),r=`https://t.me/share/url?url=${encodeURIComponent(Ct)}&text=${encodeURIComponent(a)}`;return`<a href="${i(r)}" target="_blank" rel="noreferrer">${i(t)}</a>`}function yi(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Ct}`}function pg(e){const t=e.type==="buy",a=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${a}. Chart ${Q(e.tokenMint)}`}function Wk(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function mg(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Au(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function fg(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function hg(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${Q(e.tokenMint)}`}function gg(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${Q(e.tokenMint)}`}function bg(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function yg(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function vi(e){const t=String(e||"").trim(),a=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${Q(t)}`:"";return`Watching ${a}.${r}`}function Pu(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const vg=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function wi(e=""){const t=String(e||"").trim().toLowerCase();return vg.filter(a=>!t||String(a.tier||"").toLowerCase()===t).sort((a,r)=>+!!r.pinned-+!!a.pinned||Number(a.rank||999)-Number(r.rank||999))}function Wt(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function Cu(e=""){const t=String(e||"").trim();return Wt(t)?t:""}function wg(e={}){const t=String(e.wallet||"").trim(),a=Cu(t),r=Je(e.twitter||e.x||e.username||"");return{x:r?$i(r):"",wallet:a?`https://solscan.io/account/${encodeURIComponent(a)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(a?Tc(a):"")}}function Sg(e={}){const t=String(e.wallet||"").trim(),a=Cu(t),r=wg(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${i(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${i(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${i(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${a?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${a?`<button data-kol-scan-wallet="${i(a)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${a?`<button data-kol-copy-wallet="${i(a)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${a?`<button data-copy="${i(a)}">CA</button>`:""}
      ${Ri(e)}
    </div>
  `}function Lu(e={},t={}){const a=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${a?"is-compact":""}" data-tier="${i(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${Bu(e,a?"kol-avatar small":"kol-avatar")}
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
      ${Sg(e)}
    </article>
  `}function kg(){const e=wi("hot"),t=wi("slimewire");return`
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
            ${e.length?e.map(a=>Lu(a)).join(""):O("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(a=>Lu(a,{compact:!0})).join(""):O("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function en(e="SW"){const t=ot(n.user?.avatar||"");if(xu(t))return`<img src="${i(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${bl("ogre")}';">`;const a=bl("ogre");if(e==="SW"||e==="OG")return`<img src="${a}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${i(r)}</span>`}function xu(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function ot(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const a=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return a?`https://ipfs.io/ipfs/${encodeURIComponent(a).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function $g(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function Tg(e="",t=""){const a=String(e||"").trim(),r=ot(t);if(!a||!r||Jr(a,r))return"";if(ht.set(a,r),ne("avatarCacheHit"),ht.size>900){for(const o of ht.keys())if(ht.delete(o),ht.size<=720)break}return r}function Mu(e="",t=""){return`${String(e||"").trim()}|${ot(t)}`}function Ag(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function Jr(e="",t=""){const a=Mu(e,t);if(!Qt.has(a))return!1;const r=Number(kr.get(a)||0);return r&&Date.now()-r>Ag(t)?(Qt.delete(a),kr.delete(a),!1):!0}function Pg(e="",t=""){const a=String(e||"").trim(),r=ot(t);if(!a||!r)return;const o=Mu(a,r);if(Qt.add(o),kr.set(o,Date.now()),Qt.size>1200){for(const s of Qt)if(Qt.delete(s),kr.delete(s),Qt.size<=900)break}ht.get(a)===r&&ht.delete(a),ne("avatarFetchFailed")}function Si(e="",...t){const a=String(e||"").trim(),r=a?ht.get(a):"";if(r&&!Jr(a,r))return ne("avatarCacheHit"),r;r&&ht.delete(a);for(const o of t){const s=ot(o);if(s&&!Jr(a,s))return ne("avatarCacheMiss"),s}return ne("avatarFallbackShown"),""}window.__slimeRememberAvatar=Tg,window.__slimeAvatarLoadFailed=function(t){const a=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Pg(a,r);const o=ot(t?.dataset?.backupSrc||"");if(o&&!Jr(a,o)){t.dataset.backupSrc="",t.dataset.avatarSrc=o,t.src=o;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function ki(e){const t=Je(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function $i(e=n.xHandle){const t=Je(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Cg(e={}){const t=ot(e.avatar||e.image||"");if(xu(t))return t;const a=Je(e.twitter||e.x||e.username||"");if(a)return ki(a);const r=Je(e.name||e.kolName||"");return r&&r.length>=2?ki(r):""}function Lg(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function Bu(e={},t="kol-avatar"){const a=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=Si(a,Cg(e)),o=Lg(e);return r?`<img class="${i(t)}" src="${i(r)}" data-avatar-key="${i(a)}" data-avatar-fallback="${i(o)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${i(t)} kol-avatar-fallback" aria-hidden="true">${i(o)}</div>`}function Yr(){const e=Ve();return[{id:"phantom",label:"Phantom",detected:!!me("phantom"),mobileRedirect:e&&!!En("phantom"),installUrl:Gs("phantom"),icon:ja("phantom")},{id:"solflare",label:"Solflare",detected:!!me("solflare"),mobileRedirect:e&&!!En("solflare"),installUrl:Gs("solflare"),icon:ja("solflare")},{id:"backpack",label:"Backpack",detected:!!me("backpack"),mobileRedirect:!1,installUrl:Gs("backpack"),icon:ja("backpack")},{id:"solana",label:"Detected Wallet",detected:!!me("solana"),mobileRedirect:!1,installUrl:"",icon:ja("solana")}]}function me(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Ee(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function le(){return n.user?.connectedWallet||n.connectedWalletBalance||null}function xg(e=""){const t=le();if(!t?.publicKey)return"";const a=String(e||"")==="connected"||!e&&!n.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${a?"selected":""}>${i(r)} - ${i(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}const Ti="/assets/slimewire/swap/states/",Ai="/assets/slimewire/swap/sfx/",Ru="/assets/slimewire/volume/states/",Iu="/assets/slimewire/volume/sfx/",Nt={launchCoin:{base:"/assets/slimewire/launch/states/",poster:"/assets/slimewire/launch/hero.png",tier:"OGRE FORGE",cap:["Pump Launcher","Forge it · birth it · send it."],accent:"launch",idle:"idle",event:"launch",sfx:[Ai+"win.mp3",.8]},sniper:{base:"/assets/slimewire/sniper/states/",poster:"/assets/slimewire/sniper/hero.png",tier:"OGRESNIPER",cap:["OgreSniper","Lock on · strike first."],accent:"sniper",idle:"idle",event:"fire",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},ogreAi:{base:"/assets/slimewire/ogreai/states/",poster:"/assets/slimewire/ogreai/hero.png",tier:"OGRE A.I.",cap:["Ogre A.I.","Ask the swamp oracle."],accent:"ogreai",idle:"idle",event:"speak",sfx:[Ai+"appraise.mp3",.6]},bundle:{base:"/assets/slimewire/bundle/states/",poster:"/assets/slimewire/bundle/hero.png",tier:"OGRE BUNDLE",cap:["Bundle","Many wallets · one volley."],accent:"bundle",idle:"idle",event:"volley",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},positions:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"POSITIONS",cap:["Open Positions","Your swamp, live."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"PROFIT & LOSS",cap:["PnL","Count the winnings."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]}};function Mg(){const e=I.kind;return e==="swap"?Ti:e==="volume"?Ru:Nt[e]?Nt[e].base:Ti}const Bg={launchCoin:"[data-launch-coin-submit]",ogreAi:"[data-ogre-ai-start]",bundle:"[data-bundle-buy]"};let Ou=!1;function Rg(){Ou||(Ou=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("[data-ogre-card]");if(t){e.preventDefault(),e.stopPropagation(),Og(t.getAttribute("data-ogre-card"));return}const a=I.kind;if(!a)return;const r=e.target.closest("button");if(!r)return;const o=document.querySelector(`[data-ogre-stage="${a}"]`);if(!o)return;if(Nt[a]){const s=Bg[a],c=(r.textContent||"").toLowerCase();(s&&r.closest(s)||a==="sniper"&&/snipe|ape|fire/.test(c))&&Vg(a)}else a==="swap"&&r.closest("[data-swap-use-custom-amount]")?_e(o,"buy",!0):a==="volume"&&r.closest("[data-vbot-start]")&&_e(o,"running",!0)}catch{}},!0))}function Ig(e,t){try{const a=document.createElement("a");a.href=t,a.download=e,document.body.appendChild(a),a.click(),a.remove()}catch{}}async function Og(e){const t=r=>{const o=Number(r);return Number.isFinite(o)?o.toFixed(4):"0"};let a=null;if(e==="swap"){const r=n.tradeResult||{};a={theme:"swap",receipt:!0,loss:!1,headline:"SWAPPED",mint:r.tokenMint||n.tradeToken||"",symbol:String(r.symbol||r.shortMint||"TOKEN"),name:"OgreSwap",lines:[r.type==="sell"?`Received ${t(r.netSol)} SOL`:r.type==="buy"?`Aped ${t(r.spentSol)} SOL`:"Swapped on SlimeWire","OgreSwap · on-chain","slimewire.org"]}}else if(e==="volume"){const r=Array.isArray(n.volumeBots)?n.volumeBots:[],o=r.find(u=>u&&u.status!=="completed")||r[r.length-1]||{},s=o.stats||{},c=Number(o.buyAmountSol||0),l=(Number(s.buys||0)+Number(s.sells||0))*c;a={theme:"volume",receipt:!0,loss:!1,headline:"VOLUME RUN",mint:o.tokenMint||"",symbol:String(o.shortMint||"SLIMEBOT"),name:"SlimeBot",lines:[`${l.toFixed(2)} SOL volume`,`${Number(o.walletCount||0)} wallets · ${Number(o.currentCycle||o.cycles||0)} rounds`,"SlimeBot · slimewire.org"]}}else return;try{const r=await k("/api/web/card",{method:"POST",body:JSON.stringify(a)});r&&r.ok&&r.png&&Ig(`slimewire-${e}-card.png`,r.png)}catch{}}let Pi=0;function Eg(e,t){try{const a=e.querySelector(".trade-head");if(!a)return;if(t==="terminal"||t==="live"){const r=a.querySelector("p");if(r&&!r.querySelector(".ogre-radar")){const o=e.querySelectorAll(".signal-row, [data-token-mint]").length;r.innerHTML=`<span class="ogre-radar"><span class="rdr"></span><span class="rl">RADAR</span> · <b>${o}</b> live · scanning the swamp</span>`;const s=r.querySelector(".ogre-radar");s&&o>Pi&&Pi>0&&(s.classList.add("hit"),setTimeout(()=>s.classList.remove("hit"),700)),Pi=o}}else if(t==="kol"||t==="slimeScope"||t==="watchlist"){const r=a.querySelector("h3");r&&!r.querySelector(".ogre-spy")&&r.insertAdjacentHTML("afterbegin",'<span class="ogre-spy" title="Intel watch"><i></i></span>')}else t==="smartChart"&&(a.querySelector(".ogre-chartwatch")||a.insertAdjacentHTML("beforeend",'<span class="ogre-chartwatch"><span class="ce"></span>WATCHING</span>'))}catch{}}let pa=!0;try{pa=localStorage.getItem("ogreStageSound")!=="off"}catch{}const Eu={};function Qr(e,t){if(pa)try{let a=Eu[e];a||(a=new Audio(e),a.preload="auto",Eu[e]=a),a.volume=t??.7,a.currentTime=0,a.play().catch(()=>{})}catch{}}const I={kind:null,clip:"",eventUntil:0,prev:{},feed:[],feedIdx:0,tkTimer:0};function Fg(e){return e=String(e||""),e.length>9?`${e.slice(0,4)}…${e.slice(-4)}`:e||"coin"}function Ci(e){return e&&e.symbol?`$${e.symbol}`:e&&e.shortMint?`$${e.shortMint}`:"the coin"}function Fu(e){return`<video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${e==="swap"?"/assets/slimewire/swap/hero.png":"/assets/slimewire/volume/hero.png"}" src="${e==="swap"?Ti:Ru}idle.mp4"></video>`}function Wg(){return`
    <div class="ogre-stage swap" data-ogre-stage="swap">
      ${Fu("swap")}
      <span class="os-tier">OGRESWAP</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <button class="os-card" data-ogre-card="swap" type="button" title="Download a share card">🏆</button>
      <span class="os-led"></span>
      <div class="os-shield" data-os-shield><span class="ic">🛡️</span><span data-os-shield-text>SHIELD</span></div>
      <div class="os-read" data-os-read><div class="l">SlimeShield score</div><div class="v" data-os-read-v>—</div></div>
      <div class="os-gauge"><div class="fill" data-os-gauge></div></div>
      <div class="os-orb" data-os-orb><span class="s" data-os-orb-s></span><span class="p" data-os-orb-p></span></div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>OgreSwap ready — paste a coin to appraise</span></div>
      <div class="os-cap"><h4>OgreSwap</h4><p>Appraise it · swap it · bank it.</p></div>
    </div>`}function Ng(){return`
    <div class="ogre-stage volume" data-ogre-stage="volume">
      ${Fu("volume")}
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
      <div class="os-cap"><h4>SlimeBot Volume Engine</h4><p>A swarm of wallets · lifelike flow.</p></div>
    </div>`}function Dg(e){return e==="volume"&&(n.volumeBots||[]).some(t=>t&&t.status!=="completed")?"running":"idle"}function _g(e){const t=Nt[I.kind];if(t){t.sfx&&e===t.event&&Qr(t.sfx[0],t.sfx[1]);return}if(I.kind==="swap"){const a={appraise:["appraise.mp3",.7],buy:["buy.mp3",.85],win:["win.mp3",.85],loss:["loss.mp3",.6],banking:["bank.mp3",.8]};a[e]&&Qr(Ai+a[e][0],a[e][1])}else if(I.kind==="volume"){const a={running:["start.mp3",.7],sweep:["sweep.mp3",.8]};a[e]&&Qr(Iu+a[e][0],a[e][1])}}function _e(e,t,a){const r=e.querySelector("[data-ogre-bg]");if(!r||I.clip===t)return;I.clip=t;const o=Mg();try{r.loop=!a,r.muted=!0,r.src=o+t+".mp4",r.load();const s=r.play();s&&s.catch&&s.catch(()=>{})}catch{}a&&(I.eventUntil=Date.now()+(t==="running"?8500:4600),_g(t))}function tn(e,t){I.feed.unshift({text:e,color:t||""}),I.feed.length>16&&I.feed.pop(),I.feedIdx=0}function Ug(){const e=document.querySelector("[data-ogre-stage]");if(!e){I.tkTimer&&(clearInterval(I.tkTimer),I.tkTimer=0);return}const t=e.querySelector("[data-os-tk]");if(!t)return;if(!I.feed.length){const o=Nt[I.kind];if(o)t.innerHTML='<span class="os-dot"></span>'+o.cap[1];else if(I.kind==="volume"){const s=(n.volumeBots||[]).some(c=>c&&c.status!=="completed");t.innerHTML='<span class="os-dot"></span>'+(s?"Swarm running — generating lifelike volume":"SlimeBot idle — set a token and start")}else t.innerHTML='<span class="os-dot"></span>'+(n.tradeToken?"Coin loaded — set your size and SWAP":"OgreSwap ready — paste a coin to appraise");return}const a=I.feed[I.feedIdx++%I.feed.length],r=a.color?`<span class="os-dot" style="background:${a.color};box-shadow:0 0 8px ${a.color}"></span>`:'<span class="os-dot"></span>';t.innerHTML=r+i(a.text),t.style.animation="none",t.offsetWidth,t.style.animation="os-tkin .5s ease"}function qg(e){const t=e.querySelector("[data-ogre-stage]");if(!t){I.kind=null;return}const a=t.getAttribute("data-ogre-stage");I.kind!==a&&(I.kind=a,I.clip="",I.eventUntil=0,I.prev={},I.feed=[],I.feedIdx=0);const r=t.querySelector("[data-ogre-snd]");r&&(r.textContent=pa?"🔊":"🔇",r.onclick=s=>{s.stopPropagation(),pa=!pa;try{localStorage.setItem("ogreStageSound",pa?"on":"off")}catch{}r.textContent=pa?"🔊":"🔇"});const o=t.querySelector("[data-ogre-bg]");o&&!o.__ogreBound&&(o.__ogreBound=!0,o.addEventListener("ended",()=>{o.loop||(I.eventUntil=0,I.clip="",_e(t,Dg(I.kind),!1))})),I.tkTimer||(I.tkTimer=setInterval(Ug,3400)),Rg(),a==="swap"?zg(t):a==="volume"?jg(t):Kg(t,a)}function Hg(e){const t=Nt[e];return t?`
    <div class="ogre-stage hero ${t.accent}" data-ogre-stage="${e}" data-hero="1">
      <video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${t.poster}" src="${t.base}${t.idle}.mp4"></video>
      <span class="os-tier">${i(t.tier)}</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <span class="os-led"></span>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>${i(t.cap[1])}</span></div>
      <div class="os-cap"><h4>${i(t.cap[0])}</h4><p>${i(t.cap[1])}</p></div>
    </div>`:""}function Kg(e,t){Date.now()>=I.eventUntil&&_e(e,"idle",!1)}function Vg(e){const t=document.querySelector(`[data-ogre-stage="${e}"]`),a=Nt[e];t&&a&&I.kind===e&&_e(t,a.event,!0)}function zg(e){const t=String(n.tradeToken||"").trim(),a=t?(n.slimeShieldResults||{})[t]:null,r=e.querySelector("[data-os-shield]"),o=e.querySelector("[data-os-shield-text]"),s=e.querySelector("[data-os-gauge]"),c=e.querySelector("[data-os-read]"),l=e.querySelector("[data-os-read-v]");if(a){const p=String(a.verdict||"").toLowerCase(),f=p.includes("avoid")||p.includes("danger")||p.includes("rug")?"avoid":p.includes("safe")||p.includes("clean")||p.includes("ok")?"safe":"risk";r&&(r.className="os-shield show "+f),o&&(o.textContent=String(a.verdict||"checked").toUpperCase());const y=Number(a.score);!isNaN(y)&&s&&(s.style.height=Math.max(6,Math.min(100,y))+"%"),!isNaN(y)&&c&&l&&(c.classList.add("show"),l.textContent=Math.round(y),l.className="v "+(f==="avoid"?"down":f==="safe"?"up":"")),e.classList.toggle("loss",f==="avoid")}else r&&(r.className="os-shield"),c&&c.classList.remove("show"),s&&(s.style.height="6%"),e.classList.remove("loss");if(t&&t!==I.prev.swapToken&&(I.prev.swapToken=t,tn("Appraising $"+Fg(t),"#36e0c8"),_e(e,"appraise",!0),!a&&typeof Ho=="function"))try{Ho(t).catch(()=>{})}catch{}const u=n.tradeResult,d=u?`${u.signature||u.message||""}|${u.type||""}`:"";if(u&&d!==I.prev.swapRes){if(I.prev.swapRes=d,u.type==="buy"){_e(e,"buy",!0);const p=e.querySelector("[data-os-orb]");if(p){p.classList.add("show","up"),p.classList.remove("down");const f=p.querySelector("[data-os-orb-s]"),y=p.querySelector("[data-os-orb-p]");f&&(f.textContent=Ci(u).replace("$","").slice(0,7)),y&&(y.textContent="HELD")}tn("Bought "+Ci(u),"#9dff6a")}else if(u.type==="sell"){_e(e,"banking",!0);const p=e.querySelector("[data-os-orb]");p&&p.classList.remove("show"),tn("Sold "+Ci(u)+" — banked","#ffd45a")}}Date.now()>=I.eventUntil&&_e(e,"idle",!1)}function Wu(e,t,a,r){const o=e.querySelector("[data-ov-swarm]");if(!o)return;if(t=Math.max(0,Math.min(12,Math.round(t))),o.children.length!==t){o.innerHTML="";for(let d=0;d<t;d++){const p=document.createElement("div");p.className="ov-orb";const f=d/t*Math.PI*2-Math.PI/2;p.style.left=50+Math.cos(f)*34+"%",p.style.top=46+Math.sin(f)*30+"%",o.appendChild(p)}}const s=o.children;if(!s.length)return;const c=Number(I.prev.volBuys||0),l=Number(I.prev.volSells||0),u=(d,p)=>{for(let f=0;f<p&&f<3;f++){const y=s[Math.floor(Math.random()*s.length)];y.classList.remove("buy","sell"),y.offsetWidth,y.classList.add(d),setTimeout(()=>y.classList.remove(d),430)}};a>c&&u("buy",a-c),r>l&&u("sell",r-l),(a>c||r>l)&&Qr(Iu+"pulse.mp3",.32),I.prev.volBuys=a,I.prev.volSells=r}function jg(e){const a=(n.volumeBots||[]).find(u=>u&&u.status!=="completed")||null,r=!!a,o=I.prev.volActive;e.classList.toggle("live",r),r&&!o&&(tn("SlimeBot online — swarm spinning up","#c06bff"),_e(e,"running",!0)),!r&&o&&(tn("Swept back — funds returned home","#c06bff"),_e(e,"sweep",!0)),I.prev.volActive=r,Date.now()>=I.eventUntil&&_e(e,r?"running":"idle",!1);const s=e.querySelector("[data-ov-budget]"),c=e.querySelector("[data-ov-ring]"),l=e.querySelector("[data-ov-read]");if(a){const u=a.stats||{},d=Number(u.buys||0),p=Number(u.sells||0),f=Number(u.fundedSol||0),y=Number(a.currentCycle||0),g=Number(a.cycles||a.maxRounds||0),S=Number(a.buyAmountSol||0);if(s){s.classList.add("show");const A=s.querySelector("[data-ov-budget-v]");A&&(A.textContent=f.toFixed(3)+" SOL");const C=g>0?Math.min(1,y/g):0,M=s.querySelector("[data-ov-budget-bar]");M&&(M.style.width=C*100+"%")}if(c){c.classList.add("show");const A=2*Math.PI*22,C=g>0?Math.min(1,y/g):0,M=c.querySelector("[data-ov-ring-prg]");M&&(M.style.strokeDasharray=A,M.style.strokeDashoffset=A*(1-C));const q=c.querySelector("[data-ov-ring-lbl]");q&&(q.textContent=y+"/"+(g||"?"))}if(l){l.classList.add("show");const A=(d+p)*S,C=(M,q)=>{const J=l.querySelector(M);J&&(J.textContent=q)};C("[data-ov-vol]",A>0?A.toFixed(2)+" SOL":"—"),C("[data-ov-buys]",String(d)),C("[data-ov-sells]",String(p)),C("[data-ov-wallets]",String(Number(a.walletCount||0)))}Wu(e,Number(a.walletCount||6),d,p);const T=(a.log||[])[0],b=T?(T.at||"")+(T.message||""):"";T&&b!==I.prev.volLog&&(I.prev.volLog=b,tn(String(T.message||"").slice(0,80),""))}else s&&s.classList.remove("show"),c&&c.classList.remove("show"),l&&l.classList.remove("show"),Wu(e,0,0,0)}function Gg(){const e=le(),t=n.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const a=ri(),r=Kc(),o=qc(a)||{symbol:a==="SOL"?"SOL":w(a),name:a==="SOL"?"Solana":""},s=qc(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=ch(),l=n.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":l?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=l?a:r,p=d&&d!=="SOL"?d:n.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${l?"100":"0.0"}" aria-label="${l?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${Hc(a,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${i(p||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${Hc(r,{includeCustom:!0})}
              </select>`,g=`
            <div class="oss-slot oss-pay" data-swap-slot="${l?"token":"base"}">${l?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${l?"base":"token"}">${l?f:y}</div>`;return`
    ${Wg()}
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
                ${an(e?.publicKey&&!t?"connected":"")}
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
          ${n.tradeToken?`<div class="card-actions">${Ge(vi(n.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${sb()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${Xg()}
        ${Jg()}
      </aside>
    </section>
  `}function Li(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!e?.volumeBot)}function Nu(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!!e?.volumeBot)}function an(e=""){const t=xg(e),a=Li().map(r=>{const o=n.balances.find(l=>Number(l.index)===Number(r.index)),s=o?.sol!==null&&o?.sol!==void 0?`${Number(o.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${i(r.label)}${c} - ${s}</option>`}).join("");return t||a?`${t}${a}`:'<option value="">No wallet connected</option>'}function Xg(){if(!n.tradeResult)return`
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
        ${Ge(pg(e))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Jg(){if(!n.tradePlanResult)return`
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
        <div><dt>Timer Exit</dt><dd>${i(lb(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${i(e.tokenMint)}">Copy CA</button>
        ${Ge(mg(e,"Armed managed trade"))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Du(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const a=t.toLowerCase(),r=a.includes("bonk")?"Bonk":a.includes("meteora")?"Meteora":a.includes("orca")?"Orca":a.includes("raydium")?"Raydium":a.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${i(t)}">${i(r)}</span>`}function Yg(){if(!n.ogreAiResult)return`
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
        ${t.map(o=>{const s=o.pick||{};return`
            <div class="ogre-ai-pick-card">
              <strong>${i(s.symbol||o.shortMint||"Pick")}</strong>
              ${Du(s)}
              <span>${i(s.name||o.tokenMint||"")}</span>
              <small>Score ${i(s.score||"n/a")} | MC ${i(s.marketCapLabel||"n/a")} | Liq ${i(s.liquidityLabel||"n/a")} | Age ${i(s.ageLabel||"n/a")}</small>
              ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(c=>i(c)).join(" | ")}</small>`:""}
              <small>${i(o.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${i(o.tokenMint)}">Copy CA</button>
                <a href="${i(s.dexUrl||o.dexUrl||Q(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${s.pumpUrl?`<a href="${i(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":a.map(o=>`
          <div class="ogre-ai-pick-card">
            <strong>${i(o.symbol||o.shortMint||"Pick")}</strong>
            ${Du(o)}
            <span>${i(o.name||o.tokenMint||"")}</span>
            <small>Score ${i(o.score||"n/a")} | MC ${i(o.marketCapLabel||"n/a")} | Liq ${i(o.liquidityLabel||"n/a")} | Age ${i(o.ageLabel||"n/a")}</small>
            ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(s=>i(s)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${i(o.tokenMint)}">Copy CA</button>
              <a href="${i(o.dexUrl||Q(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${o.pumpUrl?`<a href="${i(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(o=>`<span data-ok="false">${i(o.shortMint||o.tokenMint)}: ${i(o.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const Yn=[["strong","Strong 🔥","Highest win-rate mode. Waits for survivors (1.5–12 min old) with proven net-buying, real holders and healthy liquidity, then targets a 2x — entering before the breakout, not after. Built to win more than it loses."],["super_fresh","Super-fresh","Brand-new sub-$8K launches (under ~2 min) with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function Zr(){const e=a=>Yn.some(([r])=>r===a);if(n.ogreAiCategory&&e(n.ogreAiCategory))return n.ogreAiCategory;const t=Vl().category;return e(t)?t:"strong"}function _u(e){const t=Yn.find(([a])=>a===e);return t?t[2]:Yn[0][2]}function Qg(e){return`<div class="ogre-cat-segment" role="group">${Yn.map(([t,a])=>`<button type="button" data-ogre-cat="${i(t)}" data-active="${e===t}">${i(a)}</button>`).join("")}</div>`}function Zg(){const e=n.ogreAutopilot||{},t=!!e.enabled,a=Uu(e.category||Zr()),r=(c,l)=>c==null||c===""?l:c,o=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),s=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
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
      <small data-autopilot-status>${i(o)}${s?` — ${i(s)}`:""}</small>
    </article>
  `}function Uu(e){const t=Yn.find(([a])=>a===e);return t?t[1]:"Super-fresh"}function eb(){if(!n.wallets.length)return`${Za()}${O("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=Vl(),t=e.amountSol||"0.1",a=e.runCount||"1",r=(s,c,l)=>{const u=String(s||l||"");return u==="custom"?String(c||"custom"):u},o=Zr();return`
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
          ${Qg(o)}
          <small class="ogre-cat-hint">${i(_u(o))}</small>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="${i(t)}">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              ${["1","2","3","5","10","25"].map(s=>`<option value="${s}" ${a===s?"selected":""}>${s} ${s==="1"?"order":"orders"}</option>`).join("")}
            </select>
          </label>
          ${_t({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${_t({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Xe("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${_t({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${vt("ogre-ai")}
        </div>
        ${Dt("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${n.ogreAiLoading?"disabled":""}>${n.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${i(n.ogreAiStatus||_u(o))}</small>
      </article>

      <aside class="trade-side">
        ${gi({compact:!0})}
        ${Zg()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${Yg()}
      </aside>
    </section>
  `}function tb(){return n.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${n.bundleToken?Q(n.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${nn({toolKey:"bundle",activeKey:rn("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${i(n.bundleToken||n.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${vt("bundle")}
        </div>
        ${Dt("bundle")}
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
              ${eo("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${ao("bundle-plan")}
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
        ${ib()}
        ${ab()}
      </aside>
    </section>
  `:`${Za()}${O("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function ab(){if(!n.bundleResult)return`
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
  `}function vt(e,t=null){const a=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return Li().map((o,s)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${o.index}" ${r?r.has(String(o.index))?"checked":"":s<a?"checked":""}>
      <span>${o.index}. ${i(o.label)}</span>
      <code>${i(o.shortPublicKey||o.publicKey)}</code>
    </label>
  `).join("")}function Dt(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${i(t)}">
    </label>
  `}function nb(e=""){return n.wallets.length?n.wallets.map((t,a)=>{const r=String(t.index??a+1),o=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${i(r)}" ${String(e)===r?"selected":""}>${i(o)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,a=""){const r=m(e)?.value||a;if(r!=="custom")return r;const o=m(t)?.value?.trim();if(!o)throw new Error("Enter the custom value first.");return o}function st(e,t=""){const a=n.presets?.[e]||[],r=!t||t==="none"||t==="manual",o=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return a.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${a.map(s=>`<option value="${i(s.id)}" ${s.id===t?"selected":""}>${i(s.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
    `}function qu(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${i(He()||"0.10")}" value="${i(n.quickBuyAmountOverride)}">`}function Hu(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${qu()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${i(e)}">
          ${st("trade",n.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const rb=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],ob=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function _t({selectAttr:e,customAttr:t,customFor:a,options:r,selected:o="",customType:s="text",customPlaceholder:c="Custom time"}){const l=String(o||""),d=new Set(r.map(([f])=>f)).has(l)?l:"custom",p=d==="custom"&&l!=="custom"?l:"";return`
    <select ${e} data-custom-select="${i(a)}">
      ${r.map(([f,y])=>`<option value="${i(f)}" ${f===d?"selected":""}>${i(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${i(a)}" type="${i(s)}" value="${i(p)}" placeholder="${i(c)}" ${d==="custom"?"":"hidden"}>
  `}function Xe(e,t,a="off"){return _t({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:rb,selected:a,customPlaceholder:"Custom: 45s, 20, 2h"})}function eo(e,t,a="0"){return _t({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:ob,selected:a,customPlaceholder:"Custom: 30s, 20, 2h"})}function xi(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${qu()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${i(e)}">
          ${st("trade",n.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${i(e)}">
          ${st("bundle",n.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function Nk(){const e=n.fastTradePresetStatus||(n.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${an()}</select></label>
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
  `}function Dk(){const e=n.fastBundlePresetStatus||(n.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${vt("fast-bundle-preset")}</div>
        ${Dt("fast-bundle-preset")}
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
  `}function Ku(e){const t=e==="trade"?n.editingTradePresetId:n.editingBundlePresetId;return t?oe(e,t):null}function to(e,t){e==="trade"&&(n.editingTradePresetId=t||""),e==="bundle"&&(n.editingBundlePresetId=t||"")}function sb(){const e=Ku("trade"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${i(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${an(e?.walletIndex||"")}</select></label>
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
      ${Vu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function ib(){const e=Ku("bundle"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${i(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${vt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Dt("bundle-preset",e?.walletGroup||"")}
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
      ${Vu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function Vu(e){const t=n.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const a=e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId;return`
    <div class="preset-list">
      ${t.map(r=>{const o=r.id===a;return`
        <div class="preset-pill" data-readonly="${r.readonly?"true":"false"}" data-active="${o?"true":"false"}">
          <span>${i(r.name)}</span>
          <small>${i(r.amountSol)} SOL | TP ${i(r.takeProfitPct)} | SL ${i(r.stopLossPct)} | ${i(r.sellDelay||"off")}</small>
          <div class="preset-actions">
            <button type="button" class="${o?"primary":""}" data-use-preset="${i(e)}" data-preset-id="${i(r.id)}">${o?"Active":"Use"}</button>
            <button type="button" data-edit-preset="${i(e)}" data-preset-id="${i(r.id)}">Edit</button>
            <button type="button" data-delete-preset="${i(e)}" data-preset-id="${i(r.id)}">${r.readonly?"Remove":"Delete"}</button>
          </div>
        </div>
      `}).join("")}
    </div>
  `}function lb(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function ao(e){return`
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
  `}function ma(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function no(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(o=>o.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function cb(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),a=document.querySelector(`[data-custom-select="${t}"]`);a&&(a.value="off"),no()}function zu(){return n.wallets.map(e=>`<option value="${i(e.index)}">${i(e.index)}. ${i(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function ub(){return n.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${zu()}</select>
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
  `:""}function ro(e){n.distributeStatus=String(e||"");const t=m("[data-distribute-status]");t&&(t.textContent=n.distributeStatus)}function db(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.wallets.filter(r=>r.sessionWallet),a=t.length?t:n.wallets;return a.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${i(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${n.returnFundsBusy?"disabled":""}>${n.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${i(n.returnFundsStatus||`${a.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Qn(e){n.returnFundsStatus=String(e||"");const t=m("[data-return-funds-status]");t&&(t.textContent=n.returnFundsStatus)}async function ju(e="leaving"){try{const t=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!t?.publicKey)return;const a=n.wallets.filter(s=>s.sessionWallet);if(!a.length)return;const r=a.map(s=>String(s.index));if(!await Le({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function pb(){if(n.returnFundsBusy)return;const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey){Qn("Connect a wallet first.");return}const t=n.wallets.filter(s=>s.sessionWallet),r=(t.length?t:n.wallets).map(s=>String(s.index));if(!r.length){Qn("No managed wallets to return from.");return}if(await Le({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){n.returnFundsBusy=!0,Qn("Selling tokens and returning SOL..."),h();try{const s=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te});n.returnFundsBusy=!1,Qn(s.summary||"Funds returned to your connected wallet."),await De({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(s){n.returnFundsBusy=!1,Qn(s.message),h()}}}async function mb(){if(n.distributeBusy)return;const e=m("[data-distribute-count]")?.value||"5",t=m("[data-distribute-amount]")?.value||"",a=m("[data-distribute-source]")?.value||"1",r=m("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){ro("Enter SOL per wallet greater than zero.");return}const o=(Number(t)||0)*(Number(e)||0);if(await Le({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${o.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){n.distributeBusy=!0,ro("Creating and funding wallets..."),h();try{await Y(m("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:a,label:r}),dedupe:!1,timeoutMs:te});c.downloads?.encryptedBackup?.text&&fe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&fe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.distributeBusy=!1,ro(c.summary||"Fresh wallets created and funded. Backups downloaded."),await De({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){n.distributeBusy=!1,ro(c.message),h()}}}function fb(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function hb(){const e=Nu().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${n.sweepBackgroundStatus?`<small data-sweep-background-status>${i(n.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function gb(){const e=Array.isArray(n.volumeBots)?n.volumeBots:[],t=hb();return e.length?t+e.map(a=>{const r=a.stats||{},o=a.status!=="completed",s=(a.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${i(a.shortMint||a.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${i(a.stage||"")}">${i(fb(a))}</span>
          </div>
          ${o?`<button class="secondary" data-vbot-stop="${i(a.id)}">Stop & Sweep</button>`:`<a class="mini-link" href="${i(a.dexUrl||"#")}" target="_blank" rel="noreferrer">Dex</a>`}
        </header>
        <div class="volume-bot-metrics">
          <div><span>Cycle</span><strong>${i(Number(a.currentCycle||0))}/${i(Number(a.cycles||0))}</strong></div>
          <div><span>Wallets</span><strong>${i(Number(a.walletCount||0))}</strong></div>
          <div><span>Buys</span><strong>${i(Number(r.buys||0))}</strong></div>
          <div><span>Sells</span><strong>${i(Number(r.sells||0))}</strong></div>
          <div><span>Errors</span><strong>${i(Number(r.errors||0))}</strong></div>
        </div>
        <small>${i(a.message||"")}</small>
        ${s.length?`<ul class="volume-bot-log">${s.map(c=>`<li>${i(c.message||"")}</li>`).join("")}</ul>`:""}
      </article>
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function Mi(e,t,a){return`<div class="vbot-segment" role="group">${a.map(([r,o])=>`<button type="button" data-vbot-set-${e}="${i(r)}" data-active="${t===r}">${i(o)}</button>`).join("")}</div>`}function bb(){const t=(Array.isArray(n.volumeBots)?n.volumeBots:[]).filter(c=>c.status!=="completed"),a=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),o=c=>c.reduce((l,u)=>l+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),s=(c,l,u,d,p)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${i(c)}</h4>
      <p class="vbot-queue-sub">${i(l)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${u} / ${d}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,u/d*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${p}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${s("SMART","Smart Mode RPC Servers",a.length,10,o(a))}
      ${s("SPAMMER","Spammer RPC Servers",r.length,1,o(r))}
    </div>`}function yb(){return`
    ${Ng()}
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
        <div class="ovs-mode">${Mi("mode",n.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${Mi("aggr",n.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${zu()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Chart shape <span style="opacity:.6;font-weight:600">· the pattern it paints</span></span>
            ${Mi("stagger",n.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Uptrend"]])}
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
          ${bb()}
        </div>

        <div class="volume-bot-list">
          ${gb()}
        </div>
      </div>
    </section>
  `}function vb(){const e=n.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(n.slimeBotAggr)?n.slimeBotAggr:"med",a=Math.max(.05,Math.min(50,Number(m("[data-vbot-invest-num]")?.value||m("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(m("[data-vbot-duration]")?.value||"60"))),s={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",l=s.delaySecs*(c?4:1);let u=Math.round(r*60/l);u=Math.max(1,Math.min(250,u,Math.floor(a/.01)));const d=Math.max(.005,Math.min(.5,a/u));return{tokenMint:m("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:m("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(s.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(s.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(s.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!m("[data-vbot-keepdust]")?.checked,offsetSell:!!m("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(n.slimeBotStagger)?n.slimeBotStagger:"steady",investment:a,durationMin:r,mode:e,aggr:t}}function fa(e){n.volumeBotStatus=String(e||"");const t=m("[data-vbot-status]");t&&(t.textContent=n.volumeBotStatus)}async function oo({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");n.volumeBots=Array.isArray(t.bots)?t.bots:[],n.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function wb(){if(n.volumeBotBusy)return;const e=vb();if(!e.tokenMint){fa("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Le({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){n.volumeBotBusy=!0,fa("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:te});n.volumeBotBusy=!1,r.bot&&(n.volumeBots=[r.bot,...n.volumeBots.filter(o=>o.id!==r.bot.id)]),fa(r.bot?.message||"SlimeBot started."),h(),oo()}catch(r){n.volumeBotBusy=!1,fa(r.message),h()}}}async function Sb(e){if(e)try{fa("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:te});t.bot&&(n.volumeBots=n.volumeBots.map(a=>a.id===t.bot.id?t.bot:a)),fa(t.bot?.message||"Stop requested."),h(),oo()}catch(t){fa(t.message)}}function kb(){return n.wallets.length?yb():`${Za()}${O("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function $b(){const e=be([...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...Ne()?.rows||[],...n.scan?.rows||[]]).sort(Ze),t=fn(e),a=nt("launch",t),r=mn(),o=kt(Me().keywords)[0]||"";return`
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
        ${al("launch",{rawCount:e.length,visibleCount:t.length})}
        ${tl(e,t)}
        ${a.length?ct(a,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Ta}):r?pr(e,"launch candidates"):O("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
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
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${i(o.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${vt("launch")}
        </div>
        ${Dt("launch")}
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
            ${eo("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${ao("launch")}
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
          <p>It scans live launch/profile feeds about every ${i(qb())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${sd()}
        </article>
      </aside>
    </section>
  `}function Gu(e=n.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||n.launchWatches?.[0]?.tokenMint||n.launchWatches?.[0]?.mint||n.smartChartToken?.tokenMint||n.smartChartToken?.mint||"").trim()}function Bi(){return!!(Jt&&Jt.enabled&&(Jt.provider||Jt.playbackBaseUrl||Jt.ingestUrl))}function Tb(){const e=String(Jt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function Ab(e){const t=String(Jt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const a=t.includes("?")?"&":"?";return`${t}${a}mint=${encodeURIComponent(e)}`}function Pb(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function Xu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function Cb(e=n.launchCoinDraft||{}){const t=Gu(e),a=Bi(),r=Ab(t),o=n.pumpLiveStatus||(t?a?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),s=t?"":"disabled",c=a&&r?`<iframe class="pump-live-frame" src="${i(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
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
          <div class="pump-live-stat"><span>Launch CA</span><strong>${i(Pb(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${i(Tb())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${i(Xu(t))}</strong></div>
        </div>
      </div>
      <div class="quick-grid pump-live-controls">
        <button type="button" data-pump-live-action="go" ${s}>Go Live</button>
        <button type="button" data-pump-live-action="chart" ${s}>Chart + Txns</button>
        <button type="button" data-pump-live-action="copy" ${s}>Copy Stream ID</button>
        <button type="button" data-pump-live-action="obs" ${s}>OBS / Mobile Setup</button>
        <button type="button" data-pump-live-action="end" ${s}>End Live</button>
      </div>
      <p class="pump-live-status">${i(o)}</p>
    </section>
  `}function nn({toolKey:e,activeKey:t,sections:a,variant:r=""}){const o=a.some(s=>s.key===t)?t:a[0]?.key;return`
    <div class="tool-panels${r==="stacked"?" is-stacked":""}" data-tool-panels="${i(e)}">
      <nav class="tool-panel-nav" aria-label="Sections">
        ${a.map(s=>`
          <button type="button" class="tool-panel-tab" data-tool-section="${i(e)}:${i(s.key)}" data-active="${s.key===o?"true":"false"}">
            <span class="tool-panel-tab-label">${i(s.label)}</span>
            ${s.hint?`<span class="tool-panel-tab-hint">${i(s.hint)}</span>`:""}
          </button>`).join("")}
      </nav>
      <div class="tool-panel-stack">
        ${a.map(s=>`
          <section class="tool-panel" data-tool-panel="${i(e)}:${i(s.key)}"${s.key===o?"":" hidden"}>
            ${s.title?`<h4 class="tool-panel-title">${i(s.title)}</h4>`:""}
            ${s.html}
          </section>`).join("")}
      </div>
    </div>
  `}function rn(e,t){return n.toolSections&&n.toolSections[e]||t}function Lb(){const e=n.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,a=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${i(Ka(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ge(a+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function xb(e={}){Ju();const t=n.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
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
          ${t.map(o=>`
            <div class="row-card">
              <div class="row-main">
                <strong>$${i(o.symbol)} ${o.mint?"🚀 launched":"⏳ counting down"}</strong>
                <small>${i(o.subscribers||0)} waiting | ${i(o.url)}</small>
              </div>
              <div class="card-actions compact">
                <button data-copy="${i(o.url)}">Copy Link</button>
                <a class="button-like" href="${i(o.url)}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>`).join("")}
        </div>`:""}
    </div>`}let so="";function Ju(){!n.user||so===n.user.id||(so=n.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});n.hypePages=e.pages||[],n.hypePages.length&&h()}catch{so=""}})())}async function Mb(){const e=m("[data-hype-status]"),t=String(m("[data-hype-name]")?.value||m("[data-launch-coin-name]")?.value||"").trim(),a=String(m("[data-hype-symbol]")?.value||m("[data-launch-coin-symbol]")?.value||"").trim(),r=String(m("[data-hype-launch-at]")?.value||"").trim(),o=String(m("[data-hype-blurb]")?.value||"").trim();if(!t||!a){v(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){v(e,"Pick the launch time.");return}v(e,"Creating hype page...");try{const s=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:a,blurb:o,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});n.hypeStatus=`Hype page live: ${s.url} - share it everywhere, it forwards to your chart at launch.`,so="",Ju(),h()}catch(s){v(e,D(s?.message||"Could not create the hype page."))}}function Bb(){const e=n.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
                ${nb(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
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
                ${st("trade",e.tradePresetId||n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${st("bundle",e.bundlePresetId||n.selectedBundlePresetId)}
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
                ${n.wallets.length?vt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Dt("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:xb(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:Cb(e)}];return`
    ${Lb()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${nn({toolKey:"launchCoin",activeKey:rn("launchCoin","coin"),sections:t})}

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <button type="button" data-launch-coin-save>Save Launch Sheet</button>
          <button type="button" data-launch-coin-use-ca>Use Live CA</button>
          <a href="https://pump.fun/create" target="_blank" rel="noreferrer">Open Pump Create</a>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${i(n.launchCoinStatus||"Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The official Pump and Dex links remain available as fallback tools.")}</p>
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
          ${sd()}
        </article>
      </aside>
    </section>
  `}function Rb(){const e=n.launchCoinDraft||{},t=m("[data-launch-coin-image]")?.files?.[0];return{name:(m("[data-launch-coin-name]")?.value||"").trim(),symbol:(m("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(m("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",bannerName:m("[data-launch-coin-banner]")?.files?.[0]?.name||e.bannerName||"",bannerDataUrl:e.bannerDataUrl||"",bannerType:e.bannerType||"",website:(m("[data-launch-coin-website]")?.value||"").trim(),x:(m("[data-launch-coin-x]")?.value||"").trim(),telegram:(m("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:(()=>{const a=m("[data-launch-coin-creator-fee]")?.value;return a==="custom"?String(Math.min(1e3,Math.max(0,Math.round((Number(m("[data-launch-coin-creator-fee-custom]")?.value)||0)*100)))):a||e.creatorFeeBps||"1000"})(),creatorFeeRecipient:(m("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:m("[data-launch-coin-fee-mode]")?.value||e.feeMode||"dev",buybackWallet:(m("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!m("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!m("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:m("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:X(m("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(m("[data-launch-coin-ca]")?.value||"").trim(),action:m("[data-launch-coin-action]")?.value||"watch",tradePresetId:m("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:m("[data-launch-coin-bundle-preset]")?.value||"",amountSol:X(m("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:m("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:qe("launch-coin"),walletGroup:m("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function io(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function Zn({silent:e=!1}={}){try{const t=Rb();n.launchCoinDraft=t,Ma(t);const a=t.name||t.symbol||"launch";return n.launchCoinStatus=`Saved ${a}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${io(t.action)}.`,e||v(m("[data-launch-coin-status]"),n.launchCoinStatus),t}catch(t){throw n.launchCoinStatus=t.message,v(m("[data-launch-coin-status]"),t.message),t}}function Yu(e){return new Promise((t,a)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>a(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function Qu(e){return new Promise((t,a)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>a(new Error("Could not preview that image for compression.")),r.src=e})}function on(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function Zu(e){if(!e)return"";const t=8*1024*1024,a=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const o=await Yu(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(o.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return o}try{const s=await Qu(o),c=384,l=Math.min(1,c/Math.max(s.width||c,s.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((s.width||c)*l)),u.height=Math.max(1,Math.round((s.height||c)*l)),u.getContext("2d").drawImage(s,0,0,u.width,u.height);const p=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of p){const g=u.toDataURL(f,y);if(g.length<=a)return g}}catch(s){const c=m("[data-launch-coin-status]"),l="Preview unavailable; SlimeWire will try to convert this image during launch.";if(n.launchCoinStatus=l,v(c,l),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:s?.message||""}),o.length<=r)return o}if(o.length<=r){const s=m("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return n.launchCoinStatus=c,v(s,c),o}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function ed(e){if(!e)return"";const t=8*1024*1024,a=7e6;if(e.size>t)throw new Error("Banner is over 8MB. Use a smaller wide image or GIF (1500×500 works best).");const r=await Yu(e);if(e.type==="image/gif"||/\.gif$/i.test(e.name||"")){if(r.length>a)throw new Error("Animated banner is too large. Keep it under ~5MB.");return r}try{const o=await Qu(r),s=1500,c=Math.min(1,s/Math.max(1,o.width||s)),l=document.createElement("canvas");l.width=Math.max(1,Math.round((o.width||s)*c)),l.height=Math.max(1,Math.round((o.height||Math.round(s/3))*c)),l.getContext("2d").drawImage(o,0,0,l.width,l.height);for(const[d,p]of[["image/webp",.82],["image/webp",.7],["image/jpeg",.8],["image/jpeg",.66]]){const f=l.toDataURL(d,p);if(f.length<=a)return f}}catch{}if(r.length<=a)return r;throw new Error("Banner is too large for upload. Use a smaller wide image or GIF.")}async function Ib(){const e=m("[data-launch-coin-banner]")?.files?.[0];if(e){const a=await ed(e);return{bannerName:e.name,bannerType:on(a,e.type||"image/jpeg"),bannerDataUrl:a}}const t=n.launchCoinDraft||{};return t.bannerDataUrl?{bannerName:t.bannerName||"banner",bannerType:t.bannerType||on(t.bannerDataUrl,"image/jpeg"),bannerDataUrl:t.bannerDataUrl}:{}}async function Ob(){const e=m("[data-launch-coin-image]")?.files?.[0];if(e){const a=await Zu(e);return{imageName:e.name,imageType:on(a,e.type||"application/octet-stream"),imageDataUrl:a}}const t=n.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||on(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function td(e,t){const a=String(t||"").trim();n.launchCoinDraft={...e||{},tokenMint:a,updatedAt:new Date().toISOString()},Ma(n.launchCoinDraft),n.terminalToken=a,n.terminalAutoToken=a,n.tradeToken=a,n.bundleToken=a,n.volumeToken=a,n.smartChartToken=a,e?.tradePresetId&&(n.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(n.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(n.quickBuyAmountOverride=X(e.amountSol))}function Eb(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Fb(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,walletIndexes:[a],amountSol:X(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function ad(e={}){const t=e.bundlePresetId?oe("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Wb(){const e=Zn({silent:!0}),t=String(e.tokenMint||"").trim(),a=m("[data-launch-coin-status]");if(!t||t.length<32){n.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",v(a,n.launchCoinStatus);return}td(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";n.launchCoinStatus=`Loaded ${w(t)} into ${io(e.action)}. Review the selected preset before sending any trade.`,$e("/terminal",r),h({force:!0})}async function Nb(e,t){const a=Date.now();let r="",o=0;for(;Date.now()-a<18e4;){await Ce(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,o=0}catch{if(o+=1,o===4){const p="Progress feed reconnecting...";n.launchCoinStatus=p,v(t,p)}if(o>=15){const p=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw p.launchAttemptId=e,p}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const d=new Error(c.failureReason||"Launch failed.");throw d.launchAttemptId=e,d}const l=Math.round((Date.now()-a)/1e3),u=`${c.stageText||"Working..."} · ${l}s`;u!==r&&(r=u,n.launchCoinStatus=u,v(t,u))}const s=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw s.launchAttemptId=e,s}const nd=new Map;function rd(e){const t=String(e||"").trim();t&&nd.set(t,Date.now()+3e4)}function Db(e){const t=nd.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function od(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(n.tradePlans=e.plans)}catch{}}function _b(e,t={},a={}){const r=String(e||"").trim();if(!r)return;const o=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||w(r),s=String(t.name||"").slice(0,48),c=Number(a.bundledWalletCount||0)+(a.devBuyIncluded?1:0)||1;(n.positions||[]).some(u=>String(u.tokenMint||u.mint)===r)||(n.positions=[{tokenMint:r,symbol:o,name:s,shortMint:w(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...n.positions||[]]),n.smartChartToken=r,n.terminalToken=r,Gi({tokenMint:r,symbol:o,name:s,imageUrl:t.imageDataUrl||"",source:"launch"}),Vd(r)}async function Ub(){if(n.launchCoinSubmitting)return;const e=m("[data-launch-coin-status]"),t=m("[data-launch-coin-submit]");n.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const a=Zn({silent:!0});if(!a.name||String(a.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!a.symbol||String(a.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!m("[data-launch-coin-image]")?.files?.[0]&&!n.launchCoinDraft?.imageDataUrl&&!await Le({title:"No Coin Image Selected",lines:[`${a.name} (${a.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){n.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",v(e,n.launchCoinStatus);return}n.launchCoinStatus="Preparing image for SlimeWire backend conversion...",v(e,n.launchCoinStatus);const r=await Ob(),o=await Ib(),s=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let c=null;if(a.action==="bundle"){const g=ad(a);c={walletIndexes:g.walletIndexes||[],walletGroup:g.walletGroup||"",amountSol:g.amountSol||"0",slippageBps:g.slippageBps||"300"}}const l={...a,...r,...o,launchAttemptId:s,...c?{bundleBuy:c}:{}},u=JSON.stringify(l);if(u.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:s,step:"frontend_submit",symbol:a.symbol,selectedDevWalletId:a.selectedDevWalletId||a.devWalletIndex||a.devWalletPublicKey||""}),n.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${s}`,v(e,n.launchCoinStatus);let p=(await k("/api/web/launch/coin",{method:"POST",body:u,timeoutMs:te,preserveSafeError:!0})).launch||{};p.async&&p.status==="RUNNING"&&p.launchAttemptId&&(p=await Nb(p.launchAttemptId,e));const f=String(p.tokenMint||p.mint||p.ca||p.contractAddress||"").trim(),y=p.signature?` Signature: ${w(p.signature)}.`:"";if(!f){n.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${y} Paste the CA above when it appears, then tap Use Live CA.`,v(e,n.launchCoinStatus);return}td(a,f),n.launchShareKit={tokenMint:f,symbol:a.symbol||"",name:a.name||"",at:Date.now()},n.launchCoinDraft={tokenMint:f};try{Ma(n.launchCoinDraft)}catch{}if(p.bundled){const g=Number(p.bundledWalletCount||0),P=[p.devBuyIncluded?"dev buy":"",g>0?`${g} bundle buy${g===1?"":"s"}`:""].filter(Boolean).join(" + ");n.launchCoinStatus=p.bundleFallback?`Launched ${w(f)} via the standard path (bundle missed the block lottery)${P?` - server fired ${P} right behind the create`:""}.${y} Opening chart...`:`Launch bundled atomically: ${w(f)}${P?` (${P} landed in-block)`:""}${p.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${y} Opening chart...`,v(e,n.launchCoinStatus),_b(f,a,p),K(p.signature||"","pump-launch-first-buys"),bt({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(p.bundleFallback||p.exitsArmed)&&rd(f),[3e3,8e3,16e3].forEach(T=>window.setTimeout(()=>{od().then(()=>h())},T)),$e("/terminal/chart","smartChart"),h({force:!0});return}if(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Routing into ${io(a.action)}...`,v(e,n.launchCoinStatus),a.devBuyEnabled&&(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Running Dev Wallet Initial Buy first...`,v(e,n.launchCoinStatus),await Po(f,Fb(a)),n.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${io(a.action)} setup...`,v(e,n.launchCoinStatus)),a.action==="trade"){await Po(f,Eb(a));return}if(a.action==="bundle"){await Id(f,ad(a));return}if(a.action==="launch-watch"){n.activeTab="launch",$e("/terminal","launch"),h({force:!0});return}$e("/terminal/chart","smartChart"),h({force:!0})}catch(a){const r=a.launchAttemptId&&!String(a.message||"").includes(a.launchAttemptId)?` Launch ID: ${a.launchAttemptId}.`:"";n.launchCoinStatus=`${a.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:a.launchAttemptId||"",stage:a.stage||"",code:a.code||"",providerStatus:a.providerStatus||null,message:a.message||"Launch failed."}),v(e,n.launchCoinStatus),$(n.launchCoinStatus)}finally{n.launchCoinSubmitting=!1;const a=m("[data-launch-coin-submit]");a&&(a.disabled=!1,a.textContent=a.dataset.prevLabel||"Launch on Pump")}}function qb(){const e=n.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function sd(){return n.launchWatches.length?`
    <div class="mini-results">
      ${n.launchWatches.map(e=>`
        <span>
          $${i(e.ticker)} - ${i(e.status)} - ${i(e.walletCount)} wallet(s)
          ${Ge(yg(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${i(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function lo(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function id(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),a=Je(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),o=String(e.kolName||e.traderName||e.kol_name||"").trim(),s=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||a||o||r,wallet:t,kolWallet:t,twitter:a,handle:a,name:o||s||e.signalType||e.symbol||w(r),displayName:o||s||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:E(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||a?1:0),currentPositionCount:E(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:n.kolLastUpdatedAt||new Date().toISOString()}}function co(e={}){const t=Number(E(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),a=it(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(a),o=r?Math.max(0,Math.min(100,Math.round(a))):0,s=!r||t<5,c=s?"Mixed":o>=50?"High Dump Risk":o>=30?"Dump Risk":o<=15?"Trusted Flow":"Mixed",l=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=l[0]||"",d=Je(e.handle||e.twitter||""),p=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,g)=>/^https?:\/\//i.test(String(f.url||""))&&g.findIndex(S=>String(S.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:lo(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:l,callsTracked:t,currentPositionCount:E(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:o,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?o:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:s,confidence:s?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:p,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:s?["Low local sell-window history. Wallet-based until social signal data is available."]:o>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Hb(e=[]){const t=new Map;for(const a of e.filter(Boolean)){const r=String(a.kolId||lo(a)||"").trim();if(!r)continue;const o=t.get(r);t.set(r,o?{...o,...a,kolId:r}:{...a,kolId:r})}return[...t.values()]}function uo(){const e=Array.isArray(n.kolDumpStats?.stats)?n.kolDumpStats.stats:[],t=Array.isArray(n.kolScan?.kols)?n.kolScan.kols:[],a=Array.isArray(n.kolScan?.rows)?n.kolScan.rows.map(id):[],r=!e.length&&!t.length&&!a.length?wi():[];return Hb([...e,...t.map(co),...a.map(co),...r.map(co)]).filter(o=>o.kolId)}function Kb(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function er(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${Kb(e)} · ${t}`}function ld(e={}){const t=lo(e);return t?uo().find(a=>String(a.kolId||"")===t)||co(e):null}function Vb(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const a=Wt(t)?t:"";return{kolId:t,displayName:a?w(a):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:a?[a]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:a?`https://solscan.io/account/${encodeURIComponent(a)}`:""},{label:"KOLscan",url:a?`https://kolscan.io/account/${encodeURIComponent(a)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function Ri(e={},t="KOL Info"){if(!_("kolDumpDetectorEnabled",!0))return"";const a=ld(e),r=String(a?.kolId||lo(e)||"").trim();if(!r)return"";const o=a?er(a):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${i(r)}" title="${i(o)}">${i(t)}</button>`}function cd(e={},t="KOL Info"){return _("kolDumpDetectorEnabled",!0)?Ri(id(e),t):""}function zb(e={}){if(!_("kolDumpDetectorEnabled",!0))return"";const t=ld(e);return t?.kolId?`<small class="kol-dump-inline">${i(er(t))}</small>`:""}function _k(){if(!_("kolDumpDetectorEnabled",!0))return"";const e=uo().slice(0,6);return`
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
              <p>${i(er(t))}</p>
              <button type="button" data-kol-dump-details="${i(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:O("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function Ii(e={}){if(!_("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&n.kolDumpStatsLoadedAt&&Date.now()-Number(n.kolDumpStatsLoadedAt||0)<900*1e3)return n.kolDumpStats;if(n.kolDumpStatsLoading)return null;n.kolDumpStatsLoading=!0;try{const a=new URLSearchParams({mode:n.kolMode||"hot"});n.kolWallet&&a.set("wallet",n.kolWallet),t&&a.set("force","true");const r=await k(`/api/web/kols/dump-stats?${a.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return n.kolDumpStats=r,n.kolDumpStatsLoadedAt=Date.now(),ne(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return n.kolDumpStats=n.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},n.kolDumpStatsLoadedAt=Date.now(),null}finally{n.kolDumpStatsLoading=!1,n.kolDumpDetails?.open?po():n.activeTab==="kol"&&h({force:!0})}}function jb(e=""){const t=String(e||"").trim();!t||!_("kolDumpDetectorEnabled",!0)||(n.kolDumpDetails={open:!0,kolId:t},_a(),po(),Ii({force:!0}))}function Oi(){n.kolDumpDetails={open:!1,kolId:""},po(),Er()}function po(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=n.kolDumpDetails||{},a=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",a),!a||!_("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=uo().find(d=>String(d.kolId)===String(t.kolId))||Vb(t.kolId),o=!!n.kolDumpStatsLoading,s=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(d=>/^https?:\/\//i.test(String(d?.url||""))).slice(0,4):[],l=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",u=`
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
        <p>${i(er(r))}</p>
        <small>${o?"Updating from KOL sources...":`Confidence: ${i(r.confidence||"low")} · Source: ${i(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${i(we(r.updatedAt))}`}</small>
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
          <li><span>Wallets: ${i(s.length?s.map(w).join(", "):"not returned")}</span></li>
          <li><span>First seen: ${i(r.firstSeenAt?we(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${i(r.lastSeenAt?we(r.lastSeenAt):"n/a")}</span></li>
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
        <button type="button" data-kol-dump-refresh="${i(t.kolId)}" ${o?"disabled":""}>${o?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `;fr(e,u,".kol-dump-drawer")}function Gb(){const e=n.kolScan?.configured!==!1,t=n.kolLoading?"disabled":"",a=String(n.kolMode||"hot"),r=!!n.kolScan,o=!!n.kolScan?.kols?.length,s=o&&a!=="hot",c=!r&&!o;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${n.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${n.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${n.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${n.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${n.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${n.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${i(Jb(n.kolMode))}</p>
    ${Xb()}
    ${s?Qb():c?kg():""}
    ${n.kolMode==="slimewire"&&n.kolScan?n.kolScan.kols?.length?"":O("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):n.kolScan?Zb():O("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
            ${vt("kol")}
          </div>
          ${Dt("kol")}
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
            ${eo("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${ao("kol")}
        <p class="trade-status" data-kol-status>${n.kolResult?i(n.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${Yb()}
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
            ${n.kolWallet?Ge(Pu(n.kolWallet),"Share KOL"):""}
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
  `}function Xb(){const e=n.kolScan||null,t=tr(n.kolMode),a=n.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),o=Number(e?.rows?.length||0),s=n.kolLastUpdatedAt?we(n.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${i(a)}</span>
      <span>${i(r)} KOLs</span>
      <span>${i(o)} signals</span>
      <span>${i(s)}</span>
    </div>
  `}function tr(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function Jb(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function Yb(){const e=n.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function Qb(){const e=n.kolScan||{},t=(e.kols||[]).filter(a=>a.wallet||a.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${i(e.label||"KOL Tracker")}</h3>
          <p>${i(`${tr(n.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${i(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((a,r)=>`
          <article class="kol-profile">
            ${Bu(a)}
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
            <small>${i(a.source==="slimewire"?`Tracking ${a.trackedWalletMode==="manual"?`${a.trackedWalletCount||0} wallet(s)`:"all wallets"}`:a.volumeLabel||"Volume n/a")} | Last trade: ${i(we(a.lastTradeAt))}</small>
            ${zb(a)}
            <div class="card-actions kol-profile-actions">
              ${a.solscanUrl?`<a href="${i(a.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${a.kolscanUrl||a.wallet?`<a href="${i(a.kolscanUrl||Tc(a.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${Ri(a)}
              ${Ge(bg(a),"Share Watch")}
              ${a.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a.wallet)}">Copy Trade</button>`:""}
              ${a.wallet?`<button data-kol-scan-wallet="${i(a.wallet)}">Scan Positions</button>`:""}
              ${a.wallet?`<button data-kol-copy-wallet="${i(a.wallet)}">Copy Wallet</button>`:""}
              ${a.wallet?`<button data-copy="${i(a.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Zb(){const e=n.kolScan||{};if(e.configured===!1)return O("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],a=nt("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${i(tr(n.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${a.length}/${t.length} signals shown</span>
    </div>
    ${ct(a,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:gg})}
    ${la("kol",t,"KOL signals")}
  `:O(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function ud(){const e=m("input[data-wallet-label]"),t=m("input[data-wallet-count-input]"),a=m("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),v(a,"Creating wallets..."),r.forEach(o=>{o.disabled=!0,v(o,"Creating...")});try{const o=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(o)||o<1||o>20)throw new Error("Wallet count must be from 1 to 20.");await Y(a,"Creating secure web profile for wallet backups...");const s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:o})}),c=Array.isArray(s.wallets)?s.wallets:[];if(!c.length)throw new Error(s.message||"Wallet create did not return wallet data. Refresh and try again.");n.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&fe(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&fe(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),v(a,s.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const l=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(l?.wallets)&&(n.wallets=l.wallets)}catch{}n.toolSections={...n.toolSections||{},wallets:"balances"},n.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,K(xe(s.plan),"wallet-create"),n.activeTab="wallets",h()}catch(o){v(a,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,v(o,"Create Wallets")})}}async function ey(){const e=m("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),n.automationDelegationStatus="Creating automation wallet...",v(e,n.automationDelegationStatus),t.forEach(a=>{a.disabled=!0,v(a,"Creating...")});try{await Y(e,"Creating secure web profile for automation wallet backups...");const a=n.user?.connectedWallet,r=a?.publicKey?`Automation ${w(a.publicKey)}`:"Automation Wallet",o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(o.wallets)?o.wallets:[]).length)throw new Error(o.message||"Automation wallet create did not return wallet data. Refresh and try again.");n.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&fe(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&fe(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),n.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",K(xe(o.plan),"automation-wallet-create"),n.activeTab="wallets",h({force:!0})}catch(a){n.automationDelegationStatus=a.message,v(e,a.message),$(a.message)}finally{t.forEach(a=>{a.disabled=!1,v(a,"Create Automation Wallet")})}}function ty(e=null){const a=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||m("[data-session-wallet-amount]"),r=X(a?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const o=Number(r);if(!Number.isFinite(o)||o<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(o>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function ay(e=le()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(n.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});pe(t.user||{...n.user,connectedWallet:t.profile?.connectedWallet||null})}async function ny(e=null){const t=m("[data-automation-delegation-status]")||m("[data-wallet-connect-status]"),a=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),a.forEach(r=>{r.disabled=!0,v(r,"Opening...")});try{const r=ty(e),{provider:o,connected:s}=await kd();await Y(t,"Creating secure web profile for session wallet..."),await ay(s),n.automationDelegationStatus="Creating session wallet and funding approval...",v(t,n.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(s.publicKey)}`}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(c.wallets)?c.wallets:n.wallets,n.downloads=c.downloads||n.downloads||null,c.downloads?.encryptedBackup?.text&&fe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&fe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",v(t,n.automationDelegationStatus);const l=await My(c.order?.transaction,o);n.automationDelegationStatus="Submitting session wallet funding...",v(t,n.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:l}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(u.wallets)?u.wallets:n.wallets,n.automationDelegationStatus=u.message||"Session wallet funded and ready.",K(u.signature||"","session-wallet-funded"),await yt({force:!0,deep:!0,reason:"session-wallet-funded"}),n.activeTab="wallets",h({force:!0})}catch(r){const o=D(r.message||"Session wallet setup failed.");n.automationDelegationStatus=o,v(t,o),$(o)}finally{a.forEach(r=>{r.disabled=!1,v(r,"Start Session Wallet")})}}async function Ei(e="enable",t={}){const a=m("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],o=e!=="revoke";if(o&&!lu()){n.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",v(a,n.automationDelegationStatus),$(n.automationDelegationStatus),pi();return}iu(!o,t.scope||""),n.automationDelegationStatus=o?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",v(a,n.automationDelegationStatus),r.forEach(s=>{s.disabled=!0,v(s,o?"Enabling...":"Revoking...")});try{await Y(a,"Creating secure web profile for automation permission...");const s=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:o?"enable":"revoke",ttlHours:720})});pe(s.user||{...n.user,automationPermission:s.profile?.automationPermission||null});const c=n.user?.automationPermission||{};n.automationDelegationStatus=o?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${we(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(s){n.automationDelegationStatus=s.message,v(a,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,v(s,s.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function Fi(e={}){const t=!!e.silent,a=e.refreshWallet!==!1;if(!n.user||!n.token){t||$("Log in or create a web account before checking server exits.");return}if(Br){n.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}Br=!0,t||(n.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:te});n.tradePlans=r.plans||n.tradePlans||[];const o=r.runner||{},s=r.webExitGuards||{},c=r.portfolioExits||{},l=Number(o.soldWallets||0)+Number(s.soldGuards||0)+Number(c.soldPositions||0),u=Number(o.triggeredWallets||0)+Number(s.triggeredGuards||0)+Number(c.triggeredPositions||0);if(o.skipped){const d=Number(o.activeForMs||0),p=d>0?` for ${Math.ceil(d/1e3)}s`:"";n.automationDelegationStatus=o.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${p}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${o.reason||"runner busy"}.`,a&&!t&&await Qs({force:!0});return}n.automationDelegationStatus=ry(o),(a||l>0||u>0)&&await Qs({force:!0}),t&&(l>0||u>0)&&h({preserveSmartChartFrame:n.activeTab==="smartChart"})}catch(r){n.automationDelegationStatus=r.message,n.walletRefreshError=r.message,t||$(r.message)}finally{Br=!1,t||(n.walletRefreshing=!1,h())}}function ry(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),a=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),o=Number(e.failedWallets||0),s=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${a}, sold ${r}, failed ${o}.${s}`}function Wi(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(n.tradePlans||[]).some(t=>{const a=String(t.status||"").toLowerCase();return a==="launch_watch"?!0:a!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function oy(){return!!(cu()&&Wi()&&!Br)}function mo(){Wi()&&(n.automationDelegationStatus=n.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),sy()}let fo="";function sy(){const t=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active","armed","pending"].includes(String(l.status||"").toLowerCase()));if(!t.length){fo="";return}const a=Date.now(),r=t.filter(l=>l.automationPermissionExpiresAt&&!l.automationPermissionActive),o=t.filter(l=>{if(!l.automationPermissionActive)return!1;const u=Date.parse(l.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>a&&u-a<3600*1e3});let s="";if(r.length)s=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(o.length){const l=Math.min(...o.map(d=>Date.parse(d.automationPermissionExpiresAt)));s=`TP/SL permission expires in ~${Math.max(1,Math.round((l-a)/6e4))} min with ${o.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=s?`${r.length}:${o.length}`:"";s&&c!==fo?(fo=c,$(s)):s||(fo="")}function iy(){Pn.forEach(e=>window.clearTimeout(e)),Pn=[]}function ho(){iy(),n.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",Pn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const a=window.setTimeout(()=>{Pn=Pn.filter(r=>r!==a),!(!n.user||!n.token||!Wi())&&Fi({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{n.automationDelegationStatus=r.message})},t);return a})}async function ly(){const e=m("[data-restore-text]"),t=m("[data-restore-status]");if(!e||!t)return;const a=e.value.trim();if(!a){v(t,"Choose a backup file or paste backup text first.");return}v(t,"Restoring wallets...");try{await Y(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:a})});n.restoreResult=r.restore,r.restore?.downloads&&(n.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&fe(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&fe(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",v(t,r.restore?.message||"Restore complete."),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(r){v(t,r.message)}}async function cy(){const e=m("[data-export-status]");if(e){v(e,"Building backup files...");try{await Y(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});n.backupResult=t.backup,t.backup?.downloads&&(n.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&fe(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&fe(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),v(e,t.backup?.message||"Backup ready."),h()}catch(t){v(e,t.message)}}}async function uy(){const e=m("[data-import-label]"),t=m("[data-import-secret]"),a=m("[data-import-status]");if(!e||!t||!a)return;const r=e.value.trim()||"Imported Wallet",o=t.value.trim();if(!o){v(a,"Paste a private key or JSON secret-key array first.");return}v(a,"Importing wallet...");try{await Y(a,"Creating secure web profile for imported wallet...");const s=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:o})});n.importResult=s.imported,s.imported?.downloads&&(n.downloads=s.imported.downloads,s.imported.downloads.encryptedBackup&&fe(s.imported.downloads.encryptedBackup.filename,s.imported.downloads.encryptedBackup.text),s.imported.downloads.recoveryKeys&&fe(s.imported.downloads.recoveryKeys.filename,s.imported.downloads.recoveryKeys.text)),t.value="",v(a,s.imported?.message||"Import complete."),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(s){v(a,s.message)}}async function dy(e,t="this wallet",a=""){const r=String(t||`Wallet ${e}`);if(!await Le({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Le({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=m("[data-wallet-remove-status]");n.walletRemoveStatus=`Backing up ${r} before removal...`,v(c,n.walletRemoveStatus),$("");try{const l=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(a?{publicKeys:[a]}:{walletIndexes:[String(e)]})}),u=l.removed||{};n.downloads=u.downloads||n.downloads,u.downloads?.encryptedBackup?.text&&fe(u.downloads.encryptedBackup.filename,u.downloads.encryptedBackup.text),u.downloads?.recoveryKeys?.text&&fe(u.downloads.recoveryKeys.filename,u.downloads.recoveryKeys.text),n.walletRemoveStatus=u.message||`Removed ${r}.`,Array.isArray(u.wallets)&&(n.wallets=u.wallets),K(xe(l.plan),"wallet-remove"),n.activeTab="wallets",h()}catch(l){n.walletRemoveStatus=l.message,v(c,l.message),$(l.message)}}function py(){const e=String(m("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(a=>a.trim()).filter(Boolean),walletGroup:String(m("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(m("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(m("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(m("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function my(){const e=String(m("[data-wallet-send-from]")?.value||"1").trim(),t=String(m("[data-wallet-send-managed-targets]")?.value||"").trim(),a=String(m("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(m("[data-wallet-send-destinations]")?.value||"").trim(),o=t.toLowerCase()==="all"?n.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),s=a?n.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===a||d.startsWith(`${a} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...o,...s])].map(u=>n.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),l=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(m("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!m("[data-wallet-send-all]")?.checked,destinations:l}}function fy(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const a=e.rows.slice(0,6).map(r=>{const o=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,s=r.ok?"ok":"failed";return`${o}: ${s} - ${r.message||r.signature||"done"}`});t.push(...a),e.rows.length>a.length&&t.push(`...${e.rows.length-a.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function hy(e){const t=m("[data-wallet-sweep-status]");n.walletSweepStatus="Running wallet action...",v(t,n.walletSweepStatus),$("");try{await Y(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const o=e==="send-sol-many"?my():py();if(e==="sell-all"&&(o.destination=""),e==="sell-all-sweep"&&!o.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const s=await k(r,{method:"POST",body:JSON.stringify(o),timeoutMs:te});n.walletSweepStatus=fy(s.sweep),v(t,n.walletSweepStatus),await De({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(a){n.walletSweepStatus=a.message,v(t,a.message),$(a.message)}}async function gy(e){const t=m("[data-restore-status]"),a=m("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!a)){v(t,"Reading backup file...");try{a.value=await r.text(),v(t,"Backup loaded. Tap Restore Wallets.")}catch(o){v(t,`Could not read file: ${o.message}`)}}}function fe(e,t){const a=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(a),o=document.createElement("a");o.href=r,o.download=e,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function by(){const e=m("[data-x-handle]"),t=m("[data-x-status]"),a=Je(e?.value||"");if(!a){v(t,"Enter a valid X handle first.");return}const r=window.open($i(a),"_blank","noopener,noreferrer");try{v(t,r?`Opening X and saving @${a}...`:`Saving @${a}. Allow popups if X did not open.`),await Y(t,"Creating secure web profile for X sharing...");const o=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:a})});pe(o.user||{...n.user,xHandle:o.profile?.xHandle||a}),Hl(n.xHandle),v(t,`Connected @${n.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(o){v(t,o.message),$(o.message)}}function yy(){const e=m("[data-x-status]"),t=Je(m("[data-x-handle]")?.value||n.xHandle||""),a=$i(t||n.xHandle);window.open(a,"_blank","noopener,noreferrer"),v(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function vy(){const e=m("[data-x-status]"),t=m("[data-x-handle]");try{if(!n.user||!n.token){n.xHandle="",t&&(t.value=""),Ss(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const a=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});pe(a.user||{...n.user,xHandle:""}),n.xHandle="",t&&(t.value=""),Ss(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(a){v(e,a.message),$(a.message)}}async function go(e,t="Saving PFP..."){const a=m("[data-avatar-status]");v(a,t);try{await Y(a,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});pe(r.user||{...n.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),v(a,n.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){v(a,r.message),$(r.message)}}async function wy(e){const t=m("[data-avatar-status]"),a=e?.files?.[0];if(a){if(!/^image\/(png|jpe?g|webp)$/i.test(a.type)){v(t,"Use a PNG, JPG, or WebP image.");return}if(a.size>5*1024*1024){v(t,"Use an image under 5 MB.");return}try{v(t,"Compressing PFP...");const r=await dd(a);await go({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){v(t,r.message),$(r.message)}finally{e.value=""}}}function dd(e){return new Promise((t,a)=>{const r=new FileReader;r.onerror=()=>a(new Error("Could not read that image.")),r.onload=()=>{const o=new Image;o.onerror=()=>a(new Error("Could not load that image.")),o.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const l=c.getContext("2d");if(!l){a(new Error("This browser cannot resize images."));return}const u=Math.max(256/o.width,256/o.height),d=Math.round(o.width*u),p=Math.round(o.height*u),f=Math.round((256-d)/2),y=Math.round((256-p)/2);l.clearRect(0,0,256,256),l.drawImage(o,f,y,d,p);const g=c.toDataURL("image/jpeg",.84);if(g.length>22e4){a(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(g)},o.src=String(r.result||"")},r.readAsDataURL(e)})}async function Sy(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,a=new URL(String(e||""),t).toString(),r=await fetch(a,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const o=await r.blob();return dd(o)}async function ky(){const e=ki(n.xHandle);if(!e){const t=m("[data-avatar-status]");v(t,"Connect an X handle first.");return}await go({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function pd(e,t={}){const a=In(),r=me(e);if(!r){if(await Sc(e,t)||kc(e))return;const o=uc(e);re(o),Rt(e,new Error(o),{action:"provider_missing",platform:Ve()?"mobile":"desktop"});return}try{const o=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(o){if(!(t.confirmSwitch===!1?!0:await Le({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(o)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){re("Wallet connection unchanged."),$e("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}re(`Opening ${Ee(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,l=c?.toBase58?.()||c?.toString?.()||"";if(!l)throw new Error("Wallet connected, but no public address was returned.");await Y(a,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:l,provider:Ee(e,r)})});pe(u.user||{...n.user,connectedWallet:u.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:l,shortPublicKey:w(l),provider:Ee(e,r),tokens:[]},di(`connected:${l}`),n.walletConnectMenuOpen=!1,re(`Connected ${w(l)}. Opening Live Terminal...`),$e(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),uu("browser-wallet-connect"),Ur("browser-wallet-connect")}catch(o){const s=o.message||"Wallet connection was cancelled.";re(s),Rt(e,o,{action:"connect_failed"})}}async function md(){await ju("disconnecting");const e=In(),t=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(!n.user||!n.token){n.connectedWalletBalance=null,di(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0});return}try{const a=n.user?.connectedWallet?.provider||"";await(a.toLowerCase().includes("phantom")?me("phantom"):a.toLowerCase().includes("solflare")?me("solflare"):a.toLowerCase().includes("backpack")?me("backpack"):me("solana"))?.disconnect?.()}catch{}try{const a=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});pe(a.user||{...n.user,connectedWallet:null}),n.connectedWalletBalance=null,di(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0})}catch(a){re(a.message),$(a.message)}}async function $y(){const e=m("[data-profile-username]"),t=m("[data-profile-password]"),a=m("[data-login-security-status]"),r=String(e?.value||"").trim(),o=String(t?.value||"");if(!r||!o){v(a,"Enter a username and password first.");return}try{await Y(a,"Creating secure web profile..."),v(a,"Saving login...");const s=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:o})});pe(s.user||{...n.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),v(a,"Saved. You can now log back in with this username and password."),h()}catch(s){v(a,s.message),$(s.message)}}function Je(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function Ni(e){const t=yi(e),a=String(n.user?.referralLink||"").trim(),r=a&&!t.includes("/r/")?a:Ct,o=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(o,"_blank","noopener,noreferrer")}function fd(e){const t=e==="kol",a=m(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=m("[data-share-watch-status]"),o=a?.value?.trim()||"";if(!o){v(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}Ni(t?Pu(o):vi(o)),v(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function hd(e){const t={};n.token&&(t.Authorization=`Bearer ${n.token}`);const a=await Mn(Ka(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!a.ok){const r=await cc(a);throw new Error(r.message||r.error||`Could not build PnL card (${a.status}).`)}return{blob:await a.blob(),filename:a.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function gd(e){const{blob:t,filename:a}=await hd(e),r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=a,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Ty(e,t){try{const{blob:a,filename:r}=await hd(e),o=new File([a],r,{type:"image/png"});if(navigator.canShare?.({files:[o]})){await navigator.share({title:"SlimeWire PnL Card",text:yi(t),url:Ct,files:[o]});return}await gd(e),Ni(`${t} PnL card downloaded and ready to attach.`)}catch(a){$(a.message)}}function bd(e="buy"){const t=m("[data-trade-wallet]")?.value||"",a=uh(e)||m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,e==="sell"?(n.tradeSwapFrom=a,n.tradeSwapTo="SOL"):(n.tradeSwapFrom="SOL",n.tradeSwapTo=a),{walletIndex:t,tokenMint:a,slippageBps:r}}function ce(e=""){return String(e||"").trim().toLowerCase()==="connected"}function Ay(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function yd(){const e=Array.isArray(n.wallets)?n.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(Ay(e[t]))return e[t];return null}function vd(e=le()){if(!e?.publicKey)return!1;const t=ar(e),a=me(t)||me("solana");return!!(a&&typeof a.signTransaction=="function")}function bo(e=le()){const t=e?.provider||Ee(ar(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function yo(e={},{side:t="trade",statusWriter:a=he,allowSessionFallback:r=!0}={}){if(!ce(e.walletIndex))return{form:e,sessionWallet:null};if(vd())return{form:e,sessionWallet:null};const o=r?yd():null;if(o?.index){const s=`Using Session Wallet ${o.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof a=="function"&&a(s),{form:{...e,walletIndex:String(o.index)},sessionWallet:o}}throw new Error(bo())}function wd(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Sd(e=""){const t=atob(String(e||"")),a=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)a[r]=t.charCodeAt(r);return a}function ar(e=le()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function Py(e=le(),{returnPath:t=za()||"/terminal/trade"}={}){const a=ar(e),r=e?.provider||Ee(a);if(da({returnPath:t}),Ve()&&e?.publicKey&&!me(a)){const s=bo(e);return re(s),s}if(wc(a)){const s=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(re(s),await Sc(a,{returnPath:t}).catch(()=>!1))return s}if(kc(a))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const o=uc(a);return re(o),o}async function kd(){const e=le();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=ar(e),a=me(t)||me("solana");if(!a){if(Ve()&&e?.publicKey)throw new Error(bo(e));const s=await Py(e,{returnPath:za()||"/terminal/trade"});throw new Error(s)}if(typeof a.signTransaction!="function")throw Ve()&&e?.publicKey?new Error(bo(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"";let o=r();if(o!==e.publicKey)try{const s=await a.connect?.({onlyIfTrusted:!0});o=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r()}catch{}if(o!==e.publicKey){const s=await a.connect?.({onlyIfTrusted:!1}),c=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:a,connected:e}}async function Cy(){try{if(Ve())return;const e=le();if(!e?.publicKey)return;const t=ar(e),a=me(t)||me("solana");if(!a||typeof a.connect!="function"||(a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"")===e.publicKey)return;await a.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const Ly=6e4;async function $d(e,t,a=Ly){let r=0;const o=new Promise((s,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},a)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),o])}finally{window.clearTimeout(r)}}async function xy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.VersionedTransaction.deserialize(Sd(e)),r=await $d(t,a);return wd(r.serialize())}async function My(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.Transaction.from(Sd(e)),r=await $d(t,a);return wd(r.serialize())}function By({side:e,connected:t,form:a={},actionDetail:r="",amountSol:o="",amountMode:s="",percent:c=""}={}){const l=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:s==="max"?"Max SOL":`${o||r||"custom"} SOL`;return Le({title:`Confirm ${l}`,lines:[`${l} with ${u}?`,`Token: ${a.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:l})}async function nr({side:e,form:t,actionDetail:a,amountSol:r="",amountMode:o="",percent:s="",attemptId:c,statusWriter:l=he}){const u=typeof l=="function"?l:he,{provider:d,connected:p}=await kd();if(!n.walletFastApprovalsEnabled&&!await By({side:e,connected:p,form:t,actionDetail:a,amountSol:r,amountMode:o,percent:s}))throw new Error("Connected-wallet trade cancelled.");im(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),Be("submitted","pending"),u(n.walletFastApprovalsEnabled?`Building ${e} approval for ${p.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:p.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:o,percent:s,tradeAttemptId:c}),dedupe:!1,timeoutMs:te});Be("submitted","ok"),Be("approved","pending",`Approve in ${p.provider||"your wallet"}`),u(`Approve ${e} in ${p.provider||"your wallet"}...`);let y;try{y=await xy(f.order?.transaction,d)}catch(S){throw Be("approved","fail",D(S?.message||"Wallet approval was declined.")),S}Be("approved","ok"),Be("sent","pending"),u("Submitting signed trade...");let g;try{g=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:te})}catch(S){throw V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"error",error:D(S?.message||"Trade submit failed.")}),K("",`browser-${e}-error`,{tradeAttemptId:c}),Be("sent","fail",D(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return Be("sent","ok"),Be("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),n.tradeResult=g.trade,u(g.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),g.trade}function Ue(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function sn(e,t){const a=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(a)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Ry(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let a=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=sn(a,r),{enabled:Ue(e)||Ue(t)||Ue(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function Td(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let a=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=sn(a,r),{enabled:Ue(e)||Ue(t)||Ue(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function he(e){const t=m("[data-trade-status]");v(t,e)}function Fe(e=""){n.chartTradeStatus=String(e||""),v(m("[data-chart-trade-status]"),n.chartTradeStatus)}function Di(e="",t=""){n.quickBuyModal={...n.quickBuyModal,status:String(e||""),error:String(t||"")};const a=m("[data-quick-buy-modal-status]"),r=m("[data-quick-buy-modal-error]");v(a,n.quickBuyModal.status),v(r,n.quickBuyModal.error),a&&(a.hidden=!n.quickBuyModal.status),r&&(r.hidden=!n.quickBuyModal.error)}async function vo(e,t="fixed"){const a=L();let r=t==="max"?"max":String(e||"custom"),o="";try{let s=bd("buy");r=t==="max"?"max":String(e||"custom");const c=at("trade-buy",s.tokenMint,r);if(c){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(s.tokenMint)}:${r}`});return}o=gt("trade-buy");const l={tokenMint:s.tokenMint,walletIndex:s.walletIndex,slippageBps:s.slippageBps,tradeAttemptId:o},u=Rd();if((Ue(u.takeProfitPct)||Ue(u.stopLossPct)||Ue(u.sellDelay))&&Object.assign(l,{autoExit:!0,...u}),t==="max")l.amountMode="max";else{const S=Number(e);if(!Number.isFinite(S)||S<=0)throw new Error("Enter a buy amount greater than zero.");l.amountSol=String(S)}if(s=yo(s,{side:"buy",statusWriter:he}).form,l.walletIndex=s.walletIndex,ce(s.walletIndex)){V("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:L()-a,requestId:o,details:`browser-buy:${w(s.tokenMint)}:${r}`}),he("Building wallet-approved buy..."),ie(),await nr({side:"buy",form:s,actionDetail:r,amountSol:l.amountSol||"",amountMode:l.amountMode||"fixed",attemptId:o}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-buy",s.tokenMint,r,3e3);return}const f=Ry();f.enabled&&Object.assign(l,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),V("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-a,requestId:o,details:`trade-buy:${w(s.tokenMint)}:${r}`}),h(),he(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Ce(20);const y=L();V("trade-buy",s.tokenMint,r,{state:"submitting"});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...l,clientClickToUiMs:Math.round(y-a)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-y,requestId:o,resultCount:g.trade?.signature?1:0,details:"trade-buy"}),n.tradeResult=g.trade,im(`Buy ${w(s.tokenMint||"")}`),Be("submitted","ok"),Be("sent","ok"),Be("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),g.trade?.autoExitPlan?(Be("armed","ok"),n.tradePlanResult=g.trade.autoExitPlan,he(g.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),ho()):g.trade?.autoExitRequested&&(Be("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),he("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),V("trade-buy",s.tokenMint,r,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,"trade-buy",{tradeAttemptId:o}),n.activeTab="trade",h(),Pe("trade-buy",s.tokenMint,r,3e3)}catch(s){o&&(V("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,{state:"error",error:D(s.message||"Buy failed")}),Pe("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-a,requestId:o,errorCode:s?.code||s?.name||"TRADE_BUY_FAILED",details:D(s.message||"Buy failed")}),he(s.message)}}async function _i(e){const t=L(),a=gt("manual-sell");let r=null,o=String(e||"custom");try{r=bd("sell");const s=Number.parseInt(e,10);if(o=String(s||o),!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=at("trade-sell",r.tokenMint,o);if(c){ne("buttonDoubleClickPrevented"),W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${s}`});return}if(V("trade-sell",r.tokenMint,o,{state:"clicked",tradeAttemptId:a,clickedAt:new Date().toISOString()}),he("Sending sell..."),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-t,requestId:a,details:`${w(r.tokenMint)}:${s}`}),r=yo(r,{side:"sell",statusWriter:he}).form,ce(r.walletIndex)){ie();const p=L();V("trade-sell",r.tokenMint,o,{state:"submitting"}),await nr({side:"sell",form:r,actionDetail:o,percent:String(s),attemptId:a}),W({component:"manual-sell",action:"browser-sell-request",durationMs:L()-p,requestId:a,resultCount:n.tradeResult?.signature?1:0,details:"browser-wallet"}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-sell",r.tokenMint,o,3e3);return}h(),await Ce(20);const u=L();V("trade-sell",r.tokenMint,o,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:s,manualSellAttemptId:a,clientClickToUiMs:Math.round(u-t)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-u,requestId:a,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),n.tradeResult=d.trade,he(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),V("trade-sell",r.tokenMint,o,{state:"submitted",signature:d.trade?.signature||""}),K(d.trade?.signature||xe(d.trade),"manual-sell-trade"),n.activeTab="trade",h(),Pe("trade-sell",r.tokenMint,o,3e3)}catch(s){r?.tokenMint&&(V("trade-sell",r.tokenMint,o,{state:"error",error:D(s.message||"Sell failed")}),Pe("trade-sell",r.tokenMint,o,4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-t,requestId:a,errorCode:s?.code||s?.name||"MANUAL_SELL_FAILED",details:D(s.message||"Sell failed")}),he(s.message)}}function Iy(){const e=qe("trade-plan"),t=m("[data-trade-plan-group]")?.value?.trim()||"",a=m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),o=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),s=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),l=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:l}=sn(c,l));const u=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,n.volumeToken=a,n.bundleToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:c,takeProfitPct:o,stopLossPct:s,sellPercent:l,loopCount:"1",loopDelay:"0",slippageBps:u,...ma("trade-plan")}}async function Oy(){try{const e=Iy();he("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});n.tradePlanResult=t.plan,n.tradeResult=null,K(t.trade?.signature,"trade-plan"),n.activeTab="trade",h()}catch(e){he(e.message)}}function Ey(){const e=qe("volume"),t=m("[data-volume-group]")?.value?.trim()||"",a=m("[data-volume-token]")?.value?.trim()||"",r=m("[data-volume-amount]")?.value||"";let o=x("[data-volume-delay]","[data-volume-delay-custom]","5");const s=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),l=x("[data-volume-loop]","[data-volume-loop-custom]","1"),u=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:o,sellPercent:d}=sn(o,d));const p=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.volumeToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:d,slippageBps:p,...ma("volume")}}function Ad(e){const t=m("[data-volume-status]");v(t,e)}async function Fy(){try{const e=Ey();Ad("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});n.volumeResult=t.plan,K(xe(t.plan),"volume-plan"),n.activeTab="volume",h()}catch(e){Ad(e.message)}}function Wy(e){const t=qe("sniper"),a=m("[data-sniper-group]")?.value?.trim()||"",r=m("[data-sniper-amount]")?.value||"",o=x("[data-sniper-delay]","[data-sniper-delay-custom]",n.scanMode==="pumpsnipe"?"3":"5"),s=x("[data-sniper-tp]","[data-sniper-tp-custom]",n.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),l=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",n.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{mode:n.scanMode,tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,slippageBps:d,loopCount:l,loopDelay:u,...ma("sniper")}}function Pd(e){const t=m("[data-sniper-status]");v(t,e)}async function Ny(e){try{const t=Wy(e);Pd("Buying and arming exits...");const a=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});n.sniperResult=a.plan,K(xe(a.plan),"sniper-entry"),n.activeTab="sniper",h()}catch(t){Pd(t.message)}}function Dy(){const e=qe("ogre-ai"),t=m("[data-ogre-ai-group]")?.value?.trim()||"",a=m("[data-ogre-ai-amount]")?.value?.trim()||"",r=Zr(),o=m("[data-ogre-ai-runs]")?.value||"1",s=m("[data-ogre-ai-tp]")?.value||"25",c=m("[data-ogre-ai-tp-custom]")?.value?.trim()||"",l=m("[data-ogre-ai-sl]")?.value||"8",u=m("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=m("[data-ogre-ai-delay]")?.value||"5",p=m("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=m("[data-ogre-ai-slippage]")?.value||"400",y=m("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";Gm({amountSol:a,runCount:o,category:r,takeProfitSelect:s,takeProfitCustom:c,stopLossSelect:l,stopLossCustom:u,delaySelect:d,delayCustom:p,slippageSelect:f,slippageCustom:y,walletGroup:t});const g=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","60"),S=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","100"),P=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","40"),T=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),b="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!a)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:a,runCount:o,sellDelay:g,takeProfitPct:S,stopLossPct:P,sellPercent:"100",slippageBps:T,minScore:b,recentMints:Kl()}}function wo(e){n.ogreAiStatus=e||"";const t=m("[data-ogre-ai-status]");v(t,n.ogreAiStatus)}async function _y(){if(Rr){Wa=!0,wo("Stopping the hunt after this scan...");return}const e=Symbol("ogre-ai-run");Wa=!1;try{const t=Dy();n.ogreAiLoading=!0,Rr=e;const a=Array.isArray(t.recentMints)?[...t.recentMints]:[];let r=null,o=!1,s=0;const c=120;for(;!o&&!Wa&&s<c&&(s+=1,wo(s===1?"Scanning fresh low-MC pairs and arming managed exits...":`Hunting fresh pairs... (scan ${s}) - tap Scan again to stop.`),h(),r=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify({...t,recentMints:a}),timeoutMs:te}),o=Number(r.ogreAi?.armedCount||0)>0||(r.ogreAi?.plans?.length||0)>0,!o);){for(const l of r.ogreAi?.errors||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);for(const l of r.ogreAi?.attemptedPicks||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);if(Wa)break;await Ce(5e3)}n.ogreAiResult=r?.ogreAi,jm(r?.ogreAi),n.tradePlanResult=r?.ogreAi?.plans?.[0]||n.tradePlanResult,wo(o?r?.ogreAi?.message||"Ogre A.I. run armed.":Wa?"Hunt stopped. Tap Scan to hunt again.":"Still hunting - no clean fresh pair armed yet. Tap Scan to keep going."),o&&K(xe(r?.ogreAi?.plans?.[0]),"ogre-ai-run"),n.activeTab="ogreAi",h()}catch(t){wo(t.message),$(t.message)}finally{n.ogreAiLoading=!1,Wa=!1,Rr===e&&(Rr=null),h()}}function rr(e){const t=m("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function Uy({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");n.ogreAutopilot=t.autopilot||null,n.activeTab==="ogreAi"&&h()}catch(t){e||rr(t.message)}}function qy(){return{enabled:!!m("[data-autopilot-enabled]")?.checked,category:Zr(),amountSol:m("[data-ogre-ai-amount]")?.value?.trim()||(n.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:qe("ogre-ai"),walletGroup:m("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:m("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:m("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:m("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:m("[data-autopilot-interval]")?.value?.trim()||"10"}}async function Hy(){if(n.ogreAutopilotBusy)return;const e=qy();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){rr("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Le({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${Uu(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){n.ogreAutopilotBusy=!0,rr(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});n.ogreAutopilot=t.autopilot||null,rr(n.ogreAutopilot?.lastStatus||"Saved.")}catch(t){rr(t.message),$(t.message)}finally{n.ogreAutopilotBusy=!1,h()}}}function Ut(e){const t=m("[data-kol-status]");v(t,e)}function Ky(e){const t=qe("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:"100",slippageBps:d,...ma("kol")}}function Vy(e){const t=qe("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),p=String(e||n.kolWallet||m("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!p)throw new Error("Paste or choose a KOL wallet first.");if(!Wt(p))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:p,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:l,loopDelay:u,sellPercent:"100",slippageBps:d,...ma("kol")}}async function zy(e){try{const t=Ky(e);Ut("Buying and arming KOL copy plan...");const a=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,K(xe(a.plan),"kol-copy-plan"),n.activeTab="kol",h()}catch(t){Ut(t.message)}}async function jy(e){try{const t=Vy(e);Ut("Arming Copy Wallet watch...");const a=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,n.kolWallet=t.copyWallet,n.activeTab="kol",h()}catch(t){Ut(t.message)}}function qe(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function So(e){const t=m("[data-bundle-status]");v(t,e)}function Cd(){const e=m("[data-bundle-token]")?.value?.trim()||"",t=qe("bundle"),a=m("[data-bundle-group]")?.value?.trim()||"",r=m("[data-bundle-amount]")?.value||"",o=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),s=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,percent:o,slippageBps:s}}function Gy(){const e=Cd();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),a=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:a}=sn(t,a),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:a,...ma("bundle-plan")}}async function Ld(e){const t=L();let a=null,r="";const o=e==="buy"?"bundle-buy":"bundle-sell";try{a=Cd();const s=at(o,a.tokenMint,"bundle");if(s){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-t,cacheHit:!0,requestId:s.tradeAttemptId||"",details:`${o}:${w(a.tokenMint)}`});return}r=gt(o),V(o,a.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-t,requestId:r,details:`${o}:${w(a.tokenMint)}`}),h(),So(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Ce(20);const c=L();V(o,a.tokenMint,"bundle",{state:"submitting"});const l=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...a,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-c,requestId:r,resultCount:l.bundle?.successCount||0,details:o}),n.bundleResult=l.bundle,V(o,a.tokenMint,"bundle",{state:"submitted",signature:xe(l.bundle)}),K(xe(l.bundle),`bundle-${e}`,{tradeAttemptId:r}),n.activeTab="bundle",h(),Pe(o,a.tokenMint,"bundle",3e3)}catch(s){a?.tokenMint&&(V(o,a.tokenMint,"bundle",{state:"error",error:D(s.message||"Bundle trade failed")}),Pe(o,a.tokenMint,"bundle",4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-t,requestId:r,errorCode:s?.code||s?.name||"BUNDLE_TRADE_FAILED",details:D(s.message||"Bundle trade failed")}),So(s.message)}}async function Xy(){try{const e=Gy();So("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});n.bundleResult=t.plan,K(xe(t.plan),"bundle-plan"),n.activeTab="bundle",h()}catch(e){So(e.message)}}function oe(e,t){return(n.presets?.[e]||[]).find(a=>a.id===t)||null}function xd(){(n.selectedTradePresetId==="custom"||n.selectedTradePresetId&&!oe("trade",n.selectedTradePresetId))&&(n.selectedTradePresetId=""),(n.selectedBundlePresetId==="custom"||n.selectedBundlePresetId&&!oe("bundle",n.selectedBundlePresetId))&&(n.selectedBundlePresetId=""),n.editingTradePresetId&&!oe("trade",n.editingTradePresetId)&&(n.editingTradePresetId=""),n.editingBundlePresetId&&!oe("bundle",n.editingBundlePresetId)&&(n.editingBundlePresetId="")}function Md(e,t="trade",a=""){t==="bundle"?n.bundleToken=e:n.tradeToken=e,n.activeTab=t,a&&$(a),window.history.pushState({},"","/terminal"),h({force:!0})}async function Bd(e=""){const t=String(e||"").trim();if(!t)return;const a=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),o=(s,c={})=>wt(ge(s,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){o(a);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}o(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(s){$(s.message||"Token search failed.")}}function ge(e="",t={}){const a=String(e||"").trim(),r=a?or().find(o=>String(o?.tokenMint||"")===a):null;return{chain:"solana",tokenMint:a,tokenAddress:a,mint:a,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(a),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||a.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function Uk(e={},t={}){return ge(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function ko(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(n.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},Ro(n.smartChartTokenRef),n.terminalToken=t,n.terminalAutoToken=t,n.tradeToken=t,n.bundleToken=t,n.volumeToken=t,n.smartChartToken=t,t):""}function Jy(e,t={}){const a=new URLSearchParams;a.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return a.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&a.set("view",t.view),t.focusAmountInput&&a.set("focusAmount","1"),t.source&&a.set("source",String(t.source).slice(0,40)),t.returnTo&&a.set("returnTo",t.returnTo),`/terminal/chart?${a.toString()}`}function Ui(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),a=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||a.includes("pump")),o=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!o)}function Yy(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const $o=new Map;function qi(e){const t=String(e||"").trim();if(!t)return;const a=$o.get(t)||0;Date.now()-a<3e4||($o.set(t,Date.now()),$o.size>200&&$o.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function wt(e={},t={}){ra("chartRouteStart");const a=L(),r=ko(e);if(!r){$("Select a token before opening the chart.");return}Ji(e,{source:t.source||"token-entry"}),qi(r),n.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),n.smartChartView=Yy(n.smartChartTokenRef||e,t),n.chartFocusAmountInput=!!t.focusAmountInput,n.chartScrollIntoView=!0,n.activeTab="smartChart",n.route="terminal",n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.chartTradeStatus="",n.chartBuyWalletIndex="";const o=Jy(r,{defaultTab:t.defaultTab||"buy",view:n.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||za()});window.history.pushState({},"",o),h({force:!0}),H("chart-route-open",a,{component:"smartChart",cacheHit:!!(Ye(r)?.cacheHit||lr(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function Hi(){if(!window.location.pathname.includes("/terminal/chart"))return;ra("chartRouteStart");const e=L(),t=new URLSearchParams(window.location.search||""),a=String(t.get("token")||t.get("mint")||"").trim(),r=String(n.smartChartToken||"").trim();if(a){const o=ge(a,{source:t.get("source")||"route"});ko(o),Ji(o,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{ln(o,{forceModal:!0,source:"deep-link"})}catch{}},900),a!==r&&(n.chartTradeStatus="",n.chartBuyWalletIndex="")}n.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",n.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",n.chartFocusAmountInput=t.get("focusAmount")==="1",n.chartScrollIntoView=!0,n.route="terminal",n.activeTab="smartChart",H("chart-route-apply",e,{component:"smartChart",cacheHit:!!(Ye(a)?.cacheHit||lr(a)?.pairAddress),details:a})}function ln(e={},t={}){const a=ko(e);if(!a){$("Select a token before quick buying.");return}const r=cn(a);if(r&&Mo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const o=t.preset||lt(),s=o&&!t.forceModal?He(o):"",c=o?.walletIndex||(o?.walletIndexes||[])[0]||(n.wallets[0]?.index?String(n.wallets[0].index):"");if(o&&s&&c&&!t.forceModal){Po(a,{...o,walletIndex:c,walletIndexes:[c]});return}const l=le();n.quickBuyModal={open:!0,tokenMint:a,amountSol:s||n.quickBuyAmountOverride||"",walletIndex:l?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"",slippageBps:"400",status:s?`Preset ${s} SOL loaded. Confirm when ready.`:o?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},qi(a),h({force:!0}),requestAnimationFrame(()=>m("[data-quick-buy-modal-amount]")?.focus())}function Ki(){n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function Qy(e={},t={}){if(!_("protectedBuyEnabled",!0))return;const a=ko(e);if(!a){$("Select a token before opening Protected Buy.");return}const r=cn(a);if(r&&Mo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const o=wa(a)||{tokenMint:a},s=Qe(o),c=t.presetId||s.protectedBuyPreset||el(s.verdict),l=Number(X(t.amountSol||n.quickBuyAmountOverride||He()||"0.1")),u=c==="conservative"&&Number.isFinite(l)&&l>.25?"0.25":dr(l||.1),d=le();qi(a),n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.protectedBuyModal={open:!0,tokenMint:a,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:s.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>m("[data-protected-buy-amount]")?.focus())}function To(){n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function Zy(){const e=n.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),a=String(m("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(m("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),o=X(m("[data-protected-buy-amount]")?.value||e.amountSol||""),s=String(m("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(m("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!o)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:a,walletIndex:r,amountSol:o,slippageBps:s,riskAccepted:c}}function ev(){const e=n.protectedBuyModal||{};if(!e.open)return"";const t=wa(e.tokenMint)||{tokenMint:e.tokenMint},a=Qe(t),r=Fo(e.presetId),o=ce(e.walletIndex),s=a.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${i(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${i(un(a.verdict))}">${i(a.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${an(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${i(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${Zi.map(l=>`<option value="${l.id}" ${l.id===r.id?"selected":""}>${i(l.label)}</option>`).join("")}
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
        <small>${i(Zv(r))}</small>
        <small>Wallet: ${i(tw(e.walletIndex))}</small>
        <small>Priority fee: existing trade default.</small>
        ${o?'<small class="warning-text">Connected wallets still use normal wallet confirmation. Use a funded session wallet when you want server TP/SL armed like a managed wallet.</small>':""}
      </article>
      ${a.verdict==="AVOID"?`
        <label class="checkbox-line protected-buy-risk-line">
          <input data-protected-buy-risk-accept type="checkbox" ${e.riskAccepted?"checked":""}>
          I understand SlimeShield says AVOID and still want to configure this buy.
        </label>
      `:""}
      <div class="quick-buy-actions">
        <button type="button" data-protected-buy-close>Cancel</button>
        <button type="button" class="primary" data-protected-buy-confirm ${c||s?"disabled":""}>${c?"Submitting...":o?"Open Wallet Confirmation":"Submit Protected Buy"}</button>
      </div>
      ${e.status?`<small class="connect-status">${i(e.status)}</small>`:""}
      ${e.error?`<small class="warning-text">${i(e.error)}</small>`:""}
      <small class="protected-buy-safe-copy">Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</small>
    </section>
  `}function Vi(){let e=m("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!n.protectedBuyModal?.open||!_("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=ev(),document.body.classList.add("protected-buy-modal-open")}async function tv(){try{const e=Zy(),t=wa(e.tokenMint)||{tokenMint:e.tokenMint};if(Qe(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Fo(e.presetId);if(n.protectedBuyModal={...n.protectedBuyModal,...e,status:ce(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},Vi(),ce(e.walletIndex)){const o=await Ao({...e,source:`protected-buy:${r.id}`});n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),$(o?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Ce(20),n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Po(e.tokenMint,ew(e,r))}catch(e){n.protectedBuyModal={...n.protectedBuyModal||{},open:!0,status:"",error:D(e.message||"Protected Buy failed.")},h({force:!0})}}function av(){const e=String(n.quickBuyModal?.tokenMint||"").trim(),t=String(m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"").trim(),a=X(m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||""),r=String(m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!a)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r}}function Rd(){const e=lt();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function Ao({tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r="400",source:o="quick-buy",takeProfitPct:s="",stopLossPct:c="",sellDelay:l="off",sellPercent:u="100"}){const d=Number(a);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const p=gt("quick-buy"),f=sn(l,u),y=Ue(s)||Ue(c)||Ue(f.sellDelay);let g={tokenMint:e,walletIndex:t,slippageBps:r};const S=n.quickBuyModal?.open?A=>Di(A,""):he;if(g=yo(g,{side:"buy",statusWriter:S}).form,t=g.walletIndex,n.quickBuyLast={source:o,tokenMint:e,walletConnected:ce(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:p,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:p,clickedAt:new Date().toISOString()}),n.quickBuyModal={...n.quickBuyModal,status:ce(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:p},ce(t)){Di("Opening wallet approval...",""),ie();const A=await nr({side:"buy",form:g,actionDetail:String(a),amountSol:String(d),amountMode:"fixed",attemptId:p,statusWriter:S});if(n.quickBuyLast={...n.quickBuyLast,status:"submitted"},y){const C="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";n.quickBuyModal?.open?Di(C,""):he(C)}return A}h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ce(20);const T={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:p};y&&Object.assign(T,{autoExit:!0,takeProfitPct:s,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(T),dedupe:!1,timeoutMs:te});return n.tradeResult=b.trade,b.trade?.autoExitPlan&&(n.tradePlanResult=b.trade.autoExitPlan,ho()),K(b.trade?.signature,"quick-buy-custom",{tradeAttemptId:p}),V("trade-buy",e,String(a),{state:"submitted",signature:b.trade?.signature||""}),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},b.trade}async function nv(e=""){const t=L(),a=X(m("[data-chart-buy-amount]")?.value||""),r=Number(a);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let o=m("[data-chart-buy-wallet]")?.value||"";if(!o)throw new Error("Choose a wallet before buying.");const s=gt("chart-buy");let c={tokenMint:e,walletIndex:o,slippageBps:m("[data-chart-buy-slippage]")?.value||"400"};if(c=yo(c,{side:"chart buy",statusWriter:Fe}).form,o=c.walletIndex,at("trade-buy",e,String(a)))return n.tradeResult;if(n.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:ce(o),customAmountValid:!0,presetAmount:"",tradeAttemptId:s,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),Fe(ce(o)?"Opening wallet approval...":"Submitting Session Wallet buy..."),W({component:"post-trade",action:ce(o)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:L()-t,requestId:s,details:`${ce(o)?"browser":"session"}-buy:${w(e)}:${a}`}),ie(),ce(o)){const y=await nr({side:"buy",form:c,actionDetail:String(a),amountSol:String(r),amountMode:"fixed",attemptId:s,statusWriter:Fe});return n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",Fe(y?.message||"Buy submitted from connected wallet."),Pe("trade-buy",e,String(a),3e3),y}const d=Td(),p={tokenMint:e,walletIndex:o,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:s};d.enabled&&Object.assign(p,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),Fe(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(p),dedupe:!1,timeoutMs:te});return n.tradeResult=f.trade,f.trade?.autoExitPlan&&(n.tradePlanResult=f.trade.autoExitPlan,ho()),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",V("trade-buy",e,String(a),{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"chart-session-buy",{tradeAttemptId:s}),Fe(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Pe("trade-buy",e,String(a),3e3),f.trade}async function rv(){try{const e=av(),t=bi(n.quickBuyModal?.error||n.quickBuyModal?.status||"");if(t)throw new Error(t);n.quickBuyModal={...n.quickBuyModal,...e,status:"Validating quick buy...",error:""};const a=await Ao({...Rd(),...e,source:n.quickBuyModal?.source||"quick-buy-modal"});n.quickBuyModal={...n.quickBuyModal,open:!1,status:a?.message||"Quick buy submitted.",error:""},n.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Pe("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=D(e.message||"Quick buy failed."),a=bi(t);n.quickBuyLast={...n.quickBuyLast||{},status:"failed",error:a||t},n.quickBuyModal={...n.quickBuyModal,status:a?"Token safety blocked fast buy.":"",error:a||t},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"})}}async function Po(e,t=null){const a=L(),r=t||oe("trade",n.selectedTradePresetId);let o="quick";if(!r){ln(ge(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const s=t?X(r.amountSol):He(r);if(!s)throw new Error("Set a quick buy amount first.");o=String(s);const c=at("trade-buy",e,o);if(c){W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${s}`});return}const l=gt("quick-trade");V("trade-buy",e,o,{state:"clicked",tradeAttemptId:l,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),n.tradeToken=e,h({preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ce(0),await Y(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!n.wallets.some(y=>String(y.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:s,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),n.tradeToken=e,await Ce(20);const p=L();V("trade-buy",e,o,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:l,clientClickToUiMs:Math.round(p-a)}),dedupe:!1,timeoutMs:te});n.tradeResult=f.trade,f.trade?.autoExitPlan?(n.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),ho()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),n.tradeToken=e,V("trade-buy",e,o,{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:l}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-buy",e,o,3e3)}catch(s){e&&(V("trade-buy",e,o,{state:"error",error:D(s.message||"Quick buy failed")}),Pe("trade-buy",e,o,4e3)),$(s.message)}}async function Id(e,t=null){const a=t||oe("bundle",n.selectedBundlePresetId);if(!a){Md(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(a.walletIndexes||[]).length||(a.walletGroup?"group":"saved");if(!await Le({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${a.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){Md(e,"bundle","Review the Bundle setup, then submit.");return}}try{n.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Ce(0),await Y(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(a.walletIndexes||[]).filter(s=>n.wallets.some(c=>String(c.index)===String(s))),walletGroup:a.walletGroup||"",amountSol:t?X(a.amountSol)||"0.1":Qv(a),percent:"100",slippageBps:a.slippageBps,sellDelay:a.sellDelay||"off",takeProfitPct:a.takeProfitPct,stopLossPct:a.stopLossPct,sellPercent:a.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const o=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});n.bundleResult=o.plan,n.bundleToken=e,K(xe(o.plan),"quick-preset-bundle"),n.activeTab="bundle",h()}catch(r){$(r.message)}}async function Co(e,t="100",a={}){const r=L();let o=Number.parseInt(t,10),s="";try{if(await Y(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=zs(e,String(o));if(c){W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${o}`});return}const l=rt().find(S=>String(S.tokenMint)===String(e)),u=l?.symbol||l?.name||w(e),d=!!(l?.source==="connected-wallet"||l?.viewOnly||String(l?.walletIndex||"").toLowerCase()==="connected"),p=String(le()?.publicKey||"").trim();if(d&&p){s=gt("manual-sell"),oa(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:s,details:`browser:${w(e)}:${o}`}),$(""),n.activeTab!=="smartChart"&&(n.activeTab="positions");const S=n.activeTab==="smartChart"?Fe:T=>$(T);S("Building wallet-approved sell..."),ie(),oa(e,String(o),{state:"submitting"});const P=await nr({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:a.slippageBps||"400"},actionDetail:`${o}%`,percent:String(o),attemptId:s,statusWriter:S});n.tradeResult=P,oa(e,String(o),{state:"submitted",signature:P?.signature||""}),K(P?.signature,"browser-manual-sell",{tradeAttemptId:s}),n.activeTab==="smartChart"?(Fe(P?.message||"Sell submitted from connected wallet."),ie()):h({preserveSmartChartFrame:!1}),js(e,String(o),3e3);return}if(!(!!a.skipConfirm||await Le({title:"Confirm Exit",lines:[`Exit ${o}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${o}%`,danger:!0})))return;s=gt("manual-sell"),oa(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:s,details:`${w(e)}:${o}`}),n.activeTab="positions",$(""),h(),await Ce(20);const y=L();oa(e,String(o),{state:"submitting"});const g=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:o,slippageBps:"400",manualSellAttemptId:s,clientClickToUiMs:Math.round(y-r)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-y,requestId:s,resultCount:g.bundle?.successCount||0,details:g.bundle?.duplicate?"duplicate":"submitted"}),n.bundleResult=g.bundle,n.bundleToken=e,n.tradeToken=e,oa(e,String(o),{state:(g.bundle?.duplicate,"submitted"),signature:xe(g.bundle),backendMs:g.bundle?.manualSellTiming?.backendMs||null}),K(xe(g.bundle),"manual-sell-position"),n.activeTab="positions",h(),js(e,String(o),3e3)}catch(c){e&&Number.isInteger(o)&&(oa(e,String(o),{state:"error",error:D(c.message||"Sell failed")}),js(e,String(o),4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-r,requestId:s,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:D(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}}function xe(e){return e?.signature?e.signature:(e?.results||[]).find(a=>a.signature)?.signature||""}async function ov(){const e=m("[data-tx-audit-signature]")?.value?.trim()||n.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}n.terminalTxSignature=e,n.terminalTxLoading=!0,n.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);n.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){n.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{n.terminalTxLoading=!1,h()}}function sv(e,t="manager"){const a=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Trade Preset",walletIndex:m(`[data-${a}-preset-wallet]`)?.value||"1",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"25",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}:{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Bundle Preset",walletIndexes:qe(`${a}-preset`),walletGroup:m(`[data-${a}-preset-group]`)?.value?.trim()||"",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"60",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}}function iv(e,t){const a=(t||[]).find(r=>!r.readonly);a?.id&&(e==="trade"&&(n.selectedTradePresetId=a.id),e==="bundle"&&(n.selectedBundlePresetId=a.id))}function Lo(e,t){const a=!!(t&&oe(e,t));e==="trade"&&(n.selectedTradePresetId=a?t:""),e==="bundle"&&(n.selectedBundlePresetId=a?t:"")}function zi(e,t){e==="trade"&&(n.fastTradePresetStatus=t),e==="bundle"&&(n.fastBundlePresetStatus=t)}function lv(e,t){Lo(e,t),zi(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Od(e,t="manager"){const a=m(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await Y(a,"Creating secure web profile for presets..."),v(a,"Saving preset...");const r=sv(e,t),o=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});n.presets=o.presets||n.presets,r.id&&oe(e,r.id)?Lo(e,r.id):iv(e,n.presets?.[e]),t==="manager"&&to(e,""),t==="fast"&&zi(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),v(a,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&zi(e,r.message),v(a,r.message),$(r.message)}}async function cv(e,t){try{const a=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});n.presets=a.presets||n.presets,e==="trade"&&n.selectedTradePresetId===t&&Lo("trade",""),e==="bundle"&&n.selectedBundlePresetId===t&&Lo("bundle",""),(e==="trade"&&n.editingTradePresetId===t||e==="bundle"&&n.editingBundlePresetId===t)&&to(e,""),h()}catch(a){$(a.message)}}function Ed(e,t){to(e,t),n.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const a=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);a?.scrollIntoView({behavior:"smooth",block:"start"}),a?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function Fd(e={}){const t=m("[data-referral-status]");try{await Y(t,"Opening secure web profile..."),v(t,e.generate?"Generating referral code...":"Saving referral settings...");const a=String(m("[data-referral-code]")?.value||"").trim(),r=ug(m("[data-referral-link]")?.value||""),o=String(n.user?.referralCode||"").trim(),s=e.generate?a:r&&r!==o&&(!a||a===o)?r:a||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:s,generateReferralCode:!!e.generate,referralPayoutWallet:m("[data-referral-wallet]")?.value||""})});pe(c.user);const l=c.user?.referralCode||n.user?.referralCode||"";v(t,e.generate?`Generated ${l}. Link is ready.`:`Referral settings saved. Code: ${l}`),h()}catch(a){v(t,a.message),$(a.message)}}async function uv(){const e=m("[data-trader-board-status]");try{await Y(e,"Opening secure web profile..."),v(e,"Saving trader board settings...");const t=m("[data-trader-board-wallet-mode]")?.value||"all",a=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!m("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:qe("trader-board")})});pe(a.user),v(e,a.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){v(e,t.message),$(t.message)}}async function Wd(e,t){const a=t.dataset.watchToken||t.dataset.unwatchToken||"";if(a)try{await Y(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:a,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});n.watchlist=r.watchlist||n.watchlist,h()}catch(r){$(r.message)}}function ji(e){const t=m("[data-launch-status]");v(t,e)}function dv(){const e=m("[data-launch-ticker]")?.value?.trim()||kt(Me().keywords)[0]||"",t=qe("launch"),a=m("[data-launch-group]")?.value?.trim()||"",r=m("[data-launch-amount]")?.value||"",o=x("[data-launch-tp]","[data-launch-tp-custom]","40"),s=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),l=x("[data-launch-loop]","[data-launch-loop-custom]","1"),u=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return Me().keywords=e,Me().open=!0,{ticker:e,walletIndexes:t,walletGroup:a,amountSol:r,takeProfitPct:o,stopLossPct:s,sellDelay:c,loopCount:l,loopDelay:u,slippageBps:d,...ma("launch")}}async function pv(){try{const e=dv();ji("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});n.launchResult=t.watch,await ia(),n.activeTab="launch",h()}catch(e){ji(e.message)}}async function mv(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});n.launchResult=t.watch,await ia(),n.activeTab="launch",h()}catch(t){ji(t.message)}}function fv(){return`
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
  `}function hv(){const e=Nu();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${i(n.sweepBackgroundStatus||"")}</small>
    </section>`}async function gv(){if(!n.sweepBackgroundPending){n.sweepBackgroundPending=!0,n.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:te});n.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await yt({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){n.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{n.sweepBackgroundPending=!1,h({force:!0})}}}function bv(){const e=wv(),a=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Nd()}
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
      ${Li().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${en(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${i(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${i(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${Sv(r)}
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
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${db()}${hv()}${ub()}${fv()}`},{key:"create",label:"Create",hint:"New wallets",html:Za()},{key:"import",label:"Import",hint:"Add keys",html:ku()},{key:"backup",label:"Backup",hint:"Save / restore",html:Su()},{key:"downloads",label:"Downloads",hint:"Exports",html:$u()}];if(!n.wallets.length){const r=a.filter(o=>o.key!=="balances"&&o.key!=="fund");return`
      ${e}
      ${O("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${nn({toolKey:"wallets",activeKey:rn("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${nn({toolKey:"wallets",activeKey:rn("wallets","balances"),sections:a})}
  `}function yv(){return(Array.isArray(n.wallets)?n.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function vv(){if(!(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey)return"";const t=yv();return t?`
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
    </div>`}function wv(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.connectedWalletBalance||{},a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",s=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${i(c.dexUrl||Q(c.mint))}" target="_blank" rel="noreferrer">
      ${pt({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
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
        ${s?`<div class="connected-token-list">${s}</div>`:""}
        ${vv()}
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
  `}function Nd(){const e=n.balances.reduce((a,r)=>a+Number(r.tokens?.length||0),0)+Vc().length,t=n.balances.filter(a=>a.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${oi()}</strong></div>
      <div><span>Total SOL</span><strong>${Et().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function Sv(e){const t=n.balances.find(s=>Number(s.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${i(t.error)}</span>`;const a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${i(a)} | ${i(r)}${i(o)}</span>`}function kv(){const e=rt(),t=`
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
    ${$v()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(Lp).join("")}
    </div>
  `:`${t}${O("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function $v(){const e=n.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${i(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const a=t.filter(o=>!o.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
    <section class="trade-card bag-scan">
      <div class="trade-head">
        <div>
          <h3>🛡 Bag scan: ${a?`${a} of ${t.length} need eyes`:`all ${t.length} look healthy`}</h3>
          <p>Shield verdict + live liquidity on every bag, worst first. Scanned just now.</p>
        </div>
      </div>
      <div class="table-list">
        ${t.map(o=>`
          <article class="row-card">
            <div class="row-main">
              <strong>$${i(o.symbol)} <span style="color:${r[o.verdict]||"#9fb59a"};font-weight:800">${i(o.verdict)}${o.score!=null?` ${i(String(o.score))}/100`:""}</span></strong>
              <small>${o.flags.length?i(o.flags.join(" | ")):"no red flags"}${o.liquidityUsd!=null?` | liq ${B(o.liquidityUsd)}`:""}${o.marketCapUsd?` | MC ${B(o.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${i(o.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${i(o.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function Tv(e){const t=String(e||"").trim();if(!t)return;n.devWatch||(n.devWatch={});const a=!n.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:a}),timeoutMs:15e3});n.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}Sa()}async function Av(e,t=null){const a=String(e||"").trim();if(!a)return;const r=lt();t&&(t.disabled=!0,t.textContent="Arming...");try{const o=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:a,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});rd(a),n.walletRemoveStatus=o.message||"Exits armed.",t&&(t.textContent="✅ Armed"),od().then(()=>h())}catch(o){$(o?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function Pv(){n.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});n.bagScan={status:"done",bags:e.bags||[]}}catch(e){n.bagScan={status:"error",message:e?.message||""}}h()}function Cv(){const e=`
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
            ${pt(t)}
            <div>
              <strong>${i(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${i(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${i(t.tokenMint)}">${i(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${i(t.spentSol||"0")} SOL</span>
          <span>${i(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${i(t.realizedSol||"0")}</span>
          <span>${i(t.holdTime||"n/a")}<small>Latest ${i(we(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ge(Au(t),"Share")}
            <button data-pnl-card="${i(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${i(t.tokenMint)}" data-share-text="${i(Au(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${O("No PnL yet","Trades made through the bot will show here.")}`}function or(){return Lv(sr())}function sr(){const e=Object.values(n.livePairsByBucket||{}).flatMap(o=>o?.rows||[]),t=n.scan?.rows||[],a=n.kolScan?.rows||[],r=n.watchlist?.rows||[];return[...e,...t,...a,...r]}function cn(e=""){const t=String(e||"");return t&&sr().find(a=>String(a?.tokenMint||"")===t)||null}function qk(e=""){const t=cn(e);return!t||!Mo(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function Lv(e=[]){const t=new Map;for(const a of e||[]){if(ir(a))continue;const r=String(a?.tokenMint||"");r&&!t.has(r)&&t.set(r,a)}return[...t.values()]}function be(e=[]){const t=new Map;for(const a of e||[]){if(ir(a))continue;const r=String(a?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||xo(a)>xo(o))&&t.set(r,a)}return[...t.values()]}function xo(e={}){return Wv(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(E(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function xv(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function Mo(e={}){if(xv(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=E(e.marketCap,e.fdv),r=E(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function ir(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=E(e.marketCap,e.fdv),r=E(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function Dd(){const e=or(),t=s=>e.find(c=>String(c.tokenMint)===s)||{tokenMint:s,shortMint:w(s),symbol:w(s),dexUrl:Q(s)},a=String(n.terminalToken||n.tradeToken||"").trim();if(a)return t(a);const r=String(n.terminalAutoToken||"").trim();if(r)return t(r);const o=(Ne()?.rows||[])[0]||e[0]||null;return o?.tokenMint&&(n.terminalAutoToken=String(o.tokenMint)),o}function Bo(){const e=or(),t=n.smartChartTokenRef||null,a=o=>e.find(s=>String(s.tokenMint||"")===o)||{...String(t?.tokenMint||"")===o?t:{},tokenMint:o,shortMint:w(o),symbol:t?.symbol||w(o),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||Q(t?.pairAddress||o),pumpUrl:o.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(o)}`:""},r=String(n.smartChartToken||n.terminalToken||n.tradeToken||"").trim();return Hd(r?a(r):Dd())}function _d(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const Mv=300*1e3,Ud=45*1e3,qd=600*1e3,Bv=700,Rv=6e3,Iv=4,Ov=3e4;function Ye(e=""){const t=String(e||"").trim();if(!t)return null;const a=n.smartChartBootstrap?.[t]||null;if(!a)return null;const r=Date.now()-Number(a.loadedAt||a.resolvedAt||0);return a.status==="failed"?r<Ud?a:null:r<qd?a:null}function lr(e=""){const t=String(e||"").trim(),a=t?n.smartChartDexResolution?.[t]||Ye(t):null;if(!a)return null;const r=Date.now()-Number(a.resolvedAt||0);return a.status==="failed"?r<Ud?a:null:r<Mv?a:null}function Hd(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=lr(t);return!a||a.status==="failed"?e:{...e,pairAddress:e.pairAddress||a.pairAddress||"",pairId:e.pairId||a.pairAddress||"",dexUrl:e.dexUrl||a.dexUrl||a.pairUrl||"",dexId:e.dexId||a.dexId||"",dexName:e.dexName||a.dexName||a.dexId||"",symbol:e.symbol||a.symbol||w(t),name:e.name||a.name||"Token",imageUrl:e.imageUrl||a.imageUrl||"",marketCap:e.marketCap||a.marketCap||0,marketCapUsd:e.marketCapUsd||a.marketCap||0,fdv:e.fdv||a.fdv||0,liquidityUsd:e.liquidityUsd||a.liquidityUsd||0,volumeH24:e.volumeH24||a.volumeH24||0,volumeH1:e.volumeH1||a.volumeH1||0,priceUsd:e.priceUsd||a.priceUsd||0,h1:e.h1||a.h1||0,volume:e.volume||a.volume||null,txns:e.txns||a.txns||null}}function Gi(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const a=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:a,resolvedAt:a};n.smartChartBootstrap={...n.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&Ro({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function Ro(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.pairAddress||e.pairId||"").trim();!t||!a&&!e.dexUrl&&!e.symbol&&!e.name||(n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{...n.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:a,dexUrl:e.dexUrl||Q(a||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||n.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||n.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||n.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||n.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||n.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||n.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||n.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function Ev(e={}){const t=String(e?.tokenMint||n.smartChartToken||"").trim();if(!t)return!1;const a=String(e?.pairAddress||e?.pairId||"").trim();if(a)return Ro({...e,tokenMint:t,pairAddress:a}),!1;if(Ye(t)?.pairAddress)return!1;const r=lr(t);return r?.pairAddress||r?.status==="failed"?!1:(n.smartChartDexResolving?.[t]||(n.smartChartDexResolving={...n.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{zd(t).catch(()=>{})},0)),!0)}function Kd(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||n.smartChartToken||"").trim();return!a||!t.force&&Ye(a)?.status==="resolved"?!1:(n.smartChartBootstrapLoading?.[a]||(n.smartChartBootstrapLoading={...n.smartChartBootstrapLoading||{},[a]:!0},window.setTimeout(()=>{zd(a,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const Xi=new Map;async function Vd(e){const t=String(e||"").trim();if(!t)return;const a=Xi.get(t)||0;if(Date.now()-a<3e4)return;Xi.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,p)=>(Number(p?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},o=async()=>{const s=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!s?.pair)throw new Error("no pair");return s.pair};try{const s=await Promise.any([r(),o()]);Gi({tokenMint:t,symbol:s.baseToken?.symbol||"",name:s.baseToken?.name||"",priceUsd:s.priceUsd,marketCap:s.marketCap||s.fdv||null,marketCapUsd:s.marketCap||s.fdv||null,fdv:s.fdv||null,liquidityUsd:Number(s.liquidity?.usd)||null,liquidity:{usd:Number(s.liquidity?.usd)||null},volumeH24:Number(s.volume?.h24)||null,volumeH1:Number(s.volume?.h1)||null,h1:Number(s.priceChange?.h1)||null,imageUrl:s.info?.imageUrl||"",dexUrl:s.url||"",pairAddress:s.pairAddress||"",dexId:s.dexId||"",pumpCurve:!!s.pumpCurve,bondingProgressPct:s.bondingProgressPct??null,source:s.pumpCurve?"pump-curve":"direct-dexscreener"}),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{Xi.delete(t)}}function Ji(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return a?(Ro(e),Wh(a,e.symbol||e.name||""),Vd(a),Kd(e,{source:t.source||"prefetch"}),n.smartChartPrefetchLog=[...n.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:a,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(n.smartChartBootstrapLoading?.[a]||Ye(a)),cacheTtlMs:qd}].slice(-20),!0):!1}async function zd(e=""){const t=String(e||"").trim();if(!t)return null;try{const a=L(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),o=r.chart||r.dexToken||{};return Gi(o),H("chart-bootstrap",a,{component:"smartChart",cacheHit:!!o.cacheHit,stale:!!o.stale,details:`${t}:${o.chartProvider||"dexscreener-embed"}`}),n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),o}catch(a){return n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:D(a?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),null}finally{const a={...n.smartChartDexResolving||{}};delete a[t],n.smartChartDexResolving=a;const r={...n.smartChartBootstrapLoading||{}};delete r[t],n.smartChartBootstrapLoading=r}}function Fv(e,t={}){const a=_d(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(a)}?${r.toString()}`}function jd(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Ye(a);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Fv(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function Hk(e={}){const t=String(e?.tokenMint||e?.mint||n.smartChartToken||""),a=ep(t||e?.symbol||"pump"),r=Math.max(1,E(e.marketCap,e.fdv,e.liquidityUsd,1e4)),o=E(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),s=Math.max(4,Math.min(96,qt(e)||E(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(o)||E(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(l,u)=>{const d=Math.sin((u+a%11)/2.2)*c,p=(u/21-.5)*(o||s/3),f=((a>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+p+f)/100))})}function Kk(e={},...t){for(const a of t){const r=Number(e?.[a]);if(Number.isFinite(r)&&r>0)return r;const o=a.split(".").reduce((c,l)=>c?.[l],e),s=Number(o);if(Number.isFinite(s)&&s>0)return s}return 0}function Vk(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="txns",o=Math.max(0,Math.min(100,qt(e)||E(e.bondingProgressPct,e.pumpProgress,0))),s=N(e.marketCapLabel,e.fdvLabel,B(e.marketCap),B(e.fdv)),c=N(e.liquidityLabel,B(e.liquidityUsd)),l=N(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,B(e.volumeM15),B(e.volume5m),B(e.volumeH1));return`
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
          ${fk(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${i(s)}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(c)}</dd></div>
          <div><dt>Volume</dt><dd>${i(l)}</dd></div>
          <div><dt>Status</dt><dd>${Ui(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":hk(e)}
      <small>${i(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function Yi(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",o=t==="info",s=Kd(e)||Ev(e),c=o?`DexScreener info for ${e.symbol||w(a)}`:r?`DexScreener chart and transactions for ${e.symbol||w(a)}`:`DexScreener chart for ${e.symbol||w(a)}`,l=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",o?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=s?"Loading DEX chart while resolving fastest pair...":o?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",p=jd(e,t);return`
    <div class="${i(l)}" data-chart-frame-loading="${i(d)}" data-chart-resolving="${s?"true":"false"}" data-chart-mint="${i(a)}" data-chart-mode="${i(t)}" data-chart-src="${i(p)}">
      <iframe title="${i(c)}" src="${i(p)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${i(t)}','${i(a)}')" allowfullscreen></iframe>
    </div>
  `}function Gd(){const e=[...Object.values(n.livePairsByBucket||{}).flatMap(a=>a?.rows||[]),...n.livePairs?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[],...n.watchlist?.rows||[]],t=new Map;for(const a of e){const r=String(a?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||xo(a)>xo(o))&&t.set(r,a)}return t}function Wv(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,a)=>t+(a&&String(a).toLowerCase()!=="n/a"?1:0),0)}function Xd(e=[]){const t=Gd();return(e||[]).map(a=>Jd(a,t.get(String(a?.tokenMint||""))))}function it(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const o=Number(r[1]);if(!Number.isFinite(o))return null;const s=String(r[2]||"").toLowerCase();return s==="k"?o*1e3:s==="m"?o*1e6:s==="b"?o*1e9:o}function E(...e){for(const t of e){const a=it(t);if(Number.isFinite(a)&&a>0)return a}for(const t of e){const a=it(t);if(Number.isFinite(a))return a}return 0}function Jd(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:E(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:E(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:N(e.marketCapLabel,t.marketCapLabel,B(e.marketCap),B(t.marketCap)),fdvLabel:N(e.fdvLabel,t.fdvLabel,B(e.fdv),B(t.fdv)),liquidityUsd:E(e.liquidityUsd,t.liquidityUsd),liquidityLabel:N(e.liquidityLabel,t.liquidityLabel,B(e.liquidityUsd),B(t.liquidityUsd)),volume5m:E(e.volume5m,t.volume5m),volume5mLabel:N(e.volume5mLabel,t.volume5mLabel,B(e.volume5m),B(t.volume5m)),volumeM15:E(e.volumeM15,t.volumeM15),volumeM15Label:N(e.volumeM15Label,t.volumeM15Label,B(e.volumeM15),B(t.volumeM15)),volumeM30:E(e.volumeM30,t.volumeM30),volumeM30Label:N(e.volumeM30Label,t.volumeM30Label,B(e.volumeM30),B(t.volumeM30)),volumeH1:E(e.volumeH1,t.volumeH1),volumeH1Label:N(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,B(e.volumeH1),B(t.volumeH1)),volumeH24:E(e.volumeH24,t.volumeH24),volumeH24Label:N(e.volumeH24Label,t.volumeH24Label,B(e.volumeH24),B(t.volumeH24)),volumeLabel:N(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,B(e.volumeH1),B(t.volumeH1)),sniperCount:E(e.sniperCount,t.sniperCount)}:e}function cr(e=[],t=[]){return be([...n.livePairsByBucket.under1d?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.scan?.rows||[],...e,...t]).sort((r,o)=>Number(o.bestPickScore||o.score||0)-Number(r.bestPickScore||r.score||0)||E(o.volumeM15,o.volumeM30,o.volumeH1,o.volume5m,o.volumeH24)-E(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||E(o.marketCap,o.fdv)-E(r.marketCap,r.fdv)||Ze(r,o))}function j(e,t,a,r,o){return{key:e,label:t,severity:a,message:r,weight:o}}function Nv(e={}){const t=it(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const a=it(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(a)?a/60:null}function Dv(e,t=[]){const a=(t||[]).some(o=>o.key==="hard_flag"),r=(t||[]).filter(o=>o.severity==="risk"&&o.key!=="liquidity_extreme").length;return a||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function _v(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const a=(t||[]).find(r=>r.severity==="risk");return a?.message?`Avoid recommended. ${a.message}`:"Avoid recommended. Multiple danger signals."}const Io=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function ha(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(Io,t)?t:"unknown"}function Oo(e="",t="Unknown"){const a=ha(e);return Io[a]||t}function Yd(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=a?"new":"unknown";return{mint:t,status:r,label:Io[r],confidence:a?"low":"unknown",summary:a?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:a||null,updatedAt:""}}function ur(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(n.devInfoSummaries?.[t]||e.devInfoSummary)||Yd(e)}function Uv(e={}){const t=ha(e.status);return t==="hold"?j("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?j("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?j("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?j("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?j("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):j("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function Qd(e={},t={}){if(!_("devInfoEnabled",!0))return"";const a=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!a)return"";const r=ur(e),o=ha(r.status),c=!!n.devInfoLoading?.[`summary:${a}`]?"...":o==="unknown"?"":r.label||Io[o]||"",l=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${i(o)} ${l?"is-compact":""}" data-dev-info="${i(a)}" title="${i(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${i(c)}</strong>`:""}
    </button>
  `}function qv(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let a=70;const r=[],o=[],s=[],c=it(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(a-=36,o.push("liquidity"),r.push(j("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(a-=20,o.push("liquidity"),r.push(j("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(a+=8,o.push("liquidity"),r.push(j("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(o.push("liquidity"),r.push(j("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(a-=6,s.push("liquidity"),r.push(j("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const l=Nv(e);Number.isFinite(l)?l<3?(a-=10,o.push("age"),r.push(j("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):l>60?(a+=4,o.push("age"),r.push(j("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):o.push("age"):(a-=4,s.push("age"),r.push(j("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=it(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(a-=5,o.push("volume"),r.push(j("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(a+=6,o.push("volume"),r.push(j("volume_active","Volume","positive","Volume is active enough to review flow.",6))):o.push("volume"):s.push("volume");const d=it(e.buys5m??e.buysH1??e.buys),p=it(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(p)?(o.push("flow"),p>=d*1.8&&p>=5?(a-=18,r.push(j("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=p*1.4&&d>=8&&(a+=5,r.push(j("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):s.push("flow");const f=it(e.bestPickScore??e.score);Number.isFinite(f)&&(o.push("score"),f>=78?(a+=7,r.push(j("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(a-=10,r.push(j("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(T=>String(T||"").toLowerCase());y.some(T=>/mayhem|fake|scam|honeypot|blacklist/.test(T))&&(a-=40,r.push(j("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(T=>/bundle|bundled|cluster|concentr/.test(T))&&(a-=18,r.push(j("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(T=>/dev|fresh wallet|fresh-wallet|insider/.test(T))&&(a-=14,r.push(j("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(T=>/mint|freeze|token-2022/.test(T))&&(a-=24,r.push(j("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const g=ur(e);if(g){const T=Uv(g);a+=Number(T.weight||0),r.push(T),["hold","mixed","risk","dump"].includes(ha(g.status))?o.push("devInfo"):s.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(a))),P=Dv(S,r);return{mint:t,verdict:P,score:S,confidence:o.length>=5&&s.length<=1?"high":o.length>=3?"medium":"low",summary:_v(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Qe(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&n.slimeShieldResults?.[t]||qv(e)}function un(e=""){return String(e||"CAUTION").toLowerCase()}function Hv(e={},t={}){if(!_("slimeShieldEnabled",!0))return zv(e);const a=Qe(e),r=String(e.tokenMint||a.mint||"").trim(),o=a.verdict||"CAUTION",s=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${i(un(o))}" data-slimeshield-details="${i(r)}" title="${i(a.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${s?"Shield":"SlimeShield"}</small>
    </button>
  `}function Kv(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${i(Qi(e))}">${i(o?`${o}`:"n/a")} score</em>`}const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${i(un(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">Details</button>`}function zk(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0),s=o?`${o}`:"n/a";return`
      <span class="terminal-score-chip" title="${i(Qi(e))}">
        <strong>${i(s)}</strong>
        <small>score</small>
      </span>
    `}const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${i(un(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Vv(e={}){return _("slimeShieldEnabled",!0)?`SlimeShield ${Qe(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function zv(e={}){const t=Number(e.bestPickScore||e.score||0),a=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${i(Qi(e))}">
      <strong>${i(r)}</strong>
      <small>${a.length?"warnings":"best pick"}</small>
    </span>
  `}function jv(e={}){return Hv(e,{compact:!0})}function Qi(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},a=Object.entries(t).map(([o,s])=>`${o}: ${s}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...a,...r.map(o=>`warning: ${o}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function Gv(e={}){return""}function B(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function N(...e){for(const t of e){const a=String(t??"").trim();if(a&&a!=="$0"&&a.toLowerCase()!=="n/a")return a}return"n/a"}function Zd(e={}){return[["15m",N(e.volumeM15Label,B(e.volumeM15))],["30m",N(e.volumeM30Label,B(e.volumeM30))],["1h",N(e.volumeH1Label,e.volumeLabel,B(e.volumeH1))],["24h",N(e.volumeH24Label,B(e.volumeH24))]]}function jk(e={}){const t=ut(e),a=dt(e),r=N(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),o=N(e.liquidityLabel,a>0?B(a):"","checking"),s=Zd(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(o)}</b></span>
      ${s.map(([c,l])=>`<span>${i(c)} <b>${i(l)}</b></span>`).join("")}
    </div>
  `}function Xv(e={}){const t=ut(e),a=dt(e),r=N(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),o=N(e.liquidityLabel,a>0?B(a):"","checking"),s=N(e.volumeM15Label,B(e.volumeM15)),c=N(e.volumeH1Label,e.volumeLabel,B(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(o)}</b></span>
      <span>15m <b>${i(s)}</b></span>
      <span>1h <b>${i(c)}</b></span>
    </div>
  `}function dn(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const a=String(e.tokenMint||e.mint||"").trim();return a&&(e.isPump||a.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(a)}`:""}function Eo(e={},t=""){const a=t||Ta(e),r=Number(e.sniperCount||e.snipers||0),o=dn(e);return`
    <div class="compact-link-row">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${o?`<a href="${i(o)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${i(a)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(r)}</span>`:""}
    </div>
  `}function Ze(e={},t={}){const a=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(a)&&Number.isFinite(r)&&a!==r)return a-r;const o=Number(e.pairCreatedAt||0),s=Number(t.pairCreatedAt||0);return o||s?s-o:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function ep(e=""){let t=0;for(let a=0;a<String(e).length;a+=1)t=(t<<5)-t+String(e).charCodeAt(a),t|=0;return Math.abs(t)}function ga(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function ba(e=""){const t=Ne();return[e,n.livePairBucket,n.terminalSort,rp(),t?.refreshCount||"",n.livePairsLastUpdatedByBucket[n.livePairBucket]||n.livePairsLastUpdatedAt||"",n.kolScan?.refreshCount||"",n.kolScan?.refreshedAt||n.kolLastUpdatedAt||""].join(":")}function ya(e=[],t=12,a="",r=0){const o=be(e||[]),s=Math.max(0,Number(t)||o.length);if(!s)return[];if(!a||o.length<=s)return o.slice(0,s);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,s-1),o.length),l=o.slice(0,c),u=o.slice(c);if(!u.length)return l.slice(0,s);const d=ep(a)%u.length,p=[...u.slice(d),...u.slice(0,d)];return[...l,...p].slice(0,s)}function tp(e=[],t=new Set){return(e||[]).filter(a=>{const r=ga(a);return!r||!t.has(r)})}function ap(e={}){const t=ut(e),a=dt(e),r=gl(e),o=Yo(e),s=Dp(e),c=N(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),l=N(e.liquidityLabel,a>0?B(a):"","checking"),u=N(e.volumeM15Label,r>0?B(r):"","checking"),d=N(e.volumeH1Label,e.volumeLabel,o>0?B(o):"","checking"),p=N(e.volumeH24Label,s>0?B(s):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${i(c)}</strong></span>
      <span><small>Liq</small><strong>${i(l)}</strong></span>
      <span><small>15m</small><strong>${i(u)}</strong></span>
      <span><small>1h</small><strong>${i(d)}</strong></span>
      <span><small>24h</small><strong>${i(p)}</strong></span>
    </div>
  `}function np(e,{source:t,actionLabel:a="Trade",isKolContext:r=!1}={}){const o=Xo(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(t)}" title="Open chart and buy/sell panel">${i(a)}</button>
    <button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(t)}" title="Quick buy with preset or custom SOL amount">${i(va())}</button>
    <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${i(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?cd(e):""}
    <button type="button" class="watch-action" data-watched="${o}" title="${o?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(Jo(e)||"")}">${o?"Saved":"Watch"}</button>
    ${Qd(e,{compact:!0})}
  `}function Jv(e,t={}){const a=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ya(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,p)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${l?"is-kol-signal":""}" data-token-chart="${i(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${pt(d,{priority:p<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${i(d.tokenMint)}" data-token-chart-source="terminal-title">${i(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
                <small>${i(d.name||d.category||"Token")}</small>
                ${l?"":fl(d)}
                ${Kv(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${i(d.tokenMint)}">${i(w(d.tokenMint))}</button>
              <span class="terminal-token-age">${i(d.pairAgeLabel||Kt(d)||"age unknown")} | ${i(f)}</span>
              ${Eo(d)}
            </div>
            ${ap(d)}
            <div class="terminal-token-actions has-dev-info">
              ${np(d,{source:"terminal-row",actionLabel:r,isKolContext:l})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:O(o,s)}function St(e,t={}){if(t.layout==="terminal")return Jv(e,t);const a=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ya(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(u.tokenMint)}" data-token-chart-source="compact-row">
          ${pt(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${i(u.tokenMint)}" data-token-chart-source="compact-title">${i(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
              <small>${i(u.name||u.category||"Token")}</small>
              ${l?"":fl(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${i(u.tokenMint)}">${i(w(u.tokenMint))}</button>
            <span>${i(u.pairAgeLabel||Kt(u)||"age unknown")} | ${i(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${Xv(u)}
            ${Eo(u)}
          </div>
          ${jv(u)}
          <div class="compact-row-actions has-dev-info">
            ${np(u,{source:"compact-row",actionLabel:r,isKolContext:l})}
          </div>
        </article>
      `).join("")}
    </div>
  `:O(o,s)}function pn(e){const t=oe(e,e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId);if(!t)return"Custom / manual";const a=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&a.push(`Timer ${t.sellDelay}`),a.join(" | ")}function Gk(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${i(pn("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${st("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${st("bundle",n.selectedBundlePresetId)}
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
  `}function dr(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function X(e=n.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const a=t.indexOf(".");if(a!==-1&&(t=t.slice(0,a+1)+t.slice(a+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":dr(r)}function lt(){return oe("trade",n.selectedTradePresetId)}function Yv(){return oe("bundle",n.selectedBundlePresetId)}function He(e=lt()){return X()||dr(e?.amountSol)}function Qv(e=Yv()){return X()||dr(e?.amountSol)||"0.1"}const Zi=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Fo(e=""){return Zi.find(t=>t.id===e)||Zi[0]}function el(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function Zv(e=Fo()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,a=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${a} | ${r}`}function ew(e={},t=Fo()){const a=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:a?.percentGain?String(a.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:a?.sellPercent?String(a.sellPercent):t.sellPercent||"100"}}function tw(e=""){if(ce(e)){const a=le();return`${a?.provider||"Browser wallet"} ${a?.publicKey?w(a.publicKey):""}`.trim()}const t=n.wallets.find(a=>String(a.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Me(){return(!n.terminalLaunchFilters||typeof n.terminalLaunchFilters!="object")&&(n.terminalLaunchFilters={}),n.terminalLaunchFilters.socials=n.terminalLaunchFilters.socials||{},n.terminalLaunchFilters.quotes=n.terminalLaunchFilters.quotes||{},n.terminalLaunchFilters.audits=n.terminalLaunchFilters.audits||{},n.terminalLaunchFilters}function kt(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(a=>String(a||"").trim().split(/\s+/)).map(a=>a.trim().toLowerCase()).filter(a=>!a||t.has(a)?!1:(t.add(a),!0)).slice(0,3)}function rp(e=Me()){const t=Object.keys(e.socials||{}).filter(o=>e.socials[o]).sort().join(","),a=Object.keys(e.quotes||{}).filter(o=>e.quotes[o]).sort().join(","),r=Object.keys(e.audits||{}).filter(o=>e.audits[o]).sort().join(",");return[kt(e.keywords).join(","),kt(e.excludeKeywords).join(","),t,a,r].join("|")}function mn(e=Me()){return!!rp(e).replace(/\|/g,"")}function Wo(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function aw(e={},t=""){const a=Wo(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(a));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(a)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(a)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(a)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(a)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(a)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(a)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(a)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(a)):t==="minSocial"?r:!0}function nw(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const a=Wo(e).toUpperCase();return a.includes("USDC")?"USDC":a.includes("USD1")?"USD1":a.includes("WSOL")||a.includes("SOL")?"WSOL":""}function No(e={},t=[]){const a=Wo(e);return t.some(r=>r.test(a))}function rw(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!No(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!No(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:No(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const a=E(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return a>0?a<=30:!No(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function fn(e=[],t=Me()){const a=be(e||[]);if(!mn(t))return a;const r=kt(t.keywords),o=kt(t.excludeKeywords),s=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),l=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return a.filter(u=>{const d=Wo(u);return!(r.length&&!r.some(p=>d.includes(p))||o.length&&o.some(p=>d.includes(p))||s.some(p=>!aw(u,p))||c.length&&!c.includes(nw(u))||l.some(p=>!rw(u,p)))})}function tl(e=[],t=[]){const a=Me();if(!mn(a))return"";const r=kt(a.keywords),o=kt(a.excludeKeywords),s=[];r.length&&s.push(`watching ${r.map(l=>`"${l}"`).join(", ")}`),o.length&&s.push(`excluding ${o.map(l=>`"${l}"`).join(", ")}`);const c=Math.max(0,be(e).length-be(t).length);return`<div class="terminal-launch-filter-summary">${i(s.join(" | ")||"filters active")} - ${i(t.length)}/${i(be(e).length)} visible${c?`, ${i(c)} hidden`:""}</div>`}function pr(e=[],t="pairs"){const a=Me(),r=kt(a.keywords),o=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",s=be(e).length;return O("Watching fresh launches",s?`No ${t} match ${o} yet. ${s} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${o}.`)}function al(e="terminal",t={}){const a=Me(),r=mn(a),o=!!(a.open||r),s=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):s;return`
    <section class="terminal-launch-filter ${o?"is-open":""}" data-terminal-launch-filter data-preserve-focus>
      <div class="terminal-launch-filter-head">
        <div>
          <strong>Launch Filter</strong>
          <span>${r?`${i(c)}/${i(s)} visible`:"Watch a known ticker before it goes live"}</span>
        </div>
        <button type="button" data-terminal-filter-toggle>${o?"Hide Filters":"Filter / Keyword Watch"}</button>
      </div>
      ${o?`
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
            ${lf.map(([l,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${i(l)}" ${a.socials?.[l]?"checked":""}> ${i(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${cf.map(([l,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${i(l)}" ${a.quotes?.[l]?"checked":""}> ${i(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${uf.map(([l,u])=>`
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
  `}function op(){Or&&window.clearTimeout(Or),Or=window.setTimeout(()=>{Or=null,Z("live"),Z("launch"),Z("sniper"),h()},180)}function Do(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const o=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-o)/1e3))}const a=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return a&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const ow=100,sw=7200,iw=75e4,lw=86400,cw=2e6,uw=28e3,sp=18e4,dw=16e4;function ip(){const e=Gd();return be([...n.livePairs?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1d?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[]]).map(t=>Jd(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!ir(t))}function hn(e={}){return E(e.marketCap,e.fdv)}function lp(e={}){return E(e.liquidityUsd)}function cp(e={}){return E(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function nl(e={}){if(gn(e))return!1;const t=Do(e);return!Number.isFinite(t)||t<0||t>sw||hn(e)>iw?!1:qt(e)<70}function _o(e={}){if(gn(e))return!1;const t=qt(e),a=hn(e),r=a>=uw&&a<=sp;return t>=55&&(!a||a<=sp)||r}function up(e={}){if(nl(e)||_o(e)||gn(e))return!1;const t=Do(e);return Number.isFinite(t)&&(t<0||t>lw)||hn(e)>cw?!1:lp(e)>0||cp(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function dp(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function qt(e={}){const t=E(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const a=hn(e),r=dp(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&a>0?Math.max(1,Math.min(99,a/69e3*100)):0}function gn(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=dp(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const a=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=hn(e);return a&&r>=dw?!0:!!(a&&/\b(raydium|meteora|orca)\b/.test(t))}function Uo(e={}){if(gn(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":_o(e)||t==="graduating"?"graduating":nl(e)?"new":(t==="steady"||t==="unknown"||up(e),"steady")}function pp(e={}){const t=Number(e.bestPickScore||e.score||0),a=cp(e),r=lp(e),o=hn(e),s=Do(e),c=Number.isFinite(s)?Math.max(0,86400-s)/86400:0;return t*1e3+Math.log10(a+1)*160+Math.log10(r+1)*120+Math.log10(o+1)*80+c*100}function mp(e=[]){return[...e].sort((t,a)=>pp(a)-pp(t)||Ze(t,a))}function pw(e=[],t=[],a=ow){const r=new Set,o=[];for(const s of[...e,...t]){const c=String(s?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),o.push(s),o.length>=a))break}return o}function fp(e=n.slimeScopeMode){const t=ip(),a=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(l=>Uo(l)===a),o=t.filter(l=>{const u=Uo(l);return a==="graduated"?u==="graduated"||gn(l):a==="graduating"?u==="graduating"||_o(l):a==="steady"?u==="steady"||up(l):u==="new"||nl(l)}),s=a==="new"?[...r].sort(Ze):mp(r),c=a==="new"?be(o).sort(Ze):mp(o);return pw(s,c)}function mw(e=[],t="new"){const a=nt(`slimeScope:${t}`,e).slice(0,12);return a.length?a.map((r,o)=>{const s=r.pairAgeLabel||Kt(r)||"age ?",c=N(r.marketCapLabel,r.fdvLabel,B(ut(r)),"checking"),l=N(r.liquidityLabel,B(dt(r)),"checking"),u=N(r.volumeM15Label,B(gl(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${i(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${pt(r,{priority:o<4})}
        <div class="slime-scope-column-main">
          <strong>${i(r.symbol||r.shortMint||w(r.tokenMint))}</strong>
          <small>${i(w(r.tokenMint))} · ${i(s)}</small>
          <span>${i(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${i(c)}</b></span>
          <span>Liq <b>${i(l)}</b></span>
          <span>15m <b>${i(u)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${i(He()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${i(t)} pairs.</div>`}function fw(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,a,r])=>{const o=fp(t);return`
          <section class="slime-scope-column" data-scope-column="${i(t)}">
            <header>
              <div>
                <h4>${i(a)}</h4>
                <small>${i(r)}</small>
              </div>
              <span>${i(o.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${mw(o,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function hw(){const e=Ep(),[,,t]=e,a=Dc(n.slimeScopeMode),o=!!(z("slimeScope").inFlight||n.livePairsLoadingByBucket?.[a]),s=n.livePairsRefreshErrorByBucket?.[a],c=be(Fp(ip(),e[0])),l=nt("slimeScope",c),u=l.length?Xn()?ct(l,{context:"live",shareBuilder:Ta,hideToolbar:!0}):St(l,{layout:"terminal",limit:Math.max(1,l.length),actionLabel:"Trade"}):s?O("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):o?O("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):O("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${Xw(e)}<span>${i(t)}</span></div>
        ${Wp(c.length,ca())}
        ${Hu("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${o?"disabled":""}>${o?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${la("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${fw()}
    </section>
  `}function Xk(){const e=Ne(),t=be(e?.rows||[]),a=fn(t),r=[...a].sort(Ze),o=Xd(n.kolScan?.rows||[]).filter(C=>!ir(C)),s=fn(o),c=cr(t,o),l=fn(c),u=mn(),d=ya(l,8,ba("best-picks"),2),p=new Set(d.map(ga).filter(Boolean)),f=tp(r,p),y=ya(f.length?f:r,12,ba("live-pairs"),0),g=new Set([...p,...y.map(ga).filter(Boolean)]),S=tp(s,g),P=ya(S.length?S:s,12,ba("kol-signals"),1),T=!!n.livePairsLoadingByBucket[n.livePairBucket],b=ca(),A="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${T?"Refreshing":"Live"}${b?` | ${i(Hn(Ya(b)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Mt.map(([C,M])=>{const q=n.livePairsByBucket[C]?.rows?.length,J=Number.isFinite(Number(q))?` (${q})`:"";return`<button data-live-pair-bucket="${C}" data-active="${n.livePairBucket===C}">${M}${J}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${sf.map(([C,M])=>`<option value="${C}" ${n.terminalSort===C?"selected":""}>${M}</option>`).join("")}
            </select>
          </label>
          ${Hu("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${T?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${al("terminal",{rawCount:t.length,visibleCount:a.length})}
        ${tl(t,a)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?St(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?pr(c,"best picks"):St(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?St(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A}):u?pr(t,"live pairs"):St(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${n.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?St(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?pr(o,"KOL signals"):St(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${Ew()}
      </main>
    </section>
  `}function Jk(){const e=lt();if(!e)return"Trade";const t=He(e);return t?`Buy ${t} SOL`:Am(e,"Trade")}function va(){const e=lt(),t=He(e);return t?`Buy ${t} SOL`:"Quick Buy"}function qo(){const e=va();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{v(t,e)})}function wa(e=""){const t=String(e||"").trim();if(!t)return null;const a=sr().find(o=>String(o?.tokenMint||o?.mint||o?.tokenAddress||"").trim()===t);if(a)return a;const r=n.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:Q(t)}}function gw(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function bw(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function hp(e={}){if(!_("slimeShieldEnabled",!0))return"";const t=Qe(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${i(un(r))}">
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
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(a)}" data-protected-buy-preset="${i(t.protectedBuyPreset||el(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function gp(e=[],t="risk",a="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(o=>t==="positive"?o.severity==="positive":o.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(o=>`
        <li>
          <strong>${i(o.label||o.key||"Signal")}</strong>
          <span>${i(o.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(a)}</p>`}function bp(e=""){const t=String(e||n.smartChartToken||n.tradeToken||"").trim();!t||!_("slimeShieldEnabled",!0)||(n.slimeShieldDetails={open:!0,tokenMint:t},n.slimeShieldStatus="",_a(),ka(),Ho(t,{force:!0}),_("replayBeforeBuyEnabled",!0)&&il(t,{force:!0}))}function rl(){n.slimeShieldDetails={open:!1,tokenMint:""},n.slimeShieldStatus="",ka(),Er()}async function Ho(e="",t={}){const a=String(e||"").trim();if(!a||!_("slimeShieldEnabled",!0))return null;if(!t.force&&n.slimeShieldResults?.[a])return n.slimeShieldResults[a];if(n.slimeShieldLoading?.[a])return null;n.slimeShieldLoading={...n.slimeShieldLoading||{},[a]:!0},ka();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const s=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return s&&(n.slimeShieldResults={...n.slimeShieldResults||{},[a]:s},ne(s.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),n.slimeShieldStatus=s.cacheHit?"Loaded from cache.":"Updated from local data."),s}catch(r){return n.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...n.slimeShieldLoading||{}};delete r[a],n.slimeShieldLoading=r,ka()}}function yw(e=""){const t=wa(e)||cn(e)||{tokenMint:e},a=ur(t),r=a.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",o=[...Array.isArray(a.externalLinks)?a.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||Q(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:mint?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(mint)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((s,c,l)=>/^https?:\/\//i.test(String(s.url||""))&&l.findIndex(u=>String(u.url||"")===String(s.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:a.likelyDevWallet||null,confidence:a.confidence||"unknown",status:ha(a.status),label:a.label||Oo(a.status),score:50,summary:a.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:a.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:a.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:a.updatedAt||new Date().toISOString(),externalLinks:o,dataSource:"ui-fallback"}}function yp(e=""){const t=String(e||"").trim();return n.devInfoResults?.[t]||yw(t)}function mr(e,t=""){const a=Number(e);return Number.isFinite(a)?`${Math.round(a*10)/10}${t}`:"n/a"}function vp(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function Ko(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function vw(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function wp(e="",t={}){const a=String(e||"").trim();if(!a||!_("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoSummaries?.[a])return n.devInfoSummaries[a];const r=`summary:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0};try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(a)}${o}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(n.devInfoSummaries={...n.devInfoSummaries||{},[a]:c},ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const o={...n.devInfoLoading||{}};delete o[r],n.devInfoLoading=o,t.silent||Sa()}}async function Sp(e="",t={}){const a=String(e||"").trim();if(!a||!_("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoResults?.[a])return n.devInfoResults[a];const r=`details:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0},Sa();try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(a)}${o}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(n.devInfoResults={...n.devInfoResults||{},[a]:c},n.devInfoSummaries={...n.devInfoSummaries||{},[a]:{mint:a,status:c.status||"unknown",label:c.label||Oo(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},n.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(o){return n.devInfoStatus=o?.message||"Dev Info is temporarily unavailable.",null}finally{const o={...n.devInfoLoading||{}};delete o[r],n.devInfoLoading=o,Sa()}}function ww(e=""){const t=String(e||"").trim();!t||!_("devInfoEnabled",!0)||(n.devInfoDetails={open:!0,tokenMint:t},n.devInfoStatus="",_a(),Sa(),wp(t,{force:!0,silent:!0}),Sp(t,{force:!0}))}function ol(){n.devInfoDetails={open:!1,tokenMint:""},n.devInfoStatus="",Sa(),Er()}function Sw(e="render"){!_("devInfoEnabled",!0)||Es||n.route==="terminal"&&(Es=window.setTimeout(()=>{Es=null,kw(e)},300))}async function kw(e="render"){if(!_("devInfoEnabled",!0)||Da())return;const t=or().slice(0,16),a=[],r=new Set;for(const o of t){const s=String(o.tokenMint||o.mint||o.tokenAddress||"").trim();if(!(!s||r.has(s)||n.devInfoSummaries?.[s]||n.devInfoLoading?.[`summary:${s}`])&&(r.add(s),a.push(s),a.length>=8))break}a.length&&(await Promise.allSettled(a.map(o=>wp(o,{silent:!0}))),W({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:a.length,details:e}),Da()||Ua("dev-info-prefetch"))}function Vo(e=[],t="No strong cached signal yet."){const a=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return a.length?`
    <ul class="slimeshield-factor-list">
      ${a.map(r=>`<li><span>${i(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(t)}</p>`}function zo(e,t="Not cached yet"){const a=String(e||"").trim();return!a||a.toLowerCase()==="warming"||a.toLowerCase()==="checking"?t:a}function jo(e,t=r=>String(r),a="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):a}function fr(e,t,a=""){if(e.__lastDrawerHtml===t)return!1;const r=a?e.querySelector(a):null,o=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,a&&o){const s=e.querySelector(a);s&&(s.scrollTop=o)}return!0}function Sa(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=n.devInfoDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",a),!a||!_("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=wa(r)||cn(r)||{tokenMint:r},s=yp(r),c=n.devInfoSummaries?.[r]||ur(o),l=ha(s.status||c.status),u=s.confidence||c.confidence||"unknown",d=!!n.devInfoLoading?.[`details:${r}`],p=s.likelyDevWallet||c.likelyDevWallet||"",f=s.currentPosition||null,y=s.historicalStats||{},g=s.linkedWalletSignals||{},S=s.marketContext||{},P=s.sourceHydration||{},T=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,8):[],b=E(S.marketCap,o.marketCap,o.fdv),A=E(S.liquidityUsd,o.liquidityUsd),C=E(S.volume5m,o.volume5m,o.volumeM5),M=E(S.volumeH1,o.volumeH1,o.volume1h),q=E(S.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),J=S.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",Se=S.mintAuthority||o.mintAuthority||"",et=S.freezeAuthority||o.freezeAuthority||"",U=!!(S.heliusDasIndexedAt||S.heliusDasSource||o.heliusDasSource||J||Se||et),We=[...Array.isArray(s.externalLinks)?s.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:o.dexUrl||Q(r)},{label:"Solscan Wallet",url:p?`https://solscan.io/account/${encodeURIComponent(p)}`:""},{label:"KOLscan Wallet",url:p?`https://kolscan.io/account/${encodeURIComponent(p)}`:""},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"X",url:o.twitterUrl||o.xUrl},{label:"TG",url:o.telegramUrl},{label:"Website",url:o.websiteUrl}].filter((de,fs,hs)=>/^https?:\/\//i.test(String(de.url||""))&&hs.findIndex(wn=>String(wn.url||"")===String(de.url||""))===fs).slice(0,8),Xt=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],Pt=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${i(Oo(l))} · ${i(vp(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${i(l)}">
        <strong>${i(o.symbol||o.shortMint||w(r))}</strong>
        <p>${i(s.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${i(we(s.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${i(vw(p))}</dd></div>
          <div><dt>Confidence</dt><dd>${i(vp(u))}</dd></div>
          <div><dt>Source</dt><dd>${i(s.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${i(w(s.pairAddress||o.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${p?`<button type="button" data-copy="${i(p)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${i(r)}">Copy CA</button>
          ${p&&n.user?`<button type="button" data-dev-watch="${i(p)}">${n.devWatch?.[p]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${We.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${We.map(de=>`<a href="${i(de.url)}" target="_blank" rel="noreferrer">${i(de.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${i(jo(b,B))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(jo(A,B))}</dd></div>
          <div><dt>5m volume</dt><dd>${i(jo(C,B))}</dd></div>
          <div><dt>1h volume</dt><dd>${i(jo(M,B))}</dd></div>
          <div><dt>Pair age</dt><dd>${i(Number.isFinite(q)?Ko(q):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(J?w(J):U?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${Se?w(Se):U?"none":"not indexed"} / ${et?w(et):U?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(S.source||s.cacheSource||s.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${i(P.message)}${P.eventsStored?` · ${i(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${Vo(T,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${i(mr(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${i(mr(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${i(mr(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${i(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${i(Ko(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${i(f.lastSellAt?we(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||Xt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${i(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${i(Ko(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${i(mr(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${i(mr(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${Xt.length?`
          <ul class="dev-info-launches">
            ${Xt.map(de=>`<li><span>${i(de.symbol||w(de.mint||""))}</span><small>${i(de.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(s.riskReasons)&&s.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${Vo(s.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(s.positiveReasons)&&s.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${Vo(s.positiveReasons,"")}
      </section>`:""}
      ${g.linkedWalletCount||Array.isArray(g.notes)&&g.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${i(g.linkedWalletCount?`${g.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${Vo(g.notes,"")}
      </section>`:""}
      ${(()=>{const de=[f?"":"dev position",Number(y.launchesTracked)>0||Xt.length?"":"launch history",!(s.riskReasons||[]).length&&!(s.positiveReasons||[]).length?"behavior signals":"",!g.linkedWalletCount&&!(g.notes||[]).length?"linked wallets":""].filter(Boolean);return de.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${i(de.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${i(s.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${i(r)}" data-watch-symbol="${i(o.symbol||"")}" data-watch-name="${i(o.name||"")}" data-watch-image="${i(Jo(o)||"")}">${Xo(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${i(r)}">Open SlimeShield</button>
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${i(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${n.devInfoStatus?`<small class="slimeshield-status">${i(n.devInfoStatus)}</small>`:""}
    </aside>
  `;fr(e,Pt,".dev-info-drawer")}function kp(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function sl(e=""){const t=String(e||"").trim();return n.replayResults?.[t]||kp(t)}function bn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function $w(e=""){if(!_("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const a=sl(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${i(a.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(bn(a.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(bn(a.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${i(a.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function il(e="",t={}){const a=String(e||"").trim();if(!a||!_("replayBeforeBuyEnabled",!0))return null;if(!t.force&&n.replayResults?.[a])return n.replayResults[a];if(n.replayLoading?.[a])return null;n.replayLoading={...n.replayLoading||{},[a]:!0},hr(),ka();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const s=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return s&&(n.replayResults={...n.replayResults||{},[a]:s},ne(s.cacheHit?"replayCacheHit":"replayCacheMiss")),s}catch{return n.replayResults={...n.replayResults||{},[a]:kp(a)},null}finally{const r={...n.replayLoading||{}};delete r[a],n.replayLoading=r,hr(),ka()}}function Tw(e=""){const t=String(e||"").trim();!t||!_("replayBeforeBuyEnabled",!0)||(n.replayDetails={open:!0,tokenMint:t},_a(),hr(),il(t))}function ll(){n.replayDetails={open:!1,tokenMint:""},hr(),Er()}function hr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=n.replayDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",a),!a||!_("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=sl(r),s=!!n.replayLoading?.[r],c=`
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
        <strong>${i(o.summary||"Not enough local history yet.")}</strong>
        <small>${s?"Updating...":`Confidence: ${i(o.confidence||"low")} · Updated ${i(we(o.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${i(o.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(bn(o.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${i(bn(o.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(bn(o.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${i(bn(o.failRatePercent))}</dd></div>
        <div><dt>Best exit</dt><dd>${i(o.bestExitPattern||"n/a")}</dd></div>
      </dl>
      <section>
        <h4>Matched Traits</h4>
        ${Array.isArray(o.matchedTraits)&&o.matchedTraits.length?`
          <ul class="slimeshield-factor-list">
            ${o.matchedTraits.map(l=>`<li><span>${i(l)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${i(r)}" ${s?"disabled":""}>${s?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `;fr(e,c,".replay-drawer")}function ka(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=n.slimeShieldDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",a),!a||!_("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=wa(r)||{tokenMint:r},s=n.slimeShieldResults?.[r]||Qe(o),c=s.verdict||"CAUTION",l=s.sourceHydration||{},u=s.marketContext||{},d=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,6):[],p=!!n.slimeShieldLoading?.[r],f=Array.isArray(s.factors)?s.factors:[],y=E(u.marketCap,o.marketCap,o.fdv),g=E(u.liquidityUsd,o.liquidityUsd),S=E(u.volumeH1,o.volumeH1,o.volume1h),P=E(u.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),T=u.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",b=u.mintAuthority||o.mintAuthority||"",A=u.freezeAuthority||o.freezeAuthority||"",C=!!(u.heliusDasIndexedAt||u.heliusDasSource||o.heliusDasSource||T||b||A),M=s.devInfoSummary||ur(o),q=ha(M.status),J=[...Array.isArray(s.externalLinks)?s.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||o.dexUrl||Q(r)},{label:"Pump",url:u.pumpUrl||dn(o)},{label:"X",url:u.twitterUrl||o.twitterUrl||o.xUrl},{label:"TG",url:u.telegramUrl||o.telegramUrl},{label:"Web",url:u.websiteUrl||o.websiteUrl}].filter((U,We,Xt)=>/^https?:\/\//i.test(String(U.url||""))&&Xt.findIndex(Pt=>String(Pt.url||"")===String(U.url||""))===We),Se=[...Array.isArray(o.riskFlags)?o.riskFlags:[],...Array.isArray(o.scoreWarnings)?o.scoreWarnings:[],...Array.isArray(o.bestPickWarnings)?o.bestPickWarnings:[]].filter(Boolean).slice(0,4),et=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${i(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${i(un(c))}">
        <strong>${i(o.symbol||o.shortMint||w(r))}</strong>
        <p>${i(s.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${i(s.confidence||"low")}</span>
          <span>Score: ${i(Number.isFinite(Number(s.score))?`${Math.round(Number(s.score))}/100`:"n/a")}</span>
          <span>${p?"Updating...":`Updated ${i(we(s.updatedAt))}`}</span>
        </div>
      </section>
      <section>
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${i(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${i(Number.isFinite(P)?Ko(P):zo(o.pairAgeLabel||Kt(o),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(Number.isFinite(g)&&g>0?B(g):zo(o.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${i(Number.isFinite(y)&&y>0?B(y):zo(o.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${i(Number.isFinite(S)&&S>0?B(S):zo(o.volumeH1Label||o.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${i(Oo(q))} · ${i(M.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(T?w(T):C?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${b?w(b):C?"none":"not indexed"} / ${A?w(A):C?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(u.source||s.cacheSource||s.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${i(Se.length?Se.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${J.map(U=>`<a href="${i(U.url)}" target="_blank" rel="noreferrer">${i(U.label)}</a>`).join("")}
          ${_("devInfoEnabled",!0)?`<button type="button" data-dev-info="${i(r)}">Open Dev Info</button>`:""}
        </div>
        ${l.message?`<p class="slimeshield-muted">Source refresh: ${i(l.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(U=>`<li><span>${i(U)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${gp(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${gp(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${i(gw(s.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${i(bw(s.protectedBuyPreset))}</small>
      </section>
      ${$w(r)}
      <div class="slimeshield-drawer-actions">
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-preset="${i(s.protectedBuyPreset||el(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${i(r)}" ${p?"disabled":""}>${p?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${i(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${n.slimeShieldStatus?`<small class="slimeshield-status">${i(n.slimeShieldStatus)}</small>`:""}
    </aside>
  `;fr(e,et,".slimeshield-drawer")}function cl(e){const t=e==="bundle"?"bundle":"trade";n.activeTab=t,t==="trade"&&(n.editingTradePresetId=""),t==="bundle"&&(n.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function Yk(e){if(!e?.tokenMint)return O("No token selected","Click any row to preview it here without leaving the live feeds.");const t=rt().some(a=>String(a.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${pt(e)}
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
      <div><dt>${_("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${i(_("slimeShieldEnabled",!0)?Qe(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${hp(e)}
    <div class="card-actions compact">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${dn(e)?`<a href="${i(dn(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="token-preview">${i(va())}</button>
      <button data-quick-bundle-token="${i(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function Qk(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([a,r])=>`<button type="button" data-smart-chart-view="${a}" data-active="${e===a}">${r}</button>`).join("")}
    </div>
  `}function Aw(e=""){const t=String(e||"").trim();return t?(n.pnl?.trades||[]).filter(a=>String(a?.tokenMint||a?.mint||"").trim()===t):[]}function Zk(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Aw(a),o=!!(dn(e)&&Ui(e)),s=o?dn(e):e.dexUrl||Q(_d(e)||a),c=o?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${i(c)} Transactions</h4>
          <p>Live market activity from ${i(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${i(s)}" target="_blank" rel="noreferrer">Open ${i(c)} Feed</a>
      </div>
      ${Yi(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${dl(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function e0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Tm(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${i(e.symbol||w(a))}.</p>
        </div>
      </div>
      ${Yi(e,"info")}
      ${ap(e)}
      ${hp(e)}
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
        ${Eo(e)}
      </div>
    </section>
  `}function Pw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=n.chartTradeTab==="sell"?"sell":"buy",o=le(),s=n.wallets?.length?String(n.wallets[0]?.index||""):"",c=yd(),l=lt(),u=l?.walletIndex||(l?.walletIndexes||[])[0]||"",d=o?.publicKey&&vd(o)?"connected":"",p=n.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||s||(o?.publicKey?"connected":""),f=ce(p),y=n.quickBuyAmountOverride||He(l)||"",g=l?pn("trade"):"No preset / manual",S=String(l?.slippageBps||"400"),P=String(l?.takeProfitPct||"25"),T=String(l?.stopLossPct||"8"),b=String(l?.sellDelay||"off"),A=String(l?.sellPercent||"100"),C=new Set(["300","400","500"]),M=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,q=t?`${i(t.uiAmount||"Position")} tokens | ${i(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${an(p)}
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
              ${st("trade",n.selectedTradePresetId)}
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
              ${_t({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${_t({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Xe("chart-buy-delay","data-chart-buy-delay",b)}
            </label>
            <label>
              Exit Size
              ${_t({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:A,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${i(o?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:s?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
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
  `}function t0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim();return a?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${i(a)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${_("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${i(a)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function Cw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=ut(e),o=dt(e),s=y=>{const g=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(g)?"":g},c=N(r>0?B(r):"",s(e.marketCapLabel),s(e.fdvLabel),"checking"),l=N(o>0?B(o):"",s(e.liquidityLabel),"checking"),u=N(Number(e.volumeH1)>0?B(e.volumeH1):"",s(e.volumeH1Label),s(e.volumeLabel),"checking"),d=N(Number(e.volumeH24)>0?B(e.volumeH24):"",s(e.volumeH24Label),"checking"),p=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,g=Number(e.h1);return o>0&&o<5e3?"Thin exit":Number.isFinite(g)&&g>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(g)||g>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&o>0?"Clean setup":""})(),f=t?"Position held":p||(Ui(e)?"Pump curve":N(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${i(w(a))}</strong></span>
      <span><small>MC / FDV</small><strong>${i(c)}</strong></span>
      <span><small>LIQ</small><strong>${i(l)}</strong></span>
      <span><small>1H</small><strong>${i(u)}</strong></span>
      <span><small>24H</small><strong>${i(d)}</strong></span>
      <span><small>Status</small><strong>${i(f)}</strong></span>
    </div>
  `}function Lw(){try{return xw()}catch(e){console.error("Smart Chart render failed:",e);const t=String(n.smartChartToken||n.tradeToken||n.terminalToken||"").trim(),a=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
    `}}function xw(){const e=Bo(),t=String(e?.tokenMint||"").trim(),a=t?rt().find(s=>String(s.tokenMint)===t):null,r=t?be([e,...or().filter(s=>String(s.tokenMint||"")===t)]).filter(Boolean).slice(0,5):ya(cr(),5,ba("smart-chart-suggest"),1);if(!t)return`
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
          ${St(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:ba("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;ra("tokenHeaderRendered"),ra("chartSkeletonRendered"),ra("buyPanelReady"),W({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(Ye(t)?.cacheHit||lr(t)?.pairAddress),stale:!!Ye(t)?.stale,details:t});const o=e.symbol||e.shortMint||w(t);return`
    <section class="smart-chart-terminal smart-chart-clean-terminal">
      <div class="terminal-title-row smart-chart-clean-title">
        <div>
          <h3>${i(o)} Chart</h3>
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
          ${(()=>{Mw(t);const s=$p(t);return s?`<div class="coin-banner-hero" style="background-image:url('${s}')" role="img" aria-label="Coin banner"></div>`:""})()}
          <div class="smart-chart-token-header smart-chart-clean-token-header${$p(t)?" has-banner":""}">
            ${pt(e)}
            <div>
              <strong>${i(o)}</strong>
              <small>${i(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${i(t)}">${i(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${Eo(e)}
            </div>
          </div>
          ${Cw(e,a)}
          ${Yi(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${i(o)}</h3>
          ${Pw(e,a)}
        </aside>
      </div>
      ${Rw(t)}
    </section>
  `}function $p(e){const t=String(e||"").trim();return n.coinBanners&&n.coinBanners[t]||""}let Tp="";function Mw(e){const t=String(e||"").trim();!t||Tp===t||(Tp=t,k(`/api/web/coin-banner?mint=${encodeURIComponent(t)}`).then(a=>{const r=String(a?.bannerUri||"");r&&(n.coinBanners=n.coinBanners||{},n.coinBanners[t]=ot(r),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0}))}).catch(()=>{}))}let ul="",Ap=0;function Pp(e){e&&(ul===e&&Date.now()-Ap<3e4||(ul=e,Ap=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{n.chartCalls={mint:e,...t},n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function Bw(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[a,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${a} ${r}`}function Rw(e){Pp(e);const t=n.chartCalls?.mint===e?n.chartCalls:null,a=t?.calls||[],r=!!(n.token&&n.user);return`
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
          ${a.map(o=>`
            <article class="row-card">
              <div class="row-main">
                <strong>${i(Bw(o.side))} <span class="muted-text">by ${i(o.handle)}</span>
                  ${o.reputation?.wins?`<span class="positive">${i(String(o.reputation.wins))}W${o.reputation.hitRatePct!=null?` ${i(String(o.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${o.entryMcUsd?`Entry MC ${i(B(o.entryMcUsd))} | `:""}${o.targetX?`Target ${i(String(o.targetX))}x | `:""}${o.shieldVerdict?`Shield ${i(o.shieldVerdict)} ${i(String(o.shieldScore??""))} | `:""}${i(we(o.createdAt))}</span>
                ${o.note?`<small>${i(o.note)}</small>`:""}
                ${o.status==="resolved"?`<small class="${o.outcome==="won"?"positive":"negative"}">${o.outcome==="won"?`✅ hit ${i(String(o.peakX))}x`:i(o.outcome)}</small>`:o.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${i(o.mint)}" data-quick-buy-source="call-board">${i(va())}</button>
                <button data-watch-token="${i(o.mint)}" data-watch-symbol="${i(o.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${i(Ka(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ge(`$${n.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function Iw(e){const t=m("[data-call-status]");try{const a=m("[data-call-side]")?.value||"bullish",r=m("[data-call-target]")?.value||"",o=m("[data-call-note]")?.value||"";v(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:a,targetX:r,note:o,source:"site"})}),v(t,"Call posted - it is now being tracked."),ul="",Pp(e)}catch(a){v(t,D(a?.message||"Could not post call."))}}function Ow(e,t=!1){const a=e?.tokenMint?n.positions.find(s=>String(s.tokenMint)===String(e.tokenMint)):null,r=pn("trade"),o=pn("bundle");return t?`
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
              <small>${i(o)}</small>
            </summary>
            <label>
              Trade Preset
              <select data-fast-trade-preset="terminal">
                ${st("trade",n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${st("bundle",n.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${Et().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${i(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${i(va())}</button>
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
          <small>${i(jr())}</small>
        </div>
    </article>
  `}function Ew(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,a])=>`<button data-terminal-subtab="${t}" data-active="${n.terminalSubtab===t}">${a}</button>`).join("")}
      </div>
      ${Fw()}
    </section>
  `}function Fw(){if(n.terminalSubtab==="orders")return xp();if(n.terminalSubtab==="history")return dl(12);if(n.terminalSubtab==="wallets")return Nd();if(n.terminalSubtab==="kol"){const e=Xd(n.kolScan?.rows||[]).filter(t=>!ir(t));return St(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:ba("bottom-kol"),stickyCount:1})}return n.terminalSubtab==="sniper"?n.scan?ct(n.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):O("No sniper scan loaded","Open Sniper or refresh a scan mode."):n.terminalSubtab==="tx"?Bp(!0):n.terminalSubtab==="reconcile"?Mp():Ww(6)}function Ww(e=25){const t=rt();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(Lp).join("")}
    </div>
  `:O("No open positions","Open token holdings will show here after refresh.")}const Cp=new Map;function Nw(e){const t=String(e.tokenMint||"");if(!t)return"";const a=(n.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=sr().find(d=>String(d?.tokenMint||"")===t),o=(Array.isArray(n.tradePlans)?n.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),s=[];a?.spentSol&&s.push(`Entry ${a.spentSol} SOL`),r?.marketCapLabel&&s.push(`MC ${r.marketCapLabel}`),s.push(o?`TP ${o.takeProfitSummary||o.takeProfitPct||"off"} / SL ${o.stopLossSummary||o.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let l="";if(Number.isFinite(c)){const d=Cp.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const p=c-d.value;l=`${p>0?"▲ +":"▼ "}${p.toFixed(4)} SOL since last refresh`}Cp.set(t,{value:c,at:Date.now()})}let u="";if(o){const d=Number(o.lastMovePct??o.wallets?.[0]?.lastMovePct),p=Number(o.takeProfitPct),f=Number(o.stopLossPct),y=Date.parse(o.sellAfterAt||o.wallets?.[0]?.sellAfterAt||""),g=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(p)&&p>0&&d>=p*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${p}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:g!==null&&g>0&&g<=10?u=`Timer exit in ~${g} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else Db(t)||e.source==="launch-optimistic"?u="⏳ Exits arming from your launch - TP/SL/timer registering...":u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${i(s.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${i(u)}</small>`:""}
    ${l?`<small class="${l.startsWith("▲")?"positive":"negative"}">${i(l)}</small>`:""}
  `}function Lp(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",a=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),o=!!(e.viewOnly||e.source==="connected-wallet"),s=t?`${e.estimatedValueSol} SOL`:r?"updating":o?"tracking":"Price unavailable",c=a?e.openPnlSol:r?"updating":o?"realized only":"Price unavailable",l=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:o&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${pt(e)}
      <div class="row-main">
        <strong>${i(e.symbol||e.shortMint)}</strong>
        <span>${i(e.uiAmount)} tokens across ${i(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${i(e.name)}</small>`:""}
        <small>Value: ${i(s)} | PnL: ${i(c)}</small>
        ${Nw(e)}
        ${l?`<small class="${r?"muted-text":"warning-text"}">${i(l)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${i(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${i(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${i(e.tokenMint)}">Custom %</button>
        ${Ge(fg(e))}
        <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function dl(e=10,t=null){const a=Array.isArray(t)?t:n.pnl?.trades||[];return a.length?`
    <div class="live-trade-list">
      ${a.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${i(String(r.type||"").toUpperCase())} ${i(r.shortMint||w(r.tokenMint))}</strong>
          <span>${i(r.walletLabel||"wallet")} | ${i(r.solAmount||"0")} SOL</span>
          <small>${i(we(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${i(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="live-trades">${i(va())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:O("No live trade history yet","Submitted web trades will appear here after refresh.")}function Dw(){const e=n.pnl?.trades||[],t=nt("liveTrades",e);return`
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
        ${dl(t.length||Xa("liveTrades"),t)}
        ${la("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${Ow(Dd())}
      </aside>
    </section>
  `}function xp(){const e=Array.isArray(n.tradePlans)?n.tradePlans:[],t=[n.tradePlanResult,n.bundleResult,n.volumeResult,n.sniperResult,n.kolResult,n.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),a=e.length?e:t;return a.length?`
    <div class="table-list compact-table">
      ${a.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${i(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${i(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${i(r.status||"watching")} | Active wallets: ${i(r.activeWallets??"?")}/${i(r.walletCount??"?")} | TP ${i(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${i(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${i(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${i(we(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${i(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(_w).join("")}</div>`:""}
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
  `:O("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function _w(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",a=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,o=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",s=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Hn(Ya(e.retryAfterAt))}`:"",l=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",p=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${i(e.label||"Wallet")}</strong>
        <span>${i(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${i(a)}${e.triggerKind?` / ${i(e.triggerKind)}`:""}</span>
        <small>Move ${i(o)}${i(s)} | checked ${i(Hn(Ya(t)))}${i(c)}</small>
        <small>${i(u)} | ${i(d)} | ${i(p)} | Source: ${i(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${i(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${i(e.sellSignature)}</small>`:""}
        ${l?`<small class="warning-text">Error: ${i(l)}</small>`:""}
      </div>
    </div>
  `}function Mp(){const e=n.balances.filter(a=>a.error),t=n.balances.reduce((a,r)=>a+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${i(Hn(Ya(n.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(a=>`<article class="row-card"><strong>${i(a.label||`Wallet ${a.index}`)}</strong><span>${i(a.error)}</span></article>`).join("")}
      </div>
    `:O("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Bp(e=!1){const t=n.terminalTxAudit;return`
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
        ${t?Uw(t):O("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${xp()}${Mp()}</aside>`}
    </section>
  `}function Uw(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${i(e.error)}</span></article>`:`
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
  `}function qw(e=[]){const t=[...e].sort((a,r)=>Number(r.bestPickScore||r.score||0)-Number(a.bestPickScore||a.score||0)||Ze(a,r));return ya(t,5,ba("cooks-best"),1)}function Te(e){const t=Number(e);return Number.isFinite(t)?t:0}function Rp(){const e=n.liveFeedCategory||"best";return Ws.find(([t])=>t===e)||Ws[0]}function $a(e={}){return Yo(e)||Dp(e)||gl(e)||0}function pl(e={}){return Te(e.buys5m)+Te(e.buysH1)+Te(e.sells5m)+Te(e.sellsH1)}function Ip(e={}){const t=Te(e.buys5m)+Te(e.buysH1),a=Te(e.sells5m)+Te(e.sellsH1),r=t+a;return r>0?t/r:.5}function gr(e={}){return Math.max(Te(e.m5),Te(e.h1),Te(e.h24))}function Go(e={}){return Math.max(Te(e.m5),Te(e.h1))}function Ht(e={}){return Go(e)*Math.log10(10+$a(e))*(.5+Ip(e))}function ml(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function Hw(e=[],t="best"){const a=[...e];switch(t){case"volume":return a.sort((r,o)=>$a(o)-$a(r));case"liquidity":return a.sort((r,o)=>dt(o)-dt(r));case"marketcap":return a.sort((r,o)=>ut(o)-ut(r));case"active":return a.sort((r,o)=>pl(o)-pl(r));case"fresh":return a.sort(Ze);case"gainers":return a.sort((r,o)=>gr(o)-gr(r));default:return a.sort((r,o)=>Te(o.bestPickScore||o.score)-Te(r.bestPickScore||r.score)||Ze(r,o))}}function Kw(){const e=n.liveTerminalCategory||"dexTrending";return qa.find(([t])=>t===e)||qa[0]}function Vw(e,t,a,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${i(r)}</span>
      <select ${a} aria-label="${i(r)} category">
        ${e.map(([o,s])=>`<option value="${o}"${o===t?" selected":""}>${i(s)}</option>`).join("")}
      </select>
    </label>`}function zw(){if(n.activeTab==="terminal"){const t=Kw();return{categories:qa,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:a=>Fp(a,t[0]),hasBest:!1}}const e=Rp();return{categories:Ws,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>Hw(t,e[0]),hasBest:e[0]==="best"}}function jw(e={}){if(ml(e))return{cls:"boost",text:"⚡ Boosted"};const t=gr(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const a=Number(e.pairAgeMinutes);return Number.isFinite(a)&&a>=0&&a<=10?{cls:"fresh",text:"✨ Fresh"}:Go(e)>=25?{cls:"hot",text:"🔥 Hot"}:Ip(e)>=.7&&pl(e)>=24?{cls:"active",text:"● Active"}:null}function fl(e={}){const t=jw(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${i(t.text)}</span>`:""}function Op(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function Gw(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return Op(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Ep(){const e=n.cookSpotCategory||"dexTrending";return qa.find(([t])=>t===e)||qa[0]}function Fp(e=[],t="dexTrending"){const a=[...e];switch(t){case"fresh":return a.sort(Ze);case"dexBoosted":{const r=a.filter(ml).sort((s,c)=>$a(c)-$a(s)),o=a.filter(s=>!ml(s)).sort((s,c)=>Ht(c)-Ht(s));return[...r,...o]}case"pumpTrending":{const r=a.filter(Op);return(r.length?r:a).sort((o,s)=>Ht(s)-Ht(o))}case"memeMovers":{const r=a.filter(Gw);return(r.length?r:a).sort((o,s)=>gr(s)-gr(o))}case"earlyMomentum":{const r=a.filter(o=>{const s=Number(o.pairAgeMinutes);return!Number.isFinite(s)||s<=180});return(r.length?r:a).sort((o,s)=>Go(s)-Go(o))}case"graduating":{const r=a.filter(o=>_o(o)||Uo(o)==="graduating");return(r.length?r:a).sort((o,s)=>Ht(s)-Ht(o))}case"graduated":{const r=a.filter(o=>gn(o)||Uo(o)==="graduated");return(r.length?r:a).sort((o,s)=>$a(s)-$a(o))}default:return a.sort((r,o)=>Ht(o)-Ht(r))}}function Xw(e=Ep()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${qa.map(([a,r])=>`<option value="${a}"${a===t?" selected":""}>${i(r)}</option>`).join("")}
      </select>
    </label>`}function Wp(e=0,t=""){const a=Ya(t),r=a===null?"live":Hn(a);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${i(r)}</span></div>`}function hl(e=[]){const t=zw(),a=Vw(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',o=Wp(e.length,ca()),s={context:"live",shareBuilder:Ta,hideToolbar:!0};if(t.hasBest){const l=qw(e),u=new Set(l.map(ga).filter(Boolean)),d=[...e].sort(Ze).filter(f=>!u.has(ga(f))),p=nt("live",d);return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>Top ${l.length} · rotating each refresh</span>${r}</div>
        ${l.length?ct(l,s):O("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${p.length?ct(p,s):O("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=nt("live",t.rank(e));return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>${i(t.sub)}</span>${r}</div>
        ${c.length?ct(c,s):O("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function Np(){const e=Ne(),t=be(e?.rows||[]),a=fn(t),r=nt("live",a),o=Mt.find(([f])=>f===n.livePairBucket)?.[1]||"Live",s=ca(),c=!!n.livePairsLoadingByBucket[n.livePairBucket],l=mn(),u=n.livePairsRefreshErrorByBucket?.[n.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",p=a.length?hl(a):l?pr(t,`${o.toLowerCase()} pairs`):u?O("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?O("Loading live pairs…","Scanning fresh pairs for this time window."):O("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Mt.map(([f,y])=>{const g=n.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(g))?` (${g})`:"";return`<button data-live-pair-bucket="${f}" data-active="${n.livePairBucket===f}">${y}${S}</button>`}).join("")}
        </div>
        ${al("live",{rawCount:t.length,visibleCount:a.length})}
        ${tl(t,a)}
        ${xi("live")}
        ${p}
        ${la("live",a,`${o} pairs`)}
      </main>
    </section>
  `}function a0(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function Jw(){if(!n.user||!n.token)return`${Za()}${O("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=n.watchlist?.rows||[],t=nt("watchlist",e);return`
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
        ${t.length?ct(t,{context:"watchlist",shareBuilder:a=>vi(a.tokenMint)}):O("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
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
  `}function n0(e){return ct(e,{context:"live",shareBuilder:Ta})}function ct(e,t={}){const a=t.shareBuilder||Ta,r=be(e),o=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":xi(t.context||"scanner")}
    <div class="${i(o)}">
      <div class="signal-header">
        <span>Pair Info</span>
        <span>Age</span>
        <span>Current Liquidity</span>
        <span>FDV / MC</span>
        <span>Txns</span>
        <span>Volume</span>
        <span>Action</span>
      </div>
      ${r.map((s,c)=>Yw(s,c,{...t,shareText:a(s),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":xi(t.context||"scanner")}
      ${O(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function Yw(e,t,a={}){const r=Xo(e.tokenMint),o=a.shareText||Ta(e),s=a.primaryActionLabel||"Trade",c=a.primaryAction||"quickTrade",l=a.context==="kol",u=a.context==="watchlist"?`<button type="button" data-unwatch-token="${i(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(Jo(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-row")}">
      <div class="signal-token">
        ${pt(e,{priority:!!a.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-title")}">${i(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${i(e.name||e.category||"Token")}</small>
            ${l?"":fl(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${i(e.tokenMint)}">${i(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${i(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${i(o)}" title="Share to X">SHARE</button>
            ${Tu(o,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(e.sniperCount)}</span>`:""}
          </div>
          ${Gv(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${i(e.pairAgeLabel||Kt(e)||"age unknown")}</span><small>${i(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${i(N(e.liquidityLabel,dt(e)>0?B(dt(e)):"","checking"))}</span><small>${Qw(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${i(N(e.marketCapLabel,ut(e)>0?B(ut(e)):"","checking"))}</span><small>${i(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${i(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${i(Vv(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${i(N(e.volumeH1Label,e.volumeLabel,Yo(e)>0?B(Yo(e)):"","checking"))}</span>
        <small>${Zd(e).map(([d,p])=>`${d} ${p}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${i(e.tokenMint)}" title="Snipe buy">${i(s)}</button>`:`<button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(a.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(a.context||"signal-row")}" title="Quick buy with preset or custom SOL">${i(va())}</button>`}
        <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${l?cd(e):""}
        ${u}
        ${Qd(e)}
      </div>
    </article>
  `}function Xo(e){const t=String(e||"");return!!(n.watchlist?.rows||[]).some(a=>String(a.tokenMint)===t)}function Kt(e){const t=Do(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function Qw(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const a=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${a}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function Jo(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{},s=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,a.imageUrl,a.image,a.logoURI,a.logo,a.iconUrl,a.info?.imageUrl,a.baseToken?.imageUrl,a.baseToken?.logoURI,o.imageUrl,o.image,o.logoURI,o.logo,s.imageUrl,s.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const l of c){const u=ot(l);if(u)return u}return""}function ut(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{};return E(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,a.marketCap,a.marketCapUsd,a.market_cap,a.fdv,a.fdvUsd,a.baseToken?.marketCap,a.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,o.marketCap,o.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function dt(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.liquidity||{};return E(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,o.usd,o.quote,a.liquidityUsd,a.liquidity_usd,a.liquidity?.usd,a.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function gl(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return E(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,o.m15,o.m15m,o.m5,o.h1,a.volume?.m15,a.volume?.m5,a.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Yo(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return E(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,o.h1,o.m30,o.m15,a.volume?.h1,a.volume?.m30,a.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function Dp(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return E(e.volumeH24,e.volume24h,e.volume_h24,o.h24,o.d1,a.volume?.h24,a.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function pt(e,t={}){const a=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=Jo(e),o=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),s=`token:${String(o||e.symbol||a).trim().toLowerCase()}`,c=_("tokenAvatarFixEnabled",!0),l=String(e.avatarState||"").trim().toLowerCase(),u=l==="missing"||l==="failed",d=!!e.avatarUrl&&(!l||l==="ready"),p=o&&!u?ot($g(e)):"",f=c?Si(s,d?e.avatarUrl:"",p,u?"":r):Si(s,p,r),y=c&&!u?p&&f!==p?p:r&&r!==f?r:"":"",g=!!t.priority,S=g?"eager":"lazy",P=g?"high":"low",T=l||(f?"ready":"missing");if(f){const b=y?` data-backup-src="${i(y)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${i(T)}"><img src="${i(f)}"${b} data-avatar-src="${i(f)}" data-avatar-key="${i(s)}" alt="${i(e.symbol||e.name||"Token")}" loading="${S}" decoding="sync" fetchpriority="${P}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${i(a)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${i(T)}"><span>${i(a)}</span></div>`}function Zw(e=""){const t=String(e||"");let a=0;for(let r=0;r<t.length;r+=1)a+=t.charCodeAt(r);return a%5+1}function bl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${Zw(e)}.png`}function Ta(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Kt(e)||"age unknown"}.`}function eS(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([a])=>a===n.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${i(tS(n.scanMode))}</p>
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
        ${n.scan?rS():O("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${aS()}
      </aside>
    </section>
  `}function tS(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function aS(){if(!n.wallets.length)return O("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=n.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${vt("sniper")}
        </div>
        ${Dt("sniper")}
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
            ${eo("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:ao("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${nn({toolKey:"sniperSetup",activeKey:rn("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${n.sniperResult?i(n.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${nS()}
    </section>
  `}function nS(){const e=n.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function rS(){const e=n.scan.rows||[],t=nt("sniper",e);return e.length?`
    <p class="scan-meta">${i(n.scan.label)} | ${t.length}/${e.length} shown | scored ${n.scan.scanned} | qualified ${n.scan.qualified} | mode-fit ${n.scan.modeFit} | display pool ${n.scan.displayPool||0}</p>
    ${ct(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:hg})}
    ${la("sniper",e,"snipe candidates")}
  `:O("No usable picks","Refresh again or choose a different mode.")}function Qo(){return n.user?.connectedWallet?.publicKey||""}function _p(){return n.ogreTek.markets.find(e=>e.symbol===n.ogreTek.selectedMarket)||n.ogreTek.markets[0]||null}function oS(){return{marketSymbol:n.ogreTek.selectedMarket,direction:n.ogreTek.direction,orderType:n.ogreTek.orderType,collateralUsd:n.ogreTek.collateralUsd,leverage:n.ogreTek.leverage,slippagePct:n.ogreTek.slippagePct,priorityFeeLamports:n.ogreTek.priorityFeeLamports,limitPrice:n.ogreTek.limitPrice,stopPrice:n.ogreTek.stopPrice}}function Up(){return $m(oS(),_p(),n.ogreTek.account,ke)}function ve(e,t=2){const a=Number(e);return Number.isFinite(a)?Math.abs(a)>=1e9?`$${(a/1e9).toFixed(2)}B`:Math.abs(a)>=1e6?`$${(a/1e6).toFixed(2)}M`:Math.abs(a)>=1e3?`$${(a/1e3).toFixed(1)}K`:`$${a.toFixed(t)}`:"n/a"}function mt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function Zo(e,t=3){const a=Number(e);return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(t)}%`:"n/a"}function qp(e){const t=Date.parse(e||"");if(!t)return"not loaded";const a=Math.max(0,Math.round((Date.now()-t)/1e3));return a<60?`${a}s ago`:`${Math.round(a/60)}m ago`}function es(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in n.ogreTek)||(e.type==="checkbox"?n.ogreTek[t]=!!e.checked:n.ogreTek[t]=e.value)})}async function sS(){!ke.enabled||n.ogreTek.loading||n.ogreTek.markets.length||n.ogreTek.error||await br({silent:!0}).catch(e=>{n.ogreTek.error=D(e.message),h({force:!0})})}async function br({force:e=!1,silent:t=!1}={}){if(ke.enabled&&!(n.ogreTek.loading&&!e)){n.ogreTek.loading=!0,n.ogreTek.error="",t||h({force:!0});try{const a=Qo(),[r,o,s,c]=await Promise.all([wr.getMarkets(),wr.getAccount(a),wr.getPositions(a),wr.getOpenOrders(a)]);n.ogreTek.markets=r||[],n.ogreTek.account=o||null,n.ogreTek.positions=s||[],n.ogreTek.orders=c||[],n.ogreTek.markets.some(l=>l.symbol===n.ogreTek.selectedMarket)||(n.ogreTek.selectedMarket=n.ogreTek.markets[0]?.symbol||"SOL-PERP"),n.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(a){n.ogreTek.error=D(a.message)}finally{n.ogreTek.loading=!1,h({force:!0})}}}function iS(){return`
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
  `}function lS(){if(wm(ke)!=="enabled")return iS();const e=!!Qo(),t=_p(),a=Up(),r=a.quote,o=n.ogreTek.account,s=a.ok&&!n.ogreTek.loading,c=n.ogreTek.error?"Provider Error":n.ogreTek.loading?"Loading":"Ready",l=ke.demoMode?"Review Demo Trade":"Review Trade",u=ke.demoMode?"Confirm Demo Review":"Confirm Order",d=ke.demoMode?!n.ogreTek.riskAccepted||!a.ok:!ym({validation:a,riskAccepted:n.ogreTek.riskAccepted,demoMode:ke.demoMode});return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${ke.demoMode?"Demo Mode":"Live Adapter"}</span>
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
            ${cS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${n.ogreTek.positions.length} open</span>
            </div>
            ${dS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${pS()}
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
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${i(ke.maxLeverage)}" step="0.5" value="${i(n.ogreTek.leverage)}">
                <span>${i(n.ogreTek.leverage)}x max ${i(ke.maxLeverage)}x</span>
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
            ${uS(r,t)}
            ${Hp(a)}
            <button class="primary" type="button" data-ogre-tek-review ${s?"":"disabled"}>${i(l)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${mS(o)}
          </article>
        </aside>
      </section>
      ${n.ogreTek.reviewOpen?fS({validation:a,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function cS(){return n.ogreTek.loading&&!n.ogreTek.markets.length?O("Loading markets","Ogre Tek is loading demo perps markets."):n.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${n.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${i(e.symbol)}" data-active="${e.symbol===n.ogreTek.selectedMarket}">
          <span>${i(e.symbol)}</span>
          <strong>${mt(e.indexPrice)}</strong>
          <small>Oracle ${mt(e.oraclePrice)} | 24h ${Zo(e.change24hPct,2)}</small>
          <small>Funding ${Zo(e.fundingRatePct,3)} | OI ${ve(e.openInterestUsd,0)}</small>
          <small>Fresh ${i(qp(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:O("No markets available","No allowed perps markets are available for this provider.")}function uS(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${mt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${ve(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${mt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${ve(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${ve(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${ve(e?.maxLossUsd)}</strong></span>
    </div>
  `}function Hp(e){const t=e.errors||[],a=e.warnings||[];return!t.length&&!a.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${i(r)}</p>`).join("")}
      ${a.map(r=>`<p data-kind="warning">${i(r)}</p>`).join("")}
    </div>
  `}function dS(){return Qo()?n.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${n.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.side)} | margin ${Zo(e.marginRatioPct,1)}</small></span>
          <span>${ve(e.sizeUsd)}<small>collateral ${ve(e.collateralUsd)}</small></span>
          <span>${mt(e.entryPrice)}<small>mark ${mt(e.markPrice)}</small></span>
          <span>${mt(e.liquidationPrice)}</span>
          <span data-positive="${Number(e.unrealizedPnlUsd)>=0}">${ve(e.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `:O("No open positions","Mock positions will appear here when the provider reports them."):O("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function pS(){return Qo()?n.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${n.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.type)} ${i(e.side)}</small></span>
          <span>${mt(e.triggerPrice)}</span>
          <span>${ve(e.sizeUsd)}</span>
          <span>${i(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:O("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):O("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function mS(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${ve(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${ve(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${ve(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${i(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${ve(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${i(e.maxLeverageAllowed||ke.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${i(qp(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function fS({validation:e,quote:t,market:a,confirmButtonText:r,confirmDisabled:o}){const s=e.order||{};return`
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
          <span><small>Direction</small><strong>${i(s.direction||"long")}</strong></span>
          <span><small>Market</small><strong>${i(s.marketSymbol||a?.symbol||"n/a")}</strong></span>
          <span><small>Collateral</small><strong>${ve(s.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${i(s.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${mt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${mt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${ve(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${Zo(a?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${ve(t?.maxLossUsd)}</strong></span>
        </div>
        ${Hp(e)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${n.ogreTek.riskAccepted?"checked":""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${o?"disabled":""}>${i(r)}</button>
        </div>
      </article>
    </div>
  `}function Kp(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const yl="slimewire:ogreAgentMessages:v1",vl="slimewire:ogreAgentLastToken:v1";function hS(){try{const e=JSON.parse(localStorage.getItem(yl)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function gS(){try{localStorage.setItem(yl,JSON.stringify(yn().slice(-50)))}catch{}}function Vt(){if(n.ogreAgentLastTokenMint)return String(n.ogreAgentLastTokenMint);try{n.ogreAgentLastTokenMint=String(localStorage.getItem(vl)||"").trim()}catch{n.ogreAgentLastTokenMint=""}return n.ogreAgentLastTokenMint||""}function ts(e=""){const t=String(e||"").trim();if(!t)return"";n.ogreAgentLastTokenMint=t;try{localStorage.setItem(vl,t)}catch{}return t}function yn(){if(!Array.isArray(n.ogreAgentMessages)||!n.ogreAgentMessages.length){const e=hS();n.ogreAgentMessages=e.length?e:[Kp()]}return n.ogreAgentMessages}function bS(){const e=String(n.smartChartToken||n.tradeToken||Vt()||"").trim(),t=e?wa(e):null,a=t?.tokenMint?Qe(t):null,r=e?yp(e):null,o=e?sl(e):null,s=uo().slice(0,3),c=e?rt().find(l=>String(l.tokenMint||"")===e):null;return{route:n.route,activeTab:n.activeTab,agentFastMode:n.ogreAgentFastMode,agentAutoTradeApproved:os(),lastTokenMint:Vt(),recentAgentMessages:yn().slice(-8).map(l=>({role:l.role==="user"?"user":"assistant",text:String(l.text||"").slice(0,600)})),smartChartToken:n.smartChartToken||"",tradeToken:n.tradeToken||"",livePairBucket:n.livePairBucket||"",slimeScopeMode:n.slimeScopeMode||"",walletConnected:!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey),walletCount:oi(),positionCount:rt().length,totalSol:Et().toFixed(4),selectedTradePreset:pn("trade"),selectedBundlePreset:pn("bundle"),quickBuyAmount:String($l()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:Xo(e)}:null,slimeShield:a?{verdict:a.verdict,summary:a.summary,confidence:a.confidence,suggestedAction:a.suggestedAction,topFactors:(a.factors||[]).slice(0,4).map(l=>l.message||l.label||l.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:s.length?s.map(l=>({displayName:l.displayName,riskLabel:l.riskLabel,dumpRiskPercent:l.lowData?null:l.dumpRiskPercent,lowData:!!l.lowData,summary:er(l)})):[],replayBeforeBuy:o?{sampleSize:o.sampleSize,confidence:o.confidence,winRatePercent:o.winRatePercent,medianMaxDrawdownPercent:o.medianMaxDrawdownPercent,summary:o.summary}:null,pnlSummary:{realized:zc(),positions:rt().length,totalSol:Et().toFixed(4)},profile:{hasReferralCode:!!n.user?.referralCode,referralCode:n.user?.referralCode||"",hasReferralPayoutWallet:!!n.user?.referralPayoutWallet,hasXHandle:!!(n.xHandle||n.user?.xHandle),traderBoardEnabled:n.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:Vp()}}function Vp(){const e=[],t=new Set,a=(r,o="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(l=>a(l,o));return}if(Array.isArray(r.rows)){r.rows.forEach(l=>a(l,o));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(l=>a(l,o));return}if(typeof r!="object")return;const s=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!s)return;const c=s.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:s,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:o}))};return a(n.livePairRows,"live-pairs"),a(n.slimeScopeRows,"slime-scope"),a(n.livePairs,"live-pairs"),Object.values(n.livePairsByBucket||{}).forEach(r=>a(r,"bucket")),Object.values(n.terminalFeeds||{}).forEach(r=>a(r,"terminal-feed")),e.sort((r,o)=>zp(o)-zp(r)).slice(0,24)}function zp(e={}){const t=T=>Number.isFinite(Number(T))?Number(T):0,a=t(e.ageMinutes),r=t(e.marketCap),o=t(e.liquidityUsd),s=t(e.volume5m),c=t(e.volume1h),l=Math.max(s,c*.18),u=a>0?Math.max(0,90-Math.min(a,360))/2.5:12,d=a>120?Math.min(42,(a-120)/4):0,p=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?l/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:l>0?2:-18,g=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+p+y+Math.log10(1+s+c)*7+Math.log10(1+o)*3+g+S-P-d}function yS(e={}){return String(e.label||e.type||"Run").slice(0,40)}function vS(e={},t=0){const a=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${i(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${i(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${a.length?`<div class="ogre-agent-actions">${a.map((o,s)=>`<button type="button" data-ogre-agent-action="${t}:${s}">${i(yS(o))}</button>`).join("")}</div>`:""}
    </div>
  `}function wS(){const e=!!(n.ogreAgentLoading||n.ogreAgentSpeaking),t=!!n.ogreAgentListening,a=!!n.ogreAgentVoiceEnabled;return`
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
  `}function SS(){const e=!!n.ogreAgentOpen,t=yn(),a=n.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=Jp(),o=n.ogreAgentListening?"Stop":"Mic";return`
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
        ${e?wS():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(vS).join("")}
          ${n.ogreAgentLoading?'<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>':""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL...">${i(n.ogreAgentDraft||"")}</textarea>
          <div class="ogre-agent-composer-actions">
            <button type="button" class="ogre-agent-mic ${n.ogreAgentListening?"is-listening":""}" data-ogre-agent-mic title="${r?"Tap, speak, and Ogre will send it.":"Tap to check microphone support."}">${i(o)}</button>
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
  `}function F({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const a=t.querySelector("[data-ogre-agent-input]"),r=!!(a&&document.activeElement===a),o=r?a.selectionStart:null,s=r?a.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),l=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;a&&(n.ogreAgentDraft=a.value);const d=Array.isArray(n.ogreAgentMessages)?n.ogreAgentMessages:[],p=d[d.length-1]||{},f=[n.ogreAgentOpen?"open":"closed",n.ogreAgentLoading?"loading":"idle",n.ogreAgentStatus||"",d.length,p.role||"",p.text||"",Array.isArray(p.actions)?p.actions.length:0,n.ogreAgentVoiceEnabled?"voice-on":"voice-off",n.ogreAgentSpeaking?"speaking":"silent",n.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=SS(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),rs()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=n.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),o!==null&&s!==null&&y.setSelectionRange(o,s),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const g=t.querySelector("[data-ogre-agent-feed]");g&&(e||u||n.ogreAgentLoading?g.scrollTop=g.scrollHeight:g.scrollTop=Math.min(l,Math.max(0,g.scrollHeight-g.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function ue(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};n.ogreAgentMessages=[...yn(),t].slice(-50),gS(),t.role==="assistant"&&Gp(t.text||"")}function wl(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function kS(){if(!wl())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=a=>{const r=`${a.name||""} ${a.voiceURI||""}`.toLowerCase(),o=String(a.lang||"").toLowerCase();let s=0;return(/^en[-_]/.test(o)||o==="en")&&(s+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(s+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(s+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(s-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(s-=25),a.localService&&(s+=3),s};return e.slice().sort((a,r)=>t(r)-t(a))[0]||e[0]||null}let vn=null;function $S(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!vn||vn.state==="closed")&&(vn=new e),vn.state==="suspended"&&vn.resume(),vn}catch{return null}}function jp(e="reply"){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen)return;const t=$S();if(t)try{const a=t.currentTime,r=e==="online"?.22:.34,o=t.createGain(),s=t.createBiquadFilter(),c=t.createOscillator(),l=t.createOscillator(),u=t.createGain();o.gain.setValueAtTime(1e-4,a),o.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,a+.035),o.gain.exponentialRampToValueAtTime(1e-4,a+r),s.type="lowpass",s.frequency.setValueAtTime(210,a),s.frequency.exponentialRampToValueAtTime(92,a+r),s.Q.setValueAtTime(5.2,a),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,a),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,a+r),l.type="sine",l.frequency.setValueAtTime(e==="online"?45:38,a),l.frequency.exponentialRampToValueAtTime(e==="online"?35:31,a+r),u.gain.setValueAtTime(.18,a),u.gain.exponentialRampToValueAtTime(1e-4,a+r),c.connect(s),s.connect(o),l.connect(u),u.connect(o),o.connect(t.destination),c.start(a),l.start(a),c.stop(a+r+.02),l.stop(a+r+.02)}catch{}}function $t(e=!1){n.ogreAgentSpeaking=!!e,n.ogreAgentOpen&&F({force:!0})}function as(){if(!wl()){$t(!1);return}try{window.speechSynthesis.cancel()}catch{}$t(!1)}function TS(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function Gp(e=""){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen||!wl()){$t(!1);return}const t=TS(e);if(!t){$t(!1);return}try{window.speechSynthesis.cancel();const a=new window.SpeechSynthesisUtterance(t),r=kS();r&&(a.voice=r),a.pitch=.72,a.rate=.86,a.volume=1,a.onstart=()=>$t(!0),a.onend=()=>$t(!1),a.onerror=()=>$t(!1),$t(!0),jp("reply"),window.speechSynthesis.speak(a)}catch{$t(!1)}}function AS(e){n.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",n.ogreAgentVoiceEnabled?"on":"off")}catch{}n.ogreAgentVoiceEnabled?(n.ogreAgentStatus="Ogre voice on.",jp("online"),Gp("Ogre voice online.")):(as(),n.ogreAgentStatus="Ogre voice muted."),F({force:!0})}function Xp(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function Jp(){return!!Xp()}async function Yp(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function Qp(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();n.ogreAgentDraft=t;const a=document.querySelector("[data-ogre-agent-input]");if(a){a.value=t;try{a.focus({preventScroll:!0}),a.setSelectionRange(t.length,t.length)}catch{}}}function ns(){Zt&&(clearTimeout(Zt),Zt=null),Oa&&(clearTimeout(Oa),Oa=null)}function Zp(e,t=n.ogreAgentSpeechRecognizer){Oa&&clearTimeout(Oa),Oa=setTimeout(()=>{e!==tt||n.ogreAgentSpeechRecognizer!==t||zt("Mic timed out instead of staying open. Tap Mic again or type the command.")},_m)}function zt(e=""){tt+=1,ns();const t=n.ogreAgentSpeechRecognizer;if(n.ogreAgentSpeechRecognizer=null,n.ogreAgentListening=!1,n.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(n.ogreAgentStatus=e),n.ogreAgentOpen&&F({force:!0})}async function PS(){if(!Jp()){const s=await Yp();n.ogreAgentStatus=s==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",F({force:!0});return}n.ogreAgentLoading&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),as(),zt();const e=tt;n.ogreAgentStatus="Checking microphone permission...",F({force:!0});const t=await Yp();if(e!==tt||!n.ogreAgentOpen)return;if(t==="denied"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",F({force:!0});return}if(t==="unavailable"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="No microphone is available to this browser. Typing still works.",F({force:!0});return}const a=Xp(),r=new a,o=++tt;n.ogreAgentSpeechRecognizer=r,n.ogreAgentListening=!0,n.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||n.ogreAgentDraft||"").trim(),n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Opening microphone...",F({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Zt=setTimeout(()=>{o!==tt||n.ogreAgentSpeechRecognizer!==r||zt("Mic did not start. Check browser permission, then tap Mic again.")},Dm),r.onstart=()=>{o!==tt||n.ogreAgentSpeechRecognizer!==r||(Zt&&(clearTimeout(Zt),Zt=null),n.ogreAgentListening=!0,n.ogreAgentStatus="Listening... speak your Ogre command.",Zp(o,r),F({force:!0}))},r.onresult=s=>{if(o!==tt||n.ogreAgentSpeechRecognizer!==r)return;Zp(o,r);let c="",l="";for(let d=s.resultIndex||0;d<s.results.length;d+=1){const p=String(s.results[d]?.[0]?.transcript||"");s.results[d]?.isFinal?l+=` ${p}`:c+=` ${p}`}l.trim()&&(n.ogreAgentSpeechFinal=`${n.ogreAgentSpeechFinal||""} ${l}`.replace(/\s+/g," ").trim());const u=[n.ogreAgentSpeechBaseDraft,n.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();Qp(u)},r.onerror=s=>{if(o!==tt||n.ogreAgentSpeechRecognizer!==r)return;ns();const c=String(s?.error||"");n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",F({force:!0})},r.onend=()=>{if(o!==tt||n.ogreAgentSpeechRecognizer!==r)return;ns();const s=String(n.ogreAgentDraft||"").trim(),c=!!(s&&n.ogreAgentSpeechFinal&&!n.ogreAgentLoading);n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",F({force:!0}),c&&setTimeout(()=>{Qp(s),ft()},100)};try{r.start()}catch{ns(),n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic could not start. Typing still works.",F({force:!0})}}function CS(){n.ogreAgentListening||n.ogreAgentSpeechRecognizer?zt("Voice input stopped."):PS()}function rs(){n.ogreAgentOpen=!1,n.ogreAgentStatus="",n.ogreAgentLoading=!1,n.ogreAgentRequestId="",zt(),as(),F({force:!0})}function LS(e=""){const[t,a]=String(e).split(":");return yn()[Number(t)]?.actions?.[Number(a)]||null}function em(){return Array.isArray(n.wallets)&&n.wallets.length>0}function tm(){return!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.walletPublicKey||n.connectedWalletPublicKey)}function os(){return!!(!am()&&(n.ogreAgentAutoTradeApproved||em()||tm()))}function xS(e="wallet-sync"){return am()?!1:em()||tm()?(kl(!0),!0):(Sl(),!1)}function am(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Sl(){n.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function kl(e,t={}){n.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),n.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function nm(e){n.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",n.ogreAgentFastMode?"on":"off")}catch{}}function Tt(e=""){const t=String(e||"").toLowerCase(),a=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),o=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return a?"buy":r||o?"sell":""}function MS(e=""){const t=String(e||"").toLowerCase(),a=Tt(t);if(!a||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),o=a==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),s=!!(Vt()||n.smartChartToken||n.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||a==="buy"&&s&&/\b(just\s+)?buy\b/.test(t);return!!(o&&c&&!r)}function BS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return a?Number(a):0}function $l(){const e=typeof lt=="function"?lt():null,t=Number(n.quickBuyAmountOverride||(typeof He=="function"?He(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function RS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=o?Math.round(Number(o)*100):0,c=[];return a&&c.push(`TP +${a}%`),r&&c.push(`SL -${r}%`),o&&c.push(`slippage ${o}%`),{takeProfitPct:a,stopLossPct:r,slippagePct:o,slippageBps:Number.isFinite(s)&&s>0?s:0,summary:c.join(" / ")}}function IS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(\d{1,3})\s*%/)||[])[1];return a||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function OS(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function ES(){const e=[],t=(r={})=>{const o=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();o&&e.push({tokenMint:o,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};n.smartChartToken&&t({tokenMint:n.smartChartToken,symbol:n.smartChartTokenSymbol}),n.tradeToken&&t({tokenMint:n.tradeToken,symbol:n.tradeTokenSymbol}),[n.livePairRows,n.slimeScopeRows,n.watchlist,n.positions,n.portfolioRows,n.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const a=new Set;return e.filter(r=>{const o=r.tokenMint.toLowerCase();return a.has(o)?!1:(a.add(o),!0)})}function FS(e=""){const t=String(e||"").trim(),a=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(a)return a;const r=t.toLowerCase();return ES().map(s=>{const c=s.symbol.toLowerCase(),l=s.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),l&&r.includes(l)&&(u+=8+Math.min(16,l.length)),{...s,score:u}}).filter(s=>s.score>0).sort((s,c)=>c.score-s.score)[0]?.tokenMint||""}function ss(e={},t=""){const a={...e},r=Tt(t);if(!a.tokenMint&&!a.mint&&!a.ca){const o=FS(t)||Vt()||n.smartChartToken||n.tradeToken;o&&(a.tokenMint=o)}if(a.type==="confirm_buy"||r==="buy"){if(a.type=a.type||"confirm_buy",!a.amountSol){const s=BS(t)||$l();s>0&&(a.amountSol=s)}const o=RS(t);if(o.takeProfitPct&&!a.takeProfitPct&&(a.takeProfitPct=o.takeProfitPct),o.stopLossPct&&!a.stopLossPct&&(a.stopLossPct=o.stopLossPct),o.slippageBps&&!a.slippageBps&&(a.slippageBps=o.slippageBps),a.walletIndex===void 0){const s=OS(t);s!==void 0&&(a.walletIndex=s)}}return(a.type==="confirm_sell"||r==="sell")&&(a.type=a.type||"confirm_sell",a.percent=a.percent||IS(t)),a}function rm(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function om(e={},t=""){if(!n.ogreAgentFastMode||!os()||e.requiresReview||e.conditional)return!1;const a=Tt(t);return a?a==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:a==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function jt(e={}){const t=String(e.type||""),a=String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Vt()||"").trim();if(t==="toggle_agent_fast_mode"){nm(!n.ogreAgentFastMode),n.ogreAgentStatus=n.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",ue({role:"assistant",text:n.ogreAgentStatus,actions:[{label:n.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),F();return}if(t==="approve_agent_auto_trade"){kl(!0),nm(!0),n.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",ue({role:"assistant",text:`${n.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),F();return}if(t==="revoke_agent_auto_trade"){kl(!1,{revoked:!0}),n.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",ue({role:"assistant",text:n.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),F();return}if(t==="open_tab"){n.route="terminal",n.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!a){n.ogreAgentStatus="Paste a token CA in the message first.",F();return}wt(ge(a,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){n.route="terminal",n.activeTab="positions",window.history.pushState({},"","/terminal"),n.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){G(()=>yt({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Wallet refresh started.",F();return}if(t==="refresh_feeds"){G(()=>Ja({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Feed refresh started.",F();return}if(t==="open_wallet_connect"){da({returnPath:"/terminal"}),n.ogreAgentStatus="Wallet connect opened.",F();return}if(t==="start_clip_recording"){ou(),n.ogreAgentStatus="REC started from Ogre Agent.",F();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim();if(!r){n.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",F();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(n.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),ln(ge(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),n.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",F();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||n.smartChartToken||n.tradeToken||Vt()||"").trim(),o=Number(e.amountSol||e.sol||e.amount||$l()||0);if(!r||!Number.isFinite(o)||o<=0){r&&ln(ge(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),n.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",F();return}const s=e.walletIndex!==void 0?e.walletIndex:le()?.publicKey?"connected":n.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;n.ogreAgentLoading=!0,n.ogreAgentStatus=`Sending ${o} SOL buy request...`,F();try{const l=await Ao({tokenMint:r,walletIndex:s,amountSol:o,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});n.ogreAgentStatus=l?.ok===!1?l.error||l.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${rm(e)}`,typeof yt=="function"&&yt({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(l){n.ogreAgentStatus=l?.message||"Buy failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,F()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim(),o=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){n.activeTab="positions",n.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}n.ogreAgentLoading=!0,n.ogreAgentStatus=`Preparing sell ${o}%...`,F();try{await Co(r,o,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),n.ogreAgentStatus=`Sell ${o}% submitted. Refreshing wallet and positions in the background.`,typeof yt=="function"&&yt({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(s){n.ogreAgentStatus=s?.message||"Sell failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,F()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){n.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",F();return}window.open(r,"_blank","noopener,noreferrer"),n.ogreAgentStatus="Opened trusted coin link.",F();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=ts(String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Vt()||"").trim());if(!r){n.ogreAgentStatus="Paste a token CA and ask me to check it.",F();return}const o=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};n.ogreAgentLoading=!0,n.ogreAgentStatus="Checking coin details...",F();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},l=c.symbol||c.baseSymbol||w(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,p=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",g=c.telegramUrl||c.links?.telegram||"",S=o(c.liquidityUsd||c.liquidity?.usd),P=o(c.marketCap||c.fdv||c.marketCapUsd),T=o(c.volume24h||c.volume?.h24||c.volume?.m5),b=[`${l} breakdown`,`${u} | ${w(r)}`,`MC/FDV: ${P} | Liquidity: ${S} | Volume: ${T}`,`Socials: X ${y?"found":"not returned"} | Telegram ${g?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],A=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];p&&A.push({label:"Pump",type:"open_external",url:p}),f&&A.push({label:"Website",type:"open_external",url:f}),y&&A.push({label:"X",type:"open_external",url:y}),g&&A.push({label:"Telegram",type:"open_external",url:g}),ue({role:"assistant",text:b.join(`
`),actions:A}),n.ogreAgentStatus="Coin breakdown ready."}catch(s){ue({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),n.ogreAgentStatus=s?.message||"Coin check delayed."}finally{n.ogreAgentLoading=!1,F()}return}n.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",F()}function WS(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function Tl(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function sm(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function NS(e="",t=[]){const a=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(o=>String(o||"").trim()).filter((o,s,c)=>o&&c.findIndex(l=>l.toLowerCase()===o.toLowerCase())===s).slice(0,4),r=a.length?a.map(o=>`"${o.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function DS(e=""){if(!sm(e))return null;const t=ts(Tl(e)||Vt()||n.smartChartToken||n.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:NS(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function _S(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function US(e=""){if(!_S(e))return null;const t=Vp().slice(0,4),a=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((s,c)=>{const l=s.symbol||w(s.tokenMint),u=Number.isFinite(Number(s.ageMinutes))?`${Math.max(0,Math.round(Number(s.ageMinutes)))}m old`:"age n/a",d=s.twitterUrl||s.telegramUrl||s.websiteUrl?"socials found":"socials not returned",p=Array.isArray(s.riskFlags)&&s.riskFlags.length?`risk: ${s.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${l} ${w(s.tokenMint)} | MC ${a(s.marketCap)} | Liq ${a(s.liquidityUsd)} | Vol ${a(s.volume5m||s.volume1h)} | ${u} | ${d} | ${p}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],o=t[0];return{text:r.join(`
`),actions:[o?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:o.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const qS=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],HS=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function KS(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||Tl(e)||Tt(e))return null;const a=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(a){const o=dr(a[1]);if(o)return n.quickBuyAmountOverride=o,Xr({quickBuy:o}),qo(),{text:`Quick buy set to ${o} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return Xr({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return Xr({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=HS.test(t);for(const[o,s]of qS)for(const c of s){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${VS(o)} now.${o==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:o},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function VS(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const zS={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function im(e){n.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},is()}function Be(e,t="ok",a=""){if(!n.tradeTrace||n.tradeTrace.done&&t==="pending")return;const r=n.tradeTrace.steps,o=r.find(l=>l.key===e),s=o||{key:e,label:zS[e]||e};if(s.status=t,s.detail=String(a||"").slice(0,140),o||r.push(s),t==="fail"&&(n.tradeTrace.done=!0),is(),t==="fail")return;r.length>=3&&r.every(l=>l.status==="ok")&&(n.tradeTrace.done=!0,window.setTimeout(()=>{n.tradeTrace?.done&&!n.tradeTrace.steps.some(l=>l.status==="fail")&&(n.tradeTrace=null,is())},8e3))}function is(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=n.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const a=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
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
  `}async function ft(e=""){const t=document.querySelector("[data-ogre-agent-input]"),a=String(e||t?.value||"").trim();if(!a||n.ogreAgentLoading)return;const r=Tl(a);if(r&&ts(r),t&&(t.value=""),n.ogreAgentDraft="",ue({role:"user",text:a,actions:[]}),MS(a)){const l=Tt(a),u=ss({type:l==="buy"?"confirm_buy":"confirm_sell"},a),d=String(u.tokenMint||u.mint||u.ca||"").trim(),p=Number(u.amountSol||u.sol||u.amount||0);if(!d){ue({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),n.ogreAgentStatus="Need token CA.",F({force:!0});return}if(l==="buy"&&(!Number.isFinite(p)||p<=0)){ue({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),n.ogreAgentStatus="Need buy amount.",F({force:!0});return}if(!os()){ue({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),n.ogreAgentStatus="Wallet session needed.",F({force:!0});return}ue({role:"assistant",text:l==="buy"?`Sending ${p} SOL buy for ${w(d)}.${rm(u)}`:`Sending sell request for ${w(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),n.ogreAgentStatus="Fast Mode: sending trade request...",F({force:!0}),await jt(u);return}const o=KS(a);if(o){ue({role:"assistant",text:o.text,actions:o.actions||[]}),n.ogreAgentStatus="Instant local reply.",F({force:!0}),o.run&&await jt(o.run);return}n.ogreAgentLoading=!0,n.ogreAgentStatus="",ne("chatRequestStarted");const s=`${Date.now()}:${Math.random().toString(16).slice(2)}`;n.ogreAgentRequestId=s;const c=setTimeout(()=>{n.ogreAgentRequestId!==s||!n.ogreAgentLoading||(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Agent reply timed out.",ne("chatRequestTimedOut"),ue({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:a,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),F({force:!0}))},7500);F();try{const l=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:a,context:bS()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(n.ogreAgentRequestId!==s)return;const u=(l?.agent?.actions||[]).map(S=>ss(S,a));l?.agent?.tokenMint&&ts(l.agent.tokenMint),ue({role:"assistant",text:l?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),ne("chatRequestSucceeded");const d=!!(l?.agent?.coinEnriched||l?.agent?.tokenMint||l?.agent?.socialLinks||l?.agent?.socialScan),f=!sm(a)&&!d&&!Tt(a)&&WS(a)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||ss({type:"coin_breakdown"},a):null;if(f?.tokenMint||f?.mint||f?.ca){n.ogreAgentStatus="Checking coin now...",await jt(f);return}const y=ss({type:Tt(a)==="buy"?"confirm_buy":Tt(a)==="sell"?"confirm_sell":""},a);if(Tt(a)&&n.ogreAgentFastMode&&!os()){ue({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),n.ogreAgentStatus="Auto-Trade approval needed once.";return}const g=u.find(S=>om(S,a))||(om(y,a)?y:null);if(g){n.ogreAgentStatus="Fast Mode: sending trade request...",await jt(g);return}n.ogreAgentStatus=l?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(l){if(n.ogreAgentRequestId!==s)return;const u=DS(a);if(u){ue({role:"assistant",text:u.text,actions:u.actions}),n.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=US(a);if(d){ue({role:"assistant",text:d.text,actions:d.actions}),n.ogreAgentStatus="Fast local trend scan.";return}ue({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:a,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),ne("chatRequestFailed"),n.ogreAgentStatus=l?.message||"Agent reply failed."}finally{clearTimeout(c),n.ogreAgentRequestId===s&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,F())}}function O(e,t){return`<article class="empty"><h3>${i(e)}</h3><p>${i(t)}</p></article>`}function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function we(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function jS(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function lm(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const a=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");a&&(e.preventDefault(),jS(a),fc({connectPanel:a.matches("[data-connect-login-toggle]")||n.route==="connect",source:a.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(Cf(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),ft();return}const a=e.target?.closest?.("[data-global-token-search]");if(a&&e.key==="Enter"){e.preventDefault(),Bd(a.value||"");return}if(e.key==="Escape"){if(n.ogreAgentOpen){rs();return}if(n.slimeShieldDetails?.open){rl();return}if(n.kolDumpDetails?.open){Oi();return}if(n.replayDetails?.open){ll();return}if(n.protectedBuyModal?.open){To();return}if(!(!n.loginModalOpen&&!n.quickBuyModal?.open)){if(n.quickBuyModal?.open){Ki();return}pc()}}});function Al(e=null,t="interaction"){const a=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!a)return!1;const r=a.dataset.tokenTrade||a.dataset.tokenChart||a.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),l=Number(n.smartChartInteractionPrefetchAt||0),u=n.smartChartInteractionPrefetchSeen||{};if(l&&c-l<Bv||Number(u[r]||0)&&c-Number(u[r])<Ov)return!1;const d=(n.smartChartInteractionPrefetchRecent||[]).filter(p=>c-Number(p||0)<Rv);if(d.length>=Iv)return n.smartChartInteractionPrefetchRecent=d,!1;n.smartChartInteractionPrefetchAt=c,n.smartChartInteractionPrefetchRecent=[...d,c],n.smartChartInteractionPrefetchSeen={...u,[r]:c}}return Ji(ge(r,{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t}),{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Al(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Al(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Al(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const cm=new WeakMap;function GS(e){let t=cm.get(e);if(!t){const a=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(a.overflowY),contained:/contain|none/.test(a.overscrollBehaviorY)},cm.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||n.route!=="terminal"||Xn())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const a=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const s=GS(t);if(s.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,l=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(a<0&&c||a>0&&l)||s.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let o=e.deltaY;e.deltaMode===1?o*=40:e.deltaMode===2&&(o*=r.clientHeight),r.scrollTop+=o,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),rl();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),To();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),Oi();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),ll();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const b=c.closest(".nav-tool-group");n.navTekOpen=!b?.open,Qm(n.navTekOpen),b&&(b.open=n.navTekOpen);return}const l=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!l)return;if(l.matches("[data-tool-section]")){e.preventDefault();const b=l.dataset.toolSection,[A]=b.split(":"),C=b.slice(A.length+1);n.toolSections={...n.toolSections||{},[A]:C};const M=l.closest("[data-tool-panels]");M&&(M.querySelectorAll(`[data-tool-section^="${A}:"]`).forEach(q=>{q.dataset.active=q.dataset.toolSection===b?"true":"false"}),M.querySelectorAll(`[data-tool-panel^="${A}:"]`).forEach(q=>{q.hidden=q.dataset.toolPanel!==b}),no(M));return}if(l.matches("[data-clip-record]")){e.preventDefault(),n.clipFarm?.recording?Gn():ou();return}if(l.matches("[data-clip-share]")){e.preventDefault(),yh();return}if(l.matches("[data-clip-download]")){e.preventDefault(),vh();return}if(l.matches("[data-clip-clear]")){e.preventDefault(),ui();return}if(l.matches("[data-slimeshield-details]")){e.preventDefault(),l.closest("[data-dev-info-drawer-root]")&&ol(),bp(l.dataset.slimeshieldDetails||"");return}if(l.matches("[data-slimeshield-refresh]")){e.preventDefault(),Ho(l.dataset.slimeshieldRefresh||"",{force:!0});return}if(l.matches("[data-kol-dump-details]")){e.preventDefault(),jb(l.dataset.kolDumpDetails||"");return}if(l.matches("[data-kol-dump-refresh]")){e.preventDefault(),Ii({force:!0});return}if(l.matches("[data-replay-open]")){e.preventDefault(),Tw(l.dataset.replayOpen||"");return}if(l.matches("[data-replay-refresh]")){e.preventDefault(),il(l.dataset.replayRefresh||"",{force:!0});return}if(l.matches("[data-ogre-agent-toggle]")){n.ogreAgentOpen?rs():(n.ogreAgentOpen=!0,Nh(),F({force:!0}));return}if(l.matches("[data-ogre-agent-close]")){rs();return}if(l.matches("[data-ogre-agent-voice]")){AS(!n.ogreAgentVoiceEnabled);return}if(l.matches("[data-ogre-agent-send]")){zt(),ft();return}if(l.matches("[data-ogre-agent-mic]")){CS();return}if(l.matches("[data-ogre-agent-quick]")){const b=l.dataset.ogreAgentQuick||"";if(b==="positions"&&jt({type:"open_tab",tab:"positions"}),b==="whats_cooking"&&ft("whats cooking"),b==="my_bags"&&ft("how are my bags"),b==="refresh_feeds"&&jt({type:"refresh_feeds"}),b==="risk"&&ft("Why is this token risky?"),b==="dev_info"&&ft("Explain Dev Info for this token."),b==="protected_buy"&&ft("Should I use Protected Buy?"),b==="replay"&&ft("Replay similar launches for this token."),b==="auto_trade"&&jt({type:"approve_agent_auto_trade"}),b==="clear_chat"){zt(),as(),n.ogreAgentMessages=[Kp()],n.ogreAgentStatus="Chat cleared.",n.ogreAgentDraft="",n.ogreAgentLastTokenMint="";try{localStorage.removeItem(yl),localStorage.removeItem(vl)}catch{}F({force:!0})}return}if(l.matches("[data-ogre-agent-retry]")){const b=Number(l.dataset.ogreAgentRetry),A=String(n.ogreAgentMessages?.[b]?.retryText||"").trim();A&&ft(A);return}if(l.matches("[data-ogre-agent-action]")){const b=l.dataset.ogreAgentAction,C=LS(b)||(n.ogreAgentMessages||[]).flatMap(M=>Array.isArray(M.actions)?M.actions:[]).find(M=>M.key===b||M.label===b||M.type===b);jt(C||{type:b});return}if(l.matches("[data-nav-route]")){e.preventDefault(),$e(l.dataset.navRoute||"/terminal",l.dataset.tab||null);return}if(l.matches("[data-policy]")){e.preventDefault(),window.alert($f(l.dataset.policy==="privacy"?"privacy":"terms"));return}if(l.matches("[data-top-wallet-connect]")){e.preventDefault(),l.dataset.walletState==="connected"||!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length)?$e("/terminal","wallets"):da({returnPath:"/terminal"});return}if(l.matches("[data-top-wallet-status]")){e.preventDefault(),await Ph();return}if(l.matches("[data-top-refresh-wallet]")){const b=L();Va("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:"top-refresh-wallet"}),yt({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{oy()&&G(()=>Fi())}).catch(A=>$(A.message));return}if(l.matches("[data-ogre-tek-refresh]")){await br({force:!0}).catch(b=>$(b.message));return}if(l.matches("[data-ogre-ai-start]")){G(()=>_y());return}const u=l.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),n.ogreAiCategory=u.dataset.ogreCat||"strong",h({force:!0});return}if(l.closest?.("[data-autopilot-save]")){e.preventDefault(),G(()=>Hy());return}if(l.matches("[data-ogre-tek-market]")){n.ogreTek.selectedMarket=l.dataset.ogreTekMarket||n.ogreTek.selectedMarket,n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-side]")){n.ogreTek.direction=l.dataset.ogreTekSide==="short"?"short":"long",n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-review]")){es(),n.ogreTek.reviewOpen=!0,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-close-review]")){n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-confirm-review]")){es();const b=Up();!n.ogreTek.riskAccepted||!b.ok?n.ogreTek.status="Risk confirmation is incomplete.":ke.demoMode?(n.ogreTek.status="Demo review confirmed. No live transaction was submitted.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1):(n.ogreTek.status="Live perps adapter is not wired in this build.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1),h({force:!0});return}if(l.matches("[data-ogre-tek-demo-action]")){const b=l.dataset.ogreTekDemoAction||"action";n.ogreTek.status=`Demo mode: ${b.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(l.matches("[data-toggle-terminal-ticket]")){n.terminalTradeCollapsed=!n.terminalTradeCollapsed,h({force:!0});return}if(l.matches("[data-global-token-open]")){const b=m("[data-global-token-search]")?.value?.trim()||"";b&&Bd(b);return}if(l.matches("[data-token-chart]")){e.preventDefault();const b=l.dataset.tokenChart||l.dataset.previewToken||"";wt(ge(l.dataset.tokenChart||l.dataset.previewToken||"",{source:l.dataset.tokenChartSource||"token-card"}),{defaultTab:l.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!l.closest?.(".live-pair-avatar"),source:l.dataset.tokenChartSource||"token-card"});return}if(l.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const b=l.dataset.tokenTrade||"",A=cn(b);A&&Mo(A)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),wt(ge(l.dataset.tokenTrade||"",{source:l.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:l.dataset.tokenTradeSource||"trade-button"});return}if(l.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),ln(ge(l.dataset.quickBuyToken||"",{source:l.dataset.quickBuySource||"quick-buy-button"}),{source:l.dataset.quickBuySource||"quick-buy-button"});return}if(l.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),l.closest("[data-dev-info-drawer-root]")&&ol();const b=l.dataset.protectedBuySource||"protected-buy",A=!!l.closest("[data-quick-buy-modal-root]"),C=!!l.closest(".chart-trade-panel"),M=l.dataset.protectedBuyOpen||n.quickBuyModal?.tokenMint||n.smartChartToken||n.tradeToken||"";Qy(ge(M,{source:b}),{source:b,presetId:l.dataset.protectedBuyPreset||"",amountSol:A?m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||"":C&&m("[data-chart-buy-amount]")?.value||"",walletIndex:A?m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"":C&&m("[data-chart-buy-wallet]")?.value||"",slippageBps:A?m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400":C&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-quick-buy-close]")){e.preventDefault(),Ki();return}if(l.matches("[data-protected-buy-close]")){e.preventDefault(),To();return}if(l.matches("[data-protected-buy-confirm]")){e.preventDefault(),G(()=>tv());return}if(l.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),n.quickBuyModal={...n.quickBuyModal,amountSol:l.dataset.quickBuyModalPreset||"",status:`${l.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(l.matches("[data-quick-buy-confirm]")){e.preventDefault(),G(()=>rv());return}if(l.matches("[data-preview-token]")){const b=l.dataset.previewToken||"";b&&wt(ge(b,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(l.matches("[data-terminal-subtab]")){n.terminalSubtab=l.dataset.terminalSubtab||"positions",h();return}if(l.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await Co(l.dataset.positionSell||"",l.dataset.positionSellPercent||"100",{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const b=await Le({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});b&&await Co(l.dataset.positionSellCustom||"",b,{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-run-tx-audit]")){e.preventDefault(),G(()=>ov());return}if(l.matches("[data-connect-login-toggle]")){lm(l)||hc({connectPanel:!0,source:"connect-lock-in"});return}if(l.matches("[data-login-tab]")){n.loginModalTab=l.dataset.loginTab==="create"?"create":"login",h({force:!0}),dc(!1);return}if(l.matches("[data-connect-password-login]")){await Ac();return}if(l.matches("[data-send-email-code]")){await _f();return}if(l.matches("[data-web-code-login]")){await Uf();return}if(l.matches("[data-connect-create-account]")){await Ys();return}if(l.matches("[data-connect-create-wallet]")){await zf();return}if(l.matches("[data-web-signup]")&&await Ys(),l.matches("[data-web-password-login]")&&await Ac(),l.matches("[data-close-login]")){pc();return}if(l.matches("[data-web-signup-connect]")){await Vf();return}if(l.matches("[data-open-login]")){lm(l)||hc({connectPanel:n.route==="connect",source:"top-lock-in"});return}if(l.matches("[data-browse-guest]")){n.loginCollapsed=!0,n.route="terminal",n.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Ur("browse-terminal");return}if(l.matches("[data-logout]")&&await jf(),l.matches("[data-connect-x]")&&await by(),l.matches("[data-open-x-login]")&&yy(),l.matches("[data-clear-x]")&&await vy(),l.matches("[data-save-login-credentials]")&&await $y(),l.matches("[data-save-referral]")&&await Fd(),l.matches("[data-generate-referral-code]")&&await Fd({generate:!0}),l.matches("[data-save-trader-board]")&&await uv(),l.matches("[data-use-x-avatar]")&&await ky(),l.matches("[data-clear-avatar]")&&await go({clear:!0},"Removing PFP..."),l.matches("[data-preset-avatar]")){const b=m("[data-avatar-status]");v(b,"Loading preset PFP...");try{const A=await Sy(l.dataset.presetAvatar);await go({avatarDataUrl:A,avatarSource:l.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(A){v(b,A.message),$(A.message)}}if(l.matches("[data-launch-coin-save]")){Zn();return}if(l.matches("[data-launch-coin-submit]")){await Ub();return}if(l.matches("[data-launch-coin-use-ca]")){await Wb();return}if(l.matches("[data-connect-wallet]")){const b=l.dataset.connectWallet||"solana";if(b&&b!=="solana"){await pd(b,{returnPath:"/terminal"});return}da({returnPath:"/terminal"});return}if(l.matches("[data-connect-wallet-provider]")){await pd(l.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(l.matches("[data-wallet-connect-close]")){n.walletConnectMenuOpen=!1,h({force:!0});return}if(l.matches("[data-wallet-fast-approvals-toggle]")){rg(!n.walletFastApprovalsEnabled),$(n.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(l.matches("[data-disconnect-wallet]")){await md();return}if(l.matches("[data-share-x]")&&Ni(l.dataset.shareText||""),l.matches("[data-share-watch-token-btn]")&&fd("token"),l.matches("[data-share-watch-kol-btn]")&&fd("kol"),l.matches("[data-save-preset]")){await Od(l.dataset.savePreset);return}if(l.matches("[data-save-fast-preset]")){await Od(l.dataset.saveFastPreset,"fast");return}if(l.matches("[data-use-preset]")){lv(l.dataset.usePreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-preset]")){Ed(l.dataset.editPreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-selected-preset]")){const b=l.dataset.editSelectedPreset==="bundle"?"bundle":"trade",A=b==="bundle"?n.selectedBundlePresetId:n.selectedTradePresetId;A&&A!=="custom"?Ed(b,A):cl(b);return}if(l.matches("[data-cancel-preset-edit]")){to(l.dataset.cancelPresetEdit,""),h();return}if(l.matches("[data-delete-preset]")){await cv(l.dataset.deletePreset,l.dataset.presetId||"");return}if(l.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),ln(ge(l.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(l.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),G(()=>Id(l.dataset.quickBundleToken||""));return}if(l.matches("[data-smart-chart-token]")){wt(ge(l.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(l.matches("[data-smart-chart-view]")){const b=l.dataset.smartChartView||"chart";n.smartChartView=["chart","chartTxns","txns","info"].includes(b)?b:"chart",h();return}if(l.matches("[data-chart-trade-tab]")){n.chartTradeTab=l.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),n.chartTradeTab==="buy"&&requestAnimationFrame(()=>m("[data-chart-buy-amount]")?.focus());return}if(l.matches("[data-chart-buy-preset]")){const b=m("[data-chart-buy-amount]");b&&(b.value=l.dataset.chartBuyPreset||""),n.quickBuyAmountOverride=X(l.dataset.chartBuyPreset||""),qo();return}if(l.matches("[data-chart-confirm-buy]")){const b=l.dataset.chartConfirmBuy||n.smartChartToken||"";e.preventDefault(),e.stopPropagation();const A=m("[data-chart-buy-wallet]")?.value||"";if(ce(A)){try{l.dataset.actionState="clicked",l.disabled=!0,await nv(b)}catch(C){const M=D(C.message||"Chart buy failed."),q=X(m("[data-chart-buy-amount]")?.value||"")||"custom";V("trade-buy",b,String(q),{state:"error",error:M}),Pe("trade-buy",b,String(q),4e3),Fe(M),$(M),ie()}return}Fe("Buy queued. Opening wallet approval..."),l.dataset.actionState="clicked",l.disabled=!0,G(async()=>{try{const C=Td();await Ao({tokenMint:b,walletIndex:A,amountSol:X(m("[data-chart-buy-amount]")?.value||""),slippageBps:m("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:C.takeProfitPct,stopLossPct:C.stopLossPct,sellDelay:C.sellDelay,sellPercent:C.sellPercent,source:"chart-buy-panel"}),n.chartTradeTab="buy",Fe("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(C){const M=D(C.message||"Chart buy failed.");Fe(M),$(M),h({force:!0,preserveSmartChartFrame:!0})}});return}if(l.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const b=m("[data-chart-sell-percent]")?.value||"";if(b)try{await Co(l.dataset.chartConfirmSell||"",b,{slippageBps:m("[data-chart-buy-slippage]")?.value||"400"})}catch(A){const C=D(A.message||"Chart sell failed.");Fe(C),$(C)}return}if(l.matches("[data-smart-chart-open]")){const b=String(m("[data-smart-chart-input]")?.value||"").trim();if(!b){$("Paste a token CA first.");return}wt(ge(b,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(l.matches("[data-refresh-feeds]")){G(()=>Ja({force:!0,reason:"manual-refresh-feeds"}));return}if(l.matches("[data-terminal-load-more]")){const b=l.dataset.terminalLoadMore||n.activeTab;Yf(b,It(b)),Nc(b,{requestId:z(b).lastRequestId||"",status:z(b).lastStatus||"render",reason:"load-more",resultCount:It(b),renderedCount:Nn(b),hasMore:It(b)>Nn(b),stale:Dn(b),errorCode:z(b).errorCode||"",errorMessage:z(b).errorMessage||""}),h({force:!0});return}if(l.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),ww(l.dataset.devInfo||"");return}if(l.matches("[data-dev-info-close]")){ol();return}if(l.matches("[data-dev-info-refresh]")){const b=l.dataset.devInfoRefresh||n.devInfoDetails?.tokenMint||"";await Sp(b,{force:!0});return}if(l.matches("[data-watch-token]")&&await Wd("add",l),l.matches("[data-unwatch-token]")&&await Wd("remove",l),l.matches("[data-pnl-card]"))try{await gd(l.dataset.pnlCard)}catch(b){$(b.message)}if(l.matches("[data-share-pnl-card]")&&await Ty(l.dataset.sharePnlCard,l.dataset.shareText||""),l.matches("[data-scan-bags]")){await Pv();return}if(l.matches("[data-arm-exits]")){await Av(l.dataset.armExits,l);return}if(l.matches("[data-dev-watch]")){await Tv(l.dataset.devWatch);return}if(l.matches("[data-hype-create]")){await Mb();return}if(l.matches("[data-push-enable]")){await Gh();return}if(l.matches("[data-push-disable]")){await Xh();return}if(l.matches("[data-call-post]")){await Iw(l.dataset.callPost);return}if(l.matches("[data-telegram-link]")){await zh();return}if(l.matches("[data-trade-trace-close]")){n.tradeTrace=null,is();return}if(l.matches("[data-launch-kit-close]")){n.launchShareKit=null,h();return}if(l.matches("[data-create-wallets]")&&await ud(),l.matches("[data-distribute-fresh]")){await mb();return}if(l.matches("[data-return-funds]")){await pb();return}if(l.matches("[data-sweep-background-wallets]")){await gv();return}if(l.matches("[data-create-automation-wallet]")&&await ey(),l.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await ny(l);return}if(l.matches("[data-tpsl-status-button]")){l.dataset.tpslState==="enabled"?(n.activeTab="profile",$e("/terminal","profile"),n.automationDelegationStatus=n.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await Ei("enable");return}if(l.matches("[data-automation-permission]")&&await Ei(l.dataset.automationPermission||"enable"),l.matches("[data-run-trade-plans]")&&await Fi(),l.matches("[data-restore-backup]")&&await ly(),l.matches("[data-export-backup]")&&await cy(),l.matches("[data-import-wallet]")&&await uy(),l.matches("[data-remove-wallet]")&&await dy(l.dataset.removeWallet||"",l.dataset.walletLabel||"",l.dataset.removeWalletKey||""),l.matches("[data-wallet-sweep-action]")&&await hy(l.dataset.walletSweepAction||""),l.matches("[data-download]")){const b=n.downloads?.[l.dataset.download];b&&fe(b.filename,b.text)}if(l.matches("[data-trade-buy-quick]")&&await vo(l.dataset.tradeBuyQuick),l.closest?.("[data-swap-reverse]")){n.swapDirection=n.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(l.matches("[data-swap-use-custom-amount]")){const b=String(m("[data-swap-amount]")?.value||"").trim();n.swapDirection==="sell"?await _i(b||"100"):await vo(b);return}l.matches("[data-trade-buy-max]")&&await vo(null,"max"),l.matches("[data-trade-buy-custom]")&&await vo(m("[data-buy-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-sell-quick]")&&await _i(l.dataset.tradeSellQuick),l.matches("[data-trade-sell-custom]")&&await _i(m("[data-sell-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-plan-start]")&&await Oy(),l.matches("[data-volume-start]")&&await Fy();const d=l.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),n.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(b=>{b.dataset.active=String(b===d)});return}const p=l.closest?.("[data-vbot-set-aggr]");if(p){e.preventDefault(),n.slimeBotAggr=p.dataset.vbotSetAggr||"med",p.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(b=>{b.dataset.active=String(b===p)});return}const f=l.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),n.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(b=>{b.dataset.active=String(b===f)});return}if(l.matches("[data-vbot-start]")){e.preventDefault(),await wb();return}const y=l.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await Sb(y.dataset.vbotStop||"");return}if(l.matches("[data-sniper-buy]")&&await Ny(l.dataset.sniperBuy),l.matches("[data-kol-mode]")){n.kolWallet="",n.kolMode=l.dataset.kolMode||n.kolMode,Z("kol"),await ee("kol",{force:!0,reason:"kol-mode-switch"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-refresh]")){await ee("kol",{force:!0,reason:"manual-kol-refresh"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-wallet-scan]")){if(n.kolWallet=String(m("[data-kol-wallet]")?.value||"").trim(),n.kolWallet&&!Wt(n.kolWallet)){Ut("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-wallet-scan"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-scan-wallet]")){if(n.kolWallet=String(l.dataset.kolScanWallet||"").trim(),n.kolWallet&&!Wt(n.kolWallet)){Ut("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(b=>$(b.message));return}if(l.matches("[data-kol-copy-setup]")){const b=String(l.dataset.kolCopySetup||"").trim();if(b&&!Wt(b)){Ut("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}b&&(n.kolWallet=b),n.activeTab="kol",h(),setTimeout(()=>{const A=document.querySelector("[data-kol-management-settings]");A&&(A.open=!0,A.scrollIntoView({behavior:"smooth",block:"start"}));const C=m("[data-kol-wallet]");C&&b&&(C.value=b);const M=m("[data-kol-status]");M&&v(M,`Copy setup loaded for ${w(b)}. Choose presets, then tap Copy Wallet Next Buy.`),m("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(l.matches("[data-kol-copy]")){await zy(l.dataset.kolCopy);return}if(l.matches("[data-kol-copy-wallet]")){const b=String(l.dataset.kolCopyWallet||"").trim();if(b&&!Wt(b)){Ut("That KOL entry does not have a verified Solana wallet yet.");return}await jy(l.dataset.kolCopyWallet||"");return}if(l.matches("[data-kol-trade]")){n.tradeToken=l.dataset.kolTrade||"",n.activeTab="trade",h();return}if(l.matches("[data-kol-bundle]")){n.bundleToken=l.dataset.kolBundle||"",n.activeTab="bundle",h();return}if(l.matches("[data-bundle-buy]")&&await Ld("buy"),l.matches("[data-bundle-sell]")&&await Ld("sell"),l.matches("[data-bundle-plan]")&&await Xy(),l.matches("[data-launch-start]")&&await pv(),l.matches("[data-launch-cancel]")&&await mv(l.dataset.launchCancel),l.matches("[data-use-token]")&&(n.tradeToken=l.dataset.useToken||"",n.volumeToken=l.dataset.useToken||"",n.bundleToken=l.dataset.useToken||"",n.activeTab="trade",h()),l.matches("[data-use-token-bundle]")&&(n.bundleToken=l.dataset.useTokenBundle||"",n.tradeToken=n.bundleToken,n.volumeToken=n.bundleToken,n.activeTab="bundle",h()),l.matches("[data-use-token-volume]")&&(n.volumeToken=l.dataset.useTokenVolume||"",n.tradeToken=n.volumeToken,n.bundleToken=n.volumeToken,n.activeTab="volume",h()),l.matches("[data-refresh-all]")){const b=L();if(Va("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:n.activeTab||"terminal"}),!n.user||!n.token)ze(n.activeTab)?await ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(A=>$(A.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),Ke("success");else{const A=L();n.activeTab==="positions"?Jf({force:!0,reason:"manual-positions-refresh"}).catch(C=>{Ke("error",{error:D(C?.message||"Position refresh failed")}),$(C.message),h()}):(yt({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(C=>$(C.message)),ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(C=>$(C.message))),H("position-refresh-request-start",A,{component:"positions",cacheHit:!1,details:n.activeTab||"terminal"})}}if(l.matches("[data-tab]")){const b=L();if(n.activeTab=l.dataset.tab,n.activeTab==="volume"&&oo(),n.activeTab==="ogreAi"&&Uy(),n.activeTab==="ogreTek"){n.route="terminal",window.history.pushState({},"","/ogre-tek"),await br({silent:!0}).catch(M=>$(M.message)),h();return}n.route!=="terminal"&&(n.route="terminal",window.history.pushState({},"","/terminal")),n.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):n.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const A=Wc(n.activeTab);h();const C=ee(n.activeTab,{silent:!0,ifStale:!0,force:!A,reason:"tab-switch"}).catch(M=>$(M.message));A||await C,H("tab-switch",b,{component:"terminal",cacheHit:A,details:n.activeTab})}if(l.matches("[data-refresh-scan]")&&G(()=>ee("sniper",{force:!0,reason:"manual-sniper-refresh"})),l.closest?.("[data-refresh-live-pairs]")){const b=n.activeTab==="slimeScope"?"slimeScope":n.activeTab==="terminal"?"terminal":n.activeTab==="launch"||n.activeTab==="launchCoin"?"launch":"live",C=n.activeTab==="live"||n.activeTab==="terminal"?null:mi();G(async()=>{await ee(b,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),C&&fi(C)})}if(l.closest?.("[data-terminal-filter-toggle]")){const b=Me();b.open=!b.open,h();return}if(l.closest?.("[data-terminal-filter-clear]")){n.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},Z("live"),Z("launch"),Z("sniper"),h();return}l.matches("[data-refresh-watchlist]")&&G(()=>ee("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=l.closest?.("[data-live-pair-bucket]");S&&(n.livePairBucket=S.dataset.livePairBucket||"live",n.livePairs=Ne(),n.livePairsLastUpdatedAt=ca(),Z("live"),Z("slimeScope"),h(),G(()=>ee(n.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=l.closest?.("[data-slime-scope-mode]");P&&(n.slimeScopeMode=P.dataset.slimeScopeMode||"new",n.activeTab="slimeScope",Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),l.matches("[data-scan-mode]")&&(Z("sniper"),n.scanMode=l.dataset.scanMode||n.scanMode,h(),G(()=>qn(n.scanMode)));const T=l.getAttribute("data-copy");if(T){const b=l.getAttribute("data-copy-label")||l.textContent||"Copy";await navigator.clipboard.writeText(T),v(l,"Copied"),setTimeout(()=>{v(l,b)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(n.replayDetails?.open){ll();return}if(n.kolDumpDetails?.open){Oi();return}if(n.protectedBuyModal?.open){To();return}if(n.quickBuyModal?.open){Ki();return}if(n.walletConnectMenuOpen){n.walletConnectMenuOpen=!1,h({force:!0});return}n.loginCollapsed||(n.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const a=document.querySelector("[data-vbot-manual-wallets]");a&&(a.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(n.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(n.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const a=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(o=>{o.style.display=a?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=a||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(no(),cb(t)),t?.matches?.("[data-swap-from]")){const a=Oe(t.value||"SOL")||"SOL";n.tradeSwapFrom=a,a!=="SOL"?(n.tradeToken=a,n.tradeSwapTo="SOL"):Oe(n.tradeSwapTo||n.tradeToken||"")||(n.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const a=Oe(t.value||"");if(n.tradeSwapTo=a,a&&a!=="SOL"){n.tradeToken=a,n.swapDirection="buy";const r=m("[data-trade-token]");r&&(r.value=a)}a||m("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){n.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const a=t.value||"";if(a==="custom"){cl("trade");return}if(n.selectedTradePresetId=a,n.fastTradePresetStatus=n.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=oe("trade",n.selectedTradePresetId);n.chartBuyWalletIndex="",r?.amountSol&&(n.quickBuyAmountOverride=X(r.amountSol)),n.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(n.quickBuyAmountOverride=X(t.value),t.value=n.quickBuyAmountOverride,qo()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(n.protectedBuyModal={...n.protectedBuyModal||{},presetId:m("[data-protected-buy-preset]")?.value||n.protectedBuyModal?.presetId||"conservative",walletIndex:m("[data-protected-buy-wallet]")?.value||n.protectedBuyModal?.walletIndex||"",amountSol:X(m("[data-protected-buy-amount]")?.value||n.protectedBuyModal?.amountSol||""),slippageBps:m("[data-protected-buy-slippage]")?.value||n.protectedBuyModal?.slippageBps||"400",riskAccepted:!!m("[data-protected-buy-risk-accept]")?.checked},Vi()),t?.matches?.("[data-fast-bundle-preset]")){const a=t.value||"";if(a==="custom"){cl("bundle");return}n.selectedBundlePresetId=a,n.fastBundlePresetStatus=n.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(n.terminalSort=t.value||"best",Z("live"),Z("slimeScope"),h(),G(()=>Ot({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){n.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",n.liveFeedCategory)}catch{}n.terminalSort=Rp()[3]||"best",Z("live"),h(),G(()=>Ot({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){n.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",n.liveTerminalCategory)}catch{}Z("live"),h(),G(()=>Ot({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){n.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",n.cookSpotCategory)}catch{}Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const a=t.files?.[0],r=m("[data-launch-image-preview-wrap]"),o=m("[data-launch-image-preview]"),s=m("[data-launch-image-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);s&&(s.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);o&&(o.onload=()=>URL.revokeObjectURL(l),o.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}Zu(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},imageDataUrl:l,imageName:a.name,imageType:on(l,a.type||"application/octet-stream")},String(l).length<15e5)try{Ma(n.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-launch-coin-banner]")){const a=t.files?.[0],r=m("[data-launch-banner-preview-wrap]"),o=m("[data-launch-banner-preview]"),s=m("[data-launch-banner-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);s&&(s.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);o&&(o.onload=()=>URL.revokeObjectURL(l),o.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}ed(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},bannerDataUrl:l,bannerName:a.name,bannerType:on(l,a.type||"image/jpeg")},String(l).length<15e5)try{Ma(n.launchCoinDraft)}catch{}}).catch(l=>{const u=m("[data-launch-coin-status]");u&&v(u,l?.message||"Could not read that banner.")});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const a=Me(),r=t.getAttribute("data-terminal-filter-social"),o=t.getAttribute("data-terminal-filter-quote"),s=t.getAttribute("data-terminal-filter-audit");r&&(a.socials[r]=!!t.checked),o&&(a.quotes[o]=!!t.checked),s&&(a.audits[s]=!!t.checked),a.open=!0,Z("live"),Z("launch"),Z("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(es(),n.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(n.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await gy(t),t?.matches?.("[data-avatar-file]")&&await wy(t)}),document.addEventListener("focusout",()=>{setTimeout(Xc,50)});let Aa=null;const um=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")&&!e.target.matches("[data-launch-coin-banner]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const a=String(e.target.value||"");let r=a.replace(/[^0-9.]/g,"");const o=r.indexOf(".");if(o!==-1&&(r=r.slice(0,o+1)+r.slice(o+1).replace(/\./g,"")),r!==a){const s=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(s-(a.length-r.length),s-(a.length-r.length))}catch{}}}Aa&&clearTimeout(Aa),Aa=setTimeout(()=>{Aa=null,Zn({silent:!0})},350)}};document.addEventListener("input",um),document.addEventListener("change",um),document.addEventListener("click",()=>{Aa&&(clearTimeout(Aa),Aa=null,Zn({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){n.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),qo();return}if(t?.matches?.("[data-trade-token]")){const a=String(t.value||"").trim();n.tradeToken=a,n.tradeSwapTo=a;return}if(t?.matches?.("[data-terminal-filter-field]")){const a=t.getAttribute("data-terminal-filter-field"),r=Me();(a==="keywords"||a==="excludeKeywords")&&(r[a]=String(t.value||""),r.open=!0,op());return}if(t?.matches?.("[data-launch-ticker]")){const a=Me();a.keywords=String(t.value||""),a.open=!0,op();return}if(t?.matches?.("[data-smart-chart-zoom]")){n.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const a=t.closest(".smart-chart-zoom")?.querySelector("strong");a&&v(a,`${n.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(n.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(es(),t.type==="range"&&h({force:!0}))});function yr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",a=Yc(t,{forcePaint:!0});Xc(),!a&&e?.persisted&&n.route==="terminal"&&h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),na&&window.clearTimeout(na),na=window.setTimeout(()=>{if(na=null,!(document.hidden||n.route!=="terminal")){if(Kn()){W({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:n.postTradeRefresh?.attemptId||"",details:n.activeTab||"terminal"});return}ee(n.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),n.user&&n.token&&Dn("positions")&&bt({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:bs}).catch(()=>{}),ua(),Un(),Vr(),ai()}},_l)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(n.ogreAgentListening||n.ogreAgentSpeechRecognizer)&&zt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(n.ogreAgentOpen&&(n.ogreAgentListening||n.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!n.ogreAgentListening&&!n.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&yr()},_l+900);return}yr()}),window.addEventListener("focus",yr),window.addEventListener("pageshow",yr),window.addEventListener("online",yr),window.addEventListener("pagehide",()=>{na&&(window.clearTimeout(na),na=null),n.clipFarm?.recording&&Gn()});function XS(){Os&&window.clearInterval(Os),Os=window.setInterval(()=>{document.hidden||Yc("watchdog")},Nm)}const JS=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Swap & Chart",items:[["trade","Slime Swap"],["smartChart","Smart Chart"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function Pa(e,t){return t=t||"#8dff45",`<svg class="swampi" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="${t}" fill-opacity="0.2" stroke="${t}" stroke-opacity="0.5" stroke-width="1.1"/><g stroke="${t}" stroke-width="1.95">${e}</g></svg>`}const YS={terminal:"#46e8ff",live:"#8dff45",liveTrades:"#ffd24a",smartChart:"#72ff23",trade:"#3fe0d0",slimeScope:"#5ab0ff",watchlist:"#ffd24a",kol:"#ffcf5a",sniper:"#ff6b6b",txAudit:"#bbff63",tek:"#9fb6c2",ogreAi:"#b06bff",launchCoin:"#ff8a5a",bundle:"#ffa64d",volume:"#46e8ff",launch:"#9bff9b",wallets:"#ffd24a",positions:"#5ab0ff",pnl:"#72ff23",profile:"#8dff45"},Ca={terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',live:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',liveTrades:'<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',smartChart:'<path d="M3 17l5-5 4 3 8-9"/><path d="M16 6h4v4"/>',trade:'<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',slimeScope:'<circle cx="11" cy="11" r="6"/><path d="M11 5v2.5"/><path d="M11 14.5V17"/><path d="M5 11h2.5"/><path d="M14.5 11H17"/><circle cx="11" cy="11" r="1.2"/><path d="M15.5 15.5L20 20"/>',watchlist:'<path d="M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.3 9.5l5.2-.8z"/>',kol:'<path d="M4 8l3 9h10l3-9-5 4-3-6-3 6z"/><path d="M7 17h10"/>',sniper:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',txAudit:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/>',tek:'<path d="M15 5a4 4 0 0 1-5.2 5L5 14.8 9.2 19l4.8-4.8a4 4 0 0 1 5-5.2l-2.7 2.7-2.3-.5-.5-2.3z"/>',ogreAi:'<path d="M5 10a7 5 0 0 1 14 0v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M4 8L2.5 6"/><path d="M20 8l1.5-2"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9.5 15l-.7 2.5"/><path d="M14.5 15l.7 2.5"/>',launchCoin:'<path d="M12 3c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 17l-2 4"/><path d="M15 17l2 4"/>',bundle:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v6l8 4 8-4V7"/><path d="M12 11v6"/>',volume:'<path d="M4 13v4"/><path d="M8 9v8"/><path d="M12 5v12"/><path d="M16 10v7"/><path d="M20 13v4"/>',launch:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',wallets:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3"/>',positions:'<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',pnl:'<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',profile:'<path d="M5 12a7 6 0 0 1 14 0v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M9 14.5c1.2 1.4 4.8 1.4 6 0"/>'},QS=Object.fromEntries(Object.entries(Ca).map(([e,t])=>[e,Pa(t,YS[e])])),ZS={live:Pa(Ca.live,"#8dff45"),chart:Pa(Ca.trade,"#3fe0d0"),intel:Pa(Ca.slimeScope,"#5ab0ff"),tools:Pa(Ca.tek,"#9fb6c2"),portfolio:Pa(Ca.positions,"#5ab0ff"),profile:Pa(Ca.profile,"#8dff45")};function ek(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=JS.map(a=>`
    <div class="nav-drop-group" data-nav-drop-group="${i(a.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${ZS[a.key]||"•"}</span>
        <span class="nav-side-label">${i(a.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${a.items.map(([r,o])=>`
          <button type="button" data-tab="${i(r)}" title="${i(o)}">
            <span class="nav-side-icon" aria-hidden="true">${QS[r]||"•"}</span>
            <span class="nav-side-label">${i(o)}</span>
          </button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",a=>{const r=a.target.closest(".nav-side-group-toggle");if(r){const o=r.parentElement,s=o.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(c=>c.setAttribute("aria-expanded","false")),s||(o.classList.add("is-open"),r.setAttribute("aria-expanded","true"));return}a.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))}),document.addEventListener("click",a=>{a.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function tk(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(a=>{const r=!!a.querySelector(`[data-tab="${n.activeTab}"]`);a.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),a.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(a=>{a.dataset.active=a.dataset.tab===n.activeTab?"true":"false"})}function ak(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const o=((await fetch("/?build-check=1",{cache:"no-store"}).then(s=>s.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";o&&!e.includes(o)&&nk()}catch{}},300*1e3).unref?.()}function nk(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function rk(){ek(),ak(),gf(),kf(),Sf(),Ns(),wf(),n.route==="intro"?yf():An({reset:!0}),Jh(),XS(),Ds(),Hi(),await Kf(),h(),await Gf(),Cy(),n.route==="terminal"&&(Ja({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),n.activeTab==="ogreTek"&&await br({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))}rk();function At(e){n.pumpLiveStatus=e,n.pumpLiveLastActionAt=Date.now(),h()}function ok(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():n.launchCoinDraft||{},t=Gu(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function sk(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const a=t.getAttribute("data-pump-live-action"),r=ok(),o=r.tokenMint;if(!o){At("Paste or launch a CA first, then Pump Live can attach to it.");return}if(a==="chart"){typeof wt=="function"?(wt(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),At("Opened Pump chart with transactions inside Slime.")):At("Chart panel is still loading. Try again in a moment.");return}if(a==="copy"){const s=Xu(o);navigator.clipboard?.writeText(s).then(()=>At("Copied Pump Live stream route ID."),()=>At("Stream route ID ready: "+s));return}if(a==="obs"){const s=Bi()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";At(s);return}if(a==="end"){At("Pump Live ended for this launch. Chart and transactions stay available.");return}if(a==="go"){if(!Bi()){At("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}At("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",sk);function Gt(e){const t=String(e??"");return typeof i=="function"?i(t):t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function Pl(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:n.smartChartToken||{}}function Cl(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function ik(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function ls(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function dm(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const a of t){const r=ls(a);if(Number.isFinite(r)&&r>0)return r}return NaN}function lk(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const a=Number(t);if(Number.isFinite(a))return a<1e11?a*1e3:a;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function ck(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function uk(e,t,a){if(!a.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(o=>String(o||"").toLowerCase()).join(" ");return a.some(o=>r.includes(o))}function dk(e=""){return String(e||"").split("").reduce((t,a)=>t*31+a.charCodeAt(0)>>>0,17)}function pk(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(ls).filter(o=>Number.isFinite(o)&&o>0);if(t.length)return t[0];const a=typeof qt=="function"?Number(qt(e)):NaN;if(Number.isFinite(a)&&a>0)return Math.max(1,a*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function r0(e){const t=Pl(e),a=Cl(t)||t.symbol||t.name||"slime",r=pk(t),o=dk(a),s=Math.max(1,ls(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,ls(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),l=typeof qt=="function"?Math.max(0,Math.min(100,Number(qt(t))||0)):0,u=Math.max(-8,Math.min(18,c/s*18+l/12)),d=Date.now();return Array.from({length:34},(p,f)=>{const y=(f+o%13)/4.2,g=Math.sin(y)*(3.5+o%7*.28),S=(f/33-.5)*u,P=((o>>f%11&7)-3)*.32,T=Math.max(1e-7,r*(1+(g+S+P)/100));return{row:{...t,snapshotFallback:!0},value:T,time:d-(33-f)*15e3,side:"snapshot"}})}function pm(e){const t=Pl(e),a=[Cl(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,l,u)=>c.length>=3&&u.indexOf(c)===l),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:n.liveTrades},{direct:!1,rows:n.liveTradeRows},{direct:!1,rows:n.tradeTape},{direct:!1,rows:n.recentTrades},{direct:!1,rows:n.pumpTrades},{direct:!1,rows:n.pumpActivity},{direct:!1,rows:n.livePairs},{direct:!1,rows:n.livePairsRows},{direct:!1,rows:n.freshPairs},{direct:!1,rows:n.slimeScopePairs}],o=[];for(const c of r){const l=ck(c.rows).slice(-350);for(const u of l){if(!u||typeof u!="object"||!c.direct&&!uk(u,t,a))continue;const d=dm(u);if(!Number.isFinite(d)||d<=0)continue;const p=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();o.push({row:u,value:d,time:lk(u),side:p.includes("sell")?"sell":p.includes("buy")?"buy":"trade"})}}const s=dm(t);return Number.isFinite(s)&&s>0&&o.push({row:t,value:s,time:Date.now(),side:"snapshot"}),o.sort((c,l)=>c.time-l.time).filter((c,l,u)=>l===0||c.time!==u[l-1].time||c.value!==u[l-1].value).slice(-120)}function cs(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function mk(){const e=String(n.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function fk(e={},t={}){const a=Pl(e),r=Cl(a),o=mk(),s=String(n.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(n.pumpChartTimeframe||"5m"),u=pm(a).slice(-70),d=!u.length||u.every(U=>U.side==="snapshot"||U.row?.snapshotFallback),p=u.map(U=>U.value),f=p.length?Math.min(...p):NaN,y=p.length?Math.max(...p):NaN,g=720,S=260,P=22,T=Number.isFinite(y-f)&&y!==f?y-f:1,b=U=>u.length<=1?g/2:P+U/(u.length-1)*(g-P*2),A=U=>S-P-(U-(Number.isFinite(f)?f:0))/T*(S-P*2),C=u.map((U,We)=>`${We?"L":"M"}${b(We).toFixed(1)},${A(U.value).toFixed(1)}`).join(" "),M=u.length>1?`${C} L${b(u.length-1).toFixed(1)},${S-P} L${b(0).toFixed(1)},${S-P} Z`:"",q=Math.max(4,Math.min(12,(g-P*2)/Math.max(u.length*2,1))),J=u.map((U,We)=>{const Pt=(u[Math.max(0,We-1)]||U).value,de=U.value,fs=Math.max(Pt,de),hs=Math.min(Pt,de),wn=b(We),Ml=A(Pt),Bl=A(de),gm=A(fs),bm=A(hs);return`<g class="slime-pump-candle ${de>=Pt?"up":"down"}"><line x1="${wn.toFixed(1)}" y1="${gm.toFixed(1)}" x2="${wn.toFixed(1)}" y2="${bm.toFixed(1)}" /><rect x="${(wn-q/2).toFixed(1)}" y="${Math.min(Ml,Bl).toFixed(1)}" width="${q.toFixed(1)}" height="${Math.max(2,Math.abs(Bl-Ml)).toFixed(1)}" rx="2" /></g>`}).join(""),Se=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",et=o==="dex"&&Se?`<iframe class="slime-pump-dex-frame" src="${Gt(Se)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${g} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${M}" />${s==="candles"?J:`<path class="slime-pump-line" d="${C}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${o==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(U=>`<button type="button" class="${o===U?"active":""}" data-slime-pump-source="${U}">${U==="slime"?"Slime":U==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${s==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${s==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(U=>`<button type="button" class="${c===U?"active":""}" data-slime-pump-time="${U}">${U}</button>`).join("")}
          ${d?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${et}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Gt(cs(p[p.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Gt(Number.isFinite(f)&&Number.isFinite(y)?`${cs(f)} - ${cs(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Gt(d?"Slime snapshot":o==="slime"?"Slime default":o==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function hk(e={}){const t=pm(e).slice(-40).reverse(),a=t.map(r=>{const o=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),s=o<60?`${o}s`:`${Math.floor(o/60)}m`,c=r.row||{},l=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Gt(s)}</span><strong>${Gt(r.side)}</strong><span>${Gt(cs(r.value))}</span><span>${Gt(ik(l))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${a||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function mm(){n.slimePumpChartRendering||(n.slimePumpChartRendering=!0,requestAnimationFrame(()=>{n.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),a=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||a||r)&&(e.preventDefault(),e.stopPropagation(),t&&(n.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),a&&(n.pumpChartMode=a.getAttribute("data-slime-pump-mode")||"line"),r&&(n.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),mm())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&mm()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||n.activeTab!=="volume"||!(n.volumeBots||[]).some(t=>t.status!=="completed")||oo()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const a=document.querySelector("[data-vbot-invest-num]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const a=document.querySelector("[data-vbot-invest]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-duration]")){const a=document.querySelector("[data-vbot-duration-label]");if(a){const r=Number(t.value);a.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const a=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function o(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function s(){return!!(n?.route==="terminal"&&a.has(String(n.activeTab||"terminal"))&&!document.hidden)}function c(){let p=0;const f=y=>{if(y){if(Array.isArray(y)){p+=y.length;return}if(Array.isArray(y.rows)){p+=y.rows.length;return}Array.isArray(y.data?.rows)&&(p+=y.data.rows.length)}};return f(n.livePairRows),f(n.slimeScopeRows),f(n.liveTradeRows),f(n.livePairs),Object.values(n.livePairsByBucket||{}).forEach(f),Object.values(n.terminalFeeds||{}).forEach(f),p}function l(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const p=[n.livePairsLastUpdatedAt,n.livePairsLastUpdatedByBucket?.[n.livePairBucket||"live"],n.terminalFeeds?.[n.activeTab||"terminal"]?.updatedAt,n.terminalFeeds?.[n.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return p.length?Date.now()-Math.max(...p)>3e4:!1}function d(p="empty-feed-watchdog"){if(!s()||o())return;const f=Date.now();if(f-t<kn)return;const y=c()===0&&!l();if(!y&&!u())return;t=f;const g=()=>typeof Ja=="function"?Ja({force:y,reason:p}):typeof ee=="function"?ee(n.activeTab||"terminal",{force:y,reason:p}):null;try{typeof G=="function"?G(g):Promise.resolve(g()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),kn),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),kn)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),kn)})})();const R={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[],audio:null,mime:"video/webm"};function La(e){return new Promise(t=>{const a=setTimeout(t,e);R.timers.push(a)})}function gk(){return window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad/i.test(navigator.userAgent)}function bk(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{const t=new e;t.resume?.();const a=t.createGain();a.gain.value=.6,a.connect(t.destination);let r=null;try{r=t.createMediaStreamDestination(),a.connect(r)}catch{}return R.audio={ctx:t,master:a,dest:r},R.audio}catch{return null}}function us(e,t,a,r,o){const s=e.gain;s.setValueAtTime(1e-4,t),s.exponentialRampToValueAtTime(Math.max(.001,a),t+r),s.exponentialRampToValueAtTime(1e-4,t+r+o)}function fm(e,t=1){const a=R.audio;if(!a)return;const r=a.ctx.createOscillator(),o=a.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,e),r.frequency.exponentialRampToValueAtTime(42,e+.22),us(o,e,.8*t,.006,.3),r.connect(o).connect(a.master),r.start(e),r.stop(e+.45)}function hm(e){const t=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=t.getChannelData(0);for(let r=0;r<a.length;r+=1)a[r]=Math.random()*2-1;return t}function yk(e,t=1.3){const a=R.audio;if(!a)return;const r=a.ctx.createBufferSource();r.buffer=R.noiseBuf||(R.noiseBuf=hm(a.ctx)),r.loop=!0;const o=a.ctx.createBiquadFilter();o.type="bandpass",o.Q.value=1.1,o.frequency.setValueAtTime(250,e),o.frequency.exponentialRampToValueAtTime(5200,e+t);const s=a.ctx.createGain();s.gain.setValueAtTime(1e-4,e),s.gain.exponentialRampToValueAtTime(.3,e+t),s.gain.exponentialRampToValueAtTime(1e-4,e+t+.08),r.connect(o).connect(s).connect(a.master),r.start(e),r.stop(e+t+.2)}function Ll(e,t=!1){const a=R.audio;if(!a)return;fm(e,t?1.4:1.1);const r=a.ctx.createBufferSource();r.buffer=R.noiseBuf||(R.noiseBuf=hm(a.ctx));const o=a.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=t?1400:900;const s=a.ctx.createGain();us(s,e,t?.5:.32,.004,t?.9:.5),r.connect(o).connect(s).connect(a.master),r.start(e),r.stop(e+1.4);const c=a.ctx.createOscillator(),l=a.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(64,e),c.frequency.exponentialRampToValueAtTime(28,e+(t?1.4:.8)),us(l,e,t?.7:.4,.01,t?1.5:.85),c.connect(l).connect(a.master),c.start(e),c.stop(e+2)}function vk(e,t=720){const a=R.audio;if(!a)return;const r=a.ctx.createOscillator(),o=a.ctx.createGain();r.type="square",r.frequency.value=t,us(o,e,.12,.004,.12),r.connect(o).connect(a.master),r.start(e),r.stop(e+.2)}function wk(e,t){const a=R.audio;if(!a)return;const r=a.ctx.currentTime+.05;for(let o=0;o<t-.4;o+=.5)fm(r+o,.55+.35*(o/t));for(const o of e)yk(r+Math.max(0,o-1.25),1.25),Ll(r+o,!1);Ll(r+t-.35,!0),Ll(r+t+.45,!0)}function Sk(){if(document.getElementById("trailer-style"))return;const e=document.createElement("style");e.id="trailer-style",e.textContent=`
    @keyframes twCapIn { 0% { transform: translateX(-50%) scale(1.3); opacity: 0; filter: blur(8px); } 100% { transform: translateX(-50%) scale(1); opacity: 1; filter: blur(0); } }
    @keyframes twFlash { 0% { opacity: 0.45; } 100% { opacity: 0; } }
    @keyframes twPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twGlow { 0%, 100% { text-shadow: 0 0 24px rgba(114,255,35,0.55); } 50% { text-shadow: 0 0 56px rgba(114,255,35,0.95); } }
  `,document.head.appendChild(e)}function ds(){if(R.root)return R.root;Sk();const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:7vh;background:linear-gradient(rgba(2,7,2,0.92),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(transparent,rgba(2,7,2,0.94));"></div>
    <div data-trailer-flash style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, rgba(114,255,35,0.55), rgba(114,255,35,0.12) 60%, transparent);opacity:0;"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:max(30px, env(safe-area-inset-bottom, 0px) + 26px);transform:translateX(-50%);text-align:center;opacity:0;max-width:94vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(20px,5.4vw,32px);font-weight:900;letter-spacing:0.04em;animation:twGlow 2.2s infinite;"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,3.4vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.88);text-align:center;padding:22px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:max(10px, env(safe-area-inset-top, 0px));right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>xl("stopped")),document.body.appendChild(e),R.root=e,e}function ps(){const e=ds().querySelector("[data-trailer-flash]");e.style.animation="none",e.offsetWidth,e.style.animation="twFlash 0.55s ease-out forwards"}function ms(e,t=""){const a=ds(),r=a.querySelector("[data-trailer-caption]");a.querySelector("[data-trailer-caption-main]").textContent=e,a.querySelector("[data-trailer-caption-sub]").textContent=t,e?(r.style.animation="none",r.offsetWidth,r.style.animation="twCapIn 0.5s cubic-bezier(0.2,1.4,0.4,1) forwards",r.style.opacity="1"):r.style.opacity="0"}function vr(e){const t=ds().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}function kk(){const e=["video/mp4;codecs=avc1.64001f,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"];for(const t of e)try{if(MediaRecorder.isTypeSupported(t))return t}catch{}return"video/webm"}async function $k(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});R.stream=e;const t=[...e.getVideoTracks()],a=R.audio?.dest?.stream?.getAudioTracks()||[];t.push(...a);const r=new MediaStream(t);R.mime=kk(),R.chunks=[];const o=new MediaRecorder(r,{mimeType:R.mime,videoBitsPerSecond:6e6});return o.ondataavailable=s=>{s.data?.size&&R.chunks.push(s.data)},o.start(1e3),R.recorder=o,e.getVideoTracks()[0]?.addEventListener("ended",()=>xl("screen-share-ended")),!0}catch{return!1}}function Tk(e){const t=R.mime.includes("mp4")?"mp4":"webm",a=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.${t}`,r=URL.createObjectURL(e),o=document.createElement("div");o.setAttribute("data-trailer-result",""),o.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(2,7,2,0.94);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;",o.innerHTML=`
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
  `,o.querySelector("[data-trailer-close]").addEventListener("click",()=>{o.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3)}),o.querySelector("[data-trailer-share]").addEventListener("click",async()=>{try{const s=new File([e],a,{type:R.mime.split(";")[0]});if(navigator.canShare?.({files:[s]})){await navigator.share({files:[s],title:"SlimeWire",text:"SlimeWire - verify before you ape. slimewire.org"});return}}catch{}o.querySelector("a[download]")?.click()}),document.body.appendChild(o)}function Ak(){const e=R.recorder;if(!e)return;const t=()=>{try{const a=new Blob(R.chunks,{type:R.mime.split(";")[0]});a.size>0&&Tk(a)}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();R.stream?.getTracks().forEach(a=>{try{a.stop()}catch{}}),R.recorder=null,R.stream=null}function xl(e="done"){if(R.running){R.running=!1,R.timers.forEach(t=>clearTimeout(t)),R.timers=[],Ak();try{R.audio?.ctx?.close()}catch{}R.audio=null,R.root?.remove(),R.root=null}}function Pk(){const e=n.livePairsByBucket?.live?.rows||n.livePairs?.rows||n.livePairRows||[];return[...e].filter(a=>a?.tokenMint).sort((a,r)=>(Number(r.volume5m)||0)-(Number(a.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(a.bestPickScore||a.score)||0))[0]||e[0]||null}async function Ck(e=9e3){const t=Date.now();for(;Date.now()-t<e;){const a=Pk();if(a)return a;if(!R.running)return null;await La(500)}try{return((await k("/api/web/live-pairs?bucket=live&sort=fresh"))?.livePairs?.rows||[]).find(o=>o?.tokenMint)||null}catch{return null}}async function Lk(e,t=4e3){const a=Date.now();for(;Date.now()-a<t;){if(document.querySelector(e))return!0;if(!R.running)return!1;await La(250)}return!1}function xk(){return new Promise(e=>{vr(`
      <div style="color:#72ff23;font-weight:900;font-size:clamp(20px,6vw,28px);">🎬 TRAILER MODE</div>
      <div style="color:#d6ffbf;font-size:clamp(13px,3.8vw,16px);margin-top:14px;max-width:420px;line-height:1.5;">
        1. Start your phone's <b>screen recorder</b> now<br>
        (Control Center on iPhone / quick tile on Android)<br>
        2. Come back and tap GO
      </div>
      <button type="button" data-trailer-go style="pointer-events:auto;margin-top:22px;background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:14px 44px;font-weight:900;font-size:18px;cursor:pointer;">GO</button>
      <div style="color:#7d937a;font-size:11px;margin-top:14px;">the performance starts on a 3-2-1 after you tap</div>
    `),R.root.querySelector("[data-trailer-go]")?.addEventListener("click",()=>e(!0),{once:!0})})}async function Mk(){if(R.running)return;R.running=!0,ds(),bk();const e=await $k(),t=gk();if(!e&&(await xk(),!R.running))return;$e("/terminal/live-pairs"),vr('<div style="color:#72ff23;font-weight:900;font-size:clamp(18px,5vw,24px);animation:twPulse 1.2s infinite;">locking onto live pairs...</div>');const a=await Ck(9e3);if(!R.running)return;const r=3,o=6.5,s=9,c=6.5,l=4.6,u=[r,r+o,r+o+s,r+o+s+c],d=r+o+s+c+l;wk(u,d);const f=(R.audio?.ctx?.currentTime||0)+.05;for(let g=0;g<r;g+=1)vk(f+g,600+g*90);for(let g=r;g>=1;g-=1){if(!R.running)return;vr(`<div style="color:#72ff23;font-size:clamp(64px,22vw,110px);font-weight:900;text-shadow:0 0 30px rgba(114,255,35,0.75);animation:twPulse 1s infinite;">${g}</div>`),await La(1e3)}if(vr(""),!R.running)return;ps(),ms("FRESH PAIRS. SECONDS OLD.","every pump.fun launch lands here instantly"),await La(o*1e3);const y=a?.symbol?`$${String(a.symbol).slice(0,12)}`:"live pair";if(R.running&&a?.tokenMint){ps(),$e(`/terminal/chart?token=${encodeURIComponent(a.tokenMint)}`);const g=await Lk("iframe[src*='dexscreener'], .smart-chart-terminal iframe, [data-chart] canvas",4500);if(!R.running||(ms("CHARTS WITH A BRAIN",`${y} - live candles, live flow, shield verdict on top`),await La((g?s:4)*1e3),!R.running))return;ps(),bp(a.tokenMint),ms("TRIPLE-ENGINE RUG CHECK","SlimeShield x Rugcheck x GoPlus - dodge the rug BEFORE you ape"),await La(c*1e3),rl()}R.running&&(ms(""),ps(),vr(`
    <div style="color:#72ff23;font-size:clamp(38px,11vw,76px);font-weight:900;letter-spacing:0.05em;animation:twGlow 1.6s infinite, twPulse 1.6s infinite;">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(15px,4.4vw,23px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:clamp(10px,3vw,12px);margin-top:26px;">Live market data. Not financial advice.</div>
  `),await La(l*1e3),xl("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),R.running||Mk())});
