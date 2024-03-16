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
                    this.indicator.setAttribute("progress", "true");
                    this._progressIcon.style.width = this._percentComplete + "%";
                    this._progressCounter.value = String(this._percentComplete);
                }
                else
                {
                    this.indicator.removeAttribute("progress");
                    this._progressIcon.style.removeProperty("width");
                    this._progressCounter.value = "";
                }
            }
        }
    });
    
    Object.defineProperty(DownloadsIndicatorView, "progressCounter", {
        get: function() 
        {
            return (
                this._progressCounter ||
                (this._progressCounter = document.getElementById(
                    "downloads-indicator-counter"
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
        console.log(aType);

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
    
        // Show the notifier before measuring for size/placement. Being hidden by default
        // avoids the interference with scrolling/APZ when the notifier element is
        // tall enough to overlap the tabbrowser element
        notifier.removeAttribute("hidden");

        // the anchor height may vary if font-size is changed or
        // compact/tablet mode is selected so recalculate this each time
        let anchorRect = anchor.getBoundingClientRect();
        let notifierRect = notifier.getBoundingClientRect();
        let topDiff = anchorRect.top - notifierRect.top;
        let leftDiff = anchorRect.left - notifierRect.left;
        let heightDiff = anchorRect.height - notifierRect.height;
        let widthDiff = anchorRect.width - notifierRect.width;
        let translateX = leftDiff + 0.5 * widthDiff + "px";
        let translateY = topDiff + 0.5 * heightDiff + "px";
        notifier.style.transform =
            "translate(" + translateX + ", " + translateY + ")";
        notifier.setAttribute("notification", aType);
        
        anchor.setAttribute("notification", aType);
    
        let animationDuration;
        // This value is determined by the overall duration of animation in CSS.
        animationDuration = aType == "start" ? 760 : 850;
    
        this._currentNotificationType = aType;
    
        setTimeout(() =>
        {
            requestAnimationFrame(() =>
            {
                notifier.hidden = true;
                notifier.removeAttribute("notification");
                notifier.style.transform = "";
                anchor.removeAttribute("notification");
    
                requestAnimationFrame(() =>
                {
                    let nextType = this._nextNotificationType;
                    this._currentNotificationType = null;
                    this._nextNotificationType = null;
                    if (nextType)
                    {
                        this._showNotification(nextType);
                    }
                });
            });
        }, animationDuration);
    };

    waitForElement("#downloads-button > .toolbarbutton-badge-stack").then(e => {
        e.innerHTML = "";
        let downloadsIndicator = MozXULElement.parseXULToFragment(
        `        
        <stack id="downloads-indicator-anchor-echelon" consumeanchor="downloads-button" class="toolbarbutton-icon">
            <vbox id="downloads-indicator-progress-area" align="center">
                <description id="downloads-indicator-counter" value="0s" />
                <hbox id="downloads-indicator-progress">
                    <spacer id="downloads-indicator-progress-bar" class="progress-bar" />
                    <spacer id="downloads-indicator-progress-remainder" class="progress-remainder" flex="1" />
                </hbox>
            </vbox>
            <image id="downloads-indicator-icon-echelon" />
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