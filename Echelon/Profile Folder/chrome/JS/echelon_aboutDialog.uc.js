// ==UserScript==
// @name			 Echelon :: About Dialog
// @description 	 Stuff
// @author			 Travis
// @include			 chrome://browser/content/aboutDialog.xhtml
// ==/UserScript==

{
    var { PrefUtils, ThemeUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    
    ChromeUtils.defineESModuleGetters(window, {
        EchelonThemeManager: "chrome://modules/content/EchelonThemeManager.sys.mjs",
    });

    let g_themeManager = new EchelonThemeManager;
    g_themeManager.init(
        document.documentElement,
        {
            style: true,
            bools: [
                "Echelon.Appearance.NewLogo"
            ]
        }
    );
    
    let spoofVersion = PrefUtils.tryGetBoolPref("Echelon.Options.SpoofVersion");

    if (spoofVersion) {
        let currentPreset = ThemeUtils.getPreferredPreset();
        let bits = Services.appinfo.is64Bit ? 64 : 32;

        document.querySelector("#version").textContent = ThemeUtils.getPresetKey("basedOn");

        if (currentPreset == "8") {
            document.querySelector("#version").textContent = `${ThemeUtils.getPresetKey("basedOn")} (${bits}-bit)`;
        }
    }
}