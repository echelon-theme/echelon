const { EchelonThemeManager } = ChromeUtils.importESModule("chrome://modules/content/EchelonThemeManager.sys.mjs");
const { PrefUtils, VersionUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

let currentPage = 1; // Default to the first page
let pageStack = [];

let g_themeManager = new EchelonThemeManager;
g_themeManager.init(
    document.documentElement,
    {
        style: true
    }
);

const gPrefHandler = {
    updatePref: function PrefHandler_updatePref(element)
    {
        switch (element.localName)
        {
            case "checkbox":
                element.checked = Services.prefs.getBoolPref(
                    element.getAttribute("preference"),
                    false
                );
                break;
            case "radiogroup":
				if (element.getAttribute("type") == "string") {
                    element.value = Services.prefs.getStringPref(
                        element.getAttribute("preference")
                    );
                }
                else {
                    element.value = Services.prefs.getIntPref(
                        element.getAttribute("preference"),
                        0
                    );
                }
                break;
            case "menulist":

				if (element.getAttribute("type") == "string") {
					element.value = Services.prefs.getStringPref(
						element.getAttribute("preference")
					);
				} 
				else {
					element.value = Services.prefs.getIntPref(
						element.getAttribute("preference"),
						0
					);
				}
                break;
            case "input":
                switch (element.type)
                {
                    case "number":
                        element.value = Services.prefs.getIntPref(
                            element.getAttribute("preference"),
                            0
                        );
                        break;
                }
                break;
        }
    },

    handleEvent: function PrefHandler_handleEvent(event)
    {
        switch (event.type)
        {
            case "CheckboxStateChange":
                Services.prefs.setBoolPref(
                    event.target.getAttribute("preference"),
                    event.target.checked
                );
                break;
            case "input":
            {
                let pref = event.target;
                switch (pref.type)
                {
                    case "number":
                        if (pref.value && Number.isInteger(Number(pref.value)))
                        {
                            pref.removeAttribute("invalid");
                            Services.prefs.setIntPref(
                                pref.getAttribute("preference"),
                                Number(pref.value)
                            );
                        }
                        else
                        {
                            pref.setAttribute("invalid", "");
                        }
                        break;
                }
            }
            case "command":
				if (event.target.parentElement.parentElement.getAttribute("type") == "string") {
					Services.prefs.setStringPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						event.target.parentElement.parentElement.value
					)
				} else {
					Services.prefs.setIntPref(
						event.target.parentElement.parentElement.getAttribute("preference"),
						Number(event.target.parentElement.parentElement.value)
					);
				};
                break;
        }
    },

    observe: function PrefHandler_observe(subject, topic, data)
    {
        if (topic == "nsPref:changed")
        {
            let pref = document.querySelector(`[preference="${data}"]`);
            pref && this.updatePref(pref);
        }
    },

    init: function PrefHandler_init()
    {
        for (const pref of document.querySelectorAll("[preference]"))
        {
            this.updatePref(pref);
        }
        Services.prefs.addObserver(null, this);
        document.addEventListener("CheckboxStateChange", this);
        document.addEventListener("input", this);
        document.addEventListener("command", this);
        document.addEventListener("updateRadioGroup", this)
    }
};

gPrefHandler.init();

function showPage(pageNumber, pushToStack = true) {
    var pageId = 'page' + pageNumber;
    var selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        // Hide all pages
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.add("hidden");
        }

        // Show the selected page
        if (pageNumber >= "2") {
            selectedPage.previousElementSibling.classList.add("last-page");
            selectedPage.setAttribute("animating", "true");
            selectedPage.previousElementSibling.setAttribute("animating", "true");
        }
        selectedPage.classList.remove("hidden");
        
        setTimeout(() => {
            selectedPage.removeAttribute("animating");
            if (pageNumber >= "2") {
                selectedPage.previousElementSibling.removeAttribute("animating");
                selectedPage.previousElementSibling.classList.remove("last-page");
            }
        }, 250);

        currentPage = pageNumber; // Update the currentPage variable

        document.querySelector(".wizard-progress-text b").textContent = currentPage;
        document.querySelector(".wizard-progress-bar").style.width = (100 / pages.length * currentPage) + "%";
        document.querySelector(".wizard-progress-text div").textContent = document.querySelectorAll(".page").length;

        document.documentElement.removeAttribute("finished");

        if (currentPage == document.querySelectorAll('.page').length) {
            document.documentElement.setAttribute("finished", "true");
        }

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

