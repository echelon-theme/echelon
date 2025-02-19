// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// ==/UserScript==

let mainPopupSet = document.getElementById("mainPopupSet");
if (mainPopupSet)
{
    let echelonWizard = MozXULElement.parseXULToFragment(
    `
    <hbox id="echelon-wizard-container">
        <vbox id="echelon-wizard-panel">
            <hbox id="echelon-wizard-arrowcontent" hidden="true">
                <image id="echelon-wizard-arrow" />
            </hbox>
            <browser id="echelon-wizard-content" autoscroll="false" disablehistory="true" disablefullscreen="true" src="about:wizard"/>
        </vbox>
    </hbox>
    `);
    mainPopupSet.append(echelonWizard);

    function showEchelonWizard() {
        let echelonWizardEl = document.querySelector("#echelon-wizard-container");
        
        echelonWizardEl.setAttribute("animate", "open");
        echelonWizardEl.setAttribute("animating", "true");

        setTimeout(() => {
            echelonWizardEl.removeAttribute("animating")
            echelonWizardEl.setAttribute("animate", "false")
        }, 550);
    }

    function resetEchelonWizard() {
        // reset selected choices
        PrefUtils.trySetIntPref("Echelon.Appearance.Preset", "0");
        PrefUtils.trySetStringPref("Echelon.Appearance.systemStyle", "");
        PrefUtils.trySetBoolPref("Echelon.Appearance.Blue", false);

        let echelonWizardEl = document.querySelector("#echelon-wizard-container");

        echelonWizardEl.setAttribute("animating", "true");
        echelonWizardEl.setAttribute("animate", "closing");

        setTimeout(() => {
            echelonWizardEl.removeAttribute("animating")
            echelonWizardEl.removeAttribute("animate")
        }, 550);
    }

    function hideEchelonWizard() {
        let echelonWizardEl = document.querySelector("#echelon-wizard-container");

        echelonWizardEl.setAttribute("animating", "true");
        echelonWizardEl.setAttribute("animate", "closing");

        setTimeout(() => {
            echelonWizardEl.removeAttribute("animating")
            echelonWizardEl.removeAttribute("animate")
        }, 550);
    }
}

window.addEventListener("load", () => {
    if (!PrefUtils.tryGetBoolPref("Echelon.parameter.isFirstRunFinished")) {
        showEchelonWizard();
    }
});