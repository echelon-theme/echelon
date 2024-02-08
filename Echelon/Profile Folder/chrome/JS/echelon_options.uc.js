// ==UserScript==
// @name			Echelon :: Options
// @description 	Adds the menu item to launch Echelon's Options window
// @author			aubymori
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    var { EchelonLocalization } = ChromeUtils.import("chrome://modules/content/EchelonLocalization.js");

    let strings = {};
    let lang = Services.locale.requestedLocale;
    let echelonPrefsItem = null;

    function onPopupShowing(event)
    {
        if (lang != Services.locale.requestedLocale)
        {
            lang = Services.locale.requestedLocale;
            EchelonLocalization.getStringsById("menus").then(s => {
                strings = s;
                let item = document.getElementById("menu_echelonOptions");
                if (item)
                {
                    item.label = strings?.echelonOptions?.label;
                    item.accessKey = strings?.echelonOptions?.accessKey;
                }
                item = document.getElementById("toolbar-context-echelonOptions");
                if (item)
                {
                    item.label = strings?.echelonOptions?.label;
                    item.accessKey = strings?.echelonOptions?.accessKey;
                }
            });
        }
    }

    function launchEchelonOptions()
    {
        window.openDialog(
            "chrome://userchrome/content/windows/options/options.xhtml",
            "Echelon Options",
            "chrome,centerscreen,resizeable=no,dependent"
        ); 
    }

    EchelonLocalization.getStringsById("menus").then(s => {
        strings = s;
        echelonPrefsItem = window.MozXULElement.parseXULToFragment(`
            <menuitem oncommand="launchEchelonOptions();" label="${strings?.echelonOptions?.label}" accesskey="${strings?.echelonOptions?.accessKey}"/>
        `).firstChild;

        waitForElement("#menu_ToolsPopup").then((menu) => {
            echelonPrefsItem.id = "menu_echelonOptions";
            menu.append(echelonPrefsItem.cloneNode());
            menu.addEventListener("popupshowing", onPopupShowing);
        });
        waitForElement("#toolbar-context-menu").then((menu) => {
            echelonPrefsItem.id = "toolbar-context-echelonOptions";
            menu.insertBefore(echelonPrefsItem.cloneNode(), document.querySelector(".viewCustomizeToolbar"));
            menu.addEventListener("popupshowing", onPopupShowing);
        });
    });
}