"use strict";
(function(){
  const PF={version:"B10CLEAN2",flashTimer:0,ordersHost:null,ordersAnchor:null,initialized:false};
  function $(id){return document.getElementById(id)}
  function flash(kind){
    const panel=document.querySelector('#page-dashboard .scanPanel');
    const box=$('scanBox');
    const card=$('lastScanCard');
    if(!panel||!box||!card)return;
    clearTimeout(PF.flashTimer);
    panel.classList.remove('pfnScanSuccess','pfnScanError');
    box.classList.remove('pfnScanSuccess','pfnScanError');
    card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError');
    void panel.offsetWidth;
    panel.classList.add(kind==='success'?'pfnScanSuccess':'pfnScanError');
    box.classList.add(kind==='success'?'pfnScanSuccess':'pfnScanError');
    card.classList.add(kind==='success'?'pfnLastScanFlashSuccess':'pfnLastScanFlashError');
    PF.flashTimer=setTimeout(()=>{panel.classList.remove('pfnScanSuccess','pfnScanError');box.classList.remove('pfnScanSuccess','pfnScanError');card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError')},560);
  }
  function scannerTx(tx){const configured=String(window.APP_CONFIG?.transactionSources?.scanner||'SCANNER').toUpperCase();return String(tx?.source||'').toUpperCase()===configured}
  function installFlash(){
    if(window.AppEvents?.on){try{AppEvents.on('receiving:transaction',tx=>{if(scannerTx(tx))flash('success')})}catch(_){}}
    if(typeof window.showToast==='function'&&!window.showToast.__pfnCleanWrapped){const original=window.showToast;const wrapped=function(message,type,duration){try{if(PF.suppressPriorityToast)return; if(window.ScannerEngine?.processing===true&&(type==='error'||type==='warning'))flash('error')}catch(_){}return original.apply(this,arguments)};wrapped.__pfnCleanWrapped=true;window.showToast=wrapped}
  }
  function openOrders(){
    const page=$('page-files'); if(!page||$('pfnOrdersOverlay'))return;
    PF.ordersAnchor=document.createComment('pfn-orders-anchor'); page.parentNode.insertBefore(PF.ordersAnchor,page);
    const overlay=document.createElement('div');overlay.id='pfnOrdersOverlay';overlay.className='pfnCenterOverlay';
    overlay.innerHTML='<section class="pfnCenterModal pfnOrdersModal" role="dialog" aria-modal="true"><header class="pfnModalHeader"><div><span>ORDER MANAGEMENT</span><h2>Manage Orders</h2></div><button type="button" data-close>✕</button></header><div class="pfnModalBody"></div></section>';
    document.body.appendChild(overlay);overlay.querySelector('.pfnModalBody').appendChild(page);page.classList.add('active','pfnEmbeddedPage');page.hidden=false;
    const close=()=>closeOrders();overlay.querySelector('[data-close]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  }
  function closeOrders(){const overlay=$('pfnOrdersOverlay'),page=$('page-files');if(page&&PF.ordersAnchor?.parentNode){page.classList.remove('active','pfnEmbeddedPage');PF.ordersAnchor.parentNode.insertBefore(page,PF.ordersAnchor);PF.ordersAnchor.remove();PF.ordersAnchor=null}overlay?.remove();try{focusScannerInput?.()}catch(_){}}
  function bindSidebar(){
    const menu=$('btnMenu'), close=$('btnCloseSidebar'), sidebar=$('sidebar'), overlay=$('sidebarOverlay');
    if(!menu||!sidebar)return;
    const setCollapsed=(collapsed)=>{document.body.classList.toggle('pfnSidebarCollapsed',collapsed);menu.setAttribute('aria-expanded',String(!collapsed));try{localStorage.setItem('PHARMFLOW_SIDEBAR_COLLAPSED',collapsed?'1':'0')}catch(_){}};
    let remembered=false;try{remembered=localStorage.getItem('PHARMFLOW_SIDEBAR_COLLAPSED')==='1'}catch(_){}
    setCollapsed(remembered);
    menu.addEventListener('click',e=>{if(window.innerWidth>900){e.preventDefault();e.stopPropagation();setCollapsed(!document.body.classList.contains('pfnSidebarCollapsed'));}});
    close?.addEventListener('click',e=>{if(window.innerWidth>900){e.preventDefault();e.stopPropagation();setCollapsed(true);}});
    overlay?.addEventListener('click',()=>{if(window.innerWidth>900)setCollapsed(true)});
  }
  function bind(){
    $('pfnManageOrders')?.addEventListener('click',openOrders);
    $('btnReceivedItems')?.addEventListener('click',()=>window.openDashboardKpiPanel?.('received'));
    $('btnAdjustReceiving')?.addEventListener('click',()=>{const item=window.getCurrentLastScanItem?.(); if(item&&window.openQuantityEditPrompt){window.openQuantityEditPrompt(item);return;} window.openDashboardKpiPanel?.('received');});
    $('btnReceivingReportAction')?.addEventListener('click',()=>window.navigateTo?.('receiving'));
    $('btnExportReceivingAction')?.addEventListener('click',()=>window.navigateTo?.('receiving'));
    $('btnEmailReceivingAction')?.addEventListener('click',()=>{$('btnEmailReceivingDifferences')?.click()});
    bindSidebar();
  }
  function init(){if(PF.initialized)return;PF.initialized=true;document.body.classList.add('pfNextMode','pfnCleanReceiving');bind();installFlash()}
  document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
  window.PharmFlowNext=PF;
})();
