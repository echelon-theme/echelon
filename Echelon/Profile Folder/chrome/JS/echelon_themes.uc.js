// ==UserScript==
// @name			Echelon Styles
// @description 	Checks about:config pref and adds an HTML attribute.
// @author			Travis
// @include			main
// ==/UserScript==

let getEchelonStyle = Services.prefs.getIntPref('Echelon.Appearance.Style');
var documentElement = document.documentElement;

documentElement.setAttribute("echelonstyle", getEchelonStyle);