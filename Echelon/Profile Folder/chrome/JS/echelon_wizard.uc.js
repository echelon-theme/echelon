// ==UserScript==
// @name			Echelon :: Wizard
// @description 	Opens the Echelon Wizard on first-time installs
// @author			Travis
// @include         main
// ==/UserScript==

waitForElement("#mainPopupSet").then(mainPopupSet => {
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
});

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

// set default echelon settings
function setDefaultSettings() {
    let defaultEchelonConfig = {
        0: {
            "name": "Echelon.Appearance.Blue",
            "type": "bool",
            "value": true
        },
        1: {
            "name": "Echelon.Appearance.Preset",
            "type": "int",
            "value": "0"
        },
        2: {
            "name": "Echelon.Appearance.Style",
            "type": "int",
            "value": "0"
        },
        3: {
            "name": "Echelon.Appearance.systemStyle",
            "type": "string",
            "value": ""
        },
        4: {
            "name": "Echelon.Appearance.Homepage.Style",
            "type": "int",
            "value": "0"
        },
        5: {
            "name": "Echelon.Appearance.overrideHomepagePreset",
            "type": "bool",
            "value": false
        },
        6: {
            "name": "Echelon.Homepage.HideCustomSnippets",
            "type": "bool",
            "value": false
        },
        7: {
            "name": "Echelon.Option.HideUnifiedExtensions",
            "type": "bool",
            "value": false
        },
        8: {
            "name": "Echelon.Option.Branding",
            "type": "string",
            "value": "firefox"
        },
        9: {
            "name": "Echelon.Appearance.TabsOnTop",
            "type": "bool",
            "value": true
        },
        10: {
            "name": "Echelon.Appearance.disableChrome",
            "type": "bool",
            "value": true
        },

        // general browser tweaks
        11: {
            "name": "ui.systemUsesDarkMode",
            "type": "int",
            "value": "0"
        },
        12: {
            "name": "browser.theme.dark-private-windows",
            "type": "bool",
            "value": false
        },
        13: {
            "name": "toolkit.legacyUserProfileCustomizations.stylesheets",
            "type": "bool",
            "value": true
        },
        14: {
            "name": "browser.theme.dark-private-windows",
            "type": "bool",
            "value": false
        },
        15: {
            "name": "browser.privateWindowSeparation.enabled",
            "type": "bool",
            "value": false
        },
        16: {
            "name": "browser.display.windows.non_native_menus",
            "type": "int",
            "value": "0"
        },
        17: {
            "name": "widget.non-native-theme.enabled",
            "type": "bool",
            "value": false
        },
        18: {
            "name": "browser.tabs.hoverPreview.enabled",
            "type": "bool",
            "value": false
        },
        19: {
            "name": "browser.tabs.tabmanager.enabled",
            "type": "bool",
            "value": false
        },
        20: {
            "name": "browser.menu.showViewImageInfo",
            "type": "bool",
            "value": true
        },
        21: {
            "name": "browser.newtab.preload",
            "type": "bool",
            "value": false
        },

        // r3dfox exclusives
        22: {
            "name": "r3dfox.caption.text.color",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        23: {
            "name": "r3dfox.colors.enabled",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        24: {
            "name": "r3dfox.customizations.enabled",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        25: {
            "name": "r3dfox.force.transparency",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        26: {
            "name": "r3dfox.transparent.menubar",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        27: {
            "name": "r3dfox.translucent.navbar",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        },
        28: {
            "name": "r3dfox.aero.fog",
            "type": "bool",
            "value": false,
            "exclusive": ["r3dfox", "r3dfox_esr", "plasmafox"]
        }
    }

    for (const config of Object.keys(defaultEchelonConfig)) {
        if (defaultEchelonConfig[config].name) {
            if (defaultEchelonConfig[config].type == "bool") {
                PrefUtils.trySetBoolPref(defaultEchelonConfig[config].name, defaultEchelonConfig[config].value);
            } else
            if (defaultEchelonConfig[config].type == "int") {
                PrefUtils.trySetIntPref(defaultEchelonConfig[config].name, defaultEchelonConfig[config].value);
            } else
            if (defaultEchelonConfig[config].type == "string") {
                PrefUtils.trySetStringPref(defaultEchelonConfig[config].name, defaultEchelonConfig[config].value);
            }
        }

        if (Array.isArray(defaultEchelonConfig[config].exclusive)) {
            for (const browser of defaultEchelonConfig[config].exclusive) {
                if (AppConstants.MOZ_APP_NAME == browser) {
                    PrefUtils.trySetBoolPref(defaultEchelonConfig[config].name, defaultEchelonConfig[config].value);
                }
            }
        }
    }
}

window.addEventListener("load", () => {
    if (!PrefUtils.tryGetBoolPref("Echelon.parameter.isFirstRunFinished")) {
        setDefaultSettings();
        showEchelonWizard();
    }
});