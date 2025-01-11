// ==UserScript==
// @name			Echelon :: Theme Manager
// @description 	PLACEHOLDER SCRIPT BEFORE ECHELON THEME MANAGER REVAMP
// @author			Travis
// @include			main
// ==/UserScript==

class ThemeUtils
{
    static systhemes = [
        "winxp",
        "win8",
        "win10"
    ]

    static getPreferredTheme() {
        return AppConstants.platform;
	}

    static getTheme() {
        let prefChoice = PrefUtils.tryGetStringPref("Echelon.Appearance.systemStyle");
        
        if (ThemeUtils.systhemes.includes(prefChoice)) {
            return prefChoice;
        }

        return ThemeUtils.getPreferredTheme();
    }

    static applyPlatformStyle() {
        let theme = ThemeUtils.getTheme();
        document.documentElement.setAttribute("echelon-system-style", theme);
    }
}

const themeUtilsObserver = {
    observe: function (subject, topic, data) {
        if (topic == "nsPref:changed")
            ThemeUtils.applyPlatformStyle();
    },
};

document.addEventListener("DOMContentLoaded", ThemeUtils.applyPlatformStyle, false);
Services.prefs.addObserver("Echelon.Appearance.systemStyle", themeUtilsObserver, false);