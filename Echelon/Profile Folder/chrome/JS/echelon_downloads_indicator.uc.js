// ==UserScript==
// @name			Echelon :: Downloads Indicator
// @description 	Restores the old downloads indicator
// @author			aubymori
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    Object.defineProperty(DownloadsIndicatorView, "percentComplete", {
        set: function(aValue)
        {
            if (!this._operational)
            {
                return;
            }
        
            if (this._percentComplete !== aValue)
            {
                this._percentComplete = aValue;
                this._refreshAttention();
        
                if (this._percentComplete >= 0)
                {
                    this.indicator.setAttribute("counter", "true");
                    this.indicator.setAttribute("progress", "true");

                    this._progressIcon.style.setProperty("--percent", this._percentComplete+"%");
                    document.getElementById("downloads-indicator-counter-echelon").setAttribute("value", this._percentComplete+"%");
                }
                else
                {
                    this.indicator.removeAttribute("progress");

                    this._progressIcon.setAttribute("value", "0");
                }
            }
        }
    });

    Object.defineProperty(DownloadsIndicatorView, "_progressIcon", {
        get: function()
        {
            return (
                this.__progressIcon ||
                (this.__progressIcon = document.getElementById(
                    "downloads-indicator-progress-bar-echelon"
                ))
            );
        }
    });

    Object.defineProperty(DownloadsIndicatorView, "notifier", {
        get: function()
        {
            return (
                this._notifier ||
                (this._notifier = document.getElementById(
                    "downloads-notification-anchor"
                ))
            );
        }
    });

    DownloadsIndicatorView._showNotification = function _showNotification(aType)
    {
        // No need to show visual notification if the panel is visible.
        if (DownloadsPanel.isPanelShowing)
        {
            return;
        }
    
        let anchor = DownloadsButton._placeholder;
        let widgetGroup = CustomizableUI.getWidget("downloads-button");
        let widget = widgetGroup.forWindow(window);
        if (widgetGroup.areaType == CustomizableUI.TYPE_MENU_PANEL)
        {
            if (anchor && this._isAncestorPanelOpen(anchor))
            {
                // If the containing panel is open, don't do anything, because the
                // notification would appear under the open panel. See
                // https://bugzilla.mozilla.org/show_bug.cgi?id=984023
                return;
            }
    
            // Otherwise, try to use the anchor of the panel:
            anchor = widget.anchor;
        }
        if (!anchor || !isElementVisible(anchor.parentNode))
        {
            // Our container isn't visible, so can't show the animation:
            return;
        }
    
        // The notification element is positioned to show in the same location as
        // the downloads button. It's not in the downloads button itself in order to
        // be able to anchor the notification elsewhere if required, and to ensure
        // the notification isn't clipped by overflow properties of the anchor's
        // container.
        // Note: no notifier animation for download finished in Photon
        let notifier = this.notifier;


        if (notifier.style.transform == '') {
            notifier.removeAttribute("hidden");

            let anchorRect = anchor.getBoundingClientRect();
            let notifierRect = notifier.getBoundingClientRect();
            let topDiff = anchorRect.top - notifierRect.top;
            let leftDiff = anchorRect.left - notifierRect.left;
            let heightDiff = anchorRect.height - notifierRect.height;
            let widthDiff = anchorRect.width - notifierRect.width;
            let translateX = (leftDiff + .5 * widthDiff) + "px";
            let translateY = (topDiff + .5 * heightDiff) + "px";
            notifier.style.transform = "translate(" +  translateX + ", " + translateY + ")";
            notifier.setAttribute("notification", aType);
        }
        anchor.setAttribute("notification", aType);
        this._notificationTimeout = setTimeout(() => {
            notifier.removeAttribute("notification");
            notifier.style.transform = '';
        }, 1000);
    };

    waitForElement("#downloads-button > .toolbarbutton-badge-stack").then(e => {
        e.innerHTML = "";
        let downloadsIndicator = MozXULElement.parseXULToFragment(
        `
        <stack id="downloads-indicator-anchor-echelon" consumeanchor="downloads-button">
            <vbox id="downloads-indicator-progress-area-echelon" pack="center">
                <description id="downloads-indicator-counter-echelon" value="" />
                <progressmeter id="downloads-indicator-progress-echelon">
                    <spacer id="downloads-indicator-progress-bar-echelon" class="progress-bar" />
                    <spacer id="downloads-indicator-progress-remainder-echelon" class="progress-remainder" flex="1" />
                </progressmeter>
            </vbox>
            <image id="downloads-indicator-icon" />
        </stack>
        `);
        e.append(downloadsIndicator);
    });

    let mainPopupSet = document.getElementById("mainPopupSet");
    if (mainPopupSet)
    {
        let downloadAnimationContainer = MozXULElement.parseXULToFragment(
        `
        <hbox id="downloads-animation-container">
            <vbox id="downloads-notification-anchor" hidden="true">
                <vbox id="downloads-indicator-notification"/>
            </vbox>
        </hbox>
        `);
        mainPopupSet.append(downloadAnimationContainer);
    }
}