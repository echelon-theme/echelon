// ==UserScript==
// @name			Echelon :: About Item
// @description 	Changes the About item text to match brand name.
// @author			aubymori
// @include			main
// ==/UserScript===

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    waitForElement("#aboutName").then(e => {
        e.label = `About ${BrandUtils.getShortProductName()}`;
    });
}