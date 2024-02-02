// ==UserScript==
// @name			Echelon :: Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/aboutDialog.xhtml
// @include         about:config
// ==/UserScript==

// Make sure this include is available where needed
// (checking without "in" causes an error btw)
if (!"tryGetStringPref" in globalThis || !"tryGetIntPref" in globalThis)
	Services.scriptloader.loadSubScript("chrome://userchrome/content/JS/echelon_utils.uc.js");

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
		let style = tryGetIntPref("Echelon.Appearance.Style");
		
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
	}
	
	static refreshPrefBoolAttribute(prefName, attrName)
	{
		let value = tryGetBoolPref(prefName);
		
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
root.setAttribute("update-channel", getUpdateChannel());
root.setAttribute("browser-name", getBrowserName());