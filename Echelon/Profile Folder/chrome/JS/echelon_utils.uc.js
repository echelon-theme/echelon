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
	static getBrowserName()
	{
		let spoof = PrefUtils.tryGetStringPref("Echelon.Option.BrowserSpoof");
		if (spoof == "")
		{
			return Services.appinfo.name;
		}
		return spoof;
	}

	static getUpdateChannel()
	{
		let spoof = PrefUtils.tryGetStringPref("Echelon.Option.ChannelSpoof");
		if (spoof == "")
		{
			return Services.appinfo.defaultUpdateChannel;
		}
		return spoof;
	}

	static getShortProductName()
	{
		let custom = PrefUtils.tryGetStringPref("Echelon.Option.BrandName");
		if (custom != "")
		{
			return custom;
		}

		switch (this.getUpdateChannel())
		{
			case "nightly":
				return "Nightly";
			case "aurora":
				return "Aurora";
			default:
				return this.getBrowserName();
		}
	}

	static getDefaultProductName()
	{
		switch (this.getUpdateChannel())
		{
			case "nightly":
				return "Nightly";
			case "aurora":
				return "Aurora";
			default:
				if (this.getBrowserName() == "Firefox")
				{
					return "Mozilla Firefox";
				}
				return this.getBrowserName();
		}
	}

	static getFullProductName()
	{
		let custom = PrefUtils.tryGetStringPref("Echelon.Option.BrandName");
		if (custom == "")
		{
			return this.getDefaultProductName();
		}
		return custom;
	}

	static getDefaultTitles()
	{
		let product = this.getFullProductName();
		return {
			"default": product,
			"private": `${product} (Private Browsing)`,
			"contentDefault": `CONTENTTITLE - ${product}`,
			"contentPrivate": `CONTENTTITLE - ${product} (Private Browsing)`
		};
	}

	static getUserTitles()
	{
		let result = this.getDefaultTitles();
		
		const prefmap = {
			"default": "Echelon.WindowTitle.Default",
			"private": "Echelon.WindowTitle.Private",
			"contentDefault": "Echelon.WindowTitle.ContentDefault",
			"contentPrivate": "Echelon.WindowTitle.ContentPrivate"
		};

		for (const prop in prefmap)
		{
			let string = PrefUtils.tryGetStringPref(prefmap[prop]);
			if (string != "")
			{
				result[prop] = string;
			}
		}

		return result;
	}
}

let EXPORTED_SYMBOLS = [ "PrefUtils", "BrandUtils", "waitForElement", "renderElement" ];