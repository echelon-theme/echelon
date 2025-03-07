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

let EXPORTED_SYMBOLS = [ "PrefUtils", "BrandUtils", "waitForElement", "renderElement", "VersionUtils" ];