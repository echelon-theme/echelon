var { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

let { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
Components.utils.import("resource:///modules/sessionstore/SessionStore.jsm", this);

let root = document.documentElement;
let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Homepage.Style");
let snippets = Services.prefs.getBoolPref("Echelon.Homepage.HideCustomSnippets");
let product = BrandUtils.getBrandingKey("fullName");
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
                    <span id="snippetEchelon">${homeBundle.GetStringFromName("snippet_echelon")}</span>
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
        </div>
    `

    stylesheet = `
        <html:link rel="stylesheet" href="chrome://userchrome/content/pages/home/home-old.css" />
    `
    
    if (style >= 1) {
        homeFragment = `
            <div class="spacer"/>
            <div id="topSection">
            <html:img id="brandLogo" alt=""/>

            <div id="searchContainer">
                <html:form name="searchForm" id="searchForm" onsubmit="onSearchSubmit(event)">
                <div id="searchLogoContainer"><img id="searchEngineLogo"/></div>
                <html:input type="text" name="q" value="" id="searchText" maxlength="256"
                        autofocus="autofocus"/>
                <html:input id="searchSubmit" type="submit" value="${homeBundle.GetStringFromName("searchEngineButton")}"/>
                </html:form>
            </div>

            <div id="snippetContainer">
                <div id="defaultSnippets" hidden="true">
                    <span id="defaultSnippet1">${homeBundle.formatStringFromName("snippet_1", [product])}</span>
                    <span id="defaultSnippet2">${homeBundle.formatStringFromName("snippet_2", [product])}</span>
                    <span id="snippetEchelon">${homeBundle.GetStringFromName("snippet_echelon")}</span>
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

            <a id="aboutMozilla" href="${homeBundle.GetStringFromName("aboutMozilla")}"/>
        `

        stylesheet = `
            <html:link rel="stylesheet" href="chrome://userchrome/content/pages/home/home-new.css" />
        `
    }

    document.head.appendChild(MozXULElement.parseXULToFragment(stylesheet));
    container.appendChild(MozXULElement.parseXULToFragment(homeFragment));

    document.querySelector("#defaultSnippet1 a").href = "https://www.mozilla.org/firefox/features/?utm_source=snippet&utm_medium=snippet&utm_campaign=default+feature+snippet";
    document.querySelector("#defaultSnippet2 a").href = "https://addons.mozilla.org/firefox/?utm_source=snippet&utm_medium=snippet&utm_campaign=addons";
    document.querySelector("#snippetEchelon a").href = "https://github.com/echelon-theme/echelon/issues";

    Services.search.getDefault().then(engine => {
		window.engine = engine;
		
		/* Only Google has a logo. Others use placeholder. */
		if (engine._name != "Google" && echelonHomepageStyle == 3)
		{
			document.getElementById("searchEngineLogo").hidden = true;
			document.getElementById("searchText").placeholder = engine._name;
		}
	});

    updateHomepageStyle();
    insertCustomSnippets();
}

function insertCustomSnippets()
{
    const snippetsURL = "https://rawcdn.githack.com/echelon-theme/echelon-theme.github.io/0d2cc67936690454e8bea88ac488c478d8e889d1/snippets.json";

    fetch(snippetsURL, {method: "Get"})
    .then((response) => response.json())

    .then((data) => {
        for (const snippet of data.snippets) {
            let snippetElem = document.createElement("span");

            snippetElem.id = snippet.id;
            snippetElem.classList.add("customSnippet");
            snippetElem.style.setProperty("background-image", `url(${snippet.image})`);
            snippetElem.innerHTML = snippet.text;

            if (snippet.link) {
                snippetElem.querySelector("a").href = snippet.link;
            }

            // Option to hide custom snippets

            try
			{
                if (!snippets) {
                    document.getElementById("defaultSnippets").appendChild(snippetElem);
                }
			}
			catch (e)
			{
				if (e.name == "NS_ERROR_UNEXPECTED") // preference does not exist
				{
					try
					{
						PrefUtils.trySetBoolPref("Echelon.Appearance.TabsOnTop", true);
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
}


function updateHomepageStyle() {
    root.setAttribute("titleShortName", titles.appmenuName);
    
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