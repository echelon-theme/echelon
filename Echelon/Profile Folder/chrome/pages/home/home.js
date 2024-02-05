const { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

// FOR PRE-FIREFOX 23 STYLE

let root = document.documentElement;
let searchText = document.getElementById("searchText");

let echelonStyle = Services.prefs.getIntPref("Echelon.Appearance.Style");
let echelonHomepageStyle = Services.prefs.getIntPref("Echelon.Appearance.Homepage.Style");
let echelonOldLogo = Services.prefs.getBoolPref("Echelon.Appearance.NewLogo");


if (echelonOldLogo) {
	root.setAttribute("echelon-new-logo", echelonOldLogo);
}

// BROWSER NAME AND BRANCH (FOR ALT BRANDING)

root.setAttribute("browser-name", BrandUtils.getBrowserName());
root.setAttribute("update-channel", BrandUtils.getUpdateChannel());

// ECHELON STYLE

if (echelonHomepageStyle == 0) {
	root.setAttribute("no-snippet-icon", "true");
}

if (echelonHomepageStyle <= 1) {
	root.setAttribute("echelon-style", "1");
}

if (echelonHomepageStyle == 2) {
	root.removeAttribute("echelon-new-logo");
}

if (echelonHomepageStyle == 3) {
	root.setAttribute("echelon-new-logo", "true");
}

if (echelonHomepageStyle == 4) {
	root.setAttribute("echelon-style", "5");
	root.setAttribute("echelon-new-logo", "true");
	searchText.setAttribute("placeholder", "Search");
}

// SNIPPET RANDOMIZER

function percentChance(chance)
{
    return (Math.random() * 100) <= chance;
}

function snippetRandomizer() 
{
	let selector = ".snippet1";
	if (percentChance(75))
	{
		selector = ".snippet2";
	}

	document.querySelector(selector).hidden = true;
}

snippetRandomizer();

// TITLE TEXT

let product = BrandUtils.getFullProductName();
document.title = `${product} Start Page`;

// HIDE IF USER WANTS BLANK PAGE FOR NEW TAB

if (location.href.startsWith("about:newtab"))
{
	let blank = PrefUtils.tryGetBoolPref("browser.newtabpage.enabled", true);
	if (!blank)
	{
		document.documentElement.hidden = true;

		// least nitpicking
		document.title = "New Tab";
	}
}

// SET UP SEARCH ENGINE

Services.search.getDefault().then(engine => {
	window.engine = engine;
	
	/* Only Google has a logo. Others use placeholder. */
	if (engine._name != "Google" && echelonStyle < 5)
	{
		document.getElementById("searchLogo").hidden = true;
		document.getElementById("searchText").placeholder = engine._name;
	}
});

function onSearchSubmit(e)
{
	if (window.engine)
	{
		location.href = window.engine.getSubmission(document.getElementById("searchText").value)._uri.spec;
	}

	e.preventDefault();
}