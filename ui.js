Warning: truncated output (original token count: 71448)
Total output lines: 9141

"use strict";

/* =====================================================
   PHARMACY RECEIVING SYSTEM V3
   SMART UI ENGINE
===================================================== */

const UI = {

    initialized:false,

    elements:{},

    confirmCallback:null,

    searchResults:[],

    reportSearchResults:[],

    receivingFilters:{
        issues:new Set(["not_received","partial","received_any","over","manual"]),
        category:"all",
        search:""
    },

    smartScan:{
        container:null,
        results:null,
        selectedItem:null,
        quantity:1
    }

};


/* =====================================================
   CACHE ELEMENTS
===================================================== */

function cacheUIElements(){

    UI.elements = {

        pageTitle:
            document.getElementById("pageTitle"),

        pageSubtitle:
            document.getElementById("pageSubtitle"),

        headerOrderId:
            document.getElementById("headerOrderId"),

        headerSessionId:
            document.getElementById("headerSessionId"),

        systemStatus:
            document.getElementById("systemStatus"),

        barcodeInput:
            document.getElementById("barcodeInput"),

        scanBox:
            document.getElementById("scanBox"),

        scanStatusBadge:
            document.getElementById("scanStatusBadge"),

        statTotalItems:
            document.getElementById("statTotalItems"),

        statCompleted:
            document.getElementById("statCompleted"),

        statRemainingItems:
            document.getElementById("statRemainingItems"),

        statRemaining:
            document.getElementById("statRemaining"),

        statOver:
            document.getElementById("statOver"),

        statManual:
            document.getElementById("statManual"),

        statScans:
            document.getElementById("statScans"),

        progressBar:
            document.getElementById("progressBar"),

        progressLabel:
            document.getElementById("progressLabel"),

        progressCompletedText:
            document.getElementById("progressCompletedText"),

        progressRemainingText:
            document.getElementById("progressRemainingText"),

        lastScanCard:
            document.getElementById("lastScanCard"),

        lastItemName:
            document.getElementById("lastItemName"),

        lastItemCode:
            document.getElementById("lastItemCode"),

        lastGTIN:
            document.getElementById("lastGTIN"),

        lastOrderedQty:
            document.getElementById("lastOrderedQty"),

        lastReceivedQty:
            document.getElementById("lastReceivedQty"),

        lastRemainingQty:
            document.getElementById("lastRemainingQty"),

        lastItemStatus:
            document.getElementById("lastItemStatus"),

        lastScanTime:
            document.getElementById("lastScanTime"),

        receivingTableBody:
            document.getElementById("receivingTableBody"),

        receivingIssueFilter:
            document.getElementById("receivingIssueFilter"),

        receivingCategoryFilter:
            document.getElementById("receivingCategoryFilter"),

        archiveTableBody:
            document.getElementById("archiveTableBody"),

        itemReportTableBody:
            document.getElementById("itemReportTableBody"),

        orderFilesList:
            document.getElementById("orderFilesList"),

        mappingFilesList:
            document.getElementById("mappingFilesList"),

        masterGTINStatus:
            document.getElementById("masterGTINStatus"),

        masterGTINItemCount:
            document.getElementById("masterGTINItemCount"),

        masterGTINMatchedCount:
            document.getElementById("masterGTINMatchedCount"),

        masterGTINUpdatedAt:
            document.getElementById("masterGTINUpdatedAt"),

        masterGTINNotice:
            document.getElementById("masterGTINNotice"),

        healthOrderItems:
            document.getElementById("healthOrderItems"),

        healthMappings:
            document.getElementById("healthMappings"),

        healthMissingBarcode:
            document.getElementById("healthMissingBarcode"),

        healthDuplicateGTIN:
            document.getElementById("healthDuplicateGTIN"),

        sessionPageId:
            document.getElementById("sessionPageId"),

        sessionDeviceId:
            document.getElementById("sessionDeviceId"),

        sessionQueueCount:
            document.getElementById("sessionQueueCount"),

        sessionLastSave:
            document.getElementById("sessionLastSave"),

        archiveOrderCount:
            document.getElementById("archiveOrderCount"),

        archiveTransactionCount:
            document.getElementById("archiveTransactionCount"),

        searchModal:
            document.getElementById("searchModal"),

        globalSearchInput:
            document.getElementById("globalSearchInput"),

        globalSearchResults:
            document.getElementById("globalSearchResults"),

        manualItemModal:
            document.getElementById("manualItemModal"),

        manualItemCode:
            document.getElementById("manualItemCode"),

        manualItemName:
            document.getElementById("manualItemName"),

        manualItemQuantity:
            document.getElementById("manualItemQuantity"),

        confirmModal:
            document.getElementById("confirmModal"),

        confirmTitle:
            document.getElementById("confirmTitle"),

        confirmMessage:
            document.getElementById("confirmMessage"),

        toastContainer:
            document.getElementById("toastContainer"),

        loadingOverlay:
            document.getElementById("loadingOverlay"),

        loadingText:
            document.getElementById("loadingText"),

        reportItemSearch:
            document.getElementById("reportItemSearch"),

        reportItemResults:
            document.getElementById("reportItemResults"),

        reportSelectedItem:
            document.getElementById("reportSelectedItem"),

        reportSelectedCode:
            document.getElementById("reportSelectedCode"),

        reportTotalReceived:
            document.getElementById("reportTotalReceived"),

        reportOrderCount:
            document.getElementById("reportOrderCount")

    };

}


/* =====================================================
   INITIALIZE UI
===================================================== */

function initializeUI(){

    if(UI.initialized){
        return;
    }

    cacheUIElements();

    createSmartScanSearchUI();

    initializeZebraInterface();

    moveLastScanBelowScanBox();

    createProfessionalLastScanLayout();

    createLastScanQuantityControls();

    bindDashboardStatDrilldowns();

    createOrderStatusReportButton();

    bindUIEvents();

    bindUIStateEvents();

    refreshEntireUI();

    UI.initialized = true;

    Logger.info(
        "Smart UI initialized"
    );

}


/* =====================================================
   CREATE SMART SCAN SEARCH AREA
===================================================== */

