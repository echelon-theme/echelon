// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// @loadOrder       10
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
            <hbox id="echelon-wizard-content">
                <vbox id="echelon-wizard-close-container">
                    <hbox class="echelon-wizard-titlebar-buttons-container">
                        <hbox class="echelon-wizard-titlebar-buttons">
                            <toolbarbutton class="echelon-wizard-titlebar-close" oncommand="window.resetEchelonWizard();">
                            </toolbarbutton>
                        </hbox>
                    </hbox>
                </vbox>
                <vbox id="echelon-wizard-header">
                    <image id="echelon-logo" />
                </vbox>
            </hbox>
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
        }, 1000);
    }

    function resetEchelonWizard() {
        let echelonWizardEl = document.querySelector("#echelon-wizard-container");

        echelonWizardEl.setAttribute("animating", "true");
        echelonWizardEl.setAttribute("animate", "closing");

        setTimeout(() => {
            echelonWizardEl.removeAttribute("animating")
            echelonWizardEl.removeAttribute("animate")
        }, 1000);
    }
}