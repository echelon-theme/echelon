// ==UserScript==
// @name			 Echelon :: Utils
// @description 	 Common utilities for Echelon scripts.
// @author			 ephemeralViolette
// @include			 main
// @include          chrome://browser/content/browser.xhtml
// @include			 chrome://browser/content/aboutDialog.xhtml
// @loadOrder        1
// @backgroundmodule
// ==/UserScript==

let brandBundle = Services.strings.createBundle("chrome://branding/locale/brand.properties");

function renderElement(nodeName, attrMap = {}, childrenArr = [])
{
	let namespace = "html";
	let nodeNameParts = nodeName.split(":");
	let name = nodeName;
	
	if (nodeNameParts.length > 1)
	{
		namespace = nodeNameParts[0];
		name = nodeNameParts[1];
	}
	
	let element = null;
	switch (namespace)
	{
		case "html":
			element = this.document.createElement(name);
			break;
		case "xul":
			element = this.document.createXULElement(name);
			break;
		default:
			throw new Error(`Invalid element namespace for ${namespace}:${name}`);
	}
	
	for (var key in attrMap)
	{
		element.setAttribute(key, attrMap[key]);
	}
	
	for (var i = 0, j = childrenArr.length; i < j; i++)
	{
		element.appendChild(childrenArr[i]);
	}
	
	return element;
}

async function waitForElement(query, parent = this.document, timeout = -1)
{
	let startTime = Date.now();
	
	while (parent.querySelector(query) == null)
	{
		if (timeout > -1 && Date.now > startTime + timeout)
		{
			return null;
		}
		await new Promise(r => this.requestAnimationFrame(r));
	}
	
	return parent.querySelector(query);
}

class PrefUtils
{
	static #internalTryGetPref(name, fallback, func)
	{
		let result = fallback;
		try
		{
			result = func(name);
		}
		catch (e) {}
		return result;
	}

	static tryGetBoolPref(name, fallback = false)
	{
		return this.#internalTryGetPref(name, fallback, Services.prefs.getBoolPref);
	}

	static tryGetIntPref(name, fallback = 0)
	{
		return this.#internalTryGetPref(name, fallback, Services.prefs.getIntPref);
	}

	static tryGetStringPref(name, fallback = "")
	{
		return this.#internalTryGetPref(name, fallback, Services.prefs.getStringPref);
	}

	static #internalTrySetPref(name, value, func)
	{
		try
		{
			func(name, value);
		}
		catch (e) {}
	}

	static trySetBoolPref(name, value)
	{
		this.#internalTrySetPref(name, value, Services.prefs.setBoolPref);
	}

	static trySetIntPref(name, value)
	{
		this.#internalTrySetPref(name, value, Services.prefs.setIntPref);
	}

	static trySetStringPref(name, value)
	{
		this.#internalTrySetPref(name, value, Services.prefs.setStringPref);
	}
}

class BrandUtils
{	
	static bundle = Services.strings.createBundle("chrome://branding/locale/brand.properties");

	static getBrandingKey(key)
	{
		return this.bundle.GetStringFromName(key);
	}
}

class VersionUtils {
    static async getEchelonVer() {
        try {
            const response = await fetch("chrome://userchrome/content/version.json");
			const data = await response.json();

			const version = data.version;

            return version;

        } catch (error) {
            console.error('Error fetching JSON:', error);
            throw error;
        }
    }
}

class ThemeUtils
{
    static stylePreset = {
		0: { // Firefox 4
			"style": "0",
			"pageStyle": "0",
			"basedOn": "4.0",
			"newlogo": false
		},
		1: { // Firefox 5
			"style": "1",
			"pageStyle": "0",
			"basedOn": "5.0",
			"newlogo": false
		},
		2: { // Firefox 6
			"style": "2",
			"pageStyle": "0",
			"basedOn": "6.0",
			"newlogo": false
		},
		3: { // Firefox 8
			"style": "3",
			"pageStyle": "1",
			"basedOn": "8.0",
			"newlogo": false
		},
		4: { // Firefox 10
			"style": "4",
			"pageStyle": "1",
			"basedOn": "10.0",
			"newlogo": false
		},
        5: { // Firefox 14
			"style": "5",
			"pageStyle": "2",
			"basedOn": "14.0",
			"newlogo": false
		},
        6: { // Firefox 28
			"style": "5",
			"pageStyle": "3",
			"basedOn": "28.0",
			"newlogo": true
		},
        7: { // Firefox 29
			"style": "6",
			"pageStyle": "3",
			"basedOn": "29.0",
			"newlogo": true
		},
		8: { // Firefox 56
			"style": "7",
			"pageStyle": "4",
			"basedOn": "56.0.2",
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

		// set media queries as attributes, these don't have to be updated so these can be here
		let queries = [
			"-moz-ev-native-controls-patch",
			"-moz-windows-compositor",
		]
		
		queries.forEach((query) => {
				let queryAttr = query.slice(1);
				if (window.matchMedia(`(${query})`).matches) {
					document.documentElement.setAttribute(queryAttr, "true");
				}
			}
		);
    }
}

const presetObserver = {
    observe: function (subject, topic, data) {
        if (topic == "nsPref:changed")
            ThemeUtils.setStylePreset();
    },
};

Services.prefs.addObserver("Echelon.Appearance.Preset", presetObserver, false);

let EXPORTED_SYMBOLS = [ "PrefUtils", "BrandUtils", "waitForElement", "renderElement", "VersionUtils", "ThemeUtils" ];