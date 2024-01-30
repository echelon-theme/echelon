// Script to self-refresh the tab name. This is required with the replacement hack.
(async function() {
    if (windowRoot?.ownerGlobal?.gBrowser)
    {
        while (null == windowRoot.ownerGlobal.gBrowser.getTabForBrowser(browser))
        {
            await new Promise(r => requestAnimationFrame(r));
            
            try
            {
                var browser = windowRoot.ownerGlobal.gBrowser.getBrowserForOuterWindowID(window.browsingContext.currentWindowContext.outerWindowId);
                var tab = windowRoot.ownerGlobal.gBrowser.getTabForBrowser(browser);
                windowRoot.ownerGlobal.gBrowser.setTabTitle(tab);
            }
            catch (e) {}
        }
    }
})();