// ==UserScript==
// @name			Echelon :: Customize UI
// @description 	Adds arrows back to panels and places popups.
// @author			Travis
// @include			main
// ==/UserScript==

var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
waitForElement = waitForElement.bind(window);

let sb = Services.strings.createBundle("chrome://echelon/locale/properties/lightweightThemes.properties");

var EXPORTED_SYMBOLS = ["_defaultImportantThemes"];

const DEFAULT_THEME_ID = "default-theme@mozilla.org";
const LIGHT_THEME_ID = "firefox-compact-light@mozilla.org";
const DARK_THEME_ID = "firefox-compact-dark@mozilla.org";
const ALPENGLOW_THEME_ID = "firefox-alpenglow@mozilla.org";

const MAX_THEME_COUNT = 6; // Not exposed from CustomizeMode.jsm

const _defaultImportantThemes = [
    DEFAULT_THEME_ID,
    LIGHT_THEME_ID,
    DARK_THEME_ID,
    ALPENGLOW_THEME_ID,
];  

// delete new link
waitForElement("#customization-lwtheme-link").then(e => {
    e.remove();
});

// add back themes dropdown button
waitForElement("#customization-footer").then(e => {
    let lwthemeButton = MozXULElement.parseXULToFragment(
    `
        <button id="customization-lwtheme-button" data-l10n-id="customize-mode-lwthemes" label="${sb.GetStringFromName("customizeMode.lwthemes")}" class="footer-button" type="menu">
            <panel type="arrow" id="customization-lwtheme-menu"
                orient="vertical"
                onpopupshowing="gCustomizeMode.onThemesMenuShowing(event);"
                position="topcenter bottomleft"
                flip="none"
                role="menu">
                <label id="customization-lwtheme-menu-header" data-l10n-id="customize-mode-lwthemes-my-themes" value="${sb.GetStringFromName("customizeMode.lwthemes.myThemes")}"/>
                <label id="customization-lwtheme-menu-recommended" value="${sb.GetStringFromName("customizeMode.lwthemes.recommended")}" />
                <hbox id="customization-lwtheme-menu-footer">
                    <toolbarbutton class="customization-lwtheme-menu-footeritem"
                        data-l10n-id="customize-mode-lwthemes-menu-manage"
                        tabindex="0"
                        oncommand="gCustomizeMode.openAddonsManagerThemes(event);"
                        label="${sb.GetStringFromName("customizeMode.lwthemes.menuManage")}"/>
                    <toolbarbutton class="customization-lwtheme-menu-footeritem"
                        data-l10n-id="customize-mode-lwthemes-menu-get-more"
                        tabindex="0"
                        oncommand="gCustomizeMode.getMoreThemes(event);"
                        label="${sb.GetStringFromName("customizeMode.lwthemes.menuGetMore")}"/>
                </hbox>
            </panel>
        </button>
    `);

    e.insertBefore(lwthemeButton, e.querySelector("#customization-uidensity-button"));
});

