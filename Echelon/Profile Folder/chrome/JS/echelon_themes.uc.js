// ==UserScript==
// @name			Echelon :: Theme Manager
// @description 	PLACEHOLDER SCRIPT BEFORE ECHELON THEME MANAGER REVAMP
// @author			Travis
// @include			main
// ==/UserScript==

class ThemeUtils
{
    static stylePreset = {
		0: { // Firefox 4
			"style": "0",
			"pageStyle": "0",
			"newlogo": false
		},
		1: { // Firefox 5
			"style": "1",
			"pageStyle": "0",
			"newlogo": false
		},
		2: { // Firefox 6
			"style": "2",
			"pageStyle": "0",
			"newlogo": false
		},
		3: { // Firefox 8
			"style": "3",
			"pageStyle": "1",
			"newlogo": false
		},
		4: { // Firefox 10
			"style": "4",
			"pageStyle": "1",
			"newlogo": false
		},
        5: { // Firefox 14
			"style": "5",
			"pageStyle": "2",
			"newlogo": false
		},
        6: { // Firefox 28
			"style": "5",
			"pageStyle": "3",
			"newlogo": true
		},
        7: { // Firefox 29
			"style": "6",
			"pageStyle": "3",
			"newlogo": true
		},
		8: { // Firefox 56
			"style": "7",
			"pageStyle": "4",
			"newlogo": true
		}
	};

    static getPreferredPreset() {
		let prefChoice = PrefUtils.tryGetIntPref("Echelon.Appearance.Preset");

        if (Object.keys(ThemeUtils.stylePreset).includes(`${prefChoice}`)) {
            return `${prefChoice}`;
        } else {
            return "0";
        }
    }

    static getPresetKey(key) {
        let prefChoice = ThemeUtils.getPreferredPreset();

		return ThemeUtils.stylePreset[prefChoice][key];
    }

    static setStylePreset() {
        PrefUtils.trySetIntPref("Echelon.Appearance.Style", ThemeUtils.getPresetKey("style"));
        PrefUtils.trySetIntPref("Echelon.Appearance.Homepage.Style", ThemeUtils.getPresetKey("pageStyle"));
        PrefUtils.trySetBoolPref("Echelon.Appearance.NewLogo", ThemeUtils.getPresetKey("newlogo"));
    }
}

const presetObserver = {
    observe: function (subject, topic, data) {
        if (topic == "nsPref:changed")
            ThemeUtils.setStylePreset();
    },
};

Services.prefs.addObserver("Echelon.Appearance.Preset", presetObserver, false);

let EXPORTED_SYMBOLS_THEMES = [ "ThemeUtils" ];