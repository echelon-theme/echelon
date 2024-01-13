// ==UserScript==
// @name			Firefox Button
// @description 	Adds back Firefox button.
// @author			Travis
// @include			main
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