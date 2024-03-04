// ==UserScript==
// @name			Echelon :: Dialogs
// @description 	Makes dialog boxes open as separate windows
// @author			aubymori
// @include			main
// ==/UserScript==

gDialogBox.open = async function open(aUrl, aInfo)
{
    window.openDialog(aUrl, "", "centerscreen,chrome,modal,resizable=no", aInfo);
};