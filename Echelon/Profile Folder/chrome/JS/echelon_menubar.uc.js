// ==UserScript==
// @name			Echelon :: Menu Bar
// @description 	Links title bar visibility to menu bar visibility in Strata.
// @author			aubymori
// @include			main
// ==/UserScript==

let theme;

function menuBarMutation(list, observer)
{
    for (const mut of list)
    {
        if (mut.type == "attributes" && mut.attributeName == "autohide")
        {
            console.log("Autohide change");
            let autohide = mut.target.getAttribute("autohide") == "true";
            gCustomizeMode.toggleTitlebar(!autohide);
        }
    }
}

function observeMenuBar()
{
    theme = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
    let menubar = document.getElementById("toolbar-menubar");
    if (menubar && theme < ECHELON_LAYOUT_AUSTRALIS)
    {
        let observer = new MutationObserver(menuBarMutation);
        observer.observe(menubar, { attributes: true });
    }
}