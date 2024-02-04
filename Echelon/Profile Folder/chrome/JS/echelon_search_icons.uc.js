// ==UserScript==
// @name			Echelon :: Old Search Icons
// @description 	Restore old icons for search engines.
// @author			aubymori
// @include			main
// ==/UserScript==

const { SearchService } = ChromeUtils.importESModule("resource://gre/modules/SearchService.sys.mjs");
const { SearchUtils } = ChromeUtils.importESModule("resource://gre/modules/SearchUtils.sys.mjs");

const REPLACEMENTS = {
	"moz-extension://6ed35b2d-1ed2-42d1-8ce2-e5bb7d28eaae/favicon.ico": "chrome://userchrome/content/images/icons/engines/google.png",
	"moz-extension://86c18ad3-bda5-4e0e-a616-210d5a4e2d9c/favicon.ico": "chrome://userchrome/content/images/icons/engines/bing.png",
	"moz-extension://de27d924-71c6-4eb5-89eb-e8805cd92d62/favicon.ico": "chrome://userchrome/content/images/icons/engines/ebay.png"
};

/* Style 3 with new logo and Style 4+ */
const REPLACEMENTS_NEW = {
	"moz-extension://6ed35b2d-1ed2-42d1-8ce2-e5bb7d28eaae/favicon.ico": "chrome://userchrome/content/images/icons/engines/google_new.ico",
	"moz-extension://86c18ad3-bda5-4e0e-a616-210d5a4e2d9c/favicon.ico": "chrome://userchrome/content/images/icons/engines/bing_new.ico",
	"moz-extension://de27d924-71c6-4eb5-89eb-e8805cd92d62/favicon.ico": "chrome://userchrome/content/images/icons/engines/ebay_new.ico"
};

class EchelonSearchManager
{
	static updateDisplay_orig = null;
	static searchbar = null;

	static async updateSearchBox()
	{
		let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
		if (style < 5)
		{
			let engine = await Services.search.getDefault();

			let icon = await waitForElement(".searchbar-search-icon");
			icon.setAttribute("src", this.getReplacementIcon(engine._iconURI.spec));
	
			let textbox = await waitForElement(".searchbar-textbox");
			textbox.placeholder = engine._name;
		}
	}

	static getReplacementIcon(url)
	{
		let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
		let newLogo = PrefUtils.tryGetBoolPref("Echelon.Appearance.NewLogo");
		if (style < 5)
		{
			let replacements = (style == 4 || (style == 3 && newLogo))
			? REPLACEMENTS_NEW
			: REPLACEMENTS;
			for (const orig in replacements)
			{
				if (url == orig)
				{
					return replacements[orig];
				}
			}
		}
		return url;
	}

	static onMutation(list)
	{
		for (const mut of list)
		{
			if (mut.type == "attributes" && mut.target.nodeName == "image" && mut.attributeName == "src")
			{
				let replacement = this.getReplacementIcon(mut.target.getAttribute("src"));
				if (replacement != mut.target.getAttribute("src"))
				{
					mut.target.setAttribute("src", replacement);
				}
			}
		}
	}

	static updateDisplay_hook()
	{
		if (this.updateDisplay_orig && this.searchbar)
		{
			this.updateDisplay_orig.call(this.searchbar);
		}
		this.updateSearchBox();
	}

	static async installSearchBoxHook()
	{
		let e = await waitForElement("#searchbar");
		this.searchbar = e;
		this.updateDisplay_orig = e.updateDisplay;
		e.updateDisplay = this.updateDisplay_hook.bind(this);
	}
}

{
	let observer = new MutationObserver(EchelonSearchManager.onMutation.bind(EchelonSearchManager));
	observer.observe(document.documentElement, { attributes: true, childList: true, subtree : true });
}