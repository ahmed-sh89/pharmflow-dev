"use strict";

/* =====================================================
   PHARMFLOW DEVELOPMENT ENVIRONMENT SAFETY BOUNDARY
   Repository: pharmflow-dev (B)

   This file MUST NOT be copied to Production repository A.
   It creates a client-side fail-closed boundary in addition
   to the existing Supabase tenant/RLS controls.
===================================================== */

const PHARMFLOW_DEV_ENV = Object.freeze({
    enabled:true,
    code:"DEV001",
    name:"PharmFlow Dev",
    pharmacyId:"ffcac9ca-dfca-4344-9490-a77dcdba9d01"
});

const PHARMFLOW_DEV_PRECONTEXT_RPC_ALLOW = new Set([
    "get_my_app_context",
    "get_my_pharmacy_registration"
]);

const PHARMFLOW_DEV_GLOBAL_WRITE_RPCS = new Set([
    "begin_global_master_gtin_import",
    "append_global_master_gtin_import",
    "commit_global_master_gtin_import",
    "delete_pharmacy_master_gtin"
]);

const PHARMFLOW_DEV_GLOBAL_READ_RPCS = new Set([
    "get_global_master_gtin_meta",
    "get_global_master_gtin_page"
]);

function pharmFlowDevContext(){
    return (typeof AuthState !== "undefined" && AuthState && AuthState.context) || null;
}

function pharmFlowDevTenantMatches(){
    const ctx=pharmFlowDevContext();
    return !!ctx && String(ctx.pharmacy_id||"").toLowerCase() === PHARMFLOW_DEV_ENV.pharmacyId;
}

function pharmFlowDevValidateAuthenticatedContext(context){
    const ctx=context || pharmFlowDevContext();

    if(!ctx || !ctx.pharmacy_id){
        return false;
    }

    return String(ctx.pharmacy_id||"").toLowerCase() ===
        String(PHARMFLOW_DEV_ENV.pharmacyId||"").toLowerCase();
}

function pharmFlowDevClearRuntimeForBlockedTenant(){
    try{
        if(typeof cancelPendingCloudWorkspaceSave==="function"){
            cancelPendingCloudWorkspaceSave();
        }
    }catch(_){}

    try{
        if(typeof AppState!=="undefined"){
            if(typeof createEmptyAccountContext==="function"){
                AppState.account=createEmptyAccountContext();
            }
            if(typeof createEmptyWorkspace==="function"){
                AppState.workspace=createEmptyWorkspace();
            }
            if(typeof createEmptySession==="function"){
                AppState.session=createEmptySession();
            }
            if(AppState.archive){
                AppState.archive.orders=[];
                AppState.archive.transactions=[];
            }
            resetStatistics?.();
            rebuildStateIndexes?.();
        }
    }catch(_){}
}

function pharmFlowDevEnsureAccessBlock(){
    let block=document.getElementById("devEnvironmentAccessBlock");
    if(block){ return block; }

    const gate=document.getElementById("authGate");
    const inner=gate?.querySelector?.(".authFormPanelInner");
    if(!inner){ return null; }

    block=document.createElement("div");
    block.id="devEnvironmentAccessBlock";
    block.hidden=true;
    block.innerHTML=
        '<span class="authEyebrow">DEVELOPMENT ENVIRONMENT</span>'+
        '<h2>DEV Safety Block</h2>'+
        '<p class="authLead">This site is isolated to <strong>PharmFlow Dev (DEV001)</strong>.</p>'+
        '<div class="authInfoBox">'+
            'The signed-in account belongs to another pharmacy. No Orders, Receiving, Archive, Expiry or other tenant data were loaded into this development workspace.'+
        '</div>'+
        '<button id="btnDevEnvironmentSignOut" class="authPrimaryButton" type="button">Sign out and use DEV001</button>';

    const authMessage=document.getElementById("authMessage");
    if(authMessage && authMessage.parentNode===inner){
        inner.insertBefore(block,authMessage);
    }else{
        inner.appendChild(block);
    }

    block.querySelector("#btnDevEnvironmentSignOut")?.addEventListener("click",()=>{
        if(typeof signOutCurrentUser==="function"){
            signOutCurrentUser();
        }
    });

    return block;
}

function pharmFlowDevRenderAccessBoundary(context){
    if(pharmFlowDevValidateAuthenticatedContext(context)){
        pharmFlowDevHideAccessBoundary();
        return false;
    }

    pharmFlowDevClearRuntimeForBlockedTenant();

    const overlay=document.getElementById("authGate");
    const forms=document.getElementById("authFormsPanel");
    const access=document.getElementById("authAccessPanel");
    const block=pharmFlowDevEnsureAccessBlock();

    document.body.classList.add("authLocked");
    if(overlay){ overlay.classList.add("visible"); }
    if(forms){ forms.hidden=true; }
    if(access){ access.hidden=true; }
    if(block){ block.hidden=false; }

    return true;
}