function createSmartScanSearchUI(){

    const scanPanel =
        document.querySelector(
            ".scanPanel"
        );

    const scanBox =
        UI.elements.scanBox;

    if(
        !scanPanel ||
        !scanBox
    ){
        return;
    }

    if(
        document.getElementById(
            "smartScanSearchArea"
        )
    ){
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "smartScanSearchArea";

    wrapper.className =
        "smartScanSearchArea";

    wrapper.innerHTML = `

        <div
            id="smartScanResults"
            class="smartScanResults"
        ></div>

        <div
            id="smartScanSelected"
            class="smartScanSelected hidden"
        >

            <div class="smartSelectedMain">

                <div>

                    <span class="sectionEyebrow">
                        SELECTED ITEM
                    </span>

                    <h3 id="smartSelectedName">
                        -
                    </h3>

                    <div class="smartSelectedCode">
                        Item Number:
                        <strong id="smartSelectedCode">
                            -
                        </strong>
                    </div>

                </div>

                <button
                    id="btnCloseSmartSelection"
                    type="button"
                    class="iconButton"
                >
                    ✕
                </button>

            </div>

            <div class="smartSelectedStats">

                <div>
                    <span>Ordered</span>
                    <strong id="smartSelectedOrdered">0</strong>
                </div>

                <div>
                    <span>Received</span>
                    <strong id="smartSelectedReceived">0</strong>
                </div>

                <div>
                    <span>Remaining</span>
                    <strong id="smartSelectedRemaining">0</strong>
                </div>

            </div>

            <div class="smartQuantityRow">

                <span class="smartQuantityLabel">
                    Quantity
                </span>

                <div class="smartQuantityControl">

                    <button
                        id="btnSmartQtyMinus"
                        type="button"
                        class="quantityButton"
                    >
                        −
                    </button>

                    <input
                        id="smartQuantityInput"
                        type="number"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        step="1"
                        value="1"
                    >

                    <button
                        id="btnSmartQtyPlus"
                        type="button"
                        class="quantityButton"
                    >
                        +
                    </button>

                </div>

                <button
                    id="btnAddSmartQuantity"
                    type="button"
                    class="primaryButton"
                >
                    Add Quantity
                </button>

            </div>

        </div>

    `;

    scanBox.insertAdjacentElement(
        "afterend",
        wrapper
    );

    UI.smartScan.container =
        wrapper;

    UI.smartScan.results =
        document.getElementById(
            "smartScanResults"
        );

    bindSmartScanSelectionControls();

}


/* =====================================================
   MOVE LAST SCAN
===================================================== */


let receivingAutoClearTimer=null;
let receivingAutoClearKey="";

function cancelReceivingAutoClear(){
    clearTimeout(receivingAutoClearTimer);
    receivingAutoClearTimer=null;
    receivingAutoClearKey="";
}

function receivingLastScanKey(scan){
    if(!scan) return "";

    return toSafeString(
        scan.transactionId ||
        [
            scan.itemCode,
            scan.dateTime,
            scan.receivedQty,
            scan.gtin
        ].join("|")
    );
}

function scheduleReceivingAutoClear(scan){
    if(!scan) return;

    const key=receivingLastScanKey(scan);

    /* Cloud/workspace refreshes may render Last Scan repeatedly. The timer is
       tied to the actual scan identity, so sync cannot postpone the 30-second
       operator inactivity boundary. */
    if(!key || key===receivingAutoClearKey) return;

    cancelReceivingAutoClear();
    receivingAutoClearKey=key;

    receivingAutoClearTimer=setTimeout(()=>{
        const current=AppState?.workspace?.lastScan;

        if(!current || receivingLastScanKey(current)!==key) return;

        let isHandheld=false;
        try{
            isHandheld=typeof isLikelyZebraDevice==="function" && isLikelyZebraDevice();
        }catch(_){}

        /* PC quantity editing is deliberate activity. Handheld has no modal
           dependency here, so its Last Scan always clears after 30 seconds. */
        if(!isHandheld){
            const quantityModal=document.getElementById("quantityAdjustmentModal");
            if(quantityModal?.classList?.contains("open")){
                receivingAutoClearKey="";
                scheduleReceivingAutoClear(current);
                return;
            }
        }

        /* UI/local-batch boundary only. Never reverse a receiving transaction
           or change cumulative Received/history. */
        if(typeof resetCurrentLocalBatch==="function") resetCurrentLocalBatch();

        AppState.workspace.lastScan=null;
        cancelReceivingAutoClear();
        refreshEntireUI?.();
        window.hhRefreshReadyState?.();

        try{ document.activeElement?.blur?.(); }catch(_){}
        setTimeout(()=>{
            focusScannerInput?.();
            if(isHandheld) window.hhRepairScannerFocus?.("last-scan-auto-clear");
        },30);
    },30000);
}


function ensurePcClearScreenButton(){
    if(typeof isLikelyZebraDevice==="function" && isLikelyZebraDevice()){
        return;
    }

    const card=document.getElementById("lastScanCard");
    if(!card) return;

    let button=document.getElementById("btnPcClearLastScan");

    if(!button){
        button=document.createElement("button");
        button.id="btnPcClearLastScan";
        button.type="button";
        button.className="pcClearLastScan";
        button.textContent="CLEAR SCREEN";

        const metrics=card.querySelector(".lastScanMetrics");
        if(metrics){
            metrics.insertAdjacentElement("afterend",button);
        }else{
            card.appendChild(button);
        }
    }

    button.onclick=()=>{
        /*
           Visual-only clear. Does not modify receiving quantities/history.
        */
        cancelReceivingAutoClear();

        /* CLEAR SCREEN is UI-only for shared receiving data, but it is an
           explicit boundary for this PC's local current batch. */
        if(typeof resetCurrentLocalBatch === "function"){
            resetCurrentLocalBatch();
        }

        AppState.workspace.lastScan=null;
        refreshEntireUI?.();

        try{ document.activeElement?.blur?.(); }catch(_){}
        setTimeout(()=>focusScannerInput?.(),30);
    };
}

function moveLastScanBelowScanBox(){

    const lastScanCard =
        UI.elements.lastScanCard;

    const smartArea =
        document.getElementById(
            "smartScanSearchArea"
        );

    if(
        !lastScanCard ||
        !smartArea
    ){
        return;
    }

    smartArea.insertAdjacentElement(
        "afterend",
        lastScanCard
    );

}


/* =====================================================
   SMART SCAN CONTROLS
===================================================== */

function bindSmartScanSelectionControls(){

    document
        .getElementById(
            "btnCloseSmartSelection"
        )
        ?.addEventListener(
            "click",
            function(){

                closeSmartScanSearch(
                    true
                );

            }
        );


    document
        .getElementById(
            "btnSmartQtyMinus"
        )
        ?.addEventListener(
            "click",
            function(){

                const input =
                    document.getElementById(
                        "smartQuantityInput"
                    );

                if(!input){
                    return;
                }

                const current =
                    Math.max(
                        1,
                        toInteger(
                            input.value,
                            1
                        )
                    );

                input.value =
                    Math.max(
                        1,
                        current - 1
                    );

            }
        );


    document
        .getElementById(
            "btnSmartQtyPlus"
        )
        ?.addEventListener(
            "click",
            function(){

                const input =
                    document.getElementById(
                        "smartQuantityInput"
                    );

                if(!input){
                    return;
                }

                const current =
                    Math.max(
                        1,
                        toInteger(
                            input.value,
                            1
                        )
                    );

                input.value =
                    current + 1;

            }
        );


    document
        .getElementById(
            "btnAddSmartQuantity"
        )
        ?.addEventListener(
            "click",
            addSelectedSmartQuantity
        );

    document
        .getElementById(
            "smartQuantityInput"
        )
        ?.addEventListener(
            "keydown",
            function(event){
                let isHandheld=false;
                try{
                    isHandheld=typeof isLikelyZebraDevice === "function" && isLikelyZebraDevice();
                }catch(_){ }

                if(isHandheld || event.key !== "Enter" || event.repeat){
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                addSelectedSmartQuantity();
            }
        );

}


/* =====================================================
   SMART SEARCH INPUT
===================================================== */

function handleSmartScanSearchInput(
    searchText
){

    const query =
        normalizeText(
            searchText
        );

    if(!query){

        closeSmartScanSearch(
            false
        );

        return;
    }

    const results =
        searchItems(
            getSearchableItems(),
            query,
            APP_CONFIG
                .receiving
                .searchResultLimit
        );

    renderSmartScanSearchResults(
        results,
        query
    );

}


/* =====================================================
   SMART SEARCH RESULTS
===================================================== */

function renderSmartScanSearchResults(
    results,
    query = ""
){

    const container =
        UI.smartScan.results
        ||
        document.getElementById(
            "smartScanResults"
        );

    if(!container){
        return;
    }

    container.innerHTML =
        "";

    if(
        !Array.isArray(results) ||
        results.length === 0
    ){

        if(query){

            container.innerHTML = `

                <div class="smartSearchEmpty">

                    No matching item found for:

                    <strong>
                        ${escapeHTML(query)}
                    </strong>

                </div>

            `;

        }

        return;
    }

    const fragment =
        document.createDocumentFragment();

    results.forEach(item=>{

        const row = document.createElement("div");
        row.className = "smartSearchResultRow";
        row.style.display = "flex";
        row.style.alignItems = "stretch";
        row.style.gap = "6px";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "smartSearchResult";
        button.style.flex = "1 1 auto";
        button.innerHTML = `
            <div class="smartSearchResultMain">
                <strong>${escapeHTML(item.itemName)}</strong>
                <span>${escapeHTML(item.itemCode)}</span>
            </div>
            <div class="smartSearchResultQty">
                <span>${toNumber(item.receivedQty,0)} / ${toNumber(item.orderedQty,0)}</span>
                <small>Received</small>
            </div>`;

        button.addEventListener("click",function(){
            selectSmartScanItem(item);
        });
        row.appendChild(button);

        /* Phase 2C.7.6: the Dashboard inline search must expose the same
           historical review/correction workflow as the Receiving search. */
        if(item.manual===true && toNumber(item.receivedQty,0)===0){
            const remove=document.createElement("button");
            remove.type="button";
            remove.className="secondaryButton removeManualSearchButton";
            remove.textContent="Remove Manual Item";
            remove.style.flex="0 0 auto";
            remove.addEventListener("click",function(event){
                event.preventDefault();
                event.stopPropagation();
                if(typeof deleteManualItem==="function" && deleteManualItem(item.itemCode)){
                    renderSmartScanSearchResults(
                        searchItems(
                            getSearchableItems(),
                            query,
                            APP_CONFIG.receiving.searchResultLimit
                        ),
                        query
                    );
                }
            });
            row.appendChild(remove);
        }

        if(toNumber(item.receivedQty,0) > 0){
            const review=document.createElement("button");
            review.type="button";
            review.className="secondaryButton smartSearchReviewButton";
            review.textContent="Review / Adjust";
            review.style.flex="0 0 auto";
            review.style.padding="0 10px";
            review.addEventListener("click",function(event){
                event.preventDefault();
                event.stopPropagation();
                closeSmartScanSearch(false);
                openSearchedItemReview(item);
            });
            row.appendChild(review);
        }

        fragment.appendChild(row);

    });

    container.appendChild(
        fragment
    );

}


/* =====================================================
   SELECT SMART ITEM
===================================================== */

function selectSmartScanItem(item){

    if(!item){
        return;
    }

    UI.smartScan.selectedItem =
        item;

    const results =
        document.getElementById(
            "smartScanResults"
        );

    const selected =
        document.getElementById(
            "smartScanSelected"
        );

    if(results){

        results.innerHTML =
            "";

    }

    if(selected){

        selected.classList.remove(
            "hidden"
        );

    }

    setElementText(
        document.getElementById(
            "smartSelectedName"
        ),
        item.itemName
    );

    setElementText(
        document.getElementById(
            "smartSelectedCode"
        ),
        item.itemCode
    );

    setElementText(
        document.getElementById(
            "smartSelectedOrdered"
        ),
        toNumber(
            item.orderedQty,
            0
        )
    );

    setElementText(
        document.getElementById(
            "smartSelectedReceived"
        ),
        toNumber(
            item.receivedQty,
            0
        )
    );

    setElementText(
        document.getElementById(
            "smartSelectedRemaining"
        ),
        toNumber(
            item.remainingQty,
            0
        )
    );

    const quantityInput =
        document.getElementById(
            "smartQuantityInput"
        );

    if(quantityInput){

        quantityInput.value =
            "1";

        setTimeout(()=>{

            quantityInput.focus();

            quantityInput.select();

        },30);

    }

}


/* =====================================================
   ADD SELECTED SMART QUANTITY
===================================================== */

function addSelectedSmartQuantity(){

    const item =
        UI.smartScan.selectedItem;

    if(!item){

        showToast(
            "Select an item first",
            "warning"
        );

        return false;
    }

    const quantityInput =
        document.getElementById(
            "smartQuantityInput"
        );

    const quantity =
        quantityInput
        ?
        toNumber(
            quantityInput.value,
            0
        )
        :
        0;

    if(
        !Number.isFinite(quantity) ||
        quantity <= 0
    ){

        showToast(
            "Enter a valid quantity",
            "warning"
        );

        return false;
    }

    const transaction =
        addSearchItemQuantity(
            item.itemCode,
            quantity
        );

    if(transaction){

        const barcodeInput =
            UI.elements.barcodeInput;

        if(barcodeInput){

            barcodeInput.value =
                "";

        }

        closeSmartScanSearch(
            false
        );

        focusScannerInput();

    }

    return transaction;
}


/* =====================================================
   CLOSE SMART SEARCH
===================================================== */

function closeSmartScanSearch(
    clearInput = false
){

    const results =
        document.getElementById(
            "smartScanResults"
        );

    const selected =
        document.getElementById(
            "smartScanSelected"
        );

    if(results){

        results.innerHTML =
            "";

    }

    if(selected){

        selected.classList.add(
            "hidden"
        );

    }

    UI.smartScan.selectedItem =
        null;

    if(
        clearInput &&
        UI.elements.barcodeInput
    ){

        UI.elements
            .barcodeInput
            .value =
            "";

    }

    if(clearInput){

        focusScannerInput();

    }

}


/* =====================================================
   GLOBAL UI EVENTS
===================================================== */

function bindUIEvents(){

    setupDashboardKpiInteractivity();
    setupPhase263ActionDelegation();
    refreshScanSafetyUI();

    document.getElementById("btnExportReceivingSummaryExcel")?.addEventListener("click",()=>{ if(typeof exportReceivingSummaryExcel==="function") exportReceivingSummaryExcel(); });
    document.getElementById("btnExportReceivingSummaryPDF")?.addEventListener("click",()=>{ if(typeof exportReceivingSummaryPDF==="function") exportReceivingSummaryPDF(); });
    document.getElementById("btnEmailReceivingDifferences")?.addEventListener("click",()=>{
        if(
            typeof buildEmailReportFromDisplayedReceiving!=="function" ||
            typeof openFinalizedDiscrepancyEmailPreview!=="function"
        ){
            showToast?.("Email report is unavailable","error");
            return;
        }

        const report=buildEmailReportFromDisplayedReceiving();

        if(!report.rows.length){
            showToast?.("No displayed rows to email","warning");
            return;
        }

        openFinalizedDiscrepancyEmailPreview(report,{
            fromArchive:false,
            liveReport:true,
            filteredView:true
        });
    });

    {
        const pickerButton=document.getElementById("headerOrderPickerButton");
        const pickerMenu=document.getElementById("headerOrderPickerMenu");

        pickerButton?.addEventListener("click",event=>{
            event.preventDefault();
            event.stopPropagation();

            const willOpen=pickerMenu?.hidden!==false;

            if(pickerMenu){
                pickerMenu.hidden=!willOpen;
            }

            pickerButton.setAttribute(
                "aria-expanded",
                willOpen ? "true" : "false"
            );
        });

        pickerMenu?.addEventListener("click",event=>{
            const action=event.target.closest("[data-order-picker-action]");
            const option=event.target.closest("[data-header-order]");

            if(action){
                event.preventDefault();
                const active=
                    typeof getActiveReceivingOrderNumbers==="function"
                        ? getActiveReceivingOrderNumbers()
                        : [];

                if(action.dataset.orderPickerAction==="all"){
                    pickerMenu
                        .querySelectorAll("[data-header-order]")
                        .forEach(el=>{ el.checked=true; });
                }
                else if(action.dataset.orderPickerAction==="clear"){
                    pickerMenu
                        .querySelectorAll("[data-header-order]")
                        .forEach(el=>{ el.checked=false; });
                }
                else if(action.dataset.orderPickerAction==="ok"){
                    const selected=[
                        ...pickerMenu.querySelectorAll(
                            "[data-header-order]:checked"
                        )
                    ].map(el=>el.dataset.headerOrder);

                    if(!selected.length){
                        showToast?.(
                            "Select at least one Order",
                            "warning"
                        );
                        return;
                    }

                    if(
                        typeof setSelectedReceivingOrderNumbers==="function" &&
                        setSelectedReceivingOrderNumbers(selected)
                    ){
                        window.PharmFlowOrderScope=
                            selected.length===active.length
                                ? "ALL"
                                : selected.join("|");

                        pickerMenu.hidden=true;
                        pickerButton?.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        refreshHeader();
                        refreshDashboard();
                        refreshProgress();
                        refreshReceivingTable();
                        refreshHealthSummary?.();
                        refreshOpenOrderStatusReport?.();
                        /* Phase 2C.11.4.4 — Finalize selection-state sync.
                           The header picker updates the receiving order scope, but the
                           Finalize button is maintained by orders.js and is not rebuilt
                           by the normal Receiving UI refresh. Re-evaluate it immediately
                           so a persisted multi-order workspace can finalize the single
                           order the operator just selected. */
                        refreshFinalizeReceivingButton?.();

                        showToast?.(
                            selected.length===active.length
                                ? "Showing all active orders"
                                : selected.length===1
                                    ? "Selected order: "+selected[0]
                                    : selected.length+" Orders Selected",
                            "success"
                        );
                    }
                }
                return;
            }

            if(option){
                event.stopPropagation();
            }
        });

        document.addEventListener("click",event=>{
            if(
                pickerMenu &&
                !pickerMenu.hidden &&
                !event.target.closest("#headerOrderPicker")
            ){
                pickerMenu.hidden=true;
                pickerButton?.setAttribute("aria-expanded","false");
            }
        });
    }


    document
        .getElementById("btnQuickSearch")
        ?.addEventListener(
            "click",
            openItemSearchModal
        );



    document.querySelectorAll("[data-receiving-issue]").forEach(input=>{
        input.addEventListener("change",function(){
            const selected=new Set(
                Array.from(document.querySelectorAll("[data-receiving-issue]:checked"))
                    .map(el=>el.value)
            );
            UI.receivingFilters.issues=selected;
            refreshReceivingIssueFilterLabel();
            refreshReceivingTable();
        });
    });

    document.getElementById("btnSelectAllReceivingIssues")?.addEventListener("click",function(event){
        event.preventDefault();
        document.querySelectorAll("[data-receiving-issue]").forEach(el=>{el.checked=true;});
        UI.receivingFilters.issues=new Set(["not_received","partial","received_any","over","manual"]);
        refreshReceivingIssueFilterLabel();
        refreshReceivingTable();
    });

    document.getElementById("btnClearReceivingIssues")?.addEventListener("click",function(event){
        event.preventDefault();
        document.querySelectorAll("[data-receiving-issue]").forEach(el=>{el.checked=false;});
        UI.receivingFilters.issues=new Set();
        refreshReceivingIssueFilterLabel();
        refreshReceivingTable();
    });

    document.getElementById("btnOkReceivingIssues")?.addEventListener("click",function(event){
        event.preventDefault();
        const details=document.getElementById("receivingIssueFilter");
        if(details){
            details.open=false;
        }
    });

    UI.elements.receivingCategoryFilter
        ?.addEventListener("change",function(event){
            UI.receivingFilters.category = event.target.value || "all";
            refreshReceivingTable();
        });

    document.getElementById("receivingInlineSearch")?.addEventListener("input",function(event){
        UI.receivingFilters.search=toSafeString(event.target.value||"").trim().toLowerCase();
        refreshReceivingTable();
    });

    document.getElementById("btnBackToReceivingDashboard")?.addEventListener("click",function(){
        if(typeof navigateTo==="function"){ navigateTo("dashboard"); return; }
        document.querySelector('.sidebarItem[data-page="dashboard"]')?.click();
    });


    document
        .getElementById("btnCloseSearch")
        ?.addEventListener(
            "click",
            closeItemSearchModal
        );


    UI.elements.globalSearchInput
        ?.addEventListener(
            "input",
            debounce(
                handleGlobalSearchInput,
                120
            )
        );


    document
        .getElementById("btnOpenManualAdd")
        ?.addEventListener(
            "click",
            openManualItemModal
        );


    document
        .getElementById("btnCloseManualItem")
        ?.addEventListener(
            "click",
            closeManualItemModal
        );


    document
        .getElementById("btnCancelManualItem")
        ?.addEventListener(
            "click",
            closeManualItemModal
        );


    document
        .getElementById("btnSaveManualItem")
        ?.addEventListener(
            "click",
            function(){

                if(
                    typeof saveManualReceivingItem ===
                    "function"
                ){

                    saveManualReceivingItem();

                }

            }
        );


    document
        .getElementById("btnConfirmCancel")
        ?.addEventListener(
            "click",
            closeConfirmModal
        );


    document
        .getElementById("btnConfirmOK")
        ?.addEventListener(
            "click",
            handleConfirmOK
        );


    document.addEventListener(
        "keydown",
        function(event){

            if(event.key !== "Escape"){
                return;
            }

            closeSmartScanSearch(
                false
            );

            closeItemSearchModal();

            closeManualItemModal();

            closeConfirmModal();

        }
    );


    document.addEventListener(
        "keydown",
        function(event){

            if(
                (
                    event.ctrlKey ||
                    event.metaKey
                )
                &&
                event.key
                    .toLowerCase() ===
                    "k"
            ){

                event.preventDefault();

                openItemSearchModal();

            }

        }
    );


    [
        UI.elements.searchModal,
        UI.elements.manualItemModal,
        UI.elements.confirmModal

    ].forEach(modal=>{

        if(!modal){
            return;
        }

        modal.addEventListener(
            "click",
            function(event){

                if(event.target === modal){

                    modal.classList.remove(
                        "open"
                    );

                    modal.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    focusScannerInput();

                }

            }
        );

    });

}


/* =====================================================
   APP STATE EVENTS
===================================================== */

function bindUIStateEvents(){

    AppEvents.on(
        "workspace:created",
        refreshEntireUI
    );


    AppEvents.on(
        "workspace:cleared",
        refreshEntireUI
    );


    AppEvents.on(
        "workspace:saved",
        refreshSessionUI
    );


    AppEvents.on(
        "state:restored",
        refreshEntireUI
    );


    AppEvents.on(
        "receiving:updated",
        function(){

            refreshEntireUI();

            refreshSelectedSmartItem();

            refreshZebraInterface();

        }
    );


    AppEvents.on(
        "receiving:item-highlight",
        function(data){

            if(
                data &&
                data.itemCode
            ){

                highlightReceivingRow(
                    data.itemCode
                );

            }

        }
    );


    AppEvents.on(
        "files:updated",
        function(){

            refreshFileLists();

            refreshHealthSummary();

            refreshDashboard();

        }
    );


    AppEvents.on(
        "masterGTIN:updated",
        refreshMasterGTINUI
    );


    AppEvents.on(
        "masterGTIN:order-applied",
        function(){
            refreshMasterGTINUI();
            refreshHealthSummary();
        }
    );


    AppEvents.on(
        "session:updated",
        refreshSessionUI
    );


    AppEvents.on(
        "archive:updated",
        refreshArchiveUI
    );

}


/* =====================================================
   REFRESH ENTIRE UI
===================================================== */

function refreshEntireUI(){

    if(typeof refreshSafeAccountIdentity === "function"){ refreshSafeAccountIdentity(); }

    refreshHeader();

    refreshDashboard();

    refreshProgress();

    refreshLastScan();

    refreshReceivingTable();

    refreshFileLists();

    refreshMasterGTINUI();

    refreshHealthSummary();

    refreshSessionUI();

    refreshArchiveUI();

    refreshOpenOrderStatusReport();

    ensurePcClearScreenButton?.();
}


/* =====================================================
   HEADER
===================================================== */

function refreshHeader(){

    // Global pharmacy identity belongs to the shell and is visible on every module.
    {
        const ctx = window.AuthState?.context || {};
        const pharmacyName = String(
            ctx.pharmacy_name ||
            document.getElementById("accountPharmacyName")?.textContent ||
            "Pharmacy"
        ).trim() || "Pharmacy";
        const pharmacyCode = String(
            ctx.pharmacy_code ||
            document.getElementById("settingsPharmacyCode")?.textContent ||
            "—"
        ).trim() || "—";

        setElementText(document.getElementById("topBarPharmacyName"), pharmacyName);
        setElementText(document.getElementById("topBarPharmacyCode"), pharmacyCode);
    }

    // Approved compact Dashboard identity: show the signed-in pharmacy name.
    const dashboardActive = document.getElementById("page-dashboard")?.classList.contains("active");
    if(dashboardActive){
        const pharmacyName = (document.getElementById("accountPharmacyName")?.textContent || "Pharmacy").trim();
        setElementText(UI.elements.pageTitle, pharmacyName || "Pharmacy");
        setElementText(UI.elements.pageSubtitle, "Receiving Dashboard");
    }

    const hasActiveOrder = !!(
        AppState.workspace?.active === true &&
        (AppState.workspace?.orderData?.length || AppState.workspace?.orderFiles?.length)
    );
    const manageOrdersLabel=document.querySelector("#pfnManageOrders span");
    if(manageOrdersLabel){
        manageOrdersLabel.textContent=hasActiveOrder ? "Manage Orders" : "Upload / Manage Orders";
    }

    {
        const orderLabel=UI.elements.headerOrderId;
        const picker=document.getElementById("headerOrderPicker");
        const pickerLabel=document.getElementById("headerOrderPickerLabel");
        const pickerMenu=document.getElementById("headerOrderPickerMenu");

        const activeOrders=
            typeof getActiveReceivingOrderNumbers==="function"
                ? getActiveReceivingOrderNumbers()
                : [];

        const selectedOrders=
            typeof getSelectedReceivingOrderNumbers==="function"
                ? getSelectedReceivingOrderNumbers()
                : [];

        const selected=
            typeof getSelectedReceivingOrderNumber==="function"
                ? getSelectedReceivingOrderNumber()
                : "";

        if(hasActiveOrder && activeOrders.length>1 && picker){
            orderLabel.hidden=true;
            picker.hidden=false;

            const allSelected=
                selectedOrders.length===activeOrders.length;

            if(pickerLabel){
                pickerLabel.textContent=
                    allSelected
                        ? "All Orders"
                        : selectedOrders.length===1
                            ? selectedOrders[0]
                            : selectedOrders.length+" Orders Selected";
            }

            if(pickerMenu){
                const signature=
                    activeOrders.join("|")+
                    "::"+
                    selectedOrders.join("|");

                if(pickerMenu.dataset.signature!==signature){
                    pickerMenu.innerHTML=`
                        <div class="headerOrderPickerTitle">
                            <strong>Select Orders</strong>
                            <span>Choose one or multiple active orders</span>
                        </div>

                        <div class="headerOrderPickerOptions">
                            ${activeOrders.map(order=>`
                                <label class="headerOrderCheckOption">
                                    <input
                                        type="checkbox"
                                        data-header-order="${escapeHTML(order)}"
                                        ${selectedOrders.includes(order) ? "checked" : ""}
                                    >
                                    <span class="headerOrderCheckBox"></span>
                                    <span class="headerOrderCheckText">
                                        <strong>${escapeHTML(order)}</strong>
                                        <small>Include in Dashboard & Receiving</small>
                                    </span>
                                </label>
                            `).join("")}
                        </div>

                        <div class="headerOrderPickerActions">
                            <button
                                type="button"
                                data-order-picker-action="all"
                            >Select All</button>
                            <button
                                type="button"
                                data-order-picker-action="clear"
                            >Clear</button>
                            <button
                                type="button"
                                class="headerOrderPickerOk"
                                data-order-picker-action="ok"
                            >OK</button>
                        </div>
                    `;

                    pickerMenu.dataset.signature=signature;
                }
            }
        }else{
            if(picker) picker.hidden=true;
            orderLabel.hidden=false;

            setElementText(
                orderLabel,
                hasActiveOrder
                    ? (
                        activeOrders[0] ||
                        AppState.workspace.orderName ||
                        "Active Order"
                    )
                    : "No Active Order"
            );
        }
    }


    setElementText(
        UI.elements.headerSessionId,
        hasActiveOrder
            ? (AppState.session.cloud === true ? "CONNECTED" : "LOCAL")
            : "INACTIVE"
    );

}


/* =====================================================
   DASHBOARD
===================================================== */

function getSelectedOrderDashboardMetrics(){
    const selected=
        typeof getSelectedReceivingOrderNumber==="function"
            ? getSelectedReceivingOrderNumber()
            : "";

    if(
        !selected ||
        typeof getPerOrderReceivingRows!=="function"
    ){
        return null;
    }

    const activeOrders=
        typeof getActiveReceivingOrderNumbers==="function"
            ? getActiveReceivingOrderNumbers()
            : [];

    const targetOrders=
        typeof getSelectedReceivingOrderNumbers==="function"
            ? getSelectedReceivingOrderNumbers()
            : (
                selected==="ALL"
                    ? activeOrders
                    : [selected]
            );

    if(!targetOrders.length){
        return null;
    }

    const localDevice=
        typeof ensureDeviceId==="function"
            ? ensureDeviceId()
            : AppState.session?.deviceId;

    let totalItems=0;
    let completedItems=0;
    let remainingUnits=0;
    let remainingItems=0;
    let overReceivedItems=0;
    let manualItems=0;

    targetOrders.forEach(orderNumber=>{
        const rows=getPerOrderReceivingRows(orderNumber);

        rows.forEach(row=>{
            const ordered=toNumber(row["Ordered Qty"],0);
            const received=toNumber(row["Received Qty"],0);

            if(ordered>0){
                totalItems++;

                if(received===ordered){
                    completedItems++;
                }

                remainingUnits+=Math.max(0,ordered-received);
                if(received<ordered) remainingItems++;

                if(received>ordered){
                    overReceivedItems++;
                }
            }
            else if(row.issueKey==="manual" && received>0){
                manualItems++;
            }
        });
    });

    const totalScans=(AppState.workspace?.receivingHistory||[])
        .filter(tx=>{
            const txOrder=normalizeOrderNumber(
                tx?.selectedOrderNumber ||
                tx?.orderId ||
                tx?.orderNumber ||
                ""
            );

            const inScope=
                targetOrders
                    .map(normalizeOrderNumber)
                    .includes(txOrder);

            return inScope;
        }).length;

    return {
        totalItems,
        completedItems,
        remainingUnits,
        remainingItems,
        overReceivedItems,
        manualItems,
        totalScans
    };
}

function refreshDashboard(){

    /* 2C.10.5.3 authority gate: no active Order means no operational metrics.
       Never render stale browser statistics when the manifest/workspace is empty. */
    const hasActiveOrder=!!(
        AppState.workspace?.active===true &&
        (AppState.workspace?.orderData?.length || AppState.workspace?.orderFiles?.length)
    );

    if(!hasActiveOrder){
        resetStatistics?.();
        [UI.elements.statTotalItems,UI.elements.statCompleted,UI.elements.statRemainingItems,UI.elements.statRemaining,
         UI.elements.statOver,UI.elements.statManual,UI.elements.statScans]
            .forEach(el=>setElementText(el,0));
        setElementText(document.getElementById("receivingNeedsReviewCount"),0);
        if(UI.elements.headerSessionId){
            setElementText(UI.elements.headerSessionId,"INACTIVE");
        }
        refreshProgress();
        return;
    }

    recalculateStatistics();

    const stats=AppState.statistics;
    const selectedMetrics=getSelectedOrderDashboardMetrics();

    let scoped;

    if(selectedMetrics){
        scoped=selectedMetrics;
    }else{
        const scopedItems=getScopedOrderItems();
        const scopeActive=getActiveOrderScope()!=="ALL";

        scoped=scopeActive ? {
            totalItems:scopedItems.length,
            completedItems:scopedItems.filter(i=>
                toNumber(i.orderedQty,0)>0 &&
                toNumber(i.receivedQty,0)===toNumber(i.orderedQty,0)
            ).length,
            remainingUnits:scopedItems.reduce(
                (n,i)=>n+Math.max(
                    0,
                    toNumber(i.orderedQty,0)-toNumber(i.receivedQty,0)
                ),
                0
            ),
            remainingItems:scopedItems.filter(i=>Math.max(0,toNumber(i.orderedQty,0)-toNumber(i.receivedQty,0))>0).length,
            overReceivedItems:scopedItems.filter(i=>
                toNumber(i.receivedQty,0)>toNumber(i.orderedQty,0)
            ).length,
            manualItems:scopedItems.filter(i=>i.manual===true).length,
            totalScans:(AppState.workspace?.receivingHistory||[]).filter(tx=>{
                const item=getItemByCode?.(tx.itemCode);
                const localDevice=
                    typeof ensureDeviceId==="function"
                        ? ensureDeviceId()
                        : AppState.session?.deviceId;

                return (
                    (!item || itemBelongsToOrderScope(item)) &&
                    toSafeString(tx.deviceId||"")===
                        toSafeString(localDevice||"")
                );
            }).length
        } : {
            ...stats,
            remainingUnits:AppState.workspace.orderData.reduce((sum,item)=>sum+Math.max(0,toNumber(item.orderedQty,0)-toNumber(item.receivedQty,0)),0),
            totalScans:(AppState.workspace?.receivingHistory||[]).filter(tx=>{
                const localDevice=
                    typeof ensureDeviceId==="function"
                        ? ensureDeviceId()
                        : AppState.session?.deviceId;

                return toSafeString(tx.deviceId||"")===
                    toSafeString(localDevice||"");
            }).length
        };
    }

    setElementText(UI.elements.statTotalItems,scoped.totalItems);
    setElementText(UI.elements.statCompleted,scoped.completedItems);
    setElementText(UI.elements.statRemainingItems,scoped.remainingItems);
    setElementText(
        UI.elements.statRemaining,
        Number.isFinite(scoped.remainingUnits)
            ? scoped.remainingUnits
            : stats.remainingItems
    );
    setElementText(UI.elements.statOver,scoped.overReceivedItems);
    setElementText(UI.elements.statManual,scoped.manualItems);
    setElementText(UI.elements.statScans,scoped.totalScans);

    refreshProgress();
}

/* =====================================================
   PROGRESS
===================================================== */

function refreshProgress(){

    const selectedMetrics=
        typeof getSelectedOrderDashboardMetrics==="function"
            ? getSelectedOrderDashboardMetrics()
            : null;

    const total =
        selectedMetrics
            ? selectedMetrics.totalItems
            : AppState.statistics.totalItems;

    const completed =
        selectedMetrics
            ? selectedMetrics.completedItems
            : AppState.statistics.completedItems;

    let percent = 0;

    if(total > 0){

        percent =
            Math.round(
                completed /
                total *
                100
            );

    }

    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );

    if(UI.elements.progressBar){

        UI.elements
            .progressBar
            .style
            .width =
            percent + "%";

    }

    setElementText(
        UI.elements.progressLabel,
        percent + "%"
    );

    setElementText(
        UI.elements.progressCompletedText,
        completed +
        " Completed"
    );

    setElementText(
        UI.elements.progressRemainingText,
        AppState.statistics
            .remainingItems +
        " Remaining"
    );

}


/* =====================================================
   LAST SCAN
===================================================== */

function refreshLastScan(){

    const scan =
        AppState.workspace.lastScan;

    if(!scan){

        cancelReceivingAutoClear();
        clearLastScanUI();

        refreshProfessionalLastScan(
            null
        );

        refreshLastScanQuantityControl();

        return;
    }

    scheduleReceivingAutoClear(scan);

    /*
       Keep legacy elements updated for compatibility
       with the existing application structure.
    */

    setElementText(
        UI.elements.lastItemName,
        scan.itemName || "-"
    );

    setElementText(
        UI.elements.lastItemCode,
        scan.itemCode || "-"
    );

    setElementText(
        UI.elements.lastGTIN,
        scan.gtin || "-"
    );

    setElementText(
        UI.elements.lastOrderedQty,
        scan.orderedQty ?? "-"
    );

    setElementText(
        UI.elements.lastReceivedQty,
        scan.receivedQty ?? "-"
    );

    setElementText(
        UI.elements.lastRemainingQty,
        scan.remainingQty ?? "-"
    );

    setElementText(
        UI.elements.lastItemStatus,
        scan.status || "-"
    );

    setElementText(
        UI.elements.lastScanTime,
        formatDateTime(
            scan.scanTime
        )
    );

    refreshProfessionalLastScan(
        scan
    );

    refreshLastScanQuantityControl();

}


/* =====================================================
   CLEAR LAST SCAN
===================================================== */

function clearLastScanUI(){

    [
        UI.elements.lastItemName,
        UI.elements.lastItemCode,
        UI.elements.lastGTIN,
        UI.elements.lastOrderedQty,
        UI.elements.lastReceivedQty,
        UI.elements.lastRemainingQty,
        UI.elements.lastItemStatus,
        UI.elements.lastScanTime

    ].forEach(element=>{

        setElementText(
            element,
            "-"
        );

    });

}


function getReceivingIssueKey(item){
    if(!item){ return ""; }
    const ordered=toNumber(item.orderedQty,0);
    const received=toNumber(item.receivedQty,0);
    if(item.manual===true && received>0){ return "manual"; }
    if(received>ordered){ return "over"; }
    if(ordered>0 && received<=0){ return "not_received"; }
    if(ordered>0 && received>0 && received<ordered){ return "partial"; }
    return "";
}

function refreshReceivingIssueFilterLabel(){
    const label=document.getElementById("receivingIssueFilterLabel");
    if(!label){ return; }
    const set=UI.receivingFilters.issues instanceof Set ? UI.receivingFilters.issues : new Set();
    const names={not_received:"Not Received",partial:"Partial Shortage",received_any:"Received Any Quantity",over:"Over Received",manual:"Manual Extra"};
    const discrepancyKeys=["not_received","partial","over","manual"];
    const allDiscrepancies=discrepancyKeys.every(key=>set.has(key));
    if(set.size===5 && allDiscrepancies && set.has("received_any")){ label.textContent="All selected"; return; }
    if(set.size===4 && allDiscrepancies && !set.has("received_any")){ label.textContent="All discrepancies"; return; }
    if(set.size===0){ label.textContent="None selected"; return; }
    if(set.size===1){ label.textContent=names[Array.from(set)[0]]||"1 selected"; return; }
    label.textContent=set.size+" selected";
}

function getVisibleReceivingItemsForExport(){
    return Array.isArray(UI.receivingVisibleItems) ? UI.receivingVisibleItems.slice() : [];
}

/* =====================================================
   RECEIVING TABLE
===================================================== */

function refreshReceivingTable(){
    const tbody=UI.elements.receivingTableBody;if(!tbody)return;refreshReceivingCategoryFilter();tbody.innerHTML="";
    const issues=UI.receivingFilters.issues instanceof Set?UI.receivingFilters.issues:new Set(["not_received","partial","received_any","over","manual"]), categoryFilter=UI.receivingFilters.category||"all", searchFilter=toSafeString(UI.receivingFilters.search||"").trim().toLowerCase();
    const scope=typeof getSelectedReceivingOrderNumber==="function"?getSelectedReceivingOrderNumber():"ALL", active=typeof getActiveReceivingOrderNumbers==="function"?getActiveReceivingOrderNumbers():[], selectedOrders=typeof getSelectedReceivingOrderNumbers==="function"?getSelectedReceivingOrderNumbers():(scope==="ALL"?active:[scope].filter(Boolean)), allMode=selectedOrders.length>1;
    let rows=[];if(typeof getPerOrderReceivingRows==="function"&&active.length){const orders=selectedOrders.length?selectedOrders:[active[0]].filter(Boolean);orders.forEach(orderNumber=>getPerOrderReceivingRows(orderNumber).forEach(r=>{const received=toNumber(r["Received Qty"],0),issue=r.issueKey||"",cat=toSafeString(r["Category"]||"").trim(),match=issues.has(issue)||(issues.has("received_any")&&received>0);if(match&&(categoryFilter==="all"||cat===categoryFilter))rows.push({orderNumber,itemCode:r["Item Number"],itemName:r["Item Name"],orderedQty:toNumber(r["Ordered Qty"],0),receivedQty:received,remainingQty:Math.max(0,toNumber(r["Ordered Qty"],0)-received),status:r["Issue Type"]==="Received"?"Completed":r["Issue Type"],category:r["Category"]||"",manual:r.issueKey==="manual"});}));}else{rows=(AppState.workspace.orderData||[]).filter(item=>{if(selectedOrders.length && !selectedOrders.some(order=>itemBelongsToOrderScope(item,order)))return false;const issue=getReceivingIssueKey(item),received=toNumber(item.receivedQty,0),cat=toSafeString(item.category||"").trim();return (issues.has(issue)||(issues.has("received_any")&&received>0))&&(categoryFilter==="all"||cat===categoryFilter);});}
    if(searchFilter){rows=rows.filter(item=>toSafeString(item.itemName||"").toLowerCase().includes(searchFilter)||toSafeString(item.itemCode||"").toLowerCase().includes(searchFilter));}
    UI.receivingVisibleItems=rows.slice();const d=document.getElementById("rsDisplayedItems");if(d)d.textContent=rows.length;if(typeof refreshReceivingVerificationSummary==="function")refreshReceivingVerificationSummary();
    const inline=document.getElementById("receivingInlineResult");
    if(!(AppState.workspace.orderData||[]).length){if(inline){inline.hidden=true;inline.innerHTML="";}tbody.innerHTML=`<tr><td colspan="10" class="tableEmptyState">No order items loaded.</td></tr>`;return;}if(!rows.length){if(inline){inline.hidden=true;inline.innerHTML="";}tbody.innerHTML=`<tr><td colspan="10" class="tableEmptyState">No items match the selected filters.</td></tr>`;return;}
    rows.forEach((item,index)=>{const tr=createReceivingTableRow(item,index);tr.dataset.orderNumber=item.orderNumber||"";tbody.appendChild(tr);});
    if(inline){
        if(searchFilter&&rows.length){
            const item=rows[0], order=item.orderNumber||((Array.isArray(item.orderNumbers)&&item.orderNumbers[0])||"—");
            inline.hidden=false;
            inline.innerHTML=`<div class="pfnInlineRow"><span>${escapeHTML(order)}</span><b>${escapeHTML(item.ite…41448 tokens truncated…          }
        });
        savePriorityApplicationState();
        return false;
    };

    const queued=itemPrioritySaveQueue.then(run,run);
    itemPrioritySaveQueue=queued.then(()=>undefined,()=>undefined);
    return queued.finally(()=>{
        targets.forEach(entry=>itemPrioritySaveVersions.delete(entry.itemCode));
    });
}

function renderItemBrowser(body, rows, options={}){
    const esc=value=>typeof escapeHtml==="function"?escapeHtml(toSafeString(value)):toSafeString(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
    const orderMode=options.showPriority===true;
    const receivedMode=options.receivedMode===true;
    const orderNumbers=Array.from(new Set(rows.flatMap(item=>Array.isArray(item?.orderNumbers)?item.orderNumbers:[]).map(normalizeOrderNumber).filter(Boolean)));
    body.innerHTML=`
      <div class="pfnBrowserControls ${orderMode?'pfnOrderBrowserControls':''}">
        ${orderMode?`<div class="pfnBrowserControlRow"><label>Order<select data-order-filter><option value="ALL">All Orders</option>${orderNumbers.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></label><label>Category<select data-category-filter><option value="ALL">All Categories</option>${Array.from(new Set(rows.map(i=>toSafeString(i.category||i.Category||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><button type="button" class="pfnHighPriorityFilter" data-priority-filter>High Priority</button><button type="button" class="pfnHighPriorityFilter" data-print-priority hidden>Print</button><button type="button" class="pfnHighPriorityFilter" data-clear-priority hidden>Clear High Priority</button><label>Quantity<select data-qty-sort><option value="desc" selected>Highest → Lowest</option><option value="asc">Lowest → Highest</option><option value="default">Default / Order Sequence</option></select></label></div>`:''}
        <input class="phase263Search pfnWideSearch" type="search" placeholder="Search by Item Name or Item Number" aria-label="Search items">
      </div>
      ${receivedMode?`<div class="phase263Summary"><b>Received Items: ${rows.length}</b></div>`:''}
      <div class="phase263TableWrap pfnCleanWorklist"><table class="quickKpiTable phase263Table"><thead><tr>${orderMode?'<th>Item Code</th><th>Item Name</th><th>Priority</th><th>Category</th><th>Quantity</th><th>Order No.</th>':'<th>Item Code</th><th>Item Name</th><th>Ordered</th>'}${receivedMode?'<th>Received</th>':''}</tr></thead><tbody data-rows></tbody></table></div>`;
    const input=body.querySelector('.phase263Search');
    const tbody=body.querySelector('[data-rows]');
    const orderFilter=body.querySelector('[data-order-filter]');
    const qtySort=body.querySelector('[data-qty-sort]');
    const categoryFilter=body.querySelector('[data-category-filter]');
    const priorityFilter=body.querySelector('[data-priority-filter]');
    const printPriority=body.querySelector('[data-print-priority]');
    const clearPriority=body.querySelector('[data-clear-priority]');
    let priorityOnly=false;
    let visibleRows=[];
    const rowHtml=item=>{
        const orders=(Array.isArray(item?.orderNumbers)?item.orderNumbers:[]).map(normalizeOrderNumber).filter(Boolean).join(', ')||'—';
        const pt=item.priorityType||'';
        if(orderMode)return `<tr class="pfnMobileItemCard"><td class="pfnItemCode" data-label="Item Number">${esc(item.itemCode)}</td><td class="pfnItemName" data-label="Item Name"><b>${esc(item.itemName)}</b></td><td class="pfnPriorityCell" data-label="Priority"><div class="pfnPrioritySegment"><button type="button" class="pfnPriorityMark ${pt==='SHORT'?'active short':''}" data-mark="SHORT" data-code="${esc(item.itemCode)}">SHORT</button><button type="button" class="pfnPriorityMark ${pt==='NEW'?'active new':''}" data-mark="NEW" data-code="${esc(item.itemCode)}">NEW</button></div></td><td class="pfnCategoryCell" data-label="Category">${esc(item.category||item.Category||'—')}</td><td class="pfnOrderedQty" data-label="Quantity">${esc(toNumber(item.orderedQty,0))}</td><td class="pfnOrderNo" data-label="Order No.">${esc(orders)}</td></tr>`;
        return `<tr class="pfnMobileItemCard"><td class="pfnItemCode" data-label="Item Number">${esc(item.itemCode)}</td><td class="pfnItemName" data-label="Item Name"><b>${esc(item.itemName)}</b></td><td class="pfnOrderedQty" data-label="Ordered">${esc(toNumber(item.orderedQty,0))}</td>${receivedMode?`<td data-label="Received">${esc(toNumber(item.receivedQty,0))}</td>`:''}</tr>`;
    };
    const draw=()=>{
        const q=toSafeString(input?.value||'').trim().toLowerCase();
        let visible=rows.filter(item=>!q||toSafeString(item.itemName).toLowerCase().includes(q)||toSafeString(item.itemCode).toLowerCase().includes(q));
        const selectedOrder=orderFilter?.value||'ALL';
        if(orderMode&&selectedOrder!=='ALL') visible=visible.filter(item=>(Array.isArray(item?.orderNumbers)?item.orderNumbers:[]).map(normalizeOrderNumber).includes(selectedOrder));
        const selectedCategory=categoryFilter?.value||'ALL';
        if(orderMode&&selectedCategory!=='ALL') visible=visible.filter(item=>toSafeString(item.category||item.Category||'').trim()===selectedCategory);
        if(orderMode&&priorityOnly) visible=visible.filter(item=>item.priorityType==='NEW'||item.priorityType==='SHORT');
        const sort=qtySort?.value||'desc';
        if(sort==='desc') visible=visible.slice().sort((a,b)=>toNumber(b.orderedQty,0)-toNumber(a.orderedQty,0));
        if(sort==='asc') visible=visible.slice().sort((a,b)=>toNumber(a.orderedQty,0)-toNumber(b.orderedQty,0));
        visibleRows=visible;
        if(orderMode&&priorityOnly){
            const groups=[['SHORT',visible.filter(i=>i.priorityType==='SHORT')],['NEW',visible.filter(i=>i.priorityType==='NEW')]];
            tbody.innerHTML=groups.map(([name,list])=>list.length?`<tr class="pfnPriorityGroup"><td colspan="6"><strong>${name}</strong><span>${list.length} items</span></td></tr>${list.map(rowHtml).join('')}`:'').join('')||`<tr><td colspan="6" class="tableEmptyState">No high priority items.</td></tr>`;
        }else{
            const colspan=orderMode?6:(receivedMode?4:3);
            tbody.innerHTML=visible.length?visible.map(rowHtml).join(''):`<tr><td colspan="${colspan}" class="tableEmptyState">No matching items.</td></tr>`;
        }
        tbody.querySelectorAll('[data-mark]').forEach(btn=>btn.onclick=async()=>{
            const item=typeof getItemByCode==='function'?getItemByCode(btn.dataset.code):null;if(!item)return;
            const previousType=toSafeString(item.priorityType||'');
            const nextType=item.priorityType===btn.dataset.mark?'':btn.dataset.mark;
            item.priorityType=nextType;
            item.highPriority=!!nextType;
            const segment=btn.closest('.pfnPrioritySegment');
            segment?.querySelectorAll('[data-mark]').forEach(mark=>{
                const active=mark.dataset.mark===nextType;
                mark.classList.toggle('active',active);
                mark.classList.toggle('short',active&&nextType==='SHORT');
                mark.classList.toggle('new',active&&nextType==='NEW');
            });
            const wrap=body.querySelector('.phase263TableWrap'),top=wrap?.scrollTop||0;
            const saved=await queueItemPrioritySelection(item,nextType,previousType);
            if(!saved||priorityOnly){
                draw();
                const finalWrap=body.querySelector('.phase263TableWrap');
                if(finalWrap) finalWrap.scrollTop=top;
            }
        });
    };
    input?.addEventListener('input',draw);orderFilter?.addEventListener('change',draw);categoryFilter?.addEventListener('change',draw);qtySort?.addEventListener('change',draw);
    priorityFilter?.addEventListener('click',()=>{priorityOnly=!priorityOnly;priorityFilter.classList.toggle('active',priorityOnly);if(printPriority)printPriority.hidden=!priorityOnly;if(clearPriority)clearPriority.hidden=!priorityOnly;draw();});
    clearPriority?.addEventListener('click',async()=>{
        const targets=visibleRows.filter(item=>item.priorityType==='NEW'||item.priorityType==='SHORT');
        if(!targets.length) return;
        if(!window.confirm(`Clear High Priority from ${targets.length} visible item(s)?`)) return;
        const top=body.querySelector('.phase263TableWrap')?.scrollTop||0;
        const clearRequest=queueClearVisiblePriorities(targets);
        draw();
        let finalWrap=body.querySelector('.phase263TableWrap');
        if(finalWrap) finalWrap.scrollTop=top;
        const cleared=await clearRequest;
        if(!cleared){
            draw();
            finalWrap=body.querySelector('.phase263TableWrap');
            if(finalWrap) finalWrap.scrollTop=top;
        }
    });
    printPriority?.addEventListener('click',()=>{
        const printable=visibleRows.filter(item=>item.priorityType==='NEW'||item.priorityType==='SHORT');
        if(!printable.length) return;

        const selectedOrder=orderFilter?.value||'ALL';
        const receipt=document.createElement('iframe');
        receipt.setAttribute('aria-hidden','true');
        receipt.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(receipt);

        const receiptDocument=receipt.contentDocument;
        receiptDocument.open();
        receiptDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>High Priority Items</title><style>
          @page{margin:2mm}
          *{box-sizing:border-box}
          html,body{width:76mm;margin:0;padding:0;background:#fff;color:#000;font-family:Arial,sans-serif}
          header{margin:0 0 2mm;padding:0 0 1.5mm;border-bottom:1px dashed #000;text-align:center}
          h1{margin:0;font-size:12px;line-height:1.2}
          .meta{margin-top:1mm;font-size:9px;line-height:1.2}
          table{width:100%;border:1px solid #000;border-collapse:collapse;table-layout:fixed}
          th,td{border-right:1px solid #000;border-bottom:1px solid #000;vertical-align:middle}
          th{padding:.5mm .8mm;background:#eee;font-size:8px;line-height:1;text-align:left}
          td{height:4.3mm;padding:.35mm .8mm;font-size:8px;line-height:1;white-space:nowrap}
          th:last-child,td:last-child{border-right:0}
          td.name{overflow:hidden;text-overflow:ellipsis}
          th.qty,td.qty{width:12mm;text-align:right;font-size:9px;font-weight:700}
          tr.group td{height:4mm;padding:.4mm .8mm;background:#eee;font-size:8px;font-weight:700}
          tr:last-child td{border-bottom:0}
        </style></head><body><header><h1>HIGH PRIORITY ITEMS</h1><div class="meta">${selectedOrder==='ALL'?'All Orders':`Order: ${esc(selectedOrder)}`}</div></header><table><thead><tr><th>ITEM NAME</th><th class="qty">QTY</th></tr></thead><tbody>${['SHORT','NEW'].map(type=>{
            const group=printable.filter(item=>item.priorityType===type);
            if(!group.length) return '';
            return `<tr class="group"><td colspan="2">${type}</td></tr>${group.map(item=>{
                const name=toSafeString(item.itemName||item.itemCode||'—');
                const fontSize=name.length>64?'5.5px':name.length>48?'6.2px':name.length>36?'7px':'8px';
                return `<tr><td class="name" style="font-size:${fontSize}">${esc(name)}</td><td class="qty">${esc(toNumber(item.orderedQty,0))}</td></tr>`;
            }).join('')}`;
        }).join('')}</tbody></table></body></html>`);
        receiptDocument.close();

        const removeReceipt=()=>setTimeout(()=>receipt.remove(),500);
        receipt.contentWindow.addEventListener('afterprint',removeReceipt,{once:true});
        setTimeout(()=>{
            receipt.contentWindow.focus();
            receipt.contentWindow.print();
        },100);
        setTimeout(removeReceipt,60000);
    });
    draw();
}

