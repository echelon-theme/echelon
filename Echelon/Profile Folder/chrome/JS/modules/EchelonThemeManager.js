// ==UserScript==
// @name			Echelon :: Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/aboutDialog.xhtml
// @include         about:preferences($|(\?|#)($|.*))
// @include			about:addons
// @include			about:echelon
// ==/UserScript==

this.EXPORTED_SYMBOLS = ["EchelonThemeManager"];

var { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

class EchelonThemeManager
{
	root = null;

	static #prefToAttr(pref)
	{
		return pref.replace(/\./g, "-").toLowerCase();
	}
	
	init(root, config = { style: true })
	{
		this.root = root;
		console.log(root);
		if (!root)
		{
			throw new Error("Root not specified");
		}
		
		if (config?.style)
		{
			this.refreshTheme();
			Services.prefs.addObserver("Echelon.Appearance.Style", (function() {
				this.refreshTheme();
				console.log("theme change");
			}).bind(this));
		}

		if (config?.bools && Array.isArray(config.bools))
		{
			for (const bool of config.bools)
			{
				this.registerBoolAttributeUpdateObserver(bool, EchelonThemeManager.#prefToAttr(bool));
			}
		}
	}
	
	refreshTheme()
	{
		let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
		
		for (let attr of this.root.getAttributeNames())
		{
			if (attr.indexOf("echelon-style-") > -1)
			{
				this.root.removeAttribute(attr);
			}
		}
		
		for (let i = 1; i <= style; i++)
		{
			this.root.setAttribute(`echelon-style-${i}`, "true");
		}

		/* Enable Tabs on Top for Australis */
		if (style >= 4)
		{
			PrefUtils.trySetBoolPref("Echelon.Appearance.TabsOnTop", true);
		}
	}
	
	refreshPrefBoolAttribute(prefName, attrName)
	{
		let value = PrefUtils.tryGetBoolPref(prefName);
		
		if (value)
		{
			this.root.setAttribute(attrName, "true");
		}
		else
		{
			this.root.removeAttribute(attrName);
		}
	}
	
	registerBoolAttributeUpdateObserver(prefName, attrName)
	{
		this.refreshPrefBoolAttribute(prefName, attrName);
		Services.prefs.addObserver(prefName, (function() {
			this.refreshPrefBoolAttribute(prefName, attrName);
		}).bind(this));
	}
}