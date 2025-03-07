// ==UserScript==
// @name			Echelon :: Favicon on Address Bar
// @description 	Adds Favicon of the current website to the UrlBar
// @author			Travis
// @include			main
// ==/UserScript==

waitForElement("#urlbar").then(e => {
	let dropmarker = window.MozXULElement.parseXULToFragment(`
		<dropmarker anonid="historydropmarker" class="autocomplete-history-dropmarker urlbar-history-dropmarker" enablehistory="true"/>
	`);

	let urlbarInputContainer = e.querySelector(".urlbar-input-container");
	if (!urlbarInputContainer) { // fallback for older versions of firefox
		urlbarInputContainer = e.querySelector("#urlbar-input-container");
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

waitForElement("#identity-box").then(e => {
	let identityIconBox = gIdentityHandler._identityIconBox;

	let connectionIcon = document.createXULElement("image");
	connectionIcon.id = "connection-icon";

	identityIconBox.insertBefore(connectionIcon, gIdentityHandler._identityIconLabel);
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

gIdentityHandler._refreshIdentityIcons = function refreshIdentityIcons() {
	let icon_label = "";
	let tooltip = "";

	let warnTextOnInsecure =
		this._insecureConnectionTextEnabled ||
		(this._insecureConnectionTextPBModeEnabled &&
			PrivateBrowsingUtils.isWindowPrivate(window));

	if (this._isSecureInternalUI) {
		// This is a secure internal Firefox page.
		this._identityBox.className = "chromeUI";
		let brandBundle = document.getElementById("bundle_brand");
		icon_label = brandBundle.getString("brandShorterName");
	} else if (this._pageExtensionPolicy) {
		// This is a WebExtension page.
		this._identityBox.className = "extensionPage";
		let extensionName = this._pageExtensionPolicy.name;
		icon_label = gNavigatorBundle.getFormattedString(
			"identity.extension.label",
			[extensionName]
		);
	} else if (this._uriHasHost && this._isSecureConnection) {
		// This is a secure connection.
		this._identityBox.className = "verifiedDomain";
		icon_label = this.getEffectiveHost();

		if (this._isEV) {
			this._identityBox.className = "verifiedIdentity";

			// If it's identified, then we can populate the dialog with credentials
			iData = this.getIdentityData();
			icon_label = iData.subjectOrg;
			if (iData.country) {
				icon_country_label = "(" + iData.country + ")";
				// If the organization name starts with an RTL character, then
				// swap the positions of the organization and country code labels.
				// The Unicode ranges reflect the definition of the UCS2_CHAR_IS_BIDI
				// macro in intl/unicharutil/util/nsBidiUtils.h. When bug 218823 gets
				// fixed, this test should be replaced by one adhering to the
				// Unicode Bidirectional Algorithm proper (at the paragraph level).
				icon_labels_dir = /^[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/.test(icon_label) ?
								"rtl" : "ltr";

				icon_label = `${iData.subjectOrg} ${icon_country_label}`;
			}
		}

		if (this._isMixedActiveContentBlocked) {
			this._identityBox.classList.add("mixedActiveBlocked");
		}

		if (!this._isCertUserOverridden) {
			// It's a normal cert, verifier is the CA Org.
			tooltip = gNavigatorBundle.getFormattedString(
				"identity.identified.verifier",
				[this.getIdentityData().caOrg]
			);
		}
	} else if (this._isBrokenConnection) {
		// This is a secure connection, but something is wrong.
		this._identityBox.className = "unknownIdentity";

		if (this._isMixedActiveContentLoaded) {
			this._identityBox.classList.add("mixedActiveContent");
			if (
				UrlbarPrefs.getScotchBonnetPref("trimHttps") &&
				warnTextOnInsecure
			) {
				icon_label = gNavigatorBundle.getString("identity.notSecure.label");
				tooltip = gNavigatorBundle.getString("identity.notSecure.tooltip");
				this._identityBox.classList.add("notSecureText");
			}
		} else if (this._isMixedActiveContentBlocked) {
			this._identityBox.classList.add(
				"mixedDisplayContentLoadedActiveBlocked"
			);
		} else if (this._isMixedPassiveContentLoaded) {
			this._identityBox.classList.add("mixedDisplayContent");
		} else {
			this._identityBox.classList.add("weakCipher");
		}
	} else if (this._isCertErrorPage) {
		// We show a warning lock icon for certificate errors, and
		// show the "Not Secure" text.
		this._identityBox.className = "certErrorPage notSecureText";
		icon_label = gNavigatorBundle.getString("identity.notSecure.label");
		tooltip = gNavigatorBundle.getString("identity.notSecure.tooltip");
	} else if (this._isAboutHttpsOnlyErrorPage) {
		// We show a not secure lock icon for 'about:httpsonlyerror' page.
		this._identityBox.className = "httpsOnlyErrorPage";
	} else if (
		this._isAboutNetErrorPage ||
		this._isAboutBlockedPage ||
		this._isAssociatedIdentity
	) {
		// Network errors, blocked pages, and pages associated
		// with another page get a more neutral icon
		this._identityBox.className = "unknownIdentity";
	} else if (this._isPotentiallyTrustworthy) {
		// This is a local resource (and shouldn't be marked insecure).
		this._identityBox.className = "localResource";
	} else {
		// This is an insecure connection.
		let className = "notSecure";
		this._identityBox.className = className;
		tooltip = gNavigatorBundle.getString("identity.notSecure.tooltip");
		if (warnTextOnInsecure) {
			icon_label = gNavigatorBundle.getString("identity.notSecure.label");
			this._identityBox.classList.add("notSecureText");
		}
	}

	if (this._isCertUserOverridden) {
		this._identityBox.classList.add("certUserOverridden");
		// Cert is trusted because of a security exception, verifier is a special string.
		tooltip = gNavigatorBundle.getString(
			"identity.identified.verified_by_you"
		);
	}

	// Push the appropriate strings out to the UI
	this._identityIcon.setAttribute("tooltiptext", tooltip);

	if (this._pageExtensionPolicy) {
		let extensionName = this._pageExtensionPolicy.name;
		this._identityIcon.setAttribute(
			"tooltiptext",
			gNavigatorBundle.getFormattedString("identity.extension.tooltip", [
				extensionName,
			])
		);
	}

	this._identityIconLabel.setAttribute("tooltiptext", tooltip);
	this._identityIconLabel.setAttribute("value", icon_label);
	this._identityIconLabel.collapsed = !icon_label;
}

function updateIcon()
{
	try
	{
		setTimeout(function()
		{
			let favicon = gBrowser.selectedTab.iconImage.src;
				
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
