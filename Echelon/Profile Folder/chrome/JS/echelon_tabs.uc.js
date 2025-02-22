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

            let background = tab.querySelector(".tab-background");
            if (background) {
                if (!background.querySelector(".tab-background-start")) {
                    let backgroundXUL = MozXULElement.parseXULToFragment(
                    `
                        <hbox class="tab-background-start" />
                        <hbox class="tab-background-middle" />
                        <hbox class="tab-background-end" />
                    `);
                    background.append(backgroundXUL);
                }
            }
        }
    }

    function _mouseenter()
    {
        let visibleTabs = gBrowser.visibleTabs;

        if (!visibleTabs.length) {
            return;
        }

        let lastVisible = visibleTabs.length;
        let _lastTab = visibleTabs[lastVisible - 1];
        
        _lastTab.setAttribute("beforehovered", "true");
    }

    function _mousedown()
    {
        let visibleTabs = gBrowser.visibleTabs;

        let lastVisible = visibleTabs.length;
        let _lastTab = visibleTabs[lastVisible - 1];
        
        if (_lastTab.hasAttribute("beforehovered")) {
            _lastTab.removeAttribute("beforehovered");
        }
    }

    let observer = new MutationObserver(updateTabs);
    observer.observe(e, { childList: true });
    updateTabs();

    document.querySelector("#tabs-newtab-button").addEventListener("mouseenter", _mouseenter);
    document.querySelector("#tabs-newtab-button").addEventListener("mouseleave", _mousedown);
});