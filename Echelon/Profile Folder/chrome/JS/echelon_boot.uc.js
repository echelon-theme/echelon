// ==UserScript==
// @name			Echelon :: Boot
// @description 	Initializes Echelon modules for different pages.
// @author			aubymori
// @include			(.*)
// @include         chrome://global/content/commonDialog.xhtml
// @loadOrder       14
// ==/UserScript==

/* ^ We can safely include everything; the script only injects into pages which have chrome privileges */

let ECHELON_BOOT_CONFIG = {
	/* Main browser window */
	"chrome://browser/content/browser.xhtml": {
		updates: true,
		wizard: true,
		themes: {
			style: true,
			bools: [
				"Echelon.Appearance.Blue",
				"Echelon.Appearance.Australis.EnableFog",
				"Echelon.Appearance.Australis.Windows8",
				"Echelon.Appearance.Australis.Windows10",
				"Echelon.Appearance.XP",
				"Echelon.FirefoxButton.CustomStyle",
				"Echelon.Appearance.eXPerienceLunaMsstylesFixes",
				"Echelon.Appearance.NewLogo",
				"Echelon.Option.HideUnifiedExtensions"
			]
		}
	},
	/* Options */
	"about:preferences": {
		themes: { style: true }
	},
	/* Add-ons Manager */
	"about:addons": {
		themes: { style: true }
	},
	/* Echelon Options page */
	"about:echelon": {
		themes: { style: true }
	},
	/* "About Mozilla Firefox" dialog */
	"chrome://browser/content/aboutDialog.xhtml": {
		themes: {
			style: true,
			bools: ["Echelon.Appearance.NewLogo"]
		}
	}
};

{
	function bootEchelon(context, config)
	{
		if (config?.updates)
		{
			let { EchelonUpdateChecker } = ChromeUtils.import("chrome://modules/content/EchelonUpdateChecker.js");
			EchelonUpdateChecker.setWindow(context);
			EchelonUpdateChecker.checkForUpdate();
		}

		if (config?.themes)
		{
			let { EchelonThemeManager } = ChromeUtils.import("chrome://modules/content/EchelonThemeManager.js");
			context.g_themeManager = new EchelonThemeManager;
			context.g_themeManager.init(context.document.documentElement, config.themes);
		}

		if (config?.wizard)
		{
			let { openEchelonWizardWindow } = ChromeUtils.import("chrome://userscripts/content/echelon_wizard.uc.js");
			openEchelonWizardWindow = openEchelonWizardWindow.bind(context);
			openEchelonWizardWindow(true);

			context.addEventListener("echelon-reopen-wizard", function(e)
			{
				// Kill the wizard notification early. Technically, it will disappear as soon as this
				// callback ends, but it looks bad.
				gBrowser?.getNotificationBox()?.getNotificationWithValue("echelon-setup-closed")?.dismiss();
				openEchelonWizardWindow(false);
			});
		}
	}

	(function(context)
	{
		function isCurrentURL(url)
		{
			return context.document.documentURI.split("#")[0].split("?")[0] == url;
		}

		for (const url in ECHELON_BOOT_CONFIG)
		{
			if (isCurrentURL(url))
			{
				context.addEventListener("load", function()
				{
					bootEchelon(context, ECHELON_BOOT_CONFIG[url]);
				});
				return;
			}
		}
	})(window);
}