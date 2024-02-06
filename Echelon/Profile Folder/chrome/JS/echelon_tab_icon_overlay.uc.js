// ==UserScript==
// @name			Echelon :: Tab Icon Overlay
// @description 	Moves the tab icon overlay out of the tab icon stack, like before Proton.
// @author			aubymori
// @include			main
// ==/UserScript==

waitForElement("#tabbrowser-arrowscrollbox").then(e => {
    function updateTabs()
    {
        for (tab of e.children)
        {
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