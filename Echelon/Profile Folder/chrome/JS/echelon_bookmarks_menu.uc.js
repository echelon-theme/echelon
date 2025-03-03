// ==UserScript==
// @name			Echelon :: Bookmarks Menu
// @description 	Restores the old bookmarks menu button.
// @author			Travis
// @include			main
// ==/UserScript==

{
    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(window);

    waitForElement("#bookmarks-menu-button").then(e => {
        let menupopup = e.querySelector("#BMB_bookmarksPopup");

        e.classList.add("unified");
        e.classList.add("echelon-unified-bookmarks-menu-button");

        e.querySelector(".toolbarbutton-icon").remove();
        e.querySelector(".toolbarbutton-text").remove();

        let bookmarksMenuButton = MozXULElement.parseXULToFragment(
        `
            <toolbarbutton class="box-inherit toolbarbutton-1 toolbarbutton-menubutton-button" label="Bookmarks" flex="1" allowevents="1" tooltiptext="Bookmark this page"></toolbarbutton>
            <dropmarker id="bookmarks-menu-button-dropmarker" type="menu-button" class="toolbarbutton-1 toolbarbutton-menubutton-dropmarker" anonid="dropmarker" label="Bookmarks">
                <image class="dropmarker-icon" />
            </dropmarker>
        `);
        e.append(bookmarksMenuButton);

        e.querySelector(".toolbarbutton-menubutton-button").onclick = function(){BookmarkingUI._echelonBookmarkButton();};

        function dropmarkerAttr() {
            e.querySelector("dropmarker").removeAttribute("open");

            if (e.open == true && StarUI.panel.state == "closed") { 
                e.querySelector("dropmarker").setAttribute("open", "true");
            }
        }

        let observer = new MutationObserver(dropmarkerAttr);
        observer.observe(e, { attributes: true, attributeFilter: ["open"] });

        waitForElement("#bookmarks-menu-button-dropmarker").then(dropmarker => {
            function menupopupPosition() {
                // for some reason i cant fix the positioning of the panel, so were doing it the hacky way
                let button = document.querySelector("#bookmarks-menu-button");
                let getOffset = getComputedStyle(menupopup.shadowRoot.querySelector(".panel-arrowcontent")).margin;
                let offset = parseInt(getOffset.slice(0, -2)); 

                menupopup.style.removeProperty(`margin-right`);

                menupopup.setAttribute("position", "bottomleft topright");
                menupopup.style.marginRight = `-${button.clientWidth + offset}px`;

                let arrowbox = menupopup.shadowRoot.querySelector(".panel-arrowbox");
                arrowbox.setAttribute("pack", "end");
            }

            dropmarker.onclick = function() {
                menupopupPosition();
                e.openMenu(menupopup);
            };
        });
    });

    Object.defineProperty(BookmarkingUI, "anchor", {
        get: function()
        {
            let anchor = null;
            let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
            let action = PageActions.actionForID(PageActions.ACTION_ID_BOOKMARK);

            if (anchor || style >= ECHELON_LAYOUT_AUSTRALIS) {
                anchor = this.button;
            } else {
                anchor = BrowserPageActions.panelAnchorNodeForAction(action);
            }

            return anchor;
        }
    });

    Object.defineProperty(BookmarkingUI, "star", {
        get: function()
        {
            let star = null;
            let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
            
            delete this.button;
            let widgetGroup = CustomizableUI.getWidget(this.BOOKMARK_BUTTON_ID);

            if (star || style >= ECHELON_LAYOUT_AUSTRALIS) {
                star = (this.button = widgetGroup.forWindow(window).node);
            } else {
                star = (this.star = document.getElementById(this.STAR_ID));
            }

            return star;
        }
    });

    Object.defineProperty(BookmarkingUI, "notifier", {
        get: function()
        {
            return (
                this._notifier ||
                (this._notifier = document.getElementById(
                    "bookmarked-notification-anchor"
                ))
            );
        }
    });

    Object.defineProperty(BookmarkingUI, "dropmarkerNotifier", {
        get: function()
        {
            return (
                this._dropmarkerNotifier ||
                (this._dropmarkerNotifier = document.getElementById(
                    "bookmarked-notification-dropmarker-anchor"
                ))
            );
        }
    });

    BookmarkingUI._echelonBookmarkButton = function BUI_echelonBookmarkButton()
    {
        let isBookmarked = this._itemGuids.size > 0;
            
        if (!this._pendingUpdate) {
            if (!isBookmarked) {
                this._showBookmarkedNotification();
            }
        }
        PlacesCommandHook.bookmarkPage();
    }

    BookmarkingUI._showBookmarkedNotification = function BUI_showBookmarkedNotification()
    {
        function getCenteringTransformForRects(rectToPosition, referenceRect) {
            let topDiff = referenceRect.top - rectToPosition.top;
            let leftDiff = referenceRect.left - rectToPosition.left;
            let heightDiff = referenceRect.height - rectToPosition.height;
            let widthDiff = referenceRect.width - rectToPosition.width;
            return [(leftDiff + .5 * widthDiff) + "px", (topDiff + .5 * heightDiff) + "px"];
        }

        if (this._notificationTimeout) {
            clearTimeout(this._notificationTimeout);
        }

        if (this.notifier.style.transform == '') {
            // Get all the relevant nodes and computed style objects
            let widgetGroup = document.getElementById("bookmarks-menu-button");
            let dropmarker = widgetGroup.querySelector("dropmarker");
            let dropmarkerIcon = dropmarker.querySelector(".dropmarker-icon");
            let dropmarkerStyle = getComputedStyle(dropmarkerIcon);

            // Check for RTL and get bounds
            let isRTL = getComputedStyle(this.button).direction == "rtl";
            let buttonRect = this.button.getBoundingClientRect();
            let notifierRect = this.notifier.getBoundingClientRect();
            let dropmarkerRect = dropmarkerIcon.getBoundingClientRect();
            let dropmarkerNotifierRect = this.dropmarkerNotifier.getBoundingClientRect();

            // Compute, but do not set, transform for star icon
            let [translateX, translateY] = getCenteringTransformForRects(notifierRect, buttonRect);
            let starIconTransform = "translate(" + translateX + ", " + translateY + ")";
            if (isRTL) {
                starIconTransform += " scaleX(-1)";
            }

            // Compute, but do not set, transform for dropmarker
            [translateX, translateY] = getCenteringTransformForRects(dropmarkerNotifierRect, dropmarkerRect);
            let dropmarkerTransform = "translate(" + translateX + ", " + translateY + ")";

            // Do all layout invalidation in one go:
            this.notifier.style.transform = starIconTransform;
            this.dropmarkerNotifier.style.transform = dropmarkerTransform;

            let dropmarkerAnimationNode = this.dropmarkerNotifier.firstChild;
            dropmarkerAnimationNode.style.listStyleImage = dropmarkerStyle.listStyleImage;
        }

        let isInOverflowPanel = this.button.getAttribute("overflowedItem") == "true";
        if (!isInOverflowPanel) {
            this.notifier.setAttribute("notification", "finish");
            this.button.setAttribute("notification", "finish");
            this.dropmarkerNotifier.setAttribute("notification", "finish");
        }

        this._notificationTimeout = setTimeout(() => {
            this.notifier.removeAttribute("notification");
            this.dropmarkerNotifier.removeAttribute("notification");
            this.button.removeAttribute("notification");

            this.dropmarkerNotifier.style.transform = '';
            this.notifier.style.transform = '';
        }, 1000);
    };

    let mainPopupSet = document.getElementById("mainPopupSet");
    if (mainPopupSet)
    {
        let bookmarkedAnimationContainer = MozXULElement.parseXULToFragment(
        `
        <hbox id="bookmarked-notification-container" mousethrough="always">
            <vbox id="bookmarked-notification-anchor">
                <vbox id="bookmarked-notification" />
            </vbox>
            <vbox id="bookmarked-notification-dropmarker-anchor">
                <image id="bookmarked-notification-dropmarker-icon" />
            </vbox>
        </hbox>
        `);
        mainPopupSet.append(bookmarkedAnimationContainer);

        waitForElement("#editBookmarkPanel").then(panel => {
            let editBookmarkPanelHeader = panel.querySelector(".panel-header");
            let editBookmarkPanelContent = panel.querySelector("#editBookmarkPanelContent")
            let oldPanelHeader = MozXULElement.parseXULToFragment(
            `
                <box id="editBookmarkPanelHeader" align="center">
                    <vbox align="center">
                        <image id="editBookmarkPanelStarIcon"/>
                    </vbox>
                    <vbox>
                        <label id="editBookmarkPanelTitle" value=""/>
                        <description id="editBookmarkPanelDescription"/>
                        <hbox>
                            <button id="editBookmarkPanelRemoveButton" class="editBookmarkPanelHeaderButton" oncommand="StarUI.removeBookmarkButtonCommand();" accesskey="R" label=""/>
                        </hbox>
                    </vbox>
                </box>
            `);

            if (editBookmarkPanelHeader) {
                editBookmarkPanelHeader.remove();
                panel.querySelector("#editBookmarkHeaderSeparator").remove();
                editBookmarkPanelContent.insertBefore(oldPanelHeader, editBookmarkPanelContent.firstChild);
            }

            let menulists = panel.querySelectorAll("menulist");
            for (const elem of menulists) {
                elem.setAttribute("native", "true");
            }

            waitForElement(".panel-footer #editBookmarkPanelRemoveButton").then(e => {
                let cancelButton = window.MozXULElement.parseXULToFragment(`
                    <button id="editBookmarkPanelCancelButton" class="footer-button" data-l10n-id="bookmark-panel-cancel-button" slot="primary" label="Cancel"></button>
                `);
                e.replaceWith(cancelButton);

                waitForElement(".panel-footer #editBookmarkPanelCancelButton").then(el => {
                    el.onclick = function(){panel.hidePopup()};
                });
            });
        });
    }
}