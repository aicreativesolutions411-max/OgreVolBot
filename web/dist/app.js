import{canSubmitPerpOrder as Pp,createPerpsProvider as Ap,ogreTekRouteStatus as Cp,resolveOgreTekConfig as Lp,shouldShowOgreTekNav as Mp,validatePerpOrder as xp}from"./perps.js";import{smartChartSuggestion as Bp,tradeActionLabelFromPreset as Rp}from"./liveTerminalUi.js";const Sa=window.OGRE_PORTAL_CONFIG||{},Ip=Sa.featureFlags||{};function _(e,t=!0){const n=Ip?.[e];return n==null||n===""?!!t:typeof n=="boolean"?n:["1","true","yes","on"].includes(String(n).toLowerCase())}const zt=Sa.pumpLive||{},we=Lp(Sa),Op=!1,or=Ap(we),Ep=String(Sa.apiBase||"").trim().replace(/\/+$/,""),Fp=window.location.origin.replace(/\/+$/,""),ri="https://ogrevolbot.onrender.com",St=String(Sa.shareUrl||Sa.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",oi=[Ep,window.location.hostname.endsWith("onrender.com")?Fp:"",ri].filter(Boolean);let sr=oi[0]||ri;const ln=6e4,Xo=15e3,jt=1e4,Jo=8e3,cn=8e3,si=new Map,Wp=new Map,it=Wp,Gt=new Set,lr=new Map,lS=new Map,un={},Q=18e4,Yo="slimewireMobileWalletPending",Qo="slimewireMobileWalletPendingBackup",_p="slimewireMobileWalletSession:",li="slimewirePerfLog",ii="slimewireCrashLog",Np="slimewireTerminalFeedLog",ci="slimewireOgreAiRecentMints",ui="slimewireOgreAiFormPreset",Dp=150,Up=1500,qp=1e4,Hp=140,di="live-pairs-inflight",Kp=[1200,4500,1e4],Vp=15e3,pi=650,zp=3500,jp=12e3,Gp=3e4,Xp=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],mi="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",Jp=new Map([...mi].map((e,t)=>[e,t]));function Yp(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function dn(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function Zo(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function fi(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function hi(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function es(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function Qp(){try{const e=JSON.parse(window.localStorage?.getItem(li)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function Zp(){try{const e=JSON.parse(window.localStorage?.getItem(ii)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function gi(){try{const e=JSON.parse(window.sessionStorage?.getItem(ci)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function em(e){const t=[...Array.isArray(e?.plans)?e.plans.map(o=>o?.tokenMint||o?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(o=>o?.tokenMint):[]].map(o=>String(o||"").trim()).filter(Boolean);if(!t.length)return;const n=new Set,r=[...gi(),...t].filter(o=>n.has(o)?!1:(n.add(o),!0)).slice(-30);try{window.sessionStorage?.setItem(ci,JSON.stringify(r))}catch{}}function bi(){try{const e=JSON.parse(window.sessionStorage?.getItem(ui)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function tm(e={}){try{window.sessionStorage?.setItem(ui,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function yi(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),n=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(n||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function am(){try{return JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{return{}}}function vi(e){try{window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(e||{}))}catch{}}function nm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function rm(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function om(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const wi="slimewireIntroCompleteV1";function Si(){try{return window.sessionStorage?.getItem(wi)==="true"}catch{return!1}}function sm(){try{window.sessionStorage?.setItem(wi,"true")}catch{}}function pn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}const a={token:Yp(),user:null,route:Ia(window.location.pathname),activeTab:window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"best",liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"best"}catch{return"best"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"dexTrending"}catch{return"dexTrending"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:Qp(),crashLog:Zp(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:am(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:nm(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:fi(),loginCollapsed:!0};let ka=null,ir="";const ts=new Set;let $a=null,cr="",Ta=null,ur="",Xt=null,Pa=null,Ye=0,Aa=null,dr="",Ca=null,pr="",mr=null,kt=[],fr=null,hr=null,gr=!1,mn=[],as=null,Jt=null,Yt=null,fn=null,ns="",ki=0,lm=0,rs=0,br=null;const yr=new Map,os={},Qt=new Map,La=[];let ss=null,ls=null,is=null,cs=null,us=null,ds=0,ps=new Set,ms=null,Zt=null,vr=null,fs=null,$i=Date.now();function Ma(){return!!(a.slimeShieldDetails?.open||a.devInfoDetails?.open||a.kolDumpDetails?.open||a.replayDetails?.open)}function xa(){ka&&clearTimeout(ka),ka=null,ir=""}function wr(){Ma()||(la(),Ba("details-close"))}function im(e,t){const n=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const i=n(c);i&&!r.has(i)&&r.set(i,c)}let o=e.querySelector(":scope > .signal-header")||null;const s=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const i=n(c);let u=i?r.get(i):null;u?(s.add(i),u.className!==c.className&&(u.className=c.className),u.innerHTML!==c.innerHTML&&(u.innerHTML=c.innerHTML)):u=c,o?o.nextElementSibling!==u&&o.after(u):e.firstElementChild!==u&&e.insertBefore(u,e.firstElementChild),o=u}for(const[c,i]of r)s.has(c)||i.remove()}function cm(e,t){const n=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!n?e.insertBefore(r,e.firstChild):n&&!r?n.remove():n&&r&&n.innerHTML!==r.innerHTML&&(n.innerHTML=r.innerHTML);for(const o of["[data-cooks-best]","[data-cooks-newest]"]){const s=e.querySelector(`:scope > ${o}`),c=t.querySelector(`:scope > ${o}`);if(!c){s&&s.remove();continue}if(!s)return!1;const i=s.querySelector(":scope > .cooks-section-label"),u=c.querySelector(":scope > .cooks-section-label");i&&u&&i.innerHTML!==u.innerHTML&&(i.innerHTML=u.innerHTML);const d=s.querySelector(":scope > .signal-list"),m=c.querySelector(":scope > .signal-list");d&&m?im(d,m):d!==m&&s.replaceWith(c)}return!0}function um(){if(a.activeTab!=="live"&&a.activeTab!=="terminal")return!1;const e=p("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const n=Fe(),r=he(n?.rows||[]),o=en(r);if(!o.length)return!1;const s=Fn(),c=[];if(s){const m=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const b=f.getBoundingClientRect().top;if(b>=80&&b<m){const y=f.getAttribute("data-token-chart")||"";if(y&&c.push({mint:y,top:b}),c.length>=6)break}}}const i=document.createElement("div");i.innerHTML=Hl(o);const u=i.querySelector(".cooks-feed");if((!u||!cm(t,u))&&(t.outerHTML=Hl(o)),s&&c.length){const m=e.querySelector(".cooks-feed");for(const f of c){const b=m?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(b){const y=b.getBoundingClientRect().top-f.top;Number.isFinite(y)&&Math.abs(y)>1&&window.scrollBy(0,y);break}}}const d=e.querySelector(".terminal-title-row span");if(d){const m=Tt.find(([f])=>f===a.livePairBucket)?.[1]||"Live";d.textContent=`${m} | ${o.length} live`}return!0}function Ba(e="live-pairs-batch"){if(e&&ps.add(String(e)),us||ds)return;const t=()=>{const n=Array.from(ps);if(us=null,ps=new Set,ds=0,a.route!=="terminal"||!["terminal","live","slimeScope"].includes(a.activeTab)||Ma()||(E({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(Fe()?.rows)?Fe().rows.length:0,details:n.length?n.slice(-3).join(" | "):e}),(a.activeTab==="live"||a.activeTab==="terminal")&&um()))return;const r=zs();h(),js(r)};us=window.setTimeout(()=>{ds=window.requestAnimationFrame(t)},Hp)}const p=e=>document.querySelector(e);function z(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const v=(e,t)=>{e&&(e.textContent=t)},Le=(e,t)=>{v(p(e),t)},$t=(e,t)=>{const n=p(e);n&&(n.hidden=t)},re=p("[data-app]"),hn=p("[data-login]"),Ti=p("[data-connect]"),hs=p("[data-top-login]"),ke=p("[data-login-modal]"),Pi=p("[data-auth-actions]"),Ai=p("[data-guest-actions]"),Ci=p("[data-session-actions]"),Z=p("[data-dashboard]"),dm=p("[data-error]"),pm=p("[data-dashboard-error]");function ee(e){if(!_("debugPerformanceCounters",!1))return;const t=String(e||"counter");un[t]=Number(un[t]||0)+1,(un[t]<=5||un[t]%25===0)&&console.info("[slimewire_debug_counter]",t,un[t])}const Tt=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],mm=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],gs=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],Ra=[["dexTrending","DEX Trending","Trending across DEX pairs"],["fresh","Fresh Pairs","Newest DEX pairs"],["dexBoosted","DEX Boosted","Paid DEX boosts"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches"],["memeMovers","Meme Coin Movers","Top meme % movers"],["earlyMomentum","Early Momentum","Young pairs building"],["graduating","Graduating","Near pump migration"],["graduated","Graduated","Moved to the open market"]],fm=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],hm=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],gm=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],bm=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],ym=Object.fromEntries(bm.map(e=>[e.tabKey,e])),vm=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function Li(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function Mi(e,t=""){const n=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return Li(n)===Li(t)}function wm(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!Mi(e,t))return t;const n=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return n.includes("phantom")?Fa("phantom"):n.includes("solflare")?Fa("solflare"):n.includes("wallet")||n.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":n.includes("powered-by")||n.includes("wordmark")||n.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":Vl(e?.alt||n||"slimewire")}function xi(e,t="",n="fallback"){try{console.info("[slimewire_image_fallback]",{action:n,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function Sm(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const n=wm(t);if(!n||Mi(t,n)){t.hidden=!0,xi(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=n,xi(t,n,"fallback")}function bs(){bs.installed||(bs.installed=!0,document.addEventListener("error",Sm,!0))}function ys(){if(!ys.started){ys.started=!0;for(const e of vm)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function Ia(e=window.location.pathname){return(e==="/"||e==="")&&Si()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/terminal")?"terminal":"intro"}function km(){if(Si()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let gn=null;function vs(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(gn||(gn=new e),gn.state==="suspended"&&gn.resume().catch(()=>{}),gn):null}catch{return null}}function $m(){const e=vs();if(!(!e||e.state!=="running"))try{const t=e.currentTime,n=1.7,r=Math.floor(e.sampleRate*n),o=e.createBuffer(1,r,e.sampleRate),s=o.getChannelData(0);for(let f=0;f<r;f+=1)s[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=o;const i=e.createBiquadFilter();i.type="bandpass",i.Q.value=.7,i.frequency.setValueAtTime(280,t),i.frequency.exponentialRampToValueAtTime(3400,t+.55),i.frequency.exponentialRampToValueAtTime(170,t+n);const u=e.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(.5,t+.16),u.gain.exponentialRampToValueAtTime(1e-4,t+n),c.connect(i).connect(u).connect(e.destination);const d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(150,t),d.frequency.exponentialRampToValueAtTime(46,t+.95);const m=e.createGain();m.gain.setValueAtTime(1e-4,t),m.gain.exponentialRampToValueAtTime(.38,t+.08),m.gain.exponentialRampToValueAtTime(1e-4,t+1.15),d.connect(m).connect(e.destination),c.start(t),c.stop(t+n),d.start(t),d.stop(t+1.2)}catch{}}function Tm(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),n=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let o=!1,s=null;const c=()=>a.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),i=T=>{t&&(t.dataset.introPhase=T)},u=T=>{r&&(r.textContent=T,r.hidden=!T)},d=()=>{o||(o=!0,s&&(clearTimeout(s),s=null),i("portal"),$m(),sm(),setTimeout(()=>{pn({reset:!0}),Me("/connect")},620))};if(!c()){pn({reset:!0});return}const m=()=>{o||(vs(),n&&n.muted&&(n.muted=!1,n.volume=1,n.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(T=>{document.addEventListener(T,m,{once:!0,passive:!0})}),n&&(n.preload="auto",n.playsInline=!0,n.autoplay=!0,n.setAttribute("autoplay",""),n.setAttribute("playsinline",""),n.disablePictureInPicture=!0,!n.getAttribute("src")&&n.dataset.introSrc&&(n.src=n.dataset.introSrc));const f=T=>{s&&clearTimeout(s),s=setTimeout(()=>{c()&&d()},Math.max(4e3,Math.min(22e3,T)))},b=()=>{if(o||!c())return;const T=g=>{if(!n)return;n.muted=g,n.volume=g?0:1;const A=n.play?.();A?.catch&&A.catch(()=>{g?u(""):T(!0)})};vs(),T(!1)};n?.addEventListener("loadedmetadata",()=>{const T=Number(n.duration);f(Number.isFinite(T)&&T>0?(T+2.5)*1e3:9e3)}),n?.addEventListener("ended",d),n?.addEventListener("error",()=>{f(1500)});let y=!1,S=null;const P=()=>{y||o||!c()||(y=!0,b())};n?(n.readyState>=4?P():(n.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),n.addEventListener("waiting",()=>{!y||o||(S&&clearTimeout(S),S=setTimeout(()=>{c()&&d()},900))}),["playing","timeupdate"].forEach(T=>n.addEventListener(T,()=>{S&&(clearTimeout(S),S=null)}))):P(),f(11e3)}function Bi(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function ws({keepLogin:e=!1}={}){a.walletConnectMenuOpen=!1,e||(a.loginModalOpen=!1),a.quickBuyModal?.open&&(a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""}),Rn()}function Me(e,t=null){const n=C(),r=e||"/terminal";a.route=Ia(r),ws({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.route==="terminal"&&(a.activeTab=t||Bi(r)),a.route!=="intro"&&pn({reset:!0}),window.history.pushState({},"",r),vl(),h(),U("route-change",n,{component:"router",details:r})}window.addEventListener("popstate",()=>{a.route=Ia(),ws({keepLogin:a.route==="login"}),a.route==="login"&&(a.loginModalOpen=!0),a.activeTab=Bi(),a.route!=="intro"&&pn({reset:!0}),vl(),h()});let Ri=!1;function Ss(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Sr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),Ss()}function Pm(e){if(!e)return;const t=!e.open;if(Sr(e),e.open=t,t){const n=e.closest("[data-market-ticker]"),o=e.querySelector("summary")?.getBoundingClientRect?.();if(n&&o){const s=Math.max(10,Math.min(window.innerWidth-10,o.left+o.width/2)),c=Math.max(30,o.bottom+4);n.style.setProperty("--ticker-menu-left",`${Math.round(s)}px`),n.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}Ss()}function Am(){Ri||(Ri=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Sr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Sr(),80);return}const n=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");n&&(e.preventDefault(),e.stopPropagation(),Pm(n.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&Ss()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Sr()}))}function ea(e){return`${sr}${e}`}function C(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function ta(e){try{window.performance?.mark?.(e)}catch{}}function ge(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function Ii(e={}){La.push(e),La.length>10&&La.splice(0,La.length-10),!ss&&(ss=window.setTimeout(()=>{ss=null;const t=La.splice(0,La.length);for(const n of t)try{const r=JSON.stringify(n);if(navigator.sendBeacon){const o=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(ea("/api/web/perf-event"),o))continue}fetch(ea("/api/web/perf-event"),{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function ks(e,t,n){if(n==="perf"&&ls||n==="crash"&&is||n==="feed"&&cs)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},o=window.setTimeout(()=>{n==="perf"&&(ls=null),n==="crash"&&(is=null),n==="feed"&&(cs=null),r()},Up);n==="perf"&&(ls=o),n==="crash"&&(is=o),n==="feed"&&(cs=o)}function E(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&ee("slowApiRequestWarning");const n={at:new Date().toISOString(),route:ge(e.route||a.route||Ia(),40),component:ge(e.component||"",60),action:ge(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ge(e.requestId||"",80),errorCode:ge(e.errorCode||"",60),details:ge(e.details||"",140)};return a.perfLog=[...a.perfLog||[],n].slice(-100),ks(li,()=>a.perfLog,"perf"),(n.durationMs>=Dp||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(n.action))&&Ii(n),n}function U(e,t,n={}){E({...n,action:e,durationMs:C()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",n=""){ta("chartFirstPaint"),E({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!je(n)?.cacheHit,stale:!!je(n)?.stale,details:`${ge(t,20)}:${ge(n,60)}`})};function $s(e={}){const t={at:new Date().toISOString(),route:ge(e.route||a.route||Ia(),40),actionBeforeCrash:ge(e.actionBeforeCrash||a.postTradeRefresh?.action||"",70),errorCode:ge(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ge(e.message||"",160),component:ge(e.component||"",80),requestId:ge(e.requestId||a.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return a.crashLog=[...a.crashLog||[],t].slice(-50),ks(ii,()=>a.crashLog,"crash"),Ii({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Cm(){a.crashInstrumentationInstalled||(a.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||$s({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};$s({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function ct(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function Ts(e="",t="",n=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(n||"").trim()}`}function Qe(e="",t="",n=""){const r=Ts(e,t,n),o=a.tradeActionLocks?.[r];return o&&["clicked","submitting","submitted","confirming"].includes(o.state)?o:null}function q(e="",t="",n="",r={}){const o=Ts(e,t,n),s=a.tradeActionLocks?.[o]||{};a.tradeActionLocks={...a.tradeActionLocks||{},[o]:{...s,action:e,tokenMint:t,detail:n,updatedAt:new Date().toISOString(),...r}},oe()}function $e(e="",t="",n="",r=2400){const o=Ts(e,t,n);window.setTimeout(()=>{const s=a.tradeActionLocks?.[o];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const c={...a.tradeActionLocks||{}};delete c[o],a.tradeActionLocks=c,oe(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},r)}function kr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function Ps(e="",t=""){const n=a.manualSellActions?.[kr(e,t)];return n&&["clicked","submitting","submitted","confirming"].includes(n.state)?n:Object.entries(a.manualSellActions||{}).find(([r,o])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(o?.state))?.[1]||null}function aa(e,t,n={}){const r=kr(e,t),o=a.manualSellActions?.[r]||{};a.manualSellActions={...a.manualSellActions||{},[r]:{...o,tokenMint:e,percent:String(t||o.percent||"100"),updatedAt:new Date().toISOString(),...n}},oe()}function As(e,t,n=2400){const r=kr(e,t);window.setTimeout(()=>{const o=a.manualSellActions?.[r];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const s={...a.manualSellActions||{}};delete s[r],a.manualSellActions=s,oe(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})},n)}function Oa(e,t={}){const n=C(),r=t.startedAt||a.positionRefreshAction?.startedAt||n;a.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(a.positionRefreshAction?.minUntil||0,n+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},oe()}function De(e,t={}){const n=a.positionRefreshAction?.minUntil||0,r=Math.max(0,n-C());fr&&window.clearTimeout(fr),fr=window.setTimeout(()=>{fr=null,Oa(e,t),h(),e==="success"&&window.setTimeout(()=>{a.positionRefreshAction?.state==="success"&&(a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},oe(),h())},900)},r)}function Pt(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function oe(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(s=>{const c=s.dataset.positionSell||"",i=s.dataset.positionSellPercent||"",u=Ps(c,i),d=Pt(s),m=a.manualSellActions?.[kr(c,i)],f=!!u;s.disabled=f,s.dataset.actionState=m?.state||u?.state||"idle",f?m?.state==="submitted"||m?.state==="confirming"?s.textContent="Submitted":s.textContent="Selling...":s.textContent=d});const e=String(a.tradeToken||p("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(s=>{const c=s.dataset.tradeBuyQuick||(s.matches("[data-trade-buy-max]")?"max":"custom"),i=Qe("trade-buy",e,c),u=Pt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-quick-trade-token]").forEach(s=>{const c=s.dataset.quickTradeToken||"",i=Ft(),u=Ne(i)||i?.amountSol||"quick",d=Qe("trade-buy",c,String(u)),m=Pt(s);s.disabled=!!d,s.dataset.actionState=d?.state||"idle",s.textContent=d?d.state==="submitted"?"Submitted":"Buying...":m}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(s=>{const c=s.dataset.tradeSellQuick||"custom",i=Qe("trade-sell",e,c),u=Pt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":"Selling...":u}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(s=>{const c=s.dataset.chartConfirmBuy||a.smartChartToken||"",i=j(p("[data-chart-buy-amount]")?.value||"")||"custom",u=Qe("trade-buy",c,String(i)),d=Pt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(s=>{const c=s.dataset.chartConfirmSell||a.smartChartToken||"",i=p("[data-chart-sell-percent]")?.value||"100",u=Ps(c,i),d=Pt(s);s.disabled=!!u,s.dataset.actionState=u?.state||"idle",s.textContent=u?u.state==="submitted"?"Submitted":"Selling...":d});const t=String(a.bundleToken||p("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(s=>{const c=s.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",i=Qe(c,t,"bundle"),u=Pt(s);s.disabled=!!i,s.dataset.actionState=i?.state||"idle",s.textContent=i?i.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":u});const n=(s,c)=>{const i=Pt(s),u=s.matches?.("[data-top-refresh-wallet]");if(s.dataset.actionState=c,s.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),u){s.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",s.textContent=i||"Refresh";return}c==="clicked"||c==="refreshing"?s.textContent="Refreshing...":c==="success"?s.textContent="Updated":c==="error"?s.textContent="Failed":s.textContent=i},r=a.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(s=>{n(s,r)});const o=a.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(s=>{n(s,o)})}function Lm(){if(!a.perfInstrumentationInstalled){a.perfInstrumentationInstalled=!0,ta("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries())Number(n.duration||0)<50||E({component:"main-thread",action:"long-task",durationMs:n.duration,details:n.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const n of t.getEntries()){const r=Number(n.duration||0);r<80||E({component:"input",action:"interaction-delay",durationMs:r,details:n.name||n.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function Ee(e){return new Promise(t=>setTimeout(t,e))}function W(e="",t={}){const n=String(e||"");return t.preserveSafeError?n:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(n)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":n}async function bn(e,t={},n=ln){const r=new AbortController,o=setTimeout(()=>r.abort(),n);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(o)}}async function Oi(e){try{await bn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:n=ln,preserveSafeError:r=!1,dedupe:o=!0,...s}=t||{},c=String(s.method||"GET").toUpperCase(),i=C(),u=o&&c==="GET"?`${c}:${e}:${a.token?a.token.slice(0,12):"guest"}`:"";if(u&&Qt.has(u))return ee("duplicateApiRequestsPrevented"),E({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),Qt.get(u);const d=(async()=>{const m={"Content-Type":"application/json",...s.headers||{}};a.token&&(m.Authorization=`Bearer ${a.token}`);let f,b=null;try{f=await bn(ea(e),{...s,headers:m,cache:"no-store"},n)}catch(S){b=S,await Oi(sr),await Ee(900);try{f=await bn(ea(e),{...s,headers:m,cache:"no-store"},n)}catch(P){b=P;for(const T of oi)if(T!==sr)try{await Oi(T),f=await bn(`${T}${e}`,{...s,headers:m,cache:"no-store"},n),sr=T;break}catch(g){b=g}if(!f){const T=b?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${T} SlimeWire could not connect right now. Try again in a moment.`)}}}const y=await Ei(f);if(!f.ok||y.ok===!1){const S=r||e==="/api/web/launch/coin"||!!(y.launchAttemptId||y.launch?.launchAttemptId),P=W(y.message||y.launch?.failureReason||y.error||`HTTP ${f.status}`,{preserveSafeError:S}),T=new Error(P);throw T.status=f.status,T.data=y,T.code=y.errorCode||y.launch?.errorCode||y.error||"",T.stage=y.stage||y.launch?.stage||"",T.launchAttemptId=y.launchAttemptId||y.launch?.launchAttemptId||"",T.providerStatus=y.providerStatus||y.launch?.providerStatus||null,f.status===401&&Hm(P),T}return U("api-request",i,{component:"api",details:e,resultCount:Array.isArray(y?.rows)?y.rows.length:0}),y})();return u&&(Qt.set(u,d),d.then(()=>{Qt.get(u)===d&&Qt.delete(u)},()=>{Qt.get(u)===d&&Qt.delete(u)})),d}async function Ei(e){const t=e.headers.get("content-type")||"",n=await e.text();if(!n.trim())return{};try{return JSON.parse(n)}catch{const r=n.toLowerCase(),o=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:o?"payload_too_large":"invalid_api_response",message:o?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function Mm(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function ue(e){e&&(a.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(a.xHandle=ze(e.xHandle),a.xHandle?hi(a.xHandle):es()):a.xHandle||(a.xHandle=fi()))}function $r(e){for(const t of e){const n=vn(t);if(n&&!n.closest("[hidden]"))return String(n.value||"")}for(const t of e){const n=p(t);if(n)return String(n.value||"")}return""}function yn(){const e=p("[data-connect-status]");return e&&!e.closest("[hidden]")?e:vn("[data-login-status]")||e}function vn(e){const t=[...document.querySelectorAll(e)];return t.find(n=>!n.closest("[hidden]")&&n.offsetParent!==null)||t.find(n=>!n.closest("[hidden]"))||t[0]||null}function wn(){return vn("[data-wallet-connect-modal] [data-wallet-connect-status]")||vn("[data-wallet-connect-status]")}function te(e=""){a.walletConnectStatus=String(e||""),v(wn(),a.walletConnectStatus)}function Fi(e="solana"){const t=Re(e);return Ue()?kn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:Hi(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function At(e="solana",t=null,n={}){const r=de(e),o={walletName:Re(e,r),userId:a.user?.id||"",route:a.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...n};try{console.warn("[slimewire_wallet_connect]",o)}catch{}}function Wi(e=a.route==="connect"){window.setTimeout(()=>{const t=a.loginModalOpen?`[data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${a.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";vn(t)?.focus?.()},0)}function xm(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(as=e)}function Bm(){const e=as;as=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function _i({restoreFocus:e=!0}={}){const t=!!a.loginModalOpen;a.loginCollapsed=!0,a.loginModalOpen=!1,h({force:!0}),t&&e&&Bm()}function Rm(){return!ke||ke.hidden||!a.loginModalOpen?[]:[...ke.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function Im(e){if(!a.loginModalOpen||e.key!=="Tab"||!ke||ke.hidden)return!1;const t=Rm();if(!t.length)return!1;const n=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===n?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),n.focus({preventScroll:!0}),!0):!1}function Ea(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Om(e=Ea()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function Ni(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Em(e="unknown"){const t=Date.now();if(t-Number(a.lastLockInClickAt||0)<300)return;a.lastLockInClickAt=t;const n={route:Ni(a.route||Ia(),40),viewport:Math.round(window.innerWidth||0),source:Ni(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(n),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",n)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(n)}).catch(()=>{})}catch{}}function Di({defaultTab:e="login",returnTo:t=Ea(),source:n="unknown",connectPanel:r=a.route==="connect"}={}){if(xm(),Em(n),a.loginModalOpen=!0,a.loginModalTab=e==="create"?"create":"login",a.loginReturnTo=t||Ea(),a.loginCollapsed=!1,a.walletConnectMenuOpen=!1,!ke&&!hs){window.location.assign(Om(a.loginReturnTo));return}h({force:!0}),Wi(r)}function Ui(e={}){Di(e)}function Ue(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function qi(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Fm(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function Hi(e=""){if(!Ue())return"";const t=encodeURIComponent(qi()),n=encodeURIComponent(Fm());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${n}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${n}`:""}function Cs(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Fa(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function Ls(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let n=0n;for(const o of t)n=(n<<8n)+BigInt(o);let r="";for(;n>0n;){const o=Number(n%58n);r=mi[o]+r,n/=58n}for(const o of t){if(o!==0)break;r="1"+r}return r||"1"}function Tr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let n=0n;for(const o of t){const s=Jp.get(o);if(s===void 0)throw new Error("Invalid wallet callback encoding.");n=n*58n+BigInt(s)}const r=[];for(;n>0n;)r.unshift(Number(n&255n)),n>>=8n;for(const o of t){if(o!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Wm(e="phantom",t="",n=a.walletConnectReturnPath||"/terminal",r=""){const o=new URL(n||window.location.pathname||"/terminal",window.location.origin);return o.searchParams.delete("sw_wallet"),o.searchParams.delete("sw_wallet_state"),o.searchParams.delete("sw_wallet_pending"),o.searchParams.delete("phantom_encryption_public_key"),o.searchParams.delete("solflare_encryption_public_key"),o.searchParams.delete("nonce"),o.searchParams.delete("data"),o.searchParams.delete("errorCode"),o.searchParams.delete("errorMessage"),o.searchParams.set("sw_wallet",e),o.searchParams.set("sw_wallet_state",t),r&&o.searchParams.set("sw_wallet_pending",r),o.toString()}function Sn(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function Ki(){try{const e=window.sessionStorage?.getItem(Yo)||window.localStorage?.getItem(Qo)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function _m(e){try{window.sessionStorage?.setItem(Yo,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(Qo,JSON.stringify(e))}catch{}}function Ms(){try{window.sessionStorage?.removeItem(Yo)}catch{}try{window.localStorage?.removeItem(Qo)}catch{}}function Vi(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function kn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function Nm(e="",t={}){const n=kn(e);if(!n)return"";const r=new URL(n);return r.searchParams.set("app_url",qi()),r.searchParams.set("redirect_link",Wm(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function na(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ue()?"mobile":"desktop"}function zi(e=""){return Ue()&&!!kn(e)}function Dm(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Um(e="",t="/terminal"){try{const n=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:ln,body:JSON.stringify({provider:e,intendedRoute:t,platform:na(),browser:Dm()})});return!n.pendingConnectId||!n.stateId||!n.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:n.pendingConnectId,stateId:n.stateId,returnPath:n.intendedRoute||t,dappEncryptionPublicKey:n.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:n.expiresAt||"",serverManaged:!0}}catch(n){return At(e,n,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:na()}),null}}function qm(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const n=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:Ls(r),returnPath:t,dappEncryptionPublicKey:Ls(n.publicKey),dappEncryptionSecretKey:Ls(n.secretKey),createdAt:Date.now(),serverManaged:!1}}async function ji(e="",{returnPath:t=a.walletConnectReturnPath||"/terminal"}={}){if(!zi(e))return!1;const n=await Um(e,t)||qm(e,t);if(!n)return!1;_m(n);const r=Nm(e,n);if(!r)return!1;const o=Re(e);return te(`Opening ${o} mobile connect. Approve in the wallet app, then return to SlimeWire.`),At(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:na()}),window.location.assign(r),!0}function Gi(e=""){const t=Re(e),n=Hi(e);return n?(te(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),At(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:na()}),window.location.href=n,!0):!1}function Xi({requirePassword:e=!1}={}){const t=$r(["[data-connect-login-username]","[data-login-username]"]).trim(),n=$r(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!n&&!e)return{};if(!t)throw new Error("Enter your username.");if(!n)throw new Error("Enter your password.");return{username:t,password:n}}function Hm(e=""){a.token="",a.user=null,a.loading=!1,Zo(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function G(e=null,t="Creating secure web profile..."){if(a.user&&a.token)return a.user;v(e,t);const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:yi()})});return a.token=n.token,ue(n.user),dn(a.token),a.user}function $(e=""){[dm,pm].forEach(t=>{t&&(t.hidden=!e,v(t,e))})}function X(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Km(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Ji(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function xs(){$("");const e=yn();try{const t=Xi();v(e,t.username?"Creating saved login...":"Creating account...");const n=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:yi()})});a.token=n.token,ue(n.user),dn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,t.username?"Account created. Login saved.":"Quick web account created."),H(n.trade?.signature,"account-create")}catch(t){v(e,t.message),$(t.message)}}async function Yi(){$("");const e=yn();try{const t=Xi({requirePassword:!0});v(e,"Logging in...");const n=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});a.token=n.token,ue(n.user),dn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,"Logged in."),H(n.trade?.signature,"password-login")}catch(t){v(e,t.message),$(t.message)}}function Qi(){return $r(["[data-connect-login-email]","[data-login-email]"]).trim()}function Vm(){return $r(["[data-connect-login-code]","[data-login-code]"]).trim()}function Zi(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function zm(){$("");const e=yn();try{const t=Zi(Qi());v(e,"Sending login code...");const n=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});v(e,n.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){v(e,t.message),$(t.message)}}async function jm(){$("");const e=yn();try{const t=Zi(Qi()),n=Vm();if(!n)throw new Error("Enter the login code from your email.");v(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:n})});a.token=r.token,ue(r.user),dn(a.token),a.loginCollapsed=!0,a.loginModalOpen=!1,a.activeTab="dashboard",v(e,"Logged in."),H(r.trade?.signature,"email-code-login")}catch(t){v(e,t.message),$(t.message)}}function ec(e="",t=new URLSearchParams){const n=Ki(),r=t.get("sw_wallet_state")||"";if(!n.stateId||n.stateId!==r||n.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(n.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const o=t.get(Vi(e))||"",s=t.get("nonce")||"",c=t.get("data")||"";if(!o||!s||!c)throw new Error("Wallet approval did not return the expected connection data.");const i=window.nacl;if(!i?.box?.before||!i.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const u=i.box.before(Tr(o),Tr(n.dappEncryptionSecretKey)),d=i.box.open.after(Tr(c),Tr(s),u);if(!d)throw new Error("Unable to verify the wallet approval response.");const m=JSON.parse(new TextDecoder().decode(d)),f=String(m.public_key||m.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(m.session||""),walletEncryptionPublicKey:o,dappEncryptionPublicKey:n.dappEncryptionPublicKey,returnPath:n.returnPath||"/terminal"}}async function tc(e="",t={}){const n=wn();await G(n,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:Re(e)})});ue(r.user||{...a.user,connectedWallet:r.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:Re(e),tokens:[]};try{window.sessionStorage?.setItem(`${_p}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}Ms(),Sn(),a.walletConnectMenuOpen=!1,te(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),Me(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Ar("mobile-wallet-connect")}function Gm(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||Ki().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(n=>n!=="data"&&n!=="nonce"),walletEncryptionPublicKey:t.get(Vi(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function Xm(e="",t={}){t.token&&(a.token=t.token,dn(a.token)),ue(t.user||{...a.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const n=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";n&&(a.connectedWalletBalance={publicKey:n,shortPublicKey:w(n),provider:t.provider||Re(e),tokens:[]}),Ms(),Sn(),a.walletConnectMenuOpen=!1,te(n?`Connected ${w(n)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),Me(t.finalRedirectRoute||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Ar("mobile-wallet-callback")}async function ac(e="",t=new URLSearchParams){const n=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:ln,body:JSON.stringify(Gm(e,t))});return await Xm(e,n),!0}async function Jm(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;a.walletConnectMenuOpen=!0;const n=Re(t),r=e.get("sw_wallet_pending")||"",o=e.get("errorCode")||"",s=e.get("errorMessage")||"";if(o||s)return r&&await ac(t,e).catch(()=>{}),Ms(),Sn(),te(`${n} did not connect: ${s||o||"request cancelled"}. Choose another wallet or try again.`),At(t,new Error(s||o||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:na()}),h({force:!0}),!0;try{if(te(`Finishing ${n} mobile connection...`),r)await ac(t,e);else{const c=ec(t,e);await tc(t,c)}}catch(c){if(r)try{const i=ec(t,e);await tc(t,i)}catch{te(`${n} mobile connection could not finish: ${c.message}`),At(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:na()}),Sn(),h({force:!0})}else te(`${n} mobile connection could not finish: ${c.message}`),At(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:na()}),Sn(),h({force:!0})}return!0}async function Ym(){$("");const e=wn()||yn();try{v(e,"Choose a wallet provider to connect."),ia({returnPath:"/terminal"})}catch(t){v(e,t.message),$(t.message)}}async function Qm(){a.user||await xs(),a.user&&(a.walletConnectMenuOpen=!1,a.route="terminal",a.activeTab="wallets",a.toolSections={...a.toolSections||{},wallets:a.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),a.wallets.length||await ku())}async function Zm(){if(a.logoutPending)return;if(!a.user){a.loginCollapsed=!1,h(),hn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await pu("logging out");const e=String(a.token||"");a.logoutPending=!0;const t=p("[data-logout]");t&&(t.disabled=!0,v(t,"Logging out...")),a.token="",a.user=null,a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="",a.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},a.manualSellActions={},a.tradeActionLocks={},a.ogreAgentStatus="",Xl(),Zo(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{a.logoutPending=!1}}async function ef(){if(!a.token){h();return}try{const e=await k("/api/web/me");ue(e.user),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),We({force:!1,deep:!1,reason:"session-load"}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})})}catch{a.token="",Zo(),h()}}async function ra(e={}){const t=C();if(!a.user||!a.token){a.wallets=[],a.balances=[],a.positions=[],a.pnl=null,a.connectedWalletBalance=null,a.launchWatches=[],a.presets={trade:[],bundle:[]},a.tradePlans=[],a.watchlist={rows:[],count:0},h();return}const n=!e.silent;n&&(a.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[b,y,S,P,T]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.pnl=b.pnl||null,a.launchWatches=y.watches||[],a.presets=S.presets||{trade:[],bundle:[]},Uu(),a.watchlist=P.watchlist||{rows:[],count:0},a.tradePlans=T.plans||[],Jr();return}const[o,s,c,i,u,d,m,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);a.wallets=o.wallets||[],a.balances=s.balances||[],a.connectedWalletBalance=s.connectedWallet||c.connectedWallet||null,a.positions=c.positions||[],a.pnl=i.pnl||null,a.launchWatches=u.watches||[],a.presets=d.presets||{trade:[],bundle:[]},Uu(),a.watchlist=m.watchlist||{rows:[],count:0},a.tradePlans=f.plans||[],Jr(),e.force&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="")}finally{U("load-all",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e.skipCore?"skip-core":"core"}),n&&(a.loading=!1),h()}}async function Bs(e={}){if(!a.user||!a.token)return;const t=C(),n=e.requestId||0,r=()=>n&&a.walletRefreshRequestId!==n,o=e.force?"?force=true":"",s=e.force||e.deep?"?force=true":"",c=e.timeoutMs||ln,i=k("/api/web/wallets",{timeoutMs:c}),u=k(`/api/web/balances${o}`,{timeoutMs:c}),d=k("/api/web/trade/plans",{timeoutMs:c}),m=await u;if(r())return;a.balances=m.balances||[],a.connectedWalletBalance=m.connectedWallet||null,a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("wallet-refresh",t,{component:"wallet",resultCount:a.balances.length,cacheHit:!!m.cacheHit,details:`wallets=${a.wallets.length};connected=${!!a.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,b]=await Promise.all([i.then(y=>({ok:!0,wallets:y})).catch(y=>({ok:!1,error:y})),d.then(y=>({ok:!0,tradePlans:y})).catch(y=>({ok:!1,error:y}))]);if(!r()&&(f.ok&&(a.wallets=f.wallets.wallets||a.wallets||[]),b.ok&&(a.tradePlans=b.tradePlans.plans||a.tradePlans||[],Jr()),e.progress!==!1&&(f.ok||b.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const y=C(),S=k(`/api/web/positions${s}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await S;if(P?.__error)throw P.__error;if(r())return;a.connectedWalletBalance=P.connectedWallet||a.connectedWalletBalance||null,a.positions=P.positions||[],a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("positions-refresh",y,{component:"positions",resultCount:a.positions.length,cacheHit:!!P.cacheHit,details:`open=${a.positions.length}`})}catch(P){a.walletRefreshError=P.message||"Position refresh failed.",U("positions-refresh",y,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(P?.message||"Position refresh failed.")})}}}function nc(e=a.positions){return(Array.isArray(e)?e:[]).some(t=>{const n=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!n&&/refreshing|updating|background/i.test(t?.valueError||""))})}function rc(e=120,t="positions-value-followup"){!a.user||!a.token||(hr&&window.clearTimeout(hr),hr=window.setTimeout(()=>{hr=null,Ct({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:jt}).then(n=>{n?(a.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:a.activeTab==="smartChart"})):Pr(`${t}-failed`)}).catch(()=>Pr(`${t}-failed`))},Math.max(0,Number(e)||0)))}function tf(e=[],t=[],n={}){const r=new Map((Array.isArray(t)?t:[]).map(o=>[String(o?.tokenMint||""),o]));return(Array.isArray(e)?e:[]).map(o=>{const s=r.get(String(o?.tokenMint||""));if(!s||n.fast===!1)return o;const c=!!(o?.valuePending||/refreshing|updating|background/i.test(o?.valueError||"")),i=s.estimatedValueSol!==null&&s.estimatedValueSol!==void 0&&s.estimatedValueSol!=="";return!c||!i?o:{...o,estimatedValueSol:s.estimatedValueSol,openPnlSol:s.openPnlSol,openPnlPercent:s.openPnlPercent,valuePending:!1,valueError:""}})}function Pr(e="positions-value-refresh-delayed"){let t=!1;return a.positions=(Array.isArray(a.positions)?a.positions:[]).map(n=>{const r=n?.estimatedValueSol!==null&&n?.estimatedValueSol!==void 0&&n?.estimatedValueSol!=="";return!(n?.valuePending||/refreshing|updating|background/i.test(n?.valueError||""))?n:(t=!0,{...n,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(U("positions-value-refresh-cleanup",C(),{component:"positions",details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):!1}function oc(e="portfolio-supplemental"){if(!a.user||!a.token)return;const t=C();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:jt}),k("/api/web/pnl?force=true",{timeoutMs:jt,dedupe:!1})]).then(([n,r])=>{n.status==="fulfilled"&&(a.balances=n.value.balances||a.balances||[],a.connectedWalletBalance=n.value.connectedWallet||a.connectedWalletBalance||null),r.status==="fulfilled"&&(a.pnl=r.value.pnl||a.pnl||null),a.lastWalletRefreshAt=new Date().toISOString(),U("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:e}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}).catch(()=>{})}async function Ct(e={}){if(!a.user||!a.token)return;const t=C(),n=new URLSearchParams;e.force&&n.set("force","true"),e.fast!==!1&&n.set("fast","true");const r=n.toString()?`?${n.toString()}`:"",o=r||"full";if(fn&&ns===o)return fn;const s=++rs;return ns=o,fn=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?jt:Jo)});return rs!==s?!1:(a.connectedWalletBalance=c.connectedWallet||a.connectedWalletBalance||null,a.positions=tf(c.positions||a.positions||[],a.positions||[],e),a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshError="",U("positions-refresh",t,{component:"positions",resultCount:a.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&nc(a.positions)&&rc(120,`${e.reason||"positions"}-values`),e.syncPnl&&oc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(a.walletRefreshError=c.message||"Position refresh failed."),U("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(c?.message||"Position refresh failed.")}),!1}finally{rs===s&&(fn=null,ns="")}})(),fn}async function af(e={}){if(!a.user||!a.token){$("Connect your wallet before refreshing positions."),De("error",{error:"Wallet not connected"});return}const t=C();Oa("refreshing",{startedAt:a.positionRefreshAction?.startedAt||t}),a.walletRefreshError="",Le("[data-sync-health]",Rr()),oe(),await Ee(20);try{if(!await Ct({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:jt}))throw new Error(a.walletRefreshError||"Position refresh failed.");a.lastWalletRefreshAt=new Date().toISOString(),De("success",{error:""}),oc(`${e.reason||"positions-only"}-balances-pnl`),nc(a.positions)&&rc(120,`${e.reason||"positions-only"}-full-values`),U("positions-only-refresh",t,{component:"positions",resultCount:a.positions.length,details:e.reason||"positions-only"})}catch(n){const r=n?.message||"Position refresh failed.";a.walletRefreshError=r,De("error",{error:W(r)}),$(r),U("positions-only-refresh",t,{errorCode:n?.code||n?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:W(r)})}finally{h()}}function $n(){return String(a.smartChartToken||a.tradeToken||a.bundleToken||a.volumeToken||a.terminalToken||"").trim()}function qe(e=a.activeTab){return ym[e]||null}function Wa(e=qe()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",Cn(a.livePairBucket)).replace("{sort}",String(a.terminalSort||"best")).replace("{scopeMode}",String(a.slimeScopeMode||"new")).replace("{kolMode}",String(a.kolMode||"hot")).replace("{kolWallet}",a.kolWallet?w(a.kolWallet):"global").replace("{scanMode}",String(a.scanMode||"safe")).replace("{tokenMint}",$n()?w($n()):"none")}function sc(e=a.activeTab,t="pageSize",n=25){const r=qe(e),o=Number(r?.[t]);return Number.isFinite(o)&&o>0?o:n}function _a(e=a.activeTab){return sc(e,"pageSize",25)}function Rs(e=a.activeTab){return Math.max(_a(e),sc(e,"maxPageSize",_a(e)))}function lc(e=a.activeTab){return!!qe(e)?.supportsPagination}function Is(e=a.activeTab){const t=qe(e)||{tabKey:e};return`${e}:${Wa(t)}`}function Tn(e=a.activeTab,t=0){const n=Is(e),r=_a(e),o=Rs(e),s=Number(a.terminalFeedVisibleLimits?.[n]||0),c=Number.isFinite(s)&&s>0?s:r,i=Number(t||0),u=Math.min(Math.max(r,c),o);return i>0?Math.min(u,i):u}function J(e=a.activeTab){const t=Is(e);if(!a.terminalFeedVisibleLimits?.[t])return;const n={...a.terminalFeedVisibleLimits||{}};delete n[t],a.terminalFeedVisibleLimits=n}function nf(e=a.activeTab,t=0){const n=Is(e),r=Tn(e,t),o=_a(e),s=Rs(e),c=Number(t||0),i=Math.min(s,c>0?c:s,r+o);return a.terminalFeedVisibleLimits={...a.terminalFeedVisibleLimits||{},[n]:i},i}function Ze(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return n.slice(0,Tn(e,n.length))}function rf(e=a.activeTab,t=[]){const n=Array.isArray(t)?t:[];return lc(e)&&n.length>Tn(e,n.length)}function oa(e=a.activeTab,t=[],n="rows"){const r=Array.isArray(t)?t:[];if(!rf(e,r))return"";const o=Tn(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${l(o)} of ${l(r.length)} ${l(n)} shown</small>
      <button type="button" data-terminal-load-more="${l(e)}">Load More</button>
    </div>
  `}function K(e=a.activeTab){return a.terminalFeeds[e]||{}}function ic(e=a.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?sa():e==="kol"?a.kolLastUpdatedAt||"":e==="watchlist"?K("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?a.lastWalletRefreshAt||K(e).lastFetchAt||"":K(e).lastFetchAt||""}function Lt(e=a.activeTab){return e==="terminal"?Number(Fe()?.rows?.length||0)+Number(a.kolScan?.rows?.length||0):e==="live"?Number(Fe()?.rows?.length||0):e==="liveTrades"?Number(a.pnl?.trades?.length||0):e==="slimeScope"?Number(Pd?.(a.slimeScopeMode)?.length||0):e==="kol"?Number(a.kolScan?.rows?.length||0):e==="watchlist"?Number(a.watchlist?.rows?.length||0):e==="smartChart"?$n()?1:Number(Xn?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?$n()?1:0:e==="sniper"?Number(a.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(a.launchWatches?.length||0):e==="wallets"?Number(a.wallets?.length||0)+Number(a.balances?.length||0):e==="positions"?Number(a.positions?.length||0):e==="pnl"?Number(a.pnl?.trades?.length||0):e==="ogreAi"?a.ogreAiResult?1:0:e==="ogreTek"?Number(a.ogreTek?.markets?.length||0)+Number(a.ogreTek?.positions?.length||0):0}function Pn(e=a.activeTab){const t=Lt(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,Tn(e,t)):t}function An(e=a.activeTab){const t=qe(e);if(!t)return!1;const n=Date.parse(ic(e)||"");return Number.isFinite(n)?Date.now()-n>Number(t.staleMs||3e4):!0}function cc(e=a.activeTab){return Lt(e)>0||!!ic(e)}function of(e=a.activeTab,t={}){const n=qe(e)||{};return{tabKey:e,label:n.label||e,category:n.category||"unknown",endpoint:n.endpoint||"",cacheKey:Wa(n),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Pn(e)??0),pageSize:_a(e),maxPageSize:Rs(e),supportsPagination:lc(e),hasMore:!!(t.hasMore??Lt(e)>Pn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function uc(e=a.activeTab,t={}){const n=of(e,t);if(a.terminalFeedLog=[...a.terminalFeedLog||[],n].slice(-20),ks(Np,()=>a.terminalFeedLog,"feed"),n.status==="error"||n.status==="timeout"||/manual|post-trade|visibility|resume/i.test(n.reason||"")||!!(n.stale&&n.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(n)}).catch(()=>{})}catch{}return n}function sf(e=a.activeTab,t={}){const n=qe(e);if(!n)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return a.terminalFeeds={...a.terminalFeeds,[e]:{...K(e),label:n.label,category:n.category,endpoint:n.endpoint,cacheKey:Wa(n),refreshMs:n.refreshMs,staleMs:n.staleMs,pageSize:n.pageSize,maxPageSize:n.maxPageSize,supportsPagination:!!n.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function Os(e=a.activeTab,t="",n="success",r={}){const o=qe(e);if(!o)return;const s=Lt(e),c=Pn(e),i={...K(e),label:o.label,category:o.category,endpoint:o.endpoint,cacheKey:Wa(o),refreshMs:o.refreshMs,staleMs:o.staleMs,pageSize:o.pageSize,maxPageSize:o.maxPageSize,supportsPagination:!!o.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:n,lastFetchAt:new Date().toISOString(),resultCount:s,renderedCount:c,hasMore:s>c,stale:n!=="success"||An(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};a.terminalFeeds={...a.terminalFeeds,[e]:i},uc(e,{requestId:t,status:n,reason:i.lastReason,resultCount:s,renderedCount:c,hasMore:i.hasMore,stale:i.stale,errorCode:i.errorCode,errorMessage:i.errorMessage})}function lf(e=a.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function cf(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function Y(e=a.activeTab,t={}){const n=C(),r=qe(e);if(!r)return null;if(t.ifStale&&cc(e)&&!An(e)||K(e).inFlight)return K(e);const o=cf(t),s=Date.now(),c=Number(si.get(e)||0);if(!o&&c&&s-c<cn)return K(e);if(lf(e)&&!a.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return Os(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),K(e);si.set(e,s);const i=sf(e,t);if(o&&t.renderStart!==!1){const u=a.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:u})}try{if(e==="terminal"){const u=[Mt({silent:!0,force:!!t.force})];a.kolWallet||u.push(Br(a.kolMode,"",{silent:!0})),await Promise.allSettled(u)}else if(e==="live")await Lr({silent:t.silent!==!1,bucket:a.livePairBucket,force:!!t.force});else if(e==="liveTrades")a.user&&a.token&&await ra({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const u=[Mt({silent:!0,force:!!t.force}),Mn(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];a.kolScan||u.push(Br(a.kolMode,a.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(u)}else if(e==="kol")await Br(a.kolMode,a.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await mc({silent:t.silent!==!1});else if(e==="sniper")await Mn(a.scanMode,{silent:t.silent!==!1});else if(e==="positions")a.user&&a.token&&await Ct({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:Jo});else if(["wallets","pnl"].includes(e))a.user&&a.token&&await We({force:!!t.force,deep:!1});else if(e==="smartChart")a.user&&a.token&&await We({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const u=[Mt({silent:!0,force:!!t.force})];a.user&&a.token&&u.push(ra({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else if(e==="launch"||e==="launchCoin"){const u=[Mt({silent:!0,force:!!t.force})];a.scan||u.push(Mn(a.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),a.user&&a.token&&u.push(ra({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(u)}else e==="ogreTek"&&await nr({silent:!0}).catch(u=>{a.ogreTek.error=u.message});return Os(e,i,"success"),K(e)}catch(u){if(Os(e,i,"error",{errorCode:u?.code||u?.name||"REFRESH_FAILED",errorMessage:W(u?.message||"Feed refresh failed.")}),t.throwOnError)throw u;return K(e)}finally{U("feed-refresh",n,{component:r.component||e,resultCount:Lt(e),cacheHit:!!K(e).cacheHit,stale:An(e),requestId:K(e).lastRequestId||"",errorCode:K(e).errorCode||"",details:`${e}:${Wa(r)}`}),t.render!==!1&&(!o&&Ns()?wc():h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"&&e==="smartChart"}))}}async function Na(e={}){const t=a.activeTab||"terminal",n=[Y(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(n)}function Ar(e="terminal-entry"){a.route==="terminal"&&(Na({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),a.user&&a.token&&We({force:!0,deep:!1,reason:e}).catch(t=>{a.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:a.activeTab==="smartChart"})}))}function Es(){const e=()=>{Ca&&clearTimeout(Ca),Ca=null,pr=""};if(a.route!=="terminal"||document.hidden){e();return}const t=qe(a.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(a.activeTab)){e();return}const n=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${a.activeTab}:${Wa(t)}:${n}`;Ca&&pr===r||(e(),pr=r,Ca=setTimeout(async()=>{Ca=null,pr="",!(a.route!=="terminal"||document.hidden)&&(await Y(a.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(o=>$(o.message)),Es())},n))}function Cn(e){const t=String(e||"live");return Tt.some(([n])=>n===t)?t:"live"}function dc(e=a.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Cr(e=a.activeTab){return e==="slimeScope"?dc(a.slimeScopeMode):Cn(a.livePairBucket)}function Fe(e=Cr()){const t=Cn(e);return a.livePairsByBucket[t]||(t===a.livePairBucket?a.livePairs:null)||null}function sa(e=Cr()){const t=Cn(e);return a.livePairsLastUpdatedByBucket[t]||(t===a.livePairBucket?a.livePairsLastUpdatedAt:"")||""}function pc(e=[]){return Array.isArray(e)&&e.length>0}function xe(e={},t={},n=[]){for(const r of n){const o=e?.[r];if(o!=null&&o!=="")return o}for(const r of n){const o=t?.[r];if(o!=null&&o!=="")return o}return""}function uf(e=[],t=[]){const n=new Map((Array.isArray(e)?e:[]).map(r=>[pa(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const o=n.get(pa(r));return o?{...o,...r,tokenMint:xe(r,o,["tokenMint","mint","tokenAddress","address"]),mint:xe(r,o,["mint","tokenMint","tokenAddress","address"]),symbol:xe(r,o,["symbol","ticker","shortMint"]),name:xe(r,o,["name","tokenName","category"]),imageUrl:xe(r,o,["imageUrl","image","icon","logoURI","logoUrl"]),image:xe(r,o,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:xe(r,o,["avatarUrl","avatar_url","avatar"]),avatarState:xe(r,o,["avatarState"]),dexUrl:xe(r,o,["dexUrl","url"]),pumpUrl:xe(r,o,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:xe(r,o,["websiteUrl","website"]),twitterUrl:xe(r,o,["twitterUrl","xUrl"]),telegramUrl:xe(r,o,["telegramUrl"]),metadata:r?.metadata||o?.metadata||r?.tokenMetadata||o?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||o?.tokenMetadata||r?.metadata||o?.metadata||null,dex:r?.dex||o?.dex||r?.dexScreener||o?.dexScreener||null,pump:r?.pump||o?.pump||r?.pumpFun||o?.pumpFun||null}:r})}async function Lr({silent:e=!1,bucket:t=a.livePairBucket,renderOnComplete:n=!0,force:r=!1}={}){const o=C(),s=Cn(t),c=s===a.livePairBucket,i=a.terminalSort||"best",u=`${s}:${i}`,d=yr.get(u);if(d?.promise){a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:d.requestId},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const P=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);return!e&&!pc(P)&&Ba(di),d.promise}const m=`${Date.now()}:${Math.random().toString(16).slice(2)}`,f=(os[s]||0)+1;os[s]=f;const b=()=>os[s]===f;a.livePairsLoadingByBucket={...a.livePairsLoadingByBucket,[s]:m},a.livePairsLoading=!!a.livePairsLoadingByBucket[a.livePairBucket],!e&&c&&(a.loading=!0);const y=a.livePairsByBucket?.[s]?.rows||(c?a.livePairs?.rows:[]);!e&&!pc(y)&&Ba(di);const S=(async()=>{try{const P=r?"&force=true":"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(s)}&sort=${encodeURIComponent(i)}${P}`,g=await Promise.race([k(T),new Promise((N,Oe)=>window.setTimeout(()=>Oe(new Error("Live feed refresh timed out.")),12e3))]),A=Tt.find(([N])=>N===s)?.[1]||"Live",L=a.livePairsByBucket[s]||(c?a.livePairs:null);let B=g.livePairs||{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${A} feed returned no rows yet. Retrying automatically.`};const D=Array.isArray(B?.rows)?B.rows:[],ne=Array.isArray(L?.rows)?L.rows:[];if(D.length===0&&ne.length>0?B={...L,...B,rows:L.rows,stale:!0,emptyRefresh:!0,message:`${A} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:D.length>0&&ne.length>0&&(B={...B,rows:uf(ne,D)}),!b())return B;const ve=B?.refreshedAt||new Date().toISOString(),Je={...a.livePairsRefreshErrorByBucket||{}};return delete Je[s],a.livePairsRefreshErrorByBucket=Je,a.livePairsByBucket={...a.livePairsByBucket,[s]:B},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:ve},c&&(a.livePairs=B,a.livePairsLastUpdatedAt=ve),B}catch(P){const T=W(P?.message||"Live feed refresh failed."),g=Tt.find(([B])=>B===s)?.[1]||"Live",A=a.livePairsByBucket[s]||(c?a.livePairs:null),L=A?{...A,stale:!0,refreshError:T,message:`Showing last good ${g} feed. Refresh failed, retrying automatically.`}:{bucket:s,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:T,message:`${g} refresh failed. Retrying automatically.`};return b()&&(a.livePairsRefreshErrorByBucket={...a.livePairsRefreshErrorByBucket||{},[s]:T},a.livePairsByBucket={...a.livePairsByBucket,[s]:L},a.livePairsLastUpdatedByBucket={...a.livePairsLastUpdatedByBucket,[s]:L.refreshedAt},c&&(a.livePairs=L,a.livePairsLastUpdatedAt=L.refreshedAt)),L}finally{if(!b())return;const P=a.livePairsByBucket?.[s]?.rows||[];U("live-pairs-refresh",o,{component:"livePairs",resultCount:Array.isArray(P)?P.length:0,stale:!!a.livePairsByBucket?.[s]?.stale,errorCode:a.livePairsRefreshErrorByBucket?.[s]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${s}:${i}`});const T={...a.livePairsLoadingByBucket};(T[s]===m||T[s]===!0)&&(delete T[s],a.livePairsLoadingByBucket=T),a.livePairsLoading=!!T[a.livePairBucket],!e&&c&&(a.loading=!1),n&&(c&&["terminal","live","slimeScope"].includes(a.activeTab)?Ba("load-live-pairs-complete"):h())}})();return yr.set(u,{requestId:m,requestVersion:f,safeBucket:s,promise:S}),S.finally(()=>{yr.get(u)?.requestId===m&&yr.delete(u)}),S}async function Mt({silent:e=!1,force:t=!1,warmAll:n=!1}={}){if(await Lr({silent:e,bucket:a.livePairBucket,force:t}),n){const r=Tt.map(([o])=>o).filter(o=>o!==a.livePairBucket);await Promise.allSettled(r.map(o=>Lr({silent:!0,bucket:o,renderOnComplete:!1,force:t})))}(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope")&&Ba(n?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function la(){if(Bn()||document.hidden||Ma()||a.activeTab!=="live"&&a.activeTab!=="terminal"&&a.activeTab!=="slimeScope"){xa();return}const e=Cr(a.activeTab),n=(a.activeTab==="slimeScope"?12:8)*1e3,r=`${a.activeTab}:${e}:${a.terminalSort}:${n}`;ka&&ir===r||(xa(),ir=r,ka=setTimeout(async()=>{if(ka=null,ir="",document.hidden||Ma()){la();return}if(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"){if(a.livePairsLoadingByBucket?.[e]){la();return}try{a.activeTab==="slimeScope"?await Y("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Lr({silent:!0,bucket:a.livePairBucket,force:!1})}catch{}finally{la()}}},n))}function df({force:e=!1}={}){if(Bn()||!(a.activeTab==="live"||a.activeTab==="terminal"||a.activeTab==="slimeScope"))return;const n=Cr(a.activeTab),r=`${n}:${a.terminalSort||"best"}`;ts.has(r)||a.livePairsLoadingByBucket[n]||!e&&a.livePairsByBucket[n]||(ts.add(r),window.setTimeout(()=>{const o=a.activeTab==="slimeScope"?Y("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):Mt({silent:!0,force:!0,warmAll:!1});Promise.resolve(o).catch(s=>$(s.message)).finally(()=>{ts.delete(r),la()})},900))}function Mr(){const e=()=>{$a&&clearTimeout($a),$a=null,cr=""};if(document.hidden||a.activeTab!=="sniper"){e();return}const t=`${a.activeTab}:${a.scanMode}`;$a&&cr===t||(e(),cr=t,$a=setTimeout(async()=>{if($a=null,cr="",document.hidden){Mr();return}if(a.activeTab==="sniper"){if(a.loading){Mr();return}try{await Mn(a.scanMode,{silent:!0})}catch(n){$(n.message)}finally{Mr()}}},2e4))}function Ln(){const e=()=>{Ta&&clearTimeout(Ta),Ta=null,ur=""};if(Bn()||document.hidden||a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet){e();return}const t=String(a.kolMode||"hot"),o=t==="hot"||t==="fresh"?1e4:3e4,s=`${a.activeTab}:${a.kolMode}:${o}`;Ta&&ur===s||(e(),ur=s,Ta=setTimeout(async()=>{if(Ta=null,ur="",document.hidden){Ln();return}if(!(a.activeTab!=="kol"&&a.activeTab!=="terminal"||a.kolWallet)){if(a.kolLoading){Ln();return}try{await Br(a.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{Ln()}}},o))}function xr(){const e=()=>{Aa&&clearTimeout(Aa),Aa=null,dr=""};if(Bn()||document.hidden||a.activeTab!=="watchlist"&&a.activeTab!=="terminal"||!a.user||!a.token){e();return}const t=`${a.activeTab}:${a.user?.id||"guest"}`;Aa&&dr===t||(e(),dr=t,Aa=setTimeout(async()=>{if(Aa=null,dr="",document.hidden){xr();return}if(!(a.activeTab!=="watchlist"&&a.activeTab!=="terminal"))try{await mc({silent:!0})}catch(n){$(n.message)}finally{xr()}},3e4))}async function Mn(e=a.scanMode,t={}){const n=C(),r=!!t.silent;a.scanMode=e,r||(a.loading=!0,h());try{const o=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);a.scan=o.scan}finally{U("scanner-refresh",n,{component:"sniper",resultCount:Array.isArray(a.scan?.candidates)?a.scan.candidates.length:0,details:e}),r||(a.loading=!1),h()}}async function Br(e=a.kolMode,t=a.kolWallet,n={}){const r=C(),o=!!n.silent;a.kolMode=e,a.kolWallet=String(t||"").trim();let s="";a.kolWallet&&!Rt(a.kolWallet)&&(a.kolWallet="",s="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!o&&!a.kolScan&&(a.loading=!0),a.kolLoading=!0,a.kolStatus=s||(a.kolWallet?"Scanning custom KOL wallet...":`Loading ${Un(a.kolMode)}...`),$(""),o||h();try{const c=new URLSearchParams({mode:e});a.kolWallet&&c.set("wallet",a.kolWallet);const i=await k(`/api/web/kol/scan?${c.toString()}`);a.kolScan=i.scan,a.kolLastUpdatedAt=new Date().toISOString(),a.kolStatus=i.scan?.message||`${Un(a.kolMode)} loaded.`,a.kolDumpStatsLoadedAt=0}catch(c){throw a.kolStatus=c.message||"KOL scan failed.",c}finally{U("kol-refresh",r,{component:"kol",resultCount:Array.isArray(a.kolScan?.rows)?a.kolScan.rows.length:Array.isArray(a.kolScan?.signals)?a.kolScan.signals.length:0,errorCode:a.kolStatus&&/failed/i.test(a.kolStatus)?"KOL_REFRESH_FAILED":"",details:a.kolWallet?"wallet":e}),o||(a.loading=!1),a.kolLoading=!1,h()}}async function mc(e={}){if(!a.user||!a.token)return;const t=C(),n=!!e.silent;a.watchlistLoading=!0,n||h();try{const r=await k("/api/web/watchlist");a.watchlist=r.watchlist||{rows:[],count:0}}finally{U("watchlist-refresh",t,{component:"watchlist",resultCount:a.watchlist?.count||a.watchlist?.rows?.length||0}),a.watchlistLoading=!1,h()}}function pf(){return a.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function mf(){const e=Number(a.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function xt(){return pf()+mf()}const ff=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Be(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function hf(){const e=new Map,t=(n={})=>{const r=Be(n.mint||n.tokenMint||"");if(!r||e.has(r))return;const o=n.balance??n.uiAmount??n.amount??n.uiBalance??"";e.set(r,{mint:r,symbol:String(n.symbol||n.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(n.name||n.label||"").trim(),balance:o,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${xt().toFixed(4)} SOL`}),et().forEach(n=>t({mint:n.tokenMint||n.mint,symbol:n.symbol||n.shortMint,name:n.name||"",balance:n.uiAmount||n.amountToken||"",kind:"wallet"})),(a.balances||[]).forEach(n=>{(n.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function Fs(e={}){const t=new Map,n=(o={})=>{const s=Be(o.mint||o.tokenMint||"");!s||t.has(s)||t.set(s,{mint:s,symbol:String(o.symbol||o.shortMint||(s==="SOL"?"SOL":w(s))||"").trim(),name:String(o.name||o.label||"").trim(),balance:o.balance??o.uiAmount??o.amount??"",kind:o.kind||o.source||"held"})};return hf().forEach(n),e.walletOnly||ff.forEach(o=>{o.mint!=="SOL"&&n(o)}),[...t.values()]}function fc(e=""){const t=Be(e);return Fs().find(n=>n.mint===t)||null}function hc(e="",t={}){const n=Be(e),r=t.includeCustom!==!1,o=Fs({walletOnly:!!t.walletOnly}),s=o.some(u=>u.mint===n);return`${o.map(u=>{const d=u.mint==="SOL"?`SOL${u.balance?` - ${u.balance}`:""}`:`${u.symbol||w(u.mint)}${u.kind==="wallet"?` - ${u.balance?`${u.balance} `:""}in wallet`:u.name?` - ${u.name}`:""}`;return`<option value="${l(u.mint)}" ${n===u.mint?"selected":""}>${l(d)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!n||!s)?"selected":""}>Custom CA</option>`:""}`}function Ws(){const e=Be(a.tradeSwapFrom||"SOL")||"SOL";return Fs({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function gc(){const e=Ws(),t=Be(a.tradeSwapTo||""),n=Be(a.tradeToken||"");return t&&t!==e?t:n&&n!==e||e==="SOL"?n:"SOL"}function gf(){const e=Ws(),t=gc();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Be(a.tradeToken||"")?a.swapDirection==="sell"?"sell":"buy":"select"}function bf(e="buy"){const t=Be(p("[data-swap-from]")?.value||a.tradeSwapFrom||""),n=Be(p("[data-swap-to]")?.value||a.tradeSwapTo||""),r=String(p("[data-trade-token]")?.value||a.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:n&&n!=="SOL"?n:r}function bc(){return(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey?(a.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const n=String(t.mint||t.tokenMint||"").trim();return{tokenMint:n,shortMint:t.shortMint||w(n),symbol:t.symbol||t.shortMint||w(n),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||X(n),pumpUrl:Km(n),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function et(){const e=new Set,t=[];for(const n of[...a.positions||[],...bc()]){const r=String(n?.tokenMint||n?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(n))}return t}function _s(){const e=a.connectedWalletBalance?.publicKey||a.user?.connectedWallet?.publicKey||"";return a.wallets.length+(e?1:0)}function yc(){return a.pnl?.totals?.realizedSol||"+0 SOL"}function Da(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function xn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function Rr(){if(a.walletRefreshing||a.walletRefreshStatus==="refreshing")return"Syncing";if(a.walletRefreshStatus==="timeout")return"Delayed";if(a.walletRefreshError||a.walletRefreshStatus==="error")return"Retry";const e=Da(a.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function yf(){const e=ae("trade",a.selectedTradePresetId),t=ae("bundle",a.selectedBundlePresetId),n=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${n} | ${r}`}async function vc(){if(!a.user||!a.token)return;const e=C();try{const[t,n]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(a.pnl=t.value.pnl||a.pnl||null),n.status==="fulfilled"&&(a.tradePlans=n.value.plans||a.tradePlans||[],Jr()),U("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(a.tradePlans?.length||0)+(a.pnl?1:0),details:"pnl,trade-plans"})}catch(t){U("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:W(t?.message||"Post-trade supplemental refresh failed.")})}}function vf(e=350,t={}){mr&&window.clearTimeout(mr),mr=window.setTimeout(async()=>{if(mr=null,!(!a.user||!a.token))try{t.reason==="post-trade"?await Promise.all([vc(),Ct({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([ra({force:!1,skipCore:!0,silent:!0}),Ct({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(n){a.walletRefreshError=n.message||"Background refresh failed.",h()}},e)}async function We({force:e=!1,deep:t=!1,reason:n="manual"}={}){if(!a.user||!a.token)return a.walletRefreshing=!1,a.walletRefreshStatus="idle",a.walletRefreshError="Wallet not connected",Le("[data-sync-health]","Wallet not connected"),De("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(n||"").toLowerCase(),o=r==="manual_header_click",s=r.includes("post-trade");if(e&&!t&&!s&&!o&&Date.now()-ki<qp?(e=!1,E({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!s&&(ki=Date.now()),Jt)return E({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),a.positionRefreshAction?.state==="clicked"&&Oa("refreshing",{startedAt:a.positionRefreshAction.startedAt||C()}),Jt.finally(()=>{if(["clicked","refreshing"].includes(a.positionRefreshAction?.state)){const u=a.walletRefreshStatus==="error"||a.walletRefreshStatus==="timeout";De(u?"error":"success",{error:u?W(a.walletRefreshError||"Refresh delayed"):""})}});const c=C(),i=++lm;return a.walletRefreshRequestId=i,Jt=(async()=>{let u={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};a.positionRefreshAction?.state==="clicked"&&Oa("refreshing",{startedAt:a.positionRefreshAction.startedAt||c}),a.walletRefreshing=!0,a.walletRefreshStatus="refreshing",a.walletRefreshError="",Le("[data-sync-health]",Rr()),$t("[data-refresh-spinner]",!1),oe(),Yt&&window.clearTimeout(Yt),Yt=window.setTimeout(()=>{Yt=null,!(a.walletRefreshRequestId!==i||!a.walletRefreshing)&&(a.walletRefreshing=!1,a.walletRefreshStatus==="refreshing"&&(a.walletRefreshStatus="timeout"),Jt=null,De("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))},Xo+6e3),await Ee(20);try{if(await Promise.race([Bs({force:e,deep:t,preserveSmartChartFrame:a.activeTab==="smartChart",requestId:i,timeoutMs:Xo}),new Promise((d,m)=>window.setTimeout(()=>m(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),Xo))]),a.walletRefreshRequestId!==i)return u={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:C()-c,fromCache:!1,degraded:!0},u;a.walletRefreshRequestId===i&&(a.lastWalletRefreshAt=new Date().toISOString(),a.walletRefreshStatus="success"),t?await ra({force:e,skipCore:!0,silent:!0}):((o||s)&&Ct({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${n}-positions-values`,timeoutMs:jt}).then(d=>{d?h({preserveSmartChartFrame:a.activeTab==="smartChart"}):Pr(`${n}-positions-values-failed`)}).catch(()=>Pr(`${n}-positions-values-failed`)),vf(s?200:350,{reason:n})),U("wallet-refresh-total",c,{component:"wallet",resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:t?"deep":`core-plus-background:${n}`}),De("success",{error:""}),u={ok:!0,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:"",durationMs:C()-c,fromCache:!1,degraded:!1}}catch(d){const m=d?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(d?.message||""));a.walletRefreshRequestId===i&&(a.walletRefreshStatus=m?"timeout":"error",a.walletRefreshError=d.message||"Refresh failed."),m&&!r.includes("auto-retry")&&a.user&&a.token&&window.setTimeout(()=>{a.user&&a.token&&a.walletRefreshStatus!=="success"&&We({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),U("wallet-refresh-total",c,{component:"wallet",errorCode:d?.code||d?.name||"WALLET_REFRESH_FAILED",details:W(a.walletRefreshError)}),De("error",{error:W(a.walletRefreshError)}),$(a.walletRefreshError),u={ok:!1,data:{balances:a.balances,positions:a.positions,pnl:a.pnl},error:W(a.walletRefreshError),durationMs:C()-c,fromCache:!1,degraded:!0}}finally{Yt&&(window.clearTimeout(Yt),Yt=null),a.walletRefreshRequestId===i&&(a.walletRefreshing=!1),Jt=null,h({preserveSmartChartFrame:a.activeTab==="smartChart"})}return u})(),Jt}async function ut({force:e=!0,reason:t="manual_header_click",deep:n=!1}={}){return We({force:e,reason:t,deep:n})}function Bn(){return!!a.postTradeRefresh?.active&&Number(a.postTradeRefresh?.activeUntil||0)>Date.now()}async function iS(e="",t="legacy-post-trade"){H(e,t)}function H(e="",t="post-trade",n={}){e&&(a.lastTradeSignature=e),kt.length&&(kt.forEach(s=>window.clearTimeout(s)),kt=[]);const r=n.tradeAttemptId||ct("post-trade"),o=Array.isArray(n.affectedKeys)&&n.affectedKeys.length?n.affectedKeys.slice(0,12).map(s=>ge(s,48)):Xp;a.postTradeRefresh={active:!0,attemptId:r,action:ge(t,70),signaturePresent:!!e,invalidatedKeys:o,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},E({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:o.length,details:o.join(",")}),Kp.forEach(s=>{const c=window.setTimeout(()=>{kt=kt.filter(m=>m!==c);const i=Number(a.postTradeRefresh?.requestCount||0)+1;a.postTradeRefresh={...a.postTradeRefresh||{},requestCount:i},E({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:a.postTradeRefresh.requestCount,details:t});const u=C();(i<=1?We({force:!0,deep:!1,reason:"post-trade"}):Promise.all([Ct({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:jt}),vc()])).catch(m=>{a.walletRefreshError=m.message||"Post-trade refresh failed.",a.postTradeRefresh={...a.postTradeRefresh||{},errors:[...a.postTradeRefresh?.errors||[],W(m.message||"Post-trade refresh failed.")].slice(-5)},E({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:C()-u,requestId:r,errorCode:m?.code||m?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{a.postTradeRefresh={...a.postTradeRefresh||{},refreshedKeys:[...new Set([...a.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:kt.length>0,activeUntil:kt.length>0?Date.now()+8e3:Date.now()},E({component:"post-trade",action:"post-trade-refresh-end",durationMs:C()-u,requestId:r,resultCount:(a.balances?.length||0)+(a.positions?.length||0),details:a.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:a.activeTab==="smartChart"})})},s);kt.push(c)}),oe()}function Te({title:e="Confirm",lines:t=[],confirmLabel:n="Confirm",cancelLabel:r="Cancel",danger:o=!1,input:s=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
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
    `;const u=document.activeElement,d=i.querySelector(".slime-confirm-input"),m=S=>{i.remove(),document.removeEventListener("keydown",y,!0);try{u?.focus?.({preventScroll:!0})}catch{}c(S)},f=()=>m(s?d?.value??"":!0),b=()=>m(s?null:!1),y=S=>{S.key==="Escape"?(S.preventDefault(),b()):S.key==="Enter"&&(!s||S.target===d)&&(S.preventDefault(),f())};i.addEventListener("pointerdown",S=>{S.target===i&&b()}),i.querySelector(".slime-confirm-accept").addEventListener("click",f),i.querySelector(".slime-confirm-cancel").addEventListener("click",b),document.addEventListener("keydown",y,!0),document.body.appendChild(i),(d||i.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),d&&d.select()})}function Ns(){if(document.hidden&&a.route==="terminal")return!0;const e=document.activeElement;if(!e||a.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function wc(){a.pendingRender=!0}function Sc(){!a.pendingRender||Ns()||(a.pendingRender=!1,h({force:!0}))}function Ds(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function Ua(){if(!re||!hn||!Z)return;const e=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);re.dataset.loading=a.loading?"true":"false",re.dataset.route=a.route,re.dataset.walletConnected=e?"true":"false",e&&yw("shell-wallet-context"),e?Fc("shell-wallet-context"):Xl(),e||(a.tpslAutoEnableInFlight=!1,a.tpslAutoEnableScheduledAt=0),Ds(hn,!["intro","login"].includes(a.route)),Ds(Ti,a.route!=="connect"),Ds(Z,a.route!=="terminal"),$t("[data-terminal-global-search]",a.route!=="terminal"),$t("[data-top-sync-strip]",a.route!=="terminal")}function Rn(){const e=!!(ke&&a.loginModalOpen),t=!!a.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const n=p("[data-wallet-connect-modal]");n&&(n.style.pointerEvents=n.hidden?"none":"");const r=p("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function Us(e,t=48){if(!e||document.hidden)return!1;try{const n=e.getBoundingClientRect();return n.width<24||n.height<t}catch{return!1}}function kc(e="resume"){if(!re||document.hidden)return;Ua(),Rn();const t=`${Date.now()}:${e}`,n=re.style.transform;re.dataset.resumePaint=t,re.style.transform=n?`${n} translateZ(0)`:"translateZ(0)",re.offsetHeight,window.requestAnimationFrame(()=>{!re||re.dataset.resumePaint!==t||(re.style.transform=n,delete re.dataset.resumePaint)})}function wf(){if(!re)return!1;if(re.dataset.route!==a.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!ke||ke.hidden||!a.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!a.quickBuyModal?.open;if(e||t||Us(re,80))return!0;if(a.route!=="terminal")return!1;const n=p("[data-panel]");return Z?.hidden||Us(Z,80)||n&&Us(n,32)||n&&!n.children.length&&!String(n.textContent||"").trim()?!0:![hn,Ti,Z].some(o=>o&&!o.hidden)}function Sf(e="watchdog"){const t=a.positionRefreshAction||{},n=t.startedAt?Math.max(0,C()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&n>Gp&&(De("error",{error:"Refresh delayed"}),E({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:n,details:e})),a.walletRefreshing&&!Jt&&(a.walletRefreshing=!1,a.walletRefreshStatus=a.walletRefreshStatus==="refreshing"?"timeout":a.walletRefreshStatus,$t("[data-refresh-spinner]",!0)),Rn(),oe()}function $c(e="watchdog",t={}){return Sf(e),wf()?(E({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-$i),details:`${e}:${a.route}:${a.activeTab||""}`}),ws({keepLogin:a.route==="login"}),Ua(),kc(e),h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),!0):(t.forcePaint&&kc(e),!1)}function Tc(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function Pc(){try{return document.createElement("canvas")}catch{return null}}function Ac(){const e=Pc();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function kf(){return Tc()||Ac()}function qs(){const e=Ue()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Bt(e),typeof window.alert=="function"&&window.alert(e)}function Cc(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function In(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function Lc(){const e=a.clipFarm?.fileExtension||In(a.clipFarm?.mimeType||a.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function On(){try{a.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}a.clipFarm?.fallbackFrameTimer&&clearInterval(a.clipFarm.fallbackFrameTimer),a.clipFarm?.fallbackStopTimer&&clearTimeout(a.clipFarm.fallbackStopTimer)}function Bt(e=""){a.clipFarm={...a.clipFarm,status:String(e||"")},He()}function Hs(){if(a.clipFarm?.videoUrl)try{URL.revokeObjectURL(a.clipFarm.videoUrl)}catch{}a.clipFarm={...a.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:a.clipFarm?.recording?"Recording...":""},He()}function He(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=a.clipFarm||{},n=kf(),r=!!t.recording,o=!!(t.blob&&t.videoUrl),s=t.status||(r?"Recording":o?"Clip ready":"Clip farm");e.innerHTML=`
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
          <a href="https://t.me/share/url?url=${encodeURIComponent(St)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${s?`<small>${l(s)}</small>`:""}
    </div>
  `}function Mc(){const e=he([...Fe()?.rows||[],...typeof Xn=="function"?Xn():[],...a.slimeScopeRows||[],...a.livePairRows||[],...Object.values(a.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:a.smartChartToken||a.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function xc(e,t={}){const n=e?.getContext?.("2d");if(!n)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),o=720,s=1280;(e.width!==o*r||e.height!==s*r)&&(e.width=o*r,e.height=s*r,e.style.width=`${o}px`,e.style.height=`${s}px`),n.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),i=t.rows||Mc(),u=new Date;n.fillStyle="#020803",n.fillRect(0,0,o,s);const d=n.createRadialGradient(o*.2,s*.12,20,o*.2,s*.12,460);d.addColorStop(0,"rgba(118,255,45,0.35)"),d.addColorStop(1,"rgba(118,255,45,0)"),n.fillStyle=d,n.fillRect(0,0,o,s),n.strokeStyle="rgba(118,255,45,0.38)",n.lineWidth=2,n.strokeRect(24,24,o-48,s-48),n.fillStyle="#baff4d",n.font="900 34px Arial, sans-serif",n.fillText("SlimeWire REC",48,88),n.fillStyle="#f4fff0",n.font="800 54px Arial, sans-serif",n.fillText("Fresh Live Picks",48,154),n.fillStyle="rgba(226,255,215,0.78)",n.font="700 22px Arial, sans-serif",n.fillText(`Mobile in-site clip - ${u.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const m=o-96;n.fillStyle="rgba(118,255,45,0.12)",n.fillRect(48,226,m,12),n.fillStyle="#78ff2d",n.fillRect(48,226,Math.max(24,m*c),12),i.forEach((f,b)=>{const y=292+b*188,S=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),T=F(f.marketCapLabel,f.fdvLabel,x(rt(f)),"checking"),g=F(f.liquidityLabel,x(ot(f)),"checking"),A=F(f.volumeH1Label,f.volumeLabel,x(f.volumeH1),"checking"),L=String(f.pairAgeLabel||Nt(f)||"live").slice(0,18);n.fillStyle="rgba(4,24,8,0.92)",n.strokeStyle="rgba(118,255,45,0.34)",n.lineWidth=2,n.beginPath(),typeof n.roundRect=="function"?n.roundRect(48,y,o-96,156,18):n.rect(48,y,o-96,156),n.fill(),n.stroke(),n.fillStyle="#f4fff0",n.font="900 32px Arial, sans-serif",n.fillText(S,76,y+48),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 18px Arial, sans-serif",n.fillText(P,76,y+78),[["MC",T],["LIQ",g],["VOL",A],["AGE",L]].forEach(([B,D],ne)=>{const ve=76+ne*140;n.fillStyle="#aaff8f",n.font="800 15px Arial, sans-serif",n.fillText(B,ve,y+114),n.fillStyle="#ffffff",n.font="900 23px Arial, sans-serif",n.fillText(String(D).slice(0,10),ve,y+142)})}),n.fillStyle="rgba(226,255,215,0.72)",n.font="700 20px Arial, sans-serif",n.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,s-78),n.fillStyle="#78ff2d",n.font="900 24px Arial, sans-serif",n.fillText("slimewire.org",48,s-44)}async function $f(e){xc(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(o=>r(o),"image/png",.92)}catch{r(null)}});if(!t){qs();return}const n=URL.createObjectURL(t);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:n,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},He()}async function Tf(){const e=Pc();if(!e){qs();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await $f(e);return}Hs();const n=Mc(),r=Date.now(),o=t.call(e,12),s=Cc(),c=[],i=new MediaRecorder(o,s?{mimeType:s}:void 0),u=()=>xc(e,{rows:n,progress:(Date.now()-r)/4200});u();const d=setInterval(u,1e3/12);i.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),i.addEventListener("stop",()=>{On();const f=s||"video/webm",b=new Blob(c,{type:f}),y=b.size>0?URL.createObjectURL(b):"",S=In(b.type||f);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:b.size>0?b:null,videoUrl:y,mimeType:b.type||f,fileExtension:S,status:b.size>0?`Mobile clip ready (.${S}).`:"No mobile clip captured."},He()},{once:!0}),i.start(500);const m=setTimeout(()=>{a.clipFarm?.recording&&En()},4300);a.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:s,fileExtension:In(s),recorder:i,stream:o,chunks:c,fallbackFrameTimer:d,fallbackStopTimer:m},He()}async function Bc(){if(!Tc()){if(Ac()){await Tf();return}qs();return}if(a.clipFarm?.recording){En();return}Hs();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=Cc(),n=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",o=>{o.data?.size>0&&n.push(o.data)}),r.addEventListener("stop",()=>{On();const o=t||"video/webm",s=new Blob(n,{type:o}),c=s.size>0?URL.createObjectURL(s):"",i=In(s.type||o);a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:s.size>0?s:null,videoUrl:c,mimeType:s.type||o,fileExtension:i,status:s.size>0?`Clip ready (.${i}).`:"No clip captured."},He()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>En(),{once:!0}),r.start(1e3),a.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:In(t),recorder:r,stream:e,chunks:n},He()}catch(e){On(),a.clipFarm={...a.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},He()}}function En(){const e=a.clipFarm?.recorder;if(!e){On(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},He();return}try{if(e.state!=="inactive"){Bt("Saving clip..."),e.stop();return}}catch{}On(),a.clipFarm={...a.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},He()}async function Pf(){const e=a.clipFarm?.blob;if(!e){Bt("Record a clip first.");return}const t=new File([e],Lc(),{type:e.type||a.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Bt("Shared.");return}}catch(n){if(n?.name==="AbortError"){Bt("Share cancelled.");return}}Bt("Use Save, then attach the clip to X or Telegram.")}function Af(){const e=a.clipFarm?.videoUrl;if(!e){Bt("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=Lc(),document.body.appendChild(t),t.click(),t.remove(),Bt("Saved.")}function Cf(e=null,t="chartTxns"){const n=e||ho(),r=String(n?.tokenMint||a.smartChartToken||"").trim();return r?{mint:r,mode:t,src:rd(n,t)}:null}function Lf(e={}){if(e.refreshSmartChartFrame||a.route!=="terminal"||a.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),n=t?.querySelector("iframe");if(!t||!n)return null;const r=String(t.dataset.chartMode||"chartTxns"),o=Cf(null,r);if(!o||t.dataset.chartMint!==o.mint||t.dataset.chartMode!==o.mode)return null;const s=String(t.dataset.chartSrc||n.getAttribute("src")||""),c=t.dataset.loaded==="true",i=s!==o.src;return t.dataset.preserving="true",{frame:t,mint:o.mint,mode:o.mode,src:i?s:o.src,loaded:c,keepByMint:i}}function Mf(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),n=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${n}"]`),o=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||o!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!re||!hn||!Z)return;if(Ua(),!e.force&&Ns()){wc();return}const t=C(),n=`${a.route}:${a.activeTab||"none"}`;try{a.perfRenderCounts={...a.perfRenderCounts||{},[n]:(a.perfRenderCounts?.[n]||0)+1},a.pendingRender=!1;const r=!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length);Ua(),re.dataset.activeTab=a.activeTab||"";const s=!!((e.preserveSmartChartFrame||a.activeTab==="smartChart")&&a.route==="terminal"&&a.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Lf(e):null,c=!!ke,i=!!(c&&a.loginModalOpen);hs&&(hs.hidden=c||!!a.user||a.loginCollapsed),$t("[data-connect-login-panel]",c||!!a.user||a.loginCollapsed),ke?(ke.hidden=!i,ke.setAttribute("aria-hidden",i?"false":"true"),ke.toggleAttribute("inert",!i),document.body.classList.toggle("login-modal-open",i),document.querySelectorAll("[data-login-tab]").forEach(S=>{const P=S.dataset.loginTab===a.loginModalTab;S.dataset.active=P?"true":"false",S.setAttribute("aria-selected",P?"true":"false")}),$t("[data-login-modal-login-section]",a.loginModalTab!=="login"),$t("[data-login-modal-create-section]",a.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),Pi&&(Pi.hidden=!1),Ai&&(Ai.hidden=!!a.user),Ci&&(Ci.hidden=!a.user),Ua(),Le("[data-user-id]",a.user?.id||"guest"),Le("[data-wallet-count]",_s()),Le("[data-total-sol]",xt().toFixed(4));const u=et();Le("[data-position-count]",u.length),Le("[data-realized]",yc()),Le("[data-top-sol]",`${xt().toFixed(4)} SOL`),Le("[data-top-portfolio]",`${u.length} position${u.length===1?"":"s"}`),Le("[data-sync-health]",r?Rr():"Sync idle"),Le("[data-active-preset-label]",yf()),Vs(),Rf(),$t("[data-refresh-spinner]",!a.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(S=>{S.hidden=!Op||!Mp(we)});const d=p("[data-user-avatar]");d&&(d.innerHTML=Ha("SW"));const m=p("[data-top-avatar]");m&&(m.innerHTML=Ha("SW"));const f=a.user?.connectedWallet||null;Le("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:a.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const b=p("[data-logout]");b&&(b.hidden=!a.user,b.disabled=!!a.logoutPending,v(b,a.logoutPending?"Logging out...":"Log Out")),a.route==="terminal"&&Uf(),Mf(s),ph(),fh(),Sl(),ba(),ya(),Xr(),tr(),He(),O(),dv("render"),Rn(),oe();const y=C()-t;(y>=16||a.perfRenderCounts[n]%20===0)&&E({component:"render",action:"render",durationMs:y,resultCount:a.perfRenderCounts[n],details:n}),$i=Date.now()}catch(r){Ua(),Rn(),$s({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const o=p("[data-panel]");a.route==="terminal"&&o?(Z.hidden=!1,o.innerHTML=`
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
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function Rc(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const n=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(n)return`connected:${String(n).toLowerCase()}`;const r=Array.isArray(a.wallets)&&a.wallets.length?a.wallets.map(o=>o.publicKey||o.address||o.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function xf(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${Rc(e)}`)==="yes"}catch{return!1}}function Ic(e,t=""){try{const n=`tpslAutoRevoked:${Rc(t)}`;e?sessionStorage.setItem(n,"yes"):sessionStorage.removeItem(n)}catch{}}function Ks(e=""){Ic(!1,e)}function Oc(){return!!(Array.isArray(a.wallets)&&a.wallets.length||a.user?.connectedWallet||a.connectedWalletBalance?.publicKey)}function Ec(){const e=a.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),n=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!a.user?.automationPermissionActive&&!n&&!e.revokedAt}function Bf(){return!(!Oc()||xf()||Ec()||a.tpslAutoEnableInFlight)}function Fc(e="wallet-session"){if(!Bf())return;const t=C();a.tpslAutoEnableScheduledAt&&t-a.tpslAutoEnableScheduledAt<2e3||(a.tpslAutoEnableScheduledAt=t,a.tpslAutoEnableInFlight=!0,setTimeout(()=>{dl("enable",{auto:!0,reason:e}).catch(n=>{a.automationDelegationStatus=n?.message||"TP/SL auto-enable failed.",$(a.automationDelegationStatus)}).finally(()=>{a.tpslAutoEnableInFlight=!1,Vs()})},50))}function Vs(){const e=p("[data-tpsl-status-button]");if(!e)return;const t=p("[data-tpsl-status-label]"),n=a.user?.automationPermission||{},r=!!a.user?.automationPermissionActive,o=!!n.revokedAt,s=Date.parse(n.expiresAt||""),c=!!n.enabled&&Number.isFinite(s)&&s<=Date.now(),i=r?"enabled":o||c?"invalid":"disabled";e.dataset.tpslState=i;const u=i==="enabled"?"TP/SL Enabled":i==="invalid"?"Re-enable TP/SL":"Enable TP/SL";v(t,u),e.setAttribute("aria-label",`${u}. Stop loss and take profit require wallet auto-sell approval.`),e.title=i==="enabled"?`Server exits enabled${n.expiresAt?` until ${ye(n.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Rf(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0,r=!!(t||n),o=r?"Connected":"Connect",s=t?"Wallet: Connected":n?`Wallets: ${n}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:n?`${n} SlimeWire wallet${n===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(i=>{i.dataset.walletState=r?"connected":"disconnected",i.title=c,i.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const u=i.querySelector("[data-top-wallet-connect-label]")||i;v(u,o)}),document.querySelectorAll("[data-top-wallet-status]").forEach(i=>{i.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",i.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",i.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),v(i,s)})}async function If(){const e=a.user?.connectedWallet||a.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),n=Array.isArray(a.wallets)?a.wallets.length:0;if(t){await Te({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await Pu();return}if(n>0){Me("/terminal","wallets");return}ia({returnPath:"/terminal"})}function Of(e=document){const t=()=>{const n=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!n)return;const r=Math.max(0,n.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const Wc=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Ef=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Ff(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Fn(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function zs(e=p("[data-panel]")){if(!e||a.route!=="terminal"||!Wc.has(a.activeTab))return null;const t=e.dataset.renderedTab,n=document.scrollingElement||document.documentElement,r={tab:a.activeTab,windowY:window.scrollY||0,documentY:n?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:Z?.scrollTop||0,anchorKey:"",anchorTop:0},o=Array.from(e.querySelectorAll(Ef));if(t&&t!==a.activeTab&&!o.length||!o.length)return r;const s=o.find(i=>{const u=i.getBoundingClientRect(),d=Fn()?42:72;return u.bottom>d&&u.top<Math.min(window.innerHeight||720,720)})||o[0],c=s?.dataset?.tokenChart||s?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:s?s.getBoundingClientRect().top:0}}function js(e,t=p("[data-panel]")){if(!e||a.route!=="terminal"||e.tab!==a.activeTab)return;const n=(s,c)=>{if(!s||!Number.isFinite(Number(c))||s.scrollHeight<=s.clientHeight+2)return;const i=Math.max(0,Math.min(Number(c),s.scrollHeight-s.clientHeight));Math.abs((s.scrollTop||0)-i)>4&&(s.scrollTop=i)},r=s=>{const c=document.scrollingElement||document.documentElement;n(Z,e.dashboardScrollTop),n(s,e.panelScrollTop),n(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},o=()=>{const s=t?.isConnected?t:p("[data-panel]");let c=!1;if(e.anchorKey&&s){const i=Ff(e.anchorKey),u=s.querySelector(`[data-token-chart="${i}"], [data-token-mint="${i}"]`);if(u){const m=u.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(m)&&Math.abs(m)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+m)),c=!0}}c||r(s)};o(),requestAnimationFrame(()=>{o(),window.setTimeout(o,90),window.setTimeout(o,240),Fn()&&window.setTimeout(o,520)})}function _c(e,t){const n=Object.keys(e.dataset||{}).filter(s=>s!=="customFor"&&s!=="customSelect").sort().map(s=>`${s}=${e.dataset[s]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",o=`${e.tagName}:${e.type||""}:${e.name||""}:${n}${r}`;return n?o:`${o}:idx${t}`}function Nc(e){const t=Array.from(e.options||[]),n=t.find(r=>r.defaultSelected);return n?n.value:t[0]?.value??""}function Wf(e){if(!e||e.dataset.renderedTab!==a.activeTab)return null;const t=new Map;let n="",r=null,o=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((s,c)=>{const i=_c(s,c);if(t.has(i))return;const u=s.type==="checkbox"||s.type==="radio",d=s.tagName==="SELECT",m=u?String(s.defaultChecked):d?Nc(s):s.defaultValue,f=u?String(s.checked):s.value;if(f!==m&&(t.set(i,{value:f,defaultValue:m,isToggle:u,isSelect:d}),document.activeElement===s)){n=i;try{r=s.selectionStart,o=s.selectionEnd}catch{}}}),t.size?{tab:a.activeTab,fields:t,focusedKey:n,selectionStart:r,selectionEnd:o}:null}function _f(e,t){if(!e||!t||e.tab!==a.activeTab)return;const n=Array.from(t.querySelectorAll("input, textarea, select")),r=o=>{n.forEach((s,c)=>{const i=s.tagName==="SELECT";if(o!==i)return;const u=_c(s,c),d=e.fields.get(u);if(!d)return;const m=s.type==="checkbox"||s.type==="radio";if((m?String(s.defaultChecked):i?Nc(s):s.defaultValue)===d.defaultValue&&(m?s.checked=d.value==="true":s.value=d.value,u===e.focusedKey&&document.activeElement!==s))try{s.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&s.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function Nf(e){return!e||a.route!=="terminal"||a.activeTab==="terminal"||Wc.has(a.activeTab)||e.dataset.renderedTab!==a.activeTab||a.activeTab==="smartChart"&&a.chartScrollIntoView?null:{tab:a.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:Z?.scrollTop||0}}function Df(e,t){if(!e||e.tab!==a.activeTab)return;const n=()=>{const r=t?.isConnected?t:p("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),Z&&Z.scrollHeight>Z.clientHeight+2&&(Z.scrollTop=Math.min(e.dashboardScrollTop,Z.scrollHeight-Z.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};n(),requestAnimationFrame(n)}function Uf(){const e=p("[data-panel]");if(!e)return;const t=zs(e),n=Wf(e),r=Nf(e),o=a.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,s=a.activeTab==="terminal"?window.scrollY:0;if(document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),Hw(),document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===a.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const i=!!c.querySelector('[data-active="true"]'),u=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!u||!!a.navTekOpen||!rm()&&i}),a.activeTab==="terminal"&&(e.innerHTML=Gd()),a.activeTab==="tek"&&(e.innerHTML=Hf()),a.activeTab==="dashboard"&&(e.innerHTML=Jf()),a.activeTab==="profile"&&(e.innerHTML=Yf()),a.activeTab==="trade"&&(e.innerHTML=Wh()),a.activeTab==="bundle"&&(e.innerHTML=Kh()),a.activeTab==="volume"&&(e.innerHTML=dg()),a.activeTab==="live"&&(e.innerHTML=Gd()),a.activeTab==="liveTrades"&&(e.innerHTML=Lv()),a.activeTab==="slimeScope"&&(e.innerHTML=rv()),a.activeTab==="watchlist"&&(e.innerHTML=Nv()),a.activeTab==="smartChart"&&(e.innerHTML=yv()),a.activeTab==="launchCoin"&&(e.innerHTML=wg()),a.activeTab==="launch"&&(e.innerHTML=pg()),a.activeTab==="kol"&&(e.innerHTML=Wg()),a.activeTab==="ogreAi"&&(e.innerHTML=Hh()),a.activeTab==="wallets"&&(e.innerHTML=sy()),a.activeTab==="positions"&&(e.innerHTML=dy()),a.activeTab==="pnl"&&(e.innerHTML=hy()),a.activeTab==="txAudit"&&(e.innerHTML=Ud()),a.activeTab==="sniper"&&(e.innerHTML=Hv()),e.dataset.renderedTab=a.activeTab||"",a.activeTab==="ogreTek"&&(e.innerHTML=Yv(),e.dataset.renderedTab=a.activeTab||"",Xv()),_f(n,e),Ur(e),Df(r,e),a.activeTab==="smartChart"&&a.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=p("[data-chart-buy-amount]");c&&c.focus(),a.chartFocusAmountInput=!1}),a.activeTab==="smartChart"&&a.chartScrollIntoView&&(Of(e),a.chartScrollIntoView=!1),a.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=o),requestAnimationFrame(()=>{Math.abs(window.scrollY-s)>8&&window.scrollTo(0,s);const u=e.querySelector(".terminal-dock");u&&(u.scrollTop=o)})}js(t,e),df(),la(),Mr(),Ln(),xr(),Es(),a.activeTab==="kol"&&cl()}function qf(){const e=a.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${l(a.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${l(xt().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${l(a.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${l(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Hf(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${qf()}
      <div class="tek-tool-grid">
        ${e.map(([t,n,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${l(n)}</strong>
            <small>${l(r)}</small>
          </button>`).join("")}
      </div>
      ${zf()}
      ${jf()}
    </section>
  `}const Dc="slimewire-ogre-memory";function Ir(){try{return JSON.parse(localStorage.getItem(Dc)||"{}")||{}}catch{return{}}}function Or(e={}){const t={...Ir(),...e};try{localStorage.setItem(Dc,JSON.stringify(t))}catch{}return t}function Kf(e,t=""){if(!e)return;const r=(Ir().recentTokens||[]).filter(o=>o.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),Or({recentTokens:r.slice(0,5)})}(function(){const t=Ir();t.quickBuy&&!a.quickBuyAmountOverride&&(a.quickBuyAmountOverride=t.quickBuy)})();function Uc(){const t=zn().filter(i=>{const u=Number(i.marketCapUsd??i.marketCap)||0;return u>0&&u<8e3}).length,r=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active"].includes(String(i.status||"").toLowerCase())),o=r.filter(i=>{const u=Number(i.lastMovePct??i.wallets?.[0]?.lastMovePct),d=Number(i.takeProfitPct);return Number.isFinite(u)&&Number.isFinite(d)&&d>0&&u>d*.7}).length,s=Number(a.shieldReceipts?.stats?.watching||0),c=Number(a.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${o?` - ${o} near take-profit`:""}`:"",s?`🔎 ${s} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let qc=!1;function Vf(){if(qc||rn().length)return;qc=!0;const e=Uc(),t=Ir(),n=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=n.length?` I remember: ${n.join(", ")}.`:"";ie({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function zf(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...Uc(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${l(t)}</li>`).join("")}
      </ul>
    </section>
  `}function jf(){Xf();const e=a.shieldReceipts;if(!e)return`
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
                <span>Flagged ${l(r.verdict)} (score ${l(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${l(Gf(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${l(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function Gf(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let Hc=0;function Xf(){Date.now()-Hc<300*1e3||(Hc=Date.now(),k("/api/web/shield/receipts").then(e=>{a.shieldReceipts=e,a.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{a.proofStats=e?.alpha||null}).catch(()=>{}))}function Jf(){return`
    ${lh()}
    ${qa()}
    <section class="panel-grid">
      ${Wn("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${Wn("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${Wn("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${Wn("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${Wn("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${jc()}
    ${zc()}
    ${Gc()}
  `}function Yf(){if(!Gs())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${Kc(!1)}
        <section class="profile-row-list">
          ${rh()}
          ${Vc()}
        </section>
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:oh()},{key:"login",label:"Login",hint:"Security",html:sh()},{key:"pfp",label:"PFP",hint:"Avatar",html:ih()},{key:"x",label:"X",hint:"Connect X",html:hh()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:Qf()},{key:"badges",label:"Badges",hint:"Earned",html:Vc()},{key:"referral",label:"Referral",hint:"Invite & earn",html:gh()},{key:"board",label:"Board",hint:"Top traders",html:yh()}];return`
    <section class="profile-row-shell">
      ${Kc(!0)}
      ${Va({toolKey:"profile",activeKey:za("profile","account"),sections:t})}
    </section>
  `}function Qf(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",n=a.pushAlertsEnabled===!0;return`
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
  `}async function Zf(){const e=p("[data-push-status]");try{v(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){v(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),v(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){v(e,W(t?.message||"Could not create the link."))}}function eh(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(n);return Uint8Array.from([...r].map(o=>o.charCodeAt(0)))}async function th(){const e=p("[data-push-status]");try{v(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){v(e,"Push alerts are not configured on the server yet.");return}const n=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){v(e,"Notification permission was not granted.");return}const o=await n.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:eh(t.publicKey)}),s=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:o.toJSON()})});a.pushAlertsEnabled=!0,v(e,`Push alerts enabled (${s.devices||1} device${(s.devices||1)===1?"":"s"}).`),h()}catch(t){v(e,W(t?.message||"Could not enable push alerts."))}}async function ah(){const e=p("[data-push-status]");try{const n=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:n.endpoint})}).catch(()=>{}),await n.unsubscribe().catch(()=>{})),a.pushAlertsEnabled=!1,v(e,"Push alerts disabled on this device."),h()}catch(t){v(e,W(t?.message||"Could not disable push alerts."))}}async function nh(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a.pushAlertsEnabled=!!t}catch{}}function Gs(){return!!(se()?.publicKey||a.user?.connectedWallet?.publicKey||Array.isArray(a.wallets)&&a.wallets.length)}function Kc(e=Gs()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function rh(){const e=se();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${Fr().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${l(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${l(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function oh(){const e=a.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Ha("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${l(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${l(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function sh(){const e=a.user?.username||"";return`
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
  `}function lh(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function Wn(e,t,n,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${l(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${l(t)}</h3>
        <p>${l(n)}</p>
      </div>
    </article>
  `}function ih(){const e=!!a.user?.avatar,t=a.xHandle?`@${a.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${Ha("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${ch()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${a.xHandle?"":"disabled"}>${t?`Use ${l(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${a.user.avatarSource?` from ${l(a.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function ch(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,n])=>`
        <button type="button" data-preset-avatar="${l(t)}" data-avatar-label="${l(n)}" aria-label="Use ${l(n)} PFP">
          <img src="${l(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function Vc(){const e=Number(a.pnl?.totals?.tradeCount||0),t=Gs(),n=Number(a.livePairRows?.length||0)+Number(a.terminalEntry?.items?.length||0)+Number(a.livePairsByBucket?.fresh?.length||0),r=!!(a.lastUpdatedAt&&!a.walletRefreshError||a.walletRefreshStatus==="success"),o=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:n>0||!!a.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!ae("trade",a.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(a.livePairRows?.length||a.scan||a.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],s=o.filter(i=>i.earned).length,c=Math.round(s/Math.max(1,o.length)*100);return`
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
  `}function qa(){const e=a.user?.connectedWallet,t=!!a.user?.avatar,n=a.xHandle?`@${a.xHandle}`:"";return`
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
          ${Fr().map(r=>`
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

      ${Xs()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${Ha("SW")}</div>
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
  `}function cS(){const e=a.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${Fr().map(t=>`
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
    ${Xs({compact:!0})}
  `}function Xs({compact:e=!1}={}){const t=a.user?.connectedWallet,n=Array.isArray(a.wallets)?a.wallets.length:0,r=a.wallets.filter(u=>u.sessionWallet),o=a.user?.automationPermission||{},s=!!a.user?.automationPermissionActive,c=o.expiresAt?ye(o.expiresAt):"",i=a.automationDelegationStatus||(n?`${n} managed automation wallet(s) available. ${s?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
  `}function ia({returnPath:e="/terminal"}={}){a.walletConnectMenuOpen=!0,a.walletConnectReturnPath=e||"/terminal",a.walletConnectStatus=a.user?.connectedWallet?`Connected ${w(a.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function uh(e={}){return ia(e)}window.openWalletConnectModal=uh;function dh(e){a.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",a.walletFastApprovalsEnabled?"on":"off")}catch{}}function ph(){const e=p("[data-wallet-connect-modal]");if(!e)return;if(!a.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=a.user?.connectedWallet||a.connectedWalletBalance;e.hidden=!1,er(e,`
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
        ${Fr().map(n=>`
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
  `,".wallet-connect-dialog")}function mh(){const e=a.quickBuyModal||{},t=ho()?.tokenMint===e.tokenMint?ho():fe(e.tokenMint,{source:e.source||"quick-buy-modal"}),n=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=Js(e.error||e.status||""),o=n||!!r,s=le(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${st(t)}
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
          ${Ka(e.walletIndex||(se()?.publicKey?"connected":""))}
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
        <button type="button" class="primary" data-quick-buy-confirm ${o?"disabled":""}>${n?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${s?`<small class="quick-buy-wallet-note">${a.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${l(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${l(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${l(e.error||"")}</small>`}
    </section>
  `}function Js(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function fh(){let e=p("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!a.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=mh(),document.body.classList.add("quick-buy-modal-open")}function hh(){const e=!!a.xHandle;return`
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
  `}function gh(){const e=a.user?.referralCode||"",t=`${St.replace(/\/+$/,"")}/r/`,n=a.user?.referralLink||(e?`${St.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=a.user?.referralStats||{},o=Array.isArray(r.referrals)?r.referrals:[];return`
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
        ${n?Ke(`Trade faster on SlimeWire. Referral: ${n}`,"Share X"):""}
        ${n?Xc(`Trade faster on SlimeWire. Referral: ${n}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${l(e)}${a.user?.referredByCode?` | Referred by ${l(a.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function bh(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,St).pathname.split("/").map(s=>s.trim()).filter(Boolean),o=r.findIndex(s=>s.toLowerCase()==="r");if(o>=0&&r[o+1])return decodeURIComponent(r[o+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function yh(){const e=a.user?.traderBoardWalletMode||"all",t=Array.isArray(a.user?.traderBoardWalletIndexes)?a.user.traderBoardWalletIndexes:a.wallets.map(n=>String(n.index));return`
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
  `}function zc(){return`
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
  `}function jc(){return`
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
  `}function Gc(){return a.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ke(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${l(e)}">${l(t)}</button>`}function Xc(e,t="TG"){const n=Ys(e),r=`https://t.me/share/url?url=${encodeURIComponent(St)}&text=${encodeURIComponent(n)}`;return`<a href="${l(r)}" target="_blank" rel="noreferrer">${l(t)}</a>`}function Ys(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${St}`}function vh(e){const t=e.type==="buy",n=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${n}. Chart ${X(e.tokenMint)}`}function uS(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function wh(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Jc(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function Sh(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function kh(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${X(e.tokenMint)}`}function $h(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${X(e.tokenMint)}`}function Th(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function Ph(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Qs(e){const t=String(e||"").trim(),n=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${X(t)}`:"";return`Watching ${n}.${r}`}function Yc(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const Ah=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function Zs(e=""){const t=String(e||"").trim().toLowerCase();return Ah.filter(n=>!t||String(n.tier||"").toLowerCase()===t).sort((n,r)=>+!!r.pinned-+!!n.pinned||Number(n.rank||999)-Number(r.rank||999))}function Rt(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function Qc(e=""){const t=String(e||"").trim();return Rt(t)?t:""}function Ch(e={}){const t=String(e.wallet||"").trim(),n=Qc(t),r=ze(e.twitter||e.x||e.username||"");return{x:r?al(r):"",wallet:n?`https://solscan.io/account/${encodeURIComponent(n)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(n?Ji(n):"")}}function Lh(e={}){const t=String(e.wallet||"").trim(),n=Qc(t),r=Ch(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${l(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${l(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${l(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${n?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${n?`<button data-kol-scan-wallet="${l(n)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${n?`<button data-kol-copy-wallet="${l(n)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${n?`<button data-copy="${l(n)}">CA</button>`:""}
      ${il(e)}
    </div>
  `}function Zc(e={},t={}){const n=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${n?"is-compact":""}" data-tier="${l(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${au(e,n?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${l(e.tag||"Curated wallet")}</span>
          <h3>${l(e.name||e.twitter||w(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${l(ze(e.twitter))}`:l(w(r)||"Social pending")}</p>
        </div>
        <b>#${l(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${l(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${l(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${l(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${l(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${Lh(e)}
    </article>
  `}function Mh(){const e=Zs("hot"),t=Zs("slimewire");return`
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
            ${e.length?e.map(n=>Zc(n)).join(""):R("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(n=>Zc(n,{compact:!0})).join(""):R("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function Ha(e="SW"){const t=dt(a.user?.avatar||"");if(eu(t))return`<img src="${l(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${Vl("ogre")}';">`;const n=Vl("ogre");if(e==="SW"||e==="OG")return`<img src="${n}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${l(r)}</span>`}function eu(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function dt(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const n=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return n?`https://ipfs.io/ipfs/${encodeURIComponent(n).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function xh(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function Bh(e="",t=""){const n=String(e||"").trim(),r=dt(t);if(!n||!r||Er(n,r))return"";if(it.set(n,r),ee("avatarCacheHit"),it.size>900){for(const o of it.keys())if(it.delete(o),it.size<=720)break}return r}function tu(e="",t=""){return`${String(e||"").trim()}|${dt(t)}`}function Rh(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function Er(e="",t=""){const n=tu(e,t);if(!Gt.has(n))return!1;const r=Number(lr.get(n)||0);return r&&Date.now()-r>Rh(t)?(Gt.delete(n),lr.delete(n),!1):!0}function Ih(e="",t=""){const n=String(e||"").trim(),r=dt(t);if(!n||!r)return;const o=tu(n,r);if(Gt.add(o),lr.set(o,Date.now()),Gt.size>1200){for(const s of Gt)if(Gt.delete(s),lr.delete(s),Gt.size<=900)break}it.get(n)===r&&it.delete(n),ee("avatarFetchFailed")}function el(e="",...t){const n=String(e||"").trim(),r=n?it.get(n):"";if(r&&!Er(n,r))return ee("avatarCacheHit"),r;r&&it.delete(n);for(const o of t){const s=dt(o);if(s&&!Er(n,s))return ee("avatarCacheMiss"),s}return ee("avatarFallbackShown"),""}window.__slimeRememberAvatar=Bh,window.__slimeAvatarLoadFailed=function(t){const n=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Ih(n,r);const o=dt(t?.dataset?.backupSrc||"");if(o&&!Er(n,o)){t.dataset.backupSrc="",t.dataset.avatarSrc=o,t.src=o;return}t&&(t.hidden=!0,t.removeAttribute("src"))};function tl(e){const t=ze(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function al(e=a.xHandle){const t=ze(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Oh(e={}){const t=dt(e.avatar||e.image||"");if(eu(t))return t;const n=ze(e.twitter||e.x||e.username||"");if(n)return tl(n);const r=ze(e.name||e.kolName||"");return r&&r.length>=2?tl(r):""}function Eh(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function au(e={},t="kol-avatar"){const n=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=el(n,Oh(e)),o=Eh(e);return r?`<img class="${l(t)}" src="${l(r)}" data-avatar-key="${l(n)}" data-avatar-fallback="${l(o)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${l(t)} kol-avatar-fallback" aria-hidden="true">${l(o)}</div>`}function Fr(){const e=Ue();return[{id:"phantom",label:"Phantom",detected:!!de("phantom"),mobileRedirect:e&&!!kn("phantom"),installUrl:Cs("phantom"),icon:Fa("phantom")},{id:"solflare",label:"Solflare",detected:!!de("solflare"),mobileRedirect:e&&!!kn("solflare"),installUrl:Cs("solflare"),icon:Fa("solflare")},{id:"backpack",label:"Backpack",detected:!!de("backpack"),mobileRedirect:!1,installUrl:Cs("backpack"),icon:Fa("backpack")},{id:"solana",label:"Detected Wallet",detected:!!de("solana"),mobileRedirect:!1,installUrl:"",icon:Fa("solana")}]}function de(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function Re(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function se(){return a.user?.connectedWallet||a.connectedWalletBalance||null}function Fh(e=""){const t=se();if(!t?.publicKey)return"";const n=String(e||"")==="connected"||!e&&!a.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${n?"selected":""}>${l(r)} - ${l(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}function Wh(){const e=se(),t=a.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const n=Ws(),r=gc(),o=fc(n)||{symbol:n==="SOL"?"SOL":w(n),name:n==="SOL"?"Solana":""},s=fc(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=gf(),i=a.swapDirection==="sell",u=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":i?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",d=i?n:r,m=d&&d!=="SOL"?d:a.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${i?"100":"0.0"}" aria-label="${i?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${hc(n,{includeCustom:!1,walletOnly:!0})}
              </select>`,b=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${l(m||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${hc(r,{includeCustom:!0})}
              </select>`;return`
    <section class="trade-layout">
      <article class="trade-card slime-swap-card ogre-swap-card ogre-swap-skin">
        <h3 class="ogre-swap-title oss-a11y-title">OgreSwap - live on-chain Solana swapper</h3>
        <div class="oss-stage-wrap">
          <div class="oss-stage" role="group" aria-label="OgreSwap swap panel">
            ${`
            <div class="oss-slot oss-pay" data-swap-slot="${i?"token":"base"}">${i?b:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${i?"base":"token"}">${i?f:b}</div>`}
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
                ${Ka(e?.publicKey&&!t?"connected":"")}
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
          ${a.tradeToken?`<div class="card-actions">${Ke(Qs(a.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${Xh()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${_h()}
        ${Nh()}
      </aside>
    </section>
  `}function nl(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!e?.volumeBot)}function nu(){return(Array.isArray(a.wallets)?a.wallets:[]).filter(e=>!!e?.volumeBot)}function Ka(e=""){const t=Fh(e),n=nl().map(r=>{const o=a.balances.find(i=>Number(i.index)===Number(r.index)),s=o?.sol!==null&&o?.sol!==void 0?`${Number(o.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${l(r.label)}${c} - ${s}</option>`}).join("");return t||n?`${t}${n}`:'<option value="">No wallet connected</option>'}function _h(){if(!a.tradeResult)return`
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
        ${Ke(vh(e))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Nh(){if(!a.tradePlanResult)return`
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
        <div><dt>Timer Exit</dt><dd>${l(Yh(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${Ke(wh(e,"Armed managed trade"))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function ru(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const n=t.toLowerCase(),r=n.includes("bonk")?"Bonk":n.includes("meteora")?"Meteora":n.includes("orca")?"Orca":n.includes("raydium")?"Raydium":n.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${l(t)}">${l(r)}</span>`}function Dh(){if(!a.ogreAiResult)return`
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
              ${ru(s)}
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
            ${ru(o)}
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
  `}const _n=[["super_fresh","Super-fresh","Brand-new sub-$8K launches with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function Wr(){const e=n=>_n.some(([r])=>r===n);if(a.ogreAiCategory&&e(a.ogreAiCategory))return a.ogreAiCategory;const t=bi().category;return e(t)?t:"super_fresh"}function ou(e){const t=_n.find(([n])=>n===e);return t?t[2]:_n[0][2]}function Uh(e){return`<div class="ogre-cat-segment" role="group">${_n.map(([t,n])=>`<button type="button" data-ogre-cat="${l(t)}" data-active="${e===t}">${l(n)}</button>`).join("")}</div>`}function qh(){const e=a.ogreAutopilot||{},t=!!e.enabled,n=su(e.category||Wr()),r=(c,i)=>c==null||c===""?i:c,o=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),s=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
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
  `}function su(e){const t=_n.find(([n])=>n===e);return t?t[1]:"Super-fresh"}function Hh(){if(!a.wallets.length)return`${qa()}${R("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=bi(),t=e.amountSol||"0.1",n=e.runCount||"1",r=(s,c,i)=>{const u=String(s||i||"");return u==="custom"?String(c||"custom"):u},o=Wr();return`
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
          ${Uh(o)}
          <small class="ogre-cat-hint">${l(ou(o))}</small>
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
          ${Ot({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${Ot({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Ve("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${Ot({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${pt("ogre-ai")}
        </div>
        ${It("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${a.ogreAiLoading?"disabled":""}>${a.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${l(a.ogreAiStatus||ou(o))}</small>
      </article>

      <aside class="trade-side">
        ${Xs({compact:!0})}
        ${qh()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${Dh()}
      </aside>
    </section>
  `}function Kh(){return a.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${a.bundleToken?X(a.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${Va({toolKey:"bundle",activeKey:za("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${l(a.bundleToken||a.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${pt("bundle")}
        </div>
        ${It("bundle")}
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
              ${Ve("bundle-plan-delay","data-bundle-plan-delay","5")}
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
              ${_r("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${Dr("bundle-plan")}
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
        ${Jh()}
        ${Vh()}
      </aside>
    </section>
  `:`${qa()}${R("No wallets loaded yet","Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`}function Vh(){if(!a.bundleResult)return`
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
  `}function pt(e,t=null){const n=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return nl().map((o,s)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${o.index}" ${r?r.has(String(o.index))?"checked":"":s<n?"checked":""}>
      <span>${o.index}. ${l(o.label)}</span>
      <code>${l(o.shortPublicKey||o.publicKey)}</code>
    </label>
  `).join("")}function It(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${l(t)}">
    </label>
  `}function zh(e=""){return a.wallets.length?a.wallets.map((t,n)=>{const r=String(t.index??n+1),o=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${l(r)}" ${String(e)===r?"selected":""}>${l(o)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function M(e,t,n=""){const r=p(e)?.value||n;if(r!=="custom")return r;const o=p(t)?.value?.trim();if(!o)throw new Error("Enter the custom value first.");return o}function tt(e,t=""){const n=a.presets?.[e]||[],r=!t||t==="none"||t==="manual",o=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return n.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${n.map(s=>`<option value="${l(s.id)}" ${s.id===t?"selected":""}>${l(s.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${o}</option>
    `}function lu(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${l(Ne()||"0.10")}" value="${l(a.quickBuyAmountOverride)}">`}function iu(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${lu()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${l(e)}">
          ${tt("trade",a.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const jh=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],Gh=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function Ot({selectAttr:e,customAttr:t,customFor:n,options:r,selected:o="",customType:s="text",customPlaceholder:c="Custom time"}){const i=String(o||""),d=new Set(r.map(([f])=>f)).has(i)?i:"custom",m=d==="custom"&&i!=="custom"?i:"";return`
    <select ${e} data-custom-select="${l(n)}">
      ${r.map(([f,b])=>`<option value="${l(f)}" ${f===d?"selected":""}>${l(b)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${l(n)}" type="${l(s)}" value="${l(m)}" placeholder="${l(c)}" ${d==="custom"?"":"hidden"}>
  `}function Ve(e,t,n="off"){return Ot({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:jh,selected:n,customPlaceholder:"Custom: 45s, 20, 2h"})}function _r(e,t,n="0"){return Ot({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:Gh,selected:n,customPlaceholder:"Custom: 30s, 20, 2h"})}function rl(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${lu()}
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
  `}function dS(){const e=a.fastTradePresetStatus||(a.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${Ka()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${Ve("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function pS(){const e=a.fastBundlePresetStatus||(a.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${pt("fast-bundle-preset")}</div>
        ${It("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${Ve("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function cu(e){const t=e==="trade"?a.editingTradePresetId:a.editingBundlePresetId;return t?ae(e,t):null}function Nr(e,t){e==="trade"&&(a.editingTradePresetId=t||""),e==="bundle"&&(a.editingBundlePresetId=t||"")}function Xh(){const e=cu("trade"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${l(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${Ka(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${l(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${l(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${Ve("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${uu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function Jh(){const e=cu("bundle"),t=!!e?.readonly,n=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${l(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${pt("bundle-preset",e?.walletIndexes||null)}</div>
      ${It("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${l(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${l(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${Ve("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${n}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${uu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function uu(e){const t=a.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const n=e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId;return`
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
  `}function Yh(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function Dr(e){return`
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
  `}function ca(e){return{walletTakeProfitTargets:M(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:M(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function Ur(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(o=>o.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function Qh(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),n=document.querySelector(`[data-custom-select="${t}"]`);n&&(n.value="off"),Ur()}function du(){return a.wallets.map(e=>`<option value="${l(e.index)}">${l(e.index)}. ${l(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function Zh(){return a.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${du()}</select>
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
  `:""}function qr(e){a.distributeStatus=String(e||"");const t=p("[data-distribute-status]");t&&(t.textContent=a.distributeStatus)}function eg(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.wallets.filter(r=>r.sessionWallet),n=t.length?t:a.wallets;return n.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${l(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${a.returnFundsBusy?"disabled":""}>${a.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${l(a.returnFundsStatus||`${n.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function Nn(e){a.returnFundsStatus=String(e||"");const t=p("[data-return-funds-status]");t&&(t.textContent=a.returnFundsStatus)}async function pu(e="leaving"){try{const t=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!t?.publicKey)return;const n=a.wallets.filter(s=>s.sessionWallet);if(!n.length)return;const r=n.map(s=>String(s.index));if(!await Te({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Q})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function tg(){if(a.returnFundsBusy)return;const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey){Nn("Connect a wallet first.");return}const t=a.wallets.filter(s=>s.sessionWallet),r=(t.length?t:a.wallets).map(s=>String(s.index));if(!r.length){Nn("No managed wallets to return from.");return}if(await Te({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){a.returnFundsBusy=!0,Nn("Selling tokens and returning SOL..."),h();try{const s=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:Q});a.returnFundsBusy=!1,Nn(s.summary||"Funds returned to your connected wallet."),await We({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(s){a.returnFundsBusy=!1,Nn(s.message),h()}}}async function ag(){if(a.distributeBusy)return;const e=p("[data-distribute-count]")?.value||"5",t=p("[data-distribute-amount]")?.value||"",n=p("[data-distribute-source]")?.value||"1",r=p("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){qr("Enter SOL per wallet greater than zero.");return}const o=(Number(t)||0)*(Number(e)||0);if(await Te({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${o.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){a.distributeBusy=!0,qr("Creating and funding wallets..."),h();try{await G(p("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:n,label:r}),dedupe:!1,timeoutMs:Q});c.downloads?.encryptedBackup?.text&&pe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&pe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.distributeBusy=!1,qr(c.summary||"Fresh wallets created and funded. Backups downloaded."),await We({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){a.distributeBusy=!1,qr(c.message),h()}}}function ng(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function rg(){const e=nu().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${a.sweepBackgroundStatus?`<small data-sweep-background-status>${l(a.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function og(){const e=Array.isArray(a.volumeBots)?a.volumeBots:[],t=rg();return e.length?t+e.map(n=>{const r=n.stats||{},o=n.status!=="completed",s=(n.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${l(n.shortMint||n.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${l(n.stage||"")}">${l(ng(n))}</span>
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
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function ol(e,t,n){return`<div class="vbot-segment" role="group">${n.map(([r,o])=>`<button type="button" data-vbot-set-${e}="${l(r)}" data-active="${t===r}">${l(o)}</button>`).join("")}</div>`}function sg(){const t=(Array.isArray(a.volumeBots)?a.volumeBots:[]).filter(c=>c.status!=="completed"),n=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),o=c=>c.reduce((i,u)=>i+Math.max(0,Number(u.cycles||0)-Number(u.currentCycle||0)),0),s=(c,i,u,d,m)=>`
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
    </div>`}function lg(){return`
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
        <div class="ovs-mode">${ol("mode",a.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${ol("aggr",a.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${du()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Stagger pattern</span>
            ${ol("stagger",a.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Ladder"]])}
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
          ${sg()}
        </div>

        <div class="volume-bot-list">
          ${og()}
        </div>
      </div>
    </section>
  `}function ig(){const e=a.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(a.slimeBotAggr)?a.slimeBotAggr:"med",n=Math.max(.05,Math.min(50,Number(p("[data-vbot-invest-num]")?.value||p("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(p("[data-vbot-duration]")?.value||"60"))),s={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",i=s.delaySecs*(c?4:1);let u=Math.round(r*60/i);u=Math.max(1,Math.min(250,u,Math.floor(n/.01)));const d=Math.max(.005,Math.min(.5,n/u));return{tokenMint:p("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:p("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(s.walletCount),fundPerWalletSol:c?"":(d+.02).toFixed(4),buyAmountSol:d.toFixed(4),sellPercent:"100",buyBias:String(s.buyBias),cycles:String(u),maxRounds:String(u),delaySecs:String(s.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!p("[data-vbot-keepdust]")?.checked,offsetSell:!!p("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(a.slimeBotStagger)?a.slimeBotStagger:"steady",investment:n,durationMin:r,mode:e,aggr:t}}function ua(e){a.volumeBotStatus=String(e||"");const t=p("[data-vbot-status]");t&&(t.textContent=a.volumeBotStatus)}async function Hr({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");a.volumeBots=Array.isArray(t.bots)?t.bots:[],a.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function cg(){if(a.volumeBotBusy)return;const e=ig();if(!e.tokenMint){ua("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Te({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){a.volumeBotBusy=!0,ua("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:Q});a.volumeBotBusy=!1,r.bot&&(a.volumeBots=[r.bot,...a.volumeBots.filter(o=>o.id!==r.bot.id)]),ua(r.bot?.message||"SlimeBot started."),h(),Hr()}catch(r){a.volumeBotBusy=!1,ua(r.message),h()}}}async function ug(e){if(e)try{ua("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:Q});t.bot&&(a.volumeBots=a.volumeBots.map(n=>n.id===t.bot.id?t.bot:n)),ua(t.bot?.message||"Stop requested."),h(),Hr()}catch(t){ua(t.message)}}function dg(){return a.wallets.length?lg():`${qa()}${R("No wallets loaded yet","Create or restore a managed wallet above first. SlimeBot funds and trades from managed wallets, so it needs at least one saved source wallet.")}`}function pg(){const e=he([...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...Fe()?.rows||[],...a.scan?.rows||[]]).sort(Xe),t=en(e),n=Ze("launch",t),r=Za(),o=gt(Ae().keywords)[0]||"";return`
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
        ${Bl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${xl(e,t)}
        ${n.length?nt(n,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:wa}):r?Qn(e,"launch candidates"):R("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
        ${oa("launch",t,"launch candidates")}
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
        ${It("launch")}
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
            ${Ve("launch-delay","data-launch-delay","3")}
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
            ${_r("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${Dr("launch")}
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
          <p>It scans live launch/profile feeds about every ${l(Bg())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${yu()}
        </article>
      </aside>
    </section>
  `}function mu(e=a.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||a.launchWatches?.[0]?.tokenMint||a.launchWatches?.[0]?.mint||a.smartChartToken?.tokenMint||a.smartChartToken?.mint||"").trim()}function sl(){return!!(zt&&zt.enabled&&(zt.provider||zt.playbackBaseUrl||zt.ingestUrl))}function mg(){const e=String(zt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function fg(e){const t=String(zt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const n=t.includes("?")?"&":"?";return`${t}${n}mint=${encodeURIComponent(e)}`}function hg(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function fu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function gg(e=a.launchCoinDraft||{}){const t=mu(e),n=sl(),r=fg(t),o=a.pumpLiveStatus||(t?n?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),s=t?"":"disabled",c=n&&r?`<iframe class="pump-live-frame" src="${l(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
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
          <div class="pump-live-stat"><span>Launch CA</span><strong>${l(hg(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${l(mg())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${l(fu(t))}</strong></div>
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
  `}function Va({toolKey:e,activeKey:t,sections:n,variant:r=""}){const o=n.some(s=>s.key===t)?t:n[0]?.key;return`
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
  `}function za(e,t){return a.toolSections&&a.toolSections[e]||t}function bg(){const e=a.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,n=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${l(ea(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ke(n+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function yg(e={}){hu();const t=a.hypePages||[],n=new Date(Date.now()+600*1e3).toISOString().slice(0,16);return`
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
        <input data-hype-launch-at type="datetime-local" min="${n}">
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
          ${t.map(r=>`
            <div class="row-card">
              <div class="row-main">
                <strong>$${l(r.symbol)} ${r.mint?"🚀 launched":"⏳ counting down"}</strong>
                <small>${l(r.subscribers||0)} waiting | ${l(r.url)}</small>
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.url)}">Copy Link</button>
                <a class="button-like" href="${l(r.url)}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>`).join("")}
        </div>`:""}
    </div>`}let Kr="";function hu(){!a.user||Kr===a.user.id||(Kr=a.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});a.hypePages=e.pages||[],a.hypePages.length&&h()}catch{Kr=""}})())}async function vg(){const e=p("[data-hype-status]"),t=String(p("[data-hype-name]")?.value||p("[data-launch-coin-name]")?.value||"").trim(),n=String(p("[data-hype-symbol]")?.value||p("[data-launch-coin-symbol]")?.value||"").trim(),r=String(p("[data-hype-launch-at]")?.value||"").trim(),o=String(p("[data-hype-blurb]")?.value||"").trim();if(!t||!n){v(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){v(e,"Pick the launch time.");return}v(e,"Creating hype page...");try{const s=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:n,blurb:o,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});a.hypeStatus=`Hype page live: ${s.url} - share it everywhere, it forwards to your chart at launch.`,Kr="",hu(),h()}catch(s){v(e,W(s?.message||"Could not create the hype page."))}}function wg(){const e=a.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
                ${zh(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
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
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${l(e.amountSol||Ne()||"0.1")}">
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
              ${Ve("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
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
            ${It("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:yg(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:gg(e)}];return`
    ${bg()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${Va({toolKey:"launchCoin",activeKey:za("launchCoin","coin"),sections:t})}

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
          ${yu()}
        </article>
      </aside>
    </section>
  `}function Sg(){const e=a.launchCoinDraft||{},t=p("[data-launch-coin-image]")?.files?.[0];return{name:(p("[data-launch-coin-name]")?.value||"").trim(),symbol:(p("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(p("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",website:(p("[data-launch-coin-website]")?.value||"").trim(),x:(p("[data-launch-coin-x]")?.value||"").trim(),telegram:(p("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:p("[data-launch-coin-creator-fee]")?.value||e.creatorFeeBps||"0",creatorFeeRecipient:(p("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:p("[data-launch-coin-fee-mode]")?.value||e.feeMode||"standard",buybackWallet:(p("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!p("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!p("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:p("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:j(p("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(p("[data-launch-coin-ca]")?.value||"").trim(),action:p("[data-launch-coin-action]")?.value||"watch",tradePresetId:p("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:p("[data-launch-coin-bundle-preset]")?.value||"",amountSol:j(p("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:p("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:_e("launch-coin"),walletGroup:p("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:M("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:M("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:M("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:M("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function Vr(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function ll({silent:e=!1}={}){try{const t=Sg();a.launchCoinDraft=t,vi(t);const n=t.name||t.symbol||"launch";return a.launchCoinStatus=`Saved ${n}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${Vr(t.action)}.`,e||v(p("[data-launch-coin-status]"),a.launchCoinStatus),t}catch(t){throw a.launchCoinStatus=t.message,v(p("[data-launch-coin-status]"),t.message),t}}function kg(e){return new Promise((t,n)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>n(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function $g(e){return new Promise((t,n)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>n(new Error("Could not preview that image for compression.")),r.src=e})}function Tg(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function Pg(e){if(!e)return"";const t=8*1024*1024,n=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const o=await kg(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(o.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return o}try{const s=await $g(o),c=384,i=Math.min(1,c/Math.max(s.width||c,s.height||c)),u=document.createElement("canvas");u.width=Math.max(1,Math.round((s.width||c)*i)),u.height=Math.max(1,Math.round((s.height||c)*i)),u.getContext("2d").drawImage(s,0,0,u.width,u.height);const m=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,b]of m){const y=u.toDataURL(f,b);if(y.length<=n)return y}}catch(s){const c=p("[data-launch-coin-status]"),i="Preview unavailable; SlimeWire will try to convert this image during launch.";if(a.launchCoinStatus=i,v(c,i),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:s?.message||""}),o.length<=r)return o}if(o.length<=r){const s=p("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return a.launchCoinStatus=c,v(s,c),o}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function Ag(){const e=p("[data-launch-coin-image]")?.files?.[0];if(!e)return{};const t=await Pg(e);return{imageName:e.name,imageType:Tg(t,e.type||"application/octet-stream"),imageDataUrl:t}}function gu(e,t){const n=String(t||"").trim();a.launchCoinDraft={...e||{},tokenMint:n,updatedAt:new Date().toISOString()},vi(a.launchCoinDraft),a.terminalToken=n,a.terminalAutoToken=n,a.tradeToken=n,a.bundleToken=n,a.volumeToken=n,a.smartChartToken=n,e?.tradePresetId&&(a.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(a.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(a.quickBuyAmountOverride=j(e.amountSol))}function Cg(e={}){const t=e.tradePresetId?ae("trade",e.tradePresetId):null,n=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,amountSol:j(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Lg(e={}){const t=e.tradePresetId?ae("trade",e.tradePresetId):null,n=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:n,walletIndexes:[n],amountSol:j(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function bu(e={}){const t=e.bundlePresetId?ae("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:j(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Mg(){const e=ll({silent:!0}),t=String(e.tokenMint||"").trim(),n=p("[data-launch-coin-status]");if(!t||t.length<32){a.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",v(n,a.launchCoinStatus);return}gu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";a.launchCoinStatus=`Loaded ${w(t)} into ${Vr(e.action)}. Review the selected preset before sending any trade.`,Me("/terminal",r),h({force:!0})}async function xg(){if(a.launchCoinSubmitting)return;const e=p("[data-launch-coin-status]"),t=p("[data-launch-coin-submit]");a.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const n=ll({silent:!0});if(!n.name||String(n.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!n.symbol||String(n.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!p("[data-launch-coin-image]")?.files?.[0]&&!await Te({title:"No Coin Image Selected",lines:[`${n.name} (${n.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){a.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",v(e,a.launchCoinStatus);return}a.launchCoinStatus="Preparing image for SlimeWire backend conversion...",v(e,a.launchCoinStatus);const r=await Ag(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let s=null;if(n.action==="bundle"){const b=bu(n);s={walletIndexes:b.walletIndexes||[],walletGroup:b.walletGroup||"",amountSol:b.amountSol||"0",slippageBps:b.slippageBps||"300"}}const c={...n,...r,launchAttemptId:o,...s?{bundleBuy:s}:{}},i=JSON.stringify(c);if(i.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:n.symbol,selectedDevWalletId:n.selectedDevWalletId||n.devWalletIndex||n.devWalletPublicKey||""}),a.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,v(e,a.launchCoinStatus);const d=(await k("/api/web/launch/coin",{method:"POST",body:i,timeoutMs:Q,preserveSafeError:!0})).launch||{},m=String(d.tokenMint||d.mint||d.ca||d.contractAddress||"").trim(),f=d.signature?` Signature: ${w(d.signature)}.`:"";if(!m){a.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${f} Paste the CA above when it appears, then tap Use Live CA.`,v(e,a.launchCoinStatus);return}if(gu(n,m),a.launchShareKit={tokenMint:m,symbol:n.symbol||"",name:n.name||"",at:Date.now()},d.bundled){const b=Number(d.bundledWalletCount||0),S=[d.devBuyIncluded?"dev buy":"",b>0?`${b} bundle buy${b===1?"":"s"}`:""].filter(Boolean).join(" + ");a.launchCoinStatus=`Launch bundled atomically: ${w(m)}${S?` (${S} landed in-block)`:""}.${f} Opening chart...`,v(e,a.launchCoinStatus),Me("/terminal/chart","smartChart"),h({force:!0});return}if(a.launchCoinStatus=`Launch returned ${w(m)}.${f} Routing into ${Vr(n.action)}...`,v(e,a.launchCoinStatus),n.devBuyEnabled&&(a.launchCoinStatus=`Launch returned ${w(m)}.${f} Running Dev Wallet Initial Buy first...`,v(e,a.launchCoinStatus),await co(m,Lg(n)),a.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${Vr(n.action)} setup...`,v(e,a.launchCoinStatus)),n.action==="trade"){await co(m,Cg(n));return}if(n.action==="bundle"){await Ku(m,bu(n));return}if(n.action==="launch-watch"){a.activeTab="launch",Me("/terminal","launch"),h({force:!0});return}Me("/terminal/chart","smartChart"),h({force:!0})}catch(n){const r=n.launchAttemptId&&!String(n.message||"").includes(n.launchAttemptId)?` Launch ID: ${n.launchAttemptId}.`:"";a.launchCoinStatus=`${n.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:n.launchAttemptId||"",stage:n.stage||"",code:n.code||"",providerStatus:n.providerStatus||null,message:n.message||"Launch failed."}),v(e,a.launchCoinStatus),$(a.launchCoinStatus)}finally{a.launchCoinSubmitting=!1;const n=p("[data-launch-coin-submit]");n&&(n.disabled=!1,n.textContent=n.dataset.prevLabel||"Launch on Pump")}}function Bg(){const e=a.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function yu(){return a.launchWatches.length?`
    <div class="mini-results">
      ${a.launchWatches.map(e=>`
        <span>
          $${l(e.ticker)} - ${l(e.status)} - ${l(e.walletCount)} wallet(s)
          ${Ke(Ph(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${l(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function zr(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function vu(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),n=ze(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),o=String(e.kolName||e.traderName||e.kol_name||"").trim(),s=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||n||o||r,wallet:t,kolWallet:t,twitter:n,handle:n,name:o||s||e.signalType||e.symbol||w(r),displayName:o||s||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||n?1:0),currentPositionCount:I(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:a.kolLastUpdatedAt||new Date().toISOString()}}function jr(e={}){const t=Number(I(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),n=at(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(n),o=r?Math.max(0,Math.min(100,Math.round(n))):0,s=!r||t<5,c=s?"Mixed":o>=50?"High Dump Risk":o>=30?"Dump Risk":o<=15?"Trusted Flow":"Mixed",i=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),u=i[0]||"",d=ze(e.handle||e.twitter||""),m=[{label:"Solscan",url:u?`https://solscan.io/account/${encodeURIComponent(u)}`:""},{label:"KOLscan",url:u?`https://kolscan.io/account/${encodeURIComponent(u)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(d?`https://x.com/${d}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,b,y)=>/^https?:\/\//i.test(String(f.url||""))&&y.findIndex(S=>String(S.url||"")===String(f.url||""))===b).slice(0,6);return{kolId:zr(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:d,walletAddresses:i,callsTracked:t,currentPositionCount:I(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:o,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?o:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:s,confidence:s?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:m,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:s?["Low local sell-window history. Wallet-based until social signal data is available."]:o>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function Rg(e=[]){const t=new Map;for(const n of e.filter(Boolean)){const r=String(n.kolId||zr(n)||"").trim();if(!r)continue;const o=t.get(r);t.set(r,o?{...o,...n,kolId:r}:{...n,kolId:r})}return[...t.values()]}function Gr(){const e=Array.isArray(a.kolDumpStats?.stats)?a.kolDumpStats.stats:[],t=Array.isArray(a.kolScan?.kols)?a.kolScan.kols:[],n=Array.isArray(a.kolScan?.rows)?a.kolScan.rows.map(vu):[],r=!e.length&&!t.length&&!n.length?Zs():[];return Rg([...e,...t.map(jr),...n.map(jr),...r.map(jr)]).filter(o=>o.kolId)}function Ig(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function Dn(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${Ig(e)} · ${t}`}function wu(e={}){const t=zr(e);return t?Gr().find(n=>String(n.kolId||"")===t)||jr(e):null}function Og(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const n=Rt(t)?t:"";return{kolId:t,displayName:n?w(n):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:n?[n]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:n?`https://solscan.io/account/${encodeURIComponent(n)}`:""},{label:"KOLscan",url:n?`https://kolscan.io/account/${encodeURIComponent(n)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function il(e={},t="KOL Info"){if(!_("kolDumpDetectorEnabled",!0))return"";const n=wu(e),r=String(n?.kolId||zr(e)||"").trim();if(!r)return"";const o=n?Dn(n):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${l(r)}" title="${l(o)}">${l(t)}</button>`}function Su(e={},t="KOL Info"){return _("kolDumpDetectorEnabled",!0)?il(vu(e),t):""}function Eg(e={}){if(!_("kolDumpDetectorEnabled",!0))return"";const t=wu(e);return t?.kolId?`<small class="kol-dump-inline">${l(Dn(t))}</small>`:""}function mS(){if(!_("kolDumpDetectorEnabled",!0))return"";const e=Gr().slice(0,6);return`
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
              <p>${l(Dn(t))}</p>
              <button type="button" data-kol-dump-details="${l(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:R("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function cl(e={}){if(!_("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&a.kolDumpStatsLoadedAt&&Date.now()-Number(a.kolDumpStatsLoadedAt||0)<900*1e3)return a.kolDumpStats;if(a.kolDumpStatsLoading)return null;a.kolDumpStatsLoading=!0;try{const n=new URLSearchParams({mode:a.kolMode||"hot"});a.kolWallet&&n.set("wallet",a.kolWallet),t&&n.set("force","true");const r=await k(`/api/web/kols/dump-stats?${n.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return a.kolDumpStats=r,a.kolDumpStatsLoadedAt=Date.now(),ee(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return a.kolDumpStats=a.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},a.kolDumpStatsLoadedAt=Date.now(),null}finally{a.kolDumpStatsLoading=!1,a.kolDumpDetails?.open?Xr():a.activeTab==="kol"&&h({force:!0})}}function Fg(e=""){const t=String(e||"").trim();!t||!_("kolDumpDetectorEnabled",!0)||(a.kolDumpDetails={open:!0,kolId:t},xa(),Xr(),cl({force:!0}))}function ul(){a.kolDumpDetails={open:!1,kolId:""},Xr(),wr()}function Xr(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=a.kolDumpDetails||{},n=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",n),!n||!_("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=Gr().find(d=>String(d.kolId)===String(t.kolId))||Og(t.kolId),o=!!a.kolDumpStatsLoading,s=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(d=>/^https?:\/\//i.test(String(d?.url||""))).slice(0,4):[],i=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",u=`
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
        <p>${l(Dn(r))}</p>
        <small>${o?"Updating from KOL sources...":`Confidence: ${l(r.confidence||"low")} · Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${l(ye(r.updatedAt))}`}</small>
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
          <li><span>First seen: ${l(r.firstSeenAt?ye(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${l(r.lastSeenAt?ye(r.lastSeenAt):"n/a")}</span></li>
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
  `;er(e,u,".kol-dump-drawer")}function Wg(){const e=a.kolScan?.configured!==!1,t=a.kolLoading?"disabled":"",n=String(a.kolMode||"hot"),r=!!a.kolScan,o=!!a.kolScan?.kols?.length,s=o&&n!=="hot",c=!r&&!o;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${a.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${a.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${a.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${a.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${a.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${a.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${l(Ng(a.kolMode))}</p>
    ${_g()}
    ${s?Ug():c?Mh():""}
    ${a.kolMode==="slimewire"&&a.kolScan?a.kolScan.kols?.length?"":R("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):a.kolScan?qg():R("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
          ${It("kol")}
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
            ${Ve("kol-delay","data-kol-delay","5")}
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
            ${_r("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${Dr("kol")}
        <p class="trade-status" data-kol-status>${a.kolResult?l(a.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${Dg()}
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
            ${a.kolWallet?Ke(Yc(a.kolWallet),"Share KOL"):""}
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
  `}function _g(){const e=a.kolScan||null,t=Un(a.kolMode),n=a.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),o=Number(e?.rows?.length||0),s=a.kolLastUpdatedAt?ye(a.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${l(n)}</span>
      <span>${l(r)} KOLs</span>
      <span>${l(o)} signals</span>
      <span>${l(s)}</span>
    </div>
  `}function Un(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function Ng(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function Dg(){const e=a.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function Ug(){const e=a.kolScan||{},t=(e.kols||[]).filter(n=>n.wallet||n.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${l(e.label||"KOL Tracker")}</h3>
          <p>${l(`${Un(a.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${l(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((n,r)=>`
          <article class="kol-profile">
            ${au(n)}
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
            <small>${l(n.source==="slimewire"?`Tracking ${n.trackedWalletMode==="manual"?`${n.trackedWalletCount||0} wallet(s)`:"all wallets"}`:n.volumeLabel||"Volume n/a")} | Last trade: ${l(ye(n.lastTradeAt))}</small>
            ${Eg(n)}
            <div class="card-actions kol-profile-actions">
              ${n.solscanUrl?`<a href="${l(n.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${n.kolscanUrl||n.wallet?`<a href="${l(n.kolscanUrl||Ji(n.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${il(n)}
              ${Ke(Th(n),"Share Watch")}
              ${n.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(n.wallet)}">Copy Trade</button>`:""}
              ${n.wallet?`<button data-kol-scan-wallet="${l(n.wallet)}">Scan Positions</button>`:""}
              ${n.wallet?`<button data-kol-copy-wallet="${l(n.wallet)}">Copy Wallet</button>`:""}
              ${n.wallet?`<button data-copy="${l(n.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function qg(){const e=a.kolScan||{};if(e.configured===!1)return R("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],n=Ze("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${l(Un(a.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${n.length}/${t.length} signals shown</span>
    </div>
    ${nt(n,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:$h})}
    ${oa("kol",t,"KOL signals")}
  `:R(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function ku(){const e=p("input[data-wallet-label]"),t=p("input[data-wallet-count-input]"),n=p("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),v(n,"Creating wallets..."),r.forEach(o=>{o.disabled=!0,v(o,"Creating...")});try{const o=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(o)||o<1||o>20)throw new Error("Wallet count must be from 1 to 20.");await G(n,"Creating secure web profile for wallet backups...");const s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:o})}),c=Array.isArray(s.wallets)?s.wallets:[];if(!c.length)throw new Error(s.message||"Wallet create did not return wallet data. Refresh and try again.");a.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&pe(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&pe(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),v(n,s.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const i=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(i?.wallets)&&(a.wallets=i.wallets)}catch{}a.toolSections={...a.toolSections||{},wallets:"balances"},a.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,H(Pe(s.plan),"wallet-create"),a.activeTab="wallets",h()}catch(o){v(n,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,v(o,"Create Wallets")})}}async function Hg(){const e=p("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),a.automationDelegationStatus="Creating automation wallet...",v(e,a.automationDelegationStatus),t.forEach(n=>{n.disabled=!0,v(n,"Creating...")});try{await G(e,"Creating secure web profile for automation wallet backups...");const n=a.user?.connectedWallet,r=n?.publicKey?`Automation ${w(n.publicKey)}`:"Automation Wallet",o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(o.wallets)?o.wallets:[]).length)throw new Error(o.message||"Automation wallet create did not return wallet data. Refresh and try again.");a.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&pe(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&pe(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),a.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",H(Pe(o.plan),"automation-wallet-create"),a.activeTab="wallets",h({force:!0})}catch(n){a.automationDelegationStatus=n.message,v(e,n.message),$(n.message)}finally{t.forEach(n=>{n.disabled=!1,v(n,"Create Automation Wallet")})}}function Kg(e=null){const n=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||p("[data-session-wallet-amount]"),r=j(n?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const o=Number(r);if(!Number.isFinite(o)||o<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(o>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function Vg(e=se()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(a.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});ue(t.user||{...a.user,connectedWallet:t.profile?.connectedWallet||null})}async function zg(e=null){const t=p("[data-automation-delegation-status]")||p("[data-wallet-connect-status]"),n=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),n.forEach(r=>{r.disabled=!0,v(r,"Opening...")});try{const r=Kg(e),{provider:o,connected:s}=await Ou();await G(t,"Creating secure web profile for session wallet..."),await Vg(s),a.automationDelegationStatus="Creating session wallet and funding approval...",v(t,a.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(s.publicKey)}`}),dedupe:!1,timeoutMs:Q});a.wallets=Array.isArray(c.wallets)?c.wallets:a.wallets,a.downloads=c.downloads||a.downloads||null,c.downloads?.encryptedBackup?.text&&pe(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&pe(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),a.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",v(t,a.automationDelegationStatus);const i=await vb(c.order?.transaction,o);a.automationDelegationStatus="Submitting session wallet funding...",v(t,a.automationDelegationStatus);const u=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:i}),dedupe:!1,timeoutMs:Q});a.wallets=Array.isArray(u.wallets)?u.wallets:a.wallets,a.automationDelegationStatus=u.message||"Session wallet funded and ready.",H(u.signature||"","session-wallet-funded"),await ut({force:!0,deep:!0,reason:"session-wallet-funded"}),a.activeTab="wallets",h({force:!0})}catch(r){const o=W(r.message||"Session wallet setup failed.");a.automationDelegationStatus=o,v(t,o),$(o)}finally{n.forEach(r=>{r.disabled=!1,v(r,"Start Session Wallet")})}}async function dl(e="enable",t={}){const n=p("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],o=e!=="revoke";if(o&&!Oc()){a.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",v(n,a.automationDelegationStatus),$(a.automationDelegationStatus),Vs();return}Ic(!o,t.scope||""),a.automationDelegationStatus=o?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",v(n,a.automationDelegationStatus),r.forEach(s=>{s.disabled=!0,v(s,o?"Enabling...":"Revoking...")});try{await G(n,"Creating secure web profile for automation permission...");const s=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:o?"enable":"revoke",ttlHours:720})});ue(s.user||{...a.user,automationPermission:s.profile?.automationPermission||null});const c=a.user?.automationPermission||{};a.automationDelegationStatus=o?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${ye(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(s){a.automationDelegationStatus=s.message,v(n,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,v(s,s.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function pl(e={}){const t=!!e.silent,n=e.refreshWallet!==!1;if(!a.user||!a.token){t||$("Log in or create a web account before checking server exits.");return}if(gr){a.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}gr=!0,t||(a.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:Q});a.tradePlans=r.plans||a.tradePlans||[];const o=r.runner||{},s=r.webExitGuards||{},c=r.portfolioExits||{},i=Number(o.soldWallets||0)+Number(s.soldGuards||0)+Number(c.soldPositions||0),u=Number(o.triggeredWallets||0)+Number(s.triggeredGuards||0)+Number(c.triggeredPositions||0);if(o.skipped){const d=Number(o.activeForMs||0),m=d>0?` for ${Math.ceil(d/1e3)}s`:"";a.automationDelegationStatus=o.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${m}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${o.reason||"runner busy"}.`,n&&!t&&await Bs({force:!0});return}a.automationDelegationStatus=jg(o),(n||i>0||u>0)&&await Bs({force:!0}),t&&(i>0||u>0)&&h({preserveSmartChartFrame:a.activeTab==="smartChart"})}catch(r){a.automationDelegationStatus=r.message,a.walletRefreshError=r.message,t||$(r.message)}finally{gr=!1,t||(a.walletRefreshing=!1,h())}}function jg(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),n=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),o=Number(e.failedWallets||0),s=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${n}, sold ${r}, failed ${o}.${s}`}function ml(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(a.tradePlans||[]).some(t=>{const n=String(t.status||"").toLowerCase();return n==="launch_watch"?!0:n!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function Gg(){return!!(Ec()&&ml()&&!gr)}function Jr(){ml()&&(a.automationDelegationStatus=a.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),Xg()}let Yr="";function Xg(){const t=(Array.isArray(a.tradePlans)?a.tradePlans:[]).filter(i=>["watching","active","armed","pending"].includes(String(i.status||"").toLowerCase()));if(!t.length){Yr="";return}const n=Date.now(),r=t.filter(i=>i.automationPermissionExpiresAt&&!i.automationPermissionActive),o=t.filter(i=>{if(!i.automationPermissionActive)return!1;const u=Date.parse(i.automationPermissionExpiresAt||"");return Number.isFinite(u)&&u>n&&u-n<3600*1e3});let s="";if(r.length)s=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(o.length){const i=Math.min(...o.map(d=>Date.parse(d.automationPermissionExpiresAt)));s=`TP/SL permission expires in ~${Math.max(1,Math.round((i-n)/6e4))} min with ${o.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=s?`${r.length}:${o.length}`:"";s&&c!==Yr?(Yr=c,$(s)):s||(Yr="")}function Jg(){mn.forEach(e=>window.clearTimeout(e)),mn=[]}function Qr(){Jg(),a.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",mn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const n=window.setTimeout(()=>{mn=mn.filter(r=>r!==n),!(!a.user||!a.token||!ml())&&pl({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{a.automationDelegationStatus=r.message})},t);return n})}async function Yg(){const e=p("[data-restore-text]"),t=p("[data-restore-status]");if(!e||!t)return;const n=e.value.trim();if(!n){v(t,"Choose a backup file or paste backup text first.");return}v(t,"Restoring wallets...");try{await G(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:n})});a.restoreResult=r.restore,r.restore?.downloads&&(a.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&pe(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&pe(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",v(t,r.restore?.message||"Restore complete."),await We({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(r){v(t,r.message)}}async function Qg(){const e=p("[data-export-status]");if(e){v(e,"Building backup files...");try{await G(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});a.backupResult=t.backup,t.backup?.downloads&&(a.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&pe(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&pe(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),v(e,t.backup?.message||"Backup ready."),h()}catch(t){v(e,t.message)}}}async function Zg(){const e=p("[data-import-label]"),t=p("[data-import-secret]"),n=p("[data-import-status]");if(!e||!t||!n)return;const r=e.value.trim()||"Imported Wallet",o=t.value.trim();if(!o){v(n,"Paste a private key or JSON secret-key array first.");return}v(n,"Importing wallet...");try{await G(n,"Creating secure web profile for imported wallet...");const s=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:o})});a.importResult=s.imported,s.imported?.downloads&&(a.downloads=s.imported.downloads,s.imported.downloads.encryptedBackup&&pe(s.imported.downloads.encryptedBackup.filename,s.imported.downloads.encryptedBackup.text),s.imported.downloads.recoveryKeys&&pe(s.imported.downloads.recoveryKeys.filename,s.imported.downloads.recoveryKeys.text)),t.value="",v(n,s.imported?.message||"Import complete."),await We({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(s){v(n,s.message)}}async function eb(e,t="this wallet",n=""){const r=String(t||`Wallet ${e}`);if(!await Te({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Te({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=p("[data-wallet-remove-status]");a.walletRemoveStatus=`Backing up ${r} before removal...`,v(c,a.walletRemoveStatus),$("");try{const i=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(n?{publicKeys:[n]}:{walletIndexes:[String(e)]})}),u=i.removed||{};a.downloads=u.downloads||a.downloads,u.downloads?.encryptedBackup?.text&&pe(u.downloads.encryptedBackup.filename,u.downloads.encryptedBackup.text),u.downloads?.recoveryKeys?.text&&pe(u.downloads.recoveryKeys.filename,u.downloads.recoveryKeys.text),a.walletRemoveStatus=u.message||`Removed ${r}.`,Array.isArray(u.wallets)&&(a.wallets=u.wallets),H(Pe(i.plan),"wallet-remove"),a.activeTab="wallets",h()}catch(i){a.walletRemoveStatus=i.message,v(c,i.message),$(i.message)}}function tb(){const e=String(p("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(n=>n.trim()).filter(Boolean),walletGroup:String(p("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(p("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(p("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(p("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function ab(){const e=String(p("[data-wallet-send-from]")?.value||"1").trim(),t=String(p("[data-wallet-send-managed-targets]")?.value||"").trim(),n=String(p("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(p("[data-wallet-send-destinations]")?.value||"").trim(),o=t.toLowerCase()==="all"?a.wallets.map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):t.split(/[,\s]+/).map(u=>Number.parseInt(u,10)).filter(u=>Number.isInteger(u)&&u>0&&String(u)!==e),s=n?a.wallets.filter(u=>{const d=String(u.label||"").toLowerCase();return d===n||d.startsWith(`${n} `)}).map(u=>Number(u.index)).filter(u=>Number.isFinite(u)&&String(u)!==e):[],c=[...new Set([...o,...s])].map(u=>a.wallets.find(d=>Number(d.index)===u)?.publicKey).filter(Boolean),i=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(p("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!p("[data-wallet-send-all]")?.checked,destinations:i}}function nb(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const n=e.rows.slice(0,6).map(r=>{const o=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,s=r.ok?"ok":"failed";return`${o}: ${s} - ${r.message||r.signature||"done"}`});t.push(...n),e.rows.length>n.length&&t.push(`...${e.rows.length-n.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function rb(e){const t=p("[data-wallet-sweep-status]");a.walletSweepStatus="Running wallet action...",v(t,a.walletSweepStatus),$("");try{await G(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const o=e==="send-sol-many"?ab():tb();if(e==="sell-all"&&(o.destination=""),e==="sell-all-sweep"&&!o.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const s=await k(r,{method:"POST",body:JSON.stringify(o),timeoutMs:Q});a.walletSweepStatus=nb(s.sweep),v(t,a.walletSweepStatus),await We({force:!0,deep:!0}),a.activeTab="wallets",h()}catch(n){a.walletSweepStatus=n.message,v(t,n.message),$(n.message)}}async function ob(e){const t=p("[data-restore-status]"),n=p("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!n)){v(t,"Reading backup file...");try{n.value=await r.text(),v(t,"Backup loaded. Tap Restore Wallets.")}catch(o){v(t,`Could not read file: ${o.message}`)}}}function pe(e,t){const n=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(n),o=document.createElement("a");o.href=r,o.download=e,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function sb(){const e=p("[data-x-handle]"),t=p("[data-x-status]"),n=ze(e?.value||"");if(!n){v(t,"Enter a valid X handle first.");return}const r=window.open(al(n),"_blank","noopener,noreferrer");try{v(t,r?`Opening X and saving @${n}...`:`Saving @${n}. Allow popups if X did not open.`),await G(t,"Creating secure web profile for X sharing...");const o=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:n})});ue(o.user||{...a.user,xHandle:o.profile?.xHandle||n}),hi(a.xHandle),v(t,`Connected @${a.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(o){v(t,o.message),$(o.message)}}function lb(){const e=p("[data-x-status]"),t=ze(p("[data-x-handle]")?.value||a.xHandle||""),n=al(t||a.xHandle);window.open(n,"_blank","noopener,noreferrer"),v(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function ib(){const e=p("[data-x-status]"),t=p("[data-x-handle]");try{if(!a.user||!a.token){a.xHandle="",t&&(t.value=""),es(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const n=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});ue(n.user||{...a.user,xHandle:""}),a.xHandle="",t&&(t.value=""),es(),v(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(n){v(e,n.message),$(n.message)}}async function Zr(e,t="Saving PFP..."){const n=p("[data-avatar-status]");v(n,t);try{await G(n,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});ue(r.user||{...a.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),v(n,a.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){v(n,r.message),$(r.message)}}async function cb(e){const t=p("[data-avatar-status]"),n=e?.files?.[0];if(n){if(!/^image\/(png|jpe?g|webp)$/i.test(n.type)){v(t,"Use a PNG, JPG, or WebP image.");return}if(n.size>5*1024*1024){v(t,"Use an image under 5 MB.");return}try{v(t,"Compressing PFP...");const r=await $u(n);await Zr({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){v(t,r.message),$(r.message)}finally{e.value=""}}}function $u(e){return new Promise((t,n)=>{const r=new FileReader;r.onerror=()=>n(new Error("Could not read that image.")),r.onload=()=>{const o=new Image;o.onerror=()=>n(new Error("Could not load that image.")),o.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const i=c.getContext("2d");if(!i){n(new Error("This browser cannot resize images."));return}const u=Math.max(256/o.width,256/o.height),d=Math.round(o.width*u),m=Math.round(o.height*u),f=Math.round((256-d)/2),b=Math.round((256-m)/2);i.clearRect(0,0,256,256),i.drawImage(o,f,b,d,m);const y=c.toDataURL("image/jpeg",.84);if(y.length>22e4){n(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(y)},o.src=String(r.result||"")},r.readAsDataURL(e)})}async function ub(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,n=new URL(String(e||""),t).toString(),r=await fetch(n,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const o=await r.blob();return $u(o)}async function db(){const e=tl(a.xHandle);if(!e){const t=p("[data-avatar-status]");v(t,"Connect an X handle first.");return}await Zr({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function Tu(e,t={}){const n=wn(),r=de(e);if(!r){if(await ji(e,t)||Gi(e))return;const o=Fi(e);te(o),At(e,new Error(o),{action:"provider_missing",platform:Ue()?"mobile":"desktop"});return}try{const o=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(o){if(!(t.confirmSwitch===!1?!0:await Te({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(o)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){te("Wallet connection unchanged."),Me("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}te(`Opening ${Re(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,i=c?.toBase58?.()||c?.toString?.()||"";if(!i)throw new Error("Wallet connected, but no public address was returned.");await G(n,"Creating secure web profile for connected wallet...");const u=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:i,provider:Re(e,r)})});ue(u.user||{...a.user,connectedWallet:u.profile?.connectedWallet||null}),a.connectedWalletBalance={publicKey:i,shortPublicKey:w(i),provider:Re(e,r),tokens:[]},Ks(`connected:${i}`),a.walletConnectMenuOpen=!1,te(`Connected ${w(i)}. Opening Live Terminal...`),Me(t.returnPath||a.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Fc("browser-wallet-connect"),Ar("browser-wallet-connect")}catch(o){const s=o.message||"Wallet connection was cancelled.";te(s),At(e,o,{action:"connect_failed"})}}async function Pu(){await pu("disconnecting");const e=wn(),t=a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"";if(!a.user||!a.token){a.connectedWalletBalance=null,Ks(t?`connected:${t}`:""),te("Connected wallet disconnected."),h({force:!0});return}try{const n=a.user?.connectedWallet?.provider||"";await(n.toLowerCase().includes("phantom")?de("phantom"):n.toLowerCase().includes("solflare")?de("solflare"):n.toLowerCase().includes("backpack")?de("backpack"):de("solana"))?.disconnect?.()}catch{}try{const n=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});ue(n.user||{...a.user,connectedWallet:null}),a.connectedWalletBalance=null,Ks(t?`connected:${t}`:""),te("Connected wallet disconnected."),h({force:!0})}catch(n){te(n.message),$(n.message)}}async function pb(){const e=p("[data-profile-username]"),t=p("[data-profile-password]"),n=p("[data-login-security-status]"),r=String(e?.value||"").trim(),o=String(t?.value||"");if(!r||!o){v(n,"Enter a username and password first.");return}try{await G(n,"Creating secure web profile..."),v(n,"Saving login...");const s=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:o})});ue(s.user||{...a.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),v(n,"Saved. You can now log back in with this username and password."),h()}catch(s){v(n,s.message),$(s.message)}}function ze(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function fl(e){const t=Ys(e),n=String(a.user?.referralLink||"").trim(),r=n&&!t.includes("/r/")?n:St,o=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(o,"_blank","noopener,noreferrer")}function Au(e){const t=e==="kol",n=p(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=p("[data-share-watch-status]"),o=n?.value?.trim()||"";if(!o){v(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}fl(t?Yc(o):Qs(o)),v(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function Cu(e){const t={};a.token&&(t.Authorization=`Bearer ${a.token}`);const n=await bn(ea(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!n.ok){const r=await Ei(n);throw new Error(r.message||r.error||`Could not build PnL card (${n.status}).`)}return{blob:await n.blob(),filename:n.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function Lu(e){const{blob:t,filename:n}=await Cu(e),r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=n,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function mb(e,t){try{const{blob:n,filename:r}=await Cu(e),o=new File([n],r,{type:"image/png"});if(navigator.canShare?.({files:[o]})){await navigator.share({title:"SlimeWire PnL Card",text:Ys(t),url:St,files:[o]});return}await Lu(e),fl(`${t} PnL card downloaded and ready to attach.`)}catch(n){$(n.message)}}function Mu(e="buy"){const t=p("[data-trade-wallet]")?.value||"",n=bf(e)||p("[data-trade-token]")?.value?.trim()||"",r=M("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,e==="sell"?(a.tradeSwapFrom=n,a.tradeSwapTo="SOL"):(a.tradeSwapFrom="SOL",a.tradeSwapTo=n),{walletIndex:t,tokenMint:n,slippageBps:r}}function le(e=""){return String(e||"").trim().toLowerCase()==="connected"}function fb(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function xu(){const e=Array.isArray(a.wallets)?a.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(fb(e[t]))return e[t];return null}function Bu(e=se()){if(!e?.publicKey)return!1;const t=qn(e),n=de(t)||de("solana");return!!(n&&typeof n.signTransaction=="function")}function eo(e=se()){const t=e?.provider||Re(qn(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function to(e={},{side:t="trade",statusWriter:n=me,allowSessionFallback:r=!0}={}){if(!le(e.walletIndex))return{form:e,sessionWallet:null};if(Bu())return{form:e,sessionWallet:null};const o=r?xu():null;if(o?.index){const s=`Using Session Wallet ${o.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof n=="function"&&n(s),{form:{...e,walletIndex:String(o.index)},sessionWallet:o}}throw new Error(eo())}function Ru(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Iu(e=""){const t=atob(String(e||"")),n=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)n[r]=t.charCodeAt(r);return n}function qn(e=se()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function hb(e=se(),{returnPath:t=Ea()||"/terminal/trade"}={}){const n=qn(e),r=e?.provider||Re(n);if(ia({returnPath:t}),Ue()&&e?.publicKey&&!de(n)){const s=eo(e);return te(s),s}if(zi(n)){const s=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(te(s),await ji(n,{returnPath:t}).catch(()=>!1))return s}if(Gi(n))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const o=Fi(n);return te(o),o}async function Ou(){const e=se();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=qn(e),n=de(t)||de("solana");if(!n){if(Ue()&&e?.publicKey)throw new Error(eo(e));const s=await hb(e,{returnPath:Ea()||"/terminal/trade"});throw new Error(s)}if(typeof n.signTransaction!="function")throw Ue()&&e?.publicKey?new Error(eo(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"";let o=r();if(o!==e.publicKey)try{const s=await n.connect?.({onlyIfTrusted:!0});o=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r()}catch{}if(o!==e.publicKey){const s=await n.connect?.({onlyIfTrusted:!1}),c=s?.publicKey?.toBase58?.()||s?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:n,connected:e}}async function gb(){try{if(Ue())return;const e=se();if(!e?.publicKey)return;const t=qn(e),n=de(t)||de("solana");if(!n||typeof n.connect!="function"||(n.publicKey?.toBase58?.()||n.publicKey?.toString?.()||"")===e.publicKey)return;await n.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const bb=6e4;async function Eu(e,t,n=bb){let r=0;const o=new Promise((s,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},n)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),o])}finally{window.clearTimeout(r)}}async function yb(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.VersionedTransaction.deserialize(Iu(e)),r=await Eu(t,n);return Ru(r.serialize())}async function vb(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const n=window.solanaWeb3.Transaction.from(Iu(e)),r=await Eu(t,n);return Ru(r.serialize())}function wb({side:e,connected:t,form:n={},actionDetail:r="",amountSol:o="",amountMode:s="",percent:c=""}={}){const i=e==="sell"?"Sell":"Buy",u=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),d=e==="sell"?`${c||r||"100"}%`:s==="max"?"Max SOL":`${o||r||"custom"} SOL`;return Te({title:`Confirm ${i}`,lines:[`${i} with ${u}?`,`Token: ${n.tokenMint||""}`,`Amount: ${d}`,"Next step: approve the transaction in your wallet."],confirmLabel:i})}async function Hn({side:e,form:t,actionDetail:n,amountSol:r="",amountMode:o="",percent:s="",attemptId:c,statusWriter:i=me}){const u=typeof i=="function"?i:me,{provider:d,connected:m}=await Ou();if(!a.walletFastApprovalsEnabled&&!await wb({side:e,connected:m,form:t,actionDetail:n,amountSol:r,amountMode:o,percent:s}))throw new Error("Connected-wallet trade cancelled.");bp(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),Ce("submitted","pending"),u(a.walletFastApprovalsEnabled?`Building ${e} approval for ${m.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:m.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:o,percent:s,tradeAttemptId:c}),dedupe:!1,timeoutMs:Q});Ce("submitted","ok"),Ce("approved","pending",`Approve in ${m.provider||"your wallet"}`),u(`Approve ${e} in ${m.provider||"your wallet"}...`);let b;try{b=await yb(f.order?.transaction,d)}catch(S){throw Ce("approved","fail",W(S?.message||"Wallet approval was declined.")),S}Ce("approved","ok"),Ce("sent","pending"),u("Submitting signed trade...");let y;try{y=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:b}),dedupe:!1,timeoutMs:Q})}catch(S){throw q(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"error",error:W(S?.message||"Trade submit failed.")}),H("",`browser-${e}-error`,{tradeAttemptId:c}),Ce("sent","fail",W(S?.message||"Submit failed - it may still have landed; positions are being re-checked.")),u(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),S}return Ce("sent","ok"),Ce("confirmed",y.trade?.signature?"ok":"pending",y.trade?.signature?`tx ${String(y.trade.signature).slice(0,8)}...`:""),a.tradeResult=y.trade,u(y.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),q(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,n,{state:"submitted",signature:y.trade?.signature||""}),H(y.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),y.trade}function mt(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function ja(e,t){const n=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(n)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Sb(){const e=M("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=M("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let n=M("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=M("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=ja(n,r),{enabled:mt(e)||mt(t)||mt(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function Fu(){const e=M("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=M("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let n=M("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=M("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:n,sellPercent:r}=ja(n,r),{enabled:mt(e)||mt(t)||mt(n),takeProfitPct:e,stopLossPct:t,sellDelay:n,sellPercent:r}}function me(e){const t=p("[data-trade-status]");v(t,e)}function Ie(e=""){a.chartTradeStatus=String(e||""),v(p("[data-chart-trade-status]"),a.chartTradeStatus)}function hl(e="",t=""){a.quickBuyModal={...a.quickBuyModal,status:String(e||""),error:String(t||"")};const n=p("[data-quick-buy-modal-status]"),r=p("[data-quick-buy-modal-error]");v(n,a.quickBuyModal.status),v(r,a.quickBuyModal.error),n&&(n.hidden=!a.quickBuyModal.status),r&&(r.hidden=!a.quickBuyModal.error)}async function ao(e,t="fixed"){const n=C();let r=t==="max"?"max":String(e||"custom"),o="";try{let s=Mu("buy");r=t==="max"?"max":String(e||"custom");const c=Qe("trade-buy",s.tokenMint,r);if(c){ee("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(s.tokenMint)}:${r}`});return}o=ct("trade-buy");const i={tokenMint:s.tokenMint,walletIndex:s.walletIndex,slippageBps:s.slippageBps,tradeAttemptId:o};if(t==="max")i.amountMode="max";else{const b=Number(e);if(!Number.isFinite(b)||b<=0)throw new Error("Enter a buy amount greater than zero.");i.amountSol=String(b)}if(s=to(s,{side:"buy",statusWriter:me}).form,i.walletIndex=s.walletIndex,le(s.walletIndex)){q("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:C()-n,requestId:o,details:`browser-buy:${w(s.tokenMint)}:${r}`}),me("Building wallet-approved buy..."),oe(),await Hn({side:"buy",form:s,actionDetail:r,amountSol:i.amountSol||"",amountMode:i.amountMode||"fixed",attemptId:o}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),$e("trade-buy",s.tokenMint,r,3e3);return}const d=Sb();d.enabled&&Object.assign(i,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),q("trade-buy",s.tokenMint,r,{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-n,requestId:o,details:`trade-buy:${w(s.tokenMint)}:${r}`}),h(),me(d.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await Ee(20);const m=C();q("trade-buy",s.tokenMint,r,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...i,clientClickToUiMs:Math.round(m-n)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-m,requestId:o,resultCount:f.trade?.signature?1:0,details:"trade-buy"}),a.tradeResult=f.trade,bp(`Buy ${w(s.tokenMint||"")}`),Ce("submitted","ok"),Ce("sent","ok"),Ce("confirmed",f.trade?.signature?"ok":"pending",f.trade?.signature?`tx ${String(f.trade.signature).slice(0,8)}...`:""),f.trade?.autoExitPlan?(Ce("armed","ok"),a.tradePlanResult=f.trade.autoExitPlan,me(f.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),Qr()):f.trade?.autoExitRequested&&(Ce("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),me("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),q("trade-buy",s.tokenMint,r,{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"trade-buy",{tradeAttemptId:o}),a.activeTab="trade",h(),$e("trade-buy",s.tokenMint,r,3e3)}catch(s){o&&(q("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,{state:"error",error:W(s.message||"Buy failed")}),$e("trade-buy",a.tradeToken||p("[data-trade-token]")?.value||"",r,4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-n,requestId:o,errorCode:s?.code||s?.name||"TRADE_BUY_FAILED",details:W(s.message||"Buy failed")}),me(s.message)}}async function gl(e){const t=C(),n=ct("manual-sell");let r=null,o=String(e||"custom");try{r=Mu("sell");const s=Number.parseInt(e,10);if(o=String(s||o),!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=Qe("trade-sell",r.tokenMint,o);if(c){ee("buttonDoubleClickPrevented"),E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${s}`});return}if(q("trade-sell",r.tokenMint,o,{state:"clicked",tradeAttemptId:n,clickedAt:new Date().toISOString()}),me("Sending sell..."),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-t,requestId:n,details:`${w(r.tokenMint)}:${s}`}),r=to(r,{side:"sell",statusWriter:me}).form,le(r.walletIndex)){oe();const m=C();q("trade-sell",r.tokenMint,o,{state:"submitting"}),await Hn({side:"sell",form:r,actionDetail:o,percent:String(s),attemptId:n}),E({component:"manual-sell",action:"browser-sell-request",durationMs:C()-m,requestId:n,resultCount:a.tradeResult?.signature?1:0,details:"browser-wallet"}),a.activeTab="trade",h({preserveSmartChartFrame:a.activeTab==="smartChart"}),$e("trade-sell",r.tokenMint,o,3e3);return}h(),await Ee(20);const u=C();q("trade-sell",r.tokenMint,o,{state:"submitting"});const d=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:s,manualSellAttemptId:n,clientClickToUiMs:Math.round(u-t)}),timeoutMs:Q,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-u,requestId:n,resultCount:d.trade?.signature?1:0,details:"single-wallet"}),a.tradeResult=d.trade,me(d.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),q("trade-sell",r.tokenMint,o,{state:"submitted",signature:d.trade?.signature||""}),H(d.trade?.signature||Pe(d.trade),"manual-sell-trade"),a.activeTab="trade",h(),$e("trade-sell",r.tokenMint,o,3e3)}catch(s){r?.tokenMint&&(q("trade-sell",r.tokenMint,o,{state:"error",error:W(s.message||"Sell failed")}),$e("trade-sell",r.tokenMint,o,4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-t,requestId:n,errorCode:s?.code||s?.name||"MANUAL_SELL_FAILED",details:W(s.message||"Sell failed")}),me(s.message)}}function kb(){const e=_e("trade-plan"),t=p("[data-trade-plan-group]")?.value?.trim()||"",n=p("[data-trade-token]")?.value?.trim()||"",r=M("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),o=M("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),s=M("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=M("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),i=M("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:i}=ja(c,i));const u=M("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.tradeToken=n,a.volumeToken=n,a.bundleToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:c,takeProfitPct:o,stopLossPct:s,sellPercent:i,loopCount:"1",loopDelay:"0",slippageBps:u,...ca("trade-plan")}}async function $b(){try{const e=kb();me("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});a.tradePlanResult=t.plan,a.tradeResult=null,H(t.trade?.signature,"trade-plan"),a.activeTab="trade",h()}catch(e){me(e.message)}}function Tb(){const e=_e("volume"),t=p("[data-volume-group]")?.value?.trim()||"",n=p("[data-volume-token]")?.value?.trim()||"",r=p("[data-volume-amount]")?.value||"";let o=M("[data-volume-delay]","[data-volume-delay-custom]","5");const s=M("[data-volume-tp]","[data-volume-tp-custom]","25"),c=M("[data-volume-sl]","[data-volume-sl-custom]","8"),i=M("[data-volume-loop]","[data-volume-loop-custom]","1"),u=M("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let d=M("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:o,sellPercent:d}=ja(o,d));const m=M("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!n)throw new Error("Paste a token CA first.");return a.volumeToken=n,{walletIndexes:e,walletGroup:t,tokenMint:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:d,slippageBps:m,...ca("volume")}}function Wu(e){const t=p("[data-volume-status]");v(t,e)}async function Pb(){try{const e=Tb();Wu("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});a.volumeResult=t.plan,H(Pe(t.plan),"volume-plan"),a.activeTab="volume",h()}catch(e){Wu(e.message)}}function Ab(e){const t=_e("sniper"),n=p("[data-sniper-group]")?.value?.trim()||"",r=p("[data-sniper-amount]")?.value||"",o=M("[data-sniper-delay]","[data-sniper-delay-custom]",a.scanMode==="pumpsnipe"?"3":"5"),s=M("[data-sniper-tp]","[data-sniper-tp-custom]",a.scanMode==="pumpsnipe"?"40":"25"),c=M("[data-sniper-sl]","[data-sniper-sl-custom]","8"),i=M("[data-sniper-loop]","[data-sniper-loop-custom]","1"),u=M("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),d=M("[data-sniper-slippage]","[data-sniper-slippage-custom]",a.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{mode:a.scanMode,tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,slippageBps:d,loopCount:i,loopDelay:u,...ca("sniper")}}function _u(e){const t=p("[data-sniper-status]");v(t,e)}async function Cb(e){try{const t=Ab(e);_u("Buying and arming exits...");const n=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});a.sniperResult=n.plan,H(Pe(n.plan),"sniper-entry"),a.activeTab="sniper",h()}catch(t){_u(t.message)}}function Lb(){const e=_e("ogre-ai"),t=p("[data-ogre-ai-group]")?.value?.trim()||"",n=p("[data-ogre-ai-amount]")?.value?.trim()||"",r=Wr(),o=p("[data-ogre-ai-runs]")?.value||"1",s=p("[data-ogre-ai-tp]")?.value||"25",c=p("[data-ogre-ai-tp-custom]")?.value?.trim()||"",i=p("[data-ogre-ai-sl]")?.value||"8",u=p("[data-ogre-ai-sl-custom]")?.value?.trim()||"",d=p("[data-ogre-ai-delay]")?.value||"5",m=p("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=p("[data-ogre-ai-slippage]")?.value||"400",b=p("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";tm({amountSol:n,runCount:o,category:r,takeProfitSelect:s,takeProfitCustom:c,stopLossSelect:i,stopLossCustom:u,delaySelect:d,delayCustom:m,slippageSelect:f,slippageCustom:b,walletGroup:t});const y=M("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),S=M("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),P=M("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),T=M("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),g="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!n)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:n,runCount:o,sellDelay:y,takeProfitPct:S,stopLossPct:P,sellPercent:"100",slippageBps:T,minScore:g,recentMints:gi()}}function no(e){a.ogreAiStatus=e||"";const t=p("[data-ogre-ai-status]");v(t,a.ogreAiStatus)}async function Mb(){if(br){no("Ogre A.I. is already scanning. Please wait for completion.");return}const e=Symbol("ogre-ai-run");try{const t=Lb();a.ogreAiLoading=!0,br=e,no("Scanning fresh low-MC pairs and arming managed exits..."),h();const n=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify(t),timeoutMs:Q});a.ogreAiResult=n.ogreAi,em(n.ogreAi),a.tradePlanResult=n.ogreAi?.plans?.[0]||a.tradePlanResult,no(n.ogreAi?.message||"Ogre A.I. run armed."),H(Pe(n.ogreAi?.plans?.[0]),"ogre-ai-run"),a.activeTab="ogreAi",h()}catch(t){no(t.message),$(t.message)}finally{a.ogreAiLoading=!1,br===e&&(br=null),h()}}function Kn(e){const t=p("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function xb({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");a.ogreAutopilot=t.autopilot||null,a.activeTab==="ogreAi"&&h()}catch(t){e||Kn(t.message)}}function Bb(){return{enabled:!!p("[data-autopilot-enabled]")?.checked,category:Wr(),amountSol:p("[data-ogre-ai-amount]")?.value?.trim()||(a.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:M("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:M("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:M("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:M("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:_e("ogre-ai"),walletGroup:p("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:p("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:p("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:p("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:p("[data-autopilot-interval]")?.value?.trim()||"10"}}async function Rb(){if(a.ogreAutopilotBusy)return;const e=Bb();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){Kn("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Te({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${su(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){a.ogreAutopilotBusy=!0,Kn(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});a.ogreAutopilot=t.autopilot||null,Kn(a.ogreAutopilot?.lastStatus||"Saved.")}catch(t){Kn(t.message),$(t.message)}finally{a.ogreAutopilotBusy=!1,h()}}}function Et(e){const t=p("[data-kol-status]");v(t,e)}function Ib(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=M("[data-kol-delay]","[data-kol-delay-custom]","5"),s=M("[data-kol-tp]","[data-kol-tp-custom]","25"),c=M("[data-kol-sl]","[data-kol-sl-custom]","8"),i=M("[data-kol-loop]","[data-kol-loop-custom]","1"),u=M("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=M("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return a.tradeToken=e,a.volumeToken=e,a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ca("kol")}}function Ob(e){const t=_e("kol"),n=p("[data-kol-group]")?.value?.trim()||"",r=p("[data-kol-amount]")?.value||"",o=M("[data-kol-delay]","[data-kol-delay-custom]","5"),s=M("[data-kol-tp]","[data-kol-tp-custom]","25"),c=M("[data-kol-sl]","[data-kol-sl-custom]","8"),i=M("[data-kol-loop]","[data-kol-loop-custom]","1"),u=M("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),d=M("[data-kol-slippage]","[data-kol-slippage-custom]","400"),m=String(e||a.kolWallet||p("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");if(!m)throw new Error("Paste or choose a KOL wallet first.");if(!Rt(m))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:m,walletIndexes:t,walletGroup:n,amountSol:r,sellDelay:o,takeProfitPct:s,stopLossPct:c,loopCount:i,loopDelay:u,sellPercent:"100",slippageBps:d,...ca("kol")}}async function Eb(e){try{const t=Ib(e);Et("Buying and arming KOL copy plan...");const n=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,H(Pe(n.plan),"kol-copy-plan"),a.activeTab="kol",h()}catch(t){Et(t.message)}}async function Fb(e){try{const t=Ob(e);Et("Arming Copy Wallet watch...");const n=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});a.kolResult=n.plan,a.kolWallet=t.copyWallet,a.activeTab="kol",h()}catch(t){Et(t.message)}}function _e(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function ro(e){const t=p("[data-bundle-status]");v(t,e)}function Nu(){const e=p("[data-bundle-token]")?.value?.trim()||"",t=_e("bundle"),n=p("[data-bundle-group]")?.value?.trim()||"",r=p("[data-bundle-amount]")?.value||"",o=M("[data-bundle-percent]","[data-bundle-percent-custom]","100"),s=M("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return a.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:n,amountSol:r,percent:o,slippageBps:s}}function Wb(){const e=Nu();let t=M("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),n=M("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:n}=ja(t,n),{...e,sellDelay:t,takeProfitPct:M("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:M("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:M("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:M("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:n,...ca("bundle-plan")}}async function Du(e){const t=C();let n=null,r="";const o=e==="buy"?"bundle-buy":"bundle-sell";try{n=Nu();const s=Qe(o,n.tokenMint,"bundle");if(s){ee("buttonDoubleClickPrevented"),E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-t,cacheHit:!0,requestId:s.tradeAttemptId||"",details:`${o}:${w(n.tokenMint)}`});return}r=ct(o),q(o,n.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),E({component:"post-trade",action:"trade-click-to-ui",durationMs:C()-t,requestId:r,details:`${o}:${w(n.tokenMint)}`}),h(),ro(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await Ee(20);const c=C();q(o,n.tokenMint,"bundle",{state:"submitting"});const i=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...n,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});E({component:"post-trade",action:"trade-backend-ack",durationMs:C()-c,requestId:r,resultCount:i.bundle?.successCount||0,details:o}),a.bundleResult=i.bundle,q(o,n.tokenMint,"bundle",{state:"submitted",signature:Pe(i.bundle)}),H(Pe(i.bundle),`bundle-${e}`,{tradeAttemptId:r}),a.activeTab="bundle",h(),$e(o,n.tokenMint,"bundle",3e3)}catch(s){n?.tokenMint&&(q(o,n.tokenMint,"bundle",{state:"error",error:W(s.message||"Bundle trade failed")}),$e(o,n.tokenMint,"bundle",4e3)),E({component:"post-trade",action:"trade-action-error",durationMs:C()-t,requestId:r,errorCode:s?.code||s?.name||"BUNDLE_TRADE_FAILED",details:W(s.message||"Bundle trade failed")}),ro(s.message)}}async function _b(){try{const e=Wb();ro("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});a.bundleResult=t.plan,H(Pe(t.plan),"bundle-plan"),a.activeTab="bundle",h()}catch(e){ro(e.message)}}function ae(e,t){return(a.presets?.[e]||[]).find(n=>n.id===t)||null}function Uu(){(a.selectedTradePresetId==="custom"||a.selectedTradePresetId&&!ae("trade",a.selectedTradePresetId))&&(a.selectedTradePresetId=""),(a.selectedBundlePresetId==="custom"||a.selectedBundlePresetId&&!ae("bundle",a.selectedBundlePresetId))&&(a.selectedBundlePresetId=""),a.editingTradePresetId&&!ae("trade",a.editingTradePresetId)&&(a.editingTradePresetId=""),a.editingBundlePresetId&&!ae("bundle",a.editingBundlePresetId)&&(a.editingBundlePresetId="")}function qu(e,t="trade",n=""){t==="bundle"?a.bundleToken=e:a.tradeToken=e,a.activeTab=t,n&&$(n),window.history.pushState({},"","/terminal"),h({force:!0})}async function Hu(e=""){const t=String(e||"").trim();if(!t)return;const n=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(n),o=(s,c={})=>ft(fe(s,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){o(n);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}o(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(s){$(s.message||"Token search failed.")}}function fe(e="",t={}){const n=String(e||"").trim(),r=n?Vn().find(o=>String(o?.tokenMint||"")===n):null;return{chain:"solana",tokenMint:n,tokenAddress:n,mint:n,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(n),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||n.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function fS(e={},t={}){return fe(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function oo(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(a.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},go(a.smartChartTokenRef),a.terminalToken=t,a.terminalAutoToken=t,a.tradeToken=t,a.bundleToken=t,a.volumeToken=t,a.smartChartToken=t,t):""}function Nb(e,t={}){const n=new URLSearchParams;n.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return n.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&n.set("view",t.view),t.focusAmountInput&&n.set("focusAmount","1"),t.source&&n.set("source",String(t.source).slice(0,40)),t.returnTo&&n.set("returnTo",t.returnTo),`/terminal/chart?${n.toString()}`}function bl(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),n=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||n.includes("pump")),o=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!o)}function Db(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const so=new Map;function yl(e){const t=String(e||"").trim();if(!t)return;const n=so.get(t)||0;Date.now()-n<3e4||(so.set(t,Date.now()),so.size>200&&so.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function ft(e={},t={}){ta("chartRouteStart");const n=C(),r=oo(e);if(!r){$("Select a token before opening the chart.");return}Pl(e,{source:t.source||"token-entry"}),yl(r),a.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),a.smartChartView=Db(a.smartChartTokenRef||e,t),a.chartFocusAmountInput=!!t.focusAmountInput,a.chartScrollIntoView=!0,a.activeTab="smartChart",a.route="terminal",a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.chartTradeStatus="",a.chartBuyWalletIndex="";const o=Nb(r,{defaultTab:t.defaultTab||"buy",view:a.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Ea()});window.history.pushState({},"",o),h({force:!0}),U("chart-route-open",n,{component:"smartChart",cacheHit:!!(je(r)?.cacheHit||Gn(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function vl(){if(!window.location.pathname.includes("/terminal/chart"))return;ta("chartRouteStart");const e=C(),t=new URLSearchParams(window.location.search||""),n=String(t.get("token")||t.get("mint")||"").trim(),r=String(a.smartChartToken||"").trim();if(n){const o=fe(n,{source:t.get("source")||"route"});oo(o),Pl(o,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{Ga(o,{forceModal:!0,source:"deep-link"})}catch{}},900),n!==r&&(a.chartTradeStatus="",a.chartBuyWalletIndex="")}a.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",a.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",a.chartFocusAmountInput=t.get("focusAmount")==="1",a.chartScrollIntoView=!0,a.route="terminal",a.activeTab="smartChart",U("chart-route-apply",e,{component:"smartChart",cacheHit:!!(je(n)?.cacheHit||Gn(n)?.pairAddress),details:n})}function Ga(e={},t={}){const n=oo(e);if(!n){$("Select a token before quick buying.");return}const r=Xa(n);if(r&&fo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const o=t.preset||Ft(),s=o&&!t.forceModal?Ne(o):"",c=o?.walletIndex||(o?.walletIndexes||[])[0];if(o&&s&&c&&!t.forceModal){co(n,t.preset||null);return}const i=se();a.quickBuyModal={open:!0,tokenMint:n,amountSol:s||a.quickBuyAmountOverride||"",walletIndex:i?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):"",slippageBps:"400",status:s?`Preset ${s} SOL loaded. Confirm when ready.`:"Enter a SOL amount to quick buy.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},yl(n),h({force:!0}),requestAnimationFrame(()=>p("[data-quick-buy-modal-amount]")?.focus())}function wl(){a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function Ub(e={},t={}){if(!_("protectedBuyEnabled",!0))return;const n=oo(e);if(!n){$("Select a token before opening Protected Buy.");return}const r=Xa(n);if(r&&fo(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const o=ga(n)||{tokenMint:n},s=Ge(o),c=t.presetId||s.protectedBuyPreset||Ml(s.verdict),i=Number(j(t.amountSol||a.quickBuyAmountOverride||Ne()||"0.1")),u=c==="conservative"&&Number.isFinite(i)&&i>.25?"0.25":Yn(i||.1),d=se();yl(n),a.quickBuyModal={...a.quickBuyModal,open:!1,status:"",error:""},a.protectedBuyModal={open:!0,tokenMint:n,presetId:c,amountSol:u,walletIndex:t.walletIndex||(d?.publicKey?"connected":a.wallets[0]?.index?String(a.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:s.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>p("[data-protected-buy-amount]")?.focus())}function lo(){a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function qb(){const e=a.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),n=String(p("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(p("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),o=j(p("[data-protected-buy-amount]")?.value||e.amountSol||""),s=String(p("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(p("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!o)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:n,walletIndex:r,amountSol:o,slippageBps:s,riskAccepted:c}}function Hb(){const e=a.protectedBuyModal||{};if(!e.open)return"";const t=ga(e.tokenMint)||{tokenMint:e.tokenMint},n=Ge(t),r=wo(e.presetId),o=le(e.walletIndex),s=n.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${l(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${l(Ja(n.verdict))}">${l(n.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${Ka(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${Ll.map(i=>`<option value="${i.id}" ${i.id===r.id?"selected":""}>${l(i.label)}</option>`).join("")}
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
        <small>${l(qy(r))}</small>
        <small>Wallet: ${l(Ky(e.walletIndex))}</small>
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
  `}function Sl(){let e=p("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!a.protectedBuyModal?.open||!_("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=Hb(),document.body.classList.add("protected-buy-modal-open")}async function Kb(){try{const e=qb(),t=ga(e.tokenMint)||{tokenMint:e.tokenMint};if(Ge(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=wo(e.presetId);if(a.protectedBuyModal={...a.protectedBuyModal,...e,status:le(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},Sl(),le(e.walletIndex)){const o=await io({...e,source:`protected-buy:${r.id}`});a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),$(o?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await Ee(20),a.protectedBuyModal={...a.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await co(e.tokenMint,Hy(e,r))}catch(e){a.protectedBuyModal={...a.protectedBuyModal||{},open:!0,status:"",error:W(e.message||"Protected Buy failed.")},h({force:!0})}}function Vb(){const e=String(a.quickBuyModal?.tokenMint||"").trim(),t=String(p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"").trim(),n=j(p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||""),r=String(p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!n)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r}}async function io({tokenMint:e,walletIndex:t,amountSol:n,slippageBps:r="400",source:o="quick-buy",takeProfitPct:s="",stopLossPct:c="",sellDelay:i="off",sellPercent:u="100"}){const d=Number(n);if(!Number.isFinite(d)||d<=0)throw new Error("Enter a SOL amount greater than zero.");const m=ct("quick-buy"),f=ja(i,u),b=mt(s)||mt(c)||mt(f.sellDelay);let y={tokenMint:e,walletIndex:t,slippageBps:r};const S=a.quickBuyModal?.open?A=>hl(A,""):me;if(y=to(y,{side:"buy",statusWriter:S}).form,t=y.walletIndex,a.quickBuyLast={source:o,tokenMint:e,walletConnected:le(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:m,status:"submitting",error:""},q("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:m,clickedAt:new Date().toISOString()}),a.quickBuyModal={...a.quickBuyModal,status:le(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:m},le(t)){hl("Opening wallet approval...",""),oe();const A=await Hn({side:"buy",form:y,actionDetail:String(n),amountSol:String(d),amountMode:"fixed",attemptId:m,statusWriter:S});if(a.quickBuyLast={...a.quickBuyLast,status:"submitted"},b){const L="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";a.quickBuyModal?.open?hl(L,""):me(L)}return A}h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),await Ee(20);const T={tokenMint:e,walletIndex:t,amountSol:String(d),slippageBps:r,tradeAttemptId:m};b&&Object.assign(T,{autoExit:!0,takeProfitPct:s,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(T),dedupe:!1,timeoutMs:Q});return a.tradeResult=g.trade,g.trade?.autoExitPlan&&(a.tradePlanResult=g.trade.autoExitPlan,Qr()),H(g.trade?.signature,"quick-buy-custom",{tradeAttemptId:m}),q("trade-buy",e,String(n),{state:"submitted",signature:g.trade?.signature||""}),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},g.trade}async function zb(e=""){const t=C(),n=j(p("[data-chart-buy-amount]")?.value||""),r=Number(n);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let o=p("[data-chart-buy-wallet]")?.value||"";if(!o)throw new Error("Choose a wallet before buying.");const s=ct("chart-buy");let c={tokenMint:e,walletIndex:o,slippageBps:p("[data-chart-buy-slippage]")?.value||"400"};if(c=to(c,{side:"chart buy",statusWriter:Ie}).form,o=c.walletIndex,Qe("trade-buy",e,String(n)))return a.tradeResult;if(a.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:le(o),customAmountValid:!0,presetAmount:"",tradeAttemptId:s,status:"submitting",error:""},q("trade-buy",e,String(n),{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),Ie(le(o)?"Opening wallet approval...":"Submitting Session Wallet buy..."),E({component:"post-trade",action:le(o)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:C()-t,requestId:s,details:`${le(o)?"browser":"session"}-buy:${w(e)}:${n}`}),oe(),le(o)){const b=await Hn({side:"buy",form:c,actionDetail:String(n),amountSol:String(r),amountMode:"fixed",attemptId:s,statusWriter:Ie});return a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",Ie(b?.message||"Buy submitted from connected wallet."),$e("trade-buy",e,String(n),3e3),b}const d=Fu(),m={tokenMint:e,walletIndex:o,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:s};d.enabled&&Object.assign(m,{autoExit:!0,takeProfitPct:d.takeProfitPct,stopLossPct:d.stopLossPct,sellDelay:d.sellDelay,sellPercent:d.sellPercent}),Ie(d.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(m),dedupe:!1,timeoutMs:Q});return a.tradeResult=f.trade,f.trade?.autoExitPlan&&(a.tradePlanResult=f.trade.autoExitPlan,Qr()),a.quickBuyLast={...a.quickBuyLast,status:"submitted"},a.chartTradeTab="buy",q("trade-buy",e,String(n),{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"chart-session-buy",{tradeAttemptId:s}),Ie(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),$e("trade-buy",e,String(n),3e3),f.trade}async function jb(){try{const e=Vb(),t=Js(a.quickBuyModal?.error||a.quickBuyModal?.status||"");if(t)throw new Error(t);a.quickBuyModal={...a.quickBuyModal,...e,status:"Validating quick buy...",error:""};const n=await io({...e,source:a.quickBuyModal?.source||"quick-buy-modal"});a.quickBuyModal={...a.quickBuyModal,open:!1,status:n?.message||"Quick buy submitted.",error:""},a.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),$e("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=W(e.message||"Quick buy failed."),n=Js(t);a.quickBuyLast={...a.quickBuyLast||{},status:"failed",error:n||t},a.quickBuyModal={...a.quickBuyModal,status:n?"Token safety blocked fast buy.":"",error:n||t},h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"})}}async function co(e,t=null){const n=C(),r=t||ae("trade",a.selectedTradePresetId);let o="quick";if(!r){Ga(fe(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const s=t?j(r.amountSol):Ne(r);if(!s)throw new Error("Set a quick buy amount first.");o=String(s);const c=Qe("trade-buy",e,o);if(c){E({component:"post-trade",action:"trade-action-dedupe",durationMs:C()-n,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${s}`});return}const i=ct("quick-trade");q("trade-buy",e,o,{state:"clicked",tradeAttemptId:i,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),a.tradeToken=e,h({preserveSmartChartFrame:a.activeTab==="smartChart"}),await Ee(0),await G(null,"Opening secure web profile...");const u=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!a.wallets.some(b=>String(b.index)===String(u)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const d={tokenMint:e,walletIndex:u,amountSol:s,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),a.tradeToken=e,await Ee(20);const m=C();q("trade-buy",e,o,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...d,tradeAttemptId:i,clientClickToUiMs:Math.round(m-n)}),dedupe:!1,timeoutMs:Q});a.tradeResult=f.trade,f.trade?.autoExitPlan?(a.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),Qr()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),a.tradeToken=e,q("trade-buy",e,o,{state:"submitted",signature:f.trade?.signature||""}),H(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:i}),a.activeTab="trade",h(),$e("trade-buy",e,o,3e3)}catch(s){e&&(q("trade-buy",e,o,{state:"error",error:W(s.message||"Quick buy failed")}),$e("trade-buy",e,o,4e3)),$(s.message)}}async function Ku(e,t=null){const n=t||ae("bundle",a.selectedBundlePresetId);if(!n){qu(e,"bundle","No fast bundle preset selected. Review the Bundle form, then submit.");return}if(!t){const r=(n.walletIndexes||[]).length||(n.walletGroup?"group":"saved");if(!await Te({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${n.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){qu(e,"bundle","Review the Bundle setup, then submit.");return}}try{a.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await Ee(0),await G(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(n.walletIndexes||[]).filter(s=>a.wallets.some(c=>String(c.index)===String(s))),walletGroup:n.walletGroup||"",amountSol:t?j(n.amountSol)||"0.1":Uy(n),percent:"100",slippageBps:n.slippageBps,sellDelay:n.sellDelay||"off",takeProfitPct:n.takeProfitPct,stopLossPct:n.stopLossPct,sellPercent:n.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const o=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});a.bundleResult=o.plan,a.bundleToken=e,H(Pe(o.plan),"quick-preset-bundle"),a.activeTab="bundle",h()}catch(r){$(r.message)}}async function uo(e,t="100",n={}){const r=C();let o=Number.parseInt(t,10),s="";try{if(await G(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=Ps(e,String(o));if(c){E({component:"manual-sell",action:"manual-sell-dedupe",durationMs:C()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${o}`});return}const i=et().find(S=>String(S.tokenMint)===String(e)),u=i?.symbol||i?.name||w(e),d=!!(i?.source==="connected-wallet"||i?.viewOnly||String(i?.walletIndex||"").toLowerCase()==="connected"),m=String(se()?.publicKey||"").trim();if(d&&m){s=ct("manual-sell"),aa(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`browser:${w(e)}:${o}`}),$(""),a.activeTab!=="smartChart"&&(a.activeTab="positions");const S=a.activeTab==="smartChart"?Ie:T=>$(T);S("Building wallet-approved sell..."),oe(),aa(e,String(o),{state:"submitting"});const P=await Hn({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:n.slippageBps||"400"},actionDetail:`${o}%`,percent:String(o),attemptId:s,statusWriter:S});a.tradeResult=P,aa(e,String(o),{state:"submitted",signature:P?.signature||""}),H(P?.signature,"browser-manual-sell",{tradeAttemptId:s}),a.activeTab==="smartChart"?(Ie(P?.message||"Sell submitted from connected wallet."),oe()):h({preserveSmartChartFrame:!1}),As(e,String(o),3e3);return}if(!(!!n.skipConfirm||await Te({title:"Confirm Exit",lines:[`Exit ${o}% of ${u}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${o}%`,danger:!0})))return;s=ct("manual-sell"),aa(e,String(o),{state:"clicked",manualSellAttemptId:s,clickedAt:new Date().toISOString()}),E({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:C()-r,requestId:s,details:`${w(e)}:${o}`}),a.activeTab="positions",$(""),h(),await Ee(20);const b=C();aa(e,String(o),{state:"submitting"});const y=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:o,slippageBps:"400",manualSellAttemptId:s,clientClickToUiMs:Math.round(b-r)}),timeoutMs:Q,dedupe:!1});E({component:"manual-sell",action:"manual-sell-request",durationMs:C()-b,requestId:s,resultCount:y.bundle?.successCount||0,details:y.bundle?.duplicate?"duplicate":"submitted"}),a.bundleResult=y.bundle,a.bundleToken=e,a.tradeToken=e,aa(e,String(o),{state:(y.bundle?.duplicate,"submitted"),signature:Pe(y.bundle),backendMs:y.bundle?.manualSellTiming?.backendMs||null}),H(Pe(y.bundle),"manual-sell-position"),a.activeTab="positions",h(),As(e,String(o),3e3)}catch(c){e&&Number.isInteger(o)&&(aa(e,String(o),{state:"error",error:W(c.message||"Sell failed")}),As(e,String(o),4e3)),E({component:"manual-sell",action:"manual-sell-error",durationMs:C()-r,requestId:s,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:W(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:a.activeTab==="smartChart"})}}function Pe(e){return e?.signature?e.signature:(e?.results||[]).find(n=>n.signature)?.signature||""}async function Gb(){const e=p("[data-tx-audit-signature]")?.value?.trim()||a.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}a.terminalTxSignature=e,a.terminalTxLoading=!0,a.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);a.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){a.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{a.terminalTxLoading=!1,h()}}function Xb(e,t="manager"){const n=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Trade Preset",walletIndex:p(`[data-${n}-preset-wallet]`)?.value||"1",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"25",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"8",sellDelay:M(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}:{id:p(`[data-${n}-preset-id]`)?.value||"",name:p(`[data-${n}-preset-name]`)?.value||"Bundle Preset",walletIndexes:_e(`${n}-preset`),walletGroup:p(`[data-${n}-preset-group]`)?.value?.trim()||"",amountSol:p(`[data-${n}-preset-amount]`)?.value||"0.1",takeProfitPct:p(`[data-${n}-preset-tp]`)?.value||"60",stopLossPct:p(`[data-${n}-preset-sl]`)?.value||"10",sellDelay:M(`[data-${n}-preset-delay]`,`[data-${n}-preset-delay-custom]`,"off"),sellPercent:p(`[data-${n}-preset-sell-percent]`)?.value||"100",slippageBps:p(`[data-${n}-preset-slippage]`)?.value||"400"}}function Jb(e,t){const n=(t||[]).find(r=>!r.readonly);n?.id&&(e==="trade"&&(a.selectedTradePresetId=n.id),e==="bundle"&&(a.selectedBundlePresetId=n.id))}function po(e,t){const n=!!(t&&ae(e,t));e==="trade"&&(a.selectedTradePresetId=n?t:""),e==="bundle"&&(a.selectedBundlePresetId=n?t:"")}function kl(e,t){e==="trade"&&(a.fastTradePresetStatus=t),e==="bundle"&&(a.fastBundlePresetStatus=t)}function Yb(e,t){po(e,t),kl(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Vu(e,t="manager"){const n=p(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await G(n,"Creating secure web profile for presets..."),v(n,"Saving preset...");const r=Xb(e,t),o=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});a.presets=o.presets||a.presets,r.id&&ae(e,r.id)?po(e,r.id):Jb(e,a.presets?.[e]),t==="manager"&&Nr(e,""),t==="fast"&&kl(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),v(n,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&kl(e,r.message),v(n,r.message),$(r.message)}}async function Qb(e,t){try{const n=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});a.presets=n.presets||a.presets,e==="trade"&&a.selectedTradePresetId===t&&po("trade",""),e==="bundle"&&a.selectedBundlePresetId===t&&po("bundle",""),(e==="trade"&&a.editingTradePresetId===t||e==="bundle"&&a.editingBundlePresetId===t)&&Nr(e,""),h()}catch(n){$(n.message)}}function zu(e,t){Nr(e,t),a.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const n=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);n?.scrollIntoView({behavior:"smooth",block:"start"}),n?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function ju(e={}){const t=p("[data-referral-status]");try{await G(t,"Opening secure web profile..."),v(t,e.generate?"Generating referral code...":"Saving referral settings...");const n=String(p("[data-referral-code]")?.value||"").trim(),r=bh(p("[data-referral-link]")?.value||""),o=String(a.user?.referralCode||"").trim(),s=e.generate?n:r&&r!==o&&(!n||n===o)?r:n||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:s,generateReferralCode:!!e.generate,referralPayoutWallet:p("[data-referral-wallet]")?.value||""})});ue(c.user);const i=c.user?.referralCode||a.user?.referralCode||"";v(t,e.generate?`Generated ${i}. Link is ready.`:`Referral settings saved. Code: ${i}`),h()}catch(n){v(t,n.message),$(n.message)}}async function Zb(){const e=p("[data-trader-board-status]");try{await G(e,"Opening secure web profile..."),v(e,"Saving trader board settings...");const t=p("[data-trader-board-wallet-mode]")?.value||"all",n=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!p("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:_e("trader-board")})});ue(n.user),v(e,n.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){v(e,t.message),$(t.message)}}async function Gu(e,t){const n=t.dataset.watchToken||t.dataset.unwatchToken||"";if(n)try{await G(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:n,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});a.watchlist=r.watchlist||a.watchlist,h()}catch(r){$(r.message)}}function $l(e){const t=p("[data-launch-status]");v(t,e)}function ey(){const e=p("[data-launch-ticker]")?.value?.trim()||gt(Ae().keywords)[0]||"",t=_e("launch"),n=p("[data-launch-group]")?.value?.trim()||"",r=p("[data-launch-amount]")?.value||"",o=M("[data-launch-tp]","[data-launch-tp-custom]","40"),s=M("[data-launch-sl]","[data-launch-sl-custom]","8"),c=M("[data-launch-delay]","[data-launch-delay-custom]","3"),i=M("[data-launch-loop]","[data-launch-loop-custom]","1"),u=M("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),d=M("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!n)throw new Error("Choose at least one wallet or enter a group label.");return Ae().keywords=e,Ae().open=!0,{ticker:e,walletIndexes:t,walletGroup:n,amountSol:r,takeProfitPct:o,stopLossPct:s,sellDelay:c,loopCount:i,loopDelay:u,slippageBps:d,...ca("launch")}}async function ty(){try{const e=ey();$l("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});a.launchResult=t.watch,await ra(),a.activeTab="launch",h()}catch(e){$l(e.message)}}async function ay(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});a.launchResult=t.watch,await ra(),a.activeTab="launch",h()}catch(t){$l(t.message)}}function ny(){return`
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
  `}function ry(){const e=nu();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${a.sweepBackgroundPending?"disabled":""}>${a.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${l(a.sweepBackgroundStatus||"")}</small>
    </section>`}async function oy(){if(!a.sweepBackgroundPending){a.sweepBackgroundPending=!0,a.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:Q});a.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await ut({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){a.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{a.sweepBackgroundPending=!1,h({force:!0})}}}function sy(){const e=cy(),n=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Xu()}
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
      ${nl().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${Ha(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${l(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${l(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${uy(r)}
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
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${eg()}${ry()}${Zh()}${ny()}`},{key:"create",label:"Create",hint:"New wallets",html:qa()},{key:"import",label:"Import",hint:"Add keys",html:jc()},{key:"backup",label:"Backup",hint:"Save / restore",html:zc()},{key:"downloads",label:"Downloads",hint:"Exports",html:Gc()}];if(!a.wallets.length){const r=n.filter(o=>o.key!=="balances"&&o.key!=="fund");return`
      ${e}
      ${R("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${Va({toolKey:"wallets",activeKey:za("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${Va({toolKey:"wallets",activeKey:za("wallets","balances"),sections:n})}
  `}function ly(){return(Array.isArray(a.wallets)?a.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function iy(){if(!(a.connectedWalletBalance||a.user?.connectedWallet||null)?.publicKey)return"";const t=ly();return t?`
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
    </div>`}function cy(){const e=a.connectedWalletBalance||a.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=a.connectedWalletBalance||{},n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",s=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${l(c.dexUrl||X(c.mint))}" target="_blank" rel="noreferrer">
      ${st({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
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
        ${iy()}
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
  `}function Xu(){const e=a.balances.reduce((n,r)=>n+Number(r.tokens?.length||0),0)+bc().length,t=a.balances.filter(n=>n.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${_s()}</strong></div>
      <div><span>Total SOL</span><strong>${xt().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function uy(e){const t=a.balances.find(s=>Number(s.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${l(t.error)}</span>`;const n=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,o=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${l(n)} | ${l(r)}${l(o)}</span>`}function dy(){const e=et(),t=`
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
    ${py()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(_d).join("")}
    </div>
  `:`${t}${R("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function py(){const e=a.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${l(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const n=t.filter(o=>!o.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
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
              <small>${o.flags.length?l(o.flags.join(" | ")):"no red flags"}${o.liquidityUsd!=null?` | liq ${x(o.liquidityUsd)}`:""}${o.marketCapUsd?` | MC ${x(o.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${l(o.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${l(o.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function my(e){const t=String(e||"").trim();if(!t)return;a.devWatch||(a.devWatch={});const n=!a.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:n}),timeoutMs:15e3});a.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}ba()}async function fy(){a.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});a.bagScan={status:"done",bags:e.bags||[]}}catch(e){a.bagScan={status:"error",message:e?.message||""}}h()}function hy(){const e=`
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
              <button type="button" class="ca-copy" data-copy="${l(t.tokenMint)}">${l(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${l(t.spentSol||"0")} SOL</span>
          <span>${l(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${l(t.realizedSol||"0")}</span>
          <span>${l(t.holdTime||"n/a")}<small>Latest ${l(ye(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ke(Jc(t),"Share")}
            <button data-pnl-card="${l(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${l(t.tokenMint)}" data-share-text="${l(Jc(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${R("No PnL yet","Trades made through the bot will show here.")}`}function Vn(){return gy(zn())}function zn(){const e=Object.values(a.livePairsByBucket||{}).flatMap(o=>o?.rows||[]),t=a.scan?.rows||[],n=a.kolScan?.rows||[],r=a.watchlist?.rows||[];return[...e,...t,...n,...r]}function Xa(e=""){const t=String(e||"");return t&&zn().find(n=>String(n?.tokenMint||"")===t)||null}function hS(e=""){const t=Xa(e);return!t||!fo(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function gy(e=[]){const t=new Map;for(const n of e||[]){if(jn(n))continue;const r=String(n?.tokenMint||"");r&&!t.has(r)&&t.set(r,n)}return[...t.values()]}function he(e=[]){const t=new Map;for(const n of e||[]){if(jn(n))continue;const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||mo(n)>mo(o))&&t.set(r,n)}return[...t.values()]}function mo(e={}){return Ay(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(I(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function by(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function fo(e={}){if(by(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function jn(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const n=I(e.marketCap,e.fdv),r=I(e.liquidityUsd);return n>=1e8&&(!r||r/n<.01)}function Ju(){const e=Vn(),t=s=>e.find(c=>String(c.tokenMint)===s)||{tokenMint:s,shortMint:w(s),symbol:w(s),dexUrl:X(s)},n=String(a.terminalToken||a.tradeToken||"").trim();if(n)return t(n);const r=String(a.terminalAutoToken||"").trim();if(r)return t(r);const o=(Fe()?.rows||[])[0]||e[0]||null;return o?.tokenMint&&(a.terminalAutoToken=String(o.tokenMint)),o}function ho(){const e=Vn(),t=a.smartChartTokenRef||null,n=o=>e.find(s=>String(s.tokenMint||"")===o)||{...String(t?.tokenMint||"")===o?t:{},tokenMint:o,shortMint:w(o),symbol:t?.symbol||w(o),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||X(t?.pairAddress||o),pumpUrl:o.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(o)}`:""},r=String(a.smartChartToken||a.terminalToken||a.tradeToken||"").trim();return ed(r?n(r):Ju())}function Yu(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const yy=300*1e3,Qu=45*1e3,Zu=600*1e3,vy=700,wy=6e3,Sy=4,ky=3e4;function je(e=""){const t=String(e||"").trim();if(!t)return null;const n=a.smartChartBootstrap?.[t]||null;if(!n)return null;const r=Date.now()-Number(n.loadedAt||n.resolvedAt||0);return n.status==="failed"?r<Qu?n:null:r<Zu?n:null}function Gn(e=""){const t=String(e||"").trim(),n=t?a.smartChartDexResolution?.[t]||je(t):null;if(!n)return null;const r=Date.now()-Number(n.resolvedAt||0);return n.status==="failed"?r<Qu?n:null:r<yy?n:null}function ed(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=Gn(t);return!n||n.status==="failed"?e:{...e,pairAddress:e.pairAddress||n.pairAddress||"",pairId:e.pairId||n.pairAddress||"",dexUrl:e.dexUrl||n.dexUrl||n.pairUrl||"",dexId:e.dexId||n.dexId||"",dexName:e.dexName||n.dexName||n.dexId||"",symbol:e.symbol||n.symbol||w(t),name:e.name||n.name||"Token",imageUrl:e.imageUrl||n.imageUrl||"",marketCap:e.marketCap||n.marketCap||0,marketCapUsd:e.marketCapUsd||n.marketCap||0,fdv:e.fdv||n.fdv||0,liquidityUsd:e.liquidityUsd||n.liquidityUsd||0,volumeH24:e.volumeH24||n.volumeH24||0,volumeH1:e.volumeH1||n.volumeH1||0,priceUsd:e.priceUsd||n.priceUsd||0,h1:e.h1||n.h1||0,volume:e.volume||n.volume||null,txns:e.txns||n.txns||null}}function td(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const n=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:n,resolvedAt:n};a.smartChartBootstrap={...a.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&go({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function go(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.pairAddress||e.pairId||"").trim();!t||!n&&!e.dexUrl&&!e.symbol&&!e.name||(a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{...a.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:n,dexUrl:e.dexUrl||X(n||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||a.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||a.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||a.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||a.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||a.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||a.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||a.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function $y(e={}){const t=String(e?.tokenMint||a.smartChartToken||"").trim();if(!t)return!1;const n=String(e?.pairAddress||e?.pairId||"").trim();if(n)return go({...e,tokenMint:t,pairAddress:n}),!1;if(je(t)?.pairAddress)return!1;const r=Gn(t);return r?.pairAddress||r?.status==="failed"?!1:(a.smartChartDexResolving?.[t]||(a.smartChartDexResolving={...a.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{nd(t).catch(()=>{})},0)),!0)}function ad(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||a.smartChartToken||"").trim();return!n||!t.force&&je(n)?.status==="resolved"?!1:(a.smartChartBootstrapLoading?.[n]||(a.smartChartBootstrapLoading={...a.smartChartBootstrapLoading||{},[n]:!0},window.setTimeout(()=>{nd(n,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const Tl=new Map;async function Ty(e){const t=String(e||"").trim();if(!t)return;const n=Tl.get(t)||0;if(Date.now()-n<3e4)return;Tl.set(t,Date.now());const r=async()=>{const u=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(d=>d?.chainId==="solana").sort((d,m)=>(Number(m?.liquidity?.usd)||0)-(Number(d?.liquidity?.usd)||0))[0];if(!u)throw new Error("no pair");return u},o=async()=>{const s=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!s?.pair)throw new Error("no pair");return s.pair};try{const s=await Promise.any([r(),o()]);td({tokenMint:t,symbol:s.baseToken?.symbol||"",name:s.baseToken?.name||"",priceUsd:s.priceUsd,marketCap:s.marketCap||s.fdv||null,marketCapUsd:s.marketCap||s.fdv||null,fdv:s.fdv||null,liquidityUsd:Number(s.liquidity?.usd)||null,liquidity:{usd:Number(s.liquidity?.usd)||null},volumeH24:Number(s.volume?.h24)||null,volumeH1:Number(s.volume?.h1)||null,h1:Number(s.priceChange?.h1)||null,imageUrl:s.info?.imageUrl||"",dexUrl:s.url||"",pairAddress:s.pairAddress||"",dexId:s.dexId||"",pumpCurve:!!s.pumpCurve,bondingProgressPct:s.bondingProgressPct??null,source:s.pumpCurve?"pump-curve":"direct-dexscreener"}),a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{Tl.delete(t)}}function Pl(e={},t={}){const n=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return n?(go(e),Kf(n,e.symbol||e.name||""),Ty(n),ad(e,{source:t.source||"prefetch"}),a.smartChartPrefetchLog=[...a.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:n,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(a.smartChartBootstrapLoading?.[n]||je(n)),cacheTtlMs:Zu}].slice(-20),!0):!1}async function nd(e=""){const t=String(e||"").trim();if(!t)return null;try{const n=C(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),o=r.chart||r.dexToken||{};return td(o),U("chart-bootstrap",n,{component:"smartChart",cacheHit:!!o.cacheHit,stale:!!o.stale,details:`${t}:${o.chartProvider||"dexscreener-embed"}`}),a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),o}catch(n){return a.smartChartDexResolution={...a.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:W(n?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},a.route==="terminal"&&a.activeTab==="smartChart"&&String(a.smartChartToken||"")===t&&h({force:!0}),null}finally{const n={...a.smartChartDexResolving||{}};delete n[t],a.smartChartDexResolving=n;const r={...a.smartChartBootstrapLoading||{}};delete r[t],a.smartChartBootstrapLoading=r}}function Py(e,t={}){const n=Yu(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(n)}?${r.toString()}`}function rd(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=je(n);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Py(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function gS(e={}){const t=String(e?.tokenMint||e?.mint||a.smartChartToken||""),n=dd(t||e?.symbol||"pump"),r=Math.max(1,I(e.marketCap,e.fdv,e.liquidityUsd,1e4)),o=I(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),s=Math.max(4,Math.min(96,Wt(e)||I(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(o)||I(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(i,u)=>{const d=Math.sin((u+n%11)/2.2)*c,m=(u/21-.5)*(o||s/3),f=((n>>u%8&7)-3)*.7;return Math.max(1,r*(1+(d+m+f)/100))})}function bS(e={},...t){for(const n of t){const r=Number(e?.[n]);if(Number.isFinite(r)&&r>0)return r;const o=n.split(".").reduce((c,i)=>c?.[i],e),s=Number(o);if(Number.isFinite(s)&&s>0)return s}return 0}function yS(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="txns",o=Math.max(0,Math.min(100,Wt(e)||I(e.bondingProgressPct,e.pumpProgress,0))),s=F(e.marketCapLabel,e.fdvLabel,x(e.marketCap),x(e.fdv)),c=F(e.liquidityLabel,x(e.liquidityUsd)),i=F(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,x(e.volumeM15),x(e.volume5m),x(e.volumeH1));return`
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
          ${aS(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${l(s)}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(c)}</dd></div>
          <div><dt>Volume</dt><dd>${l(i)}</dd></div>
          <div><dt>Status</dt><dd>${bl(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":nS(e)}
      <small>${l(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function Al(e={},t="chart"){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",o=t==="info",s=ad(e)||$y(e),c=o?`DexScreener info for ${e.symbol||w(n)}`:r?`DexScreener chart and transactions for ${e.symbol||w(n)}`:`DexScreener chart for ${e.symbol||w(n)}`,i=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",o?"smart-chart-info-frame":""].filter(Boolean).join(" "),d=s?"Loading DEX chart while resolving fastest pair...":o?"Loading token info...":r?"Loading DEX transactions...":"Loading DEX chart...",m=rd(e,t);return`
    <div class="${l(i)}" data-chart-frame-loading="${l(d)}" data-chart-resolving="${s?"true":"false"}" data-chart-mint="${l(n)}" data-chart-mode="${l(t)}" data-chart-src="${l(m)}">
      <iframe title="${l(c)}" src="${l(m)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${l(t)}','${l(n)}')" allowfullscreen></iframe>
    </div>
  `}function od(){const e=[...Object.values(a.livePairsByBucket||{}).flatMap(n=>n?.rows||[]),...a.livePairs?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[],...a.watchlist?.rows||[]],t=new Map;for(const n of e){const r=String(n?.tokenMint||"");if(!r)continue;const o=t.get(r);(!o||mo(n)>mo(o))&&t.set(r,n)}return t}function Ay(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,n)=>t+(n&&String(n).toLowerCase()!=="n/a"?1:0),0)}function sd(e=[]){const t=od();return(e||[]).map(n=>ld(n,t.get(String(n?.tokenMint||""))))}function at(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const o=Number(r[1]);if(!Number.isFinite(o))return null;const s=String(r[2]||"").toLowerCase();return s==="k"?o*1e3:s==="m"?o*1e6:s==="b"?o*1e9:o}function I(...e){for(const t of e){const n=at(t);if(Number.isFinite(n)&&n>0)return n}for(const t of e){const n=at(t);if(Number.isFinite(n))return n}return 0}function ld(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:I(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:I(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:F(e.marketCapLabel,t.marketCapLabel,x(e.marketCap),x(t.marketCap)),fdvLabel:F(e.fdvLabel,t.fdvLabel,x(e.fdv),x(t.fdv)),liquidityUsd:I(e.liquidityUsd,t.liquidityUsd),liquidityLabel:F(e.liquidityLabel,t.liquidityLabel,x(e.liquidityUsd),x(t.liquidityUsd)),volume5m:I(e.volume5m,t.volume5m),volume5mLabel:F(e.volume5mLabel,t.volume5mLabel,x(e.volume5m),x(t.volume5m)),volumeM15:I(e.volumeM15,t.volumeM15),volumeM15Label:F(e.volumeM15Label,t.volumeM15Label,x(e.volumeM15),x(t.volumeM15)),volumeM30:I(e.volumeM30,t.volumeM30),volumeM30Label:F(e.volumeM30Label,t.volumeM30Label,x(e.volumeM30),x(t.volumeM30)),volumeH1:I(e.volumeH1,t.volumeH1),volumeH1Label:F(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,x(e.volumeH1),x(t.volumeH1)),volumeH24:I(e.volumeH24,t.volumeH24),volumeH24Label:F(e.volumeH24Label,t.volumeH24Label,x(e.volumeH24),x(t.volumeH24)),volumeLabel:F(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,x(e.volumeH1),x(t.volumeH1)),sniperCount:I(e.sniperCount,t.sniperCount)}:e}function Xn(e=[],t=[]){return he([...a.livePairsByBucket.under1d?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.scan?.rows||[],...e,...t]).sort((r,o)=>Number(o.bestPickScore||o.score||0)-Number(r.bestPickScore||r.score||0)||I(o.volumeM15,o.volumeM30,o.volumeH1,o.volume5m,o.volumeH24)-I(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||I(o.marketCap,o.fdv)-I(r.marketCap,r.fdv)||Xe(r,o))}function V(e,t,n,r,o){return{key:e,label:t,severity:n,message:r,weight:o}}function Cy(e={}){const t=at(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const n=at(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(n)?n/60:null}function Ly(e,t=[]){const n=(t||[]).some(o=>o.key==="hard_flag"),r=(t||[]).filter(o=>o.severity==="risk"&&o.key!=="liquidity_extreme").length;return n||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function My(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const n=(t||[]).find(r=>r.severity==="risk");return n?.message?`Avoid recommended. ${n.message}`:"Avoid recommended. Multiple danger signals."}const bo=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function da(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(bo,t)?t:"unknown"}function yo(e="",t="Unknown"){const n=da(e);return bo[n]||t}function id(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),n=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=n?"new":"unknown";return{mint:t,status:r,label:bo[r],confidence:n?"low":"unknown",summary:n?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:n||null,updatedAt:""}}function Jn(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(a.devInfoSummaries?.[t]||e.devInfoSummary)||id(e)}function xy(e={}){const t=da(e.status);return t==="hold"?V("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?V("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?V("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?V("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?V("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):V("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function cd(e={},t={}){if(!_("devInfoEnabled",!0))return"";const n=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!n)return"";const r=Jn(e),o=da(r.status),c=!!a.devInfoLoading?.[`summary:${n}`]?"...":o==="unknown"?"":r.label||bo[o]||"",i=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${l(o)} ${i?"is-compact":""}" data-dev-info="${l(n)}" title="${l(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${l(c)}</strong>`:""}
    </button>
  `}function By(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let n=70;const r=[],o=[],s=[],c=at(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(n-=36,o.push("liquidity"),r.push(V("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(n-=20,o.push("liquidity"),r.push(V("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(n+=8,o.push("liquidity"),r.push(V("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(o.push("liquidity"),r.push(V("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(n-=6,s.push("liquidity"),r.push(V("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const i=Cy(e);Number.isFinite(i)?i<3?(n-=10,o.push("age"),r.push(V("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):i>60?(n+=4,o.push("age"),r.push(V("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):o.push("age"):(n-=4,s.push("age"),r.push(V("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const u=at(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(u)?u<=0?(n-=5,o.push("volume"),r.push(V("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):u>=1e4?(n+=6,o.push("volume"),r.push(V("volume_active","Volume","positive","Volume is active enough to review flow.",6))):o.push("volume"):s.push("volume");const d=at(e.buys5m??e.buysH1??e.buys),m=at(e.sells5m??e.sellsH1??e.sells);Number.isFinite(d)&&Number.isFinite(m)?(o.push("flow"),m>=d*1.8&&m>=5?(n-=18,r.push(V("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):d>=m*1.4&&d>=8&&(n+=5,r.push(V("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):s.push("flow");const f=at(e.bestPickScore??e.score);Number.isFinite(f)&&(o.push("score"),f>=78?(n+=7,r.push(V("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(n-=10,r.push(V("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const b=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(T=>String(T||"").toLowerCase());b.some(T=>/mayhem|fake|scam|honeypot|blacklist/.test(T))&&(n-=40,r.push(V("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),b.some(T=>/bundle|bundled|cluster|concentr/.test(T))&&(n-=18,r.push(V("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),b.some(T=>/dev|fresh wallet|fresh-wallet|insider/.test(T))&&(n-=14,r.push(V("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),b.some(T=>/mint|freeze|token-2022/.test(T))&&(n-=24,r.push(V("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const y=Jn(e);if(y){const T=xy(y);n+=Number(T.weight||0),r.push(T),["hold","mixed","risk","dump"].includes(da(y.status))?o.push("devInfo"):s.push("devInfo")}const S=Math.max(0,Math.min(100,Math.round(n))),P=Ly(S,r);return{mint:t,verdict:P,score:S,confidence:o.length>=5&&s.length<=1?"high":o.length>=3?"medium":"low",summary:My(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function Ge(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&a.slimeShieldResults?.[t]||By(e)}function Ja(e=""){return String(e||"CAUTION").toLowerCase()}function Ry(e={},t={}){if(!_("slimeShieldEnabled",!0))return Ey(e);const n=Ge(e),r=String(e.tokenMint||n.mint||"").trim(),o=n.verdict||"CAUTION",s=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${l(Ja(o))}" data-slimeshield-details="${l(r)}" title="${l(n.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${s?"Shield":"SlimeShield"}</small>
    </button>
  `}function Iy(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${l(Cl(e))}">${l(o?`${o}`:"n/a")} score</em>`}const t=Ge(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${l(Ja(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">Details</button>`}function vS(e={}){if(!_("slimeShieldEnabled",!0)){const o=Number(e.bestPickScore||e.score||0),s=o?`${o}`:"n/a";return`
      <span class="terminal-score-chip" title="${l(Cl(e))}">
        <strong>${l(s)}</strong>
        <small>score</small>
      </span>
    `}const t=Ge(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${l(Ja(r))}" data-slimeshield-details="${l(n)}" title="${l(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function Oy(e={}){return _("slimeShieldEnabled",!0)?`SlimeShield ${Ge(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function Ey(e={}){const t=Number(e.bestPickScore||e.score||0),n=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${l(Cl(e))}">
      <strong>${l(r)}</strong>
      <small>${n.length?"warnings":"best pick"}</small>
    </span>
  `}function Fy(e={}){return Ry(e,{compact:!0})}function Cl(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},n=Object.entries(t).map(([o,s])=>`${o}: ${s}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...n,...r.map(o=>`warning: ${o}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function Wy(e={}){return""}function x(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function F(...e){for(const t of e){const n=String(t??"").trim();if(n&&n!=="$0"&&n.toLowerCase()!=="n/a")return n}return"n/a"}function ud(e={}){return[["15m",F(e.volumeM15Label,x(e.volumeM15))],["30m",F(e.volumeM30Label,x(e.volumeM30))],["1h",F(e.volumeH1Label,e.volumeLabel,x(e.volumeH1))],["24h",F(e.volumeH24Label,x(e.volumeH24))]]}function wS(e={}){const t=rt(e),n=ot(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),o=F(e.liquidityLabel,n>0?x(n):"","checking"),s=ud(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      ${s.map(([c,i])=>`<span>${l(c)} <b>${l(i)}</b></span>`).join("")}
    </div>
  `}function _y(e={}){const t=rt(e),n=ot(e),r=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),o=F(e.liquidityLabel,n>0?x(n):"","checking"),s=F(e.volumeM15Label,x(e.volumeM15)),c=F(e.volumeH1Label,e.volumeLabel,x(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(o)}</b></span>
      <span>15m <b>${l(s)}</b></span>
      <span>1h <b>${l(c)}</b></span>
    </div>
  `}function Ya(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const n=String(e.tokenMint||e.mint||"").trim();return n&&(e.isPump||n.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(n)}`:""}function vo(e={},t=""){const n=t||wa(e),r=Number(e.sniperCount||e.snipers||0),o=Ya(e);return`
    <div class="compact-link-row">
      <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${o?`<a href="${l(o)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${l(n)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(r)}</span>`:""}
    </div>
  `}function Xe(e={},t={}){const n=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(n)&&Number.isFinite(r)&&n!==r)return n-r;const o=Number(e.pairCreatedAt||0),s=Number(t.pairCreatedAt||0);return o||s?s-o:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function dd(e=""){let t=0;for(let n=0;n<String(e).length;n+=1)t=(t<<5)-t+String(e).charCodeAt(n),t|=0;return Math.abs(t)}function pa(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function ma(e=""){const t=Fe();return[e,a.livePairBucket,a.terminalSort,hd(),t?.refreshCount||"",a.livePairsLastUpdatedByBucket[a.livePairBucket]||a.livePairsLastUpdatedAt||"",a.kolScan?.refreshCount||"",a.kolScan?.refreshedAt||a.kolLastUpdatedAt||""].join(":")}function fa(e=[],t=12,n="",r=0){const o=he(e||[]),s=Math.max(0,Number(t)||o.length);if(!s)return[];if(!n||o.length<=s)return o.slice(0,s);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,s-1),o.length),i=o.slice(0,c),u=o.slice(c);if(!u.length)return i.slice(0,s);const d=dd(n)%u.length,m=[...u.slice(d),...u.slice(0,d)];return[...i,...m].slice(0,s)}function pd(e=[],t=new Set){return(e||[]).filter(n=>{const r=pa(n);return!r||!t.has(r)})}function md(e={}){const t=rt(e),n=ot(e),r=Kl(e),o=Oo(e),s=Xd(e),c=F(e.marketCapLabel,e.fdvLabel,t>0?x(t):"","checking"),i=F(e.liquidityLabel,n>0?x(n):"","checking"),u=F(e.volumeM15Label,r>0?x(r):"","checking"),d=F(e.volumeH1Label,e.volumeLabel,o>0?x(o):"","checking"),m=F(e.volumeH24Label,s>0?x(s):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${l(c)}</strong></span>
      <span><small>Liq</small><strong>${l(i)}</strong></span>
      <span><small>15m</small><strong>${l(u)}</strong></span>
      <span><small>1h</small><strong>${l(d)}</strong></span>
      <span><small>24h</small><strong>${l(m)}</strong></span>
    </div>
  `}function fd(e,{source:t,actionLabel:n="Trade",isKolContext:r=!1}={}){const o=Ro(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(t)}" title="Open chart and buy/sell panel">${l(n)}</button>
    <button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(t)}" title="Quick buy with preset or custom SOL amount">${l(ha())}</button>
    <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${l(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?Su(e):""}
    <button type="button" class="watch-action" data-watched="${o}" title="${o?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Io(e)||"")}">${o?"Saved":"Watch"}</button>
    ${cd(e,{compact:!0})}
  `}function Ny(e,t={}){const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=fa(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol",u=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((d,m)=>{const f=d.scalpSetup||d.momentum||d.category||"live";return`
          <article class="terminal-token-row${u} ${i?"is-kol-signal":""}" data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-row">
            ${st(d,{priority:m<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${l(d.tokenMint)}" data-token-chart-source="terminal-title">${l(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
                <small>${l(d.name||d.category||"Token")}</small>
                ${i?"":ql(d)}
                ${Iy(d)}
              </div>
              <button type="button" class="ca-copy" data-copy="${l(d.tokenMint)}">${l(w(d.tokenMint))}</button>
              <span class="terminal-token-age">${l(d.pairAgeLabel||Nt(d)||"age unknown")} | ${l(f)}</span>
              ${vo(d)}
            </div>
            ${md(d)}
            <div class="terminal-token-actions has-dev-info">
              ${fd(d,{source:"terminal-row",actionLabel:r,isKolContext:i})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:R(o,s)}function ht(e,t={}){if(t.layout==="terminal")return Ny(e,t);const n=t.limit||6,r=t.actionLabel||"Trade",o=t.emptyTitle||"No signals loaded",s=t.emptyMessage||"Refresh the feed to load current signals.",c=fa(e||[],n,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((u,d)=>`
        <article class="compact-signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-row">
          ${st(u,{priority:d<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${l(u.tokenMint)}" data-token-chart-source="compact-title">${l(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
              <small>${l(u.name||u.category||"Token")}</small>
              ${i?"":ql(u)}
            </div>
            <button type="button" class="ca-copy" data-copy="${l(u.tokenMint)}">${l(w(u.tokenMint))}</button>
            <span>${l(u.pairAgeLabel||Nt(u)||"age unknown")} | ${l(u.scalpSetup||u.momentum||u.category||"live")}</span>
            ${_y(u)}
            ${vo(u)}
          </div>
          ${Fy(u)}
          <div class="compact-row-actions has-dev-info">
            ${fd(u,{source:"compact-row",actionLabel:r,isKolContext:i})}
          </div>
        </article>
      `).join("")}
    </div>
  `:R(o,s)}function Qa(e){const t=ae(e,e==="trade"?a.selectedTradePresetId:a.selectedBundlePresetId);if(!t)return"Custom / manual";const n=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&n.push(`Timer ${t.sellDelay}`),n.join(" | ")}function SS(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${l(Qa("trade"))}</strong>
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
  `}function Yn(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function j(e=a.quickBuyAmountOverride){const t=String(e||"").replace(/[^0-9.]/g,"");if(!t)return"";const n=Number(t);return!Number.isFinite(n)||n<=0?"":Yn(n)}function Ft(){return ae("trade",a.selectedTradePresetId)}function Dy(){return ae("bundle",a.selectedBundlePresetId)}function Ne(e=Ft()){return j()||Yn(e?.amountSol)}function Uy(e=Dy()){return j()||Yn(e?.amountSol)||"0.1"}const Ll=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function wo(e=""){return Ll.find(t=>t.id===e)||Ll[0]}function Ml(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function qy(e=wo()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,n=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${n} | ${r}`}function Hy(e={},t=wo()){const n=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:n?.percentGain?String(n.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:n?.sellPercent?String(n.sellPercent):t.sellPercent||"100"}}function Ky(e=""){if(le(e)){const n=se();return`${n?.provider||"Browser wallet"} ${n?.publicKey?w(n.publicKey):""}`.trim()}const t=a.wallets.find(n=>String(n.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Ae(){return(!a.terminalLaunchFilters||typeof a.terminalLaunchFilters!="object")&&(a.terminalLaunchFilters={}),a.terminalLaunchFilters.socials=a.terminalLaunchFilters.socials||{},a.terminalLaunchFilters.quotes=a.terminalLaunchFilters.quotes||{},a.terminalLaunchFilters.audits=a.terminalLaunchFilters.audits||{},a.terminalLaunchFilters}function gt(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(n=>String(n||"").trim().split(/\s+/)).map(n=>n.trim().toLowerCase()).filter(n=>!n||t.has(n)?!1:(t.add(n),!0)).slice(0,3)}function hd(e=Ae()){const t=Object.keys(e.socials||{}).filter(o=>e.socials[o]).sort().join(","),n=Object.keys(e.quotes||{}).filter(o=>e.quotes[o]).sort().join(","),r=Object.keys(e.audits||{}).filter(o=>e.audits[o]).sort().join(",");return[gt(e.keywords).join(","),gt(e.excludeKeywords).join(","),t,n,r].join("|")}function Za(e=Ae()){return!!hd(e).replace(/\|/g,"")}function So(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function Vy(e={},t=""){const n=So(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(n));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(n)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(n)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(n)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(n)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(n)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(n)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(n)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(n)):t==="minSocial"?r:!0}function zy(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const n=So(e).toUpperCase();return n.includes("USDC")?"USDC":n.includes("USD1")?"USD1":n.includes("WSOL")||n.includes("SOL")?"WSOL":""}function ko(e={},t=[]){const n=So(e);return t.some(r=>r.test(n))}function jy(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!ko(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!ko(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:ko(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const n=I(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return n>0?n<=30:!ko(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function en(e=[],t=Ae()){const n=he(e||[]);if(!Za(t))return n;const r=gt(t.keywords),o=gt(t.excludeKeywords),s=Object.keys(t.socials||{}).filter(u=>t.socials[u]),c=Object.keys(t.quotes||{}).filter(u=>t.quotes[u]).map(u=>u.toUpperCase()),i=Object.keys(t.audits||{}).filter(u=>t.audits[u]);return n.filter(u=>{const d=So(u);return!(r.length&&!r.some(m=>d.includes(m))||o.length&&o.some(m=>d.includes(m))||s.some(m=>!Vy(u,m))||c.length&&!c.includes(zy(u))||i.some(m=>!jy(u,m)))})}function xl(e=[],t=[]){const n=Ae();if(!Za(n))return"";const r=gt(n.keywords),o=gt(n.excludeKeywords),s=[];r.length&&s.push(`watching ${r.map(i=>`"${i}"`).join(", ")}`),o.length&&s.push(`excluding ${o.map(i=>`"${i}"`).join(", ")}`);const c=Math.max(0,he(e).length-he(t).length);return`<div class="terminal-launch-filter-summary">${l(s.join(" | ")||"filters active")} - ${l(t.length)}/${l(he(e).length)} visible${c?`, ${l(c)} hidden`:""}</div>`}function Qn(e=[],t="pairs"){const n=Ae(),r=gt(n.keywords),o=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",s=he(e).length;return R("Watching fresh launches",s?`No ${t} match ${o} yet. ${s} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${o}.`)}function Bl(e="terminal",t={}){const n=Ae(),r=Za(n),o=!!(n.open||r),s=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):s;return`
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
            ${fm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-social="${l(i)}" ${n.socials?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${hm.map(([i,u])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${l(i)}" ${n.quotes?.[i]?"checked":""}> ${l(u)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${gm.map(([i,u])=>`
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
  `}function gd(){vr&&window.clearTimeout(vr),vr=window.setTimeout(()=>{vr=null,J("live"),J("launch"),J("sniper"),h()},180)}function $o(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const o=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-o)/1e3))}const n=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return n&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const Gy=100,Xy=7200,Jy=75e4,Yy=86400,Qy=2e6,Zy=28e3,bd=18e4,ev=16e4;function yd(){const e=od();return he([...a.livePairs?.rows||[],...a.livePairsByBucket.live?.rows||[],...a.livePairsByBucket.under1h?.rows||[],...a.livePairsByBucket.under3h?.rows||[],...a.livePairsByBucket.under1d?.rows||[],...a.scan?.rows||[],...a.kolScan?.rows||[]]).map(t=>ld(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!jn(t))}function tn(e={}){return I(e.marketCap,e.fdv)}function vd(e={}){return I(e.liquidityUsd)}function wd(e={}){return I(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function Rl(e={}){if(an(e))return!1;const t=$o(e);return!Number.isFinite(t)||t<0||t>Xy||tn(e)>Jy?!1:Wt(e)<70}function To(e={}){if(an(e))return!1;const t=Wt(e),n=tn(e),r=n>=Zy&&n<=bd;return t>=55&&(!n||n<=bd)||r}function Sd(e={}){if(Rl(e)||To(e)||an(e))return!1;const t=$o(e);return Number.isFinite(t)&&(t<0||t>Yy)||tn(e)>Qy?!1:vd(e)>0||wd(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function kd(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Wt(e={}){const t=I(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const n=tn(e),r=kd(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&n>0?Math.max(1,Math.min(99,n/69e3*100)):0}function an(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=kd(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const n=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=tn(e);return n&&r>=ev?!0:!!(n&&/\b(raydium|meteora|orca)\b/.test(t))}function Po(e={}){if(an(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":To(e)||t==="graduating"?"graduating":Rl(e)?"new":(t==="steady"||t==="unknown"||Sd(e),"steady")}function $d(e={}){const t=Number(e.bestPickScore||e.score||0),n=wd(e),r=vd(e),o=tn(e),s=$o(e),c=Number.isFinite(s)?Math.max(0,86400-s)/86400:0;return t*1e3+Math.log10(n+1)*160+Math.log10(r+1)*120+Math.log10(o+1)*80+c*100}function Td(e=[]){return[...e].sort((t,n)=>$d(n)-$d(t)||Xe(t,n))}function tv(e=[],t=[],n=Gy){const r=new Set,o=[];for(const s of[...e,...t]){const c=String(s?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),o.push(s),o.length>=n))break}return o}function Pd(e=a.slimeScopeMode){const t=yd(),n=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(i=>Po(i)===n),o=t.filter(i=>{const u=Po(i);return n==="graduated"?u==="graduated"||an(i):n==="graduating"?u==="graduating"||To(i):n==="steady"?u==="steady"||Sd(i):u==="new"||Rl(i)}),s=n==="new"?[...r].sort(Xe):Td(r),c=n==="new"?he(o).sort(Xe):Td(o);return tv(s,c)}function av(e=[],t="new"){const n=Ze(`slimeScope:${t}`,e).slice(0,12);return n.length?n.map((r,o)=>{const s=r.pairAgeLabel||Nt(r)||"age ?",c=F(r.marketCapLabel,r.fdvLabel,x(rt(r)),"checking"),i=F(r.liquidityLabel,x(ot(r)),"checking"),u=F(r.volumeM15Label,x(Kl(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${l(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${st(r,{priority:o<4})}
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
        <button type="button" data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${l(Ne()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${l(t)} pairs.</div>`}function nv(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,n,r])=>{const o=Pd(t);return`
          <section class="slime-scope-column" data-scope-column="${l(t)}">
            <header>
              <div>
                <h4>${l(n)}</h4>
                <small>${l(r)}</small>
              </div>
              <span>${l(o.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${av(o,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function rv(){const e=Vd(),[,,t]=e,n=dc(a.slimeScopeMode),o=!!(K("slimeScope").inFlight||a.livePairsLoadingByBucket?.[n]),s=a.livePairsRefreshErrorByBucket?.[n],c=he(zd(yd(),e[0])),i=Ze("slimeScope",c),u=i.length?Fn()?nt(i,{context:"live",shareBuilder:wa,hideToolbar:!0}):ht(i,{layout:"terminal",limit:Math.max(1,i.length),actionLabel:"Trade"}):s?R("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):o?R("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):R("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${_v(e)}<span>${l(t)}</span></div>
        ${jd(c.length,sa())}
        ${iu("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${o?"disabled":""}>${o?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${u}
        ${oa("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${nv()}
    </section>
  `}function kS(){const e=Fe(),t=he(e?.rows||[]),n=en(t),r=[...n].sort(Xe),o=sd(a.kolScan?.rows||[]).filter(L=>!jn(L)),s=en(o),c=Xn(t,o),i=en(c),u=Za(),d=fa(i,8,ma("best-picks"),2),m=new Set(d.map(pa).filter(Boolean)),f=pd(r,m),b=fa(f.length?f:r,12,ma("live-pairs"),0),y=new Set([...m,...b.map(pa).filter(Boolean)]),S=pd(s,y),P=fa(S.length?S:s,12,ma("kol-signals"),1),T=!!a.livePairsLoadingByBucket[a.livePairBucket],g=sa(),A="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${T?"Refreshing":"Live"}${g?` | ${l(xn(Da(g)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Tt.map(([L,B])=>{const D=a.livePairsByBucket[L]?.rows?.length,ne=Number.isFinite(Number(D))?` (${D})`:"";return`<button data-live-pair-bucket="${L}" data-active="${a.livePairBucket===L}">${B}${ne}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${mm.map(([L,B])=>`<option value="${L}" ${a.terminalSort===L?"selected":""}>${B}</option>`).join("")}
            </select>
          </label>
          ${iu("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${T?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${Bl("terminal",{rawCount:t.length,visibleCount:n.length})}
        ${xl(t,n)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${d.length?ht(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):u?Qn(c,"best picks"):ht(d,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:A,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${b.length?ht(b,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A}):u?Qn(t,"live pairs"):ht(b,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${a.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?ht(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):u?Qn(o,"KOL signals"):ht(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:A,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${Tv()}
      </main>
    </section>
  `}function $S(){const e=Ft();if(!e)return"Trade";const t=Ne(e);return t?`Buy ${t} SOL`:Rp(e,"Trade")}function ha(){const e=Ft(),t=Ne(e);return t?`Buy ${t} SOL`:"Quick Buy"}function Ao(){const e=ha();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{v(t,e)})}function ga(e=""){const t=String(e||"").trim();if(!t)return null;const n=zn().find(o=>String(o?.tokenMint||o?.mint||o?.tokenAddress||"").trim()===t);if(n)return n;const r=a.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:X(t)}}function ov(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function sv(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function Ad(e={}){if(!_("slimeShieldEnabled",!0))return"";const t=Ge(e),n=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${l(Ja(r))}">
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
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(n)}" data-protected-buy-preset="${l(t.protectedBuyPreset||Ml(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function Cd(e=[],t="risk",n="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(o=>t==="positive"?o.severity==="positive":o.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(o=>`
        <li>
          <strong>${l(o.label||o.key||"Signal")}</strong>
          <span>${l(o.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(n)}</p>`}function lv(e=""){const t=String(e||a.smartChartToken||a.tradeToken||"").trim();!t||!_("slimeShieldEnabled",!0)||(a.slimeShieldDetails={open:!0,tokenMint:t},a.slimeShieldStatus="",xa(),ya(),Md(t,{force:!0}),_("replayBeforeBuyEnabled",!0)&&El(t,{force:!0}))}function Ld(){a.slimeShieldDetails={open:!1,tokenMint:""},a.slimeShieldStatus="",ya(),wr()}async function Md(e="",t={}){const n=String(e||"").trim();if(!n||!_("slimeShieldEnabled",!0))return null;if(!t.force&&a.slimeShieldResults?.[n])return a.slimeShieldResults[n];if(a.slimeShieldLoading?.[n])return null;a.slimeShieldLoading={...a.slimeShieldLoading||{},[n]:!0},ya();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return s&&(a.slimeShieldResults={...a.slimeShieldResults||{},[n]:s},ee(s.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),a.slimeShieldStatus=s.cacheHit?"Loaded from cache.":"Updated from local data."),s}catch(r){return a.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...a.slimeShieldLoading||{}};delete r[n],a.slimeShieldLoading=r,ya()}}function iv(e=""){const t=ga(e)||Xa(e)||{tokenMint:e},n=Jn(t),r=n.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",o=[...Array.isArray(n.externalLinks)?n.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||X(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((s,c,i)=>/^https?:\/\//i.test(String(s.url||""))&&i.findIndex(u=>String(u.url||"")===String(s.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:n.likelyDevWallet||null,confidence:n.confidence||"unknown",status:da(n.status),label:n.label||yo(n.status),score:50,summary:n.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:n.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:n.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:n.updatedAt||new Date().toISOString(),externalLinks:o,dataSource:"ui-fallback"}}function xd(e=""){const t=String(e||"").trim();return a.devInfoResults?.[t]||iv(t)}function Zn(e,t=""){const n=Number(e);return Number.isFinite(n)?`${Math.round(n*10)/10}${t}`:"n/a"}function Bd(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function Co(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function cv(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function Rd(e="",t={}){const n=String(e||"").trim();if(!n||!_("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoSummaries?.[n])return a.devInfoSummaries[n];const r=`summary:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0};try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(a.devInfoSummaries={...a.devInfoSummaries||{},[n]:c},ee(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,t.silent||ba()}}async function Id(e="",t={}){const n=String(e||"").trim();if(!n||!_("devInfoEnabled",!0))return null;if(!t.force&&a.devInfoResults?.[n])return a.devInfoResults[n];const r=`details:${n}`;if(a.devInfoLoading?.[r])return null;a.devInfoLoading={...a.devInfoLoading||{},[r]:!0},ba();try{const o=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(n)}${o}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(a.devInfoResults={...a.devInfoResults||{},[n]:c},a.devInfoSummaries={...a.devInfoSummaries||{},[n]:{mint:n,status:c.status||"unknown",label:c.label||yo(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},a.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",ee(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(o){return a.devInfoStatus=o?.message||"Dev Info is temporarily unavailable.",null}finally{const o={...a.devInfoLoading||{}};delete o[r],a.devInfoLoading=o,ba()}}function uv(e=""){const t=String(e||"").trim();!t||!_("devInfoEnabled",!0)||(a.devInfoDetails={open:!0,tokenMint:t},a.devInfoStatus="",xa(),ba(),Rd(t,{force:!0,silent:!0}),Id(t,{force:!0}))}function Il(){a.devInfoDetails={open:!1,tokenMint:""},a.devInfoStatus="",ba(),wr()}function dv(e="render"){!_("devInfoEnabled",!0)||fs||a.route==="terminal"&&(fs=window.setTimeout(()=>{fs=null,pv(e)},300))}async function pv(e="render"){if(!_("devInfoEnabled",!0)||Ma())return;const t=Vn().slice(0,16),n=[],r=new Set;for(const o of t){const s=String(o.tokenMint||o.mint||o.tokenAddress||"").trim();if(!(!s||r.has(s)||a.devInfoSummaries?.[s]||a.devInfoLoading?.[`summary:${s}`])&&(r.add(s),n.push(s),n.length>=8))break}n.length&&(await Promise.allSettled(n.map(o=>Rd(o,{silent:!0}))),E({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:n.length,details:e}),Ma()||Ba("dev-info-prefetch"))}function Lo(e=[],t="No strong cached signal yet."){const n=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return n.length?`
    <ul class="slimeshield-factor-list">
      ${n.map(r=>`<li><span>${l(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(t)}</p>`}function Mo(e,t="Not cached yet"){const n=String(e||"").trim();return!n||n.toLowerCase()==="warming"||n.toLowerCase()==="checking"?t:n}function xo(e,t=r=>String(r),n="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):n}function er(e,t,n=""){if(e.__lastDrawerHtml===t)return!1;const r=n?e.querySelector(n):null,o=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,n&&o){const s=e.querySelector(n);s&&(s.scrollTop=o)}return!0}function ba(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=a.devInfoDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",n),!n||!_("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ga(r)||Xa(r)||{tokenMint:r},s=xd(r),c=a.devInfoSummaries?.[r]||Jn(o),i=da(s.status||c.status),u=s.confidence||c.confidence||"unknown",d=!!a.devInfoLoading?.[`details:${r}`],m=s.likelyDevWallet||c.likelyDevWallet||"",f=s.currentPosition||null,b=s.historicalStats||{},y=s.linkedWalletSignals||{},S=s.marketContext||{},P=s.sourceHydration||{},T=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,8):[],g=I(S.marketCap,o.marketCap,o.fdv),A=I(S.liquidityUsd,o.liquidityUsd),L=I(S.volume5m,o.volume5m,o.volumeM5),B=I(S.volumeH1,o.volumeH1,o.volume1h),D=I(S.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),ne=S.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",ve=S.mintAuthority||o.mintAuthority||"",Je=S.freezeAuthority||o.freezeAuthority||"",N=!!(S.heliusDasIndexedAt||S.heliusDasSource||o.heliusDasSource||ne||ve||Je),Oe=[...Array.isArray(s.externalLinks)?s.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:o.dexUrl||X(r)},{label:"Solscan Wallet",url:m?`https://solscan.io/account/${encodeURIComponent(m)}`:""},{label:"KOLscan Wallet",url:m?`https://kolscan.io/account/${encodeURIComponent(m)}`:""},{label:"X",url:o.twitterUrl||o.xUrl},{label:"TG",url:o.telegramUrl},{label:"Website",url:o.websiteUrl}].filter((ce,jo,Go)=>/^https?:\/\//i.test(String(ce.url||""))&&Go.findIndex(sn=>String(sn.url||"")===String(ce.url||""))===jo).slice(0,8),Vt=Array.isArray(b.recentLaunches)?b.recentLaunches.slice(0,5):[],wt=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${l(yo(i))} · ${l(Bd(u))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      <section class="dev-info-summary dev-info-${l(i)}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${d?"Updating...":`Last updated ${l(ye(s.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section>
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${l(cv(m))}</dd></div>
          <div><dt>Confidence</dt><dd>${l(Bd(u))}</dd></div>
          <div><dt>Source</dt><dd>${l(s.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${l(w(s.pairAddress||o.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${m?`<button type="button" data-copy="${l(m)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${l(r)}">Copy CA</button>
          ${m&&a.user?`<button type="button" data-dev-watch="${l(m)}">${a.devWatch?.[m]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${Oe.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${Oe.map(ce=>`<a href="${l(ce.url)}" target="_blank" rel="noreferrer">${l(ce.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section>
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${l(xo(g,x))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(xo(A,x))}</dd></div>
          <div><dt>5m volume</dt><dd>${l(xo(L,x))}</dd></div>
          <div><dt>1h volume</dt><dd>${l(xo(B,x))}</dd></div>
          <div><dt>Pair age</dt><dd>${l(Number.isFinite(D)?Co(D):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(ne?w(ne):N?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${ve?w(ve):N?"none":"not indexed"} / ${Je?w(Je):N?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(S.source||s.cacheSource||s.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${l(P.message)}${P.eventsStored?` · ${l(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      <section>
        <h4>Source Evidence</h4>
        ${Lo(T,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section>
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${l(Zn(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${l(Zn(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${l(Zn(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${l(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${l(Co(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${l(f.lastSellAt?ye(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(b.launchesTracked)>0||Vt.length?`
      <section>
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${l(b.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${l(Co(b.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${l(Zn(b.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${l(Zn(b.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${Vt.length?`
          <ul class="dev-info-launches">
            ${Vt.map(ce=>`<li><span>${l(ce.symbol||w(ce.mint||""))}</span><small>${l(ce.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(s.riskReasons)&&s.riskReasons.length?`
      <section>
        <h4>Risk Signals</h4>
        ${Lo(s.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(s.positiveReasons)&&s.positiveReasons.length?`
      <section>
        <h4>Positive Signals</h4>
        ${Lo(s.positiveReasons,"")}
      </section>`:""}
      ${y.linkedWalletCount||Array.isArray(y.notes)&&y.notes.length?`
      <section>
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${l(y.linkedWalletCount?`${y.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${Lo(y.notes,"")}
      </section>`:""}
      ${(()=>{const ce=[f?"":"dev position",Number(b.launchesTracked)>0||Vt.length?"":"launch history",!(s.riskReasons||[]).length&&!(s.positiveReasons||[]).length?"behavior signals":"",!y.linkedWalletCount&&!(y.notes||[]).length?"linked wallets":""].filter(Boolean);return ce.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${l(ce.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(s.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${l(r)}" data-watch-symbol="${l(o.symbol||"")}" data-watch-name="${l(o.name||"")}" data-watch-image="${l(Io(o)||"")}">${Ro(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${l(r)}">Open SlimeShield</button>
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${l(r)}" ${d?"disabled":""}>${d?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${a.devInfoStatus?`<small class="slimeshield-status">${l(a.devInfoStatus)}</small>`:""}
    </aside>
  `;er(e,wt,".dev-info-drawer")}function Od(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function Ol(e=""){const t=String(e||"").trim();return a.replayResults?.[t]||Od(t)}function nn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function mv(e=""){if(!_("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const n=Ol(t);return`
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
  `}async function El(e="",t={}){const n=String(e||"").trim();if(!n||!_("replayBeforeBuyEnabled",!0))return null;if(!t.force&&a.replayResults?.[n])return a.replayResults[n];if(a.replayLoading?.[n])return null;a.replayLoading={...a.replayLoading||{},[n]:!0},tr(),ya();try{const r=new URLSearchParams({mint:n});t.force&&r.set("force","true");const s=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return s&&(a.replayResults={...a.replayResults||{},[n]:s},ee(s.cacheHit?"replayCacheHit":"replayCacheMiss")),s}catch{return a.replayResults={...a.replayResults||{},[n]:Od(n)},null}finally{const r={...a.replayLoading||{}};delete r[n],a.replayLoading=r,tr(),ya()}}function fv(e=""){const t=String(e||"").trim();!t||!_("replayBeforeBuyEnabled",!0)||(a.replayDetails={open:!0,tokenMint:t},xa(),tr(),El(t))}function Fl(){a.replayDetails={open:!1,tokenMint:""},tr(),wr()}function tr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=a.replayDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",n),!n||!_("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=Ol(r),s=!!a.replayLoading?.[r],c=`
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
        <small>${s?"Updating...":`Confidence: ${l(o.confidence||"low")} · Updated ${l(ye(o.updatedAt))}`}</small>
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
            ${o.matchedTraits.map(i=>`<li><span>${l(i)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${l(r)}" ${s?"disabled":""}>${s?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `;er(e,c,".replay-drawer")}function ya(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=a.slimeShieldDetails||{},n=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",n),!n||!_("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),o=ga(r)||{tokenMint:r},s=a.slimeShieldResults?.[r]||Ge(o),c=s.verdict||"CAUTION",i=s.sourceHydration||{},u=s.marketContext||{},d=Array.isArray(s.sourceEvidence)?s.sourceEvidence.slice(0,6):[],m=!!a.slimeShieldLoading?.[r],f=Array.isArray(s.factors)?s.factors:[],b=I(u.marketCap,o.marketCap,o.fdv),y=I(u.liquidityUsd,o.liquidityUsd),S=I(u.volumeH1,o.volumeH1,o.volume1h),P=I(u.pairAgeMinutes,o.pairAgeMinutes,Number(o.pairAgeSeconds)/60),T=u.metadataAuthority||o.metadataAuthority||o.updateAuthority||"",g=u.mintAuthority||o.mintAuthority||"",A=u.freezeAuthority||o.freezeAuthority||"",L=!!(u.heliusDasIndexedAt||u.heliusDasSource||o.heliusDasSource||T||g||A),B=s.devInfoSummary||Jn(o),D=da(B.status),ne=[...Array.isArray(s.externalLinks)?s.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:u.dexUrl||o.dexUrl||X(r)},{label:"Pump",url:u.pumpUrl||Ya(o)},{label:"X",url:u.twitterUrl||o.twitterUrl||o.xUrl},{label:"TG",url:u.telegramUrl||o.telegramUrl},{label:"Web",url:u.websiteUrl||o.websiteUrl}].filter((N,Oe,Vt)=>/^https?:\/\//i.test(String(N.url||""))&&Vt.findIndex(wt=>String(wt.url||"")===String(N.url||""))===Oe),ve=[...Array.isArray(o.riskFlags)?o.riskFlags:[],...Array.isArray(o.scoreWarnings)?o.scoreWarnings:[],...Array.isArray(o.bestPickWarnings)?o.bestPickWarnings:[]].filter(Boolean).slice(0,4),Je=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${l(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <section class="slimeshield-drawer-summary slimeshield-${l(Ja(c))}">
        <strong>${l(o.symbol||o.shortMint||w(r))}</strong>
        <p>${l(s.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${l(s.confidence||"low")}</span>
          <span>Score: ${l(Number.isFinite(Number(s.score))?`${Math.round(Number(s.score))}/100`:"n/a")}</span>
          <span>${m?"Updating...":`Updated ${l(ye(s.updatedAt))}`}</span>
        </div>
      </section>
      <section>
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${l(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${l(Number.isFinite(P)?Co(P):Mo(o.pairAgeLabel||Nt(o),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Number.isFinite(y)&&y>0?x(y):Mo(o.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${l(Number.isFinite(b)&&b>0?x(b):Mo(o.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${l(Number.isFinite(S)&&S>0?x(S):Mo(o.volumeH1Label||o.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${l(yo(D))} · ${l(B.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(T?w(T):L?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${g?w(g):L?"none":"not indexed"} / ${A?w(A):L?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(u.source||s.cacheSource||s.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${l(ve.length?ve.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${ne.map(N=>`<a href="${l(N.url)}" target="_blank" rel="noreferrer">${l(N.label)}</a>`).join("")}
          ${_("devInfoEnabled",!0)?`<button type="button" data-dev-info="${l(r)}">Open Dev Info</button>`:""}
        </div>
        ${i.message?`<p class="slimeshield-muted">Source refresh: ${l(i.message)}</p>`:""}
        ${d.length?`<ul class="slimeshield-factor-list">${d.map(N=>`<li><span>${l(N)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section>
        <h4>Top Risk Reasons</h4>
        ${Cd(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section>
        <h4>Positive Signals</h4>
        ${Cd(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note">
        <h4>Suggested Action</h4>
        <p>${l(ov(s.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${l(sv(s.protectedBuyPreset))}</small>
      </section>
      ${mv(r)}
      <div class="slimeshield-drawer-actions">
        ${_("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-preset="${l(s.protectedBuyPreset||Ml(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${l(r)}" ${m?"disabled":""}>${m?"Updating...":"Refresh Details"}</button>
        <button type="button" data-token-trade="${l(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${a.slimeShieldStatus?`<small class="slimeshield-status">${l(a.slimeShieldStatus)}</small>`:""}
    </aside>
  `;er(e,Je,".slimeshield-drawer")}function Wl(e){const t=e==="bundle"?"bundle":"trade";a.activeTab=t,t==="trade"&&(a.editingTradePresetId=""),t==="bundle"&&(a.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function TS(e){if(!e?.tokenMint)return R("No token selected","Click any row to preview it here without leaving the live feeds.");const t=et().some(n=>String(n.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${st(e)}
      <div>
        <strong>${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
        <small>${l(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${l(e.pairAgeLabel||Nt(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${l(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${l(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${l(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${_("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${l(_("slimeShieldEnabled",!0)?Ge(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${Ad(e)}
    <div class="card-actions compact">
      <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${Ya(e)?`<a href="${l(Ya(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="token-preview">${l(ha())}</button>
      <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function PS(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([n,r])=>`<button type="button" data-smart-chart-view="${n}" data-active="${e===n}">${r}</button>`).join("")}
    </div>
  `}function hv(e=""){const t=String(e||"").trim();return t?(a.pnl?.trades||[]).filter(n=>String(n?.tokenMint||n?.mint||"").trim()===t):[]}function AS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=hv(n),o=!!(Ya(e)&&bl(e)),s=o?Ya(e):e.dexUrl||X(Yu(e)||n),c=o?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${l(c)} Transactions</h4>
          <p>Live market activity from ${l(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${l(s)}" target="_blank" rel="noreferrer">Open ${l(c)} Feed</a>
      </div>
      ${Al(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${Nl(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function CS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=Bp(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${l(e.symbol||w(n))}.</p>
        </div>
      </div>
      ${Al(e,"info")}
      ${md(e)}
      ${Ad(e)}
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
        ${vo(e)}
      </div>
    </section>
  `}function gv(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=a.chartTradeTab==="sell"?"sell":"buy",o=se(),s=a.wallets?.length?String(a.wallets[0]?.index||""):"",c=xu(),i=Ft(),u=i?.walletIndex||(i?.walletIndexes||[])[0]||"",d=o?.publicKey&&Bu(o)?"connected":"",m=a.chartBuyWalletIndex||d||(c?.index?String(c.index):"")||u||s||(o?.publicKey?"connected":""),f=le(m),b=a.quickBuyAmountOverride||Ne(i)||"",y=i?Qa("trade"):"No preset / manual",S=String(i?.slippageBps||"400"),P=String(i?.takeProfitPct||"25"),T=String(i?.stopLossPct||"8"),g=String(i?.sellDelay||"off"),A=String(i?.sellPercent||"100"),L=new Set(["300","400","500"]),B=Number.isFinite(Number(S))?`${Number(S)/100}%`:S,D=t?`${l(t.uiAmount||"Position")} tokens | ${l(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${Ka(m)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${l(b)}">
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
          <small class="chart-preset-summary">${l(y)}</small>
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
              ${Ot({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${Ot({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:T,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Ve("chart-buy-delay","data-chart-buy-delay",g)}
            </label>
            <label>
              Exit Size
              ${Ot({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:A,customType:"number",customPlaceholder:"Custom %"})}
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
  `}function LS(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim();return n?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${l(n)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${_("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(n)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function bv(e={},t=null){const n=String(e?.tokenMint||a.smartChartToken||"").trim(),r=rt(e),o=ot(e),s=b=>{const y=String(b??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(y)?"":y},c=F(r>0?x(r):"",s(e.marketCapLabel),s(e.fdvLabel),"checking"),i=F(o>0?x(o):"",s(e.liquidityLabel),"checking"),u=F(Number(e.volumeH1)>0?x(e.volumeH1):"",s(e.volumeH1Label),s(e.volumeLabel),"checking"),d=F(Number(e.volumeH24)>0?x(e.volumeH24):"",s(e.volumeH24Label),"checking"),m=(()=>{const b=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,y=Number(e.h1);return o>0&&o<5e3?"Thin exit":Number.isFinite(y)&&y>80?"Chasing":b!==null&&b<30&&(!Number.isFinite(y)||y>=0)?"Early":b!==null&&b>360&&Number(e.volumeH1)<500?"Stale":r>0&&o>0?"Clean setup":""})(),f=t?"Position held":m||(bl(e)?"Pump curve":F(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${l(w(n))}</strong></span>
      <span><small>MC / FDV</small><strong>${l(c)}</strong></span>
      <span><small>LIQ</small><strong>${l(i)}</strong></span>
      <span><small>1H</small><strong>${l(u)}</strong></span>
      <span><small>24H</small><strong>${l(d)}</strong></span>
      <span><small>Status</small><strong>${l(f)}</strong></span>
    </div>
  `}function yv(){try{return vv()}catch(e){console.error("Smart Chart render failed:",e);const t=String(a.smartChartToken||a.tradeToken||a.terminalToken||"").trim(),n=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
    `}}function vv(){const e=ho(),t=String(e?.tokenMint||"").trim(),n=t?et().find(s=>String(s.tokenMint)===t):null,r=t?he([e,...Vn().filter(s=>String(s.tokenMint||"")===t)]).filter(Boolean).slice(0,5):fa(Xn(),5,ma("smart-chart-suggest"),1);if(!t)return`
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
          ${ht(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:ma("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;ta("tokenHeaderRendered"),ta("chartSkeletonRendered"),ta("buyPanelReady"),E({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(je(t)?.cacheHit||Gn(t)?.pairAddress),stale:!!je(t)?.stale,details:t});const o=e.symbol||e.shortMint||w(t);return`
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
              <button type="button" class="ca-copy" data-copy="${l(t)}">${l(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${vo(e)}
            </div>
          </div>
          ${bv(e,n)}
          ${Al(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${l(o)}</h3>
          ${gv(e,n)}
        </aside>
      </div>
      ${Sv(t)}
    </section>
  `}let _l="",Ed=0;function Fd(e){e&&(_l===e&&Date.now()-Ed<3e4||(_l=e,Ed=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{a.chartCalls={mint:e,...t},a.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function wv(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[n,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${n} ${r}`}function Sv(e){Fd(e);const t=a.chartCalls?.mint===e?a.chartCalls:null,n=t?.calls||[],r=!!(a.token&&a.user);return`
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
                <strong>${l(wv(o.side))} <span class="muted-text">by ${l(o.handle)}</span>
                  ${o.reputation?.wins?`<span class="positive">${l(String(o.reputation.wins))}W${o.reputation.hitRatePct!=null?` ${l(String(o.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${o.entryMcUsd?`Entry MC ${l(x(o.entryMcUsd))} | `:""}${o.targetX?`Target ${l(String(o.targetX))}x | `:""}${o.shieldVerdict?`Shield ${l(o.shieldVerdict)} ${l(String(o.shieldScore??""))} | `:""}${l(ye(o.createdAt))}</span>
                ${o.note?`<small>${l(o.note)}</small>`:""}
                ${o.status==="resolved"?`<small class="${o.outcome==="won"?"positive":"negative"}">${o.outcome==="won"?`✅ hit ${l(String(o.peakX))}x`:l(o.outcome)}</small>`:o.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${l(o.mint)}" data-quick-buy-source="call-board">${l(ha())}</button>
                <button data-watch-token="${l(o.mint)}" data-watch-symbol="${l(o.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${l(ea(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ke(`$${a.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function kv(e){const t=p("[data-call-status]");try{const n=p("[data-call-side]")?.value||"bullish",r=p("[data-call-target]")?.value||"",o=p("[data-call-note]")?.value||"";v(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:n,targetX:r,note:o,source:"site"})}),v(t,"Call posted - it is now being tracked."),_l="",Fd(e)}catch(n){v(t,W(n?.message||"Could not post call."))}}function $v(e,t=!1){const n=e?.tokenMint?a.positions.find(s=>String(s.tokenMint)===String(e.tokenMint)):null,r=Qa("trade"),o=Qa("bundle");return t?`
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
            <span>${xt().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${l(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${l(ha())}</button>
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
          <small>${l(Rr())}</small>
        </div>
    </article>
  `}function Tv(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,n])=>`<button data-terminal-subtab="${t}" data-active="${a.terminalSubtab===t}">${n}</button>`).join("")}
      </div>
      ${Pv()}
    </section>
  `}function Pv(){if(a.terminalSubtab==="orders")return Nd();if(a.terminalSubtab==="history")return Nl(12);if(a.terminalSubtab==="wallets")return Xu();if(a.terminalSubtab==="kol"){const e=sd(a.kolScan?.rows||[]).filter(t=>!jn(t));return ht(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:ma("bottom-kol"),stickyCount:1})}return a.terminalSubtab==="sniper"?a.scan?nt(a.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):R("No sniper scan loaded","Open Sniper or refresh a scan mode."):a.terminalSubtab==="tx"?Ud(!0):a.terminalSubtab==="reconcile"?Dd():Av(6)}function Av(e=25){const t=et();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(_d).join("")}
    </div>
  `:R("No open positions","Open token holdings will show here after refresh.")}const Wd=new Map;function Cv(e){const t=String(e.tokenMint||"");if(!t)return"";const n=(a.pnl?.tokens||[]).find(d=>String(d.tokenMint)===t),r=zn().find(d=>String(d?.tokenMint||"")===t),o=(Array.isArray(a.tradePlans)?a.tradePlans:[]).find(d=>String(d.tokenMint)===t&&["watching","active","armed","pending"].includes(String(d.status||"").toLowerCase())),s=[];n?.spentSol&&s.push(`Entry ${n.spentSol} SOL`),r?.marketCapLabel&&s.push(`MC ${r.marketCapLabel}`),s.push(o?`TP ${o.takeProfitSummary||o.takeProfitPct||"off"} / SL ${o.stopLossSummary||o.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let i="";if(Number.isFinite(c)){const d=Wd.get(t);if(d&&Number.isFinite(d.value)&&Math.abs(c-d.value)>5e-4){const m=c-d.value;i=`${m>0?"▲ +":"▼ "}${m.toFixed(4)} SOL since last refresh`}Wd.set(t,{value:c,at:Date.now()})}let u="";if(o){const d=Number(o.lastMovePct??o.wallets?.[0]?.lastMovePct),m=Number(o.takeProfitPct),f=Number(o.stopLossPct),b=Date.parse(o.sellAfterAt||o.wallets?.[0]?.sellAfterAt||""),y=Number.isFinite(b)?Math.round((b-Date.now())/6e4):null;Number.isFinite(d)&&Number.isFinite(m)&&m>0&&d>=m*.75?u=`Up ${d.toFixed(1)}% - take-profit at +${m}% is close`:Number.isFinite(d)&&Number.isFinite(f)&&f>0&&d<=-(f*.6)?u=`Down ${Math.abs(d).toFixed(1)}% - stop-loss at -${f}% is near`:y!==null&&y>0&&y<=10?u=`Timer exit in ~${y} min`:Number.isFinite(d)&&(u=`${d>=0?"Up":"Down"} ${Math.abs(d).toFixed(1)}% - exits watching`)}else u="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${l(s.join(" | "))}</small>
    ${u?`<small class="${/close|near|Timer|No auto/.test(u)?"warning-text":"muted-text"}">${l(u)}</small>`:""}
    ${i?`<small class="${i.startsWith("▲")?"positive":"negative"}">${l(i)}</small>`:""}
  `}function _d(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",n=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),o=!!(e.viewOnly||e.source==="connected-wallet"),s=t?`${e.estimatedValueSol} SOL`:r?"updating":o?"tracking":"Price unavailable",c=n?e.openPnlSol:r?"updating":o?"realized only":"Price unavailable",i=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:o&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${st(e)}
      <div class="row-main">
        <strong>${l(e.symbol||e.shortMint)}</strong>
        <span>${l(e.uiAmount)} tokens across ${l(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${l(e.name)}</small>`:""}
        <small>Value: ${l(s)} | PnL: ${l(c)}</small>
        ${Cv(e)}
        ${i?`<small class="${r?"muted-text":"warning-text"}">${l(i)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
        <button data-token-trade="${l(e.tokenMint)}" data-token-trade-source="position-arm" title="Open the trade ticket to arm or adjust TP/SL on this bag">Arm Exits</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${l(e.tokenMint)}">Custom %</button>
        ${Ke(Sh(e))}
        <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Nl(e=10,t=null){const n=Array.isArray(t)?t:a.pnl?.trades||[];return n.length?`
    <div class="live-trade-list">
      ${n.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${l(String(r.type||"").toUpperCase())} ${l(r.shortMint||w(r.tokenMint))}</strong>
          <span>${l(r.walletLabel||"wallet")} | ${l(r.solAmount||"0")} SOL</span>
          <small>${l(ye(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${l(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="live-trades">${l(ha())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:R("No live trade history yet","Submitted web trades will appear here after refresh.")}function Lv(){const e=a.pnl?.trades||[],t=Ze("liveTrades",e);return`
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
        ${Nl(t.length||_a("liveTrades"),t)}
        ${oa("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${$v(Ju())}
      </aside>
    </section>
  `}function Nd(){const e=Array.isArray(a.tradePlans)?a.tradePlans:[],t=[a.tradePlanResult,a.bundleResult,a.volumeResult,a.sniperResult,a.kolResult,a.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),n=e.length?e:t;return n.length?`
    <div class="table-list compact-table">
      ${n.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${l(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${l(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${l(r.status||"watching")} | Active wallets: ${l(r.activeWallets??"?")}/${l(r.walletCount??"?")} | TP ${l(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${l(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${l(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${l(ye(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${l(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(Mv).join("")}</div>`:""}
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
  `:R("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function Mv(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",n=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,o=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",s=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${xn(Da(e.retryAfterAt))}`:"",i=e.lastError||e.lastPriceEstimateError||"",u=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",d=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",m=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${l(e.label||"Wallet")}</strong>
        <span>${l(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${l(n)}${e.triggerKind?` / ${l(e.triggerKind)}`:""}</span>
        <small>Move ${l(o)}${l(s)} | checked ${l(xn(Da(t)))}${l(c)}</small>
        <small>${l(u)} | ${l(d)} | ${l(m)} | Source: ${l(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${l(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${l(e.sellSignature)}</small>`:""}
        ${i?`<small class="warning-text">Error: ${l(i)}</small>`:""}
      </div>
    </div>
  `}function Dd(){const e=a.balances.filter(n=>n.error),t=a.balances.reduce((n,r)=>n+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${l(xn(Da(a.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${a.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(n=>`<article class="row-card"><strong>${l(n.label||`Wallet ${n.index}`)}</strong><span>${l(n.error)}</span></article>`).join("")}
      </div>
    `:R("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Ud(e=!1){const t=a.terminalTxAudit;return`
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
        ${t?xv(t):R("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${Nd()}${Dd()}</aside>`}
    </section>
  `}function xv(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${l(e.error)}</span></article>`:`
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
  `}function Bv(e=[]){const t=[...e].sort((n,r)=>Number(r.bestPickScore||r.score||0)-Number(n.bestPickScore||n.score||0)||Xe(n,r));return fa(t,5,ma("cooks-best"),1)}function Se(e){const t=Number(e);return Number.isFinite(t)?t:0}function qd(){const e=a.liveFeedCategory||"best";return gs.find(([t])=>t===e)||gs[0]}function va(e={}){return Oo(e)||Xd(e)||Kl(e)||0}function Dl(e={}){return Se(e.buys5m)+Se(e.buysH1)+Se(e.sells5m)+Se(e.sellsH1)}function Hd(e={}){const t=Se(e.buys5m)+Se(e.buysH1),n=Se(e.sells5m)+Se(e.sellsH1),r=t+n;return r>0?t/r:.5}function ar(e={}){return Math.max(Se(e.m5),Se(e.h1),Se(e.h24))}function Bo(e={}){return Math.max(Se(e.m5),Se(e.h1))}function _t(e={}){return Bo(e)*Math.log10(10+va(e))*(.5+Hd(e))}function Ul(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function Rv(e=[],t="best"){const n=[...e];switch(t){case"volume":return n.sort((r,o)=>va(o)-va(r));case"liquidity":return n.sort((r,o)=>ot(o)-ot(r));case"marketcap":return n.sort((r,o)=>rt(o)-rt(r));case"active":return n.sort((r,o)=>Dl(o)-Dl(r));case"fresh":return n.sort(Xe);case"gainers":return n.sort((r,o)=>ar(o)-ar(r));default:return n.sort((r,o)=>Se(o.bestPickScore||o.score)-Se(r.bestPickScore||r.score)||Xe(r,o))}}function Iv(){const e=a.liveTerminalCategory||"dexTrending";return Ra.find(([t])=>t===e)||Ra[0]}function Ov(e,t,n,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${l(r)}</span>
      <select ${n} aria-label="${l(r)} category">
        ${e.map(([o,s])=>`<option value="${o}"${o===t?" selected":""}>${l(s)}</option>`).join("")}
      </select>
    </label>`}function Ev(){if(a.activeTab==="terminal"){const t=Iv();return{categories:Ra,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:n=>zd(n,t[0]),hasBest:!1}}const e=qd();return{categories:gs,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>Rv(t,e[0]),hasBest:e[0]==="best"}}function Fv(e={}){if(Ul(e))return{cls:"boost",text:"⚡ Boosted"};const t=ar(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const n=Number(e.pairAgeMinutes);return Number.isFinite(n)&&n>=0&&n<=10?{cls:"fresh",text:"✨ Fresh"}:Bo(e)>=25?{cls:"hot",text:"🔥 Hot"}:Hd(e)>=.7&&Dl(e)>=24?{cls:"active",text:"● Active"}:null}function ql(e={}){const t=Fv(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${l(t.text)}</span>`:""}function Kd(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function Wv(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return Kd(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Vd(){const e=a.cookSpotCategory||"dexTrending";return Ra.find(([t])=>t===e)||Ra[0]}function zd(e=[],t="dexTrending"){const n=[...e];switch(t){case"fresh":return n.sort(Xe);case"dexBoosted":{const r=n.filter(Ul).sort((s,c)=>va(c)-va(s)),o=n.filter(s=>!Ul(s)).sort((s,c)=>_t(c)-_t(s));return[...r,...o]}case"pumpTrending":{const r=n.filter(Kd);return(r.length?r:n).sort((o,s)=>_t(s)-_t(o))}case"memeMovers":{const r=n.filter(Wv);return(r.length?r:n).sort((o,s)=>ar(s)-ar(o))}case"earlyMomentum":{const r=n.filter(o=>{const s=Number(o.pairAgeMinutes);return!Number.isFinite(s)||s<=180});return(r.length?r:n).sort((o,s)=>Bo(s)-Bo(o))}case"graduating":{const r=n.filter(o=>To(o)||Po(o)==="graduating");return(r.length?r:n).sort((o,s)=>_t(s)-_t(o))}case"graduated":{const r=n.filter(o=>an(o)||Po(o)==="graduated");return(r.length?r:n).sort((o,s)=>va(s)-va(o))}default:return n.sort((r,o)=>_t(o)-_t(r))}}function _v(e=Vd()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${Ra.map(([n,r])=>`<option value="${n}"${n===t?" selected":""}>${l(r)}</option>`).join("")}
      </select>
    </label>`}function jd(e=0,t=""){const n=Da(t),r=n===null?"live":xn(n);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${l(r)}</span></div>`}function Hl(e=[]){const t=Ev(),n=Ov(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',o=jd(e.length,sa()),s={context:"live",shareBuilder:wa,hideToolbar:!0};if(t.hasBest){const i=Bv(e),u=new Set(i.map(pa).filter(Boolean)),d=[...e].sort(Xe).filter(f=>!u.has(pa(f))),m=Ze("live",d);return`
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
    </div>`}function Gd(){const e=Fe(),t=he(e?.rows||[]),n=en(t),r=Ze("live",n),o=Tt.find(([f])=>f===a.livePairBucket)?.[1]||"Live",s=sa(),c=!!a.livePairsLoadingByBucket[a.livePairBucket],i=Za(),u=a.livePairsRefreshErrorByBucket?.[a.livePairBucket],d=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",m=n.length?Hl(n):i?Qn(t,`${o.toLowerCase()} pairs`):u?R("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?R("Loading live pairs…","Scanning fresh pairs for this time window."):R("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Tt.map(([f,b])=>{const y=a.livePairsByBucket[f]?.rows?.length,S=Number.isFinite(Number(y))?` (${y})`:"";return`<button data-live-pair-bucket="${f}" data-active="${a.livePairBucket===f}">${b}${S}</button>`}).join("")}
        </div>
        ${Bl("live",{rawCount:t.length,visibleCount:n.length})}
        ${xl(t,n)}
        ${rl("live")}
        ${m}
        ${oa("live",n,`${o} pairs`)}
      </main>
    </section>
  `}function MS(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function Nv(){if(!a.user||!a.token)return`${qa()}${R("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=a.watchlist?.rows||[],t=Ze("watchlist",e);return`
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
        ${t.length?nt(t,{context:"watchlist",shareBuilder:n=>Qs(n.tokenMint)}):R("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
        ${oa("watchlist",e,"watched pairs")}
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
  `}function xS(e){return nt(e,{context:"live",shareBuilder:wa})}function nt(e,t={}){const n=t.shareBuilder||wa,r=he(e),o=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":rl(t.context||"scanner")}
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
      ${r.map((s,c)=>Dv(s,c,{...t,shareText:n(s),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":rl(t.context||"scanner")}
      ${R(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function Dv(e,t,n={}){const r=Ro(e.tokenMint),o=n.shareText||wa(e),s=n.primaryActionLabel||"Trade",c=n.primaryAction||"quickTrade",i=n.context==="kol",u=n.context==="watchlist"?`<button type="button" data-unwatch-token="${l(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(Io(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-row")}">
      <div class="signal-token">
        ${st(e,{priority:!!n.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(n.context||"signal-title")}">${l(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${l(e.name||e.category||"Token")}</small>
            ${i?"":ql(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${l(e.dexUrl||X(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${l(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${l(o)}" title="Share to X">SHARE</button>
            ${Xc(o,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(e.sniperCount)}</span>`:""}
          </div>
          ${Wy(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${l(e.pairAgeLabel||Nt(e)||"age unknown")}</span><small>${l(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${l(F(e.liquidityLabel,ot(e)>0?x(ot(e)):"","checking"))}</span><small>${Uv(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${l(F(e.marketCapLabel,rt(e)>0?x(rt(e)):"","checking"))}</span><small>${l(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${l(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${l(Oy(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${l(F(e.volumeH1Label,e.volumeLabel,Oo(e)>0?x(Oo(e)):"","checking"))}</span>
        <small>${ud(e).map(([d,m])=>`${d} ${m}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${l(e.tokenMint)}" title="Snipe buy">${l(s)}</button>`:`<button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(n.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(n.context||"signal-row")}" title="Quick buy with preset or custom SOL">${l(ha())}</button>`}
        <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${i?Su(e):""}
        ${u}
        ${cd(e)}
      </div>
    </article>
  `}function Ro(e){const t=String(e||"");return!!(a.watchlist?.rows||[]).some(n=>String(n.tokenMint)===t)}function Nt(e){const t=$o(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function Uv(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const n=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${n}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function Io(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{},s=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,n.imageUrl,n.image,n.logoURI,n.logo,n.iconUrl,n.info?.imageUrl,n.baseToken?.imageUrl,n.baseToken?.logoURI,o.imageUrl,o.image,o.logoURI,o.logo,s.imageUrl,s.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const i of c){const u=dt(i);if(u)return u}return""}function rt(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.baseToken||e.base||{};return I(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,n.marketCap,n.marketCapUsd,n.market_cap,n.fdv,n.fdvUsd,n.baseToken?.marketCap,n.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,o.marketCap,o.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function ot(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.liquidity||{};return I(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,o.usd,o.quote,n.liquidityUsd,n.liquidity_usd,n.liquidity?.usd,n.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function Kl(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,o.m15,o.m15m,o.m5,o.h1,n.volume?.m15,n.volume?.m5,n.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Oo(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,o.h1,o.m30,o.m15,n.volume?.h1,n.volume?.m30,n.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function Xd(e={}){const t=e.metadata||e.tokenMetadata||{},n=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},o=e.volume||{};return I(e.volumeH24,e.volume24h,e.volume_h24,o.h24,o.d1,n.volume?.h24,n.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function st(e,t={}){const n=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=Io(e),o=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),s=`token:${String(o||e.symbol||n).trim().toLowerCase()}`,c=_("tokenAvatarFixEnabled",!0),i=String(e.avatarState||"").trim().toLowerCase(),u=!!e.avatarUrl&&(!i||i==="ready"),d=u&&o?dt(xh(e)):"",m=c?el(s,u?e.avatarUrl:"",d,i?"":r):el(s,d,r),f=c&&u?d&&m!==d?d:r&&e.avatarUrl&&r!==e.avatarUrl?r:"":"",b=!!t.priority,y=b?"eager":"lazy",S=b?"high":"low",P=i||(m?"ready":"missing");if(m){const T=f?` data-backup-src="${l(f)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${l(P)}"><img src="${l(m)}"${T} data-avatar-src="${l(m)}" data-avatar-key="${l(s)}" alt="${l(e.symbol||e.name||"Token")}" loading="${y}" decoding="sync" fetchpriority="${S}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${l(n)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${l(P)}"><span>${l(n)}</span></div>`}function qv(e=""){const t=String(e||"");let n=0;for(let r=0;r<t.length;r+=1)n+=t.charCodeAt(r);return n%5+1}function Vl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${qv(e)}.png`}function wa(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||Nt(e)||"age unknown"}.`}function Hv(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([n])=>n===a.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${l(Kv(a.scanMode))}</p>
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
        ${a.scan?jv():R("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${Vv()}
      </aside>
    </section>
  `}function Kv(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function Vv(){if(!a.wallets.length)return R("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=a.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${pt("sniper")}
        </div>
        ${It("sniper")}
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
            ${Ve("sniper-delay","data-sniper-delay",e?"3":"5")}
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
            ${_r("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:Dr("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${Va({toolKey:"sniperSetup",activeKey:za("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${a.sniperResult?l(a.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${zv()}
    </section>
  `}function zv(){const e=a.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function jv(){const e=a.scan.rows||[],t=Ze("sniper",e);return e.length?`
    <p class="scan-meta">${l(a.scan.label)} | ${t.length}/${e.length} shown | scored ${a.scan.scanned} | qualified ${a.scan.qualified} | mode-fit ${a.scan.modeFit} | display pool ${a.scan.displayPool||0}</p>
    ${nt(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:kh})}
    ${oa("sniper",e,"snipe candidates")}
  `:R("No usable picks","Refresh again or choose a different mode.")}function Eo(){return a.user?.connectedWallet?.publicKey||""}function Jd(){return a.ogreTek.markets.find(e=>e.symbol===a.ogreTek.selectedMarket)||a.ogreTek.markets[0]||null}function Gv(){return{marketSymbol:a.ogreTek.selectedMarket,direction:a.ogreTek.direction,orderType:a.ogreTek.orderType,collateralUsd:a.ogreTek.collateralUsd,leverage:a.ogreTek.leverage,slippagePct:a.ogreTek.slippagePct,priorityFeeLamports:a.ogreTek.priorityFeeLamports,limitPrice:a.ogreTek.limitPrice,stopPrice:a.ogreTek.stopPrice}}function Yd(){return xp(Gv(),Jd(),a.ogreTek.account,we)}function be(e,t=2){const n=Number(e);return Number.isFinite(n)?Math.abs(n)>=1e9?`$${(n/1e9).toFixed(2)}B`:Math.abs(n)>=1e6?`$${(n/1e6).toFixed(2)}M`:Math.abs(n)>=1e3?`$${(n/1e3).toFixed(1)}K`:`$${n.toFixed(t)}`:"n/a"}function lt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function Fo(e,t=3){const n=Number(e);return Number.isFinite(n)?`${n>=0?"+":""}${n.toFixed(t)}%`:"n/a"}function Qd(e){const t=Date.parse(e||"");if(!t)return"not loaded";const n=Math.max(0,Math.round((Date.now()-t)/1e3));return n<60?`${n}s ago`:`${Math.round(n/60)}m ago`}function Wo(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in a.ogreTek)||(e.type==="checkbox"?a.ogreTek[t]=!!e.checked:a.ogreTek[t]=e.value)})}async function Xv(){!we.enabled||a.ogreTek.loading||a.ogreTek.markets.length||a.ogreTek.error||await nr({silent:!0}).catch(e=>{a.ogreTek.error=W(e.message),h({force:!0})})}async function nr({force:e=!1,silent:t=!1}={}){if(we.enabled&&!(a.ogreTek.loading&&!e)){a.ogreTek.loading=!0,a.ogreTek.error="",t||h({force:!0});try{const n=Eo(),[r,o,s,c]=await Promise.all([or.getMarkets(),or.getAccount(n),or.getPositions(n),or.getOpenOrders(n)]);a.ogreTek.markets=r||[],a.ogreTek.account=o||null,a.ogreTek.positions=s||[],a.ogreTek.orders=c||[],a.ogreTek.markets.some(i=>i.symbol===a.ogreTek.selectedMarket)||(a.ogreTek.selectedMarket=a.ogreTek.markets[0]?.symbol||"SOL-PERP"),a.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(n){a.ogreTek.error=W(n.message)}finally{a.ogreTek.loading=!1,h({force:!0})}}}function Jv(){return`
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
  `}function Yv(){if(Cp(we)!=="enabled")return Jv();const e=!!Eo(),t=Jd(),n=Yd(),r=n.quote,o=a.ogreTek.account,s=n.ok&&!a.ogreTek.loading,c=a.ogreTek.error?"Provider Error":a.ogreTek.loading?"Loading":"Ready",i=we.demoMode?"Review Demo Trade":"Review Trade",u=we.demoMode?"Confirm Demo Review":"Confirm Order",d=we.demoMode?!a.ogreTek.riskAccepted||!n.ok:!Pp({validation:n,riskAccepted:a.ogreTek.riskAccepted,demoMode:we.demoMode});return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${we.demoMode?"Demo Mode":"Live Adapter"}</span>
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
            ${Qv()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${a.ogreTek.positions.length} open</span>
            </div>
            ${ew()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${tw()}
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
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${l(we.maxLeverage)}" step="0.5" value="${l(a.ogreTek.leverage)}">
                <span>${l(a.ogreTek.leverage)}x max ${l(we.maxLeverage)}x</span>
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
            ${Zv(r,t)}
            ${Zd(n)}
            <button class="primary" type="button" data-ogre-tek-review ${s?"":"disabled"}>${l(i)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${aw(o)}
          </article>
        </aside>
      </section>
      ${a.ogreTek.reviewOpen?nw({validation:n,quote:r,market:t,confirmButtonText:u,confirmDisabled:d}):""}
    </section>
  `}function Qv(){return a.ogreTek.loading&&!a.ogreTek.markets.length?R("Loading markets","Ogre Tek is loading demo perps markets."):a.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${a.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${l(e.symbol)}" data-active="${e.symbol===a.ogreTek.selectedMarket}">
          <span>${l(e.symbol)}</span>
          <strong>${lt(e.indexPrice)}</strong>
          <small>Oracle ${lt(e.oraclePrice)} | 24h ${Fo(e.change24hPct,2)}</small>
          <small>Funding ${Fo(e.fundingRatePct,3)} | OI ${be(e.openInterestUsd,0)}</small>
          <small>Fresh ${l(Qd(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:R("No markets available","No allowed perps markets are available for this provider.")}function Zv(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${lt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${be(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${lt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${be(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${be(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${be(e?.maxLossUsd)}</strong></span>
    </div>
  `}function Zd(e){const t=e.errors||[],n=e.warnings||[];return!t.length&&!n.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${l(r)}</p>`).join("")}
      ${n.map(r=>`<p data-kind="warning">${l(r)}</p>`).join("")}
    </div>
  `}function ew(){return Eo()?a.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${a.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.side)} | margin ${Fo(e.marginRatioPct,1)}</small></span>
          <span>${be(e.sizeUsd)}<small>collateral ${be(e.collateralUsd)}</small></span>
          <span>${lt(e.entryPrice)}<small>mark ${lt(e.markPrice)}</small></span>
          <span>${lt(e.liquidationPrice)}</span>
          <span data-positive="${Number(e.unrealizedPnlUsd)>=0}">${be(e.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `:R("No open positions","Mock positions will appear here when the provider reports them."):R("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function tw(){return Eo()?a.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${a.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.type)} ${l(e.side)}</small></span>
          <span>${lt(e.triggerPrice)}</span>
          <span>${be(e.sizeUsd)}</span>
          <span>${l(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:R("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):R("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function aw(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${be(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${be(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${be(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${l(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${be(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${l(e.maxLeverageAllowed||we.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${l(Qd(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function nw({validation:e,quote:t,market:n,confirmButtonText:r,confirmDisabled:o}){const s=e.order||{};return`
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
          <span><small>Collateral</small><strong>${be(s.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${l(s.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${lt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${lt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${be(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${Fo(n?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${be(t?.maxLossUsd)}</strong></span>
        </div>
        ${Zd(e)}
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
  `}function ep(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const zl="slimewire:ogreAgentMessages:v1",jl="slimewire:ogreAgentLastToken:v1";function rw(){try{const e=JSON.parse(localStorage.getItem(zl)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function ow(){try{localStorage.setItem(zl,JSON.stringify(rn().slice(-50)))}catch{}}function Dt(){if(a.ogreAgentLastTokenMint)return String(a.ogreAgentLastTokenMint);try{a.ogreAgentLastTokenMint=String(localStorage.getItem(jl)||"").trim()}catch{a.ogreAgentLastTokenMint=""}return a.ogreAgentLastTokenMint||""}function _o(e=""){const t=String(e||"").trim();if(!t)return"";a.ogreAgentLastTokenMint=t;try{localStorage.setItem(jl,t)}catch{}return t}function rn(){if(!Array.isArray(a.ogreAgentMessages)||!a.ogreAgentMessages.length){const e=rw();a.ogreAgentMessages=e.length?e:[ep()]}return a.ogreAgentMessages}function sw(){const e=String(a.smartChartToken||a.tradeToken||Dt()||"").trim(),t=e?ga(e):null,n=t?.tokenMint?Ge(t):null,r=e?xd(e):null,o=e?Ol(e):null,s=Gr().slice(0,3),c=e?et().find(i=>String(i.tokenMint||"")===e):null;return{route:a.route,activeTab:a.activeTab,agentFastMode:a.ogreAgentFastMode,agentAutoTradeApproved:qo(),lastTokenMint:Dt(),recentAgentMessages:rn().slice(-8).map(i=>({role:i.role==="user"?"user":"assistant",text:String(i.text||"").slice(0,600)})),smartChartToken:a.smartChartToken||"",tradeToken:a.tradeToken||"",livePairBucket:a.livePairBucket||"",slimeScopeMode:a.slimeScopeMode||"",walletConnected:!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey),walletCount:_s(),positionCount:et().length,totalSol:xt().toFixed(4),selectedTradePreset:Qa("trade"),selectedBundlePreset:Qa("bundle"),quickBuyAmount:String(Yl()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:Ro(e)}:null,slimeShield:n?{verdict:n.verdict,summary:n.summary,confidence:n.confidence,suggestedAction:n.suggestedAction,topFactors:(n.factors||[]).slice(0,4).map(i=>i.message||i.label||i.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:s.length?s.map(i=>({displayName:i.displayName,riskLabel:i.riskLabel,dumpRiskPercent:i.lowData?null:i.dumpRiskPercent,lowData:!!i.lowData,summary:Dn(i)})):[],replayBeforeBuy:o?{sampleSize:o.sampleSize,confidence:o.confidence,winRatePercent:o.winRatePercent,medianMaxDrawdownPercent:o.medianMaxDrawdownPercent,summary:o.summary}:null,pnlSummary:{realized:yc(),positions:et().length,totalSol:xt().toFixed(4)},profile:{hasReferralCode:!!a.user?.referralCode,referralCode:a.user?.referralCode||"",hasReferralPayoutWallet:!!a.user?.referralPayoutWallet,hasXHandle:!!(a.xHandle||a.user?.xHandle),traderBoardEnabled:a.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(a.user?.connectedWallet?.publicKey||a.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:tp()}}function tp(){const e=[],t=new Set,n=(r,o="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(i=>n(i,o));return}if(Array.isArray(r.rows)){r.rows.forEach(i=>n(i,o));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(i=>n(i,o));return}if(typeof r!="object")return;const s=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!s)return;const c=s.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:s,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:o}))};return n(a.livePairRows,"live-pairs"),n(a.slimeScopeRows,"slime-scope"),n(a.livePairs,"live-pairs"),Object.values(a.livePairsByBucket||{}).forEach(r=>n(r,"bucket")),Object.values(a.terminalFeeds||{}).forEach(r=>n(r,"terminal-feed")),e.sort((r,o)=>ap(o)-ap(r)).slice(0,24)}function ap(e={}){const t=T=>Number.isFinite(Number(T))?Number(T):0,n=t(e.ageMinutes),r=t(e.marketCap),o=t(e.liquidityUsd),s=t(e.volume5m),c=t(e.volume1h),i=Math.max(s,c*.18),u=n>0?Math.max(0,90-Math.min(n,360))/2.5:12,d=n>120?Math.min(42,(n-120)/4):0,m=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?i/r:0,b=f>=.08?24:f>=.04?16:f>=.018?8:i>0?2:-18,y=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,S=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+u+m+b+Math.log10(1+s+c)*7+Math.log10(1+o)*3+y+S-P-d}function lw(e={}){return String(e.label||e.type||"Run").slice(0,40)}function iw(e={},t=0){const n=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${l(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${l(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${n.length?`<div class="ogre-agent-actions">${n.map((o,s)=>`<button type="button" data-ogre-agent-action="${t}:${s}">${l(lw(o))}</button>`).join("")}</div>`:""}
    </div>
  `}function cw(){const e=!!(a.ogreAgentLoading||a.ogreAgentSpeaking),t=!!a.ogreAgentListening,n=!!a.ogreAgentVoiceEnabled;return`
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
  `}function uw(){const e=!!a.ogreAgentOpen,t=rn(),n=a.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=sp(),o=a.ogreAgentListening?"Stop":"Mic";return`
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
        ${e?cw():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(iw).join("")}
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
  `}function O({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const n=t.querySelector("[data-ogre-agent-input]"),r=!!(n&&document.activeElement===n),o=r?n.selectionStart:null,s=r?n.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),i=c?c.scrollTop:0,u=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;n&&(a.ogreAgentDraft=n.value);const d=Array.isArray(a.ogreAgentMessages)?a.ogreAgentMessages:[],m=d[d.length-1]||{},f=[a.ogreAgentOpen?"open":"closed",a.ogreAgentLoading?"loading":"idle",a.ogreAgentStatus||"",d.length,m.role||"",m.text||"",Array.isArray(m.actions)?m.actions.length:0,a.ogreAgentVoiceEnabled?"voice-on":"voice-off",a.ogreAgentSpeaking?"speaking":"silent",a.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=uw(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation(),Uo()});const b=t.querySelector("[data-ogre-agent-input]");b&&(b.value=a.ogreAgentDraft||"",r&&(b.focus({preventScroll:!0}),o!==null&&s!==null&&b.setSelectionRange(o,s),setTimeout(()=>b.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const y=t.querySelector("[data-ogre-agent-feed]");y&&(e||u||a.ogreAgentLoading?y.scrollTop=y.scrollHeight:y.scrollTop=Math.min(i,Math.max(0,y.scrollHeight-y.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function ie(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};a.ogreAgentMessages=[...rn(),t].slice(-50),ow(),t.role==="assistant"&&rp(t.text||"")}function Gl(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function dw(){if(!Gl())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=n=>{const r=`${n.name||""} ${n.voiceURI||""}`.toLowerCase(),o=String(n.lang||"").toLowerCase();let s=0;return(/^en[-_]/.test(o)||o==="en")&&(s+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(s+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(s+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(s-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(s-=25),n.localService&&(s+=3),s};return e.slice().sort((n,r)=>t(r)-t(n))[0]||e[0]||null}let on=null;function pw(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!on||on.state==="closed")&&(on=new e),on.state==="suspended"&&on.resume(),on}catch{return null}}function np(e="reply"){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen)return;const t=pw();if(t)try{const n=t.currentTime,r=e==="online"?.22:.34,o=t.createGain(),s=t.createBiquadFilter(),c=t.createOscillator(),i=t.createOscillator(),u=t.createGain();o.gain.setValueAtTime(1e-4,n),o.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,n+.035),o.gain.exponentialRampToValueAtTime(1e-4,n+r),s.type="lowpass",s.frequency.setValueAtTime(210,n),s.frequency.exponentialRampToValueAtTime(92,n+r),s.Q.setValueAtTime(5.2,n),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,n),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,n+r),i.type="sine",i.frequency.setValueAtTime(e==="online"?45:38,n),i.frequency.exponentialRampToValueAtTime(e==="online"?35:31,n+r),u.gain.setValueAtTime(.18,n),u.gain.exponentialRampToValueAtTime(1e-4,n+r),c.connect(s),s.connect(o),i.connect(u),u.connect(o),o.connect(t.destination),c.start(n),i.start(n),c.stop(n+r+.02),i.stop(n+r+.02)}catch{}}function bt(e=!1){a.ogreAgentSpeaking=!!e,a.ogreAgentOpen&&O({force:!0})}function No(){if(!Gl()){bt(!1);return}try{window.speechSynthesis.cancel()}catch{}bt(!1)}function mw(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function rp(e=""){if(!a.ogreAgentVoiceEnabled||!a.ogreAgentOpen||!Gl()){bt(!1);return}const t=mw(e);if(!t){bt(!1);return}try{window.speechSynthesis.cancel();const n=new window.SpeechSynthesisUtterance(t),r=dw();r&&(n.voice=r),n.pitch=.72,n.rate=.86,n.volume=1,n.onstart=()=>bt(!0),n.onend=()=>bt(!1),n.onerror=()=>bt(!1),bt(!0),np("reply"),window.speechSynthesis.speak(n)}catch{bt(!1)}}function fw(e){a.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",a.ogreAgentVoiceEnabled?"on":"off")}catch{}a.ogreAgentVoiceEnabled?(a.ogreAgentStatus="Ogre voice on.",np("online"),rp("Ogre voice online.")):(No(),a.ogreAgentStatus="Ogre voice muted."),O({force:!0})}function op(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function sp(){return!!op()}async function lp(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function ip(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();a.ogreAgentDraft=t;const n=document.querySelector("[data-ogre-agent-input]");if(n){n.value=t;try{n.focus({preventScroll:!0}),n.setSelectionRange(t.length,t.length)}catch{}}}function Do(){Xt&&(clearTimeout(Xt),Xt=null),Pa&&(clearTimeout(Pa),Pa=null)}function cp(e,t=a.ogreAgentSpeechRecognizer){Pa&&clearTimeout(Pa),Pa=setTimeout(()=>{e!==Ye||a.ogreAgentSpeechRecognizer!==t||Ut("Mic timed out instead of staying open. Tap Mic again or type the command.")},jp)}function Ut(e=""){Ye+=1,Do();const t=a.ogreAgentSpeechRecognizer;if(a.ogreAgentSpeechRecognizer=null,a.ogreAgentListening=!1,a.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(a.ogreAgentStatus=e),a.ogreAgentOpen&&O({force:!0})}async function hw(){if(!sp()){const s=await lp();a.ogreAgentStatus=s==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",O({force:!0});return}a.ogreAgentLoading&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),No(),Ut();const e=Ye;a.ogreAgentStatus="Checking microphone permission...",O({force:!0});const t=await lp();if(e!==Ye||!a.ogreAgentOpen)return;if(t==="denied"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",O({force:!0});return}if(t==="unavailable"){a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="No microphone is available to this browser. Typing still works.",O({force:!0});return}const n=op(),r=new n,o=++Ye;a.ogreAgentSpeechRecognizer=r,a.ogreAgentListening=!0,a.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||a.ogreAgentDraft||"").trim(),a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Opening microphone...",O({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",Xt=setTimeout(()=>{o!==Ye||a.ogreAgentSpeechRecognizer!==r||Ut("Mic did not start. Check browser permission, then tap Mic again.")},zp),r.onstart=()=>{o!==Ye||a.ogreAgentSpeechRecognizer!==r||(Xt&&(clearTimeout(Xt),Xt=null),a.ogreAgentListening=!0,a.ogreAgentStatus="Listening... speak your Ogre command.",cp(o,r),O({force:!0}))},r.onresult=s=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;cp(o,r);let c="",i="";for(let d=s.resultIndex||0;d<s.results.length;d+=1){const m=String(s.results[d]?.[0]?.transcript||"");s.results[d]?.isFinal?i+=` ${m}`:c+=` ${m}`}i.trim()&&(a.ogreAgentSpeechFinal=`${a.ogreAgentSpeechFinal||""} ${i}`.replace(/\s+/g," ").trim());const u=[a.ogreAgentSpeechBaseDraft,a.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();ip(u)},r.onerror=s=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;Do();const c=String(s?.error||"");a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",O({force:!0})},r.onend=()=>{if(o!==Ye||a.ogreAgentSpeechRecognizer!==r)return;Do();const s=String(a.ogreAgentDraft||"").trim(),c=!!(s&&a.ogreAgentSpeechFinal&&!a.ogreAgentLoading);a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",O({force:!0}),c&&setTimeout(()=>{ip(s),Ht()},100)};try{r.start()}catch{Do(),a.ogreAgentListening=!1,a.ogreAgentSpeechRecognizer=null,a.ogreAgentSpeechFinal="",a.ogreAgentStatus="Mic could not start. Typing still works.",O({force:!0})}}function gw(){a.ogreAgentListening||a.ogreAgentSpeechRecognizer?Ut("Voice input stopped."):hw()}function Uo(){a.ogreAgentOpen=!1,a.ogreAgentStatus="",a.ogreAgentLoading=!1,a.ogreAgentRequestId="",Ut(),No(),O({force:!0})}function bw(e=""){const[t,n]=String(e).split(":");return rn()[Number(t)]?.actions?.[Number(n)]||null}function up(){return Array.isArray(a.wallets)&&a.wallets.length>0}function dp(){return!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.walletPublicKey||a.connectedWalletPublicKey)}function qo(){return!!(!pp()&&(a.ogreAgentAutoTradeApproved||up()||dp()))}function yw(e="wallet-sync"){return pp()?!1:up()||dp()?(Jl(!0),!0):(Xl(),!1)}function pp(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Xl(){a.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function Jl(e,t={}){a.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),a.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function mp(e){a.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",a.ogreAgentFastMode?"on":"off")}catch{}}function yt(e=""){const t=String(e||"").toLowerCase(),n=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),o=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return n?"buy":r||o?"sell":""}function vw(e=""){const t=String(e||"").toLowerCase(),n=yt(t);if(!n||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),o=n==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),s=!!(Dt()||a.smartChartToken||a.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||n==="buy"&&s&&/\b(just\s+)?buy\b/.test(t);return!!(o&&c&&!r)}function ww(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return n?Number(n):0}function Yl(){const e=typeof Ft=="function"?Ft():null,t=Number(a.quickBuyAmountOverride||(typeof Ne=="function"?Ne(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function Sw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=o?Math.round(Number(o)*100):0,c=[];return n&&c.push(`TP +${n}%`),r&&c.push(`SL -${r}%`),o&&c.push(`slippage ${o}%`),{takeProfitPct:n,stopLossPct:r,slippagePct:o,slippageBps:Number.isFinite(s)&&s>0?s:0,summary:c.join(" / ")}}function kw(e=""){const t=String(e||"").toLowerCase(),n=(t.match(/(\d{1,3})\s*%/)||[])[1];return n||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function $w(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function Tw(){const e=[],t=(r={})=>{const o=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();o&&e.push({tokenMint:o,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};a.smartChartToken&&t({tokenMint:a.smartChartToken,symbol:a.smartChartTokenSymbol}),a.tradeToken&&t({tokenMint:a.tradeToken,symbol:a.tradeTokenSymbol}),[a.livePairRows,a.slimeScopeRows,a.watchlist,a.positions,a.portfolioRows,a.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const n=new Set;return e.filter(r=>{const o=r.tokenMint.toLowerCase();return n.has(o)?!1:(n.add(o),!0)})}function Pw(e=""){const t=String(e||"").trim(),n=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(n)return n;const r=t.toLowerCase();return Tw().map(s=>{const c=s.symbol.toLowerCase(),i=s.name.toLowerCase();let u=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(u+=12+c.length),i&&r.includes(i)&&(u+=8+Math.min(16,i.length)),{...s,score:u}}).filter(s=>s.score>0).sort((s,c)=>c.score-s.score)[0]?.tokenMint||""}function Ho(e={},t=""){const n={...e},r=yt(t);if(!n.tokenMint&&!n.mint&&!n.ca){const o=Pw(t)||Dt()||a.smartChartToken||a.tradeToken;o&&(n.tokenMint=o)}if(n.type==="confirm_buy"||r==="buy"){if(n.type=n.type||"confirm_buy",!n.amountSol){const s=ww(t)||Yl();s>0&&(n.amountSol=s)}const o=Sw(t);if(o.takeProfitPct&&!n.takeProfitPct&&(n.takeProfitPct=o.takeProfitPct),o.stopLossPct&&!n.stopLossPct&&(n.stopLossPct=o.stopLossPct),o.slippageBps&&!n.slippageBps&&(n.slippageBps=o.slippageBps),n.walletIndex===void 0){const s=$w(t);s!==void 0&&(n.walletIndex=s)}}return(n.type==="confirm_sell"||r==="sell")&&(n.type=n.type||"confirm_sell",n.percent=n.percent||kw(t)),n}function fp(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function hp(e={},t=""){if(!a.ogreAgentFastMode||!qo()||e.requiresReview||e.conditional)return!1;const n=yt(t);return n?n==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:n==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function qt(e={}){const t=String(e.type||""),n=String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||Dt()||"").trim();if(t==="toggle_agent_fast_mode"){mp(!a.ogreAgentFastMode),a.ogreAgentStatus=a.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",ie({role:"assistant",text:a.ogreAgentStatus,actions:[{label:a.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),O();return}if(t==="approve_agent_auto_trade"){Jl(!0),mp(!0),a.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",ie({role:"assistant",text:`${a.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),O();return}if(t==="revoke_agent_auto_trade"){Jl(!1,{revoked:!0}),a.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",ie({role:"assistant",text:a.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),O();return}if(t==="open_tab"){a.route="terminal",a.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!n){a.ogreAgentStatus="Paste a token CA in the message first.",O();return}ft(fe(n,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){a.route="terminal",a.activeTab="positions",window.history.pushState({},"","/terminal"),a.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){z(()=>ut({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Wallet refresh started.",O();return}if(t==="refresh_feeds"){z(()=>Na({force:!0,reason:"ogre_agent"})),a.ogreAgentStatus="Feed refresh started.",O();return}if(t==="open_wallet_connect"){ia({returnPath:"/terminal"}),a.ogreAgentStatus="Wallet connect opened.",O();return}if(t==="start_clip_recording"){Bc(),a.ogreAgentStatus="REC started from Ogre Agent.",O();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim();if(!r){a.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",O();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(a.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),Ga(fe(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),a.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",O();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||a.smartChartToken||a.tradeToken||Dt()||"").trim(),o=Number(e.amountSol||e.sol||e.amount||Yl()||0);if(!r||!Number.isFinite(o)||o<=0){r&&Ga(fe(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),a.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",O();return}const s=e.walletIndex!==void 0?e.walletIndex:se()?.publicKey?"connected":a.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;a.ogreAgentLoading=!0,a.ogreAgentStatus=`Sending ${o} SOL buy request...`,O();try{const i=await io({tokenMint:r,walletIndex:s,amountSol:o,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});a.ogreAgentStatus=i?.ok===!1?i.error||i.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${fp(e)}`,typeof ut=="function"&&ut({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(i){a.ogreAgentStatus=i?.message||"Buy failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||a.selectedToken?.mint||a.selectedToken?.pairAddress||"").trim(),o=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){a.activeTab="positions",a.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}a.ogreAgentLoading=!0,a.ogreAgentStatus=`Preparing sell ${o}%...`,O();try{await uo(r,o,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),a.ogreAgentStatus=`Sell ${o}% submitted. Refreshing wallet and positions in the background.`,typeof ut=="function"&&ut({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(s){a.ogreAgentStatus=s?.message||"Sell failed. Check wallet/RPC status and retry."}finally{a.ogreAgentLoading=!1,O()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){a.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",O();return}window.open(r,"_blank","noopener,noreferrer"),a.ogreAgentStatus="Opened trusted coin link.",O();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=_o(String(e.tokenMint||e.mint||e.ca||a.smartChartToken||a.tradeToken||Dt()||"").trim());if(!r){a.ogreAgentStatus="Paste a token CA and ask me to check it.",O();return}const o=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};a.ogreAgentLoading=!0,a.ogreAgentStatus="Checking coin details...",O();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},i=c.symbol||c.baseSymbol||w(r),u=c.name||c.baseName||"Token",d=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,m=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",b=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",y=c.telegramUrl||c.links?.telegram||"",S=o(c.liquidityUsd||c.liquidity?.usd),P=o(c.marketCap||c.fdv||c.marketCapUsd),T=o(c.volume24h||c.volume?.h24||c.volume?.m5),g=[`${i} breakdown`,`${u} | ${w(r)}`,`MC/FDV: ${P} | Liquidity: ${S} | Volume: ${T}`,`Socials: X ${b?"found":"not returned"} | Telegram ${y?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],A=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:d}];m&&A.push({label:"Pump",type:"open_external",url:m}),f&&A.push({label:"Website",type:"open_external",url:f}),b&&A.push({label:"X",type:"open_external",url:b}),y&&A.push({label:"Telegram",type:"open_external",url:y}),ie({role:"assistant",text:g.join(`
`),actions:A}),a.ogreAgentStatus="Coin breakdown ready."}catch(s){ie({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),a.ogreAgentStatus=s?.message||"Coin check delayed."}finally{a.ogreAgentLoading=!1,O()}return}a.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",O()}function Aw(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function Ql(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function gp(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function Cw(e="",t=[]){const n=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(o=>String(o||"").trim()).filter((o,s,c)=>o&&c.findIndex(i=>i.toLowerCase()===o.toLowerCase())===s).slice(0,4),r=n.length?n.map(o=>`"${o.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function Lw(e=""){if(!gp(e))return null;const t=_o(Ql(e)||Dt()||a.smartChartToken||a.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:Cw(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function Mw(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function xw(e=""){if(!Mw(e))return null;const t=tp().slice(0,4),n=s=>{const c=Number(s);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((s,c)=>{const i=s.symbol||w(s.tokenMint),u=Number.isFinite(Number(s.ageMinutes))?`${Math.max(0,Math.round(Number(s.ageMinutes)))}m old`:"age n/a",d=s.twitterUrl||s.telegramUrl||s.websiteUrl?"socials found":"socials not returned",m=Array.isArray(s.riskFlags)&&s.riskFlags.length?`risk: ${s.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${i} ${w(s.tokenMint)} | MC ${n(s.marketCap)} | Liq ${n(s.liquidityUsd)} | Vol ${n(s.volume5m||s.volume1h)} | ${u} | ${d} | ${m}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],o=t[0];return{text:r.join(`
`),actions:[o?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:o.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const Bw=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],Rw=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function Iw(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||Ql(e)||yt(e))return null;const n=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(n){const o=Yn(n[1]);if(o)return a.quickBuyAmountOverride=o,Or({quickBuy:o}),Ao(),{text:`Quick buy set to ${o} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return Or({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return Or({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=Rw.test(t);for(const[o,s]of Bw)for(const c of s){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${Ow(o)} now.${o==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:o},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function Ow(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const Ew={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function bp(e){a.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},Ko()}function Ce(e,t="ok",n=""){if(!a.tradeTrace||a.tradeTrace.done&&t==="pending")return;const r=a.tradeTrace.steps,o=r.find(i=>i.key===e),s=o||{key:e,label:Ew[e]||e};if(s.status=t,s.detail=String(n||"").slice(0,140),o||r.push(s),t==="fail"&&(a.tradeTrace.done=!0),Ko(),t==="fail")return;r.length>=3&&r.every(i=>i.status==="ok")&&(a.tradeTrace.done=!0,window.setTimeout(()=>{a.tradeTrace?.done&&!a.tradeTrace.steps.some(i=>i.status==="fail")&&(a.tradeTrace=null,Ko())},8e3))}function Ko(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=a.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const n=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
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
  `}async function Ht(e=""){const t=document.querySelector("[data-ogre-agent-input]"),n=String(e||t?.value||"").trim();if(!n||a.ogreAgentLoading)return;const r=Ql(n);if(r&&_o(r),t&&(t.value=""),a.ogreAgentDraft="",ie({role:"user",text:n,actions:[]}),vw(n)){const i=yt(n),u=Ho({type:i==="buy"?"confirm_buy":"confirm_sell"},n),d=String(u.tokenMint||u.mint||u.ca||"").trim(),m=Number(u.amountSol||u.sol||u.amount||0);if(!d){ie({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),a.ogreAgentStatus="Need token CA.",O({force:!0});return}if(i==="buy"&&(!Number.isFinite(m)||m<=0)){ie({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:d},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),a.ogreAgentStatus="Need buy amount.",O({force:!0});return}if(!qo()){ie({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),a.ogreAgentStatus="Wallet session needed.",O({force:!0});return}ie({role:"assistant",text:i==="buy"?`Sending ${m} SOL buy for ${w(d)}.${fp(u)}`:`Sending sell request for ${w(d)}${u.percent?` at ${u.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:d}]}),a.ogreAgentStatus="Fast Mode: sending trade request...",O({force:!0}),await qt(u);return}const o=Iw(n);if(o){ie({role:"assistant",text:o.text,actions:o.actions||[]}),a.ogreAgentStatus="Instant local reply.",O({force:!0}),o.run&&await qt(o.run);return}a.ogreAgentLoading=!0,a.ogreAgentStatus="",ee("chatRequestStarted");const s=`${Date.now()}:${Math.random().toString(16).slice(2)}`;a.ogreAgentRequestId=s;const c=setTimeout(()=>{a.ogreAgentRequestId!==s||!a.ogreAgentLoading||(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,a.ogreAgentStatus="Agent reply timed out.",ee("chatRequestTimedOut"),ie({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:n,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),O({force:!0}))},7500);O();try{const i=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:n,context:sw()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(a.ogreAgentRequestId!==s)return;const u=(i?.agent?.actions||[]).map(S=>Ho(S,n));i?.agent?.tokenMint&&_o(i.agent.tokenMint),ie({role:"assistant",text:i?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:u}),ee("chatRequestSucceeded");const d=!!(i?.agent?.coinEnriched||i?.agent?.tokenMint||i?.agent?.socialLinks||i?.agent?.socialScan),f=!gp(n)&&!d&&!yt(n)&&Aw(n)?u.find(S=>S.type==="coin_breakdown"||S.type==="analyze_coin")||Ho({type:"coin_breakdown"},n):null;if(f?.tokenMint||f?.mint||f?.ca){a.ogreAgentStatus="Checking coin now...",await qt(f);return}const b=Ho({type:yt(n)==="buy"?"confirm_buy":yt(n)==="sell"?"confirm_sell":""},n);if(yt(n)&&a.ogreAgentFastMode&&!qo()){ie({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),a.ogreAgentStatus="Auto-Trade approval needed once.";return}const y=u.find(S=>hp(S,n))||(hp(b,n)?b:null);if(y){a.ogreAgentStatus="Fast Mode: sending trade request...",await qt(y);return}a.ogreAgentStatus=i?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(i){if(a.ogreAgentRequestId!==s)return;const u=Lw(n);if(u){ie({role:"assistant",text:u.text,actions:u.actions}),a.ogreAgentStatus="Fast local X/KOL fallback.";return}const d=xw(n);if(d){ie({role:"assistant",text:d.text,actions:d.actions}),a.ogreAgentStatus="Fast local trend scan.";return}ie({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:n,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),ee("chatRequestFailed"),a.ogreAgentStatus=i?.message||"Agent reply failed."}finally{clearTimeout(c),a.ogreAgentRequestId===s&&(a.ogreAgentRequestId="",a.ogreAgentLoading=!1,O())}}function R(e,t){return`<article class="empty"><h3>${l(e)}</h3><p>${l(t)}</p></article>`}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ye(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function Fw(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function yp(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const n=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");n&&(e.preventDefault(),Fw(n),Di({connectPanel:n.matches("[data-connect-login-toggle]")||a.route==="connect",source:n.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(Im(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),Ht();return}const n=e.target?.closest?.("[data-global-token-search]");if(n&&e.key==="Enter"){e.preventDefault(),Hu(n.value||"");return}if(e.key==="Escape"){if(a.ogreAgentOpen){Uo();return}if(a.slimeShieldDetails?.open){Ld();return}if(a.kolDumpDetails?.open){ul();return}if(a.replayDetails?.open){Fl();return}if(a.protectedBuyModal?.open){lo();return}if(!(!a.loginModalOpen&&!a.quickBuyModal?.open)){if(a.quickBuyModal?.open){wl();return}_i()}}});function Zl(e=null,t="interaction"){const n=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!n)return!1;const r=n.dataset.tokenTrade||n.dataset.tokenChart||n.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),i=Number(a.smartChartInteractionPrefetchAt||0),u=a.smartChartInteractionPrefetchSeen||{};if(i&&c-i<vy||Number(u[r]||0)&&c-Number(u[r])<ky)return!1;const d=(a.smartChartInteractionPrefetchRecent||[]).filter(m=>c-Number(m||0)<wy);if(d.length>=Sy)return a.smartChartInteractionPrefetchRecent=d,!1;a.smartChartInteractionPrefetchAt=c,a.smartChartInteractionPrefetchRecent=[...d,c],a.smartChartInteractionPrefetchSeen={...u,[r]:c}}return Pl(fe(r,{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t}),{source:n.dataset.tokenTradeSource||n.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Zl(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Zl(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Zl(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const vp=new WeakMap;function Ww(e){let t=vp.get(e);if(!t){const n=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(n.overflowY),contained:/contain|none/.test(n.overscrollBehaviorY)},vp.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||a.route!=="terminal"||Fn())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const n=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const s=Ww(t);if(s.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,i=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(n<0&&c||n>0&&i)||s.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let o=e.deltaY;e.deltaMode===1?o*=40:e.deltaMode===2&&(o*=r.clientHeight),r.scrollTop+=o,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),Ld();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),lo();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),ul();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),Fl();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const g=c.closest(".nav-tool-group");a.navTekOpen=!g?.open,om(a.navTekOpen),g&&(g.open=a.navTekOpen);return}const i=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");if(!i)return;if(i.matches("[data-tool-section]")){e.preventDefault();const g=i.dataset.toolSection,[A]=g.split(":"),L=g.slice(A.length+1);a.toolSections={...a.toolSections||{},[A]:L};const B=i.closest("[data-tool-panels]");B&&(B.querySelectorAll(`[data-tool-section^="${A}:"]`).forEach(D=>{D.dataset.active=D.dataset.toolSection===g?"true":"false"}),B.querySelectorAll(`[data-tool-panel^="${A}:"]`).forEach(D=>{D.hidden=D.dataset.toolPanel!==g}),Ur(B));return}if(i.matches("[data-clip-record]")){e.preventDefault(),a.clipFarm?.recording?En():Bc();return}if(i.matches("[data-clip-share]")){e.preventDefault(),Pf();return}if(i.matches("[data-clip-download]")){e.preventDefault(),Af();return}if(i.matches("[data-clip-clear]")){e.preventDefault(),Hs();return}if(i.matches("[data-slimeshield-details]")){e.preventDefault(),i.closest("[data-dev-info-drawer-root]")&&Il(),lv(i.dataset.slimeshieldDetails||"");return}if(i.matches("[data-slimeshield-refresh]")){e.preventDefault(),Md(i.dataset.slimeshieldRefresh||"",{force:!0});return}if(i.matches("[data-kol-dump-details]")){e.preventDefault(),Fg(i.dataset.kolDumpDetails||"");return}if(i.matches("[data-kol-dump-refresh]")){e.preventDefault(),cl({force:!0});return}if(i.matches("[data-replay-open]")){e.preventDefault(),fv(i.dataset.replayOpen||"");return}if(i.matches("[data-replay-refresh]")){e.preventDefault(),El(i.dataset.replayRefresh||"",{force:!0});return}if(i.matches("[data-ogre-agent-toggle]")){a.ogreAgentOpen?Uo():(a.ogreAgentOpen=!0,Vf(),O({force:!0}));return}if(i.matches("[data-ogre-agent-close]")){Uo();return}if(i.matches("[data-ogre-agent-voice]")){fw(!a.ogreAgentVoiceEnabled);return}if(i.matches("[data-ogre-agent-send]")){Ut(),Ht();return}if(i.matches("[data-ogre-agent-mic]")){gw();return}if(i.matches("[data-ogre-agent-quick]")){const g=i.dataset.ogreAgentQuick||"";if(g==="positions"&&qt({type:"open_tab",tab:"positions"}),g==="refresh_feeds"&&qt({type:"refresh_feeds"}),g==="risk"&&Ht("Why is this token risky?"),g==="dev_info"&&Ht("Explain Dev Info for this token."),g==="protected_buy"&&Ht("Should I use Protected Buy?"),g==="replay"&&Ht("Replay similar launches for this token."),g==="auto_trade"&&qt({type:"approve_agent_auto_trade"}),g==="clear_chat"){Ut(),No(),a.ogreAgentMessages=[ep()],a.ogreAgentStatus="Chat cleared.",a.ogreAgentDraft="",a.ogreAgentLastTokenMint="";try{localStorage.removeItem(zl),localStorage.removeItem(jl)}catch{}O({force:!0})}return}if(i.matches("[data-ogre-agent-retry]")){const g=Number(i.dataset.ogreAgentRetry),A=String(a.ogreAgentMessages?.[g]?.retryText||"").trim();A&&Ht(A);return}if(i.matches("[data-ogre-agent-action]")){const g=i.dataset.ogreAgentAction,L=bw(g)||(a.ogreAgentMessages||[]).flatMap(B=>Array.isArray(B.actions)?B.actions:[]).find(B=>B.key===g||B.label===g||B.type===g);qt(L||{type:g});return}if(i.matches("[data-nav-route]")){e.preventDefault(),Me(i.dataset.navRoute||"/terminal",i.dataset.tab||null);return}if(i.matches("[data-policy]")){e.preventDefault(),window.alert(Mm(i.dataset.policy==="privacy"?"privacy":"terms"));return}if(i.matches("[data-top-wallet-connect]")){e.preventDefault(),i.dataset.walletState==="connected"||!!(a.user?.connectedWallet||a.connectedWalletBalance?.publicKey||a.wallets.length)?Me("/terminal","wallets"):ia({returnPath:"/terminal"});return}if(i.matches("[data-top-wallet-status]")){e.preventDefault(),await If();return}if(i.matches("[data-top-refresh-wallet]")){const g=C();Oa("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:"top-refresh-wallet"}),ut({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{Gg()&&z(()=>pl())}).catch(A=>$(A.message));return}if(i.matches("[data-ogre-tek-refresh]")){await nr({force:!0}).catch(g=>$(g.message));return}if(i.matches("[data-ogre-ai-start]")){z(()=>Mb());return}const u=i.closest?.("[data-ogre-cat]");if(u){e.preventDefault(),a.ogreAiCategory=u.dataset.ogreCat||"super_fresh",h({force:!0});return}if(i.closest?.("[data-autopilot-save]")){e.preventDefault(),z(()=>Rb());return}if(i.matches("[data-ogre-tek-market]")){a.ogreTek.selectedMarket=i.dataset.ogreTekMarket||a.ogreTek.selectedMarket,a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-side]")){a.ogreTek.direction=i.dataset.ogreTekSide==="short"?"short":"long",a.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-review]")){Wo(),a.ogreTek.reviewOpen=!0,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-close-review]")){a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-confirm-review]")){Wo();const g=Yd();!a.ogreTek.riskAccepted||!g.ok?a.ogreTek.status="Risk confirmation is incomplete.":we.demoMode?(a.ogreTek.status="Demo review confirmed. No live transaction was submitted.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1):(a.ogreTek.status="Live perps adapter is not wired in this build.",a.ogreTek.reviewOpen=!1,a.ogreTek.riskAccepted=!1),h({force:!0});return}if(i.matches("[data-ogre-tek-demo-action]")){const g=i.dataset.ogreTekDemoAction||"action";a.ogreTek.status=`Demo mode: ${g.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(i.matches("[data-toggle-terminal-ticket]")){a.terminalTradeCollapsed=!a.terminalTradeCollapsed,h({force:!0});return}if(i.matches("[data-global-token-open]")){const g=p("[data-global-token-search]")?.value?.trim()||"";g&&Hu(g);return}if(i.matches("[data-token-chart]")){e.preventDefault();const g=i.dataset.tokenChart||i.dataset.previewToken||"";ft(fe(i.dataset.tokenChart||i.dataset.previewToken||"",{source:i.dataset.tokenChartSource||"token-card"}),{defaultTab:i.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!i.closest?.(".live-pair-avatar"),source:i.dataset.tokenChartSource||"token-card"});return}if(i.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const g=i.dataset.tokenTrade||"",A=Xa(g);A&&fo(A)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),ft(fe(i.dataset.tokenTrade||"",{source:i.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:i.dataset.tokenTradeSource||"trade-button"});return}if(i.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),Ga(fe(i.dataset.quickBuyToken||"",{source:i.dataset.quickBuySource||"quick-buy-button"}),{source:i.dataset.quickBuySource||"quick-buy-button"});return}if(i.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),i.closest("[data-dev-info-drawer-root]")&&Il();const g=i.dataset.protectedBuySource||"protected-buy",A=!!i.closest("[data-quick-buy-modal-root]"),L=!!i.closest(".chart-trade-panel"),B=i.dataset.protectedBuyOpen||a.quickBuyModal?.tokenMint||a.smartChartToken||a.tradeToken||"";Ub(fe(B,{source:g}),{source:g,presetId:i.dataset.protectedBuyPreset||"",amountSol:A?p("[data-quick-buy-modal-amount]")?.value||a.quickBuyModal?.amountSol||"":L&&p("[data-chart-buy-amount]")?.value||"",walletIndex:A?p("[data-quick-buy-modal-wallet]")?.value||a.quickBuyModal?.walletIndex||"":L&&p("[data-chart-buy-wallet]")?.value||"",slippageBps:A?p("[data-quick-buy-modal-slippage]")?.value||a.quickBuyModal?.slippageBps||"400":L&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-quick-buy-close]")){e.preventDefault(),wl();return}if(i.matches("[data-protected-buy-close]")){e.preventDefault(),lo();return}if(i.matches("[data-protected-buy-confirm]")){e.preventDefault(),z(()=>Kb());return}if(i.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),a.quickBuyModal={...a.quickBuyModal,amountSol:i.dataset.quickBuyModalPreset||"",status:`${i.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(i.matches("[data-quick-buy-confirm]")){e.preventDefault(),z(()=>jb());return}if(i.matches("[data-preview-token]")){const g=i.dataset.previewToken||"";g&&ft(fe(g,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(i.matches("[data-terminal-subtab]")){a.terminalSubtab=i.dataset.terminalSubtab||"positions",h();return}if(i.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await uo(i.dataset.positionSell||"",i.dataset.positionSellPercent||"100",{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const g=await Te({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});g&&await uo(i.dataset.positionSellCustom||"",g,{slippageBps:a.activeTab==="smartChart"&&p("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-run-tx-audit]")){e.preventDefault(),z(()=>Gb());return}if(i.matches("[data-connect-login-toggle]")){yp(i)||Ui({connectPanel:!0,source:"connect-lock-in"});return}if(i.matches("[data-login-tab]")){a.loginModalTab=i.dataset.loginTab==="create"?"create":"login",h({force:!0}),Wi(!1);return}if(i.matches("[data-connect-password-login]")){await Yi();return}if(i.matches("[data-send-email-code]")){await zm();return}if(i.matches("[data-web-code-login]")){await jm();return}if(i.matches("[data-connect-create-account]")){await xs();return}if(i.matches("[data-connect-create-wallet]")){await Qm();return}if(i.matches("[data-web-signup]")&&await xs(),i.matches("[data-web-password-login]")&&await Yi(),i.matches("[data-close-login]")){_i();return}if(i.matches("[data-web-signup-connect]")){await Ym();return}if(i.matches("[data-open-login]")){yp(i)||Ui({connectPanel:a.route==="connect",source:"top-lock-in"});return}if(i.matches("[data-browse-guest]")){a.loginCollapsed=!0,a.route="terminal",a.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Ar("browse-terminal");return}if(i.matches("[data-logout]")&&await Zm(),i.matches("[data-connect-x]")&&await sb(),i.matches("[data-open-x-login]")&&lb(),i.matches("[data-clear-x]")&&await ib(),i.matches("[data-save-login-credentials]")&&await pb(),i.matches("[data-save-referral]")&&await ju(),i.matches("[data-generate-referral-code]")&&await ju({generate:!0}),i.matches("[data-save-trader-board]")&&await Zb(),i.matches("[data-use-x-avatar]")&&await db(),i.matches("[data-clear-avatar]")&&await Zr({clear:!0},"Removing PFP..."),i.matches("[data-preset-avatar]")){const g=p("[data-avatar-status]");v(g,"Loading preset PFP...");try{const A=await ub(i.dataset.presetAvatar);await Zr({avatarDataUrl:A,avatarSource:i.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(A){v(g,A.message),$(A.message)}}if(i.matches("[data-launch-coin-save]")){ll();return}if(i.matches("[data-launch-coin-submit]")){await xg();return}if(i.matches("[data-launch-coin-use-ca]")){await Mg();return}if(i.matches("[data-connect-wallet]")){const g=i.dataset.connectWallet||"solana";if(g&&g!=="solana"){await Tu(g,{returnPath:"/terminal"});return}ia({returnPath:"/terminal"});return}if(i.matches("[data-connect-wallet-provider]")){await Tu(i.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(i.matches("[data-wallet-connect-close]")){a.walletConnectMenuOpen=!1,h({force:!0});return}if(i.matches("[data-wallet-fast-approvals-toggle]")){dh(!a.walletFastApprovalsEnabled),$(a.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(i.matches("[data-disconnect-wallet]")){await Pu();return}if(i.matches("[data-share-x]")&&fl(i.dataset.shareText||""),i.matches("[data-share-watch-token-btn]")&&Au("token"),i.matches("[data-share-watch-kol-btn]")&&Au("kol"),i.matches("[data-save-preset]")){await Vu(i.dataset.savePreset);return}if(i.matches("[data-save-fast-preset]")){await Vu(i.dataset.saveFastPreset,"fast");return}if(i.matches("[data-use-preset]")){Yb(i.dataset.usePreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-preset]")){zu(i.dataset.editPreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-selected-preset]")){const g=i.dataset.editSelectedPreset==="bundle"?"bundle":"trade",A=g==="bundle"?a.selectedBundlePresetId:a.selectedTradePresetId;A&&A!=="custom"?zu(g,A):Wl(g);return}if(i.matches("[data-cancel-preset-edit]")){Nr(i.dataset.cancelPresetEdit,""),h();return}if(i.matches("[data-delete-preset]")){await Qb(i.dataset.deletePreset,i.dataset.presetId||"");return}if(i.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),Ga(fe(i.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(i.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),z(()=>Ku(i.dataset.quickBundleToken||""));return}if(i.matches("[data-smart-chart-token]")){ft(fe(i.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(i.matches("[data-smart-chart-view]")){const g=i.dataset.smartChartView||"chart";a.smartChartView=["chart","chartTxns","txns","info"].includes(g)?g:"chart",h();return}if(i.matches("[data-chart-trade-tab]")){a.chartTradeTab=i.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),a.chartTradeTab==="buy"&&requestAnimationFrame(()=>p("[data-chart-buy-amount]")?.focus());return}if(i.matches("[data-chart-buy-preset]")){const g=p("[data-chart-buy-amount]");g&&(g.value=i.dataset.chartBuyPreset||""),a.quickBuyAmountOverride=j(i.dataset.chartBuyPreset||""),Ao();return}if(i.matches("[data-chart-confirm-buy]")){const g=i.dataset.chartConfirmBuy||a.smartChartToken||"";e.preventDefault(),e.stopPropagation();const A=p("[data-chart-buy-wallet]")?.value||"";if(le(A)){try{i.dataset.actionState="clicked",i.disabled=!0,await zb(g)}catch(L){const B=W(L.message||"Chart buy failed."),D=j(p("[data-chart-buy-amount]")?.value||"")||"custom";q("trade-buy",g,String(D),{state:"error",error:B}),$e("trade-buy",g,String(D),4e3),Ie(B),$(B),oe()}return}Ie("Buy queued. Opening wallet approval..."),i.dataset.actionState="clicked",i.disabled=!0,z(async()=>{try{const L=Fu();await io({tokenMint:g,walletIndex:A,amountSol:j(p("[data-chart-buy-amount]")?.value||""),slippageBps:p("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:L.takeProfitPct,stopLossPct:L.stopLossPct,sellDelay:L.sellDelay,sellPercent:L.sellPercent,source:"chart-buy-panel"}),a.chartTradeTab="buy",Ie("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(L){const B=W(L.message||"Chart buy failed.");Ie(B),$(B),h({force:!0,preserveSmartChartFrame:!0})}});return}if(i.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const g=p("[data-chart-sell-percent]")?.value||"";if(g)try{await uo(i.dataset.chartConfirmSell||"",g,{slippageBps:p("[data-chart-buy-slippage]")?.value||"400"})}catch(A){const L=W(A.message||"Chart sell failed.");Ie(L),$(L)}return}if(i.matches("[data-smart-chart-open]")){const g=String(p("[data-smart-chart-input]")?.value||"").trim();if(!g){$("Paste a token CA first.");return}ft(fe(g,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(i.matches("[data-refresh-feeds]")){z(()=>Na({force:!0,reason:"manual-refresh-feeds"}));return}if(i.matches("[data-terminal-load-more]")){const g=i.dataset.terminalLoadMore||a.activeTab;nf(g,Lt(g)),uc(g,{requestId:K(g).lastRequestId||"",status:K(g).lastStatus||"render",reason:"load-more",resultCount:Lt(g),renderedCount:Pn(g),hasMore:Lt(g)>Pn(g),stale:An(g),errorCode:K(g).errorCode||"",errorMessage:K(g).errorMessage||""}),h({force:!0});return}if(i.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),uv(i.dataset.devInfo||"");return}if(i.matches("[data-dev-info-close]")){Il();return}if(i.matches("[data-dev-info-refresh]")){const g=i.dataset.devInfoRefresh||a.devInfoDetails?.tokenMint||"";await Id(g,{force:!0});return}if(i.matches("[data-watch-token]")&&await Gu("add",i),i.matches("[data-unwatch-token]")&&await Gu("remove",i),i.matches("[data-pnl-card]"))try{await Lu(i.dataset.pnlCard)}catch(g){$(g.message)}if(i.matches("[data-share-pnl-card]")&&await mb(i.dataset.sharePnlCard,i.dataset.shareText||""),i.matches("[data-scan-bags]")){await fy();return}if(i.matches("[data-dev-watch]")){await my(i.dataset.devWatch);return}if(i.matches("[data-hype-create]")){await vg();return}if(i.matches("[data-push-enable]")){await th();return}if(i.matches("[data-push-disable]")){await ah();return}if(i.matches("[data-call-post]")){await kv(i.dataset.callPost);return}if(i.matches("[data-telegram-link]")){await Zf();return}if(i.matches("[data-trade-trace-close]")){a.tradeTrace=null,Ko();return}if(i.matches("[data-launch-kit-close]")){a.launchShareKit=null,h();return}if(i.matches("[data-create-wallets]")&&await ku(),i.matches("[data-distribute-fresh]")){await ag();return}if(i.matches("[data-return-funds]")){await tg();return}if(i.matches("[data-sweep-background-wallets]")){await oy();return}if(i.matches("[data-create-automation-wallet]")&&await Hg(),i.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await zg(i);return}if(i.matches("[data-tpsl-status-button]")){i.dataset.tpslState==="enabled"?(a.activeTab="profile",Me("/terminal","profile"),a.automationDelegationStatus=a.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await dl("enable");return}if(i.matches("[data-automation-permission]")&&await dl(i.dataset.automationPermission||"enable"),i.matches("[data-run-trade-plans]")&&await pl(),i.matches("[data-restore-backup]")&&await Yg(),i.matches("[data-export-backup]")&&await Qg(),i.matches("[data-import-wallet]")&&await Zg(),i.matches("[data-remove-wallet]")&&await eb(i.dataset.removeWallet||"",i.dataset.walletLabel||"",i.dataset.removeWalletKey||""),i.matches("[data-wallet-sweep-action]")&&await rb(i.dataset.walletSweepAction||""),i.matches("[data-download]")){const g=a.downloads?.[i.dataset.download];g&&pe(g.filename,g.text)}if(i.matches("[data-trade-buy-quick]")&&await ao(i.dataset.tradeBuyQuick),i.closest?.("[data-swap-reverse]")){a.swapDirection=a.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(i.matches("[data-swap-use-custom-amount]")){const g=String(p("[data-swap-amount]")?.value||"").trim();a.swapDirection==="sell"?await gl(g||"100"):await ao(g);return}i.matches("[data-trade-buy-max]")&&await ao(null,"max"),i.matches("[data-trade-buy-custom]")&&await ao(p("[data-buy-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-sell-quick]")&&await gl(i.dataset.tradeSellQuick),i.matches("[data-trade-sell-custom]")&&await gl(p("[data-sell-custom]")?.value||p("[data-swap-amount]")?.value),i.matches("[data-trade-plan-start]")&&await $b(),i.matches("[data-volume-start]")&&await Pb();const d=i.closest?.("[data-vbot-set-mode]");if(d){e.preventDefault(),a.slimeBotMode=d.dataset.vbotSetMode||"smart",d.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(g=>{g.dataset.active=String(g===d)});return}const m=i.closest?.("[data-vbot-set-aggr]");if(m){e.preventDefault(),a.slimeBotAggr=m.dataset.vbotSetAggr||"med",m.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(g=>{g.dataset.active=String(g===m)});return}const f=i.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),a.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(g=>{g.dataset.active=String(g===f)});return}if(i.matches("[data-vbot-start]")){e.preventDefault(),await cg();return}const b=i.closest?.("[data-vbot-stop]");if(b){e.preventDefault(),await ug(b.dataset.vbotStop||"");return}if(i.matches("[data-sniper-buy]")&&await Cb(i.dataset.sniperBuy),i.matches("[data-kol-mode]")){a.kolWallet="",a.kolMode=i.dataset.kolMode||a.kolMode,J("kol"),await Y("kol",{force:!0,reason:"kol-mode-switch"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-refresh]")){await Y("kol",{force:!0,reason:"manual-kol-refresh"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-wallet-scan]")){if(a.kolWallet=String(p("[data-kol-wallet]")?.value||"").trim(),a.kolWallet&&!Rt(a.kolWallet)){Et("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),a.kolWallet="";return}J("kol"),await Y("kol",{force:!0,reason:"kol-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-scan-wallet]")){if(a.kolWallet=String(i.dataset.kolScanWallet||"").trim(),a.kolWallet&&!Rt(a.kolWallet)){Et("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),a.kolWallet="";return}J("kol"),await Y("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-copy-setup]")){const g=String(i.dataset.kolCopySetup||"").trim();if(g&&!Rt(g)){Et("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}g&&(a.kolWallet=g),a.activeTab="kol",h(),setTimeout(()=>{const A=document.querySelector("[data-kol-management-settings]");A&&(A.open=!0,A.scrollIntoView({behavior:"smooth",block:"start"}));const L=p("[data-kol-wallet]");L&&g&&(L.value=g);const B=p("[data-kol-status]");B&&v(B,`Copy setup loaded for ${w(g)}. Choose presets, then tap Copy Wallet Next Buy.`),p("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(i.matches("[data-kol-copy]")){await Eb(i.dataset.kolCopy);return}if(i.matches("[data-kol-copy-wallet]")){const g=String(i.dataset.kolCopyWallet||"").trim();if(g&&!Rt(g)){Et("That KOL entry does not have a verified Solana wallet yet.");return}await Fb(i.dataset.kolCopyWallet||"");return}if(i.matches("[data-kol-trade]")){a.tradeToken=i.dataset.kolTrade||"",a.activeTab="trade",h();return}if(i.matches("[data-kol-bundle]")){a.bundleToken=i.dataset.kolBundle||"",a.activeTab="bundle",h();return}if(i.matches("[data-bundle-buy]")&&await Du("buy"),i.matches("[data-bundle-sell]")&&await Du("sell"),i.matches("[data-bundle-plan]")&&await _b(),i.matches("[data-launch-start]")&&await ty(),i.matches("[data-launch-cancel]")&&await ay(i.dataset.launchCancel),i.matches("[data-use-token]")&&(a.tradeToken=i.dataset.useToken||"",a.volumeToken=i.dataset.useToken||"",a.bundleToken=i.dataset.useToken||"",a.activeTab="trade",h()),i.matches("[data-use-token-bundle]")&&(a.bundleToken=i.dataset.useTokenBundle||"",a.tradeToken=a.bundleToken,a.volumeToken=a.bundleToken,a.activeTab="bundle",h()),i.matches("[data-use-token-volume]")&&(a.volumeToken=i.dataset.useTokenVolume||"",a.tradeToken=a.volumeToken,a.bundleToken=a.volumeToken,a.activeTab="volume",h()),i.matches("[data-refresh-all]")){const g=C();if(Oa("clicked",{startedAt:g}),E({component:"ui-action",action:"position-refresh-click-to-state",durationMs:C()-g,details:a.activeTab||"terminal"}),!a.user||!a.token)qe(a.activeTab)?await Y(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(A=>$(A.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),De("success");else{const A=C();a.activeTab==="positions"?af({force:!0,reason:"manual-positions-refresh"}).catch(L=>{De("error",{error:W(L?.message||"Position refresh failed")}),$(L.message),h()}):(ut({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(L=>$(L.message)),Y(a.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(L=>$(L.message))),U("position-refresh-request-start",A,{component:"positions",cacheHit:!1,details:a.activeTab||"terminal"})}}if(i.matches("[data-tab]")){const g=C();if(a.activeTab=i.dataset.tab,a.activeTab==="volume"&&Hr(),a.activeTab==="ogreAi"&&xb(),a.activeTab==="ogreTek"){a.route="terminal",window.history.pushState({},"","/ogre-tek"),await nr({silent:!0}).catch(B=>$(B.message)),h();return}a.route!=="terminal"&&(a.route="terminal",window.history.pushState({},"","/terminal")),a.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):a.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const A=cc(a.activeTab);h();const L=Y(a.activeTab,{silent:!0,ifStale:!0,force:!A,reason:"tab-switch"}).catch(B=>$(B.message));A||await L,U("tab-switch",g,{component:"terminal",cacheHit:A,details:a.activeTab})}if(i.matches("[data-refresh-scan]")&&z(()=>Y("sniper",{force:!0,reason:"manual-sniper-refresh"})),i.closest?.("[data-refresh-live-pairs]")){const g=a.activeTab==="slimeScope"?"slimeScope":a.activeTab==="terminal"?"terminal":a.activeTab==="launch"||a.activeTab==="launchCoin"?"launch":"live",L=a.activeTab==="live"||a.activeTab==="terminal"?null:zs();z(async()=>{await Y(g,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),L&&js(L)})}if(i.closest?.("[data-terminal-filter-toggle]")){const g=Ae();g.open=!g.open,h();return}if(i.closest?.("[data-terminal-filter-clear]")){a.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},J("live"),J("launch"),J("sniper"),h();return}i.matches("[data-refresh-watchlist]")&&z(()=>Y("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const S=i.closest?.("[data-live-pair-bucket]");S&&(a.livePairBucket=S.dataset.livePairBucket||"live",a.livePairs=Fe(),a.livePairsLastUpdatedAt=sa(),J("live"),J("slimeScope"),h(),z(()=>Y(a.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=i.closest?.("[data-slime-scope-mode]");P&&(a.slimeScopeMode=P.dataset.slimeScopeMode||"new",a.activeTab="slimeScope",J("slimeScope"),h(),z(()=>Y("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),i.matches("[data-scan-mode]")&&(J("sniper"),a.scanMode=i.dataset.scanMode||a.scanMode,h(),z(()=>Mn(a.scanMode)));const T=i.getAttribute("data-copy");if(T){const g=i.getAttribute("data-copy-label")||i.textContent||"Copy";await navigator.clipboard.writeText(T),v(i,"Copied"),setTimeout(()=>{v(i,g)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(a.replayDetails?.open){Fl();return}if(a.kolDumpDetails?.open){ul();return}if(a.protectedBuyModal?.open){lo();return}if(a.quickBuyModal?.open){wl();return}if(a.walletConnectMenuOpen){a.walletConnectMenuOpen=!1,h({force:!0});return}a.loginCollapsed||(a.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const n=document.querySelector("[data-vbot-manual-wallets]");n&&(n.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(a.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(a.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const n=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(o=>{o.style.display=n?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=n||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(Ur(),Qh(t)),t?.matches?.("[data-swap-from]")){const n=Be(t.value||"SOL")||"SOL";a.tradeSwapFrom=n,n!=="SOL"?(a.tradeToken=n,a.tradeSwapTo="SOL"):Be(a.tradeSwapTo||a.tradeToken||"")||(a.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const n=Be(t.value||"");if(a.tradeSwapTo=n,n&&n!=="SOL"){a.tradeToken=n,a.swapDirection="buy";const r=p("[data-trade-token]");r&&(r.value=n)}n||p("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){a.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const n=t.value||"";if(n==="custom"){Wl("trade");return}if(a.selectedTradePresetId=n,a.fastTradePresetStatus=a.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=ae("trade",a.selectedTradePresetId);a.chartBuyWalletIndex="",r?.amountSol&&(a.quickBuyAmountOverride=j(r.amountSol)),a.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(a.quickBuyAmountOverride=j(t.value),t.value=a.quickBuyAmountOverride,Ao()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(a.protectedBuyModal={...a.protectedBuyModal||{},presetId:p("[data-protected-buy-preset]")?.value||a.protectedBuyModal?.presetId||"conservative",walletIndex:p("[data-protected-buy-wallet]")?.value||a.protectedBuyModal?.walletIndex||"",amountSol:j(p("[data-protected-buy-amount]")?.value||a.protectedBuyModal?.amountSol||""),slippageBps:p("[data-protected-buy-slippage]")?.value||a.protectedBuyModal?.slippageBps||"400",riskAccepted:!!p("[data-protected-buy-risk-accept]")?.checked},Sl()),t?.matches?.("[data-fast-bundle-preset]")){const n=t.value||"";if(n==="custom"){Wl("bundle");return}a.selectedBundlePresetId=n,a.fastBundlePresetStatus=a.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(a.terminalSort=t.value||"best",J("live"),J("slimeScope"),h(),z(()=>Mt({silent:!0,force:!0}))),t?.matches?.("[data-live-feed-category]")){a.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",a.liveFeedCategory)}catch{}a.terminalSort=qd()[3]||"best",J("live"),h(),z(()=>Mt({silent:!0,force:!0}))}if(t?.matches?.("[data-live-terminal-category]")){a.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",a.liveTerminalCategory)}catch{}J("live"),h(),z(()=>Mt({silent:!0,force:!0}))}if(t?.matches?.("[data-cook-spot-category]")){a.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",a.cookSpotCategory)}catch{}J("slimeScope"),h(),z(()=>Y("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const n=t.files?.[0],r=p("[data-launch-image-preview-wrap]"),o=p("[data-launch-image-preview]"),s=p("[data-launch-image-preview-meta]");if(!n){r&&(r.hidden=!0);return}const c=Math.round(n.size/1024);s&&(s.textContent=`${n.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`}`);try{const i=URL.createObjectURL(n);o&&(o.onload=()=>URL.revokeObjectURL(i),o.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const n=Ae(),r=t.getAttribute("data-terminal-filter-social"),o=t.getAttribute("data-terminal-filter-quote"),s=t.getAttribute("data-terminal-filter-audit");r&&(n.socials[r]=!!t.checked),o&&(n.quotes[o]=!!t.checked),s&&(n.audits[s]=!!t.checked),n.open=!0,J("live"),J("launch"),J("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(Wo(),a.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(a.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await ob(t),t?.matches?.("[data-avatar-file]")&&await cb(t)}),document.addEventListener("focusout",()=>{setTimeout(Sc,50)}),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){a.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),Ao();return}if(t?.matches?.("[data-trade-token]")){const n=String(t.value||"").trim();a.tradeToken=n,a.tradeSwapTo=n;return}if(t?.matches?.("[data-terminal-filter-field]")){const n=t.getAttribute("data-terminal-filter-field"),r=Ae();(n==="keywords"||n==="excludeKeywords")&&(r[n]=String(t.value||""),r.open=!0,gd());return}if(t?.matches?.("[data-launch-ticker]")){const n=Ae();n.keywords=String(t.value||""),n.open=!0,gd();return}if(t?.matches?.("[data-smart-chart-zoom]")){a.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const n=t.closest(".smart-chart-zoom")?.querySelector("strong");n&&v(n,`${a.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(a.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(Wo(),t.type==="range"&&h({force:!0}))});function rr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",n=$c(t,{forcePaint:!0});Sc(),!n&&e?.persisted&&a.route==="terminal"&&h({force:!0,preserveSmartChartFrame:a.activeTab==="smartChart"}),Zt&&window.clearTimeout(Zt),Zt=window.setTimeout(()=>{if(Zt=null,!(document.hidden||a.route!=="terminal")){if(Bn()){E({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:a.postTradeRefresh?.attemptId||"",details:a.activeTab||"terminal"});return}Y(a.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),a.user&&a.token&&An("positions")&&Ct({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:Jo}).catch(()=>{}),la(),Ln(),xr(),Es()}},pi)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(a.ogreAgentListening||a.ogreAgentSpeechRecognizer)&&Ut("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(a.ogreAgentOpen&&(a.ogreAgentListening||a.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!a.ogreAgentListening&&!a.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&rr()},pi+900);return}rr()}),window.addEventListener("focus",rr),window.addEventListener("pageshow",rr),window.addEventListener("online",rr),window.addEventListener("pagehide",()=>{Zt&&(window.clearTimeout(Zt),Zt=null),a.clipFarm?.recording&&En()});function _w(){ms&&window.clearInterval(ms),ms=window.setInterval(()=>{document.hidden||$c("watchdog")},Vp)}const Nw=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Chart & Swap",items:[["smartChart","Smart Chart"],["trade","Slime Swap"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}],Dw={terminal:"📡",live:"🍳",liveTrades:"⚡",smartChart:"📈",trade:"🔄",slimeScope:"🔭",watchlist:"⭐",kol:"👑",sniper:"🎯",txAudit:"🧾",tek:"🧰",ogreAi:"🤖",launchCoin:"🚀",bundle:"📦",volume:"🌀",launch:"👀",wallets:"👛",positions:"💼",pnl:"📊",profile:"🐸"},Uw={live:"📡",chart:"📈",intel:"🔭",tools:"🧰",portfolio:"💼",profile:"🐸"};function qw(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas"),t.innerHTML=Nw.map(n=>`
    <div class="nav-drop-group" data-nav-drop-group="${l(n.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${Uw[n.key]||"•"}</span>
        <span class="nav-side-label">${l(n.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${n.items.map(([r,o])=>`
          <button type="button" data-tab="${l(r)}" title="${l(o)}">
            <span class="nav-side-icon" aria-hidden="true">${Dw[r]||"•"}</span>
            <span class="nav-side-label">${l(o)}</span>
          </button>`).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",n=>{const r=n.target.closest(".nav-side-group-toggle");if(r){const o=r.parentElement,s=o.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(c=>c.setAttribute("aria-expanded","false")),s||(o.classList.add("is-open"),r.setAttribute("aria-expanded","true"));return}n.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))}),document.addEventListener("click",n=>{n.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(r=>r.classList.remove("is-open"))})}function Hw(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(n=>{const r=!!n.querySelector(`[data-tab="${a.activeTab}"]`);n.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),n.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(n=>{n.dataset.active=n.dataset.tab===a.activeTab?"true":"false"})}function Kw(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const o=((await fetch("/?build-check=1",{cache:"no-store"}).then(s=>s.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";o&&!e.includes(o)&&Vw()}catch{}},300*1e3).unref?.()}function Vw(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function zw(){qw(),Kw(),km(),Lm(),Cm(),bs(),Am(),a.route==="intro"?Tm():pn({reset:!0}),nh(),_w(),ys(),vl(),await Jm(),h(),await ef(),gb(),a.route==="terminal"&&(Na({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),a.activeTab==="ogreTek"&&await nr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:a.activeTab==="smartChart"}))}zw();function vt(e){a.pumpLiveStatus=e,a.pumpLiveLastActionAt=Date.now(),h()}function jw(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():a.launchCoinDraft||{},t=mu(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function Gw(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const n=t.getAttribute("data-pump-live-action"),r=jw(),o=r.tokenMint;if(!o){vt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(n==="chart"){typeof ft=="function"?(ft(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),vt("Opened Pump chart with transactions inside Slime.")):vt("Chart panel is still loading. Try again in a moment.");return}if(n==="copy"){const s=fu(o);navigator.clipboard?.writeText(s).then(()=>vt("Copied Pump Live stream route ID."),()=>vt("Stream route ID ready: "+s));return}if(n==="obs"){const s=sl()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";vt(s);return}if(n==="end"){vt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(n==="go"){if(!sl()){vt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}vt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",Gw);function Kt(e){const t=String(e??"");return typeof l=="function"?l(t):t.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function ei(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:a.smartChartToken||{}}function ti(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function Xw(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function Vo(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function wp(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const n of t){const r=Vo(n);if(Number.isFinite(r)&&r>0)return r}return NaN}function Jw(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const n=Number(t);if(Number.isFinite(n))return n<1e11?n*1e3:n;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function Yw(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function Qw(e,t,n){if(!n.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(o=>String(o||"").toLowerCase()).join(" ");return n.some(o=>r.includes(o))}function Zw(e=""){return String(e||"").split("").reduce((t,n)=>t*31+n.charCodeAt(0)>>>0,17)}function eS(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map(Vo).filter(o=>Number.isFinite(o)&&o>0);if(t.length)return t[0];const n=typeof Wt=="function"?Number(Wt(e)):NaN;if(Number.isFinite(n)&&n>0)return Math.max(1,n*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function BS(e){const t=ei(e),n=ti(t)||t.symbol||t.name||"slime",r=eS(t),o=Zw(n),s=Math.max(1,Vo(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,Vo(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),i=typeof Wt=="function"?Math.max(0,Math.min(100,Number(Wt(t))||0)):0,u=Math.max(-8,Math.min(18,c/s*18+i/12)),d=Date.now();return Array.from({length:34},(m,f)=>{const b=(f+o%13)/4.2,y=Math.sin(b)*(3.5+o%7*.28),S=(f/33-.5)*u,P=((o>>f%11&7)-3)*.32,T=Math.max(1e-7,r*(1+(y+S+P)/100));return{row:{...t,snapshotFallback:!0},value:T,time:d-(33-f)*15e3,side:"snapshot"}})}function Sp(e){const t=ei(e),n=[ti(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,i,u)=>c.length>=3&&u.indexOf(c)===i),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:a.liveTrades},{direct:!1,rows:a.liveTradeRows},{direct:!1,rows:a.tradeTape},{direct:!1,rows:a.recentTrades},{direct:!1,rows:a.pumpTrades},{direct:!1,rows:a.pumpActivity},{direct:!1,rows:a.livePairs},{direct:!1,rows:a.livePairsRows},{direct:!1,rows:a.freshPairs},{direct:!1,rows:a.slimeScopePairs}],o=[];for(const c of r){const i=Yw(c.rows).slice(-350);for(const u of i){if(!u||typeof u!="object"||!c.direct&&!Qw(u,t,n))continue;const d=wp(u);if(!Number.isFinite(d)||d<=0)continue;const m=String(u.side||u.type||u.action||u.tradeType||"").toLowerCase();o.push({row:u,value:d,time:Jw(u),side:m.includes("sell")?"sell":m.includes("buy")?"buy":"trade"})}}const s=wp(t);return Number.isFinite(s)&&s>0&&o.push({row:t,value:s,time:Date.now(),side:"snapshot"}),o.sort((c,i)=>c.time-i.time).filter((c,i,u)=>i===0||c.time!==u[i-1].time||c.value!==u[i-1].value).slice(-120)}function zo(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function tS(){const e=String(a.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function aS(e={},t={}){const n=ei(e),r=ti(n),o=tS(),s=String(a.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(a.pumpChartTimeframe||"5m"),u=Sp(n).slice(-70),d=!u.length||u.every(N=>N.side==="snapshot"||N.row?.snapshotFallback),m=u.map(N=>N.value),f=m.length?Math.min(...m):NaN,b=m.length?Math.max(...m):NaN,y=720,S=260,P=22,T=Number.isFinite(b-f)&&b!==f?b-f:1,g=N=>u.length<=1?y/2:P+N/(u.length-1)*(y-P*2),A=N=>S-P-(N-(Number.isFinite(f)?f:0))/T*(S-P*2),L=u.map((N,Oe)=>`${Oe?"L":"M"}${g(Oe).toFixed(1)},${A(N.value).toFixed(1)}`).join(" "),B=u.length>1?`${L} L${g(u.length-1).toFixed(1)},${S-P} L${g(0).toFixed(1)},${S-P} Z`:"",D=Math.max(4,Math.min(12,(y-P*2)/Math.max(u.length*2,1))),ne=u.map((N,Oe)=>{const wt=(u[Math.max(0,Oe-1)]||N).value,ce=N.value,jo=Math.max(wt,ce),Go=Math.min(wt,ce),sn=g(Oe),ai=A(wt),ni=A(ce),$p=A(jo),Tp=A(Go);return`<g class="slime-pump-candle ${ce>=wt?"up":"down"}"><line x1="${sn.toFixed(1)}" y1="${$p.toFixed(1)}" x2="${sn.toFixed(1)}" y2="${Tp.toFixed(1)}" /><rect x="${(sn-D/2).toFixed(1)}" y="${Math.min(ai,ni).toFixed(1)}" width="${D.toFixed(1)}" height="${Math.max(2,Math.abs(ni-ai)).toFixed(1)}" rx="2" /></g>`}).join(""),ve=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",Je=o==="dex"&&ve?`<iframe class="slime-pump-dex-frame" src="${Kt(ve)}" title="Dex chart" loading="lazy"></iframe>`:u.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${y} ${S}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${B}" />${s==="candles"?ne:`<path class="slime-pump-line" d="${L}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${o==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(N=>`<button type="button" class="${o===N?"active":""}" data-slime-pump-source="${N}">${N==="slime"?"Slime":N==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${s==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${s==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(N=>`<button type="button" class="${c===N?"active":""}" data-slime-pump-time="${N}">${N}</button>`).join("")}
          ${d?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${Je}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Kt(zo(m[m.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Kt(Number.isFinite(f)&&Number.isFinite(b)?`${zo(f)} - ${zo(b)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Kt(d?"Slime snapshot":o==="slime"?"Slime default":o==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function nS(e={}){const t=Sp(e).slice(-40).reverse(),n=t.map(r=>{const o=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),s=o<60?`${o}s`:`${Math.floor(o/60)}m`,c=r.row||{},i=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Kt(s)}</span><strong>${Kt(r.side)}</strong><span>${Kt(zo(r.value))}</span><span>${Kt(Xw(i))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${n||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function kp(){a.slimePumpChartRendering||(a.slimePumpChartRendering=!0,requestAnimationFrame(()=>{a.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),n=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||n||r)&&(e.preventDefault(),e.stopPropagation(),t&&(a.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),n&&(a.pumpChartMode=n.getAttribute("data-slime-pump-mode")||"line"),r&&(a.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),kp())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&kp()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||a.activeTab!=="volume"||!(a.volumeBots||[]).some(t=>t.status!=="completed")||Hr()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const n=document.querySelector("[data-vbot-invest-num]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const n=document.querySelector("[data-vbot-invest]");n&&(n.value=t.value)}else if(t.matches("[data-vbot-duration]")){const n=document.querySelector("[data-vbot-duration-label]");if(n){const r=Number(t.value);n.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const n=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function o(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function s(){return!!(a?.route==="terminal"&&n.has(String(a.activeTab||"terminal"))&&!document.hidden)}function c(){let m=0;const f=b=>{if(b){if(Array.isArray(b)){m+=b.length;return}if(Array.isArray(b.rows)){m+=b.rows.length;return}Array.isArray(b.data?.rows)&&(m+=b.data.rows.length)}};return f(a.livePairRows),f(a.slimeScopeRows),f(a.liveTradeRows),f(a.livePairs),Object.values(a.livePairsByBucket||{}).forEach(f),Object.values(a.terminalFeeds||{}).forEach(f),m}function i(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function u(){const m=[a.livePairsLastUpdatedAt,a.livePairsLastUpdatedByBucket?.[a.livePairBucket||"live"],a.terminalFeeds?.[a.activeTab||"terminal"]?.updatedAt,a.terminalFeeds?.[a.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return m.length?Date.now()-Math.max(...m)>3e4:!1}function d(m="empty-feed-watchdog"){if(!s()||o())return;const f=Date.now();if(f-t<cn)return;const b=c()===0&&!i();if(!b&&!u())return;t=f;const y=()=>typeof Na=="function"?Na({force:b,reason:m}):typeof Y=="function"?Y(a.activeTab||"terminal",{force:b,reason:m}):null;try{typeof z=="function"?z(y):Promise.resolve(y()).catch(()=>{})}catch{}}window.setInterval(()=>d("empty-feed-watchdog-interval"),cn),window.addEventListener("pageshow",()=>window.setTimeout(()=>d("pageshow-empty-feed-watchdog"),cn)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>d("visible-empty-feed-watchdog"),cn)})})();
