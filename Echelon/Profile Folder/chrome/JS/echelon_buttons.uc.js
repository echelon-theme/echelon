// ==UserScript==
// @name			Echelon :: Add to Bookmarks button
// @description 	Adds back "Add to Bookmarks" button for Australis.
// @author			Travis
// @include			main
// ==/UserScript==

function createAddToBookmarks() {

try {
    var buttonText = "Bookmarks";

    CustomizableUI.createWidget({
        id: "bookmarks-button",
        defaultArea: CustomizableUI.AREA_NAVBAR,
        removable: true,
        label: buttonText,
        tooltiptext: "Bookmark this page",
        onCommand: function() {
            addToBookmarksBar();
        },
        onCreated: function(button) {
            return button;
        },
    });
}
catch (e) {
    Components.utils.reportError(e);
};

};

function addToBookmarksBar() {
    var bookmarksSvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    bookmarksSvc.insertBookmark(3, gBrowser.currentURI, bookmarksSvc.DEFAULT_INDEX, window.document.title);
}