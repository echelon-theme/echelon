// FOR PRE-FIREFOX 23 STYLE

let root = document.documentElement;

let echelonStyle = Services.prefs.getIntPref("Echelon.Appearance.Style");
let echelonOldLogo = Services.prefs.getBoolPref("Echelon.Appearance.NewLogo");

if (echelonOldLogo) {
	root.setAttribute("echelon-new-logo", echelonOldLogo);
}

// ECHELON STYLE

if (echelonStyle <= 2) {
	root.setAttribute("echelon-style", "1");
}

if (echelonStyle <= 1) {
	root.setAttribute("no-snippet-icon", "true");
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
Services.scriptloader.loadSubScript("chrome://userchrome/content/JS/echelon_utils.uc.js");

let product = getFullProductName();
document.title = `${product} Start Page`;