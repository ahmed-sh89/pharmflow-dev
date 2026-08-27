"use strict";
(function(){
  const PF={version:"B10CLEAN1",flashTimer:0,ordersHost:null,ordersAnchor:null,initialized:false};
  function $(id){return document.getElementById(id)}
  function flash(kind){
    const panel=document.querySelector('#page-dashboard .scanPanel');
    const card=$('lastScanCard');
    if(!panel||!card)return;
    clearTimeout(PF.flashTimer);
    panel.classList.remove('pfnScanSuccess','pfnScanError');
    card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError');
    void panel.offsetWidth;
    panel.classList.add(kind==='success'?'pfnScanSuccess':'pfnScanError');
    card.classList.add(kind==='success'?'pfnLastScanFlashSuccess':'pfnLastScanFlashError');
    PF.flashTimer=setTimeout(()=>{panel.classList.remove('pfnScanSuccess','pfnScanError');card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError')},420);
  }
  function scannerTx(tx){const configured=String(window.APP_CONFIG?.transactionSources?.scanner||'SCANNER').toUpperCase();return String(tx?.source||'').toUpperCase()===configured}
  function installFlash(){
    if(window.AppEvents?.on){try{AppEvents.on('receiving:transaction',tx=>{if(scannerTx(tx))flash('success')})}catch(_){}}
    if(typeof window.showToast==='function'&&!window.showToast.__pfnCleanWrapped){const original=window.showToast;const wrapped=function(message,type,duration){try{if(window.ScannerEngine?.processing===true&&(type==='error'||type==='warning'))flash('error')}catch(_){}return original.apply(this,arguments)};wrapped.__pfnCleanWrapped=true;window.showToast=wrapped}
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
  function bind(){
    $('pfnManageOrders')?.addEventListener('click',openOrders);
    $('btnReceivedItems')?.addEventListener('click',()=>window.openDashboardKpiPanel?.('received'));
    $('btnAdjustReceiving')?.addEventListener('click',()=>window.openItemSearchModal?.());
    $('btnReceivingReportAction')?.addEventListener('click',()=>window.navigateTo?.('receiving'));
    $('btnExportReceivingAction')?.addEventListener('click',()=>window.navigateTo?.('receiving'));
    $('btnEmailReceivingAction')?.addEventListener('click',()=>{$('btnEmailReceivingDifferences')?.click()});
  }
  function init(){if(PF.initialized)return;PF.initialized=true;document.body.classList.add('pfNextMode','pfnCleanReceiving');bind();installFlash()}
  document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
  window.PharmFlowNext=PF;
})();
