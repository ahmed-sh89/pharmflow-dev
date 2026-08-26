"use strict";
const PharmFlowNext={version:"B10R3",initialized:false,init(){if(this.initialized)return;this.initialized=true;document.body.classList.add("pfNextMode");this.bindDashboardActions();this.refreshDashboard();if(window.AppEvents?.on){["workspace:changed","receiving:updated","archive:updated","route:changed","cloud:workspace-updated"].forEach(evt=>{try{AppEvents.on(evt,()=>this.refreshDashboard())}catch(_){}})}setInterval(()=>this.refreshDashboard(),5000)},bindDashboardActions(){document.querySelectorAll("[data-pfn-route]").forEach(button=>{button.addEventListener("click",()=>{const route=button.getAttribute("data-pfn-route");if(route&&typeof navigateTo==="function")navigateTo(route)})})},refreshDashboard(){const stats=window.AppState?.statistics||{},workspace=window.AppState?.workspace||{},account=window.AuthState?.context||{};this.text("pfnTotalItems",stats.totalItems??0);this.text("pfnCompleted",stats.completedItems??0);this.text("pfnRemaining",stats.remainingItems??0);this.text("pfnAttentionRemaining",stats.remainingItems??0);this.text("pfnScans",stats.totalScans??0);this.text("pfnActiveAudits",Array.isArray(workspace.orderFiles)?workspace.orderFiles.length:0);this.text("pfnNeedsReview",this.needsReviewCount());this.text("pfnExpiryCount",this.expiryCount());this.text("pfnPharmacyName",account.pharmacy_name||"PharmFlow Dev");const greeting=document.getElementById("pfnGreeting");if(greeting){const h=new Date().getHours();greeting.textContent=h<12?"Good morning":h<18?"Good afternoon":"Good evening"}},needsReviewCount(){try{if(Array.isArray(window.NeedsReviewEngine?.items))return NeedsReviewEngine.items.length;return Number(window.AppState?.workspace?.needsReviewCount||0)}catch(_){return 0}},expiryCount(){try{if(Array.isArray(window.ExpiryCaptureEngine?.captures))return ExpiryCaptureEngine.captures.length}catch(_){}return 0},text(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value??"")}};
window.PharmFlowNext=PharmFlowNext;document.addEventListener("DOMContentLoaded",()=>PharmFlowNext.init());


/* B2 visual viewport-fit coordinator — no business/state writes. */
(function pfnB2ViewportFit(){
  let raf=0;
  function refresh(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      try{
        const desktop=window.innerWidth>=901 && !document.body.classList.contains("zebraMode");
        document.body.classList.toggle("pfnDesktopFit",desktop);
      }catch(_){}
    });
  }
  window.addEventListener("resize",refresh,{passive:true});
  document.addEventListener("DOMContentLoaded",refresh);
  if(window.AppEvents?.on){
    try{AppEvents.on("route:changed",refresh);}catch(_){}
  }
  refresh();
})();


