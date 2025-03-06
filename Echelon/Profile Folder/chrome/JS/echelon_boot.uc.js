// ==UserScript==
// @name			Echelon :: Boot
// @description 	Initializes Echelon modules for different pages.
// @author			aubymori
// @include			(.*)
// @loadOrder       0
// ==/UserScript==

let ECHELON_BOOT_CONFIG = {
	/* Main browser window */
	"chrome://browser/content/browser.xhtml": {
		updates: true,
		wizard: true,
		themes: {
			style: true,
			bools: [
				"Echelon.Appearance.Blue",
				"Echelon.Appearance.NewLogo",
				"Echelon.Option.HideUnifiedExtensions",
				"Echelon.Appearance.disableChrome",
				"browser.tabs.tabmanager.enabled",
				"widget.windows-style.modern"
			],
		},
		nativeControls: true,
	},
	"chrome://browser/content/places/places.xhtml": {
		themes: {
			style: true,
			bools: [
				"Echelon.Appearance.Blue"
			]
		},
		nativeControls: true
	}
};

{
	function bootEchelon(context, config)
	{
		if (config?.updates)
		{
			let { EchelonUpdateChecker } = ChromeUtils.importESModule("chrome://modules/content/EchelonUpdateChecker.sys.mjs");
			EchelonUpdateChecker.setWindow(context);
			EchelonUpdateChecker.checkForUpdate();
		}
		if (config?.themes)
		{
			let { EchelonThemeManager } = ChromeUtils.importESModule("chrome://modules/content/EchelonThemeManager.sys.mjs");
			context.g_themeManager = new EchelonThemeManager;
			context.g_themeManager.init(context.document.documentElement, config.themes);
		}
		if (config?.wizard)
			{
				let { openEchelonWizardWindow } = ChromeUtils.import("chrome://userscripts/content/echelon_wizard.uc.js");
				openEchelonWizardWindow = showEchelonWizard.bind(context);
				openEchelonWizardWindow(true);
	
				context.addEventListener("echelon-reopen-wizard", function(e)
				{
					// Kill the wizard notification early. Technically, it will disappear as soon as this
					// callback ends, but it looks bad.
					gBrowser?.getNotificationBox()?.getNotificationWithValue("echelon-setup-closed")?.dismiss();
					openEchelonWizardWindow(false);
				});
		}
		if (config?.nativeControls)
		{
			let { NativeControls } = ChromeUtils.importESModule("chrome://modules/content/NativeControls.sys.mjs");
			context.g_nativeControls = new NativeControls(
				context.document.documentElement,
				context.MutationObserver
			);
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