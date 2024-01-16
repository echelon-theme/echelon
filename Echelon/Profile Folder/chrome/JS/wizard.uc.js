// ==UserScript==
// @name			RinFox Wizard
// @description 	Opens the RinFox Wizard on first-time installs
// @author			Travis
// @include			main
// ==/UserScript==

function launchRinFoxWizard() {
    var features = "chrome,centerscreen,resizeable=no,dependent,modal";
    window.openDialog('chrome://userchrome/content/windows/echelonWizard/echelonWizard.xhtml', "Echelon Set Up", features); 
};