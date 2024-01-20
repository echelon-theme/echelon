// ==UserScript==
// @name			Echelon :: Utils
// @description 	Common utilities for Echelon scripts.
// @author			ephemeralViolette
// @include			main
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