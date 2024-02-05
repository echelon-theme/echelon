// ==UserScript==
// @name			Echelon :: Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/aboutDialog.xhtml
// @include         about:preferences
// @include         about:preferences#general
// @include         about:preferences#home
// @include         about:preferences#search
// @include         about:preferences#privacy
// @include         about:preferences#sync
// @include         about:preferences#moreFromMozilla
// @include			about:addons
// ==/UserScript==

var { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

class EchelonThemeManager
{
	static root = document.documentElement;
	
	static init()
	{
		EchelonThemeManager.refreshTheme(document.documentElement);
		
		Services.prefs.addObserver("Echelon.Appearance.Style", (function() {
			this.refreshTheme();
		}).bind(this));

		this.registerBoolAttributeUpdateObserver("Echelon.Appearance.Blue", "echelon-appearance-blue");
		this.registerBoolAttributeUpdateObserver("Echelon.Appearance.Australis.EnableFog", "echelon-appearance-australis-fog");
		this.registerBoolAttributeUpdateObserver("Echelon.Appearance.Australis.Windows10", "echelon-appearance-australis-windows10");
		this.registerBoolAttributeUpdateObserver("Echelon.Appearance.XP", "echelon-appearance-xp");
		this.registerBoolAttributeUpdateObserver("Echelon.FirefoxButton.CustomStyle", "echelon-firefox-button-custom-style");
	}
	
	static refreshTheme()
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
	
	static refreshPrefBoolAttribute(prefName, attrName)
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
	
	static registerBoolAttributeUpdateObserver(prefName, attrName)
	{
		this.refreshPrefBoolAttribute(prefName, attrName);
		Services.prefs.addObserver(prefName, (function() {
			this.refreshPrefBoolAttribute(prefName, attrName);
		}).bind(this));
	}
}

let root = document.documentElement;
EchelonThemeManager.refreshTheme(root);
root.setAttribute("update-channel", BrandUtils.getUpdateChannel());
root.setAttribute("browser-name", BrandUtils.getBrowserName());