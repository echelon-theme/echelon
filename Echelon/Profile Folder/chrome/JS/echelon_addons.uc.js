// ==UserScript==
// @name			Echelon :: Add-ons
// @description 	Hides Navigation Bar and Bookmarks if the current tab is about:addons
// @author			Travis
// @include			main
// ==/UserScript==

function isAddons() {
    let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
    let currentTabURL = gBrowser.currentURI.spec;

    if (currentTabURL == "about:addons" || style > ECHELON_LAYOUT_AUSTRALIS) {
        document.documentElement.setAttribute("disablechrome", "true");
    }
    else {
        document.documentElement.removeAttribute("disablechrome");
    }
}

document.addEventListener("TabAttrModified", isAddons, false);
document.addEventListener("TabSelect", isAddons, false);
document.addEventListener("TabOpen", isAddons, false);
document.addEventListener("TabClose", isAddons, false);

document.addEventListener("DOMContentLoaded", isAddons, false);
Services.prefs.addObserver("Echelon.Appearance.Style", isAddons, false);