// ==UserScript==
// @name			Echelon :: About Pages
// @description 	Manages the custom about: pages of Echelon.
// @author			aubymori, ephemeralViolette
// @include			main
// ==/UserScript==

{
    const ABOUT_PAGES = {
        "newtab": "chrome://userchrome/content/pages/home/home.xhtml",
        "home": "chrome://userchrome/content/pages/home/home.xhtml",
        "privatebrowsing": "chrome://userchrome/content/pages/privatebrowsing/privatebrowsing.xhtml",
        "echelon": "chrome://userchrome/content/pages/options/options.xhtml",
        "wizard": "chrome://userchrome/content/windows/wizard/wizard.xhtml",
    };
    const { AboutPageManager } = ChromeUtils.importESModule("chrome://modules/content/AboutPageManager.sys.mjs");

    for (const page in ABOUT_PAGES)
    {
        AboutPageManager.registerPage(
            page,
            ABOUT_PAGES[page]
        );
    }
}

// reload pages on echelon style change
function reloadStyledPages() {
    let visibleTabs = gBrowser.visibleTabs;

    for (const tab of visibleTabs) {
        if (gBrowser.getBrowserForTab(tab).currentURI.spec == "about:newtab") {
            gBrowser.getBrowserForTab(tab).reload();
        }
    }
}

const reloadPages = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			reloadStyledPages();
	},
};
Services.prefs.addObserver("Echelon.Appearance.Style", reloadPages, false);
Services.prefs.addObserver("Echelon.Appearance.Homepage.Style", reloadPages, false);