gCustomizeMode.onThemesMenuShowing = async function gCustomMode_onThemesMenuShowing(aEvent) {
    this._clearLWThemesMenu(aEvent.target);

    // function previewTheme(aPreviewThemeEvent) {
    //   LightweightThemeManager.previewTheme(
    //     aPreviewThemeEvent.target.theme.id != DEFAULT_THEME_ID ?
    //     aPreviewThemeEvent.target.theme : null);
    // }
    // 
    // function resetPreview() {
    //   LightweightThemeManager.resetPreview();
    // }

    let onThemeSelected = panel => {
        // This causes us to call _onUIChange when the LWT actually changes,
        // so the restore defaults / undo reset button is updated correctly.
        this._updateLWThemeButtonIcon();
        this._nextThemeChangeUserTriggered = true;
        panel.hidePopup();
    };

    let doc = this.window.document;

    function buildToolbarButton(aTheme) {
      let tbb = doc.createXULElement("toolbarbutton");
      let iconURL = aTheme.iconURL;
    if (aTheme.icons) {
        if (iconURL == aTheme.icons[64]) {
            iconURL = "chrome://echelon/content/firefox-29/customizableui/theme.png";
        }
    }
      tbb.theme = aTheme;
      tbb.setAttribute("label", aTheme.name);
      if (aTheme.id == DEFAULT_THEME_ID) {
        tbb.setAttribute("defaulttheme", "true");
        tbb.setAttribute("image", "chrome://echelon/content/firefox-29/customizableui/theme-switcher-icon.png");
      } else {
        tbb.setAttribute(
            "image",
            iconURL || "chrome://echelon/content/firefox-29/customizableui/theme.png"
            );
      }
      if (aTheme.description)
        tbb.setAttribute("tooltiptext", aTheme.description);
      tbb.setAttribute("tabindex", "0");
      tbb.classList.add("customization-lwtheme-menu-theme");
      let isActive = aTheme.isActive;
      tbb.setAttribute("aria-checked", isActive);
      tbb.setAttribute("role", "menuitemradio");
      if (isActive) {
        tbb.setAttribute("active", "true");
      }
      // tbb.addEventListener("focus", previewTheme);
      // tbb.addEventListener("mouseover", previewTheme);
      // tbb.addEventListener("blur", resetPreview);
      // tbb.addEventListener("mouseout", resetPreview);

      return tbb;
    }

    let themes = [];
    let lwts = await AddonManager.getAddonsByTypes(["theme"]);
    let currentLwt = themes.find(theme => theme.isActive);

    let activeThemeID = currentLwt ? currentLwt.id : DEFAULT_THEME_ID;

    // Move the current theme (if any) and the light/dark themes to the start:
    let importantThemes = _defaultImportantThemes;
    if (currentLwt && !importantThemes.includes(currentLwt.id)) {
      importantThemes.push(currentLwt.id);
    }
    for (let importantTheme of importantThemes) {
      let themeIndex = lwts.findIndex(theme => theme.id == importantTheme);
      if (themeIndex > -1) {
        themes.push(...lwts.splice(themeIndex, 1));
      }
    }
    themes = themes.concat(lwts);
    if (themes.length > MAX_THEME_COUNT)
      themes.length = MAX_THEME_COUNT;

    let footer = doc.getElementById("customization-lwtheme-menu-footer");
    let panel = footer.parentNode;
    let recommendedLabel = doc.getElementById("customization-lwtheme-menu-recommended");
    for (let theme of themes) {
      let button = buildToolbarButton(theme);
      button.addEventListener("command", async () => {
        if ("userDisabled" in button.theme)
          button.theme.userDisabled = false;
        else
            currentLwt = button.theme;
        onThemeSelected(panel);
        await button.theme.enable();
      });
      panel.insertBefore(button, recommendedLabel);
    }

    let lwthemePrefs = Services.prefs.getBranch("lightweightThemes.");
    let recommendedThemes = lwthemePrefs.getStringPref("recommendedThemes");
    recommendedThemes = JSON.parse(recommendedThemes);
    let sb = Services.strings.createBundle("chrome://echelon/locale/properties/lightweightThemes.properties");
    for (let theme of recommendedThemes) {
      try {
        theme.name = sb.GetStringFromName("lightweightThemes." + theme.id + ".name");
        theme.description = sb.GetStringFromName("lightweightThemes." + theme.id + ".description");
      } catch (ex) {
        // If finding strings for this failed, just don't build it. This can
        // happen for users with 'older' recommended themes lists, some of which
        // have since been removed from Firefox.
        continue;
      }
      let button = buildToolbarButton(theme);
      button.addEventListener("command", async () => {
        installTheme(button.theme.id);
        recommendedThemes = recommendedThemes.filter((aTheme) => { return aTheme.id != button.theme.id; });
        lwthemePrefs.setStringPref("recommendedThemes",
                                   JSON.stringify(recommendedThemes));
        onThemeSelected(panel);
      });
      panel.insertBefore(button, footer);
    }
    let hideRecommendedLabel = (footer.previousSibling == recommendedLabel);
    recommendedLabel.hidden = hideRecommendedLabel;
}

gCustomizeMode._clearLWThemesMenu = function gCustomMode_clearThemesMenu(panel) {
    let footer = this.$("customization-lwtheme-menu-footer");
    let recommendedLabel = this.$("customization-lwtheme-menu-recommended");
    for (let element of [footer, recommendedLabel]) {
      while (element.previousSibling &&
             element.previousSibling.localName == "toolbarbutton") {
        element.previousSibling.remove();
      }
    }

    // Workaround for bug 1059934
    panel.removeAttribute("height");
}

gCustomizeMode._updateLWThemeButtonIcon = async function gCustomMode_updateLWThemeButtonIcon() {
    let themes = await AddonManager.getAddonsByTypes(["theme"]);
    let lwthemeButton = document.querySelector("#customization-lwtheme-button");
    let lwthemeIcon = lwthemeButton.querySelector(".button-icon");
    let themeIcon = themes.find(theme => theme.isActive).iconURL;

    if (themeIcon == "resource://default-theme/icon.svg") {
        themeIcon = "chrome://echelon/content/firefox-29/customizableui/theme-switcher-icon.png";
    }

    lwthemeIcon.style.backgroundImage = themes.find(theme => theme.isActive) ?
      "url(" + themeIcon + ")" : "";
}

window.addEventListener(
    "customizationstarting",
    gCustomizeMode._updateLWThemeButtonIcon
);

async function installTheme(id) {
    let extension = ExtensionTestUtils.loadExtension({
        manifest: {
            applications: { gecko: { id } },
            manifest_version: 2,
            name: "Theme " + id,
            description: "wow. such theme.",
            author: "Pixel Pusher",
            version: "1",
            theme: {},
        },
        useAddonManager: "temporary",
    });
    await extension.startup();
    return extension;
}