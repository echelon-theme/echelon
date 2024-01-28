// ==UserScript==
// @name			Echelon :: About Item
// @description 	Changes the About item text to match brand name.
// @author			aubymori
// @include			main
// ==/UserScript===

function updateAboutItem()
{
    waitForElement("#aboutName").then(e => {
        e.label = `About ${getShortProductName()}`;
    })
}