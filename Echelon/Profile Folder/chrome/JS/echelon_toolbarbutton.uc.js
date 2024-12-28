// ==UserScript==
// @name			Echelon :: Rename Toolbar Buttons
// @description 	Renames Toolbar Buttons.
// @author			Travis
// @include			main
// ==/UserScript==

{
    const renameThesejawns = {
        "bookmarks-menu-button": "bookmarks_menu_button",
    };
    
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    let strings = Services.strings.createBundle("chrome://echelon/locale/properties/toolbarbutton.properties");
    let lang = Services.locale.requestedLocale;

    function renameToolbarButton(nodeName, value) {
        if (lang != Services.locale.requestedLocale)
        {
            lang = Services.locale.requestedLocale;
            strings = Services.strings.createBundle("chrome://echelon/locale/properties/toolbarbutton.properties");

            let item = document.getElementById(nodeName);
            if (item) {
                item.setAttribute("label", strings.GetStringFromName(value));
            }
        }
    }
    
    for (const string in renameThesejawns)
    {
        renameToolbarButton(string, renameThesejawns[string]);
    }
}