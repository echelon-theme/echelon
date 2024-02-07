// ==UserScript==
// @name			Echelon :: Title Text
// @description 	Changes the window title formats.
// @author			aubymori
// @include			main
// ==/UserScript===

{
    let root = document.documentElement;
    let titles = BrandUtils.getUserTitles();

    root.dataset.titleDefault = titles.default;
    root.dataset.titlePrivate = titles.private;
    root.dataset.contentTitleDefault = titles.contentDefault;
    root.dataset.contentTitlePrivate = titles.contentPrivate;
}