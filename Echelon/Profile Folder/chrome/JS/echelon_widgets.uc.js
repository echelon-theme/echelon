// ==UserScript==
// @name			Echelon :: Widget Manager
// @description 	Manages the installation of custom CustomizableUI widgets.
// @author			ephemeralViolette
// @include         main
// ==/UserScript==

{

let strings = Services.strings.createBundle("chrome://echelon/locale/properties/custom-widgets.properties");

function str(l10nId, ...extra)
{
    try
    {
        if (arguments.length > 1)
        {
            return strings.formatStringFromName(l10nId, extra);
        }
        else
        {
            return strings.GetStringFromName(l10nId);
        }
    }
    catch (e)
    {
        return "<" + l10nId + ">";
    }
}

class EchelonWidgetManager
{
    static alreadyRan = false;

    static async queueCustomWidgetInstallation()
    {
        if (this.alreadyRan)
        {
            return;
        }

        await new Promise(resolve => {
            let delayedStartupObserver = (aSubject, aTopic, aData) => {
                Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
                resolve();
            };
            Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
        });

        // This was removed "as of 2023", according to a Firefox comment I saw.
        // But we use it in the Australis panel.
        let AddOnsButtonWidget = {
            id: "add-ons-button",
            type: "button",
            viewId: null,

            onCommand()
            {
                document.getElementById("Tools:Addons").click();
            },

            label: str("add_ons_button.label"),
            tooltiptext: str("add_ons_button.tooltiptext"),
            defaultArea: "PanelUI-contents"
        };
        this.createWidget(AddOnsButtonWidget);

        let buttonText = "Echelon Options";
        this.createWidget({
            id: "echelon-button",
            removable: true,
            label: buttonText,
            tooltiptext: "Opens the Echelon Options window",
            onCommand: function() {
                launchEchelonOptions();
            },
            onCreated: function(button) {
                return button;
            },
        });

        buttonText = "Bookmarks";
        this.createWidget({
            id: "bookmarks-button",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            removable: true,
            label: buttonText,
            tooltiptext: "Bookmark this page",
            onCommand: function() {
                let bookmarksSvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
                bookmarksSvc.insertBookmark(3, gBrowser.currentURI, bookmarksSvc.DEFAULT_INDEX, gBrowser.selectedTab._fullLabel);
            },
            onCreated: function(button) {
                return button;
            },
        });

        this.alreadyRan = true;
    }

    static async createWidget(def)
    {
        // I added this while I was chasing down a bug (kept just in case), but it
        // turns out that that bug was actually just Firefox itself and not anything
        // to do with Echelon:
        while (!CustomizableUI.getWidget)
            await new Promise(r => requestAnimationFrame(r));

        if (!CustomizableUI.getWidget(def.id)?.hasOwnProperty("source"))
        {
            CustomizableUI.createWidget(def);
        }
    }
}

EchelonWidgetManager.queueCustomWidgetInstallation();

}