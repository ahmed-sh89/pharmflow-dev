"use strict";
(function(){
  const PF={version:"B10CLEAN5",flashTimer:0,ordersAnchor:null,initialized:false,suppressPriorityToast:false,successOrders:new Set()};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

  function flash(kind){
    const card=$('lastScanCard');
    if(!card)return;

    /* Scan/Search feedback has one authoritative renderer in ui.js.  Keeping
       the field flash there prevents legacy child backgrounds and duplicate
       controllers from producing partial/competing visual states. */
    try{
      if(typeof window.triggerScanFieldFlash==='function'){
        window.triggerScanFieldFlash(kind==='success'?'success':'error');
      }
    }catch(_){}

    clearTimeout(PF.flashTimer);
    card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError');
    card.classList.add(kind==='success'?'pfnLastScanFlashSuccess':'pfnLastScanFlashError');
    PF.flashTimer=setTimeout(()=>{
      card.classList.remove('pfnLastScanFlashSuccess','pfnLastScanFlashError');
    },700);
  }

  function scannerTx(tx){
    const configured=String(window.APP_CONFIG?.transactionSources?.scanner||'SCANNER').toUpperCase();
    return String(tx?.source||'').toUpperCase()===configured;
  }

  async function maybeShowPerfectReceiving(tx){
    if(!scannerTx(tx))return;
    const selected=typeof getSelectedReceivingOrderNumbers==='function'?getSelectedReceivingOrderNumbers():[];
    if(selected.length!==1)return;
    const order=selected[0];
    const rows=typeof getPerOrderReceivingRows==='function'?getPerOrderReceivingRows(order):[];
    if(!rows.length)return;
    const exact=rows.every(row=>row.issueKey==='received_any' && Number(row['Ordered Qty']||0)===Number(row['Received Qty']||0));
    if(!exact){PF.successOrders.delete(order);return;}
    try{
      if(typeof nrV2List==='function'){
        const pending=await nrV2List('RECEIVING',null);
        if(Array.isArray(pending)&&pending.length)return;
      }
    }catch(_){return;}
    if(PF.successOrders.has(order))return;
    PF.successOrders.add(order);
    showPerfectReceivingOverlay(order);
  }

  function showPerfectReceivingOverlay(order){
    $('pfnReceivingSuccessOverlay')?.remove();
    const overlay=document.createElement('div');
    overlay.id='pfnReceivingSuccessOverlay';
    overlay.className='pfnReceivingSuccessOverlay';
    overlay.innerHTML=`<section class="pfnReceivingSuccessCard" role="dialog" aria-modal="true" aria-label="Receiving complete">
      <div class="pfnSuccessIcon">✓</div>
      <span class="pfnSuccessEyebrow">RECEIVING COMPLETE</span>
      <h2>Order matched successfully</h2>
      <strong>${esc(order)}</strong>
      <p>All ordered quantities have been received with no discrepancies or pending review items.</p>
      <div class="pfnSuccessActions"><button type="button" data-dashboard>Back to Dashboard</button><button type="button" class="primary" data-complete>Complete Receiving</button></div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-dashboard]').onclick=()=>{overlay.remove();focusScannerInput?.();};
    overlay.querySelector('[data-complete]').onclick=()=>{overlay.remove();requestFinalizeReceiving?.();};
  }

  function installFlash(){
    if(window.AppEvents?.on){
      try{AppEvents.on('receiving:transaction',tx=>{if(scannerTx(tx))flash('success');setTimeout(()=>maybeShowPerfectReceiving(tx),80);});}catch(_){}
    }
    if(typeof window.showToast==='function'&&!window.showToast.__pfnCleanWrapped){
      const original=window.showToast;
      const wrapped=function(message,type,duration){
        try{if(PF.suppressPriorityToast)return;if(window.ScannerEngine?.processing===true&&(type==='error'||type==='warning'))flash('error');}catch(_){}
        return original.apply(this,arguments);
      };
      wrapped.__pfnCleanWrapped=true;window.showToast=wrapped;
    }
  }

  function openOrders(){
    const page=$('page-files');if(!page||$('pfnOrdersOverlay'))return;
    PF.ordersAnchor=document.createComment('pfn-orders-anchor');page.parentNode.insertBefore(PF.ordersAnchor,page);
    const overlay=document.createElement('div');overlay.id='pfnOrdersOverlay';overlay.className='pfnCenterOverlay';
    overlay.innerHTML='<section class="pfnCenterModal pfnOrdersModal" role="dialog" aria-modal="true"><header class="pfnModalHeader"><div><span>ORDER MANAGEMENT</span><h2>Manage Orders</h2></div><button type="button" data-close>✕</button></header><div class="pfnModalBody"></div></section>';
    document.body.appendChild(overlay);overlay.querySelector('.pfnModalBody').appendChild(page);page.classList.add('active','pfnEmbeddedPage');page.hidden=false;
    overlay.querySelector('[data-close]').onclick=closeOrders;overlay.addEventListener('click',e=>{if(e.target===overlay)closeOrders();});
  }

  function closeOrders(){
    const overlay=$('pfnOrdersOverlay'),page=$('page-files');
    if(page&&PF.ordersAnchor?.parentNode){page.classList.remove('active','pfnEmbeddedPage');PF.ordersAnchor.parentNode.insertBefore(page,PF.ordersAnchor);PF.ordersAnchor.remove();PF.ordersAnchor=null;}
    overlay?.remove();try{focusScannerInput?.();}catch(_){}
  }

  function openAdjustReceiving(){
    $('pfnAdjustOverlay')?.remove();
    const overlay=document.createElement('div');overlay.id='pfnAdjustOverlay';overlay.className='pfnCenterOverlay pfnAdjustOverlay';
    overlay.innerHTML=`<section class="pfnCenterModal pfnAdjustModal" role="dialog" aria-modal="true" aria-label="Receiving adjustment">
      <header class="pfnModalHeader"><div><span>RECEIVING CORRECTION</span><h2>Adjust Received Quantity</h2></div><button type="button" data-close>✕</button></header>
      <div class="pfnAdjustBody">
        <label class="pfnAdjustSearchLabel">Find Item<input type="search" data-search placeholder="Search by Item Name, Item Number or GTIN" autocomplete="off"></label>
        <div class="pfnAdjustResults" data-results></div>
        <section class="pfnAdjustSelection" data-selection hidden>
          <div class="pfnAdjustItem"><span>SELECTED ITEM</span><strong data-name></strong><small data-meta></small></div>
          <div class="pfnAdjustCurrent"><span>Received — All Devices</span><strong data-current>0</strong></div>
          <label class="pfnAdjustQtyLabel">Receiving Adjustment</label>
          <div class="pfnAdjustStepper"><button type="button" data-minus>−</button><input type="number" min="0" step="1" inputmode="numeric" data-qty><button type="button" data-plus>+</button></div>
          <label class="pfnAdjustReason">Reason<select data-reason><option value="Correction">Correction</option><option value="Counting Error">Counting Error</option><option value="Other">Other</option></select></label>
          <div class="pfnAdjustActions"><button type="button" data-cancel>Cancel</button><button type="button" class="primary" data-save>Save Adjustment</button></div>
        </section>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    let selected=null;
    const search=overlay.querySelector('[data-search]'),results=overlay.querySelector('[data-results]'),selection=overlay.querySelector('[data-selection]'),qty=overlay.querySelector('[data-qty]');
    const close=()=>{overlay.remove();focusScannerInput?.();};
    overlay.querySelectorAll('[data-close],[data-cancel]').forEach(b=>b.onclick=close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    const items=()=>typeof getSearchableItems==='function'?getSearchableItems():(window.AppState?.workspace?.orderData||[]);
    const render=()=>{
      const q=String(search.value||'').trim().toLowerCase();if(!q){results.innerHTML='';return;}
      const matches=items().filter(item=>[item.itemName,item.itemCode,item.gtin,item.GTIN].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,8);
      results.innerHTML=matches.length?matches.map((item,i)=>`<button type="button" data-i="${i}"><span><strong>${esc(item.itemName)}</strong><small>Item ${esc(item.itemCode)}</small></span><b>Received ${Number(item.receivedQty||0)}</b></button>`).join(''):'<div class="pfnAdjustEmpty">No matching item.</div>';
      results.querySelectorAll('[data-i]').forEach(btn=>btn.onclick=()=>{
        selected=matches[Number(btn.dataset.i)];selection.hidden=false;results.innerHTML='';search.value='';
        overlay.querySelector('[data-name]').textContent=selected.itemName||'';overlay.querySelector('[data-meta]').textContent=`Item ${selected.itemCode||''} · Ordered ${Number(selected.orderedQty||0)}`;
        overlay.querySelector('[data-current]').textContent=String(Number(selected.receivedQty||0));qty.value=String(Number(selected.receivedQty||0));qty.focus();qty.select();
      });
    };
    search.oninput=render;
    overlay.querySelector('[data-minus]').onclick=()=>{qty.value=String(Math.max(0,Number(qty.value||0)-1));};
    overlay.querySelector('[data-plus]').onclick=()=>{qty.value=String(Math.max(0,Number(qty.value||0)+1));};
    overlay.querySelector('[data-save]').onclick=()=>{
      if(!selected)return;const target=Number(qty.value);if(!Number.isFinite(target)||target<0){showToast?.('Enter a valid quantity','warning');return;}
      const reason=overlay.querySelector('[data-reason]').value||'Correction';
      const tx=typeof setItemReceivedQuantity==='function'?setItemReceivedQuantity(selected.itemCode,target,reason):false;
      if(tx)close();
    };
    setTimeout(()=>search.focus(),30);
  }

  function bindSidebar(){
    const menu=$('btnMenu'),close=$('btnCloseSidebar'),sidebar=$('sidebar'),overlay=$('sidebarOverlay');if(!menu||!sidebar)return;
    const setCollapsed=collapsed=>{document.body.classList.toggle('pfnSidebarCollapsed',collapsed);menu.setAttribute('aria-expanded',String(!collapsed));try{localStorage.setItem('PHARMFLOW_SIDEBAR_COLLAPSED',collapsed?'1':'0');}catch(_){}};
    let remembered=false;try{remembered=localStorage.getItem('PHARMFLOW_SIDEBAR_COLLAPSED')==='1';}catch(_){}setCollapsed(remembered);
    menu.addEventListener('click',e=>{if(window.innerWidth>900){e.preventDefault();e.stopPropagation();setCollapsed(!document.body.classList.contains('pfnSidebarCollapsed'));}});
    close?.addEventListener('click',e=>{if(window.innerWidth>900){e.preventDefault();e.stopPropagation();setCollapsed(true);}});overlay?.addEventListener('click',()=>{if(window.innerWidth>900)setCollapsed(true);});
  }

  function bind(){
    $('pfnManageOrders')?.addEventListener('click',openOrders);
    $('btnReceivedItems')?.addEventListener('click',()=>window.openDashboardKpiPanel?.('received'));
    $('btnAdjustReceiving')?.addEventListener('click',openAdjustReceiving);
    $('btnReceivingReportAction')?.addEventListener('click',()=>{if(typeof window.navigateTo==='function'){window.navigateTo('receiving');return;}document.querySelector('.sidebarItem[data-page="receiving"]')?.click();});
    bindSidebar();
  }

  function init(){if(PF.initialized)return;PF.initialized=true;document.body.classList.add('pfNextMode','pfnCleanReceiving');bind();installFlash();}
  document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();
  window.PharmFlowNext=PF;
})();

/* =====================================================
   B11 CLEAN 17 — LEARNED GTIN LIFECYCLE V3
   Project B integration layer.
   - Active authority: pharmflow_pharmacy_gtin_v1 through V3 RPCs
   - Learned positive mappings are revalidated before every receive mutation
   - Receiving ledger payload carries exact mapping id/revision provenance
   - Correct/Remove use V3 preview + idempotent lifecycle operation ids
   - Global Master, auth, manifest and polling behavior are unchanged
===================================================== */
(function installLearnedGTINLifecycleV3(){
  "use strict";
  if(window.__PF_LEARNED_GTIN_V3__) return;
  window.__PF_LEARNED_GTIN_V3__=true;

  const authority=new Map();
  const operationIds=new Map();
  const upper=value=>String(value||"").trim().toUpperCase();
  const pid=()=>window.AuthState?.context?.pharmacy_id||"";
  const isLearned=record=>upper(record?.source)==="PHARMACY_LEARNED" || !!record?.mappingId;

  function secureUuid(){
    if(window.crypto?.randomUUID) return window.crypto.randomUUID();
    if(!window.crypto?.getRandomValues) throw new Error("Secure operation ID generation is unavailable");
    const bytes=new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6]=(bytes[6]&15)|64;
    bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  function normalizeRow(row,fallbackGTIN=""){
    if(!row?.item_code || !row?.mapping_id || !row?.mapping_revision) return null;
    const gtin=normalizeGTIN(row.gtin||fallbackGTIN);
    if(!gtin) return null;
    return {
      gtin,
      itemCode:normalizeItemCode(row.item_code),
      itemName:toSafeString(row.item_name||""),
      source:"PHARMACY_LEARNED",
      mappingId:String(row.mapping_id),
      mappingRevision:Number(row.mapping_revision),
      updatedAt:row.updated_at||null
    };
  }

  function cacheAuthority(record){
    if(!record?.gtin || !record?.itemCode || !record?.mappingId || !record?.mappingRevision) return null;
    authority.set(record.gtin,record);
    try{
      PharmFlowGTINScanCache.learnedMissUntil.delete(record.gtin);
      cacheGTINScanRecord(record.gtin,record);
    }catch(_){}
    return record;
  }

  function purgeLearned(gtin){
    const normalized=normalizeGTIN(gtin);
    if(!normalized) return;
    authority.delete(normalized);
    try{ purgePharmacyLearnedGTINFromWorkspace(normalized); }catch(_){}
    try{
      PharmFlowGTINScanCache.records.delete(normalized);
      PharmFlowGTINScanCache.learnedMissUntil.delete(normalized);
    }catch(_){}
  }

  async function resolveLearnedV3(gtin,options={}){
    const normalized=normalizeGTIN(gtin);
    if(!normalized || !pid() || typeof authRpc!=="function") return null;
    try{
      const rows=await authRpc("resolve_pharmacy_learned_gtin_v3",{
        p_pharmacy_id:pid(),
        p_gtin:normalized
      });
      const row=Array.isArray(rows)?rows[0]:rows;
      const record=normalizeRow(row,normalized);
      if(record) cacheAuthority(record);
      else purgeLearned(normalized);
      return record;
    }catch(error){
      Logger.warn("Learned GTIN V3 authority lookup failed",error);
      if(options.strict===true) throw error;
      return null;
    }
  }

  window.getPharmacyLearnedGTINRecord=resolveLearnedV3;

  const originalSaveLearned=window.savePharmacyLearnedGTIN;
  if(typeof originalSaveLearned==="function"){
    window.savePharmacyLearnedGTIN=async function(gtin,itemCode,itemName){
      const result=await originalSaveLearned(gtin,itemCode,itemName);
      const fresh=await resolveLearnedV3(gtin,{strict:true});
      if(!fresh) throw new Error("Learned GTIN was saved but authority could not be revalidated");
      purgeLearned(gtin);
      addMappingRecord({itemCode:fresh.itemCode,gtin:fresh.gtin,source:"PHARMACY_LEARNED"});
      cacheAuthority(fresh);
      return result;
    };
  }

  window.getMasterGTINRecordByGTIN=async function(gtin){
    const normalized=normalizeGTIN(gtin);
    if(!normalized) return null;

    const cached=PharmFlowGTINScanCache.records.get(normalized);
    if(cached && !isLearned(cached)) return cached;
    if(cached && isLearned(cached)){
      const fresh=await resolveLearnedV3(normalized,{strict:true});
      if(fresh) return fresh;
    }

    let globalRecord=null;
    try{ globalRecord=await getLocalGlobalMasterGTINRecord(normalized); }
    catch(error){ Logger.warn("Local Global GTIN lookup failed",error); }
    if(globalRecord){
      cacheGTINScanRecord(normalized,globalRecord);
      return globalRecord;
    }

    const isHandheld=typeof isLikelyZebraDevice==="function" && isLikelyZebraDevice();
    const missUntil=Number(PharmFlowGTINScanCache.learnedMissUntil.get(normalized)||0);
    if(!isHandheld && missUntil>Date.now()) return null;

    const learned=await resolveLearnedV3(normalized,{strict:true});
    if(learned) return learned;
    if(!isHandheld){
      PharmFlowGTINScanCache.learnedMissUntil.set(normalized,Date.now()+120000);
    }
    return null;
  };

  function learnedWorkspaceMapping(gtin){
    const normalized=normalizeGTIN(gtin);
    return (AppState?.workspace?.mappingData||[]).find(record=>
      normalizeGTIN(record?.gtin||"")===normalized && upper(record?.source)==="PHARMACY_LEARNED"
    )||null;
  }

  function provenance(record){
    if(!record?.mappingId || !record?.mappingRevision) return null;
    return {
      kind:"PHARMACY_LEARNED",
      mappingId:String(record.mappingId),
      mappingRevision:String(record.mappingRevision),
      normalizedGtin:normalizeGTIN(record.gtin),
      resolvedItemCode:normalizeItemCode(record.itemCode)
    };
  }

  window.receiveParsedBarcode=async function(parsed){
    if(!parsed?.gtin){ handleReceivingFailure("Barcode could not be identified"); return false; }
    if(AppState.workspace.orderData.length===0){ handleReceivingFailure("Load an order before receiving"); return false; }

    const gtin=normalizeGTIN(parsed.gtin);
    if(!gtin){ handleReceivingFailure("Barcode could not be identified"); return false; }

    try{
      const learnedLocal=learnedWorkspaceMapping(gtin);
      if(learnedLocal){
        const fresh=await resolveLearnedV3(gtin,{strict:true});
        if(fresh){
          purgeLearned(gtin);
          addMappingRecord({itemCode:fresh.itemCode,gtin,source:"PHARMACY_LEARNED"});
          cacheAuthority(fresh);
          const freshItem=getReceivingItemByItemCode(fresh.itemCode);
          if(freshItem){
            return receiveOrderItem({
              item:freshItem,
              quantity:getValidReceivingQuantity(parsed.quantity),
              gtin,
              lot:parsed.lot,
              expiry:parsed.expiry,
              serial:parsed.serial,
              source:APP_CONFIG.transactionSources.scanner,
              manual:false
            });
          }
          return await quickResolveUnrecognizedGTIN(parsed,fresh);
        }
        purgeLearned(gtin);
      }

      const current=resolveCurrentWorkspaceGTIN(gtin);
      if(current?.item){
        return receiveOrderItem({
          item:current.item,
          quantity:getValidReceivingQuantity(parsed.quantity),
          gtin,
          lot:parsed.lot,
          expiry:parsed.expiry,
          serial:parsed.serial,
          source:APP_CONFIG.transactionSources.scanner,
          manual:false
        });
      }

      const masterRecord=await getMasterGTINRecordByGTIN(gtin);
      if(!masterRecord?.itemCode) return await quickResolveUnrecognizedGTIN(parsed,null);

      const item=getReceivingItemByItemCode(masterRecord.itemCode);
      if(!item) return await quickResolveUnrecognizedGTIN(parsed,masterRecord);

      addMappingRecord({itemCode:item.itemCode,gtin,source:masterRecord.source||"MASTER"});
      if(isLearned(masterRecord)) cacheAuthority(masterRecord);
      return receiveOrderItem({
        item,
        quantity:getValidReceivingQuantity(parsed.quantity),
        gtin,
        lot:parsed.lot,
        expiry:parsed.expiry,
        serial:parsed.serial,
        source:APP_CONFIG.transactionSources.scanner,
        manual:false
      });
    }catch(error){
      Logger.warn("GTIN authority verification failed before receive",error);
      handleReceivingFailure("Unable to verify this GTIN. Check connection and scan again.");
      return false;
    }
  };

  window.createReceivingTransaction=function(options){
    const item=options.item;
    const transactionOrder=resolveReceivingTransactionOrder(item,options.targetOrder||"");
    const record=addReceivingTransaction({
      transactionId:options.transactionId||createTransactionId(),
      orderId:transactionOrder||AppState.workspace.orderId,
      selectedOrderNumber:transactionOrder,
      dateTime:nowISO(),
      itemCode:item.itemCode,
      itemName:item.itemName,
      gtin:options.gtin||"",
      quantity:options.quantity,
      lot:options.lot||"",
      expiry:options.expiry||"",
      serial:options.serial||"",
      source:options.source||APP_CONFIG.transactionSources.scanner,
      deviceId:(typeof ensureDeviceId==="function"?ensureDeviceId():AppState.session.deviceId),
      deviceType:getReceivingRuntimeDeviceType(),
      manual:options.manual===true,
      targetOrder:options.targetOrder||""
    });
    if(record && options.gtin){
      const learned=authority.get(normalizeGTIN(options.gtin));
      if(learned && normalizeItemCode(learned.itemCode)===normalizeItemCode(item?.itemCode)){
        record.gtinResolution=provenance(learned);
      }
    }
    return record;
  };

  const originalUploadCloud=window.uploadCloudReceivingTransaction;
  if(typeof originalUploadCloud==="function"){
    window.uploadCloudReceivingTransaction=async function(tx,pharmacyId){
      const p=tx?.gtinResolution;
      if(!p || p.kind!=="PHARMACY_LEARNED" || Number(tx?.quantity||0)<=0){
        return originalUploadCloud(tx,pharmacyId);
      }
      await authRpc("append_pharmflow_learned_transaction_v3",{
        p_pharmacy_id:pharmacyId,
        p_transaction_id:tx.transactionId,
        p_order_number:toSafeString(tx.selectedOrderNumber||tx.orderId||""),
        p_item_code:toSafeString(tx.itemCode||""),
        p_item_name:toSafeString(tx.itemName||""),
        p_gtin:toSafeString(tx.gtin||p.normalizedGtin||""),
        p_quantity:toNumber(tx.quantity,0),
        p_source:toSafeString(tx.source||"RECEIVING"),
        p_device_id:toSafeString(tx.deviceId||cloudWorkspaceDeviceId()),
        p_occurred_at:tx.dateTime||nowISO(),
        p_payload:tx,
        p_mapping_id:String(p.mappingId),
        p_mapping_revision:Number(p.mappingRevision)
      });
      const local=(AppState?.workspace?.receivingHistory||[]).find(row=>row.transactionId===tx.transactionId);
      if(local) local.cloudSynced=true;
      return tx.transactionId;
    };
  }

  async function previewLifecycle(gtin,action,newItemCode=null){
    const result=await authRpc("preview_pharmacy_learned_gtin_lifecycle_v3",{
      p_pharmacy_id:pid(),
      p_gtin:normalizeGTIN(gtin),
      p_action:action,
      p_new_item_code:newItemCode?normalizeItemCode(newItemCode):null
    });
    return Array.isArray(result)?result[0]:result;
  }

  function operationIdFor(key){
    if(operationIds.has(key)) return operationIds.get(key);
    const id=secureUuid();
    operationIds.set(key,id);
    return id;
  }

  function confirmLifecycleImpact(action,preview){
    return new Promise(resolve=>{
      document.getElementById("pfLifecycleV3Confirm")?.remove();
      const overlay=document.createElement("div");
      overlay.id="pfLifecycleV3Confirm";
      overlay.className="modalOverlay visible";
      overlay.setAttribute("aria-hidden","false");
      const provable=Number(preview?.provable?.quantity||0);
      const ambiguous=Number(preview?.ambiguous?.quantity||0);
      const compensated=Number(preview?.alreadyCompensated?.quantity||0);
      const eligible=Number(preview?.reallocation?.eligibleQuantity||0);
      const nonRealloc=Number(preview?.reallocation?.nonReallocatableQuantity||0);
      const title=action==="CORRECT"?"Confirm GTIN Correction":"Confirm GTIN Removal";
      const reallocation=action==="CORRECT"
        ? `<div><span>Eligible for same-order reallocation</span><strong>${eligible}</strong></div><div><span>Not reallocated</span><strong>${nonRealloc}</strong></div>`
        : "";
      overlay.innerHTML=`<div class="modalCard smallModal" role="dialog" aria-modal="true" aria-label="${title}"><div class="modalHeader"><h2>${title}</h2></div><div style="display:grid;gap:10px;margin:10px 0 18px"><div><span>Provable quantity to reverse</span><strong style="float:right">${provable}</strong></div><div><span>Ambiguous historical quantity — untouched</span><strong style="float:right">${ambiguous}</strong></div><div><span>Already compensated</span><strong style="float:right">${compensated}</strong></div>${reallocation}</div><p class="confirmMessage">Only transaction-attributable quantities will be changed. Global GTIN is not modified.</p><div class="modalFooter"><button class="secondaryButton" type="button" data-cancel>Cancel</button><button class="dangerButton" type="button" data-confirm>${action==="CORRECT"?"Confirm Correction":"Confirm Removal"}</button></div></div>`;
      document.body.appendChild(overlay);
      const finish=value=>{overlay.remove();resolve(value);};
      overlay.querySelector("[data-cancel]").onclick=()=>finish(false);
      overlay.querySelector("[data-confirm]").onclick=()=>finish(true);
      overlay.addEventListener("click",e=>{if(e.target===overlay) finish(false);});
    });
  }

  window.correctPharmacyLearnedGTIN=async function(gtin,itemCode,itemName,reason){
    const normalized=normalizeGTIN(gtin), code=normalizeItemCode(itemCode), name=toSafeString(itemName).trim(), why=toSafeString(reason).trim();
    if(!normalized||!code||!name||!why) throw new Error("GTIN, Item Code, Item Name and Reason are required");
    if(typeof isPharmacyAdmin==="function" && !isPharmacyAdmin()) throw new Error("Pharmacy ADMIN access is required");

    const preview=await previewLifecycle(normalized,"CORRECT",code);
    const mapping=preview?.mapping;
    if(!mapping?.id || !mapping?.revision) throw new Error("Current learned mapping could not be verified");
    if(!await confirmLifecycleImpact("CORRECT",preview)) return {cancelled:true};

    const key=`CORRECT|${mapping.id}|${mapping.revision}|${code}|${why}`;
    const result=await authRpc("correct_pharmacy_learned_gtin_v3",{
      p_pharmacy_id:pid(),
      p_operation_id:operationIdFor(key),
      p_gtin:normalized,
      p_expected_mapping_id:mapping.id,
      p_expected_mapping_revision:Number(mapping.revision),
      p_new_item_code:code,
      p_new_item_name:name,
      p_reason:why
    });
    purgeLearned(normalized);
    const fresh=await resolveLearnedV3(normalized,{strict:true});
    if(!fresh) throw new Error("Corrected learned mapping could not be reloaded");
    addMappingRecord({itemCode:fresh.itemCode,gtin:fresh.gtin,source:"PHARMACY_LEARNED"});
    cacheAuthority(fresh);
    return Array.isArray(result)?result[0]:result;
  };

  window.removePharmacyLearnedGTIN=async function(gtin,reason){
    const normalized=normalizeGTIN(gtin), why=toSafeString(reason).trim();
    if(!normalized||!why) throw new Error("GTIN and Reason are required");
    if(typeof isPharmacyAdmin==="function" && !isPharmacyAdmin()) throw new Error("Pharmacy ADMIN access is required");

    const preview=await previewLifecycle(normalized,"REMOVE",null);
    const mapping=preview?.mapping;
    if(!mapping?.id || !mapping?.revision) throw new Error("Current learned mapping could not be verified");
    if(!await confirmLifecycleImpact("REMOVE",preview)) return {cancelled:true};

    const key=`REMOVE|${mapping.id}|${mapping.revision}|${why}`;
    const result=await authRpc("remove_pharmacy_learned_gtin_v3",{
      p_pharmacy_id:pid(),
      p_operation_id:operationIdFor(key),
      p_gtin:normalized,
      p_expected_mapping_id:mapping.id,
      p_expected_mapping_revision:Number(mapping.revision),
      p_reason:why
    });
    purgeLearned(normalized);
    return Array.isArray(result)?result[0]:result;
  };

  window.PharmFlowLearnedGTINLifecycleV3={version:"B11C17",resolve:resolveLearnedV3,preview:previewLifecycle};
})();