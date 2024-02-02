// ==UserScript==
// @name			Echelon :: Old Search Icons
// @description 	Restore old icons for search engines.
// @author			aubymori
// @include			main
// ==/UserScript==

// Make sure this include is available where needed
// (checking without "in" causes an error btw)
if (!"tryGetIntPref" in globalThis || !"tryGetBoolPref" in globalThis || !"waitForElement" in globalThis)
	Services.scriptloader.loadSubScript("chrome://userchrome/content/JS/echelon_utils.uc.js");

const { SearchService } = ChromeUtils.importESModule("resource://gre/modules/SearchService.sys.mjs");
const { SearchUtils } = ChromeUtils.importESModule("resource://gre/modules/SearchUtils.sys.mjs");

const REPLACEMENTS = {
	"[addon]google@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/google.png",
	"[addon]bing@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/bing.png",
	"[addon]ebay@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/ebay.png"
};

/* Style 3 with new logo and Style 4+ */
const REPLACEMENTS_NEW = {
	"[addon]google@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/google_new.ico",
	"[addon]bing@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/bing_new.ico",
	"[addon]ebay@search.mozilla.org": "chrome://userchrome/content/images/icons/engines/ebay_new.ico"
};

function replaceEngineIcon(engine)
{
	let style = tryGetIntPref("Echelon.Appearance.Style");
	let newLogo = tryGetBoolPref("Echelon.Appearance.NewLogo");
	let table = (style >= 4 || (style == 3 && newLogo))
	? REPLACEMENTS_NEW
	: REPLACEMENTS;

	for (const replacement in table)
	{
		if (engine._loadPath == replacement)
		{
			engine._iconURI = SearchUtils.makeURI(table[replacement]);
			break;
		}
	}
}

let getVisibleEngines_orig = null;
async function getVisibleEngines_hook()
{
	let engines = await getVisibleEngines_orig();
	for (const engine of engines)
	{
		replaceEngineIcon(engine);
	}
	return engines;
}

let getDefault_orig = null;

async function getDefault_hook()
{
	let engine = await getDefault_orig();
	replaceEngineIcon(engine);
	return engine;
}

let service = new SearchService();

getVisibleEngines_orig = service.getVisibleEngines.bind(service);
service.getVisibleEngines = getVisibleEngines_hook.bind(service);

getDefault_orig = service.getDefault.bind(service);
service.getDefault = getDefault_hook.bind(service);

Services.search = service;

let style = tryGetIntPref("Echelon.Appearance.Style");
if (style < 5)
{
	waitForElement(".searchbar-search-icon").then(async function(e) {
		let engine = await Services.search.getDefault();
		e.setAttribute("src", engine._iconURI.spec);
	});

	waitForElement(".searchbar-textbox").then(async function(e) {
		let engine = await Services.search.getDefault();
		e.placeholder = engine._name;
	});
}