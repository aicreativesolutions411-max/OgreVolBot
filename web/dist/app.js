import{canSubmitPerpOrder as fm,createPerpsProvider as hm,ogreTekRouteStatus as gm,resolveOgreTekConfig as bm,shouldShowOgreTekNav as ym,validatePerpOrder as vm}from"./perps.js";import{smartChartSuggestion as wm,tradeActionLabelFromPreset as Sm}from"./liveTerminalUi.js";const La=window.OGRE_PORTAL_CONFIG||{},km=La.featureFlags||{};function _(e,t=!0){const a=km?.[e];return a==null||a===""?!!t:typeof a=="boolean"?a:["1","true","yes","on"].includes(String(a).toLowerCase())}const Xt=La.pumpLive||{},ke=bm(La),$m=!1,vr=hm(ke),Tm=String(La.apiBase||"").trim().replace(/\/+$/,""),Am=window.location.origin.replace(/\/+$/,""),Li="https://ogrevolbot.onrender.com",Pt=String(La.shareUrl||La.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",xi=[Tm,window.location.hostname.endsWith("onrender.com")?Am:"",Li].filter(Boolean);let wr=xi[0]||Li;const wn=6e4,fs=15e3,Jt=1e4,hs=8e3,Sn=8e3,Mi=new Map,Pm=new Map,ft=Pm,Yt=new Set,Sr=new Map,kk=new Map,kn={},te=18e4,gs="slimewireMobileWalletPending",bs="slimewireMobileWalletPendingBackup",Cm="slimewireMobileWalletSession:",Bi="slimewirePerfLog",Ri="slimewireCrashLog",Lm="slimewireTerminalFeedLog",Ii="slimewireOgreAiRecentMints",Oi="slimewireOgreAiFormPreset",xm=150,Mm=1500,Bm=1e4,Rm=140,Ei="live-pairs-inflight",Im=[1200,4500,1e4],Om=15e3,Fi=650,Em=3500,Fm=12e3,Wm=3e4,Dm=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Wi="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",Nm=new Map([...Wi].map((e,t)=>[e,t]));function _m(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function $n(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function ys(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function Di(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function Ni(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function vs(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function Um(){try{const e=JSON.parse(window.localStorage?.getItem(Bi)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function qm(){try{const e=JSON.parse(window.localStorage?.getItem(Ri)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function _i(){try{const e=JSON.parse(window.sessionStorage?.getItem(Ii)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function Hm(e){const t=[...Array.isArray(e?.plans)?e.plans.map(o=>o?.tokenMint||o?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(o=>o?.tokenMint):[]].map(o=>String(o||"").trim()).filter(Boolean);if(!t.length)return;const a=new Set,r=[..._i(),...t].filter(o=>a.has(o)?!1:(a.add(o),!0)).slice(-30);try{window.sessionStorage?.setItem(Ii,JSON.stringify(r))}catch{}}function Ui(){try{const e=JSON.parse(window.sessionStorage?.getItem(Oi)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function Km(e={}){try{window.sessionStorage?.setItem(Oi,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function qi(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),a=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(a||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function Vm(){let e={};try{e=JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{e={}}try{const t=new URLSearchParams(window.location.search);if(t.has("lc_n")||t.has("lc_s")){const a={lc_n:"name",lc_s:"symbol",lc_d:"description",lc_x:"x",lc_tg:"telegram",lc_web:"website"};for(const o in a){const s=t.get(o);s&&(e[a[o]]=o==="lc_s"?s.toUpperCase().slice(0,12):s)}const r=t.get("lc_dev");r&&Number(r)>0&&(e.devBuySol=String(r),e.devBuyEnabled=!0);try{xa(e)}catch{}try{window.history.replaceState(null,"",window.location.pathname+window.location.hash)}catch{}}}catch{}return e}function xa(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,String(t.bannerDataUrl||"").length>=15e5&&delete t.bannerDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function zm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function jm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function Gm(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const Hi="slimewireIntroCompleteV1";function Ki(){try{return window.sessionStorage?.getItem(Hi)==="true"}catch{return!1}}function Xm(){try{window.sessionStorage?.setItem(Hi,"true")}catch{}}function Tn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const n={token:_m(),user:null,route:qa(window.location.pathname),activeTab:window.location.pathname.includes("/launch-coin")||/[?&]lc_n=/i.test(window.location.search)?"launchCoin":window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:Um(),crashLog:qm(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:Vm(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:zm(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:Di(),loginCollapsed:!0};let Ma=null,kr="";const ws=new Set;let Ba=null,$r="",Ra=null,Tr="",Qt=null,Ia=null,et=0,Oa=null,Ar="",Ea=null,Pr="",Cr=null,Ct=[],Lr=null,xr=null,Mr=!1,An=[],Ss=null,Zt=null,ea=null,Pn=null,ks="",Vi=0,Jm=0,$s=0,Br=null,Fa=!1;const Rr=new Map,Ts={},ta=new Map,Wa=[];let As=null,Ps=null,Cs=null,Ls=null,xs=null,Ms=0,Bs=new Set,Rs=null,aa=null,Ir=null,Is=null,zi=Date.now();function Da(){return!!(n.slimeShieldDetails?.open||n.devInfoDetails?.open||n.kolDumpDetails?.open||n.replayDetails?.open)}function Na(){Ma&&clearTimeout(Ma),Ma=null,kr=""}function Or(){Da()||(ca(),_a("details-close"))}function Ym(e,t){const a=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const i=a(c);i&&!r.has(i)&&r.set(i,c)}let o=e.querySelector(":scope > .signal-header")||null;const s=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const i=a(c);let u=i?r.get(i):null;u?(s.add(i),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,o?o.nextElementSibling!==u&&o.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),o=u}for(const[c,i]of r)s.has(c)||i.remove()}function Qm(e,t){const a=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!a?e.insertBefore(r,e.firstChild):a&&!r?a.remove():a&&r&&a.innerHTML!==r.innerHTML&&(a.innerHTML=r.innerHTML);for(const o of["[data-cooks-best]","[data-cooks-newest]"]){const s=e.querySelector(`:scope > ${o}`),c=t.querySelector(`:scope > ${o}`);if(!c){s&&s.remove();continue}if(!s)return!1;const i=s.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");i&&u&&i.innerHTML!==u.innerHTML&&(i.innerHTML=u.innerHTML);const d=s.querySelector(":scope > .signal-list"),p=c.querySelector(":scope > .signal-list");d&&p?Ym(d,p):d!==p&&s.replaceWith(c)}return!0}let ji=0;if(typeof window<"u"){const e=()=>{ji=Date.now()};window.addEventListener("wheel",e,{passive:!0}),window.addEventListener("touchmove",e,{passive:!0}),window.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Spacebar"].includes(t.key)&&e()},{passive:!0})}function Zm(){if(n.activeTab!=="live"&&n.activeTab!=="terminal")return!1;const e=m("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const a=De(),r=be(a?.rows||[]),o=mn(r);if(!o.length)return!1;const s=Gn(),c=[];{const p=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<p){const g=f.getAttribute("data-token-chart")||"";if(g&&c.push({mint:g,top:y}),c.length>=6)break}}}const i=document.createElement("div");i.innerHTML=di(o);const u=i.querySelector(".cooks-feed");if((!u||!Qm(t,u))&&(t.outerHTML=di(o)),c.length&&(s||Date.now()-ji>450)){const p=e.querySelector(".cooks-feed");for(const f of c){const y=p?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const g=y.getBoundingClientRect().top-f.top;Number.isFinite(g)&&Math.abs(g)>1&&window.scrollBy(0,g);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const p=xt.find(([f])=>f===n.livePairBucket)?.[1]||"Live";d.textContent=`${p} | ${o.length} live`}return!0}function _a(e="live-pairs-batch"){if(e&&Bs.add(String(e)),xs||Ms)return;const t=()=>{const a=Array.from(Bs);if(xs=null,Bs=new Set,Ms=0,n.route!=="terminal"||!["terminal","live","slimeScope"].includes(n.activeTab)||Da()||(W({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(De()?.rows)?De().rows.length:0,details:a.length?a.slice(-3).join(" | "):e}),(n.activeTab==="live"||n.activeTab==="terminal")&&Zm()))return;const r=dl();h(),pl(r)};xs=window.setTimeout(()=>{Ms=window.requestAnimationFrame(t)},Rm)}const m=e=>document.querySelector(e);function G(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const v=(e,t)=>{e&&(e.textContent=t)},Re=(e,t)=>{v(m(e),t)},Lt=(e,t)=>{const a=m(e);a&&(a.hidden=t)},se=m("[data-app]"),Cn=m("[data-login]"),Gi=m("[data-connect]"),Os=m("[data-top-login]"),Ae=m("[data-login-modal]"),Xi=m("[data-auth-actions]"),Ji=m("[data-guest-actions]"),Yi=m("[data-session-actions]"),ae=m("[data-dashboard]"),ef=m("[data-error]"),tf=m("[data-dashboard-error]");function ne(e){if(!_("debugPerformanceCounters",!1))return;const t=String(e||"counter");kn[t]=Number(kn[t]||0)+1,(kn[t]<=5||kn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,kn[t])}const xt=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],af=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],Es=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],Ua=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],nf=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],rf=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],of=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],sf=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],lf=Object.fromEntries(sf.map(e=>[e.tabKey,e])),cf=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function Qi(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function Zi(e,t=""){const a=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return Qi(a)===Qi(t)}function uf(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!Zi(e,t))return t;const a=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return a.includes("phantom")?za("phantom"):a.includes("solflare")?za("solflare"):a.includes("wallet")||a.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":a.includes("powered-by")||a.includes("wordmark")||a.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":mi(e?.alt||a||"slimewire")}function ec(e,t="",a="fallback"){try{console.info("[slimewire_image_fallback]",{action:a,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function df(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const a=uf(t);if(!a||Zi(t,a)){t.hidden=!0,ec(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=a,ec(t,a,"fallback")}function Fs(){Fs.installed||(Fs.installed=!0,document.addEventListener("error",df,!0))}function Ws(){if(!Ws.started){Ws.started=!0;for(const e of cf)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function qa(e=window.location.pathname){return(e==="/"||e==="")&&Ki()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function pf(){if(Ki()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let Ln=null;function Ds(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(Ln||(Ln=new e),Ln.state==="suspended"&&Ln.resume().catch(()=>{}),Ln):null}catch{return null}}function mf(){const e=Ds();if(!(!e||e.state!=="running"))try{const t=e.currentTime,a=1.7,r=Math.floor(e.sampleRate*a),o=e.createBuffer(1,r,e.sampleRate),s=o.getChannelData(0);for(let f=0;f<r;f+=1)s[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=o;const i=e.createBiquadFilter();i.type="bandpass",i.Q.value=.7,i.frequency.setValueAtTime(280,t),i.frequency.exponentialRampToValueAtTime(3400,t+.55),i.frequency.exponentialRampToValueAtTime(170,t+a);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+a),c.connect(i).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const p=e.createGain();p.gain.setValueAtTime(1e-4,t),p.gain.exponentialRampToValueAtTime(.38,t+.08),p.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(p).connect(e.destination),c.start(t),c.stop(t+a),d.start(t),d.stop(t+1.2)}catch{}}function ff(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),a=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let o=!1,s=null;const c=()=>n.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),i=T=>{t&&(t.dataset.introPhase=T)},u=T=>{r&&(r.textContent=T,r.hidden=!T)},d=()=>{o||(o=!0,s&&(clearTimeout(s),s=null),i("portal"),mf(),Xm(),setTimeout(()=>{Tn({reset:!0}),$e("/connect")},620))};if(!c()){Tn({reset:!0});return}const p=()=>{o||(Ds(),a&&a.muted&&(a.muted=!1,a.volume=1,a.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(T=>{document.addEventListener(T,p,{once:!0,passive:!0})}),a&&(a.preload="auto",a.playsInline=!0,a.autoplay=!0,a.setAttribute("autoplay",""),a.setAttribute("playsinline",""),a.disablePictureInPicture=!0,!a.getAttribute("src")&&a.dataset.introSrc&&(a.src=a.dataset.introSrc));const f=T=>{s&&clearTimeout(s),s=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,T)))},y=()=>{if(o||!c())return;const T=b=>{if(!a)return;a.muted=b,a.volume=b?0:1;const A=a.play?.();A?.catch&&A.catch(()=>{b?u(""):T(!0)})};Ds(),T(!1)};a?.addEventListener("loadedmetadata",()=>{const T=Number(a.duration);f(Number.isFinite(T)&&T>0?(T+2.5)*1e3:9e3)}),a?.addEventListener("ended",d),a?.addEventListener("error",()=>{f(1500)});let g=!1,S=null;const P=()=>{g||o||!c()||(g=!0,y())};a?(a.readyState>=4?P():(a.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),a.addEventListener("waiting",()=>{!g||o||(S&&clearTimeout(S),S=setTimeout(()=>{c()&&d()},900))}),["playing","timeupdate"].forEach(T=>a.addEventListener(T,()=>{S&&(clearTimeout(S),S=null)}))):P(),f(11e3)}function tc(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function Ns({keepLogin:e=!1}={}){n.walletConnectMenuOpen=!1,e||(n.loginModalOpen=!1),n.quickBuyModal?.open&&(n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""}),Kn()}function $e(e,t=null){const a=L(),r=e||"/terminal";n.route=qa(r),Ns({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.route==="terminal"&&(n.activeTab=t||tc(r)),n.route!=="intro"&&Tn({reset:!0}),window.history.pushState({},"",r),Nl(),h(),H("route-change",a,{component:"router",details:r})}window.addEventListener("popstate",()=>{n.route=qa(),Ns({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.activeTab=tc(),n.route!=="intro"&&Tn({reset:!0}),Nl(),h()});let ac=!1;function _s(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Er(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),_s()}function hf(e){if(!e)return;const t=!e.open;if(Er(e),e.open=t,t){const a=e.closest("[data-market-ticker]"),o=e.querySelector("summary")?.getBoundingClientRect?.();if(a&&o){const s=Math.max(10,Math.min(window.innerWidth-10,o.left+o.width/2)),c=Math.max(30,o.bottom+4);a.style.setProperty("--ticker-menu-left",`${Math.round(s)}px`),a.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}_s()}function gf(){ac||(ac=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Er();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Er(),80);return}const a=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");a&&(e.preventDefault(),e.stopPropagation(),hf(a.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&_s()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Er()}))}function Ha(e){return`${wr}${e}`}function L(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function na(e){try{window.performance?.mark?.(e)}catch{}}function ye(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function nc(e={}){Wa.push(e),Wa.length>10&&Wa.splice(0,Wa.length-10),!As&&(As=window.setTimeout(()=>{As=null;const t=Wa.splice(0,Wa.length);for(const a of t)try{const r=JSON.stringify(a),o=Ha("/api/web/perf-event");if((o.charAt(0)==="/"||o.indexOf(location.origin)===0)&&navigator.sendBeacon){const c=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(o,c))continue}fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function Us(e,t,a){if(a==="perf"&&Ps||a==="crash"&&Cs||a==="feed"&&Ls)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},o=window.setTimeout(()=>{a==="perf"&&(Ps=null),a==="crash"&&(Cs=null),a==="feed"&&(Ls=null),r()},Mm);a==="perf"&&(Ps=o),a==="crash"&&(Cs=o),a==="feed"&&(Ls=o)}function W(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&ne("slowApiRequestWarning");const a={at:new Date().toISOString(),route:ye(e.route||n.route||qa(),40),component:ye(e.component||"",60),action:ye(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ye(e.requestId||"",80),errorCode:ye(e.errorCode||"",60),details:ye(e.details||"",140)};return n.perfLog=[...n.perfLog||[],a].slice(-100),Us(Bi,()=>n.perfLog,"perf"),(a.durationMs>=xm||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(a.action))&&nc(a),a}function H(e,t,a={}){W({...a,action:e,durationMs:L()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",a=""){na("chartFirstPaint"),W({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!Je(a)?.cacheHit,stale:!!Je(a)?.stale,details:`${ye(t,20)}:${ye(a,60)}`})};function qs(e={}){const t={at:new Date().toISOString(),route:ye(e.route||n.route||qa(),40),actionBeforeCrash:ye(e.actionBeforeCrash||n.postTradeRefresh?.action||"",70),errorCode:ye(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ye(e.message||"",160),component:ye(e.component||"",80),requestId:ye(e.requestId||n.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return n.crashLog=[...n.crashLog||[],t].slice(-50),Us(Ri,()=>n.crashLog,"crash"),nc({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function bf(){n.crashInstrumentationInstalled||(n.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||qs({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};qs({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function ht(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function Hs(e="",t="",a=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(a||"").trim()}`}function tt(e="",t="",a=""){const r=Hs(e,t,a),o=n.tradeActionLocks?.[r];return o&&["clicked","submitting","submitted","confirming"].includes(o.state)?o:null}function V(e="",t="",a="",r={}){const o=Hs(e,t,a),s=n.tradeActionLocks?.[o]||{};n.tradeActionLocks={...n.tradeActionLocks||{},[o]:{...s,action:e,tokenMint:t,detail:a,updatedAt:new Date().toISOString(),...r}},le()}function Pe(e="",t="",a="",r=2400){const o=Hs(e,t,a);window.setTimeout(()=>{const s=n.tradeActionLocks?.[o];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const c={...n.tradeActionLocks||{}};delete c[o],n.tradeActionLocks=c,le(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},r)}function Fr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function Ks(e="",t=""){const a=n.manualSellActions?.[Fr(e,t)];return a&&["clicked","submitting","submitted","confirming"].includes(a.state)?a:Object.entries(n.manualSellActions||{}).find(([r,o])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(o?.state))?.[1]||null}function ra(e,t,a={}){const r=Fr(e,t),o=n.manualSellActions?.[r]||{};n.manualSellActions={...n.manualSellActions||{},[r]:{...o,tokenMint:e,percent:String(t||o.percent||"100"),updatedAt:new Date().toISOString(),...a}},le()}function Vs(e,t,a=2400){const r=Fr(e,t);window.setTimeout(()=>{const o=n.manualSellActions?.[r];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const s={...n.manualSellActions||{}};delete s[r],n.manualSellActions=s,le(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},a)}function Ka(e,t={}){const a=L(),r=t.startedAt||n.positionRefreshAction?.startedAt||a;n.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(n.positionRefreshAction?.minUntil||0,a+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},le()}function He(e,t={}){const a=n.positionRefreshAction?.minUntil||0,r=Math.max(0,a-L());Lr&&window.clearTimeout(Lr),Lr=window.setTimeout(()=>{Lr=null,Ka(e,t),h(),e==="success"&&window.setTimeout(()=>{n.positionRefreshAction?.state==="success"&&(n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},le(),h())},900)},r)}function Mt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function le(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(s=>{const c=s.dataset.positionSell||"",i=s.dataset.positionSellPercent||"",u=Ks(c,i),d=Mt(s),p=n.manualSellActions?.[Fr(c,i)],f=!!u;s.disabled=f,s.dataset.actionState=p?.state||u?.state||"idle",f?p?.state==="submitted"||p?.state==="confirming"?s.textContent="Submitted":s.textContent="Selling...":s.textContent=d});const e=String(n.tradeToken||m("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(s=>{const c=s.dataset.tradeBuyQuick||(s.matches("[data-trade-buy-max]")?"max":"custom"),i=tt("trade-buy",e,c),u=Mt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(s=>{const c=s.dataset.quickTradeToken||"",i=lt(),u=qe(i)||i?.amountSol||"quick",d=tt("trade-buy",c,String(u)),p=Mt(s);s.disabled=!!d,s.dataset.actionState=d?.state||"idle",s.textContent=d?d.state==="submitted"?"Submitted":"Buying...":p}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(s=>{const c=s.dataset.tradeSellQuick||"custom",i=tt("trade-sell",e,c),u=Mt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(s=>{const c=s.dataset.chartConfirmBuy||n.smartChartToken||"",i=X(m("[data-chart-buy-amount]")?.value||"")||"custom",u=tt("trade-buy",c,String(i)),d=Mt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(s=>{const c=s.dataset.chartConfirmSell||n.smartChartToken||"",i=m("[data-chart-sell-percent]")?.value||"100",u=Ks(c,i),d=Mt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(n.bundleToken||m("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(s=>{const c=s.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",i=tt(c,t,"bundle"),u=Mt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const a=(s,c)=>{const i=Mt(s),u=s.matches?.("[data-top-refresh-wallet]");if(s.dataset.actionState=c,s.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){s.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",s.textContent=i||"Refresh";return}c==="clicked"||c==="refreshing"?s.textContent="Refreshing...":c==="success"?s.textContent="Updated":c==="error"?s.textContent="Failed":s.textContent=i},r=n.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(s=>{a(s,r)});const o=n.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(s=>{a(s,o)})}function yf(){if(!n.perfInstrumentationInstalled){n.perfInstrumentationInstalled=!0,na("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries())Number(a.duration||0)<50||W({component:"main-thread",action:"long-task",durationMs:a.duration,details:a.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries()){const r=Number(a.duration||0);r<80||W({component:"input",action:"interaction-delay",durationMs:r,details:a.name||a.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Ce(e){return new Promise(t=>setTimeout(t,e))}function N(e="",t={}){const a=String(e||"");return t.preserveSafeError?a:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(a)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":a}async function xn(e,t={},a=wn){const r=new AbortController,o=setTimeout(()=>r.abort(),a);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(o)}}async function rc(e){try{await xn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:a=wn,preserveSafeError:r=!1,dedupe:o=!0,...s}=t||{},c=String(s.method||"GET").toUpperCase(),i=L(),u=o&&c==="GET"?`${c}:${e}:${n.token?n.token.slice(0,12):"guest"}`:"";if(u&&ta.has(u))return ne("duplicateApiRequestsPrevented"),W({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),ta.get(u);const d=(async()=>{const p={"Content-Type":"application/json",...s.headers||{}};n.token&&(p.Authorization=`Bearer ${n.token}`);let f,y=null;try{f=await xn(Ha(e),{...s,headers:p,cache:"no-store"},a)}catch(S){y=S,await rc(wr),await Ce(900);try{f=await xn(Ha(e),{...s,headers:p,cache:"no-store"},a)}catch(P){y=P;for(const T of xi)if(T!==wr)try{await rc(T),f=await xn(`${T}${e}`,{...s,headers:p,cache:"no-store"},a),wr=T;break}catch(b){y=b}if(!f){const T=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${T} SlimeWire could not connect right now. Try again in a moment.`)}}}const g=await oc(f);if(!f.ok||g.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(g.launchAttemptId||g.launch?.launchAttemptId),P=N(g.message||g.launch?.failureReason||g.error||`HTTP ${f.status}`,{preserveSafeError:S}),T=new Error(P);throw T.status=f.status,T.data=g,T.code=g.errorCode||g.launch?.errorCode||g.error||"",T.stage=g.stage||g.launch?.stage||"",T.launchAttemptId=g.launchAttemptId||g.launch?.launchAttemptId||"",T.providerStatus=g.providerStatus||g.launch?.providerStatus||null,f.status===401&&If(P),T}return H("api-request",i,{component:"api",details:e,resultCount:Array.isArray(g?.rows)?g.rows.length:0}),g})();return u&&(ta.set(u,d),d.then(()=>{ta.get(u)===d&&ta.delete(u)},()=>{ta.get(u)===d&&ta.delete(u)})),d}async function oc(e){const t=e.headers.get("content-type")||"",a=await e.text();if(!a.trim())return{};try{return JSON.parse(a)}catch{const r=a.toLowerCase(),o=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:o?"payload_too_large":"invalid_api_response",message:o?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function vf(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function pe(e){e&&(n.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(n.xHandle=Xe(e.xHandle),n.xHandle?Ni(n.xHandle):vs()):n.xHandle||(n.xHandle=Di()))}function Wr(e){for(const t of e){const a=Bn(t);if(a&&!a.closest("[hidden]"))return String(a.value||"")}for(const t of e){const a=m(t);if(a)return String(a.value||"")}return""}function Mn(){const e=m("[data-connect-status]");return e&&!e.closest("[hidden]")?e:Bn("[data-login-status]")||e}function Bn(e){const t=[...document.querySelectorAll(e)];return t.find(a=>!a.closest("[hidden]")&&a.offsetParent!==null)||t.find(a=>!a.closest("[hidden]"))||t[0]||null}function Rn(){return Bn("[data-wallet-connect-modal] [data-wallet-connect-status]")||Bn("[data-wallet-connect-status]")}function re(e=""){n.walletConnectStatus=String(e||""),v(Rn(),n.walletConnectStatus)}function sc(e="solana"){const t=Ee(e);return Ke()?On(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:mc(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Bt(e="solana",t=null,a={}){const r=me(e),o={walletName:Ee(e,r),userId:n.user?.id||"",route:n.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...a};try{console.warn("[slimewire_wallet_connect]",o)}catch{}}function lc(e=n.route==="connect"){window.setTimeout(()=>{const t=n.loginModalOpen?`[data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";Bn(t)?.focus?.()},0)}function wf(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(Ss=e)}function Sf(){const e=Ss;Ss=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function ic({restoreFocus:e=!0}={}){const t=!!n.loginModalOpen;n.loginCollapsed=!0,n.loginModalOpen=!1,h({force:!0}),t&&e&&Sf()}function kf(){return!Ae||Ae.hidden||!n.loginModalOpen?[]:[...Ae.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function $f(e){if(!n.loginModalOpen||e.key!=="Tab"||!Ae||Ae.hidden)return!1;const t=kf();if(!t.length)return!1;const a=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===a?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),a.focus({preventScroll:!0}),!0):!1}function Va(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Tf(e=Va()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function cc(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Af(e="unknown"){const t=Date.now();if(t-Number(n.lastLockInClickAt||0)<300)return;n.lastLockInClickAt=t;const a={route:cc(n.route||qa(),40),viewport:Math.round(window.innerWidth||0),source:cc(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(a),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",a)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(a)}).catch(()=>{})}catch{}}function uc({defaultTab:e="login",returnTo:t=Va(),source:a="unknown",connectPanel:r=n.route==="connect"}={}){if(wf(),Af(a),n.loginModalOpen=!0,n.loginModalTab=e==="create"?"create":"login",n.loginReturnTo=t||Va(),n.loginCollapsed=!1,n.walletConnectMenuOpen=!1,!Ae&&!Os){window.location.assign(Tf(n.loginReturnTo));return}h({force:!0}),lc(r)}function dc(e={}){uc(e)}function Ke(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function pc(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Pf(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function mc(e=""){if(!Ke())return"";const t=encodeURIComponent(pc()),a=encodeURIComponent(Pf());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${a}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${a}`:""}function zs(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function za(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function js(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let a=0n;for(const o of t)a=(a<<8n)+BigInt(o);let r="";for(;a>0n;){const o=Number(a%58n);r=Wi[o]+r,a/=58n}for(const o of t){if(o!==0)break;r="1"+r}return r||"1"}function Dr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let a=0n;for(const o of t){const s=Nm.get(o);if(s===void 0)throw new Error("Invalid wallet callback encoding.");a=a*58n+BigInt(s)}const r=[];for(;a>0n;)r.unshift(Number(a&255n)),a>>=8n;for(const o of t){if(o!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Cf(e="phantom",t="",a=n.walletConnectReturnPath||"/terminal",r=""){const o=new URL(a||window.location.pathname||"/terminal",window.location.origin);return o.searchParams.delete("sw_wallet"),o.searchParams.delete("sw_wallet_state"),o.searchParams.delete("sw_wallet_pending"),o.searchParams.delete("phantom_encryption_public_key"),o.searchParams.delete("solflare_encryption_public_key"),o.searchParams.delete("nonce"),o.searchParams.delete("data"),o.searchParams.delete("errorCode"),o.searchParams.delete("errorMessage"),o.searchParams.set("sw_wallet",e),o.searchParams.set("sw_wallet_state",t),r&&o.searchParams.set("sw_wallet_pending",r),o.toString()}function In(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function fc(){try{const e=window.sessionStorage?.getItem(gs)||window.localStorage?.getItem(bs)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function Lf(e){try{window.sessionStorage?.setItem(gs,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(bs,JSON.stringify(e))}catch{}}function Gs(){try{window.sessionStorage?.removeItem(gs)}catch{}try{window.localStorage?.removeItem(bs)}catch{}}function hc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function On(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function xf(e="",t={}){const a=On(e);if(!a)return"";const r=new URL(a);return r.searchParams.set("app_url",pc()),r.searchParams.set("redirect_link",Cf(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function oa(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ke()?"mobile":"desktop"}function gc(e=""){return Ke()&&!!On(e)}function Mf(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Bf(e="",t="/terminal"){try{const a=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:wn,body:JSON.stringify({provider:e,intendedRoute:t,platform:oa(),browser:Mf()})});return!a.pendingConnectId||!a.stateId||!a.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:a.pendingConnectId,stateId:a.stateId,returnPath:a.intendedRoute||t,dappEncryptionPublicKey:a.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:a.expiresAt||"",serverManaged:!0}}catch(a){return Bt(e,a,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:oa()}),null}}function Rf(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const a=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:js(r),returnPath:t,dappEncryptionPublicKey:js(a.publicKey),dappEncryptionSecretKey:js(a.secretKey),createdAt:Date.now(),serverManaged:!1}}async function bc(e="",{returnPath:t=n.walletConnectReturnPath||"/terminal"}={}){if(!gc(e))return!1;const a=await Bf(e,t)||Rf(e,t);if(!a)return!1;Lf(a);const r=xf(e,a);if(!r)return!1;const o=Ee(e);return re(`Opening ${o} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Bt(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:oa()}),window.location.assign(r),!0}function yc(e=""){const t=Ee(e),a=mc(e);return a?(re(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Bt(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:oa()}),window.location.href=a,!0):!1}function vc({requirePassword:e=!1}={}){const t=Wr(["[data-connect-login-username]","[data-login-username]"]).trim(),a=Wr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!a&&!e)return{};if(!t)throw new Error("Enter your username.");if(!a)throw new Error("Enter your password.");return{username:t,password:a}}function If(e=""){n.token="",n.user=null,n.loading=!1,ys(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function Y(e=null,t="Creating secure web profile..."){if(n.user&&n.token)return n.user;v(e,t);const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:qi()})});return n.token=a.token,pe(a.user),$n(n.token),n.user}function $(e=""){[ef,tf].forEach(t=>{t&&(t.hidden=!e,v(t,e))})}function Q(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Of(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function wc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function Xs(){$("");const e=Mn();try{const t=vc();v(e,t.username?"Creating saved login...":"Creating account...");const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:qi()})});n.token=a.token,pe(a.user),$n(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,t.username?"Account created. Login saved.":"Quick web account created."),K(a.trade?.signature,"account-create")}catch(t){v(e,t.message),$(t.message)}}async function Sc(){$("");const e=Mn();try{const t=vc({requirePassword:!0});v(e,"Logging in...");const a=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});n.token=a.token,pe(a.user),$n(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(a.trade?.signature,"password-login")}catch(t){v(e,t.message),$(t.message)}}function kc(){return Wr(["[data-connect-login-email]","[data-login-email]"]).trim()}function Ef(){return Wr(["[data-connect-login-code]","[data-login-code]"]).trim()}function $c(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function Ff(){$("");const e=Mn();try{const t=$c(kc());v(e,"Sending login code...");const a=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});v(e,a.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){v(e,t.message),$(t.message)}}async function Wf(){$("");const e=Mn();try{const t=$c(kc()),a=Ef();if(!a)throw new Error("Enter the login code from your email.");v(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:a})});n.token=r.token,pe(r.user),$n(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",v(e,"Logged in."),K(r.trade?.signature,"email-code-login")}catch(t){v(e,t.message),$(t.message)}}function Tc(e="",t=new URLSearchParams){const a=fc(),r=t.get("sw_wallet_state")||"";if(!a.stateId||a.stateId!==r||a.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(a.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const o=t.get(hc(e))||"",s=t.get("nonce")||"",c=t.get("data")||"";if(!o||!s||!c)throw new Error("Wallet approval did not return the expected connection data.");const i=window.nacl;if(!i?.box?.before||!i.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=i.box.before(Dr(o),Dr(a.dappEncryptionSecretKey)),d=i.box.open.after(Dr(c),Dr(s),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const p=JSON.parse(new TextDecoder().decode(d)),f=String(p.public_key||p.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(p.session||""),walletEncryptionPublicKey:o,dappEncryptionPublicKey:a.dappEncryptionPublicKey,returnPath:a.returnPath||"/terminal"}}async function Ac(e="",t={}){const a=Rn();await Y(a,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Ee(e)})});pe(r.user||{...n.user,connectedWallet:r.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:Ee(e),tokens:[]};try{window.sessionStorage?.setItem(`${Cm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Gs(),In(),n.walletConnectMenuOpen=!1,re(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),$e(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),_r("mobile-wallet-connect")}function Df(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||fc().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(a=>a!=="data"&&a!=="nonce"),walletEncryptionPublicKey:t.get(hc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function Nf(e="",t={}){t.token&&(n.token=t.token,$n(n.token)),pe(t.user||{...n.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const a=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";a&&(n.connectedWalletBalance={publicKey:a,shortPublicKey:w(a),provider:t.provider||Ee(e),tokens:[]}),Gs(),In(),n.walletConnectMenuOpen=!1,re(a?`Connected ${w(a)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),$e(t.finalRedirectRoute||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),_r("mobile-wallet-callback")}async function Pc(e="",t=new URLSearchParams){const a=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:wn,body:JSON.stringify(Df(e,t))});return await Nf(e,a),!0}async function _f(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;n.walletConnectMenuOpen=!0;const a=Ee(t),r=e.get("sw_wallet_pending")||"",o=e.get("errorCode")||"",s=e.get("errorMessage")||"";if(o||s)return r&&await Pc(t,e).catch(()=>{}),Gs(),In(),re(`${a} did not connect: ${s||o||"request cancelled"}. Choose another wallet or try again.`),Bt(t,new Error(s||o||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:oa()}),h({force:!0}),!0;try{if(re(`Finishing ${a} mobile connection...`),r)await Pc(t,e);else{const c=Tc(t,e);await Ac(t,c)}}catch(c){if(r)try{const i=Tc(t,e);await Ac(t,i)}catch{re(`${a} mobile connection could not finish: ${c.message}`),Bt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:oa()}),In(),h({force:!0})}else re(`${a} mobile connection could not finish: ${c.message}`),Bt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:oa()}),In(),h({force:!0})}return!0}async function Uf(){$("");const e=Rn()||Mn();try{v(e,"Choose a wallet provider to connect."),ua({returnPath:"/terminal"})}catch(t){v(e,t.message),$(t.message)}}async function qf(){n.user||await Xs(),n.user&&(n.walletConnectMenuOpen=!1,n.route="terminal",n.activeTab="wallets",n.toolSections={...n.toolSections||{},wallets:n.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),n.wallets.length||await sd())}async function Hf(){if(n.logoutPending)return;if(!n.user){n.loginCollapsed=!1,h(),Cn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await Hu("logging out");const e=String(n.token||"");n.logoutPending=!0;const t=m("[data-logout]");t&&(t.disabled=!0,v(t,"Logging out...")),n.token="",n.user=null,n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="",n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},n.manualSellActions={},n.tradeActionLocks={},n.ogreAgentStatus="",bi(),ys(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{n.logoutPending=!1}}async function Kf(){if(!n.token){h();return}try{const e=await k("/api/web/me");pe(e.user),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Ne({force:!1,deep:!1,reason:"session-load"}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})})}catch{n.token="",ys(),h()}}async function sa(e={}){const t=L();if(!n.user||!n.token){n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.launchWatches=[],n.presets={trade:[],bundle:[]},n.tradePlans=[],n.watchlist={rows:[],count:0},h();return}const a=!e.silent;a&&(n.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,g,S,P,T]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.pnl=y.pnl||null,n.launchWatches=g.watches||[],n.presets=S.presets||{trade:[],bundle:[]},Ad(),n.watchlist=P.watchlist||{rows:[],count:0},n.tradePlans=T.plans||[],uo();return}const[o,s,c,i,u,d,p,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.wallets=o.wallets||[],n.balances=s.balances||[],n.connectedWalletBalance=s.connectedWallet||c.connectedWallet||null,n.positions=c.positions||[],n.pnl=i.pnl||null,n.launchWatches=u.watches||[],n.presets=d.presets||{trade:[],bundle:[]},Ad(),n.watchlist=p.watchlist||{rows:[],count:0},n.tradePlans=f.plans||[],uo(),e.force&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="")}finally{H("load-all",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e.skipCore?"skip-core":"core"}),a&&(n.loading=!1),h()}}async function Js(e={}){if(!n.user||!n.token)return;const t=L(),a=e.requestId||0,r=()=>a&&n.walletRefreshRequestId!==a,o=e.force?"?force=true":"",s=e.force||e.deep?"?force=true":"",c=e.timeoutMs||wn,i=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${o}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),p=await u;if(r())return;n.balances=p.balances||[],n.connectedWalletBalance=p.connectedWallet||null,n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("wallet-refresh",t,{component:"wallet",resultCount:n.balances.length,cacheHit:!!p.cacheHit,details:`wallets=${n.wallets.length};connected=${!!n.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([i.then(g=>({ok:!0,wallets:g})).catch(g=>({ok:!1,error:g})),d.then(g=>({ok:!0,tradePlans:g})).catch(g=>({ok:!1,error:g}))]);if(!r()&&(f.ok&&(n.wallets=f.wallets.wallets||n.wallets||[]),y.ok&&(n.tradePlans=y.tradePlans.plans||n.tradePlans||[],uo()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const g=L(),S=k(`/api/web/positions${s}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await S;if(P?.__error)throw P.__error;if(r())return;n.connectedWalletBalance=P.connectedWallet||n.connectedWalletBalance||null,n.positions=P.positions||[],n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",g,{component:"positions",resultCount:n.positions.length,cacheHit:!!P.cacheHit,details:`open=${n.positions.length}`})}catch(P){n.walletRefreshError=P.message||"Position refresh failed.",H("positions-refresh",g,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(P?.message||"Position refresh failed.")})}}}function Cc(e=n.positions){return(Array.isArray(e)?e:[]).some(t=>{const a=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!a&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Lc(e=120,t="positions-value-followup"){!n.user||!n.token||(xr&&window.clearTimeout(xr),xr=window.setTimeout(()=>{xr=null,gt({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Jt}).then(a=>{a?(n.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})):Nr(`${t}-failed`)}).catch(()=>Nr(`${t}-failed`))},Math.max(0,Number(e)||0)))}function Vf(e=[],t=[],a={}){const r=new Map((Array.isArray(t)?t:[]).map(o=>[String(o?.tokenMint||""),o]));return(Array.isArray(e)?e:[]).map(o=>{const s=r.get(String(o?.tokenMint||""));if(!s||a.fast===!1)return o;const c=!!(o?.valuePending||/refreshing|updating|background/i.test(o?.valueError||"")),i=s.estimatedValueSol!==null&&s.estimatedValueSol!==void 0&&s.estimatedValueSol!=="";return!c||!i?o:{...o,estimatedValueSol:s.estimatedValueSol,openPnlSol:s.openPnlSol,openPnlPercent:s.openPnlPercent,valuePending:!1,valueError:""}})}function Nr(e="positions-value-refresh-delayed"){let t=!1;return n.positions=(Array.isArray(n.positions)?n.positions:[]).map(a=>{const r=a?.estimatedValueSol!==null&&a?.estimatedValueSol!==void 0&&a?.estimatedValueSol!=="";return!(a?.valuePending||/refreshing|updating|background/i.test(a?.valueError||""))?a:(t=!0,{...a,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(H("positions-value-refresh-cleanup",L(),{component:"positions",details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):!1}function xc(e="portfolio-supplemental"){if(!n.user||!n.token)return;const t=L();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Jt}),k("/api/web/pnl?force=true",{timeoutMs:Jt,dedupe:!1})]).then(([a,r])=>{a.status==="fulfilled"&&(n.balances=a.value.balances||n.balances||[],n.connectedWalletBalance=a.value.connectedWallet||n.connectedWalletBalance||null),r.status==="fulfilled"&&(n.pnl=r.value.pnl||n.pnl||null),n.lastWalletRefreshAt=new Date().toISOString(),H("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}).catch(()=>{})}async function gt(e={}){if(!n.user||!n.token)return;const t=L(),a=new URLSearchParams;e.force&&a.set("force","true"),e.fast!==!1&&a.set("fast","true");const r=a.toString()?`?${a.toString()}`:"",o=r||"full";if(Pn&&ks===o)return Pn;const s=++$s;return ks=o,Pn=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Jt:hs)});return $s!==s?!1:(n.connectedWalletBalance=c.connectedWallet||n.connectedWalletBalance||null,n.positions=Vf(c.positions||n.positions||[],n.positions||[],e),n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",H("positions-refresh",t,{component:"positions",resultCount:n.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Cc(n.positions)&&Lc(120,`${e.reason||"positions"}-values`),e.syncPnl&&xc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(n.walletRefreshError=c.message||"Position refresh failed."),H("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(c?.message||"Position refresh failed.")}),!1}finally{$s===s&&(Pn=null,ks="")}})(),Pn}async function zf(e={}){if(!n.user||!n.token){$("Connect your wallet before refreshing positions."),He("error",{error:"Wallet not connected"});return}const t=L();Ka("refreshing",{startedAt:n.positionRefreshAction?.startedAt||t}),n.walletRefreshError="",Re("[data-sync-health]",zr()),le(),await Ce(20);try{if(!await gt({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Jt}))throw new Error(n.walletRefreshError||"Position refresh failed.");n.lastWalletRefreshAt=new Date().toISOString(),He("success",{error:""}),xc(`${e.reason||"positions-only"}-balances-pnl`),Cc(n.positions)&&Lc(120,`${e.reason||"positions-only"}-full-values`),H("positions-only-refresh",t,{component:"positions",resultCount:n.positions.length,details:e.reason||"positions-only"})}catch(a){const r=a?.message||"Position refresh failed.";n.walletRefreshError=r,He("error",{error:N(r)}),$(r),H("positions-only-refresh",t,{errorCode:a?.code||a?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(r)})}finally{h()}}function En(){return String(n.smartChartToken||n.tradeToken||n.bundleToken||n.volumeToken||n.terminalToken||"").trim()}function Ve(e=n.activeTab){return lf[e]||null}function ja(e=Ve()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",Nn(n.livePairBucket)).replace("{sort}",String(n.terminalSort||"best")).replace("{scopeMode}",String(n.slimeScopeMode||"new")).replace("{kolMode}",String(n.kolMode||"hot")).replace("{kolWallet}",n.kolWallet?w(n.kolWallet):"global").replace("{scanMode}",String(n.scanMode||"safe")).replace("{tokenMint}",En()?w(En()):"none")}function Mc(e=n.activeTab,t="pageSize",a=25){const r=Ve(e),o=Number(r?.[t]);return Number.isFinite(o)&&o>0?o:a}function Ga(e=n.activeTab){return Mc(e,"pageSize",25)}function Ys(e=n.activeTab){return Math.max(Ga(e),Mc(e,"maxPageSize",Ga(e)))}function Bc(e=n.activeTab){return!!Ve(e)?.supportsPagination}function Qs(e=n.activeTab){const t=Ve(e)||{tabKey:e};return`${e}:${ja(t)}`}function Fn(e=n.activeTab,t=0){const a=Qs(e),r=Ga(e),o=Ys(e),s=Number(n.terminalFeedVisibleLimits?.[a]||0),c=Number.isFinite(s)&&s>0?s:r,i=Number(t||0),u=Math.min(Math.max(r,c),o);return i>0?Math.min(u,i):u}function Z(e=n.activeTab){const t=Qs(e);if(!n.terminalFeedVisibleLimits?.[t])return;const a={...n.terminalFeedVisibleLimits||{}};delete a[t],n.terminalFeedVisibleLimits=a}function jf(e=n.activeTab,t=0){const a=Qs(e),r=Fn(e,t),o=Ga(e),s=Ys(e),c=Number(t||0),i=Math.min(s,c>0?c:s,r+o);return n.terminalFeedVisibleLimits={...n.terminalFeedVisibleLimits||{},[a]:i},i}function at(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return a.slice(0,Fn(e,a.length))}function Gf(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return Bc(e)&&a.length>Fn(e,a.length)}function la(e=n.activeTab,t=[],a="rows"){const r=Array.isArray(t)?t:[];if(!Gf(e,r))return"";const o=Fn(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${l(o)} of ${l(r.length)} ${l(a)} shown</small>
      <button type="button" data-terminal-load-more="${l(e)}">Load More</button>
    </div>
  `}function z(e=n.activeTab){return n.terminalFeeds[e]||{}}function Rc(e=n.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?ia():e==="kol"?n.kolLastUpdatedAt||"":e==="watchlist"?z("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?n.lastWalletRefreshAt||z(e).lastFetchAt||"":z(e).lastFetchAt||""}function Rt(e=n.activeTab){return e==="terminal"?Number(De()?.rows?.length||0)+Number(n.kolScan?.rows?.length||0):e==="live"?Number(De()?.rows?.length||0):e==="liveTrades"?Number(n.pnl?.trades?.length||0):e==="slimeScope"?Number(up?.(n.slimeScopeMode)?.length||0):e==="kol"?Number(n.kolScan?.rows?.length||0):e==="watchlist"?Number(n.watchlist?.rows?.length||0):e==="smartChart"?En()?1:Number(ir?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?En()?1:0:e==="sniper"?Number(n.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(n.launchWatches?.length||0):e==="wallets"?Number(n.wallets?.length||0)+Number(n.balances?.length||0):e==="positions"?Number(n.positions?.length||0):e==="pnl"?Number(n.pnl?.trades?.length||0):e==="ogreAi"?n.ogreAiResult?1:0:e==="ogreTek"?Number(n.ogreTek?.markets?.length||0)+Number(n.ogreTek?.positions?.length||0):0}function Wn(e=n.activeTab){const t=Rt(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,Fn(e,t)):t}function Dn(e=n.activeTab){const t=Ve(e);if(!t)return!1;const a=Date.parse(Rc(e)||"");return Number.isFinite(a)?Date.now()-a>Number(t.staleMs||3e4):!0}function Ic(e=n.activeTab){return Rt(e)>0||!!Rc(e)}function Xf(e=n.activeTab,t={}){const a=Ve(e)||{};return{tabKey:e,label:a.label||e,category:a.category||"unknown",endpoint:a.endpoint||"",cacheKey:ja(a),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Wn(e)??0),pageSize:Ga(e),maxPageSize:Ys(e),supportsPagination:Bc(e),hasMore:!!(t.hasMore??Rt(e)>Wn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function Oc(e=n.activeTab,t={}){const a=Xf(e,t);if(n.terminalFeedLog=[...n.terminalFeedLog||[],a].slice(-20),Us(Lm,()=>n.terminalFeedLog,"feed"),a.status==="error"||a.status==="timeout"||/manual|post-trade|visibility|resume/i.test(a.reason||"")||!!(a.stale&&a.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(a)}).catch(()=>{})}catch{}return a}function Jf(e=n.activeTab,t={}){const a=Ve(e);if(!a)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return n.terminalFeeds={...n.terminalFeeds,[e]:{...z(e),label:a.label,category:a.category,endpoint:a.endpoint,cacheKey:ja(a),refreshMs:a.refreshMs,staleMs:a.staleMs,pageSize:a.pageSize,maxPageSize:a.maxPageSize,supportsPagination:!!a.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function Zs(e=n.activeTab,t="",a="success",r={}){const o=Ve(e);if(!o)return;const s=Rt(e),c=Wn(e),i={...z(e),label:o.label,category:o.category,endpoint:o.endpoint,cacheKey:ja(o),refreshMs:o.refreshMs,staleMs:o.staleMs,pageSize:o.pageSize,maxPageSize:o.maxPageSize,supportsPagination:!!o.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:a,lastFetchAt:new Date().toISOString(),resultCount:s,renderedCount:c,hasMore:s>c,stale:a!=="success"||Dn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};n.terminalFeeds={...n.terminalFeeds,[e]:i},Oc(e,{requestId:t,status:a,reason:i.lastReason,resultCount:s,renderedCount:c,hasMore:i.hasMore,stale:i.stale,errorCode:i.errorCode,errorMessage:i.errorMessage})}function Yf(e=n.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function Qf(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function ee(e=n.activeTab,t={}){const a=L(),r=Ve(e);if(!r)return null;if(t.ifStale&&Ic(e)&&!Dn(e)||z(e).inFlight)return z(e);const o=Qf(t),s=Date.now(),c=Number(Mi.get(e)||0);if(!o&&c&&s-c<Sn)return z(e);if(Yf(e)&&!n.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return Zs(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),z(e);Mi.set(e,s);const i=Jf(e,t);if(o&&t.renderStart!==!1){const u=n.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[It({silent:!0,force:!!t.force})];n.kolWallet||u.push(Vr(n.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await qr({silent:t.silent!==!1,bucket:n.livePairBucket,force:!!t.force});else if(e==="liveTrades")n.user&&n.token&&await sa({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[It({silent:!0,force:!!t.force}),Un(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];n.kolScan||u.push(Vr(n.kolMode,n.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await Vr(n.kolMode,n.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await Wc({silent:t.silent!==!1});else if(e==="sniper")await Un(n.scanMode,{silent:t.silent!==!1});else if(e==="positions")n.user&&n.token&&await gt({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:hs});else if(["wallets","pnl"].includes(e))n.user&&n.token&&await Ne({force:!!t.force,deep:!1});else if(e==="smartChart")n.user&&n.token&&await Ne({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[It({silent:!0,force:!!t.force})];n.user&&n.token&&u.push(sa({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[It({silent:!0,force:!!t.force})];n.scan||u.push(Un(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),n.user&&n.token&&u.push(sa({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await gr({silent:!0}).catch(u=>{n.ogreTek.error=u.message});return Zs(e,i,"success"),z(e)}catch(u){if(Zs(e,i,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:N(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return z(e)}finally{H("feed-refresh",a,{component:r.component||e,resultCount:Rt(e),cacheHit:!!z(e).cacheHit,stale:Dn(e),requestId:z(e).lastRequestId||"",errorCode:z(e).errorCode||"",details:`${e}:${ja(r)}`}),t.render!==!1&&(!o&&rl()?Kc():h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"&&e==="smartChart"}))}}async function Xa(e={}){const t=n.activeTab||"terminal",a=[ee(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(a)}function _r(e="terminal-entry"){n.route==="terminal"&&(Xa({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),n.user&&n.token&&Ne({force:!0,deep:!1,reason:e}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})}))}function el(){const e=()=>{Ea&&clearTimeout(Ea),Ea=null,Pr=""};if(n.route!=="terminal"||document.hidden){e();return}const t=Ve(n.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(n.activeTab)){e();return}const a=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${n.activeTab}:${ja(t)}:${a}`;Ea&&Pr===r||(e(),Pr=r,Ea=setTimeout(async()=>{Ea=null,Pr="",!(n.route!=="terminal"||document.hidden)&&(await ee(n.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(o=>$(o.message)),el())},a))}function Nn(e){const t=String(e||"live");return xt.some(([a])=>a===t)?t:"live"}function Ec(e=n.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Ur(e=n.activeTab){return e==="slimeScope"?Ec(n.slimeScopeMode):Nn(n.livePairBucket)}function De(e=Ur()){const t=Nn(e);return n.livePairsByBucket[t]||(t===n.livePairBucket?n.livePairs:null)||null}function ia(e=Ur()){const t=Nn(e);return n.livePairsLastUpdatedByBucket[t]||(t===n.livePairBucket?n.livePairsLastUpdatedAt:"")||""}function Fc(e=[]){return Array.isArray(e)&&e.length>0}function Ie(e={},t={},a=[]){for(const r of a){const o=e?.[r];if(o!=null&&o!=="")return o}for(const r of a){const o=t?.[r];if(o!=null&&o!=="")return o}return""}function Zf(e=[],t=[]){const a=new Map((Array.isArray(e)?e:[]).map(r=>[ha(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const o=a.get(ha(r));return o?{...o,...r,tokenMint:Ie(r,o,["tokenMint","mint","tokenAddress","address"]),mint:Ie(r,o,["mint","tokenMint","tokenAddress","address"]),symbol:Ie(r,o,["symbol","ticker","shortMint"]),name:Ie(r,o,["name","tokenName","category"]),imageUrl:Ie(r,o,["imageUrl","image","icon","logoURI","logoUrl"]),image:Ie(r,o,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Ie(r,o,["avatarUrl","avatar_url","avatar"]),avatarState:Ie(r,o,["avatarState"]),dexUrl:Ie(r,o,["dexUrl","url"]),pumpUrl:Ie(r,o,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Ie(r,o,["websiteUrl","website"]),twitterUrl:Ie(r,o,["twitterUrl","xUrl"]),telegramUrl:Ie(r,o,["telegramUrl"]),metadata:r?.metadata||o?.metadata||r?.tokenMetadata||o?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||o?.tokenMetadata||r?.metadata||o?.metadata||null,dex:r?.dex||o?.dex||r?.dexScreener||o?.dexScreener||null,pump:r?.pump||o?.pump||r?.pumpFun||o?.pumpFun||null}:r})}async function qr({silent:e=!1,bucket:t=n.livePairBucket,renderOnComplete:a=!0,force:r=!1}={}){const o=L(),s=Nn(t),c=s===n.livePairBucket,i=n.terminalSort||"best",u=`${s}:${i}`,d=Rr.get(u);if(d?.promise){n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[s]:d.requestId},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const P=n.livePairsByBucket?.[s]?.rows||(c?n.livePairs?.rows:[]);return!e&&!Fc(P)&&_a(Ei),d.promise}const p=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(Ts[s]||0)+1;Ts[s]=f;const y=()=>Ts[s]===f;n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[s]:p},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const g=n.livePairsByBucket?.[s]?.rows||(c?n.livePairs?.rows:[]);!e&&!Fc(g)&&_a(Ei);const S=(async()=>{try{const P=r?"&force=true":"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(s)}&sort=${encodeURIComponent(i)}${P}`,b=await Promise.race([k(T),new Promise((U,We)=>window.setTimeout(()=>We(new Error("Live feed refresh timed out.")),12e3))]),A=xt.find(([U])=>U===s)?.[1]||"Live",C=n.livePairsByBucket[s]||(c?n.livePairs:null);let M=b.livePairs||{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${A} feed returned no rows yet. Retrying automatically.`};const q=Array.isArray(M?.rows)?M.rows:[],J=Array.isArray(C?.rows)?C.rows:[];if(q.length===0&&J.length>0?M={...C,...M,rows:C.rows,stale:!0,emptyRefresh:!0,message:`${A} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:q.length>0&&J.length>0&&(M={...M,rows:Zf(J,q)}),!y())return M;const Se=M?.refreshedAt||new Date().toISOString(),Ze={...n.livePairsRefreshErrorByBucket||{}};return delete Ze[s],n.livePairsRefreshErrorByBucket=Ze,n.livePairsByBucket={...n.livePairsByBucket,[s]:M},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[s]:Se},c&&(n.livePairs=M,n.livePairsLastUpdatedAt=Se),M}catch(P){const T=N(P?.message||"Live feed refresh failed."),b=xt.find(([M])=>M===s)?.[1]||"Live",A=n.livePairsByBucket[s]||(c?n.livePairs:null),C=A?{...A,stale:!0,refreshError:T,message:`Showing last good ${b} feed. Refresh failed, retrying automatically.`}:{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:T,message:`${b} refresh failed. Retrying automatically.`};return y()&&(n.livePairsRefreshErrorByBucket={...n.livePairsRefreshErrorByBucket||{},[s]:T},n.livePairsByBucket={...n.livePairsByBucket,[s]:C},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[s]:C.refreshedAt},c&&(n.livePairs=C,n.livePairsLastUpdatedAt=C.refreshedAt)),C}finally{if(!y())return;const P=n.livePairsByBucket?.[s]?.rows||[];H("live-pairs-refresh",o,{component:"livePairs",resultCount:Array.isArray(P)?P.length:0,stale:!!n.livePairsByBucket?.[s]?.stale,errorCode:n.livePairsRefreshErrorByBucket?.[s]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${s}:${i}`});const T={...n.livePairsLoadingByBucket};(T[s]===p||T[s]===!0)&&(delete T[s],n.livePairsLoadingByBucket=T),n.livePairsLoading=!!T[n.livePairBucket],!e&&c&&(n.loading=!1),a&&(c&&["terminal","live","slimeScope"].includes(n.activeTab)?_a("load-live-pairs-complete"):h())}})();return Rr.set(u,{requestId:p,requestVersion:f,safeBucket:s,promise:S}),S.finally(()=>{Rr.get(u)?.requestId===p&&Rr.delete(u)}),S}async function It({silent:e=!1,force:t=!1,warmAll:a=!1}={}){if(await qr({silent:e,bucket:n.livePairBucket,force:t}),a){const r=xt.map(([o])=>o).filter(o=>o!==n.livePairBucket);await Promise.allSettled(r.map(o=>qr({silent:!0,bucket:o,renderOnComplete:!1,force:t})))}(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope")&&_a(a?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function ca(){if(Hn()||document.hidden||Da()||n.activeTab!=="live"&&n.activeTab!=="terminal"&&n.activeTab!=="slimeScope"){Na();return}const e=Ur(n.activeTab),a=(n.activeTab==="slimeScope"?12:8)*1e3,r=`${n.activeTab}:${e}:${n.terminalSort}:${a}`;Ma&&kr===r||(Na(),kr=r,Ma=setTimeout(async()=>{if(Ma=null,kr="",document.hidden||Da()){ca();return}if(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"){if(n.livePairsLoadingByBucket?.[e]){ca();return}try{n.activeTab==="slimeScope"?await ee("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await qr({silent:!0,bucket:n.livePairBucket,force:!1})}catch{}finally{ca()}}},a))}function eh({force:e=!1}={}){if(Hn()||!(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"))return;const a=Ur(n.activeTab),r=`${a}:${n.terminalSort||"best"}`;ws.has(r)||n.livePairsLoadingByBucket[a]||!e&&n.livePairsByBucket[a]||(ws.add(r),window.setTimeout(()=>{const o=n.activeTab==="slimeScope"?ee("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):It({silent:!0,force:!0,warmAll:!1});Promise.resolve(o).catch(s=>$(s.message)).finally(()=>{ws.delete(r),ca()})},900))}function Hr(){const e=()=>{Ba&&clearTimeout(Ba),Ba=null,$r=""};if(document.hidden||n.activeTab!=="sniper"){e();return}const t=`${n.activeTab}:${n.scanMode}`;Ba&&$r===t||(e(),$r=t,Ba=setTimeout(async()=>{if(Ba=null,$r="",document.hidden){Hr();return}if(n.activeTab==="sniper"){if(n.loading){Hr();return}try{await Un(n.scanMode,{silent:!0})}catch(a){$(a.message)}finally{Hr()}}},2e4))}function _n(){const e=()=>{Ra&&clearTimeout(Ra),Ra=null,Tr=""};if(Hn()||document.hidden||n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet){e();return}const t=String(n.kolMode||"hot"),o=t==="hot"||t==="fresh"?1e4:3e4,s=`${n.activeTab}:${n.kolMode}:${o}`;Ra&&Tr===s||(e(),Tr=s,Ra=setTimeout(async()=>{if(Ra=null,Tr="",document.hidden){_n();return}if(!(n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet)){if(n.kolLoading){_n();return}try{await Vr(n.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{_n()}}},o))}function Kr(){const e=()=>{Oa&&clearTimeout(Oa),Oa=null,Ar=""};if(Hn()||document.hidden||n.activeTab!=="watchlist"&&n.activeTab!=="terminal"||!n.user||!n.token){e();return}const t=`${n.activeTab}:${n.user?.id||"guest"}`;Oa&&Ar===t||(e(),Ar=t,Oa=setTimeout(async()=>{if(Oa=null,Ar="",document.hidden){Kr();return}if(!(n.activeTab!=="watchlist"&&n.activeTab!=="terminal"))try{await Wc({silent:!0})}catch(a){$(a.message)}finally{Kr()}},3e4))}async function Un(e=n.scanMode,t={}){const a=L(),r=!!t.silent;n.scanMode=e,r||(n.loading=!0,h());try{const o=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);n.scan=o.scan}finally{H("scanner-refresh",a,{component:"sniper",resultCount:Array.isArray(n.scan?.candidates)?n.scan.candidates.length:0,details:e}),r||(n.loading=!1),h()}}async function Vr(e=n.kolMode,t=n.kolWallet,a={}){const r=L(),o=!!a.silent;n.kolMode=e,n.kolWallet=String(t||"").trim();let s="";n.kolWallet&&!Ft(n.kolWallet)&&(n.kolWallet="",s="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!o&&!n.kolScan&&(n.loading=!0),n.kolLoading=!0,n.kolStatus=s||(n.kolWallet?"Scanning custom KOL wallet...":`Loading ${er(n.kolMode)}...`),$(""),o||h();try{const c=new URLSearchParams({mode:e});n.kolWallet&&c.set("wallet",n.kolWallet);const i=await k(`/api/web/kol/scan?${c.toString()}`);n.kolScan=i.scan,n.kolLastUpdatedAt=new Date().toISOString(),n.kolStatus=i.scan?.message||`${er(n.kolMode)} loaded.`,n.kolDumpStatsLoadedAt=0}catch(c){throw n.kolStatus=c.message||"KOL scan failed.",c}finally{H("kol-refresh",r,{component:"kol",resultCount:Array.isArray(n.kolScan?.rows)?n.kolScan.rows.length:Array.isArray(n.kolScan?.signals)?n.kolScan.signals.length:0,errorCode:n.kolStatus&&/failed/i.test(n.kolStatus)?"KOL_REFRESH_FAILED":"",details:n.kolWallet?"wallet":e}),o||(n.loading=!1),n.kolLoading=!1,h()}}async function Wc(e={}){if(!n.user||!n.token)return;const t=L(),a=!!e.silent;n.watchlistLoading=!0,a||h();try{const r=await k("/api/web/watchlist");n.watchlist=r.watchlist||{rows:[],count:0}}finally{H("watchlist-refresh",t,{component:"watchlist",resultCount:n.watchlist?.count||n.watchlist?.rows?.length||0}),n.watchlistLoading=!1,h()}}function th(){return n.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function ah(){const e=Number(n.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function Ot(){return th()+ah()}const nh=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Oe(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function rh(){const e=new Map,t=(a={})=>{const r=Oe(a.mint||a.tokenMint||"");if(!r||e.has(r))return;const o=a.balance??a.uiAmount??a.amount??a.uiBalance??"";e.set(r,{mint:r,symbol:String(a.symbol||a.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(a.name||a.label||"").trim(),balance:o,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${Ot().toFixed(4)} SOL`}),nt().forEach(a=>t({mint:a.tokenMint||a.mint,symbol:a.symbol||a.shortMint,name:a.name||"",balance:a.uiAmount||a.amountToken||"",kind:"wallet"})),(n.balances||[]).forEach(a=>{(a.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function tl(e={}){const t=new Map,a=(o={})=>{const s=Oe(o.mint||o.tokenMint||"");!s||t.has(s)||t.set(s,{mint:s,symbol:String(o.symbol||o.shortMint||(s==="SOL"?"SOL":w(s))||"").trim(),name:String(o.name||o.label||"").trim(),balance:o.balance??o.uiAmount??o.amount??"",kind:o.kind||o.source||"held"})};return rh().forEach(a),e.walletOnly||nh.forEach(o=>{o.mint!=="SOL"&&a(o)}),[...t.values()]}function Dc(e=""){const t=Oe(e);return tl().find(a=>a.mint===t)||null}function Nc(e="",t={}){const a=Oe(e),r=t.includeCustom!==!1,o=tl({walletOnly:!!t.walletOnly}),s=o.some(u=>u.mint===a);return`${o.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||w(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${l(u.mint)}" ${a===u.mint?"selected":""}>${l(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!a||!s)?"selected":""}>Custom CA</option>`:""}`}function al(){const e=Oe(n.tradeSwapFrom||"SOL")||"SOL";return tl({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function _c(){const e=al(),t=Oe(n.tradeSwapTo||""),a=Oe(n.tradeToken||"");return t&&t!==e?t:a&&a!==e||e==="SOL"?a:"SOL"}function oh(){const e=al(),t=_c();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Oe(n.tradeToken||"")?n.swapDirection==="sell"?"sell":"buy":"select"}function sh(e="buy"){const t=Oe(m("[data-swap-from]")?.value||n.tradeSwapFrom||""),a=Oe(m("[data-swap-to]")?.value||n.tradeSwapTo||""),r=String(m("[data-trade-token]")?.value||n.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:a&&a!=="SOL"?a:r}function Uc(){return(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey?(n.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const a=String(t.mint||t.tokenMint||"").trim();return{tokenMint:a,shortMint:t.shortMint||w(a),symbol:t.symbol||t.shortMint||w(a),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||Q(a),pumpUrl:Of(a),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function nt(){const e=new Set,t=[];for(const a of[...n.positions||[],...Uc()]){const r=String(a?.tokenMint||a?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(a))}return t}function nl(){const e=n.connectedWalletBalance?.publicKey||n.user?.connectedWallet?.publicKey||"";return n.wallets.length+(e?1:0)}function qc(){return n.pnl?.totals?.realizedSol||"+0 SOL"}function Ja(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function qn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function zr(){if(n.walletRefreshing||n.walletRefreshStatus==="refreshing")return"Syncing";if(n.walletRefreshStatus==="timeout")return"Delayed";if(n.walletRefreshError||n.walletRefreshStatus==="error")return"Retry";const e=Ja(n.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function lh(){const e=oe("trade",n.selectedTradePresetId),t=oe("bundle",n.selectedBundlePresetId),a=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${a} | ${r}`}async function Hc(){if(!n.user||!n.token)return;const e=L();try{const[t,a]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(n.pnl=t.value.pnl||n.pnl||null),a.status==="fulfilled"&&(n.tradePlans=a.value.plans||n.tradePlans||[],uo()),H("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(n.tradePlans?.length||0)+(n.pnl?1:0),details:"pnl,trade-plans"})}catch(t){H("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:N(t?.message||"Post-trade supplemental refresh failed.")})}}function ih(e=350,t={}){Cr&&window.clearTimeout(Cr),Cr=window.setTimeout(async()=>{if(Cr=null,!(!n.user||!n.token))try{t.reason==="post-trade"?await Promise.all([Hc(),gt({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([sa({force:!1,skipCore:!0,silent:!0}),gt({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(a){n.walletRefreshError=a.message||"Background refresh failed.",h()}},e)}async function Ne({force:e=!1,deep:t=!1,reason:a="manual"}={}){if(!n.user||!n.token)return n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="Wallet not connected",Re("[data-sync-health]","Wallet not connected"),He("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(a||"").toLowerCase(),o=r==="manual_header_click",s=r.includes("post-trade");if(e&&!t&&!s&&!o&&Date.now()-Vi<Bm?(e=!1,W({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!s&&(Vi=Date.now()),Zt)return W({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),n.positionRefreshAction?.state==="clicked"&&Ka("refreshing",{startedAt:n.positionRefreshAction.startedAt||L()}),Zt.finally(()=>{if(["clicked","refreshing"].includes(n.positionRefreshAction?.state)){const u=n.walletRefreshStatus==="error"||n.walletRefreshStatus==="timeout";He(u?"error":"success",{error:u?N(n.walletRefreshError||"Refresh delayed"):""})}});const c=L(),i=++Jm;return n.walletRefreshRequestId=i,Zt=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};n.positionRefreshAction?.state==="clicked"&&Ka("refreshing",{startedAt:n.positionRefreshAction.startedAt||c}),n.walletRefreshing=!0,n.walletRefreshStatus="refreshing",n.walletRefreshError="",Re("[data-sync-health]",zr()),Lt("[data-refresh-spinner]",!1),le(),ea&&window.clearTimeout(ea),ea=window.setTimeout(()=>{ea=null,!(n.walletRefreshRequestId!==i||!n.walletRefreshing)&&(n.walletRefreshing=!1,n.walletRefreshStatus==="refreshing"&&(n.walletRefreshStatus="timeout"),Zt=null,He("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))},fs+6e3),await Ce(20);try{if(await Promise.race([Js({force:e,deep:t,preserveSmartChartFrame:n.activeTab==="smartChart",requestId:i,timeoutMs:fs}),new Promise((d,p)=>window.setTimeout(()=>p(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),fs))]),n.walletRefreshRequestId!==i)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:L()-c,fromCache:!1,degraded:!0},u;n.walletRefreshRequestId===i&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshStatus="success"),t?await sa({force:e,skipCore:!0,silent:!0}):((o||s)&&gt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${a}-positions-values`,timeoutMs:Jt}).then(d=>{d?h({preserveSmartChartFrame:n.activeTab==="smartChart"}):Nr(`${a}-positions-values-failed`)}).catch(()=>Nr(`${a}-positions-values-failed`)),ih(s?200:350,{reason:a})),H("wallet-refresh-total",c,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:t?"deep":`core-plus-background:${a}`}),He("success",{error:""}),u={ok:!0,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:"",durationMs:L()-c,fromCache:!1,degraded:!1}}catch(d){const p=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));n.walletRefreshRequestId===i&&(n.walletRefreshStatus=p?"timeout":"error",n.walletRefreshError=d.message||"Refresh failed."),p&&!r.includes("auto-retry")&&n.user&&n.token&&window.setTimeout(()=>{n.user&&n.token&&n.walletRefreshStatus!=="success"&&Ne({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),H("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:N(n.walletRefreshError)}),He("error",{error:N(n.walletRefreshError)}),$(n.walletRefreshError),u={ok:!1,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:N(n.walletRefreshError),durationMs:L()-c,fromCache:!1,degraded:!0}}finally{ea&&(window.clearTimeout(ea),ea=null),n.walletRefreshRequestId===i&&(n.walletRefreshing=!1),Zt=null,h({preserveSmartChartFrame:n.activeTab==="smartChart"})}return u})(),Zt}async function bt({force:e=!0,reason:t="manual_header_click",deep:a=!1}={}){return Ne({force:e,reason:t,deep:a})}function Hn(){return!!n.postTradeRefresh?.active&&Number(n.postTradeRefresh?.activeUntil||0)>Date.now()}async function $k(e="",t="legacy-post-trade"){K(e,t)}function K(e="",t="post-trade",a={}){e&&(n.lastTradeSignature=e),Ct.length&&(Ct.forEach(s=>window.clearTimeout(s)),Ct=[]);const r=a.tradeAttemptId||ht("post-trade"),o=Array.isArray(a.affectedKeys)&&a.affectedKeys.length?a.affectedKeys.slice(0,12).map(s=>ye(s,48)):Dm;n.postTradeRefresh={active:!0,attemptId:r,action:ye(t,70),signaturePresent:!!e,invalidatedKeys:o,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},W({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:o.length,details:o.join(",")}),Im.forEach(s=>{const c=window.setTimeout(()=>{Ct=Ct.filter(p=>p!==c);const i=Number(n.postTradeRefresh?.requestCount||0)+1;n.postTradeRefresh={...n.postTradeRefresh||{},requestCount:i},W({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:n.postTradeRefresh.requestCount,details:t});const u=L();(i<=1?Ne({force:!0,deep:!1,reason:"post-trade"}):Promise.all([gt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Jt}),Hc()])).catch(p=>{n.walletRefreshError=p.message||"Post-trade refresh failed.",n.postTradeRefresh={...n.postTradeRefresh||{},errors:[...n.postTradeRefresh?.errors||[],N(p.message||"Post-trade refresh failed.")].slice(-5)},W({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:L()-u,requestId:r,errorCode:p?.code||p?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{n.postTradeRefresh={...n.postTradeRefresh||{},refreshedKeys:[...new Set([...n.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:Ct.length>0,activeUntil:Ct.length>0?Date.now()+8e3:Date.now()},W({component:"post-trade",action:"post-trade-refresh-end",durationMs:L()-u,requestId:r,resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:n.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})})},s);Ct.push(c)}),le()}function Le({title:e="Confirm",lines:t=[],confirmLabel:a="Confirm",cancelLabel:r="Cancel",danger:o=!1,input:s=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
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
          <button type="button" class="slime-confirm-accept${o?" is-danger":""}">${l(a)}</button>
        </div>
      </div>
    `;const u=document.activeElement,d=i.querySelector(".slime-confirm-input"),p=S=>{i.remove(),document.removeEventListener("keydown",g,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>p(s?d?.value??"":!0),y=()=>p(s?null:!1),g=S=>{S.key==="Escape"?(S.preventDefault(),y()):S.key==="Enter"&&(!s||S.target===d)&&(S.preventDefault(),f())};i.addEventListener("pointerdown",S=>{S.target===i&&y()}),i.querySelector(".slime-confirm-accept").addEventListener("click",f),i.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",g,!0),document.body.appendChild(i),(d||i.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function rl(){if(document.hidden&&n.route==="terminal")return!0;const e=document.activeElement;if(!e||n.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function Kc(){n.pendingRender=!0}function Vc(){!n.pendingRender||rl()||(n.pendingRender=!1,h({force:!0}))}function ol(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Ya(){if(!se||!Cn||!ae)return;const e=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);se.dataset.loading=n.loading?"true":"false",se.dataset.route=n.route,se.dataset.walletConnected=e?"true":"false",e&&bS("shell-wallet-context"),e?su("shell-wallet-context"):bi(),e||(n.tpslAutoEnableInFlight=!1,n.tpslAutoEnableScheduledAt=0),ol(Cn,!["intro","login"].includes(n.route)),ol(Gi,n.route!=="connect"),ol(ae,n.route!=="terminal"),Lt("[data-terminal-global-search]",n.route!=="terminal"),Lt("[data-top-sync-strip]",n.route!=="terminal")}function Kn(){const e=!!(Ae&&n.loginModalOpen),t=!!n.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const a=m("[data-wallet-connect-modal]");a&&(a.style.pointerEvents=a.hidden?"none":"");const r=m("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function sl(e,t=48){if(!e||document.hidden)return!1;try{const a=e.getBoundingClientRect();return a.width<24||a.height<t}catch{return!1}}function zc(e="resume"){if(!se||document.hidden)return;Ya(),Kn();const t=`${Date.now()}:${e}`,a=se.style.transform;se.dataset.resumePaint=t,se.style.transform=a?`${a} translateZ(0)`:"translateZ(0)",se.offsetHeight,window.requestAnimationFrame(()=>{!se||se.dataset.resumePaint!==t||(se.style.transform=a,delete se.dataset.resumePaint)})}function ch(){if(!se)return!1;if(se.dataset.route!==n.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Ae||Ae.hidden||!n.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!n.quickBuyModal?.open;if(e||t||sl(se,80))return!0;if(n.route!=="terminal")return!1;const a=m("[data-panel]");return ae?.hidden||sl(ae,80)||a&&sl(a,32)||a&&!a.children.length&&!String(a.textContent||"").trim()?!0:![Cn,Gi,ae].some(o=>o&&!o.hidden)}function uh(e="watchdog"){const t=n.positionRefreshAction||{},a=t.startedAt?Math.max(0,L()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&a>Wm&&(He("error",{error:"Refresh delayed"}),W({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:a,details:e})),n.walletRefreshing&&!Zt&&(n.walletRefreshing=!1,n.walletRefreshStatus=n.walletRefreshStatus==="refreshing"?"timeout":n.walletRefreshStatus,Lt("[data-refresh-spinner]",!0)),Kn(),le()}function jc(e="watchdog",t={}){return uh(e),ch()?(W({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-zi),details:`${e}:${n.route}:${n.activeTab||""}`}),Ns({keepLogin:n.route==="login"}),Ya(),zc(e),h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):(t.forcePaint&&zc(e),!1)}function Gc(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function Xc(){try{return document.createElement("canvas")}catch{return null}}function Jc(){const e=Xc();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function dh(){return Gc()||Jc()}function ll(){const e=Ke()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Et(e),typeof window.alert=="function"&&window.alert(e)}function Yc(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function Vn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function Qc(){const e=n.clipFarm?.fileExtension||Vn(n.clipFarm?.mimeType||n.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function zn(){try{n.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}n.clipFarm?.fallbackFrameTimer&&clearInterval(n.clipFarm.fallbackFrameTimer),n.clipFarm?.fallbackStopTimer&&clearTimeout(n.clipFarm.fallbackStopTimer)}function Et(e=""){n.clipFarm={...n.clipFarm,status:String(e||"")},ze()}function il(){if(n.clipFarm?.videoUrl)try{URL.revokeObjectURL(n.clipFarm.videoUrl)}catch{}n.clipFarm={...n.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:n.clipFarm?.recording?"Recording...":""},ze()}function ze(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=n.clipFarm||{},a=dh(),r=!!t.recording,o=!!(t.blob&&t.videoUrl),s=t.status||(r?"Recording":o?"Clip ready":"Clip farm");e.innerHTML=`
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
          <a href="https://t.me/share/url?url=${encodeURIComponent(Pt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${s?`<small>${l(s)}</small>`:""}
    </div>
  `}function Zc(){const e=be([...De()?.rows||[],...typeof ir=="function"?ir():[],...n.slimeScopeRows||[],...n.livePairRows||[],...Object.values(n.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:n.smartChartToken||n.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function eu(e,t={}){const a=e?.getContext?.("2d");if(!a)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),o=720,s=1280;(e.width!==o*r||e.height!==s*r)&&(e.width=o*r,e.height=s*r,e.style.width=`${o}px`,e.style.height=`${s}px`),a.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),i=t.rows||Zc(),u=new Date;a.fillStyle="#020803",a.fillRect(0,0,o,s);const d=a.createRadialGradient(o*.2,s*.12,20,o*.2,s*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),a.fillStyle=d,a.fillRect(0,0,o,s),a.strokeStyle="rgba(118,255,45,0.38)",a.lineWidth=2,a.strokeRect(24,24,o-48,s-48),a.fillStyle="#baff4d",a.font="900 34px Arial, sans-serif",a.fillText("SlimeWire REC",48,88),a.fillStyle="#f4fff0",a.font="800 54px Arial, sans-serif",a.fillText("Fresh Live Picks",48,154),a.fillStyle="rgba(226,255,215,0.78)",a.font="700 22px Arial, sans-serif",a.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const p=o-96;a.fillStyle="rgba(118,255,45,0.12)",a.fillRect(48,226,p,12),a.fillStyle="#78ff2d",a.fillRect(48,226,Math.max(24,p*c),12),i.forEach((f,y)=>{const g=292+y*188,S=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),T=D(f.marketCapLabel,f.fdvLabel,B(ct(f)),"checking"),b=D(f.liquidityLabel,B(ut(f)),"checking"),A=D(f.volumeH1Label,f.volumeLabel,B(f.volumeH1),"checking"),C=String(f.pairAgeLabel||Ht(f)||"live").slice(0,18);a.fillStyle="rgba(4,24,8,0.92)",a.strokeStyle="rgba(118,255,45,0.34)",a.lineWidth=2,a.beginPath(),typeof a.roundRect=="function"?a.roundRect(48,g,o-96,156,18):a.rect(48,g,o-96,156),a.fill(),a.stroke(),a.fillStyle="#f4fff0",a.font="900 32px Arial, sans-serif",a.fillText(S,76,g+48),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 18px Arial, sans-serif",a.fillText(P,76,g+78),[["MC",T],["LIQ",b],["VOL",A],["AGE",C]].forEach(([M,q],J)=>{const Se=76+J*140;a.fillStyle="#aaff8f",a.font="800 15px Arial, sans-serif",a.fillText(M,Se,g+114),a.fillStyle="#ffffff",a.font="900 23px Arial, sans-serif",a.fillText(String(q).slice(0,10),Se,g+142)})}),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 20px Arial, sans-serif",a.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,s-78),a.fillStyle="#78ff2d",a.font="900 24px Arial, sans-serif",a.fillText("slimewire.org",48,s-44)}async function ph(e){eu(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(o=>r(o),"image/png",.92)}catch{r(null)}});if(!t){ll();return}const a=URL.createObjectURL(t);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:a,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},ze()}async function mh(){const e=Xc();if(!e){ll();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await ph(e);return}il();const a=Zc(),r=Date.now(),o=t.call(e,12),s=Yc(),c=[],i=new MediaRecorder(o,s?{mimeType:s}:void 0),u=()=>eu(e,{rows:a,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);i.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),i.addEventListener("stop",()=>{zn();const f=s||"video/webm",y=new Blob(c,{type:f}),g=y.size>0?URL.createObjectURL(y):"",S=Vn(y.type||f);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:g,mimeType:y.type||f,fileExtension:S,status:y.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},ze()},{once:!0}),i.start(500);const p=setTimeout(()=>{n.clipFarm?.recording&&jn()},4300);n.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:s,fileExtension:Vn(s),recorder:i,stream:o,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:p},ze()}async function tu(){if(!Gc()){if(Jc()){await mh();return}ll();return}if(n.clipFarm?.recording){jn();return}il();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=Yc(),a=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",o=>{o.data?.size>0&&a.push(o.data)}),r.addEventListener("stop",()=>{zn();const o=t||"video/webm",s=new Blob(a,{type:o}),c=s.size>0?URL.createObjectURL(s):"",i=Vn(s.type||o);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:s.size>0?s:null,videoUrl:c,mimeType:s.type||o,fileExtension:i,status:s.size>0?`Clip ready (.${i}).`:"No clip captured."},ze()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>jn(),{once:!0}),r.start(1e3),n.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:Vn(t),recorder:r,stream:e,chunks:a},ze()}catch(e){zn(),n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},ze()}}function jn(){const e=n.clipFarm?.recorder;if(!e){zn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},ze();return}try{if(e.state!=="inactive"){Et("Saving clip..."),e.stop();return}}catch{}zn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},ze()}async function fh(){const e=n.clipFarm?.blob;if(!e){Et("Record a clip first.");return}const t=new File([e],Qc(),{type:e.type||n.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Et("Shared.");return}}catch(a){if(a?.name==="AbortError"){Et("Share cancelled.");return}}Et("Use Save, then attach the clip to X or Telegram.")}function hh(){const e=n.clipFarm?.videoUrl;if(!e){Et("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=Qc(),document.body.appendChild(t),t.click(),t.remove(),Et("Saved.")}function gh(e=null,t="chartTxns"){const a=e||xo(),r=String(a?.tokenMint||n.smartChartToken||"").trim();return r?{mint:r,mode:t,src:Hd(a,t)}:null}function bh(e={}){if(e.refreshSmartChartFrame||n.route!=="terminal"||n.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),a=t?.querySelector("iframe");if(!t||!a)return null;const r=String(t.dataset.chartMode||"chartTxns"),o=gh(null,r);if(!o||t.dataset.chartMint!==o.mint||t.dataset.chartMode!==o.mode)return null;const s=String(t.dataset.chartSrc||a.getAttribute("src")||""),c=t.dataset.loaded==="true",i=s!==o.src;return t.dataset.preserving="true",{frame:t,mint:o.mint,mode:o.mode,src:i?s:o.src,loaded:c,keepByMint:i}}function yh(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),a=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${a}"]`),o=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||o!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!se||!Cn||!ae)return;if(Ya(),!e.force&&rl()){Kc();return}const t=L(),a=`${n.route}:${n.activeTab||"none"}`;try{n.perfRenderCounts={...n.perfRenderCounts||{},[a]:(n.perfRenderCounts?.[a]||0)+1},n.pendingRender=!1;const r=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);Ya(),se.dataset.activeTab=n.activeTab||"";const s=!!((e.preserveSmartChartFrame||n.activeTab==="smartChart")&&n.route==="terminal"&&n.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?bh(e):null,c=!!Ae,i=!!(c&&n.loginModalOpen);Os&&(Os.hidden=c||!!n.user||n.loginCollapsed),Lt("[data-connect-login-panel]",c||!!n.user||n.loginCollapsed),Ae?(Ae.hidden=!i,Ae.setAttribute("aria-hidden",i?"false":"true"),Ae.toggleAttribute("inert",!i),document.body.classList.toggle("login-modal-open",i),document.querySelectorAll("[data-login-tab]").forEach(S=>{const P=S.dataset.loginTab===n.loginModalTab;S.dataset.active=P?"true":"false",S.setAttribute("aria-selected",P?"true":"false")}),Lt("[data-login-modal-login-section]",n.loginModalTab!=="login"),Lt("[data-login-modal-create-section]",n.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),Xi&&(Xi.hidden=!1),Ji&&(Ji.hidden=!!n.user),Yi&&(Yi.hidden=!n.user),Ya(),Re("[data-user-id]",n.user?.id||"guest"),Re("[data-wallet-count]",nl()),Re("[data-total-sol]",Ot().toFixed(4));const u=nt();Re("[data-position-count]",u.length),Re("[data-realized]",qc()),Re("[data-top-sol]",`${Ot().toFixed(4)} SOL`),Re("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Re("[data-sync-health]",r?zr():"Sync idle"),Re("[data-active-preset-label]",lh()),ul(),Sh(),Lt("[data-refresh-spinner]",!n.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!$m||!ym(ke)});const d=m("[data-user-avatar]");d&&(d.innerHTML=Za("SW"));const p=m("[data-top-avatar]");p&&(p.innerHTML=Za("SW"));const f=n.user?.connectedWallet||null;Re("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:n.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=m("[data-logout]");y&&(y.hidden=!n.user,y.disabled=!!n.logoutPending,v(y,n.logoutPending?"Logging out...":"Log Out")),n.route==="terminal"&&Mh(),yh(s),tg(),ng(),Ul(),wa(),Sa(),co(),fr(),ze(),E(),cw("render"),Kn(),le();const g=L()-t;(g>=16||n.perfRenderCounts[a]%20===0)&&W({component:"render",action:"render",durationMs:g,resultCount:n.perfRenderCounts[a],details:a}),zi=Date.now()}catch(r){Ya(),Kn(),qs({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const o=m("[data-panel]");n.route==="terminal"&&o?(ae.hidden=!1,o.innerHTML=`
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
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function au(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const a=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(a)return`connected:${String(a).toLowerCase()}`;const r=Array.isArray(n.wallets)&&n.wallets.length?n.wallets.map(o=>o.publicKey||o.address||o.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function vh(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${au(e)}`)==="yes"}catch{return!1}}function nu(e,t=""){try{const a=`tpslAutoRevoked:${au(t)}`;e?sessionStorage.setItem(a,"yes"):sessionStorage.removeItem(a)}catch{}}function cl(e=""){nu(!1,e)}function ru(){return!!(Array.isArray(n.wallets)&&n.wallets.length||n.user?.connectedWallet||n.connectedWalletBalance?.publicKey)}function ou(){const e=n.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),a=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!n.user?.automationPermissionActive&&!a&&!e.revokedAt}function wh(){return!(!ru()||vh()||ou()||n.tpslAutoEnableInFlight)}function su(e="wallet-session"){if(!wh())return;const t=L();n.tpslAutoEnableScheduledAt&&t-n.tpslAutoEnableScheduledAt<2e3||(n.tpslAutoEnableScheduledAt=t,n.tpslAutoEnableInFlight=!0,setTimeout(()=>{Bl("enable",{auto:!0,reason:e}).catch(a=>{n.automationDelegationStatus=a?.message||"TP/SL auto-enable failed.",$(n.automationDelegationStatus)}).finally(()=>{n.tpslAutoEnableInFlight=!1,ul()})},50))}function ul(){const e=m("[data-tpsl-status-button]");if(!e)return;const t=m("[data-tpsl-status-label]"),a=n.user?.automationPermission||{},r=!!n.user?.automationPermissionActive,o=!!a.revokedAt,s=Date.parse(a.expiresAt||""),c=!!a.enabled&&Number.isFinite(s)&&s<=Date.now(),i=r?"enabled":o||c?"invalid":"disabled";e.dataset.tpslState=i;const u=i==="enabled"?"TP/SL Enabled":i==="invalid"?"Re-enable TP/SL":"Enable TP/SL";v(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=i==="enabled"?`Server exits enabled${a.expiresAt?` until ${we(a.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Sh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0,r=!!(t||a),o=r?"Connected":"Connect",s=t?"Wallet: Connected":a?`Wallets: ${a}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:a?`${a} SlimeWire wallet${a===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(i=>{i.dataset.walletState=r?"connected":"disconnected",i.title=c,i.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=i.querySelector("[data-top-wallet-connect-label]")||i;v(u,o)}),document.querySelectorAll("[data-top-wallet-status]").forEach(i=>{i.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",i.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",i.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),v(i,s)})}async function kh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0;if(t){await Le({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await cd();return}if(a>0){$e("/terminal","wallets");return}ua({returnPath:"/terminal"})}function $h(e=document){const t=()=>{const a=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!a)return;const r=Math.max(0,a.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const lu=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Th=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Ah(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Gn(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function dl(e=m("[data-panel]")){if(!e||n.route!=="terminal"||!lu.has(n.activeTab))return null;const t=e.dataset.renderedTab,a=document.scrollingElement||document.documentElement,r={tab:n.activeTab,windowY:window.scrollY||0,documentY:a?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0,anchorKey:"",anchorTop:0},o=Array.from(e.querySelectorAll(Th));if(t&&t!==n.activeTab&&!o.length||!o.length)return r;const s=o.find(i=>{const u=i.getBoundingClientRect(),d=Gn()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||o[0],c=s?.dataset?.tokenChart||s?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:s?s.getBoundingClientRect().top:0}}function pl(e,t=m("[data-panel]")){if(!e||n.route!=="terminal"||e.tab!==n.activeTab)return;const a=(s,c)=>{if(!s||!Number.isFinite(Number(c))||s.scrollHeight<=s.clientHeight+2)return;const i=Math.max(0,Math.min(Number(c),s.scrollHeight-s.clientHeight));Math.abs((s.scrollTop||0)-i)>4&&(s.scrollTop=i)},r=s=>{const c=document.scrollingElement||document.documentElement;a(ae,e.dashboardScrollTop),a(s,e.panelScrollTop),a(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},o=()=>{const s=t?.isConnected?t:m("[data-panel]");let c=!1;if(e.anchorKey&&s){const i=Ah(e.anchorKey),u=s.querySelector(`[data-token-chart="${i}"], [data-token-mint="${i}"]`);if(u){const p=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(p)&&Math.abs(p)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+p)),c=!0}}c||r(s)};o(),requestAnimationFrame(()=>{o(),window.setTimeout(o,90),window.setTimeout(o,240),Gn()&&window.setTimeout(o,520)})}function iu(e,t){const a=Object.keys(e.dataset||{}).filter(s=>s!=="customFor"&&s!=="customSelect").sort().map(s=>`${s}=${e.dataset[s]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",o=`${e.tagName}:${e.type||""}:${e.name||""}:${a}${r}`;return a?o:`${o}:idx${t}`}function cu(e){const t=Array.from(e.options||[]),a=t.find(r=>r.defaultSelected);return a?a.value:t[0]?.value??""}function Ph(e){if(!e||e.dataset.renderedTab!==n.activeTab)return null;const t=new Map;let a="",r=null,o=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((s,c)=>{const i=iu(s,c);if(t.has(i))return;const u=s.type==="checkbox"||s.type==="radio",d=s.tagName==="SELECT",p=u?String(s.defaultChecked):d?cu(s):s.defaultValue,f=u?String(s.checked):s.value;if(f!==p&&(t.set(i,{value:f,defaultValue:p,isToggle:u,isSelect:d}),document.activeElement===s)){a=i;try{r=s.selectionStart,o=s.selectionEnd}catch{}}}),t.size?{tab:n.activeTab,fields:t,focusedKey:a,selectionStart:r,selectionEnd:o}:null}function Ch(e,t){if(!e||!t||e.tab!==n.activeTab)return;const a=Array.from(t.querySelectorAll("input, textarea, select")),r=o=>{a.forEach((s,c)=>{const i=s.tagName==="SELECT";if(o!==i)return;const u=iu(s,c),d=e.fields.get(u);if(!d)return;const p=s.type==="checkbox"||s.type==="radio";if((p?String(s.defaultChecked):i?cu(s):s.defaultValue)===d.defaultValue&&(p?s.checked=d.value==="true":s.value=d.value,u===e.focusedKey&&document.activeElement!==s))try{s.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&s.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function Lh(e){return!e||n.route!=="terminal"||n.activeTab==="terminal"||lu.has(n.activeTab)||e.dataset.renderedTab!==n.activeTab||n.activeTab==="smartChart"&&n.chartScrollIntoView?null:{tab:n.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:ae?.scrollTop||0}}function xh(e,t){if(!e||e.tab!==n.activeTab)return;const a=()=>{const r=t?.isConnected?t:m("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),ae&&ae.scrollHeight>ae.clientHeight+2&&(ae.scrollTop=Math.min(e.dashboardScrollTop,ae.scrollHeight-ae.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};a(),requestAnimationFrame(a)}function Mh(){const e=m("[data-panel]");if(!e)return;const t=dl(e),a=Ph(e),r=Lh(e),o=n.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,s=n.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),HS(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===n.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const i=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!n.navTekOpen||!jm()&&i}),n.activeTab==="terminal"&&(e.innerHTML=Op()),n.activeTab==="tek"&&(e.innerHTML=Rh()),n.activeTab==="dashboard"&&(e.innerHTML=Nh()),n.activeTab==="profile"&&(e.innerHTML=_h()),n.activeTab==="trade"&&(e.innerHTML=Fg()),n.activeTab==="bundle"&&(e.innerHTML=Hg()),n.activeTab==="volume"&&(e.innerHTML=ub()),n.activeTab==="live"&&(e.innerHTML=Op()),n.activeTab==="liveTrades"&&(e.innerHTML=Cw()),n.activeTab==="slimeScope"&&(e.innerHTML=nw()),n.activeTab==="watchlist"&&(e.innerHTML=Dw()),n.activeTab==="smartChart"&&(e.innerHTML=gw()),n.activeTab==="launchCoin"&&(e.innerHTML=vb()),n.activeTab==="launch"&&(e.innerHTML=db()),n.activeTab==="kol"&&(e.innerHTML=Fb()),n.activeTab==="ogreAi"&&(e.innerHTML=qg()),n.activeTab==="wallets"&&(e.innerHTML=ov()),n.activeTab==="positions"&&(e.innerHTML=uv()),n.activeTab==="pnl"&&(e.innerHTML=hv()),n.activeTab==="txAudit"&&(e.innerHTML=Cp()),n.activeTab==="sniper"&&(e.innerHTML=qw()),e.dataset.renderedTab=n.activeTab||"",n.activeTab==="ogreTek"&&(e.innerHTML=Jw(),e.dataset.renderedTab=n.activeTab||"",Gw()),Ch(a,e),to(e),xh(r,e),n.activeTab==="trade"||n.activeTab==="volume")try{Ig(e)}catch{}if(n.activeTab==="smartChart"&&n.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=m("[data-chart-buy-amount]");c&&c.focus(),n.chartFocusAmountInput=!1}),n.activeTab==="smartChart"&&n.chartScrollIntoView&&($h(e),n.chartScrollIntoView=!1),n.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=o),requestAnimationFrame(()=>{Math.abs(window.scrollY-s)>8&&window.scrollTo(0,s);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=o)})}pl(t,e),eh(),ca(),Hr(),_n(),Kr(),el(),n.activeTab==="kol"&&xl()}function Bh(){const e=n.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${l(n.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${l(Ot().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${l(n.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${l(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Rh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Bh()}
      <div class="tek-tool-grid">
        ${e.map(([t,a,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${l(a)}</strong>
            <small>${l(r)}</small>
          </button>`).join("")}
      </div>
      ${Eh()}
      ${Fh()}
    </section>
  `}const uu="slimewire-ogre-memory";function jr(){try{return JSON.parse(localStorage.getItem(uu)||"{}")||{}}catch{return{}}}function Gr(e={}){const t={...jr(),...e};try{localStorage.setItem(uu,JSON.stringify(t))}catch{}return t}function Ih(e,t=""){if(!e)return;const r=(jr().recentTokens||[]).filter(o=>o.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),Gr({recentTokens:r.slice(0,5)})}(function(){const t=jr();t.quickBuy&&!n.quickBuyAmountOverride&&(n.quickBuyAmountOverride=t.quickBuy)})();function du(){const t=or().filter(i=>{const u=Number(i.marketCapUsd??i.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(i=>["watching","active"].includes(String(i.status||"").toLowerCase())),o=r.filter(i=>{const u=Number(i.lastMovePct??i.wallets?.[0]?.lastMovePct),d=Number(i.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,s=Number(n.shieldReceipts?.stats?.watching||0),c=Number(n.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${o?` - ${o} near take-profit`:""}`:"",s?`🔎 ${s} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let pu=!1;function Oh(){if(pu||bn().length)return;pu=!0;const e=du(),t=jr(),a=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=a.length?` I remember: ${a.join(", ")}.`:"";ue({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function Eh(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...du(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${l(t)}</li>`).join("")}
      </ul>
    </section>
  `}function Fh(){Dh();const e=n.shieldReceipts;if(!e)return`
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
                <strong>$${l(r.symbol||w(r.mint))} <span class="negative">rugged</span></strong>
                <span>Flagged ${l(r.verdict)} (score ${l(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${l(Wh(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${l(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function Wh(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let mu=0;function Dh(){Date.now()-mu<300*1e3||(mu=Date.now(),k("/api/web/shield/receipts").then(e=>{n.shieldReceipts=e,n.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{n.proofStats=e?.alpha||null}).catch(()=>{}))}function Nh(){return`
    ${Jh()}
    ${Qa()}
    <section class="panel-grid">
      ${Xn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Xn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Xn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Xn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Xn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${yu()}
    ${bu()}
    ${vu()}
  `}function _h(){if(!ml())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${hu(!1)}
        <section class="profile-row-list">
          ${jh()}
          ${gu()}
        </section>
        ${fu()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:Gh()},{key:"login",label:"Login",hint:"Security",html:Xh()},{key:"pfp",label:"PFP",hint:"Avatar",html:Yh()},{key:"x",label:"X",hint:"Connect X",html:rg()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:Uh()},{key:"badges",label:"Badges",hint:"Earned",html:gu()},{key:"referral",label:"Referral",hint:"Invite & earn",html:og()},{key:"board",label:"Board",hint:"Top traders",html:lg()}];return`
    <section class="profile-row-shell">
      ${hu(!0)}
      ${an({toolKey:"profile",activeKey:nn("profile","account"),sections:t})}
      ${fu()}
    </section>
  `}function fu(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function Uh(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",a=n.pushAlertsEnabled===!0;return`
    <article class="profile-card">
      <div>
        <h3>Push Alerts</h3>
        <p>${l(e?t==="denied"?"Notifications are blocked for this site. Enable them in your browser settings, then try again.":a?"Push alerts are ON for this device. TP/SL fires and KOL copies ping you even with the site closed.":"Turn on push alerts to get pinged the moment a stop-loss or take-profit fires - no need to keep the tab open.":"This browser does not support push alerts. On iPhone, add SlimeWire to your Home Screen first (Share - Add to Home Screen).")}</p>
      </div>
      <div class="card-actions compact">
        ${e&&t!=="denied"?`
          <button class="primary" data-push-enable ${a?"hidden":""}>Enable Push Alerts</button>
          <button data-push-disable ${a?"":"hidden"}>Disable On This Device</button>`:""}
        <button data-telegram-link title="One tap: links this account to your Telegram so your take-profit wins can post in your groups (after /mywins on there)">Track Wins in Telegram</button>
      </div>
      <small data-push-status></small>
    </article>
  `}async function qh(){const e=m("[data-push-status]");try{v(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){v(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),v(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){v(e,N(t?.message||"Could not create the link."))}}function Hh(e){const t="=".repeat((4-e.length%4)%4),a=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(a);return Uint8Array.from([...r].map(o=>o.charCodeAt(0)))}async function Kh(){const e=m("[data-push-status]");try{v(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){v(e,"Push alerts are not configured on the server yet.");return}const a=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){v(e,"Notification permission was not granted.");return}const o=await a.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Hh(t.publicKey)}),s=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:o.toJSON()})});n.pushAlertsEnabled=!0,v(e,`Push alerts enabled (${s.devices||1} device${(s.devices||1)===1?"":"s"}).`),h()}catch(t){v(e,N(t?.message||"Could not enable push alerts."))}}async function Vh(){const e=m("[data-push-status]");try{const a=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:a.endpoint})}).catch(()=>{}),await a.unsubscribe().catch(()=>{})),n.pushAlertsEnabled=!1,v(e,"Push alerts disabled on this device."),h()}catch(t){v(e,N(t?.message||"Could not disable push alerts."))}}async function zh(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n.pushAlertsEnabled=!!t}catch{}}function ml(){return!!(ie()?.publicKey||n.user?.connectedWallet?.publicKey||Array.isArray(n.wallets)&&n.wallets.length)}function hu(e=ml()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function jh(){const e=ie();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Jr().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${l(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${l(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function Gh(){const e=n.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Za("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${l(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${l(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function Xh(){const e=n.user?.username||"";return`
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
        <input data-profile-password type="password" autocomplete="new-password" placeholder="${n.user?.hasPasswordLogin?"New password":"8+ characters"}">
      </label>
      <button type="button" class="primary" data-save-login-credentials>${e?"Update Login":"Save Login"}</button>
      <small data-login-security-status>${n.user?.hasPasswordLogin?"Password login is active for this profile.":"Password is stored as a salted hash. Private keys are not shown or emailed."}</small>
    </section>
  `}function Jh(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Xn(e,t,a,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${l(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${l(t)}</h3>
        <p>${l(a)}</p>
      </div>
    </article>
  `}function Yh(){const e=!!n.user?.avatar,t=n.xHandle?`@${n.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Za("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${Qh()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${t?`Use ${l(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${n.user.avatarSource?` from ${l(n.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function Qh(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,a])=>`
        <button type="button" data-preset-avatar="${l(t)}" data-avatar-label="${l(a)}" aria-label="Use ${l(a)} PFP">
          <img src="${l(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function gu(){const e=Number(n.pnl?.totals?.tradeCount||0),t=ml(),a=Number(n.livePairRows?.length||0)+Number(n.terminalEntry?.items?.length||0)+Number(n.livePairsByBucket?.fresh?.length||0),r=!!(n.lastUpdatedAt&&!n.walletRefreshError||n.walletRefreshStatus==="success"),o=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:a>0||!!n.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!oe("trade",n.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(n.livePairRows?.length||n.scan||n.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],s=o.filter(i=>i.earned).length,c=Math.round(s/Math.max(1,o.length)*100);return`
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
        ${o.map(({label:i,detail:u,earned:d,icon:p,quest:f})=>`
          <article class="earned-badge ${d?"is-earned":""}">
            <span class="earned-badge-icon">
              <img src="${l(p)}" alt="" aria-hidden="true">
            </span>
            <span class="earned-badge-quest">${l(f)}</span>
            <strong>${l(i)}</strong>
            <small>${d?"Earned":"Locked"} - ${l(u)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Qa(){const e=n.user?.connectedWallet,t=!!n.user?.avatar,a=n.xHandle?`@${n.xHandle}`:"";return`
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
          ${Jr().map(r=>`
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

      ${fl()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${Za("SW")}</div>
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
          <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${a?`Use ${l(a)} PFP`:"Use X PFP"}</button>
          ${t?'<button type="button" data-clear-avatar>Remove</button>':""}
        </div>
        <small data-avatar-status>${t?`PFP saved${n.user.avatarSource?` from ${l(n.user.avatarSource)}`:""}.`:"Optional. Connect X first if you want to use your X PFP."}</small>
      </article>

      <article class="setup-hub-panel">
        <h3>X Profile</h3>
        <p>Save, change, or unlink the handle used for share buttons, watch posts, and PFP import.</p>
        <label>
          X Handle
          <input data-x-handle type="text" placeholder="@yourhandle" value="${l(n.xHandle?`@${n.xHandle}`:"")}">
        </label>
        <div class="profile-actions">
          <button type="button" data-connect-x>${n.xHandle?"Save Different X":"Save X Handle"}</button>
          <button type="button" data-open-x-login>${n.xHandle?"Open X Profile":"Open X Login"}</button>
          ${n.xHandle?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
        </div>
        <small data-x-status>${n.xHandle?`Saved as @${l(n.xHandle)}. Type another handle and save to change it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
      </article>
    </section>
  `}function Tk(){const e=n.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Jr().map(t=>`
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
    ${fl({compact:!0})}
  `}function fl({compact:e=!1}={}){const t=n.user?.connectedWallet,a=Array.isArray(n.wallets)?n.wallets.length:0,r=n.wallets.filter(u=>u.sessionWallet),o=n.user?.automationPermission||{},s=!!n.user?.automationPermissionActive,c=o.expiresAt?we(o.expiresAt):"",i=n.automationDelegationStatus||(a?`${a} managed automation wallet(s) available. ${s?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
      <small data-automation-delegation-status>${l(i)}</small>
    </article>
  `}function ua({returnPath:e="/terminal"}={}){n.walletConnectMenuOpen=!0,n.walletConnectReturnPath=e||"/terminal",n.walletConnectStatus=n.user?.connectedWallet?`Connected ${w(n.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function Zh(e={}){return ua(e)}window.openWalletConnectModal=Zh;function eg(e){n.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",n.walletFastApprovalsEnabled?"on":"off")}catch{}}function tg(){const e=m("[data-wallet-connect-modal]");if(!e)return;if(!n.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=n.user?.connectedWallet||n.connectedWalletBalance;e.hidden=!1,mr(e,`
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
            <button type="button" data-wallet-fast-approvals-toggle>${n.walletFastApprovalsEnabled?"Fast approvals On":"Fast approvals Off"}</button>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
          <small>Fast approvals keeps SlimeWire ready and opens your wallet prompt immediately. Phantom/Solflare still require you to approve each transaction.</small>
        </div>
      `:""}
      <div class="wallet-provider-buttons modal-wallet-provider-buttons">
        ${Jr().map(a=>`
          <button type="button" class="wallet-provider-choice" data-connect-wallet-provider="${a.id}" ${a.detected?"":`title="${l(a.label)} ${a.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            <img src="${l(a.icon)}" alt="" aria-hidden="true">
            <span>
              <strong>${l(t?`Switch to ${a.label}`:a.mobileRedirect?`Open ${a.label}`:a.label)}</strong>
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
      <small class="connect-status" data-wallet-connect-status>${l(n.walletConnectStatus||"")}</small>
    </section>
  `,".wallet-connect-dialog")}function ag(){const e=n.quickBuyModal||{},t=xo()?.tokenMint===e.tokenMint?xo():ge(e.tokenMint,{source:e.source||"quick-buy-modal"}),a=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=hl(e.error||e.status||""),o=a||!!r,s=ce(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${dt(t)}
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
          ${tn(e.walletIndex||(ie()?.publicKey?"connected":""))}
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
        ${_("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(e.tokenMint||"")}" data-protected-buy-source="quick-buy-modal">Protected</button>`:""}
        <button type="button" class="primary" data-quick-buy-confirm ${o?"disabled":""}>${a?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${s?`<small class="quick-buy-wallet-note">${n.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${l(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${l(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${l(e.error||"")}</small>`}
    </section>
  `}function hl(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function ng(){let e=m("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!n.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=ag(),document.body.classList.add("quick-buy-modal-open")}function rg(){const e=!!n.xHandle;return`
    <section class="create-wallet-card x-connect-card">
      <div>
        <h3>X Profile</h3>
        <p>Save, change, or unlink the X handle used for share buttons on PnL cards, trades, scanner picks, watchlists, KOL signals, and launch watches. Posts always open in X for review first.</p>
      </div>
      <label>
        X Handle
        <input data-x-handle type="text" placeholder="@yourhandle" value="${l(n.xHandle?`@${n.xHandle}`:"")}">
      </label>
      <button type="button" data-connect-x>${e?"Save Different X":"Save X Handle"}</button>
      <button type="button" data-open-x-login>${e?"Open X Profile":"Open X Login"}</button>
      ${e?'<button type="button" class="danger-lite" data-clear-x>Unlink X</button>':""}
      <small data-x-status>${e?`Saved as @${l(n.xHandle)}. Enter a different handle and tap Save Different X to change it, or Unlink X to remove it.`:"Enter a handle, then Save X Handle. No X password is stored."}</small>
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
  `}function og(){const e=n.user?.referralCode||"",t=`${Pt.replace(/\/+$/,"")}/r/`,a=n.user?.referralLink||(e?`${Pt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=n.user?.referralStats||{},o=Array.isArray(r.referrals)?r.referrals:[];return`
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
      ${a?`
        <label class="referral-link-field">
          Your Referral Link
          <div class="referral-link-builder">
            <span>${l(t)}</span>
            <input data-referral-code type="text" inputmode="latin" autocomplete="off" maxlength="24" placeholder="your-code" value="${l(e)}" aria-label="Your custom referral code">
          </div>
          <input data-referral-link type="hidden" value="${l(a)}">
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
        <input data-referral-wallet type="text" placeholder="Wallet for referral fees" value="${l(n.user?.referralPayoutWallet||"")}">
      </label>
      <div class="card-actions">
        <button type="button" data-save-referral>Save Payout Wallet</button>
        ${a?`<button type="button" data-copy="${l(a)}">Copy Referral Link</button>`:""}
        ${a?je(`Trade faster on SlimeWire. Referral: ${a}`,"Share X"):""}
        ${a?wu(`Trade faster on SlimeWire. Referral: ${a}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${l(e)}${n.user?.referredByCode?` | Referred by ${l(n.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function sg(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Pt).pathname.split("/").map(s=>s.trim()).filter(Boolean),o=r.findIndex(s=>s.toLowerCase()==="r");if(o>=0&&r[o+1])return decodeURIComponent(r[o+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function lg(){const e=n.user?.traderBoardWalletMode||"all",t=Array.isArray(n.user?.traderBoardWalletIndexes)?n.user.traderBoardWalletIndexes:n.wallets.map(a=>String(a.index));return`
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
        ${n.wallets.length?yt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${n.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function bu(){return`
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
      <small data-restore-status>${n.restoreResult?l(n.restoreResult.message||"Restore complete."):""}</small>
      <small data-export-status>${n.backupResult?l(n.backupResult.message||"Backup ready."):""}</small>
    </section>
  `}function yu(){return`
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
      <small data-import-status>${n.importResult?l(n.importResult.message||"Import complete."):""}</small>
    </section>
  `}function vu(){return n.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function je(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${l(e)}">${l(t)}</button>`}function wu(e,t="TG"){const a=gl(e),r=`https://t.me/share/url?url=${encodeURIComponent(Pt)}&text=${encodeURIComponent(a)}`;return`<a href="${l(r)}" target="_blank" rel="noreferrer">${l(t)}</a>`}function gl(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Pt}`}function ig(e){const t=e.type==="buy",a=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${a}. Chart ${Q(e.tokenMint)}`}function Ak(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function cg(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Su(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function ug(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function dg(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${Q(e.tokenMint)}`}function pg(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${Q(e.tokenMint)}`}function mg(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function fg(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function bl(e){const t=String(e||"").trim(),a=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${Q(t)}`:"";return`Watching ${a}.${r}`}function ku(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const hg=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function yl(e=""){const t=String(e||"").trim().toLowerCase();return hg.filter(a=>!t||String(a.tier||"").toLowerCase()===t).sort((a,r)=>+!!r.pinned-+!!a.pinned||Number(a.rank||999)-Number(r.rank||999))}function Ft(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function $u(e=""){const t=String(e||"").trim();return Ft(t)?t:""}function gg(e={}){const t=String(e.wallet||"").trim(),a=$u(t),r=Xe(e.twitter||e.x||e.username||"");return{x:r?Sl(r):"",wallet:a?`https://solscan.io/account/${encodeURIComponent(a)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(a?wc(a):"")}}function bg(e={}){const t=String(e.wallet||"").trim(),a=$u(t),r=gg(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${l(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${l(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${l(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${a?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(a)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${a?`<button data-kol-scan-wallet="${l(a)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${a?`<button data-kol-copy-wallet="${l(a)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${a?`<button data-copy="${l(a)}">CA</button>`:""}
      ${Ll(e)}
    </div>
  `}function Tu(e={},t={}){const a=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${a?"is-compact":""}" data-tier="${l(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${Cu(e,a?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${l(e.tag||"Curated wallet")}</span>
          <h3>${l(e.name||e.twitter||w(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${l(Xe(e.twitter))}`:l(w(r)||"Social pending")}</p>
        </div>
        <b>#${l(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${l(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${l(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${l(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${l(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${bg(e)}
    </article>
  `}function yg(){const e=yl("hot"),t=yl("slimewire");return`
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
            ${e.length?e.map(a=>Tu(a)).join(""):I("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(a=>Tu(a,{compact:!0})).join(""):I("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function Za(e="SW"){const t=rt(n.user?.avatar||"");if(Au(t))return`<img src="${l(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${mi("ogre")}';">`;const a=mi("ogre");if(e==="SW"||e==="OG")return`<img src="${a}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${l(r)}</span>`}function Au(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function rt(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const a=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return a?`https://ipfs.io/ipfs/${encodeURIComponent(a).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function vg(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function wg(e="",t=""){const a=String(e||"").trim(),r=rt(t);if(!a||!r||Xr(a,r))return"";if(ft.set(a,r),ne("avatarCacheHit"),ft.size>900){for(const o of ft.keys())if(ft.delete(o),ft.size<=720)break}return r}function Pu(e="",t=""){return`${String(e||"").trim()}|${rt(t)}`}function Sg(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function Xr(e="",t=""){const a=Pu(e,t);if(!Yt.has(a))return!1;const r=Number(Sr.get(a)||0);return r&&Date.now()-r>Sg(t)?(Yt.delete(a),Sr.delete(a),!1):!0}function kg(e="",t=""){const a=String(e||"").trim(),r=rt(t);if(!a||!r)return;const o=Pu(a,r);if(Yt.add(o),Sr.set(o,Date.now()),Yt.size>1200){for(const s of Yt)if(Yt.delete(s),Sr.delete(s),Yt.size<=900)break}ft.get(a)===r&&ft.delete(a),ne("avatarFetchFailed")}function vl(e="",...t){const a=String(e||"").trim(),r=a?ft.get(a):"";if(r&&!Xr(a,r))return ne("avatarCacheHit"),r;r&&ft.delete(a);for(const o of t){const s=rt(o);if(s&&!Xr(a,s))return ne("avatarCacheMiss"),s}return ne("avatarFallbackShown"),""}window.__slimeRememberAvatar=wg,window.__slimeAvatarLoadFailed=function(t){const a=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";kg(a,r);const o=rt(t?.dataset?.backupSrc||"");if(o&&!Xr(a,o)){t.dataset.backupSrc="",t.dataset.avatarSrc=o,t.src=o;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function wl(e){const t=Xe(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function Sl(e=n.xHandle){const t=Xe(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function $g(e={}){const t=rt(e.avatar||e.image||"");if(Au(t))return t;const a=Xe(e.twitter||e.x||e.username||"");if(a)return wl(a);const r=Xe(e.name||e.kolName||"");return r&&r.length>=2?wl(r):""}function Tg(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function Cu(e={},t="kol-avatar"){const a=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=vl(a,$g(e)),o=Tg(e);return r?`<img class="${l(t)}" src="${l(r)}" data-avatar-key="${l(a)}" data-avatar-fallback="${l(o)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${l(t)} kol-avatar-fallback" aria-hidden="true">${l(o)}</div>`}function Jr(){const e=Ke();return[{id:"phantom",label:"Phantom",detected:!!me("phantom"),mobileRedirect:e&&!!On("phantom"),installUrl:zs("phantom"),icon:za("phantom")},{id:"solflare",label:"Solflare",detected:!!me("solflare"),mobileRedirect:e&&!!On("solflare"),installUrl:zs("solflare"),icon:za("solflare")},{id:"backpack",label:"Backpack",detected:!!me("backpack"),mobileRedirect:!1,installUrl:zs("backpack"),icon:za("backpack")},{id:"solana",label:"Detected Wallet",detected:!!me("solana"),mobileRedirect:!1,installUrl:"",icon:za("solana")}]}function me(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Ee(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function ie(){return n.user?.connectedWallet||n.connectedWalletBalance||null}function Ag(e=""){const t=ie();if(!t?.publicKey)return"";const a=String(e||"")==="connected"||!e&&!n.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${a?"selected":""}>${l(r)} - ${l(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}const Lu="/assets/slimewire/swap/states/",Pg="/assets/slimewire/swap/sfx/",xu="/assets/slimewire/volume/states/",Mu="/assets/slimewire/volume/sfx/";let da=!0;try{da=localStorage.getItem("ogreStageSound")!=="off"}catch{}const Bu={};function kl(e,t){if(da)try{let a=Bu[e];a||(a=new Audio(e),a.preload="auto",Bu[e]=a),a.volume=t??.7,a.currentTime=0,a.play().catch(()=>{})}catch{}}const F={kind:null,clip:"",eventUntil:0,prev:{},feed:[],feedIdx:0,tkTimer:0};function Cg(e){return e=String(e||""),e.length>9?`${e.slice(0,4)}…${e.slice(-4)}`:e||"coin"}function $l(e){return e&&e.symbol?`$${e.symbol}`:e&&e.shortMint?`$${e.shortMint}`:"the coin"}function Ru(e){return`<video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${e==="swap"?"/assets/slimewire/swap/hero.png":"/assets/slimewire/volume/hero.png"}" src="${e==="swap"?Lu:xu}idle.mp4"></video>`}function Lg(){return`
    <div class="ogre-stage swap" data-ogre-stage="swap">
      ${Ru("swap")}
      <span class="os-tier">OGRESWAP</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <span class="os-led"></span>
      <div class="os-shield" data-os-shield><span class="ic">🛡️</span><span data-os-shield-text>SHIELD</span></div>
      <div class="os-read" data-os-read><div class="l">SlimeShield score</div><div class="v" data-os-read-v>—</div></div>
      <div class="os-gauge"><div class="fill" data-os-gauge></div></div>
      <div class="os-orb" data-os-orb><span class="s" data-os-orb-s></span><span class="p" data-os-orb-p></span></div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>OgreSwap ready — paste a coin to appraise</span></div>
      <div class="os-cap"><h4>OgreSwap</h4><p>Appraise it · swap it · bank it.</p></div>
    </div>`}function xg(){return`
    <div class="ogre-stage volume" data-ogre-stage="volume">
      ${Ru("volume")}
      <span class="os-tier">SLIMEBOT</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
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
    </div>`}function Mg(e){return e==="volume"&&(n.volumeBots||[]).some(t=>t&&t.status!=="completed")?"running":"idle"}function Bg(e){if(F.kind==="swap"){const t={appraise:["appraise.mp3",.7],buy:["buy.mp3",.85],win:["win.mp3",.85],loss:["loss.mp3",.6],banking:["bank.mp3",.8]};t[e]&&kl(Pg+t[e][0],t[e][1])}else{const t={running:["start.mp3",.7],sweep:["sweep.mp3",.8]};t[e]&&kl(Mu+t[e][0],t[e][1])}}function Wt(e,t,a){const r=e.querySelector("[data-ogre-bg]");if(!r||F.clip===t)return;F.clip=t;const o=F.kind==="swap"?Lu:xu;try{r.loop=!a,r.muted=!0,r.src=o+t+".mp4",r.load();const s=r.play();s&&s.catch&&s.catch(()=>{})}catch{}a&&(F.eventUntil=Date.now()+(t==="running"?8500:4600),Bg(t))}function en(e,t){F.feed.unshift({text:e,color:t||""}),F.feed.length>16&&F.feed.pop(),F.feedIdx=0}function Rg(){const e=document.querySelector("[data-ogre-stage]");if(!e){F.tkTimer&&(clearInterval(F.tkTimer),F.tkTimer=0);return}const t=e.querySelector("[data-os-tk]");if(!t)return;if(!F.feed.length){if(F.kind==="volume"){const o=(n.volumeBots||[]).some(s=>s&&s.status!=="completed");t.innerHTML='<span class="os-dot"></span>'+(o?"Swarm running — generating lifelike volume":"SlimeBot idle — set a token and start")}else t.innerHTML='<span class="os-dot"></span>'+(n.tradeToken?"Coin loaded — set your size and SWAP":"OgreSwap ready — paste a coin to appraise");return}const a=F.feed[F.feedIdx++%F.feed.length],r=a.color?`<span class="os-dot" style="background:${a.color};box-shadow:0 0 8px ${a.color}"></span>`:'<span class="os-dot"></span>';t.innerHTML=r+l(a.text),t.style.animation="none",t.offsetWidth,t.style.animation="os-tkin .5s ease"}function Ig(e){const t=e.querySelector("[data-ogre-stage]");if(!t){F.kind=null;return}const a=t.getAttribute("data-ogre-stage");F.kind!==a&&(F.kind=a,F.clip="",F.eventUntil=0,F.prev={},F.feed=[],F.feedIdx=0);const r=t.querySelector("[data-ogre-snd]");r&&(r.textContent=da?"🔊":"🔇",r.onclick=s=>{s.stopPropagation(),da=!da;try{localStorage.setItem("ogreStageSound",da?"on":"off")}catch{}r.textContent=da?"🔊":"🔇"});const o=t.querySelector("[data-ogre-bg]");o&&!o.__ogreBound&&(o.__ogreBound=!0,o.addEventListener("ended",()=>{o.loop||(F.eventUntil=0,F.clip="",Wt(t,Mg(F.kind),!1))})),F.tkTimer||(F.tkTimer=setInterval(Rg,3400)),a==="swap"?Og(t):Eg(t)}function Og(e){const t=String(n.tradeToken||"").trim(),a=t?(n.slimeShieldResults||{})[t]:null,r=e.querySelector("[data-os-shield]"),o=e.querySelector("[data-os-shield-text]"),s=e.querySelector("[data-os-gauge]"),c=e.querySelector("[data-os-read]"),i=e.querySelector("[data-os-read-v]");if(a){const p=String(a.verdict||"").toLowerCase(),f=p.includes("avoid")||p.includes("danger")||p.includes("rug")?"avoid":p.includes("safe")||p.includes("clean")||p.includes("ok")?"safe":"risk";r&&(r.className="os-shield show "+f),o&&(o.textContent=String(a.verdict||"checked").toUpperCase());const y=Number(a.score);!isNaN(y)&&s&&(s.style.height=Math.max(6,Math.min(100,y))+"%"),!isNaN(y)&&c&&i&&(c.classList.add("show"),i.textContent=Math.round(y),i.className="v "+(f==="avoid"?"down":f==="safe"?"up":"")),e.classList.toggle("loss",f==="avoid")}else r&&(r.className="os-shield"),c&&c.classList.remove("show"),s&&(s.style.height="6%"),e.classList.remove("loss");if(t&&t!==F.prev.swapToken&&(F.prev.swapToken=t,en("Appraising $"+Cg(t),"#36e0c8"),Wt(e,"appraise",!0),!a&&typeof Uo=="function"))try{Uo(t).catch(()=>{})}catch{}const u=n.tradeResult,d=u?`${u.signature||u.message||""}|${u.type||""}`:"";if(u&&d!==F.prev.swapRes){if(F.prev.swapRes=d,u.type==="buy"){Wt(e,"buy",!0);const p=e.querySelector("[data-os-orb]");if(p){p.classList.add("show","up"),p.classList.remove("down");const f=p.querySelector("[data-os-orb-s]"),y=p.querySelector("[data-os-orb-p]");f&&(f.textContent=$l(u).replace("$","").slice(0,7)),y&&(y.textContent="HELD")}en("Bought "+$l(u),"#9dff6a")}else if(u.type==="sell"){Wt(e,"banking",!0);const p=e.querySelector("[data-os-orb]");p&&p.classList.remove("show"),en("Sold "+$l(u)+" — banked","#ffd45a")}}Date.now()>=F.eventUntil&&Wt(e,"idle",!1)}function Iu(e,t,a,r){const o=e.querySelector("[data-ov-swarm]");if(!o)return;if(t=Math.max(0,Math.min(12,Math.round(t))),o.children.length!==t){o.innerHTML="";for(let d=0;d<t;d++){const p=document.createElement("div");p.className="ov-orb";const f=d/t*Math.PI*2-Math.PI/2;p.style.left=50+Math.cos(f)*34+"%",p.style.top=46+Math.sin(f)*30+"%",o.appendChild(p)}}const s=o.children;if(!s.length)return;const c=Number(F.prev.volBuys||0),i=Number(F.prev.volSells||0),u=(d,p)=>{for(let f=0;f<p&&f<3;f++){const y=s[Math.floor(Math.random()*s.length)];y.classList.remove("buy","sell"),y.offsetWidth,y.classList.add(d),setTimeout(()=>y.classList.remove(d),430)}};a>c&&u("buy",a-c),r>i&&u("sell",r-i),(a>c||r>i)&&kl(Mu+"pulse.mp3",.32),F.prev.volBuys=a,F.prev.volSells=r}function Eg(e){const a=(n.volumeBots||[]).find(u=>u&&u.status!=="completed")||null,r=!!a,o=F.prev.volActive;e.classList.toggle("live",r),r&&!o&&(en("SlimeBot online — swarm spinning up","#c06bff"),Wt(e,"running",!0)),!r&&o&&(en("Swept back — funds returned home","#c06bff"),Wt(e,"sweep",!0)),F.prev.volActive=r,Date.now()>=F.eventUntil&&Wt(e,r?"running":"idle",!1);const s=e.querySelector("[data-ov-budget]"),c=e.querySelector("[data-ov-ring]"),i=e.querySelector("[data-ov-read]");if(a){const u=a.stats||{},d=Number(u.buys||0),p=Number(u.sells||0),f=Number(u.fundedSol||0),y=Number(a.currentCycle||0),g=Number(a.cycles||a.maxRounds||0),S=Number(a.buyAmountSol||0);if(s){s.classList.add("show");const A=s.querySelector("[data-ov-budget-v]");A&&(A.textContent=f.toFixed(3)+" SOL");const C=g>0?Math.min(1,y/g):0,M=s.querySelector("[data-ov-budget-bar]");M&&(M.style.width=C*100+"%")}if(c){c.classList.add("show");const A=2*Math.PI*22,C=g>0?Math.min(1,y/g):0,M=c.querySelector("[data-ov-ring-prg]");M&&(M.style.strokeDasharray=A,M.style.strokeDashoffset=A*(1-C));const q=c.querySelector("[data-ov-ring-lbl]");q&&(q.textContent=y+"/"+(g||"?"))}if(i){i.classList.add("show");const A=(d+p)*S,C=(M,q)=>{const J=i.querySelector(M);J&&(J.textContent=q)};C("[data-ov-vol]",A>0?A.toFixed(2)+" SOL":"—"),C("[data-ov-buys]",String(d)),C("[data-ov-sells]",String(p)),C("[data-ov-wallets]",String(Number(a.walletCount||0)))}Iu(e,Number(a.walletCount||6),d,p);const T=(a.log||[])[0],b=T?(T.at||"")+(T.message||""):"";T&&b!==F.prev.volLog&&(F.prev.volLog=b,en(String(T.message||"").slice(0,80),""))}else s&&s.classList.remove("show"),c&&c.classList.remove("show"),i&&i.classList.remove("show"),Iu(e,0,0,0)}function Fg(){const e=ie(),t=n.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const a=al(),r=_c(),o=Dc(a)||{symbol:a==="SOL"?"SOL":w(a),name:a==="SOL"?"Solana":""},s=Dc(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=oh(),i=n.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":i?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=i?a:r,p=d&&d!=="SOL"?d:n.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${i?"100":"0.0"}" aria-label="${i?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${Nc(a,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${l(p||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${Nc(r,{includeCustom:!0})}
              </select>`,g=`
            <div class="oss-slot oss-pay" data-swap-slot="${i?"token":"base"}">${i?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${i?"base":"token"}">${i?f:y}</div>`;return`
    ${Lg()}
    <section class="trade-layout">
      <article class="trade-card slime-swap-card ogre-swap-card ogre-swap-skin">
        <h3 class="ogre-swap-title oss-a11y-title">OgreSwap - live on-chain Solana swapper</h3>
        <div class="oss-stage-wrap">
          <div class="oss-stage" role="group" aria-label="OgreSwap swap panel">
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
                ${tn(e?.publicKey&&!t?"connected":"")}
              </select>
            </label>
          </div>
        </div>
        <p class="slime-swap-route-note oss-route">${l(u)}</p>

        <p class="trade-status oss-status" data-trade-status>${n.tradeResult?l(n.tradeResult.message||"Trade complete."):"Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>Web Swapping</h3>
          <p>Uses encrypted managed wallets, route previews, safety checks, slippage settings, and the same fee logic as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${n.tradeToken?l(n.tradeToken):"Paste a CA or tap Trade from a scanner pick."}</code>
          ${n.tradeToken?`<div class="card-actions">${je(bl(n.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${Gg()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${Wg()}
        ${Dg()}
      </aside>
    </section>
  `}function Tl(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!e?.volumeBot)}function Ou(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!!e?.volumeBot)}function tn(e=""){const t=Ag(e),a=Tl().map(r=>{const o=n.balances.find(i=>Number(i.index)===Number(r.index)),s=o?.sol!==null&&o?.sol!==void 0?`${Number(o.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${l(r.label)}${c} - ${s}</option>`}).join("");return t||a?`${t}${a}`:'<option value="">No wallet connected</option>'}function Wg(){if(!n.tradeResult)return`
      <article>
        <h3>Latest Result</h3>
        <p>Your latest web buy or sell recap will appear here after the transaction lands.</p>
      </article>
    `;const e=n.tradeResult,t=e.type==="buy";return`
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
        ${je(ig(e))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Dg(){if(!n.tradePlanResult)return`
      <article>
        <h3>Managed Exit</h3>
        <p>Use Buy + Watch Exit when you want the token trade to manage TP, SL, and timer exits automatically.</p>
      </article>
    `;const e=n.tradePlanResult;return`
    <article class="latest-trade">
      <h3>Managed Trade Armed</h3>
      <p>${l(e.message||"")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${l(e.walletLabel||`${e.successCount||0}/${e.walletCount||0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${l(e.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>${l(e.takeProfitSummary||`+${e.takeProfitPct}%`)} / ${l(e.stopLossSummary||`-${e.stopLossPct}%`)}</dd></div>
        <div><dt>Timer Exit</dt><dd>${l(Jg(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${je(cg(e,"Armed managed trade"))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Eu(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const a=t.toLowerCase(),r=a.includes("bonk")?"Bonk":a.includes("meteora")?"Meteora":a.includes("orca")?"Orca":a.includes("raydium")?"Raydium":a.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${l(t)}">${l(r)}</span>`}function Ng(){if(!n.ogreAiResult)return`
      <article class="latest-trade ogre-ai-result-card">
        <h3>Ogre A.I. Orders</h3>
        <p>Start an automation run to scan best picks, buy with selected managed wallets, and arm TP/SL exits.</p>
      </article>
    `;const e=n.ogreAiResult,t=Array.isArray(e.plans)?e.plans:[],a=Array.isArray(e.picks)?e.picks:[],r=Array.isArray(e.errors)?e.errors:[];return`
    <article class="latest-trade ogre-ai-result-card">
      <h3>${t.length?"Ogre A.I. Armed":a.length?"Ogre A.I. Picked":"Ogre A.I. Orders"}</h3>
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
              ${Eu(s)}
              <span>${l(s.name||o.tokenMint||"")}</span>
              <small>Score ${l(s.score||"n/a")} | MC ${l(s.marketCapLabel||"n/a")} | Liq ${l(s.liquidityLabel||"n/a")} | Age ${l(s.ageLabel||"n/a")}</small>
              ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(c=>l(c)).join(" | ")}</small>`:""}
              <small>${l(o.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${l(o.tokenMint)}">Copy CA</button>
                <a href="${l(s.dexUrl||o.dexUrl||Q(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${s.pumpUrl?`<a href="${l(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":a.map(o=>`
          <div class="ogre-ai-pick-card">
            <strong>${l(o.symbol||o.shortMint||"Pick")}</strong>
            ${Eu(o)}
            <span>${l(o.name||o.tokenMint||"")}</span>
            <small>Score ${l(o.score||"n/a")} | MC ${l(o.marketCapLabel||"n/a")} | Liq ${l(o.liquidityLabel||"n/a")} | Age ${l(o.ageLabel||"n/a")}</small>
            ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(s=>l(s)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${l(o.tokenMint)}">Copy CA</button>
              <a href="${l(o.dexUrl||Q(o.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${o.pumpUrl?`<a href="${l(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(o=>`<span data-ok="false">${l(o.shortMint||o.tokenMint)}: ${l(o.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const Jn=[["strong","Strong 🔥","Highest win-rate mode. Waits for survivors (1.5–12 min old) with proven net-buying, real holders and healthy liquidity, then targets a 2x — entering before the breakout, not after. Built to win more than it loses."],["super_fresh","Super-fresh","Brand-new sub-$8K launches (under ~2 min) with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function Yr(){const e=a=>Jn.some(([r])=>r===a);if(n.ogreAiCategory&&e(n.ogreAiCategory))return n.ogreAiCategory;const t=Ui().category;return e(t)?t:"strong"}function Fu(e){const t=Jn.find(([a])=>a===e);return t?t[2]:Jn[0][2]}function _g(e){return`<div class="ogre-cat-segment" role="group">${Jn.map(([t,a])=>`<button type="button" data-ogre-cat="${l(t)}" data-active="${e===t}">${l(a)}</button>`).join("")}</div>`}function Ug(){const e=n.ogreAutopilot||{},t=!!e.enabled,a=Wu(e.category||Yr()),r=(c,i)=>c==null||c===""?i:c,o=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),s=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
    <article class="ogre-autopilot ${t?"is-on":""}" data-preserve-focus>
      <div class="ogre-autopilot-head">
        <div>
          <h3>Autopilot</h3>
          <p>Auto-ape the best <strong>${l(a)}</strong> pick on a timer, using the TP/SL/timer/slippage and wallets above — within hard guards.</p>
          <p style="margin-top:6px"><a href="/autopilot" style="color:#39ff14;font-weight:800;text-decoration:none">🤖 Open Full Autopilot (paper test — no SOL) →</a></p>
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
        <button type="button" class="primary" data-autopilot-save ${n.ogreAutopilotBusy?"disabled":""}>${n.ogreAutopilotBusy?"Saving...":"Save autopilot"}</button>
      </div>
      <small data-autopilot-status>${l(o)}${s?` — ${l(s)}`:""}</small>
    </article>
  `}function Wu(e){const t=Jn.find(([a])=>a===e);return t?t[1]:"Super-fresh"}function qg(){if(!n.wallets.length)return`${Qa()}${I("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=Ui(),t=e.amountSol||"0.1",a=e.runCount||"1",r=(s,c,i)=>{const u=String(s||i||"");return u==="custom"?String(c||"custom"):u},o=Yr();return`
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
          ${_g(o)}
          <small class="ogre-cat-hint">${l(Fu(o))}</small>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="${l(t)}">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              ${["1","2","3","5","10","25"].map(s=>`<option value="${s}" ${a===s?"selected":""}>${s} ${s==="1"?"order":"orders"}</option>`).join("")}
            </select>
          </label>
          ${Nt({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${Nt({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Ge("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${Nt({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${yt("ogre-ai")}
        </div>
        ${Dt("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${n.ogreAiLoading?"disabled":""}>${n.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${l(n.ogreAiStatus||Fu(o))}</small>
      </article>

      <aside class="trade-side">
        ${fl({compact:!0})}
        ${Ug()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${Ng()}
      </aside>
    </section>
  `}function Hg(){return n.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${n.bundleToken?Q(n.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${an({toolKey:"bundle",activeKey:nn("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${l(n.bundleToken||n.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${yt("bundle")}
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
        <p class="trade-status" data-bundle-status>${n.bundleResult?l(n.bundleResult.message||"Bundle complete."):"Ready."}</p>`},{key:"autoexit",label:"Auto Exit",hint:"TP / SL plan",html:`
          <p>Optional timed plan for selected wallets. Use presets or type custom targets like 500 or 5x.</p>
          <div class="volume-grid">
            <label>
              Fallback Sell
              ${Ge("bundle-plan-delay","data-bundle-plan-delay","5")}
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
              ${Qr("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${eo("bundle-plan")}
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
        ${Xg()}
        ${Kg()}
      </aside>
    </section>
  `:`${Qa()}${I("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function Kg(){if(!n.bundleResult)return`
      <article>
        <h3>Latest Bundle</h3>
        <p>Bundle buy/sell results will show here wallet by wallet.</p>
      </article>
    `;const e=n.bundleResult.source==="web_bundle_plan"?"Bundle Auto Exit Plan":n.bundleResult.type==="bundle_sell"?"Bundle Sell":"Bundle Buy";return`
    <article class="latest-trade">
      <h3>${l(e)}</h3>
      <p>${l(n.bundleResult.message||"")}</p>
      <div class="mini-results">
        ${(n.bundleResult.results||[]).map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${l(n.bundleResult.tokenMint)}">Copy CA</button>
        <a href="${l(n.bundleResult.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function yt(e,t=null){const a=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return Tl().map((o,s)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${o.index}" ${r?r.has(String(o.index))?"checked":"":s<a?"checked":""}>
      <span>${o.index}. ${l(o.label)}</span>
      <code>${l(o.shortPublicKey||o.publicKey)}</code>
    </label>
  `).join("")}function Dt(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${l(t)}">
    </label>
  `}function Vg(e=""){return n.wallets.length?n.wallets.map((t,a)=>{const r=String(t.index??a+1),o=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${l(r)}" ${String(e)===r?"selected":""}>${l(o)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,a=""){const r=m(e)?.value||a;if(r!=="custom")return r;const o=m(t)?.value?.trim();if(!o)throw new Error("Enter the custom value first.");return o}function ot(e,t=""){const a=n.presets?.[e]||[],r=!t||t==="none"||t==="manual",o=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return a.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${a.map(s=>`<option value="${l(s.id)}" ${s.id===t?"selected":""}>${l(s.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
    `}function Du(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${l(qe()||"0.10")}" value="${l(n.quickBuyAmountOverride)}">`}function Nu(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${Du()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${l(e)}">
          ${ot("trade",n.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const zg=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],jg=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function Nt({selectAttr:e,customAttr:t,customFor:a,options:r,selected:o="",customType:s="text",customPlaceholder:c="Custom time"}){const i=String(o||""),d=new Set(r.map(([f])=>f)).has(i)?i:"custom",p=d==="custom"&&i!=="custom"?i:"";return`
    <select ${e} data-custom-select="${l(a)}">
      ${r.map(([f,y])=>`<option value="${l(f)}" ${f===d?"selected":""}>${l(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${l(a)}" type="${l(s)}" value="${l(p)}" placeholder="${l(c)}" ${d==="custom"?"":"hidden"}>
  `}function Ge(e,t,a="off"){return Nt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:zg,selected:a,customPlaceholder:"Custom: 45s, 20, 2h"})}function Qr(e,t,a="0"){return Nt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:jg,selected:a,customPlaceholder:"Custom: 30s, 20, 2h"})}function Al(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${Du()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${l(e)}">
          ${ot("trade",n.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${l(e)}">
          ${ot("bundle",n.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function Pk(){const e=n.fastTradePresetStatus||(n.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${tn()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${Ge("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function Ck(){const e=n.fastBundlePresetStatus||(n.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${yt("fast-bundle-preset")}</div>
        ${Dt("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${Ge("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function _u(e){const t=e==="trade"?n.editingTradePresetId:n.editingBundlePresetId;return t?oe(e,t):null}function Zr(e,t){e==="trade"&&(n.editingTradePresetId=t||""),e==="bundle"&&(n.editingBundlePresetId=t||"")}function Gg(){const e=_u("trade"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${l(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${tn(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${l(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${l(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${Ge("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${Uu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function Xg(){const e=_u("bundle"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${l(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${yt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Dt("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${l(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${l(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${Ge("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${Uu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function Uu(e){const t=n.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const a=e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId;return`
    <div class="preset-list">
      ${t.map(r=>{const o=r.id===a;return`
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
  `}function Jg(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function eo(e){return`
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
  `}function pa(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function to(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(o=>o.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function Yg(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),a=document.querySelector(`[data-custom-select="${t}"]`);a&&(a.value="off"),to()}function qu(){return n.wallets.map(e=>`<option value="${l(e.index)}">${l(e.index)}. ${l(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function Qg(){return n.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${qu()}</select>
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
      <p class="trade-status" data-distribute-status>${l(n.distributeStatus||"Sends real SOL from the source wallet to each new wallet.")}</p>
    </article>
  `:""}function ao(e){n.distributeStatus=String(e||"");const t=m("[data-distribute-status]");t&&(t.textContent=n.distributeStatus)}function Zg(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.wallets.filter(r=>r.sessionWallet),a=t.length?t:n.wallets;return a.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${l(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${n.returnFundsBusy?"disabled":""}>${n.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${l(n.returnFundsStatus||`${a.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Yn(e){n.returnFundsStatus=String(e||"");const t=m("[data-return-funds-status]");t&&(t.textContent=n.returnFundsStatus)}async function Hu(e="leaving"){try{const t=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!t?.publicKey)return;const a=n.wallets.filter(s=>s.sessionWallet);if(!a.length)return;const r=a.map(s=>String(s.index));if(!await Le({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function eb(){if(n.returnFundsBusy)return;const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey){Yn("Connect a wallet first.");return}const t=n.wallets.filter(s=>s.sessionWallet),r=(t.length?t:n.wallets).map(s=>String(s.index));if(!r.length){Yn("No managed wallets to return from.");return}if(await Le({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){n.returnFundsBusy=!0,Yn("Selling tokens and returning SOL..."),h();try{const s=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:te});n.returnFundsBusy=!1,Yn(s.summary||"Funds returned to your connected wallet."),await Ne({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(s){n.returnFundsBusy=!1,Yn(s.message),h()}}}async function tb(){if(n.distributeBusy)return;const e=m("[data-distribute-count]")?.value||"5",t=m("[data-distribute-amount]")?.value||"",a=m("[data-distribute-source]")?.value||"1",r=m("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){ao("Enter SOL per wallet greater than zero.");return}const o=(Number(t)||0)*(Number(e)||0);if(await Le({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${o.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){n.distributeBusy=!0,ao("Creating and funding wallets..."),h();try{await Y(m("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:a,label:r}),dedupe:!1,timeoutMs:te});c.downloads?.encryptedBackup?.text&&fe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&fe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.distributeBusy=!1,ao(c.summary||"Fresh wallets created and funded. Backups downloaded."),await Ne({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){n.distributeBusy=!1,ao(c.message),h()}}}function ab(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function nb(){const e=Ou().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${n.sweepBackgroundStatus?`<small data-sweep-background-status>${l(n.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function rb(){const e=Array.isArray(n.volumeBots)?n.volumeBots:[],t=nb();return e.length?t+e.map(a=>{const r=a.stats||{},o=a.status!=="completed",s=(a.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${l(a.shortMint||a.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${l(a.stage||"")}">${l(ab(a))}</span>
          </div>
          ${o?`<button class="secondary" data-vbot-stop="${l(a.id)}">Stop & Sweep</button>`:`<a class="mini-link" href="${l(a.dexUrl||"#")}" target="_blank" rel="noreferrer">Dex</a>`}
        </header>
        <div class="volume-bot-metrics">
          <div><span>Cycle</span><strong>${l(Number(a.currentCycle||0))}/${l(Number(a.cycles||0))}</strong></div>
          <div><span>Wallets</span><strong>${l(Number(a.walletCount||0))}</strong></div>
          <div><span>Buys</span><strong>${l(Number(r.buys||0))}</strong></div>
          <div><span>Sells</span><strong>${l(Number(r.sells||0))}</strong></div>
          <div><span>Errors</span><strong>${l(Number(r.errors||0))}</strong></div>
        </div>
        <small>${l(a.message||"")}</small>
        ${s.length?`<ul class="volume-bot-log">${s.map(c=>`<li>${l(c.message||"")}</li>`).join("")}</ul>`:""}
      </article>
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function Pl(e,t,a){return`<div class="vbot-segment" role="group">${a.map(([r,o])=>`<button type="button" data-vbot-set-${e}="${l(r)}" data-active="${t===r}">${l(o)}</button>`).join("")}</div>`}function ob(){const t=(Array.isArray(n.volumeBots)?n.volumeBots:[]).filter(c=>c.status!=="completed"),a=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),o=c=>c.reduce((i,u)=>i+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),s=(c,i,u,d,p)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${l(c)}</h4>
      <p class="vbot-queue-sub">${l(i)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${u} / ${d}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,u/d*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${p}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${s("SMART","Smart Mode RPC Servers",a.length,10,o(a))}
      ${s("SPAMMER","Spammer RPC Servers",r.length,1,o(r))}
    </div>`}function sb(){return`
    ${xg()}
    <section class="trade-card volume-bot-card slime-configurator ovs-skin" data-preserve-focus>
      <h2 class="vbot-config-title oss-a11y-title">Volume Configurator</h2>
      <div class="ovs-stage">
        <span class="ovs-mlabel" aria-hidden="true">VOLUME CONFIGURATOR</span>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Contract Address</span>
        <input class="ovs-ca" data-vbot-token type="text" placeholder="Paste contract address" value="${l(n.volumeToken||n.tradeToken||"")}" aria-label="Contract address">
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
        <div class="ovs-mode">${Pl("mode",n.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${Pl("aggr",n.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${qu()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Stagger pattern</span>
            ${Pl("stagger",n.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Ladder"]])}
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
          ${(()=>{const e=(Array.isArray(n.volumeBots)?n.volumeBots:[]).find(t=>t&&t.status!=="completed");return e?`<button type="button" class="vbot-stop-sweep" data-vbot-stop="${l(e.id)}">&#9209; Stop &amp; Sweep Back</button>`:""})()}
        </div>
        <p class="trade-status" data-vbot-status>${l(n.volumeBotStatus||"Set a token, investment, and mode, then Start. Spends real SOL from the source wallet.")}</p>

        <div class="vbot-queue">
          <div class="vbot-queue-head"><span class="vbot-config-label small">GLOBAL QUEUE</span><strong>Queue Status</strong></div>
          ${ob()}
        </div>

        <div class="volume-bot-list">
          ${rb()}
        </div>
      </div>
    </section>
  `}function lb(){const e=n.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(n.slimeBotAggr)?n.slimeBotAggr:"med",a=Math.max(.05,Math.min(50,Number(m("[data-vbot-invest-num]")?.value||m("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(m("[data-vbot-duration]")?.value||"60"))),s={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",i=s.delaySecs*(c?4:1);let u=Math.round(r*60/i);u=Math.max(1,Math.min(250,u,Math.floor(a/.01)));const d=Math.max(.005,Math.min(.5,a/u));return{tokenMint:m("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:m("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(s.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(s.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(s.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!m("[data-vbot-keepdust]")?.checked,offsetSell:!!m("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(n.slimeBotStagger)?n.slimeBotStagger:"steady",investment:a,durationMin:r,mode:e,aggr:t}}function ma(e){n.volumeBotStatus=String(e||"");const t=m("[data-vbot-status]");t&&(t.textContent=n.volumeBotStatus)}async function no({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");n.volumeBots=Array.isArray(t.bots)?t.bots:[],n.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function ib(){if(n.volumeBotBusy)return;const e=lb();if(!e.tokenMint){ma("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Le({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){n.volumeBotBusy=!0,ma("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:te});n.volumeBotBusy=!1,r.bot&&(n.volumeBots=[r.bot,...n.volumeBots.filter(o=>o.id!==r.bot.id)]),ma(r.bot?.message||"SlimeBot started."),h(),no()}catch(r){n.volumeBotBusy=!1,ma(r.message),h()}}}async function cb(e){if(e)try{ma("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:te});t.bot&&(n.volumeBots=n.volumeBots.map(a=>a.id===t.bot.id?t.bot:a)),ma(t.bot?.message||"Stop requested."),h(),no()}catch(t){ma(t.message)}}function ub(){return n.wallets.length?sb():`${Qa()}${I("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function db(){const e=be([...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...De()?.rows||[],...n.scan?.rows||[]]).sort(Qe),t=mn(e),a=at("launch",t),r=pn(),o=St(Me().keywords)[0]||"";return`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Watch fresh live pairs by ticker/keyword before launch, then arm wallets and exits when you are ready.</p>
          </div>
          <div class="card-actions launch-head-actions">
            <button type="button" class="primary" data-refresh-live-pairs>${n.livePairsLoadingByBucket[n.livePairBucket]?"Refreshing...":"Refresh"}</button>
            <span class="sync-pill">${l(a.length)}/${l(e.length)} matching</span>
          </div>
        </div>
        ${Ql("launch",{rawCount:e.length,visibleCount:t.length})}
        ${Yl(e,t)}
        ${a.length?it(a,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:$a}):r?dr(e,"launch candidates"):I("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
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
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${l(o.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${yt("launch")}
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
            ${Ge("launch-delay","data-launch-delay","3")}
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
            ${Qr("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${eo("launch")}
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${n.launchResult?l(n.launchResult.message||"Launch watch armed."):"Ready."}</p>
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
          <p>It scans live launch/profile feeds about every ${l(Mb())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${ad()}
        </article>
      </aside>
    </section>
  `}function Ku(e=n.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||n.launchWatches?.[0]?.tokenMint||n.launchWatches?.[0]?.mint||n.smartChartToken?.tokenMint||n.smartChartToken?.mint||"").trim()}function Cl(){return!!(Xt&&Xt.enabled&&(Xt.provider||Xt.playbackBaseUrl||Xt.ingestUrl))}function pb(){const e=String(Xt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function mb(e){const t=String(Xt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const a=t.includes("?")?"&":"?";return`${t}${a}mint=${encodeURIComponent(e)}`}function fb(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function Vu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function hb(e=n.launchCoinDraft||{}){const t=Ku(e),a=Cl(),r=mb(t),o=n.pumpLiveStatus||(t?a?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),s=t?"":"disabled",c=a&&r?`<iframe class="pump-live-frame" src="${l(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
    <section class="launch-coin-card pump-live-panel" data-pump-live-panel>
      <div class="pump-live-head">
        <div>
          <p class="panel-kicker">Pump Live</p>
          <h4>Live launch studio</h4>
          <p>Keep the launch, chart, transactions, and creator controls inside Slime.</p>
        </div>
        <span class="pump-live-pill ${a?"ready":"standby"}">${l(a?"provider ready":"standby")}</span>
      </div>
      <div class="pump-live-grid">
        <div class="pump-live-video">
          ${c}
        </div>
        <div class="pump-live-stack">
          <div class="pump-live-stat"><span>Launch CA</span><strong>${l(fb(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${l(pb())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${l(Vu(t))}</strong></div>
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
  `}function an({toolKey:e,activeKey:t,sections:a,variant:r=""}){const o=a.some(s=>s.key===t)?t:a[0]?.key;return`
    <div class="tool-panels${r==="stacked"?" is-stacked":""}" data-tool-panels="${l(e)}">
      <nav class="tool-panel-nav" aria-label="Sections">
        ${a.map(s=>`
          <button type="button" class="tool-panel-tab" data-tool-section="${l(e)}:${l(s.key)}" data-active="${s.key===o?"true":"false"}">
            <span class="tool-panel-tab-label">${l(s.label)}</span>
            ${s.hint?`<span class="tool-panel-tab-hint">${l(s.hint)}</span>`:""}
          </button>`).join("")}
      </nav>
      <div class="tool-panel-stack">
        ${a.map(s=>`
          <section class="tool-panel" data-tool-panel="${l(e)}:${l(s.key)}"${s.key===o?"":" hidden"}>
            ${s.title?`<h4 class="tool-panel-title">${l(s.title)}</h4>`:""}
            ${s.html}
          </section>`).join("")}
      </div>
    </div>
  `}function nn(e,t){return n.toolSections&&n.toolSections[e]||t}function gb(){const e=n.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,a=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${l(Ha(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${je(a+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function bb(e={}){zu();const t=n.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
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
      <p class="trade-status full-span" data-hype-status>${l(n.hypeStatus||"")}</p>
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
    </div>`}let ro="";function zu(){!n.user||ro===n.user.id||(ro=n.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});n.hypePages=e.pages||[],n.hypePages.length&&h()}catch{ro=""}})())}async function yb(){const e=m("[data-hype-status]"),t=String(m("[data-hype-name]")?.value||m("[data-launch-coin-name]")?.value||"").trim(),a=String(m("[data-hype-symbol]")?.value||m("[data-launch-coin-symbol]")?.value||"").trim(),r=String(m("[data-hype-launch-at]")?.value||"").trim(),o=String(m("[data-hype-blurb]")?.value||"").trim();if(!t||!a){v(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){v(e,"Pick the launch time.");return}v(e,"Creating hype page...");try{const s=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:a,blurb:o,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});n.hypeStatus=`Hype page live: ${s.url} - share it everywhere, it forwards to your chart at launch.`,ro="",zu(),h()}catch(s){v(e,N(s?.message||"Could not create the hype page."))}}function vb(){const e=n.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
            <label class="full-span">
              Banner (optional)
              <input data-launch-coin-banner type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif">
              <span class="muted">Wide 3:1 cover image or animated GIF (1500×500). Saved with your coin, pinned to IPFS, and shown on its SlimeWire page. SlimeWire resizes stills to 1500×500.</span>
              <span class="launch-image-preview-wrap" data-launch-banner-preview-wrap ${e.bannerDataUrl?"":"hidden"}>
                <img class="launch-image-preview" data-launch-banner-preview ${e.bannerDataUrl?`src="${e.bannerDataUrl}"`:""} alt="Coin banner preview" style="aspect-ratio:3/1;object-fit:cover;width:100%;max-width:360px;">
                <span class="launch-image-preview-meta" data-launch-banner-preview-meta>${l(e.bannerName?`${e.bannerName} · saved with the sheet`:"")}</span>
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
              <input data-launch-coin-fee-recipient type="text" placeholder="Optional wallet address" value="${l(e.creatorFeeRecipient||"")}">
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
                ${Vg(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
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
                ${ot("trade",e.tradePresetId||n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${ot("bundle",e.bundlePresetId||n.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${l(e.amountSol||qe()||"0.1")}">
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
              ${Ge("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
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
                ${n.wallets.length?yt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Dt("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:bb(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:hb(e)}];return`
    ${gb()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${an({toolKey:"launchCoin",activeKey:nn("launchCoin","coin"),sections:t})}

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <button type="button" data-launch-coin-save>Save Launch Sheet</button>
          <button type="button" data-launch-coin-use-ca>Use Live CA</button>
          <a href="https://pump.fun/create" target="_blank" rel="noreferrer">Open Pump Create</a>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${l(n.launchCoinStatus||"Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The official Pump and Dex links remain available as fallback tools.")}</p>
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
          ${ad()}
        </article>
      </aside>
    </section>
  `}function wb(){const e=n.launchCoinDraft||{},t=m("[data-launch-coin-image]")?.files?.[0];return{name:(m("[data-launch-coin-name]")?.value||"").trim(),symbol:(m("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(m("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",bannerName:m("[data-launch-coin-banner]")?.files?.[0]?.name||e.bannerName||"",bannerDataUrl:e.bannerDataUrl||"",bannerType:e.bannerType||"",website:(m("[data-launch-coin-website]")?.value||"").trim(),x:(m("[data-launch-coin-x]")?.value||"").trim(),telegram:(m("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:(()=>{const a=m("[data-launch-coin-creator-fee]")?.value;return a==="custom"?String(Math.min(1e3,Math.max(0,Math.round((Number(m("[data-launch-coin-creator-fee-custom]")?.value)||0)*100)))):a||e.creatorFeeBps||"1000"})(),creatorFeeRecipient:(m("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:m("[data-launch-coin-fee-mode]")?.value||e.feeMode||"dev",buybackWallet:(m("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!m("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!m("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:m("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:X(m("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(m("[data-launch-coin-ca]")?.value||"").trim(),action:m("[data-launch-coin-action]")?.value||"watch",tradePresetId:m("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:m("[data-launch-coin-bundle-preset]")?.value||"",amountSol:X(m("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:m("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:Ue("launch-coin"),walletGroup:m("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function oo(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function Qn({silent:e=!1}={}){try{const t=wb();n.launchCoinDraft=t,xa(t);const a=t.name||t.symbol||"launch";return n.launchCoinStatus=`Saved ${a}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${oo(t.action)}.`,e||v(m("[data-launch-coin-status]"),n.launchCoinStatus),t}catch(t){throw n.launchCoinStatus=t.message,v(m("[data-launch-coin-status]"),t.message),t}}function ju(e){return new Promise((t,a)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>a(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function Gu(e){return new Promise((t,a)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>a(new Error("Could not preview that image for compression.")),r.src=e})}function rn(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function Xu(e){if(!e)return"";const t=8*1024*1024,a=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const o=await ju(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(o.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return o}try{const s=await Gu(o),c=384,i=Math.min(1,c/Math.max(s.width||c,s.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((s.width||c)*i)),u.height=Math.max(1,Math.round((s.height||c)*i)),u.getContext("2d").drawImage(s,0,0,u.width,u.height);const p=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of p){const g=u.toDataURL(f,y);if(g.length<=a)return g}}catch(s){const c=m("[data-launch-coin-status]"),i="Preview unavailable; SlimeWire will try to convert this image during launch.";if(n.launchCoinStatus=i,v(c,i),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:s?.message||""}),o.length<=r)return o}if(o.length<=r){const s=m("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return n.launchCoinStatus=c,v(s,c),o}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function Ju(e){if(!e)return"";const t=8*1024*1024,a=7e6;if(e.size>t)throw new Error("Banner is over 8MB. Use a smaller wide image or GIF (1500×500 works best).");const r=await ju(e);if(e.type==="image/gif"||/\.gif$/i.test(e.name||"")){if(r.length>a)throw new Error("Animated banner is too large. Keep it under ~5MB.");return r}try{const o=await Gu(r),s=1500,c=Math.min(1,s/Math.max(1,o.width||s)),i=document.createElement("canvas");i.width=Math.max(1,Math.round((o.width||s)*c)),i.height=Math.max(1,Math.round((o.height||Math.round(s/3))*c)),i.getContext("2d").drawImage(o,0,0,i.width,i.height);for(const[d,p]of[["image/webp",.82],["image/webp",.7],["image/jpeg",.8],["image/jpeg",.66]]){const f=i.toDataURL(d,p);if(f.length<=a)return f}}catch{}if(r.length<=a)return r;throw new Error("Banner is too large for upload. Use a smaller wide image or GIF.")}async function Sb(){const e=m("[data-launch-coin-banner]")?.files?.[0];if(e){const a=await Ju(e);return{bannerName:e.name,bannerType:rn(a,e.type||"image/jpeg"),bannerDataUrl:a}}const t=n.launchCoinDraft||{};return t.bannerDataUrl?{bannerName:t.bannerName||"banner",bannerType:t.bannerType||rn(t.bannerDataUrl,"image/jpeg"),bannerDataUrl:t.bannerDataUrl}:{}}async function kb(){const e=m("[data-launch-coin-image]")?.files?.[0];if(e){const a=await Xu(e);return{imageName:e.name,imageType:rn(a,e.type||"application/octet-stream"),imageDataUrl:a}}const t=n.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||rn(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function Yu(e,t){const a=String(t||"").trim();n.launchCoinDraft={...e||{},tokenMint:a,updatedAt:new Date().toISOString()},xa(n.launchCoinDraft),n.terminalToken=a,n.terminalAutoToken=a,n.tradeToken=a,n.bundleToken=a,n.volumeToken=a,n.smartChartToken=a,e?.tradePresetId&&(n.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(n.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(n.quickBuyAmountOverride=X(e.amountSol))}function $b(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Tb(e={}){const t=e.tradePresetId?oe("trade",e.tradePresetId):null,a=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,walletIndexes:[a],amountSol:X(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Qu(e={}){const t=e.bundlePresetId?oe("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Ab(){const e=Qn({silent:!0}),t=String(e.tokenMint||"").trim(),a=m("[data-launch-coin-status]");if(!t||t.length<32){n.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",v(a,n.launchCoinStatus);return}Yu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";n.launchCoinStatus=`Loaded ${w(t)} into ${oo(e.action)}. Review the selected preset before sending any trade.`,$e("/terminal",r),h({force:!0})}async function Pb(e,t){const a=Date.now();let r="",o=0;for(;Date.now()-a<18e4;){await Ce(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,o=0}catch{if(o+=1,o===4){const p="Progress feed reconnecting...";n.launchCoinStatus=p,v(t,p)}if(o>=15){const p=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw p.launchAttemptId=e,p}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const d=new Error(c.failureReason||"Launch failed.");throw d.launchAttemptId=e,d}const i=Math.round((Date.now()-a)/1e3),u=`${c.stageText||"Working..."} · ${i}s`;u!==r&&(r=u,n.launchCoinStatus=u,v(t,u))}const s=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw s.launchAttemptId=e,s}const Zu=new Map;function ed(e){const t=String(e||"").trim();t&&Zu.set(t,Date.now()+3e4)}function Cb(e){const t=Zu.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function td(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(n.tradePlans=e.plans)}catch{}}function Lb(e,t={},a={}){const r=String(e||"").trim();if(!r)return;const o=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||w(r),s=String(t.name||"").slice(0,48),c=Number(a.bundledWalletCount||0)+(a.devBuyIncluded?1:0)||1;(n.positions||[]).some(u=>String(u.tokenMint||u.mint)===r)||(n.positions=[{tokenMint:r,symbol:o,name:s,shortMint:w(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...n.positions||[]]),n.smartChartToken=r,n.terminalToken=r,Kl({tokenMint:r,symbol:o,name:s,imageUrl:t.imageDataUrl||"",source:"launch"}),Ud(r)}async function xb(){if(n.launchCoinSubmitting)return;const e=m("[data-launch-coin-status]"),t=m("[data-launch-coin-submit]");n.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const a=Qn({silent:!0});if(!a.name||String(a.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!a.symbol||String(a.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!m("[data-launch-coin-image]")?.files?.[0]&&!n.launchCoinDraft?.imageDataUrl&&!await Le({title:"No Coin Image Selected",lines:[`${a.name} (${a.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){n.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",v(e,n.launchCoinStatus);return}n.launchCoinStatus="Preparing image for SlimeWire backend conversion...",v(e,n.launchCoinStatus);const r=await kb(),o=await Sb(),s=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let c=null;if(a.action==="bundle"){const g=Qu(a);c={walletIndexes:g.walletIndexes||[],walletGroup:g.walletGroup||"",amountSol:g.amountSol||"0",slippageBps:g.slippageBps||"300"}}const i={...a,...r,...o,launchAttemptId:s,...c?{bundleBuy:c}:{}},u=JSON.stringify(i);if(u.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:s,step:"frontend_submit",symbol:a.symbol,selectedDevWalletId:a.selectedDevWalletId||a.devWalletIndex||a.devWalletPublicKey||""}),n.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${s}`,v(e,n.launchCoinStatus);let p=(await k("/api/web/launch/coin",{method:"POST",body:u,timeoutMs:te,preserveSafeError:!0})).launch||{};p.async&&p.status==="RUNNING"&&p.launchAttemptId&&(p=await Pb(p.launchAttemptId,e));const f=String(p.tokenMint||p.mint||p.ca||p.contractAddress||"").trim(),y=p.signature?` Signature: ${w(p.signature)}.`:"";if(!f){n.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${y} Paste the CA above when it appears, then tap Use Live CA.`,v(e,n.launchCoinStatus);return}Yu(a,f),n.launchShareKit={tokenMint:f,symbol:a.symbol||"",name:a.name||"",at:Date.now()},n.launchCoinDraft={tokenMint:f};try{xa(n.launchCoinDraft)}catch{}if(p.bundled){const g=Number(p.bundledWalletCount||0),P=[p.devBuyIncluded?"dev buy":"",g>0?`${g} bundle buy${g===1?"":"s"}`:""].filter(Boolean).join(" + ");n.launchCoinStatus=p.bundleFallback?`Launched ${w(f)} via the standard path (bundle missed the block lottery)${P?` - server fired ${P} right behind the create`:""}.${y} Opening chart...`:`Launch bundled atomically: ${w(f)}${P?` (${P} landed in-block)`:""}${p.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${y} Opening chart...`,v(e,n.launchCoinStatus),Lb(f,a,p),K(p.signature||"","pump-launch-first-buys"),gt({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(p.bundleFallback||p.exitsArmed)&&ed(f),[3e3,8e3,16e3].forEach(T=>window.setTimeout(()=>{td().then(()=>h())},T)),$e("/terminal/chart","smartChart"),h({force:!0});return}if(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Routing into ${oo(a.action)}...`,v(e,n.launchCoinStatus),a.devBuyEnabled&&(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Running Dev Wallet Initial Buy first...`,v(e,n.launchCoinStatus),await To(f,Tb(a)),n.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${oo(a.action)} setup...`,v(e,n.launchCoinStatus)),a.action==="trade"){await To(f,$b(a));return}if(a.action==="bundle"){await xd(f,Qu(a));return}if(a.action==="launch-watch"){n.activeTab="launch",$e("/terminal","launch"),h({force:!0});return}$e("/terminal/chart","smartChart"),h({force:!0})}catch(a){const r=a.launchAttemptId&&!String(a.message||"").includes(a.launchAttemptId)?` Launch ID: ${a.launchAttemptId}.`:"";n.launchCoinStatus=`${a.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:a.launchAttemptId||"",stage:a.stage||"",code:a.code||"",providerStatus:a.providerStatus||null,message:a.message||"Launch failed."}),v(e,n.launchCoinStatus),$(n.launchCoinStatus)}finally{n.launchCoinSubmitting=!1;const a=m("[data-launch-coin-submit]");a&&(a.disabled=!1,a.textContent=a.dataset.prevLabel||"Launch on Pump")}}function Mb(){const e=n.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function ad(){return n.launchWatches.length?`
    <div class="mini-results">
      ${n.launchWatches.map(e=>`
        <span>
          $${l(e.ticker)} - ${l(e.status)} - ${l(e.walletCount)} wallet(s)
          ${je(fg(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${l(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function so(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function nd(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),a=Xe(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),o=String(e.kolName||e.traderName||e.kol_name||"").trim(),s=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||a||o||r,wallet:t,kolWallet:t,twitter:a,handle:a,name:o||s||e.signalType||e.symbol||w(r),displayName:o||s||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||a?1:0),currentPositionCount:O(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:n.kolLastUpdatedAt||new Date().toISOString()}}function lo(e={}){const t=Number(O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),a=st(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(a),o=r?Math.max(0,Math.min(100,Math.round(a))):0,s=!r||t<5,c=s?"Mixed":o>=50?"High Dump Risk":o>=30?"Dump Risk":o<=15?"Trusted Flow":"Mixed",i=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=i[0]||"",d=Xe(e.handle||e.twitter||""),p=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,g)=>/^https?:\/\//i.test(String(f.url||""))&&g.findIndex(S=>String(S.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:so(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:i,callsTracked:t,currentPositionCount:O(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:o,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?o:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:s,confidence:s?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:p,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:s?["Low local sell-window history. Wallet-based until social signal data is available."]:o>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Bb(e=[]){const t=new Map;for(const a of e.filter(Boolean)){const r=String(a.kolId||so(a)||"").trim();if(!r)continue;const o=t.get(r);t.set(r,o?{...o,...a,kolId:r}:{...a,kolId:r})}return[...t.values()]}function io(){const e=Array.isArray(n.kolDumpStats?.stats)?n.kolDumpStats.stats:[],t=Array.isArray(n.kolScan?.kols)?n.kolScan.kols:[],a=Array.isArray(n.kolScan?.rows)?n.kolScan.rows.map(nd):[],r=!e.length&&!t.length&&!a.length?yl():[];return Bb([...e,...t.map(lo),...a.map(lo),...r.map(lo)]).filter(o=>o.kolId)}function Rb(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function Zn(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${Rb(e)} · ${t}`}function rd(e={}){const t=so(e);return t?io().find(a=>String(a.kolId||"")===t)||lo(e):null}function Ib(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const a=Ft(t)?t:"";return{kolId:t,displayName:a?w(a):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:a?[a]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:a?`https://solscan.io/account/${encodeURIComponent(a)}`:""},{label:"KOLscan",url:a?`https://kolscan.io/account/${encodeURIComponent(a)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function Ll(e={},t="KOL Info"){if(!_("kolDumpDetectorEnabled",!0))return"";const a=rd(e),r=String(a?.kolId||so(e)||"").trim();if(!r)return"";const o=a?Zn(a):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${l(r)}" title="${l(o)}">${l(t)}</button>`}function od(e={},t="KOL Info"){return _("kolDumpDetectorEnabled",!0)?Ll(nd(e),t):""}function Ob(e={}){if(!_("kolDumpDetectorEnabled",!0))return"";const t=rd(e);return t?.kolId?`<small class="kol-dump-inline">${l(Zn(t))}</small>`:""}function Lk(){if(!_("kolDumpDetectorEnabled",!0))return"";const e=io().slice(0,6);return`
    <section class="kol-dump-panel">
      <div class="terminal-title-row">
        <div>
          <h3>KOL Dump Detector</h3>
          <p>Tracks whether watched KOL wallets tend to sell into followers.</p>
        </div>
        <span>${n.kolDumpStatsLoading?"Updating":e.length?`${e.length} tracked`:"Low data"}</span>
      </div>
      <small>${l(n.kolDumpStats?.message||"Wallet-based until social signal data is available.")}</small>
      ${e.length?`
        <div class="kol-dump-list">
          ${e.map(t=>`
            <article class="kol-dump-row">
              <div>
                <strong>${l(t.displayName||"KOL Wallet")}</strong>
                <span>${l(t.handle?`@${t.handle}`:t.walletAddresses?.[0]?w(t.walletAddresses[0]):"wallet pending")}</span>
              </div>
              <p>${l(Zn(t))}</p>
              <button type="button" data-kol-dump-details="${l(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:I("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function xl(e={}){if(!_("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&n.kolDumpStatsLoadedAt&&Date.now()-Number(n.kolDumpStatsLoadedAt||0)<900*1e3)return n.kolDumpStats;if(n.kolDumpStatsLoading)return null;n.kolDumpStatsLoading=!0;try{const a=new URLSearchParams({mode:n.kolMode||"hot"});n.kolWallet&&a.set("wallet",n.kolWallet),t&&a.set("force","true");const r=await k(`/api/web/kols/dump-stats?${a.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return n.kolDumpStats=r,n.kolDumpStatsLoadedAt=Date.now(),ne(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return n.kolDumpStats=n.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},n.kolDumpStatsLoadedAt=Date.now(),null}finally{n.kolDumpStatsLoading=!1,n.kolDumpDetails?.open?co():n.activeTab==="kol"&&h({force:!0})}}function Eb(e=""){const t=String(e||"").trim();!t||!_("kolDumpDetectorEnabled",!0)||(n.kolDumpDetails={open:!0,kolId:t},Na(),co(),xl({force:!0}))}function Ml(){n.kolDumpDetails={open:!1,kolId:""},co(),Or()}function co(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=n.kolDumpDetails||{},a=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",a),!a||!_("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=io().find(d=>String(d.kolId)===String(t.kolId))||Ib(t.kolId),o=!!n.kolDumpStatsLoading,s=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(d=>/^https?:\/\//i.test(String(d?.url||""))).slice(0,4):[],i=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",u=`
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
        <p>${l(Zn(r))}</p>
        <small>${o?"Updating from KOL sources...":`Confidence: ${l(r.confidence||"low")} · Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${l(we(r.updatedAt))}`}</small>
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
          <li><span>First seen: ${l(r.firstSeenAt?we(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${l(r.lastSeenAt?we(r.lastSeenAt):"n/a")}</span></li>
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
  `;mr(e,u,".kol-dump-drawer")}function Fb(){const e=n.kolScan?.configured!==!1,t=n.kolLoading?"disabled":"",a=String(n.kolMode||"hot"),r=!!n.kolScan,o=!!n.kolScan?.kols?.length,s=o&&a!=="hot",c=!r&&!o;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${n.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${n.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${n.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${n.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${n.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${n.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${l(Db(n.kolMode))}</p>
    ${Wb()}
    ${s?_b():c?yg():""}
    ${n.kolMode==="slimewire"&&n.kolScan?n.kolScan.kols?.length?"":I("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):n.kolScan?Ub():I("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
            ${yt("kol")}
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
            ${Ge("kol-delay","data-kol-delay","5")}
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
            ${Qr("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${eo("kol")}
        <p class="trade-status" data-kol-status>${n.kolResult?l(n.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${Nb()}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Custom KOL Wallet</h3>
          <p>Paste any public Solana wallet to inspect current holdings, open an outside trader profile, or arm copy-watch from your selected wallets.</p>
          <label>
            Wallet Address
            <input data-kol-wallet type="text" placeholder="Paste KOL wallet" value="${l(n.kolWallet||"")}">
          </label>
          <div class="card-actions">
            <button data-kol-wallet-scan ${t}>${n.kolLoading?"Scanning...":"Scan Wallet"}</button>
            ${n.kolWallet?`<button class="primary" data-kol-copy-wallet="${l(n.kolWallet)}" ${t}>Copy Wallet Next Buy</button>`:""}
            ${n.kolWallet?je(ku(n.kolWallet),"Share KOL"):""}
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
  `}function Wb(){const e=n.kolScan||null,t=er(n.kolMode),a=n.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),o=Number(e?.rows?.length||0),s=n.kolLastUpdatedAt?we(n.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${l(a)}</span>
      <span>${l(r)} KOLs</span>
      <span>${l(o)} signals</span>
      <span>${l(s)}</span>
    </div>
  `}function er(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function Db(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function Nb(){const e=n.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function _b(){const e=n.kolScan||{},t=(e.kols||[]).filter(a=>a.wallet||a.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${l(e.label||"KOL Tracker")}</h3>
          <p>${l(`${er(n.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${l(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((a,r)=>`
          <article class="kol-profile">
            ${Cu(a)}
            <div class="pick-top">
              <span>${r+1}</span>
              <h3>${l(a.name||a.shortWallet||"KOL Wallet")}</h3>
              <em>${l(a.winRateLabel||"n/a")}</em>
            </div>
            <p>${a.twitter?`@${l(a.twitter)}`:l(a.shortWallet||a.wallet||"")}</p>
            <dl>
              <div><dt>Realized</dt><dd>${l(a.realizedLabel||"n/a")}</dd></div>
              <div><dt>ROI</dt><dd>${l(a.roiLabel||"n/a")}</dd></div>
              <div><dt>Trades</dt><dd>${l(a.trades??"n/a")}</dd></div>
            </dl>
            <small>${l(a.source==="slimewire"?`Tracking ${a.trackedWalletMode==="manual"?`${a.trackedWalletCount||0} wallet(s)`:"all wallets"}`:a.volumeLabel||"Volume n/a")} | Last trade: ${l(we(a.lastTradeAt))}</small>
            ${Ob(a)}
            <div class="card-actions kol-profile-actions">
              ${a.solscanUrl?`<a href="${l(a.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${a.kolscanUrl||a.wallet?`<a href="${l(a.kolscanUrl||wc(a.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${Ll(a)}
              ${je(mg(a),"Share Watch")}
              ${a.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(a.wallet)}">Copy Trade</button>`:""}
              ${a.wallet?`<button data-kol-scan-wallet="${l(a.wallet)}">Scan Positions</button>`:""}
              ${a.wallet?`<button data-kol-copy-wallet="${l(a.wallet)}">Copy Wallet</button>`:""}
              ${a.wallet?`<button data-copy="${l(a.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function Ub(){const e=n.kolScan||{};if(e.configured===!1)return I("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],a=at("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${l(er(n.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${a.length}/${t.length} signals shown</span>
    </div>
    ${it(a,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:pg})}
    ${la("kol",t,"KOL signals")}
  `:I(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function sd(){const e=m("input[data-wallet-label]"),t=m("input[data-wallet-count-input]"),a=m("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),v(a,"Creating wallets..."),r.forEach(o=>{o.disabled=!0,v(o,"Creating...")});try{const o=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(o)||o<1||o>20)throw new Error("Wallet count must be from 1 to 20.");await Y(a,"Creating secure web profile for wallet backups...");const s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:o})}),c=Array.isArray(s.wallets)?s.wallets:[];if(!c.length)throw new Error(s.message||"Wallet create did not return wallet data. Refresh and try again.");n.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&fe(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&fe(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),v(a,s.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const i=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(i?.wallets)&&(n.wallets=i.wallets)}catch{}n.toolSections={...n.toolSections||{},wallets:"balances"},n.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,K(xe(s.plan),"wallet-create"),n.activeTab="wallets",h()}catch(o){v(a,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,v(o,"Create Wallets")})}}async function qb(){const e=m("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),n.automationDelegationStatus="Creating automation wallet...",v(e,n.automationDelegationStatus),t.forEach(a=>{a.disabled=!0,v(a,"Creating...")});try{await Y(e,"Creating secure web profile for automation wallet backups...");const a=n.user?.connectedWallet,r=a?.publicKey?`Automation ${w(a.publicKey)}`:"Automation Wallet",o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(o.wallets)?o.wallets:[]).length)throw new Error(o.message||"Automation wallet create did not return wallet data. Refresh and try again.");n.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&fe(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&fe(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),n.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",K(xe(o.plan),"automation-wallet-create"),n.activeTab="wallets",h({force:!0})}catch(a){n.automationDelegationStatus=a.message,v(e,a.message),$(a.message)}finally{t.forEach(a=>{a.disabled=!1,v(a,"Create Automation Wallet")})}}function Hb(e=null){const a=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||m("[data-session-wallet-amount]"),r=X(a?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const o=Number(r);if(!Number.isFinite(o)||o<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(o>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function Kb(e=ie()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(n.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});pe(t.user||{...n.user,connectedWallet:t.profile?.connectedWallet||null})}async function Vb(e=null){const t=m("[data-automation-delegation-status]")||m("[data-wallet-connect-status]"),a=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),a.forEach(r=>{r.disabled=!0,v(r,"Opening...")});try{const r=Hb(e),{provider:o,connected:s}=await yd();await Y(t,"Creating secure web profile for session wallet..."),await Kb(s),n.automationDelegationStatus="Creating session wallet and funding approval...",v(t,n.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(s.publicKey)}`}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(c.wallets)?c.wallets:n.wallets,n.downloads=c.downloads||n.downloads||null,c.downloads?.encryptedBackup?.text&&fe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&fe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",v(t,n.automationDelegationStatus);const i=await yy(c.order?.transaction,o);n.automationDelegationStatus="Submitting session wallet funding...",v(t,n.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:i}),dedupe:!1,timeoutMs:te});n.wallets=Array.isArray(u.wallets)?u.wallets:n.wallets,n.automationDelegationStatus=u.message||"Session wallet funded and ready.",K(u.signature||"","session-wallet-funded"),await bt({force:!0,deep:!0,reason:"session-wallet-funded"}),n.activeTab="wallets",h({force:!0})}catch(r){const o=N(r.message||"Session wallet setup failed.");n.automationDelegationStatus=o,v(t,o),$(o)}finally{a.forEach(r=>{r.disabled=!1,v(r,"Start Session Wallet")})}}async function Bl(e="enable",t={}){const a=m("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],o=e!=="revoke";if(o&&!ru()){n.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",v(a,n.automationDelegationStatus),$(n.automationDelegationStatus),ul();return}nu(!o,t.scope||""),n.automationDelegationStatus=o?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",v(a,n.automationDelegationStatus),r.forEach(s=>{s.disabled=!0,v(s,o?"Enabling...":"Revoking...")});try{await Y(a,"Creating secure web profile for automation permission...");const s=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:o?"enable":"revoke",ttlHours:720})});pe(s.user||{...n.user,automationPermission:s.profile?.automationPermission||null});const c=n.user?.automationPermission||{};n.automationDelegationStatus=o?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${we(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(s){n.automationDelegationStatus=s.message,v(a,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,v(s,s.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function Rl(e={}){const t=!!e.silent,a=e.refreshWallet!==!1;if(!n.user||!n.token){t||$("Log in or create a web account before checking server exits.");return}if(Mr){n.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}Mr=!0,t||(n.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:te});n.tradePlans=r.plans||n.tradePlans||[];const o=r.runner||{},s=r.webExitGuards||{},c=r.portfolioExits||{},i=Number(o.soldWallets||0)+Number(s.soldGuards||0)+Number(c.soldPositions||0),u=Number(o.triggeredWallets||0)+Number(s.triggeredGuards||0)+Number(c.triggeredPositions||0);if(o.skipped){const d=Number(o.activeForMs||0),p=d>0?` for ${Math.ceil(d/1e3)}s`:"";n.automationDelegationStatus=o.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${p}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${o.reason||"runner busy"}.`,a&&!t&&await Js({force:!0});return}n.automationDelegationStatus=zb(o),(a||i>0||u>0)&&await Js({force:!0}),t&&(i>0||u>0)&&h({preserveSmartChartFrame:n.activeTab==="smartChart"})}catch(r){n.automationDelegationStatus=r.message,n.walletRefreshError=r.message,t||$(r.message)}finally{Mr=!1,t||(n.walletRefreshing=!1,h())}}function zb(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),a=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),o=Number(e.failedWallets||0),s=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${a}, sold ${r}, failed ${o}.${s}`}function Il(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(n.tradePlans||[]).some(t=>{const a=String(t.status||"").toLowerCase();return a==="launch_watch"?!0:a!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function jb(){return!!(ou()&&Il()&&!Mr)}function uo(){Il()&&(n.automationDelegationStatus=n.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),Gb()}let po="";function Gb(){const t=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(i=>["watching","active","armed","pending"].includes(String(i.status||"").toLowerCase()));if(!t.length){po="";return}const a=Date.now(),r=t.filter(i=>i.automationPermissionExpiresAt&&!i.automationPermissionActive),o=t.filter(i=>{if(!i.automationPermissionActive)return!1;const u=Date.parse(i.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>a&&u-a<3600*1e3});let s="";if(r.length)s=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(o.length){const i=Math.min(...o.map(d=>Date.parse(d.automationPermissionExpiresAt)));s=`TP/SL permission expires in ~${Math.max(1,Math.round((i-a)/6e4))} min with ${o.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=s?`${r.length}:${o.length}`:"";s&&c!==po?(po=c,$(s)):s||(po="")}function Xb(){An.forEach(e=>window.clearTimeout(e)),An=[]}function mo(){Xb(),n.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",An=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const a=window.setTimeout(()=>{An=An.filter(r=>r!==a),!(!n.user||!n.token||!Il())&&Rl({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{n.automationDelegationStatus=r.message})},t);return a})}async function Jb(){const e=m("[data-restore-text]"),t=m("[data-restore-status]");if(!e||!t)return;const a=e.value.trim();if(!a){v(t,"Choose a backup file or paste backup text first.");return}v(t,"Restoring wallets...");try{await Y(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:a})});n.restoreResult=r.restore,r.restore?.downloads&&(n.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&fe(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&fe(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",v(t,r.restore?.message||"Restore complete."),await Ne({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(r){v(t,r.message)}}async function Yb(){const e=m("[data-export-status]");if(e){v(e,"Building backup files...");try{await Y(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});n.backupResult=t.backup,t.backup?.downloads&&(n.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&fe(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&fe(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),v(e,t.backup?.message||"Backup ready."),h()}catch(t){v(e,t.message)}}}async function Qb(){const e=m("[data-import-label]"),t=m("[data-import-secret]"),a=m("[data-import-status]");if(!e||!t||!a)return;const r=e.value.trim()||"Imported Wallet",o=t.value.trim();if(!o){v(a,"Paste a private key or JSON secret-key array first.");return}v(a,"Importing wallet...");try{await Y(a,"Creating secure web profile for imported wallet...");const s=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:o})});n.importResult=s.imported,s.imported?.downloads&&(n.downloads=s.imported.downloads,s.imported.downloads.encryptedBackup&&fe(s.imported.downloads.encryptedBackup.filename,s.imported.downloads.encryptedBackup.text),s.imported.downloads.recoveryKeys&&fe(s.imported.downloads.recoveryKeys.filename,s.imported.downloads.recoveryKeys.text)),t.value="",v(a,s.imported?.message||"Import complete."),await Ne({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(s){v(a,s.message)}}async function Zb(e,t="this wallet",a=""){const r=String(t||`Wallet ${e}`);if(!await Le({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Le({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=m("[data-wallet-remove-status]");n.walletRemoveStatus=`Backing up ${r} before removal...`,v(c,n.walletRemoveStatus),$("");try{const i=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(a?{publicKeys:[a]}:{walletIndexes:[String(e)]})}),u=i.removed||{};n.downloads=u.downloads||n.downloads,u.downloads?.encryptedBackup?.text&&fe(u.downloads.encryptedBackup.filename,u.downloads.encryptedBackup.text),u.downloads?.recoveryKeys?.text&&fe(u.downloads.recoveryKeys.filename,u.downloads.recoveryKeys.text),n.walletRemoveStatus=u.message||`Removed ${r}.`,Array.isArray(u.wallets)&&(n.wallets=u.wallets),K(xe(i.plan),"wallet-remove"),n.activeTab="wallets",h()}catch(i){n.walletRemoveStatus=i.message,v(c,i.message),$(i.message)}}function ey(){const e=String(m("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(a=>a.trim()).filter(Boolean),walletGroup:String(m("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(m("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(m("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(m("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function ty(){const e=String(m("[data-wallet-send-from]")?.value||"1").trim(),t=String(m("[data-wallet-send-managed-targets]")?.value||"").trim(),a=String(m("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(m("[data-wallet-send-destinations]")?.value||"").trim(),o=t.toLowerCase()==="all"?n.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),s=a?n.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===a||d.startsWith(`${a} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...o,...s])].map(u=>n.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),i=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(m("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!m("[data-wallet-send-all]")?.checked,destinations:i}}function ay(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const a=e.rows.slice(0,6).map(r=>{const o=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,s=r.ok?"ok":"failed";return`${o}: ${s} - ${r.message||r.signature||"done"}`});t.push(...a),e.rows.length>a.length&&t.push(`...${e.rows.length-a.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function ny(e){const t=m("[data-wallet-sweep-status]");n.walletSweepStatus="Running wallet action...",v(t,n.walletSweepStatus),$("");try{await Y(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const o=e==="send-sol-many"?ty():ey();if(e==="sell-all"&&(o.destination=""),e==="sell-all-sweep"&&!o.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const s=await k(r,{method:"POST",body:JSON.stringify(o),timeoutMs:te});n.walletSweepStatus=ay(s.sweep),v(t,n.walletSweepStatus),await Ne({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(a){n.walletSweepStatus=a.message,v(t,a.message),$(a.message)}}async function ry(e){const t=m("[data-restore-status]"),a=m("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!a)){v(t,"Reading backup file...");try{a.value=await r.text(),v(t,"Backup loaded. Tap Restore Wallets.")}catch(o){v(t,`Could not read file: ${o.message}`)}}}function fe(e,t){const a=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(a),o=document.createElement("a");o.href=r,o.download=e,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function oy(){const e=m("[data-x-handle]"),t=m("[data-x-status]"),a=Xe(e?.value||"");if(!a){v(t,"Enter a valid X handle first.");return}const r=window.open(Sl(a),"_blank","noopener,noreferrer");try{v(t,r?`Opening X and saving @${a}...`:`Saving @${a}. Allow popups if X did not open.`),await Y(t,"Creating secure web profile for X sharing...");const o=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:a})});pe(o.user||{...n.user,xHandle:o.profile?.xHandle||a}),Ni(n.xHandle),v(t,`Connected @${n.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(o){v(t,o.message),$(o.message)}}function sy(){const e=m("[data-x-status]"),t=Xe(m("[data-x-handle]")?.value||n.xHandle||""),a=Sl(t||n.xHandle);window.open(a,"_blank","noopener,noreferrer"),v(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function ly(){const e=m("[data-x-status]"),t=m("[data-x-handle]");try{if(!n.user||!n.token){n.xHandle="",t&&(t.value=""),vs(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const a=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});pe(a.user||{...n.user,xHandle:""}),n.xHandle="",t&&(t.value=""),vs(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(a){v(e,a.message),$(a.message)}}async function fo(e,t="Saving PFP..."){const a=m("[data-avatar-status]");v(a,t);try{await Y(a,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});pe(r.user||{...n.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),v(a,n.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){v(a,r.message),$(r.message)}}async function iy(e){const t=m("[data-avatar-status]"),a=e?.files?.[0];if(a){if(!/^image\/(png|jpe?g|webp)$/i.test(a.type)){v(t,"Use a PNG, JPG, or WebP image.");return}if(a.size>5*1024*1024){v(t,"Use an image under 5 MB.");return}try{v(t,"Compressing PFP...");const r=await ld(a);await fo({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){v(t,r.message),$(r.message)}finally{e.value=""}}}function ld(e){return new Promise((t,a)=>{const r=new FileReader;r.onerror=()=>a(new Error("Could not read that image.")),r.onload=()=>{const o=new Image;o.onerror=()=>a(new Error("Could not load that image.")),o.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const i=c.getContext("2d");if(!i){a(new Error("This browser cannot resize images."));return}const u=Math.max(256/o.width,256/o.height),d=Math.round(o.width*u),p=Math.round(o.height*u),f=Math.round((256-d)/2),y=Math.round((256-p)/2);i.clearRect(0,0,256,256),i.drawImage(o,f,y,d,p);const g=c.toDataURL("image/jpeg",.84);if(g.length>22e4){a(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(g)},o.src=String(r.result||"")},r.readAsDataURL(e)})}async function cy(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,a=new URL(String(e||""),t).toString(),r=await fetch(a,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const o=await r.blob();return ld(o)}async function uy(){const e=wl(n.xHandle);if(!e){const t=m("[data-avatar-status]");v(t,"Connect an X handle first.");return}await fo({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function id(e,t={}){const a=Rn(),r=me(e);if(!r){if(await bc(e,t)||yc(e))return;const o=sc(e);re(o),Bt(e,new Error(o),{action:"provider_missing",platform:Ke()?"mobile":"desktop"});return}try{const o=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(o){if(!(t.confirmSwitch===!1?!0:await Le({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(o)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){re("Wallet connection unchanged."),$e("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}re(`Opening ${Ee(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,i=c?.toBase58?.()||c?.toString?.()||"";if(!i)throw new Error("Wallet connected, but no public address was returned.");await Y(a,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:i,provider:Ee(e,r)})});pe(u.user||{...n.user,connectedWallet:u.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:i,shortPublicKey:w(i),provider:Ee(e,r),tokens:[]},cl(`connected:${i}`),n.walletConnectMenuOpen=!1,re(`Connected ${w(i)}. Opening Live Terminal...`),$e(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),su("browser-wallet-connect"),_r("browser-wallet-connect")}catch(o){const s=o.message||"Wallet connection was cancelled.";re(s),Bt(e,o,{action:"connect_failed"})}}async function cd(){await Hu("disconnecting");const e=Rn(),t=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(!n.user||!n.token){n.connectedWalletBalance=null,cl(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0});return}try{const a=n.user?.connectedWallet?.provider||"";await(a.toLowerCase().includes("phantom")?me("phantom"):a.toLowerCase().includes("solflare")?me("solflare"):a.toLowerCase().includes("backpack")?me("backpack"):me("solana"))?.disconnect?.()}catch{}try{const a=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});pe(a.user||{...n.user,connectedWallet:null}),n.connectedWalletBalance=null,cl(t?`connected:${t}`:""),re("Connected wallet disconnected."),h({force:!0})}catch(a){re(a.message),$(a.message)}}async function dy(){const e=m("[data-profile-username]"),t=m("[data-profile-password]"),a=m("[data-login-security-status]"),r=String(e?.value||"").trim(),o=String(t?.value||"");if(!r||!o){v(a,"Enter a username and password first.");return}try{await Y(a,"Creating secure web profile..."),v(a,"Saving login...");const s=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:o})});pe(s.user||{...n.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),v(a,"Saved. You can now log back in with this username and password."),h()}catch(s){v(a,s.message),$(s.message)}}function Xe(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function Ol(e){const t=gl(e),a=String(n.user?.referralLink||"").trim(),r=a&&!t.includes("/r/")?a:Pt,o=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(o,"_blank","noopener,noreferrer")}function ud(e){const t=e==="kol",a=m(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=m("[data-share-watch-status]"),o=a?.value?.trim()||"";if(!o){v(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}Ol(t?ku(o):bl(o)),v(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function dd(e){const t={};n.token&&(t.Authorization=`Bearer ${n.token}`);const a=await xn(Ha(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!a.ok){const r=await oc(a);throw new Error(r.message||r.error||`Could not build PnL card (${a.status}).`)}return{blob:await a.blob(),filename:a.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function pd(e){const{blob:t,filename:a}=await dd(e),r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=a,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function py(e,t){try{const{blob:a,filename:r}=await dd(e),o=new File([a],r,{type:"image/png"});if(navigator.canShare?.({files:[o]})){await navigator.share({title:"SlimeWire PnL Card",text:gl(t),url:Pt,files:[o]});return}await pd(e),Ol(`${t} PnL card downloaded and ready to attach.`)}catch(a){$(a.message)}}function md(e="buy"){const t=m("[data-trade-wallet]")?.value||"",a=sh(e)||m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,e==="sell"?(n.tradeSwapFrom=a,n.tradeSwapTo="SOL"):(n.tradeSwapFrom="SOL",n.tradeSwapTo=a),{walletIndex:t,tokenMint:a,slippageBps:r}}function ce(e=""){return String(e||"").trim().toLowerCase()==="connected"}function my(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function fd(){const e=Array.isArray(n.wallets)?n.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(my(e[t]))return e[t];return null}function hd(e=ie()){if(!e?.publicKey)return!1;const t=tr(e),a=me(t)||me("solana");return!!(a&&typeof a.signTransaction=="function")}function ho(e=ie()){const t=e?.provider||Ee(tr(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function go(e={},{side:t="trade",statusWriter:a=he,allowSessionFallback:r=!0}={}){if(!ce(e.walletIndex))return{form:e,sessionWallet:null};if(hd())return{form:e,sessionWallet:null};const o=r?fd():null;if(o?.index){const s=`Using Session Wallet ${o.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof a=="function"&&a(s),{form:{...e,walletIndex:String(o.index)},sessionWallet:o}}throw new Error(ho())}function gd(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function bd(e=""){const t=atob(String(e||"")),a=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)a[r]=t.charCodeAt(r);return a}function tr(e=ie()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function fy(e=ie(),{returnPath:t=Va()||"/terminal/trade"}={}){const a=tr(e),r=e?.provider||Ee(a);if(ua({returnPath:t}),Ke()&&e?.publicKey&&!me(a)){const s=ho(e);return re(s),s}if(gc(a)){const s=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(re(s),await bc(a,{returnPath:t}).catch(()=>!1))return s}if(yc(a))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const o=sc(a);return re(o),o}async function yd(){const e=ie();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=tr(e),a=me(t)||me("solana");if(!a){if(Ke()&&e?.publicKey)throw new Error(ho(e));const s=await fy(e,{returnPath:Va()||"/terminal/trade"});throw new Error(s)}if(typeof a.signTransaction!="function")throw Ke()&&e?.publicKey?new Error(ho(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"";let o=r();if(o!==e.publicKey)try{const s=await a.connect?.({onlyIfTrusted:!0});o=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r()}catch{}if(o!==e.publicKey){const s=await a.connect?.({onlyIfTrusted:!1}),c=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:a,connected:e}}async function hy(){try{if(Ke())return;const e=ie();if(!e?.publicKey)return;const t=tr(e),a=me(t)||me("solana");if(!a||typeof a.connect!="function"||(a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"")===e.publicKey)return;await a.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const gy=6e4;async function vd(e,t,a=gy){let r=0;const o=new Promise((s,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},a)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),o])}finally{window.clearTimeout(r)}}async function by(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.VersionedTransaction.deserialize(bd(e)),r=await vd(t,a);return gd(r.serialize())}async function yy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.Transaction.from(bd(e)),r=await vd(t,a);return gd(r.serialize())}function vy({side:e,connected:t,form:a={},actionDetail:r="",amountSol:o="",amountMode:s="",percent:c=""}={}){const i=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:s==="max"?"Max SOL":`${o||r||"custom"} SOL`;return Le({title:`Confirm ${i}`,lines:[`${i} with ${u}?`,`Token: ${a.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:i})}async function ar({side:e,form:t,actionDetail:a,amountSol:r="",amountMode:o="",percent:s="",attemptId:c,statusWriter:i=he}){const u=typeof i=="function"?i:he,{provider:d,connected:p}=await yd();if(!n.walletFastApprovalsEnabled&&!await vy({side:e,connected:p,form:t,actionDetail:a,amountSol:r,amountMode:o,percent:s}))throw new Error("Connected-wallet trade cancelled.");nm(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),Be("submitted","pending"),u(n.walletFastApprovalsEnabled?`Building ${e} approval for ${p.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:p.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:o,percent:s,tradeAttemptId:c}),dedupe:!1,timeoutMs:te});Be("submitted","ok"),Be("approved","pending",`Approve in ${p.provider||"your wallet"}`),u(`Approve ${e} in ${p.provider||"your wallet"}...`);let y;try{y=await by(f.order?.transaction,d)}catch(S){throw Be("approved","fail",N(S?.message||"Wallet approval was declined.")),S}Be("approved","ok"),Be("sent","pending"),u("Submitting signed trade...");let g;try{g=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:te})}catch(S){throw V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"error",error:N(S?.message||"Trade submit failed.")}),K("",`browser-${e}-error`,{tradeAttemptId:c}),Be("sent","fail",N(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return Be("sent","ok"),Be("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),n.tradeResult=g.trade,u(g.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),V(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),g.trade}function _e(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function on(e,t){const a=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(a)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function wy(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let a=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=on(a,r),{enabled:_e(e)||_e(t)||_e(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function wd(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let a=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=on(a,r),{enabled:_e(e)||_e(t)||_e(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function he(e){const t=m("[data-trade-status]");v(t,e)}function Fe(e=""){n.chartTradeStatus=String(e||""),v(m("[data-chart-trade-status]"),n.chartTradeStatus)}function El(e="",t=""){n.quickBuyModal={...n.quickBuyModal,status:String(e||""),error:String(t||"")};const a=m("[data-quick-buy-modal-status]"),r=m("[data-quick-buy-modal-error]");v(a,n.quickBuyModal.status),v(r,n.quickBuyModal.error),a&&(a.hidden=!n.quickBuyModal.status),r&&(r.hidden=!n.quickBuyModal.error)}async function bo(e,t="fixed"){const a=L();let r=t==="max"?"max":String(e||"custom"),o="";try{let s=md("buy");r=t==="max"?"max":String(e||"custom");const c=tt("trade-buy",s.tokenMint,r);if(c){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(s.tokenMint)}:${r}`});return}o=ht("trade-buy");const i={tokenMint:s.tokenMint,walletIndex:s.walletIndex,slippageBps:s.slippageBps,tradeAttemptId:o},u=Ld();if((_e(u.takeProfitPct)||_e(u.stopLossPct)||_e(u.sellDelay))&&Object.assign(i,{autoExit:!0,...u}),t==="max")i.amountMode="max";else{const S=Number(e);if(!Number.isFinite(S)||S<=0)throw new Error("Enter a buy amount greater than zero.");i.amountSol=String(S)}if(s=go(s,{side:"buy",statusWriter:he}).form,i.walletIndex=s.walletIndex,ce(s.walletIndex)){V("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:L()-a,requestId:o,details:`browser-buy:${w(s.tokenMint)}:${r}`}),he("Building wallet-approved buy..."),le(),await ar({side:"buy",form:s,actionDetail:r,amountSol:i.amountSol||"",amountMode:i.amountMode||"fixed",attemptId:o}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-buy",s.tokenMint,r,3e3);return}const f=wy();f.enabled&&Object.assign(i,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),V("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-a,requestId:o,details:`trade-buy:${w(s.tokenMint)}:${r}`}),h(),he(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Ce(20);const y=L();V("trade-buy",s.tokenMint,r,{state:"submitting"});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...i,clientClickToUiMs:Math.round(y-a)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-y,requestId:o,resultCount:g.trade?.signature?1:0,details:"trade-buy"}),n.tradeResult=g.trade,nm(`Buy ${w(s.tokenMint||"")}`),Be("submitted","ok"),Be("sent","ok"),Be("confirmed",g.trade?.signature?"ok":"pending",g.trade?.signature?`tx ${String(g.trade.signature).slice(0,8)}...`:""),g.trade?.autoExitPlan?(Be("armed","ok"),n.tradePlanResult=g.trade.autoExitPlan,he(g.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),mo()):g.trade?.autoExitRequested&&(Be("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),he("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),V("trade-buy",s.tokenMint,r,{state:"submitted",signature:g.trade?.signature||""}),K(g.trade?.signature,"trade-buy",{tradeAttemptId:o}),n.activeTab="trade",h(),Pe("trade-buy",s.tokenMint,r,3e3)}catch(s){o&&(V("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,{state:"error",error:N(s.message||"Buy failed")}),Pe("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-a,requestId:o,errorCode:s?.code||s?.name||"TRADE_BUY_FAILED",details:N(s.message||"Buy failed")}),he(s.message)}}async function Fl(e){const t=L(),a=ht("manual-sell");let r=null,o=String(e||"custom");try{r=md("sell");const s=Number.parseInt(e,10);if(o=String(s||o),!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=tt("trade-sell",r.tokenMint,o);if(c){ne("buttonDoubleClickPrevented"),W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${s}`});return}if(V("trade-sell",r.tokenMint,o,{state:"clicked",tradeAttemptId:a,clickedAt:new Date().toISOString()}),he("Sending sell..."),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-t,requestId:a,details:`${w(r.tokenMint)}:${s}`}),r=go(r,{side:"sell",statusWriter:he}).form,ce(r.walletIndex)){le();const p=L();V("trade-sell",r.tokenMint,o,{state:"submitting"}),await ar({side:"sell",form:r,actionDetail:o,percent:String(s),attemptId:a}),W({component:"manual-sell",action:"browser-sell-request",durationMs:L()-p,requestId:a,resultCount:n.tradeResult?.signature?1:0,details:"browser-wallet"}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-sell",r.tokenMint,o,3e3);return}h(),await Ce(20);const u=L();V("trade-sell",r.tokenMint,o,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:s,manualSellAttemptId:a,clientClickToUiMs:Math.round(u-t)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-u,requestId:a,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),n.tradeResult=d.trade,he(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),V("trade-sell",r.tokenMint,o,{state:"submitted",signature:d.trade?.signature||""}),K(d.trade?.signature||xe(d.trade),"manual-sell-trade"),n.activeTab="trade",h(),Pe("trade-sell",r.tokenMint,o,3e3)}catch(s){r?.tokenMint&&(V("trade-sell",r.tokenMint,o,{state:"error",error:N(s.message||"Sell failed")}),Pe("trade-sell",r.tokenMint,o,4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-t,requestId:a,errorCode:s?.code||s?.name||"MANUAL_SELL_FAILED",details:N(s.message||"Sell failed")}),he(s.message)}}function Sy(){const e=Ue("trade-plan"),t=m("[data-trade-plan-group]")?.value?.trim()||"",a=m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),o=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),s=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),i=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:i}=on(c,i));const u=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,n.volumeToken=a,n.bundleToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:c,takeProfitPct:o,stopLossPct:s,sellPercent:i,loopCount:"1",loopDelay:"0",slippageBps:u,...pa("trade-plan")}}async function ky(){try{const e=Sy();he("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});n.tradePlanResult=t.plan,n.tradeResult=null,K(t.trade?.signature,"trade-plan"),n.activeTab="trade",h()}catch(e){he(e.message)}}function $y(){const e=Ue("volume"),t=m("[data-volume-group]")?.value?.trim()||"",a=m("[data-volume-token]")?.value?.trim()||"",r=m("[data-volume-amount]")?.value||"";let o=x("[data-volume-delay]","[data-volume-delay-custom]","5");const s=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),i=x("[data-volume-loop]","[data-volume-loop-custom]","1"),u=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:o,sellPercent:d}=on(o,d));const p=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.volumeToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:d,slippageBps:p,...pa("volume")}}function Sd(e){const t=m("[data-volume-status]");v(t,e)}async function Ty(){try{const e=$y();Sd("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});n.volumeResult=t.plan,K(xe(t.plan),"volume-plan"),n.activeTab="volume",h()}catch(e){Sd(e.message)}}function Ay(e){const t=Ue("sniper"),a=m("[data-sniper-group]")?.value?.trim()||"",r=m("[data-sniper-amount]")?.value||"",o=x("[data-sniper-delay]","[data-sniper-delay-custom]",n.scanMode==="pumpsnipe"?"3":"5"),s=x("[data-sniper-tp]","[data-sniper-tp-custom]",n.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),i=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",n.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{mode:n.scanMode,tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,slippageBps:d,loopCount:i,loopDelay:u,...pa("sniper")}}function kd(e){const t=m("[data-sniper-status]");v(t,e)}async function Py(e){try{const t=Ay(e);kd("Buying and arming exits...");const a=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});n.sniperResult=a.plan,K(xe(a.plan),"sniper-entry"),n.activeTab="sniper",h()}catch(t){kd(t.message)}}function Cy(){const e=Ue("ogre-ai"),t=m("[data-ogre-ai-group]")?.value?.trim()||"",a=m("[data-ogre-ai-amount]")?.value?.trim()||"",r=Yr(),o=m("[data-ogre-ai-runs]")?.value||"1",s=m("[data-ogre-ai-tp]")?.value||"25",c=m("[data-ogre-ai-tp-custom]")?.value?.trim()||"",i=m("[data-ogre-ai-sl]")?.value||"8",u=m("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=m("[data-ogre-ai-delay]")?.value||"5",p=m("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=m("[data-ogre-ai-slippage]")?.value||"400",y=m("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";Km({amountSol:a,runCount:o,category:r,takeProfitSelect:s,takeProfitCustom:c,stopLossSelect:i,stopLossCustom:u,delaySelect:d,delayCustom:p,slippageSelect:f,slippageCustom:y,walletGroup:t});const g=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","60"),S=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","100"),P=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","40"),T=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),b="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!a)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:a,runCount:o,sellDelay:g,takeProfitPct:S,stopLossPct:P,sellPercent:"100",slippageBps:T,minScore:b,recentMints:_i()}}function yo(e){n.ogreAiStatus=e||"";const t=m("[data-ogre-ai-status]");v(t,n.ogreAiStatus)}async function Ly(){if(Br){Fa=!0,yo("Stopping the hunt after this scan...");return}const e=Symbol("ogre-ai-run");Fa=!1;try{const t=Cy();n.ogreAiLoading=!0,Br=e;const a=Array.isArray(t.recentMints)?[...t.recentMints]:[];let r=null,o=!1,s=0;const c=120;for(;!o&&!Fa&&s<c&&(s+=1,yo(s===1?"Scanning fresh low-MC pairs and arming managed exits...":`Hunting fresh pairs... (scan ${s}) - tap Scan again to stop.`),h(),r=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify({...t,recentMints:a}),timeoutMs:te}),o=Number(r.ogreAi?.armedCount||0)>0||(r.ogreAi?.plans?.length||0)>0,!o);){for(const i of r.ogreAi?.errors||[])i?.tokenMint&&!a.includes(i.tokenMint)&&a.push(i.tokenMint);for(const i of r.ogreAi?.attemptedPicks||[])i?.tokenMint&&!a.includes(i.tokenMint)&&a.push(i.tokenMint);if(Fa)break;await Ce(5e3)}n.ogreAiResult=r?.ogreAi,Hm(r?.ogreAi),n.tradePlanResult=r?.ogreAi?.plans?.[0]||n.tradePlanResult,yo(o?r?.ogreAi?.message||"Ogre A.I. run armed.":Fa?"Hunt stopped. Tap Scan to hunt again.":"Still hunting - no clean fresh pair armed yet. Tap Scan to keep going."),o&&K(xe(r?.ogreAi?.plans?.[0]),"ogre-ai-run"),n.activeTab="ogreAi",h()}catch(t){yo(t.message),$(t.message)}finally{n.ogreAiLoading=!1,Fa=!1,Br===e&&(Br=null),h()}}function nr(e){const t=m("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function xy({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");n.ogreAutopilot=t.autopilot||null,n.activeTab==="ogreAi"&&h()}catch(t){e||nr(t.message)}}function My(){return{enabled:!!m("[data-autopilot-enabled]")?.checked,category:Yr(),amountSol:m("[data-ogre-ai-amount]")?.value?.trim()||(n.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:Ue("ogre-ai"),walletGroup:m("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:m("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:m("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:m("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:m("[data-autopilot-interval]")?.value?.trim()||"10"}}async function By(){if(n.ogreAutopilotBusy)return;const e=My();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){nr("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Le({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${Wu(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){n.ogreAutopilotBusy=!0,nr(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});n.ogreAutopilot=t.autopilot||null,nr(n.ogreAutopilot?.lastStatus||"Saved.")}catch(t){nr(t.message),$(t.message)}finally{n.ogreAutopilotBusy=!1,h()}}}function _t(e){const t=m("[data-kol-status]");v(t,e)}function Ry(e){const t=Ue("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...pa("kol")}}function Iy(e){const t=Ue("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",o=x("[data-kol-delay]","[data-kol-delay-custom]","5"),s=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),u=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),p=String(e||n.kolWallet||m("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!p)throw new Error("Paste or choose a KOL wallet first.");if(!Ft(p))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:p,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...pa("kol")}}async function Oy(e){try{const t=Ry(e);_t("Buying and arming KOL copy plan...");const a=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,K(xe(a.plan),"kol-copy-plan"),n.activeTab="kol",h()}catch(t){_t(t.message)}}async function Ey(e){try{const t=Iy(e);_t("Arming Copy Wallet watch...");const a=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,n.kolWallet=t.copyWallet,n.activeTab="kol",h()}catch(t){_t(t.message)}}function Ue(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function vo(e){const t=m("[data-bundle-status]");v(t,e)}function $d(){const e=m("[data-bundle-token]")?.value?.trim()||"",t=Ue("bundle"),a=m("[data-bundle-group]")?.value?.trim()||"",r=m("[data-bundle-amount]")?.value||"",o=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),s=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,percent:o,slippageBps:s}}function Fy(){const e=$d();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),a=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:a}=on(t,a),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:a,...pa("bundle-plan")}}async function Td(e){const t=L();let a=null,r="";const o=e==="buy"?"bundle-buy":"bundle-sell";try{a=$d();const s=tt(o,a.tokenMint,"bundle");if(s){ne("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-t,cacheHit:!0,requestId:s.tradeAttemptId||"",details:`${o}:${w(a.tokenMint)}`});return}r=ht(o),V(o,a.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-t,requestId:r,details:`${o}:${w(a.tokenMint)}`}),h(),vo(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Ce(20);const c=L();V(o,a.tokenMint,"bundle",{state:"submitting"});const i=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...a,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-c,requestId:r,resultCount:i.bundle?.successCount||0,details:o}),n.bundleResult=i.bundle,V(o,a.tokenMint,"bundle",{state:"submitted",signature:xe(i.bundle)}),K(xe(i.bundle),`bundle-${e}`,{tradeAttemptId:r}),n.activeTab="bundle",h(),Pe(o,a.tokenMint,"bundle",3e3)}catch(s){a?.tokenMint&&(V(o,a.tokenMint,"bundle",{state:"error",error:N(s.message||"Bundle trade failed")}),Pe(o,a.tokenMint,"bundle",4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-t,requestId:r,errorCode:s?.code||s?.name||"BUNDLE_TRADE_FAILED",details:N(s.message||"Bundle trade failed")}),vo(s.message)}}async function Wy(){try{const e=Fy();vo("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});n.bundleResult=t.plan,K(xe(t.plan),"bundle-plan"),n.activeTab="bundle",h()}catch(e){vo(e.message)}}function oe(e,t){return(n.presets?.[e]||[]).find(a=>a.id===t)||null}function Ad(){(n.selectedTradePresetId==="custom"||n.selectedTradePresetId&&!oe("trade",n.selectedTradePresetId))&&(n.selectedTradePresetId=""),(n.selectedBundlePresetId==="custom"||n.selectedBundlePresetId&&!oe("bundle",n.selectedBundlePresetId))&&(n.selectedBundlePresetId=""),n.editingTradePresetId&&!oe("trade",n.editingTradePresetId)&&(n.editingTradePresetId=""),n.editingBundlePresetId&&!oe("bundle",n.editingBundlePresetId)&&(n.editingBundlePresetId="")}function Pd(e,t="trade",a=""){t==="bundle"?n.bundleToken=e:n.tradeToken=e,n.activeTab=t,a&&$(a),window.history.pushState({},"","/terminal"),h({force:!0})}async function Cd(e=""){const t=String(e||"").trim();if(!t)return;const a=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),o=(s,c={})=>vt(ge(s,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){o(a);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}o(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(s){$(s.message||"Token search failed.")}}function ge(e="",t={}){const a=String(e||"").trim(),r=a?rr().find(o=>String(o?.tokenMint||"")===a):null;return{chain:"solana",tokenMint:a,tokenAddress:a,mint:a,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(a),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||a.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function xk(e={},t={}){return ge(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function wo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(n.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},Mo(n.smartChartTokenRef),n.terminalToken=t,n.terminalAutoToken=t,n.tradeToken=t,n.bundleToken=t,n.volumeToken=t,n.smartChartToken=t,t):""}function Dy(e,t={}){const a=new URLSearchParams;a.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return a.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&a.set("view",t.view),t.focusAmountInput&&a.set("focusAmount","1"),t.source&&a.set("source",String(t.source).slice(0,40)),t.returnTo&&a.set("returnTo",t.returnTo),`/terminal/chart?${a.toString()}`}function Wl(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),a=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||a.includes("pump")),o=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!o)}function Ny(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const So=new Map;function Dl(e){const t=String(e||"").trim();if(!t)return;const a=So.get(t)||0;Date.now()-a<3e4||(So.set(t,Date.now()),So.size>200&&So.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function vt(e={},t={}){na("chartRouteStart");const a=L(),r=wo(e);if(!r){$("Select a token before opening the chart.");return}zl(e,{source:t.source||"token-entry"}),Dl(r),n.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),n.smartChartView=Ny(n.smartChartTokenRef||e,t),n.chartFocusAmountInput=!!t.focusAmountInput,n.chartScrollIntoView=!0,n.activeTab="smartChart",n.route="terminal",n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.chartTradeStatus="",n.chartBuyWalletIndex="";const o=Dy(r,{defaultTab:t.defaultTab||"buy",view:n.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Va()});window.history.pushState({},"",o),h({force:!0}),H("chart-route-open",a,{component:"smartChart",cacheHit:!!(Je(r)?.cacheHit||lr(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function Nl(){if(!window.location.pathname.includes("/terminal/chart"))return;na("chartRouteStart");const e=L(),t=new URLSearchParams(window.location.search||""),a=String(t.get("token")||t.get("mint")||"").trim(),r=String(n.smartChartToken||"").trim();if(a){const o=ge(a,{source:t.get("source")||"route"});wo(o),zl(o,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{sn(o,{forceModal:!0,source:"deep-link"})}catch{}},900),a!==r&&(n.chartTradeStatus="",n.chartBuyWalletIndex="")}n.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",n.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",n.chartFocusAmountInput=t.get("focusAmount")==="1",n.chartScrollIntoView=!0,n.route="terminal",n.activeTab="smartChart",H("chart-route-apply",e,{component:"smartChart",cacheHit:!!(Je(a)?.cacheHit||lr(a)?.pairAddress),details:a})}function sn(e={},t={}){const a=wo(e);if(!a){$("Select a token before quick buying.");return}const r=ln(a);if(r&&Lo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const o=t.preset||lt(),s=o&&!t.forceModal?qe(o):"",c=o?.walletIndex||(o?.walletIndexes||[])[0]||(n.wallets[0]?.index?String(n.wallets[0].index):"");if(o&&s&&c&&!t.forceModal){To(a,{...o,walletIndex:c,walletIndexes:[c]});return}const i=ie();n.quickBuyModal={open:!0,tokenMint:a,amountSol:s||n.quickBuyAmountOverride||"",walletIndex:i?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"",slippageBps:"400",status:s?`Preset ${s} SOL loaded. Confirm when ready.`:o?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},Dl(a),h({force:!0}),requestAnimationFrame(()=>m("[data-quick-buy-modal-amount]")?.focus())}function _l(){n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function _y(e={},t={}){if(!_("protectedBuyEnabled",!0))return;const a=wo(e);if(!a){$("Select a token before opening Protected Buy.");return}const r=ln(a);if(r&&Lo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const o=va(a)||{tokenMint:a},s=Ye(o),c=t.presetId||s.protectedBuyPreset||Jl(s.verdict),i=Number(X(t.amountSol||n.quickBuyAmountOverride||qe()||"0.1")),u=c==="conservative"&&Number.isFinite(i)&&i>.25?"0.25":ur(i||.1),d=ie();Dl(a),n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.protectedBuyModal={open:!0,tokenMint:a,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:s.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>m("[data-protected-buy-amount]")?.focus())}function ko(){n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function Uy(){const e=n.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),a=String(m("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(m("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),o=X(m("[data-protected-buy-amount]")?.value||e.amountSol||""),s=String(m("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(m("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!o)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:a,walletIndex:r,amountSol:o,slippageBps:s,riskAccepted:c}}function qy(){const e=n.protectedBuyModal||{};if(!e.open)return"";const t=va(e.tokenMint)||{tokenMint:e.tokenMint},a=Ye(t),r=Oo(e.presetId),o=ce(e.walletIndex),s=a.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${l(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${l(cn(a.verdict))}">${l(a.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${tn(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${Xl.map(i=>`<option value="${i.id}" ${i.id===r.id?"selected":""}>${l(i.label)}</option>`).join("")}
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
        <small>${l(Uv(r))}</small>
        <small>Wallet: ${l(Hv(e.walletIndex))}</small>
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
      ${e.status?`<small class="connect-status">${l(e.status)}</small>`:""}
      ${e.error?`<small class="warning-text">${l(e.error)}</small>`:""}
      <small class="protected-buy-safe-copy">Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</small>
    </section>
  `}function Ul(){let e=m("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!n.protectedBuyModal?.open||!_("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=qy(),document.body.classList.add("protected-buy-modal-open")}async function Hy(){try{const e=Uy(),t=va(e.tokenMint)||{tokenMint:e.tokenMint};if(Ye(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Oo(e.presetId);if(n.protectedBuyModal={...n.protectedBuyModal,...e,status:ce(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},Ul(),ce(e.walletIndex)){const o=await $o({...e,source:`protected-buy:${r.id}`});n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),$(o?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Ce(20),n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await To(e.tokenMint,qv(e,r))}catch(e){n.protectedBuyModal={...n.protectedBuyModal||{},open:!0,status:"",error:N(e.message||"Protected Buy failed.")},h({force:!0})}}function Ky(){const e=String(n.quickBuyModal?.tokenMint||"").trim(),t=String(m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"").trim(),a=X(m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||""),r=String(m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!a)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r}}function Ld(){const e=lt();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function $o({tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r="400",source:o="quick-buy",takeProfitPct:s="",stopLossPct:c="",sellDelay:i="off",sellPercent:u="100"}){const d=Number(a);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const p=ht("quick-buy"),f=on(i,u),y=_e(s)||_e(c)||_e(f.sellDelay);let g={tokenMint:e,walletIndex:t,slippageBps:r};const S=n.quickBuyModal?.open?A=>El(A,""):he;if(g=go(g,{side:"buy",statusWriter:S}).form,t=g.walletIndex,n.quickBuyLast={source:o,tokenMint:e,walletConnected:ce(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:p,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:p,clickedAt:new Date().toISOString()}),n.quickBuyModal={...n.quickBuyModal,status:ce(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:p},ce(t)){El("Opening wallet approval...",""),le();const A=await ar({side:"buy",form:g,actionDetail:String(a),amountSol:String(d),amountMode:"fixed",attemptId:p,statusWriter:S});if(n.quickBuyLast={...n.quickBuyLast,status:"submitted"},y){const C="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";n.quickBuyModal?.open?El(C,""):he(C)}return A}h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ce(20);const T={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:p};y&&Object.assign(T,{autoExit:!0,takeProfitPct:s,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(T),dedupe:!1,timeoutMs:te});return n.tradeResult=b.trade,b.trade?.autoExitPlan&&(n.tradePlanResult=b.trade.autoExitPlan,mo()),K(b.trade?.signature,"quick-buy-custom",{tradeAttemptId:p}),V("trade-buy",e,String(a),{state:"submitted",signature:b.trade?.signature||""}),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},b.trade}async function Vy(e=""){const t=L(),a=X(m("[data-chart-buy-amount]")?.value||""),r=Number(a);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let o=m("[data-chart-buy-wallet]")?.value||"";if(!o)throw new Error("Choose a wallet before buying.");const s=ht("chart-buy");let c={tokenMint:e,walletIndex:o,slippageBps:m("[data-chart-buy-slippage]")?.value||"400"};if(c=go(c,{side:"chart buy",statusWriter:Fe}).form,o=c.walletIndex,tt("trade-buy",e,String(a)))return n.tradeResult;if(n.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:ce(o),customAmountValid:!0,presetAmount:"",tradeAttemptId:s,status:"submitting",error:""},V("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),Fe(ce(o)?"Opening wallet approval...":"Submitting Session Wallet buy..."),W({component:"post-trade",action:ce(o)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:L()-t,requestId:s,details:`${ce(o)?"browser":"session"}-buy:${w(e)}:${a}`}),le(),ce(o)){const y=await ar({side:"buy",form:c,actionDetail:String(a),amountSol:String(r),amountMode:"fixed",attemptId:s,statusWriter:Fe});return n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",Fe(y?.message||"Buy submitted from connected wallet."),Pe("trade-buy",e,String(a),3e3),y}const d=wd(),p={tokenMint:e,walletIndex:o,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:s};d.enabled&&Object.assign(p,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),Fe(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(p),dedupe:!1,timeoutMs:te});return n.tradeResult=f.trade,f.trade?.autoExitPlan&&(n.tradePlanResult=f.trade.autoExitPlan,mo()),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",V("trade-buy",e,String(a),{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"chart-session-buy",{tradeAttemptId:s}),Fe(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Pe("trade-buy",e,String(a),3e3),f.trade}async function zy(){try{const e=Ky(),t=hl(n.quickBuyModal?.error||n.quickBuyModal?.status||"");if(t)throw new Error(t);n.quickBuyModal={...n.quickBuyModal,...e,status:"Validating quick buy...",error:""};const a=await $o({...Ld(),...e,source:n.quickBuyModal?.source||"quick-buy-modal"});n.quickBuyModal={...n.quickBuyModal,open:!1,status:a?.message||"Quick buy submitted.",error:""},n.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Pe("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=N(e.message||"Quick buy failed."),a=hl(t);n.quickBuyLast={...n.quickBuyLast||{},status:"failed",error:a||t},n.quickBuyModal={...n.quickBuyModal,status:a?"Token safety blocked fast buy.":"",error:a||t},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"})}}async function To(e,t=null){const a=L(),r=t||oe("trade",n.selectedTradePresetId);let o="quick";if(!r){sn(ge(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const s=t?X(r.amountSol):qe(r);if(!s)throw new Error("Set a quick buy amount first.");o=String(s);const c=tt("trade-buy",e,o);if(c){W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${s}`});return}const i=ht("quick-trade");V("trade-buy",e,o,{state:"clicked",tradeAttemptId:i,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),n.tradeToken=e,h({preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ce(0),await Y(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!n.wallets.some(y=>String(y.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:s,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),n.tradeToken=e,await Ce(20);const p=L();V("trade-buy",e,o,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:i,clientClickToUiMs:Math.round(p-a)}),dedupe:!1,timeoutMs:te});n.tradeResult=f.trade,f.trade?.autoExitPlan?(n.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),mo()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),n.tradeToken=e,V("trade-buy",e,o,{state:"submitted",signature:f.trade?.signature||""}),K(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:i}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Pe("trade-buy",e,o,3e3)}catch(s){e&&(V("trade-buy",e,o,{state:"error",error:N(s.message||"Quick buy failed")}),Pe("trade-buy",e,o,4e3)),$(s.message)}}async function xd(e,t=null){const a=t||oe("bundle",n.selectedBundlePresetId);if(!a){Pd(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(a.walletIndexes||[]).length||(a.walletGroup?"group":"saved");if(!await Le({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${a.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){Pd(e,"bundle","Review the Bundle setup, then submit.");return}}try{n.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Ce(0),await Y(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(a.walletIndexes||[]).filter(s=>n.wallets.some(c=>String(c.index)===String(s))),walletGroup:a.walletGroup||"",amountSol:t?X(a.amountSol)||"0.1":_v(a),percent:"100",slippageBps:a.slippageBps,sellDelay:a.sellDelay||"off",takeProfitPct:a.takeProfitPct,stopLossPct:a.stopLossPct,sellPercent:a.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const o=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});n.bundleResult=o.plan,n.bundleToken=e,K(xe(o.plan),"quick-preset-bundle"),n.activeTab="bundle",h()}catch(r){$(r.message)}}async function Ao(e,t="100",a={}){const r=L();let o=Number.parseInt(t,10),s="";try{if(await Y(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=Ks(e,String(o));if(c){W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${o}`});return}const i=nt().find(S=>String(S.tokenMint)===String(e)),u=i?.symbol||i?.name||w(e),d=!!(i?.source==="connected-wallet"||i?.viewOnly||String(i?.walletIndex||"").toLowerCase()==="connected"),p=String(ie()?.publicKey||"").trim();if(d&&p){s=ht("manual-sell"),ra(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:s,details:`browser:${w(e)}:${o}`}),$(""),n.activeTab!=="smartChart"&&(n.activeTab="positions");const S=n.activeTab==="smartChart"?Fe:T=>$(T);S("Building wallet-approved sell..."),le(),ra(e,String(o),{state:"submitting"});const P=await ar({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:a.slippageBps||"400"},actionDetail:`${o}%`,percent:String(o),attemptId:s,statusWriter:S});n.tradeResult=P,ra(e,String(o),{state:"submitted",signature:P?.signature||""}),K(P?.signature,"browser-manual-sell",{tradeAttemptId:s}),n.activeTab==="smartChart"?(Fe(P?.message||"Sell submitted from connected wallet."),le()):h({preserveSmartChartFrame:!1}),Vs(e,String(o),3e3);return}if(!(!!a.skipConfirm||await Le({title:"Confirm Exit",lines:[`Exit ${o}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${o}%`,danger:!0})))return;s=ht("manual-sell"),ra(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:s,details:`${w(e)}:${o}`}),n.activeTab="positions",$(""),h(),await Ce(20);const y=L();ra(e,String(o),{state:"submitting"});const g=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:o,slippageBps:"400",manualSellAttemptId:s,clientClickToUiMs:Math.round(y-r)}),timeoutMs:te,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-y,requestId:s,resultCount:g.bundle?.successCount||0,details:g.bundle?.duplicate?"duplicate":"submitted"}),n.bundleResult=g.bundle,n.bundleToken=e,n.tradeToken=e,ra(e,String(o),{state:(g.bundle?.duplicate,"submitted"),signature:xe(g.bundle),backendMs:g.bundle?.manualSellTiming?.backendMs||null}),K(xe(g.bundle),"manual-sell-position"),n.activeTab="positions",h(),Vs(e,String(o),3e3)}catch(c){e&&Number.isInteger(o)&&(ra(e,String(o),{state:"error",error:N(c.message||"Sell failed")}),Vs(e,String(o),4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-r,requestId:s,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:N(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}}function xe(e){return e?.signature?e.signature:(e?.results||[]).find(a=>a.signature)?.signature||""}async function jy(){const e=m("[data-tx-audit-signature]")?.value?.trim()||n.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}n.terminalTxSignature=e,n.terminalTxLoading=!0,n.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);n.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){n.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{n.terminalTxLoading=!1,h()}}function Gy(e,t="manager"){const a=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Trade Preset",walletIndex:m(`[data-${a}-preset-wallet]`)?.value||"1",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"25",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}:{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Bundle Preset",walletIndexes:Ue(`${a}-preset`),walletGroup:m(`[data-${a}-preset-group]`)?.value?.trim()||"",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"60",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}}function Xy(e,t){const a=(t||[]).find(r=>!r.readonly);a?.id&&(e==="trade"&&(n.selectedTradePresetId=a.id),e==="bundle"&&(n.selectedBundlePresetId=a.id))}function Po(e,t){const a=!!(t&&oe(e,t));e==="trade"&&(n.selectedTradePresetId=a?t:""),e==="bundle"&&(n.selectedBundlePresetId=a?t:"")}function ql(e,t){e==="trade"&&(n.fastTradePresetStatus=t),e==="bundle"&&(n.fastBundlePresetStatus=t)}function Jy(e,t){Po(e,t),ql(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Md(e,t="manager"){const a=m(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await Y(a,"Creating secure web profile for presets..."),v(a,"Saving preset...");const r=Gy(e,t),o=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});n.presets=o.presets||n.presets,r.id&&oe(e,r.id)?Po(e,r.id):Xy(e,n.presets?.[e]),t==="manager"&&Zr(e,""),t==="fast"&&ql(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),v(a,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&ql(e,r.message),v(a,r.message),$(r.message)}}async function Yy(e,t){try{const a=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});n.presets=a.presets||n.presets,e==="trade"&&n.selectedTradePresetId===t&&Po("trade",""),e==="bundle"&&n.selectedBundlePresetId===t&&Po("bundle",""),(e==="trade"&&n.editingTradePresetId===t||e==="bundle"&&n.editingBundlePresetId===t)&&Zr(e,""),h()}catch(a){$(a.message)}}function Bd(e,t){Zr(e,t),n.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const a=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);a?.scrollIntoView({behavior:"smooth",block:"start"}),a?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function Rd(e={}){const t=m("[data-referral-status]");try{await Y(t,"Opening secure web profile..."),v(t,e.generate?"Generating referral code...":"Saving referral settings...");const a=String(m("[data-referral-code]")?.value||"").trim(),r=sg(m("[data-referral-link]")?.value||""),o=String(n.user?.referralCode||"").trim(),s=e.generate?a:r&&r!==o&&(!a||a===o)?r:a||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:s,generateReferralCode:!!e.generate,referralPayoutWallet:m("[data-referral-wallet]")?.value||""})});pe(c.user);const i=c.user?.referralCode||n.user?.referralCode||"";v(t,e.generate?`Generated ${i}. Link is ready.`:`Referral settings saved. Code: ${i}`),h()}catch(a){v(t,a.message),$(a.message)}}async function Qy(){const e=m("[data-trader-board-status]");try{await Y(e,"Opening secure web profile..."),v(e,"Saving trader board settings...");const t=m("[data-trader-board-wallet-mode]")?.value||"all",a=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!m("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:Ue("trader-board")})});pe(a.user),v(e,a.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){v(e,t.message),$(t.message)}}async function Id(e,t){const a=t.dataset.watchToken||t.dataset.unwatchToken||"";if(a)try{await Y(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:a,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});n.watchlist=r.watchlist||n.watchlist,h()}catch(r){$(r.message)}}function Hl(e){const t=m("[data-launch-status]");v(t,e)}function Zy(){const e=m("[data-launch-ticker]")?.value?.trim()||St(Me().keywords)[0]||"",t=Ue("launch"),a=m("[data-launch-group]")?.value?.trim()||"",r=m("[data-launch-amount]")?.value||"",o=x("[data-launch-tp]","[data-launch-tp-custom]","40"),s=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),i=x("[data-launch-loop]","[data-launch-loop-custom]","1"),u=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return Me().keywords=e,Me().open=!0,{ticker:e,walletIndexes:t,walletGroup:a,amountSol:r,takeProfitPct:o,stopLossPct:s,sellDelay:c,loopCount:i,loopDelay:u,slippageBps:d,...pa("launch")}}async function ev(){try{const e=Zy();Hl("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});n.launchResult=t.watch,await sa(),n.activeTab="launch",h()}catch(e){Hl(e.message)}}async function tv(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});n.launchResult=t.watch,await sa(),n.activeTab="launch",h()}catch(t){Hl(t.message)}}function av(){return`
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
      <small data-wallet-sweep-status>${l(n.walletSweepStatus||"")}</small>
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
  `}function nv(){const e=Ou();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${l(n.sweepBackgroundStatus||"")}</small>
    </section>`}async function rv(){if(!n.sweepBackgroundPending){n.sweepBackgroundPending=!0,n.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:te});n.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await bt({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){n.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{n.sweepBackgroundPending=!1,h({force:!0})}}}function ov(){const e=iv(),a=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Od()}
    <section class="account-check-card">
      <div>
        <h3>Wallet Actions</h3>
        <p>Refresh balances, view token positions, or remove saved wallet records after backup.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Balances</button>
      <button data-tab="positions">View Positions</button>
      <button data-tab="kol">Open KOL Tracker</button>
      <button data-tab="txAudit">Tx Audit</button>
      <small data-wallet-remove-status>${l(n.walletRemoveStatus||"")}</small>
    </section>
    <div class="table-list">
      ${Tl().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${Za(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${l(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${l(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${cv(r)}
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
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${Zg()}${nv()}${Qg()}${av()}`},{key:"create",label:"Create",hint:"New wallets",html:Qa()},{key:"import",label:"Import",hint:"Add keys",html:yu()},{key:"backup",label:"Backup",hint:"Save / restore",html:bu()},{key:"downloads",label:"Downloads",hint:"Exports",html:vu()}];if(!n.wallets.length){const r=a.filter(o=>o.key!=="balances"&&o.key!=="fund");return`
      ${e}
      ${I("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${an({toolKey:"wallets",activeKey:nn("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${an({toolKey:"wallets",activeKey:nn("wallets","balances"),sections:a})}
  `}function sv(){return(Array.isArray(n.wallets)?n.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function lv(){if(!(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey)return"";const t=sv();return t?`
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
    </div>`}function iv(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.connectedWalletBalance||{},a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",s=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${l(c.dexUrl||Q(c.mint))}" target="_blank" rel="noreferrer">
      ${dt({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
      <span>${l(c.symbol||c.shortMint||w(c.mint))}: ${l(c.uiAmount??"held")}</span>
    </a>
  `).join("");return`
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${l(e.provider||t.provider||"Solana Wallet")} ${l(w(e.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${l(a)}</strong></span>
          <span><small>Tokens</small><strong>${l(r)}</strong></span>
          <span><small>Status</small><strong>${t.error?"Needs refresh":"Synced"}</strong></span>
        </div>
        ${t.error?`<small>Check failed: ${l(t.error)}</small>`:""}
        ${s?`<div class="connected-token-list">${s}</div>`:""}
        ${lv()}
        <small>${n.walletFastApprovalsEnabled?"Fast approvals are on for connected-wallet prompts.":"Fast approvals are off."}</small>
      </div>
      <div class="card-actions">
        <button data-refresh-all>Refresh</button>
        <button data-copy="${l(e.publicKey)}">Copy</button>
        <button type="button" data-wallet-fast-approvals-toggle>${n.walletFastApprovalsEnabled?"Fast Approvals On":"Fast Approvals Off"}</button>
        <button type="button" data-connect-wallet="solana">Reconnect</button>
        <button type="button" data-disconnect-wallet>Disconnect</button>
        <button data-tab="txAudit">Tx Audit</button>
        <a href="https://solscan.io/account/${encodeURIComponent(e.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
      </div>
    </section>
  `}function Od(){const e=n.balances.reduce((a,r)=>a+Number(r.tokens?.length||0),0)+Uc().length,t=n.balances.filter(a=>a.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${nl()}</strong></div>
      <div><span>Total SOL</span><strong>${Ot().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function cv(e){const t=n.balances.find(s=>Number(s.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${l(t.error)}</span>`;const a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${l(a)} | ${l(r)}${l(o)}</span>`}function uv(){const e=nt(),t=`
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
    ${dv()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(Tp).join("")}
    </div>
  `:`${t}${I("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function dv(){const e=n.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${l(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const a=t.filter(o=>!o.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
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
              <strong>$${l(o.symbol)} <span style="color:${r[o.verdict]||"#9fb59a"};font-weight:800">${l(o.verdict)}${o.score!=null?` ${l(String(o.score))}/100`:""}</span></strong>
              <small>${o.flags.length?l(o.flags.join(" | ")):"no red flags"}${o.liquidityUsd!=null?` | liq ${B(o.liquidityUsd)}`:""}${o.marketCapUsd?` | MC ${B(o.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${l(o.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${l(o.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function pv(e){const t=String(e||"").trim();if(!t)return;n.devWatch||(n.devWatch={});const a=!n.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:a}),timeoutMs:15e3});n.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}wa()}async function mv(e,t=null){const a=String(e||"").trim();if(!a)return;const r=lt();t&&(t.disabled=!0,t.textContent="Arming...");try{const o=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:a,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});ed(a),n.walletRemoveStatus=o.message||"Exits armed.",t&&(t.textContent="✅ Armed"),td().then(()=>h())}catch(o){$(o?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function fv(){n.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});n.bagScan={status:"done",bags:e.bags||[]}}catch(e){n.bagScan={status:"error",message:e?.message||""}}h()}function hv(){const e=`
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
            ${dt(t)}
            <div>
              <strong>${l(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${l(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${l(t.tokenMint)}">${l(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${l(t.spentSol||"0")} SOL</span>
          <span>${l(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${l(t.realizedSol||"0")}</span>
          <span>${l(t.holdTime||"n/a")}<small>Latest ${l(we(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${je(Su(t),"Share")}
            <button data-pnl-card="${l(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${l(t.tokenMint)}" data-share-text="${l(Su(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${I("No PnL yet","Trades made through the bot will show here.")}`}function rr(){return gv(or())}function or(){const e=Object.values(n.livePairsByBucket||{}).flatMap(o=>o?.rows||[]),t=n.scan?.rows||[],a=n.kolScan?.rows||[],r=n.watchlist?.rows||[];return[...e,...t,...a,...r]}function ln(e=""){const t=String(e||"");return t&&or().find(a=>String(a?.tokenMint||"")===t)||null}function Mk(e=""){const t=ln(e);return!t||!Lo(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function gv(e=[]){const t=new Map;for(const a of e||[]){if(sr(a))continue;const r=String(a?.tokenMint||"");r&&!t.has(r)&&t.set(r,a)}return[...t.values()]}function be(e=[]){const t=new Map;for(const a of e||[]){if(sr(a))continue;const r=String(a?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||Co(a)>Co(o))&&t.set(r,a)}return[...t.values()]}function Co(e={}){return Av(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(O(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function bv(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function Lo(e={}){if(bv(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function sr(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function Ed(){const e=rr(),t=s=>e.find(c=>String(c.tokenMint)===s)||{tokenMint:s,shortMint:w(s),symbol:w(s),dexUrl:Q(s)},a=String(n.terminalToken||n.tradeToken||"").trim();if(a)return t(a);const r=String(n.terminalAutoToken||"").trim();if(r)return t(r);const o=(De()?.rows||[])[0]||e[0]||null;return o?.tokenMint&&(n.terminalAutoToken=String(o.tokenMint)),o}function xo(){const e=rr(),t=n.smartChartTokenRef||null,a=o=>e.find(s=>String(s.tokenMint||"")===o)||{...String(t?.tokenMint||"")===o?t:{},tokenMint:o,shortMint:w(o),symbol:t?.symbol||w(o),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||Q(t?.pairAddress||o),pumpUrl:o.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(o)}`:""},r=String(n.smartChartToken||n.terminalToken||n.tradeToken||"").trim();return Nd(r?a(r):Ed())}function Fd(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const yv=300*1e3,Wd=45*1e3,Dd=600*1e3,vv=700,wv=6e3,Sv=4,kv=3e4;function Je(e=""){const t=String(e||"").trim();if(!t)return null;const a=n.smartChartBootstrap?.[t]||null;if(!a)return null;const r=Date.now()-Number(a.loadedAt||a.resolvedAt||0);return a.status==="failed"?r<Wd?a:null:r<Dd?a:null}function lr(e=""){const t=String(e||"").trim(),a=t?n.smartChartDexResolution?.[t]||Je(t):null;if(!a)return null;const r=Date.now()-Number(a.resolvedAt||0);return a.status==="failed"?r<Wd?a:null:r<yv?a:null}function Nd(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=lr(t);return!a||a.status==="failed"?e:{...e,pairAddress:e.pairAddress||a.pairAddress||"",pairId:e.pairId||a.pairAddress||"",dexUrl:e.dexUrl||a.dexUrl||a.pairUrl||"",dexId:e.dexId||a.dexId||"",dexName:e.dexName||a.dexName||a.dexId||"",symbol:e.symbol||a.symbol||w(t),name:e.name||a.name||"Token",imageUrl:e.imageUrl||a.imageUrl||"",marketCap:e.marketCap||a.marketCap||0,marketCapUsd:e.marketCapUsd||a.marketCap||0,fdv:e.fdv||a.fdv||0,liquidityUsd:e.liquidityUsd||a.liquidityUsd||0,volumeH24:e.volumeH24||a.volumeH24||0,volumeH1:e.volumeH1||a.volumeH1||0,priceUsd:e.priceUsd||a.priceUsd||0,h1:e.h1||a.h1||0,volume:e.volume||a.volume||null,txns:e.txns||a.txns||null}}function Kl(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const a=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:a,resolvedAt:a};n.smartChartBootstrap={...n.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&Mo({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function Mo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.pairAddress||e.pairId||"").trim();!t||!a&&!e.dexUrl&&!e.symbol&&!e.name||(n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{...n.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:a,dexUrl:e.dexUrl||Q(a||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||n.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||n.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||n.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||n.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||n.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||n.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||n.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function $v(e={}){const t=String(e?.tokenMint||n.smartChartToken||"").trim();if(!t)return!1;const a=String(e?.pairAddress||e?.pairId||"").trim();if(a)return Mo({...e,tokenMint:t,pairAddress:a}),!1;if(Je(t)?.pairAddress)return!1;const r=lr(t);return r?.pairAddress||r?.status==="failed"?!1:(n.smartChartDexResolving?.[t]||(n.smartChartDexResolving={...n.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{qd(t).catch(()=>{})},0)),!0)}function _d(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||n.smartChartToken||"").trim();return!a||!t.force&&Je(a)?.status==="resolved"?!1:(n.smartChartBootstrapLoading?.[a]||(n.smartChartBootstrapLoading={...n.smartChartBootstrapLoading||{},[a]:!0},window.setTimeout(()=>{qd(a,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const Vl=new Map;async function Ud(e){const t=String(e||"").trim();if(!t)return;const a=Vl.get(t)||0;if(Date.now()-a<3e4)return;Vl.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,p)=>(Number(p?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},o=async()=>{const s=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!s?.pair)throw new Error("no pair");return s.pair};try{const s=await Promise.any([r(),o()]);Kl({tokenMint:t,symbol:s.baseToken?.symbol||"",name:s.baseToken?.name||"",priceUsd:s.priceUsd,marketCap:s.marketCap||s.fdv||null,marketCapUsd:s.marketCap||s.fdv||null,fdv:s.fdv||null,liquidityUsd:Number(s.liquidity?.usd)||null,liquidity:{usd:Number(s.liquidity?.usd)||null},volumeH24:Number(s.volume?.h24)||null,volumeH1:Number(s.volume?.h1)||null,h1:Number(s.priceChange?.h1)||null,imageUrl:s.info?.imageUrl||"",dexUrl:s.url||"",pairAddress:s.pairAddress||"",dexId:s.dexId||"",pumpCurve:!!s.pumpCurve,bondingProgressPct:s.bondingProgressPct??null,source:s.pumpCurve?"pump-curve":"direct-dexscreener"}),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{Vl.delete(t)}}function zl(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return a?(Mo(e),Ih(a,e.symbol||e.name||""),Ud(a),_d(e,{source:t.source||"prefetch"}),n.smartChartPrefetchLog=[...n.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:a,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(n.smartChartBootstrapLoading?.[a]||Je(a)),cacheTtlMs:Dd}].slice(-20),!0):!1}async function qd(e=""){const t=String(e||"").trim();if(!t)return null;try{const a=L(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),o=r.chart||r.dexToken||{};return Kl(o),H("chart-bootstrap",a,{component:"smartChart",cacheHit:!!o.cacheHit,stale:!!o.stale,details:`${t}:${o.chartProvider||"dexscreener-embed"}`}),n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),o}catch(a){return n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:N(a?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),null}finally{const a={...n.smartChartDexResolving||{}};delete a[t],n.smartChartDexResolving=a;const r={...n.smartChartBootstrapLoading||{}};delete r[t],n.smartChartBootstrapLoading=r}}function Tv(e,t={}){const a=Fd(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(a)}?${r.toString()}`}function Hd(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Je(a);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Tv(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function Bk(e={}){const t=String(e?.tokenMint||e?.mint||n.smartChartToken||""),a=Jd(t||e?.symbol||"pump"),r=Math.max(1,O(e.marketCap,e.fdv,e.liquidityUsd,1e4)),o=O(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),s=Math.max(4,Math.min(96,Ut(e)||O(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(o)||O(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(i,u)=>{const d=Math.sin((u+a%11)/2.2)*c,p=(u/21-.5)*(o||s/3),f=((a>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+p+f)/100))})}function Rk(e={},...t){for(const a of t){const r=Number(e?.[a]);if(Number.isFinite(r)&&r>0)return r;const o=a.split(".").reduce((c,i)=>c?.[i],e),s=Number(o);if(Number.isFinite(s)&&s>0)return s}return 0}function Ik(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="txns",o=Math.max(0,Math.min(100,Ut(e)||O(e.bondingProgressPct,e.pumpProgress,0))),s=D(e.marketCapLabel,e.fdvLabel,B(e.marketCap),B(e.fdv)),c=D(e.liquidityLabel,B(e.liquidityUsd)),i=D(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,B(e.volumeM15),B(e.volume5m),B(e.volumeH1));return`
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
          ${ak(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${l(s)}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(c)}</dd></div>
          <div><dt>Volume</dt><dd>${l(i)}</dd></div>
          <div><dt>Status</dt><dd>${Wl(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":nk(e)}
      <small>${l(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function jl(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",o=t==="info",s=_d(e)||$v(e),c=o?`DexScreener info for ${e.symbol||w(a)}`:r?`DexScreener chart and transactions for ${e.symbol||w(a)}`:`DexScreener chart for ${e.symbol||w(a)}`,i=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",o?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=s?"Loading DEX chart while resolving fastest pair...":o?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",p=Hd(e,t);return`
    <div class="${l(i)}" data-chart-frame-loading="${l(d)}" data-chart-resolving="${s?"true":"false"}" data-chart-mint="${l(a)}" data-chart-mode="${l(t)}" data-chart-src="${l(p)}">
      <iframe title="${l(c)}" src="${l(p)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${l(t)}','${l(a)}')" allowfullscreen></iframe>
    </div>
  `}function Kd(){const e=[...Object.values(n.livePairsByBucket||{}).flatMap(a=>a?.rows||[]),...n.livePairs?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[],...n.watchlist?.rows||[]],t=new Map;for(const a of e){const r=String(a?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||Co(a)>Co(o))&&t.set(r,a)}return t}function Av(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,a)=>t+(a&&String(a).toLowerCase()!=="n/a"?1:0),0)}function Vd(e=[]){const t=Kd();return(e||[]).map(a=>zd(a,t.get(String(a?.tokenMint||""))))}function st(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const o=Number(r[1]);if(!Number.isFinite(o))return null;const s=String(r[2]||"").toLowerCase();return s==="k"?o*1e3:s==="m"?o*1e6:s==="b"?o*1e9:o}function O(...e){for(const t of e){const a=st(t);if(Number.isFinite(a)&&a>0)return a}for(const t of e){const a=st(t);if(Number.isFinite(a))return a}return 0}function zd(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:O(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:O(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:D(e.marketCapLabel,t.marketCapLabel,B(e.marketCap),B(t.marketCap)),fdvLabel:D(e.fdvLabel,t.fdvLabel,B(e.fdv),B(t.fdv)),liquidityUsd:O(e.liquidityUsd,t.liquidityUsd),liquidityLabel:D(e.liquidityLabel,t.liquidityLabel,B(e.liquidityUsd),B(t.liquidityUsd)),volume5m:O(e.volume5m,t.volume5m),volume5mLabel:D(e.volume5mLabel,t.volume5mLabel,B(e.volume5m),B(t.volume5m)),volumeM15:O(e.volumeM15,t.volumeM15),volumeM15Label:D(e.volumeM15Label,t.volumeM15Label,B(e.volumeM15),B(t.volumeM15)),volumeM30:O(e.volumeM30,t.volumeM30),volumeM30Label:D(e.volumeM30Label,t.volumeM30Label,B(e.volumeM30),B(t.volumeM30)),volumeH1:O(e.volumeH1,t.volumeH1),volumeH1Label:D(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,B(e.volumeH1),B(t.volumeH1)),volumeH24:O(e.volumeH24,t.volumeH24),volumeH24Label:D(e.volumeH24Label,t.volumeH24Label,B(e.volumeH24),B(t.volumeH24)),volumeLabel:D(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,B(e.volumeH1),B(t.volumeH1)),sniperCount:O(e.sniperCount,t.sniperCount)}:e}function ir(e=[],t=[]){return be([...n.livePairsByBucket.under1d?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.scan?.rows||[],...e,...t]).sort((r,o)=>Number(o.bestPickScore||o.score||0)-Number(r.bestPickScore||r.score||0)||O(o.volumeM15,o.volumeM30,o.volumeH1,o.volume5m,o.volumeH24)-O(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||O(o.marketCap,o.fdv)-O(r.marketCap,r.fdv)||Qe(r,o))}function j(e,t,a,r,o){return{key:e,label:t,severity:a,message:r,weight:o}}function Pv(e={}){const t=st(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const a=st(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(a)?a/60:null}function Cv(e,t=[]){const a=(t||[]).some(o=>o.key==="hard_flag"),r=(t||[]).filter(o=>o.severity==="risk"&&o.key!=="liquidity_extreme").length;return a||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function Lv(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const a=(t||[]).find(r=>r.severity==="risk");return a?.message?`Avoid recommended. ${a.message}`:"Avoid recommended. Multiple danger signals."}const Bo=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function fa(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(Bo,t)?t:"unknown"}function Ro(e="",t="Unknown"){const a=fa(e);return Bo[a]||t}function jd(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=a?"new":"unknown";return{mint:t,status:r,label:Bo[r],confidence:a?"low":"unknown",summary:a?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:a||null,updatedAt:""}}function cr(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(n.devInfoSummaries?.[t]||e.devInfoSummary)||jd(e)}function xv(e={}){const t=fa(e.status);return t==="hold"?j("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?j("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?j("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?j("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?j("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):j("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function Gd(e={},t={}){if(!_("devInfoEnabled",!0))return"";const a=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!a)return"";const r=cr(e),o=fa(r.status),c=!!n.devInfoLoading?.[`summary:${a}`]?"...":o==="unknown"?"":r.label||Bo[o]||"",i=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${l(o)} ${i?"is-compact":""}" data-dev-info="${l(a)}" title="${l(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${l(c)}</strong>`:""}
    </button>
  `}function Mv(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let a=70;const r=[],o=[],s=[],c=st(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(a-=36,o.push("liquidity"),r.push(j("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(a-=20,o.push("liquidity"),r.push(j("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(a+=8,o.push("liquidity"),r.push(j("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(o.push("liquidity"),r.push(j("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(a-=6,s.push("liquidity"),r.push(j("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const i=Pv(e);Number.isFinite(i)?i<3?(a-=10,o.push("age"),r.push(j("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):i>60?(a+=4,o.push("age"),r.push(j("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):o.push("age"):(a-=4,s.push("age"),r.push(j("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=st(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(a-=5,o.push("volume"),r.push(j("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(a+=6,o.push("volume"),r.push(j("volume_active","Volume","positive","Volume is active enough to review flow.",6))):o.push("volume"):s.push("volume");const d=st(e.buys5m??e.buysH1??e.buys),p=st(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(p)?(o.push("flow"),p>=d*1.8&&p>=5?(a-=18,r.push(j("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=p*1.4&&d>=8&&(a+=5,r.push(j("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):s.push("flow");const f=st(e.bestPickScore??e.score);Number.isFinite(f)&&(o.push("score"),f>=78?(a+=7,r.push(j("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(a-=10,r.push(j("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(T=>String(T||"").toLowerCase());y.some(T=>/mayhem|fake|scam|honeypot|blacklist/.test(T))&&(a-=40,r.push(j("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(T=>/bundle|bundled|cluster|concentr/.test(T))&&(a-=18,r.push(j("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(T=>/dev|fresh wallet|fresh-wallet|insider/.test(T))&&(a-=14,r.push(j("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(T=>/mint|freeze|token-2022/.test(T))&&(a-=24,r.push(j("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const g=cr(e);if(g){const T=xv(g);a+=Number(T.weight||0),r.push(T),["hold","mixed","risk","dump"].includes(fa(g.status))?o.push("devInfo"):s.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(a))),P=Cv(S,r);return{mint:t,verdict:P,score:S,confidence:o.length>=5&&s.length<=1?"high":o.length>=3?"medium":"low",summary:Lv(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Ye(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&n.slimeShieldResults?.[t]||Mv(e)}function cn(e=""){return String(e||"CAUTION").toLowerCase()}function Bv(e={},t={}){if(!_("slimeShieldEnabled",!0))return Ov(e);const a=Ye(e),r=String(e.tokenMint||a.mint||"").trim(),o=a.verdict||"CAUTION",s=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${l(cn(o))}" data-slimeshield-details="${l(r)}" title="${l(a.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${s?"Shield":"SlimeShield"}</small>
    </button>
  `}function Rv(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${l(Gl(e))}">${l(o?`${o}`:"n/a")} score</em>`}const t=Ye(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${l(cn(r))}" data-slimeshield-details="${l(a)}" title="${l(t.summary||"Open SlimeShield details")}">Details</button>`}function Ok(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0),s=o?`${o}`:"n/a";return`
      <span class="terminal-score-chip" title="${l(Gl(e))}">
        <strong>${l(s)}</strong>
        <small>score</small>
      </span>
    `}const t=Ye(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${l(cn(r))}" data-slimeshield-details="${l(a)}" title="${l(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Iv(e={}){return _("slimeShieldEnabled",!0)?`SlimeShield ${Ye(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function Ov(e={}){const t=Number(e.bestPickScore||e.score||0),a=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${l(Gl(e))}">
      <strong>${l(r)}</strong>
      <small>${a.length?"warnings":"best pick"}</small>
    </span>
  `}function Ev(e={}){return Bv(e,{compact:!0})}function Gl(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},a=Object.entries(t).map(([o,s])=>`${o}: ${s}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...a,...r.map(o=>`warning: ${o}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function Fv(e={}){return""}function B(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function D(...e){for(const t of e){const a=String(t??"").trim();if(a&&a!=="$0"&&a.toLowerCase()!=="n/a")return a}return"n/a"}function Xd(e={}){return[["15m",D(e.volumeM15Label,B(e.volumeM15))],["30m",D(e.volumeM30Label,B(e.volumeM30))],["1h",D(e.volumeH1Label,e.volumeLabel,B(e.volumeH1))],["24h",D(e.volumeH24Label,B(e.volumeH24))]]}function Ek(e={}){const t=ct(e),a=ut(e),r=D(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),o=D(e.liquidityLabel,a>0?B(a):"","checking"),s=Xd(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      ${s.map(([c,i])=>`<span>${l(c)} <b>${l(i)}</b></span>`).join("")}
    </div>
  `}function Wv(e={}){const t=ct(e),a=ut(e),r=D(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),o=D(e.liquidityLabel,a>0?B(a):"","checking"),s=D(e.volumeM15Label,B(e.volumeM15)),c=D(e.volumeH1Label,e.volumeLabel,B(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      <span>15m <b>${l(s)}</b></span>
      <span>1h <b>${l(c)}</b></span>
    </div>
  `}function un(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const a=String(e.tokenMint||e.mint||"").trim();return a&&(e.isPump||a.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(a)}`:""}function Io(e={},t=""){const a=t||$a(e),r=Number(e.sniperCount||e.snipers||0),o=un(e);return`
    <div class="compact-link-row">
      <a href="${l(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${o?`<a href="${l(o)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${l(a)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(r)}</span>`:""}
    </div>
  `}function Qe(e={},t={}){const a=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(a)&&Number.isFinite(r)&&a!==r)return a-r;const o=Number(e.pairCreatedAt||0),s=Number(t.pairCreatedAt||0);return o||s?s-o:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function Jd(e=""){let t=0;for(let a=0;a<String(e).length;a+=1)t=(t<<5)-t+String(e).charCodeAt(a),t|=0;return Math.abs(t)}function ha(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function ga(e=""){const t=De();return[e,n.livePairBucket,n.terminalSort,ep(),t?.refreshCount||"",n.livePairsLastUpdatedByBucket[n.livePairBucket]||n.livePairsLastUpdatedAt||"",n.kolScan?.refreshCount||"",n.kolScan?.refreshedAt||n.kolLastUpdatedAt||""].join(":")}function ba(e=[],t=12,a="",r=0){const o=be(e||[]),s=Math.max(0,Number(t)||o.length);if(!s)return[];if(!a||o.length<=s)return o.slice(0,s);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,s-1),o.length),i=o.slice(0,c),u=o.slice(c);if(!u.length)return i.slice(0,s);const d=Jd(a)%u.length,p=[...u.slice(d),...u.slice(0,d)];return[...i,...p].slice(0,s)}function Yd(e=[],t=new Set){return(e||[]).filter(a=>{const r=ha(a);return!r||!t.has(r)})}function Qd(e={}){const t=ct(e),a=ut(e),r=pi(e),o=Xo(e),s=Ep(e),c=D(e.marketCapLabel,e.fdvLabel,t>0?B(t):"","checking"),i=D(e.liquidityLabel,a>0?B(a):"","checking"),u=D(e.volumeM15Label,r>0?B(r):"","checking"),d=D(e.volumeH1Label,e.volumeLabel,o>0?B(o):"","checking"),p=D(e.volumeH24Label,s>0?B(s):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${l(c)}</strong></span>
      <span><small>Liq</small><strong>${l(i)}</strong></span>
      <span><small>15m</small><strong>${l(u)}</strong></span>
      <span><small>1h</small><strong>${l(d)}</strong></span>
      <span><small>24h</small><strong>${l(p)}</strong></span>
    </div>
  `}function Zd(e,{source:t,actionLabel:a="Trade",isKolContext:r=!1}={}){const o=jo(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(t)}" title="Open chart and buy/sell panel">${l(a)}</button>
    <button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(t)}" title="Quick buy with preset or custom SOL amount">${l(ya())}</button>
    <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${l(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?od(e):""}
    <button type="button" class="watch-action" data-watched="${o}" title="${o?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Go(e)||"")}">${o?"Saved":"Watch"}</button>
    ${Gd(e,{compact:!0})}
  `}function Dv(e,t={}){const a=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ba(e||[],a,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,p)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${i?"is-kol-signal":""}" data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${dt(d,{priority:p<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-title">${l(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
                <small>${l(d.name||d.category||"Token")}</small>
                ${i?"":ui(d)}
                ${Rv(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${l(d.tokenMint)}">${l(w(d.tokenMint))}</button>
              <span class="terminal-token-age">${l(d.pairAgeLabel||Ht(d)||"age unknown")} | ${l(f)}</span>
              ${Io(d)}
            </div>
            ${Qd(d)}
            <div class="terminal-token-actions has-dev-info">
              ${Zd(d,{source:"terminal-row",actionLabel:r,isKolContext:i})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:I(o,s)}function wt(e,t={}){if(t.layout==="terminal")return Dv(e,t);const a=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=ba(e||[],a,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-row">
          ${dt(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-title">${l(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
              <small>${l(u.name||u.category||"Token")}</small>
              ${i?"":ui(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${l(u.tokenMint)}">${l(w(u.tokenMint))}</button>
            <span>${l(u.pairAgeLabel||Ht(u)||"age unknown")} | ${l(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${Wv(u)}
            ${Io(u)}
          </div>
          ${Ev(u)}
          <div class="compact-row-actions has-dev-info">
            ${Zd(u,{source:"compact-row",actionLabel:r,isKolContext:i})}
          </div>
        </article>
      `).join("")}
    </div>
  `:I(o,s)}function dn(e){const t=oe(e,e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId);if(!t)return"Custom / manual";const a=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&a.push(`Timer ${t.sellDelay}`),a.join(" | ")}function Fk(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${l(dn("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${ot("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${ot("bundle",n.selectedBundlePresetId)}
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
  `}function ur(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function X(e=n.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const a=t.indexOf(".");if(a!==-1&&(t=t.slice(0,a+1)+t.slice(a+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":ur(r)}function lt(){return oe("trade",n.selectedTradePresetId)}function Nv(){return oe("bundle",n.selectedBundlePresetId)}function qe(e=lt()){return X()||ur(e?.amountSol)}function _v(e=Nv()){return X()||ur(e?.amountSol)||"0.1"}const Xl=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Oo(e=""){return Xl.find(t=>t.id===e)||Xl[0]}function Jl(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function Uv(e=Oo()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,a=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${a} | ${r}`}function qv(e={},t=Oo()){const a=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:a?.percentGain?String(a.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:a?.sellPercent?String(a.sellPercent):t.sellPercent||"100"}}function Hv(e=""){if(ce(e)){const a=ie();return`${a?.provider||"Browser wallet"} ${a?.publicKey?w(a.publicKey):""}`.trim()}const t=n.wallets.find(a=>String(a.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Me(){return(!n.terminalLaunchFilters||typeof n.terminalLaunchFilters!="object")&&(n.terminalLaunchFilters={}),n.terminalLaunchFilters.socials=n.terminalLaunchFilters.socials||{},n.terminalLaunchFilters.quotes=n.terminalLaunchFilters.quotes||{},n.terminalLaunchFilters.audits=n.terminalLaunchFilters.audits||{},n.terminalLaunchFilters}function St(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(a=>String(a||"").trim().split(/\s+/)).map(a=>a.trim().toLowerCase()).filter(a=>!a||t.has(a)?!1:(t.add(a),!0)).slice(0,3)}function ep(e=Me()){const t=Object.keys(e.socials||{}).filter(o=>e.socials[o]).sort().join(","),a=Object.keys(e.quotes||{}).filter(o=>e.quotes[o]).sort().join(","),r=Object.keys(e.audits||{}).filter(o=>e.audits[o]).sort().join(",");return[St(e.keywords).join(","),St(e.excludeKeywords).join(","),t,a,r].join("|")}function pn(e=Me()){return!!ep(e).replace(/\|/g,"")}function Eo(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function Kv(e={},t=""){const a=Eo(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(a));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(a)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(a)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(a)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(a)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(a)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(a)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(a)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(a)):t==="minSocial"?r:!0}function Vv(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const a=Eo(e).toUpperCase();return a.includes("USDC")?"USDC":a.includes("USD1")?"USD1":a.includes("WSOL")||a.includes("SOL")?"WSOL":""}function Fo(e={},t=[]){const a=Eo(e);return t.some(r=>r.test(a))}function zv(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!Fo(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!Fo(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:Fo(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const a=O(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return a>0?a<=30:!Fo(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function mn(e=[],t=Me()){const a=be(e||[]);if(!pn(t))return a;const r=St(t.keywords),o=St(t.excludeKeywords),s=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),i=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return a.filter(u=>{const d=Eo(u);return!(r.length&&!r.some(p=>d.includes(p))||o.length&&o.some(p=>d.includes(p))||s.some(p=>!Kv(u,p))||c.length&&!c.includes(Vv(u))||i.some(p=>!zv(u,p)))})}function Yl(e=[],t=[]){const a=Me();if(!pn(a))return"";const r=St(a.keywords),o=St(a.excludeKeywords),s=[];r.length&&s.push(`watching ${r.map(i=>`"${i}"`).join(", ")}`),o.length&&s.push(`excluding ${o.map(i=>`"${i}"`).join(", ")}`);const c=Math.max(0,be(e).length-be(t).length);return`<div class="terminal-launch-filter-summary">${l(s.join(" | ")||"filters active")} - ${l(t.length)}/${l(be(e).length)} visible${c?`, ${l(c)} hidden`:""}</div>`}function dr(e=[],t="pairs"){const a=Me(),r=St(a.keywords),o=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",s=be(e).length;return I("Watching fresh launches",s?`No ${t} match ${o} yet. ${s} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${o}.`)}function Ql(e="terminal",t={}){const a=Me(),r=pn(a),o=!!(a.open||r),s=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):s;return`
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
            <input data-terminal-filter-field="keywords" type="text" autocomplete="off" placeholder="cook, broscook, ogre" value="${l(a.keywords||"")}">
          </label>
          <label class="wide">
            Exclude keywords (max 3)
            <input data-terminal-filter-field="excludeKeywords" type="text" autocomplete="off" placeholder="test, fake, old" value="${l(a.excludeKeywords||"")}">
          </label>
          <fieldset>
            <legend>Socials</legend>
            ${nf.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${l(i)}" ${a.socials?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${rf.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${l(i)}" ${a.quotes?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${of.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-audit="${l(i)}" ${a.audits?.[i]?"checked":""}> ${l(u)}</label>
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
  `}function tp(){Ir&&window.clearTimeout(Ir),Ir=window.setTimeout(()=>{Ir=null,Z("live"),Z("launch"),Z("sniper"),h()},180)}function Wo(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const o=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-o)/1e3))}const a=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return a&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const jv=100,Gv=7200,Xv=75e4,Jv=86400,Yv=2e6,Qv=28e3,ap=18e4,Zv=16e4;function np(){const e=Kd();return be([...n.livePairs?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1d?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[]]).map(t=>zd(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!sr(t))}function fn(e={}){return O(e.marketCap,e.fdv)}function rp(e={}){return O(e.liquidityUsd)}function op(e={}){return O(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function Zl(e={}){if(hn(e))return!1;const t=Wo(e);return!Number.isFinite(t)||t<0||t>Gv||fn(e)>Xv?!1:Ut(e)<70}function Do(e={}){if(hn(e))return!1;const t=Ut(e),a=fn(e),r=a>=Qv&&a<=ap;return t>=55&&(!a||a<=ap)||r}function sp(e={}){if(Zl(e)||Do(e)||hn(e))return!1;const t=Wo(e);return Number.isFinite(t)&&(t<0||t>Jv)||fn(e)>Yv?!1:rp(e)>0||op(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function lp(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Ut(e={}){const t=O(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const a=fn(e),r=lp(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&a>0?Math.max(1,Math.min(99,a/69e3*100)):0}function hn(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=lp(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const a=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=fn(e);return a&&r>=Zv?!0:!!(a&&/\b(raydium|meteora|orca)\b/.test(t))}function No(e={}){if(hn(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":Do(e)||t==="graduating"?"graduating":Zl(e)?"new":(t==="steady"||t==="unknown"||sp(e),"steady")}function ip(e={}){const t=Number(e.bestPickScore||e.score||0),a=op(e),r=rp(e),o=fn(e),s=Wo(e),c=Number.isFinite(s)?Math.max(0,86400-s)/86400:0;return t*1e3+Math.log10(a+1)*160+Math.log10(r+1)*120+Math.log10(o+1)*80+c*100}function cp(e=[]){return[...e].sort((t,a)=>ip(a)-ip(t)||Qe(t,a))}function ew(e=[],t=[],a=jv){const r=new Set,o=[];for(const s of[...e,...t]){const c=String(s?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),o.push(s),o.length>=a))break}return o}function up(e=n.slimeScopeMode){const t=np(),a=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(i=>No(i)===a),o=t.filter(i=>{const u=No(i);return a==="graduated"?u==="graduated"||hn(i):a==="graduating"?u==="graduating"||Do(i):a==="steady"?u==="steady"||sp(i):u==="new"||Zl(i)}),s=a==="new"?[...r].sort(Qe):cp(r),c=a==="new"?be(o).sort(Qe):cp(o);return ew(s,c)}function tw(e=[],t="new"){const a=at(`slimeScope:${t}`,e).slice(0,12);return a.length?a.map((r,o)=>{const s=r.pairAgeLabel||Ht(r)||"age ?",c=D(r.marketCapLabel,r.fdvLabel,B(ct(r)),"checking"),i=D(r.liquidityLabel,B(ut(r)),"checking"),u=D(r.volumeM15Label,B(pi(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${l(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${dt(r,{priority:o<4})}
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
        <button type="button" data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${l(qe()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${l(t)} pairs.</div>`}function aw(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,a,r])=>{const o=up(t);return`
          <section class="slime-scope-column" data-scope-column="${l(t)}">
            <header>
              <div>
                <h4>${l(a)}</h4>
                <small>${l(r)}</small>
              </div>
              <span>${l(o.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${tw(o,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function nw(){const e=Bp(),[,,t]=e,a=Ec(n.slimeScopeMode),o=!!(z("slimeScope").inFlight||n.livePairsLoadingByBucket?.[a]),s=n.livePairsRefreshErrorByBucket?.[a],c=be(Rp(np(),e[0])),i=at("slimeScope",c),u=i.length?Gn()?it(i,{context:"live",shareBuilder:$a,hideToolbar:!0}):wt(i,{layout:"terminal",limit:Math.max(1,i.length),actionLabel:"Trade"}):s?I("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):o?I("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):I("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${Ww(e)}<span>${l(t)}</span></div>
        ${Ip(c.length,ia())}
        ${Nu("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${o?"disabled":""}>${o?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${la("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${aw()}
    </section>
  `}function Wk(){const e=De(),t=be(e?.rows||[]),a=mn(t),r=[...a].sort(Qe),o=Vd(n.kolScan?.rows||[]).filter(C=>!sr(C)),s=mn(o),c=ir(t,o),i=mn(c),u=pn(),d=ba(i,8,ga("best-picks"),2),p=new Set(d.map(ha).filter(Boolean)),f=Yd(r,p),y=ba(f.length?f:r,12,ga("live-pairs"),0),g=new Set([...p,...y.map(ha).filter(Boolean)]),S=Yd(s,g),P=ba(S.length?S:s,12,ga("kol-signals"),1),T=!!n.livePairsLoadingByBucket[n.livePairBucket],b=ia(),A="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${T?"Refreshing":"Live"}${b?` | ${l(qn(Ja(b)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${xt.map(([C,M])=>{const q=n.livePairsByBucket[C]?.rows?.length,J=Number.isFinite(Number(q))?` (${q})`:"";return`<button data-live-pair-bucket="${C}" data-active="${n.livePairBucket===C}">${M}${J}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${af.map(([C,M])=>`<option value="${C}" ${n.terminalSort===C?"selected":""}>${M}</option>`).join("")}
            </select>
          </label>
          ${Nu("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${T?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${Ql("terminal",{rawCount:t.length,visibleCount:a.length})}
        ${Yl(t,a)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?wt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?dr(c,"best picks"):wt(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?wt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A}):u?dr(t,"live pairs"):wt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${n.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?wt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?dr(o,"KOL signals"):wt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${$w()}
      </main>
    </section>
  `}function Dk(){const e=lt();if(!e)return"Trade";const t=qe(e);return t?`Buy ${t} SOL`:Sm(e,"Trade")}function ya(){const e=lt(),t=qe(e);return t?`Buy ${t} SOL`:"Quick Buy"}function _o(){const e=ya();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{v(t,e)})}function va(e=""){const t=String(e||"").trim();if(!t)return null;const a=or().find(o=>String(o?.tokenMint||o?.mint||o?.tokenAddress||"").trim()===t);if(a)return a;const r=n.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:Q(t)}}function rw(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function ow(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function dp(e={}){if(!_("slimeShieldEnabled",!0))return"";const t=Ye(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${l(cn(r))}">
      <header>
        <div>
          <strong>SlimeShield</strong>
          <small>Pre-trade risk read</small>
        </div>
        <span class="slimeshield-verdict">${l(r)}</span>
      </header>
      <p>${l(t.summary||"SlimeShield is warming up. Trade carefully.")}</p>
      <div class="slimeshield-actions">
        <button type="button" data-slimeshield-details="${l(a)}">Details</button>
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(a)}" data-protected-buy-preset="${l(t.protectedBuyPreset||Jl(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function pp(e=[],t="risk",a="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(o=>t==="positive"?o.severity==="positive":o.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(o=>`
        <li>
          <strong>${l(o.label||o.key||"Signal")}</strong>
          <span>${l(o.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(a)}</p>`}function mp(e=""){const t=String(e||n.smartChartToken||n.tradeToken||"").trim();!t||!_("slimeShieldEnabled",!0)||(n.slimeShieldDetails={open:!0,tokenMint:t},n.slimeShieldStatus="",Na(),Sa(),Uo(t,{force:!0}),_("replayBeforeBuyEnabled",!0)&&ni(t,{force:!0}))}function ei(){n.slimeShieldDetails={open:!1,tokenMint:""},n.slimeShieldStatus="",Sa(),Or()}async function Uo(e="",t={}){const a=String(e||"").trim();if(!a||!_("slimeShieldEnabled",!0))return null;if(!t.force&&n.slimeShieldResults?.[a])return n.slimeShieldResults[a];if(n.slimeShieldLoading?.[a])return null;n.slimeShieldLoading={...n.slimeShieldLoading||{},[a]:!0},Sa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const s=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return s&&(n.slimeShieldResults={...n.slimeShieldResults||{},[a]:s},ne(s.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),n.slimeShieldStatus=s.cacheHit?"Loaded from cache.":"Updated from local data."),s}catch(r){return n.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...n.slimeShieldLoading||{}};delete r[a],n.slimeShieldLoading=r,Sa()}}function sw(e=""){const t=va(e)||ln(e)||{tokenMint:e},a=cr(t),r=a.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",o=[...Array.isArray(a.externalLinks)?a.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||Q(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:mint?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(mint)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((s,c,i)=>/^https?:\/\//i.test(String(s.url||""))&&i.findIndex(u=>String(u.url||"")===String(s.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:a.likelyDevWallet||null,confidence:a.confidence||"unknown",status:fa(a.status),label:a.label||Ro(a.status),score:50,summary:a.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:a.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:a.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:a.updatedAt||new Date().toISOString(),externalLinks:o,dataSource:"ui-fallback"}}function fp(e=""){const t=String(e||"").trim();return n.devInfoResults?.[t]||sw(t)}function pr(e,t=""){const a=Number(e);return Number.isFinite(a)?`${Math.round(a*10)/10}${t}`:"n/a"}function hp(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function qo(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function lw(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function gp(e="",t={}){const a=String(e||"").trim();if(!a||!_("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoSummaries?.[a])return n.devInfoSummaries[a];const r=`summary:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0};try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(a)}${o}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(n.devInfoSummaries={...n.devInfoSummaries||{},[a]:c},ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const o={...n.devInfoLoading||{}};delete o[r],n.devInfoLoading=o,t.silent||wa()}}async function bp(e="",t={}){const a=String(e||"").trim();if(!a||!_("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoResults?.[a])return n.devInfoResults[a];const r=`details:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0},wa();try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(a)}${o}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(n.devInfoResults={...n.devInfoResults||{},[a]:c},n.devInfoSummaries={...n.devInfoSummaries||{},[a]:{mint:a,status:c.status||"unknown",label:c.label||Ro(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},n.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",ne(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(o){return n.devInfoStatus=o?.message||"Dev Info is temporarily unavailable.",null}finally{const o={...n.devInfoLoading||{}};delete o[r],n.devInfoLoading=o,wa()}}function iw(e=""){const t=String(e||"").trim();!t||!_("devInfoEnabled",!0)||(n.devInfoDetails={open:!0,tokenMint:t},n.devInfoStatus="",Na(),wa(),gp(t,{force:!0,silent:!0}),bp(t,{force:!0}))}function ti(){n.devInfoDetails={open:!1,tokenMint:""},n.devInfoStatus="",wa(),Or()}function cw(e="render"){!_("devInfoEnabled",!0)||Is||n.route==="terminal"&&(Is=window.setTimeout(()=>{Is=null,uw(e)},300))}async function uw(e="render"){if(!_("devInfoEnabled",!0)||Da())return;const t=rr().slice(0,16),a=[],r=new Set;for(const o of t){const s=String(o.tokenMint||o.mint||o.tokenAddress||"").trim();if(!(!s||r.has(s)||n.devInfoSummaries?.[s]||n.devInfoLoading?.[`summary:${s}`])&&(r.add(s),a.push(s),a.length>=8))break}a.length&&(await Promise.allSettled(a.map(o=>gp(o,{silent:!0}))),W({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:a.length,details:e}),Da()||_a("dev-info-prefetch"))}function Ho(e=[],t="No strong cached signal yet."){const a=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return a.length?`
    <ul class="slimeshield-factor-list">
      ${a.map(r=>`<li><span>${l(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(t)}</p>`}function Ko(e,t="Not cached yet"){const a=String(e||"").trim();return!a||a.toLowerCase()==="warming"||a.toLowerCase()==="checking"?t:a}function Vo(e,t=r=>String(r),a="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):a}function mr(e,t,a=""){if(e.__lastDrawerHtml===t)return!1;const r=a?e.querySelector(a):null,o=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,a&&o){const s=e.querySelector(a);s&&(s.scrollTop=o)}return!0}function wa(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=n.devInfoDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",a),!a||!_("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=va(r)||ln(r)||{tokenMint:r},s=fp(r),c=n.devInfoSummaries?.[r]||cr(o),i=fa(s.status||c.status),u=s.confidence||c.confidence||"unknown",d=!!n.devInfoLoading?.[`details:${r}`],p=s.likelyDevWallet||c.likelyDevWallet||"",f=s.currentPosition||null,y=s.historicalStats||{},g=s.linkedWalletSignals||{},S=s.marketContext||{},P=s.sourceHydration||{},T=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,8):[],b=O(S.marketCap,o.marketCap,o.fdv),A=O(S.liquidityUsd,o.liquidityUsd),C=O(S.volume5m,o.volume5m,o.volumeM5),M=O(S.volumeH1,o.volumeH1,o.volume1h),q=O(S.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),J=S.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",Se=S.mintAuthority||o.mintAuthority||"",Ze=S.freezeAuthority||o.freezeAuthority||"",U=!!(S.heliusDasIndexedAt||S.heliusDasSource||o.heliusDasSource||J||Se||Ze),We=[...Array.isArray(s.externalLinks)?s.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:o.dexUrl||Q(r)},{label:"Solscan Wallet",url:p?`https://solscan.io/account/${encodeURIComponent(p)}`:""},{label:"KOLscan Wallet",url:p?`https://kolscan.io/account/${encodeURIComponent(p)}`:""},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"X",url:o.twitterUrl||o.xUrl},{label:"TG",url:o.telegramUrl},{label:"Website",url:o.websiteUrl}].filter((de,ps,ms)=>/^https?:\/\//i.test(String(de.url||""))&&ms.findIndex(vn=>String(vn.url||"")===String(de.url||""))===ps).slice(0,8),Gt=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],At=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${l(Ro(i))} · ${l(hp(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${l(i)}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${l(we(s.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${l(lw(p))}</dd></div>
          <div><dt>Confidence</dt><dd>${l(hp(u))}</dd></div>
          <div><dt>Source</dt><dd>${l(s.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${l(w(s.pairAddress||o.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${p?`<button type="button" data-copy="${l(p)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${l(r)}">Copy CA</button>
          ${p&&n.user?`<button type="button" data-dev-watch="${l(p)}">${n.devWatch?.[p]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${We.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${We.map(de=>`<a href="${l(de.url)}" target="_blank" rel="noreferrer">${l(de.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${l(Vo(b,B))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Vo(A,B))}</dd></div>
          <div><dt>5m volume</dt><dd>${l(Vo(C,B))}</dd></div>
          <div><dt>1h volume</dt><dd>${l(Vo(M,B))}</dd></div>
          <div><dt>Pair age</dt><dd>${l(Number.isFinite(q)?qo(q):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(J?w(J):U?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${Se?w(Se):U?"none":"not indexed"} / ${Ze?w(Ze):U?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(S.source||s.cacheSource||s.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${l(P.message)}${P.eventsStored?` · ${l(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${Ho(T,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${l(pr(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${l(pr(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${l(pr(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${l(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${l(qo(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${l(f.lastSellAt?we(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||Gt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${l(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${l(qo(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${l(pr(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${l(pr(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${Gt.length?`
          <ul class="dev-info-launches">
            ${Gt.map(de=>`<li><span>${l(de.symbol||w(de.mint||""))}</span><small>${l(de.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(s.riskReasons)&&s.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${Ho(s.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(s.positiveReasons)&&s.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${Ho(s.positiveReasons,"")}
      </section>`:""}
      ${g.linkedWalletCount||Array.isArray(g.notes)&&g.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${l(g.linkedWalletCount?`${g.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${Ho(g.notes,"")}
      </section>`:""}
      ${(()=>{const de=[f?"":"dev position",Number(y.launchesTracked)>0||Gt.length?"":"launch history",!(s.riskReasons||[]).length&&!(s.positiveReasons||[]).length?"behavior signals":"",!g.linkedWalletCount&&!(g.notes||[]).length?"linked wallets":""].filter(Boolean);return de.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${l(de.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(s.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${l(r)}" data-watch-symbol="${l(o.symbol||"")}" data-watch-name="${l(o.name||"")}" data-watch-image="${l(Go(o)||"")}">${jo(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${l(r)}">Open SlimeShield</button>
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${l(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${n.devInfoStatus?`<small class="slimeshield-status">${l(n.devInfoStatus)}</small>`:""}
    </aside>
  `;mr(e,At,".dev-info-drawer")}function yp(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function ai(e=""){const t=String(e||"").trim();return n.replayResults?.[t]||yp(t)}function gn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function dw(e=""){if(!_("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const a=ai(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${l(a.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(gn(a.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(gn(a.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${l(a.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function ni(e="",t={}){const a=String(e||"").trim();if(!a||!_("replayBeforeBuyEnabled",!0))return null;if(!t.force&&n.replayResults?.[a])return n.replayResults[a];if(n.replayLoading?.[a])return null;n.replayLoading={...n.replayLoading||{},[a]:!0},fr(),Sa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const s=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return s&&(n.replayResults={...n.replayResults||{},[a]:s},ne(s.cacheHit?"replayCacheHit":"replayCacheMiss")),s}catch{return n.replayResults={...n.replayResults||{},[a]:yp(a)},null}finally{const r={...n.replayLoading||{}};delete r[a],n.replayLoading=r,fr(),Sa()}}function pw(e=""){const t=String(e||"").trim();!t||!_("replayBeforeBuyEnabled",!0)||(n.replayDetails={open:!0,tokenMint:t},Na(),fr(),ni(t))}function ri(){n.replayDetails={open:!1,tokenMint:""},fr(),Or()}function fr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=n.replayDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",a),!a||!_("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ai(r),s=!!n.replayLoading?.[r],c=`
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
        <small>${s?"Updating...":`Confidence: ${l(o.confidence||"low")} · Updated ${l(we(o.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${l(o.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l(gn(o.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${l(gn(o.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l(gn(o.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${l(gn(o.failRatePercent))}</dd></div>
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
  `;mr(e,c,".replay-drawer")}function Sa(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=n.slimeShieldDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",a),!a||!_("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=va(r)||{tokenMint:r},s=n.slimeShieldResults?.[r]||Ye(o),c=s.verdict||"CAUTION",i=s.sourceHydration||{},u=s.marketContext||{},d=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,6):[],p=!!n.slimeShieldLoading?.[r],f=Array.isArray(s.factors)?s.factors:[],y=O(u.marketCap,o.marketCap,o.fdv),g=O(u.liquidityUsd,o.liquidityUsd),S=O(u.volumeH1,o.volumeH1,o.volume1h),P=O(u.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),T=u.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",b=u.mintAuthority||o.mintAuthority||"",A=u.freezeAuthority||o.freezeAuthority||"",C=!!(u.heliusDasIndexedAt||u.heliusDasSource||o.heliusDasSource||T||b||A),M=s.devInfoSummary||cr(o),q=fa(M.status),J=[...Array.isArray(s.externalLinks)?s.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||o.dexUrl||Q(r)},{label:"Pump",url:u.pumpUrl||un(o)},{label:"X",url:u.twitterUrl||o.twitterUrl||o.xUrl},{label:"TG",url:u.telegramUrl||o.telegramUrl},{label:"Web",url:u.websiteUrl||o.websiteUrl}].filter((U,We,Gt)=>/^https?:\/\//i.test(String(U.url||""))&&Gt.findIndex(At=>String(At.url||"")===String(U.url||""))===We),Se=[...Array.isArray(o.riskFlags)?o.riskFlags:[],...Array.isArray(o.scoreWarnings)?o.scoreWarnings:[],...Array.isArray(o.bestPickWarnings)?o.bestPickWarnings:[]].filter(Boolean).slice(0,4),Ze=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${l(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${l(cn(c))}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${l(s.confidence||"low")}</span>
          <span>Score: ${l(Number.isFinite(Number(s.score))?`${Math.round(Number(s.score))}/100`:"n/a")}</span>
          <span>${p?"Updating...":`Updated ${l(we(s.updatedAt))}`}</span>
        </div>
      </section>
      <section>
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${l(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${l(Number.isFinite(P)?qo(P):Ko(o.pairAgeLabel||Ht(o),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Number.isFinite(g)&&g>0?B(g):Ko(o.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${l(Number.isFinite(y)&&y>0?B(y):Ko(o.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${l(Number.isFinite(S)&&S>0?B(S):Ko(o.volumeH1Label||o.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${l(Ro(q))} · ${l(M.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(T?w(T):C?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${b?w(b):C?"none":"not indexed"} / ${A?w(A):C?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(u.source||s.cacheSource||s.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${l(Se.length?Se.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${J.map(U=>`<a href="${l(U.url)}" target="_blank" rel="noreferrer">${l(U.label)}</a>`).join("")}
          ${_("devInfoEnabled",!0)?`<button type="button" data-dev-info="${l(r)}">Open Dev Info</button>`:""}
        </div>
        ${i.message?`<p class="slimeshield-muted">Source refresh: ${l(i.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(U=>`<li><span>${l(U)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${pp(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${pp(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(rw(s.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${l(ow(s.protectedBuyPreset))}</small>
      </section>
      ${dw(r)}
      <div class="slimeshield-drawer-actions">
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-preset="${l(s.protectedBuyPreset||Jl(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${l(r)}" ${p?"disabled":""}>${p?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${l(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${n.slimeShieldStatus?`<small class="slimeshield-status">${l(n.slimeShieldStatus)}</small>`:""}
    </aside>
  `;mr(e,Ze,".slimeshield-drawer")}function oi(e){const t=e==="bundle"?"bundle":"trade";n.activeTab=t,t==="trade"&&(n.editingTradePresetId=""),t==="bundle"&&(n.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function Nk(e){if(!e?.tokenMint)return I("No token selected","Click any row to preview it here without leaving the live feeds.");const t=nt().some(a=>String(a.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${dt(e)}
      <div>
        <strong>${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
        <small>${l(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${l(e.pairAgeLabel||Ht(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${l(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${l(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${l(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${_("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${l(_("slimeShieldEnabled",!0)?Ye(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${dp(e)}
    <div class="card-actions compact">
      <a href="${l(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${un(e)?`<a href="${l(un(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="token-preview">${l(ya())}</button>
      <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function _k(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([a,r])=>`<button type="button" data-smart-chart-view="${a}" data-active="${e===a}">${r}</button>`).join("")}
    </div>
  `}function mw(e=""){const t=String(e||"").trim();return t?(n.pnl?.trades||[]).filter(a=>String(a?.tokenMint||a?.mint||"").trim()===t):[]}function Uk(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=mw(a),o=!!(un(e)&&Wl(e)),s=o?un(e):e.dexUrl||Q(Fd(e)||a),c=o?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${l(c)} Transactions</h4>
          <p>Live market activity from ${l(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${l(s)}" target="_blank" rel="noreferrer">Open ${l(c)} Feed</a>
      </div>
      ${jl(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${li(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function qk(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=wm(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${l(e.symbol||w(a))}.</p>
        </div>
      </div>
      ${jl(e,"info")}
      ${Qd(e)}
      ${dp(e)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${l(r)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${l(a)}">${l(w(a))}</button></dd></div>
        <div><dt>Position</dt><dd>${t?"Held":"None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${l(e.source||e.category||e.dexId||"market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${Io(e)}
      </div>
    </section>
  `}function fw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=n.chartTradeTab==="sell"?"sell":"buy",o=ie(),s=n.wallets?.length?String(n.wallets[0]?.index||""):"",c=fd(),i=lt(),u=i?.walletIndex||(i?.walletIndexes||[])[0]||"",d=o?.publicKey&&hd(o)?"connected":"",p=n.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||s||(o?.publicKey?"connected":""),f=ce(p),y=n.quickBuyAmountOverride||qe(i)||"",g=i?dn("trade"):"No preset / manual",S=String(i?.slippageBps||"400"),P=String(i?.takeProfitPct||"25"),T=String(i?.stopLossPct||"8"),b=String(i?.sellDelay||"off"),A=String(i?.sellPercent||"100"),C=new Set(["300","400","500"]),M=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,q=t?`${l(t.uiAmount||"Position")} tokens | ${l(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${tn(p)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${l(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(J=>`<button type="button" data-chart-buy-preset="${J}">${J} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${ot("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <small class="chart-preset-summary">${l(g)}</small>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300" ${S==="300"?"selected":""}>3%</option>
              <option value="400" ${S==="400"?"selected":""}>4%</option>
              <option value="500" ${S==="500"?"selected":""}>5%</option>
              ${C.has(S)?"":`<option value="${l(S)}" selected>${l(M)}</option>`}
            </select>
          </label>
          <div class="chart-auto-exit-grid" aria-label="Chart buy exit settings">
            <label>
              Take Profit
              ${Nt({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${Nt({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Ge("chart-buy-delay","data-chart-buy-delay",b)}
            </label>
            <label>
              Exit Size
              ${Nt({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:A,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${l(o?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:s?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${l(a)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${l(n.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${q}</p>
          <div class="quick-grid">
            <button type="button" data-position-sell="${l(a)}" data-position-sell-percent="25" ${t?"":"disabled"}>Sell 25%</button>
            <button type="button" data-position-sell="${l(a)}" data-position-sell-percent="50" ${t?"":"disabled"}>Sell 50%</button>
            <button type="button" class="danger" data-position-sell="${l(a)}" data-position-sell-percent="100" ${t?"":"disabled"}>Sell 100%</button>
          </div>
          <label>
            Custom sell %
            <input data-chart-sell-percent type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="100" ${t?"":"disabled"}>
          </label>
          <button type="button" data-chart-confirm-sell="${l(a)}" ${t?"":"disabled"}>Confirm Custom Sell</button>
        </div>
      `}
    </div>
  `}function Hk(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim();return a?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${l(a)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${_("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(a)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function hw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=ct(e),o=ut(e),s=y=>{const g=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(g)?"":g},c=D(r>0?B(r):"",s(e.marketCapLabel),s(e.fdvLabel),"checking"),i=D(o>0?B(o):"",s(e.liquidityLabel),"checking"),u=D(Number(e.volumeH1)>0?B(e.volumeH1):"",s(e.volumeH1Label),s(e.volumeLabel),"checking"),d=D(Number(e.volumeH24)>0?B(e.volumeH24):"",s(e.volumeH24Label),"checking"),p=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,g=Number(e.h1);return o>0&&o<5e3?"Thin exit":Number.isFinite(g)&&g>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(g)||g>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&o>0?"Clean setup":""})(),f=t?"Position held":p||(Wl(e)?"Pump curve":D(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${l(w(a))}</strong></span>
      <span><small>MC / FDV</small><strong>${l(c)}</strong></span>
      <span><small>LIQ</small><strong>${l(i)}</strong></span>
      <span><small>1H</small><strong>${l(u)}</strong></span>
      <span><small>24H</small><strong>${l(d)}</strong></span>
      <span><small>Status</small><strong>${l(f)}</strong></span>
    </div>
  `}function gw(){try{return bw()}catch(e){console.error("Smart Chart render failed:",e);const t=String(n.smartChartToken||n.tradeToken||n.terminalToken||"").trim(),a=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
              <strong>${l(a)}</strong>
              <small>Recovered chart view</small>
              ${t?`<button type="button" class="ca-copy" data-copy="${l(t)}">${l(a)}</button>`:""}
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
          `:I("Paste a token CA","Open a token from Live Terminal or paste a CA above.")}
          <small class="score-breakdown">Fallback chart kept the page alive after a display error. Reopen the CA to refresh the full SlimeWire chart shell.</small>
        </article>
      </section>
    `}}function bw(){const e=xo(),t=String(e?.tokenMint||"").trim(),a=t?nt().find(s=>String(s.tokenMint)===t):null,r=t?be([e,...rr().filter(s=>String(s.tokenMint||"")===t)]).filter(Boolean).slice(0,5):ba(ir(),5,ga("smart-chart-suggest"),1);if(!t)return`
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
          ${wt(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:ga("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;na("tokenHeaderRendered"),na("chartSkeletonRendered"),na("buyPanelReady"),W({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(Je(t)?.cacheHit||lr(t)?.pairAddress),stale:!!Je(t)?.stale,details:t});const o=e.symbol||e.shortMint||w(t);return`
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
          ${(()=>{yw(t);const s=vp(t);return s?`<div class="coin-banner-hero" style="background-image:url('${s}')" role="img" aria-label="Coin banner"></div>`:""})()}
          <div class="smart-chart-token-header smart-chart-clean-token-header${vp(t)?" has-banner":""}">
            ${dt(e)}
            <div>
              <strong>${l(o)}</strong>
              <small>${l(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${l(t)}">${l(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${Io(e)}
            </div>
          </div>
          ${hw(e,a)}
          ${jl(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${l(o)}</h3>
          ${fw(e,a)}
        </aside>
      </div>
      ${ww(t)}
    </section>
  `}function vp(e){const t=String(e||"").trim();return n.coinBanners&&n.coinBanners[t]||""}let wp="";function yw(e){const t=String(e||"").trim();!t||wp===t||(wp=t,k(`/api/web/coin-banner?mint=${encodeURIComponent(t)}`).then(a=>{const r=String(a?.bannerUri||"");r&&(n.coinBanners=n.coinBanners||{},n.coinBanners[t]=rt(r),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0}))}).catch(()=>{}))}let si="",Sp=0;function kp(e){e&&(si===e&&Date.now()-Sp<3e4||(si=e,Sp=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{n.chartCalls={mint:e,...t},n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function vw(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[a,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${a} ${r}`}function ww(e){kp(e);const t=n.chartCalls?.mint===e?n.chartCalls:null,a=t?.calls||[],r=!!(n.token&&n.user);return`
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
      ${a.length?`
        <div class="table-list compact-table">
          ${a.map(o=>`
            <article class="row-card">
              <div class="row-main">
                <strong>${l(vw(o.side))} <span class="muted-text">by ${l(o.handle)}</span>
                  ${o.reputation?.wins?`<span class="positive">${l(String(o.reputation.wins))}W${o.reputation.hitRatePct!=null?` ${l(String(o.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${o.entryMcUsd?`Entry MC ${l(B(o.entryMcUsd))} | `:""}${o.targetX?`Target ${l(String(o.targetX))}x | `:""}${o.shieldVerdict?`Shield ${l(o.shieldVerdict)} ${l(String(o.shieldScore??""))} | `:""}${l(we(o.createdAt))}</span>
                ${o.note?`<small>${l(o.note)}</small>`:""}
                ${o.status==="resolved"?`<small class="${o.outcome==="won"?"positive":"negative"}">${o.outcome==="won"?`✅ hit ${l(String(o.peakX))}x`:l(o.outcome)}</small>`:o.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${l(o.mint)}" data-quick-buy-source="call-board">${l(ya())}</button>
                <button data-watch-token="${l(o.mint)}" data-watch-symbol="${l(o.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${l(Ha(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${je(`$${n.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function Sw(e){const t=m("[data-call-status]");try{const a=m("[data-call-side]")?.value||"bullish",r=m("[data-call-target]")?.value||"",o=m("[data-call-note]")?.value||"";v(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:a,targetX:r,note:o,source:"site"})}),v(t,"Call posted - it is now being tracked."),si="",kp(e)}catch(a){v(t,N(a?.message||"Could not post call."))}}function kw(e,t=!1){const a=e?.tokenMint?n.positions.find(s=>String(s.tokenMint)===String(e.tokenMint)):null,r=dn("trade"),o=dn("bundle");return t?`
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
                ${ot("trade",n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${ot("bundle",n.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${Ot().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${l(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${l(ya())}</button>
              <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
              <button data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
              <button data-use-token-volume="${l(e.tokenMint)}">Volume</button>
              <button data-tab="sniper">Snipe</button>
            </div>
            ${a?`
              <div class="exit-strip">
                <strong>Position held</strong>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
                <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
              </div>
            `:""}
          `:I("No token selected","Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${l(zr())}</small>
        </div>
    </article>
  `}function $w(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,a])=>`<button data-terminal-subtab="${t}" data-active="${n.terminalSubtab===t}">${a}</button>`).join("")}
      </div>
      ${Tw()}
    </section>
  `}function Tw(){if(n.terminalSubtab==="orders")return Ap();if(n.terminalSubtab==="history")return li(12);if(n.terminalSubtab==="wallets")return Od();if(n.terminalSubtab==="kol"){const e=Vd(n.kolScan?.rows||[]).filter(t=>!sr(t));return wt(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:ga("bottom-kol"),stickyCount:1})}return n.terminalSubtab==="sniper"?n.scan?it(n.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):I("No sniper scan loaded","Open Sniper or refresh a scan mode."):n.terminalSubtab==="tx"?Cp(!0):n.terminalSubtab==="reconcile"?Pp():Aw(6)}function Aw(e=25){const t=nt();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(Tp).join("")}
    </div>
  `:I("No open positions","Open token holdings will show here after refresh.")}const $p=new Map;function Pw(e){const t=String(e.tokenMint||"");if(!t)return"";const a=(n.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=or().find(d=>String(d?.tokenMint||"")===t),o=(Array.isArray(n.tradePlans)?n.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),s=[];a?.spentSol&&s.push(`Entry ${a.spentSol} SOL`),r?.marketCapLabel&&s.push(`MC ${r.marketCapLabel}`),s.push(o?`TP ${o.takeProfitSummary||o.takeProfitPct||"off"} / SL ${o.stopLossSummary||o.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let i="";if(Number.isFinite(c)){const d=$p.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const p=c-d.value;i=`${p>0?"▲ +":"▼ "}${p.toFixed(4)} SOL since last refresh`}$p.set(t,{value:c,at:Date.now()})}let u="";if(o){const d=Number(o.lastMovePct??o.wallets?.[0]?.lastMovePct),p=Number(o.takeProfitPct),f=Number(o.stopLossPct),y=Date.parse(o.sellAfterAt||o.wallets?.[0]?.sellAfterAt||""),g=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(p)&&p>0&&d>=p*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${p}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:g!==null&&g>0&&g<=10?u=`Timer exit in ~${g} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else Cb(t)||e.source==="launch-optimistic"?u="⏳ Exits arming from your launch - TP/SL/timer registering...":u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${l(s.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${l(u)}</small>`:""}
    ${i?`<small class="${i.startsWith("▲")?"positive":"negative"}">${l(i)}</small>`:""}
  `}function Tp(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",a=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),o=!!(e.viewOnly||e.source==="connected-wallet"),s=t?`${e.estimatedValueSol} SOL`:r?"updating":o?"tracking":"Price unavailable",c=a?e.openPnlSol:r?"updating":o?"realized only":"Price unavailable",i=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:o&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${dt(e)}
      <div class="row-main">
        <strong>${l(e.symbol||e.shortMint)}</strong>
        <span>${l(e.uiAmount)} tokens across ${l(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${l(e.name)}</small>`:""}
        <small>Value: ${l(s)} | PnL: ${l(c)}</small>
        ${Pw(e)}
        ${i?`<small class="${r?"muted-text":"warning-text"}">${l(i)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${l(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${l(e.tokenMint)}">Custom %</button>
        ${je(ug(e))}
        <a href="${l(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function li(e=10,t=null){const a=Array.isArray(t)?t:n.pnl?.trades||[];return a.length?`
    <div class="live-trade-list">
      ${a.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${l(String(r.type||"").toUpperCase())} ${l(r.shortMint||w(r.tokenMint))}</strong>
          <span>${l(r.walletLabel||"wallet")} | ${l(r.solAmount||"0")} SOL</span>
          <small>${l(we(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${l(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="live-trades">${l(ya())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:I("No live trade history yet","Submitted web trades will appear here after refresh.")}function Cw(){const e=n.pnl?.trades||[],t=at("liveTrades",e);return`
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
        ${li(t.length||Ga("liveTrades"),t)}
        ${la("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${kw(Ed())}
      </aside>
    </section>
  `}function Ap(){const e=Array.isArray(n.tradePlans)?n.tradePlans:[],t=[n.tradePlanResult,n.bundleResult,n.volumeResult,n.sniperResult,n.kolResult,n.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),a=e.length?e:t;return a.length?`
    <div class="table-list compact-table">
      ${a.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${l(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${l(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${l(r.status||"watching")} | Active wallets: ${l(r.activeWallets??"?")}/${l(r.walletCount??"?")} | TP ${l(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${l(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${l(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${l(we(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${l(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(Lw).join("")}</div>`:""}
          </div>
          <div class="card-actions compact">
            <button data-top-refresh-wallet>Refresh Status</button>
            <button data-run-trade-plans>${n.walletRefreshing?"Checking...":"Run TP/SL Check"}</button>
            <button data-tab="positions">Positions</button>
            ${r.tokenMint?`<button data-copy="${l(r.tokenMint)}">Copy CA</button>`:""}
            ${r.dexUrl?`<a class="button-like" href="${l(r.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:I("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function Lw(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",a=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,o=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",s=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${qn(Ja(e.retryAfterAt))}`:"",i=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",p=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${l(e.label||"Wallet")}</strong>
        <span>${l(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${l(a)}${e.triggerKind?` / ${l(e.triggerKind)}`:""}</span>
        <small>Move ${l(o)}${l(s)} | checked ${l(qn(Ja(t)))}${l(c)}</small>
        <small>${l(u)} | ${l(d)} | ${l(p)} | Source: ${l(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${l(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${l(e.sellSignature)}</small>`:""}
        ${i?`<small class="warning-text">Error: ${l(i)}</small>`:""}
      </div>
    </div>
  `}function Pp(){const e=n.balances.filter(a=>a.error),t=n.balances.reduce((a,r)=>a+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${l(qn(Ja(n.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(a=>`<article class="row-card"><strong>${l(a.label||`Wallet ${a.index}`)}</strong><span>${l(a.error)}</span></article>`).join("")}
      </div>
    `:I("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Cp(e=!1){const t=n.terminalTxAudit;return`
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
          <input data-tx-audit-signature type="text" placeholder="Solana transaction signature" value="${l(n.terminalTxSignature||"")}">
          <button class="primary" data-run-tx-audit>${n.terminalTxLoading?"Auditing...":"Audit Tx"}</button>
        </div>
        ${t?xw(t):I("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${Ap()}${Pp()}</aside>`}
    </section>
  `}function xw(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${l(e.error)}</span></article>`:`
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
  `}function Mw(e=[]){const t=[...e].sort((a,r)=>Number(r.bestPickScore||r.score||0)-Number(a.bestPickScore||a.score||0)||Qe(a,r));return ba(t,5,ga("cooks-best"),1)}function Te(e){const t=Number(e);return Number.isFinite(t)?t:0}function Lp(){const e=n.liveFeedCategory||"best";return Es.find(([t])=>t===e)||Es[0]}function ka(e={}){return Xo(e)||Ep(e)||pi(e)||0}function ii(e={}){return Te(e.buys5m)+Te(e.buysH1)+Te(e.sells5m)+Te(e.sellsH1)}function xp(e={}){const t=Te(e.buys5m)+Te(e.buysH1),a=Te(e.sells5m)+Te(e.sellsH1),r=t+a;return r>0?t/r:.5}function hr(e={}){return Math.max(Te(e.m5),Te(e.h1),Te(e.h24))}function zo(e={}){return Math.max(Te(e.m5),Te(e.h1))}function qt(e={}){return zo(e)*Math.log10(10+ka(e))*(.5+xp(e))}function ci(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function Bw(e=[],t="best"){const a=[...e];switch(t){case"volume":return a.sort((r,o)=>ka(o)-ka(r));case"liquidity":return a.sort((r,o)=>ut(o)-ut(r));case"marketcap":return a.sort((r,o)=>ct(o)-ct(r));case"active":return a.sort((r,o)=>ii(o)-ii(r));case"fresh":return a.sort(Qe);case"gainers":return a.sort((r,o)=>hr(o)-hr(r));default:return a.sort((r,o)=>Te(o.bestPickScore||o.score)-Te(r.bestPickScore||r.score)||Qe(r,o))}}function Rw(){const e=n.liveTerminalCategory||"dexTrending";return Ua.find(([t])=>t===e)||Ua[0]}function Iw(e,t,a,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${l(r)}</span>
      <select ${a} aria-label="${l(r)} category">
        ${e.map(([o,s])=>`<option value="${o}"${o===t?" selected":""}>${l(s)}</option>`).join("")}
      </select>
    </label>`}function Ow(){if(n.activeTab==="terminal"){const t=Rw();return{categories:Ua,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:a=>Rp(a,t[0]),hasBest:!1}}const e=Lp();return{categories:Es,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>Bw(t,e[0]),hasBest:e[0]==="best"}}function Ew(e={}){if(ci(e))return{cls:"boost",text:"⚡ Boosted"};const t=hr(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const a=Number(e.pairAgeMinutes);return Number.isFinite(a)&&a>=0&&a<=10?{cls:"fresh",text:"✨ Fresh"}:zo(e)>=25?{cls:"hot",text:"🔥 Hot"}:xp(e)>=.7&&ii(e)>=24?{cls:"active",text:"● Active"}:null}function ui(e={}){const t=Ew(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${l(t.text)}</span>`:""}function Mp(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function Fw(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return Mp(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Bp(){const e=n.cookSpotCategory||"dexTrending";return Ua.find(([t])=>t===e)||Ua[0]}function Rp(e=[],t="dexTrending"){const a=[...e];switch(t){case"fresh":return a.sort(Qe);case"dexBoosted":{const r=a.filter(ci).sort((s,c)=>ka(c)-ka(s)),o=a.filter(s=>!ci(s)).sort((s,c)=>qt(c)-qt(s));return[...r,...o]}case"pumpTrending":{const r=a.filter(Mp);return(r.length?r:a).sort((o,s)=>qt(s)-qt(o))}case"memeMovers":{const r=a.filter(Fw);return(r.length?r:a).sort((o,s)=>hr(s)-hr(o))}case"earlyMomentum":{const r=a.filter(o=>{const s=Number(o.pairAgeMinutes);return!Number.isFinite(s)||s<=180});return(r.length?r:a).sort((o,s)=>zo(s)-zo(o))}case"graduating":{const r=a.filter(o=>Do(o)||No(o)==="graduating");return(r.length?r:a).sort((o,s)=>qt(s)-qt(o))}case"graduated":{const r=a.filter(o=>hn(o)||No(o)==="graduated");return(r.length?r:a).sort((o,s)=>ka(s)-ka(o))}default:return a.sort((r,o)=>qt(o)-qt(r))}}function Ww(e=Bp()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${Ua.map(([a,r])=>`<option value="${a}"${a===t?" selected":""}>${l(r)}</option>`).join("")}
      </select>
    </label>`}function Ip(e=0,t=""){const a=Ja(t),r=a===null?"live":qn(a);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${l(r)}</span></div>`}function di(e=[]){const t=Ow(),a=Iw(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',o=Ip(e.length,ia()),s={context:"live",shareBuilder:$a,hideToolbar:!0};if(t.hasBest){const i=Mw(e),u=new Set(i.map(ha).filter(Boolean)),d=[...e].sort(Qe).filter(f=>!u.has(ha(f))),p=at("live",d);return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>Top ${i.length} · rotating each refresh</span>${r}</div>
        ${i.length?it(i,s):I("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${p.length?it(p,s):I("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=at("live",t.rank(e));return`
    <div class="cooks-feed">
      ${o}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>${l(t.sub)}</span>${r}</div>
        ${c.length?it(c,s):I("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function Op(){const e=De(),t=be(e?.rows||[]),a=mn(t),r=at("live",a),o=xt.find(([f])=>f===n.livePairBucket)?.[1]||"Live",s=ia(),c=!!n.livePairsLoadingByBucket[n.livePairBucket],i=pn(),u=n.livePairsRefreshErrorByBucket?.[n.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",p=a.length?di(a):i?dr(t,`${o.toLowerCase()} pairs`):u?I("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?I("Loading live pairs…","Scanning fresh pairs for this time window."):I("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${xt.map(([f,y])=>{const g=n.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(g))?` (${g})`:"";return`<button data-live-pair-bucket="${f}" data-active="${n.livePairBucket===f}">${y}${S}</button>`}).join("")}
        </div>
        ${Ql("live",{rawCount:t.length,visibleCount:a.length})}
        ${Yl(t,a)}
        ${Al("live")}
        ${p}
        ${la("live",a,`${o} pairs`)}
      </main>
    </section>
  `}function Kk(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function Dw(){if(!n.user||!n.token)return`${Qa()}${I("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=n.watchlist?.rows||[],t=at("watchlist",e);return`
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
        ${t.length?it(t,{context:"watchlist",shareBuilder:a=>bl(a.tokenMint)}):I("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
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
  `}function Vk(e){return it(e,{context:"live",shareBuilder:$a})}function it(e,t={}){const a=t.shareBuilder||$a,r=be(e),o=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":Al(t.context||"scanner")}
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
      ${r.map((s,c)=>Nw(s,c,{...t,shareText:a(s),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":Al(t.context||"scanner")}
      ${I(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function Nw(e,t,a={}){const r=jo(e.tokenMint),o=a.shareText||$a(e),s=a.primaryActionLabel||"Trade",c=a.primaryAction||"quickTrade",i=a.context==="kol",u=a.context==="watchlist"?`<button type="button" data-unwatch-token="${l(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Go(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(a.context||"signal-row")}">
      <div class="signal-token">
        ${dt(e,{priority:!!a.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(a.context||"signal-title")}">${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${l(e.name||e.category||"Token")}</small>
            ${i?"":ui(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${l(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${l(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${l(o)}" title="Share to X">SHARE</button>
            ${wu(o,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(e.sniperCount)}</span>`:""}
          </div>
          ${Fv(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${l(e.pairAgeLabel||Ht(e)||"age unknown")}</span><small>${l(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${l(D(e.liquidityLabel,ut(e)>0?B(ut(e)):"","checking"))}</span><small>${_w(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${l(D(e.marketCapLabel,ct(e)>0?B(ct(e)):"","checking"))}</span><small>${l(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${l(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${l(Iv(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${l(D(e.volumeH1Label,e.volumeLabel,Xo(e)>0?B(Xo(e)):"","checking"))}</span>
        <small>${Xd(e).map(([d,p])=>`${d} ${p}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${l(e.tokenMint)}" title="Snipe buy">${l(s)}</button>`:`<button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(a.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(a.context||"signal-row")}" title="Quick buy with preset or custom SOL">${l(ya())}</button>`}
        <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${i?od(e):""}
        ${u}
        ${Gd(e)}
      </div>
    </article>
  `}function jo(e){const t=String(e||"");return!!(n.watchlist?.rows||[]).some(a=>String(a.tokenMint)===t)}function Ht(e){const t=Wo(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function _w(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const a=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${a}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function Go(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{},s=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,a.imageUrl,a.image,a.logoURI,a.logo,a.iconUrl,a.info?.imageUrl,a.baseToken?.imageUrl,a.baseToken?.logoURI,o.imageUrl,o.image,o.logoURI,o.logo,s.imageUrl,s.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const i of c){const u=rt(i);if(u)return u}return""}function ct(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{};return O(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,a.marketCap,a.marketCapUsd,a.market_cap,a.fdv,a.fdvUsd,a.baseToken?.marketCap,a.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,o.marketCap,o.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function ut(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.liquidity||{};return O(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,o.usd,o.quote,a.liquidityUsd,a.liquidity_usd,a.liquidity?.usd,a.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function pi(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return O(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,o.m15,o.m15m,o.m5,o.h1,a.volume?.m15,a.volume?.m5,a.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Xo(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return O(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,o.h1,o.m30,o.m15,a.volume?.h1,a.volume?.m30,a.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function Ep(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return O(e.volumeH24,e.volume24h,e.volume_h24,o.h24,o.d1,a.volume?.h24,a.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function dt(e,t={}){const a=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=Go(e),o=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),s=`token:${String(o||e.symbol||a).trim().toLowerCase()}`,c=_("tokenAvatarFixEnabled",!0),i=String(e.avatarState||"").trim().toLowerCase(),u=i==="missing"||i==="failed",d=!!e.avatarUrl&&(!i||i==="ready"),p=o&&!u?rt(vg(e)):"",f=c?vl(s,d?e.avatarUrl:"",p,u?"":r):vl(s,p,r),y=c&&!u?p&&f!==p?p:r&&r!==f?r:"":"",g=!!t.priority,S=g?"eager":"lazy",P=g?"high":"low",T=i||(f?"ready":"missing");if(f){const b=y?` data-backup-src="${l(y)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${l(T)}"><img src="${l(f)}"${b} data-avatar-src="${l(f)}" data-avatar-key="${l(s)}" alt="${l(e.symbol||e.name||"Token")}" loading="${S}" decoding="sync" fetchpriority="${P}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${l(a)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${l(T)}"><span>${l(a)}</span></div>`}function Uw(e=""){const t=String(e||"");let a=0;for(let r=0;r<t.length;r+=1)a+=t.charCodeAt(r);return a%5+1}function mi(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${Uw(e)}.png`}function $a(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Ht(e)||"age unknown"}.`}function qw(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([a])=>a===n.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${l(Hw(n.scanMode))}</p>
          </div>
          <span>${l(t)}</span>
        </div>
        <div class="mode-row terminal-modes">
          ${e.map(([a,r])=>`<button data-scan-mode="${a}" data-active="${n.scanMode===a}">${r}</button>`).join("")}
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-scan>Refresh ${l(t)}</button>
          <button data-tab="trade">Trade Desk</button>
          <button data-tab="bundle">Bundle</button>
          <button data-tab="live">Cooks</button>
        </div>
        ${n.scan?zw():I("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${Kw()}
      </aside>
    </section>
  `}function Hw(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function Kw(){if(!n.wallets.length)return I("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=n.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${yt("sniper")}
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
            ${Ge("sniper-delay","data-sniper-delay",e?"3":"5")}
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
            ${Qr("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:eo("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${an({toolKey:"sniperSetup",activeKey:nn("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${n.sniperResult?l(n.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${Vw()}
    </section>
  `}function Vw(){const e=n.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function zw(){const e=n.scan.rows||[],t=at("sniper",e);return e.length?`
    <p class="scan-meta">${l(n.scan.label)} | ${t.length}/${e.length} shown | scored ${n.scan.scanned} | qualified ${n.scan.qualified} | mode-fit ${n.scan.modeFit} | display pool ${n.scan.displayPool||0}</p>
    ${it(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:dg})}
    ${la("sniper",e,"snipe candidates")}
  `:I("No usable picks","Refresh again or choose a different mode.")}function Jo(){return n.user?.connectedWallet?.publicKey||""}function Fp(){return n.ogreTek.markets.find(e=>e.symbol===n.ogreTek.selectedMarket)||n.ogreTek.markets[0]||null}function jw(){return{marketSymbol:n.ogreTek.selectedMarket,direction:n.ogreTek.direction,orderType:n.ogreTek.orderType,collateralUsd:n.ogreTek.collateralUsd,leverage:n.ogreTek.leverage,slippagePct:n.ogreTek.slippagePct,priorityFeeLamports:n.ogreTek.priorityFeeLamports,limitPrice:n.ogreTek.limitPrice,stopPrice:n.ogreTek.stopPrice}}function Wp(){return vm(jw(),Fp(),n.ogreTek.account,ke)}function ve(e,t=2){const a=Number(e);return Number.isFinite(a)?Math.abs(a)>=1e9?`$${(a/1e9).toFixed(2)}B`:Math.abs(a)>=1e6?`$${(a/1e6).toFixed(2)}M`:Math.abs(a)>=1e3?`$${(a/1e3).toFixed(1)}K`:`$${a.toFixed(t)}`:"n/a"}function pt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function Yo(e,t=3){const a=Number(e);return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(t)}%`:"n/a"}function Dp(e){const t=Date.parse(e||"");if(!t)return"not loaded";const a=Math.max(0,Math.round((Date.now()-t)/1e3));return a<60?`${a}s ago`:`${Math.round(a/60)}m ago`}function Qo(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in n.ogreTek)||(e.type==="checkbox"?n.ogreTek[t]=!!e.checked:n.ogreTek[t]=e.value)})}async function Gw(){!ke.enabled||n.ogreTek.loading||n.ogreTek.markets.length||n.ogreTek.error||await gr({silent:!0}).catch(e=>{n.ogreTek.error=N(e.message),h({force:!0})})}async function gr({force:e=!1,silent:t=!1}={}){if(ke.enabled&&!(n.ogreTek.loading&&!e)){n.ogreTek.loading=!0,n.ogreTek.error="",t||h({force:!0});try{const a=Jo(),[r,o,s,c]=await Promise.all([vr.getMarkets(),vr.getAccount(a),vr.getPositions(a),vr.getOpenOrders(a)]);n.ogreTek.markets=r||[],n.ogreTek.account=o||null,n.ogreTek.positions=s||[],n.ogreTek.orders=c||[],n.ogreTek.markets.some(i=>i.symbol===n.ogreTek.selectedMarket)||(n.ogreTek.selectedMarket=n.ogreTek.markets[0]?.symbol||"SOL-PERP"),n.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(a){n.ogreTek.error=N(a.message)}finally{n.ogreTek.loading=!1,h({force:!0})}}}function Xw(){return`
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
  `}function Jw(){if(gm(ke)!=="enabled")return Xw();const e=!!Jo(),t=Fp(),a=Wp(),r=a.quote,o=n.ogreTek.account,s=a.ok&&!n.ogreTek.loading,c=n.ogreTek.error?"Provider Error":n.ogreTek.loading?"Loading":"Ready",i=ke.demoMode?"Review Demo Trade":"Review Trade",u=ke.demoMode?"Confirm Demo Review":"Confirm Order",d=ke.demoMode?!n.ogreTek.riskAccepted||!a.ok:!fm({validation:a,riskAccepted:n.ogreTek.riskAccepted,demoMode:ke.demoMode});return`
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
          <span class="slime-status-badge" data-ok="${n.ogreTek.error?"false":"true"}">${l(c)}</span>
        </div>
      </article>

      <article class="ogre-risk-copy">
        Perpetual futures are leveraged derivatives. You can lose your collateral and may be liquidated. This interface does not provide financial advice.
      </article>

      ${n.ogreTek.error?`<p class="error dashboard-error">${l(n.ogreTek.error)}</p>`:""}

      <section class="ogre-tek-grid">
        <div class="ogre-tek-main">
          <article class="slime-panel ogre-market-panel">
            <div class="panel-title-row">
              <div>
                <h3>Perps Markets</h3>
                <p>${l(n.ogreTek.status||"Demo market data loads when the tab opens.")}</p>
              </div>
              <button type="button" data-ogre-tek-refresh>${n.ogreTek.loading?"Refreshing...":"Refresh"}</button>
            </div>
            ${Yw()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${n.ogreTek.positions.length} open</span>
            </div>
            ${Zw()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${eS()}
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
                ${n.ogreTek.markets.map(p=>`<option value="${l(p.symbol)}" ${p.symbol===n.ogreTek.selectedMarket?"selected":""}>${l(p.symbol)}</option>`).join("")}
              </select>
            </label>
            <label>
              Order Type
              <select data-ogre-tek-field="orderType">
                ${["market","limit","stop","take-profit","stop-loss"].map(p=>`<option value="${p}" ${n.ogreTek.orderType===p?"selected":""}>${l(p.replace("-"," ").toUpperCase())}</option>`).join("")}
              </select>
            </label>
            <div class="ogre-ticket-grid">
              <label>
                Collateral USD
                <input data-ogre-tek-field="collateralUsd" type="number" min="0" step="1" value="${l(n.ogreTek.collateralUsd)}">
              </label>
              <label>
                Leverage
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${l(ke.maxLeverage)}" step="0.5" value="${l(n.ogreTek.leverage)}">
                <span>${l(n.ogreTek.leverage)}x max ${l(ke.maxLeverage)}x</span>
              </label>
              <label>
                Limit Price
                <input data-ogre-tek-field="limitPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${l(n.ogreTek.limitPrice)}">
              </label>
              <label>
                Stop / Trigger
                <input data-ogre-tek-field="stopPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${l(n.ogreTek.stopPrice)}">
              </label>
              <label>
                Slippage %
                <input data-ogre-tek-field="slippagePct" type="number" min="0" max="10" step="0.1" value="${l(n.ogreTek.slippagePct)}">
              </label>
              <label>
                Priority Fee
                <input data-ogre-tek-field="priorityFeeLamports" type="number" min="0" step="1000" value="${l(n.ogreTek.priorityFeeLamports)}">
              </label>
            </div>
            ${Qw(r,t)}
            ${Np(a)}
            <button class="primary" type="button" data-ogre-tek-review ${s?"":"disabled"}>${l(i)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${tS(o)}
          </article>
        </aside>
      </section>
      ${n.ogreTek.reviewOpen?aS({validation:a,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function Yw(){return n.ogreTek.loading&&!n.ogreTek.markets.length?I("Loading markets","Ogre Tek is loading demo perps markets."):n.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${n.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${l(e.symbol)}" data-active="${e.symbol===n.ogreTek.selectedMarket}">
          <span>${l(e.symbol)}</span>
          <strong>${pt(e.indexPrice)}</strong>
          <small>Oracle ${pt(e.oraclePrice)} | 24h ${Yo(e.change24hPct,2)}</small>
          <small>Funding ${Yo(e.fundingRatePct,3)} | OI ${ve(e.openInterestUsd,0)}</small>
          <small>Fresh ${l(Dp(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:I("No markets available","No allowed perps markets are available for this provider.")}function Qw(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${pt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${ve(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${pt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${ve(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${ve(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${ve(e?.maxLossUsd)}</strong></span>
    </div>
  `}function Np(e){const t=e.errors||[],a=e.warnings||[];return!t.length&&!a.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${l(r)}</p>`).join("")}
      ${a.map(r=>`<p data-kind="warning">${l(r)}</p>`).join("")}
    </div>
  `}function Zw(){return Jo()?n.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${n.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.side)} | margin ${Yo(e.marginRatioPct,1)}</small></span>
          <span>${ve(e.sizeUsd)}<small>collateral ${ve(e.collateralUsd)}</small></span>
          <span>${pt(e.entryPrice)}<small>mark ${pt(e.markPrice)}</small></span>
          <span>${pt(e.liquidationPrice)}</span>
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
  `:I("No open positions","Mock positions will appear here when the provider reports them."):I("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function eS(){return Jo()?n.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${n.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.type)} ${l(e.side)}</small></span>
          <span>${pt(e.triggerPrice)}</span>
          <span>${ve(e.sizeUsd)}</span>
          <span>${l(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:I("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):I("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function tS(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${ve(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${ve(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${ve(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${l(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${ve(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${l(e.maxLeverageAllowed||ke.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${l(Dp(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function aS({validation:e,quote:t,market:a,confirmButtonText:r,confirmDisabled:o}){const s=e.order||{};return`
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
          <span><small>Market</small><strong>${l(s.marketSymbol||a?.symbol||"n/a")}</strong></span>
          <span><small>Collateral</small><strong>${ve(s.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${l(s.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${pt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${pt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${ve(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${Yo(a?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${ve(t?.maxLossUsd)}</strong></span>
        </div>
        ${Np(e)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${n.ogreTek.riskAccepted?"checked":""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${o?"disabled":""}>${l(r)}</button>
        </div>
      </article>
    </div>
  `}function _p(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const fi="slimewire:ogreAgentMessages:v1",hi="slimewire:ogreAgentLastToken:v1";function nS(){try{const e=JSON.parse(localStorage.getItem(fi)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function rS(){try{localStorage.setItem(fi,JSON.stringify(bn().slice(-50)))}catch{}}function Kt(){if(n.ogreAgentLastTokenMint)return String(n.ogreAgentLastTokenMint);try{n.ogreAgentLastTokenMint=String(localStorage.getItem(hi)||"").trim()}catch{n.ogreAgentLastTokenMint=""}return n.ogreAgentLastTokenMint||""}function Zo(e=""){const t=String(e||"").trim();if(!t)return"";n.ogreAgentLastTokenMint=t;try{localStorage.setItem(hi,t)}catch{}return t}function bn(){if(!Array.isArray(n.ogreAgentMessages)||!n.ogreAgentMessages.length){const e=nS();n.ogreAgentMessages=e.length?e:[_p()]}return n.ogreAgentMessages}function oS(){const e=String(n.smartChartToken||n.tradeToken||Kt()||"").trim(),t=e?va(e):null,a=t?.tokenMint?Ye(t):null,r=e?fp(e):null,o=e?ai(e):null,s=io().slice(0,3),c=e?nt().find(i=>String(i.tokenMint||"")===e):null;return{route:n.route,activeTab:n.activeTab,agentFastMode:n.ogreAgentFastMode,agentAutoTradeApproved:ns(),lastTokenMint:Kt(),recentAgentMessages:bn().slice(-8).map(i=>({role:i.role==="user"?"user":"assistant",text:String(i.text||"").slice(0,600)})),smartChartToken:n.smartChartToken||"",tradeToken:n.tradeToken||"",livePairBucket:n.livePairBucket||"",slimeScopeMode:n.slimeScopeMode||"",walletConnected:!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey),walletCount:nl(),positionCount:nt().length,totalSol:Ot().toFixed(4),selectedTradePreset:dn("trade"),selectedBundlePreset:dn("bundle"),quickBuyAmount:String(vi()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:jo(e)}:null,slimeShield:a?{verdict:a.verdict,summary:a.summary,confidence:a.confidence,suggestedAction:a.suggestedAction,topFactors:(a.factors||[]).slice(0,4).map(i=>i.message||i.label||i.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:s.length?s.map(i=>({displayName:i.displayName,riskLabel:i.riskLabel,dumpRiskPercent:i.lowData?null:i.dumpRiskPercent,lowData:!!i.lowData,summary:Zn(i)})):[],replayBeforeBuy:o?{sampleSize:o.sampleSize,confidence:o.confidence,winRatePercent:o.winRatePercent,medianMaxDrawdownPercent:o.medianMaxDrawdownPercent,summary:o.summary}:null,pnlSummary:{realized:qc(),positions:nt().length,totalSol:Ot().toFixed(4)},profile:{hasReferralCode:!!n.user?.referralCode,referralCode:n.user?.referralCode||"",hasReferralPayoutWallet:!!n.user?.referralPayoutWallet,hasXHandle:!!(n.xHandle||n.user?.xHandle),traderBoardEnabled:n.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:Up()}}function Up(){const e=[],t=new Set,a=(r,o="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(i=>a(i,o));return}if(Array.isArray(r.rows)){r.rows.forEach(i=>a(i,o));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(i=>a(i,o));return}if(typeof r!="object")return;const s=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!s)return;const c=s.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:s,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:o}))};return a(n.livePairRows,"live-pairs"),a(n.slimeScopeRows,"slime-scope"),a(n.livePairs,"live-pairs"),Object.values(n.livePairsByBucket||{}).forEach(r=>a(r,"bucket")),Object.values(n.terminalFeeds||{}).forEach(r=>a(r,"terminal-feed")),e.sort((r,o)=>qp(o)-qp(r)).slice(0,24)}function qp(e={}){const t=T=>Number.isFinite(Number(T))?Number(T):0,a=t(e.ageMinutes),r=t(e.marketCap),o=t(e.liquidityUsd),s=t(e.volume5m),c=t(e.volume1h),i=Math.max(s,c*.18),u=a>0?Math.max(0,90-Math.min(a,360))/2.5:12,d=a>120?Math.min(42,(a-120)/4):0,p=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?i/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:i>0?2:-18,g=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+p+y+Math.log10(1+s+c)*7+Math.log10(1+o)*3+g+S-P-d}function sS(e={}){return String(e.label||e.type||"Run").slice(0,40)}function lS(e={},t=0){const a=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${l(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${l(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${a.length?`<div class="ogre-agent-actions">${a.map((o,s)=>`<button type="button" data-ogre-agent-action="${t}:${s}">${l(sS(o))}</button>`).join("")}</div>`:""}
    </div>
  `}function iS(){const e=!!(n.ogreAgentLoading||n.ogreAgentSpeaking),t=!!n.ogreAgentListening,a=!!n.ogreAgentVoiceEnabled;return`
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
  `}function cS(){const e=!!n.ogreAgentOpen,t=bn(),a=n.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=zp(),o=n.ogreAgentListening?"Stop":"Mic";return`
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
            <button type="button" class="ogre-agent-voice-toggle" data-ogre-agent-voice aria-pressed="${n.ogreAgentVoiceEnabled?"true":"false"}">${l(a)}</button>
            <button type="button" data-ogre-agent-close aria-label="Close Ogre Agent">Close</button>
          </div>
        </header>
        ${e?iS():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(lS).join("")}
          ${n.ogreAgentLoading?'<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>':""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL...">${l(n.ogreAgentDraft||"")}</textarea>
          <div class="ogre-agent-composer-actions">
            <button type="button" class="ogre-agent-mic ${n.ogreAgentListening?"is-listening":""}" data-ogre-agent-mic title="${r?"Tap, speak, and Ogre will send it.":"Tap to check microphone support."}">${l(o)}</button>
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
        ${n.ogreAgentStatus?`<small class="ogre-agent-status">${l(n.ogreAgentStatus)}</small>`:""}
      </section>
    </div>
  `}function E({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const a=t.querySelector("[data-ogre-agent-input]"),r=!!(a&&document.activeElement===a),o=r?a.selectionStart:null,s=r?a.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),i=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;a&&(n.ogreAgentDraft=a.value);const d=Array.isArray(n.ogreAgentMessages)?n.ogreAgentMessages:[],p=d[d.length-1]||{},f=[n.ogreAgentOpen?"open":"closed",n.ogreAgentLoading?"loading":"idle",n.ogreAgentStatus||"",d.length,p.role||"",p.text||"",Array.isArray(p.actions)?p.actions.length:0,n.ogreAgentVoiceEnabled?"voice-on":"voice-off",n.ogreAgentSpeaking?"speaking":"silent",n.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=cS(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),as()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=n.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),o!==null&&s!==null&&y.setSelectionRange(o,s),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const g=t.querySelector("[data-ogre-agent-feed]");g&&(e||u||n.ogreAgentLoading?g.scrollTop=g.scrollHeight:g.scrollTop=Math.min(i,Math.max(0,g.scrollHeight-g.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function ue(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};n.ogreAgentMessages=[...bn(),t].slice(-50),rS(),t.role==="assistant"&&Kp(t.text||"")}function gi(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function uS(){if(!gi())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=a=>{const r=`${a.name||""} ${a.voiceURI||""}`.toLowerCase(),o=String(a.lang||"").toLowerCase();let s=0;return(/^en[-_]/.test(o)||o==="en")&&(s+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(s+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(s+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(s-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(s-=25),a.localService&&(s+=3),s};return e.slice().sort((a,r)=>t(r)-t(a))[0]||e[0]||null}let yn=null;function dS(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!yn||yn.state==="closed")&&(yn=new e),yn.state==="suspended"&&yn.resume(),yn}catch{return null}}function Hp(e="reply"){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen)return;const t=dS();if(t)try{const a=t.currentTime,r=e==="online"?.22:.34,o=t.createGain(),s=t.createBiquadFilter(),c=t.createOscillator(),i=t.createOscillator(),u=t.createGain();o.gain.setValueAtTime(1e-4,a),o.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,a+.035),o.gain.exponentialRampToValueAtTime(1e-4,a+r),s.type="lowpass",s.frequency.setValueAtTime(210,a),s.frequency.exponentialRampToValueAtTime(92,a+r),s.Q.setValueAtTime(5.2,a),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,a),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,a+r),i.type="sine",i.frequency.setValueAtTime(e==="online"?45:38,a),i.frequency.exponentialRampToValueAtTime(e==="online"?35:31,a+r),u.gain.setValueAtTime(.18,a),u.gain.exponentialRampToValueAtTime(1e-4,a+r),c.connect(s),s.connect(o),i.connect(u),u.connect(o),o.connect(t.destination),c.start(a),i.start(a),c.stop(a+r+.02),i.stop(a+r+.02)}catch{}}function kt(e=!1){n.ogreAgentSpeaking=!!e,n.ogreAgentOpen&&E({force:!0})}function es(){if(!gi()){kt(!1);return}try{window.speechSynthesis.cancel()}catch{}kt(!1)}function pS(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function Kp(e=""){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen||!gi()){kt(!1);return}const t=pS(e);if(!t){kt(!1);return}try{window.speechSynthesis.cancel();const a=new window.SpeechSynthesisUtterance(t),r=uS();r&&(a.voice=r),a.pitch=.72,a.rate=.86,a.volume=1,a.onstart=()=>kt(!0),a.onend=()=>kt(!1),a.onerror=()=>kt(!1),kt(!0),Hp("reply"),window.speechSynthesis.speak(a)}catch{kt(!1)}}function mS(e){n.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",n.ogreAgentVoiceEnabled?"on":"off")}catch{}n.ogreAgentVoiceEnabled?(n.ogreAgentStatus="Ogre voice on.",Hp("online"),Kp("Ogre voice online.")):(es(),n.ogreAgentStatus="Ogre voice muted."),E({force:!0})}function Vp(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function zp(){return!!Vp()}async function jp(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function Gp(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();n.ogreAgentDraft=t;const a=document.querySelector("[data-ogre-agent-input]");if(a){a.value=t;try{a.focus({preventScroll:!0}),a.setSelectionRange(t.length,t.length)}catch{}}}function ts(){Qt&&(clearTimeout(Qt),Qt=null),Ia&&(clearTimeout(Ia),Ia=null)}function Xp(e,t=n.ogreAgentSpeechRecognizer){Ia&&clearTimeout(Ia),Ia=setTimeout(()=>{e!==et||n.ogreAgentSpeechRecognizer!==t||Vt("Mic timed out instead of staying open. Tap Mic again or type the command.")},Fm)}function Vt(e=""){et+=1,ts();const t=n.ogreAgentSpeechRecognizer;if(n.ogreAgentSpeechRecognizer=null,n.ogreAgentListening=!1,n.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(n.ogreAgentStatus=e),n.ogreAgentOpen&&E({force:!0})}async function fS(){if(!zp()){const s=await jp();n.ogreAgentStatus=s==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",E({force:!0});return}n.ogreAgentLoading&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),es(),Vt();const e=et;n.ogreAgentStatus="Checking microphone permission...",E({force:!0});const t=await jp();if(e!==et||!n.ogreAgentOpen)return;if(t==="denied"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",E({force:!0});return}if(t==="unavailable"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="No microphone is available to this browser. Typing still works.",E({force:!0});return}const a=Vp(),r=new a,o=++et;n.ogreAgentSpeechRecognizer=r,n.ogreAgentListening=!0,n.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||n.ogreAgentDraft||"").trim(),n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Opening microphone...",E({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Qt=setTimeout(()=>{o!==et||n.ogreAgentSpeechRecognizer!==r||Vt("Mic did not start. Check browser permission, then tap Mic again.")},Em),r.onstart=()=>{o!==et||n.ogreAgentSpeechRecognizer!==r||(Qt&&(clearTimeout(Qt),Qt=null),n.ogreAgentListening=!0,n.ogreAgentStatus="Listening... speak your Ogre command.",Xp(o,r),E({force:!0}))},r.onresult=s=>{if(o!==et||n.ogreAgentSpeechRecognizer!==r)return;Xp(o,r);let c="",i="";for(let d=s.resultIndex||0;d<s.results.length;d+=1){const p=String(s.results[d]?.[0]?.transcript||"");s.results[d]?.isFinal?i+=` ${p}`:c+=` ${p}`}i.trim()&&(n.ogreAgentSpeechFinal=`${n.ogreAgentSpeechFinal||""} ${i}`.replace(/\s+/g," ").trim());const u=[n.ogreAgentSpeechBaseDraft,n.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();Gp(u)},r.onerror=s=>{if(o!==et||n.ogreAgentSpeechRecognizer!==r)return;ts();const c=String(s?.error||"");n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",E({force:!0})},r.onend=()=>{if(o!==et||n.ogreAgentSpeechRecognizer!==r)return;ts();const s=String(n.ogreAgentDraft||"").trim(),c=!!(s&&n.ogreAgentSpeechFinal&&!n.ogreAgentLoading);n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",E({force:!0}),c&&setTimeout(()=>{Gp(s),mt()},100)};try{r.start()}catch{ts(),n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic could not start. Typing still works.",E({force:!0})}}function hS(){n.ogreAgentListening||n.ogreAgentSpeechRecognizer?Vt("Voice input stopped."):fS()}function as(){n.ogreAgentOpen=!1,n.ogreAgentStatus="",n.ogreAgentLoading=!1,n.ogreAgentRequestId="",Vt(),es(),E({force:!0})}function gS(e=""){const[t,a]=String(e).split(":");return bn()[Number(t)]?.actions?.[Number(a)]||null}function Jp(){return Array.isArray(n.wallets)&&n.wallets.length>0}function Yp(){return!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.walletPublicKey||n.connectedWalletPublicKey)}function ns(){return!!(!Qp()&&(n.ogreAgentAutoTradeApproved||Jp()||Yp()))}function bS(e="wallet-sync"){return Qp()?!1:Jp()||Yp()?(yi(!0),!0):(bi(),!1)}function Qp(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function bi(){n.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function yi(e,t={}){n.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),n.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function Zp(e){n.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",n.ogreAgentFastMode?"on":"off")}catch{}}function $t(e=""){const t=String(e||"").toLowerCase(),a=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),o=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return a?"buy":r||o?"sell":""}function yS(e=""){const t=String(e||"").toLowerCase(),a=$t(t);if(!a||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),o=a==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),s=!!(Kt()||n.smartChartToken||n.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||a==="buy"&&s&&/\b(just\s+)?buy\b/.test(t);return!!(o&&c&&!r)}function vS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return a?Number(a):0}function vi(){const e=typeof lt=="function"?lt():null,t=Number(n.quickBuyAmountOverride||(typeof qe=="function"?qe(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function wS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=o?Math.round(Number(o)*100):0,c=[];return a&&c.push(`TP +${a}%`),r&&c.push(`SL -${r}%`),o&&c.push(`slippage ${o}%`),{takeProfitPct:a,stopLossPct:r,slippagePct:o,slippageBps:Number.isFinite(s)&&s>0?s:0,summary:c.join(" / ")}}function SS(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(\d{1,3})\s*%/)||[])[1];return a||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function kS(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function $S(){const e=[],t=(r={})=>{const o=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();o&&e.push({tokenMint:o,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};n.smartChartToken&&t({tokenMint:n.smartChartToken,symbol:n.smartChartTokenSymbol}),n.tradeToken&&t({tokenMint:n.tradeToken,symbol:n.tradeTokenSymbol}),[n.livePairRows,n.slimeScopeRows,n.watchlist,n.positions,n.portfolioRows,n.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const a=new Set;return e.filter(r=>{const o=r.tokenMint.toLowerCase();return a.has(o)?!1:(a.add(o),!0)})}function TS(e=""){const t=String(e||"").trim(),a=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(a)return a;const r=t.toLowerCase();return $S().map(s=>{const c=s.symbol.toLowerCase(),i=s.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),i&&r.includes(i)&&(u+=8+Math.min(16,i.length)),{...s,score:u}}).filter(s=>s.score>0).sort((s,c)=>c.score-s.score)[0]?.tokenMint||""}function rs(e={},t=""){const a={...e},r=$t(t);if(!a.tokenMint&&!a.mint&&!a.ca){const o=TS(t)||Kt()||n.smartChartToken||n.tradeToken;o&&(a.tokenMint=o)}if(a.type==="confirm_buy"||r==="buy"){if(a.type=a.type||"confirm_buy",!a.amountSol){const s=vS(t)||vi();s>0&&(a.amountSol=s)}const o=wS(t);if(o.takeProfitPct&&!a.takeProfitPct&&(a.takeProfitPct=o.takeProfitPct),o.stopLossPct&&!a.stopLossPct&&(a.stopLossPct=o.stopLossPct),o.slippageBps&&!a.slippageBps&&(a.slippageBps=o.slippageBps),a.walletIndex===void 0){const s=kS(t);s!==void 0&&(a.walletIndex=s)}}return(a.type==="confirm_sell"||r==="sell")&&(a.type=a.type||"confirm_sell",a.percent=a.percent||SS(t)),a}function em(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function tm(e={},t=""){if(!n.ogreAgentFastMode||!ns()||e.requiresReview||e.conditional)return!1;const a=$t(t);return a?a==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:a==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function zt(e={}){const t=String(e.type||""),a=String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Kt()||"").trim();if(t==="toggle_agent_fast_mode"){Zp(!n.ogreAgentFastMode),n.ogreAgentStatus=n.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",ue({role:"assistant",text:n.ogreAgentStatus,actions:[{label:n.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),E();return}if(t==="approve_agent_auto_trade"){yi(!0),Zp(!0),n.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",ue({role:"assistant",text:`${n.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),E();return}if(t==="revoke_agent_auto_trade"){yi(!1,{revoked:!0}),n.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",ue({role:"assistant",text:n.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),E();return}if(t==="open_tab"){n.route="terminal",n.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!a){n.ogreAgentStatus="Paste a token CA in the message first.",E();return}vt(ge(a,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){n.route="terminal",n.activeTab="positions",window.history.pushState({},"","/terminal"),n.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){G(()=>bt({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Wallet refresh started.",E();return}if(t==="refresh_feeds"){G(()=>Xa({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Feed refresh started.",E();return}if(t==="open_wallet_connect"){ua({returnPath:"/terminal"}),n.ogreAgentStatus="Wallet connect opened.",E();return}if(t==="start_clip_recording"){tu(),n.ogreAgentStatus="REC started from Ogre Agent.",E();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim();if(!r){n.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",E();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(n.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),sn(ge(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),n.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",E();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||n.smartChartToken||n.tradeToken||Kt()||"").trim(),o=Number(e.amountSol||e.sol||e.amount||vi()||0);if(!r||!Number.isFinite(o)||o<=0){r&&sn(ge(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),n.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",E();return}const s=e.walletIndex!==void 0?e.walletIndex:ie()?.publicKey?"connected":n.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;n.ogreAgentLoading=!0,n.ogreAgentStatus=`Sending ${o} SOL buy request...`,E();try{const i=await $o({tokenMint:r,walletIndex:s,amountSol:o,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});n.ogreAgentStatus=i?.ok===!1?i.error||i.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${em(e)}`,typeof bt=="function"&&bt({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(i){n.ogreAgentStatus=i?.message||"Buy failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim(),o=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){n.activeTab="positions",n.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}n.ogreAgentLoading=!0,n.ogreAgentStatus=`Preparing sell ${o}%...`,E();try{await Ao(r,o,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),n.ogreAgentStatus=`Sell ${o}% submitted. Refreshing wallet and positions in the background.`,typeof bt=="function"&&bt({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(s){n.ogreAgentStatus=s?.message||"Sell failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){n.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",E();return}window.open(r,"_blank","noopener,noreferrer"),n.ogreAgentStatus="Opened trusted coin link.",E();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=Zo(String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||Kt()||"").trim());if(!r){n.ogreAgentStatus="Paste a token CA and ask me to check it.",E();return}const o=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};n.ogreAgentLoading=!0,n.ogreAgentStatus="Checking coin details...",E();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},i=c.symbol||c.baseSymbol||w(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,p=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",g=c.telegramUrl||c.links?.telegram||"",S=o(c.liquidityUsd||c.liquidity?.usd),P=o(c.marketCap||c.fdv||c.marketCapUsd),T=o(c.volume24h||c.volume?.h24||c.volume?.m5),b=[`${i} breakdown`,`${u} | ${w(r)}`,`MC/FDV: ${P} | Liquidity: ${S} | Volume: ${T}`,`Socials: X ${y?"found":"not returned"} | Telegram ${g?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],A=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];p&&A.push({label:"Pump",type:"open_external",url:p}),f&&A.push({label:"Website",type:"open_external",url:f}),y&&A.push({label:"X",type:"open_external",url:y}),g&&A.push({label:"Telegram",type:"open_external",url:g}),ue({role:"assistant",text:b.join(`
`),actions:A}),n.ogreAgentStatus="Coin breakdown ready."}catch(s){ue({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),n.ogreAgentStatus=s?.message||"Coin check delayed."}finally{n.ogreAgentLoading=!1,E()}return}n.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",E()}function AS(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function wi(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function am(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function PS(e="",t=[]){const a=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(o=>String(o||"").trim()).filter((o,s,c)=>o&&c.findIndex(i=>i.toLowerCase()===o.toLowerCase())===s).slice(0,4),r=a.length?a.map(o=>`"${o.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function CS(e=""){if(!am(e))return null;const t=Zo(wi(e)||Kt()||n.smartChartToken||n.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:PS(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function LS(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function xS(e=""){if(!LS(e))return null;const t=Up().slice(0,4),a=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((s,c)=>{const i=s.symbol||w(s.tokenMint),u=Number.isFinite(Number(s.ageMinutes))?`${Math.max(0,Math.round(Number(s.ageMinutes)))}m old`:"age n/a",d=s.twitterUrl||s.telegramUrl||s.websiteUrl?"socials found":"socials not returned",p=Array.isArray(s.riskFlags)&&s.riskFlags.length?`risk: ${s.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${i} ${w(s.tokenMint)} | MC ${a(s.marketCap)} | Liq ${a(s.liquidityUsd)} | Vol ${a(s.volume5m||s.volume1h)} | ${u} | ${d} | ${p}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],o=t[0];return{text:r.join(`
`),actions:[o?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:o.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const MS=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],BS=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function RS(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||wi(e)||$t(e))return null;const a=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(a){const o=ur(a[1]);if(o)return n.quickBuyAmountOverride=o,Gr({quickBuy:o}),_o(),{text:`Quick buy set to ${o} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return Gr({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return Gr({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=BS.test(t);for(const[o,s]of MS)for(const c of s){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${IS(o)} now.${o==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:o},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function IS(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const OS={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function nm(e){n.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},os()}function Be(e,t="ok",a=""){if(!n.tradeTrace||n.tradeTrace.done&&t==="pending")return;const r=n.tradeTrace.steps,o=r.find(i=>i.key===e),s=o||{key:e,label:OS[e]||e};if(s.status=t,s.detail=String(a||"").slice(0,140),o||r.push(s),t==="fail"&&(n.tradeTrace.done=!0),os(),t==="fail")return;r.length>=3&&r.every(i=>i.status==="ok")&&(n.tradeTrace.done=!0,window.setTimeout(()=>{n.tradeTrace?.done&&!n.tradeTrace.steps.some(i=>i.status==="fail")&&(n.tradeTrace=null,os())},8e3))}function os(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=n.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const a=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
    <aside class="trade-trace" role="status" aria-live="polite">
      <header>
        <strong>${l(t.title)}</strong>
        <button type="button" data-trade-trace-close aria-label="Close receipt">✕</button>
      </header>
      ${t.steps.map(r=>`
        <div class="trade-trace-step is-${l(r.status)}">
          <span>${a(r.status)}</span>
          <div>
            <b>${l(r.label)}</b>
            ${r.detail?`<small>${l(r.detail)}</small>`:""}
          </div>
        </div>`).join("")}
    </aside>
  `}async function mt(e=""){const t=document.querySelector("[data-ogre-agent-input]"),a=String(e||t?.value||"").trim();if(!a||n.ogreAgentLoading)return;const r=wi(a);if(r&&Zo(r),t&&(t.value=""),n.ogreAgentDraft="",ue({role:"user",text:a,actions:[]}),yS(a)){const i=$t(a),u=rs({type:i==="buy"?"confirm_buy":"confirm_sell"},a),d=String(u.tokenMint||u.mint||u.ca||"").trim(),p=Number(u.amountSol||u.sol||u.amount||0);if(!d){ue({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),n.ogreAgentStatus="Need token CA.",E({force:!0});return}if(i==="buy"&&(!Number.isFinite(p)||p<=0)){ue({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),n.ogreAgentStatus="Need buy amount.",E({force:!0});return}if(!ns()){ue({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),n.ogreAgentStatus="Wallet session needed.",E({force:!0});return}ue({role:"assistant",text:i==="buy"?`Sending ${p} SOL buy for ${w(d)}.${em(u)}`:`Sending sell request for ${w(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),n.ogreAgentStatus="Fast Mode: sending trade request...",E({force:!0}),await zt(u);return}const o=RS(a);if(o){ue({role:"assistant",text:o.text,actions:o.actions||[]}),n.ogreAgentStatus="Instant local reply.",E({force:!0}),o.run&&await zt(o.run);return}n.ogreAgentLoading=!0,n.ogreAgentStatus="",ne("chatRequestStarted");const s=`${Date.now()}:${Math.random().toString(16).slice(2)}`;n.ogreAgentRequestId=s;const c=setTimeout(()=>{n.ogreAgentRequestId!==s||!n.ogreAgentLoading||(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Agent reply timed out.",ne("chatRequestTimedOut"),ue({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:a,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),E({force:!0}))},7500);E();try{const i=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:a,context:oS()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(n.ogreAgentRequestId!==s)return;const u=(i?.agent?.actions||[]).map(S=>rs(S,a));i?.agent?.tokenMint&&Zo(i.agent.tokenMint),ue({role:"assistant",text:i?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),ne("chatRequestSucceeded");const d=!!(i?.agent?.coinEnriched||i?.agent?.tokenMint||i?.agent?.socialLinks||i?.agent?.socialScan),f=!am(a)&&!d&&!$t(a)&&AS(a)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||rs({type:"coin_breakdown"},a):null;if(f?.tokenMint||f?.mint||f?.ca){n.ogreAgentStatus="Checking coin now...",await zt(f);return}const y=rs({type:$t(a)==="buy"?"confirm_buy":$t(a)==="sell"?"confirm_sell":""},a);if($t(a)&&n.ogreAgentFastMode&&!ns()){ue({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),n.ogreAgentStatus="Auto-Trade approval needed once.";return}const g=u.find(S=>tm(S,a))||(tm(y,a)?y:null);if(g){n.ogreAgentStatus="Fast Mode: sending trade request...",await zt(g);return}n.ogreAgentStatus=i?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(i){if(n.ogreAgentRequestId!==s)return;const u=CS(a);if(u){ue({role:"assistant",text:u.text,actions:u.actions}),n.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=xS(a);if(d){ue({role:"assistant",text:d.text,actions:d.actions}),n.ogreAgentStatus="Fast local trend scan.";return}ue({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:a,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),ne("chatRequestFailed"),n.ogreAgentStatus=i?.message||"Agent reply failed."}finally{clearTimeout(c),n.ogreAgentRequestId===s&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,E())}}function I(e,t){return`<article class="empty"><h3>${l(e)}</h3><p>${l(t)}</p></article>`}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function we(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function ES(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function rm(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const a=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");a&&(e.preventDefault(),ES(a),uc({connectPanel:a.matches("[data-connect-login-toggle]")||n.route==="connect",source:a.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if($f(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),mt();return}const a=e.target?.closest?.("[data-global-token-search]");if(a&&e.key==="Enter"){e.preventDefault(),Cd(a.value||"");return}if(e.key==="Escape"){if(n.ogreAgentOpen){as();return}if(n.slimeShieldDetails?.open){ei();return}if(n.kolDumpDetails?.open){Ml();return}if(n.replayDetails?.open){ri();return}if(n.protectedBuyModal?.open){ko();return}if(!(!n.loginModalOpen&&!n.quickBuyModal?.open)){if(n.quickBuyModal?.open){_l();return}ic()}}});function Si(e=null,t="interaction"){const a=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!a)return!1;const r=a.dataset.tokenTrade||a.dataset.tokenChart||a.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),i=Number(n.smartChartInteractionPrefetchAt||0),u=n.smartChartInteractionPrefetchSeen||{};if(i&&c-i<vv||Number(u[r]||0)&&c-Number(u[r])<kv)return!1;const d=(n.smartChartInteractionPrefetchRecent||[]).filter(p=>c-Number(p||0)<wv);if(d.length>=Sv)return n.smartChartInteractionPrefetchRecent=d,!1;n.smartChartInteractionPrefetchAt=c,n.smartChartInteractionPrefetchRecent=[...d,c],n.smartChartInteractionPrefetchSeen={...u,[r]:c}}return zl(ge(r,{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t}),{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Si(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Si(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Si(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const om=new WeakMap;function FS(e){let t=om.get(e);if(!t){const a=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(a.overflowY),contained:/contain|none/.test(a.overscrollBehaviorY)},om.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||n.route!=="terminal"||Gn())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const a=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const s=FS(t);if(s.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,i=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(a<0&&c||a>0&&i)||s.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let o=e.deltaY;e.deltaMode===1?o*=40:e.deltaMode===2&&(o*=r.clientHeight),r.scrollTop+=o,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),ei();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),ko();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),Ml();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),ri();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const b=c.closest(".nav-tool-group");n.navTekOpen=!b?.open,Gm(n.navTekOpen),b&&(b.open=n.navTekOpen);return}const i=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!i)return;if(i.matches("[data-tool-section]")){e.preventDefault();const b=i.dataset.toolSection,[A]=b.split(":"),C=b.slice(A.length+1);n.toolSections={...n.toolSections||{},[A]:C};const M=i.closest("[data-tool-panels]");M&&(M.querySelectorAll(`[data-tool-section^="${A}:"]`).forEach(q=>{q.dataset.active=q.dataset.toolSection===b?"true":"false"}),M.querySelectorAll(`[data-tool-panel^="${A}:"]`).forEach(q=>{q.hidden=q.dataset.toolPanel!==b}),to(M));return}if(i.matches("[data-clip-record]")){e.preventDefault(),n.clipFarm?.recording?jn():tu();return}if(i.matches("[data-clip-share]")){e.preventDefault(),fh();return}if(i.matches("[data-clip-download]")){e.preventDefault(),hh();return}if(i.matches("[data-clip-clear]")){e.preventDefault(),il();return}if(i.matches("[data-slimeshield-details]")){e.preventDefault(),i.closest("[data-dev-info-drawer-root]")&&ti(),mp(i.dataset.slimeshieldDetails||"");return}if(i.matches("[data-slimeshield-refresh]")){e.preventDefault(),Uo(i.dataset.slimeshieldRefresh||"",{force:!0});return}if(i.matches("[data-kol-dump-details]")){e.preventDefault(),Eb(i.dataset.kolDumpDetails||"");return}if(i.matches("[data-kol-dump-refresh]")){e.preventDefault(),xl({force:!0});return}if(i.matches("[data-replay-open]")){e.preventDefault(),pw(i.dataset.replayOpen||"");return}if(i.matches("[data-replay-refresh]")){e.preventDefault(),ni(i.dataset.replayRefresh||"",{force:!0});return}if(i.matches("[data-ogre-agent-toggle]")){n.ogreAgentOpen?as():(n.ogreAgentOpen=!0,Oh(),E({force:!0}));return}if(i.matches("[data-ogre-agent-close]")){as();return}if(i.matches("[data-ogre-agent-voice]")){mS(!n.ogreAgentVoiceEnabled);return}if(i.matches("[data-ogre-agent-send]")){Vt(),mt();return}if(i.matches("[data-ogre-agent-mic]")){hS();return}if(i.matches("[data-ogre-agent-quick]")){const b=i.dataset.ogreAgentQuick||"";if(b==="positions"&&zt({type:"open_tab",tab:"positions"}),b==="whats_cooking"&&mt("whats cooking"),b==="my_bags"&&mt("how are my bags"),b==="refresh_feeds"&&zt({type:"refresh_feeds"}),b==="risk"&&mt("Why is this token risky?"),b==="dev_info"&&mt("Explain Dev Info for this token."),b==="protected_buy"&&mt("Should I use Protected Buy?"),b==="replay"&&mt("Replay similar launches for this token."),b==="auto_trade"&&zt({type:"approve_agent_auto_trade"}),b==="clear_chat"){Vt(),es(),n.ogreAgentMessages=[_p()],n.ogreAgentStatus="Chat cleared.",n.ogreAgentDraft="",n.ogreAgentLastTokenMint="";try{localStorage.removeItem(fi),localStorage.removeItem(hi)}catch{}E({force:!0})}return}if(i.matches("[data-ogre-agent-retry]")){const b=Number(i.dataset.ogreAgentRetry),A=String(n.ogreAgentMessages?.[b]?.retryText||"").trim();A&&mt(A);return}if(i.matches("[data-ogre-agent-action]")){const b=i.dataset.ogreAgentAction,C=gS(b)||(n.ogreAgentMessages||[]).flatMap(M=>Array.isArray(M.actions)?M.actions:[]).find(M=>M.key===b||M.label===b||M.type===b);zt(C||{type:b});return}if(i.matches("[data-nav-route]")){e.preventDefault(),$e(i.dataset.navRoute||"/terminal",i.dataset.tab||null);return}if(i.matches("[data-policy]")){e.preventDefault(),window.alert(vf(i.dataset.policy==="privacy"?"privacy":"terms"));return}if(i.matches("[data-top-wallet-connect]")){e.preventDefault(),i.dataset.walletState==="connected"||!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length)?$e("/terminal","wallets"):ua({returnPath:"/terminal"});return}if(i.matches("[data-top-wallet-status]")){e.preventDefault(),await kh();return}if(i.matches("[data-top-refresh-wallet]")){const b=L();Ka("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:"top-refresh-wallet"}),bt({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{jb()&&G(()=>Rl())}).catch(A=>$(A.message));return}if(i.matches("[data-ogre-tek-refresh]")){await gr({force:!0}).catch(b=>$(b.message));return}if(i.matches("[data-ogre-ai-start]")){G(()=>Ly());return}const u=i.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),n.ogreAiCategory=u.dataset.ogreCat||"strong",h({force:!0});return}if(i.closest?.("[data-autopilot-save]")){e.preventDefault(),G(()=>By());return}if(i.matches("[data-ogre-tek-market]")){n.ogreTek.selectedMarket=i.dataset.ogreTekMarket||n.ogreTek.selectedMarket,n.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-side]")){n.ogreTek.direction=i.dataset.ogreTekSide==="short"?"short":"long",n.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-review]")){Qo(),n.ogreTek.reviewOpen=!0,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-close-review]")){n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-confirm-review]")){Qo();const b=Wp();!n.ogreTek.riskAccepted||!b.ok?n.ogreTek.status="Risk confirmation is incomplete.":ke.demoMode?(n.ogreTek.status="Demo review confirmed. No live transaction was submitted.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1):(n.ogreTek.status="Live perps adapter is not wired in this build.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1),h({force:!0});return}if(i.matches("[data-ogre-tek-demo-action]")){const b=i.dataset.ogreTekDemoAction||"action";n.ogreTek.status=`Demo mode: ${b.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(i.matches("[data-toggle-terminal-ticket]")){n.terminalTradeCollapsed=!n.terminalTradeCollapsed,h({force:!0});return}if(i.matches("[data-global-token-open]")){const b=m("[data-global-token-search]")?.value?.trim()||"";b&&Cd(b);return}if(i.matches("[data-token-chart]")){e.preventDefault();const b=i.dataset.tokenChart||i.dataset.previewToken||"";vt(ge(i.dataset.tokenChart||i.dataset.previewToken||"",{source:i.dataset.tokenChartSource||"token-card"}),{defaultTab:i.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!i.closest?.(".live-pair-avatar"),source:i.dataset.tokenChartSource||"token-card"});return}if(i.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const b=i.dataset.tokenTrade||"",A=ln(b);A&&Lo(A)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),vt(ge(i.dataset.tokenTrade||"",{source:i.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:i.dataset.tokenTradeSource||"trade-button"});return}if(i.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),sn(ge(i.dataset.quickBuyToken||"",{source:i.dataset.quickBuySource||"quick-buy-button"}),{source:i.dataset.quickBuySource||"quick-buy-button"});return}if(i.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),i.closest("[data-dev-info-drawer-root]")&&ti();const b=i.dataset.protectedBuySource||"protected-buy",A=!!i.closest("[data-quick-buy-modal-root]"),C=!!i.closest(".chart-trade-panel"),M=i.dataset.protectedBuyOpen||n.quickBuyModal?.tokenMint||n.smartChartToken||n.tradeToken||"";_y(ge(M,{source:b}),{source:b,presetId:i.dataset.protectedBuyPreset||"",amountSol:A?m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||"":C&&m("[data-chart-buy-amount]")?.value||"",walletIndex:A?m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"":C&&m("[data-chart-buy-wallet]")?.value||"",slippageBps:A?m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400":C&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-quick-buy-close]")){e.preventDefault(),_l();return}if(i.matches("[data-protected-buy-close]")){e.preventDefault(),ko();return}if(i.matches("[data-protected-buy-confirm]")){e.preventDefault(),G(()=>Hy());return}if(i.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),n.quickBuyModal={...n.quickBuyModal,amountSol:i.dataset.quickBuyModalPreset||"",status:`${i.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(i.matches("[data-quick-buy-confirm]")){e.preventDefault(),G(()=>zy());return}if(i.matches("[data-preview-token]")){const b=i.dataset.previewToken||"";b&&vt(ge(b,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(i.matches("[data-terminal-subtab]")){n.terminalSubtab=i.dataset.terminalSubtab||"positions",h();return}if(i.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await Ao(i.dataset.positionSell||"",i.dataset.positionSellPercent||"100",{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const b=await Le({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});b&&await Ao(i.dataset.positionSellCustom||"",b,{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-run-tx-audit]")){e.preventDefault(),G(()=>jy());return}if(i.matches("[data-connect-login-toggle]")){rm(i)||dc({connectPanel:!0,source:"connect-lock-in"});return}if(i.matches("[data-login-tab]")){n.loginModalTab=i.dataset.loginTab==="create"?"create":"login",h({force:!0}),lc(!1);return}if(i.matches("[data-connect-password-login]")){await Sc();return}if(i.matches("[data-send-email-code]")){await Ff();return}if(i.matches("[data-web-code-login]")){await Wf();return}if(i.matches("[data-connect-create-account]")){await Xs();return}if(i.matches("[data-connect-create-wallet]")){await qf();return}if(i.matches("[data-web-signup]")&&await Xs(),i.matches("[data-web-password-login]")&&await Sc(),i.matches("[data-close-login]")){ic();return}if(i.matches("[data-web-signup-connect]")){await Uf();return}if(i.matches("[data-open-login]")){rm(i)||dc({connectPanel:n.route==="connect",source:"top-lock-in"});return}if(i.matches("[data-browse-guest]")){n.loginCollapsed=!0,n.route="terminal",n.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),_r("browse-terminal");return}if(i.matches("[data-logout]")&&await Hf(),i.matches("[data-connect-x]")&&await oy(),i.matches("[data-open-x-login]")&&sy(),i.matches("[data-clear-x]")&&await ly(),i.matches("[data-save-login-credentials]")&&await dy(),i.matches("[data-save-referral]")&&await Rd(),i.matches("[data-generate-referral-code]")&&await Rd({generate:!0}),i.matches("[data-save-trader-board]")&&await Qy(),i.matches("[data-use-x-avatar]")&&await uy(),i.matches("[data-clear-avatar]")&&await fo({clear:!0},"Removing PFP..."),i.matches("[data-preset-avatar]")){const b=m("[data-avatar-status]");v(b,"Loading preset PFP...");try{const A=await cy(i.dataset.presetAvatar);await fo({avatarDataUrl:A,avatarSource:i.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(A){v(b,A.message),$(A.message)}}if(i.matches("[data-launch-coin-save]")){Qn();return}if(i.matches("[data-launch-coin-submit]")){await xb();return}if(i.matches("[data-launch-coin-use-ca]")){await Ab();return}if(i.matches("[data-connect-wallet]")){const b=i.dataset.connectWallet||"solana";if(b&&b!=="solana"){await id(b,{returnPath:"/terminal"});return}ua({returnPath:"/terminal"});return}if(i.matches("[data-connect-wallet-provider]")){await id(i.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(i.matches("[data-wallet-connect-close]")){n.walletConnectMenuOpen=!1,h({force:!0});return}if(i.matches("[data-wallet-fast-approvals-toggle]")){eg(!n.walletFastApprovalsEnabled),$(n.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(i.matches("[data-disconnect-wallet]")){await cd();return}if(i.matches("[data-share-x]")&&Ol(i.dataset.shareText||""),i.matches("[data-share-watch-token-btn]")&&ud("token"),i.matches("[data-share-watch-kol-btn]")&&ud("kol"),i.matches("[data-save-preset]")){await Md(i.dataset.savePreset);return}if(i.matches("[data-save-fast-preset]")){await Md(i.dataset.saveFastPreset,"fast");return}if(i.matches("[data-use-preset]")){Jy(i.dataset.usePreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-preset]")){Bd(i.dataset.editPreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-selected-preset]")){const b=i.dataset.editSelectedPreset==="bundle"?"bundle":"trade",A=b==="bundle"?n.selectedBundlePresetId:n.selectedTradePresetId;A&&A!=="custom"?Bd(b,A):oi(b);return}if(i.matches("[data-cancel-preset-edit]")){Zr(i.dataset.cancelPresetEdit,""),h();return}if(i.matches("[data-delete-preset]")){await Yy(i.dataset.deletePreset,i.dataset.presetId||"");return}if(i.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),sn(ge(i.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(i.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),G(()=>xd(i.dataset.quickBundleToken||""));return}if(i.matches("[data-smart-chart-token]")){vt(ge(i.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(i.matches("[data-smart-chart-view]")){const b=i.dataset.smartChartView||"chart";n.smartChartView=["chart","chartTxns","txns","info"].includes(b)?b:"chart",h();return}if(i.matches("[data-chart-trade-tab]")){n.chartTradeTab=i.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),n.chartTradeTab==="buy"&&requestAnimationFrame(()=>m("[data-chart-buy-amount]")?.focus());return}if(i.matches("[data-chart-buy-preset]")){const b=m("[data-chart-buy-amount]");b&&(b.value=i.dataset.chartBuyPreset||""),n.quickBuyAmountOverride=X(i.dataset.chartBuyPreset||""),_o();return}if(i.matches("[data-chart-confirm-buy]")){const b=i.dataset.chartConfirmBuy||n.smartChartToken||"";e.preventDefault(),e.stopPropagation();const A=m("[data-chart-buy-wallet]")?.value||"";if(ce(A)){try{i.dataset.actionState="clicked",i.disabled=!0,await Vy(b)}catch(C){const M=N(C.message||"Chart buy failed."),q=X(m("[data-chart-buy-amount]")?.value||"")||"custom";V("trade-buy",b,String(q),{state:"error",error:M}),Pe("trade-buy",b,String(q),4e3),Fe(M),$(M),le()}return}Fe("Buy queued. Opening wallet approval..."),i.dataset.actionState="clicked",i.disabled=!0,G(async()=>{try{const C=wd();await $o({tokenMint:b,walletIndex:A,amountSol:X(m("[data-chart-buy-amount]")?.value||""),slippageBps:m("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:C.takeProfitPct,stopLossPct:C.stopLossPct,sellDelay:C.sellDelay,sellPercent:C.sellPercent,source:"chart-buy-panel"}),n.chartTradeTab="buy",Fe("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(C){const M=N(C.message||"Chart buy failed.");Fe(M),$(M),h({force:!0,preserveSmartChartFrame:!0})}});return}if(i.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const b=m("[data-chart-sell-percent]")?.value||"";if(b)try{await Ao(i.dataset.chartConfirmSell||"",b,{slippageBps:m("[data-chart-buy-slippage]")?.value||"400"})}catch(A){const C=N(A.message||"Chart sell failed.");Fe(C),$(C)}return}if(i.matches("[data-smart-chart-open]")){const b=String(m("[data-smart-chart-input]")?.value||"").trim();if(!b){$("Paste a token CA first.");return}vt(ge(b,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(i.matches("[data-refresh-feeds]")){G(()=>Xa({force:!0,reason:"manual-refresh-feeds"}));return}if(i.matches("[data-terminal-load-more]")){const b=i.dataset.terminalLoadMore||n.activeTab;jf(b,Rt(b)),Oc(b,{requestId:z(b).lastRequestId||"",status:z(b).lastStatus||"render",reason:"load-more",resultCount:Rt(b),renderedCount:Wn(b),hasMore:Rt(b)>Wn(b),stale:Dn(b),errorCode:z(b).errorCode||"",errorMessage:z(b).errorMessage||""}),h({force:!0});return}if(i.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),iw(i.dataset.devInfo||"");return}if(i.matches("[data-dev-info-close]")){ti();return}if(i.matches("[data-dev-info-refresh]")){const b=i.dataset.devInfoRefresh||n.devInfoDetails?.tokenMint||"";await bp(b,{force:!0});return}if(i.matches("[data-watch-token]")&&await Id("add",i),i.matches("[data-unwatch-token]")&&await Id("remove",i),i.matches("[data-pnl-card]"))try{await pd(i.dataset.pnlCard)}catch(b){$(b.message)}if(i.matches("[data-share-pnl-card]")&&await py(i.dataset.sharePnlCard,i.dataset.shareText||""),i.matches("[data-scan-bags]")){await fv();return}if(i.matches("[data-arm-exits]")){await mv(i.dataset.armExits,i);return}if(i.matches("[data-dev-watch]")){await pv(i.dataset.devWatch);return}if(i.matches("[data-hype-create]")){await yb();return}if(i.matches("[data-push-enable]")){await Kh();return}if(i.matches("[data-push-disable]")){await Vh();return}if(i.matches("[data-call-post]")){await Sw(i.dataset.callPost);return}if(i.matches("[data-telegram-link]")){await qh();return}if(i.matches("[data-trade-trace-close]")){n.tradeTrace=null,os();return}if(i.matches("[data-launch-kit-close]")){n.launchShareKit=null,h();return}if(i.matches("[data-create-wallets]")&&await sd(),i.matches("[data-distribute-fresh]")){await tb();return}if(i.matches("[data-return-funds]")){await eb();return}if(i.matches("[data-sweep-background-wallets]")){await rv();return}if(i.matches("[data-create-automation-wallet]")&&await qb(),i.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await Vb(i);return}if(i.matches("[data-tpsl-status-button]")){i.dataset.tpslState==="enabled"?(n.activeTab="profile",$e("/terminal","profile"),n.automationDelegationStatus=n.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await Bl("enable");return}if(i.matches("[data-automation-permission]")&&await Bl(i.dataset.automationPermission||"enable"),i.matches("[data-run-trade-plans]")&&await Rl(),i.matches("[data-restore-backup]")&&await Jb(),i.matches("[data-export-backup]")&&await Yb(),i.matches("[data-import-wallet]")&&await Qb(),i.matches("[data-remove-wallet]")&&await Zb(i.dataset.removeWallet||"",i.dataset.walletLabel||"",i.dataset.removeWalletKey||""),i.matches("[data-wallet-sweep-action]")&&await ny(i.dataset.walletSweepAction||""),i.matches("[data-download]")){const b=n.downloads?.[i.dataset.download];b&&fe(b.filename,b.text)}if(i.matches("[data-trade-buy-quick]")&&await bo(i.dataset.tradeBuyQuick),i.closest?.("[data-swap-reverse]")){n.swapDirection=n.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(i.matches("[data-swap-use-custom-amount]")){const b=String(m("[data-swap-amount]")?.value||"").trim();n.swapDirection==="sell"?await Fl(b||"100"):await bo(b);return}i.matches("[data-trade-buy-max]")&&await bo(null,"max"),i.matches("[data-trade-buy-custom]")&&await bo(m("[data-buy-custom]")?.value||m("[data-swap-amount]")?.value),i.matches("[data-trade-sell-quick]")&&await Fl(i.dataset.tradeSellQuick),i.matches("[data-trade-sell-custom]")&&await Fl(m("[data-sell-custom]")?.value||m("[data-swap-amount]")?.value),i.matches("[data-trade-plan-start]")&&await ky(),i.matches("[data-volume-start]")&&await Ty();const d=i.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),n.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(b=>{b.dataset.active=String(b===d)});return}const p=i.closest?.("[data-vbot-set-aggr]");if(p){e.preventDefault(),n.slimeBotAggr=p.dataset.vbotSetAggr||"med",p.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(b=>{b.dataset.active=String(b===p)});return}const f=i.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),n.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(b=>{b.dataset.active=String(b===f)});return}if(i.matches("[data-vbot-start]")){e.preventDefault(),await ib();return}const y=i.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await cb(y.dataset.vbotStop||"");return}if(i.matches("[data-sniper-buy]")&&await Py(i.dataset.sniperBuy),i.matches("[data-kol-mode]")){n.kolWallet="",n.kolMode=i.dataset.kolMode||n.kolMode,Z("kol"),await ee("kol",{force:!0,reason:"kol-mode-switch"}).catch(b=>$(b.message));return}if(i.matches("[data-kol-refresh]")){await ee("kol",{force:!0,reason:"manual-kol-refresh"}).catch(b=>$(b.message));return}if(i.matches("[data-kol-wallet-scan]")){if(n.kolWallet=String(m("[data-kol-wallet]")?.value||"").trim(),n.kolWallet&&!Ft(n.kolWallet)){_t("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-wallet-scan"}).catch(b=>$(b.message));return}if(i.matches("[data-kol-scan-wallet]")){if(n.kolWallet=String(i.dataset.kolScanWallet||"").trim(),n.kolWallet&&!Ft(n.kolWallet)){_t("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),n.kolWallet="";return}Z("kol"),await ee("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(b=>$(b.message));return}if(i.matches("[data-kol-copy-setup]")){const b=String(i.dataset.kolCopySetup||"").trim();if(b&&!Ft(b)){_t("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}b&&(n.kolWallet=b),n.activeTab="kol",h(),setTimeout(()=>{const A=document.querySelector("[data-kol-management-settings]");A&&(A.open=!0,A.scrollIntoView({behavior:"smooth",block:"start"}));const C=m("[data-kol-wallet]");C&&b&&(C.value=b);const M=m("[data-kol-status]");M&&v(M,`Copy setup loaded for ${w(b)}. Choose presets, then tap Copy Wallet Next Buy.`),m("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(i.matches("[data-kol-copy]")){await Oy(i.dataset.kolCopy);return}if(i.matches("[data-kol-copy-wallet]")){const b=String(i.dataset.kolCopyWallet||"").trim();if(b&&!Ft(b)){_t("That KOL entry does not have a verified Solana wallet yet.");return}await Ey(i.dataset.kolCopyWallet||"");return}if(i.matches("[data-kol-trade]")){n.tradeToken=i.dataset.kolTrade||"",n.activeTab="trade",h();return}if(i.matches("[data-kol-bundle]")){n.bundleToken=i.dataset.kolBundle||"",n.activeTab="bundle",h();return}if(i.matches("[data-bundle-buy]")&&await Td("buy"),i.matches("[data-bundle-sell]")&&await Td("sell"),i.matches("[data-bundle-plan]")&&await Wy(),i.matches("[data-launch-start]")&&await ev(),i.matches("[data-launch-cancel]")&&await tv(i.dataset.launchCancel),i.matches("[data-use-token]")&&(n.tradeToken=i.dataset.useToken||"",n.volumeToken=i.dataset.useToken||"",n.bundleToken=i.dataset.useToken||"",n.activeTab="trade",h()),i.matches("[data-use-token-bundle]")&&(n.bundleToken=i.dataset.useTokenBundle||"",n.tradeToken=n.bundleToken,n.volumeToken=n.bundleToken,n.activeTab="bundle",h()),i.matches("[data-use-token-volume]")&&(n.volumeToken=i.dataset.useTokenVolume||"",n.tradeToken=n.volumeToken,n.bundleToken=n.volumeToken,n.activeTab="volume",h()),i.matches("[data-refresh-all]")){const b=L();if(Ka("clicked",{startedAt:b}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-b,details:n.activeTab||"terminal"}),!n.user||!n.token)Ve(n.activeTab)?await ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(A=>$(A.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),He("success");else{const A=L();n.activeTab==="positions"?zf({force:!0,reason:"manual-positions-refresh"}).catch(C=>{He("error",{error:N(C?.message||"Position refresh failed")}),$(C.message),h()}):(bt({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(C=>$(C.message)),ee(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(C=>$(C.message))),H("position-refresh-request-start",A,{component:"positions",cacheHit:!1,details:n.activeTab||"terminal"})}}if(i.matches("[data-tab]")){const b=L();if(n.activeTab=i.dataset.tab,n.activeTab==="volume"&&no(),n.activeTab==="ogreAi"&&xy(),n.activeTab==="ogreTek"){n.route="terminal",window.history.pushState({},"","/ogre-tek"),await gr({silent:!0}).catch(M=>$(M.message)),h();return}n.route!=="terminal"&&(n.route="terminal",window.history.pushState({},"","/terminal")),n.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):n.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const A=Ic(n.activeTab);h();const C=ee(n.activeTab,{silent:!0,ifStale:!0,force:!A,reason:"tab-switch"}).catch(M=>$(M.message));A||await C,H("tab-switch",b,{component:"terminal",cacheHit:A,details:n.activeTab})}if(i.matches("[data-refresh-scan]")&&G(()=>ee("sniper",{force:!0,reason:"manual-sniper-refresh"})),i.closest?.("[data-refresh-live-pairs]")){const b=n.activeTab==="slimeScope"?"slimeScope":n.activeTab==="terminal"?"terminal":n.activeTab==="launch"||n.activeTab==="launchCoin"?"launch":"live",C=n.activeTab==="live"||n.activeTab==="terminal"?null:dl();G(async()=>{await ee(b,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),C&&pl(C)})}if(i.closest?.("[data-terminal-filter-toggle]")){const b=Me();b.open=!b.open,h();return}if(i.closest?.("[data-terminal-filter-clear]")){n.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},Z("live"),Z("launch"),Z("sniper"),h();return}i.matches("[data-refresh-watchlist]")&&G(()=>ee("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=i.closest?.("[data-live-pair-bucket]");S&&(n.livePairBucket=S.dataset.livePairBucket||"live",n.livePairs=De(),n.livePairsLastUpdatedAt=ia(),Z("live"),Z("slimeScope"),h(),G(()=>ee(n.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=i.closest?.("[data-slime-scope-mode]");P&&(n.slimeScopeMode=P.dataset.slimeScopeMode||"new",n.activeTab="slimeScope",Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),i.matches("[data-scan-mode]")&&(Z("sniper"),n.scanMode=i.dataset.scanMode||n.scanMode,h(),G(()=>Un(n.scanMode)));const T=i.getAttribute("data-copy");if(T){const b=i.getAttribute("data-copy-label")||i.textContent||"Copy";await navigator.clipboard.writeText(T),v(i,"Copied"),setTimeout(()=>{v(i,b)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(n.replayDetails?.open){ri();return}if(n.kolDumpDetails?.open){Ml();return}if(n.protectedBuyModal?.open){ko();return}if(n.quickBuyModal?.open){_l();return}if(n.walletConnectMenuOpen){n.walletConnectMenuOpen=!1,h({force:!0});return}n.loginCollapsed||(n.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const a=document.querySelector("[data-vbot-manual-wallets]");a&&(a.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(n.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(n.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const a=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(o=>{o.style.display=a?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=a||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(to(),Yg(t)),t?.matches?.("[data-swap-from]")){const a=Oe(t.value||"SOL")||"SOL";n.tradeSwapFrom=a,a!=="SOL"?(n.tradeToken=a,n.tradeSwapTo="SOL"):Oe(n.tradeSwapTo||n.tradeToken||"")||(n.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const a=Oe(t.value||"");if(n.tradeSwapTo=a,a&&a!=="SOL"){n.tradeToken=a,n.swapDirection="buy";const r=m("[data-trade-token]");r&&(r.value=a)}a||m("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){n.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const a=t.value||"";if(a==="custom"){oi("trade");return}if(n.selectedTradePresetId=a,n.fastTradePresetStatus=n.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=oe("trade",n.selectedTradePresetId);n.chartBuyWalletIndex="",r?.amountSol&&(n.quickBuyAmountOverride=X(r.amountSol)),n.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(n.quickBuyAmountOverride=X(t.value),t.value=n.quickBuyAmountOverride,_o()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(n.protectedBuyModal={...n.protectedBuyModal||{},presetId:m("[data-protected-buy-preset]")?.value||n.protectedBuyModal?.presetId||"conservative",walletIndex:m("[data-protected-buy-wallet]")?.value||n.protectedBuyModal?.walletIndex||"",amountSol:X(m("[data-protected-buy-amount]")?.value||n.protectedBuyModal?.amountSol||""),slippageBps:m("[data-protected-buy-slippage]")?.value||n.protectedBuyModal?.slippageBps||"400",riskAccepted:!!m("[data-protected-buy-risk-accept]")?.checked},Ul()),t?.matches?.("[data-fast-bundle-preset]")){const a=t.value||"";if(a==="custom"){oi("bundle");return}n.selectedBundlePresetId=a,n.fastBundlePresetStatus=n.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(n.terminalSort=t.value||"best",Z("live"),Z("slimeScope"),h(),G(()=>It({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){n.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",n.liveFeedCategory)}catch{}n.terminalSort=Lp()[3]||"best",Z("live"),h(),G(()=>It({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){n.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",n.liveTerminalCategory)}catch{}Z("live"),h(),G(()=>It({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){n.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",n.cookSpotCategory)}catch{}Z("slimeScope"),h(),G(()=>ee("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const a=t.files?.[0],r=m("[data-launch-image-preview-wrap]"),o=m("[data-launch-image-preview]"),s=m("[data-launch-image-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);s&&(s.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const i=URL.createObjectURL(a);o&&(o.onload=()=>URL.revokeObjectURL(i),o.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}Xu(a).then(i=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},imageDataUrl:i,imageName:a.name,imageType:rn(i,a.type||"application/octet-stream")},String(i).length<15e5)try{xa(n.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-launch-coin-banner]")){const a=t.files?.[0],r=m("[data-launch-banner-preview-wrap]"),o=m("[data-launch-banner-preview]"),s=m("[data-launch-banner-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);s&&(s.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const i=URL.createObjectURL(a);o&&(o.onload=()=>URL.revokeObjectURL(i),o.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}Ju(a).then(i=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},bannerDataUrl:i,bannerName:a.name,bannerType:rn(i,a.type||"image/jpeg")},String(i).length<15e5)try{xa(n.launchCoinDraft)}catch{}}).catch(i=>{const u=m("[data-launch-coin-status]");u&&v(u,i?.message||"Could not read that banner.")});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const a=Me(),r=t.getAttribute("data-terminal-filter-social"),o=t.getAttribute("data-terminal-filter-quote"),s=t.getAttribute("data-terminal-filter-audit");r&&(a.socials[r]=!!t.checked),o&&(a.quotes[o]=!!t.checked),s&&(a.audits[s]=!!t.checked),a.open=!0,Z("live"),Z("launch"),Z("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(Qo(),n.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(n.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await ry(t),t?.matches?.("[data-avatar-file]")&&await iy(t)}),document.addEventListener("focusout",()=>{setTimeout(Vc,50)});let Ta=null;const sm=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")&&!e.target.matches("[data-launch-coin-banner]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const a=String(e.target.value||"");let r=a.replace(/[^0-9.]/g,"");const o=r.indexOf(".");if(o!==-1&&(r=r.slice(0,o+1)+r.slice(o+1).replace(/\./g,"")),r!==a){const s=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(s-(a.length-r.length),s-(a.length-r.length))}catch{}}}Ta&&clearTimeout(Ta),Ta=setTimeout(()=>{Ta=null,Qn({silent:!0})},350)}};document.addEventListener("input",sm),document.addEventListener("change",sm),document.addEventListener("click",()=>{Ta&&(clearTimeout(Ta),Ta=null,Qn({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){n.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),_o();return}if(t?.matches?.("[data-trade-token]")){const a=String(t.value||"").trim();n.tradeToken=a,n.tradeSwapTo=a;return}if(t?.matches?.("[data-terminal-filter-field]")){const a=t.getAttribute("data-terminal-filter-field"),r=Me();(a==="keywords"||a==="excludeKeywords")&&(r[a]=String(t.value||""),r.open=!0,tp());return}if(t?.matches?.("[data-launch-ticker]")){const a=Me();a.keywords=String(t.value||""),a.open=!0,tp();return}if(t?.matches?.("[data-smart-chart-zoom]")){n.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const a=t.closest(".smart-chart-zoom")?.querySelector("strong");a&&v(a,`${n.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(n.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(Qo(),t.type==="range"&&h({force:!0}))});function br(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",a=jc(t,{forcePaint:!0});Vc(),!a&&e?.persisted&&n.route==="terminal"&&h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),aa&&window.clearTimeout(aa),aa=window.setTimeout(()=>{if(aa=null,!(document.hidden||n.route!=="terminal")){if(Hn()){W({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:n.postTradeRefresh?.attemptId||"",details:n.activeTab||"terminal"});return}ee(n.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),n.user&&n.token&&Dn("positions")&&gt({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:hs}).catch(()=>{}),ca(),_n(),Kr(),el()}},Fi)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(n.ogreAgentListening||n.ogreAgentSpeechRecognizer)&&Vt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(n.ogreAgentOpen&&(n.ogreAgentListening||n.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!n.ogreAgentListening&&!n.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&br()},Fi+900);return}br()}),window.addEventListener("focus",br),window.addEventListener("pageshow",br),window.addEventListener("online",br),window.addEventListener("pagehide",()=>{aa&&(window.clearTimeout(aa),aa=null),n.clipFarm?.recording&&jn()});function WS(){Rs&&window.clearInterval(Rs),Rs=window.setInterval(()=>{document.hidden||jc("watchdog")},Om)}const DS=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Swap & Chart",items:[["trade","Slime Swap"],["smartChart","Smart Chart"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function Aa(e,t){return t=t||"#8dff45",`<svg class="swampi" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="${t}" fill-opacity="0.2" stroke="${t}" stroke-opacity="0.5" stroke-width="1.1"/><g stroke="${t}" stroke-width="1.95">${e}</g></svg>`}const NS={terminal:"#46e8ff",live:"#8dff45",liveTrades:"#ffd24a",smartChart:"#72ff23",trade:"#3fe0d0",slimeScope:"#5ab0ff",watchlist:"#ffd24a",kol:"#ffcf5a",sniper:"#ff6b6b",txAudit:"#bbff63",tek:"#9fb6c2",ogreAi:"#b06bff",launchCoin:"#ff8a5a",bundle:"#ffa64d",volume:"#46e8ff",launch:"#9bff9b",wallets:"#ffd24a",positions:"#5ab0ff",pnl:"#72ff23",profile:"#8dff45"},Pa={terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',live:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',liveTrades:'<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',smartChart:'<path d="M3 17l5-5 4 3 8-9"/><path d="M16 6h4v4"/>',trade:'<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',slimeScope:'<circle cx="11" cy="11" r="6"/><path d="M11 5v2.5"/><path d="M11 14.5V17"/><path d="M5 11h2.5"/><path d="M14.5 11H17"/><circle cx="11" cy="11" r="1.2"/><path d="M15.5 15.5L20 20"/>',watchlist:'<path d="M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.3 9.5l5.2-.8z"/>',kol:'<path d="M4 8l3 9h10l3-9-5 4-3-6-3 6z"/><path d="M7 17h10"/>',sniper:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',txAudit:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/>',tek:'<path d="M15 5a4 4 0 0 1-5.2 5L5 14.8 9.2 19l4.8-4.8a4 4 0 0 1 5-5.2l-2.7 2.7-2.3-.5-.5-2.3z"/>',ogreAi:'<path d="M5 10a7 5 0 0 1 14 0v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M4 8L2.5 6"/><path d="M20 8l1.5-2"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9.5 15l-.7 2.5"/><path d="M14.5 15l.7 2.5"/>',launchCoin:'<path d="M12 3c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 17l-2 4"/><path d="M15 17l2 4"/>',bundle:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v6l8 4 8-4V7"/><path d="M12 11v6"/>',volume:'<path d="M4 13v4"/><path d="M8 9v8"/><path d="M12 5v12"/><path d="M16 10v7"/><path d="M20 13v4"/>',launch:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',wallets:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3"/>',positions:'<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',pnl:'<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',profile:'<path d="M5 12a7 6 0 0 1 14 0v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M9 14.5c1.2 1.4 4.8 1.4 6 0"/>'},_S=Object.fromEntries(Object.entries(Pa).map(([e,t])=>[e,Aa(t,NS[e])])),US={live:Aa(Pa.live,"#8dff45"),chart:Aa(Pa.trade,"#3fe0d0"),intel:Aa(Pa.slimeScope,"#5ab0ff"),tools:Aa(Pa.tek,"#9fb6c2"),portfolio:Aa(Pa.positions,"#5ab0ff"),profile:Aa(Pa.profile,"#8dff45")};function qS(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=DS.map(a=>`
    <div class="nav-drop-group" data-nav-drop-group="${l(a.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${US[a.key]||"•"}</span>
        <span class="nav-side-label">${l(a.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${a.items.map(([r,o])=>`
          <button type="button" data-tab="${l(r)}" title="${l(o)}">
            <span class="nav-side-icon" aria-hidden="true">${_S[r]||"•"}</span>
            <span class="nav-side-label">${l(o)}</span>
          </button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",a=>{const r=a.target.closest(".nav-side-group-toggle");if(r){const o=r.parentElement,s=o.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(c=>c.setAttribute("aria-expanded","false")),s||(o.classList.add("is-open"),r.setAttribute("aria-expanded","true"));return}a.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))}),document.addEventListener("click",a=>{a.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function HS(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(a=>{const r=!!a.querySelector(`[data-tab="${n.activeTab}"]`);a.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),a.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(a=>{a.dataset.active=a.dataset.tab===n.activeTab?"true":"false"})}function KS(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const o=((await fetch("/?build-check=1",{cache:"no-store"}).then(s=>s.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";o&&!e.includes(o)&&VS()}catch{}},300*1e3).unref?.()}function VS(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function zS(){qS(),KS(),pf(),yf(),bf(),Fs(),gf(),n.route==="intro"?ff():Tn({reset:!0}),zh(),WS(),Ws(),Nl(),await _f(),h(),await Kf(),hy(),n.route==="terminal"&&(Xa({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),n.activeTab==="ogreTek"&&await gr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))}zS();function Tt(e){n.pumpLiveStatus=e,n.pumpLiveLastActionAt=Date.now(),h()}function jS(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():n.launchCoinDraft||{},t=Ku(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function GS(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const a=t.getAttribute("data-pump-live-action"),r=jS(),o=r.tokenMint;if(!o){Tt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(a==="chart"){typeof vt=="function"?(vt(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),Tt("Opened Pump chart with transactions inside Slime.")):Tt("Chart panel is still loading. Try again in a moment.");return}if(a==="copy"){const s=Vu(o);navigator.clipboard?.writeText(s).then(()=>Tt("Copied Pump Live stream route ID."),()=>Tt("Stream route ID ready: "+s));return}if(a==="obs"){const s=Cl()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";Tt(s);return}if(a==="end"){Tt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(a==="go"){if(!Cl()){Tt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}Tt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",GS);function jt(e){const t=String(e??"");return typeof l=="function"?l(t):t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function ki(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:n.smartChartToken||{}}function $i(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function XS(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function ss(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function lm(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const a of t){const r=ss(a);if(Number.isFinite(r)&&r>0)return r}return NaN}function JS(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const a=Number(t);if(Number.isFinite(a))return a<1e11?a*1e3:a;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function YS(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function QS(e,t,a){if(!a.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(o=>String(o||"").toLowerCase()).join(" ");return a.some(o=>r.includes(o))}function ZS(e=""){return String(e||"").split("").reduce((t,a)=>t*31+a.charCodeAt(0)>>>0,17)}function ek(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(ss).filter(o=>Number.isFinite(o)&&o>0);if(t.length)return t[0];const a=typeof Ut=="function"?Number(Ut(e)):NaN;if(Number.isFinite(a)&&a>0)return Math.max(1,a*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function zk(e){const t=ki(e),a=$i(t)||t.symbol||t.name||"slime",r=ek(t),o=ZS(a),s=Math.max(1,ss(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,ss(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),i=typeof Ut=="function"?Math.max(0,Math.min(100,Number(Ut(t))||0)):0,u=Math.max(-8,Math.min(18,c/s*18+i/12)),d=Date.now();return Array.from({length:34},(p,f)=>{const y=(f+o%13)/4.2,g=Math.sin(y)*(3.5+o%7*.28),S=(f/33-.5)*u,P=((o>>f%11&7)-3)*.32,T=Math.max(1e-7,r*(1+(g+S+P)/100));return{row:{...t,snapshotFallback:!0},value:T,time:d-(33-f)*15e3,side:"snapshot"}})}function im(e){const t=ki(e),a=[$i(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,i,u)=>c.length>=3&&u.indexOf(c)===i),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:n.liveTrades},{direct:!1,rows:n.liveTradeRows},{direct:!1,rows:n.tradeTape},{direct:!1,rows:n.recentTrades},{direct:!1,rows:n.pumpTrades},{direct:!1,rows:n.pumpActivity},{direct:!1,rows:n.livePairs},{direct:!1,rows:n.livePairsRows},{direct:!1,rows:n.freshPairs},{direct:!1,rows:n.slimeScopePairs}],o=[];for(const c of r){const i=YS(c.rows).slice(-350);for(const u of i){if(!u||typeof u!="object"||!c.direct&&!QS(u,t,a))continue;const d=lm(u);if(!Number.isFinite(d)||d<=0)continue;const p=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();o.push({row:u,value:d,time:JS(u),side:p.includes("sell")?"sell":p.includes("buy")?"buy":"trade"})}}const s=lm(t);return Number.isFinite(s)&&s>0&&o.push({row:t,value:s,time:Date.now(),side:"snapshot"}),o.sort((c,i)=>c.time-i.time).filter((c,i,u)=>i===0||c.time!==u[i-1].time||c.value!==u[i-1].value).slice(-120)}function ls(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function tk(){const e=String(n.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function ak(e={},t={}){const a=ki(e),r=$i(a),o=tk(),s=String(n.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(n.pumpChartTimeframe||"5m"),u=im(a).slice(-70),d=!u.length||u.every(U=>U.side==="snapshot"||U.row?.snapshotFallback),p=u.map(U=>U.value),f=p.length?Math.min(...p):NaN,y=p.length?Math.max(...p):NaN,g=720,S=260,P=22,T=Number.isFinite(y-f)&&y!==f?y-f:1,b=U=>u.length<=1?g/2:P+U/(u.length-1)*(g-P*2),A=U=>S-P-(U-(Number.isFinite(f)?f:0))/T*(S-P*2),C=u.map((U,We)=>`${We?"L":"M"}${b(We).toFixed(1)},${A(U.value).toFixed(1)}`).join(" "),M=u.length>1?`${C} L${b(u.length-1).toFixed(1)},${S-P} L${b(0).toFixed(1)},${S-P} Z`:"",q=Math.max(4,Math.min(12,(g-P*2)/Math.max(u.length*2,1))),J=u.map((U,We)=>{const At=(u[Math.max(0,We-1)]||U).value,de=U.value,ps=Math.max(At,de),ms=Math.min(At,de),vn=b(We),Pi=A(At),Ci=A(de),pm=A(ps),mm=A(ms);return`<g class="slime-pump-candle ${de>=At?"up":"down"}"><line x1="${vn.toFixed(1)}" y1="${pm.toFixed(1)}" x2="${vn.toFixed(1)}" y2="${mm.toFixed(1)}" /><rect x="${(vn-q/2).toFixed(1)}" y="${Math.min(Pi,Ci).toFixed(1)}" width="${q.toFixed(1)}" height="${Math.max(2,Math.abs(Ci-Pi)).toFixed(1)}" rx="2" /></g>`}).join(""),Se=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",Ze=o==="dex"&&Se?`<iframe class="slime-pump-dex-frame" src="${jt(Se)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${g} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${M}" />${s==="candles"?J:`<path class="slime-pump-line" d="${C}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${o==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
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
      <div class="slime-pump-chart-body">${Ze}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${jt(ls(p[p.length-1]))}</strong></div>
        <div><span>Range</span><strong>${jt(Number.isFinite(f)&&Number.isFinite(y)?`${ls(f)} - ${ls(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${jt(d?"Slime snapshot":o==="slime"?"Slime default":o==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function nk(e={}){const t=im(e).slice(-40).reverse(),a=t.map(r=>{const o=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),s=o<60?`${o}s`:`${Math.floor(o/60)}m`,c=r.row||{},i=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${jt(s)}</span><strong>${jt(r.side)}</strong><span>${jt(ls(r.value))}</span><span>${jt(XS(i))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${a||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function cm(){n.slimePumpChartRendering||(n.slimePumpChartRendering=!0,requestAnimationFrame(()=>{n.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),a=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||a||r)&&(e.preventDefault(),e.stopPropagation(),t&&(n.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),a&&(n.pumpChartMode=a.getAttribute("data-slime-pump-mode")||"line"),r&&(n.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),cm())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&cm()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||n.activeTab!=="volume"||!(n.volumeBots||[]).some(t=>t.status!=="completed")||no()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const a=document.querySelector("[data-vbot-invest-num]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const a=document.querySelector("[data-vbot-invest]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-duration]")){const a=document.querySelector("[data-vbot-duration-label]");if(a){const r=Number(t.value);a.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const a=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function o(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function s(){return!!(n?.route==="terminal"&&a.has(String(n.activeTab||"terminal"))&&!document.hidden)}function c(){let p=0;const f=y=>{if(y){if(Array.isArray(y)){p+=y.length;return}if(Array.isArray(y.rows)){p+=y.rows.length;return}Array.isArray(y.data?.rows)&&(p+=y.data.rows.length)}};return f(n.livePairRows),f(n.slimeScopeRows),f(n.liveTradeRows),f(n.livePairs),Object.values(n.livePairsByBucket||{}).forEach(f),Object.values(n.terminalFeeds||{}).forEach(f),p}function i(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const p=[n.livePairsLastUpdatedAt,n.livePairsLastUpdatedByBucket?.[n.livePairBucket||"live"],n.terminalFeeds?.[n.activeTab||"terminal"]?.updatedAt,n.terminalFeeds?.[n.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return p.length?Date.now()-Math.max(...p)>3e4:!1}function d(p="empty-feed-watchdog"){if(!s()||o())return;const f=Date.now();if(f-t<Sn)return;const y=c()===0&&!i();if(!y&&!u())return;t=f;const g=()=>typeof Xa=="function"?Xa({force:y,reason:p}):typeof ee=="function"?ee(n.activeTab||"terminal",{force:y,reason:p}):null;try{typeof G=="function"?G(g):Promise.resolve(g()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),Sn),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),Sn)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),Sn)})})();const R={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[],audio:null,mime:"video/webm"};function Ca(e){return new Promise(t=>{const a=setTimeout(t,e);R.timers.push(a)})}function rk(){return window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad/i.test(navigator.userAgent)}function ok(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{const t=new e;t.resume?.();const a=t.createGain();a.gain.value=.6,a.connect(t.destination);let r=null;try{r=t.createMediaStreamDestination(),a.connect(r)}catch{}return R.audio={ctx:t,master:a,dest:r},R.audio}catch{return null}}function is(e,t,a,r,o){const s=e.gain;s.setValueAtTime(1e-4,t),s.exponentialRampToValueAtTime(Math.max(.001,a),t+r),s.exponentialRampToValueAtTime(1e-4,t+r+o)}function um(e,t=1){const a=R.audio;if(!a)return;const r=a.ctx.createOscillator(),o=a.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,e),r.frequency.exponentialRampToValueAtTime(42,e+.22),is(o,e,.8*t,.006,.3),r.connect(o).connect(a.master),r.start(e),r.stop(e+.45)}function dm(e){const t=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=t.getChannelData(0);for(let r=0;r<a.length;r+=1)a[r]=Math.random()*2-1;return t}function sk(e,t=1.3){const a=R.audio;if(!a)return;const r=a.ctx.createBufferSource();r.buffer=R.noiseBuf||(R.noiseBuf=dm(a.ctx)),r.loop=!0;const o=a.ctx.createBiquadFilter();o.type="bandpass",o.Q.value=1.1,o.frequency.setValueAtTime(250,e),o.frequency.exponentialRampToValueAtTime(5200,e+t);const s=a.ctx.createGain();s.gain.setValueAtTime(1e-4,e),s.gain.exponentialRampToValueAtTime(.3,e+t),s.gain.exponentialRampToValueAtTime(1e-4,e+t+.08),r.connect(o).connect(s).connect(a.master),r.start(e),r.stop(e+t+.2)}function Ti(e,t=!1){const a=R.audio;if(!a)return;um(e,t?1.4:1.1);const r=a.ctx.createBufferSource();r.buffer=R.noiseBuf||(R.noiseBuf=dm(a.ctx));const o=a.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=t?1400:900;const s=a.ctx.createGain();is(s,e,t?.5:.32,.004,t?.9:.5),r.connect(o).connect(s).connect(a.master),r.start(e),r.stop(e+1.4);const c=a.ctx.createOscillator(),i=a.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(64,e),c.frequency.exponentialRampToValueAtTime(28,e+(t?1.4:.8)),is(i,e,t?.7:.4,.01,t?1.5:.85),c.connect(i).connect(a.master),c.start(e),c.stop(e+2)}function lk(e,t=720){const a=R.audio;if(!a)return;const r=a.ctx.createOscillator(),o=a.ctx.createGain();r.type="square",r.frequency.value=t,is(o,e,.12,.004,.12),r.connect(o).connect(a.master),r.start(e),r.stop(e+.2)}function ik(e,t){const a=R.audio;if(!a)return;const r=a.ctx.currentTime+.05;for(let o=0;o<t-.4;o+=.5)um(r+o,.55+.35*(o/t));for(const o of e)sk(r+Math.max(0,o-1.25),1.25),Ti(r+o,!1);Ti(r+t-.35,!0),Ti(r+t+.45,!0)}function ck(){if(document.getElementById("trailer-style"))return;const e=document.createElement("style");e.id="trailer-style",e.textContent=`
    @keyframes twCapIn { 0% { transform: translateX(-50%) scale(1.3); opacity: 0; filter: blur(8px); } 100% { transform: translateX(-50%) scale(1); opacity: 1; filter: blur(0); } }
    @keyframes twFlash { 0% { opacity: 0.45; } 100% { opacity: 0; } }
    @keyframes twPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twGlow { 0%, 100% { text-shadow: 0 0 24px rgba(114,255,35,0.55); } 50% { text-shadow: 0 0 56px rgba(114,255,35,0.95); } }
  `,document.head.appendChild(e)}function cs(){if(R.root)return R.root;ck();const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:7vh;background:linear-gradient(rgba(2,7,2,0.92),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(transparent,rgba(2,7,2,0.94));"></div>
    <div data-trailer-flash style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, rgba(114,255,35,0.55), rgba(114,255,35,0.12) 60%, transparent);opacity:0;"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:max(30px, env(safe-area-inset-bottom, 0px) + 26px);transform:translateX(-50%);text-align:center;opacity:0;max-width:94vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(20px,5.4vw,32px);font-weight:900;letter-spacing:0.04em;animation:twGlow 2.2s infinite;"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,3.4vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.88);text-align:center;padding:22px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:max(10px, env(safe-area-inset-top, 0px));right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>Ai("stopped")),document.body.appendChild(e),R.root=e,e}function us(){const e=cs().querySelector("[data-trailer-flash]");e.style.animation="none",e.offsetWidth,e.style.animation="twFlash 0.55s ease-out forwards"}function ds(e,t=""){const a=cs(),r=a.querySelector("[data-trailer-caption]");a.querySelector("[data-trailer-caption-main]").textContent=e,a.querySelector("[data-trailer-caption-sub]").textContent=t,e?(r.style.animation="none",r.offsetWidth,r.style.animation="twCapIn 0.5s cubic-bezier(0.2,1.4,0.4,1) forwards",r.style.opacity="1"):r.style.opacity="0"}function yr(e){const t=cs().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}function uk(){const e=["video/mp4;codecs=avc1.64001f,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"];for(const t of e)try{if(MediaRecorder.isTypeSupported(t))return t}catch{}return"video/webm"}async function dk(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});R.stream=e;const t=[...e.getVideoTracks()],a=R.audio?.dest?.stream?.getAudioTracks()||[];t.push(...a);const r=new MediaStream(t);R.mime=uk(),R.chunks=[];const o=new MediaRecorder(r,{mimeType:R.mime,videoBitsPerSecond:6e6});return o.ondataavailable=s=>{s.data?.size&&R.chunks.push(s.data)},o.start(1e3),R.recorder=o,e.getVideoTracks()[0]?.addEventListener("ended",()=>Ai("screen-share-ended")),!0}catch{return!1}}function pk(e){const t=R.mime.includes("mp4")?"mp4":"webm",a=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.${t}`,r=URL.createObjectURL(e),o=document.createElement("div");o.setAttribute("data-trailer-result",""),o.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(2,7,2,0.94);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;",o.innerHTML=`
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
  `,o.querySelector("[data-trailer-close]").addEventListener("click",()=>{o.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3)}),o.querySelector("[data-trailer-share]").addEventListener("click",async()=>{try{const s=new File([e],a,{type:R.mime.split(";")[0]});if(navigator.canShare?.({files:[s]})){await navigator.share({files:[s],title:"SlimeWire",text:"SlimeWire - verify before you ape. slimewire.org"});return}}catch{}o.querySelector("a[download]")?.click()}),document.body.appendChild(o)}function mk(){const e=R.recorder;if(!e)return;const t=()=>{try{const a=new Blob(R.chunks,{type:R.mime.split(";")[0]});a.size>0&&pk(a)}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();R.stream?.getTracks().forEach(a=>{try{a.stop()}catch{}}),R.recorder=null,R.stream=null}function Ai(e="done"){if(R.running){R.running=!1,R.timers.forEach(t=>clearTimeout(t)),R.timers=[],mk();try{R.audio?.ctx?.close()}catch{}R.audio=null,R.root?.remove(),R.root=null}}function fk(){const e=n.livePairsByBucket?.live?.rows||n.livePairs?.rows||n.livePairRows||[];return[...e].filter(a=>a?.tokenMint).sort((a,r)=>(Number(r.volume5m)||0)-(Number(a.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(a.bestPickScore||a.score)||0))[0]||e[0]||null}async function hk(e=9e3){const t=Date.now();for(;Date.now()-t<e;){const a=fk();if(a)return a;if(!R.running)return null;await Ca(500)}try{return((await k("/api/web/live-pairs?bucket=live&sort=fresh"))?.livePairs?.rows||[]).find(o=>o?.tokenMint)||null}catch{return null}}async function gk(e,t=4e3){const a=Date.now();for(;Date.now()-a<t;){if(document.querySelector(e))return!0;if(!R.running)return!1;await Ca(250)}return!1}function bk(){return new Promise(e=>{yr(`
      <div style="color:#72ff23;font-weight:900;font-size:clamp(20px,6vw,28px);">🎬 TRAILER MODE</div>
      <div style="color:#d6ffbf;font-size:clamp(13px,3.8vw,16px);margin-top:14px;max-width:420px;line-height:1.5;">
        1. Start your phone's <b>screen recorder</b> now<br>
        (Control Center on iPhone / quick tile on Android)<br>
        2. Come back and tap GO
      </div>
      <button type="button" data-trailer-go style="pointer-events:auto;margin-top:22px;background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:14px 44px;font-weight:900;font-size:18px;cursor:pointer;">GO</button>
      <div style="color:#7d937a;font-size:11px;margin-top:14px;">the performance starts on a 3-2-1 after you tap</div>
    `),R.root.querySelector("[data-trailer-go]")?.addEventListener("click",()=>e(!0),{once:!0})})}async function yk(){if(R.running)return;R.running=!0,cs(),ok();const e=await dk(),t=rk();if(!e&&(await bk(),!R.running))return;$e("/terminal/live-pairs"),yr('<div style="color:#72ff23;font-weight:900;font-size:clamp(18px,5vw,24px);animation:twPulse 1.2s infinite;">locking onto live pairs...</div>');const a=await hk(9e3);if(!R.running)return;const r=3,o=6.5,s=9,c=6.5,i=4.6,u=[r,r+o,r+o+s,r+o+s+c],d=r+o+s+c+i;ik(u,d);const f=(R.audio?.ctx?.currentTime||0)+.05;for(let g=0;g<r;g+=1)lk(f+g,600+g*90);for(let g=r;g>=1;g-=1){if(!R.running)return;yr(`<div style="color:#72ff23;font-size:clamp(64px,22vw,110px);font-weight:900;text-shadow:0 0 30px rgba(114,255,35,0.75);animation:twPulse 1s infinite;">${g}</div>`),await Ca(1e3)}if(yr(""),!R.running)return;us(),ds("FRESH PAIRS. SECONDS OLD.","every pump.fun launch lands here instantly"),await Ca(o*1e3);const y=a?.symbol?`$${String(a.symbol).slice(0,12)}`:"live pair";if(R.running&&a?.tokenMint){us(),$e(`/terminal/chart?token=${encodeURIComponent(a.tokenMint)}`);const g=await gk("iframe[src*='dexscreener'], .smart-chart-terminal iframe, [data-chart] canvas",4500);if(!R.running||(ds("CHARTS WITH A BRAIN",`${y} - live candles, live flow, shield verdict on top`),await Ca((g?s:4)*1e3),!R.running))return;us(),mp(a.tokenMint),ds("TRIPLE-ENGINE RUG CHECK","SlimeShield x Rugcheck x GoPlus - dodge the rug BEFORE you ape"),await Ca(c*1e3),ei()}R.running&&(ds(""),us(),yr(`
    <div style="color:#72ff23;font-size:clamp(38px,11vw,76px);font-weight:900;letter-spacing:0.05em;animation:twGlow 1.6s infinite, twPulse 1.6s infinite;">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(15px,4.4vw,23px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:clamp(10px,3vw,12px);margin-top:26px;">Live market data. Not financial advice.</div>
  `),await Ca(i*1e3),Ai("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),R.running||yk())});
