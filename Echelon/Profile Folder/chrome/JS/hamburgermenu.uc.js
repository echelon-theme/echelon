// ==UserScript==
// @name         Silverfox Hamburger Menu
// @version      1.0
// @description  Creates Hamburger Menu with its contents and functions
// @author       florin
// ==/UserScript==

function createAppMenuButton() {
    try {
        var buttonText = Services.appinfo.name;

        CustomizableUI.createWidget({
            id: "appmenu-button",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            removable: false,
            label: buttonText,
            onCommand: function () {
                addToBookmarksBar();
            },
            onCreated: function (button) {
                return button;
            },
        });
    }
    catch (e) {
        Components.utils.reportError(e);
    }
}