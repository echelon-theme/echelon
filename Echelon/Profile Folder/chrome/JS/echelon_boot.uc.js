// ==UserScript==
// @name			Echelon :: Functions Loader
// @description 	Loads resources required for Echelon.
// @author			Travis
// @include			main
// @loadOrder       14
// ==/UserScript==

var { PrefUtils, BrandUtils, waitForElement, renderElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
waitForElement = waitForElement.bind(this);
renderElement = renderElement.bind(this);

function executeFunctions() {
	EchelonThemeManager.init();
	openEchelonWizardWindow(true);

	window.addEventListener("echelon-reopen-wizard", function(e) {
		// Kill the wizard notification early. Technically, it will disappear as soon as this
		// callback ends, but it looks bad.
		gBrowser?.getNotificationBox()?.getNotificationWithValue("echelon-setup-closed")?.dismiss();
		openEchelonWizardWindow(false);
	});

    console.info("Functions executed.");
}

window.addEventListener("load", executeFunctions);