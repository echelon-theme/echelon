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

    let documentRect = ownerGlobal.document.documentElement.getBoundingClientRect();
    let width = documentRect.right - documentRect.left;
    e.style.setProperty(
        `--urlbarView-width`,
        width + "px"
    );
    
    let elementRect = e.getBoundingClientRect();
    if (elementRect.left != "0") {
        if (popupDirection == "rtl") {
            let offset = elementRect.right - documentRect.right;
            e.style.marginRight = offset + "px";
        } else {
            let offset =  documentRect.left - elementRect.left;
            e.style.marginLeft = offset + "px";
        }
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

waitForElement("#urlbar").then(e => {
    urlbar = e;
    let observer = new MutationObserver(setURLbarViewAttr);
    observer.observe(e, { attributes: true, attributeFilter: ["open"] });
});