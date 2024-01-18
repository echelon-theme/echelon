function createAddToBookmarks() {

try {
    var buttonText = "Bookmarks";

    CustomizableUI.createWidget({
        id: "bookmarks-button",
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