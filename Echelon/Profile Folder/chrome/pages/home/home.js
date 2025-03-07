var { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
let { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
Components.utils.import("resource:///modules/sessionstore/SessionStore.jsm", this);

let root = document.documentElement;
let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Homepage.Style");
let newLogo = PrefUtils.tryGetBoolPref("Echelon.Appearance.NewLogo");
let snippets = PrefUtils.tryGetBoolPref("Echelon.Homepage.HideCustomSnippets");
let product = BrandUtils.getBrandingKey("brandShortName");

function createHomePage() {
    let container = document.body;

    homeFragment = `
        <html:div id="brandStartSpacer" />

        <html:div id="brandStart">
            <img id="brandStartLogo" alt="" />
        </html:div>

        <html:div id="searchContainer">
        <html:form method="get" name="searchForm" id="searchForm" onsubmit="onSearchSubmit(event)">
            <html:div id="searchLogoContainer"><img id="searchEngineLogo" /></html:div>
            <html:div id="searchInputContainer">
            <html:input type="text" name="q" value="" id="searchText" maxlength="256" placeholder="" />

            </html:div>
            <html:div id="searchButtons">
            <html:input id="searchSubmit" type="submit" value="${homeBundle.GetStringFromName("searchEngineButton")}" />
            </html:div>
        </html:form>
        </html:div>

        <html:div id="contentContainer">
        <html:div id="snippetContainer">
            <html:div id="defaultSnippets" hidden="true">
                <html:span id="defaultSnippet1">${homeBundle.formatStringFromName("snippet_1", [product])}</html:span>
                <html:span id="defaultSnippet2">${homeBundle.formatStringFromName("snippet_2", [product])}</html:span>
            </html:div>
            <html:div id="snippets"/>
        </html:div>

        <html:div id="launcher">
            <html:button id="restorePreviousSession" onclick="restoreLastSession()">${homeBundle.GetStringFromName("restoreLastSessionButton")}</html:button>
        </html:div>
        </html:div>

        <html:div id="bottomSection">
            <html:div id="aboutMozilla">
                <html:a href="http://www.mozilla.com/about/">${homeBundle.GetStringFromName("aboutMozilla")}</html:a>
            </html:div>
            <html:div id="syncLinksContainer">
                <html:a onclick="windowRoot.ownerGlobal.openPreferences('sync');" class="sync-link" id="setupSyncLink">${homeBundle.GetStringFromName("syncSetup")}</html:a>
                <html:a onclick="windowRoot.ownerGlobal.gSync.openConnectAnotherDevice();" class="sync-link" id="pairDeviceLink">${homeBundle.GetStringFromName("pairDevice")}</html:a>
            </html:div>
        </html:div>
    `

    stylesheet = `
        <html:link rel="stylesheet" href="chrome://userchrome/content/pages/home/home-old.css" />
    `
    
    if (style >= 2) {
        homeFragment = `
            <html:div class="spacer"/>
            <html:div id="topSection">
            <html:img id="brandLogo"/>

            <html:div id="searchContainer">
                <html:form name="searchForm" id="searchForm" onsubmit="onSearchSubmit(event)">
                <html:div id="searchLogoContainer"><img id="searchEngineLogo"/></html:div>
                <html:input type="text" name="q" value="" id="searchText" maxlength="256"
                        autofocus="autofocus" />
                <html:input id="searchSubmit" type="submit" value="${homeBundle.GetStringFromName("searchEngineButton")}"/>
                </html:form>
            </html:div>

            <html:div id="snippetContainer">
                <html:div id="defaultSnippets" hidden="true">
                    <html:span id="defaultSnippet1">${homeBundle.formatStringFromName("snippet_1", [product])}</html:span>
                    <html:span id="defaultSnippet2">${homeBundle.formatStringFromName("snippet_2", [product])}</html:span>
                </html:div>
                <html:div id="snippets"/>
            </html:div>
            </html:div>
            <html:div class="spacer"/>

            <html:div id="launcher">
            <html:button class="launchButton" id="downloads" onclick="windowRoot.ownerGlobal.DownloadsPanel.showDownloadsHistory();">${homeBundle.GetStringFromName("downloadsButton")}</html:button>
            <html:button class="launchButton" id="bookmarks" onclick="windowRoot.ownerGlobal.PlacesCommandHook.showPlacesOrganizer('UnfiledBookmarks');">${homeBundle.GetStringFromName("bookmarksButton")}</html:button>
            <html:button class="launchButton" id="history" onclick="windowRoot.ownerGlobal.PlacesCommandHook.showPlacesOrganizer('History');">${homeBundle.GetStringFromName("historyButton")}</html:button>
            <html:button class="launchButton" id="addons" onclick="windowRoot.ownerGlobal.BrowserAddonUI.openAddonsMgr('addons://list/extension');">${homeBundle.GetStringFromName("addonsButton")}</html:button>
            <html:button class="launchButton" id="sync" onclick="windowRoot.ownerGlobal.openPreferences('sync');">${homeBundle.GetStringFromName("syncButton")}</html:button>
            <html:button class="launchButton" id="settings" onclick="windowRoot.ownerGlobal.openPreferences();">${homeBundle.GetStringFromName("settingsButton")}</html:button>
            <html:div id="restorePreviousSessionSeparator"/>
            <html:button class="launchButton" id="restorePreviousSession" onclick="restoreLastSession()">${homeBundle.GetStringFromName("restoreLastSessionButton")}</html:button>
            </html:div>

            <html:a id="aboutMozilla" href="http://www.mozilla.com/about/"/>
        `

        stylesheet = `
            <html:link rel="stylesheet" href="chrome://userchrome/content/pages/home/home-new.css" />
        `
    }

    document.head.appendChild(MozXULElement.parseXULToFragment(stylesheet));
    container.appendChild(MozXULElement.parseXULToFragment(homeFragment));

    // Set links on snippets
    document.querySelector("#defaultSnippet1 a").href = "https://www.mozilla.org/firefox/features/?utm_source=snippet&utm_medium=snippet&utm_campaign=default+feature+snippet";
    document.querySelector("#defaultSnippet2 a").href = "https://addons.mozilla.org/firefox/?utm_source=snippet&utm_medium=snippet&utm_campaign=addons";

    Services.search.getDefault().then(engine => {
		window.engine = engine;
		
		/* Only Google has a logo. Others use placeholder. */
		if (engine._name != "Google" && style > 4)
		{
			document.getElementById("searchEngineLogo").hidden = true;
			document.getElementById("searchText").placeholder = engine._name;
		}

        if (style == 4)
        {
            document.getElementById("searchText").placeholder = homeBundle.GetStringFromName("searchEngineButton");
            document.getElementById("searchSubmit").value = "▶";
        }
	});

    if (style >= 3) {
        let brandLogo = document.createElement("div");
        brandLogo.id = "brandLogo";

        let brandLogoImg = document.getElementById("brandLogo");

        brandLogoImg.replaceWith(brandLogo);
    }

    // focusInput();
    updateHomepageStyle();
    insertCustomSnippets();

    if (SessionStore.canRestoreLastSession && !PrivateBrowsingUtils.isWindowPrivate(window))
    {
        document.getElementById("launcher").setAttribute("session", "true");
    }

    fitToWidth();
    window.addEventListener("resize", fitToWidth);  
}

function insertCustomSnippets()
{
    let defaultSnippetsElt = document.getElementById("defaultSnippets");

    if (!snippets) {
        // remove default snippets if custom snippets are shown

        Array.from(defaultSnippetsElt.childNodes).forEach((elm) => {
            elm.remove();
        });
    }

    // TODO: CHANGE URL WHEN RELEASE CANIDATE 1
    const snippetsURL = "https://raw.githack.com/echelon-theme/echelon-theme.github.io/main/snippets.json";

    fetch(snippetsURL, {method: "Get"})
    .then((response) => response.json())

    .then((data) => {
        for (const snippet of data.snippets) {
            let snippetElem = document.createElement("span");

            snippetElem.id = snippet.id;
            snippetElem.classList.add("customSnippet");
            snippetElem.style.setProperty("--background-image", `url(${snippet.image})`);
            snippetElem.innerHTML = snippet.text;

            if (snippet.link) {
                snippetElem.querySelector("a").href = snippet.link;
            }

            // Option to hide custom snippets

            try
			{
                if (!snippets) {
                    defaultSnippetsElt.appendChild(snippetElem);
                }
			}
			catch (e)
			{
				if (e.name == "NS_ERROR_UNEXPECTED") // preference does not exist
				{
					try
					{
						PrefUtils.trySetBoolPref("Echelon.Homepage.HideCustomSnippets", false);
					}
					catch (e) {}
				}
			}
        }

        showSnippets();
    })

    .catch(error => {
        console.error("Can't fetch unique snippets, show default:", error);
        showSnippets();
    });
}

function showSnippets()
{
    let snippetsElt = document.getElementById("snippets");
    // Show default snippets otherwise.
    let defaultSnippetsElt = document.getElementById("defaultSnippets");
    let entries = defaultSnippetsElt.querySelectorAll("span");
    // Choose a random snippet.  Assume there is always at least one.
    let randIndex = Math.round(Math.random() * (entries.length - 1));
    let entry = entries[randIndex];

    // Move the default snippet to the snippets element.
    snippetsElt.appendChild(entry);
    
    if (!style && style <= 1) {
        let snippethref = document.querySelector("#snippets > span > a").href;

        if (snippethref) {
            snippetsElt.onclick = function(){window.open(snippethref, "_self")};
        }
    }

    if (!snippets & style == 2) {
        snippetsElt.setAttribute("hidden", "true");
    }
}


function updateHomepageStyle() {
    if (newLogo) {
        root.setAttribute("echelon-appearance-newlogo", "true");
    }
    
    for (let i = 1; i <= style; i++)
    {
        root.setAttribute(`echelon-style-${i}`, "true");
    }

    document.title = homeBundle.formatStringFromName("title_format", [BrandUtils.getBrandingKey("brandFullName")]);
}

function onSearchSubmit(e)
{
	if (window.engine && document.getElementById("searchText").value != "")
	{
		location.href = window.engine.getSubmission(document.getElementById("searchText").value)._uri.spec;
	}

	e.preventDefault();
}

if (location.href.startsWith("about:newtab"))
{
    let blank = PrefUtils.tryGetBoolPref("browser.newtabpage.enabled", true);
    if (!blank)
    {
        document.documentElement.hidden = true;

        // least nitpicking
        // Do not localize. New Tab will be added as a separate page eventually.
        document.title = "New Tab";
    }
}

function focusInput() {
    setTimeout(() => document.getElementById("searchText").focus(), 100); // hack to autofocus on input box
}

addEventListener("load", createHomePage);

function restoreLastSession()
{
	if (SessionStore.canRestoreLastSession)
	{
		SessionStore.restoreLastSession();
		document.getElementById("launcher").removeAttribute("session");
	}
}

function fitToWidth() {
    if (window.scrollMaxX) {
        document.body.setAttribute("narrow", "true");
    } else if (document.body.hasAttribute("narrow")) {
        document.body.removeAttribute("narrow");
        fitToWidth();
    }
}