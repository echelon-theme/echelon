if (windowRoot?.ownerGlobal?.gBrowser)
{
    if (!windowRoot.ownerGlobal.PrivateBrowsingUtils.isBrowserPrivate(windowRoot.ownerGlobal.gBrowser))
    {
        document.body.classList.remove("private");
        document.body.classList.add("normal");
        
        document.title = document.getElementById("errorTitleTextNormal").innerText;
        document.querySelector("link[rel=\"icon\"]").setAttribute("href", "chrome://userchrome/content/pages/privatebrowsing/images/question-16.png");
    }
}

const { EchelonThemeManager } = ChromeUtils.importESModule("chrome://modules/content/EchelonThemeManager.sys.mjs");
let g_themeManager = new EchelonThemeManager;
g_themeManager.init(
    document.documentElement,
    {
        style: true
    }
);