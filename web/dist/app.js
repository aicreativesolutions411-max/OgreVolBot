import{canSubmitPerpOrder as Rm,createPerpsProvider as Im,ogreTekRouteStatus as Om,resolveOgreTekConfig as Em,shouldShowOgreTekNav as Fm,validatePerpOrder as Wm}from"./perps.js";import{smartChartSuggestion as _m,tradeActionLabelFromPreset as Dm}from"./liveTerminalUi.js";const Ra=window.OGRE_PORTAL_CONFIG||{},Nm=Ra.featureFlags||{};function N(e,t=!0){const a=Nm?.[e];return a==null||a===""?!!t:typeof a=="boolean"?a:["1","true","yes","on"].includes(String(a).toLowerCase())}const Yt=Ra.pumpLive||{},Ae=Em(Ra),Um=!1,Ir=Im(Ae),qm=String(Ra.apiBase||"").trim().replace(/\/+$/,""),Hm=window.location.origin.replace(/\/+$/,""),Vl="https://ogrevolbot.onrender.com",Rt=String(Ra.shareUrl||Ra.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",zl=[qm,window.location.hostname.endsWith("onrender.com")?Hm:"",Vl].filter(Boolean);let Ia=zl[0]||Vl;const Ln=6e4,Bo=15e3,Qt=1e4,Ro=8e3,xn=8e3,Io=new Map,Km=new Map,vt=Km,Zt=new Set,Or=new Map,u0=new Map,Mn={},ae=18e4,Oo="slimewireMobileWalletPending",Eo="slimewireMobileWalletPendingBackup",Vm="slimewireMobileWalletSession:",jl="slimewirePerfLog",Gl="slimewireCrashLog",zm="slimewireTerminalFeedLog",Xl="slimewireOgreAiRecentMints",Jl="slimewireOgreAiFormPreset",jm=150,Gm=1500,Xm=1e4,Jm=140,Yl="live-pairs-inflight",Ym=[1200,4500,1e4],Qm=15e3,Ql=650,Zm=3500,ef=12e3,tf=3e4,af=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Zl="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",nf=new Map([...Zl].map((e,t)=>[e,t]));function rf(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function Bn(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function Fo(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function ec(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function tc(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function Wo(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function sf(){try{const e=JSON.parse(window.localStorage?.getItem(jl)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function of(){try{const e=JSON.parse(window.localStorage?.getItem(Gl)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function ac(){try{const e=JSON.parse(window.sessionStorage?.getItem(Xl)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function lf(e){const t=[...Array.isArray(e?.plans)?e.plans.map(s=>s?.tokenMint||s?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(s=>s?.tokenMint):[]].map(s=>String(s||"").trim()).filter(Boolean);if(!t.length)return;const a=new Set,r=[...ac(),...t].filter(s=>a.has(s)?!1:(a.add(s),!0)).slice(-30);try{window.sessionStorage?.setItem(Xl,JSON.stringify(r))}catch{}}function nc(){try{const e=JSON.parse(window.sessionStorage?.getItem(Jl)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function cf(e={}){try{window.sessionStorage?.setItem(Jl,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function rc(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),a=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(a||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function df(){let e={};try{e=JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{e={}}try{const t=new URLSearchParams(window.location.search);if(t.has("lc_n")||t.has("lc_s")){const a={lc_n:"name",lc_s:"symbol",lc_d:"description",lc_x:"x",lc_tg:"telegram",lc_web:"website"};for(const s in a){const o=t.get(s);o&&(e[a[s]]=s==="lc_s"?o.toUpperCase().slice(0,12):o)}const r=t.get("lc_dev");r&&Number(r)>0&&(e.devBuySol=String(r),e.devBuyEnabled=!0);try{Oa(e)}catch{}try{window.history.replaceState(null,"",window.location.pathname+window.location.hash)}catch{}}}catch{}return e}function Oa(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,String(t.bannerDataUrl||"").length>=15e5&&delete t.bannerDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function uf(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function pf(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function mf(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const sc="slimewireIntroCompleteV1";function oc(){try{return window.sessionStorage?.getItem(sc)==="true"}catch{return!1}}function ff(){try{window.sessionStorage?.setItem(sc,"true")}catch{}}function Rn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}(()=>{try{if(localStorage.getItem("liveTerminalFreshV1"))return;localStorage.setItem("liveTerminalFreshV1","1");const e=localStorage.getItem("liveTerminalCategory");(!e||e==="dexTrending")&&localStorage.setItem("liveTerminalCategory","fresh")}catch{}})();const n={token:rf(),user:null,route:ja(window.location.pathname),activeTab:window.location.pathname.includes("/launch-coin")||/[?&]lc_n=/i.test(window.location.search)?"launchCoin":window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"newest",terminalCat:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"fresh"}catch{return"fresh"}})(),liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"fresh"}catch{return"fresh"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"fresh"}catch{return"fresh"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:sf(),crashLog:of(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:df(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:uf(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:ec(),loginCollapsed:!0};let Ea=null,Er="";const Fr=new Set;let Fa=null,Wr="",Wa=null,_r="",ea=null,_a=null,st=0,Da=null,Dr="",Na=null,Nr="",Ur=null,It=[],qr=null,Hr=null,Kr=!1,In=[],_o=null,ta=null,aa=null,On=null,Do="",ic=0,hf=0,No=0,Vr=null,Ua=!1;const na=new Map,En={},ra=new Map,qa=[];let Uo=null,qo=null,Ho=null,Ko=null,Vo=null,zo=0,jo=new Set,Go=null,sa=null,zr=null,Xo=null,lc=Date.now();function Ha(){return!!(n.slimeShieldDetails?.open||n.devInfoDetails?.open||n.kolDumpDetails?.open||n.replayDetails?.open)}function Ka(){Ea&&clearTimeout(Ea),Ea=null,Er=""}function jr(){Ha()||(pa(),Va("details-close"))}function gf(e,t){const a=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const i=a(c);i&&!r.has(i)&&r.set(i,c)}let s=e.querySelector(":scope > .signal-header")||null;const o=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const i=a(c);let d=i?r.get(i):null;d?(o.add(i),d.className!==c.className&&(d.className=c.className),d.innerHTML!==c.innerHTML&&(d.innerHTML=c.innerHTML)):d=c,s?s.nextElementSibling!==d&&s.after(d):e.firstElementChild!==d&&e.insertBefore(d,e.firstElementChild),s=d}for(const[c,i]of r)o.has(c)||i.remove()}function bf(e,t){const a=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!a?e.insertBefore(r,e.firstChild):a&&!r?a.remove():a&&r&&a.innerHTML!==r.innerHTML&&(a.innerHTML=r.innerHTML);for(const s of["[data-cooks-best]","[data-cooks-newest]"]){const o=e.querySelector(`:scope > ${s}`),c=t.querySelector(`:scope > ${s}`);if(!c){o&&o.remove();continue}if(!o)return!1;const i=o.querySelector(":scope > .cooks-section-label"),d=c.querySelector(":scope > .cooks-section-label");i&&d&&i.innerHTML!==d.innerHTML&&(i.innerHTML=d.innerHTML);const u=o.querySelector(":scope > .signal-list"),p=c.querySelector(":scope > .signal-list");u&&p?gf(u,p):u!==p&&o.replaceWith(c)}return!0}let cc=0;if(typeof window<"u"){const e=()=>{cc=Date.now()};window.addEventListener("wheel",e,{passive:!0}),window.addEventListener("touchmove",e,{passive:!0}),window.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Spacebar"].includes(t.key)&&e()},{passive:!0})}function yf(){if(n.activeTab!=="live"&&n.activeTab!=="terminal")return!1;const e=m("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const a=qe(),r=we(a?.rows||[]),s=vn(r);if(!s.length)return!1;const o=ar(),c=[];{const p=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<p){const b=f.getAttribute("data-token-chart")||"";if(b&&c.push({mint:b,top:y}),c.length>=6)break}}}const i=document.createElement("div");i.innerHTML=Bl(s);const d=i.querySelector(".cooks-feed");if((!d||!bf(t,d))&&(t.outerHTML=Bl(s)),c.length&&(o||Date.now()-cc>450)){const p=e.querySelector(".cooks-feed");for(const f of c){const y=p?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const b=y.getBoundingClientRect().top-f.top;Number.isFinite(b)&&Math.abs(b)>1&&window.scrollBy(0,b);break}}}const u=e.querySelector(".terminal-title-row span");if(u){const p=Et.find(([f])=>f===n.livePairBucket)?.[1]||"Live";u.textContent=`${p} | ${s.length} live`}return!0}function Va(e="live-pairs-batch"){if(e&&jo.add(String(e)),Vo||zo)return;const t=()=>{const a=Array.from(jo);if(Vo=null,jo=new Set,zo=0,n.route!=="terminal"||!["terminal","live","slimeScope"].includes(n.activeTab)||Ha()||(W({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(qe()?.rows)?qe().rows.length:0,details:a.length?a.slice(-3).join(" | "):e}),(n.activeTab==="live"||n.activeTab==="terminal")&&yf()))return;const r=Li();h(),xi(r)};Vo=window.setTimeout(()=>{zo=window.requestAnimationFrame(t)},Jm)}const m=e=>document.querySelector(e);function ne(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof $=="function"?$(t?.message||"Action failed."):console.warn(t)})},0)}const w=(e,t)=>{e&&(e.textContent=t)},Oe=(e,t)=>{w(m(e),t)},Ot=(e,t)=>{const a=m(e);a&&(a.hidden=t)},de=m("[data-app]"),Fn=m("[data-login]"),dc=m("[data-connect]"),Jo=m("[data-top-login]"),Ce=m("[data-login-modal]"),uc=m("[data-auth-actions]"),pc=m("[data-guest-actions]"),mc=m("[data-session-actions]"),re=m("[data-dashboard]"),vf=m("[data-error]"),wf=m("[data-dashboard-error]");function se(e){if(!N("debugPerformanceCounters",!1))return;const t=String(e||"counter");Mn[t]=Number(Mn[t]||0)+1,(Mn[t]<=5||Mn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,Mn[t])}const Et=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],Sf=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],Yo=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],za=[["fresh","Fresh Pairs","Newest launches first","newest"],["dexTrending","DEX Trending","Trending across DEX pairs","volume"],["dexBoosted","DEX Boosted","Paid DEX boosts","volume"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches","newest"],["memeMovers","Meme Coin Movers","Top meme % movers","momentum"],["earlyMomentum","Early Momentum","Young pairs building","newest"],["graduating","Graduating","Near pump migration","volume"],["graduated","Graduated","Moved to the open market","liquidity"]],kf=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],$f=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],Tf=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],Af=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],Pf=Object.fromEntries(Af.map(e=>[e.tabKey,e])),Cf=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function fc(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function hc(e,t=""){const a=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return fc(a)===fc(t)}function Lf(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!hc(e,t))return t;const a=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return a.includes("phantom")?Ya("phantom"):a.includes("solflare")?Ya("solflare"):a.includes("wallet")||a.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":a.includes("powered-by")||a.includes("wordmark")||a.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":Rl(e?.alt||a||"slimewire")}function gc(e,t="",a="fallback"){try{console.info("[slimewire_image_fallback]",{action:a,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function xf(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const a=Lf(t);if(!a||hc(t,a)){t.hidden=!0,gc(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=a,gc(t,a,"fallback")}function Qo(){Qo.installed||(Qo.installed=!0,document.addEventListener("error",xf,!0))}function Zo(){if(!Zo.started){Zo.started=!0;for(const e of Cf)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function ja(e=window.location.pathname){return(e==="/"||e==="")&&oc()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/launch-coin")||e.startsWith("/terminal")?"terminal":"intro"}function Mf(){if(oc()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let Wn=null;function ei(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(Wn||(Wn=new e),Wn.state==="suspended"&&Wn.resume().catch(()=>{}),Wn):null}catch{return null}}function Bf(){const e=ei();if(!(!e||e.state!=="running"))try{const t=e.currentTime,a=1.7,r=Math.floor(e.sampleRate*a),s=e.createBuffer(1,r,e.sampleRate),o=s.getChannelData(0);for(let f=0;f<r;f+=1)o[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=s;const i=e.createBiquadFilter();i.type="bandpass",i.Q.value=.7,i.frequency.setValueAtTime(280,t),i.frequency.exponentialRampToValueAtTime(3400,t+.55),i.frequency.exponentialRampToValueAtTime(170,t+a);const d=e.createGain();d.gain.setValueAtTime(1e-4,t),d.gain.exponentialRampToValueAtTime(.5,t+.16),d.gain.exponentialRampToValueAtTime(1e-4,t+a),c.connect(i).connect(d).connect(e.destination);const u=e.createOscillator();u.type="sine",u.frequency.setValueAtTime(150,t),u.frequency.exponentialRampToValueAtTime(46,t+.95);const p=e.createGain();p.gain.setValueAtTime(1e-4,t),p.gain.exponentialRampToValueAtTime(.38,t+.08),p.gain.exponentialRampToValueAtTime(1e-4,t+1.15),u.connect(p).connect(e.destination),c.start(t),c.stop(t+a),u.start(t),u.stop(t+1.2)}catch{}}function Rf(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),a=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let s=!1,o=null;const c=()=>n.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),i=A=>{t&&(t.dataset.introPhase=A)},d=A=>{r&&(r.textContent=A,r.hidden=!A)},u=()=>{s||(s=!0,o&&(clearTimeout(o),o=null),i("portal"),Bf(),ff(),setTimeout(()=>{Rn({reset:!0}),Pe("/connect")},620))};if(!c()){Rn({reset:!0});return}const p=()=>{s||(ei(),a&&a.muted&&(a.muted=!1,a.volume=1,a.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(A=>{document.addEventListener(A,p,{once:!0,passive:!0})}),a&&(a.preload="auto",a.playsInline=!0,a.autoplay=!0,a.setAttribute("autoplay",""),a.setAttribute("playsinline",""),a.disablePictureInPicture=!0,!a.getAttribute("src")&&a.dataset.introSrc&&(a.src=a.dataset.introSrc));const f=A=>{o&&clearTimeout(o),o=setTimeout(()=>{c()&&u()},Math.max(4e3,Math.min(22e3,A)))},y=()=>{if(s||!c())return;const A=g=>{if(!a)return;a.muted=g,a.volume=g?0:1;const T=a.play?.();T?.catch&&T.catch(()=>{g?d(""):A(!0)})};ei(),A(!1)};a?.addEventListener("loadedmetadata",()=>{const A=Number(a.duration);f(Number.isFinite(A)&&A>0?(A+2.5)*1e3:9e3)}),a?.addEventListener("ended",u),a?.addEventListener("error",()=>{f(1500)});let b=!1,v=null;const P=()=>{b||s||!c()||(b=!0,y())};a?(a.readyState>=4?P():(a.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),a.addEventListener("waiting",()=>{!b||s||(v&&clearTimeout(v),v=setTimeout(()=>{c()&&u()},900))}),["playing","timeupdate"].forEach(A=>a.addEventListener(A,()=>{v&&(clearTimeout(v),v=null)}))):P(),f(11e3)}function bc(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function ti({keepLogin:e=!1}={}){n.walletConnectMenuOpen=!1,e||(n.loginModalOpen=!1),n.quickBuyModal?.open&&(n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""}),Qn()}function yc(){try{if(n.route!=="terminal")return;if(n.activeTab==="terminal"){const e=lo();n.terminalSort=e[3]||"newest",n.terminalCat=e[0]||"fresh"}else if(n.activeTab==="live"){const e=so();n.terminalSort=e[3]||"newest",n.terminalCat=e[0]||"fresh"}else if(n.activeTab==="slimeScope"){const e=Cr();n.terminalSort=e[3]||"volume",n.terminalCat=e[0]||"dexTrending"}}catch{}}function Pe(e,t=null){const a=L(),r=e||"/terminal";n.route=ja(r),ti({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.route==="terminal"&&(n.activeTab=t||bc(r)),yc(),n.route!=="intro"&&Rn({reset:!0}),window.history.pushState({},"",r),nl(),h(),K("route-change",a,{component:"router",details:r})}window.addEventListener("popstate",()=>{n.route=ja(),ti({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.activeTab=bc(),yc(),n.route!=="intro"&&Rn({reset:!0}),nl(),h()});let vc=!1;function ai(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function Gr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),ai()}function If(e){if(!e)return;const t=!e.open;if(Gr(e),e.open=t,t){const a=e.closest("[data-market-ticker]"),s=e.querySelector("summary")?.getBoundingClientRect?.();if(a&&s){const o=Math.max(10,Math.min(window.innerWidth-10,s.left+s.width/2)),c=Math.max(30,s.bottom+4);a.style.setProperty("--ticker-menu-left",`${Math.round(o)}px`),a.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}ai()}function Of(){vc||(vc=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){Gr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>Gr(),80);return}const a=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");a&&(e.preventDefault(),e.stopPropagation(),If(a.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&ai()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&Gr()}))}function Ga(e){return`${Ia}${e}`}function L(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function oa(e){try{window.performance?.mark?.(e)}catch{}}function ke(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function wc(e={}){qa.push(e),qa.length>10&&qa.splice(0,qa.length-10),!Uo&&(Uo=window.setTimeout(()=>{Uo=null;const t=qa.splice(0,qa.length);for(const a of t)try{const r=JSON.stringify(a),s=Ga("/api/web/perf-event");if((s.charAt(0)==="/"||s.indexOf(location.origin)===0)&&navigator.sendBeacon){const c=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(s,c))continue}fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function ni(e,t,a){if(a==="perf"&&qo||a==="crash"&&Ho||a==="feed"&&Ko)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},s=window.setTimeout(()=>{a==="perf"&&(qo=null),a==="crash"&&(Ho=null),a==="feed"&&(Ko=null),r()},Gm);a==="perf"&&(qo=s),a==="crash"&&(Ho=s),a==="feed"&&(Ko=s)}function W(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&se("slowApiRequestWarning");const a={at:new Date().toISOString(),route:ke(e.route||n.route||ja(),40),component:ke(e.component||"",60),action:ke(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ke(e.requestId||"",80),errorCode:ke(e.errorCode||"",60),details:ke(e.details||"",140)};return n.perfLog=[...n.perfLog||[],a].slice(-100),ni(jl,()=>n.perfLog,"perf"),(a.durationMs>=jm||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(a.action))&&wc(a),a}function K(e,t,a={}){W({...a,action:e,durationMs:L()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",a=""){oa("chartFirstPaint"),W({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!tt(a)?.cacheHit,stale:!!tt(a)?.stale,details:`${ke(t,20)}:${ke(a,60)}`})};function ri(e={}){const t={at:new Date().toISOString(),route:ke(e.route||n.route||ja(),40),actionBeforeCrash:ke(e.actionBeforeCrash||n.postTradeRefresh?.action||"",70),errorCode:ke(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ke(e.message||"",160),component:ke(e.component||"",80),requestId:ke(e.requestId||n.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return n.crashLog=[...n.crashLog||[],t].slice(-50),ni(Gl,()=>n.crashLog,"crash"),wc({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Ef(){n.crashInstrumentationInstalled||(n.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||ri({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};ri({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function wt(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function si(e="",t="",a=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(a||"").trim()}`}function ot(e="",t="",a=""){const r=si(e,t,a),s=n.tradeActionLocks?.[r];return s&&["clicked","submitting","submitted","confirming"].includes(s.state)?s:null}function z(e="",t="",a="",r={}){const s=si(e,t,a),o=n.tradeActionLocks?.[s]||{};n.tradeActionLocks={...n.tradeActionLocks||{},[s]:{...o,action:e,tokenMint:t,detail:a,updatedAt:new Date().toISOString(),...r}},ue()}function Le(e="",t="",a="",r=2400){const s=si(e,t,a);window.setTimeout(()=>{const o=n.tradeActionLocks?.[s];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const c={...n.tradeActionLocks||{}};delete c[s],n.tradeActionLocks=c,ue(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},r)}function Xr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function oi(e="",t=""){const a=n.manualSellActions?.[Xr(e,t)];return a&&["clicked","submitting","submitted","confirming"].includes(a.state)?a:Object.entries(n.manualSellActions||{}).find(([r,s])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(s?.state))?.[1]||null}function ia(e,t,a={}){const r=Xr(e,t),s=n.manualSellActions?.[r]||{};n.manualSellActions={...n.manualSellActions||{},[r]:{...s,tokenMint:e,percent:String(t||s.percent||"100"),updatedAt:new Date().toISOString(),...a}},ue()}function ii(e,t,a=2400){const r=Xr(e,t);window.setTimeout(()=>{const s=n.manualSellActions?.[r];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const o={...n.manualSellActions||{}};delete o[r],n.manualSellActions=o,ue(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},a)}function Xa(e,t={}){const a=L(),r=t.startedAt||n.positionRefreshAction?.startedAt||a;n.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(n.positionRefreshAction?.minUntil||0,a+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},ue()}function je(e,t={}){const a=n.positionRefreshAction?.minUntil||0,r=Math.max(0,a-L());qr&&window.clearTimeout(qr),qr=window.setTimeout(()=>{qr=null,Xa(e,t),h(),e==="success"&&window.setTimeout(()=>{n.positionRefreshAction?.state==="success"&&(n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},ue(),h())},900)},r)}function Ft(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function ue(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(o=>{const c=o.dataset.positionSell||"",i=o.dataset.positionSellPercent||"",d=oi(c,i),u=Ft(o),p=n.manualSellActions?.[Xr(c,i)],f=!!d;o.disabled=f,o.dataset.actionState=p?.state||d?.state||"idle",f?p?.state==="submitted"||p?.state==="confirming"?o.textContent="Submitted":o.textContent="Selling...":o.textContent=u});const e=String(n.tradeToken||m("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(o=>{const c=o.dataset.tradeBuyQuick||(o.matches("[data-trade-buy-max]")?"max":"custom"),i=ot("trade-buy",e,c),d=Ft(o);o.disabled=!!i,o.dataset.actionState=i?.state||"idle",o.textContent=i?i.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-quick-trade-token]").forEach(o=>{const c=o.dataset.quickTradeToken||"",i=pt(),d=ze(i)||i?.amountSol||"quick",u=ot("trade-buy",c,String(d)),p=Ft(o);o.disabled=!!u,o.dataset.actionState=u?.state||"idle",o.textContent=u?u.state==="submitted"?"Submitted":"Buying...":p}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(o=>{const c=o.dataset.tradeSellQuick||"custom",i=ot("trade-sell",e,c),d=Ft(o);o.disabled=!!i,o.dataset.actionState=i?.state||"idle",o.textContent=i?i.state==="submitted"?"Submitted":"Selling...":d}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(o=>{const c=o.dataset.chartConfirmBuy||n.smartChartToken||"",i=X(m("[data-chart-buy-amount]")?.value||"")||"custom",d=ot("trade-buy",c,String(i)),u=Ft(o);o.disabled=!!d,o.dataset.actionState=d?.state||"idle",o.textContent=d?d.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(o=>{const c=o.dataset.chartConfirmSell||n.smartChartToken||"",i=m("[data-chart-sell-percent]")?.value||"100",d=oi(c,i),u=Ft(o);o.disabled=!!d,o.dataset.actionState=d?.state||"idle",o.textContent=d?d.state==="submitted"?"Submitted":"Selling...":u});const t=String(n.bundleToken||m("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(o=>{const c=o.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",i=ot(c,t,"bundle"),d=Ft(o);o.disabled=!!i,o.dataset.actionState=i?.state||"idle",o.textContent=i?i.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":d});const a=(o,c)=>{const i=Ft(o),d=o.matches?.("[data-top-refresh-wallet]");if(o.dataset.actionState=c,o.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),d){o.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",o.textContent=i||"Refresh";return}c==="clicked"||c==="refreshing"?o.textContent="Refreshing...":c==="success"?o.textContent="Updated":c==="error"?o.textContent="Failed":o.textContent=i},r=n.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(o=>{a(o,r)});const s=n.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(o=>{a(o,s)})}function Ff(){if(!n.perfInstrumentationInstalled){n.perfInstrumentationInstalled=!0,oa("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries())Number(a.duration||0)<50||W({component:"main-thread",action:"long-task",durationMs:a.duration,details:a.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries()){const r=Number(a.duration||0);r<80||W({component:"input",action:"interaction-delay",durationMs:r,details:a.name||a.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function xe(e){return new Promise(t=>setTimeout(t,e))}function D(e="",t={}){const a=String(e||"");return t.preserveSafeError?a:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(a)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":a}async function _n(e,t={},a=Ln){const r=new AbortController,s=setTimeout(()=>r.abort(),a);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(s)}}async function Sc(e){try{await _n(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:a=Ln,preserveSafeError:r=!1,dedupe:s=!0,...o}=t||{},c=String(o.method||"GET").toUpperCase(),i=L(),d=s&&c==="GET"?`${c}:${e}:${n.token?n.token.slice(0,12):"guest"}`:"";if(d&&ra.has(d))return se("duplicateApiRequestsPrevented"),W({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),ra.get(d);const u=(async()=>{const p={"Content-Type":"application/json",...o.headers||{}};n.token&&(p.Authorization=`Bearer ${n.token}`);let f,y=null;try{f=await _n(Ga(e),{...o,headers:p,cache:"no-store"},a)}catch(v){y=v,await Sc(Ia),await xe(900);try{f=await _n(Ga(e),{...o,headers:p,cache:"no-store"},a)}catch(P){y=P;for(const A of zl)if(A!==Ia)try{await Sc(A),f=await _n(`${A}${e}`,{...o,headers:p,cache:"no-store"},a),Ia=A;break}catch(g){y=g}if(!f){const A=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${A} SlimeWire could not connect right now. Try again in a moment.`)}}}const b=await kc(f);if(!f.ok||b.ok===!1){const v=r||e==="/api/web/launch/coin"||!!(b.launchAttemptId||b.launch?.launchAttemptId),P=D(b.message||b.launch?.failureReason||b.error||`HTTP ${f.status}`,{preserveSafeError:v}),A=new Error(P);throw A.status=f.status,A.data=b,A.code=b.errorCode||b.launch?.errorCode||b.error||"",A.stage=b.stage||b.launch?.stage||"",A.launchAttemptId=b.launchAttemptId||b.launch?.launchAttemptId||"",A.providerStatus=b.providerStatus||b.launch?.providerStatus||null,f.status===401&&Yf(P),A}return K("api-request",i,{component:"api",details:e,resultCount:Array.isArray(b?.rows)?b.rows.length:0}),b})();return d&&(ra.set(d,u),u.then(()=>{ra.get(d)===u&&ra.delete(d)},()=>{ra.get(d)===u&&ra.delete(d)})),u}async function kc(e){const t=e.headers.get("content-type")||"",a=await e.text();if(!a.trim())return{};try{return JSON.parse(a)}catch{const r=a.toLowerCase(),s=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:s?"payload_too_large":"invalid_api_response",message:s?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function Wf(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function he(e){e&&(n.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(n.xHandle=et(e.xHandle),n.xHandle?tc(n.xHandle):Wo()):n.xHandle||(n.xHandle=ec()))}function Jr(e){for(const t of e){const a=Nn(t);if(a&&!a.closest("[hidden]"))return String(a.value||"")}for(const t of e){const a=m(t);if(a)return String(a.value||"")}return""}function Dn(){const e=m("[data-connect-status]");return e&&!e.closest("[hidden]")?e:Nn("[data-login-status]")||e}function Nn(e){const t=[...document.querySelectorAll(e)];return t.find(a=>!a.closest("[hidden]")&&a.offsetParent!==null)||t.find(a=>!a.closest("[hidden]"))||t[0]||null}function Un(){return Nn("[data-wallet-connect-modal] [data-wallet-connect-status]")||Nn("[data-wallet-connect-status]")}function oe(e=""){n.walletConnectStatus=String(e||""),w(Un(),n.walletConnectStatus)}function $c(e="solana"){const t=_e(e);return Ge()?Hn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:Mc(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Wt(e="solana",t=null,a={}){const r=ge(e),s={walletName:_e(e,r),userId:n.user?.id||"",route:n.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...a};try{console.warn("[slimewire_wallet_connect]",s)}catch{}}function Tc(e=n.route==="connect"){window.setTimeout(()=>{const t=n.loginModalOpen?`[data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";Nn(t)?.focus?.()},0)}function _f(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(_o=e)}function Df(){const e=_o;_o=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function Ac({restoreFocus:e=!0}={}){const t=!!n.loginModalOpen;n.loginCollapsed=!0,n.loginModalOpen=!1,h({force:!0}),t&&e&&Df()}function Nf(){return!Ce||Ce.hidden||!n.loginModalOpen?[]:[...Ce.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function Uf(e){if(!n.loginModalOpen||e.key!=="Tab"||!Ce||Ce.hidden)return!1;const t=Nf();if(!t.length)return!1;const a=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===a?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),a.focus({preventScroll:!0}),!0):!1}function Ja(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function qf(e=Ja()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function Pc(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Hf(e="unknown"){const t=Date.now();if(t-Number(n.lastLockInClickAt||0)<300)return;n.lastLockInClickAt=t;const a={route:Pc(n.route||ja(),40),viewport:Math.round(window.innerWidth||0),source:Pc(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(a),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",a)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(a)}).catch(()=>{})}catch{}}function Cc({defaultTab:e="login",returnTo:t=Ja(),source:a="unknown",connectPanel:r=n.route==="connect"}={}){if(_f(),Hf(a),n.loginModalOpen=!0,n.loginModalTab=e==="create"?"create":"login",n.loginReturnTo=t||Ja(),n.loginCollapsed=!1,n.walletConnectMenuOpen=!1,!Ce&&!Jo){window.location.assign(qf(n.loginReturnTo));return}h({force:!0}),Tc(r)}function Lc(e={}){Cc(e)}function Ge(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function xc(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Kf(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function Mc(e=""){if(!Ge())return"";const t=encodeURIComponent(xc()),a=encodeURIComponent(Kf());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${a}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${a}`:""}function li(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Ya(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function ci(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let a=0n;for(const s of t)a=(a<<8n)+BigInt(s);let r="";for(;a>0n;){const s=Number(a%58n);r=Zl[s]+r,a/=58n}for(const s of t){if(s!==0)break;r="1"+r}return r||"1"}function Yr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let a=0n;for(const s of t){const o=nf.get(s);if(o===void 0)throw new Error("Invalid wallet callback encoding.");a=a*58n+BigInt(o)}const r=[];for(;a>0n;)r.unshift(Number(a&255n)),a>>=8n;for(const s of t){if(s!=="1")break;r.unshift(0)}return new Uint8Array(r)}function Vf(e="phantom",t="",a=n.walletConnectReturnPath||"/terminal",r=""){const s=new URL(a||window.location.pathname||"/terminal",window.location.origin);return s.searchParams.delete("sw_wallet"),s.searchParams.delete("sw_wallet_state"),s.searchParams.delete("sw_wallet_pending"),s.searchParams.delete("phantom_encryption_public_key"),s.searchParams.delete("solflare_encryption_public_key"),s.searchParams.delete("nonce"),s.searchParams.delete("data"),s.searchParams.delete("errorCode"),s.searchParams.delete("errorMessage"),s.searchParams.set("sw_wallet",e),s.searchParams.set("sw_wallet_state",t),r&&s.searchParams.set("sw_wallet_pending",r),s.toString()}function qn(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function Bc(){try{const e=window.sessionStorage?.getItem(Oo)||window.localStorage?.getItem(Eo)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function zf(e){try{window.sessionStorage?.setItem(Oo,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(Eo,JSON.stringify(e))}catch{}}function di(){try{window.sessionStorage?.removeItem(Oo)}catch{}try{window.localStorage?.removeItem(Eo)}catch{}}function Rc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function Hn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function jf(e="",t={}){const a=Hn(e);if(!a)return"";const r=new URL(a);return r.searchParams.set("app_url",xc()),r.searchParams.set("redirect_link",Vf(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function la(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ge()?"mobile":"desktop"}function Ic(e=""){return Ge()&&!!Hn(e)}function Gf(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Xf(e="",t="/terminal"){try{const a=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:Ln,body:JSON.stringify({provider:e,intendedRoute:t,platform:la(),browser:Gf()})});return!a.pendingConnectId||!a.stateId||!a.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:a.pendingConnectId,stateId:a.stateId,returnPath:a.intendedRoute||t,dappEncryptionPublicKey:a.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:a.expiresAt||"",serverManaged:!0}}catch(a){return Wt(e,a,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:la()}),null}}function Jf(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const a=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:ci(r),returnPath:t,dappEncryptionPublicKey:ci(a.publicKey),dappEncryptionSecretKey:ci(a.secretKey),createdAt:Date.now(),serverManaged:!1}}async function Oc(e="",{returnPath:t=n.walletConnectReturnPath||"/terminal"}={}){if(!Ic(e))return!1;const a=await Xf(e,t)||Jf(e,t);if(!a)return!1;zf(a);const r=jf(e,a);if(!r)return!1;const s=_e(e);return oe(`Opening ${s} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Wt(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:la()}),window.location.assign(r),!0}function Ec(e=""){const t=_e(e),a=Mc(e);return a?(oe(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Wt(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:la()}),window.location.href=a,!0):!1}function Fc({requirePassword:e=!1}={}){const t=Jr(["[data-connect-login-username]","[data-login-username]"]).trim(),a=Jr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!a&&!e)return{};if(!t)throw new Error("Enter your username.");if(!a)throw new Error("Enter your password.");return{username:t,password:a}}function Yf(e=""){n.token="",n.user=null,n.loading=!1,Fo(),h(),$(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function Q(e=null,t="Creating secure web profile..."){if(n.user&&n.token)return n.user;w(e,t);const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:rc()})});return n.token=a.token,he(a.user),Bn(n.token),n.user}function $(e=""){[vf,wf].forEach(t=>{t&&(t.hidden=!e,w(t,e))})}function Z(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Qf(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Wc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function ui(){$("");const e=Dn();try{const t=Fc();w(e,t.username?"Creating saved login...":"Creating account...");const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:rc()})});n.token=a.token,he(a.user),Bn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",w(e,t.username?"Account created. Login saved.":"Quick web account created."),V(a.trade?.signature,"account-create")}catch(t){w(e,t.message),$(t.message)}}async function _c(){$("");const e=Dn();try{const t=Fc({requirePassword:!0});w(e,"Logging in...");const a=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});n.token=a.token,he(a.user),Bn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",w(e,"Logged in."),V(a.trade?.signature,"password-login")}catch(t){w(e,t.message),$(t.message)}}function Dc(){return Jr(["[data-connect-login-email]","[data-login-email]"]).trim()}function Zf(){return Jr(["[data-connect-login-code]","[data-login-code]"]).trim()}function Nc(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function eh(){$("");const e=Dn();try{const t=Nc(Dc());w(e,"Sending login code...");const a=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});w(e,a.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){w(e,t.message),$(t.message)}}async function th(){$("");const e=Dn();try{const t=Nc(Dc()),a=Zf();if(!a)throw new Error("Enter the login code from your email.");w(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:a})});n.token=r.token,he(r.user),Bn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",w(e,"Logged in."),V(r.trade?.signature,"email-code-login")}catch(t){w(e,t.message),$(t.message)}}function Uc(e="",t=new URLSearchParams){const a=Bc(),r=t.get("sw_wallet_state")||"";if(!a.stateId||a.stateId!==r||a.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(a.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const s=t.get(Rc(e))||"",o=t.get("nonce")||"",c=t.get("data")||"";if(!s||!o||!c)throw new Error("Wallet approval did not return the expected connection data.");const i=window.nacl;if(!i?.box?.before||!i.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const d=i.box.before(Yr(s),Yr(a.dappEncryptionSecretKey)),u=i.box.open.after(Yr(c),Yr(o),d);if(!u)throw new Error("Unable to verify the wallet approval response.");const p=JSON.parse(new TextDecoder().decode(u)),f=String(p.public_key||p.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(p.session||""),walletEncryptionPublicKey:s,dappEncryptionPublicKey:a.dappEncryptionPublicKey,returnPath:a.returnPath||"/terminal"}}async function qc(e="",t={}){const a=Un();await Q(a,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:_e(e)})});he(r.user||{...n.user,connectedWallet:r.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:S(t.publicKey),provider:_e(e),tokens:[]};try{window.sessionStorage?.setItem(`${Vm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}di(),qn(),n.walletConnectMenuOpen=!1,oe(`Connected ${S(t.publicKey)}. Opening Live Terminal...`),Pe(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Zr("mobile-wallet-connect")}function ah(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||Bc().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(a=>a!=="data"&&a!=="nonce"),walletEncryptionPublicKey:t.get(Rc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function nh(e="",t={}){t.token&&(n.token=t.token,Bn(n.token)),he(t.user||{...n.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const a=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";a&&(n.connectedWalletBalance={publicKey:a,shortPublicKey:S(a),provider:t.provider||_e(e),tokens:[]}),di(),qn(),n.walletConnectMenuOpen=!1,oe(a?`Connected ${S(a)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),Pe(t.finalRedirectRoute||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Zr("mobile-wallet-callback")}async function Hc(e="",t=new URLSearchParams){const a=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:Ln,body:JSON.stringify(ah(e,t))});return await nh(e,a),!0}async function rh(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;n.walletConnectMenuOpen=!0;const a=_e(t),r=e.get("sw_wallet_pending")||"",s=e.get("errorCode")||"",o=e.get("errorMessage")||"";if(s||o)return r&&await Hc(t,e).catch(()=>{}),di(),qn(),oe(`${a} did not connect: ${o||s||"request cancelled"}. Choose another wallet or try again.`),Wt(t,new Error(o||s||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:la()}),h({force:!0}),!0;try{if(oe(`Finishing ${a} mobile connection...`),r)await Hc(t,e);else{const c=Uc(t,e);await qc(t,c)}}catch(c){if(r)try{const i=Uc(t,e);await qc(t,i)}catch{oe(`${a} mobile connection could not finish: ${c.message}`),Wt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:la()}),qn(),h({force:!0})}else oe(`${a} mobile connection could not finish: ${c.message}`),Wt(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:la()}),qn(),h({force:!0})}return!0}async function sh(){$("");const e=Un()||Dn();try{w(e,"Choose a wallet provider to connect."),ma({returnPath:"/terminal"})}catch(t){w(e,t.message),$(t.message)}}async function oh(){n.user||await ui(),n.user&&(n.walletConnectMenuOpen=!1,n.route="terminal",n.activeTab="wallets",n.toolSections={...n.toolSections||{},wallets:n.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),n.wallets.length||await Cu())}async function ih(){if(n.logoutPending)return;if(!n.user){n.loginCollapsed=!1,h(),Fn?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await du("logging out");const e=String(n.token||"");n.logoutPending=!0;const t=m("[data-logout]");t&&(t.disabled=!0,w(t,"Logging out...")),n.token="",n.user=null,n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="",n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},n.manualSellActions={},n.tradeActionLocks={},n.ogreAgentStatus="",Fl(),Fo(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{n.logoutPending=!1}}async function lh(){if(!n.token){h();return}try{const e=await k("/api/web/me");he(e.user),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),He({force:!1,deep:!1,reason:"session-load"}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})})}catch{n.token="",Fo(),h()}}async function ca(e={}){const t=L();if(!n.user||!n.token){n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.launchWatches=[],n.presets={trade:[],bundle:[]},n.tradePlans=[],n.watchlist={rows:[],count:0},h();return}const a=!e.silent;a&&(n.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,b,v,P,A]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.pnl=y.pnl||null,n.launchWatches=b.watches||[],n.presets=v.presets||{trade:[],bundle:[]},zu(),n.watchlist=P.watchlist||{rows:[],count:0},n.tradePlans=A.plans||[],Ls();return}const[s,o,c,i,d,u,p,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.wallets=s.wallets||[],n.balances=o.balances||[],n.connectedWalletBalance=o.connectedWallet||c.connectedWallet||null,n.positions=c.positions||[],n.pnl=i.pnl||null,n.launchWatches=d.watches||[],n.presets=u.presets||{trade:[],bundle:[]},zu(),n.watchlist=p.watchlist||{rows:[],count:0},n.tradePlans=f.plans||[],Ls(),e.force&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="")}finally{K("load-all",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e.skipCore?"skip-core":"core"}),a&&(n.loading=!1),h()}}async function pi(e={}){if(!n.user||!n.token)return;const t=L(),a=e.requestId||0,r=()=>a&&n.walletRefreshRequestId!==a,s=e.force?"?force=true":"",o=e.force||e.deep?"?force=true":"",c=e.timeoutMs||Ln,i=k("/api/web/wallets",{timeoutMs:c}),d=k(`/api/web/balances${s}`,{timeoutMs:c}),u=k("/api/web/trade/plans",{timeoutMs:c}),p=await d;if(r())return;n.balances=p.balances||[],n.connectedWalletBalance=p.connectedWallet||null,n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("wallet-refresh",t,{component:"wallet",resultCount:n.balances.length,cacheHit:!!p.cacheHit,details:`wallets=${n.wallets.length};connected=${!!n.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([i.then(b=>({ok:!0,wallets:b})).catch(b=>({ok:!1,error:b})),u.then(b=>({ok:!0,tradePlans:b})).catch(b=>({ok:!1,error:b}))]);if(!r()&&(f.ok&&(n.wallets=f.wallets.wallets||n.wallets||[]),y.ok&&(n.tradePlans=y.tradePlans.plans||n.tradePlans||[],Ls()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const b=L(),v=k(`/api/web/positions${o}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await v;if(P?.__error)throw P.__error;if(r())return;n.connectedWalletBalance=P.connectedWallet||n.connectedWalletBalance||null,n.positions=P.positions||[],n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("positions-refresh",b,{component:"positions",resultCount:n.positions.length,cacheHit:!!P.cacheHit,details:`open=${n.positions.length}`})}catch(P){n.walletRefreshError=P.message||"Position refresh failed.",K("positions-refresh",b,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(P?.message||"Position refresh failed.")})}}}function Kc(e=n.positions){return(Array.isArray(e)?e:[]).some(t=>{const a=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!a&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Vc(e=120,t="positions-value-followup"){!n.user||!n.token||(Hr&&window.clearTimeout(Hr),Hr=window.setTimeout(()=>{Hr=null,St({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Qt}).then(a=>{a?(n.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})):Qr(`${t}-failed`)}).catch(()=>Qr(`${t}-failed`))},Math.max(0,Number(e)||0)))}function ch(e=[],t=[],a={}){const r=new Map((Array.isArray(t)?t:[]).map(s=>[String(s?.tokenMint||""),s]));return(Array.isArray(e)?e:[]).map(s=>{const o=r.get(String(s?.tokenMint||""));if(!o||a.fast===!1)return s;const c=!!(s?.valuePending||/refreshing|updating|background/i.test(s?.valueError||"")),i=o.estimatedValueSol!==null&&o.estimatedValueSol!==void 0&&o.estimatedValueSol!=="";return!c||!i?s:{...s,estimatedValueSol:o.estimatedValueSol,openPnlSol:o.openPnlSol,openPnlPercent:o.openPnlPercent,valuePending:!1,valueError:""}})}function Qr(e="positions-value-refresh-delayed"){let t=!1;return n.positions=(Array.isArray(n.positions)?n.positions:[]).map(a=>{const r=a?.estimatedValueSol!==null&&a?.estimatedValueSol!==void 0&&a?.estimatedValueSol!=="";return!(a?.valuePending||/refreshing|updating|background/i.test(a?.valueError||""))?a:(t=!0,{...a,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(K("positions-value-refresh-cleanup",L(),{component:"positions",details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):!1}function zc(e="portfolio-supplemental"){if(!n.user||!n.token)return;const t=L();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Qt}),k("/api/web/pnl?force=true",{timeoutMs:Qt,dedupe:!1})]).then(([a,r])=>{a.status==="fulfilled"&&(n.balances=a.value.balances||n.balances||[],n.connectedWalletBalance=a.value.connectedWallet||n.connectedWalletBalance||null),r.status==="fulfilled"&&(n.pnl=r.value.pnl||n.pnl||null),n.lastWalletRefreshAt=new Date().toISOString(),K("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}).catch(()=>{})}async function St(e={}){if(!n.user||!n.token)return;const t=L(),a=new URLSearchParams;e.force&&a.set("force","true"),e.fast!==!1&&a.set("fast","true");const r=a.toString()?`?${a.toString()}`:"",s=r||"full";if(On&&Do===s)return On;const o=++No;return Do=s,On=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Qt:Ro)});return No!==o?!1:(n.connectedWalletBalance=c.connectedWallet||n.connectedWalletBalance||null,n.positions=ch(c.positions||n.positions||[],n.positions||[],e),n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("positions-refresh",t,{component:"positions",resultCount:n.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Kc(n.positions)&&Vc(120,`${e.reason||"positions"}-values`),e.syncPnl&&zc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(n.walletRefreshError=c.message||"Position refresh failed."),K("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(c?.message||"Position refresh failed.")}),!1}finally{No===o&&(On=null,Do="")}})(),On}async function dh(e={}){if(!n.user||!n.token){$("Connect your wallet before refreshing positions."),je("error",{error:"Wallet not connected"});return}const t=L();Xa("refreshing",{startedAt:n.positionRefreshAction?.startedAt||t}),n.walletRefreshError="",Oe("[data-sync-health]",os()),ue(),await xe(20);try{if(!await St({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Qt}))throw new Error(n.walletRefreshError||"Position refresh failed.");n.lastWalletRefreshAt=new Date().toISOString(),je("success",{error:""}),zc(`${e.reason||"positions-only"}-balances-pnl`),Kc(n.positions)&&Vc(120,`${e.reason||"positions-only"}-full-values`),K("positions-only-refresh",t,{component:"positions",resultCount:n.positions.length,details:e.reason||"positions-only"})}catch(a){const r=a?.message||"Position refresh failed.";n.walletRefreshError=r,je("error",{error:D(r)}),$(r),K("positions-only-refresh",t,{errorCode:a?.code||a?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:D(r)})}finally{h()}}function Kn(){return String(n.smartChartToken||n.tradeToken||n.bundleToken||n.volumeToken||n.terminalToken||"").trim()}function Xe(e=n.activeTab){return Pf[e]||null}function Qa(e=Xe()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",tn(n.livePairBucket)).replace("{sort}",String(n.terminalSort||"best")).replace("{scopeMode}",String(n.slimeScopeMode||"new")).replace("{kolMode}",String(n.kolMode||"hot")).replace("{kolWallet}",n.kolWallet?S(n.kolWallet):"global").replace("{scanMode}",String(n.scanMode||"safe")).replace("{tokenMint}",Kn()?S(Kn()):"none")}function jc(e=n.activeTab,t="pageSize",a=25){const r=Xe(e),s=Number(r?.[t]);return Number.isFinite(s)&&s>0?s:a}function Za(e=n.activeTab){return jc(e,"pageSize",25)}function mi(e=n.activeTab){return Math.max(Za(e),jc(e,"maxPageSize",Za(e)))}function Gc(e=n.activeTab){return!!Xe(e)?.supportsPagination}function fi(e=n.activeTab){const t=Xe(e)||{tabKey:e};return`${e}:${Qa(t)}`}function Vn(e=n.activeTab,t=0){const a=fi(e),r=Za(e),s=mi(e),o=Number(n.terminalFeedVisibleLimits?.[a]||0),c=Number.isFinite(o)&&o>0?o:r,i=Number(t||0),d=Math.min(Math.max(r,c),s);return i>0?Math.min(d,i):d}function ee(e=n.activeTab){const t=fi(e);if(!n.terminalFeedVisibleLimits?.[t])return;const a={...n.terminalFeedVisibleLimits||{}};delete a[t],n.terminalFeedVisibleLimits=a}function uh(e=n.activeTab,t=0){const a=fi(e),r=Vn(e,t),s=Za(e),o=mi(e),c=Number(t||0),i=Math.min(o,c>0?c:o,r+s);return n.terminalFeedVisibleLimits={...n.terminalFeedVisibleLimits||{},[a]:i},i}function it(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return a.slice(0,Vn(e,a.length))}function ph(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return Gc(e)&&a.length>Vn(e,a.length)}function da(e=n.activeTab,t=[],a="rows"){const r=Array.isArray(t)?t:[];if(!ph(e,r))return"";const s=Vn(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${l(s)} of ${l(r.length)} ${l(a)} shown</small>
      <button type="button" data-terminal-load-more="${l(e)}">Load More</button>
    </div>
  `}function j(e=n.activeTab){return n.terminalFeeds[e]||{}}function Xc(e=n.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?ua():e==="kol"?n.kolLastUpdatedAt||"":e==="watchlist"?j("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?n.lastWalletRefreshAt||j(e).lastFetchAt||"":j(e).lastFetchAt||""}function _t(e=n.activeTab){return e==="terminal"?Number(qe()?.rows?.length||0)+Number(n.kolScan?.rows?.length||0):e==="live"?Number(qe()?.rows?.length||0):e==="liveTrades"?Number(n.pnl?.trades?.length||0):e==="slimeScope"?Number(Mp?.(n.slimeScopeMode)?.length||0):e==="kol"?Number(n.kolScan?.rows?.length||0):e==="watchlist"?Number(n.watchlist?.rows?.length||0):e==="smartChart"?Kn()?1:Number(yr?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?Kn()?1:0:e==="sniper"?Number(n.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(n.launchWatches?.length||0):e==="wallets"?Number(n.wallets?.length||0)+Number(n.balances?.length||0):e==="positions"?Number(n.positions?.length||0):e==="pnl"?Number(n.pnl?.trades?.length||0):e==="ogreAi"?n.ogreAiResult?1:0:e==="ogreTek"?Number(n.ogreTek?.markets?.length||0)+Number(n.ogreTek?.positions?.length||0):0}function zn(e=n.activeTab){const t=_t(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,Vn(e,t)):t}function jn(e=n.activeTab){const t=Xe(e);if(!t)return!1;const a=Date.parse(Xc(e)||"");return Number.isFinite(a)?Date.now()-a>Number(t.staleMs||3e4):!0}function Jc(e=n.activeTab){return _t(e)>0||!!Xc(e)}function mh(e=n.activeTab,t={}){const a=Xe(e)||{};return{tabKey:e,label:a.label||e,category:a.category||"unknown",endpoint:a.endpoint||"",cacheKey:Qa(a),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??zn(e)??0),pageSize:Za(e),maxPageSize:mi(e),supportsPagination:Gc(e),hasMore:!!(t.hasMore??_t(e)>zn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function Yc(e=n.activeTab,t={}){const a=mh(e,t);if(n.terminalFeedLog=[...n.terminalFeedLog||[],a].slice(-20),ni(zm,()=>n.terminalFeedLog,"feed"),a.status==="error"||a.status==="timeout"||/manual|post-trade|visibility|resume/i.test(a.reason||"")||!!(a.stale&&a.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(a)}).catch(()=>{})}catch{}return a}function fh(e=n.activeTab,t={}){const a=Xe(e);if(!a)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return n.terminalFeeds={...n.terminalFeeds,[e]:{...j(e),label:a.label,category:a.category,endpoint:a.endpoint,cacheKey:Qa(a),refreshMs:a.refreshMs,staleMs:a.staleMs,pageSize:a.pageSize,maxPageSize:a.maxPageSize,supportsPagination:!!a.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function hi(e=n.activeTab,t="",a="success",r={}){const s=Xe(e);if(!s)return;const o=_t(e),c=zn(e),i={...j(e),label:s.label,category:s.category,endpoint:s.endpoint,cacheKey:Qa(s),refreshMs:s.refreshMs,staleMs:s.staleMs,pageSize:s.pageSize,maxPageSize:s.maxPageSize,supportsPagination:!!s.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:a,lastFetchAt:new Date().toISOString(),resultCount:o,renderedCount:c,hasMore:o>c,stale:a!=="success"||jn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};n.terminalFeeds={...n.terminalFeeds,[e]:i},Yc(e,{requestId:t,status:a,reason:i.lastReason,resultCount:o,renderedCount:c,hasMore:i.hasMore,stale:i.stale,errorCode:i.errorCode,errorMessage:i.errorMessage})}function hh(e=n.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function gh(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function te(e=n.activeTab,t={}){const a=L(),r=Xe(e);if(!r)return null;if(t.ifStale&&Jc(e)&&!jn(e))return j(e);if(j(e).inFlight){const d=Number(Io.get(e)||0);if(!d||Date.now()-d<15e3)return j(e);n.terminalFeeds={...n.terminalFeeds,[e]:{...j(e),inFlight:!1}}}const s=gh(t),o=Date.now(),c=Number(Io.get(e)||0);if(!s&&c&&o-c<xn)return j(e);if(hh(e)&&!n.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return hi(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),j(e);Io.set(e,o);const i=fh(e,t);if(s&&t.renderStart!==!1){const d=n.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:d})}try{if(e==="terminal"){const d=[an({silent:!0,force:!!t.force})];n.kolWallet||d.push(ss(n.kolMode,"",{silent:!0})),await Promise.race([Promise.allSettled(d),new Promise(u=>setTimeout(u,13e3))])}else if(e==="live")await ts({silent:t.silent!==!1,bucket:n.livePairBucket,force:!!t.force});else if(e==="liveTrades")n.user&&n.token&&await ca({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const d=[an({silent:!0,force:!!t.force}),Xn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];n.kolScan||d.push(ss(n.kolMode,n.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(d)}else if(e==="kol")await ss(n.kolMode,n.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await ed({silent:t.silent!==!1});else if(e==="sniper")await Xn(n.scanMode,{silent:t.silent!==!1});else if(e==="positions")n.user&&n.token&&await St({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:Ro});else if(["wallets","pnl"].includes(e))n.user&&n.token&&await He({force:!!t.force,deep:!1});else if(e==="smartChart")n.user&&n.token&&await He({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const d=[an({silent:!0,force:!!t.force})];n.user&&n.token&&d.push(ca({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(d)}else if(e==="launch"||e==="launchCoin"){const d=[an({silent:!0,force:!!t.force})];n.scan||d.push(Xn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),n.user&&n.token&&d.push(ca({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(d)}else e==="ogreTek"&&await xr({silent:!0}).catch(d=>{n.ogreTek.error=d.message});return hi(e,i,"success"),j(e)}catch(d){if(hi(e,i,"error",{errorCode:d?.code||d?.name||"REFRESH_FAILED",errorMessage:D(d?.message||"Feed refresh failed.")}),t.throwOnError)throw d;return j(e)}finally{K("feed-refresh",a,{component:r.component||e,resultCount:_t(e),cacheHit:!!j(e).cacheHit,stale:jn(e),requestId:j(e).lastRequestId||"",errorCode:j(e).errorCode||"",details:`${e}:${Qa(r)}`}),t.render!==!1&&(!s&&Si()?od():h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"&&e==="smartChart"}))}}async function en(e={}){const t=n.activeTab||"terminal",a=[te(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(a)}function Zr(e="terminal-entry"){n.route==="terminal"&&(en({silent:!0,ifStale:!0,reason:e}).catch(t=>$(t.message)),n.user&&n.token&&He({force:!0,deep:!1,reason:e}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})}))}function gi(){const e=()=>{Na&&clearTimeout(Na),Na=null,Nr=""};if(n.route!=="terminal"||document.hidden){e();return}const t=Xe(n.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(n.activeTab)){e();return}const a=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${n.activeTab}:${Qa(t)}:${a}`;Na&&Nr===r||(e(),Nr=r,Na=setTimeout(async()=>{Na=null,Nr="",!(n.route!=="terminal"||document.hidden)&&(await te(n.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(s=>$(s.message)),gi())},a))}function tn(e){const t=String(e||"live");return Et.some(([a])=>a===t)?t:"live"}function Qc(e=n.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function es(e=n.activeTab){return e==="slimeScope"?Qc(n.slimeScopeMode):tn(n.livePairBucket)}function qe(e=es()){const t=tn(e);return n.livePairsByBucket[t]||(t===n.livePairBucket?n.livePairs:null)||null}function ua(e=es()){const t=tn(e);return n.livePairsLastUpdatedByBucket[t]||(t===n.livePairBucket?n.livePairsLastUpdatedAt:"")||""}function Zc(e=[]){return Array.isArray(e)&&e.length>0}function Ee(e={},t={},a=[]){for(const r of a){const s=e?.[r];if(s!=null&&s!=="")return s}for(const r of a){const s=t?.[r];if(s!=null&&s!=="")return s}return""}function bh(e=[],t=[]){const a=new Map((Array.isArray(e)?e:[]).map(r=>[va(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const s=a.get(va(r));return s?{...s,...r,tokenMint:Ee(r,s,["tokenMint","mint","tokenAddress","address"]),mint:Ee(r,s,["mint","tokenMint","tokenAddress","address"]),symbol:Ee(r,s,["symbol","ticker","shortMint"]),name:Ee(r,s,["name","tokenName","category"]),imageUrl:Ee(r,s,["imageUrl","image","icon","logoURI","logoUrl"]),image:Ee(r,s,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Ee(r,s,["avatarUrl","avatar_url","avatar"]),avatarState:Ee(r,s,["avatarState"]),dexUrl:Ee(r,s,["dexUrl","url"]),pumpUrl:Ee(r,s,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Ee(r,s,["websiteUrl","website"]),twitterUrl:Ee(r,s,["twitterUrl","xUrl"]),telegramUrl:Ee(r,s,["telegramUrl"]),metadata:r?.metadata||s?.metadata||r?.tokenMetadata||s?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||s?.tokenMetadata||r?.metadata||s?.metadata||null,dex:r?.dex||s?.dex||r?.dexScreener||s?.dexScreener||null,pump:r?.pump||s?.pump||r?.pumpFun||s?.pumpFun||null}:r})}async function ts({silent:e=!1,bucket:t=n.livePairBucket,renderOnComplete:a=!0,force:r=!1}={}){const s=L(),o=tn(t),c=o===n.livePairBucket,i=n.terminalSort||"best",d=n.terminalCat||"",u=`${o}:${i}:${d}`,p=na.get(u);if(p?.promise){n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:p.requestId},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const A=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);return!e&&!Zc(A)&&Va(Yl),p.promise}const f=`${Date.now()}:${Math.random().toString(16).slice(2)}`,y=(En[o]||0)+1;En[o]=y;const b=()=>En[o]===y;n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:f},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const v=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);!e&&!Zc(v)&&Va(Yl);const P=(async()=>{try{const A=r?"&force=true":"",g=d?`&cat=${encodeURIComponent(d)}`:"",T=`/api/web/live-pairs?bucket=${encodeURIComponent(o)}&sort=${encodeURIComponent(i)}${g}${A}`,C=await Promise.race([k(T),new Promise((J,Ue)=>window.setTimeout(()=>Ue(new Error("Live feed refresh timed out.")),12e3))]),B=Et.find(([J])=>J===o)?.[1]||"Live",U=n.livePairsByBucket[o]||(c?n.livePairs:null);let H=C.livePairs||{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${B} feed returned no rows yet. Retrying automatically.`};const Se=Array.isArray(H?.rows)?H.rows:[],Ne=Array.isArray(U?.rows)?U.rows:[];if(Se.length===0&&Ne.length>0?H={...U,...H,rows:U.rows,stale:!0,emptyRefresh:!0,message:`${B} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:Se.length>0&&Ne.length>0&&(H={...H,rows:bh(Ne,Se)}),!b())return H;const q=H?.refreshedAt||new Date().toISOString(),Ie={...n.livePairsRefreshErrorByBucket||{}};return delete Ie[o],n.livePairsRefreshErrorByBucket=Ie,n.livePairsByBucket={...n.livePairsByBucket,[o]:H},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:q},c&&(n.livePairs=H,n.livePairsLastUpdatedAt=q),H}catch(A){const g=D(A?.message||"Live feed refresh failed."),T=Et.find(([U])=>U===o)?.[1]||"Live",C=n.livePairsByBucket[o]||(c?n.livePairs:null),B=C?{...C,stale:!0,refreshError:g,message:`Showing last good ${T} feed. Refresh failed, retrying automatically.`}:{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:g,message:`${T} refresh failed. Retrying automatically.`};return b()&&(n.livePairsRefreshErrorByBucket={...n.livePairsRefreshErrorByBucket||{},[o]:g},n.livePairsByBucket={...n.livePairsByBucket,[o]:B},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:B.refreshedAt},c&&(n.livePairs=B,n.livePairsLastUpdatedAt=B.refreshedAt)),B}finally{if(!b())return;const A=n.livePairsByBucket?.[o]?.rows||[];K("live-pairs-refresh",s,{component:"livePairs",resultCount:Array.isArray(A)?A.length:0,stale:!!n.livePairsByBucket?.[o]?.stale,errorCode:n.livePairsRefreshErrorByBucket?.[o]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${o}:${i}`});const g={...n.livePairsLoadingByBucket};(g[o]===f||g[o]===!0)&&(delete g[o],n.livePairsLoadingByBucket=g),n.livePairsLoading=!!g[n.livePairBucket],!e&&c&&(n.loading=!1),a&&(c&&["terminal","live","slimeScope"].includes(n.activeTab)?Va("load-live-pairs-complete"):h())}})();return na.set(u,{requestId:f,requestVersion:y,safeBucket:o,promise:P}),P.finally(()=>{na.get(u)?.requestId===f&&na.delete(u)}),P}async function an({silent:e=!1,force:t=!1,warmAll:a=!1}={}){if(await ts({silent:e,bucket:n.livePairBucket,force:t}),a){const r=Et.map(([s])=>s).filter(s=>s!==n.livePairBucket);await Promise.allSettled(r.map(s=>ts({silent:!0,bucket:s,renderOnComplete:!1,force:t})))}(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope")&&Va(a?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function as(e){const t=tn(n.livePairBucket);for(const a of[...na.keys()])a.startsWith(`${t}:`)&&na.delete(a);En[t]=(En[t]||0)+1,h(),typeof e=="function"?e():an({silent:!0,force:!0})}function pa(){if(Yn()||document.hidden||Ha()||n.activeTab!=="live"&&n.activeTab!=="terminal"&&n.activeTab!=="slimeScope"){Ka();return}const e=es(n.activeTab),a=(n.activeTab==="slimeScope"?12:8)*1e3,r=`${n.activeTab}:${e}:${n.terminalSort}:${a}`;Ea&&Er===r||(Ka(),Er=r,Ea=setTimeout(async()=>{if(Ea=null,Er="",document.hidden||Ha()){pa();return}if(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"){if(n.livePairsLoadingByBucket?.[e]){pa();return}try{n.activeTab==="slimeScope"?await te("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await ts({silent:!0,bucket:n.livePairBucket,force:!1})}catch{}finally{pa()}}},a))}function yh({force:e=!1}={}){if(Yn()||!(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"))return;const a=es(n.activeTab),r=`${a}:${n.terminalSort||"best"}`;Fr.has(r)||n.livePairsLoadingByBucket[a]||!e&&n.livePairsByBucket[a]||(Fr.add(r),window.setTimeout(()=>{const s=n.activeTab==="slimeScope"?te("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):an({silent:!0,force:!0,warmAll:!1});Promise.resolve(s).catch(o=>$(o.message)).finally(()=>{Fr.delete(r),pa()})},900))}function ns(){const e=()=>{Fa&&clearTimeout(Fa),Fa=null,Wr=""};if(document.hidden||n.activeTab!=="sniper"){e();return}const t=`${n.activeTab}:${n.scanMode}`;Fa&&Wr===t||(e(),Wr=t,Fa=setTimeout(async()=>{if(Fa=null,Wr="",document.hidden){ns();return}if(n.activeTab==="sniper"){if(n.loading){ns();return}try{await Xn(n.scanMode,{silent:!0})}catch(a){$(a.message)}finally{ns()}}},2e4))}function Gn(){const e=()=>{Wa&&clearTimeout(Wa),Wa=null,_r=""};if(Yn()||document.hidden||n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet){e();return}const t=String(n.kolMode||"hot"),s=t==="hot"||t==="fresh"?1e4:3e4,o=`${n.activeTab}:${n.kolMode}:${s}`;Wa&&_r===o||(e(),_r=o,Wa=setTimeout(async()=>{if(Wa=null,_r="",document.hidden){Gn();return}if(!(n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet)){if(n.kolLoading){Gn();return}try{await ss(n.kolMode,"",{silent:!0})}catch(c){$(c.message)}finally{Gn()}}},s))}function rs(){const e=()=>{Da&&clearTimeout(Da),Da=null,Dr=""};if(Yn()||document.hidden||n.activeTab!=="watchlist"&&n.activeTab!=="terminal"||!n.user||!n.token){e();return}const t=`${n.activeTab}:${n.user?.id||"guest"}`;Da&&Dr===t||(e(),Dr=t,Da=setTimeout(async()=>{if(Da=null,Dr="",document.hidden){rs();return}if(!(n.activeTab!=="watchlist"&&n.activeTab!=="terminal"))try{await ed({silent:!0})}catch(a){$(a.message)}finally{rs()}},3e4))}async function Xn(e=n.scanMode,t={}){const a=L(),r=!!t.silent;n.scanMode=e,r||(n.loading=!0,h());try{const s=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);n.scan=s.scan}finally{K("scanner-refresh",a,{component:"sniper",resultCount:Array.isArray(n.scan?.candidates)?n.scan.candidates.length:0,details:e}),r||(n.loading=!1),h()}}async function ss(e=n.kolMode,t=n.kolWallet,a={}){const r=L(),s=!!a.silent;n.kolMode=e,n.kolWallet=String(t||"").trim();let o="";n.kolWallet&&!Ut(n.kolWallet)&&(n.kolWallet="",o="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!s&&!n.kolScan&&(n.loading=!0),n.kolLoading=!0,n.kolStatus=o||(n.kolWallet?"Scanning custom KOL wallet...":`Loading ${lr(n.kolMode)}...`),$(""),s||h();try{const c=new URLSearchParams({mode:e});n.kolWallet&&c.set("wallet",n.kolWallet);const i=await k(`/api/web/kol/scan?${c.toString()}`);n.kolScan=i.scan,n.kolLastUpdatedAt=new Date().toISOString(),n.kolStatus=i.scan?.message||`${lr(n.kolMode)} loaded.`,n.kolDumpStatsLoadedAt=0}catch(c){throw n.kolStatus=c.message||"KOL scan failed.",c}finally{K("kol-refresh",r,{component:"kol",resultCount:Array.isArray(n.kolScan?.rows)?n.kolScan.rows.length:Array.isArray(n.kolScan?.signals)?n.kolScan.signals.length:0,errorCode:n.kolStatus&&/failed/i.test(n.kolStatus)?"KOL_REFRESH_FAILED":"",details:n.kolWallet?"wallet":e}),s||(n.loading=!1),n.kolLoading=!1,h()}}async function ed(e={}){if(!n.user||!n.token)return;const t=L(),a=!!e.silent;n.watchlistLoading=!0,a||h();try{const r=await k("/api/web/watchlist");n.watchlist=r.watchlist||{rows:[],count:0}}finally{K("watchlist-refresh",t,{component:"watchlist",resultCount:n.watchlist?.count||n.watchlist?.rows?.length||0}),n.watchlistLoading=!1,h()}}function vh(){return n.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function wh(){const e=Number(n.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function Dt(){return vh()+wh()}const Sh=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function Fe(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function kh(){const e=new Map,t=(a={})=>{const r=Fe(a.mint||a.tokenMint||"");if(!r||e.has(r))return;const s=a.balance??a.uiAmount??a.amount??a.uiBalance??"";e.set(r,{mint:r,symbol:String(a.symbol||a.shortMint||(r==="SOL"?"SOL":S(r))||"").trim(),name:String(a.name||a.label||"").trim(),balance:s,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${Dt().toFixed(4)} SOL`}),lt().forEach(a=>t({mint:a.tokenMint||a.mint,symbol:a.symbol||a.shortMint,name:a.name||"",balance:a.uiAmount||a.amountToken||"",kind:"wallet"})),(n.balances||[]).forEach(a=>{(a.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function bi(e={}){const t=new Map,a=(s={})=>{const o=Fe(s.mint||s.tokenMint||"");!o||t.has(o)||t.set(o,{mint:o,symbol:String(s.symbol||s.shortMint||(o==="SOL"?"SOL":S(o))||"").trim(),name:String(s.name||s.label||"").trim(),balance:s.balance??s.uiAmount??s.amount??"",kind:s.kind||s.source||"held"})};return kh().forEach(a),e.walletOnly||Sh.forEach(s=>{s.mint!=="SOL"&&a(s)}),[...t.values()]}function td(e=""){const t=Fe(e);return bi().find(a=>a.mint===t)||null}function ad(e="",t={}){const a=Fe(e),r=t.includeCustom!==!1,s=bi({walletOnly:!!t.walletOnly}),o=s.some(d=>d.mint===a);return`${s.map(d=>{const u=d.mint==="SOL"?`SOL${d.balance?` - ${d.balance}`:""}`:`${d.symbol||S(d.mint)}${d.kind==="wallet"?` - ${d.balance?`${d.balance} `:""}in wallet`:d.name?` - ${d.name}`:""}`;return`<option value="${l(d.mint)}" ${a===d.mint?"selected":""}>${l(u)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!a||!o)?"selected":""}>Custom CA</option>`:""}`}function yi(){const e=Fe(n.tradeSwapFrom||"SOL")||"SOL";return bi({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function nd(){const e=yi(),t=Fe(n.tradeSwapTo||""),a=Fe(n.tradeToken||"");return t&&t!==e?t:a&&a!==e||e==="SOL"?a:"SOL"}function $h(){const e=yi(),t=nd();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||Fe(n.tradeToken||"")?n.swapDirection==="sell"?"sell":"buy":"select"}function Th(e="buy"){const t=Fe(m("[data-swap-from]")?.value||n.tradeSwapFrom||""),a=Fe(m("[data-swap-to]")?.value||n.tradeSwapTo||""),r=String(m("[data-trade-token]")?.value||n.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:a&&a!=="SOL"?a:r}function rd(){return(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey?(n.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const a=String(t.mint||t.tokenMint||"").trim();return{tokenMint:a,shortMint:t.shortMint||S(a),symbol:t.symbol||t.shortMint||S(a),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||Z(a),pumpUrl:Qf(a),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function lt(){const e=new Set,t=[];for(const a of[...n.positions||[],...rd()]){const r=String(a?.tokenMint||a?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(a))}return t}function vi(){const e=n.connectedWalletBalance?.publicKey||n.user?.connectedWallet?.publicKey||"";return n.wallets.length+(e?1:0)}function wi(){return n.pnl?.totals?.realizedSol||"+0 SOL"}function nn(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Jn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function os(){if(n.walletRefreshing||n.walletRefreshStatus==="refreshing")return"Syncing";if(n.walletRefreshStatus==="timeout")return"Delayed";if(n.walletRefreshError||n.walletRefreshStatus==="error")return"Retry";const e=nn(n.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function Ah(){const e=ce("trade",n.selectedTradePresetId),t=ce("bundle",n.selectedBundlePresetId),a=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${a} | ${r}`}async function sd(){if(!n.user||!n.token)return;const e=L();try{const[t,a]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(n.pnl=t.value.pnl||n.pnl||null),a.status==="fulfilled"&&(n.tradePlans=a.value.plans||n.tradePlans||[],Ls()),K("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(n.tradePlans?.length||0)+(n.pnl?1:0),details:"pnl,trade-plans"})}catch(t){K("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:D(t?.message||"Post-trade supplemental refresh failed.")})}}function Ph(e=350,t={}){Ur&&window.clearTimeout(Ur),Ur=window.setTimeout(async()=>{if(Ur=null,!(!n.user||!n.token))try{t.reason==="post-trade"?await Promise.all([sd(),St({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([ca({force:!1,skipCore:!0,silent:!0}),St({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(a){n.walletRefreshError=a.message||"Background refresh failed.",h()}},e)}async function He({force:e=!1,deep:t=!1,reason:a="manual"}={}){if(!n.user||!n.token)return n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="Wallet not connected",Oe("[data-sync-health]","Wallet not connected"),je("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(a||"").toLowerCase(),s=r==="manual_header_click",o=r.includes("post-trade");if(e&&!t&&!o&&!s&&Date.now()-ic<Xm?(e=!1,W({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!o&&(ic=Date.now()),ta)return W({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),n.positionRefreshAction?.state==="clicked"&&Xa("refreshing",{startedAt:n.positionRefreshAction.startedAt||L()}),ta.finally(()=>{if(["clicked","refreshing"].includes(n.positionRefreshAction?.state)){const d=n.walletRefreshStatus==="error"||n.walletRefreshStatus==="timeout";je(d?"error":"success",{error:d?D(n.walletRefreshError||"Refresh delayed"):""})}});const c=L(),i=++hf;return n.walletRefreshRequestId=i,ta=(async()=>{let d={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};n.positionRefreshAction?.state==="clicked"&&Xa("refreshing",{startedAt:n.positionRefreshAction.startedAt||c}),n.walletRefreshing=!0,n.walletRefreshStatus="refreshing",n.walletRefreshError="",Oe("[data-sync-health]",os()),Ot("[data-refresh-spinner]",!1),ue(),aa&&window.clearTimeout(aa),aa=window.setTimeout(()=>{aa=null,!(n.walletRefreshRequestId!==i||!n.walletRefreshing)&&(n.walletRefreshing=!1,n.walletRefreshStatus==="refreshing"&&(n.walletRefreshStatus="timeout"),ta=null,je("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))},Bo+6e3),await xe(20);try{if(await Promise.race([pi({force:e,deep:t,preserveSmartChartFrame:n.activeTab==="smartChart",requestId:i,timeoutMs:Bo}),new Promise((u,p)=>window.setTimeout(()=>p(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),Bo))]),n.walletRefreshRequestId!==i)return d={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:L()-c,fromCache:!1,degraded:!0},d;n.walletRefreshRequestId===i&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshStatus="success"),t?await ca({force:e,skipCore:!0,silent:!0}):((s||o)&&St({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${a}-positions-values`,timeoutMs:Qt}).then(u=>{u?h({preserveSmartChartFrame:n.activeTab==="smartChart"}):Qr(`${a}-positions-values-failed`)}).catch(()=>Qr(`${a}-positions-values-failed`)),Ph(o?200:350,{reason:a})),K("wallet-refresh-total",c,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:t?"deep":`core-plus-background:${a}`}),je("success",{error:""}),d={ok:!0,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:"",durationMs:L()-c,fromCache:!1,degraded:!1}}catch(u){const p=u?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(u?.message||""));n.walletRefreshRequestId===i&&(n.walletRefreshStatus=p?"timeout":"error",n.walletRefreshError=u.message||"Refresh failed."),p&&!r.includes("auto-retry")&&n.user&&n.token&&window.setTimeout(()=>{n.user&&n.token&&n.walletRefreshStatus!=="success"&&He({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),K("wallet-refresh-total",c,{component:"wallet",errorCode:u?.code||u?.name||"WALLET_REFRESH_FAILED",details:D(n.walletRefreshError)}),je("error",{error:D(n.walletRefreshError)}),$(n.walletRefreshError),d={ok:!1,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:D(n.walletRefreshError),durationMs:L()-c,fromCache:!1,degraded:!0}}finally{aa&&(window.clearTimeout(aa),aa=null),n.walletRefreshRequestId===i&&(n.walletRefreshing=!1),ta=null,h({preserveSmartChartFrame:n.activeTab==="smartChart"})}return d})(),ta}async function kt({force:e=!0,reason:t="manual_header_click",deep:a=!1}={}){return He({force:e,reason:t,deep:a})}function Yn(){return!!n.postTradeRefresh?.active&&Number(n.postTradeRefresh?.activeUntil||0)>Date.now()}async function p0(e="",t="legacy-post-trade"){V(e,t)}function V(e="",t="post-trade",a={}){e&&(n.lastTradeSignature=e),It.length&&(It.forEach(o=>window.clearTimeout(o)),It=[]);const r=a.tradeAttemptId||wt("post-trade"),s=Array.isArray(a.affectedKeys)&&a.affectedKeys.length?a.affectedKeys.slice(0,12).map(o=>ke(o,48)):af;n.postTradeRefresh={active:!0,attemptId:r,action:ke(t,70),signaturePresent:!!e,invalidatedKeys:s,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},W({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:s.length,details:s.join(",")}),Ym.forEach(o=>{const c=window.setTimeout(()=>{It=It.filter(p=>p!==c);const i=Number(n.postTradeRefresh?.requestCount||0)+1;n.postTradeRefresh={...n.postTradeRefresh||{},requestCount:i},W({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:n.postTradeRefresh.requestCount,details:t});const d=L();(i<=1?He({force:!0,deep:!1,reason:"post-trade"}):Promise.all([St({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Qt}),sd()])).catch(p=>{n.walletRefreshError=p.message||"Post-trade refresh failed.",n.postTradeRefresh={...n.postTradeRefresh||{},errors:[...n.postTradeRefresh?.errors||[],D(p.message||"Post-trade refresh failed.")].slice(-5)},W({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:L()-d,requestId:r,errorCode:p?.code||p?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{n.postTradeRefresh={...n.postTradeRefresh||{},refreshedKeys:[...new Set([...n.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:It.length>0,activeUntil:It.length>0?Date.now()+8e3:Date.now()},W({component:"post-trade",action:"post-trade-refresh-end",durationMs:L()-d,requestId:r,resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:n.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})})},o);It.push(c)}),ue()}function We({title:e="Confirm",lines:t=[],confirmLabel:a="Confirm",cancelLabel:r="Cancel",danger:s=!1,input:o=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
`);return o?Promise.resolve(window.prompt(c||e,o.value||"")):Promise.resolve(window.confirm(c||e))}return new Promise(c=>{const i=document.createElement("div");i.className="slime-confirm-overlay",i.innerHTML=`
      <div class="slime-confirm-card" role="dialog" aria-modal="true" aria-label="${l(e)}">
        <h3 class="slime-confirm-title">${l(e)}</h3>
        ${[].concat(t).filter(Boolean).map(v=>`<p class="slime-confirm-line">${l(v)}</p>`).join("")}
        ${o?`
          <label class="slime-confirm-input-label">
            ${l(o.label||"")}
            <input class="slime-confirm-input" type="${l(o.type||"text")}" value="${l(o.value||"")}" placeholder="${l(o.placeholder||"")}" ${o.inputmode?`inputmode="${l(o.inputmode)}"`:""}>
          </label>`:""}
        <div class="slime-confirm-actions">
          <button type="button" class="slime-confirm-cancel">${l(r)}</button>
          <button type="button" class="slime-confirm-accept${s?" is-danger":""}">${l(a)}</button>
        </div>
      </div>
    `;const d=document.activeElement,u=i.querySelector(".slime-confirm-input"),p=v=>{i.remove(),document.removeEventListener("keydown",b,!0);try{d?.focus?.({preventScroll:!0})}catch{}c(v)},f=()=>p(o?u?.value??"":!0),y=()=>p(o?null:!1),b=v=>{v.key==="Escape"?(v.preventDefault(),y()):v.key==="Enter"&&(!o||v.target===u)&&(v.preventDefault(),f())};i.addEventListener("pointerdown",v=>{v.target===i&&y()}),i.querySelector(".slime-confirm-accept").addEventListener("click",f),i.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",b,!0),document.body.appendChild(i),(u||i.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),u&&u.select()})}function Si(){if(document.hidden&&n.route==="terminal")return!0;const e=document.activeElement;if(!e||n.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function od(){n.pendingRender=!0}function id(){!n.pendingRender||Si()||(n.pendingRender=!1,h({force:!0}))}function ki(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function rn(){if(!de||!Fn||!re)return;const e=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);de.dataset.loading=n.loading?"true":"false",de.dataset.route=n.route,de.dataset.walletConnected=e?"true":"false",e&&lk("shell-wallet-context"),e?kd("shell-wallet-context"):Fl(),e||(n.tpslAutoEnableInFlight=!1,n.tpslAutoEnableScheduledAt=0),ki(Fn,!["intro","login"].includes(n.route)),ki(dc,n.route!=="connect"),ki(re,n.route!=="terminal"),Ot("[data-terminal-global-search]",n.route!=="terminal"),Ot("[data-top-sync-strip]",n.route!=="terminal")}function Qn(){const e=!!(Ce&&n.loginModalOpen),t=!!n.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const a=m("[data-wallet-connect-modal]");a&&(a.style.pointerEvents=a.hidden?"none":"");const r=m("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function $i(e,t=48){if(!e||document.hidden)return!1;try{const a=e.getBoundingClientRect();return a.width<24||a.height<t}catch{return!1}}function ld(e="resume"){if(!de||document.hidden)return;rn(),Qn();const t=`${Date.now()}:${e}`,a=de.style.transform;de.dataset.resumePaint=t,de.style.transform=a?`${a} translateZ(0)`:"translateZ(0)",de.offsetHeight,window.requestAnimationFrame(()=>{!de||de.dataset.resumePaint!==t||(de.style.transform=a,delete de.dataset.resumePaint)})}function Ch(){if(!de)return!1;if(de.dataset.route!==n.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Ce||Ce.hidden||!n.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!n.quickBuyModal?.open;if(e||t||$i(de,80))return!0;if(n.route!=="terminal")return!1;const a=m("[data-panel]");return re?.hidden||$i(re,80)||a&&$i(a,32)||a&&!a.children.length&&!String(a.textContent||"").trim()?!0:![Fn,dc,re].some(s=>s&&!s.hidden)}function Lh(e="watchdog"){const t=n.positionRefreshAction||{},a=t.startedAt?Math.max(0,L()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&a>tf&&(je("error",{error:"Refresh delayed"}),W({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:a,details:e})),n.walletRefreshing&&!ta&&(n.walletRefreshing=!1,n.walletRefreshStatus=n.walletRefreshStatus==="refreshing"?"timeout":n.walletRefreshStatus,Ot("[data-refresh-spinner]",!0)),Qn(),ue()}function cd(e="watchdog",t={}){return Lh(e),Ch()?(W({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-lc),details:`${e}:${n.route}:${n.activeTab||""}`}),ti({keepLogin:n.route==="login"}),rn(),ld(e),h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):(t.forcePaint&&ld(e),!1)}function dd(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function ud(){try{return document.createElement("canvas")}catch{return null}}function pd(){const e=ud();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function xh(){return dd()||pd()}function Ti(){const e=Ge()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Nt(e),typeof window.alert=="function"&&window.alert(e)}function md(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function Zn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function fd(){const e=n.clipFarm?.fileExtension||Zn(n.clipFarm?.mimeType||n.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function er(){try{n.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}n.clipFarm?.fallbackFrameTimer&&clearInterval(n.clipFarm.fallbackFrameTimer),n.clipFarm?.fallbackStopTimer&&clearTimeout(n.clipFarm.fallbackStopTimer)}function Nt(e=""){n.clipFarm={...n.clipFarm,status:String(e||"")},Je()}function Ai(){if(n.clipFarm?.videoUrl)try{URL.revokeObjectURL(n.clipFarm.videoUrl)}catch{}n.clipFarm={...n.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:n.clipFarm?.recording?"Recording...":""},Je()}function Je(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=n.clipFarm||{},a=xh(),r=!!t.recording,s=!!(t.blob&&t.videoUrl),o=t.status||(r?"Recording":s?"Clip ready":"Clip farm");e.innerHTML=`
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
          <a href="https://t.me/share/url?url=${encodeURIComponent(Rt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${o?`<small>${l(o)}</small>`:""}
    </div>
  `}function hd(){const e=we([...qe()?.rows||[],...typeof yr=="function"?yr():[],...n.slimeScopeRows||[],...n.livePairRows||[],...Object.values(n.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:n.smartChartToken||n.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function gd(e,t={}){const a=e?.getContext?.("2d");if(!a)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),s=720,o=1280;(e.width!==s*r||e.height!==o*r)&&(e.width=s*r,e.height=o*r,e.style.width=`${s}px`,e.style.height=`${o}px`),a.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),i=t.rows||hd(),d=new Date;a.fillStyle="#020803",a.fillRect(0,0,s,o);const u=a.createRadialGradient(s*.2,o*.12,20,s*.2,o*.12,460);u.addColorStop(0,"rgba(118,255,45,0.35)"),u.addColorStop(1,"rgba(118,255,45,0)"),a.fillStyle=u,a.fillRect(0,0,s,o),a.strokeStyle="rgba(118,255,45,0.38)",a.lineWidth=2,a.strokeRect(24,24,s-48,o-48),a.fillStyle="#baff4d",a.font="900 34px Arial, sans-serif",a.fillText("SlimeWire REC",48,88),a.fillStyle="#f4fff0",a.font="800 54px Arial, sans-serif",a.fillText("Fresh Live Picks",48,154),a.fillStyle="rgba(226,255,215,0.78)",a.font="700 22px Arial, sans-serif",a.fillText(`Mobile in-site clip - ${d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const p=s-96;a.fillStyle="rgba(118,255,45,0.12)",a.fillRect(48,226,p,12),a.fillStyle="#78ff2d",a.fillRect(48,226,Math.max(24,p*c),12),i.forEach((f,y)=>{const b=292+y*188,v=String(f.symbol||f.baseSymbol||S(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),A=_(f.marketCapLabel,f.fdvLabel,M(ft(f)),"checking"),g=_(f.liquidityLabel,M(ht(f)),"checking"),T=_(f.volumeH1Label,f.volumeLabel,M(f.volumeH1),"checking"),C=String(f.pairAgeLabel||zt(f)||"live").slice(0,18);a.fillStyle="rgba(4,24,8,0.92)",a.strokeStyle="rgba(118,255,45,0.34)",a.lineWidth=2,a.beginPath(),typeof a.roundRect=="function"?a.roundRect(48,b,s-96,156,18):a.rect(48,b,s-96,156),a.fill(),a.stroke(),a.fillStyle="#f4fff0",a.font="900 32px Arial, sans-serif",a.fillText(v,76,b+48),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 18px Arial, sans-serif",a.fillText(P,76,b+78),[["MC",A],["LIQ",g],["VOL",T],["AGE",C]].forEach(([B,U],H)=>{const Se=76+H*140;a.fillStyle="#aaff8f",a.font="800 15px Arial, sans-serif",a.fillText(B,Se,b+114),a.fillStyle="#ffffff",a.font="900 23px Arial, sans-serif",a.fillText(String(U).slice(0,10),Se,b+142)})}),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 20px Arial, sans-serif",a.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,o-78),a.fillStyle="#78ff2d",a.font="900 24px Arial, sans-serif",a.fillText("slimewire.org",48,o-44)}async function Mh(e){gd(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(s=>r(s),"image/png",.92)}catch{r(null)}});if(!t){Ti();return}const a=URL.createObjectURL(t);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:a,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},Je()}async function Bh(){const e=ud();if(!e){Ti();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await Mh(e);return}Ai();const a=hd(),r=Date.now(),s=t.call(e,12),o=md(),c=[],i=new MediaRecorder(s,o?{mimeType:o}:void 0),d=()=>gd(e,{rows:a,progress:(Date.now()-r)/4200});d();const u=setInterval(d,1e3/12);i.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),i.addEventListener("stop",()=>{er();const f=o||"video/webm",y=new Blob(c,{type:f}),b=y.size>0?URL.createObjectURL(y):"",v=Zn(y.type||f);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:b,mimeType:y.type||f,fileExtension:v,status:y.size>0?`Mobile clip ready (.${v}).`:"No mobile clip captured."},Je()},{once:!0}),i.start(500);const p=setTimeout(()=>{n.clipFarm?.recording&&tr()},4300);n.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:o,fileExtension:Zn(o),recorder:i,stream:s,chunks:c,fallbackFrameTimer:u,fallbackStopTimer:p},Je()}async function bd(){if(!dd()){if(pd()){await Bh();return}Ti();return}if(n.clipFarm?.recording){tr();return}Ai();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=md(),a=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",s=>{s.data?.size>0&&a.push(s.data)}),r.addEventListener("stop",()=>{er();const s=t||"video/webm",o=new Blob(a,{type:s}),c=o.size>0?URL.createObjectURL(o):"",i=Zn(o.type||s);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:o.size>0?o:null,videoUrl:c,mimeType:o.type||s,fileExtension:i,status:o.size>0?`Clip ready (.${i}).`:"No clip captured."},Je()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>tr(),{once:!0}),r.start(1e3),n.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:Zn(t),recorder:r,stream:e,chunks:a},Je()}catch(e){er(),n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},Je()}}function tr(){const e=n.clipFarm?.recorder;if(!e){er(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Je();return}try{if(e.state!=="inactive"){Nt("Saving clip..."),e.stop();return}}catch{}er(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Je()}async function Rh(){const e=n.clipFarm?.blob;if(!e){Nt("Record a clip first.");return}const t=new File([e],fd(),{type:e.type||n.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Nt("Shared.");return}}catch(a){if(a?.name==="AbortError"){Nt("Share cancelled.");return}}Nt("Use Save, then attach the clip to X or Telegram.")}function Ih(){const e=n.clipFarm?.videoUrl;if(!e){Nt("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=fd(),document.body.appendChild(t),t.click(),t.remove(),Nt("Saved.")}function Oh(e=null,t="chartTxns"){const a=e||Vs(),r=String(a?.tokenMint||n.smartChartToken||"").trim();return r?{mint:r,mode:t,src:lp(a,t)}:null}function Eh(e={}){if(e.refreshSmartChartFrame||n.route!=="terminal"||n.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),a=t?.querySelector("iframe");if(!t||!a)return null;const r=String(t.dataset.chartMode||"chartTxns"),s=Oh(null,r);if(!s||t.dataset.chartMint!==s.mint||t.dataset.chartMode!==s.mode)return null;const o=String(t.dataset.chartSrc||a.getAttribute("src")||""),c=t.dataset.loaded==="true",i=o!==s.src;return t.dataset.preserving="true",{frame:t,mint:s.mint,mode:s.mode,src:i?o:s.src,loaded:c,keepByMint:i}}function Fh(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),a=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${a}"]`),s=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||s!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!de||!Fn||!re)return;if(rn(),!e.force&&Si()){od();return}const t=L(),a=`${n.route}:${n.activeTab||"none"}`;try{n.perfRenderCounts={...n.perfRenderCounts||{},[a]:(n.perfRenderCounts?.[a]||0)+1},n.pendingRender=!1;const r=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);rn(),de.dataset.activeTab=n.activeTab||"";const o=!!((e.preserveSmartChartFrame||n.activeTab==="smartChart")&&n.route==="terminal"&&n.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Eh(e):null,c=!!Ce,i=!!(c&&n.loginModalOpen);Jo&&(Jo.hidden=c||!!n.user||n.loginCollapsed),Ot("[data-connect-login-panel]",c||!!n.user||n.loginCollapsed),Ce?(Ce.hidden=!i,Ce.setAttribute("aria-hidden",i?"false":"true"),Ce.toggleAttribute("inert",!i),document.body.classList.toggle("login-modal-open",i),document.querySelectorAll("[data-login-tab]").forEach(v=>{const P=v.dataset.loginTab===n.loginModalTab;v.dataset.active=P?"true":"false",v.setAttribute("aria-selected",P?"true":"false")}),Ot("[data-login-modal-login-section]",n.loginModalTab!=="login"),Ot("[data-login-modal-create-section]",n.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),uc&&(uc.hidden=!1),pc&&(pc.hidden=!!n.user),mc&&(mc.hidden=!n.user),rn(),Oe("[data-user-id]",n.user?.id||"guest"),Oe("[data-wallet-count]",vi()),Oe("[data-total-sol]",Dt().toFixed(4));const d=lt();Oe("[data-position-count]",d.length),Oe("[data-realized]",wi());try{const v=m("[data-realized]");if(v){const P=/-/.test(String(wi()||""));v.classList.toggle("metric-neg",P),v.classList.toggle("metric-pos",!P)}}catch{}Oe("[data-top-sol]",`${Dt().toFixed(4)} SOL`),Oe("[data-top-portfolio]",`${d.length} position${d.length===1?"":"s"}`),Oe("[data-sync-health]",r?os():"Sync idle"),Oe("[data-active-preset-label]",Ah()),Ci(),Dh(),Ot("[data-refresh-spinner]",!n.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(v=>{v.hidden=!Um||!Fm(Ae)});const u=m("[data-user-avatar]");u&&(u.innerHTML=sn("SW"));const p=m("[data-top-avatar]");p&&(p.innerHTML=sn("SW"));const f=n.user?.connectedWallet||null;Oe("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${S(f.publicKey)}`:n.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=m("[data-logout]");y&&(y.hidden=!n.user,y.disabled=!!n.logoutPending,w(y,n.logoutPending?"Logging out...":"Log Out")),n.route==="terminal"&&Gh(),Fh(o),vg(),Sg(),sl(),Ta(),Aa(),Cs(),Tr(),rt(),Sn(),kl(),n.route==="terminal"&&n.user&&!n.returnSummaryFetched&&(n.returnSummaryFetched=!0,Nw()),Je(),E(),Zw("render"),Qn(),ue();const b=L()-t;(b>=16||n.perfRenderCounts[a]%20===0)&&W({component:"render",action:"render",durationMs:b,resultCount:n.perfRenderCounts[a],details:a}),lc=Date.now()}catch(r){rn(),Qn(),ri({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const s=m("[data-panel]");n.route==="terminal"&&s?(re.hidden=!1,s.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. Tap retry to redraw this panel without closing the window.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `):n.route==="terminal"&&re&&(re.hidden=!1,re.innerHTML=`
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. The display refresh failed, but the app did not reload or submit another order.</p>
            <button type="button" class="primary" data-refresh-all>Retry Refresh</button>
          </article>
        </section>
      `),$("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function yd(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const a=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(a)return`connected:${String(a).toLowerCase()}`;const r=Array.isArray(n.wallets)&&n.wallets.length?n.wallets.map(s=>s.publicKey||s.address||s.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function Wh(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${yd(e)}`)==="yes"}catch{return!1}}function vd(e,t=""){try{const a=`tpslAutoRevoked:${yd(t)}`;e?sessionStorage.setItem(a,"yes"):sessionStorage.removeItem(a)}catch{}}function Pi(e=""){vd(!1,e)}function wd(){return!!(Array.isArray(n.wallets)&&n.wallets.length||n.user?.connectedWallet||n.connectedWalletBalance?.publicKey)}function Sd(){const e=n.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),a=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!n.user?.automationPermissionActive&&!a&&!e.revokedAt}function _h(){return!(!wd()||Wh()||Sd()||n.tpslAutoEnableInFlight)}function kd(e="wallet-session"){if(!_h())return;const t=L();n.tpslAutoEnableScheduledAt&&t-n.tpslAutoEnableScheduledAt<2e3||(n.tpslAutoEnableScheduledAt=t,n.tpslAutoEnableInFlight=!0,setTimeout(()=>{Xi("enable",{auto:!0,reason:e}).catch(a=>{n.automationDelegationStatus=a?.message||"TP/SL auto-enable failed.",$(n.automationDelegationStatus)}).finally(()=>{n.tpslAutoEnableInFlight=!1,Ci()})},50))}function Ci(){const e=m("[data-tpsl-status-button]");if(!e)return;const t=m("[data-tpsl-status-label]"),a=n.user?.automationPermission||{},r=!!n.user?.automationPermissionActive,s=!!a.revokedAt,o=Date.parse(a.expiresAt||""),c=!!a.enabled&&Number.isFinite(o)&&o<=Date.now(),i=r?"enabled":s||c?"invalid":"disabled";e.dataset.tpslState=i;const d=i==="enabled"?"TP/SL Enabled":i==="invalid"?"Re-enable TP/SL":"Enable TP/SL";w(t,d),e.setAttribute("aria-label",`${d}. Stop loss and take profit require wallet auto-sell approval.`),e.title=i==="enabled"?`Server exits enabled${a.expiresAt?` until ${Te(a.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Dh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0,r=!!(t||a),s=r?"Connected":"Connect",o=t?"Wallet: Connected":a?`Wallets: ${a}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${S(t)}`:a?`${a} SlimeWire wallet${a===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(i=>{i.dataset.walletState=r?"connected":"disconnected",i.title=c,i.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const d=i.querySelector("[data-top-wallet-connect-label]")||i;w(d,s)}),document.querySelectorAll("[data-top-wallet-status]").forEach(i=>{i.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",i.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",i.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),w(i,o)})}async function Nh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0;if(t){await We({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${S(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await Mu();return}if(a>0){Pe("/terminal","wallets");return}ma({returnPath:"/terminal"})}function Uh(e=document){const t=()=>{const a=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!a)return;const r=Math.max(0,a.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const $d=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),qh=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Hh(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function ar(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function Li(e=m("[data-panel]")){if(!e||n.route!=="terminal"||!$d.has(n.activeTab))return null;const t=e.dataset.renderedTab,a=document.scrollingElement||document.documentElement,r={tab:n.activeTab,windowY:window.scrollY||0,documentY:a?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:re?.scrollTop||0,anchorKey:"",anchorTop:0},s=Array.from(e.querySelectorAll(qh));if(t&&t!==n.activeTab&&!s.length||!s.length)return r;const o=s.find(i=>{const d=i.getBoundingClientRect(),u=ar()?42:72;return d.bottom>u&&d.top<Math.min(window.innerHeight||720,720)})||s[0],c=o?.dataset?.tokenChart||o?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:o?o.getBoundingClientRect().top:0}}function xi(e,t=m("[data-panel]")){if(!e||n.route!=="terminal"||e.tab!==n.activeTab)return;const a=(o,c)=>{if(!o||!Number.isFinite(Number(c))||o.scrollHeight<=o.clientHeight+2)return;const i=Math.max(0,Math.min(Number(c),o.scrollHeight-o.clientHeight));Math.abs((o.scrollTop||0)-i)>4&&(o.scrollTop=i)},r=o=>{const c=document.scrollingElement||document.documentElement;a(re,e.dashboardScrollTop),a(o,e.panelScrollTop),a(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},s=()=>{const o=t?.isConnected?t:m("[data-panel]");let c=!1;if(e.anchorKey&&o){const i=Hh(e.anchorKey),d=o.querySelector(`[data-token-chart="${i}"], [data-token-mint="${i}"]`);if(d){const p=d.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(p)&&Math.abs(p)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+p)),c=!0}}c||r(o)};s(),requestAnimationFrame(()=>{s(),window.setTimeout(s,90),window.setTimeout(s,240),ar()&&window.setTimeout(s,520)})}function Td(e,t){const a=Object.keys(e.dataset||{}).filter(o=>o!=="customFor"&&o!=="customSelect").sort().map(o=>`${o}=${e.dataset[o]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",s=`${e.tagName}:${e.type||""}:${e.name||""}:${a}${r}`;return a?s:`${s}:idx${t}`}function Ad(e){const t=Array.from(e.options||[]),a=t.find(r=>r.defaultSelected);return a?a.value:t[0]?.value??""}function Kh(e){if(!e||e.dataset.renderedTab!==n.activeTab)return null;const t=new Map;let a="",r=null,s=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((o,c)=>{const i=Td(o,c);if(t.has(i))return;const d=o.type==="checkbox"||o.type==="radio",u=o.tagName==="SELECT",p=d?String(o.defaultChecked):u?Ad(o):o.defaultValue,f=d?String(o.checked):o.value;if(f!==p&&(t.set(i,{value:f,defaultValue:p,isToggle:d,isSelect:u}),document.activeElement===o)){a=i;try{r=o.selectionStart,s=o.selectionEnd}catch{}}}),t.size?{tab:n.activeTab,fields:t,focusedKey:a,selectionStart:r,selectionEnd:s}:null}function Vh(e,t){if(!e||!t||e.tab!==n.activeTab)return;const a=Array.from(t.querySelectorAll("input, textarea, select")),r=s=>{a.forEach((o,c)=>{const i=o.tagName==="SELECT";if(s!==i)return;const d=Td(o,c),u=e.fields.get(d);if(!u)return;const p=o.type==="checkbox"||o.type==="radio";if((p?String(o.defaultChecked):i?Ad(o):o.defaultValue)===u.defaultValue&&(p?o.checked=u.value==="true":o.value=u.value,d===e.focusedKey&&document.activeElement!==o))try{o.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&o.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function zh(e){return!e||n.route!=="terminal"||n.activeTab==="terminal"||$d.has(n.activeTab)||e.dataset.renderedTab!==n.activeTab||n.activeTab==="smartChart"&&n.chartScrollIntoView?null:{tab:n.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:re?.scrollTop||0}}function jh(e,t){if(!e||e.tab!==n.activeTab)return;const a=()=>{const r=t?.isConnected?t:m("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),re&&re.scrollHeight>re.clientHeight+2&&(re.scrollTop=Math.min(e.dashboardScrollTop,re.scrollHeight-re.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};a(),requestAnimationFrame(a)}function Gh(){const e=m("[data-panel]");if(!e)return;const t=Li(e),a=Kh(e),r=zh(e),s=n.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,o=n.activeTab==="terminal"?window.scrollY:0;document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),Ik();try{document.body.classList.toggle("launch-focus",window.location.pathname.includes("/launch-coin")&&n.activeTab==="launchCoin")}catch{}if(document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===n.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const i=!!c.querySelector('[data-active="true"]'),d=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!d||!!n.navTekOpen||!pf()&&i}),n.activeTab==="terminal"&&(e.innerHTML=Zp()),n.activeTab==="tek"&&(e.innerHTML=Jh()),n.activeTab==="dashboard"&&(e.innerHTML=ng()),n.activeTab==="profile"&&(e.innerHTML=rg()),n.activeTab==="trade"&&(e.innerHTML=db()),n.activeTab==="bundle"&&(e.innerHTML=bb()),n.activeTab==="volume"&&(e.innerHTML=_b()),n.activeTab==="live"&&(e.innerHTML=Zp()),n.activeTab==="liveTrades"&&(e.innerHTML=bS()),n.activeTab==="slimeScope"&&(e.innerHTML=Iw()),n.activeTab==="watchlist"&&(e.innerHTML=xS()),n.activeTab==="smartChart"&&(e.innerHTML=oS()),n.activeTab==="launchCoin"&&(e.innerHTML=jb()),n.activeTab==="launch"&&(e.innerHTML=Db()),n.activeTab==="kol"&&(e.innerHTML=dy()),n.activeTab==="ogreAi"&&(e.innerHTML=gb()),n.activeTab==="wallets"&&(e.innerHTML=Ov()),n.activeTab==="positions"&&(e.innerHTML=Dv()),n.activeTab==="pnl"&&(e.innerHTML=Kv()),n.activeTab==="txAudit"&&(e.innerHTML=Gp()),n.activeTab==="sniper"&&(e.innerHTML=IS()),e.dataset.renderedTab=n.activeTab||"",n.activeTab==="ogreTek"&&(e.innerHTML=US(),e.dataset.renderedTab=n.activeTab||"",DS()),Vh(a,e),vs(e),jh(r,e),["trade","volume","launchCoin","sniper","ogreAi","bundle","positions","pnl"].includes(n.activeTab))try{fa[n.activeTab]&&!e.querySelector("[data-ogre-stage]")&&e.insertAdjacentHTML("afterbegin",ob(n.activeTab)),sb(e)}catch{}if(["terminal","live","kol","slimeScope","watchlist","smartChart"].includes(n.activeTab))try{eb(e,n.activeTab)}catch{}try{Qg()}catch{}if(n.activeTab==="smartChart"&&n.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=m("[data-chart-buy-amount]");c&&c.focus(),n.chartFocusAmountInput=!1}),n.activeTab==="smartChart"&&n.chartScrollIntoView&&(Uh(e),n.chartScrollIntoView=!1),n.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=s),requestAnimationFrame(()=>{Math.abs(window.scrollY-o)>8&&window.scrollTo(0,o);const d=e.querySelector(".terminal-dock");d&&(d.scrollTop=s)})}xi(t,e),yh(),pa(),ns(),Gn(),rs(),gi(),n.activeTab==="kol"&&ji()}function Xh(){const e=n.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${l(n.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${l(Dt().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${l(n.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${l(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Jh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Xh()}
      <div class="tek-tool-grid">
        ${e.map(([t,a,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${l(a)}</strong>
            <small>${l(r)}</small>
          </button>`).join("")}
      </div>
      ${Zh()}
      ${eg()}
    </section>
  `}const Pd="slimewire-ogre-memory";function is(){try{return JSON.parse(localStorage.getItem(Pd)||"{}")||{}}catch{return{}}}function ls(e={}){const t={...is(),...e};try{localStorage.setItem(Pd,JSON.stringify(t))}catch{}return t}function Yh(e,t=""){if(!e)return;const r=(is().recentTokens||[]).filter(s=>s.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),ls({recentTokens:r.slice(0,5)})}(function(){const t=is();t.quickBuy&&!n.quickBuyAmountOverride&&(n.quickBuyAmountOverride=t.quickBuy)})();function Cd(){const t=fr().filter(i=>{const d=Number(i.marketCapUsd??i.marketCap)||0;return d>0&&d<8e3}).length,r=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(i=>["watching","active"].includes(String(i.status||"").toLowerCase())),s=r.filter(i=>{const d=Number(i.lastMovePct??i.wallets?.[0]?.lastMovePct),u=Number(i.takeProfitPct);return Number.isFinite(d)&&Number.isFinite(u)&&u>0&&d>u*.7}).length,o=Number(n.shieldReceipts?.stats?.watching||0),c=Number(n.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${s?` - ${s} near take-profit`:""}`:"",o?`🔎 ${o} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let Ld=!1;function Qh(){if(Ld||Tn().length)return;Ld=!0;const e=Cd(),t=is(),a=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=a.length?` I remember: ${a.join(", ")}.`:"";fe({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function Zh(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...Cd(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${l(t)}</li>`).join("")}
      </ul>
    </section>
  `}function eg(){ag();const e=n.shieldReceipts;if(!e)return`
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
                <strong>$${l(r.symbol||S(r.mint))} <span class="negative">rugged</span></strong>
                <span>Flagged ${l(r.verdict)} (score ${l(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${l(tg(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${l(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function tg(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let xd=0;function ag(){Date.now()-xd<300*1e3||(xd=Date.now(),k("/api/web/shield/receipts").then(e=>{n.shieldReceipts=e,n.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{n.proofStats=e?.alpha||null}).catch(()=>{}))}function ng(){return`
    ${fg()}
    ${cs()}
    <section class="panel-grid">
      ${nr("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${nr("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${nr("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${nr("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${nr("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${Od()}
    ${Id()}
    ${Ed()}
  `}function rg(){if(!Mi())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${Bd(!1)}
        <section class="profile-row-list">
          ${ug()}
          ${Rd()}
        </section>
        ${Md()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:pg()},{key:"login",label:"Login",hint:"Security",html:mg()},{key:"pfp",label:"PFP",hint:"Avatar",html:hg()},{key:"x",label:"X",hint:"Connect X",html:kg()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:sg()},{key:"badges",label:"Badges",hint:"Earned",html:Rd()},{key:"referral",label:"Referral",hint:"Invite & earn",html:$g()},{key:"board",label:"Board",hint:"Top traders",html:Ag()}];return`
    <section class="profile-row-shell">
      ${Bd(!0)}
      ${cn({toolKey:"profile",activeKey:dn("profile","account"),sections:t})}
      ${Md()}
    </section>
  `}function Md(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function sg(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",a=n.pushAlertsEnabled===!0;return`
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
  `}async function og(){const e=m("[data-push-status]");try{w(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){w(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),w(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){w(e,D(t?.message||"Could not create the link."))}}function ig(e){const t="=".repeat((4-e.length%4)%4),a=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(a);return Uint8Array.from([...r].map(s=>s.charCodeAt(0)))}async function lg(){const e=m("[data-push-status]");try{w(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){w(e,"Push alerts are not configured on the server yet.");return}const a=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){w(e,"Notification permission was not granted.");return}const s=await a.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:ig(t.publicKey)}),o=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:s.toJSON()})});n.pushAlertsEnabled=!0,w(e,`Push alerts enabled (${o.devices||1} device${(o.devices||1)===1?"":"s"}).`),h()}catch(t){w(e,D(t?.message||"Could not enable push alerts."))}}async function cg(){const e=m("[data-push-status]");try{const a=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:a.endpoint})}).catch(()=>{}),await a.unsubscribe().catch(()=>{})),n.pushAlertsEnabled=!1,w(e,"Push alerts disabled on this device."),h()}catch(t){w(e,D(t?.message||"Could not disable push alerts."))}}async function dg(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n.pushAlertsEnabled=!!t}catch{}}function Mi(){return!!(ie()?.publicKey||n.user?.connectedWallet?.publicKey||Array.isArray(n.wallets)&&n.wallets.length)}function Bd(e=Mi()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function ug(){const e=ie();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${us().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${l(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${l(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${l(e.shortPublicKey||S(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function pg(){const e=n.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${sn("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${l(e.shortPublicKey||S(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${l(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function mg(){const e=n.user?.username||"";return`
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
  `}function fg(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function nr(e,t,a,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${l(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${l(t)}</h3>
        <p>${l(a)}</p>
      </div>
    </article>
  `}function hg(){const e=!!n.user?.avatar,t=n.xHandle?`@${n.xHandle}`:"";return`
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${sn("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${gg()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${t?`Use ${l(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${n.user.avatarSource?` from ${l(n.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function gg(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,a])=>`
        <button type="button" data-preset-avatar="${l(t)}" data-avatar-label="${l(a)}" aria-label="Use ${l(a)} PFP">
          <img src="${l(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function Rd(){const e=Number(n.pnl?.totals?.tradeCount||0),t=Mi(),a=Number(n.livePairRows?.length||0)+Number(n.terminalEntry?.items?.length||0)+Number(n.livePairsByBucket?.fresh?.length||0),r=!!(n.lastUpdatedAt&&!n.walletRefreshError||n.walletRefreshStatus==="success"),s=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:a>0||!!n.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!ce("trade",n.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(n.livePairRows?.length||n.scan||n.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],o=s.filter(i=>i.earned).length,c=Math.round(o/Math.max(1,s.length)*100);return`
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
        ${s.map(({label:i,detail:d,earned:u,icon:p,quest:f})=>`
          <article class="earned-badge ${u?"is-earned":""}">
            <span class="earned-badge-icon">
              <img src="${l(p)}" alt="" aria-hidden="true">
            </span>
            <span class="earned-badge-quest">${l(f)}</span>
            <strong>${l(i)}</strong>
            <small>${u?"Earned":"Locked"} - ${l(d)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `}function cs(){const e=n.user?.connectedWallet,t=!!n.user?.avatar,a=n.xHandle?`@${n.xHandle}`:"";return`
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
          ${us().map(r=>`
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
        <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||S(e.publicKey))}.`:"Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      ${Bi()}

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${sn("SW")}</div>
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
  `}function m0(){const e=n.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${us().map(t=>`
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
      <small data-wallet-connect-status>${e?`Connected ${l(e.shortPublicKey||S(e.publicKey))}.`:"Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
    ${Bi({compact:!0})}
  `}function Bi({compact:e=!1}={}){const t=n.user?.connectedWallet,a=Array.isArray(n.wallets)?n.wallets.length:0,r=n.wallets.filter(d=>d.sessionWallet),s=n.user?.automationPermission||{},o=!!n.user?.automationPermissionActive,c=s.expiresAt?Te(s.expiresAt):"",i=n.automationDelegationStatus||(a?`${a} managed automation wallet(s) available. ${o?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
      <small data-automation-delegation-status>${l(i)}</small>
    </article>
  `}function ma({returnPath:e="/terminal"}={}){n.walletConnectMenuOpen=!0,n.walletConnectReturnPath=e||"/terminal",n.walletConnectStatus=n.user?.connectedWallet?`Connected ${S(n.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function bg(e={}){return ma(e)}window.openWalletConnectModal=bg;function yg(e){n.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",n.walletFastApprovalsEnabled?"on":"off")}catch{}}function vg(){const e=m("[data-wallet-connect-modal]");if(!e)return;if(!n.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=n.user?.connectedWallet||n.connectedWalletBalance;e.hidden=!1,kn(e,`
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
        ${us().map(a=>`
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
  `,".wallet-connect-dialog")}function wg(){const e=n.quickBuyModal||{},t=Vs()?.tokenMint===e.tokenMint?Vs():ve(e.tokenMint,{source:e.source||"quick-buy-modal"}),a=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=Ri(e.error||e.status||""),s=a||!!r,o=pe(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${gt(t)}
          <div>
            <h3>Quick Buy</h3>
            <p>${l(t.symbol||S(e.tokenMint))} - ${l(S(e.tokenMint))}</p>
          </div>
        </div>
        <button type="button" class="icon-button" data-quick-buy-close aria-label="Close Quick Buy">x</button>
      </div>
      <label>
        Wallet
        <select data-quick-buy-modal-wallet>
          ${ln(e.walletIndex||(ie()?.publicKey?"connected":""))}
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
        <button type="button" class="primary" data-quick-buy-confirm ${s?"disabled":""}>${a?"Working...":r?"Fast Buy Blocked":"Confirm Buy"}</button>
      </div>
      ${o?`<small class="quick-buy-wallet-note">${n.walletFastApprovalsEnabled?"Fast approvals on: the wallet approval should open as soon as you confirm.":"Fast approvals off: you still approve in your wallet before the trade is sent."}</small>`:""}
      <small class="connect-status" data-quick-buy-modal-status ${e.status?"":"hidden"}>${l(e.status||"")}</small>
      ${r?`<small class="warning-text quick-buy-safety-block" data-quick-buy-modal-error>${l(r)}</small>`:`<small class="warning-text" data-quick-buy-modal-error ${e.error?"":"hidden"}>${l(e.error||"")}</small>`}
    </section>
  `}function Ri(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function Sg(){let e=m("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!n.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=wg(),document.body.classList.add("quick-buy-modal-open")}function kg(){const e=!!n.xHandle;return`
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
  `}function $g(){const e=n.user?.referralCode||"",t=`${Rt.replace(/\/+$/,"")}/r/`,a=n.user?.referralLink||(e?`${Rt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=n.user?.referralStats||{},s=Array.isArray(r.referrals)?r.referrals:[];return`
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. This is separate from the trader board.</p>
      </div>
      <div class="referral-stats-grid">
        <span><small>Total earned</small><strong>${l(r.totalSol||"0")} SOL</strong></span>
        <span><small>Payouts</small><strong>${l(r.payoutCount||0)}</strong></span>
        <span><small>Referral users</small><strong>${l(s.length)}</strong></span>
      </div>
      ${s.length?`
        <div class="referral-breakdown">
          ${s.slice(0,6).map(o=>`
            <div class="referral-breakdown-row">
              <span>${l(o.userId||"user")}</span>
              <strong>${l(o.sol||"0")} SOL</strong>
              <small>${l(o.payoutCount||0)} payout${Number(o.payoutCount||0)===1?"":"s"}</small>
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
        ${a?Ye(`Trade faster on SlimeWire. Referral: ${a}`,"Share X"):""}
        ${a?Fd(`Trade faster on SlimeWire. Referral: ${a}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${l(e)}${n.user?.referredByCode?` | Referred by ${l(n.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function Tg(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Rt).pathname.split("/").map(o=>o.trim()).filter(Boolean),s=r.findIndex(o=>o.toLowerCase()==="r");if(s>=0&&r[s+1])return decodeURIComponent(r[s+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function Ag(){const e=n.user?.traderBoardWalletMode||"all",t=Array.isArray(n.user?.traderBoardWalletIndexes)?n.user.traderBoardWalletIndexes:n.wallets.map(a=>String(a.index));return`
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
        ${n.wallets.length?$t("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${n.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function Id(){return`
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
  `}function Od(){return`
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
  `}function Ed(){return n.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ye(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${l(e)}">${l(t)}</button>`}function Fd(e,t="TG"){const a=Ii(e),r=`https://t.me/share/url?url=${encodeURIComponent(Rt)}&text=${encodeURIComponent(a)}`;return`<a href="${l(r)}" target="_blank" rel="noreferrer">${l(t)}</a>`}function Ii(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Rt}`}function Pg(e){const t=e.type==="buy",a=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||S(e.tokenMint)} for ${a}. Chart ${Z(e.tokenMint)}`}function f0(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||S(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function Cg(e,t="Armed timed trade"){return`${t} on ${e.shortMint||S(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Wd(e){return`PnL on ${e.shortMint||S(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function Lg(e){return`Watching ${e.shortMint||S(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function xg(e){return`Watching ${e.symbol||S(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${Z(e.tokenMint)}`}function Mg(e){return`KOL signal ${e.symbol||S(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${Z(e.tokenMint)}`}function Bg(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||S(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function Rg(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Oi(e){const t=String(e||"").trim(),a=t.startsWith("$")?t:t.length>30?S(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${Z(t)}`:"";return`Watching ${a}.${r}`}function _d(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?S(t):`@${t.replace(/^@+/,"")}`}.`}const Ig=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function Ei(e=""){const t=String(e||"").trim().toLowerCase();return Ig.filter(a=>!t||String(a.tier||"").toLowerCase()===t).sort((a,r)=>+!!r.pinned-+!!a.pinned||Number(a.rank||999)-Number(r.rank||999))}function Ut(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function Dd(e=""){const t=String(e||"").trim();return Ut(t)?t:""}function Og(e={}){const t=String(e.wallet||"").trim(),a=Dd(t),r=et(e.twitter||e.x||e.username||"");return{x:r?_i(r):"",wallet:a?`https://solscan.io/account/${encodeURIComponent(a)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(a?Wc(a):"")}}function Eg(e={}){const t=String(e.wallet||"").trim(),a=Dd(t),r=Og(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${l(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${l(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${l(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${a?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(a)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${a?`<button data-kol-scan-wallet="${l(a)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${a?`<button data-kol-copy-wallet="${l(a)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${a?`<button data-copy="${l(a)}">CA</button>`:""}
      ${zi(e)}
    </div>
  `}function Nd(e={},t={}){const a=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${a?"is-compact":""}" data-tier="${l(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${Hd(e,a?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${l(e.tag||"Curated wallet")}</span>
          <h3>${l(e.name||e.twitter||S(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${l(et(e.twitter))}`:l(S(r)||"Social pending")}</p>
        </div>
        <b>#${l(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${l(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${l(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${l(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${l(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${Eg(e)}
    </article>
  `}function Fg(){const e=Ei("hot"),t=Ei("slimewire");return`
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
            ${e.length?e.map(a=>Nd(a)).join(""):F("No curated hot wallets yet","Add wallets to the curated database to pin them here.")}
          </div>
        </article>
        <aside class="curated-kol-side">
          <header>
            <h4>SlimeWire KOLs</h4>
            <p>Supporters and official SlimeWire creators stay highlighted separately.</p>
          </header>
          <div class="curated-kol-list">
            ${t.length?t.map(a=>Nd(a,{compact:!0})).join(""):F("No SlimeWire KOLs yet","Add official supporters here.")}
          </div>
        </aside>
      </div>
    </section>
  `}function sn(e="SW"){const t=Qe(n.user?.avatar||"");if(Ud(t))return`<img src="${l(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${Rl("ogre")}';">`;const a=Rl("ogre");if(e==="SW"||e==="OG")return`<img src="${a}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${l(r)}</span>`}function Ud(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function Qe(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const a=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return a?`https://ipfs.io/ipfs/${encodeURIComponent(a).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function Wg(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function _g(e="",t=""){const a=String(e||"").trim(),r=Qe(t);if(!a||!r||ds(a,r))return"";if(vt.set(a,r),se("avatarCacheHit"),vt.size>900){for(const s of vt.keys())if(vt.delete(s),vt.size<=720)break}return r}function qd(e="",t=""){return`${String(e||"").trim()}|${Qe(t)}`}function Dg(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function ds(e="",t=""){const a=qd(e,t);if(!Zt.has(a))return!1;const r=Number(Or.get(a)||0);return r&&Date.now()-r>Dg(t)?(Zt.delete(a),Or.delete(a),!1):!0}function Ng(e="",t=""){const a=String(e||"").trim(),r=Qe(t);if(!a||!r)return;const s=qd(a,r);if(Zt.add(s),Or.set(s,Date.now()),Zt.size>1200){for(const o of Zt)if(Zt.delete(o),Or.delete(o),Zt.size<=900)break}vt.get(a)===r&&vt.delete(a),se("avatarFetchFailed")}function Fi(e="",...t){const a=String(e||"").trim(),r=a?vt.get(a):"";if(r&&!ds(a,r))return se("avatarCacheHit"),r;r&&vt.delete(a);for(const s of t){const o=Qe(s);if(o&&!ds(a,o))return se("avatarCacheMiss"),o}return se("avatarFallbackShown"),""}window.__slimeRememberAvatar=_g,window.__slimeAvatarLoadFailed=function(t){const a=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Ng(a,r);const s=Qe(t?.dataset?.backupSrc||"");if(s&&!ds(a,s)){t.dataset.backupSrc="",t.dataset.avatarSrc=s,t.src=s;return}const o=Qe(t?.dataset?.proxySrc||""),c=Number(t?.dataset?.avatarRetries||0);if(o&&c<3){t.dataset.avatarRetries=String(c+1),t.hidden=!0,setTimeout(()=>{try{if(!t.isConnected)return;t.hidden=!1,t.src=o+(o.indexOf("?")>=0?"&":"?")+"rt="+(c+1)}catch{}},2600);return}t&&(t.hidden=!0,t.removeAttribute("src"))};function Wi(e){const t=et(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function _i(e=n.xHandle){const t=et(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function Ug(e={}){const t=Qe(e.avatar||e.image||"");if(Ud(t))return t;const a=et(e.twitter||e.x||e.username||"");if(a)return Wi(a);const r=et(e.name||e.kolName||"");return r&&r.length>=2?Wi(r):""}function qg(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function Hd(e={},t="kol-avatar"){const a=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=Fi(a,Ug(e)),s=qg(e);return r?`<img class="${l(t)}" src="${l(r)}" data-avatar-key="${l(a)}" data-avatar-fallback="${l(s)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${l(t)} kol-avatar-fallback" aria-hidden="true">${l(s)}</div>`}function us(){const e=Ge();return[{id:"phantom",label:"Phantom",detected:!!ge("phantom"),mobileRedirect:e&&!!Hn("phantom"),installUrl:li("phantom"),icon:Ya("phantom")},{id:"solflare",label:"Solflare",detected:!!ge("solflare"),mobileRedirect:e&&!!Hn("solflare"),installUrl:li("solflare"),icon:Ya("solflare")},{id:"backpack",label:"Backpack",detected:!!ge("backpack"),mobileRedirect:!1,installUrl:li("backpack"),icon:Ya("backpack")},{id:"solana",label:"Detected Wallet",detected:!!ge("solana"),mobileRedirect:!1,installUrl:"",icon:Ya("solana")}]}function ge(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function _e(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function ie(){return n.user?.connectedWallet||n.connectedWalletBalance||null}function Hg(e=""){const t=ie();if(!t?.publicKey)return"";const a=String(e||"")==="connected"||!e&&!n.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${a?"selected":""}>${l(r)} - ${l(S(t.publicKey))}</option>`}function S(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}const Di="/assets/slimewire/swap/states/",ct="/assets/slimewire/swap/sfx/",Kd="/assets/slimewire/volume/states/",ps="/assets/slimewire/volume/sfx/",Kg="/assets/slimewire/ui/tick.mp3",Vg="/assets/slimewire/ui/flip.mp3",zg={swap:new Set(["idle","appraise","buy","sell","banking","win","loss"]),volume:new Set(["idle","running","sweep","stop"]),sniper:new Set(["idle","fire","lock"]),ogreAi:new Set(["idle","speak","think"]),bundle:new Set(["idle","volley","sell"]),launchCoin:new Set(["idle","launch","forge"]),positions:new Set(["idle","win","survey"]),pnl:new Set(["idle","win","survey"])},jg={swap:{appraise:[ct+"appraise.mp3",.7],buy:[ct+"buy.mp3",.85],sell:[ct+"sell.mp3",.85],win:[ct+"win.mp3",.85],loss:[ct+"loss.mp3",.6],banking:[ct+"bank.mp3",.8]},volume:{running:[ps+"start.mp3",.7],sweep:[ps+"sweep.mp3",.8],stop:[ps+"stop.mp3",.8]},sniper:{fire:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],lock:["/assets/slimewire/sniper/sfx/lock.mp3",.7]},ogreAi:{think:["/assets/slimewire/ogreai/sfx/think.mp3",.6],speak:[ct+"appraise.mp3",.6]},bundle:{volley:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],sell:["/assets/slimewire/bundle/sfx/sell.mp3",.8]},launchCoin:{forge:["/assets/slimewire/launch/sfx/forge.mp3",.85],launch:[ct+"win.mp3",.8]},positions:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]}},Gg={sniper:[["[data-sniper-arm]","lock"],["__text:snipe|ape|fire","fire"]],ogreAi:[["[data-ogre-ai-start]","think"]],bundle:[["[data-bundle-buy]","volley"],["[data-bundle-sell]","sell"]],launchCoin:[["[data-launch-coin-submit]","forge"],["__text:launch","forge"]],positions:[["[data-refresh-all],[data-refresh],[data-refresh-positions]","survey"]],pnl:[["[data-refresh-all],[data-refresh]","survey"]]},Vd={},fa={launchCoin:{base:"/assets/slimewire/launch/states/",poster:"/assets/slimewire/launch/hero.png",tier:"OGRE FORGE",cap:["Pump Launcher","Forge it · birth it · send it."],accent:"launch",idle:"idle",event:"launch",sfx:[ct+"win.mp3",.8]},sniper:{base:"/assets/slimewire/sniper/states/",poster:"/assets/slimewire/sniper/hero.png",tier:"OGRESNIPER",cap:["OgreSniper","Lock on · strike first."],accent:"sniper",idle:"idle",event:"fire",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},ogreAi:{base:"/assets/slimewire/ogreai/states/",poster:"/assets/slimewire/ogreai/hero.png",tier:"OGRE A.I.",cap:["Ogre A.I.","Ask the swamp oracle."],accent:"ogreai",idle:"idle",event:"speak",sfx:[ct+"appraise.mp3",.6]},bundle:{base:"/assets/slimewire/bundle/states/",poster:"/assets/slimewire/bundle/hero.png",tier:"OGRE BUNDLE",cap:["Bundle","Many wallets · one volley."],accent:"bundle",idle:"idle",event:"volley",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},positions:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"POSITIONS",cap:["Open Positions","Your swamp, live."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"PROFIT & LOSS",cap:["PnL","Count the winnings."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]}};function zd(){const e=R.kind;return e==="swap"?Di:e==="volume"?Kd:fa[e]?fa[e].base:Di}const h0={launchCoin:"[data-launch-coin-submit]",ogreAi:"[data-ogre-ai-start]",bundle:"[data-bundle-buy]"};let jd=!1;function Xg(){jd||(jd=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("[data-ogre-card]");if(t){e.preventDefault(),e.stopPropagation(),Yg(t.getAttribute("data-ogre-card"));return}const a=R.kind;if(!a)return;const r=document.querySelector(`[data-ogre-stage="${a}"]`);if(!r)return;const s=e.target.closest("button, a[role='button'], [data-swap-reverse], select, input[type='range'], label.oss-pill, [role='button']");if(!s||s.closest("[data-ogre-snd],[data-ogre-card]"))return;const o=r.closest("[data-rendered-tab]")||r.parentElement||document;if(o.contains&&!o.contains(s))return;const c=()=>fs(Kg,.5);if(fa[a]){const i=Gg[a]||[],d=(s.textContent||"").toLowerCase();for(const[u,p]of i)if(u.startsWith("__text:")){if(new RegExp(u.slice(7)).test(d)){le(r,p,!0);return}}else if(s.closest(u)){le(r,p,!0);return}c();return}if(a==="swap"){s.closest("[data-swap-use-custom-amount]")?le(r,n.swapDirection==="sell"?"sell":"buy",!0):s.closest("[data-swap-reverse]")?(le(r,"appraise",!0),fs(Vg,.6)):s.closest("[data-swap-to],[data-swap-from],[data-trade-token]")?le(r,"appraise",!0):c();return}if(a==="volume"){s.closest("[data-vbot-start]")?le(r,"running",!0):s.closest("[data-vbot-stop]")?le(r,"stop",!0):s.closest("[data-vbot-set-mode],[data-vbot-set-aggr],[data-vbot-set-stagger],[data-vbot-source]")?le(r,"sweep",!0):c();return}}catch{}},!0))}function Jg(e,t){try{const a=document.createElement("a");a.href=t,a.download=e,document.body.appendChild(a),a.click(),a.remove()}catch{}}async function Yg(e){const t=r=>{const s=Number(r);return Number.isFinite(s)?s.toFixed(4):"0"};let a=null;if(e==="swap"){const r=n.tradeResult||{};a={theme:"swap",receipt:!0,loss:!1,headline:"SWAPPED",mint:r.tokenMint||n.tradeToken||"",symbol:String(r.symbol||r.shortMint||"TOKEN"),name:"OgreSwap",lines:[r.type==="sell"?`Received ${t(r.netSol)} SOL`:r.type==="buy"?`Aped ${t(r.spentSol)} SOL`:"Swapped on SlimeWire","OgreSwap · on-chain","slimewire.org"]}}else if(e==="volume"){const r=Array.isArray(n.volumeBots)?n.volumeBots:[],s=r.find(d=>d&&d.status!=="completed")||r[r.length-1]||{},o=s.stats||{},c=Number(s.buyAmountSol||0),i=(Number(o.buys||0)+Number(o.sells||0))*c;a={theme:"volume",receipt:!0,loss:!1,headline:"VOLUME RUN",mint:s.tokenMint||"",symbol:String(s.shortMint||"SLIMEBOT"),name:"SlimeBot",lines:[`${i.toFixed(2)} SOL volume`,`${Number(s.walletCount||0)} wallets · ${Number(s.currentCycle||s.cycles||0)} rounds`,"SlimeBot · slimewire.org"]}}else return;try{const r=await k("/api/web/card",{method:"POST",body:JSON.stringify(a)});r&&r.ok&&r.png&&Jg(`slimewire-${e}-card.png`,r.png)}catch{}}let Gd=!1;function Qg(){Gd||(Gd=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("button");if(!t||!(t.matches("[data-top-refresh-wallet],[data-refresh-all],[data-refresh-live-pairs],[data-refresh-scanner],[data-refresh],[data-refresh-watchlist],[data-refresh-kol]")||/(^|\s)(refresh|reload)(\b|$)/i.test((t.textContent||"").trim())))return;t.classList.remove("ogre-refreshing"),t.offsetWidth,t.classList.add("ogre-refreshing"),setTimeout(()=>t.classList.remove("ogre-refreshing"),900)}catch{}},!0))}function ms(e,t){return`<video class="${e}" autoplay muted loop playsinline preload="auto" src="/assets/slimewire/ui/${t}.mp4"></video>`}function Zg(e){try{const t=e.querySelector(".trade-head h3")||e.querySelector(".pump-live-head h3")||e.querySelector(".pump-live-head")||e.querySelector(".trade-head");t&&!t.querySelector(".ogre-spy")&&t.insertAdjacentHTML("afterbegin",`<span class="ogre-spy" title="Intel watch">${ms("spy-vid","eye")}<i></i></span>`)}catch{}}let Ni=0;function eb(e,t){try{if(t==="terminal"||t==="live"){if(!e.querySelector(".ogre-radar-bar")){const a=e.querySelector(".cooks-category-label")?.parentElement||e.querySelector(".terminal-main")||e.querySelector(".terminal-layout")||e,r=e.querySelectorAll(".signal-row, [data-token-mint]").length,s=document.createElement("div");if(s.className="ogre-radar-wrap",s.innerHTML='<span class="ogre-radar-bar">'+ms("rbar-bg","conduit")+`<span class="orb-scope">${ms("orb-vid","scope")}<span class="ring"></span><span class="ring r2"></span><span class="sweep"></span><span class="blip b1"></span><span class="blip b2"></span><span class="blip b3"></span></span><span class="orb-read"><span class="t">SWAMP RADAR</span><span class="s"><b>${r}</b> live pairs · scanning the swamp</span></span><span class="ogre-spy radar-eye" title="Intel watch">${ms("spy-vid","eye")}<i></i></span><span class="orb-heat">LIVE</span></span>`,a.insertBefore(s,a.firstChild),r>Ni&&Ni>0){const o=s.querySelector(".ogre-radar-bar");o.classList.add("hit"),setTimeout(()=>o.classList.remove("hit"),800)}Ni=r}return}if(Zg(e),t==="smartChart"){const a=e.querySelector(".trade-head");a&&!a.querySelector(".ogre-chartwatch")&&a.insertAdjacentHTML("beforeend",'<span class="ogre-chartwatch"><span class="ce"></span>WATCHING</span>')}}catch{}}let ha=!0;try{ha=localStorage.getItem("ogreStageSound")!=="off"}catch{}const Xd={};function fs(e,t){if(ha)try{let a=Xd[e];a||(a=new Audio(e),a.preload="auto",Xd[e]=a),a.volume=t??.7,a.currentTime=0,a.play().catch(()=>{})}catch{}}const R={kind:null,clip:"",eventUntil:0,prev:{},feed:[],feedIdx:0,tkTimer:0};function tb(e){return e=String(e||""),e.length>9?`${e.slice(0,4)}…${e.slice(-4)}`:e||"coin"}function Ui(e){return e&&e.symbol?`$${e.symbol}`:e&&e.shortMint?`$${e.shortMint}`:"the coin"}function Jd(e){return`<video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${e==="swap"?"/assets/slimewire/swap/hero.png":"/assets/slimewire/volume/hero.png"}" src="${e==="swap"?Di:Kd}idle.mp4"></video>`}function ab(){return`
    <div class="ogre-stage swap" data-ogre-stage="swap">
      ${Jd("swap")}
      <span class="os-tier">OGRESWAP</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <button class="os-card" data-ogre-card="swap" type="button" title="Download a share card">🏆</button>
      <span class="os-led"></span>
      <div class="os-shield" data-os-shield><span class="ic">🛡️</span><span data-os-shield-text>SHIELD</span></div>
      <div class="os-read" data-os-read><div class="l">SlimeShield score</div><div class="v" data-os-read-v>—</div></div>
      <div class="os-gauge"><div class="fill" data-os-gauge></div></div>
      <div class="os-orb" data-os-orb><span class="s" data-os-orb-s></span><span class="p" data-os-orb-p></span></div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>OgreSwap ready — paste a coin to appraise</span></div>
    </div>`}function nb(){return`
    <div class="ogre-stage volume" data-ogre-stage="volume">
      ${Jd("volume")}
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
    </div>`}function Yd(e){return e==="volume"&&(n.volumeBots||[]).some(t=>t&&t.status!=="completed")?"running":"idle"}function Qd(e){const t=jg[R.kind];t&&t[e]&&fs(t[e][0],t[e][1])}function le(e,t,a){const r=e.querySelector("[data-ogre-bg]");if(!r||R.clip===t)return;const s=zg[R.kind];if(s&&!s.has(t)&&(a&&Qd(t),t=R.kind==="swap"?"appraise":R.kind==="volume"?"sweep":"idle",!s.has(t)))return;R.clip=t;const o=zd();try{r.loop=!a,r.muted=!0,r.src=o+t+".mp4",r.load();const c=r.play();c&&c.catch&&c.catch(()=>{})}catch{}a&&(R.eventUntil=Date.now()+(t==="running"?8500:4600),Qd(t))}function on(e,t){R.feed.unshift({text:e,color:t||""}),R.feed.length>16&&R.feed.pop(),R.feedIdx=0}function rb(){const e=document.querySelector("[data-ogre-stage]");if(!e){R.tkTimer&&(clearInterval(R.tkTimer),R.tkTimer=0);return}const t=e.querySelector("[data-os-tk]");if(!t)return;if(!R.feed.length){const s=fa[R.kind];if(s)t.innerHTML='<span class="os-dot"></span>'+s.cap[1];else if(R.kind==="volume"){const o=(n.volumeBots||[]).some(c=>c&&c.status!=="completed");t.innerHTML='<span class="os-dot"></span>'+(o?"Swarm running — generating lifelike volume":"SlimeBot idle — set a token and start")}else t.innerHTML='<span class="os-dot"></span>'+(n.tradeToken?"Coin loaded — set your size and SWAP":"OgreSwap ready — paste a coin to appraise");return}const a=R.feed[R.feedIdx++%R.feed.length],r=a.color?`<span class="os-dot" style="background:${a.color};box-shadow:0 0 8px ${a.color}"></span>`:'<span class="os-dot"></span>';t.innerHTML=r+l(a.text),t.style.animation="none",t.offsetWidth,t.style.animation="os-tkin .5s ease"}function sb(e){const t=e.querySelector("[data-ogre-stage]");if(!t){R.kind=null;return}const a=t.getAttribute("data-ogre-stage");R.kind!==a&&(R.kind=a,R.clip="",R.eventUntil=0,R.prev={},R.feed=[],R.feedIdx=0);const r=t.querySelector("[data-ogre-snd]");r&&(r.textContent=ha?"🔊":"🔇",r.onclick=o=>{o.stopPropagation(),ha=!ha;try{localStorage.setItem("ogreStageSound",ha?"on":"off")}catch{}r.textContent=ha?"🔊":"🔇"});const s=t.querySelector("[data-ogre-bg]");s&&!s.__ogreBound&&(s.__ogreBound=!0,s.addEventListener("ended",()=>{s.loop||(R.eventUntil=0,R.clip="",le(t,Yd(R.kind),!1))}),s.addEventListener("error",()=>{R.eventUntil=0,R.clip="";const o=Yd(R.kind);(o!=="idle"||s.getAttribute("src")!==zd()+o+".mp4")&&le(t,o,!1)}));try{window.__ogreIO&&window.__ogreIO.disconnect(),s&&"IntersectionObserver"in window&&(window.__ogreIO=new IntersectionObserver(o=>{for(const c of o)if(c.isIntersecting&&!document.hidden)try{const i=s.play();i&&i.catch&&i.catch(()=>{})}catch{}else try{s.pause()}catch{}},{threshold:.06}),window.__ogreIO.observe(t)),window.__ogreVisBound||(window.__ogreVisBound=!0,document.addEventListener("visibilitychange",()=>{const o=document.querySelector("[data-ogre-bg]");if(o)if(document.hidden)try{o.pause()}catch{}else try{const c=o.play();c&&c.catch&&c.catch(()=>{})}catch{}}))}catch{}if(R.tkTimer||(R.tkTimer=setInterval(rb,3400)),Xg(),a==="swap")try{const o=e.querySelector(".oss-stage-wrap");o&&!t.contains(o)&&(o.classList.add("os-hud"),t.appendChild(o));const c=e.querySelector(".slime-swap-card");if(c&&o){let i=c.querySelector("[data-oss-settings]");i||(i=document.createElement("div"),i.setAttribute("data-oss-settings",""),i.className="oss-settings-tray",c.insertBefore(i,c.firstChild));const d=o.querySelector(".oss-slip"),u=o.querySelector(".oss-wallet-bar");d&&d.parentElement!==i&&i.appendChild(d),u&&u.parentElement!==i&&i.appendChild(u)}}catch{}if(Vd[a])try{const o=e.querySelector(Vd[a]),c=o&&(o.closest(".quick-grid")||o.closest(".card-actions")||o.parentElement);c&&!t.contains(c)&&(c.classList.add("os-hud","os-cta"),t.appendChild(c))}catch{}a==="swap"?lb(t):a==="volume"?cb(t):ib(t,a)}function ob(e){const t=fa[e];return t?`
    <div class="ogre-stage hero ${t.accent}" data-ogre-stage="${e}" data-hero="1">
      <video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${t.poster}" src="${t.base}${t.idle}.mp4"></video>
      <span class="os-tier">${l(t.tier)}</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <span class="os-led"></span>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>${l(t.cap[1])}</span></div>
    </div>`:""}function ib(e,t){Date.now()>=R.eventUntil&&le(e,"idle",!1)}function g0(e){const t=document.querySelector(`[data-ogre-stage="${e}"]`),a=fa[e];t&&a&&R.kind===e&&le(t,a.event,!0)}function lb(e){const t=String(n.tradeToken||"").trim(),a=t?(n.slimeShieldResults||{})[t]:null,r=e.querySelector("[data-os-shield]"),s=e.querySelector("[data-os-shield-text]"),o=e.querySelector("[data-os-gauge]"),c=e.querySelector("[data-os-read]"),i=e.querySelector("[data-os-read-v]");if(a){const p=String(a.verdict||"").toLowerCase(),f=p.includes("avoid")||p.includes("danger")||p.includes("rug")?"avoid":p.includes("safe")||p.includes("clean")||p.includes("ok")?"safe":"risk";r&&(r.className="os-shield show "+f),s&&(s.textContent=String(a.verdict||"checked").toUpperCase());const y=Number(a.score);!isNaN(y)&&o&&(o.style.height=Math.max(6,Math.min(100,y))+"%"),!isNaN(y)&&c&&i&&(c.classList.add("show"),i.textContent=Math.round(y),i.className="v "+(f==="avoid"?"down":f==="safe"?"up":"")),e.classList.toggle("loss",f==="avoid")}else r&&(r.className="os-shield"),c&&c.classList.remove("show"),o&&(o.style.height="6%"),e.classList.remove("loss");if(t&&t!==R.prev.swapToken&&(R.prev.swapToken=t,on("Appraising $"+tb(t),"#36e0c8"),le(e,"appraise",!0),!a&&typeof to=="function"))try{to(t).catch(()=>{})}catch{}const d=n.tradeResult,u=d?`${d.signature||d.message||""}|${d.type||""}`:"";if(d&&u!==R.prev.swapRes){if(R.prev.swapRes=u,d.type==="buy"){le(e,"buy",!0);const p=e.querySelector("[data-os-orb]");if(p){p.classList.add("show","up"),p.classList.remove("down");const f=p.querySelector("[data-os-orb-s]"),y=p.querySelector("[data-os-orb-p]");f&&(f.textContent=Ui(d).replace("$","").slice(0,7)),y&&(y.textContent="HELD")}on("Bought "+Ui(d),"#9dff6a")}else if(d.type==="sell"){le(e,"banking",!0);const p=e.querySelector("[data-os-orb]");p&&p.classList.remove("show"),on("Sold "+Ui(d)+" — banked","#ffd45a")}}Date.now()>=R.eventUntil&&le(e,"idle",!1)}function Zd(e,t,a,r){const s=e.querySelector("[data-ov-swarm]");if(!s)return;if(t=Math.max(0,Math.min(12,Math.round(t))),s.children.length!==t){s.innerHTML="";for(let u=0;u<t;u++){const p=document.createElement("div");p.className="ov-orb";const f=u/t*Math.PI*2-Math.PI/2;p.style.left=50+Math.cos(f)*34+"%",p.style.top=46+Math.sin(f)*30+"%",s.appendChild(p)}}const o=s.children;if(!o.length)return;const c=Number(R.prev.volBuys||0),i=Number(R.prev.volSells||0),d=(u,p)=>{for(let f=0;f<p&&f<3;f++){const y=o[Math.floor(Math.random()*o.length)];y.classList.remove("buy","sell"),y.offsetWidth,y.classList.add(u),setTimeout(()=>y.classList.remove(u),430)}};a>c&&d("buy",a-c),r>i&&d("sell",r-i),(a>c||r>i)&&fs(ps+"pulse.mp3",.32),R.prev.volBuys=a,R.prev.volSells=r}function cb(e){const a=(n.volumeBots||[]).find(d=>d&&d.status!=="completed")||null,r=!!a,s=R.prev.volActive;e.classList.toggle("live",r),r&&!s&&(on("SlimeBot online — swarm spinning up","#c06bff"),le(e,"running",!0)),!r&&s&&(on("Swept back — funds returned home","#c06bff"),le(e,"sweep",!0)),R.prev.volActive=r,Date.now()>=R.eventUntil&&le(e,r?"running":"idle",!1);const o=e.querySelector("[data-ov-budget]"),c=e.querySelector("[data-ov-ring]"),i=e.querySelector("[data-ov-read]");if(a){const d=a.stats||{},u=Number(d.buys||0),p=Number(d.sells||0),f=Number(d.fundedSol||0),y=Number(a.currentCycle||0),b=Number(a.cycles||a.maxRounds||0),v=Number(a.buyAmountSol||0);if(o){o.classList.add("show");const T=o.querySelector("[data-ov-budget-v]");T&&(T.textContent=f.toFixed(3)+" SOL");const C=b>0?Math.min(1,y/b):0,B=o.querySelector("[data-ov-budget-bar]");B&&(B.style.width=C*100+"%")}if(c){c.classList.add("show");const T=2*Math.PI*22,C=b>0?Math.min(1,y/b):0,B=c.querySelector("[data-ov-ring-prg]");B&&(B.style.strokeDasharray=T,B.style.strokeDashoffset=T*(1-C));const U=c.querySelector("[data-ov-ring-lbl]");U&&(U.textContent=y+"/"+(b||"?"))}if(i){i.classList.add("show");const T=(u+p)*v,C=(B,U)=>{const H=i.querySelector(B);H&&(H.textContent=U)};C("[data-ov-vol]",T>0?T.toFixed(2)+" SOL":"—"),C("[data-ov-buys]",String(u)),C("[data-ov-sells]",String(p)),C("[data-ov-wallets]",String(Number(a.walletCount||0)))}Zd(e,Number(a.walletCount||6),u,p);const A=(a.log||[])[0],g=A?(A.at||"")+(A.message||""):"";A&&g!==R.prev.volLog&&(R.prev.volLog=g,on(String(A.message||"").slice(0,80),""))}else o&&o.classList.remove("show"),c&&c.classList.remove("show"),i&&i.classList.remove("show"),Zd(e,0,0,0)}function db(){const e=ie(),t=n.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const a=yi(),r=nd(),s=td(a)||{symbol:a==="SOL"?"SOL":S(a),name:a==="SOL"?"Solana":""},o=td(r)||{symbol:r?S(r):"Custom",name:r?"Selected token":"Paste CA below"},c=$h(),i=n.swapDirection==="sell",d=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":i?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",u=i?a:r,p=u&&u!=="SOL"?u:n.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${i?"100":"0.0"}" aria-label="${i?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${ad(a,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${l(p||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${ad(r,{includeCustom:!0})}
              </select>`,b=`
            <div class="oss-slot oss-pay" data-swap-slot="${i?"token":"base"}">${i?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${i?"base":"token"}">${i?f:y}</div>`;return`
    ${ab()}
    <section class="trade-layout">
      <article class="trade-card slime-swap-card ogre-swap-card ogre-swap-skin">
        <h3 class="ogre-swap-title oss-a11y-title">OgreSwap - live on-chain Solana swapper</h3>
        <div class="oss-stage-wrap">
          <div class="oss-stage oss-flat" role="group" aria-label="OgreSwap swap panel">
            ${b}
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
                ${ln(e?.publicKey&&!t?"connected":"")}
              </select>
            </label>
          </div>
        </div>
        <p class="slime-swap-route-note oss-route">${l(d)}</p>

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
          ${n.tradeToken?`<div class="card-actions">${Ye(Oi(n.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${kb()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${ub()}
        ${pb()}
      </aside>
    </section>
  `}function qi(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!e?.volumeBot)}function eu(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!!e?.volumeBot)}function ln(e=""){const t=Hg(e),a=qi().map(r=>{const s=n.balances.find(i=>Number(i.index)===Number(r.index)),o=s?.sol!==null&&s?.sol!==void 0?`${Number(s.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${l(r.label)}${c} - ${o}</option>`}).join("");return t||a?`${t}${a}`:'<option value="">No wallet connected</option>'}function ub(){if(!n.tradeResult)return`
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
        ${Ye(Pg(e))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function pb(){if(!n.tradePlanResult)return`
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
        <div><dt>Timer Exit</dt><dd>${l(Tb(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${l(e.tokenMint)}">Copy CA</button>
        ${Ye(Cg(e,"Armed managed trade"))}
        <a href="${l(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function tu(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const a=t.toLowerCase(),r=a.includes("bonk")?"Bonk":a.includes("meteora")?"Meteora":a.includes("orca")?"Orca":a.includes("raydium")?"Raydium":a.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${l(t)}">${l(r)}</span>`}function mb(){if(!n.ogreAiResult)return`
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
        ${t.map(s=>{const o=s.pick||{};return`
            <div class="ogre-ai-pick-card">
              <strong>${l(o.symbol||s.shortMint||"Pick")}</strong>
              ${tu(o)}
              <span>${l(o.name||s.tokenMint||"")}</span>
              <small>Score ${l(o.score||"n/a")} | MC ${l(o.marketCapLabel||"n/a")} | Liq ${l(o.liquidityLabel||"n/a")} | Age ${l(o.ageLabel||"n/a")}</small>
              ${Array.isArray(o.reasons)&&o.reasons.length?`<small>${o.reasons.map(c=>l(c)).join(" | ")}</small>`:""}
              <small>${l(s.message||"")}</small>
              <div class="card-actions compact">
                <button data-copy="${l(s.tokenMint)}">Copy CA</button>
                <a href="${l(o.dexUrl||s.dexUrl||Z(s.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${o.pumpUrl?`<a href="${l(o.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
              </div>
            </div>
          `}).join("")}
        ${t.length?"":a.map(s=>`
          <div class="ogre-ai-pick-card">
            <strong>${l(s.symbol||s.shortMint||"Pick")}</strong>
            ${tu(s)}
            <span>${l(s.name||s.tokenMint||"")}</span>
            <small>Score ${l(s.score||"n/a")} | MC ${l(s.marketCapLabel||"n/a")} | Liq ${l(s.liquidityLabel||"n/a")} | Age ${l(s.ageLabel||"n/a")}</small>
            ${Array.isArray(s.reasons)&&s.reasons.length?`<small>${s.reasons.map(o=>l(o)).join(" | ")}</small>`:""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${l(s.tokenMint)}">Copy CA</button>
              <a href="${l(s.dexUrl||Z(s.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${s.pumpUrl?`<a href="${l(s.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      ${r.length?`<div class="mini-results">${r.map(s=>`<span data-ok="false">${l(s.shortMint||s.tokenMint)}: ${l(s.message||"failed")}</span>`).join("")}</div>`:""}
    </article>
  `}const rr=[["strong","Strong 🔥","Highest win-rate mode. Waits for survivors (1.5–12 min old) with proven net-buying, real holders and healthy liquidity, then targets a 2x — entering before the breakout, not after. Built to win more than it loses."],["super_fresh","Super-fresh","Brand-new sub-$8K launches (under ~2 min) with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function hs(){const e=a=>rr.some(([r])=>r===a);if(n.ogreAiCategory&&e(n.ogreAiCategory))return n.ogreAiCategory;const t=nc().category;return e(t)?t:"strong"}function au(e){const t=rr.find(([a])=>a===e);return t?t[2]:rr[0][2]}function fb(e){return`<div class="ogre-cat-segment" role="group">${rr.map(([t,a])=>`<button type="button" data-ogre-cat="${l(t)}" data-active="${e===t}">${l(a)}</button>`).join("")}</div>`}function hb(){const e=n.ogreAutopilot||{},t=!!e.enabled,a=nu(e.category||hs()),r=(c,i)=>c==null||c===""?i:c,s=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),o=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
    <article class="ogre-autopilot ${t?"is-on":""}" data-preserve-focus>
      <div class="ogre-autopilot-head">
        <div>
          <h3>Autopilot</h3>
          <p>Auto-ape the best <strong>${l(a)}</strong> pick on a timer, using the TP/SL/timer/slippage and wallets above — within hard guards.</p>
          <p style="margin-top:6px"><a href="/autopilot-pro" style="color:#8dff5a;font-weight:800;text-decoration:none">⚡ Open SlimeWire Auto (Pro) →</a></p>
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
      <small data-autopilot-status>${l(s)}${o?` — ${l(o)}`:""}</small>
    </article>
  `}function nu(e){const t=rr.find(([a])=>a===e);return t?t[1]:"Super-fresh"}function gb(){if(!n.wallets.length)return`${cs()}${F("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=nc(),t=e.amountSol||"0.1",a=e.runCount||"1",r=(o,c,i)=>{const d=String(o||i||"");return d==="custom"?String(c||"custom"):d},s=hs();return`
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
          <span class="tier-copy">Ogre A.I. scans, apes the best setup, and arms your exits — you stay in the loop. Want it fully hands-off with smart-money entries, laddered banking &amp; auto cash-out? <a href="/autopilot-pro" class="tier-link">Unlock Pro Autopilot →</a></span>
        </div>

        <div class="ogre-cat-field" data-preserve-focus>
          <span class="ogre-cat-label">Scan category</span>
          ${fb(s)}
          <small class="ogre-cat-hint">${l(au(s))}</small>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="${l(t)}">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              ${["1","2","3","5","10","25"].map(o=>`<option value="${o}" ${a===o?"selected":""}>${o} ${o==="1"?"order":"orders"}</option>`).join("")}
            </select>
          </label>
          ${Ht({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${Ht({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Ze("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${Ht({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${$t("ogre-ai")}
        </div>
        ${qt("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${n.ogreAiLoading?"disabled":""}>${n.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${l(n.ogreAiStatus||au(s))}</small>
      </article>

      <aside class="trade-side">
        ${Bi({compact:!0})}
        ${hb()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${mb()}
      </aside>
    </section>
  `}function ru(e,t){return`
    <section class="account-check-card wallet-gate">
      <div>
        <h3>Make a web wallet to use ${l(e)}</h3>
        <p>${l(t)}</p>
      </div>
      <button class="primary" type="button" data-connect-create-wallet>Create a Wallet</button>
      <button type="button" data-tab="wallets">Open Wallets</button>
    </section>`}function bb(){return n.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${n.bundleToken?Z(n.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${cn({toolKey:"bundle",activeKey:dn("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${l(n.bundleToken||n.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${$t("bundle")}
        </div>
        ${qt("bundle")}
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
              ${Ze("bundle-plan-delay","data-bundle-plan-delay","5")}
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
              ${gs("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${ys("bundle-plan")}
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
        ${$b()}
        ${yb()}
      </aside>
    </section>
  `:ru("Bundle","Bundle fires many managed wallets in one shot, so it needs at least one SlimeWire wallet. Tap to create one — your backup downloads instantly.")}function yb(){if(!n.bundleResult)return`
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
  `}function $t(e,t=null){const a=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return qi().map((s,o)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${s.index}" ${r?r.has(String(s.index))?"checked":"":o<a?"checked":""}>
      <span>${s.index}. ${l(s.label)}</span>
      <code>${l(s.shortPublicKey||s.publicKey)}</code>
    </label>
  `).join("")}function qt(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${l(t)}">
    </label>
  `}function vb(e=""){return n.wallets.length?n.wallets.map((t,a)=>{const r=String(t.index??a+1),s=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||S(t.publicKey||"")}`;return`<option value="${l(r)}" ${String(e)===r?"selected":""}>${l(s)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,a=""){const r=m(e)?.value||a;if(r!=="custom")return r;const s=m(t)?.value?.trim();if(!s)throw new Error("Enter the custom value first.");return s}function dt(e,t=""){const a=n.presets?.[e]||[],r=!t||t==="none"||t==="manual",s=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return a.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${a.map(o=>`<option value="${l(o.id)}" ${o.id===t?"selected":""}>${l(o.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
    `}function su(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${l(ze()||"0.10")}" value="${l(n.quickBuyAmountOverride)}">`}function ou(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${su()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${l(e)}">
          ${dt("trade",n.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const wb=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],Sb=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function Ht({selectAttr:e,customAttr:t,customFor:a,options:r,selected:s="",customType:o="text",customPlaceholder:c="Custom time"}){const i=String(s||""),u=new Set(r.map(([f])=>f)).has(i)?i:"custom",p=u==="custom"&&i!=="custom"?i:"";return`
    <select ${e} data-custom-select="${l(a)}">
      ${r.map(([f,y])=>`<option value="${l(f)}" ${f===u?"selected":""}>${l(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${l(a)}" type="${l(o)}" value="${l(p)}" placeholder="${l(c)}" ${u==="custom"?"":"hidden"}>
  `}function Ze(e,t,a="off"){return Ht({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:wb,selected:a,customPlaceholder:"Custom: 45s, 20, 2h"})}function gs(e,t,a="0"){return Ht({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:Sb,selected:a,customPlaceholder:"Custom: 30s, 20, 2h"})}function Hi(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${su()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${l(e)}">
          ${dt("trade",n.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${l(e)}">
          ${dt("bundle",n.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function b0(){const e=n.fastTradePresetStatus||(n.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${ln()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${Ze("fast-trade-preset-delay","data-fast-trade-preset-delay","off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function y0(){const e=n.fastBundlePresetStatus||(n.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${$t("fast-bundle-preset")}</div>
        ${qt("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${Ze("fast-bundle-preset-delay","data-fast-bundle-preset-delay","off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${l(e)}</small>
      </div>
    </article>
  `}function iu(e){const t=e==="trade"?n.editingTradePresetId:n.editingBundlePresetId;return t?ce(e,t):null}function bs(e,t){e==="trade"&&(n.editingTradePresetId=t||""),e==="bundle"&&(n.editingBundlePresetId=t||"")}function kb(){const e=iu("trade"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${l(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${ln(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${l(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${l(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${Ze("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${lu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function $b(){const e=iu("bundle"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${l(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?l(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${l(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${$t("bundle-preset",e?.walletIndexes||null)}</div>
      ${qt("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${l(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${l(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${l(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${Ze("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${l(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${l(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${lu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function lu(e){const t=n.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const a=e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId;return`
    <div class="preset-list">
      ${t.map(r=>{const s=r.id===a;return`
        <div class="preset-pill" data-readonly="${r.readonly?"true":"false"}" data-active="${s?"true":"false"}">
          <span>${l(r.name)}</span>
          <small>${l(r.amountSol)} SOL | TP ${l(r.takeProfitPct)} | SL ${l(r.stopLossPct)} | ${l(r.sellDelay||"off")}</small>
          <div class="preset-actions">
            <button type="button" class="${s?"primary":""}" data-use-preset="${l(e)}" data-preset-id="${l(r.id)}">${s?"Active":"Use"}</button>
            <button type="button" data-edit-preset="${l(e)}" data-preset-id="${l(r.id)}">Edit</button>
            <button type="button" data-delete-preset="${l(e)}" data-preset-id="${l(r.id)}">${r.readonly?"Remove":"Delete"}</button>
          </div>
        </div>
      `}).join("")}
    </div>
  `}function Tb(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function ys(e){return`
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
  `}function ga(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function vs(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(s=>s.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function Ab(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),a=document.querySelector(`[data-custom-select="${t}"]`);a&&(a.value="off"),vs()}function cu(){return n.wallets.map(e=>`<option value="${l(e.index)}">${l(e.index)}. ${l(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function Pb(){return n.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${cu()}</select>
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
  `:""}function ws(e){n.distributeStatus=String(e||"");const t=m("[data-distribute-status]");t&&(t.textContent=n.distributeStatus)}function Cb(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.wallets.filter(r=>r.sessionWallet),a=t.length?t:n.wallets;return a.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${l(S(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${n.returnFundsBusy?"disabled":""}>${n.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${l(n.returnFundsStatus||`${a.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function sr(e){n.returnFundsStatus=String(e||"");const t=m("[data-return-funds-status]");t&&(t.textContent=n.returnFundsStatus)}async function du(e="leaving"){try{const t=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!t?.publicKey)return;const a=n.wallets.filter(o=>o.sessionWallet);if(!a.length)return;const r=a.map(o=>String(o.index));if(!await We({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${S(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:ae})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function Lb(){if(n.returnFundsBusy)return;const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey){sr("Connect a wallet first.");return}const t=n.wallets.filter(o=>o.sessionWallet),r=(t.length?t:n.wallets).map(o=>String(o.index));if(!r.length){sr("No managed wallets to return from.");return}if(await We({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${S(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){n.returnFundsBusy=!0,sr("Selling tokens and returning SOL..."),h();try{const o=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:ae});n.returnFundsBusy=!1,sr(o.summary||"Funds returned to your connected wallet."),await He({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(o){n.returnFundsBusy=!1,sr(o.message),h()}}}async function xb(){if(n.distributeBusy)return;const e=m("[data-distribute-count]")?.value||"5",t=m("[data-distribute-amount]")?.value||"",a=m("[data-distribute-source]")?.value||"1",r=m("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){ws("Enter SOL per wallet greater than zero.");return}const s=(Number(t)||0)*(Number(e)||0);if(await We({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${s.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){n.distributeBusy=!0,ws("Creating and funding wallets..."),h();try{await Q(m("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:a,label:r}),dedupe:!1,timeoutMs:ae});c.downloads?.encryptedBackup?.text&&be(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&be(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.distributeBusy=!1,ws(c.summary||"Fresh wallets created and funded. Backups downloaded."),await He({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){n.distributeBusy=!1,ws(c.message),h()}}}function Mb(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function Bb(){const e=eu().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${n.sweepBackgroundStatus?`<small data-sweep-background-status>${l(n.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function Rb(){const e=Array.isArray(n.volumeBots)?n.volumeBots:[],t=Bb();return e.length?t+e.map(a=>{const r=a.stats||{},s=a.status!=="completed",o=(a.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${l(a.shortMint||a.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${l(a.stage||"")}">${l(Mb(a))}</span>
          </div>
          ${s?`<button class="secondary" data-vbot-stop="${l(a.id)}">Stop & Sweep</button>`:`<a class="mini-link" href="${l(a.dexUrl||"#")}" target="_blank" rel="noreferrer">Dex</a>`}
        </header>
        <div class="volume-bot-metrics">
          <div><span>Cycle</span><strong>${l(Number(a.currentCycle||0))}/${l(Number(a.cycles||0))}</strong></div>
          <div><span>Wallets</span><strong>${l(Number(a.walletCount||0))}</strong></div>
          <div><span>Buys</span><strong>${l(Number(r.buys||0))}</strong></div>
          <div><span>Sells</span><strong>${l(Number(r.sells||0))}</strong></div>
          <div><span>Errors</span><strong>${l(Number(r.errors||0))}</strong></div>
        </div>
        <small>${l(a.message||"")}</small>
        ${o.length?`<ul class="volume-bot-log">${o.map(c=>`<li>${l(c.message||"")}</li>`).join("")}</ul>`:""}
      </article>
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function Ki(e,t,a){return`<div class="vbot-segment" role="group">${a.map(([r,s])=>`<button type="button" data-vbot-set-${e}="${l(r)}" data-active="${t===r}">${l(s)}</button>`).join("")}</div>`}function Ib(){const t=(Array.isArray(n.volumeBots)?n.volumeBots:[]).filter(c=>c.status!=="completed"),a=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),s=c=>c.reduce((i,d)=>i+Math.max(0,Number(d.cycles||0)-Number(d.currentCycle||0)),0),o=(c,i,d,u,p)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${l(c)}</h4>
      <p class="vbot-queue-sub">${l(i)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${d} / ${u}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,d/u*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${p}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${o("SMART","Smart Mode RPC Servers",a.length,10,s(a))}
      ${o("SPAMMER","Spammer RPC Servers",r.length,1,s(r))}
    </div>`}function Ob(){return`
    ${nb()}
    <section class="trade-card volume-bot-card slime-configurator ovs-skin" data-preserve-focus>
      <h2 class="vbot-config-title oss-a11y-title">Volume Configurator</h2>
      <div class="ovs-stage ovs-flat">
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
        <div class="ovs-mode">${Ki("mode",n.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${Ki("aggr",n.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${cu()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Chart shape <span style="opacity:.6;font-weight:600">· the pattern it paints</span></span>
            ${Ki("stagger",n.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Uptrend"]])}
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
          ${Ib()}
        </div>

        <div class="volume-bot-list">
          ${Rb()}
        </div>
      </div>
    </section>
  `}function Eb(){const e=n.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(n.slimeBotAggr)?n.slimeBotAggr:"med",a=Math.max(.05,Math.min(50,Number(m("[data-vbot-invest-num]")?.value||m("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(m("[data-vbot-duration]")?.value||"60"))),o={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",i=o.delaySecs*(c?4:1);let d=Math.round(r*60/i);d=Math.max(1,Math.min(250,d,Math.floor(a/.01)));const u=Math.max(.005,Math.min(.5,a/d));return{tokenMint:m("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:m("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(o.walletCount),fundPerWalletSol:c?"":(u+.02).toFixed(4),buyAmountSol:u.toFixed(4),sellPercent:"100",buyBias:String(o.buyBias),cycles:String(d),maxRounds:String(d),delaySecs:String(o.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!m("[data-vbot-keepdust]")?.checked,offsetSell:!!m("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(n.slimeBotStagger)?n.slimeBotStagger:"steady",investment:a,durationMin:r,mode:e,aggr:t}}function ba(e){n.volumeBotStatus=String(e||"");const t=m("[data-vbot-status]");t&&(t.textContent=n.volumeBotStatus)}async function Ss({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");n.volumeBots=Array.isArray(t.bots)?t.bots:[],n.activeTab==="volume"&&h()}catch(t){e||$(t.message)}}async function Fb(){if(n.volumeBotBusy)return;const e=Eb();if(!e.tokenMint){ba("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await We({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){n.volumeBotBusy=!0,ba("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:ae});n.volumeBotBusy=!1,r.bot&&(n.volumeBots=[r.bot,...n.volumeBots.filter(s=>s.id!==r.bot.id)]),ba(r.bot?.message||"SlimeBot started."),h(),Ss()}catch(r){n.volumeBotBusy=!1,ba(r.message),h()}}}async function Wb(e){if(e)try{ba("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:ae});t.bot&&(n.volumeBots=n.volumeBots.map(a=>a.id===t.bot.id?t.bot:a)),ba(t.bot?.message||"Stop requested."),h(),Ss()}catch(t){ba(t.message)}}function _b(){return n.wallets.length?Ob():ru("SlimeBot","SlimeBot funds and trades from a managed SlimeWire wallet, so it needs at least one saved. Tap to create one — your backup downloads instantly.")}function Db(){const e=we([...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...qe()?.rows||[],...n.scan?.rows||[]]).sort(nt),t=vn(e),a=it("launch",t),r=yn(),s=Pt(Be().keywords)[0]||"";return`
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
        ${bl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${gl(e,t)}
        ${a.length?mt(a,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Pa}):r?Sr(e,"launch candidates"):F("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
        ${da("launch",t,"launch candidates")}
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
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${l(s.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${$t("launch")}
        </div>
        ${qt("launch")}
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
            ${Ze("launch-delay","data-launch-delay","3")}
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
            ${gs("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${ys("launch")}
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
          <p>It scans live launch/profile feeds about every ${l(ry())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${$u()}
        </article>
      </aside>
    </section>
  `}function uu(e=n.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||n.launchWatches?.[0]?.tokenMint||n.launchWatches?.[0]?.mint||n.smartChartToken?.tokenMint||n.smartChartToken?.mint||"").trim()}function Vi(){return!!(Yt&&Yt.enabled&&(Yt.provider||Yt.playbackBaseUrl||Yt.ingestUrl))}function Nb(){const e=String(Yt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function Ub(e){const t=String(Yt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const a=t.includes("?")?"&":"?";return`${t}${a}mint=${encodeURIComponent(e)}`}function qb(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function pu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function Hb(e=n.launchCoinDraft||{}){const t=uu(e),a=Vi(),r=Ub(t),s=n.pumpLiveStatus||(t?a?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),o=t?"":"disabled",c=a&&r?`<iframe class="pump-live-frame" src="${l(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
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
          <div class="pump-live-stat"><span>Launch CA</span><strong>${l(qb(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${l(Nb())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${l(pu(t))}</strong></div>
        </div>
      </div>
      <div class="quick-grid pump-live-controls">
        <button type="button" data-pump-live-action="go" ${o}>Go Live</button>
        <button type="button" data-pump-live-action="chart" ${o}>Chart + Txns</button>
        <button type="button" data-pump-live-action="copy" ${o}>Copy Stream ID</button>
        <button type="button" data-pump-live-action="obs" ${o}>OBS / Mobile Setup</button>
        <button type="button" data-pump-live-action="end" ${o}>End Live</button>
      </div>
      <p class="pump-live-status">${l(s)}</p>
    </section>
  `}function cn({toolKey:e,activeKey:t,sections:a,variant:r=""}){const s=a.some(o=>o.key===t)?t:a[0]?.key;return`
    <div class="tool-panels${r==="stacked"?" is-stacked":""}" data-tool-panels="${l(e)}">
      <nav class="tool-panel-nav" aria-label="Sections">
        ${a.map(o=>`
          <button type="button" class="tool-panel-tab" data-tool-section="${l(e)}:${l(o.key)}" data-active="${o.key===s?"true":"false"}">
            <span class="tool-panel-tab-label">${l(o.label)}</span>
            ${o.hint?`<span class="tool-panel-tab-hint">${l(o.hint)}</span>`:""}
          </button>`).join("")}
      </nav>
      <div class="tool-panel-stack">
        ${a.map(o=>`
          <section class="tool-panel" data-tool-panel="${l(e)}:${l(o.key)}"${o.key===s?"":" hidden"}>
            ${o.title?`<h4 class="tool-panel-title">${l(o.title)}</h4>`:""}
            ${o.html}
          </section>`).join("")}
      </div>
    </div>
  `}function dn(e,t){return n.toolSections&&n.toolSections[e]||t}function Kb(){const e=n.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,a=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${l(Ga(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ye(a+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function Vb(e={}){mu();const t=n.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
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
          ${t.map(s=>`
            <div class="row-card">
              <div class="row-main">
                <strong>$${l(s.symbol)} ${s.mint?"🚀 launched":"⏳ counting down"}</strong>
                <small>${l(s.subscribers||0)} waiting | ${l(s.url)}</small>
              </div>
              <div class="card-actions compact">
                <button data-copy="${l(s.url)}">Copy Link</button>
                <a class="button-like" href="${l(s.url)}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>`).join("")}
        </div>`:""}
    </div>`}let ks="";function mu(){!n.user||ks===n.user.id||(ks=n.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});n.hypePages=e.pages||[],n.hypePages.length&&h()}catch{ks=""}})())}async function zb(){const e=m("[data-hype-status]"),t=String(m("[data-hype-name]")?.value||m("[data-launch-coin-name]")?.value||"").trim(),a=String(m("[data-hype-symbol]")?.value||m("[data-launch-coin-symbol]")?.value||"").trim(),r=String(m("[data-hype-launch-at]")?.value||"").trim(),s=String(m("[data-hype-blurb]")?.value||"").trim();if(!t||!a){w(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){w(e,"Pick the launch time.");return}w(e,"Creating hype page...");try{const o=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:a,blurb:s,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});n.hypeStatus=`Hype page live: ${o.url} - share it everywhere, it forwards to your chart at launch.`,ks="",mu(),h()}catch(o){w(e,D(o?.message||"Could not create the hype page."))}}function jb(){const e=n.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
                ${vb(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
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
                ${dt("trade",e.tradePresetId||n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${dt("bundle",e.bundlePresetId||n.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${l(e.amountSol||ze()||"0.1")}">
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
              ${Ze("launch-coin-delay","data-launch-coin-delay",e.sellDelay||"off")}
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
                ${n.wallets.length?$t("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${qt("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:Vb(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:Hb(e)}];return`
    ${window.location.pathname.includes("/launch-coin")?`
    <div class="launch-focus-bar">
      <button type="button" class="lf-btn lf-back" data-nav-route="/terminal" data-tab="terminal">← Back to Terminal</button>
      <span class="lf-title">🚀 Launch a Coin</span>
      <button type="button" class="lf-btn" data-nav-route="/terminal" data-tab="wallets">👛 Wallets</button>
    </div>`:""}
    ${Kb()}
    <section class="trade-layout launch-coin-layout" data-preserve-focus>
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Pick a section on the left to fill only what you need. The big buttons below stay put so you can launch from any tab.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        ${cn({toolKey:"launchCoin",activeKey:dn("launchCoin","coin"),sections:t})}

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${l(n.launchCoinStatus||"Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The Dex metadata link remains as a fallback tool.")}</p>
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
          ${$u()}
        </article>
      </aside>
    </section>
  `}function Gb(){const e=n.launchCoinDraft||{},t=m("[data-launch-coin-image]")?.files?.[0];return{name:(m("[data-launch-coin-name]")?.value||"").trim(),symbol:(m("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(m("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",bannerName:m("[data-launch-coin-banner]")?.files?.[0]?.name||e.bannerName||"",bannerDataUrl:e.bannerDataUrl||"",bannerType:e.bannerType||"",website:(m("[data-launch-coin-website]")?.value||"").trim(),x:(m("[data-launch-coin-x]")?.value||"").trim(),telegram:(m("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:(()=>{const a=m("[data-launch-coin-creator-fee]")?.value;return a==="custom"?String(Math.min(1e3,Math.max(0,Math.round((Number(m("[data-launch-coin-creator-fee-custom]")?.value)||0)*100)))):a||e.creatorFeeBps||"1000"})(),creatorFeeRecipient:(m("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:m("[data-launch-coin-fee-mode]")?.value||e.feeMode||"dev",buybackWallet:(m("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!m("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!m("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:m("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:X(m("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(m("[data-launch-coin-ca]")?.value||"").trim(),action:m("[data-launch-coin-action]")?.value||"watch",tradePresetId:m("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:m("[data-launch-coin-bundle-preset]")?.value||"",amountSol:X(m("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:m("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:Ve("launch-coin"),walletGroup:m("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function $s(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function or({silent:e=!1}={}){try{const t=Gb();n.launchCoinDraft=t,Oa(t);const a=t.name||t.symbol||"launch";return n.launchCoinStatus=`Saved ${a}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${$s(t.action)}.`,e||w(m("[data-launch-coin-status]"),n.launchCoinStatus),t}catch(t){throw n.launchCoinStatus=t.message,w(m("[data-launch-coin-status]"),t.message),t}}function fu(e){return new Promise((t,a)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>a(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function hu(e){return new Promise((t,a)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>a(new Error("Could not preview that image for compression.")),r.src=e})}function un(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function gu(e){if(!e)return"";const t=8*1024*1024,a=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const s=await fu(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(s.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return s}try{const o=await hu(s),c=384,i=Math.min(1,c/Math.max(o.width||c,o.height||c)),d=document.createElement("canvas");d.width=Math.max(1,Math.round((o.width||c)*i)),d.height=Math.max(1,Math.round((o.height||c)*i)),d.getContext("2d").drawImage(o,0,0,d.width,d.height);const p=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of p){const b=d.toDataURL(f,y);if(b.length<=a)return b}}catch(o){const c=m("[data-launch-coin-status]"),i="Preview unavailable; SlimeWire will try to convert this image during launch.";if(n.launchCoinStatus=i,w(c,i),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:o?.message||""}),s.length<=r)return s}if(s.length<=r){const o=m("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return n.launchCoinStatus=c,w(o,c),s}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function bu(e){if(!e)return"";const t=8*1024*1024,a=7e6;if(e.size>t)throw new Error("Banner is over 8MB. Use a smaller wide image or GIF (1500×500 works best).");const r=await fu(e);if(e.type==="image/gif"||/\.gif$/i.test(e.name||"")){if(r.length>a)throw new Error("Animated banner is too large. Keep it under ~5MB.");return r}try{const s=await hu(r),o=1500,c=Math.min(1,o/Math.max(1,s.width||o)),i=document.createElement("canvas");i.width=Math.max(1,Math.round((s.width||o)*c)),i.height=Math.max(1,Math.round((s.height||Math.round(o/3))*c)),i.getContext("2d").drawImage(s,0,0,i.width,i.height);for(const[u,p]of[["image/webp",.82],["image/webp",.7],["image/jpeg",.8],["image/jpeg",.66]]){const f=i.toDataURL(u,p);if(f.length<=a)return f}}catch{}if(r.length<=a)return r;throw new Error("Banner is too large for upload. Use a smaller wide image or GIF.")}async function Xb(){const e=m("[data-launch-coin-banner]")?.files?.[0];if(e){const a=await bu(e);return{bannerName:e.name,bannerType:un(a,e.type||"image/jpeg"),bannerDataUrl:a}}const t=n.launchCoinDraft||{};return t.bannerDataUrl?{bannerName:t.bannerName||"banner",bannerType:t.bannerType||un(t.bannerDataUrl,"image/jpeg"),bannerDataUrl:t.bannerDataUrl}:{}}async function Jb(){const e=m("[data-launch-coin-image]")?.files?.[0];if(e){const a=await gu(e);return{imageName:e.name,imageType:un(a,e.type||"application/octet-stream"),imageDataUrl:a}}const t=n.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||un(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function yu(e,t){const a=String(t||"").trim();n.launchCoinDraft={...e||{},tokenMint:a,updatedAt:new Date().toISOString()},Oa(n.launchCoinDraft),n.terminalToken=a,n.terminalAutoToken=a,n.tradeToken=a,n.bundleToken=a,n.volumeToken=a,n.smartChartToken=a,e?.tradePresetId&&(n.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(n.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(n.quickBuyAmountOverride=X(e.amountSol))}function Yb(e={}){const t=e.tradePresetId?ce("trade",e.tradePresetId):null,a=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Qb(e={}){const t=e.tradePresetId?ce("trade",e.tradePresetId):null,a=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,walletIndexes:[a],amountSol:X(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function vu(e={}){const t=e.bundlePresetId?ce("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:X(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function Zb(){const e=or({silent:!0}),t=String(e.tokenMint||"").trim(),a=m("[data-launch-coin-status]");if(!t||t.length<32){n.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",w(a,n.launchCoinStatus);return}yu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";n.launchCoinStatus=`Loaded ${S(t)} into ${$s(e.action)}. Review the selected preset before sending any trade.`,Pe("/terminal",r),h({force:!0})}async function ey(e,t){const a=Date.now();let r="",s=0;for(;Date.now()-a<18e4;){await xe(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,s=0}catch{if(s+=1,s===4){const p="Progress feed reconnecting...";n.launchCoinStatus=p,w(t,p)}if(s>=15){const p=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw p.launchAttemptId=e,p}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const u=new Error(c.failureReason||"Launch failed.");throw u.launchAttemptId=e,u}const i=Math.round((Date.now()-a)/1e3),d=`${c.stageText||"Working..."} · ${i}s`;d!==r&&(r=d,n.launchCoinStatus=d,w(t,d))}const o=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw o.launchAttemptId=e,o}const wu=new Map;function Su(e){const t=String(e||"").trim();t&&wu.set(t,Date.now()+3e4)}function ty(e){const t=wu.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function ku(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(n.tradePlans=e.plans)}catch{}}function ay(e,t={},a={}){const r=String(e||"").trim();if(!r)return;const s=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||S(r),o=String(t.name||"").slice(0,48),c=Number(a.bundledWalletCount||0)+(a.devBuyIncluded?1:0)||1;(n.positions||[]).some(d=>String(d.tokenMint||d.mint)===r)||(n.positions=[{tokenMint:r,symbol:s,name:o,shortMint:S(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...n.positions||[]]),n.smartChartToken=r,n.terminalToken=r,cl({tokenMint:r,symbol:s,name:o,imageUrl:t.imageDataUrl||"",source:"launch"}),op(r)}async function ny(){if(n.launchCoinSubmitting)return;const e=m("[data-launch-coin-status]"),t=m("[data-launch-coin-submit]");n.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const a=or({silent:!0});if(!a.name||String(a.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!a.symbol||String(a.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!m("[data-launch-coin-image]")?.files?.[0]&&!n.launchCoinDraft?.imageDataUrl&&!await We({title:"No Coin Image Selected",lines:[`${a.name} (${a.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){n.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",w(e,n.launchCoinStatus);return}n.launchCoinStatus="Preparing image for SlimeWire backend conversion...",w(e,n.launchCoinStatus);const r=await Jb(),s=await Xb(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let c=null;if(a.action==="bundle"){const b=vu(a);c={walletIndexes:b.walletIndexes||[],walletGroup:b.walletGroup||"",amountSol:b.amountSol||"0",slippageBps:b.slippageBps||"300"}}const i={...a,...r,...s,launchAttemptId:o,...c?{bundleBuy:c}:{}},d=JSON.stringify(i);if(d.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:a.symbol,selectedDevWalletId:a.selectedDevWalletId||a.devWalletIndex||a.devWalletPublicKey||""}),n.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,w(e,n.launchCoinStatus);let p=(await k("/api/web/launch/coin",{method:"POST",body:d,timeoutMs:ae,preserveSafeError:!0})).launch||{};p.async&&p.status==="RUNNING"&&p.launchAttemptId&&(p=await ey(p.launchAttemptId,e));const f=String(p.tokenMint||p.mint||p.ca||p.contractAddress||"").trim(),y=p.signature?` Signature: ${S(p.signature)}.`:"";if(!f){n.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${y} The CA will appear above when it lands — then trade it from the Swap panel.`,w(e,n.launchCoinStatus);return}yu(a,f),n.launchShareKit={tokenMint:f,symbol:a.symbol||"",name:a.name||"",at:Date.now()},n.launchCoinDraft={tokenMint:f};try{Oa(n.launchCoinDraft)}catch{}if(p.bundled){const b=Number(p.bundledWalletCount||0),P=[p.devBuyIncluded?"dev buy":"",b>0?`${b} bundle buy${b===1?"":"s"}`:""].filter(Boolean).join(" + ");n.launchCoinStatus=p.bundleFallback?`Launched ${S(f)} via the standard path (bundle missed the block lottery)${P?` - server fired ${P} right behind the create`:""}.${y} Opening chart...`:`Launch bundled atomically: ${S(f)}${P?` (${P} landed in-block)`:""}${p.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${y} Opening chart...`,w(e,n.launchCoinStatus),ay(f,a,p),V(p.signature||"","pump-launch-first-buys"),St({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(p.bundleFallback||p.exitsArmed)&&Su(f),[3e3,8e3,16e3].forEach(A=>window.setTimeout(()=>{ku().then(()=>h())},A)),Pe("/terminal/chart","smartChart"),h({force:!0});return}if(n.launchCoinStatus=`Launch returned ${S(f)}.${y} Routing into ${$s(a.action)}...`,w(e,n.launchCoinStatus),a.devBuyEnabled&&(n.launchCoinStatus=`Launch returned ${S(f)}.${y} Running Dev Wallet Initial Buy first...`,w(e,n.launchCoinStatus),await Ns(f,Qb(a)),n.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${$s(a.action)} setup...`,w(e,n.launchCoinStatus)),a.action==="trade"){await Ns(f,Yb(a));return}if(a.action==="bundle"){await Gu(f,vu(a));return}if(a.action==="launch-watch"){n.activeTab="launch",Pe("/terminal","launch"),h({force:!0});return}Pe("/terminal/chart","smartChart"),h({force:!0})}catch(a){const r=a.launchAttemptId&&!String(a.message||"").includes(a.launchAttemptId)?` Launch ID: ${a.launchAttemptId}.`:"";n.launchCoinStatus=`${a.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:a.launchAttemptId||"",stage:a.stage||"",code:a.code||"",providerStatus:a.providerStatus||null,message:a.message||"Launch failed."}),w(e,n.launchCoinStatus),$(n.launchCoinStatus)}finally{n.launchCoinSubmitting=!1;const a=m("[data-launch-coin-submit]");a&&(a.disabled=!1,a.textContent=a.dataset.prevLabel||"Launch on Pump")}}function ry(){const e=n.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function $u(){return n.launchWatches.length?`
    <div class="mini-results">
      ${n.launchWatches.map(e=>`
        <span>
          $${l(e.ticker)} - ${l(e.status)} - ${l(e.walletCount)} wallet(s)
          ${Ye(Rg(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${l(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function Ts(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function Tu(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),a=et(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),s=String(e.kolName||e.traderName||e.kol_name||"").trim(),o=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||a||s||r,wallet:t,kolWallet:t,twitter:a,handle:a,name:s||o||e.signalType||e.symbol||S(r),displayName:s||o||"KOL signal",shortWallet:t?S(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||a?1:0),currentPositionCount:O(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:n.kolLastUpdatedAt||new Date().toISOString()}}function As(e={}){const t=Number(O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),a=ut(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(a),s=r?Math.max(0,Math.min(100,Math.round(a))):0,o=!r||t<5,c=o?"Mixed":s>=50?"High Dump Risk":s>=30?"Dump Risk":s<=15?"Trusted Flow":"Mixed",i=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),d=i[0]||"",u=et(e.handle||e.twitter||""),p=[{label:"Solscan",url:d?`https://solscan.io/account/${encodeURIComponent(d)}`:""},{label:"KOLscan",url:d?`https://kolscan.io/account/${encodeURIComponent(d)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(u?`https://x.com/${u}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,b)=>/^https?:\/\//i.test(String(f.url||""))&&b.findIndex(v=>String(v.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:Ts(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||S(e.wallet||e.kolWallet||"")),handle:u,walletAddresses:i,callsTracked:t,currentPositionCount:O(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:s,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?s:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:o,confidence:o?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:p,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:o?["Low local sell-window history. Wallet-based until social signal data is available."]:s>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function sy(e=[]){const t=new Map;for(const a of e.filter(Boolean)){const r=String(a.kolId||Ts(a)||"").trim();if(!r)continue;const s=t.get(r);t.set(r,s?{...s,...a,kolId:r}:{...a,kolId:r})}return[...t.values()]}function Ps(){const e=Array.isArray(n.kolDumpStats?.stats)?n.kolDumpStats.stats:[],t=Array.isArray(n.kolScan?.kols)?n.kolScan.kols:[],a=Array.isArray(n.kolScan?.rows)?n.kolScan.rows.map(Tu):[],r=!e.length&&!t.length&&!a.length?Ei():[];return sy([...e,...t.map(As),...a.map(As),...r.map(As)]).filter(s=>s.kolId)}function oy(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function ir(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${oy(e)} · ${t}`}function Au(e={}){const t=Ts(e);return t?Ps().find(a=>String(a.kolId||"")===t)||As(e):null}function iy(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const a=Ut(t)?t:"";return{kolId:t,displayName:a?S(a):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:a?[a]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:a?`https://solscan.io/account/${encodeURIComponent(a)}`:""},{label:"KOLscan",url:a?`https://kolscan.io/account/${encodeURIComponent(a)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function zi(e={},t="KOL Info"){if(!N("kolDumpDetectorEnabled",!0))return"";const a=Au(e),r=String(a?.kolId||Ts(e)||"").trim();if(!r)return"";const s=a?ir(a):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${l(r)}" title="${l(s)}">${l(t)}</button>`}function Pu(e={},t="KOL Info"){return N("kolDumpDetectorEnabled",!0)?zi(Tu(e),t):""}function ly(e={}){if(!N("kolDumpDetectorEnabled",!0))return"";const t=Au(e);return t?.kolId?`<small class="kol-dump-inline">${l(ir(t))}</small>`:""}function v0(){if(!N("kolDumpDetectorEnabled",!0))return"";const e=Ps().slice(0,6);return`
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
                <span>${l(t.handle?`@${t.handle}`:t.walletAddresses?.[0]?S(t.walletAddresses[0]):"wallet pending")}</span>
              </div>
              <p>${l(ir(t))}</p>
              <button type="button" data-kol-dump-details="${l(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:F("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function ji(e={}){if(!N("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&n.kolDumpStatsLoadedAt&&Date.now()-Number(n.kolDumpStatsLoadedAt||0)<900*1e3)return n.kolDumpStats;if(n.kolDumpStatsLoading)return null;n.kolDumpStatsLoading=!0;try{const a=new URLSearchParams({mode:n.kolMode||"hot"});n.kolWallet&&a.set("wallet",n.kolWallet),t&&a.set("force","true");const r=await k(`/api/web/kols/dump-stats?${a.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return n.kolDumpStats=r,n.kolDumpStatsLoadedAt=Date.now(),se(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return n.kolDumpStats=n.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},n.kolDumpStatsLoadedAt=Date.now(),null}finally{n.kolDumpStatsLoading=!1,n.kolDumpDetails?.open?Cs():n.activeTab==="kol"&&h({force:!0})}}function cy(e=""){const t=String(e||"").trim();!t||!N("kolDumpDetectorEnabled",!0)||(n.kolDumpDetails={open:!0,kolId:t},Ka(),Cs(),ji({force:!0}))}function Gi(){n.kolDumpDetails={open:!1,kolId:""},Cs(),jr()}function Cs(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=n.kolDumpDetails||{},a=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",a),!a||!N("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=Ps().find(u=>String(u.kolId)===String(t.kolId))||iy(t.kolId),s=!!n.kolDumpStatsLoading,o=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(u=>/^https?:\/\//i.test(String(u?.url||""))).slice(0,4):[],i=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${S(r.lastTokenMint)}`:"n/a",d=`
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
        <p>${l(ir(r))}</p>
        <small>${s?"Updating from KOL sources...":`Confidence: ${l(r.confidence||"low")} · Source: ${l(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${l(Te(r.updatedAt))}`}</small>
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
          <li><span>Wallets: ${l(o.length?o.map(S).join(", "):"not returned")}</span></li>
          <li><span>First seen: ${l(r.firstSeenAt?Te(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${l(r.lastSeenAt?Te(r.lastSeenAt):"n/a")}</span></li>
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
        <button type="button" data-kol-dump-refresh="${l(t.kolId)}" ${s?"disabled":""}>${s?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `;kn(e,d,".kol-dump-drawer")}function dy(){const e=n.kolScan?.configured!==!1,t=n.kolLoading?"disabled":"",a=String(n.kolMode||"hot"),r=!!n.kolScan,s=!!n.kolScan?.kols?.length,o=s&&a!=="hot",c=!r&&!s;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${n.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${n.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${n.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${n.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${n.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${n.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${l(py(n.kolMode))}</p>
    ${uy()}
    ${o?fy():c?Fg():""}
    ${n.kolMode==="slimewire"&&n.kolScan?n.kolScan.kols?.length?"":F("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):n.kolScan?hy():F("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
            ${$t("kol")}
          </div>
          ${qt("kol")}
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
            ${Ze("kol-delay","data-kol-delay","5")}
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
            ${gs("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${ys("kol")}
        <p class="trade-status" data-kol-status>${n.kolResult?l(n.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${my()}
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
            ${n.kolWallet?Ye(_d(n.kolWallet),"Share KOL"):""}
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
  `}function uy(){const e=n.kolScan||null,t=lr(n.kolMode),a=n.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),s=Number(e?.rows?.length||0),o=n.kolLastUpdatedAt?Te(n.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${l(a)}</span>
      <span>${l(r)} KOLs</span>
      <span>${l(s)} signals</span>
      <span>${l(o)}</span>
    </div>
  `}function lr(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function py(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function my(){const e=n.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function fy(){const e=n.kolScan||{},t=(e.kols||[]).filter(a=>a.wallet||a.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${l(e.label||"KOL Tracker")}</h3>
          <p>${l(`${lr(n.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${l(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((a,r)=>`
          <article class="kol-profile">
            ${Hd(a)}
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
            <small>${l(a.source==="slimewire"?`Tracking ${a.trackedWalletMode==="manual"?`${a.trackedWalletCount||0} wallet(s)`:"all wallets"}`:a.volumeLabel||"Volume n/a")} | Last trade: ${l(Te(a.lastTradeAt))}</small>
            ${ly(a)}
            <div class="card-actions kol-profile-actions">
              ${a.solscanUrl?`<a href="${l(a.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${a.kolscanUrl||a.wallet?`<a href="${l(a.kolscanUrl||Wc(a.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${zi(a)}
              ${Ye(Bg(a),"Share Watch")}
              ${a.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${l(a.wallet)}">Copy Trade</button>`:""}
              ${a.wallet?`<button data-kol-scan-wallet="${l(a.wallet)}">Scan Positions</button>`:""}
              ${a.wallet?`<button data-kol-copy-wallet="${l(a.wallet)}">Copy Wallet</button>`:""}
              ${a.wallet?`<button data-copy="${l(a.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function hy(){const e=n.kolScan||{};if(e.configured===!1)return F("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],a=it("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${l(lr(n.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${a.length}/${t.length} signals shown</span>
    </div>
    ${mt(a,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:Mg})}
    ${da("kol",t,"KOL signals")}
  `:F(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function Cu(){const e=m("input[data-wallet-label]"),t=m("input[data-wallet-count-input]"),a=m("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];$(""),w(a,"Creating wallets..."),r.forEach(s=>{s.disabled=!0,w(s,"Creating...")});try{const s=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(s)||s<1||s>20)throw new Error("Wallet count must be from 1 to 20.");await Q(a,"Creating secure web profile for wallet backups...");const o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:s})}),c=Array.isArray(o.wallets)?o.wallets:[];if(!c.length)throw new Error(o.message||"Wallet create did not return wallet data. Refresh and try again.");n.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&be(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&be(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),w(a,o.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const i=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(i?.wallets)&&(n.wallets=i.wallets)}catch{}n.toolSections={...n.toolSections||{},wallets:"balances"},n.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,V(Me(o.plan),"wallet-create"),n.activeTab="wallets",h()}catch(s){w(a,s.message),$(s.message)}finally{r.forEach(s=>{s.disabled=!1,w(s,"Create Wallets")})}}async function gy(){const e=m("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];$(""),n.automationDelegationStatus="Creating automation wallet...",w(e,n.automationDelegationStatus),t.forEach(a=>{a.disabled=!0,w(a,"Creating...")});try{await Q(e,"Creating secure web profile for automation wallet backups...");const a=n.user?.connectedWallet,r=a?.publicKey?`Automation ${S(a.publicKey)}`:"Automation Wallet",s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(s.wallets)?s.wallets:[]).length)throw new Error(s.message||"Automation wallet create did not return wallet data. Refresh and try again.");n.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&be(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&be(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),n.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",V(Me(s.plan),"automation-wallet-create"),n.activeTab="wallets",h({force:!0})}catch(a){n.automationDelegationStatus=a.message,w(e,a.message),$(a.message)}finally{t.forEach(a=>{a.disabled=!1,w(a,"Create Automation Wallet")})}}function by(e=null){const a=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||m("[data-session-wallet-amount]"),r=X(a?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const s=Number(r);if(!Number.isFinite(s)||s<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(s>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function yy(e=ie()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(n.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});he(t.user||{...n.user,connectedWallet:t.profile?.connectedWallet||null})}async function vy(e=null){const t=m("[data-automation-delegation-status]")||m("[data-wallet-connect-status]"),a=[...document.querySelectorAll("[data-create-session-wallet]")];$(""),a.forEach(r=>{r.disabled=!0,w(r,"Opening...")});try{const r=by(e),{provider:s,connected:o}=await Du();await Q(t,"Creating secure web profile for session wallet..."),await yy(o),n.automationDelegationStatus="Creating session wallet and funding approval...",w(t,n.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${S(o.publicKey)}`}),dedupe:!1,timeoutMs:ae});n.wallets=Array.isArray(c.wallets)?c.wallets:n.wallets,n.downloads=c.downloads||n.downloads||null,c.downloads?.encryptedBackup?.text&&be(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&be(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",w(t,n.automationDelegationStatus);const i=await zy(c.order?.transaction,s);n.automationDelegationStatus="Submitting session wallet funding...",w(t,n.automationDelegationStatus);const d=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:i}),dedupe:!1,timeoutMs:ae});n.wallets=Array.isArray(d.wallets)?d.wallets:n.wallets,n.automationDelegationStatus=d.message||"Session wallet funded and ready.",V(d.signature||"","session-wallet-funded"),await kt({force:!0,deep:!0,reason:"session-wallet-funded"}),n.activeTab="wallets",h({force:!0})}catch(r){const s=D(r.message||"Session wallet setup failed.");n.automationDelegationStatus=s,w(t,s),$(s)}finally{a.forEach(r=>{r.disabled=!1,w(r,"Start Session Wallet")})}}async function Xi(e="enable",t={}){const a=m("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],s=e!=="revoke";if(s&&!wd()){n.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",w(a,n.automationDelegationStatus),$(n.automationDelegationStatus),Ci();return}vd(!s,t.scope||""),n.automationDelegationStatus=s?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",w(a,n.automationDelegationStatus),r.forEach(o=>{o.disabled=!0,w(o,s?"Enabling...":"Revoking...")});try{await Q(a,"Creating secure web profile for automation permission...");const o=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:s?"enable":"revoke",ttlHours:720})});he(o.user||{...n.user,automationPermission:o.profile?.automationPermission||null});const c=n.user?.automationPermission||{};n.automationDelegationStatus=s?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${Te(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(o){n.automationDelegationStatus=o.message,w(a,o.message),$(o.message)}finally{r.forEach(o=>{o.disabled=!1,w(o,o.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function Ji(e={}){const t=!!e.silent,a=e.refreshWallet!==!1;if(!n.user||!n.token){t||$("Log in or create a web account before checking server exits.");return}if(Kr){n.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}Kr=!0,t||(n.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:ae});n.tradePlans=r.plans||n.tradePlans||[];const s=r.runner||{},o=r.webExitGuards||{},c=r.portfolioExits||{},i=Number(s.soldWallets||0)+Number(o.soldGuards||0)+Number(c.soldPositions||0),d=Number(s.triggeredWallets||0)+Number(o.triggeredGuards||0)+Number(c.triggeredPositions||0);if(s.skipped){const u=Number(s.activeForMs||0),p=u>0?` for ${Math.ceil(u/1e3)}s`:"";n.automationDelegationStatus=s.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${p}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${s.reason||"runner busy"}.`,a&&!t&&await pi({force:!0});return}n.automationDelegationStatus=wy(s),(a||i>0||d>0)&&await pi({force:!0}),t&&(i>0||d>0)&&h({preserveSmartChartFrame:n.activeTab==="smartChart"})}catch(r){n.automationDelegationStatus=r.message,n.walletRefreshError=r.message,t||$(r.message)}finally{Kr=!1,t||(n.walletRefreshing=!1,h())}}function wy(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),a=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),s=Number(e.failedWallets||0),o=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${a}, sold ${r}, failed ${s}.${o}`}function Yi(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(n.tradePlans||[]).some(t=>{const a=String(t.status||"").toLowerCase();return a==="launch_watch"?!0:a!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function Sy(){return!!(Sd()&&Yi()&&!Kr)}function Ls(){Yi()&&(n.automationDelegationStatus=n.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),ky()}let xs="";function ky(){const t=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(i=>["watching","active","armed","pending"].includes(String(i.status||"").toLowerCase()));if(!t.length){xs="";return}const a=Date.now(),r=t.filter(i=>i.automationPermissionExpiresAt&&!i.automationPermissionActive),s=t.filter(i=>{if(!i.automationPermissionActive)return!1;const d=Date.parse(i.automationPermissionExpiresAt||"");return Number.isFinite(d)&&d>a&&d-a<3600*1e3});let o="";if(r.length)o=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(s.length){const i=Math.min(...s.map(u=>Date.parse(u.automationPermissionExpiresAt)));o=`TP/SL permission expires in ~${Math.max(1,Math.round((i-a)/6e4))} min with ${s.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=o?`${r.length}:${s.length}`:"";o&&c!==xs?(xs=c,$(o)):o||(xs="")}function $y(){In.forEach(e=>window.clearTimeout(e)),In=[]}function Ms(){$y(),n.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",In=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const a=window.setTimeout(()=>{In=In.filter(r=>r!==a),!(!n.user||!n.token||!Yi())&&Ji({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{n.automationDelegationStatus=r.message})},t);return a})}async function Ty(){const e=m("[data-restore-text]"),t=m("[data-restore-status]");if(!e||!t)return;const a=e.value.trim();if(!a){w(t,"Choose a backup file or paste backup text first.");return}w(t,"Restoring wallets...");try{await Q(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:a})});n.restoreResult=r.restore,r.restore?.downloads&&(n.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&be(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&be(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",w(t,r.restore?.message||"Restore complete."),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(r){w(t,r.message)}}async function Ay(){const e=m("[data-export-status]");if(e){w(e,"Building backup files...");try{await Q(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});n.backupResult=t.backup,t.backup?.downloads&&(n.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&be(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&be(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),w(e,t.backup?.message||"Backup ready."),h()}catch(t){w(e,t.message)}}}async function Py(){const e=m("[data-import-label]"),t=m("[data-import-secret]"),a=m("[data-import-status]");if(!e||!t||!a)return;const r=e.value.trim()||"Imported Wallet",s=t.value.trim();if(!s){w(a,"Paste a private key or JSON secret-key array first.");return}w(a,"Importing wallet...");try{await Q(a,"Creating secure web profile for imported wallet...");const o=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:s})});n.importResult=o.imported,o.imported?.downloads&&(n.downloads=o.imported.downloads,o.imported.downloads.encryptedBackup&&be(o.imported.downloads.encryptedBackup.filename,o.imported.downloads.encryptedBackup.text),o.imported.downloads.recoveryKeys&&be(o.imported.downloads.recoveryKeys.filename,o.imported.downloads.recoveryKeys.text)),t.value="",w(a,o.imported?.message||"Import complete."),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(o){w(a,o.message)}}async function Cy(e,t="this wallet",a=""){const r=String(t||`Wallet ${e}`);if(!await We({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await We({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=m("[data-wallet-remove-status]");n.walletRemoveStatus=`Backing up ${r} before removal...`,w(c,n.walletRemoveStatus),$("");try{const i=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(a?{publicKeys:[a]}:{walletIndexes:[String(e)]})}),d=i.removed||{};n.downloads=d.downloads||n.downloads,d.downloads?.encryptedBackup?.text&&be(d.downloads.encryptedBackup.filename,d.downloads.encryptedBackup.text),d.downloads?.recoveryKeys?.text&&be(d.downloads.recoveryKeys.filename,d.downloads.recoveryKeys.text),n.walletRemoveStatus=d.message||`Removed ${r}.`,Array.isArray(d.wallets)&&(n.wallets=d.wallets),V(Me(i.plan),"wallet-remove"),n.activeTab="wallets",h()}catch(i){n.walletRemoveStatus=i.message,w(c,i.message),$(i.message)}}function Ly(){const e=String(m("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(a=>a.trim()).filter(Boolean),walletGroup:String(m("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(m("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(m("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(m("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function xy(){const e=String(m("[data-wallet-send-from]")?.value||"1").trim(),t=String(m("[data-wallet-send-managed-targets]")?.value||"").trim(),a=String(m("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(m("[data-wallet-send-destinations]")?.value||"").trim(),s=t.toLowerCase()==="all"?n.wallets.map(d=>Number(d.index)).filter(d=>Number.isFinite(d)&&String(d)!==e):t.split(/[,\s]+/).map(d=>Number.parseInt(d,10)).filter(d=>Number.isInteger(d)&&d>0&&String(d)!==e),o=a?n.wallets.filter(d=>{const u=String(d.label||"").toLowerCase();return u===a||u.startsWith(`${a} `)}).map(d=>Number(d.index)).filter(d=>Number.isFinite(d)&&String(d)!==e):[],c=[...new Set([...s,...o])].map(d=>n.wallets.find(u=>Number(u.index)===d)?.publicKey).filter(Boolean),i=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(m("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!m("[data-wallet-send-all]")?.checked,destinations:i}}function My(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const a=e.rows.slice(0,6).map(r=>{const s=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,o=r.ok?"ok":"failed";return`${s}: ${o} - ${r.message||r.signature||"done"}`});t.push(...a),e.rows.length>a.length&&t.push(`...${e.rows.length-a.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function By(e){const t=m("[data-wallet-sweep-status]");n.walletSweepStatus="Running wallet action...",w(t,n.walletSweepStatus),$("");try{await Q(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const s=e==="send-sol-many"?xy():Ly();if(e==="sell-all"&&(s.destination=""),e==="sell-all-sweep"&&!s.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const o=await k(r,{method:"POST",body:JSON.stringify(s),timeoutMs:ae});n.walletSweepStatus=My(o.sweep),w(t,n.walletSweepStatus),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(a){n.walletSweepStatus=a.message,w(t,a.message),$(a.message)}}async function Ry(e){const t=m("[data-restore-status]"),a=m("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!a)){w(t,"Reading backup file...");try{a.value=await r.text(),w(t,"Backup loaded. Tap Restore Wallets.")}catch(s){w(t,`Could not read file: ${s.message}`)}}}function be(e,t){const a=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(a),s=document.createElement("a");s.href=r,s.download=e,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Iy(){const e=m("[data-x-handle]"),t=m("[data-x-status]"),a=et(e?.value||"");if(!a){w(t,"Enter a valid X handle first.");return}const r=window.open(_i(a),"_blank","noopener,noreferrer");try{w(t,r?`Opening X and saving @${a}...`:`Saving @${a}. Allow popups if X did not open.`),await Q(t,"Creating secure web profile for X sharing...");const s=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:a})});he(s.user||{...n.user,xHandle:s.profile?.xHandle||a}),tc(n.xHandle),w(t,`Connected @${n.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(s){w(t,s.message),$(s.message)}}function Oy(){const e=m("[data-x-status]"),t=et(m("[data-x-handle]")?.value||n.xHandle||""),a=_i(t||n.xHandle);window.open(a,"_blank","noopener,noreferrer"),w(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function Ey(){const e=m("[data-x-status]"),t=m("[data-x-handle]");try{if(!n.user||!n.token){n.xHandle="",t&&(t.value=""),Wo(),w(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const a=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});he(a.user||{...n.user,xHandle:""}),n.xHandle="",t&&(t.value=""),Wo(),w(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(a){w(e,a.message),$(a.message)}}async function Bs(e,t="Saving PFP..."){const a=m("[data-avatar-status]");w(a,t);try{await Q(a,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});he(r.user||{...n.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),w(a,n.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){w(a,r.message),$(r.message)}}async function Fy(e){const t=m("[data-avatar-status]"),a=e?.files?.[0];if(a){if(!/^image\/(png|jpe?g|webp)$/i.test(a.type)){w(t,"Use a PNG, JPG, or WebP image.");return}if(a.size>5*1024*1024){w(t,"Use an image under 5 MB.");return}try{w(t,"Compressing PFP...");const r=await Lu(a);await Bs({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){w(t,r.message),$(r.message)}finally{e.value=""}}}function Lu(e){return new Promise((t,a)=>{const r=new FileReader;r.onerror=()=>a(new Error("Could not read that image.")),r.onload=()=>{const s=new Image;s.onerror=()=>a(new Error("Could not load that image.")),s.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const i=c.getContext("2d");if(!i){a(new Error("This browser cannot resize images."));return}const d=Math.max(256/s.width,256/s.height),u=Math.round(s.width*d),p=Math.round(s.height*d),f=Math.round((256-u)/2),y=Math.round((256-p)/2);i.clearRect(0,0,256,256),i.drawImage(s,f,y,u,p);const b=c.toDataURL("image/jpeg",.84);if(b.length>22e4){a(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(b)},s.src=String(r.result||"")},r.readAsDataURL(e)})}async function Wy(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,a=new URL(String(e||""),t).toString(),r=await fetch(a,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const s=await r.blob();return Lu(s)}async function _y(){const e=Wi(n.xHandle);if(!e){const t=m("[data-avatar-status]");w(t,"Connect an X handle first.");return}await Bs({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function xu(e,t={}){const a=Un(),r=ge(e);if(!r){if(await Oc(e,t)||Ec(e))return;const s=$c(e);oe(s),Wt(e,new Error(s),{action:"provider_missing",platform:Ge()?"mobile":"desktop"});return}try{const s=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(s){if(!(t.confirmSwitch===!1?!0:await We({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${S(s)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){oe("Wallet connection unchanged."),Pe("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}oe(`Opening ${_e(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,i=c?.toBase58?.()||c?.toString?.()||"";if(!i)throw new Error("Wallet connected, but no public address was returned.");await Q(a,"Creating secure web profile for connected wallet...");const d=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:i,provider:_e(e,r)})});he(d.user||{...n.user,connectedWallet:d.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:i,shortPublicKey:S(i),provider:_e(e,r),tokens:[]},Pi(`connected:${i}`),n.walletConnectMenuOpen=!1,oe(`Connected ${S(i)}. Opening Live Terminal...`),Pe(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),kd("browser-wallet-connect"),Zr("browser-wallet-connect")}catch(s){const o=s.message||"Wallet connection was cancelled.";oe(o),Wt(e,s,{action:"connect_failed"})}}async function Mu(){await du("disconnecting");const e=Un(),t=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(!n.user||!n.token){n.connectedWalletBalance=null,Pi(t?`connected:${t}`:""),oe("Connected wallet disconnected."),h({force:!0});return}try{const a=n.user?.connectedWallet?.provider||"";await(a.toLowerCase().includes("phantom")?ge("phantom"):a.toLowerCase().includes("solflare")?ge("solflare"):a.toLowerCase().includes("backpack")?ge("backpack"):ge("solana"))?.disconnect?.()}catch{}try{const a=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});he(a.user||{...n.user,connectedWallet:null}),n.connectedWalletBalance=null,Pi(t?`connected:${t}`:""),oe("Connected wallet disconnected."),h({force:!0})}catch(a){oe(a.message),$(a.message)}}async function Dy(){const e=m("[data-profile-username]"),t=m("[data-profile-password]"),a=m("[data-login-security-status]"),r=String(e?.value||"").trim(),s=String(t?.value||"");if(!r||!s){w(a,"Enter a username and password first.");return}try{await Q(a,"Creating secure web profile..."),w(a,"Saving login...");const o=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:s})});he(o.user||{...n.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),w(a,"Saved. You can now log back in with this username and password."),h()}catch(o){w(a,o.message),$(o.message)}}function et(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function Qi(e){const t=Ii(e),a=String(n.user?.referralLink||"").trim(),r=a&&!t.includes("/r/")?a:Rt,s=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(s,"_blank","noopener,noreferrer")}function Bu(e){const t=e==="kol",a=m(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=m("[data-share-watch-status]"),s=a?.value?.trim()||"";if(!s){w(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}Qi(t?_d(s):Oi(s)),w(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function Ru(e){const t={};n.token&&(t.Authorization=`Bearer ${n.token}`);const a=await _n(Ga(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!a.ok){const r=await kc(a);throw new Error(r.message||r.error||`Could not build PnL card (${a.status}).`)}return{blob:await a.blob(),filename:a.headers.get("x-ogre-filename")||`pnl-card-${S(e)}.png`}}async function Iu(e){const{blob:t,filename:a}=await Ru(e),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Ny(e,t){try{const{blob:a,filename:r}=await Ru(e),s=new File([a],r,{type:"image/png"});if(navigator.canShare?.({files:[s]})){await navigator.share({title:"SlimeWire PnL Card",text:Ii(t),url:Rt,files:[s]});return}await Iu(e),Qi(`${t} PnL card downloaded and ready to attach.`)}catch(a){$(a.message)}}function Ou(e="buy"){const t=m("[data-trade-wallet]")?.value||"",a=Th(e)||m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,e==="sell"?(n.tradeSwapFrom=a,n.tradeSwapTo="SOL"):(n.tradeSwapFrom="SOL",n.tradeSwapTo=a),{walletIndex:t,tokenMint:a,slippageBps:r}}function pe(e=""){return String(e||"").trim().toLowerCase()==="connected"}function Uy(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function Eu(){const e=Array.isArray(n.wallets)?n.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(Uy(e[t]))return e[t];return null}function Fu(e=ie()){if(!e?.publicKey)return!1;const t=cr(e),a=ge(t)||ge("solana");return!!(a&&typeof a.signTransaction=="function")}function Rs(e=ie()){const t=e?.provider||_e(cr(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function Is(e={},{side:t="trade",statusWriter:a=ye,allowSessionFallback:r=!0}={}){if(!pe(e.walletIndex))return{form:e,sessionWallet:null};if(Fu())return{form:e,sessionWallet:null};const s=r?Eu():null;if(s?.index){const o=`Using Session Wallet ${s.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof a=="function"&&a(o),{form:{...e,walletIndex:String(s.index)},sessionWallet:s}}throw new Error(Rs())}function Wu(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function _u(e=""){const t=atob(String(e||"")),a=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)a[r]=t.charCodeAt(r);return a}function cr(e=ie()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function qy(e=ie(),{returnPath:t=Ja()||"/terminal/trade"}={}){const a=cr(e),r=e?.provider||_e(a);if(ma({returnPath:t}),Ge()&&e?.publicKey&&!ge(a)){const o=Rs(e);return oe(o),o}if(Ic(a)){const o=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(oe(o),await Oc(a,{returnPath:t}).catch(()=>!1))return o}if(Ec(a))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const s=$c(a);return oe(s),s}async function Du(){const e=ie();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=cr(e),a=ge(t)||ge("solana");if(!a){if(Ge()&&e?.publicKey)throw new Error(Rs(e));const o=await qy(e,{returnPath:Ja()||"/terminal/trade"});throw new Error(o)}if(typeof a.signTransaction!="function")throw Ge()&&e?.publicKey?new Error(Rs(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"";let s=r();if(s!==e.publicKey)try{const o=await a.connect?.({onlyIfTrusted:!0});s=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r()}catch{}if(s!==e.publicKey){const o=await a.connect?.({onlyIfTrusted:!1}),c=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${S(e.publicKey)} connected, but the browser returned ${S(c)}. Reconnect the wallet you want to trade with.`)}return{provider:a,connected:e}}async function Hy(){try{if(Ge())return;const e=ie();if(!e?.publicKey)return;const t=cr(e),a=ge(t)||ge("solana");if(!a||typeof a.connect!="function"||(a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"")===e.publicKey)return;await a.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const Ky=6e4;async function Nu(e,t,a=Ky){let r=0;const s=new Promise((o,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},a)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),s])}finally{window.clearTimeout(r)}}async function Vy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.VersionedTransaction.deserialize(_u(e)),r=await Nu(t,a);return Wu(r.serialize())}async function zy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.Transaction.from(_u(e)),r=await Nu(t,a);return Wu(r.serialize())}function jy({side:e,connected:t,form:a={},actionDetail:r="",amountSol:s="",amountMode:o="",percent:c=""}={}){const i=e==="sell"?"Sell":"Buy",d=`${t?.provider||"Connected wallet"} ${t?.publicKey?S(t.publicKey):""}`.trim(),u=e==="sell"?`${c||r||"100"}%`:o==="max"?"Max SOL":`${s||r||"custom"} SOL`;return We({title:`Confirm ${i}`,lines:[`${i} with ${d}?`,`Token: ${a.tokenMint||""}`,`Amount: ${u}`,"Next step: approve the transaction in your wallet."],confirmLabel:i})}async function dr({side:e,form:t,actionDetail:a,amountSol:r="",amountMode:s="",percent:o="",attemptId:c,statusWriter:i=ye}){const d=typeof i=="function"?i:ye,{provider:u,connected:p}=await Du();if(!n.walletFastApprovalsEnabled&&!await jy({side:e,connected:p,form:t,actionDetail:a,amountSol:r,amountMode:s,percent:o}))throw new Error("Connected-wallet trade cancelled.");km(`${e==="buy"?"Buy":"Sell"} ${S(t.tokenMint||"")}`),Re("submitted","pending"),d(n.walletFastApprovalsEnabled?`Building ${e} approval for ${p.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:p.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:s,percent:o,tradeAttemptId:c}),dedupe:!1,timeoutMs:ae});Re("submitted","ok"),Re("approved","pending",`Approve in ${p.provider||"your wallet"}`),d(`Approve ${e} in ${p.provider||"your wallet"}...`);let y;try{y=await Vy(f.order?.transaction,u)}catch(v){throw Re("approved","fail",D(v?.message||"Wallet approval was declined.")),v}Re("approved","ok"),Re("sent","pending"),d("Submitting signed trade...");let b;try{b=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:ae})}catch(v){throw z(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"error",error:D(v?.message||"Trade submit failed.")}),V("",`browser-${e}-error`,{tradeAttemptId:c}),Re("sent","fail",D(v?.message||"Submit failed - it may still have landed; positions are being re-checked.")),d(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),v}return Re("sent","ok"),Re("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),n.tradeResult=b.trade,d(b.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),z(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"submitted",signature:b.trade?.signature||""}),V(b.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),b.trade}function Ke(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function pn(e,t){const a=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(a)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Gy(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let a=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=pn(a,r),{enabled:Ke(e)||Ke(t)||Ke(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function Uu(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let a=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=pn(a,r),{enabled:Ke(e)||Ke(t)||Ke(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function ye(e){const t=m("[data-trade-status]");w(t,e)}function De(e=""){n.chartTradeStatus=String(e||""),w(m("[data-chart-trade-status]"),n.chartTradeStatus)}function Zi(e="",t=""){n.quickBuyModal={...n.quickBuyModal,status:String(e||""),error:String(t||"")};const a=m("[data-quick-buy-modal-status]"),r=m("[data-quick-buy-modal-error]");w(a,n.quickBuyModal.status),w(r,n.quickBuyModal.error),a&&(a.hidden=!n.quickBuyModal.status),r&&(r.hidden=!n.quickBuyModal.error)}async function Os(e,t="fixed"){const a=L();let r=t==="max"?"max":String(e||"custom"),s="";try{let o=Ou("buy");r=t==="max"?"max":String(e||"custom");const c=ot("trade-buy",o.tokenMint,r);if(c){se("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${S(o.tokenMint)}:${r}`});return}s=wt("trade-buy");const i={tokenMint:o.tokenMint,walletIndex:o.walletIndex,slippageBps:o.slippageBps,tradeAttemptId:s},d=ol();if((Ke(d.takeProfitPct)||Ke(d.stopLossPct)||Ke(d.sellDelay))&&Object.assign(i,{autoExit:!0,...d}),t==="max")i.amountMode="max";else{const v=Number(e);if(!Number.isFinite(v)||v<=0)throw new Error("Enter a buy amount greater than zero.");i.amountSol=String(v)}if(o=Is(o,{side:"buy",statusWriter:ye}).form,i.walletIndex=o.walletIndex,pe(o.walletIndex)){z("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:L()-a,requestId:s,details:`browser-buy:${S(o.tokenMint)}:${r}`}),ye("Building wallet-approved buy..."),ue(),await dr({side:"buy",form:o,actionDetail:r,amountSol:i.amountSol||"",amountMode:i.amountMode||"fixed",attemptId:s}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-buy",o.tokenMint,r,3e3);return}const f=Gy();f.enabled&&Object.assign(i,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),z("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-a,requestId:s,details:`trade-buy:${S(o.tokenMint)}:${r}`}),h(),ye(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await xe(20);const y=L();z("trade-buy",o.tokenMint,r,{state:"submitting"});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...i,clientClickToUiMs:Math.round(y-a)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-y,requestId:s,resultCount:b.trade?.signature?1:0,details:"trade-buy"}),n.tradeResult=b.trade,km(`Buy ${S(o.tokenMint||"")}`),Re("submitted","ok"),Re("sent","ok"),Re("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),b.trade?.autoExitPlan?(Re("armed","ok"),n.tradePlanResult=b.trade.autoExitPlan,ye(b.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),Ms()):b.trade?.autoExitRequested&&(Re("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),ye("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),z("trade-buy",o.tokenMint,r,{state:"submitted",signature:b.trade?.signature||""}),V(b.trade?.signature,"trade-buy",{tradeAttemptId:s}),n.activeTab="trade",h(),Le("trade-buy",o.tokenMint,r,3e3)}catch(o){s&&(z("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,{state:"error",error:D(o.message||"Buy failed")}),Le("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-a,requestId:s,errorCode:o?.code||o?.name||"TRADE_BUY_FAILED",details:D(o.message||"Buy failed")}),ye(o.message)}}async function el(e){const t=L(),a=wt("manual-sell");let r=null,s=String(e||"custom");try{r=Ou("sell");const o=Number.parseInt(e,10);if(s=String(o||s),!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=ot("trade-sell",r.tokenMint,s);if(c){se("buttonDoubleClickPrevented"),W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${S(r.tokenMint)}:${o}`});return}if(z("trade-sell",r.tokenMint,s,{state:"clicked",tradeAttemptId:a,clickedAt:new Date().toISOString()}),ye("Sending sell..."),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-t,requestId:a,details:`${S(r.tokenMint)}:${o}`}),r=Is(r,{side:"sell",statusWriter:ye}).form,pe(r.walletIndex)){ue();const p=L();z("trade-sell",r.tokenMint,s,{state:"submitting"}),await dr({side:"sell",form:r,actionDetail:s,percent:String(o),attemptId:a}),W({component:"manual-sell",action:"browser-sell-request",durationMs:L()-p,requestId:a,resultCount:n.tradeResult?.signature?1:0,details:"browser-wallet"}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-sell",r.tokenMint,s,3e3);return}h(),await xe(20);const d=L();z("trade-sell",r.tokenMint,s,{state:"submitting"});const u=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:o,manualSellAttemptId:a,clientClickToUiMs:Math.round(d-t)}),timeoutMs:ae,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-d,requestId:a,resultCount:u.trade?.signature?1:0,details:"single-wallet"}),n.tradeResult=u.trade,ye(u.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),z("trade-sell",r.tokenMint,s,{state:"submitted",signature:u.trade?.signature||""}),V(u.trade?.signature||Me(u.trade),"manual-sell-trade"),n.activeTab="trade",h(),Le("trade-sell",r.tokenMint,s,3e3)}catch(o){r?.tokenMint&&(z("trade-sell",r.tokenMint,s,{state:"error",error:D(o.message||"Sell failed")}),Le("trade-sell",r.tokenMint,s,4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-t,requestId:a,errorCode:o?.code||o?.name||"MANUAL_SELL_FAILED",details:D(o.message||"Sell failed")}),ye(o.message)}}function Xy(){const e=Ve("trade-plan"),t=m("[data-trade-plan-group]")?.value?.trim()||"",a=m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),s=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),o=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),i=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:i}=pn(c,i));const d=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,n.volumeToken=a,n.bundleToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:c,takeProfitPct:s,stopLossPct:o,sellPercent:i,loopCount:"1",loopDelay:"0",slippageBps:d,...ga("trade-plan")}}async function Jy(){try{const e=Xy();ye("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});n.tradePlanResult=t.plan,n.tradeResult=null,V(t.trade?.signature,"trade-plan"),n.activeTab="trade",h()}catch(e){ye(e.message)}}function Yy(){const e=Ve("volume"),t=m("[data-volume-group]")?.value?.trim()||"",a=m("[data-volume-token]")?.value?.trim()||"",r=m("[data-volume-amount]")?.value||"";let s=x("[data-volume-delay]","[data-volume-delay-custom]","5");const o=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),i=x("[data-volume-loop]","[data-volume-loop-custom]","1"),d=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let u=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:s,sellPercent:u}=pn(s,u));const p=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.volumeToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:i,loopDelay:d,sellPercent:u,slippageBps:p,...ga("volume")}}function qu(e){const t=m("[data-volume-status]");w(t,e)}async function Qy(){try{const e=Yy();qu("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});n.volumeResult=t.plan,V(Me(t.plan),"volume-plan"),n.activeTab="volume",h()}catch(e){qu(e.message)}}function Zy(e){const t=Ve("sniper"),a=m("[data-sniper-group]")?.value?.trim()||"",r=m("[data-sniper-amount]")?.value||"",s=x("[data-sniper-delay]","[data-sniper-delay-custom]",n.scanMode==="pumpsnipe"?"3":"5"),o=x("[data-sniper-tp]","[data-sniper-tp-custom]",n.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),i=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),d=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),u=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",n.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{mode:n.scanMode,tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,slippageBps:u,loopCount:i,loopDelay:d,...ga("sniper")}}function Hu(e){const t=m("[data-sniper-status]");w(t,e)}async function ev(e){try{const t=Zy(e);Hu("Buying and arming exits...");const a=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});n.sniperResult=a.plan,V(Me(a.plan),"sniper-entry"),n.activeTab="sniper",h()}catch(t){Hu(t.message)}}function tv(){const e=Ve("ogre-ai"),t=m("[data-ogre-ai-group]")?.value?.trim()||"",a=m("[data-ogre-ai-amount]")?.value?.trim()||"",r=hs(),s=m("[data-ogre-ai-runs]")?.value||"1",o=m("[data-ogre-ai-tp]")?.value||"25",c=m("[data-ogre-ai-tp-custom]")?.value?.trim()||"",i=m("[data-ogre-ai-sl]")?.value||"8",d=m("[data-ogre-ai-sl-custom]")?.value?.trim()||"",u=m("[data-ogre-ai-delay]")?.value||"5",p=m("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=m("[data-ogre-ai-slippage]")?.value||"400",y=m("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";cf({amountSol:a,runCount:s,category:r,takeProfitSelect:o,takeProfitCustom:c,stopLossSelect:i,stopLossCustom:d,delaySelect:u,delayCustom:p,slippageSelect:f,slippageCustom:y,walletGroup:t});const b=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","60"),v=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","100"),P=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","40"),A=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),g="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!a)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:a,runCount:s,sellDelay:b,takeProfitPct:v,stopLossPct:P,sellPercent:"100",slippageBps:A,minScore:g,recentMints:ac()}}function Es(e){n.ogreAiStatus=e||"";const t=m("[data-ogre-ai-status]");w(t,n.ogreAiStatus)}async function av(){if(Vr){Ua=!0,Es("Stopping the hunt after this scan...");return}const e=Symbol("ogre-ai-run");Ua=!1;try{const t=tv();n.ogreAiLoading=!0,Vr=e;const a=Array.isArray(t.recentMints)?[...t.recentMints]:[];let r=null,s=!1,o=0;const c=120;for(;!s&&!Ua&&o<c&&(o+=1,Es(o===1?"Scanning fresh low-MC pairs and arming managed exits...":`Hunting fresh pairs... (scan ${o}) - tap Scan again to stop.`),h(),r=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify({...t,recentMints:a}),timeoutMs:ae}),s=Number(r.ogreAi?.armedCount||0)>0||(r.ogreAi?.plans?.length||0)>0,!s);){for(const i of r.ogreAi?.errors||[])i?.tokenMint&&!a.includes(i.tokenMint)&&a.push(i.tokenMint);for(const i of r.ogreAi?.attemptedPicks||[])i?.tokenMint&&!a.includes(i.tokenMint)&&a.push(i.tokenMint);if(Ua)break;await xe(5e3)}n.ogreAiResult=r?.ogreAi,lf(r?.ogreAi),n.tradePlanResult=r?.ogreAi?.plans?.[0]||n.tradePlanResult,Es(s?r?.ogreAi?.message||"Ogre A.I. run armed.":Ua?"Hunt stopped. Tap Scan to hunt again.":"Still hunting - no clean fresh pair armed yet. Tap Scan to keep going."),s&&V(Me(r?.ogreAi?.plans?.[0]),"ogre-ai-run"),n.activeTab="ogreAi",h()}catch(t){Es(t.message),$(t.message)}finally{n.ogreAiLoading=!1,Ua=!1,Vr===e&&(Vr=null),h()}}function ur(e){const t=m("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function nv({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");n.ogreAutopilot=t.autopilot||null,n.activeTab==="ogreAi"&&h()}catch(t){e||ur(t.message)}}function rv(){return{enabled:!!m("[data-autopilot-enabled]")?.checked,category:hs(),amountSol:m("[data-ogre-ai-amount]")?.value?.trim()||(n.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:Ve("ogre-ai"),walletGroup:m("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:m("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:m("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:m("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:m("[data-autopilot-interval]")?.value?.trim()||"10"}}async function sv(){if(n.ogreAutopilotBusy)return;const e=rv();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){ur("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await We({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${nu(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){n.ogreAutopilotBusy=!0,ur(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});n.ogreAutopilot=t.autopilot||null,ur(n.ogreAutopilot?.lastStatus||"Saved.")}catch(t){ur(t.message),$(t.message)}finally{n.ogreAutopilotBusy=!1,h()}}}function Kt(e){const t=m("[data-kol-status]");w(t,e)}function ov(e){const t=Ve("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),d=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),u=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:i,loopDelay:d,sellPercent:"100",slippageBps:u,...ga("kol")}}function iv(e){const t=Ve("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),i=x("[data-kol-loop]","[data-kol-loop-custom]","1"),d=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),u=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),p=String(e||n.kolWallet||m("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!p)throw new Error("Paste or choose a KOL wallet first.");if(!Ut(p))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:p,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:i,loopDelay:d,sellPercent:"100",slippageBps:u,...ga("kol")}}async function lv(e){try{const t=ov(e);Kt("Buying and arming KOL copy plan...");const a=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,V(Me(a.plan),"kol-copy-plan"),n.activeTab="kol",h()}catch(t){Kt(t.message)}}async function cv(e){try{const t=iv(e);Kt("Arming Copy Wallet watch...");const a=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,n.kolWallet=t.copyWallet,n.activeTab="kol",h()}catch(t){Kt(t.message)}}function Ve(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function Fs(e){const t=m("[data-bundle-status]");w(t,e)}function Ku(){const e=m("[data-bundle-token]")?.value?.trim()||"",t=Ve("bundle"),a=m("[data-bundle-group]")?.value?.trim()||"",r=m("[data-bundle-amount]")?.value||"",s=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),o=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,percent:s,slippageBps:o}}function dv(){const e=Ku();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),a=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:a}=pn(t,a),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:a,...ga("bundle-plan")}}async function Vu(e){const t=L();let a=null,r="";const s=e==="buy"?"bundle-buy":"bundle-sell";try{a=Ku();const o=ot(s,a.tokenMint,"bundle");if(o){se("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-t,cacheHit:!0,requestId:o.tradeAttemptId||"",details:`${s}:${S(a.tokenMint)}`});return}r=wt(s),z(s,a.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-t,requestId:r,details:`${s}:${S(a.tokenMint)}`}),h(),Fs(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await xe(20);const c=L();z(s,a.tokenMint,"bundle",{state:"submitting"});const i=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...a,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-c,requestId:r,resultCount:i.bundle?.successCount||0,details:s}),n.bundleResult=i.bundle,z(s,a.tokenMint,"bundle",{state:"submitted",signature:Me(i.bundle)}),V(Me(i.bundle),`bundle-${e}`,{tradeAttemptId:r}),n.activeTab="bundle",h(),Le(s,a.tokenMint,"bundle",3e3)}catch(o){a?.tokenMint&&(z(s,a.tokenMint,"bundle",{state:"error",error:D(o.message||"Bundle trade failed")}),Le(s,a.tokenMint,"bundle",4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-t,requestId:r,errorCode:o?.code||o?.name||"BUNDLE_TRADE_FAILED",details:D(o.message||"Bundle trade failed")}),Fs(o.message)}}async function uv(){try{const e=dv();Fs("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});n.bundleResult=t.plan,V(Me(t.plan),"bundle-plan"),n.activeTab="bundle",h()}catch(e){Fs(e.message)}}function ce(e,t){return(n.presets?.[e]||[]).find(a=>a.id===t)||null}function zu(){(n.selectedTradePresetId==="custom"||n.selectedTradePresetId&&!ce("trade",n.selectedTradePresetId))&&(n.selectedTradePresetId=""),(n.selectedBundlePresetId==="custom"||n.selectedBundlePresetId&&!ce("bundle",n.selectedBundlePresetId))&&(n.selectedBundlePresetId=""),n.editingTradePresetId&&!ce("trade",n.editingTradePresetId)&&(n.editingTradePresetId=""),n.editingBundlePresetId&&!ce("bundle",n.editingBundlePresetId)&&(n.editingBundlePresetId="")}function pv(e,t="trade",a=""){t==="bundle"?n.bundleToken=e:n.tradeToken=e,n.activeTab=t,a&&$(a),window.history.pushState({},"","/terminal"),h({force:!0})}async function ju(e=""){const t=String(e||"").trim();if(!t)return;const a=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),s=(o,c={})=>Tt(ve(o,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){s(a);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){$(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}s(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(o){$(o.message||"Token search failed.")}}function ve(e="",t={}){const a=String(e||"").trim(),r=a?mr().find(s=>String(s?.tokenMint||"")===a):null;return{chain:"solana",tokenMint:a,tokenAddress:a,mint:a,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||S(a),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||a.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function w0(e={},t={}){return ve(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function Ws(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(n.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},zs(n.smartChartTokenRef),n.terminalToken=t,n.terminalAutoToken=t,n.tradeToken=t,n.bundleToken=t,n.volumeToken=t,n.smartChartToken=t,t):""}function mv(e,t={}){const a=new URLSearchParams;a.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return a.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&a.set("view",t.view),t.focusAmountInput&&a.set("focusAmount","1"),t.source&&a.set("source",String(t.source).slice(0,40)),t.returnTo&&a.set("returnTo",t.returnTo),`/terminal/chart?${a.toString()}`}function tl(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),a=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||a.includes("pump")),s=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!s)}function fv(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const _s=new Map;function al(e){const t=String(e||"").trim();if(!t)return;const a=_s.get(t)||0;Date.now()-a<3e4||(_s.set(t,Date.now()),_s.size>200&&_s.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function Tt(e={},t={}){oa("chartRouteStart");const a=L(),r=Ws(e);if(!r){$("Select a token before opening the chart.");return}ul(e,{source:t.source||"token-entry"}),al(r),n.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),n.smartChartView=fv(n.smartChartTokenRef||e,t),n.chartFocusAmountInput=!!t.focusAmountInput,n.chartScrollIntoView=!0,n.activeTab="smartChart",n.route="terminal",n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.chartTradeStatus="",n.chartBuyWalletIndex="";const s=mv(r,{defaultTab:t.defaultTab||"buy",view:n.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Ja()});window.history.pushState({},"",s),h({force:!0}),K("chart-route-open",a,{component:"smartChart",cacheHit:!!(tt(r)?.cacheHit||gr(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function nl(){if(!window.location.pathname.includes("/terminal/chart"))return;oa("chartRouteStart");const e=L(),t=new URLSearchParams(window.location.search||""),a=String(t.get("token")||t.get("mint")||"").trim(),r=String(n.smartChartToken||"").trim();if(a){const s=ve(a,{source:t.get("source")||"route"});Ws(s),ul(s,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{mn(s,{forceModal:!0,source:"deep-link"})}catch{}},900),a!==r&&(n.chartTradeStatus="",n.chartBuyWalletIndex="")}n.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",n.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",n.chartFocusAmountInput=t.get("focusAmount")==="1",n.chartScrollIntoView=!0,n.route="terminal",n.activeTab="smartChart",K("chart-route-apply",e,{component:"smartChart",cacheHit:!!(tt(a)?.cacheHit||gr(a)?.pairAddress),details:a})}function mn(e={},t={}){const a=Ws(e);if(!a){$("Select a token before quick buying.");return}const r=fn(a);if(r&&Ks(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const s=t.preset||pt(),o=s&&!t.forceModal?ze(s):"",c=s?.walletIndex||(s?.walletIndexes||[])[0]||(n.wallets[0]?.index?String(n.wallets[0].index):"");if(s&&o&&c&&!t.forceModal){Ns(a,{...s,walletIndex:c,walletIndexes:[c]});return}if(!t.forceModal){const d=X(n.quickBuyAmountOverride),p=ie()?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"";if(d&&Number(d)>0&&p){pr({tokenMint:a,walletIndex:p,amountSol:d,slippageBps:"400",source:t.source||"quick-buy-bar",...ol()}).catch(f=>$(f.message));return}}const i=ie();n.quickBuyModal={open:!0,tokenMint:a,amountSol:o||n.quickBuyAmountOverride||"",walletIndex:i?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"",slippageBps:"400",status:o?`Preset ${o} SOL loaded. Confirm when ready.`:s?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},al(a),h({force:!0}),requestAnimationFrame(()=>m("[data-quick-buy-modal-amount]")?.focus())}function rl(){n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function hv(e={},t={}){if(!N("protectedBuyEnabled",!0))return;const a=Ws(e);if(!a){$("Select a token before opening Protected Buy.");return}const r=fn(a);if(r&&Ks(r)){$("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const s=$a(a)||{tokenMint:a},o=at(s),c=t.presetId||o.protectedBuyPreset||hl(o.verdict),i=Number(X(t.amountSol||n.quickBuyAmountOverride||ze()||"0.1")),d=c==="conservative"&&Number.isFinite(i)&&i>.25?"0.25":wr(i||.1),u=ie();al(a),n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.protectedBuyModal={open:!0,tokenMint:a,presetId:c,amountSol:d,walletIndex:t.walletIndex||(u?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:o.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>m("[data-protected-buy-amount]")?.focus())}function Ds(){n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function gv(){const e=n.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),a=String(m("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(m("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),s=X(m("[data-protected-buy-amount]")?.value||e.amountSol||""),o=String(m("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(m("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!s)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:a,walletIndex:r,amountSol:s,slippageBps:o,riskAccepted:c}}function bv(){const e=n.protectedBuyModal||{};if(!e.open)return"";const t=$a(e.tokenMint)||{tokenMint:e.tokenMint},a=at(t),r=Js(e.presetId),s=pe(e.walletIndex),o=a.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${l(t.symbol||t.shortMint||S(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${l(hn(a.verdict))}">${l(a.verdict||"CAUTION")}</strong>
      </div>
      <p>Adds a simple TP/SL plan before wallet confirmation. You still review and sign in your wallet.</p>
      <div class="protected-buy-grid">
        <label>
          Wallet
          <select data-protected-buy-wallet>
            ${ln(e.walletIndex)}
          </select>
        </label>
        <label>
          Buy SOL
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${l(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${fl.map(i=>`<option value="${i.id}" ${i.id===r.id?"selected":""}>${l(i.label)}</option>`).join("")}
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
        <small>${l(bw(r))}</small>
        <small>Wallet: ${l(vw(e.walletIndex))}</small>
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
      ${e.status?`<small class="connect-status">${l(e.status)}</small>`:""}
      ${e.error?`<small class="warning-text">${l(e.error)}</small>`:""}
      <small class="protected-buy-safe-copy">Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</small>
    </section>
  `}function sl(){let e=m("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!n.protectedBuyModal?.open||!N("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=bv(),document.body.classList.add("protected-buy-modal-open")}async function yv(){try{const e=gv(),t=$a(e.tokenMint)||{tokenMint:e.tokenMint};if(at(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Js(e.presetId);if(n.protectedBuyModal={...n.protectedBuyModal,...e,status:pe(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},sl(),pe(e.walletIndex)){const s=await pr({...e,source:`protected-buy:${r.id}`});n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),$(s?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await xe(20),n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ns(e.tokenMint,yw(e,r))}catch(e){n.protectedBuyModal={...n.protectedBuyModal||{},open:!0,status:"",error:D(e.message||"Protected Buy failed.")},h({force:!0})}}function vv(){const e=String(n.quickBuyModal?.tokenMint||"").trim(),t=String(m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"").trim(),a=X(m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||""),r=String(m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!a)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r}}function ol(){const e=pt();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function pr({tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r="400",source:s="quick-buy",takeProfitPct:o="",stopLossPct:c="",sellDelay:i="off",sellPercent:d="100"}){const u=Number(a);if(!Number.isFinite(u)||u<=0)throw new Error("Enter a SOL amount greater than zero.");const p=wt("quick-buy"),f=pn(i,d),y=Ke(o)||Ke(c)||Ke(f.sellDelay);let b={tokenMint:e,walletIndex:t,slippageBps:r};const v=n.quickBuyModal?.open?T=>Zi(T,""):ye;if(b=Is(b,{side:"buy",statusWriter:v}).form,t=b.walletIndex,n.quickBuyLast={source:s,tokenMint:e,walletConnected:pe(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:p,status:"submitting",error:""},z("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:p,clickedAt:new Date().toISOString()}),n.quickBuyModal={...n.quickBuyModal,status:pe(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:p},pe(t)){Zi("Opening wallet approval...",""),ue();const T=await dr({side:"buy",form:b,actionDetail:String(a),amountSol:String(u),amountMode:"fixed",attemptId:p,statusWriter:v});if(n.quickBuyLast={...n.quickBuyLast,status:"submitted"},y){const C="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";n.quickBuyModal?.open?Zi(C,""):ye(C)}return T}h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await xe(20);const A={tokenMint:e,walletIndex:t,amountSol:String(u),slippageBps:r,tradeAttemptId:p};y&&Object.assign(A,{autoExit:!0,takeProfitPct:o,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(A),dedupe:!1,timeoutMs:ae});return n.tradeResult=g.trade,g.trade?.autoExitPlan&&(n.tradePlanResult=g.trade.autoExitPlan,Ms()),V(g.trade?.signature,"quick-buy-custom",{tradeAttemptId:p}),z("trade-buy",e,String(a),{state:"submitted",signature:g.trade?.signature||""}),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},g.trade}async function wv(e=""){const t=L(),a=X(m("[data-chart-buy-amount]")?.value||""),r=Number(a);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let s=m("[data-chart-buy-wallet]")?.value||"";if(!s)throw new Error("Choose a wallet before buying.");const o=wt("chart-buy");let c={tokenMint:e,walletIndex:s,slippageBps:m("[data-chart-buy-slippage]")?.value||"400"};if(c=Is(c,{side:"chart buy",statusWriter:De}).form,s=c.walletIndex,ot("trade-buy",e,String(a)))return n.tradeResult;if(n.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:pe(s),customAmountValid:!0,presetAmount:"",tradeAttemptId:o,status:"submitting",error:""},z("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),De(pe(s)?"Opening wallet approval...":"Submitting Session Wallet buy..."),W({component:"post-trade",action:pe(s)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:L()-t,requestId:o,details:`${pe(s)?"browser":"session"}-buy:${S(e)}:${a}`}),ue(),pe(s)){const y=await dr({side:"buy",form:c,actionDetail:String(a),amountSol:String(r),amountMode:"fixed",attemptId:o,statusWriter:De});return n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",De(y?.message||"Buy submitted from connected wallet."),Le("trade-buy",e,String(a),3e3),y}const u=Uu(),p={tokenMint:e,walletIndex:s,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:o};u.enabled&&Object.assign(p,{autoExit:!0,takeProfitPct:u.takeProfitPct,stopLossPct:u.stopLossPct,sellDelay:u.sellDelay,sellPercent:u.sellPercent}),De(u.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(p),dedupe:!1,timeoutMs:ae});return n.tradeResult=f.trade,f.trade?.autoExitPlan&&(n.tradePlanResult=f.trade.autoExitPlan,Ms()),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",z("trade-buy",e,String(a),{state:"submitted",signature:f.trade?.signature||""}),V(f.trade?.signature,"chart-session-buy",{tradeAttemptId:o}),De(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Le("trade-buy",e,String(a),3e3),f.trade}async function Sv(){try{const e=vv(),t=Ri(n.quickBuyModal?.error||n.quickBuyModal?.status||"");if(t)throw new Error(t);n.quickBuyModal={...n.quickBuyModal,...e,status:"Validating quick buy...",error:""};const a=await pr({...ol(),...e,source:n.quickBuyModal?.source||"quick-buy-modal"});n.quickBuyModal={...n.quickBuyModal,open:!1,status:a?.message||"Quick buy submitted.",error:""},n.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Le("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=D(e.message||"Quick buy failed."),a=Ri(t);n.quickBuyLast={...n.quickBuyLast||{},status:"failed",error:a||t},n.quickBuyModal={...n.quickBuyModal,status:a?"Token safety blocked fast buy.":"",error:a||t},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"})}}async function Ns(e,t=null){const a=L(),r=t||ce("trade",n.selectedTradePresetId);let s="quick";if(!r){mn(ve(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const o=t?X(r.amountSol):ze(r);if(!o)throw new Error("Set a quick buy amount first.");s=String(o);const c=ot("trade-buy",e,s);if(c){W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${S(e)}:${o}`});return}const i=wt("quick-trade");z("trade-buy",e,s,{state:"clicked",tradeAttemptId:i,clickedAt:new Date().toISOString()}),$("Quick buy queued. Checking preset wallet..."),n.tradeToken=e,h({preserveSmartChartFrame:n.activeTab==="smartChart"}),await xe(0),await Q(null,"Opening secure web profile...");const d=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!n.wallets.some(y=>String(y.index)===String(d)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const u={tokenMint:e,walletIndex:d,amountSol:o,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};$(""),n.tradeToken=e,await xe(20);const p=L();z("trade-buy",e,s,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...u,tradeAttemptId:i,clientClickToUiMs:Math.round(p-a)}),dedupe:!1,timeoutMs:ae});n.tradeResult=f.trade,f.trade?.autoExitPlan?(n.tradePlanResult=f.trade.autoExitPlan,$(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),Ms()):f.trade?.autoExitRequested&&$("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),n.tradeToken=e,z("trade-buy",e,s,{state:"submitted",signature:f.trade?.signature||""}),V(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:i}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-buy",e,s,3e3)}catch(o){e&&(z("trade-buy",e,s,{state:"error",error:D(o.message||"Quick buy failed")}),Le("trade-buy",e,s,4e3)),$(o.message)}}async function Gu(e,t=null){const a=t||ce("bundle",n.selectedBundlePresetId);if(!a){pv(e,"bundle");return}try{n.bundleToken=e,$("Bundle preset queued. Checking wallets..."),h(),await xe(0),await Q(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(a.walletIndexes||[]).filter(o=>n.wallets.some(c=>String(c.index)===String(o))),walletGroup:a.walletGroup||"",amountSol:t?X(a.amountSol)||"0.1":gw(a),percent:"100",slippageBps:a.slippageBps,sellDelay:a.sellDelay||"off",takeProfitPct:a.takeProfitPct,stopLossPct:a.stopLossPct,sellPercent:a.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");$("");const s=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});n.bundleResult=s.plan,n.bundleToken=e,V(Me(s.plan),"quick-preset-bundle"),n.activeTab="bundle",h()}catch(r){$(r.message)}}async function Us(e,t="100",a={}){const r=L();let s=Number.parseInt(t,10),o="";try{if(await Q(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=oi(e,String(s));if(c){W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${S(e)}:${s}`});return}const i=lt().find(v=>String(v.tokenMint)===String(e)),d=i?.symbol||i?.name||S(e),u=!!(i?.source==="connected-wallet"||i?.viewOnly||String(i?.walletIndex||"").toLowerCase()==="connected"),p=String(ie()?.publicKey||"").trim();if(u&&p){o=wt("manual-sell"),ia(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`browser:${S(e)}:${s}`}),$(""),n.activeTab!=="smartChart"&&(n.activeTab="positions");const v=n.activeTab==="smartChart"?De:A=>$(A);v("Building wallet-approved sell..."),ue(),ia(e,String(s),{state:"submitting"});const P=await dr({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:a.slippageBps||"400"},actionDetail:`${s}%`,percent:String(s),attemptId:o,statusWriter:v});n.tradeResult=P,ia(e,String(s),{state:"submitted",signature:P?.signature||""}),V(P?.signature,"browser-manual-sell",{tradeAttemptId:o}),n.activeTab==="smartChart"?(De(P?.message||"Sell submitted from connected wallet."),ue()):h({preserveSmartChartFrame:!1}),ii(e,String(s),3e3);return}if(!(!!a.skipConfirm||await We({title:"Confirm Exit",lines:[`Exit ${s}% of ${d}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${s}%`,danger:!0})))return;o=wt("manual-sell"),ia(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`${S(e)}:${s}`}),n.activeTab="positions",$(""),h(),await xe(20);const y=L();ia(e,String(s),{state:"submitting"});const b=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:s,slippageBps:"400",manualSellAttemptId:o,clientClickToUiMs:Math.round(y-r)}),timeoutMs:ae,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-y,requestId:o,resultCount:b.bundle?.successCount||0,details:b.bundle?.duplicate?"duplicate":"submitted"}),n.bundleResult=b.bundle,n.bundleToken=e,n.tradeToken=e,ia(e,String(s),{state:(b.bundle?.duplicate,"submitted"),signature:Me(b.bundle),backendMs:b.bundle?.manualSellTiming?.backendMs||null}),V(Me(b.bundle),"manual-sell-position"),n.activeTab="positions",h(),ii(e,String(s),3e3)}catch(c){e&&Number.isInteger(s)&&(ia(e,String(s),{state:"error",error:D(c.message||"Sell failed")}),ii(e,String(s),4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-r,requestId:o,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:D(c.message||"Sell failed")}),$(c.message),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}}function Me(e){return e?.signature?e.signature:(e?.results||[]).find(a=>a.signature)?.signature||""}async function kv(){const e=m("[data-tx-audit-signature]")?.value?.trim()||n.terminalTxSignature||"";if(!e){$("Paste a transaction signature first.");return}n.terminalTxSignature=e,n.terminalTxLoading=!0,n.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);n.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){n.terminalTxAudit={error:t.message||"Transaction audit failed."},$(t.message)}finally{n.terminalTxLoading=!1,h()}}function $v(e,t="manager"){const a=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Trade Preset",walletIndex:m(`[data-${a}-preset-wallet]`)?.value||"1",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"25",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}:{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Bundle Preset",walletIndexes:Ve(`${a}-preset`),walletGroup:m(`[data-${a}-preset-group]`)?.value?.trim()||"",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"60",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}}function Tv(e,t){const a=(t||[]).find(r=>!r.readonly);a?.id&&(e==="trade"&&(n.selectedTradePresetId=a.id),e==="bundle"&&(n.selectedBundlePresetId=a.id))}function qs(e,t){const a=!!(t&&ce(e,t));e==="trade"&&(n.selectedTradePresetId=a?t:""),e==="bundle"&&(n.selectedBundlePresetId=a?t:"")}function il(e,t){e==="trade"&&(n.fastTradePresetStatus=t),e==="bundle"&&(n.fastBundlePresetStatus=t)}function Av(e,t){qs(e,t),il(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Xu(e,t="manager"){const a=m(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await Q(a,"Creating secure web profile for presets..."),w(a,"Saving preset...");const r=$v(e,t),s=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});n.presets=s.presets||n.presets,r.id&&ce(e,r.id)?qs(e,r.id):Tv(e,n.presets?.[e]),t==="manager"&&bs(e,""),t==="fast"&&il(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),w(a,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&il(e,r.message),w(a,r.message),$(r.message)}}async function Pv(e,t){try{const a=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});n.presets=a.presets||n.presets,e==="trade"&&n.selectedTradePresetId===t&&qs("trade",""),e==="bundle"&&n.selectedBundlePresetId===t&&qs("bundle",""),(e==="trade"&&n.editingTradePresetId===t||e==="bundle"&&n.editingBundlePresetId===t)&&bs(e,""),h()}catch(a){$(a.message)}}function Ju(e,t){bs(e,t),n.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const a=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);a?.scrollIntoView({behavior:"smooth",block:"start"}),a?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function Yu(e={}){const t=m("[data-referral-status]");try{await Q(t,"Opening secure web profile..."),w(t,e.generate?"Generating referral code...":"Saving referral settings...");const a=String(m("[data-referral-code]")?.value||"").trim(),r=Tg(m("[data-referral-link]")?.value||""),s=String(n.user?.referralCode||"").trim(),o=e.generate?a:r&&r!==s&&(!a||a===s)?r:a||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:o,generateReferralCode:!!e.generate,referralPayoutWallet:m("[data-referral-wallet]")?.value||""})});he(c.user);const i=c.user?.referralCode||n.user?.referralCode||"";w(t,e.generate?`Generated ${i}. Link is ready.`:`Referral settings saved. Code: ${i}`),h()}catch(a){w(t,a.message),$(a.message)}}async function Cv(){const e=m("[data-trader-board-status]");try{await Q(e,"Opening secure web profile..."),w(e,"Saving trader board settings...");const t=m("[data-trader-board-wallet-mode]")?.value||"all",a=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!m("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:Ve("trader-board")})});he(a.user),w(e,a.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){w(e,t.message),$(t.message)}}async function Qu(e,t){const a=t.dataset.watchToken||t.dataset.unwatchToken||"";if(a)try{await Q(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:a,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});n.watchlist=r.watchlist||n.watchlist,h()}catch(r){$(r.message)}}function ll(e){const t=m("[data-launch-status]");w(t,e)}function Lv(){const e=m("[data-launch-ticker]")?.value?.trim()||Pt(Be().keywords)[0]||"",t=Ve("launch"),a=m("[data-launch-group]")?.value?.trim()||"",r=m("[data-launch-amount]")?.value||"",s=x("[data-launch-tp]","[data-launch-tp-custom]","40"),o=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),i=x("[data-launch-loop]","[data-launch-loop-custom]","1"),d=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),u=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return Be().keywords=e,Be().open=!0,{ticker:e,walletIndexes:t,walletGroup:a,amountSol:r,takeProfitPct:s,stopLossPct:o,sellDelay:c,loopCount:i,loopDelay:d,slippageBps:u,...ga("launch")}}async function xv(){try{const e=Lv();ll("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});n.launchResult=t.watch,await ca(),n.activeTab="launch",h()}catch(e){ll(e.message)}}async function Mv(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});n.launchResult=t.watch,await ca(),n.activeTab="launch",h()}catch(t){ll(t.message)}}function Bv(){return`
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
  `}function Rv(){const e=eu();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${l(n.sweepBackgroundStatus||"")}</small>
    </section>`}async function Iv(){if(!n.sweepBackgroundPending){n.sweepBackgroundPending=!0,n.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:ae});n.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await kt({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){n.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{n.sweepBackgroundPending=!1,h({force:!0})}}}function Ov(){const e=Wv(),a=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${Zu()}
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
      ${qi().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${sn(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${l(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${l(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${_v(r)}
            ${r.sessionWallet?`<small>Session source: ${l(S(r.sourceConnectedWallet||""))}${r.fundingAmountSol?` | Budget ${l(r.fundingAmountSol)} SOL`:""}</small>`:""}
            </div>
          </div>
          <div class="card-actions compact">
            <button data-copy="${r.publicKey}">Copy</button>
            <button class="danger-lite" data-remove-wallet="${r.index}" data-remove-wallet-key="${l(r.publicKey)}" data-wallet-label="${l(`${r.index}. ${r.label}`)}">Remove</button>
          </div>
        </article>
      `).join("")}
    </div>
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${Cb()}${Rv()}${Pb()}${Bv()}`},{key:"create",label:"Create",hint:"New wallets",html:cs()},{key:"import",label:"Import",hint:"Add keys",html:Od()},{key:"backup",label:"Backup",hint:"Save / restore",html:Id()},{key:"downloads",label:"Downloads",hint:"Exports",html:Ed()}];if(!n.wallets.length){const r=a.filter(s=>s.key!=="balances"&&s.key!=="fund");return`
      ${e}
      ${F("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${cn({toolKey:"wallets",activeKey:dn("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${cn({toolKey:"wallets",activeKey:dn("wallets","balances"),sections:a})}
  `}function Ev(){return(Array.isArray(n.wallets)?n.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function Fv(){if(!(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey)return"";const t=Ev();return t?`
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
    </div>`}function Wv(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.connectedWalletBalance||{},a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",o=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${l(c.dexUrl||Z(c.mint))}" target="_blank" rel="noreferrer">
      ${gt({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
      <span>${l(c.symbol||c.shortMint||S(c.mint))}: ${l(c.uiAmount??"held")}</span>
    </a>
  `).join("");return`
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${l(e.provider||t.provider||"Solana Wallet")} ${l(S(e.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${l(a)}</strong></span>
          <span><small>Tokens</small><strong>${l(r)}</strong></span>
          <span><small>Status</small><strong>${t.error?"Needs refresh":"Synced"}</strong></span>
        </div>
        ${t.error?`<small>Check failed: ${l(t.error)}</small>`:""}
        ${o?`<div class="connected-token-list">${o}</div>`:""}
        ${Fv()}
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
  `}function Zu(){const e=n.balances.reduce((a,r)=>a+Number(r.tokens?.length||0),0)+rd().length,t=n.balances.filter(a=>a.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${vi()}</strong></div>
      <div><span>Total SOL</span><strong>${Dt().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function _v(e){const t=n.balances.find(o=>Number(o.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${l(t.error)}</span>`;const a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${l(a)} | ${l(r)}${l(s)}</span>`}function Dv(){const e=lt(),t=`
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
    ${Nv()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(Vp).join("")}
    </div>
  `:`${t}${F("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function Nv(){const e=n.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${l(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const a=t.filter(s=>!s.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
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
              <strong>$${l(s.symbol)} <span style="color:${r[s.verdict]||"#9fb59a"};font-weight:800">${l(s.verdict)}${s.score!=null?` ${l(String(s.score))}/100`:""}</span></strong>
              <small>${s.flags.length?l(s.flags.join(" | ")):"no red flags"}${s.liquidityUsd!=null?` | liq ${M(s.liquidityUsd)}`:""}${s.marketCapUsd?` | MC ${M(s.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${l(s.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${l(s.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function Uv(e){const t=String(e||"").trim();if(!t)return;n.devWatch||(n.devWatch={});const a=!n.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:a}),timeoutMs:15e3});n.devWatch[t]=!!r.watching}catch(r){$(r?.message||"Could not update dev watch.")}Ta()}async function qv(e,t=null){const a=String(e||"").trim();if(!a)return;const r=pt();t&&(t.disabled=!0,t.textContent="Arming...");try{const s=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:a,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});Su(a),n.walletRemoveStatus=s.message||"Exits armed.",t&&(t.textContent="✅ Armed"),ku().then(()=>h())}catch(s){$(s?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function Hv(){n.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});n.bagScan={status:"done",bags:e.bags||[]}}catch(e){n.bagScan={status:"error",message:e?.message||""}}h()}function Kv(){const e=`
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
            ${gt(t)}
            <div>
              <strong>${l(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${l(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${l(t.tokenMint)}">${l(S(t.tokenMint))}</button>
            </div>
          </div>
          <span>${l(t.spentSol||"0")} SOL</span>
          <span>${l(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${l(t.realizedSol||"0")}</span>
          <span>${l(t.holdTime||"n/a")}<small>Latest ${l(Te(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ye(Wd(t),"Share")}
            <button data-pnl-card="${l(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${l(t.tokenMint)}" data-share-text="${l(Wd(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${F("No PnL yet","Trades made through the bot will show here.")}`}function mr(){return Vv(fr())}function fr(){const e=Object.values(n.livePairsByBucket||{}).flatMap(s=>s?.rows||[]),t=n.scan?.rows||[],a=n.kolScan?.rows||[],r=n.watchlist?.rows||[];return[...e,...t,...a,...r]}function fn(e=""){const t=String(e||"");return t&&fr().find(a=>String(a?.tokenMint||"")===t)||null}function S0(e=""){const t=fn(e);return!t||!Ks(t)?!1:($("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function Vv(e=[]){const t=new Map;for(const a of e||[]){if(hr(a))continue;const r=String(a?.tokenMint||"");r&&!t.has(r)&&t.set(r,a)}return[...t.values()]}function we(e=[]){const t=new Map;for(const a of e||[]){if(hr(a))continue;const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||Hs(a)>Hs(s))&&t.set(r,a)}return[...t.values()]}function Hs(e={}){return tw(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(O(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function zv(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function Ks(e={}){if(zv(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function hr(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function ep(){const e=mr(),t=o=>e.find(c=>String(c.tokenMint)===o)||{tokenMint:o,shortMint:S(o),symbol:S(o),dexUrl:Z(o)},a=String(n.terminalToken||n.tradeToken||"").trim();if(a)return t(a);const r=String(n.terminalAutoToken||"").trim();if(r)return t(r);const s=(qe()?.rows||[])[0]||e[0]||null;return s?.tokenMint&&(n.terminalAutoToken=String(s.tokenMint)),s}function Vs(){const e=mr(),t=n.smartChartTokenRef||null,a=s=>e.find(o=>String(o.tokenMint||"")===s)||{...String(t?.tokenMint||"")===s?t:{},tokenMint:s,shortMint:S(s),symbol:t?.symbol||S(s),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||Z(t?.pairAddress||s),pumpUrl:s.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(s)}`:""},r=String(n.smartChartToken||n.terminalToken||n.tradeToken||"").trim();return rp(r?a(r):ep())}function tp(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const jv=300*1e3,ap=45*1e3,np=600*1e3,Gv=700,Xv=6e3,Jv=4,Yv=3e4;function tt(e=""){const t=String(e||"").trim();if(!t)return null;const a=n.smartChartBootstrap?.[t]||null;if(!a)return null;const r=Date.now()-Number(a.loadedAt||a.resolvedAt||0);return a.status==="failed"?r<ap?a:null:r<np?a:null}function gr(e=""){const t=String(e||"").trim(),a=t?n.smartChartDexResolution?.[t]||tt(t):null;if(!a)return null;const r=Date.now()-Number(a.resolvedAt||0);return a.status==="failed"?r<ap?a:null:r<jv?a:null}function rp(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=gr(t);return!a||a.status==="failed"?e:{...e,pairAddress:e.pairAddress||a.pairAddress||"",pairId:e.pairId||a.pairAddress||"",dexUrl:e.dexUrl||a.dexUrl||a.pairUrl||"",dexId:e.dexId||a.dexId||"",dexName:e.dexName||a.dexName||a.dexId||"",symbol:e.symbol||a.symbol||S(t),name:e.name||a.name||"Token",imageUrl:e.imageUrl||a.imageUrl||"",marketCap:e.marketCap||a.marketCap||0,marketCapUsd:e.marketCapUsd||a.marketCap||0,fdv:e.fdv||a.fdv||0,liquidityUsd:e.liquidityUsd||a.liquidityUsd||0,volumeH24:e.volumeH24||a.volumeH24||0,volumeH1:e.volumeH1||a.volumeH1||0,priceUsd:e.priceUsd||a.priceUsd||0,h1:e.h1||a.h1||0,volume:e.volume||a.volume||null,txns:e.txns||a.txns||null}}function cl(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const a=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:a,resolvedAt:a};n.smartChartBootstrap={...n.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&zs({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function zs(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.pairAddress||e.pairId||"").trim();!t||!a&&!e.dexUrl&&!e.symbol&&!e.name||(n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{...n.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:a,dexUrl:e.dexUrl||Z(a||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||n.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||n.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||n.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||n.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||n.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||n.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||n.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function Qv(e={}){const t=String(e?.tokenMint||n.smartChartToken||"").trim();if(!t)return!1;const a=String(e?.pairAddress||e?.pairId||"").trim();if(a)return zs({...e,tokenMint:t,pairAddress:a}),!1;if(tt(t)?.pairAddress)return!1;const r=gr(t);return r?.pairAddress||r?.status==="failed"?!1:(n.smartChartDexResolving?.[t]||(n.smartChartDexResolving={...n.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{ip(t).catch(()=>{})},0)),!0)}function sp(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||n.smartChartToken||"").trim();return!a||!t.force&&tt(a)?.status==="resolved"?!1:(n.smartChartBootstrapLoading?.[a]||(n.smartChartBootstrapLoading={...n.smartChartBootstrapLoading||{},[a]:!0},window.setTimeout(()=>{ip(a,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const dl=new Map;async function op(e){const t=String(e||"").trim();if(!t)return;const a=dl.get(t)||0;if(Date.now()-a<3e4)return;dl.set(t,Date.now());const r=async()=>{const d=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(u=>u?.chainId==="solana").sort((u,p)=>(Number(p?.liquidity?.usd)||0)-(Number(u?.liquidity?.usd)||0))[0];if(!d)throw new Error("no pair");return d},s=async()=>{const o=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!o?.pair)throw new Error("no pair");return o.pair};try{const o=await Promise.any([r(),s()]);cl({tokenMint:t,symbol:o.baseToken?.symbol||"",name:o.baseToken?.name||"",priceUsd:o.priceUsd,marketCap:o.marketCap||o.fdv||null,marketCapUsd:o.marketCap||o.fdv||null,fdv:o.fdv||null,liquidityUsd:Number(o.liquidity?.usd)||null,liquidity:{usd:Number(o.liquidity?.usd)||null},volumeH24:Number(o.volume?.h24)||null,volumeH1:Number(o.volume?.h1)||null,h1:Number(o.priceChange?.h1)||null,imageUrl:o.info?.imageUrl||"",dexUrl:o.url||"",pairAddress:o.pairAddress||"",dexId:o.dexId||"",pumpCurve:!!o.pumpCurve,bondingProgressPct:o.bondingProgressPct??null,source:o.pumpCurve?"pump-curve":"direct-dexscreener"}),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{dl.delete(t)}}function ul(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return a?(zs(e),Yh(a,e.symbol||e.name||""),op(a),sp(e,{source:t.source||"prefetch"}),n.smartChartPrefetchLog=[...n.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:a,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(n.smartChartBootstrapLoading?.[a]||tt(a)),cacheTtlMs:np}].slice(-20),!0):!1}async function ip(e=""){const t=String(e||"").trim();if(!t)return null;try{const a=L(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),s=r.chart||r.dexToken||{};return cl(s),K("chart-bootstrap",a,{component:"smartChart",cacheHit:!!s.cacheHit,stale:!!s.stale,details:`${t}:${s.chartProvider||"dexscreener-embed"}`}),n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),s}catch(a){return n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:D(a?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),null}finally{const a={...n.smartChartDexResolving||{}};delete a[t],n.smartChartDexResolving=a;const r={...n.smartChartBootstrapLoading||{}};delete r[t],n.smartChartBootstrapLoading=r}}function Zv(e,t={}){const a=tp(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(a)}?${r.toString()}`}let br=null;function ew(){if(br!=null)return br;try{br=((document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"").match(/app\.js\?v=([\w-]+)/)||[])[1]||""}catch{br=""}return br}function lp(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim();if(a){const s=String(e.symbol||"").slice(0,12),o=ew(),c=Ia?`&api=${encodeURIComponent(Ia)}`:"";return`/chart-lab?ca=${encodeURIComponent(a)}&embed=1${s?`&sym=${encodeURIComponent(s)}`:""}${c}${o?`&v=${encodeURIComponent(o)}`:""}`}const r=tt(a);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Zv(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function k0(e={}){const t=String(e?.tokenMint||e?.mint||n.smartChartToken||""),a=hp(t||e?.symbol||"pump"),r=Math.max(1,O(e.marketCap,e.fdv,e.liquidityUsd,1e4)),s=O(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),o=Math.max(4,Math.min(96,Vt(e)||O(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(s)||O(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(i,d)=>{const u=Math.sin((d+a%11)/2.2)*c,p=(d/21-.5)*(s||o/3),f=((a>>d%8&7)-3)*.7;return Math.max(1,r*(1+(u+p+f)/100))})}function $0(e={},...t){for(const a of t){const r=Number(e?.[a]);if(Number.isFinite(r)&&r>0)return r;const s=a.split(".").reduce((c,i)=>c?.[i],e),o=Number(s);if(Number.isFinite(o)&&o>0)return o}return 0}function T0(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="txns",s=Math.max(0,Math.min(100,Vt(e)||O(e.bondingProgressPct,e.pumpProgress,0))),o=_(e.marketCapLabel,e.fdvLabel,M(e.marketCap),M(e.fdv)),c=_(e.liquidityLabel,M(e.liquidityUsd)),i=_(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,M(e.volumeM15),M(e.volume5m),M(e.volumeH1));return`
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
          ${zk(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${l(o)}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(c)}</dd></div>
          <div><dt>Volume</dt><dd>${l(i)}</dd></div>
          <div><dt>Status</dt><dd>${tl(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":jk(e)}
      <small>${l(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function pl(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",s=t==="info",o=sp(e)||Qv(e),c=s?`SlimeWire info for ${e.symbol||S(a)}`:r?`SlimeWire chart and transactions for ${e.symbol||S(a)}`:`SlimeWire chart for ${e.symbol||S(a)}`,i=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",s?"smart-chart-info-frame":""].filter(Boolean).join(" "),u=s?"Loading token info...":"Loading live chart...",p=lp(e,t);return`
    <div class="${l(i)}" data-chart-frame-loading="${l(u)}" data-chart-resolving="${o?"true":"false"}" data-chart-mint="${l(a)}" data-chart-mode="${l(t)}" data-chart-src="${l(p)}">
      <iframe title="${l(c)}" src="${l(p)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${l(t)}','${l(a)}')" allowfullscreen></iframe>
    </div>
  `}function cp(){const e=[...Object.values(n.livePairsByBucket||{}).flatMap(a=>a?.rows||[]),...n.livePairs?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[],...n.watchlist?.rows||[]],t=new Map;for(const a of e){const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||Hs(a)>Hs(s))&&t.set(r,a)}return t}function tw(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,a)=>t+(a&&String(a).toLowerCase()!=="n/a"?1:0),0)}function dp(e=[]){const t=cp();return(e||[]).map(a=>up(a,t.get(String(a?.tokenMint||""))))}function ut(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const s=Number(r[1]);if(!Number.isFinite(s))return null;const o=String(r[2]||"").toLowerCase();return o==="k"?s*1e3:o==="m"?s*1e6:o==="b"?s*1e9:s}function O(...e){for(const t of e){const a=ut(t);if(Number.isFinite(a)&&a>0)return a}for(const t of e){const a=ut(t);if(Number.isFinite(a))return a}return 0}function up(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:O(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:O(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:_(e.marketCapLabel,t.marketCapLabel,M(e.marketCap),M(t.marketCap)),fdvLabel:_(e.fdvLabel,t.fdvLabel,M(e.fdv),M(t.fdv)),liquidityUsd:O(e.liquidityUsd,t.liquidityUsd),liquidityLabel:_(e.liquidityLabel,t.liquidityLabel,M(e.liquidityUsd),M(t.liquidityUsd)),volume5m:O(e.volume5m,t.volume5m),volume5mLabel:_(e.volume5mLabel,t.volume5mLabel,M(e.volume5m),M(t.volume5m)),volumeM15:O(e.volumeM15,t.volumeM15),volumeM15Label:_(e.volumeM15Label,t.volumeM15Label,M(e.volumeM15),M(t.volumeM15)),volumeM30:O(e.volumeM30,t.volumeM30),volumeM30Label:_(e.volumeM30Label,t.volumeM30Label,M(e.volumeM30),M(t.volumeM30)),volumeH1:O(e.volumeH1,t.volumeH1),volumeH1Label:_(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,M(e.volumeH1),M(t.volumeH1)),volumeH24:O(e.volumeH24,t.volumeH24),volumeH24Label:_(e.volumeH24Label,t.volumeH24Label,M(e.volumeH24),M(t.volumeH24)),volumeLabel:_(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,M(e.volumeH1),M(t.volumeH1)),sniperCount:O(e.sniperCount,t.sniperCount)}:e}function yr(e=[],t=[]){return we([...n.livePairsByBucket.under1d?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.scan?.rows||[],...e,...t]).sort((r,s)=>Number(s.bestPickScore||s.score||0)-Number(r.bestPickScore||r.score||0)||O(s.volumeM15,s.volumeM30,s.volumeH1,s.volume5m,s.volumeH24)-O(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||O(s.marketCap,s.fdv)-O(r.marketCap,r.fdv)||nt(r,s))}function G(e,t,a,r,s){return{key:e,label:t,severity:a,message:r,weight:s}}function aw(e={}){const t=ut(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const a=ut(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(a)?a/60:null}function nw(e,t=[]){const a=(t||[]).some(s=>s.key==="hard_flag"),r=(t||[]).filter(s=>s.severity==="risk"&&s.key!=="liquidity_extreme").length;return a||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function rw(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const a=(t||[]).find(r=>r.severity==="risk");return a?.message?`Avoid recommended. ${a.message}`:"Avoid recommended. Multiple danger signals."}const js=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function ya(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(js,t)?t:"unknown"}function Gs(e="",t="Unknown"){const a=ya(e);return js[a]||t}function pp(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=a?"new":"unknown";return{mint:t,status:r,label:js[r],confidence:a?"low":"unknown",summary:a?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:a||null,updatedAt:""}}function vr(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(n.devInfoSummaries?.[t]||e.devInfoSummary)||pp(e)}function sw(e={}){const t=ya(e.status);return t==="hold"?G("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?G("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?G("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?G("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?G("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):G("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function mp(e={},t={}){if(!N("devInfoEnabled",!0))return"";const a=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!a)return"";const r=vr(e),s=ya(r.status),c=!!n.devInfoLoading?.[`summary:${a}`]?"...":s==="unknown"?"":r.label||js[s]||"",i=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${l(s)} ${i?"is-compact":""}" data-dev-info="${l(a)}" title="${l(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${l(c)}</strong>`:""}
    </button>
  `}function ow(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let a=70;const r=[],s=[],o=[],c=ut(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(a-=36,s.push("liquidity"),r.push(G("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(a-=20,s.push("liquidity"),r.push(G("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(a+=8,s.push("liquidity"),r.push(G("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(s.push("liquidity"),r.push(G("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(a-=6,o.push("liquidity"),r.push(G("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const i=aw(e);Number.isFinite(i)?i<3?(a-=10,s.push("age"),r.push(G("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):i>60?(a+=4,s.push("age"),r.push(G("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):s.push("age"):(a-=4,o.push("age"),r.push(G("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const d=ut(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(d)?d<=0?(a-=5,s.push("volume"),r.push(G("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):d>=1e4?(a+=6,s.push("volume"),r.push(G("volume_active","Volume","positive","Volume is active enough to review flow.",6))):s.push("volume"):o.push("volume");const u=ut(e.buys5m??e.buysH1??e.buys),p=ut(e.sells5m??e.sellsH1??e.sells);Number.isFinite(u)&&Number.isFinite(p)?(s.push("flow"),p>=u*1.8&&p>=5?(a-=18,r.push(G("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):u>=p*1.4&&u>=8&&(a+=5,r.push(G("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):o.push("flow");const f=ut(e.bestPickScore??e.score);Number.isFinite(f)&&(s.push("score"),f>=78?(a+=7,r.push(G("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(a-=10,r.push(G("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(A=>String(A||"").toLowerCase());y.some(A=>/mayhem|fake|scam|honeypot|blacklist/.test(A))&&(a-=40,r.push(G("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(A=>/bundle|bundled|cluster|concentr/.test(A))&&(a-=18,r.push(G("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(A=>/dev|fresh wallet|fresh-wallet|insider/.test(A))&&(a-=14,r.push(G("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(A=>/mint|freeze|token-2022/.test(A))&&(a-=24,r.push(G("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const b=vr(e);if(b){const A=sw(b);a+=Number(A.weight||0),r.push(A),["hold","mixed","risk","dump"].includes(ya(b.status))?s.push("devInfo"):o.push("devInfo")}const v=Math.max(0,Math.min(100,Math.round(a))),P=nw(v,r);return{mint:t,verdict:P,score:v,confidence:s.length>=5&&o.length<=1?"high":s.length>=3?"medium":"low",summary:rw(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function at(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&n.slimeShieldResults?.[t]||ow(e)}function hn(e=""){return String(e||"CAUTION").toLowerCase()}function iw(e={},t={}){if(!N("slimeShieldEnabled",!0))return dw(e);const a=at(e),r=String(e.tokenMint||a.mint||"").trim(),s=a.verdict||"CAUTION",o=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${l(hn(s))}" data-slimeshield-details="${l(r)}" title="${l(a.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${o?"Shield":"SlimeShield"}</small>
    </button>
  `}function lw(e={}){if(!N("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${l(ml(e))}">${l(s?`${s}`:"n/a")} score</em>`}const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${l(hn(r))}" data-slimeshield-details="${l(a)}" title="${l(t.summary||"Open SlimeShield details")}">Details</button>`}function A0(e={}){if(!N("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0),o=s?`${s}`:"n/a";return`
      <span class="terminal-score-chip" title="${l(ml(e))}">
        <strong>${l(o)}</strong>
        <small>score</small>
      </span>
    `}const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${l(hn(r))}" data-slimeshield-details="${l(a)}" title="${l(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function cw(e={}){return N("slimeShieldEnabled",!0)?`SlimeShield ${at(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function dw(e={}){const t=Number(e.bestPickScore||e.score||0),a=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${l(ml(e))}">
      <strong>${l(r)}</strong>
      <small>${a.length?"warnings":"best pick"}</small>
    </span>
  `}function uw(e={}){return iw(e,{compact:!0})}function ml(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},a=Object.entries(t).map(([s,o])=>`${s}: ${o}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...a,...r.map(s=>`warning: ${s}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function pw(e={}){return""}function M(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function _(...e){for(const t of e){const a=String(t??"").trim();if(a&&a!=="$0"&&!/^(n\/a|checking|warming|loading|pending|tracking)\.{0,3}$/i.test(a))return a}return"n/a"}function fp(e={}){return[["15m",_(e.volumeM15Label,M(e.volumeM15))],["30m",_(e.volumeM30Label,M(e.volumeM30))],["1h",_(e.volumeH1Label,e.volumeLabel,M(e.volumeH1))],["24h",_(e.volumeH24Label,M(e.volumeH24))]]}function P0(e={}){const t=ft(e),a=ht(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),s=_(e.liquidityLabel,a>0?M(a):"","checking"),o=fp(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(s)}</b></span>
      ${o.map(([c,i])=>`<span>${l(c)} <b>${l(i)}</b></span>`).join("")}
    </div>
  `}function mw(e={}){const t=ft(e),a=ht(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),s=_(e.liquidityLabel,a>0?M(a):"","checking"),o=_(e.volumeM15Label,M(e.volumeM15)),c=_(e.volumeH1Label,e.volumeLabel,M(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${l(r)}</b></span>
      <span>Liq <b>${l(s)}</b></span>
      <span>15m <b>${l(o)}</b></span>
      <span>1h <b>${l(c)}</b></span>
    </div>
  `}function gn(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const a=String(e.tokenMint||e.mint||"").trim();return a&&(e.isPump||a.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(a)}`:""}function Xs(e={},t=""){const a=t||Pa(e),r=Number(e.sniperCount||e.snipers||0),s=gn(e);return`
    <div class="compact-link-row">
      <a href="${l(e.dexUrl||Z(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${s?`<a href="${l(s)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${l(a)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(r)}</span>`:""}
    </div>
  `}function nt(e={},t={}){const a=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(a)&&Number.isFinite(r)&&a!==r)return a-r;const s=Number(e.pairCreatedAt||0),o=Number(t.pairCreatedAt||0);return s||o?o-s:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function hp(e=""){let t=0;for(let a=0;a<String(e).length;a+=1)t=(t<<5)-t+String(e).charCodeAt(a),t|=0;return Math.abs(t)}function va(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function wa(e=""){const t=qe();return[e,n.livePairBucket,n.terminalSort,vp(),t?.refreshCount||"",n.livePairsLastUpdatedByBucket[n.livePairBucket]||n.livePairsLastUpdatedAt||"",n.kolScan?.refreshCount||"",n.kolScan?.refreshedAt||n.kolLastUpdatedAt||""].join(":")}function Sa(e=[],t=12,a="",r=0){const s=we(e||[]),o=Math.max(0,Number(t)||s.length);if(!o)return[];if(!a||s.length<=o)return s.slice(0,o);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,o-1),s.length),i=s.slice(0,c),d=s.slice(c);if(!d.length)return i.slice(0,o);const u=hp(a)%d.length,p=[...d.slice(u),...d.slice(0,u)];return[...i,...p].slice(0,o)}function gp(e=[],t=new Set){return(e||[]).filter(a=>{const r=va(a);return!r||!t.has(r)})}function bp(e={}){const t=ft(e),a=ht(e),r=po(e),s=Lr(e),o=em(e),c=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),i=_(e.liquidityLabel,a>0?M(a):"","checking"),d=_(e.volumeM15Label,r>0?M(r):"","checking"),u=_(e.volumeH1Label,e.volumeLabel,s>0?M(s):"","checking"),p=_(e.volumeH24Label,o>0?M(o):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${l(c)}</strong></span>
      <span><small>Liq</small><strong>${l(i)}</strong></span>
      <span><small>15m</small><strong>${l(d)}</strong></span>
      <span><small>1h</small><strong>${l(u)}</strong></span>
      <span><small>24h</small><strong>${l(p)}</strong></span>
    </div>
  `}function yp(e,{source:t,actionLabel:a="Trade",isKolContext:r=!1}={}){const s=co(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(t)}" title="Open chart and buy/sell panel">${l(a)}</button>
    <button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(t)}" title="Quick buy with preset or custom SOL amount">${l(ka())}</button>
    <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${l(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?Pu(e):""}
    <button type="button" class="watch-action" data-watched="${s}" title="${s?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(uo(e)||"")}">${s?"Saved":"Watch"}</button>
    ${mp(e,{compact:!0})}
  `}function fw(e,t={}){const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=Sa(e||[],a,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol",d=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((u,p)=>{const f=u.scalpSetup||u.momentum||u.category||"live";return`
          <article class="terminal-token-row${d} ${i?"is-kol-signal":""}" data-token-chart="${l(u.tokenMint)}" data-token-chart-source="terminal-row">
            ${gt(u,{priority:p<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${l(u.tokenMint)}" data-token-chart-source="terminal-title">${l(u.symbol||u.shortMint||S(u.tokenMint))}</strong>
                <small>${l(u.name||u.category||"Token")}</small>
                ${i?"":Ml(u)}
                ${lw(u)}
              </div>
              <button type="button" class="ca-copy" data-copy="${l(u.tokenMint)}">${l(S(u.tokenMint))}</button>
              <span class="terminal-token-age">${l(u.pairAgeLabel||zt(u)||"age unknown")} | ${l(f)}</span>
              ${Xs(u)}
            </div>
            ${bp(u)}
            <div class="terminal-token-actions has-dev-info">
              ${yp(u,{source:"terminal-row",actionLabel:r,isKolContext:i})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:F(s,o)}function At(e,t={}){if(t.layout==="terminal")return fw(e,t);const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=Sa(e||[],a,t.rotateKey||"",t.stickyCount||0),i=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((d,u)=>`
        <article class="compact-signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(d.tokenMint)}" data-token-chart-source="compact-row">
          ${gt(d,{priority:u<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${l(d.tokenMint)}" data-token-chart-source="compact-title">${l(d.symbol||d.shortMint||S(d.tokenMint))}</strong>
              <small>${l(d.name||d.category||"Token")}</small>
              ${i?"":Ml(d)}
            </div>
            <button type="button" class="ca-copy" data-copy="${l(d.tokenMint)}">${l(S(d.tokenMint))}</button>
            <span>${l(d.pairAgeLabel||zt(d)||"age unknown")} | ${l(d.scalpSetup||d.momentum||d.category||"live")}</span>
            ${mw(d)}
            ${Xs(d)}
          </div>
          ${uw(d)}
          <div class="compact-row-actions has-dev-info">
            ${yp(d,{source:"compact-row",actionLabel:r,isKolContext:i})}
          </div>
        </article>
      `).join("")}
    </div>
  `:F(s,o)}function bn(e){const t=ce(e,e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId);if(!t)return"Custom / manual";const a=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&a.push(`Timer ${t.sellDelay}`),a.join(" | ")}function C0(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${l(bn("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${dt("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${dt("bundle",n.selectedBundlePresetId)}
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
  `}function wr(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function X(e=n.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const a=t.indexOf(".");if(a!==-1&&(t=t.slice(0,a+1)+t.slice(a+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":wr(r)}function pt(){return ce("trade",n.selectedTradePresetId)}function hw(){return ce("bundle",n.selectedBundlePresetId)}function ze(e=pt()){return X()||wr(e?.amountSol)}function gw(e=hw()){return X()||wr(e?.amountSol)||"0.1"}const fl=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Js(e=""){return fl.find(t=>t.id===e)||fl[0]}function hl(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function bw(e=Js()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,a=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${a} | ${r}`}function yw(e={},t=Js()){const a=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:a?.percentGain?String(a.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:a?.sellPercent?String(a.sellPercent):t.sellPercent||"100"}}function vw(e=""){if(pe(e)){const a=ie();return`${a?.provider||"Browser wallet"} ${a?.publicKey?S(a.publicKey):""}`.trim()}const t=n.wallets.find(a=>String(a.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Be(){return(!n.terminalLaunchFilters||typeof n.terminalLaunchFilters!="object")&&(n.terminalLaunchFilters={}),n.terminalLaunchFilters.socials=n.terminalLaunchFilters.socials||{},n.terminalLaunchFilters.quotes=n.terminalLaunchFilters.quotes||{},n.terminalLaunchFilters.audits=n.terminalLaunchFilters.audits||{},n.terminalLaunchFilters}function Pt(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(a=>String(a||"").trim().split(/\s+/)).map(a=>a.trim().toLowerCase()).filter(a=>!a||t.has(a)?!1:(t.add(a),!0)).slice(0,3)}function vp(e=Be()){const t=Object.keys(e.socials||{}).filter(s=>e.socials[s]).sort().join(","),a=Object.keys(e.quotes||{}).filter(s=>e.quotes[s]).sort().join(","),r=Object.keys(e.audits||{}).filter(s=>e.audits[s]).sort().join(",");return[Pt(e.keywords).join(","),Pt(e.excludeKeywords).join(","),t,a,r].join("|")}function yn(e=Be()){return!!vp(e).replace(/\|/g,"")}function Ys(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function ww(e={},t=""){const a=Ys(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(a));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(a)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(a)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(a)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(a)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(a)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(a)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(a)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(a)):t==="minSocial"?r:!0}function Sw(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const a=Ys(e).toUpperCase();return a.includes("USDC")?"USDC":a.includes("USD1")?"USD1":a.includes("WSOL")||a.includes("SOL")?"WSOL":""}function Qs(e={},t=[]){const a=Ys(e);return t.some(r=>r.test(a))}function kw(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!Qs(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!Qs(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:Qs(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const a=O(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return a>0?a<=30:!Qs(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function vn(e=[],t=Be()){const a=we(e||[]);if(!yn(t))return a;const r=Pt(t.keywords),s=Pt(t.excludeKeywords),o=Object.keys(t.socials||{}).filter(d=>t.socials[d]),c=Object.keys(t.quotes||{}).filter(d=>t.quotes[d]).map(d=>d.toUpperCase()),i=Object.keys(t.audits||{}).filter(d=>t.audits[d]);return a.filter(d=>{const u=Ys(d);return!(r.length&&!r.some(p=>u.includes(p))||s.length&&s.some(p=>u.includes(p))||o.some(p=>!ww(d,p))||c.length&&!c.includes(Sw(d))||i.some(p=>!kw(d,p)))})}function gl(e=[],t=[]){const a=Be();if(!yn(a))return"";const r=Pt(a.keywords),s=Pt(a.excludeKeywords),o=[];r.length&&o.push(`watching ${r.map(i=>`"${i}"`).join(", ")}`),s.length&&o.push(`excluding ${s.map(i=>`"${i}"`).join(", ")}`);const c=Math.max(0,we(e).length-we(t).length);return`<div class="terminal-launch-filter-summary">${l(o.join(" | ")||"filters active")} - ${l(t.length)}/${l(we(e).length)} visible${c?`, ${l(c)} hidden`:""}</div>`}function Sr(e=[],t="pairs"){const a=Be(),r=Pt(a.keywords),s=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",o=we(e).length;return F("Watching fresh launches",o?`No ${t} match ${s} yet. ${o} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${s}.`)}function bl(e="terminal",t={}){const a=Be(),r=yn(a),s=!!(a.open||r),o=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):o;return`
    <section class="terminal-launch-filter ${s?"is-open":""}" data-terminal-launch-filter data-preserve-focus>
      <div class="terminal-launch-filter-head">
        <div>
          <strong>Launch Filter</strong>
          <span>${r?`${l(c)}/${l(o)} visible`:"Watch a known ticker before it goes live"}</span>
        </div>
        <button type="button" data-terminal-filter-toggle>${s?"Hide Filters":"Filter / Keyword Watch"}</button>
      </div>
      ${s?`
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
            ${kf.map(([i,d])=>`
              <label><input type="checkbox" data-terminal-filter-social="${l(i)}" ${a.socials?.[i]?"checked":""}> ${l(d)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${$f.map(([i,d])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${l(i)}" ${a.quotes?.[i]?"checked":""}> ${l(d)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${Tf.map(([i,d])=>`
              <label><input type="checkbox" data-terminal-filter-audit="${l(i)}" ${a.audits?.[i]?"checked":""}> ${l(d)}</label>
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
  `}function wp(){zr&&window.clearTimeout(zr),zr=window.setTimeout(()=>{zr=null,ee("live"),ee("launch"),ee("sniper"),h()},180)}function Zs(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const s=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-s)/1e3))}const a=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return a&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const $w=100,Tw=7200,Aw=75e4,Pw=86400,Cw=2e6,Lw=28e3,Sp=18e4,xw=16e4;function kp(){const e=cp();return we([...n.livePairs?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1d?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[]]).map(t=>up(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!hr(t))}function wn(e={}){return O(e.marketCap,e.fdv)}function $p(e={}){return O(e.liquidityUsd)}function Tp(e={}){return O(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function yl(e={}){if(kr(e))return!1;const t=Zs(e);return!Number.isFinite(t)||t<0||t>Tw||wn(e)>Aw?!1:Vt(e)<70}function vl(e={}){if(kr(e))return!1;const t=Vt(e),a=wn(e),r=a>=Lw&&a<=Sp;return t>=55&&(!a||a<=Sp)||r}function Ap(e={}){if(yl(e)||vl(e)||kr(e))return!1;const t=Zs(e);return Number.isFinite(t)&&(t<0||t>Pw)||wn(e)>Cw?!1:$p(e)>0||Tp(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function Pp(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Vt(e={}){const t=O(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const a=wn(e),r=Pp(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&a>0?Math.max(1,Math.min(99,a/69e3*100)):0}function kr(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=Pp(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const a=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=wn(e);return a&&r>=xw?!0:!!(a&&/\b(raydium|meteora|orca)\b/.test(t))}function Cp(e={}){if(kr(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":vl(e)||t==="graduating"?"graduating":yl(e)?"new":(t==="steady"||t==="unknown"||Ap(e),"steady")}function Lp(e={}){const t=Number(e.bestPickScore||e.score||0),a=Tp(e),r=$p(e),s=wn(e),o=Zs(e),c=Number.isFinite(o)?Math.max(0,86400-o)/86400:0;return t*1e3+Math.log10(a+1)*160+Math.log10(r+1)*120+Math.log10(s+1)*80+c*100}function xp(e=[]){return[...e].sort((t,a)=>Lp(a)-Lp(t)||nt(t,a))}function Mw(e=[],t=[],a=$w){const r=new Set,s=[];for(const o of[...e,...t]){const c=String(o?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),s.push(o),s.length>=a))break}return s}function Mp(e=n.slimeScopeMode){const t=kp(),a=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(i=>Cp(i)===a),s=t.filter(i=>{const d=Cp(i);return a==="graduated"?d==="graduated"||kr(i):a==="graduating"?d==="graduating"||vl(i):a==="steady"?d==="steady"||Ap(i):d==="new"||yl(i)}),o=a==="new"?[...r].sort(nt):xp(r),c=a==="new"?we(s).sort(nt):xp(s);return Mw(o,c)}function Bw(e=[],t="new"){const a=it(`slimeScope:${t}`,e).slice(0,12);return a.length?a.map((r,s)=>{const o=r.pairAgeLabel||zt(r)||"age ?",c=_(r.marketCapLabel,r.fdvLabel,M(ft(r)),"checking"),i=_(r.liquidityLabel,M(ht(r)),"checking"),d=_(r.volumeM15Label,M(po(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${l(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${gt(r,{priority:s<4})}
        <div class="slime-scope-column-main">
          <strong>${l(r.symbol||r.shortMint||S(r.tokenMint))}</strong>
          <small>${l(S(r.tokenMint))} · ${l(o)}</small>
          <span>${l(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${l(c)}</b></span>
          <span>Liq <b>${l(i)}</b></span>
          <span>15m <b>${l(d)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${l(ze()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${l(t)} pairs.</div>`}function Rw(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,a,r])=>{const s=Mp(t);return`
          <section class="slime-scope-column" data-scope-column="${l(t)}">
            <header>
              <div>
                <h4>${l(a)}</h4>
                <small>${l(r)}</small>
              </div>
              <span>${l(s.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${Bw(s,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function Iw(){const e=Cr(),[,,t]=e,a=Qc(n.slimeScopeMode),s=!!(j("slimeScope").inFlight||n.livePairsLoadingByBucket?.[a]),o=n.livePairsRefreshErrorByBucket?.[a],c=we(Yp(kp(),e[0])),i=it("slimeScope",c),d=i.length?ar()?mt(i,{context:"live",shareBuilder:Pa,hideToolbar:!0}):At(i,{layout:"terminal",limit:Math.max(1,i.length),actionLabel:"Trade"}):o?F("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):s?F("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):F("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${LS(e)}<span>${l(t)}</span></div>
        ${Qp(c.length,ua())}
        ${ou("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${s?"disabled":""}>${s?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${d}
        ${da("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${Rw()}
    </section>
  `}function L0(){const e=qe(),t=we(e?.rows||[]),a=vn(t),r=[...a].sort(nt),s=dp(n.kolScan?.rows||[]).filter(C=>!hr(C)),o=vn(s),c=yr(t,s),i=vn(c),d=yn(),u=Sa(i,8,wa("best-picks"),2),p=new Set(u.map(va).filter(Boolean)),f=gp(r,p),y=Sa(f.length?f:r,12,wa("live-pairs"),0),b=new Set([...p,...y.map(va).filter(Boolean)]),v=gp(o,b),P=Sa(v.length?v:o,12,wa("kol-signals"),1),A=!!n.livePairsLoadingByBucket[n.livePairBucket],g=ua(),T="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${A?"Refreshing":"Live"}${g?` | ${l(Jn(nn(g)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Et.map(([C,B])=>{const U=n.livePairsByBucket[C]?.rows?.length,H=Number.isFinite(Number(U))?` (${U})`:"";return`<button data-live-pair-bucket="${C}" data-active="${n.livePairBucket===C}">${B}${H}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${Sf.map(([C,B])=>`<option value="${C}" ${n.terminalSort===C?"selected":""}>${B}</option>`).join("")}
            </select>
          </label>
          ${ou("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${A?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${bl("terminal",{rawCount:t.length,visibleCount:a.length})}
        ${gl(t,a)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${u.length?At(u,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:T,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):d?Sr(c,"best picks"):At(u,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:T,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?At(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:T}):d?Sr(t,"live pairs"):At(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:T})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${n.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?At(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:T,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):d?Sr(s,"KOL signals"):At(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:T,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${mS()}
      </main>
    </section>
  `}function x0(){const e=pt();if(!e)return"Trade";const t=ze(e);return t?`Buy ${t} SOL`:Dm(e,"Trade")}function ka(){const e=pt(),t=ze(e);return t?`Buy ${t} SOL`:"Quick Buy"}function eo(){const e=ka();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{w(t,e)})}function $a(e=""){const t=String(e||"").trim();if(!t)return null;const a=fr().find(s=>String(s?.tokenMint||s?.mint||s?.tokenAddress||"").trim()===t);if(a)return a;const r=n.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:S(t),symbol:S(t),dexUrl:Z(t)}}function Ow(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function Ew(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function Bp(e={}){if(!N("slimeShieldEnabled",!0))return"";const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${l(hn(r))}">
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
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(a)}" data-protected-buy-preset="${l(t.protectedBuyPreset||hl(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function Rp(e=[],t="risk",a="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(s=>t==="positive"?s.severity==="positive":s.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(s=>`
        <li>
          <strong>${l(s.label||s.key||"Signal")}</strong>
          <span>${l(s.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(a)}</p>`}function Ip(e=""){const t=String(e||n.smartChartToken||n.tradeToken||"").trim();!t||!N("slimeShieldEnabled",!0)||(n.slimeShieldDetails={open:!0,tokenMint:t},n.slimeShieldStatus="",Ka(),Aa(),to(t,{force:!0}),N("replayBeforeBuyEnabled",!0)&&Tl(t,{force:!0}))}function wl(){n.slimeShieldDetails={open:!1,tokenMint:""},n.slimeShieldStatus="",Aa(),jr()}async function to(e="",t={}){const a=String(e||"").trim();if(!a||!N("slimeShieldEnabled",!0))return null;if(!t.force&&n.slimeShieldResults?.[a])return n.slimeShieldResults[a];if(n.slimeShieldLoading?.[a])return null;n.slimeShieldLoading={...n.slimeShieldLoading||{},[a]:!0},Aa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return o&&(n.slimeShieldResults={...n.slimeShieldResults||{},[a]:o},se(o.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),n.slimeShieldStatus=o.cacheHit?"Loaded from cache.":"Updated from local data."),o}catch(r){return n.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...n.slimeShieldLoading||{}};delete r[a],n.slimeShieldLoading=r,Aa()}}function Fw(e=""){const t=$a(e)||fn(e)||{tokenMint:e},a=vr(t),r=a.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",s=[...Array.isArray(a.externalLinks)?a.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||Z(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:e?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(e)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((o,c,i)=>/^https?:\/\//i.test(String(o.url||""))&&i.findIndex(d=>String(d.url||"")===String(o.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:a.likelyDevWallet||null,confidence:a.confidence||"unknown",status:ya(a.status),label:a.label||Gs(a.status),score:50,summary:a.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:a.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:a.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:a.updatedAt||new Date().toISOString(),externalLinks:s,dataSource:"ui-fallback"}}function Op(e=""){const t=String(e||"").trim();return n.devInfoResults?.[t]||Fw(t)}function $r(e,t=""){const a=Number(e);return Number.isFinite(a)?`${Math.round(a*10)/10}${t}`:"n/a"}function Ep(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function ao(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function Ww(e=""){const t=String(e||"").trim();return t?S(t):"Unknown"}async function Fp(e="",t={}){const a=String(e||"").trim();if(!a||!N("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoSummaries?.[a])return n.devInfoSummaries[a];const r=`summary:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0};try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(n.devInfoSummaries={...n.devInfoSummaries||{},[a]:c},se(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,t.silent||Ta()}}async function Wp(e="",t={}){const a=String(e||"").trim();if(!a||!N("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoResults?.[a])return n.devInfoResults[a];const r=`details:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0},Ta();try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(n.devInfoResults={...n.devInfoResults||{},[a]:c},n.devInfoSummaries={...n.devInfoSummaries||{},[a]:{mint:a,status:c.status||"unknown",label:c.label||Gs(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},n.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",se(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(s){return n.devInfoStatus=s?.message||"Dev Info is temporarily unavailable.",null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,Ta()}}function _w(e=""){const t=String(e||"").trim();!t||!N("devInfoEnabled",!0)||(n.devInfoDetails={open:!0,tokenMint:t},n.devInfoStatus="",Ka(),Ta(),Fp(t,{force:!0,silent:!0}),Wp(t,{force:!0}))}function Sl(){n.devInfoDetails={open:!1,tokenMint:""},n.devInfoStatus="",Ta(),jr()}function Dw(e){return e==="radar"?"📡":e==="move"?"📈":"•"}async function Nw(){try{const e=await k("/api/web/return-summary");n.returnSummary={loaded:!0,events:Array.isArray(e.events)?e.events:[]}}catch{n.returnSummary={loaded:!0,events:[]}}kl()}async function Uw(){n.returnSummaryDismissed=!0,kl();try{await k("/api/web/return-summary",{method:"POST",body:JSON.stringify({action:"seen"})})}catch{}}function kl(){let e=document.querySelector("[data-return-summary-root]");e||(e=document.createElement("div"),e.dataset.returnSummaryRoot="true",document.body.appendChild(e));const t=n.returnSummary,a=t&&Array.isArray(t.events)?t.events:[];if(!!!(t&&t.loaded&&a.length&&!n.returnSummaryDismissed&&n.route==="terminal")){e.__lastReturn!==""&&(e.innerHTML="",e.__lastReturn="");return}const o=`
    <div class="return-summary-card" role="status">
      <div class="return-summary-head">
        <strong>📋 Since your last visit</strong>
        <button type="button" data-return-dismiss aria-label="Dismiss">×</button>
      </div>
      <ul>${a.slice(0,6).map(c=>`
    <li><button type="button" class="return-summary-item" data-token-chart="${l(c.tokenMint||"")}" data-token-chart-source="return-summary"><span>${Dw(c.kind)}</span> ${l(c.title||"Update")}</button></li>`).join("")}</ul>
      ${a.length>6?`<small>+${a.length-6} more</small>`:""}
    </div>`;e.__lastReturn!==o&&(e.__lastReturn=o,e.innerHTML=o)}function qw(e){return e==="tp"?"🎯":e==="sl"?"🛑":e==="mc_above"?"📈":e==="mc_below"?"📉":e==="dump"?"🩸":"📡"}function Hw(e){const t=Number(e.value)||0;return e.type==="tp"?`Take-profit · +${Math.round(t)}%`:e.type==="sl"?`Stop-loss · −${Math.round(t)}%`:e.type==="mc_above"?`Market cap crosses above ${M(t)}`:e.type==="mc_below"?`Market cap falls below ${M(t)}`:e.type==="dump"?`Dump alert · down ${Math.round(t)}% in 1h`:String(e.type||"")}function Kw(e="",t=""){n.radarDrawer={open:!0,tokenMint:String(e||"").trim(),symbol:String(t||"").trim(),scope:"token"},n.radarStatus="",rt(),zw(),n.watchlist?.rows?.length||k("/api/web/watchlist").then(a=>{a?.watchlist&&(n.watchlist=a.watchlist,rt())}).catch(()=>{})}function Vw(){n.radarDrawer={open:!1,tokenMint:"",symbol:""},rt()}async function zw(){try{const e=await k("/api/web/radar");n.radarRules=Array.isArray(e.rules)?e.rules:[]}catch(e){n.radarStatus=e.message||"Could not load Radar."}rt()}async function jw(){const e=document.querySelector("[data-radar-drawer-root]"),t=n.radarDrawer||{};if(!e)return;const a=t.scope||(t.tokenMint?"token":"tag"),r=e.querySelector("[data-radar-type]")?.value||(a==="tag"?"mc_above":"tp"),s=Number(e.querySelector("[data-radar-value]")?.value||0);if(!(s>0)){n.radarStatus="Enter a number greater than 0.",rt();return}const o={push:e.querySelector("[data-radar-ch-push]")?.checked!==!1,telegram:!!e.querySelector("[data-radar-ch-tg]")?.checked};let c;if(a==="tag"){const i=e.querySelector("[data-radar-tag]")?.value||"";if(!i){n.radarStatus="Pick a list (tag) first — tag coins in your Watchlist.",rt();return}c={tag:i,type:r,value:s,channels:o}}else{if(!t.tokenMint)return;c={tokenMint:t.tokenMint,symbol:t.symbol,type:r,value:s,channels:o}}try{n.radarStatus="Setting alert…",rt(),await Q(null,"Opening your SlimeWire profile for Radar…");const i=await k("/api/web/radar",{method:"POST",body:JSON.stringify({action:"add",rule:c})});n.radarRules=Array.isArray(i.rules)?i.rules:n.radarRules,n.radarStatus="✅ Alert set — SlimeWire is watching it for you."}catch(i){n.radarStatus=i.message||"Could not set the alert."}rt()}async function _p(e,t){try{const a=await k("/api/web/radar",{method:"POST",body:JSON.stringify({action:e,id:t})});n.radarRules=Array.isArray(a.rules)?a.rules:n.radarRules}catch(a){n.radarStatus=a.message||"Could not update the alert."}rt()}function rt(){let e=document.querySelector("[data-radar-drawer-root]");e||(e=document.createElement("div"),e.dataset.radarDrawerRoot="true",document.body.appendChild(e));const t=n.radarDrawer||{};if(!t.open){e.innerHTML="",e.__lastDrawerHtml="";return}const a=Array.isArray(n.radarRules)?n.radarRules:[],r=t.symbol||(t.tokenMint?S(t.tokenMint):""),s=[...new Set((n.watchlist?.rows||[]).flatMap(f=>Array.isArray(f.tags)?f.tags:[]))].slice(0,24),o=t.scope||(t.tokenMint?"token":"tag"),c=`
          <option value="mc_above">📈 Market cap above ($)</option>
          <option value="mc_below">📉 Market cap below ($)</option>
          <option value="dump">🩸 Dump / rug alert (down % in 1h)</option>`,i=`
          <option value="tp">🎯 Take-profit (+%)</option>
          <option value="sl">🛑 Stop-loss (−%)</option>${c}`,d=t.tokenMint||s.length?`
    <section data-radar-add>
      <h4>New alert</h4>
      <div class="radar-scope">
        ${t.tokenMint?`<button type="button" data-radar-scope="token" data-active="${o==="token"}">${l(r||"This coin")}</button>`:""}
        <button type="button" data-radar-scope="tag" data-active="${o==="tag"}" ${s.length?"":'disabled title="Tag coins in your Watchlist first"'}>📋 A list</button>
      </div>
      <div class="radar-form">
        ${o==="tag"?`<select data-radar-tag aria-label="List (tag)">${s.length?s.map(f=>`<option value="${l(f)}">${l(f)}</option>`).join(""):'<option value="">No tags yet</option>'}</select>`:""}
        <select data-radar-type aria-label="Alert type">${o==="tag"?c:i}</select>
        <input data-radar-value type="number" min="0" step="any" inputmode="decimal" placeholder="${o==="tag"?"e.g. 40000 or 25":"e.g. 50 or 40000"}" aria-label="Alert value" />
        <button type="button" class="primary" data-radar-submit>Set alert</button>
      </div>
      <div class="radar-channels">
        <label><input type="checkbox" data-radar-ch-push checked /> 🔔 Push</label>
        <label><input type="checkbox" data-radar-ch-tg /> ✈️ Telegram</label>
      </div>
      <p class="slimeshield-muted">${o==="tag"?"A list alert watches every coin you tagged this — market-cap &amp; dump conditions (no per-coin baseline needed).":"% alerts use the price right now as the baseline. SlimeWire checks every few minutes and pings you with the reason."}</p>
    </section>`:"",u=a.length?`
    <ul class="radar-rule-list">
      ${a.map(f=>`
        <li class="radar-rule ${f.enabled===!1?"is-off":""}">
          <span class="radar-rule-icon">${qw(f.type)}</span>
          <div class="radar-rule-body">
            <strong>${f.scope==="tag"?`📋 ${l(f.tag||f.symbol||"list")}`:l(f.symbol||S(f.tokenMint))}</strong>
            <small>${l(Hw(f))}</small>
          </div>
          <button type="button" class="radar-rule-toggle" data-radar-toggle="${l(f.id)}" title="${f.enabled===!1?"Enable":"Pause"}">${f.enabled===!1?"Off":"On"}</button>
          <button type="button" class="radar-rule-remove" data-radar-remove="${l(f.id)}" title="Remove alert" aria-label="Remove alert">×</button>
        </li>`).join("")}
    </ul>`:'<p class="slimeshield-muted">No alerts yet. Set one above and SlimeWire watches the market for you — pinging the site, your browser, and Telegram with the reason it fired.</p>',p=`
    <div class="slimeshield-drawer-backdrop" data-radar-close></div>
    <aside class="slimeshield-drawer radar-drawer" role="dialog" aria-modal="true" aria-label="My Radar">
      <header>
        <div>
          <span>📡 My Radar</span>
          <h3>Set it once. SlimeWire watches.</h3>
        </div>
        <button type="button" aria-label="Close Radar" data-radar-close>Close</button>
      </header>
      ${d}
      <section>
        <h4>Your alerts${a.length?` · ${a.length}`:""}</h4>
        ${u}
      </section>
      ${n.radarStatus?`<small class="slimeshield-status">${l(n.radarStatus)}</small>`:""}
      <p class="slimeshield-safety-copy">Radar is informational, not financial advice. Alerts can lag the market by a few minutes.</p>
    </aside>`;kn(e,p,".radar-drawer")}function Gw(e){const t=Array.isArray(e.tags)?e.tags.slice(0,6):[],a=String(e.note||"").trim();return!t.length&&!a?"":`<div class="wl-meta">
    ${t.length?`<div class="wl-tags">${t.map(r=>`<span class="wl-tag">${l(r)}</span>`).join("")}</div>`:""}
    ${a?`<small class="wl-note" title="${l(a)}">📝 ${l(a.slice(0,90))}${a.length>90?"…":""}</small>`:""}
  </div>`}function Xw(e){return(n.watchlist?.rows||[]).find(t=>String(t.tokenMint)===String(e))||null}function Jw(e="",t=""){const a=Xw(e)||{};n.watchlistEdit={open:!0,tokenMint:String(e||"").trim(),symbol:String(t||a.symbol||"").trim(),note:String(a.note||""),tags:(Array.isArray(a.tags)?a.tags:[]).join(", "),status:""},Sn()}function Yw(){n.watchlistEdit={open:!1},Sn()}async function Qw(){const e=document.querySelector("[data-watchlist-edit-root]"),t=n.watchlistEdit||{};if(!e||!t.tokenMint)return;const a=e.querySelector("[data-wl-note]")?.value||"",r=(e.querySelector("[data-wl-tags]")?.value||"").split(",").map(s=>s.trim()).filter(Boolean);try{n.watchlistEdit={...t,status:"Saving…"},Sn();const s=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:"meta",tokenMint:t.tokenMint,note:a,tags:r})});n.watchlist=s.watchlist||n.watchlist,n.watchlistEdit={open:!1},Sn(),h()}catch(s){n.watchlistEdit={...t,status:s.message||"Could not save."},Sn()}}function Sn(){let e=document.querySelector("[data-watchlist-edit-root]");e||(e=document.createElement("div"),e.dataset.watchlistEditRoot="true",document.body.appendChild(e));const t=n.watchlistEdit||{};if(!t.open){e.__lastWlEdit!==""&&(e.innerHTML="",e.__lastWlEdit="");return}const a=`
    <div class="slimeshield-drawer-backdrop" data-watchlist-edit-close></div>
    <aside class="slimeshield-drawer radar-drawer" role="dialog" aria-modal="true" aria-label="Edit watchlist note and tags">
      <header>
        <div><span>📝 Note &amp; Tags</span><h3>${l(t.symbol||S(t.tokenMint))}</h3></div>
        <button type="button" aria-label="Close" data-watchlist-edit-close>Close</button>
      </header>
      <section>
        <h4>Note</h4>
        <textarea data-wl-note class="wl-edit-note" rows="3" maxlength="280" placeholder="e.g. waiting for a dip under 30k, dev looks solid">${l(t.note||"")}</textarea>
        <h4>Tags <span class="slimeshield-muted" style="font-weight:400">· comma-separated, double as lists</span></h4>
        <input data-wl-tags class="wl-edit-tags" type="text" maxlength="160" placeholder="Holding, Watching, High risk" value="${l(t.tags||"")}" />
        <p class="slimeshield-muted">Filter your watchlist by any tag — they work like named lists.</p>
        <div class="slimeshield-drawer-actions">
          <button type="button" class="primary" data-watchlist-meta-save>Save</button>
        </div>
        ${t.status?`<small class="slimeshield-status">${l(t.status)}</small>`:""}
      </section>
    </aside>`;e.__lastWlEdit!==a&&(e.__lastWlEdit=a,e.innerHTML=a)}function Zw(e="render"){!N("devInfoEnabled",!0)||Xo||n.route==="terminal"&&(Xo=window.setTimeout(()=>{Xo=null,eS(e)},300))}async function eS(e="render"){if(!N("devInfoEnabled",!0)||Ha())return;const t=mr().slice(0,16),a=[],r=new Set;for(const s of t){const o=String(s.tokenMint||s.mint||s.tokenAddress||"").trim();if(!(!o||r.has(o)||n.devInfoSummaries?.[o]||n.devInfoLoading?.[`summary:${o}`])&&(r.add(o),a.push(o),a.length>=8))break}a.length&&(await Promise.allSettled(a.map(s=>Fp(s,{silent:!0}))),W({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:a.length,details:e}),Ha()||Va("dev-info-prefetch"))}function no(e=[],t="No strong cached signal yet."){const a=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return a.length?`
    <ul class="slimeshield-factor-list">
      ${a.map(r=>`<li><span>${l(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${l(t)}</p>`}function ro(e,t="Not cached yet"){const a=String(e||"").trim();return!a||a.toLowerCase()==="warming"||a.toLowerCase()==="checking"?t:a}function M0(e,t=r=>String(r),a="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):a}function kn(e,t,a=""){if(e.__lastDrawerHtml===t)return!1;const r=a?e.querySelector(a):null,s=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,a&&s){const o=e.querySelector(a);o&&(o.scrollTop=s)}return!0}function Ta(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=n.devInfoDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",a),!a||!N("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=$a(r)||fn(r)||{tokenMint:r},o=Op(r),c=n.devInfoSummaries?.[r]||vr(s),i=ya(o.status||c.status),d=o.confidence||c.confidence||"unknown",u=!!n.devInfoLoading?.[`details:${r}`],p=o.likelyDevWallet||c.likelyDevWallet||"",f=o.currentPosition||null,y=o.historicalStats||{},b=o.linkedWalletSignals||{},v=o.marketContext||{},P=o.sourceHydration||{},A=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,8):[],g=O(v.marketCap,s.marketCap,s.fdv),T=O(v.liquidityUsd,s.liquidityUsd),C=O(v.volume5m,s.volume5m,s.volumeM5),B=O(v.volumeH1,s.volumeH1,s.volume1h),U=O(v.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),H=v.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",Se=v.mintAuthority||s.mintAuthority||"",Ne=v.freezeAuthority||s.freezeAuthority||"",q=!!(v.heliusDasIndexedAt||v.heliusDasSource||s.heliusDasSource||H||Se||Ne),Ie=[{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:s.dexUrl||Z(r)},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"Dev wallet",url:p?`https://solscan.io/account/${encodeURIComponent(p)}`:""},{label:"KOLscan",url:p?`https://kolscan.io/account/${encodeURIComponent(p)}`:""},{label:"X",url:s.twitterUrl||s.xUrl},{label:"TG",url:s.telegramUrl},{label:"Web",url:s.websiteUrl}].filter(Y=>/^https?:\/\//i.test(String(Y.url||""))).filter((Y,Cn,xo)=>xo.findIndex(Mo=>Mo.label.toLowerCase()===Y.label.toLowerCase()||String(Mo.url)===String(Y.url))===Cn).slice(0,6),J=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],Ue=!!v.solanaTrackerLoaded,Mt=!!f||Number(y.launchesTracked)>0||J.length>0,Pn=A.length>0||Array.isArray(o.riskReasons)&&o.riskReasons.length>0||Array.isArray(o.positiveReasons)&&o.positiveReasons.length>0||!!b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length>0,Bt=[["overview","Overview"]];Ue&&Bt.push(["holders","Holders"]),Mt&&Bt.push(["history","History"]),Pn&&Bt.push(["signals","Signals"]);const Ba=Bt.some(([Y])=>Y===n.devInfoTab)?n.devInfoTab:"overview",Rr=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer dossier-drawer" data-active-pane="${l(Ba)}" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${l(Gs(i))} · ${l(Ep(d))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      ${Bt.length>1?`<div class="dossier-tabs" role="tablist" aria-label="Dev Info sections">
        ${Bt.map(([Y,Cn])=>`<button type="button" role="tab" data-dev-info-tab="${Y}" data-active="${Ba===Y}">${l(Cn)}</button>`).join("")}
      </div>`:""}
      <section class="dev-info-summary dev-info-${l(i)}" data-pane="overview">
        <strong>${l(s.symbol||s.shortMint||S(r))}</strong>
        <p>${l(o.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${u?"Updating...":`Last updated ${l(Te(o.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section data-pane="overview">
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${l(Ww(p))}</dd></div>
          <div><dt>Confidence</dt><dd>${l(Ep(d))}</dd></div>
          <div><dt>Source</dt><dd>${l(o.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${l(S(o.pairAddress||s.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${p?`<button type="button" data-copy="${l(p)}">Copy Wallet</button>`:""}
          ${p&&n.user?`<button type="button" data-dev-watch="${l(p)}">${n.devWatch?.[p]?"✅ Watching dev":"👀 Watch dev"}</button>`:""}
        </div>
        ${Ie.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${Ie.map(Y=>`<a href="${l(Y.url)}" target="_blank" rel="noreferrer">${l(Y.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section data-pane="overview">
        <h4>Security &amp; Source</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Pair age</dt><dd>${l(Number.isFinite(U)?ao(U):"Not cached yet")}</dd></div>
          <div><dt>Mint auth</dt><dd>${l(Se?S(Se):q?"✓ none":"checking…")}</dd></div>
          <div><dt>Freeze auth</dt><dd>${l(Ne?S(Ne):q?"✓ none":"checking…")}</dd></div>
          <div><dt>Source</dt><dd>${l(v.source||o.cacheSource||o.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">Market cap, liquidity &amp; volume are on the chart — this panel focuses on who's behind the coin. "✓ none" means that authority is renounced (safer).</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${l(P.message)}${P.eventsStored?` · ${l(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      ${v.solanaTrackerLoaded?`
      <section data-pane="holders">
        <h4>On-chain Holders <span class="slimeshield-muted" style="font-weight:400">· Solana Tracker</span></h4>
        <dl class="kol-dump-metrics">
          <div><dt>Holders</dt><dd>${l(Number.isFinite(v.holderCount)?Number(v.holderCount).toLocaleString():"—")}</dd></div>
          <div><dt>Top 10 hold</dt><dd>${l(Number.isFinite(v.topHolderPercent)?Math.round(v.topHolderPercent)+"%":"—")}</dd></div>
          <div><dt>Dev holds</dt><dd>${l(Number.isFinite(v.devHoldPercent)?Math.round(v.devHoldPercent)+"%":"—")}</dd></div>
          <div><dt>Snipers</dt><dd>${l(Number.isFinite(v.snipersPercent)?Math.round(v.snipersPercent)+"%":"—")}</dd></div>
          <div><dt>Insiders</dt><dd>${l(Number.isFinite(v.insidersPercent)?Math.round(v.insidersPercent)+"%":"—")}</dd></div>
          <div><dt>Bundled</dt><dd>${l(Number.isFinite(v.bundlersPercent)?Math.round(v.bundlersPercent)+"%":"—")}</dd></div>
          <div><dt>LP burned</dt><dd>${l(Number.isFinite(v.lpBurnedPercent)?Math.round(v.lpBurnedPercent)+"%":"—")}</dd></div>
        </dl>
        <p class="slimeshield-muted">Live holder &amp; insider concentration from Solana Tracker — high snipers / insiders / bundled means a few wallets can dump on you.</p>
      </section>`:""}
      <section data-pane="signals">
        <h4>Source Evidence</h4>
        ${no(A,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section data-pane="history">
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${l($r(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${l($r(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${l($r(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${l(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${l(ao(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${l(f.lastSellAt?Te(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||J.length?`
      <section data-pane="history">
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${l(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${l(ao(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${l($r(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${l($r(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${J.length?`
          <ul class="dev-info-launches">
            ${J.map(Y=>`<li><span>${l(Y.symbol||S(Y.mint||""))}</span><small>${l(Y.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(o.riskReasons)&&o.riskReasons.length?`
      <section data-pane="signals">
        <h4>Risk Signals</h4>
        ${no(o.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(o.positiveReasons)&&o.positiveReasons.length?`
      <section data-pane="signals">
        <h4>Positive Signals</h4>
        ${no(o.positiveReasons,"")}
      </section>`:""}
      ${b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length?`
      <section data-pane="signals">
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${l(b.linkedWalletCount?`${b.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${no(b.notes,"")}
      </section>`:""}
      ${(()=>{const Y=[f?"":"dev position",Number(y.launchesTracked)>0||J.length?"":"launch history",!(o.riskReasons||[]).length&&!(o.positiveReasons||[]).length?"behavior signals":"",!b.linkedWalletCount&&!(b.notes||[]).length?"linked wallets":""].filter(Boolean);return Y.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${l(Y.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note" data-pane="overview">
        <h4>Suggested Action</h4>
        <p>${l(o.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${l(r)}" data-watch-symbol="${l(s.symbol||"")}" data-watch-name="${l(s.name||"")}" data-watch-image="${l(uo(s)||"")}">${co(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${l(r)}">Open SlimeShield</button>
        <button type="button" data-radar-open="${l(r)}" data-radar-symbol="${l(s.symbol||"")}">📡 Radar</button>
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${l(r)}" ${u?"disabled":""}>${u?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${n.devInfoStatus?`<small class="slimeshield-status">${l(n.devInfoStatus)}</small>`:""}
    </aside>
  `;kn(e,Rr,".dev-info-drawer")}function Dp(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function $l(e=""){const t=String(e||"").trim();return n.replayResults?.[t]||Dp(t)}function $n(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function tS(e=""){if(!N("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const a=$l(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${l(a.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l($n(a.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l($n(a.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${l(a.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function Tl(e="",t={}){const a=String(e||"").trim();if(!a||!N("replayBeforeBuyEnabled",!0))return null;if(!t.force&&n.replayResults?.[a])return n.replayResults[a];if(n.replayLoading?.[a])return null;n.replayLoading={...n.replayLoading||{},[a]:!0},Tr(),Aa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return o&&(n.replayResults={...n.replayResults||{},[a]:o},se(o.cacheHit?"replayCacheHit":"replayCacheMiss")),o}catch{return n.replayResults={...n.replayResults||{},[a]:Dp(a)},null}finally{const r={...n.replayLoading||{}};delete r[a],n.replayLoading=r,Tr(),Aa()}}function aS(e=""){const t=String(e||"").trim();!t||!N("replayBeforeBuyEnabled",!0)||(n.replayDetails={open:!0,tokenMint:t},Ka(),Tr(),Tl(t))}function Al(){n.replayDetails={open:!1,tokenMint:""},Tr(),jr()}function Tr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=n.replayDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",a),!a||!N("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=$l(r),o=!!n.replayLoading?.[r],c=`
    <div class="slimeshield-drawer-backdrop" data-replay-close></div>
    <aside class="replay-before-buy-drawer" role="dialog" aria-modal="true" aria-label="Replay Before You Buy details">
      <header>
        <div>
          <span>Replay Before You Buy</span>
          <h3>${l(S(r))}</h3>
        </div>
        <button type="button" data-replay-close>Close</button>
      </header>
      <section class="replay-summary">
        <strong>${l(s.summary||"Not enough local history yet.")}</strong>
        <small>${o?"Updating...":`Confidence: ${l(s.confidence||"low")} · Updated ${l(Te(s.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${l(s.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${l($n(s.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${l($n(s.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${l($n(s.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${l($n(s.failRatePercent))}</dd></div>
        <div><dt>Best exit</dt><dd>${l(s.bestExitPattern||"n/a")}</dd></div>
      </dl>
      <section>
        <h4>Matched Traits</h4>
        ${Array.isArray(s.matchedTraits)&&s.matchedTraits.length?`
          <ul class="slimeshield-factor-list">
            ${s.matchedTraits.map(i=>`<li><span>${l(i)}</span></li>`).join("")}
          </ul>
        `:'<p class="slimeshield-muted">Not enough local coverage yet.</p>'}
      </section>
      <button type="button" data-replay-refresh="${l(r)}" ${o?"disabled":""}>${o?"Updating...":"Refresh Replay"}</button>
      <p class="slimeshield-safety-copy">Replay uses cached local SlimeWire history only. It does not fetch historical chain data from this drawer.</p>
    </aside>
  `;kn(e,c,".replay-drawer")}function Aa(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=n.slimeShieldDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",a),!a||!N("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=$a(r)||{tokenMint:r},o=n.slimeShieldResults?.[r]||at(s),c=o.verdict||"CAUTION",i=o.sourceHydration||{},d=o.marketContext||{},u=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,6):[],p=!!n.slimeShieldLoading?.[r],f=Array.isArray(o.factors)?o.factors:[],y=O(d.marketCap,s.marketCap,s.fdv),b=O(d.liquidityUsd,s.liquidityUsd),v=O(d.volumeH1,s.volumeH1,s.volume1h),P=O(d.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),A=d.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",g=d.mintAuthority||s.mintAuthority||"",T=d.freezeAuthority||s.freezeAuthority||"",C=!!(d.heliusDasIndexedAt||d.heliusDasSource||s.heliusDasSource||A||g||T),B=o.devInfoSummary||vr(s),U=ya(B.status),H=[...Array.isArray(o.externalLinks)?o.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:d.dexUrl||s.dexUrl||Z(r)},{label:"Pump",url:d.pumpUrl||gn(s)},{label:"X",url:d.twitterUrl||s.twitterUrl||s.xUrl},{label:"TG",url:d.telegramUrl||s.telegramUrl},{label:"Web",url:d.websiteUrl||s.websiteUrl}].filter((J,Ue,Mt)=>/^https?:\/\//i.test(String(J.url||""))&&Mt.findIndex(Pn=>String(Pn.url||"")===String(J.url||""))===Ue),Se=[...Array.isArray(s.riskFlags)?s.riskFlags:[],...Array.isArray(s.scoreWarnings)?s.scoreWarnings:[],...Array.isArray(s.bestPickWarnings)?s.bestPickWarnings:[]].filter(Boolean).slice(0,4),Ne=[["verdict","Verdict"],["risks","Risk & Signals"]],q=Ne.some(([J])=>J===n.slimeShieldTab)?n.slimeShieldTab:"verdict",Ie=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer dossier-drawer" data-active-pane="${l(q)}" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${l(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <div class="dossier-tabs" role="tablist" aria-label="SlimeShield sections">
        ${Ne.map(([J,Ue])=>`<button type="button" role="tab" data-slimeshield-tab="${J}" data-active="${q===J}">${l(Ue)}</button>`).join("")}
      </div>
      <section class="slimeshield-drawer-summary slimeshield-${l(hn(c))}" data-pane="verdict">
        <strong>${l(s.symbol||s.shortMint||S(r))}</strong>
        <p>${l(o.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${l(o.confidence||"low")}</span>
          <span>Score: ${l(Number.isFinite(Number(o.score))?`${Math.round(Number(o.score))}/100`:"n/a")}</span>
          <span>${p?"Updating...":`Updated ${l(Te(o.updatedAt))}`}</span>
        </div>
      </section>
      <section data-pane="verdict">
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${l(S(r))}</dd></div>
          <div><dt>Age</dt><dd>${l(Number.isFinite(P)?ao(P):ro(s.pairAgeLabel||zt(s),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${l(Number.isFinite(b)&&b>0?M(b):ro(s.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${l(Number.isFinite(y)&&y>0?M(y):ro(s.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${l(Number.isFinite(v)&&v>0?M(v):ro(s.volumeH1Label||s.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${l(Gs(U))} · ${l(B.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${l(A?S(A):C?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${l(`${g?S(g):C?"none":"not indexed"} / ${T?S(T):C?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${l(d.source||o.cacheSource||o.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${l(Se.length?Se.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${H.map(J=>`<a href="${l(J.url)}" target="_blank" rel="noreferrer">${l(J.label)}</a>`).join("")}
          ${N("devInfoEnabled",!0)?`<button type="button" data-dev-info="${l(r)}">Open Dev Info</button>`:""}
        </div>
        ${i.message?`<p class="slimeshield-muted">Source refresh: ${l(i.message)}</p>`:""}
        ${u.length?`<ul class="slimeshield-factor-list">${u.map(J=>`<li><span>${l(J)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section data-pane="risks">
        <h4>Top Risk Reasons</h4>
        ${Rp(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section data-pane="risks">
        <h4>Positive Signals</h4>
        ${Rp(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note" data-pane="verdict">
        <h4>Suggested Action</h4>
        <p>${l(Ow(o.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${l(Ew(o.protectedBuyPreset))}</small>
      </section>
      ${tS(r)}
      <div class="slimeshield-drawer-actions">
        ${N("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${l(r)}" data-protected-buy-preset="${l(o.protectedBuyPreset||hl(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${l(r)}" ${p?"disabled":""}>${p?"Updating...":"Refresh Details"}</button>
        <button type="button" data-radar-open="${l(r)}" data-radar-symbol="${l(s.symbol||"")}">📡 Radar</button>
        <button type="button" data-token-trade="${l(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${n.slimeShieldStatus?`<small class="slimeshield-status">${l(n.slimeShieldStatus)}</small>`:""}
    </aside>
  `;kn(e,Ie,".slimeshield-drawer")}function Pl(e){const t=e==="bundle"?"bundle":"trade";n.activeTab=t,t==="trade"&&(n.editingTradePresetId=""),t==="bundle"&&(n.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function B0(e){if(!e?.tokenMint)return F("No token selected","Click any row to preview it here without leaving the live feeds.");const t=lt().some(a=>String(a.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${gt(e)}
      <div>
        <strong>${l(e.symbol||e.shortMint||S(e.tokenMint))}</strong>
        <small>${l(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(S(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${l(e.pairAgeLabel||zt(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${l(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${l(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${l(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${N("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${l(N("slimeShieldEnabled",!0)?at(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${Bp(e)}
    <div class="card-actions compact">
      <a href="${l(e.dexUrl||Z(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${gn(e)?`<a href="${l(gn(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="token-preview">${l(ka())}</button>
      <button data-quick-bundle-token="${l(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function R0(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([a,r])=>`<button type="button" data-smart-chart-view="${a}" data-active="${e===a}">${r}</button>`).join("")}
    </div>
  `}function nS(e=""){const t=String(e||"").trim();return t?(n.pnl?.trades||[]).filter(a=>String(a?.tokenMint||a?.mint||"").trim()===t):[]}function I0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=nS(a),s=!!(gn(e)&&tl(e)),o=s?gn(e):e.dexUrl||Z(tp(e)||a),c=s?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${l(c)} Transactions</h4>
          <p>Live market activity from ${l(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${l(o)}" target="_blank" rel="noreferrer">Open ${l(c)} Feed</a>
      </div>
      ${pl(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${Ll(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function O0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=_m(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${l(e.symbol||S(a))}.</p>
        </div>
      </div>
      ${pl(e,"info")}
      ${bp(e)}
      ${Bp(e)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${l(r)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${l(a)}">${l(S(a))}</button></dd></div>
        <div><dt>Position</dt><dd>${t?"Held":"None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${l(e.source||e.category||e.dexId||"market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${Xs(e)}
      </div>
    </section>
  `}function rS(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=n.chartTradeTab==="sell"?"sell":"buy",s=ie(),o=n.wallets?.length?String(n.wallets[0]?.index||""):"",c=Eu(),i=pt(),d=i?.walletIndex||(i?.walletIndexes||[])[0]||"",u=s?.publicKey&&Fu(s)?"connected":"",p=n.chartBuyWalletIndex||u||(c?.index?String(c.index):"")||d||o||(s?.publicKey?"connected":""),f=pe(p),y=n.quickBuyAmountOverride||ze(i)||"",b=i?bn("trade"):"No preset / manual",v=String(i?.slippageBps||"400"),P=String(i?.takeProfitPct||"25"),A=String(i?.stopLossPct||"8"),g=String(i?.sellDelay||"off"),T=String(i?.sellPercent||"100"),C=new Set(["300","400","500"]),B=Number.isFinite(Number(v))?`${Number(v)/100}%`:v,U=t?`${l(t.uiAmount||"Position")} tokens | ${l(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
              ${ln(p)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${l(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(H=>`<button type="button" data-chart-buy-preset="${H}">${H} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${dt("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <small class="chart-preset-summary">${l(b)}</small>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300" ${v==="300"?"selected":""}>3%</option>
              <option value="400" ${v==="400"?"selected":""}>4%</option>
              <option value="500" ${v==="500"?"selected":""}>5%</option>
              ${C.has(v)?"":`<option value="${l(v)}" selected>${l(B)}</option>`}
            </select>
          </label>
          <div class="chart-auto-exit-grid" aria-label="Chart buy exit settings">
            <label>
              Take Profit
              ${Ht({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${Ht({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:A,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Ze("chart-buy-delay","data-chart-buy-delay",g)}
            </label>
            <label>
              Exit Size
              ${Ht({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:T,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${l(s?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:o?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${l(a)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${l(n.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${U}</p>
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
  `}function E0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim();return a?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${l(a)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${N("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${l(a)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function sS(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=ft(e),s=ht(e),o=y=>{const b=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(b)?"":b},c=_(r>0?M(r):"",o(e.marketCapLabel),o(e.fdvLabel),"checking"),i=_(s>0?M(s):"",o(e.liquidityLabel),"checking"),d=_(Number(e.volumeH1)>0?M(e.volumeH1):"",o(e.volumeH1Label),o(e.volumeLabel),"checking"),u=_(Number(e.volumeH24)>0?M(e.volumeH24):"",o(e.volumeH24Label),"checking"),p=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,b=Number(e.h1);return s>0&&s<5e3?"Thin exit":Number.isFinite(b)&&b>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(b)||b>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&s>0?"Clean setup":""})(),f=t?"Position held":p||(tl(e)?"Pump curve":_(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${l(S(a))}</strong></span>
      <span><small>MC / FDV</small><strong>${l(c)}</strong></span>
      <span><small>LIQ</small><strong>${l(i)}</strong></span>
      <span><small>1H</small><strong>${l(d)}</strong></span>
      <span><small>24H</small><strong>${l(u)}</strong></span>
      <span><small>Status</small><strong>${l(f)}</strong></span>
    </div>
  `}function oS(){try{return iS()}catch(e){console.error("Smart Chart render failed:",e);const t=String(n.smartChartToken||n.tradeToken||n.terminalToken||"").trim(),a=t?S(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
          `:F("Paste a token CA","Open a token from Live Terminal or paste a CA above.")}
          <small class="score-breakdown">Fallback chart kept the page alive after a display error. Reopen the CA to refresh the full SlimeWire chart shell.</small>
        </article>
      </section>
    `}}function iS(){const e=Vs(),t=String(e?.tokenMint||"").trim(),a=t?lt().find(o=>String(o.tokenMint)===t):null,r=t?we([e,...mr().filter(o=>String(o.tokenMint||"")===t)]).filter(Boolean).slice(0,5):Sa(yr(),5,wa("smart-chart-suggest"),1);if(!t)return`
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
          ${At(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:wa("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;oa("tokenHeaderRendered"),oa("chartSkeletonRendered"),oa("buyPanelReady"),W({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(tt(t)?.cacheHit||gr(t)?.pairAddress),stale:!!tt(t)?.stale,details:t});const s=e.symbol||e.shortMint||S(t);return`
    <section class="smart-chart-terminal smart-chart-clean-terminal">
      <div class="terminal-title-row smart-chart-clean-title">
        <div>
          <h3>${l(s)} Chart</h3>
          <p>Live SlimeWire chart, transactions, and wallet trade controls for the selected CA.</p>
        </div>
        <button type="button" data-tab="terminal">Back to Live Terminal</button>
      </div>
      <div class="smart-chart-search smart-chart-clean-search">
        <input data-smart-chart-input value="${l(t)}" placeholder="Paste token CA" autocomplete="off">
        <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
      </div>
      <div class="smart-chart-grid smart-chart-clean-grid">
        <article class="terminal-panel smart-chart-main smart-chart-clean-main">
          ${(()=>{lS(t);const o=Np(t);return o?`<div class="coin-banner-hero" style="background-image:url('${o}')" role="img" aria-label="Coin banner"></div>`:""})()}
          <div class="smart-chart-token-header smart-chart-clean-token-header${Np(t)?" has-banner":""}">
            ${gt(e)}
            <div>
              <strong>${l(s)}</strong>
              <small>${l(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${l(t)}">${l(S(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${Xs(e)}
            </div>
          </div>
          ${sS(e,a)}
          ${pl(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${l(s)}</h3>
          ${rS(e,a)}
        </aside>
      </div>
      ${dS(t)}
    </section>
  `}function Np(e){const t=String(e||"").trim();return n.coinBanners&&n.coinBanners[t]||""}let Up="";function lS(e){const t=String(e||"").trim();!t||Up===t||(Up=t,k(`/api/web/coin-banner?mint=${encodeURIComponent(t)}`).then(a=>{const r=String(a?.bannerUri||"");r&&(n.coinBanners=n.coinBanners||{},n.coinBanners[t]=Qe(r),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0}))}).catch(()=>{}))}let Cl="",qp=0;function Hp(e){e&&(Cl===e&&Date.now()-qp<3e4||(Cl=e,qp=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{n.chartCalls={mint:e,...t},n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function cS(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[a,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${a} ${r}`}function dS(e){Hp(e);const t=n.chartCalls?.mint===e?n.chartCalls:null,a=t?.calls||[],r=!!(n.token&&n.user);return`
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
          ${a.map(s=>`
            <article class="row-card">
              <div class="row-main">
                <strong>${l(cS(s.side))} <span class="muted-text">by ${l(s.handle)}</span>
                  ${s.reputation?.wins?`<span class="positive">${l(String(s.reputation.wins))}W${s.reputation.hitRatePct!=null?` ${l(String(s.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${s.entryMcUsd?`Entry MC ${l(M(s.entryMcUsd))} | `:""}${s.targetX?`Target ${l(String(s.targetX))}x | `:""}${s.shieldVerdict?`Shield ${l(s.shieldVerdict)} ${l(String(s.shieldScore??""))} | `:""}${l(Te(s.createdAt))}</span>
                ${s.note?`<small>${l(s.note)}</small>`:""}
                ${s.status==="resolved"?`<small class="${s.outcome==="won"?"positive":"negative"}">${s.outcome==="won"?`✅ hit ${l(String(s.peakX))}x`:l(s.outcome)}</small>`:s.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${l(s.mint)}" data-quick-buy-source="call-board">${l(ka())}</button>
                <button data-watch-token="${l(s.mint)}" data-watch-symbol="${l(s.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${l(Ga(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ye(`$${n.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function uS(e){const t=m("[data-call-status]");try{const a=m("[data-call-side]")?.value||"bullish",r=m("[data-call-target]")?.value||"",s=m("[data-call-note]")?.value||"";w(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:a,targetX:r,note:s,source:"site"})}),w(t,"Call posted - it is now being tracked."),Cl="",Hp(e)}catch(a){w(t,D(a?.message||"Could not post call."))}}function pS(e,t=!1){const a=e?.tokenMint?n.positions.find(o=>String(o.tokenMint)===String(e.tokenMint)):null,r=bn("trade"),s=bn("bundle");return t?`
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
              <small>${l(s)}</small>
            </summary>
            <label>
              Trade Preset
              <select data-fast-trade-preset="terminal">
                ${dt("trade",n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${dt("bundle",n.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${Dt().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${l(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${l(ka())}</button>
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
          `:F("No token selected","Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${l(os())}</small>
        </div>
    </article>
  `}function mS(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,a])=>`<button data-terminal-subtab="${t}" data-active="${n.terminalSubtab===t}">${a}</button>`).join("")}
      </div>
      ${fS()}
    </section>
  `}function fS(){if(n.terminalSubtab==="orders")return zp();if(n.terminalSubtab==="history")return Ll(12);if(n.terminalSubtab==="wallets")return Zu();if(n.terminalSubtab==="kol"){const e=dp(n.kolScan?.rows||[]).filter(t=>!hr(t));return At(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:wa("bottom-kol"),stickyCount:1})}return n.terminalSubtab==="sniper"?n.scan?mt(n.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):F("No sniper scan loaded","Open Sniper or refresh a scan mode."):n.terminalSubtab==="tx"?Gp(!0):n.terminalSubtab==="reconcile"?jp():hS(6)}function hS(e=25){const t=lt();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(Vp).join("")}
    </div>
  `:F("No open positions","Open token holdings will show here after refresh.")}const Kp=new Map;function gS(e){const t=String(e.tokenMint||"");if(!t)return"";const a=(n.pnl?.tokens||[]).find(u=>String(u.tokenMint)===t),r=fr().find(u=>String(u?.tokenMint||"")===t),s=(Array.isArray(n.tradePlans)?n.tradePlans:[]).find(u=>String(u.tokenMint)===t&&["watching","active","armed","pending"].includes(String(u.status||"").toLowerCase())),o=[];a?.spentSol&&o.push(`Entry ${a.spentSol} SOL`),r?.marketCapLabel&&o.push(`MC ${r.marketCapLabel}`),o.push(s?`TP ${s.takeProfitSummary||s.takeProfitPct||"off"} / SL ${s.stopLossSummary||s.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let i="";if(Number.isFinite(c)){const u=Kp.get(t);if(u&&Number.isFinite(u.value)&&Math.abs(c-u.value)>5e-4){const p=c-u.value;i=`${p>0?"▲ +":"▼ "}${p.toFixed(4)} SOL since last refresh`}Kp.set(t,{value:c,at:Date.now()})}let d="";if(s){const u=Number(s.lastMovePct??s.wallets?.[0]?.lastMovePct),p=Number(s.takeProfitPct),f=Number(s.stopLossPct),y=Date.parse(s.sellAfterAt||s.wallets?.[0]?.sellAfterAt||""),b=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(u)&&Number.isFinite(p)&&p>0&&u>=p*.75?d=`Up ${u.toFixed(1)}% - take-profit at +${p}% is close`:Number.isFinite(u)&&Number.isFinite(f)&&f>0&&u<=-(f*.6)?d=`Down ${Math.abs(u).toFixed(1)}% - stop-loss at -${f}% is near`:b!==null&&b>0&&b<=10?d=`Timer exit in ~${b} min`:Number.isFinite(u)&&(d=`${u>=0?"Up":"Down"} ${Math.abs(u).toFixed(1)}% - exits watching`)}else ty(t)||e.source==="launch-optimistic"?d="⏳ Exits arming from your launch - TP/SL/timer registering...":d="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${l(o.join(" | "))}</small>
    ${d?`<small class="${/close|near|Timer|No auto/.test(d)?"warning-text":"muted-text"}">${l(d)}</small>`:""}
    ${i?`<small class="${i.startsWith("▲")?"positive":"negative"}">${l(i)}</small>`:""}
  `}function Vp(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",a=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),s=!!(e.viewOnly||e.source==="connected-wallet"),o=t?`${e.estimatedValueSol} SOL`:r?"updating":s?"tracking":"Price unavailable",c=a?e.openPnlSol:r?"updating":s?"realized only":"Price unavailable",i=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:s&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${gt(e)}
      <div class="row-main">
        <strong>${l(e.symbol||e.shortMint)}</strong>
        <span>${l(e.uiAmount)} tokens across ${l(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${l(e.name)}</small>`:""}
        <small>Value: ${l(o)} | PnL: ${l(c)}</small>
        ${gS(e)}
        ${i?`<small class="${r?"muted-text":"warning-text"}">${l(i)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${l(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${l(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${l(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${l(e.tokenMint)}">Custom %</button>
        ${Ye(Lg(e))}
        <a href="${l(e.dexUrl||Z(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Ll(e=10,t=null){const a=Array.isArray(t)?t:n.pnl?.trades||[];return a.length?`
    <div class="live-trade-list">
      ${a.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${l(String(r.type||"").toUpperCase())} ${l(r.shortMint||S(r.tokenMint))}</strong>
          <span>${l(r.walletLabel||"wallet")} | ${l(r.solAmount||"0")} SOL</span>
          <small>${l(Te(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${l(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${l(r.tokenMint)}" data-quick-buy-source="live-trades">${l(ka())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:F("No live trade history yet","Submitted web trades will appear here after refresh.")}function bS(){const e=n.pnl?.trades||[],t=it("liveTrades",e);return`
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
        ${Ll(t.length||Za("liveTrades"),t)}
        ${da("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${pS(ep())}
      </aside>
    </section>
  `}function zp(){const e=Array.isArray(n.tradePlans)?n.tradePlans:[],t=[n.tradePlanResult,n.bundleResult,n.volumeResult,n.sniperResult,n.kolResult,n.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),a=e.length?e:t;return a.length?`
    <div class="table-list compact-table">
      ${a.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${l(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${l(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${l(r.status||"watching")} | Active wallets: ${l(r.activeWallets??"?")}/${l(r.walletCount??"?")} | TP ${l(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${l(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${l(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${l(Te(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${l(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(yS).join("")}</div>`:""}
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
  `:F("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function yS(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",a=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,s=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",o=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Jn(nn(e.retryAfterAt))}`:"",i=e.lastError||e.lastPriceEstimateError||"",d=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",u=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",p=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${l(e.label||"Wallet")}</strong>
        <span>${l(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${l(a)}${e.triggerKind?` / ${l(e.triggerKind)}`:""}</span>
        <small>Move ${l(s)}${l(o)} | checked ${l(Jn(nn(t)))}${l(c)}</small>
        <small>${l(d)} | ${l(u)} | ${l(p)} | Source: ${l(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${l(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${l(e.sellSignature)}</small>`:""}
        ${i?`<small class="warning-text">Error: ${l(i)}</small>`:""}
      </div>
    </div>
  `}function jp(){const e=n.balances.filter(a=>a.error),t=n.balances.reduce((a,r)=>a+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${l(Jn(nn(n.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(a=>`<article class="row-card"><strong>${l(a.label||`Wallet ${a.index}`)}</strong><span>${l(a.error)}</span></article>`).join("")}
      </div>
    `:F("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Gp(e=!1){const t=n.terminalTxAudit;return`
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
        ${t?vS(t):F("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${zp()}${jp()}</aside>`}
    </section>
  `}function vS(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${l(e.error)}</span></article>`:`
    <section class="pnl-summary tx-summary">
      <div><span>Status</span><strong>${l(e.status||"unknown")}</strong></div>
      <div><span>Fee</span><strong>${l(e.feeSol||"0")} SOL</strong></div>
      <div><span>Slot</span><strong>${l(e.slot||"n/a")}</strong></div>
      <div><span>Refresh</span><strong>${e.shouldRefreshBalances?"Yes":"No"}</strong></div>
    </section>
    <div class="table-list compact-table">
      <article class="row-card"><strong>Fee payer</strong><code>${l(e.feePayer||"unknown")}</code></article>
      <article class="row-card"><strong>SOL deltas</strong><span>${(e.solDeltas||[]).map(t=>`${S(t.account)} ${t.deltaSol}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Token deltas</strong><span>${(e.tokenDeltas||[]).map(t=>`${S(t.owner||t.account)} ${t.deltaUiAmount} ${S(t.mint)}`).join(" | ")||"none"}</span></article>
      <article class="row-card"><strong>Created token accounts</strong><span>${(e.createdAssociatedTokenAccounts||[]).map(t=>S(t.account)).join(", ")||"none detected"}</span></article>
      <article class="row-card"><strong>Programs</strong><span>${(e.programs||[]).join(", ")||"n/a"}</span></article>
      ${e.explorerUrl?`<article class="row-card"><strong>Explorer</strong><a href="${l(e.explorerUrl)}" target="_blank" rel="noreferrer">Open Solscan</a></article>`:""}
    </div>
    <details class="raw-log-panel">
      <summary>Raw logs</summary>
      <pre>${l((e.logs||[]).join(`
`)||"No logs returned.")}</pre>
    </details>
  `}function wS(e=[]){const t=[...e].sort((a,r)=>Number(r.bestPickScore||r.score||0)-Number(a.bestPickScore||a.score||0)||nt(a,r));return Sa(t,5,wa("cooks-best"),1)}function me(e){const t=Number(e);return Number.isFinite(t)?t:0}function so(){const e=n.liveFeedCategory||"best";return Yo.find(([t])=>t===e)||Yo[0]}function Ar(e={}){return Lr(e)||em(e)||po(e)||0}function oo(e={}){return me(e.buys5m)+me(e.buysH1)+me(e.sells5m)+me(e.sellsH1)}function xl(e={}){const t=me(e.buys5m)+me(e.buysH1),a=me(e.sells5m)+me(e.sellsH1),r=t+a;return r>0?t/r:.5}function Pr(e={}){return Math.max(me(e.m5),me(e.h1),me(e.h24))}function io(e={}){return Math.max(me(e.m5),me(e.h1))}function Xp(e={}){return io(e)*Math.log10(10+Ar(e))*(.5+xl(e))}function Jp(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function SS(e=[],t="best"){const a=[...e];switch(t){case"volume":return a.sort((r,s)=>Ar(s)-Ar(r));case"liquidity":return a.sort((r,s)=>ht(s)-ht(r));case"marketcap":return a.sort((r,s)=>ft(s)-ft(r));case"active":return a.sort((r,s)=>oo(s)-oo(r));case"fresh":return a.sort(nt);case"gainers":return a.sort((r,s)=>Pr(s)-Pr(r));default:return a.sort((r,s)=>me(s.bestPickScore||s.score)-me(r.bestPickScore||r.score)||nt(r,s))}}function lo(){const e=n.liveTerminalCategory||"dexTrending";return za.find(([t])=>t===e)||za[0]}function kS(e,t,a,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${l(r)}</span>
      <select ${a} aria-label="${l(r)} category">
        ${e.map(([s,o])=>`<option value="${s}"${s===t?" selected":""}>${l(o)}</option>`).join("")}
      </select>
    </label>`}function $S(){if(n.activeTab==="terminal"){const t=lo();return{categories:za,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:a=>Yp(a,t[0]),hasBest:!1}}const e=so();return{categories:Yo,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>SS(t,e[0]),hasBest:e[0]==="best"}}function TS(e={}){if(Jp(e))return{cls:"boost",text:"⚡ Boosted"};const t=Pr(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const a=Number(e.pairAgeMinutes);return Number.isFinite(a)&&a>=0&&a<=10?{cls:"fresh",text:"✨ Fresh"}:io(e)>=25?{cls:"hot",text:"🔥 Hot"}:xl(e)>=.7&&oo(e)>=24?{cls:"active",text:"● Active"}:null}function Ml(e={}){const t=TS(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${l(t.text)}</span>`:""}function AS(e={}){const t=[];Jp(e)&&t.push("⚡ boosted");const a=[["5m",me(e.m5)],["1h",me(e.h1)],["24h",me(e.h24)]];a.sort((c,i)=>i[1]-c[1]),a[0][1]>=12&&t.push(`▲${Math.round(a[0][1])}% ${a[0][0]}`);const r=oo(e),s=xl(e);r>=12&&s>=.62&&t.push(`${Math.round(s*100)}% buys`),e.smartMoney&&t.push("smart money in");const o=Lr(e)||po(e);return o>=2e3&&t.length<3&&t.push(`${M(o)} vol`),r>=30&&t.length<3&&t.push(`${r} trades`),Number(e.sniperCount||0)===0&&a[0][1]>=12&&t.length<3&&t.push("no snipers"),t.slice(0,3)}function PS(e={}){const t=AS(e);return t.length?`<div class="signal-why" title="Why it's moving"><small><span class="signal-why-tag">Why</span> ${l(t.join(" · "))}</small></div>`:""}function CS(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function F0(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return CS(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Cr(){const e=n.cookSpotCategory||"dexTrending";return za.find(([t])=>t===e)||za[0]}function Yp(e=[],t="dexTrending"){const a=[...e];switch(t){case"fresh":return a.sort(nt);case"dexBoosted":case"graduated":return a.sort((r,s)=>Ar(s)-Ar(r));case"memeMovers":return a.sort((r,s)=>Pr(s)-Pr(r));case"earlyMomentum":return a.sort((r,s)=>io(s)-io(r));default:return a.sort((r,s)=>Xp(s)-Xp(r))}}function LS(e=Cr()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${za.map(([a,r])=>`<option value="${a}"${a===t?" selected":""}>${l(r)}</option>`).join("")}
      </select>
    </label>`}function Qp(e=0,t=""){const a=nn(t),r=a===null?"live":Jn(a);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${l(r)}</span></div>`}function Bl(e=[]){const t=$S(),a=kS(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',s=Qp(e.length,ua()),o={context:"live",shareBuilder:Pa,hideToolbar:!0};if(t.hasBest){const i=wS(e),d=new Set(i.map(va).filter(Boolean)),u=[...e].sort(nt).filter(f=>!d.has(va(f))),p=it("live",u);return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>Top ${i.length} · rotating each refresh</span>${r}</div>
        ${i.length?mt(i,o):F("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${p.length?mt(p,o):F("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=it("live",t.rank(e));return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>${l(t.sub)}</span>${r}</div>
        ${c.length?mt(c,o):F("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function Zp(){const e=qe(),t=we(e?.rows||[]),a=vn(t),r=it("live",a),s=Et.find(([f])=>f===n.livePairBucket)?.[1]||"Live",o=ua(),c=!!n.livePairsLoadingByBucket[n.livePairBucket],i=yn(),d=n.livePairsRefreshErrorByBucket?.[n.livePairBucket],u=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",p=a.length?Bl(a):i?Sr(t,`${s.toLowerCase()} pairs`):d?F("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?F("Loading live pairs…","Scanning fresh pairs for this time window."):F("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Et.map(([f,y])=>{const b=n.livePairsByBucket[f]?.rows?.length,v=Number.isFinite(Number(b))?` (${b})`:"";return`<button data-live-pair-bucket="${f}" data-active="${n.livePairBucket===f}">${y}${v}</button>`}).join("")}
        </div>
        ${bl("live",{rawCount:t.length,visibleCount:a.length})}
        ${gl(t,a)}
        ${Hi("live")}
        ${p}
        ${da("live",a,`${s} pairs`)}
      </main>
    </section>
  `}function W0(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function xS(){if(!n.user||!n.token)return`${cs()}${F("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=n.watchlist?.rows||[],t=n.watchlistTagFilter||"",a=[...new Set(e.flatMap(i=>Array.isArray(i.tags)?i.tags:[]))].slice(0,20),r=t&&!a.some(i=>i.toLowerCase()===t.toLowerCase())?"":t,s=r?e.filter(i=>Array.isArray(i.tags)&&i.tags.some(d=>String(d).toLowerCase()===r.toLowerCase())):e,o=it("watchlist",s),c=a.length?`
        <div class="watchlist-tag-filter">
          <button type="button" data-watchlist-tag="" data-active="${!r}">All ${e.length}</button>
          ${a.map(i=>`<button type="button" data-watchlist-tag="${l(i)}" data-active="${r.toLowerCase()===i.toLowerCase()}">${l(i)}</button>`).join("")}
        </div>`:"";return`
    <section class="terminal-layout watchlist-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Watchlist</h3>
            <p>Saved coins refresh while this tab is open. Tag coins (Holding, Watching…) — tags work like named lists you can filter by.</p>
          </div>
          <span>${o.length}/${s.length} watched</span>
        </div>
        ${c}
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-watchlist>${n.watchlistLoading?"Refreshing...":"Refresh Watchlist"}</button>
          <button data-tab="live">Cooks</button>
          <button data-tab="sniper">Sniper</button>
          <button data-tab="kol">KOL Tracker</button>
        </div>
        ${o.length?mt(o,{context:"watchlist",shareBuilder:i=>Oi(i.tokenMint)}):F("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
        ${da("watchlist",e,"watched pairs")}
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
  `}function _0(e){return mt(e,{context:"live",shareBuilder:Pa})}function mt(e,t={}){const a=t.shareBuilder||Pa,r=we(e),s=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":Hi(t.context||"scanner")}
    <div class="${l(s)}">
      <div class="signal-header">
        <span>Pair Info</span>
        <span>Age</span>
        <span>Current Liquidity</span>
        <span>FDV / MC</span>
        <span>Txns</span>
        <span>Volume</span>
        <span>Action</span>
      </div>
      ${r.map((o,c)=>MS(o,c,{...t,shareText:a(o),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":Hi(t.context||"scanner")}
      ${F(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function MS(e,t,a={}){const r=co(e.tokenMint),s=a.shareText||Pa(e),o=a.primaryActionLabel||"Trade",c=a.primaryAction||"quickTrade",i=a.context==="kol",d=a.context==="watchlist"?`<button type="button" data-unwatch-token="${l(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${l(e.tokenMint)}" data-watch-symbol="${l(e.symbol||"")}" data-watch-name="${l(e.name||"")}" data-watch-image="${l(uo(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${i?"is-kol-signal":""}" data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(a.context||"signal-row")}">
      <div class="signal-token">
        ${gt(e,{priority:!!a.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${l(e.tokenMint)}" data-token-chart-source="${l(a.context||"signal-title")}">${l(e.symbol||e.shortMint||S(e.tokenMint))}</strong>
            <small>${l(e.name||e.category||"Token")}</small>
            ${i?"":Ml(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${l(e.tokenMint)}">${l(S(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${l(e.dexUrl||Z(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${l(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${l(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${l(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${l(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${l(s)}" title="Share to X">SHARE</button>
            ${Fd(s,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${l(e.sniperCount)}</span>`:""}
          </div>
          ${pw(e)}
          ${PS(e)}
          ${a.context==="watchlist"?Gw(e):""}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${l(e.pairAgeLabel||zt(e)||"age unknown")}</span><small>${l(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${l(_(e.liquidityLabel,ht(e)>0?M(ht(e)):"","checking"))}</span><small>${BS(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${l(_(e.marketCapLabel,ft(e)>0?M(ft(e)):"","checking"))}</span><small>${l(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${l(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${l(cw(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${l(_(e.volumeH1Label,e.volumeLabel,Lr(e)>0?M(Lr(e)):"","checking"))}</span>
        <small>${fp(e).map(([u,p])=>`${u} ${p}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${l(e.tokenMint)}" title="Snipe buy">${l(o)}</button>`:`<button type="button" class="primary" data-token-trade="${l(e.tokenMint)}" data-token-trade-source="${l(a.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${l(e.tokenMint)}" data-quick-buy-source="${l(a.context||"signal-row")}" title="Quick buy with preset or custom SOL">${l(ka())}</button>`}
        <button type="button" data-quick-bundle-token="${l(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${i?Pu(e):""}
        ${a.context==="watchlist"?`<button type="button" data-watchlist-edit="${l(e.tokenMint)}" data-watchlist-symbol="${l(e.symbol||"")}" title="Edit note &amp; tags">✎</button>`:""}
        ${d}
        ${mp(e)}
      </div>
    </article>
  `}function co(e){const t=String(e||"");return!!(n.watchlist?.rows||[]).some(a=>String(a.tokenMint)===t)}function zt(e){const t=Zs(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function BS(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const a=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${a}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function uo(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{},o=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,a.imageUrl,a.image,a.logoURI,a.logo,a.iconUrl,a.info?.imageUrl,a.baseToken?.imageUrl,a.baseToken?.logoURI,s.imageUrl,s.image,s.logoURI,s.logo,o.imageUrl,o.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const i of c){const d=Qe(i);if(d)return d}return""}function ft(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{};return O(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,a.marketCap,a.marketCapUsd,a.market_cap,a.fdv,a.fdvUsd,a.baseToken?.marketCap,a.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,s.marketCap,s.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function ht(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.liquidity||{};return O(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,s.usd,s.quote,a.liquidityUsd,a.liquidity_usd,a.liquidity?.usd,a.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function po(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,s.m15,s.m15m,s.m5,s.h1,a.volume?.m15,a.volume?.m5,a.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Lr(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,s.h1,s.m30,s.m15,a.volume?.h1,a.volume?.m30,a.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function em(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeH24,e.volume24h,e.volume_h24,s.h24,s.d1,a.volume?.h24,a.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function gt(e,t={}){const a=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=uo(e),s=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),o=`token:${String(s||e.symbol||a).trim().toLowerCase()}`,c=N("tokenAvatarFixEnabled",!0),i=String(e.avatarState||"").trim().toLowerCase(),d=i==="missing"||i==="failed",u=!!e.avatarUrl&&(!i||i==="ready"),p=s&&!d?Qe(Wg(e)):"",f=c?Fi(o,u?e.avatarUrl:"",p,d?"":r):Fi(o,p,r),y=c&&!d?p&&f!==p?p:r&&r!==f?r:"":"",b=!!t.priority,v=b?"eager":"lazy",P=b?"high":"low",A=i||(f?"ready":"missing");if(f){const g=y?` data-backup-src="${l(y)}"`:"",T=p?` data-proxy-src="${l(p)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${l(A)}"><img src="${l(f)}"${g}${T} data-avatar-src="${l(f)}" data-avatar-key="${l(o)}" alt="${l(e.symbol||e.name||"Token")}" loading="${v}" decoding="sync" fetchpriority="${P}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${l(a)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${l(A)}"><span>${l(a)}</span></div>`}function RS(e=""){const t=String(e||"");let a=0;for(let r=0;r<t.length;r+=1)a+=t.charCodeAt(r);return a%5+1}function Rl(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${RS(e)}.png`}function Pa(e){return`Live pair ${e.symbol||S(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||zt(e)||"age unknown"}.`}function IS(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([a])=>a===n.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${l(OS(n.scanMode))}</p>
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
        ${n.scan?WS():F("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${ES()}
      </aside>
    </section>
  `}function OS(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function ES(){if(!n.wallets.length)return F("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=n.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${$t("sniper")}
        </div>
        ${qt("sniper")}
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
            ${Ze("sniper-delay","data-sniper-delay",e?"3":"5")}
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
            ${gs("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:ys("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${cn({toolKey:"sniperSetup",activeKey:dn("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${n.sniperResult?l(n.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${FS()}
    </section>
  `}function FS(){const e=n.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${l(t.message||t)}</span>`).join("")}</div>`:""}function WS(){const e=n.scan.rows||[],t=it("sniper",e);return e.length?`
    <p class="scan-meta">${l(n.scan.label)} | ${t.length}/${e.length} shown | scored ${n.scan.scanned} | qualified ${n.scan.qualified} | mode-fit ${n.scan.modeFit} | display pool ${n.scan.displayPool||0}</p>
    ${mt(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:xg})}
    ${da("sniper",e,"snipe candidates")}
  `:F("No usable picks","Refresh again or choose a different mode.")}function mo(){return n.user?.connectedWallet?.publicKey||""}function tm(){return n.ogreTek.markets.find(e=>e.symbol===n.ogreTek.selectedMarket)||n.ogreTek.markets[0]||null}function _S(){return{marketSymbol:n.ogreTek.selectedMarket,direction:n.ogreTek.direction,orderType:n.ogreTek.orderType,collateralUsd:n.ogreTek.collateralUsd,leverage:n.ogreTek.leverage,slippagePct:n.ogreTek.slippagePct,priorityFeeLamports:n.ogreTek.priorityFeeLamports,limitPrice:n.ogreTek.limitPrice,stopPrice:n.ogreTek.stopPrice}}function am(){return Wm(_S(),tm(),n.ogreTek.account,Ae)}function $e(e,t=2){const a=Number(e);return Number.isFinite(a)?Math.abs(a)>=1e9?`$${(a/1e9).toFixed(2)}B`:Math.abs(a)>=1e6?`$${(a/1e6).toFixed(2)}M`:Math.abs(a)>=1e3?`$${(a/1e3).toFixed(1)}K`:`$${a.toFixed(t)}`:"n/a"}function bt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function fo(e,t=3){const a=Number(e);return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(t)}%`:"n/a"}function nm(e){const t=Date.parse(e||"");if(!t)return"not loaded";const a=Math.max(0,Math.round((Date.now()-t)/1e3));return a<60?`${a}s ago`:`${Math.round(a/60)}m ago`}function ho(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in n.ogreTek)||(e.type==="checkbox"?n.ogreTek[t]=!!e.checked:n.ogreTek[t]=e.value)})}async function DS(){!Ae.enabled||n.ogreTek.loading||n.ogreTek.markets.length||n.ogreTek.error||await xr({silent:!0}).catch(e=>{n.ogreTek.error=D(e.message),h({force:!0})})}async function xr({force:e=!1,silent:t=!1}={}){if(Ae.enabled&&!(n.ogreTek.loading&&!e)){n.ogreTek.loading=!0,n.ogreTek.error="",t||h({force:!0});try{const a=mo(),[r,s,o,c]=await Promise.all([Ir.getMarkets(),Ir.getAccount(a),Ir.getPositions(a),Ir.getOpenOrders(a)]);n.ogreTek.markets=r||[],n.ogreTek.account=s||null,n.ogreTek.positions=o||[],n.ogreTek.orders=c||[],n.ogreTek.markets.some(i=>i.symbol===n.ogreTek.selectedMarket)||(n.ogreTek.selectedMarket=n.ogreTek.markets[0]?.symbol||"SOL-PERP"),n.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(a){n.ogreTek.error=D(a.message)}finally{n.ogreTek.loading=!1,h({force:!0})}}}function NS(){return`
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
  `}function US(){if(Om(Ae)!=="enabled")return NS();const e=!!mo(),t=tm(),a=am(),r=a.quote,s=n.ogreTek.account,o=a.ok&&!n.ogreTek.loading,c=n.ogreTek.error?"Provider Error":n.ogreTek.loading?"Loading":"Ready",i=Ae.demoMode?"Review Demo Trade":"Review Trade",d=Ae.demoMode?"Confirm Demo Review":"Confirm Order",u=Ae.demoMode?!n.ogreTek.riskAccepted||!a.ok:!Rm({validation:a,riskAccepted:n.ogreTek.riskAccepted,demoMode:Ae.demoMode});return`
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${Ae.demoMode?"Demo Mode":"Live Adapter"}</span>
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
            ${qS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${n.ogreTek.positions.length} open</span>
            </div>
            ${KS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${VS()}
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
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${l(Ae.maxLeverage)}" step="0.5" value="${l(n.ogreTek.leverage)}">
                <span>${l(n.ogreTek.leverage)}x max ${l(Ae.maxLeverage)}x</span>
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
            ${HS(r,t)}
            ${rm(a)}
            <button class="primary" type="button" data-ogre-tek-review ${o?"":"disabled"}>${l(i)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${zS(s)}
          </article>
        </aside>
      </section>
      ${n.ogreTek.reviewOpen?jS({validation:a,quote:r,market:t,confirmButtonText:d,confirmDisabled:u}):""}
    </section>
  `}function qS(){return n.ogreTek.loading&&!n.ogreTek.markets.length?F("Loading markets","Ogre Tek is loading demo perps markets."):n.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${n.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${l(e.symbol)}" data-active="${e.symbol===n.ogreTek.selectedMarket}">
          <span>${l(e.symbol)}</span>
          <strong>${bt(e.indexPrice)}</strong>
          <small>Oracle ${bt(e.oraclePrice)} | 24h ${fo(e.change24hPct,2)}</small>
          <small>Funding ${fo(e.fundingRatePct,3)} | OI ${$e(e.openInterestUsd,0)}</small>
          <small>Fresh ${l(nm(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:F("No markets available","No allowed perps markets are available for this provider.")}function HS(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${bt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${$e(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${bt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${$e(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${$e(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${$e(e?.maxLossUsd)}</strong></span>
    </div>
  `}function rm(e){const t=e.errors||[],a=e.warnings||[];return!t.length&&!a.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${l(r)}</p>`).join("")}
      ${a.map(r=>`<p data-kind="warning">${l(r)}</p>`).join("")}
    </div>
  `}function KS(){return mo()?n.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${n.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.side)} | margin ${fo(e.marginRatioPct,1)}</small></span>
          <span>${$e(e.sizeUsd)}<small>collateral ${$e(e.collateralUsd)}</small></span>
          <span>${bt(e.entryPrice)}<small>mark ${bt(e.markPrice)}</small></span>
          <span>${bt(e.liquidationPrice)}</span>
          <span data-positive="${Number(e.unrealizedPnlUsd)>=0}">${$e(e.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `:F("No open positions","Mock positions will appear here when the provider reports them."):F("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function VS(){return mo()?n.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${n.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${l(e.marketSymbol)}</strong><small>${l(e.type)} ${l(e.side)}</small></span>
          <span>${bt(e.triggerPrice)}</span>
          <span>${$e(e.sizeUsd)}</span>
          <span>${l(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:F("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):F("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function zS(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${$e(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${$e(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${$e(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${l(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${$e(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${l(e.maxLeverageAllowed||Ae.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${l(nm(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function jS({validation:e,quote:t,market:a,confirmButtonText:r,confirmDisabled:s}){const o=e.order||{};return`
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
          <span><small>Direction</small><strong>${l(o.direction||"long")}</strong></span>
          <span><small>Market</small><strong>${l(o.marketSymbol||a?.symbol||"n/a")}</strong></span>
          <span><small>Collateral</small><strong>${$e(o.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${l(o.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${bt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${bt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${$e(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${fo(a?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${$e(t?.maxLossUsd)}</strong></span>
        </div>
        ${rm(e)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${n.ogreTek.riskAccepted?"checked":""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${s?"disabled":""}>${l(r)}</button>
        </div>
      </article>
    </div>
  `}function sm(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const Il="slimewire:ogreAgentMessages:v1",Ol="slimewire:ogreAgentLastToken:v1";function GS(){try{const e=JSON.parse(localStorage.getItem(Il)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function XS(){try{localStorage.setItem(Il,JSON.stringify(Tn().slice(-50)))}catch{}}function jt(){if(n.ogreAgentLastTokenMint)return String(n.ogreAgentLastTokenMint);try{n.ogreAgentLastTokenMint=String(localStorage.getItem(Ol)||"").trim()}catch{n.ogreAgentLastTokenMint=""}return n.ogreAgentLastTokenMint||""}function go(e=""){const t=String(e||"").trim();if(!t)return"";n.ogreAgentLastTokenMint=t;try{localStorage.setItem(Ol,t)}catch{}return t}function Tn(){if(!Array.isArray(n.ogreAgentMessages)||!n.ogreAgentMessages.length){const e=GS();n.ogreAgentMessages=e.length?e:[sm()]}return n.ogreAgentMessages}function JS(){const e=String(n.smartChartToken||n.tradeToken||jt()||"").trim(),t=e?$a(e):null,a=t?.tokenMint?at(t):null,r=e?Op(e):null,s=e?$l(e):null,o=Ps().slice(0,3),c=e?lt().find(i=>String(i.tokenMint||"")===e):null;return{route:n.route,activeTab:n.activeTab,agentFastMode:n.ogreAgentFastMode,agentAutoTradeApproved:wo(),lastTokenMint:jt(),recentAgentMessages:Tn().slice(-8).map(i=>({role:i.role==="user"?"user":"assistant",text:String(i.text||"").slice(0,600)})),smartChartToken:n.smartChartToken||"",tradeToken:n.tradeToken||"",livePairBucket:n.livePairBucket||"",slimeScopeMode:n.slimeScopeMode||"",walletConnected:!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey),walletCount:vi(),positionCount:lt().length,totalSol:Dt().toFixed(4),selectedTradePreset:bn("trade"),selectedBundlePreset:bn("bundle"),quickBuyAmount:String(_l()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:co(e)}:null,slimeShield:a?{verdict:a.verdict,summary:a.summary,confidence:a.confidence,suggestedAction:a.suggestedAction,topFactors:(a.factors||[]).slice(0,4).map(i=>i.message||i.label||i.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?S(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:o.length?o.map(i=>({displayName:i.displayName,riskLabel:i.riskLabel,dumpRiskPercent:i.lowData?null:i.dumpRiskPercent,lowData:!!i.lowData,summary:ir(i)})):[],replayBeforeBuy:s?{sampleSize:s.sampleSize,confidence:s.confidence,winRatePercent:s.winRatePercent,medianMaxDrawdownPercent:s.medianMaxDrawdownPercent,summary:s.summary}:null,pnlSummary:{realized:wi(),positions:lt().length,totalSol:Dt().toFixed(4)},profile:{hasReferralCode:!!n.user?.referralCode,referralCode:n.user?.referralCode||"",hasReferralPayoutWallet:!!n.user?.referralPayoutWallet,hasXHandle:!!(n.xHandle||n.user?.xHandle),traderBoardEnabled:n.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:om()}}function om(){const e=[],t=new Set,a=(r,s="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(i=>a(i,s));return}if(Array.isArray(r.rows)){r.rows.forEach(i=>a(i,s));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(i=>a(i,s));return}if(typeof r!="object")return;const o=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!o)return;const c=o.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:o,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:s}))};return a(n.livePairRows,"live-pairs"),a(n.slimeScopeRows,"slime-scope"),a(n.livePairs,"live-pairs"),Object.values(n.livePairsByBucket||{}).forEach(r=>a(r,"bucket")),Object.values(n.terminalFeeds||{}).forEach(r=>a(r,"terminal-feed")),e.sort((r,s)=>im(s)-im(r)).slice(0,24)}function im(e={}){const t=A=>Number.isFinite(Number(A))?Number(A):0,a=t(e.ageMinutes),r=t(e.marketCap),s=t(e.liquidityUsd),o=t(e.volume5m),c=t(e.volume1h),i=Math.max(o,c*.18),d=a>0?Math.max(0,90-Math.min(a,360))/2.5:12,u=a>120?Math.min(42,(a-120)/4):0,p=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?i/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:i>0?2:-18,b=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,v=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+d+p+y+Math.log10(1+o+c)*7+Math.log10(1+s)*3+b+v-P-u}function YS(e={}){return String(e.label||e.type||"Run").slice(0,40)}function QS(e={},t=0){const a=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${l(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${l(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${a.length?`<div class="ogre-agent-actions">${a.map((s,o)=>`<button type="button" data-ogre-agent-action="${t}:${o}">${l(YS(s))}</button>`).join("")}</div>`:""}
    </div>
  `}function ZS(){const e=!!(n.ogreAgentLoading||n.ogreAgentSpeaking),t=!!n.ogreAgentListening,a=!!n.ogreAgentVoiceEnabled;return`
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
  `}function ek(){const e=!!n.ogreAgentOpen,t=Tn(),a=n.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=um(),s=n.ogreAgentListening?"Stop":"Mic";return`
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
        ${e?ZS():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(QS).join("")}
          ${n.ogreAgentLoading?'<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>':""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL...">${l(n.ogreAgentDraft||"")}</textarea>
          <div class="ogre-agent-composer-actions">
            <button type="button" class="ogre-agent-mic ${n.ogreAgentListening?"is-listening":""}" data-ogre-agent-mic title="${r?"Tap, speak, and Ogre will send it.":"Tap to check microphone support."}">${l(s)}</button>
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
  `}function E({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const a=t.querySelector("[data-ogre-agent-input]"),r=!!(a&&document.activeElement===a),s=r?a.selectionStart:null,o=r?a.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),i=c?c.scrollTop:0,d=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;a&&(n.ogreAgentDraft=a.value);const u=Array.isArray(n.ogreAgentMessages)?n.ogreAgentMessages:[],p=u[u.length-1]||{},f=[n.ogreAgentOpen?"open":"closed",n.ogreAgentLoading?"loading":"idle",n.ogreAgentStatus||"",u.length,p.role||"",p.text||"",Array.isArray(p.actions)?p.actions.length:0,n.ogreAgentVoiceEnabled?"voice-on":"voice-off",n.ogreAgentSpeaking?"speaking":"silent",n.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=ek(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",v=>{v.preventDefault(),v.stopPropagation(),vo()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=n.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),s!==null&&o!==null&&y.setSelectionRange(s,o),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const b=t.querySelector("[data-ogre-agent-feed]");b&&(e||d||n.ogreAgentLoading?b.scrollTop=b.scrollHeight:b.scrollTop=Math.min(i,Math.max(0,b.scrollHeight-b.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function fe(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};n.ogreAgentMessages=[...Tn(),t].slice(-50),XS(),t.role==="assistant"&&cm(t.text||"")}function El(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function tk(){if(!El())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=a=>{const r=`${a.name||""} ${a.voiceURI||""}`.toLowerCase(),s=String(a.lang||"").toLowerCase();let o=0;return(/^en[-_]/.test(s)||s==="en")&&(o+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(o+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(o+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(o-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(o-=25),a.localService&&(o+=3),o};return e.slice().sort((a,r)=>t(r)-t(a))[0]||e[0]||null}let An=null;function ak(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!An||An.state==="closed")&&(An=new e),An.state==="suspended"&&An.resume(),An}catch{return null}}function lm(e="reply"){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen)return;const t=ak();if(t)try{const a=t.currentTime,r=e==="online"?.22:.34,s=t.createGain(),o=t.createBiquadFilter(),c=t.createOscillator(),i=t.createOscillator(),d=t.createGain();s.gain.setValueAtTime(1e-4,a),s.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,a+.035),s.gain.exponentialRampToValueAtTime(1e-4,a+r),o.type="lowpass",o.frequency.setValueAtTime(210,a),o.frequency.exponentialRampToValueAtTime(92,a+r),o.Q.setValueAtTime(5.2,a),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,a),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,a+r),i.type="sine",i.frequency.setValueAtTime(e==="online"?45:38,a),i.frequency.exponentialRampToValueAtTime(e==="online"?35:31,a+r),d.gain.setValueAtTime(.18,a),d.gain.exponentialRampToValueAtTime(1e-4,a+r),c.connect(o),o.connect(s),i.connect(d),d.connect(s),s.connect(t.destination),c.start(a),i.start(a),c.stop(a+r+.02),i.stop(a+r+.02)}catch{}}function Ct(e=!1){n.ogreAgentSpeaking=!!e,n.ogreAgentOpen&&E({force:!0})}function bo(){if(!El()){Ct(!1);return}try{window.speechSynthesis.cancel()}catch{}Ct(!1)}function nk(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function cm(e=""){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen||!El()){Ct(!1);return}const t=nk(e);if(!t){Ct(!1);return}try{window.speechSynthesis.cancel();const a=new window.SpeechSynthesisUtterance(t),r=tk();r&&(a.voice=r),a.pitch=.72,a.rate=.86,a.volume=1,a.onstart=()=>Ct(!0),a.onend=()=>Ct(!1),a.onerror=()=>Ct(!1),Ct(!0),lm("reply"),window.speechSynthesis.speak(a)}catch{Ct(!1)}}function rk(e){n.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",n.ogreAgentVoiceEnabled?"on":"off")}catch{}n.ogreAgentVoiceEnabled?(n.ogreAgentStatus="Ogre voice on.",lm("online"),cm("Ogre voice online.")):(bo(),n.ogreAgentStatus="Ogre voice muted."),E({force:!0})}function dm(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function um(){return!!dm()}async function pm(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function mm(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();n.ogreAgentDraft=t;const a=document.querySelector("[data-ogre-agent-input]");if(a){a.value=t;try{a.focus({preventScroll:!0}),a.setSelectionRange(t.length,t.length)}catch{}}}function yo(){ea&&(clearTimeout(ea),ea=null),_a&&(clearTimeout(_a),_a=null)}function fm(e,t=n.ogreAgentSpeechRecognizer){_a&&clearTimeout(_a),_a=setTimeout(()=>{e!==st||n.ogreAgentSpeechRecognizer!==t||Gt("Mic timed out instead of staying open. Tap Mic again or type the command.")},ef)}function Gt(e=""){st+=1,yo();const t=n.ogreAgentSpeechRecognizer;if(n.ogreAgentSpeechRecognizer=null,n.ogreAgentListening=!1,n.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(n.ogreAgentStatus=e),n.ogreAgentOpen&&E({force:!0})}async function sk(){if(!um()){const o=await pm();n.ogreAgentStatus=o==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",E({force:!0});return}n.ogreAgentLoading&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),bo(),Gt();const e=st;n.ogreAgentStatus="Checking microphone permission...",E({force:!0});const t=await pm();if(e!==st||!n.ogreAgentOpen)return;if(t==="denied"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",E({force:!0});return}if(t==="unavailable"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="No microphone is available to this browser. Typing still works.",E({force:!0});return}const a=dm(),r=new a,s=++st;n.ogreAgentSpeechRecognizer=r,n.ogreAgentListening=!0,n.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||n.ogreAgentDraft||"").trim(),n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Opening microphone...",E({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",ea=setTimeout(()=>{s!==st||n.ogreAgentSpeechRecognizer!==r||Gt("Mic did not start. Check browser permission, then tap Mic again.")},Zm),r.onstart=()=>{s!==st||n.ogreAgentSpeechRecognizer!==r||(ea&&(clearTimeout(ea),ea=null),n.ogreAgentListening=!0,n.ogreAgentStatus="Listening... speak your Ogre command.",fm(s,r),E({force:!0}))},r.onresult=o=>{if(s!==st||n.ogreAgentSpeechRecognizer!==r)return;fm(s,r);let c="",i="";for(let u=o.resultIndex||0;u<o.results.length;u+=1){const p=String(o.results[u]?.[0]?.transcript||"");o.results[u]?.isFinal?i+=` ${p}`:c+=` ${p}`}i.trim()&&(n.ogreAgentSpeechFinal=`${n.ogreAgentSpeechFinal||""} ${i}`.replace(/\s+/g," ").trim());const d=[n.ogreAgentSpeechBaseDraft,n.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();mm(d)},r.onerror=o=>{if(s!==st||n.ogreAgentSpeechRecognizer!==r)return;yo();const c=String(o?.error||"");n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",E({force:!0})},r.onend=()=>{if(s!==st||n.ogreAgentSpeechRecognizer!==r)return;yo();const o=String(n.ogreAgentDraft||"").trim(),c=!!(o&&n.ogreAgentSpeechFinal&&!n.ogreAgentLoading);n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",E({force:!0}),c&&setTimeout(()=>{mm(o),yt()},100)};try{r.start()}catch{yo(),n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic could not start. Typing still works.",E({force:!0})}}function ok(){n.ogreAgentListening||n.ogreAgentSpeechRecognizer?Gt("Voice input stopped."):sk()}function vo(){n.ogreAgentOpen=!1,n.ogreAgentStatus="",n.ogreAgentLoading=!1,n.ogreAgentRequestId="",Gt(),bo(),E({force:!0})}function ik(e=""){const[t,a]=String(e).split(":");return Tn()[Number(t)]?.actions?.[Number(a)]||null}function hm(){return Array.isArray(n.wallets)&&n.wallets.length>0}function gm(){return!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.walletPublicKey||n.connectedWalletPublicKey)}function wo(){return!!(!bm()&&(n.ogreAgentAutoTradeApproved||hm()||gm()))}function lk(e="wallet-sync"){return bm()?!1:hm()||gm()?(Wl(!0),!0):(Fl(),!1)}function bm(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Fl(){n.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function Wl(e,t={}){n.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),n.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function ym(e){n.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",n.ogreAgentFastMode?"on":"off")}catch{}}function Lt(e=""){const t=String(e||"").toLowerCase(),a=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),s=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return a?"buy":r||s?"sell":""}function ck(e=""){const t=String(e||"").toLowerCase(),a=Lt(t);if(!a||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),s=a==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),o=!!(jt()||n.smartChartToken||n.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||a==="buy"&&o&&/\b(just\s+)?buy\b/.test(t);return!!(s&&c&&!r)}function dk(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return a?Number(a):0}function _l(){const e=typeof pt=="function"?pt():null,t=Number(n.quickBuyAmountOverride||(typeof ze=="function"?ze(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function uk(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=s?Math.round(Number(s)*100):0,c=[];return a&&c.push(`TP +${a}%`),r&&c.push(`SL -${r}%`),s&&c.push(`slippage ${s}%`),{takeProfitPct:a,stopLossPct:r,slippagePct:s,slippageBps:Number.isFinite(o)&&o>0?o:0,summary:c.join(" / ")}}function pk(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(\d{1,3})\s*%/)||[])[1];return a||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function mk(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function fk(){const e=[],t=(r={})=>{const s=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();s&&e.push({tokenMint:s,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};n.smartChartToken&&t({tokenMint:n.smartChartToken,symbol:n.smartChartTokenSymbol}),n.tradeToken&&t({tokenMint:n.tradeToken,symbol:n.tradeTokenSymbol}),[n.livePairRows,n.slimeScopeRows,n.watchlist,n.positions,n.portfolioRows,n.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const a=new Set;return e.filter(r=>{const s=r.tokenMint.toLowerCase();return a.has(s)?!1:(a.add(s),!0)})}function hk(e=""){const t=String(e||"").trim(),a=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(a)return a;const r=t.toLowerCase();return fk().map(o=>{const c=o.symbol.toLowerCase(),i=o.name.toLowerCase();let d=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(d+=12+c.length),i&&r.includes(i)&&(d+=8+Math.min(16,i.length)),{...o,score:d}}).filter(o=>o.score>0).sort((o,c)=>c.score-o.score)[0]?.tokenMint||""}function So(e={},t=""){const a={...e},r=Lt(t);if(!a.tokenMint&&!a.mint&&!a.ca){const s=hk(t)||jt()||n.smartChartToken||n.tradeToken;s&&(a.tokenMint=s)}if(a.type==="confirm_buy"||r==="buy"){if(a.type=a.type||"confirm_buy",!a.amountSol){const o=dk(t)||_l();o>0&&(a.amountSol=o)}const s=uk(t);if(s.takeProfitPct&&!a.takeProfitPct&&(a.takeProfitPct=s.takeProfitPct),s.stopLossPct&&!a.stopLossPct&&(a.stopLossPct=s.stopLossPct),s.slippageBps&&!a.slippageBps&&(a.slippageBps=s.slippageBps),a.walletIndex===void 0){const o=mk(t);o!==void 0&&(a.walletIndex=o)}}return(a.type==="confirm_sell"||r==="sell")&&(a.type=a.type||"confirm_sell",a.percent=a.percent||pk(t)),a}function vm(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function wm(e={},t=""){if(!n.ogreAgentFastMode||!wo()||e.requiresReview||e.conditional)return!1;const a=Lt(t);return a?a==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:a==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function Xt(e={}){const t=String(e.type||""),a=String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||jt()||"").trim();if(t==="toggle_agent_fast_mode"){ym(!n.ogreAgentFastMode),n.ogreAgentStatus=n.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",fe({role:"assistant",text:n.ogreAgentStatus,actions:[{label:n.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),E();return}if(t==="approve_agent_auto_trade"){Wl(!0),ym(!0),n.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",fe({role:"assistant",text:`${n.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),E();return}if(t==="revoke_agent_auto_trade"){Wl(!1,{revoked:!0}),n.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",fe({role:"assistant",text:n.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),E();return}if(t==="open_tab"){n.route="terminal",n.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!a){n.ogreAgentStatus="Paste a token CA in the message first.",E();return}Tt(ve(a,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){n.route="terminal",n.activeTab="positions",window.history.pushState({},"","/terminal"),n.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){ne(()=>kt({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Wallet refresh started.",E();return}if(t==="refresh_feeds"){ne(()=>en({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Feed refresh started.",E();return}if(t==="open_wallet_connect"){ma({returnPath:"/terminal"}),n.ogreAgentStatus="Wallet connect opened.",E();return}if(t==="start_clip_recording"){bd(),n.ogreAgentStatus="REC started from Ogre Agent.",E();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim();if(!r){n.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",E();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(n.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),mn(ve(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),n.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",E();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||n.smartChartToken||n.tradeToken||jt()||"").trim(),s=Number(e.amountSol||e.sol||e.amount||_l()||0);if(!r||!Number.isFinite(s)||s<=0){r&&mn(ve(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),n.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",E();return}const o=e.walletIndex!==void 0?e.walletIndex:ie()?.publicKey?"connected":n.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;n.ogreAgentLoading=!0,n.ogreAgentStatus=`Sending ${s} SOL buy request...`,E();try{const i=await pr({tokenMint:r,walletIndex:o,amountSol:s,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});n.ogreAgentStatus=i?.ok===!1?i.error||i.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${vm(e)}`,typeof kt=="function"&&kt({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(i){n.ogreAgentStatus=i?.message||"Buy failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim(),s=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){n.activeTab="positions",n.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}n.ogreAgentLoading=!0,n.ogreAgentStatus=`Preparing sell ${s}%...`,E();try{await Us(r,s,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),n.ogreAgentStatus=`Sell ${s}% submitted. Refreshing wallet and positions in the background.`,typeof kt=="function"&&kt({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(o){n.ogreAgentStatus=o?.message||"Sell failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){n.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",E();return}window.open(r,"_blank","noopener,noreferrer"),n.ogreAgentStatus="Opened trusted coin link.",E();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=go(String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||jt()||"").trim());if(!r){n.ogreAgentStatus="Paste a token CA and ask me to check it.",E();return}const s=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};n.ogreAgentLoading=!0,n.ogreAgentStatus="Checking coin details...",E();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},i=c.symbol||c.baseSymbol||S(r),d=c.name||c.baseName||"Token",u=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,p=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",b=c.telegramUrl||c.links?.telegram||"",v=s(c.liquidityUsd||c.liquidity?.usd),P=s(c.marketCap||c.fdv||c.marketCapUsd),A=s(c.volume24h||c.volume?.h24||c.volume?.m5),g=[`${i} breakdown`,`${d} | ${S(r)}`,`MC/FDV: ${P} | Liquidity: ${v} | Volume: ${A}`,`Socials: X ${y?"found":"not returned"} | Telegram ${b?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],T=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:u}];p&&T.push({label:"Pump",type:"open_external",url:p}),f&&T.push({label:"Website",type:"open_external",url:f}),y&&T.push({label:"X",type:"open_external",url:y}),b&&T.push({label:"Telegram",type:"open_external",url:b}),fe({role:"assistant",text:g.join(`
`),actions:T}),n.ogreAgentStatus="Coin breakdown ready."}catch(o){fe({role:"assistant",text:`I could not pull live metadata for ${S(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),n.ogreAgentStatus=o?.message||"Coin check delayed."}finally{n.ogreAgentLoading=!1,E()}return}n.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",E()}function gk(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function Dl(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function Sm(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function bk(e="",t=[]){const a=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(s=>String(s||"").trim()).filter((s,o,c)=>s&&c.findIndex(i=>i.toLowerCase()===s.toLowerCase())===o).slice(0,4),r=a.length?a.map(s=>`"${s.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function yk(e=""){if(!Sm(e))return null;const t=go(Dl(e)||jt()||n.smartChartToken||n.tradeToken||"");return t?{text:[`${S(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:bk(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function vk(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function wk(e=""){if(!vk(e))return null;const t=om().slice(0,4),a=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((o,c)=>{const i=o.symbol||S(o.tokenMint),d=Number.isFinite(Number(o.ageMinutes))?`${Math.max(0,Math.round(Number(o.ageMinutes)))}m old`:"age n/a",u=o.twitterUrl||o.telegramUrl||o.websiteUrl?"socials found":"socials not returned",p=Array.isArray(o.riskFlags)&&o.riskFlags.length?`risk: ${o.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${i} ${S(o.tokenMint)} | MC ${a(o.marketCap)} | Liq ${a(o.liquidityUsd)} | Vol ${a(o.volume5m||o.volume1h)} | ${d} | ${u} | ${p}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],s=t[0];return{text:r.join(`
`),actions:[s?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:s.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const Sk=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],kk=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function $k(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||Dl(e)||Lt(e))return null;const a=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(a){const s=wr(a[1]);if(s)return n.quickBuyAmountOverride=s,ls({quickBuy:s}),eo(),{text:`Quick buy set to ${s} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return ls({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return ls({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=kk.test(t);for(const[s,o]of Sk)for(const c of o){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${Tk(s)} now.${s==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:s},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function Tk(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const Ak={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function km(e){n.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},ko()}function Re(e,t="ok",a=""){if(!n.tradeTrace||n.tradeTrace.done&&t==="pending")return;const r=n.tradeTrace.steps,s=r.find(i=>i.key===e),o=s||{key:e,label:Ak[e]||e};if(o.status=t,o.detail=String(a||"").slice(0,140),s||r.push(o),t==="fail"&&(n.tradeTrace.done=!0),ko(),t==="fail")return;r.length>=3&&r.every(i=>i.status==="ok")&&(n.tradeTrace.done=!0,window.setTimeout(()=>{n.tradeTrace?.done&&!n.tradeTrace.steps.some(i=>i.status==="fail")&&(n.tradeTrace=null,ko())},8e3))}function ko(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=n.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const a=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
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
  `}async function yt(e=""){const t=document.querySelector("[data-ogre-agent-input]"),a=String(e||t?.value||"").trim();if(!a||n.ogreAgentLoading)return;const r=Dl(a);if(r&&go(r),t&&(t.value=""),n.ogreAgentDraft="",fe({role:"user",text:a,actions:[]}),ck(a)){const i=Lt(a),d=So({type:i==="buy"?"confirm_buy":"confirm_sell"},a),u=String(d.tokenMint||d.mint||d.ca||"").trim(),p=Number(d.amountSol||d.sol||d.amount||0);if(!u){fe({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),n.ogreAgentStatus="Need token CA.",E({force:!0});return}if(i==="buy"&&(!Number.isFinite(p)||p<=0)){fe({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:u},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),n.ogreAgentStatus="Need buy amount.",E({force:!0});return}if(!wo()){fe({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),n.ogreAgentStatus="Wallet session needed.",E({force:!0});return}fe({role:"assistant",text:i==="buy"?`Sending ${p} SOL buy for ${S(u)}.${vm(d)}`:`Sending sell request for ${S(u)}${d.percent?` at ${d.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:u}]}),n.ogreAgentStatus="Fast Mode: sending trade request...",E({force:!0}),await Xt(d);return}const s=$k(a);if(s){fe({role:"assistant",text:s.text,actions:s.actions||[]}),n.ogreAgentStatus="Instant local reply.",E({force:!0}),s.run&&await Xt(s.run);return}n.ogreAgentLoading=!0,n.ogreAgentStatus="",se("chatRequestStarted");const o=`${Date.now()}:${Math.random().toString(16).slice(2)}`;n.ogreAgentRequestId=o;const c=setTimeout(()=>{n.ogreAgentRequestId!==o||!n.ogreAgentLoading||(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Agent reply timed out.",se("chatRequestTimedOut"),fe({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:a,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),E({force:!0}))},7500);E();try{const i=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:a,context:JS()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(n.ogreAgentRequestId!==o)return;const d=(i?.agent?.actions||[]).map(v=>So(v,a));i?.agent?.tokenMint&&go(i.agent.tokenMint),fe({role:"assistant",text:i?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:d}),se("chatRequestSucceeded");const u=!!(i?.agent?.coinEnriched||i?.agent?.tokenMint||i?.agent?.socialLinks||i?.agent?.socialScan),f=!Sm(a)&&!u&&!Lt(a)&&gk(a)?d.find(v=>v.type==="coin_breakdown"||v.type==="analyze_coin")||So({type:"coin_breakdown"},a):null;if(f?.tokenMint||f?.mint||f?.ca){n.ogreAgentStatus="Checking coin now...",await Xt(f);return}const y=So({type:Lt(a)==="buy"?"confirm_buy":Lt(a)==="sell"?"confirm_sell":""},a);if(Lt(a)&&n.ogreAgentFastMode&&!wo()){fe({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),n.ogreAgentStatus="Auto-Trade approval needed once.";return}const b=d.find(v=>wm(v,a))||(wm(y,a)?y:null);if(b){n.ogreAgentStatus="Fast Mode: sending trade request...",await Xt(b);return}n.ogreAgentStatus=i?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(i){if(n.ogreAgentRequestId!==o)return;const d=yk(a);if(d){fe({role:"assistant",text:d.text,actions:d.actions}),n.ogreAgentStatus="Fast local X/KOL fallback.";return}const u=wk(a);if(u){fe({role:"assistant",text:u.text,actions:u.actions}),n.ogreAgentStatus="Fast local trend scan.";return}fe({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:a,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),se("chatRequestFailed"),n.ogreAgentStatus=i?.message||"Agent reply failed."}finally{clearTimeout(c),n.ogreAgentRequestId===o&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,E())}}function F(e,t){return`<article class="empty"><h3>${l(e)}</h3><p>${l(t)}</p></article>`}function l(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Te(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function Pk(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function $m(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const a=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");a&&(e.preventDefault(),Pk(a),Cc({connectPanel:a.matches("[data-connect-login-toggle]")||n.route==="connect",source:a.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(Uf(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),yt();return}const a=e.target?.closest?.("[data-global-token-search]");if(a&&e.key==="Enter"){e.preventDefault(),ju(a.value||"");return}if(e.key==="Escape"){if(n.ogreAgentOpen){vo();return}if(n.slimeShieldDetails?.open){wl();return}if(n.kolDumpDetails?.open){Gi();return}if(n.replayDetails?.open){Al();return}if(n.protectedBuyModal?.open){Ds();return}if(!(!n.loginModalOpen&&!n.quickBuyModal?.open)){if(n.quickBuyModal?.open){rl();return}Ac()}}});function Nl(e=null,t="interaction"){const a=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!a)return!1;const r=a.dataset.tokenTrade||a.dataset.tokenChart||a.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),i=Number(n.smartChartInteractionPrefetchAt||0),d=n.smartChartInteractionPrefetchSeen||{};if(i&&c-i<Gv||Number(d[r]||0)&&c-Number(d[r])<Yv)return!1;const u=(n.smartChartInteractionPrefetchRecent||[]).filter(p=>c-Number(p||0)<Xv);if(u.length>=Jv)return n.smartChartInteractionPrefetchRecent=u,!1;n.smartChartInteractionPrefetchAt=c,n.smartChartInteractionPrefetchRecent=[...u,c],n.smartChartInteractionPrefetchSeen={...d,[r]:c}}return ul(ve(r,{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t}),{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{Nl(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{Nl(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{Nl(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const Tm=new WeakMap;function Ck(e){let t=Tm.get(e);if(!t){const a=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(a.overflowY),contained:/contain|none/.test(a.overscrollBehaviorY)},Tm.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||n.route!=="terminal"||ar())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const a=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const o=Ck(t);if(o.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,i=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(a<0&&c||a>0&&i)||o.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let s=e.deltaY;e.deltaMode===1?s*=40:e.deltaMode===2&&(s*=r.clientHeight),r.scrollTop+=s,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),wl();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),Ds();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),Gi();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),Al();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const g=c.closest(".nav-tool-group");n.navTekOpen=!g?.open,mf(n.navTekOpen),g&&(g.open=n.navTekOpen);return}const i=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token], [data-dev-info], [data-quick-bundle-token], [data-watch-token], [data-unwatch-token], [data-share-x]");if(!i)return;if(i.tagName==="A"){const g=i.getAttribute("href")||"",T=/^https?:\/\//i.test(g)&&!g.startsWith(window.location.origin),C=!!(window.matchMedia?.("(display-mode: standalone)")?.matches||window.navigator?.standalone);if(T&&(i.getAttribute("target")==="_blank"||C)){e.preventDefault();try{window.open(g,"_blank","noopener,noreferrer")}catch{window.location.href=g}return}}if(i.matches("[data-tool-section]")){e.preventDefault();const g=i.dataset.toolSection,[T]=g.split(":"),C=g.slice(T.length+1);n.toolSections={...n.toolSections||{},[T]:C};const B=i.closest("[data-tool-panels]");B&&(B.querySelectorAll(`[data-tool-section^="${T}:"]`).forEach(U=>{U.dataset.active=U.dataset.toolSection===g?"true":"false"}),B.querySelectorAll(`[data-tool-panel^="${T}:"]`).forEach(U=>{U.hidden=U.dataset.toolPanel!==g}),vs(B));return}if(i.matches("[data-clip-record]")){e.preventDefault(),n.clipFarm?.recording?tr():bd();return}if(i.matches("[data-clip-share]")){e.preventDefault(),Rh();return}if(i.matches("[data-clip-download]")){e.preventDefault(),Ih();return}if(i.matches("[data-clip-clear]")){e.preventDefault(),Ai();return}if(i.matches("[data-slimeshield-tab]")){e.preventDefault();const g=i.dataset.slimeshieldTab||"verdict";n.slimeShieldTab=g;const T=i.closest(".dossier-drawer");T&&(T.setAttribute("data-active-pane",g),T.querySelectorAll("[data-slimeshield-tab]").forEach(C=>{C.dataset.active=C.dataset.slimeshieldTab===g?"true":"false"}));return}if(i.matches("[data-slimeshield-details]")){e.preventDefault(),i.closest("[data-dev-info-drawer-root]")&&Sl(),Ip(i.dataset.slimeshieldDetails||"");return}if(i.matches("[data-slimeshield-refresh]")){e.preventDefault(),to(i.dataset.slimeshieldRefresh||"",{force:!0});return}if(i.matches("[data-kol-dump-details]")){e.preventDefault(),cy(i.dataset.kolDumpDetails||"");return}if(i.matches("[data-kol-dump-refresh]")){e.preventDefault(),ji({force:!0});return}if(i.matches("[data-replay-open]")){e.preventDefault(),aS(i.dataset.replayOpen||"");return}if(i.matches("[data-replay-refresh]")){e.preventDefault(),Tl(i.dataset.replayRefresh||"",{force:!0});return}if(i.matches("[data-ogre-agent-toggle]")){n.ogreAgentOpen?vo():(n.ogreAgentOpen=!0,Qh(),E({force:!0}));return}if(i.matches("[data-ogre-agent-close]")){vo();return}if(i.matches("[data-ogre-agent-voice]")){rk(!n.ogreAgentVoiceEnabled);return}if(i.matches("[data-ogre-agent-send]")){Gt(),yt();return}if(i.matches("[data-ogre-agent-mic]")){ok();return}if(i.matches("[data-ogre-agent-quick]")){const g=i.dataset.ogreAgentQuick||"";if(g==="positions"&&Xt({type:"open_tab",tab:"positions"}),g==="whats_cooking"&&yt("whats cooking"),g==="my_bags"&&yt("how are my bags"),g==="refresh_feeds"&&Xt({type:"refresh_feeds"}),g==="risk"&&yt("Why is this token risky?"),g==="dev_info"&&yt("Explain Dev Info for this token."),g==="protected_buy"&&yt("Should I use Protected Buy?"),g==="replay"&&yt("Replay similar launches for this token."),g==="auto_trade"&&Xt({type:"approve_agent_auto_trade"}),g==="clear_chat"){Gt(),bo(),n.ogreAgentMessages=[sm()],n.ogreAgentStatus="Chat cleared.",n.ogreAgentDraft="",n.ogreAgentLastTokenMint="";try{localStorage.removeItem(Il),localStorage.removeItem(Ol)}catch{}E({force:!0})}return}if(i.matches("[data-ogre-agent-retry]")){const g=Number(i.dataset.ogreAgentRetry),T=String(n.ogreAgentMessages?.[g]?.retryText||"").trim();T&&yt(T);return}if(i.matches("[data-ogre-agent-action]")){const g=i.dataset.ogreAgentAction,C=ik(g)||(n.ogreAgentMessages||[]).flatMap(B=>Array.isArray(B.actions)?B.actions:[]).find(B=>B.key===g||B.label===g||B.type===g);Xt(C||{type:g});return}if(i.matches("[data-nav-route]")){e.preventDefault(),Pe(i.dataset.navRoute||"/terminal",i.dataset.tab||null);return}if(i.matches("[data-policy]")){e.preventDefault(),window.alert(Wf(i.dataset.policy==="privacy"?"privacy":"terms"));return}if(i.matches("[data-top-wallet-connect]")){e.preventDefault(),i.dataset.walletState==="connected"||!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length)?Pe("/terminal","wallets"):ma({returnPath:"/terminal"});return}if(i.matches("[data-top-wallet-status]")){e.preventDefault(),await Nh();return}if(i.matches("[data-top-refresh-wallet]")){const g=L();Xa("clicked",{startedAt:g}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-g,details:"top-refresh-wallet"}),kt({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{Sy()&&ne(()=>Ji())}).catch(T=>$(T.message));return}if(i.matches("[data-ogre-tek-refresh]")){await xr({force:!0}).catch(g=>$(g.message));return}if(i.matches("[data-ogre-ai-start]")){ne(()=>av());return}const d=i.closest?.("[data-ogre-cat]");if(d){e.preventDefault(),n.ogreAiCategory=d.dataset.ogreCat||"strong",h({force:!0});return}if(i.closest?.("[data-autopilot-save]")){e.preventDefault(),ne(()=>sv());return}if(i.matches("[data-ogre-tek-market]")){n.ogreTek.selectedMarket=i.dataset.ogreTekMarket||n.ogreTek.selectedMarket,n.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-side]")){n.ogreTek.direction=i.dataset.ogreTekSide==="short"?"short":"long",n.ogreTek.reviewOpen=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-review]")){ho(),n.ogreTek.reviewOpen=!0,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-close-review]")){n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(i.matches("[data-ogre-tek-confirm-review]")){ho();const g=am();!n.ogreTek.riskAccepted||!g.ok?n.ogreTek.status="Risk confirmation is incomplete.":Ae.demoMode?(n.ogreTek.status="Demo review confirmed. No live transaction was submitted.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1):(n.ogreTek.status="Live perps adapter is not wired in this build.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1),h({force:!0});return}if(i.matches("[data-ogre-tek-demo-action]")){const g=i.dataset.ogreTekDemoAction||"action";n.ogreTek.status=`Demo mode: ${g.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(i.matches("[data-toggle-terminal-ticket]")){n.terminalTradeCollapsed=!n.terminalTradeCollapsed,h({force:!0});return}if(i.matches("[data-global-token-open]")){const g=m("[data-global-token-search]")?.value?.trim()||"";g&&ju(g);return}if(i.matches("[data-token-chart]")){e.preventDefault();const g=i.dataset.tokenChart||i.dataset.previewToken||"";Tt(ve(i.dataset.tokenChart||i.dataset.previewToken||"",{source:i.dataset.tokenChartSource||"token-card"}),{defaultTab:i.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!i.closest?.(".live-pair-avatar"),source:i.dataset.tokenChartSource||"token-card"});return}if(i.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const g=i.dataset.tokenTrade||"",T=fn(g);T&&Ks(T)&&$("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),Tt(ve(i.dataset.tokenTrade||"",{source:i.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:i.dataset.tokenTradeSource||"trade-button"});return}if(i.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),mn(ve(i.dataset.quickBuyToken||"",{source:i.dataset.quickBuySource||"quick-buy-button"}),{source:i.dataset.quickBuySource||"quick-buy-button"});return}if(i.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),i.closest("[data-dev-info-drawer-root]")&&Sl();const g=i.dataset.protectedBuySource||"protected-buy",T=!!i.closest("[data-quick-buy-modal-root]"),C=!!i.closest(".chart-trade-panel"),B=i.dataset.protectedBuyOpen||n.quickBuyModal?.tokenMint||n.smartChartToken||n.tradeToken||"";hv(ve(B,{source:g}),{source:g,presetId:i.dataset.protectedBuyPreset||"",amountSol:T?m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||"":C&&m("[data-chart-buy-amount]")?.value||"",walletIndex:T?m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"":C&&m("[data-chart-buy-wallet]")?.value||"",slippageBps:T?m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400":C&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-quick-buy-close]")){e.preventDefault(),rl();return}if(i.matches("[data-protected-buy-close]")){e.preventDefault(),Ds();return}if(i.matches("[data-protected-buy-confirm]")){e.preventDefault(),ne(()=>yv());return}if(i.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),n.quickBuyModal={...n.quickBuyModal,amountSol:i.dataset.quickBuyModalPreset||"",status:`${i.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(i.matches("[data-quick-buy-confirm]")){e.preventDefault(),ne(()=>Sv());return}if(i.matches("[data-preview-token]")){const g=i.dataset.previewToken||"";g&&Tt(ve(g,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(i.matches("[data-terminal-subtab]")){n.terminalSubtab=i.dataset.terminalSubtab||"positions",h();return}if(i.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await Us(i.dataset.positionSell||"",i.dataset.positionSellPercent||"100",{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const g=await We({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});g&&await Us(i.dataset.positionSellCustom||"",g,{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(i.matches("[data-run-tx-audit]")){e.preventDefault(),ne(()=>kv());return}if(i.matches("[data-connect-login-toggle]")){$m(i)||Lc({connectPanel:!0,source:"connect-lock-in"});return}if(i.matches("[data-login-tab]")){n.loginModalTab=i.dataset.loginTab==="create"?"create":"login",h({force:!0}),Tc(!1);return}if(i.matches("[data-connect-password-login]")){await _c();return}if(i.matches("[data-send-email-code]")){await eh();return}if(i.matches("[data-web-code-login]")){await th();return}if(i.matches("[data-connect-create-account]")){await ui();return}if(i.matches("[data-connect-create-wallet]")){await oh();return}if(i.matches("[data-web-signup]")&&await ui(),i.matches("[data-web-password-login]")&&await _c(),i.matches("[data-close-login]")){Ac();return}if(i.matches("[data-web-signup-connect]")){await sh();return}if(i.matches("[data-open-login]")){$m(i)||Lc({connectPanel:n.route==="connect",source:"top-lock-in"});return}if(i.matches("[data-browse-guest]")){n.loginCollapsed=!0,n.route="terminal",n.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Zr("browse-terminal");return}if(i.matches("[data-logout]")&&await ih(),i.matches("[data-connect-x]")&&await Iy(),i.matches("[data-open-x-login]")&&Oy(),i.matches("[data-clear-x]")&&await Ey(),i.matches("[data-save-login-credentials]")&&await Dy(),i.matches("[data-save-referral]")&&await Yu(),i.matches("[data-generate-referral-code]")&&await Yu({generate:!0}),i.matches("[data-save-trader-board]")&&await Cv(),i.matches("[data-use-x-avatar]")&&await _y(),i.matches("[data-clear-avatar]")&&await Bs({clear:!0},"Removing PFP..."),i.matches("[data-preset-avatar]")){const g=m("[data-avatar-status]");w(g,"Loading preset PFP...");try{const T=await Wy(i.dataset.presetAvatar);await Bs({avatarDataUrl:T,avatarSource:i.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch(T){w(g,T.message),$(T.message)}}if(i.matches("[data-launch-coin-save]")){or();return}if(i.matches("[data-launch-coin-submit]")){await ny();return}if(i.matches("[data-launch-coin-use-ca]")){await Zb();return}if(i.matches("[data-connect-wallet]")){const g=i.dataset.connectWallet||"solana";if(g&&g!=="solana"){await xu(g,{returnPath:"/terminal"});return}ma({returnPath:"/terminal"});return}if(i.matches("[data-connect-wallet-provider]")){await xu(i.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(i.matches("[data-wallet-connect-close]")){n.walletConnectMenuOpen=!1,h({force:!0});return}if(i.matches("[data-wallet-fast-approvals-toggle]")){yg(!n.walletFastApprovalsEnabled),$(n.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(i.matches("[data-disconnect-wallet]")){await Mu();return}if(i.matches("[data-share-x]")&&Qi(i.dataset.shareText||""),i.matches("[data-share-watch-token-btn]")&&Bu("token"),i.matches("[data-share-watch-kol-btn]")&&Bu("kol"),i.matches("[data-save-preset]")){await Xu(i.dataset.savePreset);return}if(i.matches("[data-save-fast-preset]")){await Xu(i.dataset.saveFastPreset,"fast");return}if(i.matches("[data-use-preset]")){Av(i.dataset.usePreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-preset]")){Ju(i.dataset.editPreset,i.dataset.presetId||"");return}if(i.matches("[data-edit-selected-preset]")){const g=i.dataset.editSelectedPreset==="bundle"?"bundle":"trade",T=g==="bundle"?n.selectedBundlePresetId:n.selectedTradePresetId;T&&T!=="custom"?Ju(g,T):Pl(g);return}if(i.matches("[data-cancel-preset-edit]")){bs(i.dataset.cancelPresetEdit,""),h();return}if(i.matches("[data-delete-preset]")){await Pv(i.dataset.deletePreset,i.dataset.presetId||"");return}if(i.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),mn(ve(i.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(i.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),ne(()=>Gu(i.dataset.quickBundleToken||""));return}if(i.matches("[data-smart-chart-token]")){Tt(ve(i.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(i.matches("[data-smart-chart-view]")){const g=i.dataset.smartChartView||"chart";n.smartChartView=["chart","chartTxns","txns","info"].includes(g)?g:"chart",h();return}if(i.matches("[data-chart-trade-tab]")){n.chartTradeTab=i.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),n.chartTradeTab==="buy"&&requestAnimationFrame(()=>m("[data-chart-buy-amount]")?.focus());return}if(i.matches("[data-chart-buy-preset]")){const g=m("[data-chart-buy-amount]");g&&(g.value=i.dataset.chartBuyPreset||""),n.quickBuyAmountOverride=X(i.dataset.chartBuyPreset||""),eo();return}if(i.matches("[data-chart-confirm-buy]")){const g=i.dataset.chartConfirmBuy||n.smartChartToken||"";e.preventDefault(),e.stopPropagation();const T=m("[data-chart-buy-wallet]")?.value||"";if(pe(T)){try{i.dataset.actionState="clicked",i.disabled=!0,await wv(g)}catch(C){const B=D(C.message||"Chart buy failed."),U=X(m("[data-chart-buy-amount]")?.value||"")||"custom";z("trade-buy",g,String(U),{state:"error",error:B}),Le("trade-buy",g,String(U),4e3),De(B),$(B),ue()}return}De("Buy queued. Opening wallet approval..."),i.dataset.actionState="clicked",i.disabled=!0,ne(async()=>{try{const C=Uu();await pr({tokenMint:g,walletIndex:T,amountSol:X(m("[data-chart-buy-amount]")?.value||""),slippageBps:m("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:C.takeProfitPct,stopLossPct:C.stopLossPct,sellDelay:C.sellDelay,sellPercent:C.sellPercent,source:"chart-buy-panel"}),n.chartTradeTab="buy",De("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(C){const B=D(C.message||"Chart buy failed.");De(B),$(B),h({force:!0,preserveSmartChartFrame:!0})}});return}if(i.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const g=m("[data-chart-sell-percent]")?.value||"";if(g)try{await Us(i.dataset.chartConfirmSell||"",g,{slippageBps:m("[data-chart-buy-slippage]")?.value||"400"})}catch(T){const C=D(T.message||"Chart sell failed.");De(C),$(C)}return}if(i.matches("[data-smart-chart-open]")){const g=String(m("[data-smart-chart-input]")?.value||"").trim();if(!g){$("Paste a token CA first.");return}Tt(ve(g,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(i.matches("[data-refresh-feeds]")){ne(()=>en({force:!0,reason:"manual-refresh-feeds"}));return}if(i.matches("[data-terminal-load-more]")){const g=i.dataset.terminalLoadMore||n.activeTab;uh(g,_t(g)),Yc(g,{requestId:j(g).lastRequestId||"",status:j(g).lastStatus||"render",reason:"load-more",resultCount:_t(g),renderedCount:zn(g),hasMore:_t(g)>zn(g),stale:jn(g),errorCode:j(g).errorCode||"",errorMessage:j(g).errorMessage||""}),h({force:!0});return}if(i.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),_w(i.dataset.devInfo||"");return}if(i.matches("[data-return-dismiss]")){e.preventDefault(),Uw();return}if(i.matches("[data-watchlist-tag]")){e.preventDefault(),n.watchlistTagFilter=i.dataset.watchlistTag||"",h();return}if(i.matches("[data-watchlist-edit]")){e.preventDefault(),Jw(i.dataset.watchlistEdit||"",i.dataset.watchlistSymbol||"");return}if(i.matches("[data-watchlist-edit-close]")){e.preventDefault(),Yw();return}if(i.matches("[data-watchlist-meta-save]")){e.preventDefault(),Qw();return}if(i.matches("[data-radar-open]")){e.preventDefault(),Kw(i.dataset.radarOpen||"",i.dataset.radarSymbol||"");return}if(i.matches("[data-radar-close]")){Vw();return}if(i.matches("[data-radar-scope]")){e.preventDefault(),n.radarDrawer={...n.radarDrawer||{},scope:i.dataset.radarScope||"token"},rt();return}if(i.matches("[data-radar-submit]")){e.preventDefault(),jw();return}if(i.matches("[data-radar-toggle]")){e.preventDefault(),_p("toggle",i.dataset.radarToggle||"");return}if(i.matches("[data-radar-remove]")){e.preventDefault(),_p("remove",i.dataset.radarRemove||"");return}if(i.matches("[data-dev-info-tab]")){e.preventDefault();const g=i.dataset.devInfoTab||"overview";n.devInfoTab=g;const T=i.closest(".dossier-drawer");T&&(T.setAttribute("data-active-pane",g),T.querySelectorAll("[data-dev-info-tab]").forEach(C=>{C.dataset.active=C.dataset.devInfoTab===g?"true":"false"}));return}if(i.matches("[data-dev-info-close]")){Sl();return}if(i.matches("[data-dev-info-refresh]")){const g=i.dataset.devInfoRefresh||n.devInfoDetails?.tokenMint||"";await Wp(g,{force:!0});return}if(i.matches("[data-watch-token]")&&await Qu("add",i),i.matches("[data-unwatch-token]")&&await Qu("remove",i),i.matches("[data-pnl-card]"))try{await Iu(i.dataset.pnlCard)}catch(g){$(g.message)}if(i.matches("[data-share-pnl-card]")&&await Ny(i.dataset.sharePnlCard,i.dataset.shareText||""),i.matches("[data-scan-bags]")){await Hv();return}if(i.matches("[data-arm-exits]")){await qv(i.dataset.armExits,i);return}if(i.matches("[data-dev-watch]")){await Uv(i.dataset.devWatch);return}if(i.matches("[data-hype-create]")){await zb();return}if(i.matches("[data-push-enable]")){await lg();return}if(i.matches("[data-push-disable]")){await cg();return}if(i.matches("[data-call-post]")){await uS(i.dataset.callPost);return}if(i.matches("[data-telegram-link]")){await og();return}if(i.matches("[data-trade-trace-close]")){n.tradeTrace=null,ko();return}if(i.matches("[data-launch-kit-close]")){n.launchShareKit=null,h();return}if(i.matches("[data-create-wallets]")&&await Cu(),i.matches("[data-distribute-fresh]")){await xb();return}if(i.matches("[data-return-funds]")){await Lb();return}if(i.matches("[data-sweep-background-wallets]")){await Iv();return}if(i.matches("[data-create-automation-wallet]")&&await gy(),i.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await vy(i);return}if(i.matches("[data-tpsl-status-button]")){i.dataset.tpslState==="enabled"?(n.activeTab="profile",Pe("/terminal","profile"),n.automationDelegationStatus=n.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await Xi("enable");return}if(i.matches("[data-automation-permission]")&&await Xi(i.dataset.automationPermission||"enable"),i.matches("[data-run-trade-plans]")&&await Ji(),i.matches("[data-restore-backup]")&&await Ty(),i.matches("[data-export-backup]")&&await Ay(),i.matches("[data-import-wallet]")&&await Py(),i.matches("[data-remove-wallet]")&&await Cy(i.dataset.removeWallet||"",i.dataset.walletLabel||"",i.dataset.removeWalletKey||""),i.matches("[data-wallet-sweep-action]")&&await By(i.dataset.walletSweepAction||""),i.matches("[data-download]")){const g=n.downloads?.[i.dataset.download];g&&be(g.filename,g.text)}if(i.matches("[data-trade-buy-quick]")&&await Os(i.dataset.tradeBuyQuick),i.closest?.("[data-swap-reverse]")){n.swapDirection=n.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(i.matches("[data-swap-use-custom-amount]")){const g=String(m("[data-swap-amount]")?.value||"").trim();n.swapDirection==="sell"?await el(g||"100"):await Os(g);return}i.matches("[data-trade-buy-max]")&&await Os(null,"max"),i.matches("[data-trade-buy-custom]")&&await Os(m("[data-buy-custom]")?.value||m("[data-swap-amount]")?.value),i.matches("[data-trade-sell-quick]")&&await el(i.dataset.tradeSellQuick),i.matches("[data-trade-sell-custom]")&&await el(m("[data-sell-custom]")?.value||m("[data-swap-amount]")?.value),i.matches("[data-trade-plan-start]")&&await Jy(),i.matches("[data-volume-start]")&&await Qy();const u=i.closest?.("[data-vbot-set-mode]");if(u){e.preventDefault(),n.slimeBotMode=u.dataset.vbotSetMode||"smart",u.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(g=>{g.dataset.active=String(g===u)});return}const p=i.closest?.("[data-vbot-set-aggr]");if(p){e.preventDefault(),n.slimeBotAggr=p.dataset.vbotSetAggr||"med",p.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(g=>{g.dataset.active=String(g===p)});return}const f=i.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),n.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(g=>{g.dataset.active=String(g===f)});return}if(i.matches("[data-vbot-start]")){e.preventDefault(),await Fb();return}const y=i.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await Wb(y.dataset.vbotStop||"");return}if(i.matches("[data-sniper-buy]")&&await ev(i.dataset.sniperBuy),i.matches("[data-kol-mode]")){n.kolWallet="",n.kolMode=i.dataset.kolMode||n.kolMode,ee("kol"),await te("kol",{force:!0,reason:"kol-mode-switch"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-refresh]")){await te("kol",{force:!0,reason:"manual-kol-refresh"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-wallet-scan]")){if(n.kolWallet=String(m("[data-kol-wallet]")?.value||"").trim(),n.kolWallet&&!Ut(n.kolWallet)){Kt("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),n.kolWallet="";return}ee("kol"),await te("kol",{force:!0,reason:"kol-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-scan-wallet]")){if(n.kolWallet=String(i.dataset.kolScanWallet||"").trim(),n.kolWallet&&!Ut(n.kolWallet)){Kt("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),n.kolWallet="";return}ee("kol"),await te("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(g=>$(g.message));return}if(i.matches("[data-kol-copy-setup]")){const g=String(i.dataset.kolCopySetup||"").trim();if(g&&!Ut(g)){Kt("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}g&&(n.kolWallet=g),n.activeTab="kol",h(),setTimeout(()=>{const T=document.querySelector("[data-kol-management-settings]");T&&(T.open=!0,T.scrollIntoView({behavior:"smooth",block:"start"}));const C=m("[data-kol-wallet]");C&&g&&(C.value=g);const B=m("[data-kol-status]");B&&w(B,`Copy setup loaded for ${S(g)}. Choose presets, then tap Copy Wallet Next Buy.`),m("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(i.matches("[data-kol-copy]")){await lv(i.dataset.kolCopy);return}if(i.matches("[data-kol-copy-wallet]")){const g=String(i.dataset.kolCopyWallet||"").trim();if(g&&!Ut(g)){Kt("That KOL entry does not have a verified Solana wallet yet.");return}await cv(i.dataset.kolCopyWallet||"");return}if(i.matches("[data-kol-trade]")){n.tradeToken=i.dataset.kolTrade||"",n.activeTab="trade",h();return}if(i.matches("[data-kol-bundle]")){n.bundleToken=i.dataset.kolBundle||"",n.activeTab="bundle",h();return}if(i.matches("[data-bundle-buy]")&&await Vu("buy"),i.matches("[data-bundle-sell]")&&await Vu("sell"),i.matches("[data-bundle-plan]")&&await uv(),i.matches("[data-launch-start]")&&await xv(),i.matches("[data-launch-cancel]")&&await Mv(i.dataset.launchCancel),i.matches("[data-use-token]")&&(n.tradeToken=i.dataset.useToken||"",n.volumeToken=i.dataset.useToken||"",n.bundleToken=i.dataset.useToken||"",n.activeTab="trade",h()),i.matches("[data-use-token-bundle]")&&(n.bundleToken=i.dataset.useTokenBundle||"",n.tradeToken=n.bundleToken,n.volumeToken=n.bundleToken,n.activeTab="bundle",h()),i.matches("[data-use-token-volume]")&&(n.volumeToken=i.dataset.useTokenVolume||"",n.tradeToken=n.volumeToken,n.bundleToken=n.volumeToken,n.activeTab="volume",h()),i.matches("[data-refresh-all]")){const g=L();if(Xa("clicked",{startedAt:g}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-g,details:n.activeTab||"terminal"}),!n.user||!n.token)Xe(n.activeTab)?await te(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(T=>$(T.message)):$("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),je("success");else{const T=L();n.activeTab==="positions"?dh({force:!0,reason:"manual-positions-refresh"}).catch(C=>{je("error",{error:D(C?.message||"Position refresh failed")}),$(C.message),h()}):(kt({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(C=>$(C.message)),te(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(C=>$(C.message))),K("position-refresh-request-start",T,{component:"positions",cacheHit:!1,details:n.activeTab||"terminal"})}}if(i.matches("[data-tab]")){const g=L();if(n.activeTab=i.dataset.tab,n.activeTab==="volume"&&Ss(),n.activeTab==="ogreAi"&&nv(),n.activeTab==="ogreTek"){n.route="terminal",window.history.pushState({},"","/ogre-tek"),await xr({silent:!0}).catch(B=>$(B.message)),h();return}n.route!=="terminal"&&(n.route="terminal",window.history.pushState({},"","/terminal")),n.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):n.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const T=Jc(n.activeTab);h();const C=te(n.activeTab,{silent:!0,ifStale:!0,force:!T,reason:"tab-switch"}).catch(B=>$(B.message));T||await C,K("tab-switch",g,{component:"terminal",cacheHit:T,details:n.activeTab})}if(i.matches("[data-refresh-scan]")&&ne(()=>te("sniper",{force:!0,reason:"manual-sniper-refresh"})),i.closest?.("[data-refresh-live-pairs]")){const g=n.activeTab==="slimeScope"?"slimeScope":n.activeTab==="terminal"?"terminal":n.activeTab==="launch"||n.activeTab==="launchCoin"?"launch":"live",C=n.activeTab==="live"||n.activeTab==="terminal"?null:Li();ne(async()=>{await te(g,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),C&&xi(C)})}if(i.closest?.("[data-terminal-filter-toggle]")){const g=Be();g.open=!g.open,h();return}if(i.closest?.("[data-terminal-filter-clear]")){n.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},ee("live"),ee("launch"),ee("sniper"),h();return}i.matches("[data-refresh-watchlist]")&&ne(()=>te("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const v=i.closest?.("[data-live-pair-bucket]");v&&(n.livePairBucket=v.dataset.livePairBucket||"live",n.livePairs=qe(),n.livePairsLastUpdatedAt=ua(),ee("live"),ee("slimeScope"),h(),ne(()=>te(n.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=i.closest?.("[data-slime-scope-mode]");P&&(n.slimeScopeMode=P.dataset.slimeScopeMode||"new",n.activeTab="slimeScope",ee("slimeScope"),h(),ne(()=>te("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),i.matches("[data-scan-mode]")&&(ee("sniper"),n.scanMode=i.dataset.scanMode||n.scanMode,h(),ne(()=>Xn(n.scanMode)));const A=i.getAttribute("data-copy");if(A){const g=i.getAttribute("data-copy-label")||i.textContent||"Copy";await navigator.clipboard.writeText(A),w(i,"Copied"),setTimeout(()=>{w(i,g)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(n.replayDetails?.open){Al();return}if(n.kolDumpDetails?.open){Gi();return}if(n.protectedBuyModal?.open){Ds();return}if(n.quickBuyModal?.open){rl();return}if(n.walletConnectMenuOpen){n.walletConnectMenuOpen=!1,h({force:!0});return}n.loginCollapsed||(n.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const a=document.querySelector("[data-vbot-manual-wallets]");a&&(a.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(n.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(n.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const a=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(s=>{s.style.display=a?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=a||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(vs(),Ab(t)),t?.matches?.("[data-swap-from]")){const a=Fe(t.value||"SOL")||"SOL";n.tradeSwapFrom=a,a!=="SOL"?(n.tradeToken=a,n.tradeSwapTo="SOL"):Fe(n.tradeSwapTo||n.tradeToken||"")||(n.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const a=Fe(t.value||"");if(n.tradeSwapTo=a,a&&a!=="SOL"){n.tradeToken=a,n.swapDirection="buy";const r=m("[data-trade-token]");r&&(r.value=a)}a||m("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){n.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const a=t.value||"";if(a==="custom"){Pl("trade");return}if(n.selectedTradePresetId=a,n.fastTradePresetStatus=n.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=ce("trade",n.selectedTradePresetId);n.chartBuyWalletIndex="",r?.amountSol&&(n.quickBuyAmountOverride=X(r.amountSol)),n.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(n.quickBuyAmountOverride=X(t.value),t.value=n.quickBuyAmountOverride,eo()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(n.protectedBuyModal={...n.protectedBuyModal||{},presetId:m("[data-protected-buy-preset]")?.value||n.protectedBuyModal?.presetId||"conservative",walletIndex:m("[data-protected-buy-wallet]")?.value||n.protectedBuyModal?.walletIndex||"",amountSol:X(m("[data-protected-buy-amount]")?.value||n.protectedBuyModal?.amountSol||""),slippageBps:m("[data-protected-buy-slippage]")?.value||n.protectedBuyModal?.slippageBps||"400",riskAccepted:!!m("[data-protected-buy-risk-accept]")?.checked},sl()),t?.matches?.("[data-fast-bundle-preset]")){const a=t.value||"";if(a==="custom"){Pl("bundle");return}n.selectedBundlePresetId=a,n.fastBundlePresetStatus=n.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(n.terminalSort=t.value||"best",n.terminalCat="",ee("live"),ee("slimeScope"),as()),t?.matches?.("[data-live-feed-category]")){n.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",n.liveFeedCategory)}catch{}n.terminalSort=so()[3]||"best",n.terminalCat=so()[0]||"",ee("live"),as()}if(t?.matches?.("[data-live-terminal-category]")){n.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",n.liveTerminalCategory)}catch{}n.terminalSort=lo()[3]||"volume",n.terminalCat=lo()[0]||"",ee("live"),as()}if(t?.matches?.("[data-cook-spot-category]")){n.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",n.cookSpotCategory)}catch{}n.terminalSort=Cr()[3]||"volume",n.terminalCat=Cr()[0]||"",ee("slimeScope"),as(()=>te("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const a=t.files?.[0],r=m("[data-launch-image-preview-wrap]"),s=m("[data-launch-image-preview]"),o=m("[data-launch-image-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const i=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(i),s.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}gu(a).then(i=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},imageDataUrl:i,imageName:a.name,imageType:un(i,a.type||"application/octet-stream")},String(i).length<15e5)try{Oa(n.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-launch-coin-banner]")){const a=t.files?.[0],r=m("[data-launch-banner-preview-wrap]"),s=m("[data-launch-banner-preview]"),o=m("[data-launch-banner-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const i=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(i),s.src=i),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}bu(a).then(i=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},bannerDataUrl:i,bannerName:a.name,bannerType:un(i,a.type||"image/jpeg")},String(i).length<15e5)try{Oa(n.launchCoinDraft)}catch{}}).catch(i=>{const d=m("[data-launch-coin-status]");d&&w(d,i?.message||"Could not read that banner.")});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const a=Be(),r=t.getAttribute("data-terminal-filter-social"),s=t.getAttribute("data-terminal-filter-quote"),o=t.getAttribute("data-terminal-filter-audit");r&&(a.socials[r]=!!t.checked),s&&(a.quotes[s]=!!t.checked),o&&(a.audits[o]=!!t.checked),a.open=!0,ee("live"),ee("launch"),ee("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(ho(),n.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(n.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await Ry(t),t?.matches?.("[data-avatar-file]")&&await Fy(t)}),document.addEventListener("focusout",()=>{setTimeout(id,50)});let Ca=null;const Am=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")&&!e.target.matches("[data-launch-coin-banner]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const a=String(e.target.value||"");let r=a.replace(/[^0-9.]/g,"");const s=r.indexOf(".");if(s!==-1&&(r=r.slice(0,s+1)+r.slice(s+1).replace(/\./g,"")),r!==a){const o=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(o-(a.length-r.length),o-(a.length-r.length))}catch{}}}Ca&&clearTimeout(Ca),Ca=setTimeout(()=>{Ca=null,or({silent:!0})},350)}};document.addEventListener("input",Am),document.addEventListener("change",Am),document.addEventListener("click",()=>{Ca&&(clearTimeout(Ca),Ca=null,or({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){n.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),eo();return}if(t?.matches?.("[data-trade-token]")){const a=String(t.value||"").trim();n.tradeToken=a,n.tradeSwapTo=a;return}if(t?.matches?.("[data-terminal-filter-field]")){const a=t.getAttribute("data-terminal-filter-field"),r=Be();(a==="keywords"||a==="excludeKeywords")&&(r[a]=String(t.value||""),r.open=!0,wp());return}if(t?.matches?.("[data-launch-ticker]")){const a=Be();a.keywords=String(t.value||""),a.open=!0,wp();return}if(t?.matches?.("[data-smart-chart-zoom]")){n.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const a=t.closest(".smart-chart-zoom")?.querySelector("strong");a&&w(a,`${n.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(n.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(ho(),t.type==="range"&&h({force:!0}))});function Mr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",a=cd(t,{forcePaint:!0});id(),!a&&e?.persisted&&n.route==="terminal"&&h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),sa&&window.clearTimeout(sa),sa=window.setTimeout(()=>{if(sa=null,!(document.hidden||n.route!=="terminal")){if(Yn()){W({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:n.postTradeRefresh?.attemptId||"",details:n.activeTab||"terminal"});return}te(n.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>$(r.message)),n.user&&n.token&&jn("positions")&&St({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:Ro}).catch(()=>{}),pa(),Gn(),rs(),gi()}},Ql)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(n.ogreAgentListening||n.ogreAgentSpeechRecognizer)&&Gt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(n.ogreAgentOpen&&(n.ogreAgentListening||n.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!n.ogreAgentListening&&!n.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&Mr()},Ql+900);return}Mr()}),window.addEventListener("focus",Mr),window.addEventListener("pageshow",Mr),window.addEventListener("online",Mr),window.addEventListener("pagehide",()=>{sa&&(window.clearTimeout(sa),sa=null),n.clipFarm?.recording&&tr()});function Lk(){Go&&window.clearInterval(Go),Go=window.setInterval(()=>{document.hidden||cd("watchdog")},Qm)}const xk=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Swap & Chart",items:[["trade","Slime Swap"],["smartChart","Smart Chart"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"],["raids","Raid Board","/raids"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function La(e,t){return t=t||"#8dff45",`<svg class="swampi" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="${t}" fill-opacity="0.2" stroke="${t}" stroke-opacity="0.5" stroke-width="1.1"/><g stroke="${t}" stroke-width="1.95">${e}</g></svg>`}const Mk={terminal:"#46e8ff",live:"#8dff45",liveTrades:"#ffd24a",smartChart:"#72ff23",trade:"#3fe0d0",slimeScope:"#5ab0ff",watchlist:"#ffd24a",kol:"#ffcf5a",sniper:"#ff6b6b",txAudit:"#bbff63",tek:"#9fb6c2",ogreAi:"#b06bff",launchCoin:"#ff8a5a",bundle:"#ffa64d",volume:"#46e8ff",launch:"#9bff9b",wallets:"#ffd24a",positions:"#5ab0ff",pnl:"#72ff23",profile:"#8dff45"},xa={terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',live:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',liveTrades:'<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',smartChart:'<path d="M3 17l5-5 4 3 8-9"/><path d="M16 6h4v4"/>',trade:'<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',slimeScope:'<circle cx="11" cy="11" r="6"/><path d="M11 5v2.5"/><path d="M11 14.5V17"/><path d="M5 11h2.5"/><path d="M14.5 11H17"/><circle cx="11" cy="11" r="1.2"/><path d="M15.5 15.5L20 20"/>',watchlist:'<path d="M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.3 9.5l5.2-.8z"/>',kol:'<path d="M4 8l3 9h10l3-9-5 4-3-6-3 6z"/><path d="M7 17h10"/>',sniper:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',txAudit:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/>',tek:'<path d="M15 5a4 4 0 0 1-5.2 5L5 14.8 9.2 19l4.8-4.8a4 4 0 0 1 5-5.2l-2.7 2.7-2.3-.5-.5-2.3z"/>',ogreAi:'<path d="M5 10a7 5 0 0 1 14 0v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M4 8L2.5 6"/><path d="M20 8l1.5-2"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9.5 15l-.7 2.5"/><path d="M14.5 15l.7 2.5"/>',launchCoin:'<path d="M12 3c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 17l-2 4"/><path d="M15 17l2 4"/>',bundle:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v6l8 4 8-4V7"/><path d="M12 11v6"/>',volume:'<path d="M4 13v4"/><path d="M8 9v8"/><path d="M12 5v12"/><path d="M16 10v7"/><path d="M20 13v4"/>',launch:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',wallets:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3"/>',positions:'<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',pnl:'<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',profile:'<path d="M5 12a7 6 0 0 1 14 0v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M9 14.5c1.2 1.4 4.8 1.4 6 0"/>',prelaunch:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',raids:'<path d="M5 4l9 9"/><path d="M19 4l-9 9"/><path d="M11 13l-4 7"/><path d="M13 13l4 7"/>'},Pm=Object.fromEntries(Object.entries(xa).map(([e,t])=>[e,La(t,Mk[e])])),Bk={live:La(xa.live,"#8dff45"),chart:La(xa.trade,"#3fe0d0"),intel:La(xa.slimeScope,"#5ab0ff"),tools:La(xa.tek,"#9fb6c2"),portfolio:La(xa.positions,"#5ab0ff"),profile:La(xa.profile,"#8dff45")};function Rk(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas");const a=`<a class="nav-drop-pro" href="/autopilot-pro" title="SlimeWire Auto — Pro autopilot" aria-label="Pro autopilot">
      <span class="nav-drop-pro-emblem" aria-hidden="true"></span>
    </a>`,r=([s,o,c])=>c?`<a href="${l(c)}" title="${l(o)}" class="nav-side-link">
         <span class="nav-side-icon" aria-hidden="true">${Pm[s]||"•"}</span>
         <span class="nav-side-label">${l(o)}</span>
       </a>`:`<button type="button" data-tab="${l(s)}" title="${l(o)}">
         <span class="nav-side-icon" aria-hidden="true">${Pm[s]||"•"}</span>
         <span class="nav-side-label">${l(o)}</span>
       </button>`;t.innerHTML=a+xk.map(s=>`
    <div class="nav-drop-group" data-nav-drop-group="${l(s.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${Bk[s.key]||"•"}</span>
        <span class="nav-side-label">${l(s.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${s.items.map(r).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",s=>{const o=s.target.closest(".nav-side-group-toggle");if(o){const c=o.parentElement,i=c.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(d=>d.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(d=>d.setAttribute("aria-expanded","false")),i||(c.classList.add("is-open"),o.setAttribute("aria-expanded","true"));return}s.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open"))}),document.addEventListener("click",s=>{s.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))})}function Ik(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(a=>{const r=!!a.querySelector(`[data-tab="${n.activeTab}"]`);a.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),a.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(a=>{a.dataset.active=a.dataset.tab===n.activeTab?"true":"false"})}function Ok(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const s=((await fetch("/?build-check=1",{cache:"no-store"}).then(o=>o.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";s&&!e.includes(s)&&Ek()}catch{}},300*1e3).unref?.()}function Ek(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function Fk(){Rk(),Ok(),Mf(),Ff(),Ef(),Qo(),Of(),n.route==="intro"?Rf():Rn({reset:!0}),dg(),Lk(),Zo(),nl(),await rh(),h(),await lh(),Hy(),n.route==="terminal"&&(en({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>$(e.message)),n.activeTab==="ogreTek"&&await xr({silent:!0}).catch(e=>$(e.message)),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))}Fk();function xt(e){n.pumpLiveStatus=e,n.pumpLiveLastActionAt=Date.now(),h()}function Wk(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():n.launchCoinDraft||{},t=uu(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function _k(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const a=t.getAttribute("data-pump-live-action"),r=Wk(),s=r.tokenMint;if(!s){xt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(a==="chart"){typeof Tt=="function"?(Tt(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),xt("Opened Pump chart with transactions inside Slime.")):xt("Chart panel is still loading. Try again in a moment.");return}if(a==="copy"){const o=pu(s);navigator.clipboard?.writeText(o).then(()=>xt("Copied Pump Live stream route ID."),()=>xt("Stream route ID ready: "+o));return}if(a==="obs"){const o=Vi()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";xt(o);return}if(a==="end"){xt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(a==="go"){if(!Vi()){xt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}xt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",_k);function Jt(e){const t=String(e??"");return typeof l=="function"?l(t):t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function Ul(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:n.smartChartToken||{}}function ql(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function Dk(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function $o(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function Cm(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const a of t){const r=$o(a);if(Number.isFinite(r)&&r>0)return r}return NaN}function Nk(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const a=Number(t);if(Number.isFinite(a))return a<1e11?a*1e3:a;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function Uk(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function qk(e,t,a){if(!a.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(s=>String(s||"").toLowerCase()).join(" ");return a.some(s=>r.includes(s))}function Hk(e=""){return String(e||"").split("").reduce((t,a)=>t*31+a.charCodeAt(0)>>>0,17)}function Kk(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map($o).filter(s=>Number.isFinite(s)&&s>0);if(t.length)return t[0];const a=typeof Vt=="function"?Number(Vt(e)):NaN;if(Number.isFinite(a)&&a>0)return Math.max(1,a*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function D0(e){const t=Ul(e),a=ql(t)||t.symbol||t.name||"slime",r=Kk(t),s=Hk(a),o=Math.max(1,$o(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,$o(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),i=typeof Vt=="function"?Math.max(0,Math.min(100,Number(Vt(t))||0)):0,d=Math.max(-8,Math.min(18,c/o*18+i/12)),u=Date.now();return Array.from({length:34},(p,f)=>{const y=(f+s%13)/4.2,b=Math.sin(y)*(3.5+s%7*.28),v=(f/33-.5)*d,P=((s>>f%11&7)-3)*.32,A=Math.max(1e-7,r*(1+(b+v+P)/100));return{row:{...t,snapshotFallback:!0},value:A,time:u-(33-f)*15e3,side:"snapshot"}})}function Lm(e){const t=Ul(e),a=[ql(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,i,d)=>c.length>=3&&d.indexOf(c)===i),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:n.liveTrades},{direct:!1,rows:n.liveTradeRows},{direct:!1,rows:n.tradeTape},{direct:!1,rows:n.recentTrades},{direct:!1,rows:n.pumpTrades},{direct:!1,rows:n.pumpActivity},{direct:!1,rows:n.livePairs},{direct:!1,rows:n.livePairsRows},{direct:!1,rows:n.freshPairs},{direct:!1,rows:n.slimeScopePairs}],s=[];for(const c of r){const i=Uk(c.rows).slice(-350);for(const d of i){if(!d||typeof d!="object"||!c.direct&&!qk(d,t,a))continue;const u=Cm(d);if(!Number.isFinite(u)||u<=0)continue;const p=String(d.side||d.type||d.action||d.tradeType||"").toLowerCase();s.push({row:d,value:u,time:Nk(d),side:p.includes("sell")?"sell":p.includes("buy")?"buy":"trade"})}}const o=Cm(t);return Number.isFinite(o)&&o>0&&s.push({row:t,value:o,time:Date.now(),side:"snapshot"}),s.sort((c,i)=>c.time-i.time).filter((c,i,d)=>i===0||c.time!==d[i-1].time||c.value!==d[i-1].value).slice(-120)}function To(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function Vk(){const e=String(n.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function zk(e={},t={}){const a=Ul(e),r=ql(a),s=Vk(),o=String(n.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(n.pumpChartTimeframe||"5m"),d=Lm(a).slice(-70),u=!d.length||d.every(q=>q.side==="snapshot"||q.row?.snapshotFallback),p=d.map(q=>q.value),f=p.length?Math.min(...p):NaN,y=p.length?Math.max(...p):NaN,b=720,v=260,P=22,A=Number.isFinite(y-f)&&y!==f?y-f:1,g=q=>d.length<=1?b/2:P+q/(d.length-1)*(b-P*2),T=q=>v-P-(q-(Number.isFinite(f)?f:0))/A*(v-P*2),C=d.map((q,Ie)=>`${Ie?"L":"M"}${g(Ie).toFixed(1)},${T(q.value).toFixed(1)}`).join(" "),B=d.length>1?`${C} L${g(d.length-1).toFixed(1)},${v-P} L${g(0).toFixed(1)},${v-P} Z`:"",U=Math.max(4,Math.min(12,(b-P*2)/Math.max(d.length*2,1))),H=d.map((q,Ie)=>{const Ue=(d[Math.max(0,Ie-1)]||q).value,Mt=q.value,Pn=Math.max(Ue,Mt),Bt=Math.min(Ue,Mt),Ba=g(Ie),Rr=T(Ue),Y=T(Mt),Cn=T(Pn),xo=T(Bt);return`<g class="slime-pump-candle ${Mt>=Ue?"up":"down"}"><line x1="${Ba.toFixed(1)}" y1="${Cn.toFixed(1)}" x2="${Ba.toFixed(1)}" y2="${xo.toFixed(1)}" /><rect x="${(Ba-U/2).toFixed(1)}" y="${Math.min(Rr,Y).toFixed(1)}" width="${U.toFixed(1)}" height="${Math.max(2,Math.abs(Y-Rr)).toFixed(1)}" rx="2" /></g>`}).join(""),Se=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",Ne=s==="dex"&&Se?`<iframe class="slime-pump-dex-frame" src="${Jt(Se)}" title="Dex chart" loading="lazy"></iframe>`:d.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${b} ${v}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${B}" />${o==="candles"?H:`<path class="slime-pump-line" d="${C}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${s==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime","pump","dex"].map(q=>`<button type="button" class="${s===q?"active":""}" data-slime-pump-source="${q}">${q==="slime"?"Slime":q==="pump"?"Pump":"Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${o==="line"?"active":""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${o==="candles"?"active":""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m","5m","15m","1h","4h"].map(q=>`<button type="button" class="${c===q?"active":""}" data-slime-pump-time="${q}">${q}</button>`).join("")}
          ${u?'<span class="slime-pump-snapshot-dot">Snapshot</span>':'<span class="slime-pump-live-dot">Live</span>'}
        </div>
      </div>
      <div class="slime-pump-chart-body">${Ne}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Jt(To(p[p.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Jt(Number.isFinite(f)&&Number.isFinite(y)?`${To(f)} - ${To(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Jt(u?"Slime snapshot":s==="slime"?"Slime default":s==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function jk(e={}){const t=Lm(e).slice(-40).reverse(),a=t.map(r=>{const s=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),o=s<60?`${s}s`:`${Math.floor(s/60)}m`,c=r.row||{},i=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Jt(o)}</span><strong>${Jt(r.side)}</strong><span>${Jt(To(r.value))}</span><span>${Jt(Dk(i))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${a||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function xm(){n.slimePumpChartRendering||(n.slimePumpChartRendering=!0,requestAnimationFrame(()=>{n.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),a=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||a||r)&&(e.preventDefault(),e.stopPropagation(),t&&(n.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),a&&(n.pumpChartMode=a.getAttribute("data-slime-pump-mode")||"line"),r&&(n.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),xm())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&xm()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||n.activeTab!=="volume"||!(n.volumeBots||[]).some(t=>t.status!=="completed")||Ss()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const a=document.querySelector("[data-vbot-invest-num]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const a=document.querySelector("[data-vbot-invest]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-duration]")){const a=document.querySelector("[data-vbot-duration-label]");if(a){const r=Number(t.value);a.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const a=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function s(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function o(){return!!(n?.route==="terminal"&&a.has(String(n.activeTab||"terminal"))&&!document.hidden)}function c(){let p=0;const f=y=>{if(y){if(Array.isArray(y)){p+=y.length;return}if(Array.isArray(y.rows)){p+=y.rows.length;return}Array.isArray(y.data?.rows)&&(p+=y.data.rows.length)}};return f(n.livePairRows),f(n.slimeScopeRows),f(n.liveTradeRows),f(n.livePairs),Object.values(n.livePairsByBucket||{}).forEach(f),Object.values(n.terminalFeeds||{}).forEach(f),p}function i(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function d(){const p=[n.livePairsLastUpdatedAt,n.livePairsLastUpdatedByBucket?.[n.livePairBucket||"live"],n.terminalFeeds?.[n.activeTab||"terminal"]?.updatedAt,n.terminalFeeds?.[n.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return p.length?Date.now()-Math.max(...p)>3e4:!1}function u(p="empty-feed-watchdog"){if(!o()||s())return;const f=Date.now();if(f-t<xn)return;const y=c()===0&&!i();if(!y&&!d())return;if(t=f,y){try{na.clear()}catch{}try{Fr.clear()}catch{}try{n.livePairsLoadingByBucket={},n.livePairsLoading=!1}catch{}try{["terminal","live","slimeScope"].forEach(v=>{n.terminalFeeds&&n.terminalFeeds[v]&&n.terminalFeeds[v].inFlight&&(n.terminalFeeds={...n.terminalFeeds,[v]:{...n.terminalFeeds[v],inFlight:!1}})})}catch{}}const b=()=>typeof en=="function"?en({force:y,reason:p}):typeof te=="function"?te(n.activeTab||"terminal",{force:y,reason:p}):null;try{typeof ne=="function"?ne(b):Promise.resolve(b()).catch(()=>{})}catch{}}window.setTimeout(()=>u("first-paint-empty-feed-watchdog"),3200),window.setInterval(()=>u("empty-feed-watchdog-interval"),xn),window.addEventListener("pageshow",()=>window.setTimeout(()=>u("pageshow-empty-feed-watchdog"),xn)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>u("visible-empty-feed-watchdog"),xn)})})();const I={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[],audio:null,mime:"video/webm"};function Ma(e){return new Promise(t=>{const a=setTimeout(t,e);I.timers.push(a)})}function Gk(){return window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad/i.test(navigator.userAgent)}function Xk(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{const t=new e;t.resume?.();const a=t.createGain();a.gain.value=.6,a.connect(t.destination);let r=null;try{r=t.createMediaStreamDestination(),a.connect(r)}catch{}return I.audio={ctx:t,master:a,dest:r},I.audio}catch{return null}}function Ao(e,t,a,r,s){const o=e.gain;o.setValueAtTime(1e-4,t),o.exponentialRampToValueAtTime(Math.max(.001,a),t+r),o.exponentialRampToValueAtTime(1e-4,t+r+s)}function Mm(e,t=1){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,e),r.frequency.exponentialRampToValueAtTime(42,e+.22),Ao(s,e,.8*t,.006,.3),r.connect(s).connect(a.master),r.start(e),r.stop(e+.45)}function Bm(e){const t=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=t.getChannelData(0);for(let r=0;r<a.length;r+=1)a[r]=Math.random()*2-1;return t}function Jk(e,t=1.3){const a=I.audio;if(!a)return;const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Bm(a.ctx)),r.loop=!0;const s=a.ctx.createBiquadFilter();s.type="bandpass",s.Q.value=1.1,s.frequency.setValueAtTime(250,e),s.frequency.exponentialRampToValueAtTime(5200,e+t);const o=a.ctx.createGain();o.gain.setValueAtTime(1e-4,e),o.gain.exponentialRampToValueAtTime(.3,e+t),o.gain.exponentialRampToValueAtTime(1e-4,e+t+.08),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+t+.2)}function Hl(e,t=!1){const a=I.audio;if(!a)return;Mm(e,t?1.4:1.1);const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Bm(a.ctx));const s=a.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=t?1400:900;const o=a.ctx.createGain();Ao(o,e,t?.5:.32,.004,t?.9:.5),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+1.4);const c=a.ctx.createOscillator(),i=a.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(64,e),c.frequency.exponentialRampToValueAtTime(28,e+(t?1.4:.8)),Ao(i,e,t?.7:.4,.01,t?1.5:.85),c.connect(i).connect(a.master),c.start(e),c.stop(e+2)}function Yk(e,t=720){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="square",r.frequency.value=t,Ao(s,e,.12,.004,.12),r.connect(s).connect(a.master),r.start(e),r.stop(e+.2)}function Qk(e,t){const a=I.audio;if(!a)return;const r=a.ctx.currentTime+.05;for(let s=0;s<t-.4;s+=.5)Mm(r+s,.55+.35*(s/t));for(const s of e)Jk(r+Math.max(0,s-1.25),1.25),Hl(r+s,!1);Hl(r+t-.35,!0),Hl(r+t+.45,!0)}function Zk(){if(document.getElementById("trailer-style"))return;const e=document.createElement("style");e.id="trailer-style",e.textContent=`
    @keyframes twCapIn { 0% { transform: translateX(-50%) scale(1.3); opacity: 0; filter: blur(8px); } 100% { transform: translateX(-50%) scale(1); opacity: 1; filter: blur(0); } }
    @keyframes twFlash { 0% { opacity: 0.45; } 100% { opacity: 0; } }
    @keyframes twPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twGlow { 0%, 100% { text-shadow: 0 0 24px rgba(114,255,35,0.55); } 50% { text-shadow: 0 0 56px rgba(114,255,35,0.95); } }
  `,document.head.appendChild(e)}function Po(){if(I.root)return I.root;Zk();const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:7vh;background:linear-gradient(rgba(2,7,2,0.92),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(transparent,rgba(2,7,2,0.94));"></div>
    <div data-trailer-flash style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, rgba(114,255,35,0.55), rgba(114,255,35,0.12) 60%, transparent);opacity:0;"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:max(30px, env(safe-area-inset-bottom, 0px) + 26px);transform:translateX(-50%);text-align:center;opacity:0;max-width:94vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(20px,5.4vw,32px);font-weight:900;letter-spacing:0.04em;animation:twGlow 2.2s infinite;"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,3.4vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.88);text-align:center;padding:22px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:max(10px, env(safe-area-inset-top, 0px));right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>Kl("stopped")),document.body.appendChild(e),I.root=e,e}function Co(){const e=Po().querySelector("[data-trailer-flash]");e.style.animation="none",e.offsetWidth,e.style.animation="twFlash 0.55s ease-out forwards"}function Lo(e,t=""){const a=Po(),r=a.querySelector("[data-trailer-caption]");a.querySelector("[data-trailer-caption-main]").textContent=e,a.querySelector("[data-trailer-caption-sub]").textContent=t,e?(r.style.animation="none",r.offsetWidth,r.style.animation="twCapIn 0.5s cubic-bezier(0.2,1.4,0.4,1) forwards",r.style.opacity="1"):r.style.opacity="0"}function Br(e){const t=Po().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}function e0(){const e=["video/mp4;codecs=avc1.64001f,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"];for(const t of e)try{if(MediaRecorder.isTypeSupported(t))return t}catch{}return"video/webm"}async function t0(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});I.stream=e;const t=[...e.getVideoTracks()],a=I.audio?.dest?.stream?.getAudioTracks()||[];t.push(...a);const r=new MediaStream(t);I.mime=e0(),I.chunks=[];const s=new MediaRecorder(r,{mimeType:I.mime,videoBitsPerSecond:6e6});return s.ondataavailable=o=>{o.data?.size&&I.chunks.push(o.data)},s.start(1e3),I.recorder=s,e.getVideoTracks()[0]?.addEventListener("ended",()=>Kl("screen-share-ended")),!0}catch{return!1}}function a0(e){const t=I.mime.includes("mp4")?"mp4":"webm",a=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.${t}`,r=URL.createObjectURL(e),s=document.createElement("div");s.setAttribute("data-trailer-result",""),s.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(2,7,2,0.94);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;",s.innerHTML=`
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
  `,s.querySelector("[data-trailer-close]").addEventListener("click",()=>{s.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3)}),s.querySelector("[data-trailer-share]").addEventListener("click",async()=>{try{const o=new File([e],a,{type:I.mime.split(";")[0]});if(navigator.canShare?.({files:[o]})){await navigator.share({files:[o],title:"SlimeWire",text:"SlimeWire - verify before you ape. slimewire.org"});return}}catch{}s.querySelector("a[download]")?.click()}),document.body.appendChild(s)}function n0(){const e=I.recorder;if(!e)return;const t=()=>{try{const a=new Blob(I.chunks,{type:I.mime.split(";")[0]});a.size>0&&a0(a)}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();I.stream?.getTracks().forEach(a=>{try{a.stop()}catch{}}),I.recorder=null,I.stream=null}function Kl(e="done"){if(I.running){I.running=!1,I.timers.forEach(t=>clearTimeout(t)),I.timers=[],n0();try{I.audio?.ctx?.close()}catch{}I.audio=null,I.root?.remove(),I.root=null}}function r0(){const e=n.livePairsByBucket?.live?.rows||n.livePairs?.rows||n.livePairRows||[];return[...e].filter(a=>a?.tokenMint).sort((a,r)=>(Number(r.volume5m)||0)-(Number(a.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(a.bestPickScore||a.score)||0))[0]||e[0]||null}async function s0(e=9e3){const t=Date.now();for(;Date.now()-t<e;){const a=r0();if(a)return a;if(!I.running)return null;await Ma(500)}try{return((await k("/api/web/live-pairs?bucket=live&sort=fresh"))?.livePairs?.rows||[]).find(s=>s?.tokenMint)||null}catch{return null}}async function o0(e,t=4e3){const a=Date.now();for(;Date.now()-a<t;){if(document.querySelector(e))return!0;if(!I.running)return!1;await Ma(250)}return!1}function i0(){return new Promise(e=>{Br(`
      <div style="color:#72ff23;font-weight:900;font-size:clamp(20px,6vw,28px);">🎬 TRAILER MODE</div>
      <div style="color:#d6ffbf;font-size:clamp(13px,3.8vw,16px);margin-top:14px;max-width:420px;line-height:1.5;">
        1. Start your phone's <b>screen recorder</b> now<br>
        (Control Center on iPhone / quick tile on Android)<br>
        2. Come back and tap GO
      </div>
      <button type="button" data-trailer-go style="pointer-events:auto;margin-top:22px;background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:14px 44px;font-weight:900;font-size:18px;cursor:pointer;">GO</button>
      <div style="color:#7d937a;font-size:11px;margin-top:14px;">the performance starts on a 3-2-1 after you tap</div>
    `),I.root.querySelector("[data-trailer-go]")?.addEventListener("click",()=>e(!0),{once:!0})})}async function l0(){if(I.running)return;I.running=!0,Po(),Xk();const e=await t0(),t=Gk();if(!e&&(await i0(),!I.running))return;Pe("/terminal/live-pairs"),Br('<div style="color:#72ff23;font-weight:900;font-size:clamp(18px,5vw,24px);animation:twPulse 1.2s infinite;">locking onto live pairs...</div>');const a=await s0(9e3);if(!I.running)return;const r=3,s=6.5,o=9,c=6.5,i=4.6,d=[r,r+s,r+s+o,r+s+o+c],u=r+s+o+c+i;Qk(d,u);const f=(I.audio?.ctx?.currentTime||0)+.05;for(let b=0;b<r;b+=1)Yk(f+b,600+b*90);for(let b=r;b>=1;b-=1){if(!I.running)return;Br(`<div style="color:#72ff23;font-size:clamp(64px,22vw,110px);font-weight:900;text-shadow:0 0 30px rgba(114,255,35,0.75);animation:twPulse 1s infinite;">${b}</div>`),await Ma(1e3)}if(Br(""),!I.running)return;Co(),Lo("FRESH PAIRS. SECONDS OLD.","every pump.fun launch lands here instantly"),await Ma(s*1e3);const y=a?.symbol?`$${String(a.symbol).slice(0,12)}`:"live pair";if(I.running&&a?.tokenMint){Co(),Pe(`/terminal/chart?token=${encodeURIComponent(a.tokenMint)}`);const b=await o0("iframe[src*='dexscreener'], .smart-chart-terminal iframe, [data-chart] canvas",4500);if(!I.running||(Lo("CHARTS WITH A BRAIN",`${y} - live candles, live flow, shield verdict on top`),await Ma((b?o:4)*1e3),!I.running))return;Co(),Ip(a.tokenMint),Lo("TRIPLE-ENGINE RUG CHECK","SlimeShield x Rugcheck x GoPlus - dodge the rug BEFORE you ape"),await Ma(c*1e3),wl()}I.running&&(Lo(""),Co(),Br(`
    <div style="color:#72ff23;font-size:clamp(38px,11vw,76px);font-weight:900;letter-spacing:0.05em;animation:twGlow 1.6s infinite, twPulse 1.6s infinite;">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(15px,4.4vw,23px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:clamp(10px,3vw,12px);margin-top:26px;">Live market data. Not financial advice.</div>
  `),await Ma(i*1e3),Kl("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),I.running||l0())});
