import{canSubmitPerpOrder as Im,createPerpsProvider as Om,ogreTekRouteStatus as Em,resolveOgreTekConfig as Fm,shouldShowOgreTekNav as Wm,validatePerpOrder as _m}from"./perps.js";import{smartChartSuggestion as Nm,tradeActionLabelFromPreset as Dm}from"./liveTerminalUi.js";const Ra=window.OGRE_PORTAL_CONFIG||{},Um=Ra.featureFlags||{};function D(e,t=!0){const a=Um?.[e];return a==null||a===""?!!t:typeof a=="boolean"?a:["1","true","yes","on"].includes(String(a).toLowerCase())}const Yt=Ra.pumpLive||{},Ae=Fm(Ra),qm=!1,Br=Om(Ae),Hm=String(Ra.apiBase||"").trim().replace(/\/+$/,""),Km=window.location.origin.replace(/\/+$/,""),Kl="https://ogrevolbot.onrender.com",Bt=String(Ra.shareUrl||Ra.siteUrl||"https://www.slimewire.org").trim()||"https://www.slimewire.org",Vl=[Hm,window.location.hostname.endsWith("onrender.com")?Km:"",Kl].filter(Boolean);let Ia=Vl[0]||Kl;const Cn=6e4,Mo=15e3,Qt=1e4,Bo=8e3,Ln=8e3,Ro=new Map,Vm=new Map,yt=Vm,Zt=new Set,Rr=new Map,o0=new Map,xn={},ae=18e4,Io="slimewireMobileWalletPending",Oo="slimewireMobileWalletPendingBackup",zm="slimewireMobileWalletSession:",zl="slimewirePerfLog",jl="slimewireCrashLog",jm="slimewireTerminalFeedLog",Gl="slimewireOgreAiRecentMints",Xl="slimewireOgreAiFormPreset",Gm=150,Xm=1500,Jm=1e4,Ym=140,Jl="live-pairs-inflight",Qm=[1200,4500,1e4],Zm=15e3,Yl=650,ef=3500,tf=12e3,af=3e4,nf=["wallet-summary","positions","pnl","trade-history","selected-token","live-trades"],Ql="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",rf=new Map([...Ql].map((e,t)=>[e,t]));function sf(){try{return window.localStorage?.getItem("ogreWebToken")||""}catch{return""}}function Mn(e){try{window.localStorage?.setItem("ogreWebToken",e)}catch{}}function Eo(){try{window.localStorage?.removeItem("ogreWebToken")}catch{}}function Zl(){try{return window.localStorage?.getItem("ogreXHandle")||""}catch{return""}}function ec(e){try{window.localStorage?.setItem("ogreXHandle",e)}catch{}}function Fo(){try{window.localStorage?.removeItem("ogreXHandle")}catch{}}function of(){try{const e=JSON.parse(window.localStorage?.getItem(zl)||"[]");return Array.isArray(e)?e.slice(-100):[]}catch{return[]}}function lf(){try{const e=JSON.parse(window.localStorage?.getItem(jl)||"[]");return Array.isArray(e)?e.slice(-50):[]}catch{return[]}}function tc(){try{const e=JSON.parse(window.sessionStorage?.getItem(Gl)||"[]");return Array.isArray(e)?e.map(t=>String(t||"").trim()).filter(Boolean).slice(-30):[]}catch{return[]}}function cf(e){const t=[...Array.isArray(e?.plans)?e.plans.map(s=>s?.tokenMint||s?.pick?.tokenMint):[],...Array.isArray(e?.picks)?e.picks.map(s=>s?.tokenMint):[]].map(s=>String(s||"").trim()).filter(Boolean);if(!t.length)return;const a=new Set,r=[...tc(),...t].filter(s=>a.has(s)?!1:(a.add(s),!0)).slice(-30);try{window.sessionStorage?.setItem(Gl,JSON.stringify(r))}catch{}}function ac(){try{const e=JSON.parse(window.sessionStorage?.getItem(Xl)||"{}")||{};return e&&typeof e=="object"?e:{}}catch{return{}}}function df(e={}){try{window.sessionStorage?.setItem(Xl,JSON.stringify({amountSol:String(e.amountSol||"").slice(0,16),runCount:String(e.runCount||"1").slice(0,4),category:String(e.category||"super_fresh").slice(0,16),takeProfitSelect:String(e.takeProfitSelect||"25").slice(0,16),takeProfitCustom:String(e.takeProfitCustom||"").slice(0,16),stopLossSelect:String(e.stopLossSelect||"8").slice(0,16),stopLossCustom:String(e.stopLossCustom||"").slice(0,16),delaySelect:String(e.delaySelect||"5").slice(0,16),delayCustom:String(e.delayCustom||"").slice(0,16),slippageSelect:String(e.slippageSelect||"400").slice(0,16),slippageCustom:String(e.slippageCustom||"").slice(0,16),walletGroup:String(e.walletGroup||"").slice(0,48)}))}catch{}}function nc(){try{const e=new URL(window.location.href),t=e.pathname.match(/^\/r\/([^/]+)/i),a=e.searchParams.get("ref")||(t?decodeURIComponent(t[1]||""):""),r=String(a||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24);return r?(window.localStorage?.setItem("slimewireReferralCode",r),r):String(window.localStorage?.getItem("slimewireReferralCode")||"").replace(/[^a-z0-9_-]/gi,"").replace(/[_-]{2,}/g,"-").replace(/^[-_]+|[-_]+$/g,"").toUpperCase().slice(0,24)}catch{return""}}function uf(){let e={};try{e=JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft")||"{}")||{}}catch{e={}}try{const t=new URLSearchParams(window.location.search);if(t.has("lc_n")||t.has("lc_s")){const a={lc_n:"name",lc_s:"symbol",lc_d:"description",lc_x:"x",lc_tg:"telegram",lc_web:"website"};for(const s in a){const o=t.get(s);o&&(e[a[s]]=s==="lc_s"?o.toUpperCase().slice(0,12):o)}const r=t.get("lc_dev");r&&Number(r)>0&&(e.devBuySol=String(r),e.devBuyEnabled=!0);try{Oa(e)}catch{}try{window.history.replaceState(null,"",window.location.pathname+window.location.hash)}catch{}}}catch{}return e}function Oa(e){try{const t={...e||{}};String(t.imageDataUrl||"").length>=15e5&&delete t.imageDataUrl,String(t.bannerDataUrl||"").length>=15e5&&delete t.bannerDataUrl,window.localStorage?.setItem("slimewireLaunchCoinDraft",JSON.stringify(t))}catch{}}function pf(){try{return window.localStorage?.getItem("slimewireNavTekOpen")==="true"}catch{return!1}}function mf(){try{return window.localStorage?.getItem("slimewireNavTekOpen")!==null}catch{return!1}}function ff(e){try{window.localStorage?.setItem("slimewireNavTekOpen",e?"true":"false")}catch{}}const rc="slimewireIntroCompleteV1";function sc(){try{return window.sessionStorage?.getItem(rc)==="true"}catch{return!1}}function hf(){try{window.sessionStorage?.setItem(rc,"true")}catch{}}function Bn({reset:e=!1}={}){document.querySelectorAll("[data-intro-video]").forEach(t=>{try{t.pause(),t.muted=!0,t.defaultMuted=!0,e&&Number.isFinite(t.duration)&&(t.currentTime=0)}catch{}})}(()=>{try{if(localStorage.getItem("liveTerminalFreshV1"))return;localStorage.setItem("liveTerminalFreshV1","1");const e=localStorage.getItem("liveTerminalCategory");(!e||e==="dexTrending")&&localStorage.setItem("liveTerminalCategory","fresh")}catch{}})();const n={token:sf(),user:null,route:ja(window.location.pathname),activeTab:window.location.pathname.includes("/launch-coin")||/[?&]lc_n=/i.test(window.location.search)?"launchCoin":window.location.pathname.includes("/ogre-tek")?"ogreTek":window.location.pathname.includes("/chart")?"smartChart":window.location.pathname.includes("/slime-scope")?"slimeScope":window.location.pathname.includes("/tx-audit")?"txAudit":window.location.pathname.includes("/trade")?"trade":window.location.pathname.includes("/kol")?"kol":"terminal",terminalSubtab:"positions",terminalSort:"newest",terminalCat:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"fresh"}catch{return"fresh"}})(),liveFeedCategory:(()=>{try{return localStorage.getItem("liveFeedCategory")||"fresh"}catch{return"fresh"}})(),liveTerminalCategory:(()=>{try{return localStorage.getItem("liveTerminalCategory")||"fresh"}catch{return"fresh"}})(),cookSpotCategory:(()=>{try{return localStorage.getItem("cookSpotCategory")||"dexTrending"}catch{return"dexTrending"}})(),terminalLaunchFilters:{open:!1,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},terminalToken:"",smartChartToken:"",smartChartTokenRef:null,smartChartDexResolution:{},smartChartDexResolving:{},smartChartBootstrap:{},smartChartBootstrapLoading:{},smartChartPrefetchLog:[],smartChartZoom:100,smartChartView:"chart",chartTradeTab:new URLSearchParams(window.location.search||"").get("tab")==="sell"?"sell":"buy",chartFocusAmountInput:new URLSearchParams(window.location.search||"").get("focusAmount")==="1",chartScrollIntoView:window.location.pathname.includes("/terminal/chart"),terminalAutoToken:"",terminalTxSignature:"",terminalTxAudit:null,terminalTxLoading:!1,walletRefreshing:!1,walletRefreshStatus:"idle",walletRefreshRequestId:0,lastWalletRefreshAt:"",walletRefreshError:"",postTradeRefresh:{active:!1,attemptId:"",action:"",invalidatedKeys:[],refreshedKeys:[],requestCount:0,errors:[]},positionRefreshAction:{state:"idle",startedAt:0,minUntil:0,error:""},manualSellActions:{},tradeActionLocks:{},logoutPending:!1,loading:!1,wallets:[],balances:[],positions:[],pnl:null,scan:null,scanMode:"safe",tradeToken:"",tradeSwapFrom:"SOL",tradeSwapTo:"",swapDirection:"buy",tradeResult:null,tradePlanResult:null,tradePlans:[],bundleToken:"",bundleResult:null,volumeToken:"",volumeResult:null,volumeBots:[],volumeBotStatus:"",volumeBotBusy:!1,slimeBotMode:"smart",slimeBotAggr:"med",slimeBotStagger:"steady",slimeBotKeepDust:!1,slimeBotOffset:!1,distributeStatus:"",distributeBusy:!1,returnFundsStatus:"",returnFundsBusy:!1,sniperResult:null,ogreAiResult:null,ogreAiStatus:"",ogreAiLoading:!1,ogreAiCategory:null,ogreAutopilot:null,ogreAutopilotBusy:!1,clipFarm:{recording:!1,status:"",blob:null,videoUrl:"",recorder:null,stream:null,chunks:[]},walletFastApprovalsEnabled:(()=>{try{return(localStorage.getItem("walletFastApprovalsEnabled")||"on")!=="off"}catch{return!0}})(),ogreAgentOpen:!1,ogreAgentLoading:!1,ogreAgentFastMode:(()=>{try{return(localStorage.getItem("ogreAgentFastMode")||"on")!=="off"}catch{return!0}})(),ogreAgentVoiceEnabled:(()=>{try{return(localStorage.getItem("ogreAgentVoiceEnabled")||"off")==="on"}catch{return!1}})(),ogreAgentSpeaking:!1,ogreAgentListening:!1,ogreAgentSpeechRecognizer:null,ogreAgentSpeechBaseDraft:"",ogreAgentSpeechFinal:"",ogreAgentAutoTradeApproved:(()=>{try{return localStorage.removeItem("ogreAgentAutoTradeApproved"),(sessionStorage.getItem("ogreAgentAutoTradeApproved")||"")==="yes"}catch{return!1}})(),ogreAgentStatus:"",ogreAgentMessages:[],connectedWalletBalance:null,livePairs:null,livePairsByBucket:{},livePairsLoading:!1,livePairsLoadingByBucket:{},livePairsLastUpdatedAt:"",livePairsLastUpdatedByBucket:{},livePairsRefreshErrorByBucket:{},livePairBucket:"live",slimeShieldResults:{},slimeShieldLoading:{},slimeShieldDetails:{open:!1,tokenMint:""},slimeShieldStatus:"",devInfoSummaries:{},devInfoResults:{},devInfoLoading:{},devInfoDetails:{open:!1,tokenMint:""},devInfoStatus:"",replayResults:{},replayLoading:{},replayDetails:{open:!1,tokenMint:""},slimeScopeMode:"new",terminalFeeds:{},terminalFeedLog:[],terminalFeedVisibleLimits:{},perfLog:of(),crashLog:lf(),perfRenderCounts:{},perfInstrumentationInstalled:!1,launchResult:null,launchCoinDraft:uf(),launchCoinStatus:"",launchWatches:[],pumpLiveStatus:"",pumpLiveLastActionAt:0,kolScan:null,kolMode:"top",kolWallet:"",kolResult:null,kolStatus:"",kolLoading:!1,kolLastUpdatedAt:"",kolDumpStats:null,kolDumpStatsLoading:!1,kolDumpStatsLoadedAt:0,kolDumpDetails:{open:!1,kolId:""},presets:{trade:[],bundle:[]},watchlist:{rows:[],count:0},watchlistLoading:!1,selectedTradePresetId:"",selectedBundlePresetId:"",quickBuyAmountOverride:"",quickBuyModal:{open:!1,tokenMint:"",amountSol:"",walletIndex:"",slippageBps:"400",status:"",source:"",error:"",tradeAttemptId:""},protectedBuyModal:{open:!1,tokenMint:"",presetId:"conservative",amountSol:"",walletIndex:"",slippageBps:"400",riskAccepted:!1,status:"",error:"",source:""},quickBuyLast:null,terminalTradeCollapsed:!0,navTekOpen:pf(),walletConnectMenuOpen:!1,walletConnectReturnPath:"/terminal",walletConnectStatus:"",automationDelegationStatus:"",tpslAutoEnableInFlight:!1,tpslAutoEnableScheduledAt:0,ogreTek:{loading:!1,error:"",markets:[],account:null,positions:[],orders:[],selectedMarket:"SOL-PERP",direction:"long",orderType:"market",collateralUsd:"100",leverage:"2",slippagePct:"0.5",priorityFeeLamports:"0",limitPrice:"",stopPrice:"",reviewOpen:!1,riskAccepted:!1,status:""},fastTradePresetStatus:"",fastBundlePresetStatus:"",editingTradePresetId:"",editingBundlePresetId:"",walletRemoveStatus:"",walletSweepStatus:"",loginModalOpen:window.location.pathname.startsWith("/login")||window.location.pathname.startsWith("/account/login")||new URLSearchParams(window.location.search||"").get("login")==="1",loginModalTab:"login",loginReturnTo:"",lastLockInClickAt:0,restoreResult:null,importResult:null,backupResult:null,downloads:null,xHandle:Zl(),loginCollapsed:!0};let Ea=null,Ir="";const Or=new Set;let Fa=null,Er="",Wa=null,Fr="",ea=null,_a=null,rt=0,Na=null,Wr="",Da=null,_r="",Nr=null,Rt=[],Dr=null,Ur=null,qr=!1,Rn=[],Wo=null,ta=null,aa=null,In=null,_o="",oc=0,gf=0,No=0,Hr=null,Ua=!1;const na=new Map,On={},ra=new Map,qa=[];let Do=null,Uo=null,qo=null,Ho=null,Ko=null,Vo=0,zo=new Set,jo=null,sa=null,Kr=null,Go=null,ic=Date.now();function Ha(){return!!(n.slimeShieldDetails?.open||n.devInfoDetails?.open||n.kolDumpDetails?.open||n.replayDetails?.open)}function Ka(){Ea&&clearTimeout(Ea),Ea=null,Ir=""}function Vr(){Ha()||(pa(),Va("details-close"))}function bf(e,t){const a=c=>c?.dataset?.tokenChart||c?.dataset?.tokenMint||"",r=new Map;for(const c of Array.from(e.children))if(c.classList?.contains("signal-row")){const l=a(c);l&&!r.has(l)&&r.set(l,c)}let s=e.querySelector(":scope > .signal-header")||null;const o=new Set;for(const c of Array.from(t.children)){if(!c.classList?.contains("signal-row"))continue;const l=a(c);let d=l?r.get(l):null;d?(o.add(l),d.className!==c.className&&(d.className=c.className),d.innerHTML!==c.innerHTML&&(d.innerHTML=c.innerHTML)):d=c,s?s.nextElementSibling!==d&&s.after(d):e.firstElementChild!==d&&e.insertBefore(d,e.firstElementChild),s=d}for(const[c,l]of r)o.has(c)||l.remove()}function yf(e,t){const a=e.querySelector(":scope > [data-cooks-meta]"),r=t.querySelector(":scope > [data-cooks-meta]");r&&!a?e.insertBefore(r,e.firstChild):a&&!r?a.remove():a&&r&&a.innerHTML!==r.innerHTML&&(a.innerHTML=r.innerHTML);for(const s of["[data-cooks-best]","[data-cooks-newest]"]){const o=e.querySelector(`:scope > ${s}`),c=t.querySelector(`:scope > ${s}`);if(!c){o&&o.remove();continue}if(!o)return!1;const l=o.querySelector(":scope > .cooks-section-label"),d=c.querySelector(":scope > .cooks-section-label");l&&d&&l.innerHTML!==d.innerHTML&&(l.innerHTML=d.innerHTML);const u=o.querySelector(":scope > .signal-list"),p=c.querySelector(":scope > .signal-list");u&&p?bf(u,p):u!==p&&o.replaceWith(c)}return!0}let lc=0;if(typeof window<"u"){const e=()=>{lc=Date.now()};window.addEventListener("wheel",e,{passive:!0}),window.addEventListener("touchmove",e,{passive:!0}),window.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Spacebar"].includes(t.key)&&e()},{passive:!0})}function vf(){if(n.activeTab!=="live"&&n.activeTab!=="terminal")return!1;const e=m("[data-panel]"),t=e?.querySelector(".cooks-feed");if(!e||!t)return!1;const a=qe(),r=we(a?.rows||[]),s=vn(r);if(!s.length)return!1;const o=tr(),c=[];{const p=window.innerHeight||700;for(const f of t.querySelectorAll(".signal-row[data-token-chart]")){const y=f.getBoundingClientRect().top;if(y>=80&&y<p){const b=f.getAttribute("data-token-chart")||"";if(b&&c.push({mint:b,top:y}),c.length>=6)break}}}const l=document.createElement("div");l.innerHTML=xl(s);const d=l.querySelector(".cooks-feed");if((!d||!yf(t,d))&&(t.outerHTML=xl(s)),c.length&&(o||Date.now()-lc>450)){const p=e.querySelector(".cooks-feed");for(const f of c){const y=p?.querySelector(`.signal-row[data-token-chart="${f.mint.replace(/["\\]/g,"\\$&")}"]`);if(y){const b=y.getBoundingClientRect().top-f.top;Number.isFinite(b)&&Math.abs(b)>1&&window.scrollBy(0,b);break}}}const u=e.querySelector(".terminal-title-row span");if(u){const p=Ot.find(([f])=>f===n.livePairBucket)?.[1]||"Live";u.textContent=`${p} | ${s.length} live`}return!0}function Va(e="live-pairs-batch"){if(e&&zo.add(String(e)),Ko||Vo)return;const t=()=>{const a=Array.from(zo);if(Ko=null,zo=new Set,Vo=0,n.route!=="terminal"||!["terminal","live","slimeScope"].includes(n.activeTab)||Ha()||(W({component:"livePairs",action:"batched-live-render",durationMs:0,resultCount:Array.isArray(qe()?.rows)?qe().rows.length:0,details:a.length?a.slice(-3).join(" | "):e}),(n.activeTab==="live"||n.activeTab==="terminal")&&vf()))return;const r=Ci();h(),Li(r)};Ko=window.setTimeout(()=>{Vo=window.requestAnimationFrame(t)},Ym)}const m=e=>document.querySelector(e);function ne(e){window.setTimeout(()=>{Promise.resolve().then(e).catch(t=>{typeof T=="function"?T(t?.message||"Action failed."):console.warn(t)})},0)}const S=(e,t)=>{e&&(e.textContent=t)},Ee=(e,t)=>{S(m(e),t)},It=(e,t)=>{const a=m(e);a&&(a.hidden=t)},ce=m("[data-app]"),En=m("[data-login]"),cc=m("[data-connect]"),Xo=m("[data-top-login]"),Ce=m("[data-login-modal]"),dc=m("[data-auth-actions]"),uc=m("[data-guest-actions]"),pc=m("[data-session-actions]"),re=m("[data-dashboard]"),wf=m("[data-error]"),Sf=m("[data-dashboard-error]");function se(e){if(!D("debugPerformanceCounters",!1))return;const t=String(e||"counter");xn[t]=Number(xn[t]||0)+1,(xn[t]<=5||xn[t]%25===0)&&console.info("[slimewire_debug_counter]",t,xn[t])}const Ot=[["live","Fresh"],["under1h","1-2h"],["under3h","3-6h"],["under1d","24-48h"]],kf=[["best","Best Picks"],["newest","Newest"],["volume","Most Volume"],["liquidity","Most Liquidity"],["buys","Most Buys"],["momentum","Highest Momentum"],["risk","Highest Risk"]],Jo=[["best","Best Picks","Top scored picks · rotating","best"],["fresh","Fresh Pairs","Newest pairs first","newest"],["volume","High Volume","Most traded right now","volume"],["gainers","Biggest Gainers","Top % movers","momentum"],["liquidity","High Liquidity","Deepest pools","liquidity"],["marketcap","Top Market Cap","Largest by market cap","volume"],["active","Most Active","Most transactions","buys"]],za=[["fresh","Fresh Pairs","Newest launches first","newest"],["dexTrending","DEX Trending","Trending across DEX pairs","volume"],["dexBoosted","DEX Boosted","Paid DEX boosts","volume"],["pumpTrending","Pump.fun Trending","Hot pump-curve launches","newest"],["memeMovers","Meme Coin Movers","Top meme % movers","momentum"],["earlyMomentum","Early Momentum","Young pairs building","newest"],["graduating","Graduating","Near pump migration","volume"],["graduated","Graduated","Moved to the open market","liquidity"]],$f=[["twitter","X"],["website","Website"],["telegram","Telegram"],["youtube","YouTube"],["tiktok","TikTok"],["instagram","Instagram"],["dexPaid","Dex paid"],["minSocial","Min 1 social"],["pumpLive","Pump live"]],Tf=[["WSOL","WSOL"],["USDC","USDC"],["USD1","USD1"]],Af=[["mintAuth","Mint auth off"],["freezeAuth","Freeze auth off"],["lpBurned","LP burned"],["top10Hold","Top 10 ok"],["showHidden","Show hidden"]],Pf=[{tabKey:"terminal",label:"Live Terminal",component:"terminalHtml",endpoint:"composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist",category:"overview:terminal",refreshMs:8e3,staleMs:24e3,cacheKey:"terminal:overview",pageSize:12,maxPageSize:24,previewLimit:8,supportsPagination:!1},{tabKey:"live",label:"Cooks - New Solana Pairs",component:"livePairsHtml",endpoint:"/api/web/live-pairs",category:"pairs:new",refreshMs:8e3,staleMs:24e3,cacheKey:"pairs:{bucket}:{sort}",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"liveTrades",label:"Live Trades - Recent Swaps",component:"liveTradesHtml",endpoint:"/api/web/pnl",category:"trades:recent",refreshMs:8e3,staleMs:2e4,cacheKey:"trades:recent",pageSize:30,maxPageSize:100,previewLimit:10,supportsPagination:!0},{tabKey:"slimeScope",label:"Slime Scope - Scanner Picks",component:"slimeScopeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/sniper/scan",category:"scanner:slime-scope",refreshMs:1e4,staleMs:3e4,cacheKey:"scanner:slime-scope:{scopeMode}",pageSize:30,maxPageSize:120,previewLimit:30,supportsPagination:!0},{tabKey:"kol",label:"KOL Tracker - Social/KOL Signals",component:"kolHtml",endpoint:"/api/web/kol/scan",category:"signals:kol",refreshMs:1e4,staleMs:3e4,cacheKey:"signals:kol:{kolMode}:{kolWallet}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"watchlist",label:"Watchlist - Your Saved Pairs",component:"watchlistHtml",endpoint:"/api/web/watchlist",category:"user:watchlist",refreshMs:2e4,staleMs:45e3,cacheKey:"user:watchlist",pageSize:30,maxPageSize:100,previewLimit:12,supportsPagination:!0},{tabKey:"smartChart",label:"Smart Chart - Selected Token",component:"smartChartHtml",endpoint:"composite:/api/web/positions",category:"token:selected-chart",refreshMs:3e4,staleMs:6e4,cacheKey:"token:selected-chart:{tokenMint}",pageSize:5,maxPageSize:10,previewLimit:5,supportsPagination:!1},{tabKey:"trade",label:"Slime Swap - Selected Token Panel",component:"tradeHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"trade:selected-token",refreshMs:2e4,staleMs:45e3,cacheKey:"trade:selected-token:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"bundle",label:"Bundle Volume - Bundle Actions",component:"bundleHtml",endpoint:"composite:/api/web/balances+/api/web/positions",category:"bundle:volume",refreshMs:25e3,staleMs:6e4,cacheKey:"bundle:volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"volume",label:"Bundle Volume - Volume Flags",component:"volumeHtml",endpoint:"composite:/api/web/live-pairs+/api/web/balances",category:"signals:bundle-volume",refreshMs:25e3,staleMs:6e4,cacheKey:"signals:bundle-volume:{tokenMint}",pageSize:1,maxPageSize:1,previewLimit:1,supportsPagination:!1},{tabKey:"sniper",label:"Sniper - Launch Snipe Candidates",component:"sniperHtml",endpoint:"/api/web/sniper/scan",category:"scanner:launch-snipe",refreshMs:2e4,staleMs:45e3,cacheKey:"scanner:launch-snipe:{scanMode}",pageSize:36,maxPageSize:72,previewLimit:12,supportsPagination:!0},{tabKey:"launch",label:"Launch Snipe - Launch Watches",component:"launchHtml",endpoint:"/api/web/launch/watches",category:"launch:watches",refreshMs:6e3,staleMs:12e3,cacheKey:"launch:watches",pageSize:20,maxPageSize:40,previewLimit:8,supportsPagination:!1},{tabKey:"launchCoin",label:"Pump Launch - Launch Status",component:"launchCoinHtml",endpoint:"/api/web/launch/watches",category:"pump-launch:status",refreshMs:2e4,staleMs:6e4,cacheKey:"pump-launch:status",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"wallets",label:"Wallets/Balances",component:"walletsHtml",endpoint:"composite:/api/web/wallets+/api/web/balances",category:"portfolio:wallets-balances",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:wallets-balances",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"positions",label:"Positions",component:"positionsHtml",endpoint:"/api/web/positions",category:"portfolio:positions",refreshMs:12e3,staleMs:3e4,cacheKey:"portfolio:positions",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1},{tabKey:"pnl",label:"PnL",component:"pnlHtml",endpoint:"/api/web/pnl",category:"portfolio:pnl",refreshMs:2e4,staleMs:45e3,cacheKey:"portfolio:pnl",pageSize:50,maxPageSize:100,previewLimit:10,supportsPagination:!1},{tabKey:"ogreAi",label:"Ogre A.I.",component:"ogreAiHtml",endpoint:"local:ogre-ai-results",category:"tool:ogre-ai",refreshMs:3e4,staleMs:9e4,cacheKey:"tool:ogre-ai",pageSize:10,maxPageSize:20,previewLimit:5,supportsPagination:!1},{tabKey:"ogreTek",label:"Ogre TeK / Perp Mode",component:"ogreTekHtml",endpoint:"local:perps-provider",category:"perps:ogre-tek",refreshMs:3e4,staleMs:9e4,cacheKey:"perps:ogre-tek",pageSize:25,maxPageSize:50,previewLimit:8,supportsPagination:!1}],Cf=Object.fromEntries(Pf.map(e=>[e.tabKey,e])),Lf=["./assets/slimewire/png/slimewire-mark.png","./assets/slimewire/svg/icons/wallet.svg","./assets/slimewire/svg/icons/terminal.svg","./assets/slimewire/svg/icons/chart.svg","./assets/slimewire/svg/icons/refresh.svg","./assets/slimewire/svg/powered-by-ogres-badge.svg","./assets/slimewire/clean-ui/wallet_icons/default/phantom.png","./assets/slimewire/clean-ui/wallet_icons/default/solflare.png","./assets/slimewire/png/providers/phantom-orb.jpg","./assets/slimewire/png/providers/solflare-orb.jpg","./assets/slimewire/png/token-mascots/token-mascot-1.png","./assets/slimewire/png/token-mascots/token-mascot-2.png","./assets/slimewire/png/token-mascots/token-mascot-3.png"];function mc(e=""){try{return new URL(e,window.location.href).href}catch{return String(e||"")}}function fc(e,t=""){const a=e?.currentSrc||e?.src||e?.getAttribute?.("src")||"";return mc(a)===mc(t)}function xf(e){const t=e?.dataset?.fallbackSrc||e?.getAttribute?.("data-fallback-src")||"";if(t&&!fc(e,t))return t;const a=String(e?.currentSrc||e?.src||e?.getAttribute?.("src")||"").toLowerCase();return a.includes("phantom")?Ya("phantom"):a.includes("solflare")?Ya("solflare"):a.includes("wallet")||a.includes("/icons/")?"./assets/slimewire/svg/icons/wallet.svg":a.includes("powered-by")||a.includes("wordmark")||a.includes("slimewire-mark")?"./assets/slimewire/png/slimewire-mark.png":Ml(e?.alt||a||"slimewire")}function hc(e,t="",a="fallback"){try{console.info("[slimewire_image_fallback]",{action:a,className:String(e?.className||"").slice(0,80),fallbackKind:t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("wallet.svg")?"wallet":t.includes("token-mascot")?"token-mascot":"brand"})}catch{}}function Mf(e){const t=e?.target;if(typeof HTMLImageElement<"u"&&!(t instanceof HTMLImageElement))return;if(!t||t.dataset?.fallbackApplied==="true"){t&&(t.hidden=!0);return}const a=xf(t);if(!a||fc(t,a)){t.hidden=!0,hc(t,"","hidden");return}t.dataset.fallbackApplied="true",t.loading=t.loading||"eager",t.src=a,hc(t,a,"fallback")}function Yo(){Yo.installed||(Yo.installed=!0,document.addEventListener("error",Mf,!0))}function Qo(){if(!Qo.started){Qo.started=!0;for(const e of Lf)try{const t=new Image;t.decoding="async",t.loading="eager",t.src=e}catch{}}}function ja(e=window.location.pathname){return(e==="/"||e==="")&&sc()?"connect":e.startsWith("/login")||e.startsWith("/account/login")?"login":e.startsWith("/connect")?"connect":e.startsWith("/ogre-tek")||e.startsWith("/launch-coin")||e.startsWith("/terminal")?"terminal":"intro"}function Bf(){if(sc()&&!(window.location.pathname!=="/"&&window.location.pathname!==""))try{window.history.replaceState({},"","/connect")}catch{}}let Fn=null;function Zo(){try{const e=window.AudioContext||window.webkitAudioContext;return e?(Fn||(Fn=new e),Fn.state==="suspended"&&Fn.resume().catch(()=>{}),Fn):null}catch{return null}}function Rf(){const e=Zo();if(!(!e||e.state!=="running"))try{const t=e.currentTime,a=1.7,r=Math.floor(e.sampleRate*a),s=e.createBuffer(1,r,e.sampleRate),o=s.getChannelData(0);for(let f=0;f<r;f+=1)o[f]=(Math.random()*2-1)*(1-f/r);const c=e.createBufferSource();c.buffer=s;const l=e.createBiquadFilter();l.type="bandpass",l.Q.value=.7,l.frequency.setValueAtTime(280,t),l.frequency.exponentialRampToValueAtTime(3400,t+.55),l.frequency.exponentialRampToValueAtTime(170,t+a);const d=e.createGain();d.gain.setValueAtTime(1e-4,t),d.gain.exponentialRampToValueAtTime(.5,t+.16),d.gain.exponentialRampToValueAtTime(1e-4,t+a),c.connect(l).connect(d).connect(e.destination);const u=e.createOscillator();u.type="sine",u.frequency.setValueAtTime(150,t),u.frequency.exponentialRampToValueAtTime(46,t+.95);const p=e.createGain();p.gain.setValueAtTime(1e-4,t),p.gain.exponentialRampToValueAtTime(.38,t+.08),p.gain.exponentialRampToValueAtTime(1e-4,t+1.15),u.connect(p).connect(e.destination),c.start(t),c.stop(t+a),u.start(t),u.stop(t+1.2)}catch{}}function If(){const e=document.querySelector("[data-intro-gate]");if(!e||e.dataset.introReady==="true")return;e.dataset.introReady="true";const t=e.querySelector("[data-intro-stage]"),a=e.querySelector('[data-intro-video="entry"]'),r=e.querySelector("[data-intro-status]");let s=!1,o=null;const c=()=>n.route==="intro"&&!e.hidden&&!e.closest("[hidden]"),l=A=>{t&&(t.dataset.introPhase=A)},d=A=>{r&&(r.textContent=A,r.hidden=!A)},u=()=>{s||(s=!0,o&&(clearTimeout(o),o=null),l("portal"),Rf(),hf(),setTimeout(()=>{Bn({reset:!0}),Pe("/connect")},620))};if(!c()){Bn({reset:!0});return}const p=()=>{s||(Zo(),a&&a.muted&&(a.muted=!1,a.volume=1,a.play?.().catch(()=>{})))};["pointerdown","touchstart","keydown"].forEach(A=>{document.addEventListener(A,p,{once:!0,passive:!0})}),a&&(a.preload="auto",a.playsInline=!0,a.autoplay=!0,a.setAttribute("autoplay",""),a.setAttribute("playsinline",""),a.disablePictureInPicture=!0,!a.getAttribute("src")&&a.dataset.introSrc&&(a.src=a.dataset.introSrc));const f=A=>{o&&clearTimeout(o),o=setTimeout(()=>{c()&&u()},Math.max(4e3,Math.min(22e3,A)))},y=()=>{if(s||!c())return;const A=g=>{if(!a)return;a.muted=g,a.volume=g?0:1;const $=a.play?.();$?.catch&&$.catch(()=>{g?d(""):A(!0)})};Zo(),A(!1)};a?.addEventListener("loadedmetadata",()=>{const A=Number(a.duration);f(Number.isFinite(A)&&A>0?(A+2.5)*1e3:9e3)}),a?.addEventListener("ended",u),a?.addEventListener("error",()=>{f(1500)});let b=!1,v=null;const P=()=>{b||s||!c()||(b=!0,y())};a?(a.readyState>=4?P():(a.addEventListener("canplaythrough",P,{once:!0}),setTimeout(P,2800)),a.addEventListener("waiting",()=>{!b||s||(v&&clearTimeout(v),v=setTimeout(()=>{c()&&u()},900))}),["playing","timeupdate"].forEach(A=>a.addEventListener(A,()=>{v&&(clearTimeout(v),v=null)}))):P(),f(11e3)}function gc(e=window.location.pathname){return e.includes("/ogre-tek")?"ogreTek":e.includes("/chart")?"smartChart":e.includes("/tx-audit")?"txAudit":e.includes("/slime-scope")?"slimeScope":e.includes("/trade")?"trade":e.includes("/kol")?"kol":e.includes("/live-pairs")?"live":e.includes("/positions")?"positions":"terminal"}function ei({keepLogin:e=!1}={}){n.walletConnectMenuOpen=!1,e||(n.loginModalOpen=!1),n.quickBuyModal?.open&&(n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""}),Yn()}function bc(){try{if(n.route!=="terminal")return;if(n.activeTab==="terminal"){const e=lo();n.terminalSort=e[3]||"newest",n.terminalCat=e[0]||"fresh"}else if(n.activeTab==="live"){const e=so();n.terminalSort=e[3]||"newest",n.terminalCat=e[0]||"fresh"}else if(n.activeTab==="slimeScope"){const e=Ar();n.terminalSort=e[3]||"volume",n.terminalCat=e[0]||"dexTrending"}}catch{}}function Pe(e,t=null){const a=L(),r=e||"/terminal";n.route=ja(r),ei({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.route==="terminal"&&(n.activeTab=t||gc(r)),bc(),n.route!=="intro"&&Bn({reset:!0}),window.history.pushState({},"",r),al(),h(),K("route-change",a,{component:"router",details:r})}window.addEventListener("popstate",()=>{n.route=ja(),ei({keepLogin:n.route==="login"}),n.route==="login"&&(n.loginModalOpen=!0),n.activeTab=gc(),bc(),n.route!=="intro"&&Bn({reset:!0}),al(),h()});let yc=!1;function ti(){document.querySelectorAll("[data-market-ticker]").forEach(e=>{const t=!!e.querySelector("details.swamp-ticker-item[open]");e.classList.toggle("is-ticker-menu-open",t),t||(e.style.removeProperty("--ticker-menu-left"),e.style.removeProperty("--ticker-menu-top"))})}function zr(e=null){document.querySelectorAll("[data-market-ticker] details.swamp-ticker-item[open]").forEach(t=>{e&&t===e||(t.open=!1)}),ti()}function Of(e){if(!e)return;const t=!e.open;if(zr(e),e.open=t,t){const a=e.closest("[data-market-ticker]"),s=e.querySelector("summary")?.getBoundingClientRect?.();if(a&&s){const o=Math.max(10,Math.min(window.innerWidth-10,s.left+s.width/2)),c=Math.max(30,s.bottom+4);a.style.setProperty("--ticker-menu-left",`${Math.round(o)}px`),a.style.setProperty("--ticker-menu-top",`${Math.round(c)}px`)}}ti()}function Ef(){yc||(yc=!0,document.addEventListener("click",e=>{const t=e.target;if(!t?.closest?.("[data-market-ticker]")){zr();return}if(t?.closest?.(".swamp-ticker-links a")){window.setTimeout(()=>zr(),80);return}const a=t?.closest?.("[data-market-ticker] details.swamp-ticker-item > summary");a&&(e.preventDefault(),e.stopPropagation(),Of(a.closest("details.swamp-ticker-item")))},!0),document.addEventListener("toggle",e=>{e.target?.matches?.("[data-market-ticker] details.swamp-ticker-item")&&ti()},!0),document.addEventListener("keydown",e=>{e.key==="Escape"&&zr()}))}function Ga(e){return`${Ia}${e}`}function L(){try{return window.performance?.now?.()||Date.now()}catch{return Date.now()}}function oa(e){try{window.performance?.mark?.(e)}catch{}}function ke(e="",t=90){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@,+-]/g,"").trim().slice(0,t)}function vc(e={}){qa.push(e),qa.length>10&&qa.splice(0,qa.length-10),!Do&&(Do=window.setTimeout(()=>{Do=null;const t=qa.splice(0,qa.length);for(const a of t)try{const r=JSON.stringify(a),s=Ga("/api/web/perf-event");if((s.charAt(0)==="/"||s.indexOf(location.origin)===0)&&navigator.sendBeacon){const c=new Blob([r],{type:"application/json"});if(navigator.sendBeacon(s,c))continue}fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}},750))}function ai(e,t,a){if(a==="perf"&&Uo||a==="crash"&&qo||a==="feed"&&Ho)return;const r=()=>{try{window.localStorage?.setItem(e,JSON.stringify(t()||[]))}catch{}},s=window.setTimeout(()=>{a==="perf"&&(Uo=null),a==="crash"&&(qo=null),a==="feed"&&(Ho=null),r()},Xm);a==="perf"&&(Uo=s),a==="crash"&&(qo=s),a==="feed"&&(Ho=s)}function W(e={}){const t=Number(e.durationMs);Number.isFinite(t)&&t>=2500&&se("slowApiRequestWarning");const a={at:new Date().toISOString(),route:ke(e.route||n.route||ja(),40),component:ke(e.component||"",60),action:ke(e.action||"",70),durationMs:Number.isFinite(t)?Math.max(0,Math.round(t)):0,resultCount:Number.isFinite(Number(e.resultCount))?Math.max(0,Math.round(Number(e.resultCount))):0,cacheHit:!!e.cacheHit,stale:!!e.stale,requestId:ke(e.requestId||"",80),errorCode:ke(e.errorCode||"",60),details:ke(e.details||"",140)};return n.perfLog=[...n.perfLog||[],a].slice(-100),ai(zl,()=>n.perfLog,"perf"),(a.durationMs>=Gm||/refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(a.action))&&vc(a),a}function K(e,t,a={}){W({...a,action:e,durationMs:L()-t})}window.SlimeWireChartFrameLoaded=function(t="chart",a=""){oa("chartFirstPaint"),W({component:"smartChart",action:"chart-first-paint",durationMs:0,cacheHit:!!tt(a)?.cacheHit,stale:!!tt(a)?.stale,details:`${ke(t,20)}:${ke(a,60)}`})};function ni(e={}){const t={at:new Date().toISOString(),route:ke(e.route||n.route||ja(),40),actionBeforeCrash:ke(e.actionBeforeCrash||n.postTradeRefresh?.action||"",70),errorCode:ke(e.errorCode||e.name||"FRONTEND_ERROR",60),message:ke(e.message||"",160),component:ke(e.component||"",80),requestId:ke(e.requestId||n.postTradeRefresh?.attemptId||"",80),caughtByBoundary:!!e.caughtByBoundary};return n.crashLog=[...n.crashLog||[],t].slice(-50),ai(jl,()=>n.crashLog,"crash"),vc({...t,component:t.component||"frontend-crash",action:"frontend-crash",durationMs:0,details:t.message}),t}function Ff(){n.crashInstrumentationInstalled||(n.crashInstrumentationInstalled=!0,window.addEventListener("error",e=>{e?.target&&e.target!==window||ni({errorCode:e?.error?.name||"WINDOW_ERROR",message:e?.message||e?.error?.message||"Window error",component:"window.onerror"})}),window.addEventListener("unhandledrejection",e=>{const t=e?.reason||{};ni({errorCode:t?.name||"UNHANDLED_REJECTION",message:t?.message||String(t||"Unhandled promise rejection"),component:"window.unhandledrejection"})}))}function vt(e="attempt"){const t=String(e||"attempt").replace(/[^\w-]/g,"").slice(0,24)||"attempt";return globalThis.crypto?.randomUUID?.()?`${t}-${globalThis.crypto.randomUUID()}`:`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function ri(e="",t="",a=""){return`${String(e||"").trim()}:${String(t||"").trim()}:${String(a||"").trim()}`}function st(e="",t="",a=""){const r=ri(e,t,a),s=n.tradeActionLocks?.[r];return s&&["clicked","submitting","submitted","confirming"].includes(s.state)?s:null}function z(e="",t="",a="",r={}){const s=ri(e,t,a),o=n.tradeActionLocks?.[s]||{};n.tradeActionLocks={...n.tradeActionLocks||{},[s]:{...o,action:e,tokenMint:t,detail:a,updatedAt:new Date().toISOString(),...r}},de()}function Le(e="",t="",a="",r=2400){const s=ri(e,t,a);window.setTimeout(()=>{const o=n.tradeActionLocks?.[s];if(!o||["clicked","submitting","confirming"].includes(o.state))return;const c={...n.tradeActionLocks||{}};delete c[s],n.tradeActionLocks=c,de(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},r)}function jr(e="",t=""){return`${String(e||"").trim()}:${String(t||"").trim()}`}function si(e="",t=""){const a=n.manualSellActions?.[jr(e,t)];return a&&["clicked","submitting","submitted","confirming"].includes(a.state)?a:Object.entries(n.manualSellActions||{}).find(([r,s])=>r.startsWith(`${String(e||"").trim()}:`)&&["clicked","submitting","submitted","confirming"].includes(s?.state))?.[1]||null}function ia(e,t,a={}){const r=jr(e,t),s=n.manualSellActions?.[r]||{};n.manualSellActions={...n.manualSellActions||{},[r]:{...s,tokenMint:e,percent:String(t||s.percent||"100"),updatedAt:new Date().toISOString(),...a}},de()}function oi(e,t,a=2400){const r=jr(e,t);window.setTimeout(()=>{const s=n.manualSellActions?.[r];if(!s||["clicked","submitting","confirming"].includes(s.state))return;const o={...n.manualSellActions||{}};delete o[r],n.manualSellActions=o,de(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})},a)}function Xa(e,t={}){const a=L(),r=t.startedAt||n.positionRefreshAction?.startedAt||a;n.positionRefreshAction={state:e,startedAt:r,minUntil:Math.max(n.positionRefreshAction?.minUntil||0,a+(e==="clicked"||e==="success"?700:0)),error:"",updatedAt:new Date().toISOString(),...t},de()}function je(e,t={}){const a=n.positionRefreshAction?.minUntil||0,r=Math.max(0,a-L());Dr&&window.clearTimeout(Dr),Dr=window.setTimeout(()=>{Dr=null,Xa(e,t),h(),e==="success"&&window.setTimeout(()=>{n.positionRefreshAction?.state==="success"&&(n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},de(),h())},900)},r)}function Et(e){return e?(e.dataset.baseLabel||(e.dataset.baseLabel=e.textContent.trim()||"Refresh"),e.dataset.baseLabel):""}function de(){if(document.hidden)return;document.querySelectorAll("[data-position-sell]").forEach(o=>{const c=o.dataset.positionSell||"",l=o.dataset.positionSellPercent||"",d=si(c,l),u=Et(o),p=n.manualSellActions?.[jr(c,l)],f=!!d;o.disabled=f,o.dataset.actionState=p?.state||d?.state||"idle",f?p?.state==="submitted"||p?.state==="confirming"?o.textContent="Submitted":o.textContent="Selling...":o.textContent=u});const e=String(n.tradeToken||m("[data-trade-token]")?.value||"").trim();document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach(o=>{const c=o.dataset.tradeBuyQuick||(o.matches("[data-trade-buy-max]")?"max":"custom"),l=st("trade-buy",e,c),d=Et(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":"Buying...":d}),document.querySelectorAll("[data-quick-trade-token]").forEach(o=>{const c=o.dataset.quickTradeToken||"",l=ut(),d=ze(l)||l?.amountSol||"quick",u=st("trade-buy",c,String(d)),p=Et(o);o.disabled=!!u,o.dataset.actionState=u?.state||"idle",o.textContent=u?u.state==="submitted"?"Submitted":"Buying...":p}),document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach(o=>{const c=o.dataset.tradeSellQuick||"custom",l=st("trade-sell",e,c),d=Et(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":"Selling...":d}),document.querySelectorAll("[data-chart-confirm-buy]").forEach(o=>{const c=o.dataset.chartConfirmBuy||n.smartChartToken||"",l=Y(m("[data-chart-buy-amount]")?.value||"")||"custom",d=st("trade-buy",c,String(l)),u=Et(o);o.disabled=!!d,o.dataset.actionState=d?.state||"idle",o.textContent=d?d.state==="submitted"?"Submitted":"Buying...":u}),document.querySelectorAll("[data-chart-confirm-sell]").forEach(o=>{const c=o.dataset.chartConfirmSell||n.smartChartToken||"",l=m("[data-chart-sell-percent]")?.value||"100",d=si(c,l),u=Et(o);o.disabled=!!d,o.dataset.actionState=d?.state||"idle",o.textContent=d?d.state==="submitted"?"Submitted":"Selling...":u});const t=String(n.bundleToken||m("[data-bundle-token]")?.value||"").trim();document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach(o=>{const c=o.matches("[data-bundle-buy]")?"bundle-buy":"bundle-sell",l=st(c,t,"bundle"),d=Et(o);o.disabled=!!l,o.dataset.actionState=l?.state||"idle",o.textContent=l?l.state==="submitted"?"Submitted":c==="bundle-buy"?"Buying...":"Selling...":d});const a=(o,c)=>{const l=Et(o),d=o.matches?.("[data-top-refresh-wallet]");if(o.dataset.actionState=c,o.toggleAttribute("aria-busy",c==="clicked"||c==="refreshing"),d){o.title=c==="clicked"||c==="refreshing"?"Refreshing wallet, positions, and PnL.":c==="success"?"Wallet refresh completed.":c==="error"?"Wallet refresh failed. Tap to retry.":"Refresh wallet, positions, and PnL.",o.textContent=l||"Refresh";return}c==="clicked"||c==="refreshing"?o.textContent="Refreshing...":c==="success"?o.textContent="Updated":c==="error"?o.textContent="Failed":o.textContent=l},r=n.positionRefreshAction?.state||"idle";document.querySelectorAll("[data-refresh-all]").forEach(o=>{a(o,r)});const s=n.walletRefreshing?"refreshing":r;document.querySelectorAll("[data-top-refresh-wallet]").forEach(o=>{a(o,s)})}function Wf(){if(!n.perfInstrumentationInstalled){n.perfInstrumentationInstalled=!0,oa("slimewire:app-boot");try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries())Number(a.duration||0)<50||W({component:"main-thread",action:"long-task",durationMs:a.duration,details:a.name||"longtask"})}).observe({type:"longtask",buffered:!0})}catch{}try{if(!("PerformanceObserver"in window))return;new PerformanceObserver(t=>{for(const a of t.getEntries()){const r=Number(a.duration||0);r<80||W({component:"input",action:"interaction-delay",durationMs:r,details:a.name||a.entryType||"event"})}}).observe({type:"event",buffered:!0,durationThreshold:80})}catch{}}}function xe(e){return new Promise(t=>setTimeout(t,e))}function N(e="",t={}){const a=String(e||"");return t.preserveSafeError?a:/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(a)?"SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.":a}async function Wn(e,t={},a=Cn){const r=new AbortController,s=setTimeout(()=>r.abort(),a);try{return await fetch(e,{...t,signal:r.signal})}finally{clearTimeout(s)}}async function wc(e){try{await Wn(`${e}/wake`,{cache:"no-store"},8e3)}catch{}}async function k(e,t={}){const{timeoutMs:a=Cn,preserveSafeError:r=!1,dedupe:s=!0,...o}=t||{},c=String(o.method||"GET").toUpperCase(),l=L(),d=s&&c==="GET"?`${c}:${e}:${n.token?n.token.slice(0,12):"guest"}`:"";if(d&&ra.has(d))return se("duplicateApiRequestsPrevented"),W({component:"api",action:"api-dedupe",durationMs:0,cacheHit:!0,details:e}),ra.get(d);const u=(async()=>{const p={"Content-Type":"application/json",...o.headers||{}};n.token&&(p.Authorization=`Bearer ${n.token}`);let f,y=null;try{f=await Wn(Ga(e),{...o,headers:p,cache:"no-store"},a)}catch(v){y=v,await wc(Ia),await xe(900);try{f=await Wn(Ga(e),{...o,headers:p,cache:"no-store"},a)}catch(P){y=P;for(const A of Vl)if(A!==Ia)try{await wc(A),f=await Wn(`${A}${e}`,{...o,headers:p,cache:"no-store"},a),Ia=A;break}catch(g){y=g}if(!f){const A=y?.name==="AbortError"?"The request timed out.":"The browser blocked or could not open the request.";throw new Error(`${A} SlimeWire could not connect right now. Try again in a moment.`)}}}const b=await Sc(f);if(!f.ok||b.ok===!1){const v=r||e==="/api/web/launch/coin"||!!(b.launchAttemptId||b.launch?.launchAttemptId),P=N(b.message||b.launch?.failureReason||b.error||`HTTP ${f.status}`,{preserveSafeError:v}),A=new Error(P);throw A.status=f.status,A.data=b,A.code=b.errorCode||b.launch?.errorCode||b.error||"",A.stage=b.stage||b.launch?.stage||"",A.launchAttemptId=b.launchAttemptId||b.launch?.launchAttemptId||"",A.providerStatus=b.providerStatus||b.launch?.providerStatus||null,f.status===401&&Qf(P),A}return K("api-request",l,{component:"api",details:e,resultCount:Array.isArray(b?.rows)?b.rows.length:0}),b})();return d&&(ra.set(d,u),u.then(()=>{ra.get(d)===u&&ra.delete(d)},()=>{ra.get(d)===u&&ra.delete(d)})),u}async function Sc(e){const t=e.headers.get("content-type")||"",a=await e.text();if(!a.trim())return{};try{return JSON.parse(a)}catch{const r=a.toLowerCase(),s=e.status===413||r.includes("payload too large")||r.includes("request entity too large");return{ok:!1,error:s?"payload_too_large":"invalid_api_response",message:s?"Launch upload is too large. Use a smaller token image and try again.":t.includes("text/html")?"SlimeWire received an unexpected page response. Refresh and try again.":"SlimeWire received an unexpected response. Refresh and try again."}}}function _f(e){return e==="privacy"?["Slime Policy","","SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.","","Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.","","We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.","","Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."].join(`
`):["Slimeness","","By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.","","Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.","","You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.","","Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."].join(`
`)}function he(e){e&&(n.user=e,Object.prototype.hasOwnProperty.call(e,"xHandle")?(n.xHandle=et(e.xHandle),n.xHandle?ec(n.xHandle):Fo()):n.xHandle||(n.xHandle=Zl()))}function Gr(e){for(const t of e){const a=Nn(t);if(a&&!a.closest("[hidden]"))return String(a.value||"")}for(const t of e){const a=m(t);if(a)return String(a.value||"")}return""}function _n(){const e=m("[data-connect-status]");return e&&!e.closest("[hidden]")?e:Nn("[data-login-status]")||e}function Nn(e){const t=[...document.querySelectorAll(e)];return t.find(a=>!a.closest("[hidden]")&&a.offsetParent!==null)||t.find(a=>!a.closest("[hidden]"))||t[0]||null}function Dn(){return Nn("[data-wallet-connect-modal] [data-wallet-connect-status]")||Nn("[data-wallet-connect-status]")}function oe(e=""){n.walletConnectStatus=String(e||""),S(Dn(),n.walletConnectStatus)}function kc(e="solana"){const t=_e(e);return Ge()?qn(e)?`${t} is not injected in this browser. Tap Open ${t} to use the mobile wallet connect flow, or choose another wallet option.`:xc(e)?`${t} is not injected in this browser. Use Open ${t} to continue in the wallet app, or choose another wallet option.`:`${t} is not available in this browser. Install or open the wallet app, or choose another wallet option.`:`${t} extension not found. Install or unlock ${t}, or choose another wallet.`}function Ft(e="solana",t=null,a={}){const r=ge(e),s={walletName:_e(e,r),userId:n.user?.id||"",route:n.route,adapterReadyState:r?"detected":"not_detected",errorName:t?.name||"",errorMessage:String(t?.message||t||"").slice(0,240),...a};try{console.warn("[slimewire_wallet_connect]",s)}catch{}}function $c(e=n.route==="connect"){window.setTimeout(()=>{const t=n.loginModalOpen?`[data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-username], [data-login-modal-${n.loginModalTab==="create"?"create":"login"}-section] [data-login-password]`:e?"[data-connect-login-username], [data-connect-login-password]":"[data-login-username], [data-login-password]";Nn(t)?.focus?.()},0)}function Nf(){const e=document.activeElement;e instanceof HTMLElement&&!e.closest("[data-login-modal]")&&(Wo=e)}function Df(){const e=Wo;Wo=null,window.setTimeout(()=>{e?.isConnected&&typeof e.focus=="function"&&e.focus({preventScroll:!0})},0)}function Tc({restoreFocus:e=!0}={}){const t=!!n.loginModalOpen;n.loginCollapsed=!0,n.loginModalOpen=!1,h({force:!0}),t&&e&&Df()}function Uf(){return!Ce||Ce.hidden||!n.loginModalOpen?[]:[...Ce.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e=>!e.closest("[hidden]")&&e.offsetParent!==null)}function qf(e){if(!n.loginModalOpen||e.key!=="Tab"||!Ce||Ce.hidden)return!1;const t=Uf();if(!t.length)return!1;const a=t[0],r=t[t.length-1];return e.shiftKey&&document.activeElement===a?(e.preventDefault(),r.focus({preventScroll:!0}),!0):!e.shiftKey&&document.activeElement===r?(e.preventDefault(),a.focus({preventScroll:!0}),!0):!1}function Ja(){try{return`${window.location.pathname||"/terminal"}${window.location.search||""}${window.location.hash||""}`}catch{return"/terminal"}}function Hf(e=Ja()){return`/login?returnTo=${encodeURIComponent(e||"/terminal")}`}function Ac(e="",t=80){return String(e||"").replace(/[\r\n\t]+/g," ").replace(/[^\w .:/?&=#@-]/g,"").trim().slice(0,t)}function Kf(e="unknown"){const t=Date.now();if(t-Number(n.lastLockInClickAt||0)<300)return;n.lastLockInClickAt=t;const a={route:Ac(n.route||ja(),40),viewport:Math.round(window.innerWidth||0),source:Ac(e,60),at:new Date(t).toISOString()};try{const r=JSON.parse(window.localStorage?.getItem("slimewireLockInClicks")||"[]");r.push(a),window.localStorage?.setItem("slimewireLockInClicks",JSON.stringify(r.slice(-10)))}catch{}try{console.info("LOCK_IN_CLICKED",a)}catch{}try{k("/api/web/lock-in-clicked",{method:"POST",timeoutMs:3e3,body:JSON.stringify(a)}).catch(()=>{})}catch{}}function Pc({defaultTab:e="login",returnTo:t=Ja(),source:a="unknown",connectPanel:r=n.route==="connect"}={}){if(Nf(),Kf(a),n.loginModalOpen=!0,n.loginModalTab=e==="create"?"create":"login",n.loginReturnTo=t||Ja(),n.loginCollapsed=!1,n.walletConnectMenuOpen=!1,!Ce&&!Xo){window.location.assign(Hf(n.loginReturnTo));return}h({force:!0}),$c(r)}function Cc(e={}){Pc(e)}function Ge(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")}function Lc(){try{const e=new URL(window.location.href);return e.hash="",e.toString()}catch{return window.location.href}}function Vf(){try{return new URL(window.location.href).origin}catch{return"https://slimewire.org"}}function xc(e=""){if(!Ge())return"";const t=encodeURIComponent(Lc()),a=encodeURIComponent(Vf());return e==="phantom"?`https://phantom.app/ul/browse/${t}?ref=${a}`:e==="solflare"?`https://solflare.com/ul/v1/browse/${t}?ref=${a}`:""}function ii(e=""){return e==="phantom"?"https://phantom.app/download":e==="solflare"?"https://solflare.com/download":e==="backpack"?"https://backpack.app/download":""}function Ya(e=""){return e==="phantom"?"./assets/slimewire/clean-ui/wallet_icons/default/phantom.png":e==="solflare"?"./assets/slimewire/clean-ui/wallet_icons/default/solflare.png":"./assets/slimewire/svg/icons/wallet.svg"}function li(e){const t=e instanceof Uint8Array?e:new Uint8Array(e||[]);if(!t.length)return"";let a=0n;for(const s of t)a=(a<<8n)+BigInt(s);let r="";for(;a>0n;){const s=Number(a%58n);r=Ql[s]+r,a/=58n}for(const s of t){if(s!==0)break;r="1"+r}return r||"1"}function Xr(e=""){const t=String(e||"").trim();if(!t)return new Uint8Array;let a=0n;for(const s of t){const o=rf.get(s);if(o===void 0)throw new Error("Invalid wallet callback encoding.");a=a*58n+BigInt(o)}const r=[];for(;a>0n;)r.unshift(Number(a&255n)),a>>=8n;for(const s of t){if(s!=="1")break;r.unshift(0)}return new Uint8Array(r)}function zf(e="phantom",t="",a=n.walletConnectReturnPath||"/terminal",r=""){const s=new URL(a||window.location.pathname||"/terminal",window.location.origin);return s.searchParams.delete("sw_wallet"),s.searchParams.delete("sw_wallet_state"),s.searchParams.delete("sw_wallet_pending"),s.searchParams.delete("phantom_encryption_public_key"),s.searchParams.delete("solflare_encryption_public_key"),s.searchParams.delete("nonce"),s.searchParams.delete("data"),s.searchParams.delete("errorCode"),s.searchParams.delete("errorMessage"),s.searchParams.set("sw_wallet",e),s.searchParams.set("sw_wallet_state",t),r&&s.searchParams.set("sw_wallet_pending",r),s.toString()}function Un(){try{const e=new URL(window.location.href);["sw_wallet","sw_wallet_state","sw_wallet_pending","phantom_encryption_public_key","solflare_encryption_public_key","nonce","data","errorCode","errorMessage"].forEach(t=>e.searchParams.delete(t)),window.history.replaceState({},"",`${e.pathname}${e.search}${e.hash}`)}catch{}}function Mc(){try{const e=window.sessionStorage?.getItem(Io)||window.localStorage?.getItem(Oo)||"{}",t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function jf(e){try{window.sessionStorage?.setItem(Io,JSON.stringify(e))}catch{}try{window.localStorage?.setItem(Oo,JSON.stringify(e))}catch{}}function ci(){try{window.sessionStorage?.removeItem(Io)}catch{}try{window.localStorage?.removeItem(Oo)}catch{}}function Bc(e=""){return e==="solflare"?"solflare_encryption_public_key":"phantom_encryption_public_key"}function qn(e=""){return e==="phantom"?"https://phantom.app/ul/v1/connect":e==="solflare"?"https://solflare.com/ul/v1/connect":""}function Gf(e="",t={}){const a=qn(e);if(!a)return"";const r=new URL(a);return r.searchParams.set("app_url",Lc()),r.searchParams.set("redirect_link",zf(e,t.stateId,t.returnPath,t.pendingConnectId)),r.searchParams.set("dapp_encryption_public_key",t.dappEncryptionPublicKey),r.searchParams.set("cluster","mainnet-beta"),r.toString()}function la(){return/Android/i.test(navigator.userAgent||"")?"android":/iPhone|iPad|iPod/i.test(navigator.userAgent||"")?"ios":Ge()?"mobile":"desktop"}function Rc(e=""){return Ge()&&!!qn(e)}function Xf(){const e=navigator.userAgent||"";return/CriOS|Chrome/i.test(e)?"chrome":/Safari/i.test(e)&&!/Chrome|CriOS/i.test(e)?"safari":/Firefox|FxiOS/i.test(e)?"firefox":"mobile-browser"}async function Jf(e="",t="/terminal"){try{const a=await k("/api/web/mobile-wallet/start",{method:"POST",timeoutMs:Cn,body:JSON.stringify({provider:e,intendedRoute:t,platform:la(),browser:Xf()})});return!a.pendingConnectId||!a.stateId||!a.dappEncryptionPublicKey?null:{providerId:e,pendingConnectId:a.pendingConnectId,stateId:a.stateId,returnPath:a.intendedRoute||t,dappEncryptionPublicKey:a.dappEncryptionPublicKey,createdAt:Date.now(),expiresAt:a.expiresAt||"",serverManaged:!0}}catch(a){return Ft(e,a,{action:"mobile_connect_pending_start_failed",connectionFlow:"deeplink_connect",platform:la()}),null}}function Yf(e="",t="/terminal"){if(!window.nacl?.box?.keyPair||!window.crypto?.getRandomValues)return null;const a=window.nacl.box.keyPair(),r=new Uint8Array(16);return window.crypto.getRandomValues(r),{providerId:e,stateId:li(r),returnPath:t,dappEncryptionPublicKey:li(a.publicKey),dappEncryptionSecretKey:li(a.secretKey),createdAt:Date.now(),serverManaged:!1}}async function Ic(e="",{returnPath:t=n.walletConnectReturnPath||"/terminal"}={}){if(!Rc(e))return!1;const a=await Jf(e,t)||Yf(e,t);if(!a)return!1;jf(a);const r=Gf(e,a);if(!r)return!1;const s=_e(e);return oe(`Opening ${s} mobile connect. Approve in the wallet app, then return to SlimeWire.`),Ft(e,null,{action:"mobile_connect_redirect",adapterReadyState:"mobile_redirect",connectionFlow:"deeplink_connect",platform:la()}),window.location.assign(r),!0}function Oc(e=""){const t=_e(e),a=xc(e);return a?(oe(`Opening ${t}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`),Ft(e,null,{action:"mobile_browse_redirect",adapterReadyState:"mobile_browse",connectionFlow:"browse_fallback",platform:la()}),window.location.href=a,!0):!1}function Ec({requirePassword:e=!1}={}){const t=Gr(["[data-connect-login-username]","[data-login-username]"]).trim(),a=Gr(["[data-connect-login-password]","[data-login-password]"]);if(!t&&!a&&!e)return{};if(!t)throw new Error("Enter your username.");if(!a)throw new Error("Enter your password.");return{username:t,password:a}}function Qf(e=""){n.token="",n.user=null,n.loading=!1,Eo(),h(),T(e||"Your web session expired. Log in, or tap Create Account to start a fresh session.")}async function J(e=null,t="Creating secure web profile..."){if(n.user&&n.token)return n.user;S(e,t);const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({referralCode:nc()})});return n.token=a.token,he(a.user),Mn(n.token),n.user}function T(e=""){[wf,Sf].forEach(t=>{t&&(t.hidden=!e,S(t,e))})}function Q(e){const t=String(e||"").trim();return t?`https://dexscreener.com/solana/${encodeURIComponent(t)}`:"#"}function Zf(e){const t=String(e||"").trim();return t?`https://pump.fun/coin/${encodeURIComponent(t)}`:"#"}function Fc(e){const t=String(e||"").trim();return t?`https://kolscan.io/account/${encodeURIComponent(t)}`:"https://kolscan.io"}async function di(){T("");const e=_n();try{const t=Ec();S(e,t.username?"Creating saved login...":"Creating account...");const a=await k("/api/web/signup",{method:"POST",body:JSON.stringify({...t,referralCode:nc()})});n.token=a.token,he(a.user),Mn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",S(e,t.username?"Account created. Login saved.":"Quick web account created."),V(a.trade?.signature,"account-create")}catch(t){S(e,t.message),T(t.message)}}async function Wc(){T("");const e=_n();try{const t=Ec({requirePassword:!0});S(e,"Logging in...");const a=await k("/api/web/password-login",{method:"POST",body:JSON.stringify(t)});n.token=a.token,he(a.user),Mn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",S(e,"Logged in."),V(a.trade?.signature,"password-login")}catch(t){S(e,t.message),T(t.message)}}function _c(){return Gr(["[data-connect-login-email]","[data-login-email]"]).trim()}function eh(){return Gr(["[data-connect-login-code]","[data-login-code]"]).trim()}function Nc(e=""){const t=String(e||"").trim();if(!t)throw new Error("Enter the email saved on your web account.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))throw new Error("Enter a valid email address.");return t}async function th(){T("");const e=_n();try{const t=Nc(_c());S(e,"Sending login code...");const a=await k("/api/web/email-code",{method:"POST",body:JSON.stringify({email:t})});S(e,a.emailSent?"Code sent. Check your email, then enter it here.":"Code requested. Check your email if delivery is configured.")}catch(t){S(e,t.message),T(t.message)}}async function ah(){T("");const e=_n();try{const t=Nc(_c()),a=eh();if(!a)throw new Error("Enter the login code from your email.");S(e,"Checking login code...");const r=await k("/api/web/login",{method:"POST",body:JSON.stringify({email:t,code:a})});n.token=r.token,he(r.user),Mn(n.token),n.loginCollapsed=!0,n.loginModalOpen=!1,n.activeTab="dashboard",S(e,"Logged in."),V(r.trade?.signature,"email-code-login")}catch(t){S(e,t.message),T(t.message)}}function Dc(e="",t=new URLSearchParams){const a=Mc(),r=t.get("sw_wallet_state")||"";if(!a.stateId||a.stateId!==r||a.providerId!==e)throw new Error("Wallet callback did not match the pending SlimeWire connection.");if(Date.now()-Number(a.createdAt||0)>1200*1e3)throw new Error("Wallet connection expired. Open Connect Wallet and try again.");const s=t.get(Bc(e))||"",o=t.get("nonce")||"",c=t.get("data")||"";if(!s||!o||!c)throw new Error("Wallet approval did not return the expected connection data.");const l=window.nacl;if(!l?.box?.before||!l.box.open?.after)throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");const d=l.box.before(Xr(s),Xr(a.dappEncryptionSecretKey)),u=l.box.open.after(Xr(c),Xr(o),d);if(!u)throw new Error("Unable to verify the wallet approval response.");const p=JSON.parse(new TextDecoder().decode(u)),f=String(p.public_key||p.publicKey||"").trim();if(!f)throw new Error("Wallet approved, but no public address was returned.");return{publicKey:f,session:String(p.session||""),walletEncryptionPublicKey:s,dappEncryptionPublicKey:a.dappEncryptionPublicKey,returnPath:a.returnPath||"/terminal"}}async function Uc(e="",t={}){const a=Dn();await J(a,"Creating secure web profile for connected wallet...");const r=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:t.publicKey,provider:_e(e)})});he(r.user||{...n.user,connectedWallet:r.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:t.publicKey,shortPublicKey:w(t.publicKey),provider:_e(e),tokens:[]};try{window.sessionStorage?.setItem(`${zm}${e}`,JSON.stringify({providerId:e,publicKey:t.publicKey,session:t.session,walletEncryptionPublicKey:t.walletEncryptionPublicKey,dappEncryptionPublicKey:t.dappEncryptionPublicKey,connectedAt:new Date().toISOString()}))}catch{}ci(),Un(),n.walletConnectMenuOpen=!1,oe(`Connected ${w(t.publicKey)}. Opening Live Terminal...`),Pe(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Yr("mobile-wallet-connect")}function nh(e="",t=new URLSearchParams){return{provider:e,pendingConnectId:t.get("sw_wallet_pending")||Mc().pendingConnectId||"",stateId:t.get("sw_wallet_state")||"",queryKeys:[...t.keys()].filter(a=>a!=="data"&&a!=="nonce"),walletEncryptionPublicKey:t.get(Bc(e))||"",nonce:t.get("nonce")||"",data:t.get("data")||"",errorCode:t.get("errorCode")||"",errorMessage:t.get("errorMessage")||""}}async function rh(e="",t={}){t.token&&(n.token=t.token,Mn(n.token)),he(t.user||{...n.user,connectedWallet:t.connectedWallet||t.profile?.connectedWallet||null});const a=t.publicKey||t.connectedWallet?.publicKey||t.profile?.connectedWallet?.publicKey||"";a&&(n.connectedWalletBalance={publicKey:a,shortPublicKey:w(a),provider:t.provider||_e(e),tokens:[]}),ci(),Un(),n.walletConnectMenuOpen=!1,oe(a?`Connected ${w(a)}. Opening Live Terminal...`:"Wallet connected. Opening Live Terminal..."),Pe(t.finalRedirectRoute||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Yr("mobile-wallet-callback")}async function qc(e="",t=new URLSearchParams){const a=await k("/api/web/mobile-wallet/callback",{method:"POST",timeoutMs:Cn,body:JSON.stringify(nh(e,t))});return await rh(e,a),!0}async function sh(){const e=new URLSearchParams(window.location.search||""),t=e.get("sw_wallet")||"";if(!["phantom","solflare"].includes(t))return!1;n.walletConnectMenuOpen=!0;const a=_e(t),r=e.get("sw_wallet_pending")||"",s=e.get("errorCode")||"",o=e.get("errorMessage")||"";if(s||o)return r&&await qc(t,e).catch(()=>{}),ci(),Un(),oe(`${a} did not connect: ${o||s||"request cancelled"}. Choose another wallet or try again.`),Ft(t,new Error(o||s||"Wallet connect cancelled"),{action:"mobile_connect_cancelled",connectionFlow:"deeplink_connect",platform:la()}),h({force:!0}),!0;try{if(oe(`Finishing ${a} mobile connection...`),r)await qc(t,e);else{const c=Dc(t,e);await Uc(t,c)}}catch(c){if(r)try{const l=Dc(t,e);await Uc(t,l)}catch{oe(`${a} mobile connection could not finish: ${c.message}`),Ft(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:la()}),Un(),h({force:!0})}else oe(`${a} mobile connection could not finish: ${c.message}`),Ft(t,c,{action:"mobile_connect_callback_failed",connectionFlow:"deeplink_connect",platform:la()}),Un(),h({force:!0})}return!0}async function oh(){T("");const e=Dn()||_n();try{S(e,"Choose a wallet provider to connect."),ma({returnPath:"/terminal"})}catch(t){S(e,t.message),T(t.message)}}async function ih(){n.user||await di(),n.user&&(n.walletConnectMenuOpen=!1,n.route="terminal",n.activeTab="wallets",n.toolSections={...n.toolSections||{},wallets:n.wallets.length?"balances":"create"},window.history.pushState({},"","/terminal"),h(),n.wallets.length||await Pu())}async function lh(){if(n.logoutPending)return;if(!n.user){n.loginCollapsed=!1,h(),En?.scrollIntoView?.({behavior:"smooth",block:"start"});return}await cu("logging out");const e=String(n.token||"");n.logoutPending=!0;const t=m("[data-logout]");t&&(t.disabled=!0,S(t,"Logging out...")),n.token="",n.user=null,n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="",n.positionRefreshAction={state:"idle",startedAt:0,minUntil:0,error:""},n.manualSellActions={},n.tradeActionLocks={},n.ogreAgentStatus="",Ol(),Eo(),h({force:!0});try{e&&await k("/api/web/logout",{method:"POST",headers:{Authorization:`Bearer ${e}`},timeoutMs:4e3,dedupe:!1})}catch{}finally{n.logoutPending=!1}}async function ch(){if(!n.token){h();return}try{const e=await k("/api/web/me");he(e.user),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),He({force:!1,deep:!1,reason:"session-load"}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})})}catch{n.token="",Eo(),h()}}async function ca(e={}){const t=L();if(!n.user||!n.token){n.wallets=[],n.balances=[],n.positions=[],n.pnl=null,n.connectedWalletBalance=null,n.launchWatches=[],n.presets={trade:[],bundle:[]},n.tradePlans=[],n.watchlist={rows:[],count:0},h();return}const a=!e.silent;a&&(n.loading=!0,h());try{const r=e.force?"?force=true":"";if(e.skipCore){const[y,b,v,P,A]=await Promise.all([k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.pnl=y.pnl||null,n.launchWatches=b.watches||[],n.presets=v.presets||{trade:[],bundle:[]},Vu(),n.watchlist=P.watchlist||{rows:[],count:0},n.tradePlans=A.plans||[],Ps();return}const[s,o,c,l,d,u,p,f]=await Promise.all([k("/api/web/wallets"),k(`/api/web/balances${r}`),k(`/api/web/positions${r}`),k("/api/web/pnl"),k("/api/web/launch/watches"),k("/api/web/presets"),k("/api/web/watchlist"),k("/api/web/trade/plans")]);n.wallets=s.wallets||[],n.balances=o.balances||[],n.connectedWalletBalance=o.connectedWallet||c.connectedWallet||null,n.positions=c.positions||[],n.pnl=l.pnl||null,n.launchWatches=d.watches||[],n.presets=u.presets||{trade:[],bundle:[]},Vu(),n.watchlist=p.watchlist||{rows:[],count:0},n.tradePlans=f.plans||[],Ps(),e.force&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="")}finally{K("load-all",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e.skipCore?"skip-core":"core"}),a&&(n.loading=!1),h()}}async function ui(e={}){if(!n.user||!n.token)return;const t=L(),a=e.requestId||0,r=()=>a&&n.walletRefreshRequestId!==a,s=e.force?"?force=true":"",o=e.force||e.deep?"?force=true":"",c=e.timeoutMs||Cn,l=k("/api/web/wallets",{timeoutMs:c}),d=k(`/api/web/balances${s}`,{timeoutMs:c}),u=k("/api/web/trade/plans",{timeoutMs:c}),p=await d;if(r())return;n.balances=p.balances||[],n.connectedWalletBalance=p.connectedWallet||null,n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("wallet-refresh",t,{component:"wallet",resultCount:n.balances.length,cacheHit:!!p.cacheHit,details:`wallets=${n.wallets.length};connected=${!!n.connectedWalletBalance}`}),e.progress!==!1&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame});const[f,y]=await Promise.all([l.then(b=>({ok:!0,wallets:b})).catch(b=>({ok:!1,error:b})),u.then(b=>({ok:!0,tradePlans:b})).catch(b=>({ok:!1,error:b}))]);if(!r()&&(f.ok&&(n.wallets=f.wallets.wallets||n.wallets||[]),y.ok&&(n.tradePlans=y.tradePlans.plans||n.tradePlans||[],Ps()),e.progress!==!1&&(f.ok||y.ok)&&h({preserveSmartChartFrame:!!e.preserveSmartChartFrame}),e.deep)){const b=L(),v=k(`/api/web/positions${o}`,{timeoutMs:c}).catch(P=>({__error:P}));try{const P=await v;if(P?.__error)throw P.__error;if(r())return;n.connectedWalletBalance=P.connectedWallet||n.connectedWalletBalance||null,n.positions=P.positions||[],n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("positions-refresh",b,{component:"positions",resultCount:n.positions.length,cacheHit:!!P.cacheHit,details:`open=${n.positions.length}`})}catch(P){n.walletRefreshError=P.message||"Position refresh failed.",K("positions-refresh",b,{errorCode:P?.code||P?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(P?.message||"Position refresh failed.")})}}}function Hc(e=n.positions){return(Array.isArray(e)?e:[]).some(t=>{const a=t?.estimatedValueSol!==null&&t?.estimatedValueSol!==void 0&&t?.estimatedValueSol!=="";return!!(t?.valuePending||!a&&/refreshing|updating|background/i.test(t?.valueError||""))})}function Kc(e=120,t="positions-value-followup"){!n.user||!n.token||(Ur&&window.clearTimeout(Ur),Ur=window.setTimeout(()=>{Ur=null,wt({force:!0,fast:!1,silent:!0,followUpValues:!1,reason:t,timeoutMs:Qt}).then(a=>{a?(n.lastWalletRefreshAt=new Date().toISOString(),h({preserveSmartChartFrame:n.activeTab==="smartChart"})):Jr(`${t}-failed`)}).catch(()=>Jr(`${t}-failed`))},Math.max(0,Number(e)||0)))}function dh(e=[],t=[],a={}){const r=new Map((Array.isArray(t)?t:[]).map(s=>[String(s?.tokenMint||""),s]));return(Array.isArray(e)?e:[]).map(s=>{const o=r.get(String(s?.tokenMint||""));if(!o||a.fast===!1)return s;const c=!!(s?.valuePending||/refreshing|updating|background/i.test(s?.valueError||"")),l=o.estimatedValueSol!==null&&o.estimatedValueSol!==void 0&&o.estimatedValueSol!=="";return!c||!l?s:{...s,estimatedValueSol:o.estimatedValueSol,openPnlSol:o.openPnlSol,openPnlPercent:o.openPnlPercent,valuePending:!1,valueError:""}})}function Jr(e="positions-value-refresh-delayed"){let t=!1;return n.positions=(Array.isArray(n.positions)?n.positions:[]).map(a=>{const r=a?.estimatedValueSol!==null&&a?.estimatedValueSol!==void 0&&a?.estimatedValueSol!=="";return!(a?.valuePending||/refreshing|updating|background/i.test(a?.valueError||""))?a:(t=!0,{...a,valuePending:!1,valueError:r?"":"Price refresh delayed; tap Refresh."})}),t?(K("positions-value-refresh-cleanup",L(),{component:"positions",details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):!1}function Vc(e="portfolio-supplemental"){if(!n.user||!n.token)return;const t=L();Promise.allSettled([k("/api/web/balances?force=true",{timeoutMs:Qt}),k("/api/web/pnl?force=true",{timeoutMs:Qt,dedupe:!1})]).then(([a,r])=>{a.status==="fulfilled"&&(n.balances=a.value.balances||n.balances||[],n.connectedWalletBalance=a.value.connectedWallet||n.connectedWalletBalance||null),r.status==="fulfilled"&&(n.pnl=r.value.pnl||n.pnl||null),n.lastWalletRefreshAt=new Date().toISOString(),K("portfolio-supplemental-refresh",t,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:e}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}).catch(()=>{})}async function wt(e={}){if(!n.user||!n.token)return;const t=L(),a=new URLSearchParams;e.force&&a.set("force","true"),e.fast!==!1&&a.set("fast","true");const r=a.toString()?`?${a.toString()}`:"",s=r||"full";if(In&&_o===s)return In;const o=++No;return _o=s,In=(async()=>{try{const c=await k(`/api/web/positions${r}`,{timeoutMs:e.timeoutMs||(e.fast===!1?Qt:Bo)});return No!==o?!1:(n.connectedWalletBalance=c.connectedWallet||n.connectedWalletBalance||null,n.positions=dh(c.positions||n.positions||[],n.positions||[],e),n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshError="",K("positions-refresh",t,{component:"positions",resultCount:n.positions.length,cacheHit:!!c.cacheHit,details:`${e.reason||(e.silent?"silent":"refresh")};fast=${e.fast!==!1}`}),e.followUpValues&&e.fast!==!1&&Hc(n.positions)&&Kc(120,`${e.reason||"positions"}-values`),e.syncPnl&&Vc(`${e.reason||"positions"}-sync-pnl`),!0)}catch(c){return e.silent||(n.walletRefreshError=c.message||"Position refresh failed."),K("positions-refresh",t,{errorCode:c?.code||c?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(c?.message||"Position refresh failed.")}),!1}finally{No===o&&(In=null,_o="")}})(),In}async function uh(e={}){if(!n.user||!n.token){T("Connect your wallet before refreshing positions."),je("error",{error:"Wallet not connected"});return}const t=L();Xa("refreshing",{startedAt:n.positionRefreshAction?.startedAt||t}),n.walletRefreshError="",Ee("[data-sync-health]",rs()),de(),await xe(20);try{if(!await wt({force:!!e.force,fast:!1,silent:!1,followUpValues:!1,reason:e.reason||"positions-only",timeoutMs:Qt}))throw new Error(n.walletRefreshError||"Position refresh failed.");n.lastWalletRefreshAt=new Date().toISOString(),je("success",{error:""}),Vc(`${e.reason||"positions-only"}-balances-pnl`),Hc(n.positions)&&Kc(120,`${e.reason||"positions-only"}-full-values`),K("positions-only-refresh",t,{component:"positions",resultCount:n.positions.length,details:e.reason||"positions-only"})}catch(a){const r=a?.message||"Position refresh failed.";n.walletRefreshError=r,je("error",{error:N(r)}),T(r),K("positions-only-refresh",t,{errorCode:a?.code||a?.name||"POSITIONS_REFRESH_FAILED",component:"positions",details:N(r)})}finally{h()}}function Hn(){return String(n.smartChartToken||n.tradeToken||n.bundleToken||n.volumeToken||n.terminalToken||"").trim()}function Xe(e=n.activeTab){return Cf[e]||null}function Qa(e=Xe()){return String(e?.cacheKey||e?.tabKey||"terminal:unknown").replace("{bucket}",tn(n.livePairBucket)).replace("{sort}",String(n.terminalSort||"best")).replace("{scopeMode}",String(n.slimeScopeMode||"new")).replace("{kolMode}",String(n.kolMode||"hot")).replace("{kolWallet}",n.kolWallet?w(n.kolWallet):"global").replace("{scanMode}",String(n.scanMode||"safe")).replace("{tokenMint}",Hn()?w(Hn()):"none")}function zc(e=n.activeTab,t="pageSize",a=25){const r=Xe(e),s=Number(r?.[t]);return Number.isFinite(s)&&s>0?s:a}function Za(e=n.activeTab){return zc(e,"pageSize",25)}function pi(e=n.activeTab){return Math.max(Za(e),zc(e,"maxPageSize",Za(e)))}function jc(e=n.activeTab){return!!Xe(e)?.supportsPagination}function mi(e=n.activeTab){const t=Xe(e)||{tabKey:e};return`${e}:${Qa(t)}`}function Kn(e=n.activeTab,t=0){const a=mi(e),r=Za(e),s=pi(e),o=Number(n.terminalFeedVisibleLimits?.[a]||0),c=Number.isFinite(o)&&o>0?o:r,l=Number(t||0),d=Math.min(Math.max(r,c),s);return l>0?Math.min(d,l):d}function Z(e=n.activeTab){const t=mi(e);if(!n.terminalFeedVisibleLimits?.[t])return;const a={...n.terminalFeedVisibleLimits||{}};delete a[t],n.terminalFeedVisibleLimits=a}function ph(e=n.activeTab,t=0){const a=mi(e),r=Kn(e,t),s=Za(e),o=pi(e),c=Number(t||0),l=Math.min(o,c>0?c:o,r+s);return n.terminalFeedVisibleLimits={...n.terminalFeedVisibleLimits||{},[a]:l},l}function ot(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return a.slice(0,Kn(e,a.length))}function mh(e=n.activeTab,t=[]){const a=Array.isArray(t)?t:[];return jc(e)&&a.length>Kn(e,a.length)}function da(e=n.activeTab,t=[],a="rows"){const r=Array.isArray(t)?t:[];if(!mh(e,r))return"";const s=Kn(e,r.length);return`
    <div class="feed-load-more-row">
      <small>${i(s)} of ${i(r.length)} ${i(a)} shown</small>
      <button type="button" data-terminal-load-more="${i(e)}">Load More</button>
    </div>
  `}function j(e=n.activeTab){return n.terminalFeeds[e]||{}}function Gc(e=n.activeTab){return e==="live"||e==="terminal"||e==="slimeScope"?ua():e==="kol"?n.kolLastUpdatedAt||"":e==="watchlist"?j("watchlist").lastFetchAt||"":["wallets","positions","trade","bundle","volume","smartChart"].includes(e)?n.lastWalletRefreshAt||j(e).lastFetchAt||"":j(e).lastFetchAt||""}function Wt(e=n.activeTab){return e==="terminal"?Number(qe()?.rows?.length||0)+Number(n.kolScan?.rows?.length||0):e==="live"?Number(qe()?.rows?.length||0):e==="liveTrades"?Number(n.pnl?.trades?.length||0):e==="slimeScope"?Number(Bp?.(n.slimeScopeMode)?.length||0):e==="kol"?Number(n.kolScan?.rows?.length||0):e==="watchlist"?Number(n.watchlist?.rows?.length||0):e==="smartChart"?Hn()?1:Number(gr?.()?.length||0):e==="trade"||e==="bundle"||e==="volume"?Hn()?1:0:e==="sniper"?Number(n.scan?.rows?.length||0):e==="launch"||e==="launchCoin"?Number(n.launchWatches?.length||0):e==="wallets"?Number(n.wallets?.length||0)+Number(n.balances?.length||0):e==="positions"?Number(n.positions?.length||0):e==="pnl"?Number(n.pnl?.trades?.length||0):e==="ogreAi"?n.ogreAiResult?1:0:e==="ogreTek"?Number(n.ogreTek?.markets?.length||0)+Number(n.ogreTek?.positions?.length||0):0}function Vn(e=n.activeTab){const t=Wt(e);return["live","liveTrades","slimeScope","kol","watchlist","sniper"].includes(e)?Math.min(t,Kn(e,t)):t}function zn(e=n.activeTab){const t=Xe(e);if(!t)return!1;const a=Date.parse(Gc(e)||"");return Number.isFinite(a)?Date.now()-a>Number(t.staleMs||3e4):!0}function Xc(e=n.activeTab){return Wt(e)>0||!!Gc(e)}function fh(e=n.activeTab,t={}){const a=Xe(e)||{};return{tabKey:e,label:a.label||e,category:a.category||"unknown",endpoint:a.endpoint||"",cacheKey:Qa(a),requestId:t.requestId||"",status:t.status||"unknown",reason:t.reason||"",resultCount:Number(t.resultCount||0),renderedCount:Number(t.renderedCount??Vn(e)??0),pageSize:Za(e),maxPageSize:pi(e),supportsPagination:jc(e),hasMore:!!(t.hasMore??Wt(e)>Vn(e)),nextCursor:String(t.nextCursor||"").slice(0,80),stale:!!t.stale,errorCode:String(t.errorCode||"").slice(0,80),errorMessage:String(t.errorMessage||"").slice(0,160),at:new Date().toISOString()}}function Jc(e=n.activeTab,t={}){const a=fh(e,t);if(n.terminalFeedLog=[...n.terminalFeedLog||[],a].slice(-20),ai(jm,()=>n.terminalFeedLog,"feed"),a.status==="error"||a.status==="timeout"||/manual|post-trade|visibility|resume/i.test(a.reason||"")||!!(a.stale&&a.resultCount===0))try{k("/api/web/terminal-feed-event",{method:"POST",timeoutMs:2500,body:JSON.stringify(a)}).catch(()=>{})}catch{}return a}function hh(e=n.activeTab,t={}){const a=Xe(e);if(!a)return"";const r=globalThis.crypto?.randomUUID?.()||`feed-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return n.terminalFeeds={...n.terminalFeeds,[e]:{...j(e),label:a.label,category:a.category,endpoint:a.endpoint,cacheKey:Qa(a),refreshMs:a.refreshMs,staleMs:a.staleMs,pageSize:a.pageSize,maxPageSize:a.maxPageSize,supportsPagination:!!a.supportsPagination,inFlight:!0,lastRequestId:r,lastReason:t.reason||"refresh",lastStartedAt:new Date().toISOString()}},r}function fi(e=n.activeTab,t="",a="success",r={}){const s=Xe(e);if(!s)return;const o=Wt(e),c=Vn(e),l={...j(e),label:s.label,category:s.category,endpoint:s.endpoint,cacheKey:Qa(s),refreshMs:s.refreshMs,staleMs:s.staleMs,pageSize:s.pageSize,maxPageSize:s.maxPageSize,supportsPagination:!!s.supportsPagination,inFlight:!1,lastRequestId:t,lastStatus:a,lastFetchAt:new Date().toISOString(),resultCount:o,renderedCount:c,hasMore:o>c,stale:a!=="success"||zn(e),errorCode:r.errorCode||"",errorMessage:r.errorMessage||""};n.terminalFeeds={...n.terminalFeeds,[e]:l},Jc(e,{requestId:t,status:a,reason:l.lastReason,resultCount:o,renderedCount:c,hasMore:l.hasMore,stale:l.stale,errorCode:l.errorCode,errorMessage:l.errorMessage})}function gh(e=n.activeTab){return["watchlist","wallets","positions","pnl","liveTrades","trade","bundle","volume","smartChart","launch","launchCoin"].includes(e)}function bh(e={}){const t=String(e.reason||"").toLowerCase();return!!e.userInitiated||t.includes("manual")||t.includes("button")||t.includes("bucket-switch")||t.includes("mode-switch")}async function te(e=n.activeTab,t={}){const a=L(),r=Xe(e);if(!r)return null;if(t.ifStale&&Xc(e)&&!zn(e))return j(e);if(j(e).inFlight){const d=Number(Ro.get(e)||0);if(!d||Date.now()-d<15e3)return j(e);n.terminalFeeds={...n.terminalFeeds,[e]:{...j(e),inFlight:!1}}}const s=bh(t),o=Date.now(),c=Number(Ro.get(e)||0);if(!s&&c&&o-c<Ln)return j(e);if(gh(e)&&!n.user&&!["smartChart","trade","bundle","volume","launchCoin"].includes(e))return fi(e,"","skipped",{errorCode:"ACCOUNT_REQUIRED",errorMessage:"Account or wallet required."}),j(e);Ro.set(e,o);const l=hh(e,t);if(s&&t.renderStart!==!1){const d=n.activeTab==="smartChart"&&["smartChart"].includes(e);h({force:!0,preserveSmartChartFrame:d})}try{if(e==="terminal"){const d=[an({silent:!0,force:!!t.force})];n.kolWallet||d.push(ns(n.kolMode,"",{silent:!0})),await Promise.race([Promise.allSettled(d),new Promise(u=>setTimeout(u,13e3))])}else if(e==="live")await Zr({silent:t.silent!==!1,bucket:n.livePairBucket,force:!!t.force});else if(e==="liveTrades")n.user&&n.token&&await ca({silent:!0,skipCore:!0,force:!!t.force});else if(e==="slimeScope"){const d=[an({silent:!0,force:!!t.force}),Gn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})];n.kolScan||d.push(ns(n.kolMode,n.kolWallet,{silent:!0}).catch(()=>{})),await Promise.allSettled(d)}else if(e==="kol")await ns(n.kolMode,n.kolWallet,{silent:t.silent!==!1});else if(e==="watchlist")await Zc({silent:t.silent!==!1});else if(e==="sniper")await Gn(n.scanMode,{silent:t.silent!==!1});else if(e==="positions")n.user&&n.token&&await wt({force:!!t.force,fast:!0,silent:!0,reason:t.reason||"positions-feed-refresh",followUpValues:!0,syncPnl:!!t.force,timeoutMs:Bo});else if(["wallets","pnl"].includes(e))n.user&&n.token&&await He({force:!!t.force,deep:!1});else if(e==="smartChart")n.user&&n.token&&await He({force:!!t.force,deep:!1});else if(["trade","bundle","volume"].includes(e)){const d=[an({silent:!0,force:!!t.force})];n.user&&n.token&&d.push(ca({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(d)}else if(e==="launch"||e==="launchCoin"){const d=[an({silent:!0,force:!!t.force})];n.scan||d.push(Gn(n.scanMode,{silent:!0,force:!!t.force}).catch(()=>{})),n.user&&n.token&&d.push(ca({silent:!0,skipCore:!0,force:!!t.force})),await Promise.allSettled(d)}else e==="ogreTek"&&await Cr({silent:!0}).catch(d=>{n.ogreTek.error=d.message});return fi(e,l,"success"),j(e)}catch(d){if(fi(e,l,"error",{errorCode:d?.code||d?.name||"REFRESH_FAILED",errorMessage:N(d?.message||"Feed refresh failed.")}),t.throwOnError)throw d;return j(e)}finally{K("feed-refresh",a,{component:r.component||e,resultCount:Wt(e),cacheHit:!!j(e).cacheHit,stale:zn(e),requestId:j(e).lastRequestId||"",errorCode:j(e).errorCode||"",details:`${e}:${Qa(r)}`}),t.render!==!1&&(!s&&wi()?sd():h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"&&e==="smartChart"}))}}async function en(e={}){const t=n.activeTab||"terminal",a=[te(t,{...e,reason:e.reason||"visible-refresh"})];return await Promise.allSettled(a)}function Yr(e="terminal-entry"){n.route==="terminal"&&(en({silent:!0,ifStale:!0,reason:e}).catch(t=>T(t.message)),n.user&&n.token&&He({force:!0,deep:!1,reason:e}).catch(t=>{n.walletRefreshError=t.message||"Wallet refresh failed.",h({preserveSmartChartFrame:n.activeTab==="smartChart"})}))}function hi(){const e=()=>{Da&&clearTimeout(Da),Da=null,_r=""};if(n.route!=="terminal"||document.hidden){e();return}const t=Xe(n.activeTab);if(!t||["terminal","live","slimeScope","kol","watchlist","sniper","launchCoin"].includes(n.activeTab)){e();return}const a=Math.max(5e3,Number(t.refreshMs||3e4)),r=`${n.activeTab}:${Qa(t)}:${a}`;Da&&_r===r||(e(),_r=r,Da=setTimeout(async()=>{Da=null,_r="",!(n.route!=="terminal"||document.hidden)&&(await te(n.activeTab,{silent:!0,force:!0,ifStale:!0,reason:"active-tab-auto"}).catch(s=>T(s.message)),hi())},a))}function tn(e){const t=String(e||"live");return Ot.some(([a])=>a===t)?t:"live"}function Yc(e=n.slimeScopeMode){const t=String(e||"new");return t==="steady"?"under1h":t==="graduating"?"under3h":t==="graduated"?"under1d":"live"}function Qr(e=n.activeTab){return e==="slimeScope"?Yc(n.slimeScopeMode):tn(n.livePairBucket)}function qe(e=Qr()){const t=tn(e);return n.livePairsByBucket[t]||(t===n.livePairBucket?n.livePairs:null)||null}function ua(e=Qr()){const t=tn(e);return n.livePairsLastUpdatedByBucket[t]||(t===n.livePairBucket?n.livePairsLastUpdatedAt:"")||""}function Qc(e=[]){return Array.isArray(e)&&e.length>0}function Fe(e={},t={},a=[]){for(const r of a){const s=e?.[r];if(s!=null&&s!=="")return s}for(const r of a){const s=t?.[r];if(s!=null&&s!=="")return s}return""}function yh(e=[],t=[]){const a=new Map((Array.isArray(e)?e:[]).map(r=>[va(r),r]).filter(([r])=>r));return(Array.isArray(t)?t:[]).map(r=>{const s=a.get(va(r));return s?{...s,...r,tokenMint:Fe(r,s,["tokenMint","mint","tokenAddress","address"]),mint:Fe(r,s,["mint","tokenMint","tokenAddress","address"]),symbol:Fe(r,s,["symbol","ticker","shortMint"]),name:Fe(r,s,["name","tokenName","category"]),imageUrl:Fe(r,s,["imageUrl","image","icon","logoURI","logoUrl"]),image:Fe(r,s,["image","imageUrl","icon","logoURI","logoUrl"]),avatarUrl:Fe(r,s,["avatarUrl","avatar_url","avatar"]),avatarState:Fe(r,s,["avatarState"]),dexUrl:Fe(r,s,["dexUrl","url"]),pumpUrl:Fe(r,s,["pumpUrl","pumpFunUrl","pumpfunUrl"]),websiteUrl:Fe(r,s,["websiteUrl","website"]),twitterUrl:Fe(r,s,["twitterUrl","xUrl"]),telegramUrl:Fe(r,s,["telegramUrl"]),metadata:r?.metadata||s?.metadata||r?.tokenMetadata||s?.tokenMetadata||null,tokenMetadata:r?.tokenMetadata||s?.tokenMetadata||r?.metadata||s?.metadata||null,dex:r?.dex||s?.dex||r?.dexScreener||s?.dexScreener||null,pump:r?.pump||s?.pump||r?.pumpFun||s?.pumpFun||null}:r})}async function Zr({silent:e=!1,bucket:t=n.livePairBucket,renderOnComplete:a=!0,force:r=!1}={}){const s=L(),o=tn(t),c=o===n.livePairBucket,l=n.terminalSort||"best",d=n.terminalCat||"",u=`${o}:${l}:${d}`,p=na.get(u);if(p?.promise){n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:p.requestId},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const A=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);return!e&&!Qc(A)&&Va(Jl),p.promise}const f=`${Date.now()}:${Math.random().toString(16).slice(2)}`,y=(On[o]||0)+1;On[o]=y;const b=()=>On[o]===y;n.livePairsLoadingByBucket={...n.livePairsLoadingByBucket,[o]:f},n.livePairsLoading=!!n.livePairsLoadingByBucket[n.livePairBucket],!e&&c&&(n.loading=!0);const v=n.livePairsByBucket?.[o]?.rows||(c?n.livePairs?.rows:[]);!e&&!Qc(v)&&Va(Jl);const P=(async()=>{try{const A=r?"&force=true":"",g=d?`&cat=${encodeURIComponent(d)}`:"",$=`/api/web/live-pairs?bucket=${encodeURIComponent(o)}&sort=${encodeURIComponent(l)}${g}${A}`,C=await Promise.race([k($),new Promise((X,Ue)=>window.setTimeout(()=>Ue(new Error("Live feed refresh timed out.")),12e3))]),B=Ot.find(([X])=>X===o)?.[1]||"Live",U=n.livePairsByBucket[o]||(c?n.livePairs:null);let H=C.livePairs||{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,message:`${B} feed returned no rows yet. Retrying automatically.`};const Se=Array.isArray(H?.rows)?H.rows:[],De=Array.isArray(U?.rows)?U.rows:[];if(Se.length===0&&De.length>0?H={...U,...H,rows:U.rows,stale:!0,emptyRefresh:!0,message:`${B} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`}:Se.length>0&&De.length>0&&(H={...H,rows:yh(De,Se)}),!b())return H;const q=H?.refreshedAt||new Date().toISOString(),Oe={...n.livePairsRefreshErrorByBucket||{}};return delete Oe[o],n.livePairsRefreshErrorByBucket=Oe,n.livePairsByBucket={...n.livePairsByBucket,[o]:H},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:q},c&&(n.livePairs=H,n.livePairsLastUpdatedAt=q),H}catch(A){const g=N(A?.message||"Live feed refresh failed."),$=Ot.find(([U])=>U===o)?.[1]||"Live",C=n.livePairsByBucket[o]||(c?n.livePairs:null),B=C?{...C,stale:!0,refreshError:g,message:`Showing last good ${$} feed. Refresh failed, retrying automatically.`}:{bucket:o,rows:[],refreshedAt:new Date().toISOString(),refreshSeconds:5,stale:!0,refreshError:g,message:`${$} refresh failed. Retrying automatically.`};return b()&&(n.livePairsRefreshErrorByBucket={...n.livePairsRefreshErrorByBucket||{},[o]:g},n.livePairsByBucket={...n.livePairsByBucket,[o]:B},n.livePairsLastUpdatedByBucket={...n.livePairsLastUpdatedByBucket,[o]:B.refreshedAt},c&&(n.livePairs=B,n.livePairsLastUpdatedAt=B.refreshedAt)),B}finally{if(!b())return;const A=n.livePairsByBucket?.[o]?.rows||[];K("live-pairs-refresh",s,{component:"livePairs",resultCount:Array.isArray(A)?A.length:0,stale:!!n.livePairsByBucket?.[o]?.stale,errorCode:n.livePairsRefreshErrorByBucket?.[o]?"LIVE_PAIRS_REFRESH_FAILED":"",details:`${o}:${l}`});const g={...n.livePairsLoadingByBucket};(g[o]===f||g[o]===!0)&&(delete g[o],n.livePairsLoadingByBucket=g),n.livePairsLoading=!!g[n.livePairBucket],!e&&c&&(n.loading=!1),a&&(c&&["terminal","live","slimeScope"].includes(n.activeTab)?Va("load-live-pairs-complete"):h())}})();return na.set(u,{requestId:f,requestVersion:y,safeBucket:o,promise:P}),P.finally(()=>{na.get(u)?.requestId===f&&na.delete(u)}),P}async function an({silent:e=!1,force:t=!1,warmAll:a=!1}={}){if(await Zr({silent:e,bucket:n.livePairBucket,force:t}),a){const r=Ot.map(([s])=>s).filter(s=>s!==n.livePairBucket);await Promise.allSettled(r.map(s=>Zr({silent:!0,bucket:s,renderOnComplete:!1,force:t})))}(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope")&&Va(a?"live-pair-buckets-warm-all":"live-pair-active-bucket")}function es(e){const t=tn(n.livePairBucket);for(const a of[...na.keys()])a.startsWith(`${t}:`)&&na.delete(a);On[t]=(On[t]||0)+1,h(),typeof e=="function"?e():an({silent:!0,force:!0})}function pa(){if(Jn()||document.hidden||Ha()||n.activeTab!=="live"&&n.activeTab!=="terminal"&&n.activeTab!=="slimeScope"){Ka();return}const e=Qr(n.activeTab),a=(n.activeTab==="slimeScope"?12:8)*1e3,r=`${n.activeTab}:${e}:${n.terminalSort}:${a}`;Ea&&Ir===r||(Ka(),Ir=r,Ea=setTimeout(async()=>{if(Ea=null,Ir="",document.hidden||Ha()){pa();return}if(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"){if(n.livePairsLoadingByBucket?.[e]){pa();return}try{n.activeTab==="slimeScope"?await te("slimeScope",{silent:!0,render:!1,force:!1,reason:"slime-scope-auto-refresh"}):await Zr({silent:!0,bucket:n.livePairBucket,force:!1})}catch{}finally{pa()}}},a))}function vh({force:e=!1}={}){if(Jn()||!(n.activeTab==="live"||n.activeTab==="terminal"||n.activeTab==="slimeScope"))return;const a=Qr(n.activeTab),r=`${a}:${n.terminalSort||"best"}`;Or.has(r)||n.livePairsLoadingByBucket[a]||!e&&n.livePairsByBucket[a]||(Or.add(r),window.setTimeout(()=>{const s=n.activeTab==="slimeScope"?te("slimeScope",{silent:!0,render:!1,force:!0,reason:"slime-scope-warmup"}):an({silent:!0,force:!0,warmAll:!1});Promise.resolve(s).catch(o=>T(o.message)).finally(()=>{Or.delete(r),pa()})},900))}function ts(){const e=()=>{Fa&&clearTimeout(Fa),Fa=null,Er=""};if(document.hidden||n.activeTab!=="sniper"){e();return}const t=`${n.activeTab}:${n.scanMode}`;Fa&&Er===t||(e(),Er=t,Fa=setTimeout(async()=>{if(Fa=null,Er="",document.hidden){ts();return}if(n.activeTab==="sniper"){if(n.loading){ts();return}try{await Gn(n.scanMode,{silent:!0})}catch(a){T(a.message)}finally{ts()}}},2e4))}function jn(){const e=()=>{Wa&&clearTimeout(Wa),Wa=null,Fr=""};if(Jn()||document.hidden||n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet){e();return}const t=String(n.kolMode||"hot"),s=t==="hot"||t==="fresh"?1e4:3e4,o=`${n.activeTab}:${n.kolMode}:${s}`;Wa&&Fr===o||(e(),Fr=o,Wa=setTimeout(async()=>{if(Wa=null,Fr="",document.hidden){jn();return}if(!(n.activeTab!=="kol"&&n.activeTab!=="terminal"||n.kolWallet)){if(n.kolLoading){jn();return}try{await ns(n.kolMode,"",{silent:!0})}catch(c){T(c.message)}finally{jn()}}},s))}function as(){const e=()=>{Na&&clearTimeout(Na),Na=null,Wr=""};if(Jn()||document.hidden||n.activeTab!=="watchlist"&&n.activeTab!=="terminal"||!n.user||!n.token){e();return}const t=`${n.activeTab}:${n.user?.id||"guest"}`;Na&&Wr===t||(e(),Wr=t,Na=setTimeout(async()=>{if(Na=null,Wr="",document.hidden){as();return}if(!(n.activeTab!=="watchlist"&&n.activeTab!=="terminal"))try{await Zc({silent:!0})}catch(a){T(a.message)}finally{as()}},3e4))}async function Gn(e=n.scanMode,t={}){const a=L(),r=!!t.silent;n.scanMode=e,r||(n.loading=!0,h());try{const s=await k(`/api/web/sniper/scan?mode=${encodeURIComponent(e)}`);n.scan=s.scan}finally{K("scanner-refresh",a,{component:"sniper",resultCount:Array.isArray(n.scan?.candidates)?n.scan.candidates.length:0,details:e}),r||(n.loading=!1),h()}}async function ns(e=n.kolMode,t=n.kolWallet,a={}){const r=L(),s=!!a.silent;n.kolMode=e,n.kolWallet=String(t||"").trim();let o="";n.kolWallet&&!Dt(n.kolWallet)&&(n.kolWallet="",o="Skipped invalid KOL wallet. Paste a verified Solana public wallet to scan positions."),!s&&!n.kolScan&&(n.loading=!0),n.kolLoading=!0,n.kolStatus=o||(n.kolWallet?"Scanning custom KOL wallet...":`Loading ${ir(n.kolMode)}...`),T(""),s||h();try{const c=new URLSearchParams({mode:e});n.kolWallet&&c.set("wallet",n.kolWallet);const l=await k(`/api/web/kol/scan?${c.toString()}`);n.kolScan=l.scan,n.kolLastUpdatedAt=new Date().toISOString(),n.kolStatus=l.scan?.message||`${ir(n.kolMode)} loaded.`,n.kolDumpStatsLoadedAt=0}catch(c){throw n.kolStatus=c.message||"KOL scan failed.",c}finally{K("kol-refresh",r,{component:"kol",resultCount:Array.isArray(n.kolScan?.rows)?n.kolScan.rows.length:Array.isArray(n.kolScan?.signals)?n.kolScan.signals.length:0,errorCode:n.kolStatus&&/failed/i.test(n.kolStatus)?"KOL_REFRESH_FAILED":"",details:n.kolWallet?"wallet":e}),s||(n.loading=!1),n.kolLoading=!1,h()}}async function Zc(e={}){if(!n.user||!n.token)return;const t=L(),a=!!e.silent;n.watchlistLoading=!0,a||h();try{const r=await k("/api/web/watchlist");n.watchlist=r.watchlist||{rows:[],count:0}}finally{K("watchlist-refresh",t,{component:"watchlist",resultCount:n.watchlist?.count||n.watchlist?.rows?.length||0}),n.watchlistLoading=!1,h()}}function wh(){return n.balances.reduce((e,t)=>e+Number(t.sol||0),0)}function Sh(){const e=Number(n.connectedWalletBalance?.sol);return Number.isFinite(e)&&e>0?e:0}function _t(){return wh()+Sh()}const kh=[{symbol:"SOL",name:"Solana",mint:"SOL",kind:"native"},{symbol:"USDC",name:"USD Coin",mint:"EPjFWdd5AufqSSqeM2qer6k8zQfM3qNw6ddnCGWRPpC",kind:"popular"},{symbol:"USDT",name:"Tether USD",mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoE5gXn4wYwG9ksz4T8Js3",kind:"popular"},{symbol:"JUP",name:"Jupiter",mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",kind:"popular"},{symbol:"RAY",name:"Raydium",mint:"4k3Dyjzvzp8eCTuFJYgmGnN95VhWPuTsf1KfzYEU7K1k",kind:"popular"},{symbol:"BONK",name:"Bonk",mint:"DezXAZ8z7PnrnRJjz3uq8NgV8Q9ddCzB9Ckr7JpPvvR",kind:"popular"},{symbol:"WIF",name:"dogwifhat",mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLQBkRzUPzWf",kind:"popular"}];function We(e=""){const t=String(e||"").trim();return!t||t.toLowerCase()==="custom"?"":t.toUpperCase()==="SOL"?"SOL":t}function $h(){const e=new Map,t=(a={})=>{const r=We(a.mint||a.tokenMint||"");if(!r||e.has(r))return;const s=a.balance??a.uiAmount??a.amount??a.uiBalance??"";e.set(r,{mint:r,symbol:String(a.symbol||a.shortMint||(r==="SOL"?"SOL":w(r))||"").trim(),name:String(a.name||a.label||"").trim(),balance:s,kind:"wallet"})};return t({mint:"SOL",symbol:"SOL",name:"Solana",balance:`${_t().toFixed(4)} SOL`}),it().forEach(a=>t({mint:a.tokenMint||a.mint,symbol:a.symbol||a.shortMint,name:a.name||"",balance:a.uiAmount||a.amountToken||"",kind:"wallet"})),(n.balances||[]).forEach(a=>{(a.tokens||[]).forEach(r=>t({mint:r.tokenMint||r.mint,symbol:r.symbol||r.shortMint,name:r.name||"",balance:r.uiAmount||r.amount||r.balance||"",kind:"wallet"}))}),[...e.values()]}function gi(e={}){const t=new Map,a=(s={})=>{const o=We(s.mint||s.tokenMint||"");!o||t.has(o)||t.set(o,{mint:o,symbol:String(s.symbol||s.shortMint||(o==="SOL"?"SOL":w(o))||"").trim(),name:String(s.name||s.label||"").trim(),balance:s.balance??s.uiAmount??s.amount??"",kind:s.kind||s.source||"held"})};return $h().forEach(a),e.walletOnly||kh.forEach(s=>{s.mint!=="SOL"&&a(s)}),[...t.values()]}function ed(e=""){const t=We(e);return gi().find(a=>a.mint===t)||null}function td(e="",t={}){const a=We(e),r=t.includeCustom!==!1,s=gi({walletOnly:!!t.walletOnly}),o=s.some(d=>d.mint===a);return`${s.map(d=>{const u=d.mint==="SOL"?`SOL${d.balance?` - ${d.balance}`:""}`:`${d.symbol||w(d.mint)}${d.kind==="wallet"?` - ${d.balance?`${d.balance} `:""}in wallet`:d.name?` - ${d.name}`:""}`;return`<option value="${i(d.mint)}" ${a===d.mint?"selected":""}>${i(u)}</option>`}).join("")}${r?`<option value="custom" ${r&&(!a||!o)?"selected":""}>Custom CA</option>`:""}`}function bi(){const e=We(n.tradeSwapFrom||"SOL")||"SOL";return gi({walletOnly:!0}).some(t=>t.mint===e)?e:"SOL"}function ad(){const e=bi(),t=We(n.tradeSwapTo||""),a=We(n.tradeToken||"");return t&&t!==e?t:a&&a!==e||e==="SOL"?a:"SOL"}function Th(){const e=bi(),t=ad();return e!=="SOL"&&t&&t!=="SOL"&&e!==t?"two-step":t&&t!=="SOL"||We(n.tradeToken||"")?n.swapDirection==="sell"?"sell":"buy":"select"}function Ah(e="buy"){const t=We(m("[data-swap-from]")?.value||n.tradeSwapFrom||""),a=We(m("[data-swap-to]")?.value||n.tradeSwapTo||""),r=String(m("[data-trade-token]")?.value||n.tradeToken||"").trim();return e==="sell"&&t&&t!=="SOL"?t:a&&a!=="SOL"?a:r}function nd(){return(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey?(n.connectedWalletBalance?.tokens||[]).filter(t=>t?.mint||t?.tokenMint).map(t=>{const a=String(t.mint||t.tokenMint||"").trim();return{tokenMint:a,shortMint:t.shortMint||w(a),symbol:t.symbol||t.shortMint||w(a),name:t.name||"",imageUrl:t.imageUrl||t.imageUri||"",imageUri:t.imageUri||t.imageUrl||"",dexUrl:t.dexUrl||Q(a),pumpUrl:Zf(a),uiAmount:t.uiAmount??"held",walletCount:1,buys:0,sells:0,spentSol:"0",receivedSol:"0",realizedSol:"+0",estimatedValueSol:null,openPnlSol:null,openPnlPercent:null,valuePending:!1,valueError:"",viewOnly:!0,source:"connected-wallet"}}):[]}function it(){const e=new Set,t=[];for(const a of[...n.positions||[],...nd()]){const r=String(a?.tokenMint||a?.mint||"").trim();!r||e.has(r)||(e.add(r),t.push(a))}return t}function yi(){const e=n.connectedWalletBalance?.publicKey||n.user?.connectedWallet?.publicKey||"";return n.wallets.length+(e?1:0)}function vi(){return n.pnl?.totals?.realizedSol||"+0 SOL"}function nn(e){const t=Date.parse(e||"");return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1e3)):null}function Xn(e){return Number.isFinite(e)?e<5?"just now":e<60?`${e}s ago`:e<3600?`${Math.floor(e/60)}m ago`:`${Math.floor(e/3600)}h ago`:"never"}function rs(){if(n.walletRefreshing||n.walletRefreshStatus==="refreshing")return"Syncing";if(n.walletRefreshStatus==="timeout")return"Delayed";if(n.walletRefreshError||n.walletRefreshStatus==="error")return"Retry";const e=nn(n.lastWalletRefreshAt);return e===null?"Idle":e>45?"Stale":"Synced"}function Ph(){const e=le("trade",n.selectedTradePresetId),t=le("bundle",n.selectedBundlePresetId),a=e?`${e.name||"Trade"} ${e.amountSol||""} SOL`.trim():"Manual",r=t?t.name||"Bundle":"No bundle";return`Preset ${a} | ${r}`}async function rd(){if(!n.user||!n.token)return;const e=L();try{const[t,a]=await Promise.allSettled([k("/api/web/pnl?force=true",{dedupe:!1}),k("/api/web/trade/plans")]);t.status==="fulfilled"&&(n.pnl=t.value.pnl||n.pnl||null),a.status==="fulfilled"&&(n.tradePlans=a.value.plans||n.tradePlans||[],Ps()),K("post-trade-supplemental-refresh",e,{component:"post-trade",resultCount:(n.tradePlans?.length||0)+(n.pnl?1:0),details:"pnl,trade-plans"})}catch(t){K("post-trade-supplemental-refresh",e,{component:"post-trade",errorCode:t?.code||t?.name||"POST_TRADE_SUPPLEMENTAL_FAILED",details:N(t?.message||"Post-trade supplemental refresh failed.")})}}function Ch(e=350,t={}){Nr&&window.clearTimeout(Nr),Nr=window.setTimeout(async()=>{if(Nr=null,!(!n.user||!n.token))try{t.reason==="post-trade"?await Promise.all([rd(),wt({force:!0,fast:!1,silent:!0,syncPnl:!0,reason:"post-trade-background-values"})]):await Promise.all([ca({force:!1,skipCore:!0,silent:!0}),wt({force:!1,fast:!1,silent:!0,reason:"background-values"})])}catch(a){n.walletRefreshError=a.message||"Background refresh failed.",h()}},e)}async function He({force:e=!1,deep:t=!1,reason:a="manual"}={}){if(!n.user||!n.token)return n.walletRefreshing=!1,n.walletRefreshStatus="idle",n.walletRefreshError="Wallet not connected",Ee("[data-sync-health]","Wallet not connected"),je("error",{error:"Wallet not connected"}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),{ok:!1,data:null,error:"Wallet not connected",durationMs:0,fromCache:!1,degraded:!0};const r=String(a||"").toLowerCase(),s=r==="manual_header_click",o=r.includes("post-trade");if(e&&!t&&!o&&!s&&Date.now()-oc<Jm?(e=!1,W({component:"wallet",action:"wallet-refresh-force-throttled",durationMs:0,cacheHit:!0,details:r||"manual"})):e&&!t&&!o&&(oc=Date.now()),ta)return W({component:"wallet",action:"wallet-refresh-dedupe",durationMs:0,cacheHit:!0,details:e?"force-shared":"shared"}),n.positionRefreshAction?.state==="clicked"&&Xa("refreshing",{startedAt:n.positionRefreshAction.startedAt||L()}),ta.finally(()=>{if(["clicked","refreshing"].includes(n.positionRefreshAction?.state)){const d=n.walletRefreshStatus==="error"||n.walletRefreshStatus==="timeout";je(d?"error":"success",{error:d?N(n.walletRefreshError||"Refresh delayed"):""})}});const c=L(),l=++gf;return n.walletRefreshRequestId=l,ta=(async()=>{let d={ok:!1,data:null,error:"",durationMs:0,fromCache:!1,degraded:!1};n.positionRefreshAction?.state==="clicked"&&Xa("refreshing",{startedAt:n.positionRefreshAction.startedAt||c}),n.walletRefreshing=!0,n.walletRefreshStatus="refreshing",n.walletRefreshError="",Ee("[data-sync-health]",rs()),It("[data-refresh-spinner]",!1),de(),aa&&window.clearTimeout(aa),aa=window.setTimeout(()=>{aa=null,!(n.walletRefreshRequestId!==l||!n.walletRefreshing)&&(n.walletRefreshing=!1,n.walletRefreshStatus==="refreshing"&&(n.walletRefreshStatus="timeout"),ta=null,je("error",{error:"Refresh delayed; retrying..."}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))},Mo+6e3),await xe(20);try{if(await Promise.race([ui({force:e,deep:t,preserveSmartChartFrame:n.activeTab==="smartChart",requestId:l,timeoutMs:Mo}),new Promise((u,p)=>window.setTimeout(()=>p(Object.assign(new Error("Wallet refresh timed out."),{code:"TIMEOUT"})),Mo))]),n.walletRefreshRequestId!==l)return d={ok:!1,data:null,error:"Stale wallet refresh ignored.",durationMs:L()-c,fromCache:!1,degraded:!0},d;n.walletRefreshRequestId===l&&(n.lastWalletRefreshAt=new Date().toISOString(),n.walletRefreshStatus="success"),t?await ca({force:e,skipCore:!0,silent:!0}):((s||o)&&wt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:`${a}-positions-values`,timeoutMs:Qt}).then(u=>{u?h({preserveSmartChartFrame:n.activeTab==="smartChart"}):Jr(`${a}-positions-values-failed`)}).catch(()=>Jr(`${a}-positions-values-failed`)),Ch(o?200:350,{reason:a})),K("wallet-refresh-total",c,{component:"wallet",resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:t?"deep":`core-plus-background:${a}`}),je("success",{error:""}),d={ok:!0,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:"",durationMs:L()-c,fromCache:!1,degraded:!1}}catch(u){const p=u?.code==="TIMEOUT"||/timed out|timeout|blocked or could not open/i.test(String(u?.message||""));n.walletRefreshRequestId===l&&(n.walletRefreshStatus=p?"timeout":"error",n.walletRefreshError=u.message||"Refresh failed."),p&&!r.includes("auto-retry")&&n.user&&n.token&&window.setTimeout(()=>{n.user&&n.token&&n.walletRefreshStatus!=="success"&&He({force:!1,deep:!1,reason:"auto-retry-timeout"}).catch(()=>{})},4e3),K("wallet-refresh-total",c,{component:"wallet",errorCode:u?.code||u?.name||"WALLET_REFRESH_FAILED",details:N(n.walletRefreshError)}),je("error",{error:N(n.walletRefreshError)}),T(n.walletRefreshError),d={ok:!1,data:{balances:n.balances,positions:n.positions,pnl:n.pnl},error:N(n.walletRefreshError),durationMs:L()-c,fromCache:!1,degraded:!0}}finally{aa&&(window.clearTimeout(aa),aa=null),n.walletRefreshRequestId===l&&(n.walletRefreshing=!1),ta=null,h({preserveSmartChartFrame:n.activeTab==="smartChart"})}return d})(),ta}async function St({force:e=!0,reason:t="manual_header_click",deep:a=!1}={}){return He({force:e,reason:t,deep:a})}function Jn(){return!!n.postTradeRefresh?.active&&Number(n.postTradeRefresh?.activeUntil||0)>Date.now()}async function i0(e="",t="legacy-post-trade"){V(e,t)}function V(e="",t="post-trade",a={}){e&&(n.lastTradeSignature=e),Rt.length&&(Rt.forEach(o=>window.clearTimeout(o)),Rt=[]);const r=a.tradeAttemptId||vt("post-trade"),s=Array.isArray(a.affectedKeys)&&a.affectedKeys.length?a.affectedKeys.slice(0,12).map(o=>ke(o,48)):nf;n.postTradeRefresh={active:!0,attemptId:r,action:ke(t,70),signaturePresent:!!e,invalidatedKeys:s,refreshedKeys:[],requestCount:0,errors:[],startedAt:new Date().toISOString(),activeUntil:Date.now()+12e3},W({component:"post-trade",action:"post-trade-invalidation-start",durationMs:0,requestId:r,resultCount:s.length,details:s.join(",")}),Qm.forEach(o=>{const c=window.setTimeout(()=>{Rt=Rt.filter(p=>p!==c);const l=Number(n.postTradeRefresh?.requestCount||0)+1;n.postTradeRefresh={...n.postTradeRefresh||{},requestCount:l},W({component:"post-trade",action:"post-trade-refresh-start",durationMs:0,requestId:r,resultCount:n.postTradeRefresh.requestCount,details:t});const d=L();(l<=1?He({force:!0,deep:!1,reason:"post-trade"}):Promise.all([wt({force:!0,fast:!1,silent:!0,followUpValues:!1,syncPnl:!0,reason:"post-trade-values",timeoutMs:Qt}),rd()])).catch(p=>{n.walletRefreshError=p.message||"Post-trade refresh failed.",n.postTradeRefresh={...n.postTradeRefresh||{},errors:[...n.postTradeRefresh?.errors||[],N(p.message||"Post-trade refresh failed.")].slice(-5)},W({component:"post-trade",action:"position-refresh-post-trade-error",durationMs:L()-d,requestId:r,errorCode:p?.code||p?.name||"POST_TRADE_REFRESH_FAILED",details:t}),h()}).finally(()=>{n.postTradeRefresh={...n.postTradeRefresh||{},refreshedKeys:[...new Set([...n.postTradeRefresh?.refreshedKeys||[],"wallet-summary","positions","pnl"])],active:Rt.length>0,activeUntil:Rt.length>0?Date.now()+8e3:Date.now()},W({component:"post-trade",action:"post-trade-refresh-end",durationMs:L()-d,requestId:r,resultCount:(n.balances?.length||0)+(n.positions?.length||0),details:n.postTradeRefresh.refreshedKeys.join(",")}),h({preserveSmartChartFrame:n.activeTab==="smartChart"})})},o);Rt.push(c)}),de()}function Me({title:e="Confirm",lines:t=[],confirmLabel:a="Confirm",cancelLabel:r="Cancel",danger:s=!1,input:o=null}={}){if(!document?.body){const c=[].concat(t).filter(Boolean).join(`
`);return o?Promise.resolve(window.prompt(c||e,o.value||"")):Promise.resolve(window.confirm(c||e))}return new Promise(c=>{const l=document.createElement("div");l.className="slime-confirm-overlay",l.innerHTML=`
      <div class="slime-confirm-card" role="dialog" aria-modal="true" aria-label="${i(e)}">
        <h3 class="slime-confirm-title">${i(e)}</h3>
        ${[].concat(t).filter(Boolean).map(v=>`<p class="slime-confirm-line">${i(v)}</p>`).join("")}
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
    `;const d=document.activeElement,u=l.querySelector(".slime-confirm-input"),p=v=>{l.remove(),document.removeEventListener("keydown",b,!0);try{d?.focus?.({preventScroll:!0})}catch{}c(v)},f=()=>p(o?u?.value??"":!0),y=()=>p(o?null:!1),b=v=>{v.key==="Escape"?(v.preventDefault(),y()):v.key==="Enter"&&(!o||v.target===u)&&(v.preventDefault(),f())};l.addEventListener("pointerdown",v=>{v.target===l&&y()}),l.querySelector(".slime-confirm-accept").addEventListener("click",f),l.querySelector(".slime-confirm-cancel").addEventListener("click",y),document.addEventListener("keydown",b,!0),document.body.appendChild(l),(u||l.querySelector(".slime-confirm-accept"))?.focus({preventScroll:!0}),u&&u.select()})}function wi(){if(document.hidden&&n.route==="terminal")return!0;const e=document.activeElement;if(!e||n.route!=="terminal")return!1;const t=String(e.tagName||"").toLowerCase();return e.isContentEditable||["input","textarea","select"].includes(t)?!!e.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"):!1}function sd(){n.pendingRender=!0}function od(){!n.pendingRender||wi()||(n.pendingRender=!1,h({force:!0}))}function Si(e,t){e&&(e.hidden=t,e.dataset.routeViewHidden=t?"true":"false",e.setAttribute("aria-hidden",t?"true":"false"))}function rn(){if(!ce||!En||!re)return;const e=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);ce.dataset.loading=n.loading?"true":"false",ce.dataset.route=n.route,ce.dataset.walletConnected=e?"true":"false",e&&nk("shell-wallet-context"),e?Sd("shell-wallet-context"):Ol(),e||(n.tpslAutoEnableInFlight=!1,n.tpslAutoEnableScheduledAt=0),Si(En,!["intro","login"].includes(n.route)),Si(cc,n.route!=="connect"),Si(re,n.route!=="terminal"),It("[data-terminal-global-search]",n.route!=="terminal"),It("[data-top-sync-strip]",n.route!=="terminal")}function Yn(){const e=!!(Ce&&n.loginModalOpen),t=!!n.quickBuyModal?.open;document.body.classList.toggle("login-modal-open",e),document.body.classList.toggle("quick-buy-modal-open",t),!e&&!t&&(document.body.style.overflow="",document.documentElement.style.overflow="");const a=m("[data-wallet-connect-modal]");a&&(a.style.pointerEvents=a.hidden?"none":"");const r=m("[data-quick-buy-modal-root]");r&&(r.style.pointerEvents=r.hidden?"none":"")}function ki(e,t=48){if(!e||document.hidden)return!1;try{const a=e.getBoundingClientRect();return a.width<24||a.height<t}catch{return!1}}function id(e="resume"){if(!ce||document.hidden)return;rn(),Yn();const t=`${Date.now()}:${e}`,a=ce.style.transform;ce.dataset.resumePaint=t,ce.style.transform=a?`${a} translateZ(0)`:"translateZ(0)",ce.offsetHeight,window.requestAnimationFrame(()=>{!ce||ce.dataset.resumePaint!==t||(ce.style.transform=a,delete ce.dataset.resumePaint)})}function Lh(){if(!ce)return!1;if(ce.dataset.route!==n.route)return!0;const e=document.body.classList.contains("login-modal-open")&&(!Ce||Ce.hidden||!n.loginModalOpen),t=document.body.classList.contains("quick-buy-modal-open")&&!n.quickBuyModal?.open;if(e||t||ki(ce,80))return!0;if(n.route!=="terminal")return!1;const a=m("[data-panel]");return re?.hidden||ki(re,80)||a&&ki(a,32)||a&&!a.children.length&&!String(a.textContent||"").trim()?!0:![En,cc,re].some(s=>s&&!s.hidden)}function xh(e="watchdog"){const t=n.positionRefreshAction||{},a=t.startedAt?Math.max(0,L()-Number(t.startedAt||0)):0;(t.state==="clicked"||t.state==="refreshing")&&a>af&&(je("error",{error:"Refresh delayed"}),W({component:"positions",action:"stale-position-refresh-lock-cleared",durationMs:a,details:e})),n.walletRefreshing&&!ta&&(n.walletRefreshing=!1,n.walletRefreshStatus=n.walletRefreshStatus==="refreshing"?"timeout":n.walletRefreshStatus,It("[data-refresh-spinner]",!0)),Yn(),de()}function ld(e="watchdog",t={}){return xh(e),Lh()?(W({component:"app-shell",action:"recover-blank-shell",durationMs:Math.max(0,Date.now()-ic),details:`${e}:${n.route}:${n.activeTab||""}`}),ei({keepLogin:n.route==="login"}),rn(),id(e),h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),!0):(t.forcePaint&&id(e),!1)}function cd(){return!!(navigator.mediaDevices?.getDisplayMedia&&window.MediaRecorder)}function dd(){try{return document.createElement("canvas")}catch{return null}}function ud(){const e=dd();return!!(e&&(typeof e.toBlob=="function"||(e.captureStream||e.mozCaptureStream)&&window.MediaRecorder))}function Mh(){return cd()||ud()}function $i(){const e=Ge()?"This mobile browser blocked both screen recording and SlimeWire clip fallback. Use your phone screen recorder, then share the saved clip.":"This browser cannot start screen recording. Use desktop Chrome/Edge or your device recorder.";Nt(e),typeof window.alert=="function"&&window.alert(e)}function pd(){return["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch{return!1}})||""}function Qn(e=""){return/^image\/png/i.test(String(e||""))?"png":/^video\/mp4/i.test(String(e||""))?"mp4":"webm"}function md(){const e=n.clipFarm?.fileExtension||Qn(n.clipFarm?.mimeType||n.clipFarm?.blob?.type||"");return`slimewire-clip-${Date.now()}.${e}`}function Zn(){try{n.clipFarm?.stream?.getTracks?.().forEach(e=>e.stop())}catch{}n.clipFarm?.fallbackFrameTimer&&clearInterval(n.clipFarm.fallbackFrameTimer),n.clipFarm?.fallbackStopTimer&&clearTimeout(n.clipFarm.fallbackStopTimer)}function Nt(e=""){n.clipFarm={...n.clipFarm,status:String(e||"")},Je()}function Ti(){if(n.clipFarm?.videoUrl)try{URL.revokeObjectURL(n.clipFarm.videoUrl)}catch{}n.clipFarm={...n.clipFarm,blob:null,videoUrl:"",mimeType:"",fileExtension:"",status:n.clipFarm?.recording?"Recording...":""},Je()}function Je(){const e=document.querySelector("[data-clip-farm]");if(!e)return;const t=n.clipFarm||{},a=Mh(),r=!!t.recording,s=!!(t.blob&&t.videoUrl),o=t.status||(r?"Recording":s?"Clip ready":"Clip farm");e.innerHTML=`
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
          <a href="https://t.me/share/url?url=${encodeURIComponent(Bt)}&text=${encodeURIComponent("Farming SlimeWire clips")}" target="_blank" rel="noreferrer" title="Open Telegram">TG</a>
          <button type="button" data-clip-clear title="Close clip options">Cancel</button>
        </div>
      `:""}
      ${o?`<small>${i(o)}</small>`:""}
    </div>
  `}function fd(){const e=we([...qe()?.rows||[],...typeof gr=="function"?gr():[],...n.slimeScopeRows||[],...n.livePairRows||[],...Object.values(n.livePairsByBucket||{}).flatMap(t=>t?.rows||[])]).filter(t=>t?.tokenMint).slice(0,4);return e.length?e:[{tokenMint:n.smartChartToken||n.tradeToken||"",symbol:"SlimeWire",name:"Live Terminal",marketCapLabel:"checking",liquidityLabel:"checking",volumeH1Label:"live"}]}function hd(e,t={}){const a=e?.getContext?.("2d");if(!a)return;const r=Math.max(1,Math.min(3,window.devicePixelRatio||1)),s=720,o=1280;(e.width!==s*r||e.height!==o*r)&&(e.width=s*r,e.height=o*r,e.style.width=`${s}px`,e.style.height=`${o}px`),a.setTransform(r,0,0,r,0,0);const c=Math.max(0,Math.min(1,Number(t.progress||0))),l=t.rows||fd(),d=new Date;a.fillStyle="#020803",a.fillRect(0,0,s,o);const u=a.createRadialGradient(s*.2,o*.12,20,s*.2,o*.12,460);u.addColorStop(0,"rgba(118,255,45,0.35)"),u.addColorStop(1,"rgba(118,255,45,0)"),a.fillStyle=u,a.fillRect(0,0,s,o),a.strokeStyle="rgba(118,255,45,0.38)",a.lineWidth=2,a.strokeRect(24,24,s-48,o-48),a.fillStyle="#baff4d",a.font="900 34px Arial, sans-serif",a.fillText("SlimeWire REC",48,88),a.fillStyle="#f4fff0",a.font="800 54px Arial, sans-serif",a.fillText("Fresh Live Picks",48,154),a.fillStyle="rgba(226,255,215,0.78)",a.font="700 22px Arial, sans-serif",a.fillText(`Mobile in-site clip - ${d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`,48,196);const p=s-96;a.fillStyle="rgba(118,255,45,0.12)",a.fillRect(48,226,p,12),a.fillStyle="#78ff2d",a.fillRect(48,226,Math.max(24,p*c),12),l.forEach((f,y)=>{const b=292+y*188,v=String(f.symbol||f.baseSymbol||w(f.tokenMint||"")||"Token").slice(0,18),P=String(f.name||f.category||"fresh pair").slice(0,34),A=_(f.marketCapLabel,f.fdvLabel,M(mt(f)),"checking"),g=_(f.liquidityLabel,M(ft(f)),"checking"),$=_(f.volumeH1Label,f.volumeLabel,M(f.volumeH1),"checking"),C=String(f.pairAgeLabel||zt(f)||"live").slice(0,18);a.fillStyle="rgba(4,24,8,0.92)",a.strokeStyle="rgba(118,255,45,0.34)",a.lineWidth=2,a.beginPath(),typeof a.roundRect=="function"?a.roundRect(48,b,s-96,156,18):a.rect(48,b,s-96,156),a.fill(),a.stroke(),a.fillStyle="#f4fff0",a.font="900 32px Arial, sans-serif",a.fillText(v,76,b+48),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 18px Arial, sans-serif",a.fillText(P,76,b+78),[["MC",A],["LIQ",g],["VOL",$],["AGE",C]].forEach(([B,U],H)=>{const Se=76+H*140;a.fillStyle="#aaff8f",a.font="800 15px Arial, sans-serif",a.fillText(B,Se,b+114),a.fillStyle="#ffffff",a.font="900 23px Arial, sans-serif",a.fillText(String(U).slice(0,10),Se,b+142)})}),a.fillStyle="rgba(226,255,215,0.72)",a.font="700 20px Arial, sans-serif",a.fillText("Generated by SlimeWire Clip Farm when mobile screen capture is blocked.",48,o-78),a.fillStyle="#78ff2d",a.font="900 24px Arial, sans-serif",a.fillText("slimewire.org",48,o-44)}async function Bh(e){hd(e,{progress:1});const t=await new Promise(r=>{try{e.toBlob(s=>r(s),"image/png",.92)}catch{r(null)}});if(!t){$i();return}const a=URL.createObjectURL(t);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:t,videoUrl:a,mimeType:"image/png",fileExtension:"png",status:"Mobile clip ready (.png)."},Je()}async function Rh(){const e=dd();if(!e){$i();return}const t=e.captureStream||e.mozCaptureStream;if(!t||!window.MediaRecorder){await Bh(e);return}Ti();const a=fd(),r=Date.now(),s=t.call(e,12),o=pd(),c=[],l=new MediaRecorder(s,o?{mimeType:o}:void 0),d=()=>hd(e,{rows:a,progress:(Date.now()-r)/4200});d();const u=setInterval(d,1e3/12);l.addEventListener("dataavailable",f=>{f.data?.size>0&&c.push(f.data)}),l.addEventListener("stop",()=>{Zn();const f=o||"video/webm",y=new Blob(c,{type:f}),b=y.size>0?URL.createObjectURL(y):"",v=Qn(y.type||f);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null,blob:y.size>0?y:null,videoUrl:b,mimeType:y.type||f,fileExtension:v,status:y.size>0?`Mobile clip ready (.${v}).`:"No mobile clip captured."},Je()},{once:!0}),l.start(500);const p=setTimeout(()=>{n.clipFarm?.recording&&er()},4300);n.clipFarm={recording:!0,status:"Recording mobile clip...",blob:null,videoUrl:"",mimeType:o,fileExtension:Qn(o),recorder:l,stream:s,chunks:c,fallbackFrameTimer:u,fallbackStopTimer:p},Je()}async function gd(){if(!cd()){if(ud()){await Rh();return}$i();return}if(n.clipFarm?.recording){er();return}Ti();try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1280},height:{ideal:720}},audio:!0}),t=pd(),a=[],r=new MediaRecorder(e,t?{mimeType:t}:void 0);r.addEventListener("dataavailable",s=>{s.data?.size>0&&a.push(s.data)}),r.addEventListener("stop",()=>{Zn();const s=t||"video/webm",o=new Blob(a,{type:s}),c=o.size>0?URL.createObjectURL(o):"",l=Qn(o.type||s);n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],blob:o.size>0?o:null,videoUrl:c,mimeType:o.type||s,fileExtension:l,status:o.size>0?`Clip ready (.${l}).`:"No clip captured."},Je()},{once:!0}),e.getVideoTracks?.()[0]?.addEventListener?.("ended",()=>er(),{once:!0}),r.start(1e3),n.clipFarm={recording:!0,status:"Recording...",blob:null,videoUrl:"",mimeType:t,fileExtension:Qn(t),recorder:r,stream:e,chunks:a},Je()}catch(e){Zn(),n.clipFarm={...n.clipFarm,recording:!1,recorder:null,stream:null,chunks:[],status:e?.name==="NotAllowedError"?"Recording cancelled.":"Recording could not start."},Je()}}function er(){const e=n.clipFarm?.recorder;if(!e){Zn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Je();return}try{if(e.state!=="inactive"){Nt("Saving clip..."),e.stop();return}}catch{}Zn(),n.clipFarm={...n.clipFarm,recording:!1,stream:null,recorder:null,chunks:[],fallbackFrameTimer:null,fallbackStopTimer:null},Je()}async function Ih(){const e=n.clipFarm?.blob;if(!e){Nt("Record a clip first.");return}const t=new File([e],md(),{type:e.type||n.clipFarm?.mimeType||"video/webm"});try{if(navigator.canShare?.({files:[t]})&&navigator.share){await navigator.share({title:"SlimeWire clip",text:"SlimeWire clip farm",files:[t]}),Nt("Shared.");return}}catch(a){if(a?.name==="AbortError"){Nt("Share cancelled.");return}}Nt("Use Save, then attach the clip to X or Telegram.")}function Oh(){const e=n.clipFarm?.videoUrl;if(!e){Nt("Record a clip first.");return}const t=document.createElement("a");t.href=e,t.download=md(),document.body.appendChild(t),t.click(),t.remove(),Nt("Saved.")}function Eh(e=null,t="chartTxns"){const a=e||Ks(),r=String(a?.tokenMint||n.smartChartToken||"").trim();return r?{mint:r,mode:t,src:cp(a,t)}:null}function Fh(e={}){if(e.refreshSmartChartFrame||n.route!=="terminal"||n.activeTab!=="smartChart")return null;const t=document.querySelector("[data-panel] .smart-chart-frame[data-chart-mint][data-chart-mode]"),a=t?.querySelector("iframe");if(!t||!a)return null;const r=String(t.dataset.chartMode||"chartTxns"),s=Eh(null,r);if(!s||t.dataset.chartMint!==s.mint||t.dataset.chartMode!==s.mode)return null;const o=String(t.dataset.chartSrc||a.getAttribute("src")||""),c=t.dataset.loaded==="true",l=o!==s.src;return t.dataset.preserving="true",{frame:t,mint:s.mint,mode:s.mode,src:l?o:s.src,loaded:c,keepByMint:l}}function Wh(e=null){if(!e?.frame||!e.frame.querySelector?.("iframe"))return!1;const t=String(e.mint||"").replace(/["\\]/g,"\\$&"),a=String(e.mode||"").replace(/["\\]/g,"\\$&"),r=document.querySelector(`[data-panel] .smart-chart-frame[data-chart-mint="${t}"][data-chart-mode="${a}"]`),s=r?.dataset?.chartSrc||r?.querySelector?.("iframe")?.getAttribute("src")||"";return!r||r===e.frame||s!==e.src&&!e.keepByMint?(e.frame.removeAttribute("data-preserving"),!1):(e.frame.removeAttribute("data-preserving"),e.loaded&&(e.frame.dataset.loaded="true"),r.replaceWith(e.frame),!0)}function h(e={}){if(!ce||!En||!re)return;if(rn(),!e.force&&wi()){sd();return}const t=L(),a=`${n.route}:${n.activeTab||"none"}`;try{n.perfRenderCounts={...n.perfRenderCounts||{},[a]:(n.perfRenderCounts?.[a]||0)+1},n.pendingRender=!1;const r=!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length);rn(),ce.dataset.activeTab=n.activeTab||"";const o=!!((e.preserveSmartChartFrame||n.activeTab==="smartChart")&&n.route==="terminal"&&n.activeTab==="smartChart"&&document.querySelector("[data-panel] .smart-chart-frame iframe"))?Fh(e):null,c=!!Ce,l=!!(c&&n.loginModalOpen);Xo&&(Xo.hidden=c||!!n.user||n.loginCollapsed),It("[data-connect-login-panel]",c||!!n.user||n.loginCollapsed),Ce?(Ce.hidden=!l,Ce.setAttribute("aria-hidden",l?"false":"true"),Ce.toggleAttribute("inert",!l),document.body.classList.toggle("login-modal-open",l),document.querySelectorAll("[data-login-tab]").forEach(v=>{const P=v.dataset.loginTab===n.loginModalTab;v.dataset.active=P?"true":"false",v.setAttribute("aria-selected",P?"true":"false")}),It("[data-login-modal-login-section]",n.loginModalTab!=="login"),It("[data-login-modal-create-section]",n.loginModalTab!=="create")):document.body.classList.remove("login-modal-open"),dc&&(dc.hidden=!1),uc&&(uc.hidden=!!n.user),pc&&(pc.hidden=!n.user),rn(),Ee("[data-user-id]",n.user?.id||"guest"),Ee("[data-wallet-count]",yi()),Ee("[data-total-sol]",_t().toFixed(4));const d=it();Ee("[data-position-count]",d.length),Ee("[data-realized]",vi());try{const v=m("[data-realized]");if(v){const P=/-/.test(String(vi()||""));v.classList.toggle("metric-neg",P),v.classList.toggle("metric-pos",!P)}}catch{}Ee("[data-top-sol]",`${_t().toFixed(4)} SOL`),Ee("[data-top-portfolio]",`${d.length} position${d.length===1?"":"s"}`),Ee("[data-sync-health]",r?rs():"Sync idle"),Ee("[data-active-preset-label]",Ph()),Pi(),Dh(),It("[data-refresh-spinner]",!n.walletRefreshing),document.querySelectorAll('[data-feature="ogre-tek"]').forEach(v=>{v.hidden=!qm||!Wm(Ae)});const u=m("[data-user-avatar]");u&&(u.innerHTML=sn("SW"));const p=m("[data-top-avatar]");p&&(p.innerHTML=sn("SW"));const f=n.user?.connectedWallet||null;Ee("[data-connected-wallet-summary]",f?`${f.provider||"Browser wallet"} connected: ${w(f.publicKey)}`:n.user?"No browser wallet connected.":"Browse scans now. Create or connect only when you are ready.");const y=m("[data-logout]");y&&(y.hidden=!n.user,y.disabled=!!n.logoutPending,S(y,n.logoutPending?"Logging out...":"Log Out")),n.route==="terminal"&&Xh(),Wh(o),wg(),kg(),rl(),Ta(),Aa(),As(),kr(),Vt(),wl(),n.route==="terminal"&&n.user&&!n.returnSummaryFetched&&(n.returnSummaryFetched=!0,Dw()),Je(),E(),Gw("render"),Yn(),de();const b=L()-t;(b>=16||n.perfRenderCounts[a]%20===0)&&W({component:"render",action:"render",durationMs:b,resultCount:n.perfRenderCounts[a],details:a}),ic=Date.now()}catch(r){rn(),Yn(),ni({component:"render-boundary",errorCode:r?.name||"RENDER_FAILED",message:r?.message||"Render failed",caughtByBoundary:!0});const s=m("[data-panel]");n.route==="terminal"&&s?(re.hidden=!1,s.innerHTML=`
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
      `),T("Display refresh failed. Your trade was not resubmitted. Tap Retry Refresh.")}}function bd(e=""){const t=String(e||"").trim();if(t)return t.toLowerCase();const a=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(a)return`connected:${String(a).toLowerCase()}`;const r=Array.isArray(n.wallets)&&n.wallets.length?n.wallets.map(s=>s.publicKey||s.address||s.label||"").filter(Boolean).join("|"):"";return r?`managed:${r.toLowerCase().slice(0,240)}`:"wallet-session"}function _h(e=""){try{return sessionStorage.getItem(`tpslAutoRevoked:${bd(e)}`)==="yes"}catch{return!1}}function yd(e,t=""){try{const a=`tpslAutoRevoked:${bd(t)}`;e?sessionStorage.setItem(a,"yes"):sessionStorage.removeItem(a)}catch{}}function Ai(e=""){yd(!1,e)}function vd(){return!!(Array.isArray(n.wallets)&&n.wallets.length||n.user?.connectedWallet||n.connectedWalletBalance?.publicKey)}function wd(){const e=n.user?.automationPermission||{},t=Date.parse(e.expiresAt||""),a=!!e.enabled&&Number.isFinite(t)&&t<=Date.now();return!!n.user?.automationPermissionActive&&!a&&!e.revokedAt}function Nh(){return!(!vd()||_h()||wd()||n.tpslAutoEnableInFlight)}function Sd(e="wallet-session"){if(!Nh())return;const t=L();n.tpslAutoEnableScheduledAt&&t-n.tpslAutoEnableScheduledAt<2e3||(n.tpslAutoEnableScheduledAt=t,n.tpslAutoEnableInFlight=!0,setTimeout(()=>{Gi("enable",{auto:!0,reason:e}).catch(a=>{n.automationDelegationStatus=a?.message||"TP/SL auto-enable failed.",T(n.automationDelegationStatus)}).finally(()=>{n.tpslAutoEnableInFlight=!1,Pi()})},50))}function Pi(){const e=m("[data-tpsl-status-button]");if(!e)return;const t=m("[data-tpsl-status-label]"),a=n.user?.automationPermission||{},r=!!n.user?.automationPermissionActive,s=!!a.revokedAt,o=Date.parse(a.expiresAt||""),c=!!a.enabled&&Number.isFinite(o)&&o<=Date.now(),l=r?"enabled":s||c?"invalid":"disabled";e.dataset.tpslState=l;const d=l==="enabled"?"TP/SL Enabled":l==="invalid"?"Re-enable TP/SL":"Enable TP/SL";S(t,d),e.setAttribute("aria-label",`${d}. Stop loss and take profit require wallet auto-sell approval.`),e.title=l==="enabled"?`Server exits enabled${a.expiresAt?` until ${Te(a.expiresAt)}`:""}.`:"Stop loss and take profit require wallet auto-sell approval."}function Dh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0,r=!!(t||a),s=r?"Connected":"Connect",o=t?"Wallet: Connected":a?`Wallets: ${a}`:"Wallet: Connect",c=t?`${e.provider||"Browser wallet"} connected: ${w(t)}`:a?`${a} SlimeWire wallet${a===1?"":"s"} available.`:"Connect a browser wallet.";document.querySelectorAll("[data-top-wallet-connect]").forEach(l=>{l.dataset.walletState=r?"connected":"disconnected",l.title=c,l.setAttribute("aria-label",r?`${c} Open wallets.`:"Connect wallet");const d=l.querySelector("[data-top-wallet-connect-label]")||l;S(d,s)}),document.querySelectorAll("[data-top-wallet-status]").forEach(l=>{l.dataset.walletState=t?"browser-connected":r?"managed-connected":"disconnected",l.title=t?`${c} Click to disconnect.`:r?`${c} Click to open wallets.`:"Click to connect a wallet.",l.setAttribute("aria-label",t?`${c}. Disconnect wallet.`:r?`${c} Open wallets.`:"Wallet not connected. Connect wallet."),S(l,o)})}async function Uh(){const e=n.user?.connectedWallet||n.connectedWalletBalance||null,t=String(e?.publicKey||"").trim(),a=Array.isArray(n.wallets)?n.wallets.length:0;if(t){await Me({title:"Disconnect Wallet",lines:[`Disconnect ${e.provider||"wallet"} ${w(t)}?`],confirmLabel:"Disconnect",danger:!0})&&await xu();return}if(a>0){Pe("/terminal","wallets");return}ma({returnPath:"/terminal"})}function qh(e=document){const t=()=>{const a=e.querySelector?.(".smart-chart-terminal")||document.querySelector(".smart-chart-terminal");if(!a)return;const r=Math.max(0,a.getBoundingClientRect().top+window.scrollY);window.scrollTo({top:r,behavior:"auto"})};requestAnimationFrame(()=>{t(),window.setTimeout(t,80),window.setTimeout(t,280),window.setTimeout(t,800)})}const kd=new Set(["terminal","live","slimeScope","kol","watchlist","liveTrades","sniper"]),Hh=[".signal-row[data-token-chart]",".terminal-token-row[data-token-chart]",".compact-signal-row[data-token-chart]","[data-token-chart][data-token-chart-source]"].join(",");function Kh(e=""){return String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function tr(){return!!(window.matchMedia?.("(max-width: 760px)")?.matches||(window.innerWidth||0)<=760)}function Ci(e=m("[data-panel]")){if(!e||n.route!=="terminal"||!kd.has(n.activeTab))return null;const t=e.dataset.renderedTab,a=document.scrollingElement||document.documentElement,r={tab:n.activeTab,windowY:window.scrollY||0,documentY:a?.scrollTop||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:re?.scrollTop||0,anchorKey:"",anchorTop:0},s=Array.from(e.querySelectorAll(Hh));if(t&&t!==n.activeTab&&!s.length||!s.length)return r;const o=s.find(l=>{const d=l.getBoundingClientRect(),u=tr()?42:72;return d.bottom>u&&d.top<Math.min(window.innerHeight||720,720)})||s[0],c=o?.dataset?.tokenChart||o?.dataset?.tokenMint||"";return{...r,anchorKey:c,anchorTop:o?o.getBoundingClientRect().top:0}}function Li(e,t=m("[data-panel]")){if(!e||n.route!=="terminal"||e.tab!==n.activeTab)return;const a=(o,c)=>{if(!o||!Number.isFinite(Number(c))||o.scrollHeight<=o.clientHeight+2)return;const l=Math.max(0,Math.min(Number(c),o.scrollHeight-o.clientHeight));Math.abs((o.scrollTop||0)-l)>4&&(o.scrollTop=l)},r=o=>{const c=document.scrollingElement||document.documentElement;a(re,e.dashboardScrollTop),a(o,e.panelScrollTop),a(c,e.documentY),Math.abs((window.scrollY||0)-Number(e.windowY||0))>8&&window.scrollTo(0,Math.max(0,Number(e.windowY||0)))},s=()=>{const o=t?.isConnected?t:m("[data-panel]");let c=!1;if(e.anchorKey&&o){const l=Kh(e.anchorKey),d=o.querySelector(`[data-token-chart="${l}"], [data-token-mint="${l}"]`);if(d){const p=d.getBoundingClientRect().top-Number(e.anchorTop||0);Number.isFinite(p)&&Math.abs(p)>1&&window.scrollTo(0,Math.max(0,(window.scrollY||0)+p)),c=!0}}c||r(o)};s(),requestAnimationFrame(()=>{s(),window.setTimeout(s,90),window.setTimeout(s,240),tr()&&window.setTimeout(s,520)})}function $d(e,t){const a=Object.keys(e.dataset||{}).filter(o=>o!=="customFor"&&o!=="customSelect").sort().map(o=>`${o}=${e.dataset[o]}`).join("|"),r=e.type==="checkbox"||e.type==="radio"?`:${e.value}`:"",s=`${e.tagName}:${e.type||""}:${e.name||""}:${a}${r}`;return a?s:`${s}:idx${t}`}function Td(e){const t=Array.from(e.options||[]),a=t.find(r=>r.defaultSelected);return a?a.value:t[0]?.value??""}function Vh(e){if(!e||e.dataset.renderedTab!==n.activeTab)return null;const t=new Map;let a="",r=null,s=null;return Array.from(e.querySelectorAll("input, textarea, select")).forEach((o,c)=>{const l=$d(o,c);if(t.has(l))return;const d=o.type==="checkbox"||o.type==="radio",u=o.tagName==="SELECT",p=d?String(o.defaultChecked):u?Td(o):o.defaultValue,f=d?String(o.checked):o.value;if(f!==p&&(t.set(l,{value:f,defaultValue:p,isToggle:d,isSelect:u}),document.activeElement===o)){a=l;try{r=o.selectionStart,s=o.selectionEnd}catch{}}}),t.size?{tab:n.activeTab,fields:t,focusedKey:a,selectionStart:r,selectionEnd:s}:null}function zh(e,t){if(!e||!t||e.tab!==n.activeTab)return;const a=Array.from(t.querySelectorAll("input, textarea, select")),r=s=>{a.forEach((o,c)=>{const l=o.tagName==="SELECT";if(s!==l)return;const d=$d(o,c),u=e.fields.get(d);if(!u)return;const p=o.type==="checkbox"||o.type==="radio";if((p?String(o.defaultChecked):l?Td(o):o.defaultValue)===u.defaultValue&&(p?o.checked=u.value==="true":o.value=u.value,d===e.focusedKey&&document.activeElement!==o))try{o.focus({preventScroll:!0}),Number.isFinite(e.selectionStart)&&Number.isFinite(e.selectionEnd)&&o.setSelectionRange(e.selectionStart,e.selectionEnd)}catch{}})};r(!0),r(!1)}function jh(e){return!e||n.route!=="terminal"||n.activeTab==="terminal"||kd.has(n.activeTab)||e.dataset.renderedTab!==n.activeTab||n.activeTab==="smartChart"&&n.chartScrollIntoView?null:{tab:n.activeTab,windowY:window.scrollY||0,panelScrollTop:e.scrollTop||0,dashboardScrollTop:re?.scrollTop||0}}function Gh(e,t){if(!e||e.tab!==n.activeTab)return;const a=()=>{const r=t?.isConnected?t:m("[data-panel]");r&&r.scrollHeight>r.clientHeight+2&&(r.scrollTop=Math.min(e.panelScrollTop,r.scrollHeight-r.clientHeight)),re&&re.scrollHeight>re.clientHeight+2&&(re.scrollTop=Math.min(e.dashboardScrollTop,re.scrollHeight-re.clientHeight)),Math.abs((window.scrollY||0)-e.windowY)>8&&window.scrollTo(0,Math.max(0,e.windowY))};a(),requestAnimationFrame(a)}function Xh(){const e=m("[data-panel]");if(!e)return;const t=Ci(e),a=Vh(e),r=jh(e),s=n.activeTab==="terminal"&&e.querySelector(".terminal-dock")?.scrollTop||0,o=n.activeTab==="terminal"?window.scrollY:0;document.querySelectorAll("[data-tab]").forEach(c=>{!c.closest(".tabs")&&!c.closest("[data-nav-drop]")&&c.removeAttribute("data-active")}),Lk();try{document.body.classList.toggle("launch-focus",window.location.pathname.includes("/launch-coin")&&n.activeTab==="launchCoin")}catch{}if(document.querySelectorAll(".tabs [data-tab]").forEach(c=>{c.dataset.active=c.dataset.tab===n.activeTab?"true":"false"}),document.querySelectorAll(".tabs .nav-tool-group").forEach(c=>{const l=!!c.querySelector('[data-active="true"]'),d=typeof window<"u"&&window.matchMedia?.("(min-width: 761px)")?.matches;c.open=!!d||!!n.navTekOpen||!mf()&&l}),n.activeTab==="terminal"&&(e.innerHTML=em()),n.activeTab==="tek"&&(e.innerHTML=Yh()),n.activeTab==="dashboard"&&(e.innerHTML=rg()),n.activeTab==="profile"&&(e.innerHTML=sg()),n.activeTab==="trade"&&(e.innerHTML=ub()),n.activeTab==="bundle"&&(e.innerHTML=yb()),n.activeTab==="volume"&&(e.innerHTML=Nb()),n.activeTab==="live"&&(e.innerHTML=em()),n.activeTab==="liveTrades"&&(e.innerHTML=pS()),n.activeTab==="slimeScope"&&(e.innerHTML=Iw()),n.activeTab==="watchlist"&&(e.innerHTML=TS()),n.activeTab==="smartChart"&&(e.innerHTML=tS()),n.activeTab==="launchCoin"&&(e.innerHTML=Gb()),n.activeTab==="launch"&&(e.innerHTML=Db()),n.activeTab==="kol"&&(e.innerHTML=uy()),n.activeTab==="ogreAi"&&(e.innerHTML=bb()),n.activeTab==="wallets"&&(e.innerHTML=Ov()),n.activeTab==="positions"&&(e.innerHTML=Nv()),n.activeTab==="pnl"&&(e.innerHTML=Kv()),n.activeTab==="txAudit"&&(e.innerHTML=Xp()),n.activeTab==="sniper"&&(e.innerHTML=LS()),e.dataset.renderedTab=n.activeTab||"",n.activeTab==="ogreTek"&&(e.innerHTML=FS(),e.dataset.renderedTab=n.activeTab||"",OS()),zh(a,e),bs(e),Gh(r,e),["trade","volume","launchCoin","sniper","ogreAi","bundle","positions","pnl"].includes(n.activeTab))try{fa[n.activeTab]&&!e.querySelector("[data-ogre-stage]")&&e.insertAdjacentHTML("afterbegin",ib(n.activeTab)),ob(e)}catch{}if(["terminal","live","kol","slimeScope","watchlist","smartChart"].includes(n.activeTab))try{tb(e,n.activeTab)}catch{}try{Zg()}catch{}if(n.activeTab==="smartChart"&&n.chartFocusAmountInput&&requestAnimationFrame(()=>{const c=m("[data-chart-buy-amount]");c&&c.focus(),n.chartFocusAmountInput=!1}),n.activeTab==="smartChart"&&n.chartScrollIntoView&&(qh(e),n.chartScrollIntoView=!1),n.activeTab==="terminal"){const c=e.querySelector(".terminal-dock");c&&(c.scrollTop=s),requestAnimationFrame(()=>{Math.abs(window.scrollY-o)>8&&window.scrollTo(0,o);const d=e.querySelector(".terminal-dock");d&&(d.scrollTop=s)})}Li(t,e),vh(),pa(),ts(),jn(),as(),hi(),n.activeTab==="kol"&&zi()}function Jh(){const e=n.pnl?.totals?.realizedSol||"+0 SOL";return`
    <div class="tek-wallet-bar">
      <div class="tek-stat"><span>Wallets</span><strong>${i(n.wallets.length)}</strong></div>
      <div class="tek-stat"><span>Total SOL</span><strong>${i(_t().toFixed(4))}</strong></div>
      <div class="tek-stat"><span>Positions</span><strong>${i(n.positions?.length||0)}</strong></div>
      <div class="tek-stat"><span>Realized</span><strong>${i(e)}</strong></div>
      <div class="tek-wallet-actions">
        <button data-tab="positions">Positions</button>
        <button data-tab="wallets">Wallets</button>
        <button data-tab="kol">KOL</button>
      </div>
    </div>
  `}function Yh(){const e=[["ogreAi","Ogre A.I.","Auto-scan and ape the best pick by category."],["volume","SlimeBot","Auto-volume engine across recycled wallets."],["bundle","Bundle","Buy or sell one token across many wallets."],["launchCoin","Launch","Create and launch a Pump.fun token."],["launch","Snipe","Watch known tickers and new launches for entries."]];return`
    <section class="tek-hub">
      <div class="tek-hub-head">
        <div>
          <h2 class="tek-hub-title">OGRE TEK</h2>
          <p>Your pro automation deck. Pick a tool — wallets, positions, sponsors, and KOLs stay in view.</p>
        </div>
      </div>
      ${Jh()}
      <div class="tek-tool-grid">
        ${e.map(([t,a,r])=>`
          <button type="button" class="tek-tool-card" data-tab="${t}">
            <span class="tek-tool-icon" data-tek-icon="${t}" aria-hidden="true"></span>
            <strong>${i(a)}</strong>
            <small>${i(r)}</small>
          </button>`).join("")}
      </div>
      ${eg()}
      ${tg()}
    </section>
  `}const Ad="slimewire-ogre-memory";function ss(){try{return JSON.parse(localStorage.getItem(Ad)||"{}")||{}}catch{return{}}}function os(e={}){const t={...ss(),...e};try{localStorage.setItem(Ad,JSON.stringify(t))}catch{}return t}function Qh(e,t=""){if(!e)return;const r=(ss().recentTokens||[]).filter(s=>s.mint!==e);r.unshift({mint:e,symbol:String(t||"").slice(0,14),at:Date.now()}),os({recentTokens:r.slice(0,5)})}(function(){const t=ss();t.quickBuy&&!n.quickBuyAmountOverride&&(n.quickBuyAmountOverride=t.quickBuy)})();function Pd(){const t=pr().filter(l=>{const d=Number(l.marketCapUsd??l.marketCap)||0;return d>0&&d<8e3}).length,r=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active"].includes(String(l.status||"").toLowerCase())),s=r.filter(l=>{const d=Number(l.lastMovePct??l.wallets?.[0]?.lastMovePct),u=Number(l.takeProfitPct);return Number.isFinite(d)&&Number.isFinite(u)&&u>0&&d>u*.7}).length,o=Number(n.shieldReceipts?.stats?.watching||0),c=Number(n.proofStats?.wins||0);return[c?`✅ ${c} tracked call(s) hit 2x - the proof wall has receipts`:"",t?`🐣 ${t} fresh under 8k MC on the feed`:"",r.length?`🛡 ${r.length} plan(s) armed${s?` - ${s} near take-profit`:""}`:"",o?`🔎 ${o} flagged token(s) being tracked to outcome`:""].filter(Boolean)}let Cd=!1;function Zh(){if(Cd||$n().length)return;Cd=!0;const e=Pd(),t=ss(),a=[t.quickBuy?`your quick buy is still ${t.quickBuy} SOL`:"",t.risk==="degen"?"serving the early risky ones first, like you asked":t.risk==="careful"?"keeping it shield-clean first, like you asked":"",t.recentTokens?.[0]?.symbol?`last visit you were on $${t.recentTokens[0].symbol}`:""].filter(Boolean),r=a.length?` I remember: ${a.join(", ")}.`:"";fe({role:"assistant",text:e.length?`Welcome back. Right now: ${e.join(". ")}.${r} Ask me anything or say "open positions".`:`Welcome to SlimeWire. I can navigate anywhere, check any CA, set your quick buy, and run trades from chat.${r} Try "whats cooking" or paste a token address.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"}]})}function eg(){return`
    <section class="trade-card ogre-brief-card">
      <div class="trade-head">
        <div>
          <h3>Ogre Brief</h3>
          <p>Right now, at a glance.</p>
        </div>
      </div>
      <ul class="ogre-brief-list">
        ${[...Pd(),"🧾 Proof wall is public - slimewire.org/proof"].map(t=>`<li>${i(t)}</li>`).join("")}
      </ul>
    </section>
  `}function tg(){ng();const e=n.shieldReceipts;if(!e)return`
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
                <span>Flagged ${i(r.verdict)} (score ${i(String(r.score))}) ${r.confirmedAfterMinutes?`- confirmed dead within ${i(ag(r.confirmedAfterMinutes))}`:""}</span>
                ${r.summary?`<small>${i(r.summary)}</small>`:""}
              </div>
              <div class="card-actions compact">
                <button data-copy="${i(r.mint)}">Copy CA</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No confirmed rugs in the log yet - receipts build up as the shield flags live tokens.</p>'}
    </section>
  `}function ag(e){const t=Number(e)||0;return t<90?`${t} min`:t<2880?`${Math.round(t/60)}h`:`${Math.round(t/1440)}d`}let Ld=0;function ng(){Date.now()-Ld<300*1e3||(Ld=Date.now(),k("/api/web/shield/receipts").then(e=>{n.shieldReceipts=e,n.activeTab==="tek"&&h()}).catch(()=>{}),k("/api/web/proof").then(e=>{n.proofStats=e?.alpha||null}).catch(()=>{}))}function rg(){return`
    ${hg()}
    ${is()}
    <section class="panel-grid">
      ${ar("visual-trade","Trade Desk","Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.","trade")}
      ${ar("visual-bundle","Bundle + Volume","Buy or sell across selected wallets, then manage timed exits with Volume plans.","bundle")}
      ${ar("visual-launch","Launch Snipe","Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.","launch")}
      ${ar("visual-kol","KOL Tracker","Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.","kol")}
      ${ar("visual-live","Cooks","Auto-refresh new Pump and fresh-pair listings cooking right now, with safety-filtered Trade, Bundle, and Share actions.","live-pairs")}
    </section>
    ${Id()}
    ${Rd()}
    ${Od()}
  `}function sg(){if(!xi())return`
      <section class="profile-row-shell profile-wallet-gate-shell">
        ${Md(!1)}
        <section class="profile-row-list">
          ${pg()}
          ${Bd()}
        </section>
        ${xd()}
      </section>
    `;const t=[{key:"account",label:"Account",hint:"Profile & name",html:mg()},{key:"login",label:"Login",hint:"Security",html:fg()},{key:"pfp",label:"PFP",hint:"Avatar",html:gg()},{key:"x",label:"X",hint:"Connect X",html:$g()},{key:"alerts",label:"Alerts",hint:"Push to phone",html:og()},{key:"badges",label:"Badges",hint:"Earned",html:Bd()},{key:"referral",label:"Referral",hint:"Invite & earn",html:Tg()},{key:"board",label:"Board",hint:"Top traders",html:Pg()}];return`
    <section class="profile-row-shell">
      ${Md(!0)}
      ${cn({toolKey:"profile",activeKey:dn("profile","account"),sections:t})}
      ${xd()}
    </section>
  `}function xd(){return`
    <div style="display:flex;justify-content:center;padding:30px 0 10px;">
      <img src="/assets/slimewire/svg/slimewire-mark.svg" alt="" data-trailer-mode
        style="width:22px;height:22px;opacity:0.32;" />
    </div>
  `}function og(){const e="serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window,t=e?Notification.permission:"unsupported",a=n.pushAlertsEnabled===!0;return`
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
  `}async function ig(){const e=m("[data-push-status]");try{S(e,"Creating your Telegram link...");const t=await k("/api/web/telegram/link-code",{method:"POST",body:"{}"});if(!t.url){S(e,"Telegram bot is not configured.");return}window.open(t.url,"_blank","noopener,noreferrer"),S(e,"Telegram opened - tap Start there, then type /mywins on in any group with the bot.")}catch(t){S(e,N(t?.message||"Could not create the link."))}}function lg(e){const t="=".repeat((4-e.length%4)%4),a=(e+t).replace(/-/g,"+").replace(/_/g,"/"),r=window.atob(a);return Uint8Array.from([...r].map(s=>s.charCodeAt(0)))}async function cg(){const e=m("[data-push-status]");try{S(e,"Setting up push alerts...");const t=await k("/api/web/push/key");if(!t.enabled||!t.publicKey){S(e,"Push alerts are not configured on the server yet.");return}const a=await navigator.serviceWorker.register("/sw.js");if(await navigator.serviceWorker.ready,await Notification.requestPermission()!=="granted"){S(e,"Notification permission was not granted.");return}const s=await a.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:lg(t.publicKey)}),o=await k("/api/web/push/subscribe",{method:"POST",body:JSON.stringify({subscription:s.toJSON()})});n.pushAlertsEnabled=!0,S(e,`Push alerts enabled (${o.devices||1} device${(o.devices||1)===1?"":"s"}).`),h()}catch(t){S(e,N(t?.message||"Could not enable push alerts."))}}async function dg(){const e=m("[data-push-status]");try{const a=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();a&&(await k("/api/web/push/unsubscribe",{method:"POST",body:JSON.stringify({endpoint:a.endpoint})}).catch(()=>{}),await a.unsubscribe().catch(()=>{})),n.pushAlertsEnabled=!1,S(e,"Push alerts disabled on this device."),h()}catch(t){S(e,N(t?.message||"Could not disable push alerts."))}}async function ug(){try{if(!("serviceWorker"in navigator)||!("PushManager"in window))return;const t=await(await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription();n.pushAlertsEnabled=!!t}catch{}}function xi(){return!!(ue()?.publicKey||n.user?.connectedWallet?.publicKey||Array.isArray(n.wallets)&&n.wallets.length)}function Md(e=xi()){return`
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>${e?"Customize your account, PFP, X profile, referrals, and trader-board settings.":"Connect or create a wallet first. Profile customization, PFPs, X, referrals, and web wallet settings unlock after Wallet Ready."}</p>
      </div>
    </section>
  `}function pg(){const e=ue();return`
    <section class="create-wallet-card profile-wallet-first-card">
      <div class="profile-wallet-first-copy">
        <span class="quest-chip">First quest</span>
        <h3>Get Wallet Ready</h3>
        <p>Connect Phantom, Solflare, Backpack, or create a SlimeWire-managed wallet before opening customization. This keeps new users focused on getting live first.</p>
      </div>
      <div class="wallet-provider-buttons profile-wallet-first-actions">
        ${cs().slice(0,3).map(t=>`
          <button type="button" data-connect-wallet="${t.id}" ${t.detected?"":`title="${i(t.label)} ${t.mobileRedirect?"mobile flow available":"extension not detected"}"`}>
            ${i(t.mobileRedirect?`Open ${t.label}`:t.label)}
          </button>
        `).join("")}
        <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
      </div>
      <small data-wallet-connect-status>${e?.publicKey?`Connected ${i(e.shortPublicKey||w(e.publicKey))}.`:"Wallet connection unlocks PFPs, X profile, referrals, trader settings, and account customization."}</small>
    </section>
  `}function mg(){const e=n.user?.connectedWallet;return`
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${sn("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${e?`Public wallet connected: ${i(e.shortPublicKey||w(e.publicKey))}`:"Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${e?`<button type="button" data-copy="${i(e.publicKey)}">Copy Connected</button>`:'<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>'}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `}function fg(){const e=n.user?.username||"";return`
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
  `}function hg(){return`
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `}function ar(e,t,a,r="trade"){return`
    <article class="panel visual-card ${e}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${i(r)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${i(t)}</h3>
        <p>${i(a)}</p>
      </div>
    </article>
  `}function gg(){const e=!!n.user?.avatar,t=n.xHandle?`@${n.xHandle}`:"";return`
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
      ${bg()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${n.xHandle?"":"disabled"}>${t?`Use ${i(t)} PFP`:"Use X PFP"}</button>
        ${e?'<button type="button" data-clear-avatar>Remove</button>':""}
      </div>
      <small data-avatar-status>${e?`PFP saved${n.user.avatarSource?` from ${i(n.user.avatarSource)}`:""}.`:"Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `}function bg(){return`
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${[["./assets/slimewire/png/slimewire-mark.png","SlimeWire"],["./assets/slimewire/png/token-mascots/token-mascot-1.png","Ogre"],["./assets/slimewire/png/token-mascots/token-mascot-2.png","Swamp"],["./assets/slimewire/png/token-mascots/token-mascot-3.png","Moss"],["./assets/slimewire/png/token-mascots/token-mascot-4.png","Slime"]].map(([t,a])=>`
        <button type="button" data-preset-avatar="${i(t)}" data-avatar-label="${i(a)}" aria-label="Use ${i(a)} PFP">
          <img src="${i(t)}" alt="">
        </button>
      `).join("")}
    </div>
  `}function Bd(){const e=Number(n.pnl?.totals?.tradeCount||0),t=xi(),a=Number(n.livePairRows?.length||0)+Number(n.terminalEntry?.items?.length||0)+Number(n.livePairsByBucket?.fresh?.length||0),r=!!(n.lastUpdatedAt&&!n.walletRefreshError||n.walletRefreshStatus==="success"),s=[{label:"Wallet Ready",detail:"Connect, create, or import a wallet to unlock the profile hub.",earned:t,icon:"./assets/slimewire/svg/icons/wallet.svg",quest:"Quest 01"},{label:"Live Watcher",detail:"Open live feeds and watch fresh pairs moving in real time.",earned:a>0||!!n.watchlist?.length,icon:"./assets/slimewire/svg/icons/watchlist.svg",quest:"Quest 02"},{label:"System Synched",detail:"Your wallet/feed state returned a clean recent sync.",earned:r,icon:"./assets/slimewire/svg/icons/health.svg",quest:"Quest 03"},{label:"Active Preset",detail:"Save or select a fast trade preset.",earned:!!le("trade",n.selectedTradePresetId),icon:"./assets/slimewire/svg/icons/snipe.svg",quest:"Quest 04"},{label:"Best Picks Scout",detail:"Open Live Terminal, Ogre A.I., or Sniper scans.",earned:!!(n.livePairRows?.length||n.scan||n.ogreAiPick),icon:"./assets/slimewire/svg/icons/best-picks.svg",quest:"Quest 05"},{label:"Trader",detail:"Complete trades tracked by SlimeWire.",earned:e>0,icon:"./assets/slimewire/svg/icons/trade.svg",quest:"Quest 06"}],o=s.filter(l=>l.earned).length,c=Math.round(o/Math.max(1,s.length)*100);return`
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
        ${s.map(({label:l,detail:d,earned:u,icon:p,quest:f})=>`
          <article class="earned-badge ${u?"is-earned":""}">
            <span class="earned-badge-icon">
              <img src="${i(p)}" alt="" aria-hidden="true">
            </span>
            <span class="earned-badge-quest">${i(f)}</span>
            <strong>${i(l)}</strong>
            <small>${u?"Earned":"Locked"} - ${i(d)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `}function is(){const e=n.user?.connectedWallet,t=!!n.user?.avatar,a=n.xHandle?`@${n.xHandle}`:"";return`
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
          ${cs().map(r=>`
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

      ${Mi()}

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
  `}function l0(){const e=n.user?.connectedWallet;return`
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${cs().map(t=>`
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
    ${Mi({compact:!0})}
  `}function Mi({compact:e=!1}={}){const t=n.user?.connectedWallet,a=Array.isArray(n.wallets)?n.wallets.length:0,r=n.wallets.filter(d=>d.sessionWallet),s=n.user?.automationPermission||{},o=!!n.user?.automationPermissionActive,c=s.expiresAt?Te(s.expiresAt):"",l=n.automationDelegationStatus||(a?`${a} managed automation wallet(s) available. ${o?`Server exits enabled until ${c}.`:"TP/SL auto-enables when a wallet is connected or created."}`:"Create one automation wallet before relying on server-side exits.");return`
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
  `}function ma({returnPath:e="/terminal"}={}){n.walletConnectMenuOpen=!0,n.walletConnectReturnPath=e||"/terminal",n.walletConnectStatus=n.user?.connectedWallet?`Connected ${w(n.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`:"Pick a wallet. Your extension will ask you to approve.",h({force:!0})}function yg(e={}){return ma(e)}window.openWalletConnectModal=yg;function vg(e){n.walletFastApprovalsEnabled=!!e;try{localStorage.setItem("walletFastApprovalsEnabled",n.walletFastApprovalsEnabled?"on":"off")}catch{}}function wg(){const e=m("[data-wallet-connect-modal]");if(!e)return;if(!n.walletConnectMenuOpen){e.hidden=!0,e.innerHTML="",e.__lastDrawerHtml="";return}const t=n.user?.connectedWallet||n.connectedWalletBalance;e.hidden=!1,Sn(e,`
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
        ${cs().map(a=>`
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
  `,".wallet-connect-dialog")}function Sg(){const e=n.quickBuyModal||{},t=Ks()?.tokenMint===e.tokenMint?Ks():ve(e.tokenMint,{source:e.source||"quick-buy-modal"}),a=/validating|submitting|opening wallet/i.test(String(e.status||"")),r=Bi(e.error||e.status||""),s=a||!!r,o=pe(e.walletIndex||"");return`
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${ht(t)}
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
          ${ln(e.walletIndex||(ue()?.publicKey?"connected":""))}
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
  `}function Bi(e=""){const t=String(e||"");return t?/token-?2022/i.test(t)?"Token-2022 needs a trusted Pump/Bonk/Meteora/Orca/Raydium pool before fast buy can continue. Open Chart/Full Trade if you want to inspect the route first.":/token safety check failed|honeypot|honey\s*pot|mint authority|freeze authority|blacklist|cannot sell|sell blocked|no sell|rug|scam|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|no liquidity|pool drained|mayhem/i.test(t)?"Fast buy is blocked by token safety checks. Use Chart/Full Trade to inspect it; SlimeWire will not quick-buy risky route signals.":"":""}function kg(){let e=m("[data-quick-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-quick-buy-modal-root",""),document.body.appendChild(e)),!n.quickBuyModal?.open){e.hidden=!0,e.innerHTML="",document.body.classList.remove("quick-buy-modal-open");return}e.hidden=!1,e.innerHTML=Sg(),document.body.classList.add("quick-buy-modal-open")}function $g(){const e=!!n.xHandle;return`
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
  `}function Tg(){const e=n.user?.referralCode||"",t=`${Bt.replace(/\/+$/,"")}/r/`,a=n.user?.referralLink||(e?`${Bt.replace(/\/+$/,"")}/r/${encodeURIComponent(e)}`:""),r=n.user?.referralStats||{},s=Array.isArray(r.referrals)?r.referrals:[];return`
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
        ${a?Ye(`Trade faster on SlimeWire. Referral: ${a}`,"Share X"):""}
        ${a?Ed(`Trade faster on SlimeWire. Referral: ${a}`,"Share TG"):""}
      </div>
      <small data-referral-status>${e?`Direct link ready. Code: ${i(e)}${n.user?.referredByCode?` | Referred by ${i(n.user.referredByCode)}`:""}`:"Create or log in to get a referral link."}</small>
    </section>
  `}function Ag(e=""){const t=String(e||"").trim();if(!t)return"";try{const r=new URL(t,Bt).pathname.split("/").map(o=>o.trim()).filter(Boolean),s=r.findIndex(o=>o.toLowerCase()==="r");if(s>=0&&r[s+1])return decodeURIComponent(r[s+1]);if(r.length)return decodeURIComponent(r[r.length-1])}catch{}return t.replace(/^https?:\/\/[^/]+\/?/i,"").replace(/^r\//i,"").replace(/^\/+|\/+$/g,"")}function Pg(){const e=n.user?.traderBoardWalletMode||"all",t=Array.isArray(n.user?.traderBoardWalletIndexes)?n.user.traderBoardWalletIndexes:n.wallets.map(a=>String(a.index));return`
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
        ${n.wallets.length?kt("trader-board",t):'<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>'}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${n.user?.showOnTraderBoard?"You are opted in. Ranking updates from saved SlimeWire trade history.":"Off by default. Referral is not required."}</small>
    </section>
  `}function Rd(){return`
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
  `}function Id(){return`
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
  `}function Od(){return n.downloads?`
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `:""}function Ye(e,t="Share X"){return`<button type="button" data-share-x data-share-text="${i(e)}">${i(t)}</button>`}function Ed(e,t="TG"){const a=Ri(e),r=`https://t.me/share/url?url=${encodeURIComponent(Bt)}&text=${encodeURIComponent(a)}`;return`<a href="${i(r)}" target="_blank" rel="noreferrer">${i(t)}</a>`}function Ri(e){const t=String(e||"").replace(/\s+/g," ").trim();return`${t.length>210?`${t.slice(0,207).trim()}...`:t} ${Bt}`}function Cg(e){const t=e.type==="buy",a=t?`${e.spentSol} SOL`:`${e.netSol} SOL`;return`${t?"Bought":"Sold"} ${e.shortMint||w(e.tokenMint)} for ${a}. Chart ${Q(e.tokenMint)}`}function c0(e){return`${e.type==="bundle_sell"?"Bundle sold":e.source==="web_bundle_plan"?"Armed bundle auto-exit":"Bundle bought"} ${e.shortMint||w(e.tokenMint)} across ${e.successCount||0}/${e.walletCount||0} wallet(s).`}function Lg(e,t="Armed timed trade"){return`${t} on ${e.shortMint||w(e.tokenMint)} with ${e.successCount||0}/${e.walletCount||0} wallet(s), TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Fd(e){return`PnL on ${e.shortMint||w(e.tokenMint)}: ${e.realizedSol} realized, ${e.buys} buy(s), ${e.sells} sell(s).`}function xg(e){return`Watching ${e.shortMint||w(e.tokenMint)}: ${e.uiAmount} tokens across ${e.walletCount} wallet(s), PnL ${e.openPnlSol||e.realizedSol||"tracking"}.`}function Mg(e){return`Watching ${e.symbol||w(e.tokenMint)}: score ${e.score}/100, MC ${e.marketCapLabel}, liq ${e.liquidityLabel}. Chart ${Q(e.tokenMint)}`}function Bg(e){return`KOL signal ${e.symbol||w(e.tokenMint)}: score ${e.score||0}/100, value ${e.valueLabel||"$0"}, signal ${e.winRateLabel||"n/a"}. Chart ${Q(e.tokenMint)}`}function Rg(e){return`Watching KOL ${e.twitter?`@${e.twitter}`:e.name||e.shortWallet||w(e.wallet)}: realized ${e.realizedLabel||"n/a"}, ROI ${e.roiLabel||"n/a"}, trades ${e.trades??"n/a"}.`}function Ig(e){return`Watching $${e.ticker} with Launch Snipe: ${e.walletCount} wallet(s), ${e.amountSol} SOL each, TP ${e.takeProfitSummary||`+${e.takeProfitPct}%`}, SL ${e.stopLossSummary||`-${e.stopLossPct}%`}.`}function Ii(e){const t=String(e||"").trim(),a=t.startsWith("$")?t:t.length>30?w(t):`$${t.replace(/^\$+/,"")}`,r=t.length>30?` Chart ${Q(t)}`:"";return`Watching ${a}.${r}`}function Wd(e){const t=String(e||"").trim();return`Watching KOL ${t.startsWith("@")?t:t.length>30?w(t):`@${t.replace(/^@+/,"")}`}.`}const Og=[{tier:"hot",pinned:!0,rank:1,name:"Idontpaytaxes",twitter:"Idontpaytaxes",wallet:"",kolscanUrl:"https://kolscan.io/account/2T5NgDDidkvhJQg8AHDI74uCFwgp25pYFMRZXBaCUNBH",tag:"External KOLscan profile",note:"External public/KOLscan stats only. These are not SlimeWire trades and do not create SlimeWire fees unless copied through your SlimeWire wallets. Add a verified Solana wallet before scan/copy.",winRateLabel:"36.8%",realizedLabel:"-$28.1",roiLabel:"Watch",trades:"24 ext",volumeLabel:"$6.58K volume",lastTradeAt:new Date(Date.now()-1020*60*1e3).toISOString()},{tier:"slimewire",pinned:!0,rank:1,name:"MoonPieJoe",twitter:"moonpiejoe",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"},{tier:"slimewire",pinned:!0,rank:2,name:"Rezzy",twitter:"zero_taxes",tag:"SlimeWire KOL",note:"Supporter profile. Add wallet later to enable scan/copy trade.",winRateLabel:"Supporter",realizedLabel:"n/a",roiLabel:"Social",trades:"Add wallet"}];function Oi(e=""){const t=String(e||"").trim().toLowerCase();return Og.filter(a=>!t||String(a.tier||"").toLowerCase()===t).sort((a,r)=>+!!r.pinned-+!!a.pinned||Number(a.rank||999)-Number(r.rank||999))}function Dt(e=""){return/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(e||"").trim())}function _d(e=""){const t=String(e||"").trim();return Dt(t)?t:""}function Eg(e={}){const t=String(e.wallet||"").trim(),a=_d(t),r=et(e.twitter||e.x||e.username||"");return{x:r?Wi(r):"",wallet:a?`https://solscan.io/account/${encodeURIComponent(a)}`:"",kolscan:e.kolscanUrl||e.externalProfileUrl||(a?Fc(a):"")}}function Fg(e={}){const t=String(e.wallet||"").trim(),a=_d(t),r=Eg(e);return`
    <div class="curated-kol-actions">
      ${r.x?`<a href="${i(r.x)}" target="_blank" rel="noreferrer">X</a>`:""}
      ${r.kolscan?`<a href="${i(r.kolscan)}" target="_blank" rel="noreferrer">KOLscan</a>`:""}
      ${r.wallet?`<a href="${i(r.wallet)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
      ${a?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a)}">Copy Setup</button>`:'<button type="button" class="kol-copy-bubble" disabled title="Verified Solana wallet needed before copy setup.">Wallet Pending</button>'}
      ${a?`<button data-kol-scan-wallet="${i(a)}">Scan</button>`:'<button type="button" disabled title="Verified Solana wallet needed before scan.">Scan Locked</button>'}
      ${a?`<button data-kol-copy-wallet="${i(a)}">Copy</button>`:"<span>Verify wallet to copy</span>"}
      ${a?`<button data-copy="${i(a)}">CA</button>`:""}
      ${Vi(e)}
    </div>
  `}function Nd(e={},t={}){const a=!!t.compact,r=String(e.wallet||"").trim();return`
    <article class="curated-kol-card ${a?"is-compact":""}" data-tier="${i(e.tier||"hot")}">
      <div class="curated-kol-top">
        ${qd(e,a?"kol-avatar small":"kol-avatar")}
        <div>
          <span>${i(e.tag||"Curated wallet")}</span>
          <h3>${i(e.name||e.twitter||w(r)||"KOL Wallet")}</h3>
          <p>${e.twitter?`@${i(et(e.twitter))}`:i(w(r)||"Social pending")}</p>
        </div>
        <b>#${i(e.rank||1)}</b>
      </div>
      <dl>
        <div><dt>Win</dt><dd>${i(e.winRateLabel||"n/a")}</dd></div>
        <div><dt>Realized</dt><dd>${i(e.realizedLabel||"n/a")}</dd></div>
        <div><dt>${e.tier==="hot"?"Ext Trades":e.wallet?"Trades":"Status"}</dt><dd>${i(e.trades??"n/a")}</dd></div>
      </dl>
      <small>${i(e.note||e.volumeLabel||"Curated SlimeWire KOL database entry.")}</small>
      ${Fg(e)}
    </article>
  `}function Wg(){const e=Oi("hot"),t=Oi("slimewire");return`
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
  `}function sn(e="SW"){const t=Qe(n.user?.avatar||"");if(Dd(t))return`<img src="${i(t)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${Ml("ogre")}';">`;const a=Ml("ogre");if(e==="SW"||e==="OG")return`<img src="${a}" alt="">`;const r=String(e||"SW").trim().slice(0,2).toUpperCase()||"SW";return`<span>${i(r)}</span>`}function Dd(e){const t=String(e||"").trim();return/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)||/^https?:\/\/[^\s"'<>]+$/i.test(t)}function Qe(e){const t=String(e||"").trim();if(!t)return"";if(/^\/api\/web\/token-image\?/i.test(t))return t;if(/^ipfs:\/\//i.test(t)){const a=t.replace(/^ipfs:\/\//i,"").replace(/^ipfs\//i,"");return a?`https://ipfs.io/ipfs/${encodeURIComponent(a).replace(/%2F/g,"/")}`:""}return/^\/\//.test(t)?`https:${t}`:/^https?:\/\/[^\s"'<>]+$/i.test(t)||/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(t)?t:""}function _g(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim();return t?`/api/web/token-image?mint=${encodeURIComponent(t)}`:""}function Ng(e="",t=""){const a=String(e||"").trim(),r=Qe(t);if(!a||!r||ls(a,r))return"";if(yt.set(a,r),se("avatarCacheHit"),yt.size>900){for(const s of yt.keys())if(yt.delete(s),yt.size<=720)break}return r}function Ud(e="",t=""){return`${String(e||"").trim()}|${Qe(t)}`}function Dg(e=""){return/^\/api\/web\/token-image\?/i.test(String(e||""))?45e3:1800*1e3}function ls(e="",t=""){const a=Ud(e,t);if(!Zt.has(a))return!1;const r=Number(Rr.get(a)||0);return r&&Date.now()-r>Dg(t)?(Zt.delete(a),Rr.delete(a),!1):!0}function Ug(e="",t=""){const a=String(e||"").trim(),r=Qe(t);if(!a||!r)return;const s=Ud(a,r);if(Zt.add(s),Rr.set(s,Date.now()),Zt.size>1200){for(const o of Zt)if(Zt.delete(o),Rr.delete(o),Zt.size<=900)break}yt.get(a)===r&&yt.delete(a),se("avatarFetchFailed")}function Ei(e="",...t){const a=String(e||"").trim(),r=a?yt.get(a):"";if(r&&!ls(a,r))return se("avatarCacheHit"),r;r&&yt.delete(a);for(const s of t){const o=Qe(s);if(o&&!ls(a,o))return se("avatarCacheMiss"),o}return se("avatarFallbackShown"),""}window.__slimeRememberAvatar=Ng,window.__slimeAvatarLoadFailed=function(t){const a=t?.dataset?.avatarKey||"",r=t?.currentSrc||t?.src||t?.dataset?.avatarSrc||"";Ug(a,r);const s=Qe(t?.dataset?.backupSrc||"");if(s&&!ls(a,s)){t.dataset.backupSrc="",t.dataset.avatarSrc=s,t.src=s;return}const o=Qe(t?.dataset?.proxySrc||""),c=Number(t?.dataset?.avatarRetries||0);if(o&&c<3){t.dataset.avatarRetries=String(c+1),t.hidden=!0,setTimeout(()=>{try{if(!t.isConnected)return;t.hidden=!1,t.src=o+(o.indexOf("?")>=0?"&":"?")+"rt="+(c+1)}catch{}},2600);return}t&&(t.hidden=!0,t.removeAttribute("src"))};function Fi(e){const t=et(e);return t?`https://unavatar.io/twitter/${encodeURIComponent(t)}`:""}function Wi(e=n.xHandle){const t=et(e);return t?`https://x.com/${encodeURIComponent(t)}`:"https://x.com/i/flow/login"}function qg(e={}){const t=Qe(e.avatar||e.image||"");if(Dd(t))return t;const a=et(e.twitter||e.x||e.username||"");if(a)return Fi(a);const r=et(e.name||e.kolName||"");return r&&r.length>=2?Fi(r):""}function Hg(e={}){return String(e.twitter||e.name||e.kolName||e.shortWallet||e.wallet||"KO").trim().replace(/^@+/,"").slice(0,2).toUpperCase()||"KO"}function qd(e={},t="kol-avatar"){const a=`kol:${String(e.wallet||e.address||e.twitter||e.x||e.username||e.name||e.kolName||"").trim().toLowerCase()}`,r=Ei(a,qg(e)),s=Hg(e);return r?`<img class="${i(t)}" src="${i(r)}" data-avatar-key="${i(a)}" data-avatar-fallback="${i(s)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="var d=document.createElement('div');d.className=this.className+' kol-avatar-fallback';d.setAttribute('aria-hidden','true');d.textContent=this.dataset.avatarFallback||'KO';this.replaceWith(d);">`:`<div class="${i(t)} kol-avatar-fallback" aria-hidden="true">${i(s)}</div>`}function cs(){const e=Ge();return[{id:"phantom",label:"Phantom",detected:!!ge("phantom"),mobileRedirect:e&&!!qn("phantom"),installUrl:ii("phantom"),icon:Ya("phantom")},{id:"solflare",label:"Solflare",detected:!!ge("solflare"),mobileRedirect:e&&!!qn("solflare"),installUrl:ii("solflare"),icon:Ya("solflare")},{id:"backpack",label:"Backpack",detected:!!ge("backpack"),mobileRedirect:!1,installUrl:ii("backpack"),icon:Ya("backpack")},{id:"solana",label:"Detected Wallet",detected:!!ge("solana"),mobileRedirect:!1,installUrl:"",icon:Ya("solana")}]}function ge(e){return e==="phantom"?window.phantom?.solana||(window.solana?.isPhantom?window.solana:null):e==="solflare"?window.solflare||(window.solana?.isSolflare?window.solana:null):e==="backpack"?window.backpack?.solana||null:e==="solana"&&(window.solana||window.solflare||window.phantom?.solana||window.backpack?.solana)||null}function _e(e,t){return e==="phantom"?"Phantom":e==="solflare"?"Solflare":e==="backpack"?"Backpack":t?.isPhantom?"Phantom":t?.isSolflare?"Solflare":t?.isBackpack?"Backpack":"Solana Wallet"}function ue(){return n.user?.connectedWallet||n.connectedWalletBalance||null}function Kg(e=""){const t=ue();if(!t?.publicKey)return"";const a=String(e||"")==="connected"||!e&&!n.wallets.length,r=t.provider||"Browser Wallet";return`<option value="connected" ${a?"selected":""}>${i(r)} - ${i(w(t.publicKey))}</option>`}function w(e){const t=String(e||"");return t.length>10?`${t.slice(0,4)}...${t.slice(-4)}`:t||"token"}const _i="/assets/slimewire/swap/states/",lt="/assets/slimewire/swap/sfx/",Hd="/assets/slimewire/volume/states/",ds="/assets/slimewire/volume/sfx/",Vg="/assets/slimewire/ui/tick.mp3",zg="/assets/slimewire/ui/flip.mp3",jg={swap:new Set(["idle","appraise","buy","sell","banking","win","loss"]),volume:new Set(["idle","running","sweep","stop"]),sniper:new Set(["idle","fire","lock"]),ogreAi:new Set(["idle","speak","think"]),bundle:new Set(["idle","volley","sell"]),launchCoin:new Set(["idle","launch","forge"]),positions:new Set(["idle","win","survey"]),pnl:new Set(["idle","win","survey"])},Gg={swap:{appraise:[lt+"appraise.mp3",.7],buy:[lt+"buy.mp3",.85],sell:[lt+"sell.mp3",.85],win:[lt+"win.mp3",.85],loss:[lt+"loss.mp3",.6],banking:[lt+"bank.mp3",.8]},volume:{running:[ds+"start.mp3",.7],sweep:[ds+"sweep.mp3",.8],stop:[ds+"stop.mp3",.8]},sniper:{fire:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],lock:["/assets/slimewire/sniper/sfx/lock.mp3",.7]},ogreAi:{think:["/assets/slimewire/ogreai/sfx/think.mp3",.6],speak:[lt+"appraise.mp3",.6]},bundle:{volley:["/assets/slimewire/auto/sfx/shockwave.mp3",.8],sell:["/assets/slimewire/bundle/sfx/sell.mp3",.8]},launchCoin:{forge:["/assets/slimewire/launch/sfx/forge.mp3",.85],launch:[lt+"win.mp3",.8]},positions:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{survey:["/assets/slimewire/positions/sfx/survey.mp3",.7],win:["/assets/slimewire/auto/sfx/victory.mp3",.85]}},Xg={sniper:[["[data-sniper-arm]","lock"],["__text:snipe|ape|fire","fire"]],ogreAi:[["[data-ogre-ai-start]","think"]],bundle:[["[data-bundle-buy]","volley"],["[data-bundle-sell]","sell"]],launchCoin:[["[data-launch-coin-submit]","forge"],["__text:launch","forge"]],positions:[["[data-refresh-all],[data-refresh],[data-refresh-positions]","survey"]],pnl:[["[data-refresh-all],[data-refresh]","survey"]]},Kd={},fa={launchCoin:{base:"/assets/slimewire/launch/states/",poster:"/assets/slimewire/launch/hero.png",tier:"OGRE FORGE",cap:["Pump Launcher","Forge it · birth it · send it."],accent:"launch",idle:"idle",event:"launch",sfx:[lt+"win.mp3",.8]},sniper:{base:"/assets/slimewire/sniper/states/",poster:"/assets/slimewire/sniper/hero.png",tier:"OGRESNIPER",cap:["OgreSniper","Lock on · strike first."],accent:"sniper",idle:"idle",event:"fire",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},ogreAi:{base:"/assets/slimewire/ogreai/states/",poster:"/assets/slimewire/ogreai/hero.png",tier:"OGRE A.I.",cap:["Ogre A.I.","Ask the swamp oracle."],accent:"ogreai",idle:"idle",event:"speak",sfx:[lt+"appraise.mp3",.6]},bundle:{base:"/assets/slimewire/bundle/states/",poster:"/assets/slimewire/bundle/hero.png",tier:"OGRE BUNDLE",cap:["Bundle","Many wallets · one volley."],accent:"bundle",idle:"idle",event:"volley",sfx:["/assets/slimewire/auto/sfx/shockwave.mp3",.8]},positions:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"POSITIONS",cap:["Open Positions","Your swamp, live."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]},pnl:{base:"/assets/slimewire/positions/states/",poster:"/assets/slimewire/positions/hero.png",tier:"PROFIT & LOSS",cap:["PnL","Count the winnings."],accent:"positions",idle:"idle",event:"win",sfx:["/assets/slimewire/auto/sfx/victory.mp3",.85]}};function Vd(){const e=R.kind;return e==="swap"?_i:e==="volume"?Hd:fa[e]?fa[e].base:_i}const d0={launchCoin:"[data-launch-coin-submit]",ogreAi:"[data-ogre-ai-start]",bundle:"[data-bundle-buy]"};let zd=!1;function Jg(){zd||(zd=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("[data-ogre-card]");if(t){e.preventDefault(),e.stopPropagation(),Qg(t.getAttribute("data-ogre-card"));return}const a=R.kind;if(!a)return;const r=document.querySelector(`[data-ogre-stage="${a}"]`);if(!r)return;const s=e.target.closest("button, a[role='button'], [data-swap-reverse], select, input[type='range'], label.oss-pill, [role='button']");if(!s||s.closest("[data-ogre-snd],[data-ogre-card]"))return;const o=r.closest("[data-rendered-tab]")||r.parentElement||document;if(o.contains&&!o.contains(s))return;const c=()=>ps(Vg,.5);if(fa[a]){const l=Xg[a]||[],d=(s.textContent||"").toLowerCase();for(const[u,p]of l)if(u.startsWith("__text:")){if(new RegExp(u.slice(7)).test(d)){ie(r,p,!0);return}}else if(s.closest(u)){ie(r,p,!0);return}c();return}if(a==="swap"){s.closest("[data-swap-use-custom-amount]")?ie(r,n.swapDirection==="sell"?"sell":"buy",!0):s.closest("[data-swap-reverse]")?(ie(r,"appraise",!0),ps(zg,.6)):s.closest("[data-swap-to],[data-swap-from],[data-trade-token]")?ie(r,"appraise",!0):c();return}if(a==="volume"){s.closest("[data-vbot-start]")?ie(r,"running",!0):s.closest("[data-vbot-stop]")?ie(r,"stop",!0):s.closest("[data-vbot-set-mode],[data-vbot-set-aggr],[data-vbot-set-stagger],[data-vbot-source]")?ie(r,"sweep",!0):c();return}}catch{}},!0))}function Yg(e,t){try{const a=document.createElement("a");a.href=t,a.download=e,document.body.appendChild(a),a.click(),a.remove()}catch{}}async function Qg(e){const t=r=>{const s=Number(r);return Number.isFinite(s)?s.toFixed(4):"0"};let a=null;if(e==="swap"){const r=n.tradeResult||{};a={theme:"swap",receipt:!0,loss:!1,headline:"SWAPPED",mint:r.tokenMint||n.tradeToken||"",symbol:String(r.symbol||r.shortMint||"TOKEN"),name:"OgreSwap",lines:[r.type==="sell"?`Received ${t(r.netSol)} SOL`:r.type==="buy"?`Aped ${t(r.spentSol)} SOL`:"Swapped on SlimeWire","OgreSwap · on-chain","slimewire.org"]}}else if(e==="volume"){const r=Array.isArray(n.volumeBots)?n.volumeBots:[],s=r.find(d=>d&&d.status!=="completed")||r[r.length-1]||{},o=s.stats||{},c=Number(s.buyAmountSol||0),l=(Number(o.buys||0)+Number(o.sells||0))*c;a={theme:"volume",receipt:!0,loss:!1,headline:"VOLUME RUN",mint:s.tokenMint||"",symbol:String(s.shortMint||"SLIMEBOT"),name:"SlimeBot",lines:[`${l.toFixed(2)} SOL volume`,`${Number(s.walletCount||0)} wallets · ${Number(s.currentCycle||s.cycles||0)} rounds`,"SlimeBot · slimewire.org"]}}else return;try{const r=await k("/api/web/card",{method:"POST",body:JSON.stringify(a)});r&&r.ok&&r.png&&Yg(`slimewire-${e}-card.png`,r.png)}catch{}}let jd=!1;function Zg(){jd||(jd=!0,document.addEventListener("click",e=>{try{const t=e.target.closest("button");if(!t||!(t.matches("[data-top-refresh-wallet],[data-refresh-all],[data-refresh-live-pairs],[data-refresh-scanner],[data-refresh],[data-refresh-watchlist],[data-refresh-kol]")||/(^|\s)(refresh|reload)(\b|$)/i.test((t.textContent||"").trim())))return;t.classList.remove("ogre-refreshing"),t.offsetWidth,t.classList.add("ogre-refreshing"),setTimeout(()=>t.classList.remove("ogre-refreshing"),900)}catch{}},!0))}function us(e,t){return`<video class="${e}" autoplay muted loop playsinline preload="auto" src="/assets/slimewire/ui/${t}.mp4"></video>`}function eb(e){try{const t=e.querySelector(".trade-head h3")||e.querySelector(".pump-live-head h3")||e.querySelector(".pump-live-head")||e.querySelector(".trade-head");t&&!t.querySelector(".ogre-spy")&&t.insertAdjacentHTML("afterbegin",`<span class="ogre-spy" title="Intel watch">${us("spy-vid","eye")}<i></i></span>`)}catch{}}let Ni=0;function tb(e,t){try{if(t==="terminal"||t==="live"){if(!e.querySelector(".ogre-radar-bar")){const a=e.querySelector(".cooks-category-label")?.parentElement||e.querySelector(".terminal-main")||e.querySelector(".terminal-layout")||e,r=e.querySelectorAll(".signal-row, [data-token-mint]").length,s=document.createElement("div");if(s.className="ogre-radar-wrap",s.innerHTML='<span class="ogre-radar-bar">'+us("rbar-bg","conduit")+`<span class="orb-scope">${us("orb-vid","scope")}<span class="ring"></span><span class="ring r2"></span><span class="sweep"></span><span class="blip b1"></span><span class="blip b2"></span><span class="blip b3"></span></span><span class="orb-read"><span class="t">SWAMP RADAR</span><span class="s"><b>${r}</b> live pairs · scanning the swamp</span></span><span class="ogre-spy radar-eye" title="Intel watch">${us("spy-vid","eye")}<i></i></span><span class="orb-heat">LIVE</span></span>`,a.insertBefore(s,a.firstChild),r>Ni&&Ni>0){const o=s.querySelector(".ogre-radar-bar");o.classList.add("hit"),setTimeout(()=>o.classList.remove("hit"),800)}Ni=r}return}if(eb(e),t==="smartChart"){const a=e.querySelector(".trade-head");a&&!a.querySelector(".ogre-chartwatch")&&a.insertAdjacentHTML("beforeend",'<span class="ogre-chartwatch"><span class="ce"></span>WATCHING</span>')}}catch{}}let ha=!0;try{ha=localStorage.getItem("ogreStageSound")!=="off"}catch{}const Gd={};function ps(e,t){if(ha)try{let a=Gd[e];a||(a=new Audio(e),a.preload="auto",Gd[e]=a),a.volume=t??.7,a.currentTime=0,a.play().catch(()=>{})}catch{}}const R={kind:null,clip:"",eventUntil:0,prev:{},feed:[],feedIdx:0,tkTimer:0};function ab(e){return e=String(e||""),e.length>9?`${e.slice(0,4)}…${e.slice(-4)}`:e||"coin"}function Di(e){return e&&e.symbol?`$${e.symbol}`:e&&e.shortMint?`$${e.shortMint}`:"the coin"}function Xd(e){return`<video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${e==="swap"?"/assets/slimewire/swap/hero.png":"/assets/slimewire/volume/hero.png"}" src="${e==="swap"?_i:Hd}idle.mp4"></video>`}function nb(){return`
    <div class="ogre-stage swap" data-ogre-stage="swap">
      ${Xd("swap")}
      <span class="os-tier">OGRESWAP</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <button class="os-card" data-ogre-card="swap" type="button" title="Download a share card">🏆</button>
      <span class="os-led"></span>
      <div class="os-shield" data-os-shield><span class="ic">🛡️</span><span data-os-shield-text>SHIELD</span></div>
      <div class="os-read" data-os-read><div class="l">SlimeShield score</div><div class="v" data-os-read-v>—</div></div>
      <div class="os-gauge"><div class="fill" data-os-gauge></div></div>
      <div class="os-orb" data-os-orb><span class="s" data-os-orb-s></span><span class="p" data-os-orb-p></span></div>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>OgreSwap ready — paste a coin to appraise</span></div>
    </div>`}function rb(){return`
    <div class="ogre-stage volume" data-ogre-stage="volume">
      ${Xd("volume")}
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
    </div>`}function Jd(e){return e==="volume"&&(n.volumeBots||[]).some(t=>t&&t.status!=="completed")?"running":"idle"}function Yd(e){const t=Gg[R.kind];t&&t[e]&&ps(t[e][0],t[e][1])}function ie(e,t,a){const r=e.querySelector("[data-ogre-bg]");if(!r||R.clip===t)return;const s=jg[R.kind];if(s&&!s.has(t)&&(a&&Yd(t),t=R.kind==="swap"?"appraise":R.kind==="volume"?"sweep":"idle",!s.has(t)))return;R.clip=t;const o=Vd();try{r.loop=!a,r.muted=!0,r.src=o+t+".mp4",r.load();const c=r.play();c&&c.catch&&c.catch(()=>{})}catch{}a&&(R.eventUntil=Date.now()+(t==="running"?8500:4600),Yd(t))}function on(e,t){R.feed.unshift({text:e,color:t||""}),R.feed.length>16&&R.feed.pop(),R.feedIdx=0}function sb(){const e=document.querySelector("[data-ogre-stage]");if(!e){R.tkTimer&&(clearInterval(R.tkTimer),R.tkTimer=0);return}const t=e.querySelector("[data-os-tk]");if(!t)return;if(!R.feed.length){const s=fa[R.kind];if(s)t.innerHTML='<span class="os-dot"></span>'+s.cap[1];else if(R.kind==="volume"){const o=(n.volumeBots||[]).some(c=>c&&c.status!=="completed");t.innerHTML='<span class="os-dot"></span>'+(o?"Swarm running — generating lifelike volume":"SlimeBot idle — set a token and start")}else t.innerHTML='<span class="os-dot"></span>'+(n.tradeToken?"Coin loaded — set your size and SWAP":"OgreSwap ready — paste a coin to appraise");return}const a=R.feed[R.feedIdx++%R.feed.length],r=a.color?`<span class="os-dot" style="background:${a.color};box-shadow:0 0 8px ${a.color}"></span>`:'<span class="os-dot"></span>';t.innerHTML=r+i(a.text),t.style.animation="none",t.offsetWidth,t.style.animation="os-tkin .5s ease"}function ob(e){const t=e.querySelector("[data-ogre-stage]");if(!t){R.kind=null;return}const a=t.getAttribute("data-ogre-stage");R.kind!==a&&(R.kind=a,R.clip="",R.eventUntil=0,R.prev={},R.feed=[],R.feedIdx=0);const r=t.querySelector("[data-ogre-snd]");r&&(r.textContent=ha?"🔊":"🔇",r.onclick=o=>{o.stopPropagation(),ha=!ha;try{localStorage.setItem("ogreStageSound",ha?"on":"off")}catch{}r.textContent=ha?"🔊":"🔇"});const s=t.querySelector("[data-ogre-bg]");s&&!s.__ogreBound&&(s.__ogreBound=!0,s.addEventListener("ended",()=>{s.loop||(R.eventUntil=0,R.clip="",ie(t,Jd(R.kind),!1))}),s.addEventListener("error",()=>{R.eventUntil=0,R.clip="";const o=Jd(R.kind);(o!=="idle"||s.getAttribute("src")!==Vd()+o+".mp4")&&ie(t,o,!1)}));try{window.__ogreIO&&window.__ogreIO.disconnect(),s&&"IntersectionObserver"in window&&(window.__ogreIO=new IntersectionObserver(o=>{for(const c of o)if(c.isIntersecting&&!document.hidden)try{const l=s.play();l&&l.catch&&l.catch(()=>{})}catch{}else try{s.pause()}catch{}},{threshold:.06}),window.__ogreIO.observe(t)),window.__ogreVisBound||(window.__ogreVisBound=!0,document.addEventListener("visibilitychange",()=>{const o=document.querySelector("[data-ogre-bg]");if(o)if(document.hidden)try{o.pause()}catch{}else try{const c=o.play();c&&c.catch&&c.catch(()=>{})}catch{}}))}catch{}if(R.tkTimer||(R.tkTimer=setInterval(sb,3400)),Jg(),a==="swap")try{const o=e.querySelector(".oss-stage-wrap");o&&!t.contains(o)&&(o.classList.add("os-hud"),t.appendChild(o));const c=e.querySelector(".slime-swap-card");if(c&&o){let l=c.querySelector("[data-oss-settings]");l||(l=document.createElement("div"),l.setAttribute("data-oss-settings",""),l.className="oss-settings-tray",c.insertBefore(l,c.firstChild));const d=o.querySelector(".oss-slip"),u=o.querySelector(".oss-wallet-bar");d&&d.parentElement!==l&&l.appendChild(d),u&&u.parentElement!==l&&l.appendChild(u)}}catch{}if(Kd[a])try{const o=e.querySelector(Kd[a]),c=o&&(o.closest(".quick-grid")||o.closest(".card-actions")||o.parentElement);c&&!t.contains(c)&&(c.classList.add("os-hud","os-cta"),t.appendChild(c))}catch{}a==="swap"?cb(t):a==="volume"?db(t):lb(t,a)}function ib(e){const t=fa[e];return t?`
    <div class="ogre-stage hero ${t.accent}" data-ogre-stage="${e}" data-hero="1">
      <video class="ogre-bg" data-ogre-bg autoplay muted loop playsinline preload="auto" poster="${t.poster}" src="${t.base}${t.idle}.mp4"></video>
      <span class="os-tier">${i(t.tier)}</span>
      <button class="os-snd" data-ogre-snd type="button" title="Sound on/off">🔊</button>
      <span class="os-led"></span>
      <div class="os-ticker"><span class="os-tk" data-os-tk><span class="os-dot"></span>${i(t.cap[1])}</span></div>
    </div>`:""}function lb(e,t){Date.now()>=R.eventUntil&&ie(e,"idle",!1)}function u0(e){const t=document.querySelector(`[data-ogre-stage="${e}"]`),a=fa[e];t&&a&&R.kind===e&&ie(t,a.event,!0)}function cb(e){const t=String(n.tradeToken||"").trim(),a=t?(n.slimeShieldResults||{})[t]:null,r=e.querySelector("[data-os-shield]"),s=e.querySelector("[data-os-shield-text]"),o=e.querySelector("[data-os-gauge]"),c=e.querySelector("[data-os-read]"),l=e.querySelector("[data-os-read-v]");if(a){const p=String(a.verdict||"").toLowerCase(),f=p.includes("avoid")||p.includes("danger")||p.includes("rug")?"avoid":p.includes("safe")||p.includes("clean")||p.includes("ok")?"safe":"risk";r&&(r.className="os-shield show "+f),s&&(s.textContent=String(a.verdict||"checked").toUpperCase());const y=Number(a.score);!isNaN(y)&&o&&(o.style.height=Math.max(6,Math.min(100,y))+"%"),!isNaN(y)&&c&&l&&(c.classList.add("show"),l.textContent=Math.round(y),l.className="v "+(f==="avoid"?"down":f==="safe"?"up":"")),e.classList.toggle("loss",f==="avoid")}else r&&(r.className="os-shield"),c&&c.classList.remove("show"),o&&(o.style.height="6%"),e.classList.remove("loss");if(t&&t!==R.prev.swapToken&&(R.prev.swapToken=t,on("Appraising $"+ab(t),"#36e0c8"),ie(e,"appraise",!0),!a&&typeof eo=="function"))try{eo(t).catch(()=>{})}catch{}const d=n.tradeResult,u=d?`${d.signature||d.message||""}|${d.type||""}`:"";if(d&&u!==R.prev.swapRes){if(R.prev.swapRes=u,d.type==="buy"){ie(e,"buy",!0);const p=e.querySelector("[data-os-orb]");if(p){p.classList.add("show","up"),p.classList.remove("down");const f=p.querySelector("[data-os-orb-s]"),y=p.querySelector("[data-os-orb-p]");f&&(f.textContent=Di(d).replace("$","").slice(0,7)),y&&(y.textContent="HELD")}on("Bought "+Di(d),"#9dff6a")}else if(d.type==="sell"){ie(e,"banking",!0);const p=e.querySelector("[data-os-orb]");p&&p.classList.remove("show"),on("Sold "+Di(d)+" — banked","#ffd45a")}}Date.now()>=R.eventUntil&&ie(e,"idle",!1)}function Qd(e,t,a,r){const s=e.querySelector("[data-ov-swarm]");if(!s)return;if(t=Math.max(0,Math.min(12,Math.round(t))),s.children.length!==t){s.innerHTML="";for(let u=0;u<t;u++){const p=document.createElement("div");p.className="ov-orb";const f=u/t*Math.PI*2-Math.PI/2;p.style.left=50+Math.cos(f)*34+"%",p.style.top=46+Math.sin(f)*30+"%",s.appendChild(p)}}const o=s.children;if(!o.length)return;const c=Number(R.prev.volBuys||0),l=Number(R.prev.volSells||0),d=(u,p)=>{for(let f=0;f<p&&f<3;f++){const y=o[Math.floor(Math.random()*o.length)];y.classList.remove("buy","sell"),y.offsetWidth,y.classList.add(u),setTimeout(()=>y.classList.remove(u),430)}};a>c&&d("buy",a-c),r>l&&d("sell",r-l),(a>c||r>l)&&ps(ds+"pulse.mp3",.32),R.prev.volBuys=a,R.prev.volSells=r}function db(e){const a=(n.volumeBots||[]).find(d=>d&&d.status!=="completed")||null,r=!!a,s=R.prev.volActive;e.classList.toggle("live",r),r&&!s&&(on("SlimeBot online — swarm spinning up","#c06bff"),ie(e,"running",!0)),!r&&s&&(on("Swept back — funds returned home","#c06bff"),ie(e,"sweep",!0)),R.prev.volActive=r,Date.now()>=R.eventUntil&&ie(e,r?"running":"idle",!1);const o=e.querySelector("[data-ov-budget]"),c=e.querySelector("[data-ov-ring]"),l=e.querySelector("[data-ov-read]");if(a){const d=a.stats||{},u=Number(d.buys||0),p=Number(d.sells||0),f=Number(d.fundedSol||0),y=Number(a.currentCycle||0),b=Number(a.cycles||a.maxRounds||0),v=Number(a.buyAmountSol||0);if(o){o.classList.add("show");const $=o.querySelector("[data-ov-budget-v]");$&&($.textContent=f.toFixed(3)+" SOL");const C=b>0?Math.min(1,y/b):0,B=o.querySelector("[data-ov-budget-bar]");B&&(B.style.width=C*100+"%")}if(c){c.classList.add("show");const $=2*Math.PI*22,C=b>0?Math.min(1,y/b):0,B=c.querySelector("[data-ov-ring-prg]");B&&(B.style.strokeDasharray=$,B.style.strokeDashoffset=$*(1-C));const U=c.querySelector("[data-ov-ring-lbl]");U&&(U.textContent=y+"/"+(b||"?"))}if(l){l.classList.add("show");const $=(u+p)*v,C=(B,U)=>{const H=l.querySelector(B);H&&(H.textContent=U)};C("[data-ov-vol]",$>0?$.toFixed(2)+" SOL":"—"),C("[data-ov-buys]",String(u)),C("[data-ov-sells]",String(p)),C("[data-ov-wallets]",String(Number(a.walletCount||0)))}Qd(e,Number(a.walletCount||6),u,p);const A=(a.log||[])[0],g=A?(A.at||"")+(A.message||""):"";A&&g!==R.prev.volLog&&(R.prev.volLog=g,on(String(A.message||"").slice(0,80),""))}else o&&o.classList.remove("show"),c&&c.classList.remove("show"),l&&l.classList.remove("show"),Qd(e,0,0,0)}function ub(){const e=ue(),t=n.wallets.length>0;if(!t&&!e?.publicKey)return`
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
    `;const a=bi(),r=ad(),s=ed(a)||{symbol:a==="SOL"?"SOL":w(a),name:a==="SOL"?"Solana":""},o=ed(r)||{symbol:r?w(r):"Custom",name:r?"Selected token":"Paste CA below"},c=Th(),l=n.swapDirection==="sell",d=c==="two-step"?"Token-to-token uses a sell-to-SOL then buy route until direct routing is enabled.":l?"Sell: swap the pair back to SOL. Set the percent, then hit SWAP.":"Buy: swap SOL into the pair. Set the SOL amount, then hit SWAP.",u=l?a:r,p=u&&u!=="SOL"?u:n.tradeToken,f=`
              <input class="oss-amount" data-swap-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="${l?"100":"0.0"}" aria-label="${l?"Percent of token to sell":"SOL amount to pay"}">
              <select class="oss-tok" data-swap-from aria-label="Swap from token">
                ${td(a,{includeCustom:!1,walletOnly:!0})}
              </select>`,y=`
              <input class="oss-amount oss-ca" data-trade-token type="text" placeholder="Paste token CA" value="${i(p||"")}" aria-label="Token">
              <select class="oss-tok" data-swap-to aria-label="Swap to token">
                ${td(r,{includeCustom:!0})}
              </select>`,b=`
            <div class="oss-slot oss-pay" data-swap-slot="${l?"token":"base"}">${l?y:f}</div>
            <button type="button" class="oss-reverse slime-swap-reverse" data-swap-reverse aria-label="Reverse swap route"><span class="slime-swap-route-icon" aria-hidden="true"></span></button>
            <div class="oss-slot oss-receive" data-swap-slot="${l?"base":"token"}">${l?f:y}</div>`;return`
    ${nb()}
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
        <p class="slime-swap-route-note oss-route">${i(d)}</p>

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
          ${n.tradeToken?`<div class="card-actions">${Ye(Ii(n.tradeToken),"Share Watch")}</div>`:""}
        </article>
        ${$b()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${pb()}
        ${mb()}
      </aside>
    </section>
  `}function Ui(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!e?.volumeBot)}function Zd(){return(Array.isArray(n.wallets)?n.wallets:[]).filter(e=>!!e?.volumeBot)}function ln(e=""){const t=Kg(e),a=Ui().map(r=>{const s=n.balances.find(l=>Number(l.index)===Number(r.index)),o=s?.sol!==null&&s?.sol!==void 0?`${Number(s.sol).toFixed(4)} SOL`:"balance loading",c=r.sessionWallet?" Session":"";return`<option value="${r.index}" ${String(r.index)===String(e||"")?"selected":""}>${r.index}. ${i(r.label)}${c} - ${o}</option>`}).join("");return t||a?`${t}${a}`:'<option value="">No wallet connected</option>'}function pb(){if(!n.tradeResult)return`
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
        ${Ye(Cg(e))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function mb(){if(!n.tradePlanResult)return`
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
        <div><dt>Timer Exit</dt><dd>${i(Ab(e))}</dd></div>
      </dl>
      ${e.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}
      <div class="card-actions">
        <button data-copy="${i(e.tokenMint)}">Copy CA</button>
        ${Ye(Lg(e,"Armed managed trade"))}
        <a href="${i(e.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function eu(e={}){const t=String(e.poolLabel||e.dexId||"").trim();if(!t)return"";const a=t.toLowerCase(),r=a.includes("bonk")?"Bonk":a.includes("meteora")?"Meteora":a.includes("orca")?"Orca":a.includes("raydium")?"Raydium":a.includes("pump")?"Pump":t.slice(0,16);return`<span class="ogre-ai-pool-badge" title="${i(t)}">${i(r)}</span>`}function fb(){if(!n.ogreAiResult)return`
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
              ${eu(o)}
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
            ${eu(s)}
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
  `}const nr=[["strong","Strong 🔥","Highest win-rate mode. Waits for survivors (1.5–12 min old) with proven net-buying, real holders and healthy liquidity, then targets a 2x — entering before the breakout, not after. Built to win more than it loses."],["super_fresh","Super-fresh","Brand-new sub-$8K launches (under ~2 min) with starting flow — fastest, highest risk. Blocks mint/freeze/honeypot/drained-liquidity before buys."],["volume","Volume","Active runners with real momentum ($8K–$350K MC), heavy early volume and live trades."],["safe","Safe","Established small caps ($50K–$1.2M MC) with deeper liquidity and a higher score bar; tighter slippage."],["long_term","Long-term","Larger, deeper pairs ($150K–$5M MC) for a longer horizon; strictest score + liquidity, lowest slippage."]];function ms(){const e=a=>nr.some(([r])=>r===a);if(n.ogreAiCategory&&e(n.ogreAiCategory))return n.ogreAiCategory;const t=ac().category;return e(t)?t:"strong"}function tu(e){const t=nr.find(([a])=>a===e);return t?t[2]:nr[0][2]}function hb(e){return`<div class="ogre-cat-segment" role="group">${nr.map(([t,a])=>`<button type="button" data-ogre-cat="${i(t)}" data-active="${e===t}">${i(a)}</button>`).join("")}</div>`}function gb(){const e=n.ogreAutopilot||{},t=!!e.enabled,a=au(e.category||ms()),r=(c,l)=>c==null||c===""?l:c,s=e.lastStatus||(t?"Autopilot armed. Waiting for the next qualified pick.":"Off. Autopilot auto-apes the best pick in your category using the presets above, inside hard spend guards."),o=t?`Spent this hour: ${Number(e.spentLastHourSol||0).toFixed(4)} / ${r(e.maxSpendPerHourSol,"0.3")} SOL`:"";return`
    <article class="ogre-autopilot ${t?"is-on":""}" data-preserve-focus>
      <div class="ogre-autopilot-head">
        <div>
          <h3>Autopilot</h3>
          <p>Auto-ape the best <strong>${i(a)}</strong> pick on a timer, using the TP/SL/timer/slippage and wallets above — within hard guards.</p>
          <p style="margin-top:6px"><a href="/autopilot-pro" style="color:#8dff5a;font-weight:800;text-decoration:none">⚡ Open SlimeWire Auto (Pro) →</a></p>
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
  `}function au(e){const t=nr.find(([a])=>a===e);return t?t[1]:"Super-fresh"}function bb(){if(!n.wallets.length)return`${is()}${F("No managed wallets loaded","Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;const e=ac(),t=e.amountSol||"0.1",a=e.runCount||"1",r=(o,c,l)=>{const d=String(o||l||"");return d==="custom"?String(c||"custom"):d},s=ms();return`
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
          ${hb(s)}
          <small class="ogre-cat-hint">${i(tu(s))}</small>
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
          ${qt({selectAttr:"data-ogre-ai-tp",customAttr:"data-ogre-ai-tp-custom",customFor:"ogre-ai-tp",selected:r(e.takeProfitSelect,e.takeProfitCustom,"25"),customType:"number",customPlaceholder:"Custom TP %",options:[["15","+15%"],["25","+25%"],["40","+40%"],["60","+60%"],["100","+100%"],["custom","Custom"]]})}
          ${qt({selectAttr:"data-ogre-ai-sl",customAttr:"data-ogre-ai-sl-custom",customFor:"ogre-ai-sl",selected:r(e.stopLossSelect,e.stopLossCustom,"8"),customType:"number",customPlaceholder:"Custom SL %",options:[["8","-8%"],["10","-10%"],["15","-15%"],["off","No stop loss"],["custom","Custom"]]})}
          ${Ze("ogre-ai-delay","data-ogre-ai-delay",r(e.delaySelect,e.delayCustom,"5"))}
          ${qt({selectAttr:"data-ogre-ai-slippage",customAttr:"data-ogre-ai-slippage-custom",customFor:"ogre-ai-slippage",selected:r(e.slippageSelect,e.slippageCustom,"400"),customType:"number",customPlaceholder:"Custom bps",options:[["300","3%"],["400","4%"],["500","5%"],["custom","Custom"]]})}
        </div>

        <div class="wallet-grid">
          ${kt("ogre-ai")}
        </div>
        ${Ut("ogre-ai",e.walletGroup||"")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${n.ogreAiLoading?"disabled":""}>${n.ogreAiLoading?"Scanning...":"Scan &amp; Ape"}</button>
          <button type="button" data-tab="live">Review Cooks</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${i(n.ogreAiStatus||tu(s))}</small>
      </article>

      <aside class="trade-side">
        ${Mi({compact:!0})}
        ${gb()}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls live feeds for the chosen category, ranks the best setup, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${fb()}
      </aside>
    </section>
  `}function nu(e,t){return`
    <section class="account-check-card wallet-gate">
      <div>
        <h3>Make a web wallet to use ${i(e)}</h3>
        <p>${i(t)}</p>
      </div>
      <button class="primary" type="button" data-connect-create-wallet>Create a Wallet</button>
      <button type="button" data-tab="wallets">Open Wallets</button>
    </section>`}function yb(){return n.wallets.length?`
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${n.bundleToken?Q(n.bundleToken):"#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        ${cn({toolKey:"bundle",activeKey:dn("bundle","bundle"),sections:[{key:"bundle",label:"Bundle",hint:"Buy / sell",html:`
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${i(n.bundleToken||n.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${kt("bundle")}
        </div>
        ${Ut("bundle")}
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
              ${fs("bundle-plan-loop-delay","data-bundle-plan-loop-delay","0")}
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
          ${gs("bundle-plan")}
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
        ${Tb()}
        ${vb()}
      </aside>
    </section>
  `:nu("Bundle","Bundle fires many managed wallets in one shot, so it needs at least one SlimeWire wallet. Tap to create one — your backup downloads instantly.")}function vb(){if(!n.bundleResult)return`
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
  `}function kt(e,t=null){const a=e==="trade-plan"?1:6,r=Array.isArray(t)?new Set(t.map(String)):null;return Ui().map((s,o)=>`
    <label class="wallet-check">
      <input type="checkbox" data-${e}-wallet value="${s.index}" ${r?r.has(String(s.index))?"checked":"":o<a?"checked":""}>
      <span>${s.index}. ${i(s.label)}</span>
      <code>${i(s.shortPublicKey||s.publicKey)}</code>
    </label>
  `).join("")}function Ut(e,t=""){return`
    <label>
      Optional Group Label
      <input data-${e}-group type="text" placeholder="Example: Ogre" value="${i(t)}">
    </label>
  `}function wb(e=""){return n.wallets.length?n.wallets.map((t,a)=>{const r=String(t.index??a+1),s=`${r}. ${t.label||"Wallet"} ${t.shortPublicKey||w(t.publicKey||"")}`;return`<option value="${i(r)}" ${String(e)===r?"selected":""}>${i(s)}</option>`}).join(""):'<option value="">No managed wallets loaded</option>'}function x(e,t,a=""){const r=m(e)?.value||a;if(r!=="custom")return r;const s=m(t)?.value?.trim();if(!s)throw new Error("Enter the custom value first.");return s}function ct(e,t=""){const a=n.presets?.[e]||[],r=!t||t==="none"||t==="manual",s=e==="bundle"?"Create / edit bundle preset":"Create / edit trade preset";return a.length?`
    <option value="" ${r?"selected":""}>No preset / manual</option>
    ${a.map(o=>`<option value="${i(o.id)}" ${o.id===t?"selected":""}>${i(o.name)}</option>`).join("")}
    <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
  `:`
      <option value="" ${r?"selected":""}>No preset / manual</option>
      <option value="custom" ${t==="custom"?"selected":""}>${s}</option>
    `}function ru(){return`<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${i(ze()||"0.10")}" value="${i(n.quickBuyAmountOverride)}">`}function su(e="scanner"){return`
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${ru()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${i(e)}">
          ${ct("trade",n.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `}const Sb=[["off","No timer"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["3","3 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]],kb=[["0","No wait"],["5s","5 sec"],["10s","10 sec"],["15s","15 sec"],["30s","30 sec"],["1","1 min"],["5","5 min"],["15","15 min"],["30","30 min"],["60","1 hour"],["120","2 hours"],["custom","Custom time"]];function qt({selectAttr:e,customAttr:t,customFor:a,options:r,selected:s="",customType:o="text",customPlaceholder:c="Custom time"}){const l=String(s||""),u=new Set(r.map(([f])=>f)).has(l)?l:"custom",p=u==="custom"&&l!=="custom"?l:"";return`
    <select ${e} data-custom-select="${i(a)}">
      ${r.map(([f,y])=>`<option value="${i(f)}" ${f===u?"selected":""}>${i(y)}</option>`).join("")}
    </select>
    <input ${t} data-custom-for="${i(a)}" type="${i(o)}" value="${i(p)}" placeholder="${i(c)}" ${u==="custom"?"":"hidden"}>
  `}function Ze(e,t,a="off"){return qt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:Sb,selected:a,customPlaceholder:"Custom: 45s, 20, 2h"})}function fs(e,t,a="0"){return qt({selectAttr:`${t}`,customAttr:`${t}-custom`,customFor:e,options:kb,selected:a,customPlaceholder:"Custom: 30s, 20, 2h"})}function qi(e="scanner"){return`
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${ru()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${i(e)}">
          ${ct("trade",n.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${i(e)}">
          ${ct("bundle",n.selectedBundlePresetId)}
        </select>
      </label>
    </section>
  `}function p0(){const e=n.fastTradePresetStatus||(n.wallets.length?"Save this once, then tap Trade on any row.":"Load or connect a wallet before live trading.");return`
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
        <small data-fast-trade-preset-status>${i(e)}</small>
      </div>
    </article>
  `}function m0(){const e=n.fastBundlePresetStatus||(n.wallets.length?"Save this once, then tap Bundle on any row.":"Load wallets before live bundle trading.");return`
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${kt("fast-bundle-preset")}</div>
        ${Ut("fast-bundle-preset")}
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
        <small data-fast-bundle-preset-status>${i(e)}</small>
      </div>
    </article>
  `}function ou(e){const t=e==="trade"?n.editingTradePresetId:n.editingBundlePresetId;return t?le(e,t):null}function hs(e,t){e==="trade"&&(n.editingTradePresetId=t||""),e==="bundle"&&(n.editingBundlePresetId=t||"")}function $b(){const e=ou("trade"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Trade Preset":"Save Trade Preset";return`
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${i(e?.name||"")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${ln(e?.walletIndex||"")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${i(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${i(e?.takeProfitPct||"25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${i(e?.stopLossPct||"8")}"></label>
        <label>Fallback Timer ${Ze("trade-preset-delay","data-trade-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${i(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${i(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>':""}
      </div>
      ${iu("trade")}
      <small data-trade-preset-status></small>
    </article>
  `}function Tb(){const e=ou("bundle"),t=!!e?.readonly,a=e?t?"Save Edited Copy":"Update Bundle Preset":"Save Bundle Preset";return`
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${e?`Editing ${i(e.name)}.${t?" Default presets save as a new custom copy.":""}`:"Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${e&&!e.readonly?i(e.id):""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${i(e?.name||"")}"></label>
      <div class="wallet-checks preset-wallets">${kt("bundle-preset",e?.walletIndexes||null)}</div>
      ${Ut("bundle-preset",e?.walletGroup||"")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${i(e?.amountSol||"0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${i(e?.takeProfitPct||"60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${i(e?.stopLossPct||"10")}"></label>
        <label>Fallback Timer ${Ze("bundle-preset-delay","data-bundle-preset-delay",e?.sellDelay||"off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${i(e?.sellPercent||"100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${i(e?.slippageBps||"400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${a}</button>
        ${e?'<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>':""}
      </div>
      ${iu("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `}function iu(e){const t=n.presets?.[e]||[];if(!t.length)return'<p class="muted">No presets loaded yet.</p>';const a=e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId;return`
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
  `}function Ab(e){return Number(e?.sellDelaySeconds||0)>0?`${e?.sellPercent||100}%`:"Off"}function gs(e){return`
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
  `}function ga(e){return{walletTakeProfitTargets:x(`[data-${e}-wallet-tp]`,`[data-${e}-wallet-tp-custom]`,""),walletStopLossTargets:x(`[data-${e}-wallet-sl]`,`[data-${e}-wallet-sl-custom]`,"")}}function bs(e=document){e.querySelectorAll("[data-custom-for]").forEach(t=>{const r=[...document.querySelectorAll("[data-custom-select]")].find(s=>s.dataset.customSelect===t.dataset.customFor)?.value==="custom";t.hidden=!r,r||(t.value="")})}function Pb(e){if(!e?.dataset?.customSelect?.endsWith("-sell-percent")||e.value!=="off")return;const t=e.dataset.customSelect.replace(/-sell-percent$/,"-delay"),a=document.querySelector(`[data-custom-select="${t}"]`);a&&(a.value="off"),bs()}function lu(){return n.wallets.map(e=>`<option value="${i(e.index)}">${i(e.index)}. ${i(e.label||"Wallet")}${e.sessionWallet?" (session)":""}</option>`).join("")}function Cb(){return n.wallets.length?`
    <article class="account-check-card distribute-card" data-preserve-focus>
      <div>
        <h3>Distribute to Fresh Wallets</h3>
        <p>Create new managed wallets and fund them from a source wallet in one step, then trade from them so copy-traders can't follow your main address. Backup files download automatically.</p>
      </div>
      <div class="volume-grid">
        <label>
          Source wallet (funds the new set)
          <select data-distribute-source>${lu()}</select>
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
  `:""}function ys(e){n.distributeStatus=String(e||"");const t=m("[data-distribute-status]");t&&(t.textContent=n.distributeStatus)}function Lb(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.wallets.filter(r=>r.sessionWallet),a=t.length?t:n.wallets;return a.length?`
    <article class="account-check-card return-funds-card">
      <div>
        <h3>Return Funds to My Wallet</h3>
        <p>One tap: sell every token in your ${t.length?"session":"managed"} wallet(s) to SOL and send all of it back to your connected wallet ${i(w(e.publicKey))}.</p>
      </div>
      <button class="primary" data-return-funds ${n.returnFundsBusy?"disabled":""}>${n.returnFundsBusy?"Returning...":"Sweep Tokens to SOL & Return"}</button>
      <p class="trade-status" data-return-funds-status>${i(n.returnFundsStatus||`${a.length} wallet(s) will be swept back to your connected wallet.`)}</p>
    </article>
  `:""}function rr(e){n.returnFundsStatus=String(e||"");const t=m("[data-return-funds-status]");t&&(t.textContent=n.returnFundsStatus)}async function cu(e="leaving"){try{const t=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!t?.publicKey)return;const a=n.wallets.filter(o=>o.sessionWallet);if(!a.length)return;const r=a.map(o=>String(o.index));if(!await Me({title:"Return Session Funds",lines:[`Before ${e}, return tokens + SOL from your ${r.length} session wallet(s)`,`back to your connected wallet ${w(t.publicKey)}?`],confirmLabel:"Return Funds",cancelLabel:"Skip"}))return;await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:t.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:ae})}catch(t){try{window.alert(`Could not return funds automatically: ${t.message}. Use the Return Funds button to retry.`)}catch{}}}async function xb(){if(n.returnFundsBusy)return;const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey){rr("Connect a wallet first.");return}const t=n.wallets.filter(o=>o.sessionWallet),r=(t.length?t:n.wallets).map(o=>String(o.index));if(!r.length){rr("No managed wallets to return from.");return}if(await Me({title:"Return Funds",lines:[`Sell all tokens to SOL and send everything from ${r.length} wallet(s)`,`back to your connected wallet ${w(e.publicKey)}?`],confirmLabel:"Sell & Return",danger:!0})){n.returnFundsBusy=!0,rr("Selling tokens and returning SOL..."),h();try{const o=await k("/api/web/wallets/return-to-connected",{method:"POST",body:JSON.stringify({destination:e.publicKey,walletIndexes:r}),dedupe:!1,timeoutMs:ae});n.returnFundsBusy=!1,rr(o.summary||"Funds returned to your connected wallet."),await He({force:!0,deep:!1,reason:"return-funds"}).catch(()=>{}),h()}catch(o){n.returnFundsBusy=!1,rr(o.message),h()}}}async function Mb(){if(n.distributeBusy)return;const e=m("[data-distribute-count]")?.value||"5",t=m("[data-distribute-amount]")?.value||"",a=m("[data-distribute-source]")?.value||"1",r=m("[data-distribute-label]")?.value?.trim()||"Fresh";if(!t||Number(t)<=0){ys("Enter SOL per wallet greater than zero.");return}const s=(Number(t)||0)*(Number(e)||0);if(await Me({title:"Create & Fund Wallets",lines:[`Create ${e} fresh wallet(s) and fund each with ${t} SOL?`,`That sends about ${s.toFixed(3)} SOL total from the source wallet (real SOL).`,"Backup/recovery files for the new wallets will download."],confirmLabel:"Create & Fund"})){n.distributeBusy=!0,ys("Creating and funding wallets..."),h();try{await J(m("[data-distribute-status]"),"Creating secure web profile for wallet backups...");const c=await k("/api/web/wallets/distribute",{method:"POST",body:JSON.stringify({count:e,amountSol:t,sourceWalletIndex:a,label:r}),dedupe:!1,timeoutMs:ae});c.downloads?.encryptedBackup?.text&&be(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&be(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.distributeBusy=!1,ys(c.summary||"Fresh wallets created and funded. Backups downloaded."),await He({force:!0,deep:!1,reason:"distribute-fresh-wallets"}).catch(()=>{}),h()}catch(c){n.distributeBusy=!1,ys(c.message),h()}}}function Bb(e){return e.status==="completed"?"Finished":e.stage==="sweeping"?"Sweeping back":e.stage==="running"?"Running":e.stage||"Armed"}function Rb(){const e=Zd().length;return e?`
    <article class="volume-bot-status vbot-bg-indicator">
      <div class="vbot-bg-row">
        <span><strong>${e}</strong> background wallet${e===1?"":"s"} active · funds auto-return to your source wallet when a bot stops.</span>
        <button type="button" class="secondary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":"Sweep to my wallet"}</button>
      </div>
      ${n.sweepBackgroundStatus?`<small data-sweep-background-status>${i(n.sweepBackgroundStatus)}</small>`:""}
    </article>`:""}function Ib(){const e=Array.isArray(n.volumeBots)?n.volumeBots:[],t=Rb();return e.length?t+e.map(a=>{const r=a.stats||{},s=a.status!=="completed",o=(a.log||[]).slice(0,6);return`
      <article class="volume-bot-status">
        <header class="volume-bot-status-head">
          <div>
            <strong>${i(a.shortMint||a.tokenMint||"Token")}</strong>
            <span class="volume-bot-stage" data-stage="${i(a.stage||"")}">${i(Bb(a))}</span>
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
    `}).join(""):`${t}<article class="volume-bot-status"><p class="muted">No SlimeBots running yet. Configure one above and press Start SlimeBot.</p></article>`}function Hi(e,t,a){return`<div class="vbot-segment" role="group">${a.map(([r,s])=>`<button type="button" data-vbot-set-${e}="${i(r)}" data-active="${t===r}">${i(s)}</button>`).join("")}</div>`}function Ob(){const t=(Array.isArray(n.volumeBots)?n.volumeBots:[]).filter(c=>c.status!=="completed"),a=t.filter(c=>c.rolling),r=t.filter(c=>!c.rolling),s=c=>c.reduce((l,d)=>l+Math.max(0,Number(d.cycles||0)-Number(d.currentCycle||0)),0),o=(c,l,d,u,p)=>`
    <article class="vbot-queue-card">
      <h4 class="vbot-queue-title">${i(c)}</h4>
      <p class="vbot-queue-sub">${i(l)}</p>
      <p class="vbot-queue-cap">Capacity used <strong>${d} / ${u}</strong> slots</p>
      <div class="vbot-queue-bar"><span style="width:${Math.max(2,Math.min(100,d/u*100))}%"></span></div>
      <div class="vbot-queue-foot"><span>QUEUED</span><strong>${p}</strong></div>
    </article>`;return`
    <div class="vbot-queue-grid">
      ${o("SMART","Smart Mode RPC Servers",a.length,10,s(a))}
      ${o("SPAMMER","Spammer RPC Servers",r.length,1,s(r))}
    </div>`}function Eb(){return`
    ${rb()}
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
        <div class="ovs-mode">${Hi("mode",n.slimeBotMode,[["smart","Smart"],["spam","Spam"]])}</div>
        <span class="ovs-mlabel ovs-mlabel-field" aria-hidden="true">Aggressiveness</span>
        <div class="ovs-aggr">${Hi("aggr",n.slimeBotAggr,[["low","Low"],["med","Med"],["high","High"]])}</div>
      </div>
      <div class="ovs-below">
        <label class="vbot-config-field">
          <span class="vbot-config-label">Pay From (source wallet)</span>
          <select data-vbot-source>${lu()}</select>
        </label>

        <div class="vbot-config-row">
          <div class="vbot-config-field">
            <span class="vbot-config-label">Chart shape <span style="opacity:.6;font-weight:600">· the pattern it paints</span></span>
            ${Hi("stagger",n.slimeBotStagger,[["steady","Steady"],["waves","Waves"],["organic","Organic"],["ladder","Uptrend"]])}
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
          ${Ob()}
        </div>

        <div class="volume-bot-list">
          ${Ib()}
        </div>
      </div>
    </section>
  `}function Fb(){const e=n.slimeBotMode==="spam"?"spam":"smart",t=["low","med","high"].includes(n.slimeBotAggr)?n.slimeBotAggr:"med",a=Math.max(.05,Math.min(50,Number(m("[data-vbot-invest-num]")?.value||m("[data-vbot-invest]")?.value||"1"))),r=Math.max(20,Math.min(360,Number(m("[data-vbot-duration]")?.value||"60"))),o={low:{delaySecs:30,buyBias:55,walletCount:4},med:{delaySecs:12,buyBias:60,walletCount:6},high:{delaySecs:5,buyBias:70,walletCount:10}}[t],c=e==="smart",l=o.delaySecs*(c?4:1);let d=Math.round(r*60/l);d=Math.max(1,Math.min(250,d,Math.floor(a/.01)));const u=Math.max(.005,Math.min(.5,a/d));return{tokenMint:m("[data-vbot-token]")?.value?.trim()||"",sourceWalletIndex:m("[data-vbot-source]")?.value||"1",rollingWallets:c,autoCreateWallets:!c,walletCount:String(o.walletCount),fundPerWalletSol:c?"":(u+.02).toFixed(4),buyAmountSol:u.toFixed(4),sellPercent:"100",buyBias:String(o.buyBias),cycles:String(d),maxRounds:String(d),delaySecs:String(o.delaySecs),slippageBps:"400",sweepBack:!0,walletIndexes:[],walletGroup:"",keepDust:!!m("[data-vbot-keepdust]")?.checked,offsetSell:!!m("[data-vbot-offset]")?.checked,staggerPattern:["steady","waves","organic","ladder"].includes(n.slimeBotStagger)?n.slimeBotStagger:"steady",investment:a,durationMin:r,mode:e,aggr:t}}function ba(e){n.volumeBotStatus=String(e||"");const t=m("[data-vbot-status]");t&&(t.textContent=n.volumeBotStatus)}async function vs({silent:e=!0}={}){try{const t=await k("/api/web/volume-bot");n.volumeBots=Array.isArray(t.bots)?t.bots:[],n.activeTab==="volume"&&h()}catch(t){e||T(t.message)}}async function Wb(){if(n.volumeBotBusy)return;const e=Fb();if(!e.tokenMint){ba("Paste a token CA first.");return}const t=e.durationMin>=60?`${(e.durationMin/60).toFixed(e.durationMin%60?1:0)}h`:`${e.durationMin}m`;if(await Me({title:"Start SlimeBot",lines:["This spends REAL SOL.",`Token: ${e.tokenMint}`,`${e.mode==="smart"?"Smart":"Spam"} mode, ${e.aggr.toUpperCase()} aggressiveness.`,`Deploys up to ~${e.investment} SOL over ${t} from your source wallet,`,`as ${e.cycles} round(s) of randomized ~${e.buyAmountSol} SOL buys / sells.`,"Sweeps funds back to the source wallet when done."],confirmLabel:"Start SlimeBot"})){n.volumeBotBusy=!0,ba("Funding wallets and starting bot..."),h();try{const r=await k("/api/web/volume-bot/start",{method:"POST",body:JSON.stringify(e),dedupe:!1,timeoutMs:ae});n.volumeBotBusy=!1,r.bot&&(n.volumeBots=[r.bot,...n.volumeBots.filter(s=>s.id!==r.bot.id)]),ba(r.bot?.message||"SlimeBot started."),h(),vs()}catch(r){n.volumeBotBusy=!1,ba(r.message),h()}}}async function _b(e){if(e)try{ba("Stopping bot...");const t=await k("/api/web/volume-bot/stop",{method:"POST",body:JSON.stringify({planId:e}),dedupe:!1,timeoutMs:ae});t.bot&&(n.volumeBots=n.volumeBots.map(a=>a.id===t.bot.id?t.bot:a)),ba(t.bot?.message||"Stop requested."),h(),vs()}catch(t){ba(t.message)}}function Nb(){return n.wallets.length?Eb():nu("SlimeBot","SlimeBot funds and trades from a managed SlimeWire wallet, so it needs at least one saved. Tap to create one — your backup downloads instantly.")}function Db(){const e=we([...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...qe()?.rows||[],...n.scan?.rows||[]]).sort(nt),t=vn(e),a=ot("launch",t),r=yn(),s=At(Re().keywords)[0]||"";return`
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
        ${hl("launch",{rawCount:e.length,visibleCount:t.length})}
        ${fl(e,t)}
        ${a.length?pt(a,{context:"launch-snipe",hideToolbar:!0,primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Pa}):r?vr(e,"launch candidates"):F("No launch filter set","Enter a ticker keyword like cook or broscook to watch fresh live pairs before they launch.")}
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
          <input data-launch-ticker type="text" placeholder="Example: OGRE" value="${i(s.toUpperCase())}">
        </label>
        <div class="wallet-checks">
          ${kt("launch")}
        </div>
        ${Ut("launch")}
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
            ${fs("launch-loop-delay","data-launch-loop-delay","0")}
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
        ${gs("launch")}
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
          <p>It scans live launch/profile feeds about every ${i(sy())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${ku()}
        </article>
      </aside>
    </section>
  `}function du(e=n.launchCoinDraft||{}){return String(e.tokenMint||e.mint||e.ca||n.launchWatches?.[0]?.tokenMint||n.launchWatches?.[0]?.mint||n.smartChartToken?.tokenMint||n.smartChartToken?.mint||"").trim()}function Ki(){return!!(Yt&&Yt.enabled&&(Yt.provider||Yt.playbackBaseUrl||Yt.ingestUrl))}function Ub(){const e=String(Yt.provider||"").trim();return e?e.toUpperCase():"Provider not configured"}function qb(e){const t=String(Yt.playbackBaseUrl||"").trim();if(!t||!e)return"";if(t.includes("{mint}"))return t.replace(/\{mint\}/g,encodeURIComponent(e));const a=t.includes("?")?"&":"?";return`${t}${a}mint=${encodeURIComponent(e)}`}function Hb(e){return e?e.length>14?`${e.slice(0,6)}...${e.slice(-6)}`:e:"No CA yet"}function uu(e){return`slime-pump-live-${e?`${e.slice(0,6)}-${e.slice(-6)}`:"pending-ca"}`}function Kb(e=n.launchCoinDraft||{}){const t=du(e),a=Ki(),r=qb(t),s=n.pumpLiveStatus||(t?a?"Ready to stage Pump Live for this launch.":"Provider hooks ready. Add Pump Live envs to enable real video.":"Launch or paste a CA to stage Pump Live."),o=t?"":"disabled",c=a&&r?`<iframe class="pump-live-frame" src="${i(r)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`:'<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>';return`
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
          <div class="pump-live-stat"><span>Launch CA</span><strong>${i(Hb(t))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${i(Ub())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${i(uu(t))}</strong></div>
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
  `}function cn({toolKey:e,activeKey:t,sections:a,variant:r=""}){const s=a.some(o=>o.key===t)?t:a[0]?.key;return`
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
  `}function dn(e,t){return n.toolSections&&n.toolSections[e]||t}function Vb(){const e=n.launchShareKit;if(!e?.tokenMint||Date.now()-(e.at||0)>7200*1e3)return"";const t=`https://www.slimewire.org/t?ca=${encodeURIComponent(e.tokenMint)}`,a=`Just launched $${e.symbol||e.name||"my coin"} on @pumpdotfun via slimewire.org - live chart, risk read, and call board in one link:`;return`
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
        <a class="button-like" href="${i(Ga(`/api/web/signal-card?tokenMint=${encodeURIComponent(e.tokenMint)}`))}" target="_blank" rel="noreferrer">📸 Share Card</a>
        ${Ye(a+" "+t,"Post to X")}
        <button data-launch-kit-close>Done</button>
      </div>
    </section>
  `}function zb(e={}){pu();const t=n.hypePages||[],r=new Date(Date.now()+600*1e3-new Date().getTimezoneOffset()*60*1e3).toISOString().slice(0,16);return`
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
    </div>`}let ws="";function pu(){!n.user||ws===n.user.id||(ws=n.user.id,(async()=>{try{const e=await k("/api/web/hype",{timeoutMs:12e3});n.hypePages=e.pages||[],n.hypePages.length&&h()}catch{ws=""}})())}async function jb(){const e=m("[data-hype-status]"),t=String(m("[data-hype-name]")?.value||m("[data-launch-coin-name]")?.value||"").trim(),a=String(m("[data-hype-symbol]")?.value||m("[data-launch-coin-symbol]")?.value||"").trim(),r=String(m("[data-hype-launch-at]")?.value||"").trim(),s=String(m("[data-hype-blurb]")?.value||"").trim();if(!t||!a){S(e,"Fill in the token name and ticker first (here or in Coin Details).");return}if(!r){S(e,"Pick the launch time.");return}S(e,"Creating hype page...");try{const o=await k("/api/web/hype",{method:"POST",body:JSON.stringify({name:t,symbol:a,blurb:s,launchAt:new Date(r).toISOString()}),timeoutMs:15e3});n.hypeStatus=`Hype page live: ${o.url} - share it everywhere, it forwards to your chart at launch.`,ws="",pu(),h()}catch(o){S(e,N(o?.message||"Could not create the hype page."))}}function Gb(){const e=n.launchCoinDraft||{},t=[{key:"coin",label:"Coin",hint:"Name & image",title:"Coin Details",html:`
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
                ${wb(e.devWalletIndex||(e.walletIndexes||[])[0]||"")}
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
                ${ct("trade",e.tradePresetId||n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${ct("bundle",e.bundlePresetId||n.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${i(e.amountSol||ze()||"0.1")}">
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
                ${n.wallets.length?kt("launch-coin",e.walletIndexes||null):'<p class="muted">Create or restore managed wallets first, or use Watch only.</p>'}
              </div>
            </label>
            ${Ut("launch-coin",e.walletGroup||"")}
          </div>`},{key:"hype",label:"Hype",hint:"Pre-launch page",title:"Pre-Launch Hype Page",html:zb(e)},{key:"live",label:"Live",hint:"Status feed",title:"Live Launch Status",html:Kb(e)}];return`
    ${window.location.pathname.includes("/launch-coin")?`
    <div class="launch-focus-bar">
      <button type="button" class="lf-btn lf-back" data-nav-route="/terminal" data-tab="terminal">← Back to Terminal</button>
      <span class="lf-title">🚀 Launch a Coin</span>
      <button type="button" class="lf-btn" data-nav-route="/terminal" data-tab="wallets">👛 Wallets</button>
    </div>`:""}
    ${Vb()}
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
          ${ku()}
        </article>
      </aside>
    </section>
  `}function Xb(){const e=n.launchCoinDraft||{},t=m("[data-launch-coin-image]")?.files?.[0];return{name:(m("[data-launch-coin-name]")?.value||"").trim(),symbol:(m("[data-launch-coin-symbol]")?.value||"").trim().replace(/^\$/,"").toUpperCase(),description:(m("[data-launch-coin-description]")?.value||"").trim(),imageName:t?.name||e.imageName||"",imageDataUrl:e.imageDataUrl||"",imageType:e.imageType||"",bannerName:m("[data-launch-coin-banner]")?.files?.[0]?.name||e.bannerName||"",bannerDataUrl:e.bannerDataUrl||"",bannerType:e.bannerType||"",website:(m("[data-launch-coin-website]")?.value||"").trim(),x:(m("[data-launch-coin-x]")?.value||"").trim(),telegram:(m("[data-launch-coin-telegram]")?.value||"").trim(),creatorFeeBps:(()=>{const a=m("[data-launch-coin-creator-fee]")?.value;return a==="custom"?String(Math.min(1e3,Math.max(0,Math.round((Number(m("[data-launch-coin-creator-fee-custom]")?.value)||0)*100)))):a||e.creatorFeeBps||"1000"})(),creatorFeeRecipient:(m("[data-launch-coin-fee-recipient]")?.value||"").trim(),feeMode:m("[data-launch-coin-fee-mode]")?.value||e.feeMode||"dev",buybackWallet:(m("[data-launch-coin-buyback-wallet]")?.value||"").trim(),burnCreatorFees:!!m("[data-launch-coin-burn-creator-fees]")?.checked,devBuyEnabled:!!m("[data-launch-coin-dev-buy-enabled]")?.checked,devWalletIndex:m("[data-launch-coin-dev-wallet]")?.value||e.devWalletIndex||"",devBuySol:Y(m("[data-launch-coin-dev-buy-sol]")?.value||e.devBuySol||"")||"",tokenMint:(m("[data-launch-coin-ca]")?.value||"").trim(),action:m("[data-launch-coin-action]")?.value||"watch",tradePresetId:m("[data-launch-coin-trade-preset]")?.value||"",bundlePresetId:m("[data-launch-coin-bundle-preset]")?.value||"",amountSol:Y(m("[data-launch-coin-amount]")?.value||e.amountSol||"0.1")||"0.1",sellPercent:m("[data-launch-coin-sell-percent]")?.value||e.sellPercent||"100",walletIndexes:Ve("launch-coin"),walletGroup:m("[data-launch-coin-group]")?.value?.trim()||"",stopLossPct:x("[data-launch-coin-sl]","[data-launch-coin-sl-custom]","8"),takeProfitPct:x("[data-launch-coin-tp]","[data-launch-coin-tp-custom]","40"),sellDelay:x("[data-launch-coin-delay]","[data-launch-coin-delay-custom]","off"),slippageBps:x("[data-launch-coin-slippage]","[data-launch-coin-slippage-custom]","300"),updatedAt:new Date().toISOString()}}function Ss(e){return e==="bundle"?"Bundle":e==="launch-watch"?"Launch Snipe":e==="trade"?"Trade":"Live Terminal"}function sr({silent:e=!1}={}){try{const t=Xb();n.launchCoinDraft=t,Oa(t);const a=t.name||t.symbol||"launch";return n.launchCoinStatus=`Saved ${a}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${Ss(t.action)}.`,e||S(m("[data-launch-coin-status]"),n.launchCoinStatus),t}catch(t){throw n.launchCoinStatus=t.message,S(m("[data-launch-coin-status]"),t.message),t}}function mu(e){return new Promise((t,a)=>{if(!e){t("");return}const r=new FileReader;r.onload=()=>t(String(r.result||"")),r.onerror=()=>a(new Error("Could not read that image file.")),r.readAsDataURL(e)})}function fu(e){return new Promise((t,a)=>{const r=new Image;r.onload=()=>t(r),r.onerror=()=>a(new Error("Could not preview that image for compression.")),r.src=e})}function un(e,t="application/octet-stream"){return String(e||"").match(/^data:([^;,]+)[;,]/i)?.[1]||t}async function hu(e){if(!e)return"";const t=8*1024*1024,a=42e4,r=1075e4;if(e.size>t)throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");const s=await mu(e);if(e.type==="image/gif"||/\.(?:gif|heic|heif|avif)$/i.test(e.name||"")){if(s.length>r)throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");return s}try{const o=await fu(s),c=384,l=Math.min(1,c/Math.max(o.width||c,o.height||c)),d=document.createElement("canvas");d.width=Math.max(1,Math.round((o.width||c)*l)),d.height=Math.max(1,Math.round((o.height||c)*l)),d.getContext("2d").drawImage(o,0,0,d.width,d.height);const p=[["image/webp",.76],["image/webp",.64],["image/webp",.52],["image/webp",.42],["image/jpeg",.72],["image/jpeg",.58],["image/jpeg",.46],["image/jpeg",.36]];for(const[f,y]of p){const b=d.toDataURL(f,y);if(b.length<=a)return b}}catch(o){const c=m("[data-launch-coin-status]"),l="Preview unavailable; SlimeWire will try to convert this image during launch.";if(n.launchCoinStatus=l,S(c,l),console.info("[SlimeWire launch image]",{step:"preview_unavailable_backend_convert",fileName:e.name||"",reportedMime:e.type||"",bytes:e.size||0,reason:o?.message||""}),s.length<=r)return s}if(s.length<=r){const o=m("[data-launch-coin-status]"),c="Image will be converted on the backend during launch.";return n.launchCoinStatus=c,S(o,c),s}throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.")}async function gu(e){if(!e)return"";const t=8*1024*1024,a=7e6;if(e.size>t)throw new Error("Banner is over 8MB. Use a smaller wide image or GIF (1500×500 works best).");const r=await mu(e);if(e.type==="image/gif"||/\.gif$/i.test(e.name||"")){if(r.length>a)throw new Error("Animated banner is too large. Keep it under ~5MB.");return r}try{const s=await fu(r),o=1500,c=Math.min(1,o/Math.max(1,s.width||o)),l=document.createElement("canvas");l.width=Math.max(1,Math.round((s.width||o)*c)),l.height=Math.max(1,Math.round((s.height||Math.round(o/3))*c)),l.getContext("2d").drawImage(s,0,0,l.width,l.height);for(const[u,p]of[["image/webp",.82],["image/webp",.7],["image/jpeg",.8],["image/jpeg",.66]]){const f=l.toDataURL(u,p);if(f.length<=a)return f}}catch{}if(r.length<=a)return r;throw new Error("Banner is too large for upload. Use a smaller wide image or GIF.")}async function Jb(){const e=m("[data-launch-coin-banner]")?.files?.[0];if(e){const a=await gu(e);return{bannerName:e.name,bannerType:un(a,e.type||"image/jpeg"),bannerDataUrl:a}}const t=n.launchCoinDraft||{};return t.bannerDataUrl?{bannerName:t.bannerName||"banner",bannerType:t.bannerType||un(t.bannerDataUrl,"image/jpeg"),bannerDataUrl:t.bannerDataUrl}:{}}async function Yb(){const e=m("[data-launch-coin-image]")?.files?.[0];if(e){const a=await hu(e);return{imageName:e.name,imageType:un(a,e.type||"application/octet-stream"),imageDataUrl:a}}const t=n.launchCoinDraft||{};return t.imageDataUrl?{imageName:t.imageName||"coin-image",imageType:t.imageType||un(t.imageDataUrl,"image/png"),imageDataUrl:t.imageDataUrl}:{}}function bu(e,t){const a=String(t||"").trim();n.launchCoinDraft={...e||{},tokenMint:a,updatedAt:new Date().toISOString()},Oa(n.launchCoinDraft),n.terminalToken=a,n.terminalAutoToken=a,n.tradeToken=a,n.bundleToken=a,n.volumeToken=a,n.smartChartToken=a,e?.tradePresetId&&(n.selectedTradePresetId=e.tradePresetId),e?.bundlePresetId&&(n.selectedBundlePresetId=e.bundlePresetId),e?.amountSol&&(n.quickBuyAmountOverride=Y(e.amountSol))}function Qb(e={}){const t=e.tradePresetId?le("trade",e.tradePresetId):null,a=(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,amountSol:Y(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function Zb(e={}){const t=e.tradePresetId?le("trade",e.tradePresetId):null,a=e.devWalletIndex||(e.walletIndexes||[])[0]||t?.walletIndex||t?.walletIndexes?.[0]||"1";return{...t||{},walletIndex:a,walletIndexes:[a],amountSol:Y(e.devBuySol||e.amountSol||t?.amountSol||"0.05")||"0.05",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"40",stopLossPct:e.stopLossPct??t?.stopLossPct??"8",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}function yu(e={}){const t=e.bundlePresetId?le("bundle",e.bundlePresetId):null;return{...t||{},walletIndexes:(e.walletIndexes?.length?e.walletIndexes:t?.walletIndexes)||[],walletGroup:e.walletGroup||t?.walletGroup||"",amountSol:Y(e.amountSol||t?.amountSol||"0.1")||"0.1",takeProfitPct:e.takeProfitPct??t?.takeProfitPct??"60",stopLossPct:e.stopLossPct??t?.stopLossPct??"10",sellDelay:e.sellDelay||t?.sellDelay||"off",sellPercent:e.sellPercent||t?.sellPercent||"100",slippageBps:e.slippageBps||t?.slippageBps||"300"}}async function ey(){const e=sr({silent:!0}),t=String(e.tokenMint||"").trim(),a=m("[data-launch-coin-status]");if(!t||t.length<32){n.launchCoinStatus="Paste the live token CA from Pump first. SlimeWire will not guess the CA.",S(a,n.launchCoinStatus);return}bu(e,t);const r=e.action==="bundle"?"bundle":e.action==="launch-watch"?"launch":e.action==="trade"?"trade":"terminal";n.launchCoinStatus=`Loaded ${w(t)} into ${Ss(e.action)}. Review the selected preset before sending any trade.`,Pe("/terminal",r),h({force:!0})}async function ty(e,t){const a=Date.now();let r="",s=0;for(;Date.now()-a<18e4;){await xe(1200);let c=null;try{c=(await k(`/api/web/launch/progress?launchAttemptId=${encodeURIComponent(e)}`,{timeoutMs:8e3,dedupe:!1})).progress||null,s=0}catch{if(s+=1,s===4){const p="Progress feed reconnecting...";n.launchCoinStatus=p,S(t,p)}if(s>=15){const p=new Error("Lost the launch progress feed (the server may have restarted). Check Positions/chart in ~1 minute before launching again - the launch may still have completed.");throw p.launchAttemptId=e,p}continue}if(!c)continue;if(c.status==="COMPLETE")return c.launch||{};if(c.status==="FAILED"){const u=new Error(c.failureReason||"Launch failed.");throw u.launchAttemptId=e,u}const l=Math.round((Date.now()-a)/1e3),d=`${c.stageText||"Working..."} · ${l}s`;d!==r&&(r=d,n.launchCoinStatus=d,S(t,d))}const o=new Error("The launch is still finishing on the server - check the chart or Live Launch Status in a minute. Do NOT launch again (that would create a second coin).");throw o.launchAttemptId=e,o}const vu=new Map;function wu(e){const t=String(e||"").trim();t&&vu.set(t,Date.now()+3e4)}function ay(e){const t=vu.get(String(e||"").trim());return!!(t&&Date.now()<t)}async function Su(){try{const e=await k("/api/web/trade/plans",{timeoutMs:9e3,dedupe:!1});Array.isArray(e?.plans)&&(n.tradePlans=e.plans)}catch{}}function ny(e,t={},a={}){const r=String(e||"").trim();if(!r)return;const s=String(t.symbol||"").replace(/^\$/,"").slice(0,24)||w(r),o=String(t.name||"").slice(0,48),c=Number(a.bundledWalletCount||0)+(a.devBuyIncluded?1:0)||1;(n.positions||[]).some(d=>String(d.tokenMint||d.mint)===r)||(n.positions=[{tokenMint:r,symbol:s,name:o,shortMint:w(r),uiAmount:"just bought",walletCount:String(c),estimatedValueSol:null,openPnlSol:null,valuePending:!0,source:"launch-optimistic"},...n.positions||[]]),n.smartChartToken=r,n.terminalToken=r,il({tokenMint:r,symbol:s,name:o,imageUrl:t.imageDataUrl||"",source:"launch"}),ip(r)}async function ry(){if(n.launchCoinSubmitting)return;const e=m("[data-launch-coin-status]"),t=m("[data-launch-coin-submit]");n.launchCoinSubmitting=!0,t&&(t.disabled=!0,t.dataset.prevLabel=t.textContent,t.textContent="Launching...");try{const a=sr({silent:!0});if(!a.name||String(a.name).trim().length<2)throw new Error("Enter a token name (2+ characters) before launching.");if(!a.symbol||String(a.symbol).trim().length<2)throw new Error("Enter a ticker (2+ characters) before launching.");if(!m("[data-launch-coin-image]")?.files?.[0]&&!n.launchCoinDraft?.imageDataUrl&&!await Me({title:"No Coin Image Selected",lines:[`${a.name} (${a.symbol}) has no custom image.`,"pump.fun will show the default SlimeWire logo instead of your own artwork.","Launch anyway?"],confirmLabel:"Launch With Default Logo",cancelLabel:"Add Image First"})){n.launchCoinStatus="Launch paused - add a coin image in the Coin section, then launch again.",S(e,n.launchCoinStatus);return}n.launchCoinStatus="Preparing image for SlimeWire backend conversion...",S(e,n.launchCoinStatus);const r=await Yb(),s=await Jb(),o=globalThis.crypto?.randomUUID?.()||`launch-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;let c=null;if(a.action==="bundle"){const b=yu(a);c={walletIndexes:b.walletIndexes||[],walletGroup:b.walletGroup||"",amountSol:b.amountSol||"0",slippageBps:b.slippageBps||"300"}}const l={...a,...r,...s,launchAttemptId:o,...c?{bundleBuy:c}:{}},d=JSON.stringify(l);if(d.length>115e5)throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");console.info("[SlimeWire pump launch]",{launchAttemptId:o,step:"frontend_submit",symbol:a.symbol,selectedDevWalletId:a.selectedDevWalletId||a.devWalletIndex||a.devWalletPublicKey||""}),n.launchCoinStatus=`Submitting launch through SlimeWire... Launch ID: ${o}`,S(e,n.launchCoinStatus);let p=(await k("/api/web/launch/coin",{method:"POST",body:d,timeoutMs:ae,preserveSafeError:!0})).launch||{};p.async&&p.status==="RUNNING"&&p.launchAttemptId&&(p=await ty(p.launchAttemptId,e));const f=String(p.tokenMint||p.mint||p.ca||p.contractAddress||"").trim(),y=p.signature?` Signature: ${w(p.signature)}.`:"";if(!f){n.launchCoinStatus=`Launch submitted, but the launch connector did not return a CA yet.${y} The CA will appear above when it lands — then trade it from the Swap panel.`,S(e,n.launchCoinStatus);return}bu(a,f),n.launchShareKit={tokenMint:f,symbol:a.symbol||"",name:a.name||"",at:Date.now()},n.launchCoinDraft={tokenMint:f};try{Oa(n.launchCoinDraft)}catch{}if(p.bundled){const b=Number(p.bundledWalletCount||0),P=[p.devBuyIncluded?"dev buy":"",b>0?`${b} bundle buy${b===1?"":"s"}`:""].filter(Boolean).join(" + ");n.launchCoinStatus=p.bundleFallback?`Launched ${w(f)} via the standard path (bundle missed the block lottery)${P?` - server fired ${P} right behind the create`:""}.${y} Opening chart...`:`Launch bundled atomically: ${w(f)}${P?` (${P} landed in-block)`:""}${p.exitsArmed?" - exits auto-armed":" - ⚠️ tap Arm Exits on your bag"}.${y} Opening chart...`,S(e,n.launchCoinStatus),ny(f,a,p),V(p.signature||"","pump-launch-first-buys"),wt({force:!0,fast:!0,silent:!0,reason:"pump-launch-instant"}).catch(()=>{}),(p.bundleFallback||p.exitsArmed)&&wu(f),[3e3,8e3,16e3].forEach(A=>window.setTimeout(()=>{Su().then(()=>h())},A)),Pe("/terminal/chart","smartChart"),h({force:!0});return}if(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Routing into ${Ss(a.action)}...`,S(e,n.launchCoinStatus),a.devBuyEnabled&&(n.launchCoinStatus=`Launch returned ${w(f)}.${y} Running Dev Wallet Initial Buy first...`,S(e,n.launchCoinStatus),await Ns(f,Zb(a)),n.launchCoinStatus=`Dev Wallet Initial Buy submitted. Continuing post-launch ${Ss(a.action)} setup...`,S(e,n.launchCoinStatus)),a.action==="trade"){await Ns(f,Qb(a));return}if(a.action==="bundle"){await Xu(f,yu(a));return}if(a.action==="launch-watch"){n.activeTab="launch",Pe("/terminal","launch"),h({force:!0});return}Pe("/terminal/chart","smartChart"),h({force:!0})}catch(a){const r=a.launchAttemptId&&!String(a.message||"").includes(a.launchAttemptId)?` Launch ID: ${a.launchAttemptId}.`:"";n.launchCoinStatus=`${a.message||"Launch failed."}${r}`,console.error("[SlimeWire pump launch]",{launchAttemptId:a.launchAttemptId||"",stage:a.stage||"",code:a.code||"",providerStatus:a.providerStatus||null,message:a.message||"Launch failed."}),S(e,n.launchCoinStatus),T(n.launchCoinStatus)}finally{n.launchCoinSubmitting=!1;const a=m("[data-launch-coin-submit]");a&&(a.disabled=!1,a.textContent=a.dataset.prevLabel||"Launch on Pump")}}function sy(){const e=n.launchWatches?.[0]?.scanIntervalMs;return e?(e/1e3).toFixed(e%1e3===0?0:1):"1.5"}function ku(){return n.launchWatches.length?`
    <div class="mini-results">
      ${n.launchWatches.map(e=>`
        <span>
          $${i(e.ticker)} - ${i(e.status)} - ${i(e.walletCount)} wallet(s)
          ${Ye(Ig(e),"Share Watch")}
          ${e.status==="launch_watch"?`<button data-launch-cancel="${i(e.id)}">Cancel</button>`:""}
        </span>
      `).join("")}
    </div>
  `:"<p>No active launch watches yet.</p>"}function ks(e={}){return String(e.kolId||e.id||e.wallet||e.kolWallet||e.owner||e.traderWallet||e.twitter||e.handle||e.kolName||e.name||e.shortWallet||e.tokenMint||"").trim().replace(/\s+/g,"_").toLowerCase()}function $u(e={}){const t=String(e.kolWallet||e.wallet||e.owner||e.traderWallet||"").trim(),a=et(e.twitter||e.handle||e.x||""),r=String(e.tokenMint||e.mint||"").trim(),s=String(e.kolName||e.traderName||e.kol_name||"").trim(),o=e.kolCount?`${e.kolCount} KOL${Number(e.kolCount)===1?"":"s"}`:"";return{kolId:t||a||s||r,wallet:t,kolWallet:t,twitter:a,handle:a,name:s||o||e.signalType||e.symbol||w(r),displayName:s||o||"KOL signal",shortWallet:t?w(t):"",tokenMint:r,symbol:e.symbol||"",callsTracked:O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount,t||a?1:0),currentPositionCount:O(e.currentPositionCount,e.positionCount,e.kolCount,1),dumpRiskPercent:e.dumpRiskPercent,soldWithin15mPercent:e.soldWithin15mPercent,soldWithin60mPercent:e.soldWithin60mPercent,medianHoldMinutes:e.medianHoldMinutes,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent,followerSurvival30mPercent:e.followerSurvival30mPercent,followerSurvival60mPercent:e.followerSurvival60mPercent,source:e.source||e.sourceLabel||"kol_signal_row",lastSeenAt:n.kolLastUpdatedAt||new Date().toISOString()}}function $s(e={}){const t=Number(O(e.callsTracked,e.trades,e.tradeCount,e.buyCount,e.kolCount)),a=dt(e.dumpRiskPercent??e.soldWithin60mPercent),r=Number.isFinite(a),s=r?Math.max(0,Math.min(100,Math.round(a))):0,o=!r||t<5,c=o?"Mixed":s>=50?"High Dump Risk":s>=30?"Dump Risk":s<=15?"Trusted Flow":"Mixed",l=[e.wallet,e.kolWallet,e.owner,e.traderWallet,e.address,e.publicKey].filter(Boolean),d=l[0]||"",u=et(e.handle||e.twitter||""),p=[{label:"Solscan",url:d?`https://solscan.io/account/${encodeURIComponent(d)}`:""},{label:"KOLscan",url:d?`https://kolscan.io/account/${encodeURIComponent(d)}`:""},{label:"X",url:e.xUrl||e.twitterUrl||(u?`https://x.com/${u}`:"")},{label:"Profile",url:e.profileUrl||e.kolscanUrl||e.kolScanUrl||""},{label:"Website",url:e.websiteUrl||e.website||""}].filter((f,y,b)=>/^https?:\/\//i.test(String(f.url||""))&&b.findIndex(v=>String(v.url||"")===String(f.url||""))===y).slice(0,6);return{kolId:ks(e),displayName:e.displayName||e.name||e.kolName||(e.twitter?`@${e.twitter}`:e.shortWallet||w(e.wallet||e.kolWallet||"")),handle:u,walletAddresses:l,callsTracked:t,currentPositionCount:O(e.currentPositionCount,e.positionsCount,e.positionCount),lastTokenMint:e.lastTokenMint||e.tokenMint||e.mint||"",lastTokenSymbol:e.lastTokenSymbol||e.symbol||"",dumpRiskPercent:s,medianHoldMinutes:e.medianHoldMinutes||null,soldWithin15mPercent:e.soldWithin15mPercent||null,soldWithin60mPercent:r?s:null,medianPostSignalDrawdownPercent:e.medianPostSignalDrawdownPercent||null,followerSurvival30mPercent:e.followerSurvival30mPercent||null,followerSurvival60mPercent:e.followerSurvival60mPercent||null,riskLabel:c,lowData:o,confidence:o?"low":t>=12?"high":"medium",historySource:e.source||"local-ui",externalLinks:p,firstSeenAt:e.firstSeenAt||"",lastSeenAt:e.lastSeenAt||"",reasons:o?["Low local sell-window history. Wallet-based until social signal data is available."]:s>=30?["Fast sell-window history is elevated for tracked calls."]:["Tracked sell-window history is not showing high dump pressure."],updatedAt:new Date().toISOString()}}function oy(e=[]){const t=new Map;for(const a of e.filter(Boolean)){const r=String(a.kolId||ks(a)||"").trim();if(!r)continue;const s=t.get(r);t.set(r,s?{...s,...a,kolId:r}:{...a,kolId:r})}return[...t.values()]}function Ts(){const e=Array.isArray(n.kolDumpStats?.stats)?n.kolDumpStats.stats:[],t=Array.isArray(n.kolScan?.kols)?n.kolScan.kols:[],a=Array.isArray(n.kolScan?.rows)?n.kolScan.rows.map($u):[],r=!e.length&&!t.length&&!a.length?Oi():[];return oy([...e,...t.map($s),...a.map($s),...r.map($s)]).filter(s=>s.kolId)}function iy(e={}){return e.lowData||Number(e.callsTracked||0)<5?"Low data":`${Math.round(Number(e.dumpRiskPercent||0))}% dump risk`}function or(e={}){const t=Number.isFinite(Number(e.medianHoldMinutes))?`median hold ${Math.round(Number(e.medianHoldMinutes))}m`:"median hold n/a";return`${e.riskLabel||"Mixed"} · ${iy(e)} · ${t}`}function Tu(e={}){const t=ks(e);return t?Ts().find(a=>String(a.kolId||"")===t)||$s(e):null}function ly(e=""){const t=String(e||"").trim();if(!t)return{displayName:"KOL Wallet",reasons:[]};const a=Dt(t)?t:"";return{kolId:t,displayName:a?w(a):t.replace(/^wallet:/,"KOL "),handle:"",walletAddresses:a?[a]:[],callsTracked:0,currentPositionCount:0,dumpRiskPercent:0,medianHoldMinutes:null,soldWithin15mPercent:null,soldWithin60mPercent:null,medianPostSignalDrawdownPercent:null,followerSurvival30mPercent:null,followerSurvival60mPercent:null,riskLabel:"Mixed",lowData:!0,confidence:"low",historySource:"clicked-kol-context",externalLinks:[{label:"Solscan",url:a?`https://solscan.io/account/${encodeURIComponent(a)}`:""},{label:"KOLscan",url:a?`https://kolscan.io/account/${encodeURIComponent(a)}`:""}].filter(r=>/^https?:\/\//i.test(String(r.url||""))),reasons:["KOL profile history is warming up from the current KOL feed.","Refresh KOL Tracker to store the newest wallet-position rows before judging sell behavior."],updatedAt:new Date().toISOString()}}function Vi(e={},t="KOL Info"){if(!D("kolDumpDetectorEnabled",!0))return"";const a=Tu(e),r=String(a?.kolId||ks(e)||"").trim();if(!r)return"";const s=a?or(a):"Open wallet-based KOL dump breakdown";return`<button type="button" class="kol-dump-chip" data-kol-dump-details="${i(r)}" title="${i(s)}">${i(t)}</button>`}function Au(e={},t="KOL Info"){return D("kolDumpDetectorEnabled",!0)?Vi($u(e),t):""}function cy(e={}){if(!D("kolDumpDetectorEnabled",!0))return"";const t=Tu(e);return t?.kolId?`<small class="kol-dump-inline">${i(or(t))}</small>`:""}function f0(){if(!D("kolDumpDetectorEnabled",!0))return"";const e=Ts().slice(0,6);return`
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
              <p>${i(or(t))}</p>
              <button type="button" data-kol-dump-details="${i(t.kolId)}">Details</button>
            </article>
          `).join("")}
        </div>
      `:F("KOL dump stats warming up","Refresh KOL Tracker to load wallet rows. No chain scan runs from this panel.")}
    </section>
  `}async function zi(e={}){if(!D("kolDumpDetectorEnabled",!0))return null;const t=!!e.force;if(!t&&n.kolDumpStatsLoadedAt&&Date.now()-Number(n.kolDumpStatsLoadedAt||0)<900*1e3)return n.kolDumpStats;if(n.kolDumpStatsLoading)return null;n.kolDumpStatsLoading=!0;try{const a=new URLSearchParams({mode:n.kolMode||"hot"});n.kolWallet&&a.set("wallet",n.kolWallet),t&&a.set("force","true");const r=await k(`/api/web/kols/dump-stats?${a.toString()}`,{timeoutMs:t?5e3:3e3,preserveSafeError:!0});return n.kolDumpStats=r,n.kolDumpStatsLoadedAt=Date.now(),se(r.cacheHit?"kolStatsCacheHit":"kolStatsCacheMiss"),r}catch{return n.kolDumpStats=n.kolDumpStats||{stats:[],message:"KOL dump stats unavailable. Showing local low-data fallback."},n.kolDumpStatsLoadedAt=Date.now(),null}finally{n.kolDumpStatsLoading=!1,n.kolDumpDetails?.open?As():n.activeTab==="kol"&&h({force:!0})}}function dy(e=""){const t=String(e||"").trim();!t||!D("kolDumpDetectorEnabled",!0)||(n.kolDumpDetails={open:!0,kolId:t},Ka(),As(),zi({force:!0}))}function ji(){n.kolDumpDetails={open:!1,kolId:""},As(),Vr()}function As(){let e=document.querySelector("[data-kol-dump-drawer-root]");e||(e=document.createElement("div"),e.dataset.kolDumpDrawerRoot="true",document.body.appendChild(e));const t=n.kolDumpDetails||{},a=!!(t.open&&t.kolId);if(document.body.classList.toggle("kol-dump-drawer-open",a),!a||!D("kolDumpDetectorEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=Ts().find(u=>String(u.kolId)===String(t.kolId))||ly(t.kolId),s=!!n.kolDumpStatsLoading,o=Array.isArray(r.walletAddresses)?r.walletAddresses.filter(Boolean).slice(0,4):[],c=Array.isArray(r.externalLinks)?r.externalLinks.filter(u=>/^https?:\/\//i.test(String(u?.url||""))).slice(0,4):[],l=r.lastTokenMint?`${r.lastTokenSymbol?`${r.lastTokenSymbol} `:""}${w(r.lastTokenMint)}`:"n/a",d=`
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
        <p>${i(or(r))}</p>
        <small>${s?"Updating from KOL sources...":`Confidence: ${i(r.confidence||"low")} · Source: ${i(String(r.historySource||"cached profile").replace(/_/g," "))} · Updated ${i(Te(r.updatedAt))}`}</small>
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
          <li><span>First seen: ${i(r.firstSeenAt?Te(r.firstSeenAt):"n/a")}</span></li>
          <li><span>Last seen: ${i(r.lastSeenAt?Te(r.lastSeenAt):"n/a")}</span></li>
          <li><span>Source: ${i(String(r.historySource||"cached profile").replace(/_/g," "))}</span></li>
        </ul>
        ${c.length?`<div class="slimeshield-drawer-actions">${c.map(u=>`<a href="${i(u.url)}" target="_blank" rel="noreferrer">${i(u.label||"Open")}</a>`).join("")}</div>`:""}
      </section>
      <section>
        <h4>Interpretation</h4>
        <ul class="slimeshield-factor-list">
          ${(r.reasons||["No local sell-window history yet."]).map(u=>`<li><span>${i(u)}</span></li>`).join("")}
        </ul>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-kol-dump-refresh="${i(t.kolId)}" ${s?"disabled":""}>${s?"Updating...":"Refresh KOL Info"}</button>
      </div>
      <p class="slimeshield-safety-copy">This is wallet-based until social signal data is available. It never scans the chain from this details drawer.</p>
    </aside>
  `;Sn(e,d,".kol-dump-drawer")}function uy(){const e=n.kolScan?.configured!==!1,t=n.kolLoading?"disabled":"",a=String(n.kolMode||"hot"),r=!!n.kolScan,s=!!n.kolScan?.kols?.length,o=s&&a!=="hot",c=!r&&!s;return`
    <section class="section-actions mode-row">
      <button data-kol-mode="top" data-active="${n.kolMode==="top"}" ${t}>Top KOLs</button>
      <button data-kol-mode="hot" data-active="${n.kolMode==="hot"}" ${t}>Hot Buys</button>
      <button data-kol-mode="consistent" data-active="${n.kolMode==="consistent"}" ${t}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${n.kolMode==="fresh"}" ${t}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${n.kolMode==="slimewire"}" ${t}>Top SlimeWire</button>
      <button data-kol-refresh ${t}>${n.kolLoading?"Scanning...":"Refresh"}</button>
    </section>
    <p class="scan-meta">${i(my(n.kolMode))}</p>
    ${py()}
    ${o?hy():c?Wg():""}
    ${n.kolMode==="slimewire"&&n.kolScan?n.kolScan.kols?.length?"":F("No SlimeWire traders yet","Traders appear here only after they opt in from Profile and have site trade history."):n.kolScan?gy():F("No KOL scan loaded","Pick a KOL mode or tap Refresh.")}
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
            ${kt("kol")}
          </div>
          ${Ut("kol")}
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
            ${fs("kol-loop-delay","data-kol-loop-delay","0")}
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
        ${gs("kol")}
        <p class="trade-status" data-kol-status>${n.kolResult?i(n.kolResult.message||"KOL copy plan armed."):e?"Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet.":"Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${fy()}
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
            ${n.kolWallet?Ye(Wd(n.kolWallet),"Share KOL"):""}
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
  `}function py(){const e=n.kolScan||null,t=ir(n.kolMode),a=n.kolLoading?`Scanning ${t}`:e?`${t} loaded`:`Pick ${t} or tap Refresh`,r=Number(e?.kolCount||e?.kols?.length||0),s=Number(e?.rows?.length||0),o=n.kolLastUpdatedAt?Te(n.kolLastUpdatedAt):"Not run";return`
    <div class="trade-status kol-status kol-status-grid">
      <span>${i(a)}</span>
      <span>${i(r)} KOLs</span>
      <span>${i(s)} signals</span>
      <span>${i(o)}</span>
    </div>
  `}function ir(e){const t={hot:"Hot Buys",top:"Top KOLs",consistent:"Consistent",fresh:"Fresh",slimewire:"Top SlimeWire Traders"};return t[e]||t.hot}function my(e){const t={hot:"Top coins KOL wallets are calling now. Hot Buys refreshes around every 10 seconds while the tab is open.",top:"Best ranked KOL wallets by realized performance, then their highest-value current token positions.",consistent:"KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",fresh:"KOL wallets with the newest activity first, useful when you want faster signal flow.",slimewire:"Opt-in SlimeWire users ranked by closed trades and recent activity."};return t[e]||t.hot}function fy(){const e=n.kolResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function hy(){const e=n.kolScan||{},t=(e.kols||[]).filter(a=>a.wallet||a.twitter);return!t.length||e.configured===!1?"":`
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${i(e.label||"KOL Tracker")}</h3>
          <p>${i(`${ir(n.kolMode)} with ${Number(e.rows?.length||0)} current token signal(s).`)}</p>
        </div>
        <span>${i(e.kolCount||t.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${t.slice(0,12).map((a,r)=>`
          <article class="kol-profile">
            ${qd(a)}
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
            <small>${i(a.source==="slimewire"?`Tracking ${a.trackedWalletMode==="manual"?`${a.trackedWalletCount||0} wallet(s)`:"all wallets"}`:a.volumeLabel||"Volume n/a")} | Last trade: ${i(Te(a.lastTradeAt))}</small>
            ${cy(a)}
            <div class="card-actions kol-profile-actions">
              ${a.solscanUrl?`<a href="${i(a.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>`:""}
              ${a.kolscanUrl||a.wallet?`<a href="${i(a.kolscanUrl||Fc(a.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>`:""}
              ${Vi(a)}
              ${Ye(Rg(a),"Share Watch")}
              ${a.wallet?`<button class="kol-copy-bubble" data-kol-copy-setup="${i(a.wallet)}">Copy Trade</button>`:""}
              ${a.wallet?`<button data-kol-scan-wallet="${i(a.wallet)}">Scan Positions</button>`:""}
              ${a.wallet?`<button data-kol-copy-wallet="${i(a.wallet)}">Copy Wallet</button>`:""}
              ${a.wallet?`<button data-copy="${i(a.wallet)}">Copy Address</button>`:""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `}function gy(){const e=n.kolScan||{};if(e.configured===!1)return F("KOL Tracker is not connected yet",e.message||"Use Scan Wallet for a public wallet, or try again later.");const t=e.rows||[],a=ot("kol",t);return t.length?`
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${i(ir(n.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${a.length}/${t.length} signals shown</span>
    </div>
    ${pt(a,{context:"kol",primaryAction:"quickTrade",primaryActionLabel:"Trade",shareBuilder:Bg})}
    ${da("kol",t,"KOL signals")}
  `:F(e.kols?.length?"No token signals on this refresh":"No KOL signals found",e.message||"Try Refresh or another mode.")}async function Pu(){const e=m("input[data-wallet-label]"),t=m("input[data-wallet-count-input]"),a=m("[data-create-wallet-status]"),r=[...document.querySelectorAll("[data-create-wallets]")];T(""),S(a,"Creating wallets..."),r.forEach(s=>{s.disabled=!0,S(s,"Creating...")});try{const s=Number.parseInt(t?.value||"1",10);if(!Number.isInteger(s)||s<1||s>20)throw new Error("Wallet count must be from 1 to 20.");await J(a,"Creating secure web profile for wallet backups...");const o=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:String(e?.value||"").trim()||"Ogre Web",count:s})}),c=Array.isArray(o.wallets)?o.wallets:[];if(!c.length)throw new Error(o.message||"Wallet create did not return wallet data. Refresh and try again.");n.downloads=o.downloads||null,o.downloads?.encryptedBackup?.text&&be(o.downloads.encryptedBackup.filename,o.downloads.encryptedBackup.text),o.downloads?.recoveryKeys?.text&&be(o.downloads.recoveryKeys.filename,o.downloads.recoveryKeys.text),S(a,o.downloads?`Created ${c.length} wallet(s). Backup downloads started.`:`Created ${c.length} wallet(s). Use Download Backup before funding.`);try{const l=await k("/api/web/wallets",{timeoutMs:1e4});Array.isArray(l?.wallets)&&(n.wallets=l.wallets)}catch{}n.toolSections={...n.toolSections||{},wallets:"balances"},n.walletRemoveStatus=`Created ${c.length} wallet(s) - they are in the list below. Back up before funding.`,V(Be(o.plan),"wallet-create"),n.activeTab="wallets",h()}catch(s){S(a,s.message),T(s.message)}finally{r.forEach(s=>{s.disabled=!1,S(s,"Create Wallets")})}}async function by(){const e=m("[data-automation-delegation-status]"),t=[...document.querySelectorAll("[data-create-automation-wallet]")];T(""),n.automationDelegationStatus="Creating automation wallet...",S(e,n.automationDelegationStatus),t.forEach(a=>{a.disabled=!0,S(a,"Creating...")});try{await J(e,"Creating secure web profile for automation wallet backups...");const a=n.user?.connectedWallet,r=a?.publicKey?`Automation ${w(a.publicKey)}`:"Automation Wallet",s=await k("/api/web/wallets/create",{method:"POST",body:JSON.stringify({label:r,count:1})});if(!(Array.isArray(s.wallets)?s.wallets:[]).length)throw new Error(s.message||"Automation wallet create did not return wallet data. Refresh and try again.");n.downloads=s.downloads||null,s.downloads?.encryptedBackup?.text&&be(s.downloads.encryptedBackup.filename,s.downloads.encryptedBackup.text),s.downloads?.recoveryKeys?.text&&be(s.downloads.recoveryKeys.filename,s.downloads.recoveryKeys.text),n.automationDelegationStatus="Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.",V(Be(s.plan),"automation-wallet-create"),n.activeTab="wallets",h({force:!0})}catch(a){n.automationDelegationStatus=a.message,S(e,a.message),T(a.message)}finally{t.forEach(a=>{a.disabled=!1,S(a,"Create Automation Wallet")})}}function yy(e=null){const a=(e?.closest?.(".session-wallet-controls, .automation-delegation-card, .connected-wallet-card")||document).querySelector?.("[data-session-wallet-amount]")||m("[data-session-wallet-amount]"),r=Y(a?.value||"0.10");if(!r)throw new Error("Enter a session wallet budget greater than zero.");const s=Number(r);if(!Number.isFinite(s)||s<.005)throw new Error("Session wallet budget must be at least 0.005 SOL.");if(s>10)throw new Error("Session wallet budget is capped at 10 SOL per approval.");return r}async function vy(e=ue()){if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before starting a session wallet.");if(n.user?.connectedWallet?.publicKey===e.publicKey)return;const t=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:e.publicKey,provider:e.provider||"Browser Wallet"})});he(t.user||{...n.user,connectedWallet:t.profile?.connectedWallet||null})}async function wy(e=null){const t=m("[data-automation-delegation-status]")||m("[data-wallet-connect-status]"),a=[...document.querySelectorAll("[data-create-session-wallet]")];T(""),a.forEach(r=>{r.disabled=!0,S(r,"Opening...")});try{const r=yy(e),{provider:s,connected:o}=await _u();await J(t,"Creating secure web profile for session wallet..."),await vy(o),n.automationDelegationStatus="Creating session wallet and funding approval...",S(t,n.automationDelegationStatus);const c=await k("/api/web/session-wallet/create",{method:"POST",body:JSON.stringify({amountSol:r,label:`Session ${w(o.publicKey)}`}),dedupe:!1,timeoutMs:ae});n.wallets=Array.isArray(c.wallets)?c.wallets:n.wallets,n.downloads=c.downloads||n.downloads||null,c.downloads?.encryptedBackup?.text&&be(c.downloads.encryptedBackup.filename,c.downloads.encryptedBackup.text),c.downloads?.recoveryKeys?.text&&be(c.downloads.recoveryKeys.filename,c.downloads.recoveryKeys.text),n.automationDelegationStatus=c.order?.message||"Approve session wallet funding in your wallet...",S(t,n.automationDelegationStatus);const l=await jy(c.order?.transaction,s);n.automationDelegationStatus="Submitting session wallet funding...",S(t,n.automationDelegationStatus);const d=await k("/api/web/session-wallet/execute",{method:"POST",body:JSON.stringify({sessionWalletAttemptId:c.order?.sessionWalletAttemptId,signedTransaction:l}),dedupe:!1,timeoutMs:ae});n.wallets=Array.isArray(d.wallets)?d.wallets:n.wallets,n.automationDelegationStatus=d.message||"Session wallet funded and ready.",V(d.signature||"","session-wallet-funded"),await St({force:!0,deep:!0,reason:"session-wallet-funded"}),n.activeTab="wallets",h({force:!0})}catch(r){const s=N(r.message||"Session wallet setup failed.");n.automationDelegationStatus=s,S(t,s),T(s)}finally{a.forEach(r=>{r.disabled=!1,S(r,"Start Session Wallet")})}}async function Gi(e="enable",t={}){const a=m("[data-automation-delegation-status]"),r=[...document.querySelectorAll("[data-automation-permission]")],s=e!=="revoke";if(s&&!vd()){n.automationDelegationStatus="Connect or create a wallet before enabling TP/SL.",S(a,n.automationDelegationStatus),T(n.automationDelegationStatus),Pi();return}yd(!s,t.scope||""),n.automationDelegationStatus=s?t.auto?"TP/SL auto-enabled for this wallet session...":"Enabling server exits...":"Revoking server exits...",S(a,n.automationDelegationStatus),r.forEach(o=>{o.disabled=!0,S(o,s?"Enabling...":"Revoking...")});try{await J(a,"Creating secure web profile for automation permission...");const o=await k("/api/web/profile/automation",{method:"POST",body:JSON.stringify({action:s?"enable":"revoke",ttlHours:720})});he(o.user||{...n.user,automationPermission:o.profile?.automationPermission||null});const c=n.user?.automationPermission||{};n.automationDelegationStatus=s?`${t.auto?"TP/SL auto-enabled":"Server exits enabled"} for this wallet session until ${Te(c.expiresAt)}.`:"Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.",h({force:!0})}catch(o){n.automationDelegationStatus=o.message,S(a,o.message),T(o.message)}finally{r.forEach(o=>{o.disabled=!1,S(o,o.dataset.automationPermission==="revoke"?"Disable TP/SL":"Enable TP/SL Now")})}}async function Xi(e={}){const t=!!e.silent,a=e.refreshWallet!==!1;if(!n.user||!n.token){t||T("Log in or create a web account before checking server exits.");return}if(qr){n.automationDelegationStatus="TP/SL check is already running. Keeping the existing sell check active.",t||h();return}qr=!0,t||(n.walletRefreshing=!0,h());try{const r=await k("/api/web/trade/plans/run",{method:"POST",body:JSON.stringify({}),timeoutMs:ae});n.tradePlans=r.plans||n.tradePlans||[];const s=r.runner||{},o=r.webExitGuards||{},c=r.portfolioExits||{},l=Number(s.soldWallets||0)+Number(o.soldGuards||0)+Number(c.soldPositions||0),d=Number(s.triggeredWallets||0)+Number(o.triggeredGuards||0)+Number(c.triggeredPositions||0);if(s.skipped){const u=Number(s.activeForMs||0),p=u>0?` for ${Math.ceil(u/1e3)}s`:"";n.automationDelegationStatus=s.reason==="trade_plan_runner_active"?`TP/SL runner is already checking exits${p}. It will keep retrying without starting a duplicate sell.`:`TP/SL check skipped: ${s.reason||"runner busy"}.`,a&&!t&&await ui({force:!0});return}n.automationDelegationStatus=Sy(s),(a||l>0||d>0)&&await ui({force:!0}),t&&(l>0||d>0)&&h({preserveSmartChartFrame:n.activeTab==="smartChart"})}catch(r){n.automationDelegationStatus=r.message,n.walletRefreshError=r.message,t||T(r.message)}finally{qr=!1,t||(n.walletRefreshing=!1,h())}}function Sy(e={}){if(e.skipped)return`TP/SL skipped: ${e.reason||"runner busy"}.`;const t=Number(e.checkedWallets||0),a=Number(e.triggeredWallets||0),r=Number(e.soldWallets||0),s=Number(e.failedWallets||0),o=Array.isArray(e.messages)&&e.messages.length?` Last: ${e.messages[e.messages.length-1]}`:"";return`TP/SL checked ${t}, triggered ${a}, sold ${r}, failed ${s}.${o}`}function Ji(){const e=new Set(["armed","watching","retrying","submitting","waiting_next_loop","timer-only"]);return(n.tradePlans||[]).some(t=>{const a=String(t.status||"").toLowerCase();return a==="launch_watch"?!0:a!=="watching"?!1:Number(t.activeWallets||0)>0?!0:(t.wallets||[]).some(r=>e.has(String(r.status||r.exitStatus||"").toLowerCase()))})}function ky(){return!!(wd()&&Ji()&&!qr)}function Ps(){Ji()&&(n.automationDelegationStatus=n.automationDelegationStatus||"Server TP/SL worker is monitoring active plans."),$y()}let Cs="";function $y(){const t=(Array.isArray(n.tradePlans)?n.tradePlans:[]).filter(l=>["watching","active","armed","pending"].includes(String(l.status||"").toLowerCase()));if(!t.length){Cs="";return}const a=Date.now(),r=t.filter(l=>l.automationPermissionExpiresAt&&!l.automationPermissionActive),s=t.filter(l=>{if(!l.automationPermissionActive)return!1;const d=Date.parse(l.automationPermissionExpiresAt||"");return Number.isFinite(d)&&d>a&&d-a<3600*1e3});let o="";if(r.length)o=`TP/SL permission EXPIRED with ${r.length} armed plan(s) unprotected. Tap "Re-enable TP/SL" in the top bar or your stops will not fire.`;else if(s.length){const l=Math.min(...s.map(u=>Date.parse(u.automationPermissionExpiresAt)));o=`TP/SL permission expires in ~${Math.max(1,Math.round((l-a)/6e4))} min with ${s.length} armed plan(s). Re-enable TP/SL to keep your stops live.`}const c=o?`${r.length}:${s.length}`:"";o&&c!==Cs?(Cs=c,T(o)):o||(Cs="")}function Ty(){Rn.forEach(e=>window.clearTimeout(e)),Rn=[]}function Ls(){Ty(),n.automationDelegationStatus="Server TP/SL worker armed. Monitoring continues even if this browser closes.",Rn=[750,2e3,5e3,1e4,2e4,3e4,45e3,6e4,9e4].map(t=>{const a=window.setTimeout(()=>{Rn=Rn.filter(r=>r!==a),!(!n.user||!n.token||!Ji())&&Xi({silent:!0,refreshWallet:!1,reason:"auto-exit-watch"}).catch(r=>{n.automationDelegationStatus=r.message})},t);return a})}async function Ay(){const e=m("[data-restore-text]"),t=m("[data-restore-status]");if(!e||!t)return;const a=e.value.trim();if(!a){S(t,"Choose a backup file or paste backup text first.");return}S(t,"Restoring wallets...");try{await J(t,"Creating secure web profile for restored wallets...");const r=await k("/api/web/wallets/restore",{method:"POST",body:JSON.stringify({backupText:a})});n.restoreResult=r.restore,r.restore?.downloads&&(n.downloads=r.restore.downloads,r.restore.downloads.encryptedBackup&&be(r.restore.downloads.encryptedBackup.filename,r.restore.downloads.encryptedBackup.text),r.restore.downloads.recoveryKeys&&be(r.restore.downloads.recoveryKeys.filename,r.restore.downloads.recoveryKeys.text)),e.value="",S(t,r.restore?.message||"Restore complete."),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(r){S(t,r.message)}}async function Py(){const e=m("[data-export-status]");if(e){S(e,"Building backup files...");try{await J(e,"Opening secure web profile...");const t=await k("/api/web/wallets/export",{method:"POST",body:JSON.stringify({})});n.backupResult=t.backup,t.backup?.downloads&&(n.downloads=t.backup.downloads,t.backup.downloads.encryptedBackup&&be(t.backup.downloads.encryptedBackup.filename,t.backup.downloads.encryptedBackup.text),t.backup.downloads.recoveryKeys&&be(t.backup.downloads.recoveryKeys.filename,t.backup.downloads.recoveryKeys.text)),S(e,t.backup?.message||"Backup ready."),h()}catch(t){S(e,t.message)}}}async function Cy(){const e=m("[data-import-label]"),t=m("[data-import-secret]"),a=m("[data-import-status]");if(!e||!t||!a)return;const r=e.value.trim()||"Imported Wallet",s=t.value.trim();if(!s){S(a,"Paste a private key or JSON secret-key array first.");return}S(a,"Importing wallet...");try{await J(a,"Creating secure web profile for imported wallet...");const o=await k("/api/web/wallets/import",{method:"POST",body:JSON.stringify({label:r,secret:s})});n.importResult=o.imported,o.imported?.downloads&&(n.downloads=o.imported.downloads,o.imported.downloads.encryptedBackup&&be(o.imported.downloads.encryptedBackup.filename,o.imported.downloads.encryptedBackup.text),o.imported.downloads.recoveryKeys&&be(o.imported.downloads.recoveryKeys.filename,o.imported.downloads.recoveryKeys.text)),t.value="",S(a,o.imported?.message||"Import complete."),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(o){S(a,o.message)}}async function Ly(e,t="this wallet",a=""){const r=String(t||`Wallet ${e}`);if(!await Me({title:"Remove Wallet",lines:[`Remove ${r} from this web account?`,"A backup file and recovery key file will download first. This does not move any SOL or tokens."],confirmLabel:"Back Up & Remove",danger:!0})||!await Me({title:"Final Confirmation",lines:[`Remove ${r} from the saved wallet list?`,"You can restore it later only from the backup/recovery file."],confirmLabel:"Remove Wallet",danger:!0}))return;const c=m("[data-wallet-remove-status]");n.walletRemoveStatus=`Backing up ${r} before removal...`,S(c,n.walletRemoveStatus),T("");try{const l=await k("/api/web/wallets/remove",{method:"POST",body:JSON.stringify(a?{publicKeys:[a]}:{walletIndexes:[String(e)]})}),d=l.removed||{};n.downloads=d.downloads||n.downloads,d.downloads?.encryptedBackup?.text&&be(d.downloads.encryptedBackup.filename,d.downloads.encryptedBackup.text),d.downloads?.recoveryKeys?.text&&be(d.downloads.recoveryKeys.filename,d.downloads.recoveryKeys.text),n.walletRemoveStatus=d.message||`Removed ${r}.`,Array.isArray(d.wallets)&&(n.wallets=d.wallets),V(Be(l.plan),"wallet-remove"),n.activeTab="wallets",h()}catch(l){n.walletRemoveStatus=l.message,S(c,l.message),T(l.message)}}function xy(){const e=String(m("[data-wallet-sweep-indexes]")?.value||"all").trim()||"all";return{walletIndexes:e.toLowerCase()==="all"?"all":e.split(/[,\s]+/).map(a=>a.trim()).filter(Boolean),walletGroup:String(m("[data-wallet-sweep-group]")?.value||"").trim(),destination:String(m("[data-wallet-sweep-destination]")?.value||"").trim(),tokenMint:String(m("[data-wallet-sweep-token]")?.value||"").trim(),slippageBps:String(m("[data-wallet-sweep-slippage]")?.value||"1500").trim()}}function My(){const e=String(m("[data-wallet-send-from]")?.value||"1").trim(),t=String(m("[data-wallet-send-managed-targets]")?.value||"").trim(),a=String(m("[data-wallet-send-group]")?.value||"").trim().toLowerCase(),r=String(m("[data-wallet-send-destinations]")?.value||"").trim(),s=t.toLowerCase()==="all"?n.wallets.map(d=>Number(d.index)).filter(d=>Number.isFinite(d)&&String(d)!==e):t.split(/[,\s]+/).map(d=>Number.parseInt(d,10)).filter(d=>Number.isInteger(d)&&d>0&&String(d)!==e),o=a?n.wallets.filter(d=>{const u=String(d.label||"").toLowerCase();return u===a||u.startsWith(`${a} `)}).map(d=>Number(d.index)).filter(d=>Number.isFinite(d)&&String(d)!==e):[],c=[...new Set([...s,...o])].map(d=>n.wallets.find(u=>Number(u.index)===d)?.publicKey).filter(Boolean),l=[r,c.join(`
`)].filter(Boolean).join(`
`);return{fromWalletIndex:e,amountSol:String(m("[data-wallet-send-amount]")?.value||"").trim(),splitAll:!!m("[data-wallet-send-all]")?.checked,destinations:l}}function By(e){if(!e)return"Action complete.";const t=[e.summary||"Action complete."];if(Array.isArray(e.rows)){const a=e.rows.slice(0,6).map(r=>{const s=r.walletLabel||`Wallet ${r.walletIndex||"?"}`,o=r.ok?"ok":"failed";return`${s}: ${o} - ${r.message||r.signature||"done"}`});t.push(...a),e.rows.length>a.length&&t.push(`...${e.rows.length-a.length} more wallet(s).`)}return e.signature&&t.push(`Tx: ${e.signature}`),t.join(`
`)}async function Ry(e){const t=m("[data-wallet-sweep-status]");n.walletSweepStatus="Running wallet action...",S(t,n.walletSweepStatus),T("");try{await J(t,"Opening secure web profile...");const r={"sweep-sol":"/api/web/wallets/sweep-sol","sweep-tokens":"/api/web/wallets/sweep-tokens","sell-all":"/api/web/wallets/sell-all-tokens","sell-all-sweep":"/api/web/wallets/sell-all-tokens","send-sol-many":"/api/web/wallets/send-sol"}[e];if(!r)throw new Error("Unknown wallet action.");const s=e==="send-sol-many"?My():xy();if(e==="sell-all"&&(s.destination=""),e==="sell-all-sweep"&&!s.destination)throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");const o=await k(r,{method:"POST",body:JSON.stringify(s),timeoutMs:ae});n.walletSweepStatus=By(o.sweep),S(t,n.walletSweepStatus),await He({force:!0,deep:!0}),n.activeTab="wallets",h()}catch(a){n.walletSweepStatus=a.message,S(t,a.message),T(a.message)}}async function Iy(e){const t=m("[data-restore-status]"),a=m("[data-restore-text]"),r=e?.files?.[0];if(!(!r||!a)){S(t,"Reading backup file...");try{a.value=await r.text(),S(t,"Backup loaded. Tap Restore Wallets.")}catch(s){S(t,`Could not read file: ${s.message}`)}}}function be(e,t){const a=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(a),s=document.createElement("a");s.href=r,s.download=e,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Oy(){const e=m("[data-x-handle]"),t=m("[data-x-status]"),a=et(e?.value||"");if(!a){S(t,"Enter a valid X handle first.");return}const r=window.open(Wi(a),"_blank","noopener,noreferrer");try{S(t,r?`Opening X and saving @${a}...`:`Saving @${a}. Allow popups if X did not open.`),await J(t,"Creating secure web profile for X sharing...");const s=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({xHandle:a})});he(s.user||{...n.user,xHandle:s.profile?.xHandle||a}),ec(n.xHandle),S(t,`Connected @${n.xHandle}. Share buttons now open X posts with SlimeWire tagged.`),h()}catch(s){S(t,s.message),T(s.message)}}function Ey(){const e=m("[data-x-status]"),t=et(m("[data-x-handle]")?.value||n.xHandle||""),a=Wi(t||n.xHandle);window.open(a,"_blank","noopener,noreferrer"),S(e,t?`Opened X for @${t}. Tap Connect X after checking the handle.`:"Opened X login. Add your handle here after signing in.")}async function Fy(){const e=m("[data-x-status]"),t=m("[data-x-handle]");try{if(!n.user||!n.token){n.xHandle="",t&&(t.value=""),Fo(),S(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h();return}const a=await k("/api/web/profile/x",{method:"POST",body:JSON.stringify({clear:!0})});he(a.user||{...n.user,xHandle:""}),n.xHandle="",t&&(t.value=""),Fo(),S(e,"X unlinked. Enter a new handle any time and tap Save X Handle."),h()}catch(a){S(e,a.message),T(a.message)}}async function xs(e,t="Saving PFP..."){const a=m("[data-avatar-status]");S(a,t);try{await J(a,"Creating secure web profile for PFP...");const r=await k("/api/web/profile/avatar",{method:"POST",body:JSON.stringify(e)});he(r.user||{...n.user,avatar:r.profile?.avatarDataUrl||r.profile?.avatarUrl||"",avatarSource:r.profile?.avatarSource||"",avatarUpdatedAt:r.profile?.avatarUpdatedAt||""}),S(a,n.user.avatar?"PFP saved.":"PFP removed."),h()}catch(r){S(a,r.message),T(r.message)}}async function Wy(e){const t=m("[data-avatar-status]"),a=e?.files?.[0];if(a){if(!/^image\/(png|jpe?g|webp)$/i.test(a.type)){S(t,"Use a PNG, JPG, or WebP image.");return}if(a.size>5*1024*1024){S(t,"Use an image under 5 MB.");return}try{S(t,"Compressing PFP...");const r=await Cu(a);await xs({avatarDataUrl:r},"Saving compressed PFP...")}catch(r){S(t,r.message),T(r.message)}finally{e.value=""}}}function Cu(e){return new Promise((t,a)=>{const r=new FileReader;r.onerror=()=>a(new Error("Could not read that image.")),r.onload=()=>{const s=new Image;s.onerror=()=>a(new Error("Could not load that image.")),s.onload=()=>{const c=document.createElement("canvas");c.width=256,c.height=256;const l=c.getContext("2d");if(!l){a(new Error("This browser cannot resize images."));return}const d=Math.max(256/s.width,256/s.height),u=Math.round(s.width*d),p=Math.round(s.height*d),f=Math.round((256-u)/2),y=Math.round((256-p)/2);l.clearRect(0,0,256,256),l.drawImage(s,f,y,u,p);const b=c.toDataURL("image/jpeg",.84);if(b.length>22e4){a(new Error("Compressed PFP is still too large. Try a simpler image."));return}t(b)},s.src=String(r.result||"")},r.readAsDataURL(e)})}async function _y(e){const t=document.querySelector('script[src*="app.js"]')?.src||document.baseURI||window.location.href,a=new URL(String(e||""),t).toString(),r=await fetch(a,{cache:"force-cache"});if(!r.ok)throw new Error("Could not load that preset PFP.");const s=await r.blob();return Cu(s)}async function Ny(){const e=Fi(n.xHandle);if(!e){const t=m("[data-avatar-status]");S(t,"Connect an X handle first.");return}await xs({avatarUrl:e,avatarSource:"x"},"Saving X PFP...")}async function Lu(e,t={}){const a=Dn(),r=ge(e);if(!r){if(await Ic(e,t)||Oc(e))return;const s=kc(e);oe(s),Ft(e,new Error(s),{action:"provider_missing",platform:Ge()?"mobile":"desktop"});return}try{const s=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(s){if(!(t.confirmSwitch===!1?!0:await Me({title:"Reconnect or Switch Wallet",lines:[`Current wallet: ${w(s)}`,"Your wallet extension will open so you can approve the wallet to use on Live Terminal."],confirmLabel:"Open Wallet"}))){oe("Wallet connection unchanged."),Pe("/terminal","terminal");return}try{await Promise.resolve(r.disconnect?.())}catch{}}oe(`Opening ${_e(e,r)}...`);const c=(await r.connect?.({onlyIfTrusted:!1}))?.publicKey||r.publicKey,l=c?.toBase58?.()||c?.toString?.()||"";if(!l)throw new Error("Wallet connected, but no public address was returned.");await J(a,"Creating secure web profile for connected wallet...");const d=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({publicKey:l,provider:_e(e,r)})});he(d.user||{...n.user,connectedWallet:d.profile?.connectedWallet||null}),n.connectedWalletBalance={publicKey:l,shortPublicKey:w(l),provider:_e(e,r),tokens:[]},Ai(`connected:${l}`),n.walletConnectMenuOpen=!1,oe(`Connected ${w(l)}. Opening Live Terminal...`),Pe(t.returnPath||n.walletConnectReturnPath||"/terminal","terminal"),h({force:!0}),Sd("browser-wallet-connect"),Yr("browser-wallet-connect")}catch(s){const o=s.message||"Wallet connection was cancelled.";oe(o),Ft(e,s,{action:"connect_failed"})}}async function xu(){await cu("disconnecting");const e=Dn(),t=n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"";if(!n.user||!n.token){n.connectedWalletBalance=null,Ai(t?`connected:${t}`:""),oe("Connected wallet disconnected."),h({force:!0});return}try{const a=n.user?.connectedWallet?.provider||"";await(a.toLowerCase().includes("phantom")?ge("phantom"):a.toLowerCase().includes("solflare")?ge("solflare"):a.toLowerCase().includes("backpack")?ge("backpack"):ge("solana"))?.disconnect?.()}catch{}try{const a=await k("/api/web/profile/connected-wallet",{method:"POST",body:JSON.stringify({clear:!0})});he(a.user||{...n.user,connectedWallet:null}),n.connectedWalletBalance=null,Ai(t?`connected:${t}`:""),oe("Connected wallet disconnected."),h({force:!0})}catch(a){oe(a.message),T(a.message)}}async function Dy(){const e=m("[data-profile-username]"),t=m("[data-profile-password]"),a=m("[data-login-security-status]"),r=String(e?.value||"").trim(),s=String(t?.value||"");if(!r||!s){S(a,"Enter a username and password first.");return}try{await J(a,"Creating secure web profile..."),S(a,"Saving login...");const o=await k("/api/web/profile/credentials",{method:"POST",body:JSON.stringify({username:r,password:s})});he(o.user||{...n.user,username:r,hasPasswordLogin:!0}),t&&(t.value=""),S(a,"Saved. You can now log back in with this username and password."),h()}catch(o){S(a,o.message),T(o.message)}}function et(e){return String(e||"").trim().replace(/^@+/,"").replace(/[^a-z0-9_]/gi,"").slice(0,15)}function Yi(e){const t=Ri(e),a=String(n.user?.referralLink||"").trim(),r=a&&!t.includes("/r/")?a:Bt,s=`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(r)}`;window.open(s,"_blank","noopener,noreferrer")}function Mu(e){const t=e==="kol",a=m(t?"[data-share-watch-kol]":"[data-share-watch-token]"),r=m("[data-share-watch-status]"),s=a?.value?.trim()||"";if(!s){S(r,t?"Enter a KOL handle or wallet first.":"Enter a coin, ticker, or CA first.");return}Yi(t?Wd(s):Ii(s)),S(r,t?"KOL watch post opened in X.":"Coin watch post opened in X.")}async function Bu(e){const t={};n.token&&(t.Authorization=`Bearer ${n.token}`);const a=await Wn(Ga(`/api/web/pnl/card?tokenMint=${encodeURIComponent(e)}`),{headers:t,cache:"no-store"},3e4);if(!a.ok){const r=await Sc(a);throw new Error(r.message||r.error||`Could not build PnL card (${a.status}).`)}return{blob:await a.blob(),filename:a.headers.get("x-ogre-filename")||`pnl-card-${w(e)}.png`}}async function Ru(e){const{blob:t,filename:a}=await Bu(e),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e4)}async function Uy(e,t){try{const{blob:a,filename:r}=await Bu(e),s=new File([a],r,{type:"image/png"});if(navigator.canShare?.({files:[s]})){await navigator.share({title:"SlimeWire PnL Card",text:Ri(t),url:Bt,files:[s]});return}await Ru(e),Yi(`${t} PnL card downloaded and ready to attach.`)}catch(a){T(a.message)}}function Iu(e="buy"){const t=m("[data-trade-wallet]")?.value||"",a=Ah(e)||m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-slippage]","[data-trade-slippage-custom]","400");if(!t)throw new Error("Choose a wallet first.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,e==="sell"?(n.tradeSwapFrom=a,n.tradeSwapTo="SOL"):(n.tradeSwapFrom="SOL",n.tradeSwapTo=a),{walletIndex:t,tokenMint:a,slippageBps:r}}function pe(e=""){return String(e||"").trim().toLowerCase()==="connected"}function qy(e={}){if(!e?.sessionWallet||e.sessionStatus!=="funded")return!1;const t=Date.parse(e.sessionExpiresAt||"");return!Number.isFinite(t)||t>Date.now()}function Ou(){const e=Array.isArray(n.wallets)?n.wallets:[];for(let t=e.length-1;t>=0;t-=1)if(qy(e[t]))return e[t];return null}function Eu(e=ue()){if(!e?.publicKey)return!1;const t=lr(e),a=ge(t)||ge("solana");return!!(a&&typeof a.signTransaction=="function")}function Ms(e=ue()){const t=e?.provider||_e(lr(e));return`${t} is connected, but this mobile browser cannot sign trades after the wallet-app handoff. Open SlimeWire inside the ${t} in-app browser, or fund a Session Wallet once so buys, sells, TP/SL, and Ogre A.I. can run without reconnect loops.`}function Bs(e={},{side:t="trade",statusWriter:a=ye,allowSessionFallback:r=!0}={}){if(!pe(e.walletIndex))return{form:e,sessionWallet:null};if(Eu())return{form:e,sessionWallet:null};const s=r?Ou():null;if(s?.index){const o=`Using Session Wallet ${s.index} for ${t}; mobile wallet signing is not available in this browser.`;return typeof a=="function"&&a(o),{form:{...e,walletIndex:String(s.index)},sessionWallet:s}}throw new Error(Ms())}function Fu(e){const t=[];for(let r=0;r<e.length;r+=32768)t.push(String.fromCharCode(...e.subarray(r,r+32768)));return btoa(t.join(""))}function Wu(e=""){const t=atob(String(e||"")),a=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)a[r]=t.charCodeAt(r);return a}function lr(e=ue()){const t=String(e?.provider||"").trim().toLowerCase();return t.includes("phantom")?"phantom":t.includes("solflare")?"solflare":t.includes("backpack")?"backpack":"solana"}async function Hy(e=ue(),{returnPath:t=Ja()||"/terminal/trade"}={}){const a=lr(e),r=e?.provider||_e(a);if(ma({returnPath:t}),Ge()&&e?.publicKey&&!ge(a)){const o=Ms(e);return oe(o),o}if(Rc(a)){const o=`${r} needs to reconnect before it can sign here. Opening ${r} mobile connect now.`;if(oe(o),await Ic(a,{returnPath:t}).catch(()=>!1))return o}if(Oc(a))return`Opening ${r}. Use the wallet browser to reconnect and approve the trade.`;const s=kc(a);return oe(s),s}async function _u(){const e=ue();if(!e?.publicKey)throw new Error("Connect Phantom, Solflare, or another wallet before trading.");const t=lr(e),a=ge(t)||ge("solana");if(!a){if(Ge()&&e?.publicKey)throw new Error(Ms(e));const o=await Hy(e,{returnPath:Ja()||"/terminal/trade"});throw new Error(o)}if(typeof a.signTransaction!="function")throw Ge()&&e?.publicKey?new Error(Ms(e)):new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const r=()=>a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"";let s=r();if(s!==e.publicKey)try{const o=await a.connect?.({onlyIfTrusted:!0});s=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r()}catch{}if(s!==e.publicKey){const o=await a.connect?.({onlyIfTrusted:!1}),c=o?.publicKey?.toBase58?.()||o?.publicKey?.toString?.()||r();if(c!==e.publicKey)throw new Error(`Wallet mismatch. SlimeWire has ${w(e.publicKey)} connected, but the browser returned ${w(c)}. Reconnect the wallet you want to trade with.`)}return{provider:a,connected:e}}async function Ky(){try{if(Ge())return;const e=ue();if(!e?.publicKey)return;const t=lr(e),a=ge(t)||ge("solana");if(!a||typeof a.connect!="function"||(a.publicKey?.toBase58?.()||a.publicKey?.toString?.()||"")===e.publicKey)return;await a.connect({onlyIfTrusted:!0}).catch(()=>{})}catch{}}const Vy=6e4;async function Nu(e,t,a=Vy){let r=0;const s=new Promise((o,c)=>{r=window.setTimeout(()=>{c(new Error("Wallet approval timed out. Reopen your wallet and try the trade again."))},a)});try{return await Promise.race([Promise.resolve(e.signTransaction(t)),s])}finally{window.clearTimeout(r)}}async function zy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");if(!window.solanaWeb3?.VersionedTransaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.VersionedTransaction.deserialize(Wu(e)),r=await Nu(t,a);return Fu(r.serialize())}async function jy(e,t){if(!e||typeof e!="string")throw new Error("SlimeWire could not build a wallet approval transaction. Try again.");if(!window.solanaWeb3?.Transaction)throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");if(typeof t.signTransaction!="function")throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");const a=window.solanaWeb3.Transaction.from(Wu(e)),r=await Nu(t,a);return Fu(r.serialize())}function Gy({side:e,connected:t,form:a={},actionDetail:r="",amountSol:s="",amountMode:o="",percent:c=""}={}){const l=e==="sell"?"Sell":"Buy",d=`${t?.provider||"Connected wallet"} ${t?.publicKey?w(t.publicKey):""}`.trim(),u=e==="sell"?`${c||r||"100"}%`:o==="max"?"Max SOL":`${s||r||"custom"} SOL`;return Me({title:`Confirm ${l}`,lines:[`${l} with ${d}?`,`Token: ${a.tokenMint||""}`,`Amount: ${u}`,"Next step: approve the transaction in your wallet."],confirmLabel:l})}async function cr({side:e,form:t,actionDetail:a,amountSol:r="",amountMode:s="",percent:o="",attemptId:c,statusWriter:l=ye}){const d=typeof l=="function"?l:ye,{provider:u,connected:p}=await _u();if(!n.walletFastApprovalsEnabled&&!await Gy({side:e,connected:p,form:t,actionDetail:a,amountSol:r,amountMode:s,percent:o}))throw new Error("Connected-wallet trade cancelled.");$m(`${e==="buy"?"Buy":"Sell"} ${w(t.tokenMint||"")}`),Ie("submitted","pending"),d(n.walletFastApprovalsEnabled?`Building ${e} approval for ${p.provider||"your wallet"}...`:`Preparing ${e} approval...`);const f=await k("/api/web/browser-trade/order",{method:"POST",body:JSON.stringify({side:e,tokenMint:t.tokenMint,walletPublicKey:p.publicKey,slippageBps:t.slippageBps,amountSol:r,amountMode:s,percent:o,tradeAttemptId:c}),dedupe:!1,timeoutMs:ae});Ie("submitted","ok"),Ie("approved","pending",`Approve in ${p.provider||"your wallet"}`),d(`Approve ${e} in ${p.provider||"your wallet"}...`);let y;try{y=await zy(f.order?.transaction,u)}catch(v){throw Ie("approved","fail",N(v?.message||"Wallet approval was declined.")),v}Ie("approved","ok"),Ie("sent","pending"),d("Submitting signed trade...");let b;try{b=await k("/api/web/browser-trade/execute",{method:"POST",body:JSON.stringify({browserTradeAttemptId:f.order?.browserTradeAttemptId,signedTransaction:y}),dedupe:!1,timeoutMs:ae})}catch(v){throw z(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"error",error:N(v?.message||"Trade submit failed.")}),V("",`browser-${e}-error`,{tradeAttemptId:c}),Ie("sent","fail",N(v?.message||"Submit failed - it may still have landed; positions are being re-checked.")),d(`${e==="buy"?"Buy":"Sell"} submit failed or timed out - re-checking your wallet in case the trade landed...`),v}return Ie("sent","ok"),Ie("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),n.tradeResult=b.trade,d(b.trade?.message||`${e==="buy"?"Buy":"Sell"} submitted from connected wallet.`),z(e==="buy"?"trade-buy":"trade-sell",t.tokenMint,a,{state:"submitted",signature:b.trade?.signature||""}),V(b.trade?.signature,`browser-${e}`,{tradeAttemptId:c}),b.trade}function Ke(e){const t=String(e||"").trim().toLowerCase();return!!t&&!["0","off","none","no","disabled"].includes(t)}function pn(e,t){const a=String(t||"").trim().toLowerCase();return["0","off","none","no","disabled"].includes(a)?{sellDelay:"off",sellPercent:"100"}:{sellDelay:e,sellPercent:t}}function Xy(){const e=x("[data-trade-auto-tp]","[data-trade-auto-tp-custom]","25"),t=x("[data-trade-auto-sl]","[data-trade-auto-sl-custom]","8");let a=x("[data-trade-auto-delay]","[data-trade-auto-delay-custom]","off"),r=x("[data-trade-auto-sell-percent]","[data-trade-auto-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=pn(a,r),{enabled:Ke(e)||Ke(t)||Ke(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function Du(){const e=x("[data-chart-buy-tp]","[data-chart-buy-tp-custom]","25"),t=x("[data-chart-buy-sl]","[data-chart-buy-sl-custom]","8");let a=x("[data-chart-buy-delay]","[data-chart-buy-delay-custom]","off"),r=x("[data-chart-buy-sell-percent]","[data-chart-buy-sell-percent-custom]","100");return{sellDelay:a,sellPercent:r}=pn(a,r),{enabled:Ke(e)||Ke(t)||Ke(a),takeProfitPct:e,stopLossPct:t,sellDelay:a,sellPercent:r}}function ye(e){const t=m("[data-trade-status]");S(t,e)}function Ne(e=""){n.chartTradeStatus=String(e||""),S(m("[data-chart-trade-status]"),n.chartTradeStatus)}function Qi(e="",t=""){n.quickBuyModal={...n.quickBuyModal,status:String(e||""),error:String(t||"")};const a=m("[data-quick-buy-modal-status]"),r=m("[data-quick-buy-modal-error]");S(a,n.quickBuyModal.status),S(r,n.quickBuyModal.error),a&&(a.hidden=!n.quickBuyModal.status),r&&(r.hidden=!n.quickBuyModal.error)}async function Rs(e,t="fixed"){const a=L();let r=t==="max"?"max":String(e||"custom"),s="";try{let o=Iu("buy");r=t==="max"?"max":String(e||"custom");const c=st("trade-buy",o.tokenMint,r);if(c){se("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`trade-buy:${w(o.tokenMint)}:${r}`});return}s=vt("trade-buy");const l={tokenMint:o.tokenMint,walletIndex:o.walletIndex,slippageBps:o.slippageBps,tradeAttemptId:s},d=Gu();if((Ke(d.takeProfitPct)||Ke(d.stopLossPct)||Ke(d.sellDelay))&&Object.assign(l,{autoExit:!0,...d}),t==="max")l.amountMode="max";else{const v=Number(e);if(!Number.isFinite(v)||v<=0)throw new Error("Enter a buy amount greater than zero.");l.amountSol=String(v)}if(o=Bs(o,{side:"buy",statusWriter:ye}).form,l.walletIndex=o.walletIndex,pe(o.walletIndex)){z("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"browser-trade-click-to-ui",durationMs:L()-a,requestId:s,details:`browser-buy:${w(o.tokenMint)}:${r}`}),ye("Building wallet-approved buy..."),de(),await cr({side:"buy",form:o,actionDetail:r,amountSol:l.amountSol||"",amountMode:l.amountMode||"fixed",attemptId:s}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-buy",o.tokenMint,r,3e3);return}const f=Xy();f.enabled&&Object.assign(l,{autoExit:!0,takeProfitPct:f.takeProfitPct,stopLossPct:f.stopLossPct,sellDelay:f.sellDelay,sellPercent:f.sellPercent}),z("trade-buy",o.tokenMint,r,{state:"clicked",tradeAttemptId:s,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-a,requestId:s,details:`trade-buy:${w(o.tokenMint)}:${r}`}),h(),ye(f.enabled?"Sending buy and arming auto-exit...":"Sending buy..."),await xe(20);const y=L();z("trade-buy",o.tokenMint,r,{state:"submitting"});const b=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...l,clientClickToUiMs:Math.round(y-a)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-y,requestId:s,resultCount:b.trade?.signature?1:0,details:"trade-buy"}),n.tradeResult=b.trade,$m(`Buy ${w(o.tokenMint||"")}`),Ie("submitted","ok"),Ie("sent","ok"),Ie("confirmed",b.trade?.signature?"ok":"pending",b.trade?.signature?`tx ${String(b.trade.signature).slice(0,8)}...`:""),b.trade?.autoExitPlan?(Ie("armed","ok"),n.tradePlanResult=b.trade.autoExitPlan,ye(b.trade.autoExitPlan.shortMessage||"Buy landed and auto-exit is armed."),Ls()):b.trade?.autoExitRequested&&(Ie("armed","fail","Auto-exit was NOT armed - exit manually or create a managed plan."),ye("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.")),z("trade-buy",o.tokenMint,r,{state:"submitted",signature:b.trade?.signature||""}),V(b.trade?.signature,"trade-buy",{tradeAttemptId:s}),n.activeTab="trade",h(),Le("trade-buy",o.tokenMint,r,3e3)}catch(o){s&&(z("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,{state:"error",error:N(o.message||"Buy failed")}),Le("trade-buy",n.tradeToken||m("[data-trade-token]")?.value||"",r,4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-a,requestId:s,errorCode:o?.code||o?.name||"TRADE_BUY_FAILED",details:N(o.message||"Buy failed")}),ye(o.message)}}async function Zi(e){const t=L(),a=vt("manual-sell");let r=null,s=String(e||"custom");try{r=Iu("sell");const o=Number.parseInt(e,10);if(s=String(o||s),!Number.isInteger(o)||o<1||o>100)throw new Error("Sell percent must be from 1 to 100.");const c=st("trade-sell",r.tokenMint,s);if(c){se("buttonDoubleClickPrevented"),W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-t,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`${w(r.tokenMint)}:${o}`});return}if(z("trade-sell",r.tokenMint,s,{state:"clicked",tradeAttemptId:a,clickedAt:new Date().toISOString()}),ye("Sending sell..."),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-t,requestId:a,details:`${w(r.tokenMint)}:${o}`}),r=Bs(r,{side:"sell",statusWriter:ye}).form,pe(r.walletIndex)){de();const p=L();z("trade-sell",r.tokenMint,s,{state:"submitting"}),await cr({side:"sell",form:r,actionDetail:s,percent:String(o),attemptId:a}),W({component:"manual-sell",action:"browser-sell-request",durationMs:L()-p,requestId:a,resultCount:n.tradeResult?.signature?1:0,details:"browser-wallet"}),n.activeTab="trade",h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-sell",r.tokenMint,s,3e3);return}h(),await xe(20);const d=L();z("trade-sell",r.tokenMint,s,{state:"submitting"});const u=await k("/api/web/trade/sell",{method:"POST",body:JSON.stringify({tokenMint:r.tokenMint,walletIndex:r.walletIndex,slippageBps:r.slippageBps,percent:o,manualSellAttemptId:a,clientClickToUiMs:Math.round(d-t)}),timeoutMs:ae,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-d,requestId:a,resultCount:u.trade?.signature?1:0,details:"single-wallet"}),n.tradeResult=u.trade,ye(u.trade?.signature?"Submitted. Refreshing position in the background...":"Sell submitted. Refreshing position in the background..."),z("trade-sell",r.tokenMint,s,{state:"submitted",signature:u.trade?.signature||""}),V(u.trade?.signature||Be(u.trade),"manual-sell-trade"),n.activeTab="trade",h(),Le("trade-sell",r.tokenMint,s,3e3)}catch(o){r?.tokenMint&&(z("trade-sell",r.tokenMint,s,{state:"error",error:N(o.message||"Sell failed")}),Le("trade-sell",r.tokenMint,s,4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-t,requestId:a,errorCode:o?.code||o?.name||"MANUAL_SELL_FAILED",details:N(o.message||"Sell failed")}),ye(o.message)}}function Jy(){const e=Ve("trade-plan"),t=m("[data-trade-plan-group]")?.value?.trim()||"",a=m("[data-trade-token]")?.value?.trim()||"",r=x("[data-trade-plan-amount]","[data-trade-plan-amount-custom]","0.1"),s=x("[data-trade-plan-tp]","[data-trade-plan-tp-custom]","25"),o=x("[data-trade-plan-sl]","[data-trade-plan-sl-custom]","8");let c=x("[data-trade-plan-delay]","[data-trade-plan-delay-custom]","5"),l=x("[data-trade-plan-sell-percent]","[data-trade-plan-sell-percent-custom]","100");({sellDelay:c,sellPercent:l}=pn(c,l));const d=x("[data-trade-plan-slippage]","[data-trade-plan-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.tradeToken=a,n.volumeToken=a,n.bundleToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:c,takeProfitPct:s,stopLossPct:o,sellPercent:l,loopCount:"1",loopDelay:"0",slippageBps:d,...ga("trade-plan")}}async function Yy(){try{const e=Jy();ye("Buying and arming managed exit...");const t=await k("/api/web/trade/plan",{method:"POST",body:JSON.stringify(e)});n.tradePlanResult=t.plan,n.tradeResult=null,V(t.trade?.signature,"trade-plan"),n.activeTab="trade",h()}catch(e){ye(e.message)}}function Qy(){const e=Ve("volume"),t=m("[data-volume-group]")?.value?.trim()||"",a=m("[data-volume-token]")?.value?.trim()||"",r=m("[data-volume-amount]")?.value||"";let s=x("[data-volume-delay]","[data-volume-delay-custom]","5");const o=x("[data-volume-tp]","[data-volume-tp-custom]","25"),c=x("[data-volume-sl]","[data-volume-sl-custom]","8"),l=x("[data-volume-loop]","[data-volume-loop-custom]","1"),d=x("[data-volume-loop-delay]","[data-volume-loop-delay-custom]","0");let u=x("[data-volume-sell-percent]","[data-volume-sell-percent-custom]","100");({sellDelay:s,sellPercent:u}=pn(s,u));const p=x("[data-volume-slippage]","[data-volume-slippage-custom]","400");if(!e.length&&!t)throw new Error("Choose at least one wallet or enter a group label.");if(!a)throw new Error("Paste a token CA first.");return n.volumeToken=a,{walletIndexes:e,walletGroup:t,tokenMint:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:d,sellPercent:u,slippageBps:p,...ga("volume")}}function Uu(e){const t=m("[data-volume-status]");S(t,e)}async function Zy(){try{const e=Qy();Uu("Buying and arming plan...");const t=await k("/api/web/volume/plan",{method:"POST",body:JSON.stringify(e)});n.volumeResult=t.plan,V(Be(t.plan),"volume-plan"),n.activeTab="volume",h()}catch(e){Uu(e.message)}}function ev(e){const t=Ve("sniper"),a=m("[data-sniper-group]")?.value?.trim()||"",r=m("[data-sniper-amount]")?.value||"",s=x("[data-sniper-delay]","[data-sniper-delay-custom]",n.scanMode==="pumpsnipe"?"3":"5"),o=x("[data-sniper-tp]","[data-sniper-tp-custom]",n.scanMode==="pumpsnipe"?"40":"25"),c=x("[data-sniper-sl]","[data-sniper-sl-custom]","8"),l=x("[data-sniper-loop]","[data-sniper-loop-custom]","1"),d=x("[data-sniper-loop-delay]","[data-sniper-loop-delay-custom]","0"),u=x("[data-sniper-slippage]","[data-sniper-slippage-custom]",n.scanMode==="pumpsnipe"?"300":"400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a token first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{mode:n.scanMode,tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,slippageBps:u,loopCount:l,loopDelay:d,...ga("sniper")}}function qu(e){const t=m("[data-sniper-status]");S(t,e)}async function tv(e){try{const t=ev(e);qu("Buying and arming exits...");const a=await k("/api/web/sniper/entry",{method:"POST",body:JSON.stringify(t)});n.sniperResult=a.plan,V(Be(a.plan),"sniper-entry"),n.activeTab="sniper",h()}catch(t){qu(t.message)}}function av(){const e=Ve("ogre-ai"),t=m("[data-ogre-ai-group]")?.value?.trim()||"",a=m("[data-ogre-ai-amount]")?.value?.trim()||"",r=ms(),s=m("[data-ogre-ai-runs]")?.value||"1",o=m("[data-ogre-ai-tp]")?.value||"25",c=m("[data-ogre-ai-tp-custom]")?.value?.trim()||"",l=m("[data-ogre-ai-sl]")?.value||"8",d=m("[data-ogre-ai-sl-custom]")?.value?.trim()||"",u=m("[data-ogre-ai-delay]")?.value||"5",p=m("[data-ogre-ai-delay-custom]")?.value?.trim()||"",f=m("[data-ogre-ai-slippage]")?.value||"400",y=m("[data-ogre-ai-slippage-custom]")?.value?.trim()||"";df({amountSol:a,runCount:s,category:r,takeProfitSelect:o,takeProfitCustom:c,stopLossSelect:l,stopLossCustom:d,delaySelect:u,delayCustom:p,slippageSelect:f,slippageCustom:y,walletGroup:t});const b=x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","60"),v=x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","100"),P=x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","40"),A=x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),g="";if(!e.length&&!t)throw new Error("Choose at least one managed wallet or enter a group label.");if(!a)throw new Error("Enter SOL per wallet for Ogre A.I.");return{walletIndexes:e,walletGroup:t,category:r,mode:r,amountSol:a,runCount:s,sellDelay:b,takeProfitPct:v,stopLossPct:P,sellPercent:"100",slippageBps:A,minScore:g,recentMints:tc()}}function Is(e){n.ogreAiStatus=e||"";const t=m("[data-ogre-ai-status]");S(t,n.ogreAiStatus)}async function nv(){if(Hr){Ua=!0,Is("Stopping the hunt after this scan...");return}const e=Symbol("ogre-ai-run");Ua=!1;try{const t=av();n.ogreAiLoading=!0,Hr=e;const a=Array.isArray(t.recentMints)?[...t.recentMints]:[];let r=null,s=!1,o=0;const c=120;for(;!s&&!Ua&&o<c&&(o+=1,Is(o===1?"Scanning fresh low-MC pairs and arming managed exits...":`Hunting fresh pairs... (scan ${o}) - tap Scan again to stop.`),h(),r=await k("/api/web/ogre-ai/start",{method:"POST",body:JSON.stringify({...t,recentMints:a}),timeoutMs:ae}),s=Number(r.ogreAi?.armedCount||0)>0||(r.ogreAi?.plans?.length||0)>0,!s);){for(const l of r.ogreAi?.errors||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);for(const l of r.ogreAi?.attemptedPicks||[])l?.tokenMint&&!a.includes(l.tokenMint)&&a.push(l.tokenMint);if(Ua)break;await xe(5e3)}n.ogreAiResult=r?.ogreAi,cf(r?.ogreAi),n.tradePlanResult=r?.ogreAi?.plans?.[0]||n.tradePlanResult,Is(s?r?.ogreAi?.message||"Ogre A.I. run armed.":Ua?"Hunt stopped. Tap Scan to hunt again.":"Still hunting - no clean fresh pair armed yet. Tap Scan to keep going."),s&&V(Be(r?.ogreAi?.plans?.[0]),"ogre-ai-run"),n.activeTab="ogreAi",h()}catch(t){Is(t.message),T(t.message)}finally{n.ogreAiLoading=!1,Ua=!1,Hr===e&&(Hr=null),h()}}function dr(e){const t=m("[data-autopilot-status]");t&&(t.textContent=String(e||""))}async function rv({silent:e=!0}={}){try{const t=await k("/api/web/ogre-ai/autopilot");n.ogreAutopilot=t.autopilot||null,n.activeTab==="ogreAi"&&h()}catch(t){e||dr(t.message)}}function sv(){return{enabled:!!m("[data-autopilot-enabled]")?.checked,category:ms(),amountSol:m("[data-ogre-ai-amount]")?.value?.trim()||(n.ogreAutopilot?.amountSol??"0.05"),takeProfitPct:x("[data-ogre-ai-tp]","[data-ogre-ai-tp-custom]","25"),stopLossPct:x("[data-ogre-ai-sl]","[data-ogre-ai-sl-custom]","8"),sellDelay:x("[data-ogre-ai-delay]","[data-ogre-ai-delay-custom]","5"),slippageBps:x("[data-ogre-ai-slippage]","[data-ogre-ai-slippage-custom]","400"),walletIndexes:Ve("ogre-ai"),walletGroup:m("[data-ogre-ai-group]")?.value?.trim()||"",maxSpendPerHourSol:m("[data-autopilot-maxspend]")?.value?.trim()||"0.3",maxConcurrent:m("[data-autopilot-maxconcurrent]")?.value?.trim()||"2",minScore:m("[data-autopilot-minscore]")?.value?.trim()||"62",intervalMinutes:m("[data-autopilot-interval]")?.value?.trim()||"10"}}async function ov(){if(n.ogreAutopilotBusy)return;const e=sv();if(e.enabled&&!e.walletIndexes.length&&!e.walletGroup){dr("Pick at least one managed wallet (or a wallet group) above before enabling autopilot.");return}if(!(e.enabled&&!await Me({title:"Enable Ogre A.I. Autopilot",lines:["This will spend REAL SOL automatically.",`Category: ${au(e.category)}`,`Up to ${e.amountSol} SOL per wallet, max ${e.maxSpendPerHourSol} SOL/hour, every ${e.intervalMinutes} min.`,`Only buys picks scoring >= ${e.minScore}, max ${e.maxConcurrent} live plans.`,"You can turn it off any time."],confirmLabel:"Enable Autopilot"}))){n.ogreAutopilotBusy=!0,dr(e.enabled?"Arming autopilot...":"Saving..."),h();try{const t=await k("/api/web/ogre-ai/autopilot",{method:"POST",body:JSON.stringify(e)});n.ogreAutopilot=t.autopilot||null,dr(n.ogreAutopilot?.lastStatus||"Saved.")}catch(t){dr(t.message),T(t.message)}finally{n.ogreAutopilotBusy=!1,h()}}}function Ht(e){const t=m("[data-kol-status]");S(t,e)}function iv(e){const t=Ve("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),d=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),u=x("[data-kol-slippage]","[data-kol-slippage-custom]","400");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!e)throw new Error("Pick a KOL signal first.");return n.tradeToken=e,n.volumeToken=e,n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:d,sellPercent:"100",slippageBps:u,...ga("kol")}}function lv(e){const t=Ve("kol"),a=m("[data-kol-group]")?.value?.trim()||"",r=m("[data-kol-amount]")?.value||"",s=x("[data-kol-delay]","[data-kol-delay-custom]","5"),o=x("[data-kol-tp]","[data-kol-tp-custom]","25"),c=x("[data-kol-sl]","[data-kol-sl-custom]","8"),l=x("[data-kol-loop]","[data-kol-loop-custom]","1"),d=x("[data-kol-loop-delay]","[data-kol-loop-delay-custom]","0"),u=x("[data-kol-slippage]","[data-kol-slippage-custom]","400"),p=String(e||n.kolWallet||m("[data-kol-wallet]")?.value||"").trim();if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");if(!p)throw new Error("Paste or choose a KOL wallet first.");if(!Dt(p))throw new Error("That KOL entry does not have a verified Solana wallet yet.");return{copyWallet:p,walletIndexes:t,walletGroup:a,amountSol:r,sellDelay:s,takeProfitPct:o,stopLossPct:c,loopCount:l,loopDelay:d,sellPercent:"100",slippageBps:u,...ga("kol")}}async function cv(e){try{const t=iv(e);Ht("Buying and arming KOL copy plan...");const a=await k("/api/web/kol/entry",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,V(Be(a.plan),"kol-copy-plan"),n.activeTab="kol",h()}catch(t){Ht(t.message)}}async function dv(e){try{const t=lv(e);Ht("Arming Copy Wallet watch...");const a=await k("/api/web/kol/copy-wallet",{method:"POST",body:JSON.stringify(t)});n.kolResult=a.plan,n.kolWallet=t.copyWallet,n.activeTab="kol",h()}catch(t){Ht(t.message)}}function Ve(e){return[...document.querySelectorAll(`[data-${e}-wallet]:checked`)].map(t=>t.value)}function Os(e){const t=m("[data-bundle-status]");S(t,e)}function Hu(){const e=m("[data-bundle-token]")?.value?.trim()||"",t=Ve("bundle"),a=m("[data-bundle-group]")?.value?.trim()||"",r=m("[data-bundle-amount]")?.value||"",s=x("[data-bundle-percent]","[data-bundle-percent-custom]","100"),o=x("[data-bundle-slippage]","[data-bundle-slippage-custom]","400");if(!e)throw new Error("Paste a token CA first.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return n.bundleToken=e,{tokenMint:e,walletIndexes:t,walletGroup:a,amountSol:r,percent:s,slippageBps:o}}function uv(){const e=Hu();let t=x("[data-bundle-plan-delay]","[data-bundle-plan-delay-custom]","5"),a=x("[data-bundle-plan-sell-percent]","[data-bundle-plan-sell-percent-custom]","100");return{sellDelay:t,sellPercent:a}=pn(t,a),{...e,sellDelay:t,takeProfitPct:x("[data-bundle-plan-tp]","[data-bundle-plan-tp-custom]","60"),stopLossPct:x("[data-bundle-plan-sl]","[data-bundle-plan-sl-custom]","10"),loopCount:x("[data-bundle-plan-loop]","[data-bundle-plan-loop-custom]","1"),loopDelay:x("[data-bundle-plan-loop-delay]","[data-bundle-plan-loop-delay-custom]","0"),sellPercent:a,...ga("bundle-plan")}}async function Ku(e){const t=L();let a=null,r="";const s=e==="buy"?"bundle-buy":"bundle-sell";try{a=Hu();const o=st(s,a.tokenMint,"bundle");if(o){se("buttonDoubleClickPrevented"),W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-t,cacheHit:!0,requestId:o.tradeAttemptId||"",details:`${s}:${w(a.tokenMint)}`});return}r=vt(s),z(s,a.tokenMint,"bundle",{state:"clicked",tradeAttemptId:r,clickedAt:new Date().toISOString()}),W({component:"post-trade",action:"trade-click-to-ui",durationMs:L()-t,requestId:r,details:`${s}:${w(a.tokenMint)}`}),h(),Os(e==="buy"?"Sending bundle buy...":"Sending bundle sell..."),await xe(20);const c=L();z(s,a.tokenMint,"bundle",{state:"submitting"});const l=await k(`/api/web/bundle/${e}`,{method:"POST",body:JSON.stringify({...a,tradeAttemptId:r,clientClickToUiMs:Math.round(c-t)}),dedupe:!1});W({component:"post-trade",action:"trade-backend-ack",durationMs:L()-c,requestId:r,resultCount:l.bundle?.successCount||0,details:s}),n.bundleResult=l.bundle,z(s,a.tokenMint,"bundle",{state:"submitted",signature:Be(l.bundle)}),V(Be(l.bundle),`bundle-${e}`,{tradeAttemptId:r}),n.activeTab="bundle",h(),Le(s,a.tokenMint,"bundle",3e3)}catch(o){a?.tokenMint&&(z(s,a.tokenMint,"bundle",{state:"error",error:N(o.message||"Bundle trade failed")}),Le(s,a.tokenMint,"bundle",4e3)),W({component:"post-trade",action:"trade-action-error",durationMs:L()-t,requestId:r,errorCode:o?.code||o?.name||"BUNDLE_TRADE_FAILED",details:N(o.message||"Bundle trade failed")}),Os(o.message)}}async function pv(){try{const e=uv();Os("Buying and arming bundle exits...");const t=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(e)});n.bundleResult=t.plan,V(Be(t.plan),"bundle-plan"),n.activeTab="bundle",h()}catch(e){Os(e.message)}}function le(e,t){return(n.presets?.[e]||[]).find(a=>a.id===t)||null}function Vu(){(n.selectedTradePresetId==="custom"||n.selectedTradePresetId&&!le("trade",n.selectedTradePresetId))&&(n.selectedTradePresetId=""),(n.selectedBundlePresetId==="custom"||n.selectedBundlePresetId&&!le("bundle",n.selectedBundlePresetId))&&(n.selectedBundlePresetId=""),n.editingTradePresetId&&!le("trade",n.editingTradePresetId)&&(n.editingTradePresetId=""),n.editingBundlePresetId&&!le("bundle",n.editingBundlePresetId)&&(n.editingBundlePresetId="")}function zu(e,t="trade",a=""){t==="bundle"?n.bundleToken=e:n.tradeToken=e,n.activeTab=t,a&&T(a),window.history.pushState({},"","/terminal"),h({force:!0})}async function ju(e=""){const t=String(e||"").trim();if(!t)return;const a=t.replace(/^\$+/,"").trim(),r=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),s=(o,c={})=>$t(ve(o,{source:"global-search",...c}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:"global-search"});if(r){s(a);return}try{const c=((await k(`/api/web/token-search?q=${encodeURIComponent(t)}`)).matches||[])[0];if(!c?.tokenMint){T(`No coin found for "${t}". Try the exact ticker or paste the contract address.`);return}s(c.tokenMint,{symbol:c.symbol,name:c.name})}catch(o){T(o.message||"Token search failed.")}}function ve(e="",t={}){const a=String(e||"").trim(),r=a?ur().find(s=>String(s?.tokenMint||"")===a):null;return{chain:"solana",tokenMint:a,tokenAddress:a,mint:a,pairAddress:r?.pairAddress||r?.pairId||t.pairAddress||"",symbol:r?.symbol||t.symbol||w(a),name:r?.name||t.name||"Token",imageUri:r?.imageUrl||t.imageUri||"",source:t.source||r?.source||r?.category||"",dex:r?.dexId||t.dex||"",pool:r?.pool||t.pool||"",pumpUrl:r?.pumpUrl||t.pumpUrl||"",isPump:!!(r?.isPump||t.isPump||a.toLowerCase().endsWith("pump")),graduated:!!(r?.graduated||r?.isGraduated||r?.bonded||r?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded),isGraduated:!!(r?.isGraduated||r?.graduated||r?.bonded||r?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded),bonded:!!(r?.bonded||r?.isBonded||r?.graduated||r?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated),isBonded:!!(r?.isBonded||r?.bonded||r?.graduated||r?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated)}}function h0(e={},t={}){return ve(e?.tokenMint||e?.mint||e?.tokenAddress||"",{...t,pairAddress:e?.pairAddress||e?.pairId||t.pairAddress||"",symbol:e?.symbol||t.symbol||"",name:e?.name||t.name||"",imageUri:e?.imageUrl||e?.imageUri||t.imageUri||"",source:t.source||e?.source||e?.category||"",dex:e?.dexId||t.dex||"",pool:e?.pool||t.pool||"",pumpUrl:e?.pumpUrl||t.pumpUrl||"",isPump:e?.isPump||t.isPump,graduated:e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||t.graduated||t.isGraduated||t.bonded||t.isBonded,isGraduated:e?.isGraduated||e?.graduated||e?.bonded||e?.isBonded||t.isGraduated||t.graduated||t.bonded||t.isBonded,bonded:e?.bonded||e?.isBonded||e?.graduated||e?.isGraduated||t.bonded||t.isBonded||t.graduated||t.isGraduated,isBonded:e?.isBonded||e?.bonded||e?.graduated||e?.isGraduated||t.isBonded||t.bonded||t.graduated||t.isGraduated})}function Es(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t?(n.smartChartTokenRef={...e,tokenMint:t,tokenAddress:t,mint:t},Vs(n.smartChartTokenRef),n.terminalToken=t,n.terminalAutoToken=t,n.tradeToken=t,n.bundleToken=t,n.volumeToken=t,n.smartChartToken=t,t):""}function mv(e,t={}){const a=new URLSearchParams;a.set("token",e);const r=t.defaultTab==="sell"?"sell":t.defaultTab==="chart"?"chart":"buy";return a.set("tab",r),["chart","chartTxns","txns","info"].includes(t.view)&&a.set("view",t.view),t.focusAmountInput&&a.set("focusAmount","1"),t.source&&a.set("source",String(t.source).slice(0,40)),t.returnTo&&a.set("returnTo",t.returnTo),`/terminal/chart?${a.toString()}`}function el(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim(),a=`${e?.source||""} ${e?.category||""} ${e?.dex||""} ${e?.pool||""}`.toLowerCase(),r=!!(e?.isPump||e?.pumpUrl||t.toLowerCase().endsWith("pump")||a.includes("pump")),s=!!(e?.graduated||e?.isGraduated||e?.bonded||e?.isBonded||e?.complete||e?.completed||e?.bondingComplete||e?.raydiumPool||e?.poolAddress);return!!(r&&!s)}function fv(e={},t={}){return["chart","chartTxns","txns","info"].includes(t.view)?t.view:"chartTxns"}const Fs=new Map;function tl(e){const t=String(e||"").trim();if(!t)return;const a=Fs.get(t)||0;Date.now()-a<3e4||(Fs.set(t,Date.now()),Fs.size>200&&Fs.clear(),k(`/api/web/prebuy-warm?mint=${encodeURIComponent(t)}`,{method:"GET"}).catch(()=>{}))}function $t(e={},t={}){oa("chartRouteStart");const a=L(),r=Es(e);if(!r){T("Select a token before opening the chart.");return}cl(e,{source:t.source||"token-entry"}),tl(r),n.chartTradeTab=t.defaultTab==="sell"?"sell":(t.defaultTab==="chart","buy"),n.smartChartView=fv(n.smartChartTokenRef||e,t),n.chartFocusAmountInput=!!t.focusAmountInput,n.chartScrollIntoView=!0,n.activeTab="smartChart",n.route="terminal",n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.chartTradeStatus="",n.chartBuyWalletIndex="";const s=mv(r,{defaultTab:t.defaultTab||"buy",view:n.smartChartView,focusAmountInput:t.focusAmountInput,source:t.source||"token-entry",returnTo:t.returnTo||Ja()});window.history.pushState({},"",s),h({force:!0}),K("chart-route-open",a,{component:"smartChart",cacheHit:!!(tt(r)?.cacheHit||fr(r)?.pairAddress),details:`${r}:${t.source||"token-entry"}`})}function al(){if(!window.location.pathname.includes("/terminal/chart"))return;oa("chartRouteStart");const e=L(),t=new URLSearchParams(window.location.search||""),a=String(t.get("token")||t.get("mint")||"").trim(),r=String(n.smartChartToken||"").trim();if(a){const s=ve(a,{source:t.get("source")||"route"});Es(s),cl(s,{source:t.get("source")||"route"}),t.get("buy")==="1"&&window.setTimeout(()=>{try{mn(s,{forceModal:!0,source:"deep-link"})}catch{}},900),a!==r&&(n.chartTradeStatus="",n.chartBuyWalletIndex="")}n.chartTradeTab=t.get("tab")==="sell"?"sell":"buy",n.smartChartView=["chart","chartTxns","txns","info"].includes(t.get("view"))?t.get("view"):"chartTxns",n.chartFocusAmountInput=t.get("focusAmount")==="1",n.chartScrollIntoView=!0,n.route="terminal",n.activeTab="smartChart",K("chart-route-apply",e,{component:"smartChart",cacheHit:!!(tt(a)?.cacheHit||fr(a)?.pairAddress),details:a})}function mn(e={},t={}){const a=Es(e);if(!a){T("Select a token before quick buying.");return}const r=fn(a);if(r&&Hs(r)){T("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");return}const s=t.preset||ut(),o=s&&!t.forceModal?ze(s):"",c=s?.walletIndex||(s?.walletIndexes||[])[0]||(n.wallets[0]?.index?String(n.wallets[0].index):"");if(s&&o&&c&&!t.forceModal){Ns(a,{...s,walletIndex:c,walletIndexes:[c]});return}const l=ue();n.quickBuyModal={open:!0,tokenMint:a,amountSol:o||n.quickBuyAmountOverride||"",walletIndex:l?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):"",slippageBps:"400",status:o?`Preset ${o} SOL loaded. Confirm when ready.`:s?"Your selected preset has no SOL amount - set one here (or edit the preset in the Trade tab) and Buy becomes one-click.":"Enter a SOL amount to quick buy - or save a Trade preset and Buy becomes one-click.",source:t.source||"quick-buy",error:"",tradeAttemptId:""},tl(a),h({force:!0}),requestAnimationFrame(()=>m("[data-quick-buy-modal-amount]")?.focus())}function nl(){n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},h({force:!0})}function hv(e={},t={}){if(!D("protectedBuyEnabled",!0))return;const a=Es(e);if(!a){T("Select a token before opening Protected Buy.");return}const r=fn(a);if(r&&Hs(r)){T("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be bought from quick actions.");return}const s=$a(a)||{tokenMint:a},o=at(s),c=t.presetId||o.protectedBuyPreset||ml(o.verdict),l=Number(Y(t.amountSol||n.quickBuyAmountOverride||ze()||"0.1")),d=c==="conservative"&&Number.isFinite(l)&&l>.25?"0.25":yr(l||.1),u=ue();tl(a),n.quickBuyModal={...n.quickBuyModal,open:!1,status:"",error:""},n.protectedBuyModal={open:!0,tokenMint:a,presetId:c,amountSol:d,walletIndex:t.walletIndex||(u?.publicKey?"connected":n.wallets[0]?.index?String(n.wallets[0].index):""),slippageBps:String(t.slippageBps||"400"),riskAccepted:!1,status:o.verdict==="AVOID"?"Avoid recommended. Check the risk box if you still want to continue.":"Review this plan before wallet confirmation.",error:"",source:t.source||"protected-buy"},h({force:!0}),requestAnimationFrame(()=>m("[data-protected-buy-amount]")?.focus())}function Ws(){n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:"",riskAccepted:!1},h({force:!0})}function gv(){const e=n.protectedBuyModal||{},t=String(e.tokenMint||"").trim(),a=String(m("[data-protected-buy-preset]")?.value||e.presetId||"conservative").trim(),r=String(m("[data-protected-buy-wallet]")?.value||e.walletIndex||"").trim(),s=Y(m("[data-protected-buy-amount]")?.value||e.amountSol||""),o=String(m("[data-protected-buy-slippage]")?.value||e.slippageBps||"400").trim(),c=!!(m("[data-protected-buy-risk-accept]")?.checked||e.riskAccepted);if(!t)throw new Error("Select a token before Protected Buy.");if(!r)throw new Error("Choose a wallet before Protected Buy.");if(!s)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:t,presetId:a,walletIndex:r,amountSol:s,slippageBps:o,riskAccepted:c}}function bv(){const e=n.protectedBuyModal||{};if(!e.open)return"";const t=$a(e.tokenMint)||{tokenMint:e.tokenMint},a=at(t),r=Xs(e.presetId),s=pe(e.walletIndex),o=a.verdict==="AVOID"&&!e.riskAccepted,c=/submitting|opening wallet/i.test(String(e.status||""));return`
    <div class="quick-buy-backdrop protected-buy-backdrop" data-protected-buy-close></div>
    <section class="protected-buy-modal" role="dialog" aria-modal="true" aria-label="Protected Buy preview">
      <button type="button" class="modal-close" data-protected-buy-close aria-label="Close Protected Buy">x</button>
      <div class="protected-buy-head">
        <div>
          <span>Protected Buy</span>
          <h3>${i(t.symbol||t.shortMint||w(e.tokenMint))}</h3>
        </div>
        <strong class="slimeshield-${i(hn(a.verdict))}">${i(a.verdict||"CAUTION")}</strong>
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
          <input data-protected-buy-amount type="number" min="0" step="0.01" inputmode="decimal" value="${i(e.amountSol||"")}" placeholder="0.10">
        </label>
        <label>
          Preset
          <select data-protected-buy-preset>
            ${pl.map(l=>`<option value="${l.id}" ${l.id===r.id?"selected":""}>${i(l.label)}</option>`).join("")}
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
        <small>${i(bw(r))}</small>
        <small>Wallet: ${i(vw(e.walletIndex))}</small>
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
  `}function rl(){let e=m("[data-protected-buy-modal-root]");if(e||(e=document.createElement("div"),e.setAttribute("data-protected-buy-modal-root",""),document.body.appendChild(e)),!n.protectedBuyModal?.open||!D("protectedBuyEnabled",!0)){e.hidden=!0,e.innerHTML="",document.body.classList.remove("protected-buy-modal-open");return}e.hidden=!1,e.innerHTML=bv(),document.body.classList.add("protected-buy-modal-open")}async function yv(){try{const e=gv(),t=$a(e.tokenMint)||{tokenMint:e.tokenMint};if(at(t).verdict==="AVOID"&&!e.riskAccepted)throw new Error("SlimeShield says AVOID. Check the risk box if you still want to continue.");const r=Xs(e.presetId);if(n.protectedBuyModal={...n.protectedBuyModal,...e,status:pe(e.walletIndex)?"Opening wallet approval...":"Submitting protected buy...",error:""},rl(),pe(e.walletIndex)){const s=await _s({...e,source:`protected-buy:${r.id}`});n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),T(s?.message||"Protected Buy submitted through your wallet. Managed TP/SL was not server-armed for this connected wallet.");return}await xe(20),n.protectedBuyModal={...n.protectedBuyModal,open:!1,status:"",error:""},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await Ns(e.tokenMint,yw(e,r))}catch(e){n.protectedBuyModal={...n.protectedBuyModal||{},open:!0,status:"",error:N(e.message||"Protected Buy failed.")},h({force:!0})}}function vv(){const e=String(n.quickBuyModal?.tokenMint||"").trim(),t=String(m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"").trim(),a=Y(m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||""),r=String(m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400").trim();if(!e)throw new Error("Select a token before quick buying.");if(!t)throw new Error("Choose a wallet before quick buying.");if(!a)throw new Error("Enter a SOL amount greater than zero.");return{tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r}}function Gu(){const e=ut();return e?{takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",sellDelay:e.sellDelay||"off",sellPercent:e.sellPercent||"100"}:{}}async function _s({tokenMint:e,walletIndex:t,amountSol:a,slippageBps:r="400",source:s="quick-buy",takeProfitPct:o="",stopLossPct:c="",sellDelay:l="off",sellPercent:d="100"}){const u=Number(a);if(!Number.isFinite(u)||u<=0)throw new Error("Enter a SOL amount greater than zero.");const p=vt("quick-buy"),f=pn(l,d),y=Ke(o)||Ke(c)||Ke(f.sellDelay);let b={tokenMint:e,walletIndex:t,slippageBps:r};const v=n.quickBuyModal?.open?$=>Qi($,""):ye;if(b=Bs(b,{side:"buy",statusWriter:v}).form,t=b.walletIndex,n.quickBuyLast={source:s,tokenMint:e,walletConnected:pe(t),customAmountValid:!0,presetAmount:"",tradeAttemptId:p,status:"submitting",error:""},z("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:p,clickedAt:new Date().toISOString()}),n.quickBuyModal={...n.quickBuyModal,status:pe(t)?"Opening wallet approval...":"Submitting quick buy...",error:"",tradeAttemptId:p},pe(t)){Qi("Opening wallet approval...",""),de();const $=await cr({side:"buy",form:b,actionDetail:String(a),amountSol:String(u),amountMode:"fixed",attemptId:p,statusWriter:v});if(n.quickBuyLast={...n.quickBuyLast,status:"submitted"},y){const C="Connected wallet buy submitted. TP/SL choices were not server-armed because browser-wallet exits still require wallet approval.";n.quickBuyModal?.open?Qi(C,""):ye(C)}return $}h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),await xe(20);const A={tokenMint:e,walletIndex:t,amountSol:String(u),slippageBps:r,tradeAttemptId:p};y&&Object.assign(A,{autoExit:!0,takeProfitPct:o,stopLossPct:c,sellDelay:f.sellDelay,sellPercent:f.sellPercent});const g=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(A),dedupe:!1,timeoutMs:ae});return n.tradeResult=g.trade,g.trade?.autoExitPlan&&(n.tradePlanResult=g.trade.autoExitPlan,Ls()),V(g.trade?.signature,"quick-buy-custom",{tradeAttemptId:p}),z("trade-buy",e,String(a),{state:"submitted",signature:g.trade?.signature||""}),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},g.trade}async function wv(e=""){const t=L(),a=Y(m("[data-chart-buy-amount]")?.value||""),r=Number(a);if(!e)throw new Error("Select a token before buying.");if(!Number.isFinite(r)||r<=0)throw new Error("Enter a buy amount greater than zero.");let s=m("[data-chart-buy-wallet]")?.value||"";if(!s)throw new Error("Choose a wallet before buying.");const o=vt("chart-buy");let c={tokenMint:e,walletIndex:s,slippageBps:m("[data-chart-buy-slippage]")?.value||"400"};if(c=Bs(c,{side:"chart buy",statusWriter:Ne}).form,s=c.walletIndex,st("trade-buy",e,String(a)))return n.tradeResult;if(n.quickBuyLast={source:"chart-buy-panel",tokenMint:e,walletConnected:pe(s),customAmountValid:!0,presetAmount:"",tradeAttemptId:o,status:"submitting",error:""},z("trade-buy",e,String(a),{state:"clicked",tradeAttemptId:o,clickedAt:new Date().toISOString()}),Ne(pe(s)?"Opening wallet approval...":"Submitting Session Wallet buy..."),W({component:"post-trade",action:pe(s)?"chart-browser-buy-click":"chart-session-buy-click",durationMs:L()-t,requestId:o,details:`${pe(s)?"browser":"session"}-buy:${w(e)}:${a}`}),de(),pe(s)){const y=await cr({side:"buy",form:c,actionDetail:String(a),amountSol:String(r),amountMode:"fixed",attemptId:o,statusWriter:Ne});return n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",Ne(y?.message||"Buy submitted from connected wallet."),Le("trade-buy",e,String(a),3e3),y}const u=Du(),p={tokenMint:e,walletIndex:s,amountSol:String(r),slippageBps:c.slippageBps,tradeAttemptId:o};u.enabled&&Object.assign(p,{autoExit:!0,takeProfitPct:u.takeProfitPct,stopLossPct:u.stopLossPct,sellDelay:u.sellDelay,sellPercent:u.sellPercent}),Ne(u.enabled?"Sending buy and arming auto-exit...":"Sending buy...");const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify(p),dedupe:!1,timeoutMs:ae});return n.tradeResult=f.trade,f.trade?.autoExitPlan&&(n.tradePlanResult=f.trade.autoExitPlan,Ls()),n.quickBuyLast={...n.quickBuyLast,status:"submitted"},n.chartTradeTab="buy",z("trade-buy",e,String(a),{state:"submitted",signature:f.trade?.signature||""}),V(f.trade?.signature,"chart-session-buy",{tradeAttemptId:o}),Ne(f.trade?.autoExitPlan?.shortMessage||f.trade?.message||"Buy submitted from Session Wallet."),Le("trade-buy",e,String(a),3e3),f.trade}async function Sv(){try{const e=vv(),t=Bi(n.quickBuyModal?.error||n.quickBuyModal?.status||"");if(t)throw new Error(t);n.quickBuyModal={...n.quickBuyModal,...e,status:"Validating quick buy...",error:""};const a=await _s({...Gu(),...e,source:n.quickBuyModal?.source||"quick-buy-modal"});n.quickBuyModal={...n.quickBuyModal,open:!1,status:a?.message||"Quick buy submitted.",error:""},n.activeTab="smartChart",h({force:!0,preserveSmartChartFrame:!0}),Le("trade-buy",e.tokenMint,e.amountSol,3e3)}catch(e){const t=N(e.message||"Quick buy failed."),a=Bi(t);n.quickBuyLast={...n.quickBuyLast||{},status:"failed",error:a||t},n.quickBuyModal={...n.quickBuyModal,status:a?"Token safety blocked fast buy.":"",error:a||t},h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"})}}async function Ns(e,t=null){const a=L(),r=t||le("trade",n.selectedTradePresetId);let s="quick";if(!r){mn(ve(e,{source:"missing-preset"}),{source:"missing-preset",forceModal:!0});return}try{const o=t?Y(r.amountSol):ze(r);if(!o)throw new Error("Set a quick buy amount first.");s=String(o);const c=st("trade-buy",e,s);if(c){W({component:"post-trade",action:"trade-action-dedupe",durationMs:L()-a,cacheHit:!0,requestId:c.tradeAttemptId||"",details:`quick-preset:${w(e)}:${o}`});return}const l=vt("quick-trade");z("trade-buy",e,s,{state:"clicked",tradeAttemptId:l,clickedAt:new Date().toISOString()}),T("Quick buy queued. Checking preset wallet..."),n.tradeToken=e,h({preserveSmartChartFrame:n.activeTab==="smartChart"}),await xe(0),await J(null,"Opening secure web profile...");const d=r.walletIndex||(r.walletIndexes||[])[0]||"1";if(!n.wallets.some(y=>String(y.index)===String(d)))throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");const u={tokenMint:e,walletIndex:d,amountSol:o,slippageBps:r.slippageBps,autoExit:!0,takeProfitPct:r.takeProfitPct,stopLossPct:r.stopLossPct,sellDelay:r.sellDelay||"off",sellPercent:r.sellPercent||"100"};T(""),n.tradeToken=e,await xe(20);const p=L();z("trade-buy",e,s,{state:"submitting"});const f=await k("/api/web/trade/buy",{method:"POST",body:JSON.stringify({...u,tradeAttemptId:l,clientClickToUiMs:Math.round(p-a)}),dedupe:!1,timeoutMs:ae});n.tradeResult=f.trade,f.trade?.autoExitPlan?(n.tradePlanResult=f.trade.autoExitPlan,T(f.trade.autoExitPlan.shortMessage||"Quick buy landed and auto-exit is armed."),Ls()):f.trade?.autoExitRequested&&T("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan."),n.tradeToken=e,z("trade-buy",e,s,{state:"submitted",signature:f.trade?.signature||""}),V(f.trade?.signature,"quick-preset-trade",{tradeAttemptId:l}),h({preserveSmartChartFrame:n.activeTab==="smartChart"}),Le("trade-buy",e,s,3e3)}catch(o){e&&(z("trade-buy",e,s,{state:"error",error:N(o.message||"Quick buy failed")}),Le("trade-buy",e,s,4e3)),T(o.message)}}async function Xu(e,t=null){const a=t||le("bundle",n.selectedBundlePresetId);if(!a){zu(e,"bundle");return}if(!t){const r=(a.walletIndexes||[]).length||(a.walletGroup?"group":"saved");if(!await Me({title:"Bundle Buy",lines:[`Bundle buy ${w(e)} with preset "${a.name||"Fast Bundle"}" across ${r} wallet(s)?`,"Cancel opens the Bundle page to review first."],confirmLabel:"Buy Now",cancelLabel:"Review First"})){zu(e,"bundle");return}}try{n.bundleToken=e,T("Bundle preset queued. Checking wallets..."),h(),await xe(0),await J(null,"Opening secure web profile...");const r={tokenMint:e,walletIndexes:(a.walletIndexes||[]).filter(o=>n.wallets.some(c=>String(c.index)===String(o))),walletGroup:a.walletGroup||"",amountSol:t?Y(a.amountSol)||"0.1":gw(a),percent:"100",slippageBps:a.slippageBps,sellDelay:a.sellDelay||"off",takeProfitPct:a.takeProfitPct,stopLossPct:a.stopLossPct,sellPercent:a.sellPercent||"100",loopCount:"1",loopDelay:"0"};if(!r.walletIndexes.length&&!r.walletGroup)throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");T("");const s=await k("/api/web/bundle/plan",{method:"POST",body:JSON.stringify(r)});n.bundleResult=s.plan,n.bundleToken=e,V(Be(s.plan),"quick-preset-bundle"),n.activeTab="bundle",h()}catch(r){T(r.message)}}async function Ds(e,t="100",a={}){const r=L();let s=Number.parseInt(t,10),o="";try{if(await J(null,"Opening secure web profile..."),!e)throw new Error("Missing token mint for position exit.");if(!Number.isInteger(s)||s<1||s>100)throw new Error("Sell percent must be from 1 to 100.");const c=si(e,String(s));if(c){W({component:"manual-sell",action:"manual-sell-dedupe",durationMs:L()-r,cacheHit:!0,requestId:c.manualSellAttemptId||"",details:`${w(e)}:${s}`});return}const l=it().find(v=>String(v.tokenMint)===String(e)),d=l?.symbol||l?.name||w(e),u=!!(l?.source==="connected-wallet"||l?.viewOnly||String(l?.walletIndex||"").toLowerCase()==="connected"),p=String(ue()?.publicKey||"").trim();if(u&&p){o=vt("manual-sell"),ia(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`browser:${w(e)}:${s}`}),T(""),n.activeTab!=="smartChart"&&(n.activeTab="positions");const v=n.activeTab==="smartChart"?Ne:A=>T(A);v("Building wallet-approved sell..."),de(),ia(e,String(s),{state:"submitting"});const P=await cr({side:"sell",form:{tokenMint:e,walletIndex:"connected",slippageBps:a.slippageBps||"400"},actionDetail:`${s}%`,percent:String(s),attemptId:o,statusWriter:v});n.tradeResult=P,ia(e,String(s),{state:"submitted",signature:P?.signature||""}),V(P?.signature,"browser-manual-sell",{tradeAttemptId:o}),n.activeTab==="smartChart"?(Ne(P?.message||"Sell submitted from connected wallet."),de()):h({preserveSmartChartFrame:!1}),oi(e,String(s),3e3);return}if(!(!!a.skipConfirm||await Me({title:"Confirm Exit",lines:[`Exit ${s}% of ${d}?`,`Mint: ${e}`,"Wallets: all managed wallets holding this token","Slippage: 4%","Expected SOL, minimum output, and route details are shown before the sell is submitted."],confirmLabel:`Sell ${s}%`,danger:!0})))return;o=vt("manual-sell"),ia(e,String(s),{state:"clicked",manualSellAttemptId:o,clickedAt:new Date().toISOString()}),W({component:"manual-sell",action:"manual-sell-click-to-ui",durationMs:L()-r,requestId:o,details:`${w(e)}:${s}`}),n.activeTab="positions",T(""),h(),await xe(20);const y=L();ia(e,String(s),{state:"submitting"});const b=await k("/api/web/bundle/sell",{method:"POST",body:JSON.stringify({tokenMint:e,walletIndexes:"all",percent:s,slippageBps:"400",manualSellAttemptId:o,clientClickToUiMs:Math.round(y-r)}),timeoutMs:ae,dedupe:!1});W({component:"manual-sell",action:"manual-sell-request",durationMs:L()-y,requestId:o,resultCount:b.bundle?.successCount||0,details:b.bundle?.duplicate?"duplicate":"submitted"}),n.bundleResult=b.bundle,n.bundleToken=e,n.tradeToken=e,ia(e,String(s),{state:(b.bundle?.duplicate,"submitted"),signature:Be(b.bundle),backendMs:b.bundle?.manualSellTiming?.backendMs||null}),V(Be(b.bundle),"manual-sell-position"),n.activeTab="positions",h(),oi(e,String(s),3e3)}catch(c){e&&Number.isInteger(s)&&(ia(e,String(s),{state:"error",error:N(c.message||"Sell failed")}),oi(e,String(s),4e3)),W({component:"manual-sell",action:"manual-sell-error",durationMs:L()-r,requestId:o,errorCode:c?.code||c?.name||"MANUAL_SELL_FAILED",details:N(c.message||"Sell failed")}),T(c.message),h({preserveSmartChartFrame:n.activeTab==="smartChart"})}}function Be(e){return e?.signature?e.signature:(e?.results||[]).find(a=>a.signature)?.signature||""}async function kv(){const e=m("[data-tx-audit-signature]")?.value?.trim()||n.terminalTxSignature||"";if(!e){T("Paste a transaction signature first.");return}n.terminalTxSignature=e,n.terminalTxLoading=!0,n.terminalTxAudit=null,h();try{const t=await k(`/api/web/tx-audit?signature=${encodeURIComponent(e)}`);n.terminalTxAudit=t.audit||{error:"No audit data returned."}}catch(t){n.terminalTxAudit={error:t.message||"Transaction audit failed."},T(t.message)}finally{n.terminalTxLoading=!1,h()}}function $v(e,t="manager"){const a=t==="fast"?`fast-${e}`:e;return e==="trade"?{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Trade Preset",walletIndex:m(`[data-${a}-preset-wallet]`)?.value||"1",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"25",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"8",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}:{id:m(`[data-${a}-preset-id]`)?.value||"",name:m(`[data-${a}-preset-name]`)?.value||"Bundle Preset",walletIndexes:Ve(`${a}-preset`),walletGroup:m(`[data-${a}-preset-group]`)?.value?.trim()||"",amountSol:m(`[data-${a}-preset-amount]`)?.value||"0.1",takeProfitPct:m(`[data-${a}-preset-tp]`)?.value||"60",stopLossPct:m(`[data-${a}-preset-sl]`)?.value||"10",sellDelay:x(`[data-${a}-preset-delay]`,`[data-${a}-preset-delay-custom]`,"off"),sellPercent:m(`[data-${a}-preset-sell-percent]`)?.value||"100",slippageBps:m(`[data-${a}-preset-slippage]`)?.value||"400"}}function Tv(e,t){const a=(t||[]).find(r=>!r.readonly);a?.id&&(e==="trade"&&(n.selectedTradePresetId=a.id),e==="bundle"&&(n.selectedBundlePresetId=a.id))}function Us(e,t){const a=!!(t&&le(e,t));e==="trade"&&(n.selectedTradePresetId=a?t:""),e==="bundle"&&(n.selectedBundlePresetId=a?t:"")}function sl(e,t){e==="trade"&&(n.fastTradePresetStatus=t),e==="bundle"&&(n.fastBundlePresetStatus=t)}function Av(e,t){Us(e,t),sl(e,e==="trade"?"Trade preset selected. Tap Buy on any live row to use it.":"Bundle preset selected. It will not buy until you tap Bundle on a token row."),h({force:!0})}async function Ju(e,t="manager"){const a=m(t==="fast"?`[data-fast-${e}-preset-status]`:`[data-${e}-preset-status]`);try{await J(a,"Creating secure web profile for presets..."),S(a,"Saving preset...");const r=$v(e,t),s=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"save",preset:r})});n.presets=s.presets||n.presets,r.id&&le(e,r.id)?Us(e,r.id):Tv(e,n.presets?.[e]),t==="manager"&&hs(e,""),t==="fast"&&sl(e,`Saved "${r.name}". Tap ${e==="trade"?"Trade":"Bundle"} on any row.`),S(a,r.id?"Preset updated.":"Preset saved."),h()}catch(r){t==="fast"&&sl(e,r.message),S(a,r.message),T(r.message)}}async function Pv(e,t){try{const a=await k("/api/web/presets",{method:"POST",body:JSON.stringify({type:e,action:"delete",id:t})});n.presets=a.presets||n.presets,e==="trade"&&n.selectedTradePresetId===t&&Us("trade",""),e==="bundle"&&n.selectedBundlePresetId===t&&Us("bundle",""),(e==="trade"&&n.editingTradePresetId===t||e==="bundle"&&n.editingBundlePresetId===t)&&hs(e,""),h()}catch(a){T(a.message)}}function Yu(e,t){hs(e,t),n.activeTab=e==="bundle"?"bundle":"trade",h({force:!0}),window.requestAnimationFrame(()=>{const a=document.querySelector(`[data-preset-editor="${e==="bundle"?"bundle":"trade"}"]`);a?.scrollIntoView({behavior:"smooth",block:"start"}),a?.querySelector("input:not([type='hidden']), select")?.focus?.({preventScroll:!0})})}async function Qu(e={}){const t=m("[data-referral-status]");try{await J(t,"Opening secure web profile..."),S(t,e.generate?"Generating referral code...":"Saving referral settings...");const a=String(m("[data-referral-code]")?.value||"").trim(),r=Ag(m("[data-referral-link]")?.value||""),s=String(n.user?.referralCode||"").trim(),o=e.generate?a:r&&r!==s&&(!a||a===s)?r:a||r,c=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({referralCode:o,generateReferralCode:!!e.generate,referralPayoutWallet:m("[data-referral-wallet]")?.value||""})});he(c.user);const l=c.user?.referralCode||n.user?.referralCode||"";S(t,e.generate?`Generated ${l}. Link is ready.`:`Referral settings saved. Code: ${l}`),h()}catch(a){S(t,a.message),T(a.message)}}async function Cv(){const e=m("[data-trader-board-status]");try{await J(e,"Opening secure web profile..."),S(e,"Saving trader board settings...");const t=m("[data-trader-board-wallet-mode]")?.value||"all",a=await k("/api/web/profile/referral",{method:"POST",body:JSON.stringify({showOnTraderBoard:!!m("[data-show-trader-board]")?.checked,traderBoardWalletMode:t,traderBoardWalletIndexes:Ve("trader-board")})});he(a.user),S(e,a.user?.showOnTraderBoard?"Trader board settings saved. Your board stats will use the selected wallet rule.":"Trader board is off."),h()}catch(t){S(e,t.message),T(t.message)}}async function Zu(e,t){const a=t.dataset.watchToken||t.dataset.unwatchToken||"";if(a)try{await J(null,"Opening secure web profile for watchlist...");const r=await k("/api/web/watchlist",{method:"POST",body:JSON.stringify({action:e,tokenMint:a,symbol:t.dataset.watchSymbol||"",name:t.dataset.watchName||"",imageUrl:t.dataset.watchImage||""})});n.watchlist=r.watchlist||n.watchlist,h()}catch(r){T(r.message)}}function ol(e){const t=m("[data-launch-status]");S(t,e)}function Lv(){const e=m("[data-launch-ticker]")?.value?.trim()||At(Re().keywords)[0]||"",t=Ve("launch"),a=m("[data-launch-group]")?.value?.trim()||"",r=m("[data-launch-amount]")?.value||"",s=x("[data-launch-tp]","[data-launch-tp-custom]","40"),o=x("[data-launch-sl]","[data-launch-sl-custom]","8"),c=x("[data-launch-delay]","[data-launch-delay-custom]","3"),l=x("[data-launch-loop]","[data-launch-loop-custom]","1"),d=x("[data-launch-loop-delay]","[data-launch-loop-delay-custom]","0"),u=x("[data-launch-slippage]","[data-launch-slippage-custom]","300");if(!e)throw new Error("Enter a ticker to watch.");if(!t.length&&!a)throw new Error("Choose at least one wallet or enter a group label.");return Re().keywords=e,Re().open=!0,{ticker:e,walletIndexes:t,walletGroup:a,amountSol:r,takeProfitPct:s,stopLossPct:o,sellDelay:c,loopCount:l,loopDelay:d,slippageBps:u,...ga("launch")}}async function xv(){try{const e=Lv();ol("Arming launch watch...");const t=await k("/api/web/launch/watch",{method:"POST",body:JSON.stringify(e)});n.launchResult=t.watch,await ca(),n.activeTab="launch",h()}catch(e){ol(e.message)}}async function Mv(e){try{const t=await k("/api/web/launch/cancel",{method:"POST",body:JSON.stringify({planId:e})});n.launchResult=t.watch,await ca(),n.activeTab="launch",h()}catch(t){ol(t.message)}}function Bv(){return`
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
  `}function Rv(){const e=Zd();if(!e.length)return"";const t=e.length;return`
    <section class="account-check-card background-wallets-card">
      <div>
        <h3>Background volume wallets</h3>
        <p>${t} temporary volume-bot wallet${t===1?" is":"s are"} running in the background, hidden from this list. They auto-return funds to your source wallet when a bot stops — if anything ever gets stuck, sweep them all back here.</p>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-sweep-background-wallets ${n.sweepBackgroundPending?"disabled":""}>${n.sweepBackgroundPending?"Sweeping...":`Sweep ${t} background wallet${t===1?"":"s"}`}</button>
      </div>
      <small data-sweep-background-status>${i(n.sweepBackgroundStatus||"")}</small>
    </section>`}async function Iv(){if(!n.sweepBackgroundPending){n.sweepBackgroundPending=!0,n.sweepBackgroundStatus="Sweeping background wallets back to your source wallet...",h({force:!0});try{const e=await k("/api/web/wallets/sweep-background",{method:"POST",body:JSON.stringify({}),dedupe:!1,timeoutMs:ae});n.sweepBackgroundStatus=e?.summary||"Background wallets swept back to your source wallet.",await St({force:!0,deep:!0,reason:"sweep-background"}).catch(()=>{})}catch(e){n.sweepBackgroundStatus=e?.message?`Sweep failed: ${e.message}`:"Sweep failed. Try again."}finally{n.sweepBackgroundPending=!1,h({force:!0})}}}function Ov(){const e=Wv(),a=[{key:"balances",label:"Balances",hint:"Wallets & SOL",html:`
    ${ep()}
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
      ${Ui().map(r=>`
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${sn(String(r.index))}</div>
            <div>
            <strong>${r.index}. ${i(r.label)}${r.sessionWallet?` <span class="session-wallet-badge">${i(r.sessionStatus==="funded"?"Session Funded":"Session")}</span>`:""}</strong>
            <code>${r.publicKey}</code>
            ${_v(r)}
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
  `},{key:"fund",label:"Fund / Sweep",hint:"Move SOL",html:`${Lb()}${Rv()}${Cb()}${Bv()}`},{key:"create",label:"Create",hint:"New wallets",html:is()},{key:"import",label:"Import",hint:"Add keys",html:Id()},{key:"backup",label:"Backup",hint:"Save / restore",html:Rd()},{key:"downloads",label:"Downloads",hint:"Exports",html:Od()}];if(!n.wallets.length){const r=a.filter(s=>s.key!=="balances"&&s.key!=="fund");return`
      ${e}
      ${F("No managed bot wallets yet","Connect a browser wallet for portfolio view, or use Create / Import below to set up managed trading wallets.")}
      ${cn({toolKey:"wallets",activeKey:dn("wallets","create"),sections:r})}
    `}return`
    ${e}
    ${cn({toolKey:"wallets",activeKey:dn("wallets","balances"),sections:a})}
  `}function Ev(){return(Array.isArray(n.wallets)?n.wallets:[]).find(t=>t?.sessionWallet&&t?.sessionStatus==="funded")||null}function Fv(){if(!(n.connectedWalletBalance||n.user?.connectedWallet||null)?.publicKey)return"";const t=Ev();return t?`
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
    </div>`}function Wv(){const e=n.connectedWalletBalance||n.user?.connectedWallet||null;if(!e?.publicKey)return"";const t=n.connectedWalletBalance||{},a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:t.error?"Balance error":"loading",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"",o=(t.tokens||[]).slice(0,6).map(c=>`
    <a href="${i(c.dexUrl||Q(c.mint))}" target="_blank" rel="noreferrer">
      ${ht({...c,tokenMint:c.mint,symbol:c.symbol||c.shortMint,name:c.name||""})}
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
        ${Fv()}
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
  `}function ep(){const e=n.balances.reduce((a,r)=>a+Number(r.tokens?.length||0),0)+nd().length,t=n.balances.filter(a=>a.error).length;return`
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${yi()}</strong></div>
      <div><span>Total SOL</span><strong>${_t().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${e}</strong></div>
      <div><span>Balance Errors</span><strong>${t}</strong></div>
    </section>
  `}function _v(e){const t=n.balances.find(o=>Number(o.index)===Number(e.index));if(!t)return"<span>Balance: loading</span>";if(t.error)return`<span>Balance check failed: ${i(t.error)}</span>`;const a=Number.isFinite(Number(t.sol))?`${Number(t.sol).toFixed(4)} SOL`:"SOL unavailable",r=Number(t.tokens?.length||0)===1?"1 token":`${Number(t.tokens?.length||0)} tokens`,s=t.warnings?.length?` | ${t.warnings.length} warning(s)`:"";return`<span>Balance: ${i(a)} | ${i(r)}${i(s)}</span>`}function Nv(){const e=it(),t=`
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
    ${Dv()}
  `;return e.length?`
    ${t}
    <div class="table-list">
      ${e.map(zp).join("")}
    </div>
  `:`${t}${F("No open positions","Current token holdings will show here after a wallet holds non-zero tokens.")}`}function Dv(){const e=n.bagScan;if(!e)return"";if(e.status==="loading")return'<section class="account-check-card"><div><h3>🛡 Scanning your bags...</h3><p>Running SlimeShield + liquidity checks over everything you hold. Takes a few seconds.</p></div></section>';if(e.status==="error")return`<section class="account-check-card"><div><h3>🛡 Bag scan failed</h3><p>${i(e.message||"Try again in a moment.")}</p></div><button data-scan-bags>Retry</button></section>`;const t=e.bags||[];if(!t.length)return'<section class="account-check-card"><div><h3>🛡 No bags found</h3><p>Nothing held in connected or bot wallets right now - scan again after your next buy.</p></div></section>';const a=t.filter(s=>!s.healthy).length,r={BUY:"#72ff23",CAUTION:"#ffd84d",RISK:"#ff9d4d",AVOID:"#ff6b5e"};return`
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
              <small>${s.flags.length?i(s.flags.join(" | ")):"no red flags"}${s.liquidityUsd!=null?` | liq ${M(s.liquidityUsd)}`:""}${s.marketCapUsd?` | MC ${M(s.marketCapUsd)}`:""}</small>
            </div>
            <div class="card-actions compact">
              <button data-token-chart="${i(s.mint)}" data-token-chart-source="bag-scan">Chart</button>
              <button data-position-sell="${i(s.mint)}" data-position-sell-percent="100">Sell All</button>
            </div>
          </article>`).join("")}
      </div>
    </section>
  `}async function Uv(e){const t=String(e||"").trim();if(!t)return;n.devWatch||(n.devWatch={});const a=!n.devWatch[t];try{const r=await k("/api/web/dev-watch",{method:"POST",body:JSON.stringify({wallet:t,watch:a}),timeoutMs:15e3});n.devWatch[t]=!!r.watching}catch(r){T(r?.message||"Could not update dev watch.")}Ta()}async function qv(e,t=null){const a=String(e||"").trim();if(!a)return;const r=ut();t&&(t.disabled=!0,t.textContent="Arming...");try{const s=await k("/api/web/positions/arm-exits",{method:"POST",body:JSON.stringify({tokenMint:a,takeProfitPct:r?.takeProfitPct||"40",stopLossPct:r?.stopLossPct||"8",sellDelay:r?.sellDelay||"off",sellPercent:r?.sellPercent||"100",slippageBps:r?.slippageBps||"1000"}),timeoutMs:2e4});wu(a),n.walletRemoveStatus=s.message||"Exits armed.",t&&(t.textContent="✅ Armed"),Su().then(()=>h())}catch(s){T(s?.message||"Could not arm exits."),t&&(t.disabled=!1,t.textContent="Arm Exits")}}async function Hv(){n.bagScan={status:"loading"},h();try{const e=await k("/api/web/shield/scan-bags",{timeoutMs:3e4});n.bagScan={status:"done",bags:e.bags||[]}}catch(e){n.bagScan={status:"error",message:e?.message||""}}h()}function Kv(){const e=`
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
            ${ht(t)}
            <div>
              <strong>${i(t.symbol||t.shortMint)}</strong>
              ${t.name?`<small>${i(t.name)}</small>`:""}
              <button type="button" class="ca-copy" data-copy="${i(t.tokenMint)}">${i(w(t.tokenMint))}</button>
            </div>
          </div>
          <span>${i(t.spentSol||"0")} SOL</span>
          <span>${i(t.receivedSol||"0")} SOL</span>
          <span class="${String(t.realizedSol||"").startsWith("-")?"negative":"positive"}">${i(t.realizedSol||"0")}</span>
          <span>${i(t.holdTime||"n/a")}<small>Latest ${i(Te(t.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${Ye(Fd(t),"Share")}
            <button data-pnl-card="${i(t.tokenMint)}">Card</button>
            <button data-share-pnl-card="${i(t.tokenMint)}" data-share-text="${i(Fd(t))}">Post</button>
            <a href="${t.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `:`${e}${F("No PnL yet","Trades made through the bot will show here.")}`}function ur(){return Vv(pr())}function pr(){const e=Object.values(n.livePairsByBucket||{}).flatMap(s=>s?.rows||[]),t=n.scan?.rows||[],a=n.kolScan?.rows||[],r=n.watchlist?.rows||[];return[...e,...t,...a,...r]}function fn(e=""){const t=String(e||"");return t&&pr().find(a=>String(a?.tokenMint||"")===t)||null}function g0(e=""){const t=fn(e);return!t||!Hs(t)?!1:(T("Safety block: this feed token has mintable/freezable/honeypot-style risk signals."),!0)}function Vv(e=[]){const t=new Map;for(const a of e||[]){if(mr(a))continue;const r=String(a?.tokenMint||"");r&&!t.has(r)&&t.set(r,a)}return[...t.values()]}function we(e=[]){const t=new Map;for(const a of e||[]){if(mr(a))continue;const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||qs(a)>qs(s))&&t.set(r,a)}return[...t.values()]}function qs(e={}){return tw(e)+Math.min(2,Number(e.bestPickScore||e.score||0)/50)+(O(e.volumeM15,e.volumeM30,e.volumeH1,e.volume5m,e.volumeH24)>0?1:0)}function zv(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.profile?.source,e?.profile?.market,e?.profile?.mode,e?.metadata?.source,e?.metadata?.market,e?.metadata?.mode,e?.dexPair?.dexId,e?.dexPair?.labels,e?.labels,e?.riskFlags].flat().filter(Boolean).join(" ").toLowerCase();return/\bmayhem\b/.test(t)||t.includes("pump mayhem")||t.includes("mayhem mode")}function Hs(e={}){if(zv(e))return!0;const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote,e?.tokenProgram,e?.mintAuthority?"mint authority":"",e?.freezeAuthority?"freeze authority":""].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function mr(e={}){const t=[e?.tokenMint,e?.symbol,e?.name,e?.source,e?.category,e?.platform,e?.market,e?.dexId,e?.profileSource,e?.labels,e?.riskFlags,e?.bestPickWarnings,e?.scoreWarnings,e?.safetyNote].flat().filter(Boolean).join(" ").toLowerCase();if(/\b(honeypot|honey\s*pot|blacklist|rug|scam|mayhem|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|liquidity drain|drained liquidity)\b/i.test(t))return!0;const a=O(e.marketCap,e.fdv),r=O(e.liquidityUsd);return a>=1e8&&(!r||r/a<.01)}function tp(){const e=ur(),t=o=>e.find(c=>String(c.tokenMint)===o)||{tokenMint:o,shortMint:w(o),symbol:w(o),dexUrl:Q(o)},a=String(n.terminalToken||n.tradeToken||"").trim();if(a)return t(a);const r=String(n.terminalAutoToken||"").trim();if(r)return t(r);const s=(qe()?.rows||[])[0]||e[0]||null;return s?.tokenMint&&(n.terminalAutoToken=String(s.tokenMint)),s}function Ks(){const e=ur(),t=n.smartChartTokenRef||null,a=s=>e.find(o=>String(o.tokenMint||"")===s)||{...String(t?.tokenMint||"")===s?t:{},tokenMint:s,shortMint:w(s),symbol:t?.symbol||w(s),name:t?.name||"Custom Token",imageUrl:t?.imageUrl||t?.imageUri||"",pairAddress:t?.pairAddress||t?.pairId||"",dexUrl:t?.dexUrl||Q(t?.pairAddress||s),pumpUrl:s.toLowerCase().endsWith("pump")?`https://pump.fun/coin/${encodeURIComponent(s)}`:""},r=String(n.smartChartToken||n.terminalToken||n.tradeToken||"").trim();return sp(r?a(r):tp())}function ap(e={}){return typeof e=="string"?String(e||"").trim():String(e?.pairAddress||e?.pairId||e?.dexPair?.pairAddress||e?.dexPair?.pairId||e?.tokenMint||e?.mint||"").trim()}const jv=300*1e3,np=45*1e3,rp=600*1e3,Gv=700,Xv=6e3,Jv=4,Yv=3e4;function tt(e=""){const t=String(e||"").trim();if(!t)return null;const a=n.smartChartBootstrap?.[t]||null;if(!a)return null;const r=Date.now()-Number(a.loadedAt||a.resolvedAt||0);return a.status==="failed"?r<np?a:null:r<rp?a:null}function fr(e=""){const t=String(e||"").trim(),a=t?n.smartChartDexResolution?.[t]||tt(t):null;if(!a)return null;const r=Date.now()-Number(a.resolvedAt||0);return a.status==="failed"?r<np?a:null:r<jv?a:null}function sp(e=null){if(!e)return e;const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=fr(t);return!a||a.status==="failed"?e:{...e,pairAddress:e.pairAddress||a.pairAddress||"",pairId:e.pairId||a.pairAddress||"",dexUrl:e.dexUrl||a.dexUrl||a.pairUrl||"",dexId:e.dexId||a.dexId||"",dexName:e.dexName||a.dexName||a.dexId||"",symbol:e.symbol||a.symbol||w(t),name:e.name||a.name||"Token",imageUrl:e.imageUrl||a.imageUrl||"",marketCap:e.marketCap||a.marketCap||0,marketCapUsd:e.marketCapUsd||a.marketCap||0,fdv:e.fdv||a.fdv||0,liquidityUsd:e.liquidityUsd||a.liquidityUsd||0,volumeH24:e.volumeH24||a.volumeH24||0,volumeH1:e.volumeH1||a.volumeH1||0,priceUsd:e.priceUsd||a.priceUsd||0,h1:e.h1||a.h1||0,volume:e.volume||a.volume||null,txns:e.txns||a.txns||null}}function il(e={}){const t=String(e.tokenMint||e.tokenAddress||e.mint||"").trim();if(!t)return;const a=Date.now(),r={...e,tokenMint:t,tokenAddress:t,status:e.errorCode?"failed":"resolved",loadedAt:a,resolvedAt:a};n.smartChartBootstrap={...n.smartChartBootstrap||{},[t]:r},(r.pairAddress||r.dexUrl||r.symbol||r.name)&&Vs({...r,mint:t,imageUri:r.imageUrl||r.imageUri||"",dex:r.dexId||r.dexName||""})}function Vs(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.pairAddress||e.pairId||"").trim();!t||!a&&!e.dexUrl&&!e.symbol&&!e.name||(n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{...n.smartChartDexResolution?.[t]||{},tokenMint:t,pairAddress:a,dexUrl:e.dexUrl||Q(a||t),dexId:e.dex||e.dexId||"",symbol:e.symbol||"",name:e.name||"",imageUrl:e.imageUri||e.imageUrl||"",marketCap:Number(e.marketCap??e.marketCapUsd)||n.smartChartDexResolution?.[t]?.marketCap||0,fdv:Number(e.fdv)||n.smartChartDexResolution?.[t]?.fdv||0,liquidityUsd:Number(e.liquidityUsd??e.liquidity?.usd)||n.smartChartDexResolution?.[t]?.liquidityUsd||0,volumeH24:Number(e.volumeH24)||n.smartChartDexResolution?.[t]?.volumeH24||0,volumeH1:Number(e.volumeH1)||n.smartChartDexResolution?.[t]?.volumeH1||0,priceUsd:Number(e.priceUsd)||n.smartChartDexResolution?.[t]?.priceUsd||0,h1:Number(e.h1)||n.smartChartDexResolution?.[t]?.h1||0,status:"resolved",resolvedAt:Date.now()}})}function Qv(e={}){const t=String(e?.tokenMint||n.smartChartToken||"").trim();if(!t)return!1;const a=String(e?.pairAddress||e?.pairId||"").trim();if(a)return Vs({...e,tokenMint:t,pairAddress:a}),!1;if(tt(t)?.pairAddress)return!1;const r=fr(t);return r?.pairAddress||r?.status==="failed"?!1:(n.smartChartDexResolving?.[t]||(n.smartChartDexResolving={...n.smartChartDexResolving||{},[t]:!0},window.setTimeout(()=>{lp(t).catch(()=>{})},0)),!0)}function op(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||n.smartChartToken||"").trim();return!a||!t.force&&tt(a)?.status==="resolved"?!1:(n.smartChartBootstrapLoading?.[a]||(n.smartChartBootstrapLoading={...n.smartChartBootstrapLoading||{},[a]:!0},window.setTimeout(()=>{lp(a,{source:t.source||"chart-bootstrap"}).catch(()=>{})},0)),!0)}const ll=new Map;async function ip(e){const t=String(e||"").trim();if(!t)return;const a=ll.get(t)||0;if(Date.now()-a<3e4)return;ll.set(t,Date.now());const r=async()=>{const d=((await(await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(t)}`,{cache:"no-store"})).json())?.pairs||[]).filter(u=>u?.chainId==="solana").sort((u,p)=>(Number(p?.liquidity?.usd)||0)-(Number(u?.liquidity?.usd)||0))[0];if(!d)throw new Error("no pair");return d},s=async()=>{const o=await k(`/api/web/pair-lite?mint=${encodeURIComponent(t)}`,{timeoutMs:5e3});if(!o?.pair)throw new Error("no pair");return o.pair};try{const o=await Promise.any([r(),s()]);il({tokenMint:t,symbol:o.baseToken?.symbol||"",name:o.baseToken?.name||"",priceUsd:o.priceUsd,marketCap:o.marketCap||o.fdv||null,marketCapUsd:o.marketCap||o.fdv||null,fdv:o.fdv||null,liquidityUsd:Number(o.liquidity?.usd)||null,liquidity:{usd:Number(o.liquidity?.usd)||null},volumeH24:Number(o.volume?.h24)||null,volumeH1:Number(o.volume?.h1)||null,h1:Number(o.priceChange?.h1)||null,imageUrl:o.info?.imageUrl||"",dexUrl:o.url||"",pairAddress:o.pairAddress||"",dexId:o.dexId||"",pumpCurve:!!o.pumpCurve,bondingProgressPct:o.bondingProgressPct??null,source:o.pumpCurve?"pump-curve":"direct-dexscreener"}),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}catch{ll.delete(t)}}function cl(e={},t={}){const a=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return a?(Vs(e),Qh(a,e.symbol||e.name||""),ip(a),op(e,{source:t.source||"prefetch"}),n.smartChartPrefetchLog=[...n.smartChartPrefetchLog||[],{at:new Date().toISOString(),tokenMint:a,source:t.source||"prefetch",routeChunkPrefetched:!0,metadataPrefetched:!!(e.symbol||e.name||e.imageUri||e.imageUrl),candlesPrefetched:!1,dedupeHit:!!(n.smartChartBootstrapLoading?.[a]||tt(a)),cacheTtlMs:rp}].slice(-20),!0):!1}async function lp(e=""){const t=String(e||"").trim();if(!t)return null;try{const a=L(),r=await k(`/api/web/chart/bootstrap?token=${encodeURIComponent(t)}`,{timeoutMs:4500}),s=r.chart||r.dexToken||{};return il(s),K("chart-bootstrap",a,{component:"smartChart",cacheHit:!!s.cacheHit,stale:!!s.stale,details:`${t}:${s.chartProvider||"dexscreener-embed"}`}),n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),s}catch(a){return n.smartChartDexResolution={...n.smartChartDexResolution||{},[t]:{tokenMint:t,status:"failed",error:N(a?.message||"DEX pair lookup failed."),resolvedAt:Date.now()}},n.route==="terminal"&&n.activeTab==="smartChart"&&String(n.smartChartToken||"")===t&&h({force:!0}),null}finally{const a={...n.smartChartDexResolving||{}};delete a[t],n.smartChartDexResolving=a;const r={...n.smartChartBootstrapLoading||{}};delete r[t],n.smartChartBootstrapLoading=r}}function Zv(e,t={}){const a=ap(e),r=new URLSearchParams({embed:"1",theme:"dark",trades:t.trades?"1":"0",info:t.info?"1":"0"});return`https://dexscreener.com/solana/${encodeURIComponent(a)}?${r.toString()}`}let hr=null;function ew(){if(hr!=null)return hr;try{hr=((document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"").match(/app\.js\?v=([\w-]+)/)||[])[1]||""}catch{hr=""}return hr}function cp(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim();if(a){const s=String(e.symbol||"").slice(0,12),o=ew(),c=Ia?`&api=${encodeURIComponent(Ia)}`:"";return`/chart-lab?ca=${encodeURIComponent(a)}&embed=1${s?`&sym=${encodeURIComponent(s)}`:""}${c}${o?`&v=${encodeURIComponent(o)}`:""}`}const r=tt(a);return t==="info"&&r?.infoUrl?r.infoUrl:(t==="chartTxns"||t==="txns")&&(r?.chartTxnsUrl||r?.txnsUrl)?r.chartTxnsUrl||r.txnsUrl:r?.chartUrl?r.chartUrl:Zv(e,{trades:t==="chartTxns"||t==="txns",info:t==="info"})}function b0(e={}){const t=String(e?.tokenMint||e?.mint||n.smartChartToken||""),a=gp(t||e?.symbol||"pump"),r=Math.max(1,O(e.marketCap,e.fdv,e.liquidityUsd,1e4)),s=O(e.m5,e.h1,e.priceChange?.m5,e.priceChange?.h1,e.priceChange5m,e.priceChange1h,0),o=Math.max(4,Math.min(96,Kt(e)||O(e.bondingProgressPct,e.pumpProgress,12))),c=Math.max(2,Math.min(22,Math.abs(s)||O(e.volume5m,e.volumeM15,e.volumeH1,0)/Math.max(1,r)*100));return Array.from({length:22},(l,d)=>{const u=Math.sin((d+a%11)/2.2)*c,p=(d/21-.5)*(s||o/3),f=((a>>d%8&7)-3)*.7;return Math.max(1,r*(1+(u+p+f)/100))})}function y0(e={},...t){for(const a of t){const r=Number(e?.[a]);if(Number.isFinite(r)&&r>0)return r;const s=a.split(".").reduce((c,l)=>c?.[l],e),o=Number(s);if(Number.isFinite(o)&&o>0)return o}return 0}function v0(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="txns",s=Math.max(0,Math.min(100,Kt(e)||O(e.bondingProgressPct,e.pumpProgress,0))),o=_(e.marketCapLabel,e.fdvLabel,M(e.marketCap),M(e.fdv)),c=_(e.liquidityLabel,M(e.liquidityUsd)),l=_(e.volumeM15Label,e.volume5mLabel,e.volumeLabel,M(e.volumeM15),M(e.volume5m),M(e.volumeH1));return`
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
          ${Uk(e)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${i(o)}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(c)}</dd></div>
          <div><dt>Volume</dt><dd>${i(l)}</dd></div>
          <div><dt>Status</dt><dd>${el(e)?"Pump curve":"Bonded"}</dd></div>
        </dl>
      `}
      ${t==="chart"?"":qk(e)}
      <small>${i(t==="chart"?"Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right.":r?"Transactions shows Pump activity only. Use Chart + Txns when you want both together.":"Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `}function dl(e={},t="chart"){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=t==="chartTxns"||t==="txns",s=t==="info",o=op(e)||Qv(e),c=s?`SlimeWire info for ${e.symbol||w(a)}`:r?`SlimeWire chart and transactions for ${e.symbol||w(a)}`:`SlimeWire chart for ${e.symbol||w(a)}`,l=["smart-chart-frame","smart-chart-dex-frame",r?"smart-chart-transactions-frame":"",t==="chartTxns"?"smart-chart-combined-frame":"",s?"smart-chart-info-frame":""].filter(Boolean).join(" "),u=s?"Loading token info...":"Loading live chart...",p=cp(e,t);return`
    <div class="${i(l)}" data-chart-frame-loading="${i(u)}" data-chart-resolving="${o?"true":"false"}" data-chart-mint="${i(a)}" data-chart-mode="${i(t)}" data-chart-src="${i(p)}">
      <iframe title="${i(c)}" src="${i(p)}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${i(t)}','${i(a)}')" allowfullscreen></iframe>
    </div>
  `}function dp(){const e=[...Object.values(n.livePairsByBucket||{}).flatMap(a=>a?.rows||[]),...n.livePairs?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[],...n.watchlist?.rows||[]],t=new Map;for(const a of e){const r=String(a?.tokenMint||"");if(!r)continue;const s=t.get(r);(!s||qs(a)>qs(s))&&t.set(r,a)}return t}function tw(e={}){return[e.marketCap,e.liquidityUsd,e.volume5m,e.volumeM15,e.volumeH1,e.pairCreatedAt,e.imageUrl,e.twitterUrl,e.telegramUrl,e.websiteUrl].reduce((t,a)=>t+(a&&String(a).toLowerCase()!=="n/a"?1:0),0)}function up(e=[]){const t=dp();return(e||[]).map(a=>pp(a,t.get(String(a?.tokenMint||""))))}function dt(e){if(e==null||e==="")return null;if(typeof e=="number")return Number.isFinite(e)?e:null;const t=String(e).trim();if(!t)return null;const r=t.replace(/[$,%_\s,]/g,"").match(/^([-+]?\d*\.?\d+)([kmb])?$/i);if(!r)return null;const s=Number(r[1]);if(!Number.isFinite(s))return null;const o=String(r[2]||"").toLowerCase();return o==="k"?s*1e3:o==="m"?s*1e6:o==="b"?s*1e9:s}function O(...e){for(const t of e){const a=dt(t);if(Number.isFinite(a)&&a>0)return a}for(const t of e){const a=dt(t);if(Number.isFinite(a))return a}return 0}function pp(e={},t=null){return t?{...e,imageUrl:e.imageUrl||t.imageUrl||"",websiteUrl:e.websiteUrl||t.websiteUrl||"",twitterUrl:e.twitterUrl||t.twitterUrl||"",telegramUrl:e.telegramUrl||t.telegramUrl||"",dexUrl:e.dexUrl||t.dexUrl,pumpUrl:e.pumpUrl||t.pumpUrl||"",isPump:e.isPump||t.isPump,pairCreatedAt:e.pairCreatedAt||t.pairCreatedAt,pairAgeSeconds:Number.isFinite(Number(e.pairAgeSeconds))?e.pairAgeSeconds:t.pairAgeSeconds,pairAgeMinutes:Number.isFinite(Number(e.pairAgeMinutes))?e.pairAgeMinutes:t.pairAgeMinutes,pairAgeLabel:e.pairAgeLabel||t.pairAgeLabel,marketCap:O(e.marketCap,t.marketCap,e.fdv,t.fdv),fdv:O(e.fdv,t.fdv,e.marketCap,t.marketCap),marketCapLabel:_(e.marketCapLabel,t.marketCapLabel,M(e.marketCap),M(t.marketCap)),fdvLabel:_(e.fdvLabel,t.fdvLabel,M(e.fdv),M(t.fdv)),liquidityUsd:O(e.liquidityUsd,t.liquidityUsd),liquidityLabel:_(e.liquidityLabel,t.liquidityLabel,M(e.liquidityUsd),M(t.liquidityUsd)),volume5m:O(e.volume5m,t.volume5m),volume5mLabel:_(e.volume5mLabel,t.volume5mLabel,M(e.volume5m),M(t.volume5m)),volumeM15:O(e.volumeM15,t.volumeM15),volumeM15Label:_(e.volumeM15Label,t.volumeM15Label,M(e.volumeM15),M(t.volumeM15)),volumeM30:O(e.volumeM30,t.volumeM30),volumeM30Label:_(e.volumeM30Label,t.volumeM30Label,M(e.volumeM30),M(t.volumeM30)),volumeH1:O(e.volumeH1,t.volumeH1),volumeH1Label:_(e.volumeH1Label,e.volumeLabel,t.volumeH1Label,t.volumeLabel,M(e.volumeH1),M(t.volumeH1)),volumeH24:O(e.volumeH24,t.volumeH24),volumeH24Label:_(e.volumeH24Label,t.volumeH24Label,M(e.volumeH24),M(t.volumeH24)),volumeLabel:_(e.volumeLabel,t.volumeLabel,e.volumeH1Label,t.volumeH1Label,M(e.volumeH1),M(t.volumeH1)),sniperCount:O(e.sniperCount,t.sniperCount)}:e}function gr(e=[],t=[]){return we([...n.livePairsByBucket.under1d?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.scan?.rows||[],...e,...t]).sort((r,s)=>Number(s.bestPickScore||s.score||0)-Number(r.bestPickScore||r.score||0)||O(s.volumeM15,s.volumeM30,s.volumeH1,s.volume5m,s.volumeH24)-O(r.volumeM15,r.volumeM30,r.volumeH1,r.volume5m,r.volumeH24)||O(s.marketCap,s.fdv)-O(r.marketCap,r.fdv)||nt(r,s))}function G(e,t,a,r,s){return{key:e,label:t,severity:a,message:r,weight:s}}function aw(e={}){const t=dt(e.pairAgeMinutes??e.ageMinutes??e.tokenAgeMinutes);if(Number.isFinite(t))return t;const a=dt(e.pairAgeSeconds??e.ageSeconds);return Number.isFinite(a)?a/60:null}function nw(e,t=[]){const a=(t||[]).some(s=>s.key==="hard_flag"),r=(t||[]).filter(s=>s.severity==="risk"&&s.key!=="liquidity_extreme").length;return a||e<35&&r>=2?"AVOID":e<60?"RISK":e<75?"CAUTION":"BUY"}function rw(e,t=[]){if(e==="BUY")return"Clean setup. Normal size still depends on your risk.";if(e==="CAUTION")return"Trade small or use protection.";if(e==="RISK")return"High-risk setup. Protected Buy recommended if you enter.";const a=(t||[]).find(r=>r.severity==="risk");return a?.message?`Avoid recommended. ${a.message}`:"Avoid recommended. Multiple danger signals."}const zs=Object.freeze({unknown:"",new:"New",hold:"Hold",mixed:"Mixed",risk:"Risk",dump:"Dev"});function ya(e=""){const t=String(e||"unknown").trim().toLowerCase();return Object.hasOwn(zs,t)?t:"unknown"}function js(e="",t="Unknown"){const a=ya(e);return zs[a]||t}function mp(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim(),a=String(e.creatorWallet||e.creator||e.deployerWallet||e.poolCreator||"").trim(),r=a?"new":"unknown";return{mint:t,status:r,label:zs[r],confidence:a?"low":"unknown",summary:a?"Limited dev-wallet history. Treat this as a new launch wallet.":"No reliable creator wallet detected yet.",likelyDevWallet:a||null,updatedAt:""}}function br(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();return t&&(n.devInfoSummaries?.[t]||e.devInfoSummary)||mp(e)}function sw(e={}){const t=ya(e.status);return t==="hold"?G("dev_info_hold","Dev Info","positive","Likely dev wallet is still holding.",6):t==="mixed"?G("dev_info_mixed","Dev Info","caution","Dev wallet history is mixed.",-8):t==="risk"?G("dev_info_risk","Dev Info","risk","Likely dev wallet has fast-sell history.",-18):t==="dump"?G("dev_info_dump","Dev Info","risk","Likely dev wallet sold quickly or has repeated dump behavior.",-30):t==="new"?G("dev_info_limited","Dev Info","neutral","Dev wallet history is limited.",-2):G("dev_info_unknown","Dev Info","neutral","Dev wallet history is limited.",-4)}function fp(e={},t={}){if(!D("devInfoEnabled",!0))return"";const a=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();if(!a)return"";const r=br(e),s=ya(r.status),c=!!n.devInfoLoading?.[`summary:${a}`]?"...":s==="unknown"?"":r.label||zs[s]||"",l=!!t.compact;return`
    <button type="button" class="dev-info-pill dev-info-${i(s)} ${l?"is-compact":""}" data-dev-info="${i(a)}" title="${i(r.summary||"Open Dev Info")}">
      <span>Dev Info</span>${c?`<strong>${i(c)}</strong>`:""}
    </button>
  `}function ow(e={}){const t=String(e.tokenMint||e.mint||e.tokenAddress||"").trim();let a=70;const r=[],s=[],o=[],c=dt(e.liquidityUsd??e.currentLiquidityUsd??e.liquidity?.usd);Number.isFinite(c)?c<750?(a-=36,s.push("liquidity"),r.push(G("liquidity_extreme","Liquidity","risk","Liquidity is extremely thin for fast entries.",-36))):c<3e3?(a-=20,s.push("liquidity"),r.push(G("liquidity_thin","Liquidity","risk","Liquidity is thin, so entries and exits can slip.",-20))):c>=2e4?(a+=8,s.push("liquidity"),r.push(G("liquidity_clean","Liquidity","positive","Liquidity is healthier than most fresh launches.",8))):(s.push("liquidity"),r.push(G("liquidity_ok","Liquidity","neutral","Liquidity is workable but still early-market risk.",0))):(a-=6,o.push("liquidity"),r.push(G("liquidity_unknown","Liquidity","neutral","Liquidity is not cached yet.",-6)));const l=aw(e);Number.isFinite(l)?l<3?(a-=10,s.push("age"),r.push(G("very_fresh","Age","caution","Very fresh launch; fake volume and exit risk are harder to read.",-10))):l>60?(a+=4,s.push("age"),r.push(G("aged_in","Age","positive","Token has more than an hour of observable trading.",4))):s.push("age"):(a-=4,o.push("age"),r.push(G("age_unknown","Age","neutral","Pair age is not fully verified yet.",-4)));const d=dt(e.volumeM15??e.volumeH1??e.volume5m??e.volumeUsd);Number.isFinite(d)?d<=0?(a-=5,s.push("volume"),r.push(G("volume_missing","Volume","caution","Trading volume is not visible yet.",-5))):d>=1e4?(a+=6,s.push("volume"),r.push(G("volume_active","Volume","positive","Volume is active enough to review flow.",6))):s.push("volume"):o.push("volume");const u=dt(e.buys5m??e.buysH1??e.buys),p=dt(e.sells5m??e.sellsH1??e.sells);Number.isFinite(u)&&Number.isFinite(p)?(s.push("flow"),p>=u*1.8&&p>=5?(a-=18,r.push(G("sell_pressure","Flow","risk","Recent sell pressure is stronger than buys.",-18))):u>=p*1.4&&u>=8&&(a+=5,r.push(G("buy_pressure","Flow","positive","Buy flow is currently stronger than sell flow.",5)))):o.push("flow");const f=dt(e.bestPickScore??e.score);Number.isFinite(f)&&(s.push("score"),f>=78?(a+=7,r.push(G("best_pick","Best Pick","positive","Existing SlimeWire score is strong.",7))):f<45&&(a-=10,r.push(G("weak_score","Best Pick","caution","Existing SlimeWire score is weak.",-10))));const y=[...Array.isArray(e.riskFlags)?e.riskFlags:[],...Array.isArray(e.scoreWarnings)?e.scoreWarnings:[],...Array.isArray(e.bestPickWarnings)?e.bestPickWarnings:[]].map(A=>String(A||"").toLowerCase());y.some(A=>/mayhem|fake|scam|honeypot|blacklist/.test(A))&&(a-=40,r.push(G("hard_flag","Hard Flag","risk","A severe token warning is present.",-40))),y.some(A=>/bundle|bundled|cluster|concentr/.test(A))&&(a-=18,r.push(G("bundle_risk","Bundle Risk","risk","Bundled supply or wallet clustering is flagged.",-18))),y.some(A=>/dev|fresh wallet|fresh-wallet|insider/.test(A))&&(a-=14,r.push(G("fresh_wallets","Fresh Wallets","caution","Fresh/dev wallet activity is part of the risk read.",-14))),y.some(A=>/mint|freeze|token-2022/.test(A))&&(a-=24,r.push(G("authority_risk","Authority Risk","risk","Mint/freeze/token-program risk is visible.",-24)));const b=br(e);if(b){const A=sw(b);a+=Number(A.weight||0),r.push(A),["hold","mixed","risk","dump"].includes(ya(b.status))?s.push("devInfo"):o.push("devInfo")}const v=Math.max(0,Math.min(100,Math.round(a))),P=nw(v,r);return{mint:t,verdict:P,score:v,confidence:s.length>=5&&o.length<=1?"high":s.length>=3?"medium":"low",summary:rw(P,r),factors:r.slice(0,10),suggestedAction:P==="BUY"?"normal_buy":P==="CAUTION"?"small_buy":P==="RISK"?"watch_only":"avoid",protectedBuyPreset:P==="BUY"?"scalp":"conservative",updatedAt:new Date().toISOString(),dataSource:"local-ui"}}function at(e={}){const t=String(e?.tokenMint||e?.mint||e?.tokenAddress||"").trim();return t&&n.slimeShieldResults?.[t]||ow(e)}function hn(e=""){return String(e||"CAUTION").toLowerCase()}function iw(e={},t={}){if(!D("slimeShieldEnabled",!0))return dw(e);const a=at(e),r=String(e.tokenMint||a.mint||"").trim(),s=a.verdict||"CAUTION",o=!!t.compact;return`
    <button type="button" class="score-badge slimeshield-pill slimeshield-${i(hn(s))}" data-slimeshield-details="${i(r)}" title="${i(a.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>${o?"Shield":"SlimeShield"}</small>
    </button>
  `}function lw(e={}){if(!D("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0);return`<em class="mobile-score-mini" title="${i(ul(e))}">${i(s?`${s}`:"n/a")} score</em>`}const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`<button type="button" class="mobile-score-mini slimeshield-mini slimeshield-${i(hn(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">Details</button>`}function w0(e={}){if(!D("slimeShieldEnabled",!0)){const s=Number(e.bestPickScore||e.score||0),o=s?`${s}`:"n/a";return`
      <span class="terminal-score-chip" title="${i(ul(e))}">
        <strong>${i(o)}</strong>
        <small>score</small>
      </span>
    `}const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <button type="button" class="terminal-score-chip slimeshield-chip slimeshield-${i(hn(r))}" data-slimeshield-details="${i(a)}" title="${i(t.summary||"Open SlimeShield details")}">
      <strong>Details</strong>
      <small>Shield</small>
    </button>
  `}function cw(e={}){return D("slimeShieldEnabled",!0)?`SlimeShield ${at(e).verdict||"CAUTION"}`:e.bestPickScore?`Score ${e.bestPickScore}/100`:e.valueLabel||e.smartMoney||""}function dw(e={}){const t=Number(e.bestPickScore||e.score||0),a=e.scoreWarnings||e.bestPickWarnings||[],r=t?`${t}/100`:"n/a";return`
    <span class="score-badge" title="${i(ul(e))}">
      <strong>${i(r)}</strong>
      <small>${a.length?"warnings":"best pick"}</small>
    </span>
  `}function uw(e={}){return iw(e,{compact:!0})}function ul(e={}){const t=e.scoreBreakdown||e.bestPickInputs||{},a=Object.entries(t).map(([s,o])=>`${s}: ${o}`),r=e.scoreWarnings||e.bestPickWarnings||[];return[...a,...r.map(s=>`warning: ${s}`)].join(" | ")||"Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals."}function pw(e={}){return""}function M(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"n/a":t>=1e6?`$${(t/1e6).toFixed(t>=1e7?0:1)}M`:t>=1e3?`$${(t/1e3).toFixed(t>=1e5?0:1)}K`:`$${Math.round(t)}`}function _(...e){for(const t of e){const a=String(t??"").trim();if(a&&a!=="$0"&&!/^(n\/a|checking|warming|loading|pending|tracking)\.{0,3}$/i.test(a))return a}return"n/a"}function hp(e={}){return[["15m",_(e.volumeM15Label,M(e.volumeM15))],["30m",_(e.volumeM30Label,M(e.volumeM30))],["1h",_(e.volumeH1Label,e.volumeLabel,M(e.volumeH1))],["24h",_(e.volumeH24Label,M(e.volumeH24))]]}function S0(e={}){const t=mt(e),a=ft(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),s=_(e.liquidityLabel,a>0?M(a):"","checking"),o=hp(e);return`
    <div class="compact-stat-grid">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(s)}</b></span>
      ${o.map(([c,l])=>`<span>${i(c)} <b>${i(l)}</b></span>`).join("")}
    </div>
  `}function mw(e={}){const t=mt(e),a=ft(e),r=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),s=_(e.liquidityLabel,a>0?M(a):"","checking"),o=_(e.volumeM15Label,M(e.volumeM15)),c=_(e.volumeH1Label,e.volumeLabel,M(e.volumeH1));return`
    <div class="compact-metrics-line">
      <span>MC <b>${i(r)}</b></span>
      <span>Liq <b>${i(s)}</b></span>
      <span>15m <b>${i(o)}</b></span>
      <span>1h <b>${i(c)}</b></span>
    </div>
  `}function gn(e={}){const t=String(e.pumpUrl||"").trim();if(t)return t;const a=String(e.tokenMint||e.mint||"").trim();return a&&(e.isPump||a.toLowerCase().endsWith("pump"))?`https://pump.fun/coin/${encodeURIComponent(a)}`:""}function Gs(e={},t=""){const a=t||Pa(e),r=Number(e.sniperCount||e.snipers||0),s=gn(e);return`
    <div class="compact-link-row">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${s?`<a href="${i(s)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
      ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
      ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
      ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
      <button type="button" data-share-x data-share-text="${i(a)}" title="Share">SHARE</button>
      ${r>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(r)}</span>`:""}
    </div>
  `}function nt(e={},t={}){const a=Number(e.pairAgeSeconds),r=Number(t.pairAgeSeconds);if(Number.isFinite(a)&&Number.isFinite(r)&&a!==r)return a-r;const s=Number(e.pairCreatedAt||0),o=Number(t.pairCreatedAt||0);return s||o?o-s:Number(t.bestPickScore||0)-Number(e.bestPickScore||0)}function gp(e=""){let t=0;for(let a=0;a<String(e).length;a+=1)t=(t<<5)-t+String(e).charCodeAt(a),t|=0;return Math.abs(t)}function va(e={}){return String(e.tokenMint||e.mint||e.address||e.pairAddress||"").trim().toLowerCase()}function wa(e=""){const t=qe();return[e,n.livePairBucket,n.terminalSort,wp(),t?.refreshCount||"",n.livePairsLastUpdatedByBucket[n.livePairBucket]||n.livePairsLastUpdatedAt||"",n.kolScan?.refreshCount||"",n.kolScan?.refreshedAt||n.kolLastUpdatedAt||""].join(":")}function Sa(e=[],t=12,a="",r=0){const s=we(e||[]),o=Math.max(0,Number(t)||s.length);if(!o)return[];if(!a||s.length<=o)return s.slice(0,o);const c=Math.min(Math.max(0,Number(r)||0),Math.max(0,o-1),s.length),l=s.slice(0,c),d=s.slice(c);if(!d.length)return l.slice(0,o);const u=gp(a)%d.length,p=[...d.slice(u),...d.slice(0,u)];return[...l,...p].slice(0,o)}function bp(e=[],t=new Set){return(e||[]).filter(a=>{const r=va(a);return!r||!t.has(r)})}function yp(e={}){const t=mt(e),a=ft(e),r=po(e),s=Pr(e),o=tm(e),c=_(e.marketCapLabel,e.fdvLabel,t>0?M(t):"","checking"),l=_(e.liquidityLabel,a>0?M(a):"","checking"),d=_(e.volumeM15Label,r>0?M(r):"","checking"),u=_(e.volumeH1Label,e.volumeLabel,s>0?M(s):"","checking"),p=_(e.volumeH24Label,o>0?M(o):"","checking");return`
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${i(c)}</strong></span>
      <span><small>Liq</small><strong>${i(l)}</strong></span>
      <span><small>15m</small><strong>${i(d)}</strong></span>
      <span><small>1h</small><strong>${i(u)}</strong></span>
      <span><small>24h</small><strong>${i(p)}</strong></span>
    </div>
  `}function vp(e,{source:t,actionLabel:a="Trade",isKolContext:r=!1}={}){const s=co(e.tokenMint);return`
    <button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(t)}" title="Open chart and buy/sell panel">${i(a)}</button>
    <button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(t)}" title="Quick buy with preset or custom SOL amount">${i(ka())}</button>
    <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
    <button type="button" data-smart-chart-token="${i(e.tokenMint)}" title="Open chart">Chart</button>
    ${r?Au(e):""}
    <button type="button" class="watch-action" data-watched="${s}" title="${s?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(uo(e)||"")}">${s?"Saved":"Watch"}</button>
    ${fp(e,{compact:!0})}
  `}function fw(e,t={}){const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=Sa(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol",d=t.cooksStyle?" is-cooks":"";return c.length?`
    <div class="terminal-token-list">
      ${c.map((u,p)=>{const f=u.scalpSetup||u.momentum||u.category||"live";return`
          <article class="terminal-token-row${d} ${l?"is-kol-signal":""}" data-token-chart="${i(u.tokenMint)}" data-token-chart-source="terminal-row">
            ${ht(u,{priority:p<8})}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${i(u.tokenMint)}" data-token-chart-source="terminal-title">${i(u.symbol||u.shortMint||w(u.tokenMint))}</strong>
                <small>${i(u.name||u.category||"Token")}</small>
                ${l?"":Ll(u)}
                ${lw(u)}
              </div>
              <button type="button" class="ca-copy" data-copy="${i(u.tokenMint)}">${i(w(u.tokenMint))}</button>
              <span class="terminal-token-age">${i(u.pairAgeLabel||zt(u)||"age unknown")} | ${i(f)}</span>
              ${Gs(u)}
            </div>
            ${yp(u)}
            <div class="terminal-token-actions has-dev-info">
              ${vp(u,{source:"terminal-row",actionLabel:r,isKolContext:l})}
            </div>
          </article>
        `}).join("")}
    </div>
  `:F(s,o)}function Tt(e,t={}){if(t.layout==="terminal")return fw(e,t);const a=t.limit||6,r=t.actionLabel||"Trade",s=t.emptyTitle||"No signals loaded",o=t.emptyMessage||"Refresh the feed to load current signals.",c=Sa(e||[],a,t.rotateKey||"",t.stickyCount||0),l=t.context==="kol";return c.length?`
    <div class="compact-signal-list">
      ${c.map((d,u)=>`
        <article class="compact-signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(d.tokenMint)}" data-token-chart-source="compact-row">
          ${ht(d,{priority:u<8})}
          <div class="compact-signal-main">
            <div class="compact-name-row">
              <strong data-token-chart="${i(d.tokenMint)}" data-token-chart-source="compact-title">${i(d.symbol||d.shortMint||w(d.tokenMint))}</strong>
              <small>${i(d.name||d.category||"Token")}</small>
              ${l?"":Ll(d)}
            </div>
            <button type="button" class="ca-copy" data-copy="${i(d.tokenMint)}">${i(w(d.tokenMint))}</button>
            <span>${i(d.pairAgeLabel||zt(d)||"age unknown")} | ${i(d.scalpSetup||d.momentum||d.category||"live")}</span>
            ${mw(d)}
            ${Gs(d)}
          </div>
          ${uw(d)}
          <div class="compact-row-actions has-dev-info">
            ${vp(d,{source:"compact-row",actionLabel:r,isKolContext:l})}
          </div>
        </article>
      `).join("")}
    </div>
  `:F(s,o)}function bn(e){const t=le(e,e==="trade"?n.selectedTradePresetId:n.selectedBundlePresetId);if(!t)return"Custom / manual";const a=[t.name,`${t.amountSol} SOL`,`TP ${t.takeProfitPct}`,`SL ${t.stopLossPct}`];return t.sellDelay&&t.sellDelay!=="off"&&a.push(`Timer ${t.sellDelay}`),a.join(" | ")}function k0(){return`
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${i(bn("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${ct("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${ct("bundle",n.selectedBundlePresetId)}
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
  `}function yr(e){const t=Number(e);return!Number.isFinite(t)||t<=0?"":t>=1?t.toFixed(2).replace(/\.?0+$/,""):t.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}function Y(e=n.quickBuyAmountOverride){let t=String(e||"").replace(/[^0-9.]/g,"");const a=t.indexOf(".");if(a!==-1&&(t=t.slice(0,a+1)+t.slice(a+1).replace(/\./g,"")),!t||t===".")return"";const r=Number(t);return!Number.isFinite(r)||r<=0?"":yr(r)}function ut(){return le("trade",n.selectedTradePresetId)}function hw(){return le("bundle",n.selectedBundlePresetId)}function ze(e=ut()){return Y()||yr(e?.amountSol)}function gw(e=hw()){return Y()||yr(e?.amountSol)||"0.1"}const pl=Object.freeze([{id:"conservative",label:"Conservative",description:"Smaller entry with a simple 2x partial take-profit and wider stop.",takeProfit:[{percentGain:100,sellPercent:50}],stopLoss:{percentLoss:25},sellPercent:"50"},{id:"scalp",label:"Scalp",description:"Fast setup for smaller moves with a tighter stop.",takeProfit:[{percentGain:35,sellPercent:100}],stopLoss:{percentLoss:12},sellPercent:"100"},{id:"degen",label:"Degen",description:"Normal size with a partial 2x exit. Highest variance.",takeProfit:[{percentGain:100,sellPercent:30}],stopLoss:{percentLoss:0},sellPercent:"30"}]);function Xs(e=""){return pl.find(t=>t.id===e)||pl[0]}function ml(e=""){return String(e||"").toUpperCase()==="BUY"?"scalp":"conservative"}function bw(e=Xs()){const t=Array.isArray(e.takeProfit)?e.takeProfit[0]:null,a=t?`TP +${t.percentGain}% / sell ${t.sellPercent}%`:"TP off",r=e.stopLoss?.percentLoss?`SL -${e.stopLoss.percentLoss}%`:"SL off";return`${a} | ${r}`}function yw(e={},t=Xs()){const a=Array.isArray(t.takeProfit)?t.takeProfit[0]:null;return{id:`protected-${t.id}`,name:`Protected ${t.label}`,amountSol:e.amountSol,walletIndex:e.walletIndex,walletIndexes:[e.walletIndex],slippageBps:e.slippageBps||"400",takeProfitPct:a?.percentGain?String(a.percentGain):"0",stopLossPct:t.stopLoss?.percentLoss?String(t.stopLoss.percentLoss):"0",sellDelay:"off",sellPercent:a?.sellPercent?String(a.sellPercent):t.sellPercent||"100"}}function vw(e=""){if(pe(e)){const a=ue();return`${a?.provider||"Browser wallet"} ${a?.publicKey?w(a.publicKey):""}`.trim()}const t=n.wallets.find(a=>String(a.index)===String(e));return t?`${t.index}. ${t.label||"Managed wallet"}`:"No wallet selected"}function Re(){return(!n.terminalLaunchFilters||typeof n.terminalLaunchFilters!="object")&&(n.terminalLaunchFilters={}),n.terminalLaunchFilters.socials=n.terminalLaunchFilters.socials||{},n.terminalLaunchFilters.quotes=n.terminalLaunchFilters.quotes||{},n.terminalLaunchFilters.audits=n.terminalLaunchFilters.audits||{},n.terminalLaunchFilters}function At(e=""){const t=new Set;return String(e||"").split(/[\n,]+/).flatMap(a=>String(a||"").trim().split(/\s+/)).map(a=>a.trim().toLowerCase()).filter(a=>!a||t.has(a)?!1:(t.add(a),!0)).slice(0,3)}function wp(e=Re()){const t=Object.keys(e.socials||{}).filter(s=>e.socials[s]).sort().join(","),a=Object.keys(e.quotes||{}).filter(s=>e.quotes[s]).sort().join(","),r=Object.keys(e.audits||{}).filter(s=>e.audits[s]).sort().join(",");return[At(e.keywords).join(","),At(e.excludeKeywords).join(","),t,a,r].join("|")}function yn(e=Re()){return!!wp(e).replace(/\|/g,"")}function Js(e={}){return[e.tokenMint,e.mint,e.address,e.pairAddress,e.baseMint,e.symbol,e.baseSymbol,e.name,e.tokenName,e.category,e.signalType,e.source,e.dexId,e.dexName,e.platform,e.quoteSymbol,e.quoteMintSymbol,e.quoteToken,e.twitterUrl,e.xUrl,e.telegramUrl,e.websiteUrl,e.youtubeUrl,e.tiktokUrl,e.instagramUrl,e.pairUrl,e.pumpUrl,e.socials,e.links,...e.riskFlags||[],...e.reasons||[],...e.auditFlags||[]].filter(Boolean).join(" ").toLowerCase()}function ww(e={},t=""){const a=Js(e),r=!!(e.twitterUrl||e.xUrl||e.telegramUrl||e.websiteUrl||e.youtubeUrl||e.tiktokUrl||e.instagramUrl||/twitter|x\.com|telegram|t\.me|website|youtube|youtu\.be|tiktok|instagram/.test(a));return t==="twitter"?!!(e.twitterUrl||e.xUrl||/twitter|x\.com/.test(a)):t==="website"?!!(e.websiteUrl||/\bwebsite\b|https?:\/\/(?!x\.com|twitter\.com|t\.me|telegram\.org)/.test(a)):t==="telegram"?!!(e.telegramUrl||/telegram|t\.me/.test(a)):t==="youtube"?!!(e.youtubeUrl||/youtube|youtu\.be/.test(a)):t==="tiktok"?!!(e.tiktokUrl||/tiktok/.test(a)):t==="instagram"?!!(e.instagramUrl||/instagram/.test(a)):t==="dexPaid"?!!(e.dexPaid||e.isDexPaid||/dex paid|paid dex|dexpaid/.test(a)):t==="pumpLive"?!!(e.pumpLivestream||e.pumpLive||e.liveStreamUrl||/pump livestream|pump live|livestream/.test(a)):t==="minSocial"?r:!0}function Sw(e={}){const t=String(e.quoteSymbol||e.quoteMintSymbol||e.quoteToken||e.quoteTicker||"").trim().toUpperCase();if(t)return t;const a=Js(e).toUpperCase();return a.includes("USDC")?"USDC":a.includes("USD1")?"USD1":a.includes("WSOL")||a.includes("SOL")?"WSOL":""}function Ys(e={},t=[]){const a=Js(e);return t.some(r=>r.test(a))}function kw(e={},t=""){if(t==="showHidden")return!0;if(t==="mintAuth")return e.mintAuthorityActive===!0||e.isMintable===!0?!1:!Ys(e,[/mintauthorityactive/i,/mint authority active/i,/\bmintable\b/i,/mint auth enabled/i]);if(t==="freezeAuth")return e.freezeAuthorityActive===!0||e.isFreezeable===!0||e.isFreezable===!0?!1:!Ys(e,[/freezeauthorityactive/i,/freeze authority active/i,/freezable/i,/freezeable/i,/freeze auth enabled/i]);if(t==="lpBurned")return e.lpBurned===!0||e.liquidityBurned===!0?!0:Ys(e,[/lp burned/i,/liquidity burned/i,/burned lp/i]);if(t==="top10Hold"){const a=O(e.topHoldersPct,e.top10HoldersPct,e.topTenHoldersPct);return a>0?a<=30:!Ys(e,[/high holder concentration/i,/top holders high/i,/top 10 high/i])}return!0}function vn(e=[],t=Re()){const a=we(e||[]);if(!yn(t))return a;const r=At(t.keywords),s=At(t.excludeKeywords),o=Object.keys(t.socials||{}).filter(d=>t.socials[d]),c=Object.keys(t.quotes||{}).filter(d=>t.quotes[d]).map(d=>d.toUpperCase()),l=Object.keys(t.audits||{}).filter(d=>t.audits[d]);return a.filter(d=>{const u=Js(d);return!(r.length&&!r.some(p=>u.includes(p))||s.length&&s.some(p=>u.includes(p))||o.some(p=>!ww(d,p))||c.length&&!c.includes(Sw(d))||l.some(p=>!kw(d,p)))})}function fl(e=[],t=[]){const a=Re();if(!yn(a))return"";const r=At(a.keywords),s=At(a.excludeKeywords),o=[];r.length&&o.push(`watching ${r.map(l=>`"${l}"`).join(", ")}`),s.length&&o.push(`excluding ${s.map(l=>`"${l}"`).join(", ")}`);const c=Math.max(0,we(e).length-we(t).length);return`<div class="terminal-launch-filter-summary">${i(o.join(" | ")||"filters active")} - ${i(t.length)}/${i(we(e).length)} visible${c?`, ${i(c)} hidden`:""}</div>`}function vr(e=[],t="pairs"){const a=Re(),r=At(a.keywords),s=r.length?r.map(c=>`"${c}"`).join(", "):"your launch filters",o=we(e).length;return F("Watching fresh launches",o?`No ${t} match ${s} yet. ${o} fresh rows were checked; keep this open and the live refresh will surface it when it launches.`:`No fresh rows are loaded yet. Keep this open or tap Refresh Feeds while watching ${s}.`)}function hl(e="terminal",t={}){const a=Re(),r=yn(a),s=!!(a.open||r),o=Number.isFinite(Number(t.rawCount))?Number(t.rawCount):0,c=Number.isFinite(Number(t.visibleCount))?Number(t.visibleCount):o;return`
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
            ${$f.map(([l,d])=>`
              <label><input type="checkbox" data-terminal-filter-social="${i(l)}" ${a.socials?.[l]?"checked":""}> ${i(d)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Quotes</legend>
            ${Tf.map(([l,d])=>`
              <label><input type="checkbox" data-terminal-filter-quote="${i(l)}" ${a.quotes?.[l]?"checked":""}> ${i(d)}</label>
            `).join("")}
          </fieldset>
          <fieldset>
            <legend>Audit</legend>
            ${Af.map(([l,d])=>`
              <label><input type="checkbox" data-terminal-filter-audit="${i(l)}" ${a.audits?.[l]?"checked":""}> ${i(d)}</label>
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
  `}function Sp(){Kr&&window.clearTimeout(Kr),Kr=window.setTimeout(()=>{Kr=null,Z("live"),Z("launch"),Z("sniper"),h()},180)}function Qs(e={}){const t=Number(e.pairCreatedAt||e.createdAt||0);if(t>0){const s=t<1e10?t*1e3:t;return Math.max(0,Math.round((Date.now()-s)/1e3))}const a=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase()),r=Number(e.pairAgeSeconds);return a&&Number.isFinite(r)&&r>=0?r:Number.POSITIVE_INFINITY}const $w=100,Tw=7200,Aw=75e4,Pw=86400,Cw=2e6,Lw=28e3,kp=18e4,xw=16e4;function $p(){const e=dp();return we([...n.livePairs?.rows||[],...n.livePairsByBucket.live?.rows||[],...n.livePairsByBucket.under1h?.rows||[],...n.livePairsByBucket.under3h?.rows||[],...n.livePairsByBucket.under1d?.rows||[],...n.scan?.rows||[],...n.kolScan?.rows||[]]).map(t=>pp(t,e.get(String(t?.tokenMint||"")))).filter(t=>t?.tokenMint&&!mr(t))}function wn(e={}){return O(e.marketCap,e.fdv)}function Tp(e={}){return O(e.liquidityUsd)}function Ap(e={}){return O(e.volumeM5,e.volume5m,e.volumeM15,e.volumeM30,e.volumeH1,e.volumeH24,e.volumeUsd)}function gl(e={}){if(wr(e))return!1;const t=Qs(e);return!Number.isFinite(t)||t<0||t>Tw||wn(e)>Aw?!1:Kt(e)<70}function bl(e={}){if(wr(e))return!1;const t=Kt(e),a=wn(e),r=a>=Lw&&a<=kp;return t>=55&&(!a||a<=kp)||r}function Pp(e={}){if(gl(e)||bl(e)||wr(e))return!1;const t=Qs(e);return Number.isFinite(t)&&(t<0||t>Pw)||wn(e)>Cw?!1:Tp(e)>0||Ap(e)>0||Number(e.bestPickScore||e.score||0)>0||Array.isArray(e.reasons)&&e.reasons.length>0}function Cp(e={}){return[e.tokenMint,e.symbol,e.name,e.source,e.category,e.dexId,e.dexName,e.poolType,e.platform,e.raydiumPool,e.pairUrl,...e.riskFlags||[],...e.reasons||[]].filter(Boolean).join(" ").toLowerCase()}function Kt(e={}){const t=O(e.bondingProgressPct,e.bondingProgress,e.bonding_curve_progress,e.bondingCurveProgress,e.pumpProgress,e.graduationProgress,e.completion,e.completePct);if(t>0)return t<=1?t*100:t;const a=wn(e),r=Cp(e);return(!!e.isPump||r.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"))&&a>0?Math.max(1,Math.min(99,a/69e3*100)):0}function wr(e={}){if(e.isGraduated||e.graduated||e.bonded||e.isBonded||e.complete||e.completed||e.bondingComplete||e.raydiumPool||e.raydium_pool||e.poolAddress)return!0;const t=Cp(e);if(/\b(graduated|bonded|bonding complete|complete)\b/.test(t))return!0;const a=!!e.isPump||t.includes("pump")||String(e.tokenMint||"").toLowerCase().endsWith("pump"),r=wn(e);return a&&r>=xw?!0:!!(a&&/\b(raydium|meteora|orca)\b/.test(t))}function Lp(e={}){if(wr(e))return"graduated";const t=String(e.slimeScopeCategory||"").trim().toLowerCase();return t==="graduated"?"graduated":bl(e)||t==="graduating"?"graduating":gl(e)?"new":(t==="steady"||t==="unknown"||Pp(e),"steady")}function xp(e={}){const t=Number(e.bestPickScore||e.score||0),a=Ap(e),r=Tp(e),s=wn(e),o=Qs(e),c=Number.isFinite(o)?Math.max(0,86400-o)/86400:0;return t*1e3+Math.log10(a+1)*160+Math.log10(r+1)*120+Math.log10(s+1)*80+c*100}function Mp(e=[]){return[...e].sort((t,a)=>xp(a)-xp(t)||nt(t,a))}function Mw(e=[],t=[],a=$w){const r=new Set,s=[];for(const o of[...e,...t]){const c=String(o?.tokenMint||"");if(!(!c||r.has(c))&&(r.add(c),s.push(o),s.length>=a))break}return s}function Bp(e=n.slimeScopeMode){const t=$p(),a=e==="graduated"?"graduated":e==="graduating"?"graduating":e==="steady"?"steady":"new",r=t.filter(l=>Lp(l)===a),s=t.filter(l=>{const d=Lp(l);return a==="graduated"?d==="graduated"||wr(l):a==="graduating"?d==="graduating"||bl(l):a==="steady"?d==="steady"||Pp(l):d==="new"||gl(l)}),o=a==="new"?[...r].sort(nt):Mp(r),c=a==="new"?we(s).sort(nt):Mp(s);return Mw(o,c)}function Bw(e=[],t="new"){const a=ot(`slimeScope:${t}`,e).slice(0,12);return a.length?a.map((r,s)=>{const o=r.pairAgeLabel||zt(r)||"age ?",c=_(r.marketCapLabel,r.fdvLabel,M(mt(r)),"checking"),l=_(r.liquidityLabel,M(ft(r)),"checking"),d=_(r.volumeM15Label,M(po(r)),"checking");return`
      <article class="slime-scope-column-row" data-token-chart="${i(r.tokenMint)}" data-token-chart-source="slime-scope-column">
        ${ht(r,{priority:s<4})}
        <div class="slime-scope-column-main">
          <strong>${i(r.symbol||r.shortMint||w(r.tokenMint))}</strong>
          <small>${i(w(r.tokenMint))} · ${i(o)}</small>
          <span>${i(r.name||r.category||"Token")}</span>
        </div>
        <div class="slime-scope-column-metrics">
          <span>MC <b>${i(c)}</b></span>
          <span>Liq <b>${i(l)}</b></span>
          <span>15m <b>${i(d)}</b></span>
        </div>
        <button type="button" data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="slime-scope-column">${i(ze()||"0.1")}</button>
      </article>
    `}).join(""):`<div class="slime-scope-column-empty">Warming up ${i(t)} pairs.</div>`}function Rw(){return`
    <div class="slime-scope-web-columns" aria-label="Slime Scope desktop columns">
      ${[["new","New","Fresh launches"],["graduating","Graduating","Near migration"],["graduated","Graduated","Moved to market"]].map(([t,a,r])=>{const s=Bp(t);return`
          <section class="slime-scope-column" data-scope-column="${i(t)}">
            <header>
              <div>
                <h4>${i(a)}</h4>
                <small>${i(r)}</small>
              </div>
              <span>${i(s.length)} live</span>
            </header>
            <div class="slime-scope-column-list">
              ${Bw(s,t)}
            </div>
          </section>
        `}).join("")}
    </div>
  `}function Iw(){const e=Ar(),[,,t]=e,a=Yc(n.slimeScopeMode),s=!!(j("slimeScope").inFlight||n.livePairsLoadingByBucket?.[a]),o=n.livePairsRefreshErrorByBucket?.[a],c=we(Qp($p(),e[0])),l=ot("slimeScope",c),d=l.length?tr()?pt(l,{context:"live",shareBuilder:Pa,hideToolbar:!0}):Tt(l,{layout:"terminal",limit:Math.max(1,l.length),actionLabel:"Trade"}):o?F("Unable to load pairs. Try refreshing.","Cook Spot hit a snag — it keeps retrying, or tap Refresh Scope."):s?F("Loading Cook Spot…","Scanning DEX, boosted, and pump pairs for this category."):F("No pairs found for this filter yet","Try another category — Cook Spot keeps scanning in the background.");return`
    <section class="slime-scope-page">
      <div class="command-controls slime-scope-controls">
        <div class="cooks-category-label cook-spot-head">${$S(e)}<span>${i(t)}</span></div>
        ${Zp(c.length,ua())}
        ${su("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs ${s?"disabled":""}>${s?"Refreshing...":"Refresh Scope"}</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${d}
        ${da("slimeScope",c,"Cook Spot pairs")}
      </article>
      ${Rw()}
    </section>
  `}function $0(){const e=qe(),t=we(e?.rows||[]),a=vn(t),r=[...a].sort(nt),s=up(n.kolScan?.rows||[]).filter(C=>!mr(C)),o=vn(s),c=gr(t,s),l=vn(c),d=yn(),u=Sa(l,8,wa("best-picks"),2),p=new Set(u.map(va).filter(Boolean)),f=bp(r,p),y=Sa(f.length?f:r,12,wa("live-pairs"),0),b=new Set([...p,...y.map(va).filter(Boolean)]),v=bp(o,b),P=Sa(v.length?v:o,12,wa("kol-signals"),1),A=!!n.livePairsLoadingByBucket[n.livePairBucket],g=ua(),$="Trade";return`
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${A?"Refreshing":"Live"}${g?` | ${i(Xn(nn(g)||0))}`:""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${Ot.map(([C,B])=>{const U=n.livePairsByBucket[C]?.rows?.length,H=Number.isFinite(Number(U))?` (${U})`:"";return`<button data-live-pair-bucket="${C}" data-active="${n.livePairBucket===C}">${B}${H}</button>`}).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${kf.map(([C,B])=>`<option value="${C}" ${n.terminalSort===C?"selected":""}>${B}</option>`).join("")}
            </select>
          </label>
          ${su("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${A?"Refreshing...":"Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing Wallet...":"Refresh Wallet"}</button>
        </div>
        ${hl("terminal",{rawCount:t.length,visibleCount:a.length})}
        ${fl(t,a)}

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${u.length?Tt(u,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:$,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."}):d?vr(c,"best picks"):Tt(u,{layout:"terminal",cooksStyle:!0,limit:8,actionLabel:$,emptyTitle:"No Best Picks yet",emptyMessage:"Refresh Live Pairs to score current pairs."})}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Cooks</h4><button data-tab="live">Open</button></header>
            ${y.length?Tt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:$}):d?vr(t,"live pairs"):Tt(y,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:$})}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${n.kolLoading?"Loading...":"Refresh"}</button></header>
            ${P.length?Tt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:$,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."}):d?vr(s,"KOL signals"):Tt(P,{layout:"terminal",cooksStyle:!0,limit:12,actionLabel:$,emptyTitle:"No KOL signals loaded",emptyMessage:"Refresh KOL Tracker to load signals."})}
          </article>
        </section>

        ${lS()}
      </main>
    </section>
  `}function T0(){const e=ut();if(!e)return"Trade";const t=ze(e);return t?`Buy ${t} SOL`:Dm(e,"Trade")}function ka(){const e=ut(),t=ze(e);return t?`Buy ${t} SOL`:"Quick Buy"}function Zs(){const e=ka();document.querySelectorAll("[data-quick-buy-token]").forEach(t=>{S(t,e)})}function $a(e=""){const t=String(e||"").trim();if(!t)return null;const a=pr().find(s=>String(s?.tokenMint||s?.mint||s?.tokenAddress||"").trim()===t);if(a)return a;const r=n.smartChartTokenRef||{};return String(r.tokenMint||r.mint||"").trim()===t?r:{tokenMint:t,shortMint:w(t),symbol:w(t),dexUrl:Q(t)}}function Ow(e=""){return{normal_buy:"Normal buy size can be considered",small_buy:"Trade small or use protection",watch_only:"Watch-only unless you accept high risk",avoid:"Avoid recommended"}[e]||"Review risk before buying"}function Ew(e=""){return{conservative:"Conservative",scalp:"Scalp",degen:"Degen"}[e]||"Conservative"}function Rp(e={}){if(!D("slimeShieldEnabled",!0))return"";const t=at(e),a=String(e.tokenMint||t.mint||"").trim(),r=t.verdict||"CAUTION";return`
    <article class="slimeshield-card slimeshield-${i(hn(r))}">
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
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(a)}" data-protected-buy-preset="${i(t.protectedBuyPreset||ml(r))}" data-protected-buy-source="slimeshield-card">Protected Buy</button>`:""}
      </div>
    </article>
  `}function Ip(e=[],t="risk",a="No strong signal cached yet."){const r=(Array.isArray(e)?e:[]).filter(s=>t==="positive"?s.severity==="positive":s.severity!=="positive").slice(0,5);return r.length?`
    <ul class="slimeshield-factor-list">
      ${r.map(s=>`
        <li>
          <strong>${i(s.label||s.key||"Signal")}</strong>
          <span>${i(s.message||"Cached signal available.")}</span>
        </li>
      `).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(a)}</p>`}function Op(e=""){const t=String(e||n.smartChartToken||n.tradeToken||"").trim();!t||!D("slimeShieldEnabled",!0)||(n.slimeShieldDetails={open:!0,tokenMint:t},n.slimeShieldStatus="",Ka(),Aa(),eo(t,{force:!0}),D("replayBeforeBuyEnabled",!0)&&kl(t,{force:!0}))}function yl(){n.slimeShieldDetails={open:!1,tokenMint:""},n.slimeShieldStatus="",Aa(),Vr()}async function eo(e="",t={}){const a=String(e||"").trim();if(!a||!D("slimeShieldEnabled",!0))return null;if(!t.force&&n.slimeShieldResults?.[a])return n.slimeShieldResults[a];if(n.slimeShieldLoading?.[a])return null;n.slimeShieldLoading={...n.slimeShieldLoading||{},[a]:!0},Aa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/slimeshield?${r.toString()}`,{timeoutMs:t.force?6500:2500,preserveSafeError:!0}))?.slimeshield||null;return o&&(n.slimeShieldResults={...n.slimeShieldResults||{},[a]:o},se(o.cacheHit?"slimeshieldCacheHit":"slimeshieldCacheMiss"),n.slimeShieldStatus=o.cacheHit?"Loaded from cache.":"Updated from local data."),o}catch(r){return n.slimeShieldStatus=r?.message||"SlimeShield details are temporarily unavailable.",null}finally{const r={...n.slimeShieldLoading||{}};delete r[a],n.slimeShieldLoading=r,Aa()}}function Fw(e=""){const t=$a(e)||fn(e)||{tokenMint:e},a=br(t),r=a.likelyDevWallet||t.creatorWallet||t.deployerWallet||t.poolCreator||"",s=[...Array.isArray(a.externalLinks)?a.externalLinks:[],{label:"Solscan Token",url:e?`https://solscan.io/token/${encodeURIComponent(e)}`:""},{label:"Dex",url:t.dexUrl||Q(e)},{label:"Solscan Wallet",url:r?`https://solscan.io/account/${encodeURIComponent(r)}`:""},{label:"KOLscan Wallet",url:r?`https://kolscan.io/account/${encodeURIComponent(r)}`:""},{label:"Bubblemap",url:e?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(e)}`:""},{label:"X",url:t.twitterUrl||t.xUrl},{label:"TG",url:t.telegramUrl},{label:"Website",url:t.websiteUrl}].filter((o,c,l)=>/^https?:\/\//i.test(String(o.url||""))&&l.findIndex(d=>String(d.url||"")===String(o.url||""))===c).slice(0,8);return{mint:e,pairAddress:t.pairAddress||"",likelyDevWallet:a.likelyDevWallet||null,confidence:a.confidence||"unknown",status:ya(a.status),label:a.label||js(a.status),score:50,summary:a.summary||"Not enough dev-wallet history yet.",currentPosition:null,historicalStats:{likelyDevWallet:a.likelyDevWallet||null,launchesTracked:0,recentLaunches:[]},linkedWalletSignals:{notes:[]},riskReasons:a.likelyDevWallet?[]:["No reliable creator wallet detected yet."],positiveReasons:[],suggestedAction:"Check SlimeShield and liquidity before buying.",updatedAt:a.updatedAt||new Date().toISOString(),externalLinks:s,dataSource:"ui-fallback"}}function Ep(e=""){const t=String(e||"").trim();return n.devInfoResults?.[t]||Fw(t)}function Sr(e,t=""){const a=Number(e);return Number.isFinite(a)?`${Math.round(a*10)/10}${t}`:"n/a"}function Fp(e=""){const t=String(e||"unknown").trim().toLowerCase();return t==="high"?"High confidence":t==="medium"?"Medium confidence":t==="low"?"Low confidence":"Unknown"}function to(e){const t=Number(e);return Number.isFinite(t)?t<60?`${Math.max(0,Math.round(t))}m`:`${Math.round(t/60*10)/10}h`:"n/a"}function Ww(e=""){const t=String(e||"").trim();return t?w(t):"Unknown"}async function Wp(e="",t={}){const a=String(e||"").trim();if(!a||!D("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoSummaries?.[a])return n.devInfoSummaries[a];const r=`summary:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0};try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/summary/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?4500:2500,preserveSafeError:!0}))?.devInfoSummary||null;return c&&(n.devInfoSummaries={...n.devInfoSummaries||{},[a]:c},se(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch{return null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,t.silent||Ta()}}async function _p(e="",t={}){const a=String(e||"").trim();if(!a||!D("devInfoEnabled",!0))return null;if(!t.force&&n.devInfoResults?.[a])return n.devInfoResults[a];const r=`details:${a}`;if(n.devInfoLoading?.[r])return null;n.devInfoLoading={...n.devInfoLoading||{},[r]:!0},Ta();try{const s=t.force?"?force=true":"",c=(await k(`/api/web/dev-info/${encodeURIComponent(a)}${s}`,{timeoutMs:t.force?7e3:3e3,preserveSafeError:!0}))?.devInfo||null;return c&&(n.devInfoResults={...n.devInfoResults||{},[a]:c},n.devInfoSummaries={...n.devInfoSummaries||{},[a]:{mint:a,status:c.status||"unknown",label:c.label||js(c.status),confidence:c.confidence||"unknown",summary:c.summary||"",likelyDevWallet:c.likelyDevWallet||null,currentPositionStatus:c.currentPosition?.positionStatus||"unknown",launchesTracked:c.historicalStats?.launchesTracked||0,externalLinks:Array.isArray(c.externalLinks)?c.externalLinks.slice(0,8):[],updatedAt:c.updatedAt||""}},n.devInfoStatus=c.cacheHit?"Loaded from cache.":"Updated from public sources and local history.",se(c.cacheHit?"devInfoCacheHit":"devInfoCacheMiss")),c}catch(s){return n.devInfoStatus=s?.message||"Dev Info is temporarily unavailable.",null}finally{const s={...n.devInfoLoading||{}};delete s[r],n.devInfoLoading=s,Ta()}}function _w(e=""){const t=String(e||"").trim();!t||!D("devInfoEnabled",!0)||(n.devInfoDetails={open:!0,tokenMint:t},n.devInfoStatus="",Ka(),Ta(),Wp(t,{force:!0,silent:!0}),_p(t,{force:!0}))}function vl(){n.devInfoDetails={open:!1,tokenMint:""},n.devInfoStatus="",Ta(),Vr()}function Nw(e){return e==="radar"?"📡":e==="move"?"📈":"•"}async function Dw(){try{const e=await k("/api/web/return-summary");n.returnSummary={loaded:!0,events:Array.isArray(e.events)?e.events:[]}}catch{n.returnSummary={loaded:!0,events:[]}}wl()}async function Uw(){n.returnSummaryDismissed=!0,wl();try{await k("/api/web/return-summary",{method:"POST",body:JSON.stringify({action:"seen"})})}catch{}}function wl(){let e=document.querySelector("[data-return-summary-root]");e||(e=document.createElement("div"),e.dataset.returnSummaryRoot="true",document.body.appendChild(e));const t=n.returnSummary,a=t&&Array.isArray(t.events)?t.events:[];if(!!!(t&&t.loaded&&a.length&&!n.returnSummaryDismissed&&n.route==="terminal")){e.__lastReturn!==""&&(e.innerHTML="",e.__lastReturn="");return}const o=`
    <div class="return-summary-card" role="status">
      <div class="return-summary-head">
        <strong>📋 Since your last visit</strong>
        <button type="button" data-return-dismiss aria-label="Dismiss">×</button>
      </div>
      <ul>${a.slice(0,6).map(c=>`
    <li><button type="button" class="return-summary-item" data-token-chart="${i(c.tokenMint||"")}" data-token-chart-source="return-summary"><span>${Nw(c.kind)}</span> ${i(c.title||"Update")}</button></li>`).join("")}</ul>
      ${a.length>6?`<small>+${a.length-6} more</small>`:""}
    </div>`;e.__lastReturn!==o&&(e.__lastReturn=o,e.innerHTML=o)}function qw(e){return e==="tp"?"🎯":e==="sl"?"🛑":e==="mc_above"?"📈":e==="mc_below"?"📉":"📡"}function Hw(e){const t=Number(e.value)||0;return e.type==="tp"?`Take-profit · +${Math.round(t)}%`:e.type==="sl"?`Stop-loss · −${Math.round(t)}%`:e.type==="mc_above"?`Market cap crosses above ${M(t)}`:e.type==="mc_below"?`Market cap falls below ${M(t)}`:String(e.type||"")}function Kw(e="",t=""){n.radarDrawer={open:!0,tokenMint:String(e||"").trim(),symbol:String(t||"").trim()},n.radarStatus="",Vt(),zw()}function Vw(){n.radarDrawer={open:!1,tokenMint:"",symbol:""},Vt()}async function zw(){try{const e=await k("/api/web/radar");n.radarRules=Array.isArray(e.rules)?e.rules:[]}catch(e){n.radarStatus=e.message||"Could not load Radar."}Vt()}async function jw(){const e=document.querySelector("[data-radar-drawer-root]"),t=n.radarDrawer||{};if(!e||!t.tokenMint)return;const a=e.querySelector("[data-radar-type]")?.value||"tp",r=Number(e.querySelector("[data-radar-value]")?.value||0);if(!(r>0)){n.radarStatus="Enter a number greater than 0.",Vt();return}const s={push:e.querySelector("[data-radar-ch-push]")?.checked!==!1,telegram:!!e.querySelector("[data-radar-ch-tg]")?.checked};try{n.radarStatus="Setting alert…",Vt(),await J(null,"Opening your SlimeWire profile for Radar…");const o=await k("/api/web/radar",{method:"POST",body:JSON.stringify({action:"add",rule:{tokenMint:t.tokenMint,symbol:t.symbol,type:a,value:r,channels:s}})});n.radarRules=Array.isArray(o.rules)?o.rules:n.radarRules,n.radarStatus="✅ Alert set — SlimeWire is watching it for you."}catch(o){n.radarStatus=o.message||"Could not set the alert."}Vt()}async function Np(e,t){try{const a=await k("/api/web/radar",{method:"POST",body:JSON.stringify({action:e,id:t})});n.radarRules=Array.isArray(a.rules)?a.rules:n.radarRules}catch(a){n.radarStatus=a.message||"Could not update the alert."}Vt()}function Vt(){let e=document.querySelector("[data-radar-drawer-root]");e||(e=document.createElement("div"),e.dataset.radarDrawerRoot="true",document.body.appendChild(e));const t=n.radarDrawer||{};if(!t.open){e.innerHTML="",e.__lastDrawerHtml="";return}const a=Array.isArray(n.radarRules)?n.radarRules:[],r=t.symbol||(t.tokenMint?w(t.tokenMint):""),s=t.tokenMint?`
    <section data-radar-add>
      <h4>New alert${r?` · ${i(r)}`:""}</h4>
      <div class="radar-form">
        <select data-radar-type aria-label="Alert type">
          <option value="tp">🎯 Take-profit (+%)</option>
          <option value="sl">🛑 Stop-loss (−%)</option>
          <option value="mc_above">📈 Market cap above ($)</option>
          <option value="mc_below">📉 Market cap below ($)</option>
        </select>
        <input data-radar-value type="number" min="0" step="any" inputmode="decimal" placeholder="e.g. 50 or 40000" aria-label="Alert value" />
        <button type="button" class="primary" data-radar-submit>Set alert</button>
      </div>
      <div class="radar-channels">
        <label><input type="checkbox" data-radar-ch-push checked /> 🔔 Push</label>
        <label><input type="checkbox" data-radar-ch-tg /> ✈️ Telegram</label>
      </div>
      <p class="slimeshield-muted">% alerts use the price right now as the baseline. SlimeWire checks every few minutes and pings you with the reason.</p>
    </section>`:"",o=a.length?`
    <ul class="radar-rule-list">
      ${a.map(l=>`
        <li class="radar-rule ${l.enabled===!1?"is-off":""}">
          <span class="radar-rule-icon">${qw(l.type)}</span>
          <div class="radar-rule-body">
            <strong>${i(l.symbol||w(l.tokenMint))}</strong>
            <small>${i(Hw(l))}</small>
          </div>
          <button type="button" class="radar-rule-toggle" data-radar-toggle="${i(l.id)}" title="${l.enabled===!1?"Enable":"Pause"}">${l.enabled===!1?"Off":"On"}</button>
          <button type="button" class="radar-rule-remove" data-radar-remove="${i(l.id)}" title="Remove alert" aria-label="Remove alert">×</button>
        </li>`).join("")}
    </ul>`:'<p class="slimeshield-muted">No alerts yet. Set one above and SlimeWire watches the market for you — pinging the site, your browser, and Telegram with the reason it fired.</p>',c=`
    <div class="slimeshield-drawer-backdrop" data-radar-close></div>
    <aside class="slimeshield-drawer radar-drawer" role="dialog" aria-modal="true" aria-label="My Radar">
      <header>
        <div>
          <span>📡 My Radar</span>
          <h3>Set it once. SlimeWire watches.</h3>
        </div>
        <button type="button" aria-label="Close Radar" data-radar-close>Close</button>
      </header>
      ${s}
      <section>
        <h4>Your alerts${a.length?` · ${a.length}`:""}</h4>
        ${o}
      </section>
      ${n.radarStatus?`<small class="slimeshield-status">${i(n.radarStatus)}</small>`:""}
      <p class="slimeshield-safety-copy">Radar is informational, not financial advice. Alerts can lag the market by a few minutes.</p>
    </aside>`;Sn(e,c,".radar-drawer")}function Gw(e="render"){!D("devInfoEnabled",!0)||Go||n.route==="terminal"&&(Go=window.setTimeout(()=>{Go=null,Xw(e)},300))}async function Xw(e="render"){if(!D("devInfoEnabled",!0)||Ha())return;const t=ur().slice(0,16),a=[],r=new Set;for(const s of t){const o=String(s.tokenMint||s.mint||s.tokenAddress||"").trim();if(!(!o||r.has(o)||n.devInfoSummaries?.[o]||n.devInfoLoading?.[`summary:${o}`])&&(r.add(o),a.push(o),a.length>=8))break}a.length&&(await Promise.allSettled(a.map(s=>Wp(s,{silent:!0}))),W({component:"dev-info",action:"prefetch-visible-summaries",durationMs:0,resultCount:a.length,details:e}),Ha()||Va("dev-info-prefetch"))}function ao(e=[],t="No strong cached signal yet."){const a=Array.isArray(e)?e.filter(Boolean).slice(0,5):[];return a.length?`
    <ul class="slimeshield-factor-list">
      ${a.map(r=>`<li><span>${i(r)}</span></li>`).join("")}
    </ul>
  `:`<p class="slimeshield-muted">${i(t)}</p>`}function no(e,t="Not cached yet"){const a=String(e||"").trim();return!a||a.toLowerCase()==="warming"||a.toLowerCase()==="checking"?t:a}function ro(e,t=r=>String(r),a="Not cached yet"){return Number.isFinite(e)&&e>0?t(e):a}function Sn(e,t,a=""){if(e.__lastDrawerHtml===t)return!1;const r=a?e.querySelector(a):null,s=r?r.scrollTop:0;if(e.innerHTML=t,e.__lastDrawerHtml=t,a&&s){const o=e.querySelector(a);o&&(o.scrollTop=s)}return!0}function Ta(){let e=document.querySelector("[data-dev-info-drawer-root]");e||(e=document.createElement("div"),e.dataset.devInfoDrawerRoot="true",document.body.appendChild(e));const t=n.devInfoDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("dev-info-drawer-open",a),!a||!D("devInfoEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=$a(r)||fn(r)||{tokenMint:r},o=Ep(r),c=n.devInfoSummaries?.[r]||br(s),l=ya(o.status||c.status),d=o.confidence||c.confidence||"unknown",u=!!n.devInfoLoading?.[`details:${r}`],p=o.likelyDevWallet||c.likelyDevWallet||"",f=o.currentPosition||null,y=o.historicalStats||{},b=o.linkedWalletSignals||{},v=o.marketContext||{},P=o.sourceHydration||{},A=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,8):[],g=O(v.marketCap,s.marketCap,s.fdv),$=O(v.liquidityUsd,s.liquidityUsd),C=O(v.volume5m,s.volume5m,s.volumeM5),B=O(v.volumeH1,s.volumeH1,s.volume1h),U=O(v.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),H=v.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",Se=v.mintAuthority||s.mintAuthority||"",De=v.freezeAuthority||s.freezeAuthority||"",q=!!(v.heliusDasIndexedAt||v.heliusDasSource||s.heliusDasSource||H||Se||De),Oe=[...Array.isArray(o.externalLinks)?o.externalLinks:[],...Array.isArray(c.externalLinks)?c.externalLinks:[],{label:"Solscan Token",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:s.dexUrl||Q(r)},{label:"Solscan Wallet",url:p?`https://solscan.io/account/${encodeURIComponent(p)}`:""},{label:"KOLscan Wallet",url:p?`https://kolscan.io/account/${encodeURIComponent(p)}`:""},{label:"Bubblemap",url:r?`https://app.bubblemaps.io/sol/token/${encodeURIComponent(r)}`:""},{label:"X",url:s.twitterUrl||s.xUrl},{label:"TG",url:s.telegramUrl},{label:"Website",url:s.websiteUrl}].filter((ee,Pn,xo)=>/^https?:\/\//i.test(String(ee.url||""))&&xo.findIndex(Hl=>String(Hl.url||"")===String(ee.url||""))===Pn).slice(0,8),X=Array.isArray(y.recentLaunches)?y.recentLaunches.slice(0,5):[],Ue=!!v.solanaTrackerLoaded,xt=!!f||Number(y.launchesTracked)>0||X.length>0,An=A.length>0||Array.isArray(o.riskReasons)&&o.riskReasons.length>0||Array.isArray(o.positiveReasons)&&o.positiveReasons.length>0||!!b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length>0,Mt=[["overview","Overview"]];Ue&&Mt.push(["holders","Holders"]),xt&&Mt.push(["history","History"]),An&&Mt.push(["signals","Signals"]);const Ba=Mt.some(([ee])=>ee===n.devInfoTab)?n.devInfoTab:"overview",Mr=`
    <div class="slimeshield-drawer-backdrop" data-dev-info-close></div>
    <aside class="dev-info-drawer dossier-drawer" data-active-pane="${i(Ba)}" role="dialog" aria-modal="true" aria-label="Dev Info details">
      <header>
        <div>
          <span>Dev Info</span>
          <h3>${i(js(l))} · ${i(Fp(d))}</h3>
        </div>
        <button type="button" aria-label="Close Dev Info" data-dev-info-close>Close</button>
      </header>
      ${Mt.length>1?`<div class="dossier-tabs" role="tablist" aria-label="Dev Info sections">
        ${Mt.map(([ee,Pn])=>`<button type="button" role="tab" data-dev-info-tab="${ee}" data-active="${Ba===ee}">${i(Pn)}</button>`).join("")}
      </div>`:""}
      <section class="dev-info-summary dev-info-${i(l)}" data-pane="overview">
        <strong>${i(s.symbol||s.shortMint||w(r))}</strong>
        <p>${i(o.summary||c.summary||"Not enough dev-wallet history yet.")}</p>
        <small>${u?"Updating...":`Last updated ${i(Te(o.updatedAt||c.updatedAt))}`}</small>
      </section>
      <section data-pane="overview">
        <h4>Likely Dev Wallet</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Wallet</dt><dd>${i(Ww(p))}</dd></div>
          <div><dt>Confidence</dt><dd>${i(Fp(d))}</dd></div>
          <div><dt>Source</dt><dd>${i(o.dataSource||"cache/local")}</dd></div>
          <div><dt>Pair</dt><dd>${i(w(o.pairAddress||s.pairAddress||""))}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${p?`<button type="button" data-copy="${i(p)}">Copy Wallet</button>`:""}
          <button type="button" data-copy="${i(r)}">Copy CA</button>
          ${p&&n.user?`<button type="button" data-dev-watch="${i(p)}">${n.devWatch?.[p]?"✅ Watching this dev":"👀 Watch this dev"}</button>`:""}
        </div>
        ${Oe.length?`
          <div class="slimeshield-drawer-actions dev-info-reference-links">
            ${Oe.map(ee=>`<a href="${i(ee.url)}" target="_blank" rel="noreferrer">${i(ee.label||"Open")}</a>`).join("")}
          </div>
        `:""}
      </section>
      <section data-pane="overview">
        <h4>Token / Source Context</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Market cap</dt><dd>${i(ro(g,M))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(ro($,M))}</dd></div>
          <div><dt>5m volume</dt><dd>${i(ro(C,M))}</dd></div>
          <div><dt>1h volume</dt><dd>${i(ro(B,M))}</dd></div>
          <div><dt>Pair age</dt><dd>${i(Number.isFinite(U)?to(U):"Not cached yet")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(H?w(H):q?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${Se?w(Se):q?"none":"not indexed"} / ${De?w(De):q?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(v.source||o.cacheSource||o.dataSource||"cache/local")}</dd></div>
        </dl>
        <p class="slimeshield-muted">If a field is not cached yet, Refresh asks SlimeWire for public pair/token context and stores verified values for later sessions.</p>
        ${P.message?`<p class="slimeshield-muted">Source refresh: ${i(P.message)}${P.eventsStored?` · ${i(P.eventsStored)} stored`:""}</p>`:""}
      </section>
      ${v.solanaTrackerLoaded?`
      <section data-pane="holders">
        <h4>On-chain Holders <span class="slimeshield-muted" style="font-weight:400">· Solana Tracker</span></h4>
        <dl class="kol-dump-metrics">
          <div><dt>Holders</dt><dd>${i(Number.isFinite(v.holderCount)?Number(v.holderCount).toLocaleString():"—")}</dd></div>
          <div><dt>Top 10 hold</dt><dd>${i(Number.isFinite(v.topHolderPercent)?Math.round(v.topHolderPercent)+"%":"—")}</dd></div>
          <div><dt>Dev holds</dt><dd>${i(Number.isFinite(v.devHoldPercent)?Math.round(v.devHoldPercent)+"%":"—")}</dd></div>
          <div><dt>Snipers</dt><dd>${i(Number.isFinite(v.snipersPercent)?Math.round(v.snipersPercent)+"%":"—")}</dd></div>
          <div><dt>Insiders</dt><dd>${i(Number.isFinite(v.insidersPercent)?Math.round(v.insidersPercent)+"%":"—")}</dd></div>
          <div><dt>Bundled</dt><dd>${i(Number.isFinite(v.bundlersPercent)?Math.round(v.bundlersPercent)+"%":"—")}</dd></div>
          <div><dt>LP burned</dt><dd>${i(Number.isFinite(v.lpBurnedPercent)?Math.round(v.lpBurnedPercent)+"%":"—")}</dd></div>
        </dl>
        <p class="slimeshield-muted">Live holder &amp; insider concentration from Solana Tracker — high snipers / insiders / bundled means a few wallets can dump on you.</p>
      </section>`:""}
      <section data-pane="signals">
        <h4>Source Evidence</h4>
        ${ao(A,"No verified public-source evidence is stored yet. Refresh Details will save Dex/Pump/Solscan-style context when the backend can verify it.")}
      </section>
      ${f?`
      <section data-pane="history">
        <h4>Current Token Position</h4>
          <dl class="kol-dump-metrics">
            <div><dt>Started</dt><dd>${i(Sr(f.initialSupplyPercent,"%"))}</dd></div>
            <div><dt>Current</dt><dd>${i(Sr(f.currentSupplyPercent,"%"))}</dd></div>
            <div><dt>Sold</dt><dd>${i(Sr(f.estimatedSoldPercent,"%"))}</dd></div>
            <div><dt>Status</dt><dd>${i(String(f.positionStatus||"unknown").replace(/_/g," "))}</dd></div>
            <div><dt>First sell</dt><dd>${i(to(f.firstMajorSellMinutesAfterLaunch))}</dd></div>
            <div><dt>Last sell</dt><dd>${i(f.lastSellAt?Te(f.lastSellAt):"n/a")}</dd></div>
          </dl>
      </section>`:""}
      ${Number(y.launchesTracked)>0||X.length?`
      <section data-pane="history">
        <h4>Dev Dump History</h4>
        <dl class="kol-dump-metrics">
          <div><dt>Past launches</dt><dd>${i(y.launchesTracked??0)}</dd></div>
          <div><dt>Median first sell</dt><dd>${i(to(y.medianFirstSellMinutes))}</dd></div>
          <div><dt>&gt;50% sold 15m</dt><dd>${i(Sr(y.soldMoreThan50Within15mPercent,"%"))}</dd></div>
          <div><dt>Held past 24h</dt><dd>${i(Sr(y.heldPast24hPercent,"%"))}</dd></div>
        </dl>
        ${X.length?`
          <ul class="dev-info-launches">
            ${X.map(ee=>`<li><span>${i(ee.symbol||w(ee.mint||""))}</span><small>${i(ee.outcomeLabel||"unknown")}</small></li>`).join("")}
          </ul>
        `:""}
      </section>`:""}
      ${Array.isArray(o.riskReasons)&&o.riskReasons.length?`
      <section data-pane="signals">
        <h4>Risk Signals</h4>
        ${ao(o.riskReasons,"")}
      </section>`:""}
      ${Array.isArray(o.positiveReasons)&&o.positiveReasons.length?`
      <section data-pane="signals">
        <h4>Positive Signals</h4>
        ${ao(o.positiveReasons,"")}
      </section>`:""}
      ${b.linkedWalletCount||Array.isArray(b.notes)&&b.notes.length?`
      <section data-pane="signals">
        <h4>Linked Wallet Clues</h4>
        <p class="slimeshield-muted">${i(b.linkedWalletCount?`${b.linkedWalletCount} linked wallet clue(s) cached.`:"")}</p>
        ${ao(b.notes,"")}
      </section>`:""}
      ${(()=>{const ee=[f?"":"dev position",Number(y.launchesTracked)>0||X.length?"":"launch history",!(o.riskReasons||[]).length&&!(o.positiveReasons||[]).length?"behavior signals":"",!b.linkedWalletCount&&!(b.notes||[]).length?"linked wallets":""].filter(Boolean);return ee.length?`<p class="slimeshield-muted dev-info-building">📡 Still building: ${i(ee.join(", "))}. SlimeWire fills these in as it watches this wallet trade - Refresh pulls fresh source data now.</p>`:""})()}
      <section class="slimeshield-action-note" data-pane="overview">
        <h4>Suggested Action</h4>
        <p>${i(o.suggestedAction||"Check SlimeShield and liquidity before buying.")}</p>
      </section>
      <div class="slimeshield-drawer-actions">
        <button type="button" data-watch-token="${i(r)}" data-watch-symbol="${i(s.symbol||"")}" data-watch-name="${i(s.name||"")}" data-watch-image="${i(uo(s)||"")}">${co(r)?"Saved":"Add Watch"}</button>
        <button type="button" data-slimeshield-details="${i(r)}">Open SlimeShield</button>
        <button type="button" data-radar-open="${i(r)}" data-radar-symbol="${i(s.symbol||"")}">📡 Radar</button>
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-source="dev-info-drawer">Protected Buy</button>`:""}
        <button type="button" data-dev-info-refresh="${i(r)}" ${u?"disabled":""}>${u?"Updating...":"Refresh"}</button>
      </div>
      <p class="slimeshield-safety-copy">Dev Info is based on wallet behavior SlimeWire can observe. It is not financial advice and may be incomplete.</p>
      ${n.devInfoStatus?`<small class="slimeshield-status">${i(n.devInfoStatus)}</small>`:""}
    </aside>
  `;Sn(e,Mr,".dev-info-drawer")}function Dp(e=""){return{mint:e,sampleSize:0,confidence:"low",matchedTraits:[],winRatePercent:null,medianMaxUpsidePercent:null,medianMaxDrawdownPercent:null,failRatePercent:null,bestExitPattern:"",summary:"Not enough local history yet. Replay improves as SlimeWire tracks more launches.",updatedAt:new Date().toISOString()}}function Sl(e=""){const t=String(e||"").trim();return n.replayResults?.[t]||Dp(t)}function kn(e,t="%"){return Number.isFinite(Number(e))?`${Math.round(Number(e))}${t}`:"n/a"}function Jw(e=""){if(!D("replayBeforeBuyEnabled",!0))return"";const t=String(e||"").trim();if(!t)return"";const a=Sl(t);return`
    <section class="replay-before-buy-card">
      <div>
        <strong>Replay Before You Buy</strong>
        <small>Compares this setup to similar launches SlimeWire has already tracked.</small>
      </div>
      <dl>
        <div><dt>Similar launches</dt><dd>${i(a.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(kn(a.winRatePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(kn(a.medianMaxDrawdownPercent))}</dd></div>
      </dl>
      <p>${i(a.summary||"Not enough local history yet.")}</p>
    </section>
  `}async function kl(e="",t={}){const a=String(e||"").trim();if(!a||!D("replayBeforeBuyEnabled",!0))return null;if(!t.force&&n.replayResults?.[a])return n.replayResults[a];if(n.replayLoading?.[a])return null;n.replayLoading={...n.replayLoading||{},[a]:!0},kr(),Aa();try{const r=new URLSearchParams({mint:a});t.force&&r.set("force","true");const o=(await k(`/api/web/replay-before-buy?${r.toString()}`,{timeoutMs:t.force?4500:3e3,preserveSafeError:!0}))?.replay||null;return o&&(n.replayResults={...n.replayResults||{},[a]:o},se(o.cacheHit?"replayCacheHit":"replayCacheMiss")),o}catch{return n.replayResults={...n.replayResults||{},[a]:Dp(a)},null}finally{const r={...n.replayLoading||{}};delete r[a],n.replayLoading=r,kr(),Aa()}}function Yw(e=""){const t=String(e||"").trim();!t||!D("replayBeforeBuyEnabled",!0)||(n.replayDetails={open:!0,tokenMint:t},Ka(),kr(),kl(t))}function $l(){n.replayDetails={open:!1,tokenMint:""},kr(),Vr()}function kr(){let e=document.querySelector("[data-replay-drawer-root]");e||(e=document.createElement("div"),e.dataset.replayDrawerRoot="true",document.body.appendChild(e));const t=n.replayDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("replay-drawer-open",a),!a||!D("replayBeforeBuyEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=Sl(r),o=!!n.replayLoading?.[r],c=`
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
        <small>${o?"Updating...":`Confidence: ${i(s.confidence||"low")} · Updated ${i(Te(s.updatedAt))}`}</small>
      </section>
      <dl class="kol-dump-metrics">
        <div><dt>Similar launches</dt><dd>${i(s.sampleSize??0)}</dd></div>
        <div><dt>Win rate</dt><dd>${i(kn(s.winRatePercent))}</dd></div>
        <div><dt>Median upside</dt><dd>${i(kn(s.medianMaxUpsidePercent))}</dd></div>
        <div><dt>Median drawdown</dt><dd>${i(kn(s.medianMaxDrawdownPercent))}</dd></div>
        <div><dt>Fail rate</dt><dd>${i(kn(s.failRatePercent))}</dd></div>
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
  `;Sn(e,c,".replay-drawer")}function Aa(){let e=document.querySelector("[data-slimeshield-drawer-root]");e||(e=document.createElement("div"),e.dataset.slimeshieldDrawerRoot="true",document.body.appendChild(e));const t=n.slimeShieldDetails||{},a=!!(t.open&&t.tokenMint);if(document.body.classList.toggle("slimeshield-drawer-open",a),!a||!D("slimeShieldEnabled",!0)){e.innerHTML="",e.__lastDrawerHtml="";return}const r=String(t.tokenMint||"").trim(),s=$a(r)||{tokenMint:r},o=n.slimeShieldResults?.[r]||at(s),c=o.verdict||"CAUTION",l=o.sourceHydration||{},d=o.marketContext||{},u=Array.isArray(o.sourceEvidence)?o.sourceEvidence.slice(0,6):[],p=!!n.slimeShieldLoading?.[r],f=Array.isArray(o.factors)?o.factors:[],y=O(d.marketCap,s.marketCap,s.fdv),b=O(d.liquidityUsd,s.liquidityUsd),v=O(d.volumeH1,s.volumeH1,s.volume1h),P=O(d.pairAgeMinutes,s.pairAgeMinutes,Number(s.pairAgeSeconds)/60),A=d.metadataAuthority||s.metadataAuthority||s.updateAuthority||"",g=d.mintAuthority||s.mintAuthority||"",$=d.freezeAuthority||s.freezeAuthority||"",C=!!(d.heliusDasIndexedAt||d.heliusDasSource||s.heliusDasSource||A||g||$),B=o.devInfoSummary||br(s),U=ya(B.status),H=[...Array.isArray(o.externalLinks)?o.externalLinks:[],{label:"Solscan",url:r?`https://solscan.io/token/${encodeURIComponent(r)}`:""},{label:"Dex",url:d.dexUrl||s.dexUrl||Q(r)},{label:"Pump",url:d.pumpUrl||gn(s)},{label:"X",url:d.twitterUrl||s.twitterUrl||s.xUrl},{label:"TG",url:d.telegramUrl||s.telegramUrl},{label:"Web",url:d.websiteUrl||s.websiteUrl}].filter((X,Ue,xt)=>/^https?:\/\//i.test(String(X.url||""))&&xt.findIndex(An=>String(An.url||"")===String(X.url||""))===Ue),Se=[...Array.isArray(s.riskFlags)?s.riskFlags:[],...Array.isArray(s.scoreWarnings)?s.scoreWarnings:[],...Array.isArray(s.bestPickWarnings)?s.bestPickWarnings:[]].filter(Boolean).slice(0,4),De=[["verdict","Verdict"],["risks","Risk & Signals"]],q=De.some(([X])=>X===n.slimeShieldTab)?n.slimeShieldTab:"verdict",Oe=`
    <div class="slimeshield-drawer-backdrop" data-slimeshield-close></div>
    <aside class="slimeshield-drawer dossier-drawer" data-active-pane="${i(q)}" role="dialog" aria-modal="true" aria-label="SlimeShield details">
      <header>
        <div>
          <span>SlimeShield</span>
          <h3>${i(c)}</h3>
        </div>
        <button type="button" aria-label="Close SlimeShield details" data-slimeshield-close>Close</button>
      </header>
      <div class="dossier-tabs" role="tablist" aria-label="SlimeShield sections">
        ${De.map(([X,Ue])=>`<button type="button" role="tab" data-slimeshield-tab="${X}" data-active="${q===X}">${i(Ue)}</button>`).join("")}
      </div>
      <section class="slimeshield-drawer-summary slimeshield-${i(hn(c))}" data-pane="verdict">
        <strong>${i(s.symbol||s.shortMint||w(r))}</strong>
        <p>${i(o.summary||"SlimeShield is warming up. Trade carefully.")}</p>
        <div>
          <span>Confidence: ${i(o.confidence||"low")}</span>
          <span>Score: ${i(Number.isFinite(Number(o.score))?`${Math.round(Number(o.score))}/100`:"n/a")}</span>
          <span>${p?"Updating...":`Updated ${i(Te(o.updatedAt))}`}</span>
        </div>
      </section>
      <section data-pane="verdict">
        <h4>Coin / Dev Info</h4>
        <dl class="kol-dump-metrics">
          <div><dt>CA</dt><dd>${i(w(r))}</dd></div>
          <div><dt>Age</dt><dd>${i(Number.isFinite(P)?to(P):no(s.pairAgeLabel||zt(s),"Not cached yet"))}</dd></div>
          <div><dt>Liquidity</dt><dd>${i(Number.isFinite(b)&&b>0?M(b):no(s.liquidityLabel,"Not cached yet"))}</dd></div>
          <div><dt>MC / FDV</dt><dd>${i(Number.isFinite(y)&&y>0?M(y):no(s.marketCapLabel,"Not cached yet"))}</dd></div>
          <div><dt>Volume</dt><dd>${i(Number.isFinite(v)&&v>0?M(v):no(s.volumeH1Label||s.volumeLabel,"Not cached yet"))}</dd></div>
          <div><dt>Dev Info</dt><dd>${i(js(U))} · ${i(B.confidence||"unknown")}</dd></div>
          <div><dt>Metadata auth</dt><dd>${i(A?w(A):C?"none cached":"Not indexed yet")}</dd></div>
          <div><dt>Mint / freeze</dt><dd>${i(`${g?w(g):C?"none":"not indexed"} / ${$?w($):C?"none":"not indexed"}`)}</dd></div>
          <div><dt>Source</dt><dd>${i(d.source||o.cacheSource||o.dataSource||"public/local")}</dd></div>
          <div><dt>Dev/risk notes</dt><dd>${i(Se.length?Se.join(" | "):"no cached hard flags")}</dd></div>
        </dl>
        <div class="slimeshield-drawer-actions">
          ${H.map(X=>`<a href="${i(X.url)}" target="_blank" rel="noreferrer">${i(X.label)}</a>`).join("")}
          ${D("devInfoEnabled",!0)?`<button type="button" data-dev-info="${i(r)}">Open Dev Info</button>`:""}
        </div>
        ${l.message?`<p class="slimeshield-muted">Source refresh: ${i(l.message)}</p>`:""}
        ${u.length?`<ul class="slimeshield-factor-list">${u.map(X=>`<li><span>${i(X)}</span></li>`).join("")}</ul>`:""}
      </section>
      <section data-pane="risks">
        <h4>Top Risk Reasons</h4>
        ${Ip(f,"risk","No major cached risk reason yet. Missing data lowers confidence.")}
      </section>
      <section data-pane="risks">
        <h4>Positive Signals</h4>
        ${Ip(f,"positive","No positive signal is strong enough to highlight yet.")}
      </section>
      <section class="slimeshield-action-note" data-pane="verdict">
        <h4>Suggested Action</h4>
        <p>${i(Ow(o.suggestedAction))}</p>
        <small>Protected Buy preset suggestion: ${i(Ew(o.protectedBuyPreset))}</small>
      </section>
      ${Jw(r)}
      <div class="slimeshield-drawer-actions">
        ${D("protectedBuyEnabled",!0)?`<button type="button" class="primary" data-protected-buy-open="${i(r)}" data-protected-buy-preset="${i(o.protectedBuyPreset||ml(c))}" data-protected-buy-source="slimeshield-drawer">Protected Buy</button>`:""}
        <button type="button" data-slimeshield-refresh="${i(r)}" ${p?"disabled":""}>${p?"Updating...":"Refresh Details"}</button>
        <button type="button" data-radar-open="${i(r)}" data-radar-symbol="${i(s.symbol||"")}">📡 Radar</button>
        <button type="button" data-token-trade="${i(r)}" data-token-trade-source="slimeshield-drawer">Open Trade</button>
      </div>
      <p class="slimeshield-safety-copy">SlimeShield is a trading-risk helper, not financial advice. Always review wallet prompts before signing. SlimeWire never needs your seed phrase.</p>
      ${n.slimeShieldStatus?`<small class="slimeshield-status">${i(n.slimeShieldStatus)}</small>`:""}
    </aside>
  `;Sn(e,Oe,".slimeshield-drawer")}function Tl(e){const t=e==="bundle"?"bundle":"trade";n.activeTab=t,t==="trade"&&(n.editingTradePresetId=""),t==="bundle"&&(n.editingBundlePresetId=""),window.history.pushState({},"","/terminal"),h({force:!0})}function A0(e){if(!e?.tokenMint)return F("No token selected","Click any row to preview it here without leaving the live feeds.");const t=it().some(a=>String(a.tokenMint)===String(e.tokenMint));return`
    <div class="token-preview-card with-avatar">
      ${ht(e)}
      <div>
        <strong>${i(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
        <small>${i(e.name||e.category||"Token")}</small>
        <button type="button" class="ca-copy" data-copy="${i(e.tokenMint)}">${i(w(e.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${i(e.pairAgeLabel||zt(e)||"age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${i(e.liquidityLabel||"n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${i(e.marketCapLabel||"n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${i(e.volumeH1Label||e.volumeLabel||"n/a")}</dd></div>
      <div><dt>${D("slimeShieldEnabled",!0)?"Shield":"Score"}</dt><dd>${i(D("slimeShieldEnabled",!0)?at(e).verdict||"CAUTION":e.bestPickScore?`${e.bestPickScore}/100`:"n/a")}</dd></div>
      <div><dt>Position</dt><dd>${t?"Held":"None"}</dd></div>
    </dl>
    ${Rp(e)}
    <div class="card-actions compact">
      <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${gn(e)?`<a href="${i(gn(e))}" target="_blank" rel="noreferrer">Pump</a>`:""}
      <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="token-preview">${i(ka())}</button>
      <button data-quick-bundle-token="${i(e.tokenMint)}">Bundle</button>
      ${t?`<button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>`:""}
    </div>
  `}function P0(e="chart"){return`
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${[["chart","Chart"],["chartTxns","Chart + Txns"],["txns","Transactions"],["info","Info"]].map(([a,r])=>`<button type="button" data-smart-chart-view="${a}" data-active="${e===a}">${r}</button>`).join("")}
    </div>
  `}function Qw(e=""){const t=String(e||"").trim();return t?(n.pnl?.trades||[]).filter(a=>String(a?.tokenMint||a?.mint||"").trim()===t):[]}function C0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Qw(a),s=!!(gn(e)&&el(e)),o=s?gn(e):e.dexUrl||Q(ap(e)||a),c=s?"Pump":"DEX";return`
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${i(c)} Transactions</h4>
          <p>Live market activity from ${i(c)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${i(o)}" target="_blank" rel="noreferrer">Open ${i(c)} Feed</a>
      </div>
      ${dl(e,"txns")}
      ${r.length?`
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${Pl(Math.max(6,r.length),r)}
        </div>
      `:`
        <div class="smart-chart-empty-transactions">
          <strong>${t?"Position loaded":"Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `}function L0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=Nm(e||{});return`
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${i(e.symbol||w(a))}.</p>
        </div>
      </div>
      ${dl(e,"info")}
      ${yp(e)}
      ${Rp(e)}
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
        ${Gs(e)}
      </div>
    </section>
  `}function Zw(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=n.chartTradeTab==="sell"?"sell":"buy",s=ue(),o=n.wallets?.length?String(n.wallets[0]?.index||""):"",c=Ou(),l=ut(),d=l?.walletIndex||(l?.walletIndexes||[])[0]||"",u=s?.publicKey&&Eu(s)?"connected":"",p=n.chartBuyWalletIndex||u||(c?.index?String(c.index):"")||d||o||(s?.publicKey?"connected":""),f=pe(p),y=n.quickBuyAmountOverride||ze(l)||"",b=l?bn("trade"):"No preset / manual",v=String(l?.slippageBps||"400"),P=String(l?.takeProfitPct||"25"),A=String(l?.stopLossPct||"8"),g=String(l?.sellDelay||"off"),$=String(l?.sellPercent||"100"),C=new Set(["300","400","500"]),B=Number.isFinite(Number(v))?`${Number(v)/100}%`:v,U=t?`${i(t.uiAmount||"Position")} tokens | ${i(t.estimatedValueSol||"value n/a")} SOL`:"No SlimeWire position tracked for this token.";return`
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
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${i(y)}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1","0.25","0.5","1"].map(H=>`<button type="button" data-chart-buy-preset="${H}">${H} SOL</button>`).join("")}
          </div>
          <label>
            Preset
            <select data-fast-trade-preset="chart-panel">
              ${ct("trade",n.selectedTradePresetId)}
            </select>
          </label>
          <small class="chart-preset-summary">${i(b)}</small>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300" ${v==="300"?"selected":""}>3%</option>
              <option value="400" ${v==="400"?"selected":""}>4%</option>
              <option value="500" ${v==="500"?"selected":""}>5%</option>
              ${C.has(v)?"":`<option value="${i(v)}" selected>${i(B)}</option>`}
            </select>
          </label>
          <div class="chart-auto-exit-grid" aria-label="Chart buy exit settings">
            <label>
              Take Profit
              ${qt({selectAttr:"data-chart-buy-tp",customAttr:"data-chart-buy-tp-custom",customFor:"chart-buy-tp",options:[["0","Off"],["15","+15%"],["25","+25%"],["50","+50%"],["100","+100%"],["custom","Custom"]],selected:P,customPlaceholder:"Custom: 500 or 5x"})}
            </label>
            <label>
              Stop Loss
              ${qt({selectAttr:"data-chart-buy-sl",customAttr:"data-chart-buy-sl-custom",customFor:"chart-buy-sl",options:[["0","Off"],["8","-8%"],["10","-10%"],["15","-15%"],["25","-25%"],["custom","Custom"]],selected:A,customPlaceholder:"Custom SL %"})}
            </label>
            <label>
              Timer
              ${Ze("chart-buy-delay","data-chart-buy-delay",g)}
            </label>
            <label>
              Exit Size
              ${qt({selectAttr:"data-chart-buy-sell-percent",customAttr:'data-chart-buy-sell-percent-custom min="1" max="100" step="1"',customFor:"chart-buy-sell-percent",options:[["off","Off"],["50","50%"],["80","80%"],["100","100%"],["custom","Custom"]],selected:$,customType:"number",customPlaceholder:"Custom %"})}
            </label>
          </div>
          <small>${f?`${i(s?.provider||"Browser wallet")} approval opens in wallet. Choose a funded session wallet when you need unattended TP/SL and timer exits.`:o?"Managed/session wallet selected for unattended TP/SL and timer exits. Browser-wallet buys still need approval for exits.":"Choose a connected browser wallet or managed/session wallet. Session wallets can arm TP/SL after buy."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${i(a)}">Confirm Buy</button>
          <small class="chart-trade-status" data-chart-trade-status>${i(n.chartTradeStatus||"")}</small>
        </div>
      `:`
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${U}</p>
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
  `}function x0(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim();return a?`
    <div class="smart-chart-quick-actions" data-preserve-focus>
      <button type="button" class="primary" data-quick-buy-token="${i(a)}" data-quick-buy-source="chart-quick-strip">Quick Buy</button>
      <button type="button" data-chart-trade-tab="buy">Buy</button>
      <button type="button" data-chart-trade-tab="sell" ${t?"":'title="No tracked position yet"'}>Sell</button>
      ${D("protectedBuyEnabled",!0)?`<button type="button" data-protected-buy-open="${i(a)}" data-protected-buy-source="chart-quick-strip">Protected</button>`:""}
    </div>
  `:""}function eS(e={},t=null){const a=String(e?.tokenMint||n.smartChartToken||"").trim(),r=mt(e),s=ft(e),o=y=>{const b=String(y??"").trim();return/^(checking|loading|pending|tracking|n\/a)\.{0,3}$/i.test(b)?"":b},c=_(r>0?M(r):"",o(e.marketCapLabel),o(e.fdvLabel),"checking"),l=_(s>0?M(s):"",o(e.liquidityLabel),"checking"),d=_(Number(e.volumeH1)>0?M(e.volumeH1):"",o(e.volumeH1Label),o(e.volumeLabel),"checking"),u=_(Number(e.volumeH24)>0?M(e.volumeH24):"",o(e.volumeH24Label),"checking"),p=(()=>{const y=Number(e.pairAgeMinutes)||Number(e.pairAgeSeconds)/60||null,b=Number(e.h1);return s>0&&s<5e3?"Thin exit":Number.isFinite(b)&&b>80?"Chasing":y!==null&&y<30&&(!Number.isFinite(b)||b>=0)?"Early":y!==null&&y>360&&Number(e.volumeH1)<500?"Stale":r>0&&s>0?"Clean setup":""})(),f=t?"Position held":p||(el(e)?"Pump curve":_(e.safetyStatus,e.category,e.dexId,"DEX"));return`
    <div class="smart-chart-market-bar" aria-label="Selected token market stats">
      <span><small>CA</small><strong>${i(w(a))}</strong></span>
      <span><small>MC / FDV</small><strong>${i(c)}</strong></span>
      <span><small>LIQ</small><strong>${i(l)}</strong></span>
      <span><small>1H</small><strong>${i(d)}</strong></span>
      <span><small>24H</small><strong>${i(u)}</strong></span>
      <span><small>Status</small><strong>${i(f)}</strong></span>
    </div>
  `}function tS(){try{return aS()}catch(e){console.error("Smart Chart render failed:",e);const t=String(n.smartChartToken||n.tradeToken||n.terminalToken||"").trim(),a=t?w(t):"No token selected",r=t?`https://dexscreener.com/solana/${encodeURIComponent(t)}?embed=1&theme=dark&trades=1&info=0`:"";return`
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
          `:F("Paste a token CA","Open a token from Live Terminal or paste a CA above.")}
          <small class="score-breakdown">Fallback chart kept the page alive after a display error. Reopen the CA to refresh the full SlimeWire chart shell.</small>
        </article>
      </section>
    `}}function aS(){const e=Ks(),t=String(e?.tokenMint||"").trim(),a=t?it().find(o=>String(o.tokenMint)===t):null,r=t?we([e,...ur().filter(o=>String(o.tokenMint||"")===t)]).filter(Boolean).slice(0,5):Sa(gr(),5,wa("smart-chart-suggest"),1);if(!t)return`
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
          ${Tt(r,{layout:"terminal",limit:5,actionLabel:"Trade",rotateKey:wa("smart-chart-empty"),stickyCount:1,emptyTitle:"No chart picks loaded",emptyMessage:"Refresh feeds, then open Smart Chart again."})}
        </div>
      </section>
    `;oa("tokenHeaderRendered"),oa("chartSkeletonRendered"),oa("buyPanelReady"),W({component:"smartChart",action:"chart-shell-rendered",durationMs:0,cacheHit:!!(tt(t)?.cacheHit||fr(t)?.pairAddress),stale:!!tt(t)?.stale,details:t});const s=e.symbol||e.shortMint||w(t);return`
    <section class="smart-chart-terminal smart-chart-clean-terminal">
      <div class="terminal-title-row smart-chart-clean-title">
        <div>
          <h3>${i(s)} Chart</h3>
          <p>Live SlimeWire chart, transactions, and wallet trade controls for the selected CA.</p>
        </div>
        <button type="button" data-tab="terminal">Back to Live Terminal</button>
      </div>
      <div class="smart-chart-search smart-chart-clean-search">
        <input data-smart-chart-input value="${i(t)}" placeholder="Paste token CA" autocomplete="off">
        <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
      </div>
      <div class="smart-chart-grid smart-chart-clean-grid">
        <article class="terminal-panel smart-chart-main smart-chart-clean-main">
          ${(()=>{nS(t);const o=Up(t);return o?`<div class="coin-banner-hero" style="background-image:url('${o}')" role="img" aria-label="Coin banner"></div>`:""})()}
          <div class="smart-chart-token-header smart-chart-clean-token-header${Up(t)?" has-banner":""}">
            ${ht(e)}
            <div>
              <strong>${i(s)}</strong>
              <small>${i(e.name||e.category||"Token")}</small>
              <button type="button" class="ca-copy" data-copy="${i(t)}">${i(w(t))}</button>
            </div>
            <div class="smart-chart-links">
              ${Gs(e)}
            </div>
          </div>
          ${eS(e,a)}
          ${dl(e,"chartTxns")}
        </article>
        <aside class="terminal-panel smart-chart-side smart-chart-clean-side">
          <h3>Trade ${i(s)}</h3>
          ${Zw(e,a)}
        </aside>
      </div>
      ${sS(t)}
    </section>
  `}function Up(e){const t=String(e||"").trim();return n.coinBanners&&n.coinBanners[t]||""}let qp="";function nS(e){const t=String(e||"").trim();!t||qp===t||(qp=t,k(`/api/web/coin-banner?mint=${encodeURIComponent(t)}`).then(a=>{const r=String(a?.bannerUri||"");r&&(n.coinBanners=n.coinBanners||{},n.coinBanners[t]=Qe(r),n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0}))}).catch(()=>{}))}let Al="",Hp=0;function Kp(e){e&&(Al===e&&Date.now()-Hp<3e4||(Al=e,Hp=Date.now(),k(`/api/web/calls?mint=${encodeURIComponent(e)}`).then(t=>{n.chartCalls={mint:e,...t},n.activeTab==="smartChart"&&h({preserveSmartChartFrame:!0})}).catch(()=>{})))}function rS(e){const t={bullish:["🟢","BULLISH"],bearish:["🔴","BEARISH"],warning:["⚠️","WARNING"],question:["❓","QUESTION"]},[a,r]=t[e]||["⚪",String(e||"").toUpperCase()];return`${a} ${r}`}function sS(e){Kp(e);const t=n.chartCalls?.mint===e?n.chartCalls:null,a=t?.calls||[],r=!!(n.token&&n.user);return`
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
                <strong>${i(rS(s.side))} <span class="muted-text">by ${i(s.handle)}</span>
                  ${s.reputation?.wins?`<span class="positive">${i(String(s.reputation.wins))}W${s.reputation.hitRatePct!=null?` ${i(String(s.reputation.hitRatePct))}%`:""}</span>`:""}
                </strong>
                <span>${s.entryMcUsd?`Entry MC ${i(M(s.entryMcUsd))} | `:""}${s.targetX?`Target ${i(String(s.targetX))}x | `:""}${s.shieldVerdict?`Shield ${i(s.shieldVerdict)} ${i(String(s.shieldScore??""))} | `:""}${i(Te(s.createdAt))}</span>
                ${s.note?`<small>${i(s.note)}</small>`:""}
                ${s.status==="resolved"?`<small class="${s.outcome==="won"?"positive":"negative"}">${s.outcome==="won"?`✅ hit ${i(String(s.peakX))}x`:i(s.outcome)}</small>`:s.status==="watching"?'<small class="muted-text">tracking...</small>':""}
              </div>
              <div class="card-actions compact">
                <button data-quick-buy-token="${i(s.mint)}" data-quick-buy-source="call-board">${i(ka())}</button>
                <button data-watch-token="${i(s.mint)}" data-watch-symbol="${i(s.symbol||"")}">Watch</button>
              </div>
            </article>
          `).join("")}
        </div>`:'<p class="trade-status">No calls on this token yet - be first. First caller gets the receipt when it runs.</p>'}
      <div class="card-actions compact">
        <a class="button-like" href="${i(Ga(`/api/web/signal-card?tokenMint=${encodeURIComponent(e)}`))}" target="_blank" rel="noreferrer">📸 Signal Card</a>
        ${Ye(`$${n.chartCalls?.calls?.[0]?.symbol||""} on SlimeWire - shield read + live calls: https://www.slimewire.org/terminal/chart?token=${e}`,"Share")}
      </div>
    </section>
  `}async function oS(e){const t=m("[data-call-status]");try{const a=m("[data-call-side]")?.value||"bullish",r=m("[data-call-target]")?.value||"",s=m("[data-call-note]")?.value||"";S(t,"Posting call..."),await k("/api/web/calls",{method:"POST",body:JSON.stringify({tokenMint:e,side:a,targetX:r,note:s,source:"site"})}),S(t,"Call posted - it is now being tracked."),Al="",Kp(e)}catch(a){S(t,N(a?.message||"Could not post call."))}}function iS(e,t=!1){const a=e?.tokenMint?n.positions.find(o=>String(o.tokenMint)===String(e.tokenMint)):null,r=bn("trade"),s=bn("bundle");return t?`
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
                ${ct("trade",n.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${ct("bundle",n.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${_t().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Refresh Balance"}</button>
          </div>
          ${e?.tokenMint?`
            <code>${i(e.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="terminal-ticket">${i(ka())}</button>
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
          `:F("No token selected","Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${i(rs())}</small>
        </div>
    </article>
  `}function lS(){return`
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${[["positions","Positions"],["orders","Open Orders"],["history","Order History"],["wallets","Wallets"],["kol","KOL Signals"],["sniper","Sniper Logs"],["tx","Transaction Audit"],["reconcile","Balance Reconciliation"]].map(([t,a])=>`<button data-terminal-subtab="${t}" data-active="${n.terminalSubtab===t}">${a}</button>`).join("")}
      </div>
      ${cS()}
    </section>
  `}function cS(){if(n.terminalSubtab==="orders")return jp();if(n.terminalSubtab==="history")return Pl(12);if(n.terminalSubtab==="wallets")return ep();if(n.terminalSubtab==="kol"){const e=up(n.kolScan?.rows||[]).filter(t=>!mr(t));return Tt(e,{layout:"terminal",cooksStyle:!0,limit:12,rotateKey:wa("bottom-kol"),stickyCount:1})}return n.terminalSubtab==="sniper"?n.scan?pt(n.scan.rows||[],{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",hideToolbar:!0}):F("No sniper scan loaded","Open Sniper or refresh a scan mode."):n.terminalSubtab==="tx"?Xp(!0):n.terminalSubtab==="reconcile"?Gp():dS(6)}function dS(e=25){const t=it();return t.length?`
    <div class="table-list compact-table">
      ${t.slice(0,e).map(zp).join("")}
    </div>
  `:F("No open positions","Open token holdings will show here after refresh.")}const Vp=new Map;function uS(e){const t=String(e.tokenMint||"");if(!t)return"";const a=(n.pnl?.tokens||[]).find(u=>String(u.tokenMint)===t),r=pr().find(u=>String(u?.tokenMint||"")===t),s=(Array.isArray(n.tradePlans)?n.tradePlans:[]).find(u=>String(u.tokenMint)===t&&["watching","active","armed","pending"].includes(String(u.status||"").toLowerCase())),o=[];a?.spentSol&&o.push(`Entry ${a.spentSol} SOL`),r?.marketCapLabel&&o.push(`MC ${r.marketCapLabel}`),o.push(s?`TP ${s.takeProfitSummary||s.takeProfitPct||"off"} / SL ${s.stopLossSummary||s.stopLossPct||"off"} armed`:"no auto-exit armed");const c=Number(e.estimatedValueSol);let l="";if(Number.isFinite(c)){const u=Vp.get(t);if(u&&Number.isFinite(u.value)&&Math.abs(c-u.value)>5e-4){const p=c-u.value;l=`${p>0?"▲ +":"▼ "}${p.toFixed(4)} SOL since last refresh`}Vp.set(t,{value:c,at:Date.now()})}let d="";if(s){const u=Number(s.lastMovePct??s.wallets?.[0]?.lastMovePct),p=Number(s.takeProfitPct),f=Number(s.stopLossPct),y=Date.parse(s.sellAfterAt||s.wallets?.[0]?.sellAfterAt||""),b=Number.isFinite(y)?Math.round((y-Date.now())/6e4):null;Number.isFinite(u)&&Number.isFinite(p)&&p>0&&u>=p*.75?d=`Up ${u.toFixed(1)}% - take-profit at +${p}% is close`:Number.isFinite(u)&&Number.isFinite(f)&&f>0&&u<=-(f*.6)?d=`Down ${Math.abs(u).toFixed(1)}% - stop-loss at -${f}% is near`:b!==null&&b>0&&b<=10?d=`Timer exit in ~${b} min`:Number.isFinite(u)&&(d=`${u>=0?"Up":"Down"} ${Math.abs(u).toFixed(1)}% - exits watching`)}else ay(t)||e.source==="launch-optimistic"?d="⏳ Exits arming from your launch - TP/SL/timer registering...":d="No auto-exit on this bag - Arm Exits if you are stepping away";return`
    <small>${i(o.join(" | "))}</small>
    ${d?`<small class="${/close|near|Timer|No auto/.test(d)?"warning-text":"muted-text"}">${i(d)}</small>`:""}
    ${l?`<small class="${l.startsWith("▲")?"positive":"negative"}">${i(l)}</small>`:""}
  `}function zp(e){const t=e.estimatedValueSol!==null&&e.estimatedValueSol!==void 0&&e.estimatedValueSol!=="",a=e.openPnlSol!==null&&e.openPnlSol!==void 0&&e.openPnlSol!=="",r=!!(e.valuePending||!t&&/refreshing|updating|background/i.test(e.valueError||"")),s=!!(e.viewOnly||e.source==="connected-wallet"),o=t?`${e.estimatedValueSol} SOL`:r?"updating":s?"tracking":"Price unavailable",c=a?e.openPnlSol:r?"updating":s?"realized only":"Price unavailable",l=e.valueError?r?"Value updating in background":`Price warning: ${e.valueError}`:s&&!t?"Connected wallet holding - live value pending":"";return`
    <article class="row-card position with-avatar is-clickable" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="position-row" title="Open chart, trade, and transactions on SlimeWire">
      ${ht(e)}
      <div class="row-main">
        <strong>${i(e.symbol||e.shortMint)}</strong>
        <span>${i(e.uiAmount)} tokens across ${i(e.walletCount)} wallet(s)</span>
        ${e.name?`<small>${i(e.name)}</small>`:""}
        <small>Value: ${i(o)} | PnL: ${i(c)}</small>
        ${uS(e)}
        ${l?`<small class="${r?"muted-text":"warning-text"}">${i(l)}</small>`:""}
      </div>
      <div class="card-actions compact">
        <button class="primary" data-smart-chart-token="${i(e.tokenMint)}">Chart</button>
        <button data-arm-exits="${i(e.tokenMint)}" title="One tap: arms TP/SL with your active trade preset (or +40%/-8%) on every wallet holding this bag">Arm Exits</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${i(e.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${i(e.tokenMint)}">Custom %</button>
        ${Ye(xg(e))}
        <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `}function Pl(e=10,t=null){const a=Array.isArray(t)?t:n.pnl?.trades||[];return a.length?`
    <div class="live-trade-list">
      ${a.slice(0,e).map(r=>`
        <article class="live-trade-row">
          <strong>${i(String(r.type||"").toUpperCase())} ${i(r.shortMint||w(r.tokenMint))}</strong>
          <span>${i(r.walletLabel||"wallet")} | ${i(r.solAmount||"0")} SOL</span>
          <small>${i(Te(r.timestamp))}</small>
          <div class="card-actions compact">
            ${r.tokenMint?`<button data-token-chart="${i(r.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${i(r.tokenMint)}" data-quick-buy-source="live-trades">${i(ka())}</button>`:""}
            ${r.signature?`<a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noreferrer">Tx</a>`:""}
          </div>
        </article>
      `).join("")}
    </div>
  `:F("No live trade history yet","Submitted web trades will appear here after refresh.")}function pS(){const e=n.pnl?.trades||[],t=ot("liveTrades",e);return`
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
        ${Pl(t.length||Za("liveTrades"),t)}
        ${da("liveTrades",e,"trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${iS(tp())}
      </aside>
    </section>
  `}function jp(){const e=Array.isArray(n.tradePlans)?n.tradePlans:[],t=[n.tradePlanResult,n.bundleResult,n.volumeResult,n.sniperResult,n.kolResult,n.launchResult].filter(Boolean).map(r=>({...r,localOnly:!0})),a=e.length?e:t;return a.length?`
    <div class="table-list compact-table">
      ${a.map(r=>`
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${i(r.label||r.type||r.source||"Managed Exit")} ${r.shortMint?`<code>${i(r.shortMint)}</code>`:""}</strong>
            <span>Status: ${i(r.status||"watching")} | Active wallets: ${i(r.activeWallets??"?")}/${i(r.walletCount??"?")} | TP ${i(r.takeProfitSummary||r.takeProfitPct||"off")} | SL ${i(r.stopLossSummary||r.stopLossPct||"off")}</span>
            <small>Execution mode: ${i(r.executionMode||"managed_server")} ${r.automationPermissionExpiresAt?`| permission expires ${i(Te(r.automationPermissionExpiresAt))}`:""}</small>
            ${r.automationPermissionExpiresAt&&!r.automationPermissionActive?'<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>':""}
            ${r.localOnly?'<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>':""}
            ${r.message?`<small>${i(r.message)}</small>`:""}
            ${r.wallets?.length?`<div class="audit-wallet-list">${r.wallets.map(mS).join("")}</div>`:""}
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
  `:F("No active audit item loaded","Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.")}function mS(e={}){const t=e.lastTriggerCheckAt||e.lastCheckedAt||"",a=e.triggerStatus||e.exitStatus||e.status||"watching",r=e.lastMovePct??e.lastGrossMovePct,s=Number.isFinite(Number(r))?`${Number(r).toFixed(2)}%`:"not checked",o=Number.isFinite(Number(e.lastNetMovePct))?` net ${Number(e.lastNetMovePct).toFixed(2)}%`:"",c=e.retryAfterAt?` | retry ${Xn(nn(e.retryAfterAt))}`:"",l=e.lastError||e.lastPriceEstimateError||"",d=Number.isFinite(Number(e.lastStopLossPct))?`SL ${Number(e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}% triggers at -${Number(e.lastStopLossTriggerPct||e.lastStopLossPct).toFixed(2).replace(/\.00$/,"")}%`:"SL off",u=Number.isFinite(Number(e.lastTakeProfitPct))?`TP +${Number(e.lastTakeProfitPct).toFixed(2).replace(/\.00$/,"")}%`:"TP off",p=`should SL: ${e.lastShouldTriggerStopLoss===!0?"yes":"no"} | should TP: ${e.lastShouldTriggerTakeProfit===!0?"yes":"no"}`;return`
    <div class="audit-wallet-row">
      <div>
        <strong>${i(e.label||"Wallet")}</strong>
        <span>${i(e.shortPublicKey||"")}</span>
      </div>
      <div>
        <span>${i(a)}${e.triggerKind?` / ${i(e.triggerKind)}`:""}</span>
        <small>Move ${i(s)}${i(o)} | checked ${i(Xn(nn(t)))}${i(c)}</small>
        <small>${i(d)} | ${i(u)} | ${i(p)} | Source: ${i(e.lastTriggerPriceSource||e.lastEstimateSource||"unknown")}</small>
        ${e.triggerReason?`<small>Reason: ${i(e.triggerReason)}</small>`:""}
        ${e.sellSignature?`<small>Sell tx: ${i(e.sellSignature)}</small>`:""}
        ${l?`<small class="warning-text">Error: ${i(l)}</small>`:""}
      </div>
    </div>
  `}function Gp(){const e=n.balances.filter(a=>a.error),t=n.balances.reduce((a,r)=>a+Number(r.warnings?.length||0),0);return`
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${i(Xn(nn(n.lastWalletRefreshAt)))} | Warnings: ${t} | Errors: ${e.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${n.walletRefreshing?"Refreshing...":"Force Refresh"}</button>
    </section>
    ${e.length?`
      <div class="table-list compact-table">
        ${e.map(a=>`<article class="row-card"><strong>${i(a.label||`Wallet ${a.index}`)}</strong><span>${i(a.error)}</span></article>`).join("")}
      </div>
    `:F("Wallet state synced","No balance errors reported by the last refresh.")}
  `}function Xp(e=!1){const t=n.terminalTxAudit;return`
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
        ${t?fS(t):F("No transaction loaded","Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${e?"":`<aside class="trade-side order-ticket-stack">${jp()}${Gp()}</aside>`}
    </section>
  `}function fS(e){return e.error?`<article class="row-card"><strong>Audit failed</strong><span>${i(e.error)}</span></article>`:`
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
  `}function hS(e=[]){const t=[...e].sort((a,r)=>Number(r.bestPickScore||r.score||0)-Number(a.bestPickScore||a.score||0)||nt(a,r));return Sa(t,5,wa("cooks-best"),1)}function me(e){const t=Number(e);return Number.isFinite(t)?t:0}function so(){const e=n.liveFeedCategory||"best";return Jo.find(([t])=>t===e)||Jo[0]}function $r(e={}){return Pr(e)||tm(e)||po(e)||0}function oo(e={}){return me(e.buys5m)+me(e.buysH1)+me(e.sells5m)+me(e.sellsH1)}function Cl(e={}){const t=me(e.buys5m)+me(e.buysH1),a=me(e.sells5m)+me(e.sellsH1),r=t+a;return r>0?t/r:.5}function Tr(e={}){return Math.max(me(e.m5),me(e.h1),me(e.h24))}function io(e={}){return Math.max(me(e.m5),me(e.h1))}function Jp(e={}){return io(e)*Math.log10(10+$r(e))*(.5+Cl(e))}function Yp(e={}){return e.boosted||e.isBoosted||e.boost||e.boosts?!0:`${e.source||""} ${e.category||""} ${e.liveLabel||""} ${e.sourceLabel||""}`.toLowerCase().includes("boost")}function gS(e=[],t="best"){const a=[...e];switch(t){case"volume":return a.sort((r,s)=>$r(s)-$r(r));case"liquidity":return a.sort((r,s)=>ft(s)-ft(r));case"marketcap":return a.sort((r,s)=>mt(s)-mt(r));case"active":return a.sort((r,s)=>oo(s)-oo(r));case"fresh":return a.sort(nt);case"gainers":return a.sort((r,s)=>Tr(s)-Tr(r));default:return a.sort((r,s)=>me(s.bestPickScore||s.score)-me(r.bestPickScore||r.score)||nt(r,s))}}function lo(){const e=n.liveTerminalCategory||"dexTrending";return za.find(([t])=>t===e)||za[0]}function bS(e,t,a,r){return`
    <label class="cooks-category-select" title="Pick how this feed is ranked">
      <span class="cooks-category-cap">${i(r)}</span>
      <select ${a} aria-label="${i(r)} category">
        ${e.map(([s,o])=>`<option value="${s}"${s===t?" selected":""}>${i(o)}</option>`).join("")}
      </select>
    </label>`}function yS(){if(n.activeTab==="terminal"){const t=lo();return{categories:za,activeId:t[0],sub:t[2],attr:"data-live-terminal-category",cap:"Discover",rank:a=>Qp(a,t[0]),hasBest:!1}}const e=so();return{categories:Jo,activeId:e[0],sub:e[2],attr:"data-live-feed-category",cap:"Feed",rank:t=>gS(t,e[0]),hasBest:e[0]==="best"}}function vS(e={}){if(Yp(e))return{cls:"boost",text:"⚡ Boosted"};const t=Tr(e);if(t>=40)return{cls:"gain",text:`▲ ${Math.round(t)}%`};const a=Number(e.pairAgeMinutes);return Number.isFinite(a)&&a>=0&&a<=10?{cls:"fresh",text:"✨ Fresh"}:io(e)>=25?{cls:"hot",text:"🔥 Hot"}:Cl(e)>=.7&&oo(e)>=24?{cls:"active",text:"● Active"}:null}function Ll(e={}){const t=vS(e);return t?`<span class="signal-badge signal-badge-${t.cls}">${i(t.text)}</span>`:""}function wS(e={}){const t=[];Yp(e)&&t.push("⚡ boosted");const a=[["5m",me(e.m5)],["1h",me(e.h1)],["24h",me(e.h24)]];a.sort((c,l)=>l[1]-c[1]),a[0][1]>=12&&t.push(`▲${Math.round(a[0][1])}% ${a[0][0]}`);const r=oo(e),s=Cl(e);r>=12&&s>=.62&&t.push(`${Math.round(s*100)}% buys`),e.smartMoney&&t.push("smart money in");const o=Pr(e)||po(e);return o>=2e3&&t.length<3&&t.push(`${M(o)} vol`),r>=30&&t.length<3&&t.push(`${r} trades`),Number(e.sniperCount||0)===0&&a[0][1]>=12&&t.length<3&&t.push("no snipers"),t.slice(0,3)}function SS(e={}){const t=wS(e);return t.length?`<div class="signal-why" title="Why it's moving"><small><span class="signal-why-tag">Why</span> ${i(t.join(" · "))}</small></div>`:""}function kS(e={}){return e.isPump||e.pump||e.pumpFun||e.pumpUrl?!0:`${e.source||""} ${e.category||""} ${e.dexId||""} ${e.dexName||""}`.toLowerCase().includes("pump")}function M0(e={}){const t=`${e.name||""} ${e.symbol||""} ${e.category||""}`.toLowerCase();return kS(e)||/meme|dog|cat|pepe|wif|inu|elon|moon|bonk|frog|chad/.test(t)}function Ar(){const e=n.cookSpotCategory||"dexTrending";return za.find(([t])=>t===e)||za[0]}function Qp(e=[],t="dexTrending"){const a=[...e];switch(t){case"fresh":return a.sort(nt);case"dexBoosted":case"graduated":return a.sort((r,s)=>$r(s)-$r(r));case"memeMovers":return a.sort((r,s)=>Tr(s)-Tr(r));case"earlyMomentum":return a.sort((r,s)=>io(s)-io(r));default:return a.sort((r,s)=>Jp(s)-Jp(r))}}function $S(e=Ar()){const[t]=e;return`
    <label class="cooks-category-select" title="Pick how Cook Spot is ranked">
      <span class="cooks-category-cap">Discover</span>
      <select data-cook-spot-category aria-label="Cook Spot category">
        ${za.map(([a,r])=>`<option value="${a}"${a===t?" selected":""}>${i(r)}</option>`).join("")}
      </select>
    </label>`}function Zp(e=0,t=""){const a=nn(t),r=a===null?"live":Xn(a);return`<div class="cooks-meta" data-cooks-meta><span><b>${e}</b> ${e===1?"pair":"pairs"}</span><span aria-hidden="true">·</span><span>updated ${i(r)}</span></div>`}function xl(e=[]){const t=yS(),a=bS(t.categories,t.activeId,t.attr,t.cap),r='<button type="button" class="cooks-inline-refresh" data-refresh-live-pairs title="Refresh feed">↻ Refresh</button>',s=Zp(e.length,ua()),o={context:"live",shareBuilder:Pa,hideToolbar:!0};if(t.hasBest){const l=hS(e),d=new Set(l.map(va).filter(Boolean)),u=[...e].sort(nt).filter(f=>!d.has(va(f))),p=ot("live",u);return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>Top ${l.length} · rotating each refresh</span>${r}</div>
        ${l.length?pt(l,o):F("No pairs found for this filter yet","Keep this tab open or tap Refresh — picks fill in as pairs qualify.")}
      </div>
      <div class="cooks-section" data-cooks-newest>
        <div class="cooks-section-label"><strong>Newest</strong><span>Live launches · steady refresh</span></div>
        ${p.length?pt(p,o):F("Scanning fresh pairs","Newest launches fill here as they qualify.")}
      </div>
    </div>`}const c=ot("live",t.rank(e));return`
    <div class="cooks-feed">
      ${s}
      <div class="cooks-section" data-cooks-best>
        <div class="cooks-section-label cooks-category-label">${a}<span>${i(t.sub)}</span>${r}</div>
        ${c.length?pt(c,o):F("No pairs found for this filter yet","Try another category or time window — the feed keeps scanning in the background.")}
      </div>
    </div>`}function em(){const e=qe(),t=we(e?.rows||[]),a=vn(t),r=ot("live",a),s=Ot.find(([f])=>f===n.livePairBucket)?.[1]||"Live",o=ua(),c=!!n.livePairsLoadingByBucket[n.livePairBucket],l=yn(),d=n.livePairsRefreshErrorByBucket?.[n.livePairBucket],u=c?"Scanning live pairs...":e?.message||"Cooks refreshes while this tab is open.",p=a.length?xl(a):l?vr(t,`${s.toLowerCase()} pairs`):d?F("Unable to load pairs. Try refreshing.","The live feed hit a snag — it keeps retrying automatically, or tap ↻ Refresh."):c?F("Loading live pairs…","Scanning fresh pairs for this time window."):F("No pairs found for this filter yet","Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.");return`
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="mode-row terminal-modes live-pair-buckets">
          ${Ot.map(([f,y])=>{const b=n.livePairsByBucket[f]?.rows?.length,v=Number.isFinite(Number(b))?` (${b})`:"";return`<button data-live-pair-bucket="${f}" data-active="${n.livePairBucket===f}">${y}${v}</button>`}).join("")}
        </div>
        ${hl("live",{rawCount:t.length,visibleCount:a.length})}
        ${fl(t,a)}
        ${qi("live")}
        ${p}
        ${da("live",a,`${s} pairs`)}
      </main>
    </section>
  `}function B0(e){const t={live:"Brand-new launches under an hour old. Best Picks rotates the strongest; Newest streams them as they appear.",under1h:"Pairs aged about 1 to 2 hours - past the first-minute chaos, early momentum still forming.",under3h:"Pairs aged about 3 to 6 hours - established enough to show a real volume and liquidity trend.",under1d:"Pairs aged about 24 to 48 hours - day-old survivors ranked by liquidity, volume, momentum, and risk."};return t[e]||t.live}function TS(){if(!n.user||!n.token)return`${is()}${F("Create or log in to save a watchlist","You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;const e=n.watchlist?.rows||[],t=ot("watchlist",e);return`
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
        ${t.length?pt(t,{context:"watchlist",shareBuilder:a=>Ii(a.tokenMint)}):F("No watched coins yet","Tap Watch on Cooks, Sniper, or KOL signals to save coins here.")}
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
  `}function R0(e){return pt(e,{context:"live",shareBuilder:Pa})}function pt(e,t={}){const a=t.shareBuilder||Pa,r=we(e),s=`signal-list ${t.context==="kol"?"signal-list-kol":""}`.trim();return r.length?`
    ${t.hideToolbar?"":qi(t.context||"scanner")}
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
      ${r.map((o,c)=>AS(o,c,{...t,shareText:a(o),priority:c<12})).join("")}
    </div>
  `:`
      ${t.hideToolbar?"":qi(t.context||"scanner")}
      ${F(t.emptyTitle||"Scanning signals",t.emptyMessage||"No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `}function AS(e,t,a={}){const r=co(e.tokenMint),s=a.shareText||Pa(e),o=a.primaryActionLabel||"Trade",c=a.primaryAction||"quickTrade",l=a.context==="kol",d=a.context==="watchlist"?`<button type="button" data-unwatch-token="${i(e.tokenMint)}" title="Remove from watchlist">Remove</button>`:`<button type="button" class="watch-action" data-watched="${r}" title="${r?"Saved to watchlist":"Watch / save coin"}" data-watch-token="${i(e.tokenMint)}" data-watch-symbol="${i(e.symbol||"")}" data-watch-name="${i(e.name||"")}" data-watch-image="${i(uo(e)||"")}">${r?"Saved":"Watch"}</button>`;return`
    <article class="signal-row ${l?"is-kol-signal":""}" data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-row")}">
      <div class="signal-token">
        ${ht(e,{priority:!!a.priority})}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${i(e.tokenMint)}" data-token-chart-source="${i(a.context||"signal-title")}">${i(e.symbol||e.shortMint||w(e.tokenMint))}</strong>
            <small>${i(e.name||e.category||"Token")}</small>
            ${l?"":Ll(e)}
          </div>
          <button type="button" class="ca-copy" data-copy="${i(e.tokenMint)}">${i(w(e.tokenMint))}</button>
          <div class="signal-links">
            <a href="${i(e.dexUrl||Q(e.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${e.pumpUrl?`<a href="${i(e.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>`:""}
            ${e.twitterUrl?`<a href="${i(e.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>`:""}
            ${e.telegramUrl?`<a href="${i(e.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>`:""}
            ${e.websiteUrl?`<a href="${i(e.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>`:""}
            <button type="button" data-share-x data-share-text="${i(s)}" title="Share to X">SHARE</button>
            ${Ed(s,"TG")}
            ${Number(e.sniperCount||0)>0?`<span class="sniper-pill" title="Sniper count">SCOPE ${i(e.sniperCount)}</span>`:""}
          </div>
          ${pw(e)}
          ${SS(e)}
        </div>
      </div>
      <div class="signal-cell" data-cell="Age"><span>${i(e.pairAgeLabel||zt(e)||"age unknown")}</span><small>${i(e.scalpSetup||e.momentum||`#${t+1}`)}</small></div>
      <div class="signal-cell" data-cell="Liq"><span>${i(_(e.liquidityLabel,ft(e)>0?M(ft(e)):"","checking"))}</span><small>${PS(e.h1)}</small></div>
      <div class="signal-cell" data-cell="MC"><span>${i(_(e.marketCapLabel,mt(e)>0?M(mt(e)):"","checking"))}</span><small>${i(e.category||e.signalType||"signal")}</small></div>
      <div class="signal-cell" data-cell="Txns"><span>${i(e.txnsLabel||e.winRateLabel||"n/a")}</span><small>${i(cw(e))}</small></div>
      <div class="signal-cell volume-windows" data-cell="Vol">
        <span>${i(_(e.volumeH1Label,e.volumeLabel,Pr(e)>0?M(Pr(e)):"","checking"))}</span>
        <small>${hp(e).map(([u,p])=>`${u} ${p}`).join(" | ")}</small>
      </div>
      <div class="signal-actions has-dev-info">
        ${c==="snipe"?`<button type="button" class="primary" data-sniper-buy="${i(e.tokenMint)}" title="Snipe buy">${i(o)}</button>`:`<button type="button" class="primary" data-token-trade="${i(e.tokenMint)}" data-token-trade-source="${i(a.context||"signal-row")}" title="Open chart + buy/sell panel">Trade</button><button type="button" data-quick-buy-token="${i(e.tokenMint)}" data-quick-buy-source="${i(a.context||"signal-row")}" title="Quick buy with preset or custom SOL">${i(ka())}</button>`}
        <button type="button" data-quick-bundle-token="${i(e.tokenMint)}" title="Bundle buy across wallets">Bundle</button>
        ${l?Au(e):""}
        ${d}
        ${fp(e)}
      </div>
    </article>
  `}function co(e){const t=String(e||"");return!!(n.watchlist?.rows||[]).some(a=>String(a.tokenMint)===t)}function zt(e){const t=Qs(e);if(Number.isFinite(t))return t<60?`${Math.max(1,Math.floor(t))}s`:t<3600?`${Math.floor(t/60)}m`:`${Math.floor(t/3600)}h`;const r=["source-age","trusted-source-age"].includes(String(e.pairAgeSource||"").toLowerCase())?Number(e.pairAgeMinutes):Number.NaN;return Number.isFinite(r)?`${Math.max(0,Math.round(r))}m`:""}function PS(e){const t=Number(e||0);if(!Number.isFinite(t)||t===0)return"trend n/a";const a=t>0?"+":"";return`<span class="${t>=0?"positive":"negative"}">${a}${t.toFixed(Math.abs(t)>=10?0:1)}%</span>`}function uo(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{},o=e.info||e.profile||{},c=[e.imageUrl,e.avatarUrl,e.avatar_url,e.imageUri,e.image,e.iconUrl,e.icon,e.logoURI,e.logo,e.logoUrl,e.tokenImageUrl,e.token_image_url,e.pfp,e.avatar,r.imageUrl,r.imageUri,r.image_uri,r.image,r.logoURI,a.imageUrl,a.image,a.logoURI,a.logo,a.iconUrl,a.info?.imageUrl,a.baseToken?.imageUrl,a.baseToken?.logoURI,s.imageUrl,s.image,s.logoURI,s.logo,o.imageUrl,o.image,t.imageUrl,t.imageUri,t.image_uri,t.image,t.logoURI,t.logo,t.iconUrl];for(const l of c){const d=Qe(l);if(d)return d}return""}function mt(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.baseToken||e.base||{};return O(e.marketCap,e.marketCapUsd,e.market_cap,e.usdMarketCap,e.usd_market_cap,e.mcap,e.mc,e.fdv,e.fdvUsd,a.marketCap,a.marketCapUsd,a.market_cap,a.fdv,a.fdvUsd,a.baseToken?.marketCap,a.baseToken?.fdv,r.marketCap,r.marketCapUsd,r.usdMarketCap,r.usd_market_cap,r.market_cap,r.fdv,s.marketCap,s.fdv,t.marketCap,t.marketCapUsd,t.usdMarketCap,t.fdv)}function ft(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.liquidity||{};return O(e.liquidityUsd,e.liquidity_usd,e.currentLiquidityUsd,s.usd,s.quote,a.liquidityUsd,a.liquidity_usd,a.liquidity?.usd,a.liquidity?.quote,r.liquidityUsd,r.liquidity_usd,r.liquidity?.usd,t.liquidityUsd,t.liquidity_usd,t.liquidity?.usd)}function po(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeM15,e.volume15m,e.volume5m,e.volumeM5,e.volumeUsd,s.m15,s.m15m,s.m5,s.h1,a.volume?.m15,a.volume?.m5,a.volume?.h1,r.volumeM15,r.volume15m,r.volume5m,t.volume?.m15,t.volume?.m5,t.volumeM15,t.volume5m)}function Pr(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeH1,e.volume1h,e.volume_h1,e.volumeUsd,s.h1,s.m30,s.m15,a.volume?.h1,a.volume?.m30,a.volume?.m15,r.volumeH1,r.volume1h,t.volume?.h1,t.volumeH1)}function tm(e={}){const t=e.metadata||e.tokenMetadata||{},a=e.dex||e.dexScreener||e.pair||e.dexPair||{},r=e.pump||e.pumpFun||e.pumpfun||{},s=e.volume||{};return O(e.volumeH24,e.volume24h,e.volume_h24,s.h24,s.d1,a.volume?.h24,a.volume?.d1,r.volumeH24,r.volume24h,t.volume?.h24,t.volume?.d1,t.volumeH24)}function ht(e,t={}){const a=String(e.symbol||e.name||e.shortMint||"?").trim().slice(0,2).toUpperCase()||"?",r=uo(e),s=String(e.tokenMint||e.mint||e.tokenAddress||e.address||"").trim(),o=`token:${String(s||e.symbol||a).trim().toLowerCase()}`,c=D("tokenAvatarFixEnabled",!0),l=String(e.avatarState||"").trim().toLowerCase(),d=l==="missing"||l==="failed",u=!!e.avatarUrl&&(!l||l==="ready"),p=s&&!d?Qe(_g(e)):"",f=c?Ei(o,u?e.avatarUrl:"",p,d?"":r):Ei(o,p,r),y=c&&!d?p&&f!==p?p:r&&r!==f?r:"":"",b=!!t.priority,v=b?"eager":"lazy",P=b?"high":"low",A=l||(f?"ready":"missing");if(f){const g=y?` data-backup-src="${i(y)}"`:"",$=p?` data-proxy-src="${i(p)}"`:"";return`<div class="live-pair-avatar" data-avatar-state="${i(A)}"><img src="${i(f)}"${g}${$} data-avatar-src="${i(f)}" data-avatar-key="${i(o)}" alt="${i(e.symbol||e.name||"Token")}" loading="${v}" decoding="sync" fetchpriority="${P}" width="42" height="42" referrerpolicy="no-referrer" onload="window.__slimeRememberAvatar&&window.__slimeRememberAvatar(this.dataset.avatarKey,this.currentSrc||this.src);" onerror="window.__slimeAvatarLoadFailed&&window.__slimeAvatarLoadFailed(this);"><span>${i(a)}</span></div>`}return`<div class="live-pair-avatar fallback" data-avatar-state="${i(A)}"><span>${i(a)}</span></div>`}function CS(e=""){const t=String(e||"");let a=0;for(let r=0;r<t.length;r+=1)a+=t.charCodeAt(r);return a%5+1}function Ml(e=""){return`./assets/slimewire/png/token-mascots/token-mascot-${CS(e)}.png`}function Pa(e){return`Live pair ${e.symbol||w(e.tokenMint)} spotted on SlimeWire: MC ${e.marketCapLabel||"n/a"}, liq ${e.liquidityLabel||"n/a"}, age ${e.pairAgeLabel||zt(e)||"age unknown"}.`}function LS(){const e=[["safe","Safe Picks"],["smart","Smart Accumulation"],["fast","Fast Movers"],["pumpsnipe","PumpSnipe"],["moonshot","Low MC"],["meme","Narratives"],["long","Long Term"]],t=e.find(([a])=>a===n.scanMode)?.[1]||"Picks";return`
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${i(xS(n.scanMode))}</p>
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
        ${n.scan?RS():F("No scan loaded","Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${MS()}
      </aside>
    </section>
  `}function xS(e){const t={safe:"Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",smart:"Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",fast:"Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",pumpsnipe:"Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",moonshot:"Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",meme:"Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",long:"Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."};return t[e]||t.safe}function MS(){if(!n.wallets.length)return F("Create wallets to snipe","Sniper can scan without wallets, but buying needs at least one managed wallet.");const e=n.scanMode==="pumpsnipe",t=[{key:"wallets",label:"Wallets",hint:"Who buys",html:`
        <div class="wallet-checks">
          ${kt("sniper")}
        </div>
        ${Ut("sniper")}
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
            ${fs("sniper-loop-delay","data-sniper-loop-delay","0")}
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
      `},{key:"targets",label:"Per-Wallet",hint:"Exit targets",html:gs("sniper")||'<p class="trade-status">No per-wallet exit targets yet.</p>'}];return`
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${e?"PumpSnipe Setup":"Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      ${cn({toolKey:"sniperSetup",activeKey:dn("sniperSetup","wallets"),sections:t,variant:"stacked"})}
      <p class="trade-status" data-sniper-status>${n.sniperResult?i(n.sniperResult.message||"Sniper plan armed."):"Ready. Tap Snipe on a pick below."}</p>
      ${BS()}
    </section>
  `}function BS(){const e=n.sniperResult;return e?.results?.length?`<div class="mini-results">${e.results.map(t=>`<span data-ok="${t.ok?"true":"false"}">${i(t.message||t)}</span>`).join("")}</div>`:""}function RS(){const e=n.scan.rows||[],t=ot("sniper",e);return e.length?`
    <p class="scan-meta">${i(n.scan.label)} | ${t.length}/${e.length} shown | scored ${n.scan.scanned} | qualified ${n.scan.qualified} | mode-fit ${n.scan.modeFit} | display pool ${n.scan.displayPool||0}</p>
    ${pt(t,{context:"sniper",primaryAction:"snipe",primaryActionLabel:"Snipe",shareBuilder:Mg})}
    ${da("sniper",e,"snipe candidates")}
  `:F("No usable picks","Refresh again or choose a different mode.")}function mo(){return n.user?.connectedWallet?.publicKey||""}function am(){return n.ogreTek.markets.find(e=>e.symbol===n.ogreTek.selectedMarket)||n.ogreTek.markets[0]||null}function IS(){return{marketSymbol:n.ogreTek.selectedMarket,direction:n.ogreTek.direction,orderType:n.ogreTek.orderType,collateralUsd:n.ogreTek.collateralUsd,leverage:n.ogreTek.leverage,slippagePct:n.ogreTek.slippagePct,priorityFeeLamports:n.ogreTek.priorityFeeLamports,limitPrice:n.ogreTek.limitPrice,stopPrice:n.ogreTek.stopPrice}}function nm(){return _m(IS(),am(),n.ogreTek.account,Ae)}function $e(e,t=2){const a=Number(e);return Number.isFinite(a)?Math.abs(a)>=1e9?`$${(a/1e9).toFixed(2)}B`:Math.abs(a)>=1e6?`$${(a/1e6).toFixed(2)}M`:Math.abs(a)>=1e3?`$${(a/1e3).toFixed(1)}K`:`$${a.toFixed(t)}`:"n/a"}function gt(e){const t=Number(e);return Number.isFinite(t)?t>=1e3?`$${t.toLocaleString(void 0,{maximumFractionDigits:2})}`:`$${t.toFixed(t>=10?2:4)}`:"n/a"}function fo(e,t=3){const a=Number(e);return Number.isFinite(a)?`${a>=0?"+":""}${a.toFixed(t)}%`:"n/a"}function rm(e){const t=Date.parse(e||"");if(!t)return"not loaded";const a=Math.max(0,Math.round((Date.now()-t)/1e3));return a<60?`${a}s ago`:`${Math.round(a/60)}m ago`}function ho(){document.querySelectorAll("[data-ogre-tek-field]").forEach(e=>{const t=e.dataset.ogreTekField;!t||!(t in n.ogreTek)||(e.type==="checkbox"?n.ogreTek[t]=!!e.checked:n.ogreTek[t]=e.value)})}async function OS(){!Ae.enabled||n.ogreTek.loading||n.ogreTek.markets.length||n.ogreTek.error||await Cr({silent:!0}).catch(e=>{n.ogreTek.error=N(e.message),h({force:!0})})}async function Cr({force:e=!1,silent:t=!1}={}){if(Ae.enabled&&!(n.ogreTek.loading&&!e)){n.ogreTek.loading=!0,n.ogreTek.error="",t||h({force:!0});try{const a=mo(),[r,s,o,c]=await Promise.all([Br.getMarkets(),Br.getAccount(a),Br.getPositions(a),Br.getOpenOrders(a)]);n.ogreTek.markets=r||[],n.ogreTek.account=s||null,n.ogreTek.positions=o||[],n.ogreTek.orders=c||[],n.ogreTek.markets.some(l=>l.symbol===n.ogreTek.selectedMarket)||(n.ogreTek.selectedMarket=n.ogreTek.markets[0]?.symbol||"SOL-PERP"),n.ogreTek.status=`Updated ${new Date().toLocaleTimeString()}`}catch(a){n.ogreTek.error=N(a.message)}finally{n.ogreTek.loading=!1,h({force:!0})}}}function ES(){return`
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
  `}function FS(){if(Em(Ae)!=="enabled")return ES();const e=!!mo(),t=am(),a=nm(),r=a.quote,s=n.ogreTek.account,o=a.ok&&!n.ogreTek.loading,c=n.ogreTek.error?"Provider Error":n.ogreTek.loading?"Loading":"Ready",l=Ae.demoMode?"Review Demo Trade":"Review Trade",d=Ae.demoMode?"Confirm Demo Review":"Confirm Order",u=Ae.demoMode?!n.ogreTek.riskAccepted||!a.ok:!Im({validation:a,riskAccepted:n.ogreTek.riskAccepted,demoMode:Ae.demoMode});return`
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
            ${WS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${n.ogreTek.positions.length} open</span>
            </div>
            ${NS()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${DS()}
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
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${i(Ae.maxLeverage)}" step="0.5" value="${i(n.ogreTek.leverage)}">
                <span>${i(n.ogreTek.leverage)}x max ${i(Ae.maxLeverage)}x</span>
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
            ${_S(r,t)}
            ${sm(a)}
            <button class="primary" type="button" data-ogre-tek-review ${o?"":"disabled"}>${i(l)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${US(s)}
          </article>
        </aside>
      </section>
      ${n.ogreTek.reviewOpen?qS({validation:a,quote:r,market:t,confirmButtonText:d,confirmDisabled:u}):""}
    </section>
  `}function WS(){return n.ogreTek.loading&&!n.ogreTek.markets.length?F("Loading markets","Ogre Tek is loading demo perps markets."):n.ogreTek.markets.length?`
    <div class="ogre-market-grid">
      ${n.ogreTek.markets.map(e=>`
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${i(e.symbol)}" data-active="${e.symbol===n.ogreTek.selectedMarket}">
          <span>${i(e.symbol)}</span>
          <strong>${gt(e.indexPrice)}</strong>
          <small>Oracle ${gt(e.oraclePrice)} | 24h ${fo(e.change24hPct,2)}</small>
          <small>Funding ${fo(e.fundingRatePct,3)} | OI ${$e(e.openInterestUsd,0)}</small>
          <small>Fresh ${i(rm(e.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `:F("No markets available","No allowed perps markets are available for this provider.")}function _S(e,t){return`
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${gt(t?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${$e(e?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${gt(e?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${$e(e?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${$e(e?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${$e(e?.maxLossUsd)}</strong></span>
    </div>
  `}function sm(e){const t=e.errors||[],a=e.warnings||[];return!t.length&&!a.length?'<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>':`
    <div class="ogre-risk-list">
      ${t.map(r=>`<p data-kind="error">${i(r)}</p>`).join("")}
      ${a.map(r=>`<p data-kind="warning">${i(r)}</p>`).join("")}
    </div>
  `}function NS(){return mo()?n.ogreTek.positions.length?`
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${n.ogreTek.positions.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.side)} | margin ${fo(e.marginRatioPct,1)}</small></span>
          <span>${$e(e.sizeUsd)}<small>collateral ${$e(e.collateralUsd)}</small></span>
          <span>${gt(e.entryPrice)}<small>mark ${gt(e.markPrice)}</small></span>
          <span>${gt(e.liquidationPrice)}</span>
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
  `:F("No open positions","Mock positions will appear here when the provider reports them."):F("Wallet disconnected","Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.")}function DS(){return mo()?n.ogreTek.orders.length?`
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${n.ogreTek.orders.map(e=>`
        <div class="ogre-table-row">
          <span><strong>${i(e.marketSymbol)}</strong><small>${i(e.type)} ${i(e.side)}</small></span>
          <span>${gt(e.triggerPrice)}</span>
          <span>${$e(e.sizeUsd)}</span>
          <span>${i(e.status||"open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `:F("No orders","Open, trigger, and history orders will list here when a real adapter is configured."):F("Wallet disconnected","Connect a wallet to load open and trigger orders.")}function US(e){return e?.connected?`
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(e.walletBalanceSol||0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${$e(e.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${$e(e.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${$e(e.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${i(e.healthScore||0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${$e(e.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${i(e.maxLeverageAllowed||Ae.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${i(rm(e.updatedAt))}</strong></span>
    </div>
  `:"<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>"}function qS({validation:e,quote:t,market:a,confirmButtonText:r,confirmDisabled:s}){const o=e.order||{};return`
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
          <span><small>Collateral</small><strong>${$e(o.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${i(o.leverage||0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${gt(t?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${gt(t?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${$e(t?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${fo(a?.fundingRatePct,3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${$e(t?.maxLossUsd)}</strong></span>
        </div>
        ${sm(e)}
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
  `}function om(){return{role:"assistant",text:"Ogre Agent ready. Ask naturally: check this CA, show links, does it look risky, buy 0.1 SOL from wallet 1, sell half, refresh positions, find best picks, or ask where anything is on web or mobile.",actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Fast Mode",type:"toggle_agent_fast_mode"},{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}const Bl="slimewire:ogreAgentMessages:v1",Rl="slimewire:ogreAgentLastToken:v1";function HS(){try{const e=JSON.parse(localStorage.getItem(Bl)||"[]");return Array.isArray(e)?e.filter(t=>t&&typeof t=="object"&&String(t.text||"").trim()).slice(-50).map(t=>({role:t.role==="user"?"user":"assistant",text:String(t.text||"").slice(0,1200),actions:Array.isArray(t.actions)?t.actions.slice(0,4):[],retryText:String(t.retryText||"").slice(0,1200)})):[]}catch{return[]}}function KS(){try{localStorage.setItem(Bl,JSON.stringify($n().slice(-50)))}catch{}}function jt(){if(n.ogreAgentLastTokenMint)return String(n.ogreAgentLastTokenMint);try{n.ogreAgentLastTokenMint=String(localStorage.getItem(Rl)||"").trim()}catch{n.ogreAgentLastTokenMint=""}return n.ogreAgentLastTokenMint||""}function go(e=""){const t=String(e||"").trim();if(!t)return"";n.ogreAgentLastTokenMint=t;try{localStorage.setItem(Rl,t)}catch{}return t}function $n(){if(!Array.isArray(n.ogreAgentMessages)||!n.ogreAgentMessages.length){const e=HS();n.ogreAgentMessages=e.length?e:[om()]}return n.ogreAgentMessages}function VS(){const e=String(n.smartChartToken||n.tradeToken||jt()||"").trim(),t=e?$a(e):null,a=t?.tokenMint?at(t):null,r=e?Ep(e):null,s=e?Sl(e):null,o=Ts().slice(0,3),c=e?it().find(l=>String(l.tokenMint||"")===e):null;return{route:n.route,activeTab:n.activeTab,agentFastMode:n.ogreAgentFastMode,agentAutoTradeApproved:wo(),lastTokenMint:jt(),recentAgentMessages:$n().slice(-8).map(l=>({role:l.role==="user"?"user":"assistant",text:String(l.text||"").slice(0,600)})),smartChartToken:n.smartChartToken||"",tradeToken:n.tradeToken||"",livePairBucket:n.livePairBucket||"",slimeScopeMode:n.slimeScopeMode||"",walletConnected:!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey),walletCount:yi(),positionCount:it().length,totalSol:_t().toFixed(4),selectedTradePreset:bn("trade"),selectedBundlePreset:bn("bundle"),quickBuyAmount:String(Fl()||""),currentToken:e?{tokenMint:e,symbol:t?.symbol||"",name:t?.name||"",watched:co(e)}:null,slimeShield:a?{verdict:a.verdict,summary:a.summary,confidence:a.confidence,suggestedAction:a.suggestedAction,topFactors:(a.factors||[]).slice(0,4).map(l=>l.message||l.label||l.key)}:null,devInfoSummary:r?{status:r.status,confidence:r.confidence,summary:r.summary,likelyDevWalletShort:r.likelyDevWallet?w(r.likelyDevWallet):"",currentPositionStatus:r.currentPosition?.positionStatus||"unknown",launchesTracked:r.historicalStats?.launchesTracked||0}:null,kolDumpDetector:o.length?o.map(l=>({displayName:l.displayName,riskLabel:l.riskLabel,dumpRiskPercent:l.lowData?null:l.dumpRiskPercent,lowData:!!l.lowData,summary:or(l)})):[],replayBeforeBuy:s?{sampleSize:s.sampleSize,confidence:s.confidence,winRatePercent:s.winRatePercent,medianMaxDrawdownPercent:s.medianMaxDrawdownPercent,summary:s.summary}:null,pnlSummary:{realized:vi(),positions:it().length,totalSol:_t().toFixed(4)},profile:{hasReferralCode:!!n.user?.referralCode,referralCode:n.user?.referralCode||"",hasReferralPayoutWallet:!!n.user?.referralPayoutWallet,hasXHandle:!!(n.xHandle||n.user?.xHandle),traderBoardEnabled:n.user?.traderBoardVisible!==!1},selectedPosition:c?{tokenMint:c.tokenMint,uiAmount:c.uiAmount,estimatedValueSol:c.estimatedValueSol,openPnlSol:c.openPnlSol||c.realizedSol||""}:null,walletPublicKey:String(n.user?.connectedWallet?.publicKey||n.connectedWalletBalance?.publicKey||"").slice(0,80),recentPairs:im()}}function im(){const e=[],t=new Set,a=(r,s="feed")=>{if(!r)return;if(Array.isArray(r)){r.forEach(l=>a(l,s));return}if(Array.isArray(r.rows)){r.rows.forEach(l=>a(l,s));return}if(r.data&&Array.isArray(r.data.rows)){r.data.rows.forEach(l=>a(l,s));return}if(typeof r!="object")return;const o=String(r.tokenMint||r.mint||r.baseMint||r.tokenAddress||r.pairAddress||"").trim();if(!o)return;const c=o.toLowerCase();t.has(c)||(t.add(c),e.push({tokenMint:o,pairAddress:String(r.pairAddress||r.pair||"").trim(),symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim().slice(0,24),name:String(r.name||r.baseName||r.label||"").trim().slice(0,48),ageMinutes:Number(r.ageMinutes??r.pairAgeMinutes??r.ageMins??NaN),marketCap:Number(r.marketCap??r.marketCapUsd??r.fdv??NaN),liquidityUsd:Number(r.liquidityUsd??r.liquidity?.usd??NaN),volume5m:Number(r.volume5m??r.volume?.m5??NaN),volume1h:Number(r.volume1h??r.volumeH1??r.volume?.h1??NaN),buys5m:Number(r.buys5m??r.txns?.m5?.buys??NaN),sells5m:Number(r.sells5m??r.txns?.m5?.sells??NaN),score:Number(r.score??r.ogreScore??r.sniperScore??NaN),riskFlags:Array.isArray(r.riskFlags)?r.riskFlags.slice(0,6).map(String):[],riskLevel:String(r.riskLevel||r.risk||r.safetyNote||"").slice(0,40),twitterUrl:String(r.twitterUrl||r.xUrl||r.links?.twitter||r.links?.x||"").trim(),telegramUrl:String(r.telegramUrl||r.links?.telegram||"").trim(),websiteUrl:String(r.websiteUrl||r.website||r.links?.website||"").trim(),source:s}))};return a(n.livePairRows,"live-pairs"),a(n.slimeScopeRows,"slime-scope"),a(n.livePairs,"live-pairs"),Object.values(n.livePairsByBucket||{}).forEach(r=>a(r,"bucket")),Object.values(n.terminalFeeds||{}).forEach(r=>a(r,"terminal-feed")),e.sort((r,s)=>lm(s)-lm(r)).slice(0,24)}function lm(e={}){const t=A=>Number.isFinite(Number(A))?Number(A):0,a=t(e.ageMinutes),r=t(e.marketCap),s=t(e.liquidityUsd),o=t(e.volume5m),c=t(e.volume1h),l=Math.max(o,c*.18),d=a>0?Math.max(0,90-Math.min(a,360))/2.5:12,u=a>120?Math.min(42,(a-120)/4):0,p=r>0&&r<=125e3?22:r>0&&r<=25e4?11:r>65e4?-18:0,f=r>0?l/r:0,y=f>=.08?24:f>=.04?16:f>=.018?8:l>0?2:-18,b=Math.max(0,t(e.buys5m)-t(e.sells5m))*2.6,v=e.twitterUrl||e.telegramUrl||e.websiteUrl?10:0,P=Array.isArray(e.riskFlags)&&e.riskFlags.length?Math.min(16,e.riskFlags.length*3):0;return t(e.score)+d+p+y+Math.log10(1+o+c)*7+Math.log10(1+s)*3+b+v-P-u}function zS(e={}){return String(e.label||e.type||"Run").slice(0,40)}function jS(e={},t=0){const a=Array.isArray(e.actions)?e.actions.slice(0,4):[],r=e.role!=="user";return`
    <div class="ogre-agent-message ${e.role==="user"?"user":"assistant"}">
      <p>${i(e.text||"")}</p>
      ${r?`<div class="ogre-agent-message-tools"><button type="button" data-copy="${i(e.text||"")}">Copy</button>${e.retryText?`<button type="button" data-ogre-agent-retry="${t}">Retry</button>`:""}</div>`:""}
      ${a.length?`<div class="ogre-agent-actions">${a.map((s,o)=>`<button type="button" data-ogre-agent-action="${t}:${o}">${i(zS(s))}</button>`).join("")}</div>`:""}
    </div>
  `}function GS(){const e=!!(n.ogreAgentLoading||n.ogreAgentSpeaking),t=!!n.ogreAgentListening,a=!!n.ogreAgentVoiceEnabled;return`
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
  `}function XS(){const e=!!n.ogreAgentOpen,t=$n(),a=n.ogreAgentVoiceEnabled?"Voice On":"Voice Off",r=pm(),s=n.ogreAgentListening?"Stop":"Mic";return`
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
        ${e?GS():""}
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${t.map(jS).join("")}
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
  `}function E({force:e=!1}={}){let t=document.querySelector("[data-ogre-agent-mount]");t||(t=document.createElement("div"),t.dataset.ogreAgentMount="true",document.body.appendChild(t));const a=t.querySelector("[data-ogre-agent-input]"),r=!!(a&&document.activeElement===a),s=r?a.selectionStart:null,o=r?a.selectionEnd:null,c=t.querySelector("[data-ogre-agent-feed]"),l=c?c.scrollTop:0,d=c?c.scrollHeight-c.scrollTop-c.clientHeight<64:!0;a&&(n.ogreAgentDraft=a.value);const u=Array.isArray(n.ogreAgentMessages)?n.ogreAgentMessages:[],p=u[u.length-1]||{},f=[n.ogreAgentOpen?"open":"closed",n.ogreAgentLoading?"loading":"idle",n.ogreAgentStatus||"",u.length,p.role||"",p.text||"",Array.isArray(p.actions)?p.actions.length:0,n.ogreAgentVoiceEnabled?"voice-on":"voice-off",n.ogreAgentSpeaking?"speaking":"silent",n.ogreAgentListening?"listening":"not-listening"].join("|");if(!e&&r&&t.dataset.ogreAgentSignature===f)return;t.innerHTML=XS(),t.dataset.ogreAgentSignature=f,t.querySelector("[data-ogre-agent-close]")?.addEventListener("click",v=>{v.preventDefault(),v.stopPropagation(),vo()});const y=t.querySelector("[data-ogre-agent-input]");y&&(y.value=n.ogreAgentDraft||"",r&&(y.focus({preventScroll:!0}),s!==null&&o!==null&&y.setSelectionRange(s,o),setTimeout(()=>y.scrollIntoView({block:"nearest",behavior:"smooth"}),90)));const b=t.querySelector("[data-ogre-agent-feed]");b&&(e||d||n.ogreAgentLoading?b.scrollTop=b.scrollHeight:b.scrollTop=Math.min(l,Math.max(0,b.scrollHeight-b.clientHeight)))}document.addEventListener("focusin",e=>{const t=e.target?.matches?.("[data-ogre-agent-input]")?e.target:null;t&&setTimeout(()=>t.scrollIntoView({block:"nearest",behavior:"smooth"}),160)},{passive:!0});function fe(e={}){const t={role:e.role==="user"?"user":"assistant",text:String(e.text||"").slice(0,1800),actions:Array.isArray(e.actions)?e.actions.slice(0,4):[],retryText:String(e.retryText||"").slice(0,1200)};n.ogreAgentMessages=[...$n(),t].slice(-50),KS(),t.role==="assistant"&&dm(t.text||"")}function Il(){return typeof window<"u"&&"speechSynthesis"in window&&"SpeechSynthesisUtterance"in window}function JS(){if(!Il())return null;const e=window.speechSynthesis.getVoices?.()||[];if(!e.length)return null;const t=a=>{const r=`${a.name||""} ${a.voiceURI||""}`.toLowerCase(),s=String(a.lang||"").toLowerCase();let o=0;return(/^en[-_]/.test(s)||s==="en")&&(o+=18),/google|microsoft|natural|premium|enhanced|neural|online|siri|alex|daniel|guy|david|mark|george|james|fred/i.test(r)&&(o+=18),/google us english|microsoft guy|microsoft david|google uk english male|daniel|alex|george|james|mark/i.test(r)&&(o+=14),/female|zira|samantha|victoria|karen|moira|susan/i.test(r)&&(o-=2),/compact|eloquence|robot|novelty|whisper|bells|bubbles|organ|zarvox/i.test(r)&&(o-=25),a.localService&&(o+=3),o};return e.slice().sort((a,r)=>t(r)-t(a))[0]||e[0]||null}let Tn=null;function YS(){if(typeof window>"u")return null;const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{return(!Tn||Tn.state==="closed")&&(Tn=new e),Tn.state==="suspended"&&Tn.resume(),Tn}catch{return null}}function cm(e="reply"){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen)return;const t=YS();if(t)try{const a=t.currentTime,r=e==="online"?.22:.34,s=t.createGain(),o=t.createBiquadFilter(),c=t.createOscillator(),l=t.createOscillator(),d=t.createGain();s.gain.setValueAtTime(1e-4,a),s.gain.exponentialRampToValueAtTime(e==="online"?.08:.105,a+.035),s.gain.exponentialRampToValueAtTime(1e-4,a+r),o.type="lowpass",o.frequency.setValueAtTime(210,a),o.frequency.exponentialRampToValueAtTime(92,a+r),o.Q.setValueAtTime(5.2,a),c.type="sawtooth",c.frequency.setValueAtTime(e==="online"?92:68,a),c.frequency.exponentialRampToValueAtTime(e==="online"?64:49,a+r),l.type="sine",l.frequency.setValueAtTime(e==="online"?45:38,a),l.frequency.exponentialRampToValueAtTime(e==="online"?35:31,a+r),d.gain.setValueAtTime(.18,a),d.gain.exponentialRampToValueAtTime(1e-4,a+r),c.connect(o),o.connect(s),l.connect(d),d.connect(s),s.connect(t.destination),c.start(a),l.start(a),c.stop(a+r+.02),l.stop(a+r+.02)}catch{}}function Pt(e=!1){n.ogreAgentSpeaking=!!e,n.ogreAgentOpen&&E({force:!0})}function bo(){if(!Il()){Pt(!1);return}try{window.speechSynthesis.cancel()}catch{}Pt(!1)}function QS(e=""){return String(e||"").replace(/https?:\/\/\S+/gi," link available ").replace(/[•*_`#>~|]+/g," ").replace(/\b[A-HJ-NP-Za-km-z1-9]{32,44}\b/g," token address ").split(/\n+/).map(r=>r.replace(/^\d+\.\s*/,"").trim()).filter(r=>r&&!/^(open|refresh|show|check|buy|sell|dex|pump|telegram|website|x search|kol tracker)\b/i.test(r)).join(". ").replace(/\s+/g," ").split(/(?<=[.!?])\s+/).map(r=>r.trim()).filter(Boolean).slice(0,3).join(" ").trim().slice(0,360)}function dm(e=""){if(!n.ogreAgentVoiceEnabled||!n.ogreAgentOpen||!Il()){Pt(!1);return}const t=QS(e);if(!t){Pt(!1);return}try{window.speechSynthesis.cancel();const a=new window.SpeechSynthesisUtterance(t),r=JS();r&&(a.voice=r),a.pitch=.72,a.rate=.86,a.volume=1,a.onstart=()=>Pt(!0),a.onend=()=>Pt(!1),a.onerror=()=>Pt(!1),Pt(!0),cm("reply"),window.speechSynthesis.speak(a)}catch{Pt(!1)}}function ZS(e){n.ogreAgentVoiceEnabled=!!e;try{localStorage.setItem("ogreAgentVoiceEnabled",n.ogreAgentVoiceEnabled?"on":"off")}catch{}n.ogreAgentVoiceEnabled?(n.ogreAgentStatus="Ogre voice on.",cm("online"),dm("Ogre voice online.")):(bo(),n.ogreAgentStatus="Ogre voice muted."),E({force:!0})}function um(){return typeof window>"u"?null:window.SpeechRecognition||window.webkitSpeechRecognition||null}function pm(){return!!um()}async function mm(){if(typeof navigator>"u"||!navigator.mediaDevices?.getUserMedia)return"unavailable";try{return(await navigator.mediaDevices.getUserMedia({audio:!0}))?.getTracks?.().forEach(t=>{try{t.stop()}catch{}}),"granted"}catch(e){const t=String(e?.name||e?.message||"").toLowerCase();return/notallowed|permission|denied/.test(t)?"denied":/notfound|notreadable|overconstrained/.test(t)?"unavailable":"failed"}}function fm(e=""){const t=String(e||"").replace(/\s+/g," ").trimStart();n.ogreAgentDraft=t;const a=document.querySelector("[data-ogre-agent-input]");if(a){a.value=t;try{a.focus({preventScroll:!0}),a.setSelectionRange(t.length,t.length)}catch{}}}function yo(){ea&&(clearTimeout(ea),ea=null),_a&&(clearTimeout(_a),_a=null)}function hm(e,t=n.ogreAgentSpeechRecognizer){_a&&clearTimeout(_a),_a=setTimeout(()=>{e!==rt||n.ogreAgentSpeechRecognizer!==t||Gt("Mic timed out instead of staying open. Tap Mic again or type the command.")},tf)}function Gt(e=""){rt+=1,yo();const t=n.ogreAgentSpeechRecognizer;if(n.ogreAgentSpeechRecognizer=null,n.ogreAgentListening=!1,n.ogreAgentSpeechFinal="",t){t.onstart=null,t.onresult=null,t.onerror=null,t.onend=null;try{t.abort?.()}catch{}try{t.stop?.()}catch{}}e&&(n.ogreAgentStatus=e),n.ogreAgentOpen&&E({force:!0})}async function ek(){if(!pm()){const o=await mm();n.ogreAgentStatus=o==="denied"?"Mic permission was denied. Allow microphone access, then use Chrome or Edge speech input.":"This browser does not expose speech-to-text to SlimeWire. Typing and device keyboard dictation still work.",E({force:!0});return}n.ogreAgentLoading&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Cleared the stuck reply. Mic is opening..."),bo(),Gt();const e=rt;n.ogreAgentStatus="Checking microphone permission...",E({force:!0});const t=await mm();if(e!==rt||!n.ogreAgentOpen)return;if(t==="denied"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic permission denied. Allow microphone access to talk to Ogre.",E({force:!0});return}if(t==="unavailable"){n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="No microphone is available to this browser. Typing still works.",E({force:!0});return}const a=um(),r=new a,s=++rt;n.ogreAgentSpeechRecognizer=r,n.ogreAgentListening=!0,n.ogreAgentSpeechBaseDraft=String(document.querySelector("[data-ogre-agent-input]")?.value||n.ogreAgentDraft||"").trim(),n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Opening microphone...",E({force:!0}),r.continuous=!1,r.interimResults=!0,r.maxAlternatives=1,r.lang=/^en/i.test(navigator.language||"")?navigator.language:"en-US",ea=setTimeout(()=>{s!==rt||n.ogreAgentSpeechRecognizer!==r||Gt("Mic did not start. Check browser permission, then tap Mic again.")},ef),r.onstart=()=>{s!==rt||n.ogreAgentSpeechRecognizer!==r||(ea&&(clearTimeout(ea),ea=null),n.ogreAgentListening=!0,n.ogreAgentStatus="Listening... speak your Ogre command.",hm(s,r),E({force:!0}))},r.onresult=o=>{if(s!==rt||n.ogreAgentSpeechRecognizer!==r)return;hm(s,r);let c="",l="";for(let u=o.resultIndex||0;u<o.results.length;u+=1){const p=String(o.results[u]?.[0]?.transcript||"");o.results[u]?.isFinal?l+=` ${p}`:c+=` ${p}`}l.trim()&&(n.ogreAgentSpeechFinal=`${n.ogreAgentSpeechFinal||""} ${l}`.replace(/\s+/g," ").trim());const d=[n.ogreAgentSpeechBaseDraft,n.ogreAgentSpeechFinal,c.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").trim();fm(d)},r.onerror=o=>{if(s!==rt||n.ogreAgentSpeechRecognizer!==r)return;yo();const c=String(o?.error||"");n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus=c==="not-allowed"?"Mic permission denied. Allow microphone access to talk to Ogre.":c==="no-speech"?"No voice heard. Tap Mic and try again.":c==="aborted"?"Voice input stopped.":"Voice input stopped. Typing still works.",E({force:!0})},r.onend=()=>{if(s!==rt||n.ogreAgentSpeechRecognizer!==r)return;yo();const o=String(n.ogreAgentDraft||"").trim(),c=!!(o&&n.ogreAgentSpeechFinal&&!n.ogreAgentLoading);n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentStatus=c?"Voice command captured.":"Voice input stopped.",E({force:!0}),c&&setTimeout(()=>{fm(o),bt()},100)};try{r.start()}catch{yo(),n.ogreAgentListening=!1,n.ogreAgentSpeechRecognizer=null,n.ogreAgentSpeechFinal="",n.ogreAgentStatus="Mic could not start. Typing still works.",E({force:!0})}}function tk(){n.ogreAgentListening||n.ogreAgentSpeechRecognizer?Gt("Voice input stopped."):ek()}function vo(){n.ogreAgentOpen=!1,n.ogreAgentStatus="",n.ogreAgentLoading=!1,n.ogreAgentRequestId="",Gt(),bo(),E({force:!0})}function ak(e=""){const[t,a]=String(e).split(":");return $n()[Number(t)]?.actions?.[Number(a)]||null}function gm(){return Array.isArray(n.wallets)&&n.wallets.length>0}function bm(){return!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.walletPublicKey||n.connectedWalletPublicKey)}function wo(){return!!(!ym()&&(n.ogreAgentAutoTradeApproved||gm()||bm()))}function nk(e="wallet-sync"){return ym()?!1:gm()||bm()?(El(!0),!0):(Ol(),!1)}function ym(){try{return sessionStorage.getItem("ogreAgentAutoTradeRevoked")==="yes"}catch{return!1}}function Ol(){n.ogreAgentAutoTradeApproved=!1;try{sessionStorage.removeItem("ogreAgentAutoTradeApproved"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked"),localStorage.removeItem("ogreAgentAutoTradeApproved")}catch{}}function El(e,t={}){n.ogreAgentAutoTradeApproved=!!e;try{localStorage.removeItem("ogreAgentAutoTradeApproved"),n.ogreAgentAutoTradeApproved?(sessionStorage.setItem("ogreAgentAutoTradeApproved","yes"),sessionStorage.removeItem("ogreAgentAutoTradeRevoked")):(sessionStorage.removeItem("ogreAgentAutoTradeApproved"),t.revoked&&sessionStorage.setItem("ogreAgentAutoTradeRevoked","yes"))}catch{}}function vm(e){n.ogreAgentFastMode=!!e;try{localStorage.setItem("ogreAgentFastMode",n.ogreAgentFastMode?"on":"off")}catch{}}function Ct(e=""){const t=String(e||"").toLowerCase(),a=/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t),r=/\b(sell|exit|close|dump|cash out)\b/.test(t),s=/\b(take profit|tp)\b/.test(t)&&!/\b(set|with|stop loss|sl|target|preset)\b/.test(t);return a?"buy":r||s?"sell":""}function rk(e=""){const t=String(e||"").toLowerCase(),a=Ct(t);if(!a||/\b(if|only if|unless|after you check|check first|looks good|seems good|safe enough|popular enough|passes|good choice|good pick)\b/.test(t))return!1;const r=/\b(will you|would you|can you|could you|are you able|do i have to|will it|you will be able)\b/.test(t),s=a==="buy"?/\b(buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry)\b/.test(t):/\b(sell|exit|close|dump|cash out)\b/.test(t),o=!!(jt()||n.smartChartToken||n.tradeToken),c=/\b(now|please|with|for|from|wallet|sol|%|all|half|quarter|this|it)\b/.test(t)||/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/.test(e)||a==="buy"&&o&&/\b(just\s+)?buy\b/.test(t);return!!(s&&c&&!r)}function sk(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:buy|ape|enter|grab|snipe|purchase|get in|go in|long|take entry).*?(?:with|for|using)\s*(\d+(?:\.\d+)?)\s*sol\b/)||t.match(/(\d+(?:\.\d+)?)\s*sol\b/)||[])[1];return a?Number(a):0}function Fl(){const e=typeof ut=="function"?ut():null,t=Number(n.quickBuyAmountOverride||(typeof ze=="function"?ze(e):"")||e?.amountSol||"0");return Number.isFinite(t)&&t>0?t:0}function ok(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(?:take\s*profit|profit\s*take|tp|target|profit)[^0-9]*(\d{1,4}(?:\.\d+)?)\s*%?/)||[])[1]||"",r=(t.match(/(?:stop\s*loss|stoploss|sl)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",s=(t.match(/(?:slippage|slip)[^0-9]*(\d{1,3}(?:\.\d+)?)\s*%?/)||[])[1]||"",o=s?Math.round(Number(s)*100):0,c=[];return a&&c.push(`TP +${a}%`),r&&c.push(`SL -${r}%`),s&&c.push(`slippage ${s}%`),{takeProfitPct:a,stopLossPct:r,slippagePct:s,slippageBps:Number.isFinite(o)&&o>0?o:0,summary:c.join(" / ")}}function ik(e=""){const t=String(e||"").toLowerCase(),a=(t.match(/(\d{1,3})\s*%/)||[])[1];return a||(/\bhalf\b/.test(t)?"50":/\bquarter\b/.test(t)?"25":(/\ball\b|\bfull\b|100/.test(t),"100"))}function lk(e=""){const t=(String(e||"").toLowerCase().match(/(?:wallet|from)\s*#?\s*(\d{1,2})/)||[])[1];return t?Math.max(0,Number(t)-1):void 0}function ck(){const e=[],t=(r={})=>{const s=String(r.tokenMint||r.mint||r.tokenAddress||r.baseMint||r.pairAddress||"").trim();s&&e.push({tokenMint:s,symbol:String(r.symbol||r.baseSymbol||r.ticker||"").trim(),name:String(r.name||r.baseName||r.label||"").trim()})};n.smartChartToken&&t({tokenMint:n.smartChartToken,symbol:n.smartChartTokenSymbol}),n.tradeToken&&t({tokenMint:n.tradeToken,symbol:n.tradeTokenSymbol}),[n.livePairRows,n.slimeScopeRows,n.watchlist,n.positions,n.portfolioRows,n.ogreAiResult?.candidates].filter(Array.isArray).forEach(r=>r.forEach(t));const a=new Set;return e.filter(r=>{const s=r.tokenMint.toLowerCase();return a.has(s)?!1:(a.add(s),!0)})}function dk(e=""){const t=String(e||"").trim(),a=(t.match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0];if(a)return a;const r=t.toLowerCase();return ck().map(o=>{const c=o.symbol.toLowerCase(),l=o.name.toLowerCase();let d=0;return c&&new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(r)&&(d+=12+c.length),l&&r.includes(l)&&(d+=8+Math.min(16,l.length)),{...o,score:d}}).filter(o=>o.score>0).sort((o,c)=>c.score-o.score)[0]?.tokenMint||""}function So(e={},t=""){const a={...e},r=Ct(t);if(!a.tokenMint&&!a.mint&&!a.ca){const s=dk(t)||jt()||n.smartChartToken||n.tradeToken;s&&(a.tokenMint=s)}if(a.type==="confirm_buy"||r==="buy"){if(a.type=a.type||"confirm_buy",!a.amountSol){const o=sk(t)||Fl();o>0&&(a.amountSol=o)}const s=ok(t);if(s.takeProfitPct&&!a.takeProfitPct&&(a.takeProfitPct=s.takeProfitPct),s.stopLossPct&&!a.stopLossPct&&(a.stopLossPct=s.stopLossPct),s.slippageBps&&!a.slippageBps&&(a.slippageBps=s.slippageBps),a.walletIndex===void 0){const o=lk(t);o!==void 0&&(a.walletIndex=o)}}return(a.type==="confirm_sell"||r==="sell")&&(a.type=a.type||"confirm_sell",a.percent=a.percent||ik(t)),a}function wm(e={}){const t=[];return e.takeProfitPct&&t.push(`TP +${e.takeProfitPct}%`),e.stopLossPct&&t.push(`SL -${e.stopLossPct}%`),t.length?` Targets noted: ${t.join(" / ")}.`:""}function Sm(e={},t=""){if(!n.ogreAgentFastMode||!wo()||e.requiresReview||e.conditional)return!1;const a=Ct(t);return a?a==="buy"?e.type==="confirm_buy"&&!!(e.tokenMint||e.mint||e.ca)&&Number(e.amountSol||e.sol||e.amount||0)>0:a==="sell"?e.type==="confirm_sell"&&!!(e.tokenMint||e.mint||e.ca):!1:!1}async function Xt(e={}){const t=String(e.type||""),a=String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||jt()||"").trim();if(t==="toggle_agent_fast_mode"){vm(!n.ogreAgentFastMode),n.ogreAgentStatus=n.ogreAgentFastMode?"Fast Mode ON: clear trade requests run directly.":"Fast Mode OFF: Ogre will stage actions first.",fe({role:"assistant",text:n.ogreAgentStatus,actions:[{label:n.ogreAgentFastMode?"Turn Fast Mode Off":"Turn Fast Mode On",type:"toggle_agent_fast_mode"}]}),E();return}if(t==="approve_agent_auto_trade"){El(!0),vm(!0),n.ogreAgentStatus="Agent Auto-Trade is enabled for this session. SlimeWire managed/session wallets run directly through the saved trade flow; connected wallets still approve direct wallet trades.",fe({role:"assistant",text:`${n.ogreAgentStatus}
External wallet apps may still require their own signature prompts. Managed wallets can run through the saved SlimeWire flow.`,actions:[{label:"Revoke Auto-Trade",type:"revoke_agent_auto_trade"},{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Best Picks",type:"open_tab",tab:"ogreAi"}]}),E();return}if(t==="revoke_agent_auto_trade"){El(!1,{revoked:!0}),n.ogreAgentStatus="Agent Auto-Trade revoked. Ogre will still help, but direct trade requests need approval again.",fe({role:"assistant",text:n.ogreAgentStatus,actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"}]}),E();return}if(t==="open_tab"){n.route="terminal",n.activeTab=e.tab||"terminal",window.history.pushState({},"",e.path||"/terminal"),h({force:!0});return}if(t==="open_chart"||t==="prepare_buy"){if(!a){n.ogreAgentStatus="Paste a token CA in the message first.",E();return}$t(ve(a,{source:"ogre-agent"}),{defaultTab:t==="prepare_buy"?"buy":"chart",focusAmountInput:t==="prepare_buy",source:"ogre-agent"});return}if(t==="prepare_sell"){n.route="terminal",n.activeTab="positions",window.history.pushState({},"","/terminal"),n.ogreAgentStatus=e.percent?`Sell ${e.percent}% staged. Use the position card confirm buttons.`:"Open Positions and use the sell confirm buttons.",h({force:!0});return}if(t==="refresh_wallet"){ne(()=>St({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Wallet refresh started.",E();return}if(t==="refresh_feeds"){ne(()=>en({force:!0,reason:"ogre_agent"})),n.ogreAgentStatus="Feed refresh started.",E();return}if(t==="open_wallet_connect"){ma({returnPath:"/terminal"}),n.ogreAgentStatus="Wallet connect opened.",E();return}if(t==="start_clip_recording"){gd(),n.ogreAgentStatus="REC started from Ogre Agent.",E();return}if(e.type==="open_quick_buy"){const r=String(e.tokenMint||e.mint||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim();if(!r){n.ogreAgentStatus="Send me a token address first, then I can open the buy panel.",E();return}Number(e.amountSol||e.sol||e.amount||0)>0&&(n.quickBuyAmountOverride=String(e.amountSol||e.sol||e.amount||"")),mn(ve(r,{source:"ogre-agent-open-buy"}),{source:"ogre-agent-open-buy",forceModal:!0}),n.ogreAgentStatus="Buy panel opened. Review it and confirm with your wallet.",E();return}if(e.type==="confirm_buy"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||n.smartChartToken||n.tradeToken||jt()||"").trim(),s=Number(e.amountSol||e.sol||e.amount||Fl()||0);if(!r||!Number.isFinite(s)||s<=0){r&&mn(ve(r,{source:"ogre-agent-buy-missing-amount"}),{source:"ogre-agent-buy-missing-amount",forceModal:!0}),n.ogreAgentStatus=r?"Buy panel opened. Pick the SOL amount and confirm with your wallet.":"Tell me the token address and amount, like: buy 0.1 SOL of CA.",E();return}const o=e.walletIndex!==void 0?e.walletIndex:ue()?.publicKey?"connected":n.wallets[0]?.index??0,c=Number.isFinite(Number(e.slippageBps))?Number(e.slippageBps):void 0;n.ogreAgentLoading=!0,n.ogreAgentStatus=`Sending ${s} SOL buy request...`,E();try{const l=await _s({tokenMint:r,walletIndex:o,amountSol:s,slippageBps:c,takeProfitPct:e.takeProfitPct||"",stopLossPct:e.stopLossPct||"",source:"ogre-agent-confirm-buy"});n.ogreAgentStatus=l?.ok===!1?l.error||l.message||"Buy failed. Check wallet/RPC status and retry.":`Buy submitted. Refreshing wallet and positions in the background.${wm(e)}`,typeof St=="function"&&St({force:!0,reason:"ogre_agent_buy"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_buy"})}catch(l){n.ogreAgentStatus=l?.message||"Buy failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="confirm_sell"){const r=String(e.tokenMint||e.mint||e.ca||n.selectedToken?.mint||n.selectedToken?.pairAddress||"").trim(),s=String(e.percent||e.percentText||"100").replace(/[^0-9.]/g,"")||"100";if(!r){n.activeTab="positions",n.ogreAgentStatus="I opened Positions. Pick a token or tell me the CA to sell.",h();return}n.ogreAgentLoading=!0,n.ogreAgentStatus=`Preparing sell ${s}%...`,E();try{await Ds(r,s,{skipConfirm:!0,source:"ogre-agent-confirm-sell"}),n.ogreAgentStatus=`Sell ${s}% submitted. Refreshing wallet and positions in the background.`,typeof St=="function"&&St({force:!0,reason:"ogre_agent_sell"}),typeof refreshPositionsNow=="function"&&refreshPositionsNow({force:!0,reason:"ogre_agent_sell"})}catch(o){n.ogreAgentStatus=o?.message||"Sell failed. Check wallet/RPC status and retry."}finally{n.ogreAgentLoading=!1,E()}return}if(e.type==="open_external"){const r=String(e.url||e.href||"").trim();if(!/^https?:\/\//i.test(r)){n.ogreAgentStatus="That link is not available yet. Send the token CA and ask for links.",E();return}window.open(r,"_blank","noopener,noreferrer"),n.ogreAgentStatus="Opened trusted coin link.",E();return}if(e.type==="coin_breakdown"||e.type==="analyze_coin"){const r=go(String(e.tokenMint||e.mint||e.ca||n.smartChartToken||n.tradeToken||jt()||"").trim());if(!r){n.ogreAgentStatus="Paste a token CA and ask me to check it.",E();return}const s=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e9?`$${(c/1e9).toFixed(2)}B`:c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};n.ogreAgentLoading=!0,n.ogreAgentStatus="Checking coin details...",E();try{const c=(await k(`/api/web/dex-token?token=${encodeURIComponent(r)}`,{timeoutMs:8e3,dedupe:!1,preserveSafeError:!0}))?.dexToken||{},l=c.symbol||c.baseSymbol||w(r),d=c.name||c.baseName||"Token",u=c.dexUrl||c.pairUrl||`https://dexscreener.com/solana/${r}`,p=c.pumpUrl||(String(r).toLowerCase().endsWith("pump")?`https://pump.fun/coin/${r}`:""),f=c.websiteUrl||c.website||c.links?.website||"",y=c.twitterUrl||c.xUrl||c.links?.twitter||c.links?.x||"",b=c.telegramUrl||c.links?.telegram||"",v=s(c.liquidityUsd||c.liquidity?.usd),P=s(c.marketCap||c.fdv||c.marketCapUsd),A=s(c.volume24h||c.volume?.h24||c.volume?.m5),g=[`${l} breakdown`,`${d} | ${w(r)}`,`MC/FDV: ${P} | Liquidity: ${v} | Volume: ${A}`,`Socials: X ${y?"found":"not returned"} | Telegram ${b?"found":"not returned"} | Website ${f?"found":"not returned"}`,"Read: look for live buys vs sells, liquidity depth, holder/risk badges, socials, and whether the chart is building higher lows.","Risk note: fresh Solana launches can still rug even with good socials. Size smaller until liquidity, volume, and holder distribution prove out."],$=[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:u}];p&&$.push({label:"Pump",type:"open_external",url:p}),f&&$.push({label:"Website",type:"open_external",url:f}),y&&$.push({label:"X",type:"open_external",url:y}),b&&$.push({label:"Telegram",type:"open_external",url:b}),fe({role:"assistant",text:g.join(`
`),actions:$}),n.ogreAgentStatus="Coin breakdown ready."}catch(o){fe({role:"assistant",text:`I could not pull live metadata for ${w(r)} yet, but I can still open chart, Dex, Pump, or help inspect risk badges.`,actions:[{label:"Open Chart",type:"open_chart",tokenMint:r},{label:"Dex",type:"open_external",url:`https://dexscreener.com/solana/${r}`},{label:"Pump",type:"open_external",url:`https://pump.fun/coin/${r}`}]}),n.ogreAgentStatus=o?.message||"Coin check delayed."}finally{n.ogreAgentLoading=!1,E()}return}n.ogreAgentStatus="Action noted. Ask Ogre to open a panel, chart, refresh, trade, or check a coin.",E()}function uk(e=""){return/\b(check|analy[sz]e|rug|honeypot|community|social|website|telegram|twitter|x\b|links?|good choice|good pick|good buy|bullish|bearish|safe|risky|risk|will it do well|looks good|breakdown|details?)\b/i.test(String(e||""))}function Wl(e=""){return(String(e||"").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/)||[])[0]||""}function km(e=""){return/\b(x|twitter|tweet|tweets|post|posts|posting|mentions?|popular|viral|trending|trend|kols?|influencers?|callers?|community|socials?)\b/i.test(String(e||""))}function pk(e="",t=[]){const a=[String(e||"").trim(),...Array.isArray(t)?t:[t]].map(s=>String(s||"").trim()).filter((s,o,c)=>s&&c.findIndex(l=>l.toLowerCase()===s.toLowerCase())===o).slice(0,4),r=a.length?a.map(s=>`"${s.replace(/"/g,"")}"`).join(" OR "):`"${String(e||"").trim()}"`;return`https://x.com/search?q=${encodeURIComponent(r)}&src=typed_query&f=live`}function mk(e=""){if(!km(e))return null;const t=go(Wl(e)||jt()||n.smartChartToken||n.tradeToken||"");return t?{text:[`${w(t)} X/KOL check`,"I kept this token active in the conversation. Server social scan is still warming, so I can use SlimeWire-visible rows and open live X search without inventing callers.","If no verified posts or KOL rows return, treat the social side as unconfirmed and check chart, liquidity, buys/sells, and risk badges before sizing."].join(`
`),actions:[{label:"Open X Search",type:"open_external",url:pk(t)},{label:"Open Chart",type:"open_chart",tokenMint:t},{label:"KOL Tracker",type:"open_tab",tab:"kol"},{label:"Refresh Feeds",type:"refresh_feeds"}]}:null}function fk(e=""){const t=String(e||"").toLowerCase();return/\b(top|best|hot|trending|trend|viral|runner|moving|today|now|low mc|low mcap|fresh|climbing|x2|2x)\b/.test(t)&&/\b(meme|memecoin|coin|token|pair|launch|x|twitter|volume|market cap|mc)\b/.test(t)}function hk(e=""){if(!fk(e))return null;const t=im().slice(0,4),a=o=>{const c=Number(o);return!Number.isFinite(c)||c<=0?"n/a":c>=1e6?`$${(c/1e6).toFixed(2)}M`:c>=1e3?`$${(c/1e3).toFixed(1)}K`:`$${c.toFixed(c>=1?2:6)}`};if(!t.length)return{text:["Fast scan is ready, but I do not have fresh rows loaded in this screen yet.","Tap Refresh Feeds, then ask again. If a broad X result is not returned, I will rank SlimeWire-visible live candidates and exact live-search links instead of faking callers."].join(`
`),actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]};const r=["Fresh low-MC momentum scan from SlimeWire live context right now:",...t.map((o,c)=>{const l=o.symbol||w(o.tokenMint),d=Number.isFinite(Number(o.ageMinutes))?`${Math.max(0,Math.round(Number(o.ageMinutes)))}m old`:"age n/a",u=o.twitterUrl||o.telegramUrl||o.websiteUrl?"socials found":"socials not returned",p=Array.isArray(o.riskFlags)&&o.riskFlags.length?`risk: ${o.riskFlags.slice(0,2).join(", ")}`:"risk pending";return`${c+1}. ${l} ${w(o.tokenMint)} | MC ${a(o.marketCap)} | Liq ${a(o.liquidityUsd)} | Vol ${a(o.volume5m||o.volume1h)} | ${d} | ${u} | ${p}`}),"X note: I rank visible fresh rows by low MC, real volume, buy pressure, liquidity, age, socials, and risk flags instead of guessing."],s=t[0];return{text:r.join(`
`),actions:[s?.tokenMint?{label:"Open Top Chart",type:"open_chart",tokenMint:s.tokenMint}:null,{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}].filter(Boolean)}}const gk=[["terminal",["terminal","command center","cooks","main feed","live feed","home"]],["live",["live pairs","fresh pairs","new pairs","pairs"]],["slimeScope",["slime scope","scope","scanner","cook spot"]],["smartChart",["smart chart","chart page","charting"]],["trade",["trade desk","trade page","swap page","slime swap","manual trade"]],["bundle",["bundle","bundle buy","multi wallet buy"]],["volume",["volume","slimebot","slime bot","volume bot"]],["sniper",["sniper","ogre sniper","snipe picks","picks"]],["launchCoin",["pump launch","launch a coin","launch coin","create coin","create a token","make a coin","launcher"]],["launch",["launch watch","launch watches","watch launches","snipe launches"]],["kol",["kol","kols","kol tracker","copy trading","copy wallet"]],["ogreAi",["ogre ai","ogre a.i","autopilot","auto pilot","ai buyer"]],["wallets",["wallets","wallet page","balances","my wallets","fund","sweep"]],["positions",["positions","open positions","bags","holdings","my coins"]],["pnl",["pnl","profit","results","p&l","pnl card","share card"]],["txAudit",["tx audit","stop loss audit","audit","armed plans","my plans","tp sl status"]],["profile",["profile","account","referral","referrals","badges","pfp","alerts","push alerts","notifications"]],["tek",["ogre tek","tek hub","tools","tool hub","automation deck","shield receipts","receipts"]],["ogreTek",["perps","perp","perp mode","leverage"]],["watchlist",["watchlist","watch list","saved coins","saved tokens"]],["liveTrades",["live trades","recent trades","trade history"]]],bk=/\b(open|go to|goto|show me|show|take me|bring up|pull up|switch to|navigate|where is|where's|wheres|where are|where do i|how do i (?:get to|open|find)|find)\b/i;function yk(e){const t=String(e||"").toLowerCase().replace(/[?!.]+$/g,"").trim();if(!t||t.length>120||Wl(e)||Ct(e))return null;const a=/(?:set\s+)?quick\s*buy(?:\s+amount)?\s*(?:to|at|=)?\s*([0-9]*\.?[0-9]+)\s*(?:sol)?$/i.exec(t);if(a){const s=yr(a[1]);if(s)return n.quickBuyAmountOverride=s,os({quickBuy:s}),Zs(),{text:`Quick buy set to ${s} SOL - every Buy button across the site now fires with that amount.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\b(i (?:like|prefer|want|am)|keep (?:it|them)|show me|give me)\b/.test(t)){if(/\b(risky|degen|moonshots?|early|low\s*mc|gambl)/.test(t))return os({risk:"degen"}),{text:"Noted - early risky plays it is. The fresh low-MC line in the brief is yours, and I'll keep that preference next visit too.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Sniper",type:"open_tab",tab:"sniper"}]};if(/\b(safe|careful|low risk|clean|less risky)\b/.test(t))return os({risk:"careful"}),{text:"Noted - shield-clean setups first. I'll remember that next visit. SlimeShield verdicts are on every pair and /t page.",actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}}if(/\brefresh\b.*\b(feed|pairs|scan)/.test(t)||t==="refresh feeds")return{text:"Refreshing the live feeds now.",run:{type:"refresh_feeds"},actions:[]};if(/\brefresh\b/.test(t)||/\bsync\b.*\b(wallet|balance|position)/.test(t))return{text:"Refreshing wallets, balances, and positions now.",run:{type:"refresh_wallet"},actions:[]};if(/\b(connect|link|hook up)\b.*\bwallet\b/.test(t))return{text:"Opening the wallet connect chooser.",run:{type:"open_wallet_connect"},actions:[]};if(/what can you do|what do you do|help me|how do you work|what are you/.test(t))return{text:`I can take you anywhere on the site (just say "open positions" or "where is the sniper"), check any coin (paste a CA), run buys and sells ("buy 0.1 of <CA>"), set your quick-buy amount, refresh wallets and feeds, and read risk with SlimeShield. Ask in your own words - I'll keep up.`,actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Ogre Tek",type:"open_tab",tab:"tek"}]};const r=bk.test(t);for(const[s,o]of gk)for(const c of o){if(!(t===c||t===`the ${c}`||t===`my ${c}`)&&!(r&&t.includes(c)))continue;return{text:`Opening ${vk(s)} now.${s==="profile"&&/alert|push|notification/.test(t)?" Push alerts live under Profile > Alerts.":""}`,run:{type:"open_tab",tab:s},actions:[{label:"Back to Terminal",type:"open_tab",tab:"terminal"}]}}return null}function vk(e){return{terminal:"the Live Terminal",live:"Live Pairs",slimeScope:"Slime Scope",smartChart:"Smart Chart",trade:"the Trade Desk",bundle:"Bundle",volume:"SlimeBot Volume",sniper:"OgreSniper",launchCoin:"Pump Launch",launch:"Launch Watch",kol:"the KOL Tracker",ogreAi:"Ogre A.I.",wallets:"Wallets",positions:"Positions",pnl:"PnL",txAudit:"the TP/SL Audit",profile:"your Profile",tek:"the Ogre Tek hub",ogreTek:"Perp Mode",watchlist:"your Watchlist",liveTrades:"Live Trades"}[e]||e}const wk={submitted:"Order submitted",approved:"Wallet approved",sent:"Transaction sent",confirmed:"Confirmed on-chain",armed:"TP/SL armed"};function $m(e){n.tradeTrace={title:String(e||"Trade"),steps:[],startedAt:Date.now(),done:!1},ko()}function Ie(e,t="ok",a=""){if(!n.tradeTrace||n.tradeTrace.done&&t==="pending")return;const r=n.tradeTrace.steps,s=r.find(l=>l.key===e),o=s||{key:e,label:wk[e]||e};if(o.status=t,o.detail=String(a||"").slice(0,140),s||r.push(o),t==="fail"&&(n.tradeTrace.done=!0),ko(),t==="fail")return;r.length>=3&&r.every(l=>l.status==="ok")&&(n.tradeTrace.done=!0,window.setTimeout(()=>{n.tradeTrace?.done&&!n.tradeTrace.steps.some(l=>l.status==="fail")&&(n.tradeTrace=null,ko())},8e3))}function ko(){let e=document.querySelector("[data-trade-trace-mount]");e||(e=document.createElement("div"),e.dataset.tradeTraceMount="true",document.body.appendChild(e));const t=n.tradeTrace;if(!t){e.innerHTML="",e.__lastDrawerHtml="";return}const a=r=>r==="ok"?"✅":r==="fail"?"❌":"⏳";e.innerHTML=`
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
  `}async function bt(e=""){const t=document.querySelector("[data-ogre-agent-input]"),a=String(e||t?.value||"").trim();if(!a||n.ogreAgentLoading)return;const r=Wl(a);if(r&&go(r),t&&(t.value=""),n.ogreAgentDraft="",fe({role:"user",text:a,actions:[]}),rk(a)){const l=Ct(a),d=So({type:l==="buy"?"confirm_buy":"confirm_sell"},a),u=String(d.tokenMint||d.mint||d.ca||"").trim(),p=Number(d.amountSol||d.sol||d.amount||0);if(!u){fe({role:"assistant",text:'Send the token CA first, then say the buy/sell command. I will keep that CA active for follow-up commands like "buy it" or "sell half".',actions:[{label:"Live Terminal",type:"open_tab",tab:"terminal"},{label:"Slime Scope",type:"open_tab",tab:"slimeScope"}]}),n.ogreAgentStatus="Need token CA.",E({force:!0});return}if(l==="buy"&&(!Number.isFinite(p)||p<=0)){fe({role:"assistant",text:"I have the token, but I need a SOL amount or a saved quick-buy amount. Example: buy it with 0.1 SOL.",actions:[{label:"Open Buy Panel",type:"open_quick_buy",tokenMint:u},{label:"Trade Panel",type:"open_tab",tab:"trade"}]}),n.ogreAgentStatus="Need buy amount.",E({force:!0});return}if(!wo()){fe({role:"assistant",text:"Connect or create a wallet and Auto-Trade becomes ready for this session. SlimeWire managed/session wallets can run through the saved flow; external wallet apps may still show their own signature prompt.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Open Wallets",type:"open_tab",tab:"wallets"}]}),n.ogreAgentStatus="Wallet session needed.",E({force:!0});return}fe({role:"assistant",text:l==="buy"?`Sending ${p} SOL buy for ${w(u)}.${wm(d)}`:`Sending sell request for ${w(u)}${d.percent?` at ${d.percent}%`:""}.`,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Open Chart",type:"open_chart",tokenMint:u}]}),n.ogreAgentStatus="Fast Mode: sending trade request...",E({force:!0}),await Xt(d);return}const s=yk(a);if(s){fe({role:"assistant",text:s.text,actions:s.actions||[]}),n.ogreAgentStatus="Instant local reply.",E({force:!0}),s.run&&await Xt(s.run);return}n.ogreAgentLoading=!0,n.ogreAgentStatus="",se("chatRequestStarted");const o=`${Date.now()}:${Math.random().toString(16).slice(2)}`;n.ogreAgentRequestId=o;const c=setTimeout(()=>{n.ogreAgentRequestId!==o||!n.ogreAgentLoading||(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,n.ogreAgentStatus="Agent reply timed out.",se("chatRequestTimedOut"),fe({role:"assistant",text:"I timed out instead of staying stuck. I can still open panels, refresh feeds, check a coin, show positions, or open chart from here.",retryText:a,actions:[{label:"Show Positions",type:"open_tab",tab:"positions"},{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),E({force:!0}))},7500);E();try{const l=await k("/api/web/ogre-agent/chat",{method:"POST",body:JSON.stringify({message:a,context:VS()}),timeoutMs:7e3,dedupe:!1,preserveSafeError:!0});if(n.ogreAgentRequestId!==o)return;const d=(l?.agent?.actions||[]).map(v=>So(v,a));l?.agent?.tokenMint&&go(l.agent.tokenMint),fe({role:"assistant",text:l?.agent?.reply||"I can help with panel functions, charts, positions, presets, coin checks, links, risk reads, and fast trade requests.",actions:d}),se("chatRequestSucceeded");const u=!!(l?.agent?.coinEnriched||l?.agent?.tokenMint||l?.agent?.socialLinks||l?.agent?.socialScan),f=!km(a)&&!u&&!Ct(a)&&uk(a)?d.find(v=>v.type==="coin_breakdown"||v.type==="analyze_coin")||So({type:"coin_breakdown"},a):null;if(f?.tokenMint||f?.mint||f?.ca){n.ogreAgentStatus="Checking coin now...",await Xt(f);return}const y=So({type:Ct(a)==="buy"?"confirm_buy":Ct(a)==="sell"?"confirm_sell":""},a);if(Ct(a)&&n.ogreAgentFastMode&&!wo()){fe({role:"assistant",text:"Agent Auto-Trade turns on automatically for this session when a wallet is connected or created. If an external wallet still asks for a signature, that is the wallet provider layer.",actions:[{label:"Auto-Trade On",type:"approve_agent_auto_trade"},{label:"Fast Mode Off",type:"toggle_agent_fast_mode"}]}),n.ogreAgentStatus="Auto-Trade approval needed once.";return}const b=d.find(v=>Sm(v,a))||(Sm(y,a)?y:null);if(b){n.ogreAgentStatus="Fast Mode: sending trade request...",await Xt(b);return}n.ogreAgentStatus=l?.agent?.modelPowered?"AI reply":"Fast local Ogre reply"}catch(l){if(n.ogreAgentRequestId!==o)return;const d=mk(a);if(d){fe({role:"assistant",text:d.text,actions:d.actions}),n.ogreAgentStatus="Fast local X/KOL fallback.";return}const u=hk(a);if(u){fe({role:"assistant",text:u.text,actions:u.actions}),n.ogreAgentStatus="Fast local trend scan.";return}fe({role:"assistant",text:"Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, check coins, open links, and route trade actions.",retryText:a,actions:[{label:"Refresh Feeds",type:"refresh_feeds"},{label:"Positions",type:"open_tab",tab:"positions"},{label:"Live Terminal",type:"open_tab",tab:"terminal"}]}),se("chatRequestFailed"),n.ogreAgentStatus=l?.message||"Agent reply failed."}finally{clearTimeout(c),n.ogreAgentRequestId===o&&(n.ogreAgentRequestId="",n.ogreAgentLoading=!1,E())}}function F(e,t){return`<article class="empty"><h3>${i(e)}</h3><p>${i(t)}</p></article>`}function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Te(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"unknown":t.toLocaleString()}function Sk(e){try{e.dataset.lockInPointerHandledAt=String(Date.now())}catch{}}function Tm(e){const t=Number(e?.dataset?.lockInPointerHandledAt||0);return Number.isFinite(t)&&Date.now()-t<900}document.addEventListener("pointerup",e=>{const a=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest?.("[data-open-login], [data-connect-login-toggle]");a&&(e.preventDefault(),Sk(a),Pc({connectPanel:a.matches("[data-connect-login-toggle]")||n.route==="connect",source:a.matches("[data-connect-login-toggle]")?"connect-lock-in":"top-lock-in"}))},{capture:!0}),document.addEventListener("keydown",e=>{if(qf(e))return;if(e.target?.closest?.("[data-ogre-agent-input]")&&e.key==="Enter"&&!e.shiftKey){e.preventDefault(),bt();return}const a=e.target?.closest?.("[data-global-token-search]");if(a&&e.key==="Enter"){e.preventDefault(),ju(a.value||"");return}if(e.key==="Escape"){if(n.ogreAgentOpen){vo();return}if(n.slimeShieldDetails?.open){yl();return}if(n.kolDumpDetails?.open){ji();return}if(n.replayDetails?.open){$l();return}if(n.protectedBuyModal?.open){Ws();return}if(!(!n.loginModalOpen&&!n.quickBuyModal?.open)){if(n.quickBuyModal?.open){nl();return}Tc()}}});function _l(e=null,t="interaction"){const a=e?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");if(!a)return!1;const r=a.dataset.tokenTrade||a.dataset.tokenChart||a.dataset.previewToken||"";if(!r)return!1;if(String(t||"").includes("prefetch")){const c=Date.now(),l=Number(n.smartChartInteractionPrefetchAt||0),d=n.smartChartInteractionPrefetchSeen||{};if(l&&c-l<Gv||Number(d[r]||0)&&c-Number(d[r])<Yv)return!1;const u=(n.smartChartInteractionPrefetchRecent||[]).filter(p=>c-Number(p||0)<Xv);if(u.length>=Jv)return n.smartChartInteractionPrefetchRecent=u,!1;n.smartChartInteractionPrefetchAt=c,n.smartChartInteractionPrefetchRecent=[...u,c],n.smartChartInteractionPrefetchSeen={...d,[r]:c}}return cl(ve(r,{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t}),{source:a.dataset.tokenTradeSource||a.dataset.tokenChartSource||t})}document.addEventListener("pointerenter",e=>{_l(e.target instanceof Element?e.target:null,"pointer-prefetch")},!0),document.addEventListener("touchstart",e=>{_l(e.target instanceof Element?e.target:null,"touch-prefetch")},{capture:!0,passive:!0}),document.addEventListener("focusin",e=>{_l(e.target instanceof Element?e.target:null,"focus-prefetch")},!0);const Am=new WeakMap;function kk(e){let t=Am.get(e);if(!t){const a=window.getComputedStyle(e);t={scrollable:["auto","scroll","overlay"].includes(a.overflowY),contained:/contain|none/.test(a.overscrollBehaviorY)},Am.set(e,t)}return t}document.addEventListener("wheel",e=>{if(e.defaultPrevented||e.ctrlKey||e.deltaY===0||n.route!=="terminal"||tr())return;let t=e.target instanceof Element?e.target:null;if(t&&t.tagName==="IFRAME")return;const a=e.deltaY>0?1:-1;for(;t&&t!==document.body&&t!==document.documentElement;){const o=kk(t);if(o.scrollable&&t.scrollHeight>t.clientHeight+1){const c=t.scrollTop<=0,l=t.scrollTop+t.clientHeight>=t.scrollHeight-1;if(!(a<0&&c||a>0&&l)||o.contained)return}t=t.parentElement}const r=document.scrollingElement||document.documentElement;if(!r||r.scrollHeight<=r.clientHeight+1)return;let s=e.deltaY;e.deltaMode===1?s*=40:e.deltaMode===2&&(s*=r.clientHeight),r.scrollTop+=s,e.preventDefault()},{passive:!1}),document.addEventListener("click",async e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;if(t?.closest?.("[data-slimeshield-close]")){e.preventDefault(),yl();return}if(t?.closest?.("[data-protected-buy-close]")){e.preventDefault(),Ws();return}if(t?.closest?.("[data-kol-dump-close]")){e.preventDefault(),ji();return}if(t?.closest?.("[data-replay-close]")){e.preventDefault(),$l();return}const c=t?.closest?.(".tabs .nav-tool-group summary");if(c){e.preventDefault();const g=c.closest(".nav-tool-group");n.navTekOpen=!g?.open,ff(n.navTekOpen),g&&(g.open=n.navTekOpen);return}const l=t?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token], [data-dev-info], [data-quick-bundle-token], [data-watch-token], [data-unwatch-token], [data-share-x]");if(!l)return;if(l.tagName==="A"){const g=l.getAttribute("href")||"",$=/^https?:\/\//i.test(g)&&!g.startsWith(window.location.origin),C=!!(window.matchMedia?.("(display-mode: standalone)")?.matches||window.navigator?.standalone);if($&&(l.getAttribute("target")==="_blank"||C)){e.preventDefault();try{window.open(g,"_blank","noopener,noreferrer")}catch{window.location.href=g}return}}if(l.matches("[data-tool-section]")){e.preventDefault();const g=l.dataset.toolSection,[$]=g.split(":"),C=g.slice($.length+1);n.toolSections={...n.toolSections||{},[$]:C};const B=l.closest("[data-tool-panels]");B&&(B.querySelectorAll(`[data-tool-section^="${$}:"]`).forEach(U=>{U.dataset.active=U.dataset.toolSection===g?"true":"false"}),B.querySelectorAll(`[data-tool-panel^="${$}:"]`).forEach(U=>{U.hidden=U.dataset.toolPanel!==g}),bs(B));return}if(l.matches("[data-clip-record]")){e.preventDefault(),n.clipFarm?.recording?er():gd();return}if(l.matches("[data-clip-share]")){e.preventDefault(),Ih();return}if(l.matches("[data-clip-download]")){e.preventDefault(),Oh();return}if(l.matches("[data-clip-clear]")){e.preventDefault(),Ti();return}if(l.matches("[data-slimeshield-tab]")){e.preventDefault();const g=l.dataset.slimeshieldTab||"verdict";n.slimeShieldTab=g;const $=l.closest(".dossier-drawer");$&&($.setAttribute("data-active-pane",g),$.querySelectorAll("[data-slimeshield-tab]").forEach(C=>{C.dataset.active=C.dataset.slimeshieldTab===g?"true":"false"}));return}if(l.matches("[data-slimeshield-details]")){e.preventDefault(),l.closest("[data-dev-info-drawer-root]")&&vl(),Op(l.dataset.slimeshieldDetails||"");return}if(l.matches("[data-slimeshield-refresh]")){e.preventDefault(),eo(l.dataset.slimeshieldRefresh||"",{force:!0});return}if(l.matches("[data-kol-dump-details]")){e.preventDefault(),dy(l.dataset.kolDumpDetails||"");return}if(l.matches("[data-kol-dump-refresh]")){e.preventDefault(),zi({force:!0});return}if(l.matches("[data-replay-open]")){e.preventDefault(),Yw(l.dataset.replayOpen||"");return}if(l.matches("[data-replay-refresh]")){e.preventDefault(),kl(l.dataset.replayRefresh||"",{force:!0});return}if(l.matches("[data-ogre-agent-toggle]")){n.ogreAgentOpen?vo():(n.ogreAgentOpen=!0,Zh(),E({force:!0}));return}if(l.matches("[data-ogre-agent-close]")){vo();return}if(l.matches("[data-ogre-agent-voice]")){ZS(!n.ogreAgentVoiceEnabled);return}if(l.matches("[data-ogre-agent-send]")){Gt(),bt();return}if(l.matches("[data-ogre-agent-mic]")){tk();return}if(l.matches("[data-ogre-agent-quick]")){const g=l.dataset.ogreAgentQuick||"";if(g==="positions"&&Xt({type:"open_tab",tab:"positions"}),g==="whats_cooking"&&bt("whats cooking"),g==="my_bags"&&bt("how are my bags"),g==="refresh_feeds"&&Xt({type:"refresh_feeds"}),g==="risk"&&bt("Why is this token risky?"),g==="dev_info"&&bt("Explain Dev Info for this token."),g==="protected_buy"&&bt("Should I use Protected Buy?"),g==="replay"&&bt("Replay similar launches for this token."),g==="auto_trade"&&Xt({type:"approve_agent_auto_trade"}),g==="clear_chat"){Gt(),bo(),n.ogreAgentMessages=[om()],n.ogreAgentStatus="Chat cleared.",n.ogreAgentDraft="",n.ogreAgentLastTokenMint="";try{localStorage.removeItem(Bl),localStorage.removeItem(Rl)}catch{}E({force:!0})}return}if(l.matches("[data-ogre-agent-retry]")){const g=Number(l.dataset.ogreAgentRetry),$=String(n.ogreAgentMessages?.[g]?.retryText||"").trim();$&&bt($);return}if(l.matches("[data-ogre-agent-action]")){const g=l.dataset.ogreAgentAction,C=ak(g)||(n.ogreAgentMessages||[]).flatMap(B=>Array.isArray(B.actions)?B.actions:[]).find(B=>B.key===g||B.label===g||B.type===g);Xt(C||{type:g});return}if(l.matches("[data-nav-route]")){e.preventDefault(),Pe(l.dataset.navRoute||"/terminal",l.dataset.tab||null);return}if(l.matches("[data-policy]")){e.preventDefault(),window.alert(_f(l.dataset.policy==="privacy"?"privacy":"terms"));return}if(l.matches("[data-top-wallet-connect]")){e.preventDefault(),l.dataset.walletState==="connected"||!!(n.user?.connectedWallet||n.connectedWalletBalance?.publicKey||n.wallets.length)?Pe("/terminal","wallets"):ma({returnPath:"/terminal"});return}if(l.matches("[data-top-wallet-status]")){e.preventDefault(),await Uh();return}if(l.matches("[data-top-refresh-wallet]")){const g=L();Xa("clicked",{startedAt:g}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-g,details:"top-refresh-wallet"}),St({force:!0,deep:!1,reason:"manual_header_click"}).then(()=>{ky()&&ne(()=>Xi())}).catch($=>T($.message));return}if(l.matches("[data-ogre-tek-refresh]")){await Cr({force:!0}).catch(g=>T(g.message));return}if(l.matches("[data-ogre-ai-start]")){ne(()=>nv());return}const d=l.closest?.("[data-ogre-cat]");if(d){e.preventDefault(),n.ogreAiCategory=d.dataset.ogreCat||"strong",h({force:!0});return}if(l.closest?.("[data-autopilot-save]")){e.preventDefault(),ne(()=>ov());return}if(l.matches("[data-ogre-tek-market]")){n.ogreTek.selectedMarket=l.dataset.ogreTekMarket||n.ogreTek.selectedMarket,n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-side]")){n.ogreTek.direction=l.dataset.ogreTekSide==="short"?"short":"long",n.ogreTek.reviewOpen=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-review]")){ho(),n.ogreTek.reviewOpen=!0,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-close-review]")){n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1,h({force:!0});return}if(l.matches("[data-ogre-tek-confirm-review]")){ho();const g=nm();!n.ogreTek.riskAccepted||!g.ok?n.ogreTek.status="Risk confirmation is incomplete.":Ae.demoMode?(n.ogreTek.status="Demo review confirmed. No live transaction was submitted.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1):(n.ogreTek.status="Live perps adapter is not wired in this build.",n.ogreTek.reviewOpen=!1,n.ogreTek.riskAccepted=!1),h({force:!0});return}if(l.matches("[data-ogre-tek-demo-action]")){const g=l.dataset.ogreTekDemoAction||"action";n.ogreTek.status=`Demo mode: ${g.replace(/-/g," ")} is staged for the real provider adapter. No transaction was submitted.`,h({force:!0});return}if(l.matches("[data-toggle-terminal-ticket]")){n.terminalTradeCollapsed=!n.terminalTradeCollapsed,h({force:!0});return}if(l.matches("[data-global-token-open]")){const g=m("[data-global-token-search]")?.value?.trim()||"";g&&ju(g);return}if(l.matches("[data-token-chart]")){e.preventDefault();const g=l.dataset.tokenChart||l.dataset.previewToken||"";$t(ve(l.dataset.tokenChart||l.dataset.previewToken||"",{source:l.dataset.tokenChartSource||"token-card"}),{defaultTab:l.dataset.tokenChartTab||"buy",view:"chartTxns",focusAmountInput:!!l.closest?.(".live-pair-avatar"),source:l.dataset.tokenChartSource||"token-card"});return}if(l.matches("[data-token-trade]")){e.preventDefault(),e.stopPropagation();const g=l.dataset.tokenTrade||"",$=fn(g);$&&Hs($)&&T("Risk flagged. Opening chart review first; fast buy safety checks still apply before any wallet prompt."),$t(ve(l.dataset.tokenTrade||"",{source:l.dataset.tokenTradeSource||"trade-button"}),{defaultTab:"buy",view:"chartTxns",focusAmountInput:!0,source:l.dataset.tokenTradeSource||"trade-button"});return}if(l.matches("[data-quick-buy-token]")){e.preventDefault(),e.stopPropagation(),mn(ve(l.dataset.quickBuyToken||"",{source:l.dataset.quickBuySource||"quick-buy-button"}),{source:l.dataset.quickBuySource||"quick-buy-button"});return}if(l.matches("[data-protected-buy-open]")){e.preventDefault(),e.stopPropagation(),l.closest("[data-dev-info-drawer-root]")&&vl();const g=l.dataset.protectedBuySource||"protected-buy",$=!!l.closest("[data-quick-buy-modal-root]"),C=!!l.closest(".chart-trade-panel"),B=l.dataset.protectedBuyOpen||n.quickBuyModal?.tokenMint||n.smartChartToken||n.tradeToken||"";hv(ve(B,{source:g}),{source:g,presetId:l.dataset.protectedBuyPreset||"",amountSol:$?m("[data-quick-buy-modal-amount]")?.value||n.quickBuyModal?.amountSol||"":C&&m("[data-chart-buy-amount]")?.value||"",walletIndex:$?m("[data-quick-buy-modal-wallet]")?.value||n.quickBuyModal?.walletIndex||"":C&&m("[data-chart-buy-wallet]")?.value||"",slippageBps:$?m("[data-quick-buy-modal-slippage]")?.value||n.quickBuyModal?.slippageBps||"400":C&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-quick-buy-close]")){e.preventDefault(),nl();return}if(l.matches("[data-protected-buy-close]")){e.preventDefault(),Ws();return}if(l.matches("[data-protected-buy-confirm]")){e.preventDefault(),ne(()=>yv());return}if(l.matches("[data-quick-buy-modal-preset]")){e.preventDefault(),n.quickBuyModal={...n.quickBuyModal,amountSol:l.dataset.quickBuyModalPreset||"",status:`${l.dataset.quickBuyModalPreset||""} SOL selected.`,error:""},h({force:!0});return}if(l.matches("[data-quick-buy-confirm]")){e.preventDefault(),ne(()=>Sv());return}if(l.matches("[data-preview-token]")){const g=l.dataset.previewToken||"";g&&$t(ve(g,{source:"preview-card"}),{defaultTab:"chart",source:"preview-card"});return}if(l.matches("[data-terminal-subtab]")){n.terminalSubtab=l.dataset.terminalSubtab||"positions",h();return}if(l.matches("[data-position-sell]")){e.preventDefault(),e.stopPropagation(),await Ds(l.dataset.positionSell||"",l.dataset.positionSellPercent||"100",{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-position-sell-custom]")){e.preventDefault(),e.stopPropagation();const g=await Me({title:"Custom Sell",input:{label:"Sell what percent of this position?",value:"100",type:"text",inputmode:"numeric"},confirmLabel:"Sell"});g&&await Ds(l.dataset.positionSellCustom||"",g,{slippageBps:n.activeTab==="smartChart"&&m("[data-chart-buy-slippage]")?.value||"400"});return}if(l.matches("[data-run-tx-audit]")){e.preventDefault(),ne(()=>kv());return}if(l.matches("[data-connect-login-toggle]")){Tm(l)||Cc({connectPanel:!0,source:"connect-lock-in"});return}if(l.matches("[data-login-tab]")){n.loginModalTab=l.dataset.loginTab==="create"?"create":"login",h({force:!0}),$c(!1);return}if(l.matches("[data-connect-password-login]")){await Wc();return}if(l.matches("[data-send-email-code]")){await th();return}if(l.matches("[data-web-code-login]")){await ah();return}if(l.matches("[data-connect-create-account]")){await di();return}if(l.matches("[data-connect-create-wallet]")){await ih();return}if(l.matches("[data-web-signup]")&&await di(),l.matches("[data-web-password-login]")&&await Wc(),l.matches("[data-close-login]")){Tc();return}if(l.matches("[data-web-signup-connect]")){await oh();return}if(l.matches("[data-open-login]")){Tm(l)||Cc({connectPanel:n.route==="connect",source:"top-lock-in"});return}if(l.matches("[data-browse-guest]")){n.loginCollapsed=!0,n.route="terminal",n.activeTab="terminal",window.history.pushState({},"","/terminal"),h(),Yr("browse-terminal");return}if(l.matches("[data-logout]")&&await lh(),l.matches("[data-connect-x]")&&await Oy(),l.matches("[data-open-x-login]")&&Ey(),l.matches("[data-clear-x]")&&await Fy(),l.matches("[data-save-login-credentials]")&&await Dy(),l.matches("[data-save-referral]")&&await Qu(),l.matches("[data-generate-referral-code]")&&await Qu({generate:!0}),l.matches("[data-save-trader-board]")&&await Cv(),l.matches("[data-use-x-avatar]")&&await Ny(),l.matches("[data-clear-avatar]")&&await xs({clear:!0},"Removing PFP..."),l.matches("[data-preset-avatar]")){const g=m("[data-avatar-status]");S(g,"Loading preset PFP...");try{const $=await _y(l.dataset.presetAvatar);await xs({avatarDataUrl:$,avatarSource:l.dataset.avatarLabel||"preset"},"Saving preset PFP...")}catch($){S(g,$.message),T($.message)}}if(l.matches("[data-launch-coin-save]")){sr();return}if(l.matches("[data-launch-coin-submit]")){await ry();return}if(l.matches("[data-launch-coin-use-ca]")){await ey();return}if(l.matches("[data-connect-wallet]")){const g=l.dataset.connectWallet||"solana";if(g&&g!=="solana"){await Lu(g,{returnPath:"/terminal"});return}ma({returnPath:"/terminal"});return}if(l.matches("[data-connect-wallet-provider]")){await Lu(l.dataset.connectWalletProvider||"solana",{returnPath:"/terminal"});return}if(l.matches("[data-wallet-connect-close]")){n.walletConnectMenuOpen=!1,h({force:!0});return}if(l.matches("[data-wallet-fast-approvals-toggle]")){vg(!n.walletFastApprovalsEnabled),T(n.walletFastApprovalsEnabled?"Fast approvals on. SlimeWire will open wallet prompts immediately, but Phantom/Solflare still require approval.":"Fast approvals off. Browser wallet trades still require wallet approval."),h({force:!0});return}if(l.matches("[data-disconnect-wallet]")){await xu();return}if(l.matches("[data-share-x]")&&Yi(l.dataset.shareText||""),l.matches("[data-share-watch-token-btn]")&&Mu("token"),l.matches("[data-share-watch-kol-btn]")&&Mu("kol"),l.matches("[data-save-preset]")){await Ju(l.dataset.savePreset);return}if(l.matches("[data-save-fast-preset]")){await Ju(l.dataset.saveFastPreset,"fast");return}if(l.matches("[data-use-preset]")){Av(l.dataset.usePreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-preset]")){Yu(l.dataset.editPreset,l.dataset.presetId||"");return}if(l.matches("[data-edit-selected-preset]")){const g=l.dataset.editSelectedPreset==="bundle"?"bundle":"trade",$=g==="bundle"?n.selectedBundlePresetId:n.selectedTradePresetId;$&&$!=="custom"?Yu(g,$):Tl(g);return}if(l.matches("[data-cancel-preset-edit]")){hs(l.dataset.cancelPresetEdit,""),h();return}if(l.matches("[data-delete-preset]")){await Pv(l.dataset.deletePreset,l.dataset.presetId||"");return}if(l.matches("[data-quick-trade-token]")){e.preventDefault(),e.stopPropagation(),mn(ve(l.dataset.quickTradeToken||"",{source:"legacy-quick-trade"}),{source:"legacy-quick-trade"});return}if(l.matches("[data-quick-bundle-token]")){e.preventDefault(),e.stopPropagation(),ne(()=>Xu(l.dataset.quickBundleToken||""));return}if(l.matches("[data-smart-chart-token]")){$t(ve(l.dataset.smartChartToken||"",{source:"chart-button"}),{defaultTab:"chart",source:"chart-button"});return}if(l.matches("[data-smart-chart-view]")){const g=l.dataset.smartChartView||"chart";n.smartChartView=["chart","chartTxns","txns","info"].includes(g)?g:"chart",h();return}if(l.matches("[data-chart-trade-tab]")){n.chartTradeTab=l.dataset.chartTradeTab==="sell"?"sell":"buy",h({force:!0,preserveSmartChartFrame:!0}),n.chartTradeTab==="buy"&&requestAnimationFrame(()=>m("[data-chart-buy-amount]")?.focus());return}if(l.matches("[data-chart-buy-preset]")){const g=m("[data-chart-buy-amount]");g&&(g.value=l.dataset.chartBuyPreset||""),n.quickBuyAmountOverride=Y(l.dataset.chartBuyPreset||""),Zs();return}if(l.matches("[data-chart-confirm-buy]")){const g=l.dataset.chartConfirmBuy||n.smartChartToken||"";e.preventDefault(),e.stopPropagation();const $=m("[data-chart-buy-wallet]")?.value||"";if(pe($)){try{l.dataset.actionState="clicked",l.disabled=!0,await wv(g)}catch(C){const B=N(C.message||"Chart buy failed."),U=Y(m("[data-chart-buy-amount]")?.value||"")||"custom";z("trade-buy",g,String(U),{state:"error",error:B}),Le("trade-buy",g,String(U),4e3),Ne(B),T(B),de()}return}Ne("Buy queued. Opening wallet approval..."),l.dataset.actionState="clicked",l.disabled=!0,ne(async()=>{try{const C=Du();await _s({tokenMint:g,walletIndex:$,amountSol:Y(m("[data-chart-buy-amount]")?.value||""),slippageBps:m("[data-chart-buy-slippage]")?.value||"400",takeProfitPct:C.takeProfitPct,stopLossPct:C.stopLossPct,sellDelay:C.sellDelay,sellPercent:C.sellPercent,source:"chart-buy-panel"}),n.chartTradeTab="buy",Ne("Buy submitted. Refreshing position..."),h({force:!0,preserveSmartChartFrame:!0})}catch(C){const B=N(C.message||"Chart buy failed.");Ne(B),T(B),h({force:!0,preserveSmartChartFrame:!0})}});return}if(l.matches("[data-chart-confirm-sell]")){e.preventDefault(),e.stopPropagation();const g=m("[data-chart-sell-percent]")?.value||"";if(g)try{await Ds(l.dataset.chartConfirmSell||"",g,{slippageBps:m("[data-chart-buy-slippage]")?.value||"400"})}catch($){const C=N($.message||"Chart sell failed.");Ne(C),T(C)}return}if(l.matches("[data-smart-chart-open]")){const g=String(m("[data-smart-chart-input]")?.value||"").trim();if(!g){T("Paste a token CA first.");return}$t(ve(g,{source:"smart-chart-search"}),{defaultTab:"buy",focusAmountInput:!0,source:"smart-chart-search"});return}if(l.matches("[data-refresh-feeds]")){ne(()=>en({force:!0,reason:"manual-refresh-feeds"}));return}if(l.matches("[data-terminal-load-more]")){const g=l.dataset.terminalLoadMore||n.activeTab;ph(g,Wt(g)),Jc(g,{requestId:j(g).lastRequestId||"",status:j(g).lastStatus||"render",reason:"load-more",resultCount:Wt(g),renderedCount:Vn(g),hasMore:Wt(g)>Vn(g),stale:zn(g),errorCode:j(g).errorCode||"",errorMessage:j(g).errorMessage||""}),h({force:!0});return}if(l.matches("[data-dev-info]")){e.preventDefault(),e.stopPropagation(),_w(l.dataset.devInfo||"");return}if(l.matches("[data-return-dismiss]")){e.preventDefault(),Uw();return}if(l.matches("[data-radar-open]")){e.preventDefault(),Kw(l.dataset.radarOpen||"",l.dataset.radarSymbol||"");return}if(l.matches("[data-radar-close]")){Vw();return}if(l.matches("[data-radar-submit]")){e.preventDefault(),jw();return}if(l.matches("[data-radar-toggle]")){e.preventDefault(),Np("toggle",l.dataset.radarToggle||"");return}if(l.matches("[data-radar-remove]")){e.preventDefault(),Np("remove",l.dataset.radarRemove||"");return}if(l.matches("[data-dev-info-tab]")){e.preventDefault();const g=l.dataset.devInfoTab||"overview";n.devInfoTab=g;const $=l.closest(".dossier-drawer");$&&($.setAttribute("data-active-pane",g),$.querySelectorAll("[data-dev-info-tab]").forEach(C=>{C.dataset.active=C.dataset.devInfoTab===g?"true":"false"}));return}if(l.matches("[data-dev-info-close]")){vl();return}if(l.matches("[data-dev-info-refresh]")){const g=l.dataset.devInfoRefresh||n.devInfoDetails?.tokenMint||"";await _p(g,{force:!0});return}if(l.matches("[data-watch-token]")&&await Zu("add",l),l.matches("[data-unwatch-token]")&&await Zu("remove",l),l.matches("[data-pnl-card]"))try{await Ru(l.dataset.pnlCard)}catch(g){T(g.message)}if(l.matches("[data-share-pnl-card]")&&await Uy(l.dataset.sharePnlCard,l.dataset.shareText||""),l.matches("[data-scan-bags]")){await Hv();return}if(l.matches("[data-arm-exits]")){await qv(l.dataset.armExits,l);return}if(l.matches("[data-dev-watch]")){await Uv(l.dataset.devWatch);return}if(l.matches("[data-hype-create]")){await jb();return}if(l.matches("[data-push-enable]")){await cg();return}if(l.matches("[data-push-disable]")){await dg();return}if(l.matches("[data-call-post]")){await oS(l.dataset.callPost);return}if(l.matches("[data-telegram-link]")){await ig();return}if(l.matches("[data-trade-trace-close]")){n.tradeTrace=null,ko();return}if(l.matches("[data-launch-kit-close]")){n.launchShareKit=null,h();return}if(l.matches("[data-create-wallets]")&&await Pu(),l.matches("[data-distribute-fresh]")){await Mb();return}if(l.matches("[data-return-funds]")){await xb();return}if(l.matches("[data-sweep-background-wallets]")){await Iv();return}if(l.matches("[data-create-automation-wallet]")&&await by(),l.matches("[data-create-session-wallet]")){e.preventDefault(),e.stopPropagation(),await wy(l);return}if(l.matches("[data-tpsl-status-button]")){l.dataset.tpslState==="enabled"?(n.activeTab="profile",Pe("/terminal","profile"),n.automationDelegationStatus=n.automationDelegationStatus||"Server exits are enabled for managed wallets.",h({force:!0})):await Gi("enable");return}if(l.matches("[data-automation-permission]")&&await Gi(l.dataset.automationPermission||"enable"),l.matches("[data-run-trade-plans]")&&await Xi(),l.matches("[data-restore-backup]")&&await Ay(),l.matches("[data-export-backup]")&&await Py(),l.matches("[data-import-wallet]")&&await Cy(),l.matches("[data-remove-wallet]")&&await Ly(l.dataset.removeWallet||"",l.dataset.walletLabel||"",l.dataset.removeWalletKey||""),l.matches("[data-wallet-sweep-action]")&&await Ry(l.dataset.walletSweepAction||""),l.matches("[data-download]")){const g=n.downloads?.[l.dataset.download];g&&be(g.filename,g.text)}if(l.matches("[data-trade-buy-quick]")&&await Rs(l.dataset.tradeBuyQuick),l.closest?.("[data-swap-reverse]")){n.swapDirection=n.swapDirection==="sell"?"buy":"sell",h({force:!0});return}if(l.matches("[data-swap-use-custom-amount]")){const g=String(m("[data-swap-amount]")?.value||"").trim();n.swapDirection==="sell"?await Zi(g||"100"):await Rs(g);return}l.matches("[data-trade-buy-max]")&&await Rs(null,"max"),l.matches("[data-trade-buy-custom]")&&await Rs(m("[data-buy-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-sell-quick]")&&await Zi(l.dataset.tradeSellQuick),l.matches("[data-trade-sell-custom]")&&await Zi(m("[data-sell-custom]")?.value||m("[data-swap-amount]")?.value),l.matches("[data-trade-plan-start]")&&await Yy(),l.matches("[data-volume-start]")&&await Zy();const u=l.closest?.("[data-vbot-set-mode]");if(u){e.preventDefault(),n.slimeBotMode=u.dataset.vbotSetMode||"smart",u.parentElement?.querySelectorAll("[data-vbot-set-mode]").forEach(g=>{g.dataset.active=String(g===u)});return}const p=l.closest?.("[data-vbot-set-aggr]");if(p){e.preventDefault(),n.slimeBotAggr=p.dataset.vbotSetAggr||"med",p.parentElement?.querySelectorAll("[data-vbot-set-aggr]").forEach(g=>{g.dataset.active=String(g===p)});return}const f=l.closest?.("[data-vbot-set-stagger]");if(f){e.preventDefault(),n.slimeBotStagger=f.dataset.vbotSetStagger||"steady",f.parentElement?.querySelectorAll("[data-vbot-set-stagger]").forEach(g=>{g.dataset.active=String(g===f)});return}if(l.matches("[data-vbot-start]")){e.preventDefault(),await Wb();return}const y=l.closest?.("[data-vbot-stop]");if(y){e.preventDefault(),await _b(y.dataset.vbotStop||"");return}if(l.matches("[data-sniper-buy]")&&await tv(l.dataset.sniperBuy),l.matches("[data-kol-mode]")){n.kolWallet="",n.kolMode=l.dataset.kolMode||n.kolMode,Z("kol"),await te("kol",{force:!0,reason:"kol-mode-switch"}).catch(g=>T(g.message));return}if(l.matches("[data-kol-refresh]")){await te("kol",{force:!0,reason:"manual-kol-refresh"}).catch(g=>T(g.message));return}if(l.matches("[data-kol-wallet-scan]")){if(n.kolWallet=String(m("[data-kol-wallet]")?.value||"").trim(),n.kolWallet&&!Dt(n.kolWallet)){Ht("That is not a valid Solana public wallet. Paste a real wallet address before scanning."),n.kolWallet="";return}Z("kol"),await te("kol",{force:!0,reason:"kol-wallet-scan"}).catch(g=>T(g.message));return}if(l.matches("[data-kol-scan-wallet]")){if(n.kolWallet=String(l.dataset.kolScanWallet||"").trim(),n.kolWallet&&!Dt(n.kolWallet)){Ht("This curated KOL profile does not have a verified Solana wallet yet, so Scan is locked."),n.kolWallet="";return}Z("kol"),await te("kol",{force:!0,reason:"kol-signal-wallet-scan"}).catch(g=>T(g.message));return}if(l.matches("[data-kol-copy-setup]")){const g=String(l.dataset.kolCopySetup||"").trim();if(g&&!Dt(g)){Ht("This curated KOL profile does not have a verified Solana wallet yet, so Copy Setup is locked.");return}g&&(n.kolWallet=g),n.activeTab="kol",h(),setTimeout(()=>{const $=document.querySelector("[data-kol-management-settings]");$&&($.open=!0,$.scrollIntoView({behavior:"smooth",block:"start"}));const C=m("[data-kol-wallet]");C&&g&&(C.value=g);const B=m("[data-kol-status]");B&&S(B,`Copy setup loaded for ${w(g)}. Choose presets, then tap Copy Wallet Next Buy.`),m("[data-kol-amount]")?.focus?.({preventScroll:!0})},40);return}if(l.matches("[data-kol-copy]")){await cv(l.dataset.kolCopy);return}if(l.matches("[data-kol-copy-wallet]")){const g=String(l.dataset.kolCopyWallet||"").trim();if(g&&!Dt(g)){Ht("That KOL entry does not have a verified Solana wallet yet.");return}await dv(l.dataset.kolCopyWallet||"");return}if(l.matches("[data-kol-trade]")){n.tradeToken=l.dataset.kolTrade||"",n.activeTab="trade",h();return}if(l.matches("[data-kol-bundle]")){n.bundleToken=l.dataset.kolBundle||"",n.activeTab="bundle",h();return}if(l.matches("[data-bundle-buy]")&&await Ku("buy"),l.matches("[data-bundle-sell]")&&await Ku("sell"),l.matches("[data-bundle-plan]")&&await pv(),l.matches("[data-launch-start]")&&await xv(),l.matches("[data-launch-cancel]")&&await Mv(l.dataset.launchCancel),l.matches("[data-use-token]")&&(n.tradeToken=l.dataset.useToken||"",n.volumeToken=l.dataset.useToken||"",n.bundleToken=l.dataset.useToken||"",n.activeTab="trade",h()),l.matches("[data-use-token-bundle]")&&(n.bundleToken=l.dataset.useTokenBundle||"",n.tradeToken=n.bundleToken,n.volumeToken=n.bundleToken,n.activeTab="bundle",h()),l.matches("[data-use-token-volume]")&&(n.volumeToken=l.dataset.useTokenVolume||"",n.tradeToken=n.volumeToken,n.bundleToken=n.volumeToken,n.activeTab="volume",h()),l.matches("[data-refresh-all]")){const g=L();if(Xa("clicked",{startedAt:g}),W({component:"ui-action",action:"position-refresh-click-to-state",durationMs:L()-g,details:n.activeTab||"terminal"}),!n.user||!n.token)Xe(n.activeTab)?await te(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch($=>T($.message)):T("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades."),je("success");else{const $=L();n.activeTab==="positions"?uh({force:!0,reason:"manual-positions-refresh"}).catch(C=>{je("error",{error:N(C?.message||"Position refresh failed")}),T(C.message),h()}):(St({force:!0,deep:!1,reason:"manual_refresh_all"}).catch(C=>T(C.message)),te(n.activeTab,{force:!0,reason:"manual-refresh-all"}).catch(C=>T(C.message))),K("position-refresh-request-start",$,{component:"positions",cacheHit:!1,details:n.activeTab||"terminal"})}}if(l.matches("[data-tab]")){const g=L();if(n.activeTab=l.dataset.tab,n.activeTab==="volume"&&vs(),n.activeTab==="ogreAi"&&rv(),n.activeTab==="ogreTek"){n.route="terminal",window.history.pushState({},"","/ogre-tek"),await Cr({silent:!0}).catch(B=>T(B.message)),h();return}n.route!=="terminal"&&(n.route="terminal",window.history.pushState({},"","/terminal")),n.activeTab==="smartChart"?window.history.pushState({},"","/terminal/chart"):n.activeTab==="slimeScope"?window.history.pushState({},"","/terminal/slime-scope"):(window.location.pathname.includes("/terminal/chart")||window.location.pathname.includes("/terminal/slime-scope"))&&window.history.pushState({},"","/terminal");const $=Xc(n.activeTab);h();const C=te(n.activeTab,{silent:!0,ifStale:!0,force:!$,reason:"tab-switch"}).catch(B=>T(B.message));$||await C,K("tab-switch",g,{component:"terminal",cacheHit:$,details:n.activeTab})}if(l.matches("[data-refresh-scan]")&&ne(()=>te("sniper",{force:!0,reason:"manual-sniper-refresh"})),l.closest?.("[data-refresh-live-pairs]")){const g=n.activeTab==="slimeScope"?"slimeScope":n.activeTab==="terminal"?"terminal":n.activeTab==="launch"||n.activeTab==="launchCoin"?"launch":"live",C=n.activeTab==="live"||n.activeTab==="terminal"?null:Ci();ne(async()=>{await te(g,{force:!0,reason:"manual-live-refresh",renderStart:!1,userInitiated:!0}),C&&Li(C)})}if(l.closest?.("[data-terminal-filter-toggle]")){const g=Re();g.open=!g.open,h();return}if(l.closest?.("[data-terminal-filter-clear]")){n.terminalLaunchFilters={open:!0,keywords:"",excludeKeywords:"",socials:{},quotes:{},audits:{}},Z("live"),Z("launch"),Z("sniper"),h();return}l.matches("[data-refresh-watchlist]")&&ne(()=>te("watchlist",{force:!0,reason:"manual-watchlist-refresh"}));const v=l.closest?.("[data-live-pair-bucket]");v&&(n.livePairBucket=v.dataset.livePairBucket||"live",n.livePairs=qe(),n.livePairsLastUpdatedAt=ua(),Z("live"),Z("slimeScope"),h(),ne(()=>te(n.activeTab==="terminal"?"terminal":"live",{force:!0,reason:"live-bucket-switch"})));const P=l.closest?.("[data-slime-scope-mode]");P&&(n.slimeScopeMode=P.dataset.slimeScopeMode||"new",n.activeTab="slimeScope",Z("slimeScope"),h(),ne(()=>te("slimeScope",{force:!0,reason:"slime-scope-mode-switch"}))),l.matches("[data-scan-mode]")&&(Z("sniper"),n.scanMode=l.dataset.scanMode||n.scanMode,h(),ne(()=>Gn(n.scanMode)));const A=l.getAttribute("data-copy");if(A){const g=l.getAttribute("data-copy-label")||l.textContent||"Copy";await navigator.clipboard.writeText(A),S(l,"Copied"),setTimeout(()=>{S(l,g)},1e3)}}),document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(n.replayDetails?.open){$l();return}if(n.kolDumpDetails?.open){ji();return}if(n.protectedBuyModal?.open){Ws();return}if(n.quickBuyModal?.open){nl();return}if(n.walletConnectMenuOpen){n.walletConnectMenuOpen=!1,h({force:!0});return}n.loginCollapsed||(n.loginCollapsed=!0,h({force:!0}))}}),document.addEventListener("change",async e=>{const t=e.target;if(t?.matches?.("[data-vbot-autocreate]")){const a=document.querySelector("[data-vbot-manual-wallets]");a&&(a.hidden=!!t.checked)}if(t?.matches?.("[data-vbot-keepdust]")&&(n.slimeBotKeepDust=!!t.checked),t?.matches?.("[data-vbot-offset]")&&(n.slimeBotOffset=!!t.checked),t?.matches?.("[data-vbot-rolling]")){const a=!!t.checked;document.querySelectorAll("[data-vbot-pool-only]").forEach(s=>{s.style.display=a?"none":""});const r=document.querySelector("[data-vbot-manual-wallets]");r&&(r.hidden=a||!!document.querySelector("[data-vbot-autocreate]")?.checked)}if(t?.matches?.("[data-custom-select]")&&(bs(),Pb(t)),t?.matches?.("[data-swap-from]")){const a=We(t.value||"SOL")||"SOL";n.tradeSwapFrom=a,a!=="SOL"?(n.tradeToken=a,n.tradeSwapTo="SOL"):We(n.tradeSwapTo||n.tradeToken||"")||(n.tradeSwapTo=""),h({force:!0});return}if(t?.matches?.("[data-swap-to]")){const a=We(t.value||"");if(n.tradeSwapTo=a,a&&a!=="SOL"){n.tradeToken=a,n.swapDirection="buy";const r=m("[data-trade-token]");r&&(r.value=a)}a||m("[data-trade-token]")?.focus?.({preventScroll:!0}),h({force:!0});return}if(t?.matches?.("[data-chart-buy-wallet]")){n.chartBuyWalletIndex=String(t.value||"");return}if(t?.matches?.("[data-fast-trade-preset]")){const a=t.value||"";if(a==="custom"){Tl("trade");return}if(n.selectedTradePresetId=a,n.fastTradePresetStatus=n.selectedTradePresetId?"Trade preset selected. Tap Trade or Buy on a token row to use it.":"No fast trade preset selected. Token rows open the manual Trade form.",(t.dataset.fastTradePreset||"")==="chart-panel"){const r=le("trade",n.selectedTradePresetId);n.chartBuyWalletIndex="",r?.amountSol&&(n.quickBuyAmountOverride=Y(r.amountSol)),n.chartTradeStatus=r?`${r.name||"Preset"} loaded.`:"",h({force:!0,preserveSmartChartFrame:!0});return}h()}if(t?.matches?.("[data-quick-buy-amount]")&&(n.quickBuyAmountOverride=Y(t.value),t.value=n.quickBuyAmountOverride,Zs()),t?.matches?.("[data-protected-buy-preset], [data-protected-buy-wallet], [data-protected-buy-slippage], [data-protected-buy-risk-accept], [data-protected-buy-amount]")&&(n.protectedBuyModal={...n.protectedBuyModal||{},presetId:m("[data-protected-buy-preset]")?.value||n.protectedBuyModal?.presetId||"conservative",walletIndex:m("[data-protected-buy-wallet]")?.value||n.protectedBuyModal?.walletIndex||"",amountSol:Y(m("[data-protected-buy-amount]")?.value||n.protectedBuyModal?.amountSol||""),slippageBps:m("[data-protected-buy-slippage]")?.value||n.protectedBuyModal?.slippageBps||"400",riskAccepted:!!m("[data-protected-buy-risk-accept]")?.checked},rl()),t?.matches?.("[data-fast-bundle-preset]")){const a=t.value||"";if(a==="custom"){Tl("bundle");return}n.selectedBundlePresetId=a,n.fastBundlePresetStatus=n.selectedBundlePresetId?"Bundle preset selected. It will not buy until you tap a Bundle button.":"No fast bundle preset selected. Bundle rows open the manual Bundle form.",h()}if(t?.matches?.("[data-terminal-sort]")&&(n.terminalSort=t.value||"best",n.terminalCat="",Z("live"),Z("slimeScope"),es()),t?.matches?.("[data-live-feed-category]")){n.liveFeedCategory=t.value||"best";try{localStorage.setItem("liveFeedCategory",n.liveFeedCategory)}catch{}n.terminalSort=so()[3]||"best",n.terminalCat=so()[0]||"",Z("live"),es()}if(t?.matches?.("[data-live-terminal-category]")){n.liveTerminalCategory=t.value||"dexTrending";try{localStorage.setItem("liveTerminalCategory",n.liveTerminalCategory)}catch{}n.terminalSort=lo()[3]||"volume",n.terminalCat=lo()[0]||"",Z("live"),es()}if(t?.matches?.("[data-cook-spot-category]")){n.cookSpotCategory=t.value||"dexTrending";try{localStorage.setItem("cookSpotCategory",n.cookSpotCategory)}catch{}n.terminalSort=Ar()[3]||"volume",n.terminalCat=Ar()[0]||"",Z("slimeScope"),es(()=>te("slimeScope",{force:!0,reason:"cook-spot-category"}))}if(t?.matches?.("[data-launch-coin-image]")){const a=t.files?.[0],r=m("[data-launch-image-preview-wrap]"),s=m("[data-launch-image-preview]"),o=m("[data-launch-image-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(l),s.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}hu(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},imageDataUrl:l,imageName:a.name,imageType:un(l,a.type||"application/octet-stream")},String(l).length<15e5)try{Oa(n.launchCoinDraft)}catch{}}).catch(()=>{});return}if(t?.matches?.("[data-launch-coin-banner]")){const a=t.files?.[0],r=m("[data-launch-banner-preview-wrap]"),s=m("[data-launch-banner-preview]"),o=m("[data-launch-banner-preview-meta]");if(!a){r&&(r.hidden=!0);return}const c=Math.round(a.size/1024);o&&(o.textContent=`${a.name} · ${c>=1024?`${(c/1024).toFixed(1)} MB`:`${c} KB`} · saved with the sheet`);try{const l=URL.createObjectURL(a);s&&(s.onload=()=>URL.revokeObjectURL(l),s.src=l),r&&(r.hidden=!1)}catch{r&&(r.hidden=!0)}gu(a).then(l=>{if(n.launchCoinDraft={...n.launchCoinDraft||{},bannerDataUrl:l,bannerName:a.name,bannerType:un(l,a.type||"image/jpeg")},String(l).length<15e5)try{Oa(n.launchCoinDraft)}catch{}}).catch(l=>{const d=m("[data-launch-coin-status]");d&&S(d,l?.message||"Could not read that banner.")});return}if(t?.matches?.("[data-terminal-filter-social], [data-terminal-filter-quote], [data-terminal-filter-audit]")){const a=Re(),r=t.getAttribute("data-terminal-filter-social"),s=t.getAttribute("data-terminal-filter-quote"),o=t.getAttribute("data-terminal-filter-audit");r&&(a.socials[r]=!!t.checked),s&&(a.quotes[s]=!!t.checked),o&&(a.audits[o]=!!t.checked),a.open=!0,Z("live"),Z("launch"),Z("sniper"),h()}t?.matches?.("[data-ogre-tek-field]")&&(ho(),n.ogreTek.reviewOpen=!1,h({force:!0})),t?.matches?.("[data-ogre-tek-risk-accepted]")&&(n.ogreTek.riskAccepted=!!t.checked,h({force:!0})),t?.matches?.("[data-restore-file]")&&await Iy(t),t?.matches?.("[data-avatar-file]")&&await Wy(t)}),document.addEventListener("focusout",()=>{setTimeout(od,50)});let Ca=null;const Pm=e=>{if(e.target?.closest?.(".launch-coin-card")&&String(e.target?.tagName||"").match(/INPUT|TEXTAREA|SELECT/)&&!e.target.matches("[data-launch-coin-image]")&&!e.target.matches("[data-launch-coin-banner]")){if(e.target.matches("[data-launch-coin-amount], [data-launch-coin-dev-buy-sol]")){const a=String(e.target.value||"");let r=a.replace(/[^0-9.]/g,"");const s=r.indexOf(".");if(s!==-1&&(r=r.slice(0,s+1)+r.slice(s+1).replace(/\./g,"")),r!==a){const o=e.target.selectionStart;e.target.value=r;try{e.target.setSelectionRange(o-(a.length-r.length),o-(a.length-r.length))}catch{}}}Ca&&clearTimeout(Ca),Ca=setTimeout(()=>{Ca=null,sr({silent:!0})},350)}};document.addEventListener("input",Pm),document.addEventListener("change",Pm),document.addEventListener("click",()=>{Ca&&(clearTimeout(Ca),Ca=null,sr({silent:!0}))},!0),document.addEventListener("input",e=>{const t=e.target;if(t?.matches?.("[data-quick-buy-amount]")){n.quickBuyAmountOverride=String(t.value||"").replace(/[^0-9.]/g,"").slice(0,12),Zs();return}if(t?.matches?.("[data-trade-token]")){const a=String(t.value||"").trim();n.tradeToken=a,n.tradeSwapTo=a;return}if(t?.matches?.("[data-terminal-filter-field]")){const a=t.getAttribute("data-terminal-filter-field"),r=Re();(a==="keywords"||a==="excludeKeywords")&&(r[a]=String(t.value||""),r.open=!0,Sp());return}if(t?.matches?.("[data-launch-ticker]")){const a=Re();a.keywords=String(t.value||""),a.open=!0,Sp();return}if(t?.matches?.("[data-smart-chart-zoom]")){n.smartChartZoom=Math.min(115,Math.max(60,Number(t.value)||72));const a=t.closest(".smart-chart-zoom")?.querySelector("strong");a&&S(a,`${n.smartChartZoom}%`);const r=t.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");r&&r.style.setProperty("--smart-chart-scale",String(n.smartChartZoom/100));return}t?.matches?.("[data-ogre-tek-field]")&&(ho(),t.type==="range"&&h({force:!0}))});function Lr(e=null){if(document.hidden)return;const t=e?.persisted?"pageshow-bfcache":"visibility-return",a=ld(t,{forcePaint:!0});od(),!a&&e?.persisted&&n.route==="terminal"&&h({force:!0,preserveSmartChartFrame:n.activeTab==="smartChart"}),sa&&window.clearTimeout(sa),sa=window.setTimeout(()=>{if(sa=null,!(document.hidden||n.route!=="terminal")){if(Jn()){W({component:"post-trade",action:"hidden-feed-refresh-skipped",durationMs:0,requestId:n.postTradeRefresh?.attemptId||"",details:n.activeTab||"terminal"});return}te(n.activeTab,{silent:!0,ifStale:!0,force:!1,reason:"visibility-focus-return"}).catch(r=>T(r.message)),n.user&&n.token&&zn("positions")&&wt({force:!1,fast:!0,silent:!0,followUpValues:!0,reason:"visibility-position-resume",timeoutMs:Bo}).catch(()=>{}),pa(),jn(),as(),hi()}},Yl)}document.addEventListener("visibilitychange",()=>{if(document.hidden){(n.ogreAgentListening||n.ogreAgentSpeechRecognizer)&&Gt("Voice input paused while tab was hidden.");return}const e=!!document.activeElement?.matches?.("[data-ogre-agent-input]");if(n.ogreAgentOpen&&(n.ogreAgentListening||n.ogreAgentLoading||e)){clearTimeout(appResumeTimer),appResumeTimer=setTimeout(()=>{!document.hidden&&!n.ogreAgentListening&&!n.ogreAgentLoading&&!document.activeElement?.matches?.("[data-ogre-agent-input]")&&Lr()},Yl+900);return}Lr()}),window.addEventListener("focus",Lr),window.addEventListener("pageshow",Lr),window.addEventListener("online",Lr),window.addEventListener("pagehide",()=>{sa&&(window.clearTimeout(sa),sa=null),n.clipFarm?.recording&&er()});function $k(){jo&&window.clearInterval(jo),jo=window.setInterval(()=>{document.hidden||ld("watchdog")},Zm)}const Tk=[{key:"live",label:"Live",items:[["terminal","Live Terminal"],["live","Cooks"],["liveTrades","Live Trades"]]},{key:"chart",label:"Swap & Chart",items:[["trade","Slime Swap"],["smartChart","Smart Chart"]]},{key:"intel",label:"Intel",items:[["slimeScope","Slime Scope"],["watchlist","Watchlist"],["kol","KOL Tracker"],["sniper","OgreSniper"],["txAudit","TP/SL Audit"]]},{key:"tools",label:"Ogre Tek",items:[["tek","Tek Hub"],["ogreAi","Ogre A.I."],["launchCoin","Pump Launch"],["bundle","Bundle"],["volume","SlimeBot"],["launch","Launch Watch"]]},{key:"portfolio",label:"Portfolio",items:[["wallets","Wallets"],["positions","Positions"],["pnl","PnL"],["raids","Raid Board","/raids"]]},{key:"profile",label:"Profile",items:[["profile","Home / Profile"]]}];function La(e,t){return t=t||"#8dff45",`<svg class="swampi" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="${t}" fill-opacity="0.2" stroke="${t}" stroke-opacity="0.5" stroke-width="1.1"/><g stroke="${t}" stroke-width="1.95">${e}</g></svg>`}const Ak={terminal:"#46e8ff",live:"#8dff45",liveTrades:"#ffd24a",smartChart:"#72ff23",trade:"#3fe0d0",slimeScope:"#5ab0ff",watchlist:"#ffd24a",kol:"#ffcf5a",sniper:"#ff6b6b",txAudit:"#bbff63",tek:"#9fb6c2",ogreAi:"#b06bff",launchCoin:"#ff8a5a",bundle:"#ffa64d",volume:"#46e8ff",launch:"#9bff9b",wallets:"#ffd24a",positions:"#5ab0ff",pnl:"#72ff23",profile:"#8dff45"},xa={terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',live:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',liveTrades:'<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',smartChart:'<path d="M3 17l5-5 4 3 8-9"/><path d="M16 6h4v4"/>',trade:'<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>',slimeScope:'<circle cx="11" cy="11" r="6"/><path d="M11 5v2.5"/><path d="M11 14.5V17"/><path d="M5 11h2.5"/><path d="M14.5 11H17"/><circle cx="11" cy="11" r="1.2"/><path d="M15.5 15.5L20 20"/>',watchlist:'<path d="M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.3 9.5l5.2-.8z"/>',kol:'<path d="M4 8l3 9h10l3-9-5 4-3-6-3 6z"/><path d="M7 17h10"/>',sniper:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',txAudit:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/>',tek:'<path d="M15 5a4 4 0 0 1-5.2 5L5 14.8 9.2 19l4.8-4.8a4 4 0 0 1 5-5.2l-2.7 2.7-2.3-.5-.5-2.3z"/>',ogreAi:'<path d="M5 10a7 5 0 0 1 14 0v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M4 8L2.5 6"/><path d="M20 8l1.5-2"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9.5 15l-.7 2.5"/><path d="M14.5 15l.7 2.5"/>',launchCoin:'<path d="M12 3c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 17l-2 4"/><path d="M15 17l2 4"/>',bundle:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v6l8 4 8-4V7"/><path d="M12 11v6"/>',volume:'<path d="M4 13v4"/><path d="M8 9v8"/><path d="M12 5v12"/><path d="M16 10v7"/><path d="M20 13v4"/>',launch:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',wallets:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.3"/>',positions:'<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',pnl:'<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>',profile:'<path d="M5 12a7 6 0 0 1 14 0v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M9 14.5c1.2 1.4 4.8 1.4 6 0"/>',prelaunch:'<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M7 18l-1 2"/><path d="M17 18l1 2"/><path d="M10 7c0-1.3 1-1.3 1-2.5"/><path d="M14 8c0-1.3 1-1.3 1-2.5"/>',raids:'<path d="M5 4l9 9"/><path d="M19 4l-9 9"/><path d="M11 13l-4 7"/><path d="M13 13l4 7"/>'},Cm=Object.fromEntries(Object.entries(xa).map(([e,t])=>[e,La(t,Ak[e])])),Pk={live:La(xa.live,"#8dff45"),chart:La(xa.trade,"#3fe0d0"),intel:La(xa.slimeScope,"#5ab0ff"),tools:La(xa.tek,"#9fb6c2"),portfolio:La(xa.positions,"#5ab0ff"),profile:La(xa.profile,"#8dff45")};function Ck(){const e=document.querySelector(".tabs");if(!e||document.querySelector("[data-nav-drop]"))return;const t=document.createElement("nav");t.className="nav-drop-bar",t.setAttribute("data-nav-drop",""),t.setAttribute("aria-label","Portal areas");const a=`<a class="nav-drop-pro" href="/autopilot-pro" title="SlimeWire Auto — Pro autopilot" aria-label="Pro autopilot">
      <span class="nav-drop-pro-emblem" aria-hidden="true"></span>
    </a>`,r=([s,o,c])=>c?`<a href="${i(c)}" title="${i(o)}" class="nav-side-link">
         <span class="nav-side-icon" aria-hidden="true">${Cm[s]||"•"}</span>
         <span class="nav-side-label">${i(o)}</span>
       </a>`:`<button type="button" data-tab="${i(s)}" title="${i(o)}">
         <span class="nav-side-icon" aria-hidden="true">${Cm[s]||"•"}</span>
         <span class="nav-side-label">${i(o)}</span>
       </button>`;t.innerHTML=a+Tk.map(s=>`
    <div class="nav-drop-group" data-nav-drop-group="${i(s.key)}">
      <button type="button" class="nav-side-group-toggle" aria-expanded="false">
        <span class="nav-side-icon" aria-hidden="true">${Pk[s.key]||"•"}</span>
        <span class="nav-side-label">${i(s.label)}</span>
        <span class="nav-side-caret" aria-hidden="true">▾</span>
      </button>
      <div class="nav-side-items">
        ${s.items.map(r).join("")}
      </div>
    </div>
  `).join(""),e.parentElement.insertBefore(t,e),t.addEventListener("click",s=>{const o=s.target.closest(".nav-side-group-toggle");if(o){const c=o.parentElement,l=c.classList.contains("is-open");t.querySelectorAll(".nav-drop-group.is-open").forEach(d=>d.classList.remove("is-open")),t.querySelectorAll(".nav-side-group-toggle").forEach(d=>d.setAttribute("aria-expanded","false")),l||(c.classList.add("is-open"),o.setAttribute("aria-expanded","true"));return}s.target.closest("[data-tab]")&&t.querySelectorAll(".nav-drop-group.is-open").forEach(c=>c.classList.remove("is-open"))}),document.addEventListener("click",s=>{s.target.closest("[data-nav-drop]")||t.querySelectorAll(".nav-drop-group.is-open").forEach(o=>o.classList.remove("is-open"))})}function Lk(){const e=document.querySelector("[data-nav-drop]");if(!e)return;let t=!1;e.querySelectorAll(".nav-drop-group").forEach(a=>{const r=!!a.querySelector(`[data-tab="${n.activeTab}"]`);a.querySelector(".nav-side-group-toggle")?.toggleAttribute("data-active",r),a.classList.contains("is-open")&&(t=!0)}),e.querySelectorAll("[data-tab]").forEach(a=>{a.dataset.active=a.dataset.tab===n.activeTab?"true":"false"})}function xk(){const e=document.querySelector('script[src*="app.js?v="]')?.getAttribute("src")||"";if(!e)return;setInterval(async()=>{if(!document.hidden)try{const s=((await fetch("/?build-check=1",{cache:"no-store"}).then(o=>o.text())).match(/app\.js\?v=[\w-]+/)||[])[0]||"";s&&!e.includes(s)&&Mk()}catch{}},300*1e3).unref?.()}function Mk(){if(document.querySelector("[data-build-update]"))return;const e=document.createElement("button");e.type="button",e.setAttribute("data-build-update",""),e.className="build-update-pill",e.textContent="🐸 SlimeWire updated - tap to refresh",e.addEventListener("click",()=>window.location.reload()),document.body.appendChild(e)}async function Bk(){Ck(),xk(),Bf(),Wf(),Ff(),Yo(),Ef(),n.route==="intro"?If():Bn({reset:!0}),ug(),$k(),Qo(),al(),await sh(),h(),await ch(),Ky(),n.route==="terminal"&&(en({silent:!0,ifStale:!0,reason:"site-load"}).catch(e=>T(e.message)),n.activeTab==="ogreTek"&&await Cr({silent:!0}).catch(e=>T(e.message)),h({preserveSmartChartFrame:n.activeTab==="smartChart"}))}Bk();function Lt(e){n.pumpLiveStatus=e,n.pumpLiveLastActionAt=Date.now(),h()}function Rk(){const e=typeof collectLaunchCoinDraft=="function"?collectLaunchCoinDraft():n.launchCoinDraft||{},t=du(e);return{tokenMint:t,mint:t,address:t,name:e.name||e.tokenName||"Pump launch",symbol:e.symbol||e.ticker||"PUMP",dexId:"pumpfun",source:"pump-live",bonded:!1,isBonded:!1,bondingStatus:"pump"}}function Ik(e){const t=e.target.closest("[data-pump-live-action]");if(!t)return;e.preventDefault();const a=t.getAttribute("data-pump-live-action"),r=Rk(),s=r.tokenMint;if(!s){Lt("Paste or launch a CA first, then Pump Live can attach to it.");return}if(a==="chart"){typeof $t=="function"?($t(r,{defaultTab:"chart",view:"chartTxns",source:"pump-live"}),Lt("Opened Pump chart with transactions inside Slime.")):Lt("Chart panel is still loading. Try again in a moment.");return}if(a==="copy"){const o=uu(s);navigator.clipboard?.writeText(o).then(()=>Lt("Copied Pump Live stream route ID."),()=>Lt("Stream route ID ready: "+o));return}if(a==="obs"){const o=Ki()?"Use the configured provider ingest URL for OBS or mobile live setup.":"Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";Lt(o);return}if(a==="end"){Lt("Pump Live ended for this launch. Chart and transactions stay available.");return}if(a==="go"){if(!Ki()){Lt("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");return}Lt("Pump Live staged. Start the stream from your provider, OBS, or mobile app.")}}document.addEventListener("click",Ik);function Jt(e){const t=String(e??"");return typeof i=="function"?i(t):t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function Nl(e){return e&&typeof e=="object"?e.token||e.pair||e.item||e:n.smartChartToken||{}}function Dl(e){return String(e.tokenMint||e.mint||e.address||e.pairAddress||e.poolAddress||e.baseMint||e.ca||"").trim()}function Ok(e){const t=String(e||"");return t.length>14?`${t.slice(0,6)}...${t.slice(-6)}`:t}function $o(e){if(typeof e=="number")return Number.isFinite(e)?e:NaN;if(e==null||e==="")return NaN;const t=Number(String(e).replace(/[$,%\s,]/g,""));return Number.isFinite(t)?t:NaN}function Lm(e){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.close,e.c,e.marketCap,e.mc,e.fdv,e.liquidityUsd];for(const a of t){const r=$o(a);if(Number.isFinite(r)&&r>0)return r}return NaN}function Ek(e){const t=e.time||e.timestamp||e.blockTime||e.createdAt||e.updatedAt||e.date;if(!t)return Date.now();if(typeof t=="number")return t<1e11?t*1e3:t;const a=Number(t);if(Number.isFinite(a))return a<1e11?a*1e3:a;const r=Date.parse(t);return Number.isFinite(r)?r:Date.now()}function Fk(e){return Array.isArray(e)?e:!e||typeof e!="object"?[]:e.items||e.rows||e.data||e.trades||e.transactions||[]}function Wk(e,t,a){if(!a.length)return!1;const r=[e.tokenMint,e.mint,e.address,e.pairAddress,e.poolAddress,e.baseMint,e.ca,e.symbol,e.baseSymbol,e.tokenSymbol,e.name,e.tokenName].map(s=>String(s||"").toLowerCase()).join(" ");return a.some(s=>r.includes(s))}function _k(e=""){return String(e||"").split("").reduce((t,a)=>t*31+a.charCodeAt(0)>>>0,17)}function Nk(e={}){const t=[e.priceUsd,e.priceUSD,e.usdPrice,e.tokenPriceUsd,e.price,e.marketCap,e.marketCapUsd,e.mc,e.fdv,e.fdvUsd,e.liquidityUsd,e.liquidity?.usd,e.volume5m,e.volumeM15,e.volumeH1,e.volumeH24,e.volume?.m5,e.volume?.h1,e.volume?.h24].map($o).filter(s=>Number.isFinite(s)&&s>0);if(t.length)return t[0];const a=typeof Kt=="function"?Number(Kt(e)):NaN;if(Number.isFinite(a)&&a>0)return Math.max(1,a*1e3);const r=Number(e.ageMinutes||e.pairAgeMinutes||e.launchAgeMinutes||0);return Math.max(1,r||1)}function I0(e){const t=Nl(e),a=Dl(t)||t.symbol||t.name||"slime",r=Nk(t),s=_k(a),o=Math.max(1,$o(t.liquidityUsd||t.liquidity?.usd)||r),c=Math.max(0,$o(t.volume5m||t.volumeM15||t.volumeH1||t.volume?.m5||t.volume?.h1)||0),l=typeof Kt=="function"?Math.max(0,Math.min(100,Number(Kt(t))||0)):0,d=Math.max(-8,Math.min(18,c/o*18+l/12)),u=Date.now();return Array.from({length:34},(p,f)=>{const y=(f+s%13)/4.2,b=Math.sin(y)*(3.5+s%7*.28),v=(f/33-.5)*d,P=((s>>f%11&7)-3)*.32,A=Math.max(1e-7,r*(1+(b+v+P)/100));return{row:{...t,snapshotFallback:!0},value:A,time:u-(33-f)*15e3,side:"snapshot"}})}function xm(e){const t=Nl(e),a=[Dl(t),t.symbol,t.baseSymbol,t.name].map(c=>String(c||"").trim().toLowerCase()).filter((c,l,d)=>c.length>=3&&d.indexOf(c)===l),r=[{direct:!0,rows:t.candles},{direct:!0,rows:t.chartCandles},{direct:!0,rows:t.priceHistory},{direct:!0,rows:t.trades},{direct:!0,rows:t.transactions},{direct:!0,rows:t.recentTrades},{direct:!0,rows:t.sourceEvents},{direct:!1,rows:n.liveTrades},{direct:!1,rows:n.liveTradeRows},{direct:!1,rows:n.tradeTape},{direct:!1,rows:n.recentTrades},{direct:!1,rows:n.pumpTrades},{direct:!1,rows:n.pumpActivity},{direct:!1,rows:n.livePairs},{direct:!1,rows:n.livePairsRows},{direct:!1,rows:n.freshPairs},{direct:!1,rows:n.slimeScopePairs}],s=[];for(const c of r){const l=Fk(c.rows).slice(-350);for(const d of l){if(!d||typeof d!="object"||!c.direct&&!Wk(d,t,a))continue;const u=Lm(d);if(!Number.isFinite(u)||u<=0)continue;const p=String(d.side||d.type||d.action||d.tradeType||"").toLowerCase();s.push({row:d,value:u,time:Ek(d),side:p.includes("sell")?"sell":p.includes("buy")?"buy":"trade"})}}const o=Lm(t);return Number.isFinite(o)&&o>0&&s.push({row:t,value:o,time:Date.now(),side:"snapshot"}),s.sort((c,l)=>c.time-l.time).filter((c,l,d)=>l===0||c.time!==d[l-1].time||c.value!==d[l-1].value).slice(-120)}function To(e){return Number.isFinite(e)?e>=1e6?`$${(e/1e6).toFixed(e>=1e7?1:2)}M`:e>=1e3?`$${(e/1e3).toFixed(e>=1e4?1:2)}K`:e>=1?`$${e.toFixed(e>=100?0:3)}`:`$${e.toPrecision(3)}`:"n/a"}function Dk(){const e=String(n.pumpChartSource||"slime").toLowerCase();return e==="pump"||e==="dex"?e:"slime"}function Uk(e={},t={}){const a=Nl(e),r=Dl(a),s=Dk(),o=String(n.pumpChartMode||"line").toLowerCase()==="candles"?"candles":"line",c=String(n.pumpChartTimeframe||"5m"),d=xm(a).slice(-70),u=!d.length||d.every(q=>q.side==="snapshot"||q.row?.snapshotFallback),p=d.map(q=>q.value),f=p.length?Math.min(...p):NaN,y=p.length?Math.max(...p):NaN,b=720,v=260,P=22,A=Number.isFinite(y-f)&&y!==f?y-f:1,g=q=>d.length<=1?b/2:P+q/(d.length-1)*(b-P*2),$=q=>v-P-(q-(Number.isFinite(f)?f:0))/A*(v-P*2),C=d.map((q,Oe)=>`${Oe?"L":"M"}${g(Oe).toFixed(1)},${$(q.value).toFixed(1)}`).join(" "),B=d.length>1?`${C} L${g(d.length-1).toFixed(1)},${v-P} L${g(0).toFixed(1)},${v-P} Z`:"",U=Math.max(4,Math.min(12,(b-P*2)/Math.max(d.length*2,1))),H=d.map((q,Oe)=>{const Ue=(d[Math.max(0,Oe-1)]||q).value,xt=q.value,An=Math.max(Ue,xt),Mt=Math.min(Ue,xt),Ba=g(Oe),Mr=$(Ue),ee=$(xt),Pn=$(An),xo=$(Mt);return`<g class="slime-pump-candle ${xt>=Ue?"up":"down"}"><line x1="${Ba.toFixed(1)}" y1="${Pn.toFixed(1)}" x2="${Ba.toFixed(1)}" y2="${xo.toFixed(1)}" /><rect x="${(Ba-U/2).toFixed(1)}" y="${Math.min(Mr,ee).toFixed(1)}" width="${U.toFixed(1)}" height="${Math.max(2,Math.abs(ee-Mr)).toFixed(1)}" rx="2" /></g>`}).join(""),Se=r?`https://dexscreener.com/solana/${encodeURIComponent(r)}?embed=1&theme=dark&trades=1&info=0`:"",De=s==="dex"&&Se?`<iframe class="slime-pump-dex-frame" src="${Jt(Se)}" title="Dex chart" loading="lazy"></iframe>`:d.length>1?`<svg class="slime-pump-svg" viewBox="0 0 ${b} ${v}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${B}" />${o==="candles"?H:`<path class="slime-pump-line" d="${C}" />`}</svg>`:`<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${s==="pump"?"Pump pre-bonding ticks":"Slime live ticks"} will draw here from real feed data only.</span></div>`;return`
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
      <div class="slime-pump-chart-body">${De}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${Jt(To(p[p.length-1]))}</strong></div>
        <div><span>Range</span><strong>${Jt(Number.isFinite(f)&&Number.isFinite(y)?`${To(f)} - ${To(y)}`:"n/a")}</strong></div>
        <div><span>Source</span><strong>${Jt(u?"Slime snapshot":s==="slime"?"Slime default":s==="pump"?"Pump on-site":"Dex on-site")}</strong></div>
      </div>
    </div>`}function qk(e={}){const t=xm(e).slice(-40).reverse(),a=t.map(r=>{const s=Math.max(0,Math.floor((Date.now()-r.time)/1e3)),o=s<60?`${s}s`:`${Math.floor(s/60)}m`,c=r.row||{},l=c.wallet||c.owner||c.trader||c.signer||c.user||"wallet";return`<div class="slime-pump-tape-row ${r.side}"><span>${Jt(o)}</span><strong>${Jt(r.side)}</strong><span>${Jt(To(r.value))}</span><span>${Jt(Ok(l))}</span></div>`}).join("");return`<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${t.length} events</span></div><div class="slime-pump-tape-list">${a||'<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>'}</div></section>`}function Mm(){n.slimePumpChartRendering||(n.slimePumpChartRendering=!0,requestAnimationFrame(()=>{n.slimePumpChartRendering=!1,typeof h=="function"&&h()}))}document.addEventListener("click",e=>{const t=e.target.closest("[data-slime-pump-source]"),a=e.target.closest("[data-slime-pump-mode]"),r=e.target.closest("[data-slime-pump-time]");(t||a||r)&&(e.preventDefault(),e.stopPropagation(),t&&(n.pumpChartSource=t.getAttribute("data-slime-pump-source")||"slime"),a&&(n.pumpChartMode=a.getAttribute("data-slime-pump-mode")||"line"),r&&(n.pumpChartTimeframe=r.getAttribute("data-slime-pump-time")||"5m"),Mm())}),window.__slimeStablePumpChartTimer||(window.__slimeStablePumpChartTimer=setInterval(()=>{document.visibilityState==="visible"&&document.querySelector("[data-slime-pump-chart]")&&Mm()},8e3)),window.__slimeVolumeBotTimer||(window.__slimeVolumeBotTimer=setInterval(()=>{document.visibilityState!=="visible"||n.activeTab!=="volume"||!(n.volumeBots||[]).some(t=>t.status!=="completed")||vs()},7e3)),document.addEventListener("input",e=>{const t=e.target;if(!(!t||!t.matches)){if(t.matches("[data-vbot-invest]")){const a=document.querySelector("[data-vbot-invest-num]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-invest-num]")){const a=document.querySelector("[data-vbot-invest]");a&&(a.value=t.value)}else if(t.matches("[data-vbot-duration]")){const a=document.querySelector("[data-vbot-duration-label]");if(a){const r=Number(t.value);a.textContent=r>=60?`${(r/60).toFixed(r%60?1:0)}h`:`${r}m`}}}}),(function(){if(typeof window>"u"||window.__slimeTerminalEmptyFeedWatchdogV1)return;window.__slimeTerminalEmptyFeedWatchdogV1=!0;let t=0;const a=new Set(["terminal","live","liveTrades","slimeScope"]),r=[".terminal-token-row",".compact-signal-row",".signal-row",".live-trade-row",".slime-scope-row",".live-pair-row","[data-token-chart]"].join(",");function s(){return!!document.activeElement?.matches?.("[data-ogre-agent-input]")}function o(){return!!(n?.route==="terminal"&&a.has(String(n.activeTab||"terminal"))&&!document.hidden)}function c(){let p=0;const f=y=>{if(y){if(Array.isArray(y)){p+=y.length;return}if(Array.isArray(y.rows)){p+=y.rows.length;return}Array.isArray(y.data?.rows)&&(p+=y.data.rows.length)}};return f(n.livePairRows),f(n.slimeScopeRows),f(n.liveTradeRows),f(n.livePairs),Object.values(n.livePairsByBucket||{}).forEach(f),Object.values(n.terminalFeeds||{}).forEach(f),p}function l(){return!!document.querySelector('[data-app][data-route="terminal"]')?.querySelector?.(r)}function d(){const p=[n.livePairsLastUpdatedAt,n.livePairsLastUpdatedByBucket?.[n.livePairBucket||"live"],n.terminalFeeds?.[n.activeTab||"terminal"]?.updatedAt,n.terminalFeeds?.[n.activeTab||"terminal"]?.lastUpdatedAt].map(f=>Date.parse(String(f||""))).filter(Number.isFinite);return p.length?Date.now()-Math.max(...p)>3e4:!1}function u(p="empty-feed-watchdog"){if(!o()||s())return;const f=Date.now();if(f-t<Ln)return;const y=c()===0&&!l();if(!y&&!d())return;if(t=f,y){try{na.clear()}catch{}try{Or.clear()}catch{}try{n.livePairsLoadingByBucket={},n.livePairsLoading=!1}catch{}try{["terminal","live","slimeScope"].forEach(v=>{n.terminalFeeds&&n.terminalFeeds[v]&&n.terminalFeeds[v].inFlight&&(n.terminalFeeds={...n.terminalFeeds,[v]:{...n.terminalFeeds[v],inFlight:!1}})})}catch{}}const b=()=>typeof en=="function"?en({force:y,reason:p}):typeof te=="function"?te(n.activeTab||"terminal",{force:y,reason:p}):null;try{typeof ne=="function"?ne(b):Promise.resolve(b()).catch(()=>{})}catch{}}window.setTimeout(()=>u("first-paint-empty-feed-watchdog"),3200),window.setInterval(()=>u("empty-feed-watchdog-interval"),Ln),window.addEventListener("pageshow",()=>window.setTimeout(()=>u("pageshow-empty-feed-watchdog"),Ln)),document.addEventListener("visibilitychange",()=>{document.hidden||window.setTimeout(()=>u("visible-empty-feed-watchdog"),Ln)})})();const I={running:!1,recorder:null,chunks:[],stream:null,root:null,timers:[],audio:null,mime:"video/webm"};function Ma(e){return new Promise(t=>{const a=setTimeout(t,e);I.timers.push(a)})}function Hk(){return window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad/i.test(navigator.userAgent)}function Kk(){const e=window.AudioContext||window.webkitAudioContext;if(!e)return null;try{const t=new e;t.resume?.();const a=t.createGain();a.gain.value=.6,a.connect(t.destination);let r=null;try{r=t.createMediaStreamDestination(),a.connect(r)}catch{}return I.audio={ctx:t,master:a,dest:r},I.audio}catch{return null}}function Ao(e,t,a,r,s){const o=e.gain;o.setValueAtTime(1e-4,t),o.exponentialRampToValueAtTime(Math.max(.001,a),t+r),o.exponentialRampToValueAtTime(1e-4,t+r+s)}function Bm(e,t=1){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,e),r.frequency.exponentialRampToValueAtTime(42,e+.22),Ao(s,e,.8*t,.006,.3),r.connect(s).connect(a.master),r.start(e),r.stop(e+.45)}function Rm(e){const t=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=t.getChannelData(0);for(let r=0;r<a.length;r+=1)a[r]=Math.random()*2-1;return t}function Vk(e,t=1.3){const a=I.audio;if(!a)return;const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Rm(a.ctx)),r.loop=!0;const s=a.ctx.createBiquadFilter();s.type="bandpass",s.Q.value=1.1,s.frequency.setValueAtTime(250,e),s.frequency.exponentialRampToValueAtTime(5200,e+t);const o=a.ctx.createGain();o.gain.setValueAtTime(1e-4,e),o.gain.exponentialRampToValueAtTime(.3,e+t),o.gain.exponentialRampToValueAtTime(1e-4,e+t+.08),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+t+.2)}function Ul(e,t=!1){const a=I.audio;if(!a)return;Bm(e,t?1.4:1.1);const r=a.ctx.createBufferSource();r.buffer=I.noiseBuf||(I.noiseBuf=Rm(a.ctx));const s=a.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=t?1400:900;const o=a.ctx.createGain();Ao(o,e,t?.5:.32,.004,t?.9:.5),r.connect(s).connect(o).connect(a.master),r.start(e),r.stop(e+1.4);const c=a.ctx.createOscillator(),l=a.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(64,e),c.frequency.exponentialRampToValueAtTime(28,e+(t?1.4:.8)),Ao(l,e,t?.7:.4,.01,t?1.5:.85),c.connect(l).connect(a.master),c.start(e),c.stop(e+2)}function zk(e,t=720){const a=I.audio;if(!a)return;const r=a.ctx.createOscillator(),s=a.ctx.createGain();r.type="square",r.frequency.value=t,Ao(s,e,.12,.004,.12),r.connect(s).connect(a.master),r.start(e),r.stop(e+.2)}function jk(e,t){const a=I.audio;if(!a)return;const r=a.ctx.currentTime+.05;for(let s=0;s<t-.4;s+=.5)Bm(r+s,.55+.35*(s/t));for(const s of e)Vk(r+Math.max(0,s-1.25),1.25),Ul(r+s,!1);Ul(r+t-.35,!0),Ul(r+t+.45,!0)}function Gk(){if(document.getElementById("trailer-style"))return;const e=document.createElement("style");e.id="trailer-style",e.textContent=`
    @keyframes twCapIn { 0% { transform: translateX(-50%) scale(1.3); opacity: 0; filter: blur(8px); } 100% { transform: translateX(-50%) scale(1); opacity: 1; filter: blur(0); } }
    @keyframes twFlash { 0% { opacity: 0.45; } 100% { opacity: 0; } }
    @keyframes twPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twGlow { 0%, 100% { text-shadow: 0 0 24px rgba(114,255,35,0.55); } 50% { text-shadow: 0 0 56px rgba(114,255,35,0.95); } }
  `,document.head.appendChild(e)}function Po(){if(I.root)return I.root;Gk();const e=document.createElement("div");return e.setAttribute("data-trailer-overlay",""),e.style.cssText="position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:Inter,system-ui,sans-serif;",e.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:7vh;background:linear-gradient(rgba(2,7,2,0.92),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:16vh;background:linear-gradient(transparent,rgba(2,7,2,0.94));"></div>
    <div data-trailer-flash style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, rgba(114,255,35,0.55), rgba(114,255,35,0.12) 60%, transparent);opacity:0;"></div>
    <div data-trailer-caption style="position:absolute;left:50%;bottom:max(30px, env(safe-area-inset-bottom, 0px) + 26px);transform:translateX(-50%);text-align:center;opacity:0;max-width:94vw;">
      <div data-trailer-caption-main style="color:#72ff23;font-size:clamp(20px,5.4vw,32px);font-weight:900;letter-spacing:0.04em;animation:twGlow 2.2s infinite;"></div>
      <div data-trailer-caption-sub style="color:#d6ffbf;font-size:clamp(12px,3.4vw,17px);font-weight:600;margin-top:4px;"></div>
    </div>
    <div data-trailer-center style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(2,7,2,0.88);text-align:center;padding:22px;"></div>
    <button type="button" data-trailer-stop style="position:absolute;top:max(10px, env(safe-area-inset-top, 0px));right:12px;pointer-events:auto;background:rgba(8,20,10,0.8);border:1px solid rgba(114,255,35,0.3);color:#9fb59a;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">stop</button>
  `,e.querySelector("[data-trailer-stop]").addEventListener("click",()=>ql("stopped")),document.body.appendChild(e),I.root=e,e}function Co(){const e=Po().querySelector("[data-trailer-flash]");e.style.animation="none",e.offsetWidth,e.style.animation="twFlash 0.55s ease-out forwards"}function Lo(e,t=""){const a=Po(),r=a.querySelector("[data-trailer-caption]");a.querySelector("[data-trailer-caption-main]").textContent=e,a.querySelector("[data-trailer-caption-sub]").textContent=t,e?(r.style.animation="none",r.offsetWidth,r.style.animation="twCapIn 0.5s cubic-bezier(0.2,1.4,0.4,1) forwards",r.style.opacity="1"):r.style.opacity="0"}function xr(e){const t=Po().querySelector("[data-trailer-center]");if(!e){t.style.display="none",t.innerHTML="";return}t.innerHTML=e,t.style.display="flex"}function Xk(){const e=["video/mp4;codecs=avc1.64001f,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"];for(const t of e)try{if(MediaRecorder.isTypeSupported(t))return t}catch{}return"video/webm"}async function Jk(){if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return!1;try{const e=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!1,preferCurrentTab:!0,selfBrowserSurface:"include"});I.stream=e;const t=[...e.getVideoTracks()],a=I.audio?.dest?.stream?.getAudioTracks()||[];t.push(...a);const r=new MediaStream(t);I.mime=Xk(),I.chunks=[];const s=new MediaRecorder(r,{mimeType:I.mime,videoBitsPerSecond:6e6});return s.ondataavailable=o=>{o.data?.size&&I.chunks.push(o.data)},s.start(1e3),I.recorder=s,e.getVideoTracks()[0]?.addEventListener("ended",()=>ql("screen-share-ended")),!0}catch{return!1}}function Yk(e){const t=I.mime.includes("mp4")?"mp4":"webm",a=`slimewire-trailer-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.${t}`,r=URL.createObjectURL(e),s=document.createElement("div");s.setAttribute("data-trailer-result",""),s.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(2,7,2,0.94);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif;",s.innerHTML=`
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
  `,s.querySelector("[data-trailer-close]").addEventListener("click",()=>{s.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3)}),s.querySelector("[data-trailer-share]").addEventListener("click",async()=>{try{const o=new File([e],a,{type:I.mime.split(";")[0]});if(navigator.canShare?.({files:[o]})){await navigator.share({files:[o],title:"SlimeWire",text:"SlimeWire - verify before you ape. slimewire.org"});return}}catch{}s.querySelector("a[download]")?.click()}),document.body.appendChild(s)}function Qk(){const e=I.recorder;if(!e)return;const t=()=>{try{const a=new Blob(I.chunks,{type:I.mime.split(";")[0]});a.size>0&&Yk(a)}catch{}};if(e.state!=="inactive"){e.addEventListener("stop",t,{once:!0});try{e.stop()}catch{t()}}else t();I.stream?.getTracks().forEach(a=>{try{a.stop()}catch{}}),I.recorder=null,I.stream=null}function ql(e="done"){if(I.running){I.running=!1,I.timers.forEach(t=>clearTimeout(t)),I.timers=[],Qk();try{I.audio?.ctx?.close()}catch{}I.audio=null,I.root?.remove(),I.root=null}}function Zk(){const e=n.livePairsByBucket?.live?.rows||n.livePairs?.rows||n.livePairRows||[];return[...e].filter(a=>a?.tokenMint).sort((a,r)=>(Number(r.volume5m)||0)-(Number(a.volume5m)||0)||(Number(r.bestPickScore||r.score)||0)-(Number(a.bestPickScore||a.score)||0))[0]||e[0]||null}async function e0(e=9e3){const t=Date.now();for(;Date.now()-t<e;){const a=Zk();if(a)return a;if(!I.running)return null;await Ma(500)}try{return((await k("/api/web/live-pairs?bucket=live&sort=fresh"))?.livePairs?.rows||[]).find(s=>s?.tokenMint)||null}catch{return null}}async function t0(e,t=4e3){const a=Date.now();for(;Date.now()-a<t;){if(document.querySelector(e))return!0;if(!I.running)return!1;await Ma(250)}return!1}function a0(){return new Promise(e=>{xr(`
      <div style="color:#72ff23;font-weight:900;font-size:clamp(20px,6vw,28px);">🎬 TRAILER MODE</div>
      <div style="color:#d6ffbf;font-size:clamp(13px,3.8vw,16px);margin-top:14px;max-width:420px;line-height:1.5;">
        1. Start your phone's <b>screen recorder</b> now<br>
        (Control Center on iPhone / quick tile on Android)<br>
        2. Come back and tap GO
      </div>
      <button type="button" data-trailer-go style="pointer-events:auto;margin-top:22px;background:linear-gradient(135deg,#72ff23,#bbff63);color:#071006;border:0;border-radius:999px;padding:14px 44px;font-weight:900;font-size:18px;cursor:pointer;">GO</button>
      <div style="color:#7d937a;font-size:11px;margin-top:14px;">the performance starts on a 3-2-1 after you tap</div>
    `),I.root.querySelector("[data-trailer-go]")?.addEventListener("click",()=>e(!0),{once:!0})})}async function n0(){if(I.running)return;I.running=!0,Po(),Kk();const e=await Jk(),t=Hk();if(!e&&(await a0(),!I.running))return;Pe("/terminal/live-pairs"),xr('<div style="color:#72ff23;font-weight:900;font-size:clamp(18px,5vw,24px);animation:twPulse 1.2s infinite;">locking onto live pairs...</div>');const a=await e0(9e3);if(!I.running)return;const r=3,s=6.5,o=9,c=6.5,l=4.6,d=[r,r+s,r+s+o,r+s+o+c],u=r+s+o+c+l;jk(d,u);const f=(I.audio?.ctx?.currentTime||0)+.05;for(let b=0;b<r;b+=1)zk(f+b,600+b*90);for(let b=r;b>=1;b-=1){if(!I.running)return;xr(`<div style="color:#72ff23;font-size:clamp(64px,22vw,110px);font-weight:900;text-shadow:0 0 30px rgba(114,255,35,0.75);animation:twPulse 1s infinite;">${b}</div>`),await Ma(1e3)}if(xr(""),!I.running)return;Co(),Lo("FRESH PAIRS. SECONDS OLD.","every pump.fun launch lands here instantly"),await Ma(s*1e3);const y=a?.symbol?`$${String(a.symbol).slice(0,12)}`:"live pair";if(I.running&&a?.tokenMint){Co(),Pe(`/terminal/chart?token=${encodeURIComponent(a.tokenMint)}`);const b=await t0("iframe[src*='dexscreener'], .smart-chart-terminal iframe, [data-chart] canvas",4500);if(!I.running||(Lo("CHARTS WITH A BRAIN",`${y} - live candles, live flow, shield verdict on top`),await Ma((b?o:4)*1e3),!I.running))return;Co(),Op(a.tokenMint),Lo("TRIPLE-ENGINE RUG CHECK","SlimeShield x Rugcheck x GoPlus - dodge the rug BEFORE you ape"),await Ma(c*1e3),yl()}I.running&&(Lo(""),Co(),xr(`
    <div style="color:#72ff23;font-size:clamp(38px,11vw,76px);font-weight:900;letter-spacing:0.05em;animation:twGlow 1.6s infinite, twPulse 1.6s infinite;">SLIMEWIRE.ORG</div>
    <div style="color:#d6ffbf;font-size:clamp(15px,4.4vw,23px);font-weight:700;margin-top:10px;">verify before you ape</div>
    <div style="color:#7d937a;font-size:clamp(10px,3vw,12px);margin-top:26px;">Live market data. Not financial advice.</div>
  `),await Ma(l*1e3),ql("done"))}document.addEventListener("click",e=>{e.target instanceof Element&&e.target.closest("[data-trailer-mode]")&&(e.preventDefault(),I.running||n0())});
