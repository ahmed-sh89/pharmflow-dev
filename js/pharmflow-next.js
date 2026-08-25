"use strict";
const PharmFlowNext={version:"B9",initialized:false,init(){if(this.initialized)return;this.initialized=true;document.body.classList.add("pfNextMode");this.bindDashboardActions();this.refreshDashboard();if(window.AppEvents?.on){["workspace:changed","receiving:updated","archive:updated","route:changed","cloud:workspace-updated"].forEach(evt=>{try{AppEvents.on(evt,()=>this.refreshDashboard())}catch(_){}})}setInterval(()=>this.refreshDashboard(),5000)},bindDashboardActions(){document.querySelectorAll("[data-pfn-route]").forEach(button=>{button.addEventListener("click",()=>{const route=button.getAttribute("data-pfn-route");if(route&&typeof navigateTo==="function")navigateTo(route)})})},refreshDashboard(){const stats=window.AppState?.statistics||{},workspace=window.AppState?.workspace||{},account=window.AuthState?.context||{};this.text("pfnTotalItems",stats.totalItems??0);this.text("pfnCompleted",stats.completedItems??0);this.text("pfnRemaining",stats.remainingItems??0);this.text("pfnAttentionRemaining",stats.remainingItems??0);this.text("pfnScans",stats.totalScans??0);this.text("pfnActiveAudits",Array.isArray(workspace.orderFiles)?workspace.orderFiles.length:0);this.text("pfnNeedsReview",this.needsReviewCount());this.text("pfnExpiryCount",this.expiryCount());this.text("pfnPharmacyName",account.pharmacy_name||"PharmFlow Dev");const greeting=document.getElementById("pfnGreeting");if(greeting){const h=new Date().getHours();greeting.textContent=h<12?"Good morning":h<18?"Good afternoon":"Good evening"}},needsReviewCount(){try{if(Array.isArray(window.NeedsReviewEngine?.items))return NeedsReviewEngine.items.length;return Number(window.AppState?.workspace?.needsReviewCount||0)}catch(_){return 0}},expiryCount(){try{if(Array.isArray(window.ExpiryCaptureEngine?.captures))return ExpiryCaptureEngine.captures.length}catch(_){}return 0},text(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value??"")}};
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

    clearTimeout(flashTimer);

    if(!card){
      return;
    }

    card.classList.remove(
      "pfnLastScanFlashSuccess",
      "pfnLastScanFlashError"
    );

    // Force a distinct frame so back-to-back hardware scans remain visible.
    void card.offsetWidth;

    card.classList.add(
      isSuccess
        ? "pfnLastScanFlashSuccess"
        : "pfnLastScanFlashError"
    );

    flashTimer=setTimeout(()=>{
      card.classList.remove(
        "pfnLastScanFlashSuccess",
        "pfnLastScanFlashError"
      );
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
