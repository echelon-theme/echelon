// ==UserScript==
// @name			Echelon :: Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// @include         chrome://browser/content/aboutDialog.xhtml
// @include         about:config
// ==/UserScript==

let root = document.documentElement;

let style = tryGetIntPref("Echelon.Appearance.Style");
for (let i = 1; i <= theme; i++)
{
    root.setAttribute(`echelon-style-${i}`, "true");
}

let branch = tryGetStringPref("app.update.channel");
root.setAttribute("echelon-update-channel", branch);