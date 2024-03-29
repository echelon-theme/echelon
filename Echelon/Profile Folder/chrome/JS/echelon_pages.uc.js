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
        "config": "chrome://userchrome/content/pages/config/config.xhtml",
        "echelon": "chrome://userchrome/content/windows/options/options.xhtml",
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