// ==UserScript==
// @name			Echelon :: Options
// @description 	Adds the menu item to launch Echelon's Options window
// @author			aubymori
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    let strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");
    let lang = Services.locale.requestedLocale;
    let echelonPrefsItem = null;

    function onPopupShowing()
    {
        if (lang != Services.locale.requestedLocale)
        {
            lang = Services.locale.requestedLocale;
            strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");
            let item = document.getElementById("menu_echelonOptions");
            if (item)
            {
                item.label = strings.GetStringFromName("echelon_options_label");
                item.accessKey = strings.GetStringFromName("echelon_options_accesskey");
            }
            item = document.getElementById("toolbar-context-echelonOptions");
            if (item)
            {
                item.label = strings.GetStringFromName("echelon_options_label");
                item.accessKey = strings.GetStringFromName("echelon_options_accesskey");
            }
        }
    }

    function launchEchelonOptions()
    {
        openTrustedLinkIn('about:echelon', 'tab');
    }

    echelonPrefsItem = window.MozXULElement.parseXULToFragment(`
        <menuitem oncommand="launchEchelonOptions();" label="${strings.GetStringFromName("echelon_options_label")}" accesskey="${strings.GetStringFromName("echelon_options_accesskey")}"/>
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
}