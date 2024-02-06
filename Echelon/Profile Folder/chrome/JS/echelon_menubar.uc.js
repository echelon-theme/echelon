// ==UserScript==
// @name			Echelon :: Menu Bar
// @description 	Links title bar visibility to menu bar visibility in Strata.
// @author			aubymori
// @include			main
// ==/UserScript==

function menuBarMutation(list, observer)
{
    for (const mut of list)
    {
        if (mut.type == "attributes" && mut.attributeName == "autohide")
        {
            let autohide = mut.target.getAttribute("autohide") == "true";
            let theme = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
            if (theme < ECHELON_LAYOUT_AUSTRALIS)
            {
                gCustomizeMode.toggleTitlebar(!autohide);
            }
        }
    }
}

function observeMenuBar()
{
    
    let menubar = document.getElementById("toolbar-menubar");
    if (menubar)
    {
        let observer = new MutationObserver(menuBarMutation);
        observer.observe(menubar, { attributes: true });
    }
}