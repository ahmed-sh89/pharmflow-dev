"use strict";
const PharmFlowData={
  version:"B1",backend:"supabase",
  environment(){return window.PHARMFLOW_DEV_ENV?.enabled?"development":"production"},
  pharmacyId(){return String(window.AuthState?.context?.pharmacy_id||window.AppState?.account?.pharmacyId||"")},
  guardWrite(operation="write"){if(typeof window.pharmFlowDevAssertTenant==="function"){return window.pharmFlowDevAssertTenant(`data-layer:${operation}`)===true}return true},
  cache:{prefix:"pharmflow.next.cache.",get(key,fallback=null){try{const raw=localStorage.getItem(this.prefix+key);return raw===null?fallback:JSON.parse(raw)}catch(_){return fallback}},set(key,value){try{localStorage.setItem(this.prefix+key,JSON.stringify(value));return true}catch(_){return false}},remove(key){try{localStorage.removeItem(this.prefix+key);return true}catch(_){return false}}},
  receiving:{async getCurrent(){return window.AppState?.workspace||null}},
  expiry:{async getCurrentCaptures(){return window.ExpiryCaptureEngine?.captures||[]}},
  gtin:{lookup(gtin){if(typeof window.lookupGlobalGTIN==="function")return window.lookupGlobalGTIN(gtin);return null}},
  movement:{async query(){return []}}
};
window.PharmFlowData=PharmFlowData;

/* B10 Clean23.1 — authoritative receiving recovery/root fix.
   Compatibility Cloud Workspace may restore order structure, but it must never
   supply Receiving history. Startup completes one bounded authoritative ledger
   bootstrap before it returns to app startup. Delta sync remains responsible
   for later rows, preserving the Clean14+ egress reduction. */
(function installAuthoritativeReceivingBootstrap(){
  if(window.__pfAuthoritativeReceivingBootstrapInstalled) return;
  window.__pfAuthoritativeReceivingBootstrapInstalled=true;

  if(typeof window.restoreCompatibilityWorkspaceState==="function"){
    window.restoreCompatibilityWorkspaceState=function(cloudState){
      const authoritativeHistory=typeof deepClone==="function"
        ? deepClone(window.AppState?.workspace?.receivingHistory||[])
        : [...(window.AppState?.workspace?.receivingHistory||[])];
      const restored=window.restoreWorkspaceState(cloudState);
      if(!restored) return restored;
      window.AppState.workspace.receivingHistory=authoritativeHistory;
      window.rebuildStateIndexes?.();
      window.rebuildReceivingQuantitiesFromLedger?.();
      window.recalculateStatistics?.();
      return true;
    };
  }

  async function authoritativeReceivingBootstrap(){
    const pharmacyId=String(window.AuthState?.context?.pharmacy_id||"");
    if(!pharmacyId || typeof window.authRpc!=="function") return false;
    const rows=await window.authRpc("list_pharmflow_cloud_transactions_v2",{
      p_pharmacy_id:pharmacyId,
      p_limit:10000
    });
    const batch=Array.isArray(rows)?rows:[];
    window.mergeCloudReceivingLedger?.(batch);
    window.rebuildStateIndexes?.();
    window.rebuildReceivingQuantitiesFromLedger?.();
    window.recalculateStatistics?.();
    window.saveWorkspaceSnapshot?.();
    window.refreshEntireUI?.();
    return true;
  }
  window.authoritativeReceivingBootstrap=authoritativeReceivingBootstrap;

  if(typeof window.restoreCloudWorkspaceOnLogin==="function"){
    const originalRestoreCloudWorkspaceOnLogin=window.restoreCloudWorkspaceOnLogin;
    window.restoreCloudWorkspaceOnLogin=async function(...args){
      const result=await originalRestoreCloudWorkspaceOnLogin.apply(this,args);
      if(result===true){
        try{ await authoritativeReceivingBootstrap(); }
        catch(error){
          console.error("Authoritative receiving bootstrap failed",error);
          return false;
        }
      }
      return result;
    };
  }
})();
