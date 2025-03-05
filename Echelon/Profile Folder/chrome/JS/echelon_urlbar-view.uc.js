// ==UserScript==
// @name			Echelon :: URLbar Autocomplete
// @description 	Adds additional attributions for styling purposes
// @author			Travis
// @include			main
// ==/UserScript==

function setURLbarViewAttr() {
    let e = gURLBar.view.panel;

    let popupDirection = null;

    if (!e.style.direction) {
        popupDirection = e.ownerGlobal.getComputedStyle(e).direction;
    }

    e.style.removeProperty(`--urlbarView-width`);
    e.style.removeProperty(`margin-left`);

    let documentRect = ownerGlobal.document.documentElement.getBoundingClientRect();
    let width = documentRect.right - documentRect.left;
    e.style.setProperty(
        `--urlbarView-width`,
        width + "px"
    );
    
    let elementRect = e.getBoundingClientRect();
    if (popupDirection == "rtl") {
        let offset = elementRect.right - documentRect.right;
        e.style.marginRight = offset + "px";
    } else {
        let offset =  documentRect.left - elementRect.left;
        e.style.marginLeft = offset + "px";
    }

    let needsHandleOverUnderflow = false;
    let boundToCheck = popupDirection == "rtl" ? "right" : "left";
    let inputRect = e.getBoundingClientRect();
    let startOffset = Math.abs(inputRect[boundToCheck] - documentRect[boundToCheck]);
    let alignSiteIcons = startOffset / width <= 0.3 || startOffset <= 250;
    let margins = null;
    if (alignSiteIcons) {
        // Calculate the end margin if we have a start margin.
        let boundToCheckEnd = popupDirection == "rtl" ? "left" : "right";
        let endOffset = Math.abs(inputRect[boundToCheckEnd] -
            documentRect[boundToCheckEnd]);
        if (endOffset > startOffset * 2) {
            // Provide more space when aligning would result in an unbalanced
            // margin. This allows the location bar to be moved to the start
            // of the navigation toolbar to reclaim space for results.
            endOffset = startOffset;
        }
        let identityIcon = document.getElementById("identity-icon");
        let identityRect =
            identityIcon.getBoundingClientRect();
        let start = popupDirection == "rtl" ?
            documentRect.right - identityRect.right :
            identityRect.left;
        if (!margins || start != margins.start ||
            endOffset != margins.end ||
            width != margins.width) {
            margins = { start, end: endOffset, width };
            needsHandleOverUnderflow = true;
        }
    } else if (margins) {
        // Reset the alignment so that the site icons are positioned
        // according to whatever's in the CSS.
        margins = undefined;
        needsHandleOverUnderflow = true;
    }

    // set attributes
    if (margins) {
        /* eslint-disable no-multi-spaces */
        let paddingInCSS =
            4   // .autocomplete-richlistbox padding-left/right
            + 6   // .ac-site-icon margin-inline-start
            + 16  // .ac-site-icon width
            + 6;  // .ac-site-icon margin-inline-end
        /* eslint-enable no-multi-spaces */
        let actualVal = Math.round(margins.start) - paddingInCSS;
        let actualValEnd = Math.round(margins.end);
        e.style.setProperty("--item-padding-start", actualVal + "px");
        e.style.setProperty("--item-padding-end", actualValEnd + "px");
    } else {
        e.style.removeProperty("--item-padding-start");
        e.style.removeProperty("--item-padding-end");
    }
}

// function adjustHeight() {
//     // Figure out how many rows to show
//     let urlbarResults = document.querySelector("#urlbar-results");
//     let rows = urlbarResults.childNodes;
//     let numRows = rows.length;
// 
//     urlbarResults.style.removeProperty("height");
// 
//     // Default the height to 0 if we have no rows to show
//     let height = 0;
//     if (numRows) {
//         let firstRowRect = rows[0].getBoundingClientRect();
//         let urlbarViewResultsPadding;
// 
//         if (urlbarViewResultsPadding == undefined) {
//             // Get the combined padding top/bottom values of the urlbar results
//             let style = window.getComputedStyle(urlbarResults);
// 
//             let paddingTop = parseInt(style.paddingTop) || 0;
//             let paddingBottom = parseInt(style.paddingBottom) || 0;
//             urlbarViewResultsPadding = paddingTop + paddingBottom;
// 
//             // Calculate the height
//             let lastRowRect = rows[numRows - 1].getBoundingClientRect();
//             height = lastRowRect.bottom - firstRowRect.top + urlbarViewResultsPadding
// 
//             let currentHeight = urlbarResults.getBoundingClientRect().height;
// 
//             urlbarResults.style.height = height + "px";
//         }
//     }
// }

