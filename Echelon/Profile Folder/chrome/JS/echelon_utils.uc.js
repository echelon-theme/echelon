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
	static branding = {
		"firefox": {
			"fullName": "Mozilla Firefox",
			"productName": "Firefox",
			"vendorName": "Mozilla"
		},
		"aurora": {
			"fullName": "Aurora",
			"productName": "Aurora",
			"vendorName": "Mozilla"
		},
		"nightly": {
			"fullName": "Nightly",
			"productName": "Nightly",
			"vendorName": "Mozilla"
		},
		"echelon": {
			"fullName": "Echelon",
			"productName": "Echelon",
			"vendorName": "The Echelon Team"
		},
		"nara": {
			"fullName": "Nara",
			"productName": "Nara",
			"vendorName": "Network Neighborhood"
		},
		"fallback": {
			"fullName": Services.appinfo.name,
			"productName": Services.appinfo.name,
			"vendorName": Services.appinfo.vendor
		}
	};

	static getUpdateChannel()
	{
		return Services.appinfo.defaultUpdateChannel;
	}

	static getBrowserName()
	{
		let prefChoice = PrefUtils.tryGetStringPref("Echelon.Option.BrowserSpoof");

		switch (this.getUpdateChannel())
		{
			case "nightly":
				return "nightly";
			case "aurora":
				return "aurora";
			default: 
				if (Object.keys(this.branding).includes(prefChoice)) {
					return prefChoice;
				}
				return "fallback";
		}
	}

	static getBrandingKey(key)
	{
		let prefChoice = this.getBrowserName();

		return this.branding[prefChoice][key];
	}

	static getDefaultTitles()
	{
		let prefChoice = this.getBrowserName();
		let fullName = this.branding[prefChoice]["fullName"];

		if (prefChoice == "fallback") {
			prefChoice = Services.appinfo.name;
		}

		return {
			"default": fullName,
			"private": `${fullName} (Private Browsing)`,
			"contentDefault": `CONTENTTITLE - ${fullName}`,
			"contentPrivate": `CONTENTTITLE - ${fullName} (Private Browsing)`,
			"appmenuName": prefChoice
		};
	}
}

let EXPORTED_SYMBOLS = [ "PrefUtils", "BrandUtils", "waitForElement", "renderElement" ];