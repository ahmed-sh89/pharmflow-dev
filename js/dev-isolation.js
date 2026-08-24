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
