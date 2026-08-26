"use strict";
const PharmFlowNext={version:"B10",initialized:false,init(){if(this.initialized)return;this.initialized=true;document.body.classList.add("pfNextMode");this.bindDashboardActions();this.refreshDashboard();if(window.AppEvents?.on){["workspace:changed","receiving:updated","archive:updated","route:changed","cloud:workspace-updated"].forEach(evt=>{try{AppEvents.on(evt,()=>this.refreshDashboard())}catch(_){}})}setInterval(()=>this.refreshDashboard(),5000)},bindDashboardActions(){document.querySelectorAll("[data-pfn-route]").forEach(button=>{button.addEventListener("click",()=>{const route=button.getAttribute("data-pfn-route");if(route&&typeof navigateTo==="function")navigateTo(route)})})},refreshDashboard(){const stats=window.AppState?.statistics||{},workspace=window.AppState?.workspace||{},account=window.AuthState?.context||{};this.text("pfnTotalItems",stats.totalItems??0);this.text("pfnCompleted",stats.completedItems??0);this.text("pfnRemaining",stats.remainingItems??0);this.text("pfnAttentionRemaining",stats.remainingItems??0);this.text("pfnScans",stats.totalScans??0);this.text("pfnActiveAudits",Array.isArray(workspace.orderFiles)?workspace.orderFiles.length:0);this.text("pfnNeedsReview",this.needsReviewCount());this.text("pfnExpiryCount",this.expiryCount());this.text("pfnPharmacyName",account.pharmacy_name||"PharmFlow Dev");const greeting=document.getElementById("pfnGreeting");if(greeting){const h=new Date().getHours();greeting.textContent=h<12?"Good morning":h<18?"Good afternoon":"Good evening"}},needsReviewCount(){try{if(Array.isArray(window.NeedsReviewEngine?.items))return NeedsReviewEngine.items.length;return Number(window.AppState?.workspace?.needsReviewCount||0)}catch(_){return 0}},expiryCount(){try{if(Array.isArray(window.ExpiryCaptureEngine?.captures))return ExpiryCaptureEngine.captures.length}catch(_){}return 0},text(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value??"")}};
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
   B10 UNIFIED RECEIVING WORKSPACE
   UI/navigation consolidation only. Existing receiving engines,
   transactions, GTIN, persistence, sync and reports remain authoritative.
