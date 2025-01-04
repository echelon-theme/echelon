var { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

let { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
Components.utils.import("resource:///modules/sessionstore/SessionStore.jsm", this);

let root = document.documentElement;
let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Homepage.Style");
let newLogo = PrefUtils.tryGetBoolPref("Echelon.Appearance.NewLogo");
let snippets = PrefUtils.tryGetBoolPref("Echelon.Homepage.HideCustomSnippets");
let product = BrandUtils.getBrandingKey("productName");
let titles = BrandUtils.getDefaultTitles();

function createHomePage() {
    let container = document.body;

    homeFragment = `
        <div id="brandStartSpacer" />

        <div id="brandStart">
            <img id="brandStartLogo" alt="" />
        </div>

        <div id="searchContainer">
        <html:form method="get" name="searchForm" id="searchForm" onsubmit="onSearchSubmit(event)">
            <div id="searchLogoContainer"><img id="searchEngineLogo" /></div>
            <div id="searchInputContainer">
            <html:input type="text" name="q" value="" id="searchText" maxlength="256" placeholder="" />

            </div>
            <div id="searchButtons">
            <html:input id="searchSubmit" type="submit" value="${homeBundle.GetStringFromName("searchEngineButton")}" />
            </div>
        </html:form>
        </div>

        <div id="contentContainer">
        <div id="snippetContainer">
            <div id="defaultSnippets" hidden="true">
                <span id="defaultSnippet1">${homeBundle.formatStringFromName("snippet_1", [product])}</span>
                <span id="defaultSnippet2">${homeBundle.formatStringFromName("snippet_2", [product])}</span>
            </div>
            <div id="snippets"/>
        </div>

        <div id="launcher">
            <button id="restorePreviousSession" onclick="restoreLastSession()">${homeBundle.GetStringFromName("restoreLastSessionButton")}</button>
        </div>
        </div>

        <div id="bottomSection">
            <div id="aboutMozilla">
                <html:a href="http://www.mozilla.com/about/">${homeBundle.GetStringFromName("aboutMozilla")}</html:a>
            </div>
            <div id="syncLinksContainer">
                <html:a onclick="windowRoot.ownerGlobal.openPreferences('sync');" class="sync-link" id="setupSyncLink">${homeBundle.GetStringFromName("syncSetup")}</html:a>
                <html:a onclick="windowRoot.ownerGlobal.gSync.openConnectAnotherDevice();" class="sync-link" id="pairDeviceLink">${homeBundle.GetStringFromName("pairDevice")}</html:a>
            </div>
        </div>
    `

    stylesheet = `
        <html:link rel="stylesheet" href="chrome://userchrome/content/pages/home/home-old.css" />
    `
    
    if (style >= 2) {
        homeFragment = `
            <div class="spacer"/>
            <div id="topSection">
            <html:img id="brandLogo"/>

            <div id="searchContainer">
                <html:form name="searchForm" id="searchForm" onsubmit="onSearchSubmit(event)">
                <div id="searchLogoContainer"><img id="searchEngineLogo"/></div>
                <html:input type="text" name="q" value="" id="searchText" maxlength="256"
                        autofocus="autofocus" />
                <html:input id="searchSubmit" type="submit" value="${homeBundle.GetStringFromName("searchEngineButton")}"/>
                </html:form>
            </div>

            <div id="snippetContainer">
                <div id="defaultSnippets" hidden="true">
                    <span id="defaultSnippet1">${homeBundle.formatStringFromName("snippet_1", [product])}</span>
                    <span id="defaultSnippet2">${homeBundle.formatStringFromName("snippet_2", [product])}</span>
                </div>
                <div id="snippets"/>
            </div>
            </div>
            <div class="spacer"/>

            <div id="launcher" session="true">
            <button class="launchButton" id="downloads">${homeBundle.GetStringFromName("downloadsButton")}</button>
            <button class="launchButton" id="bookmarks">${homeBundle.GetStringFromName("bookmarksButton")}</button>
            <button class="launchButton" id="history">${homeBundle.GetStringFromName("historyButton")}</button>
            <button class="launchButton" id="addons">${homeBundle.GetStringFromName("addonsButton")}</button>
            <button class="launchButton" id="sync">${homeBundle.GetStringFromName("syncButton")}</button>
            <button class="launchButton" id="settings">${homeBundle.GetStringFromName("settingsButton")}</button>
            <div id="restorePreviousSessionSeparator"/>
            <button class="launchButton" id="restorePreviousSession">${homeBundle.GetStringFromName("restoreLastSessionButton")}</button>
            </div>

            <html:a id="aboutMozilla" href="${homeBundle.GetStringFromName("aboutMozilla")}"/>
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

    focusInput();
    updateHomepageStyle();
    insertCustomSnippets();
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
    
    if (!style && style == 0) {
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
    root.setAttribute("titleShortName", titles.appmenuName);
    
    if (newLogo) {
        root.setAttribute("echelon-appearance-newlogo", "true");
    }
    
    for (let i = 1; i <= style; i++)
    {
        root.setAttribute(`echelon-style-${i}`, "true");
    }

    document.title = homeBundle.formatStringFromName("title_format", [product]);
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

if (SessionStore.canRestoreLastSession && !PrivateBrowsingUtils.isWindowPrivate(window))
{
	document.getElementById("launcher").setAttribute("session", "true");
}