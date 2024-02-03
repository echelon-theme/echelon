// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// @include			main
// ==/UserScript==

function openEchelonWizardWindow(verifyFirstRun) {
    if (verifyFirstRun) {
        let isEchelonFirstRunFinished = tryGetBoolPref("Echelon.parameter.isFirstRunFinished");
        
        if (!isEchelonFirstRunFinished) {
            trySetBoolPref('Echelon.parameter.isFirstRunFinished', false)

            launchEchelonWizard();
        }
    } else {
        launchEchelonWizard();
    }
}

function launchEchelonWizard() {
    window.openDialog(
        "chrome://userchrome/content/windows/wizard/wizard.xhtml",
        "Set Up Echelon",
        "chrome,centerscreen,resizeable=no,dependent,modal"
    ); 
};