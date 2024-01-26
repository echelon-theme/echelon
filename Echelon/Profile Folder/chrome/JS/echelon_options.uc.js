// ==UserScript==
// @name			Echelon :: Options
// @description 	Adds the menu item to launch Echelon's Options window
// @author			aubymori
// @include			main
// ==/UserScript==

function addEchelonOptionsMenuItem()
{
    waitForElement("#menu_ToolsPopup").then((prefsItem) => {
        let echelonPrefsItem = window.MozXULElement.parseXULToFragment(`
            <menuitem id="menu_echelonOptions" oncommand="launchEchelonOptions();" label="Echelon Options" accesskey="E">
                <label class="menu-text" crop="end" aria-hidden="true" value="Echelon Options" accesskey="E" />
                <hbox xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" class="menu-accel-container" aria-hidden="true">
                    <label class="menu-accel" />
                </hbox>
            </menuitem>
        `);
        console.log(echelonPrefsItem);
        prefsItem.append(echelonPrefsItem);
    });
}

function launchEchelonOptions()
{
    window.openDialog(
        "chrome://userchrome/content/windows/echelonOptions/echelonOptions.xhtml",
        "Echelon Options",
        "chrome,centerscreen,resizeable=no,dependent,modal"
    ); 
}