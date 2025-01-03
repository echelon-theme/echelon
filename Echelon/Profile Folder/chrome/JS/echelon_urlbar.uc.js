// ==UserScript==
// @name			Echelon :: Favicon on Address Bar
// @description 	Adds Favicon of the current website to the UrlBar
// @author			Travis
// @include			main
// ==/UserScript==

var { BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

let strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
let lang = Services.locale.requestedLocale;

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
				gIdentityHandler._identityIcon.setAttribute("style", `list-style-image: url('${favicon}');`);

				if (!gBrowser.selectedTab.image || gBrowser.selectedTab.image == null)
				{
					gIdentityHandler._identityIcon.setAttribute("style", `list-style-image: var(--default-favicon);`);
				}
			}
		}, 1);
	}
	catch (e) {}

	try {
		let documentURIHost = gBrowser.selectedBrowser.documentURI;
		let displayHost = null;
		let iData = null;

		if (gIdentityHandler._uriHasHost && gIdentityHandler._isSecureConnection) {
			displayHost = documentURIHost.host.replace(/^www\./i, "");
			gIdentityHandler._identityIconLabel.setAttribute("value", displayHost);
			gIdentityHandler._identityIconLabel.removeAttribute("collapsed");
		}

		if (gIdentityHandler._isSecureInternalUI) {
			let browserName = BrandUtils.getBrandingKey("productName");

			gIdentityHandler._identityIconLabel.setAttribute("value", browserName);
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

let FaviconInUrlbar = {
	init: function()
	{
		document.addEventListener("TabAttrModified", updateIcon, false);
		document.addEventListener("TabSelect", updateIcon, false);
		document.addEventListener("TabOpen", updateIcon, false);
		document.addEventListener("TabClose", updateIcon, false);
		document.addEventListener("load", updateIcon, false);
		updateIcon();
	}
};

// initiate script after DOM/browser content is loaded
document.addEventListener("DOMContentLoaded", FaviconInUrlbar.init, false);
Services.prefs.addObserver("Echelon.Option.BrowserSpoof", FaviconInUrlbar.init, false);