function pharmFlowDevHideAccessBoundary(){
    const block=document.getElementById("devEnvironmentAccessBlock");
    if(block){ block.hidden=true; }
}

function pharmFlowDevAssertTenant(operation="write"){
    const ctx=pharmFlowDevContext();
    if(!ctx || !ctx.pharmacy_id){
        throw new Error("DEV SAFETY BLOCK: PharmFlow Dev requires the DEV001 account before " + operation + ".");
    }
    if(!pharmFlowDevTenantMatches()){
        throw new Error(
            "DEV SAFETY BLOCK: This development site is locked to DEV001. " +
            "The signed-in pharmacy (" + (ctx.pharmacy_code || ctx.pharmacy_name || ctx.pharmacy_id) + ") cannot modify data here."
        );
    }
    return true;
}

function pharmFlowDevIsReadRpc(name){
    const n=String(name||"").toLowerCase();
    return PHARMFLOW_DEV_GLOBAL_READ_RPCS.has(n) ||
        n.startsWith("get_") ||
        n.startsWith("list_") ||
        n.startsWith("resolve_") ||
        n.startsWith("owner_list_") ||
        n.startsWith("is_");
}

function pharmFlowDevGuardAuthRpc(name){
    const n=String(name||"").toLowerCase();

    if(PHARMFLOW_DEV_GLOBAL_WRITE_RPCS.has(n)){
        throw new Error("DEV SAFETY BLOCK: Global GTIN is read-only in PharmFlow Dev.");
    }

    if(PHARMFLOW_DEV_PRECONTEXT_RPC_ALLOW.has(n)){
        return true;
    }

    if(pharmFlowDevIsReadRpc(n)){
        /* Reads remain available; Supabase RLS/RPC rules remain authoritative. */
        return true;
    }

    /* Every mutation is fail-closed unless the authenticated tenant is DEV001. */
    return pharmFlowDevAssertTenant("this operation");
}

(function installPharmFlowDevIsolation(){
    if(!PHARMFLOW_DEV_ENV.enabled){ return; }

    if(typeof authRpc === "function" && !authRpc.__pharmflowDevGuarded){
        const originalAuthRpc=authRpc;
        const guardedAuthRpc=async function(functionName,params={}){
            pharmFlowDevGuardAuthRpc(functionName);
            return originalAuthRpc(functionName,params);
        };
        guardedAuthRpc.__pharmflowDevGuarded=true;
        window.authRpc=guardedAuthRpc;
        authRpc=guardedAuthRpc;
    }

    if(typeof cloudRpc === "function" && !cloudRpc.__pharmflowDevGuarded){
        const originalCloudRpc=cloudRpc;
        const guardedCloudRpc=async function(functionName,params={}){
            const n=String(functionName||"").toLowerCase();
            if(n === "get_session_snapshot" || n === "pharmflow_is_session_ended"){
                return originalCloudRpc(functionName,params);
            }
            /* Legacy cloud-session writes are not tenant-scoped. They are deliberately
               disabled in B so development cannot mutate Production shared-session data. */
            throw new Error("DEV SAFETY BLOCK: Legacy shared-session writes are disabled in PharmFlow Dev.");
        };
        guardedCloudRpc.__pharmflowDevGuarded=true;
        window.cloudRpc=guardedCloudRpc;
        cloudRpc=guardedCloudRpc;
    }

    window.PHARMFLOW_DEV_ENV=PHARMFLOW_DEV_ENV;
    window.pharmFlowDevTenantMatches=pharmFlowDevTenantMatches;
    window.pharmFlowDevValidateAuthenticatedContext=pharmFlowDevValidateAuthenticatedContext;
    window.pharmFlowDevRenderAccessBoundary=pharmFlowDevRenderAccessBoundary;
    window.pharmFlowDevHideAccessBoundary=pharmFlowDevHideAccessBoundary;
    window.pharmFlowDevAssertTenant=pharmFlowDevAssertTenant;

    document.addEventListener("DOMContentLoaded",()=>{
        const updateButton=document.getElementById("btnUpdateMasterGTIN");
        if(updateButton){
            updateButton.disabled=true;
            updateButton.hidden=true;
            updateButton.title="Global GTIN is read-only in the development environment";
        }
        const fileInput=document.getElementById("masterGTINFileInput");
        if(fileInput){ fileInput.disabled=true; }
    });
})();
