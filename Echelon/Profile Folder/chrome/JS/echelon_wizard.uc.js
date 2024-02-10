// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// @backgroundmodule
// ==/UserScript==

this.EXPORTED_SYMBOLS = ["openEchelonWizardWindow"];

let openEchelonWizardWindow;
{
    let { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

    openEchelonWizardWindow = function(verifyFirstRun) {
        if (verifyFirstRun) {
            let isEchelonFirstRunFinished = PrefUtils.tryGetBoolPref("Echelon.parameter.isFirstRunFinished");
            
            if (!isEchelonFirstRunFinished) {
                PrefUtils.trySetBoolPref('Echelon.parameter.isFirstRunFinished', false)

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
}