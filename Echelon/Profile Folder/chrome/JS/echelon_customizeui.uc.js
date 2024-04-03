// ==UserScript==
// @name			Echelon :: Customize UI
// @description 	Changes Customize UI layout to be more accurate to Australis
// @author			Travis
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    waitForElement("#customization-footer").then((e) => {
        document.querySelector("#customization-content-container").appendChild(document.querySelector("#customization-footer"));
    });
}