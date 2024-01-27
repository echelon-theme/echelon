// ==UserScript==
// @name			Echelon :: Title Text
// @description 	Changes the window title formats.
// @author			aubymori
// @include			main
// ==/UserScript==

const TITLE_DEFAULT = "Mozilla Firefox";
const TITLE_PRIVATE = "Mozilla Firefox (Private Browsing)";
const CONTENTTITLE_DEFAULT = "CONTENTTITLE - Mozilla Firefox";
const CONTENTTITLE_PRIVATE = "CONTENTTITLE - Mozilla Firefox (Private Browsing)";

function changeTitleFormats()
{
    let root = document.documentElement;
    root.dataset.titleDefault = TITLE_DEFAULT;
    root.dataset.titlePrivate = TITLE_PRIVATE;
    root.dataset.contentTitleDefault = CONTENTTITLE_DEFAULT;
    root.dataset.contentTitlePrivate = CONTENTTITLE_PRIVATE;

    /* Update initial title. */
    document.querySelector("title").innerText = root.getAttribute("privatebrowsingmode")
    ? TITLE_PRIVATE
    : TITLE_DEFAULT;
}