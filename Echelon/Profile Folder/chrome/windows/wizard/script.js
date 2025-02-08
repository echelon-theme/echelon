let currentPage = 0; // Default to the first page
let pageStack = [];

function showPage(pageNumber, pushToStack = true) {
    var pageId = 'page' + pageNumber;
    var selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        // Hide all pages
        var pages = document.querySelectorAll('.wizard-page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.remove('page-selected');
        }

        // Show the selected page
        selectedPage.classList.add('page-selected');
        currentPage = pageNumber; // Update the currentPage variable

		if (pushToStack)
			pageStack.push(pageNumber);
    } else {
        console.error('Page not found: ' + pageId);
    }
}

showPage(currentPage);

document.getElementById("back-button").addEventListener("click", function()
{
	var currentPageNumber = document.querySelector('.page-selected').getAttribute('data-page');
	showPage(currentPageNumber - 1);
});

document.getElementById("next-button").addEventListener("click", function()
{
	var currentPageNumber = document.querySelector('.page-selected').getAttribute('data-page');
	showPage(currentPageNumber - 1 * -1);
});

document.documentElement.addEventListener('keypress', function(e) {
	if (e.key == "Escape") {
		// This must be manually dispatched here:
		onClose();
		window.close();
	}
});

function onClose() {
	// If the user closes the window prematurely, then reset the CustomizableUI layout.
	// This is done to not startle the user and make them think their original layout is lost.
	EchelonLayoutTemplateManager.applyLayout(window.opener, previousCustomizableUiLayout);
	PrefUtils.trySetStringPref("browser.uiCustomization.state");

	// Notify the user that this action can be rectified in the future:
	let root = window.opener;
	let notificationBox = window.opener.gBrowser.getNotificationBox();

	notificationBox.appendNotification(
		"echelon-setup-closed",
		{
			label: "You can restart the Echelon Wizard by restarting Firefox or clicking here.",
			image: "chrome://browser/skin/notification-icons/popup.svg",
			priority: "warning",
			eventCallback: function() {
				alert("hi");
			}
		},
		[
			{
				isDefault: true,
				accessKey: "E",
				label: "Reopen Echelon Wizard",
				callback: function() {
					// Since the window is already closed by this point, we can't do much from
					// within this callback. This hack just bounces the call over to a thread
					// which can do things, from which we handle all the logic from there.
					// I just threw the implementation for this event handler in
					// echelon_boot.uc.js
					root.dispatchEvent(new CustomEvent("echelon-reopen-wizard"));
				}
			}
		]
	);
}

window.addEventListener("close", onClose);