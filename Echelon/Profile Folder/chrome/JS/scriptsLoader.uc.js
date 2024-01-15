// ==UserScript==
// @name			Scripts Loader
// @description 	Loads resources required for RinFox
// @author			Travis
// @include			main
// ==/UserScript==

const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

function executeFunctions() {
	getAndSetTitleBarHeight();
	createAppMenuButton();
	createGoButton();
    console.info("Functions executed.");
}

window.addEventListener("load", function () {
    executeFunctions();  
})