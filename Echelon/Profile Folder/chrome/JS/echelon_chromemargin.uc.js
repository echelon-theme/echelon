// ==UserScript==
// @name			Echelon :: Chrome Margins
// @description 	Changes the window title formats.
// @author			aubymori
// @include			main
// ==/UserScript===

function chromeMargin() {
    let hiddenTitlebar = Services.appinfo.drawInTitlebar;
    let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
    let platform = AppConstants.platform;
    
    if (platform == "win" && hiddenTitlebar == true) {
        if (style < ECHELON_LAYOUT_FF14)
        {
            window.windowUtils.setChromeMargin(0, 1, 1, 1);
        }
        else {
            window.windowUtils.setChromeMargin(0, 2, 2, 2);
        }
    }
}

const echelonStyle = {
	observe: function (subject, topic, data) {
		if (topic == "nsPref:changed")
			chromeMargin();
	},
};
Services.prefs.addObserver("Echelon.Appearance.Style", echelonStyle, false);
Services.prefs.addObserver("browser.tabs.inTitlebar", echelonStyle, false);
setTimeout(() => chromeMargin(), 1000); //bum ass hack