/* =============================================================
   B8 VISUAL SCAN FEEDBACK
   Presentation-only listener/wrapper.
   It does not change scan parsing, quantities, GTIN resolution,
   persistence, synchronization, transactions or error handling.
============================================================= */
(function pharmFlowB8ScanFeedback(){
  let flashTimer=0;
  let ready=false;

  function ensureOverlay(){
    let overlay=document.getElementById("pfnScanFlashOverlay");
    if(overlay) return overlay;

    overlay=document.createElement("div");
    overlay.id="pfnScanFlashOverlay";
    overlay.setAttribute("aria-hidden","true");
    document.body.appendChild(overlay);
    return overlay;
  }

  function flash(type){
    const isSuccess=type==="success";
    const card=document.getElementById("lastScanCard");
    const scanBox=document.getElementById("scanBox");
    const scanPanel=scanBox?.closest?.(".scanPanel")||document.querySelector("#page-dashboard .scanPanel");

    clearTimeout(flashTimer);
    if(!card && !scanBox && !scanPanel) return;

    card?.classList.remove("pfnLastScanFlashSuccess","pfnLastScanFlashError");
    scanBox?.classList.remove("pfnScanBoxFlashSuccess","pfnScanBoxFlashError");
    scanPanel?.classList.remove("pfnScanPanelFlashSuccess","pfnScanPanelFlashError");

    // Distinct frame keeps rapid back-to-back hardware scans visible.
    void (card||scanPanel||scanBox).offsetWidth;

    card?.classList.add(isSuccess?"pfnLastScanFlashSuccess":"pfnLastScanFlashError");
    scanBox?.classList.add(isSuccess?"pfnScanBoxFlashSuccess":"pfnScanBoxFlashError");
    scanPanel?.classList.add(isSuccess?"pfnScanPanelFlashSuccess":"pfnScanPanelFlashError");

    flashTimer=setTimeout(()=>{
      card?.classList.remove("pfnLastScanFlashSuccess","pfnLastScanFlashError");
      scanBox?.classList.remove("pfnScanBoxFlashSuccess","pfnScanBoxFlashError");
      scanPanel?.classList.remove("pfnScanPanelFlashSuccess","pfnScanPanelFlashError");
    },360);
  }

  function scannerTransaction(transaction){
    const configured=String(
      window.APP_CONFIG?.transactionSources?.scanner || "SCANNER"
    ).toUpperCase();

    const source=String(transaction?.source||"").toUpperCase();
    return !!source && source===configured;
  }

  function install(){
    if(ready) return;
    ready=true;
    ensureOverlay();

    // Successful scanner transaction is emitted only after the existing
    // receiving engine has completed its normal update path.
    if(window.AppEvents?.on){
      try{
        AppEvents.on("receiving:transaction",(transaction)=>{
          if(scannerTransaction(transaction)){
            flash("success");
          }
        });
      }catch(_){}
    }

    // Failures already surface through the existing scan error/warning
    // path. Observe it visually while ScannerEngine is processing and
    // then call the original toast unchanged.
    if(typeof window.showToast==="function" && !window.showToast.__pfnB8Wrapped){
      const original=window.showToast;

      const wrapped=function(message,type,duration){
        try{
          const processing=window.ScannerEngine?.processing===true;
          if(processing && (type==="error" || type==="warning")){
            flash("error");
          }
        }catch(_){}

        return original.apply(this,arguments);
      };

      wrapped.__pfnB8Wrapped=true;
      wrapped.__pfnOriginal=original;
      window.showToast=wrapped;
    }
  }

  document.addEventListener("DOMContentLoaded",install);
  if(document.readyState!=="loading"){
    install();
  }
})();


