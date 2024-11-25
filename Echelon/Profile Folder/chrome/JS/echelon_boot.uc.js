// ==UserScript==
// @name			Echelon :: Boot
// @description 	Initializes Echelon modules for different pages.
// @author			aubymori
// @include			(.*)
// @loadOrder       0
// ==/UserScript==

let { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

let ECHELON_BOOT_CONFIG = {
	/* Main browser window */
	"chrome://browser/content/browser.xhtml": {
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
		if (config?.themes)
		{
			let { EchelonThemeManager } = ChromeUtils.importESModule("chrome://modules/content/EchelonThemeManager.sys.mjs");
			context.g_themeManager = new EchelonThemeManager;
			context.g_themeManager.init(context.document.documentElement, config.themes);
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