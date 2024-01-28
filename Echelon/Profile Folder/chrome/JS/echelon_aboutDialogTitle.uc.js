// ==UserScript==
// @name			Echelon :: Change About Box Title
// @description 	Changes About Box Title Bar Text
// @author			Travis
// @include			chrome://browser/content/aboutDialog.xhtml
// @exclude			main
// @loadOrder       2
// ==/UserScript==

const aboutDialog = document.getElementById("aboutDialog");
const aboutDialogTitle = `About ${getFullProductName()}`;
aboutDialog.setAttribute("title", aboutDialogTitle);