function renderDashboardKpiPanel(key,body){
    if(!body) return;
    const esc=value=>typeof escapeHtml==="function"?escapeHtml(toSafeString(value)):toSafeString(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
    if(key==="scans"){
        const allRows=getReceivingActivityRows();
        if(!allRows.length){body.innerHTML='<div class="tableEmptyState">No receiving activity in the current workspace yet.</div>';return;}
        body.innerHTML=`<div class="pfnActivityControls"><label for="pfnActivitySourceFilter">Source</label><select id="pfnActivitySourceFilter"><option value="All">All</option><option value="Handheld">Handheld</option><option value="PC Scan">PC Scan</option><option value="Manual">Manual</option><option value="Correction">Correction</option></select></div><div class="phase263TableWrap pfnActivityWorklist"><table class="quickKpiTable phase263Table"><thead><tr><th>Date / Time</th><th>Item Name</th><th>Item Number</th><th>GTIN</th><th>Quantity Effect</th><th>Source</th><th>Target Order</th><th>Action</th></tr></thead><tbody data-activity-rows></tbody></table></div>`;
        const tbody=body.querySelector("[data-activity-rows]");
        const sourceFilter=body.querySelector("#pfnActivitySourceFilter");
        const draw=()=>{
            const selected=sourceFilter.value;
            const rows=selected==="All"?allRows:allRows.filter(row=>getReceivingActivitySource(row)===selected);
            tbody.innerHTML=rows.length?rows.map(row=>{const q=toNumber(row.qtyChange,0);const correction=toSafeString(row.source).toUpperCase().includes("CORRECTION");const editable=!correction&&q>0&&!!getItemByCode?.(row.itemCode);return `<tr><td>${esc(typeof formatDateTime==="function"?formatDateTime(row.dateTime):row.dateTime)}</td><td><b>${esc(row.itemName||getItemByCode?.(row.itemCode)?.itemName||"Unknown item")}</b></td><td>${esc(row.itemCode)}</td><td>${esc(row.gtin||"—")}</td><td class="${q<0?'phase263Negative':'phase263Positive'}">${correction?'Correction':'Received'} ${q>0?'+':''}${esc(q)}</td><td>${esc(getReceivingActivitySource(row))}</td><td>${esc(row.selectedOrderNumber||row.orderId||row.orderNumber||"—")}</td><td>${editable?`<button class="quickUndoButton" data-edit="${esc(row.transactionId)}">Edit</button>`:'—'}</td></tr>`;}).join(''):'<tr><td colspan="8" class="tableEmptyState">No activity from this source.</td></tr>';
            tbody.querySelectorAll("[data-edit]").forEach(btn=>btn.onclick=()=>{const row=allRows.find(entry=>toSafeString(entry.transactionId)===btn.dataset.edit);if(row)openReceivingActivityEditor(row,allRows);});
        };
        sourceFilter.addEventListener("change",draw);
        draw();
        return;
    }
    if(key==="received"){
        const rows=getScopedOrderItems().filter(i=>toNumber(i.receivedQty,0)>0);
        renderItemBrowser(body,rows,{receivedMode:true});
        return;
    }
    if(key==="total"){
        renderItemBrowser(body,getKpiPanelItems("total"),{showPriority:true});
        return;
    }
    const rows=getKpiPanelItems(key);
    if(!rows.length){body.innerHTML='<div class="tableEmptyState">No items in this category.</div>';return;}
    body.innerHTML=`<div class="phase263TableWrap"><table class="quickKpiTable phase263Table"><thead><tr><th>Item Code</th><th>Item Name</th><th>Ordered</th><th>Received</th><th>Remaining</th><th>Status</th></tr></thead><tbody>${rows.map(item=>`<tr class="pfnMobileItemCard"><td data-label="Item Number">${esc(item.itemCode)}</td><td data-label="Item Name"><b>${esc(item.itemName)}</b></td><td data-label="Ordered">${esc(toNumber(item.orderedQty,0))}</td><td data-label="Received">${esc(toNumber(item.receivedQty,0))}</td><td data-label="Remaining">${esc(toNumber(item.remainingQty,0))}</td><td data-label="Status">${esc(item.status||"")}</td></tr>`).join('')}</tbody></table></div>`;
}

/* =====================================================
   PHASE 2C.6 FINAL - ONE-TAP ACCIDENTAL SCAN CORRECTION
===================================================== */
function refreshScanSafetyUI(){
    document.querySelector("#lastScanCard .scanSafetyBar")?.remove();
    ensureNeedsReviewButtons();
}



function getNeedsReviewPharmacyId(){
    if(typeof getCurrentPharmacyId === "function"){
        const id = getCurrentPharmacyId();
        if(id) return id;
    }

    if(typeof AuthState !== "undefined"){
        return (
            AuthState?.context?.pharmacy_id ||
            AuthState?.profile?.pharmacy_id ||
            AuthState?.pharmacyId ||
            null
        );
    }

    return null;
}


async function loadNeedsReviewRows(workflow,orderNumber=null){
    if(typeof nrV2List!=="function") return [];
    return await nrV2List(workflow||"RECEIVING",orderNumber||null);
}

async function refreshNeedsReviewCounters(){
    if(typeof isLikelyZebraDevice==="function"&&isLikelyZebraDevice()) return;

    try{
        /* Pharmacy-scoped by design. Never hide Handheld drafts because of
           a PC-local order/workspace id mismatch. */
        const receiving=await loadNeedsReviewRows("RECEIVING",null);
        const rc=document.getElementById("receivingNeedsReviewCount");

        const grouped=groupNeedsReviewRows(receiving);
        if(rc) rc.textContent=String(grouped.length);

        document
            .getElementById("btnReceivingNeedsReview")
            ?.classList.toggle("hasItems",grouped.length>0);
    }catch(error){
        console.warn("Needs Review V2 count failed",error);
    }
}

function ensureNeedsReviewButtons(){
    if(typeof isLikelyZebraDevice==="function"&&isLikelyZebraDevice()) return;
    const button=document.getElementById("btnReceivingNeedsReview");
    if(button && button.dataset.bound!=="1"){button.dataset.bound="1";button.onclick=()=>openNeedsReviewPanel("RECEIVING");}
    refreshNeedsReviewCounters();
}


function nrV2FindOrderMatches(query){
    const q=toSafeString(query).trim().toLowerCase();
    /* Needs Review is an order-resolution tool, not a Global Master search.
       Respect the same active-order scope used by the Receiving item browser. */
    const source=typeof getScopedOrderItems==="function"
        ? getScopedOrderItems()
        : (AppState?.workspace?.orderData||[]);

    if(!q) return source.slice(0,20);

    return source.filter(item=>
        toSafeString(item?.itemCode).toLowerCase().includes(q) ||
        toSafeString(item?.itemName).toLowerCase().includes(q)
    ).slice(0,20);
}

async function nrV2HydratePhoto(img,path){
    if(!img || !path) return;

    try{
        const url=await nrV2PhotoObjectUrl(path);
        if(url){
            img.src=url;
            img.hidden=false;
        }
    }catch(_){}
}

function groupNeedsReviewRows(rows){
    const groups=new Map();
    (rows||[]).forEach(row=>{
        const gtin=toSafeString(row?.gtin||"").trim();
        const order=toSafeString(row?.order_number||"").trim();
        const reason=toSafeString(row?.review_reason||"UNKNOWN_GTIN").trim();
        const key=[gtin,order,reason].join("|");
        if(!groups.has(key)){
            groups.set(key,{
                key,
                gtin,
                order_number:order,
                review_reason:reason,
                source:row?.source||"",
                rows:[],
                total_quantity:0,
                photos:[],
                master_item_name_hint:row?.master_item_name_hint||"",
                master_item_code_hint:row?.master_item_code_hint||""
            });
        }
        const group=groups.get(key);
        group.rows.push(row);
        group.total_quantity+=Math.max(0,Number(row?.pending_quantity||0)||0);
        if(row?.photo_path) group.photos.push(row.photo_path);
        if(!group.master_item_name_hint && row?.master_item_name_hint) group.master_item_name_hint=row.master_item_name_hint;
        if(!group.master_item_code_hint && row?.master_item_code_hint) group.master_item_code_hint=row.master_item_code_hint;
    });
    return Array.from(groups.values()).map(group=>({
        ...group,
        total_quantity:Math.max(1,group.total_quantity||0),
        rows:group.rows.slice().sort((a,b)=>String(a?.created_at||a?.date_time||"").localeCompare(String(b?.created_at||b?.date_time||"")))
    }));
}

function nrV2GroupTransactionId(group){
    const safe=value=>toSafeString(value||"").replace(/[^a-z0-9]+/gi,"_").replace(/^_+|_+$/g,"").slice(0,42);
    return `NEEDS_REVIEW_GROUP_${safe(group?.order_number||"ALL")}_${safe(group?.gtin||"UNKNOWN")}`;
}

function nrV2HasTransactionId(transactionId){
    return (AppState?.workspace?.receivingHistory||[]).some(tx=>toSafeString(tx?.transactionId||"")===transactionId);
}

async function nrV2ResolveGroupToOrderItem(group,item){
    const transactionId=nrV2GroupTransactionId(group);
    if(!nrV2HasTransactionId(transactionId)){
        const learned=await savePharmacyLearnedGTIN(group.gtin,item.itemCode,item.itemName);
        addMappingRecord({itemCode:item.itemCode,gtin:group.gtin,source:"PHARMACY_LEARNED"});
        const tx=receiveOrderItem({
            item,
            quantity:Math.max(1,Number(group.total_quantity||1)||1),
            gtin:group.gtin,
            source:APP_CONFIG.transactionSources.scanner,
            manual:false,
            targetOrder:group.order_number||"",
            transactionId,
            gtinResolution:typeof learnedGTINResolution==="function"?learnedGTINResolution(learned):null
        });
        if(!tx) throw new Error("Unable to apply reviewed quantity");
    }
    for(const row of group.rows){
        await nrV2MarkResolved(row,item,"LINK_ORDER_ITEM",transactionId);
    }
    for(const path of group.photos){
        try{ await nrV2DeletePhoto?.(path); }catch(_){ }
    }
}

function nrV2ItemMetrics(item){
    const ordered=toNumber(item?.orderedQty,0);
    const received=toNumber(item?.receivedQty,0);
    return {ordered,received,remaining:Math.max(0,toNumber(item?.remainingQty,ordered-received))};
}

function nrV2ItemSummary(item,esc){
    const metrics=nrV2ItemMetrics(item);
    return `<span><small>Item Name</small><strong>${esc(item.itemName)}</strong><small>Item Code <b>${esc(item.itemCode)}</b></small></span><span class="needsReviewResultQty"><small>Ordered <b>${metrics.ordered}</b></small><small>Received <b>${metrics.received}</b></small><small>Remaining <b>${metrics.remaining}</b></small></span>`;
}

function closeNeedsReviewPhotoViewer(){
    document.getElementById("needsReviewPhotoViewer")?.remove();
}

function openNeedsReviewPhotoViewer(url){
    closeNeedsReviewPhotoViewer();
    const viewer=document.createElement("div");
    viewer.id="needsReviewPhotoViewer";
    viewer.className="needsReviewPhotoViewer";
    viewer.setAttribute("role","dialog");
    viewer.setAttribute("aria-modal","true");
    viewer.setAttribute("aria-label","Temporary product photo");
    viewer.innerHTML=`<button class="needsReviewPhotoScrim" type="button" data-photo-close aria-label="Close photo"></button><section><img src="${url}" alt="Temporary product review photo"><button type="button" data-photo-close>Close photo</button></section>`;
    document.body.appendChild(viewer);
    viewer.querySelectorAll("[data-photo-close]").forEach(button=>button.addEventListener("click",closeNeedsReviewPhotoViewer));
}

async function openNeedsReviewPanel(workflow="RECEIVING"){
    if(typeof isLikelyZebraDevice==="function"&&isLikelyZebraDevice()) return;
    closeNeedsReviewPhotoViewer();
    document.getElementById("needsReviewOverlay")?.remove();

    let rawRows=[];
    try{ rawRows=await loadNeedsReviewRows(workflow,null); }
    catch(error){ showToast?.(error?.message||"Unable to load Needs Review","error"); return; }

    const groups=groupNeedsReviewRows(rawRows);
    const esc=value=>escapeHTML(toSafeString(value));
    const admin=typeof isPharmacyAdmin==="function"&&isPharmacyAdmin();
    const overlay=document.createElement("div");
    overlay.id="needsReviewOverlay";
    overlay.className="needsReviewOverlay";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.setAttribute("aria-labelledby","needsReviewTitle");
    overlay.innerHTML=`
      <button class="needsReviewScrim" data-review-close aria-label="Close Needs Review"></button>
      <section class="needsReviewPanel">
        <header>
          <div><span class="needsReviewKicker">RECEIVING EXCEPTIONS</span><h2 id="needsReviewTitle">Needs Review <b class="pfnReviewCount">${groups.length}</b></h2><p>Resolve each grouped unknown GTIN to an item in the current Active Order.</p></div>
          <button class="needsReviewClose" type="button" data-review-close aria-label="Close Needs Review">Close</button>
        </header>
        ${admin?`<details class="needsReviewAdmin"><summary>Pharmacy learned GTIN maintenance</summary><div class="needsReviewAdminBody">
          <p>Correct or remove a pharmacy-scoped learned mapping. Global GTIN Master data is never changed.</p>
          <div class="needsReviewAdminLookup"><label>Learned GTIN<input data-admin-gtin inputmode="numeric" autocomplete="off" placeholder="Scan or enter GTIN"></label><button type="button" data-admin-load>View mapping</button></div>
          <div data-admin-workspace></div>
        </div></details>`:""}
        <div class="needsReviewList" data-review-list>
          ${groups.length?groups.map((group,index)=>`
            <section class="needsReviewRow" data-i="${index}">
              <div class="needsReviewInfo">
                <span class="pfnReviewReason">${group.review_reason==="KNOWN_NOT_IN_ORDER"?"KNOWN ITEM · NOT IN ORDER":"ITEM NOT RECOGNISED"}</span>
                <span class="pfnReviewLabel">GTIN</span><strong class="pfnReviewGTIN">${esc(group.gtin)}</strong>
                <div class="pfnReviewMeta">
                  <div class="important"><span>Quantity</span><b>${group.total_quantity}</b></div>
                  <div class="important"><span>Entries</span><b>${group.rows.length}</b></div>
                  <div><span>Source</span><b>${esc(group.source||"Unknown")}</b></div>
                  <div><span>Order Number</span><b>${group.order_number?esc(group.order_number):"Needs assignment"}</b></div>
                </div>
                ${group.photos.length?`<div class="pfnReviewPhotoGrid">${group.photos.map((path,pidx)=>`<button type="button" data-photo-open="${index}:${pidx}"><img data-photo="${index}:${pidx}" alt="Temporary product photo" hidden><span>View temporary photo</span></button>`).join("")}</div>`:""}
              </div>
              <div class="needsReviewResolve">
                <label>Search Current Active Order<input type="search" data-search="${index}" placeholder="Item Name or Item Code" autocomplete="off" spellcheck="false"></label>
                <div class="needsReviewMatches" data-matches="${index}"></div>
                <div class="needsReviewSelection" data-selection="${index}" hidden></div>
                <button class="needsReviewCancel" type="button" data-cancel-review="${index}">Cancel Review</button>
              </div>
            </section>`).join(""):`<div class="needsReviewEmpty">Nothing needs review.</div>`}
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const closePanel=()=>{
        if(overlay.dataset.busy==="1"||overlay.dataset.confirming==="1") return;
        closeNeedsReviewPhotoViewer();
        overlay.remove();
    };
    overlay.querySelectorAll("[data-review-close]").forEach(button=>button.addEventListener("click",closePanel));

    groups.forEach((group,index)=>{
        const section=overlay.querySelector(`[data-i="${index}"]`);
        const search=overlay.querySelector(`[data-search="${index}"]`);
        const matches=overlay.querySelector(`[data-matches="${index}"]`);
        const selection=overlay.querySelector(`[data-selection="${index}"]`);
        const cancelReview=overlay.querySelector(`[data-cancel-review="${index}"]`);
        let selectedItem=null;

        cancelReview?.addEventListener("click",async()=>{
            if(!window.confirm(`Cancel this Needs Review group for GTIN ${group.gtin}?\n\nThis will not learn the GTIN or change any received quantity.`)) return;
            const reason=toSafeString(window.prompt("Reason required: Wrong Scan, Test Entry, Item Cancelled, or Other")||"").trim();
            if(!reason){showToast?.("A cancellation reason is required","warning");return;}
            cancelReview.disabled=true; overlay.dataset.busy="1";
            try{
                /* The current V2 delete RPC has no reason field. Deletion is
                   intentionally limited to the exact rows in this displayed
                   GTIN/order/reason group; photos are removed only afterward. */
                for(const row of group.rows) await nrV2Delete(row.review_id);
                for(const path of group.photos){try{await nrV2DeletePhoto?.(path);}catch(_){}}
                section.remove(); await refreshNeedsReviewCounters();
                const count=overlay.querySelectorAll(".needsReviewRow").length;
                const countNode=overlay.querySelector(".pfnReviewCount");
                if(countNode) countNode.textContent=String(count);
                if(count===0) overlay.querySelector("[data-review-list]").innerHTML='<div class="needsReviewEmpty">Nothing needs review.</div>';
                showToast?.(`Needs Review cancelled — ${reason}`,"success");
            }catch(error){cancelReview.disabled=false;showToast?.(error?.message||"Unable to cancel review","error");}
            finally{overlay.dataset.busy="";}
        });

        group.photos.forEach((path,pidx)=>nrV2HydratePhoto(overlay.querySelector(`[data-photo="${index}:${pidx}"]`),path));
        group.photos.forEach((path,pidx)=>overlay.querySelector(`[data-photo-open="${index}:${pidx}"]`)?.addEventListener("click",async()=>{
            try{
                const url=await nrV2PhotoObjectUrl(path);
                if(!url) throw new Error("Photo is unavailable");
                openNeedsReviewPhotoViewer(url);
            }catch(error){ showToast?.(error?.message||"Unable to open review photo","error"); }
        }));

        const drawSelection=()=>{
            if(!selectedItem){ selection.hidden=true;selection.innerHTML="";return; }
            selection.hidden=false;
            selection.innerHTML=`<span class="needsReviewSelectionLabel">SELECTED ITEM</span><div>${nrV2ItemSummary(selectedItem,esc)}</div><button type="button" data-resolve>Resolve &amp; Learn</button>`;
            selection.querySelector("[data-resolve]").addEventListener("click",async event=>{
                const button=event.currentTarget;
                button.disabled=true;
                overlay.dataset.busy="1";
                try{
                    await nrV2ResolveGroupToOrderItem(group,selectedItem);
                    section.remove();
                    await refreshNeedsReviewCounters();
                    const count=overlay.querySelectorAll(".needsReviewRow").length;
                    const countNode=overlay.querySelector(".pfnReviewCount");
                    if(countNode) countNode.textContent=String(count);
                    if(count===0) overlay.querySelector("[data-review-list]").innerHTML='<div class="needsReviewEmpty">Nothing needs review.</div>';
                    showToast?.(`GTIN resolved and learned — ${group.total_quantity} received`,"success");
                }catch(error){ button.disabled=false;showToast?.(error?.message||"Unable to resolve review","error"); }
                finally{ overlay.dataset.busy=""; }
            });
        };
        const drawMatches=()=>{
            selectedItem=null;
            drawSelection();
            const q=toSafeString(search?.value||"").trim();
            if(!q){matches.innerHTML="";return;}
            const items=nrV2FindOrderMatches(q).slice(0,8);
            matches.innerHTML=items.length?items.map((item,itemIndex)=>`<button type="button" data-match="${itemIndex}">${nrV2ItemSummary(item,esc)}</button>`).join(""):`<div class="needsReviewNoMatches">No matching item in the current Active Order.</div>`;
            matches.querySelectorAll("[data-match]").forEach(button=>button.addEventListener("click",()=>{
                selectedItem=items[Number(button.dataset.match)]||null;
                matches.querySelectorAll("button").forEach(result=>result.classList.toggle("selected",result===button));
                drawSelection();
            }));
        };
        search?.addEventListener("input",drawMatches);
    });

    if(admin){
        const gtinInput=overlay.querySelector("[data-admin-gtin]");
        const workspace=overlay.querySelector("[data-admin-workspace]");
        let currentMapping=null;
        let replacement=null;
        let pendingLifecycle=null;
        const renderMaintenance=()=>{
            if(!currentMapping){workspace.innerHTML="";return;}
            workspace.innerHTML=`<div class="needsReviewMappingCurrent"><span>CURRENT PHARMACY MAPPING</span><strong>${esc(currentMapping.gtin)} → ${esc(currentMapping.itemCode)} → ${esc(currentMapping.itemName||"Unnamed item")}</strong></div>
              <label>Choose replacement from Current Active Order<input type="search" data-admin-search placeholder="Item Name or Item Code" autocomplete="off"></label>
              <div class="needsReviewMatches" data-admin-matches></div><div data-admin-selection></div>
              <div class="needsReviewMappingActions"><label>Mandatory Reason<textarea data-admin-reason rows="2" placeholder="Reason for this audited change"></textarea></label>
              <button type="button" data-admin-correct disabled>Correct Mapping</button><button class="danger" type="button" data-admin-remove>Remove Mapping</button></div>
              <div data-admin-impact></div>
              <p class="needsReviewGlobalNotice">Removal affects only this pharmacy learned mapping — not the Global GTIN Master.</p>`;
            const search=workspace.querySelector("[data-admin-search]");
            const matches=workspace.querySelector("[data-admin-matches]");
            const selected=workspace.querySelector("[data-admin-selection]");
            const correct=workspace.querySelector("[data-admin-correct]");
            const reason=workspace.querySelector("[data-admin-reason]");
            const impact=workspace.querySelector("[data-admin-impact]");
            const invalidatePreview=()=>{
                pendingLifecycle=null;
                overlay.dataset.confirming="";
                impact.innerHTML="";
                correct.textContent="Preview Correction";
                const remove=workspace.querySelector("[data-admin-remove]");
                if(remove) remove.textContent="Preview Removal";
            };
            const previewSignature=(action,why)=>[
                action,currentMapping.gtin,replacement?.itemCode||"",why
            ].join("|");
            const renderImpact=preview=>{
                const provable=Number(preview?.provable?.quantity||0);
                const compensated=Number(preview?.alreadyCompensated?.quantity||0);
                const ambiguous=Number(preview?.ambiguous?.quantity||0);
                const eligible=Number(preview?.reallocation?.eligibleQuantity||0);
                const nonReallocatable=Number(preview?.reallocation?.nonReallocatableQuantity||0);
                impact.innerHTML=`<div class="needsReviewMappingCompare"><span>PROVABLE QUANTITY TO REVERSE</span><strong>${esc(provable)}</strong><span>ALREADY COMPENSATED</span><strong>${esc(compensated)}</strong><span>AMBIGUOUS — UNTOUCHED</span><strong>${esc(ambiguous)}</strong>${String(preview?.action||"").toUpperCase()==="CORRECT"?`<span>ELIGIBLE TO REALLOCATE</span><strong>${esc(eligible)}</strong><span>NON-REALLOCATABLE</span><strong>${esc(nonReallocatable)}</strong>`:""}</div><button type="button" data-admin-cancel-preview>Cancel Preview</button>`;
                impact.querySelector("[data-admin-cancel-preview]")?.addEventListener("click",invalidatePreview);
            };
            search.addEventListener("input",()=>{
                replacement=null;correct.disabled=true;selected.innerHTML="";invalidatePreview();
                const q=toSafeString(search.value).trim();
                const items=q?nrV2FindOrderMatches(q).slice(0,8):[];
                matches.innerHTML=items.length?items.map((item,i)=>`<button type="button" data-admin-match="${i}">${nrV2ItemSummary(item,esc)}</button>`).join(""):q?`<div class="needsReviewNoMatches">No matching item in the current Active Order.</div>`:"";
                matches.querySelectorAll("[data-admin-match]").forEach(button=>button.addEventListener("click",()=>{
                    replacement=items[Number(button.dataset.adminMatch)]||null;
                    invalidatePreview();
                    matches.querySelectorAll("button").forEach(result=>result.classList.toggle("selected",result===button));
                    if(replacement){selected.innerHTML=`<div class="needsReviewMappingCompare"><span>OLD</span><strong>${esc(currentMapping.itemCode)} — ${esc(currentMapping.itemName||"Unnamed item")}</strong><span>NEW</span><strong>${esc(replacement.itemCode)} — ${esc(replacement.itemName)}</strong></div>`;correct.disabled=false;}
                }));
            });
            reason.addEventListener("input",invalidatePreview);
            correct.addEventListener("click",async()=>{
                const why=toSafeString(reason.value).trim();
                if(!replacement){showToast?.("Select the corrected item first","warning");return;}
                if(!why){showToast?.("A correction reason is required","warning");reason.focus();return;}
                const signature=previewSignature("CORRECT",why);
                correct.disabled=true;overlay.dataset.busy="1";
                try{
                    if(!pendingLifecycle||pendingLifecycle.signature!==signature){
                        const preview=await previewPharmacyLearnedGTINLifecycleV3(currentMapping.gtin,"CORRECT",replacement.itemCode);
                        if(!preview?.mapping?.id||!preview?.mapping?.revision) throw new Error("Lifecycle preview is incomplete");
                        pendingLifecycle={preview,operationId:createLearnedGTINLifecycleOperationId(),signature};
                        renderImpact(preview);correct.textContent="Confirm Correction";overlay.dataset.confirming="1";
                    }else{
                        await correctPharmacyLearnedGTIN(pendingLifecycle.preview,replacement.itemCode,replacement.itemName,why,pendingLifecycle.operationId);
                        currentMapping=await getPharmacyLearnedGTINRecord(currentMapping.gtin,{strict:true});
                        if(!currentMapping) throw new Error("Corrected mapping could not be reloaded");
                        replacement=null;pendingLifecycle=null;overlay.dataset.confirming="";renderMaintenance();showToast?.("Pharmacy learned GTIN mapping corrected","success");
                    }
                }
                catch(error){correct.disabled=false;showToast?.(error?.message||"Unable to correct mapping","error");}
                finally{overlay.dataset.busy="";correct.disabled=!replacement;}
            });
            workspace.querySelector("[data-admin-remove]").addEventListener("click",async event=>{
                const why=toSafeString(reason.value).trim();
                if(!why){showToast?.("A removal reason is required","warning");reason.focus();return;}
                const button=event.currentTarget;
                button.disabled=true;overlay.dataset.busy="1";
                try{
                    const signature=previewSignature("REMOVE",why);
                    if(!pendingLifecycle||pendingLifecycle.signature!==signature){
                        const preview=await previewPharmacyLearnedGTINLifecycleV3(currentMapping.gtin,"REMOVE");
                        if(!preview?.mapping?.id||!preview?.mapping?.revision) throw new Error("Lifecycle preview is incomplete");
                        pendingLifecycle={preview,operationId:createLearnedGTINLifecycleOperationId(),signature};
                        renderImpact(preview);button.textContent="Confirm Remove Mapping";overlay.dataset.confirming="1";
                    }else{
                        await removePharmacyLearnedGTIN(pendingLifecycle.preview,why,pendingLifecycle.operationId);
                        currentMapping=null;pendingLifecycle=null;overlay.dataset.confirming="";workspace.innerHTML="<div class=\"needsReviewAdminSuccess\">Pharmacy learned mapping removed. Global GTIN Master was not changed. A future unresolved scan can create Needs Review.</div>";showToast?.("Pharmacy learned GTIN mapping removed","success");
                    }
                }
                catch(error){button.disabled=false;showToast?.(error?.message||"Unable to remove mapping","error");}
                finally{overlay.dataset.busy="";button.disabled=false;}
            });
        };
        gtinInput.addEventListener("input",()=>{pendingLifecycle=null;overlay.dataset.confirming="";workspace.innerHTML="";currentMapping=null;replacement=null;});
        overlay.querySelector("[data-admin-load]").addEventListener("click",async event=>{
            const gtin=normalizeGTIN(gtinInput.value);
            if(!gtin){showToast?.("Enter a valid GTIN","warning");return;}
            event.currentTarget.disabled=true;
            try{currentMapping=await getPharmacyLearnedGTINRecord(gtin);if(!currentMapping){workspace.innerHTML="<div class=\"needsReviewNoMatches\">No pharmacy learned mapping exists for this GTIN.</div>";return;}renderMaintenance();}
            catch(error){showToast?.(error?.message||"Unable to load learned mapping","error");}
            finally{event.currentTarget.disabled=false;}
        });
    }

    overlay.addEventListener("keydown",event=>{
        if(event.key!=="Escape"||overlay.dataset.busy==="1") return;
        if(document.getElementById("needsReviewPhotoViewer")){closeNeedsReviewPhotoViewer();event.stopPropagation();return;}
        closePanel();
    });
}

window.refreshNeedsReviewCounters=refreshNeedsReviewCounters;

/* B11: lightweight cross-device Needs Review awareness.
   Full review rows are fetched only when the PC panel is opened; the watcher
   asks Supabase for a tiny count so a Handheld submission becomes visible on
   the PC without refreshing the whole workspace. */
let needsReviewCloudWatchTimer=null;
let needsReviewCloudWatchBusy=false;
let needsReviewCloudLastReadAt=0;
async function refreshNeedsReviewCountFromCloud({force=false}={}){
    if(window.PharmFlowIdleSleep?.active) return;
    if(typeof isLikelyZebraDevice==="function" && isLikelyZebraDevice()) return;
    if(document.hidden || needsReviewCloudWatchBusy || typeof nrV2Count!=="function") return;
    const now=Date.now();
    /* B10 Clean20 — Needs Review awareness remains live, but idle PC tabs no
       longer hit Supabase every 6 seconds. Focus/visibility calls are also
       deduped so mobile browsers cannot double-fire the same count request. */
    if(!force && now-needsReviewCloudLastReadAt<25000) return;
    needsReviewCloudWatchBusy=true;
    needsReviewCloudLastReadAt=now;
    try{
        const count=await nrV2Count("RECEIVING");
        setElementText(document.getElementById("receivingNeedsReviewCount"),count);
        document.getElementById("btnReceivingNeedsReview")?.classList.toggle("hasItems",count>0);
    }catch(error){
        Logger?.warn?.("Needs Review count sync failed",error);
    }finally{
        needsReviewCloudWatchBusy=false;
    }
}
function startNeedsReviewCloudWatch(){
    if(typeof isLikelyZebraDevice==="function" && isLikelyZebraDevice()) return;
    clearInterval(needsReviewCloudWatchTimer);
    refreshNeedsReviewCountFromCloud({force:true});
    needsReviewCloudWatchTimer=setInterval(refreshNeedsReviewCountFromCloud,30000);
}
window.startNeedsReviewCloudWatch=startNeedsReviewCloudWatch;
window.addEventListener("focus",()=>refreshNeedsReviewCountFromCloud());
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) refreshNeedsReviewCountFromCloud(); });
setTimeout(startNeedsReviewCloudWatch,1200);
window.openNeedsReviewPanel=openNeedsReviewPanel;

function refreshOrderScopeControl(){
    const host=document.querySelector('.currentReceivingCard, .dashboardWorkspaceCard, .dashboardHeader') || document.querySelector('#dashboardPage');
    if(!host) return;
    let wrap=document.getElementById('orderScopeControl');
    if(!wrap){
        wrap=document.createElement('div'); wrap.id='orderScopeControl'; wrap.className='orderScopeControl';
        host.appendChild(wrap);
    }
    const files=Array.isArray(AppState.workspace?.orderFiles)?AppState.workspace.orderFiles:[];
    const orders=Array.from(new Set(files.map(f=>normalizeOrderNumber(f.documentId||f.orderNumber||'')).filter(Boolean)));
    const current=getActiveOrderScope();
    if(current!=='ALL' && !orders.includes(current)) window.PharmFlowOrderScope='ALL';
    wrap.innerHTML=`<label>Order View</label><select id="orderScopeSelect"><option value="ALL">All Active Orders</option>${orders.map(o=>`<option value="${escapeHtml(o)}" ${getActiveOrderScope()===o?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select>`;
    wrap.querySelector('select').onchange=e=>{ window.PharmFlowOrderScope=e.target.value||'ALL'; refreshDashboard(); refreshOpenKpiPanel(); };
}

AppEvents.on('workspace:saved',()=>setTimeout(refreshOrderScopeControl,0));
AppEvents.on('receiving:updated',()=>setTimeout(refreshOrderScopeControl,0));
window.addEventListener('auth:context-ready',()=>setTimeout(refreshOrderScopeControl,250));
setTimeout(refreshOrderScopeControl,800);
function setupPhase263ActionDelegation(){
    if(document.documentElement.dataset.phase263ActionsBound==="1") return;
    document.documentElement.dataset.phase263ActionsBound="1";
    document.addEventListener("click",event=>{
        /* Phase 2C.7.6: Dashboard Search Item and Receiving Search are one
           workflow. Capture binding prevents an older page-specific handler
           from opening a different/stale search implementation. */
        const unifiedSearch=event.target.closest?.("#btnReceivingSearch");
        if(unifiedSearch){
            event.preventDefault();
            event.stopImmediatePropagation?.();
            openItemSearchModal();
            return;
        }
        const received=event.target.closest?.("#btnReceivedItems");
        if(received){event.preventDefault();openDashboardKpiPanel("received");return;}
    },true);
}


/* =====================================================
   PHASE 2C.6.2 — DATA HEALTH + MULTI-ORDER CONTROL
===================================================== */
function openCurrentMissingGTINPanel(){
    const rows=typeof getItemsWithoutMapping==="function"?getItemsWithoutMapping():[];
    document.getElementById("currentMissingGTINOverlay")?.remove();
    const overlay=document.createElement("div");overlay.id="currentMissingGTINOverlay";overlay.className="quickKpiOverlay";
    const esc=typeof escapeHTML==="function"?escapeHTML:(v=>String(v??""));
    overlay.innerHTML=`<div class="quickKpiPanel"><div class="quickKpiHeader"><h3>Missing GTIN — Current Workspace</h3><button type="button" class="quickKpiClose" data-close>✕</button></div>${rows.length?`<table class="quickKpiTable"><thead><tr><th>Item Code</th><th>Item Name</th><th>Ordered</th></tr></thead><tbody>${rows.map(i=>`<tr><td>${esc(i.itemCode)}</td><td><b>${esc(i.itemName)}</b></td><td>${toNumber(i.orderedQty,0)}</td></tr>`).join("")}</tbody></table>`:`<div class="quickKpiEmpty">No missing GTIN items in the current workspace.</div>`}</div>`;
    document.body.appendChild(overlay);overlay.querySelector('[data-close]').onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
}

async function requestRemoveActiveOrderFile(fileId){
    const files=Array.isArray(AppState?.workspace?.orderFiles)?AppState.workspace.orderFiles:[];
    const file=files.find(f=>f.id===fileId);
    if(!file)return;

    const orderNumber=typeof normalizeOrderNumber==="function"
        ? normalizeOrderNumber(file.documentId||file.orderNumber||"")
        : toSafeString(file.documentId||"");
    if(!orderNumber){
        showToast("Unable to identify this active Order Number","error");
        return;
    }

    /* B10 Clean 8 — REMOVE is a structural, order-scoped operation.
       Source contribution comes from the active file's embedded sourceRows
       first. This is the same source used by order/report filtering and avoids
       relying on a historical/server snapshot that may be absent or delayed. */
    let sourceRows=[];
    try{
        sourceRows=typeof getWorkspaceOrderSourceRows==="function"
            ? (getWorkspaceOrderSourceRows(orderNumber)||[])
            : [];
    }catch(_){ sourceRows=[]; }
    if(!sourceRows.length){
        try{
            sourceRows=typeof getOriginalUploadedOrderSnapshot==="function"
                ? (await getOriginalUploadedOrderSnapshot(orderNumber)||[])
                : [];
        }catch(_){ sourceRows=[]; }
    }

    const targetMembership=(item)=>{
        const memberships=(Array.isArray(item?.orderNumbers)?item.orderNumbers:[])
            .map(normalizeOrderNumber)
            .filter(Boolean);
        return memberships.includes(orderNumber);
    };

    /* Transactions created by older builds did not always stamp orderNumber.
       If an item belongs to exactly one active order, attribution is still
       deterministic and safe. Shared-item transactions without an explicit
       order are deliberately NOT guessed. */
    const activeOrders=files
        .map(f=>normalizeOrderNumber(f.documentId||f.orderNumber||""))
        .filter(Boolean);
    const perOrderTransactions=(Array.isArray(AppState?.workspace?.receivingHistory)
        ? AppState.workspace.receivingHistory
        : []).filter(tx=>{
            const explicit=normalizeOrderNumber(tx?.selectedOrderNumber||tx?.orderNumber||tx?.orderId||"");
            if(explicit)return explicit===orderNumber;
            const item=typeof getItemByCode==="function"?getItemByCode(normalizeItemCode(tx?.itemCode||"")):null;
            const memberships=(Array.isArray(item?.orderNumbers)?item.orderNumbers:[])
                .map(normalizeOrderNumber)
                .filter(n=>activeOrders.includes(n));
            return memberships.length===1 && memberships[0]===orderNumber;
        });

    const receivedUnits=perOrderTransactions.reduce((sum,tx)=>sum+Number(tx?.quantity||0),0);
    const reviewRows=await loadNeedsReviewRows("RECEIVING",orderNumber).catch(()=>[]);
    const hasOperationalData=Math.abs(receivedUnits)>0 || reviewRows.length>0;
    const message=hasOperationalData
        ? `Remove ${orderNumber}?\n\nThis permanently removes THIS active order from Receiving, including its receiving quantities/scans and unresolved Needs Review cases. Other active orders are not affected.`
        : `Remove ${orderNumber} from Active Receiving?\n\nOther active orders are not affected.`;

    showConfirmModal("Remove Active Order",message,async()=>{
        try{
            showLoading("Removing order...");

            if(typeof authRpc!=="function" || typeof AuthState==="undefined" || !AuthState.context?.pharmacy_id){
                throw new Error("Pharmacy cloud context is unavailable. Sign in again before removing the order.");
            }
            if(!sourceRows.length){
                throw new Error("Order source data could not be resolved safely. No data was removed.");
            }

            /* Server structural authority first. If this fails, local state is
               untouched and no success message can be shown. */
            await authRpc("discard_pharmflow_active_order",{
                p_pharmacy_id:AuthState.context.pharmacy_id,
                p_order_number:orderNumber,
                p_confirmation:orderNumber
            });

            /* Temporary review evidence belongs to this active order only. */
            for(const row of reviewRows){
                try{
                    if(row?.photo_path && typeof nrV2DeletePhoto==="function")await nrV2DeletePhoto(row.photo_path);
                    if(row?.review_id && typeof nrV2Delete==="function")await nrV2Delete(row.review_id);
                }catch(reviewError){
                    Logger.warn?.("Temporary review cleanup failed after active-order removal",reviewError);
                }
            }

            /* Remove received contribution first, then ordered contribution. */
            perOrderTransactions.forEach(tx=>{
                const item=typeof getItemByCode==="function"?getItemByCode(normalizeItemCode(tx?.itemCode||"")):null;
                if(!item)return;
                item.receivedQty=Math.max(0,Number(item.receivedQty||0)-Number(tx?.quantity||0));
                if(typeof updateItemCalculatedFields==="function")updateItemCalculatedFields(item);
            });

            sourceRows.forEach(row=>{
                const code=normalizeItemCode(row?.item_code||row?.itemCode||"");
                const item=typeof getItemByCode==="function"?getItemByCode(code):null;
                if(!item)return;
                item.orderedQty=Math.max(0,Number(item.orderedQty||0)-Number(row?.ordered_qty??row?.orderedQty??0));
                if(Array.isArray(item.orderNumbers)){
                    item.orderNumbers=item.orderNumbers.filter(n=>normalizeOrderNumber(n)!==orderNumber);
                }
                if(normalizeOrderNumber(item.orderNumber||"")===orderNumber){
                    const surviving=(item.orderNumbers||[]).map(normalizeOrderNumber).filter(Boolean);
                    item.orderNumber=surviving[0]||"";
                }
                if(typeof updateItemCalculatedFields==="function")updateItemCalculatedFields(item);
            });

            AppState.workspace.receivingHistory=(AppState.workspace.receivingHistory||[])
                .filter(tx=>!perOrderTransactions.includes(tx));
            AppState.workspace.orderFiles=files.filter(f=>f.id!==fileId);
            AppState.workspace.orderData=(AppState.workspace.orderData||[]).filter(item=>
                !(Number(item.orderedQty||0)<=0 && Number(item.receivedQty||0)<=0 && item.manual!==true)
            );

            const remaining=AppState.workspace.orderFiles
                .map(f=>normalizeOrderNumber(f.documentId||f.orderNumber||""))
                .filter(Boolean);
            AppState.workspace.selectedOrderNumbers=remaining.slice();
            AppState.workspace.selectedOrderNumber=remaining.length===1?remaining[0]:(remaining.length?"ALL":"");
            AppState.workspace.orderName=remaining.length===1?remaining[0]:(remaining.length?remaining.join(" + "):"");
            AppState.workspace.active=remaining.length>0;

            if(typeof ReceivingEngine!=="undefined"){
                ReceivingEngine.recentScans=(ReceivingEngine.recentScans||[]).filter(tx=>{
                    const explicit=normalizeOrderNumber(tx?.selectedOrderNumber||tx?.orderNumber||tx?.orderId||"");
                    if(explicit)return explicit!==orderNumber;
                    const item=typeof getItemByCode==="function"?getItemByCode(normalizeItemCode(tx?.itemCode||"")):null;
                    return !targetMembership(item);
                });
                const last=ReceivingEngine.lastTransaction;
                const lastOrder=normalizeOrderNumber(last?.selectedOrderNumber||last?.orderNumber||last?.orderId||"");
                if(lastOrder===orderNumber)ReceivingEngine.lastTransaction=null;
            }

            if(typeof rebuildStateIndexes==="function")rebuildStateIndexes();
            if(typeof recalculateStatistics==="function")recalculateStatistics();

            /* Local persistence does not announce a separate "Workspace saved"
               toast. More importantly, REMOVE must update the full cloud
               workspace even when the last order was removed. Normal autosave
               intentionally skips empty workspaces and was the root cause of
               the deleted order being hydrated back into Manage Orders. */
            if(typeof saveWorkspaceSnapshot==="function")saveWorkspaceSnapshot();

            if(typeof syncReceivingStructureAfterChange!=="function"){
                throw new Error("Structural receiving synchronization is unavailable. Reload and try again.");
            }
            const structureSaved=await syncReceivingStructureAfterChange("Active order removal synchronized");
            if(structureSaved!==true){
                throw new Error("The server did not confirm removal from the Active Order Manifest. No success was recorded. Reload before continuing.");
            }

            /* Re-read the structural authority before success. This prevents a
               stale Active Order Manifest from silently re-hydrating the order
               after the green toast. Empty server state is authoritative. */
            if(typeof pullActiveOrderManifest==="function"){
                await pullActiveOrderManifest({clearIfMissing:remaining.length===0});
            }
            if(typeof verifyActiveOrderManifestMatchesLocal==="function"){
                const verified=await verifyActiveOrderManifestMatchesLocal();
                if(verified!==true){
                    throw new Error("Active Order removal verification failed. Reload before continuing.");
                }
            }

            if(typeof refreshOrderLifecycleRegistry==="function")await refreshOrderLifecycleRegistry();
            if(typeof refreshEntireUI==="function")refreshEntireUI();
            if(typeof refreshNeedsReviewCounters==="function")await refreshNeedsReviewCounters();

            showToast(
                `${orderNumber} removed successfully. ${remaining.length} active order(s) remain.`,
                "success",
                9000
            );
        }catch(error){
            Logger.error("Remove active order failed",error);
            showToast(error?.message||"Unable to remove order","error",10000);
        }finally{
            hideLoading();
        }
    });
}

/* PharmFlow 2C.9 — handheld quantity semantics.
   Manual entry is ADDITIONAL quantity, not total quantity. */
function refreshHandheldQuantityGuidance(){
    const hint=document.getElementById("handheldQtyHint");
    if(!hint) return;
    const receivedEl=document.getElementById("lastReceived");
    const remainingEl=document.getElementById("lastRemaining");
    const deviceEl=document.getElementById("lastThisPcQty") || document.getElementById("lastThisDeviceQty");
    const d=deviceEl ? (deviceEl.textContent||"0").trim() : "0";
    const r=remainingEl ? (remainingEl.textContent||"0").trim() : "0";
    hint.textContent=`Scanned on this device: ${d} • Remaining to order: ${r}`;
}

if(typeof AppEvents!=="undefined"&&AppEvents?.on){
    AppEvents.on("route:changed",payload=>{
        setTimeout(()=>{
            ensureNeedsReviewButtons();
            refreshNeedsReviewCounters();
            if(payload?.routeName==="expiry"){
                refreshNeedsReviewCounters();
            }
        },30);
    });
    AppEvents.on("receiving:updated",()=>setTimeout(refreshNeedsReviewCounters,30));
}


if(typeof AppEvents !== "undefined"){
    try{
        AppEvents.on?.("workspace:updated",()=>setTimeout(()=>ensurePcClearScreenButton?.(),20));
        AppEvents.on?.("receiving:updated",()=>setTimeout(()=>ensurePcClearScreenButton?.(),20));
        AppEvents.on?.("scan:processed",()=>setTimeout(()=>ensurePcClearScreenButton?.(),20));
    }catch(_){}
}
