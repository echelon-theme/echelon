// ==UserScript==
// @name			Echelon :: Context Menu
// @description 	Changes to the content area context menu
// @author			aubymori
// @include			main
// ==/UserScript===

/**
 * This function original had a block that set `where` to "tab" if it was "current".
 * That made the image always open in a new tab, and we don't want that.
 * 
 * This function must be in the global scope.
 */
function ViewImage_viewMedia(e)
{
    let where = whereToOpenLink(e, false, false);
    let referrerInfo = this.contentData.referrerInfo;
    let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
    if (this.onCanvas)
    {
        this._canvasToBlobURL(this.targetIdentifier).then(function(blobURL) {
        openLinkIn(blobURL, where, {
            referrerInfo,
            triggeringPrincipal: systemPrincipal,
        });
        }, console.error);
    }
    else
    {
        urlSecurityCheck(
            this.mediaURL,
            this.principal,
            Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT
        );

        // Default to opening in a new tab.
        openLinkIn(this.mediaURL, where, {
            referrerInfo,
            forceAllowDataURI: true,
            triggeringPrincipal: this.principal,
            triggeringRemoteType: this.remoteType,
            csp: this.csp,
        });
    }
}

{
    var { PrefUtils, waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    /* The bool pref which determines whether to use View Image. */
    const VIEWIMAGE_CONFIGKEY = "Echelon.Behavior.ViewImage";

    /* Our custom command. View Image and View Background Image have the same command now. */
    const VIEWIMAGE_COMMAND = "(ViewImage_viewMedia.bind(gContextMenu))(event);";

    /* Original command, label, and accesskey */
    let original = {
        label: null,
        accesskey: null,
        command: null
    };

    /* Localization string bundle */
    let strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");

    /* The content area menupopup. */
    let popup = null;

    /* The View Image menuitem. */
    let viewImage = null;

    /* Update the menu item. */
    function updateViewImageItem()
    {
        if (!viewImage)
        {
            return;
        }

        let enabled = PrefUtils.tryGetBoolPref(VIEWIMAGE_CONFIGKEY);
        viewImage.label = enabled ? strings.GetStringFromName("view_image_label") : original.label;
        viewImage.accessKey = enabled ? strings.GetStringFromName("view_image_accesskey") : original.accesskey;
        viewImage.setAttribute("oncommand", enabled ? VIEWIMAGE_COMMAND : original.command);
    }

    /* When the View Image item's label has changed,
       most likely a language change */
    function onViewImageLabelChange()
    {
        if (viewImage.label != original.label && viewImage.label != strings.GetStringFromName("view_image_label"))
        {
            original.label = viewImage.label;
            original.accesskey = viewImage.accessKey;
            strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");

            let enabled = PrefUtils.tryGetBoolPref(VIEWIMAGE_CONFIGKEY);
            if (enabled)
            {
                viewImage.label = strings.GetStringFromName("view_image_label");
                viewImage.accessKey = strings.GetStringFromName("view_image_accesskey");
            }

            let viewBGImage = document.getElementById("context-viewbgimage");
            if (viewBGImage)
            {
                viewBGImage.label = strings.GetStringFromName("view_bgimage_label");
                viewImage.accessKey = strings.GetStringFromName("view_bgimage_accesskey");
            }
        }
    }

    function onPopupShowing()
    {
        updateViewImageItem();
        if (gContextMenu)
        {
            let enabled = PrefUtils.tryGetBoolPref(VIEWIMAGE_CONFIGKEY);
            if (enabled)
            {
                let shouldShow = !(gContextMenu.onTextInput || gContextMenu.onLink ||
                    gContextMenu.isContentSelected || gContextMenu.onImage ||
                    gContextMenu.onCanvas || gContextMenu.onVideo || gContextMenu.onAudio);

                let showBgImage = shouldShow
                && !gContextMenu.hasMultipleBGImages
                && !gContextMenu.inSyntheticDoc;

                gContextMenu.showItem("context-viewbgimage", showBgImage);
                gContextMenu.showItem("context-sep-viewbgimage", showBgImage);
                if (!gContextMenu.onTextInput)
                {
                    gContextMenu.showItem("context-sep-redo", false);
                }


                document.getElementById("context-viewbgimage").disabled = !gContextMenu.hasBGImage;

                /* Hide items that should be hidden when you can view BG image */
                if (shouldShow
                && !gContextMenu.hasMultipleBGImages
                && !gContextMenu.inSyntheticDoc
                && gContextMenu.hasBGImage)
                {
                    gContextMenu.showItem("context-viewimage", false);
                    gContextMenu.showItem("context-copyimage", false);
                    gContextMenu.showItem("context-sendimage", false);
                    gContextMenu.showItem("context-sep-setbackground", false);
                }
            }
            else
            {
                gContextMenu.showItem("context-viewbgimage", false);
                gContextMenu.showItem("context-sep-viewbgimage", false);
            }
        }
    }

    /* Initialize View Image. */
    waitForElement("menuitem#context-viewimage").then(e => {
        viewImage = e;
        original.label = e.label;
        original.accesskey = e.accessKey;
        original.command = e.getAttribute("oncommand");

        popup = viewImage.parentNode;
        popup.addEventListener("popupshowing", onPopupShowing);

        let viewBGImage = window.MozXULElement.parseXULToFragment(`
            <menuseparator id="context-sep-viewbgimage"/>
            <menuitem id="context-viewbgimage" label="${strings.GetStringFromName("view_bgimage_label")}" accesskey="${strings.GetStringFromName("view_bgimage_accesskey")}" oncommand="${VIEWIMAGE_COMMAND}" onclick="checkForMiddleClick(this, event);"/>
        `);
        let undo = document.getElementById("context-undo");
        if (undo)
        {
            popup.insertBefore(viewBGImage, undo);
        }

        let observer = new MutationObserver(onViewImageLabelChange);
        observer.observe(e, {
            attributes: true,
            attributeFilter: ["label"]
        });

        /* This will update the item when the bool pref changes. */
        Services.prefs.addObserver(VIEWIMAGE_CONFIGKEY, onPopupShowing);
        onPopupShowing();
    });

    /* Add labels to navigation items so they can look exactly like normal items again */

    function onContextNavMutation(list)
    {
        for (const mut of list)
        {
            if ((mut.type == "attributes"
            || mut.type == "childList")
            && mut.target.nodeName == "menuitem")
            {
                for (const item of mut.target.parentNode.children)
                {
                    if (item.label != item.getAttribute("aria-label"))
                    {
                        item.label = item.getAttribute("aria-label");
                    }
                }
            }
        }
    }

    waitForElement("#context-navigation").then(e => {
        let observer = new MutationObserver(onContextNavMutation);
        observer.observe(
            e,
            {
                attributes: true,
                attributeFilter: ["aria-label", "disabled", "label"],
                childList: true,
                subtree: true
            }
        );
        for (const item of e.children)
        {
            item.label = item.getAttribute("aria-label");
        }
    });
}