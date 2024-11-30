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
            let echelonTabBackground = MozXULElement.parseXULToFragment(`
                <hbox class="tab-background-start" />
                <hbox class="tab-background-middle" />
                <hbox class="tab-background-end" />
            `);
            
            // Tab Background for Australis
            let tabBackgroundElm = tab.querySelector(".tab-background");
            if (!tab.querySelector(".tab-background-start"))
            {
                tabBackgroundElm.prepend(echelonTabBackground);
            }

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