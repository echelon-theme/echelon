// ==UserScript==
// @name			Echelon :: Add-ons
// @description 	Hides Navigation Bar and Bookmarks if the current tab is about:addons
// @author			Travis
// @include			main
// ==/UserScript==

var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
waitForElement = waitForElement.bind(this);

waitForElement("#browser").then(e => {
    function isAddons() {
        let currentTabURL = gBrowser.currentURI.spec;
    
        if (currentTabURL == "about:addons" || currentTabURL == "about:echelon") {
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
});

