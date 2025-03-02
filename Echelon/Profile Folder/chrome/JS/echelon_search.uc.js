// ==UserScript==
// @name			Echelon :: Search
// @description 	Restore old icons for search engines, and a class for a focused searchbox.
// @author			aubymori
// @include			main
// ==/UserScript==

const { SearchService } = ChromeUtils.importESModule("resource://gre/modules/SearchService.sys.mjs");
const { SearchUtils } = ChromeUtils.importESModule("resource://gre/modules/SearchUtils.sys.mjs");

class EchelonSearchManager
{
	static updateDisplay_orig = null;
	static searchbar = null;

	static defaultIcons = {};
	static obtainedIcons = false;
	
	/* A list of engines to obtain default icons for. */
	static ENGINES = [
		"google",
		"bing",
		"ebay",

		/* For older versions of Firefox */
		"google@search.mozilla.orgdefault",
		"bing@search.mozilla.orgdefault",
		"ebay@search.mozilla.orgdefault"
	];

	/* Replacement icons for FF14 with old logo and earlier */
	static REPLACEMENTS = {
		"google": "chrome://echelon/content/firefox-4/search/google.png",
		"bing": "chrome://echelon/content/firefox-4/search/bing.png",
		"ebay": "chrome://echelon/content/firefox-4/search/ebay.png",

		/* For older versions of Firefox */
		"google@search.mozilla.orgdefault": "chrome://echelon/content/firefox-4/search/google.png",
		"bing@search.mozilla.orgdefault": "chrome://echelon/content/firefox-4/search/bing.png",
		"ebay@search.mozilla.orgdefault": "chrome://echelon/content/firefox-4/search/ebay.png",
	};

	/* Replacement icons for FF14 with new logo and later */
	static REPLACEMENTS_NEW = {
		"google": "chrome://echelon/content/firefox-28/search/google.ico",
		"bing": "chrome://echelon/content/firefox-28/search/bing.ico",
		"ebay": "chrome://echelon/content/firefox-28/search/ebay.ico",

		/* For older versions of Firefox */
		"google@search.mozilla.orgdefault": "chrome://echelon/content/firefox-28/search/google.ico",
		"bing@search.mozilla.orgdefault": "chrome://echelon/content/firefox-28/search/bing.ico",
		"ebay@search.mozilla.orgdefault": "chrome://echelon/content/firefox-28/search/ebay.ico",
	};

	static async obtainIcons()
	{
		if (!this.obtainedIcons)
		{
			await Services.search.init();
			for (const id of this.ENGINES)
			{
				this.defaultIcons[id] = (await Services.search.getEngineById(id))?.id;
			}
			this.obtainedIcons = true;
		}
	}

	static async updateSearchBox()
	{
		let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
		if (style < ECHELON_LAYOUT_AUSTRALIS_LATE)
		{
			let engine = await Services.search.getDefault();

			let icon = await waitForElement(".searchbar-search-icon");
			icon.setAttribute("src", await this.getReplacementIcon(engine.id));
	
			let textbox = await waitForElement(".searchbar-textbox");
			textbox.placeholder = engine._name;
		} else {
			const [searchbarInputl10n] = await document.l10n.formatMessages([
				{ id: "searchbar-input" }
			]);

			let textbox = await waitForElement(".searchbar-textbox");
			textbox.placeholder = searchbarInputl10n.attributes[0].value;
		
			let icon = await waitForElement(".searchbar-search-icon");
			icon.removeAttribute("src");
		}
	}

	static async getReplacementIcon(url)
	{
		await this.obtainIcons();
		let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
		let newLogo = PrefUtils.tryGetBoolPref("Echelon.Appearance.NewLogo");
		if (style < ECHELON_LAYOUT_AUSTRALIS_LATE)
		{
			let replacements = (style == ECHELON_LAYOUT_AUSTRALIS || (style == ECHELON_LAYOUT_FF14 && newLogo))
			? this.REPLACEMENTS_NEW
			: this.REPLACEMENTS;
			for (const orig in replacements)
			{
				if (orig in this.defaultIcons && this.defaultIcons[orig] == url)
				{
					return replacements[orig];
				}
			}
		}
		return url;
	}

	static async onMutation(list)
	{
		//for (const mut of list)
		//{
		//	if (mut.type == "attributes"
		//	&& (mut.target.nodeName == "image"
		//	|| mut.target.matches("img.urlbarView-favicon"))
		//	&& mut.attributeName == "src")
		//	{
		//		let replacement = await this.getReplacementIcon(mut.target.getAttribute("src"));
		//		if (replacement != mut.target.getAttribute("src"))
		//		{
		//			mut.target.setAttribute("src", replacement);
		//		}
		//	}
		//}
	}

	static updateDisplay_hook()
	{
		if (this.updateDisplay_orig && this.searchbar)
		{
			this.updateDisplay_orig.call(this.searchbar);
		}
		this.updateSearchBox();
	}

	static onFocusSearchbar(event)
	{
		if (event.target.classList.contains("searchbar-textbox"))
		{
			event.target.parentNode.classList.add("focus");
		}	
	}

	static onUnfocusSearchbar(event)
	{
		if (event.target.classList.contains("searchbar-textbox"))
		{
			event.target.parentNode.classList.remove("focus");
		}	
	}

	static async installSearchBoxHook()
	{
		let searchbar = await waitForElement("#searchbar");
		this.searchbar = searchbar;
		this.updateDisplay_orig = searchbar.updateDisplay;
		searchbar.updateDisplay = this.updateDisplay_hook.bind(this);
		
		document.addEventListener("focusin", this.onFocusSearchbar.bind(this));
		document.addEventListener("focusout", this.onUnfocusSearchbar.bind(this));
	}
}

let observer = new MutationObserver(EchelonSearchManager.onMutation.bind(EchelonSearchManager));
observer.observe(document.documentElement, { attributes: true, childList: true, subtree : true });
EchelonSearchManager.installSearchBoxHook();

const updateSeachManager = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			EchelonSearchManager.updateSearchBox();
	},
};
Services.prefs.addObserver("Echelon.Appearance.Style", updateSeachManager, false);