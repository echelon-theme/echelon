// ==UserScript==
// @name			Echelon :: Functions Loader
// @description 	Loads resources required for Echelon.
// @author			Travis
// @include			main
// @loadOrder       11
// ==/UserScript==

const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

function executeFunctions() {
	getAndSetTitleBarHeight();
	createAppMenuButton();
	createAddToBookmarks();
	echelonInitLayout();
	openEchelonWizardWindow(true);
	addEchelonOptionsMenuItem();
	addEchelonTabsOnTopMenuItem();
	observeMenuBar();
	changeTitleFormats();
    console.info("Functions executed.");
}

window.addEventListener("load", function () {
    executeFunctions();  
})	