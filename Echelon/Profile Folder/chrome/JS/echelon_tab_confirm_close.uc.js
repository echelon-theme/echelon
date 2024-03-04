// ==UserScript==
// @name            Echelon :: Tab Confirm Close
// @description     Restores the old tab close confirmation dialog.
// @author          aubymori
// @include         main
// ==/UserScript==

{
    let { LocaleUtils } = ChromeUtils.importESModule("chrome://modules/content/LocaleUtils.sys.mjs");

    function BG__onQuitRequest(aCancelQuit, aQuitType)
    {
        // If user has already dismissed quit request, then do nothing
        if (aCancelQuit instanceof Ci.nsISupportsPRBool && aCancelQuit.data)
        {
            return;
        }

        // There are several cases where we won't show a dialog here:
        // 1. There is only 1 tab open in 1 window
        // 2. browser.warnOnQuit == false
        // 3. The browser is currently in Private Browsing mode
        // 4. The browser will be restarted.
        // 5. The user has automatic session restore enabled and
        //    browser.sessionstore.warnOnQuit is not set to true.
        // 6. The user doesn't have automatic session restore enabled
        //    and browser.tabs.warnOnClose is not set to true.
        //
        // Otherwise, we will show the "closing multiple tabs" dialog.
        //
        // aQuitType == "lastwindow" is overloaded. "lastwindow" is used to indicate
        // "the last window is closing but we're not quitting (a non-browser window is open)"
        // and also "we're quitting by closing the last window".

        if (aQuitType == "restart" || aQuitType == "os-restart")
        {
            return;
        }

        var windowcount = 0;
        var pagecount = 0;
        for (let win of BrowserWindowTracker.orderedWindows)
        {
            if (win.closed)
            {
                continue;
            }
            windowcount++;
            let tabbrowser = win.gBrowser;
            if (tabbrowser)
            {
                pagecount +=
                    tabbrowser.browsers.length -
                    tabbrowser._numPinnedTabs -
                    tabbrowser._removingTabs.size;
            }
        }

        if (pagecount < 2)
        {
            return;
        }

        if (!aQuitType)
        {
            aQuitType = "quit";
        }

        // browser.warnOnQuit is a hidden global boolean to override all quit prompts
        if (!Services.prefs.getBoolPref("browser.warnOnQuit"))
        {
            return;
        }

        // If we're going to automatically restore the session, only warn if the user asked for that.
        let sessionWillBeRestored =
            Services.prefs.getIntPref("browser.startup.page") == 3 ||
            Services.prefs.getBoolPref("browser.sessionstore.resume_session_once");
        // In the sessionWillBeRestored case, we only check the sessionstore-specific pref:
        if (sessionWillBeRestored)
        {
            if (
                !Services.prefs.getBoolPref("browser.sessionstore.warnOnQuit", false)
            )
            {
                return;
            }
            // Otherwise, we check browser.tabs.warnOnClose
        }
        else if (!Services.prefs.getBoolPref("browser.tabs.warnOnClose"))
        {
            return;
        }

        let win = BrowserWindowTracker.getTopWindow();
        let gTabbrowserBundle = LocaleUtils.createStringBundle("tab_confirm_close");

        let warningMessage;
        // More than 1 window. Compose our own message.
        if (windowcount > 1)
        {
            let tabSubstring = gTabbrowserBundle.GetStringFromName(
                "tabs.closeWarningMultipleWindowsTabSnippet"
            );
            tabSubstring = PluralForm.get(pagecount, tabSubstring).replace(
                /#1/,
                pagecount
            );

            let stringID = sessionWillBeRestored ?
                "tabs.closeWarningMultipleWindowsSessionRestore3" :
                "tabs.closeWarningMultipleWindows2";
            let windowString = gTabbrowserBundle.GetStringFromName(stringID);
            windowString = PluralForm.get(windowcount, windowString).replace(
                /#1/,
                windowcount
            );
            warningMessage = windowString.replace(/%(?:1\$)?S/i, tabSubstring);
        }
        else
        {
            let stringID = sessionWillBeRestored ?
                "tabs.closeWarningMultipleTabsSessionRestore" :
                "tabs.closeWarningMultipleTabs";
            warningMessage = gTabbrowserBundle.GetStringFromName(stringID);
            warningMessage = PluralForm.get(pagecount, warningMessage).replace(
                "#1",
                pagecount
            );
        }

        let warnOnClose = {
            value: true
        };
        let titleId =
            AppConstants.platform == "win" ?
            "tabs.closeTabsAndQuitTitleWin" :
            "tabs.closeTabsAndQuitTitle";
        let flags =
            Services.prompt.BUTTON_TITLE_IS_STRING * Services.prompt.BUTTON_POS_0 +
            Services.prompt.BUTTON_TITLE_CANCEL * Services.prompt.BUTTON_POS_1;
        // Only display the checkbox in the non-sessionrestore case.
        let checkboxLabel = !sessionWillBeRestored ?
            gTabbrowserBundle.GetStringFromName("tabs.closeWarningPrompt") :
            null;

        // buttonPressed will be 0 for closing, 1 for cancel (don't close/quit)
        let buttonPressed = Services.prompt.confirmEx(
            win,
            gTabbrowserBundle.GetStringFromName(titleId),
            warningMessage,
            flags,
            gTabbrowserBundle.GetStringFromName("tabs.closeButtonMultiple"),
            null,
            null,
            checkboxLabel,
            warnOnClose
        );
        // If the user has unticked the box, and has confirmed closing, stop showing
        // the warning.
        if (!sessionWillBeRestored && buttonPressed == 0 && !warnOnClose.value)
        {
            Services.prefs.setBoolPref("browser.tabs.warnOnClose", false);
        }
        aCancelQuit.data = buttonPressed != 0;
    }

    /* First, kick out the `BrowserGlue` observers. These open the new dialog. */
    for (const topic of ["quit-application-requested", "browser-lastwindow-close-requested"])
    {
        for (const observer of Services.obs.enumerateObservers(topic))
        {
            Services.obs.removeObserver(observer, topic);
        }
    }

    /* Now, add our own observer, which opens the old one. */
    window.gTabConfirmClose = {
        observe: function(subject, topic, data)
        {
            switch (topic)
            {
                case "quit-application-requested":
                    BG__onQuitRequest(subject, data);
                    break;
                case "browser-lastwindow-close-requested":
                    if (AppConstants.platform != "macosx")
                    {
                        // The application is not actually quitting, but the last full browser
                        // window is about to be closed.
                        this._onQuitRequest(subject, "lastwindow");
                    }
                    break;
            }
        }
    };

    Services.obs.addObserver(gTabConfirmClose, "quit-application-requested");
    if (AppConstants.platform != "macosx")
    {
        Services.obs.addObserver(gTabConfirmClose, "browser-lastwindow-close-requested");
    }
}