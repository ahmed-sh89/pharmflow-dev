"use strict";
const PharmFlowNext={version:"B10R1",initialized:false,init(){if(this.initialized)return;this.initialized=true;document.body.classList.add("pfNextMode");this.bindDashboardActions();this.refreshDashboard();if(window.AppEvents?.on){["workspace:changed","receiving:updated","archive:updated","route:changed","cloud:workspace-updated"].forEach(evt=>{try{AppEvents.on(evt,()=>this.refreshDashboard())}catch(_){}})}setInterval(()=>this.refreshDashboard(),5000)},bindDashboardActions(){document.querySelectorAll("[data-pfn-route]").forEach(button=>{button.addEventListener("click",()=>{const route=button.getAttribute("data-pfn-route");if(route&&typeof navigateTo==="function")navigateTo(route)})})},refreshDashboard(){const stats=window.AppState?.statistics||{},workspace=window.AppState?.workspace||{},account=window.AuthState?.context||{};this.text("pfnTotalItems",stats.totalItems??0);this.text("pfnCompleted",stats.completedItems??0);this.text("pfnRemaining",stats.remainingItems??0);this.text("pfnAttentionRemaining",stats.remainingItems??0);this.text("pfnScans",stats.totalScans??0);this.text("pfnActiveAudits",Array.isArray(workspace.orderFiles)?workspace.orderFiles.length:0);this.text("pfnNeedsReview",this.needsReviewCount());this.text("pfnExpiryCount",this.expiryCount());this.text("pfnPharmacyName",account.pharmacy_name||"PharmFlow Dev");const greeting=document.getElementById("pfnGreeting");if(greeting){const h=new Date().getHours();greeting.textContent=h<12?"Good morning":h<18?"Good afternoon":"Good evening"}},needsReviewCount(){try{if(Array.isArray(window.NeedsReviewEngine?.items))return NeedsReviewEngine.items.length;return Number(window.AppState?.workspace?.needsReviewCount||0)}catch(_){return 0}},expiryCount(){try{if(Array.isArray(window.ExpiryCaptureEngine?.captures))return ExpiryCaptureEngine.captures.length}catch(_){}return 0},text(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value??"")}};
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

    clearTimeout(flashTimer);
    if(!card && !scanBox) return;

    card?.classList.remove("pfnLastScanFlashSuccess","pfnLastScanFlashError");
    scanBox?.classList.remove("pfnScanBoxFlashSuccess","pfnScanBoxFlashError");

    // Distinct frame keeps rapid back-to-back hardware scans visible.
    void (card||scanBox).offsetWidth;

    card?.classList.add(isSuccess?"pfnLastScanFlashSuccess":"pfnLastScanFlashError");
    scanBox?.classList.add(isSuccess?"pfnScanBoxFlashSuccess":"pfnScanBoxFlashError");

    flashTimer=setTimeout(()=>{
      card?.classList.remove("pfnLastScanFlashSuccess","pfnLastScanFlashError");
      scanBox?.classList.remove("pfnScanBoxFlashSuccess","pfnScanBoxFlashError");
    },300);
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
   B10-R1 RECEIVING WORKSPACE SHELL
   Presentation/navigation consolidation only.
   No receiving, GTIN, quantity, Supabase, sync or report logic changes.