// stolen from echelon_themes until i add import support on that script
class ThemeUtils
{
    static stylePreset = {
		0: { // Firefox 4
			"version": "4",
            "name": "Firefox 4",
            "year": "2011",
            "preset": "0",
		},
		1: { // Firefox 10
			"version": "10",
            "name": "Firefox 10",
            "year": "2012",
            "preset": "4",
		},
        2: { // Firefox 14
			"version": "14",
            "name": "Firefox 14",
            "year": "2012",
            "preset": "5",
		},
        3: { // Firefox 29
			"version": "29",
            "name": "Firefox 29",
            "year": "2014",
            "preset": "7",
		}
	};
    static sysStylePreset = {
        // value       - system style value that will be set
        // name        - display name on the wizard
        // platform    - platforms that the card will be shown in
        // defaultTheme - enable the blue style theme
        // visibleOnly - "both" to show on both Strata & Australis
        //               "strata" to show on only on Strata
        //               "australis" to show only on Australis
        0: { // Windows XP
            "value": "winxp",
            "name": "Windows XP",
            "platform": ["win"],
            "defaultTheme": "true",
            "visibleOnly": "both"
        },
        1: { // Windows 7
            "value": "win",
            "name": "Windows 7",
            "platform": ["win"],
            "defaultTheme": "true",
            "visibleOnly": "both"
        },
        2: { // Windows 8
            "value": "win8",
            "name": "Windows 8",
            "platform": ["win"],
            "defaultTheme": "true",
            "visibleOnly": "australis"
        },
        3: { // Windows 10
            "value": "win10",
            "name": "Windows 10",
            "platform": ["win"],
            "defaultTheme": "true",
            "visibleOnly": "australis"
        },
    };
}

let presetContainer = document.getElementById("preset-container");
let presetCard = null;

for (const i of Object.keys(ThemeUtils.stylePreset)) {
    presetCard = `
        <vbox class="card">
            <radio value="${ThemeUtils.stylePreset[i].preset}" class="card-content">
                <div class="year">${ThemeUtils.stylePreset[i].year}</div>
                <image class="card-image" style="background-image: url('chrome://userchrome/content/pages/options/images/presets/win/firefox-${ThemeUtils.stylePreset[i].version}.png');" flex="1" />
                <div class="content">
                    <label value="${ThemeUtils.stylePreset[i].name}" flex="1" />
                </div>
            </radio>
        </vbox> 
    `

    presetContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));

    document.querySelectorAll("#preset-container .card")[i].addEventListener("click",  function () {
        showPage(2);
    });
}

let homepageContainer = document.getElementById("system-style-container");

for (const i of Object.keys(ThemeUtils.sysStylePreset)) {
    presetCard = `
        <vbox class="card ${ThemeUtils.sysStylePreset[i].value}">
            <radio value="${ThemeUtils.sysStylePreset[i].value}" class="card-content">
                <image class="card-image" flex="1" />
                <div class="content">
                    <label value="${ThemeUtils.sysStylePreset[i].name}" flex="1" />
                </div>
            </radio>
        </vbox> 
    `

    homepageContainer.appendChild(MozXULElement.parseXULToFragment(presetCard));

    homepageContainer.querySelectorAll(".card")[i].addEventListener("click",  function () {
        PrefUtils.trySetBoolPref("Echelon.Appearance.Blue", ThemeUtils.sysStylePreset[i].defaultTheme);
        showPage(3);
    });

    if (ThemeUtils.sysStylePreset[i].visibleOnly.includes("australis")) {
        document.querySelectorAll("#system-style-container .card")[i].setAttribute("australisonly", "true");
    }
}

function onClose() {
	// If the user closes the window prematurely, then reset the CustomizableUI layout.
	// This is done to not startle the user and make them think their original layout is lost.
	// EchelonLayoutTemplateManager.applyLayout(window.opener, previousCustomizableUiLayout);
	// PrefUtils.trySetStringPref("browser.uiCustomization.state");

	// Notify the user that this action can be rectified in the future:
	let root = windowRoot.ownerGlobal;
	let notificationBox = windowRoot.ownerGlobal.gBrowser.getNotificationBox();

	notificationBox.appendNotification(
		"echelon-setup-closed",
		{
			label: "You can restart the Echelon Wizard by restarting Firefox or clicking here.",
			image: "chrome://echelon/content/firefox-4/branding/echelon/icon16.png",
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

document.querySelector(".echelon-wizard-titlebar-close").addEventListener("click",  function () {
    windowRoot.ownerGlobal.resetEchelonWizard();
    // onClose();

    // Reset to First page
    // Timeout is so the first page does not show
    // while the closing animation is happening.
    setTimeout(() => {
        showPage(1);
    }, 550);
});

document.querySelector(".restart-later-button").addEventListener("click",  function () {
    windowRoot.ownerGlobal.hideEchelonWizard();
    document.querySelector("[data-modal='restart-needed']").visibility("hide");

    setTimeout(() => {
        showPage(1);
    }, 550);
});

document.querySelector(".restart-now-button").addEventListener("click",  function () {
    PrefUtils.trySetBoolPref("Echelon.parameter.isFirstRunFinished", "true");
    windowRoot.ownerGlobal.UC_API.Runtime.restart(true);
});

document.querySelector(".echelon-wizard-finish-button").addEventListener("click",  function () {
    document.querySelector("[data-modal='restart-needed']").visibility("show");
});