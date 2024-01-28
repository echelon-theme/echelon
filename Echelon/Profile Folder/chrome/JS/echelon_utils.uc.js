// ==UserScript==
// @name			Echelon :: Utils
// @description 	Common utilities for Echelon scripts.
// @author			ephemeralViolette
// @include			main
// @include			chrome://browser/content/aboutDialog.xhtml
// @loadOrder       1
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
			element = document.createElement(name);
			break;
		case "xul":
			element = document.createXULElement(name);
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

async function waitForElement(query, parent = document, timeout = -1)
{
	let startTime = Date.now();
	
	while (parent.querySelector(query) == null)
	{
		if (timeout > -1 && Date.now > startTime + timeout)
		{
			return null;
		}
		await new Promise(r => requestAnimationFrame(r));
	}
	
	return parent.querySelector(query);
}

function internalTryGetPref(name, fallback, func)
{
	let result = fallback;
	try
	{
		result = func(name);
	}
	catch (e) {}
	return result;
}

function tryGetBoolPref(name, fallback = false)
{
	return internalTryGetPref(name, fallback, Services.prefs.getBoolPref);
}

function tryGetIntPref(name, fallback = 0)
{
	return internalTryGetPref(name, fallback, Services.prefs.getIntPref);
}

function tryGetStringPref(name, fallback = "")
{
	return internalTryGetPref(name, fallback, Services.prefs.getStringPref);
}

function internalTrySetPref(name, value, func)
{
	try
	{
		func(name, value);
	}
	catch (e) {}
}

function trySetBoolPref(name, value)
{
	internalTrySetPref(name, value, Services.prefs.setBoolPref);
}

function trySetIntPref(name, value)
{
	internalTrySetPref(name, value, Services.prefs.setIntPref);
}

function trySetStringPref(name, value)
{
	internalTrySetPref(name, value, Services.prefs.setStringPref);
}

function getBrowserName()
{
	let spoof = tryGetStringPref("Echelon.Option.BrowserSpoof");
	if (spoof == "")
	{
		return Services.appinfo.name;
	}
	return spoof;
}

function getUpdateChannel()
{
	let spoof = tryGetStringPref("Echelon.Option.ChannelSpoof");
	if (spoof == "")
	{
		return Services.appinfo.defaultUpdateChannel;
	}
	return spoof;
}

function getShortProductName()
{
	let custom = tryGetStringPref("Echelon.Option.BrandName");
	if (custom != "")
	{
		return custom;
	}

	switch (getUpdateChannel())
	{
		case "nightly":
			return "Nightly";
		case "aurora":
			return "Aurora";
		default:
			return getBrowserName();
	}
}

function getDefaultProductName()
{
	switch (getUpdateChannel())
	{
		case "nightly":
			return "Nightly";
		case "aurora":
			return "Aurora";
		default:
			if (getBrowserName() == "Firefox")
			{
				return "Mozilla Firefox";
			}
			return getBrowserName();
	}
}

function getFullProductName()
{
	let custom = tryGetStringPref("Echelon.Option.BrandName");
	if (custom == "")
	{
		return getDefaultProductName();
	}
	return custom;
}

function getDefaultTitles()
{
	let product = getFullProductName();
	return {
		"default": product,
		"private": `${product} (Private Browsing)`,
		"contentDefault": `CONTENTTITLE - ${product}`,
		"contentPrivate": `CONTENTTITLE - ${product} (Private Browsing)`
	};
}

function getUserTitles()
{
	let result = getDefaultTitles();
	
	const prefmap = {
		"default": "Echelon.WindowTitle.Default",
		"private": "Echelon.WindowTitle.Private",
		"contentDefault": "Echelon.WindowTitle.ContentDefault",
		"contentPrivate": "Echelon.WindowTitle.ContentPrivate"
	};

	for (const prop in prefmap)
	{
		let string = tryGetStringPref(prefmap[prop]);
		if (string != "")
		{
			result[prop] = string;
		}
	}

	return result;
}