/* =============================================================
   B10-R3 RECEIVING WORKSPACE CONSOLIDATED FIXES
   Implements the nine approved UI corrections.
   Presentation/worklist metadata only. No receiving, GTIN, quantity,
   Supabase, sync, report or finalization business-rule changes.
============================================================= */
(function pharmFlowB10R2Workspace(){
  "use strict";
  let installed=false;
  let resultsMode="order";
  const worklistState={order:"ALL",priority:false,sort:"default",search:""};

  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const orderList=item=>{
    const raw=Array.isArray(item?.orderNumbers)&&item.orderNumbers.length?item.orderNumbers:[item?.orderNumber];
    return [...new Set(raw.map(v=>String(v??"").trim()).filter(Boolean))];
  };

  function removeBackdrop(id){ document.getElementById(id)?.remove(); }
  function makeBackdrop(id,onClose){
    removeBackdrop(id);
    const node=document.createElement("button");
    node.type="button";
    node.id=id;
    node.className="pfnR1Backdrop pfnR2Backdrop";
    node.setAttribute("aria-label","Close panel");
    node.addEventListener("click",onClose,{once:true});
    document.body.appendChild(node);
    return node;
  }

  function normalizeShell(){
    document.body.classList.add("pfnB10R1","pfnB10R2","pfnB10R3","pfnB10R4");
    const nav=document.querySelector(".sidebarNavigation");
    const dashboard=nav?.querySelector('[data-page="dashboard"]');
    const oldReceiving=nav?.querySelector('[data-page="receiving"]');
    const orders=nav?.querySelector('[data-page="files"]');
    if(dashboard){
      dashboard.classList.add("pfnPrimaryReceivingNav");
      const label=dashboard.querySelector("span:last-child");
      if(label && label.textContent!=="Receiving") label.textContent="Receiving";
    }
    oldReceiving?.classList.add("pfnLegacyNavHidden");
    orders?.classList.add("pfnLegacyNavHidden");

    const subtitle=document.getElementById("pageSubtitle");
    if(subtitle && /Receiving Dashboard|Receiving Workspace/.test(subtitle.textContent.trim()) && subtitle.textContent!=="Receiving Workspace") subtitle.textContent="Receiving Workspace";

    const scanPanel=document.querySelector("#page-dashboard .scanPanel");
    const scanTitle=scanPanel?.querySelector("h2");
    const scanHelp=scanPanel?.querySelector(".scanPanelHeader p");
    const input=document.getElementById("barcodeInput");
    if(scanTitle && scanTitle.textContent!=="Scan / Search") scanTitle.textContent="Scan / Search";
    if(scanHelp && scanHelp.textContent!=="Scan Barcode / GS1 or search by Item Number / Item Name.") scanHelp.textContent="Scan Barcode / GS1 or search by Item Number / Item Name.";
    if(input && input.placeholder!=="SCAN BARCODE OR SEARCH BY ITEM NUMBER / NAME") input.placeholder="SCAN BARCODE OR SEARCH BY ITEM NUMBER / NAME";

    const legacySearch=document.getElementById("btnQuickSearch");
    const legacyOrderItems=document.getElementById("btnOrderItemsPriority");
    legacySearch?.classList.add("pfnControlRemoved");
    legacyOrderItems?.classList.add("pfnControlRemoved");
    if(legacySearch) legacySearch.hidden=true;
    if(legacyOrderItems) legacyOrderItems.hidden=true;
    const clear=document.getElementById("btnPcClearLastScan");
    if(clear){ clear.classList.add("pfnClearScreenButton"); const markup='<span aria-hidden="true">⌫</span><span>Clear Screen</span>'; if(clear.innerHTML!==markup) clear.innerHTML=markup; }
  }

  function openOrders(){
    const page=document.getElementById("page-files");
    if(!page) return;
    document.body.classList.add("pfnDrawerActive","pfnManagementModalActive");
    page.classList.add("pfnR1OrdersDrawerOpen","pfnCenteredManagementModal");
    page.setAttribute("role","dialog");
    page.setAttribute("aria-modal","true");
    page.setAttribute("aria-label","Manage Orders");
    if(!page.querySelector(".pfnR1DrawerClose")){
      const close=document.createElement("button");
      close.type="button";
      close.className="pfnR1DrawerClose";
      close.innerHTML="✕";
      close.setAttribute("aria-label","Close Manage Orders");
      close.addEventListener("click",closeOrders);
      page.prepend(close);
    }
    makeBackdrop("pfnOrdersBackdrop",closeOrders);
  }
  function closeOrders(){
    document.body.classList.remove("pfnDrawerActive","pfnManagementModalActive");
    const page=document.getElementById("page-files");
    page?.classList.remove("pfnR1OrdersDrawerOpen","pfnCenteredManagementModal");
    page?.removeAttribute("role");
    page?.removeAttribute("aria-modal");
    page?.removeAttribute("aria-label");
    removeBackdrop("pfnOrdersBackdrop");
    try{ document.getElementById("barcodeInput")?.focus({preventScroll:true}); }catch(_){ }
  }

  function installManageOrders(){
    if(document.getElementById("pfnManageOrdersButton")) return;
    const right=document.querySelector(".topBarRight");
    if(!right) return;
    const button=document.createElement("button");
    button.id="pfnManageOrdersButton";
    button.type="button";
    button.className="pfnManageOrdersButton";
    button.innerHTML='<span aria-hidden="true">▤</span><span>Manage Orders</span>';
    button.addEventListener("click",openOrders);
    right.prepend(button);
  }

  function scopedItems(){
    try{
      if(typeof window.getScopedOrderItems==="function"){
        const rows=window.getScopedOrderItems();
        if(Array.isArray(rows)) return rows;
      }
    }catch(_){ }
    const rows=window.AppState?.workspace?.orderData;
    return Array.isArray(rows)?rows:[];
  }

  function classification(item){
    const value=String(item?.pfnWorklistType||"").toLowerCase();
    return value==="new"||value==="short"?value:"";
  }
  function saveClassification(item,type){
    if(!item) return;
    const current=classification(item);
    item.pfnWorklistType=current===type?"":type;
    try{ if(typeof window.saveApplicationState==="function") window.saveApplicationState("worklist-classification"); }catch(_){ }
  }

  function allOrders(rows){
    const set=new Set();
    rows.forEach(item=>orderList(item).forEach(order=>set.add(order)));
    return [...set].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));
  }

  function worklistToolbar(rows){
    const orders=allOrders(rows);
    if(worklistState.order!=="ALL"&&!orders.includes(worklistState.order)) worklistState.order="ALL";
    const priorityCount=rows.filter(i=>classification(i)==="new"||classification(i)==="short").length;
    return `<div class="pfnR4WorklistControls">
      <div class="pfnR2WorklistTools">
        <label><span>Order</span><select id="pfnWorklistOrder"><option value="ALL">All Orders</option>${orders.map(o=>`<option value="${esc(o)}" ${worklistState.order===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
        <div class="pfnR4PriorityFilter"><span>Priority</span><button id="pfnHighPriorityFilter" type="button" class="${worklistState.priority?"active":""}">High Priority <b>${priorityCount}</b></button></div>
        <label><span>Quantity</span><select id="pfnWorklistSort"><option value="default" ${worklistState.sort==="default"?"selected":""}>Default / Order Sequence</option><option value="high" ${worklistState.sort==="high"?"selected":""}>Highest → Lowest</option><option value="low" ${worklistState.sort==="low"?"selected":""}>Lowest → Highest</option></select></label>
      </div>
      <label class="pfnR4SearchRow"><span>Search Items</span><input id="pfnWorklistSearch" type="search" value="${esc(worklistState.search)}" placeholder="Search by item name or item number"></label>
    </div><div class="pfnR2WorklistSummary"><strong>${rows.length} Items</strong><span>High Priority ${priorityCount}</span></div>`;
  }

  function rowMarkup(item,index,mode="order"){
    const ordered=num(item?.orderedQty);
    const received=num(item?.receivedQty);
    const remaining=Math.max(0,num(item?.remainingQty ?? ordered-received));
    const orders=orderList(item);
    const order=orders.length?orders.join(", "):"—";
    const type=classification(item);
    if(mode==="received") return `<article class="pfnR1ResultRow pfnR4ReceivedRow" data-item-code="${esc(item?.itemCode||"")}"><div class="pfnR1ResultIdentity"><strong>${esc(item?.itemName||item?.itemCode||"Item")}</strong><small>Item ${esc(item?.itemCode||"—")} · Order ${esc(order)}</small></div><div><span>Ordered</span><b>${ordered}</b></div><div><span>Received</span><b>${received}</b></div><div><span>Remaining</span><b>${remaining}</b></div></article>`;
    return `<article class="pfnR1ResultRow pfnR2WorklistRow pfnR4OrderRow" data-item-code="${esc(item?.itemCode||"")}" data-source-index="${index}">
      <div class="pfnR1ResultIdentity"><strong>${esc(item?.itemName||item?.itemCode||"Item")}</strong><small>Item ${esc(item?.itemCode||"—")} · Order ${esc(order)}</small></div>
      <div class="pfnR4Ordered"><span>Ordered</span><b>${ordered}</b></div>
      <div class="pfnR2Classify"><span>Priority</span><div><button type="button" data-classify="new" class="pfnTagNew ${type==="new"?"active":""}">NEW</button><button type="button" data-classify="short" class="pfnTagShort ${type==="short"?"active":""}">SHORT</button></div></div>
    </article>`;
  }

  function filteredWorklist(rows){
    let visible=rows.map((item,index)=>({item,index}));
    if(worklistState.order!=="ALL") visible=visible.filter(({item})=>orderList(item).includes(worklistState.order));
    if(worklistState.priority) visible=visible.filter(({item})=>{ const t=classification(item); return t==="new"||t==="short"; });
    const q=worklistState.search.trim().toLowerCase();
    if(q) visible=visible.filter(({item})=>String(item?.itemName||"").toLowerCase().includes(q)||String(item?.itemCode||"").toLowerCase().includes(q));
    if(worklistState.sort==="high") visible.sort((a,b)=>num(b.item?.orderedQty)-num(a.item?.orderedQty)||a.index-b.index);
    if(worklistState.sort==="low") visible.sort((a,b)=>num(a.item?.orderedQty)-num(b.item?.orderedQty)||a.index-b.index);
    return visible;
  }

  function bindWorklist(rows,body){
    body.querySelector("#pfnWorklistOrder")?.addEventListener("change",e=>{worklistState.order=e.target.value;renderResults("order");});
    body.querySelector("#pfnWorklistSort")?.addEventListener("change",e=>{worklistState.sort=e.target.value;renderResults("order");});
    body.querySelector("#pfnWorklistSearch")?.addEventListener("input",e=>{worklistState.search=e.target.value;renderResults("order",{preserveScroll:true,focusSearch:true});});
    body.querySelector("#pfnHighPriorityFilter")?.addEventListener("click",()=>{worklistState.priority=!worklistState.priority;renderResults("order");});
    body.querySelectorAll("[data-classify]").forEach(btn=>btn.addEventListener("click",()=>{
      const scroll=body.scrollTop;
      const code=btn.closest("[data-item-code]")?.dataset.itemCode;
      const item=rows.find(row=>String(row?.itemCode||"")===String(code||""));
      saveClassification(item,btn.dataset.classify);
      renderResults("order",{restoreScroll:scroll});
    }));
  }

  function renderResults(mode,options={}){
    const panel=document.getElementById("pfnSmartResults");
    const body=document.getElementById("pfnSmartResultsBody");
    const title=document.getElementById("pfnSmartResultsTitle");
    if(!panel||!body||!title) return;
    resultsMode=mode;
    const rows=scopedItems();
    const oldScroll=options.restoreScroll??(options.preserveScroll?body.scrollTop:0);
    const isOrderModal=mode==="order"||mode==="received";
    panel.classList.toggle("pfnOrderItemsModal",isOrderModal);
    if(isOrderModal){
      document.body.classList.add("pfnOrderItemsModalActive");
      if(!document.getElementById("pfnOrderItemsBackdrop")) makeBackdrop("pfnOrderItemsBackdrop",closeResults);
      panel.setAttribute("role","dialog");
      panel.setAttribute("aria-modal","true");
      panel.setAttribute("aria-label",mode==="received"?"Received Items":"Order Items");
    }else{
      document.body.classList.remove("pfnOrderItemsModalActive");
      removeBackdrop("pfnOrderItemsBackdrop");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      panel.removeAttribute("aria-label");
    }
    if(mode==="received"){
      const visible=rows.filter(item=>num(item?.receivedQty)>0);
      title.textContent="Received Items";
      body.innerHTML=visible.length?`<div class="pfnR2ReceivedSummary"><strong>${visible.length} Received Items</strong></div>${visible.map((item,index)=>rowMarkup(item,index,"received")).join("")}`:'<div class="pfnR1Empty">No received items.</div>';
    }else{
      title.textContent="Order Items";
      const visible=filteredWorklist(rows);
      body.innerHTML=worklistToolbar(rows)+(visible.length?visible.map(({item,index})=>rowMarkup(item,index)).join(""):'<div class="pfnR1Empty">No matching items.</div>');
      bindWorklist(rows,body);
    }
    panel.hidden=false;
    body.scrollTop=oldScroll;
    if(options.focusSearch){
      const input=body.querySelector("#pfnWorklistSearch");
      if(input){ input.focus({preventScroll:true}); input.setSelectionRange(input.value.length,input.value.length); }
    }
    document.querySelectorAll("#scanPanelFooter .pfnR1ViewActive").forEach(el=>el.classList.remove("pfnR1ViewActive"));
    document.getElementById(mode==="received"?"btnReceivedItems":"statTotalItems")?.classList.add("pfnR1ViewActive");
  }

  function closeResults(){
    const panel=document.getElementById("pfnSmartResults");
    if(panel){ panel.hidden=true; panel.classList.remove("pfnOrderItemsModal"); panel.removeAttribute("role"); panel.removeAttribute("aria-modal"); panel.removeAttribute("aria-label"); }
    document.body.classList.remove("pfnOrderItemsModalActive");
    removeBackdrop("pfnOrderItemsBackdrop");
    document.querySelectorAll(".pfnR1ViewActive").forEach(el=>el.classList.remove("pfnR1ViewActive"));
    try{ document.getElementById("barcodeInput")?.focus({preventScroll:true}); }catch(_){ }
  }

  function installSmartResults(){
    if(document.getElementById("pfnSmartResults")) return;
    const main=document.querySelector(".mainApplication");
    if(!main) return;
    const panel=document.createElement("section");
    panel.id="pfnSmartResults";
    panel.className="pfnSmartResults";
    panel.hidden=true;
    panel.innerHTML=`<div class="pfnSmartResultsHead"><div><span>WORKLIST</span><h3 id="pfnSmartResultsTitle">Order Items</h3></div><button id="pfnCloseSmartResults" type="button" aria-label="Close results">✕</button></div><div id="pfnSmartResultsBody" class="pfnSmartResultsBody"></div>`;
    main.appendChild(panel);
    document.getElementById("pfnCloseSmartResults")?.addEventListener("click",closeResults);
  }

  function openReport(){
    const page=document.getElementById("page-receiving");
    if(!page) return;
    document.body.classList.add("pfnDrawerActive");
    page.classList.add("pfnR1ReportDrawerOpen");
    if(!page.querySelector(".pfnR1DrawerClose")){
      const close=document.createElement("button");
      close.type="button";
      close.className="pfnR1DrawerClose";
      close.innerHTML="✕";
      close.setAttribute("aria-label","Close Receiving Report");
      close.addEventListener("click",closeReport);
      page.prepend(close);
    }
    makeBackdrop("pfnReportBackdrop",closeReport);
    try{ window.refreshReceivingTable?.(); }catch(_){ }
  }
  function closeReport(){
    document.body.classList.remove("pfnDrawerActive");
    document.getElementById("page-receiving")?.classList.remove("pfnR1ReportDrawerOpen");
    removeBackdrop("pfnReportBackdrop");
    try{ document.getElementById("barcodeInput")?.focus({preventScroll:true}); }catch(_){ }
  }

  function installToolbar(){
    const footer=document.querySelector("#page-dashboard .scanPanelFooter");
    if(!footer) return;
    footer.id="scanPanelFooter";
    footer.classList.add("pfnUnifiedActionBar");
    const hint=footer.querySelector(":scope > span");
    hint?.classList.add("pfnScannerHint");
    const search=document.getElementById("btnQuickSearch");
    const orderItems=document.getElementById("btnOrderItemsPriority");
    if(search){ search.classList.add("pfnControlRemoved"); search.hidden=true; }
    if(orderItems){ orderItems.classList.add("pfnControlRemoved"); orderItems.hidden=true; }
    if(!document.getElementById("pfnReceivingReportButton")){
      const report=document.createElement("button");
      report.id="pfnReceivingReportButton";
      report.type="button";
      report.className="secondaryButton pfnR1ToolbarButton";
      report.innerHTML='<span aria-hidden="true">▧</span><span>Receiving Report</span>';
      report.addEventListener("click",openReport);
      footer.appendChild(report);
    }
    document.getElementById("btnReceivingNeedsReview")?.classList.add("pfnActionNeedsReview");
    document.getElementById("btnReceivedItems")?.classList.add("pfnActionReceived");
    document.getElementById("pfnReceivingReportButton")?.classList.add("pfnActionReport");
  }

  function wireExistingViews(){
    window.addEventListener("click",event=>{
      const total=event.target?.closest?.('.dashboardKpiCard[data-kpi="total"]');
      if(total){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); renderResults("order"); return; }
      const received=event.target?.closest?.("#btnReceivedItems");
      if(received){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); renderResults("received"); return; }
      const legacyOrder=event.target?.closest?.("#btnOrderItemsPriority");
      if(legacyOrder){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); renderResults("order"); }
    },true);
    window.addEventListener("keydown",event=>{
      const total=event.target?.closest?.('.dashboardKpiCard[data-kpi="total"]');
      if(total&&(event.key==="Enter"||event.key===" ")){ event.preventDefault(); renderResults("order"); }
    },true);
  }

  function refreshOpenResults(){
    normalizeShell();
    installToolbar();
    if(!document.getElementById("pfnSmartResults")?.hidden) renderResults(resultsMode,{preserveScroll:true});
  }

  function install(){
    if(installed) return;
    installed=true;
    normalizeShell();
    installManageOrders();
    installToolbar();
    installSmartResults();
    wireExistingViews();
    setTimeout(()=>{ normalizeShell(); installToolbar(); },250);
    setTimeout(()=>{ normalizeShell(); installToolbar(); },900);

    /* B10-R2.2 stability rule:
       Do not observe the live Receiving DOM. The legacy app legitimately
       performs many mutations while hydrating/rendering. Watching that tree
       and normalizing from the observer can create a render feedback loop and
       starve the main thread. Keep this shell event-driven and one-shot. */
    if(window.AppEvents?.on){
      try{
        AppEvents.on("route:changed",()=>{
          setTimeout(()=>{
            normalizeShell();
            installToolbar();
          },0);
          setTimeout(()=>{
            normalizeShell();
            installToolbar();
          },180);
        });
      }catch(_){ }
    }
  }

  document.addEventListener("DOMContentLoaded",()=>setTimeout(install,100));
  if(document.readyState!=="loading") setTimeout(install,100);
})();
