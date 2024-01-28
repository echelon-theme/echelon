// ==UserScript==
// @name			Echelon :: Favicon on Address Bar
// @description 	Adds Favicon of the current website to the UrlBar
// @author			Travis
// @include			main
// ==/UserScript==

var default_favicon = 'chrome://userchrome/content/images/icon16.png';

var FaviconInUrlbar = {
 init:
 	function() {
		try {
			function updateIcon() {
				setTimeout(function() {
					var favicon_in_urlbar = gBrowser.selectedTab.image;
					if (!gBrowser.selectedTab.image || gBrowser.selectedTab.image == null)
					{
						favicon_in_urlbar = default_favicon;
					}
						
					let style = tryGetIntPref("Echelon.Appearance.Style");
					if (style < 3)
					{
						document.querySelector('#identity-icon').setAttribute("style", "list-style-image: url('"+favicon_in_urlbar+"');");
					}
				}, 1);

			}

			document.addEventListener("TabAttrModified", updateIcon, false);
			document.addEventListener('TabSelect', updateIcon, false);
			document.addEventListener('TabOpen', updateIcon, false);
			document.addEventListener('TabClose', updateIcon, false);
			document.addEventListener('load', updateIcon, false);
			updateIcon();
		} catch(e) {}
	}
};

// initiate script after DOM/browser content is loaded
document.addEventListener("DOMContentLoaded", FaviconInUrlbar.init(), false);
