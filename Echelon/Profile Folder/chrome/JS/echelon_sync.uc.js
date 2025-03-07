// ==UserScript==
// @name			Echelon :: Sync
// @description 	Adds attributes to the Firefox account button for styling purposes.
// @author			Travis
// @include			main
// ==/UserScript==

var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
waitForElement = waitForElement.bind(window);

function isFxaEnabled() {
    if (PrefUtils.tryGetBoolPref("identity.fxaccounts.enabled", false) == true)
    {
        refreshFxaButton();
    }
}

function refreshFxaButton()
{
    let state = UIState.get();

    const status = state.syncing;

    if (status == true) {
        console.log("Syncing....");
        waitForElement("#fxa-toolbar-menu-button").then((e) => {
            e.setAttribute("status", "active");
        });

    } else if (status == false) {
        console.log("NOT syncing");
        // make you see the animation for longer haha fuck you
        waitForElement("#fxa-toolbar-menu-button").then((e) => {
            setTimeout(() => e.removeAttribute("status"), 2000);
        });
    }
}

Services.obs.addObserver(isFxaEnabled, "sync-ui-state:update");
