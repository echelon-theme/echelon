let currentPage = 0; // Default to the first page
const { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
let { CustomizableUI } = ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs");
var { EchelonLayoutTemplateManager } = ChromeUtils.import("chrome://modules/content/EchelonLayoutTemplateManager.js");
console.log(EchelonLayoutTemplateManager);

// ECHELON SETTINGS
let echelonAppearanceBlue = "Echelon.Appearance.Blue";
let echelonAppearanceStyle = "Echelon.Appearance.Style";
let echelonAppearanceHomepageStyle = "Echelon.Appearance.Homepage.Style";
let echelonAppearanceNewLogo = "Echelon.Appearance.NewLogo";
let echelonParameterisFirstRunFinished = "Echelon.parameter.isFirstRunFinished";

let setBoolPref = Services.prefs.setBoolPref;
let setIntPref = Services.prefs.setIntPref;

let pageStack = [];

function showPage(pageNumber, pushToStack = true) {
    var pageId = 'page' + pageNumber;
    var selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        // Hide all pages
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].style.display = 'none';
        }

        // Show the selected page
        selectedPage.style.display = 'flex';
        currentPage = pageNumber; // Update the currentPage variable

		if (pushToStack)
			pageStack.push(pageNumber);
    } else {
        console.error('Page not found: ' + pageId);
    }
}

/**
 * Go back based on the internal stack.
 */
function goBack()
{
	pageStack.pop();
	showPage(pageStack[pageStack.length - 1], false);
}

showPage(currentPage);

function setOSPref(osName)
{
	let isWinXP = false;
	let isBlue = true;
	let isWin8 = false;
	let isWin10 = false;

	switch (osName)
	{
		case "winxp":
			isWinXP = true;
			isBlue = false;
			isWin8 = false;
			isWin10 = false;
			break;
		case "win7":
			isWinXP = false;
			isBlue = true;
			isWin8 = false;
			isWin10 = false;
			break;
		case "win7native":
			isWinXP = false;
			isBlue = false;
			isWin8 = false;
			isWin10 = false;
			break;
		case "win8":
			isWinXP = false;
			isBlue = false;
			isWin8 = true;
			isWin10 = false;
			break;
		case "win10":
			isWinXP = false;
			isBlue = false;
			isWin8 = false;
			isWin10 = true;
			break;
	}

	PrefUtils.trySetBoolPref("Echelon.Appearance.XP", isWinXP);
	PrefUtils.trySetBoolPref("Echelon.Appearance.Australis.Windows8", isWin8);
	PrefUtils.trySetBoolPref("Echelon.Appearance.Australis.Windows10", isWin10);
	PrefUtils.trySetBoolPref(echelonAppearanceBlue, isBlue);
}

// Dump the current user layout in case we want to revert to it.
function dumpExistingLayout()
{
	let navBarWidgets = CustomizableUI.getWidgetsInArea("nav-bar");
	let out = [];

	for (let widget of navBarWidgets)
	if (widget)
	{
		let positionQuery = CustomizableUI.getPlacementOfWidget(widget.id);

		out.push({
			id: widget.id,
			absolutePositionHint: positionQuery.position
		});
	}

	return out;
}

// This is used to easily revert the UI visually without any bugs. Firefox's official
// implementation to undo UI changes breaks the appearance of pinned extensions.
let previousCustomizableUiLayout = dumpExistingLayout();

// We backup the uiCustomization state whenever we're previewing the layout changes,
// because otherwise it saves over the user's state with the preview.
let previousCustomizableUiConfig = PrefUtils.tryGetStringPref("browser.uiCustomization.state");

// Apply the preview layout over this, which will not override the user's preferences, but
// will update the UI visually.
EchelonLayoutTemplateManager.applyDefaultLayout(window.opener);
PrefUtils.trySetStringPref("browser.uiCustomization.state");

// Handle toggling of the reset layout checkbox on the last page.
let resetLayoutCheckbox = document.querySelector("#reset-layout");
if (resetLayoutCheckbox)
{
	resetLayoutCheckbox.addEventListener("CheckboxStateChange", function() {
		if (resetLayoutCheckbox.checked)
		{
			EchelonLayoutTemplateManager.applyDefaultLayout(window.opener);
			PrefUtils.trySetStringPref("browser.uiCustomization.state");
		}
		else if (previousCustomizableUiLayout)
		{
			EchelonLayoutTemplateManager.applyLayout(window.opener, previousCustomizableUiLayout);
			PrefUtils.trySetStringPref("browser.uiCustomization.state");
		}
	});
}

var finishButton = document.getElementById('finishButton');
finishButton.addEventListener("click", function() {
	setBoolPref(echelonParameterisFirstRunFinished, true);

	if (document.querySelector("#reset-layout").checked == true)
	{
		EchelonLayoutTemplateManager.applyDefaultLayout(window.opener);
	}

	// We don't fire the event here since the logic is handled just fine.
	window.close();
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