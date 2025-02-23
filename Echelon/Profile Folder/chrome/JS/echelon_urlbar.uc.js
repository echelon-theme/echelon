// ==UserScript==
// @name			Echelon :: Favicon on Address Bar
// @description 	Adds Favicon of the current website to the UrlBar
// @author			Travis
// @include			main
// ==/UserScript==

let strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
let lang = Services.locale.requestedLocale;

waitForElement("#urlbar").then(e => {
	let dropmarker = window.MozXULElement.parseXULToFragment(`
		<dropmarker anonid="historydropmarker" class="autocomplete-history-dropmarker urlbar-history-dropmarker" enablehistory="true"/>
	`);

	let urlbarInputContainer = e.querySelector(".urlbar-input-container");
	if (!urlbarInputContainer) { // fallback for older versions of firefox
		urlbarInputContainer = e .querySelector("#urlbar-input-container");
	}

	urlbarInputContainer.appendChild(dropmarker);

	e.querySelector(".urlbar-history-dropmarker").addEventListener("mousedown", openURLView);
	
	function openURLView() {
		// Related Firefox code involving opening the URLbar Dropdown seems to use
		// Private Properties, so this will do for now.
		gURLBar._inputContainer.click();
		gURLBar.searchMode = {
			source: UrlbarUtils.RESULT_SOURCE.BOOKMARKS,
			entry: "shortcut",
		};
		gURLBar.search(gURLBar.value);
		gURLBar.select();
	}

	
});

gIdentityHandler.getEffectiveHost = function _getEffectiveHost() {
	if (!this._eTLDService) {
		this._eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(
			Ci.nsIEffectiveTLDService
		);
	}

	if (!this._IDNService) {
		this._IDNService = Cc["@mozilla.org/network/idn-service;1"].getService(
			Ci.nsIIDNService
		);
	}

	try {
		let baseDomain =
        	this._eTLDService.getBaseDomainFromHost(this._uri.host);
		return this._IDNService.convertToDisplayIDN(baseDomain, {});
	} catch (e) {
		// If something goes wrong (e.g. host is an IP address) just fail back
		// to the full domain.
		return this._uri.host;
	}
}

function updateIcon()
{
	try
	{
		setTimeout(function()
		{
			let favicon = gBrowser.selectedTab.image;
				
			let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
			if (style < ECHELON_LAYOUT_FF14)
			{
				gIdentityHandler._identityIcon.setAttribute("src", favicon);

				if (!favicon || favicon == null)
				{
					gIdentityHandler._identityIcon.removeAttribute("src");
				}
			}
			else {
				gIdentityHandler._identityIcon.removeAttribute("src");
			}
		}, 1);
	}
	catch (e) {}

	try {
		let displayHost = null;
		let iData = null;

		if (gIdentityHandler._uriHasHost && gIdentityHandler._isSecureConnection) {
			displayHost = gIdentityHandler.getEffectiveHost();
			gIdentityHandler._identityIconLabel.setAttribute("value", displayHost);
			gIdentityHandler._identityIconLabel.removeAttribute("collapsed");
		}
		
		if (gIdentityHandler._uriHasHost && gIdentityHandler._isEV) {
			iData = gIdentityHandler.getIdentityData();

			if (iData.subjectOrg && iData.state) {
				if (lang != Services.locale.requestedLocale)
				{
					lang = Services.locale.requestedLocale;
					strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
				}
				let evString = strings.formatStringFromName("identity.identified.org_and_country", [iData.subjectOrg, iData.country]);
				gIdentityHandler._identityIconLabel.setAttribute("value", evString);
				gIdentityHandler._identityBox.classList.replace("verifiedDomain", "verifiedIdentity");
			}
		}
	}
	catch (e) {}
}

function initIdentityHandlerFavicon() {
	document.addEventListener("TabAttrModified", updateIcon, false);
	document.addEventListener("TabSelect", updateIcon, false);
	document.addEventListener("TabOpen", updateIcon, false);
	document.addEventListener("TabClose", updateIcon, false);
	document.addEventListener("load", updateIcon, false);
	updateIcon();
}

// initiate script after DOM/browser content is loaded
document.addEventListener("DOMContentLoaded", initIdentityHandlerFavicon, false);