waitForElement("#urlbar-input").then(e => {
    let inputField = e;
    let strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
    let lang = Services.locale.requestedLocale;

    function setOneOffText() {
        if (lang != Services.locale.requestedLocale)
        {
            lang = Services.locale.requestedLocale;
            strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
        }

        let userTypedValue = gBrowser.userTypedValue;
        let searchOneOffs = document.querySelector("#urlbar .search-one-offs");

        let oldOneOffsHeaderXUL = MozXULElement.parseXULToFragment(
        `
            <hbox class="search-panel-header search-panel-current-input search-panel-custom-echelon">
                <label id="searchbar-oneoffheader-search" value="${strings.GetStringFromName("oneoffheader.search")}"/>
                <hbox id="search-panel-searchforwith" class="search-panel-current-input">
                    <label id="searchbar-oneoffheader-before" value="${strings.GetStringFromName("oneoffheader.before")} "/>
                    <label id="searchbar-oneoffheader-searchtext" class="search-panel-input-value" />
                    <label id="searchbar-oneoffheader-after" flex="10000" value=" ${strings.GetStringFromName("oneoffheader.after")}"/>
                </hbox>
                <hbox id="search-panel-searchonengine" class="search-panel-current-input">
                    <label id="searchbar-oneoffheader-beforeengine" value="${strings.GetStringFromName("oneoffheader.beforeengine")} "/>
                    <label id="searchbar-oneoffheader-engine" class="search-panel-input-value" />
                    <label id="searchbar-oneoffheader-afterengine" flex="10000" value=""/>
                </hbox>
            </hbox>
        `);

        if (!document.querySelector(".search-panel-custom-echelon")) {
            searchOneOffs.insertBefore(oldOneOffsHeaderXUL, searchOneOffs.querySelector(".search-panel-one-offs-container"));
            searchOneOffs.querySelector(".search-panel-one-offs-header").setAttribute("hidden", "true");
        }

        let customSearchPanel = document.querySelector(".search-panel-custom-echelon");

        // Set label values
        customSearchPanel.querySelector("#searchbar-oneoffheader-searchtext").setAttribute("value", userTypedValue);

        // Hide all labels by default
        let labels = document.querySelectorAll(".search-panel-custom-echelon > *");
        labels.forEach(label => {
            label.setAttribute("hidden", "true");
        });

        let oneOffsEngines = document.querySelectorAll(".search-panel-one-offs .searchbar-engine-one-off-item");
        oneOffsEngines.forEach(oneOffsEngine => {
            oneOffsEngine.addEventListener("mouseover", function (evt) {
                let oneOffEngineName = JSON.parse(oneOffsEngine.getAttribute("data-l10n-args")).engineName;
                if (!oneOffEngineName) { // fallback
                    oneOffEngineName = oneOffsEngine.getAttribute("tooltiptext");
                }

                document.querySelector("#searchbar-oneoffheader-engine").setAttribute("value", oneOffEngineName);


                customSearchPanel.setAttribute("engine-visible", "true");
            });

            oneOffsEngine.addEventListener("mouseout", function (evt) {
                customSearchPanel.removeAttribute("engine-visible");
            });
        });

        // Show labels depending on mode
        if (userTypedValue != "" && userTypedValue) {
            customSearchPanel.querySelector("#search-panel-searchforwith").removeAttribute("hidden");
        } else {
            customSearchPanel.querySelector("#searchbar-oneoffheader-search").removeAttribute("hidden");
        }
    }

    inputField.addEventListener('input', function (evt) {
        setOneOffText();
        // adjustHeight();
    });

    waitForElement(".search-panel-one-offs-header").then(header => {
        setOneOffText();
    })
});

waitForElement("#urlbar").then(e => {
    urlbar = e;
    let observer = new MutationObserver(setURLbarViewAttr);
    observer.observe(e, { attributes: true, attributeFilter: ["open"] });
});