============================================================= */
(function pharmFlowB10R1Workspace(){
  "use strict";
  let installed=false;
  let resultsMode="order";

  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const num=value=>Number.isFinite(Number(value))?Number(value):0;

  function removeBackdrop(id){ document.getElementById(id)?.remove(); }
  function makeBackdrop(id,onClose){
    removeBackdrop(id);
    const node=document.createElement("button");
    node.type="button";
    node.id=id;
    node.className="pfnR1Backdrop";
    node.setAttribute("aria-label","Close panel");
    node.addEventListener("click",onClose,{once:true});
    document.body.appendChild(node);
    return node;
  }

  function normalizeShell(){
    document.body.classList.add("pfnB10R1");
    const nav=document.querySelector(".sidebarNavigation");
    const dashboard=nav?.querySelector('[data-page="dashboard"]');
    const oldReceiving=nav?.querySelector('[data-page="receiving"]');
    const orders=nav?.querySelector('[data-page="files"]');
    if(dashboard){
      dashboard.classList.add("pfnPrimaryReceivingNav");
      const label=dashboard.querySelector("span:last-child");
      if(label) label.textContent="Receiving";
    }
    oldReceiving?.classList.add("pfnLegacyNavHidden");
    orders?.classList.add("pfnLegacyNavHidden");

    const subtitle=document.getElementById("pageSubtitle");
    if(subtitle && subtitle.textContent.trim()==="Receiving Dashboard") subtitle.textContent="Receiving Workspace";

    const scanPanel=document.querySelector("#page-dashboard .scanPanel");
    const scanTitle=scanPanel?.querySelector("h2");
    const scanHelp=scanPanel?.querySelector(".scanPanelHeader p");
    const input=document.getElementById("barcodeInput");
    if(scanTitle) scanTitle.textContent="Scan / Search";
    if(scanHelp) scanHelp.textContent="Scan Barcode / GS1 or search by Item Number / Item Name.";
    if(input) input.placeholder="SCAN BARCODE OR SEARCH ITEM";
  }

  function installScanSearchControl(){
    const scanBox=document.getElementById("scanBox");
    const legacy=document.getElementById("btnQuickSearch");
    if(!scanBox || !legacy || document.getElementById("pfnScanSearchButton")) return;
    legacy.classList.add("pfnSearchAnchorHidden");
    const button=document.createElement("button");
    button.id="pfnScanSearchButton";
    button.type="button";
    button.className="pfnScanSearchButton";
    button.innerHTML='<span aria-hidden="true">⌕</span><span>Search</span>';
    button.setAttribute("aria-label","Search by Item Number or Item Name");
    button.addEventListener("click",event=>{
      event.preventDefault();
      legacy.click();
    });
    scanBox.appendChild(button);
  }

  function openOrders(){
    const page=document.getElementById("page-files");
    if(!page) return;
    page.classList.add("pfnR1OrdersDrawerOpen");
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
    document.getElementById("page-files")?.classList.remove("pfnR1OrdersDrawerOpen");
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
    button.innerHTML='<span aria-hidden="true">▤</span> Manage Orders';
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

  function rowMarkup(item){
    const ordered=num(item?.orderedQty);
    const received=num(item?.receivedQty);
    const remaining=Math.max(0,num(item?.remainingQty ?? ordered-received));
    const order=(Array.isArray(item?.orderNumbers)&&item.orderNumbers.length?item.orderNumbers.join(", "):(item?.orderNumber||"—"));
    return `<article class="pfnR1ResultRow">
      <div class="pfnR1ResultIdentity"><strong>${esc(item?.itemName||item?.itemCode||"Item")}</strong><small>${esc(item?.itemCode||"—")} · Order ${esc(order)}</small></div>
      <div><span>Ordered</span><b>${ordered}</b></div>
      <div><span>Received</span><b>${received}</b></div>
      <div><span>Remaining</span><b>${remaining}</b></div>
      <div><span>Status</span><b>${esc(item?.status||"")}</b></div>
    </article>`;
  }

  function renderResults(mode){
    const panel=document.getElementById("pfnSmartResults");
    const body=document.getElementById("pfnSmartResultsBody");
    const title=document.getElementById("pfnSmartResultsTitle");
    if(!panel||!body||!title) return;
    resultsMode=mode;
    let rows=scopedItems();
    if(mode==="received") rows=rows.filter(item=>num(item?.receivedQty)>0);
    title.textContent=mode==="received"?"Received Items":"Order Items";
    body.innerHTML=rows.length?rows.map(rowMarkup).join(""):'<div class="pfnR1Empty">No matching items.</div>';
    panel.hidden=false;
    document.querySelectorAll("#scanPanelFooter .pfnR1ViewActive").forEach(el=>el.classList.remove("pfnR1ViewActive"));
    document.getElementById(mode==="received"?"btnReceivedItems":"btnOrderItemsPriority")?.classList.add("pfnR1ViewActive");
  }
  function closeResults(){
    const panel=document.getElementById("pfnSmartResults");
    if(panel) panel.hidden=true;
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
    panel.innerHTML=`<div class="pfnSmartResultsHead"><div><span>SMART RESULTS</span><h3 id="pfnSmartResultsTitle">Order Items</h3></div><button id="pfnCloseSmartResults" type="button" aria-label="Close results">✕</button></div><div id="pfnSmartResultsBody" class="pfnSmartResultsBody"></div>`;
    main.appendChild(panel);
    document.getElementById("pfnCloseSmartResults")?.addEventListener("click",closeResults);
  }

  function openReport(){
    const page=document.getElementById("page-receiving");
    if(!page) return;
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
    if(!document.getElementById("pfnReceivingReportButton")){
      const report=document.createElement("button");
      report.id="pfnReceivingReportButton";
      report.type="button";
      report.className="secondaryButton pfnR1ToolbarButton";
      report.textContent="Receiving Report";
      report.addEventListener("click",openReport);
      footer.appendChild(report);
    }
  }

  function wireExistingViews(){
    // Window capture runs before the legacy document capture handler.
    window.addEventListener("click",event=>{
      const received=event.target?.closest?.("#btnReceivedItems");
      if(received){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); renderResults("received"); return; }
      const order=event.target?.closest?.("#btnOrderItemsPriority");
      if(order){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); renderResults("order"); }
    },true);
  }

  function refreshOpenResults(){
    if(!document.getElementById("pfnSmartResults")?.hidden) renderResults(resultsMode);
  }

  function install(){
    if(installed) return;
    installed=true;
    normalizeShell();
    installManageOrders();
    installScanSearchControl();
    installToolbar();
    installSmartResults();
    wireExistingViews();

    if(window.AppEvents?.on){
      ["workspace:changed","receiving:updated","cloud:workspace-updated"].forEach(name=>{
        try{ AppEvents.on(name,refreshOpenResults); }catch(_){ }
      });
    }

    // Existing UI inserts Needs Review / Received Items / Order Items after load.
    // Re-run light shell setup without changing business handlers.
    const observer=new MutationObserver(()=>{
      installScanSearchControl();
      installToolbar();
    });
    const footer=document.querySelector("#page-dashboard .scanPanelFooter");
    if(footer) observer.observe(footer,{childList:true});
  }

  document.addEventListener("DOMContentLoaded",()=>setTimeout(install,100));
  if(document.readyState!=="loading") setTimeout(install,100);
})();
