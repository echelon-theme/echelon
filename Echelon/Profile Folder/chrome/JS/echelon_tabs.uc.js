// ==UserScript==
// @name			Echelon :: Tabs
// @description 	Tabs
// @author			Travis
// @include			main
// ==/UserScript==

waitForElement("#tabbrowser-arrowscrollbox").then(e => {

    function updateTabs()
    {
        for (tab of e.children)
        {
            // Tab Icon Overlay
            let overlay = tab.querySelector(".tab-icon-stack .tab-icon-overlay");
            let labelContainer = tab.querySelector(".tab-label-container");
            if (overlay && labelContainer)
            {
                labelContainer.insertAdjacentElement("afterend", overlay);
            }
        }
    }

    let observer = new MutationObserver(updateTabs);
    observer.observe(e, { childList: true });
    updateTabs();
});