============================================================= */
(function pharmFlowB10UnifiedReceiving(){
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let activeView="order";
  let installed=false;

  function items(){ return Array.isArray(window.AppState?.workspace?.orderData)?AppState.workspace.orderData:[]; }
  function activeOrders(){ try{return typeof getActiveReceivingOrderNumbers==="function"?getActiveReceivingOrderNumbers():[];}catch(_){return [];} }
  function itemOrders(item){ const a=Array.isArray(item?.orderNumbers)?item.orderNumbers:[]; return a.length?a.map(String):[String(item?.orderNumber||"")].filter(Boolean); }

  function normalizeNavigation(){
    const nav=document.querySelector('.sidebarNavigation'); if(!nav)return;
    nav.querySelector('[data-page="dashboard"]')?.remove();
    nav.querySelector('[data-page="files"]')?.remove();
    nav.querySelector('[data-page="reports"]')?.remove();
    nav.querySelector('[data-page="sessions"]')?.remove();
    nav.querySelector('[data-page="archive"]')?.remove();
    nav.querySelector('[data-page="returns"]')?.remove();
    const r=nav.querySelector('[data-page="receiving"]'); if(r)r.classList.add('active');
  }

  function makeManageDrawer(){
    if(document.getElementById('pfnManageOrdersDrawer'))return;
    const drawer=document.createElement('div'); drawer.id='pfnManageOrdersDrawer'; drawer.className='pfnManageDrawer';
    drawer.innerHTML='<div class="pfnManageBackdrop" data-close-manage></div><aside class="pfnManagePanel"><div class="pfnManageHead"><div><span>ACTIVE ORDERS</span><h2>Manage Orders</h2><p>Order files, GTIN health and active-order controls.</p></div><button type="button" data-close-manage aria-label="Close">✕</button></div><div id="pfnManageBody" class="pfnManageBody"></div></aside>';
    document.body.appendChild(drawer);
    drawer.querySelectorAll('[data-close-manage]').forEach(b=>b.addEventListener('click',()=>drawer.classList.remove('open')));
    const legacy=document.getElementById('page-files'); const body=drawer.querySelector('#pfnManageBody');
    if(legacy&&body){ while(legacy.firstChild)body.appendChild(legacy.firstChild); }
  }
  function openManage(){ document.getElementById('pfnManageOrdersDrawer')?.classList.add('open'); }

  function buildWorkspace(){
    const dash=document.getElementById('page-dashboard'); if(!dash||document.getElementById('pfnUnifiedToolbar'))return;
    dash.classList.add('pfnUnifiedReceiving');
    const stats=dash.querySelector('.statisticsGrid');
    const scan=dash.querySelector('.scanPanel'); const last=document.getElementById('lastScanCard');
    const progress=last?.nextElementSibling;
    const manage=document.createElement('section'); manage.className='pfnReceivingTopline'; manage.innerHTML='<div><span class="sectionEyebrow">RECEIVING WORKSPACE</span><h2>Active Orders</h2><p id="pfnActiveOrdersText">No active orders</p></div><button id="pfnManageOrders" class="primaryButton" type="button">Manage Orders</button>';
    dash.insertBefore(manage,stats||dash.firstChild); document.getElementById('pfnManageOrders')?.addEventListener('click',openManage);

    const scanTitle=scan?.querySelector('h2'); if(scanTitle)scanTitle.textContent='Scan / Search';
    const scanHelp=scan?.querySelector('.scanPanelHeader p'); if(scanHelp)scanHelp.textContent='Scan Barcode / GS1 or search by Item Number or Item Name.';
    const input=document.getElementById('barcodeInput'); if(input)input.placeholder='SCAN OR SEARCH ITEM';
    scan?.querySelector('.scanPanelFooter')?.classList.add('pfnLegacyQuickActions');

    const toolbar=document.createElement('section'); toolbar.id='pfnUnifiedToolbar'; toolbar.className='pfnUnifiedToolbar contentCard';
    toolbar.innerHTML=`<button type="button" data-view="needs">Needs Review <b id="pfnNeedsCount">0</b></button><button type="button" data-view="received">Received Items</button><button type="button" data-view="order" class="active">Order Items</button><button type="button" data-view="adjust">Adjust</button><button type="button" data-view="report">Receiving Report</button><div class="pfnExportWrap"><button type="button" id="pfnExportToggle">Export ▾</button><div id="pfnExportMenu" hidden><button data-export="excel">Excel</button><button data-export="pdf">PDF</button></div></div><button type="button" data-view="email">Email Differences</button>`;
    progress?.insertAdjacentElement('beforebegin',toolbar);
    const results=document.createElement('section'); results.id='pfnSmartResults'; results.className='contentCard pfnSmartResults'; toolbar.insertAdjacentElement('afterend',results);

    toolbar.addEventListener('click',e=>{ const b=e.target.closest('[data-view]'); if(b)activateView(b.dataset.view); });
    document.getElementById('pfnExportToggle')?.addEventListener('click',()=>{const m=document.getElementById('pfnExportMenu');if(m)m.hidden=!m.hidden;});
    toolbar.querySelector('[data-export="excel"]')?.addEventListener('click',()=>document.getElementById('btnExportReceivingSummaryExcel')?.click());
    toolbar.querySelector('[data-export="pdf"]')?.addEventListener('click',()=>document.getElementById('btnExportReceivingSummaryPDF')?.click());

    // Keep legacy quick-action controls available in source/DOM but remove duplicate entry points visually.
    const quick=document.querySelector('.pfnLegacyQuickActions'); if(quick)quick.hidden=true;
    activateView('order');
  }

  function setToolbar(view){ document.querySelectorAll('#pfnUnifiedToolbar [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); }
  function activateView(view){
    if(view==='needs'){ try{openNeedsReviewPanel('RECEIVING');}catch(_){} return; }
    if(view==='email'){ document.getElementById('btnEmailReceivingDifferences')?.click(); return; }
    if(view==='adjust'){ openAdjustPicker(); return; }
    activeView=view; setToolbar(view);
    if(view==='report')renderReport(); else if(view==='received')renderReceived(); else renderOrderItems();
  }

  function orderFilterOptions(){ return ['ALL',...activeOrders()].map(v=>`<option value="${esc(v)}">${v==='ALL'?'All Orders':esc(v)}</option>`).join(''); }
  function baseResultsShell(title,sub,extra=''){
    const box=document.getElementById('pfnSmartResults'); if(!box)return null;
    box.innerHTML=`<div class="pfnResultsHead"><div><span class="sectionEyebrow">SMART RESULTS</span><h3>${esc(title)}</h3><p>${esc(sub)}</p></div></div>${extra}<div id="pfnResultsBody"></div>`; return box;
  }
  function renderOrderItems(){
    const box=baseResultsShell('Order Items','Professional receiving worklist. Filters affect display only.',`<div class="pfnContextFilters"><label>Order<select id="pfnWorkOrder">${orderFilterOptions()}</select></label><label>Priority<select id="pfnWorkPriority"><option value="all">All Items</option><option value="new">New Items</option><option value="short">Short Items</option></select></label><label>Quantity Sort<select id="pfnWorkSort"><option value="default">Default / Order Sequence</option><option value="high">Highest → Lowest</option><option value="low">Lowest → Highest</option></select></label><label class="pfnSearchFilter">Search<input id="pfnWorkSearch" type="search" placeholder="Item Name / Number"></label></div>`); if(!box)return;
    ['pfnWorkOrder','pfnWorkPriority','pfnWorkSort'].forEach(id=>document.getElementById(id)?.addEventListener('change',drawOrderRows)); document.getElementById('pfnWorkSearch')?.addEventListener('input',drawOrderRows); drawOrderRows();
  }
  function drawOrderRows(){
    const body=document.getElementById('pfnResultsBody'); if(!body)return;
    const order=document.getElementById('pfnWorkOrder')?.value||'ALL', priority=document.getElementById('pfnWorkPriority')?.value||'all', sort=document.getElementById('pfnWorkSort')?.value||'default', q=(document.getElementById('pfnWorkSearch')?.value||'').trim().toLowerCase();
    let rows=items().map((item,index)=>({item,index})).filter(({item})=>order==='ALL'||itemOrders(item).includes(order)).filter(({item})=>!q||String(item.itemName||'').toLowerCase().includes(q)||String(item.itemCode||'').toLowerCase().includes(q));
    const kind=item=>{const o=Number(item.orderedQty||0),r=Number(item.receivedQty||0);if(r===0&&o>0)return'new';if(r>0&&r<o)return'short';return'';};
    if(priority!=='all')rows=rows.filter(({item})=>kind(item)===priority); if(sort==='high')rows.sort((a,b)=>Number(b.item.orderedQty||0)-Number(a.item.orderedQty||0)); if(sort==='low')rows.sort((a,b)=>Number(a.item.orderedQty||0)-Number(b.item.orderedQty||0));
    body.innerHTML=rows.length?`<div class="pfnWorklist">${rows.map(({item})=>{const k=kind(item),ord=itemOrders(item).join(', ')||'—';return `<article class="pfnWorkRow"><div class="pfnWorkIdentity"><strong>${esc(item.itemName||item.itemCode)}</strong>${k?`<span class="pfnBadge ${k}">${k.toUpperCase()}</span>`:''}<small>Item ${esc(item.itemCode)} · Order ${esc(ord)}</small></div><div><span>Ordered</span><b>${Number(item.orderedQty||0)}</b></div><div><span>Received</span><b>${Number(item.receivedQty||0)}</b></div><div><span>Remaining</span><b>${Math.max(0,Number(item.orderedQty||0)-Number(item.receivedQty||0))}</b></div><div><span>Status</span><b>${esc(item.status||'')}</b></div></article>`;}).join('')}</div>`:'<div class="tableEmptyState">No items match the selected filters.</div>';
  }
  function renderReceived(){
    const box=baseResultsShell('Received Items','Items with any received quantity.',`<div class="pfnContextFilters"><label>Order<select id="pfnReceivedOrder">${orderFilterOptions()}</select></label><label class="pfnSearchFilter">Search<input id="pfnReceivedSearch" type="search" placeholder="Item Name / Number"></label></div>`); if(!box)return;
    const draw=()=>{const body=document.getElementById('pfnResultsBody'),o=document.getElementById('pfnReceivedOrder')?.value||'ALL',q=(document.getElementById('pfnReceivedSearch')?.value||'').toLowerCase();const rows=items().filter(i=>Number(i.receivedQty||0)>0&&(o==='ALL'||itemOrders(i).includes(o))&&(!q||String(i.itemName||'').toLowerCase().includes(q)||String(i.itemCode||'').toLowerCase().includes(q)));body.innerHTML=rows.length?`<div class="pfnWorklist">${rows.map(i=>`<article class="pfnWorkRow"><div class="pfnWorkIdentity"><strong>${esc(i.itemName||i.itemCode)}</strong><small>${esc(i.itemCode)}</small></div><div><span>Ordered</span><b>${Number(i.orderedQty||0)}</b></div><div><span>Received</span><b>${Number(i.receivedQty||0)}</b></div><div><span>Remaining</span><b>${Math.max(0,Number(i.orderedQty||0)-Number(i.receivedQty||0))}</b></div><div><span>Status</span><b>${esc(i.status||'')}</b></div></article>`).join('')}</div>`:'<div class="tableEmptyState">No received items.</div>';};
    document.getElementById('pfnReceivedOrder')?.addEventListener('change',draw);document.getElementById('pfnReceivedSearch')?.addEventListener('input',draw);draw();
  }
  function renderReport(){
    const box=document.getElementById('pfnSmartResults'); const page=document.getElementById('page-receiving'); if(!box||!page)return;
    box.innerHTML=''; const card=page.querySelector('.contentCard'); if(card){card.classList.add('pfnEmbeddedReport');box.appendChild(card);try{refreshReceivingTable?.();}catch(_){}}
  }
  function openAdjustPicker(){
    document.getElementById('pfnAdjustOverlay')?.remove(); const ov=document.createElement('div');ov.id='pfnAdjustOverlay';ov.className='quickKpiOverlay';ov.innerHTML='<div class="quickKpiPanel pfnAdjustPanel"><div class="quickKpiHeader"><div><h3>Adjust Receiving Quantity</h3><p>Uses the existing authoritative receiving adjustment transaction.</p></div><button data-close>✕</button></div><input id="pfnAdjustSearch" class="phase263Search" type="search" placeholder="Find Item Name / Item Number"><div id="pfnAdjustRows" class="pfnAdjustRows"></div></div>';document.body.appendChild(ov);ov.querySelector('[data-close]').onclick=()=>ov.remove();ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    const draw=()=>{const q=(ov.querySelector('#pfnAdjustSearch').value||'').toLowerCase(),rows=items().filter(i=>!q||String(i.itemName||'').toLowerCase().includes(q)||String(i.itemCode||'').toLowerCase().includes(q)).slice(0,50);ov.querySelector('#pfnAdjustRows').innerHTML=rows.map(i=>`<button type="button" data-code="${esc(i.itemCode)}"><span><b>${esc(i.itemName||i.itemCode)}</b><small>${esc(i.itemCode)}</small></span><strong>${Number(i.receivedQty||0)}</strong></button>`).join('')||'<div class="tableEmptyState">No matching items.</div>';ov.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>{const item=typeof getItemByCode==='function'?getItemByCode(b.dataset.code):items().find(i=>String(i.itemCode)===b.dataset.code);ov.remove();if(item)openQuantityEditPrompt(item);});};ov.querySelector('#pfnAdjustSearch').addEventListener('input',draw);draw();setTimeout(()=>ov.querySelector('#pfnAdjustSearch')?.focus(),20);
  }
  function refreshMeta(){ const a=activeOrders(); const t=document.getElementById('pfnActiveOrdersText');if(t)t.textContent=a.length?`${a.length} active order${a.length===1?'':'s'} · ${a.join(', ')}`:'No active orders'; const n=document.getElementById('pfnNeedsCount');if(n){let c=0;try{c=Array.isArray(window.NeedsReviewEngine?.items)?NeedsReviewEngine.items.length:Number(AppState?.workspace?.needsReviewCount||0);}catch(_){}n.textContent=String(c);} if(activeView==='order')drawOrderRows(); if(activeView==='received')renderReceived(); }
  function install(){ if(installed)return;installed=true; normalizeNavigation();makeManageDrawer();buildWorkspace(); if(typeof navigateTo==='function')navigateTo('dashboard',{save:false}); if(window.AppEvents?.on)['workspace:changed','receiving:updated','cloud:workspace-updated'].forEach(e=>{try{AppEvents.on(e,refreshMeta)}catch(_){}});refreshMeta(); }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50)); if(document.readyState!=='loading')setTimeout(install,50);
})();
