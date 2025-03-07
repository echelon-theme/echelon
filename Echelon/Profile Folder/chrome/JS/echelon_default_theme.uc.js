// ==UserScript==
// @name			Echelon :: Default Theme
// @description 	Adds an attribute to the root element specifying whether or not the theme is the default Light/Dark theme.
// @author			aubymori
// @include			main
// ==/UserScript==

{   
    function updateThemeAttr()
    {
        let root = document.documentElement;
        let id = PrefUtils.tryGetStringPref("extensions.activeThemeID");
        
        switch (id)
        {
            case "firefox-compact-light@mozilla.org":
                root.setAttribute("default-light-theme", "true");
                root.setAttribute("compact-theme", "true");
                root.removeAttribute("default-dark-theme");
                break;
            case "firefox-compact-dark@mozilla.org":
                root.setAttribute("default-dark-theme", "true");
                root.setAttribute("compact-theme", "true");
                root.removeAttribute("default-light-theme");
                break;
            default:
                root.removeAttribute("default-light-theme");
                root.removeAttribute("default-dark-theme");
                root.removeAttribute("compact-theme");
                break;
        }
    }

    Services.prefs.addObserver("extensions.activeThemeID", updateThemeAttr);
    updateThemeAttr();
}