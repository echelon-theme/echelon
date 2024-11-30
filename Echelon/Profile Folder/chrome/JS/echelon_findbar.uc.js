// ==UserScript==
// @name			Echelon :: Findbar
// @description 	Fix fake outer border border radius behavior
// @author			Travis
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    let urlbar = null;

    function onFindBarVisibility(list)
    {
        if (urlbar.hasAttribute("hidden"))
        {
            document.getElementById("browser").removeAttribute("findbar-focused");
        }
        else
        {
            document.getElementById("browser").setAttribute("findbar-focused", "true");
        }
    }

    waitForElement(".browserContainer > findbar").then(e => {
        urlbar = e;
        let observer = new MutationObserver(onFindBarVisibility);
        observer.observe(e, { attributes: true, attributeFilter: ["hidden"] });
    });
}
