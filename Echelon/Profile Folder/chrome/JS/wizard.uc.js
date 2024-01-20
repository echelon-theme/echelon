// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// @include			main
// ==/UserScript==

function openEchelonWizardWindow(verifyFirstRun) {
    if (verifyFirstRun) {
        let isEchelonFirstRunFinished = false;
        try {
            isEchelonFirstRunFinished = Services.prefs.getBoolPref("Echelon.parameter.isFirstRunFinished");
        } catch (error) {}
        
        if (!isEchelonFirstRunFinished) {
            Services.prefs.setBoolPref('Echelon.parameter.isFirstRunFinished', false)

            launchEchelonWizard();
        }
    } else {
        launchEchelonWizard();
    }
}

function launchEchelonWizard() {
    var features = "chrome,centerscreen,resizeable=no,dependent,modal";
    window.openDialog('chrome://userchrome/content/windows/echelonWizard/echelonWizard.xhtml', "Set Up Echelon", features); 
};