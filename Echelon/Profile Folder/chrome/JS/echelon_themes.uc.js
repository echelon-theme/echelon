// ==UserScript==
// @name			Echelon :: Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// @include         chrome://browser/content/aboutDialog.xhtml
// ==/UserScript==

let root = document.documentElement;

let style = Services.prefs.getIntPref("Echelon.Appearance.Style");
for (let i = 1; i <= style; i++)
{
    root.setAttribute(`echelon-style-${i}`, "true");
}

let branch = Services.prefs.getStringPref("app.update.channel");
root.setAttribute("echelon-update-channel", branch);